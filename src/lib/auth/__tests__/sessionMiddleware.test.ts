// @vitest-environment node
/**
 * Session refresh and routing at the edge (Task 923 Revision 7): refreshSession and the proxy (`src/proxy.ts`, the Next 16 name of the middleware; Task 952 merged the two former test groups, one file is live).
 *  - the refreshed auth cookies reach the browser with the options Supabase chose (httpOnly / secure / sameSite are never weakened);
 *  - the service-role key goes only to the Supabase REST address, and a locale value from the database is checked against the four supported ones;
 *  - /admin and /api never get a locale prefix; a timed-out database call keeps the previous behaviour instead of failing the request.
 */
import { NextRequest, NextResponse } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type CookieOpts = { name: string; value: string; options?: Record<string, unknown> }
const state = { getUserCalls: 0, order: [] as string[], toSet: [] as CookieOpts[], clientOptions: null as null | { cookies: { getAll: () => unknown[]; setAll: (c: CookieOpts[]) => void } } }
vi.mock('@supabase/ssr', () => ({
  createServerClient: (_u: string, _k: string, options: NonNullable<typeof state.clientOptions extends null ? never : typeof state.clientOptions>) => {
    state.order.push('create')
    state.clientOptions = options
    return { auth: { getUser: async () => { state.order.push('getUser'); state.getUserCalls++; options.cookies.setAll(state.toSet); return { data: {} } } } }
  },
}))
const intl: { configs: Record<string, unknown>[] } = { configs: [] }
vi.mock('next-intl/middleware', () => ({
  default: (config: Record<string, unknown>) => { intl.configs.push(config); return (req: NextRequest) => { const r = NextResponse.next(); r.headers.set('x-intl-default', String(config.defaultLocale)); r.headers.set('x-intl-path', req.nextUrl.pathname); return r } },
}))
vi.mock('@/i18n/routing', () => ({ routing: { locales: ['sq', 'en', 'uk', 'it'], defaultLocale: 'sq' } }))

const ENV = { ...process.env }
const req = (path: string, cookie?: string) => new NextRequest(`https://lero.al${path}`, cookie ? { headers: { cookie } } : undefined)

beforeEach(() => {
  state.getUserCalls = 0
  state.order = []
  state.toSet = []
  state.clientOptions = null
  intl.configs = []
  vi.resetModules()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-SECRET'
})
afterEach(() => { process.env = { ...ENV }; vi.unstubAllGlobals(); vi.useRealTimers() })

describe('refreshSession', () => {
  it('reads the request\'s cookies and asks Supabase for the user straight after creating the client', async () => {
    const { refreshSession } = await import('../middleware')
    await refreshSession(req('/sq', 'a=1; b=2'))
    expect(state.clientOptions!.cookies.getAll().map((c) => (c as { name: string }).name)).toEqual(['a', 'b'])
    expect(state.order).toEqual(['create', 'getUser'])
  })

  it('puts every refreshed cookie on the response with its options unchanged, and on the request for later reads', async () => {
    state.toSet = [{ name: 'sb-access', value: 'new', options: { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 3600 } }]
    const { refreshSession } = await import('../middleware')
    const request = req('/sq', 'sb-access=old')
    const res = await refreshSession(request)
    const set = res.cookies.get('sb-access')!
    expect(set.value).toBe('new')
    expect(set).toMatchObject({ httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 3600 })
    expect(request.cookies.get('sb-access')?.value).toBe('new')
  })

  it('without a refresh it passes the request through and sets no cookie', async () => {
    const { refreshSession } = await import('../middleware')
    const res = await refreshSession(req('/sq'))
    expect(res.cookies.getAll()).toEqual([])
  })
})

describe('proxy.ts: session cookies and matcher', () => {
  it('copies the refreshed session cookies onto the localised response', async () => {
    state.toSet = [{ name: 'sb', value: 'v', options: { httpOnly: true } }]
    const { proxy } = await import('@/proxy')
    const res = await proxy(req('/sq/listings'))
    expect(res.cookies.get('sb')).toMatchObject({ value: 'v', httpOnly: true })
    expect(res.headers.get('x-intl-path')).toBe('/sq/listings')
  })

  describe('matcher', () => {
    const matches = async (path: string) => {
      const { config } = await import('@/proxy')
      return new RegExp(`^${config.matcher[0]}$`).test(path)
    }
    it.each(['/', '/sq', '/en/listings', '/uk/listings/some-slug', '/it/cabinet'])('%s gets locale routing and session refresh', async (p) => { expect(await matches(p)).toBe(true) })
    // Task 923 R68 (b): every /api route except the cron and the e-mail hook, and /admin, get the session refresh, so an expired or refused session is renewed or ended there too
    it.each(['/api/auth/me', '/admin/users'])('%s gets the session refresh (R68 (b))', async (p) => { expect(await matches(p)).toBe(true) })
    it.each(['/auth/callback', '/_next/static/chunk.js', '/_next/image', '/favicon.ico', '/logo.svg', '/photo.PNG'.toLowerCase()])('%s is left alone', async (p) => { expect(await matches(p)).toBe(false) })
  })
})

describe('proxy.ts: default locale', () => {
  const fetchOk = (value: unknown) => vi.fn(async () => ({ ok: true, json: async () => [{ value }] }) as unknown as Response)

  it('/admin and /api are never given a locale prefix, but the session is still refreshed', async () => {
    vi.stubGlobal('fetch', fetchOk('en'))
    const { proxy } = await import('@/proxy')
    for (const p of ['/admin/users', '/api/anything', '/api']) {
      const res = await proxy(req(p))
      expect(res.headers.get('x-intl-path')).toBeNull()
    }
    expect(state.getUserCalls).toBe(3)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('takes the default locale from the database and sends the service key only to the Supabase address', async () => {
    const f = fetchOk('it')
    vi.stubGlobal('fetch', f)
    const { proxy } = await import('@/proxy')
    const res = await proxy(req('/listings'))
    expect(res.headers.get('x-intl-default')).toBe('it')
    const [url, init] = f.mock.calls[0] as unknown as [string, { headers: Record<string, string> }]
    expect(url.startsWith('https://x.supabase.co/rest/v1/site_settings?')).toBe(true)
    expect(init.headers.Authorization).toBe('Bearer service-SECRET')
  })

  it.each([['xx'], [''], [null], ['sq"; drop table'], [42], ['EN']])('a database value %j is not a locale: keeps "sq"', async (value) => {
    vi.stubGlobal('fetch', fetchOk(value))
    const { proxy } = await import('@/proxy')
    const res = await proxy(req('/listings'))
    expect(res.headers.get('x-intl-default')).toBe('sq')
  })

  it('does not ask the database again for five minutes, then does', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-17T10:00:00Z'))
    const f = fetchOk('en')
    vi.stubGlobal('fetch', f)
    const { proxy } = await import('@/proxy')
    await proxy(req('/a'))
    await proxy(req('/b'))
    expect(f).toHaveBeenCalledTimes(1)
    vi.setSystemTime(new Date('2026-10-17T10:05:01Z'))
    await proxy(req('/c'))
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('a failing or timed-out database call does not fail the request, and is not retried at once', async () => {
    const f = vi.fn(async () => { throw new Error('timeout') })
    vi.stubGlobal('fetch', f)
    const { proxy } = await import('@/proxy')
    const res = await proxy(req('/listings'))
    expect(res.headers.get('x-intl-default')).toBe('sq')
    await proxy(req('/listings'))
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('a non-200 answer keeps the previous locale', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => [{ value: 'en' }] }) as unknown as Response))
    const { proxy } = await import('@/proxy')
    expect((await proxy(req('/x'))).headers.get('x-intl-default')).toBe('sq')
  })

  it('without the Supabase address or key the database is not asked', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const f = fetchOk('en')
    vi.stubGlobal('fetch', f)
    const { proxy } = await import('@/proxy')
    await proxy(req('/x'))
    expect(f).not.toHaveBeenCalled()
  })

  it('carries the refreshed cookies onto the localised response', async () => {
    vi.stubGlobal('fetch', fetchOk('sq'))
    state.toSet = [{ name: 'sb', value: 'v' }]
    const { proxy } = await import('@/proxy')
    const res = await proxy(req('/listings'))
    expect(res.cookies.get('sb')?.value).toBe('v')
  })

  it('the matcher skips only the auth callback and static files', async () => {
    const { config } = await import('@/proxy')
    const re = new RegExp(`^${config.matcher[0]}$`)
    expect(['/', '/admin', '/api/x', '/sq/a'].every((p) => re.test(p))).toBe(true)
    expect(['/auth/callback', '/_next/static/a.js', '/favicon.ico', '/a.webp'].some((p) => re.test(p))).toBe(false)
  })
})
