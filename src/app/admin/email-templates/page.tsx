import { getTranslations } from 'next-intl/server'
import { requireStaffPage } from '@/lib/auth/staff'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireViewer } from '@/lib/auth/requireViewer'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminEmailTemplatesManager } from '@/components/admin/AdminEmailTemplatesManager'
import type { EmailTemplate } from '@/types/database'

export const metadata = { title: 'Email Templates — Admin' }

export default async function AdminEmailTemplatesPage() {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage()
  const t = await getTranslations('admin.pages')
  const db = createAdminClient()

  const { data, count } = await db
    .from('email_templates')
    .select('*', { count: 'exact' })
    .order('key')
    .order('locale')

  const templates = (data ?? []) as EmailTemplate[]

  // The role comes from requireViewer() (Task 923 R44).
  const viewer = await requireViewer()
  const isAdmin = viewer.ok && viewer.role === 'admin'

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <AdminPageHeader
        title={t('email_templates_title')}
        subtitle={t('email_templates_subtitle', { count: count ?? 0 })}
      />
      <AdminEmailTemplatesManager templates={templates} isAdmin={isAdmin} />
    </div>
  )
}
