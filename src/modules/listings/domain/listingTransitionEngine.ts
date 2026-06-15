/**
 * Listing Transition Engine — Centralized Status Transition Policy
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for all listing status change decisions.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * FORBIDDEN outside this file (and its consumers):
 *   listing.status = 'sold'               → use resolveTransition(status, 'MARK_AS_SOLD')
 *   db.update({ status: 'active' })       → derive nextStatus from resolveTransition result
 *   scattered if (status === 'pending')   → use isModeratableStatus(status)
 *
 * ALLOWED anywhere:
 *   canTransitionListing(status, action)  → boolean validity check
 *   resolveTransition(status, action)     → typed result with nextStatus
 *   assertCanTransitionListing(...)       → throws on invalid transition
 *   getTransitionActionForStatus(f, t)    → bridge for status-based UIs
 *   isTerminalListingStatus(status)       → sold | rented
 *   isMarketClosedStatus(status)          → sold | rented
 *   isModeratableStatus(status)           → pending
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ARCHITECTURE RULES
 * ─────────────────────────────────────────────────────────────────────────────
 *   - NO UI logic
 *   - NO React dependencies
 *   - NO Supabase coupling
 *   - PURE domain transformation layer
 */

import type { ListingStatus } from '@/types/database'

// ── Transition action vocabulary ──────────────────────────────────────────────
//
// Each action represents a meaningful business event in the listing lifecycle.
// Use these names in code instead of raw status strings.

export type ListingTransitionAction =
  | 'PUBLISH'          // inactive | pending → active (owner or admin activates)
  | 'UNPUBLISH'        // active → inactive (owner or admin hides)
  | 'SEND_TO_REVIEW'   // inactive | active → pending (submit for moderation)
  | 'APPROVE'          // pending → active (moderator accepts the listing)
  | 'REJECT'           // pending → inactive (moderator declines the listing)
  | 'MARK_AS_SOLD'     // active → sold (transaction completed: sale)
  | 'MARK_AS_RENTED'   // active → rented (transaction completed: rental)
  | 'ARCHIVE'          // active | inactive | sold | rented → archived (end of lifecycle)
  | 'RESTORE'          // archived → inactive (admin restores for re-activation)

// ── Canonical transition matrix ───────────────────────────────────────────────
//
// This is the ONLY place where valid status flows are defined.
// If a transition is not in this map, it is forbidden.
//
// Design rationale:
//   pending → APPROVE | REJECT | ARCHIVE
//     Pending listings are under review — only moderation or admin archival is valid.
//
//   active → UNPUBLISH | MARK_AS_SOLD | MARK_AS_RENTED | ARCHIVE | SEND_TO_REVIEW
//     Active listings are live market listings. Owners can close or hide them.
//     SEND_TO_REVIEW is included for future moderation-on-edit workflows.
//
//   inactive → PUBLISH | SEND_TO_REVIEW | ARCHIVE
//     Hidden listings can be re-published or submitted for review.
//
//   sold → ARCHIVE
//     Sale transaction is final. Only administrative archival remains.
//
//   rented → ARCHIVE
//     Rental transaction is final. Only administrative archival remains.
//
//   archived → RESTORE
//     Admin can restore archived listings to inactive for re-evaluation.

export const ALLOWED_LISTING_TRANSITIONS: Record<ListingStatus, readonly ListingTransitionAction[]> = {
  pending:  ['APPROVE', 'REJECT', 'ARCHIVE'],
  active:   ['UNPUBLISH', 'MARK_AS_SOLD', 'MARK_AS_RENTED', 'ARCHIVE', 'SEND_TO_REVIEW'],
  inactive: ['PUBLISH', 'SEND_TO_REVIEW', 'ARCHIVE'],
  sold:     ['ARCHIVE'],
  rented:   ['ARCHIVE'],
  archived: ['RESTORE'],
} as const

// ── Action → next status resolution ──────────────────────────────────────────
//
// Maps each transition action to its deterministic resulting DB status.
// Every action has exactly ONE outcome — no ambiguity.

const ACTION_NEXT_STATUS: Record<ListingTransitionAction, ListingStatus> = {
  PUBLISH:        'active',
  UNPUBLISH:      'inactive',
  SEND_TO_REVIEW: 'pending',
  APPROVE:        'active',
  REJECT:         'inactive',
  MARK_AS_SOLD:   'sold',
  MARK_AS_RENTED: 'rented',
  ARCHIVE:        'archived',
  RESTORE:        'inactive',
} as const

// ── Transition validity API ───────────────────────────────────────────────────

/**
 * Returns true when the given action is valid from the current listing status.
 * Use this for conditional UI rendering and guard checks.
 */
export function canTransitionListing(
  currentStatus: ListingStatus,
  action: ListingTransitionAction,
): boolean {
  return (ALLOWED_LISTING_TRANSITIONS[currentStatus] as readonly ListingTransitionAction[]).includes(action)
}

/**
 * Returns all transition actions available from the current status.
 * Use to build moderation UIs or action menus.
 */
export function getAvailableTransitions(
  currentStatus: ListingStatus,
): readonly ListingTransitionAction[] {
  return ALLOWED_LISTING_TRANSITIONS[currentStatus]
}

// ── Typed transition result ───────────────────────────────────────────────────

export type ListingTransitionResult =
  | { ok: true; nextStatus: ListingStatus }
  | { ok: false; reason: 'invalid_transition' }

/**
 * Validates and resolves a transition action. Returns a typed result.
 * Does NOT perform the DB update — returns the nextStatus for the caller to apply.
 *
 * Always use the returned nextStatus, never compute it independently.
 */
export function resolveTransition(
  currentStatus: ListingStatus,
  action: ListingTransitionAction,
): ListingTransitionResult {
  if (!canTransitionListing(currentStatus, action)) {
    return { ok: false, reason: 'invalid_transition' }
  }
  return { ok: true, nextStatus: ACTION_NEXT_STATUS[action] }
}

// ── Status-bridge helper ──────────────────────────────────────────────────────

/**
 * Finds the transition action that moves from `from` to `to`, if one exists.
 * Returns null when no direct transition between the statuses is defined.
 *
 * Use to bridge status-based UI (e.g., admin status dropdown) to the action engine.
 * Never use this to bypass transition validation — it returns null for invalid moves.
 */
export function getTransitionActionForStatus(
  from: ListingStatus,
  to: ListingStatus,
): ListingTransitionAction | null {
  if (from === to) return null
  const allowed = ALLOWED_LISTING_TRANSITIONS[from]
  for (const action of allowed) {
    if (ACTION_NEXT_STATUS[action] === to) return action
  }
  return null
}

// ── Privileged any-status API (Task 427) ──────────────────────────────────────
//
// Separate authorization path for an authorized human editor (listing owner OR
// admin/moderator): they may move a listing directly to ANY other status,
// bypassing ALLOWED_LISTING_TRANSITIONS. The base matrix above (and the
// semantic helpers derived from it) remain the source of truth for automation
// and moderation flows — this is an additive UI/admin pathway only, gated by
// authorization performed in applyListingTransition.ts (not here).

const ALL_LISTING_STATUSES = Object.keys(ALLOWED_LISTING_TRANSITIONS) as ListingStatus[]

/**
 * Returns every listing status other than `currentStatus` — the full set of
 * direct targets a privileged actor (owner-of-listing or admin/moderator) may
 * select, regardless of the base transition matrix.
 */
export function getPrivilegedTargetStatuses(currentStatus: ListingStatus): ListingStatus[] {
  return ALL_LISTING_STATUSES.filter(status => status !== currentStatus)
}

/**
 * Returns true when a privileged actor may set the listing status directly
 * from `from` to `to` — valid for any two distinct known listing statuses.
 */
export function canSetStatusPrivileged(from: ListingStatus, to: ListingStatus): boolean {
  return from !== to && ALL_LISTING_STATUSES.includes(from) && ALL_LISTING_STATUSES.includes(to)
}

/**
 * Returns the set of selectable target statuses for `currentStatus`.
 * - `privileged: true`  → the full any-status set (getPrivilegedTargetStatuses).
 * - `privileged: false` → the base-matrix-derived set (via getTransitionActionForStatus).
 *
 * Single entry point for UIs deciding which status options to render.
 */
export function getAllowedTargetStatuses(
  currentStatus: ListingStatus,
  { privileged }: { privileged: boolean },
): ListingStatus[] {
  if (privileged) return getPrivilegedTargetStatuses(currentStatus)
  return ALL_LISTING_STATUSES.filter(status => getTransitionActionForStatus(currentStatus, status) !== null)
}

// ── Assertion API ─────────────────────────────────────────────────────────────

export class ListingTransitionError extends Error {
  constructor(
    public readonly currentStatus: ListingStatus,
    public readonly action: ListingTransitionAction,
  ) {
    super(`Transition '${action}' is not allowed from status '${currentStatus}'`)
    this.name = 'ListingTransitionError'
  }
}

/**
 * Throws ListingTransitionError when the transition is not valid.
 * Use in server actions where a thrown error terminates the call cleanly.
 */
export function assertCanTransitionListing(
  currentStatus: ListingStatus,
  action: ListingTransitionAction,
): void {
  if (!canTransitionListing(currentStatus, action)) {
    throw new ListingTransitionError(currentStatus, action)
  }
}

// ── Semantic helpers derived from transition map ──────────────────────────────
//
// These helpers derive their logic EXCLUSIVELY from ALLOWED_LISTING_TRANSITIONS
// and ACTION_NEXT_STATUS. No status strings are hardcoded here.

/**
 * Returns true when the listing status represents a completed market transaction
 * with no path back to active market without administrative intervention.
 *
 * Terminal statuses: sold, rented
 * Derived: all allowed transitions lead only to 'archived' (no market return path).
 */
export function isTerminalListingStatus(status: ListingStatus): boolean {
  const allowed = ALLOWED_LISTING_TRANSITIONS[status]
  return (
    allowed.length > 0 &&
    allowed.every(action => ACTION_NEXT_STATUS[action] === 'archived')
  )
}

/**
 * Returns true when the listing represents a completed market transaction.
 * Equivalent to isTerminalListingStatus: sold and rented both qualify.
 */
export function isMarketClosedStatus(status: ListingStatus): boolean {
  return isTerminalListingStatus(status)
}

/**
 * Returns true when the listing status is awaiting moderator review.
 * Derived: APPROVE action is available (only possible from pending status).
 */
export function isModeratableStatus(status: ListingStatus): boolean {
  return (ALLOWED_LISTING_TRANSITIONS[status] as readonly ListingTransitionAction[]).includes('APPROVE')
}
