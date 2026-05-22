import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPopularLocationsManager } from '@/components/admin/AdminPopularLocationsManager'
import type { Location } from '@/types/database'

export const metadata = { title: 'Popular Locations — Admin' }

export default async function AdminPopularLocationsPage() {
  await getAdminLocale()
  const t = await getTranslations('admin.pages')

  const db = createAdminClient()

  const [{ data: featured }, { data: allCities }] = await Promise.all([
    db
      .from('locations')
      .select('id, name_al, name_en, slug, type, parent_id, region_id, lat, lng, image_url, is_featured, display_order')
      .eq('is_featured', true)
      .order('display_order', { ascending: true }),
    db
      .from('locations')
      .select('id, name_al, name_en, slug, type, parent_id, region_id, lat, lng, image_url, is_featured, display_order')
      .eq('type', 'city')
      .order('name_al', { ascending: true }),
  ])

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <AdminPageHeader
        title={t('popular_locations_title')}
        subtitle={t('popular_locations_subtitle', { count: featured?.length ?? 0 })}
      />
      <AdminPopularLocationsManager
        featured={(featured ?? []) as Location[]}
        allCities={(allCities ?? []) as Location[]}
      />
    </div>
  )
}
