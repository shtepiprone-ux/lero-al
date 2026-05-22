import { cookies } from 'next/headers'
import { getTranslations } from 'next-intl/server'
import { getUser } from '@/lib/auth/server'
import { RECENTLY_VIEWED_COOKIE } from '../lib/recentlyViewedConstants'
import { getRecentlyViewedForUser, getRecentlyViewedForGuest } from '../lib/recentlyViewedQueries'
import { ListingCard } from './ListingCard'
import { ClearRecentlyViewedButton } from './ClearRecentlyViewedButton'

interface Props {
  /** Exclude this listing from the list (used on listing detail page). */
  currentListingId?: string
  limit?: number
  /** Show the empty state message instead of returning null when no items. */
  showEmptyState?: boolean
  /** Render the "Clear history" button — profile only, never on listing detail. */
  showClear?: boolean
}

/**
 * Server Component — self-fetching recently-viewed section.
 *
 * Auth users: queries `recently_viewed` table (RLS-scoped).
 * Guests:     reads the `rv_listings` cookie set by `RecentlyViewedTracker`.
 *
 * Renders a horizontal scroll on mobile, responsive grid on sm+.
 * Returns null if there are no items to show.
 */
export async function RecentlyViewedSection({ currentListingId, limit = 12, showEmptyState = false, showClear = false }: Props) {
  const t = await getTranslations('listing')
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

  if (!listings.length) {
    if (!showEmptyState) return null
    return (
      <div className="recently-viewed">
        <h2 className="text-xl font-bold mb-4">{t('recently_viewed_title')}</h2>
        <p className="text-sm text-muted-foreground">{t('recently_viewed_empty')}</p>
      </div>
    )
  }

  return (
    <div className="recently-viewed">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{t('recently_viewed_title')}</h2>
        {showClear && <ClearRecentlyViewedButton />}
      </div>

      {/*
        Mobile (base): horizontal scroll with fixed-width cards.
        sm+: grid layout with responsive column count.
        no-scrollbar removes the visible scrollbar on WebKit/Firefox while keeping scroll functionality.
      */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 md:grid-cols-3 lg:grid-cols-4">
        {listings.map(listing => (
          <div key={listing.id} className="w-48 shrink-0 sm:w-auto sm:shrink">
            <ListingCard listing={listing} layoutContext="4-col" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton fallback for <Suspense> on listing detail page.
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
