'use server'

// Only the two actions a signed-in person runs on their OWN notifications live here (row-level security limits them to the caller's rows).
// The service-role writer is `createNotification.ts`: it must not be a Server Action (Task 923 Revision 7, S1).

import { createClient } from '@/lib/supabase/server'
import { requireViewer } from '@/lib/auth/requireViewer'

// ── Read state (user-scoped — RLS enforces ownership) ─────────────────────────

export async function markNotificationRead(id: string): Promise<void> {
  // Task 923 R44: a person whose account has no access changes nothing (checked before the database is touched).
  if (!(await requireViewer()).ok) return
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('is_read', false)
  if (error) {
    console.error('[notifications] markNotificationRead failed', { error, id })
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  if (!(await requireViewer()).ok) return
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false)
  if (error) {
    console.error('[notifications] markAllNotificationsRead failed', { error })
  }
}
