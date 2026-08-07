'use client'

import { useTranslations } from 'next-intl'
import { Skeleton, Title, Box, Text, SimpleGrid, Group } from '@mantine/core'
import { ListingCard, type CardListingData } from '@/modules/listings/components/ListingCard'
import { getImagePriority } from '@/lib/imageDelivery'
import { ViewAllLink } from '@/components/shared/ViewAllLink'
import type { ExchangeRates } from '@/lib/getExchangeRate'
import { SECTION_HEADING_FZ } from '@/design-system/mantine/typography'
import styles from './FeaturedListingsView.module.css'

/** Skeleton card chrome for the loading grid — owned by the View (Task 665 container/View
 * split; moved out of FeaturedListings.tsx so the View never imports its container). */
function CardSkeleton() {
  return (
    <Box className={styles.skeletonCard}>
      <Skeleton style={{ aspectRatio: '4 / 3' }} />
      <Box className={styles.skeletonBody}>
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
    <Group
      justify="space-between"
      wrap="nowrap"
      mb="xl"
      style={{ flexDirection: 'column', alignItems: 'flex-start' }}
      styles={{ root: { '@media (min-width: 40em)': { flexDirection: 'row', alignItems: 'center' } } }}
    >
      <Title order={2} fw={700} fz={SECTION_HEADING_FZ}>{t('featured')}</Title>
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
