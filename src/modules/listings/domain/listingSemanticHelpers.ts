/**
 * Listing Semantic Helpers — Shared Listing Domain Infrastructure
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PURPOSE
 * ─────────────────────────────────────────────────────────────────────────────
 * Public boolean API for interpreting listing status in business terms.
 * All logic derives from VISIBILITY_DB_STATUSES in listingSemanticLayer.ts —
 * no status strings are defined or duplicated here.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE POLICY
 * ─────────────────────────────────────────────────────────────────────────────
 * These are the ONLY permitted way to interpret listing status outside the
 * semantic domain infrastructure. This applies to ALL modules:
 *   cabinet · listings · admin · analytics · notifications · search · SEO
 *
 * ALLOWED outside this domain directory:
 *   isListingVisible(status)     → use instead of: status === 'active'
 *   isListingHidden(status)      → use instead of: status === 'pending' || status === 'inactive'
 *   isListingArchived(status)    → use instead of: status === 'archived'
 *   isListingClosed(status)      → use instead of: status === 'sold' || status === 'rented'
 *   getListingVisibilityGroup(s) → maps any status to its business group
 *
 * STILL ALLOWED outside this layer (no refactor required):
 *   display labels:  STATUS_VARIANT = { active: 'success', ... }
 *   badge colors:    { sold: 'bg-status-info' }
 *   icon maps:       { archived: ArchiveIcon }
 */

import type { ListingStatus } from '@/types/database'
import { getListingVisibilityGroup } from './listingSemanticLayer'

export type { ListingVisibilityGroup } from './listingSemanticLayer'
export { getListingVisibilityGroup }

// ── Boolean helpers ───────────────────────────────────────────────────────────

/** Returns true when the listing is publicly visible in search results. */
export function isListingVisible(status: ListingStatus): boolean {
  return getListingVisibilityGroup(status) === 'VISIBLE'
}

/** Returns true when the listing exists but is not in public search (moderation or manual hide). */
export function isListingHidden(status: ListingStatus): boolean {
  return getListingVisibilityGroup(status) === 'HIDDEN'
}

/** Returns true when the listing is an administrative/historical archive record (no market transaction). */
export function isListingArchived(status: ListingStatus): boolean {
  return getListingVisibilityGroup(status) === 'ARCHIVED'
}

/** Returns true when the listing represents a completed market transaction (sold or rented). */
export function isListingClosed(status: ListingStatus): boolean {
  return getListingVisibilityGroup(status) === 'CLOSED'
}

// ── Editability helpers ───────────────────────────────────────────────────────

/**
 * Returns true when the listing status permits content editing.
 *
 * EDITABLE  (returns true):  active (VISIBLE), inactive (HIDDEN), pending (HIDDEN)
 * READ-ONLY (returns false): sold (CLOSED), rented (CLOSED), archived (ARCHIVED)
 *
 * Derives from the semantic layer — no status strings duplicated here.
 */
export function isListingEditableStatus(status: ListingStatus): boolean {
  const group = getListingVisibilityGroup(status)
  return group === 'VISIBLE' || group === 'HIDDEN'
}

/**
 * Returns true when the listing status blocks content editing.
 * Inverse of isListingEditableStatus.
 */
export function isListingReadonlyStatus(status: ListingStatus): boolean {
  return !isListingEditableStatus(status)
}

// ── Post-save routing ─────────────────────────────────────────────────────────

/**
 * Returns the canonical post-save redirect path for an owner after editing.
 *
 * VISIBLE (active): public detail route — owner can see their live listing.
 * All other statuses: owner cabinet — prevents 404 on public-only route for
 * pending/inactive/archived/closed listings.
 */
export function getPostSaveRedirect(status: ListingStatus, slug: string, locale: string): string {
  if (isListingVisible(status)) return `/${locale}/listings/${slug}`
  return `/${locale}/cabinet/listings`
}
