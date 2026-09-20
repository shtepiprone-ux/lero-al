/**
 * GET /api/cron/listing-activity
 *
 * Hourly job — recomputes the per-day listing activity aggregate (`listing_activity_daily`) for
 * YESTERDAY and TODAY in Europe/Tirane, absorbing late writes. Task 849 (Sprint 78, D78-4).
 *
 * Vercel calls cron paths with HTTP GET and sends `Authorization: Bearer ${CRON_SECRET}`. Delivery is
 * best effort and can duplicate or overlap, so the job is a RECOMPUTE, never an increment: the SQL
 * function takes a transaction-scoped advisory lock and rewrites the range from the raw tables.
 *
 * Schedule (owner action O78-1): `0 * * * *` needs the Vercel Pro plan. On Hobby an hourly expression
 * fails the deployment, so the only permitted fallback is `30 0 * * *`. `vercel.json` and
 * `ACTIVITY_REFRESH_CADENCE` (`@/modules/analytics/activity/types`, which sets the freshness threshold)
 * change together.
 *
 * Every run leaves a row in `listing_activity_refresh`, success or failure, so the dashboards can show
 * the last refresh time and a warning when the job lags.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/cron/verifyCronRequest'
import { tiraneDateOf, tiraneYesterday } from '@/lib/dashboard/period'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const JOB_VERSION = '849.1'
const ERROR_MAX_LENGTH = 500

export async function GET(request: NextRequest) {
  const auth = verifyCronRequest(request)
  if (!auth.ok) return auth.response

  const now = new Date()
  const from = tiraneYesterday(now)
  const to = tiraneDateOf(now)

  try {
    const db = createAdminClient()

    const { data, error } = await db.rpc('recompute_listing_activity', {
      p_from: from,
      p_to: to,
      p_job_version: JOB_VERSION,
    })

    if (error) {
      console.error('[cron/listing-activity] recompute failed', { from, to, error })
      const { error: logError } = await db.from('listing_activity_refresh').insert({
        from_date: from,
        to_date: to,
        status: 'failure',
        job_version: JOB_VERSION,
        error: String(error.message ?? '').slice(0, ERROR_MAX_LENGTH),
      })
      if (logError) console.error('[cron/listing-activity] failure row not stored', { logError })
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    const rowsWritten = typeof data === 'number' ? data : null
    const { error: logError } = await db.from('listing_activity_refresh').insert({
      from_date: from,
      to_date: to,
      status: 'success',
      rows_written: rowsWritten,
      job_version: JOB_VERSION,
    })
    if (logError) {
      // The aggregate is fresh but the dashboards would read it as stale — surface it, do not hide it.
      console.error('[cron/listing-activity] success row not stored', { from, to, logError })
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    return NextResponse.json({ ok: true, from, to, rowsWritten, jobVersion: JOB_VERSION })
  } catch (err) {
    console.error('[cron/listing-activity] unexpected failure', { from, to, err })
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
