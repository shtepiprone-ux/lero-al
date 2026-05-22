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
import { headers } from 'next/headers'

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

async function getRequestMeta() {
  const h = await headers()
  const ip =
    h.get('x-forwarded-for')?.split(',')[0].trim() ??
    h.get('x-real-ip') ??
    'unknown'
  const ua = (h.get('user-agent') ?? 'unknown').slice(0, 200)
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
 * Log a successful password-recovery completion.
 * correlationId is derived from the same email hash as the request, linking both events.
 */
export async function logPasswordRecoveryCompletion(
  userId: string,
  email: string,
): Promise<void> {
  const { ip, ua } = await getRequestMeta()
  const correlationId = hashEmailForCorrelation(email)
  console.info('[security:recovery-complete]', {
    correlationId,
    userId,
    ip,
    ua,
    timestamp: new Date().toISOString(),
  })
}
