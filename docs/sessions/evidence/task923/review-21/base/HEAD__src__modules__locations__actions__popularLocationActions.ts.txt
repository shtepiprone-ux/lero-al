'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import { routing } from '@/i18n/routing'

async function requireAdminOrModerator() {
  const user = await getUser()
  if (!user) return { error: 'unauthenticated' as const }

  const db = createAdminClient()
  const { data } = await db.from('users').select('role').eq('id', user.id).single()
  if (data?.role !== 'admin' && data?.role !== 'moderator') return { error: 'forbidden' as const }
  return { db, error: null }
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
  const auth = await requireAdminOrModerator()
  if (auth.error) return { error: auth.error }

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
  const auth = await requireAdminOrModerator()
  if (auth.error) return { error: auth.error }

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
