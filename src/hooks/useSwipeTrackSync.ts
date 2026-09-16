'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const SWIPE_THRESHOLD_RATIO = 0.18
const AXIS_LOCK_PX = 8
const TRANSITION_MS = 280

/**
 * Drives a wrap-around swipe carousel with `transform: translate3d()` on a single strip element —
 * never native scroll or `scroll-snap`. Below `sm` this is the gallery/lightbox's sole navigation
 * path, so it accepts touch drag, mouse/pen drag and `ArrowLeft`/`ArrowRight` keyboard input —
 * three input adapters feeding ONE `dragStart`/`dragMove`/`dragEnd` state machine, never a
 * duplicated copy per input type.
 *
 * - The strip renders `buildWrappedSlides(images)` — `[last, ...images, first]` when
 *   `count > 1` — at a fixed pixel width per slide (`width`, measured via `ResizeObserver`).
 * - `internalIndex` (0..count+1, offset by 1 for the leading clone) is the strip's OWN position,
 *   separate from the caller's logical `activeIndex` (0..count-1). `translateX = -(internalIndex *
 *   width) + dragOffset`.
 * - During a drag, `dragOffset` tracks the pointer 1:1, clamped to `±width` — the strip can be
 *   pulled toward the previous or next slide but never past either, and `transition` is off so it
 *   follows the pointer exactly.
 * - On release, `transition` turns on and `internalIndex` moves by AT MOST ONE step
 *   (`current + deltaIndex`, `deltaIndex` one of -1/0/+1) — the animation is always between two
 *   adjacent slides, never a flight across the whole strip.
 * - If that settle lands on a clone slot (0 or count+1), a rebase (`rebaseIfOnClone`) — transition
 *   off, double-`requestAnimationFrame` before turning it back on so the browser paints the
 *   jump-free frame first — snaps `internalIndex` to the real slide it stood in for (count or 1).
 *   The user only ever sees the single-step animation into the clone; the rebase is invisible
 *   because the clone is a pixel-identical copy of the real slide. This runs from the track's own
 *   `transitionend`/`transitioncancel` (interrupting a mid-flight transition — e.g. a new gesture
 *   starting before the previous one settled visually — fires `transitioncancel`, never
 *   `transitionend`) AND defensively at the very start of every new gesture/keypress, so a second
 *   gesture beginning before the first one's rebase event has fired can never compute its own
 *   `deltaIndex` from a stale clone position and walk `internalIndex` outside `[0, count+1]`.
 * - `onIndexChange` (the caller's `activeIndex` setter) fires exactly once per completed swipe,
 *   at release, with the wrapped-and-clamped real index — never from the invisible clone rebase.
 *
 * **Callback refs, not plain `useRef`** — a consumer's `<div ref={containerRef}>` can sit inside a
 * Mantine `Modal.Root keepMounted={false}`, which does not render that subtree into the DOM until
 * the modal opens. A plain `useRef` combined with `useEffect(..., [])` runs its setup exactly once,
 * before the modal has ever opened, while the ref is still `null`, and never runs again. Callback
 * refs (`containerRef`/`trackRef` below, backed by `containerEl`/`trackEl` state) make every
 * element-dependent effect depend on the ELEMENT itself, so it (re)runs whenever a real DOM node
 * actually attaches — including a delayed attach after the modal opens.
 *
 * **Native `addEventListener`, not JSX `onTouch*`/`onPointer*` props** — React attaches these
 * passively at the root by default, so `e.preventDefault()` inside a synthetic handler cannot stop
 * the page's own scroll from also acting on the same gesture. A real listener with
 * `{ passive: false }` on the move event is required to claim it.
 *
 * **Pointer events ignore `pointerType === 'touch'`** — touch input is handled entirely by the
 * dedicated `touchstart`/`touchmove`/`touchend` listeners below; a browser also fires `pointer*`
 * events for touch, and handling the same physical gesture twice through two adapters would double
 * the state-machine calls. Mouse and pen are the pointer path's only real consumers. `onPointerDown`
 * also ignores any non-primary button and calls `setPointerCapture` — without it, a drag that
 * crosses the container's own edge before release stops receiving `pointermove` (so `dragOffset`
 * freezes mid-drag) and `pointerup` fires wherever the cursor ended up, not on this element, so
 * `dragEnd` never runs.
 *
 * **Axis lock** (first `AXIS_LOCK_PX` of movement decides horizontal vs. vertical) — a vertical
 * gesture is never intercepted, so page scroll starting on this track still works.
 *
 * **External `activeIndex` changes** (this hook is also used where the caller can change
 * `activeIndex` from elsewhere — a lightbox's own prev/next/select) animate the strip to match,
 * unless the change was self-caused (`isInternalChange`), in which case the strip is already there.
 */
export function useSwipeTrackSync(activeIndex: number, count: number, onIndexChange: (index: number) => void, ariaLabel: string) {
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null)
  const [trackEl, setTrackEl] = useState<HTMLDivElement | null>(null)
  const containerRef = useCallback((node: HTMLDivElement | null) => setContainerEl(node), [])
  const trackRef = useCallback((node: HTMLDivElement | null) => setTrackEl(node), [])
  const wraps = count > 1

  const [width, setWidth] = useState(0)
  const [internalIndex, setInternalIndex] = useState(() => (wraps ? activeIndex + 1 : activeIndex))
  const [dragOffset, setDragOffset] = useState(0)
  const [transitionEnabled, setTransitionEnabled] = useState(false)

  const activeIndexRef = useRef(activeIndex)
  activeIndexRef.current = activeIndex
  const countRef = useRef(count)
  countRef.current = count
  const onIndexChangeRef = useRef(onIndexChange)
  onIndexChangeRef.current = onIndexChange
  const internalIndexRef = useRef(internalIndex)
  internalIndexRef.current = internalIndex
  const isInternalChange = useRef(false)

  function toInternal(index: number) {
    return wraps ? index + 1 : index
  }

  // Measure the container's own width whenever it (re)attaches — the fixed pixel size every
  // slide and the transform math are based on. useLayoutEffect so the first paint already has a
  // real value, no 0-width flash.
  useLayoutEffect(() => {
    if (!containerEl) return
    setWidth(containerEl.clientWidth)
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setWidth(w)
    })
    observer.observe(containerEl)
    return () => observer.disconnect()
  }, [containerEl])

  // External activeIndex change (not caused by this hook's own swipe) — animate to match.
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false
      return
    }
    setTransitionEnabled(true)
    setDragOffset(0)
    setInternalIndex(toInternal(activeIndex))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex])

  // Snaps `internalIndex` off a clone slot (0 or count+1) back to the real slide it stood in for.
  // `reenableTransition`: the transitionend/transitioncancel path wants the delayed double-rAF
  // re-enable so the jump stays invisible; a defensive call from a NEW gesture's own start does
  // not — that gesture already disables the transition itself and will re-enable it on its own
  // settle, so a delayed re-enable firing mid-drag would fight it.
  function rebaseIfOnClone(reenableTransition: boolean) {
    if (!wraps) return
    const n = countRef.current
    const current = internalIndexRef.current
    if (current !== 0 && current !== n + 1) return
    const realSlot = current === 0 ? n : 1
    internalIndexRef.current = realSlot
    setTransitionEnabled(false)
    setInternalIndex(realSlot)
    if (reenableTransition) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitionEnabled(true))
      })
    }
  }

  useEffect(() => {
    if (!trackEl || !wraps) return
    function onTrackTransitionEvent(e: TransitionEvent) {
      if (e.target !== trackEl || e.propertyName !== 'transform') return
      rebaseIfOnClone(true)
    }
    trackEl.addEventListener('transitionend', onTrackTransitionEvent)
    trackEl.addEventListener('transitioncancel', onTrackTransitionEvent)
    return () => {
      trackEl.removeEventListener('transitionend', onTrackTransitionEvent)
      trackEl.removeEventListener('transitioncancel', onTrackTransitionEvent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackEl, wraps])

  // A `deltaIndex` of -1/+1 that would walk past either end in non-wrap mode (count <= 1, so
  // there is nothing to wrap onto) becomes a no-op instead of animating into a nonexistent slide.
  function clampDelta(deltaIndex: -1 | 0 | 1): -1 | 0 | 1 {
    if (wraps || deltaIndex === 0) return deltaIndex
    const target = activeIndexRef.current + deltaIndex
    if (target < 0 || target > countRef.current - 1) return 0
    return deltaIndex
  }

  function settle(deltaIndex: -1 | 0 | 1) {
    setTransitionEnabled(true)
    setDragOffset(0)
    setInternalIndex(internalIndexRef.current + deltaIndex)
    if (deltaIndex !== 0) {
      const n = countRef.current
      let newReal = activeIndexRef.current + deltaIndex
      newReal = wraps ? ((newReal % n) + n) % n : Math.max(0, Math.min(n - 1, newReal))
      isInternalChange.current = true
      onIndexChangeRef.current(newReal)
    }
  }

  // Touch, pointer (mouse/pen) and keyboard adapters — (re)attached whenever the container element
  // actually changes.
  useEffect(() => {
    if (!containerEl) return
    const container = containerEl

    const drag = { active: false, startX: 0, startY: 0, axis: null as 'x' | 'y' | null, offset: 0 }
    // A horizontal drag must not ALSO fire the slide's onClick (which opens the lightbox) once
    // released — real touch/pointer input reliably suppresses the browser's own post-gesture
    // synthetic click after a moved/prevented-default move, but this is enforced explicitly here
    // too (a capture-phase 'click' listener that swallows the one click following a drag) so the
    // guarantee does not depend on a specific browser's click-suppression heuristics. Reset at the
    // START of every new gesture (not left to linger until a click happens to arrive) — a drag
    // whose move-phase preventDefault already suppressed the browser's own synthetic click means
    // no click ever arrives to clear this flag via `onClickCapture`, so leaving it set would
    // silently swallow the NEXT, unrelated tap's click instead.
    let suppressNextClick = false

    function dragStart(x: number, y: number) {
      drag.active = true
      drag.startX = x
      drag.startY = y
      drag.axis = null
      drag.offset = 0
      setTransitionEnabled(false)
      setDragOffset(0)
    }

    function dragMove(x: number, y: number, preventDefault: () => void) {
      if (!drag.active) return
      const dx = x - drag.startX
      const dy = y - drag.startY
      if (drag.axis === null) {
        if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return
        drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        if (drag.axis === 'x') suppressNextClick = true
      }
      if (drag.axis !== 'x') return
      preventDefault()
      const w = container.clientWidth
      // `drag.offset` (a plain mutable field, updated synchronously) is what `dragEnd` reads — not
      // a React-state-mirroring ref. A ref that only updates on render commit could read a stale
      // (often 0) value if several move events land before the browser yields a paint/microtask,
      // undercounting the drag and wrongly snapping back to the same slide.
      drag.offset = Math.max(-w, Math.min(w, dx))
      setDragOffset(drag.offset)
    }

    function dragEnd() {
      if (!drag.active) return
      drag.active = false
      if (drag.axis !== 'x') return
      const w = container.clientWidth
      const threshold = w * SWIPE_THRESHOLD_RATIO
      const offset = drag.offset
      const deltaIndex: -1 | 0 | 1 = offset < -threshold ? 1 : offset > threshold ? -1 : 0
      settle(clampDelta(deltaIndex))
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return
      suppressNextClick = false
      rebaseIfOnClone(false)
      dragStart(e.touches[0].clientX, e.touches[0].clientY)
    }
    function onTouchMove(e: TouchEvent) {
      if (!drag.active) return
      const touch = e.touches[0]
      if (!touch) return
      dragMove(touch.clientX, touch.clientY, () => e.preventDefault())
    }
    function onTouchEnd() {
      dragEnd()
    }

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType === 'touch') return
      if (e.button !== 0) return // ignore right/middle press — only the primary button drags
      suppressNextClick = false
      rebaseIfOnClone(false)
      dragStart(e.clientX, e.clientY)
      // Retargets every subsequent pointer event to `container` through `pointerup`, even once the
      // cursor leaves it mid-drag — without this, `pointermove` stops firing past the container's
      // edge and `pointerup` lands elsewhere, so `dragEnd` never runs and the strip is left frozen
      // at a partial `dragOffset`.
      try { container.setPointerCapture(e.pointerId) } catch { /* unsupported pointerId — drag still works inside the container */ }
    }
    function onPointerMove(e: PointerEvent) {
      if (e.pointerType === 'touch') return
      dragMove(e.clientX, e.clientY, () => e.preventDefault())
    }
    function onPointerUp(e: PointerEvent) {
      if (e.pointerType === 'touch') return
      dragEnd()
      try { container.releasePointerCapture(e.pointerId) } catch { /* already released (e.g. pointercancel) */ }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        rebaseIfOnClone(false)
        settle(clampDelta(-1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        rebaseIfOnClone(false)
        settle(clampDelta(1))
      }
    }

    function onClickCapture(e: MouseEvent) {
      if (!suppressNextClick) return
      suppressNextClick = false
      e.stopPropagation()
      e.preventDefault()
    }

    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd, { passive: true })
    container.addEventListener('touchcancel', onTouchEnd, { passive: true })
    container.addEventListener('pointerdown', onPointerDown)
    container.addEventListener('pointermove', onPointerMove, { passive: false })
    container.addEventListener('pointerup', onPointerUp)
    container.addEventListener('pointercancel', onPointerUp)
    container.addEventListener('keydown', onKeyDown)
    container.addEventListener('click', onClickCapture, true)
    return () => {
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
      container.removeEventListener('touchcancel', onTouchEnd)
      container.removeEventListener('pointerdown', onPointerDown)
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerup', onPointerUp)
      container.removeEventListener('pointercancel', onPointerUp)
      container.removeEventListener('keydown', onKeyDown)
      container.removeEventListener('click', onClickCapture, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerEl, wraps])

  const translateX = -(internalIndex * width) + dragOffset

  return {
    containerRef,
    trackRef,
    // Makes the track itself a focusable, named region for `ArrowLeft`/`ArrowRight` keyboard
    // navigation — spread onto the same element `containerRef` attaches to.
    containerA11yProps: {
      tabIndex: 0,
      role: 'group' as const,
      'aria-label': ariaLabel,
    },
    // Explicit `width`/`height: 100%` on the track (not left to the flex/auto-height cascade) —
    // every slide's own `height: 100%` needs a DEFINITE ancestor height to resolve against, or it
    // computes as if unspecified and each slide falls back to its image's intrinsic aspect ratio,
    // making slides of different heights during a drag depending on which photo they hold.
    trackStyle: {
      display: 'flex' as const,
      width: '100%',
      height: '100%',
      transform: `translate3d(${translateX}px, 0, 0)`,
      transition: transitionEnabled ? `transform ${TRANSITION_MS}ms ease-out` : 'none',
    },
    // Every slide — including the clones — gets the identical container-width viewport box:
    // fixed width, full track height, clipped. `minHeight: 0` overrides the flex item default
    // (`min-height: auto`, which floors a row-flex child's height at its CONTENT's intrinsic size)
    // — without it, a tall image could still force its own slide taller than `height: 100%`
    // regardless of the explicit value, since `auto` only becomes a real 0 floor when set
    // explicitly. The image inside fills this box itself (a consumer concern: `width`/
    // `height: 100%` + an agreed `object-fit`), so two adjacent photos visible mid-drag always
    // share one media-frame height and never show empty space under either, regardless of their
    // own intrinsic aspect ratio.
    slideStyle: {
      flex: `0 0 ${width}px`,
      width: `${width}px`,
      height: '100%',
      minHeight: 0,
      overflow: 'hidden' as const,
    },
  }
}

/**
 * Builds the `count + 2` wrapped slide list a `useSwipeTrackSync` track must render when
 * `items.length > 1`: `[last, ...items, first]`. Returns `items` unchanged (no wrap) otherwise —
 * matching the hook's own `wraps = count > 1` condition exactly, so a consumer never needs to
 * duplicate that threshold.
 */
export function buildWrappedSlides<T>(items: T[]): T[] {
  if (items.length <= 1) return items
  return [items[items.length - 1], ...items, items[0]]
}
