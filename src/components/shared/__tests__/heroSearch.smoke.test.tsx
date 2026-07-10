/**
 * HeroSearch → Mantine Button migration smoke (Task 568).
 *
 * `HeroSearch.tsx` was split into a thin container (hooks/state/URL-building, unchanged) and a
 * prop-driven `HeroSearchView.tsx` (JSX + the 4 migrated `@mantine/core` Buttons — Task 568 item
 * 0). This mounts the REAL `HeroSearch` container end-to-end (only `useLocations` + `next/navigation`
 * + FiltersPanel's own external data hooks are mocked — same as `filtersRangeDatePicker.smoke.test.tsx`)
 * to prove the container→view wiring and the `handleSearch` URL-param contract are byte-identical
 * to the pre-migration component.
 *
 * Registry: docs/critical-flow-registry.md → "Listings filter controls" row, extended for HeroSearch.
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, fireEvent, cleanup, screen, within } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { readFileSync } from 'fs'
import { join } from 'path'
import { theme } from '@/design-system/mantine/theme'
import { HeroSearch } from '@/components/shared/HeroSearch'

const messages = JSON.parse(readFileSync(join(process.cwd(), 'messages', 'en.json'), 'utf-8'))

vi.mock('@/modules/locations/hooks/useLocations', () => ({
  useLocations: () => ({ locations: [], loading: false }),
}))

const mockRouterPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

// FiltersPanel's own external data hooks (unrelated to this task's scope) — same mocks as
// filtersRangeDatePicker.smoke.test.tsx so the REAL FiltersPanel mounts cleanly under HeroSearch.
vi.mock('@/hooks/useExchangeRate', () => ({
  useExchangeRate: () => ({ rates: null, rate: null, loading: false }),
}))
vi.mock('@/hooks/usePropertyTypes', () => ({
  usePropertyTypes: () => ({ propertyTypes: [], loading: false }),
}))
vi.mock('@/modules/currency/hooks/useCurrencies', () => ({
  useCurrencies: () => ({ currencies: [], loading: false }),
}))
vi.mock('@/lib/performance/store', () => ({
  usePerformanceTier: () => 'high',
}))

function withProviders(children: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        {children}
      </MantineProvider>
    </NextIntlClientProvider>
  )
}

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
  mockRouterPush.mockClear()
})

describe('HeroSearch — Mantine Button migration (Task 568)', () => {
  it('clicking Search pushes /{locale}/listings with the current filter state', () => {
    render(withProviders(<HeroSearch />))
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    expect(mockRouterPush).toHaveBeenCalledWith('/en/listings?type=sale')
  })

  it('switching to the Rent tab then searching pushes type=rent', () => {
    render(withProviders(<HeroSearch />))
    fireEvent.click(screen.getByText('For rent'))
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    expect(mockRouterPush).toHaveBeenCalledWith('/en/listings?type=rent')
  })

  it('clicking the filters button opens FiltersPanel', () => {
    render(withProviders(<HeroSearch />))
    expect(screen.queryByPlaceholderText('e.g. 12345')).not.toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Advanced filters'))
    expect(screen.getByPlaceholderText('e.g. 12345')).toBeInTheDocument()
  })

  it('the active-count corner badge is absent with no filters, and shows the count after Apply', async () => {
    render(withProviders(<HeroSearch />))
    const filtersButton = screen.getByLabelText('Advanced filters')
    // The badge is a sibling of the Button (not a descendant) — it lives in the shared
    // `relative` wrapper div so it isn't clipped by the Button's own `overflow:hidden` root.
    const filtersWrapper = filtersButton.parentElement as HTMLElement
    expect(within(filtersWrapper).queryByText('1')).not.toBeInTheDocument()

    fireEvent.click(filtersButton)
    fireEvent.change(screen.getByPlaceholderText('e.g. 12345'), { target: { value: '12345' } })
    fireEvent.click(screen.getByRole('button', { name: /Apply filters/ }))

    expect(await within(filtersWrapper).findByText('1')).toBeInTheDocument()
  })
})
