'use client'

/**
 * Storybook story for the SimilarListings public listing-detail grid (Task 665).
 *
 * Statically imports the real production `SimilarListingsView` (Task 665 container/View
 * split — clause 16c canonical-Story honesty, no divergent fake card). The live container
 * (`SimilarListings.tsx`) is a Server Component (Supabase query, headers, speculation-rules
 * script); this story renders the presentational View only, with a fixed `heading` string
 * resolved through the same real `listing.similar_listings` message key the server container
 * passes via `getTranslations('listing')('similar_listings')`.
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SimilarListingsView } from '@/modules/listings/components/SimilarListingsView'
import { makeCardListingFixtures } from './fixtures/cardListingData.fixture'
import { storyT } from './_storyI18n'
import type { ExchangeRates } from '@/lib/getExchangeRate'

const meta: Meta = {
  title: 'System/SimilarListings',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Similar listings grid — public listing-detail section. Canonical §8.3 card grid: grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4. Statically imports the real production `SimilarListingsView` (Task 665).',
      },
    },
  },
}
export default meta
type Story = StoryObj

const FIXTURE_RATES: ExchangeRates = { ALL: 1, EUR: 100 }

export const Default: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const listings = makeCardListingFixtures(locale)
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <SimilarListingsView
          heading={storyT(locale, 'listing.similar_listings')}
          listings={listings}
          rates={FIXTURE_RATES}
          displayCurrency="EUR"
        />
      </div>
    )
  },

  parameters: {
    docs: { description: { story: 'Exercises the §8.3 column step across breakpoints: 1 col (<640) → 2 cols (sm) → 3 cols (xl, 1280px) → 4 cols (2xl, 1536px).' } }
  },

  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}

export const LocaleStress: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const listings = makeCardListingFixtures(locale).slice(0, 4)
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <SimilarListingsView
          heading={storyT(locale, 'listing.similar_listings')}
          listings={listings}
          rates={FIXTURE_RATES}
          displayCurrency="EUR"
        />
      </div>
    )
  },

  parameters: {
    docs: { description: { story: '@320: longest locale titles — verify line-clamp-2, no horizontal overflow. Use the locale toolbar for sq/en/uk/it.' } }
  },

  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}
