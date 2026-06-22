import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useTranslations, useLocale } from 'next-intl'
import {
  ListingDetailViewBody,
  type ListingDetailViewListing,
  type ListingDetailViewBodyProps,
} from './ListingDetailView'
import type { DetailFeature, DetailAttribute } from '@/modules/listings/domain/presentationEngine'
import type { PublicUserProfile, ListingImage } from '@/types/database'
import { storyT } from '@/stories/_storyI18n'

// ── Mocked data — local to this story, not shared infrastructure ─────────────
// Task 237: rendered-evidence harness for the shared ListingDetailView/Body
// presentational layout (preview banners, gallery/title/price/features/contact/
// map layout, full-width mobile, locale wrapping). No Supabase access.

const baseListing: ListingDetailViewListing = {
  id: 'story-listing-1',
  public_id: 100234,
  user_id: 'story-owner-1',
  location_id: 1,
  slug: 'shitet-apartament-2-1-tirane',
  title: 'Shitet apartament 2+1 në Tiranë, zonë e re',
  description:
    'Apartament modern i mobiluar plotësisht, kati i 4-t, ndriçim natyror i shkëlqyer, parkim privat dhe ambient i qetë, afër shkollave dhe transportit publik.',
  price: 125000,
  price_old: 138000,
  currency: 'EUR',
  listing_type: 'sale',
  property_type: 'apartment',
  market_type: null,
  condition: 'new_build',
  wall_type: null,
  heating: 'central',
  rooms: 3,
  bedrooms: 2,
  bathrooms: 1,
  toilets: 1,
  area_gross: 85,
  area_net: 78,
  floor: 4,
  total_floors: 8,
  multi_storey_building: false,
  land_legal_status: null,
  land_zoning: null,
  land_development_potential: null,
  offer_type: null,
  purchase_conditions: [],
  year_built: 2022,
  address: 'Rruga Myslym Shyri',
  lat: 41.3275,
  lng: 19.8187,
  views_count: 482,
  is_premium: true,
  premium_until: null,
  status: 'active',
  expires_at: '2026-12-31T00:00:00.000Z',
  created_at: '2026-05-01T00:00:00.000Z',
  updated_at: '2026-05-01T00:00:00.000Z',
  search_vector: null,
  location: { id: 1, name_al: 'Tiranë', slug: 'tirane', type: 'city' },
}

const baseOwner: PublicUserProfile = {
  id: 'story-owner-1',
  name: 'Elira Hoxha',
  avatar_url: null,
  user_type: 'private',
  is_verified: true,
  company_name: null,
  deleted_at: null,
  has_phone: true,
  has_whatsapp: true,
}

// No `res.cloudinary.com` host on purpose — buildGalleryMainPreloadAttrs()
// returns null for non-Cloudinary URLs, so GalleryStaticFrame renders its
// muted placeholder frame (layout-accurate, no network image dependency).
const sortedImages: Pick<ListingImage, 'url' | 'is_cover' | 'order'>[] = [
  { url: 'https://example.com/story-cover.jpg', is_cover: true, order: 0 },
  { url: 'https://example.com/story-2.jpg', is_cover: false, order: 1 },
  { url: 'https://example.com/story-3.jpg', is_cover: false, order: 2 },
]
const coverImage = sortedImages[0]

const features: DetailFeature[] = [
  { key: 'rooms', icon: 'home', labelKey: 'rooms', value: '3' },
  { key: 'bedrooms', icon: 'bed-double', labelKey: 'bedrooms', value: '2' },
  { key: 'area', icon: 'area', labelKey: 'area', value: '85 m²' },
  { key: 'floor', icon: 'layers', labelKey: 'floor', value: '4/8' },
]

const detailAttrs: DetailAttribute[] = [
  { labelKey: 'condition', valueKey: 'condition_new_build' },
  { labelKey: 'heating', valueKey: 'heating_central' },
]

/**
 * Below-the-fold sections are async Server Components in production (live
 * Supabase queries via SimilarListings / RecentlyViewedSection). Per Task 237
 * Option 1, Storybook receives clearly-marked placeholders instead — the real
 * sections remain covered by typecheck/build and unchanged server usage.
 */
function OmittedSlot({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-muted/30 p-5 text-sm text-muted-foreground">
      {text}
    </div>
  )
}

/**
 * Thin client wrapper resolving `t`/`tNav`/`tc` via `useTranslations`, backed
 * by the `NextIntlClientProvider` already supplied by `.storybook/preview.tsx`'s
 * `withLocale` decorator.
 */
function ListingDetailViewStory(
  props: Omit<ListingDetailViewBodyProps, 't' | 'tNav' | 'tc' | 'similarListingsSlot' | 'recentlyViewedSlot'>,
) {
  const t = useTranslations('listing')
  const tNav = useTranslations('nav')
  const tc = useTranslations('common')
  const storyLocale = useLocale()

  return (
    <ListingDetailViewBody
      {...props}
      locale={storyLocale}
      t={t}
      tNav={tNav}
      tc={tc}
      similarListingsSlot={<OmittedSlot text={storyT(storyLocale, 'storybook.listing_detail_view.similar_listings_omitted')} />}
      recentlyViewedSlot={<OmittedSlot text={storyT(storyLocale, 'storybook.listing_detail_view.recently_viewed_omitted')} />}
    />
  )
}

const meta: Meta<typeof ListingDetailViewStory> = {
  title: 'Listings/ListingDetailView',
  component: ListingDetailViewStory,
  tags: ['autodocs'],
  args: {
    listing: baseListing,
    owner: baseOwner,
    sortedImages,
    coverImage,
    galleryPreload: null,
    isNew: false,
    isPriceReduced: true,
    features,
    detailAttrs,
    displayPrice: 125000,
    displayCurrencyCode: 'EUR',
    displayPriceOld: 138000,
    originalPriceStr: null,
    pricePerSqm: 1471,
    formattedPrice: '€125,000',
    relativeTimeStr: '2 days ago',
    listingUrl: 'https://lero.al/en/listings/shitet-apartament-2-1-tirane',
    isGuest: true,
    canReport: false,
    isInitiallyFavorited: false,
    listingId: undefined,
    isStaffPreview: false,
    previewBanner: null,
  },
}

export default meta
type Story = StoryObj<typeof ListingDetailViewStory>

// ── Public listing detail (no staff banner) ──────────────────────────────────
export const PublicListing: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

// ── Staff preview — unpublished listing (status: pending) ────────────────────
export const StaffPreviewUnpublished: Story = {
  args: {
    listing: { ...baseListing, status: 'pending' },
    isStaffPreview: true,
    previewBanner: 'unpublished',
    isGuest: true,
    listingId: undefined,
  },
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

// ── Staff preview — published listing (link to public page) ──────────────────
export const StaffPreviewPublished: Story = {
  args: {
    listing: { ...baseListing, status: 'active' },
    isStaffPreview: true,
    previewBanner: 'published',
    isGuest: true,
    listingId: undefined,
  },
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

