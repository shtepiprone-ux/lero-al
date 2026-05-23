'use client'

import { useState, useEffect, useMemo } from 'react'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { usePropertyTypes } from '@/hooks/usePropertyTypes'
import { useCurrencies } from '@/modules/currency/hooks/useCurrencies'
import { getSchema } from '@/modules/listings/domain/propertyTypeSchema'
import { getFilterVisibility } from '@/modules/listings/domain/filterEngine'
import { ALL_FILTER_SECTIONS, type FilterSection } from '@/modules/listings/constants'
import type { LocationOption } from '@/components/shared/LocationCombobox'
import type { FilterValues } from '@/components/shared/FiltersPanel'

interface UseHomepageFiltersProps {
  values: FilterValues
  onChange: (values: FilterValues) => void
  onApply: (values: FilterValues) => void
  onClose: () => void
  locations: LocationOption[]
}

/**
 * Homepage filter adapter — encapsulates local draft-state management for FiltersPanel.
 *
 * Architecture contract:
 * - Owns local draft state (batch Apply UX, not immediate URL update)
 * - Syncs from parent `values` prop on external change
 * - Never writes to URL directly — Apply callback delegates that to the parent
 * - Stateless regarding URL params — URL logic belongs to the Listings adapter
 */
export function useHomepageFilters({
  values, onChange, onApply, onClose, locations,
}: UseHomepageFiltersProps) {
  const [local, setLocal] = useState<FilterValues>(values)
  const { rates } = useExchangeRate()
  const { propertyTypes } = usePropertyTypes()
  const { currencies } = useCurrencies()
  const today = useMemo(() => new Date(), [])

  // Sync local draft when parent applies external changes (e.g., URL deep-link sync)
  useEffect(() => { setLocal(values) }, [values])

  const cityRegionLocs = useMemo(
    () => locations.filter(l => l.type === 'city' || l.type === 'region'),
    [locations],
  )

  function update(patch: Partial<FilterValues>) {
    setLocal(prev => ({ ...prev, ...patch }))
  }

  function handlePropertyTypeChange(pt: string | undefined) {
    if (!pt) { update({ property_type: undefined }); return }
    const applicable = getSchema(pt).ui.filters
    const sectionFields: Record<FilterSection, (keyof FilterValues)[]> = {
      rooms:              ['rooms'],
      floor:              ['floor_min', 'floor_max'],
      floors_total:       ['floors_total_min', 'floors_total_max'],
      area:               [],
      year_built:         ['year_built_min', 'year_built_max'],
      condition:          ['condition'],
      heating:            ['heating'],
      wall_type:          ['wall_type'],
      market_type:        ['market_type'],
      layout_features:    ['layout_features'],
      offer_type:         ['offer_type'],
      purchase_conditions:['purchase_conditions'],
    }
    setLocal(prev => {
      const next = { ...prev, property_type: pt }
      ALL_FILTER_SECTIONS.forEach(section => {
        if (!applicable.includes(section)) {
          sectionFields[section].forEach(field => { delete next[field] })
        }
      })
      return next
    })
  }

  function handleApply() {
    onChange(local)
    onApply(local)
    onClose()
  }

  function handleReset() {
    const empty: FilterValues = {}
    setLocal(empty)
    onChange(empty)
  }

  const activeCount = Object.entries(local).filter(([key, v]) => {
    if (key === 'currency') return false
    if (Array.isArray(v)) return v.length > 0
    return v !== undefined && v !== ''
  }).length

  const currency = local.currency ?? 'ALL'
  const { visibleSections, shows, floorFilterMin } = getFilterVisibility(local.property_type)

  return {
    local, update,
    handlePropertyTypeChange, handleApply, handleReset,
    activeCount, cityRegionLocs,
    currency, visibleSections, shows, floorFilterMin,
    today, rates, currencies, propertyTypes,
  }
}
