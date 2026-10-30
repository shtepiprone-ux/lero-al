'use server'

/**
 * Security logging for password recovery events — Task 157 / Epic D.4 follow-up.
 *
 * Sink: structured server-side console → Vercel log drain / Sentry.
 * No DB table: log aggregation is the responsibility of the observability layer.
 *
 * PII rules (docs/rls-rules.md):
 * - Raw email is NEVER logged (prevents email enumeration / correlation attacks).
 * - Email is hashed (SHA-256 + LOG_CORRELATION_SALT) to produce a stable `correlationId`
 *   that links request → completion logs without exposing the address.
 * - IP addresses are logged for forensics; treated as pseudonymous PII.
 * - User-agent is truncated to 200 chars to prevent log injection.
 *
 * Supabase rate limit: built-in recovery email rate limit applies (Dashboard → Auth →
 * Rate Limits; default ≈ 3/hour per user). No additional app-level rate limiting needed.
 */

import { createHash } from 'crypto'
import { cookies, headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { requireViewer } from '@/lib/auth/requireViewer'
import { sendPasswordChangedEmail } from '@/modules/notifications/lib/emails/passwordChanged'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * One-way hash of the email for log correlation.
 * 16-char hex prefix: sufficient for correlation, insufficient for reversal.
 * Salt via LOG_CORRELATION_SALT env var (see docs/env.md).
 */
function hashEmailForCorrelation(email: string): string {
  const salt = process.env.LOG_CORRELATION_SALT ?? 'lero-al'
  return createHash('sha256')
    .update(`${salt}:${email.toLowerCase().trim()}`)
    .digest('hex')
    .slice(0, 16)
}

/** A header value as one log field: control characters (a line break forges a log line) become spaces, and it is cut to `max`. */
function logField(value: string, max: number): string {
  // eslint-disable-next-line no-control-regex -- the point is to remove every control character
  return value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max)
}

/**
 * The id of the current session when it is a RECOVERY session, else null (Task 923 R70 (d)): the session's authentication methods (`amr` of the verified token claims)
 * hold `recovery` or `otp` with a timestamp less than 10 minutes old. A person who signed in with a password, or whose recovery is older, has not just reset
 * a password through this flow, so the "password changed" notice must not go out for them.
 */
const RECOVERY_WINDOW_SECONDS = 10 * 60
async function currentRecoverySessionId(): Promise<string | null> {
  try {
    const { data, error } = await (await createClient()).auth.getClaims()
    if (error || !data?.claims) return null
    const claims = data.claims as { session_id?: unknown; amr?: unknown }
    if (typeof claims.session_id !== 'string' || !claims.session_id || !Array.isArray(claims.amr)) return null
    const now = Date.now() / 1000
    const fresh = (claims.amr as Array<{ method?: unknown; timestamp?: unknown }>).some(
      (entry) => (entry?.method === 'recovery' || entry?.method === 'otp') && typeof entry.timestamp === 'number' && now - entry.timestamp >= 0 && now - entry.timestamp < RECOVERY_WINDOW_SECONDS,
    )
    return fresh ? claims.session_id : null
  } catch {
    return null
  }
}

/** the browser that already received the notice for this session carries its id (no table holds it: one notice per session and browser) */
const NOTICE_COOKIE = 'pw-notice-session'

async function getRequestMeta() {
  const h = await headers()
  const ip = logField(
    h.get('x-forwarded-for')?.split(',')[0].trim() ??
    h.get('x-real-ip') ??
    'unknown',
    64,
  )
  const ua = logField(h.get('user-agent') ?? 'unknown', 200)
  return { ip, ua }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Log a password-recovery request.
 * Only a one-way hash of the email is logged — neutral response is preserved.
 */
export async function logPasswordRecoveryRequest(email: string): Promise<void> {
  const { ip, ua } = await getRequestMeta()
  const correlationId = hashEmailForCorrelation(email)
  console.info('[security:recovery-request]', {
    correlationId,
    ip,
    ua,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Log a successful password-recovery completion and send the "password changed" e-mail.
 * correlationId is derived from the same email hash as the request, linking both events.
 *
 * Security (Task 923 Revision 7, finding S2): a Server Action is callable by anyone with any arguments. This one used to take `userId` and `email` from its
 * caller, so it was an e-mail relay: it mailed "your password was changed" to any address, with the name of any user. It now takes NO arguments and acts only for
 * the signed-in person (the recovery session is active when the page calls it): the address and the id come from the session.
 */
export async function logPasswordRecoveryCompletion(): Promise<void> {
  const user = await getUser()
  const email = user?.email
  if (!user || !email) return
  // Task 923 R44: the "password changed" notice goes only to a person whose account has access (a blocked or deleted account sends nothing).
  if (!(await requireViewer()).ok) return

  // Task 923 R70 (d): only a recovery session, and only once per session. Any other signed-in person calling this (a Server Action is a public endpoint) gets nothing.
  const sessionId = await currentRecoverySessionId()
  if (!sessionId) return
  const jar = await cookies()
  if (jar.get(NOTICE_COOKIE)?.value === sessionId) return

  const { ip, ua } = await getRequestMeta()
  const correlationId = hashEmailForCorrelation(email)
  console.info('[security:recovery-complete]', {
    correlationId,
    userId: user.id,
    ip,
    ua,
    timestamp: new Date().toISOString(),
  })

  // Password-changed notification email (Task 276), sent AFTER the response (Task 923 R71 (d)): an e-mail nobody awaits can be dropped in serverless code when the
  // response ends, `after()` keeps the function alive until it is sent. Outside a request there is no response to wait for and `after()` throws: it then starts
  // at once. Resolves display name for personalised greeting; falls back to null.
  try {
    const db = createAdminClient()
    const { data: profile } = await db.from('users').select('name').eq('id', user.id).single()
    // the session is marked BEFORE the send: a second call of the same session cannot send a second notice, even while the first is still in flight
    jar.set(NOTICE_COOKIE, sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 })
    const send = () => sendPasswordChangedEmail({ to: email, name: profile?.name ?? null })
    // `next/server` is loaded when the work is scheduled, not when this module is: Storybook bundles this module with every component that imports it and cannot run `next/server` in the browser (its import failed the AuthSheet, SaveSearchButton and listing Stories with `__dirname is not defined`).
    try { (await import('next/server')).after(send) } catch { await send() }
  } catch {
    // Best-effort — the password change has already completed.
  }
}
