'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { routing } from '@/i18n/routing'
import { RECENTLY_VIEWED_CAP, RECENTLY_VIEWED_COOKIE } from '../lib/recentlyViewedConstants'

/**
 * Record a listing view for the current visitor.
 *
 * Auth users  → atomic upsert + prune via `record_recently_viewed` RPC
 *              (deduped by listing_id; oldest entries beyond cap removed).
 * Guest users → cookie `rv_listings` (non-HttpOnly JSON array of listing UUIDs;
 *              same 25-cap + front-of-list dedupe semantics).
 *
 * Idempotent: rapid double-calls produce no duplicate rows / cookie entries.
 * No PII is logged; listing content is never written.
 */
export async function recordListingView(listingId: string): Promise<void> {
  const user = await getUser()

  if (user) {
    const supabase = await createClient()
    const { error } = await supabase.rpc('record_recently_viewed', {
      p_listing_id: listingId,
    })
    if (error) {
      console.error('[RecentlyViewed] rpc failed', { listingId })
    }
  } else {
    const cookieStore = await cookies()
    const raw = cookieStore.get(RECENTLY_VIEWED_COOKIE)?.value ?? '[]'

    let ids: string[] = []
    try {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) ids = parsed.filter((x): x is string => typeof x === 'string')
    } catch {
      ids = []
    }

    // Move to front, dedupe, cap
    ids = [listingId, ...ids.filter(id => id !== listingId)].slice(0, RECENTLY_VIEWED_CAP)

    cookieStore.set(RECENTLY_VIEWED_COOKIE, JSON.stringify(ids), {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
      sameSite: 'lax',
      httpOnly: false, // server reads via request cookies; client may update directly in G.2
    })
  }
}

/**
 * Clear the current visitor's entire recently-viewed history.
 *
 * Auth users  → DELETE all rows in `recently_viewed` (RLS scopes to calling user).
 * Guest users → reset `rv_listings` cookie to an empty array.
 *
 * Revalidates the cabinet page so `RecentlyViewedSection` re-fetches on next render.
 */
export async function clearRecentlyViewed(): Promise<void> {
  const user = await getUser()

  if (user) {
    const supabase = await createClient()
    const { error } = await supabase
      .from('recently_viewed')
      .delete()
      .eq('user_id', user.id)
    if (error) {
      console.error('[RecentlyViewed] clear failed', { userId: user.id })
      throw new Error('clear_failed')
    }
    for (const locale of routing.locales) {
      revalidatePath(`/${locale}/cabinet`, 'page')
    }
  } else {
    const cookieStore = await cookies()
    cookieStore.set(RECENTLY_VIEWED_COOKIE, '[]', {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
    })
  }
}
