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
