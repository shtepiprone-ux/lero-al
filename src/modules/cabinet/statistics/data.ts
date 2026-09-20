import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { blockFail, blockOk, type BlockResult } from '@/lib/dashboard/blockResult'
import {
  listDates,
  periodUtcBounds,
  previousPeriod,
  resolvePeriod,
  tiraneDateOf,
  type Period,
} from '@/lib/dashboard/period'
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
  Agt05,
  Agt10,
  Agt10Row,
  Agt10Table,
  AgentOwnerId,
  AgentStatisticsData,
  AgentStatisticsInput,
} from './types'

/**
 * The agent statistics server data layer — Task 848 (AGT-01, AGT-02, AGT-05, AGT-10 P0 columns).
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
const INQUIRY_ROW_LIMIT = 1000

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

// ── the one service-role read ─────────────────────────────────────────────────────────────────

/** The service-role module is loaded lazily, and only by the one function below. */
let serviceRoleModule: Promise<typeof import('@/lib/supabase/admin')> | undefined

type InquiryRead ={ kind: 'count'; count: number } | { kind: 'per_listing'; counts: Map<string, number> }
type InquiryShape = { kind: 'count' } | { kind: 'per_listing'; listingIds: string[] | null }

/**
 * Reads the agent's OWN form inquiries in one period through the service-role client, and only here.
 *
 * Why service role: no RLS policy for `listing_inquiries` exists in `scripts/*.sql` and the table is
 * read through the service role everywhere else, so whether an owner can read it under RLS is
 * UNKNOWN — and a user-client read that silently returned 0 rows would be a false zero. The read is
 * therefore always constrained by `listing_owner_id = ownerId`, and it selects ids only: no personal
 * column is ever fetched, so nothing beyond counts can leave this function.
 *
 * `count` returns the number of inquiries; `per_listing` returns one grouped read (optionally
 * restricted to `listingIds`) aggregated by listing. The inquiry status never changes a count.
 */
async function readOwnInquiriesViaServiceRole(
  ownerId: AgentOwnerId,
  period: Period,
  shape: InquiryShape,
): Promise<Outcome<InquiryRead>> {
  try {
    const { createAdminClient } = await (serviceRoleModule ??= import('@/lib/supabase/admin'))
    const db = createAdminClient()
    const { startUtc, endUtc } = periodUtcBounds(period)

    if (shape.kind === 'count') {
      const counted = await countOf(() =>
        db
          .from('listing_inquiries')
          .select('id', { count: 'exact', head: true })
          .eq('listing_owner_id', ownerId)
          .gte('created_at', startUtc)
          .lt('created_at', endUtc),
      )
      return counted.failed ? counted : { failed: false, value: { kind: 'count', count: counted.value } }
    }

    const listed = await rowsOf<{ listing_id: string }>(() => {
      const scoped = db
        .from('listing_inquiries')
        .select('listing_id')
        .eq('listing_owner_id', ownerId)
        .gte('created_at', startUtc)
        .lt('created_at', endUtc)
      return (shape.listingIds ? scoped.in('listing_id', shape.listingIds) : scoped).limit(INQUIRY_ROW_LIMIT)
    }, INQUIRY_ROW_LIMIT)
    if (listed.failed) return listed
    const counts = new Map<string, number>()
    for (const row of listed.value) counts.set(row.listing_id, (counts.get(row.listing_id) ?? 0) + 1)
    return { failed: false, value: { kind: 'per_listing', counts } }
  } catch (cause) {
    return { failed: true, code: null, cause }
  }
}

async function countInquiries(ownerId: AgentOwnerId, period: Period): Promise<Outcome<number>> {
  const read = await readOwnInquiriesViaServiceRole(ownerId, period, { kind: 'count' })
  if (read.failed) return read
  return read.value.kind === 'count'
    ? { failed: false, value: read.value.count }
    : { failed: true, code: 'shape_mismatch' }
}

async function inquiriesPerListing(
  ownerId: AgentOwnerId,
  period: Period,
  listingIds: string[] | null,
): Promise<Outcome<Map<string, number>>> {
  const read = await readOwnInquiriesViaServiceRole(ownerId, period, { kind: 'per_listing', listingIds })
  if (read.failed) return read
  return read.value.kind === 'per_listing'
    ? { failed: false, value: read.value.counts }
    : { failed: true, code: 'shape_mismatch' }
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

function compareRows(table: Agt10Table, counts: Map<string, number> | null) {
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
    } else {
      const diff = (counts?.get(a.id) ?? 0) - (counts?.get(b.id) ?? 0)
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
 * a second predicate; only the page's cover images and (unless sorting by inquiries) only the page's
 * inquiry counts are read afterwards.
 */
async function readAgt10(db: Db, input: AgentStatisticsInput): Promise<BlockResult<Agt10>> {
  const { ownerId, period, table } = input

  const listed = await rowsOf<RawListingRow>(() => {
    let q = db.from('listings').select(LISTING_ROW_COLUMNS).eq('user_id', ownerId)
    if (table.status) q = q.eq('status', table.status)
    if (table.listingType) q = q.eq('listing_type', table.listingType)
    return q.limit(LISTING_ROW_LIMIT)
  }, LISTING_ROW_LIMIT)
  if (listed.failed) return buildBlock<Agt10>('agt10', [listed], () => blockFail('query_failed'))

  const visibilityOf = (row: RawListingRow) => isListingPubliclyVisible(row)
  const matching = listed.value.filter((row) => {
    if (table.visibility === undefined) return true
    return visibilityOf(row).visible === (table.visibility === 'visible')
  })

  // Sorting by inquiries needs every matching listing's count; any other sort needs only the page's.
  let counts: Map<string, number> | null = null
  if (table.sort === 'form_inquiries') {
    const all = await inquiriesPerListing(ownerId, period, null)
    if (all.failed) return buildBlock<Agt10>('agt10', [all], () => blockFail('query_failed'))
    counts = all.value
  }

  const sorted = [...matching].sort(compareRows(table, counts))
  const total = sorted.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const requested = Number.isFinite(table.page) ? Math.floor(table.page) : 1
  const page = Math.min(Math.max(requested, 1), pageCount)
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (pageRows.length === 0) return blockOk({ rows: [], total, page, pageSize: PAGE_SIZE })
  const pageIds = pageRows.map((r) => r.id)

  const [pageCounts, covers] = await Promise.all([
    counts ? Promise.resolve<Outcome<Map<string, number>>>({ failed: false, value: counts }) : inquiriesPerListing(ownerId, period, pageIds),
    rowsOf<RawCoverRow>(() => db.from('listings').select(COVER_COLUMNS).eq('user_id', ownerId).in('id', pageIds)),
  ])

  return buildBlock<Agt10>('agt10', [pageCounts, covers], () => {
    const coverById = new Map(unwrap(covers).map((r) => [r.id, coverUrlOf(r.images)]))
    const countById = unwrap(pageCounts)
    const rows: Agt10Row[] = pageRows.map((r) => {
      const visibility = visibilityOf(r)
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
        formInquiries: countById.get(r.id) ?? 0,
      }
    })
    return blockOk({ rows, total, page, pageSize: PAGE_SIZE })
  })
}

// ── the module ────────────────────────────────────────────────────────────────────────────────

export async function getAgentStatisticsData(input: AgentStatisticsInput): Promise<AgentStatisticsData> {
  const { ownerId, now, period } = input

  let db: Db
  try {
    db = await createClient()
  } catch (cause) {
    console.error('[AgentStatistics] client failed', { code: null, cause })
    return {
      agt01: blockFail('query_failed'),
      agt02: blockFail('query_failed'),
      agt05: blockFail('query_failed'),
      agt10: blockFail('query_failed'),
    }
  }

  const ownListings = () => db.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', ownerId)
  const window = expiringWindowUtc(now)

  const [statusOutcomes, visible, hidden, expiring, sale, rent, inquiriesCurrent, inquiriesPrevious, agt10] =
    await Promise.all([
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

      // AGT-05 — the completed period and the previous equal period.
      countInquiries(ownerId, period),
      countInquiries(ownerId, previousPeriod(period)),

      // AGT-10 P0 columns.
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

  const agt05 = buildBlock<Agt05>('agt05', [inquiriesCurrent, inquiriesPrevious], () =>
    blockOk({ current: unwrap(inquiriesCurrent), previous: unwrap(inquiriesPrevious) }),
  )

  return { agt01, agt02, agt05, agt10 }
}
