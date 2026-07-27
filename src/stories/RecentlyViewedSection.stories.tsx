'use client'

/**
 * Storybook story for the recently-viewed responsive layout (Task 665).
 *
 * Statically imports the real production `RecentlyViewedGridView` (Task 665 container/View
 * split) and the real `ClearRecentlyViewedButton` production component as the `clearSlot` —
 * no fake stand-in, no mock. Production never wires `isFavorited` for this surface, so no
 * favorite/AuthContext fixture is needed here (byte-identical to the real component: the
 * favorite heart never renders on recently-viewed cards).
 *
 * Governance note: docs/responsive-screenshot-governance.md §12 forbids capturing components
 * that require auth/DB (RecentlyViewedSection, the Server Component data-fetching shell), so
 * this story renders the presentational `RecentlyViewedGridView` via stable fixtures.
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { RecentlyViewedGridView } from '@/modules/listings/components/RecentlyViewedGridView'
import { ClearRecentlyViewedButton } from '@/modules/listings/components/ClearRecentlyViewedButton'
import { makeCardListingFixtures } from './fixtures/cardListingData.fixture'
import type { ExchangeRates } from '@/lib/getExchangeRate'

const meta: Meta = {
  title: 'System/RecentlyViewedSection',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Recently-viewed listings section — responsive layout story. ' +
          'Mobile: horizontal scroll (w-48 cards, no-scrollbar). ' +
          'sm+: 2-col grid → md: 3-col → lg: 4-col. ' +
          'Statically imports the real production `RecentlyViewedGridView` + `ClearRecentlyViewedButton` ' +
          '(profile-context clear slot). See docs/responsive-screenshot-governance.md for screenshot matrix.',
      },
    },
  },
}

export default meta
type Story = StoryObj

const FIXTURE_RATES: ExchangeRates = { ALL: 1, EUR: 100 }

export const Populated: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const listings = makeCardListingFixtures(locale)
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <RecentlyViewedGridView
          listings={listings}
          rates={FIXTURE_RATES}
          displayCurrency="EUR"
          clearSlot={<ClearRecentlyViewedButton />}
        />
      </div>
    )
  },

  parameters: {
    docs: { description: { story: 'Desktop 1280px: 3-col grid. Full field-parity cards (premium stripe, status badges, price/m², features, photo count, date). Clear button is the real production `ClearRecentlyViewedButton` (opens its own confirm dialog).' } }
  },

  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}

export const MobileScroll: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const listings = makeCardListingFixtures(locale).slice(0, 6)
    return (
      <div className="py-4 px-4">
        <RecentlyViewedGridView
          listings={listings}
          rates={FIXTURE_RATES}
          displayCurrency="EUR"
          clearSlot={<ClearRecentlyViewedButton />}
        />
      </div>
    )
  },

  parameters: {
    docs: { description: { story: 'Mobile 375px: horizontal scroll, w-48 shrink-0 cards with full field set. Scrollbar visible in story (production uses no-scrollbar). Swipe or drag horizontally to scroll.' } }
  },

  globals: {
    viewport: {
      value: 'mobile375',
      isRotated: false
    }
  }
}

export const EmptyState: Story = {
  render: () => (
    <div className="container-wide mx-auto px-4 py-8">
      <RecentlyViewedGridView
        listings={[]}
        rates={FIXTURE_RATES}
        displayCurrency="EUR"
        showEmptyState
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Empty state (showEmptyState=true), rendered by the real `RecentlyViewedGridView`\'s own empty branch. No clear button when no items.' } },
  },
}

export const LocaleStress: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const listings = makeCardListingFixtures(locale).slice(0, 4)
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <RecentlyViewedGridView
          listings={listings}
          rates={FIXTURE_RATES}
          displayCurrency="EUR"
          clearSlot={<ClearRecentlyViewedButton />}
        />
      </div>
    )
  },

  parameters: {
    docs: { description: { story: '@320: longest locale titles — title line-clamp-2, badge labels localize, no horizontal overflow. Use locale toolbar for sq/en/uk/it; viewport toolbar for other widths.' } }
  },

  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}
