/**
 * Stable `CardListingData` fixture for the Task 665 View-split stories
 * (`System/FeaturedListings`, `System/LatestListings`, `System/RecentlyViewedSection`,
 * `System/SimilarListings`). Deterministic data — no random IDs, no live API calls.
 *
 * Reuses the existing `storybook.listing.grid_0..7` message keys (Task 380 namespace) so no
 * new i18n keys/parity work is required. `location.name_al` is a real Albanian proper noun
 * (production data shape), not translated UI copy.
 */

import { storyT } from '../_storyI18n'
import type { CardListingData } from '@/modules/listings/components/ListingCard'

const TITLE_KEYS = [
  'storybook.listing.grid_0',
  'storybook.listing.grid_1',
  'storybook.listing.grid_2',
  'storybook.listing.grid_3',
  'storybook.listing.grid_4',
  'storybook.listing.grid_5',
  'storybook.listing.grid_6',
  'storybook.listing.grid_7',
] as const

const LOCATIONS: { name_al: string; slug: string }[] = [
  { name_al: 'Tiranë', slug: 'tirane' },
  { name_al: 'Durrës', slug: 'durres' },
  { name_al: 'Sauk', slug: 'sauk' },
  { name_al: 'Kombinat', slug: 'kombinat' },
  { name_al: 'Blloku', slug: 'blloku' },
  { name_al: 'Vlorë', slug: 'vlore' },
  { name_al: 'Berat', slug: 'berat' },
  { name_al: 'Elbasan', slug: 'elbasan' },
]

const IMAGE_URLS = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop',
]

/**
 * Factory — builds fixture listings with locale-resolved titles.
 * Call at render time: makeCardListingFixtures(context?.globals?.locale ?? 'en')
 */
export function makeCardListingFixtures(locale: string): CardListingData[] {
  return TITLE_KEYS.map((key, i): CardListingData => {
    const loc = LOCATIONS[i % LOCATIONS.length]!
    return {
      id: `story-listing-${String(i + 1).padStart(3, '0')}`,
      public_id: 1000 + i,
      slug: `${loc.slug}-fixture-listing-${i + 1}`,
      title: storyT(locale, key),
      price: 50000 + i * 15000,
      currency: 'EUR',
      listing_type: 'sale',
      property_type: 'apartment',
      is_premium: i < 2,
      status: 'active',
      created_at: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
      images: [{ url: IMAGE_URLS[i % IMAGE_URLS.length]!, is_cover: true, order: 0 }],
      location: { id: i + 1, name_al: loc.name_al, slug: loc.slug, type: 'city' },
      area_gross: 60 + i * 10,
      bedrooms: 1 + (i % 4),
      bathrooms: 1 + (i % 2),
    }
  })
}
