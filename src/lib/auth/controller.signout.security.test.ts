// @vitest-environment jsdom
/**
 * Security (Task 923 R66 (l)): signing out leaves no session in the browser, even when the logout request fails.
 *  - SEC-X-FE-SIGNOUT-CLEARS: the REAL AuthController, the REAL browser Supabase client and the installed @supabase/auth-js / @supabase/ssr run; only the network is the
 *    double. A session cookie is seeded, the logout endpoint answers 500, and after `signOut()` no session cookie remains and the status is `unauthenticated`.
 * The first test states the premise: the SDK alone keeps the session after such an answer, which is what the controller has to repair.
 * Every value below is a synthetic placeholder.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const REF = 'synthref'
const COOKIE = `sb-${REF}-auth-token`

function seedSession() {
  const session = {
    access_token: 'synthetic.access.token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'synthetic-refresh-token',
    user: { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'synthetic@example.test', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
  }
  const encoded = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')
  document.cookie = `${COOKIE}=base64-${encoded}; Path=/`
}

const sessionCookies = () => document.cookie.split(';').map((c) => c.trim()).filter((c) => c.startsWith(COOKIE))

const logoutRequests: string[] = []
function answerLogoutWith(status: number) {
  vi.stubGlobal('fetch', vi.fn(async (input: unknown) => {
    logoutRequests.push(String(input))
    return new Response(JSON.stringify({ message: 'synthetic failure' }), { status, headers: { 'content-type': 'application/json' } })
  }))
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', `https://${REF}.supabase.co`)
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'synthetic-anon-key')
  logoutRequests.length = 0
  for (const c of sessionCookies()) document.cookie = `${c.split('=')[0]}=; Max-Age=0; Path=/`
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('controller.signout', () => {
  it('premise: the SDK alone keeps the session when the logout request fails', async () => {
    const { createClient } = await import('@/lib/supabase/client')
    seedSession()
    answerLogoutWith(500)
    const { error } = await createClient().auth.signOut()
    expect(error).not.toBeNull()
    expect(logoutRequests.some((u) => u.includes('/auth/v1/logout'))).toBe(true)
    expect(sessionCookies().length).toBeGreaterThan(0)
  })

  it('[SEC-X-FE-SIGNOUT-CLEARS] a failed logout request still clears the browser session', async () => {
    const { AuthController } = await import('./controller')
    seedSession()
    answerLogoutWith(500)
    const controller = new AuthController({ status: 'authenticated', user: { id: '00000000-0000-4000-8000-000000000001' } as never })
    await controller.signOut()
    expect(logoutRequests.some((u) => u.includes('/auth/v1/logout'))).toBe(true)   // the request was made and failed
    expect(sessionCookies()).toEqual([])                                            // no session is left in the browser
    expect(controller.getState()).toEqual({ status: 'unauthenticated', user: null })
  })

  it('a network failure of the logout request clears the session as well', async () => {
    const { AuthController } = await import('./controller')
    seedSession()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network down') }))
    const controller = new AuthController({ status: 'authenticated', user: { id: '00000000-0000-4000-8000-000000000001' } as never })
    await controller.signOut()
    expect(sessionCookies()).toEqual([])
    expect(controller.getState().status).toBe('unauthenticated')
  })

  it('a successful logout clears the session through the SDK, with one logout request (the control)', async () => {
    const { AuthController } = await import('./controller')
    seedSession()
    answerLogoutWith(204)
    const controller = new AuthController({ status: 'authenticated', user: { id: '00000000-0000-4000-8000-000000000001' } as never })
    await controller.signOut()
    expect(logoutRequests.filter((u) => u.includes('/auth/v1/logout'))).toHaveLength(1)
    expect(sessionCookies()).toEqual([])
    expect(controller.getState().status).toBe('unauthenticated')
  })
})
