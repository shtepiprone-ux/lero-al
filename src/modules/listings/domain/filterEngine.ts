/**
 * Canonical Filter + Query Engine — Phase 3 of the Dynamic Form Engine.
 *
 * Single source of truth for:
 *  – URL search-param parsing     → parseSearchParams()
 *  – Supabase query filter application → applyListingFilters()
 *  – URL serialization            → serializeFilters()
 *  – Active filter count          → countActiveFilters()
 *
 * Replaces duplicated procedural filter logic previously in:
 *  – src/app/api/listings/route.ts
 *  – src/app/[locale]/listings/page.tsx
 */

import { getSchema, getUndergroundFloorTypes } from './propertyTypeSchema'

// ── Sort ──────────────────────────────────────────────────────────────────────

export type ListingSort = 'newest' | 'price_asc' | 'price_desc' | 'area_desc'

const VALID_SORTS: readonly ListingSort[] = ['newest', 'price_asc', 'price_desc', 'area_desc']

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
  condition:          string
  heating:            string
  wallType:           string
  marketType:         string
  layoutFeatures:     string[]
  offerType:          string
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
    listingType:        s('type'),
    propertyType:       s('property_type'),
    locationId:         n('location_id'),
    sort:               (VALID_SORTS.includes(sort as ListingSort) ? sort : 'newest') as ListingSort,
    page:               Math.max(1, n('page') ?? 1),
    currency:           s('currency') === 'EUR' ? 'EUR' : 'ALL',
    dateFrom:           sanitizeDateParam(s('date_from')),
    dateTo:             sanitizeDateParam(s('date_to')),
    listingId:          s('listing_id'),
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
    condition:          s('condition'),
    heating:            s('heating'),
    wallType:           s('wall_type'),
    marketType:         s('market_type'),
    layoutFeatures:     m('layout_features'),
    offerType:          s('offer_type'),
    purchaseConditions: m('purchase_conditions'),
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
    rooms, condition, heating, wallType, marketType,
    layoutFeatures, offerType, purchaseConditions,
    floorMin, floorMax, floorsTotalMin, floorsTotalMax,
    yearBuiltMin, yearBuiltMax,
    dateFrom, dateTo, listingId,
  } = filters

  // ── Simple equality filters ───────────────────────────────────────────────

  if (listingType)  q = q.eq('listing_type', listingType)
  if (propertyType) q = q.eq('property_type', propertyType)
  if (locationId)   q = q.eq('location_id', locationId)

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

  // ── Enum single-select filters ────────────────────────────────────────────

  if (condition)   q = q.eq('condition',   condition)
  if (heating)     q = q.eq('heating',     heating)
  if (wallType)    q = q.eq('wall_type',   wallType)
  if (marketType)  q = q.eq('market_type', marketType)
  if (offerType)   q = q.eq('offer_type',  offerType)

  // ── Array filters ─────────────────────────────────────────────────────────

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

// ── Serialize filters to URL params ──────────────────────────────────────────

/**
 * Serializes a ParsedFilters object back to URLSearchParams for URL generation.
 * Omits default/empty values so URLs stay clean.
 */
export function serializeFilters(filters: Partial<ParsedFilters>): URLSearchParams {
  const p = new URLSearchParams()
  const set  = (k: string, v: string | undefined) => { if (v)  p.set(k, v) }
  const setN = (k: string, v: number | undefined) => { if (v !== undefined) p.set(k, String(v)) }

  if (filters.tab === 'closed')                   p.set('tab', 'closed')
  set('type',          filters.listingType)
  set('property_type', filters.propertyType)
  setN('location_id',  filters.locationId)
  if (filters.sort && filters.sort !== 'newest')  p.set('sort', filters.sort)
  if (filters.page && filters.page > 1)           p.set('page', String(filters.page))
  if (filters.currency === 'EUR')                 p.set('currency', 'EUR')
  set('date_from',  filters.dateFrom)
  set('date_to',    filters.dateTo)
  set('listing_id', filters.listingId)

  if (filters.rooms?.length)              p.set('rooms',              filters.rooms.join(','))
  setN('price_min',           filters.priceMin)
  setN('price_max',           filters.priceMax)
  setN('area_min',            filters.areaMin)
  setN('area_max',            filters.areaMax)
  setN('floor_min',           filters.floorMin)
  setN('floor_max',           filters.floorMax)
  setN('floors_total_min',    filters.floorsTotalMin)
  setN('floors_total_max',    filters.floorsTotalMax)
  setN('year_built_min',      filters.yearBuiltMin)
  setN('year_built_max',      filters.yearBuiltMax)
  set('condition',  filters.condition)
  set('heating',    filters.heating)
  set('wall_type',  filters.wallType)
  set('market_type',filters.marketType)
  if (filters.layoutFeatures?.length)     p.set('layout_features',     filters.layoutFeatures.join(','))
  set('offer_type', filters.offerType)
  if (filters.purchaseConditions?.length) p.set('purchase_conditions', filters.purchaseConditions.join(','))

  return p
}

// ── Active filter count ───────────────────────────────────────────────────────

/**
 * Returns the number of active (non-default) filters.
 * Used to display a badge count on the filter toggle button.
 */
export function countActiveFilters(filters: ParsedFilters): number {
  return [
    filters.listingType,
    filters.propertyType,
    filters.locationId,
    filters.priceMin,           filters.priceMax,
    filters.areaMin,            filters.areaMax,
    filters.rooms.length > 0  ? 1 : undefined,
    filters.floorMin,           filters.floorMax,
    filters.floorsTotalMin,     filters.floorsTotalMax,
    filters.yearBuiltMin,       filters.yearBuiltMax,
    filters.condition,          filters.heating,
    filters.wallType,           filters.marketType,
    filters.layoutFeatures.length > 0    ? 1 : undefined,
    filters.offerType,
    filters.purchaseConditions.length > 0 ? 1 : undefined,
    filters.dateFrom,           filters.dateTo,
    filters.listingId,
  ].filter(Boolean).length
}
