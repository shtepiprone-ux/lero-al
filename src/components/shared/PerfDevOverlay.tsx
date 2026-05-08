'use client'

import { usePerformanceState } from '@/lib/performance/store'
import { usePriorityImageCount } from '@/components/ui/useAdaptiveImageConfig'
import { usePredictiveImageCount, MAX_PREDICTIVE_PRELOADS } from '@/lib/performance/predictive'
import { useGuardStats } from '@/lib/performance/imageGuard'
import { MAX_PRIORITY_IMAGES } from '@/lib/imageDelivery'
import { cn } from '@/lib/utils'

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
    'text-overlay-foreground/70'

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
      <div className="bg-overlay/85 text-overlay-foreground rounded-lg px-3 py-2 font-mono text-[10px] leading-relaxed space-y-0.5 shadow-lg">
        {/* Tier: color-coded + lock status + source */}
        <div className={cn('font-bold flex items-center gap-1', tierClass)}>
          <span>⚡ {tier.toUpperCase()}</span>
          <span className="text-overlay-foreground/50">
            {isLocked ? '🔒' : '◌'} {sourceLabel}
          </span>
        </div>

        {/* Web Vitals */}
        <div className="text-overlay-foreground/70">
          LCP {lcp !== null ? `${Math.round(lcp)}ms` : '—'}
        </div>
        <div className="text-overlay-foreground/70">
          INP {inp !== null ? `${Math.round(inp)}ms` : '—'}
        </div>

        {/* Divider */}
        <div className="border-t border-overlay-foreground/20 my-0.5" />

        {/* Image pressure — only shown when NORMAL/HIGH. LOW is default browsing state. */}
        {pressure !== 'low' && (
          <div className={cn(pressureClass)}>
            IMG {pressure.toUpperCase()}
          </div>
        )}

        {/* Priority budget */}
        <div className={cn('text-overlay-foreground/70', priorityOver && 'text-destructive font-bold')}>
          pri {priorityCount}/{MAX_PRIORITY_IMAGES}{priorityOver ? ' ⚠' : ''}
        </div>

        {/* Predictive budget */}
        <div className={cn('text-overlay-foreground/70', predictiveOver && 'text-destructive font-bold')}>
          pred {predictiveCount}/{MAX_PREDICTIVE_PRELOADS}{predictiveOver ? ' ⚠' : ''}
          {tier === 'low' && <span className="text-overlay-foreground/40"> off</span>}
        </div>

        {/* Guard stats — only show when non-zero */}
        {(conflicts > 0 || suppressed > 0) && (
          <div className="text-overlay-foreground/60">
            {conflicts > 0 && `dup×${conflicts}`}
            {conflicts > 0 && suppressed > 0 && ' '}
            {suppressed > 0 && `sup×${suppressed}`}
          </div>
        )}
      </div>
    </div>
  )
}
