/**
 * FiltersPanel / ListingsFilters — `RangeDatePicker` integration smoke (Task 559)
 *
 * Registry: docs/critical-flow-registry.md → "Listings date-range filter" (Task 558/561 row,
 * extended here for the two-field → RangeDatePicker consumer swap).
 *
 * Mounts the REAL `FiltersPanel` / `ListingsFilters` components (not a stand-in harness) so a
 * regression in the actual `onChange={next => ...}` wiring line is caught — only the three
 * external data hooks (`useExchangeRate`/`usePropertyTypes`/`useCurrencies`, all real network/DB
 * calls unrelated to this task) and `next/navigation` (for the URL-immediate `ListingsFilters`
 * model) are mocked; `usePerformanceTier` is mocked to a non-'low' tier so `FiltersPanel`'s
 * idle-mount gate doesn't add async timing to these tests.
 *
 * Covers:
 *   1. FiltersPanel: a `values.date_from`/`date_to` pair hydrates the RangeDatePicker trigger.
 *   2. FiltersPanel: picking a range in the RangeDatePicker + clicking the panel's own "Apply
 *      filters" button calls `onChange`/`onApply` with BOTH `date_from`+`date_to` set (atomic).
 *   3. FiltersPanel: Reset clears both fields (existing `handleReset` semantics — clears ALL filters).
 *   4. ListingsFilters: a URL with `date_from`+`date_to` hydrates the RangeDatePicker trigger.
 *   5. ListingsFilters: picking a range calls `router.push` with BOTH params set in ONE call
 *      (atomic — not two separate navigations).
 *   6. ListingsFilters: clearing the range removes BOTH params from the URL.
 *
 * Planted-violation (documented, verified once and reverted — same convention as
 * `MantinePagination.smoke.test.tsx`): commenting out the `date_to: next.to` half of either
 * surface's `onChange` handler (leaving only `date_from: next.from`) makes test 2 / test 5 FAIL —
 * the committed value/URL is missing `date_to` entirely.
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, fireEvent, cleanup, within, screen, waitFor } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { format } from 'date-fns'
import { readFileSync } from 'fs'
import { join } from 'path'
import { theme } from '@/design-system/mantine/theme'
import { FiltersPanel } from '@/components/shared/FiltersPanel'
import { ListingsFilters } from '@/modules/listings/components/ListingsFilters'
import type { FilterValues } from '@/modules/listings/domain/filterEngine'

const messages = JSON.parse(readFileSync(join(process.cwd(), 'messages', 'en.json'), 'utf-8'))

// ── Shared mocks (data hooks unrelated to this task's scope) ─────────────────────────────────
vi.mock('@/hooks/useExchangeRate', () => ({
  useExchangeRate: () => ({ rates: null, rate: null, loading: false }),
}))
vi.mock('@/hooks/usePropertyTypes', () => ({
  usePropertyTypes: () => ({
    // Task 778: two real schema keys (`apartment` shows every §ALL_FILTER_SECTIONS entry;
    // `commercial` is a genuine subset omitting heating/wall_type/layout_features/year_built —
    // see propertyTypeSchema.ts SCHEMA_APARTMENT/SCHEMA_COMMERCIAL) so the property-type-switch
    // tests below can click a real button instead of only the always-present "All types" clear.
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
vi.mock('@/lib/performance/store', () => ({
  usePerformanceTier: () => 'high',
}))

const mockRouterPush = vi.fn()
let mockSearchParams = new URLSearchParams()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => '/listings',
  useSearchParams: () => mockSearchParams,
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
  mockSearchParams = new URLSearchParams()
})

const today = new Date()
const DAY_10 = format(new Date(today.getFullYear(), today.getMonth(), 10), 'yyyy-MM-dd')
const DAY_15 = format(new Date(today.getFullYear(), today.getMonth(), 15), 'yyyy-MM-dd')

// Both `FiltersPanel` and `ListingsFilters` pass `maxDate={today}` (preserved from the legacy
// two-field pickers) — DAY_10/DAY_15 above are fine for a pure *display* assertion (no click), but
// clicking a day that happens to fall AFTER the real "today" would be silently disabled and no-op.
// For the interactive "pick a range" tests, seed a FIXED January-2026 anchor (safely in the past
// relative to any real run date) via `value.from`/the URL, then click a LATER day within that SAME
// anchor month — mirroring the established single-click "from pre-seeded, to via one click"
// pattern from `RangeDatePicker.smoke.test.tsx` (a fresh multi-click pick isn't needed to prove
// the atomic dual-param wiring this task is actually testing).
const ANCHOR_FROM = '2026-01-10'
const PICK_TO = '2026-01-20'

describe('FiltersPanel — RangeDatePicker wiring (Task 559)', () => {
  it('hydrates the trigger from values.date_from/date_to', () => {
    const values: FilterValues = { date_from: DAY_10, date_to: DAY_15 }
    render(
      withProviders(
        <FiltersPanel
          open
          onClose={() => {}}
          values={values}
          onChange={() => {}}
          onApply={() => {}}
          locations={[]}
        />,
      ),
    )
    const from = format(new Date(today.getFullYear(), today.getMonth(), 10), 'dd.MM.yyyy')
    const to = format(new Date(today.getFullYear(), today.getMonth(), 15), 'dd.MM.yyyy')
    expect(screen.getByDisplayValue(`${from} — ${to}`)).toBeTruthy()
  })

  it('picking a range then Apply filters commits BOTH date_from + date_to atomically', () => {
    const onChange = vi.fn()
    const onApply = vi.fn()
    const { baseElement } = render(
      withProviders(
        <FiltersPanel
          open
          onClose={() => {}}
          values={{ date_from: ANCHOR_FROM, date_to: undefined }}
          onChange={onChange}
          onApply={onApply}
          locations={[]}
        />,
      ),
    )
    // FiltersPanel renders inside a Radix `Sheet`, which portals its content to
    // `document.body` — outside RTL's `container`, hence `baseElement` throughout this describe.
    // `value.from` is pre-seeded (ANCHOR_FROM), so the trigger shows a VALUE ("10.01.2026"), not a
    // placeholder — `getByDisplayValue` reads the live DOM property, unlike a CSS `[value=]`
    // attribute selector which wouldn't reliably reflect a React-controlled input.
    const rangeInput = within(baseElement as HTMLElement).getByDisplayValue('10.01.2026')
    fireEvent.click(rangeInput)
    // `date_from` was pre-seeded (anchors the panel on January 2026) — one click on a LATER day
    // within the same month stages `to` directly (see ANCHOR_FROM/PICK_TO doc comment above).
    fireEvent.click(baseElement.querySelector(`[data-date="${PICK_TO}"]`)!)
    fireEvent.click(within(baseElement as HTMLElement).getByRole('button', { name: 'Apply' }))

    // Commit the panel itself.
    fireEvent.click(screen.getByRole('button', { name: /Apply filters/ }))

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ date_from: ANCHOR_FROM, date_to: PICK_TO }))
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ date_from: ANCHOR_FROM, date_to: PICK_TO }))
  })

  it('Reset clears date_from + date_to (along with every other filter)', () => {
    const onChange = vi.fn()
    render(
      withProviders(
        <FiltersPanel
          open
          onClose={() => {}}
          values={{ date_from: DAY_10, date_to: DAY_15 }}
          onChange={onChange}
          onApply={() => {}}
          locations={[]}
        />,
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: /Reset filters/ }))
    expect(onChange).toHaveBeenCalledWith({})
  })
})

describe('ListingsFilters — RangeDatePicker wiring (Task 559)', () => {
  // The "Posting period" section is an `AccordionSection` closed by default
  // (`SECTION_DEFAULTS.period: false`) — open it before querying for the RangeDatePicker trigger.
  function openPeriodSection(baseElement: HTMLElement) {
    fireEvent.click(within(baseElement).getByRole('button', { name: 'Posting period' }))
  }

  it('hydrates the trigger from a URL already carrying date_from/date_to (deep-link)', () => {
    mockSearchParams = new URLSearchParams(`date_from=${DAY_10}&date_to=${DAY_15}`)
    const { baseElement } = render(withProviders(<ListingsFilters locations={[]} />))
    openPeriodSection(baseElement)
    const from = format(new Date(today.getFullYear(), today.getMonth(), 10), 'dd.MM.yyyy')
    const to = format(new Date(today.getFullYear(), today.getMonth(), 15), 'dd.MM.yyyy')
    expect(within(baseElement).getByDisplayValue(`${from} — ${to}`)).toBeTruthy()
  })

  it('picking a range pushes BOTH date_from + date_to in ONE router.push call', () => {
    mockSearchParams = new URLSearchParams(`date_from=${ANCHOR_FROM}`)
    const { baseElement } = render(withProviders(<ListingsFilters locations={[]} />))
    openPeriodSection(baseElement)
    // `date_from` is pre-seeded via the URL (anchors the panel on January 2026) — one click on a
    // LATER day within the same month stages `to` directly (see ANCHOR_FROM/PICK_TO doc comment).
    const rangeInput = within(baseElement).getByDisplayValue('10.01.2026')
    fireEvent.click(rangeInput)
    fireEvent.click(baseElement.querySelector(`[data-date="${PICK_TO}"]`)!)
    fireEvent.click(within(baseElement).getByRole('button', { name: 'Apply' }))

    expect(mockRouterPush).toHaveBeenCalledTimes(1)
    const pushedUrl = mockRouterPush.mock.calls[0][0] as string
    expect(pushedUrl).toContain(`date_from=${ANCHOR_FROM}`)
    expect(pushedUrl).toContain(`date_to=${PICK_TO}`)
  })

  it('clearing the range removes BOTH params from the URL', () => {
    mockSearchParams = new URLSearchParams(`date_from=${DAY_10}&date_to=${DAY_15}`)
    const { baseElement } = render(withProviders(<ListingsFilters locations={[]} />))
    openPeriodSection(baseElement)
    const clearBtn = baseElement.querySelector('button[aria-label="Clear"]') as HTMLButtonElement
    expect(clearBtn).toBeTruthy()
    fireEvent.click(clearBtn)

    expect(mockRouterPush).toHaveBeenCalledTimes(1)
    const pushedUrl = mockRouterPush.mock.calls[0][0] as string
    expect(pushedUrl).not.toContain('date_from=')
    expect(pushedUrl).not.toContain('date_to=')
  })
})

// ── Task 773 ────────────────────────────────────────────────────────────────────────────────
// Registry: docs/critical-flow-registry.md -> "Listings date-range filter".
//
// Defect (owner-reported, 2026-08-27): in the "Advanced filters" drawer, opening the
// RangeDatePicker and choosing a MONTH closed the whole calendar instead of moving it.
//
// Mechanism, established from source rather than inferred:
//   * Mantine `Popover` closes through `useClickOutside(cb, ['mousedown','touchstart'],
//     [targetNode, dropdownNode])` (Popover.mjs:159) and that hook triggers when
//     `event.composedPath()` contains NEITHER node (use-click-outside.mjs).
//   * `MantineCombobox` renders its option list through Mantine's `Combobox`, whose
//     `withinPortal` defaults to `true` (Combobox.mjs:41) -> the list mounts in the shared
//     `[data-mantine-shared-portal-node]` as a SIBLING of the calendar popover's dropdown,
//     never a descendant.
//   * `ComboboxOption` calls `event.preventDefault()` on mousedown but never
//     `stopPropagation()` (ComboboxOption.mjs:61-63), so that mousedown does reach the document
//     listener -> composedPath misses the calendar dropdown -> the calendar closes.
//
// WHY THIS TEST ASSERTS DOM CONTAINMENT AND NOT "the calendar is still open".
// jsdom cannot observe the symptom in EITHER provider configuration, which is also why the 6
// tests above (and the 14 in the two RangeDatePicker suites) never caught this:
//   * with `env="test"` — the configuration every existing suite uses — Mantine's
//     `OptionalPortal` returns its children inline (`env === "test" || !withinPortal`,
//     OptionalPortal.mjs), so `withinPortal` is a NO-OP and the option is already a descendant.
//     The whole RTL suite is structurally blind to portal-nesting defects.
//   * without `env="test"` the portals are real, but every jsdom rect is 0x0, so the popover's
//     `hideDetached` marks the reference hidden and click-outside stops firing altogether
//     (verified: a `mousedown` on `document.body` does NOT close the calendar there).
// Containment is therefore the strongest claim jsdom can make — and it is exactly the predicate
// `composedPath().includes(dropdownNode)` evaluates in a real browser. Real-browser proof of the
// user-visible behavior is out of this task's reach; see the follow-up filed in docs/backlog.md.
//
// Planted-violation proof (run, then reverted): dropping `withinPortal={false}` from the month
// selector in RangeDatePicker.tsx makes assertion 2 below FAIL — the option list mounts outside
// the calendar dropdown (`contains` -> false).

// This suite's shared `withProviders` sets `env="test"`, which disables portals and would make
// the assertion below vacuously pass. This one test must run against REAL portals.
function withRealPortals(children: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme}>{children}</MantineProvider>
    </NextIntlClientProvider>
  )
}

describe('FiltersPanel — in-calendar month selector stays inside the calendar popover (Task 773)', () => {
  it('mounts the month option list inside the calendar dropdown, and the pick takes effect', async () => {
    render(
      withRealPortals(
        <FiltersPanel
          open
          onClose={() => {}}
          values={{ date_from: ANCHOR_FROM, date_to: undefined }}
          onChange={() => {}}
          onApply={() => {}}
          locations={[]}
        />,
      ),
    )

    // Open the calendar. ANCHOR_FROM anchors the left pane on January 2026; day cells carry
    // `data-date`, which is the portal-agnostic "the calendar panel is mounted" probe.
    fireEvent.click(within(document.body).getByDisplayValue('10.01.2026'))
    await waitFor(() => {
      if (document.querySelectorAll('[data-date]').length === 0) throw new Error('calendar not open')
    })

    // The calendar's own popover dropdown = the `.mantine-Popover-dropdown` holding the day grid.
    // Selecting it by content rather than by order keeps this stable once the nested combobox
    // mounts a second `.mantine-Popover-dropdown` of its own.
    const calendarDropdown = Array.from(
      document.querySelectorAll('.mantine-Popover-dropdown'),
    ).find((d) => d.querySelector('[data-date]'))
    expect(calendarDropdown).toBeTruthy()

    // Open the nested month selector (MantineCombobox variant="button", aria-label "Month").
    fireEvent.click(document.querySelector('input[aria-label="Month"]') as HTMLElement)
    await waitFor(() => {
      if (within(document.body).queryAllByText('March').length === 0) throw new Error('no options')
    })
    const marchOption = within(document.body).getAllByText('March')[0]

    // 1. Sanity: the option really is rendered (guards against a vacuous pass if the dropdown
    //    silently stopped opening).
    expect(marchOption).toBeTruthy()
    // 2. THE REGRESSION ASSERTION: the option must live inside the calendar popover's own
    //    dropdown subtree, so its `mousedown` is an INSIDE click for `useClickOutside`.
    expect(calendarDropdown!.contains(marchOption)).toBe(true)

    // 3. The fix must not break selection itself: a real pointer press fires mousedown then
    //    click, and the calendar must re-anchor on the chosen month.
    fireEvent.mouseDown(marchOption)
    fireEvent.click(marchOption)
    expect((document.querySelector('input[aria-label="Month"]') as HTMLInputElement).value).toBe('March')
    expect(document.querySelectorAll('[data-date]').length).toBeGreaterThan(0)
  })
})

// ── Task 778 ────────────────────────────────────────────────────────────────────────────────
// Registry: docs/critical-flow-registry.md -> "Listings filter controls — leaf sub-components +
// shell (Mantine)". Extends coverage for the ListingsFilters -> Mantine migration: the immediate
// single-push URL contract (AC3), property-type-dependent section narrowing plus multi-select
// deselection (AC4), the two negative-flow value-normalization paths (§11.2), and the mobile
// Apply handler (AC6).
//
// Planted-violation obligation (T2/T3/T5/T6): each assertion below was verified to FAIL against
// the specific planted defect it guards, then reverted — see the session log for the exact diffs
// and failure output.
describe('ListingsFilters — URL contract, property-type visibility, negative flows (Task 778)', () => {
  it('T2 / AC3 — a single filter change is one immediate push that preserves other params and resets only page', () => {
    mockSearchParams = new URLSearchParams('sort=price_asc&currency=EUR&page=3')
    const { baseElement } = render(withProviders(<ListingsFilters locations={[]} />))
    fireEvent.click(within(baseElement).getByText('For sale'))

    expect(mockRouterPush).toHaveBeenCalledTimes(1)
    const pushedUrl = mockRouterPush.mock.calls[0][0] as string
    expect(pushedUrl).toContain('sort=price_asc')
    expect(pushedUrl).toContain('currency=EUR')
    expect(pushedUrl).not.toContain('page=')
    expect(pushedUrl).toContain('type=sale')
  })

  it('T3 / AC4 — switching property type drops the dependent param the new type does not show', () => {
    mockSearchParams = new URLSearchParams('property_type=apartment&heating=electric')
    const { baseElement } = render(withProviders(<ListingsFilters locations={[]} />))
    // apartment shows 'heating' (propertyTypeSchema.ts SCHEMA_APARTMENT.ui.filters) — sanity
    // check the section is actually present before the switch.
    expect(within(baseElement).getByRole('button', { name: 'Heating' })).toBeTruthy()

    fireEvent.click(within(baseElement).getByText('Commercial'))

    expect(mockRouterPush).toHaveBeenCalledTimes(1)
    const pushedUrl = mockRouterPush.mock.calls[0][0] as string
    expect(pushedUrl).toContain('property_type=commercial')
    // commercial's schema (SCHEMA_COMMERCIAL) omits 'heating' entirely.
    expect(pushedUrl).not.toContain('heating=')
  })

  it('T3 — with no property_type in the URL, every section is visible (the all-sections default branch)', () => {
    mockSearchParams = new URLSearchParams()
    const { baseElement } = render(withProviders(<ListingsFilters locations={[]} />))
    expect(within(baseElement).getByRole('button', { name: 'Heating' })).toBeTruthy()
    expect(within(baseElement).getByRole('button', { name: 'Wall type' })).toBeTruthy()
    expect(within(baseElement).getByRole('button', { name: 'Market type' })).toBeTruthy()
  })

  it('AC4 (multi-select) — deselecting one value from a 3-value CSV keeps the other two', () => {
    mockSearchParams = new URLSearchParams('condition=good,needs_repair,new_build')
    const { baseElement } = render(withProviders(<ListingsFilters locations={[]} />))
    const conditionToggle = within(baseElement).getByRole('button', { name: 'Condition' })
    fireEvent.click(conditionToggle)
    const conditionSection = conditionToggle.parentElement as HTMLElement
    fireEvent.click(within(conditionSection).getByText('Good condition'))

    expect(mockRouterPush).toHaveBeenCalledTimes(1)
    const pushedUrl = mockRouterPush.mock.calls[0][0] as string
    expect(pushedUrl).toContain('condition=needs_repair%2Cnew_build')
  })

  it('T5 — a floor value below the domain-aware minimum is dropped from the URL, not written', () => {
    // No property_type -> getFloorFilterMin('') falls back to SCHEMA_OTHER (propertyTypeSchema.ts
    // SCHEMA_OTHER.floor: { allowNegative: true, minFloor: -10 }) — -15 is below even that
    // permissive floor, so it must be dropped rather than clamped or written.
    mockSearchParams = new URLSearchParams()
    const { baseElement } = render(withProviders(<ListingsFilters locations={[]} />))
    const floorToggle = within(baseElement).getByRole('button', { name: 'Floor' })
    fireEvent.click(floorToggle)
    const floorSection = floorToggle.parentElement as HTMLElement
    const floorMinInput = within(floorSection).getByPlaceholderText('Min')
    fireEvent.change(floorMinInput, { target: { value: '-15' } })

    expect(mockRouterPush).toHaveBeenCalledTimes(1)
    const pushedUrl = mockRouterPush.mock.calls[0][0] as string
    expect(pushedUrl).not.toContain('floor_min=')
  })

  it('T5 (source-verified deviation from the kickoff\'s literal wording) — a negative area value clamps to 0 and IS written, it is not deleted', () => {
    // ListingsFilters.tsx: onMinChange={v => updateParams({ area_min: v ? String(Math.max(0, Number(v))) : null })}
    // A non-empty negative string is truthy, so Math.max(0, -N) writes "0" — it never reaches the
    // null/delete branch. Asserted against the actual source rather than the kickoff's summary,
    // per the no-invented-requirement rule.
    mockSearchParams = new URLSearchParams()
    const { baseElement } = render(withProviders(<ListingsFilters locations={[]} />))
    const areaToggle = within(baseElement).getByRole('button', { name: 'Area (m²)' })
    fireEvent.click(areaToggle)
    const areaSection = areaToggle.parentElement as HTMLElement
    const areaMinInput = within(areaSection).getByPlaceholderText('Min')
    fireEvent.change(areaMinInput, { target: { value: '-5' } })

    expect(mockRouterPush).toHaveBeenCalledTimes(1)
    const pushedUrl = mockRouterPush.mock.calls[0][0] as string
    expect(pushedUrl).toContain('area_min=0')
  })

  it('T6 / AC6 — mobile Apply calls onClose exactly once and pushes nothing', () => {
    mockSearchParams = new URLSearchParams()
    const onClose = vi.fn()
    const { baseElement } = render(withProviders(<ListingsFilters locations={[]} onClose={onClose} />))
    fireEvent.click(within(baseElement).getByRole('button', { name: 'Apply filters' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(mockRouterPush).not.toHaveBeenCalled()
  })
})
