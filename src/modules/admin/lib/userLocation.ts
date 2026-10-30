import type { CityOption, RegionOption, UserWithLocation } from '@/components/admin/AdminUserProfileView'

// Task 923 R175 (F34): the account's stored city with its region as `parent`, the shape the profile view renders
export function userLocation(
  locationId: number | null | undefined,
  cities: CityOption[],
  regions: RegionOption[],
): UserWithLocation['location'] {
  if (locationId == null) return null
  const city = cities.find(c => c.id === locationId)
  if (!city) return null
  const region = city.region_id == null ? undefined : regions.find(r => r.id === city.region_id)
  return {
    id: city.id,
    name_al: city.name_al,
    region_id: city.region_id,
    parent: region ? { id: region.id, name_al: region.name_al } : null,
  }
}
