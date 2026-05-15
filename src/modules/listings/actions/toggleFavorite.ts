'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { routing } from '@/i18n/routing'

/**
 * Toggle a listing's favorite status for the current user.
 *
 * @param listingId        - The listing to favorite/unfavorite.
 * @param currentlyFavorited - The client-side state at the moment the user
 *   clicked. Passing intent (not just relying on 23505 as a proxy) ensures
 *   correct semantics under concurrent actions:
 *
 *   - Two tabs both favoriting simultaneously:
 *       both call with false → both INSERT → one succeeds, other gets 23505
 *       → both return { isFavorited: true }  ← CORRECT
 *
 *   - Two tabs both unfavoriting simultaneously:
 *       both call with true → both DELETE → one deletes 1 row, other 0 rows
 *       → both return { isFavorited: false } ← CORRECT
 *
 *   Without this parameter the previous INSERT-first / 23505→DELETE pattern
 *   would cause one concurrent "favorite" action to silently DELETE the row,
 *   leaving the listing unfavorited despite both users intending to favorite it.
 */
export async function toggleFavorite(
  listingId: string,
  currentlyFavorited: boolean,
): Promise<{ isFavorited: boolean } | { error: string }> {
  const authUser = await getUser()
  if (!authUser) return { error: 'unauthenticated' }

  const supabase = await createClient()

  // Shared helper: invalidates the favorites page for all locales so that
  // cold navigation (new tab, browser Back from a stale cache) shows accurate data.
  // Session state is handled by localFavoriteIds + liveCounts on the client.
  function revalidateFavorites() {
    for (const locale of routing.locales) {
      revalidatePath(`/${locale}/favorites`, 'page')
    }
  }

  if (!currentlyFavorited) {
    // User intent: ADD. INSERT the row.
    // On 23505 (concurrent add already completed) → desired state is already reached.
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

  // User intent: REMOVE. DELETE the row.
  // Concurrent unfavorite that already removed the row → 0 rows affected, no error.
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
