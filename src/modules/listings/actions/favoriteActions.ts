'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { routing } from '@/i18n/routing'

function revalidateFavorites() {
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/favorites`, 'page')
  }
}

/**
 * Add a listing to the current user's favorites.
 *
 * Idempotent: a 23505 unique-constraint violation (concurrent add already
 * succeeded) is treated as success — the desired state is already reached.
 */
export async function addFavorite(
  listingId: string,
): Promise<{ isFavorited: true } | { error: string }> {
  const authUser = await getUser()
  if (!authUser) return { error: 'unauthenticated' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: authUser.id, listing_id: listingId })

  if (!error || error.code === '23505') {
    revalidateFavorites()
    return { isFavorited: true }
  }

  console.error('Failed to add favorite', { error, listingId, userId: authUser.id })
  return { error: error.message }
}

/**
 * Remove a listing from the current user's favorites.
 *
 * Idempotent: deleting 0 rows (already removed by a concurrent action) is not
 * an error — the desired state is already reached.
 */
export async function removeFavorite(
  listingId: string,
): Promise<{ isFavorited: false } | { error: string }> {
  const authUser = await getUser()
  if (!authUser) return { error: 'unauthenticated' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', authUser.id)
    .eq('listing_id', listingId)

  if (error) {
    console.error('Failed to remove favorite', { error, listingId, userId: authUser.id })
    return { error: error.message }
  }

  revalidateFavorites()
  return { isFavorited: false }
}
