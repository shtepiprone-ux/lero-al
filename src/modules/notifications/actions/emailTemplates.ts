'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { checkStaff } from '@/lib/auth/staff'
import type { EmailTemplate } from '@/types/database'

type SupportedLocale = 'sq' | 'en' | 'uk' | 'it'

async function assertAdminOrModerator() {
  // one guard for every staff action (Task 923 R71 (k)): a blocked, deactivated, deleted or missing account of any role is refused here too
  // Task 923 R75: a moderator needs the `email_templates.manage` key (deleting stays administrator-only, below); an administrator holds every key
  const staff = await checkStaff({ permission: 'email_templates.manage' })
  if (!staff.ok) return { error: staff.reason === 'unauthenticated' ? ('unauthorized' as const) : ('forbidden' as const) }
  return { user: { id: staff.userId }, role: staff.role }
}

/** DELETE is admin-only per the email_templates policy (Task 123 / Task 161). */
async function assertAdmin() {
  const staff = await checkStaff({ adminOnly: true })
  if (!staff.ok) return { error: staff.reason === 'unauthenticated' ? ('unauthorized' as const) : ('forbidden' as const) }
  return { user: { id: staff.userId } }
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

  // The types are erased at runtime (Task 923 Revision 7): a template is stored only with a plain key, one of the four languages, text of a sane size and a list
  // of placeholder names.
  const key = typeof data?.key === 'string' ? data.key.trim().toLowerCase().replace(/\s+/g, '_') : ''
  if (
    !/^[a-z0-9_-]{1,64}$/.test(key) ||
    !(['sq', 'en', 'uk', 'it'] as const).includes(data.locale) ||
    typeof data.subject !== 'string' || !data.subject.trim() || data.subject.length > 300 ||
    typeof data.html_body !== 'string' || data.html_body.length > 200_000 ||
    !Array.isArray(data.variables) || data.variables.length > 50 || !data.variables.every((v) => typeof v === 'string' && /^\w{1,64}$/.test(v)) ||
    typeof data.is_active !== 'boolean'
  ) {
    return { error: 'validation' }
  }

  const db = createAdminClient()
  const { data: row, error } = await db
    .from('email_templates')
    .upsert(
      {
        key,
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
