import { NextResponse, type NextRequest } from 'next/server'
import { verifyOtp, ensureUserProfile } from '@/lib/auth/server'

// Handles token-hash email confirmation for signup, recovery, and magic-link flows.
// Supabase's Send Email Hook (Task 122) builds confirmation links pointing here
// so they work cross-device (no PKCE code_verifier cookie needed).
// OAuth (Google) PKCE code exchange continues to use /auth/callback.

const VALID_OTP_TYPES = ['signup', 'invite', 'recovery', 'magiclink', 'email_change', 'email'] as const
type OtpType = (typeof VALID_OTP_TYPES)[number]

const LOCALE_RE = /^\/(sq|en|uk|it)\//

function deriveLocale(next: string): string {
  return LOCALE_RE.exec(next)?.[1] ?? 'sq'
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const rawType = searchParams.get('type')
  const next = searchParams.get('next') ?? '/sq/auth/verified'

  const locale = deriveLocale(next)
  const failureRedirect = `${origin}/${locale}/auth/login?error=auth_callback_failed`

  if (!token_hash || !rawType || !VALID_OTP_TYPES.includes(rawType as OtpType)) {
    return NextResponse.redirect(failureRedirect)
  }

  const type = rawType as OtpType
  const { error } = await verifyOtp({ token_hash, type })
  if (error) {
    return NextResponse.redirect(failureRedirect)
  }

  // Ensure the application-level profile exists (idempotent for returning users).
  await ensureUserProfile()
  return NextResponse.redirect(`${origin}${next}`)
}
