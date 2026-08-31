'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ListingsSortBar } from '@/modules/listings/components/ListingsSortBar'
import { ListingsPagination } from '@/modules/listings/components/ListingsPagination'
import { ListingCard, type CardListingData } from '@/modules/listings/components/ListingCard'
import { ActiveFilterChips } from '@/modules/listings/components/ActiveFilterChips'
import { ListingsStatusTabs } from '@/modules/listings/components/ListingsStatusTabs'
import { ListingsFilterBar } from '@/modules/listings/components/ListingsFilterBar'
import type { ExchangeRates } from '@/lib/getExchangeRate'

interface Location {
  id: number
  name_al: string
  type: string
}

export interface ListingsShellViewProps {
  listings: CardListingData[]
  total: number
  page: number
  perPage: number
  locations: Location[]
  tab: 'active' | 'closed'
  activeFiltersCount: number
  displayCurrency: string
  rates: ExchangeRates | null
  favoriteIds: ReadonlySet<string>
  view: 'grid' | 'list'
  filtersOpen: boolean
  isLoadingMore: boolean
  showLoadMore: boolean
  onViewChange: (view: 'grid' | 'list') => void
  onFiltersOpenChange: (open: boolean) => void
  onFiltersOpen: () => void
  onShowMore: () => void
  onBeforeNavigate: (slug: string) => void
  onFavoriteToggled: (listingId: string, newState: boolean) => void
  filtersSlot: ReactNode
  saveSearchSlot: ReactNode
}

export function ListingsShellView({
  listings,
  total,
  page,
  perPage,
  locations,
  tab,
  activeFiltersCount,
  displayCurrency,
  rates,
  favoriteIds,
  view,
  filtersOpen,
  isLoadingMore,
  showLoadMore,
  onViewChange,
  onFiltersOpenChange,
  onFiltersOpen,
  onShowMore,
  onBeforeNavigate,
  onFavoriteToggled,
  filtersSlot,
  saveSearchSlot,
}: ListingsShellViewProps) {
  const t = useTranslations('listing')

  return (
    <div className="listings-shell flex flex-col gap-0">
      {/* ── Horizontal filter bar (md+); hidden on mobile ── */}
      <ListingsFilterBar
        locations={locations}
        onFiltersOpen={onFiltersOpen}
      />

      {/* ── Filters Sheet (full panel — mobile + "More filters" on desktop) ── */}
      <Sheet open={filtersOpen} onOpenChange={onFiltersOpenChange}>
        <SheetContent side="left" showCloseButton={false} className="w-80 max-w-[90vw] overflow-y-auto p-5">
          {filtersSlot}
        </SheetContent>
      </Sheet>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-0 mt-4">
        <ListingsStatusTabs />
        <ActiveFilterChips locations={locations} />
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <ListingsSortBar
              total={total}
              page={page}
              perPage={perPage}
              view={view}
              onViewChange={onViewChange}
              onFiltersOpen={onFiltersOpen}
              activeFiltersCount={activeFiltersCount}
            />
          </div>
          {saveSearchSlot}
        </div>

        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <span className="text-2xl">🏠</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {tab === 'closed' ? t('no_results_closed') : t('no_results_title')}
              </h3>
              {tab === 'active' && (
                <p className="text-muted-foreground text-sm mt-1">{t('no_results_desc')}</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className={
              view === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 pt-5'
                : 'flex flex-col gap-3 pt-5'
            }>
              {listings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  variant={view === 'list' ? 'horizontal' : 'vertical'}
                  onBeforeNavigate={onBeforeNavigate}
                  displayCurrency={displayCurrency}
                  rates={rates}
                  isFavorited={favoriteIds.has(listing.id)}
                  onFavoriteToggled={(newState) => onFavoriteToggled(listing.id, newState)}
                  layoutContext={view === 'grid' ? 'sidebar' : undefined}
                />
              ))}
            </div>

            {showLoadMore && (
              <div className="flex justify-center pt-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onShowMore}
                  disabled={isLoadingMore}
                  className="min-w-48 rounded-xl"
                >
                  {isLoadingMore && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {t('show_more')}
                </Button>
              </div>
            )}

            <ListingsPagination
              total={total}
              page={page}
              perPage={perPage}
            />
          </>
        )}
      </div>
    </div>
  )
}
