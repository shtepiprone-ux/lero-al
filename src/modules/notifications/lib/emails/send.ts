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
}

interface SendEmailResult {
  id?: string
  error?: string
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
    from: FROM_ADDRESS,
    to: params.to,
    subject: params.subject,
    html,
  })

  if (error) {
    console.error('[email] Failed to send', { error, to: params.to, subject: params.subject })
    return { error: 'send_failed' }
  }

  return { id: data?.id }
}
