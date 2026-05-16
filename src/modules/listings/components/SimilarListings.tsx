import { getTranslations, getLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ListingCard, type CardListingData } from '@/modules/listings/components/ListingCard'

interface Props {
  currentId: string
  propertyType: string
  locationId: number | null
}

const SELECT = `
  id, slug, title, price, price_old, currency, listing_type, property_type,
  rooms, bedrooms, bathrooms, area_gross, floor, total_floors, is_premium, status, created_at,
  location:locations(id, name_al, slug, type),
  images:listing_images(url, is_cover, order)
`

/**
 * Similar Listings — Server Component.
 *
 * Converted from 'use client' + useEffect (client-side Supabase query) to a
 * Server Component that streams below the fold inside <Suspense>.
 *
 * Benefits:
 *   - Zero hydration cost: no useState/useEffect/useTranslations on the client
 *   - Supabase query runs server-side → no client bundle includes the query
 *   - Deferred via Suspense: above-fold content (gallery, title, price) streams
 *     first; similar listings stream after, giving Chrome earlier paint windows
 *
 * Speculation Rules (§3): emits a <script type="speculationrules"> for the first
 * 2 similar listing URLs when Save-Data is not set. Chrome prerenders those pages
 * on hover/focus intent — dramatically improving perceived LCP on subsequent
 * marketplace navigations. Progressive enhancement: ignored by non-Chrome browsers.
 */
export async function SimilarListings({ currentId, propertyType, locationId }: Props) {
  const t = await getTranslations('listing')
  const locale = await getLocale()
  const supabase = await createClient()

  const baseQuery = () =>
    supabase
      .from('listings')
      .select(SELECT)
      .eq('status', 'active')
      .eq('property_type', propertyType)
      .neq('id', currentId)
      .gte('expires_at', new Date().toISOString())
      .limit(4)

  // Try with same location first; fall back to any location if no results found.
  let { data: listings } = locationId
    ? await baseQuery().eq('location_id', locationId)
    : await baseQuery()

  if (!listings?.length && locationId) {
    ;({ data: listings } = await baseQuery())
  }

  if (!listings?.length) return null

  // Speculation Rules — prerender the first 2 similar listing URLs on hover/focus intent.
  // Skipped when the client sends Save-Data: on (bandwidth-constrained users).
  const headersList = await headers()
  const saveData = headersList.get('Save-Data') === 'on'
  const speculationUrls = !saveData
    ? listings.slice(0, 2).map(l => `/${locale}/listings/${l.slug}`)
    : []

  return (
    <div className="similar-listings">
      <h2 className="text-xl font-bold mb-5">{t('similar_listings')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(listings as unknown as CardListingData[]).map(l => (
          <ListingCard key={l.id} listing={l} layoutContext="4-col" />
        ))}
      </div>

      {speculationUrls.length > 0 && (
        <script
          type="speculationrules"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prerender: [{
                source: 'list',
                urls: speculationUrls,
                eagerness: 'conservative',
              }],
            }),
          }}
        />
      )}
    </div>
  )
}
