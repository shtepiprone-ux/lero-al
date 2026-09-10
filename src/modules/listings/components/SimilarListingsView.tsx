import { Flex, Title } from '@mantine/core'
import { ListingCard, type CardListingData } from '@/modules/listings/components/ListingCard'
import { ViewAllLink } from '@/components/shared/ViewAllLink'
import type { ExchangeRates } from '@/lib/getExchangeRate'
import styles from './SimilarListingsView.module.css'

export interface SimilarListingsViewProps {
  /** Pre-translated heading — the container is a Server Component, so it passes
   * getTranslations('listing')('similar_listings') instead of this View calling useTranslations. */
  heading: string
  listings: CardListingData[]
  rates: ExchangeRates | null
  displayCurrency: string
  /** Present only when a 9th row was returned (R4) — built by `similarity.ts`'s URL renderer from
   * the SETTLED (post-relaxation) predicate, never the unrelaxed one (D72-1). Absent renders no
   * control. */
  viewAllHref?: string
  /** Pre-translated `view_all` label — required alongside `viewAllHref` to render the control. */
  viewAllLabel?: string
}

/**
 * Presentational similar-listings row (Task 665 container/View split). Renders the heading + card
 * row only; the `.similar-listings` wrapper and the speculation-rules script stay in the server
 * container (`SimilarListings.tsx`).
 *
 * Task 792 — off Tailwind onto Mantine. Heading keeps `Title order={2} size="h4"` — the exact
 * sizing this route's own `ListingDetailView.tsx` `SimilarListingsSkeleton` already established
 * for this identical heading (sized so the Suspense placeholder matches the real content, no
 * layout shift) — not a new value (Task 803 kickoff §3.3 CONFLICT, resolved in favour of this).
 *
 * Task 803 (D72-5) — `SimpleGrid` is removed; the row is a horizontal scroll at every width
 * (`SimilarListingsView.module.css`), and the header gains a `ViewAllLink` (reused, not
 * recreated — `@/components/shared/ViewAllLink`) when the container signals more results exist.
 *
 * Task 803 Revision 1 (R14/D72-6) — the header is a `Flex` with `direction={{ base: 'column',
 * sm: 'row' }}`, `align={{ base: 'stretch', sm: 'center' }}`, `justify="space-between"`: the
 * owner-ruled resolution of the `FeaturedListingsView.tsx`/`page.tsx` header-stacking conflict
 * (kickoff §16.6a), expressed via the same `Flex` responsive-prop mechanism
 * `MantinePageHeaderWithActions.tsx:55-66` and `AuthSheet.tsx:518` already use in place of a
 * CSS-module `@media` override.
 */
export function SimilarListingsView({ heading, listings, rates, displayCurrency, viewAllHref, viewAllLabel }: SimilarListingsViewProps) {
  if (!listings.length) return null

  return (
    <>
      <Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'center' }} justify="space-between" gap="sm" mb="lg">
        <Title order={2} size="h4">
          {heading}
        </Title>
        {viewAllHref && viewAllLabel && (
          <ViewAllLink href={viewAllHref} label={viewAllLabel} />
        )}
      </Flex>
      <div className={styles.row}>
        {listings.map(l => (
          <div key={l.id} className={styles.card}>
            <ListingCard listing={l} layoutContext="4-col" displayCurrency={displayCurrency} rates={rates} />
          </div>
        ))}
      </div>
    </>
  )
}
