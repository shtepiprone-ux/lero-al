import { NextResponse, type NextRequest } from 'next/server'
import { exchangeCodeForSession, ensureUserProfile } from '@/lib/auth/server'
import { safeNextPath } from '@/lib/auth/safeRedirect'

// Handles the PKCE code exchange for OAuth (Google) flows.
// After OAuth, Supabase redirects here with ?code=... and optionally ?next=...
// For token-hash email links (signup, recovery, magic-link), see /auth/confirm.
const LOCALE_RE = /^\/(sq|en|uk|it)\//

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // only a path of THIS site may come out of `next` (open redirect, Task 923 Revision 7, S5)
  const next = safeNextPath(searchParams.get('next'), origin, '/')

  if (code) {
    const { error } = await exchangeCodeForSession(code)
    if (!error) {
      // Give a new agent the company the sign-up named, before redirecting (service role, on the
      // person's own row, only while it is empty). The profile row itself is not made here: the
      // sign-up trigger public.handle_new_user() makes it (Task 956 AC15; a session upsert never wrote a row).
      await ensureUserProfile()
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Derive locale from `next` so the error page is locale-aware.
  const locale = LOCALE_RE.exec(next)?.[1] ?? 'sq'
  return NextResponse.redirect(`${origin}/${locale}/auth/login?error=auth_callback_failed`)
}
