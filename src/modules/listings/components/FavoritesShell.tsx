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
  const { rate } = useExchangeRate()
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

  // Ref updated synchronously on every render so the async realtime handler
  // always sees the current displayed IDs. Same pattern as onEventRef in the hook.
  const displayedIdsRef = useRef(new Set<string>())
  displayedIdsRef.current = new Set(displayedListings.map(l => l.id))

  // Realtime cross-tab sync — subscribes to the favorites table for this user.
  // The onEvent callback is kept stable via the ref inside the hook, so changing
  // typeFilter or displayedListings does NOT cause a re-subscription.
  useFavoritesRealtime({
    userId,
    displayedIdsRef,
    onEvent: (event) => {
      if (event.type === 'DELETE') {
        // Capture property_type before removing so liveCounts can be decremented.
        const removed = displayedListings.find(l => l.id === event.listingId)
        if (removed) {
          setLiveCounts(prev => ({
            ...prev,
            [removed.property_type]: Math.max(0, (prev[removed.property_type] ?? 0) - 1),
          }))
        }
        setDisplayedListings(prev => prev.filter(l => l.id !== event.listingId))
      } else if (event.type === 'INSERT') {
        const listing = event.listing
        // Respect the current type filter: skip if listing doesn't match.
        if (typeFilter && listing.property_type !== typeFilter) return
        // Only increment liveCounts when the listing is not already displayed.
        // displayedIdsRef is checked by the hook before calling onEvent; this
        // re-check guards against the narrow concurrent-render race window.
        const alreadyDisplayed = displayedIdsRef.current.has(listing.id)
        if (!alreadyDisplayed) {
          setLiveCounts(prev => ({
            ...prev,
            [listing.property_type]: (prev[listing.property_type] ?? 0) + 1,
          }))
        }
        setDisplayedListings(prev => {
          if (prev.some(l => l.id === listing.id)) return prev
          return [listing as CardListingData, ...prev]
        })
      }
    },
  })

  function handleFavoriteToggled(listingId: string, newState: boolean) {
    if (!newState) {
      // Decrement liveCounts before removing so the type chip count stays accurate.
      const listing = displayedListings.find(l => l.id === listingId)
      if (listing) {
        setLiveCounts(prev => ({
          ...prev,
          [listing.property_type]: Math.max(0, (prev[listing.property_type] ?? 0) - 1),
        }))
      }
      setDisplayedListings(prev => prev.filter(l => l.id !== listingId))
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
              exchangeRate={rate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
