import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

// Task 991 Revision 1 (F1): the ONE lookup of the account of an address, for the auth actions that act for an anonymous visitor (the sign-up notice, the reset request of a blocked address, the status told after a
// proved password). It calls only `account_status_by_email`: an exact match on the lower-cased address (no LIKE, `%` and `_` are ordinary characters), executable by the service role only, answering one row
// with the status of the profile. The wildcard search of the admin panel (`admin_search_users_by_email`, up to 100 candidates and one Auth admin call each) is not used by any auth action.

export type AccountStatus = { id: string; email: string; blocked: boolean; until: string | null }

/** `null` when no account has exactly this address; throws `lookup_failed` when the lookup cannot be completed (the caller decides what a failed lookup means). */
export async function accountStatusByEmail(email: string): Promise<AccountStatus | null> {
  const { data, error } = await createAdminClient().rpc('account_status_by_email', { p_email: email.trim().toLowerCase() })
  if (error || !Array.isArray(data)) throw new Error('lookup_failed')
  const row = data[0] as { id?: unknown; email?: unknown; status?: unknown; suspended_until?: unknown } | undefined
  if (!row) return null
  if (typeof row.id !== 'string' || typeof row.email !== 'string' || typeof row.status !== 'string') throw new Error('lookup_failed')
  const until = typeof row.suspended_until === 'string' && new Date(row.suspended_until).getTime() > Date.now() ? row.suspended_until : null
  return { id: row.id, email: row.email, blocked: row.status === 'blocked' || row.status === 'inactive', until }
}
