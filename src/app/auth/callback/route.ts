import { NextResponse, type NextRequest } from 'next/server'
import { exchangeCodeForSession, getUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'

// Handles the PKCE code exchange for OAuth and email magic links.
// After any Supabase-initiated redirect (OAuth, email OTP, email confirm),
// Supabase sends the user here with ?code=... and optionally ?next=...
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
      // arriving via OAuth or email confirmation. Creating it here means the
      // locale layout's resolveSession() will immediately find the profile row,
      // so initialUser is set correctly and the page renders authenticated
      // without any client-side flicker.
      //
      // Upsert with ignoreDuplicates is idempotent for returning users.
      await ensureUserProfile()
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}

async function ensureUserProfile(): Promise<void> {
  try {
    const authUser = await getUser()
    if (!authUser) return

    const supabase = await createClient()
    await supabase.from('users').upsert(
      {
        id: authUser.id,
        name:
          (authUser.user_metadata?.full_name as string | undefined) ??
          (authUser.user_metadata?.name as string | undefined) ??
          null,
        user_type: 'private',
        role: 'user',
        is_verified: false,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )
  } catch {}
}
