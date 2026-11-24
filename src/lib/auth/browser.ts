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

// Task 1033: on a sign-out supabase-js gives the Realtime client the anonymous key and Realtime pushes it to every joined channel, which checks the notifications
// filter as `anon` ("invalid column for filter user_id"). The channels are removed first; a failure there never blocks the sign-out.
export async function signOut(scope?: 'global' | 'local') {
  const supabase = createClient()
  try {
    await supabase.removeAllChannels()
  } catch {
    // the sign-out below still runs
  }
  return supabase.auth.signOut(scope ? { scope } : undefined)
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
// Fetches the application-level user profile row from the database, or null when it cannot be read or there is none.
//
// It never writes (Task 956 AC15). It used to upsert a profile when the read returned nothing; `users` has no permissive INSERT policy, so that upsert never wrote a row, and the profile row is made by
// the sign-up trigger public.handle_new_user() (trigger on_auth_user_created on auth.users). Task 923 Revision 7, finding S58: a write here, after a read that failed (network, a temporary database
// error), could take "no data" for "no profile" and overwrite the real row with role "user" and "not verified"; with no write there is nothing to overwrite.
// A search of src for callers of this function found none outside the tests (Task 956, 2026-11-15).

export async function resolveProfile(authUserId: string): Promise<User | null> {
  const supabase = createClient()

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUserId)
    .single()

  return (data as User | null) ?? null
}
