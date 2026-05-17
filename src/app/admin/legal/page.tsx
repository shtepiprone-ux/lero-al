import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminLegalManager } from '@/components/admin/AdminLegalManager'

export const metadata = { title: 'Правові документи — Admin' }

export default async function AdminLegalPage() {
  await getAdminLocale()
  const t = await getTranslations('admin.pages')
  const db = createAdminClient()
  const { data: pages } = await db
    .from('pages')
    .select('id, title, slug, is_published, content, updated_at')
    .order('updated_at', { ascending: false })

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <AdminPageHeader
        title={t('legal_title')}
        subtitle={t('legal_subtitle')}
      />
      <AdminLegalManager pages={pages ?? []} />
    </div>
  )
}
