/**
 * ListingCard — vertical + horizontal Mantine migration regression guard (Tasks 602, 608).
 *
 * Both the vertical branch (default / grid view) and the horizontal branch
 * (`variant="horizontal"`, the `/listings` List view — `ListingsShell.tsx`) now render
 * `MantineListingCardPattern` (`layout="grid"`/`layout="list"`) instead of hand-rolled
 * markup. This mounts the REAL `ListingCard` under a REAL `NextIntlClientProvider` and
 * asserts:
 *   1. the vertical card renders every preserved content item through the new pattern
 *      (type label, title, price, features, location, badges, copy-id, date);
 *   2. a reduced-price listing (`price_old > price`) shows the old price struck through
 *      (`line-through`) next to the new price — a plain-price listing shows no strike;
 *   3. the horizontal branch renders every preserved content item through
 *      `MantineListingCardPattern layout="list"` (title, price, favorite control, copy-id
 *      button, features, badges) — Task 608 migration regression guard.
 */

import React from 'react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { readFileSync } from 'fs'
import { join } from 'path'
import { ListingCard, type CardListingData } from '../ListingCard'
import type { ExchangeRates } from '@/lib/getExchangeRate'

// `FavoriteButton` needs an authenticated `useAuth()`, mirroring
// `FavoriteButton.test.tsx`'s established `vi.mock` convention.
const mockUseAuth = vi.fn(() => ({
  user: { id: 'story-user-001', preferred_currency: 'EUR' },
  status: 'authenticated' as const,
  loading: false,
  signOut: () => {},
  refreshUser: () => {},
}))
vi.mock('@/modules/auth/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

function loadMessages(locale: string) {
  return JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf-8'))
}

beforeAll(() => {
  // AppImage's predictive-preload hook (usePredictivePreload) constructs a real
  // IntersectionObserver on mount — jsdom does not implement it. Stubbed here for this
  // test file only; no product code is touched.
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error -- test-only global stub, jsdom has no IntersectionObserver
  global.IntersectionObserver = IntersectionObserverStub

  // jsdom has no matchMedia — MantineProvider's color-scheme detection needs it
  // (same stub convention as MantinePagination.smoke.test.tsx).
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

const BASE_LISTING: CardListingData = {
  id: 'listing-1',
  public_id: 1234,
  slug: 'modern-apartment-tirana',
  title: 'Modern Apartment in Tirana',
  price: 80000,
  currency: 'EUR',
  listing_type: 'sale',
  property_type: 'apartment',
  is_premium: false,
  status: 'active',
  created_at: '2020-01-01T00:00:00.000Z',
  images: [
    { url: 'https://example.com/photo-1.jpg', is_cover: true, order: 0 },
    { url: 'https://example.com/photo-2.jpg', is_cover: false, order: 1 },
  ],
  location: { id: 1, name_al: 'Tiranë, Shqipëri', slug: 'tirane', type: 'city' },
  area_gross: 80,
  bedrooms: 2,
  bathrooms: 1,
}

function renderCard(listing: CardListingData, locale = 'en', props: Partial<React.ComponentProps<typeof ListingCard>> = {}) {
  const messages = loadMessages(locale)
  return render(
    <MantineProvider theme={theme}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
        <ListingCard listing={listing} {...props} />
      </NextIntlClientProvider>
    </MantineProvider>,
  )
}

describe('ListingCard — vertical branch (Mantine pattern, default)', () => {
  it('renders the preserved content set through MantineListingCardPattern', () => {
    renderCard(BASE_LISTING)

    // Title + type label
    expect(screen.getByText('Modern Apartment in Tirana')).toBeInTheDocument()
    expect(screen.getByText('For sale · Apartment')).toBeInTheDocument()

    // Price (no old price -> no strike-through case)
    expect(screen.getByText('80,000 EUR')).toBeInTheDocument()

    // Location
    expect(screen.getByText('Tiranë, Shqipëri')).toBeInTheDocument()

    // Features row (area_gross -> "80 m²", bedrooms -> "2")
    expect(screen.getByText('80 m²')).toBeInTheDocument()

    // Photo count (2 images)
    expect(screen.getByText('2')).toBeInTheDocument()

    // Copy-ID button (public_id)
    expect(screen.getByLabelText('Copy listing ID')).toBeInTheDocument()
    expect(screen.getByText('#1234')).toBeInTheDocument()

    // Nav wrapper — Link with tracking attributes, no <a> lost
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/en/listings/modern-apartment-tirana')
    expect(link).toHaveAttribute('data-track', 'listing_click')
    expect(link).toHaveAttribute('data-listing-slug', 'modern-apartment-tirana')

    // Favorite button present (real FavoriteButton, not dropped)
    expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument()
  })

  it('reduced-price listing (price_old > price) shows old price struck through + new price', () => {
    renderCard({ ...BASE_LISTING, price: 80000, price_old: 92000 })

    expect(screen.getByText('80,000 EUR')).toBeInTheDocument()
    const oldPrice = screen.getByText('92,000 EUR')
    expect(oldPrice).toBeInTheDocument()
    expect(oldPrice).toHaveClass('mantine-Text-root')
    expect(oldPrice.style.textDecoration || getComputedStyle(oldPrice).textDecorationLine).toMatch(/line-through/)

    // price_reduced badge
    expect(screen.getByText('Price reduced')).toBeInTheDocument()
  })

  it('plain-price listing shows no strike-through element', () => {
    renderCard(BASE_LISTING)
    expect(screen.queryByText('92,000 EUR')).not.toBeInTheDocument()
    expect(screen.queryByText('Price reduced')).not.toBeInTheDocument()
  })

  it.each([
    ['equal to price', 80000],
    ['below price', 70000],
  ])('Task 912: price_old %s → no struck old price, no badge', (_label, priceOld) => {
    const { container } = renderCard({ ...BASE_LISTING, price: 80000, price_old: priceOld })

    expect(screen.queryByText('Price reduced')).not.toBeInTheDocument()
    const struck = Array.from(container.querySelectorAll<HTMLElement>('*')).filter(el =>
      /line-through/.test(el.style.textDecoration || getComputedStyle(el).textDecorationLine),
    )
    expect(struck).toHaveLength(0)
    expect(screen.queryByText(/70,000/)).not.toBeInTheDocument()
  })

  it.each([
    ['equal to price', 80000],
    ['below price', 70000],
  ])('Task 912: horizontal variant, price_old %s → no struck old price, no badge', (_label, priceOld) => {
    const { container } = renderCard({ ...BASE_LISTING, price: 80000, price_old: priceOld }, 'en', { variant: 'horizontal' })

    expect(screen.queryByText('Price reduced')).not.toBeInTheDocument()
    const struck = Array.from(container.querySelectorAll<HTMLElement>('*')).filter(el =>
      /line-through/.test(el.style.textDecoration || getComputedStyle(el).textDecorationLine),
    )
    expect(struck).toHaveLength(0)
  })

  it('Task 912: converted reduced listing → struck value is the converted old price', () => {
    const rates: ExchangeRates = { ALL: 1, EUR: 100 }
    const { container } = renderCard(
      { ...BASE_LISTING, price: 80000, price_old: 92000 },
      'en',
      { displayCurrency: 'ALL', rates },
    )

    const struck = Array.from(container.querySelectorAll<HTMLElement>('*')).filter(el =>
      /line-through/.test(el.style.textDecoration || getComputedStyle(el).textDecorationLine),
    )
    expect(struck).toHaveLength(1)
    // 92 000 EUR × 100 = 9 200 000 ALL — not the unconverted 92 000
    expect(struck[0].textContent).toMatch(/9[, .]?200[, .]?000/)
    expect(screen.getByText('Price reduced')).toBeInTheDocument()
  })

  it('sold listing: favorite disabled with disabledLabel, closed overlay renders, nav still allowed', () => {
    renderCard({ ...BASE_LISTING, status: 'sold' })

    expect(screen.getByText('SOLD')).toBeInTheDocument()
    const favorite = screen.getByLabelText('This listing has been sold')
    expect(favorite).toBeDisabled()

    // Navigation is still wired (Link present with correct href)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/en/listings/modern-apartment-tirana')
  })

  // Task 886 R40: the pattern owns the closed-listing overlay colour (`overlay.tone`).
  it('sold listing: the overlay carries the pattern\'s sold class, not the rented one', () => {
    renderCard({ ...BASE_LISTING, status: 'sold' })
    const label = screen.getByText('SOLD')
    expect(label.className).toMatch(/overlaySold/)
    expect(label.className).not.toMatch(/overlayRented/)
  })

  it('rented listing: the overlay carries the pattern\'s rented class, not the sold one', () => {
    renderCard({ ...BASE_LISTING, status: 'rented' })
    const label = screen.getByText('RENTED')
    expect(label.className).toMatch(/overlayRented/)
    expect(label.className).not.toMatch(/overlaySold/)
  })

  it('no-image listing renders the fallback, not a broken image', () => {
    const { container } = renderCard({ ...BASE_LISTING, images: [] })
    // Task 886 R21: the fallback is AppImage's canonical MediaPlaceholder (role="img"), so assert on the <img> element.
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByTestId('media-placeholder')).toBeInTheDocument()
  })

  it('archived listing renders the archived badge + dimmed card (Task 605 — pattern-owned badges/isArchived)', () => {
    renderCard({ ...BASE_LISTING, status: 'archived' })

    expect(screen.getByText('Archived')).toBeInTheDocument()
    const link = screen.getByRole('link')
    expect(link.querySelector('[class*="archived"]')).toBeInTheDocument()
  })

  it('favorite, photo counter, features, and footer actions all render through the pattern (Task 605 single-source proof)', () => {
    renderCard(BASE_LISTING)

    // Favorite (real FavoriteButton, passed as the `favorite` node)
    expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument()
    // Photo counter (pattern-owned, driven by `photoCount` data prop)
    expect(screen.getByText('2')).toBeInTheDocument()
    // Features row (pattern-owned, driven by `features` data prop)
    expect(screen.getByText('80 m²')).toBeInTheDocument()
    // Footer actions (copy-id + date, passed as the `footerActions` node)
    expect(screen.getByLabelText('Copy listing ID')).toBeInTheDocument()
  })
})

describe('ListingCard — horizontal branch (List view, MantineListingCardPattern layout="list", Task 608)', () => {
  it('renders the preserved content set through MantineListingCardPattern layout="list"', () => {
    renderCard(BASE_LISTING, 'en', { variant: 'horizontal' })

    // Title + type label
    expect(screen.getByText('Modern Apartment in Tirana')).toBeInTheDocument()
    expect(screen.getByText('For sale · Apartment')).toBeInTheDocument()

    // Price
    expect(screen.getByText('80,000 EUR')).toBeInTheDocument()

    // Location
    expect(screen.getByText('Tiranë, Shqipëri')).toBeInTheDocument()

    // Features row
    expect(screen.getByText('80 m²')).toBeInTheDocument()

    // Copy-ID button (public_id)
    expect(screen.getByLabelText('Copy listing ID')).toBeInTheDocument()
    expect(screen.getByText('#1234')).toBeInTheDocument()

    // Nav wrapper — Link with tracking attributes + the horizontal class marker
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/en/listings/modern-apartment-tirana')
    expect(link).toHaveAttribute('data-track', 'listing_click')
    expect(link).toHaveAttribute('data-listing-slug', 'modern-apartment-tirana')
    expect(link).toHaveClass('listing-card--horizontal')

    // Favorite control (real FavoriteButton, inline — not dropped by the migration)
    expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument()

    // Photo-count pill IS rendered in the list row (Task 656 — bottom-left, 2 fixture images)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('reduced-price listing shows old price struck through + the price_reduced badge', () => {
    renderCard({ ...BASE_LISTING, price: 80000, price_old: 92000 }, 'en', { variant: 'horizontal' })

    expect(screen.getByText('80,000 EUR')).toBeInTheDocument()
    const oldPrice = screen.getByText('92,000 EUR')
    expect(oldPrice).toBeInTheDocument()
    // Task 658: list-branch priceOld migrated to Mantine `Text td="line-through"` (a CSS
    // style prop, not the literal Tailwind `.line-through` class) — same computed-style
    // assertion already used for the vertical branch's equivalent case above.
    expect(oldPrice.style.textDecoration || getComputedStyle(oldPrice).textDecorationLine).toMatch(/line-through/)
    expect(screen.getByText('Price reduced')).toBeInTheDocument()
  })

  it('sold listing: favorite disabled with disabledLabel, badge shows, nav still allowed', () => {
    renderCard({ ...BASE_LISTING, status: 'sold' }, 'en', { variant: 'horizontal' })

    expect(screen.getByText('Sold')).toBeInTheDocument()
    const favorite = screen.getByLabelText('This listing has been sold')
    expect(favorite).toBeDisabled()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/en/listings/modern-apartment-tirana')
  })

  it('no-image listing renders the fallback, not a broken image', () => {
    const { container } = renderCard({ ...BASE_LISTING, images: [] }, 'en', { variant: 'horizontal' })
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByTestId('media-placeholder')).toBeInTheDocument()
  })

  it('archived listing renders the archived badge + dimmed card', () => {
    renderCard({ ...BASE_LISTING, status: 'archived' }, 'en', { variant: 'horizontal' })

    expect(screen.getByText('Archived')).toBeInTheDocument()
    const link = screen.getByRole('link')
    expect(link.querySelector('[class*="archived"]')).toBeInTheDocument()
  })
})

describe('ListingCard — no save-to-collection control on cards (Task 886 R34, owner O83-1)', () => {
  // Critical flow "Listing card rendering" (docs/critical-flow-registry.md): save-to-collection lives only
  // on the listing-detail page, never on a card (favorites, the heart, is a separate control).
  it('a vertical grid card renders no Save to collection control', () => {
    renderCard(BASE_LISTING, 'en', { isFavorited: true })

    expect(screen.queryByRole('button', { name: 'Save to collection' })).toBeNull()
  })
})

describe('ListingCard — hydration-safety (always-en grouping, no locale-dependent Intl at render)', () => {
  it('originalPriceStr uses always-en grouping when currency conversion is active (sq locale)', () => {
    const rates: ExchangeRates = { ALL: 1, EUR: 100 }
    renderCard(
      { ...BASE_LISTING, currency: 'EUR' },
      'sq',
      { displayCurrency: 'ALL', rates },
    )
    // "80,000 EUR" — comma grouping (always-'en'), never sq's space/NBSP grouping.
    expect(screen.getByText('80,000 EUR')).toBeInTheDocument()
  })
})
