/**
 * Task 953 (AC3), the listing shells: FavoritesShell, ListingsShell and the cabinet ListingsTab. The behaviour the React Compiler rules touched, pinned BEFORE the
 * findings were fixed and kept green after: the local copy of a server list follows the props the server sends, live changes stay until then, and the position
 * restored from the session is applied once. The real shell renders; its children, the realtime hook and the network are doubles that expose what they receive.
 */
import React from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../messages/en.json'

const state = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
  push: vi.fn(),
  favoritesEvent: null as null | ((event: unknown) => void),
  favoritesIdsRef: null as null | { readonly current: ReadonlySet<string> },
  cabinetEvent: null as null | ((event: unknown) => void),
  viewProps: null as null | Record<string, unknown>,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: state.push, refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/en/cabinet',
  useSearchParams: () => state.searchParams,
}))
vi.mock('next/dynamic', () => ({ default: () => () => null }))
vi.mock('next/link', () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/hooks/useExchangeRate', () => ({ useExchangeRate: () => ({ rates: null, rate: null, loading: false }) }))
vi.mock('@/modules/auth/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u1', preferred_currency: 'EUR' } }) }))
vi.mock('@/modules/listings/hooks/useFavoritesRealtime', () => ({
  useFavoritesRealtime: (options: { onEvent: (event: unknown) => void; displayedIdsRef: { readonly current: ReadonlySet<string> } }) => {
    state.favoritesEvent = options.onEvent
    state.favoritesIdsRef = options.displayedIdsRef
  },
}))
vi.mock('@/modules/cabinet/hooks/useCabinetListingsRealtime', () => ({
  useCabinetListingsRealtime: (options: { onEvent: (event: unknown) => void }) => { state.cabinetEvent = options.onEvent },
}))
vi.mock('@/modules/listings/components/ListingCard', () => ({
  ListingCard: ({ listing }: { listing: { id: string; title: string } }) => <div data-testid="card" data-listing-slug={listing.id}>{listing.title}</div>,
}))
vi.mock('@/modules/listings/components/FavoritesTypeFilter', () => ({
  FavoritesTypeFilter: ({ typeCounts }: { typeCounts: Record<string, number> }) => <div data-testid="counts">{JSON.stringify(typeCounts)}</div>,
}))
vi.mock('@/modules/listings/components/ListingsPagination', () => ({
  ListingsPagination: ({ total }: { total: number }) => <div data-testid="pagination-total">{total}</div>,
}))
vi.mock('@/modules/listings/components/CollectionsSection', () => ({ CollectionsSection: () => null }))
vi.mock('@/design-system/mantine/patterns/MantineListingCardTrack', () => ({ MantineListingCardTrack: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }))
vi.mock('@/modules/listings/components/ListingsShellView', () => ({
  ListingsShellView: (props: Record<string, unknown>) => {
    state.viewProps = props
    const listings = props.listings as Array<{ id: string; title: string }>
    return (
      <div>
        {listings.map(l => <div key={l.id} data-testid="row" data-listing-slug={l.id}>{l.title}</div>)}
        <div data-testid="favorites">{Array.from(props.favoriteIds as ReadonlySet<string>).sort().join(',')}</div>
        <button type="button" onClick={() => (props.onFavoriteToggled as (id: string, on: boolean) => void)('l9', true)}>favorite l9</button>
        <button type="button" onClick={() => (props.onShowMore as () => void)()}>more</button>
        <button type="button" onClick={() => (props.onBeforeNavigate as (slug: string) => void)('l1')}>leave</button>
        <div data-testid="show-more">{String(props.showLoadMore)}</div>
      </div>
    )
  },
}))

import { FavoritesShell } from '@/modules/listings/components/FavoritesShell'
import { ListingsShell } from '@/modules/listings/components/ListingsShell'
import { ListingsTab } from '@/modules/cabinet/components/ListingsTab'

const listing = (id: string, title: string, over: Record<string, unknown> = {}) => ({
  id, slug: id, title, price: 1000, currency: 'EUR', listing_type: 'sale', property_type: 'apartment', is_premium: false, status: 'active',
  created_at: '2026-09-27T14:30:00.000Z', images: [], location: null, ...over,
})
const wrap = (node: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    <MantineProvider theme={theme} env="test">{node}</MantineProvider>
  </NextIntlClientProvider>
)

beforeEach(() => {
  state.searchParams = new URLSearchParams()
  state.push.mockReset()
  state.favoritesEvent = null
  state.favoritesIdsRef = null
  state.cabinetEvent = null
  state.viewProps = null
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  Element.prototype.scrollIntoView = vi.fn()
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => { cb(0); return 0 }) as typeof window.requestAnimationFrame
  sessionStorage.clear()
  vi.mocked(global.fetch).mockReset()
})
// setup.ts installs the guarded `fetch` with vi.stubGlobal; unstubbing my own stubs would drop it too, so it is put back.
const guardedFetch = global.fetch
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.stubGlobal('fetch', guardedFetch)
})

// ── src/modules/listings/components/FavoritesShell.tsx (set-state-in-effect) ──────────────────────────────────────────────────

describe('FavoritesShell', () => {
  const shell = (listings: ReturnType<typeof listing>[], typeCounts: Record<string, number>, over: Record<string, unknown> = {}) => wrap(
    <FavoritesShell listings={listings as never} userId="u1" typeFilter={undefined} typeCounts={typeCounts} page={1} perPage={25} initialCollections={[]} {...over} />,
  )
  const titles = () => screen.queryAllByTestId('card').map(c => c.textContent)

  it('shows the listings it was given and replaces them, with the counts, when the server sends new ones', () => {
    const view = render(shell([listing('a', 'Flat A'), listing('b', 'Flat B')], { apartment: 2 }))
    expect(titles()).toEqual(['Flat A', 'Flat B'])
    expect(screen.getByTestId('counts')).toHaveTextContent('{"apartment":2}')
    view.rerender(shell([listing('c', 'Flat C')], { apartment: 1 }))
    expect(titles()).toEqual(['Flat C'])
    expect(screen.getByTestId('counts')).toHaveTextContent('{"apartment":1}')
  })

  it('a realtime delete removes the card and lowers the count; the server list, unchanged, does not bring it back', () => {
    const listings = [listing('a', 'Flat A'), listing('b', 'Flat B')]
    const counts = { apartment: 2 }
    const view = render(shell(listings, counts))
    act(() => state.favoritesEvent!({ type: 'DELETE', listingId: 'a' }))
    expect(titles()).toEqual(['Flat B'])
    expect(screen.getByTestId('counts')).toHaveTextContent('{"apartment":1}')
    view.rerender(shell(listings, counts))
    expect(titles()).toEqual(['Flat B'])
  })

  it('a realtime insert adds the card at the top and raises the count of its type, also when the type is filtered out', () => {
    const view = render(shell([listing('a', 'Flat A')], { apartment: 1 }))
    act(() => state.favoritesEvent!({ type: 'INSERT', listing: listing('n', 'Flat N') }))
    expect(titles()).toEqual(['Flat N', 'Flat A'])
    expect(screen.getByTestId('counts')).toHaveTextContent('{"apartment":2}')
    view.rerender(shell([listing('a', 'Flat A')], { apartment: 1 }, { typeFilter: 'house' }))
    act(() => state.favoritesEvent!({ type: 'INSERT', listing: listing('h', 'Flat H', { property_type: 'apartment' }) }))
    expect(screen.getByTestId('counts')).toHaveTextContent('{"apartment":2}')
    expect(titles()).toEqual(['Flat A'])
  })

  it('tells the realtime hook which listings are on screen', () => {
    const view = render(shell([listing('a', 'Flat A'), listing('b', 'Flat B')], { apartment: 2 }))
    expect(Array.from(state.favoritesIdsRef!.current).sort()).toEqual(['a', 'b'])
    view.rerender(shell([listing('c', 'Flat C')], { apartment: 1 }))
    expect(Array.from(state.favoritesIdsRef!.current)).toEqual(['c'])
  })

  it('shows the error state when the server could not read the list, and the empty state with no favorites', () => {
    const failed = render(shell([], { apartment: 3 }, { error: true }))
    expect(screen.getByText(messages.favorites.error_title)).toBeInTheDocument()
    failed.unmount()
    render(shell([], {}))
    expect(screen.getByText(messages.favorites.empty_title)).toBeInTheDocument()
  })
})

// ── src/modules/listings/components/ListingsShell.tsx (set-state-in-effect) ───────────────────────────────────────────────────

describe('ListingsShell', () => {
  const shell = (listings: ReturnType<typeof listing>[], over: Record<string, unknown> = {}) => wrap(
    <ListingsShell listings={listings as never} total={50} page={1} locations={[]} activeFiltersCount={0} tab="active" favoriteIds={['l1']} {...over} />,
  )
  const rows = () => screen.queryAllByTestId('row').map(r => r.textContent)
  const answerWith = (batch: ReturnType<typeof listing>[]) =>
    vi.mocked(global.fetch).mockResolvedValue({ ok: true, json: async () => ({ listings: batch }) } as Response)

  it('starts from the favorite ids of the server, adds a toggled one, and takes the new ids when the server sends them', () => {
    const view = render(shell([listing('l1', 'One')]))
    expect(screen.getByTestId('favorites')).toHaveTextContent('l1')
    fireEvent.click(screen.getByText('favorite l9'))
    expect(screen.getByTestId('favorites')).toHaveTextContent('l1,l9')
    view.rerender(shell([listing('l1', 'One')], { favoriteIds: ['l2'] }))
    expect(screen.getByTestId('favorites')).toHaveTextContent('l2')
    expect(screen.getByTestId('favorites')).not.toHaveTextContent('l9')
  })

  it('keeps a toggled favorite while the server ids are the same array', () => {
    const favoriteIds = ['l1']
    const view = render(shell([listing('l1', 'One')], { favoriteIds }))
    fireEvent.click(screen.getByText('favorite l9'))
    view.rerender(shell([listing('l1', 'One')], { favoriteIds }))
    expect(screen.getByTestId('favorites')).toHaveTextContent('l1,l9')
  })

  it('appends the next page on "show more", and drops the appended listings when the filters in the URL change', async () => {
    answerWith([listing('l2', 'Two')])
    const view = render(shell([listing('l1', 'One')]))
    await act(async () => { fireEvent.click(screen.getByText('more')) })
    await waitFor(() => expect(rows()).toEqual(['One', 'Two']))
    expect(vi.mocked(global.fetch).mock.calls[0][0]).toBe('/api/listings?page=2')

    view.rerender(shell([listing('l1', 'One')]))
    expect(rows()).toEqual(['One', 'Two'])

    state.searchParams = new URLSearchParams('type=house')
    view.rerender(shell([listing('l1', 'One')]))
    expect(rows()).toEqual(['One'])
  })

  it('remembers where the person left (URL, listing, pages loaded) for the way back', () => {
    render(shell([listing('l1', 'One')]))
    fireEvent.click(screen.getByText('leave'))
    const saved = JSON.parse(sessionStorage.getItem('listings_restore')!)
    expect(saved).toMatchObject({ slug: 'l1', extraPage: 0 })
    expect(typeof saved.returnUrl).toBe('string')
  })

  it('on the way back it restores the position once: reloads the extra pages, scrolls to the listing and removes the saved value', async () => {
    sessionStorage.setItem('listings_restore', JSON.stringify({ returnUrl: 'http://localhost/en/listings', slug: 'l2', extraPage: 1 }))
    answerWith([listing('l2', 'Two')])
    render(shell([listing('l1', 'One')]))
    await waitFor(() => expect(rows()).toEqual(['One', 'Two']))
    expect(sessionStorage.getItem('listings_restore')).toBeNull()
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' }))
  })

  it('on the way back with no extra pages it only scrolls, and ignores a saved value that is not JSON', async () => {
    sessionStorage.setItem('listings_restore', JSON.stringify({ returnUrl: 'http://localhost/en/listings', slug: 'l1', extraPage: 0 }))
    const first = render(shell([listing('l1', 'One')]))
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled())
    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
    first.unmount()
    vi.mocked(Element.prototype.scrollIntoView).mockClear()
    sessionStorage.setItem('listings_restore', 'not json')
    render(shell([listing('l1', 'One')]))
    expect(rows()).toEqual(['One'])
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })
})

// ── src/modules/cabinet/components/ListingsTab.tsx (set-state-in-effect) ──────────────────────────────────────────────────────

describe('ListingsTab', () => {
  const tab = (listings: ReturnType<typeof listing>[]) => wrap(
    <ListingsTab listings={listings as never} locale="en" initialFilter="ALL" initialPremium={false} userId="u1" />,
  )
  const present = (title: string) => screen.queryAllByText(title).length > 0

  it('shows the server listings; a live change shows at once and stays until the server sends a new list', () => {
    const listings = [listing('a', 'Flat A'), listing('b', 'Flat B')]
    const view = render(tab(listings))
    expect(present('Flat A')).toBe(true)
    act(() => state.cabinetEvent!({ type: 'UPDATE', listingId: 'a', patch: { title: 'Flat A live' } }))
    expect(present('Flat A live')).toBe(true)
    expect(present('Flat A')).toBe(false)

    view.rerender(tab(listings))
    expect(present('Flat A live')).toBe(true)

    view.rerender(tab([...listings]))
    expect(present('Flat A live')).toBe(false)
    expect(present('Flat A')).toBe(true)
  })

  it('a live delete removes the card, and it stays removed when the same server list is rendered again', () => {
    const listings = [listing('a', 'Flat A'), listing('b', 'Flat B')]
    const view = render(tab(listings))
    act(() => state.cabinetEvent!({ type: 'DELETE', listingId: 'a' }))
    expect(present('Flat A')).toBe(false)
    expect(present('Flat B')).toBe(true)
    view.rerender(tab(listings))
    expect(present('Flat A')).toBe(false)
  })
})
