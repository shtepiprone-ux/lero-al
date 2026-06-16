import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Handles token-hash email confirmation for signup, recovery, and magic-link flows.
// Supabase's Send Email Hook (Task 122) builds confirmation links pointing here
// so they work cross-device (no PKCE code_verifier cookie needed).
// OAuth (Google) PKCE code exchange continues to use /auth/callback.

const VALID_OTP_TYPES = ['signup', 'invite', 'recovery', 'magiclink', 'email_change', 'email'] as const
type OtpType = (typeof VALID_OTP_TYPES)[number]

const LOCALE_RE = /^\/(sq|en|uk|it)\//
const SUPPORTED_LOCALES = ['sq', 'en', 'uk', 'it']

function deriveLocale(next: string): string {
  return LOCALE_RE.exec(next)?.[1] ?? 'sq'
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const rawType = searchParams.get('type')
  const next = searchParams.get('next') ?? '/sq/auth/verified'

  const locale = deriveLocale(next)
  const failureRedirect = `${origin}/${locale}/auth/verified?error=confirm_failed`

  if (!token_hash || !rawType || !VALID_OTP_TYPES.includes(rawType as OtpType)) {
    return NextResponse.redirect(`${origin}/${locale}/auth/login?error=auth_callback_failed`)
  }

  const type = rawType as OtpType

  // Build the success redirect response FIRST, then write session cookies directly onto
  // it inside setAll(). This mirrors the middleware pattern and guarantees the Set-Cookie
  // headers are present on the 307 redirect that the browser follows.
  //
  // Using cookies().set() from next/headers and then returning NextResponse.redirect()
  // does not reliably propagate cookie mutations in Next.js 15: the redirect response is
  // a new Response object that does not inherit pending cookie mutations from the
  // next/headers cookie store (the same root cause as the header/auth mismatch on the
  // /auth/verified page — Task 446 Branch C diagnosis).
  const successRedirect = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write into request.cookies so in-process reads within this same handler
          // (e.g. the profile upsert which executes as the authenticated user) can
          // see the new session tokens via request.cookies.getAll().
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Write onto the redirect response so the browser receives Set-Cookie headers
          // and carries the session to the subsequent /{locale}/auth/verified request.
          cookiesToSet.forEach(({ name, value, options }) =>
            successRedirect.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { error, data } = await supabase.auth.verifyOtp({ token_hash, type })
  if (error || !data.user) {
    return NextResponse.redirect(failureRedirect)
  }

  // Ensure the application-level profile row exists (idempotent for returning users).
  // Uses the same inline client (whose getAll reads the just-updated request.cookies)
  // instead of calling ensureUserProfile() from lib/auth/server, which uses
  // cookies() from next/headers and may not see the session tokens set above.
  try {
    const authUser = data.user
    const meta = authUser.user_metadata ?? {}
    const metaLocale = meta.preferred_locale as string | undefined
    const preferredLocale =
      metaLocale && SUPPORTED_LOCALES.includes(metaLocale) ? metaLocale : 'sq'

    await supabase.from('users').upsert(
      {
        id: authUser.id,
        name:
          (meta.full_name as string | undefined) ??
          (meta.name as string | undefined) ??
          null,
        user_type: 'private',
        role: 'user',
        is_verified: false,
        preferred_locale: preferredLocale,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    const companyId = meta.company_id as string | undefined
    if (companyId) {
      await supabase
        .from('users')
        .update({ company_id: companyId })
        .eq('id', authUser.id)
        .is('company_id', null)
    }
  } catch {}

  return successRedirect
}
