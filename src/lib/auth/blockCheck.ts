/**
 * Canonical block/suspension check — Task 160 / Epic C.5 follow-up.
 *
 * Single source of truth for "is this user allowed to perform writes?"
 * Call before every authenticated write action (create/edit listing, favorites,
 * collections, reports, profile updates).
 *
 * Auto-lift: if suspended_until has passed, status is reset to 'active' atomically
 * (no manual admin step required per the Task 126 review finding) and the Supabase Auth
 * ban set for the suspension is lifted with it (owner decision D9, 2026-10-17; the ban also
 * ends by itself at its own date, so this only keeps the two in step).
 *
 * Error codes returned:
 *   'account_blocked'   — permanent block (suspended_until is null), or a deactivated ('inactive') account
 *   'account_suspended' — time-based suspension (suspended_until > now)
 *   null                — user is allowed to proceed
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { accountHasAccess, syncAccountAccess } from '@/lib/auth/accountAccess'

export type BlockedError = 'account_blocked' | 'account_suspended'

export async function getBlockedError(userId: string): Promise<BlockedError | null> {
  // Read through the service role by the caller's id (Task 923 R44 (d), D26, D27): the session client's answer depends on row-level security, and a
  // blocked or deleted account must not be able to hide its own status. Nothing is read from the request.
  const { data: profile } = await createAdminClient()
    .from('users')
    .select('status, suspended_until, deleted_at')
    .eq('id', userId)
    .single()

  // No profile row, or a deleted one, is no access (it was "not a block" before): who may act at all is decided by getUser() / requireViewer(), and this
  // check must agree with them.
  if (!profile || profile.deleted_at) return 'account_blocked'
  if (profile.status === 'active') return null

  if (profile.status === 'blocked' && profile.suspended_until) {
    if (accountHasAccess(profile.status, profile.suspended_until)) {
      // Auto-lift: suspension expired — restore to active via admin client (bypasses RLS) and lift the Auth ban with it.
      // Task 923 R66 (k): the write is a compare-and-set. It matches the row only while the status is still `blocked` AND the end date is still the one that was read, and
      // it returns the row it changed. A block that staff wrote after the read (a permanent one, or a new date) matches nothing, so it is never erased and the Auth ban is
      // never lifted; the caller then gets `account_blocked` (the next request reads the new state).
      const { data: lifted, error } = await createAdminClient()
        .from('users')
        .update({ status: 'active', suspended_until: null, block_reason: null })
        .eq('id', userId)
        .eq('status', 'blocked')
        .eq('suspended_until', profile.suspended_until)
        .select('id')
      if (error) return null            // the status could not be saved: the ban stays, and the ended suspension still lets the person proceed (as before)
      if (lifted?.length !== 1) return 'account_blocked'
      await syncAccountAccess(userId, 'active', null)
      return null
    }
    return 'account_suspended'
  }

  // permanent block, or any other status without access (deactivated by staff)
  return 'account_blocked'
}
