/**
 * Admin dashboard data layer — Task 847 (R1–R6).
 *
 * The Supabase admin client is replaced by a recording, thenable query builder: every chained call is
 * captured on the `Call`, and `state.respond` answers per query. The visibility helpers are wrapped in
 * spies that still run the real implementation, so the real predicate reaches the recorded filters.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

interface Filter { op: string; args: unknown[] }
interface Call {
  table: string
  columns: string
  opts?: { count?: string; head?: boolean }
  filters: Filter[]
}
interface Answer { data?: unknown; count?: number | null; error?: { code: string; message?: string } | null }

const state = vi.hoisted(() => ({
  calls: [] as Call[],
  respond: ((): Answer => ({})) as (call: Call) => Answer,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: (columns: string, opts?: { count?: string; head?: boolean }) => {
        const call: Call = { table, columns, opts, filters: [] }
        state.calls.push(call)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const builder: any = {}
        for (const op of ['eq', 'in', 'gte', 'lt', 'is', 'or', 'not', 'order', 'limit']) {
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
  }),
}))

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

const { getAdminDashboardData } = await import('../queries')

// ── query identification ─────────────────────────────────────────────────────────────────────

const has = (c: Call, op: string, ...args: unknown[]) =>
  c.filters.some((f) => f.op === op && args.every((a, i) => f.args[i] === a))
const hasOp = (c: Call, op: string) => c.filters.some((f) => f.op === op)
const isCount = (c: Call) => c.opts?.head === true

// Default world — the positive flow of kickoff §11.
const W = {
  pendingListings: 12,
  pendingReports: 3,
  reviewedReports: 2,
  unassignedTickets: 4,
  anomalyTickets: 1,
  visible: 900,
  hiddenTotal: 40,
  hiddenExpired: 25,
  hiddenNoExpiry: 15,
  rawActive: 940,
  inactive: 11,
  sold: 22,
  rented: 33,
  archived: 44,
  expiredStatus: 55,
  locationRequests: 7,
}

const fiveRows = (prefix: string, extra: Record<string, unknown> = {}) =>
  Array.from({ length: 5 }, (_, i) => ({ id: `${prefix}-${i + 1}`, created_at: `2026-09-0${i + 1}T10:00:00Z`, ...extra }))

function defaultRespond(c: Call): Answer {
  if (c.table === 'listings') {
    if (isCount(c)) {
      if (hasOp(c, 'gte')) return { count: W.visible }
      if (hasOp(c, 'lt')) return { count: W.hiddenExpired }
      if (hasOp(c, 'is')) return { count: W.hiddenNoExpiry }
      if (hasOp(c, 'or')) return { count: W.hiddenTotal }
      if (has(c, 'eq', 'status', 'pending')) return { count: W.pendingListings }
      if (has(c, 'eq', 'status', 'inactive')) return { count: W.inactive }
      if (has(c, 'eq', 'status', 'sold')) return { count: W.sold }
      if (has(c, 'eq', 'status', 'rented')) return { count: W.rented }
      if (has(c, 'eq', 'status', 'archived')) return { count: W.archived }
      if (has(c, 'eq', 'status', 'expired')) return { count: W.expiredStatus }
      if (has(c, 'eq', 'status', 'active')) return { count: W.rawActive }
    } else {
      if (has(c, 'eq', 'status', 'pending')) {
        return {
          data: fiveRows('l', { title: 'Apartment', slug: 'apartment', owner: { name: 'Ana', last_name: 'Hoxha' } }),
        }
      }
      return {
        data: Array.from({ length: 8 }, (_, i) => ({
          id: `r-${i + 1}`,
          slug: `recent-${i + 1}`,
          title: `Recent ${i + 1}`,
          status: 'active',
          is_premium: i === 0,
          price: 100000 + i,
          currency: 'EUR',
          created_at: `2026-09-1${i}T10:00:00Z`,
          owner: [{ name: 'Besa', last_name: null }],
        })),
      }
    }
  }
  if (c.table === 'listing_reports') {
    if (isCount(c)) {
      if (has(c, 'eq', 'status', 'pending')) return { count: W.pendingReports }
      if (has(c, 'eq', 'status', 'reviewed')) return { count: W.reviewedReports }
    } else {
      return { data: fiveRows('rep', { reason: 'spam', status: 'pending', listing: { title: 'Reported listing' } }) }
    }
  }
  if (c.table === 'support_tickets') {
    if (isCount(c)) {
      if (has(c, 'eq', 'status', 'in_progress')) return { count: W.anomalyTickets }
      if (has(c, 'in', 'status')) return { count: W.unassignedTickets }
    } else {
      return { data: fiveRows('t', { ticket_type: 'support', status: 'open' }) }
    }
  }
  if (c.table === 'users') {
    return {
      count: W.locationRequests,
      data: [
        { id: 'u1', name: 'Arta', last_name: 'Leka', location_request: { city: 'Tirana', region: 'Tirana' } },
        { id: 'u2', name: null, last_name: null, location_request: { city: 'Vlora' } },
      ],
    }
  }
  throw new Error(`unanswered query: ${c.table} ${c.columns} ${JSON.stringify(c.filters)}`)
}

let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  state.calls = []
  state.respond = defaultRespond
  visibilitySpies.applyPublicVisibility.mockClear()
  visibilitySpies.applyPublicEligibleButHidden.mockClear()
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  errorSpy.mockRestore()
})

/** Answer `failing` queries with a Supabase error; everything else with the default world. */
function failWhen(failing: (c: Call) => boolean, code = 'XX000') {
  state.respond = (c) => (failing(c) ? { error: { code, message: 'boom' } } : defaultRespond(c))
}

const BLOCKS = ['adm01', 'adm02', 'adm06', 'adm08', 'adm09', 'adm11', 'recentListings', 'locationRequests'] as const

describe('getAdminDashboardData', () => {
  // (a) ───────────────────────────────────────────────────────────────────────────────────────
  it('(a) all queries succeed → every block ok with the §3.1 shapes', async () => {
    const d = await getAdminDashboardData()

    expect(typeof d.refreshedAt).toBe('string')
    expect(Number.isNaN(Date.parse(d.refreshedAt))).toBe(false)
    for (const b of BLOCKS) expect(d[b].ok, b).toBe(true)

    if (!d.adm01.ok || !d.adm02.ok || !d.adm06.ok || !d.adm08.ok || !d.adm09.ok || !d.adm11.ok) throw new Error('unreachable')
    if (!d.recentListings.ok || !d.locationRequests.ok) throw new Error('unreachable')

    expect(d.adm01.data.count).toBe(12)
    expect(d.adm01.data.rows).toHaveLength(5)
    expect(d.adm01.data.rows[0]).toEqual({
      id: 'l-1', title: 'Apartment', slug: 'apartment', createdAt: '2026-09-01T10:00:00Z', authorName: 'Ana Hoxha',
    })
    expect(d.adm02.data.pending).toBe(3)
    expect(d.adm02.data.rows).toHaveLength(5)
    expect(d.adm02.data.rows[0]).toEqual({
      id: 'rep-1', reason: 'spam', listingTitle: 'Reported listing', createdAt: '2026-09-01T10:00:00Z', status: 'pending',
    })
    expect(d.adm06.data.unassigned).toBe(4)
    expect(d.adm06.data.rows).toHaveLength(5)
    expect(d.adm06.data.rows[0]).toEqual({ id: 't-1', ticketType: 'support', status: 'open', createdAt: '2026-09-01T10:00:00Z' })
    expect(d.adm08.data.visible).toBe(900)
    expect(d.adm09.data).toEqual({ total: 40, expired: 25, noExpiry: 15 })
    expect(d.adm11.data.segments).toHaveLength(8)
    expect(d.recentListings.data).toHaveLength(8)
    expect(d.recentListings.data[0]).toMatchObject({
      id: 'r-1', slug: 'recent-1', title: 'Recent 1', status: 'active', isPremium: true, currency: 'EUR', ownerName: 'Besa',
    })
    expect(d.locationRequests.data.count).toBe(7)
    expect(d.locationRequests.data.rows).toEqual([
      { id: 'u1', displayName: 'Arta Leka', city: 'Tirana', region: 'Tirana' },
      { id: 'u2', displayName: '—', city: 'Vlora', region: null },
    ])
    expect(errorSpy).not.toHaveBeenCalled()
  })

  // (b) ───────────────────────────────────────────────────────────────────────────────────────
  const OWN_QUERY_BLOCKS: Array<[(typeof BLOCKS)[number], (c: Call) => boolean]> = [
    ['adm01', (c) => c.table === 'listings' && !isCount(c) && has(c, 'eq', 'status', 'pending')],
    ['adm02', (c) => c.table === 'listing_reports' && isCount(c) && has(c, 'eq', 'status', 'reviewed')],
    ['adm02', (c) => c.table === 'listing_reports' && !isCount(c)],
    ['adm06', (c) => c.table === 'support_tickets' && isCount(c) && has(c, 'eq', 'status', 'in_progress')],
    ['adm06', (c) => c.table === 'support_tickets' && !isCount(c)],
    ['recentListings', (c) => c.table === 'listings' && !isCount(c) && !has(c, 'eq', 'status', 'pending')],
    ['locationRequests', (c) => c.table === 'users'],
  ]

  it.each(OWN_QUERY_BLOCKS)('(b) a failing %s query fails only that block', async (block, failing) => {
    failWhen(failing, 'PGRST301')
    const d = await getAdminDashboardData()

    expect(d[block]).toEqual({ ok: false, error: 'query_failed' })
    for (const other of BLOCKS.filter((b) => b !== block)) expect(d[other].ok, other).toBe(true)
    expect(errorSpy).toHaveBeenCalledWith(`[AdminDashboard] ${block} failed`, expect.objectContaining({ code: 'PGRST301' }))
  })

  it('(b) a failing shared visibility count fails the blocks that read it, and only those', async () => {
    failWhen((c) => c.table === 'listings' && isCount(c) && hasOp(c, 'gte'))
    const d = await getAdminDashboardData()

    expect(d.adm08).toEqual({ ok: false, error: 'query_failed' })
    expect(d.adm11).toEqual({ ok: false, error: 'query_failed' })
    for (const other of ['adm01', 'adm02', 'adm06', 'adm09', 'recentListings', 'locationRequests'] as const) {
      expect(d[other].ok, other).toBe(true)
    }
  })

  it('(b) a failing pending-listings count is shared by ADM-01 and the ADM-11 segment, and only those fail', async () => {
    failWhen((c) => c.table === 'listings' && isCount(c) && has(c, 'eq', 'status', 'pending'))
    const d = await getAdminDashboardData()

    expect(d.adm01).toEqual({ ok: false, error: 'query_failed' })
    expect(d.adm11).toEqual({ ok: false, error: 'query_failed' })
    for (const other of ['adm02', 'adm06', 'adm08', 'adm09', 'recentListings', 'locationRequests'] as const) {
      expect(d[other].ok, other).toBe(true)
    }
  })

  it('(b) a thrown exception fails its block only, and the function still resolves', async () => {
    state.respond = (c) => {
      if (c.table === 'support_tickets' && !isCount(c)) throw new Error('network down')
      return defaultRespond(c)
    }
    const d = await getAdminDashboardData()

    expect(d.adm06).toEqual({ ok: false, error: 'query_failed' })
    expect(d.adm01.ok).toBe(true)
    expect(errorSpy).toHaveBeenCalledWith('[AdminDashboard] adm06 failed', expect.anything())
  })

  it('(b) a count that comes back null without an error is a failure, never 0', async () => {
    state.respond = (c) => (c.table === 'listing_reports' && isCount(c) && has(c, 'eq', 'status', 'pending') ? { count: null } : defaultRespond(c))
    const d = await getAdminDashboardData()

    expect(d.adm02).toEqual({ ok: false, error: 'query_failed' })
  })

  it('(b) every query erroring → every block ok:false, and the function still resolves', async () => {
    state.respond = () => ({ error: { code: '57014' } })
    const d = await getAdminDashboardData()

    for (const b of BLOCKS) expect(d[b], b).toEqual({ ok: false, error: 'query_failed' })
    expect(typeof d.refreshedAt).toBe('string')
  })

  it('an empty queue is a real zero with no rows, not an error', async () => {
    state.respond = (c) => {
      const r = defaultRespond(c)
      if (c.table === 'listings' && isCount(c) && has(c, 'eq', 'status', 'pending')) return { count: 0 }
      if (c.table === 'listings' && !isCount(c) && has(c, 'eq', 'status', 'pending')) return { data: [] }
      return r
    }
    const d = await getAdminDashboardData()

    expect(d.adm01).toEqual({ ok: true, data: { count: 0, rows: [] } })
  })

  // (c) ───────────────────────────────────────────────────────────────────────────────────────
  it('(c) the ADM-02 value counts pending only; reviewed is its own query and is never summed', async () => {
    const d = await getAdminDashboardData()
    if (!d.adm02.ok) throw new Error('unreachable')

    expect(d.adm02.data.pending).toBe(3)
    expect(d.adm02.data.reviewed).toBe(2)
    expect(d.adm02.data.pending + d.adm02.data.reviewed).not.toBe(d.adm02.data.pending)

    const counts = state.calls.filter((c) => c.table === 'listing_reports' && isCount(c))
    expect(counts).toHaveLength(2)
    expect(counts.filter((c) => has(c, 'eq', 'status', 'pending'))).toHaveLength(1)
    expect(counts.filter((c) => has(c, 'eq', 'status', 'reviewed'))).toHaveLength(1)
    expect(counts.every((c) => c.filters.length === 1)).toBe(true)
  })

  it('(c) the ADM-02 rows are the 5 oldest pending, oldest first', async () => {
    await getAdminDashboardData()
    const rows = state.calls.find((c) => c.table === 'listing_reports' && !isCount(c))!

    expect(has(rows, 'eq', 'status', 'pending')).toBe(true)
    expect(rows.filters.filter((f) => f.op === 'order').map((f) => [f.args[0], (f.args[1] as { ascending: boolean }).ascending])).toEqual([
      ['created_at', true],
      ['id', true],
    ])
    expect(has(rows, 'limit', 5)).toBe(true)
  })

  // (d) ───────────────────────────────────────────────────────────────────────────────────────
  it('(d) the ADM-06 in-progress anomaly is a separate count and is not mixed into the queue', async () => {
    const d = await getAdminDashboardData()
    if (!d.adm06.ok) throw new Error('unreachable')

    expect(d.adm06.data.unassigned).toBe(4)
    expect(d.adm06.data.inProgressAnomaly).toBe(1)

    const counts = state.calls.filter((c) => c.table === 'support_tickets' && isCount(c))
    expect(counts).toHaveLength(2)
    const queue = counts.find((c) => hasOp(c, 'in'))!
    const anomaly = counts.find((c) => has(c, 'eq', 'status', 'in_progress'))!
    expect(queue.filters).toContainEqual({ op: 'in', args: ['status', ['open', 'in_progress']] })
    expect(has(queue, 'is', 'assigned_to', null)).toBe(true)
    expect(has(anomaly, 'is', 'assigned_to', null)).toBe(true)
  })

  it('(d) the ADM-06 rows are the 5 oldest unassigned, oldest first', async () => {
    await getAdminDashboardData()
    const rows = state.calls.find((c) => c.table === 'support_tickets' && !isCount(c))!

    expect(rows.filters).toContainEqual({ op: 'in', args: ['status', ['open', 'in_progress']] })
    expect(has(rows, 'is', 'assigned_to', null)).toBe(true)
    expect(rows.filters.filter((f) => f.op === 'order').map((f) => f.args[0])).toEqual(['created_at', 'id'])
    expect(has(rows, 'limit', 5)).toBe(true)
  })

  // (e) ───────────────────────────────────────────────────────────────────────────────────────
  it('(e) ADM-11 has eight segments, no raw-active segment, and its total is the segment sum', async () => {
    const d = await getAdminDashboardData()
    if (!d.adm11.ok) throw new Error('unreachable')

    expect(d.adm11.data.segments.map((s) => s.key)).toEqual([
      'pending', 'visible', 'active_hidden', 'inactive', 'sold', 'rented', 'archived', 'expired',
    ])
    expect(d.adm11.data.segments.map((s) => s.key)).not.toContain('active')

    const byKey = Object.fromEntries(d.adm11.data.segments.map((s) => [s.key, s.count]))
    expect(byKey).toEqual({
      pending: 12, visible: 900, active_hidden: 40, inactive: 11, sold: 22, rented: 33, archived: 44, expired: 55,
    })
    expect(d.adm11.data.total).toBe(Object.values(byKey).reduce((a, b) => a + b, 0))
    // visible + active_hidden equals the raw active count of the same world
    expect(byKey.visible + byKey.active_hidden).toBe(W.rawActive)
  })

  it('(e) ADM-11 disagreeing with the raw active count → data_inconsistent for ADM-11 only', async () => {
    state.respond = (c) =>
      c.table === 'listings' && isCount(c) && has(c, 'eq', 'status', 'active') && !hasOp(c, 'gte') && !hasOp(c, 'lt') && !hasOp(c, 'is') && !hasOp(c, 'or')
        ? { count: W.rawActive + 3 }
        : defaultRespond(c)
    const d = await getAdminDashboardData()

    expect(d.adm11).toEqual({ ok: false, error: 'data_inconsistent' })
    for (const other of BLOCKS.filter((b) => b !== 'adm11')) expect(d[other].ok, other).toBe(true)
    expect(errorSpy).toHaveBeenCalledWith('[AdminDashboard] adm11 failed', expect.anything())
  })

  // (f) ───────────────────────────────────────────────────────────────────────────────────────
  it('(f) ADM-08/09/11 counts go through the canonical visibility helpers', async () => {
    await getAdminDashboardData()

    // ADM-08 and ADM-11's `visible` segment share one helper-built count.
    expect(visibilitySpies.applyPublicVisibility).toHaveBeenCalled()
    const reasons = visibilitySpies.applyPublicEligibleButHidden.mock.calls.map((args) => (args[1] as { reason?: string } | undefined)?.reason)
    expect(reasons).toContain('expired')
    expect(reasons).toContain('no_expiry')
    expect(reasons).toContain(undefined) // ADM-09 total

    // The helper's own predicate is what reached the query — the module wrote none of it.
    const visibleCount = state.calls.find((c) => c.table === 'listings' && isCount(c) && hasOp(c, 'gte'))!
    expect(has(visibleCount, 'gte', 'expires_at')).toBe(true)
  })

  // R5 / §10 ───────────────────────────────────────────────────────────────────────────────────
  it('every select lists explicit columns and none of them is a private field', async () => {
    await getAdminDashboardData()

    expect(state.calls.length).toBeGreaterThan(0)
    for (const c of state.calls) {
      expect(c.columns, `${c.table} select`).not.toMatch(/\*/)
      expect(c.columns.trim(), `${c.table} select`).not.toBe('')
      expect(c.columns, `${c.table} select`).not.toMatch(/comment|email|phone|document_url/)
    }
  })

  it('issues exactly the 20 expected queries — shared counts are reused, no N+1', async () => {
    const order: string[] = []
    state.respond = (c) => {
      order.push(`${c.table}:${isCount(c) ? 'count' : 'rows'}`)
      return defaultRespond(c)
    }
    await getAdminDashboardData()

    // 1 + 1 (ADM-01) · 2 + 1 (ADM-02) · 2 + 1 (ADM-06) · visible · 3 hidden · raw active · 5 status counts · recent · location
    expect(state.calls).toHaveLength(2 + 3 + 3 + 1 + 3 + 1 + 5 + 1 + 1)
    expect(order).toHaveLength(state.calls.length)
  })
})
