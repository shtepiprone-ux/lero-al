/**
 * Agent statistics data layer — Task 848 (R2–R6).
 *
 * Both Supabase clients are replaced by one recording, thenable query builder. Every chained call is
 * captured on the `Call` (with the client that made it), and `state.respond` answers per query. The
 * visibility helpers are wrapped in spies that still run the real implementation, so the real predicate
 * reaches the recorded filters. Listing expiry dates in fixtures are far past / far future so the
 * canonical `isListingPubliclyVisible` (which reads the machine clock) is deterministic.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Period } from '@/lib/dashboard/period'
import type { Agt10Table, AgentOwnerId } from '../types'

interface Filter { op: string; args: unknown[] }
interface Call {
  client: 'user' | 'service'
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

function makeClient(client: 'user' | 'service') {
  return {
    from: (table: string) => ({
      select: (columns: string, opts?: { count?: string; head?: boolean }) => {
        const call: Call = { client, table, columns, opts, filters: [] }
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

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => makeClient('user') }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => makeClient('service') }))

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

const { getAgentStatisticsData } = await import('../data')

// ── fixtures ─────────────────────────────────────────────────────────────────────────────────

const OWNER = 'agent-owner-1' as AgentOwnerId
const FUTURE = '2099-01-01T00:00:00Z'
const PAST = '2000-01-01T00:00:00Z'

// 22:30 UTC on the 18th is already 00:30 on the 19th in Tirane (CEST, UTC+2).
const NOW = new Date('2026-09-18T22:30:00Z')

const PERIOD: Period = { from: '2026-09-01', to: '2026-09-07', days: 7 }
const CURRENT_BOUNDS = { start: '2026-08-31T22:00:00.000Z', end: '2026-09-07T22:00:00.000Z' }
const PREVIOUS_BOUNDS = { start: '2026-08-24T22:00:00.000Z', end: '2026-08-31T22:00:00.000Z' }

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
  inquiriesCurrent: 7,
  inquiriesPrevious: 4,
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

let rows: ListingRow[]
let inquiryRows: Array<{ listing_id: string }>
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
    } else {
      return { data: rows }
    }
  }
  if (c.table === 'listing_inquiries') {
    if (isCount(c)) {
      if (has(c, 'gte', 'created_at', CURRENT_BOUNDS.start)) return { count: W.inquiriesCurrent }
      if (has(c, 'gte', 'created_at', PREVIOUS_BOUNDS.start)) return { count: W.inquiriesPrevious }
    } else {
      return { data: inquiryRows }
    }
  }
  throw new Error(`unanswered query: ${c.client} ${c.table} ${c.columns} ${JSON.stringify(c.filters)}`)
}

let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  state.calls = []
  state.respond = defaultRespond
  rows = listingRows(20)
  inquiryRows = []
  images = {}
  visibilitySpies.applyPublicVisibility.mockClear()
  visibilitySpies.applyPublicEligibleButHidden.mockClear()
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  errorSpy.mockRestore()
})

const run = (over: { table?: Partial<Agt10Table>; period?: Period; now?: Date } = {}) =>
  getAgentStatisticsData({
    ownerId: OWNER,
    now: over.now ?? NOW,
    period: over.period ?? PERIOD,
    table: { ...TABLE, ...over.table },
  })

/** Answer `failing` queries with a Supabase error; everything else with the default world. */
function failWhen(failing: (c: Call) => boolean, code = 'XX000') {
  state.respond = (c) => (failing(c) ? { error: { code } } : defaultRespond(c))
}

const BLOCKS = ['agt01', 'agt02', 'agt05', 'agt10'] as const

// ── tests ────────────────────────────────────────────────────────────────────────────────────

describe('getAgentStatisticsData — positive flow', () => {
  it('returns one ok block per block with the kickoff §11 numbers', async () => {
    const data = await run()

    for (const block of BLOCKS) expect(data[block].ok).toBe(true)
    expect(data.agt01).toEqual({ ok: true, data: { pending: 2, hidden: 2, expiring: 3 } })
    expect(data.agt05).toEqual({ ok: true, data: { current: 7, previous: 4 } })

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
  it('every query — listings and inquiries — is constrained by the owner id', async () => {
    await run({ table: { sort: 'form_inquiries' } })
    expect(state.calls.length).toBeGreaterThan(0)
    for (const c of state.calls) {
      const ownerColumn = c.table === 'listing_inquiries' ? 'listing_owner_id' : 'user_id'
      expect(has(c, 'eq', ownerColumn, OWNER), `${c.table} ${c.columns} has eq(${ownerColumn}, owner)`).toBe(true)
    }
  })

  it('only the two owned tables are read, listings with the user client and inquiries with the service client', async () => {
    await run()
    expect(new Set(state.calls.map((c) => c.table))).toEqual(new Set(['listings', 'listing_inquiries']))
    for (const c of state.calls) {
      expect(c.client).toBe(c.table === 'listing_inquiries' ? 'service' : 'user')
    }
  })

  it('filters only narrow the agent\'s own rows — the owner constraint stays on the table queries', async () => {
    await run({ table: { status: 'active', listingType: 'rent', visibility: 'visible' } })
    const q1 = state.calls.find((c) => c.table === 'listings' && !isCount(c) && !c.columns.includes('images'))
    expect(q1).toBeDefined()
    expect(has(q1!, 'eq', 'user_id', OWNER)).toBe(true)
    expect(has(q1!, 'eq', 'status', 'active')).toBe(true)
    expect(has(q1!, 'eq', 'listing_type', 'rent')).toBe(true)
  })

  it('AGT-05 and per-listing inquiries never select personal columns', async () => {
    inquiryRows = [{ listing_id: 'l-01' }]
    const data = await run({ table: { sort: 'form_inquiries' } })
    for (const c of state.calls.filter((x) => x.table === 'listing_inquiries')) {
      expect(c.columns).toMatch(/^(id|listing_id)$/)
    }
    expect(JSON.stringify(data)).not.toMatch(/email|message|requester_ip/)
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

describe('AGT-05 (R5)', () => {
  it('counts the completed period and the previous period in Tirane UTC bounds', async () => {
    await run()
    const inquiryCounts = state.calls.filter((c) => c.table === 'listing_inquiries' && isCount(c))
    expect(inquiryCounts).toHaveLength(2)
    const current = inquiryCounts.find((c) => has(c, 'gte', 'created_at', CURRENT_BOUNDS.start))
    const previous = inquiryCounts.find((c) => has(c, 'gte', 'created_at', PREVIOUS_BOUNDS.start))
    expect(current && has(current, 'lt', 'created_at', CURRENT_BOUNDS.end)).toBe(true)
    expect(previous && has(previous, 'lt', 'created_at', PREVIOUS_BOUNDS.end)).toBe(true)
  })

  it('ignores the inquiry status — no query filters on it', async () => {
    await run({ table: { sort: 'form_inquiries' } })
    for (const c of state.calls.filter((x) => x.table === 'listing_inquiries')) {
      expect(c.filters.some((f) => f.args[0] === 'status')).toBe(false)
    }
  })

  it('a zero previous period is returned as a real zero, ok:true', async () => {
    W.inquiriesPrevious = 0
    try {
      const data = await run()
      expect(data.agt05).toEqual({ ok: true, data: { current: 7, previous: 0 } })
    } finally {
      W.inquiriesPrevious = 4
    }
  })
})

describe('failures never read as zero (R4)', () => {
  it('a failing inquiry count fails AGT-05 alone', async () => {
    failWhen((c) => c.table === 'listing_inquiries' && isCount(c) && has(c, 'gte', 'created_at', PREVIOUS_BOUNDS.start))
    const data = await run()
    expect(data.agt05).toEqual({ ok: false, error: 'query_failed' })
    expect(data.agt01.ok && data.agt02.ok && data.agt10.ok).toBe(true)
    expect(errorSpy).toHaveBeenCalledWith('[AgentStatistics] agt05 failed', expect.objectContaining({ code: 'XX000' }))
  })

  it('a failing hidden count fails AGT-01 alone', async () => {
    failWhen((c) => c.table === 'listings' && isCount(c) && hasOp(c, 'or'))
    const data = await run()
    expect(data.agt01).toEqual({ ok: false, error: 'query_failed' })
    expect(data.agt02.ok && data.agt05.ok && data.agt10.ok).toBe(true)
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
    expect(data.agt01.ok && data.agt02.ok && data.agt05.ok).toBe(true)
  })

  it('a thrown query is a failed block, not a crash', async () => {
    state.respond = (c) => {
      if (c.table === 'listing_inquiries' && isCount(c)) throw new Error('network')
      return defaultRespond(c)
    }
    const data = await run()
    expect(data.agt05).toEqual({ ok: false, error: 'query_failed' })
    expect(data.agt01.ok).toBe(true)
  })

  it('a listing list that hits the row limit fails AGT-10 instead of paging a truncated set', async () => {
    rows = listingRows(1000)
    const data = await run()
    expect(data.agt10).toEqual({ ok: false, error: 'query_failed' })
  })
})

describe('zero listings', () => {
  it('returns real zeros, ok:true, and no split', async () => {
    Object.assign(W, { pending: 0, active: 0, inactive: 0, sold: 0, visible: 0, hidden: 0, expiring: 0, inquiriesCurrent: 0, inquiriesPrevious: 0 })
    rows = []
    try {
      const data = await run()
      expect(data.agt01).toEqual({ ok: true, data: { pending: 0, hidden: 0, expiring: 0 } })
      expect(data.agt05).toEqual({ ok: true, data: { current: 0, previous: 0 } })
      if (!data.agt02.ok) throw new Error('agt02 failed')
      expect(data.agt02.data.split).toBeNull()
      expect(data.agt10).toEqual({ ok: true, data: { rows: [], total: 0, page: 1, pageSize: 10 } })
    } finally {
      Object.assign(W, { pending: 2, active: 15, inactive: 3, sold: 1, visible: 12, hidden: 2, expiring: 3, inquiriesCurrent: 7, inquiriesPrevious: 4 })
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

  it('sorts by form inquiries using one owner-wide inquiry read, then reads only the page\'s covers', async () => {
    rows = listingRows(12)
    inquiryRows = [
      ...Array(3).fill({ listing_id: 'l-05' }),
      ...Array(5).fill({ listing_id: 'l-02' }),
      { listing_id: 'l-09' },
      { listing_id: 'not-mine-anymore' },
    ]
    const data = await run({ table: { sort: 'form_inquiries' } })
    if (!data.agt10.ok) throw new Error('agt10 failed')
    expect(data.agt10.data.rows.slice(0, 3).map((r) => [r.id, r.formInquiries])).toEqual([
      ['l-02', 5],
      ['l-05', 3],
      ['l-09', 1],
    ])
    expect(data.agt10.data.rows[3].formInquiries).toBe(0)
    const perListing = state.calls.filter((c) => c.table === 'listing_inquiries' && !isCount(c))
    expect(perListing).toHaveLength(1)
    expect(has(perListing[0], 'eq', 'listing_owner_id', OWNER)).toBe(true)
  })

  it('reads the per-listing inquiry counts in one grouped query restricted to the page ids (no N+1)', async () => {
    inquiryRows = [{ listing_id: 'l-20' }, { listing_id: 'l-20' }, { listing_id: 'l-11' }]
    const data = await run()
    if (!data.agt10.ok) throw new Error('agt10 failed')
    const perListing = state.calls.filter((c) => c.table === 'listing_inquiries' && !isCount(c))
    expect(perListing).toHaveLength(1)
    expect(has(perListing[0], 'gte', 'created_at', CURRENT_BOUNDS.start)).toBe(true)
    const inFilter = perListing[0].filters.find((f) => f.op === 'in')
    expect(inFilter?.args[0]).toBe('listing_id')
    expect(inFilter?.args[1]).toEqual(data.agt10.data.rows.map((r) => r.id))
    expect(data.agt10.data.rows.find((r) => r.id === 'l-20')?.formInquiries).toBe(2)
    expect(data.agt10.data.rows.find((r) => r.id === 'l-11')?.formInquiries).toBe(1)
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

  it('makes no cover or per-listing query for an empty page', async () => {
    rows = []
    await run()
    expect(state.calls.some((c) => c.columns.includes('images'))).toBe(false)
    expect(state.calls.some((c) => c.table === 'listing_inquiries' && !isCount(c))).toBe(false)
  })
})

describe('the module never asks for whole rows', () => {
  it('no query uses select(*)', async () => {
    await run()
    for (const c of state.calls) expect(c.columns).not.toContain('*')
  })
})
