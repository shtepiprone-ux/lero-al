import { describe, it, expect } from 'vitest'

// ── Pure unit tests for liveCounts reduction logic ────────────────────────────
//
// These tests verify the arithmetic that FavoritesShell uses to maintain live
// type counts across the session — without mounting the component.
// The exact same logic lives in the setLiveCounts calls in FavoritesShell.tsx.

function decrementCount(
  counts: Record<string, number>,
  type: string,
): Record<string, number> {
  return {
    ...counts,
    [type]: Math.max(0, (counts[type] ?? 0) - 1),
  }
}

function incrementCount(
  counts: Record<string, number>,
  type: string,
): Record<string, number> {
  return {
    ...counts,
    [type]: (counts[type] ?? 0) + 1,
  }
}

function totalFavorites(counts: Record<string, number>): number {
  return Object.values(counts).reduce((a, b) => a + b, 0)
}

describe('FavoritesShell liveCounts logic (F-01 fix)', () => {
  it('totalFavorites reaches 0 after all items removed', () => {
    let counts: Record<string, number> = { apartment: 2, house: 1 }

    counts = decrementCount(counts, 'apartment')
    counts = decrementCount(counts, 'apartment')
    counts = decrementCount(counts, 'house')

    expect(totalFavorites(counts)).toBe(0)
  })

  it('totalFavorites is correct after partial removal', () => {
    let counts: Record<string, number> = { apartment: 3, house: 2 }

    counts = decrementCount(counts, 'apartment')

    expect(counts.apartment).toBe(2)
    expect(totalFavorites(counts)).toBe(4)
  })

  it('decrement does not go below 0 (floor guard)', () => {
    let counts: Record<string, number> = { apartment: 0 }

    counts = decrementCount(counts, 'apartment')

    expect(counts.apartment).toBe(0)
    expect(totalFavorites(counts)).toBe(0)
  })

  it('increment handles missing type key (first favorite of a type)', () => {
    const counts: Record<string, number> = { apartment: 2 }

    const updated = incrementCount(counts, 'house')

    expect(updated.house).toBe(1)
    expect(totalFavorites(updated)).toBe(3)
  })

  it('increment + decrement round-trip preserves original count', () => {
    let counts: Record<string, number> = { apartment: 5, house: 3 }

    counts = incrementCount(counts, 'apartment')  // 6
    counts = decrementCount(counts, 'apartment')  // back to 5

    expect(counts.apartment).toBe(5)
    expect(totalFavorites(counts)).toBe(8)
  })

  it('empty counts produce totalFavorites = 0 (full empty state trigger)', () => {
    const counts: Record<string, number> = {}
    expect(totalFavorites(counts)).toBe(0)
  })

  it('counts with all-zero values also produce totalFavorites = 0', () => {
    const counts = { apartment: 0, house: 0, land: 0 }
    expect(totalFavorites(counts)).toBe(0)
  })

  it('decrement of missing type does not crash (defaults to 0)', () => {
    const counts = { apartment: 2 }

    const updated = decrementCount(counts, 'house')  // 'house' not in counts

    expect(updated.house).toBe(0)
    expect(updated.apartment).toBe(2)
  })
})
