import { describe, it, expect } from 'vitest'
import { buildSimilarityRungQuery } from '../SimilarListings'
import { buildSimilarityEntries, SIMILARITY_ATTEMPTS } from '@/modules/listings/domain/similarity'

// Task 803 R6/AC6 — the public-visibility invariant (`docs/critical-flow-registry.md`, "Listing
// public visibility invariant", names `SimilarListings.tsx` explicitly) must hold at EVERY rung of
// the relaxation ladder. `applyPublicVisibility` is canonical/unit-tested elsewhere
// (`src/modules/listings/lib/__tests__/visibility.test.ts`) — this test proves SimilarListings'
// rung-building actually COMPOSES it, not that the predicate itself is correct.

interface Call { op: string; column: string; value: unknown }

function createRecordingQuery() {
  const calls: Call[] = []
  const q = {
    calls,
    eq: (column: string, value: unknown) => { calls.push({ op: 'eq', column, value }); return q },
    neq: (column: string, value: unknown) => { calls.push({ op: 'neq', column, value }); return q },
    gte: (column: string, value: unknown) => { calls.push({ op: 'gte', column, value }); return q },
    lte: (column: string, value: unknown) => { calls.push({ op: 'lte', column, value }); return q },
    in: (column: string, values: unknown[]) => { calls.push({ op: 'in', column, value: values }); return q },
    overlaps: (column: string, values: unknown[]) => { calls.push({ op: 'overlaps', column, value: values }); return q },
  }
  return q
}

const FULL_LISTING = {
  location_id: 5,
  condition: 'good',
  heating: 'central',
  wall_type: 'brick',
  market_type: 'primary',
  offer_type: 'developer',
  purchase_conditions: ['cash'],
  rooms: 3,
  area_gross: 100,
  floor: 4,
  year_built: 2010,
}

const CORE = { currentId: 'listing-current', propertyType: 'apartment', listingType: 'sale' }

describe('buildSimilarityRungQuery — public-visibility invariant across all 4 rungs (AC6)', () => {
  const entries = buildSimilarityEntries(FULL_LISTING)

  it.each(SIMILARITY_ATTEMPTS)('rung %i contains the visibility predicate, neq(id), property_type and listing_type', (attempt) => {
    const q = buildSimilarityRungQuery(createRecordingQuery, CORE, entries, attempt)
    const calls = q.calls

    // applyPublicVisibility: single-status eligible set → .eq('status','active') + .gte('expires_at', ...)
    // (see visibility.ts:120-127 — asserting the SHAPE it composes, not re-deriving its policy).
    expect(calls.some(c => c.op === 'eq' && c.column === 'status' && c.value === 'active')).toBe(true)
    expect(calls.some(c => c.op === 'gte' && c.column === 'expires_at')).toBe(true)

    expect(calls.some(c => c.op === 'neq' && c.column === 'id' && c.value === CORE.currentId)).toBe(true)
    expect(calls.some(c => c.op === 'eq' && c.column === 'property_type' && c.value === CORE.propertyType)).toBe(true)
    expect(calls.some(c => c.op === 'eq' && c.column === 'listing_type' && c.value === CORE.listingType)).toBe(true)
  })

  it('rung 1 also carries the full tiered predicate (A+B+C)', () => {
    const q = buildSimilarityRungQuery(createRecordingQuery, CORE, entries, 1)
    expect(q.calls.some(c => c.column === 'location_id')).toBe(true)
    expect(q.calls.some(c => c.column === 'condition')).toBe(true)
    expect(q.calls.some(c => c.column === 'area_gross')).toBe(true)
  })

  it('rung 4 carries the core predicate only — no similarity tier', () => {
    const q = buildSimilarityRungQuery(createRecordingQuery, CORE, entries, 4)
    expect(q.calls.some(c => c.column === 'location_id')).toBe(false)
    expect(q.calls.some(c => c.column === 'condition')).toBe(false)
    expect(q.calls.some(c => c.column === 'area_gross')).toBe(false)
  })
})
