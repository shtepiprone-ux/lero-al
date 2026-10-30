import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { isUuid } from '@/lib/security/inputs'

/**
 * Account access = the status of a profile as Supabase Auth must see it (owner decision D9, 2026-10-17):
 * "a blocked person cannot sign in to the site or the admin and has no access to the account until staff unblock".
 *
 * Two layers, because they stop different things (measured on this project, see docs/sessions/evidence/task923/db-catalog/ban-experiment.cjs):
 *  - this module BANS the account in Supabase Auth: password / OAuth sign-in, token refresh and `auth.getUser` (every Server Action and page that asks
 *    `getUser()`) are refused at once with `user_banned`;
 *  - a still-valid access token (lifetime 3600 s) is not recognised by a ban when it is sent straight to the REST API; the database policies in
 *    `proposed-hardening.sql` (`caller_is_active()`) close that, and they read `users.status`, which callers save BEFORE calling `syncAccountAccess`.
 */

export type AccountStatus = 'active' | 'blocked' | 'inactive'
const STATUSES: readonly AccountStatus[] = ['active', 'blocked', 'inactive']

/** GoTrue reads `ban_duration` as a Go duration; this is "about a hundred years", i.e. until a person lifts it. */
export const PERMANENT_BAN = '876000h'

/**
 * True when the account may be used: `active`, or a `blocked` account whose dated suspension has ended. Same rule as the SQL function
 * `caller_is_active()`; `inactive` (deactivated by staff) has no access.
 */
export function accountHasAccess(status: unknown, suspendedUntil: unknown, now: Date = new Date()): boolean {
  if (status === 'active') return true
  if (status !== 'blocked') return false
  const until = parseDate(suspendedUntil)
  return until !== null && until.getTime() <= now.getTime()
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** The `ban_duration` for a status: `none` lifts a ban, a dated suspension bans for the minutes left (rounded up), everything else is permanent. */
export function banDurationFor(status: AccountStatus, suspendedUntil: string | null, now: Date = new Date()): string {
  if (accountHasAccess(status, suspendedUntil, now)) return 'none'
  const until = status === 'blocked' ? parseDate(suspendedUntil) : null
  if (until === null) return PERMANENT_BAN
  return `${Math.max(1, Math.ceil((until.getTime() - now.getTime()) / 60_000))}m`
}

/**
 * Is this account LIVE: it has a profile row, the row is not deleted and its status gives access (Task 923 R66 (f), owner F2: a contact path serves a listing of a live
 * owner only)? `null` when the row cannot be read, which a caller must treat as "not proven live", never as live.
 */
export async function isLiveAccount(userId: string): Promise<boolean | null> {
  try {
    const { data, error } = await createAdminClient().from('users').select('status, suspended_until, deleted_at').eq('id', userId).maybeSingle()
    if (error) return null
    if (!data || data.deleted_at) return false
    return accountHasAccess(data.status, data.suspended_until)
  } catch {
    return null
  }
}

export type SyncAccountAccessResult = { ok: true } | { ok: false; error: 'invalid_input' | 'access_sync_failed' }

/**
 * Brings the Supabase Auth ban in line with a profile status that has ALREADY been saved. Input comes from a Server Action whose TypeScript types are
 * erased at runtime, so it is checked here before anything reaches Auth. A failure is returned, never swallowed: the caller must tell the administrator
 * that access could not be fully removed. Nothing but a status code is logged (no token, key or message).
 */
export async function syncAccountAccess(userId: unknown, status: unknown, suspendedUntil: unknown, now: Date = new Date()): Promise<SyncAccountAccessResult> {
  if (typeof userId !== 'string' || !isUuid(userId)) return { ok: false, error: 'invalid_input' }
  if (typeof status !== 'string' || !(STATUSES as readonly string[]).includes(status)) return { ok: false, error: 'invalid_input' }
  if (suspendedUntil !== null && suspendedUntil !== undefined && parseDate(suspendedUntil) === null) return { ok: false, error: 'invalid_input' }
  const until = typeof suspendedUntil === 'string' ? suspendedUntil : null
  try {
    const { error } = await createAdminClient().auth.admin.updateUserById(userId, { ban_duration: banDurationFor(status as AccountStatus, until, now) })
    if (error) {
      console.error('[accountAccess] ban sync failed', { status: (error as { status?: number }).status ?? null })
      return { ok: false, error: 'access_sync_failed' }
    }
    return { ok: true }
  } catch {
    console.error('[accountAccess] ban sync threw')
    return { ok: false, error: 'access_sync_failed' }
  }
}
