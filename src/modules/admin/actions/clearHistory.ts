'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'
import { revalidatePath } from 'next/cache'
import type { HistoryClearSource } from '@/types/database'

// Shared implementation for both per-row and per-entity clears.
// Delegates to the clear_user_history() DB function, which performs the
// row lookup, audit insert, and delete as ONE atomic transaction: if the
// delete fails, the audit insert is rolled back with it (no orphaned
// "successful clear" audit row for a failed delete). A no-op (nothing to
// clear) writes no audit row and performs no delete.
async function clearHistory(
  source: HistoryClearSource,
  entityId: string,
  rowId: string | null,
): Promise<{ error?: string; cleared?: number }> {
  const allowed = await hasPermission('audit.clear_history').catch(() => false)
  if (!allowed) return { error: 'forbidden' }

  const me = await getUser()
  if (!me) return { error: 'Unauthorized' }

  const db = createAdminClient()

  const { data, error } = await db.rpc('clear_user_history', {
    p_history_source: source,
    p_entity_id: entityId,
    p_row_id: rowId,
    p_actor_user_id: me.id,
  })

  if (error) {
    console.error('clearHistory rpc failed', { error, source, entityId, rowId })
    return { error: 'clear_failed' }
  }

  const result = data as { cleared_row_count: number } | null
  const cleared = result?.cleared_row_count ?? 0
  if (cleared === 0) return { cleared: 0 }   // no-op: no audit row, no delete, no revalidate

  revalidatePath(`/admin/users/${entityId}`)
  return { cleared }
}

export async function clearHistoryRow(
  source: HistoryClearSource,
  entityId: string,
  rowId: string,
): Promise<{ error?: string; cleared?: number }> {
  return clearHistory(source, entityId, rowId)
}

export async function clearHistoryForEntity(
  source: HistoryClearSource,
  entityId: string,
): Promise<{ error?: string; cleared?: number }> {
  return clearHistory(source, entityId, null)
}
