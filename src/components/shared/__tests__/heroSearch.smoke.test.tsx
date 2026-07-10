/**
 * HeroSearch → Mantine Button migration smoke (Task 568) + MantineCountButton adoption (Task 571).
 *
 * `HeroSearch.tsx` was split into a thin container (hooks/state/URL-building, unchanged) and a
 * prop-driven `HeroSearchView.tsx` (JSX + the 4 migrated `@mantine/core` Buttons — Task 568 item
 * 0). This mounts the REAL `HeroSearch` container end-to-end (only `useLocations` + `next/navigation`
 * + FiltersPanel's own external data hooks are mocked — same as `filtersRangeDatePicker.smoke.test.tsx`)
 * to prove the container→view wiring and the `handleSearch` URL-param contract are byte-identical
 * to the pre-migration component.
 *
 * **Task 571 addition:** the filters button is now the canonical `MantineCountButton` (was a raw
 * `Button` + hand-rolled absolute corner `<span>` badge). Covers:
 *   - the count badge now renders INSIDE the button (via `rightSection`, a normal-flow descendant)
 *     instead of as a sibling in a `relative` wrapper — the round-1 DOM shape Task 568 shipped.
 *   - the `iconOnlyBelow={860}` collapse mechanism is genuinely wired: forcing the real
 *     `@mantine/hooks` `useMediaQuery` (via a scoped override, all other `@mantine/hooks` exports
 *     stay real) to resolve "below threshold" hides the label while the `aria-label` accessible
 *     name and the leftSection icon survive.
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

// Task 571: scoped `useMediaQuery` override — `null` (default) delegates to the REAL hook (every
// other `@mantine/hooks` export, e.g. `useDisclosure`/`useId` consumed internally by Mantine's own
// Drawer/Combobox, stays completely real). Only the one dedicated collapse test below flips this to
// force "below threshold", proving `MantineCountButton`'s `iconOnlyBelow={860}` wiring is real.
const mediaQueryOverride: { current: boolean | null } = { current: null }
vi.mock('@mantine/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mantine/hooks')>()
  return {
    ...actual,
    useMediaQuery: (...args: Parameters<typeof actual.useMediaQuery>) =>
      mediaQueryOverride.current !== null ? mediaQueryOverride.current : actual.useMediaQuery(...args),
  }
})

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
  mediaQueryOverride.current = null
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

  it('the active count badge is absent with no filters, and shows the count inline in the button after Apply (Task 571: MantineCountButton rightSection badge)', async () => {
    render(withProviders(<HeroSearch />))
    const filtersButton = screen.getByLabelText('Advanced filters')
    // Task 571: the count now renders INSIDE the button via `rightSection` — a normal-flow
    // DESCENDANT of the button (MantineCountButton), not a sibling in a `relative` wrapper (the
    // Task 568 round-1 DOM shape this task replaces).
    expect(within(filtersButton).queryByText('1')).not.toBeInTheDocument()

    fireEvent.click(filtersButton)
    fireEvent.change(screen.getByPlaceholderText('e.g. 12345'), { target: { value: '12345' } })
    fireEvent.click(screen.getByRole('button', { name: /Apply filters/ }))

    expect(await within(filtersButton).findByText('1')).toBeInTheDocument()
  })

  it('the filters button collapses to icon+count below the iconOnlyBelow=860 threshold, keeping the aria-label accessible name (Task 571)', () => {
    mediaQueryOverride.current = true // force "below threshold" on the real useMediaQuery hook
    render(withProviders(<HeroSearch />))

    // label ("Advanced filters" text) is hidden in the collapsed state
    expect(screen.queryByText('Advanced filters')).not.toBeInTheDocument()

    // the button is still reachable by its aria-label accessible name (icon-only exemption,
    // agent-contract clause 11 — the ONLY permitted <640/<860 non-full-width control here)
    const filtersButton = screen.getByRole('button', { name: 'Advanced filters' })
    expect(filtersButton).toBeInTheDocument()

    // clicking still opens FiltersPanel in the collapsed state
    fireEvent.click(filtersButton)
    expect(screen.getByPlaceholderText('e.g. 12345')).toBeInTheDocument()
  })

  it('Task 572: the 4 controls (type, location, filters, Search) are direct children of ONE flex-wrap container, not nested in a separate action <div>', () => {
    // Layout wrapping itself is not assertable in jsdom (no layout engine — the AUTHORITATIVE
    // proof for the 640-767 Search-wrap behavior is the rendered PNG matrix). This test instead
    // proves the STRUCTURAL precondition the fix depends on: pre-Task-572, filters+Search were
    // nested inside their own `<div className="flex gap-2">`, one level deeper than type/location
    // — that extra nesting is exactly what forced them to move together as a pair. Flattening all
    // 4 into direct siblings of one `flex flex-wrap md:flex-nowrap` container is what lets Search
    // wrap alone while filters stays on row 1.
    render(withProviders(<HeroSearch />))
    const searchButton = screen.getByRole('button', { name: 'Search' })
    const filtersButton = screen.getByLabelText('Advanced filters')

    const container = searchButton.parentElement
    expect(container).not.toBeNull()
    expect(container).toHaveClass('flex', 'flex-wrap', 'gap-2')

    // filters and Search are DIRECT SIBLINGS of the same container — no intermediate wrapper.
    expect(filtersButton.parentElement).toBe(container)
    // exactly 4 direct children: [type-combobox-wrapper, location-combobox-wrapper, filters, Search]
    expect(container?.children.length).toBe(4)
  })
})
