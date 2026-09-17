'use client'

import { useEffect, useRef, type RefObject } from 'react'

export interface ComputeNearestScrollLeftArgs {
  scrollLeft: number
  clientWidth: number
  itemStart: number
  itemEnd: number
}

/**
 * Pure: the smallest `scrollLeft` change that brings `[itemStart, itemEnd]` fully inside
 * `[scrollLeft, scrollLeft + clientWidth]`. Never centres — Task 825 owner decision §16.2 ("Лише
 * щоб була видима" / "just enough to be visible"). An item wider than the viewport aligns to its
 * own start rather than its end, matching the left-aligned overflow convention Task 824 R35
 * already established for this same scroller shape.
 */
export function computeNearestScrollLeft({ scrollLeft, clientWidth, itemStart, itemEnd }: ComputeNearestScrollLeftArgs): number {
  if (itemEnd - itemStart > clientWidth) return itemStart
  if (itemStart < scrollLeft) return itemStart
  if (itemEnd > scrollLeft + clientWidth) return itemEnd - clientWidth
  return scrollLeft
}

export interface ResolveScrollBehaviorArgs {
  isFirstRun: boolean
  prefersReducedMotion: boolean
  previousIndex: number
  nextIndex: number
  count: number
  scrollLeft: number
  nextScrollLeft: number
  clientWidth: number
}

/**
 * Pure: whether a `scrollTo` call should animate. Task 825 Revision 2 owner return — a wrap step
 * (last photo -> first, or first -> last) must never visibly run the carousel past every photo in
 * between; it must land instantly, exactly like the change is invisible. `'auto'` on the first run
 * after mount, under `prefers-reduced-motion: reduce`, on a wrap step (`count >= 3` and the index
 * pair is `(count-1, 0)` or `(0, count-1)`), or on any step whose scroll distance exceeds one
 * viewport (the same "don't show the run" rule, for a jump that isn't a literal wrap but would look
 * like one). Every other step — an adjacent, in-viewport change — animates with `'smooth'`.
 */
export function resolveScrollBehavior({
  isFirstRun,
  prefersReducedMotion,
  previousIndex,
  nextIndex,
  count,
  scrollLeft,
  nextScrollLeft,
  clientWidth,
}: ResolveScrollBehaviorArgs): ScrollBehavior {
  if (isFirstRun || prefersReducedMotion) return 'auto'
  const isWrap = count >= 3 && ((previousIndex === count - 1 && nextIndex === 0) || (previousIndex === 0 && nextIndex === count - 1))
  if (isWrap) return 'auto'
  if (Math.abs(nextScrollLeft - scrollLeft) > clientWidth) return 'auto'
  return 'smooth'
}

/**
 * Scrolls `scrollerRef`'s own element — never an ancestor — just enough to bring its row's
 * `activeIndex`-th child into view when `activeIndex` changes. Deliberately not
 * `Element.scrollIntoView()`: that call also scrolls ancestors (here, Mantine's `Modal.Content`
 * and the page), which is exactly the defect Task 825 Revision 1 exists to avoid. `behavior` comes
 * from `resolveScrollBehavior`: `'auto'` on the first run after mount, under
 * `prefers-reduced-motion: reduce`, and on a wrap step (Task 825 Revision 2 — a wrap must not
 * visibly run across the row); otherwise `'smooth'`.
 */
export function useKeepActiveInView(scrollerRef: RefObject<HTMLElement | null>, activeIndex: number) {
  const isFirstRun = useRef(true)
  const previousIndex = useRef(activeIndex)

  useEffect(() => {
    const wasFirstRun = isFirstRun.current
    const previousActiveIndex = previousIndex.current
    isFirstRun.current = false
    previousIndex.current = activeIndex

    const scroller = scrollerRef.current
    if (!scroller) return
    const row = scroller.firstElementChild
    const item = row?.children[activeIndex] as HTMLElement | undefined
    if (!item) return
    const count = row?.children.length ?? 0

    // `getBoundingClientRect()`, not `offsetLeft`/`offsetWidth`: `offsetLeft` is relative to
    // `offsetParent` (the nearest ancestor with a non-static `position`), which is NOT
    // necessarily this scroller — the desktop thumbnail-strip scroller has no `position` of its
    // own (`Group` sets none), so its items' `offsetLeft` resolved against `Center` (a much
    // larger ancestor) instead, computing a bogus target almost every step. Measuring both rects
    // in the same (viewport) coordinate space and re-deriving the scroller-relative offset from
    // `scroller.scrollLeft` works regardless of which element happens to be the offsetParent.
    const scrollerRect = scroller.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()
    const itemStart = itemRect.left - scrollerRect.left + scroller.scrollLeft
    const itemEnd = itemStart + itemRect.width
    const nextScrollLeft = computeNearestScrollLeft({
      scrollLeft: scroller.scrollLeft,
      clientWidth: scroller.clientWidth,
      itemStart,
      itemEnd,
    })
    if (nextScrollLeft === scroller.scrollLeft) return

    const prefersReducedMotion =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false
    const behavior = resolveScrollBehavior({
      isFirstRun: wasFirstRun,
      prefersReducedMotion,
      previousIndex: previousActiveIndex,
      nextIndex: activeIndex,
      count,
      scrollLeft: scroller.scrollLeft,
      nextScrollLeft,
      clientWidth: scroller.clientWidth,
    })
    scroller.scrollTo({ left: nextScrollLeft, behavior })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scrollerRef is a stable ref object
  }, [activeIndex])
}
