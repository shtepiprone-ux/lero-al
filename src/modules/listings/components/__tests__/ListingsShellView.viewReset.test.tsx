/**
 * Task 741 Revision 3b (R37 / R41, owner decision D46-3) — below `sm` (640px) the List view is never rendered:
 * `ListingsShellView` switches the view state to `grid` once and renders the grid track. At `sm` or more it renders
 * what `view` says. The View never calls `onViewChange('list')`.
 *
 * Heavy children (filter bar, status tabs, chips, action row, pagination, drawer) are mocked: they are proven by
 * their own Stories and are not under test here. `ListingCard` stays real so `.listing-card--horizontal` is the
 * production list-card hook.
 */
import React from 'react'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { render, act } from '@testing-library/react'
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

let viewportIsBelowSm = false
// Every `change` listener the Mantine media-query hook registers, with its query (R43).
let changeListeners: { query: string; cb: (e: { matches: boolean }) => void }[] = []

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
  changeListeners = []
  // `(min-width: 40em)` is the `sm` breakpoint. Below sm no `min-width` query matches.
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: viewportIsBelowSm ? false : query.includes('min-width'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((type: string, cb: (e: { matches: boolean }) => void) => {
        if (type === 'change') changeListeners.push({ query, cb })
      }),
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
    total: 1,
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
    showLoadMore: false,
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

function renderView(props: ListingsShellViewProps) {
  const messages = JSON.parse(readFileSync(join(process.cwd(), 'messages', 'en.json'), 'utf-8'))
  const tree = (p: ListingsShellViewProps) => (
    <MantineProvider theme={theme}>
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <ListingsShellView {...p} />
      </NextIntlClientProvider>
    </MantineProvider>
  )
  const result = render(tree(props))
  return { ...result, rerenderWith: (p: ListingsShellViewProps) => result.rerender(tree(p)) }
}

describe('ListingsShellView — list view never renders below sm (Task 741 R37, D46-3)', () => {
  it('below sm with view="list": calls onViewChange("grid") and renders no horizontal card', () => {
    viewportIsBelowSm = true
    const onViewChange = vi.fn()
    const { container } = renderView(buildProps({ view: 'list', onViewChange }))

    expect(onViewChange).toHaveBeenCalledWith('grid')
    expect(onViewChange).not.toHaveBeenCalledWith('list')
    expect(container.querySelector('.listing-card--horizontal')).toBeNull()
  })

  it('at sm or more with view="list": does not call onViewChange and renders the horizontal cards', () => {
    viewportIsBelowSm = false
    const onViewChange = vi.fn()
    const { container } = renderView(buildProps({ view: 'list', onViewChange }))

    expect(onViewChange).not.toHaveBeenCalled()
    expect(container.querySelector('.listing-card--horizontal')).not.toBeNull()
  })

  it('below sm with view="grid" at mount: no onViewChange call', () => {
    viewportIsBelowSm = true
    const onViewChange = vi.fn()
    renderView(buildProps({ view: 'grid', onViewChange }))

    expect(onViewChange).not.toHaveBeenCalled()
  })

  it('after the switch, a re-render at sm or more with view="grid" never calls onViewChange("list")', () => {
    viewportIsBelowSm = true
    const onViewChange = vi.fn()
    const { rerenderWith, container } = renderView(buildProps({ view: 'list', onViewChange }))
    expect(onViewChange).toHaveBeenCalledTimes(1)
    expect(onViewChange).toHaveBeenCalledWith('grid')

    // The viewport grows to sm or more: Mantine's `useMediaQuery` reads `event.matches` from each `change` listener.
    viewportIsBelowSm = false
    expect(changeListeners.length).toBeGreaterThan(0)
    act(() => {
      for (const { query, cb } of changeListeners) cb({ matches: query.includes('min-width') })
    })
    // Proof the hook now sees sm or more: the list view the parent still holds would render horizontal cards.
    rerenderWith(buildProps({ view: 'list', onViewChange }))
    expect(container.querySelector('.listing-card--horizontal')).not.toBeNull()

    rerenderWith(buildProps({ view: 'grid', onViewChange }))

    expect(onViewChange).toHaveBeenCalledTimes(1)
    expect(onViewChange).not.toHaveBeenCalledWith('list')
    expect(container.querySelector('.listing-card--horizontal')).toBeNull()
  })
})
