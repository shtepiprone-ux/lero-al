'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Pagination, type MantineColor, type MantineSize } from '@mantine/core'

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
): RangeItem[] {
  if (siblings === 1 && leadingBoundaries === 1 && trailingBoundaries === 1) {
    return computeFullRange(total, active, siblings)
  }
  return computeAsymmetricRange(total, active, leadingBoundaries, trailingBoundaries)
}

// Rule 3 shed ladder (Task 535 kickoff): applied in order until the row fits.
// Level 0 = the prior Mantine stock default (siblings=1, boundaries=1 both sides) — the
// SAME visual density MantineAdminSurfacePattern rendered before this task, so wide desktop
// is unaffected. Level 3 = the floor (Prev·current·Next), never shed further.
export const SHED_LEVELS: ReadonlyArray<{ siblings: number; leadingBoundaries: 0 | 1; trailingBoundaries: 0 | 1 }> = [
  { siblings: 1, leadingBoundaries: 1, trailingBoundaries: 1 }, // 0 — full
  { siblings: 0, leadingBoundaries: 1, trailingBoundaries: 1 }, // 1 — drop siblings
  { siblings: 0, leadingBoundaries: 1, trailingBoundaries: 0 }, // 2 — drop trailing boundary + its dots
  { siblings: 0, leadingBoundaries: 0, trailingBoundaries: 0 }, // 3 — floor: leading boundary dropped too
]
const FLOOR_LEVEL = SHED_LEVELS.length - 1

/**
 * Canonical single-line, shed-to-fit Pagination (Task 535).
 *
 * Rule 1 — NEVER wraps, NEVER h-scrolls: the controls row is `flex-nowrap` +
 * `overflow:hidden`; it is physically impossible to reach a 2nd line or a scrollbar.
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
    // Available width = the DOM parent's content width (the consumer's own `Group`/`Stack`
    // wrapper), NOT this row's own width — the row is intrinsically content-sized so it can
    // remain centered/right-aligned exactly as the bare `<Pagination>` did before this task.
    const parent = row.parentElement
    if (!parent) return

    const measureAndSet = () => {
      const available = parent.clientWidth
      const controlW = probe?.getBoundingClientRect().width || 0
      const gapPx = parseFloat(getComputedStyle(row).columnGap || getComputedStyle(row).gap || '0') || 0
      if (!controlW || !available) return

      let chosen = FLOOR_LEVEL
      for (let i = 0; i < SHED_LEVELS.length; i++) {
        const lvl = SHED_LEVELS[i]
        const items = computeShedRange(total, activePage, lvl.siblings, lvl.leadingBoundaries, lvl.trailingBoundaries)
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
  const items = computeShedRange(total, activePage, lvl.siblings, lvl.leadingBoundaries, lvl.trailingBoundaries)

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
      <div
        ref={rowRef}
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          alignItems: 'center',
          gap: 'var(--mantine-spacing-xs)',
          overflow: 'hidden',
          maxWidth: '100%',
        }}
      >
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
            style={{ position: 'fixed', visibility: 'hidden', pointerEvents: 'none' }}
          >
            {String(total)}
          </Pagination.Control>
        )}
      </div>
    </Pagination.Root>
  )
}
