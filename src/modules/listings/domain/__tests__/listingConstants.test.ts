import { describe, it, expect } from 'vitest'
import {
  LISTING_ACTIVE_WINDOW_MS,
  computeExpiresAt,
  shouldReStampExpiresAt,
} from '../listingConstants'
import type { ListingStatus } from '@/types/database'

describe('LISTING_ACTIVE_WINDOW_MS', () => {
  it('equals 30 days in milliseconds', () => {
    expect(LISTING_ACTIVE_WINDOW_MS).toBe(30 * 24 * 60 * 60 * 1000)
  })
})

describe('computeExpiresAt', () => {
  it('returns ISO string 30 days from provided timestamp', () => {
    const now = new Date('2026-06-18T12:00:00Z').getTime()
    const result = computeExpiresAt(now)
    const parsed = new Date(result)
    expect(parsed.toISOString()).toBe('2026-07-18T12:00:00.000Z')
  })

  it('returns future date from Date.now() when no arg', () => {
    const before = Date.now()
    const result = computeExpiresAt()
    const after = Date.now()
    const resultMs = new Date(result).getTime()
    expect(resultMs).toBeGreaterThanOrEqual(before + LISTING_ACTIVE_WINDOW_MS)
    expect(resultMs).toBeLessThanOrEqual(after + LISTING_ACTIVE_WINDOW_MS)
  })
})

describe('shouldReStampExpiresAt — policy-driven, not hardcoded', () => {
  const ALL_STATUSES: ListingStatus[] = [
    'active', 'inactive', 'sold', 'rented', 'archived', 'pending', 'expired',
  ]

  it('returns true for active (the only publicEligible status today)', () => {
    expect(shouldReStampExpiresAt('active')).toBe(true)
  })

  it('returns false for every non-publicEligible status', () => {
    const nonEligible = ALL_STATUSES.filter(s => s !== 'active')
    for (const s of nonEligible) {
      expect(shouldReStampExpiresAt(s), `${s} should NOT re-stamp`).toBe(false)
    }
  })

  it('expired → false (expired is NOT publicEligible)', () => {
    expect(shouldReStampExpiresAt('expired')).toBe(false)
  })
})
