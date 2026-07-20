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
 * Returns the new company id on success, an existing company id flagged as
 * a duplicate when the name already exists, or an error code.
 */
export async function createCompanyAction(
  name: string
): Promise<{ id?: string; duplicate?: boolean; error?: string }> {
  const trimmed = name.trim()
  if (!trimmed || trimmed.length < 2) return { error: 'company_name_too_short' }
  if (trimmed.length > 120) return { error: 'company_name_too_long' }

  const db = createAdminClient()
  const normalized = trimmed.toLowerCase()

  const { data: existing } = await db.from('companies').select('id, name')
  const existingMatch = existing?.find(c => c.name.trim().toLowerCase() === normalized)
  if (existingMatch) {
    return { id: existingMatch.id, duplicate: true }
  }

  const { data, error } = await db
    .from('companies')
    .insert({ name: trimmed })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      const { data: retryExisting } = await db.from('companies').select('id, name')
      const retryMatch = retryExisting?.find(c => c.name.trim().toLowerCase() === normalized)
      if (retryMatch) {
        return { id: retryMatch.id, duplicate: true }
      }
    }
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
