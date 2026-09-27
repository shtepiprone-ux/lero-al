/**
 * Story fixtures for `Patterns/Mantine/AdminDashboardView` (Task 853) — built with 847's own
 * `AdminDashboardData` shape and `blockOk`/`blockFail` helpers, never a hand-rolled shape. The
 * anchor matches the Storybook preview's frozen clock (`.storybook/preview-head.html`, Task 698,
 * D25: `new Date()` resolves to `2026-07-30T00:00:00.000Z` inside the preview iframe), so every
 * `RelativeTime` renders deterministically in a capture.
 *
 * Listing titles route through `storyT` (docs/storybook-governance.md §14.2 — no raw title
 * literal). Person names and the city reuse `scripts/check-locale-leak.mjs`'s own global
 * proper-noun allowlist (`Arben Krasniqi`, `Ana Koci`, `Blerim Hoxha`, `Flutura Lleshi`, `Elbasan`)
 * — real Albanian names/places that are never translated, so no per-story leak entry is needed.
 */
import { storyT } from '@/stories/_storyI18n'
import { blockFail, blockOk } from '@/lib/dashboard/blockResult'
import type {
  AdminDashboardData,
  Adm01Row,
  Adm02Row,
  Adm06Row,
  LocationRequestRow,
  RecentListingRow,
} from '@/modules/admin/dashboard/types'

export const ADMIN_DASHBOARD_FIXTURE_ANCHOR = new Date('2026-07-30T00:00:00.000Z')

function hoursAgo(hours: number): string {
  return new Date(ADMIN_DASHBOARD_FIXTURE_ANCHOR.getTime() - hours * 60 * 60 * 1000).toISOString()
}

function adm01Rows(locale: string): Adm01Row[] {
  return [
    { id: 'l1', title: storyT(locale, 'storybook.listing.modern_apartment'), slug: 'modern-apartment', createdAt: hoursAgo(2), authorName: 'Ana Koci' },
    { id: 'l2', title: storyT(locale, 'storybook.listing.cozy_studio'), slug: 'cozy-studio', createdAt: hoursAgo(6), authorName: 'Arben Krasniqi' },
    { id: 'l3', title: storyT(locale, 'storybook.listing.apartment_long'), slug: 'apartment-long', createdAt: hoursAgo(20), authorName: 'Blerim Hoxha' },
  ]
}

function adm02Rows(locale: string): Adm02Row[] {
  return [
    { id: 'r1', reason: 'spam', listingTitle: storyT(locale, 'storybook.listing.cozy_studio'), createdAt: hoursAgo(3), status: 'pending' },
    { id: 'r2', reason: 'duplicate', listingTitle: storyT(locale, 'storybook.listing.modern_apartment'), createdAt: hoursAgo(9), status: 'pending' },
  ]
}

const ADM06_ROWS: Adm06Row[] = [
  { id: 't1', ticketType: 'support', status: 'open', createdAt: hoursAgo(1) },
  { id: 't2', ticketType: 'user_complaint', status: 'in_progress', createdAt: hoursAgo(15) },
]

function recentListings(locale: string): RecentListingRow[] {
  return [
    { id: 'l1', slug: 'modern-apartment', title: storyT(locale, 'storybook.listing.modern_apartment'), status: 'active', isPremium: true, price: 85000, currency: 'EUR', createdAt: hoursAgo(2), ownerName: 'Ana Koci' },
    { id: 'l2', slug: 'cozy-studio', title: storyT(locale, 'storybook.listing.cozy_studio'), status: 'pending', isPremium: false, price: 45000, currency: 'EUR', createdAt: hoursAgo(6), ownerName: 'Arben Krasniqi' },
    { id: 'l3', slug: 'apartment-long', title: storyT(locale, 'storybook.listing.apartment_long'), status: 'sold', isPremium: false, price: 210000, currency: 'EUR', createdAt: hoursAgo(30), ownerName: 'Blerim Hoxha' },
  ]
}

const LOCATION_REQUEST_ROWS: LocationRequestRow[] = [{ id: 'u1', displayName: 'Flutura Lleshi', city: 'Elbasan', region: null }]

export function adminDashboardAllOk(locale: string): AdminDashboardData {
  return {
    refreshedAt: hoursAgo(0),
    adm01: blockOk({ count: 12, rows: adm01Rows(locale) }),
    adm02: blockOk({ pending: 3, reviewed: 2, rows: adm02Rows(locale) }),
    adm06: blockOk({ unassigned: 4, inProgressAnomaly: 1, rows: ADM06_ROWS }),
    adm08: blockOk({ visible: 900 }),
    adm09: blockOk({ total: 40, expired: 25, noExpiry: 15 }),
    adm11: blockOk({
      segments: [
        { key: 'pending', count: 12 },
        { key: 'visible', count: 900 },
        { key: 'active_hidden', count: 40 },
        { key: 'inactive', count: 60 },
        { key: 'sold', count: 30 },
        { key: 'rented', count: 20 },
        { key: 'archived', count: 15 },
        { key: 'expired', count: 25 },
      ],
      total: 1102,
    }),
    recentListings: blockOk(recentListings(locale)),
    locationRequests: blockOk({ count: 1, rows: LOCATION_REQUEST_ROWS }),
  }
}

/** R7 state 2 — the ADM-02 query fails; every other block still renders data. */
export function adminDashboardAdm02Error(locale: string): AdminDashboardData {
  return { ...adminDashboardAllOk(locale), adm02: blockFail('query_failed') }
}

/** R7 state 3 — every queue (ADM-01/02/06) is genuinely empty. */
export function adminDashboardAllQueuesZero(locale: string): AdminDashboardData {
  return {
    ...adminDashboardAllOk(locale),
    adm01: blockOk({ count: 0, rows: [] }),
    adm02: blockOk({ pending: 0, reviewed: 0, rows: [] }),
    adm06: blockOk({ unassigned: 0, inProgressAnomaly: 0, rows: [] }),
  }
}

/** R7 state 4 — ADM-09's visibility-check breakdown is all zero (positive zero state). */
export function adminDashboardAdm09Zero(locale: string): AdminDashboardData {
  return { ...adminDashboardAllOk(locale), adm09: blockOk({ total: 0, expired: 0, noExpiry: 0 }) }
}

/** R7 state 5 — no location requests: the row-3 card does not render. */
export function adminDashboardNoLocationRequests(locale: string): AdminDashboardData {
  return { ...adminDashboardAllOk(locale), locationRequests: blockOk({ count: 0, rows: [] }) }
}
