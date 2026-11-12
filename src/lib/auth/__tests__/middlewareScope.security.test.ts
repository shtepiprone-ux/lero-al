// @vitest-environment node
/**
 * Security (Task 923 R68 (b), R72 (e)): which requests `src/proxy.ts` (Next 16 name of the former middleware) refreshes the session on, and the default language it routes with.
 *  - SEC-X-SRV-SESSION-REFRESH-SCOPE: the session is refreshed on /admin and on the API routes, so a refused (banned or deleted) session ends there too (R45 (a)) and an
 *    expired one is renewed before a page or handler reads it; the routes that carry no session (the cron jobs and the Auth e-mail hook) are left out of the matcher;
 *    /admin and /api get no locale routing (no prefix, no redirect).
 *  - R72 (e): the staff-chosen default language drives locale routing, is cached for five minutes, accepts only the four supported languages, and the service-role key
 *    goes only to the Supabase REST address. (Before Task 952 an older copy of this logic sat in a `src/proxy.ts` that Next 15 never ran; Next 16 runs `src/proxy.ts` itself, and it is the only gate.)
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
  const { config } = await import('@/proxy')
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
    const { proxy } = await import('@/proxy')
    for (const path of ['/admin/users', '/api/presence', '/api', '/admin']) {
      state.getUserCalls = 0
      const res = await proxy(req(path))
      expect(state.getUserCalls, `${path} refreshes the session`).toBe(1)
      expect(res.headers.get('x-intl-path'), `${path} is not locale routed`).toBeNull()
      expect(res.headers.get('location'), `${path} is not redirected`).toBeNull()
    }
    expect(fetch).not.toHaveBeenCalled()                                  // not even the default-locale lookup runs for them

    // the control: a page of the site still gets the session refresh AND locale routing
    state.getUserCalls = 0
    const page = await proxy(req('/sq/listings'))
    expect(state.getUserCalls).toBe(1)
    expect(page.headers.get('x-intl-path')).toBe('/sq/listings')
  })

  it('[Task 964 AC1] robots.txt and each sitemap file are left out of the proxy, and nothing that only resembles them is', async () => {
    // the crawler documents: no session to refresh and no language prefix, so next-intl never redirects them to /sq/robots.txt (a 404)
    // (Revision 1, R1-3: an id of one to three digits; a route that serves request-time ids caches every path it answers, 404 included, so a fourth digit keeps the
    // proxy, which sends it to a 404 page, and the paths an anonymous visitor can add to the cache stay at 1 110)
    for (const path of ['/robots.txt', '/sitemap/0.xml', '/sitemap/12.xml', '/sitemap/999.xml']) {
      expect(await matcherMatches(path), `${path} is left out`).toBe(false)
    }
    // every other path keeps its session refresh and language routing
    for (const path of ['/robots.txt.bak', '/sitemapx', '/sitemap', '/sitemap.xml', '/sitemap/abc.xml', '/sitemap/0.xml/x', '/sitemap/1234.xml', '/sq/listings', '/admin']) {
      expect(await matcherMatches(path), `${path} is still matched`).toBe(true)
    }
  })

  it('the default language set by staff drives the locale routing, is cached for five minutes and is checked against the four languages', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-20T10:00:00Z'))
    const fetchSpy = fetchOk('en')
    vi.stubGlobal('fetch', fetchSpy)
    const { proxy } = await import('@/proxy')
    const res = await proxy(req('/'))
    expect(res.headers.get('x-intl-default')).toBe('en')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    // the key goes to the Supabase REST address and nowhere else
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, { headers: Record<string, string> }]
    expect(url.startsWith('https://x.supabase.co/rest/v1/site_settings?key=eq.default_locale')).toBe(true)
    expect(init.headers.apikey).toBe('service-SECRET')
    // cached: a second request inside five minutes does not ask again; after five minutes it does
    await proxy(req('/sq'))
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    vi.setSystemTime(new Date('2026-10-20T10:05:01Z'))
    await proxy(req('/sq'))
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('a value that is not one of the four languages, a failed lookup and a timeout keep Albanian', async () => {
    for (const answer of [fetchOk('xx'), vi.fn(async () => { throw new Error('timeout') }), vi.fn(async () => ({ ok: false }) as unknown as Response)]) {
      vi.resetModules()
      vi.stubGlobal('fetch', answer)
      const { proxy } = await import('@/proxy')
      const res = await proxy(req('/'))
      expect(res.headers.get('x-intl-default')).toBe('sq')
    }
  })
})
