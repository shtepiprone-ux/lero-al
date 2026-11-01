import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireViewer } from '@/lib/auth/requireViewer'
import { isUuid } from '@/lib/security/inputs'
import { isLiveAccount } from '@/lib/auth/accountAccess'

const SUPPORTED_LOCALES = ['sq', 'en', 'uk', 'it'] as const

export type ListingContactChannel = 'whatsapp'
export type ListingContactSource = 'listing_detail_contact_card'

// One click per (listing, actor) inside this window is counted; repeats are dropped so a burst of taps
// cannot inflate the WhatsApp count (Task 850).
const DEDUP_WINDOW_MS = 30 * 60 * 1000

interface TrackArgs {
  listingId: string
  channel: ListingContactChannel
  source: ListingContactSource
  locale?: string
}

type TrackResult =
  | { ok: true }
  | {
      ok: false
      reason: 'unauthenticated' | 'self_click' | 'insert_failed' | 'session_error' | 'not_found' | 'deduplicated'
    }

/**
 * Records that a SIGNED-IN person tapped WhatsApp on a listing. Only a signed-in, active person can reach the contact card (owner correction 2026-10-17),
 * so only such a person can produce this event: the action is a public endpoint, and a hidden button proves presentation only, therefore a guest, a session
 * without a profile and a blocked or inactive account are refused before the listing is read and before anything is written.
 */
export async function trackListingContactEvent(args: TrackArgs): Promise<TrackResult> {
  // Task 923 Revision 7: the arguments come from a browser and their types are erased. Anything outside the known values is refused before a query, so a caller
  // cannot write arbitrary channels, sources or locales into the analytics table.
  const { listingId, channel, source, locale } = args ?? ({} as Partial<TrackArgs>)
  if (!isUuid(listingId) || channel !== 'whatsapp' || source !== 'listing_detail_contact_card') return { ok: false, reason: 'not_found' }
  const safeLocale = typeof locale === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(locale) ? locale : null

  const viewer = await requireViewer()
  if (!viewer.ok) return { ok: false, reason: viewer.reason === 'unauthenticated' ? 'unauthenticated' : 'session_error' }
  const actorUserId = viewer.userId

  try {
    // Every write goes through the service-role client, from this server action only (Task 850): the
    // authenticated INSERT grant is revoked, so this is the only way a row can be created.
    const db = createAdminClient()

    // Only an ACTIVE listing of a LIVE owner has a contact card to tap (Task 923 R66 (f), owner F2): the contact of a sold, rented, archived, pending, inactive or
    // expired listing is locked, and so is the contact of an owner who was deleted or has no access.
    const { data: listing, error: listingError } = await db
      .from('listings')
      .select('id, user_id')
      .eq('id', listingId)
      .eq('status', 'active')
      .maybeSingle()

    if (listingError) {
      console.error('[contactEvents] listing lookup failed', { code: listingError.code, listingId })
      return { ok: false, reason: 'insert_failed' }
    }
    if (!listing) return { ok: false, reason: 'not_found' }
    const ownerLive = await isLiveAccount(listing.user_id as string)
    if (ownerLive === null) return { ok: false, reason: 'insert_failed' }
    if (!ownerLive) return { ok: false, reason: 'not_found' }

    const since = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString()
    const { data: recent, error: dedupError } = await db
      .from('listing_contact_events')
      .select('id')
      .eq('listing_id', listing.id)
      .eq('actor_user_id', actorUserId)
      .gte('created_at', since)
      .limit(1)

    // A failed look-up must not lose the click: log it and record the event.
    if (dedupError) {
      console.error('[contactEvents] dedup lookup failed', { code: dedupError.code, listingId })
    } else if (recent && recent.length > 0) {
      return { ok: false, reason: 'deduplicated' }
    }

    const isOwnerClick = actorUserId === listing.user_id

    // listing_owner_id and is_owner_click are re-derived by the BEFORE INSERT trigger; the values here
    // come from the server-resolved listing, never from the caller.
    const { error } = await db.from('listing_contact_events').insert({
      listing_id: listing.id,
      listing_owner_id: listing.user_id,
      actor_user_id: actorUserId,
      actor_ip_hash: null,
      channel,
      source,
      locale: safeLocale,
      is_owner_click: isOwnerClick,
    })
    if (error) {
      console.error('[contactEvents] insert failed', { code: error.code, listingId })
      return { ok: false, reason: 'insert_failed' }
    }

    if (isOwnerClick) return { ok: false, reason: 'self_click' }
    return { ok: true }
  } catch (err) {
    console.error('[contactEvents] unexpected error', err)
    return { ok: false, reason: 'insert_failed' }
  }
}
