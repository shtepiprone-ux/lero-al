/**
 * MantineCountButton — inline count-in-rightSection smoke (Task 567 round-2, Fix 3)
 *
 * Replaces the round-1 absolute-positioned corner badge (clipped by Mantine `Button`'s own
 * `overflow:hidden` root — see `docs/sessions/2026-07-09-task567-filterspanel-shell-mantine.md`)
 * with a canonical Button + count primitive: the count renders inline in the Button's
 * `rightSection`, the same normal-flow mechanism Mantine uses to space a `leftSection` icon.
 *
 * Covers:
 *   1. `count > 0` → a `Badge` with the count text renders inside the button.
 *   2. `count === 0` / `undefined` → no badge renders.
 *   3. `onClick` fires (the count-button still behaves as a normal Button).
 *   4. The count is NOT an absolutely-positioned child of the button (the round-1 clipping
 *      mechanism is gone) — asserted via `getComputedStyle`.
 *
 * Planted-violation (documented, verified once and reverted): reintroducing the round-1
 * absolute corner `<span>` pattern (rendering the count as an absolutely-positioned child
 * instead of via `rightSection`) makes assertion 4 FAIL — `position` resolves to `'absolute'`
 * instead of `'static'`/`'relative'`.
 *
 * **Task 571 addition — `iconOnlyBelow` collapse prop.** Covers:
 *   5. `iconOnlyBelow` UNSET → the label renders regardless of what the media query resolves to
 *      (byte-identical-render guard — proves the `iconOnlyBelow != null &&` gate, not just that
 *      the never-matching query "happens" not to match).
 *   6. `iconOnlyBelow` SET + below threshold → label hidden, `leftSection` icon + count badge +
 *      `aria-label` (accessible name) all survive.
 *   7. `iconOnlyBelow` SET + at/above threshold → full label + icon + count (unchanged look).
 *   8. Touch target stays ≥44px (`minHeight: 2.75rem`) in the collapsed state.
 *
 * `@mantine/hooks`'s `useMediaQuery` is mocked at the module level (`mockUseMediaQuery`) so each
 * test can force "below threshold" (`true`) / "at-or-above threshold" (`false`) deterministically,
 * independent of jsdom's `matchMedia` stub.
 *
 * Planted-violation (Task 571, documented, verified once and reverted): removing the
 * `iconOnlyBelow != null &&` guard (collapsing whenever the mocked query resolves `true`, even
 * with `iconOnlyBelow` unset) makes test 5 FAIL — the label that must always render is hidden.
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { MantineCountButton } from '../MantineCountButton'

const mockUseMediaQuery = vi.fn().mockReturnValue(false)
vi.mock('@mantine/hooks', () => ({
  useMediaQuery: (...args: unknown[]) => mockUseMediaQuery(...args),
}))

beforeEach(() => {
  mockUseMediaQuery.mockReturnValue(false)
})

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

describe('MantineCountButton — count renders inline in rightSection', () => {
  it('count > 0 renders a badge with the count text inside the button', () => {
    render(withProvider(<MantineCountButton count={3}>Apply filters</MantineCountButton>))
    const button = screen.getByText('Apply filters').closest('button')!
    expect(button).toHaveTextContent('3')
  })

  it('count = 0 renders no badge', () => {
    render(withProvider(<MantineCountButton count={0}>Apply filters</MantineCountButton>))
    const button = screen.getByText('Apply filters').closest('button')!
    expect(button.textContent).toBe('Apply filters')
  })

  it('count = undefined renders no badge', () => {
    render(withProvider(<MantineCountButton>Apply filters</MantineCountButton>))
    const button = screen.getByText('Apply filters').closest('button')!
    expect(button.textContent).toBe('Apply filters')
  })

  it('onClick fires normally', () => {
    const onClick = vi.fn()
    render(withProvider(<MantineCountButton count={2} onClick={onClick}>Apply filters</MantineCountButton>))
    fireEvent.click(screen.getByText('Apply filters'))
    expect(onClick).toHaveBeenCalled()
  })

  it('the count is NOT an absolutely-positioned child (round-1 clipping mechanism removed)', () => {
    render(withProvider(<MantineCountButton count={5}>Apply filters</MantineCountButton>))
    const button = screen.getByText('Apply filters').closest('button')!
    const countNode = [...button.querySelectorAll('*')].find(el => el.textContent === '5')
    expect(countNode).toBeTruthy()
    expect(getComputedStyle(countNode!).position).not.toBe('absolute')
  })
})

describe('MantineCountButton — variant-aware chip background (owner correction 2026-07-09)', () => {
  it('a filled (default) host button renders the white/brand chip', () => {
    render(withProvider(<MantineCountButton count={3}>Apply filters</MantineCountButton>))
    const button = screen.getByText('Apply filters').closest('button')!
    const badgeRoot = button.querySelector('.mantine-Badge-root') as HTMLElement
    expect(badgeRoot).toBeTruthy()
    expect(badgeRoot.style.backgroundColor).not.toBe('var(--mantine-color-gray-2)')
  })

  it('a default (bordered) host button renders the canonical gray chip, not white-on-white', () => {
    render(
      withProvider(
        <MantineCountButton variant="default" count={7}>
          Apply filters
        </MantineCountButton>,
      ),
    )
    const button = screen.getByText('Apply filters').closest('button')!
    const badgeRoot = button.querySelector('.mantine-Badge-root') as HTMLElement
    expect(badgeRoot).toBeTruthy()
    expect(badgeRoot.style.backgroundColor).toBe('var(--mantine-color-gray-2)')
    expect(badgeRoot.style.color).toBe('var(--mantine-color-gray-7)')
  })
})

describe('MantineCountButton — iconOnlyBelow collapse (Task 571)', () => {
  it('iconOnlyBelow UNSET renders the label even if the media query resolves true (byte-identical-render guard)', () => {
    mockUseMediaQuery.mockReturnValue(true)
    render(
      withProvider(
        <MantineCountButton count={2} leftSection={<span data-testid="icon">icon</span>} aria-label="Advanced filters">
          Advanced filters
        </MantineCountButton>,
      ),
    )
    expect(screen.getByText('Advanced filters')).toBeInTheDocument()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('iconOnlyBelow SET + below threshold hides the label but keeps leftSection icon + count badge + aria-label', () => {
    mockUseMediaQuery.mockReturnValue(true)
    render(
      withProvider(
        <MantineCountButton
          count={2}
          iconOnlyBelow={860}
          leftSection={<span data-testid="icon">icon</span>}
          aria-label="Advanced filters"
        >
          Advanced filters
        </MantineCountButton>,
      ),
    )
    // label hidden
    expect(screen.queryByText('Advanced filters')).not.toBeInTheDocument()
    // leftSection icon kept
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    // accessible name survives via aria-label (button is reachable by its former label text via role+name)
    const button = screen.getByRole('button', { name: 'Advanced filters' })
    // count badge kept, inside the same button
    expect(button).toHaveTextContent('2')
  })

  it('iconOnlyBelow SET + at/above threshold keeps the full label + icon + count (unchanged look)', () => {
    mockUseMediaQuery.mockReturnValue(false)
    render(
      withProvider(
        <MantineCountButton
          count={2}
          iconOnlyBelow={860}
          leftSection={<span data-testid="icon">icon</span>}
          aria-label="Advanced filters"
        >
          Advanced filters
        </MantineCountButton>,
      ),
    )
    expect(screen.getByText('Advanced filters')).toBeInTheDocument()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Advanced filters' })).toHaveTextContent('2')
  })

  it('count = 0 in the collapsed state renders no badge in either state (icon-only, no empty pill)', () => {
    mockUseMediaQuery.mockReturnValue(true)
    render(
      withProvider(
        <MantineCountButton count={0} iconOnlyBelow={860} leftSection={<span data-testid="icon">icon</span>} aria-label="Advanced filters">
          Advanced filters
        </MantineCountButton>,
      ),
    )
    const button = screen.getByRole('button', { name: 'Advanced filters' })
    expect(button.querySelector('.mantine-Badge-root')).toBeNull()
  })

  it('touch target stays >=44px (2.75rem) in the collapsed state', () => {
    mockUseMediaQuery.mockReturnValue(true)
    render(
      withProvider(
        <MantineCountButton iconOnlyBelow={860} leftSection={<span data-testid="icon">icon</span>} aria-label="Advanced filters">
          Advanced filters
        </MantineCountButton>,
      ),
    )
    const button = screen.getByRole('button', { name: 'Advanced filters' })
    expect(button.style.minHeight).toBe('2.75rem')
  })

  it('onClick still fires normally when collapsed', () => {
    mockUseMediaQuery.mockReturnValue(true)
    const onClick = vi.fn()
    render(
      withProvider(
        <MantineCountButton iconOnlyBelow={860} onClick={onClick} leftSection={<span data-testid="icon">icon</span>} aria-label="Advanced filters">
          Advanced filters
        </MantineCountButton>,
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Advanced filters' }))
    expect(onClick).toHaveBeenCalled()
  })
})
