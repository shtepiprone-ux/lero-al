/**
 * Shared auth check for /api/cron/* routes — Task 851 (Sprint 78).
 *
 * Vercel sends `Authorization: Bearer ${CRON_SECRET}` on every cron invocation.
 * Fails closed: an unset or empty CRON_SECRET refuses every call (401), so a
 * missing environment variable can never leave a job publicly triggerable.
 */

import { NextResponse } from 'next/server'

export type CronAuthResult = { ok: true } | { ok: false; response: NextResponse }

export function verifyCronRequest(request: Request): CronAuthResult {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return { ok: false, response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  }
  return { ok: true }
}
