/**
 * Agent statistics data layer — Task 848 (R2–R6), rebuilt by Task 891 (R7): AGT-05 and the
 * `listing_inquiries` service-role reads are gone; AGT-10's form-inquiries/recorded-views/WhatsApp/
 * last-activity columns and their sorts all merge from `activityByListing`, a `Promise` the caller
 * (page.tsx in production, this file's fixtures in a test) starts before calling
 * `getAgentStatisticsData` and passes straight through — proving the exact "one Promise.all with
 * 848's data" concurrency shape R1 requires without a second, redundant fetch inside this module.
 *
 * The one Supabase client is a recording, thenable query builder. Every chained call is captured on
 * the `Call`, and `state.respond` answers per query. The visibility helpers are wrapped in spies that
 * still run the real implementation, so the real predicate reaches the recorded filters. Listing
 * expiry dates in fixtures are far past / far future so the canonical `isListingPubliclyVisible`
 * (which reads the machine clock) is deterministic.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Period } from '@/lib/dashboard/period'
import type { ActivityByListingRow } from '@/modules/analytics/activity/types'
import type { BlockResult } from '@/lib/dashboard/blockResult'
import type { Agt10Table, AgentOwnerId } from '../types'

interface Filter { op: string; args: unknown[] }
interface Call {
  table: string
  columns: string
  opts?: { count?: string; head?: boolean }
  filters: Filter[]
}
interface Answer { data?: unknown; count?: number | null; error?: { code: string } | null }

const state = vi.hoisted(() => ({
  calls: [] as Call[],
  respond: ((): Answer => ({})) as (call: Call) => Answer,
}))

function makeClient() {
  return {
    from: (table: string) => ({
      select: (columns: string, opts?: { count?: string; head?: boolean }) => {
        const call: Call = { table, columns, opts, filters: [] }
        state.calls.push(call)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const builder: any = {}
        for (const op of ['eq', 'in', 'gte', 'lt', 'is', 'or', 'not', 'order', 'limit', 'range']) {
          builder[op] = (...args: unknown[]) => {
            call.filters.push({ op, args })
            return builder
          }
        }
        builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
          new Promise((res) => res(state.respond(call)))
            .then((r) => ({ data: null, count: null, error: null, ...(r as Answer) }))
            .then(resolve, reject)
        return builder
      },
    }),
  }
}

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => makeClient() }))

const visibilitySpies = vi.hoisted(() => ({
  applyPublicVisibility: vi.fn(),
  applyPublicEligibleButHidden: vi.fn(),
}))

vi.mock('@/modules/listings/lib/visibility', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/listings/lib/visibility')>()
  visibilitySpies.applyPublicVisibility.mockImplementation(actual.applyPublicVisibility)
  visibilitySpies.applyPublicEligibleButHidden.mockImplementation(actual.applyPublicEligibleButHidden)
  return {
    ...actual,
    applyPublicVisibility: visibilitySpies.applyPublicVisibility,
    applyPublicEligibleButHidden: visibilitySpies.applyPublicEligibleButHidden,
  }
})

const { getAgentStatisticsData, getOwnListingTitles } = await import('../data')

// ── fixtures ─────────────────────────────────────────────────────────────────────────────────

const OWNER = 'agent-owner-1' as AgentOwnerId
const FUTURE = '2099-01-01T00:00:00Z'
const PAST = '2000-01-01T00:00:00Z'

// 22:30 UTC on the 18th is already 00:30 on the 19th in Tirane (CEST, UTC+2).
const NOW = new Date('2026-09-18T22:30:00Z')

const PERIOD: Period = { from: '2026-09-01', to: '2026-09-07', days: 7 }

const TABLE: Agt10Table = { sort: 'created_at', direction: 'desc', page: 1 }

// The default world — the positive flow of kickoff §11.
const W = {
  pending: 2,
  active: 15,
  inactive: 3,
  sold: 1,
  rented: 0,
  archived: 0,
  expired: 0,
  visible: 12,
  hidden: 2,
  expiring: 3,
  sale: 8,
  rent: 4,
}

interface ListingRow {
  id: string
  slug: string
  title: string
  status: string
  expires_at: string | null
  listing_type: 'sale' | 'rent'
  created_at: string
}

function listingRows(n: number, over: (i: number) => Partial<ListingRow> = () => ({})): ListingRow[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `l-${String(i + 1).padStart(2, '0')}`,
    slug: `listing-${i + 1}`,
    title: `Listing ${i + 1}`,
    status: 'active',
    expires_at: FUTURE,
    listing_type: 'sale' as const,
    // later index = newer, so `created_at desc` lists the highest index first
    created_at: `2026-08-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
    ...over(i),
  }))
}

function activityRow(over: Partial<ActivityByListingRow>): ActivityByListingRow {
  return {
    listingId: 'l-01',
    recordedViews: 0,
    whatsappClicks: 0,
    listingInquirySubmissions: 0,
    lastActivityDate: '2026-09-05',
    ...over,
  }
}

let rows: ListingRow[]
let images: Record<string, Array<{ url: string; is_cover: boolean | null; order: number | null }>>

const has = (c: Call, op: string, ...args: unknown[]) =>
  c.filters.some((f) => f.op === op && args.every((a, i) => f.args[i] === a))
const hasOp = (c: Call, op: string) => c.filters.some((f) => f.op === op)
const isCount = (c: Call) => c.opts?.head === true

function defaultRespond(c: Call): Answer {
  if (c.table === 'listings') {
    if (isCount(c)) {
      if (has(c, 'lt', 'expires_at')) return { count: W.expiring }
      if (has(c, 'eq', 'listing_type', 'sale')) return { count: W.sale }
      if (has(c, 'eq', 'listing_type', 'rent')) return { count: W.rent }
      if (hasOp(c, 'gte')) return { count: W.visible }
      if (hasOp(c, 'or')) return { count: W.hidden }
      for (const status of ['pending', 'active', 'inactive', 'sold', 'rented', 'archived', 'expired'] as const) {
        if (has(c, 'eq', 'status', status)) return { count: W[status] }
      }
    } else if (c.columns.includes('images')) {
      const ids = (c.filters.find((f) => f.op === 'in')?.args[1] as string[]) ?? []
      return { data: ids.map((id) => ({ id, images: images[id] ?? [] })) }
    } else if (c.columns === 'id, title') {
      return { data: rows.map((r) => ({ id: r.id, title: r.title })) }
    } else {
      return { data: rows }
    }
  }
  throw new Error(`unanswered query: ${c.table} ${c.columns} ${JSON.stringify(c.filters)}`)
}

let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  state.calls = []
  state.respond = defaultRespond
  rows = listingRows(20)
  images = {}
  visibilitySpies.applyPublicVisibility.mockClear()
  visibilitySpies.applyPublicEligibleButHidden.mockClear()
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  errorSpy.mockRestore()
})

const okActivity = (rows: ActivityByListingRow[] = []): Promise<BlockResult<ActivityByListingRow[]>> =>
  Promise.resolve({ ok: true, data: rows })
const failedActivity: Promise<BlockResult<ActivityByListingRow[]>> = Promise.resolve({ ok: false, error: 'query_failed' })

const run = (
  over: { table?: Partial<Agt10Table>; period?: Period; now?: Date; activityByListing?: Promise<BlockResult<ActivityByListingRow[]>> } = {},
) =>
  getAgentStatisticsData({
    ownerId: OWNER,
    now: over.now ?? NOW,
    period: over.period ?? PERIOD,
    table: { ...TABLE, ...over.table },
    activityByListing: over.activityByListing ?? okActivity(),
  })

/** Answer `failing` queries with a Supabase error; everything else with the default world. */
function failWhen(failing: (c: Call) => boolean, code = 'XX000') {
  state.respond = (c) => (failing(c) ? { error: { code } } : defaultRespond(c))
}

const BLOCKS = ['agt01', 'agt02', 'agt10'] as const

// ── tests ────────────────────────────────────────────────────────────────────────────────────

describe('getAgentStatisticsData — positive flow', () => {
  it('returns one ok block per block with the kickoff §11 numbers', async () => {
    const data = await run()

    for (const block of BLOCKS) expect(data[block].ok).toBe(true)
    expect(data.agt01).toEqual({ ok: true, data: { pending: 2, hidden: 2, expiring: 3 } })

    if (!data.agt02.ok) throw new Error('agt02 failed')
    expect(data.agt02.data).toMatchObject({ visible: 12, pending: 2, inactive: 3, sold: 1, rented: 0 })
    expect(data.agt02.data.split).toEqual({ sale: 8, rent: 4 })
    expect(Object.keys(data.agt02.data.statusCounts).sort()).toEqual(
      ['active', 'archived', 'expired', 'inactive', 'pending', 'rented', 'sold'],
    )
    expect(data.agt02.data.statusCounts.active).toBe(15)

    if (!data.agt10.ok) throw new Error('agt10 failed')
    expect(data.agt10.data).toMatchObject({ total: 20, page: 1, pageSize: 10 })
    expect(data.agt10.data.rows).toHaveLength(10)
  })

  it('AGT-02 visible comes from the canonical helper, not the raw active count', async () => {
    const data = await run()
    if (!data.agt02.ok) throw new Error('agt02 failed')
    expect(data.agt02.data.visible).toBe(12)
    expect(data.agt02.data.statusCounts.active).toBe(15)
    expect(visibilitySpies.applyPublicVisibility).toHaveBeenCalled()
    expect(visibilitySpies.applyPublicEligibleButHidden).toHaveBeenCalled()
  })
})

describe('owner isolation (R2, R3)', () => {
  it('every listings query is constrained by the owner id', async () => {
    await run()
    expect(state.calls.length).toBeGreaterThan(0)
    for (const c of state.calls) {
      expect(has(c, 'eq', 'user_id', OWNER), `${c.table} ${c.columns} has eq(user_id, owner)`).toBe(true)
    }
  })

  it('only the listings table is read', async () => {
    await run()
    expect(new Set(state.calls.map((c) => c.table))).toEqual(new Set(['listings']))
  })

  it('filters only narrow the agent\'s own rows — the owner constraint stays on the table queries', async () => {
    await run({ table: { status: 'active', listingType: 'rent', visibility: 'visible' } })
    const q1 = state.calls.find((c) => c.table === 'listings' && !isCount(c) && !c.columns.includes('images') && c.columns !== 'id, title')
    expect(q1).toBeDefined()
    expect(has(q1!, 'eq', 'user_id', OWNER)).toBe(true)
    expect(has(q1!, 'eq', 'status', 'active')).toBe(true)
    expect(has(q1!, 'eq', 'listing_type', 'rent')).toBe(true)
  })
})

describe('AGT-01 (R5)', () => {
  it('the expiring window runs from the start of today to the start of today+8 in Tirane', async () => {
    await run()
    const c = state.calls.find((x) => x.table === 'listings' && isCount(x) && has(x, 'lt', 'expires_at'))
    expect(c).toBeDefined()
    // now = 2026-09-18 22:30 UTC = 2026-09-19 00:30 Tirane -> today is the 19th; today+8 = the 27th.
    expect(has(c!, 'gte', 'expires_at', '2026-09-18T22:00:00.000Z')).toBe(true)
    expect(has(c!, 'lt', 'expires_at', '2026-09-26T22:00:00.000Z')).toBe(true)
    expect(has(c!, 'eq', 'user_id', OWNER)).toBe(true)
  })

  it('the window still starts on the previous Tirane day when now is early evening UTC', async () => {
    await run({ now: new Date('2026-09-18T20:00:00Z') }) // 22:00 Tirane on the 18th
    const c = state.calls.find((x) => x.table === 'listings' && isCount(x) && has(x, 'lt', 'expires_at'))
    expect(has(c!, 'gte', 'expires_at', '2026-09-17T22:00:00.000Z')).toBe(true)
    expect(has(c!, 'lt', 'expires_at', '2026-09-25T22:00:00.000Z')).toBe(true)
  })

  it('pending is the owner\'s pending status, and hidden uses the canonical eligible-but-hidden helper', async () => {
    await run()
    const pending = state.calls.find((c) => isCount(c) && has(c, 'eq', 'status', 'pending'))
    expect(pending && has(pending, 'eq', 'user_id', OWNER)).toBe(true)
    const hidden = state.calls.find((c) => isCount(c) && hasOp(c, 'or'))
    expect(hidden).toBeDefined()
    expect(has(hidden!, 'eq', 'user_id', OWNER)).toBe(true)
  })
})

describe('AGT-02', () => {
  it('omits the split when nothing is visible', async () => {
    W.visible = 0
    try {
      const data = await run()
      if (!data.agt02.ok) throw new Error('agt02 failed')
      expect(data.agt02.data.visible).toBe(0)
      expect(data.agt02.data.split).toBeNull()
    } finally {
      W.visible = 12
    }
  })

  it('a listing-type split query failing does not matter when nothing is visible', async () => {
    W.visible = 0
    try {
      failWhen((c) => c.table === 'listings' && has(c, 'eq', 'listing_type', 'rent'))
      const data = await run()
      expect(data.agt02.ok).toBe(true)
    } finally {
      W.visible = 12
    }
  })
})

describe('failures never read as zero (R4)', () => {
  it('a failing hidden count fails AGT-01 alone', async () => {
    failWhen((c) => c.table === 'listings' && isCount(c) && hasOp(c, 'or'))
    const data = await run()
    expect(data.agt01).toEqual({ ok: false, error: 'query_failed' })
    expect(data.agt02.ok && data.agt10.ok).toBe(true)
  })

  it('a count that comes back null with no error is a failure, never 0', async () => {
    state.respond = (c) => (c.table === 'listings' && isCount(c) && has(c, 'eq', 'status', 'inactive') ? { count: null } : defaultRespond(c))
    const data = await run()
    expect(data.agt02).toEqual({ ok: false, error: 'query_failed' })
    expect(data.agt01.ok).toBe(true)
  })

  it('a failing cover-image query fails AGT-10 alone', async () => {
    failWhen((c) => c.table === 'listings' && c.columns.includes('images'))
    const data = await run()
    expect(data.agt10).toEqual({ ok: false, error: 'query_failed' })
    expect(data.agt01.ok && data.agt02.ok).toBe(true)
  })

  it('a listing list that hits the row limit fails AGT-10 instead of paging a truncated set', async () => {
    rows = listingRows(1000)
    const data = await run()
    expect(data.agt10).toEqual({ ok: false, error: 'query_failed' })
  })

  it('a failed activityByListing read fails AGT-10 alone, never a false zero (R7)', async () => {
    const data = await run({ activityByListing: failedActivity })
    expect(data.agt10).toEqual({ ok: false, error: 'query_failed' })
    expect(data.agt01.ok && data.agt02.ok).toBe(true)
  })
})

describe('zero listings', () => {
  it('returns real zeros, ok:true, and no split', async () => {
    Object.assign(W, { pending: 0, active: 0, inactive: 0, sold: 0, visible: 0, hidden: 0, expiring: 0 })
    rows = []
    try {
      const data = await run()
      expect(data.agt01).toEqual({ ok: true, data: { pending: 0, hidden: 0, expiring: 0 } })
      if (!data.agt02.ok) throw new Error('agt02 failed')
      expect(data.agt02.data.split).toBeNull()
      expect(data.agt10).toEqual({ ok: true, data: { rows: [], total: 0, page: 1, pageSize: 10 } })
    } finally {
      Object.assign(W, { pending: 2, active: 15, inactive: 3, sold: 1, visible: 12, hidden: 2, expiring: 3 })
    }
  })
})

describe('AGT-10', () => {
  const idsOf = (data: Awaited<ReturnType<typeof run>>) => {
    if (!data.agt10.ok) throw new Error('agt10 failed')
    return data.agt10.data.rows.map((r) => r.id)
  }

  it('pages by 10 and clamps a page past the end to the last page', async () => {
    const page2 = await run({ table: { page: 2 } })
    expect(idsOf(page2)).toHaveLength(10)
    const past = await run({ table: { page: 9 } })
    if (!past.agt10.ok) throw new Error('agt10 failed')
    expect(past.agt10.data.page).toBe(2)
    expect(past.agt10.data.rows).toHaveLength(10)
  })

  it('sorts by created_at descending by default and ascending on request', async () => {
    expect(idsOf(await run())[0]).toBe('l-20')
    expect(idsOf(await run({ table: { direction: 'asc' } }))[0]).toBe('l-01')
  })

  it('sorts by expires_at with missing expiry last in both directions', async () => {
    rows = listingRows(3, (i) => ({ expires_at: [null, '2099-03-01T00:00:00Z', '2099-02-01T00:00:00Z'][i] }))
    expect(idsOf(await run({ table: { sort: 'expires_at', direction: 'asc' } }))).toEqual(['l-03', 'l-02', 'l-01'])
    expect(idsOf(await run({ table: { sort: 'expires_at', direction: 'desc' } }))).toEqual(['l-02', 'l-03', 'l-01'])
  })

  it('merges recordedViews/whatsappClicks/formInquiries/lastActivityDate from activityByListing, defaulting to 0/null', async () => {
    rows = listingRows(2)
    const activity = okActivity([
      activityRow({ listingId: 'l-02', recordedViews: 9, whatsappClicks: 4, listingInquirySubmissions: 2, lastActivityDate: '2026-09-03' }),
    ])
    const data = await run({ table: { direction: 'asc' }, activityByListing: activity })
    if (!data.agt10.ok) throw new Error('agt10 failed')
    const r1 = data.agt10.data.rows.find((r) => r.id === 'l-01')!
    const r2 = data.agt10.data.rows.find((r) => r.id === 'l-02')!
    expect(r1).toMatchObject({ recordedViews: 0, whatsappClicks: 0, formInquiries: 0, lastActivityDate: null })
    expect(r2).toMatchObject({ recordedViews: 9, whatsappClicks: 4, formInquiries: 2, lastActivityDate: '2026-09-03' })
  })

  it('sorts by recorded_views across the whole matching set before paging, not just the page', async () => {
    rows = listingRows(12)
    const activity = okActivity([
      activityRow({ listingId: 'l-05', recordedViews: 30 }),
      activityRow({ listingId: 'l-02', recordedViews: 50 }),
      activityRow({ listingId: 'l-09', recordedViews: 10 }),
    ])
    const data = await run({ table: { sort: 'recorded_views', direction: 'desc' }, activityByListing: activity })
    if (!data.agt10.ok) throw new Error('agt10 failed')
    expect(data.agt10.data.rows.slice(0, 3).map((r) => [r.id, r.recordedViews])).toEqual([
      ['l-02', 50],
      ['l-05', 30],
      ['l-09', 10],
    ])
  })

  it('review 1 F6 — the top view-count listing sits outside the naive first-page slice, but a correct whole-set sort still puts it first on page 1', async () => {
    // `listingRows(12)` builds the mocked query's own return order as l-01..l-12 (unsorted). A
    // "slice the first 10 by that natural order, then sort" bug would fetch only l-01..l-10 into
    // its page and never see l-12 at all; a correct "sort the whole matching set, then slice"
    // implementation sorts all 12 first, so l-12's 99 views win regardless of array position.
    rows = listingRows(12)
    const activity = okActivity([
      activityRow({ listingId: 'l-12', recordedViews: 99 }),
      activityRow({ listingId: 'l-01', recordedViews: 5 }),
    ])
    const page1 = await run({ table: { sort: 'recorded_views', direction: 'desc' }, activityByListing: activity })
    if (!page1.agt10.ok) throw new Error('agt10 failed')
    expect(page1.agt10.data.rows[0]).toMatchObject({ id: 'l-12', recordedViews: 99 })

    const page2 = await run({ table: { sort: 'recorded_views', direction: 'desc', page: 2 }, activityByListing: activity })
    if (!page2.agt10.ok) throw new Error('agt10 failed')
    const page1Last = page1.agt10.data.rows[page1.agt10.data.rows.length - 1].recordedViews
    expect(page2.agt10.data.rows[0].recordedViews).toBeLessThanOrEqual(page1Last)
  })

  it('sorts by whatsapp_clicks and by last_activity_date (missing activity sorts last)', async () => {
    rows = listingRows(3)
    const activity = okActivity([
      activityRow({ listingId: 'l-01', whatsappClicks: 1, lastActivityDate: '2026-09-01' }),
      activityRow({ listingId: 'l-02', whatsappClicks: 5, lastActivityDate: '2026-09-05' }),
    ])
    const byWhatsapp = await run({ table: { sort: 'whatsapp_clicks', direction: 'desc' }, activityByListing: activity })
    expect(idsOf(byWhatsapp)).toEqual(['l-02', 'l-01', 'l-03'])

    const byActivity = await run({ table: { sort: 'last_activity_date', direction: 'desc' }, activityByListing: activity })
    expect(idsOf(byActivity)).toEqual(['l-02', 'l-01', 'l-03'])
  })

  it('derives visibility from the canonical helper and filters on it', async () => {
    rows = listingRows(4, (i) => [
      { status: 'active', expires_at: FUTURE },
      { status: 'active', expires_at: PAST },
      { status: 'active', expires_at: null },
      { status: 'inactive', expires_at: FUTURE },
    ][i])
    const all = await run({ table: { direction: 'asc' } })
    if (!all.agt10.ok) throw new Error('agt10 failed')
    expect(all.agt10.data.rows.map((r) => [r.id, r.visible, r.hiddenReason])).toEqual([
      ['l-01', true, null],
      ['l-02', false, 'expired'],
      ['l-03', false, 'no_expiry'],
      ['l-04', false, 'status_not_public'],
    ])
    expect(idsOf(await run({ table: { visibility: 'visible', direction: 'asc' } }))).toEqual(['l-01'])
    expect(idsOf(await run({ table: { visibility: 'hidden', direction: 'asc' } }))).toEqual(['l-02', 'l-03', 'l-04'])
    const hidden = await run({ table: { visibility: 'hidden' } })
    if (!hidden.agt10.ok) throw new Error('agt10 failed')
    expect(hidden.agt10.data.total).toBe(3)
  })

  it('reduces the embedded images to one cover url: is_cover first, else the lowest order', async () => {
    rows = listingRows(3)
    images = {
      'l-01': [
        { url: 'a.jpg', is_cover: false, order: 2 },
        { url: 'cover.jpg', is_cover: true, order: 5 },
      ],
      'l-02': [
        { url: 'second.jpg', is_cover: false, order: 2 },
        { url: 'first.jpg', is_cover: null, order: 1 },
      ],
      'l-03': [],
    }
    const data = await run({ table: { direction: 'asc' } })
    if (!data.agt10.ok) throw new Error('agt10 failed')
    expect(data.agt10.data.rows.map((r) => r.coverUrl)).toEqual(['cover.jpg', 'first.jpg', null])
    const coverQuery = state.calls.find((c) => c.columns.includes('images'))
    expect(coverQuery?.columns).toBe('id, images:listing_images(url, is_cover, "order")')
    expect(has(coverQuery!, 'eq', 'user_id', OWNER)).toBe(true)
  })

  it('makes no cover query for an empty page', async () => {
    rows = []
    await run()
    expect(state.calls.some((c) => c.columns.includes('images'))).toBe(false)
  })
})

describe('getOwnListingTitles (R5)', () => {
  it('reads the owner\'s own id/title list, unfiltered', async () => {
    rows = listingRows(3)
    const result = await getOwnListingTitles(OWNER)
    expect(result).toEqual({ ok: true, data: rows.map((r) => ({ id: r.id, title: r.title })) })
    const c = state.calls.find((x) => x.columns === 'id, title')
    expect(c && has(c, 'eq', 'user_id', OWNER)).toBe(true)
  })

  it('fails, never an empty list, when the query errors', async () => {
    failWhen((c) => c.columns === 'id, title')
    expect(await getOwnListingTitles(OWNER)).toEqual({ ok: false, error: 'query_failed' })
  })
})

describe('the module never asks for whole rows', () => {
  it('no query uses select(*)', async () => {
    await run()
    for (const c of state.calls) expect(c.columns).not.toContain('*')
  })
})
