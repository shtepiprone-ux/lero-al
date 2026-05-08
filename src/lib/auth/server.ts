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
