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
    propertyTypes: [{ value: 'apartment', label: 'Apartment' }],
    loading: false,
  }),
}))
vi.mock('@/modules/currency/hooks/useCurrencies', () => ({
  useCurrencies: () => ({ currencies: [], loading: false }),
}))
vi.mock('@/lib/performance/store', () => ({
  usePerformanceTier: () => 'high',
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

  it('the market-type row wraps whole buttons (sm:flex-wrap, w-full sm:w-auto) — no flex-1 squeeze', () => {
    const { baseElement } = renderPanel()
    const marketRow = screen.getByText('All').closest('button')!.parentElement!
    expect(marketRow.className).toContain('sm:flex-wrap')
    expect(marketRow.className).not.toContain('flex-1')
    const allBtn = screen.getByText('All').closest('button')!
    expect(allBtn.className).toContain('w-full')
    expect(allBtn.className).toContain('sm:w-auto')
    expect(allBtn.className).not.toMatch(/\bflex-1\b/)
    void baseElement
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
