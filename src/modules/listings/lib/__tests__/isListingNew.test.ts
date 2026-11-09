import { afterEach, describe, expect, it, vi } from 'vitest'
import { isListingNew } from '../isListingNew'
import { LISTING_NEW_DAYS } from '@/modules/listings/constants'

const DAY = 86_400_000
const NOW = Date.parse('2026-06-15T12:00:00.000Z')
const iso = (ms: number) => new Date(ms).toISOString()

afterEach(() => { vi.useRealTimers() })

describe('isListingNew', () => {
  it('uses the window of LISTING_NEW_DAYS days', () => {
    expect(LISTING_NEW_DAYS).toBe(7)
  })

  it('is true inside the window and false at and beyond its edge', () => {
    expect(isListingNew(iso(NOW), NOW)).toBe(true)
    expect(isListingNew(iso(NOW - 3 * DAY), NOW)).toBe(true)
    expect(isListingNew(iso(NOW - LISTING_NEW_DAYS * DAY + 1), NOW)).toBe(true)
    expect(isListingNew(iso(NOW - LISTING_NEW_DAYS * DAY), NOW)).toBe(false)
    expect(isListingNew(iso(NOW - LISTING_NEW_DAYS * DAY - 1), NOW)).toBe(false)
    expect(isListingNew(iso(NOW - 90 * DAY), NOW)).toBe(false)
  })

  it('reads the clock when no time is given', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    expect(isListingNew(iso(NOW - DAY))).toBe(true)
    vi.setSystemTime(NOW + 10 * DAY)
    expect(isListingNew(iso(NOW - DAY))).toBe(false)
  })
})
