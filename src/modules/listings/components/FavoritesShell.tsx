'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Heart } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { ListingCard, type CardListingData } from '@/modules/listings/components/ListingCard'
import { FavoritesTypeFilter } from '@/modules/listings/components/FavoritesTypeFilter'
import { useFavoritesRealtime } from '@/modules/listings/hooks/useFavoritesRealtime'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { cn } from '@/lib/utils'

interface Props {
  listings: CardListingData[]
  userId: string
  typeFilter?: string
  typeCounts: Record<string, number>
}

export function FavoritesShell({ listings: initialListings, userId, typeFilter, typeCounts }: Props) {
  const t = useTranslations('favorites')
  const locale = useLocale()
  const { rates } = useExchangeRate()
  const { user } = useAuth()
  const displayCurrency = user?.preferred_currency ?? 'ALL'

  const [displayedListings, setDisplayedListings] = useState<CardListingData[]>(initialListings)

  // Live type counts — initialized from SSR snapshot and updated incrementally as
  // listings are added/removed in this session. This keeps totalFavorites and the
  // filter chip counts correct without requiring a round-trip to the server.
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>(typeCounts)

  // Sync with server-provided state on filter navigation (URL change → SSR re-render).
  useEffect(() => {
    setDisplayedListings(initialListings)
  }, [initialListings])

  useEffect(() => {
    setLiveCounts(typeCounts)
  }, [typeCounts])

  // Tracks the currently displayed listing IDs so the realtime handler can skip
  // DB fetches for listings that are already on screen (dedup optimization).
  //
  // Initialized from the first render's displayedListings; kept in sync via effect.
  // Using useEffect instead of a render-body mutation preserves React render purity
  // and is safe under concurrent rendering — the committed state is always reflected.
  //
  // Declaration order matters: this effect must be registered before useFavoritesRealtime
  // so it fires first on mount, ensuring the ref is populated before events arrive.
  const displayedIdsRef = useRef<ReadonlySet<string>>(new Set(displayedListings.map(l => l.id)))
  useEffect(() => {
    displayedIdsRef.current = new Set(displayedListings.map(l => l.id))
  }, [displayedListings])

  // Realtime cross-tab sync — subscribes to the favorites table for this user.
  // The onEvent callback is kept stable via the ref inside the hook, so changing
  // typeFilter or displayedListings does NOT cause a re-subscription.
  useFavoritesRealtime({
    userId,
    displayedIdsRef,
    onEvent: (event) => {
      if (event.type === 'DELETE') {
        // Use functional prev to get the committed state. If the listing is already
        // absent (handleFavoriteToggled ran first), we skip the liveCounts decrement —
        // preventing the race where both handlers decrement for the same removal.
        setDisplayedListings(prev => {
          const removed = prev.find(l => l.id === event.listingId)
          if (!removed) return prev   // already removed, guard: no double-decrement
          setLiveCounts(c => ({
            ...c,
            [removed.property_type]: Math.max(0, (c[removed.property_type] ?? 0) - 1),
          }))
          return prev.filter(l => l.id !== event.listingId)
        })
      } else if (event.type === 'INSERT') {
        const listing = event.listing
        // liveCounts tracks totals PER TYPE regardless of the active display filter —
        // it must be updated even when the listing doesn't match the current typeFilter.
        // displayedIdsRef is checked by the hook before calling onEvent; this
        // re-check guards against the narrow concurrent-render race window.
        const alreadyDisplayed = displayedIdsRef.current.has(listing.id)
        if (!alreadyDisplayed) {
          setLiveCounts(prev => ({
            ...prev,
            [listing.property_type]: (prev[listing.property_type] ?? 0) + 1,
          }))
        }
        // Respect the current type filter: only add to the displayed list if the
        // listing matches. liveCounts is updated above regardless of this guard.
        if (typeFilter && listing.property_type !== typeFilter) return
        setDisplayedListings(prev => {
          if (prev.some(l => l.id === listing.id)) return prev
          return [listing as CardListingData, ...prev]
        })
      }
    },
  })

  function handleFavoriteToggled(listingId: string, newState: boolean) {
    if (!newState) {
      // Use functional prev to get the committed state. If the realtime DELETE handler
      // already removed the listing, we skip the decrement — no double-decrement race.
      setDisplayedListings(prev => {
        const removed = prev.find(l => l.id === listingId)
        if (!removed) return prev   // already removed, guard: no double-decrement
        setLiveCounts(c => ({
          ...c,
          [removed.property_type]: Math.max(0, (c[removed.property_type] ?? 0) - 1),
        }))
        return prev.filter(l => l.id !== listingId)
      })
    }
  }

  // Derived from liveCounts (not the stale SSR typeCounts) so the full-empty-state
  // branch is correct after in-session unfavorite actions.
  const totalFavorites = Object.values(liveCounts).reduce((a, b) => a + b, 0)

  // Full empty state: user has no favorites at all.
  if (totalFavorites === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center">
          <Heart className="h-9 w-9 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">{t('empty_title')}</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">{t('empty_desc')}</p>
        </div>
        <Link
          href={`/${locale}/listings`}
          className={cn(buttonVariants({ size: 'lg' }), 'rounded-xl')}
        >
          {t('empty_cta')}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Pass liveCounts so chip counts stay synchronized with displayed listings */}
      <FavoritesTypeFilter typeCounts={liveCounts} currentType={typeFilter} />

      {displayedListings.length === 0 ? (
        // Filtered empty state: user has favorites but none match the selected type.
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
            <Heart className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">{t('empty_filtered_title')}</h3>
            <p className="text-muted-foreground text-sm">{t('empty_filtered_desc')}</p>
          </div>
          <Link
            href={`/${locale}/favorites`}
            className={cn(buttonVariants({ variant: 'outline' }), 'rounded-xl')}
          >
            {t('filter_all')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {displayedListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isFavorited={true}
              onFavoriteToggled={(newState) => handleFavoriteToggled(listing.id, newState)}
              layoutContext="3-col-xl"
              displayCurrency={displayCurrency}
              rates={rates}
            />
          ))}
        </div>
      )}
    </div>
  )
}
