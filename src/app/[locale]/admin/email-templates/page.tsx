import { getTranslations } from 'next-intl/server'
import { requireStaffPage } from '@/lib/auth/staff'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { requireViewer } from '@/lib/auth/requireViewer'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { AdminEmailTemplatesManager } from '@/components/admin/AdminEmailTemplatesManager'
import type { EmailTemplate } from '@/types/database'

// Task 988: the tab title is the page heading in the admin language; the viewer is checked first, as in the page (Task 923 R68 (a))
export async function generateMetadata() {
  await requireStaffPage({ page: 'page.email_templates' })
  await getAdminLocale()
  const t = await getTranslations('admin.pages')
  return { title: `${t('email_templates_title')} — Admin` }
}

export default async function AdminEmailTemplatesPage() {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage({ page: 'page.email_templates' })
  await getAdminLocale()
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
    <AdminPageFrame>
      <AdminPageHeader
        title={t('email_templates_title')}
        subtitle={t('email_templates_subtitle', { count: count ?? 0 })}
      />
      <AdminEmailTemplatesManager templates={templates} isAdmin={isAdmin} />
    </AdminPageFrame>
  )
}
