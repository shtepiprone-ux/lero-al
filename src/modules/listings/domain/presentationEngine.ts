/**
 * Schema-driven Presentation Engine — Phase 4 of the Dynamic Form Engine.
 *
 * Canonical source of truth for:
 *  – getCardFeatures()     → compact feature chips for listing cards
 *  – getDetailFeatures()   → key-features grid for listing detail pages
 *  – getDetailAttributes() → additional-attributes section (condition / heating / wall_type)
 *
 * Presentation metadata lives in FIELD_DEFAULTS in propertyTypeSchema.ts.
 * This engine iterates the schema and produces typed output that replaces
 * all previously manual feature-array construction in ListingCard and detail page.
 */

import { getSchema } from './propertyTypeSchema'
import type { FieldDefinition, PresentationIcon } from './listingFields'

// ── Input type ────────────────────────────────────────────────────────────────

/**
 * Subset of the DB Listing row that the presentation engine needs.
 * Both ListingCard and the detail page supply objects that satisfy this shape.
 */
export interface ListingSnapshot {
  property_type:  string
  rooms?:         number | null
  bedrooms?:      number | null
  bathrooms?:     number | null
  toilets?:       number | null
  area_gross?:    number | null
  area_net?:      number | null
  floor?:         number | null
  total_floors?:  number | null
  year_built?:    number | null
  condition?:     string | null
  heating?:       string | null
  wall_type?:     string | null
}

// ── Output types ──────────────────────────────────────────────────────────────

/** One feature chip in the listing card (no label, just icon + formatted value). */
export interface CardFeature {
  key:   string
  icon:  PresentationIcon
  value: string
}

/** One row in the key-features grid on the detail page. */
export interface DetailFeature {
  key:      string
  icon:     PresentationIcon
  /** i18n key for the field label (caller calls t(labelKey)). */
  labelKey: string
  value:    string
}

/** One row in the additional-attributes section (label + translated enum value). */
export interface DetailAttribute {
  /** i18n key for the row label (caller calls t(labelKey)). */
  labelKey: string
  /** i18n key for the enum value (caller calls t(valueKey)). */
  valueKey: string
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Returns all field definitions from the fallback schema.
 * FIELD_DEFAULTS (which contains presentation metadata) is merged into every
 * schema's fields by makeFields() — the fallback schema carries the same
 * presentation metadata as any other schema, so it can represent all fields.
 */
function allFields(): FieldDefinition[] {
  return getSchema('').ui.fields
}

function floorValue(listing: ListingSnapshot): string {
  const floor = listing.floor
  const total = listing.total_floors
  return total ? `${floor}/${total}` : String(floor)
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns compact feature chips for the listing card.
 * Preserves the exact same fields and formatting as the previous manual code:
 *   rooms → bed-double icon
 *   bathrooms → bath icon
 *   area_gross → "N m²" with area icon
 *   floor (including 0 = ground floor) → "N/M" or "N" with building icon
 */
export function getCardFeatures(listing: ListingSnapshot): CardFeature[] {
  const features: CardFeature[] = []

  for (const fieldDef of allFields()) {
    const pres = fieldDef.presentation
    if (!pres?.showInCard) continue

    const icon = pres.iconInCard ?? pres.icon
    if (!icon) continue

    const { key } = fieldDef

    if (key === 'area') {
      if (listing.area_gross != null) {
        features.push({ key: 'area_gross', icon, value: `${listing.area_gross} m²` })
      }
      continue
    }

    if (key === 'floor') {
      if (listing.floor != null) {  // explicit: floor=0 (ground floor) is valid and shown
        features.push({ key: 'floor', icon, value: floorValue(listing) })
      }
      continue
    }

    const raw = (listing as unknown as Record<string, unknown>)[key]
    if (raw != null) {
      features.push({ key, icon, value: String(raw) })
    }
  }

  return features.sort((a, b) => {
    const order = (key: string) =>
      allFields().find(f => f.key === key || (key === 'area_gross' && f.key === 'area'))
        ?.presentation?.order ?? 99
    return order(a.key) - order(b.key)
  })
}

/**
 * Returns the key-features grid items for the listing detail page.
 * Produces two items for the 'area' field when both area_gross and area_net are present.
 * Exact match for the previous manual features[] array in the detail page.
 */
export function getDetailFeatures(listing: ListingSnapshot): DetailFeature[] {
  const features: DetailFeature[] = []

  for (const fieldDef of allFields()) {
    const pres = fieldDef.presentation
    if (!pres?.showInDetail) continue

    const icon = pres.icon
    if (!icon) continue

    const { key } = fieldDef

    // area expands to area_gross + area_net (two rows)
    if (key === 'area') {
      if (listing.area_gross != null) {
        features.push({ key: 'area_gross', icon, labelKey: 'area_gross_label', value: `${listing.area_gross} m²` })
      }
      if (listing.area_net != null) {
        features.push({ key: 'area_net', icon, labelKey: 'area_net', value: `${listing.area_net} m²` })
      }
      continue
    }

    // floor is a compound: floor + optional /total_floors
    if (key === 'floor') {
      if (listing.floor != null) {  // explicit: floor=0 (ground floor) is valid and shown
        features.push({ key: 'floor', icon, labelKey: 'floor', value: floorValue(listing) })
      }
      continue
    }

    const raw = (listing as unknown as Record<string, unknown>)[key]
    if (raw != null) {
      features.push({ key, icon, labelKey: key, value: String(raw) })
    }
  }

  return features
}

/**
 * Returns the additional-attributes section items (condition, heating, wall_type).
 * The caller translates both labelKey and valueKey via t().
 */
export function getDetailAttributes(listing: ListingSnapshot): DetailAttribute[] {
  const attrs: DetailAttribute[] = []

  for (const fieldDef of allFields()) {
    const pres = fieldDef.presentation
    if (!pres?.showInAttrs || !pres.valueKeyPrefix) continue

    const raw = (listing as unknown as Record<string, unknown>)[fieldDef.key]
    if (!raw) continue

    attrs.push({
      labelKey: `${fieldDef.key}_label`,
      valueKey: `${pres.valueKeyPrefix}_${raw}`,
    })
  }

  return attrs.sort((a, b) => {
    const order = (lk: string) => {
      const key = lk.replace('_label', '')
      return allFields().find(f => f.key === key)?.presentation?.order ?? 99
    }
    return order(a.labelKey) - order(b.labelKey)
  })
}
