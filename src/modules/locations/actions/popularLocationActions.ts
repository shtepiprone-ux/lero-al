'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkStaff } from '@/lib/auth/staff'
import { routing } from '@/i18n/routing'

async function requireLocationsManager() {
  // one guard for every staff action (Task 923 R71 (k)): a blocked, deactivated, deleted or missing account of any role is refused here too
  const viewer = await checkStaff({ permission: 'locations.manage' })
  if (!viewer.ok) return { error: viewer.reason }
  // Task 923 R66 (c): a write to `locations` needs `locations.manage` on every path (the same table createLocation / updateLocation protect with the key): the key is part of
  // the one staff guard above (Task 923 R75), so a moderator without it cannot feature or unfeature a location.
  return { db: createAdminClient(), error: null }
}

function revalidatePopularLocations() {
  revalidatePath('/admin/popular-locations')
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}`, 'page')
  }
}

/**
 * Feature a city as a popular location (sets is_featured=true, display_order).
 * Photo upload is handled separately via /api/upload-popular-location-photo.
 */
export async function setLocationFeatured(
  locationId: number,
  displayOrder: number,
): Promise<{ error?: string }> {
  const auth = await requireLocationsManager()
  if (auth.error) return { error: auth.error }

  // numbers only (Task 923 Revision 7): the types are erased at runtime
  if (!Number.isInteger(locationId) || !Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 10_000) return { error: 'validation' }

  const { error } = await auth.db
    .from('locations')
    .update({ is_featured: true, display_order: displayOrder })
    .eq('id', locationId)

  if (error) {
    console.error('[popularLocations] setLocationFeatured failed', error)
    return { error: 'save_failed' }
  }

  revalidatePopularLocations()
  return {}
}

/**
 * Remove a city from the popular locations section (is_featured=false).
 * Keeps image_url in case the location is re-featured later.
 */
export async function setLocationUnfeatured(
  locationId: number,
): Promise<{ error?: string }> {
  const auth = await requireLocationsManager()
  if (auth.error) return { error: auth.error }

  if (!Number.isInteger(locationId)) return { error: 'validation' }

  const { error } = await auth.db
    .from('locations')
    .update({ is_featured: false })
    .eq('id', locationId)

  if (error) {
    console.error('[popularLocations] setLocationUnfeatured failed', error)
    return { error: 'remove_failed' }
  }

  revalidatePopularLocations()
  return {}
}
