import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * What a visitor may be told about a listing address (Task 923 R103, D72): `public` (active, sold, rented), `hidden` (a listing exists in any other status) or `missing`.
 * The answer carries no listing field, so the page can tell a visitor that the address is a real listing without reading anything about it.
 */
export type ListingAccessState = 'missing' | 'public' | 'hidden'

/** The statuses any visitor may open. Every other status is `hidden`. */
const PUBLIC_STATUSES: readonly string[] = ['active', 'sold', 'rented']

/**
 * Reads only the `status` of the listing at `slug` through the admin client (the session client reads no row of a hidden listing for a visitor). Server-only.
 * A read error answers `missing`, so a failure never names a hidden listing; the log carries the error code only.
 */
export async function getListingAccessState(slug: string): Promise<ListingAccessState> {
  const { data, error } = await createAdminClient().from('listings').select('status').eq('slug', slug).maybeSingle()
  if (error) {
    console.error('getListingAccessState: the listing status could not be read', { code: error.code })
    return 'missing'
  }
  if (!data) return 'missing'
  return PUBLIC_STATUSES.includes(data.status) ? 'public' : 'hidden'
}
