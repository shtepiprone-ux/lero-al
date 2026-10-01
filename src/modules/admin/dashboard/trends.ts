import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { blockFail, blockOk, type BlockResult } from '@/lib/dashboard/blockResult'
import {
  listDates,
  periodUtcBounds,
  resolvePeriod,
  tiraneDateOf,
  type Period,
} from '@/lib/dashboard/period'
import { applyPublicVisibility } from '@/modules/listings/lib/visibility'

/**
 * The admin dashboard's trend and distribution reads — Task 890 (D78-9).
 *
 * Server-only, service-role, read-only. Every read is its own `BlockResult`: a failed or truncated
 * read is `ok: false` and never a smaller count. `0` is only the answer of a read that succeeded.
 */

/** Hard ceiling on the rows one trend/distribution read may load; reaching it is an error, never a count. */
export const TREND_ROW_LIMIT = 10_000

/** Rows per request. PostgREST caps a response at its `max-rows`, so a larger `.limit()` alone can truncate silently. */
const PAGE_SIZE = 1_000

export const SPARKLINE_DAYS = 7
export const TOP_CITY_COUNT = 5

export interface TrendPoint {
  date: string
  count: number
}

export interface AdminTrends {
  newListings: BlockResult<TrendPoint[]>
  newUsers: BlockResult<TrendPoint[]>
  sparklines: {
    listings: BlockResult<TrendPoint[]>
    reports: BlockResult<TrendPoint[]>
    tickets: BlockResult<TrendPoint[]>
  }
}

export interface CityCount {
  key: string
  name: string
  count: number
}

export interface VisibleListingsByCity {
  cities: CityCount[]
  other: number
}

interface PageAnswer<T> {
  data: T[] | null
  error: unknown
}

type PageRunner<T> = (from: number, to: number) => PromiseLike<PageAnswer<T>>

/**
 * Loads every row of a query, a page at a time. Fails closed: a failed page, a missing page, or a
 * result that reaches `TREND_ROW_LIMIT` is `null`, so the caller reports the block as failed.
 */
async function readAllRows<T>(label: string, run: PageRunner<T>): Promise<T[] | null> {
  const rows: T[] = []
  try {
    for (let from = 0; from < TREND_ROW_LIMIT; from += PAGE_SIZE) {
      const { data, error } = await run(from, from + PAGE_SIZE - 1)
      if (error || !data) {
        console.error(`[AdminTrends] ${label} failed`, { error })
        return null
      }
      rows.push(...data)
      if (data.length < PAGE_SIZE) return rows
    }
    console.error(`[AdminTrends] ${label} failed`, { code: 'row_limit_reached', limit: TREND_ROW_LIMIT })
    return null
  } catch (cause) {
    console.error(`[AdminTrends] ${label} threw`, { cause })
    return null
  }
}

/** New rows per Tirane day over `period`, zero-filled only after every page was read. */
async function dailyCounts(
  label: string,
  period: Period,
  run: (startUtc: string, endUtc: string) => PageRunner<{ created_at: string }>,
): Promise<BlockResult<TrendPoint[]>> {
  const { startUtc, endUtc } = periodUtcBounds(period)
  const rows = await readAllRows(label, run(startUtc, endUtc))
  if (!rows) return blockFail('query_failed')

  const counts = new Map<string, number>(listDates(period).map((date) => [date, 0]))
  for (const row of rows) {
    const date = tiraneDateOf(row.created_at)
    if (counts.has(date)) counts.set(date, (counts.get(date) as number) + 1)
  }
  return blockOk(Array.from(counts, ([date, count]) => ({ date, count })))
}

/**
 * `newListings` / `newUsers` over the selected period, and the three queue sparklines over the last
 * seven completed Tirane days (independent of the period control).
 */
export async function getAdminTrends(period: Period, now: Date): Promise<AdminTrends> {
  const db = createAdminClient()
  const sparkPeriod = resolvePeriod({ kind: '7d' }, now)

  const listings =
    (label: string, p: Period) =>
      dailyCounts(label, p, (startUtc, endUtc) => (from, to) =>
        db.from('listings').select('created_at').gte('created_at', startUtc).lt('created_at', endUtc).order('id').range(from, to),
      )
  const reports = (label: string, p: Period) =>
    dailyCounts(label, p, (startUtc, endUtc) => (from, to) =>
      db.from('listing_reports').select('created_at').gte('created_at', startUtc).lt('created_at', endUtc).order('id').range(from, to),
    )
  const tickets = (label: string, p: Period) =>
    dailyCounts(label, p, (startUtc, endUtc) => (from, to) =>
      db.from('support_tickets').select('created_at').gte('created_at', startUtc).lt('created_at', endUtc).order('id').range(from, to),
    )
  const users = (label: string, p: Period) =>
    dailyCounts(label, p, (startUtc, endUtc) => (from, to) =>
      db.from('users').select('created_at').gte('created_at', startUtc).lt('created_at', endUtc).order('id').range(from, to),
    )

  const [newListings, newUsers, sparkListings, sparkReports, sparkTickets] = await Promise.all([
    listings('newListings', period),
    users('newUsers', period),
    listings('sparklineListings', sparkPeriod),
    reports('sparklineReports', sparkPeriod),
    tickets('sparklineTickets', sparkPeriod),
  ])

  return {
    newListings,
    newUsers,
    sparklines: { listings: sparkListings, reports: sparkReports, tickets: sparkTickets },
  }
}

interface LocationRow {
  id: number
  type: string
  parent_id: number | null
  name_al: string
  name_en: string | null
}

const MAX_PARENT_HOPS = 10

/** The first `city` on the way up `parent_id` (the location itself included); `null` when none, or on a cycle. */
function cityOf(locationId: number | null, byId: Map<number, LocationRow>): LocationRow | null {
  let current = locationId === null ? undefined : byId.get(locationId)
  for (let hop = 0; current && hop < MAX_PARENT_HOPS; hop += 1) {
    if (current.type === 'city') return current
    current = current.parent_id === null ? undefined : byId.get(current.parent_id)
  }
  return null
}

/** The display-name rule of `PopularLocations.tsx`. */
function locationName(row: LocationRow, locale: string): string {
  return locale === 'sq' ? row.name_al : (row.name_en ?? row.name_al)
}

/**
 * Publicly visible listings grouped by the city their location resolves to: the top five cities by
 * count (ties by name) plus everything else — no location, or no city in its chain — as `other`.
 */
export async function getVisibleListingsByCity(locale: string): Promise<BlockResult<VisibleListingsByCity>> {
  const db = createAdminClient()

  const [listingRows, locationRows] = await Promise.all([
    readAllRows<{ location_id: number | null }>('cityListings', (from, to) =>
      applyPublicVisibility(db.from('listings').select('location_id')).order('id').range(from, to),
    ),
    readAllRows<LocationRow>('cityLocations', (from, to) =>
      db.from('locations').select('id, type, parent_id, name_al, name_en').order('id').range(from, to),
    ),
  ])
  if (!listingRows || !locationRows) return blockFail('query_failed')

  const byId = new Map(locationRows.map((row) => [row.id, row]))
  const perCity = new Map<number, { row: LocationRow; count: number }>()
  let other = 0
  for (const listing of listingRows) {
    const city = cityOf(listing.location_id, byId)
    if (!city) {
      other += 1
      continue
    }
    const entry = perCity.get(city.id)
    if (entry) entry.count += 1
    else perCity.set(city.id, { row: city, count: 1 })
  }

  const ranked = Array.from(perCity.values())
    .map(({ row, count }) => ({ key: String(row.id), name: locationName(row, locale), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, locale))

  const top = ranked.slice(0, TOP_CITY_COUNT)
  other += ranked.slice(TOP_CITY_COUNT).reduce((sum, city) => sum + city.count, 0)
  return blockOk({ cities: top, other })
}
