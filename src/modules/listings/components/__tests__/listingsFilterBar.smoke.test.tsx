/**
 * ListingsFilterBar — Mantine migration smoke (Task 779).
 *
 * `ListingsFilterBar` is absent from `docs/critical-flow-registry.md` (kickoff §3.8) — this suite
 * is an orchestrator-chosen safeguard for a filter surface being rewritten, the same basis
 * `mobileBottomNav.smoke.test.tsx` records for `MobileBottomNav`, not a claimed
 * registry-membership obligation.
 *
 * Covers the URL-write contract the migration must not move (kickoff §3.3/§9/§12):
 * - T1/T2 (AC2): every filter change is exactly ONE `router.push`, preserving unrelated params,
 *   dropping `page`.
 * - T3 (AC3): property-type changes go through `handlePropertyTypeChange`, dropping dependent
 *   params for sections the new type does not show, in the same single push.
 * - T4/T5 (AC4): reset produces a bare `router.push(pathname)` with no query string; advanced
 *   filters calls `onFiltersOpen` and pushes nothing.
 * - T6 (AC5): the route visibility gate lives in `ListingsShellView`'s `<Box visibleFrom="md">`
 *   wrapper, not in `ListingsFilterBar` itself — precedent `mobileBottomNav.smoke.test.tsx:110-114`.
 * - T7: with `activeCount === 0` the reset control and the count badge are both absent.
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, fireEvent, cleanup, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { readFileSync } from 'fs'
import { join } from 'path'
import { theme } from '@/design-system/mantine/theme'
import { ListingsFilterBar } from '@/modules/listings/components/ListingsFilterBar'
import { ListingsShellView } from '@/modules/listings/components/ListingsShellView'
import type { ListingsShellViewProps } from '@/modules/listings/components/ListingsShellView'

const messages = JSON.parse(readFileSync(join(process.cwd(), 'messages', 'en.json'), 'utf-8'))

// ── next/navigation: mutable search string + a push spy, matching this file's per-test setup ──
let currentSearch = ''
const pushMock = vi.fn()
const PATHNAME = '/en/listings'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => PATHNAME,
  useSearchParams: () => new URLSearchParams(currentSearch),
}))

// ── Shared data-hook mocks (unrelated to this task's scope) ──────────────────────────────────
vi.mock('@/hooks/useExchangeRate', () => ({
  useExchangeRate: () => ({ rates: null, rate: null, loading: false }),
}))
vi.mock('@/hooks/usePropertyTypes', () => ({
  usePropertyTypes: () => ({
    propertyTypes: [
      { value: 'apartment', label: 'Apartment' },
      { value: 'commercial', label: 'Commercial' },
    ],
    loading: false,
  }),
}))
vi.mock('@/modules/currency/hooks/useCurrencies', () => ({
  useCurrencies: () => ({ currencies: [], loading: false }),
}))

// ── T6 only: mount the real ListingsShellView with its heavier siblings stubbed out — this
// suite is scoped to the filter bar + its visibility wrapper, not the rest of the shell. ──
vi.mock('@/modules/listings/components/ListingsSortBar', () => ({ ListingsSortBar: () => null }))
vi.mock('@/modules/listings/components/ListingsPagination', () => ({ ListingsPagination: () => null }))
vi.mock('@/modules/listings/components/ListingCard', () => ({ ListingCard: () => null }))
vi.mock('@/modules/listings/components/ActiveFilterChips', () => ({ ActiveFilterChips: () => null }))
vi.mock('@/modules/listings/components/ListingsStatusTabs', () => ({ ListingsStatusTabs: () => null }))
vi.mock('@/design-system/mantine/patterns', async importOriginal => {
  const actual = await importOriginal<typeof import('@/design-system/mantine/patterns')>()
  return { ...actual, MantineDrawer: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }
})

beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
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

afterEach(() => {
  cleanup()
  pushMock.mockClear()
  currentSearch = ''
})

function withProviders(children: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        {children}
      </MantineProvider>
    </NextIntlClientProvider>
  )
}

const locations = [{ id: 1, name_al: 'Tirana', type: 'city' }]

function renderBar(search: string) {
  currentSearch = search
  return render(withProviders(<ListingsFilterBar locations={locations} onFiltersOpen={vi.fn()} />))
}

/** Parses the last `router.push` argument as `{ pathname, params }`. */
function lastPush() {
  const arg = pushMock.mock.calls.at(-1)?.[0] as string
  const [pathname, query = ''] = arg.split('?')
  return { pathname, params: new URLSearchParams(query), raw: arg }
}

describe('ListingsFilterBar — T1 (AC2): listing-type change is one immediate push', () => {
  it('preserves sort/currency, drops page, sets type — exactly one push', () => {
    renderBar('sort=newest&currency=EUR&page=3')
    fireEvent.click(screen.getByText('For sale'))

    expect(pushMock).toHaveBeenCalledTimes(1)
    const { params } = lastPush()
    expect(params.get('sort')).toBe('newest')
    expect(params.get('currency')).toBe('EUR')
    expect(params.get('page')).toBeNull()
    expect(params.get('type')).toBe('sale')
  })

  it('selecting "All" deletes `type` rather than setting it to an empty string', () => {
    renderBar('type=sale')
    fireEvent.click(screen.getByText('All'))

    expect(pushMock).toHaveBeenCalledTimes(1)
    const { params, raw } = lastPush()
    expect(params.has('type')).toBe(false)
    expect(raw).not.toContain('type=')
  })

  it('no useState holds a filter value in ListingsFilterBar.tsx', () => {
    const src = readFileSync(
      join(process.cwd(), 'src/modules/listings/components/ListingsFilterBar.tsx'),
      'utf-8',
    )
    expect(src).not.toMatch(/useState/)
  })
})

describe('ListingsFilterBar — T2 (AC2): premium toggle is one immediate push each way', () => {
  it('turning premium on writes premium=true, one push', () => {
    renderBar('')
    fireEvent.click(screen.getByText('Premium only'))

    expect(pushMock).toHaveBeenCalledTimes(1)
    const { params } = lastPush()
    expect(params.get('premium')).toBe('true')
  })

  it('turning premium off deletes the param, one push', () => {
    renderBar('premium=true')
    fireEvent.click(screen.getByText('Premium only'))

    expect(pushMock).toHaveBeenCalledTimes(1)
    const { params } = lastPush()
    expect(params.has('premium')).toBe(false)
  })
})

describe('ListingsFilterBar — T3 (AC3): property-type change routes through handlePropertyTypeChange', () => {
  it('switching from a type whose schema shows year_built to one that does not drops the dependent param in the same single push', () => {
    renderBar('property_type=apartment&year_built_min=2000')
    // variant="button" trigger is a readOnly TextInput showing the selected label as its value.
    fireEvent.click(screen.getByDisplayValue('Apartment'))
    fireEvent.click(screen.getByText('Commercial'))

    expect(pushMock).toHaveBeenCalledTimes(1)
    const { params } = lastPush()
    expect(params.get('property_type')).toBe('commercial')
    expect(params.has('year_built_min')).toBe(false)
  })

  it('clearing to "All types" deletes property_type and drops nothing extra', () => {
    renderBar('property_type=apartment')
    fireEvent.click(screen.getByDisplayValue('Apartment'))
    fireEvent.click(screen.getByText('All types'))

    expect(pushMock).toHaveBeenCalledTimes(1)
    const { params } = lastPush()
    expect(params.has('property_type')).toBe(false)
  })
})

describe('ListingsFilterBar — T4 (AC4): reset produces a bare pathname push', () => {
  it('router.push is called with the pathname and no query string', () => {
    renderBar('type=sale&premium=true')
    fireEvent.click(screen.getByText('Reset filters'))

    expect(pushMock).toHaveBeenCalledTimes(1)
    expect(pushMock).toHaveBeenCalledWith(PATHNAME)
    expect((pushMock.mock.calls[0][0] as string).includes('?')).toBe(false)
  })
})

describe('ListingsFilterBar — T5 (AC4): advanced filters calls onFiltersOpen, pushes nothing', () => {
  it('clicking the advanced-filters control fires onFiltersOpen exactly once and 0 router.push calls', () => {
    currentSearch = ''
    const onFiltersOpen = vi.fn()
    render(withProviders(<ListingsFilterBar locations={locations} onFiltersOpen={onFiltersOpen} />))
    fireEvent.click(screen.getByText('Advanced filters'))

    expect(onFiltersOpen).toHaveBeenCalledTimes(1)
    expect(pushMock).not.toHaveBeenCalled()
  })
})

describe('ListingsFilterBar — T6 (AC5): route visibility lives in the ListingsShellView wrapper', () => {
  const shellProps: ListingsShellViewProps = {
    listings: [],
    total: 0,
    page: 1,
    perPage: 20,
    locations,
    tab: 'active',
    activeFiltersCount: 0,
    displayCurrency: 'ALL',
    rates: null,
    favoriteIds: new Set(),
    view: 'grid',
    filtersOpen: false,
    isLoadingMore: false,
    showLoadMore: false,
    onViewChange: vi.fn(),
    onFiltersOpenChange: vi.fn(),
    onFiltersOpen: vi.fn(),
    onShowMore: vi.fn(),
    onBeforeNavigate: vi.fn(),
    onFavoriteToggled: vi.fn(),
    filtersSlot: null,
    saveSearchSlot: null,
  }

  it('theme.breakpoints.md is 48em (768px) — the boundary the wrapper class must resolve to', () => {
    expect(theme.breakpoints?.md).toBe('48em')
  })

  it('the wrapper root carries mantine-visible-from-md; the bar\'s own root carries neither visibility class', () => {
    currentSearch = ''
    const { container } = render(withProviders(<ListingsShellView {...shellProps} />))

    const barRoot = container.querySelector('[data-testid="listings-filter-bar-root"]')!
    expect(barRoot).toBeTruthy()

    const wrapper = barRoot.parentElement!
    expect(wrapper.className).toContain('mantine-visible-from-md')

    expect(barRoot.className).not.toMatch(/mantine-(visible|hidden)-from-md/)
  })

  it('ListingsFilterBar.tsx contains no visibleFrom/hiddenFrom/hidden md: markup', () => {
    const src = readFileSync(
      join(process.cwd(), 'src/modules/listings/components/ListingsFilterBar.tsx'),
      'utf-8',
    )
    // The file's own doc comment legitimately DESCRIBES the host wrapper (`<Box
    // visibleFrom="md">` in ListingsShellView) — strip the header comment block before
    // asserting the component's actual code carries no such prop/class itself.
    const code = src.replace(/^'use client'\s*\n\n\/\*\*[\s\S]*?\*\/\n/, '')
    expect(code).not.toMatch(/visibleFrom|hiddenFrom|hidden md:/)
  })
})

describe('ListingsFilterBar — T7: zero active filters hides reset and the count badge', () => {
  it('the reset control is absent from the DOM and the Indicator renders no badge', () => {
    const { container } = renderBar('')
    expect(screen.queryByText('Reset filters')).toBeNull()
    expect(container.querySelector('.mantine-Indicator-indicator')).toBeNull()
  })
})
