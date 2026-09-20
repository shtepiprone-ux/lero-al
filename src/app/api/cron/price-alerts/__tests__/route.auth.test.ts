/**
 * /api/cron/price-alerts auth boundary — Task 851 (Sprint 78).
 *
 * Vercel invokes cron routes with GET; owners may still trigger with POST. Both must
 * be refused (401) BEFORE any Supabase client is created when the secret is missing,
 * unset, or wrong.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const createAdminClient = vi.fn(() => {
  throw new Error('createAdminClient must not be called for an unauthorized request')
})

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => createAdminClient() }))
vi.mock('@/modules/notifications/lib/emails/send', () => ({ sendEmail: vi.fn() }))
vi.mock('@/modules/notifications/lib/sendTemplatedEmail', () => ({ sendTemplatedEmail: vi.fn() }))
vi.mock('@/modules/notifications/lib/mutations', () => ({ createNotification: vi.fn() }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({
  applyListingTransitionByStatus: vi.fn(),
}))

const { GET, POST } = await import('../route')

beforeEach(() => {
  createAdminClient.mockClear()
  vi.stubEnv('CRON_SECRET', 'test-secret')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

function makeRequest(method: 'GET' | 'POST', authHeader?: string): NextRequest {
  const headers: Record<string, string> = {}
  if (authHeader) headers.authorization = authHeader
  return new NextRequest('http://localhost/api/cron/price-alerts', { method, headers })
}

describe.each([
  ['GET', GET],
  ['POST', POST],
] as const)('price-alerts %s auth', (method, handler) => {
  it('wrong secret → 401, no Supabase call', async () => {
    const res = await handler(makeRequest(method, 'Bearer wrong-secret'))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'unauthorized' })
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('no Authorization header → 401, no Supabase call', async () => {
    const res = await handler(makeRequest(method))
    expect(res.status).toBe(401)
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('CRON_SECRET unset → 401, no Supabase call', async () => {
    delete process.env.CRON_SECRET
    const res = await handler(makeRequest(method, 'Bearer undefined'))
    expect(res.status).toBe(401)
    expect(createAdminClient).not.toHaveBeenCalled()
  })
})
