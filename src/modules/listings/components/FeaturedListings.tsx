'use client'

import { useLocale } from 'next-intl'
import { useFeaturedListings } from '@/modules/listings/hooks/useListings'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { FeaturedListingsView } from './FeaturedListingsView'

interface FeaturedListingsProps {
  /** SSR-resolved Set of listing IDs the current user has favorited. Empty Set for guests. */
  favoriteIds?: ReadonlySet<string>
}

export function FeaturedListings({ favoriteIds }: FeaturedListingsProps = {}) {
  const { listings, loading } = useFeaturedListings()
  const locale = useLocale()
  const { rates } = useExchangeRate()
  const { user } = useAuth()
  const displayCurrency = user?.preferred_currency ?? 'ALL'
  const favSet = favoriteIds ?? new Set<string>()

  return (
    <FeaturedListingsView
      listings={listings}
      loading={loading}
      rates={rates}
      displayCurrency={displayCurrency}
      favoriteIds={favSet}
      locale={locale}
    />
  )
}
