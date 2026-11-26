import { getTranslations } from 'next-intl/server'
import { requireStaffPage } from '@/lib/auth/staff'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { AdminPropertyTypesManager } from '@/components/admin/AdminPropertyTypesManager'
import { getAllPropertyTypesAdmin } from '@/modules/admin/actions/propertyTypes'

// Task 988: the tab title is the page heading in the admin language; the viewer is checked first, as in the page (Task 923 R68 (a))
export async function generateMetadata() {
  await requireStaffPage({ page: 'page.property_types' })
  await getAdminLocale()
  const t = await getTranslations('admin.property_types')
  return { title: `${t('title')} — Admin` }
}

export default async function AdminPropertyTypesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage({ page: 'page.property_types' })
  await getAdminLocale()
  const t = await getTranslations('admin.property_types')
  const sp = await searchParams
  const q = sp.q ?? ''
  const types = await getAllPropertyTypesAdmin()

  return (
    <AdminPageFrame>
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <AdminPropertyTypesManager initialTypes={types} searchQuery={q} now={new Date().toISOString()} />
    </AdminPageFrame>
  )
}
