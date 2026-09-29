import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { blockFail, blockOk, type BlockResult } from '@/lib/dashboard/blockResult'
import { listDates, periodUtcBounds, resolvePeriod, tiraneDateOf } from '@/lib/dashboard/period'
import type { ActivityByListingRow } from '@/modules/analytics/activity/types'
import {
  PUBLIC_VISIBLE_STATUSES,
  applyPublicEligibleButHidden,
  applyPublicVisibility,
  isListingPubliclyVisible,
} from '@/modules/listings/lib/visibility'
import type { ListingStatus, ListingType } from '@/types/database'
import type {
  Agt01,
  Agt02,
  Agt10,
  Agt10Row,
  Agt10Table,
  AgentOwnerId,
  AgentStatisticsData,
  AgentStatisticsInput,
} from './types'

/**
 * The agent statistics server data layer — Task 848 (AGT-01, AGT-02, AGT-10 P0 columns), extended by
 * Task 891 with 849's activity aggregate (AGT-10's recorded-views/WhatsApp/last-activity columns and
 * every activity-based sort).
 *
 * One `BlockResult` per block: a failing query fails its own block (`query_failed`) and never reads
 * as `0`. The only identity accepted is the branded `AgentOwnerId` produced by the access gate, and
 * every query is constrained by it. Visibility predicates come from the canonical helpers; every
 * day boundary comes from the period library. Server-only, read-only.
 */

const PAGE_SIZE = 10
/** The expiring window: today plus the next 7 Tirane local days. */
const EXPIRING_DAYS_AHEAD = 7
/** PostgREST returns at most this many rows; a list that reaches it may be truncated. */
const LISTING_ROW_LIMIT = 1000

const LISTING_ROW_COLUMNS = 'id, slug, title, status, expires_at, listing_type, created_at'
const COVER_COLUMNS = 'id, images:listing_images(url, is_cover, "order")'
const ALL_STATUSES = Object.keys(PUBLIC_VISIBLE_STATUSES) as ListingStatus[]

// ── query outcomes ────────────────────────────────────────────────────────────────────────────

interface QueryFailure {
  failed: true
  code: string | null
  cause?: unknown
}
type Outcome<T> = { failed: false; value: T } | QueryFailure

interface DbError {
  code?: string | null
}

/** A head-only count. A missing count with no error is a failure, never 0. */
async function countOf(
  run: () => PromiseLike<{ count: number | null; error: DbError | null }>,
): Promise<Outcome<number>> {
  try {
    const { count, error } = await run()
    if (error) return { failed: true, code: error.code ?? null }
    if (count === null || count === undefined) return { failed: true, code: 'count_missing' }
    return { failed: false, value: count }
  } catch (cause) {
    return { failed: true, code: null, cause }
  }
}

/**
 * A row list. A missing list with no error is a failure, never `[]`; so is a list that reached
 * `limit` rows, because it may have been cut short.
 */
async function rowsOf<T>(
  run: () => PromiseLike<{ data: T[] | null; error: DbError | null }>,
  limit?: number,
): Promise<Outcome<T[]>> {
  try {
    const { data, error } = await run()
    if (error) return { failed: true, code: error.code ?? null }
    if (!data) return { failed: true, code: 'data_missing' }
    if (limit !== undefined && data.length >= limit) return { failed: true, code: 'row_limit_reached' }
    return { failed: false, value: data }
  } catch (cause) {
    return { failed: true, code: null, cause }
  }
}

function unwrap<T>(outcome: Outcome<T>): T {
  if (outcome.failed) throw new Error('unwrap of a failed outcome')
  return outcome.value
}

/** Builds one block from its queries, or fails that block alone if any of them failed. */
function buildBlock<T>(
  block: string,
  outcomes: Outcome<unknown>[],
  make: () => BlockResult<T>,
): BlockResult<T> {
  const failures = outcomes.filter((o): o is QueryFailure => o.failed)
  if (failures.length > 0) {
    for (const f of failures) {
      console.error(`[AgentStatistics] ${block} failed`, { code: f.code, cause: f.cause })
    }
    return blockFail('query_failed')
  }
  return make()
}

// ── day maths (all from the period library) ───────────────────────────────────────────────────

/** UTC bounds `[startUtc, endUtc)` from the start of today to the start of today+8, in Tirane. */
function expiringWindowUtc(now: Date): { startUtc: string; endUtc: string } {
  const today = tiraneDateOf(now)
  // `listDates` is the period library's forward day walk; it reads only `from` and `days`.
  const days = listDates({ from: today, to: today, days: EXPIRING_DAYS_AHEAD + 1 })
  return periodUtcBounds(resolvePeriod({ kind: 'custom', from: days[0], to: days[days.length - 1] }, now))
}

// ── AGT-10 ────────────────────────────────────────────────────────────────────────────────────

type Db = Awaited<ReturnType<typeof createClient>>

interface RawListingRow {
  id: string
  slug: string
  title: string
  status: ListingStatus
  expires_at: string | null
  listing_type: ListingType
  created_at: string
}
interface RawCoverRow {
  id: string
  images: Array<{ url: string; is_cover: boolean | null; order: number | null }> | null
}

/** The first `is_cover` image, else the lowest `order`, else none. */
function coverUrlOf(images: RawCoverRow['images']): string | null {
  if (!images || images.length === 0) return null
  const byOrder = [...images].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
  return (images.find((i) => i.is_cover) ?? byOrder[0]).url
}

/** The activity metric a non-date sort reads, `0` when the listing has no activity row. */
function activityMetricOf(sort: Agt10Table['sort'], activity: ActivityByListingRow | undefined): number {
  if (sort === 'recorded_views') return activity?.recordedViews ?? 0
  if (sort === 'whatsapp_clicks') return activity?.whatsappClicks ?? 0
  return activity?.listingInquirySubmissions ?? 0 // 'form_inquiries'
}

function compareRows(table: Agt10Table, activityById: Map<string, ActivityByListingRow>) {
  const sign = table.direction === 'asc' ? 1 : -1
  return (a: RawListingRow, b: RawListingRow): number => {
    if (table.sort === 'expires_at') {
      // A listing without an expiry sorts last in both directions.
      if (a.expires_at === null && b.expires_at !== null) return 1
      if (a.expires_at !== null && b.expires_at === null) return -1
      if (a.expires_at !== null && b.expires_at !== null && a.expires_at !== b.expires_at) {
        return a.expires_at < b.expires_at ? -sign : sign
      }
    } else if (table.sort === 'created_at') {
      if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -sign : sign
    } else if (table.sort === 'last_activity_date') {
      const aDate = activityById.get(a.id)?.lastActivityDate ?? null
      const bDate = activityById.get(b.id)?.lastActivityDate ?? null
      // A listing with no activity row sorts last in both directions — same rule as a missing expiry.
      if (aDate === null && bDate !== null) return 1
      if (aDate !== null && bDate === null) return -1
      if (aDate !== null && bDate !== null && aDate !== bDate) return aDate < bDate ? -sign : sign
    } else {
      const diff = activityMetricOf(table.sort, activityById.get(a.id)) - activityMetricOf(table.sort, activityById.get(b.id))
      if (diff !== 0) return diff * sign
    }
    // A stable, direction-independent tie-break.
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  }
}

/**
 * The agent's own listings, filtered, sorted and paged. Filtering and paging happen over the owner's
 * light rows so that visibility is decided by the one canonical `isListingPubliclyVisible` rather than
 * a second predicate; only the page's cover images are read afterwards — every activity column (Task
 * 891) merges from the ALREADY-FETCHED whole-owner `activityByListing` read (input, R1), so every
 * activity sort orders the owner's whole matching set before paging with no extra query.
 */
async function readAgt10(db: Db, input: AgentStatisticsInput): Promise<BlockResult<Agt10>> {
  const { ownerId, table, activityByListing } = input

  const [listed, activity] = await Promise.all([
    rowsOf<RawListingRow>(() => {
      let q = db.from('listings').select(LISTING_ROW_COLUMNS).eq('user_id', ownerId)
      if (table.status) q = q.eq('status', table.status)
      if (table.listingType) q = q.eq('listing_type', table.listingType)
      return q.limit(LISTING_ROW_LIMIT)
    }, LISTING_ROW_LIMIT),
    activityByListing,
  ])
  if (listed.failed) return buildBlock<Agt10>('agt10', [listed], () => blockFail('query_failed'))
  if (!activity.ok) {
    console.error('[AgentStatistics] agt10 failed: activityByListing read failed')
    return blockFail('query_failed')
  }
  const activityById = new Map(activity.data.map((row) => [row.listingId, row]))

  const visibilityOf = (row: RawListingRow) => isListingPubliclyVisible(row)
  const matching = listed.value.filter((row) => {
    if (table.visibility === undefined) return true
    return visibilityOf(row).visible === (table.visibility === 'visible')
  })

  const sorted = [...matching].sort(compareRows(table, activityById))
  const total = sorted.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const requested = Number.isFinite(table.page) ? Math.floor(table.page) : 1
  const page = Math.min(Math.max(requested, 1), pageCount)
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (pageRows.length === 0) return blockOk({ rows: [], total, page, pageSize: PAGE_SIZE })
  const pageIds = pageRows.map((r) => r.id)

  const covers = await rowsOf<RawCoverRow>(() => db.from('listings').select(COVER_COLUMNS).eq('user_id', ownerId).in('id', pageIds))

  return buildBlock<Agt10>('agt10', [covers], () => {
    const coverById = new Map(unwrap(covers).map((r) => [r.id, coverUrlOf(r.images)]))
    const rows: Agt10Row[] = pageRows.map((r) => {
      const visibility = visibilityOf(r)
      const rowActivity = activityById.get(r.id)
      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        status: r.status,
        visible: visibility.visible,
        hiddenReason: visibility.reason,
        expiresAt: r.expires_at,
        listingType: r.listing_type,
        createdAt: r.created_at,
        coverUrl: coverById.get(r.id) ?? null,
        formInquiries: rowActivity?.listingInquirySubmissions ?? 0,
        recordedViews: rowActivity?.recordedViews ?? 0,
        whatsappClicks: rowActivity?.whatsappClicks ?? 0,
        lastActivityDate: rowActivity?.lastActivityDate ?? null,
      }
    })
    return blockOk({ rows, total, page, pageSize: PAGE_SIZE })
  })
}

// ── the module ────────────────────────────────────────────────────────────────────────────────

export async function getAgentStatisticsData(input: AgentStatisticsInput): Promise<AgentStatisticsData> {
  const { ownerId, now } = input

  let db: Db
  try {
    db = await createClient()
  } catch (cause) {
    console.error('[AgentStatistics] client failed', { code: null, cause })
    return {
      agt01: blockFail('query_failed'),
      agt02: blockFail('query_failed'),
      agt10: blockFail('query_failed'),
    }
  }

  const ownListings = () => db.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', ownerId)
  const window = expiringWindowUtc(now)

  const [statusOutcomes, visible, hidden, expiring, sale, rent, agt10] = await Promise.all([
    // One count per status; pending / inactive / sold / rented and the donut's `statusCounts` share them.
    Promise.all(ALL_STATUSES.map((status) => countOf(() => ownListings().eq('status', status)))),

    // AGT-02 visible and AGT-01 hidden / expiring — the predicates belong to the visibility helpers.
    countOf(() => applyPublicVisibility(ownListings())),
    countOf(() => applyPublicEligibleButHidden(ownListings())),
    countOf(() =>
      applyPublicVisibility(ownListings()).gte('expires_at', window.startUtc).lt('expires_at', window.endUtc),
    ),

    // AGT-02 optional split, read alongside and used only when something is visible.
    countOf(() => applyPublicVisibility(ownListings()).eq('listing_type', 'sale')),
    countOf(() => applyPublicVisibility(ownListings()).eq('listing_type', 'rent')),

    // AGT-10 P0 columns + Task 891's activity columns/sorts.
    readAgt10(db, input),
  ])

  const statusOutcome = new Map<ListingStatus, Outcome<number>>(
    ALL_STATUSES.map((status, i) => [status, statusOutcomes[i]]),
  )
  const statusCountOf = (status: ListingStatus) => unwrap(statusOutcome.get(status) as Outcome<number>)

  const agt01 = buildBlock<Agt01>(
    'agt01',
    [statusOutcome.get('pending') as Outcome<number>, hidden, expiring],
    () => blockOk({ pending: statusCountOf('pending'), hidden: unwrap(hidden), expiring: unwrap(expiring) }),
  )

  const needsSplit = !visible.failed && visible.value > 0
  const agt02 = buildBlock<Agt02>(
    'agt02',
    [visible, ...statusOutcomes, ...(needsSplit ? [sale, rent] : [])],
    () => {
      const statusCounts = Object.fromEntries(
        ALL_STATUSES.map((status) => [status, statusCountOf(status)]),
      ) as Record<ListingStatus, number>
      return blockOk({
        visible: unwrap(visible),
        pending: statusCounts.pending,
        inactive: statusCounts.inactive,
        sold: statusCounts.sold,
        rented: statusCounts.rented,
        split: needsSplit ? { sale: unwrap(sale), rent: unwrap(rent) } : null,
        statusCounts,
      })
    },
  )

  return { agt01, agt02, agt10 }
}

/**
 * Task 891 (R5): the owner's own listing id/title list, for `rankTopListings`'s title join —
 * independent of AGT-10's table filters, since the top-listings widget is not affected by them.
 */
export async function getOwnListingTitles(ownerId: AgentOwnerId): Promise<BlockResult<{ id: string; title: string }[]>> {
  let db: Db
  try {
    db = await createClient()
  } catch (cause) {
    console.error('[AgentStatistics] getOwnListingTitles client failed', { code: null, cause })
    return blockFail('query_failed')
  }
  const listed = await rowsOf<{ id: string; title: string }>(
    () => db.from('listings').select('id, title').eq('user_id', ownerId).limit(LISTING_ROW_LIMIT),
    LISTING_ROW_LIMIT,
  )
  if (listed.failed) {
    console.error('[AgentStatistics] getOwnListingTitles failed', { code: listed.code, cause: listed.cause })
    return blockFail('query_failed')
  }
  return blockOk(listed.value)
}
