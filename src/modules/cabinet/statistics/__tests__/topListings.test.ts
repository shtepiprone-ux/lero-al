import { describe, it, expect } from 'vitest'
import { rankTopListings, type OwnListingTitle } from '../topListings'
import type { ActivityByListingRow } from '@/modules/analytics/activity/types'

function row(over: Partial<ActivityByListingRow>): ActivityByListingRow {
  return {
    listingId: 'l-1',
    recordedViews: 1,
    whatsappClicks: 0,
    listingInquirySubmissions: 0,
    lastActivityDate: '2026-09-10',
    ...over,
  }
}

const LISTINGS: OwnListingTitle[] = [
  { id: 'l-1', title: 'Listing 1' },
  { id: 'l-2', title: 'Listing 2' },
  { id: 'l-3', title: 'Listing 3' },
]

describe('rankTopListings', () => {
  it('drops rows with recordedViews <= 0', () => {
    const rows = [row({ listingId: 'l-1', recordedViews: 0 }), row({ listingId: 'l-2', recordedViews: 5 })]
    expect(rankTopListings(rows, LISTINGS).map((r) => r.listingId)).toEqual(['l-2'])
  })

  it('sorts by recordedViews descending', () => {
    const rows = [
      row({ listingId: 'l-1', recordedViews: 3 }),
      row({ listingId: 'l-2', recordedViews: 9 }),
      row({ listingId: 'l-3', recordedViews: 5 }),
    ]
    expect(rankTopListings(rows, LISTINGS).map((r) => r.listingId)).toEqual(['l-2', 'l-3', 'l-1'])
  })

  it('breaks a views tie by lastActivityDate descending', () => {
    const rows = [
      row({ listingId: 'l-1', recordedViews: 5, lastActivityDate: '2026-09-01' }),
      row({ listingId: 'l-2', recordedViews: 5, lastActivityDate: '2026-09-10' }),
    ]
    expect(rankTopListings(rows, LISTINGS).map((r) => r.listingId)).toEqual(['l-2', 'l-1'])
  })

  it('breaks a views+date tie by listingId ascending, and puts a null lastActivityDate last', () => {
    const rows = [
      row({ listingId: 'l-2', recordedViews: 5, lastActivityDate: null as unknown as string }),
      row({ listingId: 'l-1', recordedViews: 5, lastActivityDate: '2026-09-10' }),
      row({ listingId: 'l-3', recordedViews: 5, lastActivityDate: '2026-09-10' }),
    ]
    expect(rankTopListings(rows, LISTINGS).map((r) => r.listingId)).toEqual(['l-1', 'l-3', 'l-2'])
  })

  it('drops a listing id missing from the owner list', () => {
    const rows = [row({ listingId: 'l-1', recordedViews: 5 }), row({ listingId: 'not-mine-anymore', recordedViews: 99 })]
    expect(rankTopListings(rows, LISTINGS).map((r) => r.listingId)).toEqual(['l-1'])
  })

  it('joins the title from the owner listing list', () => {
    const rows = [row({ listingId: 'l-2', recordedViews: 5 })]
    expect(rankTopListings(rows, LISTINGS)).toEqual([{ listingId: 'l-2', title: 'Listing 2', recordedViews: 5 }])
  })

  it('caps at the given limit (default 5)', () => {
    const rows = Array.from({ length: 8 }, (_, i) => row({ listingId: `l-${i}`, recordedViews: 8 - i }))
    const listings: OwnListingTitle[] = rows.map((r) => ({ id: r.listingId, title: r.listingId }))
    expect(rankTopListings(rows, listings)).toHaveLength(5)
    expect(rankTopListings(rows, listings, 2)).toHaveLength(2)
  })
})
