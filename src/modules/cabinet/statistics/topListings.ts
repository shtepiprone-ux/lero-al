/**
 * Top-listings-by-views ranking — Task 891 (§2.1 row 3, D78-9 Q2). Pure, no I/O.
 *
 * Only listings with `recordedViews > 0` are kept — a listing with no recorded views this period is
 * not "top" anything. Ties break by `lastActivityDate` descending (a listing without an activity day
 * in the range sorts last), then by `listingId` for a fully stable order. A row whose `listingId` is
 * not in the owner's current listing list is dropped (a stale/foreign id never renders a title).
 */
import type { ActivityByListingRow } from '@/modules/analytics/activity/types'

export interface OwnListingTitle {
  id: string
  title: string
}

export interface TopListingRow {
  listingId: string
  title: string
  recordedViews: number
}

export function rankTopListings(
  byListing: readonly ActivityByListingRow[],
  listings: readonly OwnListingTitle[],
  limit = 5,
): TopListingRow[] {
  const titleById = new Map(listings.map((l) => [l.id, l.title]))

  const candidates = byListing.filter((row) => row.recordedViews > 0 && titleById.has(row.listingId))

  const sorted = [...candidates].sort((a, b) => {
    if (b.recordedViews !== a.recordedViews) return b.recordedViews - a.recordedViews
    const aDate: string | null = a.lastActivityDate
    const bDate: string | null = b.lastActivityDate
    if (aDate === null && bDate !== null) return 1
    if (aDate !== null && bDate === null) return -1
    if (aDate !== null && bDate !== null && aDate !== bDate) return aDate < bDate ? 1 : -1
    return a.listingId < b.listingId ? -1 : a.listingId > b.listingId ? 1 : 0
  })

  return sorted.slice(0, limit).map((row) => ({
    listingId: row.listingId,
    title: titleById.get(row.listingId)!,
    recordedViews: row.recordedViews,
  }))
}
