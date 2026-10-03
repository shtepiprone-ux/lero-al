import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useTranslations, useLocale } from 'next-intl'
import { Paper, Text } from '@mantine/core'
import {
  ListingDetailViewBody,
  type ListingDetailViewListing,
  type ListingDetailViewBodyProps,
} from '@/modules/listings/components/ListingDetailView'
import type { DetailFeature, DetailAttribute } from '@/modules/listings/domain/presentationEngine'
import type { PublicUserProfile, ListingImage } from '@/types/database'
import { storyT } from '@/stories/_storyI18n'
import { formatPrice } from '@/lib/formatters'
import { convertPrice, type ExchangeRates } from '@/lib/getExchangeRate'
import { formatDistance } from 'date-fns'
import { enUS, it, uk, sq } from 'date-fns/locale'
import type { Locale } from 'date-fns'

// ── Mocked data — local to this story, not shared infrastructure ─────────────
// Task 237: rendered-evidence harness for the shared ListingDetailView/Body
// presentational layout (preview banners, gallery/title/price/features/contact/
// map layout, full-width mobile, locale wrapping). No Supabase access.
// Task 791 — retitled to the canonical Mantine scope (Patterns/Mantine/ListingDetailView) and
// moved here so it counts for check:story-coverage's manifest gate; the three states and the
// fixture below are unchanged.

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
    <Paper withBorder radius="lg" p="lg" bg="gray.0" style={{ borderStyle: 'dashed' }}>
      <Text size="sm" c="dimmed">{text}</Text>
    </Paper>
  )
}

// The relative date follows production: `formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale })`
// with `locale = DATE_LOCALE_MAP[locale] ?? enUS` over { enUS, it, uk, sq } ([slug]/page.tsx:3,243-244). The Story uses a
// fixed "now" (the fixture's created_at + 2 days) so it does not change from day to day; en still reads "2 days ago".
const STORY_NOW = '2026-05-03T00:00:00.000Z'
const STORY_DATE_LOCALES: Record<string, Locale> = { en: enUS, it, uk, sq }

/**
 * Thin client wrapper resolving `t`/`tNav`/`tc` via `useTranslations`, backed
 * by the `NextIntlClientProvider` already supplied by `.storybook/preview.tsx`'s
 * `withLocale` decorator.
 */
function ListingDetailViewStory({
  storyOwnerPrice,
  ...props
}: Omit<ListingDetailViewBodyProps, 't' | 'tNav' | 'tc' | 'formattedPrice' | 'relativeTimeStr' | 'similarListingsSlot' | 'recentlyViewedSlot'> & {
  /** Story-only: the price in the owner's currency, formatted through `formatPrice` for the active locale
   * (production passes `originalPriceStr` the same way, `[slug]/page.tsx:234`). */
  storyOwnerPrice?: { amount: number; currency: string }
}) {
  const t = useTranslations('listing')
  const tNav = useTranslations('nav')
  const tc = useTranslations('common')
  const storyLocale = useLocale()

  return (
    <ListingDetailViewBody
      {...props}
      locale={storyLocale}
      formattedPrice={formatPrice(props.displayPrice, props.displayCurrencyCode, storyLocale)}
      relativeTimeStr={formatDistance(new Date(props.listing.created_at), new Date(STORY_NOW), { addSuffix: true, locale: STORY_DATE_LOCALES[storyLocale] ?? enUS })}
      originalPriceStr={storyOwnerPrice ? formatPrice(storyOwnerPrice.amount, storyOwnerPrice.currency, storyLocale) : props.originalPriceStr}
      t={t}
      tNav={tNav}
      tc={tc}
      similarListingsSlot={<OmittedSlot text={storyT(storyLocale, 'storybook.listing_detail_view.similar_listings_omitted')} />}
      recentlyViewedSlot={<OmittedSlot text={storyT(storyLocale, 'storybook.listing_detail_view.recently_viewed_omitted')} />}
    />
  )
}

const meta: Meta<typeof ListingDetailViewStory> = {
  title: 'Patterns/Mantine/ListingDetailView',
  component: ListingDetailViewStory,
  tags: ['autodocs'],
  parameters: { skipCanvas: true },
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
export const PublicListing: Story = {}

// Fixture data (labelled): `rates` is ListingCard.smoke.test.tsx's fixture (ALL per 1 EUR = 100). The converted
// export is the viewer who chose ALL for a 125,000 EUR listing; per-m² uses production's formula
// (`[slug]/page.tsx:236`: displayed price / area_gross, area_gross = `baseListing.area_gross`).
const rates: ExchangeRates = { ALL: 1, EUR: 100 }
const convertedPrice = convertPrice(baseListing.price, baseListing.currency, 'ALL', rates)

// ── Not reduced: dark price, nothing struck, no owner-currency line ───────────
export const PublicListingNotReduced: Story = {
  args: { listing: { ...baseListing, price_old: null }, isPriceReduced: false, displayPriceOld: null },
}

// ── Not reduced, converted: dark ALL price + the EUR owner-currency line ──────
export const PublicListingConverted: Story = {
  args: {
    listing: { ...baseListing, price_old: null },
    isPriceReduced: false,
    displayPriceOld: null,
    displayCurrencyCode: 'ALL',
    displayPrice: convertedPrice,
    pricePerSqm: Math.round(convertedPrice / baseListing.area_gross!),
    storyOwnerPrice: { amount: baseListing.price, currency: baseListing.currency },
  },
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
}

// ── Archived listing, public route (Task 793 F1, review §16.2/§17.5) ─────────
// R11: the contact card renders with Call/WhatsApp/Send-message disabled (via `contactSlot`'s
// `ListingContact`) and the status banner shown; favorite (badges row) disabled; share stays
// enabled. `isGuest: false` + a real `listingId` so `favoriteSlot` actually renders (disabled),
// not just omitted.
export const ArchivedListing: Story = {
  args: {
    listing: { ...baseListing, status: 'archived' },
    isGuest: false,
    listingId: 'story-listing-1',
    isInitiallyFavorited: false,
  },
}
