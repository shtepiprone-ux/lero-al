/**
 * useKeepActiveInView — Task 825 Revision 1 (R11/AC12) and Revision 2 (R17/AC15).
 *
 * `computeNearestScrollLeft` is the pure geometry rule (§16.2 ③ "just enough to be visible,
 * never centred"): item past the right edge, past the left edge, fully visible (unchanged),
 * wider than the viewport (aligns to its own start), and exactly on both edges (unchanged).
 *
 * `resolveScrollBehavior` is the pure "should this animate" rule (Revision 2, owner return): a
 * wrap step (last -> first or first -> last) and any jump wider than one viewport must never
 * visibly run the carousel across the row.
 *
 * The hook itself: first run after mount uses `behavior: 'auto'`, a later `activeIndex` change
 * uses `'smooth'`, `prefers-reduced-motion: reduce` forces `'auto'` even on a later change, a wrap
 * step never animates, and `Element.scrollIntoView()` is never called (it would also scroll
 * `Modal.Content`/the page — exactly the defect this hook exists to avoid).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { computeNearestScrollLeft, resolveScrollBehavior, useKeepActiveInView } from '../useKeepActiveInView'

describe('resolveScrollBehavior', () => {
  const base = { isFirstRun: false, prefersReducedMotion: false }

  it('wrap forward (last -> first) never animates', () => {
    expect(
      resolveScrollBehavior({ ...base, previousIndex: 23, nextIndex: 0, count: 24, scrollLeft: 1000, nextScrollLeft: 1050, clientWidth: 100 }),
    ).toBe('auto')
  })

  it('wrap backward (first -> last) never animates', () => {
    expect(
      resolveScrollBehavior({ ...base, previousIndex: 0, nextIndex: 23, count: 24, scrollLeft: 50, nextScrollLeft: 0, clientWidth: 100 }),
    ).toBe('auto')
  })

  it('an adjacent non-wrap step within one viewport animates', () => {
    expect(
      resolveScrollBehavior({ ...base, previousIndex: 5, nextIndex: 6, count: 24, scrollLeft: 100, nextScrollLeft: 150, clientWidth: 100 }),
    ).toBe('smooth')
  })

  it('a non-wrap jump wider than one viewport never animates', () => {
    expect(
      resolveScrollBehavior({ ...base, previousIndex: 5, nextIndex: 10, count: 24, scrollLeft: 0, nextScrollLeft: 300, clientWidth: 100 }),
    ).toBe('auto')
  })

  it('count 2, index 1 -> 0 is not a wrap and animates', () => {
    expect(
      resolveScrollBehavior({ ...base, previousIndex: 1, nextIndex: 0, count: 2, scrollLeft: 50, nextScrollLeft: 0, clientWidth: 100 }),
    ).toBe('smooth')
  })

  it('the first run never animates', () => {
    expect(
      resolveScrollBehavior({ ...base, isFirstRun: true, previousIndex: 0, nextIndex: 0, count: 1, scrollLeft: 0, nextScrollLeft: 0, clientWidth: 100 }),
    ).toBe('auto')
  })

  it('reduced motion on a non-wrap step never animates', () => {
    expect(
      resolveScrollBehavior({ ...base, prefersReducedMotion: true, previousIndex: 5, nextIndex: 6, count: 24, scrollLeft: 100, nextScrollLeft: 150, clientWidth: 100 }),
    ).toBe('auto')
  })
})

describe('computeNearestScrollLeft', () => {
  it('item past the right edge scrolls just enough to reveal it', () => {
    expect(computeNearestScrollLeft({ scrollLeft: 0, clientWidth: 100, itemStart: 120, itemEnd: 150 })).toBe(50)
  })

  it('item past the left edge scrolls just enough to reveal it', () => {
    expect(computeNearestScrollLeft({ scrollLeft: 100, clientWidth: 100, itemStart: 50, itemEnd: 90 })).toBe(50)
  })

  it('item fully visible stays unchanged', () => {
    expect(computeNearestScrollLeft({ scrollLeft: 0, clientWidth: 100, itemStart: 20, itemEnd: 80 })).toBe(0)
  })

  it('item wider than the viewport aligns to its own start, never centres', () => {
    expect(computeNearestScrollLeft({ scrollLeft: 0, clientWidth: 100, itemStart: 10, itemEnd: 250 })).toBe(10)
  })

  it('item exactly on both edges stays unchanged', () => {
    expect(computeNearestScrollLeft({ scrollLeft: 20, clientWidth: 100, itemStart: 20, itemEnd: 120 })).toBe(20)
  })
})

interface ItemRect {
  left: number
  width: number
}

function rect(left: number, width: number): DOMRect {
  return { left, right: left + width, width, top: 0, bottom: 0, height: 0, x: left, y: 0, toJSON: () => ({}) }
}

// Mocks `getBoundingClientRect()`, not `offsetLeft`/`offsetWidth`: the hook deliberately does not
// use `offsetLeft` (relative to `offsetParent`, which is not reliably the scroller itself — see
// the hook's own comment). `contentLeft` is each item's fixed position in the scroller's content
// (scrollable) coordinate space; the mock recomputes each element's viewport-relative rect from
// the scroller's current `scrollLeft`, exactly like a real reflowing DOM would.
function buildScroller(itemRects: ItemRect[], clientWidth: number) {
  const scroller = document.createElement('div')
  const row = document.createElement('div')
  scroller.appendChild(row)
  let currentScrollLeft = 0
  for (const { left: contentLeft, width } of itemRects) {
    const item = document.createElement('div')
    item.getBoundingClientRect = () => rect(contentLeft - currentScrollLeft, width)
    row.appendChild(item)
  }
  scroller.getBoundingClientRect = () => rect(0, clientWidth)
  Object.defineProperty(scroller, 'clientWidth', { configurable: true, value: clientWidth })
  Object.defineProperty(scroller, 'scrollLeft', {
    configurable: true,
    get: () => currentScrollLeft,
    set: (v: number) => { currentScrollLeft = v },
  })
  scroller.scrollTo = vi.fn((opts?: ScrollToOptions) => {
    if (opts && typeof opts.left === 'number') currentScrollLeft = opts.left
  }) as typeof scroller.scrollTo
  return scroller
}

describe('useKeepActiveInView', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    vi.stubGlobal('matchMedia', matchMediaMock)
  })

  const ITEMS: ItemRect[] = [
    { left: 0, width: 50 },
    { left: 50, width: 50 },
    { left: 500, width: 50 },
  ]

  it('the first run after mount uses "auto"', () => {
    const scroller = buildScroller(ITEMS, 100)
    const ref = { current: scroller }
    renderHook(({ activeIndex }) => useKeepActiveInView(ref, activeIndex), { initialProps: { activeIndex: 2 } })
    expect(scroller.scrollTo).toHaveBeenCalledWith({ left: 450, behavior: 'auto' })
  })

  // Task 825 Revision 2 (R17) note: this test's original fixture moved 0 -> 2 on the 3-item
  // `ITEMS` array, i.e. exactly the (first, last) pair, 450px away in a 100px viewport. Once R17
  // landed, that same transition is legitimately reclassified `'auto'` by *both* new rules
  // (it is the wrap-backward index pair, AND it exceeds one viewport of scroll distance) — this is
  // R17's own intended effect, not a regression: AC15's own worked examples (①/②) use this exact
  // (0, count-1) pair to mean "never animate". The scenario this test exists to prove — a later,
  // ordinary, adjacent, in-range change still animates — needed a fixture that is not also the
  // wrap pair and not a >1-viewport jump, so it now uses its own 4-item, closer-together layout.
  const ADJACENT_ITEMS: ItemRect[] = [
    { left: 0, width: 50 },
    { left: 60, width: 50 },
    { left: 150, width: 50 },
    { left: 500, width: 50 },
  ]

  it('a later, adjacent, non-wrap activeIndex change uses "smooth"', () => {
    const scroller = buildScroller(ADJACENT_ITEMS, 100)
    const ref = { current: scroller }
    const { rerender } = renderHook(({ activeIndex }) => useKeepActiveInView(ref, activeIndex), { initialProps: { activeIndex: 1 } })
    vi.mocked(scroller.scrollTo).mockClear()
    rerender({ activeIndex: 2 })
    expect(scroller.scrollTo).toHaveBeenCalledWith({ left: 100, behavior: 'smooth' })
  })

  it('prefers-reduced-motion forces "auto" even on a later change', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    const scroller = buildScroller(ITEMS, 100)
    const ref = { current: scroller }
    const { rerender } = renderHook(({ activeIndex }) => useKeepActiveInView(ref, activeIndex), { initialProps: { activeIndex: 0 } })
    vi.mocked(scroller.scrollTo).mockClear()
    rerender({ activeIndex: 2 })
    expect(scroller.scrollTo).toHaveBeenCalledWith({ left: 450, behavior: 'auto' })
  })

  it('never calls Element.scrollIntoView', () => {
    const scroller = buildScroller(ITEMS, 100)
    const scrollIntoViewSpy = vi.fn()
    for (const child of Array.from(scroller.querySelectorAll('div'))) {
      ;(child as unknown as { scrollIntoView: () => void }).scrollIntoView = scrollIntoViewSpy
    }
    const ref = { current: scroller }
    renderHook(({ activeIndex }) => useKeepActiveInView(ref, activeIndex), { initialProps: { activeIndex: 2 } })
    expect(scrollIntoViewSpy).not.toHaveBeenCalled()
  })

  // Task 825 Revision 2 — AC15 failing arm, required first (kickoff §17.3). Retained deliberately:
  // this must fail against the unrevised (Revision 1) hook, proving the test can see the defect the
  // owner reported (a wrap step animates across the whole row) before R17's fix lands.
  it('a wrap step from the last index to the first never animates (R17)', () => {
    const scroller = buildScroller(ITEMS, 100)
    const ref = { current: scroller }
    const { rerender } = renderHook(({ activeIndex }) => useKeepActiveInView(ref, activeIndex), { initialProps: { activeIndex: 0 } })
    rerender({ activeIndex: 2 })
    vi.mocked(scroller.scrollTo).mockClear()
    rerender({ activeIndex: 0 })
    expect(scroller.scrollTo).toHaveBeenCalledWith({ left: 0, behavior: 'auto' })
  })

  it('a wrap step from the first index to the last never animates (the reverse)', () => {
    const scroller = buildScroller(ITEMS, 100)
    const ref = { current: scroller }
    const { rerender } = renderHook(({ activeIndex }) => useKeepActiveInView(ref, activeIndex), { initialProps: { activeIndex: 1 } })
    rerender({ activeIndex: 0 })
    vi.mocked(scroller.scrollTo).mockClear()
    rerender({ activeIndex: 2 })
    expect(scroller.scrollTo).toHaveBeenCalledWith({ left: 450, behavior: 'auto' })
  })
})
