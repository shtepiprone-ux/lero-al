// @vitest-environment node
/**
 * Security response headers (Task 923 Revision 7, finding S7).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CSP_BASELINE, CSP_SCRIPT_HOSTS, SECURITY_HEADERS, carriesScriptReportOnly, newScriptNonce, scriptReportOnlyPolicy } from '../headers'

// the proxy (Task 923 R70 (f), renamed from the middleware by Task 952) is the real one; the Supabase client and next-intl's middleware are doubles that, like the real ones, copy the request headers into the response
vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({ auth: { getUser: async () => ({ data: {}, error: null }) } }) }))
vi.mock('next-intl/middleware', () => ({
  default: () => (req: NextRequest) => NextResponse.next({ request: { headers: new Headers(req.headers) } }),
}))
vi.mock('@/i18n/routing', () => ({ routing: { locales: ['sq', 'en', 'uk', 'it'], defaultLocale: 'sq' } }))

const byKey = (k: string) => SECURITY_HEADERS.find((h) => h.key.toLowerCase() === k.toLowerCase())?.value

describe('SECURITY_HEADERS', () => {
  it('forbids framing by any other site, in both the old and the CSP form', () => {
    expect(byKey('X-Frame-Options')).toBe('DENY')
    expect(byKey('Content-Security-Policy')).toContain("frame-ancestors 'none'")
  })

  it('stops MIME sniffing', () => {
    expect(byKey('X-Content-Type-Options')).toBe('nosniff')
  })

  it('does not send a private path to another site in the Referer', () => {
    expect(byKey('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
  })

  it('turns off the browser features the site never uses', () => {
    const p = byKey('Permissions-Policy') ?? ''
    for (const f of ['camera', 'microphone', 'payment', 'usb', 'geolocation']) expect(p, f).toContain(`${f}=()`)
  })

  it('asks for HTTPS only, for at least a year, covering sub-domains', () => {
    const v = byKey('Strict-Transport-Security') ?? ''
    const maxAge = Number(/max-age=(\d+)/.exec(v)?.[1])
    expect(maxAge).toBeGreaterThanOrEqual(31536000)
    expect(v).toContain('includeSubDomains')
  })

  it('blocks an injected <base>, a form posting elsewhere and plug-ins', () => {
    for (const d of ["base-uri 'self'", "form-action 'self'", "object-src 'none'"]) expect(CSP_BASELINE).toContain(d)
  })

  it('does not open the policy with a wildcard or unsafe script source', () => {
    expect(CSP_BASELINE).not.toMatch(/unsafe-eval|unsafe-inline|\*/)
  })

  it('has every header once, with a non-empty value', () => {
    const keys = SECURITY_HEADERS.map((h) => h.key.toLowerCase())
    expect(new Set(keys).size).toBe(keys.length)
    for (const h of SECURITY_HEADERS) expect(h.value.length, h.key).toBeGreaterThan(3)
  })
})

describe('next.config.ts', () => {
  it('applies SECURITY_HEADERS to every path', () => {
    const src = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf8')
    expect(src).toContain("from './src/lib/security/headers'")
    expect(src).toMatch(/async headers\(\)/)
    expect(src).toMatch(/source:\s*'\/:path\*'/)
    expect(src).toMatch(/headers:\s*SECURITY_HEADERS/)
  })
})

// Task 923 R38 (case SEC-S07-SRV-DENY)
it('[SEC-S07-SRV-DENY] Every response carries the frame, content-type, referrer and permissions security headers', () => {
  expect(byKey('X-Frame-Options')).toBe('DENY')
  expect(byKey('Content-Security-Policy')).toContain("frame-ancestors 'none'")
  expect(byKey('X-Content-Type-Options')).toBe('nosniff')
  expect(byKey('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
  const permissions = byKey('Permissions-Policy') ?? ''
  for (const feature of ['camera', 'microphone', 'payment', 'usb', 'geolocation']) expect(permissions, feature).toContain(`${feature}=()`)
  // the config applies them to every path
  const config = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf8')
  expect(config).toMatch(/source:\s*'\/:path\*'/)
  expect(config).toMatch(/headers:\s*SECURITY_HEADERS/)
})

// Task 923 R70 (f) (case SEC-X-SRV-CSP-REPORT-ONLY)
describe('headers', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [{ value: 'sq' }] }) as unknown as Response))
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
  })

  const nonceOf = (policy: string) => /'nonce-([^']+)'/.exec(policy)?.[1]
  const forwardedPolicy = (res: Response) => res.headers.get('x-middleware-request-content-security-policy-report-only')

  it('[SEC-X-SRV-CSP-REPORT-ONLY] dynamic routes carry the report-only script policy', async () => {
    const { proxy } = await import('@/proxy')
    const nonces: string[] = []
    for (const path of ['/admin', '/admin/users', '/sq/cabinet', '/en/cabinet/statistics', '/sq/auth/login', '/uk/auth/register']) {
      const res = await proxy(new NextRequest(`https://lero.al${path}`))
      const policy = res.headers.get('Content-Security-Policy-Report-Only') ?? ''
      expect(policy, `${path}: a script policy in report-only mode`).toContain('script-src')
      expect(policy, `${path}: a nonce`).toMatch(/'nonce-[A-Za-z0-9+/=]{16,}'/)
      expect(policy, `${path}: strict-dynamic`).toContain("'strict-dynamic'")
      for (const host of CSP_SCRIPT_HOSTS) expect(policy, `${path}: the listed host`).toContain(host)
      expect(policy, `${path}: no unsafe source`).not.toMatch(/unsafe-inline|unsafe-eval|\*/)
      expect(res.headers.get('Content-Security-Policy'), `${path}: this middleware never sets the enforcing header (the baseline comes from next.config.ts)`).toBeNull()
      // the REQUEST carries the same policy, so that Next.js reads the nonce from it and puts it on its own scripts
      expect(forwardedPolicy(res), `${path}: the request carries the same policy`).toBe(policy)
      nonces.push(nonceOf(policy)!)
    }
    expect(new Set(nonces).size, 'one fresh nonce per request').toBe(nonces.length)
  })

  it('the pages that are not dynamic admin, cabinet and auth routes carry no policy, and the baseline policy is unchanged', async () => {
    const { proxy } = await import('@/proxy')
    for (const path of ['/sq', '/en/listings', '/sq/listings/some-slug', '/api/presence']) {
      const res = await proxy(new NextRequest(`https://lero.al${path}`))
      expect(res.headers.get('Content-Security-Policy-Report-Only'), path).toBeNull()
    }
    expect(CSP_BASELINE).toBe("frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'")
    expect(carriesScriptReportOnly('/administrator')).toBe(false)
    expect(carriesScriptReportOnly('/sq/cabinets')).toBe(false)
    expect(carriesScriptReportOnly('/sq/authority')).toBe(false)
  })

  it('a nonce is 16 random bytes in base64, a policy names its nonce, and a policy never allows unsafe-inline or a wildcard', () => {
    const a = newScriptNonce()
    const b = newScriptNonce()
    expect(a).not.toBe(b)
    expect(atob(a)).toHaveLength(16)
    expect(scriptReportOnlyPolicy(a)).toContain(`'nonce-${a}'`)
    expect(scriptReportOnlyPolicy(a)).not.toMatch(/unsafe-inline|unsafe-eval|\*/)
  })
})
