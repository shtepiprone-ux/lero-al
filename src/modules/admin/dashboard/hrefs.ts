/**
 * Every admin-dashboard drill-down target, built in one place — Task 847.
 *
 * Queries go through `URLSearchParams`, never string concatenation. The filtered landings for
 * visibility (857), reports (858) and support (859) are reserved tasks: until they land the
 * links carry their params and the target page ignores them. The hrefs are final either way.
 */
import type { ListingStatus } from '@/types/database'
import type { Adm11SegmentKey } from './types'
import type { AdminRoute } from '@/lib/auth/adminPages'

// Task 988: admin routes without the language slug; the page that renders a link gives it the slug (`adminHref`)
const LISTINGS = '/admin/listings'

function withQuery(path: AdminRoute, params: Array<[string, string]>): AdminRoute {
  const query = new URLSearchParams(params).toString()
  return query ? `${path}?${query}` as AdminRoute : path
}

/** ADM-01 row target — the staff preview of one listing. */
export function listingPreviewHref(id: string): AdminRoute {
  return `${LISTINGS}/${encodeURIComponent(id)}/preview`
}

/** ADM-11 status segments and any `?status=` landing. */
export function listingStatusHref(status: ListingStatus): AdminRoute {
  return withQuery(LISTINGS, [['status', status]])
}

/** ADM-01 card target. */
export function pendingListingsHref(): AdminRoute {
  return listingStatusHref('pending')
}

/** ADM-02 card target. */
export function pendingReportsHref(): AdminRoute {
  return withQuery('/admin/reports', [['status', 'pending']])
}

/** ADM-06 card target. */
export function unassignedSupportHref(): AdminRoute {
  return withQuery('/admin/support', [
    ['assigned', 'unassigned'],
    ['status', 'open,in_progress'],
  ])
}

/** ADM-08 card target (landing reserved as 857). */
export function visibleListingsHref(): AdminRoute {
  return withQuery(LISTINGS, [['visibility', 'visible']])
}

/** ADM-09 total and sub-count targets (existing `/admin/listings` filter). */
export function hiddenEligibleHref(reason?: 'expired' | 'no_expiry'): AdminRoute {
  const params: Array<[string, string]> = [['visibility', 'hidden_eligible']]
  if (reason) params.push(['reason', reason])
  return withQuery(LISTINGS, params)
}

/** ADM-11 segment target: `visible` and `active_hidden` reuse the visibility landings. */
export function adm11SegmentHref(key: Adm11SegmentKey): AdminRoute {
  if (key === 'visible') return visibleListingsHref()
  if (key === 'active_hidden') return hiddenEligibleHref()
  return listingStatusHref(key)
}
