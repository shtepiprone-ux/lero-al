import { describe, expect, it } from 'vitest'
import { userLocation } from '../userLocation'

// Task 923 R175 (c): synthetic lists; city 9 names a region that is not in the list
const cities = [
  { id: 1, name_al: 'Tirana', region_id: 1 },
  { id: 151, name_al: 'Adriatik - Durrës', region_id: null },
  { id: 9, name_al: 'Zzsynth', region_id: 7 },
]
const regions = [{ id: 1, name_al: 'Qarku i Tiranës' }]

describe('userLocation', () => {
  it('a city with a region carries the region as parent', () => {
    expect(userLocation(1, cities, regions)).toEqual({
      id: 1, name_al: 'Tirana', region_id: 1, parent: { id: 1, name_al: 'Qarku i Tiranës' },
    })
  })

  it('a city with no region has a null parent', () => {
    expect(userLocation(151, cities, regions)).toEqual({
      id: 151, name_al: 'Adriatik - Durrës', region_id: null, parent: null,
    })
  })

  it('a city whose region is not in the list has a null parent', () => {
    expect(userLocation(9, cities, regions)?.parent).toBeNull()
  })

  it('no location id, or an id that is not in the list, gives null', () => {
    expect(userLocation(null, cities, regions)).toBeNull()
    expect(userLocation(undefined, cities, regions)).toBeNull()
    expect(userLocation(999, cities, regions)).toBeNull()
  })
})
