import { createClient } from '@/lib/supabase/server'
import { LISTING_SELECT } from './listingSelect'
import type { CardListingData } from '../components/ListingCard'

/**
 * Fetch recently viewed listings for an authenticated user (relies on RLS —
 * only the calling user's rows are returned).
 *
 * Two-step query: first get the ordered listing IDs, then fetch listing data.
 * This avoids a Supabase JOIN across tables with separate RLS policies.
 */
export async function getRecentlyViewedForUser(
  { excludeId, limit = 25 }: { excludeId?: string; limit?: number } = {},
): Promise<CardListingData[]> {
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from('recently_viewed')
    .select('listing_id')
    .order('viewed_at', { ascending: false })
    .limit(limit + (excludeId ? 1 : 0))

  if (!rows?.length) return []

  let ids = rows.map(r => r.listing_id as string)
  if (excludeId) ids = ids.filter(id => id !== excludeId)
  ids = ids.slice(0, limit)
  if (!ids.length) return []

  const { data: listings } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .in('id', ids)
    .in('status', ['active', 'sold', 'rented', 'archived'])

  if (!listings?.length) return []

  // Restore viewed_at order (DB returns in arbitrary order for IN queries)
  const orderMap = new Map(ids.map((id, i) => [id, i]))
  return (listings as unknown as CardListingData[])
    .sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99))
}

/**
 * Fetch recently viewed listings for a guest visitor given a list of listing IDs
 * (sourced from the `rv_listings` cookie, newest first).
 */
export async function getRecentlyViewedForGuest(
  ids: string[],
  { excludeId, limit = 25 }: { excludeId?: string; limit?: number } = {},
): Promise<CardListingData[]> {
  const filteredIds = ids.filter(id => id !== excludeId).slice(0, limit)
  if (!filteredIds.length) return []

  const supabase = await createClient()
  const { data: listings } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .in('id', filteredIds)
    .in('status', ['active', 'sold', 'rented', 'archived'])

  if (!listings?.length) return []

  // Restore cookie order (most recently viewed first)
  const orderMap = new Map(filteredIds.map((id, i) => [id, i]))
  return (listings as unknown as CardListingData[])
    .sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99))
}
