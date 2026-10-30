/**
 * auth-core / browser
 *
 * Browser-side authentication operations — the only permitted entry point for
 * auth state mutations and subscriptions in Client Components.
 *
 * Uses the singleton browser Supabase client from @/lib/supabase/client, which
 * carries the custom promise-queue mutex that serialises concurrent auth
 * operations and prevents the "Invalid Refresh Token: Refresh Token Not Found"
 * race condition caused by React Strict Mode double-invocation.
 *
 * All functions return the raw Supabase result so callers can inspect errors
 * without wrapping in try/catch (Supabase SDK never throws in normal usage).
 */

import { createClient } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import type { User } from '@/types/database'

// ── Sign-in ──────────────────────────────────────────────────────────────────

// Supabase's CAPTCHA protection refuses a password sign-in without a token (Task 923 R150).
export function signIn(email: string, password: string, captchaToken: string) {
  return createClient().auth.signInWithPassword({ email, password, options: { captchaToken } })
}

// Google sign-in (Task 927): Google Identity Services returns an ID token in the browser; `nonce` is the RAW nonce whose SHA-256 hex Google was given.
export function signInWithGoogleIdToken(token: string, nonce: string) {
  return createClient().auth.signInWithIdToken({ provider: 'google', token, nonce })
}

export function signUp(
  email: string,
  password: string,
  options: {
    emailRedirectTo: string
    data?: Record<string, unknown>
  }
) {
  return createClient().auth.signUp({ email, password, options })
}

// ── Password recovery ────────────────────────────────────────────────────────

export function requestPasswordReset(email: string, redirectTo: string) {
  return createClient().auth.resetPasswordForEmail(email, { redirectTo })
}

export function updatePassword(password: string) {
  return createClient().auth.updateUser({ password })
}

export function verifyOtp({ token_hash, type }: { token_hash: string; type: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient().auth.verifyOtp({ token_hash, type: type as any })
}

// ── Sign-out ─────────────────────────────────────────────────────────────────

export function signOut(scope?: 'global' | 'local') {
  return createClient().auth.signOut(scope ? { scope } : undefined)
}

// ── Session access ───────────────────────────────────────────────────────────

export function getSession() {
  return createClient().auth.getSession()
}

// Force-refreshes the access token using the stored refresh token.
// Called by the auth provider on recovery scenarios.
export function refreshSession() {
  return createClient().auth.refreshSession()
}

// ── Auth state subscription ──────────────────────────────────────────────────

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  return createClient().auth.onAuthStateChange(callback)
}

// ── Application profile resolution ───────────────────────────────────────────
//
// Fetches the application-level user profile row from the database.
// On first OAuth sign-in (no row yet), upserts the profile with metadata
// from the provider so the user can immediately use the application.
//
// Lives here (auth-core) because it is an integral part of the auth lifecycle:
// it is called exclusively from onAuthStateChange handlers.

export async function resolveProfile(
  authUserId: string,
  userMeta: Record<string, unknown>
): Promise<User | null> {
  const supabase = createClient()

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUserId)
    .single()

  if (data) return data as User

  const name =
    (userMeta?.full_name as string | undefined) ??
    (userMeta?.name as string | undefined) ??
    null

  const { data: created } = await supabase
    .from('users')
    // Task 923 Revision 7, finding S58: creating must never touch a row that exists. When the read above failed (network, a temporary database error) "no data"
    // was taken for "no profile", and this upsert overwrote the real row with role "user" and "not verified": an administrator or a verified agent lost the role or
    // the badge. With `ignoreDuplicates` an existing row is left alone (and nothing is returned for it).
    .upsert(
      {
        id: authUserId,
        name,
        user_type: 'private',
        role: 'user',
        is_verified: false,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    )
    .select()
    .single()

  return (created as User | null) ?? null
}
