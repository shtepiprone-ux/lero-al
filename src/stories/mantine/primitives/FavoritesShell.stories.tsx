import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AuthContext } from '@/modules/auth/context/AuthContext'
import { FavoritesShell } from '@/modules/listings/components/FavoritesShell'
import { makeCardListingFixtures } from '@/stories/fixtures/cardListingData.fixture'
import { MantineStoryShell } from '../_MantineStoryShell'
import type { User } from '@/types/database'

/**
 * Task 809 (R6) — canonical Mantine story for the real production `FavoritesShell` (`/[locale]
 * /favorites`). Statically imports the real component (clause 16c) — no demo stand-in. Enrolled in
 * `scripts/mantine-migration-scope.json` (coverage 33 → 34).
 *
 * Four states, matching the shell's own branch structure: `Populated` (the grid, through the real
 * `MantineListingCardTrack mode="grid"`), `Empty` (no favorites at all), `TypeFilterNoMatches`
 * (favorites exist, the active type filter matches none), `Error` (server fetch failed).
 *
 * `FavoritesShell` internally calls `useExchangeRate()` (a `fetch('/api/exchange-rate')` with a
 * built-in catch → static fallback, no story-breaking effect) and `useFavoritesRealtime()` (an
 * async Supabase realtime channel subscribe, fire-and-forget in a `useEffect`, non-blocking for
 * render). Neither is mocked — the kickoff's own §5/§8 name `useFavoritesRealtime` out of this
 * task's scope, and both degrade gracefully rather than throwing. `AuthContext.Provider` supplies a
 * signed-in fixture the same way `Mantine/Primitives/ListingCard` does — `FavoritesTypeFilter`
 * (`useRouter`) and `SaveToCollectionButton`/`CollectionsSection` (`useAuth`) all need it.
 */
const meta: Meta<typeof FavoritesShell> = {
  title: 'Mantine/Primitives/FavoritesShell',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof FavoritesShell>

const FIXTURE_USER: User = {
  id: 'story-user-favorites',
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

export const Populated: Story = {
  render: (_args, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    const listings = makeCardListingFixtures(l)
    return (
      <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
        <MantineStoryShell>
          <FavoritesShell
            listings={listings}
            userId={FIXTURE_USER.id}
            typeCounts={{ apartment: listings.length }}
            page={1}
            perPage={12}
            initialCollections={[]}
          />
        </MantineStoryShell>
      </AuthContext.Provider>
    )
  },
}

export const Empty: Story = {
  render: () => (
    <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
      <MantineStoryShell>
        <FavoritesShell
          listings={[]}
          userId={FIXTURE_USER.id}
          typeCounts={{}}
          page={1}
          perPage={12}
          initialCollections={[]}
        />
      </MantineStoryShell>
    </AuthContext.Provider>
  ),
}

// Favorites exist (typeCounts has entries), but the active type filter matches none of them.
// Task 809 Revision 4 (R37) — typeCounts previously carried only one property type
// (apartment: 3); FavoritesTypeFilter.tsx:28 returns null when availableTypes.length <= 1, so
// this story rendered no SegmentedControl at all, silently collapsing into a second copy of the
// true-empty state. Two counted types are required for the branch this story is named for.
//
// Task 809 Revision 5 (R43) — Revision 4's fixture (`typeFilter="house"`, `typeCounts={apartment:3,
// house:2}`) was not a producible server state: `typeCounts.house === 2` asserts two real house
// favorites exist, so FavoritesShell's own `typeFilter === listing.property_type` server-side
// filtering would have returned those 2 listings, not the empty array this fixture also passes —
// the two props contradicted each other. The real, server-reachable route to this branch (used in
// Revision 0's own live capture, `runs/prod-clean-2`: `/uk/favorites?type=land`) is a `typeFilter`
// value that is NOT one of the counted types at all — the user has apartment/house favorites and
// navigates (URL edit, stale bookmark, or a type with zero favorites) to a type with none. `land` is
// a valid `PROPERTY_TYPES` value (`src/modules/listings/constants/index.ts`) that is absent from
// `typeCounts` below, so `listings=[]` is now consistent with both counts.
export const TypeFilterNoMatches: Story = {
  render: () => (
    <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
      <MantineStoryShell>
        <FavoritesShell
          listings={[]}
          userId={FIXTURE_USER.id}
          typeFilter="land"
          typeCounts={{ apartment: 3, house: 2 }}
          page={1}
          perPage={12}
          initialCollections={[]}
        />
      </MantineStoryShell>
    </AuthContext.Provider>
  ),
}

export const Error: Story = {
  render: () => (
    <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
      <MantineStoryShell>
        <FavoritesShell
          listings={[]}
          userId={FIXTURE_USER.id}
          typeCounts={{}}
          page={1}
          perPage={12}
          error
          initialCollections={[]}
        />
      </MantineStoryShell>
    </AuthContext.Provider>
  ),
}
