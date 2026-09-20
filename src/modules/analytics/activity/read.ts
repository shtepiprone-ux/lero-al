import 'server-only'
import { blockFail, blockOk, type BlockResult } from '@/lib/dashboard/blockResult'
import type { Period } from '@/lib/dashboard/period'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AgentOwnerId } from '@/modules/cabinet/statistics/types'
import {
  STALE_AFTER_MS,
  type ActivityByListingRow,
  type ActivityFreshness,
  type ActivityPoint,
} from './types'

/**
 * Listing activity read helpers — Task 849 (spec v3.3 §4, §9.1, §10). Server-only, read-only.
 *
 * `listing_activity_daily` is service-role only and is never read from the client. Each helper
 * returns a `BlockResult`: a failed or inconsistent read is `ok: false` and never a series of zeros —
 * `0` is only ever the answer of a read that succeeded. Days are Europe/Tirane local dates.
 *
 * Consumers: 855 (admin ADM-10, owner series), 856 (AGT-11 top listings).
 */

interface SeriesRow {
  metric_date: string
  recorded_views: number
  whatsapp_clicks: number
  listing_inquiry_submissions: number
}

interface ByListingRow {
  listing_id: string
  recorded_views: number
  whatsapp_clicks: number
  listing_inquiry_submissions: number
  last_activity_date: string
}

function toPoint(row: SeriesRow): ActivityPoint {
  return {
    date: row.metric_date,
    recordedViews: Number(row.recorded_views),
    whatsappClicks: Number(row.whatsapp_clicks),
    listingInquirySubmissions: Number(row.listing_inquiry_submissions),
  }
}

/** The SQL series functions return one row per date of the range, zero days included. */
async function readSeries(
  fn: 'listing_activity_platform_series' | 'listing_activity_owner_series',
  args: Record<string, string>,
  period: Period,
): Promise<BlockResult<ActivityPoint[]>> {
  try {
    const { data, error } = await createAdminClient().rpc(fn, args)
    if (error) {
      console.error(`[activity/read] ${fn} failed`, { error })
      return blockFail('query_failed')
    }
    if (!Array.isArray(data) || data.length !== period.days) return blockFail('data_inconsistent')
    return blockOk((data as SeriesRow[]).map(toPoint))
  } catch (err) {
    console.error(`[activity/read] ${fn} threw`, { err })
    return blockFail('query_failed')
  }
}

/** ADM-10 — activity of every listing on the platform, one point per completed Tirane day. */
export function getPlatformActivitySeries(period: Period): Promise<BlockResult<ActivityPoint[]>> {
  return readSeries(
    'listing_activity_platform_series',
    { p_from: period.from, p_to: period.to },
    period,
  )
}

/** AGT-03/04 — activity of one owner's listings, one point per completed Tirane day. */
export function getOwnerActivitySeries(
  ownerId: AgentOwnerId,
  period: Period,
): Promise<BlockResult<ActivityPoint[]>> {
  return readSeries(
    'listing_activity_owner_series',
    { p_owner: ownerId, p_from: period.from, p_to: period.to },
    period,
  )
}

/** AGT-05/10/11 — per-listing sums for one owner; only listings with activity in the period appear. */
export async function getOwnerActivityByListing(
  ownerId: AgentOwnerId,
  period: Period,
): Promise<BlockResult<ActivityByListingRow[]>> {
  try {
    const { data, error } = await createAdminClient().rpc('listing_activity_owner_by_listing', {
      p_owner: ownerId,
      p_from: period.from,
      p_to: period.to,
    })
    if (error) {
      console.error('[activity/read] listing_activity_owner_by_listing failed', { error })
      return blockFail('query_failed')
    }
    if (!Array.isArray(data)) return blockFail('data_inconsistent')
    return blockOk(
      (data as ByListingRow[]).map((row) => ({
        listingId: row.listing_id,
        recordedViews: Number(row.recorded_views),
        whatsappClicks: Number(row.whatsapp_clicks),
        listingInquirySubmissions: Number(row.listing_inquiry_submissions),
        lastActivityDate: row.last_activity_date,
      })),
    )
  } catch (err) {
    console.error('[activity/read] listing_activity_owner_by_listing threw', { err })
    return blockFail('query_failed')
  }
}

/**
 * When the aggregate was last refreshed successfully, and whether that is too long ago. No successful
 * refresh at all is stale. A dashboard shows the time and a warning — never a stale value as current.
 */
export async function getActivityFreshness(now: Date): Promise<BlockResult<ActivityFreshness>> {
  try {
    const { data, error } = await createAdminClient()
      .from('listing_activity_refresh')
      .select('ran_at')
      .eq('status', 'success')
      .order('ran_at', { ascending: false })
      .limit(1)
    if (error) {
      console.error('[activity/read] freshness query failed', { error })
      return blockFail('query_failed')
    }
    const latest = (data as Array<{ ran_at: string }> | null)?.[0]
    if (!latest) return blockOk({ lastSuccessAt: null, stale: true })

    const ranAtMs = Date.parse(latest.ran_at)
    if (Number.isNaN(ranAtMs)) return blockFail('data_inconsistent')
    return blockOk({ lastSuccessAt: latest.ran_at, stale: now.getTime() - ranAtMs > STALE_AFTER_MS })
  } catch (err) {
    console.error('[activity/read] freshness threw', { err })
    return blockFail('query_failed')
  }
}
