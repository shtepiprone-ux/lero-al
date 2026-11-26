import { getTranslations } from 'next-intl/server'
import { requireStaffPage } from '@/lib/auth/staff'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { AdminPopularLocationsManager } from '@/components/admin/AdminPopularLocationsManager'
import type { Location } from '@/types/database'

// Task 988: the tab title is the page heading in the admin language; the viewer is checked first, as in the page (Task 923 R68 (a))
export async function generateMetadata() {
  await requireStaffPage({ page: 'page.popular_locations' })
  await getAdminLocale()
  const t = await getTranslations('admin.pages')
  return { title: `${t('popular_locations_title')} — Admin` }
}

export default async function AdminPopularLocationsPage() {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage({ page: 'page.popular_locations' })
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
    <AdminPageFrame>
      <AdminPageHeader
        title={t('popular_locations_title')}
        subtitle={t('popular_locations_subtitle', { count: featured?.length ?? 0 })}
      />
      <AdminPopularLocationsManager
        featured={(featured ?? []) as Location[]}
        allCities={(allCities ?? []) as Location[]}
      />
    </AdminPageFrame>
  )
}
