import { cookies } from 'next/headers'
import { Paper, Skeleton, Stack, Text, Title } from '@mantine/core'
import { getUser } from '@/lib/auth/server'
import { MantineListingCardTrack } from '@/design-system/mantine/patterns/MantineListingCardTrack'
import { RECENTLY_VIEWED_COOKIE } from '../lib/recentlyViewedConstants'
import { getRecentlyViewedForUser, getRecentlyViewedForGuest } from '../lib/recentlyViewedQueries'
import { ClearRecentlyViewedButton } from './ClearRecentlyViewedButton'
import { RecentlyViewedGrid } from './RecentlyViewedGrid'

interface Props {
  /** Exclude this listing (listing detail page — excludes current listing). */
  currentListingId?: string
  limit?: number
  /** Show empty-state message when no items (profile context). */
  showEmptyState?: boolean
  /** Render the "Clear history" button — profile only, never on listing detail. */
  showClear?: boolean
}

/**
 * Server Component — data-fetching shell for the recently-viewed section.
 *
 * Auth users: queries `recently_viewed` table (RLS-scoped).
 * Guests:     reads the `rv_listings` cookie set by RecentlyViewedTracker.
 *
 * All rendering is delegated to RecentlyViewedGrid (client, no server-action deps)
 * so the layout component can be covered by Storybook stories.
 */
export async function RecentlyViewedSection({
  currentListingId,
  limit = 12,
  showEmptyState = false,
  showClear = false,
}: Props) {
  const user = await getUser()
  let listings: Awaited<ReturnType<typeof getRecentlyViewedForUser>> = []

  if (user) {
    listings = await getRecentlyViewedForUser({ excludeId: currentListingId, limit })
  } else {
    const cookieStore = await cookies()
    const raw = cookieStore.get(RECENTLY_VIEWED_COOKIE)?.value ?? '[]'
    let ids: string[] = []
    try {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) ids = parsed.filter((x): x is string => typeof x === 'string')
    } catch {
      ids = []
    }
    listings = await getRecentlyViewedForGuest(ids, { excludeId: currentListingId, limit })
  }

  return (
    <div data-testid="recently-viewed-section">
      <RecentlyViewedGrid
        listings={listings}
        showEmptyState={showEmptyState}
        clearSlot={showClear ? <ClearRecentlyViewedButton /> : undefined}
      />
    </div>
  )
}

/**
 * Skeleton fallback for <Suspense> on the listing detail page.
 *
 * Task 809 (R4) — rewritten to `SimilarListingsSkeleton`'s composition
 * (`ListingDetailView.tsx`, Task 807) so the recently-viewed placeholder is the SAME
 * `MantineListingCardTrack mode="rail"` as the content that replaces it — no more grid-then-rail
 * re-layout when the Suspense boundary resolves. `aria-busy`/`.recently-viewed` dropped: neither is
 * selected anywhere in the repo (grepped) and the canonical model carries neither.
 */
export function RecentlyViewedSkeleton() {
  return (
    <Stack gap="lg">
      <Skeleton radius="md">
        <Title order={2} size="h4">&nbsp;</Title>
      </Skeleton>
      <MantineListingCardTrack mode="rail">
        {Array.from({ length: 4 }).map((_, i) => (
          <Paper key={i} withBorder radius="lg" style={{ overflow: 'hidden' }}>
            <Skeleton radius={0} style={{ aspectRatio: '4 / 3' }} />
            <Stack gap="xs" p="sm">
              <Skeleton radius="sm">
                <Text size="sm">&nbsp;</Text>
              </Skeleton>
              <Skeleton radius="sm">
                <Text size="md" fw={600}>&nbsp;</Text>
              </Skeleton>
            </Stack>
          </Paper>
        ))}
      </MantineListingCardTrack>
    </Stack>
  )
}
