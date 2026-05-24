'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendContactInquiryNotification } from '@/modules/notifications/lib/emails/contactInquiry'

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
): Promise<{ error?: 'rate_limited' | 'validation' | 'save_failed' | 'no_mailbox' }> {
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

  // Staff notification — fire-and-forget; failure must not block the user
  const displaySubject = topic === 'other' && customSubject ? customSubject : topic
  sendContactInquiryNotification({
    to: targetMailbox,
    replyTo: email,
    name,
    email,
    topic,
    displaySubject,
    message,
    locale: 'en',
  }).catch(e => console.error('[contact-inquiry] email notification failed', e))

  return {}
}
