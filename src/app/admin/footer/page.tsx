import { getTranslations } from 'next-intl/server'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminFooterManager } from '@/components/admin/AdminFooterManager'
import { getAllFooterContent } from '@/modules/admin/actions/footer'

export const metadata = { title: 'Footer — Admin' }

export default async function AdminFooterPage() {
  await getAdminLocale()
  const t = await getTranslations('admin.pages')
  const { data, initialized, error } = await getAllFooterContent()

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <AdminPageHeader
        title={t('footer_title')}
        subtitle={t('footer_subtitle')}
      />
      <AdminFooterManager
        initialData={data}
        initialized={initialized}
        serverError={error}
      />
    </div>
  )
}
