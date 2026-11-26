// @vitest-environment node
/**
 * Task 988 AC2 (owner decisions O988-1, O988-5): a guest keeps the language of this browser session across tabs and links.
 *  - The session language is the cookie `lero_ui_locale`: a session cookie (no Max-Age, no Expires), `Path=/`, `SameSite=Lax`, `HttpOnly`, one of the four codes.
 *  - With it, a GET or HEAD page request in another language, or with none, answers 307 to the same path and query in the session language, `Cache-Control:
 *    private, no-store`, with the refreshed session cookies and the report-only script policy; the same language passes and writes no cookie.
 *  - Without it, a path with a language passes and its response starts the session language (`lero_ui_locale=<that language>`); a path without one gets next-intl's
 *    default answer. next-intl's `NEXT_LOCALE` never steers it. Every other method passes (a Server Action's POST is never redirected).
 *  - SEC-988-PROXY-LOCALE-DENY: a crafted cookie value never steers a redirect; SEC-988-GUEST-COOKIE-DENY: no response sets `lero_ui_locale` to anything but a code.
 * The real proxy runs; the Supabase client is a double (a guest: no user). next-intl's ESM middleware imports `next/server` without an extension, which Node cannot
 * load under Vitest, so its double is built from next-intl's own `receiveRoutingConfig` and `syncCookie`, loaded by file path, around its answer with
 * `localeDetection: false` (a path without a language: 307 to the default language; a path with one: passed on). Every value is synthetic.
 */
import { NextRequest, NextResponse } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next-intl/middleware', async () => {
  const { join } = await import('node:path')
  const dist = join(process.cwd(), 'node_modules', 'next-intl', 'dist', 'esm', 'development')
  const { receiveRoutingConfig } = (await import(/* @vite-ignore */ join(dist, 'routing', 'config.js'))) as { receiveRoutingConfig: (c: unknown) => { locales: string[]; defaultLocale: string } }
  const { default: syncCookie } = (await import(/* @vite-ignore */ join(dist, 'middleware', 'syncCookie.js'))) as { default: (req: NextRequest, res: NextResponse, locale: string, routing: unknown) => void }
  return {
    default: (input: unknown) => {
      const routing = receiveRoutingConfig(input)
      return (req: NextRequest) => {
        const { pathname, search } = req.nextUrl
        const first = pathname.split('/')[1]
        const locale = routing.locales.includes(first) ? first : routing.defaultLocale
        const res = routing.locales.includes(first)
          ? NextResponse.next()
          : NextResponse.redirect(new URL(`/${locale}${pathname === '/' ? '' : pathname}${search}`, req.url))
        syncCookie(req, res, locale, routing)
        return res
      }
    },
  }
})

const state = vi.hoisted(() => ({ refresh: false }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, opts: { cookies: { setAll: (c: { name: string; value: string; options: Record<string, unknown> }[]) => void } }) => ({
    auth: {
      getUser: async () => {
        if (state.refresh) opts.cookies.setAll([{ name: 'sb-test-auth-token', value: 'renewed', options: { path: '/', httpOnly: true } }])
        return { data: { user: null }, error: null }
      },
    },
    from: () => { throw new Error('a guest has no account row to read') },
  }),
}))

const ENV = { ...process.env }
const req = (path: string, cookies: Record<string, string> = {}, method = 'GET') => {
  const cookie = Object.entries(cookies).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ')
  return new NextRequest(`https://lero.al${path}`, { method, ...(cookie ? { headers: { cookie } } : {}) })
}
const uiCookie = (res: Response) => res.headers.getSetCookie().filter((c) => c.startsWith('lero_ui_locale='))

beforeEach(() => {
  state.refresh = false
  vi.resetModules()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
  delete process.env.SUPABASE_SERVICE_ROLE_KEY     // no staff-default lookup: next-intl routes with the default `sq`
})
afterEach(() => { process.env = { ...ENV } })

describe('proxyLocale', () => {
  it('[AC2] a page in another language goes to the session language, private, with the refreshed session cookies and the policy', async () => {
    const { proxy } = await import('@/proxy')
    state.refresh = true
    const res = await proxy(req('/sq/listings/x?a=1', { lero_ui_locale: 'uk' }))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://lero.al/uk/listings/x?a=1')
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(res.headers.getSetCookie().some((c) => c.startsWith('sb-test-auth-token=renewed')), 'the refreshed session cookies are kept').toBe(true)

    const cabinet = await proxy(req('/cabinet', { lero_ui_locale: 'uk' }))
    expect(cabinet.status).toBe(307)
    expect(cabinet.headers.get('location')).toBe('https://lero.al/uk/cabinet')
    expect(cabinet.headers.get('cache-control')).toBe('private, no-store')
    expect(cabinet.headers.get('content-security-policy-report-only'), 'the answer passes withPolicy').toBeTruthy()

    const root = await proxy(req('/', { lero_ui_locale: 'it' }))
    expect(root.headers.get('location')).toBe('https://lero.al/it')

    const head = await proxy(req('/en/x', { lero_ui_locale: 'uk' }, 'HEAD'))
    expect(head.headers.get('location'), 'HEAD is a page request too').toBe('https://lero.al/uk/x')

    const admin = await proxy(req('/admin/users', { lero_ui_locale: 'uk' }))
    expect(admin.headers.get('location'), 'an old admin address lands under the slug').toBe('https://lero.al/uk/admin/users')
  })

  it('[AC2] the same language passes and sets no cookie', async () => {
    const { proxy } = await import('@/proxy')
    const res = await proxy(req('/uk/x', { lero_ui_locale: 'uk' }))
    expect(res.headers.get('location')).toBeNull()
    expect(uiCookie(res)).toEqual([])
  })

  it('[AC2] the first page of a session starts the session language: a session cookie with Path=/, SameSite=Lax, HttpOnly', async () => {
    const { proxy } = await import('@/proxy')
    const res = await proxy(req('/en/x'))
    expect(res.headers.get('location')).toBeNull()
    const [cookie] = uiCookie(res)
    expect(cookie).toMatch(/^lero_ui_locale=en;/)
    expect(cookie).toMatch(/;\s*Path=\/(;|$)/i)
    expect(cookie).toMatch(/;\s*SameSite=Lax(;|$)/i)
    expect(cookie).toMatch(/;\s*HttpOnly(;|$)/i)
    expect(cookie).not.toMatch(/Max-Age=/i)
    expect(cookie).not.toMatch(/Expires=/i)
  })

  it('[AC2] the cookie is Secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    try {
      const { proxy } = await import('@/proxy')
      const [cookie] = uiCookie(await proxy(req('/en/x')))
      expect(cookie).toMatch(/;\s*Secure(;|$)/i)
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('[AC2] without cookies an address without a language gets next-intl\'s default answer, and no request is sent away from its own language', async () => {
    const { proxy } = await import('@/proxy')
    const res = await proxy(req('/cabinet'))
    expect(res.headers.get('location')).toBe('https://lero.al/sq/cabinet')
    expect(res.headers.get('cache-control')).not.toBe('private, no-store')
    for (const path of ['/sq/listings/x', '/uk/x', '/it']) {
      expect((await proxy(req(path))).headers.get('location'), path).toBeNull()
    }
  })

  it('[AC2] other methods pass: a POST to /sq/x with the session language uk is not redirected', async () => {
    const { proxy } = await import('@/proxy')
    for (const method of ['POST', 'PUT', 'DELETE']) {
      const res = await proxy(req('/sq/x', { lero_ui_locale: 'uk' }, method))
      expect(res.headers.get('location'), method).toBeNull()
      expect(uiCookie(res), method).toEqual([])
    }
  })

  it('[AC2] NEXT_LOCALE never steers the session language', async () => {
    const { proxy } = await import('@/proxy')
    const res = await proxy(req('/sq/x', { NEXT_LOCALE: 'sq', lero_ui_locale: 'uk' }))
    expect(res.headers.get('location')).toBe('https://lero.al/uk/x')
    const bare = await proxy(req('/cabinet', { NEXT_LOCALE: 'uk' }))
    expect(bare.headers.get('location'), 'NEXT_LOCALE alone: next-intl\'s default').toBe('https://lero.al/sq/cabinet')
    expect(uiCookie(await proxy(req('/en/x', { NEXT_LOCALE: 'uk' }))), 'the first page writes its own language, never NEXT_LOCALE').toEqual(expect.arrayContaining([expect.stringMatching(/^lero_ui_locale=en;/)]))
  })

  it('[SEC-988-PROXY-LOCALE-DENY] a crafted session cookie never steers a redirect; /api stays outside locale routing', async () => {
    const { proxy } = await import('@/proxy')
    for (const value of ['//evil.com', 'UK', 'uk/../x', 'https://evil.com', 'uk ', '', 'uk;x']) {
      const own = await proxy(req('/sq/x', { lero_ui_locale: value }))
      expect(own.headers.get('location'), JSON.stringify(value)).toBeNull()
      const bare = await proxy(req('/cabinet', { lero_ui_locale: value }))
      expect(bare.headers.get('location'), JSON.stringify(value)).toBe('https://lero.al/sq/cabinet')
      expect(bare.headers.get('cache-control'), JSON.stringify(value)).not.toBe('private, no-store')
    }
    for (const path of ['/api/x', '/api']) {
      expect((await proxy(req(path, { lero_ui_locale: 'uk' }))).headers.get('location'), path).toBeNull()
    }
  })

  it('[SEC-988-GUEST-COOKIE-DENY] no response sets lero_ui_locale to anything but one of the four codes', async () => {
    const { proxy } = await import('@/proxy')
    const values: string[] = []
    for (const value of ['//evil.com', 'UK', 'uk/../x', 'https://evil.com', '<script>', 'uk; Domain=evil.com']) {
      for (const path of ['/sq/x', '/cabinet', '/UK/x', '/%2F%2Fevil.com/x', '/uk%2F..%2Fx']) {
        for (const c of uiCookie(await proxy(req(path, { lero_ui_locale: value })))) values.push(c.split(';')[0].slice('lero_ui_locale='.length))
      }
    }
    expect(values.every((v) => ['sq', 'en', 'uk', 'it'].includes(v)), JSON.stringify(values)).toBe(true)
  })
})
