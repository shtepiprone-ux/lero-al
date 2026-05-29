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
 *   → status-based bridge: caller knows the desired target status.
 *   → Used by: UI-facing flows where user selects a status (admin dropdown).
 *   → Internally maps to action via getTransitionActionForStatus, then delegates.
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
  getTransitionActionForStatus,
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
 * Applies an already-validated transition action against a known current status.
 * Called by both public functions after their own fetch and validation.
 * This is the ONLY place that writes to listings.status in the entire codebase.
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

  const { error } = await db
    .from('listings')
    .update({ status: transition.nextStatus })
    .eq('id', listingId)

  if (error) {
    console.error('applyListingTransition: DB write failed', {
      error,
      listingId,
      action,
      from: currentStatus,
      to: transition.nextStatus,
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
      body: JSON.stringify({ from: currentStatus, to: transition.nextStatus }),
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

  return { ok: true, nextStatus: transition.nextStatus, listingId }
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
 * Status-based bridge variant. Use when the caller selects a target status
 * rather than a semantic action (e.g., admin UI dropdown).
 *
 * Maps toStatus → action internally via getTransitionActionForStatus,
 * then delegates to the core transition pathway. Single DB fetch.
 *
 * The optional _db parameter is for testing only — callers must omit it.
 */
export async function applyListingTransitionByStatus(
  listingId: string,
  toStatus: ListingStatus,
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

  // Same-status: no-op success (UI may emit the current status as "change")
  if (current.status === toStatus) {
    return { ok: true, nextStatus: toStatus, listingId }
  }

  const action = getTransitionActionForStatus(current.status as ListingStatus, toStatus)
  if (!action) {
    return { ok: false, reason: 'invalid_transition' }
  }

  return executeTransition(listingId, current.status as ListingStatus, action, actor, db, current.slug ?? null, current.title ?? null, current.user_id ?? null)
}
