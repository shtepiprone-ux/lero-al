/**
 * Listing Form Mode — explicit domain type for listing form lifecycle.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RULE: Form behavior is determined ONLY by `mode`.
 * FORBIDDEN: inferring mode from presence/absence of `listingId`.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * create — blank form, calls createListing on submit.
 * edit   — pre-populated form, requires listingId + initialValues, calls updateListing.
 */
export type ListingFormMode = 'create' | 'edit'

/** Returns true when the form should operate in edit mode. */
export function isEditMode(mode: ListingFormMode): boolean {
  return mode === 'edit'
}
