import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SimpleGrid, Stack, Title } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { ListingCard, type CardListingData } from '@/modules/listings/components/ListingCard'
import { AuthContext } from '@/modules/auth/context/AuthContext'
import type { ExchangeRates } from '@/lib/getExchangeRate'
import type { User } from '@/types/database'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Title under `Mantine/Primitives/` (Task 656) — statically imports the REAL production
 * `ListingCard` (clause 16c canonical-Story binding). Copy-id (`MantineCopyIdButton`) and
 * favorite (`FavoriteButton`) render through the exact same components production uses —
 * this story imports zero demo stand-ins.
 *
 * `FavoriteButton` reads auth via `useAuth()` (`@/modules/auth/context/AuthContext`). The
 * real `AuthProvider` cannot be used here — its `useEffect` mount calls
 * `AuthController.mount()`, which subscribes to a live Supabase client (forbidden in
 * stories). Instead this story wraps with the exported `AuthContext.Provider` directly and
 * supplies a fixture signed-in value, bypassing the controller/Supabase wiring entirely
 * while still exercising the real `FavoriteButton` in its authenticated state.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/ListingCard',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

const FIXTURE_RATES: ExchangeRates = { ALL: 1, EUR: 100 }

// Frozen "created 2 days ago" (no Date.now()/new Date() wall-clock in fixtures per Storybook
// governance §14, Task 697) — a cross-day capture must render byte-identical PNGs. Anchor is
// 2026-07-30 (Task 697 kickoff date); keeps the "New" badge (LISTING_NEW_DAYS=7,
// docs/domain-rules.md:106) in its current visible state.
const FIXTURE_CREATED_AT = '2026-07-28T00:00:00.000Z'

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

function makeFixtureListing(l: string, status: CardListingData['status'] = 'active'): CardListingData {
  return {
    id: `story-listing-001-${status}`,
    public_id: 1234,
    slug: 'modern-apartment-tirana-center',
    title: storyT(l, 'storybook.mantine.card_title_1'),
    price: 80000,
    currency: 'EUR',
    listing_type: 'sale',
    property_type: 'apartment',
    is_premium: false,
    status,
    created_at: FIXTURE_CREATED_AT,
    images: [
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop', is_cover: true, order: 0 },
    ],
    location: { id: 1, name_al: storyT(l, 'storybook.mantine.card_location_tirana'), slug: 'tirane', type: 'city' },
    area_gross: 85,
    bedrooms: 3,
    bathrooms: 2,
  }
}

export const Default: Story = {
  render: (_args, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    const listing = makeFixtureListing(l)
    // Task 741 §3.8 — production rendered proof of the migrated sold/rented overlay colours.
    // `ListingCard.tsx`'s `isClosed` branch (`:267-269`) is the in-scope production consumer;
    // authorised as a permanent `Default` export extension (single-export rule, governance §8)
    // by the quoted 2026-08-14 owner decision (see the kickoff's canonical UI decision record).
    // Sold then rented, in that DOM order, so a structural (never text) selector can find both.
    const soldListing = makeFixtureListing(l, 'sold')
    const rentedListing = makeFixtureListing(l, 'rented')

    return (
      <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
        <MantineStoryShell>
          <Stack gap="xl">
            <Stack gap="sm">
              <Title order={4}>{storyT(l, 'storybook.mantine.card_section_grid')}</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                <ListingCard listing={listing} variant="vertical" rates={FIXTURE_RATES} />
                <ListingCard listing={soldListing} variant="vertical" rates={FIXTURE_RATES} />
                <ListingCard listing={rentedListing} variant="vertical" rates={FIXTURE_RATES} />
              </SimpleGrid>
            </Stack>

            <Stack gap="sm">
              <Title order={4}>{storyT(l, 'storybook.mantine.card_section_list')}</Title>
              <ListingCard listing={listing} variant="horizontal" rates={FIXTURE_RATES} />
            </Stack>
          </Stack>
        </MantineStoryShell>
      </AuthContext.Provider>
    )
  },
}
