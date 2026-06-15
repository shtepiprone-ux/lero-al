'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import { isListingClosed } from '@/modules/listings/domain'
import { sendListingInquiryNotification } from '@/modules/notifications/lib/emails/listingInquiry'
import type { ListingStatus } from '@/types/database'

// ── Rate limit ────────────────────────────────────────────────────────────────
//
// Mirrors src/modules/contacts/actions/index.ts: 5 inquiries / IP / hour.
// An 'unknown' IP (no x-forwarded-for / x-real-ip header) is never rate-limited
// and is stored as requester_ip: null.

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

async function isRateLimited(ip: string): Promise<boolean> {
  if (ip === 'unknown') return false
  const db = createAdminClient()
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
  const { count } = await db
    .from('listing_inquiries')
    .select('id', { count: 'exact', head: true })
    .eq('requester_ip', ip)
    .gte('created_at', since)
  return (count ?? 0) >= RATE_LIMIT_MAX
}

// ── Action ────────────────────────────────────────────────────────────────────

export interface SubmitListingInquiryInput {
  listingId: string
  name: string
  email: string
  message: string
}

export async function submitListingInquiry(
  input: SubmitListingInquiryInput,
): Promise<{ error?: 'rate_limited' | 'validation' | 'not_found' | 'save_failed' | 'owner_unavailable' | 'email_transient' }> {
  // Validate
  const name    = input.name.trim().slice(0, 200)
  const email   = input.email.trim().toLowerCase().slice(0, 200)
  const message = input.message.trim().slice(0, 5000)

  if (!name || !email || !message || message.length < 20) return { error: 'validation' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'validation' }

  // Rate limit by IP
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim()
           ?? hdrs.get('x-real-ip')
           ?? 'unknown'

  if (await isRateLimited(ip)) return { error: 'rate_limited' }

  const db = createAdminClient()

  // Fetch listing
  const { data: listing, error: listingError } = await db
    .from('listings')
    .select('id, user_id, title, status')
    .eq('id', input.listingId)
    .maybeSingle()

  if (listingError || !listing) return { error: 'not_found' }
  if (isListingClosed(listing.status as ListingStatus)) return { error: 'validation' }

  // Self-inquiry guard — viewer resolved server-side, never client-supplied
  const viewer = await getUser()
  if (viewer && viewer.id === listing.user_id) return { error: 'validation' }

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

  // Owner notification — DB inserted first; email second; failures surface to caller
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
    console.error('[listing-inquiry] email notification failed', { reason: emailResult.reason })
    return { error: 'email_transient' }
  }

  return {}
}
