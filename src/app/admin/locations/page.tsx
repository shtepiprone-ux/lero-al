import { getTranslations } from 'next-intl/server'
import { requireStaffPage } from '@/lib/auth/staff'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { AdminLocationsManager, type Location } from '@/components/admin/AdminLocationsManager'

// Task 988: the tab title is the page heading in the admin language; the viewer is checked first, as in the page (Task 923 R68 (a))
export async function generateMetadata() {
  await requireStaffPage({ page: 'page.locations' })
  await getAdminLocale()
  const t = await getTranslations('admin.pages')
  return { title: `${t('locations_title')} — Admin` }
}

export default async function AdminLocationsPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage({ page: 'page.locations' })
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
    <AdminPageFrame>
      <AdminPageHeader title={t('locations_title')} subtitle={t('locations_subtitle', { count: count ?? 0 })} />
      <AdminLocationsManager
        locations={(locations ?? []) as Location[]}
        parents={(parents ?? []) as Location[]}
        activeType={type}
      />
    </AdminPageFrame>
  )
}
