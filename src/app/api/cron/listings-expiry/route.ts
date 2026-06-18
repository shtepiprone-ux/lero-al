/**
 * POST /api/cron/listings-expiry
 *
 * Recurring cron job — expires active listings whose `expires_at` has lapsed.
 * Drives status change through the transition engine (EXPIRE action).
 *
 * Does NOT auto-expire NULL-expiry rows (owner decision #3: no silent scheduled
 * mutation of broken lifecycle data). NULL rows are resolved by the one-time
 * backfill (Part E / Task 455), not by this recurring sweep.
 *
 * Authentication: Vercel injects Authorization: Bearer ${CRON_SECRET}.
 * Idempotent: safe to run repeatedly; already-expired rows are not re-processed.
 *
 * Epic LV / Task 455 (LV.2)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveTransition } from '@/modules/listings/domain/listingTransitionEngine'

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const db = createAdminClient()
  const now = new Date().toISOString()

  const transition = resolveTransition('active', 'EXPIRE')
  if (!transition.ok) {
    return NextResponse.json({ error: 'engine_misconfiguration' }, { status: 500 })
  }

  const { data: lapsed } = await db
    .from('listings')
    .select('id')
    .eq('status', 'active')
    .lt('expires_at', now)

  const { count: nullExpiryCount } = await db
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .is('expires_at', null)

  let expired = 0
  let errors = 0

  for (const listing of lapsed ?? []) {
    const { error } = await db
      .from('listings')
      .update({ status: transition.nextStatus, updated_at: now })
      .eq('id', listing.id)
      .eq('status', 'active')

    if (error) {
      errors++
      console.error('[cron/listings-expiry] update failed', { listingId: listing.id, error })
    } else {
      expired++
    }
  }

  const summary = {
    expired,
    errors,
    null_expiry_active: nullExpiryCount ?? 0,
    null_expiry_note: 'NULL-expiry active rows are NOT auto-expired by this sweep (owner decision #3)',
    at: now,
  }

  console.info('[cron/listings-expiry] complete', summary)
  return NextResponse.json(summary)
}
