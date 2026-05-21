'use server'

/**
 * Security logging for password recovery events.
 *
 * Uses structured server-side console logging (flows to Vercel logs / Sentry).
 * No email is logged on recovery requests to prevent email enumeration.
 * No DB table required — log aggregation is the responsibility of the
 * observability layer (Vercel / Sentry).
 */

export async function logPasswordRecoveryRequest(): Promise<void> {
  console.info('[security:recovery-request]', {
    timestamp: new Date().toISOString(),
  })
}

export async function logPasswordRecoveryCompletion(userId: string): Promise<void> {
  console.info('[security:recovery-complete]', {
    userId,
    timestamp: new Date().toISOString(),
  })
}
