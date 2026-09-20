/**
 * Listing activity aggregate — data shapes and refresh cadence. Task 849 (Sprint 78).
 *
 * Plain data only: no UI, no Supabase types leak out. Days are `'YYYY-MM-DD'` Europe/Tirane local
 * dates (see `@/lib/dashboard/period`). Consumers: 855 (activity analytics), 856 (AGT-11).
 */
import type { DateString } from '@/lib/dashboard/period'

type ActivityRefreshCadence = 'hourly' | 'daily'

/**
 * How often `/api/cron/listing-activity` is scheduled in `vercel.json`. Task 849, owner action O78-1:
 * `'hourly'` (`0 * * * *`) needs the Vercel Pro plan; on Hobby an hourly expression FAILS the
 * deployment, so the permitted fallback is `'daily'` (`30 0 * * *`). `vercel.json` and this constant
 * change together — `STALE_AFTER_MS` below is derived from it.
 */
export const ACTIVITY_REFRESH_CADENCE: ActivityRefreshCadence = 'daily'

const HOUR_MS = 3_600_000

const STALE_AFTER_HOURS: Record<ActivityRefreshCadence, number> = { hourly: 2, daily: 26 }

/** A refresh older than this is stale: two missed hourly runs, or a daily run plus two hours' grace. */
export const STALE_AFTER_MS = STALE_AFTER_HOURS[ACTIVITY_REFRESH_CADENCE] * HOUR_MS

/** One Tirane day of activity, summed across the listings in scope. */
export interface ActivityPoint {
  date: DateString
  /** Accepted `listing_views` rows — never the lifetime `listings.views_count`. */
  recordedViews: number
  /** WhatsApp contact events, owner clicks excluded. */
  whatsappClicks: number
  /** Stored `listing_inquiries` rows; whether the notification email succeeded is irrelevant. */
  listingInquirySubmissions: number
}

/** One listing's activity summed over a period. Only listings with activity appear. */
export interface ActivityByListingRow {
  listingId: string
  recordedViews: number
  whatsappClicks: number
  listingInquirySubmissions: number
  /** The latest Tirane day in the period on which the listing had any recorded activity. */
  lastActivityDate: DateString
}

export interface ActivityFreshness {
  /** UTC ISO of the latest successful refresh; `null` when none has ever succeeded. */
  lastSuccessAt: string | null
  /** True when there is no successful refresh, or the latest one is older than `STALE_AFTER_MS`. */
  stale: boolean
}
