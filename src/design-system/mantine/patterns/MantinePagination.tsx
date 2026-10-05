'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Group, Pagination, type MantineColor, type MantineSize } from '@mantine/core'
import styles from './MantinePagination.module.css'

export interface MantinePaginationProps {
  /** Total number of pages, must be an integer. */
  total: number
  /** Active page for a controlled component. */
  value?: number
  /** Active page for an uncontrolled component. */
  defaultValue?: number
  /** Called when the page changes. */
  onChange?: (page: number) => void
  /** Key of `theme.colors`, active-item color. @default 'brand' */
  color?: MantineColor
  /** Height/min-width of controls at ≥640px (desktop stays size-agnostic — Task 533/535). */
  size?: MantineSize | (string & {})
  /** Disables all controls. */
  disabled?: boolean
  /** `aria-label` for the Previous control (Task 533 `storybook.mantine.pagination_aria_prev`). */
  previousLabel?: string
  /** `aria-label` for the Next control (Task 533 `storybook.mantine.pagination_aria_next`). */
  nextLabel?: string
  /** Per-page `aria-label`, e.g. `(page) => \`Go to page ${page}\``. */
  getPageAriaLabel?: (page: number) => string
}

type RangeItem = number | 'dots'

function range(start: number, end: number): number[] {
  if (end < start) return []
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

/**
 * EXACT copy of Mantine's own `usePagination` range algorithm (`@mantine/hooks/
 * use-pagination.mjs`, verbatim, `boundaries` hardcoded to the stock symmetric default of 1
 * both sides) — used ONLY for shed level 0 (the prior Mantine stock default this component
 * replaces). Kept byte-identical on purpose (verified in the Task 535 regression test against
 * `usePagination`'s own output across 9 total/active combinations) so wide-desktop rendering
 * is pixel-for-pixel unchanged from before this task.
 */
function computeFullRange(total: number, active: number, siblings: number): RangeItem[] {
  const _total = Math.max(Math.trunc(total), 0)
  const boundaries = 1
  const totalPageNumbers = siblings * 2 + 3 + boundaries * 2
  if (totalPageNumbers >= _total) return range(1, _total)

  const leftSiblingIndex = Math.max(active - siblings, boundaries)
  const rightSiblingIndex = Math.min(active + siblings, _total - boundaries)
  const shouldShowLeftDots = leftSiblingIndex > boundaries + 2
  const shouldShowRightDots = rightSiblingIndex < _total - (boundaries + 1)

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = siblings * 2 + boundaries + 2
    return [...range(1, leftItemCount), 'dots', ...range(_total - (boundaries - 1), _total)]
  }
  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = boundaries + 1 + 2 * siblings
    return [...range(1, boundaries), 'dots', ...range(_total - rightItemCount, _total)]
  }
  return [
    ...range(1, boundaries),
    'dots',
    ...range(leftSiblingIndex, rightSiblingIndex),
    'dots',
    ...range(_total - boundaries + 1, _total),
  ]
}

/**
 * Asymmetric range for the SHED levels (siblings always 0 in `SHED_LEVELS` — see below):
 * shows the leading-boundary page-1 (if `leading`), the current page, and the
 * trailing-boundary last page (if `trailing`), with a `dots` marker filling any gap of more
 * than one hidden page. This is deliberately simpler than Mantine's own near-edge-widening
 * branches (`computeFullRange` above) — those exist purely as a *cosmetic* smoothing for the
 * dense, always-both-boundaries-present default; the shed path's whole purpose is to
 * MINIMIZE width when space is tight, so that cosmetic widening is not applicable (and would
 * defeat the point of shedding). Correct-by-construction: builds a deduplicated, sorted set of
 * fixed points, so it can never render a duplicate or out-of-order page number.
 */
function computeAsymmetricRange(total: number, active: number, leading: 0 | 1, trailing: 0 | 1): RangeItem[] {
  const _total = Math.max(Math.trunc(total), 0)
  if (_total === 0) return []
  const clampedActive = Math.min(Math.max(Math.trunc(active), 1), _total)
  const pages = new Set<number>()
  if (leading) pages.add(1)
  pages.add(clampedActive)
  if (trailing) pages.add(_total)

  const sorted = Array.from(pages).sort((a, b) => a - b)
  const result: RangeItem[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('dots')
    result.push(sorted[i])
  }
  return result
}

/**
 * Fill range (Task 741 R58, owner D46-8: "fill to width"): the pages are 1, `total`, the current page and up to `fill`
 * neighbours of the current page, tried in the order active+1, active−1, active+2, active−2, … A page below 1, above
 * `total` or already present is skipped and does not count. A gap that hides exactly one page shows that page instead
 * of `dots` (the same item count, and no dots standing in for a single number); a larger gap shows `dots`.
 */
function computeFillRange(total: number, active: number, fill: number): RangeItem[] {
  const _total = Math.max(Math.trunc(total), 0)
  if (_total === 0) return []
  const clampedActive = Math.min(Math.max(Math.trunc(active), 1), _total)
  const pages = new Set<number>([1, _total, clampedActive])
  let added = 0
  for (let step = 1; added < fill && step <= _total; step++) {
    for (const candidate of [clampedActive + step, clampedActive - step]) {
      if (added >= fill) break
      if (candidate < 1 || candidate > _total || pages.has(candidate)) continue
      pages.add(candidate)
      added++
    }
  }
  const sorted = Array.from(pages).sort((a, b) => a - b)
  const result: RangeItem[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const gap = sorted[i] - sorted[i - 1]
      if (gap === 2) result.push(sorted[i] - 1)
      else if (gap > 2) result.push('dots')
    }
    result.push(sorted[i])
  }
  return result
}

/**
 * Computes the visible range for a given shed level. Level 0 (siblings=1, both boundaries)
 * uses the exact Mantine algorithm (`computeFullRange`); every shed level (siblings=0) uses
 * the simpler `computeAsymmetricRange`, which is what makes the asymmetric drop-one-side shed
 * (Rule 3) possible — Mantine's own `boundaries` prop is a single symmetric number and cannot
 * express "keep leading, drop trailing."
 */
export function computeShedRange(
  total: number,
  active: number,
  siblings: number,
  leadingBoundaries: 0 | 1,
  trailingBoundaries: 0 | 1,
  fill = 0,
): RangeItem[] {
  if (fill > 0) return computeFillRange(total, active, fill)
  if (siblings === 1 && leadingBoundaries === 1 && trailingBoundaries === 1) {
    return computeFullRange(total, active, siblings)
  }
  return computeAsymmetricRange(total, active, leadingBoundaries, trailingBoundaries)
}

// Rule 3 shed ladder (Task 535 kickoff): applied in order until the row fits.
// Levels 1–3 fill the width with as many neighbouring pages as fit (owner D46-8, Task 741 R58).
// Level 0 = the prior Mantine stock default (siblings=1, boundaries=1 both sides) — the
// SAME visual density MantineAdminSurfacePattern rendered before this task, so wide desktop
// is unaffected. The last level = the floor (Prev·current·Next), never shed further.
export const SHED_LEVELS: ReadonlyArray<{ siblings: number; leadingBoundaries: 0 | 1; trailingBoundaries: 0 | 1; fill?: number }> = [
  { siblings: 1, leadingBoundaries: 1, trailingBoundaries: 1 }, // 0 — full
  { siblings: 0, leadingBoundaries: 1, trailingBoundaries: 1, fill: 3 }, // 1 — fill: 1, last, current + 3 neighbours
  { siblings: 0, leadingBoundaries: 1, trailingBoundaries: 1, fill: 2 }, // 2 — fill: + 2 neighbours
  { siblings: 0, leadingBoundaries: 1, trailingBoundaries: 1, fill: 1 }, // 3 — fill: + 1 neighbour
  { siblings: 0, leadingBoundaries: 1, trailingBoundaries: 1 }, // 4 — drop siblings
  { siblings: 0, leadingBoundaries: 1, trailingBoundaries: 0 }, // 5 — drop trailing boundary + its dots
  { siblings: 0, leadingBoundaries: 0, trailingBoundaries: 0 }, // 6 — floor: leading boundary dropped too
]
const FLOOR_LEVEL = SHED_LEVELS.length - 1

/**
 * Canonical single-line, shed-to-fit Pagination (Task 535).
 *
 * Rule 1 — NEVER wraps, NEVER h-scrolls: the controls row is `flex-nowrap`, and the shed ladder below picks the
 * first level whose estimated width fits the consumer wrapper. The row carries no `overflow: hidden`, because that
 * clipped the keyboard focus ring (Task 741 R57, WCAG 2.2 2.4.7). It is safe by construction: the estimate gives
 * every control the probe's width (`String(total)`, the widest label that can appear) and the edge controls and dots
 * are never wider, so the estimate is at least the rendered width; and the floor (Prev·current·Next, 3 controls) fits
 * the narrowest wrapper in use.
 *
 * Rule 2 — dynamic shed-to-fit: a `ResizeObserver` on the component's own DOM parent
 * (NOT itself — the row is intrinsically content-width so it can stay centered/right-
 * aligned by the consumer's own `<Group justify=…>` wrapper exactly as before; the
 * *parent's* clientWidth is the real "available width" budget) measures space, and a
 * hidden probe control (rendered off-screen, `String(total)` — the widest label that
 * can ever appear) measures the real per-item width (size- and digit-count-aware, not
 * hardcoded). Levels are chosen by ARITHMETIC estimate (itemCount × itemWidth + gaps),
 * not by iteratively re-rendering each candidate — this converges in one pass and cannot
 * oscillate/thrash.
 *
 * Rule 3 — asymmetric shed ladder: composes `Pagination.Root` children directly
 * (`Pagination.Previous`, computed `Pagination.Control`/`Pagination.Dots` items,
 * `Pagination.Next`) instead of the stock `<Pagination>` composite, because Mantine's own
 * `boundaries` prop is symmetric and cannot "keep leading, drop trailing."
 *
 * Rule 4 — SSR-safe: server + the FIRST client render are always the floor level (no
 * hidden probe rendered server-side — it is `mounted`-gated). The `ResizeObserver` effect
 * then GROWS the visible set once real measurements are available — the first paint can
 * never wrap even before JS runs.
 *
 * Rule 5 — ≥44px mobile tap target: enforced via a `@media (max-width:639.98px)` rule in
 * `pagination-chrome.css` (Task 533's scoped stylesheet), not via a `theme.ts` `size`
 * override — desktop stays governed by the consumer's `size` prop (size-agnostic).
 *
 * Chrome (border/bg/radius/hover — Task 533) is UNCHANGED: this component still renders
 * the real `Pagination.Control`/`Pagination.Dots`/`Pagination.Previous`/`Pagination.Next`,
 * which still call `getStyles("control", …)` internally and still carry the
 * `.mantine-Pagination-control`/`.mantine-Pagination-edgeControl` stable classes the
 * Task 533 stylesheet targets. `color`/`radius` are passed directly on `Pagination.Root`
 * here (NOT via `theme.components.Pagination`, which only applies to the top-level
 * `<Pagination>` composite this component no longer uses — `theme.components.Pagination`
 * is left untouched per the kickoff, it is simply no longer the active code path).
 */
export function MantinePagination({
  total,
  value,
  defaultValue,
  onChange,
  color = 'brand',
  size,
  disabled,
  previousLabel,
  nextLabel,
  getPageAriaLabel,
}: MantinePaginationProps) {
  const isControlled = value !== undefined
  const [uncontrolledPage, setUncontrolledPage] = useState(defaultValue ?? 1)
  const activePage = isControlled ? (value as number) : uncontrolledPage

  const handleChange = (page: number) => {
    onChange?.(page)
    if (!isControlled) setUncontrolledPage(page)
  }

  // Rule 4 — SSR-safe: floor on the server and on the first client render.
  const [level, setLevel] = useState(FLOOR_LEVEL)
  const [mounted, setMounted] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    if (!mounted) return
    const row = rowRef.current
    const probe = probeRef.current
    if (!row) return
    // Available width = the CONSUMER wrapper's content width. The row sits inside `Pagination.Root`, which hugs its
    // content when the consumer wraps this component in a flex `Group`; measuring the root made the budget the
    // floor's own width, so the ladder never grew past the floor (Task 741 R52). The consumer wrapper is the root's
    // parent; the root itself is the fallback when it has none. The row is intrinsically content-sized so it can stay
    // centered/right-aligned exactly as the bare `<Pagination>` did before this task.
    const root = row.parentElement
    const parent = root?.parentElement ?? root
    if (!parent) return

    const measureAndSet = () => {
      const available = parent.clientWidth
      const controlW = probe?.getBoundingClientRect().width || 0
      const gapPx = parseFloat(getComputedStyle(row).columnGap || getComputedStyle(row).gap || '0') || 0
      if (!controlW || !available) return

      let chosen = FLOOR_LEVEL
      for (let i = 0; i < SHED_LEVELS.length; i++) {
        const lvl = SHED_LEVELS[i]
        const items = computeShedRange(total, activePage, lvl.siblings, lvl.leadingBoundaries, lvl.trailingBoundaries, lvl.fill)
        const itemCount = items.length + 2 // + Prev + Next
        const estimatedWidth = itemCount * controlW + Math.max(itemCount - 1, 0) * gapPx
        if (estimatedWidth <= available) {
          chosen = i
          break
        }
      }
      setLevel((prev) => (prev === chosen ? prev : chosen))
    }

    const ro = new ResizeObserver(() => measureAndSet())
    ro.observe(parent)
    measureAndSet()
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, total, activePage])

  if (total <= 0) return null

  const lvl = SHED_LEVELS[level]
  const items = computeShedRange(total, activePage, lvl.siblings, lvl.leadingBoundaries, lvl.trailingBoundaries, lvl.fill)

  return (
    <Pagination.Root
      total={total}
      value={activePage}
      onChange={handleChange}
      color={color}
      size={size}
      radius="lg"
      disabled={disabled}
    >
      <Group ref={rowRef} gap="xs" wrap="nowrap" align="center" maw="100%">
        <Pagination.Previous aria-label={previousLabel} />
        {items.map((item, i) =>
          item === 'dots' ? (
            <Pagination.Dots key={`dots-${i}`} />
          ) : (
            <Pagination.Control
              key={item}
              active={item === activePage}
              onClick={() => handleChange(item)}
              aria-label={getPageAriaLabel?.(item)}
              aria-current={item === activePage ? 'page' : undefined}
            >
              {item}
            </Pagination.Control>
          ),
        )}
        <Pagination.Next aria-label={nextLabel} />
        {mounted && (
          // Hidden measuring probe (Rule 2) — the widest label that can ever appear
          // (`String(total)`), same chrome/size as real controls, so its measured width is
          // digit-count- and mobile-≥44px-aware. Never rendered server-side (mounted-gated),
          // so it cannot cause a hydration mismatch.
          <Pagination.Control
            ref={probeRef}
            aria-hidden
            tabIndex={-1}
            pos="fixed"
            className={styles.probe}
          >
            {String(total)}
          </Pagination.Control>
        )}
      </Group>
    </Pagination.Root>
  )
}
