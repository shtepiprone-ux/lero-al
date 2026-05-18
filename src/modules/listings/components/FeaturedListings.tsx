'use client'

import { useTranslations } from 'next-intl'
import { useFeaturedListings } from '@/modules/listings/hooks/useListings'
import { ListingCard } from '@/modules/listings/components/ListingCard'
import { Skeleton } from '@/components/ui/skeleton'
import { getImagePriority } from '@/lib/imageDelivery'

function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  )
}

export function FeaturedListings() {
  const { listings, loading } = useFeaturedListings()
  const t = useTranslations('listing')

  if (loading) {
    return (
      <div className="featured-listings grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    )
  }

  if (!listings.length) {
    return (
      <p className="text-center text-muted-foreground py-8">{t('no_listings')}</p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
      {listings.map((listing, index) => (
        <ListingCard key={listing.id} listing={listing} priority={getImagePriority(index, 'featured')} />
      ))}
    </div>
  )
}
