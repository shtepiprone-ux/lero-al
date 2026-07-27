'use client'

import type { ReactNode } from 'react'
import type { CardListingData } from './ListingCard'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { RecentlyViewedGridView } from './RecentlyViewedGridView'

interface Props {
  listings: CardListingData[]
  /** Show the empty-state message when no items (profile context). */
  showEmptyState?: boolean
  /**
   * Optional clear-history slot. Pass <ClearRecentlyViewedButton /> from the
   * parent Server Component so this presentational component stays free of
   * server-action imports (enabling Storybook coverage).
   */
  clearSlot?: ReactNode
}

/**
 * Recently-viewed grid container (Task 665 container/View split).
 *
 * Owns the auth/exchange-rate hooks; data is provided by the parent Server Component
 * (RecentlyViewedSection). Renders RecentlyViewedGridView with the computed props.
 */
export function RecentlyViewedGrid({ listings, showEmptyState = false, clearSlot }: Props) {
  const { rates } = useExchangeRate()
  const { user } = useAuth()
  const displayCurrency = user?.preferred_currency ?? 'ALL'

  return (
    <RecentlyViewedGridView
      listings={listings}
      rates={rates}
      displayCurrency={displayCurrency}
      showEmptyState={showEmptyState}
      clearSlot={clearSlot}
    />
  )
}
