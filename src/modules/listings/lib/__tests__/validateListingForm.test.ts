/**
 * Task 957 Revision 3 (R3-4, AC29; Review 3 F19): the checks `ListingFormShell.handleSubmit` made on `main` (`ListingFormShell.tsx:178-209` before this revision) live in one pure function, so the
 * Shell and the Story harness refuse exactly the same values. Every case below but the parking one (Revision 3, O1001-2) is a value the Shell refused or accepted on `main`; the texts are the keys of the `listing` namespace.
 */
import { describe, expect, it } from 'vitest'
import { getSchema } from '@/modules/listings/domain/propertyTypeSchema'
import type { FormValues } from '@/modules/listings/types/form'
import { validateListingForm } from '../validateListingForm'

const t = (key: string) => key
const PHOTO = { url: 'https://res.cloudinary.com/demo/image/upload/a.jpg', public_id: 'a', is_cover: true, order: 0 }
const VALID: FormValues = { listing_type: 'sale', property_type: 'apartment', title: 'A valid title', price: 95000, currency: 'EUR', multi_storey_building: false, images: [PHOTO] }
const run = (over: Partial<FormValues>) => {
  const data = { ...VALID, ...over }
  return validateListingForm(data, getSchema(data.property_type), t)
}

describe('validateListingForm', () => {
  it('[AC29] a complete listing has no error', () => {
    expect(run({})).toEqual({})
  })

  it('[AC29] a title of fewer than 5 characters, an empty one and a blank one give error_title', () => {
    expect(run({ title: 'abcd' }).title).toBe('error_title')
    expect(run({ title: '' }).title).toBe('error_title')
    expect(run({ title: '      ' }).title).toBe('error_title')
    expect(run({ title: 'abcde' }).title).toBeUndefined()
  })

  it('[AC29] a selected property type has no property_type error; none selected gives error_property_type', () => {
    expect(run({ property_type: 'apartment' }).property_type).toBeUndefined()
    expect(run({ property_type: 'house' }).property_type).toBeUndefined()
    expect(run({ property_type: '' }).property_type).toBe('error_property_type')
  })

  it('[AC29] no price, a zero price and a price above the ceiling of its currency give error_price', () => {
    expect(run({ price: undefined }).price).toBe('error_price')
    expect(run({ price: 0 }).price).toBe('error_price')
    expect(run({ price: Number.MAX_SAFE_INTEGER }).price).toBe('error_price')
    expect(run({ price: 1 }).price).toBeUndefined()
  })

  it('[AC29] no photo gives error_images', () => {
    expect(run({ images: [] }).images).toBe('error_images')
    expect(run({}).images).toBeUndefined()
  })

  it('[AC29] a floor above the building floors gives error_floor_exceeds_building (9 of 8), the building floors themselves are fine (8 of 8)', () => {
    expect(run({ floor: 9, total_floors: 8 }).floor).toBe('error_floor_exceeds_building')
    expect(run({ floor: 8, total_floors: 8 }).floor).toBeUndefined()
    expect(run({ floor: 9 }).floor).toBeUndefined()
  })

  it('[AC29] a negative floor without a multi-storey building gives error_floor_negative, with one on an underground-capable type it is allowed', () => {
    expect(run({ floor: -1 }).floor).toBe('error_floor_negative')
    expect(run({ property_type: 'garage', floor: -1, multi_storey_building: false }).floor).toBe('error_floor_negative')
    expect(run({ property_type: 'garage', floor: -1, multi_storey_building: true }).floor).toBeUndefined()
    expect(run({ property_type: 'apartment', floor: -1, multi_storey_building: true }).floor).toBe('error_floor_negative')
  })

  it('[AC29] a floor is not checked while no property type is selected', () => {
    expect(run({ property_type: '', floor: -1 }).floor).toBeUndefined()
  })

  it('[AC29] a required field left empty gives error_required and a filled one none (land: the legal status, the zoning and the development potential)', () => {
    const land = { property_type: 'land' as const }
    const empty = run(land)
    expect(empty.land_legal_status).toBe('error_required')
    expect(empty.land_zoning).toBe('error_required')
    expect(empty.land_development_potential).toBe('error_required')
    const filled = run({ ...land, land_legal_status: 'urban', land_zoning: 'residential', land_development_potential: 'buildable' })
    expect(filled.land_legal_status).toBeUndefined()
    expect(filled.land_zoning).toBeUndefined()
    expect(filled.land_development_potential).toBeUndefined()
  })

  it('[AC29] an apartment with a condition has no error_required under it: no field of the apartment schema is required', () => {
    expect(getSchema('apartment').ui.fields.filter((f) => f.required)).toEqual([])
    expect(run({ condition: 'good' }).condition).toBeUndefined()
    expect(run({ condition: undefined }).condition).toBeUndefined()
  })

  // Owner decision O1001-2 (2026-11-21): the floor of an underground parking
  it('the floor of a parking is a whole number from -10 to -1 and belongs to an underground parking only', () => {
    expect(run({ parking_type: 'underground', parking_floor: -2 }).parking_floor).toBeUndefined()
    expect(run({ parking_type: 'underground', parking_floor: -10 }).parking_floor).toBeUndefined()
    for (const parking_floor of [0, 3, -11, -1.5]) expect(run({ parking_type: 'underground', parking_floor }).parking_floor, String(parking_floor)).toBe('error_parking_floor')
    expect(run({ parking_type: 'city', parking_floor: -1 }).parking_floor).toBe('error_parking_floor')
    expect(run({ parking_floor: -1 }).parking_floor).toBe('error_parking_floor')
    expect(run({ parking_type: 'city' }).parking_floor).toBeUndefined()
    expect(run({}).parking_floor).toBeUndefined()
  })

  it('[AC29] several faults give all their errors at once, keyed by field', () => {
    expect(run({ title: '', property_type: '', price: undefined, images: [] })).toEqual({
      title: 'error_title', property_type: 'error_property_type', price: 'error_price', images: 'error_images',
    })
  })

  it('[AC29] it reads only its arguments: the same values give the same errors twice', () => {
    const data = { ...VALID, title: '', floor: 9, total_floors: 8 }
    const schema = getSchema('apartment')
    expect(validateListingForm(data, schema, t)).toEqual(validateListingForm(data, schema, t))
  })
})
