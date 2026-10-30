/**
 * MantineFilterChips (Task 859 R53): one removable chip per entry, nothing for an empty list, and a press hands the
 * chip's key back to the parent. Plant: drop the `onRemove(chip.key)` call -> "pressing a chip hands back its key" fails.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '../../theme'
import { MantineFilterChips } from '../MantineFilterChips'

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
})

const chips = [
  { key: 'a', label: 'Tirana', ariaLabel: 'Tirana — remove' },
  { key: 'b', label: 'Durres', ariaLabel: 'Durres — remove' },
]

function renderChips(ui: React.ReactElement) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>)
}

describe('MantineFilterChips', () => {
  it('renders one button per chip with its accessible name', () => {
    renderChips(<MantineFilterChips chips={chips} onRemove={() => {}} />)
    expect(screen.getByRole('button', { name: 'Tirana — remove' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Durres — remove' })).toBeTruthy()
  })

  it('renders nothing for an empty list', () => {
    const { container } = renderChips(<MantineFilterChips chips={[]} onRemove={() => {}} />)
    expect(container.querySelector('button')).toBeNull()
  })

  it('pressing a chip hands back its key', () => {
    const onRemove = vi.fn()
    renderChips(<MantineFilterChips chips={chips} onRemove={onRemove} />)
    fireEvent.click(screen.getByRole('button', { name: 'Durres — remove' }))
    expect(onRemove).toHaveBeenCalledWith('b')
    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})
