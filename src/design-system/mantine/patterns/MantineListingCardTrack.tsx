'use client'

import { Children, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { ActionIcon, Box, useMantineTheme } from '@mantine/core'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import styles from './MantineListingCardTrack.module.css'

export interface MantineListingCardTrackProps {
  /**
   * `'grid'` — `repeat(auto-fill, minmax(var(--listing-card-min), 1fr))`, the column count is the
   * browser's arithmetic. `'rail'` — a horizontal-scroll flex row; a lone item fills the track up
   * to 480px (D74-5), and a track holding more items than fit renders each at a breakpoint-ladder
   * fraction of the container, capped at `var(--listing-card-min)` (D74-6) — never a fixed px width,
   * so a peek of the next card is always visible. No default — a caller that does not state its
   * mode is a bug, not a convenience (kickoff §10.2).
   */
  mode: 'grid' | 'rail'
  /** In `grid` mode the children ARE the grid items; in `rail` mode they ARE the flex items — this
   * primitive does not wrap each child in an extra element. */
  children: ReactNode
  /** Merged onto the root so a consumer (Task 807) can attach a section wrapper without a second
   * element. `rail` mode: applied to the positioning wrapper around the scroller (Task 810), not
   * the scroller itself — the scroller's own class stays reserved for the scroll/snap mechanism. */
  className?: string
  'data-testid'?: string
}

const RAIL_SCROLL_TOLERANCE_PX = 2

/**
 * Task 810 (R1-R3) — prev/next controls for the rail. Presence is derived purely from scroll
 * geometry (`scrollLeft`/`scrollWidth`/`clientWidth`): a control renders ONLY when the track can
 * actually scroll in that direction, and both are absent when the content does not overflow at all
 * (kickoff §3.3 case 2 — a control that cannot scroll must not render). Recomputed on `scroll`, on
 * `ResizeObserver` of the scroller, and whenever the child count changes.
 */
function RailControls({
  scrollerRef,
  childCount,
}: {
  scrollerRef: RefObject<HTMLDivElement | null>
  childCount: number
}) {
  const t = useTranslations('common')
  const theme = useMantineTheme()
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    const update = () => {
      setCanScrollPrev(el.scrollLeft > RAIL_SCROLL_TOLERANCE_PX)
      setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - RAIL_SCROLL_TOLERANCE_PX)
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [scrollerRef, childCount])

  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    // D74-8 (owner decision, 2026-09-10, Revision 1) — a whole SNAP-ALIGNED page, not "client width
    // minus one card". The earlier form (`clientWidth - (cardWidth + gap)`) under-scrolled: with
    // `.rail { scroll-snap-type: x proximity }` the browser re-snaps the landing point to the
    // nearest card boundary after every programmatic scroll, so subtracting a whole card's width
    // just gave the snap point that much LESS room to travel before it re-snapped to the same place
    // it started (measured, Revision 0's own baseline: 480px width scrolled 200px where the whole-
    // page arithmetic wants 399px; 872px width scrolled 515px where it wants 773px). Flooring the
    // client width to a whole number of card+gap pitches lands exactly ON a snap point by
    // construction, so nothing re-snaps it away — at an 872px track this yields
    // `3 × 257.70 = 773.11`, i.e. `clientWidth − peek`, matching AC13 directly.
    const firstChild = el.children[0] as HTMLElement | undefined
    const cardWidth = firstChild?.getBoundingClientRect().width ?? 0
    const gapPx = Number.parseFloat(getComputedStyle(el).columnGap) || 0
    const pitch = cardWidth + gapPx
    const delta = pitch > 0 ? Math.max(Math.floor(el.clientWidth / pitch) * pitch, pitch) : el.clientWidth
    // R3's own wording: the PAGE scroll stays smooth (this call). What the owner reported as an
    // unwanted "jump" was the CONTROL BUTTON itself relocating on `:active` (Mantine's built-in
    // press effect clobbering this component's centring transform — fixed in the CSS module, see
    // `.control:global(.mantine-active):active`), not this scroll animation; an earlier edit here
    // that switched this to `behavior: 'auto'` was a misdiagnosis and is reverted.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: direction * delta, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <>
      {canScrollPrev && (
        <ActionIcon
          type="button"
          variant="default"
          radius="xl"
          size={theme.other.touchTarget}
          className={cn(styles.control, styles.controlPrev)}
          onClick={() => scrollByPage(-1)}
          aria-label={t('aria_scroll_prev')}
        >
          <ChevronLeft size={theme.other.iconSize.standard} />
        </ActionIcon>
      )}
      {canScrollNext && (
        <ActionIcon
          type="button"
          variant="default"
          radius="xl"
          size={theme.other.touchTarget}
          className={cn(styles.control, styles.controlNext)}
          onClick={() => scrollByPage(1)}
          aria-label={t('aria_scroll_next')}
        >
          <ChevronRight size={theme.other.iconSize.standard} />
        </ActionIcon>
      )}
    </>
  )
}

/**
 * Canonical listing-card track (Task 806, D74-1/D74-2/D74-3/D74-5/D74-6/D74-7/D74-8/D74-9) — the
 * single place that decides how wide a listing card is and, for a rail, how it scrolls, across
 * every surface on the site. Presentational: no data access.
 *
 * `'use client'` (Task 810) — a module directive, so it applies to the WHOLE module, `grid` mode
 * included, not only `rail` mode (Revision 1 correction, R17.2: an earlier draft of this comment,
 * `docs/component-catalog.md`, and the session log all said "`rail` mode is a client component",
 * which understates the boundary — `/[locale]/listings`'s `grid` consumer now ships this module's
 * JS too). Only `rail` mode actually OWNS scroll-position state and DOM listeners; splitting
 * `RailControls` into its own `'use client'` module so `grid` mode could stay server-only was
 * considered and not taken (correcting the three sentences was the smaller, sufficient fix). Every
 * Server Component consumer (all five current call sites) is unaffected either way — client
 * boundaries compose transparently in the App Router.
 */
export function MantineListingCardTrack({
  mode,
  children,
  className,
  'data-testid': dataTestId,
}: MantineListingCardTrackProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const childCount = Children.count(children)

  if (mode === 'grid') {
    return (
      <Box className={cn(styles.grid, className)} data-testid={dataTestId}>
        {children}
      </Box>
    )
  }

  return (
    <Box className={cn(styles.wrapper, className)}>
      <Box className={styles.rail} ref={scrollerRef} data-testid={dataTestId}>
        {children}
      </Box>
      {childCount > 0 && <RailControls scrollerRef={scrollerRef} childCount={childCount} />}
    </Box>
  )
}
