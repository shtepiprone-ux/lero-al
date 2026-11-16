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
import { createAdminClient } from '@/lib/supabase/admin'
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

// ── The company of a new agent, after auth ─────────────────────────────────────
//
// Called from /auth/callback (OAuth PKCE) after the session is established. It inserts nothing into `users` (Task 956 AC15): the table has no permissive INSERT policy, so a session insert
// or upsert never wrote a row, and the profile row is made by the sign-up trigger public.handle_new_user() (trigger on_auth_user_created on auth.users). It is idempotent: it only gives the
// person the company the sign-up named, and only while the person has none.

export async function ensureUserProfile(): Promise<void> {
  try {
    const authUser = await getUser()
    if (!authUser) return

    const meta = authUser.user_metadata ?? {}

    // `users.company_id` is a server-only column (Task 956, hardening v8b): a session cannot write it, so the server does, on the person's own row and only while it is empty
    const companyId = meta.company_id as string | undefined
    if (companyId) {
      await createAdminClient()
        .from('users')
        .update({ company_id: companyId })
        .eq('id', authUser.id)
        .is('company_id', null)
    }
  } catch {}
}
