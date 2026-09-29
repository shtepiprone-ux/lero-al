/**
 * Review 2, F7/AC19 — `activitySeriesFrom` is the one series generator every KPI/chart Story fixture
 * uses; this proves its own invariant directly (independent of any rendered Story): each metric's
 * daily sum equals its `byListing` total, over exactly 30 points, for both canonical fixtures.
 */
import { describe, it, expect } from 'vitest'
import { activitySeriesFrom, CANONICAL_BY_LISTING, SORTED_BY_LISTING } from '@/stories/fixtures/agentStatistics.fixtures'
import type { ActivityByListingRow } from '@/modules/analytics/activity/types'

function totalOf(byListing: ActivityByListingRow[], key: keyof Pick<ActivityByListingRow, 'recordedViews' | 'whatsappClicks' | 'listingInquirySubmissions'>): number {
  return byListing.reduce((sum, row) => sum + row[key], 0)
}

describe('activitySeriesFrom', () => {
  it.each([
    ['CANONICAL_BY_LISTING', CANONICAL_BY_LISTING],
    ['SORTED_BY_LISTING', SORTED_BY_LISTING],
  ])('%s: 30 points, each metric daily sum equals its by-listing total', (_name, byListing) => {
    const result = activitySeriesFrom(byListing)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(30)
    expect(result.data.reduce((sum, p) => sum + p.recordedViews, 0)).toBe(totalOf(byListing, 'recordedViews'))
    expect(result.data.reduce((sum, p) => sum + p.whatsappClicks, 0)).toBe(totalOf(byListing, 'whatsappClicks'))
    expect(result.data.reduce((sum, p) => sum + p.listingInquirySubmissions, 0)).toBe(totalOf(byListing, 'listingInquirySubmissions'))
  })

  // Review 3, R22 — the owner's "reads as broken" complaint: the old even/floor spread produced
  // only 2 distinct values (3/4, or 0/1 for a small total), which looks like a flat line, not
  // traffic. The weighted spread must actually vary across the period.
  it('CANONICAL_BY_LISTING: the 30 daily recordedViews values are not all within 1 of each other', () => {
    const result = activitySeriesFrom(CANONICAL_BY_LISTING)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const views = result.data.map((p) => p.recordedViews)
    expect(Math.max(...views) - Math.min(...views)).toBeGreaterThan(1)
  })
})
