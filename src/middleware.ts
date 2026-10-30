import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { NextResponse, type NextRequest } from 'next/server'
import { refreshSession } from '@/lib/auth/middleware'
import { carriesScriptReportOnly, newScriptNonce, scriptReportOnlyPolicy } from '@/lib/security/headers'

const SUPPORTED = ['sq', 'en', 'uk', 'it'] as const
type Locale = typeof SUPPORTED[number]

// Default locale (Task 923 R72 (e), moved here from the unused `src/proxy.ts`, which this Next.js version never ran: a staff change of the site's default
// language therefore never reached the `/` redirect). Module-level cache — survives across requests in the same server instance.
// TTL: 5 minutes. Default locale changes take effect within 5 minutes.
let _cachedLocale: Locale = 'sq'
let _cachedMiddleware = createIntlMiddleware(routing)
let _cacheExpiry = 0

async function getI18nMiddleware(): Promise<ReturnType<typeof createIntlMiddleware>> {
  if (Date.now() < _cacheExpiry) return _cachedMiddleware

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (url && key) {
      const res = await fetch(
        `${url}/rest/v1/site_settings?key=eq.default_locale&select=value&limit=1`,
        {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
          cache: 'no-store',
          signal: AbortSignal.timeout(2000),
        }
      )
      if (res.ok) {
        const data = await res.json() as { value: string }[]
        const raw = data[0]?.value
        const locale: Locale = (SUPPORTED as readonly string[]).includes(raw) ? raw as Locale : 'sq'
        if (locale !== _cachedLocale) {
          _cachedLocale = locale
          _cachedMiddleware = createIntlMiddleware({ ...routing, defaultLocale: locale })
        }
      }
    }
  } catch {
    // Network error or timeout — keep existing middleware, extend cache to avoid hammering DB
  }

  _cacheExpiry = Date.now() + 300_000 // refresh every 5 minutes
  return _cachedMiddleware
}

/** the admin panel and the API have no [locale] segment: they get the session refresh and nothing else (Task 923 R68 (b)) */
function carriesNoLocale(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/api' || pathname.startsWith('/api/')
}

const REPORT_ONLY_HEADER = 'Content-Security-Policy-Report-Only'

export async function middleware(request: NextRequest) {
  // 0. The report-only SCRIPT policy of the dynamic routes (Task 923 R70 (f)): one nonce per request. The REQUEST carries the policy, so Next.js finds the nonce in it and
  //    puts it on its own scripts; every response built below (the session refresh, next-intl's rewrite) copies the request headers; the browser gets it on the response.
  const reportOnly = carriesScriptReportOnly(request.nextUrl.pathname) ? scriptReportOnlyPolicy(newScriptNonce()) : null
  if (reportOnly) request.headers.set(REPORT_ONLY_HEADER, reportOnly)
  const withPolicy = (res: NextResponse): NextResponse => {
    if (reportOnly) res.headers.set(REPORT_ONLY_HEADER, reportOnly)
    return res
  }

  // 1. Auth session refresh: on every request this middleware sees, the admin panel and the API included
  const sessionResponse = await refreshSession(request)

  // 2. No locale routing on /admin and /api (no locale prefix, no redirect)
  if (carriesNoLocale(request.nextUrl.pathname)) return withPolicy(sessionResponse)

  // 3. next-intl locale routing with the staff-chosen default locale
  const handleI18n = await getI18nMiddleware()
  const response = handleI18n(request) as NextResponse

  // Carry any Supabase-refreshed cookies into the final response.
  for (const { name, value, ...options } of sessionResponse.cookies.getAll()) {
    response.cookies.set(name, value, options)
  }

  return withPolicy(response)
}

export const config = {
  // Routes that receive the session refresh (and, outside /admin and /api, locale routing).
  // Excluded intentionally:
  //   api/cron/*          — cron jobs authenticate with the CRON_SECRET and carry no session
  //   api/auth-email-hook — the Supabase Auth hook authenticates with its webhook signature and carries no session
  //   auth/*              — Supabase OAuth callback and confirmation live outside the [locale] tree and handle the session themselves
  // Every other /api route and /admin are INCLUDED so that an expired or refused session is renewed or ended there too (R45 (a)); locale routing stays off on them.
  matcher: [
    '/((?!api/cron|api/auth-email-hook|auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
