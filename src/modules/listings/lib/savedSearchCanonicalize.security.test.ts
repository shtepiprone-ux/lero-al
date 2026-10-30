// @vitest-environment node
/**
 * A saved search (Task 923 Revision 7, finding S53). The search page writes the rooms as ONE comma-separated value (`rooms=2,3`); the canonicaliser read repeated
 * parameters only, so a search saved with two rooms ticked silently LOST the rooms filter (and the alert e-mails matched every listing). On the way back it wrote
 * repeated parameters that the search page reads only the first of. Also: the action receives the filters from a browser, so every value is limited to what
 * the search itself accepts before it is stored.
 */
import { describe, expect, it } from 'vitest'
import { canonicalToSearchParams, canonicalizeFilters, computeFiltersHash } from './savedSearchCanonicalize'
import { parseSearchParams } from '../domain/filterEngine'

const sp = (qs: string) => new URLSearchParams(qs)

describe('rooms', () => {
  it.each([['rooms=2,3'], ['rooms=3&rooms=2'], ['rooms=3,2'], ['rooms=2&rooms=3,2'], ['rooms= 2 , 3 ']])('%s means rooms 2 and 3', (qs) => {
    expect(canonicalizeFilters(sp(qs)).rooms).toEqual([2, 3])
  })

  it('both ways of writing the same search give the same hash', () => {
    expect(computeFiltersHash(canonicalizeFilters(sp('property_type=house&rooms=2,3')))).toBe(computeFiltersHash(canonicalizeFilters(sp('rooms=3&rooms=2&property_type=house'))))
  })

  it('only whole numbers from 1 to 99 are kept, each once', () => {
    expect(canonicalizeFilters(sp('rooms=0,-1,1.5,abc,1e999,100,99,2,2')).rooms).toEqual([2, 99])
    expect(canonicalizeFilters(sp('rooms=abc')).rooms).toBeUndefined()
  })

  it('not more than 20 of them', () => {
    const many = Array.from({ length: 60 }, (_, i) => (i % 99) + 1).join(',')
    expect((canonicalizeFilters(sp(`rooms=${many}`)).rooms ?? []).length).toBeLessThanOrEqual(20)
  })
})

describe('the filters come from a browser: only what the search accepts is stored', () => {
  it('a record with arrays and strings is read like the address', () => {
    expect(canonicalizeFilters({ rooms: ['2,3', '4'], type: 'sale', condition: 'good,new_build' })).toMatchObject({ rooms: [2, 3, 4], listingType: 'sale', condition: ['good', 'new_build'] })
  })

  it.each([
    ['type', 'lease', 'listingType'], ['market_type', 'black', 'marketType'], ['property_type', '<script>', 'propertyType'], ['property_type', 'x'.repeat(65), 'propertyType'],
    ['property_type', 'Capital', 'propertyType'], ['property_type', 'a b', 'propertyType'],
  ])('an unusable %s=%s is not stored', (key, value, field) => {
    expect((canonicalizeFilters(sp(`${key}=${encodeURIComponent(value)}`)) as Record<string, unknown>)[field]).toBeUndefined()
  })

  it('a property type slug (including one an administrator added) is kept', () => {
    expect(canonicalizeFilters(sp('property_type=beach_villa')).propertyType).toBe('beach_villa')
  })

  it('unknown words inside a list are dropped, known ones kept and sorted', () => {
    const c = canonicalizeFilters(sp('condition=new_build,ruined,good&heating=gas,lava&wall_type=x&offer_type=owner,thief&layout_features=studio,castle&purchase_conditions=mortgage&purchase_conditions=free'))
    expect(c).toMatchObject({ condition: ['good', 'new_build'], heating: ['gas'], offerType: ['owner'], layoutFeatures: ['studio'], purchaseConditions: ['mortgage'] })
    expect(c.wallType).toBeUndefined()
  })

  it('numbers outside a database integer are not stored', () => {
    const c = canonicalizeFilters(sp(`price_min=${'9'.repeat(30)}&price_max=2147483647&area_min=2147483648&location_id=5`))
    expect(c.priceMin).toBeUndefined()
    expect(c.priceMax).toBe(2147483647)
    expect(c.areaMin).toBeUndefined()
    expect(c.locationId).toBe(5)
  })

  it('a value that only the record\'s prototype carries is not read', () => {
    const inherited = Object.create({ type: 'sale', rooms: '2' }) as Record<string, string>
    expect(canonicalizeFilters(inherited)).toEqual({})
  })

  it('a hostile record cannot crash it or add keys', () => {
    const c = canonicalizeFilters({ rooms: undefined, type: ['sale', 'rent'], __proto__: 'x', constructor: 'y', admin: 'true', price_min: ['5', '9'] } as never)
    expect(Object.keys(c).sort()).toEqual(['listingType', 'priceMin'])
    expect(c.listingType).toBe('sale')
    expect(c.priceMin).toBe(5)
  })
})

describe('restoring a search', () => {
  it('writes the rooms and the list filters as ONE comma-separated value, which the search page reads in full', () => {
    const canonical = canonicalizeFilters(sp('rooms=2,3&layout_features=studio,duplex&purchase_conditions=mortgage,installment&property_type=apartment&price_min=100'))
    const restored = canonicalToSearchParams(canonical)
    expect(restored.getAll('rooms')).toEqual(['2,3'])
    const parsed = parseSearchParams(restored)
    expect(parsed.rooms).toEqual([2, 3])
    expect(parsed.layoutFeatures).toEqual(['duplex', 'studio'])
    expect(parsed.purchaseConditions).toEqual(['installment', 'mortgage'])
    expect(parsed.propertyType).toBe('apartment')
    expect(parsed.priceMin).toBe(100)
  })

  it('the number of floors of the building is restored too (it was saved but never written back)', () => {
    const c = canonicalizeFilters(sp('floors_total_min=3&floors_total_max=9'))
    expect(c).toMatchObject({ floorsTotalMin: 3, floorsTotalMax: 9 })
    const parsed = parseSearchParams(canonicalToSearchParams(c))
    expect([parsed.floorsTotalMin, parsed.floorsTotalMax]).toEqual([3, 9])
  })

  it('nothing chosen gives an empty address', () => {
    expect(canonicalToSearchParams({}).toString()).toBe('')
  })

  it('reads the old shapes of a stored multi-value filter: a string, a list, and nothing', () => {
    const p = canonicalToSearchParams({ condition: 'new_build, good' as never, heating: ['gas', ''] as never, wallType: [] as never, offerType: null as never })
    expect(p.get('condition')).toBe('good,new_build')
    expect(p.get('heating')).toBe('gas')
    expect(p.has('wall_type')).toBe(false)
    expect(p.has('offer_type')).toBe(false)
    expect(canonicalToSearchParams({ condition: 5 as never }).has('condition')).toBe(false)
  })

  it('writes every scalar filter under the search page\'s own name', () => {
    const p = canonicalToSearchParams({ listingType: 'rent', propertyType: 'house', locationId: 4, priceMin: 1, priceMax: 2, areaMin: 3, areaMax: 4, floorMin: 5, floorMax: 6, marketType: 'secondary', yearBuiltMin: 1990, yearBuiltMax: 2020 })
    expect(Object.fromEntries(p)).toEqual({ type: 'rent', property_type: 'house', location_id: '4', price_min: '1', price_max: '2', area_min: '3', area_max: '4', floor_min: '5', floor_max: '6', market_type: 'secondary', year_built_min: '1990', year_built_max: '2020' })
  })
})

describe('computeFiltersHash', () => {
  it('does not depend on the order the keys were added in', () => {
    expect(computeFiltersHash({ priceMin: 1, listingType: 'sale' })).toBe(computeFiltersHash({ listingType: 'sale', priceMin: 1 }))
  })
  it('changes with any value', () => {
    expect(computeFiltersHash({ priceMin: 1 })).not.toBe(computeFiltersHash({ priceMin: 2 }))
    expect(computeFiltersHash({})).toMatch(/^[0-9a-f]{64}$/)
  })
})

// Task 923 R38 (case SEC-S53-SRV-DENY)
it('[SEC-S53-SRV-DENY] A saved search stores only known words and integers that fit', () => {
  const c = canonicalizeFilters(sp(`condition=new_build,ruined,good&admin=true&price_min=${'9'.repeat(30)}&price_max=2147483647&rooms=3,2`))
  expect(c.condition).toEqual(['good', 'new_build'])                       // the unknown word is dropped, the known ones are stored sorted
  expect(c).not.toHaveProperty('admin')                                    // an unknown key is not stored
  expect(c.priceMin).toBeUndefined()                                       // a number that does not fit is not stored
  expect(c.priceMax).toBe(2147483647)
  expect(canonicalizeFilters(sp('rooms=2&rooms=3')).rooms).toEqual(canonicalizeFilters(sp('rooms=3,2')).rooms)   // both spellings of the list give one canonical value
})
