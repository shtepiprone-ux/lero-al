/**
 * POST /api/cron/price-alerts
 *
 * Daily cron job (vercel.json schedule: "0 10 * * *") — detects price changes
 * on favorited listings and notifies users via email + in-app notification.
 *
 * Authentication: Vercel injects Authorization: Bearer ${CRON_SECRET}.
 *
 * Flow per (user, listing) pair in favorites:
 *   1. Fetch current price from listings (non-archived only)
 *   2. Compare to last_notified_price in favorite_price_alerts
 *   3a. No alert row → INSERT baseline price, no notification (first-time seen)
 *   3b. Alert row, price unchanged → skip
 *   3c. Alert row, price changed → send email + in-app, UPSERT new price once the alert was sent
 *
 * Paged by favorite id with a time budget (Task 923 R67 (d)); a pair that was not handled keeps its baseline and is picked up by the next run.
 *
 * Idempotent: last_notified_price serves as the dedup boundary — the same
 * price change never triggers a second notification.
 *
 * Epic F.3 / Task 137
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/cron/verifyCronRequest'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTemplatedEmail } from '@/modules/notifications/lib/sendTemplatedEmail'
import { createNotification } from '@/modules/notifications/lib/createNotification'

// ── sq-fallback price formatter (Owner decision 2, Task 319) ──────────────────
// Used only for the `title`/`body` sq-fallback columns; viewer-locale render
// formats prices via Intl.NumberFormat(viewerLocale) from template_params
// (NotificationItem.tsx).

function fmtPrice(price: number, currency: string): string {
  return `${Math.round(price).toLocaleString('en')} ${currency}`
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'

// Task 923 R67 (d): the job pages through the favourites by `id` until it is done or its time budget is spent (it used to read the first 5000 favourites once, the rest
// never ran), checks every read, and moves a baseline price forward only after the alert for it was sent. It used to ignore the result of the e-mail and of the
// baseline write, and a failed read of the baselines made every pair look "first seen". A pair that was not handled keeps its old baseline and is picked up by the
// next run.
const PAGE_SIZE = 500
// The time one run may spend. EXECUTOR CHOICE (the kickoff names a budget, not a number, and vercel.json sets no maxDuration): work left over waits for the next run.
const TIME_BUDGET_MS = 25_000

type FavoriteRow = { id: string; user_id: string; listing_id: string }
type ListingRow = { id: string; title: string; slug: string; price: number; currency: string }

// ── Handler ───────────────────────────────────────────────────────────────────

async function handle(request: NextRequest) {
  const auth = verifyCronRequest(request)
  if (!auth.ok) return auth.response

  const db = createAdminClient()
  const startedAt = Date.now()
  const now = new Date().toISOString()
  const outOfTime = () => Date.now() - startedAt > TIME_BUDGET_MS

  let notified = 0
  let baseline = 0
  let skipped  = 0
  let errors   = 0
  let complete = false
  let readFailed = false
  let lastId: string | null = null

  paging: while (!outOfTime()) {
    // Step 1: the next page of favorites
    let pageQuery = db
      .from('favorites')
      .select('id, user_id, listing_id')
      .order('id', { ascending: true })
      .limit(PAGE_SIZE)
    if (lastId) pageQuery = pageQuery.gt('id', lastId)
    const { data: favsData, error: favsError } = await pageQuery
    if (favsError) {
      console.error('[cron/price-alerts] page read failed', { afterId: lastId, code: favsError.code })
      readFailed = true
      errors++
      break
    }
    const favs = (favsData ?? []) as FavoriteRow[]
    if (!favs.length) { complete = true; break }
    lastId = favs[favs.length - 1].id
    const isLastPage = favs.length < PAGE_SIZE

    // Step 2: Current prices for the page's listings (non-archived only)
    const allListingIds = [...new Set(favs.map(f => f.listing_id))]
    const { data: listings, error: listingsError } = await db
      .from('listings')
      .select('id, title, slug, price, currency')
      .in('id', allListingIds)
      .neq('status', 'archived')
    if (listingsError) {
      // unreadable: no pair of this page is decided (a missing listing must never look like "no change"), the next run reads the page again
      errors++
      console.error('[cron/price-alerts] listings read failed', { afterId: favs[0].id, code: listingsError.code })
      if (isLastPage) { complete = true; break }
      continue
    }

    const listingMap = new Map((listings ?? [] as ListingRow[]).map((l: ListingRow) => [l.id, l]))

    // Restrict to favorites with visible listings
    const activeFavs = favs.filter(f => listingMap.has(f.listing_id))
    if (activeFavs.length) {
      // Step 3: Existing price-alert records for this page's pairs
      const userIds = [...new Set(activeFavs.map(f => f.user_id))]
      const activeListingIds = [...new Set(activeFavs.map(f => f.listing_id))]
      const { data: alerts, error: alertsError } = await db
        .from('favorite_price_alerts')
        .select('user_id, listing_id, last_notified_price')
        .in('user_id', userIds)
        .in('listing_id', activeListingIds)
      if (alertsError) {
        // unreadable: treating every pair as "first seen" would overwrite real baselines, so nothing of this page is decided
        errors++
        console.error('[cron/price-alerts] alert baselines read failed', { afterId: favs[0].id, code: alertsError.code })
        if (isLastPage) { complete = true; break }
        continue
      }

      // Map: "userId:listingId" → last_notified_price
      const alertMap = new Map<string, number>()
      for (const a of (alerts ?? []) as { user_id: string; listing_id: string; last_notified_price: number }[]) {
        alertMap.set(`${a.user_id}:${a.listing_id}`, Number(a.last_notified_price))
      }

      // Step 4: Process each (user, listing) pair
      const baselineUpserts: { user_id: string; listing_id: string; last_notified_price: number; last_notified_at: string }[] = []

      for (const fav of activeFavs) {
        if (outOfTime()) break paging
        const key = `${fav.user_id}:${fav.listing_id}`
        const listing = listingMap.get(fav.listing_id)!
        const currentPrice = Number(listing.price)
        const lastPrice = alertMap.get(key)

        if (lastPrice === undefined) {
          // First time we see this pair — record baseline, no notification
          baselineUpserts.push({
            user_id: fav.user_id,
            listing_id: fav.listing_id,
            last_notified_price: currentPrice,
            last_notified_at: now,
          })
          continue
        }

        if (currentPrice === lastPrice) {
          skipped++
          continue
        }

        // Price changed — notify
        try {
          // Albanian-only policy (Task 251): price-alert emails always in sq.
          const { data: authData, error: userError } = await db.auth.admin.getUserById(fav.user_id)
          if (userError) {
            errors++
            console.error('[cron/price-alerts] user read failed', { userId: fav.user_id, listingId: fav.listing_id })
            continue
          }
          const userEmail = authData?.user?.email

          const oldPriceStr = fmtPrice(lastPrice, listing.currency)
          const newPriceStr = fmtPrice(currentPrice, listing.currency)
          const listingUrl = `${SITE_URL}/sq/listings/${listing.slug}`

          // The e-mail goes first and decides: when it cannot be sent, nothing else happens and the baseline stays, so the next run tries the same alert again
          // (and the person is not given an in-app copy on every run while the mail keeps failing).
          if (userEmail) {
            const sent = await sendTemplatedEmail({
              key: 'price_change_alert',
              to: userEmail,
              userId: fav.user_id,
              variables: {
                listingTitle: listing.title,
                oldPrice: oldPriceStr,
                newPrice: newPriceStr,
                currency: listing.currency,
                listingUrl,
              },
            })
            if (sent.error) {
              errors++
              console.error('[cron/price-alerts] alert e-mail failed', { userId: fav.user_id, listingId: fav.listing_id, error: sent.error })
              continue
            }
          }

          // In-app notification — sq-fallback title/body (Owner decision 2, Task 319);
          // viewer-locale render comes from notifications.price_change_title/_body
          // (NotificationItem.tsx) via templateId + numeric templateParams.
          await createNotification({
            userId: fav.user_id,
            type: 'price_change',
            templateId: 'price_change',
            templateParams: {
              oldPrice: lastPrice,
              newPrice: currentPrice,
              currency: listing.currency,
              listingName: listing.title,
              listingId: listing.id,
            },
            title: `Ndryshim çmimi: ${listing.title}`,
            body: `${oldPriceStr} → ${newPriceStr}`,
            link: listingUrl,
          })

          // The alert was sent: only now does the baseline move, to deduplicate future runs
          const { error: baselineError } = await db
            .from('favorite_price_alerts')
            .upsert({
              user_id: fav.user_id,
              listing_id: fav.listing_id,
              last_notified_price: currentPrice,
              last_notified_at: now,
            }, { onConflict: 'user_id,listing_id' })
          if (baselineError) {
            // the person was told, but the baseline stayed: the next run sends this alert again. Logged with the ids so it can be found.
            errors++
            console.error('[cron/price-alerts] baseline update failed after the alert was sent', { userId: fav.user_id, listingId: fav.listing_id, code: baselineError.code })
            continue
          }

          notified++
          console.info('[cron/price-alerts] notified', {
            userId: fav.user_id,
            listingId: fav.listing_id,
            oldPrice: lastPrice,
            newPrice: currentPrice,
          })
        } catch (err) {
          errors++
          console.error('[cron/price-alerts] error', { userId: fav.user_id, listingId: fav.listing_id, err })
        }
      }

      // Bulk insert baseline records (first-time seen pairs of this page)
      if (baselineUpserts.length > 0) {
        const { error: baselineError } = await db
          .from('favorite_price_alerts')
          .upsert(baselineUpserts, { onConflict: 'user_id,listing_id' })
        if (baselineError) {
          // the pairs stay "first seen" and are recorded by the next run; no alert is lost by this
          errors++
          console.error('[cron/price-alerts] first baselines write failed', { pairs: baselineUpserts.length, code: baselineError.code })
        } else {
          baseline += baselineUpserts.length
        }
      }
    }

    if (isLastPage) { complete = true; break }
  }

  const summary = { notified, baseline, skipped, errors, complete, readFailed, at: now }
  console.info('[cron/price-alerts] complete', summary)
  return NextResponse.json(summary, { status: readFailed ? 500 : 200 })
}

export const GET = handle
export const POST = handle
