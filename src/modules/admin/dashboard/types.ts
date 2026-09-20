/**
 * Admin dashboard data shapes — Task 847. Plain data only: no UI, no Supabase types leak out.
 * Every timestamp is the raw UTC ISO string from the database.
 */
import type { BlockResult } from '@/lib/dashboard/blockResult'
import type { ListingCurrency, ListingStatus, ReportStatus, TicketStatus } from '@/types/database'

/** ADM-01 — listings waiting for moderation. */
export interface Adm01Row {
  id: string
  title: string
  slug: string
  createdAt: string
  authorName: string
}
export interface Adm01 {
  count: number
  rows: Adm01Row[]
}

/** ADM-02 — open reports. `reviewed` is a separate count and is never summed into `pending`. */
export interface Adm02Row {
  id: string
  reason: string
  listingTitle: string | null
  createdAt: string
  status: ReportStatus
}
export interface Adm02 {
  pending: number
  reviewed: number
  rows: Adm02Row[]
}

/** ADM-06 — unassigned support queue. `inProgressAnomaly` is a data anomaly, not queue depth. */
export interface Adm06Row {
  id: string
  ticketType: 'support' | 'user_complaint'
  status: TicketStatus
  createdAt: string
}
export interface Adm06 {
  unassigned: number
  inProgressAnomaly: number
  rows: Adm06Row[]
}

/** ADM-08 — publicly visible listings, by the canonical predicate. */
export interface Adm08 {
  visible: number
}

/** ADM-09 — listings whose status says public but whose expiry hides them. */
export interface Adm09 {
  total: number
  expired: number
  noExpiry: number
}

/** ADM-11 — the status donut. Raw `active` is never a segment. */
export type Adm11SegmentKey =
  | 'pending'
  | 'visible'
  | 'active_hidden'
  | 'inactive'
  | 'sold'
  | 'rented'
  | 'archived'
  | 'expired'
export interface Adm11Segment {
  key: Adm11SegmentKey
  count: number
}
export interface Adm11 {
  segments: Adm11Segment[]
  total: number
}

/** Newest listings — context only. */
export interface RecentListingRow {
  id: string
  slug: string
  title: string
  status: ListingStatus
  isPremium: boolean
  price: number
  currency: ListingCurrency
  createdAt: string
  ownerName: string
}

/** Staff queue: users who asked for a location that is not yet listed. */
export interface LocationRequestRow {
  id: string
  displayName: string
  city: string
  region: string | null
}
export interface LocationRequests {
  count: number
  rows: LocationRequestRow[]
}

export interface AdminDashboardData {
  /** Server time of the fetch, for the header. */
  refreshedAt: string
  adm01: BlockResult<Adm01>
  adm02: BlockResult<Adm02>
  adm06: BlockResult<Adm06>
  adm08: BlockResult<Adm08>
  adm09: BlockResult<Adm09>
  adm11: BlockResult<Adm11>
  recentListings: BlockResult<RecentListingRow[]>
  locationRequests: BlockResult<LocationRequests>
}
