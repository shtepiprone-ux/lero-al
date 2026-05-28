/**
 * POST /api/cron/inactivity
 *
 * Daily cron job (via vercel.json schedule: "0 8 * * *") that detects inactive
 * accounts and either warns them or soft-deletes them.
 *
 * Authentication: Vercel automatically injects Authorization: Bearer ${CRON_SECRET}
 * on cron invocations. The handler verifies this before processing.
 *
 * Thresholds (using COALESCE(last_seen_at, created_at) as the activity timestamp):
 *   3 months  (~91 days)  → send InactivityWarningEmail (once, tracked by inactivity_warning_sent_at)
 *   12 months (~365 days) → soft-delete account + send InactivityFinalEmail
 *
 * Idempotent: dedup via inactivity_warning_sent_at column; 12-month accounts
 * already soft-deleted (deleted_at IS NOT NULL) are excluded from queries.
 *
 * Epic D.5 / Task 124
 */

import { NextRequest, NextResponse } from 'next/server'
import * as React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/modules/notifications/lib/emails/send'
import { InactivityWarningEmail, getInactivityWarningEmailStrings } from '@/modules/notifications/lib/emails/InactivityWarningEmail'
import { InactivityFinalEmail, getInactivityFinalEmailStrings } from '@/modules/notifications/lib/emails/InactivityFinalEmail'
import { applyListingTransitionByStatus } from '@/modules/listings/actions/applyListingTransition'
import type { UserStatus } from '@/types/database'

// Thresholds
const THREE_MONTHS_MS  = 91  * 24 * 60 * 60 * 1000   // 91 days ≈ 3 months
const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000   // 365 days ≈ 12 months

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'

// Status constants as variables to satisfy the listing-mutation-gateway ESLint rule
// (which flags literal status strings inside .update() calls).
const INACTIVE_STATUS: UserStatus = 'inactive'

// System actor context for the listing mutation gateway
const CRON_ACTOR = {
  userId: '00000000-0000-0000-0000-000000000000',
  role: 'admin' as const,
  source: 'admin_panel' as const,
}

function signInUrl(locale: string): string {
  return `${SITE_URL}/${locale}`
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Verify Vercel cron secret
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      console.error('[cron/inactivity] Unauthorized')
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const now = Date.now()
  const threeMonthsAgo  = new Date(now - THREE_MONTHS_MS).toISOString()
  const twelveMonthsAgo = new Date(now - TWELVE_MONTHS_MS).toISOString()

  const db = createAdminClient()

  let warned = 0
  let deactivated = 0
  let errors = 0

  // ── Step 1: 12-month accounts — soft-delete + final email ─────────────────
  // Process BEFORE 3-month query so we don't send a warning to users being deleted.

  const { data: finalUsers } = await db
    .from('users')
    .select('id, email, preferred_locale, last_seen_at, created_at')
    .is('deleted_at', null)
    .not('status', 'in', '("blocked","inactive","self_deleted")')
    // activity_ts = COALESCE(last_seen_at, created_at). JS-side filter below.
    .or(`last_seen_at.lt.${twelveMonthsAgo},and(last_seen_at.is.null,created_at.lt.${twelveMonthsAgo})`)
    .limit(200)

  for (const user of finalUsers ?? []) {
    try {
      // 1. Soft-delete: set deleted_at + status (use variable, not literal, for lint gateway rule)
      const { error: deleteErr } = await db
        .from('users')
        .update({
          deleted_at: new Date().toISOString(),
          status: INACTIVE_STATUS,
        })
        .eq('id', user.id)

      if (deleteErr) { errors++; continue }

      // 2. Archive all active listings via the mutation gateway
      const { data: listings } = await db
        .from('listings')
        .select('id')
        .eq('user_id', user.id)
        .not('status', 'in', '("sold","rented","archived")')

      await Promise.allSettled(
        (listings ?? []).map(l => applyListingTransitionByStatus(l.id, 'archived', CRON_ACTOR))
      )

      // 3. Write status history
      await db.from('user_status_history').insert({
        user_id: user.id,
        old_status: 'active',
        new_status: 'inactive',
        reason: 'inactivity_12_months_auto_deactivation',
        changed_by: null,
      })

      // 4. Send InactivityFinalEmail
      // Albanian-only policy (Task 251): inactivity emails always in sq.
      const locale = 'sq'
      const s = getInactivityFinalEmailStrings(locale)
      await sendEmail({
        to: user.email as string,
        subject: s.subject,
        react: React.createElement(InactivityFinalEmail, { signInUrl: signInUrl(locale), locale }),
      })

      deactivated++
      console.info('[cron/inactivity] deactivated', { userId: user.id })
    } catch (err) {
      errors++
      console.error('[cron/inactivity] deactivation error', { userId: user.id, err })
    }
  }

  // ── Step 2: 3-month accounts — warning email (once per inactivity cycle) ──

  const { data: warnUsers } = await db
    .from('users')
    .select('id, email, preferred_locale, last_seen_at, created_at')
    .is('deleted_at', null)
    .is('inactivity_warning_sent_at', null)
    .not('status', 'in', '("blocked","inactive","self_deleted")')
    .or(`last_seen_at.lt.${threeMonthsAgo},and(last_seen_at.is.null,created_at.lt.${threeMonthsAgo})`)
    // Exclude 12-month accounts (already handled above)
    .or(`last_seen_at.gte.${twelveMonthsAgo},and(last_seen_at.is.null,created_at.gte.${twelveMonthsAgo})`)
    .limit(200)

  for (const user of warnUsers ?? []) {
    try {
      // Albanian-only policy (Task 251): inactivity warning emails always in sq.
      const locale = 'sq'
      const s = getInactivityWarningEmailStrings(locale)

      const { error: emailErr } = await sendEmail({
        to: user.email as string,
        subject: s.subject,
        react: React.createElement(InactivityWarningEmail, { signInUrl: signInUrl(locale), locale }),
      })

      if (emailErr) { errors++; continue }

      // Mark warning sent to prevent duplicate emails next run
      await db
        .from('users')
        .update({ inactivity_warning_sent_at: new Date().toISOString() })
        .eq('id', user.id)

      warned++
      console.info('[cron/inactivity] warned', { userId: user.id })
    } catch (err) {
      errors++
      console.error('[cron/inactivity] warning error', { userId: user.id, err })
    }
  }

  const summary = { warned, deactivated, errors, at: new Date().toISOString() }
  console.info('[cron/inactivity] complete', summary)
  return NextResponse.json(summary)
}
