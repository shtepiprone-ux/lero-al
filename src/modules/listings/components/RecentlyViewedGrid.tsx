'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { ListingCard, type CardListingData } from './ListingCard'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useAuth } from '@/modules/auth/context/AuthContext'

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
 * Presentational recently-viewed grid.
 *
 * Mobile (base): horizontal scroll, fixed-width cards (w-48).
 * sm+: responsive CSS grid (2 → 3 → 4 columns).
 *
 * No auth, no DB access, no server actions — purely a layout component.
 * Data is provided by the parent Server Component (RecentlyViewedSection).
 */
export function RecentlyViewedGrid({ listings, showEmptyState = false, clearSlot }: Props) {
  const t = useTranslations('listing')
  const { rates } = useExchangeRate()
  const { user } = useAuth()
  const displayCurrency = user?.preferred_currency ?? 'ALL'

  if (!listings.length) {
    if (!showEmptyState) return null
    return (
      <div className="recently-viewed">
        <h2 className="text-xl font-bold mb-4">{t('recently_viewed_title')}</h2>
        <p className="text-sm text-muted-foreground">{t('recently_viewed_empty')}</p>
      </div>
    )
  }

  return (
    <div className="recently-viewed">
      {/* <640: stack title above action (max-sm:flex-col), each full-width — prevents
          the "Pastro historikun" button from cramping the title to 4 lines (Task 382).
          ≥640: horizontal justify-between layout unchanged. */}
      <div className="flex items-center justify-between mb-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
        <h2 className="text-xl font-bold">{t('recently_viewed_title')}</h2>
        {clearSlot}
      </div>

      {/*
        Mobile: horizontal flex scroll (w-48 fixed cards, no-scrollbar).
        sm+: grid overrides flex display; cards fill column width.
      */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 md:grid-cols-3 lg:grid-cols-4">
        {listings.map(listing => (
          <div key={listing.id} className="w-48 shrink-0 sm:w-auto sm:shrink">
            <ListingCard listing={listing} layoutContext="4-col" displayCurrency={displayCurrency} rates={rates} />
          </div>
        ))}
      </div>
    </div>
  )
}
