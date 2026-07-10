'use client'

import { useTranslations } from 'next-intl'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@mantine/core'
import { cn } from '@/lib/utils'
import { FiltersPanel } from '@/components/shared/FiltersPanel'
import type { FilterValues } from '@/modules/listings/domain/filterEngine'
import { LocationCombobox, type LocationOption } from '@/components/shared/LocationCombobox'
import { PropertyTypeCombobox } from '@/components/shared/PropertyTypeCombobox'
import type { ListingType } from '@/types/database'

interface HeroSearchViewProps {
  locations: LocationOption[]
  listingType: ListingType
  onListingTypeChange: (type: ListingType) => void
  propertyType: string
  onPropertyTypeChange: (value: string) => void
  locationId: string | null
  onLocationChange: (id: string | null) => void
  filters: FilterValues
  onFiltersChange: (values: FilterValues) => void
  activeFiltersCount: number
  filtersOpen: boolean
  onOpenFilters: () => void
  onCloseFilters: () => void
  onSearch: (override?: FilterValues) => void
  onLocationKeyDown: (e: React.KeyboardEvent) => void
}

// Task 568 item 0: pure presentational view — no hooks, no data fetching. Everything arrives
// via props so it stories/tests without mocking `useLocations`/`useRouter` (FiltersPanel precedent).
export function HeroSearchView({
  locations,
  listingType, onListingTypeChange,
  propertyType, onPropertyTypeChange,
  locationId, onLocationChange,
  filters, onFiltersChange,
  activeFiltersCount,
  filtersOpen, onOpenFilters, onCloseFilters,
  onSearch, onLocationKeyDown,
}: HeroSearchViewProps) {
  const t = useTranslations('common')
  const tl = useTranslations('listing')
  const th = useTranslations('home')

  return (
    <>
      <div className="hero-search w-full max-w-3xl mx-auto">
        {/* Listing type tabs — Task 570 max-sm:flex-1 max-sm:min-w-0 (50/50 full-width, no
            overflow) preserved; Task 568 adds joined-inner-corner radius (each corner declared
            explicitly, never the bare `rounded-*` shorthand — Mantine's own radius CSS var wins
            ties on the shorthand property, so only per-corner longhand utilities are safe here). */}
        <div className="flex mb-0">
          {(['sale', 'rent'] as ListingType[]).map((type, i) => (
            <Button
              key={type}
              type="button"
              unstyled
              onClick={() => onListingTypeChange(type)}
              className={cn(
                'px-6 py-2.5 text-sm font-medium border border-b-0 rounded-b-none max-sm:flex-1 max-sm:min-w-0',
                i === 0 ? 'rounded-tl-xl rounded-tr-none' : 'rounded-tr-xl rounded-tl-none',
                listingType === type
                  ? 'bg-background text-foreground border-border hover:bg-background'
                  : 'bg-primary-foreground/15 text-primary-foreground/80 hover:text-primary-foreground border-transparent hover:bg-primary-foreground/25'
              )}
            >
              {tl(type)}
            </Button>
          ))}
        </div>

        {/* Search bar — top corners squared on mobile (full-width tab strip now covers the
            entire top edge, incl. top-right); desktop keeps its original rounded-tr-2xl since
            the tabs stay content-width chips at top-left there (owner-confirmed, unchanged). */}
        <div className="bg-background rounded-b-2xl sm:rounded-tr-2xl border shadow-xl p-3">
          <div className="flex flex-col sm:flex-row gap-2">

            <PropertyTypeCombobox
              value={propertyType}
              onChange={onPropertyTypeChange}
            />

            <LocationCombobox
              locations={locations}
              value={locationId ?? ''}
              onChange={onLocationChange}
              onKeyDown={onLocationKeyDown}
              placeholder={th('hero_placeholder_location')}
              className="flex-1"
            />

            {/* Action buttons */}
            <div className="flex gap-2">
              {/* Mantine `Button`'s own root has `overflow:hidden` (ripple/rounded-corner
                  clipping) — an absolute corner badge as a DIRECT child gets cut off at the
                  button edge (verified via rendered screenshot; same root cause Task 567 hit
                  and fixed for its OWN Apply badge). The badge markup itself is unchanged
                  (preserved verbatim per the kickoff) — only its DOM position moves to a
                  sibling of the Button, inside a `relative` wrapper, so it overlaps the corner
                  without being clipped by the Button's internal box. */}
              <div className="relative max-sm:w-auto">
                <Button
                  variant={activeFiltersCount > 0 ? 'filled' : 'default'}
                  className="px-3 w-full"
                  onClick={onOpenFilters}
                  aria-label={t('advanced_filters')}
                  leftSection={<SlidersHorizontal className="h-4 w-4" />}
                >
                  <span className="hidden sm:inline">{t('advanced_filters')}</span>
                </Button>
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-2xs flex items-center justify-center font-bold pointer-events-none">
                    {activeFiltersCount}
                  </span>
                )}
              </div>

              <Button
                variant="filled"
                onClick={() => onSearch()}
                className="px-6 font-semibold flex-1"
                leftSection={<Search className="h-4 w-4" />}
              >
                {t('search')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <FiltersPanel
        open={filtersOpen}
        onClose={onCloseFilters}
        values={filters}
        onChange={onFiltersChange}
        onApply={onSearch}
        locations={locations}
      />
    </>
  )
}
