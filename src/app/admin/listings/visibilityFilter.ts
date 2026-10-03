import { applyPublicEligibleButHidden, applyPublicVisibility } from '@/modules/listings/lib/visibility'

/**
 * `/admin/listings?visibility=` as a pure query-builder step (Task 857, R1/R11). `visible` lists only publicly
 * visible listings through the canonical `applyPublicVisibility` (critical flow "Listing public visibility
 * invariant"); `hidden_eligible` keeps the audit predicate, optionally narrowed by `reason`; any other value
 * is ignored. No status or expiry literal lives here — the predicates are the shared helpers'.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyAdminListingsVisibility<Q extends { eq: any; in: any; gte: any; or: any; lt: any; is: any }>(
  query: Q,
  visibility: string,
  reason: string,
): Q {
  if (visibility === 'visible') return applyPublicVisibility(query)
  if (visibility === 'hidden_eligible') {
    return applyPublicEligibleButHidden(query, reason ? { reason } : undefined)
  }
  return query
}
