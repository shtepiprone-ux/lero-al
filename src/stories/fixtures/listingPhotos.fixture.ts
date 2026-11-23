/**
 * Fixture photos for the listing-form Stories (Task 957 Revision 3, R3-5; Review 3 F20). The photos are the four photographs the listing card Stories already use
 * (`CARD_FIXTURE_IMAGE_URLS` in `cardListingData.fixture.ts`), cycled to as many photos as a Story needs, so the number badge, the cover mark and the controls are judged over a real
 * photograph and not over a colour fill. Each photo has its own `public_id` (the key of its tile), the first one is the cover, and `order` follows the position.
 */
import type { ListingImage } from '@/modules/listings/components/ImageUpload'
import { CARD_FIXTURE_IMAGE_URLS } from './cardListingData.fixture'

export function fixturePhotoUrl(n: number): string {
  return CARD_FIXTURE_IMAGE_URLS[(n - 1) % CARD_FIXTURE_IMAGE_URLS.length]!
}

/** Photo `n` of a listing (1-based): the first one is the cover. */
export function fixturePhoto(n: number): ListingImage {
  return { url: fixturePhotoUrl(n), public_id: `story-photo-${n}`, is_cover: n === 1, order: n - 1 }
}

/** The first `count` photos. */
export function fixturePhotos(count: number): ListingImage[] {
  return Array.from({ length: count }, (_, i) => fixturePhoto(i + 1))
}
