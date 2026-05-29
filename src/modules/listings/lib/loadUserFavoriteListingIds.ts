import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns the Set of listing IDs that the authenticated user has favorited.
 *
 * Source of truth: the `favorites` table (consistent with addFavorite /
 * removeFavorite actions and the Favorites page query).
 *
 * Call once per page render and pass the resulting Set to every card grid on
 * that page. Never call per-card — that would produce N+1 queries.
 *
 * For anonymous users (no session), returns an empty Set without querying DB.
 */
export async function loadUserFavoriteListingIds(
  supabase: SupabaseClient,
): Promise<ReadonlySet<string>> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Set()

    const { data, error } = await supabase
      .from('favorites')
      .select('listing_id')
      .eq('user_id', user.id)

    if (error) {
      console.error('[loadUserFavoriteListingIds] query failed', { error })
      return new Set()
    }

    return new Set((data ?? []).map((r: { listing_id: string }) => r.listing_id))
  } catch (err) {
    console.error('[loadUserFavoriteListingIds] unexpected error', err)
    return new Set()
  }
}
