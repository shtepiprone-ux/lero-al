/**
 * Task 965 Revision 1, AC8 (R1-2) — every renderer of `ListingCard` that a server page feeds hands the page's `now` to each card, so the `new` badge of the server HTML and
 * of the browser's first render come from the same instant. `ListingCard` is a recording double here: what is read is the prop each renderer gives it.
 * (`ListingCard.hydration.test.tsx` proves the card itself; `src/app/__tests__/serverNowProps.test.tsx` proves the pages hand `now` to these renderers.)
 */
import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { readFileSync } from 'fs'
import { join } from 'path'
import { theme } from '@/design-system/mantine/theme'
import type { CardListingData } from '../ListingCard'
import { FavoritesShell } from '../FavoritesShell'
import { ListingsShellView, type ListingsShellViewProps } from '../ListingsShellView'
import { SimilarListingsView } from '../SimilarListingsView'

const seen = vi.hoisted(() => ({ nows: [] as (string | undefined)[] }))

vi.mock('@/modules/listings/components/ListingCard', () => ({
  ListingCard: (props: { now?: string }) => {
    seen.nows.push(props.now)
    return null
  },
}))
vi.mock('@/modules/auth/context/AuthContext', () => ({
  useAuth: () => ({ user: null, status: 'unauthenticated' as const, loading: false, signOut: () => {}, refreshUser: () => {} }),
}))
vi.mock('@/hooks/useExchangeRate', () => ({ useExchangeRate: () => ({ rates: null }) }))
vi.mock('@/modules/listings/hooks/useFavoritesRealtime', () => ({ useFavoritesRealtime: () => {} }))
vi.mock('@/modules/listings/components/FavoritesTypeFilter', () => ({ FavoritesTypeFilter: () => null }))
vi.mock('@/modules/listings/components/ListingsPagination', () => ({ ListingsPagination: () => null }))
vi.mock('@/modules/listings/components/CollectionsSection', () => ({ CollectionsSection: () => null }))
vi.mock('@/modules/listings/components/ListingsFilterBar', () => ({ ListingsFilterBar: () => null }))
vi.mock('@/modules/listings/components/ListingsStatusTabs', () => ({ ListingsStatusTabs: () => null }))
vi.mock('@/modules/listings/components/ActiveFilterChips', () => ({ ActiveFilterChips: () => null }))
vi.mock('@/modules/listings/components/ListingsActionRow', () => ({ ListingsActionRow: () => null }))
vi.mock('@/design-system/mantine/patterns', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  MantineDrawer: () => null,
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/sq/favorites',
  useSearchParams: () => new URLSearchParams(),
}))

const NOW = '2026-11-12T10:00:00.000Z'
const messages = JSON.parse(readFileSync(join(process.cwd(), 'messages', 'en.json'), 'utf-8'))

const LISTING: CardListingData = {
  id: 'listing-1', public_id: 1234, slug: 'modern-apartment-tirana', title: 'Modern Apartment in Tirana', price: 80000, currency: 'EUR', listing_type: 'sale',
  property_type: 'apartment', is_premium: false, status: 'active', created_at: '2026-11-10T00:00:00.000Z',
}

beforeEach(() => {
  seen.nows.length = 0
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('min-width'), media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
})

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme}>
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">{children}</NextIntlClientProvider>
    </MantineProvider>
  )
}

function viewProps(overrides: Partial<ListingsShellViewProps>): ListingsShellViewProps {
  return {
    listings: [LISTING, { ...LISTING, id: 'listing-2' }], total: 2, page: 1, perPage: 20, locations: [], tab: 'active', activeFiltersCount: 0, displayCurrency: 'EUR', rates: null,
    favoriteIds: new Set(), view: 'grid', filtersOpen: false, isLoadingMore: false, showLoadMore: false, onViewChange: () => {}, onFiltersOpenChange: () => {}, onFiltersOpen: () => {},
    onShowMore: () => {}, onBeforeNavigate: () => {}, onFavoriteToggled: () => {}, filtersSlot: null, saveSearchSlot: null, ...overrides,
  }
}

describe('Task 965 R1-2 AC8 — the renderers of ListingCard hand the page `now` to every card', () => {
  it('FavoritesShell', () => {
    render(
      <Providers>
        <FavoritesShell listings={[LISTING, { ...LISTING, id: 'listing-2' }]} userId="u-1" typeCounts={{ apartment: 2 }} page={1} perPage={12} initialCollections={[]} now={NOW} />
      </Providers>,
    )
    expect(seen.nows).toEqual([NOW, NOW])
  })

  it('ListingsShellView, grid and list layouts', () => {
    render(<Providers><ListingsShellView {...viewProps({ view: 'grid', now: NOW })} /></Providers>)
    expect(seen.nows).toEqual([NOW, NOW])
    seen.nows.length = 0
    render(<Providers><ListingsShellView {...viewProps({ view: 'list', now: NOW })} /></Providers>)
    expect(seen.nows).toEqual([NOW, NOW])
  })

  it('SimilarListingsView', () => {
    render(
      <Providers>
        <SimilarListingsView heading="Similar" listings={[LISTING, { ...LISTING, id: 'listing-2' }]} rates={null} displayCurrency="ALL" now={NOW} />
      </Providers>,
    )
    expect(seen.nows).toEqual([NOW, NOW])
  })

  it('a renderer with no `now` (a client-only list) hands none: the card falls back to the browser clock after hydration', () => {
    render(<Providers><SimilarListingsView heading="Similar" listings={[LISTING]} rates={null} displayCurrency="ALL" /></Providers>)
    render(<Providers><ListingsShellView {...viewProps({})} /></Providers>)
    expect(seen.nows.every(now => now === undefined)).toBe(true)
    expect(seen.nows.length).toBeGreaterThan(0)
  })
})
