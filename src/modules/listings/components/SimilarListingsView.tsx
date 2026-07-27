import { ListingCard, type CardListingData } from '@/modules/listings/components/ListingCard'
import type { ExchangeRates } from '@/lib/getExchangeRate'

export interface SimilarListingsViewProps {
  /** Pre-translated heading — the container is a Server Component, so it passes
   * getTranslations('listing')('similar_listings') instead of this View calling useTranslations. */
  heading: string
  listings: CardListingData[]
  rates: ExchangeRates | null
  displayCurrency: string
}

/**
 * Presentational similar-listings grid (Task 665 container/View split). Renders only the
 * heading + card grid; the `.similar-listings` wrapper and the speculation-rules script stay
 * in the server container (`SimilarListings.tsx`) so this View's markup is byte-identical to
 * the pre-split render when composed back together.
 */
export function SimilarListingsView({ heading, listings, rates, displayCurrency }: SimilarListingsViewProps) {
  return (
    <>
      <h2 className="text-xl font-bold mb-5">{heading}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {listings.map(l => (
          <ListingCard key={l.id} listing={l} layoutContext="4-col" displayCurrency={displayCurrency} rates={rates} />
        ))}
      </div>
    </>
  )
}
