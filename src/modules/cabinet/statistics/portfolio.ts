/**
 * Portfolio-visibility donut segments — Task 891 (§2.1 row 3, 855 R4). Pure, no I/O.
 *
 * The three segments are disjoint and sum to the owner's whole listing count:
 * - `visible`     — publicly visible now (AGT-02's own `visible` count, by construction: `active`
 *                    status minus the `hidden` ones — the same `active = visible + hidden` identity
 *                    the canonical visibility predicates already guarantee, since `active` is the
 *                    only public-eligible status and `hidden` is its exact "eligible but hidden"
 *                    complement).
 * - `needsAction` — pending, plus active-but-hidden (AGT-01's `hidden`, e.g. expired or no-expiry).
 * - `notVisible`  — inactive, sold, rented, archived, expired.
 */
import type { ListingStatus } from '@/types/database'

export interface PortfolioSegments {
  visible: number
  needsAction: number
  notVisible: number
}

export function portfolioSegments(statusCounts: Record<ListingStatus, number>, hidden: number): PortfolioSegments {
  return {
    visible: statusCounts.active - hidden,
    needsAction: statusCounts.pending + hidden,
    notVisible: statusCounts.inactive + statusCounts.sold + statusCounts.rented + statusCounts.archived + statusCounts.expired,
  }
}
