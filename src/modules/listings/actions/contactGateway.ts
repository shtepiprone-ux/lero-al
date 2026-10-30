'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireViewer } from '@/lib/auth/requireViewer'
import { isUuid } from '@/lib/security/inputs'
import { trackListingContactEvent } from '@/modules/listings/actions/contactEvents'
import { CONTACT_ACTIONS } from '@/modules/listings/lib/contactActions'
import { checkContactHuman } from '@/modules/listings/lib/contactHumanCheck'

interface RevealListingContactInput {
  listingId: string
  channel: 'call' | 'whatsapp'
  captchaToken: string
  locale?: string
}

type RevealListingContactResult =
  | { ok: true; number: string }
  | { ok: false; reason: 'unauthenticated' | 'bot_check_failed' | 'not_available' | 'load_failed' | 'rate_limited' }

// Reveal limits (Task 923 R126), counted in `public.listing_contact_reveals` over rolling windows of the last hour and the last 24 hours.
// Per account: 20 per hour and 60 per day (owner decision D77), 35 and 120 for a verified account (D79). Per IP address: 60 and 200 (D80).
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const REVEAL_LIMIT_ACCOUNT = { perHour: 20, perDay: 60 }
const REVEAL_LIMIT_VERIFIED_ACCOUNT = { perHour: 35, perDay: 120 }
const REVEAL_LIMIT_IP = { perHour: 60, perDay: 200 }
// The window needs rows for 24 hours only; older rows are deleted.
const REVEAL_RETENTION_MS = 2 * DAY_MS

/**
 * Decides whether this viewer may have this listing's number revealed now, and records the reveal (Task 923 R126; owner decisions D77, D79, D80).
 *  - A listing the viewer had revealed in the last 24 hours is free: the viewer already knows the number, so nothing else is read or written.
 *  - Otherwise the account's rows (35/120 when `users.is_verified`, else 20/60) and the IP's rows (60/200) are counted, and one row is inserted.
 * Fail closed: an error, a null count, a missing `users` row or a failed insert refuses (`load_failed`); the limit never counts a failed read as zero.
 * OPEN: the count is a read followed by a later insert, so parallel requests pass (as in the message limit).
 */
async function checkRevealLimit(viewerId: string, listingId: string, channel: 'call' | 'whatsapp'): Promise<'allowed' | 'rate_limited' | 'load_failed'> {
  try {
    const hdrs = await headers()
    const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || hdrs.get('x-real-ip')?.trim() || null
    const db = createAdminClient()
    const now = Date.now()
    const hourAgo = new Date(now - HOUR_MS).toISOString()
    const dayAgo = new Date(now - DAY_MS).toISOString()

    const mine = await db.from('listing_contact_reveals').select('listing_id, created_at').eq('viewer_id', viewerId).gte('created_at', dayAgo)
    if (mine.error || !mine.data) {
      console.error('[contact] reveal rows could not be read: refusing', { code: mine.error?.code })
      return 'load_failed'
    }
    if (mine.data.some(row => row.listing_id === listingId)) return 'allowed'

    const profile = await db.from('users').select('is_verified').eq('id', viewerId).maybeSingle()
    if (profile.error || !profile.data) {
      console.error('[contact] the verified flag could not be read: refusing', { code: profile.error?.code })
      return 'load_failed'
    }
    const limit = profile.data.is_verified === true ? REVEAL_LIMIT_VERIFIED_ACCOUNT : REVEAL_LIMIT_ACCOUNT
    const inLastHour = mine.data.filter(row => Date.parse(row.created_at as string) >= now - HOUR_MS).length
    if (inLastHour >= limit.perHour || mine.data.length >= limit.perDay) return 'rate_limited'

    const countIp = (since: string) => {
      const base = db.from('listing_contact_reveals').select('id', { count: 'exact', head: true })
      return (ip === null ? base.is('requester_ip', null) : base.eq('requester_ip', ip)).gte('created_at', since)
    }
    const [ipHour, ipDay] = await Promise.all([countIp(hourAgo), countIp(dayAgo)])
    for (const result of [ipHour, ipDay]) {
      if (result.error || result.count === null || result.count === undefined) {
        console.error('[contact] the IP reveal count failed: refusing', { code: result.error?.code })
        return 'load_failed'
      }
    }
    if ((ipHour.count ?? 0) >= REVEAL_LIMIT_IP.perHour || (ipDay.count ?? 0) >= REVEAL_LIMIT_IP.perDay) return 'rate_limited'

    const inserted = await db.from('listing_contact_reveals').insert({ viewer_id: viewerId, listing_id: listingId, channel, requester_ip: ip })
    if (inserted.error) {
      console.error('[contact] the reveal could not be recorded: refusing', { code: inserted.error.code })
      return 'load_failed'
    }

    // Retention: a failed delete is logged and changes nothing.
    try {
      const { error } = await db.from('listing_contact_reveals').delete().lt('created_at', new Date(now - REVEAL_RETENTION_MS).toISOString())
      if (error) console.error('[contact] old reveal rows could not be deleted', { code: error.code })
    } catch (err) {
      console.error('[contact] old reveal rows could not be deleted', err)
    }
    return 'allowed'
  } catch (err) {
    console.error('[contact] the reveal limit failed unexpectedly: refusing', err)
    return 'load_failed'
  }
}

/**
 * The one public path to a listing owner's phone or WhatsApp number (Task 923 R111, R86). The browser sends a listing, a channel and a Turnstile token; this action
 * decides in a fixed order, and each step refuses before the next one runs:
 *  1. the input is shaped (a listing id, a channel);
 *  2. the caller is a person the server verified with Supabase Auth (`requireViewer`, which asks GoTrue and refuses an ended session);
 *  3. the human check passes for the action `contact_reveal` and this site;
 *  4. the database function that takes the caller (hardening v8a, executable by the service role only) answers with the id of step 2, never an id from the request;
 *  5. the reveal limits of the account and the IP address (`checkRevealLimit`, Task 923 R126), which also records the reveal.
 * A WhatsApp reveal also records its contact event here, on the server, so no client call can write one. Only the number of the requested channel is returned.
 */
export async function revealListingContact(input: RevealListingContactInput): Promise<RevealListingContactResult> {
  // The arguments of a Server Action come from any caller and their types are erased.
  if (typeof input !== 'object' || input === null) return { ok: false, reason: 'not_available' }
  const { listingId, channel, captchaToken, locale } = input
  if (!isUuid(listingId) || (channel !== 'call' && channel !== 'whatsapp')) return { ok: false, reason: 'not_available' }

  const viewer = await requireViewer()
  if (!viewer.ok) return { ok: false, reason: viewer.reason === 'lookup_failed' ? 'load_failed' : 'unauthenticated' }

  if (!(await checkContactHuman(captchaToken, CONTACT_ACTIONS.reveal))) return { ok: false, reason: 'bot_check_failed' }

  let number: string | null
  try {
    const { data, error } = await createAdminClient().rpc('get_listing_owner_contact_as', {
      p_caller: viewer.userId,
      listing_id_param: listingId,
    })
    if (error) {
      console.error('[contact] get_listing_owner_contact_as failed', { code: error.code, listingId })
      return { ok: false, reason: 'load_failed' }
    }
    const row = (data as { phone: string | null; whatsapp: string | null }[] | null)?.[0]
    const found = channel === 'whatsapp' ? row?.whatsapp : row?.phone
    number = typeof found === 'string' && found.trim() ? found : null
  } catch (err) {
    console.error('[contact] get_listing_owner_contact_as unexpected error', err)
    return { ok: false, reason: 'load_failed' }
  }
  if (!number) return { ok: false, reason: 'not_available' }

  const limit = await checkRevealLimit(viewer.userId, listingId, channel)
  if (limit !== 'allowed') return { ok: false, reason: limit }

  if (channel === 'whatsapp') {
    // The result of the event does not change the answer: a failed or deduplicated event never hides a number the caller is entitled to.
    try {
      await trackListingContactEvent({ listingId, channel: 'whatsapp', source: 'listing_detail_contact_card', locale: typeof locale === 'string' ? locale : undefined })
    } catch (err) {
      console.error('[contact] contact event failed', err)
    }
  }
  return { ok: true, number }
}
