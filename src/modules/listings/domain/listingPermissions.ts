/**
 * Listing Permissions — centralized edit authorization policy.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for all listing edit authorization decisions.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * FORBIDDEN outside this file:
 *   listing.user_id === userId           (use canUserEditListing)
 *   role === 'admin' || role === 'mod'   (use canAdminEditListing)
 *   status === 'sold' || ...             (use isListingEditableStatus)
 *
 * ALLOWED anywhere:
 *   checkEditPermission(...)             → returns typed result
 *   assertCanEditListing(...)            → throws ListingEditForbiddenError
 *   canUserEditListing(...)              → boolean ownership/role check
 *   canAdminEditListing(...)             → boolean admin-only check
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * NO UI logic. NO React dependencies. NO Supabase coupling. Pure domain.
 */

import type { ListingStatus } from '@/types/database'
import { isListingEditableStatus } from './listingSemanticHelpers'

// ── Ownership / role checks ───────────────────────────────────────────────────

/**
 * Returns true when userId is the listing owner, or has admin/moderator role.
 * This is the canonical ownership + role check — use instead of direct comparisons.
 */
export function canUserEditListing(
  userId: string,
  listingUserId: string,
  userRole: string | null,
): boolean {
  if (userId === listingUserId) return true
  return userRole === 'admin' || userRole === 'moderator'
}

/**
 * Returns true when the role alone permits editing any listing (admin bypass).
 * Does NOT check status — call isListingEditableStatus separately when needed.
 */
export function canAdminEditListing(userRole: string | null): boolean {
  return userRole === 'admin' || userRole === 'moderator'
}

// ── Composite permission check ────────────────────────────────────────────────

export type EditPermissionCheck =
  | { ok: true }
  | { ok: false; reason: 'not_editable' | 'forbidden' }

/**
 * Checks all editability preconditions and returns a typed result.
 *
 * Checks in order:
 *   1. Listing status must permit editing (not sold / rented / archived).
 *      This applies to everyone including admin — change the status first.
 *   2. Caller must be the listing owner OR have admin / moderator role.
 */
export function checkEditPermission(
  userId: string,
  listing: { user_id: string; status: ListingStatus },
  userRole: string | null,
): EditPermissionCheck {
  if (!isListingEditableStatus(listing.status)) {
    return { ok: false, reason: 'not_editable' }
  }
  if (!canUserEditListing(userId, listing.user_id, userRole)) {
    return { ok: false, reason: 'forbidden' }
  }
  return { ok: true }
}

// ── Assertion API ─────────────────────────────────────────────────────────────

export class ListingEditForbiddenError extends Error {
  constructor(public readonly reason: 'not_editable' | 'forbidden') {
    super(`Listing edit forbidden: ${reason}`)
    this.name = 'ListingEditForbiddenError'
  }
}

/**
 * Throws ListingEditForbiddenError when edit is not permitted.
 * Use in server contexts where a thrown error terminates the call cleanly.
 * For redirect-based SSR protection, use checkEditPermission directly.
 */
export function assertCanEditListing(
  userId: string,
  listing: { user_id: string; status: ListingStatus },
  userRole: string | null,
): void {
  const check = checkEditPermission(userId, listing, userRole)
  if (!check.ok) throw new ListingEditForbiddenError(check.reason)
}
