'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useLocations } from '@/modules/locations/hooks/useLocations'
import { countActiveFilterValues } from '@/modules/listings/domain/filterEngine'
import type { FilterValues } from '@/modules/listings/domain/filterEngine'
import type { ListingType } from '@/types/database'
import { HeroSearchView } from '@/components/shared/HeroSearchView'

// Task 568 item 0: thin container — owns hooks/state/URL-building; all JSX + the migrated
// Mantine Buttons live in the prop-driven `HeroSearchView` presentational component.
export function HeroSearch() {
  const locale = useLocale()
  const router = useRouter()

  const { locations } = useLocations()

  // Canonical filter: city and region only — consistent with FiltersPanel's cityRegionLocs.
  const cityRegionLocs = useMemo(
    () => locations.filter(l => l.type === 'city' || l.type === 'region'),
    [locations]
  )

  const [listingType, setListingType] = useState<ListingType>('sale')
  const [propertyType, setPropertyType] = useState<string>('')
  const [locationId, setLocationId] = useState<string>('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({})

  const activeFiltersCount = countActiveFilterValues(filters)

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
    if (f.conditions?.length) params.set('condition', f.conditions.join(','))
    if (f.heating_types?.length) params.set('heating', f.heating_types.join(','))
    if (f.wall_types?.length) params.set('wall_type', f.wall_types.join(','))
    if (f.year_built_min) params.set('year_built_min', String(f.year_built_min))
    if (f.year_built_max) params.set('year_built_max', String(f.year_built_max))
    if (f.market_type) params.set('market_type', f.market_type)
    if (f.layout_features?.length) params.set('layout_features', f.layout_features.join(','))
    if (f.offer_types?.length) params.set('offer_type', f.offer_types.join(','))
    if (f.purchase_conditions?.length) params.set('purchase_conditions', f.purchase_conditions.join(','))
    if (f.date_from) params.set('date_from', f.date_from)
    if (f.date_to) params.set('date_to', f.date_to)
    if (f.listing_id) params.set('listing_id', f.listing_id)

    router.push(`/${locale}/listings?${params.toString()}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <HeroSearchView
      locations={cityRegionLocs}
      listingType={listingType}
      onListingTypeChange={setListingType}
      propertyType={propertyType}
      onPropertyTypeChange={setPropertyType}
      locationId={locationId}
      onLocationChange={id => setLocationId(id ?? '')}
      filters={filters}
      onFiltersChange={setFilters}
      activeFiltersCount={activeFiltersCount}
      filtersOpen={filtersOpen}
      onOpenFilters={() => setFiltersOpen(true)}
      onCloseFilters={() => setFiltersOpen(false)}
      onSearch={handleSearch}
      onLocationKeyDown={handleKeyDown}
    />
  )
}
