'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'

async function assertAdminOrMod(): Promise<string | null> {
  const user = await getUser()
  if (!user) return 'unauthorized'
  const db = createAdminClient()
  const { data } = await db.from('users').select('role').eq('id', user.id).single()
  if (!data || !['admin', 'moderator'].includes(data.role as string)) return 'forbidden'
  return null
}

/**
 * Create a new company record. Uses the service-role client so it can be
 * called during agent registration (before the user has a session).
 * Returns the new company id on success, or an error code.
 */
export async function createCompanyAction(
  name: string
): Promise<{ id?: string; error?: string }> {
  const trimmed = name.trim()
  if (!trimmed || trimmed.length < 2) return { error: 'company_name_too_short' }
  if (trimmed.length > 120) return { error: 'company_name_too_long' }

  const db = createAdminClient()
  const { data, error } = await db
    .from('companies')
    .insert({ name: trimmed })
    .select('id')
    .single()

  if (error) {
    console.error('createCompanyAction failed', error)
    return { error: 'save_failed' }
  }

  return { id: data.id }
}

export async function updateCompanyAction(
  id: string,
  name: string,
): Promise<{ error?: string }> {
  const authError = await assertAdminOrMod()
  if (authError) return { error: authError }

  const trimmed = name.trim()
  if (!trimmed || trimmed.length < 2) return { error: 'company_name_too_short' }
  if (trimmed.length > 120) return { error: 'company_name_too_long' }

  const db = createAdminClient()
  const { error } = await db.from('companies').update({ name: trimmed }).eq('id', id)
  if (error) return { error: 'save_failed' }
  return {}
}

export async function deleteCompanyAction(id: string): Promise<{ error?: string }> {
  const authError = await assertAdminOrMod()
  if (authError) return { error: authError }

  const db = createAdminClient()
  const { error } = await db.from('companies').delete().eq('id', id)
  if (error) return { error: 'delete_failed' }
  return {}
}
