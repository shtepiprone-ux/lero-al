'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { useFeaturedListings } from '@/modules/listings/hooks/useListings'
import { ListingCard } from '@/modules/listings/components/ListingCard'
import { Skeleton } from '@/components/ui/skeleton'
import { getImagePriority } from '@/lib/imageDelivery'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  const locale = useLocale()

  const header = (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold">{t('featured')}</h2>
      {!loading && listings.length > 0 && (
        <Link
          href={`/${locale}/listings?is_premium=true`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
        >
          {t('view_all')}
        </Link>
      )}
    </div>
  )

  if (loading) {
    return (
      <>
        {header}
        <div className="featured-listings grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </>
    )
  }

  if (!listings.length) {
    return (
      <>
        {header}
        <p className="text-center text-muted-foreground py-8">{t('no_premium_listings')}</p>
      </>
    )
  }

  return (
    <>
      {header}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
        {listings.map((listing, index) => (
          <ListingCard key={listing.id} listing={listing} priority={getImagePriority(index, 'featured')} />
        ))}
      </div>
    </>
  )
}
