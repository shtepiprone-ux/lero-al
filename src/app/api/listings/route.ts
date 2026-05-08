import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LISTINGS_PER_PAGE } from '@/modules/listings/constants'
import { parseSearchParams, applyListingFilters } from '@/modules/listings/domain/filterEngine'

const LISTING_SELECT = `
  id, slug, title, price, price_old, currency, listing_type, property_type,
  rooms, bedrooms, bathrooms, area_gross, floor, total_floors, is_premium, status, created_at,
  location:locations(id, name_al, slug, type),
  images:listing_images(url, is_cover, order)
`

export async function GET(req: NextRequest) {
  const filters = parseSearchParams(req.nextUrl.searchParams)
  const { tab, sort, page } = filters
  const from = (page - 1) * LISTINGS_PER_PAGE
  const to   = from + LISTINGS_PER_PAGE - 1
  const now  = new Date().toISOString()

  const supabase = await createClient()
  let query = supabase
    .from('listings')
    .select(LISTING_SELECT, { count: 'exact' })

  if (tab === 'closed') {
    query = query.in('status', ['sold', 'rented'] as any)
  } else {
    query = query.eq('status', 'active' as any).gte('expires_at', now)
  }

  query = applyListingFilters(query, filters)

  if (sort === 'price_asc')  query = query.order('price',     { ascending: true })
  else if (sort === 'price_desc') query = query.order('price', { ascending: false })
  else if (sort === 'area_desc')  query = query.order('area_gross', { ascending: false })
  else if (tab === 'closed')      query = query.order('updated_at', { ascending: false })
  else {
    query = query.order('is_premium',  { ascending: false })
    query = query.order('created_at',  { ascending: false })
  }

  const { data, count, error } = await query.range(from, to)

  if (error) {
    console.error('Failed to fetch listings via API', { error })
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }

  return NextResponse.json({ listings: data ?? [], total: count ?? 0 })
}
