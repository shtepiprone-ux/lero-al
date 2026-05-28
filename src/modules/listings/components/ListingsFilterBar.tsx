'use client'

/**
 * ListingsFilterBar — horizontal filter bar for the listings page (E.1 / Task 131).
 *
 * Visible on md+ (hidden on mobile — mobile uses the sort bar's Sheet trigger).
 * Shows the most-used filters inline; advanced filters open via Sheet.
 *
 * All filter state routes through useListingsUrlFilters → filterEngine.ts.
 * No new filter logic — existing primitives only.
 */

import { SlidersHorizontal, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/shared/Combobox'
import { LocationCombobox } from '@/components/shared/LocationCombobox'
import { useListingsUrlFilters } from '@/modules/listings/hooks/useListingsUrlFilters'

interface Location { id: number; name_al: string; type: string }

interface Props {
  locations: Location[]
  /** Opens the full-filters Sheet (same handler used by mobile sort bar) */
  onFiltersOpen: () => void
}

export function ListingsFilterBar({ locations, onFiltersOpen }: Props) {
  const t = useTranslations('listing')
  const tc = useTranslations('common')

  const {
    get, updateParams, handlePropertyTypeChange,
    activeCount, propertyTypes, resetFilters,
  } = useListingsUrlFilters()

  const listingType = get('type') || ''
  const propertyType = get('property_type') || ''
  const locationId = get('location_id') || ''

  const propertyTypeOptions = [
    { value: '', label: tc('all_types') },
    ...propertyTypes.map(pt => ({ value: pt.value, label: pt.label })),
  ]

  return (
    <div className="listings-filter-bar hidden md:flex flex-wrap items-center gap-2 py-3 border-b">
      {/* Listing type — sale / rent */}
      <div className="flex items-center gap-1 shrink-0">
        {(['', 'sale', 'rent'] as const).map(type => (
          <Button
            key={type}
            type="button"
            variant={listingType === type ? 'default' : 'outline'}
            size="lg"
            className="rounded-xl text-xs px-3 shrink-0"
            onClick={() => updateParams({ type: type || null })}
          >
            {type === '' ? tc('all') : t(type)}
          </Button>
        ))}
      </div>

      <div className="w-px h-6 bg-border shrink-0" />

      {/* Property type */}
      <Combobox
        options={propertyTypeOptions}
        value={propertyType}
        onChange={v => handlePropertyTypeChange(v || null)}
        placeholder={tc('all_types')}
        variant="button"
        size="sm"
        className="w-40 shrink-0"
      />

      {/* Location */}
      <LocationCombobox
        locations={locations}
        value={locationId}
        onChange={id => updateParams({ location_id: id ?? null })}
        placeholder={tc('all_locations')}
        size="sm"
        className="w-52 shrink-0"
        portal
      />

      {/* Spacer */}
      <div className="flex-1 min-w-0" />

      {/* Global reset — shown only when filters are active */}
      {activeCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="text-xs text-muted-foreground hover:text-destructive gap-1 shrink-0"
          onClick={resetFilters}
        >
          <X className="h-3.5 w-3.5 shrink-0" />
          {tc('reset_filters')}
        </Button>
      )}

      {/* More / advanced filters → opens full Sheet */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="rounded-xl text-xs gap-1.5 shrink-0 relative"
        onClick={onFiltersOpen}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
        {tc('advanced_filters')}
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
      </Button>
    </div>
  )
}
