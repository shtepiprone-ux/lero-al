import { getTranslations } from 'next-intl/server'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPropertyTypesManager } from '@/components/admin/AdminPropertyTypesManager'
import { getAllPropertyTypesAdmin } from '@/modules/admin/actions/propertyTypes'

export const metadata = { title: 'Property Types — Admin' }

export default async function AdminPropertyTypesPage() {
  await getAdminLocale()
  const t = await getTranslations('admin.property_types')
  const types = await getAllPropertyTypesAdmin()

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <AdminPropertyTypesManager initialTypes={types} />
    </div>
  )
}
