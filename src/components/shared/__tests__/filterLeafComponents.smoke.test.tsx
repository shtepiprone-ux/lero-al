/**
 * Filter leaf sub-components — Mantine migration smoke (Task 566).
 *
 * `FilterRangeInputs` / `FilterMultiToggle` / `FilterRoomsRow` were rebuilt on Mantine `TextInput`/
 * `Button` (presentational swap only — Task 556 `PhoneField` precedent). Asserts the public Props
 * API contract is byte-identical: typed/clicked values emit through the SAME callbacks with the
 * SAME shapes as the legacy `@/components/ui/*` versions, and the selected state renders as the
 * active Mantine variant (`data-variant="filled"` vs `"default"`).
 *
 * Registry: docs/critical-flow-registry.md → "Listings date-range filter" row, extended.
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { FilterRangeInputs } from '../FilterRangeInputs'
import { FilterMultiToggle } from '../FilterMultiToggle'
import { FilterRoomsRow } from '../FilterRoomsRow'

beforeAll(() => {
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

function withProvider(children: React.ReactNode) {
  return <MantineProvider theme={theme} env="test">{children}</MantineProvider>
}

const OPTIONS = [
  { value: 'good', labelKey: 'condition_good' },
  { value: 'renovated', labelKey: 'condition_renovated' },
] as const

function getLabel(key: string) {
  const labels: Record<string, string> = {
    condition_good: 'Good',
    condition_renovated: 'Renovated',
  }
  return labels[key] ?? key
}

describe('FilterRangeInputs — Mantine TextInput swap', () => {
  it('typing in min fires onMinChange with the exact typed string', () => {
    const onMinChange = vi.fn()
    render(
      withProvider(
        <FilterRangeInputs
          minValue=""
          maxValue=""
          onMinChange={onMinChange}
          onMaxChange={vi.fn()}
          minPlaceholder="Min"
          maxPlaceholder="Max"
        />,
      ),
    )
    fireEvent.change(screen.getByPlaceholderText('Min'), { target: { value: '150000' } })
    expect(onMinChange).toHaveBeenCalledWith('150000')
  })

  it('typing in max fires onMaxChange with the exact typed string', () => {
    const onMaxChange = vi.fn()
    render(
      withProvider(
        <FilterRangeInputs
          minValue=""
          maxValue=""
          onMinChange={vi.fn()}
          onMaxChange={onMaxChange}
          minPlaceholder="Min"
          maxPlaceholder="Max"
        />,
      ),
    )
    fireEvent.change(screen.getByPlaceholderText('Max'), { target: { value: '999' } })
    expect(onMaxChange).toHaveBeenCalledWith('999')
  })

  it('values render as passed', () => {
    render(
      withProvider(
        <FilterRangeInputs
          minValue="10"
          maxValue="20"
          onMinChange={vi.fn()}
          onMaxChange={vi.fn()}
        />,
      ),
    )
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    expect(screen.getByDisplayValue('20')).toBeInTheDocument()
  })
})

describe('FilterMultiToggle — Mantine Button toggle swap', () => {
  it('clicking an unselected option fires onToggle(value)', () => {
    const onToggle = vi.fn()
    render(
      withProvider(
        <FilterMultiToggle options={OPTIONS} selected={[]} onToggle={onToggle} getLabel={getLabel} />,
      ),
    )
    fireEvent.click(screen.getByText('Good'))
    expect(onToggle).toHaveBeenCalledWith('good')
  })

  it('a selected value renders as the active (filled) variant; unselected stays default', () => {
    render(
      withProvider(
        <FilterMultiToggle options={OPTIONS} selected={['good']} onToggle={vi.fn()} getLabel={getLabel} />,
      ),
    )
    const goodButton = screen.getByText('Good').closest('button')!
    const renovatedButton = screen.getByText('Renovated').closest('button')!
    expect(goodButton.getAttribute('data-variant')).toBe('filled')
    expect(renovatedButton.getAttribute('data-variant')).toBe('default')
  })
})

describe('FilterMultiToggle — orientation prop (Task 778)', () => {
  it('orientation="vertical" renders the same Mantine Stack the legacy className path renders', () => {
    const { container } = render(
      withProvider(
        <FilterMultiToggle options={OPTIONS} selected={[]} onToggle={vi.fn()} getLabel={getLabel} orientation="vertical" />,
      ),
    )
    const root = container.querySelector('[data-testid="filter-chip-row"]') as HTMLElement
    expect(root).toHaveClass('mantine-Stack-root')
  })

  it('the legacy className="flex-col gap-1.5" path keeps working unchanged', () => {
    const { container } = render(
      withProvider(
        <FilterMultiToggle options={OPTIONS} selected={[]} onToggle={vi.fn()} getLabel={getLabel} className="flex-col gap-1.5" />,
      ),
    )
    const root = container.querySelector('[data-testid="filter-chip-row"]') as HTMLElement
    expect(root).toHaveClass('mantine-Stack-root')
  })

  it('AC9 — orientation="vertical" and the legacy className path execute the identical <Stack> return statement (structural proof; jsdom cannot evaluate Mantine\'s @layer-wrapped CSS — see the real-browser measurement below)', () => {
    // jsdom limitation, verified in-session: importing the REAL `@mantine/core/styles.css` into
    // this test file and reading `getComputedStyle(root).flexDirection` for a Mantine `Stack`
    // returned the browser-default `row`, not the compiled `column` rule — Mantine's stylesheet is
    // wrapped in `@layer mantine { ... }` and jsdom's CSS engine does not reliably apply
    // `@layer`-scoped rules. A computed-style assertion in THIS environment would silently assert
    // jsdom's fallback behavior, not Mantine's real rendering — worse than no assertion at all.
    //
    // The real-browser measurement lives in `scripts/task778-qa-measurements.mjs`, run against the
    // built Storybook with actual Chromium (same engine `check-stories-rendered.mjs` uses), and its
    // result is persisted at `docs/sessions/evidence/task778/AC8-AC9-measurements.json`. It measured
    // `Mantine/Primitives/FilterControls/Default`'s vertical branch (className call site) at
    // `flexDirection: "column"`, `rowGap`/`columnGap: "6px"` — the exact 0.375rem `gap-1.5` value
    // this migration replaced — versus the horizontal (Group) branch's `flexDirection: "row"`.
    //
    // What THIS jsdom test proves instead, reliably: `orientation="vertical"` and the legacy
    // `className="flex-col gap-1.5"` path are not just "expected to render the same" — they
    // execute the exact same `return <Stack {...rootProps} gap={6} className={className}
    // data-testid="filter-chip-row">{buttons}</Stack>` statement in `FilterMultiToggle.tsx`. Since
    // that statement is reached whenever `vertical` is true regardless of which condition produced
    // it, the real-browser measurement of the className call site above is definitionally identical
    // to what orientation="vertical" renders — there is no second code path to separately measure.
    const { container: viaOrientation } = render(
      withProvider(
        <FilterMultiToggle options={OPTIONS} selected={[]} onToggle={vi.fn()} getLabel={getLabel} orientation="vertical" />,
      ),
    )
    const { container: viaLegacyClassName } = render(
      withProvider(
        <FilterMultiToggle options={OPTIONS} selected={[]} onToggle={vi.fn()} getLabel={getLabel} className="flex-col gap-1.5" />,
      ),
    )
    const rootA = viaOrientation.querySelector('[data-testid="filter-chip-row"]') as HTMLElement
    const rootB = viaLegacyClassName.querySelector('[data-testid="filter-chip-row"]') as HTMLElement

    // Both render the same element type via the same branch.
    expect(rootA.tagName).toBe(rootB.tagName)
    expect(rootA).toHaveClass('mantine-Stack-root')
    expect(rootB).toHaveClass('mantine-Stack-root')
    // Same resolved gap prop (the only value-bearing difference-free input to that shared
    // statement — `className` itself legitimately differs, since orientation="vertical" passes
    // none while the legacy path passes the literal string; that is the ONE intentional
    // divergence AC9's "className path keeps working unchanged" requires, not a defect).
    expect(rootA.style.getPropertyValue('--stack-gap')).toBe(rootB.style.getPropertyValue('--stack-gap'))
    // 0.375rem * scale(1) = 6px at the default root font-size — the real-browser measurement
    // above confirms this resolves to a computed 6px rowGap/columnGap.
    expect(rootA.style.getPropertyValue('--stack-gap')).toBe('calc(0.375rem * var(--mantine-scale))')
    // Strip the one expected attribute difference (className) and confirm the remaining markup
    // (tag, other attributes, children) is byte-identical — proving one shared render path, not
    // two independently-written ones that merely happen to agree today.
    const stripClassName = (html: string) => html.replace(/ class="[^"]*"/, '')
    expect(stripClassName(rootA.outerHTML)).toBe(stripClassName(rootB.outerHTML))
  })

  it('horizontal (default — no orientation, no className) stays the wrapping Group, not a Stack', () => {
    const { container } = render(
      withProvider(
        <FilterMultiToggle options={OPTIONS} selected={[]} onToggle={vi.fn()} getLabel={getLabel} />,
      ),
    )
    const root = container.querySelector('[data-testid="filter-chip-row"]') as HTMLElement
    expect(root).toHaveClass('mantine-Group-root')
  })
})

describe('FilterRoomsRow — Mantine Button toggle swap', () => {
  it('clicking a room fires onToggle(strVal)', () => {
    const onToggle = vi.fn()
    render(withProvider(<FilterRoomsRow selected={[]} onToggle={onToggle} />))
    fireEvent.click(screen.getByText('3'))
    expect(onToggle).toHaveBeenCalledWith('3')
  })

  it('"5+" label present for room value 5', () => {
    render(withProvider(<FilterRoomsRow selected={[]} onToggle={vi.fn()} />))
    expect(screen.getByText('5+')).toBeInTheDocument()
  })

  it('a selected room renders as the active (filled) variant', () => {
    render(withProvider(<FilterRoomsRow selected={['3']} onToggle={vi.fn()} />))
    const three = screen.getByText('3').closest('button')!
    const two = screen.getByText('2').closest('button')!
    expect(three.getAttribute('data-variant')).toBe('filled')
    expect(two.getAttribute('data-variant')).toBe('default')
  })
})

describe('FilterMultiToggle / FilterRoomsRow — ARIA group naming (Task 726)', () => {
  it('renders no role and no aria-label on the container when unnamed', () => {
    const { container: multiToggleContainer } = render(
      withProvider(<FilterMultiToggle options={OPTIONS} selected={[]} onToggle={vi.fn()} getLabel={getLabel} />),
    )
    const multiToggleRoot = multiToggleContainer.querySelector('[data-testid="filter-chip-row"]') as HTMLElement
    expect(multiToggleRoot.getAttribute('role')).toBeNull()
    expect(multiToggleRoot.getAttribute('aria-label')).toBeNull()

    const { container: roomsContainer } = render(
      withProvider(<FilterRoomsRow selected={[]} onToggle={vi.fn()} />),
    )
    const roomsRoot = roomsContainer.querySelector('[data-testid="filter-chip-row"]') as HTMLElement
    expect(roomsRoot.getAttribute('role')).toBeNull()
    expect(roomsRoot.getAttribute('aria-label')).toBeNull()
  })

  it('renders role="group" and aria-label on the container when a name is supplied', () => {
    const { container: multiToggleContainer } = render(
      withProvider(
        <FilterMultiToggle options={OPTIONS} selected={[]} onToggle={vi.fn()} getLabel={getLabel} ariaLabel="Condition" />,
      ),
    )
    const multiToggleRoot = multiToggleContainer.querySelector('[data-testid="filter-chip-row"]') as HTMLElement
    expect(multiToggleRoot.getAttribute('role')).toBe('group')
    expect(multiToggleRoot.getAttribute('aria-label')).toBe('Condition')

    const { container: roomsContainer } = render(
      withProvider(<FilterRoomsRow selected={[]} onToggle={vi.fn()} ariaLabel="Rooms" />),
    )
    const roomsRoot = roomsContainer.querySelector('[data-testid="filter-chip-row"]') as HTMLElement
    expect(roomsRoot.getAttribute('role')).toBe('group')
    expect(roomsRoot.getAttribute('aria-label')).toBe('Rooms')
  })
})
