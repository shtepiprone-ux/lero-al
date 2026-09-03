'use client'

import { useTranslations } from 'next-intl'
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { Button, TextInput, ActionIcon, Badge, Box, Divider, Group, SimpleGrid, Text, useMantineTheme } from '@mantine/core'
import {
  CONDITIONS, HEATING_TYPES, WALL_TYPES,
  MARKET_TYPES, LAYOUT_FEATURES, OFFER_TYPES, PURCHASE_CONDITIONS,
} from '@/modules/listings/constants'
import { LocationCombobox } from '@/components/shared/LocationCombobox'
import { YearCombobox } from '@/components/shared/YearCombobox'
import { RangeDatePicker } from '@/design-system/mantine/patterns'
import { FilterRangeInputs } from '@/components/shared/FilterRangeInputs'
import { FilterChoiceGroup } from '@/components/shared/FilterChoiceGroup'
import { FilterRoomsRow } from '@/components/shared/FilterRoomsRow'
import { useListingsUrlFilters } from '@/modules/listings/hooks/useListingsUrlFilters'

interface Location { id: number; name_al: string; type: string }
interface Props { locations: Location[]; onClose?: () => void }

// Fixed render order of every accordion section — mirrors the JSX below exactly. Used only to
// derive which visible section is LAST (so it omits its own bottom divider, mirroring the legacy
// `last:border-b-0`), never to hardcode a divider index: presence still comes from the live
// `shows()` predicate on every render.
// Task 781R (owner-directed, 2026-09-03): `type`, `market_type` and `property_type` are
// single-select toggle rows that previously hand-rolled three separate `SimpleGrid` + `Button`
// compositions, duplicating the canonical toggle-button pattern (`Mantine/Primitives/
// FilterControls` — §6a filled=selected/default=unselected) AND breaking wrap: `SimpleGrid`'s
// `cols` breakpoints key off the *viewport* width, not the drawer's own ~320px rendered width, so
// a fixed-column grid forced long labels (e.g. "Новобудова") into a too-narrow cell at any
// viewport ≥640px regardless of how narrow the side drawer itself is.
//
// `FilterMultiToggle` was generalized into `FilterChoiceGroup` (mode="multiple" | "single") for
// this fix, per owner instruction, 2026-09-03: the previous "pin `selected` to a one-item array"
// workaround faked single-select semantics on a multi-select-only component instead of modeling
// the real contract. `mode="single"` renders a wrapping `Group` (`wrap="wrap"` — sizes each
// button to its own label, wraps by the container's REAL rendered width, not a media query) with
// an explicit `allOption` and `allowDeselect`. `type`/`market_type` do not deselect on re-click
// (their original contract); `property_type` does (its original contract already toggled off).
const LISTING_TYPE_OPTIONS = [
  { value: 'sale', labelKey: 'sale' },
  { value: 'rent', labelKey: 'rent' },
] as const
const LISTING_TYPE_ALL_OPTION = { value: '', labelKey: 'all' }

const MARKET_TYPE_ALL_OPTION = { value: '', labelKey: 'all' }

const SECTION_ORDER = [
  'type', 'property_type', 'location', 'market_type', 'rooms', 'price', 'area',
  'floor', 'floors_total', 'condition', 'layout_features', 'year_built',
  'heating', 'wall_type', 'offer_type', 'purchase_conditions', 'period', 'listing_id',
] as const

function AccordionSection({
  title, open, onToggle, withDivider, children,
}: {
  title: string; open: boolean; onToggle: () => void; withDivider: boolean; children: React.ReactNode
}) {
  return (
    <Box>
      <Box py="md">
        <Button
          type="button"
          variant="subtle"
          fullWidth
          justify="space-between"
          onClick={onToggle}
          styles={{ root: { paddingInline: 0 } }}
          rightSection={
            <ChevronDown
              size={14}
              style={{
                color: 'var(--mantine-color-gray-5)',
                transition: 'transform 200ms ease',
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                flexShrink: 0,
              }}
            />
          }
        >
          <Text component="span" size="xs" fw={600} tt="uppercase" c="gray.5" style={{ letterSpacing: '0.05em' }}>
            {title}
          </Text>
        </Button>
        {open && <Box mt="sm">{children}</Box>}
      </Box>
      {withDivider && <Divider color="gray.3" />}
    </Box>
  )
}

export function ListingsFilters({ locations, onClose }: Props) {
  const t = useTranslations('listing')
  const tc = useTranslations('common')
  const theme = useMantineTheme()

  const {
    get, updateParams, toggleMulti,
    handlePropertyTypeChange, handleFloorChange, handleFloorsChange,
    sections, toggle,
    shows, floorFilterMin,
    currency, activeCount,
    selectedRooms, selectedConditions, selectedHeatingTypes,
    selectedWallTypes, selectedOfferTypes,
    selectedLayoutFeatures, selectedPurchaseConditions,
    today, rate, propertyTypes,
  } = useListingsUrlFilters()

  const priceLabel = `${tc('price_range')} (${currency})`

  const sectionVisibility: Record<(typeof SECTION_ORDER)[number], boolean> = {
    type: true,
    property_type: true,
    location: true,
    market_type: shows('market_type'),
    rooms: shows('rooms'),
    price: true,
    area: shows('area'),
    floor: shows('floor'),
    floors_total: shows('floors_total'),
    condition: shows('condition'),
    layout_features: shows('layout_features'),
    year_built: shows('year_built'),
    heating: shows('heating'),
    wall_type: shows('wall_type'),
    offer_type: shows('offer_type'),
    purchase_conditions: shows('purchase_conditions'),
    period: true,
    listing_id: true,
  }
  const lastVisibleSection = [...SECTION_ORDER].reverse().find(key => sectionVisibility[key])
  const withBottomDivider = (key: (typeof SECTION_ORDER)[number]) => key !== lastVisibleSection

  return (
    <Box>
      {/* Header */}
      <Group gap="xs" mb="md" wrap="nowrap">
        <SlidersHorizontal size={16} color="var(--mantine-color-brand-7)" />
        <Text fw={600} size="sm">{t('filters_title')}</Text>
        {activeCount > 0 && (
          <Badge color="brand" variant="filled" radius="pill">
            {activeCount}
          </Badge>
        )}
        {onClose && (
          <ActionIcon
            variant="subtle"
            mih={theme.other.touchTarget}
            miw={theme.other.touchTarget}
            onClick={onClose}
            aria-label={tc('close')}
            hiddenFrom="sm"
            style={{ marginLeft: 'auto' }}
          >
            <X size={20} />
          </ActionIcon>
        )}
      </Group>

      <Box>

        {/* Listing type */}
        <AccordionSection title={tc('listing_type')} open={sections.type} onToggle={() => toggle('type')} withDivider={withBottomDivider('type')}>
          <FilterChoiceGroup
            mode="single"
            options={LISTING_TYPE_OPTIONS}
            allOption={LISTING_TYPE_ALL_OPTION}
            selected={get('type') || ''}
            onChange={value => updateParams({ type: value || null })}
            getLabel={key => (key === 'all' ? tc('all') : t(key))}
            ariaLabel={tc('listing_type')}
          />
        </AccordionSection>

        {/* Property type */}
        <AccordionSection title={tc('property_type')} open={sections.property_type} onToggle={() => toggle('property_type')} withDivider={withBottomDivider('property_type')}>
          <FilterChoiceGroup
            mode="single"
            options={propertyTypes.map(pt => ({ value: pt.value, labelKey: pt.label }))}
            allOption={{ value: '', labelKey: 'all_types' }}
            selected={get('property_type') || ''}
            onChange={value => handlePropertyTypeChange(value || null)}
            allowDeselect
            variant="light"
            justify="flex-start"
            getLabel={key => (key === 'all_types' ? tc('all_types') : key)}
            ariaLabel={tc('property_type')}
          />
        </AccordionSection>

        {/* Location */}
        <AccordionSection title={tc('location')} open={sections.location} onToggle={() => toggle('location')} withDivider={withBottomDivider('location')}>
          <LocationCombobox
            locations={locations}
            value={get('location_id')}
            onChange={id => updateParams({ location_id: id })}
            portal
          />
        </AccordionSection>

        {/* Market type */}
        {shows('market_type') && (
          <AccordionSection title={tc('market_type')} open={sections.market_type} onToggle={() => toggle('market_type')} withDivider={withBottomDivider('market_type')}>
            <FilterChoiceGroup
              mode="single"
              options={MARKET_TYPES}
              allOption={MARKET_TYPE_ALL_OPTION}
              selected={get('market_type') || ''}
              onChange={value => updateParams({ market_type: value || null })}
              getLabel={key => (key === 'all' ? tc('all') : t(key))}
              ariaLabel={tc('market_type')}
            />
          </AccordionSection>
        )}

        {/* Rooms */}
        {shows('rooms') && (
          <AccordionSection title={tc('rooms_label')} open={sections.rooms} onToggle={() => toggle('rooms')} withDivider={withBottomDivider('rooms')}>
            <FilterRoomsRow
              selected={selectedRooms}
              onToggle={v => toggleMulti('rooms', v)}
              ariaLabel={tc('rooms_label')}
            />
          </AccordionSection>
        )}

        {/* Price */}
        <AccordionSection title={priceLabel} open={sections.price} onToggle={() => toggle('price')} withDivider={withBottomDivider('price')}>
          <FilterRangeInputs
            minValue={get('price_min')}
            maxValue={get('price_max')}
            onMinChange={v => updateParams({ price_min: v || null })}
            onMaxChange={v => updateParams({ price_max: v || null })}
            minPlaceholder={tc('min')}
            maxPlaceholder={tc('max')}
          />
          {currency !== 'ALL' && rate != null && (
            <Text size="xs" c="gray.5" mt="xs">
              {tc('exchange_rate')}:{' '}
              1 {currency} ≈ {rate.toFixed(2)} ALL
            </Text>
          )}
        </AccordionSection>

        {/* Area — area_range already includes "(m²)" in translation */}
        {shows('area') && (
          <AccordionSection title={tc('area_range')} open={sections.area} onToggle={() => toggle('area')} withDivider={withBottomDivider('area')}>
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
          <AccordionSection title={tc('floor_range')} open={sections.floor} onToggle={() => toggle('floor')} withDivider={withBottomDivider('floor')}>
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
          <AccordionSection title={tc('floors_total_range')} open={sections.floors_total} onToggle={() => toggle('floors_total')} withDivider={withBottomDivider('floors_total')}>
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

        {/* Condition — multi-select */}
        {shows('condition') && (
          <AccordionSection title={tc('condition')} open={sections.condition} onToggle={() => toggle('condition')} withDivider={withBottomDivider('condition')}>
            <FilterChoiceGroup
              mode="multiple"
              options={CONDITIONS}
              selected={selectedConditions}
              onToggle={v => toggleMulti('condition', v)}
              getLabel={k => t(k)}
              orientation="vertical"
              ariaLabel={tc('condition')}
            />
          </AccordionSection>
        )}

        {/* Layout features */}
        {shows('layout_features') && (
          <AccordionSection title={tc('layout_features')} open={sections.layout_features} onToggle={() => toggle('layout_features')} withDivider={withBottomDivider('layout_features')}>
            <FilterChoiceGroup
              mode="multiple"
              options={LAYOUT_FEATURES}
              selected={selectedLayoutFeatures}
              onToggle={v => toggleMulti('layout_features', v)}
              getLabel={k => t(k)}
              ariaLabel={tc('layout_features')}
            />
          </AccordionSection>
        )}

        {/* Year built — dropdown per dom.ria.com */}
        {shows('year_built') && (
          <AccordionSection title={tc('year_built_range')} open={sections.year_built} onToggle={() => toggle('year_built')} withDivider={withBottomDivider('year_built')}>
            <SimpleGrid cols={2} spacing="xs">
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
            </SimpleGrid>
          </AccordionSection>
        )}

        {/* Heating — multi-select */}
        {shows('heating') && (
          <AccordionSection title={tc('heating')} open={sections.heating} onToggle={() => toggle('heating')} withDivider={withBottomDivider('heating')}>
            <FilterChoiceGroup
              mode="multiple"
              options={HEATING_TYPES}
              selected={selectedHeatingTypes}
              onToggle={v => toggleMulti('heating', v)}
              getLabel={k => t(k)}
              ariaLabel={tc('heating')}
            />
          </AccordionSection>
        )}

        {/* Wall type — multi-select */}
        {shows('wall_type') && (
          <AccordionSection title={tc('wall_type')} open={sections.wall_type} onToggle={() => toggle('wall_type')} withDivider={withBottomDivider('wall_type')}>
            <FilterChoiceGroup
              mode="multiple"
              options={WALL_TYPES}
              selected={selectedWallTypes}
              onToggle={v => toggleMulti('wall_type', v)}
              getLabel={k => t(k)}
              ariaLabel={tc('wall_type')}
            />
          </AccordionSection>
        )}

        {/* Offer type — multi-select */}
        {shows('offer_type') && (
          <AccordionSection title={tc('offer_type')} open={sections.offer_type} onToggle={() => toggle('offer_type')} withDivider={withBottomDivider('offer_type')}>
            <FilterChoiceGroup
              mode="multiple"
              options={OFFER_TYPES}
              selected={selectedOfferTypes}
              onToggle={v => toggleMulti('offer_type', v)}
              getLabel={k => t(k)}
              orientation="vertical"
              ariaLabel={tc('offer_type')}
            />
          </AccordionSection>
        )}

        {/* Purchase conditions */}
        {shows('purchase_conditions') && (
          <AccordionSection title={tc('purchase_conditions')} open={sections.purchase_conditions} onToggle={() => toggle('purchase_conditions')} withDivider={withBottomDivider('purchase_conditions')}>
            <FilterChoiceGroup
              mode="multiple"
              options={PURCHASE_CONDITIONS}
              selected={selectedPurchaseConditions}
              onToggle={v => toggleMulti('purchase_conditions', v)}
              getLabel={k => t(k)}
              orientation="vertical"
              ariaLabel={tc('purchase_conditions')}
            />
          </AccordionSection>
        )}

        {/* Posting period — range date picker (Task 559) */}
        <AccordionSection title={tc('period')} open={sections.period} onToggle={() => toggle('period')} withDivider={withBottomDivider('period')}>
          <RangeDatePicker
            value={{ from: get('date_from') || undefined, to: get('date_to') || undefined }}
            onChange={next => updateParams({ date_from: next.from ?? null, date_to: next.to ?? null })}
            maxDate={today}
          />
        </AccordionSection>

        {/* Search by ID */}
        <AccordionSection title={tc('listing_id_label')} open={sections.listing_id} onToggle={() => toggle('listing_id')} withDivider={withBottomDivider('listing_id')}>
          <TextInput
            type="text"
            placeholder={tc('listing_id_placeholder')}
            value={get('listing_id')}
            onChange={e => updateParams({ listing_id: e.currentTarget.value || null })}
          />
        </AccordionSection>

      </Box>

      {/* Mobile apply button */}
      {onClose && (
        <Button fullWidth mt="md" hiddenFrom="sm" onClick={onClose}>
          {tc('apply_filters')}
          {activeCount > 0 && ` (${activeCount})`}
        </Button>
      )}
    </Box>
  )
}
