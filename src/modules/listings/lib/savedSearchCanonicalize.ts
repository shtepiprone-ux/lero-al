import { createHash } from 'crypto'

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
  condition?:          string
  heating?:            string
  wallType?:           string
  marketType?:         string
  layoutFeatures?:     string[]
  offerType?:          string
  purchaseConditions?: string[]
}

/**
 * Extract canonical filters from raw URL search params.
 * Drops pagination, tab, sort, currency, and temporal keys.
 * Normalizes types: string numbers → numbers, empty arrays → omitted.
 */
export function canonicalizeFilters(sp: URLSearchParams | Record<string, string | string[] | undefined>): CanonicalFilters {
  function s(key: string): string {
    if (sp instanceof URLSearchParams) return sp.get(key) ?? ''
    const v = sp[key]
    return Array.isArray(v) ? (v[0] ?? '') : (v ?? '')
  }
  function n(key: string): number | undefined {
    const v = parseInt(s(key))
    return isNaN(v) ? undefined : v
  }
  function m(key: string): string[] {
    if (sp instanceof URLSearchParams) {
      return sp.getAll(key).filter(Boolean)
    }
    const v = sp[key]
    if (Array.isArray(v)) return v.filter(Boolean)
    return v ? [v] : []
  }

  const canonical: CanonicalFilters = {}

  const listingType = s('type'); if (listingType) canonical.listingType = listingType
  const propertyType = s('property_type'); if (propertyType) canonical.propertyType = propertyType
  const locationId = n('location_id'); if (locationId) canonical.locationId = locationId
  const rooms = m('rooms').map(Number).filter(v => !isNaN(v) && v > 0); if (rooms.length) canonical.rooms = rooms.sort((a, b) => a - b)
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
  const condition = s('condition'); if (condition) canonical.condition = condition
  const heating = s('heating'); if (heating) canonical.heating = heating
  const wallType = s('wall_type'); if (wallType) canonical.wallType = wallType
  const marketType = s('market_type'); if (marketType) canonical.marketType = marketType
  const layoutFeatures = m('layout_features').sort(); if (layoutFeatures.length) canonical.layoutFeatures = layoutFeatures
  const offerType = s('offer_type'); if (offerType) canonical.offerType = offerType
  const purchaseConditions = m('purchase_conditions').sort(); if (purchaseConditions.length) canonical.purchaseConditions = purchaseConditions

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
 * Convert canonical filters back to URLSearchParams for restoring the search URL.
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
  if (filters.condition)    p.set('condition', filters.condition)
  if (filters.heating)      p.set('heating', filters.heating)
  if (filters.wallType)     p.set('wall_type', filters.wallType)
  if (filters.marketType)   p.set('market_type', filters.marketType)
  if (filters.offerType)    p.set('offer_type', filters.offerType)
  filters.rooms?.forEach(r => p.append('rooms', String(r)))
  filters.layoutFeatures?.forEach(f => p.append('layout_features', f))
  filters.purchaseConditions?.forEach(c => p.append('purchase_conditions', c))
  if (filters.yearBuiltMin) p.set('year_built_min', String(filters.yearBuiltMin))
  if (filters.yearBuiltMax) p.set('year_built_max', String(filters.yearBuiltMax))
  return p
}
