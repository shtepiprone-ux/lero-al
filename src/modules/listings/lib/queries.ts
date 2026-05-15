import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { PropertyType, ListingType, ListingStatus } from '@/types/database'
import { LISTINGS_PER_PAGE } from '@/modules/listings/constants'
import { LISTING_SELECT } from './listingSelect'

export { LISTING_SELECT } from './listingSelect'

export interface ListingFilters {
  listing_type?: ListingType
  property_type?: PropertyType
  location_id?: number
  price_min?: number
  price_max?: number
  area_min?: number
  area_max?: number
  rooms?: number
  bedrooms?: number
  condition?: string
  heating?: string
  wall_type?: string
  year_built_min?: number
  year_built_max?: number
  floor_min?: number
  floor_max?: number
  page?: number
}

export async function getFeaturedListings() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('status', 'active')
    .eq('is_premium', true)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) throw error
  return data ?? []
}

export async function getLatestListings() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .order('is_premium', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) throw error
  return data ?? []
}

export async function getListings(filters: ListingFilters = {}) {
  const supabase = createClient()
  const page = filters.page ?? 1
  const from = (page - 1) * LISTINGS_PER_PAGE
  const to = from + LISTINGS_PER_PAGE - 1

  let query = supabase
    .from('listings')
    .select(LISTING_SELECT, { count: 'exact' })
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())

  if (filters.listing_type) query = query.eq('listing_type', filters.listing_type)
  if (filters.property_type) query = query.eq('property_type', filters.property_type)
  if (filters.location_id) query = query.eq('location_id', filters.location_id)
  if (filters.price_min) query = query.gte('price', filters.price_min)
  if (filters.price_max) query = query.lte('price', filters.price_max)
  if (filters.area_min) query = query.gte('area_gross', filters.area_min)
  if (filters.area_max) query = query.lte('area_gross', filters.area_max)
  if (filters.rooms) query = query.eq('rooms', filters.rooms)
  if (filters.bedrooms) query = query.eq('bedrooms', filters.bedrooms)
  if (filters.condition) query = query.eq('condition', filters.condition)
  if (filters.heating) query = query.eq('heating', filters.heating)
  if (filters.wall_type) query = query.eq('wall_type', filters.wall_type)
  if (filters.year_built_min) query = query.gte('year_built', filters.year_built_min)
  if (filters.year_built_max) query = query.lte('year_built', filters.year_built_max)

  const { data, error, count } = await query
    .order('is_premium', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return { listings: data ?? [], total: count ?? 0 }
}

// Site stats (active listing count + city count) are global, not locale-keyed, and
// change slowly. Cache for 1 hour to eliminate per-request Supabase round-trips.
// The first request per revalidation period hits Supabase; all subsequent requests
// within that window are served from the Next.js data cache.
export const getSiteStats = unstable_cache(
  async () => {
    const supabase = createClient()
    const [{ count: listingsCount }, { count: locationsCount }] = await Promise.all([
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('locations').select('id', { count: 'exact', head: true }).eq('type', 'city'),
    ])
    return {
      listings: listingsCount ?? 0,
      cities: locationsCount ?? 0,
    }
  },
  ['site-stats'],
  { revalidate: 3600, tags: ['site-stats'] },
)
