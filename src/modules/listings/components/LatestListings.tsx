'use client'

import { useLatestListings } from '@/modules/listings/hooks/useListings'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { LatestListingsView } from './LatestListingsView'

interface LatestListingsProps {
  /** SSR-resolved Set of listing IDs the current user has favorited. Empty Set for guests. */
  favoriteIds?: ReadonlySet<string>
}

export function LatestListings({ favoriteIds }: LatestListingsProps = {}) {
  const { listings, loading } = useLatestListings()
  const { rates } = useExchangeRate()
  const { user } = useAuth()
  const displayCurrency = user?.preferred_currency ?? 'ALL'
  const favSet = favoriteIds ?? new Set<string>()

  return (
    <LatestListingsView
      listings={listings}
      loading={loading}
      rates={rates}
      displayCurrency={displayCurrency}
      favoriteIds={favSet}
    />
  )
}
