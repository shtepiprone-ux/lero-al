import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPagesManager } from '@/components/admin/AdminPagesManager'

export const metadata = { title: 'CMS Pages — Admin' }

export default async function AdminPagesPage() {
  const locale = await getAdminLocale()
  const t = await getTranslations('admin.pages')
  const db = createAdminClient()
  const { data: pages } = await db
    .from('pages')
    .select('id, title, slug, is_published, content, updated_by, updated_at')
    .order('updated_at', { ascending: false })

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <AdminPagesManager pages={pages ?? []} adminLocale={locale} />
    </div>
  )
}
