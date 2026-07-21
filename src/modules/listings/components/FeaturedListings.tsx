'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Skeleton, Title } from '@mantine/core'
import { useFeaturedListings } from '@/modules/listings/hooks/useListings'
import { ListingCard } from '@/modules/listings/components/ListingCard'
import { getImagePriority } from '@/lib/imageDelivery'
import { ViewAllLink } from '@/components/shared/ViewAllLink'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useAuth } from '@/modules/auth/context/AuthContext'

function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Skeleton style={{ aspectRatio: '4 / 3' }} />
      <div className="p-3 space-y-2">
        <Skeleton height={12} width={80} />
        <Skeleton height={16} />
        <Skeleton height={16} width="75%" />
        <Skeleton height={20} width={128} />
        <Skeleton height={12} />
      </div>
    </div>
  )
}

interface FeaturedListingsProps {
  /** SSR-resolved Set of listing IDs the current user has favorited. Empty Set for guests. */
  favoriteIds?: ReadonlySet<string>
}

export function FeaturedListings({ favoriteIds }: FeaturedListingsProps = {}) {
  const { listings, loading } = useFeaturedListings()
  const t = useTranslations('listing')
  const locale = useLocale()
  const { rates } = useExchangeRate()
  const { user } = useAuth()
  const displayCurrency = user?.preferred_currency ?? 'ALL'
  const favSet = favoriteIds ?? new Set<string>()

  const header = (
    <div className="flex items-center justify-between mb-6">
      <Title order={2} fw={700} fz={{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }}>{t('featured')}</Title>
      {!loading && listings.length > 0 && (
        <ViewAllLink href={`/${locale}/listings?premium=true`} label={t('view_all')} />
      )}
    </div>
  )

  if (loading) {
    return (
      <>
        {header}
        <div className="featured-listings grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {listings.map((listing, index) => (
          <ListingCard key={listing.id} listing={listing} priority={getImagePriority(index, 'featured')} displayCurrency={displayCurrency} rates={rates} isFavorited={favSet.has(listing.id)} />
        ))}
      </div>
    </>
  )
}
