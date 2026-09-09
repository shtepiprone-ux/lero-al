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
        />
      </MantineStoryShell>
    )
  },
}
