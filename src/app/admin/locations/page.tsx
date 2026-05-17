import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminLocationsManager, type Location } from '@/components/admin/AdminLocationsManager'

export const metadata = { title: 'Населені пункти — Admin' }

export default async function AdminLocationsPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  await getAdminLocale()
  const t = await getTranslations('admin.pages')
  const sp = await searchParams
  const type = sp.type ?? ''

  const db = createAdminClient()
  let query = db
    .from('locations')
    .select('id, name_al, name_en, type, slug, parent_id, image_url, is_featured, display_order', { count: 'exact' })
    .order('type').order('name_al').limit(200)

  if (type) query = query.eq('type', type)

  const { data: locations, count } = await query

  const { data: parents } = await db
    .from('locations')
    .select('id, name_al, type')
    .in('type', ['region', 'city'])
    .order('name_al')

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <AdminPageHeader title={t('locations_title')} subtitle={t('locations_subtitle', { count: count ?? 0 })} />
      <AdminLocationsManager
        locations={(locations ?? []) as Location[]}
        parents={(parents ?? []) as Location[]}
        activeType={type}
      />
    </div>
  )
}
