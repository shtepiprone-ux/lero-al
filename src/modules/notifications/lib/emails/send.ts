/**
 * Canonical email send helper — the single place that instantiates Resend.
 *
 * All email sends in the project must go through sendEmail(). No other file
 * should call `new Resend(...)`.
 *
 * - Accepts a React Email component (rendered to HTML via @react-email/render)
 *   or a pre-built HTML string (for backward-compat with plain-HTML templates).
 * - Graceful no-key fallback: when RESEND_API_KEY is absent (local dev without
 *   key), logs and returns silently instead of throwing.
 * - Returns a typed result object; never throws.
 */
import { Resend } from 'resend'
import { render } from '@react-email/components'
import type * as React from 'react'

export const FROM_ADDRESS = 'Lero.al <noreply@lero.al>'

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
    if (process.env.NODE_ENV === 'development') {
      console.info('[email] RESEND_API_KEY not set — skipping.', {
        to: params.to,
        subject: params.subject,
      })
    }
    return {}
  }

  if (!params.react && !params.html) {
    console.error('[email] sendEmail: neither react nor html provided', { to: params.to })
    return { error: 'missing_content' }
  }

  const html = params.react
    ? await render(params.react)
    : params.html!

  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from: params.from ?? FROM_ADDRESS,
    to: params.to,
    subject: params.subject,
    html,
    ...(params.replyTo ? { replyTo: params.replyTo } : {}),
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
