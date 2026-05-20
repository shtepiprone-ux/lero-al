'use server'

import { createAdminClient } from '@/lib/supabase/admin'

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
