import { getTranslations } from 'next-intl/server'
import { requireStaffPage } from '@/lib/auth/staff'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { AdminFooterManager } from '@/components/admin/AdminFooterManager'
import { getAllFooterContent } from '@/modules/admin/actions/footer'

// Task 988: the tab title is the page heading in the admin language; the viewer is checked first, as in the page (Task 923 R68 (a))
export async function generateMetadata() {
  await requireStaffPage({ adminOnly: true })
  await getAdminLocale()
  const t = await getTranslations('admin.pages')
  return { title: `${t('footer_title')} — Admin` }
}

export default async function AdminFooterPage() {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage({ adminOnly: true })
  await getAdminLocale()
  const t = await getTranslations('admin.pages')
  const { data, initialized, error } = await getAllFooterContent()

  return (
    <AdminPageFrame>
      <AdminPageHeader
        title={t('footer_title')}
        subtitle={t('footer_subtitle')}
      />
      <AdminFooterManager
        initialData={data}
        initialized={initialized}
        serverError={error}
      />
    </AdminPageFrame>
  )
}
