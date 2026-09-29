/**
 * Story fixtures for `Patterns/Mantine/AgentStatisticsView` (Task 854, rebuilt by Task 891 around
 * 849's activity aggregate) — built with 848/849's own shapes and `blockOk`/`blockFail` helpers,
 * plus the real `rankTopListings`/`portfolioSegments` pure functions (never a hand-rolled ranked or
 * segmented shape), so a fixture proves the same code path production takes.
 *
 * Listing titles route through `storyT` (docs/storybook-governance.md §14.2 — no raw title
 * literal). There is exactly one agent (the signed-in owner) per fixture, so no person-name proper
 * noun is needed and no new `check:locale-leak` allowlist entry is required.
 *
 * Anchored to the same frozen instant `dashboardPeriod.fixture.ts` uses (`DASHBOARD_PERIOD_NOW`,
 * 2026-09-18T08:00:00Z — yesterday in Europe/Tirane is 2026-09-17), so every `RelativeTime` in a
 * capture is deterministic and the 30-day period fixtures agree with the period control's own Story.
 */
import { storyT } from '@/stories/_storyI18n'
import { blockFail, blockOk, type BlockResult } from '@/lib/dashboard/blockResult'
import { DASHBOARD_PERIOD_NOW } from '@/stories/fixtures/dashboardPeriod.fixture'
import { rankTopListings, type OwnListingTitle, type TopListingRow } from '@/modules/cabinet/statistics/topListings'
import { portfolioSegments, type PortfolioSegments } from '@/modules/cabinet/statistics/portfolio'
import type { AgentStatisticsData, Agt10Row } from '@/modules/cabinet/statistics/types'
import type { ActivityByListingRow, ActivityFreshness, ActivityPoint } from '@/modules/analytics/activity/types'
import type { ListingStatus, ListingType } from '@/types/database'

const ANCHOR = new Date(DASHBOARD_PERIOD_NOW)
const PERIOD_DAYS = 30

function daysAgo(days: number): string {
  return new Date(ANCHOR.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

function daysAgoDate(days: number): string {
  return daysAgo(days).slice(0, 10)
}

function daysAhead(days: number): string {
  return new Date(ANCHOR.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
}

const TITLE_KEYS = [
  'modern_apartment',
  'apartment_long',
  'cozy_studio',
  'grid_0',
  'grid_1',
  'grid_2',
  'grid_3',
  'grid_4',
  'grid_5',
  'grid_6',
  'grid_7',
]

function listingTitle(locale: string, index: number): string {
  return storyT(locale, `storybook.listing.${TITLE_KEYS[index % TITLE_KEYS.length]}`)
}

/**
 * The one canonical activity source for the whole fixture module (review 1, F4b) — AGT-10's rows
 * AND the top-listings ranking both merge from THIS array, exactly as production merges both from
 * the one `activityByListing` read. A listing not in this array (`l5`..`l9` below) has no activity
 * row, so its AGT-10 cells read `0`/`null` — never a value that contradicts the top-listings chart.
 */
export const CANONICAL_BY_LISTING: ActivityByListingRow[] = [
  { listingId: 'l0', recordedViews: 42, whatsappClicks: 5, listingInquirySubmissions: 2, lastActivityDate: daysAgoDate(1) },
  { listingId: 'l1', recordedViews: 30, whatsappClicks: 3, listingInquirySubmissions: 1, lastActivityDate: daysAgoDate(2) },
  { listingId: 'l2', recordedViews: 18, whatsappClicks: 1, listingInquirySubmissions: 0, lastActivityDate: daysAgoDate(3) },
  { listingId: 'l3', recordedViews: 9, whatsappClicks: 0, listingInquirySubmissions: 0, lastActivityDate: daysAgoDate(4) },
  { listingId: 'l4', recordedViews: 4, whatsappClicks: 0, listingInquirySubmissions: 0, lastActivityDate: daysAgoDate(5) },
]

function agt10Row(
  locale: string,
  index: number,
  activityById: Map<string, ActivityByListingRow>,
  overrides: Partial<Agt10Row> = {},
): Agt10Row {
  const activity = activityById.get(`l${index}`)
  return {
    id: `l${index}`,
    slug: `listing-${index}`,
    title: listingTitle(locale, index),
    status: 'active',
    visible: true,
    hiddenReason: null,
    expiresAt: daysAhead(20),
    listingType: index % 2 === 0 ? 'sale' : 'rent',
    createdAt: daysAgo(index + 1),
    coverUrl: index % 3 === 0 ? null : `https://res.cloudinary.com/lero/image/upload/story-fixture-${index}.jpg`,
    formInquiries: activity?.listingInquirySubmissions ?? 0,
    recordedViews: activity?.recordedViews ?? 0,
    whatsappClicks: activity?.whatsappClicks ?? 0,
    lastActivityDate: activity?.lastActivityDate ?? null,
    ...overrides,
  }
}

/** `byListing` defaults to `CANONICAL_BY_LISTING` — pass `[]` for a genuinely activity-free set
 *  (every row's activity cells then read `0`/`null`, matching an empty top-listings/activity
 *  series fixture instead of contradicting it). */
function agt10Rows(locale: string, count: number, byListing: ActivityByListingRow[] = CANONICAL_BY_LISTING): Agt10Row[] {
  const statuses: ListingStatus[] = ['active', 'active', 'pending', 'active', 'inactive', 'active', 'sold', 'active', 'active', 'rented']
  const types: ListingType[] = ['sale', 'rent']
  const activityById = new Map(byListing.map((r) => [r.listingId, r]))
  return Array.from({ length: count }, (_, i) =>
    agt10Row(locale, i, activityById, {
      status: statuses[i % statuses.length],
      listingType: types[i % types.length],
    }),
  )
}

/** Task 891 review 3, R22 — the one status-count source `agentStatisticsAllOk`'s hero AND
 *  `portfolioAllOk`'s donut both read, so `visible = active - hidden` (`portfolio.ts`'s own
 *  documented identity) can never drift between the two independently-constructed fixtures again —
 *  the exact review-4 defect ("the hero and the donut disagree today", visible 12 vs a donut drawing
 *  10). `active: 14` is deliberate: `visible` (12) = `active` (14) − `hidden` (2). */
const AGT02_STATUS_COUNTS: Record<ListingStatus, number> = { active: 14, pending: 2, inactive: 3, sold: 1, rented: 2, archived: 0, expired: 0 }
const AGT01_HIDDEN = 2

/** R7 state 1 — every block ok, a normal mixed portfolio. */
export function agentStatisticsAllOk(locale: string): AgentStatisticsData {
  return {
    agt01: blockOk({ pending: 2, hidden: AGT01_HIDDEN, expiring: 3 }),
    agt02: blockOk({
      visible: AGT02_STATUS_COUNTS.active - AGT01_HIDDEN,
      pending: AGT02_STATUS_COUNTS.pending,
      inactive: AGT02_STATUS_COUNTS.inactive,
      sold: AGT02_STATUS_COUNTS.sold,
      rented: AGT02_STATUS_COUNTS.rented,
      split: { sale: 7, rent: 5 },
      statusCounts: AGT02_STATUS_COUNTS,
    }),
    agt10: blockOk({ rows: agt10Rows(locale, 10), total: 20, page: 1, pageSize: 10 }),
  }
}

/** R7 state 2 — AGT-01's three actions are all genuinely empty (the positive empty text). With
 *  `hidden` zeroed, every active listing is visible (`visible = active - hidden`, R22) — the hero
 *  moves from 12 to `statusCounts.active` (14) instead of silently keeping the stale `hidden: 2`
 *  reading, so this export stays internally consistent too. */
export function agentStatisticsAgt01AllZero(locale: string): AgentStatisticsData {
  const base = agentStatisticsAllOk(locale)
  return {
    ...base,
    agt01: blockOk({ pending: 0, hidden: 0, expiring: 0 }),
    agt02: base.agt02.ok ? blockOk({ ...base.agt02.data, visible: base.agt02.data.statusCounts.active }) : base.agt02,
  }
}

/** R7 state 4 — AGT-10 is genuinely empty: "You have no listings yet" + the Add listing CTA. A new
 *  agent with no portfolio also has nothing to act on or show as visible, so every block is zero. */
export function agentStatisticsAgt10Empty(): AgentStatisticsData {
  return {
    agt01: blockOk({ pending: 0, hidden: 0, expiring: 0 }),
    agt02: blockOk({
      visible: 0,
      pending: 0,
      inactive: 0,
      sold: 0,
      rented: 0,
      split: null,
      statusCounts: { active: 0, pending: 0, inactive: 0, sold: 0, rented: 0, archived: 0, expired: 0 },
    }),
    agt10: blockOk({ rows: [], total: 0, page: 1, pageSize: 10 }),
  }
}

/** R12 (854 review 1, F1) — the agent HAS listings, but the current filter matches none of them:
 *  the filter row stays visible and the pattern's own empty path shows "No listings match these
 *  filters" — never the Add-listing CTA, which is reserved for a genuinely empty portfolio
 *  (`agentStatisticsAgt10Empty` above). */
export function agentStatisticsAgt10FilteredEmpty(locale: string): AgentStatisticsData {
  const base = agentStatisticsAllOk(locale)
  return { ...base, agt10: blockOk({ rows: [], total: 0, page: 1, pageSize: 10 }) }
}

/** R7 state 6 (Task 891 R9 `SortedByViews`) — 25 listings sorted by `views_desc`, page 1 of 3;
 *  `recordedViews` is strictly decreasing across the page (derived from `SORTED_BY_LISTING` below,
 *  never hand-set on the row after the fact) so AC6's cross-page ordering is visible. */
export const SORTED_BY_LISTING: ActivityByListingRow[] = Array.from({ length: 10 }, (_, i) => ({
  listingId: `l${i}`,
  recordedViews: 200 - i * 10,
  whatsappClicks: 10 - i,
  listingInquirySubmissions: i % 3,
  lastActivityDate: daysAgoDate(i + 1),
}))

export function agentStatisticsSortedByViews(locale: string): AgentStatisticsData {
  const base = agentStatisticsAllOk(locale)
  return { ...base, agt10: blockOk({ rows: agt10Rows(locale, 10, SORTED_BY_LISTING), total: 25, page: 1, pageSize: 10 }) }
}

/** Task 891 review 1, F4 — a genuinely activity-free period: AGT-10's rows carry no activity
 *  cells (empty `byListing`), matching `activitySeriesAllZero`/`topListingsAllZero` instead of
 *  contradicting them with the normal fixture's per-row views/clicks/inquiries/last-activity. */
export function agentStatisticsNoActivity(locale: string): AgentStatisticsData {
  const base = agentStatisticsAllOk(locale)
  return { ...base, agt10: blockOk({ rows: agt10Rows(locale, 10, []), total: 20, page: 1, pageSize: 10 }) }
}

// ── Task 891: the activity aggregate (849) — series, freshness, top listings, portfolio ────────

function seriesDates(days: number): string[] {
  return Array.from({ length: days }, (_, i) => new Date(ANCHOR.getTime() - (days - i) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
}

function totalsOf(byListing: ActivityByListingRow[]): { views: number; whatsapp: number; forms: number } {
  return byListing.reduce(
    (acc, row) => ({
      views: acc.views + row.recordedViews,
      whatsapp: acc.whatsapp + row.whatsappClicks,
      forms: acc.forms + row.listingInquirySubmissions,
    }),
    { views: 0, whatsapp: 0, forms: 0 },
  )
}

/** Task 891 review 3, R22 — a realistic 7-day traffic shape (owner: the old even/floor spread "read
 *  as broken" for a small total — only 3/4 and 0/1). Largest-remainder apportionment against a fixed
 *  weekly weight profile: the sum stays EXACTLY `total` (the apportionment method's own guarantee —
 *  `activitySeriesFrom`'s contract is unchanged, only the daily shape is), while the daily values now
 *  actually vary. `i % 7` is the day's ordinal position within the period, not a real weekday — no
 *  wall-clock value. */
const WEEKLY_WEIGHT_PROFILE = [3, 4, 5, 4, 6, 8, 7]

function spread(total: number, days: number): number[] {
  const weights = Array.from({ length: days }, (_, i) => WEEKLY_WEIGHT_PROFILE[i % 7])
  const weightSum = weights.reduce((sum, w) => sum + w, 0)
  const raw = weights.map((w) => (total * w) / weightSum)
  const floors = raw.map(Math.floor)
  const remainder = total - floors.reduce((sum, f) => sum + f, 0)
  const byFraction = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)
  const result = [...floors]
  for (let k = 0; k < remainder; k++) result[byFraction[k].i] += 1
  return result
}

/** Review 2, F7 — the one series generator every KPI/chart fixture uses. Each metric's daily values
 *  sum EXACTLY to that metric's total over `byListing`, so a KPI's period sum can never disagree
 *  with the sum over the owner's own listings (AC19) — the same invariant production holds, since
 *  both come from the one 849 aggregate. Always emits `days` points, even when a total is 0 (honest
 *  zero bars, never a fake non-zero baseline). */
export function activitySeriesFrom(byListing: ActivityByListingRow[], days = PERIOD_DAYS): BlockResult<ActivityPoint[]> {
  const totals = totalsOf(byListing)
  const views = spread(totals.views, days)
  const whatsapp = spread(totals.whatsapp, days)
  const forms = spread(totals.forms, days)
  return blockOk(
    seriesDates(days).map((date, i) => ({
      date,
      recordedViews: views[i],
      whatsappClicks: whatsapp[i],
      listingInquirySubmissions: forms[i],
    })),
  )
}

function scaleByListing(byListing: ActivityByListingRow[], factor: number): ActivityByListingRow[] {
  return byListing.map((row) => ({
    ...row,
    recordedViews: Math.floor(row.recordedViews * factor),
    whatsappClicks: Math.floor(row.whatsappClicks * factor),
    listingInquirySubmissions: Math.floor(row.listingInquirySubmissions * factor),
  }))
}

/** The current period's daily activity — derived from `CANONICAL_BY_LISTING`, the same array AGT-10's
 *  rows and the top-listings bars merge from (review 2, F7: a KPI total can never disagree with the
 *  per-listing totals it is the sum of). */
export function activitySeriesCurrentAllOk(days = PERIOD_DAYS): BlockResult<ActivityPoint[]> {
  return activitySeriesFrom(CANONICAL_BY_LISTING, days)
}

/** The previous period — independent of, and always lower than, `CANONICAL_BY_LISTING`'s totals, so
 *  every KPI shows a positive comparison. */
export function activitySeriesPreviousAllOk(days = PERIOD_DAYS): BlockResult<ActivityPoint[]> {
  return activitySeriesFrom(scaleByListing(CANONICAL_BY_LISTING, 0.6), days)
}

/** Task 891 R9 `SortedByViews` (review 2, F7) — derived from `SORTED_BY_LISTING`, the same array its
 *  AGT-10 rows merge from, so the KPI totals never disagree with that export's per-listing totals
 *  either. */
export function activitySeriesSortedByViews(days = PERIOD_DAYS): BlockResult<ActivityPoint[]> {
  return activitySeriesFrom(SORTED_BY_LISTING, days)
}

/** R9 `NoActivity` — every day in the period is a real, successfully-read zero. */
export function activitySeriesAllZero(days = PERIOD_DAYS): BlockResult<ActivityPoint[]> {
  return blockOk(seriesDates(days).map((date) => ({ date, recordedViews: 0, whatsappClicks: 0, listingInquirySubmissions: 0 })))
}

export function activitySeriesFailed(): BlockResult<ActivityPoint[]> {
  return blockFail('query_failed')
}

export function freshnessFresh(): BlockResult<ActivityFreshness> {
  return blockOk({ lastSuccessAt: daysAgo(0), stale: false })
}

/** R9 `ActivityStale` — the last successful refresh was 2 days ago. */
export function freshnessStale(): BlockResult<ActivityFreshness> {
  return blockOk({ lastSuccessAt: daysAgo(2), stale: true })
}

export function freshnessFailed(): BlockResult<ActivityFreshness> {
  return blockFail('query_failed')
}

function ownListingTitles(locale: string, count: number): OwnListingTitle[] {
  return Array.from({ length: count }, (_, i) => ({ id: `l${i}`, title: listingTitle(locale, i) }))
}

/** Real `ActivityByListingRow`s (the same `CANONICAL_BY_LISTING` AGT-10's rows merge from) fed
 *  through the real `rankTopListings` — a fixture proves the same ranking/join/drop rules
 *  production uses, never a hand-authored ranked shape, and stays consistent with AGT-10's own
 *  views (review 1, F4b). */
export function topListingsAllOk(locale: string): BlockResult<TopListingRow[]> {
  const listings = ownListingTitles(locale, 10)
  return blockOk(rankTopListings(CANONICAL_BY_LISTING, listings))
}

/** Task 891 R9 `SortedByViews` (review 2, F7) — ranks the same `SORTED_BY_LISTING` array that
 *  export's AGT-10 rows merge from, so the top-listings bar for a given listing can never disagree
 *  with that listing's AGT-10 Views cell (the exact review-2 F7(a) contradiction). */
export function topListingsSortedByViews(locale: string): BlockResult<TopListingRow[]> {
  const listings = ownListingTitles(locale, 10)
  return blockOk(rankTopListings(SORTED_BY_LISTING, listings))
}

/** R9 `NoActivity` — no listing recorded a view this period. */
export function topListingsAllZero(): BlockResult<TopListingRow[]> {
  return blockOk([])
}

export function topListingsFailed(): BlockResult<TopListingRow[]> {
  return blockFail('query_failed')
}

/** Real `portfolioSegments`, fed the SAME `AGT02_STATUS_COUNTS`/`AGT01_HIDDEN`
 *  `agentStatisticsAllOk`'s hero reads (R22) — the same derivation `page.tsx` performs from 848's
 *  own data, never a hand-picked segment total, and never a second, independently-drifting copy. */
export function portfolioAllOk(): BlockResult<PortfolioSegments> {
  return blockOk(portfolioSegments(AGT02_STATUS_COUNTS, AGT01_HIDDEN))
}

export function portfolioFailed(): BlockResult<PortfolioSegments> {
  return blockFail('query_failed')
}

/** A brand-new agent with no listings at all — every segment genuinely 0. */
export function portfolioAllZero(): BlockResult<PortfolioSegments> {
  return blockOk(portfolioSegments({ active: 0, pending: 0, inactive: 0, sold: 0, rented: 0, archived: 0, expired: 0 }, 0))
}
