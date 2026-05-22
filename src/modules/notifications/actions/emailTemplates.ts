'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailTemplate } from '@/types/database'

type SupportedLocale = 'sq' | 'en' | 'uk' | 'it'

async function assertAdminOrModerator() {
  const user = await getUser()
  if (!user) return { error: 'unauthorized' as const }

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'moderator') {
    return { error: 'forbidden' as const }
  }
  return { user, role: profile.role as 'admin' | 'moderator' }
}

/** DELETE is admin-only per the email_templates policy (Task 123 / Task 161). */
async function assertAdmin() {
  const user = await getUser()
  if (!user) return { error: 'unauthorized' as const }

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'forbidden' as const }
  }
  return { user }
}

// Upsert one locale variant of a template (insert or update on key+locale conflict).
export async function upsertEmailTemplateAction(data: {
  key: string
  locale: SupportedLocale
  subject: string
  html_body: string
  variables: string[]
  is_active: boolean
}): Promise<{ template?: EmailTemplate; error?: string }> {
  const auth = await assertAdminOrModerator()
  if ('error' in auth && !auth.user) return { error: auth.error }

  const db = createAdminClient()
  const { data: row, error } = await db
    .from('email_templates')
    .upsert(
      {
        key: data.key.trim().toLowerCase().replace(/\s+/g, '_'),
        locale: data.locale,
        subject: data.subject.trim(),
        html_body: data.html_body,
        variables: data.variables,
        is_active: data.is_active,
        updated_by: (auth as { user: { id: string } }).user?.id ?? null,
      },
      { onConflict: 'key,locale' },
    )
    .select()
    .single()

  if (error) {
    console.error('[emailTemplates] upsert error', error)
    return { error: 'save_failed' }
  }
  return { template: row as EmailTemplate }
}

// Delete all locale variants for a given key — ADMIN ONLY (Task 161).
export async function deleteEmailTemplateGroupAction(
  key: string,
): Promise<{ error?: string }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  const db = createAdminClient()
  const { error } = await db
    .from('email_templates')
    .delete()
    .eq('key', key)

  if (error) {
    console.error('[emailTemplates] delete error', error)
    return { error: 'delete_failed' }
  }
  return {}
}

// Delete a single locale variant by id — ADMIN ONLY (Task 161).
export async function deleteEmailTemplateLocaleAction(
  id: string,
): Promise<{ error?: string }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { error: auth.error }

  const db = createAdminClient()
  const { error } = await db
    .from('email_templates')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[emailTemplates] delete locale error', error)
    return { error: 'delete_failed' }
  }
  return {}
}
