'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLocations } from '@/modules/locations/hooks/useLocations'
import { FiltersPanel, type FilterValues } from '@/components/shared/FiltersPanel'
import { LocationCombobox } from '@/components/shared/LocationCombobox'
import { PropertyTypeCombobox } from '@/components/shared/PropertyTypeCombobox'
import type { ListingType } from '@/types/database'

export function HeroSearch() {
  const t = useTranslations('common')
  const tl = useTranslations('listing')
  const th = useTranslations('home')
  const locale = useLocale()

  const { locations } = useLocations()

  const [listingType, setListingType] = useState<ListingType>('sale')
  const [propertyType, setPropertyType] = useState<string>('')
  const [locationId, setLocationId] = useState<string>('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({})

  const activeFiltersCount = Object.entries(filters).filter(([, v]) => {
    if (Array.isArray(v)) return v.length > 0
    return v !== undefined && v !== ''
  }).length

  function handleSearch(filterOverride?: FilterValues) {
    const f = filterOverride ?? filters
    const params = new URLSearchParams()
    params.set('type', listingType)

    const pt = propertyType || f.property_type || ''
    const lid = locationId || f.location_id || ''
    if (pt) params.set('property_type', pt)
    if (lid) params.set('location_id', lid)

    if (f.price_min) params.set('price_min', String(f.price_min))
    if (f.price_max) params.set('price_max', String(f.price_max))
    if (f.area_min) params.set('area_min', String(f.area_min))
    if (f.area_max) params.set('area_max', String(f.area_max))
    if (f.rooms?.length) params.set('rooms', f.rooms.join(','))
    if (f.floor_min) params.set('floor_min', String(f.floor_min))
    if (f.floor_max) params.set('floor_max', String(f.floor_max))
    if (f.floors_total_min) params.set('floors_total_min', String(f.floors_total_min))
    if (f.floors_total_max) params.set('floors_total_max', String(f.floors_total_max))
    if (f.currency && f.currency !== 'ALL') params.set('currency', f.currency)
    if (f.condition) params.set('condition', f.condition)
    if (f.heating) params.set('heating', f.heating)
    if (f.wall_type) params.set('wall_type', f.wall_type)
    if (f.year_built_min) params.set('year_built_min', String(f.year_built_min))
    if (f.year_built_max) params.set('year_built_max', String(f.year_built_max))
    if (f.market_type) params.set('market_type', f.market_type)
    if (f.layout_features?.length) params.set('layout_features', f.layout_features.join(','))
    if (f.offer_type) params.set('offer_type', f.offer_type)
    if (f.purchase_conditions?.length) params.set('purchase_conditions', f.purchase_conditions.join(','))
    if (f.date_from) params.set('date_from', f.date_from)
    if (f.date_to) params.set('date_to', f.date_to)
    if (f.listing_id) params.set('listing_id', f.listing_id)

    window.location.href = `/${locale}/listings?${params.toString()}`
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <>
      <div className="hero-search w-full max-w-3xl mx-auto">
        {/* Listing type tabs */}
        <div className="flex mb-0">
          {(['sale', 'rent'] as ListingType[]).map(type => (
            <Button
              key={type}
              variant="ghost"
              onClick={() => setListingType(type)}
              className={cn(
                'px-6 py-2.5 h-auto text-sm font-medium rounded-t-xl rounded-b-none border border-b-0',
                listingType === type
                  ? 'bg-background text-foreground border-border hover:bg-background'
                  : 'bg-primary-foreground/15 text-primary-foreground/80 hover:text-primary-foreground border-transparent hover:bg-primary-foreground/25'
              )}
            >
              {tl(type)}
            </Button>
          ))}
        </div>

        {/* Search bar */}
        <div className="bg-background rounded-b-2xl rounded-tr-2xl border shadow-xl p-3">
          <div className="flex flex-col sm:flex-row gap-2">

            <PropertyTypeCombobox
              value={propertyType}
              onChange={setPropertyType}
              onKeyDown={handleKeyDown}
            />

            <LocationCombobox
              locations={locations}
              value={locationId}
              onChange={id => setLocationId(id ?? '')}
              onKeyDown={handleKeyDown}
              placeholder={th('hero_placeholder_location')}
              className="flex-1"
            />

            {/* Action buttons */}
            <div className="flex gap-2 shrink-0">
              <Button
                variant={activeFiltersCount > 0 ? 'default' : 'outline'}
                className="h-11 px-3 gap-2 relative"
                onClick={() => setFiltersOpen(true)}
                aria-label={t('advanced_filters')}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">{t('advanced_filters')}</span>
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>

              <Button
                onClick={() => handleSearch()}
                className="h-11 px-6 gap-2 font-semibold"
              >
                <Search className="h-4 w-4" />
                <span>{t('search')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <FiltersPanel
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        values={filters}
        onChange={setFilters}
        onApply={handleSearch}
        locations={locations}
      />
    </>
  )
}
