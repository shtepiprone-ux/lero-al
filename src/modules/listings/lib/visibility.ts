import type { ListingStatus } from '@/types/database'

// ── Canonical status→visibility policy ───────────────────────────────────────
// Single source of truth for "is this listing publicly visible?"
// Every public read and every visibility badge MUST derive from this policy.
// Adding a new public-eligible status = one edit here; all consumers follow.
//
// VISIBILITY_POLICY_ANCHOR — do not remove (LV.4 grep-gate keys on this)

export interface VisibilityRule {
  publicEligible: boolean
  requiresUnexpired: boolean
}

export const PUBLIC_VISIBLE_STATUSES: Record<ListingStatus, VisibilityRule> = {
  active:   { publicEligible: true,  requiresUnexpired: true },
  inactive: { publicEligible: false, requiresUnexpired: false },
  sold:     { publicEligible: false, requiresUnexpired: false },
  rented:   { publicEligible: false, requiresUnexpired: false },
  archived: { publicEligible: false, requiresUnexpired: false },
  pending:  { publicEligible: false, requiresUnexpired: false },
  expired:  { publicEligible: false, requiresUnexpired: false },
}

export type HiddenReason = 'status_not_public' | 'expired' | 'no_expiry'

export interface VisibilityResult {
  visible: boolean
  reason: HiddenReason | null
}

export function isListingPubliclyVisible(listing: {
  status: ListingStatus
  expires_at: string | null
}): VisibilityResult {
  const rule = PUBLIC_VISIBLE_STATUSES[listing.status]

  if (!rule.publicEligible) {
    return { visible: false, reason: 'status_not_public' }
  }

  if (rule.requiresUnexpired) {
    if (listing.expires_at === null) {
      return { visible: false, reason: 'no_expiry' }
    }
    if (new Date(listing.expires_at) < new Date()) {
      return { visible: false, reason: 'expired' }
    }
  }

  return { visible: true, reason: null }
}

// ── Composable Supabase filter ───────────────────────────────────────────────
// Applies the public-visibility predicate to a Supabase query builder.
// Reproduces the exact filter chain that was previously inline at each call site:
//   .eq('status', 'active').gte('expires_at', new Date().toISOString())
// but derived from the policy so adding a public-eligible status changes only
// PUBLIC_VISIBLE_STATUSES above.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyPublicVisibility<Q extends { eq: any; in: any; gte: any }>(query: Q): Q {
  const eligibleStatuses = (Object.entries(PUBLIC_VISIBLE_STATUSES) as [ListingStatus, VisibilityRule][])
    .filter(([, rule]) => rule.publicEligible)
    .map(([status]) => status)

  const unexpiredSet = new Set(
    eligibleStatuses.filter(s => PUBLIC_VISIBLE_STATUSES[s].requiresUnexpired),
  )
  const allRequire = unexpiredSet.size === eligibleStatuses.length
  const noneRequire = unexpiredSet.size === 0

  if (!allRequire && !noneRequire) {
    throw new Error(
      'applyPublicVisibility: mixed requiresUnexpired policy is not supported. ' +
      'All public-eligible statuses must agree on requiresUnexpired. ' +
      'Implement OR-group filtering before adding a mixed policy.',
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = query
  if (eligibleStatuses.length === 1) {
    q = q.eq('status', eligibleStatuses[0])
  } else {
    q = q.in('status', eligibleStatuses)
  }

  if (allRequire) {
    q = q.gte('expires_at', new Date().toISOString())
  }

  return q as Q
}
