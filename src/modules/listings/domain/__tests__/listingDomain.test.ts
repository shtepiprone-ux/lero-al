/**
 * Listing domain rules (Task 923 Revision 7): the input schema, the per-type field rules, the status vocabulary and the form mode.
 * The schema is the gate every create / update passes: what it strips, trims and refuses decides what reaches the database.
 */
import { describe, expect, it } from 'vitest'
import { MIN_PROPERTY_YEAR } from '@/modules/listings/constants'
import { listingSchema, step1Schema } from '@/modules/listings/validations'
import { loginSchema, registerSchema } from '@/modules/auth/validations'
import {
  PROPERTY_TYPE_SCHEMA, getFloorFilterMin, getSchema, getUndergroundFloorTypes,
} from '../propertyTypeSchema'
import {
  VALID_ATTRIBUTE_FILTERS, VALID_VISIBILITY_GROUPS, VISIBILITY_DB_STATUSES, applyAttributeFilter, getListingVisibilityGroup, resolveListingQueryByVisibility,
} from '../listingSemanticLayer'
import {
  getPostSaveRedirect, isListingArchived, isListingClosed, isListingEditableStatus, isListingHidden, isListingNonActiveStatus, isListingReadonlyStatus, isListingVisible,
} from '../listingSemanticHelpers'
import { isEditMode } from '../listingFormMode'
import { FIELD_COMPONENT_REGISTRY } from '../../components/form/fieldRegistry'
import type { ListingStatus } from '@/types/database'

const ALL_STATUSES: ListingStatus[] = ['pending', 'active', 'inactive', 'sold', 'rented', 'archived', 'expired']
const valid = { title: 'Nice flat in Tirana', price: 90000, currency: 'EUR', listing_type: 'sale', property_type: 'apartment' }
const messages = (input: unknown) => {
  const r = listingSchema.safeParse(input)
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join('.')}:${i.message}`)
}

describe('listingSchema: what it lets through', () => {
  it('accepts a minimal listing', () => {
    expect(listingSchema.safeParse(valid).success).toBe(true)
  })

  it('strips every field it does not know, so the owner, status, counters and premium flag cannot ride along', () => {
    const r = listingSchema.safeParse({ ...valid, user_id: 'victim', status: 'active', is_premium: true, views_count: 9999, expires_at: '2099-01-01', slug: 'taken', id: 'x', price_old: 5 })
    expect(r.success).toBe(true)
    if (r.success) expect(Object.keys(r.data).sort()).toEqual(['currency', 'listing_type', 'price', 'price_old', 'property_type', 'title'].sort())
  })

  it('trims the title BEFORE checking its length: five spaces are not a title', () => {
    expect(messages({ ...valid, title: '     ' })).toContain('title:Too small: expected string to have >=5 characters')
    expect(messages({ ...valid, title: '  ab  ' }).some((m) => m.startsWith('title:'))).toBe(true)
    const r = listingSchema.safeParse({ ...valid, title: '  Flat here  ' })
    expect(r.success && r.data.title).toBe('Flat here')
  })

  it.each([[4], [151]])('refuses a title of %i characters', (n) => expect(messages({ ...valid, title: 'x'.repeat(n) }).some((m) => m.startsWith('title:'))).toBe(true))
  it.each([[5], [150]])('accepts a title of %i characters', (n) => expect(listingSchema.safeParse({ ...valid, title: 'x'.repeat(n) }).success).toBe(true))

  it('blank description and address become "not given"', () => {
    const r = listingSchema.safeParse({ ...valid, description: '   ', address: '  ' })
    expect(r.success && r.data.description).toBeUndefined()
    expect(r.success && r.data.address).toBeUndefined()
  })

  it.each([[0], [-1], [NaN], [Infinity], ['100'], [null], [undefined]])('refuses the price %j', (price) => expect(listingSchema.safeParse({ ...valid, price }).success).toBe(false))
  it.each([['USD'], ['all'], [''], [5]])('refuses the currency %j', (currency) => expect(listingSchema.safeParse({ ...valid, currency }).success).toBe(false))
  it.each([['lease'], ['SALE'], ['']])('refuses the listing type %j', (listing_type) => expect(listingSchema.safeParse({ ...valid, listing_type }).success).toBe(false))
  it.each([['castle'], ['Apartment'], [''], [null]])('refuses the property type %j', (property_type) => expect(listingSchema.safeParse({ ...valid, property_type }).success).toBe(false))

  it.each([
    ['rooms 51', { rooms: 51 }], ['rooms -1', { rooms: -1 }], ['rooms 2.5', { rooms: 2.5 }], ['bathrooms 21', { bathrooms: 21 }], ['area 100001', { area_gross: 100001 }], ['area 0', { area_net: 0 }],
    ['lat 91', { lat: 91 }], ['lng -181', { lng: -181 }], ['description over 5000', { description: 'x'.repeat(5001) }], ['address over 300', { address: 'x'.repeat(301) }],
    ['location 0', { location_id: 0 }], ['location 1.5', { location_id: 1.5 }], ['unknown condition', { condition: 'ruined' }], ['unknown purchase condition', { purchase_conditions: ['free'] }],
    ['year before the minimum', { year_built: MIN_PROPERTY_YEAR - 1 }], ['year six years ahead', { year_built: new Date().getFullYear() + 6 }],
  ])('refuses %s', (_l, patch) => expect(listingSchema.safeParse({ ...valid, ...patch }).success).toBe(false))

  it.each([['year five years ahead', { year_built: new Date().getFullYear() + 5 }], ['the minimum year', { year_built: MIN_PROPERTY_YEAR }], ['lat/lng at the edge', { lat: 90, lng: -180 }], ['rooms 0 and 50', { rooms: 0, bedrooms: 50 }]])('accepts %s', (_l, patch) => {
    expect(listingSchema.safeParse({ ...valid, ...patch }).success).toBe(true)
  })
})

describe('listingSchema: floors and required fields', () => {
  it('an apartment cannot have a negative floor', () => {
    expect(messages({ ...valid, floor: -1 })).toContain('floor:error_floor_negative')
    expect(messages({ ...valid, floor: -1, multi_storey_building: true })).toContain('floor:error_floor_negative')
  })

  it('a garage can, but only with the multi-storey box ticked', () => {
    const garage = { ...valid, property_type: 'garage', floor: -2 }
    expect(messages(garage)).toContain('floor:error_floor_negative')
    expect(messages({ ...garage, multi_storey_building: true })).toEqual([])
    expect(messages({ ...garage, multi_storey_building: 'true' })).not.toEqual([])
  })

  it('a floor of 0 and the technical limits', () => {
    expect(messages({ ...valid, floor: 0 })).toEqual([])
    expect(messages({ ...valid, floor: 201 }).length).toBeGreaterThan(0)
    expect(messages({ ...valid, property_type: 'garage', floor: -11, multi_storey_building: true }).length).toBeGreaterThan(0)
  })

  it('the floor cannot be above the number of floors of the building', () => {
    expect(messages({ ...valid, floor: 6, total_floors: 5 })).toContain('floor:error_floor_exceeds_building')
    expect(messages({ ...valid, floor: 5, total_floors: 5 })).toEqual([])
  })

  it('land needs its legal status, zoning and development potential', () => {
    const land = { ...valid, property_type: 'land' }
    expect(messages(land).sort()).toEqual(['land_development_potential:error_required', 'land_legal_status:error_required', 'land_zoning:error_required'])
    expect(messages({ ...land, land_legal_status: 'urban', land_zoning: 'residential', land_development_potential: 'buildable' })).toEqual([])
  })

  it('other types need none of them', () => {
    for (const type of ['apartment', 'house', 'room', 'commercial', 'office', 'garage', 'parking', 'warehouse', 'other']) expect(messages({ ...valid, property_type: type })).toEqual([])
  })
})

describe('step1Schema and the account schemas', () => {
  it('step 1 keeps only its own fields', () => {
    const r = step1Schema.safeParse({ ...valid, rooms: 3, floor: 2 })
    expect(r.success && Object.keys(r.data).sort()).toEqual(['currency', 'listing_type', 'price', 'property_type', 'title'])
  })

  it('login needs an e-mail address and a password of 6 characters', () => {
    expect(loginSchema.safeParse({ email: 'ana@example.com', password: '123456' }).success).toBe(true)
    expect(loginSchema.safeParse({ email: 'not-an-email', password: '123456' }).success).toBe(false)
    expect(loginSchema.safeParse({ email: 'ana@example.com', password: '12345' }).success).toBe(false)
  })

  it('register trims the name BEFORE its length rule, takes only the two account types and drops an empty company', () => {
    const base = { name: 'Ana', email: 'ana@example.com', password: 'secret1', user_type: 'private' }
    expect(registerSchema.safeParse(base).success).toBe(true)
    expect(registerSchema.safeParse({ ...base, name: '   ' }).success).toBe(false)
    expect(registerSchema.safeParse({ ...base, name: ' a ' }).success).toBe(false)
    expect(registerSchema.safeParse({ ...base, name: 'x'.repeat(101) }).success).toBe(false)
    const named = registerSchema.safeParse({ ...base, name: '  Ana  ', company_name: '   ' })
    expect(named.success && named.data.name).toBe('Ana')
    expect(named.success && named.data.company_name).toBeUndefined()
    for (const user_type of ['admin', 'moderator', 'developer', '']) expect(registerSchema.safeParse({ ...base, user_type }).success).toBe(false)
    expect(registerSchema.safeParse({ ...base, company_name: 'x'.repeat(201) }).success).toBe(false)
  })

  it('register does not let a role or a verified flag through', () => {
    const r = registerSchema.safeParse({ name: 'Ana', email: 'ana@example.com', password: 'secret1', user_type: 'agent', role: 'admin', is_verified: true })
    expect(r.success && Object.keys(r.data).sort()).toEqual(['email', 'name', 'password', 'user_type'])
  })
})

describe('property type rules', () => {
  it('every one of the ten types has a schema and the filters are a subset of the fields', () => {
    expect(Object.keys(PROPERTY_TYPE_SCHEMA).sort()).toEqual(['apartment', 'commercial', 'garage', 'house', 'land', 'office', 'other', 'parking', 'room', 'warehouse'])
    for (const [type, schema] of Object.entries(PROPERTY_TYPE_SCHEMA)) {
      const keys = new Set(schema.ui.fields.map((f) => f.key))
      for (const filter of schema.ui.filters) expect(keys.has(filter), `${type}: filter ${filter} is not a field`).toBe(true)
    }
  })

  it('an unknown or empty type falls back to "other"', () => {
    expect(getSchema('castle')).toBe(PROPERTY_TYPE_SCHEMA.other)
    expect(getSchema('')).toBe(PROPERTY_TYPE_SCHEMA.other)
  })

  it('only garage, parking, warehouse and other allow underground floors', () => {
    expect(getUndergroundFloorTypes().sort()).toEqual(['garage', 'other', 'parking', 'warehouse'])
    expect(getFloorFilterMin('apartment')).toBe(0)
    expect(getFloorFilterMin('garage')).toBe(-10)
    expect(getFloorFilterMin('nonsense')).toBe(-10)
  })

  it('apartments have no building-floors field, houses have it instead of the floor', () => {
    const visible = (type: string) => getSchema(type).ui.fields.filter((f) => f.visible).map((f) => f.key)
    expect(visible('apartment')).toContain('floor')
    expect(visible('house')).toContain('building_floors')
    expect(visible('house')).not.toContain('floor')
    expect(visible('land')).not.toContain('rooms')
  })

  it('every visible field has a component in the form registry', () => {
    for (const schema of Object.values(PROPERTY_TYPE_SCHEMA)) {
      for (const f of schema.ui.fields) expect(FIELD_COMPONENT_REGISTRY[f.componentType], `${f.key} (${f.componentType})`).toBeTypeOf('function')
    }
  })

  it('the filter-only component draws nothing', () => {
    expect((FIELD_COMPONENT_REGISTRY['filter-only'] as unknown as () => unknown)()).toBeNull()
  })
})

describe('status vocabulary', () => {
  it('every status belongs to exactly one group', () => {
    const seen = ALL_STATUSES.map((s) => getListingVisibilityGroup(s))
    expect(seen).toEqual(['HIDDEN', 'VISIBLE', 'HIDDEN', 'CLOSED', 'CLOSED', 'ARCHIVED', 'HIDDEN'])
    const listed = Object.values(VISIBILITY_DB_STATUSES).flat()
    expect(new Set(listed).size).toBe(listed.length)
    expect([...listed].sort()).toEqual([...ALL_STATUSES].sort())
  })

  it('an unknown status throws instead of being guessed', () => {
    expect(() => getListingVisibilityGroup('draft' as ListingStatus)).toThrow('Unmapped listing status: "draft"')
  })

  it('only "active" is public', () => {
    expect(ALL_STATUSES.filter(isListingVisible)).toEqual(['active'])
    expect(ALL_STATUSES.filter(isListingHidden)).toEqual(['pending', 'inactive', 'expired'])
    expect(ALL_STATUSES.filter(isListingClosed)).toEqual(['sold', 'rented'])
    expect(ALL_STATUSES.filter(isListingArchived)).toEqual(['archived'])
    expect(ALL_STATUSES.filter(isListingNonActiveStatus)).toEqual(ALL_STATUSES.filter((s) => s !== 'active'))
  })

  it('a sold, rented or archived listing cannot be edited', () => {
    expect(ALL_STATUSES.filter(isListingEditableStatus)).toEqual(['pending', 'active', 'inactive', 'expired'])
    expect(ALL_STATUSES.filter(isListingReadonlyStatus)).toEqual(['sold', 'rented', 'archived'])
  })

  it('after saving the owner goes to the public page only when it is public, else to the cabinet', () => {
    expect(getPostSaveRedirect('active', 'flat-1', 'sq')).toBe('/sq/listings/flat-1')
    for (const s of ALL_STATUSES.filter((x) => x !== 'active')) expect(getPostSaveRedirect(s, 'flat-1', 'en')).toBe('/en/cabinet?tab=listings')
  })

  it('the group and attribute lists are complete', () => {
    expect([...VALID_VISIBILITY_GROUPS].sort()).toEqual(['ALL', 'ARCHIVED', 'CLOSED', 'HIDDEN', 'VISIBLE'])
    expect(VALID_ATTRIBUTE_FILTERS).toEqual(['PREMIUM'])
  })

  it('the query helpers add the right condition and nothing for "ALL"', () => {
    const calls: [string, ...unknown[]][] = []
    const q = { eq: (...a: unknown[]) => { calls.push(['eq', ...a]); return q }, in: (...a: unknown[]) => { calls.push(['in', ...a]); return q } }
    resolveListingQueryByVisibility(q, 'ALL')
    expect(calls).toEqual([])
    resolveListingQueryByVisibility(q, 'VISIBLE')
    resolveListingQueryByVisibility(q, 'CLOSED')
    applyAttributeFilter(q, 'PREMIUM')
    expect(calls).toEqual([['eq', 'status', 'active'], ['in', 'status', ['sold', 'rented']], ['eq', 'is_premium', true]])
  })
})

describe('form mode', () => {
  it('"edit" is edit mode, "create" is not', () => {
    expect(isEditMode('edit')).toBe(true)
    expect(isEditMode('create')).toBe(false)
  })
})
