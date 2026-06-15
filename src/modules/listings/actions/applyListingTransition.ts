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
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PURITY CONTRACT
 * ─────────────────────────────────────────────────────────────────────────────
 * The transition engine (listingTransitionEngine.ts) remains pure — no Supabase.
 * This file owns ALL Supabase writes for listing.status.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { routing } from '@/i18n/routing'
import {
  resolveTransition,
  canSetStatusPrivileged,
} from '@/modules/listings/domain/listingTransitionEngine'
import { canAdminEditListing } from '@/modules/listings/domain/listingPermissions'
import { createNotification } from '@/modules/notifications/lib/mutations'
import type { ListingTransitionAction } from '@/modules/listings/domain/listingTransitionEngine'
import type { ListingStatus } from '@/types/database'

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
  | { ok: false; reason: 'not_found' | 'invalid_transition' | 'forbidden' | 'db_error' }

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
  const { error } = await db
    .from('listings')
    .update({ status: nextStatus })
    .eq('id', listingId)

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

  // Notify the listing owner about the status change (non-blocking fire-and-forget).
  if (ownerId && ownerId !== actor.userId) {
    createNotification({
      userId: ownerId,
      type: 'listing_status_change',
      title: listingTitle ?? listingId,
      // Store status codes as JSON so the renderer can localize them at display time
      // in the viewer's active locale (not baked at write time). Format: {"from":"X","to":"Y"}.
      body: JSON.stringify({ from: currentStatus, to: nextStatus }),
      link: slug ? `/listings/${slug}` : undefined,
    }).catch(e => console.error('[notifications] listing_status_change notify failed', e))
  }

  // Invalidate the homepage stats counter — any status transition may affect the
  // public active-listing count (approve: +1, deactivate/archive: -1, etc.)
  revalidateTag('site-stats')

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

  return writeListingStatus(listingId, currentStatus, toStatus, actor, db, current.slug ?? null, current.title ?? null, current.user_id ?? null)
}
