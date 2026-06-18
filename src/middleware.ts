import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { type NextRequest } from 'next/server'
import { refreshSession } from '@/lib/auth/middleware'

const handleI18nRouting = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const sessionResponse = await refreshSession(request)

  const response = handleI18nRouting(request)

  for (const { name, value, ...options } of sessionResponse.cookies.getAll()) {
    response.cookies.set(name, value, options)
  }

  return response
}

export const config = {
  // Routes that receive locale routing + session refresh.
  // Excluded intentionally:
  //   api/*    — API routes handle auth internally, must not get locale prefixes
  //   auth/*   — Supabase OAuth callback lives outside the [locale] tree
  //   admin/*  — admin panel has no [locale] segment in the URL
  matcher: [
    '/((?!api|auth|admin|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
