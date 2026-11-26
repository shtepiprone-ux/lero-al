// @vitest-environment node
/**
 * Task 988 AC2: an address without a language keeps the visitor's language, and the language cookie lives 10 days (owner decision O988-1).
 *  - `/cabinet?tab=x` with `NEXT_LOCALE=uk` answers 307 to `/uk/cabinet?tab=x`, `Cache-Control: private, no-store` (a shared cache never keeps a cookie-dependent
 *    redirect), the refreshed session cookies and the report-only script policy; with no cookie next-intl's default answer stays.
 *  - SEC-988-PROXY-LOCALE-DENY: only the four exact language codes steer the redirect (a crafted cookie never builds the target); a path that already carries a
 *    language never redirects (no loop); `/admin` and `/api` stay outside locale routing.
 *  - next-intl's `NEXT_LOCALE` cookie is written with `Max-Age=864000` whenever the page language differs from it, and not when it is the same.
 * The real proxy and the real routing run; the Supabase client is a double. next-intl's ESM middleware imports `next/server` without an extension, which Node cannot
 * load under Vitest (`Cannot find module '…/node_modules/next/server'`, as every other proxy test records by mocking it), so its double is built from next-intl's own
 * code: `receiveRoutingConfig` (the `localeCookie` defaults) and `syncCookie` (the cookie writer), loaded by file path, around its answer with `localeDetection: false`
 * (a path without a language: 307 to the default language; a path with one: passed on). Every value is synthetic.
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
        return { data: {}, error: null }
      },
    },
  }),
}))

const ENV = { ...process.env }
const req = (path: string, locale?: string) =>
  new NextRequest(`https://lero.al${path}`, locale === undefined ? {} : { headers: { cookie: `NEXT_LOCALE=${encodeURIComponent(locale)}` } })

beforeEach(() => {
  state.refresh = false
  vi.resetModules()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
  delete process.env.SUPABASE_SERVICE_ROLE_KEY     // no staff-default lookup: next-intl routes with the default `sq`
})
afterEach(() => { process.env = { ...ENV } })

const localeCookie = (res: Response) => res.headers.getSetCookie().find((c) => c.startsWith('NEXT_LOCALE='))

describe('proxyLocale', () => {
  it('[AC2] an address without a language goes to the language of the NEXT_LOCALE cookie', async () => {
    const { proxy } = await import('@/proxy')
    state.refresh = true
    const res = await proxy(req('/cabinet?tab=x', 'uk'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://lero.al/uk/cabinet?tab=x')
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(res.headers.getSetCookie().some((c) => c.startsWith('sb-test-auth-token=renewed')), 'the refreshed session cookies are kept').toBe(true)
    expect(res.headers.get('content-security-policy-report-only'), 'the answer passes withPolicy').toBeTruthy()

    const root = await proxy(req('/', 'it'))
    expect(root.status).toBe(307)
    expect(root.headers.get('location')).toBe('https://lero.al/it')
    expect(root.headers.get('cache-control')).toBe('private, no-store')
  })

  it('[AC2] no cookie: next-intl\'s default answer stays', async () => {
    const { proxy } = await import('@/proxy')
    const res = await proxy(req('/cabinet?tab=x'))
    expect(res.headers.get('location')).toBe('https://lero.al/sq/cabinet?tab=x')
    expect(res.headers.get('cache-control')).not.toBe('private, no-store')
  })

  it('[SEC-988-PROXY-LOCALE-DENY] a crafted cookie never steers the redirect; a language path never redirects; /admin and /api are untouched', async () => {
    const { proxy } = await import('@/proxy')
    for (const value of ['//evil.com', 'UK', 'uk/../x', 'https://evil.com', 'uk ', '']) {
      const res = await proxy(req('/cabinet?tab=x', value))
      expect(res.headers.get('location'), JSON.stringify(value)).toBe('https://lero.al/sq/cabinet?tab=x')
      expect(res.headers.get('cache-control'), JSON.stringify(value)).not.toBe('private, no-store')
    }

    const own = await proxy(req('/uk/x', 'en'))
    expect(own.headers.get('location'), 'a path with a language is not redirected').toBeNull()

    for (const path of ['/admin', '/admin/users', '/api/x']) {
      const res = await proxy(req(path, 'uk'))
      expect(res.headers.get('location'), path).toBeNull()
    }
  })

  it('[AC2] the language cookie lives 10 days (O988-1) and is written only when the page language differs', async () => {
    const { proxy } = await import('@/proxy')
    const changed = localeCookie(await proxy(req('/en/x', 'uk')))
    expect(changed).toBeDefined()
    expect(changed).toMatch(/^NEXT_LOCALE=en;/)
    expect(changed).toMatch(/;\s*Max-Age=864000(;|$)/i)
    expect(changed).toMatch(/;\s*Path=\/(;|$)/i)
    expect(changed).toMatch(/;\s*SameSite=Lax(;|$)/i)

    expect(localeCookie(await proxy(req('/uk/x', 'uk'))), 'same language: no Set-Cookie').toBeUndefined()
  })
})
