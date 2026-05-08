import { createClient } from '@/lib/supabase/server'
import type { PropertyType } from '@/types/database'

const FAVORITE_LISTING_SELECT =
  'id, slug, title, price, price_old, currency, listing_type, property_type, ' +
  'condition, rooms, bedrooms, bathrooms, area_gross, area_net, floor, total_floors, ' +
  'year_built, is_premium, status, created_at, views_count, ' +
  'location:locations(id, name_al, slug, type), ' +
  'images:listing_images(url, is_cover, order)'

export async function getFavoriteIds(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', userId)

  return (data ?? []).map((f: { listing_id: string }) => f.listing_id)
}

export async function getFavoriteListings(userId: string, propertyType?: PropertyType) {
  const supabase = await createClient()

  const { data: favs } = await supabase
    .from('favorites')
    .select('listing_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!favs?.length) return []

  const listingIds = favs.map((f: { listing_id: string }) => f.listing_id)

  let query = supabase
    .from('listings')
    .select(FAVORITE_LISTING_SELECT)
    .in('id', listingIds)
    .neq('status', 'archived')

  if (propertyType) {
    query = query.eq('property_type', propertyType)
  }

  const { data: listings, error } = await query

  if (error) {
    console.error('Failed to fetch favorite listings', { error, userId })
    return []
  }

  // Preserve favorites order (most recently added first)
  const listingMap = new Map((listings ?? []).map((l: any) => [l.id, l]))
  return listingIds
    .map((id: string) => listingMap.get(id))
    .filter(Boolean) as any[]
}

export async function getFavoriteTypeCounts(userId: string): Promise<Record<string, number>> {
  const supabase = await createClient()

  const { data: favs } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', userId)

  if (!favs?.length) return {}

  const listingIds = favs.map((f: { listing_id: string }) => f.listing_id)

  const { data: listings } = await supabase
    .from('listings')
    .select('property_type')
    .in('id', listingIds)
    .neq('status', 'archived')

  const counts: Record<string, number> = {}
  for (const l of (listings ?? []) as { property_type: string }[]) {
    counts[l.property_type] = (counts[l.property_type] ?? 0) + 1
  }
  return counts
}
