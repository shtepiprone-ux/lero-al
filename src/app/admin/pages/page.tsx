import { getTranslations } from 'next-intl/server'
import { requireStaffPage } from '@/lib/auth/staff'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { AdminPagesManager } from '@/components/admin/AdminPagesManager'

export const metadata = { title: 'CMS Pages — Admin' }

export default async function AdminPagesPage() {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage()
  const locale = await getAdminLocale()
  const t = await getTranslations('admin.pages')
  const db = createAdminClient()
  const { data: pages } = await db
    .from('pages')
    .select('id, title, slug, is_published, content, updated_by, updated_at')
    .order('updated_at', { ascending: false })

  return (
    <AdminPageFrame width="shell">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <AdminPagesManager pages={pages ?? []} adminLocale={locale} now={new Date().toISOString()} />
    </AdminPageFrame>
  )
}
