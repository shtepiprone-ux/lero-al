import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ListingStatus } from '@/types/database'
import { isListingOpenableByAddress } from './visibility'

/**
 * What a visitor may be told about a listing address (Task 923 R103, D72): `public` (the one public rule of visibility.ts `isListingOpenableByAddress`: an active listing until its
 * expiry, a sold listing, a rented listing), `hidden` (a listing exists in any other status, or is active with its expiry passed or missing) or `missing`.
 * The answer carries no listing field, so the page can tell a visitor that the address is a real listing without reading anything about it.
 */
export type ListingAccessState = 'missing' | 'public' | 'hidden'

/**
 * Reads only the `status` and the expiry of the listing at `slug` through the admin client (the session client reads no row of a hidden listing for a visitor), and judges them
 * with the one public rule (Task 956 AC6), the same rule the database policy applies. Server-only.
 * A read error answers `missing`, so a failure never names a hidden listing; the log carries the error code only.
 */
export async function getListingAccessState(slug: string): Promise<ListingAccessState> {
  const { data, error } = await createAdminClient().from('listings').select('status, expires_at').eq('slug', slug).maybeSingle()
  if (error) {
    console.error('getListingAccessState: the listing status could not be read', { code: error.code })
    return 'missing'
  }
  if (!data) return 'missing'
  return isListingOpenableByAddress({ status: data.status as ListingStatus, expires_at: data.expires_at ?? null }) ? 'public' : 'hidden'
}
