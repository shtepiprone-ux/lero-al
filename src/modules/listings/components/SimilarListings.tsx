import { getTranslations, getLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { getExchangeRates } from '@/lib/getExchangeRateServer'
import type { CardListingData } from '@/modules/listings/components/ListingCard'
import { applyPublicVisibility } from '@/modules/listings/lib/visibility'
import { SimilarListingsView } from './SimilarListingsView'

interface Props {
  currentId: string
  propertyType: string
  locationId: number | null
}

const SELECT = `
  id, public_id, slug, title, price, price_old, currency, listing_type, property_type,
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
 *
 * Task 665: the heading + card grid are extracted into the presentational
 * `SimilarListingsView` (container/View split); this container keeps the query,
 * headers, and speculation-rules script, and owns the `.similar-listings` wrapper so
 * production output stays byte-identical to the pre-split render.
 */
export async function SimilarListings({ currentId, propertyType, locationId }: Props) {
  const [t, locale, supabase, exchangeRates, authUser] = await Promise.all([
    getTranslations('listing'),
    getLocale(),
    createClient(),
    getExchangeRates(),
    getUser(),
  ])

  let displayCurrency = 'ALL'
  if (authUser) {
    const { data: profile } = await supabase
      .from('users')
      .select('preferred_currency')
      .eq('id', authUser.id)
      .maybeSingle()
    displayCurrency = (profile as { preferred_currency?: string } | null)?.preferred_currency ?? 'ALL'
  }

  const baseQuery = () =>
    applyPublicVisibility(
      supabase
        .from('listings')
        .select(SELECT),
    )
      .eq('property_type', propertyType)
      .neq('id', currentId)
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
      <SimilarListingsView
        heading={t('similar_listings')}
        listings={listings as unknown as CardListingData[]}
        rates={exchangeRates}
        displayCurrency={displayCurrency}
      />

      {speculationUrls.length > 0 && (
        <script
          type="speculationrules"
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
