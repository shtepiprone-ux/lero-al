/**
 * Listings Domain — Public API
 *
 * Single entrypoint for all listing business policy.
 * Import from '@/modules/listings/domain' for semantic types and helpers.
 *
 * ── Usage policy ──────────────────────────────────────────────────────────────
 * FORBIDDEN outside this domain directory:
 *   listing.status === 'active'            → use isListingVisible(status)
 *   listing.status === 'sold' || 'rented'  → use isListingClosed(status)
 *   listing.user_id === userId             → use canUserEditListing(...)
 *   role === 'admin'                       → use canAdminEditListing(...)
 *   if (listingId)                         → use explicit mode prop (ListingFormMode)
 *   db.update({ status: 'sold' })          → use resolveTransition(current, 'MARK_AS_SOLD').nextStatus
 *   direct status-to-status assignment     → use getTransitionActionForStatus(from, to)
 */

// ── Semantic layer (types, mapping, query resolvers) ──────────────────────────
export type {
  ListingVisibilityGroup,
  ListingAttributeFilter,
} from './listingSemanticLayer'

export {
  VALID_VISIBILITY_GROUPS,
  VALID_ATTRIBUTE_FILTERS,
  VISIBILITY_DB_STATUSES,
  resolveListingQueryByVisibility,
  applyAttributeFilter,
  getListingVisibilityGroup,
} from './listingSemanticLayer'

// ── Semantic helpers (boolean business-logic API) ─────────────────────────────
export {
  isListingVisible,
  isListingHidden,
  isListingArchived,
  isListingClosed,
  isListingEditableStatus,
  isListingReadonlyStatus,
} from './listingSemanticHelpers'

// ── Form mode (explicit create/edit lifecycle type) ───────────────────────────
export type { ListingFormMode } from './listingFormMode'
export { isEditMode } from './listingFormMode'

// ── Edit permissions (centralized authorization policy) ───────────────────────
export type { EditPermissionCheck } from './listingPermissions'
export {
  canUserEditListing,
  canAdminEditListing,
  checkEditPermission,
  assertCanEditListing,
  ListingEditForbiddenError,
} from './listingPermissions'

// ── Transition engine (centralized status change policy) ──────────────────────
export type {
  ListingTransitionAction,
  ListingTransitionResult,
} from './listingTransitionEngine'
export {
  ALLOWED_LISTING_TRANSITIONS,
  canTransitionListing,
  getAvailableTransitions,
  resolveTransition,
  getTransitionActionForStatus,
  assertCanTransitionListing,
  ListingTransitionError,
  isTerminalListingStatus,
  isMarketClosedStatus,
  isModeratableStatus,
} from './listingTransitionEngine'
