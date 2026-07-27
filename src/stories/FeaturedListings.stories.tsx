'use client'

/**
 * Storybook story for the FeaturedListings public-homepage grid (Task 665).
 *
 * Statically imports the real production `FeaturedListingsView` (Task 665 container/View
 * split — clause 16c canonical-Story honesty, no divergent fake card). `Default`/`LocaleStress`
 * wrap with a fixed signed-in `AuthContext.Provider` (same mechanism as
 * `Mantine/Primitives/ListingCard.stories.tsx` — never `AuthProvider`, never a mock) and mark
 * one fixture listing as favorited, so the real `FavoriteButton` renders its favorited state,
 * not just the guest look. `Loading`/`Empty` pass `loading:true` / `listings:[]` to the same
 * View — no separate fake markup.
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FeaturedListingsView } from '@/modules/listings/components/FeaturedListingsView'
import { AuthContext } from '@/modules/auth/context/AuthContext'
import { makeCardListingFixtures } from './fixtures/cardListingData.fixture'
import type { ExchangeRates } from '@/lib/getExchangeRate'
import type { User } from '@/types/database'

const meta: Meta = {
  title: 'System/FeaturedListings',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Featured listings grid — public homepage section. Canonical §8.3 card grid, migrated to Mantine (Task 668): `<SimpleGrid cols={{ base: 1, sm: 2, xl: 3, xxl: 4 }} spacing="md">`. Statically imports the real production `FeaturedListingsView`; `Default` renders the signed-in favorited state via a fixed `AuthContext.Provider` fixture (Task 665).',
      },
    },
  },
}
export default meta
type Story = StoryObj

const FIXTURE_RATES: ExchangeRates = { ALL: 1, EUR: 100 }

const FIXTURE_USER: User = {
  id: 'story-user-001',
  public_id: 1,
  name: 'Story User',
  last_name: null,
  phone: null,
  whatsapp: null,
  avatar_url: null,
  role: 'user',
  user_type: 'private',
  status: 'active',
  block_reason: null,
  suspended_until: null,
  company_name: null,
  company_logo_url: null,
  company_id: null,
  website: null,
  is_verified: true,
  social_provider: null,
  location_id: null,
  position: null,
  year_started: null,
  deleted_at: null,
  location_request: null,
  preferred_currency: 'EUR',
  pending_email: null,
  last_seen_at: null,
  inactivity_warning_sent_at: null,
  preferred_locale: 'en',
  created_at: '2026-01-01T00:00:00.000Z',
}

const MOCK_SIGNED_IN_AUTH = {
  user: FIXTURE_USER,
  status: 'authenticated' as const,
  loading: false,
  signOut: () => {},
  refreshUser: () => {},
}

export const Default: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const listings = makeCardListingFixtures(locale)
    const favoriteIds = new Set([listings[0]!.id])
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
          <FeaturedListingsView
            listings={listings}
            loading={false}
            rates={FIXTURE_RATES}
            displayCurrency="EUR"
            favoriteIds={favoriteIds}
            locale={locale}
          />
        </AuthContext.Provider>
      </div>
    )
  },

  parameters: {
    docs: { description: { story: 'Exercises the §8.3 column step across Mantine theme breakpoints: 1 col (<640) → 2 cols (sm, 640px) → 3 cols (xl, 1280px) → 4 cols (xxl, 1440px) — moved from Tailwind 1536px to Mantine xxl/1440px per the Task 668 owner decision (2026-07-26). Card 0 is favorited (signed-in fixture user) — the real `FavoriteButton` renders filled, not just the guest state.' } }
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
    const favoriteIds = new Set([listings[0]!.id])
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
          <FeaturedListingsView
            listings={listings}
            loading={false}
            rates={FIXTURE_RATES}
            displayCurrency="EUR"
            favoriteIds={favoriteIds}
            locale={locale}
          />
        </AuthContext.Provider>
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

export const Loading: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <FeaturedListingsView
          listings={[]}
          loading
          rates={FIXTURE_RATES}
          displayCurrency="EUR"
          favoriteIds={new Set()}
          locale={locale}
        />
      </div>
    )
  },

  parameters: {
    docs: { description: { story: 'Loading state — three skeleton cards, rendered by the real `FeaturedListingsView`\'s own loading branch (byte-identical to production, Task 665 — no divergent stand-in).' } }
  },
}

export const Empty: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <FeaturedListingsView
          listings={[]}
          loading={false}
          rates={FIXTURE_RATES}
          displayCurrency="EUR"
          favoriteIds={new Set()}
          locale={locale}
        />
      </div>
    )
  },

  parameters: {
    docs: { description: { story: 'Empty state — zero premium listings resolved; rendered by the real `FeaturedListingsView`\'s own empty branch (Mantine `Text`, centered, dimmed).' } }
  },
}
