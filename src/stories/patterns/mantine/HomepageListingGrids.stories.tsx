'use client'

/**
 * Canonical Mantine migration-scope story (Task 668) — statically imports the real production
 * `FeaturedListingsView` and `LatestListingsView` DIRECTLY (not the `stories` barrel or any
 * `System/*` re-export) so `check-story-coverage.mjs` resolves both import specifiers to the
 * concrete files registered in `scripts/mantine-migration-scope.json` (kickoff §3.7). The
 * existing `System/FeaturedListings` / `System/LatestListings` stories are unaffected — this is
 * an ADDITIVE enrolment route, not a replacement.
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Box } from '@mantine/core'
import { FeaturedListingsView } from '@/modules/listings/components/FeaturedListingsView'
import { LatestListingsView } from '@/modules/listings/components/LatestListingsView'
import { AuthContext } from '@/modules/auth/context/AuthContext'
import { makeCardListingFixtures } from '@/stories/fixtures/cardListingData.fixture'
import type { ExchangeRates } from '@/lib/getExchangeRate'
import type { User } from '@/types/database'

const meta: Meta = {
  title: 'Patterns/Mantine/HomepageListingGrids',
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Homepage Featured/Latest listing grids (Task 668) — migrated from raw Tailwind grid ' +
          'containers to Mantine `SimpleGrid`, with the large-desktop column step moved from ' +
          'Tailwind `2xl` (1536px) to Mantine `xxl` (1440px), an owner-approved adaptive change ' +
          '(2026-07-26). Statically imports the real production `FeaturedListingsView` and ' +
          '`LatestListingsView` by direct file path — the canonical coverage story for the ' +
          'Mantine migration-scope enrolment of both Views.',
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
      <Box maw="var(--width-page-max)" mx="auto" w="100%" px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }} py="2xl">
        <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
          <Stack gap="xl">
            <FeaturedListingsView
              listings={listings}
              loading={false}
              rates={FIXTURE_RATES}
              displayCurrency="EUR"
              favoriteIds={favoriteIds}
              locale={locale}
            />
            <LatestListingsView
              listings={listings}
              loading={false}
              rates={FIXTURE_RATES}
              displayCurrency="EUR"
              favoriteIds={favoriteIds}
            />
          </Stack>
        </AuthContext.Provider>
      </Box>
    )
  },

  parameters: {
    docs: {
      description: {
        story:
          'Both migrated grids populated — Featured steps 1/2/3/4 cols at </640/640/1280/1440, ' +
          'Latest steps 1/2/3 cols at </768/768/1440. Card 0 is favorited (signed-in fixture user).',
      },
    },
  },
}

export const Loading: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <Box maw="var(--width-page-max)" mx="auto" w="100%" px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }} py="2xl">
        <Stack gap="xl">
          <FeaturedListingsView
            listings={[]}
            loading
            rates={FIXTURE_RATES}
            displayCurrency="EUR"
            favoriteIds={new Set()}
            locale={locale}
          />
          <LatestListingsView
            listings={[]}
            loading
            rates={FIXTURE_RATES}
            displayCurrency="EUR"
            favoriteIds={new Set()}
          />
        </Stack>
      </Box>
    )
  },

  parameters: {
    docs: {
      description: {
        story:
          'Both grids in their loading branch — 3 Featured / 4 Latest skeletons, rendered by the ' +
          'Views\' own loading branches (byte-identical to production). A deliberate, permanent ' +
          'skeleton state — allowlisted in `LOADER_ALLOWLIST`, not a real defect.',
      },
    },
  },
}
