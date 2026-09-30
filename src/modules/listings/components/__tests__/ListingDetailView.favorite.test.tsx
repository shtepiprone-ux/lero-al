/**
 * ListingDetailViewBody — favourite heart visibility (Task 886 R38, owner O83-6 (a)).
 *
 * A guest sees the heart on the listing-detail page, as on cards (`FavoriteButton` opens the login
 * sheet for a guest). A staff preview shows none. Save-to-collection stays signed-in only: for a guest
 * it is absent, because `listingId` (the signed-in gate) is undefined.
 */

import React, { Suspense } from 'react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider, createTranslator } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { readFileSync } from 'fs'
import { join } from 'path'
import { theme } from '@/design-system/mantine/theme'
import { ListingDetailViewBody, type ListingDetailViewBodyProps } from '../ListingDetailView'

vi.mock('@/modules/auth/context/AuthContext', () => ({
  useAuth: () => ({ user: null, status: 'unauthenticated', loading: false, signOut: () => {}, refreshUser: () => {} }),
}))
vi.mock('@/modules/listings/actions/favoriteActions', () => ({ addFavorite: vi.fn(), removeFavorite: vi.fn() }))
vi.mock('@/modules/listings/actions/collectionActions', () => ({
  getCollectionsWithMembership: vi.fn(async () => ({ collections: [], memberIds: [] })),
  createCollection: vi.fn(),
  addToCollection: vi.fn(),
  removeFromCollection: vi.fn(),
}))
vi.mock('@/lib/auth/authSheet', () => ({ openAuthSheet: vi.fn() }))

// `next/dynamic` -> a lazy, Suspense-wrapped component so the REAL `ListingContact` renders.
vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>) => {
    const Lazy = React.lazy(loader)
    return function DynamicStub(props: Record<string, unknown>) {
      return (
        <Suspense fallback={null}>
          <Lazy {...props} />
        </Suspense>
      )
    }
  },
}))

// Heavy or non-DOM children — not under test.
vi.mock('@/components/shared/MapWrapper', () => ({ MapWrapper: () => null }))
vi.mock('@/modules/listings/components/GalleryIsland', () => ({ GalleryIsland: () => null }))
vi.mock('@/modules/listings/components/GalleryStaticFrame', () => ({ GalleryStaticFrame: () => null }))
vi.mock('@/modules/listings/components/ViewTracker', () => ({ ViewTracker: () => null }))
vi.mock('@/modules/listings/components/RecentlyViewedTracker', () => ({ RecentlyViewedTracker: () => null }))
vi.mock('@/modules/listings/components/ListingBackButton', () => ({ ListingBackButton: () => null }))
vi.mock('@/modules/listings/components/ListingReportDialog', () => ({ ListingReportDialog: () => null }))
vi.mock('@/modules/listings/components/ListingsPageFrame', () => ({
  ListingsPageFrame: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

function loadMessages(locale: string) {
  return JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf-8'))
}

beforeAll(() => {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error -- test-only global stub, jsdom has no IntersectionObserver
  global.IntersectionObserver = IntersectionObserverStub
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
})

const messages = loadMessages('en')
const t = createTranslator({ locale: 'en', messages, namespace: 'listing' }) as unknown as ListingDetailViewBodyProps['t']
const tNav = createTranslator({ locale: 'en', messages, namespace: 'nav' }) as unknown as ListingDetailViewBodyProps['tNav']
const tc = createTranslator({ locale: 'en', messages, namespace: 'common' }) as unknown as ListingDetailViewBodyProps['tc']

const LISTING = {
  id: 'listing-1',
  public_id: 100234,
  user_id: 'owner-1',
  location_id: 1,
  slug: 'shitet-apartament-2-1-tirane',
  title: 'Apartment 2+1 in Tirana',
  description: 'A bright apartment.',
  price: 125000,
  price_old: null,
  currency: 'EUR',
  listing_type: 'sale',
  property_type: 'apartment',
  market_type: null,
  condition: null,
  wall_type: null,
  heating: null,
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
  lat: null,
  lng: null,
  views_count: 1,
  is_premium: false,
  premium_until: null,
  status: 'active',
  expires_at: '2026-12-31T00:00:00.000Z',
  created_at: '2026-05-01T00:00:00.000Z',
  updated_at: '2026-05-01T00:00:00.000Z',
  search_vector: null,
  location: { id: 1, name_al: 'Tirane', slug: 'tirane', type: 'city' },
} as unknown as ListingDetailViewBodyProps['listing']

const OWNER = {
  id: 'owner-1',
  name: 'Elira Hoxha',
  avatar_url: null,
  user_type: 'private',
  is_verified: true,
  company_name: null,
  deleted_at: null,
  has_phone: true,
  has_whatsapp: true,
} as unknown as ListingDetailViewBodyProps['owner']

function renderBody(props: Partial<ListingDetailViewBodyProps> = {}) {
  const merged: ListingDetailViewBodyProps = {
    listing: LISTING,
    owner: OWNER,
    sortedImages: [],
    coverImage: undefined,
    galleryPreload: null,
    isNew: false,
    isPriceReduced: false,
    features: [],
    detailAttrs: [],
    displayPrice: 125000,
    displayCurrencyCode: 'EUR',
    displayPriceOld: null,
    originalPriceStr: null,
    pricePerSqm: null,
    formattedPrice: '€125,000',
    relativeTimeStr: '2 days ago',
    listingUrl: 'https://lero.al/en/listings/shitet-apartament-2-1-tirane',
    locale: 'en',
    isGuest: true,
    canReport: false,
    isInitiallyFavorited: false,
    listingId: undefined,
    isStaffPreview: false,
    previewBanner: null,
    t,
    tNav,
    tc,
    similarListingsSlot: null,
    recentlyViewedSlot: null,
    ...props,
  }
  return render(
    <MantineProvider theme={theme}>
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <ListingDetailViewBody {...merged} />
      </NextIntlClientProvider>
    </MantineProvider>,
  )
}

describe('ListingDetailViewBody — favourite heart (Task 886 R38, O83-6 (a))', () => {
  it('guest (no listingId, not a staff preview) sees the "Add to favorites" heart', async () => {
    renderBody({ isGuest: true, listingId: undefined })
    // Wait for the lazy contact card so the page is fully rendered before asserting.
    await screen.findAllByRole('button')
    expect(await screen.findByRole('button', { name: 'Add to favorites' })).toBeInTheDocument()
  })

  it('staff preview shows no heart', async () => {
    renderBody({ isGuest: true, listingId: undefined, isStaffPreview: true, previewBanner: 'unpublished' })
    await screen.findAllByRole('button').catch(() => [])
    expect(screen.queryByRole('button', { name: 'Add to favorites' })).toBeNull()
  })

  it('guest sees no "Save to collection" control', async () => {
    renderBody({ isGuest: true, listingId: undefined })
    await screen.findByRole('button', { name: 'Add to favorites' })
    expect(screen.queryByRole('button', { name: 'Save to collection' })).toBeNull()
  })
})
