import { createClient } from '@/lib/supabase/server'
import { isUuid } from '@/lib/security/inputs'
import { LISTING_SELECT } from './listingSelect'
import { isListingOpenableByAddress, OPEN_BY_ADDRESS_STATUSES } from './visibility'
import type { CardListingData } from '../components/ListingCard'

/** the card projection plus the expiry, which the one public rule (visibility.ts) needs for an active listing */
const RECENTLY_VIEWED_SELECT = `${LISTING_SELECT}, expires_at`

/**
 * Keeps the listings a visitor may open by their address (Task 956 AC6): the statuses the query asked for, and an active listing only until its expiry. Archived
 * listings are not among the statuses, so they leave the history; the database policy applies the same rule to a session, this judges it for the rows that come back.
 */
function openByAddress(listings: unknown): CardListingData[] {
  return (listings as unknown as CardListingData[]).filter((listing) => isListingOpenableByAddress({ status: listing.status, expires_at: listing.expires_at ?? null }))
}

/**
 * Fetch recently viewed listings for an authenticated user (relies on RLS —
 * only the calling user's rows are returned).
 *
 * Two-step query: first get the ordered listing IDs, then fetch listing data.
 * This avoids a Supabase JOIN across tables with separate RLS policies.
 */
export async function getRecentlyViewedForUser(
  { excludeId, limit = 25 }: { excludeId?: string; limit?: number } = {},
): Promise<CardListingData[]> {
  const supabase = await createClient()

  // Task 923 Revision 7: ask for the signed-in person's own rows explicitly instead of relying only on row-level security (a missing or wrong policy would
  // otherwise return everybody's history).
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: rows } = await supabase
    .from('recently_viewed')
    .select('listing_id')
    .eq('user_id', user.id)
    .order('viewed_at', { ascending: false })
    .limit(limit + (excludeId ? 1 : 0))

  if (!rows?.length) return []

  let ids = rows.map(r => r.listing_id as string)
  if (excludeId) ids = ids.filter(id => id !== excludeId)
  ids = ids.slice(0, limit)
  if (!ids.length) return []

  const { data: listings } = await supabase
    .from('listings')
    .select(RECENTLY_VIEWED_SELECT)
    .in('id', ids)
    .in('status', OPEN_BY_ADDRESS_STATUSES)

  if (!listings?.length) return []

  // Restore viewed_at order (DB returns in arbitrary order for IN queries)
  const orderMap = new Map(ids.map((id, i) => [id, i]))
  return openByAddress(listings)
    .sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99))
}

/**
 * Fetch recently viewed listings for a guest visitor given a list of listing IDs
 * (sourced from the `rv_listings` cookie, newest first).
 */
export async function getRecentlyViewedForGuest(
  ids: string[],
  { excludeId, limit = 25 }: { excludeId?: string; limit?: number } = {},
): Promise<CardListingData[]> {
  // The ids come from a cookie the visitor can edit: only real listing ids are queried.
  const filteredIds = ids.filter(id => isUuid(id) && id !== excludeId).slice(0, limit)
  if (!filteredIds.length) return []

  const supabase = await createClient()
  const { data: listings } = await supabase
    .from('listings')
    .select(RECENTLY_VIEWED_SELECT)
    .in('id', filteredIds)
    .in('status', OPEN_BY_ADDRESS_STATUSES)

  if (!listings?.length) return []

  // Restore cookie order (most recently viewed first)
  const orderMap = new Map(filteredIds.map((id, i) => [id, i]))
  return openByAddress(listings)
    .sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99))
}
