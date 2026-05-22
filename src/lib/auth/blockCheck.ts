/**
 * Canonical block/suspension check — Task 160 / Epic C.5 follow-up.
 *
 * Single source of truth for "is this user allowed to perform writes?"
 * Call before every authenticated write action (create/edit listing, favorites,
 * collections, reports, profile updates).
 *
 * Auto-lift: if suspended_until has passed, status is reset to 'active' atomically
 * (no manual admin step required per the Task 126 review finding).
 *
 * Error codes returned:
 *   'account_blocked'   — permanent block (suspended_until is null)
 *   'account_suspended' — time-based suspension (suspended_until > now)
 *   null                — user is allowed to proceed
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type BlockedError = 'account_blocked' | 'account_suspended'

export async function getBlockedError(userId: string): Promise<BlockedError | null> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('users')
    .select('status, suspended_until')
    .eq('id', userId)
    .single()

  if (!profile || profile.status !== 'blocked') return null

  if (profile.suspended_until) {
    const now = new Date()
    const until = new Date(profile.suspended_until)
    if (now >= until) {
      // Auto-lift: suspension expired — restore to active via admin client (bypasses RLS)
      await createAdminClient()
        .from('users')
        .update({ status: 'active', suspended_until: null, block_reason: null })
        .eq('id', userId)
      return null
    }
    return 'account_suspended'
  }

  return 'account_blocked'
}
