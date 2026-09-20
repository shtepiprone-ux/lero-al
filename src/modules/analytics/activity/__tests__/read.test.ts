/**
 * Listing activity read helpers — Task 849 (R3 consumers, R7, R8).
 *
 * The admin client is replaced by one recording double: `rpc(fn, args)` answers the three series
 * functions, `from('listing_activity_refresh')` is a thenable select chain answering freshness. A
 * failure of any query is `ok: false` — it must never read as a series of zeros.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Period } from '@/lib/dashboard/period'
import type { AgentOwnerId } from '@/modules/cabinet/statistics/types'
import { ACTIVITY_REFRESH_CADENCE, STALE_AFTER_MS } from '../types'

interface DbError { message: string }

const state = vi.hoisted(() => ({
  createThrows: false,
  rpcCalls: [] as Array<{ fn: string; args: Record<string, unknown> }>,
  rpcAnswer: { data: null as unknown, error: null as DbError | null },
  refreshCalls: [] as Array<{ columns: string; filters: Array<{ op: string; args: unknown[] }> }>,
  refreshAnswer: { data: null as unknown, error: null as DbError | null },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => {
    if (state.createThrows) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
    return {
      rpc: (fn: string, args: Record<string, unknown>) => {
        state.rpcCalls.push({ fn, args })
        return Promise.resolve(state.rpcAnswer)
      },
      from: (table: string) => ({
        select: (columns: string) => {
          if (table !== 'listing_activity_refresh') throw new Error(`unexpected table ${table}`)
          const call = { columns, filters: [] as Array<{ op: string; args: unknown[] }> }
          state.refreshCalls.push(call)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const builder: any = {}
          for (const op of ['eq', 'order', 'limit']) {
            builder[op] = (...args: unknown[]) => {
              call.filters.push({ op, args })
              return builder
            }
          }
          builder.then = (resolveFn: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
            Promise.resolve(state.refreshAnswer).then(resolveFn, reject)
          return builder
        },
      }),
    }
  },
}))

const {
  getPlatformActivitySeries,
  getOwnerActivitySeries,
  getOwnerActivityByListing,
  getActivityFreshness,
} = await import('../read')

const PERIOD: Period = { from: '2026-09-16', to: '2026-09-18', days: 3 }
const OWNER = 'owner-uuid' as AgentOwnerId

function dbRow(date: string, v: number, w: number, i: number) {
  return { metric_date: date, recorded_views: v, whatsapp_clicks: w, listing_inquiry_submissions: i }
}

beforeEach(() => {
  state.createThrows = false
  state.rpcCalls = []
  state.rpcAnswer = { data: null, error: null }
  state.refreshCalls = []
  state.refreshAnswer = { data: null, error: null }
})

describe('getPlatformActivitySeries', () => {
  it('passes the period to the RPC and maps every day, zero days included', async () => {
    state.rpcAnswer = {
      data: [dbRow('2026-09-16', 10, 2, 1), dbRow('2026-09-17', 0, 0, 0), dbRow('2026-09-18', 7, 1, 0)],
      error: null,
    }

    const result = await getPlatformActivitySeries(PERIOD)

    expect(state.rpcCalls).toEqual([
      { fn: 'listing_activity_platform_series', args: { p_from: '2026-09-16', p_to: '2026-09-18' } },
    ])
    expect(result).toEqual({
      ok: true,
      data: [
        { date: '2026-09-16', recordedViews: 10, whatsappClicks: 2, listingInquirySubmissions: 1 },
        { date: '2026-09-17', recordedViews: 0, whatsappClicks: 0, listingInquirySubmissions: 0 },
        { date: '2026-09-18', recordedViews: 7, whatsappClicks: 1, listingInquirySubmissions: 0 },
      ],
    })
  })

  it('an RPC error is ok:false query_failed — never a series of zeros', async () => {
    state.rpcAnswer = { data: null, error: { message: 'boom' } }
    expect(await getPlatformActivitySeries(PERIOD)).toEqual({ ok: false, error: 'query_failed' })
  })

  it('a client that cannot be created is ok:false query_failed', async () => {
    state.createThrows = true
    expect(await getPlatformActivitySeries(PERIOD)).toEqual({ ok: false, error: 'query_failed' })
  })

  it('a series that does not cover the period is data_inconsistent, not padded with zeros', async () => {
    state.rpcAnswer = { data: [dbRow('2026-09-16', 1, 1, 1)], error: null }
    expect(await getPlatformActivitySeries(PERIOD)).toEqual({ ok: false, error: 'data_inconsistent' })
  })

  it('a non-array payload is data_inconsistent', async () => {
    state.rpcAnswer = { data: null, error: null }
    expect(await getPlatformActivitySeries(PERIOD)).toEqual({ ok: false, error: 'data_inconsistent' })
  })
})

describe('getOwnerActivitySeries', () => {
  it('scopes the RPC to the owner id it was given and maps the rows', async () => {
    state.rpcAnswer = {
      data: [dbRow('2026-09-16', 1, 0, 0), dbRow('2026-09-17', 2, 0, 0), dbRow('2026-09-18', 3, 0, 1)],
      error: null,
    }

    const result = await getOwnerActivitySeries(OWNER, PERIOD)

    expect(state.rpcCalls).toEqual([
      {
        fn: 'listing_activity_owner_series',
        args: { p_owner: 'owner-uuid', p_from: '2026-09-16', p_to: '2026-09-18' },
      },
    ])
    expect(result.ok && result.data.map((p) => p.recordedViews)).toEqual([1, 2, 3])
  })

  it('an RPC error is ok:false query_failed', async () => {
    state.rpcAnswer = { data: null, error: { message: 'boom' } }
    expect(await getOwnerActivitySeries(OWNER, PERIOD)).toEqual({ ok: false, error: 'query_failed' })
  })
})

describe('getOwnerActivityByListing', () => {
  it('maps per-listing sums and the last activity date; an owner with no activity is an empty ok list', async () => {
    state.rpcAnswer = {
      data: [
        {
          listing_id: 'l1',
          recorded_views: 12,
          whatsapp_clicks: 3,
          listing_inquiry_submissions: 2,
          last_activity_date: '2026-09-18',
        },
      ],
      error: null,
    }
    expect(await getOwnerActivityByListing(OWNER, PERIOD)).toEqual({
      ok: true,
      data: [
        {
          listingId: 'l1',
          recordedViews: 12,
          whatsappClicks: 3,
          listingInquirySubmissions: 2,
          lastActivityDate: '2026-09-18',
        },
      ],
    })
    expect(state.rpcCalls[0]).toEqual({
      fn: 'listing_activity_owner_by_listing',
      args: { p_owner: 'owner-uuid', p_from: '2026-09-16', p_to: '2026-09-18' },
    })

    state.rpcAnswer = { data: [], error: null }
    expect(await getOwnerActivityByListing(OWNER, PERIOD)).toEqual({ ok: true, data: [] })
  })

  it('an RPC error is ok:false query_failed', async () => {
    state.rpcAnswer = { data: null, error: { message: 'boom' } }
    expect(await getOwnerActivityByListing(OWNER, PERIOD)).toEqual({ ok: false, error: 'query_failed' })
  })
})

describe('getActivityFreshness', () => {
  const NOW = new Date('2026-09-18T12:00:00Z')

  it('reads only the latest successful refresh', async () => {
    state.refreshAnswer = { data: [{ ran_at: '2026-09-18T11:00:00Z' }], error: null }
    await getActivityFreshness(NOW)
    expect(state.refreshCalls[0].filters).toEqual([
      { op: 'eq', args: ['status', 'success'] },
      { op: 'order', args: ['ran_at', { ascending: false }] },
      { op: 'limit', args: [1] },
    ])
  })

  it('is fresh one hour after a success', async () => {
    state.refreshAnswer = { data: [{ ran_at: '2026-09-18T11:00:00Z' }], error: null }
    expect(await getActivityFreshness(NOW)).toEqual({
      ok: true,
      data: { lastSuccessAt: '2026-09-18T11:00:00Z', stale: false },
    })
  })

  it('the staleness boundary: exactly STALE_AFTER_MS old is fresh, one millisecond more is stale', async () => {
    const atBoundary = new Date(NOW.getTime() - STALE_AFTER_MS).toISOString()
    state.refreshAnswer = { data: [{ ran_at: atBoundary }], error: null }
    expect(await getActivityFreshness(NOW)).toMatchObject({ ok: true, data: { stale: false } })

    const pastBoundary = new Date(NOW.getTime() - STALE_AFTER_MS - 1).toISOString()
    state.refreshAnswer = { data: [{ ran_at: pastBoundary }], error: null }
    expect(await getActivityFreshness(NOW)).toMatchObject({ ok: true, data: { stale: true } })
  })

  it('no successful refresh has ever run → lastSuccessAt null and stale', async () => {
    state.refreshAnswer = { data: [], error: null }
    expect(await getActivityFreshness(NOW)).toEqual({
      ok: true,
      data: { lastSuccessAt: null, stale: true },
    })
  })

  it('a query error is ok:false query_failed — never reported as fresh', async () => {
    state.refreshAnswer = { data: null, error: { message: 'boom' } }
    expect(await getActivityFreshness(NOW)).toEqual({ ok: false, error: 'query_failed' })
  })

  it('an unparseable timestamp is data_inconsistent', async () => {
    state.refreshAnswer = { data: [{ ran_at: 'not-a-date' }], error: null }
    expect(await getActivityFreshness(NOW)).toEqual({ ok: false, error: 'data_inconsistent' })
  })
})

describe('refresh cadence', () => {
  it('STALE_AFTER_MS is 2 h for an hourly schedule and 26 h for a daily one', () => {
    expect(STALE_AFTER_MS).toBe((ACTIVITY_REFRESH_CADENCE === 'hourly' ? 2 : 26) * 3_600_000)
  })

  it('when vercel.json schedules the job, the schedule matches ACTIVITY_REFRESH_CADENCE', () => {
    const raw = readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8')
    const crons = (JSON.parse(raw).crons ?? []) as Array<{ path: string; schedule: string }>
    const entry = crons.find((c) => c.path === '/api/cron/listing-activity')
    if (!entry) return // not scheduled yet: owner action O78-1 is unanswered
    expect(entry.schedule).toBe(ACTIVITY_REFRESH_CADENCE === 'hourly' ? '0 * * * *' : '30 0 * * *')
  })
})
