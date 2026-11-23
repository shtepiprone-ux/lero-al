// @vitest-environment node
/**
 * Task 957 Revision 3 (owner decision O1001-2, 2026-11-21): the server checks the parking of a listing before any write, as the form does. A kind (underground, private_street, city) or none; a
 * floor from -10 to -1 and only with an underground parking; no parking at all for land. The database refuses the same (`task957-parking.sql`).
 */
import { describe, expect, it } from 'vitest'
import { listingSchema } from '@/modules/listings/validations'
import { getSchema } from '@/modules/listings/domain/propertyTypeSchema'

const BASE = { title: 'A valid title', price: 95000, currency: 'EUR' as const, listing_type: 'sale' as const, property_type: 'apartment' as const }
const issues = (over: Record<string, unknown>) => {
  const result = listingSchema.safeParse({ ...BASE, ...over })
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join('.')}:${i.message}`)
}

describe('listingSchema: parking', () => {
  it('accepts no parking, each kind, and an underground floor from -10 to -1', () => {
    expect(issues({})).toEqual([])
    for (const parking_type of ['private_street', 'city', 'underground']) expect(issues({ parking_type })).toEqual([])
    for (const parking_floor of [-1, -2, -10]) expect(issues({ parking_type: 'underground', parking_floor })).toEqual([])
  })

  it('refuses a kind that is not one of the three', () => {
    expect(issues({ parking_type: 'roof' }).join()).toContain('parking_type')
    expect(issues({ parking_type: '' }).join()).toContain('parking_type')
  })

  it('refuses a floor outside -10..-1, a fraction, and a floor without an underground parking', () => {
    for (const parking_floor of [0, 1, -11, -1.5]) expect(issues({ parking_type: 'underground', parking_floor }).join(), String(parking_floor)).toContain('parking_floor')
    for (const parking_type of [undefined, 'city', 'private_street']) expect(issues({ parking_type, parking_floor: -1 }), String(parking_type)).toContain('parking_floor:error_parking_floor')
  })

  it('every property type but land has the parking field in its schema, and land has none', () => {
    for (const type of ['apartment', 'house', 'room', 'commercial', 'office', 'garage', 'parking', 'warehouse', 'other']) {
      expect(getSchema(type).ui.fields.find((f) => f.key === 'parking')?.visible, type).toBe(true)
    }
    expect(getSchema('land').ui.fields.find((f) => f.key === 'parking')?.visible).toBe(false)
  })

  it('refuses any parking for land, and accepts it for a garage', () => {
    expect(issues({ property_type: 'land', land_legal_status: 'urban', land_zoning: 'residential', land_development_potential: 'buildable', parking_type: 'city' })).toContain('parking_type:error_parking_type')
    expect(issues({ property_type: 'garage', parking_type: 'underground', parking_floor: -2, multi_storey_building: true })).toEqual([])
  })
})
