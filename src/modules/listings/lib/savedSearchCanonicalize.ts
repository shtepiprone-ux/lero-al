import { createHash } from 'crypto'
import {
  CONDITIONS, HEATING_TYPES, LAYOUT_FEATURES, MARKET_TYPES, OFFER_TYPES, PURCHASE_CONDITIONS, WALL_TYPES,
} from '../constants'

/**
 * Canonical saved-search filter keys.
 * Excludes pagination (page), temporal (dateFrom, dateTo, listingId), sort, tab, currency.
 * These fields represent a stable search intent — independent of display/pagination state.
 */
export interface CanonicalFilters {
  listingType?:        string
  propertyType?:       string
  locationId?:         number
  rooms?:              number[]
  priceMin?:           number
  priceMax?:           number
  areaMin?:            number
  areaMax?:            number
  floorMin?:           number
  floorMax?:           number
  floorsTotalMin?:     number
  floorsTotalMax?:     number
  yearBuiltMin?:       number
  yearBuiltMax?:       number
  condition?:          string[]
  heating?:            string[]
  wallType?:           string[]
  marketType?:         string
  layoutFeatures?:     string[]
  offerType?:          string[]
  purchaseConditions?: string[]
}

// ── Limits (Task 923 Revision 7, findings S53 / S52) ─────────────────────────
// The filters of a saved search are sent by the browser to a Server Action and stored as they come out of here, so they are limited to what the search page
// itself accepts: known words, whole numbers that fit a database integer, short lists.

const MAX_INT = 2_147_483_647
const MAX_ROOMS_LISTED = 20
const PROPERTY_TYPE_SLUG = /^[a-z0-9_]{1,64}$/
const words = (list: readonly { value: string }[]) => list.map((i) => i.value)
const ALLOWED = {
  condition:          words(CONDITIONS),
  heating:            words(HEATING_TYPES),
  wallType:           words(WALL_TYPES),
  marketType:         words(MARKET_TYPES),
  offerType:          words(OFFER_TYPES),
  layoutFeatures:     words(LAYOUT_FEATURES),
  purchaseConditions: words(PURCHASE_CONDITIONS),
}

/**
 * Extract canonical filters from raw URL search params.
 * Drops pagination, tab, sort, currency, and temporal keys.
 * Normalizes types: string numbers → numbers, empty arrays → omitted.
 *
 * A list can arrive both ways the application writes it: one comma-separated value (`rooms=2,3`, what the search page and the hero search produce) or repeated
 * parameters (`rooms=2&rooms=3`); both mean the same and give the same result. Unknown words and out-of-range numbers are dropped.
 */
export function canonicalizeFilters(sp: URLSearchParams | Record<string, string | string[] | undefined>): CanonicalFilters {
  /** every value given under the key (a repeated parameter, an array, a comma-separated text), text only */
  function all(key: string): string[] {
    const given: unknown[] = sp instanceof URLSearchParams ? sp.getAll(key) : [Object.hasOwn(sp, key) ? sp[key] : undefined].flat()
    return given.filter((v): v is string => typeof v === 'string').flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean)
  }
  function s(key: string): string {
    const first = sp instanceof URLSearchParams ? sp.get(key) : (Object.hasOwn(sp, key) ? [sp[key]].flat()[0] : undefined)
    return typeof first === 'string' ? first : ''
  }
  function n(key: string): number | undefined {
    const v = parseInt(s(key))
    return Number.isNaN(v) || Math.abs(v) > MAX_INT ? undefined : v
  }
  /** the known words of a list filter, once each, sorted */
  function known(key: string, allowed: readonly string[]): string[] {
    return [...new Set(all(key).filter((v) => allowed.includes(v)))].sort()
  }

  const canonical: CanonicalFilters = {}

  const listingType = s('type'); if (listingType === 'sale' || listingType === 'rent') canonical.listingType = listingType
  const propertyType = s('property_type'); if (PROPERTY_TYPE_SLUG.test(propertyType)) canonical.propertyType = propertyType
  const locationId = n('location_id'); if (locationId) canonical.locationId = locationId
  const rooms = [...new Set(all('rooms').map(Number).filter((v) => Number.isInteger(v) && v > 0 && v < 100))].sort((a, b) => a - b).slice(0, MAX_ROOMS_LISTED)
  if (rooms.length) canonical.rooms = rooms
  const priceMin = n('price_min'); if (priceMin) canonical.priceMin = priceMin
  const priceMax = n('price_max'); if (priceMax) canonical.priceMax = priceMax
  const areaMin = n('area_min'); if (areaMin) canonical.areaMin = areaMin
  const areaMax = n('area_max'); if (areaMax) canonical.areaMax = areaMax
  const floorMin = n('floor_min'); if (floorMin) canonical.floorMin = floorMin
  const floorMax = n('floor_max'); if (floorMax) canonical.floorMax = floorMax
  const floorsTotalMin = n('floors_total_min'); if (floorsTotalMin) canonical.floorsTotalMin = floorsTotalMin
  const floorsTotalMax = n('floors_total_max'); if (floorsTotalMax) canonical.floorsTotalMax = floorsTotalMax
  const yearBuiltMin = n('year_built_min'); if (yearBuiltMin) canonical.yearBuiltMin = yearBuiltMin
  const yearBuiltMax = n('year_built_max'); if (yearBuiltMax) canonical.yearBuiltMax = yearBuiltMax
  const condition = known('condition', ALLOWED.condition); if (condition.length) canonical.condition = condition
  const heating = known('heating', ALLOWED.heating); if (heating.length) canonical.heating = heating
  const wallType = known('wall_type', ALLOWED.wallType); if (wallType.length) canonical.wallType = wallType
  const marketType = s('market_type'); if (ALLOWED.marketType.includes(marketType)) canonical.marketType = marketType
  const layoutFeatures = known('layout_features', ALLOWED.layoutFeatures); if (layoutFeatures.length) canonical.layoutFeatures = layoutFeatures
  const offerType = known('offer_type', ALLOWED.offerType); if (offerType.length) canonical.offerType = offerType
  const purchaseConditions = known('purchase_conditions', ALLOWED.purchaseConditions); if (purchaseConditions.length) canonical.purchaseConditions = purchaseConditions

  return canonical
}

/**
 * Compute SHA-256 hash of canonical filters (stable across runs).
 * Keys sorted alphabetically, ensuring identical filters produce identical hashes.
 */
export function computeFiltersHash(canonical: CanonicalFilters): string {
  const sorted = Object.fromEntries(
    Object.entries(canonical).sort(([a], [b]) => a.localeCompare(b)),
  )
  return createHash('sha256').update(JSON.stringify(sorted)).digest('hex')
}

/**
 * Normalize a multi-value field that may be either the new string[] shape (Task 298)
 * or the legacy string shape from old DB rows (Option A: existing rows not backfilled).
 * Returns a sorted, comma-joined string or undefined if the value is empty.
 */
function normalizeMultiValueForParams(value: unknown): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') {
    const vals = value.split(',').map(v => v.trim()).filter(Boolean).sort()
    return vals.length ? vals.join(',') : undefined
  }
  if (Array.isArray(value)) {
    const sorted = (value as string[]).filter(Boolean).sort()
    return sorted.length ? sorted.join(',') : undefined
  }
  return undefined
}

/**
 * Convert canonical filters back to URLSearchParams for restoring the search URL.
 * The multi-value fields (condition / heating / wallType / offerType, and since Task 923 Revision 7 also rooms / layoutFeatures / purchaseConditions) are written
 * as ONE comma-separated value: that is what the search page reads in full. Repeated parameters were read only up to the first. The 4 older multi-value fields
 * accept both the new string[] shape and the legacy string shape from old DB rows (backward-compat).
 */
export function canonicalToSearchParams(filters: CanonicalFilters): URLSearchParams {
  const p = new URLSearchParams()
  if (filters.listingType)  p.set('type', filters.listingType)
  if (filters.propertyType) p.set('property_type', filters.propertyType)
  if (filters.locationId)   p.set('location_id', String(filters.locationId))
  if (filters.priceMin)     p.set('price_min', String(filters.priceMin))
  if (filters.priceMax)     p.set('price_max', String(filters.priceMax))
  if (filters.areaMin)      p.set('area_min', String(filters.areaMin))
  if (filters.areaMax)      p.set('area_max', String(filters.areaMax))
  if (filters.floorMin)     p.set('floor_min', String(filters.floorMin))
  if (filters.floorMax)     p.set('floor_max', String(filters.floorMax))
  if (filters.floorsTotalMin) p.set('floors_total_min', String(filters.floorsTotalMin))
  if (filters.floorsTotalMax) p.set('floors_total_max', String(filters.floorsTotalMax))
  const cond = normalizeMultiValueForParams(filters.condition); if (cond) p.set('condition', cond)
  const heat = normalizeMultiValueForParams(filters.heating);   if (heat) p.set('heating', heat)
  const wall = normalizeMultiValueForParams(filters.wallType);  if (wall) p.set('wall_type', wall)
  if (filters.marketType) p.set('market_type', filters.marketType)
  const offr = normalizeMultiValueForParams(filters.offerType); if (offr) p.set('offer_type', offr)
  if (filters.rooms?.length) p.set('rooms', filters.rooms.join(','))
  const layout = normalizeMultiValueForParams(filters.layoutFeatures);         if (layout) p.set('layout_features', layout)
  const purchase = normalizeMultiValueForParams(filters.purchaseConditions);   if (purchase) p.set('purchase_conditions', purchase)
  if (filters.yearBuiltMin) p.set('year_built_min', String(filters.yearBuiltMin))
  if (filters.yearBuiltMax) p.set('year_built_max', String(filters.yearBuiltMax))
  return p
}
