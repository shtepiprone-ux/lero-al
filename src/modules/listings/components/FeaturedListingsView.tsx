'use client'

import { useTranslations } from 'next-intl'
import { Skeleton, Title, Box, Text, SimpleGrid, Group } from '@mantine/core'
import { ListingCard, type CardListingData } from '@/modules/listings/components/ListingCard'
import { getImagePriority } from '@/lib/imageDelivery'
import { ViewAllLink } from '@/components/shared/ViewAllLink'
import type { ExchangeRates } from '@/lib/getExchangeRate'

/** Skeleton card chrome for the loading grid — owned by the View (Task 665 container/View
 * split; moved out of FeaturedListings.tsx so the View never imports its container). */
function CardSkeleton() {
  return (
    <Box className="rounded-xl border bg-card overflow-hidden">
      <Skeleton style={{ aspectRatio: '4 / 3' }} />
      <Box className="p-3 space-y-2">
        <Skeleton height={12} width={80} />
        <Skeleton height={16} />
        <Skeleton height={16} width="75%" />
        <Skeleton height={20} width={128} />
        <Skeleton height={12} />
      </Box>
    </Box>
  )
}

export interface FeaturedListingsViewProps {
  listings: CardListingData[]
  loading: boolean
  rates: ExchangeRates | null
  displayCurrency: string
  favoriteIds: ReadonlySet<string>
  locale: string
}

/**
 * Presentational featured-listings grid (Task 665). Receives everything via props — no
 * data-fetching hooks, no auth, no exchange-rate hook. `FeaturedListings` (the container)
 * owns those and renders this View.
 */
export function FeaturedListingsView({ listings, loading, rates, displayCurrency, favoriteIds, locale }: FeaturedListingsViewProps) {
  const t = useTranslations('listing')

  const header = (
    <Group justify="space-between" align="center" wrap="nowrap" mb="xl">
      <Title order={2} fw={700} fz={{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }}>{t('featured')}</Title>
      {!loading && listings.length > 0 && (
        <ViewAllLink href={`/${locale}/listings?premium=true`} label={t('view_all')} />
      )}
    </Group>
  )

  if (loading) {
    return (
      <>
        {header}
        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3, xxl: 4 }} spacing="md" className="featured-listings">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </SimpleGrid>
      </>
    )
  }

  if (!listings.length) {
    return (
      <>
        {header}
        <Text ta="center" c="var(--muted-foreground)" py="2rem">{t('no_premium_listings')}</Text>
      </>
    )
  }

  return (
    <>
      {header}
      <SimpleGrid cols={{ base: 1, sm: 2, xl: 3, xxl: 4 }} spacing="md">
        {listings.map((listing, index) => (
          <ListingCard key={listing.id} listing={listing} priority={getImagePriority(index, 'featured')} displayCurrency={displayCurrency} rates={rates} isFavorited={favoriteIds.has(listing.id)} />
        ))}
      </SimpleGrid>
    </>
  )
}
