import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AuthContext } from '@/modules/auth/context/AuthContext';
import { ListingCard, type CardListingData } from '@/modules/listings/components/ListingCard';
import type { ExchangeRates } from '@/lib/getExchangeRate';
import type { User } from '@/types/database';
import { storyT } from '@/stories/_storyI18n';
import { MantineListingCardTrack } from '@/design-system/mantine/patterns/MantineListingCardTrack';

/**
 * Task 806 (D74-1/D74-2/D74-3) canonical proof for the shared listing-card track. Both `grid` and
 * `rail` modes are driven solely by `--listing-card-min` (280px, `globals.css` `:root`) — zero
 * `@media` rules in `MantineListingCardTrack.module.css` (AC3). No production surface consumes this
 * primitive yet (Task 807); this story is the standalone proof required before any consumer
 * composes it (agent-contract clause 16c).
 *
 * Renders the REAL `ListingCard` with the SAME fixture shape `Mantine/Primitives/ListingCard`
 * already uses — `FIXTURE_RATES`/`FIXTURE_USER`/`MOCK_SIGNED_IN_AUTH`/`makeFixtureListing` below are
 * copied from that file's own fixture (`src/stories/mantine/primitives/ListingCard.stories.tsx`),
 * not a second invented listing shape. Every card in every export below is this same deterministic
 * fixture (no live network, no live auth) — only the item count and `mode` change per export.
 */
const meta: Meta<typeof MantineListingCardTrack> = {
  title: 'Patterns/Mantine/ListingCardTrack',
  component: MantineListingCardTrack,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The canonical listing-card track (Task 806) — one shared primitive with a `grid` mode ' +
          '(`repeat(auto-fill, minmax(var(--listing-card-min), 1fr))`) and a `rail` mode ' +
          '(`min(var(--listing-card-min), 82%)` horizontal scroll), both sized only by ' +
          "`var(--listing-card-min)`. Zero `@media` rules — the column count is the browser's own " +
          'arithmetic (D74-1). Viewport and locale switched via Storybook toolbar.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof MantineListingCardTrack>;

// Copied verbatim from `src/stories/mantine/primitives/ListingCard.stories.tsx` — the existing
// canonical `ListingCard` fixture, reused rather than reinvented (kickoff §10.4).
const FIXTURE_RATES: ExchangeRates = { ALL: 1, EUR: 100 };
const FIXTURE_CREATED_AT = '2026-07-28T00:00:00.000Z';

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
};

const MOCK_SIGNED_IN_AUTH = {
  user: FIXTURE_USER,
  status: 'authenticated' as const,
  loading: false,
  signOut: () => {},
  refreshUser: () => {},
};

function makeFixtureListing(l: string, id: string): CardListingData {
  return {
    id,
    public_id: 1234,
    slug: 'modern-apartment-tirana-center',
    title: storyT(l, 'storybook.mantine.card_title_1'),
    price: 80000,
    currency: 'EUR',
    listing_type: 'sale',
    property_type: 'apartment',
    is_premium: false,
    status: 'active',
    created_at: FIXTURE_CREATED_AT,
    images: [
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop', is_cover: true, order: 0 },
    ],
    location: { id: 1, name_al: storyT(l, 'storybook.mantine.card_location_tirana'), slug: 'tirane', type: 'city' },
    area_gross: 85,
    bedrooms: 3,
    bathrooms: 2,
  };
}

/** `count` deterministic fixture `ListingCard`s — the track's own children, unwrapped. */
function fixtureCards(l: string, count: number) {
  return Array.from({ length: count }, (_, i) => (
    <ListingCard
      key={`track-fixture-${i}`}
      listing={makeFixtureListing(l, `story-track-listing-${i}`)}
      variant="vertical"
      rates={FIXTURE_RATES}
    />
  ));
}

export const Grid: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
        <MantineListingCardTrack mode="grid">{fixtureCards(l, 8)}</MantineListingCardTrack>
      </AuthContext.Provider>
    );
  },
};

// The peek is the thing being proven — the next card must remain partially visible at every width.
export const Rail: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
        <MantineListingCardTrack mode="rail">{fixtureCards(l, 8)}</MantineListingCardTrack>
      </AuthContext.Provider>
    );
  },
};

// The auto-fill single-column case — one card must fill the grid's sole column.
export const GridSingleItem: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
        <MantineListingCardTrack mode="grid">{fixtureCards(l, 1)}</MantineListingCardTrack>
      </AuthContext.Provider>
    );
  },
};

// A rail that cannot overflow is not a defect (Task 803 §16.4d lesson).
export const RailSingleItem: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
        <MantineListingCardTrack mode="rail">{fixtureCards(l, 1)}</MantineListingCardTrack>
      </AuthContext.Provider>
    );
  },
};

// Zero children — the track renders nothing visible and must not reserve height or throw.
export const Empty: Story = {
  render: () => <MantineListingCardTrack mode="grid">{null}</MantineListingCardTrack>,
};
