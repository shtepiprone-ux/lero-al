/**
 * Cron listings-expiry route smoke — Task 455 (Epic LV / LV.2), brought onto the paused job by Task 931.
 *
 * The job is PAUSED (Task 923 R77 (d), owner decisions D56 / D58): it counts the lapsed active listings, returns their ids
 * as `would_expire_ids`, answers `expired: 0` and writes no listing. A failed read answers 500 `read_failed`.
 *
 * Covers:
 *   1. Authorized call with lapsed active listings → counted as would_expire, expired 0, no listing written.
 *   2. Nothing lapsed → would_expire 0, no listing written.
 *   3. NULL-expiry active rows reported but NOT mutated.
 *   4. Unauthorized caller → 401.
 *   5. While paused, no listing status is written (no `update` call at all).
 *   6. A failed read answers 500 `read_failed` and writes nothing.
 *   7. (Task 851) GET — what Vercel sends — mirrors POST: authorized → same result, wrong secret → 401.
 *   8. (Task 851) CRON_SECRET unset → 401 for GET and POST, no DB call (fail closed).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

type Filter = { op: 'eq' | 'is' | 'lt'; col: string; val: unknown }
type DbError = { code: string }

let updateCalls: Array<{ payload: Record<string, unknown>; filters: Filter[] }>
let limitArgs: number[]
let lapsedResult: { data: Array<{ id: string }> | null; error: DbError | null }
let nullCountResult: { count: number | null; error: DbError | null }

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string; head?: boolean }) => {
        // `.select(…, { count, head }).eq().is()` — the NULL-expiry count
        if (opts?.head) {
          return {
            eq: () => ({
              is: () => Promise.resolve(nullCountResult),
            }),
          }
        }
        // `.select().eq().lt().limit()` — the lapsed read
        return {
          eq: () => ({
            lt: () => ({
              limit: (n: number) => {
                limitArgs.push(n)
                return Promise.resolve(lapsedResult)
              },
            }),
          }),
        }
      }),
      // Every write is recorded. The job is paused, so a recorded call is a failure of the test that reads `updateCalls`.
      update: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
        const call = { payload, filters: [] as Filter[] }
        updateCalls.push(call)
        const chain: Record<string, unknown> = {}
        for (const op of ['eq', 'is', 'lt'] as const) {
          chain[op] = (col: string, val: unknown) => {
            call.filters.push({ op, col, val })
            return chain
          }
        }
        chain.then = (resolve: (v: unknown) => void) => resolve({ error: null })
        return chain
      }),
    }),
  }),
}))

const { GET, POST } = await import('../route')

beforeEach(() => {
  updateCalls = []
  limitArgs = []
  lapsedResult = { data: [], error: null }
  nullCountResult = { count: 0, error: null }
  vi.stubEnv('CRON_SECRET', 'test-secret')
  vi.spyOn(console, 'info').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

function makeRequest(authHeader?: string, method: 'GET' | 'POST' = 'POST'): NextRequest {
  const headers: Record<string, string> = {}
  if (authHeader) headers.authorization = authHeader
  return new NextRequest('http://localhost/api/cron/listings-expiry', {
    method,
    headers,
  })
}

describe('POST /api/cron/listings-expiry', () => {
  it('unauthorized caller → 401', async () => {
    const res = await POST(makeRequest('Bearer wrong-secret'))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('unauthorized')
  })

  it('[SEC-931-SRV-CRON-ALLOW] authorized, lapsed active listings → counted as would_expire, expired 0, no listing written', async () => {
    lapsedResult = { data: [{ id: 'l1' }, { id: 'l2' }], error: null }

    const res = await POST(makeRequest('Bearer test-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.expired).toBe(0)
    expect(body.would_expire).toBe(2)
    expect(body.would_expire_ids).toEqual(['l1', 'l2'])
    expect(body.errors).toBe(0)
    expect(body.null_expiry_active).toBe(0)

    expect(limitArgs).toEqual([1000])
    expect(updateCalls).toHaveLength(0)
  })

  it('authorized, nothing lapsed → would_expire 0, no updates', async () => {
    const res = await POST(makeRequest('Bearer test-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.expired).toBe(0)
    expect(body.would_expire).toBe(0)
    expect(body.would_expire_ids).toEqual([])
    expect(body.errors).toBe(0)
    expect(updateCalls).toHaveLength(0)
  })

  it('[SEC-931-SRV-CRON-DENY] NULL-expiry active rows reported but NOT mutated', async () => {
    nullCountResult = { count: 3, error: null }

    const res = await POST(makeRequest('Bearer test-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.null_expiry_active).toBe(3)
    expect(body.expired).toBe(0)
    expect(body.would_expire).toBe(0)
    expect(updateCalls).toHaveLength(0)
    expect(body.null_expiry_note).toContain('NOT counted as lapsed')
  })

  it('while paused, no listing status is written', async () => {
    lapsedResult = { data: [{ id: 'l1' }], error: null }
    nullCountResult = { count: 2, error: null }

    const res = await POST(makeRequest('Bearer test-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.expired).toBe(0)
    expect(body.would_expire_ids).toEqual(['l1'])
    expect(updateCalls).toHaveLength(0)
  })

  it('[SEC-931-SRV-CRON-ERROR] a failed read answers 500 read_failed and writes nothing', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    lapsedResult = { data: null, error: { code: 'XX000' } }

    const res = await POST(makeRequest('Bearer test-secret'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('read_failed')
    expect(body.expired).toBeUndefined()
    expect(updateCalls).toHaveLength(0)
    expect(consoleError).toHaveBeenCalledTimes(1)
  })

  it('a failed NULL-expiry count answers 500 read_failed and writes nothing', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    lapsedResult = { data: [{ id: 'l1' }], error: null }
    nullCountResult = { count: null, error: { code: 'XX000' } }

    const res = await POST(makeRequest('Bearer test-secret'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('read_failed')
    expect(updateCalls).toHaveLength(0)
    expect(consoleError).toHaveBeenCalledTimes(1)
  })
})

describe('GET /api/cron/listings-expiry (Vercel invocation)', () => {
  it('unauthorized caller → 401', async () => {
    const res = await GET(makeRequest('Bearer wrong-secret', 'GET'))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('unauthorized')
  })

  it('authorized, lapsed active listings → same result as POST', async () => {
    lapsedResult = { data: [{ id: 'l1' }, { id: 'l2' }], error: null }
    nullCountResult = { count: 1, error: null }

    const res = await GET(makeRequest('Bearer test-secret', 'GET'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.expired).toBe(0)
    expect(body.would_expire).toBe(2)
    expect(body.would_expire_ids).toEqual(['l1', 'l2'])
    expect(body.errors).toBe(0)
    expect(body.null_expiry_active).toBe(1)
    expect(updateCalls).toHaveLength(0)
  })
})

describe('CRON_SECRET unset → every call refused (fail closed)', () => {
  it.each([
    ['GET', GET],
    ['POST', POST],
  ] as const)('%s → 401 and no listing is touched', async (method, handler) => {
    delete process.env.CRON_SECRET
    lapsedResult = { data: [{ id: 'l1' }], error: null }

    const res = await handler(makeRequest(undefined, method))
    expect(res.status).toBe(401)
    expect(updateCalls).toHaveLength(0)

    const withHeader = await handler(makeRequest('Bearer undefined', method))
    expect(withHeader.status).toBe(401)
    expect(updateCalls).toHaveLength(0)
  })
})
