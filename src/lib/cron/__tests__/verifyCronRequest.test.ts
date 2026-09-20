/**
 * verifyCronRequest — Task 851 (Sprint 78).
 *
 * Fail-closed bearer check shared by every /api/cron/* route:
 *   unset secret → 401, empty secret → 401, wrong bearer → 401, missing header → 401,
 *   exact `Bearer ${CRON_SECRET}` → ok.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { verifyCronRequest } from '../verifyCronRequest'

afterEach(() => {
  vi.unstubAllEnvs()
})

function makeRequest(authHeader?: string, method: 'GET' | 'POST' = 'GET'): NextRequest {
  const headers: Record<string, string> = {}
  if (authHeader !== undefined) headers.authorization = authHeader
  return new NextRequest('http://localhost/api/cron/any', { method, headers })
}

async function expectUnauthorized(result: ReturnType<typeof verifyCronRequest>) {
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.response.status).toBe(401)
  expect(await result.response.json()).toEqual({ error: 'unauthorized' })
}

describe('verifyCronRequest', () => {
  it('correct secret → ok (GET and POST)', () => {
    vi.stubEnv('CRON_SECRET', 'test-secret')
    expect(verifyCronRequest(makeRequest('Bearer test-secret', 'GET'))).toEqual({ ok: true })
    expect(verifyCronRequest(makeRequest('Bearer test-secret', 'POST'))).toEqual({ ok: true })
  })

  it('wrong secret → 401', async () => {
    vi.stubEnv('CRON_SECRET', 'test-secret')
    await expectUnauthorized(verifyCronRequest(makeRequest('Bearer wrong-secret')))
  })

  it('missing Authorization header → 401', async () => {
    vi.stubEnv('CRON_SECRET', 'test-secret')
    await expectUnauthorized(verifyCronRequest(makeRequest()))
  })

  it('bare secret without the Bearer scheme → 401', async () => {
    vi.stubEnv('CRON_SECRET', 'test-secret')
    await expectUnauthorized(verifyCronRequest(makeRequest('test-secret')))
  })

  it('CRON_SECRET unset → 401 even when a header is sent (fail closed)', async () => {
    vi.stubEnv('CRON_SECRET', undefined as unknown as string)
    delete process.env.CRON_SECRET
    await expectUnauthorized(verifyCronRequest(makeRequest('Bearer undefined')))
    await expectUnauthorized(verifyCronRequest(makeRequest()))
  })

  it('CRON_SECRET empty → 401, including for a literal "Bearer " header', async () => {
    vi.stubEnv('CRON_SECRET', '')
    await expectUnauthorized(verifyCronRequest(makeRequest('Bearer ')))
    await expectUnauthorized(verifyCronRequest(makeRequest()))
  })
})
