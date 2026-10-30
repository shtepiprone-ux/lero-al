import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { NotificationType } from '@/types/database'

/**
 * Insert a notification for a user (service-role: it bypasses row-level security).
 *
 * Security (Task 923 Revision 7, finding S1): this lives HERE and not in `mutations.ts` because that file is `'use server'`, and every function exported from a
 * `'use server'` file is a public HTTP endpoint. As a Server Action this function let ANY visitor insert a notification with any text and any link into ANY
 * user's notification centre (a ready-made phishing channel). It is a plain server-only module now: only code that runs on the server (the cron jobs and
 * the Server Actions that have already checked who is calling) can import it, and importing it into a client bundle fails the build (`server-only`).
 */
export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
  templateId,
  templateParams,
}: {
  userId: string
  type: NotificationType
  title: string
  body: string
  link?: string
  templateId?: string
  templateParams?: Record<string, unknown>
}): Promise<void> {
  const db = createAdminClient()
  const { error } = await db.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    link: link ?? null,
    template_id: templateId ?? null,
    template_params: templateParams ?? null,
  })
  if (error) {
    console.error('[notifications] createNotification failed', { error, userId, type })
  }
}
