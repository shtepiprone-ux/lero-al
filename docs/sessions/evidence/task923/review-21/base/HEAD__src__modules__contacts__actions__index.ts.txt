'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import {
  sendContactInquiryNotification,
  sendContactInquiryReply,
} from '@/modules/notifications/lib/emails/contactInquiry'
import type { ContactStatus } from '@/types/database'

// ── Topic → mailbox routing ───────────────────────────────────────────────────
//
// Env: CONTACT_SUPPORT_EMAIL, CONTACT_SALES_EMAIL
// Both fall back to CONTACT_SUPPORT_EMAIL if unset.

type MailboxKey = 'support' | 'sales'

const TOPIC_MAILBOX: Record<string, MailboxKey> = {
  general:     'support',
  sales:       'sales',
  support:     'support',
  partnership: 'sales',
  press:       'sales',
  other:       'support',
}

const VALID_TOPICS = new Set(Object.keys(TOPIC_MAILBOX))

function resolveMailbox(mailboxKey: MailboxKey): string | null {
  const supportEmail = process.env.CONTACT_SUPPORT_EMAIL
  const salesEmail   = process.env.CONTACT_SALES_EMAIL ?? supportEmail
  if (mailboxKey === 'sales') return salesEmail ?? null
  return supportEmail ?? null
}

// ── Rate limit ────────────────────────────────────────────────────────────────

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

async function isRateLimited(ip: string): Promise<boolean> {
  if (ip === 'unknown') return false
  const db = createAdminClient()
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
  const { count } = await db
    .from('contact_inquiries')
    .select('id', { count: 'exact', head: true })
    .eq('requester_ip', ip)
    .gte('created_at', since)
  return (count ?? 0) >= RATE_LIMIT_MAX
}

// ── Action ────────────────────────────────────────────────────────────────────

export interface SubmitContactInquiryInput {
  topic: string
  customSubject?: string
  name: string
  email: string
  message: string
}

export async function submitContactInquiry(
  input: SubmitContactInquiryInput,
): Promise<{ error?: 'rate_limited' | 'validation' | 'save_failed' | 'no_mailbox' | 'mailbox_unverified' | 'email_transient' }> {
  // Validate
  const topic = input.topic.trim()
  if (!VALID_TOPICS.has(topic)) return { error: 'validation' }

  const name    = input.name.trim().slice(0, 200)
  const email   = input.email.trim().toLowerCase().slice(0, 200)
  const message = input.message.trim().slice(0, 5000)
  const customSubject = input.customSubject?.trim().slice(0, 200) ?? null

  if (!name || !email || !message || message.length < 20) return { error: 'validation' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'validation' }
  if (topic === 'other' && !customSubject) return { error: 'validation' }

  // Rate limit by IP
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim()
           ?? hdrs.get('x-real-ip')
           ?? 'unknown'

  if (await isRateLimited(ip)) return { error: 'rate_limited' }

  // Derive target mailbox
  const mailboxKey   = TOPIC_MAILBOX[topic] ?? 'support'
  const targetMailbox = resolveMailbox(mailboxKey)
  if (!targetMailbox) {
    console.error('[contact-inquiry] target mailbox env var not set', { mailboxKey })
    return { error: 'no_mailbox' }
  }

  const db = createAdminClient()

  const { error: insertError } = await db.from('contact_inquiries').insert({
    topic,
    custom_subject: customSubject,
    name,
    email,
    message,
    target_mailbox: targetMailbox,
    requester_ip: ip === 'unknown' ? null : ip,
    status: 'new',
  })

  if (insertError) {
    console.error('[contact-inquiry] insert failed', insertError)
    return { error: 'save_failed' }
  }

  // Staff notification — DB inserted first; email second; failures surface to caller
  const displaySubject = topic === 'other' && customSubject ? customSubject : topic
  const emailResult = await sendContactInquiryNotification({
    to: targetMailbox,
    replyTo: email,
    name,
    email,
    topic,
    displaySubject,
    message,
    locale: 'sq', // Albanian-only policy (Task 251)
  })

  if (!emailResult.ok) {
    if (emailResult.reason === 'unverified_sender') {
      console.error('[contact-inquiry] sender not verified in Resend', { targetMailbox })
      return { error: 'mailbox_unverified' }
    }
    console.error('[contact-inquiry] email notification failed', { reason: emailResult.reason })
    return { error: 'email_transient' }
  }

  return {}
}

// ── Admin actions ─────────────────────────────────────────────────────────────

const VALID_STATUSES: ContactStatus[] = ['new', 'in_progress', 'closed']

async function assertAdminOrModerator(): Promise<string | null> {
  const user = await getUser()
  if (!user) return null
  const db = createAdminClient()
  const { data } = await db.from('users').select('role').eq('id', user.id).single()
  if (!data || !['admin', 'moderator'].includes(data.role)) return null
  return user.id
}

export async function updateInquiryStatus(
  inquiryId: string,
  status: string,
): Promise<{ error?: string }> {
  const actorId = await assertAdminOrModerator()
  if (!actorId) return { error: 'forbidden' }
  if (!VALID_STATUSES.includes(status as ContactStatus)) return { error: 'invalid_status' }

  const db = createAdminClient()
  const { error } = await db
    .from('contact_inquiries')
    .update({
      status,
      handled_by: actorId,
      handled_at: new Date().toISOString(),
    })
    .eq('id', inquiryId)

  if (error) {
    console.error('[contact-inquiry] status update failed', error)
    return { error: 'save_failed' }
  }
  return {}
}

export async function sendInquiryReply(
  inquiryId: string,
  body: string,
): Promise<{
  error?: 'forbidden' | 'validation' | 'not_found' | 'save_failed' | 'reply_email_failed'
  reply?: {
    id: string
    inquiry_id: string
    body: string
    created_at: string
    replied_by: string
    replier: { name: string | null } | null
  }
}> {
  const actorId = await assertAdminOrModerator()
  if (!actorId) return { error: 'forbidden' }

  const trimmedBody = body.trim()
  if (!trimmedBody || trimmedBody.length < 5) return { error: 'validation' }

  const db = createAdminClient()

  // Load inquiry to get target_mailbox, email, topic, custom_subject
  const { data: inquiry, error: fetchError } = await db
    .from('contact_inquiries')
    .select('id, email, topic, custom_subject, target_mailbox')
    .eq('id', inquiryId)
    .single()

  if (fetchError || !inquiry) return { error: 'not_found' }

  // Insert reply record and return the inserted row
  const { data: insertedRows, error: insertError } = await db
    .from('contact_inquiry_replies')
    .insert({
      inquiry_id: inquiryId,
      replied_by: actorId,
      body: trimmedBody,
    })
    .select('id, inquiry_id, body, created_at, replied_by')

  if (insertError || !insertedRows?.[0]) {
    console.error('[contact-inquiry] reply insert failed', insertError)
    return { error: 'save_failed' }
  }

  const insertedRow = insertedRows[0]

  // Update inquiry: increment reply_count, set handled_by/handled_at, move to in_progress if still new
  const { data: current } = await db
    .from('contact_inquiries')
    .select('status, reply_count')
    .eq('id', inquiryId)
    .single()

  await db.from('contact_inquiries').update({
    reply_count: (current?.reply_count ?? 0) + 1,
    handled_by: actorId,
    handled_at: new Date().toISOString(),
    ...(current?.status === 'new' ? { status: 'in_progress' } : {}),
  }).eq('id', inquiryId)

  // Fetch replier name for the returned reply shape
  const { data: actor } = await db.from('users').select('name').eq('id', actorId).single()

  const newReply = {
    id: insertedRow.id,
    inquiry_id: insertedRow.inquiry_id,
    body: insertedRow.body,
    created_at: insertedRow.created_at,
    replied_by: insertedRow.replied_by,
    replier: { name: actor?.name ?? null },
  }

  // Send reply email — DB write succeeded; email failure surfaces to caller
  const displaySubject =
    inquiry.topic === 'other' && inquiry.custom_subject
      ? inquiry.custom_subject
      : inquiry.topic

  const replyEmailResult = await sendContactInquiryReply({
    to: inquiry.email,
    fromMailbox: inquiry.target_mailbox,
    displaySubject,
    replyBody: trimmedBody,
    locale: 'sq', // Albanian-only policy (Task 251)
  })

  if (!replyEmailResult.ok) {
    console.error('[contact-inquiry] reply email failed after DB write', {
      inquiryId,
      reason: replyEmailResult.reason,
    })
    return { error: 'reply_email_failed', reply: newReply }
  }

  return { reply: newReply }
}
