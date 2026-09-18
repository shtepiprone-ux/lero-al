import { describe, it, expect } from 'vitest'
import { LISTING_STATUS_COLOR, VISIBILITY_TONE_COLOR } from '../listingStatusTone'
import { theme } from '@/design-system/mantine/theme'
import type { ListingStatus } from '@/types/database'

// Restated from src/types/database.ts:43 — the `satisfies readonly ListingStatus[]` guard means
// a status added to (or removed from) the real union fails this file's own compile, not just a
// runtime assertion, so the test can't go stale silently.
const ALL_STATUSES = ['active', 'inactive', 'sold', 'rented', 'archived', 'pending', 'expired'] as const satisfies readonly ListingStatus[]

describe('LISTING_STATUS_COLOR', () => {
  it('has exactly one entry per ListingStatus member', () => {
    expect(Object.keys(LISTING_STATUS_COLOR).sort()).toEqual([...ALL_STATUSES].sort())
  })

  it('every value is a real theme colour key', () => {
    const themeColorKeys = Object.keys(theme.colors ?? {})
    for (const status of ALL_STATUSES) {
      expect(themeColorKeys).toContain(LISTING_STATUS_COLOR[status])
    }
  })

  it('matches ListingCard.tsx getBadges() for the four statuses it already defines', () => {
    expect(LISTING_STATUS_COLOR.sold).toBe('blueLight')
    expect(LISTING_STATUS_COLOR.rented).toBe('purple')
    expect(LISTING_STATUS_COLOR.archived).toBe('gray')
    expect(LISTING_STATUS_COLOR.expired).toBe('yellow')
  })
})

describe('VISIBILITY_TONE_COLOR', () => {
  it('has exactly the four spec buckets, each a real theme colour key', () => {
    const themeColorKeys = Object.keys(theme.colors ?? {})
    const buckets = ['positive', 'warning', 'danger', 'neutral'] as const
    expect(Object.keys(VISIBILITY_TONE_COLOR).sort()).toEqual([...buckets].sort())
    for (const bucket of buckets) {
      expect(themeColorKeys).toContain(VISIBILITY_TONE_COLOR[bucket])
    }
  })
})
