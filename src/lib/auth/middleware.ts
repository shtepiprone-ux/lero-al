/**
 * auth-core / middleware
 *
 * Session refresh for Next.js middleware.
 *
 * Middleware runs on the Edge Runtime and cannot use the @/lib/supabase/server
 * helper (which depends on next/headers cookies()).  Instead it creates a
 * transient server client that reads cookies from the incoming NextRequest and
 * writes refreshed tokens back to the outgoing NextResponse.
 *
 * Must be called on every request before any routing or i18n logic so that
 * all downstream Server Components always see a valid, refreshed session.
 */

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function refreshSession(request: NextRequest): Promise<NextResponse> {
  // Start with a passthrough response; setAll() will replace it if tokens change.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Propagate refreshed tokens into the request so any subsequent
          // createServerClient call within the same edge invocation sees them.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Rebuild the response so the browser and downstream server
          // components both receive the new cookie headers.
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: do not add any logic between createServerClient and getUser().
  // getUser() is what triggers the token refresh when the access token is
  // expired; the refreshed tokens are captured via setAll() above.
  const { error } = await supabase.auth.getUser()

  // Task 923 R45 (a) (owner decisions D26, D29): the server ends a refused session. Supabase Auth answers `user_banned` for a banned account and
  // `user_not_found` for a deleted one, and the SDK KEEPS the session on both, so the browser would stay "signed in" with a token that no longer works.
  // `signOut({ scope: 'local' })` removes it even on that 403 answer (the SDK ignores a 401 / 403 / 404 and removes the local session), and the
  // cleared auth cookies reach the response through `setAll` above, so the page renders for a guest. Any other error (a network failure, an expired
  // refresh token Auth already handles) changes nothing.
  if (error && (error.code === 'user_banned' || error.code === 'user_not_found')) {
    await supabase.auth.signOut({ scope: 'local' })
  }

  return supabaseResponse
}
