/**
 * Canonical field registry — single source of truth for every property-type-driven
 * field name used across form rendering, validation, filter UI, query generation,
 * and presentation (cards, detail pages, metadata).
 *
 * ALL schema, form, filter, query-engine, and presentation consumers MUST use
 * these types instead of raw string literals to get compile-time safety.
 */

// ── Field keys ────────────────────────────────────────────────────────────────

export type ListingField =
  | 'rooms'
  | 'bedrooms'
  | 'bathrooms'
  | 'toilets'
  | 'floor'
  | 'floors_total'           // companion input next to floor; also the filter-panel accordion key
  | 'building_floors'        // standalone "Building floors" input (house only; same DB col as floors_total)
  | 'area'
  | 'year_built'
  | 'condition'
  | 'heating'
  | 'wall_type'
  | 'market_type'            // filter-panel only — not rendered in create/edit form
  | 'layout_features'        // filter-panel only
  | 'offer_type'             // filter-panel only
  | 'purchase_conditions'    // filter-panel only
  | 'land_legal_status'
  | 'land_zoning'
  | 'land_development_potential'

// ── Rendering metadata (form) ─────────────────────────────────────────────────

export type FieldComponentType =
  | 'rooms-selector'     // 1–5+ button row
  | 'num-input'          // generic number input (bedrooms, bathrooms, toilets)
  | 'area-pair'          // area_gross + area_net side-by-side grid
  | 'year-combobox'      // YearCombobox dropdown
  | 'enum-selector'      // vertical full-width button list (condition, land fields)
  | 'button-group'       // horizontal button chip row (heating, wall_type)
  | 'floor-group'        // floor + multi_storey_building checkbox + floors_total companion
  | 'building-floors'    // standalone building floors NumInput (house only)
  | 'filter-only'        // not a form field; rendered exclusively by filter panel

// ── Filter metadata ───────────────────────────────────────────────────────────

export type FilterOperator =
  | 'eq'            // .eq(dbColumn, value)
  | 'between'       // .gte + .lte using {queryParam}_min / {queryParam}_max
  | 'contains'      // .contains(dbColumn, values) — array column
  | 'overlaps'      // .overlaps(dbColumn, values) — array column
  | 'rooms-select'  // multi-select with "5 or more" threshold
  | 'floor-range'   // range with underground-type safety constraint

export interface FieldFilter {
  queryParam:  string
  dbColumn?:   string
  operator:    FilterOperator
  rangeMin?:   number
  rangeMax?:   number
  multi?:      boolean
}

// ── Presentation metadata (card / detail page) ────────────────────────────────

/**
 * Lucide icon identifier used in listing cards and detail feature grids.
 * Resolved to actual React components by ListingFeatureIcon.
 */
export type PresentationIcon =
  | 'home'        // Home — rooms in detail features grid
  | 'bed-double'  // BedDouble — rooms in card, bedrooms
  | 'bath'        // Bath — bathrooms, toilets
  | 'area'        // Maximize2 — area
  | 'building'    // Building2 — floor in card
  | 'layers'      // Layers — floor in detail features grid
  | 'calendar'    // CalendarDays — year_built

/** Semantic grouping of features for the detail page. */
export type FeatureGroup =
  | 'primary'    // key stats: rooms, area, floor, year_built
  | 'building'   // property condition: condition, heating, wall_type
  | 'land'       // land classification (reserved for future use)

/**
 * How a field's value is formatted for display.
 * The presentation engine applies this when building CardFeature / DetailFeature output.
 */
export type FormatterType =
  | 'number'  // plain integer → "2"
  | 'area'    // → "{value} m²"   (reads area_gross; detail also reads area_net)
  | 'floor'   // compound → "{floor}/{total_floors}" or "{floor}"
  | 'year'    // → String(year)
  | 'enum'    // raw value passed through; component calls t(valueKey)

export interface FieldPresentation {
  /** Show as a compact feature chip in the listing card. */
  showInCard?:      boolean
  /** Show in the key-features grid on the listing detail page. */
  showInDetail?:    boolean
  /** Show in the additional-attributes section (label/value pairs, enum fields). */
  showInAttrs?:     boolean
  featureGroup?:    FeatureGroup
  /** Icon for the detail features grid. */
  icon?:            PresentationIcon
  /** Icon override for the card context when it differs from the detail icon. */
  iconInCard?:      PresentationIcon
  formatter?:       FormatterType
  /**
   * Prefix for enum-value translation keys: `{valueKeyPrefix}_{rawValue}`.
   * Required when showInAttrs is true.
   * Example: condition → 'condition' → condition_new_build
   *          wall_type → 'wall'      → wall_brick
   */
  valueKeyPrefix?:  string
  /** Sort order within the display context (card row or detail grid). */
  order?:           number
}

// ── Field definition ──────────────────────────────────────────────────────────

export interface FieldDefinition {
  key:           ListingField
  componentType: FieldComponentType
  /** Whether this field is rendered in the create/edit form for this property type. */
  visible:       boolean
  /** Whether this field must be filled before the form can submit. */
  required:      boolean
  /** Layout group key — fields sharing the same group render in a shared grid. */
  group?:        string
  /** When set, this field's rendering is owned by the named field's component. */
  ownedBy?:      ListingField
  /** Filter behavior. Absent for form-only fields. */
  filter?:       FieldFilter
  /** Presentation behavior. Absent for fields not shown in cards or detail pages. */
  presentation?: FieldPresentation
}
