'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  PROPERTY_TYPES, CONDITIONS, HEATING_TYPES, WALL_TYPES, ROOMS_OPTIONS,
  MARKET_TYPES, LAYOUT_FEATURES, OFFER_TYPES, PURCHASE_CONDITIONS,
  ALL_FILTER_SECTIONS, FILTER_SECTION_PARAMS,
  type FilterSection,
} from '@/modules/listings/constants'
import { getSchema, getFloorFilterMin } from '@/modules/listings/domain/propertyTypeSchema'
import type { ListingField } from '@/modules/listings/domain/listingFields'
import { LocationCombobox } from '@/components/shared/LocationCombobox'
import { YearCombobox } from '@/components/shared/YearCombobox'
import { DatePicker } from '@/components/shared/DatePicker'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { usePropertyTypes } from '@/hooks/usePropertyTypes'
import { useCurrencies } from '@/modules/currency/hooks/useCurrencies'

interface Location { id: number; name_al: string; type: string }
interface Props { locations: Location[]; className?: string; onClose?: () => void }

function AccordionSection({
  title, open, onToggle, children,
}: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="border-b border-border last:border-b-0 py-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between select-none group min-h-[44px]"
      >
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors duration-150">
          {title}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 shrink-0', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}

export function ListingsFilters({ locations, className, onClose }: Props) {
  const t = useTranslations('listing')
  const tc = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { rate } = useExchangeRate()
  const { propertyTypes } = usePropertyTypes()
  const { currencies } = useCurrencies()

  const [sections, setSections] = useState({
    type: true,
    market_type: false,
    property_type: true,
    location: true,
    rooms: true,
    price: true,
    area: false,
    floor: false,
    floors_total: false,
    condition: false,
    layout_features: false,
    year_built: false,
    heating: false,
    wall_type: false,
    offer_type: false,
    purchase_conditions: false,
    period: false,
    listing_id: false,
  })

  const toggle = (key: keyof typeof sections) =>
    setSections(prev => ({ ...prev, [key]: !prev[key] }))

  const get = (key: string) => searchParams.get(key) ?? ''

  const getMulti = (key: string): string[] => {
    const val = get(key)
    return val ? val.split(',').filter(Boolean) : []
  }

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
    [searchParams, router, pathname]
  )

  const toggleMulti = (key: string, value: string) => {
    const current = getMulti(key)
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    updateParams({ [key]: next.join(',') || null })
  }

  // When property type changes, clear irrelevant filter params
  function handlePropertyTypeChange(pt: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    if (pt) params.set('property_type', pt)
    else params.delete('property_type')

    const applicable = pt ? getSchema(pt).ui.filters : ALL_FILTER_SECTIONS
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

  const activeCount = [
    'type', 'market_type', 'property_type', 'location_id',
    'price_min', 'price_max', 'area_min', 'area_max',
    'rooms', 'floor_min', 'floor_max', 'floors_total_min', 'floors_total_max',
    'condition', 'layout_features', 'heating', 'wall_type', 'year_built_min', 'year_built_max',
    'offer_type', 'purchase_conditions', 'date_from', 'date_to', 'listing_id',
  ].filter(k => searchParams.get(k)).length

  const selectedRooms = getMulti('rooms')
  const selectedLayoutFeatures = getMulti('layout_features')
  const selectedPurchaseConditions = getMulti('purchase_conditions')

  const currentPropertyType = get('property_type')
  const visibleSections: readonly ListingField[] = currentPropertyType
    ? getSchema(currentPropertyType).ui.filters
    : ALL_FILTER_SECTIONS
  const shows = (key: FilterSection) => visibleSections.includes(key)
  // Domain-aware floor minimum: -10 for garage/parking/warehouse, 0 for all others.
  const floorFilterMin = getFloorFilterMin(currentPropertyType)

  const currency = get('currency') || 'ALL'
  const priceLabel = `${tc('price_range')} (${currency})`

  return (
    <div className={cn('listings-filters flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">{t('filters_title')}</span>
        {activeCount > 0 && (
          <span className="text-[11px] bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-medium">
            {activeCount}
          </span>
        )}
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden h-8 w-8 ml-auto" aria-label={tc('close')}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div>

        {/* Listing type */}
        <AccordionSection title={tc('listing_type')} open={sections.type} onToggle={() => toggle('type')}>
          <div className="flex gap-2">
            {(['', 'sale', 'rent'] as const).map(type => (
              <Button
                key={type}
                variant={get('type') === type || (!get('type') && type === '') ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-10 rounded-xl text-xs"
                onClick={() => updateParams({ type: type || null })}
              >
                {type === '' ? tc('all') : t(type)}
              </Button>
            ))}
          </div>
        </AccordionSection>

        {/* Property type */}
        <AccordionSection title={tc('property_type')} open={sections.property_type} onToggle={() => toggle('property_type')}>
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              variant="outline"
              className={cn('py-2 px-3 h-auto text-xs justify-start rounded-xl whitespace-normal leading-snug text-left', !get('property_type') && 'bg-primary/10 text-primary border-primary/30 font-semibold')}
              onClick={() => handlePropertyTypeChange(null)}
            >
              {tc('all_types')}
            </Button>
            {propertyTypes.map(pt => (
              <Button
                key={pt.value}
                variant="outline"
                className={cn('py-2 px-3 h-auto text-xs justify-start rounded-xl whitespace-normal leading-snug text-left', get('property_type') === pt.value && 'bg-primary/10 text-primary border-primary/30 font-semibold')}
                onClick={() => handlePropertyTypeChange(get('property_type') === pt.value ? null : pt.value)}
              >
                {pt.label}
              </Button>
            ))}
          </div>
        </AccordionSection>

        {/* Location */}
        <AccordionSection title={tc('location')} open={sections.location} onToggle={() => toggle('location')}>
          <LocationCombobox
            locations={locations}
            value={get('location_id')}
            onChange={id => updateParams({ location_id: id })}
          />
        </AccordionSection>

        {/* Market type */}
        {shows('market_type') && (
          <AccordionSection title={tc('market_type')} open={sections.market_type} onToggle={() => toggle('market_type')}>
            <div className="flex gap-2">
              <Button
                variant={!get('market_type') ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-10 rounded-xl text-xs"
                onClick={() => updateParams({ market_type: null })}
              >
                {tc('all')}
              </Button>
              {MARKET_TYPES.map(mt => (
                <Button
                  key={mt.value}
                  variant={get('market_type') === mt.value ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-10 rounded-xl text-xs whitespace-normal leading-snug"
                  onClick={() => updateParams({ market_type: get('market_type') === mt.value ? null : mt.value })}
                >
                  {t(mt.labelKey)}
                </Button>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Rooms */}
        {shows('rooms') && (
          <AccordionSection title={tc('rooms_label')} open={sections.rooms} onToggle={() => toggle('rooms')}>
            <div className="flex gap-1.5 flex-wrap">
              {ROOMS_OPTIONS.map(r => (
                <Button
                  key={r}
                  variant={selectedRooms.includes(String(r)) ? 'default' : 'outline'}
                  size="icon"
                  className="h-10 w-10 rounded-xl text-xs"
                  onClick={() => toggleMulti('rooms', String(r))}
                >
                  {r === 5 ? '5+' : r}
                </Button>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Price */}
        <AccordionSection title={priceLabel} open={sections.price} onToggle={() => toggle('price')}>
          <div className="flex gap-1.5 mb-2">
            {currencies.map(cur => (
              <button
                key={cur.code}
                type="button"
                onClick={() => updateParams({ currency: cur.is_default ? null : cur.code })}
                className={cn(
                  'text-xs font-semibold px-3 py-1 rounded-lg border transition-colors duration-150',
                  currency === cur.code
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {cur.code}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input type="number" placeholder={tc('min')} value={get('price_min')} onChange={e => updateParams({ price_min: e.target.value || null })} className="h-10 rounded-xl" />
            <Input type="number" placeholder={tc('max')} value={get('price_max')} onChange={e => updateParams({ price_max: e.target.value || null })} className="h-10 rounded-xl" />
          </div>
          {currency !== 'ALL' && rate != null && (
            <p className="text-xs text-muted-foreground mt-2">
              {tc('exchange_rate')}:{' '}
              1 {currency} ≈ {rate.toFixed(2)} ALL
            </p>
          )}
        </AccordionSection>

        {/* Area — area_range already includes "(m²)" in translation */}
        {shows('area') && (
          <AccordionSection title={tc('area_range')} open={sections.area} onToggle={() => toggle('area')}>
            <div className="flex gap-2">
              <Input type="number" min={0} placeholder={tc('min')} value={get('area_min')} onChange={e => updateParams({ area_min: e.target.value ? String(Math.max(0, Number(e.target.value))) : null })} className="h-10 rounded-xl" />
              <Input type="number" placeholder={tc('max')} value={get('area_max')} onChange={e => updateParams({ area_max: e.target.value || null })} className="h-10 rounded-xl" />
            </div>
          </AccordionSection>
        )}

        {/* Floor — domain-aware min (negative for garage/parking/warehouse, 0 otherwise) */}
        {shows('floor') && (
          <AccordionSection title={tc('floor_range')} open={sections.floor} onToggle={() => toggle('floor')}>
            <div className="flex gap-2">
              <Input
                type="number"
                min={floorFilterMin}
                placeholder={tc('min')}
                value={get('floor_min')}
                onChange={e => handleFloorChange('floor_min', e.target.value)}
                className="h-10 rounded-xl"
              />
              <Input
                type="number"
                min={floorFilterMin}
                placeholder={tc('max')}
                value={get('floor_max')}
                onChange={e => handleFloorChange('floor_max', e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </AccordionSection>
        )}

        {/* Building floors — min 1 */}
        {shows('floors_total') && (
          <AccordionSection title={tc('floors_total_range')} open={sections.floors_total} onToggle={() => toggle('floors_total')}>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                placeholder={tc('min')}
                value={get('floors_total_min')}
                onChange={e => handleFloorsChange('floors_total_min', e.target.value)}
                className="h-10 rounded-xl"
              />
              <Input
                type="number"
                min={1}
                placeholder={tc('max')}
                value={get('floors_total_max')}
                onChange={e => handleFloorsChange('floors_total_max', e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </AccordionSection>
        )}

        {/* Condition */}
        {shows('condition') && (
          <AccordionSection title={tc('condition')} open={sections.condition} onToggle={() => toggle('condition')}>
            <div className="flex flex-col gap-1.5">
              <Button variant={!get('condition') ? 'default' : 'outline'} size="sm" className="justify-start h-10 rounded-xl text-xs" onClick={() => updateParams({ condition: null })}>
                {tc('any')}
              </Button>
              {CONDITIONS.map(c => (
                <Button key={c.value} variant={get('condition') === c.value ? 'default' : 'outline'} size="sm" className="justify-start h-10 rounded-xl text-xs whitespace-normal leading-snug text-left" onClick={() => updateParams({ condition: get('condition') === c.value ? null : c.value })}>
                  {t(c.labelKey)}
                </Button>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Layout features */}
        {shows('layout_features') && (
          <AccordionSection title={tc('layout_features')} open={sections.layout_features} onToggle={() => toggle('layout_features')}>
            <div className="flex flex-wrap gap-1.5">
              {LAYOUT_FEATURES.map(lf => (
                <Button key={lf.value} variant={selectedLayoutFeatures.includes(lf.value) ? 'default' : 'outline'} size="sm" className="h-10 px-3 rounded-xl text-xs whitespace-normal leading-snug" onClick={() => toggleMulti('layout_features', lf.value)}>
                  {t(lf.labelKey)}
                </Button>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Year built — dropdown per dom.ria.com */}
        {shows('year_built') && (
          <AccordionSection title={tc('year_built_range')} open={sections.year_built} onToggle={() => toggle('year_built')}>
            <div className="grid grid-cols-2 gap-2">
              <YearCombobox
                value={get('year_built_min') ? parseInt(get('year_built_min')) : undefined}
                onChange={v => updateParams({ year_built_min: v != null ? String(v) : null })}
                placeholder={tc('year_from')}
              />
              <YearCombobox
                value={get('year_built_max') ? parseInt(get('year_built_max')) : undefined}
                onChange={v => updateParams({ year_built_max: v != null ? String(v) : null })}
                placeholder={tc('year_to')}
              />
            </div>
          </AccordionSection>
        )}

        {/* Heating */}
        {shows('heating') && (
          <AccordionSection title={tc('heating')} open={sections.heating} onToggle={() => toggle('heating')}>
            <div className="flex flex-wrap gap-1.5">
              <Button variant={!get('heating') ? 'default' : 'outline'} size="sm" className="h-10 px-3 rounded-xl text-xs" onClick={() => updateParams({ heating: null })}>{tc('any_n')}</Button>
              {HEATING_TYPES.map(h => (
                <Button key={h.value} variant={get('heating') === h.value ? 'default' : 'outline'} size="sm" className="h-10 px-3 rounded-xl text-xs" onClick={() => updateParams({ heating: get('heating') === h.value ? null : h.value })}>
                  {t(h.labelKey)}
                </Button>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Wall type */}
        {shows('wall_type') && (
          <AccordionSection title={tc('wall_type')} open={sections.wall_type} onToggle={() => toggle('wall_type')}>
            <div className="flex flex-wrap gap-1.5">
              <Button variant={!get('wall_type') ? 'default' : 'outline'} size="sm" className="h-10 px-3 rounded-xl text-xs" onClick={() => updateParams({ wall_type: null })}>{tc('any')}</Button>
              {WALL_TYPES.map(w => (
                <Button key={w.value} variant={get('wall_type') === w.value ? 'default' : 'outline'} size="sm" className="h-10 px-3 rounded-xl text-xs" onClick={() => updateParams({ wall_type: get('wall_type') === w.value ? null : w.value })}>
                  {t(w.labelKey)}
                </Button>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Offer type */}
        {shows('offer_type') && (
          <AccordionSection title={tc('offer_type')} open={sections.offer_type} onToggle={() => toggle('offer_type')}>
            <div className="flex flex-col gap-1.5">
              <Button variant={!get('offer_type') ? 'default' : 'outline'} size="sm" className="justify-start h-10 rounded-xl text-xs" onClick={() => updateParams({ offer_type: null })}>{tc('any')}</Button>
              {OFFER_TYPES.map(ot => (
                <Button key={ot.value} variant={get('offer_type') === ot.value ? 'default' : 'outline'} size="sm" className="justify-start h-10 rounded-xl text-xs whitespace-normal leading-snug text-left" onClick={() => updateParams({ offer_type: get('offer_type') === ot.value ? null : ot.value })}>
                  {t(ot.labelKey)}
                </Button>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Purchase conditions */}
        {shows('purchase_conditions') && (
          <AccordionSection title={tc('purchase_conditions')} open={sections.purchase_conditions} onToggle={() => toggle('purchase_conditions')}>
            <div className="flex flex-col gap-1.5">
              {PURCHASE_CONDITIONS.map(pc => (
                <Button key={pc.value} variant={selectedPurchaseConditions.includes(pc.value) ? 'default' : 'outline'} size="sm" className="justify-start h-10 rounded-xl text-xs whitespace-normal leading-snug text-left" onClick={() => toggleMulti('purchase_conditions', pc.value)}>
                  {t(pc.labelKey)}
                </Button>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Posting period — custom date pickers */}
        <AccordionSection title={tc('period')} open={sections.period} onToggle={() => toggle('period')}>
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{tc('date_from')}</label>
              <DatePicker
                value={get('date_from') || undefined}
                onChange={v => updateParams({ date_from: v ?? null })}
                placeholder={tc('select_date')}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{tc('date_to')}</label>
              <DatePicker
                value={get('date_to') || undefined}
                onChange={v => updateParams({ date_to: v ?? null })}
                placeholder={tc('select_date')}
              />
            </div>
          </div>
        </AccordionSection>

        {/* Search by ID */}
        <AccordionSection title={tc('listing_id_label')} open={sections.listing_id} onToggle={() => toggle('listing_id')}>
          <Input
            type="text"
            placeholder={tc('listing_id_placeholder')}
            value={get('listing_id')}
            onChange={e => updateParams({ listing_id: e.target.value || null })}
            className="h-10 rounded-xl"
          />
        </AccordionSection>

      </div>

      {/* Mobile apply button */}
      {onClose && (
        <Button className="lg:hidden mt-4 h-11" onClick={onClose}>
          {tc('apply_filters')}
          {activeCount > 0 && ` (${activeCount})`}
        </Button>
      )}
    </div>
  )
}
