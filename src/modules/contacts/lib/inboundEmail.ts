import 'server-only'
import PostalMime, { type Email, type Header } from 'postal-mime'
import sanitizeHtml from 'sanitize-html'
import { createAdminClient } from '@/lib/supabase/admin'
import { isPlainEmail } from '@/lib/security/inputs'
import { isMessageId } from '@/modules/notifications/lib/emails/send'
import { deleteMailObjects, putMailObject } from '@/lib/media/r2'
import { sniffImageType } from '@/lib/uploads/imageSniff'
import type { InquiryAttachment } from '@/types/database'

/**
 * A mail received at support@ or sales@ (Task 1044), handed over by the Cloudflare Email Worker through `/api/email/inbound` after that route checked the secret,
 * the size and the recipient. It is stored before anything is acknowledged (O1044: "confirm a received mail only after it is reliably stored"):
 *  - 200 for a stored mail (a new inquiry, or an answer joined to its inquiry) and for one dropped on purpose (a duplicate, our own domain, an automatic answer, a flood),
 *    so no bounce loop starts; 422 for a message without one plain sender address; 500 for a failed read or write, so the Worker rejects it and the sender is told.
 *  - An answer joins an inquiry only on proof, all three: an id of its In-Reply-To or References is a stored message id of that inquiry or of one of its replies, the
 *    sender is that inquiry's own address, and the TOPMOST Authentication-Results header, written by `mx.cloudflare.net` (Cloudflare prepends it after its DMARC check),
 *    says `dmarc=pass`. A result header lower down, or under another authserv-id, is the sender's own text and is never trusted. Anything less opens a new inquiry.
 *  - The body is kept as text only. Each attachment (Task 1047, owner decision O1047-1) is put into the private mail bucket under `mail/<inquiry id>/<uuid v4>` before the row is
 *    written; the row keeps its name, size, declared type, key and `preview`. Only JPEG, PNG, WebP and PDF bytes are stored with their type and `inline`; every other file is
 *    `application/octet-stream` and `attachment`. A failed put, or a failed write after the puts, deletes the keys it put. No mail is ever sent from here.
 *  - Log lines carry the outcome and error codes only: never an address, a subject, a body or an id.
 */

export type InboundOutcome =
  | 'stored'
  | 'joined'
  | 'duplicate'
  | 'dropped_loop'
  | 'dropped_auto'
  | 'dropped_limit'
  | 'invalid_message'
  | 'invalid_sender'
  | 'no_mailbox'
  | 'read_failed'
  | 'write_failed'

export interface InboundResult {
  status: 200 | 422 | 500
  outcome: InboundOutcome
}

export interface InboundEnvelope {
  /** the envelope MAIL FROM (may be empty for a bounce) */
  from: string
  /** the envelope RCPT TO, already checked by the route to be support@ or sales@ of our domain */
  to: string
}

type AdminClient = ReturnType<typeof createAdminClient>

const OWN_DOMAIN = 'lero.al'
const TRUSTED_AUTHSERV_ID = 'mx.cloudflare.net'
const MAX_BODY_LENGTH = 20_000
const MAX_FIELD_LENGTH = 200
const MAX_ATTACHMENTS = 20
const MAX_THREAD_IDS = 50
/** a header value read for tokens is cut first, so no pattern runs over an unbounded string */
const MAX_HEADER_SCAN = 20_000
const SENDER_LIMIT = 5
const SENDER_WINDOW_MS = 60 * 60 * 1000
const MAIL_LIMIT = 100
const MAIL_WINDOW_MS = 24 * 60 * 60 * 1000
const AUTO_PRECEDENCE = new Set(['bulk', 'junk', 'list', 'auto_reply'])
const UNIQUE_VIOLATION = '23505'
const NUL = String.fromCharCode(0)

function settled(status: 200 | 422, outcome: InboundOutcome): InboundResult {
  console.info('[inbound-email]', { outcome })
  return { status, outcome }
}

function failed(outcome: InboundOutcome, code?: string): InboundResult {
  console.error('[inbound-email]', { outcome, code: code ?? null })
  return { status: 500, outcome }
}

/** text on one line, without NUL (Postgres text refuses it), cut to `max` characters */
function oneLine(value: string, max: number): string {
  return value.split(NUL).join('').replace(/[\r\n\u2028\u2029\t]+/g, ' ').trim().slice(0, max)
}

/** the first value of each header by its lower-case name, read into a Map: parsed headers are never merged into an object */
function headerMap(headers: Header[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const h of headers) if (!map.has(h.key)) map.set(h.key, h.value)
  return map
}

function isOwnDomain(address: string): boolean {
  const domain = address.slice(address.lastIndexOf('@') + 1).trim().toLowerCase()
  return domain === OWN_DOMAIN || domain.endsWith(`.${OWN_DOMAIN}`)
}

/** `dmarc=pass` in the topmost Authentication-Results header, and only when its authserv-id is exactly Cloudflare's */
function trustedDmarcPass(headers: Header[]): boolean {
  const topmost = headers.find((h) => h.key === 'authentication-results')
  if (!topmost) return false
  const [authservId, ...results] = topmost.value.slice(0, MAX_HEADER_SCAN).split(';')
  if (authservId.trim().toLowerCase() !== TRUSTED_AUTHSERV_ID) return false
  return results.some((result) => /^dmarc\s*=\s*pass(?:\s|$)/i.test(result.trim()))
}

function isAutomatic(headers: Map<string, string>): boolean {
  const autoSubmitted = headers.get('auto-submitted')
  if (autoSubmitted !== undefined && autoSubmitted.split(';')[0].trim().toLowerCase() !== 'no') return true
  const precedence = headers.get('precedence')
  if (precedence !== undefined && AUTO_PRECEDENCE.has(precedence.trim().toLowerCase())) return true
  return headers.has('x-autoreply') || headers.has('x-autorespond')
}

/** the ids an answer names: In-Reply-To first, then References newest first; well-formed ids only, at most 50 */
function threadIds(inReplyTo: string | undefined, references: string | undefined): string[] {
  const tokens = (value: string | undefined) => (value ?? '').slice(0, MAX_HEADER_SCAN).match(/<[^<>\s]{1,257}>/g) ?? []
  const ids = [...tokens(inReplyTo), ...tokens(references).reverse()].filter(isMessageId)
  return [...new Set(ids)].slice(0, MAX_THREAD_IDS)
}

const XML_ENTITIES: [RegExp, string][] = [[/&lt;/g, '<'], [/&gt;/g, '>'], [/&quot;/g, '"'], [/&(?:apos|#39);/g, "'"], [/&amp;/g, '&']]

/** the text part, else the HTML part flattened to text: every tag and attribute removed, then the XML entities the sanitizer wrote decoded (`&amp;` last) */
function bodyText(email: Email): string {
  let text = email.text && email.text.trim() ? email.text : ''
  if (!text && email.html) {
    text = sanitizeHtml(email.html, { allowedTags: [], allowedAttributes: {} })
    for (const [entity, character] of XML_ENTITIES) text = text.replace(entity, character)
  }
  return text.split(NUL).join('').trim().slice(0, MAX_BODY_LENGTH)
}

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d]   // %PDF-
const MAX_FALLBACK_NAME = 100

/** the type a browser may show inline, read from the bytes (never the declared type): JPEG, PNG, WebP or PDF; null for anything else */
function previewType(bytes: Uint8Array): string | null {
  return sniffImageType(bytes) ?? (PDF_SIGNATURE.every((b, i) => bytes[i] === b) ? 'application/pdf' : null)
}

/**
 * `inline` or `attachment` with the name twice (RFC 6266): `filename` an ASCII fallback (letters, digits, `.`, `_`, `-`, space; any other character `_`; at most 100; empty → `attachment`),
 * `filename*` the UTF-8 bytes percent-encoded except letters, digits and `- _ . ! ~`. The bytes come from `TextEncoder`, which turns a lone surrogate into U+FFFD, so it never throws.
 */
function contentDisposition(kind: 'inline' | 'attachment', name: string): string {
  const fallback = Array.from(name, (c) => (/^[A-Za-z0-9._ -]$/.test(c) ? c : '_')).join('').slice(0, MAX_FALLBACK_NAME) || 'attachment'
  let encoded = ''
  for (const byte of new TextEncoder().encode(name)) {
    const c = String.fromCharCode(byte)
    encoded += /^[A-Za-z0-9\-_.!~]$/.test(c) ? c : `%${byte.toString(16).toUpperCase().padStart(2, '0')}`
  }
  return `${kind}; filename="${fallback}"; filename*=UTF-8''${encoded}`
}

/** deletes the objects a failed write left without a row; a failed delete is logged by its outcome only */
async function discard(keys: string[]): Promise<void> {
  if (keys.length === 0) return
  try {
    await deleteMailObjects(keys)
  } catch {
    console.error('[inbound-email]', { outcome: 'attachment_delete_failed' })
  }
}

/** puts the first 20 attachments into the mail bucket under `mail/<inquiryId>/`; null when a put failed (the keys already put are deleted) */
async function storeAttachments(inquiryId: string, email: Email): Promise<{ attachments: InquiryAttachment[]; keys: string[] } | null> {
  const files = email.attachments.slice(0, MAX_ATTACHMENTS).map((a) => {
    const bytes = typeof a.content === 'string' ? new TextEncoder().encode(a.content) : new Uint8Array(a.content)
    const filename = oneLine(a.filename ?? '', MAX_FIELD_LENGTH)
    const type = previewType(bytes)
    const key = `mail/${inquiryId}/${crypto.randomUUID()}`
    const row: InquiryAttachment = {
      filename,
      size: typeof a.content === 'string' ? a.content.length : a.content.byteLength,
      content_type: oneLine(a.mimeType ?? '', MAX_FIELD_LENGTH),
      key,
      preview: type !== null,
    }
    return { row, key, bytes, contentType: type ?? 'application/octet-stream', contentDisposition: contentDisposition(type ? 'inline' : 'attachment', filename) }
  })
  const outcomes = await Promise.allSettled(files.map((f) => putMailObject(f.key, f.bytes, { contentType: f.contentType, contentDisposition: f.contentDisposition })))
  if (outcomes.some((o) => o.status === 'rejected')) {
    await discard(files.filter((_, i) => outcomes[i].status === 'fulfilled').map((f) => f.key))
    return null
  }
  return { attachments: files.map((f) => f.row), keys: files.map((f) => f.key) }
}

/** the mailbox an inquiry belongs to, by the recipient's local part without its +tag (the same fallback as the contact form: sales falls back to support) */
function mailboxFor(recipient: string): string | null {
  const local = recipient.slice(0, recipient.lastIndexOf('@')).split('+')[0].toLowerCase()
  const support = process.env.CONTACT_SUPPORT_EMAIL
  const sales = process.env.CONTACT_SALES_EMAIL ?? support
  return (local === 'sales' ? sales : support) ?? null
}

/** true when a limit is reached, null when a count could not be read */
async function isOverLimit(db: AdminClient, sender: string): Promise<boolean | null> {
  const now = Date.now()
  const hour = new Date(now - SENDER_WINDOW_MS).toISOString()
  const day = new Date(now - MAIL_WINDOW_MS).toISOString()
  const count = (table: 'contact_inquiries' | 'contact_inquiry_replies') => db.from(table).select('id', { count: 'exact', head: true })
  const counts = await Promise.all([
    count('contact_inquiries').eq('source', 'email').eq('email', sender).gte('created_at', hour),
    count('contact_inquiry_replies').eq('direction', 'inbound').eq('from_email', sender).gte('created_at', hour),
    count('contact_inquiries').eq('source', 'email').gte('created_at', day),
    count('contact_inquiry_replies').eq('direction', 'inbound').gte('created_at', day),
  ])
  if (counts.some((c) => c.error || typeof c.count !== 'number')) return null
  const [senderInquiries, senderAnswers, allInquiries, allAnswers] = counts.map((c) => c.count as number)
  return senderInquiries + senderAnswers >= SENDER_LIMIT || allInquiries + allAnswers >= MAIL_LIMIT
}

/** the inquiry an answer belongs to: one whose own id or one of whose replies' ids the answer names, and whose address is the sender's; 'error' on a failed read */
async function findInquiry(db: AdminClient, ids: string[], sender: string): Promise<string | null | 'error'> {
  if (ids.length === 0) return null
  const [own, viaReplies] = await Promise.all([
    db.from('contact_inquiries').select('id, email').in('message_id', ids),
    db.from('contact_inquiry_replies').select('inquiry_id').in('message_id', ids),
  ])
  if (own.error || viaReplies.error) return 'error'
  const candidates: { id: string; email: string }[] = [...(own.data ?? [])]
  const replyInquiryIds = [...new Set((viaReplies.data ?? []).map((r) => r.inquiry_id as string))]
  if (replyInquiryIds.length > 0) {
    const more = await db.from('contact_inquiries').select('id, email').in('id', replyInquiryIds)
    if (more.error) return 'error'
    candidates.push(...(more.data ?? []))
  }
  return candidates.find((c) => typeof c.email === 'string' && c.email.toLowerCase() === sender)?.id ?? null
}

export async function processInboundEmail(raw: ArrayBuffer | Uint8Array, envelope: InboundEnvelope): Promise<InboundResult> {
  let email: Email
  try {
    email = await PostalMime.parse(raw)
  } catch {
    return settled(422, 'invalid_message')
  }

  // the sender is the From address of the message, one plain address
  const from = email.from
  const sender = from && typeof from.address === 'string' ? from.address.trim().toLowerCase() : ''
  if (!isPlainEmail(sender)) return settled(422, 'invalid_sender')

  const headers = headerMap(email.headers)
  const messageId = isMessageId(email.messageId) ? email.messageId : null
  const db = createAdminClient()

  // 1. a repeated delivery: the id is already stored, on an inquiry or a reply of either direction
  if (messageId) {
    const [inquiry, reply] = await Promise.all([
      db.from('contact_inquiries').select('id').eq('message_id', messageId).limit(1),
      db.from('contact_inquiry_replies').select('id').eq('message_id', messageId).limit(1),
    ])
    if (inquiry.error || reply.error) return failed('read_failed', inquiry.error?.code ?? reply.error?.code)
    if ((inquiry.data?.length ?? 0) > 0 || (reply.data?.length ?? 0) > 0) return settled(200, 'duplicate')
  }

  // 2. our own domain (a loop), 3. an automatic answer, 4. a flood
  if (isOwnDomain(sender) || (envelope.from && isOwnDomain(envelope.from))) return settled(200, 'dropped_loop')
  if (isAutomatic(headers)) return settled(200, 'dropped_auto')
  const overLimit = await isOverLimit(db, sender)
  if (overLimit === null) return failed('read_failed')
  if (overLimit) return settled(200, 'dropped_limit')

  const body = bodyText(email)

  // 5. an answer joins its inquiry only on all three proofs
  if (trustedDmarcPass(email.headers)) {
    const inquiryId = await findInquiry(db, threadIds(email.inReplyTo, email.references), sender)
    if (inquiryId === 'error') return failed('read_failed')
    if (inquiryId) {
      // Task 1047: the files go under the inquiry before anything is written
      const stored = await storeAttachments(inquiryId, email)
      if (!stored) return failed('write_failed', 'attachment_put')
      // O1044-5: a customer's answer reopens its inquiry (closed ones too), keeping its history
      const reopened = await db.from('contact_inquiries').update({ status: 'new' }).eq('id', inquiryId)
      if (reopened.error) {
        await discard(stored.keys)
        return failed('write_failed', reopened.error.code)
      }
      const answer = await db.from('contact_inquiry_replies').insert({
        inquiry_id: inquiryId,
        direction: 'inbound',
        from_email: sender,
        body,
        message_id: messageId,
        attachments: stored.attachments,
      })
      if (answer.error) {
        await discard(stored.keys)
        return answer.error.code === UNIQUE_VIOLATION ? settled(200, 'duplicate') : failed('write_failed', answer.error.code)
      }
      return settled(200, 'joined')
    }
  }

  // 6. anything else opens a new inquiry on the page of its mailbox
  const targetMailbox = mailboxFor(envelope.to)
  if (!targetMailbox) return failed('no_mailbox')
  const subject = oneLine(email.subject ?? '', MAX_FIELD_LENGTH)
  const name = oneLine(from?.name ?? '', MAX_FIELD_LENGTH) || sender.slice(0, sender.lastIndexOf('@')).slice(0, MAX_FIELD_LENGTH)
  // Task 1047: the new inquiry's id is chosen first, so its files sit under it before the row exists
  const newId = crypto.randomUUID()
  const stored = await storeAttachments(newId, email)
  if (!stored) return failed('write_failed', 'attachment_put')
  const inserted = await db.from('contact_inquiries').insert({
    id: newId,
    source: 'email',
    topic: 'other',
    custom_subject: subject || null,
    name,
    email: sender,
    message: body,
    target_mailbox: targetMailbox,
    requester_ip: null,
    status: 'new',
    message_id: messageId,
    attachments: stored.attachments,
  })
  if (inserted.error) {
    await discard(stored.keys)
    return inserted.error.code === UNIQUE_VIOLATION ? settled(200, 'duplicate') : failed('write_failed', inserted.error.code)
  }
  return settled(200, 'stored')
}
