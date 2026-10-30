// @vitest-environment node
/**
 * Task 923 R45 (a) (owner decisions D26, D29): `refreshSession` ends a session that Auth refuses. The SDK is the double (its `getUser` answer and `signOut` are
 * recorded); the response cookies come from the `setAll` callback the code gives the SDK, exactly as in the middleware. A real Auth round trip is
 * `sessionEnd.integration.test.ts`. The cases that also call the database functions of R37 / R45 (b) are added with that part.
 */
import { NextRequest } from 'next/server'
import { beforeEach, expect, it, vi } from 'vitest'

const sdk = vi.hoisted(() => ({
  getUserError: null as null | { code?: string; status?: number; message: string },
  signOuts: [] as unknown[],
  setAll: null as null | ((rows: { name: string; value: string; options: Record<string, unknown> }[]) => void),
}))
vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: { setAll: typeof sdk.setAll } }) => {
    sdk.setAll = options.cookies.setAll
    return {
      auth: {
        getUser: async () => ({ data: { user: sdk.getUserError ? null : { id: 'u1' } }, error: sdk.getUserError }),
        // like the SDK: a local sign-out removes the session and writes the cleared cookies through setAll
        signOut: async (scope: unknown) => { sdk.signOuts.push(scope); sdk.setAll?.([{ name: 'sb-test-auth-token', value: '', options: { maxAge: 0 } }]); return { error: null } },
      },
    }
  },
}))

import { refreshSession } from './middleware'

beforeEach(() => {
  sdk.getUserError = null
  sdk.signOuts.length = 0
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-for-tests'
})

const request = () => new NextRequest('https://lero.al/sq', { headers: { cookie: 'sb-test-auth-token=abc' } })

it.each([['user_banned'], ['user_not_found']])('ends the session locally when Auth answers %s, and the response clears the auth cookie', async (code) => {
  sdk.getUserError = { code, status: 403, message: code }
  const res = await refreshSession(request())
  expect(sdk.signOuts).toEqual([{ scope: 'local' }])
  expect(res.cookies.get('sb-test-auth-token')?.value).toBe('')
})

it.each([
  ['a network failure', { message: 'fetch failed' }],
  ['an expired token', { code: 'bad_jwt', status: 401, message: 'invalid JWT' }],
  ['a missing session', { code: 'session_not_found', status: 403, message: 'no session' }],
  ['a rate limit', { code: 'over_request_rate_limit', status: 429, message: 'slow down' }],
])('changes nothing on %s', async (_label, error) => {
  sdk.getUserError = error
  const res = await refreshSession(request())
  expect(sdk.signOuts).toEqual([])
  expect(res.cookies.getAll()).toEqual([])
})

it('changes nothing for an active person', async () => {
  const res = await refreshSession(request())
  expect(sdk.signOuts).toEqual([])
  expect(res.cookies.getAll()).toEqual([])
})

// ── Task 923 R162: the two cases of the contract, under their exact names. The conditions are those above, stated as one invariant each. ──────────────────────────────────

it('[SEC-D29-SRV-DENY] A banned, deleted or no-access session is ended by the server on the next page request and the person is a guest', async () => {
  // every status without access carries an Auth ban (`banDurationFor`), so `user_banned` is the answer for a blocked or inactive account and `user_not_found` for a deleted one
  for (const code of ['user_banned', 'user_not_found']) {
    sdk.getUserError = { code, status: 403, message: code }
    sdk.signOuts.length = 0
    const req = request()
    expect(req.cookies.get('sb-test-auth-token')?.value, `${code}: precondition: the request carries the auth cookie`).toBe('abc')
    const res = await refreshSession(req)
    expect(sdk.signOuts, `${code}: the session is ended once, locally`).toEqual([{ scope: 'local' }])
    expect(res.cookies.get('sb-test-auth-token')?.value, `${code}: the response clears the auth cookie, so the next render is a guest's`).toBe('')
    expect(req.cookies.get('sb-test-auth-token')?.value, `${code}: the cleared cookie is the one the page then sees`).toBe('')
  }
})

it('[SEC-D29-SRV-ALLOW] A banned, deleted or no-access session is ended by the server on the next page request and the person is a guest', async () => {
  const cases: [string, { code?: string; status?: number; message: string } | null][] = [
    ['an active person', null],
    ['a network failure', { message: 'fetch failed' }],
    ['an expired refresh token', { code: 'refresh_token_not_found', status: 400, message: 'Invalid Refresh Token: Refresh Token Not Found' }],
  ]
  for (const [label, error] of cases) {
    sdk.getUserError = error
    sdk.signOuts.length = 0
    const req = request()
    const res = await refreshSession(req)
    expect(sdk.signOuts, `${label}: no sign-out`).toEqual([])
    expect(res.cookies.getAll(), `${label}: the response sets and clears nothing`).toEqual([])
    expect(req.cookies.get('sb-test-auth-token')?.value, `${label}: the session cookie stays as it was`).toBe('abc')
  }
})
