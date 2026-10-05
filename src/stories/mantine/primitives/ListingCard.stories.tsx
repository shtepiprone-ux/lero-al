import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SimpleGrid, Stack, Title } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { ListingCard } from '@/modules/listings/components/ListingCard'
import { MantineListingCardTrack } from '@/design-system/mantine/patterns/MantineListingCardTrack'
import { AuthContext } from '@/modules/auth/context/AuthContext'
import type { ExchangeRates } from '@/lib/getExchangeRate'
import type { User } from '@/types/database'
import { MantineStoryShell } from '../_MantineStoryShell'
import { TITLE_FZ } from '@/design-system/mantine/typography'
import { FIXTURE_OLD_CREATED_AT, makeStateListing, type StateListingOpts } from '@/stories/fixtures/cardListingData.fixture'

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

// Every production state of the card, in this order (Task 741 R3b, R39 — the primitive proves ALL of them):
// (1) active + New · (2) active, no badge · (3) active + New + price reduced · (4) premium · (5) inactive ·
// (6) pending · (7) sold · (8) rented · (9) archived · (10) expired · (11) no image.
// Sold and rented are the only states that draw the centred overlay (`ListingCard.tsx` `isClosed`).
const CARD_STATES: { key: string; opts: StateListingOpts }[] = [
  { key: 'new', opts: {} },
  { key: 'plain', opts: { createdAt: FIXTURE_OLD_CREATED_AT } },
  { key: 'new-reduced', opts: { priceOld: 92000 } },
  { key: 'premium', opts: { createdAt: FIXTURE_OLD_CREATED_AT, premium: true } },
  { key: 'inactive', opts: { status: 'inactive' } },
  { key: 'pending', opts: { status: 'pending' } },
  { key: 'sold', opts: { status: 'sold' } },
  { key: 'rented', opts: { status: 'rented' } },
  { key: 'archived', opts: { status: 'archived' } },
  { key: 'expired', opts: { status: 'expired' } },
  { key: 'no-image', opts: { createdAt: FIXTURE_OLD_CREATED_AT, noImage: true } },
]

export const Default: Story = {
  render: (_args, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    // Task 741 §3.8 / R3b — production rendered proof of every card state through the real `ListingCard`.
    // Authorised as a permanent `Default` export extension (single-export rule, governance §8) by the
    // quoted 2026-08-14 owner decision and the 2026-10-04 return (O46-1 row 1) — no second export.
    const listings = CARD_STATES.map(({ key, opts }) => makeStateListing(l, key, opts))

    return (
      <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
        <MantineStoryShell>
          <Stack gap="xl">
            <Stack gap="sm">
              <Title order={4} fz={TITLE_FZ.h4}>{storyT(l, 'storybook.mantine.card_section_grid')}</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                {listings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} variant="vertical" rates={FIXTURE_RATES} />
                ))}
              </SimpleGrid>
            </Stack>

            {/* List layout is not used below 640px (owner D46-3, 2026-10-04): hidden below `sm`, as
                `ListingsSortBar.tsx` hides its List toggle (`visibleFrom="sm"`). */}
            <Stack gap="sm" visibleFrom="sm">
              <Title order={4} fz={TITLE_FZ.h4}>{storyT(l, 'storybook.mantine.card_section_list')}</Title>
              <Stack gap="sm">
                {listings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} variant="horizontal" rates={FIXTURE_RATES} />
                ))}
              </Stack>
            </Stack>
          </Stack>
        </MantineStoryShell>
      </AuthContext.Provider>
    )
  },
}

/**
 * Reproduces the `/[locale]/favorites` composition (`FavoritesShell.tsx`): the real
 * `MantineListingCardTrack mode="grid"` (the same track `/listings` uses) holding a favorited vertical
 * card with `layoutContext="card-track-grid"`, for the pointer probes
 * (`scripts/task764-pointer-probe.mjs favorites`). Task 886 R34 (owner O83-1): cards carry no
 * save-to-collection control; that action lives only on the listing-detail page. It needs the same
 * `AuthContext.Provider` signed-in fixture as `Default` for the real `FavoriteButton`.
 */
export const FavoritesComposition: Story = {
  render: (_args, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    const listing = makeStateListing(l, 'favorited')

    return (
      <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
        <MantineStoryShell>
          <MantineListingCardTrack mode="grid">
            <ListingCard
              listing={listing}
              variant="vertical"
              isFavorited
              layoutContext="card-track-grid"
              rates={FIXTURE_RATES}
            />
          </MantineListingCardTrack>
        </MantineStoryShell>
      </AuthContext.Provider>
    )
  },
}
