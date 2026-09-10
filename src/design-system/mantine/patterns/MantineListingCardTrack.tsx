import type { ReactNode } from 'react'
import { Box } from '@mantine/core'
import { cn } from '@/lib/utils'
import styles from './MantineListingCardTrack.module.css'

export interface MantineListingCardTrackProps {
  /**
   * `'grid'` — `repeat(auto-fill, minmax(var(--listing-card-min), 1fr))`, the column count is the
   * browser's arithmetic. `'rail'` — a horizontal-scroll flex row, each item `min(var(--listing-card-min), 82%)`.
   * No default — a caller that does not state its mode is a bug, not a convenience (kickoff §10.2).
   */
  mode: 'grid' | 'rail'
  /** In `grid` mode the children ARE the grid items; in `rail` mode they ARE the flex items — this
   * primitive does not wrap each child in an extra element. */
  children: ReactNode
  /** Merged onto the root so a consumer (Task 807) can attach a section wrapper without a second element. */
  className?: string
  'data-testid'?: string
}

const MODE_CLASS: Record<MantineListingCardTrackProps['mode'], string> = {
  grid: styles.grid,
  rail: styles.rail,
}

/**
 * Canonical listing-card track (Task 806, D74-1/D74-2/D74-3) — the single place that decides how
 * wide a listing card is, across every surface on the site. Both modes are driven solely by
 * `var(--listing-card-min)` (280px, `globals.css` `:root`) — zero media queries (D74-1). Presentational
 * only: no data access, no hooks. Task 806 creates this primitive and its canonical story; no
 * production surface consumes it yet (Task 807).
 */
export function MantineListingCardTrack({
  mode,
  children,
  className,
  'data-testid': dataTestId,
}: MantineListingCardTrackProps) {
  return (
    <Box className={cn(MODE_CLASS[mode], className)} data-testid={dataTestId}>
      {children}
    </Box>
  )
}
