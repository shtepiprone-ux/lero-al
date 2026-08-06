/**
 * FiltersPanel shell — Mantine migration smoke (Task 567).
 *
 * The shell (overlay/`MantineDrawer`, header/footer, property-type + market-type toggle grids,
 * listing-id input) was rebuilt on Mantine (`MantineDrawer` + `Button`/`TextInput`) — presentational
 * swap only, all `useHomepageFilters` logic byte-identical. Mounts the REAL `FiltersPanel` (not a
 * stand-in harness) so a regression in the actual wiring lines is caught.
 *
 * Registry: docs/critical-flow-registry.md → "Listings filter controls" row, extended.
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, fireEvent, cleanup, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { readFileSync } from 'fs'
import { join } from 'path'
import { theme } from '@/design-system/mantine/theme'
import { FiltersPanel } from '@/components/shared/FiltersPanel'
import type { FilterValues } from '@/modules/listings/domain/filterEngine'

const messages = JSON.parse(readFileSync(join(process.cwd(), 'messages', 'en.json'), 'utf-8'))

// ── Shared mocks (data hooks unrelated to this task's scope) ─────────────────────────────────
vi.mock('@/hooks/useExchangeRate', () => ({
  useExchangeRate: () => ({ rates: null, rate: null, loading: false }),
}))
vi.mock('@/hooks/usePropertyTypes', () => ({
  usePropertyTypes: () => ({
    // 'land' added for Task 671 AC5(b): its schema excludes market_type/rooms/floor/
    // floors_total/year_built/condition/heating/wall_type/layout_features from `filters`
    // (src/modules/listings/domain/propertyTypeSchema.ts SCHEMA_LAND), giving a real
    // shows()-changing selection to prove the D3 divider derivation is dynamic.
    propertyTypes: [{ value: 'apartment', label: 'Apartment' }, { value: 'land', label: 'Land' }],
    loading: false,
  }),
}))
vi.mock('@/modules/currency/hooks/useCurrencies', () => ({
  useCurrencies: () => ({ currencies: [], loading: false }),
}))
vi.mock('@/lib/performance/store', () => ({
  usePerformanceTier: () => 'high',
}))

// Task 671 AC5(c): lets a single test force `contentReady === false` deterministically
// (real useIdleMount's forceNow=open effect always flips it true within RTL's synchronous
// act() flush, so the real hook can never be observed false with the Drawer open).
let mockIdleMountOverride: boolean | null = null
vi.mock('@/lib/performance/tier', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/performance/tier')>()
  return {
    ...actual,
    useIdleMount: (defer: boolean, forceNow?: boolean) =>
      mockIdleMountOverride !== null ? mockIdleMountOverride : actual.useIdleMount(defer, forceNow),
  }
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
  mockIdleMountOverride = null
})

/**
 * Reads the responsive CSS rule Mantine emits for a style-prop-driven element (e.g. `Flex`
 * `direction`/`wrap`, a Button's responsive `w`) — a `<style data-mantine-styles="inline">`
 * sibling tag keyed to the element's own generated class, containing the base declaration plus
 * a `@media(min-width: 40em)` (Mantine `sm` = 640px) override. This is the REAL mechanism
 * (verified by direct render inspection) behind what used to be literal Tailwind classes
 * (`sm:flex-row`, `w-full sm:w-auto`) — asserting against it is genuine observed-behavior
 * coverage, not a re-typed prop name (Task 671 I6).
 */
function getMantineInlineStyleFor(el: Element): string {
  const classes = Array.from(el.classList)
  const styleTags = Array.from(document.querySelectorAll('style[data-mantine-styles="inline"]'))
  for (const tag of styleTags) {
    const css = tag.textContent ?? ''
    if (classes.some(c => css.includes(`.${c}{`))) return css
  }
  return ''
}

function withProviders(children: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        {children}
      </MantineProvider>
    </NextIntlClientProvider>
  )
}

function renderPanel(overrides: Partial<{
  values: FilterValues
  onClose: () => void
  onChange: (v: FilterValues) => void
  onApply: (v: FilterValues) => void
}> = {}) {
  const onClose = overrides.onClose ?? vi.fn()
  const onChange = overrides.onChange ?? vi.fn()
  const onApply = overrides.onApply ?? vi.fn()
  const values = overrides.values ?? {}
  const utils = render(
    withProviders(
      <FiltersPanel
        open
        onClose={onClose}
        values={values}
        onChange={onChange}
        onApply={onApply}
        locations={[]}
      />,
    ),
  )
  return { ...utils, onClose, onChange, onApply }
}

describe('FiltersPanel shell — Apply / Reset wiring', () => {
  it('Apply fires onApply with the composed local values', () => {
    const { onApply } = renderPanel({ values: { rooms: [2] } })
    fireEvent.click(screen.getByText('Apply filters'))
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ rooms: [2] }))
  })

  it('Reset clears all filters via the existing handleReset semantics', () => {
    const { onChange } = renderPanel({ values: { rooms: [2], price_min: 1000 } })
    fireEvent.click(screen.getByText('Reset filters'))
    expect(onChange).toHaveBeenCalledWith({})
  })
})

describe('FiltersPanel shell — property-type toggle (soft-tint selected)', () => {
  it('clicking a type chip selects it (data-variant="light"); "All types" is deselected', () => {
    renderPanel()
    const allTypesBtn = screen.getByText('All types').closest('button')!
    const apartmentBtn = screen.getByText('Apartment').closest('button')!

    // Default: no property_type set -> "All types" is the selected (light) one.
    expect(allTypesBtn.getAttribute('data-variant')).toBe('light')
    expect(apartmentBtn.getAttribute('data-variant')).toBe('default')

    fireEvent.click(apartmentBtn)

    expect(apartmentBtn.getAttribute('data-variant')).toBe('light')
    expect(allTypesBtn.getAttribute('data-variant')).toBe('default')
  })

  it('clicking the active type again clears it back to "All types"', () => {
    renderPanel()
    const allTypesBtn = screen.getByText('All types').closest('button')!
    const apartmentBtn = screen.getByText('Apartment').closest('button')!

    fireEvent.click(apartmentBtn)
    expect(apartmentBtn.getAttribute('data-variant')).toBe('light')

    fireEvent.click(apartmentBtn)
    expect(apartmentBtn.getAttribute('data-variant')).toBe('default')
    expect(allTypesBtn.getAttribute('data-variant')).toBe('light')
  })
})

describe('FiltersPanel shell — market-type toggle (soft-tint selected)', () => {
  it('clicking a market type selects it; "All" clears it', () => {
    renderPanel()
    const allBtn = screen.getByText('All').closest('button')!
    const secondaryBtn = screen.getByText('Secondary market').closest('button')!

    expect(allBtn.getAttribute('data-variant')).toBe('light')

    fireEvent.click(secondaryBtn)
    expect(secondaryBtn.getAttribute('data-variant')).toBe('light')
    expect(allBtn.getAttribute('data-variant')).toBe('default')

    fireEvent.click(allBtn)
    expect(allBtn.getAttribute('data-variant')).toBe('light')
    expect(secondaryBtn.getAttribute('data-variant')).toBe('default')
  })
})

describe('FiltersPanel shell — listing-id input', () => {
  it('typing fires update with the typed string (via onApply after Apply)', () => {
    const { onApply } = renderPanel()
    fireEvent.change(screen.getByPlaceholderText('e.g. 12345'), { target: { value: 'lst-42' } })
    fireEvent.click(screen.getByText('Apply filters'))
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ listing_id: 'lst-42' }))
  })

  it('clearing to empty maps to undefined (via onApply after Apply)', () => {
    const { onApply } = renderPanel({ values: { listing_id: 'lst-42' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 12345'), { target: { value: '' } })
    fireEvent.click(screen.getByText('Apply filters'))
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ listing_id: undefined }))
  })
})

describe('FiltersPanel shell — Drawer close affordance', () => {
  it('the built-in Drawer close (X) fires onClose', () => {
    const { onClose, baseElement } = renderPanel()
    const closeButton = baseElement.querySelector('.mantine-Drawer-close') as HTMLButtonElement
    expect(closeButton).toBeTruthy()
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalled()
  })
})

// ── Task 567 round-2 strengthened gates (owner P0: "all gates green" is NOT proof by
// itself — each of the 4 fixes below has a planted-violation transcript in the session log) ──

describe('FiltersPanel shell — round-2 Fix 1: no mid-word break mechanism', () => {
  it('a toggle Button label resolves wordBreak:normal + overflowWrap:break-word (the theme fix)', () => {
    renderPanel()
    const label = screen.getByText('All types').closest('.mantine-Button-label')!
    const style = getComputedStyle(label)
    expect(style.wordBreak).toBe('normal')
    expect(style.overflowWrap).toBe('break-word')
  })

  it('the market-type row wraps whole buttons at ≥640px (Mantine Flex column→row, nowrap→wrap) — never a flex-1 squeeze', () => {
    renderPanel()
    const marketRow = screen.getByText('All').closest('button')!.parentElement!
    const rowRule = getMantineInlineStyleFor(marketRow)
    expect(rowRule).toContain('flex-wrap:nowrap')
    expect(rowRule).toContain('flex-direction:column')
    expect(rowRule).toMatch(/@media\(min-width: 40em\)\{[^}]*flex-wrap:wrap/)
    expect(rowRule).toMatch(/@media\(min-width: 40em\)\{[^}]*flex-direction:row/)
    expect(rowRule).not.toMatch(/flex:\s*1\b/)
    expect(rowRule).not.toMatch(/flex-grow/)

    const allBtn = screen.getByText('All').closest('button')!
    const btnRule = getMantineInlineStyleFor(allBtn)
    expect(btnRule).toContain('width:100%')
    expect(btnRule).toMatch(/@media\(min-width: 40em\)\{[^}]*width:auto/)
    expect(btnRule).not.toMatch(/flex:\s*1\b/)
  })
})

describe('FiltersPanel shell — round-2 Fix 2: header bottom divider', () => {
  it('desktop Drawer header (title present) has the canonical gray-3 bottom border', () => {
    // Reads the raw inline `style` attribute, not `getComputedStyle` — jsdom does not
    // reliably resolve shorthand properties (`border-bottom`) combined with CSS custom
    // properties (`var(--mantine-color-gray-3)`) through the computed-style cascade;
    // Mantine applies this value as a literal inline style, so reading it directly is
    // the reliable assertion here (verified empirically: getComputedStyle fell back to
    // the CSS-initial 'medium'/'none' regardless of the actual applied value).
    const { baseElement } = renderPanel()
    const header = baseElement.querySelector('.mantine-Drawer-header') as HTMLElement
    expect(header).toBeTruthy()
    expect(header.style.borderBottom).toBe('1px solid var(--mantine-color-gray-3)')
  })
})

describe('FiltersPanel shell — round-2 Fix 3: count is inline in rightSection, not absolute', () => {
  it('the Apply button count is a normal-flow descendant (Badge), never position:absolute', () => {
    renderPanel({ values: { rooms: [2] } })
    const applyButton = screen.getByText('Apply filters').closest('button')!
    const countNode = [...applyButton.querySelectorAll('*')].find(el => el.textContent === '1')
    expect(countNode).toBeTruthy()
    expect(getComputedStyle(countNode!).position).not.toBe('absolute')
  })
})

describe('FiltersPanel shell — round-2 Fix 4: footer is outside the scrollable content region', () => {
  it('the footer node is NOT a descendant of the scrollable content container', () => {
    const { baseElement } = renderPanel()
    const scrollContent = baseElement.querySelector('[data-testid="mantine-drawer-scroll-content"]')!
    const footer = baseElement.querySelector('[data-testid="mantine-drawer-footer"]')!
    expect(scrollContent).toBeTruthy()
    expect(footer).toBeTruthy()
    expect(scrollContent.contains(footer)).toBe(false)
  })
})

describe('FiltersPanel shell — round-2 Fix 4 blast-radius: mobile bottom-sheet pinned footer', () => {
  it('the mobile bottom-sheet footer is ALSO NOT a descendant of the scrollable content container', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
    const { baseElement } = renderPanel()
    const scrollContent = baseElement.querySelector('[data-testid="mantine-drawer-scroll-content"]')!
    const footer = baseElement.querySelector('[data-testid="mantine-drawer-footer"]')!
    expect(scrollContent).toBeTruthy()
    expect(footer).toBeTruthy()
    expect(scrollContent.contains(footer)).toBe(false)
    // Restore the mobile stub back to desktop for any later test files in the same run.
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
})

describe('FiltersPanel shell — round-2 Fix 2 blast-radius: mobile bottom-sheet header divider', () => {
  it('the mobile bottom-sheet header (title present) ALSO gets the canonical gray-3 bottom border', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
    const { baseElement } = renderPanel()
    const header = baseElement.querySelector('.mantine-Drawer-header') as HTMLElement
    expect(header).toBeTruthy()
    expect(header.style.borderBottom).toBe('1px solid var(--mantine-color-gray-3)')
    // Restore the mobile stub back to desktop for any later test files in the same run.
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
})

// ── Task 675 F6/I3/I5: Drawer title DOM nesting ─────────────────────────────────────────────────
// `responsiveBottomSheet.tsx`'s title slot wraps its `title` prop in `<Text fw={600} size="sm"
// c="gray.8">`, which renders a `<p>`. Task 671 left the title itself as `<Text fw={600}
// size="md">` (also a `<p>` by Mantine's default `component="p"`), producing `<p>` cannot be a
// descendant of `<p>` on the mobile bottom-sheet path. `<span>` is phrasing content and legal;
// `<p>` is not. This test must fail if `component="span"` is dropped from FiltersPanel.tsx's
// title `Text` (planted-violation proof recorded in the Task 675 session log).
describe('FiltersPanel shell — Task 675 F6: title DOM nesting', () => {
  it('the title renders as a <span>, not a <p> (no <p>-in-<p> nesting on the bottom-sheet path)', () => {
    renderPanel()
    const title = screen.getByText('Advanced filters')
    expect(title.tagName).toBe('SPAN')
    expect(title.closest('p')).toBeNull()
  })
})

// ── Task 671: MantineFilterSection D3 divider derivation (§3.4/I3, AC5 a/b/c) ──────────────────
// The kickoff's own risk note: this is "the single most likely defect" — the first VISIBLE
// section must omit its top rule, derived per-render from the live `shows()` predicate, never a
// hardcoded index-0. `MantineFilterSection`'s divider is a real inline `borderTop` style
// (`FiltersPanel.tsx`'s `withTopDivider()` helper), read directly (same reliable pattern as the
// header/footer border tests above — jsdom does not resolve CSS-custom-property shorthand
// through getComputedStyle).
function sectionBorderTop(labelText: string): string {
  const label = screen.getByText(labelText)
  return (label.parentElement!.parentElement as HTMLElement).style.borderTop
}

describe('FiltersPanel shell — Task 671 D3: first-visible-section divider derivation', () => {
  it('(a) the first visible section (Location) has no top divider; a later section (Property type) does', () => {
    renderPanel()
    expect(sectionBorderTop('Location')).toBe('')
    expect(sectionBorderTop('Property type')).toBe('1px solid var(--mantine-color-gray-3)')
  })

  it('(b) after a shows()-changing property-type selection, Location remains the undivided first section, the still-visible sections keep their rule, and hidden sections are genuinely absent (not just collapsed)', () => {
    renderPanel()
    fireEvent.click(screen.getByText('Land').closest('button')!)

    // SCHEMA_LAND's `filters` excludes market_type/rooms/floor/floors_total/year_built/
    // condition/heating/wall_type/layout_features — a real shows()-changing selection.
    expect(screen.queryByText('Market type')).toBeNull()
    expect(screen.queryByText('Rooms')).toBeNull()

    expect(sectionBorderTop('Location')).toBe('')
    expect(sectionBorderTop('Property type')).toBe('1px solid var(--mantine-color-gray-3)')
    expect(sectionBorderTop('Price')).toBe('1px solid var(--mantine-color-gray-3)')
    expect(sectionBorderTop('Area (m²)')).toBe('1px solid var(--mantine-color-gray-3)')
  })

  it('(c) contentReady === false renders Drawer header + footer only — an empty body, no crash, no orphan divider', () => {
    mockIdleMountOverride = false
    const { baseElement } = renderPanel()

    expect(screen.getByText('Advanced filters')).toBeInTheDocument()
    expect(screen.getByText('Apply filters')).toBeInTheDocument()
    expect(screen.queryByText('Location')).toBeNull()

    // The scroll region (where sections would render) is empty — no orphan divider inside it.
    // (The footer's own `border-top` — DrawerBodyLayout's pinned-footer chrome, out of scope —
    // legitimately matches a bare `[style*="border-top"]` selector, so scope to the body region.)
    const scrollContent = baseElement.querySelector('[data-testid="mantine-drawer-scroll-content"]')!
    expect(scrollContent).toBeTruthy()
    expect(scrollContent.querySelector('[style*="border-top"]')).toBeNull()
    expect(scrollContent.textContent).toBe('')
  })
})

// ── I7 planted-violation proof (Q4) ─────────────────────────────────────────────────────────────
// Documented here, not executed as a permanent test: the executor's session log records the live
// transcript of temporarily reverting `FiltersPanel.tsx`'s `withTopDivider` to always return
// `true` (every section, including Location, draws a rule) and re-running this file — the (a)
// assertion above (`sectionBorderTop('Location') === ''`) genuinely FAILs, proving the test is not
// a tautology. Reverted immediately after capture.
