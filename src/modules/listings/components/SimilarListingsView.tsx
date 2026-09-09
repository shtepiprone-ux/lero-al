import { SimpleGrid, Title } from '@mantine/core'
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
 *
 * Task 792 — off Tailwind onto Mantine. Heading reuses `Title order={2} size="h4"`, the exact
 * sizing this route's own `ListingDetailView.tsx` `SimilarListingsSkeleton` already established
 * for this identical heading (sized so the Suspense placeholder matches the real content, no
 * layout shift) — not a new value. Grid reuses the same `SimpleGrid cols={{ base: 1, sm: 2, xl: 3,
 * xxl: 4 }} spacing="md"` breakpoint step `FeaturedListingsView.tsx`/`HomepageListingGrids`
 * already established (Task 668 owner decision) for the same 4-col listing-card grid.
 */
export function SimilarListingsView({ heading, listings, rates, displayCurrency }: SimilarListingsViewProps) {
  return (
    <>
      <Title order={2} size="h4" mb="lg">
        {heading}
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, xl: 3, xxl: 4 }} spacing="md">
        {listings.map(l => (
          <ListingCard key={l.id} listing={l} layoutContext="4-col" displayCurrency={displayCurrency} rates={rates} />
        ))}
      </SimpleGrid>
    </>
  )
}
