/**
 * Task 781 — `/listings` migrated-control smoke suite.
 *
 * Covers the behavior-preservation contract (kickoff §9/§10.11/AC1-AC5) for the four Phase 1-3
 * components across their Mantine migration, following the mocking shape established by
 * `listingsFilterBar.smoke.test.tsx` (Task 779):
 * - C1 (AC1): ListingsStatusTabs — switchTab both directions (active<->closed), page always dropped.
 * - C2 (AC2): ActiveFilterChips — single-value and multi-value chip removal, page always dropped.
 * - C5 (AC3): ListingsSortBar — sort selection sets `sort`, drops `page`.
 * - C7 (AC3): ListingsSortBar — mobile filters trigger calls onFiltersOpen; count badge gated on activeFiltersCount>0.
 * - C10 (AC4): SaveSearchButton — already_exists/error/success server-action branches.
 * - C12 (AC4): SaveSearchButton — both actions disabled while isPending.
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, fireEvent, cleanup, screen, waitFor, act } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { readFileSync } from 'fs'
import { join } from 'path'
import { theme } from '@/design-system/mantine/theme'
import { ListingsStatusTabs } from '@/modules/listings/components/ListingsStatusTabs'
import { ActiveFilterChips } from '@/modules/listings/components/ActiveFilterChips'
import { ListingsSortBar } from '@/modules/listings/components/ListingsSortBar'
import { SaveSearchButton } from '@/modules/listings/components/SaveSearchButton'

const messages = JSON.parse(readFileSync(join(process.cwd(), 'messages', 'en.json'), 'utf-8'))

let currentSearch = ''
const pushMock = vi.fn()
const PATHNAME = '/en/listings'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => PATHNAME,
  useSearchParams: () => new URLSearchParams(currentSearch),
}))

vi.mock('@/hooks/usePropertyTypes', () => ({
  usePropertyTypes: () => ({
    propertyTypes: [{ value: 'apartment', label: 'Apartment' }],
    loading: false,
  }),
}))

const saveSavedSearchMock = vi.fn()
vi.mock('@/modules/cabinet/actions', () => ({
  saveSavedSearch: (...args: unknown[]) => saveSavedSearchMock(...args),
}))

const toastInfo = vi.fn()
const toastError = vi.fn()
const toastSuccess = vi.fn()
vi.mock('@/lib/toast', () => ({
  toast: {
    info: (...args: unknown[]) => toastInfo(...args),
    error: (...args: unknown[]) => toastError(...args),
    success: (...args: unknown[]) => toastSuccess(...args),
  },
}))

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
  saveSavedSearchMock.mockReset()
  toastInfo.mockClear()
  toastError.mockClear()
  toastSuccess.mockClear()
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

function lastPush() {
  const arg = pushMock.mock.calls.at(-1)?.[0] as string
  const [pathname, query = ''] = arg.split('?')
  return { pathname, params: new URLSearchParams(query), raw: arg }
}

// ── C1 (AC1): ListingsStatusTabs ────────────────────────────────────────────────────────────
describe('ListingsStatusTabs — C1: switchTab both directions', () => {
  it('active -> closed: sets tab=closed, drops page, one push', () => {
    currentSearch = 'page=3'
    render(withProviders(<ListingsStatusTabs />))
    fireEvent.click(screen.getByText('Sold & Rented'))

    expect(pushMock).toHaveBeenCalledTimes(1)
    const { params } = lastPush()
    expect(params.get('tab')).toBe('closed')
    expect(params.get('page')).toBeNull()
  })

  it('closed -> active: deletes tab (not empty string), drops page, one push', () => {
    currentSearch = 'tab=closed&page=2'
    render(withProviders(<ListingsStatusTabs />))
    fireEvent.click(screen.getByText('Active listings'))

    expect(pushMock).toHaveBeenCalledTimes(1)
    const { params, raw } = lastPush()
    expect(params.has('tab')).toBe(false)
    expect(raw).not.toContain('tab=')
    expect(params.get('page')).toBeNull()
  })
})

// ── C2 (AC2): ActiveFilterChips ─────────────────────────────────────────────────────────────
describe('ActiveFilterChips — C2: single-value and multi-value chip removal', () => {
  const locations = [{ id: 1, name_al: 'Tirana' }]

  it('single-value chip (premium) removal deletes the param, drops page', () => {
    currentSearch = 'premium=true&sort=newest'
    render(withProviders(<ActiveFilterChips locations={locations} />))
    fireEvent.click(screen.getByText('Premium only'))

    expect(pushMock).toHaveBeenCalledTimes(1)
    const { params } = lastPush()
    expect(params.has('premium')).toBe(false)
    expect(params.get('sort')).toBe('newest')
    expect(params.get('page')).toBeNull()
  })

  it('multi-value chip (rooms) removal keeps the surviving value and untouched sibling params', () => {
    currentSearch = 'rooms=2,3&sort=newest&page=2'
    render(withProviders(<ActiveFilterChips locations={locations} />))
    fireEvent.click(screen.getByText('2 rooms'))

    expect(pushMock).toHaveBeenCalledTimes(1)
    const { params } = lastPush()
    expect(params.get('rooms')).toBe('3')
    expect(params.get('sort')).toBe('newest')
    expect(params.get('page')).toBeNull()
  })

  it('zero active filters renders nothing', () => {
    currentSearch = ''
    const { container } = render(withProviders(<ActiveFilterChips locations={locations} />))
    expect(container.querySelector('.active-filter-chips')).toBeNull()
  })
})

// ── C5/C7 (AC3): ListingsSortBar ────────────────────────────────────────────────────────────
const sortBarProps = {
  total: 24,
  page: 1,
  perPage: 20,
  view: 'grid' as const,
  onViewChange: vi.fn(),
}

describe('ListingsSortBar — C5: sort selection sets sort, drops page', () => {
  it('selecting a new sort option pushes sort=price_asc with page dropped', () => {
    currentSearch = 'sort=newest&page=2'
    render(withProviders(
      <ListingsSortBar {...sortBarProps} onFiltersOpen={vi.fn()} activeFiltersCount={0} />,
    ))
    // MantineCombobox variant="button" trigger is a readOnly TextInput showing the selected label.
    fireEvent.click(screen.getByDisplayValue('Newest first'))
    fireEvent.click(screen.getByText('Price: low to high'))

    expect(pushMock).toHaveBeenCalledTimes(1)
    const { params } = lastPush()
    expect(params.get('sort')).toBe('price_asc')
    expect(params.get('page')).toBeNull()
  })
})

describe('ListingsSortBar — C7: mobile filters trigger + count badge gating', () => {
  it('clicking the mobile filters trigger calls onFiltersOpen, pushes nothing', () => {
    const onFiltersOpen = vi.fn()
    currentSearch = ''
    render(withProviders(
      <ListingsSortBar {...sortBarProps} onFiltersOpen={onFiltersOpen} activeFiltersCount={0} />,
    ))
    fireEvent.click(screen.getByTestId('listings-mobile-filters-trigger'))

    expect(onFiltersOpen).toHaveBeenCalledTimes(1)
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('activeFiltersCount=0 renders no count badge; activeFiltersCount>0 renders one, in-flow inside the button (Task 782/F13 — canonical MantineCountButton, content-sized Badge in rightSection, not circle/Indicator overlay)', () => {
    currentSearch = ''
    const { container: zero } = render(withProviders(
      <ListingsSortBar {...sortBarProps} onFiltersOpen={vi.fn()} activeFiltersCount={0} />,
    ))
    const zeroTrigger = zero.querySelector('[data-testid="listings-mobile-filters-trigger"]')
    expect(zeroTrigger?.querySelector('.mantine-Badge-root')).toBeNull()
    // No leftover Indicator overlay mechanism at all.
    expect(zero.querySelector('.mantine-Indicator-indicator')).toBeNull()
    cleanup()

    const { container: nonZero } = render(withProviders(
      <ListingsSortBar {...sortBarProps} onFiltersOpen={vi.fn()} activeFiltersCount={3} />,
    ))
    const trigger = nonZero.querySelector('[data-testid="listings-mobile-filters-trigger"]')
    const badge = trigger?.querySelector('.mantine-Badge-root')
    expect(badge).toBeTruthy()
    expect(badge).toHaveTextContent('3')
    // The badge is a normal descendant of the trigger button (in-flow rightSection content),
    // not a sibling escaping it via absolute positioning.
    expect(trigger?.contains(badge!)).toBe(true)
    expect(nonZero.querySelector('.mantine-Indicator-indicator')).toBeNull()
  })
})

// ── C10/C12 (AC4): SaveSearchButton ─────────────────────────────────────────────────────────
describe('SaveSearchButton — C10: server-action branches', () => {
  it('already_exists: toast.info, modal closes, not treated as an error', async () => {
    saveSavedSearchMock.mockResolvedValue({ code: 'already_exists' })
    currentSearch = ''
    render(withProviders(<SaveSearchButton />))
    fireEvent.click(screen.getByText('Save search'))
    fireEvent.click(screen.getAllByText('Save').at(-1)!)

    await waitFor(() => expect(toastInfo).toHaveBeenCalledTimes(1))
    expect(toastError).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByText('Save search', { selector: '.mantine-Modal-title' })).toBeNull())
  })

  it('result.error: toast.error, modal STAYS open', async () => {
    saveSavedSearchMock.mockResolvedValue({ error: 'save_failed' })
    currentSearch = ''
    render(withProviders(<SaveSearchButton />))
    fireEvent.click(screen.getByText('Save search'))
    fireEvent.click(screen.getAllByText('Save').at(-1)!)

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('save_failed'))
    expect(screen.queryByText('Save search', { selector: '.mantine-Modal-title' })).not.toBeNull()
  })

  it('success: toast.success, modal closes, name cleared', async () => {
    saveSavedSearchMock.mockResolvedValue({})
    currentSearch = ''
    render(withProviders(<SaveSearchButton />))
    fireEvent.click(screen.getByText('Save search'))
    fireEvent.click(screen.getAllByText('Save').at(-1)!)

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Search saved'))
  })
})

describe('SaveSearchButton — C12: both actions disabled while isPending', () => {
  it('Cancel and Save are both disabled during the pending transition', async () => {
    let resolvePromise: (value: { code?: string; error?: string }) => void = () => {}
    saveSavedSearchMock.mockImplementation(
      () => new Promise(resolve => { resolvePromise = resolve }),
    )
    currentSearch = ''
    render(withProviders(<SaveSearchButton />))
    fireEvent.click(screen.getByText('Save search'))

    const saveButton = screen.getAllByText('Save').at(-1)!.closest('button')!
    const cancelButton = screen.getByText('Cancel').closest('button')!

    await act(async () => {
      fireEvent.click(saveButton)
    })

    expect(saveButton).toBeDisabled()
    expect(cancelButton).toBeDisabled()

    await act(async () => {
      resolvePromise({})
    })
  })
})
