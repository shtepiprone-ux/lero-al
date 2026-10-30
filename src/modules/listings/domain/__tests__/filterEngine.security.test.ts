// @vitest-environment node
/**
 * Security and robustness (Task 923 Revision 7): the public search takes every filter from the address bar, which anybody can edit.
 * parseSearchParams must turn any URL into values the database can take (an unknown word or an out-of-range number is DROPPED, never passed on), and
 * applyListingFilters must turn them into exactly the intended conditions.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyListingFilters, countActiveFilterValues, countActiveFilters, getFilterVisibility, parseSearchParams, type ParsedFilters } from '../filterEngine'

const parse = (qs: string | Record<string, string | string[] | undefined>) => parseSearchParams(typeof qs === 'string' ? new URLSearchParams(qs) : qs)

/** a query builder that records every call */
function recorder() {
  const calls: [string, ...unknown[]][] = []
  const q: Record<string, (...a: unknown[]) => unknown> = {}
  for (const m of ['eq', 'in', 'gte', 'lte', 'or', 'contains', 'overlaps']) q[m] = (...a: unknown[]) => { calls.push([m, ...a]); return q }
  return { q, calls }
}
const apply = (qs: string) => { const r = recorder(); applyListingFilters(r.q, parse(qs)); return r.calls }

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-17T10:00:00Z')) })
afterEach(() => vi.useRealTimers())

describe('parseSearchParams: defaults and shapes', () => {
  it('an empty address means the defaults', () => {
    expect(parse('')).toMatchObject({ tab: 'active', listingType: '', propertyType: '', locationId: undefined, sort: 'newest', page: 1, currency: 'ALL', isPremium: false, rooms: [], conditions: [] })
  })

  it('reads URLSearchParams and the page-style record alike; an array takes its first value', () => {
    expect(parse({ type: 'sale', property_type: ['house', 'land'], page: '3' })).toMatchObject({ listingType: 'sale', propertyType: 'house', page: 3 })
    expect(parse('type=rent&page=2')).toMatchObject({ listingType: 'rent', page: 2 })
    expect(parse({ type: [] })).toMatchObject({ listingType: '' })
  })

  it('the tab, the currency and the premium flag take exactly their words', () => {
    expect(parse('tab=closed').tab).toBe('closed')
    expect(parse('tab=CLOSED').tab).toBe('active')
    expect(parse('currency=EUR').currency).toBe('EUR')
    expect(parse('currency=USD').currency).toBe('ALL')
    expect(parse('premium=true').isPremium).toBe(true)
    expect(parse('premium=1').isPremium).toBe(false)
  })
})

describe('parseSearchParams: nothing the database cannot take gets through', () => {
  it.each([['type', 'lease'], ['type', 'SALE'], ['property_type', 'castle'], ['market_type', 'black'], ['sort', 'price; drop table'], ['sort', '__proto__']])('an unknown %s=%s is dropped', (key, value) => {
    const f = parse(`${key}=${encodeURIComponent(value)}`)
    expect(f.listingType).toBe('')
    expect(f.propertyType).toBe('')
    expect(f.marketType).toBe('')
    expect(f.sort).toBe('newest')
  })

  it('a multi-value filter keeps only the known words', () => {
    const f = parse('condition=good,ruined,new_build&heating=gas,lava&wall_type=brick,x&offer_type=owner,thief&purchase_conditions=mortgage,free&layout_features=,')
    expect(f.conditions).toEqual(['good', 'new_build'])
    expect(f.heatingTypes).toEqual(['gas'])
    expect(f.wallTypes).toEqual(['brick'])
    expect(f.offerTypes).toEqual(['owner'])
    expect(f.purchaseConditions).toEqual(['mortgage'])
    expect(f.layoutFeatures).toEqual([])
  })

  it('numbers that do not fit a database integer are dropped', () => {
    const f = parse(`price_min=${'9'.repeat(30)}&price_max=2147483647&area_min=-2147483647&area_max=2147483648&location_id=abc&floor_min=--1&year_built_min=1e3`)
    expect(f.priceMin).toBeUndefined()
    expect(f.priceMax).toBe(2147483647)
    expect(f.areaMin).toBe(-2147483647)
    expect(f.areaMax).toBeUndefined()
    expect(f.locationId).toBeUndefined()
    expect(f.floorMin).toBeUndefined()
    expect(f.yearBuiltMin).toBe(1)
  })

  it('rooms are whole numbers from 1 to 99', () => {
    expect(parse('rooms=1,2,5').rooms).toEqual([1, 2, 5])
    // hex is read as a number and written back as a decimal one, so it can only ever add digits
    expect(parse('rooms=0,-1,1.5,abc,1e999,Infinity,100,99,0x10').rooms).toEqual([99, 16])
  })

  it('the page is at least 1 and at most 10 000', () => {
    expect(parse('page=0').page).toBe(1)
    expect(parse('page=-5').page).toBe(1)
    expect(parse('page=abc').page).toBe(1)
    expect(parse('page=9999999').page).toBe(10_000)
    expect(parse(`page=${'9'.repeat(40)}`).page).toBe(1)
  })

  it('a date in the future or one that is not a date is dropped; today and the past are kept', () => {
    expect(parse('date_from=2026-10-17&date_to=2020-01-01')).toMatchObject({ dateFrom: '2026-10-17', dateTo: '2020-01-01' })
    expect(parse('date_from=2026-10-18&date_to=tomorrow')).toMatchObject({ dateFrom: '', dateTo: '' })
    expect(parse('date_from=2999-01-01').dateFrom).toBe('')
  })
})

describe('applyListingFilters', () => {
  it('no filters add no condition', () => {
    expect(apply('')).toEqual([])
  })

  it('equality and range filters', () => {
    expect(apply('type=sale&property_type=house&location_id=7&price_min=100&price_max=900&area_min=30&area_max=90&floors_total_min=2&floors_total_max=9&year_built_min=1990&year_built_max=2020')).toEqual([
      ['eq', 'listing_type', 'sale'], ['eq', 'property_type', 'house'], ['eq', 'location_id', 7],
      ['gte', 'price', 100], ['lte', 'price', 900], ['gte', 'area_gross', 30], ['lte', 'area_gross', 90],
      ['gte', 'total_floors', 2], ['lte', 'total_floors', 9], ['gte', 'year_built', 1990], ['lte', 'year_built', 2020],
    ])
  })

  it('a zero bound is ignored, as before', () => {
    expect(apply('price_min=0&price_max=0&area_min=0&floors_total_min=0')).toEqual([])
  })

  it('premium needs the flag AND a valid window ending after now', () => {
    expect(apply('premium=true')).toEqual([['eq', 'is_premium', true], ['or', 'premium_until.is.null,premium_until.gt.2026-10-17T10:00:00.000Z']])
  })

  it('rooms: exact values, "5 or more", or both, in one OR group', () => {
    expect(apply('rooms=1,3')).toEqual([['or', 'rooms.in.(1,3)']])
    expect(apply('rooms=5')).toEqual([['or', 'rooms.gte.5']])
    expect(apply('rooms=2,5')).toEqual([['or', 'rooms.in.(2),rooms.gte.5']])
  })

  it('rooms can only add digits to the filter text, never anything else', () => {
    const calls = apply('rooms=2,x),role.eq.admin,(3')
    expect(calls).toEqual([['or', 'rooms.in.(2)']])
  })

  it('multi-value filters use IN, arrays use contains / overlaps', () => {
    expect(apply('condition=good,new_build&heating=gas&wall_type=brick&offer_type=owner&market_type=secondary&layout_features=studio&purchase_conditions=mortgage')).toEqual([
      ['in', 'condition', ['good', 'new_build']], ['in', 'heating', ['gas']], ['in', 'wall_type', ['brick']], ['eq', 'market_type', 'secondary'], ['in', 'offer_type', ['owner']],
      ['contains', 'layout_features', ['studio']], ['overlaps', 'purchase_conditions', ['mortgage']],
    ])
  })

  it('a date range covers the whole last day', () => {
    const calls = apply('date_from=2026-01-01&date_to=2026-01-31')
    expect(calls[0]).toEqual(['gte', 'created_at', new Date('2026-01-01').toISOString()])
    const to = new Date('2026-01-31'); to.setHours(23, 59, 59, 999)
    expect(calls[1]).toEqual(['lte', 'created_at', to.toISOString()])
  })

  describe('floors: an underground floor is only asked for where it exists', () => {
    it('an ordinary floor range', () => {
      expect(apply('property_type=apartment&floor_min=2&floor_max=5')).toEqual([['eq', 'property_type', 'apartment'], ['gte', 'floor', 2], ['lte', 'floor', 5]])
    })

    it('a negative minimum for an apartment is ignored, as apartments have none', () => {
      expect(apply('property_type=apartment&floor_min=-3')).toEqual([['eq', 'property_type', 'apartment']])
    })

    it('a negative floor for a garage is applied', () => {
      expect(apply('property_type=garage&floor_min=-2&floor_max=-1')).toEqual([['eq', 'property_type', 'garage'], ['gte', 'floor', -2], ['lte', 'floor', -1]])
    })

    it('a negative floor with no type limits the search to the types that have one', () => {
      expect(apply('floor_min=-2')).toEqual([['in', 'property_type', ['garage', 'parking', 'warehouse', 'other']], ['gte', 'floor', -2]])
    })

    it('the lowest floor is -10', () => {
      expect(apply('property_type=garage&floor_min=-11')).toEqual([['eq', 'property_type', 'garage']])
      expect(apply('property_type=garage&floor_min=-10')).toEqual([['eq', 'property_type', 'garage'], ['gte', 'floor', -10]])
    })
  })
})

describe('active filter counts', () => {
  it('count one per value, one per filled bound, and none for the currency, tab, sort and page', () => {
    expect(countActiveFilters(parse('currency=EUR&tab=closed&sort=price_asc&page=3'))).toBe(0)
    expect(countActiveFilters(parse('type=sale&property_type=house&location_id=1&price_min=1&price_max=2&rooms=1,2&condition=good,new_build&market_type=secondary&premium=true'))).toBe(1 + 1 + 1 + 2 + 2 + 2 + 1 + 1)
  })

  it('the local draft state counts the same way', () => {
    expect(countActiveFilterValues({})).toBe(0)
    expect(countActiveFilterValues({ currency: 'EUR', property_type: 'house', price_min: 0, rooms: [1, 2], conditions: ['good'], market_type: 'secondary', listing_id: '5' })).toBe(1 + 1 + 2 + 1 + 1 + 1)
  })

  it('a zero bound still counts as given in the parsed state (it is a value, not an absent one)', () => {
    const f = { ...parse(''), priceMin: 0 } as ParsedFilters
    expect(countActiveFilters(f)).toBe(1)
  })
})

describe('getFilterVisibility', () => {
  it('shows every section when no type is chosen', () => {
    const v = getFilterVisibility(undefined)
    expect(v.shows('rooms')).toBe(true)
    expect(v.floorFilterMin).toBe(-10)
  })

  it('shows only a type\'s own sections and its floor minimum', () => {
    const v = getFilterVisibility('land')
    expect(v.shows('area')).toBe(true)
    expect(v.shows('rooms')).toBe(false)
    expect(getFilterVisibility('apartment').floorFilterMin).toBe(0)
  })
})

// Task 923 R38 (case SEC-S52-SRV-DENY)
it('[SEC-S52-SRV-DENY] The public search drops numbers outside a 32-bit integer and bounds rooms and page', () => {
  const f = parse(`price_min=1e20&price_max=${'9'.repeat(30)}&rooms=0,100,2&page=20000`)
  expect(f.priceMin === undefined || f.priceMin <= 2147483647).toBe(true)   // 1e20 is read as a whole number (1), never as 1e20: it cannot overflow the column
  expect(f.priceMax).toBeUndefined()
  expect(f.rooms).toEqual([2])                       // rooms 0 and 100 are dropped, 2 is kept
  expect(f.page).toBe(10_000)                        // the page is bounded
  expect(parse('price_max=2147483647').priceMax).toBe(2147483647)   // the control: the largest 32-bit integer passes
})

// Task 923 R67 (g): the listing-number search compares the public number, not the UUID key.
describe('listing number search', () => {
  it('filters on public_id with the integer that was typed', () => {
    expect(apply('listing_id=1234')).toEqual([['eq', 'public_id', 1234]])
    expect(apply('listing_id=%2042')).toEqual([['eq', 'public_id', 42]])
  })

  it('never compares the UUID id with an integer', () => {
    for (const qs of ['listing_id=7', 'listing_id=0', 'listing_id=-3', 'listing_id=99999999999']) {
      expect(apply(qs).some((c) => c[0] === 'eq' && c[1] === 'id'), qs).toBe(false)
    }
  })

  it('a number outside the integer range matches nothing instead of failing the whole search', () => {
    for (const qs of ['listing_id=0', 'listing_id=-3', 'listing_id=2147483648', 'listing_id=99999999999']) {
      expect(apply(qs), qs).toEqual([['eq', 'public_id', -1]])
    }
    expect(apply('listing_id=2147483647')).toEqual([['eq', 'public_id', 2147483647]])
  })

  it('text that is no number adds no condition', () => {
    expect(apply('listing_id=abc')).toEqual([])
    expect(apply('listing_id=')).toEqual([])
  })
})
