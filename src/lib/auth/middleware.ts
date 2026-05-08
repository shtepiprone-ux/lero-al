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
  await supabase.auth.getUser()

  return supabaseResponse
}
