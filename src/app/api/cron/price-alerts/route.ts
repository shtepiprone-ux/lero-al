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
 *   3c. Alert row, price changed → send email + in-app, UPSERT new price
 *
 * Idempotent: last_notified_price serves as the dedup boundary — the same
 * price change never triggers a second notification.
 *
 * Epic F.3 / Task 137
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTemplatedEmail } from '@/modules/notifications/lib/sendTemplatedEmail'
import { createNotification } from '@/modules/notifications/lib/mutations'

// ── Inline notification strings (cron has no request context) ─────────────────

const NOTIF: Record<string, {
  title: (listingTitle: string) => string
  body: (oldPrice: string, newPrice: string) => string
}> = {
  sq: {
    title: t => `Ndryshim çmimi: ${t}`,
    body: (o, n) => `${o} → ${n}`,
  },
  en: {
    title: t => `Price change: ${t}`,
    body: (o, n) => `${o} → ${n}`,
  },
  uk: {
    title: t => `Зміна ціни: ${t}`,
    body: (o, n) => `${o} → ${n}`,
  },
  it: {
    title: t => `Variazione prezzo: ${t}`,
    body: (o, n) => `${o} → ${n}`,
  },
}

function getNotif(locale: string) { return NOTIF[locale] ?? NOTIF.en }

function fmtPrice(price: number, currency: string): string {
  return `${Math.round(price).toLocaleString('en')} ${currency}`
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const db = createAdminClient()
  const now = new Date().toISOString()

  // Step 1: All favorites (user_id, listing_id) — capped to avoid timeout
  const { data: favs } = await db
    .from('favorites')
    .select('user_id, listing_id')
    .limit(5000)

  if (!favs?.length) {
    return NextResponse.json({ notified: 0, baseline: 0, skipped: 0, errors: 0, at: now })
  }

  // Step 2: Current prices for favorited listings (non-archived only)
  const allListingIds = [...new Set(favs.map((f: { listing_id: string }) => f.listing_id))]
  const { data: listings } = await db
    .from('listings')
    .select('id, title, slug, price, currency')
    .in('id', allListingIds)
    .neq('status', 'archived')

  const listingMap = new Map(
    (listings ?? []).map((l: { id: string; title: string; slug: string; price: number; currency: string }) => [l.id, l])
  )

  // Restrict to favorites with visible listings
  const activeFavs = (favs as { user_id: string; listing_id: string }[]).filter(f => listingMap.has(f.listing_id))
  if (!activeFavs.length) {
    return NextResponse.json({ notified: 0, baseline: 0, skipped: 0, errors: 0, at: now })
  }

  // Step 3: Existing price-alert records for the relevant users
  const userIds = [...new Set(activeFavs.map(f => f.user_id))]
  const { data: alerts } = await db
    .from('favorite_price_alerts')
    .select('user_id, listing_id, last_notified_price')
    .in('user_id', userIds)

  // Map: "userId:listingId" → last_notified_price
  const alertMap = new Map<string, number>()
  for (const a of (alerts ?? []) as { user_id: string; listing_id: string; last_notified_price: number }[]) {
    alertMap.set(`${a.user_id}:${a.listing_id}`, Number(a.last_notified_price))
  }

  // Step 4: Process each (user, listing) pair
  let notified = 0
  let baseline = 0
  let skipped  = 0
  let errors   = 0

  const baselineUpserts: { user_id: string; listing_id: string; last_notified_price: number; last_notified_at: string }[] = []

  for (const fav of activeFavs) {
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
      baseline++
      continue
    }

    if (currentPrice === lastPrice) {
      skipped++
      continue
    }

    // Price changed — notify
    try {
      // Albanian-only policy (Task 251): price-alert emails always in sq.
      const locale = 'sq'
      const { data: authData } = await db.auth.admin.getUserById(fav.user_id)
      const userEmail = authData?.user?.email

      const s = getNotif(locale)
      const oldPriceStr = fmtPrice(lastPrice, listing.currency)
      const newPriceStr = fmtPrice(currentPrice, listing.currency)
      const listingUrl = `${SITE_URL}/sq/listings/${listing.slug}`

      await createNotification({
        userId: fav.user_id,
        type: 'price_change',
        title: s.title(listing.title),
        body: s.body(oldPriceStr, newPriceStr),
        link: listingUrl,
      })

      if (userEmail) {
        await sendTemplatedEmail({
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
      }

      // Update last_notified_price to deduplicate future runs
      await db
        .from('favorite_price_alerts')
        .upsert({
          user_id: fav.user_id,
          listing_id: fav.listing_id,
          last_notified_price: currentPrice,
          last_notified_at: now,
        }, { onConflict: 'user_id,listing_id' })

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

  // Bulk insert baseline records (first-time seen pairs)
  if (baselineUpserts.length > 0) {
    await db
      .from('favorite_price_alerts')
      .upsert(baselineUpserts, { onConflict: 'user_id,listing_id' })
  }

  const summary = { notified, baseline, skipped, errors, at: now }
  console.info('[cron/price-alerts] complete', summary)
  return NextResponse.json(summary)
}
