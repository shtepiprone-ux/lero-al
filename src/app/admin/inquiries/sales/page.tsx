import { getTranslations } from 'next-intl/server'
import { requireStaffPage } from '@/lib/auth/staff'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import {
  AdminInquiriesManager,
  type InquiryRow,
} from '@/components/admin/AdminInquiriesManager'
import { loadInquiryReplies } from '@/modules/contacts/lib/inquiryReplies'

// Task 988: the tab title is the page heading in the admin language; the viewer is checked first, as in the page (Task 923 R68 (a))
export async function generateMetadata() {
  await requireStaffPage({ page: 'page.inquiries_sales' })
  await getAdminLocale()
  const t = await getTranslations('admin.pages')
  return { title: `${t('inquiries_sales_title')} — Admin` }
}

export default async function AdminInquiriesSalesPage() {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage({ page: 'page.inquiries_sales' })
  await getAdminLocale()
  const t = await getTranslations('admin.pages')
  const db = createAdminClient()

  // Server-side scope: sales mailbox only (any target_mailbox containing 'sales').
  const { data: rawInquiries, count } = await db
    .from('contact_inquiries')
    .select(
      'id, created_at, topic, custom_subject, name, email, message, target_mailbox, status, reply_count, handled_at, source, attachments',
      { count: 'exact' },
    )
    .ilike('target_mailbox', '%sales%')
    .order('created_at', { ascending: false })
    .limit(200)

  const inquiries = (rawInquiries ?? []) as InquiryRow[]
  const inquiryIds = inquiries.map(i => i.id)

  const replies = await loadInquiryReplies(db, inquiryIds)

  return (
    <AdminPageFrame>
      <AdminPageHeader
        title={t('inquiries_sales_title')}
        subtitle={t('inquiries_subtitle', { count: count ?? 0 })}
      />
      <AdminInquiriesManager inquiries={inquiries} replies={replies} mailboxScope="sales" />
    </AdminPageFrame>
  )
}
