'use client'

import { usePerformanceState } from '@/lib/performance/store'
import { usePriorityImageCount } from '@/components/ui/useAdaptiveImageConfig'
import { usePredictiveImageCount, MAX_PREDICTIVE_PRELOADS } from '@/lib/performance/predictive'
import { useGuardStats } from '@/lib/performance/imageGuard'
import { MAX_PRIORITY_IMAGES } from '@/lib/imageDelivery'
import { cn } from '@/lib/utils'
import styles from './PerfDevOverlay.module.css'

// Dev-only performance overlay — stripped from production bundles via static
// process.env.NODE_ENV check (build-time constant, not a runtime branch).
// Bottom-right corner fixed badge. pointer-events: none — zero layout impact.
export function PerfDevOverlay() {
  if (process.env.NODE_ENV !== 'development') return null
  return <PerfOverlayContent />
}

function PerfOverlayContent() {
  const { tier, lcp, inp, isLocked, tierSource } = usePerformanceState()
  const priorityCount = usePriorityImageCount()
  const predictiveCount = usePredictiveImageCount()
  const { pressure, conflicts, suppressed } = useGuardStats()

  const tierClass =
    tier === 'low' ? 'text-destructive' :
    tier === 'high' ? 'text-[var(--color-status-success)]' :
    'text-[var(--color-status-warning)]'

  const pressureClass =
    pressure === 'high' ? 'text-destructive font-bold' :
    pressure === 'normal' ? 'text-[var(--color-status-warning)]' :
    styles.metricRow

  const priorityOver = priorityCount > MAX_PRIORITY_IMAGES
  const predictiveOver = predictiveCount > MAX_PREDICTIVE_PRELOADS
  const sourceLabel =
    tierSource === 'inp' ? 'INP' :
    tierSource === 'session' ? 'session' :
    'hw'

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] pointer-events-none select-none"
      role="presentation"
      aria-hidden="true"
    >
      <div className={cn(styles.badge, 'rounded-lg px-3 py-2 font-mono text-[10px] leading-relaxed space-y-0.5 shadow-lg')}>
        {/* Tier: color-coded + lock status + source */}
        <div className={cn('font-bold flex items-center gap-1', tierClass)}>
          <span>⚡ {tier.toUpperCase()}</span>
          <span className={styles.sourceLabel}>
            {isLocked ? '🔒' : '◌'} {sourceLabel}
          </span>
        </div>

        {/* Web Vitals */}
        <div className={styles.metricRow}>
          LCP {lcp !== null ? `${Math.round(lcp)}ms` : '—'}
        </div>
        <div className={styles.metricRow}>
          INP {inp !== null ? `${Math.round(inp)}ms` : '—'}
        </div>

        {/* Divider */}
        <div className={cn(styles.divider, 'border-t my-0.5')} />

        {/* Image pressure — only shown when NORMAL/HIGH. LOW is default browsing state. */}
        {pressure !== 'low' && (
          <div className={cn(pressureClass)}>
            IMG {pressure.toUpperCase()}
          </div>
        )}

        {/* Priority budget — RR1 (748 REWORK): the pre-migration Tailwind opacity-modifier
            overlay-foreground utility (70% alpha), combined via `cn(...)` with
            `priorityOver && 'text-destructive font-bold'`, had tailwind-merge DELETE that
            overlay class whenever priorityOver is true (same `text-*` conflict group), so the
            row rendered `--destructive`. A CSS-module class does not participate in
            tailwind-merge conflict resolution and is emitted unlayered (always beats `@layer
            utilities`), so keeping both classes present would silently keep the overlay colour
            and lose the warning signal. Conditionally omit the module class instead,
            reproducing the exact pre-migration deletion. (Task 695: the historical utility
            name above is deliberately not spelled out as a literal className — this file is
            Tailwind-scanned, and writing it verbatim previously kept two dead overlay rules
            alive in the shipped bundle with zero real consumer, the D35 fallback-generation
            hazard.) */}
        <div className={cn(!priorityOver && styles.metricRow, priorityOver && 'text-destructive font-bold')}>
          pri {priorityCount}/{MAX_PRIORITY_IMAGES}{priorityOver ? ' ⚠' : ''}
        </div>

        {/* Predictive budget — RR1, same reasoning as the priority row above. */}
        <div className={cn(!predictiveOver && styles.metricRow, predictiveOver && 'text-destructive font-bold')}>
          pred {predictiveCount}/{MAX_PREDICTIVE_PRELOADS}{predictiveOver ? ' ⚠' : ''}
          {tier === 'low' && <span className={styles.offLabel}> off</span>}
        </div>

        {/* Guard stats — only show when non-zero */}
        {(conflicts > 0 || suppressed > 0) && (
          <div className={styles.guardStats}>
            {conflicts > 0 && `dup×${conflicts}`}
            {conflicts > 0 && suppressed > 0 && ' '}
            {suppressed > 0 && `sup×${suppressed}`}
          </div>
        )}
      </div>
    </div>
  )
}
