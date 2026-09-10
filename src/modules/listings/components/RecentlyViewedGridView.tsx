'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Group, Text, Title } from '@mantine/core'
import { ListingCard, type CardListingData } from './ListingCard'
import type { ExchangeRates } from '@/lib/getExchangeRate'
import { MantineListingCardTrack } from '@/design-system/mantine/patterns/MantineListingCardTrack'

export interface RecentlyViewedGridViewProps {
  listings: CardListingData[]
  rates: ExchangeRates | null
  displayCurrency: string
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
 * Presentational recently-viewed grid (Task 665 container/View split).
 *
 * Task 807 (D74-4) — the shared canonical `MantineListingCardTrack` in `rail` mode replaces this
 * component's own breakpointed scroll/grid switch. `RecentlyViewedGridView.module.css` is deleted
 * (Task 806/807) — the track owns 100% of the card width contract now.
 *
 * Receives everything via props — no auth, no exchange-rate hook, no DB access, no server
 * actions. `RecentlyViewedGrid` (the container) owns the `useAuth`/`useExchangeRate` hooks
 * and renders this View.
 *
 * Task 792 — off Tailwind onto Mantine. Heading reuses `Title order={2} size="h4"`, the same
 * sizing contract `SimilarListingsView.tsx` reuses from `ListingDetailView.tsx`'s
 * `SimilarListingsSkeleton` for the identical `text-xl font-bold` pair.
 */
export function RecentlyViewedGridView({ listings, rates, displayCurrency, showEmptyState = false, clearSlot }: RecentlyViewedGridViewProps) {
  const t = useTranslations('listing')

  if (!listings.length) {
    if (!showEmptyState) return null
    return (
      <div data-testid="recently-viewed-section" className="recently-viewed">
        <Title order={2} size="h4" mb="md">
          {t('recently_viewed_title')}
        </Title>
        <Text size="sm" c="dimmed">
          {t('recently_viewed_empty')}
        </Text>
      </div>
    )
  }

  return (
    <div data-testid="recently-viewed-section" className="recently-viewed">
      {/* Flat wrap: title + clear button on same row; only wraps left-aligned when title fills the
          row. Same fix family as FilterBar (Task 389 / Task 392). */}
      <Group gap="sm" wrap="wrap" align="center" mb="md">
        <Title order={2} size="h4">
          {t('recently_viewed_title')}
        </Title>
        {clearSlot}
      </Group>

      <MantineListingCardTrack mode="rail">
        {listings.map(listing => (
          <ListingCard key={listing.id} listing={listing} layoutContext="card-track-rail" displayCurrency={displayCurrency} rates={rates} />
        ))}
      </MantineListingCardTrack>
    </div>
  )
}
