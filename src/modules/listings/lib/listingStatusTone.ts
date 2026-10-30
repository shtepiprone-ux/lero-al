/**
 * Listing-status badge colours. The maps live in the one badge registry
 * (`src/design-system/mantine/badgeTones.ts`, Task 859 R24); this module re-exports them so Task 741's consumers
 * (`ListingCard`, `ListingStatusBanner`) and `listingStatusTone.test.ts` keep their import path.
 */
export { LISTING_STATUS_COLOR, VISIBILITY_TONE_COLOR } from '@/design-system/mantine/badgeTones'
export type { VisibilityTone } from '@/design-system/mantine/badgeTones'
