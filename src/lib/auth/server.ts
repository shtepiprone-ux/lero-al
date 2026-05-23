/**
 * auth-core / server
 *
 * Server-side authentication operations — the only permitted entry point for
 * reading auth state in Server Components, Route Handlers, and API routes.
 *
 * Uses the cookie-based server Supabase client from @/lib/supabase/server.
 * All functions are safe to call in any server context; none ever throws —
 * errors are caught and collapsed to a null / empty result so the caller
 * never needs to wrap them in try/catch.
 */

import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types/database'

// ── Validated auth user (from JWT, not from local session cache) ─────────────

export async function getUser() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

// ── Raw Supabase session (access + refresh tokens) ───────────────────────────

export async function getSession() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch {
    return null
  }
}

// ── Full SSR resolution: validated user + application profile ────────────────
//
// This is the canonical SSR entry point for auth state used by the locale
// layout and the /api/auth/me endpoint.  Both callers receive exactly the
// same shape so they stay in sync.

export async function resolveSession(): Promise<{ user: User | null }> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { user: null }

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    return { user: (data as User | null) ?? null }
  } catch {
    return { user: null }
  }
}

// ── OAuth / email-confirmation code exchange ─────────────────────────────────

export async function exchangeCodeForSession(code: string) {
  const supabase = await createClient()
  return supabase.auth.exchangeCodeForSession(code)
}

// ── Token-hash OTP verification (used by /auth/confirm for link-based emails) ──

type EmailOtpType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email'

export async function verifyOtp(params: { token_hash: string; type: EmailOtpType }) {
  const supabase = await createClient()
  return supabase.auth.verifyOtp(params)
}

// ── Ensure application-level user profile exists after auth ───────────────────
//
// Called from /auth/callback (OAuth PKCE) and /auth/confirm (token-hash) after
// the session is established. Idempotent — safe to call for returning users.

export async function ensureUserProfile(): Promise<void> {
  try {
    const authUser = await getUser()
    if (!authUser) return

    const meta = authUser.user_metadata ?? {}
    const supabase = await createClient()

    const SUPPORTED_LOCALES = ['sq', 'en', 'uk', 'it']
    const metaLocale = meta.preferred_locale as string | undefined
    const preferredLocale = metaLocale && SUPPORTED_LOCALES.includes(metaLocale) ? metaLocale : 'sq'

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
}
