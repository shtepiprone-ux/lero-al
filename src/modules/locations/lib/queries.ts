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

// getPopularLocations removed in J.2 (Task 152) — PopularLocations is now a
// Server Component that queries directly via createClient from @/lib/supabase/server.
