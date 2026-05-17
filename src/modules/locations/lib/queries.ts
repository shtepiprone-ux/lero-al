import { createClient } from '@/lib/supabase/client'
import type { Location } from '@/types/database'

export async function getSearchableLocations(): Promise<Location[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('locations')
    .select('id, name_al, name_en, slug, type, parent_id, region_id, lat, lng')
    .in('type', ['region', 'city', 'village'])
    .order('type', { ascending: true })
    .order('name_al', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getPopularLocations(): Promise<(Location & { listing_count: number })[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('locations')
    .select('id, name_al, name_en, slug, type, parent_id, region_id, lat, lng, image_url, is_featured, display_order')
    .eq('type', 'city')
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .order('name_al', { ascending: true })
    .limit(8)

  if (error) throw error
  return (data ?? []).map((loc: Location) => ({ ...loc, listing_count: 0 }))
}
