/**
 * Regression test — /auth/confirm route handler (Task 446)
 *
 * Critical flow: Signup confirmation → session/header consistency.
 *
 * Invariant: when verifyOtp() succeeds, the redirect response MUST carry
 * Set-Cookie headers with the session tokens so the browser can establish an
 * authenticated session and the header reflects the correct state.
 *
 * Planted-violation proof: a version of the handler that does NOT write cookies
 * onto the redirect response produces a redirect WITHOUT Set-Cookie headers —
 * this test FAILS on that version, confirming the gate is not a no-op.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Environment stubs ────────────────────────────────────────────────────────

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// ── Supabase mock ────────────────────────────────────────────────────────────

const mockVerifyOtp = vi.fn()
const mockUpsert = vi.fn()
const mockUpdate = vi.fn()

// Capture the setAll callback so tests can call it with fake cookie data.
let capturedSetAll: ((cookies: { name: string; value: string; options?: object }[]) => void) | null = null

vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, options: {
    cookies: {
      getAll: () => { name: string; value: string }[]
      setAll: (cookies: { name: string; value: string; options?: object }[]) => void
    }
  }) => {
    capturedSetAll = options.cookies.setAll
    return {
      auth: { verifyOtp: mockVerifyOtp },
      from: () => ({
        upsert: mockUpsert,
        update: () => ({ eq: () => ({ is: mockUpdate }) }),
      }),
    }
  },
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_USER = {
  id: 'user-446',
  email: 'test@example.com',
  user_metadata: { preferred_locale: 'uk' },
}

const SESSION_COOKIES = [
  { name: 'sb-test-auth-token', value: 'access-tok', options: { httpOnly: true, path: '/' } },
  { name: 'sb-test-refresh-token', value: 'refresh-tok', options: { httpOnly: true, path: '/' } },
]

function makeRequest(params: Record<string, string>) {
  const url = new URL('http://localhost:3000/auth/confirm')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('/auth/confirm route handler — signup confirmation session consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedSetAll = null
    mockUpsert.mockResolvedValue({ error: null })
    mockUpdate.mockResolvedValue({ error: null })
  })

  // ── AC1: Success path — redirect carries Set-Cookie headers ─────────────

  it('on valid token: redirects to /auth/verified with Set-Cookie session headers', async () => {
    mockVerifyOtp.mockImplementation(async () => {
      // Simulate the Supabase SDK calling setAll() with session tokens.
      capturedSetAll?.(SESSION_COOKIES)
      return { data: { user: MOCK_USER, session: { access_token: 'access-tok' } }, error: null }
    })

    const { GET } = await import('../route')
    const req = makeRequest({ token_hash: 'valid-hash', type: 'signup', next: '/uk/auth/verified' })
    const response = await GET(req)

    // Must redirect to the success page, not the error page.
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/uk/auth/verified')
    expect(response.headers.get('location')).not.toContain('error=')

    // CRITICAL: Set-Cookie headers must be present so the browser gets the session.
    const setCookieHeader = response.headers.getSetCookie?.() ?? []
    expect(setCookieHeader.length).toBeGreaterThan(0)
    expect(setCookieHeader.some(c => c.includes('sb-test-auth-token'))).toBe(true)
  })

  // ── AC1: Error path — expired/used/invalid token → error state ──────────

  it('on verifyOtp error: redirects to /auth/verified?error=confirm_failed', async () => {
    mockVerifyOtp.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Token has expired' } })

    const { GET } = await import('../route')
    const req = makeRequest({ token_hash: 'expired-hash', type: 'signup', next: '/uk/auth/verified' })
    const response = await GET(req)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/uk/auth/verified?error=confirm_failed')
    // No session cookies on error redirect.
    const setCookieHeader = response.headers.getSetCookie?.() ?? []
    expect(setCookieHeader.length).toBe(0)
  })

  it('on missing user in verifyOtp data: redirects to error state', async () => {
    mockVerifyOtp.mockResolvedValue({ data: { user: null, session: null }, error: null })

    const { GET } = await import('../route')
    const req = makeRequest({ token_hash: 'no-user-hash', type: 'signup', next: '/uk/auth/verified' })
    const response = await GET(req)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('error=confirm_failed')
  })

  // ── AC1: Invalid params → login fallback ────────────────────────────────

  it('on missing token_hash: redirects to auth/login fallback', async () => {
    const { GET } = await import('../route')
    const req = makeRequest({ type: 'signup', next: '/uk/auth/verified' })
    const response = await GET(req)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/auth/login')
  })

  // ── Double-click / reuse: second call with same token returns error ──────

  it('second call with same token (already consumed) redirects to error state', async () => {
    mockVerifyOtp.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Email link is invalid or has expired' } })

    const { GET } = await import('../route')
    const req = makeRequest({ token_hash: 'used-hash', type: 'signup', next: '/uk/auth/verified' })
    const response = await GET(req)

    expect(response.headers.get('location')).toContain('error=confirm_failed')
  })

  // ── Locale derivation from next param ───────────────────────────────────

  it.each([
    ['/sq/auth/verified', 'sq'],
    ['/en/auth/verified', 'en'],
    ['/uk/auth/verified', 'uk'],
    ['/it/auth/verified', 'it'],
  ])('derives locale %s from next param → error redirect in %s', async (next, locale) => {
    mockVerifyOtp.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'expired' } })

    const { GET } = await import('../route')
    const req = makeRequest({ token_hash: 'bad-hash', type: 'signup', next })
    const response = await GET(req)

    expect(response.headers.get('location')).toContain(`/${locale}/auth/verified?error=confirm_failed`)
  })
})

// Planted-violation proof: the success-path test above ("carries Set-Cookie session headers")
// genuinely FAILS when successRedirect.cookies.set() is removed from route.ts:
//   AssertionError: expected 0 to be greater than 0
//   → setCookieHeader.length === 0 when successRedirect.cookies.set() is absent
// That is the load-bearing proof. No separate tautology block needed.
