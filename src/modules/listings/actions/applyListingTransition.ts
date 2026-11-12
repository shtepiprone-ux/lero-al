/**
 * Listing Transition Mutation Gateway
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE SINGLE WRITE ENTRY POINT for listing.status changes.
 *
 * ALL other code (admin, moderation, cron, scripts, APIs) MUST call through
 * this gateway. Direct db.update({ status }) calls outside this file are
 * forbidden — enforced by ESLint and code review.
 *
 * Responsibilities (in order):
 *   1. Verify caller is authorized to perform status transitions
 *   2. Fetch current listing state from DB
 *   3. Validate transition via the pure transition engine
 *   4. Execute the write — the ONLY permitted DB mutation for listing.status
 *   5. Return a typed result (never throws on expected failures)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TWO PUBLIC FUNCTIONS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * applyListingTransition(listingId, action, actor)
 *   → action-based (primary): caller knows the semantic action to perform.
 *   → Used by: moderation flows, automation, programmatic APIs.
 *
 * applyListingTransitionByStatus(listingId, toStatus, actor)
 *   → status-based, PRIVILEGED any-status bridge: caller knows the desired target status.
 *   → Used by: UI-facing flows where user selects a status (admin dropdown, owner cabinet).
 *   → Authorized when the actor is the listing owner OR admin/moderator (Task 427); the
 *     listing may then move directly to ANY other status (canSetStatusPrivileged) — not
 *     limited to ALLOWED_LISTING_TRANSITIONS.
 *   → EXCEPT publishing (owner decision D8, 2026-10-17): only an administrator / moderator may
 *     set `active`; the owner may set every other status (canOwnerSetStatus), so a listing the
 *     owner wants back goes to `pending` and waits for a check.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PURITY CONTRACT
 * ─────────────────────────────────────────────────────────────────────────────
 * The transition engine (listingTransitionEngine.ts) remains pure — no Supabase.
 * This file owns ALL Supabase writes for listing.status.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Security (Task 923 Revision 7, finding S28): this is NOT a Server Action file. Both functions take the `actor` (user id and ROLE) as an argument and write with the
// service-role client; as `'use server'` exports they were public endpoints, so anyone could call them with `{ role: 'admin' }` and change the status of any listing.
// Only server code that has already established who is calling may import it (the cron job, the admin / cabinet actions and `changeListingStatus.ts`, which reads
// the role from the session); `server-only` makes importing it from a client bundle a build error.
import 'server-only'

import { updateTag, revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { routing } from '@/i18n/routing'
import { PUBLIC_LISTINGS_CACHE_TAG } from '@/modules/listings/lib/cacheTags'
import {
  resolveTransition,
  canSetStatusPrivileged,
  canOwnerSetStatus,
} from '@/modules/listings/domain/listingTransitionEngine'
import { canAdminEditListing } from '@/modules/listings/domain/listingPermissions'
import { createNotification } from '@/modules/notifications/lib/createNotification'
import type { ListingTransitionAction } from '@/modules/listings/domain/listingTransitionEngine'
import type { ListingStatus } from '@/types/database'
import { shouldReStampExpiresAt, computeExpiresAt } from '@/modules/listings/domain/listingConstants'

// ── Actor context ─────────────────────────────────────────────────────────────

/** Identifies who is performing the transition. Used for authorization and future audit logs. */
export interface TransitionActorContext {
  userId: string
  role: string | null
  source?: 'admin_panel' | 'cabinet' | 'api' | 'automation'
}

// ── Result type ───────────────────────────────────────────────────────────────

export type TransitionApplicationResult =
  | { ok: true;  nextStatus: ListingStatus; listingId: string }
  | { ok: false; reason: 'not_found' | 'invalid_transition' | 'forbidden' | 'db_error' | 'conflict' }

// ── Internal Supabase client type ─────────────────────────────────────────────

type DbClient = ReturnType<typeof createAdminClient>

// ── Core execution (private) ──────────────────────────────────────────────────

/**
 * Writes listings.status and applies all side-effects (owner notification,
 * cache invalidation). This is the ONLY place that writes to listings.status
 * in the entire codebase — both public gateways below funnel through it after
 * their own fetch and validation.
 */
async function writeListingStatus(
  listingId: string,
  currentStatus: ListingStatus,
  nextStatus: ListingStatus,
  actor: TransitionActorContext,
  db: DbClient,
  slug: string | null,
  listingTitle: string | null,
  ownerId: string | null,
): Promise<TransitionApplicationResult> {
  const updatePayload: Record<string, unknown> = { status: nextStatus }
  if (shouldReStampExpiresAt(nextStatus)) {
    updatePayload.expires_at = computeExpiresAt()
  }

  // Task 923 R67 (e): the write is a compare-and-set. It matches the listing only while its status is still the one the transition was decided on, and it must
  // change exactly one row. Without the status filter a concurrent change (a moderator's decision, an owner's edit) was overwritten by a transition that had been
  // validated against a status that no longer held; a write that changed nothing answered success. Now no change is `conflict`, and nothing is notified or refreshed.
  const { data: written, error } = await db
    .from('listings')
    .update(updatePayload)
    .eq('id', listingId)
    .eq('status', currentStatus)
    .select('id')

  if (error) {
    console.error('applyListingTransition: DB write failed', {
      error,
      listingId,
      from: currentStatus,
      to: nextStatus,
      actor: actor.source ?? actor.userId,
    })
    return { ok: false, reason: 'db_error' }
  }
  if (written?.length !== 1) {
    console.warn('applyListingTransition: the listing changed since it was read, nothing written', {
      listingId,
      from: currentStatus,
      to: nextStatus,
      actor: actor.source ?? actor.userId,
      rows: written?.length ?? 0,
    })
    return { ok: false, reason: 'conflict' }
  }

  // Notify the listing owner about the status change AFTER the response (Task 923 R71 (d)). A promise nobody awaits can be dropped in serverless code when the
  // response ends; `after()` keeps the function alive until the work is done. Outside a request (a script, a unit test) there is no response to wait for and
  // `after()` throws: the work then starts at once.
  if (ownerId && ownerId !== actor.userId) {
    const notifyOwner = () => createNotification({
      userId: ownerId,
      type: 'listing_status_change',
      title: listingTitle ?? listingId,
      // Store status codes as JSON so the renderer can localize them at display time
      // in the viewer's active locale (not baked at write time). Format: {"from":"X","to":"Y"}.
      body: JSON.stringify({ from: currentStatus, to: nextStatus }),
      link: slug ? `/listings/${slug}` : undefined,
    }).catch(e => console.error('[notifications] listing_status_change notify failed', e))
    // `next/server` is loaded when the work is scheduled, not when this module is: Storybook bundles this module with every component that imports it and cannot run `next/server` in the browser (its import failed the AuthSheet, SaveSearchButton and listing Stories with `__dirname is not defined`).
    try { (await import('next/server')).after(notifyOwner) } catch { void notifyOwner() }
  }

  // Invalidate the homepage stats counter — any status transition may affect the
  // public active-listing count (approve: +1, deactivate/archive: -1, etc.)
  // Next 16: `updateTag` expires the tag at once and works only inside a Server Action; every importer of this gateway is a 'use server' file (src/__tests__/security/cacheTags.test.ts).
  updateTag('site-stats')
  // Task 964 R1-2: a status change decides which listings are public, so the sitemap files and robots.txt expire with it (only here, after the one row was written)
  updateTag(PUBLIC_LISTINGS_CACHE_TAG)

  // Invalidate the public listings index AND the detail page across all locales
  // so status changes (approve, archive, sell) are immediately visible everywhere.
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/listings`, 'page')
    if (slug) {
      revalidatePath(`/${locale}/listings/${slug}`, 'page')
    }
  }

  return { ok: true, nextStatus, listingId }
}

/**
 * Applies an already-validated transition action against a known current status.
 * Validates via the pure transition engine, then delegates the write.
 */
async function executeTransition(
  listingId: string,
  currentStatus: ListingStatus,
  action: ListingTransitionAction,
  actor: TransitionActorContext,
  db: DbClient,
  slug: string | null,
  listingTitle: string | null,
  ownerId: string | null,
): Promise<TransitionApplicationResult> {
  const transition = resolveTransition(currentStatus, action)

  if (!transition.ok) {
    return { ok: false, reason: 'invalid_transition' }
  }

  return writeListingStatus(listingId, currentStatus, transition.nextStatus, actor, db, slug, listingTitle, ownerId)
}

// ── Public gateway — action-based ────────────────────────────────────────────

/**
 * THE MUTATION GATEWAY. Applies a semantic transition action to a listing.
 *
 * Use when the caller knows the intended business action (e.g., APPROVE, ARCHIVE).
 *
 * The optional _db parameter is for testing only — callers must omit it.
 */
export async function applyListingTransition(
  listingId: string,
  action: ListingTransitionAction,
  actor: TransitionActorContext,
  _db?: DbClient,
): Promise<TransitionApplicationResult> {
  if (!canAdminEditListing(actor.role)) {
    return { ok: false, reason: 'forbidden' }
  }

  const db = _db ?? createAdminClient()

  const { data: current } = await db
    .from('listings')
    .select('id, status, slug, title, user_id')
    .eq('id', listingId)
    .single()

  if (!current) return { ok: false, reason: 'not_found' }

  return executeTransition(listingId, current.status as ListingStatus, action, actor, db, current.slug ?? null, current.title ?? null, current.user_id ?? null)
}

// ── Public gateway — status-based bridge ─────────────────────────────────────

/**
 * Status-based bridge variant — THE PRIVILEGED ANY-STATUS ENTRY. Use when the
 * caller (UI) selects a target status rather than a semantic action.
 *
 * Authorization: the caller must be the listing owner (`actor.userId ===
 * listing.user_id`) OR have an admin/moderator role (`canAdminEditListing`).
 * When privileged, the listing may move directly to ANY other status
 * (`canSetStatusPrivileged`) — not limited to the base
 * `ALLOWED_LISTING_TRANSITIONS` matrix. `applyListingTransition` (action-based)
 * remains the entry point for automation/moderation and keeps its unchanged
 * `canAdminEditListing`-only gate.
 *
 * The optional _db parameter is for testing only — callers must omit it.
 */
export async function applyListingTransitionByStatus(
  listingId: string,
  toStatus: ListingStatus,
  actor: TransitionActorContext,
  _db?: DbClient,
): Promise<TransitionApplicationResult> {
  const db = _db ?? createAdminClient()

  const { data: current } = await db
    .from('listings')
    .select('id, status, slug, title, user_id')
    .eq('id', listingId)
    .single()

  if (!current) return { ok: false, reason: 'not_found' }

  const isOwner = current.user_id === actor.userId
  if (!isOwner && !canAdminEditListing(actor.role)) {
    return { ok: false, reason: 'forbidden' }
  }

  const currentStatus = current.status as ListingStatus

  // Same-status is not a real transition — canSetStatusPrivileged(x, x) is
  // false, so this falls through to invalid_transition below.
  if (!canSetStatusPrivileged(currentStatus, toStatus)) {
    return { ok: false, reason: 'invalid_transition' }
  }

  // Owner decision D8 (2026-10-17): publishing for general view is reserved to an administrator / moderator. The owner keeps every other status. `active`
  // is refused from EVERY status (not only from `pending`), otherwise `pending -> inactive -> active` would bypass the check. Nothing is written, re-stamped
  // or notified when this refuses.
  if (!canAdminEditListing(actor.role) && !canOwnerSetStatus(currentStatus, toStatus)) {
    return { ok: false, reason: 'forbidden' }
  }

  return writeListingStatus(listingId, currentStatus, toStatus, actor, db, current.slug ?? null, current.title ?? null, current.user_id ?? null)
}
