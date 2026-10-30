// @vitest-environment node
/**
 * What a listing shows on a card, in the detail list and in the attributes table (Task 923 Revision 7). The values are numbers and codes from the database, so the
 * engine must show a real 0 (the ground floor), skip a missing value, and never print "null" or "undefined".
 */
import { describe, expect, it } from 'vitest'
import { getCardFeatures, getDetailAttributes, getDetailFeatures, type ListingSnapshot } from '../presentationEngine'

const full: ListingSnapshot = {
  property_type: 'apartment', rooms: 3, bedrooms: 2, bathrooms: 1, toilets: 1, area_gross: 80, area_net: 70, floor: 0, total_floors: 5, year_built: 2010, condition: 'good', heating: 'gas', wall_type: 'brick',
}

describe('getCardFeatures', () => {
  it('shows rooms, bathrooms, area and the floor, in that order, with the icon of each', () => {
    expect(getCardFeatures(full)).toEqual([
      { key: 'rooms', icon: 'bed-double', value: '3' },
      { key: 'bathrooms', icon: 'bath', value: '1' },
      { key: 'area_gross', icon: 'area', value: '80 m²' },
      { key: 'floor', icon: 'building', value: '0/5' },
    ])
  })

  it('the floor 0 (ground floor) is shown; without the building floors it is alone', () => {
    expect(getCardFeatures({ property_type: 'apartment', floor: 0 })).toEqual([{ key: 'floor', icon: 'building', value: '0' }])
    expect(getCardFeatures({ property_type: 'apartment', floor: 3 })).toEqual([{ key: 'floor', icon: 'building', value: '3' }])
    expect(getCardFeatures({ property_type: 'apartment', floor: 3, total_floors: 0 })).toEqual([{ key: 'floor', icon: 'building', value: '3' }])
  })

  it('a missing value (null or undefined) is skipped, never printed', () => {
    expect(getCardFeatures({ property_type: 'land' })).toEqual([])
    expect(getCardFeatures({ property_type: 'apartment', rooms: null, bathrooms: undefined, area_gross: null, floor: null })).toEqual([])
    expect(JSON.stringify(getCardFeatures({ ...full, rooms: null, floor: null }))).not.toMatch(/null|undefined/)
  })

  it('a room count of 0 is a value, not a missing one', () => {
    expect(getCardFeatures({ property_type: 'apartment', rooms: 0 })).toEqual([{ key: 'rooms', icon: 'bed-double', value: '0' }])
  })

  it('only the gross area is on a card', () => {
    expect(getCardFeatures({ property_type: 'apartment', area_net: 50 })).toEqual([])
  })

  it('does not change what it is given', () => {
    const copy = JSON.stringify(full)
    getCardFeatures(full)
    expect(JSON.stringify(full)).toBe(copy)
  })
})

describe('getDetailFeatures', () => {
  it('lists every number the listing has, with its label key; the area becomes a gross row and a net row', () => {
    expect(getDetailFeatures(full)).toEqual([
      { key: 'rooms', icon: 'home', labelKey: 'rooms', value: '3' },
      { key: 'bedrooms', icon: 'bed-double', labelKey: 'bedrooms', value: '2' },
      { key: 'bathrooms', icon: 'bath', labelKey: 'bathrooms', value: '1' },
      { key: 'toilets', icon: 'bath', labelKey: 'toilets', value: '1' },
      { key: 'area_gross', icon: 'area', labelKey: 'area_gross_label', value: '80 m²' },
      { key: 'area_net', icon: 'area', labelKey: 'area_net', value: '70 m²' },
      { key: 'floor', icon: 'layers', labelKey: 'floor', value: '0/5' },
      { key: 'year_built', icon: 'calendar', labelKey: 'year_built', value: '2010' },
    ])
  })

  it('each row is optional: the net area without the gross one, the floor 0', () => {
    expect(getDetailFeatures({ property_type: 'apartment', area_net: 40 })).toEqual([{ key: 'area_net', icon: 'area', labelKey: 'area_net', value: '40 m²' }])
    expect(getDetailFeatures({ property_type: 'apartment', floor: 0 })).toEqual([{ key: 'floor', icon: 'layers', labelKey: 'floor', value: '0' }])
    expect(getDetailFeatures({ property_type: 'land' })).toEqual([])
  })

  it('never prints a missing value', () => {
    expect(JSON.stringify(getDetailFeatures({ property_type: 'apartment', rooms: null, year_built: null, area_gross: 10 }))).not.toMatch(/null|undefined/)
  })
})

describe('getDetailAttributes', () => {
  it('turns the coded attributes into label and value keys, in the display order', () => {
    expect(getDetailAttributes(full)).toEqual([
      { labelKey: 'condition_label', valueKey: 'condition_good' },
      { labelKey: 'heating_label', valueKey: 'heating_gas' },
      { labelKey: 'wall_type_label', valueKey: 'wall_brick' },
    ])
  })

  it.each([[''], [null], [undefined]])('an attribute that is %j is left out', (value) => {
    expect(getDetailAttributes({ property_type: 'apartment', condition: value as never, heating: value as never, wall_type: value as never })).toEqual([])
  })

  it('shows only the attributes that were given', () => {
    expect(getDetailAttributes({ property_type: 'apartment', heating: 'electric' })).toEqual([{ labelKey: 'heating_label', valueKey: 'heating_electric' }])
  })
})
