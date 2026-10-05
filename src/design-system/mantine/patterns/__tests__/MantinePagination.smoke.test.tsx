/**
 * MantinePagination — regression smoke test (Task 535)
 *
 * Registry row: docs/critical-flow-registry.md → "Admin-table pagination navigation" (added
 * by this task — admin-table paging previously had no automated coverage).
 *
 * Covers:
 *   1. `computeShedRange` at the "full" level (leadingBoundaries=1, trailingBoundaries=1)
 *      produces BYTE-IDENTICAL output to Mantine's own `usePagination` range algorithm
 *      across many (total, active, siblings) combinations — proves the Task 535
 *      reimplementation (needed for asymmetric shedding) did not silently diverge from the
 *      library's known-correct logic.
 *   2. Asymmetric shed (Rule 3): dropping the trailing boundary keeps the leading boundary +
 *      current page, never both or neither.
 *   3. Floor (Rule 3 step 4): siblings=0/no boundaries always returns exactly `[active]`.
 *   4. `onChange`/`value` navigation: clicking Prev/Next fires `onChange` with the correct
 *      page (the real admin-table paging behavior this component must preserve).
 *   5. Structural "never wraps" invariant: the rendered row's computed style is always
 *      `flex-wrap: nowrap` + `overflow: hidden`, regardless of `total`/`value` — this is the
 *      CSS-level guarantee Rule 1 depends on, independent of the ResizeObserver shed logic
 *      (which cannot run deterministically in jsdom).
 *   6. Single-page (`total=1`) renders without crashing.
 *
 * Planted-violation proof (documented, not asserted here — see Task 535 session log): forcing
 * `flex-wrap: wrap` on the row, or disabling the shed effect, causes the rendered gate
 * (`screenshots:assert --mantine-only`) to FAIL with "horizontal overflow detected" at
 * 320/375/390 — verified via an actual planted-violation gate run, restored after.
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, fireEvent, renderHook } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { usePagination } from '@mantine/hooks'
import { theme } from '@/design-system/mantine/theme'
import { MantinePagination, computeShedRange, SHED_LEVELS } from '../MantinePagination'

function withProvider(children: React.ReactNode) {
  return <MantineProvider theme={theme}>{children}</MantineProvider>
}

// jsdom has no ResizeObserver — stub a no-op so the component's mount effect doesn't throw.
// The dynamic shed-to-fit measurement itself is verified via rendered Playwright proof in the
// session log (jsdom cannot produce real layout/getBoundingClientRect values); this stub only
// lets the component mount at its SSR-safe floor level, which is what the CSS-invariant and
// onChange tests below exercise.
beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', MockResizeObserver)

  // jsdom has no matchMedia — MantineProvider's color-scheme detection needs it.
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

describe('computeShedRange — equivalence with Mantine usePagination (full level)', () => {
  const cases: Array<{ total: number; active: number; siblings: number }> = [
    { total: 10, active: 1, siblings: 1 },
    { total: 10, active: 5, siblings: 1 },
    { total: 10, active: 10, siblings: 1 },
    { total: 50, active: 25, siblings: 1 },
    { total: 250, active: 137, siblings: 1 },
    { total: 3, active: 2, siblings: 1 },
    { total: 1, active: 1, siblings: 1 },
    { total: 100, active: 1, siblings: 1 },
    { total: 100, active: 100, siblings: 1 },
  ]

  it.each(cases)('matches usePagination.range for total=$total active=$active siblings=$siblings', ({ total, active, siblings }) => {
    const { result } = renderHook(() => usePagination({ total, page: active, siblings, boundaries: 1 }))
    const expected = result.current.range
    const actual = computeShedRange(total, active, siblings, 1, 1)
    expect(actual).toEqual(expected)
  })
})

describe('computeShedRange — asymmetric shed (Rule 3)', () => {
  it('drops the trailing boundary while keeping the leading boundary + current page', () => {
    const items = computeShedRange(250, 137, 0, 1, 0)
    expect(items[0]).toBe(1) // leading boundary kept
    expect(items).toContain(137) // current page always shown
    expect(items).not.toContain(250) // trailing boundary dropped
  })

  it('drops the leading boundary while keeping the trailing boundary + current page (mirror case)', () => {
    const items = computeShedRange(250, 137, 0, 0, 1)
    expect(items).not.toContain(1) // leading boundary dropped
    expect(items).toContain(137)
    expect(items[items.length - 1]).toBe(250) // trailing boundary kept
  })

  it('floor (no siblings, no boundaries) always returns exactly [active] — Rule 3 step 4', () => {
    expect(computeShedRange(250, 137, 0, 0, 0)).toEqual([137])
    expect(computeShedRange(10, 1, 0, 0, 0)).toEqual([1])
    expect(computeShedRange(10, 10, 0, 0, 0)).toEqual([10])
  })

  it('fill levels (Task 741 R58/R61, D46-8): the pages are 1, total, the current page and up to `fill` neighbours', () => {
    expect(computeShedRange(10, 1, 0, 1, 1, 2)).toEqual([1, 2, 3, 'dots', 10])
    expect(computeShedRange(10, 10, 0, 1, 1, 2)).toEqual([1, 'dots', 8, 9, 10])
    expect(computeShedRange(5, 1, 0, 1, 1, 2)).toEqual([1, 2, 3, 4, 5]) // a gap of exactly one page shows that page
    expect(computeShedRange(50, 25, 0, 1, 1, 1)).toEqual([1, 'dots', 25, 26, 'dots', 50])
  })

  it('SHED_LEVELS holds the seven levels in order: full, fill 3, fill 2, fill 1, drop siblings, drop trailing, floor', () => {
    expect(SHED_LEVELS).toEqual([
      { siblings: 1, leadingBoundaries: 1, trailingBoundaries: 1 },
      { siblings: 0, leadingBoundaries: 1, trailingBoundaries: 1, fill: 3 },
      { siblings: 0, leadingBoundaries: 1, trailingBoundaries: 1, fill: 2 },
      { siblings: 0, leadingBoundaries: 1, trailingBoundaries: 1, fill: 1 },
      { siblings: 0, leadingBoundaries: 1, trailingBoundaries: 1 },
      { siblings: 0, leadingBoundaries: 1, trailingBoundaries: 0 },
      { siblings: 0, leadingBoundaries: 0, trailingBoundaries: 0 },
    ])
  })

  it('SHED_LEVELS ladder is defined in the documented order (full → floor)', () => {
    expect(SHED_LEVELS[0]).toEqual({ siblings: 1, leadingBoundaries: 1, trailingBoundaries: 1 })
    expect(SHED_LEVELS[SHED_LEVELS.length - 1]).toEqual({ siblings: 0, leadingBoundaries: 0, trailingBoundaries: 0 })
  })
})

describe('MantinePagination — onChange/value navigation (admin-table paging behavior)', () => {
  it('clicking Next fires onChange with value+1', () => {
    const onChange = vi.fn()
    const { getAllByRole } = render(withProvider(<MantinePagination total={10} value={5} onChange={onChange} nextLabel="Next page" />))
    const next = getAllByRole('button').find((b) => b.getAttribute('aria-label') === 'Next page')
    expect(next).toBeTruthy()
    fireEvent.click(next as HTMLElement)
    expect(onChange).toHaveBeenCalledWith(6)
  })

  it('clicking Previous fires onChange with value-1', () => {
    const onChange = vi.fn()
    const { getAllByRole } = render(withProvider(<MantinePagination total={10} value={5} onChange={onChange} previousLabel="Previous page" />))
    const prev = getAllByRole('button').find((b) => b.getAttribute('aria-label') === 'Previous page')
    fireEvent.click(prev as HTMLElement)
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('Prev is disabled on page 1; Next is disabled on the last page', () => {
    const { getAllByRole, rerender } = render(
      withProvider(<MantinePagination total={10} value={1} onChange={() => {}} previousLabel="Previous page" nextLabel="Next page" />),
    )
    let buttons = getAllByRole('button')
    expect(buttons.find((b) => b.getAttribute('aria-label') === 'Previous page')).toBeDisabled()
    expect(buttons.find((b) => b.getAttribute('aria-label') === 'Next page')).not.toBeDisabled()

    rerender(withProvider(<MantinePagination total={10} value={10} onChange={() => {}} previousLabel="Previous page" nextLabel="Next page" />))
    buttons = getAllByRole('button')
    expect(buttons.find((b) => b.getAttribute('aria-label') === 'Next page')).toBeDisabled()
    expect(buttons.find((b) => b.getAttribute('aria-label') === 'Previous page')).not.toBeDisabled()
  })
})

describe('MantinePagination — never-wraps CSS invariant (Rule 1)', () => {
  const cases = [
    { total: 10, value: 5 },
    { total: 50, value: 25 },
    { total: 250, value: 137 },
    { total: 1, value: 1 },
  ]

  it.each(cases)('row is flex-nowrap + overflow:hidden for total=$total value=$value', ({ total, value }) => {
    const { container } = render(withProvider(<MantinePagination total={total} value={value} onChange={() => {}} />))
    const row = container.querySelector('.mantine-Pagination-root > div') as HTMLElement
    expect(row).toBeTruthy()
    // Task 741 R53: the row is a Mantine `Group` (no `style` object). jsdom loads no stylesheet, so the declarations
    // are asserted at their source: the Group's own CSS variables and `max-width` prop (`flex-wrap: nowrap` and the
    // `gap` come from them). The row carries no `overflow: hidden` (Task 741 R57: it clipped the keyboard focus ring); the
    // computed values are measured in the real browser (Task 741 Revision 3g, AC52).
    expect(row.classList.contains('mantine-Group-root')).toBe(true)
    expect(row.style.getPropertyValue('--group-wrap')).toBe('nowrap')
    expect(row.style.getPropertyValue('--group-gap')).toBe('var(--mantine-spacing-xs)')
    expect(row.style.maxWidth).toBe('100%')
  })

  it('single page (total=1) renders without crashing', () => {
    expect(() => render(withProvider(<MantinePagination total={1} value={1} onChange={() => {}} />))).not.toThrow()
  })

  it('total=0 renders nothing (no crash)', () => {
    const { container } = render(withProvider(<MantinePagination total={0} value={1} onChange={() => {}} />))
    expect(container.querySelector('.mantine-Pagination-root')).toBeNull()
  })

  it('Task 777 — the active control carries aria-current="page" and a non-active control does not', () => {
    const { getAllByRole, getByRole } = render(withProvider(<MantinePagination total={10} value={5} onChange={() => {}} />))
    const activeControl = getByRole('button', { name: '5' })

    expect(activeControl).toHaveAttribute('aria-current', 'page')
    getAllByRole('button')
      .filter((control) => control !== activeControl)
      .forEach((control) => expect(control).not.toHaveAttribute('aria-current'))
  })
})

describe('MantinePagination — hidden measuring probe (Task 784 Revision 3, D69-18 §13 pagination row)', () => {
  // Proves the probe stays non-announced, non-interactive, and never visible after Task 784
  // replaced its off-screen `left:-9999,top:-9999` coordinates with `position:'fixed'` (no
  // coordinates). Measurability itself (a non-zero `getBoundingClientRect()` width) is a
  // structural CSS-spec guarantee of `visibility:hidden` — unlike `display:none`, a
  // `visibility:hidden` element is still laid out and participates in layout/measurement; jsdom
  // does not implement real layout, so that specific property is not independently jsdom-testable
  // and is not asserted here — it is a property of the CSS itself, not of this component's logic.
  it('the probe renders aria-hidden, non-focusable, and pointer-events:none once mounted', async () => {
    const { container, findByText } = render(withProvider(<MantinePagination total={100} value={1} onChange={() => {}} />))
    // `mounted` flips via a useEffect (Rule 4, SSR-safe) — wait for the probe's own text node.
    await findByText('100')
    const probe = container.querySelector('[aria-hidden="true"]') as HTMLElement
    expect(probe).toBeTruthy()
    expect(probe).toHaveAttribute('tabindex', '-1')
    // Task 741 R53: `position: fixed` is the `pos` style prop; `visibility: hidden` and `pointer-events: none` are the
    // module class (jsdom loads no stylesheet; the computed values are measured in the real browser, AC50).
    expect(probe.style.position).toBe('fixed')
    expect(probe.className).toMatch(/_probe_/)
  })

  it('the probe carries no off-screen coordinate (left/top) — only visibility/pointer-events/position hide it', async () => {
    const { container, findByText } = render(withProvider(<MantinePagination total={100} value={1} onChange={() => {}} />))
    await findByText('100')
    const probe = container.querySelector('[aria-hidden="true"]') as HTMLElement
    expect(probe.style.left).toBe('')
    expect(probe.style.top).toBe('')
  })
})

describe('MantinePagination — width budget is the consumer wrapper, not Pagination.Root (Task 741 R52/R54)', () => {
  // Production consumers wrap the pagination in a flex `Group`, where `Pagination.Root` hugs its content. In jsdom
  // there is no layout, so the wrapper reports 1000px and the root 100px, and the probe is 32px wide. Page buttons
  // 1, 2 and 3 render only when the budget comes from the wrapper; from the root (160px needed > 100px) the ladder
  // stays at its floor and renders only the current page.
  let restore: Array<() => void> = []
  beforeAll(() => {
    // jsdom defines `clientWidth` on `Element.prototype`, so `HTMLElement.prototype` normally has no own descriptor.
    const clientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')
    const rect = HTMLElement.prototype.getBoundingClientRect
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get(this: HTMLElement) {
        if (this.dataset.testid === 'consumer-wrapper') return 1000
        if (this.dataset.testid === 'consumer-wrapper-230') return 230
        if (this.classList.contains('mantine-Pagination-root')) return 100
        return 0
      },
    })
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const width = this.getAttribute('aria-hidden') === 'true' ? 32 : 0
      return { width, height: 0, top: 0, left: 0, right: width, bottom: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect
    }
    restore = [
      () => {
        if (clientWidth) Object.defineProperty(HTMLElement.prototype, 'clientWidth', clientWidth)
        else delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth
      },
      () => { HTMLElement.prototype.getBoundingClientRect = rect },
    ]
  })
  afterAll(() => restore.forEach(fn => fn()))

  it('renders pages 1, 2 and 3 for total=3 inside a wide consumer wrapper', async () => {
    const { container, findByText } = render(
      withProvider(
        <div data-testid="consumer-wrapper">
          <MantinePagination total={3} value={1} onChange={() => {}} />
        </div>,
      ),
    )
    await findByText('3', { selector: '[aria-hidden="true"]' }) // the mounted probe: the measurement has run
    const pages = [...container.querySelectorAll<HTMLElement>('.mantine-Pagination-control')]
      .filter(el => el.getAttribute('aria-hidden') !== 'true')
      .map(el => el.textContent)
      .filter(text => /^\d+$/.test(text ?? ''))
    expect(pages).toEqual(['1', '2', '3'])
  })

  it('fills the width: total=10 value=1 in a 230px wrapper (probe 32, gap 0) shows 1 2 3 10, not only 1 10 (Task 741 R58/R61)', async () => {
    const { container, findByText } = render(
      withProvider(
        <div data-testid="consumer-wrapper-230">
          <MantinePagination total={10} value={1} onChange={() => {}} />
        </div>,
      ),
    )
    await findByText('10', { selector: '[aria-hidden="true"]' })
    const pages = [...container.querySelectorAll<HTMLElement>('.mantine-Pagination-control')]
      .filter(el => el.getAttribute('aria-hidden') !== 'true')
      .map(el => el.textContent)
      .filter(text => /^\d+$/.test(text ?? ''))
    expect(pages).toEqual(['1', '2', '3', '10'])
  })
})

describe('MantinePagination — the R54 clientWidth stub is removed afterwards (Task 741 R60)', () => {
  it('HTMLElement.prototype has no own clientWidth again', () => {
    expect(Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')).toBeUndefined()
  })
})
