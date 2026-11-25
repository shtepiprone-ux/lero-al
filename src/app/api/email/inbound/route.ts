/**
 * POST /api/email/inbound (Task 1044): the one door of received mail. The Cloudflare Email Worker `cloudflare/email-inbound/worker.js` posts each message sent to
 * support@ or sales@ here as raw MIME, with the shared secret and the envelope addresses; the route answers 200 only after the message is stored or dropped on
 * purpose, and the Worker rejects the mail on any other answer, so the sender is told it was not delivered.
 *
 * Checks, cheapest first and before the body is read: no INBOUND_EMAIL_SECRET configured → 503 (fail closed); a missing or wrong `Authorization: Bearer` →
 * 401 (constant-time comparison); a declared body above 4 MB → 413; a recipient (`x-envelope-to`) that is not support@ or sales@ (an optional +tag allowed) of the
 * domain of CONTACT_SUPPORT_EMAIL or a subdomain of it → 422. Then the body is read once (above 4 MB → 413) and `processInboundEmail` decides. Nothing about the
 * message is logged here; an unexpected error answers 500 without its text.
 */
import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { isPlainEmail } from '@/lib/security/inputs'
import { processInboundEmail } from '@/modules/contacts/lib/inboundEmail'

/** the raw MIME limit (owner, 2026-11-25: "the raw MIME message limited to 4 MB"; a Vercel Function body is at most 4.5 MB) */
const MAX_MESSAGE_BYTES = 4_194_304
const MAILBOXES = new Set(['support', 'sales'])

const answer = (status: number, error?: string) => NextResponse.json(error ? { error } : { ok: true }, { status })

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
  if (Number.isFinite(declared) && declared > MAX_MESSAGE_BYTES) return answer(413, 'too_large')

  const recipient = (request.headers.get('x-envelope-to') ?? '').trim().toLowerCase()
  if (!isOurMailbox(recipient)) return answer(422, 'recipient')
  const envelopeFrom = (request.headers.get('x-envelope-from') ?? '').trim().toLowerCase()

  try {
    const raw = await request.arrayBuffer()
    if (raw.byteLength > MAX_MESSAGE_BYTES) return answer(413, 'too_large')
    const result = await processInboundEmail(raw, { from: envelopeFrom, to: recipient })
    return answer(result.status, result.status === 200 ? undefined : result.outcome)
  } catch {
    console.error('[inbound-email]', { outcome: 'unexpected_error' })
    return answer(500, 'failed')
  }
}
