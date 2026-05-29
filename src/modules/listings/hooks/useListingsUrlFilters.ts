'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { usePropertyTypes } from '@/hooks/usePropertyTypes'
import { useCurrencies } from '@/modules/currency/hooks/useCurrencies'
import {
  ALL_FILTER_SECTIONS, FILTER_SECTION_PARAMS,
} from '@/modules/listings/constants'
import {
  getFilterVisibility, parseSearchParams, countActiveFilters,
} from '@/modules/listings/domain/filterEngine'

const SECTION_DEFAULTS = {
  type: true, market_type: false, property_type: true, location: true,
  rooms: true, price: true, area: false, floor: false, floors_total: false,
  condition: false, layout_features: false, year_built: false,
  heating: false, wall_type: false, offer_type: false, purchase_conditions: false,
  period: false, listing_id: false,
}

/**
 * Listings URL filter adapter — encapsulates URL-based immediate filter state.
 *
 * Architecture contract:
 * - Owns URL-synchronization (each filter change → immediate router.push)
 * - Browser back/forward and deep-links work via URL as source of truth
 * - No local draft state — changes apply immediately
 * - Never merges with Homepage batch-state model
 */
export function useListingsUrlFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { rate } = useExchangeRate()
  const { propertyTypes } = usePropertyTypes()
  const { currencies } = useCurrencies()
  const today = useMemo(() => new Date(), [])

  // Accordion open/close state — UI only, not persisted to URL
  const [sections, setSections] = useState(SECTION_DEFAULTS)
  const toggle = (key: keyof typeof SECTION_DEFAULTS) =>
    setSections(prev => ({ ...prev, [key]: !prev[key] }))

  // ── URL param helpers ────────────────────────────────────────────────────────

  const get = useCallback((key: string) => searchParams.get(key) ?? '', [searchParams])

  const getMulti = useCallback((key: string): string[] => {
    const val = searchParams.get(key)
    return val ? val.split(',').filter(Boolean) : []
  }, [searchParams])

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('page')
      Object.entries(updates).forEach(([key, val]) => {
        if (val === null || val === '') params.delete(key)
        else params.set(key, val)
      })
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, router, pathname],
  )

  const toggleMulti = useCallback((key: string, value: string) => {
    const current = getMulti(key)
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    updateParams({ [key]: next.join(',') || null })
  }, [getMulti, updateParams])

  const resetFilters = useCallback(() => {
    router.push(pathname)
  }, [router, pathname])

  // ── Business handlers ────────────────────────────────────────────────────────

  function handlePropertyTypeChange(pt: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    if (pt) params.set('property_type', pt)
    else params.delete('property_type')
    const applicable = pt ? getFilterVisibility(pt).visibleSections : ALL_FILTER_SECTIONS
    ALL_FILTER_SECTIONS.forEach(section => {
      if (!applicable.includes(section)) {
        FILTER_SECTION_PARAMS[section].forEach(p => params.delete(p))
      }
    })
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleFloorChange(key: 'floor_min' | 'floor_max', val: string) {
    const n = parseInt(val)
    updateParams({ [key]: (!isNaN(n) && n >= floorFilterMin) ? String(n) : null })
  }

  function handleFloorsChange(key: 'floors_total_min' | 'floors_total_max', val: string) {
    const n = parseInt(val)
    updateParams({ [key]: (!isNaN(n) && n >= 1) ? String(n) : null })
  }

  // ── Derived state ────────────────────────────────────────────────────────────

  const currentPropertyType = get('property_type')
  const { visibleSections, shows, floorFilterMin } = getFilterVisibility(currentPropertyType || undefined)
  const currency = get('currency') || 'ALL'

  // Canonical active filter count via filterEngine — replaces hardcoded param list
  const activeCount = countActiveFilters(parseSearchParams(searchParams))

  const selectedRooms = getMulti('rooms')
  const selectedConditions = getMulti('condition')
  const selectedHeatingTypes = getMulti('heating')
  const selectedWallTypes = getMulti('wall_type')
  const selectedOfferTypes = getMulti('offer_type')
  const selectedLayoutFeatures = getMulti('layout_features')
  const selectedPurchaseConditions = getMulti('purchase_conditions')

  return {
    // URL helpers
    get, getMulti, updateParams, toggleMulti, resetFilters,
    // Business handlers
    handlePropertyTypeChange, handleFloorChange, handleFloorsChange,
    // Accordion state
    sections, toggle,
    // Filter visibility
    visibleSections, shows, floorFilterMin,
    // Derived URL values
    currency, activeCount, currentPropertyType,
    selectedRooms, selectedConditions, selectedHeatingTypes,
    selectedWallTypes, selectedOfferTypes,
    selectedLayoutFeatures, selectedPurchaseConditions,
    // Data
    today, rate, currencies, propertyTypes,
  }
}
