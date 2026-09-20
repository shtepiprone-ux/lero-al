/**
 * GET /api/cron/listing-activity — Task 849 (R4, R8).
 *
 * Covers:
 *   1. No secret / wrong secret / CRON_SECRET unset → 401, no admin client, no RPC, no refresh row.
 *   2. Happy path at 10:00 UTC → recomputes yesterday + today (Tirane), success refresh row, 200 JSON.
 *   3. The Tirane cut: 22:30 UTC on 18 Sep is already 19 Sep in Tirane (UTC+2) → range shifts a day.
 *   4. RPC error → 500 { ok: false } and a failure refresh row (message truncated to 500 chars).
 *   5. A refresh-row insert that fails after a good recompute is reported, never swallowed.
 *   6. The route exports GET only.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  createCalls: 0,
  createThrows: false,
  rpcCalls: [] as Array<{ fn: string; args: Record<string, unknown> }>,
  rpcResult: { data: 1240 as unknown, error: null as { message: string } | null },
  insertCalls: [] as Array<{ table: string; row: Record<string, unknown> }>,
  insertError: null as { message: string } | null,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => {
    state.createCalls++
    if (state.createThrows) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
    return {
      rpc: (fn: string, args: Record<string, unknown>) => {
        state.rpcCalls.push({ fn, args })
        return Promise.resolve(state.rpcResult)
      },
      from: (table: string) => ({
        insert: (row: Record<string, unknown>) => {
          state.insertCalls.push({ table, row })
          return Promise.resolve({ error: state.insertError })
        },
      }),
    }
  },
}))

const route = await import('../route')

function makeRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {}
  if (authHeader !== undefined) headers.authorization = authHeader
  return new NextRequest('http://localhost/api/cron/listing-activity', { method: 'GET', headers })
}

beforeEach(() => {
  state.createCalls = 0
  state.createThrows = false
  state.rpcCalls = []
  state.rpcResult = { data: 1240, error: null }
  state.insertCalls = []
  state.insertError = null
  vi.stubEnv('CRON_SECRET', 'test-secret')
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-18T10:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('GET /api/cron/listing-activity — authentication (fail closed)', () => {
  it('rejects a request without an Authorization header — 401, nothing touched', async () => {
    const res = await route.GET(makeRequest())
    expect(res.status).toBe(401)
    expect(state.createCalls).toBe(0)
    expect(state.rpcCalls).toHaveLength(0)
    expect(state.insertCalls).toHaveLength(0)
  })

  it('rejects a wrong secret — 401, nothing touched', async () => {
    const res = await route.GET(makeRequest('Bearer wrong-secret'))
    expect(res.status).toBe(401)
    expect(state.createCalls).toBe(0)
    expect(state.rpcCalls).toHaveLength(0)
    expect(state.insertCalls).toHaveLength(0)
  })

  it('rejects everything when CRON_SECRET is unset — even an empty bearer', async () => {
    vi.stubEnv('CRON_SECRET', '')
    for (const header of ['Bearer ', 'Bearer undefined', 'Bearer test-secret', undefined]) {
      const res = await route.GET(makeRequest(header))
      expect(res.status).toBe(401)
    }
    expect(state.createCalls).toBe(0)
    expect(state.rpcCalls).toHaveLength(0)
    expect(state.insertCalls).toHaveLength(0)
  })
})

describe('GET /api/cron/listing-activity — recompute', () => {
  it('at 10:00 UTC recomputes 17 and 18 Sep, records a success row and returns 200 JSON', async () => {
    const res = await route.GET(makeRequest('Bearer test-secret'))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      ok: true,
      from: '2026-09-17',
      to: '2026-09-18',
      rowsWritten: 1240,
      jobVersion: '849.1',
    })
    expect(state.rpcCalls).toEqual([
      {
        fn: 'recompute_listing_activity',
        args: { p_from: '2026-09-17', p_to: '2026-09-18', p_job_version: '849.1' },
      },
    ])
    expect(state.insertCalls).toEqual([
      {
        table: 'listing_activity_refresh',
        row: {
          from_date: '2026-09-17',
          to_date: '2026-09-18',
          status: 'success',
          rows_written: 1240,
          job_version: '849.1',
        },
      },
    ])
  })

  it('at 22:30 UTC the Tirane day has already turned: recomputes 18 and 19 Sep', async () => {
    vi.setSystemTime(new Date('2026-09-18T22:30:00Z'))

    const res = await route.GET(makeRequest('Bearer test-secret'))

    expect(res.status).toBe(200)
    expect(state.rpcCalls[0].args).toEqual({
      p_from: '2026-09-18',
      p_to: '2026-09-19',
      p_job_version: '849.1',
    })
    expect(await res.json()).toMatchObject({ from: '2026-09-18', to: '2026-09-19' })
  })

  it('an RPC error → 500 { ok: false } and a failure refresh row with the message truncated to 500', async () => {
    const longMessage = 'x'.repeat(800)
    state.rpcResult = { data: null, error: { message: longMessage } }

    const res = await route.GET(makeRequest('Bearer test-secret'))

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ ok: false })
    expect(state.insertCalls).toHaveLength(1)
    const { table, row } = state.insertCalls[0]
    expect(table).toBe('listing_activity_refresh')
    expect(row).toMatchObject({
      from_date: '2026-09-17',
      to_date: '2026-09-18',
      status: 'failure',
      job_version: '849.1',
    })
    expect(row.rows_written ?? null).toBeNull()
    expect(row.error).toBe('x'.repeat(500))
  })

  it('a refresh row that cannot be stored after a good recompute is a 500, not a silent success', async () => {
    state.insertError = { message: 'permission denied for table listing_activity_refresh' }
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await route.GET(makeRequest('Bearer test-secret'))

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ ok: false })
    expect(state.rpcCalls).toHaveLength(1)
    expect(errorSpy).toHaveBeenCalled()
  })

  it('an admin client that cannot be created is a 500 with no refresh row', async () => {
    state.createThrows = true
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await route.GET(makeRequest('Bearer test-secret'))

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ ok: false })
    expect(state.insertCalls).toHaveLength(0)
    expect(errorSpy).toHaveBeenCalled()
  })
})

describe('/api/cron/listing-activity — route surface', () => {
  it('exports GET only, and is never statically cached', () => {
    expect(typeof route.GET).toBe('function')
    expect((route as Record<string, unknown>).POST).toBeUndefined()
    expect(route.dynamic).toBe('force-dynamic')
  })
})
