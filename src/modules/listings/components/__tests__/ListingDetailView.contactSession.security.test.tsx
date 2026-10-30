/**
 * ListingDetailViewBody — the contact card belongs to one viewer (Task 923 R131, R132; owner D83).
 *
 * The real `ListingDetailViewBody` renders the real `ListingContact` (through the same stand-in of `next/dynamic` as `ListingDetailView.favorite.test.tsx`) and is re-rendered IN PLACE, as a
 * `router.refresh()` after a sign-out or a sign-in re-renders the page. The doubles are the I/O and the heavy children only: the contact gateway (`revealListingContact`), the human check
 * (`CaptchaWidget`), the toast sink and the message dialog. The invariant: a number revealed by one session is never shown to the next session without a gateway call, and no digit of it is in the
 * DOM of a guest. The control: a re-render for the SAME viewer with only another prop changed keeps the card as it was.
 */

import React, { Suspense } from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('@/lib/toast', () => ({ toast }))
const gateway = vi.hoisted(() => ({ revealListingContact: vi.fn() }))
vi.mock('@/modules/listings/actions/contactGateway', () => gateway)
vi.mock('@/modules/listings/actions/contactEvents', () => ({ trackListingContactEvent: vi.fn() }))
const widget = vi.hoisted(() => ({ getToken: vi.fn(), reset: vi.fn() }))
vi.mock('@/components/auth/CaptchaWidget', async () => {
  const react = await import('react')
  const Double = react.forwardRef((_props: Record<string, unknown>, ref: React.Ref<unknown>) => {
    react.useImperativeHandle(ref, () => ({ getToken: widget.getToken, reset: widget.reset }))
    return <div data-testid="human-check-double" />
  })
  Double.displayName = 'CaptchaWidget'
  return { CaptchaWidget: Double }
})
// the message dialog is not under test here: its trigger is all the card needs
vi.mock('@/modules/listings/components/ListingInquiryDialog', () => ({ ListingInquiryDialog: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</> }))

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
const l = messages.listing
const t = createTranslator({ locale: 'en', messages, namespace: 'listing' }) as unknown as ListingDetailViewBodyProps['t']
const tNav = createTranslator({ locale: 'en', messages, namespace: 'nav' }) as unknown as ListingDetailViewBodyProps['tNav']
const tc = createTranslator({ locale: 'en', messages, namespace: 'common' }) as unknown as ListingDetailViewBodyProps['tc']

const NUMBER = '+355 69 123 4567'
const DIGITS = '355691234567'
const VIEWER_A = 'a1111111-1111-4111-8111-111111111111'
const VIEWER_B = 'b2222222-2222-4222-8222-222222222222'

const LISTING = {
  id: '11111111-1111-4111-8111-111111111111',
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

/** the owner row a signed-in viewer is given */
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

/** the empty owner row `page.tsx` builds for a guest (RLS blocks the owner embed) */
const GUEST_OWNER = {
  id: '',
  name: null,
  has_phone: false,
  has_whatsapp: false,
  avatar_url: null,
  user_type: 'private',
  is_verified: false,
  company_name: null,
  deleted_at: null,
} as unknown as ListingDetailViewBodyProps['owner']

const BASE: ListingDetailViewBodyProps = {
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
  isGuest: false,
  viewerId: VIEWER_A,
  canReport: false,
  isInitiallyFavorited: false,
  listingId: LISTING.id,
  isStaffPreview: false,
  previewBanner: null,
  t,
  tNav,
  tc,
  similarListingsSlot: null,
  recentlyViewedSlot: null,
}

const tree = (props: Partial<ListingDetailViewBodyProps>) => (
  <MantineProvider theme={theme}>
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <ListingDetailViewBody {...BASE} {...props} />
    </NextIntlClientProvider>
  </MantineProvider>
)

/** the session of a re-render: what `page.tsx` passes for a signed-in viewer and for a guest */
const AS_A: Partial<ListingDetailViewBodyProps> = { isGuest: false, viewerId: VIEWER_A, owner: OWNER }
const AS_B: Partial<ListingDetailViewBodyProps> = { isGuest: false, viewerId: VIEWER_B, owner: OWNER }
const AS_GUEST: Partial<ListingDetailViewBodyProps> = { isGuest: true, viewerId: null, owner: GUEST_OWNER, listingId: undefined }

const noDigitOfTheNumber = () => expect(document.body.innerHTML, 'no part of the number in the DOM').not.toMatch(/691234567|69 123 4567/)

beforeEach(() => {
  toast.success.mockReset(); toast.error.mockReset()
  gateway.revealListingContact.mockReset(); gateway.revealListingContact.mockResolvedValue({ ok: true, number: NUMBER })
  widget.getToken.mockReset(); widget.getToken.mockResolvedValue('tok-session')
  widget.reset.mockReset()
})
afterEach(() => { cleanup() })

describe('ListingDetailView', () => {
  it('[SEC-X-FE-CONTACT-SESSION-RESET] a new session starts the contact card empty', async () => {
    const view = render(tree(AS_A))

    // viewer A reveals the number: Show number becomes the number link, after one gateway call
    fireEvent.click(await screen.findByRole('button', { name: l.show_number }))
    const link = await screen.findByRole('link', { name: NUMBER })
    expect(link).toHaveAttribute('href', `tel:${DIGITS}`)
    expect(gateway.revealListingContact).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(1))

    // control: the same viewer, another prop changed (the heart): the card is not reset
    view.rerender(tree({ ...AS_A, isInitiallyFavorited: true }))
    expect(screen.getByRole('link', { name: NUMBER }), 'the number link stays for the same viewer').toHaveAttribute('href', `tel:${DIGITS}`)
    expect(screen.queryByRole('button', { name: l.show_number })).toBeNull()
    expect(gateway.revealListingContact).toHaveBeenCalledTimes(1)

    // A signs out and the page refreshes in place: the guest sees no digit of the number
    view.rerender(tree(AS_GUEST))
    await waitFor(() => expect(screen.queryByRole('link', { name: NUMBER })).toBeNull())
    expect(document.querySelector('a[href^="tel:"], a[href*="wa.me"]'), 'no contact link for a guest').toBeNull()
    noDigitOfTheNumber()

    // A signs in again: Show number is a button, there is no number link and no digit, and the gateway has had one call in all
    view.rerender(tree(AS_A))
    expect(screen.queryByRole('link', { name: NUMBER }), 'the new session shows no number link').toBeNull()
    expect(document.querySelector('a[href^="tel:"], a[href*="wa.me"]'), 'no contact link after the new sign-in').toBeNull()
    noDigitOfTheNumber()
    const again = await screen.findByRole('button', { name: l.show_number })
    expect(gateway.revealListingContact, 'a new session reveals nothing without a call').toHaveBeenCalledTimes(1)

    // a press makes the second call and shows the link
    fireEvent.click(again)
    expect(await screen.findByRole('link', { name: NUMBER })).toHaveAttribute('href', `tel:${DIGITS}`)
    expect(gateway.revealListingContact).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(2))

    // directly from A to viewer B (another account in the same tab): Show number is a button again, with no digit in the DOM
    view.rerender(tree(AS_B))
    expect(screen.queryByRole('link', { name: NUMBER }), 'the next account shows no number link').toBeNull()
    expect(document.querySelector('a[href^="tel:"], a[href*="wa.me"]'), 'no contact link for the next account').toBeNull()
    noDigitOfTheNumber()
    expect(await screen.findByRole('button', { name: l.show_number })).toBeInTheDocument()
    expect(gateway.revealListingContact, 'the next account is served by no call of the previous one').toHaveBeenCalledTimes(2)
    expect(toast.error).not.toHaveBeenCalled()
  })
})
