'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  PROPERTY_TYPES, CONDITIONS, HEATING_TYPES, WALL_TYPES, ROOMS_OPTIONS,
  MARKET_TYPES, LAYOUT_FEATURES, OFFER_TYPES, PURCHASE_CONDITIONS,
  ALL_FILTER_SECTIONS, type FilterSection,
} from '@/modules/listings/constants'
import { getSchema, getFloorFilterMin } from '@/modules/listings/domain/propertyTypeSchema'
import type { ListingField } from '@/modules/listings/domain/listingFields'
import { LocationCombobox, type LocationOption } from '@/components/shared/LocationCombobox'
import { YearCombobox } from '@/components/shared/YearCombobox'
import { DatePicker } from '@/components/shared/DatePicker'
import { FilterRangeInputs } from '@/components/shared/FilterRangeInputs'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { usePropertyTypes } from '@/hooks/usePropertyTypes'
import { useCurrencies } from '@/modules/currency/hooks/useCurrencies'
import { usePerformanceTier } from '@/lib/performance/store'
import { useIdleMount } from '@/lib/performance/tier'

export type FilterCurrency = string

export interface FilterValues {
  property_type?: string
  location_id?: string
  currency?: FilterCurrency
  price_min?: number
  price_max?: number
  area_min?: number
  area_max?: number
  rooms?: number[]
  floor_min?: number
  floor_max?: number
  floors_total_min?: number
  floors_total_max?: number
  condition?: string
  heating?: string
  wall_type?: string
  year_built_min?: number
  year_built_max?: number
  market_type?: string
  layout_features?: string[]
  offer_type?: string
  purchase_conditions?: string[]
  date_from?: string
  date_to?: string
  listing_id?: string
}

interface FiltersPanelProps {
  open: boolean
  onClose: () => void
  values: FilterValues
  onChange: (values: FilterValues) => void
  onApply: (values: FilterValues) => void
  locations: LocationOption[]
}

function SectionHeader({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{children}</p>
      {right}
    </div>
  )
}

function ToggleGroup({
  options, value, onChange, getLabel,
}: {
  options: readonly { value: string; labelKey: string }[]
  value?: string
  onChange: (v: string | undefined) => void
  getLabel: (key: string) => string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <Button
          key={opt.value}
          type="button"
          variant={value === opt.value ? 'default' : 'outline'}
          size="sm"
          className="h-auto px-3 py-2 text-xs min-h-[36px] rounded-xl whitespace-normal leading-snug text-left"
          onClick={() => onChange(value === opt.value ? undefined : opt.value)}
        >
          {getLabel(opt.labelKey)}
        </Button>
      ))}
    </div>
  )
}

function MultiToggleGroup({
  options, value, onChange, getLabel,
}: {
  options: readonly { value: string; labelKey: string }[]
  value?: string[]
  onChange: (v: string[]) => void
  getLabel: (key: string) => string
}) {
  const safeValue = Array.isArray(value) ? value : []
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const selected = safeValue.includes(opt.value)
        return (
          <Button
            key={opt.value}
            type="button"
            variant={selected ? 'default' : 'outline'}
            size="sm"
            className="h-auto px-3 py-2 text-xs min-h-[36px] rounded-xl whitespace-normal leading-snug text-left"
            onClick={() => onChange(selected ? safeValue.filter(v => v !== opt.value) : [...safeValue, opt.value])}
          >
            {getLabel(opt.labelKey)}
          </Button>
        )
      })}
    </div>
  )
}

function RoomsRow({ value, onChange }: { value?: number[]; onChange: (v: number[]) => void }) {
  const safeValue = Array.isArray(value) ? value : []
  return (
    <div className="flex gap-2 flex-wrap">
      {ROOMS_OPTIONS.map(opt => {
        const selected = safeValue.includes(opt)
        return (
          <Button
            key={opt}
            type="button"
            variant={selected ? 'default' : 'outline'}
            size="icon"
            className="h-9 w-9 text-xs rounded-xl shrink-0"
            onClick={() => onChange(selected ? safeValue.filter(v => v !== opt) : [...safeValue, opt])}
          >
            {opt === 5 ? '5+' : opt}
          </Button>
        )
      })}
    </div>
  )
}

function positiveNum(v: string): number | undefined {
  const n = parseInt(v)
  return !isNaN(n) && n >= 1 ? n : undefined
}

export function FiltersPanel({ open, onClose, values, onChange, onApply, locations }: FiltersPanelProps) {
  const t = useTranslations('common')
  const tl = useTranslations('listing')
  const [local, setLocal] = useState<FilterValues>(values)
  const { rate } = useExchangeRate()
  const { propertyTypes } = usePropertyTypes()
  const { currencies } = useCurrencies()
  // Stable "today" reference — computed once on mount, not on every render.
  const today = useMemo(() => new Date(), [])

  // LOW-tier: defer mounting inner content to idle time — reduces main-thread work during
  // initial page load. The panel shell (CSS container) always renders for smooth transitions.
  // forceNow=open ensures content is ready the instant the user opens the panel.
  const tier = usePerformanceTier()
  const contentReady = useIdleMount(tier === 'low', open)

  useEffect(() => { setLocal(values) }, [values])

  const cityRegionLocs = useMemo(
    () => locations.filter(l => l.type === 'city' || l.type === 'region'),
    [locations]
  )

  function update(patch: Partial<FilterValues>) {
    setLocal(prev => ({ ...prev, ...patch }))
  }

  function handlePropertyTypeChange(pt: string | undefined) {
    if (!pt) {
      update({ property_type: undefined })
      return
    }
    const applicable = getSchema(pt).ui.filters
    // Clear filters that don't apply to the new type
    const cleared: Partial<FilterValues> = { property_type: pt }
    const sectionFields: Record<FilterSection, (keyof FilterValues)[]> = {
      rooms: ['rooms'],
      floor: ['floor_min', 'floor_max'],
      floors_total: ['floors_total_min', 'floors_total_max'],
      area: [],
      year_built: ['year_built_min', 'year_built_max'],
      condition: ['condition'],
      heating: ['heating'],
      wall_type: ['wall_type'],
      market_type: ['market_type'],
      layout_features: ['layout_features'],
      offer_type: ['offer_type'],
      purchase_conditions: ['purchase_conditions'],
    }
    ALL_FILTER_SECTIONS.forEach(section => {
      if (!applicable.includes(section)) {
        sectionFields[section].forEach(field => { delete cleared[field] })
      }
    })
    setLocal(prev => ({ ...prev, ...cleared }))
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
    if (key === 'currency') return false // not a filter
    if (Array.isArray(v)) return v.length > 0
    return v !== undefined && v !== ''
  }).length

  // Visible filter sections based on selected property type
  const visibleSections: readonly ListingField[] = local.property_type
    ? getSchema(local.property_type).ui.filters
    : ALL_FILTER_SECTIONS
  const shows = (key: FilterSection) => visibleSections.includes(key)
  // Domain-aware floor minimum: -10 for garage/parking/warehouse, 0 for all others.
  const floorFilterMin = getFloorFilterMin(local.property_type ?? '')

  const currency = local.currency ?? 'ALL'
  const priceLabel = `${t('price_range')} (${currency})`

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'filters-panel-backdrop fixed inset-0 z-40 bg-black/40 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'filters-panel fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-background shadow-xl flex flex-col transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t('advanced_filters')}
      >
      {contentReady && <>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base">{t('advanced_filters')}</h2>
            {activeCount > 0 && (
              <span className="text-[11px] bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-medium">
                {activeCount}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('close_filters')}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-border">

            {/* Location */}
            <div className="px-5 py-5">
              <SectionHeader>{t('location')}</SectionHeader>
              <LocationCombobox
                locations={cityRegionLocs}
                value={local.location_id ?? ''}
                onChange={id => update({ location_id: id ?? undefined })}
              />
            </div>

            {/* Property type */}
            <div className="px-5 py-5">
              <SectionHeader>{t('property_type')}</SectionHeader>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant="outline"
                  className={cn(
                    'py-2 px-3 h-auto text-xs justify-start rounded-xl whitespace-normal leading-snug text-left',
                    !local.property_type && 'bg-primary/10 text-primary border-primary/30 font-semibold'
                  )}
                  onClick={() => handlePropertyTypeChange(undefined)}
                >
                  {t('all_types')}
                </Button>
                {propertyTypes.map(pt => (
                  <Button
                    key={pt.value}
                    variant="outline"
                    className={cn(
                      'py-2 px-3 h-auto text-xs justify-start rounded-xl whitespace-normal leading-snug text-left',
                      local.property_type === pt.value && 'bg-primary/10 text-primary border-primary/30 font-semibold'
                    )}
                    onClick={() => handlePropertyTypeChange(local.property_type === pt.value ? undefined : pt.value)}
                  >
                    {pt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Market type */}
            {shows('market_type') && (
              <div className="px-5 py-5">
                <SectionHeader>{t('market_type')}</SectionHeader>
                <div className="flex gap-2">
                  <Button
                    variant={!local.market_type ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 h-9 rounded-xl text-xs"
                    onClick={() => update({ market_type: undefined })}
                  >
                    {t('all')}
                  </Button>
                  {MARKET_TYPES.map(mt => (
                    <Button
                      key={mt.value}
                      variant={local.market_type === mt.value ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-9 rounded-xl text-xs whitespace-normal leading-snug"
                      onClick={() => update({ market_type: local.market_type === mt.value ? undefined : mt.value })}
                    >
                      {tl(mt.labelKey)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="px-5 py-5">
              <SectionHeader
                right={
                  <div className="flex gap-1">
                    {currencies.map(cur => (
                      <button
                        key={cur.code}
                        type="button"
                        onClick={() => update({ currency: cur.code })}
                        className={cn(
                          'text-[11px] font-semibold px-2 py-0.5 rounded-lg transition-colors duration-150',
                          currency === cur.code
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {cur.code}
                      </button>
                    ))}
                  </div>
                }
              >
                {priceLabel}
              </SectionHeader>
              <FilterRangeInputs
                minValue={local.price_min?.toString() ?? ''}
                maxValue={local.price_max?.toString() ?? ''}
                onMinChange={v => update({ price_min: v ? Number(v) : undefined })}
                onMaxChange={v => update({ price_max: v ? Number(v) : undefined })}
                minPlaceholder={t('min')}
                maxPlaceholder={t('max')}
              />
              {currency !== 'ALL' && rate != null && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t('exchange_rate')}:{' '}
                  1 {currency} ≈ {rate.toFixed(2)} ALL
                </p>
              )}
            </div>

            {/* Area — area_range already includes "(m²)" in translation */}
            {shows('area') && (
              <div className="px-5 py-5">
                <SectionHeader>{t('area_range')}</SectionHeader>
                <FilterRangeInputs
                  min={0}
                  minValue={local.area_min?.toString() ?? ''}
                  maxValue={local.area_max?.toString() ?? ''}
                  onMinChange={v => update({ area_min: v !== '' ? Math.max(0, Number(v)) : undefined })}
                  onMaxChange={v => update({ area_max: v ? Number(v) : undefined })}
                  minPlaceholder={t('min')}
                  maxPlaceholder={t('max')}
                />
              </div>
            )}

            {/* Rooms */}
            {shows('rooms') && (
              <div className="px-5 py-5">
                <SectionHeader>{t('rooms_label')}</SectionHeader>
                <RoomsRow
                  value={local.rooms}
                  onChange={v => update({ rooms: v.length > 0 ? v : undefined })}
                />
              </div>
            )}

            {/* Floor — domain-aware min (negative for garage/parking/warehouse, 0 otherwise) */}
            {shows('floor') && (
              <div className="px-5 py-5">
                <SectionHeader>{t('floor_range')}</SectionHeader>
                <FilterRangeInputs
                  min={floorFilterMin}
                  minValue={local.floor_min?.toString() ?? ''}
                  maxValue={local.floor_max?.toString() ?? ''}
                  onMinChange={v => { const n = parseInt(v); update({ floor_min: !isNaN(n) && n >= floorFilterMin ? n : undefined }) }}
                  onMaxChange={v => { const n = parseInt(v); update({ floor_max: !isNaN(n) ? n : undefined }) }}
                  minPlaceholder={t('min')}
                  maxPlaceholder={t('max')}
                />
              </div>
            )}

            {/* Building floors — min 1 */}
            {shows('floors_total') && (
              <div className="px-5 py-5">
                <SectionHeader>{t('floors_total_range')}</SectionHeader>
                <FilterRangeInputs
                  min={1}
                  minValue={local.floors_total_min?.toString() ?? ''}
                  maxValue={local.floors_total_max?.toString() ?? ''}
                  onMinChange={v => update({ floors_total_min: positiveNum(v) })}
                  onMaxChange={v => update({ floors_total_max: positiveNum(v) })}
                  minPlaceholder={t('min')}
                  maxPlaceholder={t('max')}
                />
              </div>
            )}

            {/* Year built — dropdown per dom.ria.com */}
            {shows('year_built') && (
              <div className="px-5 py-5">
                <SectionHeader>{t('year_built_range')}</SectionHeader>
                <div className="grid grid-cols-2 gap-2">
                  <YearCombobox
                    value={local.year_built_min}
                    onChange={v => update({ year_built_min: v })}
                    placeholder={t('year_from')}
                  />
                  <YearCombobox
                    value={local.year_built_max}
                    onChange={v => update({ year_built_max: v })}
                    placeholder={t('year_to')}
                  />
                </div>
              </div>
            )}

            {/* Condition */}
            {shows('condition') && (
              <div className="px-5 py-5">
                <SectionHeader>{t('condition')}</SectionHeader>
                <ToggleGroup
                  options={CONDITIONS}
                  value={local.condition}
                  onChange={v => update({ condition: v })}
                  getLabel={k => tl(k)}
                />
              </div>
            )}

            {/* Layout features */}
            {shows('layout_features') && (
              <div className="px-5 py-5">
                <SectionHeader>{t('layout_features')}</SectionHeader>
                <MultiToggleGroup
                  options={LAYOUT_FEATURES}
                  value={local.layout_features}
                  onChange={v => update({ layout_features: v.length > 0 ? v : undefined })}
                  getLabel={k => tl(k)}
                />
              </div>
            )}

            {/* Heating */}
            {shows('heating') && (
              <div className="px-5 py-5">
                <SectionHeader>{t('heating')}</SectionHeader>
                <ToggleGroup
                  options={HEATING_TYPES}
                  value={local.heating}
                  onChange={v => update({ heating: v })}
                  getLabel={k => tl(k)}
                />
              </div>
            )}

            {/* Wall type */}
            {shows('wall_type') && (
              <div className="px-5 py-5">
                <SectionHeader>{t('wall_type')}</SectionHeader>
                <ToggleGroup
                  options={WALL_TYPES}
                  value={local.wall_type}
                  onChange={v => update({ wall_type: v })}
                  getLabel={k => tl(k)}
                />
              </div>
            )}

            {/* Offer type */}
            {shows('offer_type') && (
              <div className="px-5 py-5">
                <SectionHeader>{t('offer_type')}</SectionHeader>
                <ToggleGroup
                  options={OFFER_TYPES}
                  value={local.offer_type}
                  onChange={v => update({ offer_type: v })}
                  getLabel={k => tl(k)}
                />
              </div>
            )}

            {/* Purchase conditions */}
            {shows('purchase_conditions') && (
              <div className="px-5 py-5">
                <SectionHeader>{t('purchase_conditions')}</SectionHeader>
                <MultiToggleGroup
                  options={PURCHASE_CONDITIONS}
                  value={local.purchase_conditions}
                  onChange={v => update({ purchase_conditions: v.length > 0 ? v : undefined })}
                  getLabel={k => tl(k)}
                />
              </div>
            )}

            {/* Posting period — custom date pickers */}
            <div className="px-5 py-5">
              <SectionHeader>{t('period')}</SectionHeader>
              <div className="flex flex-col gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{t('date_from')}</label>
                  <DatePicker
                    value={local.date_from}
                    onChange={v => update({ date_from: v })}
                    placeholder={t('select_date')}
                    maxDate={today}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{t('date_to')}</label>
                  <DatePicker
                    value={local.date_to}
                    onChange={v => update({ date_to: v })}
                    placeholder={t('select_date')}
                    maxDate={today}
                  />
                </div>
              </div>
            </div>

            {/* Search by ID */}
            <div className="px-5 py-5">
              <SectionHeader>{t('listing_id_label')}</SectionHeader>
              <Input
                type="text"
                placeholder={t('listing_id_placeholder')}
                value={local.listing_id ?? ''}
                onChange={e => update({ listing_id: e.target.value || undefined })}
                className="h-10 rounded-xl"
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-4 flex gap-3 shrink-0">
          <Button variant="outline" className="flex-1 gap-2 h-11" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
            {t('reset_filters')}
          </Button>
          <Button className="flex-1 h-11 relative" onClick={handleApply}>
            {t('apply_filters')}
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {activeCount}
              </span>
            )}
          </Button>
        </div>
      </>}
      </div>
    </>
  )
}
