'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireViewer } from '@/lib/auth/requireViewer'
import { isUuid } from '@/lib/security/inputs'
import { isLiveAccount } from '@/lib/auth/accountAccess'
import { CONTACT_ACTIONS } from '@/modules/listings/lib/contactActions'
import { checkContactHuman } from '@/modules/listings/lib/contactHumanCheck'
import { sendListingInquiryNotification } from '@/modules/notifications/lib/emails/listingInquiry'
import { createNotification } from '@/modules/notifications/lib/createNotification'
import type { ListingStatus } from '@/types/database'

// sq-fallback strings for the `title`/`body` columns (Owner decision 2, Task 319, same
// SUPPORT_NOTIFY_SQ pattern as src/modules/admin/actions/index.ts). The viewer-locale
// rendering comes from notifications.listing_inquiry*_title/_body (messages/{sq,en,uk,it}.json),
// resolved at render time by NotificationItem.
const INQUIRY_NOTIFY_SQ = {
  title: (listingName: string) => `Mesazh i ri: ${listingName}`,
  body: 'Dikush ju dërgoi një mesazh në lidhje me këtë njoftim.',
  emailFailedTitle: (listingName: string) => `Mesazhi nuk u dërgua me email: ${listingName}`,
  emailFailedBody: (senderName: string, senderEmail: string) =>
    `${senderName} (${senderEmail}) ju dërgoi një mesazh, por email-i nuk u dërgua. Mund t'i përgjigjeni direkt në këtë adresë.`,
}

// ── Rate limit ────────────────────────────────────────────────────────────────
//
// Mirrors src/modules/contacts/actions/index.ts: 5 inquiries / hour, counted per IP AND per person (Task 923 R70 (c)).
//  - per IP: an 'unknown' IP (no x-forwarded-for / x-real-ip header) is ONE shared bucket (the rows stored with requester_ip null) with the same limit; it used to
//    switch the limit off;
//  - per person: the rows stored with the account's own Auth e-mail (the sender address is the account's, see the action), so changing the IP does not reset it;
//  - a count that cannot be read refuses (the limit never fails open).
// OPEN: the count is a read followed by a later insert, so parallel requests pass.

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

async function isRateLimited(ip: string, senderEmail: string): Promise<boolean> {
  const db = createAdminClient()
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
  const base = () => db.from('listing_inquiries').select('id', { count: 'exact', head: true })
  const byIp = ip === 'unknown' ? base().is('requester_ip', null) : base().eq('requester_ip', ip)
  const byPerson = base().eq('email', senderEmail)
  const [ipCount, personCount] = await Promise.all([byIp.gte('created_at', since), byPerson.gte('created_at', since)])
  for (const result of [ipCount, personCount]) {
    if (result.error || result.count === null || result.count === undefined) {
      console.error('[listing-inquiry] rate limit count failed: refusing', { code: result.error?.code })
      return true
    }
  }
  return (ipCount.count ?? 0) >= RATE_LIMIT_MAX || (personCount.count ?? 0) >= RATE_LIMIT_MAX
}

// ── Action ────────────────────────────────────────────────────────────────────

export interface SubmitListingInquiryInput {
  listingId: string
  name: string
  email: string
  message: string
  /** The Cloudflare Turnstile token of the contact_inquiry action (Task 923 R112, R86). */
  captchaToken: string
}

export async function submitListingInquiry(
  input: SubmitListingInquiryInput,
): Promise<{ error?: 'unauthenticated' | 'bot_check_failed' | 'rate_limited' | 'validation' | 'not_found' | 'save_failed' | 'owner_unavailable' | 'email_transient' }> {
  // The arguments of a Server Action come from any caller and their types are erased: only strings are processed.
  if (typeof input?.name !== 'string' || typeof input.email !== 'string' || typeof input.message !== 'string' || typeof input.listingId !== 'string') {
    return { error: 'validation' }
  }
  const name    = input.name.trim().slice(0, 200)
  const message = input.message.trim().slice(0, 5000)

  // The typed e-mail is only required to be present, as the form sends it: it is NOT used. The sender address is the signed-in account's own Auth e-mail
  // (Task 923 R70 (c)), read below; a caller-chosen reply address let any signed-in person make the owner's reply go to someone else.
  if (!name || !input.email.trim() || !message || message.length < 20) return { error: 'validation' }
  if (!isUuid(input.listingId)) return { error: 'not_found' }

  // Session first (owner correction 2026-10-17: a guest has no access to the owner's contact card). The page already shows a guest only the sign-in prompt,
  // but a hidden button proves presentation only: this action is a public endpoint, so it refuses a guest, a session without a profile and a blocked or
  // inactive account BEFORE it reads the listing or the owner, and before anything is written, e-mailed or notified. A failing lookup is not a pass.
  const viewer = await requireViewer()
  if (!viewer.ok) return { error: viewer.reason === 'unauthenticated' ? 'unauthenticated' : 'save_failed' }

  // The human check comes right after the session and before any lookup: a bot gets no read of the sender, the listing or the owner (Task 923 R112, R86).
  if (!(await checkContactHuman(input.captchaToken, CONTACT_ACTIONS.inquiry))) return { error: 'bot_check_failed' }

  const db = createAdminClient()

  // The sender: the account's own Auth e-mail, never the typed field (Task 923 R70 (c)). An account without one cannot send a message the owner could answer.
  const { data: senderAuth, error: senderError } = await db.auth.admin.getUserById(viewer.userId)
  const email = senderAuth?.user?.email?.trim().toLowerCase()
  if (senderError || !email) {
    console.error('[listing-inquiry] the sender account has no readable e-mail', { code: senderError?.code })
    return { error: 'save_failed' }
  }

  // Rate limit by IP and by person
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim()
           ?? hdrs.get('x-real-ip')
           ?? 'unknown'

  if (await isRateLimited(ip, email)) return { error: 'rate_limited' }

  // Fetch listing
  const { data: listing, error: listingError } = await db
    .from('listings')
    .select('id, user_id, title, status, slug')
    .eq('id', input.listingId)
    .maybeSingle()

  if (listingError || !listing) return { error: 'not_found' }
  // Only an ACTIVE listing of a LIVE owner can be written to (Task 923 R66 (f), owner F2): a pending, inactive, expired, sold, rented or archived listing has its
  // contact card locked, and so does one whose owner was deleted or has no access. The page hides the button, this action is a public endpoint.
  if ((listing.status as ListingStatus) !== 'active') return { error: 'validation' }
  const ownerLive = await isLiveAccount(listing.user_id)
  if (ownerLive === null) return { error: 'save_failed' }
  if (!ownerLive) return { error: 'validation' }

  // Self-inquiry guard — the viewer is the verified session user, never client-supplied
  if (viewer.userId === listing.user_id) return { error: 'validation' }

  // Resolve owner email server-side only
  const { data: authData } = await db.auth.admin.getUserById(listing.user_id)
  const ownerEmail = authData?.user?.email
  if (!ownerEmail) return { error: 'owner_unavailable' }

  // Insert row — DB first
  const { error: insertError } = await db.from('listing_inquiries').insert({
    listing_id: listing.id,
    listing_owner_id: listing.user_id,
    name,
    email,
    message,
    requester_ip: ip === 'unknown' ? null : ip,
    status: 'new',
  })

  if (insertError) {
    console.error('[listing-inquiry] insert failed', insertError)
    return { error: 'save_failed' }
  }

  // Owner email — DB inserted first; email second; failures surface to caller
  let emailFailed = false
  let emailReason = 'unknown'
  try {
    const emailResult = await sendListingInquiryNotification({
      to: ownerEmail,
      replyTo: email,
      listingTitle: listing.title,
      name,
      email,
      message,
      locale: 'sq', // Albanian-only policy (Task 251)
    })
    if (!emailResult.ok) {
      emailFailed = true
      emailReason = emailResult.reason
    }
  } catch (e) {
    emailFailed = true
    emailReason = e instanceof Error ? e.message : 'threw'
  }

  if (emailFailed) {
    console.error('[listing-inquiry] email notification failed', { reason: emailReason })
  }

  // Owner in-app notification (D82-5) — exactly one, awaited, never fails the action's result.
  // Email delivered -> 'listing_inquiry'; email failed/threw -> 'listing_inquiry_email_failed'
  // carrying the sender's contacts so the owner can reply directly (email stays the main channel).
  const link = `/listings/${listing.slug}`
  try {
    if (emailFailed) {
      await createNotification({
        userId: listing.user_id,
        type: 'new_message',
        templateId: 'listing_inquiry_email_failed',
        templateParams: { listingName: listing.title, senderName: name, senderEmail: email },
        title: INQUIRY_NOTIFY_SQ.emailFailedTitle(listing.title),
        body: INQUIRY_NOTIFY_SQ.emailFailedBody(name, email),
        link,
      })
    } else {
      await createNotification({
        userId: listing.user_id,
        type: 'new_message',
        templateId: 'listing_inquiry',
        templateParams: { listingName: listing.title },
        title: INQUIRY_NOTIFY_SQ.title(listing.title),
        body: INQUIRY_NOTIFY_SQ.body,
        link,
      })
    }
  } catch (e) {
    console.error('[listing-inquiry] notification failed', e)
  }

  if (emailFailed) return { error: 'email_transient' }

  return {}
}
