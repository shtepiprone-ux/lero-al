import type { MantineColor } from '@mantine/core'
import type { ListingStatus } from '@/types/database'

/**
 * One shared source for the theme colour every listing-status badge uses (spec v3.3 §3.3, §17.1).
 *
 * Site-wide canonical colours win where they already exist — copied verbatim from
 * `ListingCard.tsx:85-106`'s `getBadges()`, the current single source of truth for these four:
 * `sold` → `blueLight` (matches `--status-info`), `rented` → `purple`, `archived` → `gray`,
 * `expired` → `yellow` (matches `--status-warning`). The remaining three statuses take the spec's
 * semantic bucket (§17.1: visible/published → positive; pending/expiring → warning;
 * neutral/inactive/archived → neutral): `active` → `green`, `pending` → `yellow`,
 * `inactive` → `gray`.
 *
 * `ListingCard.tsx` keeps its own local copy for now — Task 741 Revision 2 (Sprint 46, reopened
 * by the owner 2026-09-17) already owns those exact lines for an unrelated hardcode fix, and
 * editing them here would collide with that open task. Task 844 (this module) records in
 * `docs/backlog.md`'s 741 row that Revision 2 must switch `ListingCard` to this module. Until
 * then the two agree by value, not by import.
 */
export const LISTING_STATUS_COLOR: Record<ListingStatus, MantineColor> = {
  active: 'green',
  inactive: 'gray',
  sold: 'blueLight',
  rented: 'purple',
  archived: 'gray',
  pending: 'yellow',
  expired: 'yellow',
}

export type VisibilityTone = 'positive' | 'warning' | 'danger' | 'neutral'

/**
 * The spec's four semantic visibility buckets (§17.1), for callers that classify by meaning
 * rather than by raw `ListingStatus` (e.g. a diagnostics/error row that isn't a listing status
 * at all). Same theme colour names as `LISTING_STATUS_COLOR`'s values, named by role instead of
 * by status so a caller never has to invent its own mapping for a non-status tone.
 */
export const VISIBILITY_TONE_COLOR: Record<VisibilityTone, MantineColor> = {
  positive: 'green',
  warning: 'yellow',
  danger: 'red',
  neutral: 'gray',
}
