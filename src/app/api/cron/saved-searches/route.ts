/**
 * POST /api/cron/saved-searches
 *
 * Daily cron job (vercel.json schedule: "0 9 * * *") — detects new listings
 * matching saved searches and notifies users via email + in-app notification.
 *
 * Authentication: Vercel injects Authorization: Bearer ${CRON_SECRET}.
 *
 * Flow per saved search with notify_email = true:
 *   1. Check frequency gate (instant = always; daily = 23h; weekly = 6.5d)
 *   2. Query listings created after last_checked_at matching the saved filters
 *   3. On new matches: send admin-editable 'saved_search_alert' email + in-app notification
 *   4. Advance last_checked_at (and accumulate new_count) only once the alert was sent, or when there was nothing to send
 *
 * Paged by id with a time budget (Task 923 R67 (d)); a search that was not handled keeps its boundary and is picked up by the next run.
 *
 * Idempotent: last_checked_at serves as the dedup boundary — no listing is
 * notified twice as long as last_checked_at advances past its created_at.
 *
 * Epic E.4 / Task 132
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/cron/verifyCronRequest'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTemplatedEmail } from '@/modules/notifications/lib/sendTemplatedEmail'
import { createNotification } from '@/modules/notifications/lib/createNotification'
import { applyListingFilters, parseSearchParams } from '@/modules/listings/domain/filterEngine'
import {
  canonicalToSearchParams,
  type CanonicalFilters,
} from '@/modules/listings/lib/savedSearchCanonicalize'
import { applyPublicVisibility } from '@/modules/listings/lib/visibility'

// ── Frequency gate ─────────────────────────────────────────────────────────────

function shouldCheck(frequency: string | null, lastCheckedAt: string | null): boolean {
  if (!lastCheckedAt) return true  // never checked → always run
  const elapsed = Date.now() - new Date(lastCheckedAt).getTime()
  switch (frequency ?? 'daily') {
    case 'instant': return true
    case 'weekly':  return elapsed > 6.5 * 24 * 3600_000
    case 'daily':
    default:        return elapsed > 23 * 3600_000
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'

// ── Handler ───────────────────────────────────────────────────────────────────

// Task 923 R67 (d): the job pages through the saved searches by `id` until it is done or its time budget is spent, checks every read, and moves a search's
// `last_checked_at` / `new_count` forward only after the alert for it was sent. It used to read the first 500 rows once (the rest never ran), ignore a failed read and
// the result of every send, and advance the boundary regardless: an alert that failed to send was lost for good, because the listings it was about now lay before
// the boundary. A search that was not handled keeps its old boundary and is picked up by the next run.
const PAGE_SIZE = 100
// The time one run may spend. EXECUTOR CHOICE (the kickoff names a budget, not a number, and vercel.json sets no maxDuration): work left over waits for the next run.
const TIME_BUDGET_MS = 25_000

async function handle(request: NextRequest) {
  const auth = verifyCronRequest(request)
  if (!auth.ok) return auth.response

  const db = createAdminClient()
  const startedAt = Date.now()
  const now = new Date().toISOString()
  const outOfTime = () => Date.now() - startedAt > TIME_BUDGET_MS

  let notified = 0
  let skipped  = 0
  let errors   = 0
  let complete = false
  let readFailed = false
  let lastId: string | null = null

  paging: while (!outOfTime()) {
    // Fetch the next page of saved searches with email notifications enabled
    let pageQuery = db
      .from('saved_searches')
      .select('id, user_id, name, filters, notify_frequency, last_checked_at, new_count')
      .eq('notify_email', true)
      .order('id', { ascending: true })
      .limit(PAGE_SIZE)
    if (lastId) pageQuery = pageQuery.gt('id', lastId)
    const { data: page, error: pageError } = await pageQuery
    if (pageError) {
      console.error('[cron/saved-searches] page read failed', { afterId: lastId, code: pageError.code })
      readFailed = true
      errors++
      break
    }
    if (!page?.length) { complete = true; break }

    for (const search of page) {
      if (outOfTime()) break paging
      lastId = search.id

      // Frequency gate — skip if not due yet
      if (!shouldCheck(search.notify_frequency, search.last_checked_at)) {
        skipped++
        continue
      }

      try {
        const cutoff = search.last_checked_at ?? new Date(0).toISOString()
        // the boundary this check moves to: taken BEFORE the count, so a listing created while the job runs is counted by the next run, not skipped
        const checkedAt = new Date().toISOString()

        // Build filter query from saved canonical filters
        const canonical = search.filters as CanonicalFilters
        const sp = canonicalToSearchParams(canonical)
        const parsed = parseSearchParams(sp)

        let baseQuery = applyPublicVisibility(
          db
            .from('listings')
            .select('id', { count: 'exact', head: true }),
        )
          .gt('created_at', cutoff)

        baseQuery = applyListingFilters(baseQuery, parsed) as typeof baseQuery

        const { count: newCount, error: countError } = await baseQuery
        if (countError || newCount === null || newCount === undefined) {
          // unreadable: nothing is decided, the boundary stays, the next run counts again
          errors++
          console.error('[cron/saved-searches] count failed', { searchId: search.id, code: countError?.code })
          continue
        }

        if (newCount === 0) {
          // nothing to send: the check is complete, only the boundary moves
          const { error: advanceError } = await db.from('saved_searches').update({ last_checked_at: checkedAt }).eq('id', search.id)
          if (advanceError) { errors++; console.error('[cron/saved-searches] boundary update failed', { searchId: search.id, code: advanceError.code }) }
          continue
        }

        // Albanian-only policy (Task 251): saved-search alert emails always in sq.
        const { data: authData, error: userError } = await db.auth.admin.getUserById(search.user_id)
        if (userError) {
          errors++
          console.error('[cron/saved-searches] user read failed', { searchId: search.id })
          continue
        }
        const userEmail = authData?.user?.email

        const searchUrl = `${SITE_URL}/sq/listings?${sp.toString()}`
        const searchName = search.name || ''

        // The e-mail goes first and decides: when it cannot be sent, nothing else happens and the boundary stays, so the next run tries the same alert again
        // (and the person is not given an in-app copy on every run while the mail keeps failing). Email via admin-editable template.
        if (userEmail) {
          const sent = await sendTemplatedEmail({
            key: 'saved_search_alert',
            to: userEmail,
            userId: search.user_id,
            variables: {
              searchName,
              newCount: String(newCount),
              searchUrl,
            },
          })
          if (sent.error) {
            errors++
            console.error('[cron/saved-searches] alert e-mail failed', { searchId: search.id, error: sent.error })
            continue
          }
        }

        // In-app notification — sq-fallback title/body (Owner decision 2, Task 319);
        // viewer-locale render comes from notifications.saved_search_match_title/_body
        // (NotificationItem.tsx) via templateId + templateParams.
        await createNotification({
          userId: search.user_id,
          type: 'saved_search_match',
          templateId: 'saved_search_match',
          templateParams: { searchName, count: newCount },
          title: `Kërkim i ruajtur: ${searchName}`,
          body: `${newCount} listim të reja`,
          link: searchUrl,
        })

        // The alert was sent: only now does the boundary move
        const { error: advanceError } = await db
          .from('saved_searches')
          .update({
            last_checked_at: checkedAt,
            new_count: (search.new_count ?? 0) + newCount,
          })
          .eq('id', search.id)
        if (advanceError) {
          // the person was told, but the boundary stayed: the next run sends this alert again. Logged with the id so it can be found.
          errors++
          console.error('[cron/saved-searches] boundary update failed after the alert was sent', { searchId: search.id, code: advanceError.code })
          continue
        }

        notified++
        console.info('[cron/saved-searches] notified', { searchId: search.id, newCount })
      } catch (err) {
        errors++
        console.error('[cron/saved-searches] error', { searchId: search.id, err })
      }
    }

    if (page.length < PAGE_SIZE) { complete = true; break }
  }

  const summary = { notified, skipped, errors, complete, readFailed, at: now }
  console.info('[cron/saved-searches] complete', summary)
  return NextResponse.json(summary, { status: readFailed ? 500 : 200 })
}

export const GET = handle
export const POST = handle
