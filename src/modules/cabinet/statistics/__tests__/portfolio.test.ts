import { describe, it, expect } from 'vitest'
import { portfolioSegments } from '../portfolio'
import type { ListingStatus } from '@/types/database'

function statusCounts(over: Partial<Record<ListingStatus, number>> = {}): Record<ListingStatus, number> {
  return {
    active: 0,
    pending: 0,
    inactive: 0,
    sold: 0,
    rented: 0,
    archived: 0,
    expired: 0,
    ...over,
  }
}

describe('portfolioSegments', () => {
  it('the three segments are disjoint and sum to the whole portfolio', () => {
    const counts = statusCounts({ active: 15, pending: 2, inactive: 3, sold: 1, rented: 2, archived: 1, expired: 1 })
    const hidden = 3
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    const segments = portfolioSegments(counts, hidden)
    expect(segments.visible + segments.needsAction + segments.notVisible).toBe(total)
  })

  it('visible is active minus hidden', () => {
    expect(portfolioSegments(statusCounts({ active: 12 }), 2).visible).toBe(10)
  })

  it('needsAction is pending plus hidden', () => {
    expect(portfolioSegments(statusCounts({ pending: 4 }), 3).needsAction).toBe(7)
  })

  it('notVisible sums inactive, sold, rented, archived and expired', () => {
    const counts = statusCounts({ inactive: 1, sold: 2, rented: 3, archived: 4, expired: 5 })
    expect(portfolioSegments(counts, 0).notVisible).toBe(15)
  })

  it('an all-zero portfolio is all-zero segments', () => {
    expect(portfolioSegments(statusCounts(), 0)).toEqual({ visible: 0, needsAction: 0, notVisible: 0 })
  })
})
