'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'

export type ListingContactChannel = 'whatsapp'
export type ListingContactSource = 'listing_detail_contact_card'

interface TrackArgs {
  listingId: string
  listingOwnerId: string
  channel: ListingContactChannel
  source: ListingContactSource
  locale?: string
}

type TrackResult =
  | { ok: true }
  | { ok: false; reason: 'self_click' | 'insert_failed' | 'session_error' }

export async function trackListingContactEvent(args: TrackArgs): Promise<TrackResult> {
  const { listingId, listingOwnerId, channel, source, locale } = args

  let actorUserId: string | null = null
  let isOwnerClick = false

  try {
    const user = await getUser()
    if (user) {
      actorUserId = user.id
      if (user.id === listingOwnerId) {
        isOwnerClick = true
      }
    }
  } catch {
    return { ok: false, reason: 'session_error' }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('listing_contact_events').insert({
      listing_id: listingId,
      listing_owner_id: listingOwnerId,
      actor_user_id: actorUserId,
      channel,
      source,
      locale: locale ?? null,
      is_owner_click: isOwnerClick,
    })
    if (error) {
      console.error('[contactEvents] insert failed', { error, listingId, channel })
      return { ok: false, reason: 'insert_failed' }
    }
  } catch (err) {
    console.error('[contactEvents] unexpected error', err)
    return { ok: false, reason: 'insert_failed' }
  }

  if (isOwnerClick) return { ok: false, reason: 'self_click' }
  return { ok: true }
}
