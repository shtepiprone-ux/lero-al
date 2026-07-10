'use client'

import { useTranslations } from 'next-intl'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@mantine/core'
import { MantineCountButton } from '@/design-system/mantine/patterns'
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
          {/* Task 572: flattened into ONE flex-wrap container (no more separate action-buttons
              <div> grouping filters+Search) so each control's own flex-basis decides its row
              placement per breakpoint. <640 and >=768 render byte-identical to before; the NEW
              640-767 (`sm`) band wraps Search alone to a second row so Location regains width
              (was crushed illegible at ~720px — owner-reported). See "Why these exact classes" in
              the Task 572 kickoff — do NOT swap any basis/grow/shrink utility for the `flex-1`
              shorthand, it fights the sm:/md: flex-basis overrides. */}
          <div className="flex flex-wrap md:flex-nowrap gap-2">

            <PropertyTypeCombobox
              value={propertyType}
              onChange={onPropertyTypeChange}
              className="basis-full sm:basis-auto sm:w-48 shrink-0"
            />

            <LocationCombobox
              locations={locations}
              value={locationId ?? ''}
              onChange={onLocationChange}
              onKeyDown={onLocationKeyDown}
              placeholder={th('hero_placeholder_location')}
              className="basis-full sm:basis-0 grow min-w-0"
            />

            {/* Task 571: canonical MantineCountButton — owns both the label-collapse (icon-only
                <860px, so the location combobox stops losing width to the full label) and the
                active-count badge (inline rightSection pill, same look as the CountButton story's
                filled+count example). Replaces the round-1 raw Button + absolute corner <span>
                badge + relative wrapper entirely — no more Button overflow:hidden clipping risk.
                Task 572: `shrink-0` keeps it content-width and on row 1 in every band. */}
            <MantineCountButton
              variant="default"
              count={activeFiltersCount}
              iconOnlyBelow={860}
              onClick={onOpenFilters}
              aria-label={t('advanced_filters')}
              leftSection={<SlidersHorizontal className="h-4 w-4" />}
              className="shrink-0"
            >
              {t('advanced_filters')}
            </MantineCountButton>

            <Button
              variant="filled"
              onClick={() => onSearch()}
              className="px-6 font-semibold grow shrink basis-0 sm:basis-full md:grow-0 md:basis-auto"
              leftSection={<Search className="h-4 w-4" />}
            >
              {t('search')}
            </Button>
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
