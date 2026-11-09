'use client'

import { useState, useEffect, useCallback } from 'react'
import { useResetOnChange } from '@/hooks/useStateFromProp'
import { RESTORE_KEY, readSavedPosition } from '@/modules/listings/lib/savedListingsPosition'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Stack, Skeleton } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'

// Task 822 — used inside next/dynamic's `loading` fallback, not a component body proper; see
// PopularLocationsView.tsx for the `!` rationale (createTheme()'s own return type is deep-partial, not this
// project's runtime guarantee).
const listingsFiltersSkeletonRowHeight = theme.other!.layout!.listingsFiltersSkeletonRowHeight

// ListingsFilters renders <Input> elements in the desktop sidebar.
// ssr:false ensures those inputs are never in the server HTML.
const ListingsFilters = dynamic(
  () => import('@/modules/listings/components/ListingsFilters').then(m => ({ default: m.ListingsFilters })),
  {
    ssr: false,
    loading: () => (
      <Stack gap="sm" pt="tight">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={listingsFiltersSkeletonRowHeight} radius="lg" />)}
      </Stack>
    ),
  }
)
import { ListingsShellView } from '@/modules/listings/components/ListingsShellView'
import type { CardListingData } from '@/modules/listings/components/ListingCard'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { LISTINGS_PER_PAGE } from '@/modules/listings/constants'

const SaveSearchButton = dynamic(
  () => import('@/modules/listings/components/SaveSearchButton').then(m => m.SaveSearchButton),
  { ssr: false },
)


interface Location {
  id: number
  name_al: string
  type: string
}

interface Props {
  listings: CardListingData[]
  total: number
  page: number
  locations: Location[]
  activeFiltersCount: number
  tab: 'active' | 'closed'
  favoriteIds?: string[]
}

export function ListingsShell({ listings, total, page, locations, activeFiltersCount, tab, favoriteIds }: Props) {
  const searchParams = useSearchParams()
  const { rates } = useExchangeRate()
  const { user } = useAuth()
  // URL param takes precedence; fall back to user's preference, then 'ALL'
  const displayCurrency = searchParams.get('currency') || user?.preferred_currency || 'ALL'
  // Mutable local favorite ID set — initialized from SSR snapshot, updated on every
  // toggle so FavoriteButton never reads a stale isFavorited prop.
  const [localFavoriteIds, setLocalFavoriteIds] = useState<ReadonlySet<string>>(
    () => new Set(favoriteIds ?? [])
  )
  // Re-sync from SSR on filter navigation or router.refresh (new favoriteIds array arrives).
  useResetOnChange(favoriteIds, () => {
    setLocalFavoriteIds(new Set(favoriteIds ?? []))
  })

  const handleFavoriteToggled = useCallback((listingId: string, newState: boolean) => {
    setLocalFavoriteIds(prev => {
      const next = new Set(prev)
      if (newState) next.add(listingId)
      else next.delete(listingId)
      return next
    })
  }, [])

  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [extraListings, setExtraListings] = useState<CardListingData[]>([])
  const [loadedExtraPage, setLoadedExtraPage] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  // The listing to scroll to when the person comes back from it: read from the saved position when this component first renders (nothing on the server).
  const [scrollTargetSlug, setScrollTargetSlug] = useState<string | null>(() => readSavedPosition()?.slug ?? null)

  // Reset appended listings when the filter or pagination URL changes.
  // Keying on the serialized search params (not the listings prop) means
  // router.refresh() calls that arrive with the same URL (e.g. ViewTracker updating
  // views_count) do NOT discard the user's loaded-more state. Only genuine filter or
  // page navigation — which always changes the URL — triggers the reset.
  const searchParamsStr = searchParams.toString()
  useResetOnChange(searchParamsStr, () => {
    setExtraListings([])
    setLoadedExtraPage(0)
  })

  // On mount: restore position from sessionStorage if returning from a listing. The scroll target was read with the state's initializer; here the saved position
  // is consumed (removed) and the extra pages the person had loaded are fetched again.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(RESTORE_KEY)
      if (!raw) return
      const restore = JSON.parse(raw) as { returnUrl: string; slug: string; extraPage: number }
      sessionStorage.removeItem(RESTORE_KEY)

      if (restore.extraPage > 0) {
        ;(async () => {
          const accumulated: CardListingData[] = []
          for (let i = 1; i <= restore.extraPage; i++) {
            const params = new URLSearchParams(searchParams.toString())
            params.set('page', String(page + i))
            const res = await fetch(`/api/listings?${params.toString()}`)
            if (res.ok) {
              const { listings: batch } = await res.json() as { listings: CardListingData[] }
              accumulated.push(...batch)
            }
          }
          setExtraListings(accumulated)
        })()
      }
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to target after DOM updates (runs when slug or extra listings change)
  useEffect(() => {
    if (!scrollTargetSlug) return
    const el = document.querySelector<HTMLElement>(`[data-listing-slug="${scrollTargetSlug}"]`)
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setScrollTargetSlug(null)
    })
  }, [scrollTargetSlug, extraListings])

  function handleBeforeNavigate(slug: string) {
    try {
      sessionStorage.setItem(RESTORE_KEY, JSON.stringify({
        returnUrl: window.location.href,
        slug,
        extraPage: loadedExtraPage,
      }))
    } catch {}
  }

  async function handleShowMore() {
    if (isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const nextPage = page + loadedExtraPage + 1
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', String(nextPage))
      const res = await fetch(`/api/listings?${params.toString()}`)
      if (res.ok) {
        const { listings: batch } = await res.json() as { listings: CardListingData[] }
        setExtraListings(prev => [...prev, ...batch])
        setLoadedExtraPage(prev => prev + 1)
      }
    } catch {
    } finally {
      setIsLoadingMore(false)
    }
  }

  const allListings = [...listings, ...extraListings]
  const showLoadMore = allListings.length < total

  return (
    <ListingsShellView
      listings={allListings}
      total={total}
      page={page}
      perPage={LISTINGS_PER_PAGE}
      locations={locations}
      tab={tab}
      activeFiltersCount={activeFiltersCount}
      displayCurrency={displayCurrency}
      rates={rates}
      favoriteIds={localFavoriteIds}
      view={view}
      filtersOpen={filtersOpen}
      isLoadingMore={isLoadingMore}
      showLoadMore={showLoadMore}
      onViewChange={setView}
      onFiltersOpenChange={setFiltersOpen}
      onFiltersOpen={() => setFiltersOpen(true)}
      onShowMore={handleShowMore}
      onBeforeNavigate={handleBeforeNavigate}
      onFavoriteToggled={handleFavoriteToggled}
      filtersSlot={<ListingsFilters locations={locations} onClose={() => setFiltersOpen(false)} />}
      saveSearchSlot={user ? <SaveSearchButton /> : null}
    />
  )
}
