'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Heart } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { ListingCard } from '@/modules/listings/components/ListingCard'
import { FavoritesTypeFilter } from '@/modules/listings/components/FavoritesTypeFilter'
import { useFavoritesRealtime } from '@/modules/listings/hooks/useFavoritesRealtime'
import { cn } from '@/lib/utils'

interface Props {
  listings: any[]
  userId: string
  typeFilter?: string
  typeCounts: Record<string, number>
}

export function FavoritesShell({ listings: initialListings, userId, typeFilter, typeCounts }: Props) {
  const t = useTranslations('favorites')
  const locale = useLocale()

  const [displayedListings, setDisplayedListings] = useState<any[]>(initialListings)

  // Sync with server-provided listings whenever the filter changes (URL navigation
  // causes a server re-render which passes fresh initialListings).
  useEffect(() => {
    setDisplayedListings(initialListings)
  }, [initialListings])

  // Ref updated synchronously on every render so the async realtime handler
  // always sees the current displayed IDs. Same pattern as onEventRef in the hook.
  const displayedIdsRef = useRef(new Set<string>())
  displayedIdsRef.current = new Set(displayedListings.map((l: any) => l.id as string))

  // Realtime cross-tab sync — subscribes to the favorites table for this user.
  // The onEvent callback is kept stable via the ref inside the hook, so changing
  // typeFilter or displayedListings does NOT cause a re-subscription.
  useFavoritesRealtime({
    userId,
    displayedIdsRef,
    onEvent: (event) => {
      if (event.type === 'DELETE') {
        setDisplayedListings(prev => prev.filter((l: any) => l.id !== event.listingId))
      } else if (event.type === 'INSERT') {
        const listing = event.listing
        // Respect the current type filter: skip if listing doesn't match.
        if (typeFilter && listing.property_type !== typeFilter) return
        // Avoid duplicates (same tab may already have it via optimistic update).
        setDisplayedListings(prev => {
          if (prev.some((l: any) => l.id === listing.id)) return prev
          return [listing, ...prev]
        })
      }
    },
  })

  function handleFavoriteToggled(listingId: string, newState: boolean) {
    if (!newState) {
      setDisplayedListings(prev => prev.filter((l: any) => l.id !== listingId))
    }
  }

  const totalFavorites = Object.values(typeCounts).reduce((a, b) => a + b, 0)

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
      <FavoritesTypeFilter typeCounts={typeCounts} currentType={typeFilter} />

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
          {displayedListings.map((listing: any) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isFavorited={true}
              onFavoriteToggled={(newState) => handleFavoriteToggled(listing.id, newState)}
              layoutContext="3-col-xl"
            />
          ))}
        </div>
      )}
    </div>
  )
}
