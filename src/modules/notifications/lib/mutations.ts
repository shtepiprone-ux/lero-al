'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { NotificationType } from '@/types/database'

// ── Creation (service-role — bypasses RLS) ────────────────────────────────────

export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string
  type: NotificationType
  title: string
  body: string
  link?: string
}): Promise<void> {
  const db = createAdminClient()
  const { error } = await db.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    link: link ?? null,
  })
  if (error) {
    console.error('[notifications] createNotification failed', { error, userId, type })
  }
}

// ── Read state (user-scoped — RLS enforces ownership) ─────────────────────────

export async function markNotificationRead(id: string): Promise<void> {
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
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false)
  if (error) {
    console.error('[notifications] markAllNotificationsRead failed', { error })
  }
}
