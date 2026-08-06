import { getTranslations, getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import type { Location } from '@/types/database'
import { PopularLocationsView, type PopularLocationsViewLocation } from '@/modules/locations/components/PopularLocationsView'

/**
 * Popular Locations — Server Component (J.2 / Task 152).
 *
 * Fetches active featured locations (is_featured=true) server-side.
 * Returns null when no active rows — the entire section disappears cleanly
 * with no empty-state heading (Sprint 1 Task 101 pattern).
 *
 * Click target links to the listings page pre-filtered by location_id.
 * J.3 (Task 153) will finalize the canonical filter param.
 */
export async function PopularLocations() {
  const supabase = await createClient()
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name_al, name_en, slug, type, parent_id, region_id, lat, lng, image_url, is_featured, display_order')
    .eq('is_featured', true)
    .eq('type', 'city')
    .order('display_order', { ascending: true })
    .order('name_al', { ascending: true })
    .limit(8)

  if (!locations?.length) return null

  const [t, locale] = await Promise.all([
    getTranslations('home'),
    getLocale(),
  ])

  const viewLocations: PopularLocationsViewLocation[] = (locations as Location[]).map(loc => ({
    id: String(loc.id),
    name: locale === 'sq' ? loc.name_al : (loc.name_en ?? loc.name_al),
    href: `/${locale}/listings?location_id=${loc.id}`,
    imageUrl: loc.image_url,
  }))

  return <PopularLocationsView heading={t('popular_locations')} locations={viewLocations} />
}
