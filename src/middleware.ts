import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { type NextRequest } from 'next/server'
import { refreshSession } from '@/lib/auth/middleware'

const handleI18nRouting = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  // Refresh Supabase session first — updates request.cookies in place
  // so all downstream Server Components see a valid, refreshed session.
  const sessionResponse = await refreshSession(request)

  // Run next-intl locale routing with the (now-refreshed) request.
  const response = handleI18nRouting(request)

  // Merge session cookies into the i18n response so the browser
  // receives both the refreshed auth tokens and the locale routing headers.
  for (const { name, value, ...options } of sessionResponse.cookies.getAll()) {
    response.cookies.set(name, value, options)
  }

  return response
}

export const config = {
  // Only run on [locale]/* routes. Exclude routes that live outside the locale tree:
  //   api/*    — API routes handle auth internally
  //   auth/*   — Supabase OAuth callback, must not get a locale prefix
  //   admin/*  — admin panel has no [locale] segment in the URL
  matcher: [
    '/((?!api|auth|admin|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
