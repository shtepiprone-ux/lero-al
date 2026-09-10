import { describe, it, expect, vi } from 'vitest'
import { runSimilarityLadder, resolveSimilarListingsPresentation } from '../SimilarListings'
import { buildSimilarityEntries, entriesForAttempt } from '@/modules/listings/domain/similarity'

// Task 803 R5/AC5 (attempt-count-bounded relaxation) and R3/R4/AC3/AC4 (render cap + view-all
// gating, asserted here rather than by eye per AC4's own instruction).

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

function fakeRow(id: string) {
  return { id, slug: `listing-${id}` }
}

describe('runSimilarityLadder (AC5)', () => {
  const entries = buildSimilarityEntries(FULL_LISTING)

  it('stops at attempt 1 when the first rung already returns rows — 1 round trip', async () => {
    const fetchAttempt = vi.fn(async () => [fakeRow('a'), fakeRow('b')])
    const result = await runSimilarityLadder(fetchAttempt, entries)
    expect(result.attemptCount).toBe(1)
    expect(fetchAttempt).toHaveBeenCalledTimes(1)
    expect(result.listings).toHaveLength(2)
    expect(result.settledEntries).toEqual(entriesForAttempt(entries, 1))
  })

  it('a listing whose full predicate matches nothing but whose property_type matches others settles at attempt 4, running exactly 4 round trips', async () => {
    const fetchAttempt = vi.fn(async (attempt: number) => (attempt === 4 ? [fakeRow('z')] : []))
    const result = await runSimilarityLadder(fetchAttempt, entries)
    expect(result.attemptCount).toBe(4)
    expect(fetchAttempt).toHaveBeenCalledTimes(4)
    expect(fetchAttempt).toHaveBeenNthCalledWith(1, 1)
    expect(fetchAttempt).toHaveBeenNthCalledWith(2, 2)
    expect(fetchAttempt).toHaveBeenNthCalledWith(3, 3)
    expect(fetchAttempt).toHaveBeenNthCalledWith(4, 4)
    expect(result.settledEntries).toEqual([]) // attempt 4 = core only, no similarity tier
  })

  it('never exceeds 4 round trips even when every rung is empty (block renders nothing)', async () => {
    const fetchAttempt = vi.fn(async () => [])
    const result = await runSimilarityLadder(fetchAttempt, entries)
    expect(result.attemptCount).toBe(4)
    expect(fetchAttempt).toHaveBeenCalledTimes(4)
    expect(result.listings).toBeNull()
  })
})

describe('resolveSimilarListingsPresentation (AC3/AC4)', () => {
  const CORE = { listingType: 'sale', propertyType: 'apartment' }

  it('AC3 — caps the DOM to exactly 8 cards when 9 rows were fetched', () => {
    const nine = Array.from({ length: 9 }, (_, i) => fakeRow(String(i)))
    const settled = entriesForAttempt(buildSimilarityEntries(FULL_LISTING), 3)
    const result = resolveSimilarListingsPresentation(nine, settled, 'en', CORE)
    expect(result.rendered).toHaveLength(8)
  })

  it('AC4 — a 9th row present renders the view-all control, href equal to the settled predicate\'s URL (asserted, not eyeballed)', () => {
    const nine = Array.from({ length: 9 }, (_, i) => fakeRow(String(i)))
    const settled = entriesForAttempt(buildSimilarityEntries(FULL_LISTING), 3) // attempt 3 settled = tier A only
    const result = resolveSimilarListingsPresentation(nine, settled, 'en', CORE)
    expect(result.hasMore).toBe(true)
    expect(result.viewAllHref).toBe('/en/listings?type=sale&property_type=apartment&location_id=5')
  })

  it('AC4 — 8 or fewer rows renders no view-all control (href undefined)', () => {
    const eight = Array.from({ length: 8 }, (_, i) => fakeRow(String(i)))
    const settled = entriesForAttempt(buildSimilarityEntries(FULL_LISTING), 1)
    const result = resolveSimilarListingsPresentation(eight, settled, 'en', CORE)
    expect(result.hasMore).toBe(false)
    expect(result.viewAllHref).toBeUndefined()
    expect(result.rendered).toHaveLength(8)
  })

  it('AC4 — the href never carries an amenity/numeric param when attempt 3 (tier A only) settled', () => {
    const nine = Array.from({ length: 9 }, (_, i) => fakeRow(String(i)))
    const settled = entriesForAttempt(buildSimilarityEntries(FULL_LISTING), 3)
    const result = resolveSimilarListingsPresentation(nine, settled, 'en', CORE)
    expect(result.viewAllHref).not.toContain('condition')
    expect(result.viewAllHref).not.toContain('area_min')
    expect(result.viewAllHref).toContain('location_id=5')
  })
})
