/**
 * Shared auth check for /api/cron/* routes — Task 851 (Sprint 78).
 *
 * Vercel sends `Authorization: Bearer ${CRON_SECRET}` on every cron invocation.
 * Fails closed: an unset or empty CRON_SECRET refuses every call (401), so a
 * missing environment variable can never leave a job publicly triggerable.
 */

import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

export type CronAuthResult = { ok: true } | { ok: false; response: NextResponse }

export function verifyCronRequest(request: Request): CronAuthResult {
  const cronSecret = process.env.CRON_SECRET
  // constant-time comparison (Task 923 Revision 7, S18): a plain `!==` leaks how many leading characters were right
  const given = Buffer.from(request.headers.get('authorization') ?? '', 'utf8')
  const expected = Buffer.from(`Bearer ${cronSecret ?? ''}`, 'utf8')
  const same = given.length === expected.length && timingSafeEqual(given, expected)
  if (!cronSecret || !same) {
    return { ok: false, response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  }
  return { ok: true }
}
