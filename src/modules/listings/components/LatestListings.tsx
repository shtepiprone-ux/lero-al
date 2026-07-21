'use client'

import { useTranslations } from 'next-intl'
import { Skeleton } from '@mantine/core'
import { useLatestListings } from '@/modules/listings/hooks/useListings'
import { ListingCard } from '@/modules/listings/components/ListingCard'
import { getImagePriority } from '@/lib/imageDelivery'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useAuth } from '@/modules/auth/context/AuthContext'

function RowSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border bg-card overflow-hidden">
      <Skeleton style={{ aspectRatio: '4 / 3' }} />
      <div className="p-3 space-y-2">
        <Skeleton height={12} width={80} />
        <Skeleton height={16} />
        <Skeleton height={20} width={112} />
        <Skeleton height={12} />
      </div>
    </div>
  )
}

interface LatestListingsProps {
  /** SSR-resolved Set of listing IDs the current user has favorited. Empty Set for guests. */
  favoriteIds?: ReadonlySet<string>
}

export function LatestListings({ favoriteIds }: LatestListingsProps = {}) {
  const { listings, loading } = useLatestListings()
  const t = useTranslations('listing')
  const { rates } = useExchangeRate()
  const { user } = useAuth()
  const displayCurrency = user?.preferred_currency ?? 'ALL'
  const favSet = favoriteIds ?? new Set<string>()

  if (loading) {
    return (
      <div className="latest-listings grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
      </div>
    )
  }

  if (!listings.length) {
    return (
      <p className="text-center text-muted-foreground py-8">{t('no_listings')}</p>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
      {listings.map((listing, index) => (
        <ListingCard key={listing.id} listing={listing} priority={getImagePriority(index, 'latest')} displayCurrency={displayCurrency} rates={rates} isFavorited={favSet.has(listing.id)} />
      ))}
    </div>
  )
}
