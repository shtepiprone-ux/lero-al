/**
 * Cabinet Listings Query Module
 *
 * Public API for cabinet listing queries.
 * All visibility-to-status resolution is delegated to the shared listing
 * semantic domain infrastructure at src/modules/listings/domain/.
 * This file contains NO DB status strings.
 */

export type {
  ListingVisibilityGroup,
  ListingAttributeFilter,
} from '@/modules/listings/domain'

export {
  VALID_VISIBILITY_GROUPS,
  VALID_ATTRIBUTE_FILTERS,
} from '@/modules/listings/domain'

import {
  resolveListingQueryByVisibility,
  applyAttributeFilter,
  type ListingVisibilityGroup,
  type ListingAttributeFilter,
} from '@/modules/listings/domain'

// ── Select columns ────────────────────────────────────────────────────────────

export const CABINET_LISTING_SELECT =
  'id, public_id, slug, title, price, currency, listing_type, property_type, status, is_premium, views_count, created_at, images:listing_images(url, is_cover, "order")' as const

// ── Query builder ─────────────────────────────────────────────────────────────

/**
 * Applies a visibility group and optional attribute filter to a Supabase cabinet query.
 * Delegates entirely to the shared semantic domain — no status logic here.
 *
 * Visibility and attribute filters are applied independently and can be combined:
 *   VISIBLE + PREMIUM → active + is_premium
 *   ALL    + PREMIUM → is_premium only
 *   HIDDEN + no attr  → inactive | pending
 */
export function buildCabinetListingsQuery<Q>(
  baseQuery: Q,
  visibility: ListingVisibilityGroup,
  attribute?: ListingAttributeFilter,
): Q {
  let q = resolveListingQueryByVisibility(baseQuery, visibility)
  if (attribute) {
    q = applyAttributeFilter(q, attribute)
  }
  return q
}
