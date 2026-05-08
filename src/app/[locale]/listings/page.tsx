import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { ListingsShell } from '@/modules/listings/components/ListingsShell'
import { LISTINGS_PER_PAGE } from '@/modules/listings/constants'
import { parseSearchParams, applyListingFilters, countActiveFilters } from '@/modules/listings/domain/filterEngine'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'listing' })
  return {
    title: `${t('listings_page_title')} | Shtepi.al`,
  }
}

const LISTING_SELECT = `
  id, slug, title, price, price_old, currency, listing_type, property_type,
  rooms, bedrooms, bathrooms, area_gross, floor, total_floors, is_premium, status, created_at,
  location:locations(id, name_al, slug, type),
  images:listing_images(url, is_cover, order)
`

export default async function ListingsPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp       = await searchParams
  const t        = await getTranslations({ locale, namespace: 'listing' })
  const tNav     = await getTranslations({ locale, namespace: 'nav' })

  const filters = parseSearchParams(sp)
  const { tab, sort, page } = filters
  const from = (page - 1) * LISTINGS_PER_PAGE
  const to   = from + LISTINGS_PER_PAGE - 1
  const now  = new Date().toISOString()

  const [authUser, supabase] = await Promise.all([
    getUser(),
    createClient(),
  ])

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

  const [listingsResult, locationsResult, favsResult] = await Promise.all([
    query.range(from, to),
    supabase.from('locations').select('id, name_al, type').in('type', ['region', 'city']).order('name_al'),
    authUser
      ? supabase.from('favorites').select('listing_id').eq('user_id', authUser.id)
      : Promise.resolve({ data: [] as { listing_id: string }[] }),
  ])

  const { data: listings, count, error } = listingsResult
  const { data: locations } = locationsResult
  const favoriteIds = (favsResult.data ?? []).map((f: { listing_id: string }) => f.listing_id)

  if (error) {
    console.error('Failed to fetch listings', { error, searchParams: sp })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumbs */}
      <div className="bg-muted/40 border-b">
        <div className="container mx-auto px-4 py-2.5">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link href={`/${locale}`} className="hover:text-foreground transition-colors">
              {tNav('home')}
            </Link>
            <span>/</span>
            <span className="text-foreground">{t('listings_page_title')}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <ListingsShell
          listings={listings ?? []}
          total={count ?? 0}
          page={page}
          locations={locations ?? []}
          activeFiltersCount={countActiveFilters(filters)}
          tab={tab}
          favoriteIds={favoriteIds}
        />
      </div>
    </div>
  )
}
