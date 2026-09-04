'use client'

import { useTranslations } from 'next-intl'
import { Skeleton, Box, Text, SimpleGrid, AspectRatio, useMantineTheme } from '@mantine/core'
import { ListingCard, type CardListingData } from '@/modules/listings/components/ListingCard'
import { getImagePriority } from '@/lib/imageDelivery'
import type { ExchangeRates } from '@/lib/getExchangeRate'
import styles from './LatestListingsView.module.css'

/** Skeleton row chrome for the loading grid — owned by the View (Task 665 container/View
 * split; moved out of LatestListings.tsx so the View never imports its container).
 * Task 784 Revision 3 (D69-18): full geometry restored via theme.other.listingSkeleton.latest —
 * see FeaturedListingsView.tsx's `CardSkeleton` comment for the shared rationale/provenance. */
function RowSkeleton() {
  const theme = useMantineTheme()
  const { latest } = theme.other.listingSkeleton
  return (
    <Box className={styles.skeletonRow}>
      <AspectRatio ratio={theme.other.listingSkeleton.mediaRatio}>
        <Skeleton />
      </AspectRatio>
      <Box className={styles.skeletonBody}>
        <Skeleton height={latest.lineHeights[0]} width={latest.firstLineWidth} />
        <Skeleton height={latest.lineHeights[1]} />
        <Skeleton height={latest.lineHeights[2]} width={latest.thirdLineWidth} />
        <Skeleton height={latest.lineHeights[3]} />
      </Box>
    </Box>
  )
}

export interface LatestListingsViewProps {
  listings: CardListingData[]
  loading: boolean
  rates: ExchangeRates | null
  displayCurrency: string
  favoriteIds: ReadonlySet<string>
}

/**
 * Presentational latest-listings grid (Task 665). Receives everything via props — no
 * data-fetching hooks, no auth, no exchange-rate hook. `LatestListings` (the container)
 * owns those and renders this View.
 */
export function LatestListingsView({ listings, loading, rates, displayCurrency, favoriteIds }: LatestListingsViewProps) {
  const t = useTranslations('listing')

  if (loading) {
    return (
      <SimpleGrid cols={{ base: 1, md: 2, xxl: 3 }} spacing="sm" className="latest-listings">
        {Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
      </SimpleGrid>
    )
  }

  if (!listings.length) {
    return (
      <Text ta="center" c="var(--muted-foreground)" py="2xl">{t('no_listings')}</Text>
    )
  }

  return (
    <SimpleGrid cols={{ base: 1, md: 2, xxl: 3 }} spacing="sm">
      {listings.map((listing, index) => (
        <ListingCard key={listing.id} listing={listing} priority={getImagePriority(index, 'latest')} displayCurrency={displayCurrency} rates={rates} isFavorited={favoriteIds.has(listing.id)} />
      ))}
    </SimpleGrid>
  )
}
