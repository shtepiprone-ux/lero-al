import type { SupabaseClient } from '@supabase/supabase-js'
import type { ReplyRow } from '@/components/admin/AdminInquiriesManager'

/**
 * The replies of the inquiries an admin page lists, oldest first, each with the name of the staff member who sent it (Task 1034).
 * The name is read from `replied_by_name` (kept by a trigger, Task 923): `replied_by` references `auth.users`, so PostgREST has no embed for it (PGRST200).
 * A failed read is logged by its code only (never a body, a name or an address) and gives no replies; the dialog then shows its "could not be loaded" alert.
 */
export async function loadInquiryReplies(db: SupabaseClient, inquiryIds: string[]): Promise<ReplyRow[]> {
  if (inquiryIds.length === 0) return []

  const { data, error } = await db
    .from('contact_inquiry_replies')
    .select('id, inquiry_id, body, created_at, replied_by, replied_by_name, direction, from_email, attachments')
    .in('inquiry_id', inquiryIds)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[admin-inquiries] the replies were not loaded', { code: error.code })
    return []
  }
  return (data ?? []).map(row => ({
    id: row.id,
    inquiry_id: row.inquiry_id,
    body: row.body,
    created_at: row.created_at,
    replied_by: row.replied_by,
    replier: row.replied_by_name ? { name: row.replied_by_name } : null,
    // Task 1044: a customer's answer received by mail, with its sender and attachment names
    direction: row.direction,
    from_email: row.from_email,
    attachments: row.attachments,
  }))
}
