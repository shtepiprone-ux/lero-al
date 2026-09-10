import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { RecentlyViewedGridView } from '@/modules/listings/components/RecentlyViewedGridView'
import { ClearRecentlyViewedButton } from '@/modules/listings/components/ClearRecentlyViewedButton'
import { makeCardListingFixtures } from '../../fixtures/cardListingData.fixture'
import { MantineStoryShell } from '../_MantineStoryShell'
import type { ExchangeRates } from '@/lib/getExchangeRate'

/**
 * Task 792 — canonical story for the real production `RecentlyViewedGridView`. Statically imports
 * the real component (clause 16c) — no demo stand-in — plus the real `ClearRecentlyViewedButton`
 * as the `clearSlot`. Covers both required branches (R6): `Populated` (Task 807 — renders through
 * the shared `MantineListingCardTrack` `rail` mode) and `Empty` (the `showEmptyState` branch).
 */
const meta: Meta = {
  title: 'Mantine/Primitives/RecentlyViewedGridView',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

const FIXTURE_RATES: ExchangeRates = { ALL: 1, EUR: 100 }

export const Populated: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const listings = makeCardListingFixtures(locale)
    return (
      <MantineStoryShell>
        <RecentlyViewedGridView
          listings={listings}
          rates={FIXTURE_RATES}
          displayCurrency="EUR"
          clearSlot={<ClearRecentlyViewedButton />}
        />
      </MantineStoryShell>
    )
  },
}

export const Empty: Story = {
  render: () => (
    <MantineStoryShell>
      <RecentlyViewedGridView listings={[]} rates={FIXTURE_RATES} displayCurrency="EUR" showEmptyState />
    </MantineStoryShell>
  ),
}
