import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { NextResponse, type NextRequest } from 'next/server'
import { refreshSession } from '@/lib/auth/middleware'
import { carriesScriptReportOnly, newScriptNonce, scriptReportOnlyPolicy } from '@/lib/security/headers'
import { UI_LOCALE_COOKIE, uiLocaleCookieOptions } from '@/i18n/uiLocale'

const SUPPORTED = ['sq', 'en', 'uk', 'it'] as const
type Locale = typeof SUPPORTED[number]
const isLocale = (value: string | undefined): value is Locale => (SUPPORTED as readonly string[]).includes(value ?? '')

// Request gate of the site. Next 16 renamed the `middleware` convention to `proxy` (Task 952): this file is `src/proxy.ts`, the only gate, and it exports `proxy` and `config`.
// Default locale (Task 923 R72 (e); until Task 952 an older copy sat in a `src/proxy.ts` that Next 15 never ran, so a staff change of the site's default
// language never reached the `/` redirect). Module-level cache — survives across requests in the same server instance.
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

/** the API has no [locale] segment: it gets the session refresh and nothing else (Task 923 R68 (b)); since Task 988 the admin lives under the slug like every page */
function carriesNoLocale(pathname: string): boolean {
  return pathname === '/api' || pathname.startsWith('/api/')
}

const REPORT_ONLY_HEADER = 'Content-Security-Policy-Report-Only'

export async function proxy(request: NextRequest) {
  // 0. The report-only SCRIPT policy of the dynamic routes (Task 923 R70 (f)): one nonce per request. The REQUEST carries the policy, so Next.js finds the nonce in it and
  //    puts it on its own scripts; every response built below (the session refresh, next-intl's rewrite) copies the request headers; the browser gets it on the response.
  const reportOnly = carriesScriptReportOnly(request.nextUrl.pathname) ? scriptReportOnlyPolicy(newScriptNonce()) : null
  if (reportOnly) request.headers.set(REPORT_ONLY_HEADER, reportOnly)
  const withPolicy = (res: NextResponse): NextResponse => {
    if (reportOnly) res.headers.set(REPORT_ONLY_HEADER, reportOnly)
    return res
  }

  // 1. Auth session refresh: on every request this proxy sees, the API included; with it, the signed-in person's account language (Task 988)
  const { response: sessionResponse, accountLocale } = await refreshSession(request)
  const withSession = (res: NextResponse): NextResponse => {
    for (const { name, value, ...options } of sessionResponse.cookies.getAll()) {
      res.cookies.set(name, value, options)
    }
    return res
  }

  // 2. No locale routing on /api (no locale prefix, no redirect)
  if (carriesNoLocale(request.nextUrl.pathname)) return withPolicy(sessionResponse)

  // 3. Task 988 (owner decisions O988-1, O988-2, O988-5): the interface language. A signed-in person always gets the account language; a guest the language of this
  //    browser session (`lero_ui_locale`). A GET or HEAD page request in another language, or with none, answers 307 to the same path and query in that language;
  //    the same language passes. Only the four exact codes steer it, the target is this request's own path, and a shared cache never keeps the per-person answer.
  //    Every other method passes (a Server Action's POST is never redirected). A request without cookies is never sent away from the language of its address.
  const { pathname } = request.nextUrl
  const first = pathname.split('/')[1]
  const pathLocale = isLocale(first) ? first : null
  const isPage = request.method === 'GET' || request.method === 'HEAD'
  const sessionCookie = request.cookies.get(UI_LOCALE_COOKIE)?.value
  const sessionLocale = isLocale(sessionCookie) ? sessionCookie : null
  const chosen = accountLocale ?? sessionLocale
  // the session language this response writes: the account language when the cookie differs from it; for a guest, the language of the first page of the session
  const writeSession = !isPage ? null : accountLocale ? (sessionCookie === accountLocale ? null : accountLocale) : (sessionLocale ? null : pathLocale)
  const withSessionLocale = (res: NextResponse): NextResponse => {
    if (writeSession) res.cookies.set(UI_LOCALE_COOKIE, writeSession, uiLocaleCookieOptions())
    return res
  }

  if (isPage && chosen && pathLocale !== chosen) {
    const target = request.nextUrl.clone()
    const rest = pathLocale ? pathname.slice(pathLocale.length + 1) : pathname
    target.pathname = `/${chosen}${rest === '/' ? '' : rest}`
    const redirect = NextResponse.redirect(target, 307)
    redirect.headers.set('Cache-Control', 'private, no-store')
    return withPolicy(withSessionLocale(withSession(redirect)))
  }

  // 4. next-intl locale routing with the staff-chosen default locale
  const handleI18n = await getI18nMiddleware()
  const response = handleI18n(request) as NextResponse

  // Carry any Supabase-refreshed cookies into the final response.
  return withPolicy(withSessionLocale(withSession(response)))
}

export const config = {
  // Routes that receive the session refresh (and, outside /api, locale routing).
  // Excluded intentionally:
  //   api/cron/*          — cron jobs authenticate with the CRON_SECRET and carry no session
  //   api/auth-email-hook — the Supabase Auth hook authenticates with its webhook signature and carries no session
  //   auth/*              — Supabase OAuth callback and confirmation live outside the [locale] tree and handle the session themselves
  //   robots.txt, sitemap/<id>.xml — the public crawler documents (Task 964): they read no session, and a language prefix sent them to /sq/robots.txt, a 404.
  //                         Exactly these paths: `/robots.txt.bak`, `/sitemap`, `/sitemap.xml` and `/sitemap/abc.xml` keep the session refresh and locale routing.
  //                         The id is one to three digits (Revision 1, R1-3): the sitemap route serves request-time ids and caches every path it answers, 404 included, so
  //                         three digits bound the paths an anonymous visitor can add to the cache to 1 110 (1 000 files, 5 000 000 listings); `/sitemap/1234.xml` keeps the
  //                         proxy, which sends it to a 404 page.
  //   vendor/<file>.js, vendor/<file>.txt — the vendored Worker script of the photo compression and its licence (Task 1038): they read no session, and a language prefix sent them
  //                         to /sq/vendor/..., a 404, so the Worker's script load failed and every photo was compressed on the main thread. Only files directly under /vendor/
  //                         with these two endings: `/vendor`, `/vendor/`, `/vendor/a/b.js`, `/vendorx/a.js` and `/vendor/x.json` keep the session refresh and locale routing.
  // Every other /api route and the admin are INCLUDED so that an expired or refused session is renewed or ended there too (R45 (a)); locale routing stays off on /api.
  matcher: [
    '/((?!api/cron|api/auth-email-hook|auth|_next/static|_next/image|favicon.ico|robots\\.txt$|sitemap/\\d{1,3}\\.xml$|vendor/[^/]+\\.(?:js|txt)$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
