/**
 * Property Type Schema Engine — Dynamic Form Engine (DFE)
 *
 * Single source of truth for all property-type-driven behaviour.
 * Replaces the former filterSections + form.hiddenFields model with
 * an explicit FieldDefinition registry so that UI rendering, validation,
 * and filter visibility are all derived from one consistent schema.
 *
 * Consumers:
 *  – DynamicFieldSection  (form field rendering via ui.fields)
 *  – ListingFormShell     (field-clearing on type change, submit payload)
 *  – validations/index    (required-field enforcement via ui.fields)
 *  – ListingsFilters      (filter-panel sections via ui.filters)
 *  – FiltersPanel         (filter-panel sections via ui.filters)
 *  – StepDetails          (form field visibility via ui.fields)
 *  – SSR listings page / API listings route (floor safety via helper fns)
 */

import type { FieldDefinition, FieldFilter, FieldPresentation, ListingField } from './listingFields'

// ── Schema shape ──────────────────────────────────────────────────────────────

export interface PropertyTypeSchema {
  /**
   * Unified UI model.
   *
   * fields:  Complete FieldDefinition[] for every ListingField.
   *          Drives form rendering (via DynamicFieldSection) and validation.
   *          `visible: true` → field appears in the form for this property type.
   *          `required: true` → form cannot be submitted without this field.
   *
   * filters: Subset of ListingField values shown as filter-panel accordions.
   *          Every entry must exist as a key in fields (subset guarantee).
   */
  ui: {
    fields:  FieldDefinition[]
    filters: readonly ListingField[]
  }

  /**
   * Floor-specific constraints applied in form UI, filter UI, Zod validation,
   * and API/SSR query safety guards.
   *
   * Building floors (house) vs total floors (apartment companion) distinction is
   * now driven by ui.fields['building_floors'].visible /
   * ui.fields['floors_total'].visible — no separate flag needed.
   */
  floor: {
    allowNegative:    boolean  // May floor value be < 0?
    minFloor:         number   // Lowest accepted value (-10 or 0)
    requiresCheckbox: boolean  // Floor input gated behind multi_storey_building checkbox
  }
}

// ── Field rendering metadata (static, per-field) ─────────────────────────────

/**
 * Default componentType, group, and ownedBy for each ListingField.
 * These are rendering-layer constants that never change per property type.
 * makeFields() merges them with per-type visibility + required flags.
 */
type FieldMeta = Pick<FieldDefinition, 'componentType' | 'group' | 'ownedBy' | 'filter' | 'presentation'>

// ── Per-field metadata helpers ────────────────────────────────────────────────

const f = (filter: FieldFilter): FieldFilter => filter
const p = (presentation: FieldPresentation): FieldPresentation => presentation

const FIELD_DEFAULTS: Record<ListingField, FieldMeta> = {
  rooms: {
    componentType: 'rooms-selector',
    filter: f({ queryParam: 'rooms', operator: 'rooms-select', multi: true }),
    presentation: p({ showInCard: true, showInDetail: true, icon: 'home', iconInCard: 'bed-double', formatter: 'number', featureGroup: 'primary', order: 1 }),
  },
  bedrooms: {
    componentType: 'num-input', group: 'num-grid',
    presentation: p({ showInDetail: true, icon: 'bed-double', formatter: 'number', featureGroup: 'primary', order: 2 }),
  },
  bathrooms: {
    componentType: 'num-input', group: 'num-grid',
    presentation: p({ showInCard: true, showInDetail: true, icon: 'bath', formatter: 'number', featureGroup: 'primary', order: 3 }),
  },
  toilets: {
    componentType: 'num-input', group: 'num-grid',
    presentation: p({ showInDetail: true, icon: 'bath', formatter: 'number', featureGroup: 'primary', order: 4 }),
  },
  area: {
    componentType: 'area-pair',
    filter: f({ queryParam: 'area', dbColumn: 'area_gross', operator: 'between', rangeMin: 0 }),
    presentation: p({ showInCard: true, showInDetail: true, icon: 'area', formatter: 'area', featureGroup: 'primary', order: 5 }),
  },
  building_floors: { componentType: 'building-floors' }, // form-only; filter uses floors_total; no presentation
  floor: {
    componentType: 'floor-group',
    filter: f({ queryParam: 'floor', operator: 'floor-range', rangeMin: -10, rangeMax: 200 }),
    presentation: p({ showInCard: true, showInDetail: true, icon: 'layers', iconInCard: 'building', formatter: 'floor', featureGroup: 'primary', order: 6 }),
  },
  floors_total: {
    componentType: 'num-input',
    ownedBy: 'floor',
    filter: f({ queryParam: 'floors_total', dbColumn: 'total_floors', operator: 'between', rangeMin: 1 }),
  },
  year_built: {
    componentType: 'year-combobox',
    filter: f({ queryParam: 'year_built', operator: 'between', rangeMin: 1950 }),
    presentation: p({ showInDetail: true, icon: 'calendar', formatter: 'year', featureGroup: 'primary', order: 7 }),
  },
  condition: {
    componentType: 'enum-selector',
    filter: f({ queryParam: 'condition', operator: 'eq' }),
    presentation: p({ showInAttrs: true, featureGroup: 'building', order: 1, valueKeyPrefix: 'condition' }),
  },
  heating: {
    componentType: 'button-group',
    filter: f({ queryParam: 'heating', operator: 'eq' }),
    presentation: p({ showInAttrs: true, featureGroup: 'building', order: 2, valueKeyPrefix: 'heating' }),
  },
  wall_type: {
    componentType: 'button-group',
    filter: f({ queryParam: 'wall_type', operator: 'eq' }),
    presentation: p({ showInAttrs: true, featureGroup: 'building', order: 3, valueKeyPrefix: 'wall' }),
  },
  market_type: {
    componentType: 'filter-only',
    filter: f({ queryParam: 'market_type', operator: 'eq' }),
  },
  layout_features: {
    componentType: 'filter-only',
    filter: f({ queryParam: 'layout_features', operator: 'contains', multi: true }),
  },
  offer_type: {
    componentType: 'filter-only',
    filter: f({ queryParam: 'offer_type', operator: 'eq' }),
  },
  purchase_conditions: {
    componentType: 'filter-only',
    filter: f({ queryParam: 'purchase_conditions', operator: 'overlaps', multi: true }),
  },
  land_legal_status:          { componentType: 'enum-selector' },
  land_zoning:                { componentType: 'enum-selector' },
  land_development_potential: { componentType: 'enum-selector' },
}

// ── Render-order registry ─────────────────────────────────────────────────────

/**
 * Canonical render order for form fields.
 * The DynamicFieldSection iterates this order — schema order IS UI order.
 * Matches the hand-crafted JSX order that was in ListingFormShell before Phase 2.
 */
const ALL_FIELD_KEYS: readonly ListingField[] = [
  'rooms',
  'bedrooms', 'bathrooms', 'toilets',       // grid group 'num-grid'
  'area',
  'building_floors',
  'floor', 'floors_total',                   // floors_total ownedBy 'floor'
  'year_built',
  'condition', 'heating', 'wall_type',
  'market_type', 'layout_features', 'offer_type', 'purchase_conditions',
  'land_legal_status', 'land_zoning', 'land_development_potential',
]

// ── Field-definition helper ───────────────────────────────────────────────────

/**
 * Generates the complete FieldDefinition[] for a property type.
 * Every key in ALL_FIELD_KEYS is always present so the renderer never
 * encounters undefined — fields the type doesn't use get visible: false.
 */
function makeFields(
  visible:  readonly ListingField[],
  required: readonly ListingField[] = [],
): FieldDefinition[] {
  return ALL_FIELD_KEYS.map(key => ({
    key,
    visible:  visible.includes(key),
    required: required.includes(key),
    ...FIELD_DEFAULTS[key],
  }))
}

// ── Per-type schema definitions ───────────────────────────────────────────────

const SCHEMA_APARTMENT: PropertyTypeSchema = {
  ui: {
    fields: makeFields([
      'rooms', 'bedrooms', 'bathrooms', 'toilets',
      'floor', 'floors_total',
      'area', 'year_built', 'condition', 'heating', 'wall_type',
    ]),
    filters: [
      'rooms', 'floor', 'floors_total', 'area', 'year_built',
      'condition', 'heating', 'wall_type',
      'market_type', 'layout_features', 'offer_type', 'purchase_conditions',
    ],
  },
  floor: { allowNegative: false, minFloor: 0, requiresCheckbox: false },
}

const SCHEMA_HOUSE: PropertyTypeSchema = {
  ui: {
    fields: makeFields([
      'rooms', 'bedrooms', 'bathrooms', 'toilets',
      'building_floors',                           // standalone; writes to total_floors column
      'area', 'year_built', 'condition', 'heating', 'wall_type',
    ]),
    filters: [
      'rooms', 'floors_total',                     // filter panel uses floors_total key
      'area', 'year_built', 'condition', 'heating', 'wall_type',
      'offer_type', 'purchase_conditions',
    ],
  },
  floor: { allowNegative: false, minFloor: 0, requiresCheckbox: false },
}

const SCHEMA_ROOM: PropertyTypeSchema = {
  ui: {
    fields: makeFields(['floor', 'floors_total', 'area', 'condition', 'heating']),
    filters: ['floor', 'floors_total', 'area', 'condition', 'heating', 'offer_type'],
  },
  floor: { allowNegative: false, minFloor: 0, requiresCheckbox: false },
}

const SCHEMA_LAND: PropertyTypeSchema = {
  ui: {
    fields: makeFields(
      ['area', 'land_legal_status', 'land_zoning', 'land_development_potential'],
      ['land_legal_status', 'land_zoning', 'land_development_potential'],
    ),
    filters: ['area', 'offer_type', 'purchase_conditions'],
  },
  floor: { allowNegative: false, minFloor: 0, requiresCheckbox: false },
}

const SCHEMA_COMMERCIAL: PropertyTypeSchema = {
  ui: {
    fields: makeFields([
      'rooms', 'bathrooms', 'toilets',             // bedrooms excluded
      'floor', 'floors_total',
      'area', 'condition',
    ]),
    filters: ['rooms', 'area', 'floor', 'floors_total', 'condition', 'offer_type', 'purchase_conditions'],
  },
  floor: { allowNegative: false, minFloor: 0, requiresCheckbox: false },
}

const SCHEMA_OFFICE: PropertyTypeSchema = {
  ui: {
    fields: makeFields([
      'rooms', 'bathrooms', 'toilets',             // bedrooms excluded
      'floor', 'floors_total',
      'area', 'condition', 'heating',
    ]),
    filters: ['rooms', 'area', 'floor', 'floors_total', 'condition', 'heating', 'offer_type', 'purchase_conditions'],
  },
  floor: { allowNegative: false, minFloor: 0, requiresCheckbox: false },
}

const SCHEMA_GARAGE: PropertyTypeSchema = {
  ui: {
    fields: makeFields([
      'floor',                                     // gated behind requiresCheckbox
      'area', 'condition',
    ]),
    filters: ['area', 'floor', 'condition', 'offer_type'],
  },
  floor: { allowNegative: true, minFloor: -10, requiresCheckbox: true },
}

const SCHEMA_PARKING: PropertyTypeSchema = {
  ui: {
    fields: makeFields([
      'floor',                                     // gated behind requiresCheckbox
      'area', 'condition',
    ]),
    filters: ['area', 'floor', 'condition', 'offer_type'],
  },
  floor: { allowNegative: true, minFloor: -10, requiresCheckbox: true },
}

const SCHEMA_WAREHOUSE: PropertyTypeSchema = {
  ui: {
    fields: makeFields([
      'floor',                                     // gated behind requiresCheckbox
      'area', 'condition',
    ]),
    filters: ['area', 'floor', 'condition', 'offer_type', 'purchase_conditions'],
  },
  floor: { allowNegative: true, minFloor: -10, requiresCheckbox: true },
}

const SCHEMA_OTHER: PropertyTypeSchema = {
  ui: {
    fields: makeFields([
      'floor', 'floors_total',                     // floor gated behind requiresCheckbox
      'area', 'condition',
    ]),
    filters: ['area', 'floor', 'floors_total', 'condition', 'offer_type'],
  },
  floor: { allowNegative: true, minFloor: -10, requiresCheckbox: true },
}

// ── Registry ──────────────────────────────────────────────────────────────────

export const PROPERTY_TYPE_SCHEMA: Record<string, PropertyTypeSchema> = {
  apartment: SCHEMA_APARTMENT,
  house:     SCHEMA_HOUSE,
  room:      SCHEMA_ROOM,
  land:      SCHEMA_LAND,
  commercial:SCHEMA_COMMERCIAL,
  office:    SCHEMA_OFFICE,
  garage:    SCHEMA_GARAGE,
  parking:   SCHEMA_PARKING,
  warehouse: SCHEMA_WAREHOUSE,
  other:     SCHEMA_OTHER,
}

// ── Public helpers ────────────────────────────────────────────────────────────

/**
 * Returns the schema for a property type.
 * Falls back to SCHEMA_OTHER for unknown or empty strings.
 */
export function getSchema(propertyType: string): PropertyTypeSchema {
  return PROPERTY_TYPE_SCHEMA[propertyType] ?? SCHEMA_OTHER
}

/**
 * Minimum floor value accepted by search filters for a property type.
 * Used by: ListingsFilters, FiltersPanel, API route, SSR listings page.
 */
export function getFloorFilterMin(propertyType: string): number {
  return getSchema(propertyType).floor.minFloor
}

/**
 * Returns all property type keys that support underground floor values.
 * Used by API/SSR to add `property_type IN (...)` constraint when a negative
 * floor filter is applied without an explicit property type.
 */
export function getUndergroundFloorTypes(): string[] {
  return Object.entries(PROPERTY_TYPE_SCHEMA)
    .filter(([, s]) => s.floor.allowNegative)
    .map(([pt]) => pt)
}
