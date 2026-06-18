/**
 * Listing Semantic Layer — Shared Listing Domain Infrastructure
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OWNERSHIP
 * ─────────────────────────────────────────────────────────────────────────────
 * This file is NOT cabinet-specific. It is shared listing business policy.
 * It owns the canonical interpretation of listing visibility, moderation state,
 * and marketplace lifecycle across ALL modules:
 *   cabinet · listings · admin · analytics · notifications · search · SEO
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SEMANTIC BOUNDARY
 * ─────────────────────────────────────────────────────────────────────────────
 * DB status strings ('active', 'inactive', etc.) exist ONLY in this file.
 * All other code must use the helper API from listingSemanticHelpers.ts
 * or the type definitions below.
 *
 * FORBIDDEN outside this domain directory:
 *   listing.status === 'active'
 *   listing.status === 'archived'
 *   status === 'sold' || status === 'rented'
 *
 * ALLOWED outside this domain directory:
 *   display maps          — STATUS_VARIANT = { active: 'success', ... }
 *   badge color maps      — { sold: 'bg-status-info', ... }
 *   icon maps             — { archived: ArchiveIcon }
 *   semantic helper calls — isListingClosed(listing.status)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ARCHITECTURE RULES
 * ─────────────────────────────────────────────────────────────────────────────
 *   - NO UI logic
 *   - NO React dependencies
 *   - NO Supabase coupling beyond query builder extension
 *   - PURE domain transformation layer
 */

import type { ListingStatus } from '@/types/database'

// ── Visibility group type ─────────────────────────────────────────────────────
//
// Represents the business visibility state of a listing.
//
// VISIBLE  — publicly accessible; appears in search results
//            DB: active
//
// HIDDEN   — not in public search; visible only to owner + admin
//            DB: pending (under moderation review)
//                inactive (manually hidden by owner)
//
// ARCHIVED — administrative/historical record; no market outcome
//            DB: archived
//
// CLOSED   — completed market transaction (sale or rental)
//            DB: sold, rented
//
// ALL      — no visibility constraint; returns all groups

export type ListingVisibilityGroup =
  | 'VISIBLE'
  | 'HIDDEN'
  | 'ARCHIVED'
  | 'CLOSED'
  | 'ALL'

export const VALID_VISIBILITY_GROUPS: readonly ListingVisibilityGroup[] = [
  'ALL',
  'VISIBLE',
  'HIDDEN',
  'ARCHIVED',
  'CLOSED',
]

// ── Attribute filter type ─────────────────────────────────────────────────────
//
// Orthogonal property attributes — independent of listing visibility state.
// PREMIUM is NOT a visibility concept; it can coexist with any visibility group.

export type ListingAttributeFilter = 'PREMIUM'

export const VALID_ATTRIBUTE_FILTERS: readonly ListingAttributeFilter[] = ['PREMIUM']

// ── Visibility → DB status mapping ───────────────────────────────────────────
//
// This is the ONLY place in the entire codebase where DB status strings are
// mapped to business meaning. All semantic logic derives from this table.
//
// ARCHIVED and CLOSED are intentionally distinct:
//   ARCHIVED = administrative state (no completed transaction)
//   CLOSED   = completed market outcome (sold / rented)
//
// ALL is excluded from this record — it carries no status predicate.

export const VISIBILITY_DB_STATUSES: Record<Exclude<ListingVisibilityGroup, 'ALL'>, ListingStatus[]> = {
  VISIBLE:  ['active'],
  HIDDEN:   ['inactive', 'pending', 'expired'],
  ARCHIVED: ['archived'],
  CLOSED:   ['sold', 'rented'],
}

// ── Query resolvers ───────────────────────────────────────────────────────────

/**
 * Applies a visibility group filter to a Supabase query builder.
 *
 * VISIBLE  → status = 'active'
 * HIDDEN   → status IN ('inactive', 'pending')
 * ARCHIVED → status = 'archived'
 * CLOSED   → status IN ('sold', 'rented')
 * ALL      → no predicate added
 */
export function resolveListingQueryByVisibility<Q>(
  query: Q,
  visibility: ListingVisibilityGroup,
): Q {
  if (visibility === 'ALL') return query

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = query
  const statuses = VISIBILITY_DB_STATUSES[visibility]
  q = statuses.length === 1
    ? q.eq('status', statuses[0])
    : q.in('status', statuses)

  return q as Q
}

/**
 * Applies an orthogonal attribute filter to a Supabase query builder.
 * Called independently from resolveListingQueryByVisibility.
 *
 * PREMIUM → is_premium = true
 */
export function applyAttributeFilter<Q>(
  query: Q,
  attribute: ListingAttributeFilter,
): Q {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = query

  if (attribute === 'PREMIUM') {
    q = q.eq('is_premium', true)
  }

  return q as Q
}

/**
 * Maps a DB listing status to its semantic visibility group.
 * Throws if an unmapped status is encountered — this enforces that every
 * status must have an explicit business meaning in VISIBILITY_DB_STATUSES.
 *
 * Use via the helper API in listingSemanticHelpers.ts, not directly in UI.
 */
export function getListingVisibilityGroup(
  status: ListingStatus,
): Exclude<ListingVisibilityGroup, 'ALL'> {
  for (const group of Object.keys(VISIBILITY_DB_STATUSES) as Exclude<ListingVisibilityGroup, 'ALL'>[]) {
    if (VISIBILITY_DB_STATUSES[group].includes(status)) return group
  }
  throw new Error(`Unmapped listing status: "${status}"`)
}
