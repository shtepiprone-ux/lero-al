import { describe, it, expect } from 'vitest'
import {
  buildSimilarityEntries,
  entriesForAttempt,
  applySimilarityEntries,
  buildSimilarityHref,
  type SimilarityQueryBuilder,
  type SimilarityEntry,
} from '../similarity'

// Task 803 — the similarity structure (R1/D72-3): one ordered list, two renderers. AC1.

const FULL_LISTING = {
  location_id: 5,
  condition: 'good',
  heating: 'central',
  wall_type: 'brick',
  market_type: 'primary',
  offer_type: 'developer',
  purchase_conditions: ['cash', 'mortgage'],
  rooms: 3,
  area_gross: 100,
  floor: 4,
  year_built: 2010,
}

const SPARSE_LISTING = {
  location_id: null,
  condition: null,
  heating: null,
  wall_type: null,
  market_type: null,
  offer_type: null,
  purchase_conditions: [],
  rooms: null,
  area_gross: null,
  floor: null,
  year_built: null,
}

describe('buildSimilarityEntries', () => {
  it('emits one entry per non-null field, tier-tagged, for a fully populated listing', () => {
    const entries = buildSimilarityEntries(FULL_LISTING)
    // location_id (A) + condition/heating/wall_type/market_type/offer_type/purchase_conditions (B, 6)
    // + rooms/area_min/area_max/floor_min/floor_max/year_built_min/year_built_max (C, 7) = 14
    expect(entries).toHaveLength(14)
    expect(entries.filter(e => e.tier === 'A')).toHaveLength(1)
    expect(entries.filter(e => e.tier === 'B')).toHaveLength(6)
    expect(entries.filter(e => e.tier === 'C')).toHaveLength(7)
  })

  it('omits every field whose source column is null/empty', () => {
    expect(buildSimilarityEntries(SPARSE_LISTING)).toHaveLength(0)
  })

  it('derives area_min/area_max at ±25%, rounded', () => {
    const entries = buildSimilarityEntries({ ...SPARSE_LISTING, area_gross: 100 })
    expect(entries.find(e => e.param === 'area_min')).toMatchObject({ op: 'gte', column: 'area_gross', value: 75, urlValue: '75' })
    expect(entries.find(e => e.param === 'area_max')).toMatchObject({ op: 'lte', column: 'area_gross', value: 125, urlValue: '125' })
  })

  it('derives year_built_min/year_built_max at ±5', () => {
    const entries = buildSimilarityEntries({ ...SPARSE_LISTING, year_built: 2010 })
    expect(entries.find(e => e.param === 'year_built_min')).toMatchObject({ value: 2005, urlValue: '2005' })
    expect(entries.find(e => e.param === 'year_built_max')).toMatchObject({ value: 2015, urlValue: '2015' })
  })

  it('derives floor_min/floor_max as the exact floor', () => {
    const entries = buildSimilarityEntries({ ...SPARSE_LISTING, floor: 4 })
    expect(entries.find(e => e.param === 'floor_min')).toMatchObject({ op: 'gte', value: 4, urlValue: '4' })
    expect(entries.find(e => e.param === 'floor_max')).toMatchObject({ op: 'lte', value: 4, urlValue: '4' })
  })

  it('uses the exact rooms value', () => {
    const entries = buildSimilarityEntries({ ...SPARSE_LISTING, rooms: 3 })
    expect(entries.find(e => e.param === 'rooms')).toMatchObject({ op: 'eq', column: 'rooms', value: 3, urlValue: '3' })
  })

  it('joins multiple purchase_conditions into one comma-separated urlValue', () => {
    const entries = buildSimilarityEntries({ ...SPARSE_LISTING, purchase_conditions: ['cash', 'mortgage'] })
    expect(entries.find(e => e.param === 'purchase_conditions')).toMatchObject({
      op: 'overlaps', column: 'purchase_conditions', value: ['cash', 'mortgage'], urlValue: 'cash,mortgage',
    })
  })

  // Task 803 Revision 1 (R11/AC11, closes F1) — `purchase_conditions` must not throw on a NULL
  // column; `src/types/database.ts:267` declares it non-nullable but the repo's own runtime reads
  // (`edit/page.tsx:104`, `filterEngine.ts:443`) do not trust that declaration.
  it('does not throw and omits the purchase_conditions entry when the column is null (R11/AC11)', () => {
    expect(() => buildSimilarityEntries({ ...SPARSE_LISTING, purchase_conditions: null })).not.toThrow()
    expect(buildSimilarityEntries({ ...SPARSE_LISTING, purchase_conditions: null }).find(e => e.param === 'purchase_conditions')).toBeUndefined()
  })

  it('does not throw and omits the purchase_conditions entry when the column is undefined (R11/AC11)', () => {
    expect(() => buildSimilarityEntries({ ...SPARSE_LISTING, purchase_conditions: undefined })).not.toThrow()
    expect(buildSimilarityEntries({ ...SPARSE_LISTING, purchase_conditions: undefined }).find(e => e.param === 'purchase_conditions')).toBeUndefined()
  })
})

describe('entriesForAttempt', () => {
  const entries = buildSimilarityEntries(FULL_LISTING)

  it('attempt 1 returns every tier', () => {
    expect(entriesForAttempt(entries, 1)).toEqual(entries)
  })

  it('attempt 2 drops tier B only', () => {
    const result = entriesForAttempt(entries, 2)
    expect(result.some(e => e.tier === 'B')).toBe(false)
    expect(result.filter(e => e.tier === 'A')).toHaveLength(1)
    expect(result.filter(e => e.tier === 'C')).toHaveLength(7)
  })

  it('attempt 3 keeps tier A only', () => {
    const result = entriesForAttempt(entries, 3)
    expect(result).toHaveLength(1)
    expect(result[0]!.tier).toBe('A')
  })

  it('attempt 4 returns no entries (core only, reproduces pre-803 behaviour)', () => {
    expect(entriesForAttempt(entries, 4)).toEqual([])
  })
})

/** Records every call for assertion — the same lightweight recording-mock shape used by
 * `SimilarListings.visibility.test.ts` and `SimilarListings.ladder.test.ts` for the AC6 rung walk. */
function createRecordingQuery(): SimilarityQueryBuilder & { calls: [string, string, unknown][] } {
  const calls: [string, string, unknown][] = []
  const q: SimilarityQueryBuilder & { calls: typeof calls } = {
    calls,
    eq: (c, v) => { calls.push(['eq', c, v]); return q },
    gte: (c, v) => { calls.push(['gte', c, v]); return q },
    lte: (c, v) => { calls.push(['lte', c, v]); return q },
    in: (c, v) => { calls.push(['in', c, v]); return q },
    overlaps: (c, v) => { calls.push(['overlaps', c, v]); return q },
  }
  return q
}

describe('applySimilarityEntries', () => {
  it('chains one builder call per entry, in order, with the correct op/column/value', () => {
    const entries: SimilarityEntry[] = [
      { tier: 'A', param: 'location_id', op: 'eq', column: 'location_id', value: 5, urlValue: '5' },
      { tier: 'C', param: 'area_min', op: 'gte', column: 'area_gross', value: 75, urlValue: '75' },
      { tier: 'B', param: 'condition', op: 'in', column: 'condition', value: ['good'], urlValue: 'good' },
      { tier: 'B', param: 'purchase_conditions', op: 'overlaps', column: 'purchase_conditions', value: ['cash'], urlValue: 'cash' },
    ]
    const q = createRecordingQuery()
    applySimilarityEntries(q, entries)
    expect(q.calls).toEqual([
      ['eq', 'location_id', 5],
      ['gte', 'area_gross', 75],
      ['in', 'condition', ['good']],
      ['overlaps', 'purchase_conditions', ['cash']],
    ])
  })

  it('applies no calls for an empty entry list', () => {
    const q = createRecordingQuery()
    applySimilarityEntries(q, [])
    expect(q.calls).toEqual([])
  })
})

describe('buildSimilarityHref', () => {
  it('places type/property_type first, then the entries in order — AC2 parity', () => {
    const entries = buildSimilarityEntries({ ...SPARSE_LISTING, location_id: 1 })
    const href = buildSimilarityHref('en', { listingType: 'sale', propertyType: 'apartment' }, entries)
    expect(href).toBe('/en/listings?type=sale&property_type=apartment&location_id=1')
  })

  it('omits a tier param entirely when the entry list does not carry it (relaxed case)', () => {
    const href = buildSimilarityHref('en', { listingType: 'sale', propertyType: 'apartment' }, [])
    expect(href).toBe('/en/listings?type=sale&property_type=apartment')
    expect(href).not.toContain('location_id')
    expect(href).not.toContain('condition')
  })

  it('never carries an amenity param when attempt 3 (tier A only) settled', () => {
    const entries = buildSimilarityEntries(FULL_LISTING)
    const settled = entriesForAttempt(entries, 3)
    const href = buildSimilarityHref('en', { listingType: 'sale', propertyType: 'apartment' }, settled)
    expect(href).toContain('location_id=5')
    expect(href).not.toContain('condition')
    expect(href).not.toContain('area_min')
  })
})
