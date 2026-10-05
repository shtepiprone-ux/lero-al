/**
 * Task 741 Revision 3e (R51, owner decisions D46-6 / D46-7) — `ListingsShellView` states.
 * "Show more" is the canonical theme `Button` (`variant="filled"`, Mantine `loading` marks `data-loading`); the empty
 * branch renders `MantineEmptyLoadingErrorState` (no emoji). Heavy children are mocked as in
 * `ListingsShellView.viewReset.test.tsx`: they are proven by their own Stories.
 */
import React from 'react'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { readFileSync } from 'fs'
import { join } from 'path'
import { theme } from '@/design-system/mantine/theme'
import { ListingsShellView, type ListingsShellViewProps } from '../ListingsShellView'
import type { CardListingData } from '../ListingCard'

vi.mock('@/modules/auth/context/AuthContext', () => ({
  useAuth: () => ({ user: null, status: 'unauthenticated' as const, loading: false, signOut: () => {}, refreshUser: () => {} }),
}))
vi.mock('@/modules/listings/components/ListingsFilterBar', () => ({ ListingsFilterBar: () => null }))
vi.mock('@/modules/listings/components/ListingsStatusTabs', () => ({ ListingsStatusTabs: () => null }))
vi.mock('@/modules/listings/components/ActiveFilterChips', () => ({ ActiveFilterChips: () => null }))
vi.mock('@/modules/listings/components/ListingsActionRow', () => ({ ListingsActionRow: () => null }))
vi.mock('@/modules/listings/components/ListingsPagination', () => ({ ListingsPagination: () => null }))
vi.mock('@/design-system/mantine/patterns', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  MantineDrawer: () => null,
}))

beforeAll(() => {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error -- test-only global stub, jsdom has no IntersectionObserver
  global.IntersectionObserver = IntersectionObserverStub
})

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('min-width'),
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

const LISTING: CardListingData = {
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
  images: [{ url: 'https://example.com/photo-1.jpg', is_cover: true, order: 0 }],
  location: { id: 1, name_al: 'Tiranë, Shqipëri', slug: 'tirane', type: 'city' },
  area_gross: 80,
  bedrooms: 2,
  bathrooms: 1,
}

function buildProps(overrides: Partial<ListingsShellViewProps>): ListingsShellViewProps {
  return {
    listings: [LISTING],
    total: 40,
    page: 1,
    perPage: 20,
    locations: [],
    tab: 'active',
    activeFiltersCount: 0,
    displayCurrency: 'EUR',
    rates: null,
    favoriteIds: new Set(),
    view: 'grid',
    filtersOpen: false,
    isLoadingMore: false,
    showLoadMore: true,
    onViewChange: () => {},
    onFiltersOpenChange: () => {},
    onFiltersOpen: () => {},
    onShowMore: () => {},
    onBeforeNavigate: () => {},
    onFavoriteToggled: () => {},
    filtersSlot: null,
    saveSearchSlot: null,
    ...overrides,
  }
}

const messages = JSON.parse(readFileSync(join(process.cwd(), 'messages', 'en.json'), 'utf-8'))

function renderView(props: ListingsShellViewProps) {
  return render(
    <MantineProvider theme={theme}>
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <ListingsShellView {...props} />
      </NextIntlClientProvider>
    </MantineProvider>,
  )
}

describe('ListingsShellView — "Show more" is the canonical primary Button (Task 741 R46/R51, D46-7)', () => {
  it('renders a filled Mantine Button, not loading by default', () => {
    renderView(buildProps({}))
    const button = screen.getByRole('button', { name: messages.listing.show_more })
    expect(button.getAttribute('data-variant')).toBe('filled')
    expect(button.hasAttribute('data-loading')).toBe(false)
  })

  it('with isLoadingMore the button carries data-loading', () => {
    renderView(buildProps({ isLoadingMore: true }))
    const button = screen.getByRole('button', { name: messages.listing.show_more })
    expect(button.getAttribute('data-variant')).toBe('filled')
    expect(button.hasAttribute('data-loading')).toBe(true)
  })
})

describe('ListingsShellView — empty branch is the canonical empty state (Task 741 R47/R51)', () => {
  it('an empty closed tab renders the no_results_closed title through the pattern, and no house emoji', () => {
    const { container } = renderView(buildProps({ listings: [], total: 0, tab: 'closed', showLoadMore: false }))
    expect(screen.getByText(messages.listing.no_results_closed)).toBeTruthy()
    expect(screen.queryByText(messages.listing.no_results_desc)).toBeNull()
    expect(container.textContent).not.toContain('🏠')
  })

  it('an empty active tab renders title and description, and no house emoji', () => {
    const { container } = renderView(buildProps({ listings: [], total: 0, tab: 'active', showLoadMore: false }))
    expect(screen.getByText(messages.listing.no_results_title)).toBeTruthy()
    expect(screen.getByText(messages.listing.no_results_desc)).toBeTruthy()
    expect(container.textContent).not.toContain('🏠')
  })
})
