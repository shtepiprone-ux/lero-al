import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { blockFail, blockOk, type BlockResult } from '@/lib/dashboard/blockResult'
import { applyPublicEligibleButHidden, applyPublicVisibility } from '@/modules/listings/lib/visibility'
import type { ListingCurrency, ListingStatus, ReportStatus, TicketStatus } from '@/types/database'
import type {
  Adm01,
  Adm02,
  Adm06,
  Adm08,
  Adm09,
  Adm11,
  AdminDashboardData,
  LocationRequests,
  RecentListingRow,
} from './types'

/**
 * The admin dashboard's server data layer — Task 847.
 *
 * One `BlockResult` per block: a failing query fails its own block (`query_failed`) and never
 * reads as `0`. Every count and list is fetched in parallel with explicit columns. ADM-08/09/11
 * get their predicate from the canonical visibility helpers and write none of it here.
 * Server-only, service-role, read-only; the `/admin` layout gate is unchanged.
 */

const EMPTY_NAME = '—'
const QUEUE_LIMIT = 5
const RECENT_LIMIT = 8
const OPEN_TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress']

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

/** A row list. A missing list with no error is a failure, never `[]`. */
async function rowsOf<T>(
  run: () => PromiseLike<{ data: T[] | null; count?: number | null; error: DbError | null }>,
): Promise<Outcome<{ rows: T[]; count: number | null }>> {
  try {
    const { data, count, error } = await run()
    if (error) return { failed: true, code: error.code ?? null }
    if (!data) return { failed: true, code: 'data_missing' }
    return { failed: false, value: { rows: data, count: count ?? null } }
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
      console.error(`[AdminDashboard] ${block} failed`, { code: f.code, cause: f.cause })
    }
    return blockFail('query_failed')
  }
  return make()
}

// ── row mapping ───────────────────────────────────────────────────────────────────────────────

interface NameParts {
  name: string | null
  last_name: string | null
}

/** A joined relation arrives as an object or a one-element array depending on the FK shape. */
function first<T>(rel: T | T[] | null | undefined): T | null {
  return (Array.isArray(rel) ? rel[0] : rel) ?? null
}

function displayName(parts: NameParts | null): string {
  const joined = [parts?.name, parts?.last_name]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(' ')
  return joined || EMPTY_NAME
}

interface RawAdm01Row {
  id: string
  title: string
  slug: string
  created_at: string
  owner: NameParts | NameParts[] | null
}
interface RawAdm02Row {
  id: string
  reason: string
  status: ReportStatus
  created_at: string
  listing: { title: string } | { title: string }[] | null
}
interface RawAdm06Row {
  id: string
  ticket_type: 'support' | 'user_complaint'
  status: TicketStatus
  created_at: string
}
interface RawRecentRow {
  id: string
  slug: string
  title: string
  status: ListingStatus
  is_premium: boolean
  price: number
  currency: ListingCurrency
  created_at: string
  owner: NameParts | NameParts[] | null
}
interface RawLocationRequestRow extends NameParts {
  id: string
  location_request: { city: string; region?: string } | null
}

// ── the module ────────────────────────────────────────────────────────────────────────────────

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const refreshedAt = new Date().toISOString()
  const db = createAdminClient()

  const listingCount = () => db.from('listings').select('id', { count: 'exact', head: true })
  const statusCount = (status: ListingStatus) => countOf(() => listingCount().eq('status', status))

  const [
    pendingCount,
    pendingRows,
    reportsPending,
    reportsReviewed,
    reportsRows,
    ticketsQueue,
    ticketsAnomaly,
    ticketsRows,
    visibleCount,
    hiddenTotal,
    hiddenExpired,
    hiddenNoExpiry,
    rawActiveCount,
    inactiveCount,
    soldCount,
    rentedCount,
    archivedCount,
    expiredCount,
    recent,
    locationRequests,
  ] = await Promise.all([
    // ADM-01 — pending listings: the count is shared with the ADM-11 `pending` segment.
    statusCount('pending'),
    rowsOf<RawAdm01Row>(() =>
      db
        .from('listings')
        .select('id, title, slug, created_at, owner:users!listings_user_id_fkey(name, last_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(QUEUE_LIMIT),
    ),

    // ADM-02 — `reviewed` is its own query and is never summed into `pending`.
    countOf(() => db.from('listing_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
    countOf(() => db.from('listing_reports').select('id', { count: 'exact', head: true }).eq('status', 'reviewed')),
    rowsOf<RawAdm02Row>(() =>
      db
        .from('listing_reports')
        .select('id, reason, status, created_at, listing:listings!listing_reports_listing_id_fkey(title)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(QUEUE_LIMIT),
    ),

    // ADM-06 — unassigned queue; an in-progress ticket with no assignee is a data anomaly, counted apart.
    countOf(() =>
      db
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .in('status', OPEN_TICKET_STATUSES)
        .is('assigned_to', null),
    ),
    countOf(() =>
      db
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'in_progress')
        .is('assigned_to', null),
    ),
    rowsOf<RawAdm06Row>(() =>
      db
        .from('support_tickets')
        .select('id, ticket_type, status, created_at')
        .in('status', OPEN_TICKET_STATUSES)
        .is('assigned_to', null)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(QUEUE_LIMIT),
    ),

    // ADM-08 / ADM-09 — the predicates belong to the visibility helpers. The visible count is
    // shared with the ADM-11 `visible` segment, the hidden total with `active_hidden`.
    countOf(() => applyPublicVisibility(listingCount())),
    countOf(() => applyPublicEligibleButHidden(listingCount())),
    countOf(() => applyPublicEligibleButHidden(listingCount(), { reason: 'expired' })),
    countOf(() => applyPublicEligibleButHidden(listingCount(), { reason: 'no_expiry' })),

    // ADM-11 consistency check ONLY (R3): the raw active count must equal visible + hidden-but-eligible.
    // It is never displayed and never becomes a segment.
    countOf(() => listingCount().eq('status', 'active')),

    // ADM-11 — the remaining status segments.
    statusCount('inactive'),
    statusCount('sold'),
    statusCount('rented'),
    statusCount('archived'),
    statusCount('expired'),

    // Newest listings — context only.
    rowsOf<RawRecentRow>(() =>
      db
        .from('listings')
        .select('id, slug, title, status, is_premium, price, currency, created_at, owner:users!listings_user_id_fkey(name, last_name)')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(RECENT_LIMIT),
    ),

    // Location requests — the staff queue the page shows today, preserved.
    rowsOf<RawLocationRequestRow>(() =>
      db
        .from('users')
        .select('id, name, last_name, location_request', { count: 'exact' })
        .not('location_request', 'is', null)
        .is('deleted_at', null)
        .limit(QUEUE_LIMIT),
    ),
  ])

  const adm01 = buildBlock<Adm01>('adm01', [pendingCount, pendingRows], () =>
    blockOk({
      count: unwrap(pendingCount),
      rows: unwrap(pendingRows).rows.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        createdAt: r.created_at,
        authorName: displayName(first(r.owner)),
      })),
    }),
  )

  const adm02 = buildBlock<Adm02>('adm02', [reportsPending, reportsReviewed, reportsRows], () =>
    blockOk({
      pending: unwrap(reportsPending),
      reviewed: unwrap(reportsReviewed),
      rows: unwrap(reportsRows).rows.map((r) => ({
        id: r.id,
        reason: r.reason,
        listingTitle: first(r.listing)?.title ?? null,
        createdAt: r.created_at,
        status: r.status,
      })),
    }),
  )

  const adm06 = buildBlock<Adm06>('adm06', [ticketsQueue, ticketsAnomaly, ticketsRows], () =>
    blockOk({
      unassigned: unwrap(ticketsQueue),
      inProgressAnomaly: unwrap(ticketsAnomaly),
      rows: unwrap(ticketsRows).rows.map((r) => ({
        id: r.id,
        ticketType: r.ticket_type,
        status: r.status,
        createdAt: r.created_at,
      })),
    }),
  )

  const adm08 = buildBlock<Adm08>('adm08', [visibleCount], () => blockOk({ visible: unwrap(visibleCount) }))

  const adm09 = buildBlock<Adm09>('adm09', [hiddenTotal, hiddenExpired, hiddenNoExpiry], () =>
    blockOk({
      total: unwrap(hiddenTotal),
      expired: unwrap(hiddenExpired),
      noExpiry: unwrap(hiddenNoExpiry),
    }),
  )

  const adm11 = buildBlock<Adm11>(
    'adm11',
    [
      pendingCount,
      visibleCount,
      hiddenTotal,
      rawActiveCount,
      inactiveCount,
      soldCount,
      rentedCount,
      archivedCount,
      expiredCount,
    ],
    () => {
      const visible = unwrap(visibleCount)
      const activeHidden = unwrap(hiddenTotal)
      if (unwrap(rawActiveCount) !== visible + activeHidden) {
        console.error('[AdminDashboard] adm11 failed', {
          code: 'data_inconsistent',
          visible,
          activeHidden,
          rawActive: unwrap(rawActiveCount),
        })
        return blockFail('data_inconsistent')
      }
      const segments: Adm11['segments'] = [
        { key: 'pending', count: unwrap(pendingCount) },
        { key: 'visible', count: visible },
        { key: 'active_hidden', count: activeHidden },
        { key: 'inactive', count: unwrap(inactiveCount) },
        { key: 'sold', count: unwrap(soldCount) },
        { key: 'rented', count: unwrap(rentedCount) },
        { key: 'archived', count: unwrap(archivedCount) },
        { key: 'expired', count: unwrap(expiredCount) },
      ]
      return blockOk({ segments, total: segments.reduce((sum, s) => sum + s.count, 0) })
    },
  )

  const recentListings = buildBlock<RecentListingRow[]>('recentListings', [recent], () =>
    blockOk(
      unwrap(recent).rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        status: r.status,
        isPremium: r.is_premium,
        price: r.price,
        currency: r.currency,
        createdAt: r.created_at,
        ownerName: displayName(first(r.owner)),
      })),
    ),
  )

  const location = buildBlock<LocationRequests>('locationRequests', [locationRequests], () => {
    const { rows, count } = unwrap(locationRequests)
    if (count === null) {
      console.error('[AdminDashboard] locationRequests failed', { code: 'count_missing' })
      return blockFail('query_failed')
    }
    return blockOk({
      count,
      rows: rows.map((r) => ({
        id: r.id,
        displayName: displayName(r),
        city: r.location_request?.city ?? '',
        region: r.location_request?.region ?? null,
      })),
    })
  })

  return { refreshedAt, adm01, adm02, adm06, adm08, adm09, adm11, recentListings, locationRequests: location }
}
