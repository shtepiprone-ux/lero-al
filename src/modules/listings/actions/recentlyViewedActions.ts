'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'

export const RECENTLY_VIEWED_CAP = 25
export const RECENTLY_VIEWED_COOKIE = 'rv_listings'

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
