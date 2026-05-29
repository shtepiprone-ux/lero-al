/**
 * Canonical Filter + Query Engine — Phase 3 of the Dynamic Form Engine.
 *
 * Single source of truth for:
 *  – URL search-param parsing          → parseSearchParams()
 *  – Supabase query filter application → applyListingFilters()
 *  – Active filter count               → countActiveFilters()
 *  – Filter section visibility         → getFilterVisibility()
 *
 * Replaces duplicated procedural filter logic previously in:
 *  – src/app/api/listings/route.ts
 *  – src/app/[locale]/listings/page.tsx
 */

import { getSchema, getUndergroundFloorTypes, getFloorFilterMin } from './propertyTypeSchema'
import {
  ALL_FILTER_SECTIONS, type FilterSection,
  PROPERTY_TYPES, CONDITIONS, HEATING_TYPES, WALL_TYPES,
  MARKET_TYPES, OFFER_TYPES, PURCHASE_CONDITIONS, LAYOUT_FEATURES,
} from '../constants'
import type { ListingField } from './listingFields'

// ── Sort ──────────────────────────────────────────────────────────────────────

export type ListingSort = 'newest' | 'price_asc' | 'price_desc' | 'area_desc' | 'area_asc'

const VALID_SORTS: readonly ListingSort[] = ['newest', 'price_asc', 'price_desc', 'area_desc', 'area_asc']

// ── Enum allowlists (coerce-or-drop — prevents 22P02 from URL manipulation) ──

const VALID_LISTING_TYPES      = ['sale', 'rent'] as const
const VALID_PROPERTY_TYPES     = PROPERTY_TYPES.map(pt => pt.value)
const VALID_CONDITIONS         = CONDITIONS.map(c => c.value)
const VALID_HEATING_TYPES      = HEATING_TYPES.map(h => h.value)
const VALID_WALL_TYPES         = WALL_TYPES.map(w => w.value)
const VALID_MARKET_TYPES       = MARKET_TYPES.map(m => m.value)
const VALID_OFFER_TYPES        = OFFER_TYPES.map(o => o.value)
const VALID_PURCHASE_CONDITIONS = PURCHASE_CONDITIONS.map(p => p.value)
const VALID_LAYOUT_FEATURES    = LAYOUT_FEATURES.map(lf => lf.value)

// ── Local draft filter state (homepage panel + HeroSearch) ───────────────────

/**
 * Local draft state for the homepage FiltersPanel.
 * Uses snake_case field names matching URL param conventions.
 * Currency is excluded from the active-count (not a narrowing filter).
 */
export interface FilterValues {
  property_type?:     string
  location_id?:       string
  currency?:          string
  price_min?:         number
  price_max?:         number
  area_min?:          number
  area_max?:          number
  rooms?:             number[]
  floor_min?:         number
  floor_max?:         number
  floors_total_min?:  number
  floors_total_max?:  number
  year_built_min?:    number
  year_built_max?:    number
  conditions?:        string[]   // multi-select (was: condition: string)
  heating_types?:     string[]   // multi-select (was: heating: string)
  wall_types?:        string[]   // multi-select (was: wall_type: string)
  market_type?:       string     // scalar — primary/secondary are mutually exclusive
  layout_features?:   string[]
  offer_types?:       string[]   // multi-select (was: offer_type: string)
  purchase_conditions?: string[]
  date_from?:         string
  date_to?:           string
  listing_id?:        string
}

// ── Parsed filter state ───────────────────────────────────────────────────────

/**
 * Fully-typed, normalized filter state parsed from URL search params.
 * This is the canonical representation of active filters.
 */
export interface ParsedFilters {
  // ── Non-schema global params ──────────────────────────────────────────────
  tab:                'active' | 'closed'
  listingType:        string
  propertyType:       string
  locationId:         number | undefined
  sort:               ListingSort
  page:               number
  currency:           'ALL' | 'EUR'
  dateFrom:           string
  dateTo:             string
  listingId:          string
  isPremium:          boolean
  // ── Schema-driven field filters ───────────────────────────────────────────
  rooms:              number[]           // multi-select, 5 = "5 or more"
  priceMin:           number | undefined
  priceMax:           number | undefined
  areaMin:            number | undefined
  areaMax:            number | undefined
  floorMin:           number | undefined
  floorMax:           number | undefined
  floorsTotalMin:     number | undefined
  floorsTotalMax:     number | undefined
  yearBuiltMin:       number | undefined
  yearBuiltMax:       number | undefined
  conditions:         string[]   // multi-select OR within group (was: condition: string)
  heatingTypes:       string[]   // multi-select OR within group (was: heating: string)
  wallTypes:          string[]   // multi-select OR within group (was: wallType: string)
  marketType:         string     // scalar — primary/secondary are mutually exclusive modes
  layoutFeatures:     string[]
  offerTypes:         string[]   // multi-select OR within group (was: offerType: string)
  purchaseConditions: string[]
}

// ── Raw param access ──────────────────────────────────────────────────────────

// Accepts both the Next.js API route searchParams (URLSearchParams) and
// the SSR page searchParams (Record<string, string | string[] | undefined>).
type RawParams = URLSearchParams | Record<string, string | string[] | undefined>

function raw(sp: RawParams, key: string): string {
  if (sp instanceof URLSearchParams) return sp.get(key) ?? ''
  const v = (sp as Record<string, string | string[] | undefined>)[key]
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '')
}

function rawNum(sp: RawParams, key: string): number | undefined {
  const n = parseInt(raw(sp, key))
  return isNaN(n) ? undefined : n
}

function rawMulti(sp: RawParams, key: string): string[] {
  const s = raw(sp, key)
  return s ? s.split(',').filter(Boolean) : []
}

// Returns the raw value only if it is in the allowlist; otherwise ''.
// Prevents unknown enum strings from reaching Postgres (avoids 22P02 errors).
function validEnum(sp: RawParams, key: string, validValues: readonly string[]): string {
  const val = raw(sp, key)
  return validValues.includes(val) ? val : ''
}

// Filters a multi-value param so only known enum values reach the DB.
function validEnumMulti(sp: RawParams, key: string, validValues: readonly string[]): string[] {
  const vals = rawMulti(sp, key)
  return vals.filter(v => validValues.includes(v))
}

// ── Date param sanitization ───────────────────────────────────────────────────

/**
 * Rejects future dates and malformed values.
 * Returns empty string for invalid/future input (falsy = filter not applied).
 * Uses end-of-today as the ceiling so "today" is always a valid upper bound.
 */
function sanitizeDateParam(raw: string): string {
  if (!raw) return ''
  const d = new Date(raw)
  if (isNaN(d.getTime())) return ''
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)
  if (d > endOfToday) return ''
  return raw
}

// ── Parse ─────────────────────────────────────────────────────────────────────

/**
 * Parses raw URL search params into a typed, normalized ParsedFilters object.
 * Accepts both server-side (URLSearchParams) and SSR-page (Record<...>) shapes.
 */
export function parseSearchParams(sp: RawParams): ParsedFilters {
  const s = (k: string) => raw(sp, k)
  const n = (k: string) => rawNum(sp, k)
  const m = (k: string) => rawMulti(sp, k)
  const sort = s('sort')

  return {
    tab:                s('tab') === 'closed' ? 'closed' : 'active',
    listingType:        validEnum(sp, 'type',          VALID_LISTING_TYPES),
    propertyType:       validEnum(sp, 'property_type', VALID_PROPERTY_TYPES),
    locationId:         n('location_id'),
    sort:               (VALID_SORTS.includes(sort as ListingSort) ? sort : 'newest') as ListingSort,
    page:               Math.max(1, n('page') ?? 1),
    currency:           s('currency') === 'EUR' ? 'EUR' : 'ALL',
    dateFrom:           sanitizeDateParam(s('date_from')),
    dateTo:             sanitizeDateParam(s('date_to')),
    listingId:          s('listing_id'),
    isPremium:          s('premium') === 'true',
    rooms:              m('rooms').map(Number).filter(v => !isNaN(v) && v > 0),
    priceMin:           n('price_min'),
    priceMax:           n('price_max'),
    areaMin:            n('area_min'),
    areaMax:            n('area_max'),
    floorMin:           n('floor_min'),
    floorMax:           n('floor_max'),
    floorsTotalMin:     n('floors_total_min'),
    floorsTotalMax:     n('floors_total_max'),
    yearBuiltMin:       n('year_built_min'),
    yearBuiltMax:       n('year_built_max'),
    // Multi-select: comma-separated. Back-compat: old single-value URLs auto-parse
    // (e.g. ?condition=good → conditions: ['good']) because rawMulti splits on ','.
    conditions:         validEnumMulti(sp, 'condition',    VALID_CONDITIONS),
    heatingTypes:       validEnumMulti(sp, 'heating',      VALID_HEATING_TYPES),
    wallTypes:          validEnumMulti(sp, 'wall_type',    VALID_WALL_TYPES),
    marketType:         validEnum(sp,      'market_type',  VALID_MARKET_TYPES),
    layoutFeatures:     validEnumMulti(sp, 'layout_features',    VALID_LAYOUT_FEATURES),
    offerTypes:         validEnumMulti(sp, 'offer_type',   VALID_OFFER_TYPES),
    purchaseConditions: validEnumMulti(sp, 'purchase_conditions', VALID_PURCHASE_CONDITIONS),
  }
}

// ── Apply filters to Supabase query ──────────────────────────────────────────

/**
 * Applies all ParsedFilters to a Supabase listings query builder.
 * Returns the same query type so callers can continue chaining (sort, range, etc.).
 *
 * Contains the canonical implementation of all filter logic including the
 * underground floor safety constraint — previously duplicated in route.ts and page.tsx.
 */
// Supabase's query builder has complex internal generics. We accept the builder
// as a generic parameter so call sites remain correctly typed, and use an internal
// local variable typed as `unknown` for chaining — same pattern as the existing code's
// `as any` casts for enum column values.
export function applyListingFilters<Q>(baseQuery: Q, filters: ParsedFilters): Q {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = baseQuery

  const {
    listingType, propertyType, locationId,
    priceMin, priceMax, areaMin, areaMax,
    rooms, conditions, heatingTypes, wallTypes, marketType,
    layoutFeatures, offerTypes, purchaseConditions,
    floorMin, floorMax, floorsTotalMin, floorsTotalMax,
    yearBuiltMin, yearBuiltMax,
    dateFrom, dateTo, listingId, isPremium,
  } = filters

  // ── Simple equality filters ───────────────────────────────────────────────

  if (listingType)  q = q.eq('listing_type', listingType)
  if (propertyType) q = q.eq('property_type', propertyType)
  if (locationId)   q = q.eq('location_id', locationId)

  // ── Premium-only filter ───────────────────────────────────────────────────
  // Requires is_premium=true AND a valid premium window:
  //   premium_until IS NULL (permanent/no expiry) OR premium_until > now.
  if (isPremium) {
    const nowTs = new Date().toISOString()
    q = q.eq('is_premium', true)
    q = q.or(`premium_until.is.null,premium_until.gt.${nowTs}`)
  }

  // ── Price range ───────────────────────────────────────────────────────────

  if (priceMin) q = q.gte('price', priceMin)
  if (priceMax) q = q.lte('price', priceMax)

  // ── Area range (maps to area_gross column) ────────────────────────────────

  if (areaMin) q = q.gte('area_gross', areaMin)
  if (areaMax) q = q.lte('area_gross', areaMax)

  // ── Rooms — multi-select with "5 or more" threshold ──────────────────────

  if (rooms.length > 0) {
    const exact  = rooms.filter(r => r < 5)
    const hasPlus = rooms.includes(5)
    const clauses: string[] = []
    if (exact.length > 0) clauses.push(`rooms.in.(${exact.join(',')})`)
    if (hasPlus)           clauses.push('rooms.gte.5')
    if (clauses.length > 0) q = q.or(clauses.join(','))
  }

  // ── Floor range — underground type safety constraint ─────────────────────
  // Schema-driven: per-type minimum derived from schema.floor.minFloor.
  // When a negative floor is requested without an explicit property type,
  // automatically constrains query to underground-capable types only.

  if (floorMin !== undefined || floorMax !== undefined) {
    const schema             = getSchema(propertyType)
    const floorAllowedMin    = schema.floor.minFloor
    const hasNegFloor        = (floorMin !== undefined && floorMin < 0)
                             || (floorMax !== undefined && floorMax < 0)
    const undergroundTypes   = getUndergroundFloorTypes()
    const typeSupportsNeg    = !propertyType || undergroundTypes.includes(propertyType)

    if (hasNegFloor && !propertyType) {
      q = q.in('property_type', undergroundTypes)
    }

    const effectiveMin = (hasNegFloor && !propertyType) ? -10 : floorAllowedMin
    if (floorMin !== undefined && floorMin >= effectiveMin) {
      q = q.gte('floor', floorMin)
    }
    if (floorMax !== undefined && (floorMax >= 0 || (hasNegFloor && typeSupportsNeg))) {
      q = q.lte('floor', floorMax)
    }
  }

  // ── Building floors range (total_floors column) ───────────────────────────

  if (floorsTotalMin) q = q.gte('total_floors', floorsTotalMin)
  if (floorsTotalMax) q = q.lte('total_floors', floorsTotalMax)

  // ── Year built range ──────────────────────────────────────────────────────

  if (yearBuiltMin) q = q.gte('year_built', yearBuiltMin)
  if (yearBuiltMax) q = q.lte('year_built', yearBuiltMax)

  // ── Multi-select filters — OR within group, AND across groups ────────────
  // Each group uses .in() so any selected value matches (OR semantics).

  if (conditions.length > 0)         q = q.in('condition',         conditions)
  if (heatingTypes.length > 0)       q = q.in('heating',           heatingTypes)
  if (wallTypes.length > 0)          q = q.in('wall_type',         wallTypes)
  if (marketType)                    q = q.eq('market_type',       marketType)
  if (offerTypes.length > 0)         q = q.in('offer_type',        offerTypes)

  // ── Array column filters ──────────────────────────────────────────────────

  if (layoutFeatures.length > 0)     q = q.contains('layout_features',    layoutFeatures)
  if (purchaseConditions.length > 0) q = q.overlaps('purchase_conditions', purchaseConditions)

  // ── Date range ────────────────────────────────────────────────────────────

  if (dateFrom) {
    const d = new Date(dateFrom)
    if (!isNaN(d.getTime())) q = q.gte('created_at', d.toISOString())
  }
  if (dateTo) {
    const d = new Date(dateTo)
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999)
      q = q.lte('created_at', d.toISOString())
    }
  }

  // ── Listing ID search ─────────────────────────────────────────────────────

  if (listingId) {
    const id = parseInt(listingId)
    if (!isNaN(id)) q = q.eq('id', id)
  }

  return q as Q
}

// ── Filter section visibility ─────────────────────────────────────────────────

/**
 * Derives which filter sections are visible for a given property type,
 * plus the domain-aware floor minimum.
 *
 * Shared by FiltersPanel (local-state batch UX) and ListingsFilters (URL immediate UX)
 * — both need identical section-visibility logic with different state sources.
 */
export function getFilterVisibility(propertyType: string | undefined): {
  visibleSections: readonly ListingField[]
  shows: (key: FilterSection) => boolean
  floorFilterMin: number
} {
  const visibleSections: readonly ListingField[] = propertyType
    ? getSchema(propertyType).ui.filters
    : ALL_FILTER_SECTIONS
  return {
    visibleSections,
    shows: (key: FilterSection) => visibleSections.includes(key),
    floorFilterMin: getFloorFilterMin(propertyType ?? ''),
  }
}

// ── Active filter count ───────────────────────────────────────────────────────

/**
 * Returns the number of active (non-default) filter values.
 *
 * Canonical counting rule (applied here and in countActiveFilterValues):
 *  - array  → + array.length   (each selected value = +1)
 *  - scalar → + 1 iff non-empty / non-default
 *  - range  → + 1 per filled bound (both filled = +2)
 *  - boolean → + 1 iff true
 *  - currency — excluded (not a narrowing filter)
 */
export function countActiveFilters(filters: ParsedFilters): number {
  return (
    (filters.listingType ? 1 : 0) +
    (filters.propertyType ? 1 : 0) +
    (filters.locationId ? 1 : 0) +
    (filters.priceMin    != null ? 1 : 0) +
    (filters.priceMax    != null ? 1 : 0) +
    (filters.areaMin     != null ? 1 : 0) +
    (filters.areaMax     != null ? 1 : 0) +
    filters.rooms.length +
    (filters.floorMin        != null ? 1 : 0) +
    (filters.floorMax        != null ? 1 : 0) +
    (filters.floorsTotalMin  != null ? 1 : 0) +
    (filters.floorsTotalMax  != null ? 1 : 0) +
    (filters.yearBuiltMin    != null ? 1 : 0) +
    (filters.yearBuiltMax    != null ? 1 : 0) +
    filters.conditions.length +
    filters.heatingTypes.length +
    filters.wallTypes.length +
    (filters.marketType ? 1 : 0) +
    filters.layoutFeatures.length +
    filters.offerTypes.length +
    filters.purchaseConditions.length +
    (filters.dateFrom  ? 1 : 0) +
    (filters.dateTo    ? 1 : 0) +
    (filters.listingId ? 1 : 0) +
    (filters.isPremium ? 1 : 0)
  )
}

/**
 * Same counting rules as countActiveFilters but applied to the local draft
 * FilterValues state (homepage FiltersPanel / HeroSearch).
 * Keeps count logic in one canonical location.
 */
export function countActiveFilterValues(fv: FilterValues): number {
  return (
    (fv.property_type ? 1 : 0) +
    (fv.location_id   ? 1 : 0) +
    (fv.price_min     != null ? 1 : 0) +
    (fv.price_max     != null ? 1 : 0) +
    (fv.area_min      != null ? 1 : 0) +
    (fv.area_max      != null ? 1 : 0) +
    (fv.rooms?.length ?? 0) +
    (fv.floor_min        != null ? 1 : 0) +
    (fv.floor_max        != null ? 1 : 0) +
    (fv.floors_total_min != null ? 1 : 0) +
    (fv.floors_total_max != null ? 1 : 0) +
    (fv.year_built_min   != null ? 1 : 0) +
    (fv.year_built_max   != null ? 1 : 0) +
    (fv.conditions?.length    ?? 0) +
    (fv.heating_types?.length ?? 0) +
    (fv.wall_types?.length    ?? 0) +
    (fv.market_type ? 1 : 0) +
    (fv.layout_features?.length ?? 0) +
    (fv.offer_types?.length     ?? 0) +
    (fv.purchase_conditions?.length ?? 0) +
    (fv.date_from  ? 1 : 0) +
    (fv.date_to    ? 1 : 0) +
    (fv.listing_id ? 1 : 0)
  )
}
