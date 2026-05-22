import { createClient } from '@/lib/supabase/server'
import type { PropertyType, CollectionWithCount } from '@/types/database'
import type { CardListingData } from '@/modules/listings/components/ListingCard'
import { LISTING_SELECT } from './listingSelect'

export async function getUserCollections(userId: string): Promise<CollectionWithCount[]> {
  const supabase = await createClient()

  const { data: rawCollections } = await supabase
    .from('collections')
    .select('id, user_id, name, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const collections = rawCollections ?? []
  if (!collections.length) return []

  const collectionIds = collections.map((c: { id: string }) => c.id)
  const { data: items } = await supabase
    .from('collection_items')
    .select('collection_id')
    .in('collection_id', collectionIds)

  const countMap = new Map<string, number>()
  for (const item of (items ?? []) as { collection_id: string }[]) {
    countMap.set(item.collection_id, (countMap.get(item.collection_id) ?? 0) + 1)
  }

  return (collections as { id: string; user_id: string; name: string; created_at: string; updated_at: string }[]).map(c => ({
    ...c,
    item_count: countMap.get(c.id) ?? 0,
  }))
}

export async function getFavoriteListingsPaginated(
  userId: string,
  propertyType?: PropertyType,
  page: number = 1,
  perPage: number = 25,
): Promise<{ listings: CardListingData[]; total: number }> {
  const supabase = await createClient()

  // Step 1: All favorite IDs in favorites order (most recently added first)
  const { data: favs } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!favs?.length) return { listings: [], total: 0 }
  const allIds = (favs as { listing_id: string }[]).map(f => f.listing_id)

  // Step 2: Find which of those IDs are still visible (not archived, optional type filter)
  let filterQuery = supabase
    .from('listings')
    .select('id')
    .in('id', allIds)
    .neq('status', 'archived')
  if (propertyType) filterQuery = filterQuery.eq('property_type', propertyType)

  const { data: matchingRows } = await filterQuery
  const matchingSet = new Set((matchingRows ?? []).map((l: { id: string }) => l.id))

  // Preserve favorites order, count total visible
  const orderedIds = allIds.filter(id => matchingSet.has(id))
  const total = orderedIds.length
  if (!total) return { listings: [], total: 0 }

  // Step 3: Slice to the requested page
  const from = (page - 1) * perPage
  const pageIds = orderedIds.slice(from, from + perPage)
  if (!pageIds.length) return { listings: [], total }

  // Step 4: Fetch full listing data for this page only
  const { data: listings, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .in('id', pageIds)
    .neq('status', 'archived')

  if (error) {
    console.error('Failed to fetch favorite listings', { error, userId })
    return { listings: [], total }
  }

  // Restore page order (Supabase .in() does not guarantee order)
  const rows = (listings ?? []) as unknown as CardListingData[]
  const listingMap = new Map(rows.map(l => [l.id, l]))
  return {
    listings: pageIds
      .map(id => listingMap.get(id))
      .filter((l): l is CardListingData => l != null),
    total,
  }
}

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
    .select(LISTING_SELECT)
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
  const rows = (listings ?? []) as unknown as CardListingData[]
  const listingMap = new Map(rows.map(l => [l.id, l]))
  return listingIds
    .map(id => listingMap.get(id))
    .filter((l): l is CardListingData => l != null)
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
