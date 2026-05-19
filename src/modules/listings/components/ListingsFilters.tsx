'use client'

import { useTranslations } from 'next-intl'
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  CONDITIONS, HEATING_TYPES, WALL_TYPES,
  MARKET_TYPES, LAYOUT_FEATURES, OFFER_TYPES, PURCHASE_CONDITIONS,
} from '@/modules/listings/constants'
import { LocationCombobox } from '@/components/shared/LocationCombobox'
import { YearCombobox } from '@/components/shared/YearCombobox'
import { DatePicker } from '@/components/shared/DatePicker'
import { FilterRangeInputs } from '@/components/shared/FilterRangeInputs'
import { FilterToggleGroup } from '@/components/shared/FilterToggleGroup'
import { FilterMultiToggle } from '@/components/shared/FilterMultiToggle'
import { FilterRoomsRow } from '@/components/shared/FilterRoomsRow'
import { useListingsUrlFilters } from '@/modules/listings/hooks/useListingsUrlFilters'

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

  const {
    get, updateParams, toggleMulti,
    handlePropertyTypeChange, handleFloorChange, handleFloorsChange,
    sections, toggle,
    shows, floorFilterMin,
    currency, activeCount,
    selectedRooms, selectedLayoutFeatures, selectedPurchaseConditions,
    today, rate, currencies, propertyTypes,
  } = useListingsUrlFilters()

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
            portal
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
            <FilterRoomsRow
              selected={selectedRooms}
              onToggle={v => toggleMulti('rooms', v)}
            />
          </AccordionSection>
        )}

        {/* Price */}
        <AccordionSection title={priceLabel} open={sections.price} onToggle={() => toggle('price')}>
          <div className="flex gap-1.5 mb-2">
            {currencies.map(cur => (
              <Button
                key={cur.code}
                type="button"
                size="xs"
                variant={currency === cur.code ? 'default' : 'outline'}
                onClick={() => updateParams({ currency: cur.is_default ? null : cur.code })}
                className="text-xs font-semibold"
              >
                {cur.code}
              </Button>
            ))}
          </div>
          <FilterRangeInputs
            minValue={get('price_min')}
            maxValue={get('price_max')}
            onMinChange={v => updateParams({ price_min: v || null })}
            onMaxChange={v => updateParams({ price_max: v || null })}
            minPlaceholder={tc('min')}
            maxPlaceholder={tc('max')}
          />
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
            <FilterRangeInputs
              min={0}
              minValue={get('area_min')}
              maxValue={get('area_max')}
              onMinChange={v => updateParams({ area_min: v ? String(Math.max(0, Number(v))) : null })}
              onMaxChange={v => updateParams({ area_max: v || null })}
              minPlaceholder={tc('min')}
              maxPlaceholder={tc('max')}
            />
          </AccordionSection>
        )}

        {/* Floor — domain-aware min (negative for garage/parking/warehouse, 0 otherwise) */}
        {shows('floor') && (
          <AccordionSection title={tc('floor_range')} open={sections.floor} onToggle={() => toggle('floor')}>
            <FilterRangeInputs
              min={floorFilterMin}
              minValue={get('floor_min')}
              maxValue={get('floor_max')}
              onMinChange={v => handleFloorChange('floor_min', v)}
              onMaxChange={v => handleFloorChange('floor_max', v)}
              minPlaceholder={tc('min')}
              maxPlaceholder={tc('max')}
            />
          </AccordionSection>
        )}

        {/* Building floors — min 1 */}
        {shows('floors_total') && (
          <AccordionSection title={tc('floors_total_range')} open={sections.floors_total} onToggle={() => toggle('floors_total')}>
            <FilterRangeInputs
              min={1}
              minValue={get('floors_total_min')}
              maxValue={get('floors_total_max')}
              onMinChange={v => handleFloorsChange('floors_total_min', v)}
              onMaxChange={v => handleFloorsChange('floors_total_max', v)}
              minPlaceholder={tc('min')}
              maxPlaceholder={tc('max')}
            />
          </AccordionSection>
        )}

        {/* Condition */}
        {shows('condition') && (
          <AccordionSection title={tc('condition')} open={sections.condition} onToggle={() => toggle('condition')}>
            <FilterToggleGroup
              options={CONDITIONS}
              value={get('condition') || null}
              onToggle={v => updateParams({ condition: v })}
              getLabel={k => t(k)}
              allLabel={tc('any')}
              className="flex-col gap-1.5"
            />
          </AccordionSection>
        )}

        {/* Layout features */}
        {shows('layout_features') && (
          <AccordionSection title={tc('layout_features')} open={sections.layout_features} onToggle={() => toggle('layout_features')}>
            <FilterMultiToggle
              options={LAYOUT_FEATURES}
              selected={selectedLayoutFeatures}
              onToggle={v => toggleMulti('layout_features', v)}
              getLabel={k => t(k)}
            />
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
                portal
              />
              <YearCombobox
                value={get('year_built_max') ? parseInt(get('year_built_max')) : undefined}
                onChange={v => updateParams({ year_built_max: v != null ? String(v) : null })}
                placeholder={tc('year_to')}
                portal
              />
            </div>
          </AccordionSection>
        )}

        {/* Heating */}
        {shows('heating') && (
          <AccordionSection title={tc('heating')} open={sections.heating} onToggle={() => toggle('heating')}>
            <FilterToggleGroup
              options={HEATING_TYPES}
              value={get('heating') || null}
              onToggle={v => updateParams({ heating: v })}
              getLabel={k => t(k)}
              allLabel={tc('any_n')}
            />
          </AccordionSection>
        )}

        {/* Wall type */}
        {shows('wall_type') && (
          <AccordionSection title={tc('wall_type')} open={sections.wall_type} onToggle={() => toggle('wall_type')}>
            <FilterToggleGroup
              options={WALL_TYPES}
              value={get('wall_type') || null}
              onToggle={v => updateParams({ wall_type: v })}
              getLabel={k => t(k)}
              allLabel={tc('any')}
            />
          </AccordionSection>
        )}

        {/* Offer type */}
        {shows('offer_type') && (
          <AccordionSection title={tc('offer_type')} open={sections.offer_type} onToggle={() => toggle('offer_type')}>
            <FilterToggleGroup
              options={OFFER_TYPES}
              value={get('offer_type') || null}
              onToggle={v => updateParams({ offer_type: v })}
              getLabel={k => t(k)}
              allLabel={tc('any')}
              className="flex-col gap-1.5"
            />
          </AccordionSection>
        )}

        {/* Purchase conditions */}
        {shows('purchase_conditions') && (
          <AccordionSection title={tc('purchase_conditions')} open={sections.purchase_conditions} onToggle={() => toggle('purchase_conditions')}>
            <FilterMultiToggle
              options={PURCHASE_CONDITIONS}
              selected={selectedPurchaseConditions}
              onToggle={v => toggleMulti('purchase_conditions', v)}
              getLabel={k => t(k)}
              className="flex-col gap-1.5"
            />
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
                maxDate={today}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{tc('date_to')}</label>
              <DatePicker
                value={get('date_to') || undefined}
                onChange={v => updateParams({ date_to: v ?? null })}
                placeholder={tc('select_date')}
                maxDate={today}
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
        <Button size="xl" className="lg:hidden mt-4" onClick={onClose}>
          {tc('apply_filters')}
          {activeCount > 0 && ` (${activeCount})`}
        </Button>
      )}
    </div>
  )
}
