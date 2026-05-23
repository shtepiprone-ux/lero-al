import { NextResponse, type NextRequest } from 'next/server'
import { exchangeCodeForSession, ensureUserProfile } from '@/lib/auth/server'

// Handles the PKCE code exchange for OAuth (Google) flows.
// After OAuth, Supabase redirects here with ?code=... and optionally ?next=...
// For token-hash email links (signup, recovery, magic-link), see /auth/confirm.
const LOCALE_RE = /^\/(sq|en|uk|it)\//

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const { error } = await exchangeCodeForSession(code)
    if (!error) {
      // Ensure the application-level profile exists before redirecting.
      //
      // This is the primary server-side creation point for first-time users
      // arriving via OAuth. Creating it here means the locale layout's
      // resolveSession() will immediately find the profile row, so initialUser
      // is set correctly and the page renders authenticated without client flicker.
      //
      // Upsert with ignoreDuplicates is idempotent for returning users.
      await ensureUserProfile()
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Derive locale from `next` so the error page is locale-aware.
  const locale = LOCALE_RE.exec(next)?.[1] ?? 'sq'
  return NextResponse.redirect(`${origin}/${locale}/auth/login?error=auth_callback_failed`)
}
