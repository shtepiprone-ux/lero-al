import { describe, it, expect } from 'vitest'
import { buildSimilarListingsHref } from '../ListingDetailView'

// Task 792 Revision 1 (review finding F2) — `buildSimilarListingsHref` builds R5's pre-filtered
// `/{locale}/listings` search from the current listing's own `listing_type`/`property_type`/
// `location_id`. Param names are the canonical `filterEngine.ts:181-183` ones (`type`, not
// `listing_type`); omitted values are absent from the query string rather than empty.
describe('buildSimilarListingsHref', () => {
  it('includes all three params when location_id is present', () => {
    const href = buildSimilarListingsHref('en', {
      listingType: 'sale',
      propertyType: 'apartment',
      locationId: 1,
    })
    expect(href).toBe('/en/listings?type=sale&property_type=apartment&location_id=1')
  })

  it('omits location_id from the query string when it is null', () => {
    const href = buildSimilarListingsHref('en', {
      listingType: 'sale',
      propertyType: 'apartment',
      locationId: null,
    })
    expect(href).toBe('/en/listings?type=sale&property_type=apartment')
    expect(href).not.toContain('location_id')
  })

  it('omits location_id from the query string when it is undefined', () => {
    const href = buildSimilarListingsHref('uk', {
      listingType: 'rent',
      propertyType: 'house',
      locationId: undefined,
    })
    expect(href).toBe('/uk/listings?type=rent&property_type=house')
    expect(href).not.toContain('location_id')
  })
})
