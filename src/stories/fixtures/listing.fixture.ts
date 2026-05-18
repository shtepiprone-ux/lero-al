/**
 * Stable listing fixture for Storybook stories.
 * Uses deterministic data — no random IDs, no live API calls.
 */

export const LISTING_FIXTURE = {
  id: 'story-listing-001',
  title: 'Modern Apartment in Tirana Center',
  slug: 'modern-apartment-tirana-center',
  price: 95000,
  currency: 'EUR' as string,
  transaction_type: 'sale' as string,
  property_type: 'apartment' as string,
  area_sqm: 75,
  rooms: 3,
  bedrooms: 2,
  floor: 4,
  city: 'Tirana',
  neighborhood: 'Blloku',
  is_premium: true,
  is_new: false,
  status: 'active' as const,
  cover_image: 'https://res.cloudinary.com/demo/image/upload/w_800,h_500,c_fill/sample.jpg',
  images: [],
  created_at: '2026-01-15T10:00:00Z',
};

export const LISTING_FIXTURE_LONG_TITLE = {
  ...LISTING_FIXTURE,
  id: 'story-listing-002',
  title: 'Апартаменти в центрі Тирани з чудовим видом на гори та зручним розташуванням поряд з усіма зручностями',
  city: 'Тирана',
  neighborhood: 'Блоку',
};

export const LISTING_FIXTURE_RENT = {
  ...LISTING_FIXTURE,
  id: 'story-listing-003',
  transaction_type: 'rent' as const,
  price: 600,
  title: 'Cozy Studio in Sauk District',
  is_premium: false,
  is_new: true,
};

export const LISTINGS_GRID_FIXTURE = Array.from({ length: 8 }, (_, i) => ({
  ...LISTING_FIXTURE,
  id: `story-listing-${String(i + 1).padStart(3, '0')}`,
  title: [
    'Modern Apartment in Tirana',
    'Villa with Garden in Durrës',
    'Studio Flat in Sauk',
    'Office Space in Kombinat',
    'Penthouse in Blloku',
    'Beach House in Vlorë',
    'Mountain Retreat in Berat',
    'Renovated Apartment in Elbasan',
  ][i] ?? `Listing ${i + 1}`,
  price: 50000 + i * 15000,
  is_premium: i < 2,
  is_new: i === 4,
}));
