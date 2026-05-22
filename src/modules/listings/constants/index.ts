export const PROPERTY_TYPES = [
  { value: 'apartment', labelKey: 'property_type_apartment' },
  { value: 'house', labelKey: 'property_type_house' },
  { value: 'room', labelKey: 'property_type_room' },
  { value: 'land', labelKey: 'property_type_land' },
  { value: 'commercial', labelKey: 'property_type_commercial' },
  { value: 'office', labelKey: 'property_type_office' },
  { value: 'garage', labelKey: 'property_type_garage' },
  { value: 'parking', labelKey: 'property_type_parking' },
  { value: 'warehouse', labelKey: 'property_type_warehouse' },
  { value: 'other', labelKey: 'property_type_other' },
] as const

export const CONDITIONS = [
  { value: 'new_build', labelKey: 'condition_new_build' },
  { value: 'good', labelKey: 'condition_good' },
  { value: 'needs_repair', labelKey: 'condition_needs_repair' },
  { value: 'needs_renovation', labelKey: 'condition_needs_renovation' },
  { value: 'under_construction', labelKey: 'condition_under_construction' },
] as const

export const HEATING_TYPES = [
  { value: 'electric', labelKey: 'heating_electric' },
  { value: 'gas', labelKey: 'heating_gas' },
  { value: 'central', labelKey: 'heating_central' },
  { value: 'wood', labelKey: 'heating_wood' },
  { value: 'none', labelKey: 'heating_none' },
] as const

export const WALL_TYPES = [
  { value: 'brick', labelKey: 'wall_brick' },
  { value: 'concrete', labelKey: 'wall_concrete' },
  { value: 'panel', labelKey: 'wall_panel' },
  { value: 'wood', labelKey: 'wall_wood' },
  { value: 'other', labelKey: 'wall_other' },
] as const

export const MARKET_TYPES = [
  { value: 'secondary', labelKey: 'market_type_secondary' },
  { value: 'new_building', labelKey: 'market_type_new_building' },
] as const

export const LAYOUT_FEATURES = [
  { value: 'studio', labelKey: 'layout_studio' },
  { value: 'free_layout', labelKey: 'layout_free' },
  { value: 'duplex', labelKey: 'layout_duplex' },
  { value: 'penthouse', labelKey: 'layout_penthouse' },
  { value: 'small_family', labelKey: 'layout_small_family' },
] as const

export const OFFER_TYPES = [
  { value: 'owner', labelKey: 'offer_owner' },
  { value: 'agency', labelKey: 'offer_agency' },
  { value: 'developer', labelKey: 'offer_developer' },
] as const

export const PURCHASE_CONDITIONS = [
  { value: 'installment', labelKey: 'purchase_installment' },
  { value: 'mortgage', labelKey: 'purchase_mortgage' },
  { value: 'assignment', labelKey: 'purchase_assignment' },
  { value: 'negotiable', labelKey: 'purchase_negotiable' },
  { value: 'no_commission', labelKey: 'purchase_no_commission' },
] as const

export const LISTING_PERIODS = [
  { value: 'today', labelKey: 'period_today' },
  { value: '3days', labelKey: 'period_3days' },
  { value: 'week', labelKey: 'period_week' },
  { value: 'month', labelKey: 'period_month' },
] as const

export const ROOMS_OPTIONS = [1, 2, 3, 4, 5] as const

// All property-type-driven behavioural rules live in the schema engine.
// Import from '@/modules/listings/domain/propertyTypeSchema' for:
//   getSchema(), getFloorFilterMin(), getUndergroundFloorTypes()

export const LAND_LEGAL_STATUS = [
  { value: 'agricultural',         labelKey: 'land_legal_agricultural' },
  { value: 'urban',                labelKey: 'land_legal_urban' },
  { value: 'forest',               labelKey: 'land_legal_forest' },
  { value: 'pasture',              labelKey: 'land_legal_pasture' },
] as const

export const LAND_ZONING = [
  { value: 'residential',  labelKey: 'land_zoning_residential' },
  { value: 'commercial',   labelKey: 'land_zoning_commercial' },
  { value: 'tourism',      labelKey: 'land_zoning_tourism' },
  { value: 'industrial',   labelKey: 'land_zoning_industrial' },
  { value: 'mixed_use',    labelKey: 'land_zoning_mixed_use' },
] as const

export const LAND_DEVELOPMENT_POTENTIAL = [
  { value: 'buildable',                labelKey: 'land_dev_buildable' },
  { value: 'change_of_use_required',   labelKey: 'land_dev_change_of_use_required' },
  { value: 'non_buildable',            labelKey: 'land_dev_non_buildable' },
] as const

export const LISTINGS_PER_PAGE = 25
export const FAVORITES_PER_PAGE = 25
export const LISTING_NEW_DAYS = 7
export const MIN_PROPERTY_YEAR = 1950
// Days after which an archived listing gets noindex. Sourced from admin settings in the future.
export const ARCHIVED_NOINDEX_DAYS = 30

import type { ListingField } from '@/modules/listings/domain/listingFields'

// FilterSection is the subset of ListingField values that correspond to
// filter-panel accordion sections. It is a strict subset of ListingField so
// that ui.filters values are always type-safe against the canonical registry.
export type FilterSection = Extract<ListingField,
  | 'rooms' | 'floor' | 'floors_total' | 'area' | 'year_built'
  | 'condition' | 'heating' | 'wall_type' | 'market_type'
  | 'layout_features' | 'offer_type' | 'purchase_conditions'
>

// All possible filter sections — used as fallback when no property type is selected.
export const ALL_FILTER_SECTIONS: readonly FilterSection[] = [
  'rooms', 'floor', 'floors_total', 'area', 'year_built', 'condition',
  'heating', 'wall_type', 'market_type', 'layout_features', 'offer_type', 'purchase_conditions',
]

// Params that belong to each filter section (used for URL cleanup on type change)
export const FILTER_SECTION_PARAMS: Record<FilterSection, string[]> = {
  rooms:             ['rooms'],
  floor:             ['floor_min', 'floor_max'],
  floors_total:      ['floors_total_min', 'floors_total_max'],
  area:              [],
  year_built:        ['year_built_min', 'year_built_max'],
  condition:         ['condition'],
  heating:           ['heating'],
  wall_type:         ['wall_type'],
  market_type:       ['market_type'],
  layout_features:   ['layout_features'],
  offer_type:        ['offer_type'],
  purchase_conditions: ['purchase_conditions'],
}
