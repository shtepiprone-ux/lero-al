/**
 * Canonical email send helper — the single place that instantiates Resend.
 *
 * All email sends in the project must go through sendEmail(). No other file
 * should call `new Resend(...)`.
 *
 * - Accepts a React Email component (rendered to HTML via @react-email/render)
 *   or a pre-built HTML string (for backward-compat with plain-HTML templates).
 * - No-key fallback: when RESEND_API_KEY is absent, local development logs and
 *   returns `{}` (skipped); any other environment returns `{ error: 'send_failed' }`
 *   so a delivery that cannot happen is never reported as sent. Never throws.
 * - Returns a typed result object; never throws.
 */
import { Resend } from 'resend'
import { render } from '@react-email/render'
import type * as React from 'react'

export const FROM_ADDRESS = 'Lero.al <noreply@lero.al>'

/** one address, no whitespace, list separators, angle brackets, quotes or backslashes, and exactly one "@" (neither half may hold one, so the match stays linear) */
const SINGLE_ADDRESS = /^[^\s,;<>"()\\@]+@[^\s,;<>"()\\@]+$/
/** the longest address (RFC 5321 path limit); a longer value is refused before any pattern runs (Task 951 AC4) */
const MAX_ADDRESS_LENGTH = 254
const isSingleAddress = (value: string): boolean => value.length <= MAX_ADDRESS_LENGTH && SINGLE_ADDRESS.test(value)
/** a header value on one line: any line or paragraph break becomes a space */
const oneLine = (value: string) => value.replace(/[\r\n\u2028\u2029]+/g, ' ').trim()

/**
 * One message id `<local@domain>` (Task 1044 AC11): no whitespace or angle bracket anywhere and no "@" in the local part, each half at most 128 characters, so the
 * match stays linear. The threading headers carry ids stored from received mail and from Resend: a value of 1-20 such tokens separated by one space, nothing else,
 * so a stored id can never add a header or a recipient.
 */
const MESSAGE_ID_TOKEN = '<[^<>\\s@]{1,128}@[^<>\\s]{1,128}>'
const MESSAGE_ID = new RegExp(`^${MESSAGE_ID_TOKEN}$`)
const MESSAGE_ID_LIST = new RegExp(`^${MESSAGE_ID_TOKEN}(?: ${MESSAGE_ID_TOKEN}){0,19}$`)
/** the longest list of 20 tokens of 259 characters and 19 spaces; a longer value is refused before any pattern runs */
const MAX_MESSAGE_ID_LIST_LENGTH = 20 * 259 + 19
export const isMessageId = (value: unknown): value is string => typeof value === 'string' && value.length <= 259 && MESSAGE_ID.test(value)
const isMessageIdList = (value: string): boolean => value.length <= MAX_MESSAGE_ID_LIST_LENGTH && MESSAGE_ID_LIST.test(value)

export interface ThreadingHeaders {
  'In-Reply-To'?: string
  References?: string
}

interface SendEmailParams {
  to: string
  subject: string
  /** React Email component — rendered to HTML automatically. */
  react?: React.ReactElement
  /** Pre-built HTML string — used when the template is hand-crafted (e.g. emailChange.ts). */
  html?: string
  /** Reply-To address — set when the intended reply target differs from the sender. */
  replyTo?: string
  /**
   * Override the From address. Must be a verified sender in Resend.
   * Defaults to FROM_ADDRESS (noreply@lero.al).
   */
  from?: string
  /** Task 1044: the threading headers of a staff reply; passed to Resend only when given, each value checked as message-id tokens. */
  headers?: ThreadingHeaders
}

export type SendEmailErrorCode =
  | 'missing_content'
  | 'unverified_sender'
  | 'transient'
  | 'send_failed'

export interface SendEmailResult {
  id?: string
  error?: SendEmailErrorCode
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // Local development without a key skips the send quietly. Anywhere else a missing key means NO e-mail leaves, and the caller must be told
    // (Task 923 R66 (h)): `{}` used to read as "sent", so the Auth e-mail hook acknowledged mails that were never delivered.
    if (process.env.NODE_ENV === 'development') {
      console.info('[email] RESEND_API_KEY not set — skipping.', {
        to: params.to,
        subject: params.subject,
      })
      return {}
    }
    console.error('[email] RESEND_API_KEY is not set: the e-mail was not sent', { subject: params.subject })
    return { error: 'send_failed' }
  }

  if (!params.react && !params.html) {
    console.error('[email] sendEmail: neither react nor html provided', { to: params.to })
    return { error: 'missing_content' }
  }

  // Header-injection and fan-out guard (Task 923 Revision 7, finding S34): `to` and `replyTo` are exactly one plain address, `from` and the subject are one line.
  // The subject carries text a stranger wrote (the contact topic, a listing title); a line break in it, or "a@x.com, b@y.com" in an address, must not reach the mail provider.
  if (!isSingleAddress(params.to) || (params.replyTo && !isSingleAddress(params.replyTo)) || (params.from && /[\r\n]/.test(params.from))) {
    console.error('[email] sendEmail: refused an unsafe address', { subject: params.subject })
    return { error: 'send_failed' }
  }

  // Header-injection guard of the threading headers (Task 1044 AC11): a value that is not 1-20 message-id tokens refuses the whole send.
  const headers: Record<string, string> = {}
  for (const name of ['In-Reply-To', 'References'] as const) {
    const value = params.headers?.[name]
    if (value === undefined) continue
    if (typeof value !== 'string' || !isMessageIdList(value)) {
      console.error('[email] sendEmail: refused an unsafe threading header', { header: name })
      return { error: 'send_failed' }
    }
    headers[name] = value
  }

  const html = params.react
    ? await render(params.react)
    : params.html!

  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from: params.from ?? FROM_ADDRESS,
    to: params.to,
    subject: oneLine(params.subject),
    html,
    ...(params.replyTo ? { replyTo: params.replyTo } : {}),
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
  })

  if (error) {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 0
    const message = ((error as { message?: string }).message ?? '').toLowerCase()
    let code: SendEmailErrorCode
    if (
      statusCode === 403 ||
      message.includes('not verified') ||
      message.includes('not allowed') ||
      (message.includes('sender') && message.includes('verif')) ||
      message.includes('domain is not verified')
    ) {
      code = 'unverified_sender'
    } else if (statusCode >= 500 || statusCode === 429) {
      code = 'transient'
    } else {
      code = 'send_failed'
    }
    console.error('[email] Failed to send', { error, to: params.to, subject: params.subject, statusCode })
    return { error: code }
  }

  return { id: data?.id }
}

/**
 * The `Message-ID` Resend gave a sent mail (Task 1044 AC11), read with `GET /emails/{id}`: a staff reply stores it so the customer's answer, which names it in
 * In-Reply-To, can join its inquiry. Only a value that is one message-id token is returned; anything else, a missing key or id, or a failed read is `null`. Never throws.
 */
export async function getSentMessageId(id: string): Promise<string | null> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !id) return null
  try {
    const { data, error } = await new Resend(apiKey).emails.get(id)
    if (error || !data) {
      console.error('[email] the message id of a sent mail was not read')
      return null
    }
    // the response of `GET /emails/{id}` carries `message_id` (Resend changelog 2026-07-08); resend@6.12.3 does not declare it
    const value = (data as { message_id?: unknown }).message_id
    return isMessageId(value) ? value : null
  } catch {
    console.error('[email] the message id of a sent mail was not read')
    return null
  }
}
