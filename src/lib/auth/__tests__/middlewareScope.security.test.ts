// @vitest-environment node
/**
 * Security (Task 923 R68 (b), R72 (e)): which requests `src/middleware.ts` refreshes the session on, and the default language it routes with.
 *  - SEC-X-SRV-SESSION-REFRESH-SCOPE: the session is refreshed on /admin and on the API routes, so a refused (banned or deleted) session ends there too (R45 (a)) and an
 *    expired one is renewed before a page or handler reads it; the routes that carry no session (the cron jobs and the Auth e-mail hook) are left out of the matcher;
 *    /admin and /api get no locale routing (no prefix, no redirect).
 *  - R72 (e): the staff-chosen default language drives locale routing, is cached for five minutes, accepts only the four supported languages, and the service-role key
 *    goes only to the Supabase REST address. (`src/proxy.ts` used to hold this logic and was never run by this Next.js version.)
 * The real middleware runs; the Supabase client, next-intl's middleware and the network are doubles. Every value is synthetic.
 */
import { NextRequest, NextResponse } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = { getUserCalls: 0 }
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getUser: async () => { state.getUserCalls++; return { data: {} } } } }),
}))
const intl: { configs: Record<string, unknown>[] } = { configs: [] }
vi.mock('next-intl/middleware', () => ({
  default: (config: Record<string, unknown>) => {
    intl.configs.push(config)
    return (req: NextRequest) => {
      const r = NextResponse.next()
      r.headers.set('x-intl-default', String(config.defaultLocale))
      r.headers.set('x-intl-path', req.nextUrl.pathname)
      return r
    }
  },
}))
vi.mock('@/i18n/routing', () => ({ routing: { locales: ['sq', 'en', 'uk', 'it'], defaultLocale: 'sq' } }))

const ENV = { ...process.env }
const req = (path: string) => new NextRequest(`https://lero.al${path}`)
const fetchOk = (value: unknown) => vi.fn(async () => ({ ok: true, json: async () => [{ value }] }) as unknown as Response)

beforeEach(() => {
  state.getUserCalls = 0
  intl.configs = []
  vi.resetModules()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-SECRET'
})
afterEach(() => { process.env = { ...ENV }; vi.unstubAllGlobals(); vi.useRealTimers() })

const matcherMatches = async (path: string) => {
  const { config } = await import('@/middleware')
  return new RegExp(`^${config.matcher[0]}$`).test(path)
}

describe('middlewareScope', () => {
  it('[SEC-X-SRV-SESSION-REFRESH-SCOPE] admin and API requests refresh the session', async () => {
    vi.stubGlobal('fetch', fetchOk('en'))
    // the matcher: /admin and the session-carrying API routes are in, the cron jobs and the Auth hook are out
    for (const path of ['/admin', '/admin/users', '/admin/users/00000000-0000-4000-8000-0000000000aa', '/api/presence', '/api/auth/me', '/api/upload-avatar', '/api/listings']) {
      expect(await matcherMatches(path), `${path} is refreshed`).toBe(true)
    }
    for (const path of ['/api/cron/inactivity', '/api/cron/saved-searches', '/api/auth-email-hook', '/auth/callback', '/auth/confirm', '/_next/static/chunk.js', '/favicon.ico']) {
      expect(await matcherMatches(path), `${path} is left out`).toBe(false)
    }

    // the middleware: the session is refreshed on /admin and /api, and nothing is routed by locale there
    const { middleware } = await import('@/middleware')
    for (const path of ['/admin/users', '/api/presence', '/api', '/admin']) {
      state.getUserCalls = 0
      const res = await middleware(req(path))
      expect(state.getUserCalls, `${path} refreshes the session`).toBe(1)
      expect(res.headers.get('x-intl-path'), `${path} is not locale routed`).toBeNull()
      expect(res.headers.get('location'), `${path} is not redirected`).toBeNull()
    }
    expect(fetch).not.toHaveBeenCalled()                                  // not even the default-locale lookup runs for them

    // the control: a page of the site still gets the session refresh AND locale routing
    state.getUserCalls = 0
    const page = await middleware(req('/sq/listings'))
    expect(state.getUserCalls).toBe(1)
    expect(page.headers.get('x-intl-path')).toBe('/sq/listings')
  })

  it('the default language set by staff drives the locale routing, is cached for five minutes and is checked against the four languages', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-20T10:00:00Z'))
    const fetchSpy = fetchOk('en')
    vi.stubGlobal('fetch', fetchSpy)
    const { middleware } = await import('@/middleware')
    const res = await middleware(req('/'))
    expect(res.headers.get('x-intl-default')).toBe('en')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    // the key goes to the Supabase REST address and nowhere else
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, { headers: Record<string, string> }]
    expect(url.startsWith('https://x.supabase.co/rest/v1/site_settings?key=eq.default_locale')).toBe(true)
    expect(init.headers.apikey).toBe('service-SECRET')
    // cached: a second request inside five minutes does not ask again; after five minutes it does
    await middleware(req('/sq'))
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    vi.setSystemTime(new Date('2026-10-20T10:05:01Z'))
    await middleware(req('/sq'))
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('a value that is not one of the four languages, a failed lookup and a timeout keep Albanian', async () => {
    for (const answer of [fetchOk('xx'), vi.fn(async () => { throw new Error('timeout') }), vi.fn(async () => ({ ok: false }) as unknown as Response)]) {
      vi.resetModules()
      vi.stubGlobal('fetch', answer)
      const { middleware } = await import('@/middleware')
      const res = await middleware(req('/'))
      expect(res.headers.get('x-intl-default')).toBe('sq')
    }
  })
})
