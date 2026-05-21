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
 *   4. Always update last_checked_at; accumulate new_count
 *
 * Idempotent: last_checked_at serves as the dedup boundary — no listing is
 * notified twice as long as last_checked_at advances past its created_at.
 *
 * Epic E.4 / Task 132
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveUserLocale } from '@/modules/notifications/lib/emails/resolveUserLocale'
import { sendTemplatedEmail } from '@/modules/notifications/lib/sendTemplatedEmail'
import { createNotification } from '@/modules/notifications/lib/mutations'
import { applyListingFilters, parseSearchParams } from '@/modules/listings/domain/filterEngine'
import {
  canonicalToSearchParams,
  type CanonicalFilters,
} from '@/modules/listings/lib/savedSearchCanonicalize'

// ── Inline notification strings (cron has no request context) ─────────────────

const NOTIF: Record<string, {
  title: (name: string) => string
  body:  (count: number) => string
}> = {
  sq: { title: n => `Kërkim i ruajtur: ${n}`, body: c => `${c} listim të reja` },
  en: { title: n => `Saved search: ${n}`, body: c => `${c} new listing${c === 1 ? '' : 's'} found` },
  uk: { title: n => `Збережений пошук: ${n}`, body: c => `${c} нових оголошень` },
  it: { title: n => `Ricerca salvata: ${n}`, body: c => `${c} nuov${c === 1 ? 'o annuncio' : 'i annunci'}` },
}

function getNotif(locale: string) { return NOTIF[locale] ?? NOTIF.en }

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

export async function POST(request: NextRequest) {
  // Verify Vercel cron secret
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const db = createAdminClient()
  const now = new Date().toISOString()

  // Fetch all saved searches with email notifications enabled
  const { data: searches } = await db
    .from('saved_searches')
    .select('id, user_id, name, filters, notify_frequency, last_checked_at, new_count')
    .eq('notify_email', true)
    .limit(500)

  let notified = 0
  let skipped  = 0
  let errors   = 0

  for (const search of searches ?? []) {
    // Frequency gate — skip if not due yet
    if (!shouldCheck(search.notify_frequency, search.last_checked_at)) {
      skipped++
      continue
    }

    try {
      const cutoff = search.last_checked_at ?? new Date(0).toISOString()

      // Build filter query from saved canonical filters
      const canonical = search.filters as CanonicalFilters
      const sp = canonicalToSearchParams(canonical)
      const parsed = parseSearchParams(sp)

      // Query new active listings matching the saved filters created after the cutoff.
      // .eq('status', 'active') is a READ filter, not a mutation — not subject to the
      // listing-mutation-gateway ESLint rule (which only flags .update() calls).
      let baseQuery = db
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('expires_at', now)
        .gt('created_at', cutoff)

      baseQuery = applyListingFilters(baseQuery, parsed) as typeof baseQuery

      const { count: newCount } = await baseQuery

      // Always advance last_checked_at so the next run has the correct boundary
      await db
        .from('saved_searches')
        .update({
          last_checked_at: now,
          new_count: (search.new_count ?? 0) + (newCount ?? 0),
        })
        .eq('id', search.id)

      if (!newCount || newCount === 0) continue

      // Resolve locale + get user email
      const locale = await resolveUserLocale(search.user_id)
      const { data: authData } = await db.auth.admin.getUserById(search.user_id)
      const userEmail = authData?.user?.email

      const s = getNotif(locale)
      const searchUrl = `${SITE_URL}/${locale}/listings?${sp.toString()}`
      const searchName = search.name || ''

      // In-app notification
      await createNotification({
        userId: search.user_id,
        type: 'saved_search_match',
        title: s.title(searchName),
        body: s.body(newCount),
        link: searchUrl,
      })

      // Email via admin-editable template (gracefully handles missing template)
      if (userEmail) {
        await sendTemplatedEmail({
          key: 'saved_search_alert',
          to: userEmail,
          userId: search.user_id,
          variables: {
            searchName,
            newCount: String(newCount),
            searchUrl,
          },
        })
      }

      notified++
      console.info('[cron/saved-searches] notified', { searchId: search.id, newCount })
    } catch (err) {
      errors++
      console.error('[cron/saved-searches] error', { searchId: search.id, err })
    }
  }

  const summary = { notified, skipped, errors, at: now }
  console.info('[cron/saved-searches] complete', summary)
  return NextResponse.json(summary)
}
