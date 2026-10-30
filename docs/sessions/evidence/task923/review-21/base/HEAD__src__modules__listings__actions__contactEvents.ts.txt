'use server'

import { createHash } from 'crypto'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'

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
      reason: 'self_click' | 'insert_failed' | 'session_error' | 'not_found' | 'deduplicated'
    }

export async function trackListingContactEvent(args: TrackArgs): Promise<TrackResult> {
  const { listingId, channel, source, locale } = args

  let actorUserId: string | null = null
  try {
    const user = await getUser()
    actorUserId = user?.id ?? null
  } catch {
    return { ok: false, reason: 'session_error' }
  }

  try {
    // Every write goes through the service-role client, from this server action only (Task 850): the
    // authenticated INSERT grant is revoked, so this is the only way a row can be created.
    const db = createAdminClient()

    // Same publicly-viewable status set as the detail page query and the view tracker.
    const { data: listing, error: listingError } = await db
      .from('listings')
      .select('id, user_id')
      .eq('id', listingId)
      .in('status', ['active', 'sold', 'rented', 'archived'])
      .maybeSingle()

    if (listingError) {
      console.error('[contactEvents] listing lookup failed', { code: listingError.code, listingId })
      return { ok: false, reason: 'insert_failed' }
    }
    if (!listing) return { ok: false, reason: 'not_found' }

    // Guest fingerprint built exactly like api/listings/[slug]/view/route.ts: SHA-256(ip|ua[0..60]),
    // 24 hex chars. No ip → '' , which disables de-dup for that guest (same "unknown IP" rule as the
    // inquiry limiter).
    let actorIpHash: string | null = null
    if (!actorUserId) {
      const hdrs = await headers()
      const ua = hdrs.get('user-agent') ?? ''
      const ip = hdrs.get('x-forwarded-for')?.split(',')[0].trim() ?? hdrs.get('x-real-ip') ?? ''
      actorIpHash = ip
        ? createHash('sha256').update(`${ip}|${ua.slice(0, 60)}`).digest('hex').slice(0, 24)
        : ''
    }

    if (actorUserId || actorIpHash) {
      const since = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString()
      const base = db
        .from('listing_contact_events')
        .select('id')
        .eq('listing_id', listing.id)
      const { data: recent, error: dedupError } = await (actorUserId
        ? base.eq('actor_user_id', actorUserId)
        : base.eq('actor_ip_hash', actorIpHash as string)
      )
        .gte('created_at', since)
        .limit(1)

      // A failed look-up must not lose the click: log it and record the event.
      if (dedupError) {
        console.error('[contactEvents] dedup lookup failed', { code: dedupError.code, listingId })
      } else if (recent && recent.length > 0) {
        return { ok: false, reason: 'deduplicated' }
      }
    }

    const isOwnerClick = actorUserId !== null && actorUserId === listing.user_id

    // listing_owner_id and is_owner_click are re-derived by the BEFORE INSERT trigger; the values here
    // come from the server-resolved listing, never from the caller.
    const { error } = await db.from('listing_contact_events').insert({
      listing_id: listing.id,
      listing_owner_id: listing.user_id,
      actor_user_id: actorUserId,
      actor_ip_hash: actorIpHash,
      channel,
      source,
      locale: locale ?? null,
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
