/**
 * POST /api/cron/listings-expiry
 *
 * Recurring cron job — counts the active listings whose `expires_at` has lapsed.
 *
 * PAUSED (Task 923 R77 (d), owner decisions D56 / D58): the job CHANGES NO LISTING. It only counts (and returns the ids of) the listings it would expire, until the
 * listing lifecycle task ships. A published listing stays active for 30 days today and the owner is told nothing when it ends (`C675`–`C677`); an expiry that hides a
 * listing silently must not run before that is decided. The statuses it used to write are written, when the task ships, through the transition gateway (EXPIRE
 * action), not around it.
 *
 * Does NOT count NULL-expiry rows as lapsed (owner decision #3: no silent scheduled
 * mutation of broken lifecycle data). NULL rows are resolved by the one-time
 * backfill (Part E / Task 455), not by this recurring sweep.
 *
 * Authentication: Vercel injects Authorization: Bearer ${CRON_SECRET}.
 * A failed read stops the job with HTTP 500.
 *
 * Epic LV / Task 455 (LV.2); Task 923 R77 (d)
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/cron/verifyCronRequest'
import { createAdminClient } from '@/lib/supabase/admin'

async function handle(request: NextRequest) {
  const auth = verifyCronRequest(request)
  if (!auth.ok) return auth.response

  const db = createAdminClient()
  const now = new Date().toISOString()

  const { data: lapsed, error: lapsedError } = await db
    .from('listings')
    .select('id')
    .eq('status', 'active')
    .lt('expires_at', now)
    .limit(1000)
  if (lapsedError) {
    console.error('[cron/listings-expiry] read failed', { code: lapsedError.code })
    return NextResponse.json({ error: 'read_failed', at: now }, { status: 500 })
  }

  const { count: nullExpiryCount, error: nullError } = await db
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .is('expires_at', null)
  if (nullError) {
    console.error('[cron/listings-expiry] null-expiry count failed', { code: nullError.code })
    return NextResponse.json({ error: 'read_failed', at: now }, { status: 500 })
  }

  const summary = {
    // nothing is expired while the job is paused (R77 (d))
    expired: 0,
    would_expire: (lapsed ?? []).length,
    would_expire_ids: (lapsed ?? []).map((l) => l.id as string),
    errors: 0,
    null_expiry_active: nullExpiryCount ?? 0,
    null_expiry_note: 'NULL-expiry active rows are NOT counted as lapsed by this sweep (owner decision #3)',
    at: now,
  }

  console.info('[cron/listings-expiry] complete (counts only)', { ...summary, would_expire_ids: undefined })
  return NextResponse.json(summary)
}

export const GET = handle
export const POST = handle
