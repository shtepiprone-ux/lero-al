import createIntlMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'
import { routing } from './i18n/routing'
import { refreshSession } from '@/lib/auth/middleware'

const handleI18n = createIntlMiddleware(routing)

export default async function proxy(request: NextRequest) {
  // ── 1. Auth session refresh ──────────────────────────────────────────────
  // Must run on every request so server components always see a valid session.
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

  // ── 3. next-intl locale routing ──────────────────────────────────────────
  const i18nResponse = handleI18n(request)

  // Carry any Supabase-refreshed cookies into the final response.
  supabaseResponse.cookies.getAll().forEach(({ name, value, ...rest }) => {
    i18nResponse.cookies.set(name, value, rest as any)
  })

  return i18nResponse
}

export const config = {
  // auth/callback must not go through next-intl locale routing
  matcher: ['/((?!auth/callback|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
