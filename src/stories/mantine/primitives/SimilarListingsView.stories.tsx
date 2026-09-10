import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { storyT } from '../../_storyI18n'
import { SimilarListingsView } from '@/modules/listings/components/SimilarListingsView'
import { makeCardListingFixtures } from '../../fixtures/cardListingData.fixture'
import { MantineStoryShell } from '../_MantineStoryShell'
import type { ExchangeRates } from '@/lib/getExchangeRate'

/**
 * Task 792 — canonical story for the real production `SimilarListingsView`. Statically imports
 * the real component (clause 16c) — no demo stand-in. The `.similar-listings` wrapper and
 * speculation-rules script live in the out-of-scope server container (`SimilarListings.tsx`) and
 * are intentionally not reproduced here (Task 792 §8 out of scope).
 *
 * Task 803 (R9) — extended, not replaced, with the two new branches the `viewAllHref`/
 * `viewAllLabel` props and D72-5's horizontal-scroll-at-every-width row introduce: `Default` (8
 * items + the view-all control), `FewerThanEight` (no control — R4's "only when a 9th row
 * exists"), and `Empty` (the View's own `!listings.length` guard). `viewAllHref` here is a
 * representative fixture query string — the real value is built by `similarity.ts`'s URL renderer
 * from the settled predicate (D72-1), not reproduced here, same disposition
 * `ListingStatusBanner.stories.tsx` already established for its own representative `href`.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/SimilarListingsView',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

const FIXTURE_RATES: ExchangeRates = { ALL: 1, EUR: 100 }

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const listings = makeCardListingFixtures(locale)
    return (
      <MantineStoryShell>
        <SimilarListingsView
          heading={storyT(locale, 'listing.similar_listings')}
          listings={listings}
          rates={FIXTURE_RATES}
          displayCurrency="EUR"
          viewAllHref={`/${locale}/listings?type=sale&property_type=apartment`}
          viewAllLabel={storyT(locale, 'listing.view_all')}
        />
      </MantineStoryShell>
    )
  },
}

export const FewerThanEight: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const listings = makeCardListingFixtures(locale).slice(0, 4)
    return (
      <MantineStoryShell>
        <SimilarListingsView
          heading={storyT(locale, 'listing.similar_listings')}
          listings={listings}
          rates={FIXTURE_RATES}
          displayCurrency="EUR"
        />
      </MantineStoryShell>
    )
  },
}

export const Empty: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <MantineStoryShell>
        <SimilarListingsView
          heading={storyT(locale, 'listing.similar_listings')}
          listings={[]}
          rates={FIXTURE_RATES}
          displayCurrency="EUR"
        />
      </MantineStoryShell>
    )
  },
}
