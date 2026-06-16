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

export function signIn(email: string, password: string) {
  return createClient().auth.signInWithPassword({ email, password })
}

export function signInWithOAuth(provider: 'google', redirectTo: string) {
  return createClient().auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  })
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
    .upsert({
      id: authUserId,
      name,
      user_type: 'private',
      role: 'user',
      is_verified: false,
    })
    .select()
    .single()

  return (created as User | null) ?? null
}
