import { cookies } from 'next/headers'
import { getUser } from '@/lib/auth/server'
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
    <RecentlyViewedGrid
      listings={listings}
      showEmptyState={showEmptyState}
      clearSlot={showClear ? <ClearRecentlyViewedButton /> : undefined}
    />
  )
}

/**
 * Skeleton fallback for <Suspense> on the listing detail page.
 */
export function RecentlyViewedSkeleton() {
  return (
    <div className="recently-viewed" aria-busy="true">
      <div className="h-7 w-52 rounded-lg bg-muted animate-pulse mb-4" />
      <div className="flex gap-3 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-48 shrink-0 sm:w-auto rounded-xl border overflow-hidden">
            <div className="aspect-[4/3] bg-muted animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-5 w-28 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
