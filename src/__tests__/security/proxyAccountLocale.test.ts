// @vitest-environment node
/**
 * Task 988 AC3 (owner decisions O988-1, O988-2): a signed-in person always gets the account language (`users.preferred_locale`).
 *  - A GET or HEAD page request in another language, or with none, answers 307 to the same path and query in the account language, `Cache-Control: private,
 *    no-store`, with the refreshed session cookies; the account language passes; an old `/admin/...` address lands on `/<account language>/admin/...`.
 *  - The response keeps the session language cookie `lero_ui_locale` equal to the account language, so a person who signs out keeps it for the session.
 *  - Every other method passes (a Server Action's POST is never redirected).
 *  - SEC-988-PROXY-LOCALE-DENY (account value): no row, `null`, `'UK'`, `'xx'` or a crafted value is no account language: the guest rule applies.
 * The real proxy and the real `refreshSession` run; the Supabase client is a double whose session belongs to one synthetic person and whose `users` row holds
 * `state.row`. next-intl's middleware is a double that passes a path with a language and sends one without it to the default. Every value is synthetic.
 */
import { NextRequest, NextResponse } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next-intl/middleware', () => ({
  default: () => (req: NextRequest) => {
    const { pathname, search } = req.nextUrl
    return ['sq', 'en', 'uk', 'it'].includes(pathname.split('/')[1])
      ? NextResponse.next()
      : NextResponse.redirect(new URL(`/sq${pathname === '/' ? '' : pathname}${search}`, req.url))
  },
}))

const state = vi.hoisted(() => ({ row: { preferred_locale: 'uk' } as { preferred_locale: unknown } | null, refresh: false }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, opts: { cookies: { setAll: (c: { name: string; value: string; options: Record<string, unknown> }[]) => void } }) => ({
    auth: {
      getUser: async () => {
        if (state.refresh) opts.cookies.setAll([{ name: 'sb-test-auth-token', value: 'renewed', options: { path: '/', httpOnly: true } }])
        return { data: { user: { id: 'u-synth-1' } }, error: null }
      },
    },
    from: () => {
      const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: state.row, error: null }) }
      return chain
    },
  }),
}))

const ENV = { ...process.env }
const req = (path: string, cookies: Record<string, string> = {}, method = 'GET') => {
  const cookie = Object.entries(cookies).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ')
  return new NextRequest(`https://lero.al${path}`, { method, ...(cookie ? { headers: { cookie } } : {}) })
}
const uiCookie = (res: Response) => res.headers.getSetCookie().filter((c) => c.startsWith('lero_ui_locale='))

beforeEach(() => {
  state.row = { preferred_locale: 'uk' }
  state.refresh = false
  vi.resetModules()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
})
afterEach(() => { process.env = { ...ENV } })

describe('proxyAccountLocale', () => {
  it('[AC3] a page in another language goes to the account language, private, with the refreshed session cookies', async () => {
    const { proxy } = await import('@/proxy')
    state.refresh = true
    const res = await proxy(req('/sq/listings/x?a=1'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://lero.al/uk/listings/x?a=1')
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(res.headers.getSetCookie().some((c) => c.startsWith('sb-test-auth-token=renewed')), 'the refreshed session cookies are kept').toBe(true)
  })

  it('[AC3] an address without a language, and an old admin address, go to the account language', async () => {
    const { proxy } = await import('@/proxy')
    expect((await proxy(req('/cabinet'))).headers.get('location')).toBe('https://lero.al/uk/cabinet')
    expect((await proxy(req('/admin/users'))).headers.get('location')).toBe('https://lero.al/uk/admin/users')
    expect((await proxy(req('/'))).headers.get('location')).toBe('https://lero.al/uk')
    expect((await proxy(req('/sq/admin/users'))).headers.get('location')).toBe('https://lero.al/uk/admin/users')
  })

  it('[AC3] the account language passes; the session language follows the account language', async () => {
    const { proxy } = await import('@/proxy')
    const same = await proxy(req('/uk/listings/x', { lero_ui_locale: 'uk' }))
    expect(same.headers.get('location')).toBeNull()
    expect(uiCookie(same), 'already equal: no cookie written').toEqual([])

    const differs = await proxy(req('/uk/listings/x', { lero_ui_locale: 'en' }))
    expect(differs.headers.get('location'), 'the account wins over the session cookie').toBeNull()
    expect(uiCookie(differs)[0]).toMatch(/^lero_ui_locale=uk;/)

    const redirected = await proxy(req('/en/x', { lero_ui_locale: 'en' }))
    expect(redirected.headers.get('location')).toBe('https://lero.al/uk/x')
    expect(uiCookie(redirected)[0]).toMatch(/^lero_ui_locale=uk;/)
    expect(uiCookie(redirected)[0]).not.toMatch(/Max-Age=|Expires=/i)
  })

  it('[AC3] other methods pass: a POST to /sq/listings/x is not redirected', async () => {
    const { proxy } = await import('@/proxy')
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      expect((await proxy(req('/sq/listings/x', {}, method))).headers.get('location'), method).toBeNull()
    }
    expect((await proxy(req('/sq/listings/x', {}, 'HEAD'))).headers.get('location'), 'HEAD is a page request').toBe('https://lero.al/uk/listings/x')
  })

  it('[SEC-988-PROXY-LOCALE-DENY] no row, null, \'UK\', \'xx\' or a crafted account value is no account language: the guest rule applies', async () => {
    const { proxy } = await import('@/proxy')
    for (const row of [null, { preferred_locale: null }, { preferred_locale: 'UK' }, { preferred_locale: 'xx' }, { preferred_locale: '//evil.com' }, { preferred_locale: 'uk/../x' }, { preferred_locale: ['uk'] }]) {
      state.row = row
      const label = JSON.stringify(row)
      expect((await proxy(req('/sq/listings/x'))).headers.get('location'), `${label}: no redirect without a session language`).toBeNull()
      expect((await proxy(req('/sq/listings/x', { lero_ui_locale: 'it' }))).headers.get('location'), `${label}: the guest rule`).toBe('https://lero.al/it/listings/x')
      for (const c of uiCookie(await proxy(req('/en/x')))) expect(['sq', 'en', 'uk', 'it']).toContain(c.split(';')[0].slice('lero_ui_locale='.length))
    }
  })
})
