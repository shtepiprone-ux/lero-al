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
  | { ok: false; reason: 'forbidden' }

/**
 * Checks edit authorization and returns a typed result.
 *
 * Caller must be the listing owner OR have admin / moderator role.
 *
 * (Task 427) The listing status no longer gates editing for an authorized
 * editor — owner-of-listing or admin/moderator may edit at ANY status. A
 * non-owner/non-staff caller is `forbidden` regardless of status.
 */
export function checkEditPermission(
  userId: string,
  listing: { user_id: string; status: ListingStatus },
  userRole: string | null,
): EditPermissionCheck {
  if (!canUserEditListing(userId, listing.user_id, userRole)) {
    return { ok: false, reason: 'forbidden' }
  }
  return { ok: true }
}

// ── Assertion API ─────────────────────────────────────────────────────────────

export class ListingEditForbiddenError extends Error {
  constructor(public readonly reason: 'forbidden') {
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
