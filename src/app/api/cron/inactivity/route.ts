/**
 * POST /api/cron/inactivity
 *
 * Daily cron job (via vercel.json schedule: "0 8 * * *") that detects inactive
 * accounts and reminds them.
 *
 * Authentication: Vercel automatically injects Authorization: Bearer ${CRON_SECRET}
 * on cron invocations. The handler verifies this before processing.
 *
 * Thresholds (using COALESCE(last_seen_at, created_at) as the activity timestamp):
 *   3 months  (~91 days)  → send InactivityWarningEmail ONCE PER ABSENCE (tracked by inactivity_warning_sent_at, which the presence ping clears when the person
 *                           comes back, so a later absence is reminded again)
 *   12 months (~365 days) → NOTHING YET (Task 923 R77 (c), owner decisions D56 / D58): the job only COUNTS the accounts it would deactivate, until the
 *                           account lifecycle task ships. It writes no account, archives no listing and sends no final e-mail.
 *
 * `?dryRun=1` (with the cron secret, like every other call) changes nothing at all: no mark, no e-mail; the answer carries counts and ids.
 * A failed read stops the job with HTTP 500: it used to take the data of a read without its error, so a failed read looked like "nobody to process".
 *
 * Epic D.5 / Task 124; Task 923 R77 (a) (b) (c)
 */

import { NextRequest, NextResponse } from 'next/server'
import * as React from 'react'
import { verifyCronRequest } from '@/lib/cron/verifyCronRequest'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/modules/notifications/lib/emails/send'
import { InactivityWarningEmail, getInactivityWarningEmailStrings } from '@/modules/notifications/lib/emails/InactivityWarningEmail'

// Thresholds
const THREE_MONTHS_MS  = 91  * 24 * 60 * 60 * 1000   // 91 days ≈ 3 months
const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000   // 365 days ≈ 12 months

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'

// Accounts that are already without access are left out: blocked and inactive (deactivated). There is no `self_deleted` status in the table (a person's own deletion
// removes the profile row), so the old filter named a status that does not exist.
const EXCLUDED_STATUSES = '("blocked","inactive")'

function signInUrl(locale: string): string {
  return `${SITE_URL}/${locale}`
}

// ── Handler ───────────────────────────────────────────────────────────────────

async function handle(request: NextRequest) {
  const auth = verifyCronRequest(request)
  if (!auth.ok) return auth.response

  const dryRun = ['1', 'true'].includes(request.nextUrl.searchParams.get('dryRun') ?? '')
  const now = Date.now()
  const threeMonthsAgo  = new Date(now - THREE_MONTHS_MS).toISOString()
  const twelveMonthsAgo = new Date(now - TWELVE_MONTHS_MS).toISOString()

  const db = createAdminClient()

  let reminded = 0
  let errors = 0
  const wouldRemind: string[] = []

  // ── Step 1: 12-month accounts — COUNT ONLY (R77 (c)) ──────────────────────
  // Nothing is written and nothing is sent for them until the account lifecycle task ships.

  const { data: finalUsers, error: finalError } = await db
    .from('users')
    .select('id')
    .is('deleted_at', null)
    .not('status', 'in', EXCLUDED_STATUSES)
    // activity_ts = COALESCE(last_seen_at, created_at)
    .or(`last_seen_at.lt.${twelveMonthsAgo},and(last_seen_at.is.null,created_at.lt.${twelveMonthsAgo})`)
    .limit(1000)

  if (finalError) {
    console.error('[cron/inactivity] 12-month read failed', { code: finalError.code })
    return NextResponse.json({ error: 'read_failed', step: '12_months', at: new Date().toISOString() }, { status: 500 })
  }
  const wouldDeactivate = (finalUsers ?? []).map((u) => u.id as string)

  // ── Step 2: 3-month accounts — one reminder per absence ───────────────────

  const { data: warnUsers, error: warnError } = await db
    .from('users')
    .select('id')
    .is('deleted_at', null)
    .is('inactivity_warning_sent_at', null)
    .not('status', 'in', EXCLUDED_STATUSES)
    .or(`last_seen_at.lt.${threeMonthsAgo},and(last_seen_at.is.null,created_at.lt.${threeMonthsAgo})`)
    // Exclude 12-month accounts (counted above)
    .or(`last_seen_at.gte.${twelveMonthsAgo},and(last_seen_at.is.null,created_at.gte.${twelveMonthsAgo})`)
    .limit(200)

  if (warnError) {
    console.error('[cron/inactivity] 3-month read failed', { code: warnError.code })
    return NextResponse.json({ error: 'read_failed', step: '3_months', at: new Date().toISOString() }, { status: 500 })
  }

  for (const user of warnUsers ?? []) {
    try {
      if (dryRun) { wouldRemind.push(user.id as string); continue }

      // The address comes from Auth through the service role: `public.users` has no e-mail column (the job used to select one that does not exist, and the read of
      // it was never checked). A failed read stops the job.
      const { data: authData, error: authError } = await db.auth.admin.getUserById(user.id as string)
      if (authError) {
        console.error('[cron/inactivity] Auth read failed', { userId: user.id, code: authError.code })
        return NextResponse.json({ error: 'read_failed', step: 'auth', reminded, at: new Date().toISOString() }, { status: 500 })
      }
      const email = authData?.user?.email
      if (!email) { errors++; continue }

      // Albanian-only policy (Task 251): inactivity warning emails always in sq.
      const locale = 'sq'
      const s = getInactivityWarningEmailStrings(locale)

      const { error: emailErr } = await sendEmail({
        to: email,
        subject: s.subject,
        react: React.createElement(InactivityWarningEmail, { signInUrl: signInUrl(locale), locale }),
      })

      if (emailErr) { errors++; continue }

      // Mark the reminder sent: the only write of the job. The mark is cleared by the presence ping when the person comes back, so the NEXT absence is reminded again.
      const { error: markError } = await db
        .from('users')
        .update({ inactivity_warning_sent_at: new Date().toISOString() })
        .eq('id', user.id)
      if (markError) {
        // the reminder went out but is not marked: it would be sent again tomorrow. Logged with the id.
        errors++
        console.error('[cron/inactivity] reminder sent but the mark failed', { userId: user.id, code: markError.code })
        continue
      }

      reminded++
      console.info('[cron/inactivity] reminded', { userId: user.id })
    } catch (err) {
      errors++
      console.error('[cron/inactivity] reminder error', { userId: user.id, err })
    }
  }

  const summary = {
    dryRun,
    reminded,
    ...(dryRun ? { wouldRemind: wouldRemind.length, wouldRemindIds: wouldRemind } : {}),
    wouldDeactivate: wouldDeactivate.length,
    ...(dryRun ? { wouldDeactivateIds: wouldDeactivate } : {}),
    // paused: nothing is deactivated until the account lifecycle task ships (R77 (c))
    deactivated: 0,
    errors,
    at: new Date().toISOString(),
  }
  console.info('[cron/inactivity] complete', { ...summary, wouldRemindIds: undefined, wouldDeactivateIds: undefined })
  return NextResponse.json(summary)
}

export const GET = handle
export const POST = handle
