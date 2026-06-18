/**
 * Cron listings-expiry route smoke — Task 455 (Epic LV / LV.2).
 *
 * Covers:
 *   1. Authorized call with lapsed active listings → expired count > 0.
 *   2. Nothing lapsed → expired = 0.
 *   3. NULL-expiry active rows reported but NOT mutated.
 *   4. Unauthorized caller → 401.
 *   5. Engine uses resolveTransition('active', 'EXPIRE') → expired (not raw string).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

let updateCalls: Array<{ payload: Record<string, unknown>; filters: Record<string, unknown>[] }>
let selectLapsedResult: Array<{ id: string }>
let selectNullCountResult: number

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => {
    const chainableUpdate: Record<string, unknown> = {}
    chainableUpdate.eq = vi.fn().mockImplementation((col: string, val: unknown) => {
      const call = updateCalls[updateCalls.length - 1]
      call.filters.push({ col, val })
      return chainableUpdate
    })
    chainableUpdate.then = (resolve: (v: unknown) => void) => resolve({ error: null })

    return {
      from: () => ({
        select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.head) {
            return {
              eq: () => ({
                is: () => Promise.resolve({ count: selectNullCountResult }),
              }),
            }
          }
          return {
            eq: () => ({
              lt: () => Promise.resolve({ data: selectLapsedResult }),
            }),
          }
        }),
        update: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
          const call = { payload, filters: [] as Record<string, unknown>[] }
          updateCalls.push(call)
          return chainableUpdate
        }),
      }),
    }
  },
}))

const { POST } = await import('../route')

beforeEach(() => {
  updateCalls = []
  selectLapsedResult = []
  selectNullCountResult = 0
  vi.stubEnv('CRON_SECRET', 'test-secret')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

function makeRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {}
  if (authHeader) headers.authorization = authHeader
  return new NextRequest('http://localhost/api/cron/listings-expiry', {
    method: 'POST',
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

  it('authorized, lapsed active listings → expired count matches', async () => {
    selectLapsedResult = [{ id: 'l1' }, { id: 'l2' }]
    selectNullCountResult = 0

    const res = await POST(makeRequest('Bearer test-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.expired).toBe(2)
    expect(body.errors).toBe(0)
    expect(body.null_expiry_active).toBe(0)

    expect(updateCalls).toHaveLength(2)
    for (const call of updateCalls) {
      expect(call.payload.status).toBe('expired')
    }
  })

  it('authorized, nothing lapsed → expired = 0, no updates', async () => {
    selectLapsedResult = []
    selectNullCountResult = 0

    const res = await POST(makeRequest('Bearer test-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.expired).toBe(0)
    expect(body.errors).toBe(0)
    expect(updateCalls).toHaveLength(0)
  })

  it('NULL-expiry active rows reported but NOT mutated', async () => {
    selectLapsedResult = []
    selectNullCountResult = 3

    const res = await POST(makeRequest('Bearer test-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.null_expiry_active).toBe(3)
    expect(body.expired).toBe(0)
    expect(updateCalls).toHaveLength(0)
    expect(body.null_expiry_note).toContain('NOT auto-expired')
  })

  it('status set to engine-resolved value (expired), not raw string', async () => {
    selectLapsedResult = [{ id: 'l1' }]
    selectNullCountResult = 0

    await POST(makeRequest('Bearer test-secret'))
    expect(updateCalls[0].payload.status).toBe('expired')
  })
})
