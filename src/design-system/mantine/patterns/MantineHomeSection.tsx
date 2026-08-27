import type { ReactNode } from 'react'
import { Box } from '@mantine/core'
import { cn } from '@/lib/utils'
import styles from './MantineHomeSection.module.css'

export type MantineHomeSectionVariant = 'default' | 'muted' | 'brandFade'

export interface MantineHomeSectionProps {
  /** Background token variant. `'default'` (no variant) renders no background — transparent. */
  variant?: MantineHomeSectionVariant
  /** `contain-intrinsic-size` perf hint (e.g. `'auto 600px'`) — a runtime perf hint, not a visual token. */
  containIntrinsicSize?: string
  /** Renders the inner `.container-wide` content column. Default `true`. */
  withContainer?: boolean
  children: ReactNode
  className?: string
}

const VARIANT_CLASS: Record<MantineHomeSectionVariant, string | undefined> = {
  default: undefined,
  muted: styles.muted,
  brandFade: styles.brandFade,
}

/**
 * Canonical homepage content-band section (Task 662; rhythm rebound to Mantine `xxl` in Task 669
 * per owner decision 2026-07-28) — owns vertical rhythm (48/64/80px via a Mantine responsive `py`
 * prop bound to `base`/`md`/`xxl`) and background variant via design tokens. Reuses
 * `.container-wide` (globals.css) for the inner content column rather than reimplementing its
 * 1408px/responsive-padding logic. Presentational only — no data fetching.
 */
export function MantineHomeSection({
  variant = 'default',
  containIntrinsicSize,
  withContainer = true,
  children,
  className,
}: MantineHomeSectionProps) {
  return (
    <Box
      component="section"
      className={cn(styles.band, VARIANT_CLASS[variant], className)}
      // Task 770 — base/md/xxl were @theme inline --home-section-py-base/md/lg
      py={{
        base: 'var(--homepage-runtime-section-py-base)',
        md: 'var(--homepage-runtime-section-py-md)',
        xxl: 'var(--homepage-runtime-section-py-lg)',
      }}
      style={containIntrinsicSize ? { containIntrinsicSize } : undefined}
    >
      {withContainer ? <Box className="container-wide">{children}</Box> : children}
    </Box>
  )
}
