import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import { accountHasAccess } from '@/lib/auth/accountAccess'
import type { UserRole } from '@/types/database'

/**
 * Who is allowed to reach the listing owner (owner correction, 2026-10-17: "a guest has no access to the owner's contact card").
 *
 * The page and the contact card already show a guest only the sign-in prompt, but a hidden button proves presentation only: a Server Action is a public
 * endpoint that anyone can call with their own request. The Server Actions that reach the owner call this first, and its answer decides whether they run.
 *
 * A viewer is a person with
 *  1. a session that Supabase Auth itself validates (`getUser()` asks GoTrue; a banned account is refused there),
 *  2. a profile row (a "zombie" session of a deleted profile is a guest, exactly as the listing page treats it),
 *  3. a profile that is not deleted and whose status gives access (`active`, or a suspension that has ended).
 *
 * The answer carries the person's `role` from the same service-role row (Task 923 R44, owner decisions D25-D27): every server decision by
 * role takes it from here, so a blocked, deactivated, deleted or missing account of ANY role (user, agent, moderator, administrator) gets
 * nothing from a guard. No second helper reads `users.role` for a decision.
 *
 * A failing lookup is NOT a guest and NOT a viewer: it is `lookup_failed`, so the caller answers "try again" instead of a misleading "sign in", and nothing
 * is done. Order matters for callers: this runs before any read of the owner, any write, e-mail or notification.
 */
export type ViewerResult =
  | { ok: true; userId: string; role: UserRole | null }
  | { ok: false; reason: 'unauthenticated' | 'lookup_failed' }

export async function requireViewer(): Promise<ViewerResult> {
  let authUserId: string | null
  try {
    authUserId = (await getUser())?.id ?? null
  } catch {
    return { ok: false, reason: 'lookup_failed' }
  }
  if (!authUserId) return { ok: false, reason: 'unauthenticated' }

  try {
    const { data, error } = await createAdminClient()
      .from('users')
      .select('role, status, suspended_until, deleted_at')
      .eq('id', authUserId)
      .maybeSingle()
    if (error) return { ok: false, reason: 'lookup_failed' }
    if (!data || data.deleted_at) return { ok: false, reason: 'unauthenticated' }
    if (!accountHasAccess(data.status, data.suspended_until)) return { ok: false, reason: 'unauthenticated' }
    return { ok: true, userId: authUserId, role: (data.role as UserRole | null) ?? null }
  } catch {
    return { ok: false, reason: 'lookup_failed' }
  }
}
