/**
 * Agent statistics data shapes — Task 848. Plain data only: no UI, no Supabase types leak out.
 * Every timestamp is the raw UTC ISO string from the database.
 */
import type { BlockResult } from '@/lib/dashboard/blockResult'
import type { Period } from '@/lib/dashboard/period'
import type { ActivityByListingRow } from '@/modules/analytics/activity/types'
import type { HiddenReason } from '@/modules/listings/lib/visibility'
import type { ListingStatus, ListingType } from '@/types/database'

/**
 * The id of a signed-in user whose `users.role` is `agent`. It can only be produced by
 * `getAgentStatisticsAccess()` — the single cast lives there — so a data function that asks for
 * this type can never be handed an id that came from a URL or a client.
 */
export type AgentOwnerId = string & { readonly __brand: 'AgentOwnerId' }

export type AgentStatisticsAccess =
  | { kind: 'ok'; ownerId: AgentOwnerId }
  | { kind: 'unauthenticated' }
  | { kind: 'not_agent' }

/** AGT-01 — three disjoint sets that need the agent's attention. No period. */
export interface Agt01 {
  pending: number
  /** Status is public-eligible but the listing is hidden (expired or no expiry). */
  hidden: number
  /** Publicly visible and expiring within the next 7 Tirane local days, today included. */
  expiring: number
}

/** AGT-02 — the agent's portfolio. `visible` is the canonical visibility count, never raw `active`. */
export interface Agt02 {
  visible: number
  pending: number
  inactive: number
  /** Declarations "marked by the agent", not deals. */
  sold: number
  rented: number
  /** The `listing_type` split of the visible listings; `null` when nothing is visible. */
  split: { sale: number; rent: number } | null
  /** One count per status (all 7), including raw `active`, for the portfolio-visibility donut. */
  statusCounts: Record<ListingStatus, number>
}

export type Agt10Sort =
  | 'expires_at'
  | 'created_at'
  | 'form_inquiries'
  | 'recorded_views'
  | 'whatsapp_clicks'
  | 'last_activity_date'
export type Agt10Direction = 'asc' | 'desc'
export type Agt10Visibility = 'visible' | 'hidden'

/** Filters, sort and page of the AGT-10 table. They only ever narrow the agent's own rows. */
export interface Agt10Table {
  status?: ListingStatus
  visibility?: Agt10Visibility
  listingType?: ListingType
  sort: Agt10Sort
  direction: Agt10Direction
  /** 1-based; a page past the end is clamped to the last page. */
  page: number
}

export interface Agt10Row {
  id: string
  slug: string
  title: string
  status: ListingStatus
  visible: boolean
  hiddenReason: HiddenReason | null
  expiresAt: string | null
  listingType: ListingType
  createdAt: string
  coverUrl: string | null
  /** Form inquiries received in the selected period (Task 891: from the activity aggregate's
   * `listingInquirySubmissions`, not a direct `listing_inquiries` read). */
  formInquiries: number
  /** Recorded views in the selected period (Task 891, 849's activity aggregate). `0` only after a
   * successful `getOwnerActivityByListing` read; missing from that read also reads as `0`. */
  recordedViews: number
  /** WhatsApp click-throughs in the selected period (Task 891, 849's activity aggregate). */
  whatsappClicks: number
  /** The latest Tirane day in the period with any recorded activity; `null` when the by-listing
   * read had no row for this listing (never a false "no activity" when the read itself failed —
   * a failed read fails the whole `agt10` block, see `readAgt10`). */
  lastActivityDate: string | null
}

export interface Agt10 {
  rows: Agt10Row[]
  /** Rows matching the filters, across all pages. */
  total: number
  page: number
  pageSize: number
}

export interface AgentStatisticsData {
  agt01: BlockResult<Agt01>
  agt02: BlockResult<Agt02>
  agt10: BlockResult<Agt10>
}

export interface AgentStatisticsInput {
  ownerId: AgentOwnerId
  /** The request time, passed in by the page so this module never reads the clock for day maths. */
  now: Date
  period: Period
  table: Agt10Table
  /**
   * Task 891 (R1/R7): the page's own `getOwnerActivityByListing(ownerId, period)` call, started
   * before this module is invoked so the network round-trip runs concurrently with every other
   * block's queries (one call, shared with the page's own top-listings ranking) — `readAgt10`
   * awaits it to merge AGT-10's activity columns and to sort by them across the owner's whole
   * matching set before paging. A failed read fails the `agt10` block (never a false `0`).
   */
  activityByListing: Promise<BlockResult<ActivityByListingRow[]>>
}
