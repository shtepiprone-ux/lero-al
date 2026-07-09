'use client'

import { useTranslations } from 'next-intl'
import { RotateCcw } from 'lucide-react'
import { Button, TextInput } from '@mantine/core'
import { MantineDrawer, MantineCountButton, RangeDatePicker } from '@/design-system/mantine/patterns'
import type { FilterValues } from '@/modules/listings/domain/filterEngine'
export type { FilterValues }
import {
  CONDITIONS, HEATING_TYPES, WALL_TYPES,
  MARKET_TYPES, LAYOUT_FEATURES, OFFER_TYPES, PURCHASE_CONDITIONS,
} from '@/modules/listings/constants'
import { LocationCombobox, type LocationOption } from '@/components/shared/LocationCombobox'
import { YearCombobox } from '@/components/shared/YearCombobox'
import { FilterRangeInputs } from '@/components/shared/FilterRangeInputs'
import { FilterMultiToggle } from '@/components/shared/FilterMultiToggle'
import { FilterRoomsRow } from '@/components/shared/FilterRoomsRow'
import { usePerformanceTier } from '@/lib/performance/store'
import { useIdleMount } from '@/lib/performance/tier'
import { useHomepageFilters } from '@/components/shared/useHomepageFilters'

export type FilterCurrency = string

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

function positiveNum(v: string): number | undefined {
  const n = parseInt(v)
  return !isNaN(n) && n >= 1 ? n : undefined
}

export function FiltersPanel({ open, onClose, values, onChange, onApply, locations }: FiltersPanelProps) {
  const t = useTranslations('common')
  const tl = useTranslations('listing')

  const {
    local, update,
    handlePropertyTypeChange, handleApply, handleReset,
    activeCount, cityRegionLocs,
    shows, floorFilterMin,
    today, propertyTypes,
  } = useHomepageFilters({ values, onChange, onApply, onClose, locations })

  // LOW-tier: defer mounting inner content to idle time — reduces main-thread work during
  // initial page load. forceNow=open ensures content is ready the instant the user opens.
  const tier = usePerformanceTier()
  const contentReady = useIdleMount(tier === 'low', open)
  const priceLabel = t('price_range')

  return (
    <MantineDrawer
      opened={open}
      onClose={onClose}
      side="right"
      size="sm"
      title={
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base">{t('advanced_filters')}</span>
          {activeCount > 0 && (
            <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-medium">
              {activeCount}
            </span>
          )}
        </div>
      }
      footer={
        <div className="flex flex-col gap-3">
          {/* Task 567 round-2 Fix 3: count renders inline in Button's rightSection via the
              canonical MantineCountButton primitive — replaces the round-1 absolute corner
              badge, which Mantine Button's own overflow:hidden root was genuinely clipping. */}
          <MantineCountButton fullWidth count={activeCount} onClick={handleApply}>
            {t('apply_filters')}
          </MantineCountButton>
          <Button variant="default" fullWidth leftSection={<RotateCcw className="h-4 w-4" />} onClick={handleReset}>
            {t('reset_filters')}
          </Button>
        </div>
      }
    >
      {contentReady && (
        <div className="divide-y divide-border">

          {/* Location */}
          <div className="px-5 py-5">
            <SectionHeader>{t('location')}</SectionHeader>
            <LocationCombobox
              locations={cityRegionLocs}
              value={local.location_id ?? ''}
              onChange={id => update({ location_id: id ?? undefined })}
              portal
            />
          </div>

          {/* Property type */}
          <div className="px-5 py-5">
            <SectionHeader>{t('property_type')}</SectionHeader>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant={!local.property_type ? 'light' : 'default'}
                className="justify-start text-left"
                onClick={() => handlePropertyTypeChange(undefined)}
              >
                {t('all_types')}
              </Button>
              {propertyTypes.map(pt => (
                <Button
                  key={pt.value}
                  variant={local.property_type === pt.value ? 'light' : 'default'}
                  className="justify-start text-left"
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
              {/* Task 567 round-2 Fix 1: sm:flex-wrap + w-full sm:w-auto (NOT flex-1) — a row
                  that no longer fits its drawer width wraps whole buttons to the next line
                  instead of squeezing them until a word breaks mid-character. */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                <Button
                  variant={!local.market_type ? 'light' : 'default'}
                  className="w-full sm:w-auto"
                  onClick={() => update({ market_type: undefined })}
                >
                  {t('all')}
                </Button>
                {MARKET_TYPES.map(mt => (
                  <Button
                    key={mt.value}
                    variant={local.market_type === mt.value ? 'light' : 'default'}
                    className="w-full sm:w-auto"
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
            <SectionHeader>{priceLabel}</SectionHeader>
            <FilterRangeInputs
              minValue={local.price_min?.toString() ?? ''}
              maxValue={local.price_max?.toString() ?? ''}
              onMinChange={v => update({ price_min: v ? Number(v) : undefined })}
              onMaxChange={v => update({ price_max: v ? Number(v) : undefined })}
              minPlaceholder={t('min')}
              maxPlaceholder={t('max')}
            />
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
              <FilterRoomsRow
                selected={local.rooms?.map(String) ?? []}
                onToggle={v => {
                  const n = Number(v)
                  const current = local.rooms ?? []
                  const next = current.includes(n) ? current.filter(r => r !== n) : [...current, n]
                  update({ rooms: next.length > 0 ? next : undefined })
                }}
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
                  portal
                />
                <YearCombobox
                  value={local.year_built_max}
                  onChange={v => update({ year_built_max: v })}
                  placeholder={t('year_to')}
                  portal
                />
              </div>
            </div>
          )}

          {/* Condition — multi-select */}
          {shows('condition') && (
            <div className="px-5 py-5">
              <SectionHeader>{t('condition')}</SectionHeader>
              <FilterMultiToggle
                options={CONDITIONS}
                selected={local.conditions ?? []}
                onToggle={v => {
                  const current = local.conditions ?? []
                  const next = current.includes(v) ? current.filter(x => x !== v) : [...current, v]
                  update({ conditions: next.length > 0 ? next : undefined })
                }}
                getLabel={k => tl(k)}
              />
            </div>
          )}

          {/* Layout features */}
          {shows('layout_features') && (
            <div className="px-5 py-5">
              <SectionHeader>{t('layout_features')}</SectionHeader>
              <FilterMultiToggle
                options={LAYOUT_FEATURES}
                selected={local.layout_features ?? []}
                onToggle={v => {
                  const current = local.layout_features ?? []
                  const next = current.includes(v) ? current.filter(x => x !== v) : [...current, v]
                  update({ layout_features: next.length > 0 ? next : undefined })
                }}
                getLabel={k => tl(k)}
              />
            </div>
          )}

          {/* Heating — multi-select */}
          {shows('heating') && (
            <div className="px-5 py-5">
              <SectionHeader>{t('heating')}</SectionHeader>
              <FilterMultiToggle
                options={HEATING_TYPES}
                selected={local.heating_types ?? []}
                onToggle={v => {
                  const current = local.heating_types ?? []
                  const next = current.includes(v) ? current.filter(x => x !== v) : [...current, v]
                  update({ heating_types: next.length > 0 ? next : undefined })
                }}
                getLabel={k => tl(k)}
              />
            </div>
          )}

          {/* Wall type — multi-select */}
          {shows('wall_type') && (
            <div className="px-5 py-5">
              <SectionHeader>{t('wall_type')}</SectionHeader>
              <FilterMultiToggle
                options={WALL_TYPES}
                selected={local.wall_types ?? []}
                onToggle={v => {
                  const current = local.wall_types ?? []
                  const next = current.includes(v) ? current.filter(x => x !== v) : [...current, v]
                  update({ wall_types: next.length > 0 ? next : undefined })
                }}
                getLabel={k => tl(k)}
              />
            </div>
          )}

          {/* Offer type — multi-select */}
          {shows('offer_type') && (
            <div className="px-5 py-5">
              <SectionHeader>{t('offer_type')}</SectionHeader>
              <FilterMultiToggle
                options={OFFER_TYPES}
                selected={local.offer_types ?? []}
                onToggle={v => {
                  const current = local.offer_types ?? []
                  const next = current.includes(v) ? current.filter(x => x !== v) : [...current, v]
                  update({ offer_types: next.length > 0 ? next : undefined })
                }}
                getLabel={k => tl(k)}
              />
            </div>
          )}

          {/* Purchase conditions */}
          {shows('purchase_conditions') && (
            <div className="px-5 py-5">
              <SectionHeader>{t('purchase_conditions')}</SectionHeader>
              <FilterMultiToggle
                options={PURCHASE_CONDITIONS}
                selected={local.purchase_conditions ?? []}
                onToggle={v => {
                  const current = local.purchase_conditions ?? []
                  const next = current.includes(v) ? current.filter(x => x !== v) : [...current, v]
                  update({ purchase_conditions: next.length > 0 ? next : undefined })
                }}
                getLabel={k => tl(k)}
              />
            </div>
          )}

          {/* Posting period — range date picker (Task 559) */}
          <div className="px-5 py-5">
            <SectionHeader>{t('period')}</SectionHeader>
            <RangeDatePicker
              value={{ from: local.date_from, to: local.date_to }}
              onChange={next => update({ date_from: next.from, date_to: next.to })}
              maxDate={today}
            />
          </div>

          {/* Search by ID */}
          <div className="px-5 py-5">
            <SectionHeader>{t('listing_id_label')}</SectionHeader>
            <TextInput
              type="text"
              placeholder={t('listing_id_placeholder')}
              value={local.listing_id ?? ''}
              onChange={e => update({ listing_id: e.currentTarget.value || undefined })}
            />
          </div>

        </div>
      )}
    </MantineDrawer>
  )
}
