'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// ListingsFilters renders <Input> elements in the desktop sidebar.
// ssr:false ensures those inputs are never in the server HTML.
const ListingsFilters = dynamic(
  () => import('@/modules/listings/components/ListingsFilters').then(m => ({ default: m.ListingsFilters })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-3 pt-1">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 rounded-xl w-full" />)}
      </div>
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

const RESTORE_KEY = 'listings_restore'

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
  useEffect(() => {
    setLocalFavoriteIds(new Set(favoriteIds ?? []))
  }, [favoriteIds])

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
  const [scrollTargetSlug, setScrollTargetSlug] = useState<string | null>(null)

  // Reset appended listings when the filter or pagination URL changes.
  // Keying on the serialized search params (not the listings prop) means
  // router.refresh() calls that arrive with the same URL (e.g. ViewTracker updating
  // views_count) do NOT discard the user's loaded-more state. Only genuine filter or
  // page navigation — which always changes the URL — triggers the reset.
  const searchParamsStr = searchParams.toString()
  useEffect(() => {
    setExtraListings([])
    setLoadedExtraPage(0)
  }, [searchParamsStr])

  // On mount: restore position from sessionStorage if returning from a listing
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(RESTORE_KEY)
      if (!raw) return
      const restore = JSON.parse(raw) as { returnUrl: string; slug: string; extraPage: number }
      sessionStorage.removeItem(RESTORE_KEY)
      setScrollTargetSlug(restore.slug)

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
