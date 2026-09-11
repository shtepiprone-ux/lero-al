'use client'

import { useState, useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { Heart, AlertCircle } from 'lucide-react'
import { Stack, Button } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { MantineListingCardTrack } from '@/design-system/mantine/patterns/MantineListingCardTrack'
import { MantineEmptyLoadingErrorState } from '@/design-system/mantine/patterns/MantineEmptyLoadingErrorState'
import { ListingCard, type CardListingData } from '@/modules/listings/components/ListingCard'
import { FavoritesTypeFilter } from '@/modules/listings/components/FavoritesTypeFilter'
import { ListingsPagination } from '@/modules/listings/components/ListingsPagination'
import { CollectionsSection } from '@/modules/listings/components/CollectionsSection'
import { SaveToCollectionButton } from '@/modules/listings/components/SaveToCollectionButton'
import { useFavoritesRealtime } from '@/modules/listings/hooks/useFavoritesRealtime'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useAuth } from '@/modules/auth/context/AuthContext'
import type { CollectionWithCount } from '@/types/database'

// Task 809 Revision 3 — each of the three MantineEmptyLoadingErrorState actions below states this
// explicitly at its own call site (not inherited from the pattern, which no longer assigns width).
const FULL_BELOW_SM = { base: '100%', sm: 'auto' } as const

interface Props {
  listings: CardListingData[]
  userId: string
  typeFilter?: string
  typeCounts: Record<string, number>
  page: number
  perPage: number
  error?: boolean
  initialCollections: CollectionWithCount[]
}

export function FavoritesShell({ listings: initialListings, userId, typeFilter, typeCounts, page, perPage, error, initialCollections }: Props) {
  const t = useTranslations('favorites')
  const locale = useLocale()
  const { rates } = useExchangeRate()
  const { user } = useAuth()
  const displayCurrency = user?.preferred_currency ?? 'ALL'

  const [displayedListings, setDisplayedListings] = useState<CardListingData[]>(initialListings)

  // Live type counts — initialized from SSR snapshot and updated incrementally as
  // listings are added/removed in this session. This keeps totalFavorites and the
  // filter chip counts correct without requiring a round-trip to the server.
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>(typeCounts)

  // Sync with server-provided state on filter navigation (URL change → SSR re-render).
  useEffect(() => {
    setDisplayedListings(initialListings)
  }, [initialListings])

  useEffect(() => {
    setLiveCounts(typeCounts)
  }, [typeCounts])

  // Tracks the currently displayed listing IDs so the realtime handler can skip
  // DB fetches for listings that are already on screen (dedup optimization).
  //
  // Initialized from the first render's displayedListings; kept in sync via effect.
  // Using useEffect instead of a render-body mutation preserves React render purity
  // and is safe under concurrent rendering — the committed state is always reflected.
  //
  // Declaration order matters: this effect must be registered before useFavoritesRealtime
  // so it fires first on mount, ensuring the ref is populated before events arrive.
  const displayedIdsRef = useRef<ReadonlySet<string>>(new Set(displayedListings.map(l => l.id)))
  useEffect(() => {
    displayedIdsRef.current = new Set(displayedListings.map(l => l.id))
  }, [displayedListings])

  // Realtime cross-tab sync — subscribes to the favorites table for this user.
  // The onEvent callback is kept stable via the ref inside the hook, so changing
  // typeFilter or displayedListings does NOT cause a re-subscription.
  useFavoritesRealtime({
    userId,
    displayedIdsRef,
    onEvent: (event) => {
      if (event.type === 'DELETE') {
        // Use functional prev to get the committed state. If the listing is already
        // absent (handleFavoriteToggled ran first), we skip the liveCounts decrement —
        // preventing the race where both handlers decrement for the same removal.
        setDisplayedListings(prev => {
          const removed = prev.find(l => l.id === event.listingId)
          if (!removed) return prev   // already removed, guard: no double-decrement
          setLiveCounts(c => ({
            ...c,
            [removed.property_type]: Math.max(0, (c[removed.property_type] ?? 0) - 1),
          }))
          return prev.filter(l => l.id !== event.listingId)
        })
      } else if (event.type === 'INSERT') {
        const listing = event.listing
        // liveCounts tracks totals PER TYPE regardless of the active display filter —
        // it must be updated even when the listing doesn't match the current typeFilter.
        // displayedIdsRef is checked by the hook before calling onEvent; this
        // re-check guards against the narrow concurrent-render race window.
        const alreadyDisplayed = displayedIdsRef.current.has(listing.id)
        if (!alreadyDisplayed) {
          setLiveCounts(prev => ({
            ...prev,
            [listing.property_type]: (prev[listing.property_type] ?? 0) + 1,
          }))
        }
        // Respect the current type filter: only add to the displayed list if the
        // listing matches. liveCounts is updated above regardless of this guard.
        if (typeFilter && listing.property_type !== typeFilter) return
        setDisplayedListings(prev => {
          if (prev.some(l => l.id === listing.id)) return prev
          return [listing as CardListingData, ...prev]
        })
      }
    },
  })

  function handleFavoriteToggled(listingId: string, newState: boolean) {
    if (!newState) {
      // Use functional prev to get the committed state. If the realtime DELETE handler
      // already removed the listing, we skip the decrement — no double-decrement race.
      setDisplayedListings(prev => {
        const removed = prev.find(l => l.id === listingId)
        if (!removed) return prev   // already removed, guard: no double-decrement
        setLiveCounts(c => ({
          ...c,
          [removed.property_type]: Math.max(0, (c[removed.property_type] ?? 0) - 1),
        }))
        return prev.filter(l => l.id !== listingId)
      })
    }
  }

  // Derived from liveCounts (not the stale SSR typeCounts) so the full-empty-state
  // branch is correct after in-session unfavorite actions.
  const totalFavorites = Object.values(liveCounts).reduce((a, b) => a + b, 0)

  // Pagination total reflects the active type filter for correct page count.
  const paginationTotal = typeFilter ? (liveCounts[typeFilter] ?? 0) : totalFavorites

  // Error state: fetch failed on the server. "Try again" is a neutral retry, not a destructive or
  // alarming action — neutral secondary chrome (Task 809 Revision 3, owner rejection 2026-09-10;
  // same variant/color convention as SaveSearchButton.tsx's Cancel and MantineDialogDrawerPattern's
  // Cancel, both already `color="gray"` with an outline/default variant in this codebase).
  if (error) {
    return (
      <MantineEmptyLoadingErrorState
        state="error"
        title={t('error_title')}
        description={t('error_desc')}
        icon={<AlertCircle size={theme.other!.iconSize!.decorative} />}
        action={
          <Button component={Link} href={`/${locale}/favorites`} variant="outline" color="gray" w={FULL_BELOW_SM}>
            {t('error_retry')}
          </Button>
        }
      />
    )
  }

  // Full empty state: user has no favorites at all. "Browse listings" is the page's one primary
  // CTA — filled brand (unchanged from before Revision 3).
  if (totalFavorites === 0) {
    return (
      <MantineEmptyLoadingErrorState
        state="empty"
        title={t('empty_title')}
        description={t('empty_desc')}
        icon={<Heart size={theme.other!.iconSize!.decorative} />}
        action={
          <Button component={Link} href={`/${locale}/listings`} color="brand" w={FULL_BELOW_SM}>
            {t('empty_cta')}
          </Button>
        }
      />
    )
  }

  return (
    <Stack gap="xl">
      <CollectionsSection initialCollections={initialCollections} />

      {/* Pass liveCounts so chip counts stay synchronized with displayed listings */}
      <FavoritesTypeFilter typeCounts={liveCounts} currentType={typeFilter} />

      {displayedListings.length === 0 ? (
        // Filtered empty state: user has favorites but none match the selected type. "All" resets
        // the filter — a secondary action, not the page's primary CTA, so it does NOT share the
        // true-empty state's filled-brand chrome despite sharing state="empty" (Task 809 Revision 3,
        // owner rejection 2026-09-10 — this was the exact defect: two different-importance actions
        // rendered identically because the pattern used to key chrome off `state` alone).
        <MantineEmptyLoadingErrorState
          state="empty"
          title={t('empty_filtered_title')}
          description={t('empty_filtered_desc')}
          icon={<Heart size={theme.other!.iconSize!.decorative} />}
          action={
            <Button component={Link} href={`/${locale}/favorites`} variant="outline" color="gray" w={FULL_BELOW_SM}>
              {t('filter_all')}
            </Button>
          }
        />
      ) : (
        <>
          <MantineListingCardTrack mode="grid">
            {displayedListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorited={true}
                onFavoriteToggled={(newState) => handleFavoriteToggled(listing.id, newState)}
                layoutContext="card-track-grid"
                displayCurrency={displayCurrency}
                rates={rates}
                imageActions={<SaveToCollectionButton listingId={listing.id} />}
              />
            ))}
          </MantineListingCardTrack>
          <ListingsPagination
            total={paginationTotal}
            page={page}
            perPage={perPage}
          />
        </>
      )}
    </Stack>
  )
}
