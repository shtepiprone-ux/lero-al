/**
 * POST /api/email/inbound (Tasks 1044, 1046): the one door of received mail. The Cloudflare Email Worker `cloudflare/email-inbound/worker.js` streams each message sent
 * to support@ or sales@ into the private mail bucket (`inbound/<uuid>.eml`) and posts its key here as `{ "key": ... }`, with the shared secret and the envelope
 * addresses; the route answers 200 only after the message is stored or dropped on purpose, and the Worker rejects the mail on any other answer, so the sender is told
 * it was not delivered.
 *
 * Checks, cheapest first and before the body is read: no INBOUND_EMAIL_SECRET configured → 503 (fail closed); a missing or wrong `Authorization: Bearer` →
 * 401 (constant-time comparison); a declared body above 1 024 bytes → 413; a recipient (`x-envelope-to`) that is not support@ or sales@ (an optional +tag allowed) of
 * the domain of CONTACT_SUPPORT_EMAIL or a subdomain of it → 422. Then the body is read once (above 1 024 bytes → 413) and must be one object with one string `key` of
 * the Worker's own shape, else 422 before any R2 call. The message is read from the mail bucket (missing → 422, above 25 MB → 413 and deleted, a failed read → 500),
 * `processInboundEmail` decides, and the object is deleted after its answer (a failed delete is logged as its outcome code; the bucket's 1-day rule removes it). Nothing
 * about the message is logged here; an unexpected error answers 500 without its text.
 */
import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { R2TooLargeError, deleteMailObjects, getMailObject } from '@/lib/media/r2'
import { isPlainEmail } from '@/lib/security/inputs'
import { processInboundEmail } from '@/modules/contacts/lib/inboundEmail'

/** the raw MIME limit (owner decision O1046-2, 2026-11-25: 25 MB, Cloudflare Email Routing's own maximum of 25 MiB) */
const MAX_MESSAGE_BYTES = 26_214_400
/** the body is `{ "key": "inbound/<uuid>.eml" }` only */
const MAX_BODY_BYTES = 1024
/** the key the Worker writes: `inbound/`, a version 4 UUID in lower case, `.eml` */
const KEY = /^inbound\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.eml$/
const MAILBOXES = new Set(['support', 'sales'])

const answer = (status: number, error?: string) => NextResponse.json(error ? { error } : { ok: true }, { status })

/** the key of a body that is one object with one own string `key` of the Worker's shape, else null; nothing else of the body is read */
function keyOf(text: string): string | null {
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return null
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
  const names = Object.keys(body)
  if (names.length !== 1 || names[0] !== 'key') return null
  const key: unknown = (body as { key: unknown }).key
  return typeof key === 'string' && KEY.test(key) ? key : null
}

async function removeRaw(key: string): Promise<void> {
  try {
    await deleteMailObjects([key])
  } catch {
    console.error('[inbound-email]', { outcome: 'raw_delete_failed' })
  }
}

function isWorker(request: Request, secret: string): boolean {
  const given = Buffer.from(request.headers.get('authorization') ?? '', 'utf8')
  const expected = Buffer.from(`Bearer ${secret}`, 'utf8')
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/** support@ or sales@ (an optional +tag) of the domain of CONTACT_SUPPORT_EMAIL or a subdomain of it */
function isOurMailbox(recipient: string): boolean {
  const support = (process.env.CONTACT_SUPPORT_EMAIL ?? '').trim().toLowerCase()
  const domain = support.slice(support.lastIndexOf('@') + 1)
  if (!isPlainEmail(support) || !isPlainEmail(recipient)) return false
  const at = recipient.lastIndexOf('@')
  const local = recipient.slice(0, at).split('+')[0]
  const recipientDomain = recipient.slice(at + 1)
  return MAILBOXES.has(local) && (recipientDomain === domain || recipientDomain.endsWith(`.${domain}`))
}

export async function POST(request: Request) {
  const secret = process.env.INBOUND_EMAIL_SECRET
  if (!secret) return answer(503, 'not_configured')
  if (!isWorker(request, secret)) return answer(401, 'unauthorized')

  const declared = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return answer(413, 'too_large')

  const recipient = (request.headers.get('x-envelope-to') ?? '').trim().toLowerCase()
  if (!isOurMailbox(recipient)) return answer(422, 'recipient')
  const envelopeFrom = (request.headers.get('x-envelope-from') ?? '').trim().toLowerCase()

  let key: string | null = null
  let raw: Uint8Array | null
  try {
    const body = await request.arrayBuffer()
    if (body.byteLength > MAX_BODY_BYTES) return answer(413, 'too_large')
    key = keyOf(new TextDecoder().decode(body))
    if (!key) return answer(422, 'key')
    raw = await getMailObject(key, MAX_MESSAGE_BYTES)
  } catch (error) {
    if (error instanceof R2TooLargeError && key) {
      await removeRaw(key)
      return answer(413, 'too_large')
    }
    console.error('[inbound-email]', { outcome: 'unexpected_error' })
    return answer(500, 'failed')
  }
  if (!raw) return answer(422, 'missing')

  try {
    const result = await processInboundEmail(raw, { from: envelopeFrom, to: recipient })
    return answer(result.status, result.status === 200 ? undefined : result.outcome)
  } catch {
    console.error('[inbound-email]', { outcome: 'unexpected_error' })
    return answer(500, 'failed')
  } finally {
    await removeRaw(key)
  }
}
