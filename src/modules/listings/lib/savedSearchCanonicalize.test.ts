import { describe, it, expect } from 'vitest'
import {
  canonicalizeFilters,
  computeFiltersHash,
  canonicalToSearchParams,
} from './savedSearchCanonicalize'

// ── Helper ────────────────────────────────────────────────────────────────────

function sp(query: string): URLSearchParams {
  return new URLSearchParams(query)
}

// ── canonicalizeFilters — 4 new multi-select fields (Task 298) ────────────────

describe('canonicalizeFilters — condition (multi-select)', () => {
  it('parses a single value as a 1-element array', () => {
    const c = canonicalizeFilters(sp('condition=good'))
    expect(c.condition).toEqual(['good'])
  })

  it('parses comma-separated values as a sorted array', () => {
    const c = canonicalizeFilters(sp('condition=new_build,good'))
    expect(c.condition).toEqual(['good', 'new_build'])
  })

  it('sorts values regardless of input order', () => {
    const c1 = canonicalizeFilters(sp('condition=good,new_build'))
    const c2 = canonicalizeFilters(sp('condition=new_build,good'))
    expect(c1.condition).toEqual(c2.condition)
  })

  it('omits the field when empty', () => {
    const c = canonicalizeFilters(sp('condition='))
    expect(c.condition).toBeUndefined()
  })
})

describe('canonicalizeFilters — heating (multi-select)', () => {
  it('parses a single value', () => {
    expect(canonicalizeFilters(sp('heating=gas')).heating).toEqual(['gas'])
  })

  it('sorts multi-values', () => {
    const c1 = canonicalizeFilters(sp('heating=gas,electric'))
    const c2 = canonicalizeFilters(sp('heating=electric,gas'))
    expect(c1.heating).toEqual(c2.heating)
    expect(c1.heating).toEqual(['electric', 'gas'])
  })

  it('omits when empty', () => {
    expect(canonicalizeFilters(sp('')).heating).toBeUndefined()
  })
})

describe('canonicalizeFilters — wallType (multi-select)', () => {
  it('parses a single value', () => {
    expect(canonicalizeFilters(sp('wall_type=brick')).wallType).toEqual(['brick'])
  })

  it('sorts multi-values', () => {
    const c1 = canonicalizeFilters(sp('wall_type=panel,brick'))
    const c2 = canonicalizeFilters(sp('wall_type=brick,panel'))
    expect(c1.wallType).toEqual(c2.wallType)
    expect(c1.wallType).toEqual(['brick', 'panel'])
  })

  it('omits when empty', () => {
    expect(canonicalizeFilters(sp('')).wallType).toBeUndefined()
  })
})

describe('canonicalizeFilters — offerType (multi-select)', () => {
  it('parses a single value', () => {
    expect(canonicalizeFilters(sp('offer_type=sale')).offerType).toEqual(['sale'])
  })

  it('sorts multi-values', () => {
    const c1 = canonicalizeFilters(sp('offer_type=rent,sale'))
    const c2 = canonicalizeFilters(sp('offer_type=sale,rent'))
    expect(c1.offerType).toEqual(c2.offerType)
    expect(c1.offerType).toEqual(['rent', 'sale'])
  })

  it('omits when empty', () => {
    expect(canonicalizeFilters(sp('')).offerType).toBeUndefined()
  })
})

describe('canonicalizeFilters — marketType stays scalar', () => {
  it('keeps marketType as a string, not an array', () => {
    const c = canonicalizeFilters(sp('market_type=primary'))
    expect(c.marketType).toBe('primary')
    expect(typeof c.marketType).toBe('string')
  })
})

// ── Precedent fields — unchanged sorting behavior (Task 298 regression guard) ─

describe('canonicalizeFilters — rooms sort (precedent)', () => {
  it('sorts numeric rooms array', () => {
    const c1 = canonicalizeFilters(sp('rooms=3&rooms=1&rooms=2'))
    const c2 = canonicalizeFilters(sp('rooms=2&rooms=3&rooms=1'))
    expect(c1.rooms).toEqual([1, 2, 3])
    expect(c1.rooms).toEqual(c2.rooms)
  })
})

describe('canonicalizeFilters — layoutFeatures sort (precedent)', () => {
  it('sorts layout features array', () => {
    const c1 = canonicalizeFilters(sp('layout_features=balcony&layout_features=elevator'))
    const c2 = canonicalizeFilters(sp('layout_features=elevator&layout_features=balcony'))
    expect(c1.layoutFeatures).toEqual(c2.layoutFeatures)
  })
})

describe('canonicalizeFilters — purchaseConditions sort (precedent)', () => {
  it('sorts purchase conditions array', () => {
    const c1 = canonicalizeFilters(sp('purchase_conditions=mortgage&purchase_conditions=installment'))
    const c2 = canonicalizeFilters(sp('purchase_conditions=installment&purchase_conditions=mortgage'))
    expect(c1.purchaseConditions).toEqual(c2.purchaseConditions)
  })
})

// ── computeFiltersHash — order-stability for 4 new fields ────────────────────

describe('computeFiltersHash — order-stable for 4 new multi-select fields', () => {
  it('condition: same hash regardless of value order', () => {
    const h1 = computeFiltersHash(canonicalizeFilters(sp('condition=good,new_build')))
    const h2 = computeFiltersHash(canonicalizeFilters(sp('condition=new_build,good')))
    expect(h1).toBe(h2)
  })

  it('heating: same hash regardless of value order', () => {
    const h1 = computeFiltersHash(canonicalizeFilters(sp('heating=gas,electric')))
    const h2 = computeFiltersHash(canonicalizeFilters(sp('heating=electric,gas')))
    expect(h1).toBe(h2)
  })

  it('wallType: same hash regardless of value order', () => {
    const h1 = computeFiltersHash(canonicalizeFilters(sp('wall_type=panel,brick')))
    const h2 = computeFiltersHash(canonicalizeFilters(sp('wall_type=brick,panel')))
    expect(h1).toBe(h2)
  })

  it('offerType: same hash regardless of value order', () => {
    const h1 = computeFiltersHash(canonicalizeFilters(sp('offer_type=rent,sale')))
    const h2 = computeFiltersHash(canonicalizeFilters(sp('offer_type=sale,rent')))
    expect(h1).toBe(h2)
  })

  it('combined multi-select: same hash regardless of value orders', () => {
    const h1 = computeFiltersHash(canonicalizeFilters(sp('condition=new_build,good&heating=electric,gas&wall_type=panel,brick&offer_type=sale,rent')))
    const h2 = computeFiltersHash(canonicalizeFilters(sp('condition=good,new_build&heating=gas,electric&wall_type=brick,panel&offer_type=rent,sale')))
    expect(h1).toBe(h2)
  })

  it('different values produce different hashes', () => {
    const h1 = computeFiltersHash(canonicalizeFilters(sp('condition=good')))
    const h2 = computeFiltersHash(canonicalizeFilters(sp('condition=new_build')))
    expect(h1).not.toBe(h2)
  })
})

// ── canonicalToSearchParams — legacy scalar backward-compatibility (Task 298 Option A) ──

describe('canonicalToSearchParams — legacy scalar string shape (old DB rows)', () => {
  it('handles legacy scalar condition string without throwing', () => {
    // Old DB rows have condition as a scalar string, not an array.
    const legacyFilters = { condition: 'good,new_build' } as unknown as import('./savedSearchCanonicalize').CanonicalFilters
    expect(() => canonicalToSearchParams(legacyFilters)).not.toThrow()
  })

  it('normalizes legacy scalar condition to sorted comma-joined output', () => {
    const legacyFilters = { condition: 'new_build,good' } as unknown as import('./savedSearchCanonicalize').CanonicalFilters
    const out = canonicalToSearchParams(legacyFilters)
    expect(out.get('condition')).toBe('good,new_build')
  })

  it('normalizes legacy scalar heating to sorted output', () => {
    const legacyFilters = { heating: 'gas,electric' } as unknown as import('./savedSearchCanonicalize').CanonicalFilters
    const out = canonicalToSearchParams(legacyFilters)
    expect(out.get('heating')).toBe('electric,gas')
  })

  it('normalizes legacy scalar wallType to sorted output', () => {
    const legacyFilters = { wallType: 'panel,brick' } as unknown as import('./savedSearchCanonicalize').CanonicalFilters
    const out = canonicalToSearchParams(legacyFilters)
    expect(out.get('wall_type')).toBe('brick,panel')
  })

  it('normalizes legacy scalar offerType to sorted output', () => {
    const legacyFilters = { offerType: 'rent,sale' } as unknown as import('./savedSearchCanonicalize').CanonicalFilters
    const out = canonicalToSearchParams(legacyFilters)
    expect(out.get('offer_type')).toBe('rent,sale')
  })

  it('omits legacy scalar empty string fields', () => {
    const legacyFilters = { condition: '' } as unknown as import('./savedSearchCanonicalize').CanonicalFilters
    const out = canonicalToSearchParams(legacyFilters)
    expect(out.get('condition')).toBeNull()
  })

  it('handles mixed legacy and new-shape in same object', () => {
    // Simulates a partially-updated DB row (unlikely but safe to handle)
    const mixed = { condition: 'new_build,good', heating: ['gas', 'electric'] } as unknown as import('./savedSearchCanonicalize').CanonicalFilters
    const out = canonicalToSearchParams(mixed)
    expect(out.get('condition')).toBe('good,new_build')
    expect(out.get('heating')).toBe('electric,gas')
  })
})

// ── canonicalToSearchParams — round-trip ──────────────────────────────────────

describe('canonicalToSearchParams — comma-joined round-trip', () => {
  it('writes condition as sorted comma-joined string', () => {
    const canonical = canonicalizeFilters(sp('condition=new_build,good'))
    const out = canonicalToSearchParams(canonical)
    expect(out.get('condition')).toBe('good,new_build')
  })

  it('writes heating as sorted comma-joined string', () => {
    const out = canonicalToSearchParams(canonicalizeFilters(sp('heating=gas,electric')))
    expect(out.get('heating')).toBe('electric,gas')
  })

  it('writes wallType as sorted comma-joined string', () => {
    const out = canonicalToSearchParams(canonicalizeFilters(sp('wall_type=panel,brick')))
    expect(out.get('wall_type')).toBe('brick,panel')
  })

  it('writes offerType as sorted comma-joined string', () => {
    const out = canonicalToSearchParams(canonicalizeFilters(sp('offer_type=rent,sale')))
    expect(out.get('offer_type')).toBe('rent,sale')
  })

  it('omits fields with no values', () => {
    const out = canonicalToSearchParams(canonicalizeFilters(sp('type=rent')))
    expect(out.get('condition')).toBeNull()
    expect(out.get('heating')).toBeNull()
    expect(out.get('wall_type')).toBeNull()
    expect(out.get('offer_type')).toBeNull()
  })

  it('single value round-trips correctly', () => {
    const out = canonicalToSearchParams(canonicalizeFilters(sp('condition=good')))
    expect(out.get('condition')).toBe('good')
  })
})
