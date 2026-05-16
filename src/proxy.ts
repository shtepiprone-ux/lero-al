import createIntlMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'
import { routing } from './i18n/routing'
import { refreshSession } from '@/lib/auth/middleware'

const SUPPORTED = ['sq', 'en', 'uk', 'it'] as const
type Locale = typeof SUPPORTED[number]

// Module-level cache — survives across requests in the same server instance.
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

export default async function proxy(request: NextRequest) {
  // ── 1. Auth session refresh ──────────────────────────────────────────────
  const supabaseResponse = await refreshSession(request)

  // ── 2. Skip i18n for routes that must not have locale prefix ────────────
  const { pathname } = request.nextUrl
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/')  ||
    pathname === '/api'
  ) {
    return supabaseResponse
  }

  // ── 3. next-intl locale routing with dynamic default locale ─────────────
  const handleI18n = await getI18nMiddleware()
  const i18nResponse = handleI18n(request)

  // Carry any Supabase-refreshed cookies into the final response.
  supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
    i18nResponse.cookies.set(name, value)
  })

  return i18nResponse
}

export const config = {
  matcher: ['/((?!auth/callback|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
