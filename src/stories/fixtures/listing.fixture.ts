/**
 * Stable listing fixture for Storybook stories.
 * Uses deterministic data — no random IDs, no live API calls.
 *
 * i18n pattern (Task 380, Sprint 33):
 *   - titleKey   — storybook.* message key (resolves via storyT)
 *   - title      — English value for backward compat; Task 381 migrates consumers to titleKey
 *   - makeListingFixtures(locale) — factory that returns fully locale-resolved fixtures
 *
 * Raw string literals are forbidden in this file (docs/storybook-governance.md §14.2).
 * All user-facing title strings come from the storybook.listing.* message namespace.
 */

import { storyT } from '../_storyI18n';

// ── Message keys (canonical reference) ───────────────────────────────────────

const K = {
  modernApartment: 'storybook.listing.modern_apartment',
  apartmentLong:   'storybook.listing.apartment_long',
  cozyStudio:      'storybook.listing.cozy_studio',
  grid: [
    'storybook.listing.grid_0',
    'storybook.listing.grid_1',
    'storybook.listing.grid_2',
    'storybook.listing.grid_3',
    'storybook.listing.grid_4',
    'storybook.listing.grid_5',
    'storybook.listing.grid_6',
    'storybook.listing.grid_7',
  ],
} as const;

// ── Base shape (non-title fields are locale-invariant) ────────────────────────

const BASE = {
  slug: 'modern-apartment-tirana-center',
  price:            95000,
  currency:         'EUR' as string,
  transaction_type: 'sale' as string,
  property_type:    'apartment' as string,
  area_sqm:         75,
  rooms:            3,
  bedrooms:         2,
  floor:            4,
  city:             'Tirana',
  neighborhood:     'Blloku',
  is_premium:       true,
  is_new:           false,
  status:           'active' as const,
  cover_image:      'https://res.cloudinary.com/demo/image/upload/w_800,h_500,c_fill/sample.jpg',
  images:           [] as string[],
  created_at:       '2026-01-15T10:00:00Z',
};

// ── Locale-resolved factory ───────────────────────────────────────────────────

export function makeListingFixtures(locale: string) {
  const t = (key: string) => storyT(locale, key);

  const LISTING_FIXTURE = {
    ...BASE,
    id:       'story-listing-001',
    titleKey: K.modernApartment,
    title:    t(K.modernApartment),
  };

  const LISTING_FIXTURE_LONG_TITLE = {
    ...BASE,
    id:       'story-listing-002',
    titleKey: K.apartmentLong,
    title:    t(K.apartmentLong),
  };

  const LISTING_FIXTURE_RENT = {
    ...BASE,
    id:              'story-listing-003',
    titleKey:        K.cozyStudio,
    title:           t(K.cozyStudio),
    transaction_type: 'rent' as const,
    price:           600,
    is_premium:      false,
    is_new:          true,
  };

  const LISTINGS_GRID_FIXTURE = Array.from({ length: 8 }, (_, i) => ({
    ...BASE,
    id:       `story-listing-${String(i + 1).padStart(3, '0')}`,
    titleKey: K.grid[i] as string,
    title:    t(K.grid[i] as string),
    price:    50000 + i * 15000,
    is_premium: i < 2,
    is_new:   i === 4,
  }));

  return { LISTING_FIXTURE, LISTING_FIXTURE_LONG_TITLE, LISTING_FIXTURE_RENT, LISTINGS_GRID_FIXTURE };
}

// ── Backward-compatible static exports (English default) ─────────────────────
// Consumers that still use LISTING_FIXTURE.title get English.
// Task 381 migrates each consumer to makeListingFixtures(locale) at render time.

const _en = makeListingFixtures('en');

export const LISTING_FIXTURE            = _en.LISTING_FIXTURE;
export const LISTING_FIXTURE_LONG_TITLE = _en.LISTING_FIXTURE_LONG_TITLE;
export const LISTING_FIXTURE_RENT       = _en.LISTING_FIXTURE_RENT;
export const LISTINGS_GRID_FIXTURE      = _en.LISTINGS_GRID_FIXTURE;
