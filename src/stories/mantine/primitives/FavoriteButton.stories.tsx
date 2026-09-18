import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Box, Group, Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { FavoriteButton } from '@/modules/listings/components/FavoriteButton'
import cardStyles from '@/modules/listings/components/ListingCard.module.css'
import { AuthContext } from '@/modules/auth/context/AuthContext'
import type { User } from '@/types/database'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Task 821 — canonical story for the real production `FavoriteButton` (agent-contract 16d tier-3
 * node, enrolled in `scripts/mantine-migration-scope.json`; its former tier-3
 * `scripts/rendered-scope-allowlist.json` entry was removed by the 2026-09-16 owner decision once
 * the component was enrolled and storied — the allowlist carries no current entry for it).
 * Rendered by `ListingCard` and `ListingDetailView`, neither of which owns it. Statically imports
 * the real component (clause 16c) — `ListingCardPattern.stories.tsx` also imports it directly, but
 * only to fill a composition slot on `MantineListingCardPattern`; that is not this component's own
 * Story (GR-3/agent-contract 16d: "a composition Story is not a component Story"). This file is.
 *
 * `FavoriteButton` calls `useAuth()` unconditionally on every render, so — same technique as
 * `ListingCard.stories.tsx`/`ListingCardPattern.stories.tsx` — the real `AuthContext.Provider` is
 * supplied directly with a signed-in fixture, bypassing `AuthProvider`'s live-Supabase-subscribing
 * `useEffect` mount (forbidden in stories) while still exercising the real button.
 *
 * `disabled`/`disabledLabel` and every `className`/`overlay` value below are the exact real
 * production call sites, not invented: `ListingCard.tsx:171-178` (list/inline,
 * `styles.inlineFavorite`, no `overlay`, rendered in the first section below), `ListingCard.tsx:263-271`
 * (grid, `overlay` + `styles.overlayFavorite`, rendered in the second section below), and
 * `ListingDetailView.tsx:248-254` (no `className`, no `overlay`,
 * `disabledLabel` from the `action_disabled_*` translations `favoriteDisabledLabel` resolves to),
 * rendered in the third section, "Icon shape, no className".
 *
 * Task 837 R2 (owner decision 2026-09-17) — the story section that used to follow the overlay
 * section, demonstrating the component's second visual mode (a full-height action-row control),
 * is deleted: `FavoriteButton` now has exactly one render branch, the round icon shape every
 * section above already proves. That second mode's own size prop, its internal size-mapping
 * constant and its one-off corner-radius theme token existed only to serve this now-removed story
 * section — no production file ever rendered it (Task 211 put it in `ListingContact.tsx`'s action
 * row in 2026-05; Task 784 D69-25 / Task 793 re-homed the favorite to the badges row and left it
 * orphaned).
 */
const meta: Meta = {
  title: 'Mantine/Primitives/FavoriteButton',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

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
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const disabledLabel = storyT(locale, 'listing.action_disabled_sold')

    return (
      <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
        <MantineStoryShell>
          <Stack gap="xl">
            <Stack gap="sm">
              <Text size="xs" c="gray.5" fw={500}>
                Icon shape, inline (`ListingCard.tsx`&apos;s list variant, `styles.inlineFavorite`) — the
                4 states AC4 requires: unsaved/saved × enabled/disabled.
              </Text>
              <Group gap="xl" wrap="wrap">
                <Stack gap={4} align="center">
                  <FavoriteButton listingId="story-1" isFavorited={false} className={cardStyles.inlineFavorite} />
                  <Text size="xs" c="dimmed">unsaved, enabled</Text>
                </Stack>
                <Stack gap={4} align="center">
                  <FavoriteButton listingId="story-2" isFavorited className={cardStyles.inlineFavorite} />
                  <Text size="xs" c="dimmed">saved, enabled</Text>
                </Stack>
                <Stack gap={4} align="center">
                  <FavoriteButton
                    listingId="story-3"
                    isFavorited={false}
                    disabled
                    disabledLabel={disabledLabel}
                    className={cardStyles.inlineFavorite}
                  />
                  <Text size="xs" c="dimmed">unsaved, disabled</Text>
                </Stack>
                <Stack gap={4} align="center">
                  <FavoriteButton
                    listingId="story-4"
                    isFavorited
                    disabled
                    disabledLabel={disabledLabel}
                    className={cardStyles.inlineFavorite}
                  />
                  <Text size="xs" c="dimmed">saved, disabled</Text>
                </Stack>
              </Group>
            </Stack>

            <Stack gap="sm">
              <Text size="xs" c="gray.5" fw={500}>
                Icon shape, `overlay` (`ListingCard.tsx`&apos;s grid variant, `overlay` + `styles.overlayFavorite`)
                — the real production floating-corner contract, over a representative image area.
              </Text>
              <Group gap="xl" wrap="wrap">
                <Stack gap={4} align="center">
                  <Box pos="relative" w={160} h={100} bg="gray.1">
                    <FavoriteButton listingId="story-5" isFavorited={false} overlay className={cardStyles.overlayFavorite} />
                  </Box>
                  <Text size="xs" c="dimmed">overlay, unsaved</Text>
                </Stack>
                <Stack gap={4} align="center">
                  <Box pos="relative" w={160} h={100} bg="gray.1">
                    <FavoriteButton listingId="story-6" isFavorited overlay className={cardStyles.overlayFavorite} />
                  </Box>
                  <Text size="xs" c="dimmed">overlay, saved</Text>
                </Stack>
              </Group>
            </Stack>

            <Stack gap="sm">
              <Text size="xs" c="gray.5" fw={500}>
                No className, no `overlay` (`ListingDetailView.tsx:248-254` detail action row) —
                the 4 states: unsaved/saved × enabled/disabled.
              </Text>
              <Group gap="xl" wrap="wrap">
                <Stack gap={4} align="center">
                  <FavoriteButton listingId="story-9" isFavorited={false} />
                  <Text size="xs" c="dimmed">unsaved, enabled</Text>
                </Stack>
                <Stack gap={4} align="center">
                  <FavoriteButton listingId="story-10" isFavorited />
                  <Text size="xs" c="dimmed">saved, enabled</Text>
                </Stack>
                <Stack gap={4} align="center">
                  <FavoriteButton listingId="story-11" isFavorited={false} disabled disabledLabel={disabledLabel} />
                  <Text size="xs" c="dimmed">unsaved, disabled</Text>
                </Stack>
                <Stack gap={4} align="center">
                  <FavoriteButton listingId="story-12" isFavorited disabled disabledLabel={disabledLabel} />
                  <Text size="xs" c="dimmed">saved, disabled</Text>
                </Stack>
              </Group>
            </Stack>
          </Stack>
        </MantineStoryShell>
      </AuthContext.Provider>
    )
  },
}
