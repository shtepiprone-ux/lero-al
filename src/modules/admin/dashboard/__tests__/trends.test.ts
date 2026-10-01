/**
 * Admin dashboard trend and city reads — Task 890 (R2, R3).
 *
 * The Supabase admin client is replaced by a recording, thenable query builder. `state.respond`
 * answers each recorded call; `rowsBetween` emulates the database's own `gte`/`lt` window so the
 * bucketing tests exercise the real period bounds.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

interface Filter { op: string; args: unknown[] }
interface Call {
  table: string
  columns: string
  filters: Filter[]
}
interface Answer { data?: unknown; error?: { code: string } | null }

const state = vi.hoisted(() => ({
  calls: [] as Call[],
  respond: ((): Answer => ({ data: [] })) as (call: Call) => Answer,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: (columns: string) => {
        const call: Call = { table, columns, filters: [] }
        state.calls.push(call)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const builder: any = {}
        for (const op of ['eq', 'in', 'gte', 'lt', 'is', 'or', 'not', 'order', 'range']) {
          builder[op] = (...args: unknown[]) => {
            call.filters.push({ op, args })
            return builder
          }
        }
        builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
          new Promise((res) => res(state.respond(call)))
            .then((r) => ({ data: null, error: null, ...(r as Answer) }))
            .then(resolve, reject)
        return builder
      },
    }),
  }),
}))

const { getAdminTrends, getVisibleListingsByCity, TREND_ROW_LIMIT } = await import('../trends')
const { resolvePeriod } = await import('@/lib/dashboard/period')

const rangeOf = (c: Call): [number, number] => c.filters.find((f) => f.op === 'range')!.args as [number, number]

/** Rows of `rows` whose `created_at` lies inside the recorded `[gte, lt)` window, sliced to the requested page. */
function rowsBetween(call: Call, rows: Array<{ created_at: string }>): Array<{ created_at: string }> {
  const gte = call.filters.find((f) => f.op === 'gte')!.args[1] as string
  const lt = call.filters.find((f) => f.op === 'lt')!.args[1] as string
  const [from, to] = rangeOf(call)
  return rows.filter((r) => r.created_at >= gte && r.created_at < lt).slice(from, to + 1)
}

// 2026-09-18 10:00 Tirane (CEST, UTC+2): the last completed day is 2026-09-17.
const NOW = new Date('2026-09-18T08:00:00Z')
const PERIOD = resolvePeriod({ kind: '7d' }, NOW) // 2026-09-11 … 2026-09-17

beforeEach(() => {
  state.calls.length = 0
  state.respond = () => ({ data: [] })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('getAdminTrends', () => {
  it('buckets by Tirane day across local midnight', async () => {
    // 21:59:59Z is 23:59:59 in Tirane on the 11th; 22:00:00Z is 00:00:00 on the 12th.
    const rows = [
      { created_at: '2026-09-11T21:59:59Z' },
      { created_at: '2026-09-11T22:00:00Z' },
      { created_at: '2026-09-11T22:00:01Z' },
    ]
    state.respond = (c) => ({ data: c.table === 'listings' ? rowsBetween(c, rows) : [] })

    const trends = await getAdminTrends(PERIOD, NOW)

    expect(trends.newListings.ok && trends.newListings.data.find((p) => p.date === '2026-09-11')?.count).toBe(1)
    expect(trends.newListings.ok && trends.newListings.data.find((p) => p.date === '2026-09-12')?.count).toBe(2)
  })

  it('zero-fills every day of the period after a successful read, in order', async () => {
    const trends = await getAdminTrends(PERIOD, NOW)

    expect(trends.newUsers.ok && trends.newUsers.data).toEqual(
      ['11', '12', '13', '14', '15', '16', '17'].map((d) => ({ date: `2026-09-${d}`, count: 0 })),
    )
  })

  it('answers the sparklines over the last seven completed days, independent of the period', async () => {
    const period30 = resolvePeriod({ kind: '30d' }, NOW)
    const trends = await getAdminTrends(period30, NOW)

    expect(trends.newListings.ok && trends.newListings.data).toHaveLength(30)
    for (const spark of [trends.sparklines.listings, trends.sparklines.reports, trends.sparklines.tickets]) {
      expect(spark.ok && spark.data.map((p) => p.date)).toEqual(['11', '12', '13', '14', '15', '16', '17'].map((d) => `2026-09-${d}`))
    }
  })

  it('reads the right table per series and selects only created_at', async () => {
    await getAdminTrends(PERIOD, NOW)

    expect(state.calls.map((c) => c.table).sort()).toEqual(['listing_reports', 'listings', 'listings', 'support_tickets', 'users'])
    expect(state.calls.every((c) => c.columns === 'created_at')).toBe(true)
  })

  it('counts soft-deleted users too (no deleted_at filter)', async () => {
    await getAdminTrends(PERIOD, NOW)
    const users = state.calls.find((c) => c.table === 'users')!
    expect(users.filters.some((f) => f.op === 'is' || f.op === 'not')).toBe(false)
  })

  it('fails a series that reaches the row limit — never a truncated count', async () => {
    const full = Array.from({ length: TREND_ROW_LIMIT + 1 }, () => ({ created_at: '2026-09-12T10:00:00Z' }))
    state.respond = (c) => ({ data: c.table === 'listings' ? rowsBetween(c, full) : [] })

    const trends = await getAdminTrends(PERIOD, NOW)

    expect(trends.newListings).toEqual({ ok: false, error: 'query_failed' })
    expect(trends.sparklines.listings).toEqual({ ok: false, error: 'query_failed' })
    expect(trends.newUsers.ok).toBe(true)
  })

  it('reads beyond one page when the window holds more rows than a page', async () => {
    const many = Array.from({ length: 2_500 }, () => ({ created_at: '2026-09-12T10:00:00Z' }))
    state.respond = (c) => ({ data: c.table === 'listings' ? rowsBetween(c, many) : [] })

    const trends = await getAdminTrends(PERIOD, NOW)

    expect(trends.newListings.ok && trends.newListings.data.find((p) => p.date === '2026-09-12')?.count).toBe(2_500)
  })

  it('fails only the series whose read failed', async () => {
    state.respond = (c) => (c.table === 'users' ? { error: { code: '500' } } : { data: [] })

    const trends = await getAdminTrends(PERIOD, NOW)

    expect(trends.newUsers).toEqual({ ok: false, error: 'query_failed' })
    expect(trends.newListings.ok).toBe(true)
    expect(trends.sparklines.reports.ok).toBe(true)
  })

  it('fails a series whose read returns no data and no error', async () => {
    state.respond = (c) => (c.table === 'support_tickets' ? { data: null } : { data: [] })

    const trends = await getAdminTrends(PERIOD, NOW)

    expect(trends.sparklines.tickets).toEqual({ ok: false, error: 'query_failed' })
  })
})

// ── getVisibleListingsByCity ─────────────────────────────────────────────────────────────────

interface Loc { id: number; type: string; parent_id: number | null; name_al: string; name_en: string | null }

function world(locations: Loc[], listingLocations: Array<number | null>) {
  state.respond = (c) => {
    const [from, to] = rangeOf(c)
    const source = c.table === 'locations' ? locations : listingLocations.map((location_id) => ({ location_id }))
    return { data: source.slice(from, to + 1) }
  }
}

const region: Loc = { id: 1, type: 'region', parent_id: null, name_al: 'Qarku Tiranë', name_en: 'Tirana County' }
const tirana: Loc = { id: 2, type: 'city', parent_id: 1, name_al: 'Tiranë', name_en: 'Tirana' }
const district: Loc = { id: 3, type: 'district', parent_id: 2, name_al: 'Blloku', name_en: 'Blloku' }
const village: Loc = { id: 4, type: 'village', parent_id: 2, name_al: 'Farka', name_en: null }
const durres: Loc = { id: 5, type: 'city', parent_id: 1, name_al: 'Durrës', name_en: 'Durres' }

describe('getVisibleListingsByCity', () => {
  it('resolves a district and a village to their city, and counts the city itself', async () => {
    world([region, tirana, district, village, durres], [2, 3, 4, 5])

    const result = await getVisibleListingsByCity('en')

    expect(result).toEqual({
      ok: true,
      data: {
        cities: [
          { key: '2', name: 'Tirana', count: 3 },
          { key: '5', name: 'Durres', count: 1 },
        ],
        other: 0,
      },
    })
  })

  it('sends a region-only location and a null location to Other', async () => {
    world([region, tirana], [1, null, 2])

    const result = await getVisibleListingsByCity('en')

    expect(result).toEqual({ ok: true, data: { cities: [{ key: '2', name: 'Tirana', count: 1 }], other: 2 } })
  })

  it('sends a location id that does not exist to Other', async () => {
    world([region, tirana], [999])

    const result = await getVisibleListingsByCity('en')

    expect(result).toEqual({ ok: true, data: { cities: [], other: 1 } })
  })

  it('is cycle-safe: a parent loop with no city ends in Other after a bounded walk', async () => {
    const a: Loc = { id: 10, type: 'district', parent_id: 11, name_al: 'A', name_en: null }
    const b: Loc = { id: 11, type: 'district', parent_id: 10, name_al: 'B', name_en: null }
    world([a, b], [10, 11])

    const result = await getVisibleListingsByCity('en')

    expect(result).toEqual({ ok: true, data: { cities: [], other: 2 } })
  })

  it('keeps the top five cities by count (ties by name) and folds the rest into Other — total preserved', async () => {
    const cities: Loc[] = ['F', 'E', 'D', 'C', 'B', 'A', 'G'].map((name, i) => ({
      id: 100 + i,
      type: 'city',
      parent_id: null,
      name_al: name,
      name_en: name,
    }))
    const byName = (n: string) => cities.find((c) => c.name_en === n)!.id
    // A×3, B×3 (tie, sorted by name), C×2, D×2, E×2, F×1, G×1 and one listing with no location.
    const listings = [
      ...Array(3).fill(byName('A')), ...Array(3).fill(byName('B')),
      ...Array(2).fill(byName('C')), ...Array(2).fill(byName('D')), ...Array(2).fill(byName('E')),
      byName('F'), byName('G'), null,
    ]
    world(cities, listings)

    const result = await getVisibleListingsByCity('en')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.cities.map((c) => c.name)).toEqual(['A', 'B', 'C', 'D', 'E'])
    expect(result.data.other).toBe(3) // F + G + the null-location listing
    const total = result.data.cities.reduce((sum, c) => sum + c.count, 0) + result.data.other
    expect(total).toBe(listings.length)
  })

  it('labels per the PopularLocations rule: sq → name_al, else name_en with name_al fallback', async () => {
    world([region, tirana, village, { ...durres, name_en: null }], [2, 5])

    const sq = await getVisibleListingsByCity('sq')
    const uk = await getVisibleListingsByCity('uk')

    expect(sq.ok && sq.data.cities.map((c) => c.name).sort()).toEqual(['Durrës', 'Tiranë'])
    expect(uk.ok && uk.data.cities.map((c) => c.name).sort()).toEqual(['Durrës', 'Tirana'])
  })

  it('reads only publicly visible listings through the canonical visibility predicate', async () => {
    world([tirana], [2])

    await getVisibleListingsByCity('en')

    const listingsCall = state.calls.find((c) => c.table === 'listings')!
    expect(listingsCall.columns).toBe('location_id')
    expect(listingsCall.filters.some((f) => f.op === 'eq' || f.op === 'in')).toBe(true)
    expect(listingsCall.filters.some((f) => f.op === 'gte')).toBe(true)
  })

  it('fails the block when either read fails', async () => {
    state.respond = (c) => (c.table === 'locations' ? { error: { code: '500' } } : { data: [] })

    expect(await getVisibleListingsByCity('en')).toEqual({ ok: false, error: 'query_failed' })
  })

  it('fails the block when the visible listings reach the row limit', async () => {
    state.respond = (c) => ({ data: Array.from({ length: 1_000 }, () => (c.table === 'locations' ? tirana : { location_id: 2 })) })

    expect(await getVisibleListingsByCity('en')).toEqual({ ok: false, error: 'query_failed' })
  })
})
