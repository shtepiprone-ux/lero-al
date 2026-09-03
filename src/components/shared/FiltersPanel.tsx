'use client'

import { useTranslations } from 'next-intl'
import { RotateCcw } from 'lucide-react'
import { Button, TextInput, Group, Text, Badge, Stack, SimpleGrid, Flex } from '@mantine/core'
import { MantineDrawer, MantineCountButton, RangeDatePicker, MantineFilterSection } from '@/design-system/mantine/patterns'
import type { FilterValues } from '@/modules/listings/domain/filterEngine'
export type { FilterValues }
import {
  CONDITIONS, HEATING_TYPES, WALL_TYPES,
  MARKET_TYPES, LAYOUT_FEATURES, OFFER_TYPES, PURCHASE_CONDITIONS,
} from '@/modules/listings/constants'
import { LocationCombobox, type LocationOption } from '@/components/shared/LocationCombobox'
import { YearCombobox } from '@/components/shared/YearCombobox'
import { FilterRangeInputs } from '@/components/shared/FilterRangeInputs'
import { FilterChoiceGroup } from '@/components/shared/FilterChoiceGroup'
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

function positiveNum(v: string): number | undefined {
  const n = parseInt(v)
  return !isNaN(n) && n >= 1 ? n : undefined
}

// Fixed render order of every section — mirrors the JSX below exactly. Used only to derive
// which section is the first VISIBLE one (§3.4 D3), never to hardcode a divider index: a
// section's presence still comes from `sectionVisibility`, computed from the live `shows()`
// predicate on every render, so a shows()-changing property-type selection is reflected here too.
const SECTION_ORDER = [
  'location', 'property_type', 'market_type', 'price', 'area', 'rooms', 'floor',
  'floors_total', 'year_built', 'condition', 'layout_features', 'heating', 'wall_type',
  'offer_type', 'purchase_conditions', 'period', 'listing_id',
] as const

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

  // Location, Property type, Price, Period and Search-by-ID always render; the rest are gated
  // by `shows(...)`. Only the first VISIBLE section in this list omits its top divider (D3).
  const sectionVisibility: Record<(typeof SECTION_ORDER)[number], boolean> = {
    location: true,
    property_type: true,
    market_type: shows('market_type'),
    price: true,
    area: shows('area'),
    rooms: shows('rooms'),
    floor: shows('floor'),
    floors_total: shows('floors_total'),
    year_built: shows('year_built'),
    condition: shows('condition'),
    layout_features: shows('layout_features'),
    heating: shows('heating'),
    wall_type: shows('wall_type'),
    offer_type: shows('offer_type'),
    purchase_conditions: shows('purchase_conditions'),
    period: true,
    listing_id: true,
  }
  const firstVisibleSection = SECTION_ORDER.find(key => sectionVisibility[key])
  const withTopDivider = (key: (typeof SECTION_ORDER)[number]) => key !== firstVisibleSection

  return (
    <MantineDrawer
      opened={open}
      onClose={onClose}
      side="right"
      size="sm"
      title={
        <Group gap="xs">
          <Text component="span" fw={600} size="md">{t('advanced_filters')}</Text>
          {activeCount > 0 && (
            <Badge size="sm" color="brand" variant="filled">
              {activeCount}
            </Badge>
          )}
        </Group>
      }
      footer={
        <Stack gap="sm">
          {/* Task 567 round-2 Fix 3: count renders inline in Button's rightSection via the
              canonical MantineCountButton primitive — replaces the round-1 absolute corner
              badge, which Mantine Button's own overflow:hidden root was genuinely clipping. */}
          <MantineCountButton fullWidth count={activeCount} onClick={handleApply}>
            {t('apply_filters')}
          </MantineCountButton>
          <Button variant="default" fullWidth leftSection={<RotateCcw size={16} />} onClick={handleReset}>
            {t('reset_filters')}
          </Button>
        </Stack>
      }
    >
      {contentReady && (
        <>

          {/* Location */}
          <MantineFilterSection label={t('location')} withDivider={withTopDivider('location')}>
            <LocationCombobox
              locations={cityRegionLocs}
              value={local.location_id ?? ''}
              onChange={id => update({ location_id: id ?? undefined })}
              portal
            />
          </MantineFilterSection>

          {/* Property type */}
          <MantineFilterSection label={t('property_type')} withDivider={withTopDivider('property_type')}>
            <SimpleGrid cols={2} spacing="xs" aria-label={t('property_type')}>
              <Button
                variant={!local.property_type ? 'light' : 'default'}
                justify="flex-start"
                onClick={() => handlePropertyTypeChange(undefined)}
              >
                {t('all_types')}
              </Button>
              {propertyTypes.map(pt => (
                <Button
                  key={pt.value}
                  variant={local.property_type === pt.value ? 'light' : 'default'}
                  justify="flex-start"
                  onClick={() => handlePropertyTypeChange(local.property_type === pt.value ? undefined : pt.value)}
                >
                  {pt.label}
                </Button>
              ))}
            </SimpleGrid>
          </MantineFilterSection>

          {/* Market type */}
          {shows('market_type') && (
            <MantineFilterSection label={t('market_type')} withDivider={withTopDivider('market_type')}>
              {/* Task 567 round-2 Fix 1: sm:flex-wrap + w-full sm:w-auto (NOT flex-1) — a row
                  that no longer fits its drawer width wraps whole buttons to the next line
                  instead of squeezing them until a word breaks mid-character. */}
              <Flex direction={{ base: 'column', sm: 'row' }} wrap={{ base: 'nowrap', sm: 'wrap' }} gap="xs">
                <Button
                  variant={!local.market_type ? 'light' : 'default'}
                  w={{ base: '100%', sm: 'auto' }}
                  onClick={() => update({ market_type: undefined })}
                >
                  {t('all')}
                </Button>
                {MARKET_TYPES.map(mt => (
                  <Button
                    key={mt.value}
                    variant={local.market_type === mt.value ? 'light' : 'default'}
                    w={{ base: '100%', sm: 'auto' }}
                    onClick={() => update({ market_type: local.market_type === mt.value ? undefined : mt.value })}
                  >
                    {tl(mt.labelKey)}
                  </Button>
                ))}
              </Flex>
            </MantineFilterSection>
          )}

          {/* Price */}
          <MantineFilterSection label={priceLabel} withDivider={withTopDivider('price')}>
            <FilterRangeInputs
              minValue={local.price_min?.toString() ?? ''}
              maxValue={local.price_max?.toString() ?? ''}
              onMinChange={v => update({ price_min: v ? Number(v) : undefined })}
              onMaxChange={v => update({ price_max: v ? Number(v) : undefined })}
              minPlaceholder={t('min')}
              maxPlaceholder={t('max')}
            />
          </MantineFilterSection>

          {/* Area — area_range already includes "(m²)" in translation */}
          {shows('area') && (
            <MantineFilterSection label={t('area_range')} withDivider={withTopDivider('area')}>
              <FilterRangeInputs
                min={0}
                minValue={local.area_min?.toString() ?? ''}
                maxValue={local.area_max?.toString() ?? ''}
                onMinChange={v => update({ area_min: v !== '' ? Math.max(0, Number(v)) : undefined })}
                onMaxChange={v => update({ area_max: v ? Number(v) : undefined })}
                minPlaceholder={t('min')}
                maxPlaceholder={t('max')}
              />
            </MantineFilterSection>
          )}

          {/* Rooms */}
          {shows('rooms') && (
            <MantineFilterSection label={t('rooms_label')} withDivider={withTopDivider('rooms')}>
              <FilterRoomsRow
                selected={local.rooms?.map(String) ?? []}
                onToggle={v => {
                  const n = Number(v)
                  const current = local.rooms ?? []
                  const next = current.includes(n) ? current.filter(r => r !== n) : [...current, n]
                  update({ rooms: next.length > 0 ? next : undefined })
                }}
                ariaLabel={t('rooms_label')}
              />
            </MantineFilterSection>
          )}

          {/* Floor — domain-aware min (negative for garage/parking/warehouse, 0 otherwise) */}
          {shows('floor') && (
            <MantineFilterSection label={t('floor_range')} withDivider={withTopDivider('floor')}>
              <FilterRangeInputs
                min={floorFilterMin}
                minValue={local.floor_min?.toString() ?? ''}
                maxValue={local.floor_max?.toString() ?? ''}
                onMinChange={v => { const n = parseInt(v); update({ floor_min: !isNaN(n) && n >= floorFilterMin ? n : undefined }) }}
                onMaxChange={v => { const n = parseInt(v); update({ floor_max: !isNaN(n) ? n : undefined }) }}
                minPlaceholder={t('min')}
                maxPlaceholder={t('max')}
              />
            </MantineFilterSection>
          )}

          {/* Building floors — min 1 */}
          {shows('floors_total') && (
            <MantineFilterSection label={t('floors_total_range')} withDivider={withTopDivider('floors_total')}>
              <FilterRangeInputs
                min={1}
                minValue={local.floors_total_min?.toString() ?? ''}
                maxValue={local.floors_total_max?.toString() ?? ''}
                onMinChange={v => update({ floors_total_min: positiveNum(v) })}
                onMaxChange={v => update({ floors_total_max: positiveNum(v) })}
                minPlaceholder={t('min')}
                maxPlaceholder={t('max')}
              />
            </MantineFilterSection>
          )}

          {/* Year built — dropdown per dom.ria.com */}
          {shows('year_built') && (
            <MantineFilterSection label={t('year_built_range')} withDivider={withTopDivider('year_built')}>
              <SimpleGrid cols={2} spacing="xs">
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
              </SimpleGrid>
            </MantineFilterSection>
          )}

          {/* Condition — multi-select */}
          {shows('condition') && (
            <MantineFilterSection label={t('condition')} withDivider={withTopDivider('condition')}>
              <FilterChoiceGroup
                mode="multiple"
                options={CONDITIONS}
                selected={local.conditions ?? []}
                onToggle={v => {
                  const current = local.conditions ?? []
                  const next = current.includes(v) ? current.filter(x => x !== v) : [...current, v]
                  update({ conditions: next.length > 0 ? next : undefined })
                }}
                getLabel={k => tl(k)}
                ariaLabel={t('condition')}
              />
            </MantineFilterSection>
          )}

          {/* Layout features */}
          {shows('layout_features') && (
            <MantineFilterSection label={t('layout_features')} withDivider={withTopDivider('layout_features')}>
              <FilterChoiceGroup
                mode="multiple"
                options={LAYOUT_FEATURES}
                selected={local.layout_features ?? []}
                onToggle={v => {
                  const current = local.layout_features ?? []
                  const next = current.includes(v) ? current.filter(x => x !== v) : [...current, v]
                  update({ layout_features: next.length > 0 ? next : undefined })
                }}
                getLabel={k => tl(k)}
                ariaLabel={t('layout_features')}
              />
            </MantineFilterSection>
          )}

          {/* Heating — multi-select */}
          {shows('heating') && (
            <MantineFilterSection label={t('heating')} withDivider={withTopDivider('heating')}>
              <FilterChoiceGroup
                mode="multiple"
                options={HEATING_TYPES}
                selected={local.heating_types ?? []}
                onToggle={v => {
                  const current = local.heating_types ?? []
                  const next = current.includes(v) ? current.filter(x => x !== v) : [...current, v]
                  update({ heating_types: next.length > 0 ? next : undefined })
                }}
                getLabel={k => tl(k)}
                ariaLabel={t('heating')}
              />
            </MantineFilterSection>
          )}

          {/* Wall type — multi-select */}
          {shows('wall_type') && (
            <MantineFilterSection label={t('wall_type')} withDivider={withTopDivider('wall_type')}>
              <FilterChoiceGroup
                mode="multiple"
                options={WALL_TYPES}
                selected={local.wall_types ?? []}
                onToggle={v => {
                  const current = local.wall_types ?? []
                  const next = current.includes(v) ? current.filter(x => x !== v) : [...current, v]
                  update({ wall_types: next.length > 0 ? next : undefined })
                }}
                getLabel={k => tl(k)}
                ariaLabel={t('wall_type')}
              />
            </MantineFilterSection>
          )}

          {/* Offer type — multi-select */}
          {shows('offer_type') && (
            <MantineFilterSection label={t('offer_type')} withDivider={withTopDivider('offer_type')}>
              <FilterChoiceGroup
                mode="multiple"
                options={OFFER_TYPES}
                selected={local.offer_types ?? []}
                onToggle={v => {
                  const current = local.offer_types ?? []
                  const next = current.includes(v) ? current.filter(x => x !== v) : [...current, v]
                  update({ offer_types: next.length > 0 ? next : undefined })
                }}
                getLabel={k => tl(k)}
                ariaLabel={t('offer_type')}
              />
            </MantineFilterSection>
          )}

          {/* Purchase conditions */}
          {shows('purchase_conditions') && (
            <MantineFilterSection label={t('purchase_conditions')} withDivider={withTopDivider('purchase_conditions')}>
              <FilterChoiceGroup
                mode="multiple"
                options={PURCHASE_CONDITIONS}
                selected={local.purchase_conditions ?? []}
                onToggle={v => {
                  const current = local.purchase_conditions ?? []
                  const next = current.includes(v) ? current.filter(x => x !== v) : [...current, v]
                  update({ purchase_conditions: next.length > 0 ? next : undefined })
                }}
                getLabel={k => tl(k)}
                ariaLabel={t('purchase_conditions')}
              />
            </MantineFilterSection>
          )}

          {/* Posting period — range date picker (Task 559) */}
          <MantineFilterSection label={t('period')} withDivider={withTopDivider('period')}>
            <RangeDatePicker
              value={{ from: local.date_from, to: local.date_to }}
              onChange={next => update({ date_from: next.from, date_to: next.to })}
              maxDate={today}
            />
          </MantineFilterSection>

          {/* Search by ID */}
          <MantineFilterSection label={t('listing_id_label')} withDivider={withTopDivider('listing_id')}>
            <TextInput
              type="text"
              placeholder={t('listing_id_placeholder')}
              value={local.listing_id ?? ''}
              onChange={e => update({ listing_id: e.currentTarget.value || undefined })}
            />
          </MantineFilterSection>

        </>
      )}
    </MantineDrawer>
  )
}
