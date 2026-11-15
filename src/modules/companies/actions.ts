'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { checkStaff } from '@/lib/auth/staff'
import { escapeLike } from '@/lib/postgrest/escape'

async function assertAdminOrMod(): Promise<string | null> {
  // one guard for every staff action (Task 923 R71 (k)): a blocked, deactivated, deleted or missing account of any role is refused here too
  // Task 923 R75: a moderator needs the `companies.manage` key; an administrator holds every key
  const staff = await checkStaff({ permission: 'companies.manage' })
  if (staff.ok) return null
  return staff.reason === 'unauthenticated' ? 'unauthorized' : 'forbidden'
}

/**
 * Create a new company record (staff with `companies.manage` only: Task 926). Uses the service-role client, so the staff check is the first statement and
 * nothing is read from or written to the database before it passes.
 * Returns the new company id on success, an existing company id flagged as a duplicate when the name already exists, or an error code
 * (`unauthorized` / `forbidden` from the staff check, otherwise the name and save errors).
 *
 * Security (Task 923 Revision 7, findings S3 / S6): the name lookup asks the database for the one name (case-insensitive, wildcards escaped) instead of reading
 * the WHOLE companies table into the server on every call.
 */
export async function createCompanyAction(
  name: string
): Promise<{ id?: string; duplicate?: boolean; error?: string }> {
  const authError = await assertAdminOrMod()
  if (authError) return { error: authError }

  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (!trimmed || trimmed.length < 2) return { error: 'company_name_too_short' }
  if (trimmed.length > 120) return { error: 'company_name_too_long' }

  const db = createAdminClient()
  const normalized = trimmed.toLowerCase()
  const findExisting = async () => {
    const { data } = await db.from('companies').select('id, name').ilike('name', escapeLike(trimmed)).limit(5)
    return data?.find((c) => c.name.trim().toLowerCase() === normalized)
  }

  const existingMatch = await findExisting()
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
      const retryMatch = await findExisting()
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
