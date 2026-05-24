import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import {
  AdminInquiriesManager,
  type InquiryRow,
  type ReplyRow,
} from '@/components/admin/AdminInquiriesManager'

export const metadata = { title: 'Inquiries — Admin' }

export default async function AdminInquiriesPage() {
  await getAdminLocale()
  const t = await getTranslations('admin.pages')
  const db = createAdminClient()

  const { data: rawInquiries, count } = await db
    .from('contact_inquiries')
    .select(
      'id, created_at, topic, custom_subject, name, email, message, target_mailbox, status, reply_count, handled_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .limit(200)

  const inquiries = (rawInquiries ?? []) as InquiryRow[]
  const inquiryIds = inquiries.map(i => i.id)

  let replies: ReplyRow[] = []
  if (inquiryIds.length > 0) {
    const { data: rawReplies } = await db
      .from('contact_inquiry_replies')
      .select('id, inquiry_id, body, created_at, replied_by, replier:users!replied_by(name)')
      .in('inquiry_id', inquiryIds)
      .order('created_at', { ascending: true })
    replies = (rawReplies ?? []) as unknown as ReplyRow[]
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <AdminPageHeader
        title={t('inquiries_title')}
        subtitle={t('inquiries_subtitle', { count: count ?? 0 })}
      />
      <AdminInquiriesManager inquiries={inquiries} replies={replies} />
    </div>
  )
}
