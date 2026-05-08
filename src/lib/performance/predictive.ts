'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { preload } from 'react-dom'
import type { ImageVariant } from '@/components/ui/appImageConfig'
import { type PerformanceTier } from './tier'
import { usePerformanceTier } from './store'
import {
  canPredictivePreload,
  notifyPredictivePreload,
  notifyGuardBlock,
  updateImageSystemState,
} from './imageGuard'

// ── Predictive preload budget ─────────────────────────────────────────────────
// Separate from the priority budget (MAX_PRIORITY_IMAGES).
// Priority images are deterministic (LCP-candidates, above-fold).
// Predictive images are speculative (intent-based, below-fold).

export const MAX_PREDICTIVE_PRELOADS = 2

let predictiveCount = 0
const predictiveCountListeners = new Set<() => void>()

function notifyPredictiveCount(): void {
  for (const cb of predictiveCountListeners) cb()
}

export function subscribePredictiveCount(cb: () => void): () => void {
  predictiveCountListeners.add(cb)
  return () => predictiveCountListeners.delete(cb)
}

export function getPredictiveCount(): number { return predictiveCount }

// Stable named function — never inline. React 19 useSyncExternalStore calls
// getServerSnapshot during SSR and hydration. An inline arrow () => 0 is safe for
// primitives today, but the named-function invariant must be consistent across all
// useSyncExternalStore call sites to prevent future inline-object mistakes.
// See imageGuard.ts:getGuardServerSnapshot for the full rationale.
function getPredictiveServerSnapshot(): number { return 0 }

export function usePredictiveImageCount(): number {
  return useSyncExternalStore(subscribePredictiveCount, getPredictiveCount, getPredictiveServerSnapshot)
}

// Reset per page-navigation — called from PerformanceStoreInit when pathname changes
export function resetPredictiveBudget(): void {
  if (predictiveCount === 0) return
  predictiveCount = 0
  notifyPredictiveCount()
  updateImageSystemState({ predictiveCount: 0 })
}

// ── Scroll velocity tracking ──────────────────────────────────────────────────

const FAST_SCROLL_THRESHOLD = 1500  // px/s

let lastScrollY = 0
let lastScrollTime = 0
let scrollVelocity = 0
let scrollTrackerReady = false

function updateScrollVelocity(): void {
  const now = performance.now()
  const dt = now - lastScrollTime
  if (dt > 0) {
    scrollVelocity = Math.abs(window.scrollY - lastScrollY) / (dt / 1000)
    // scrollVelocity is read directly in attemptPredictivePreload (Gate 3).
    // No cross-module write needed — imageGuard never uses velocity for pressure.
  }
  lastScrollY = window.scrollY
  lastScrollTime = now
}

export function ensureScrollTracker(): void {
  if (scrollTrackerReady || typeof window === 'undefined') return
  scrollTrackerReady = true
  lastScrollY = window.scrollY
  lastScrollTime = performance.now()
  window.addEventListener('scroll', updateScrollVelocity, { passive: true })
}

// Reset scroll tracker state on SPA navigation to prevent stale velocity readings.
// lastScrollY/lastScrollTime survive navigation because scrollTrackerReady prevents
// re-registration of the scroll listener (intentional singleton). Without this reset,
// the first scroll event on the new page computes velocity from the old page's scroll
// position — potentially triggering the FAST_SCROLL_THRESHOLD gate incorrectly.
// scrollTrackerReady is intentionally NOT reset — the listener must persist page-to-page.
export function resetScrollTracker(): void {
  if (!scrollTrackerReady || typeof window === 'undefined') return
  lastScrollY = window.scrollY
  lastScrollTime = performance.now()
  scrollVelocity = 0
}

// ── Tier-aware intersection margins ──────────────────────────────────────────

const INTERSECTION_MARGIN: Record<'medium' | 'high', string> = {
  medium: '0px 0px 300px 0px',
  high:   '0px 0px 500px 0px',
}

// ── Trigger types ────────────────────────────────────────────────────────────

export type PredictiveTrigger = 'hover' | 'viewport' | 'scroll'

export interface PredictivePreloadPayload {
  name: 'predictive-preload'
  variant: ImageVariant
  trigger: PredictiveTrigger
  success: boolean
}

const isDebug = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_PERF_DEBUG === 'true'

// ── Core preload function ─────────────────────────────────────────────────────

export function attemptPredictivePreload(
  optimizedSrc: string,
  srcset: string,
  sizes: string,
  variant: ImageVariant,
  tier: PerformanceTier,
  trigger: PredictiveTrigger,
): boolean {
  // Gate 1: tier rules (LOW disabled; MEDIUM: hover only)
  if (!optimizedSrc || tier === 'low') return false
  if (trigger !== 'hover' && tier === 'medium') return false

  // Gate 2: global predictive budget
  if (predictiveCount >= MAX_PREDICTIVE_PRELOADS) {
    dispatchPredictiveEvent({ name: 'predictive-preload', variant, trigger, success: false })
    return false
  }

  // Gate 3: scroll velocity — skip non-hover triggers during fast scroll
  if (trigger !== 'hover' && scrollVelocity > FAST_SCROLL_THRESHOLD) return false

  // Gate 4: image guard — URL dedup, rate limit, contention, near-limit hover degradation
  const decision = canPredictivePreload(optimizedSrc, trigger, predictiveCount, MAX_PREDICTIVE_PRELOADS)
  if (decision !== 'allow') {
    notifyGuardBlock(decision, trigger, optimizedSrc)
    return false
  }

  // All gates passed — fire preload
  predictiveCount++
  notifyPredictiveCount()
  updateImageSystemState({ predictiveCount })

  preload(optimizedSrc, {
    as: 'image',
    imageSrcSet: srcset || undefined,
    imageSizes: srcset ? sizes : undefined,
  })

  notifyPredictivePreload(optimizedSrc)
  dispatchPredictiveEvent({ name: 'predictive-preload', variant, trigger, success: true })

  if (isDebug) {
    console.log(
      `%c[PRED] ${trigger} → preloaded`,
      'color:#818cf8;font-weight:bold',
      `variant=${variant} | budget ${predictiveCount}/${MAX_PREDICTIVE_PRELOADS}`,
    )
  }

  return true
}

function dispatchPredictiveEvent(payload: PredictivePreloadPayload): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('shtepi:vitals', { detail: payload }))
}

// ── usePredictivePreload hook ─────────────────────────────────────────────────

const HOVER_DEBOUNCE_MS = 60

export function usePredictivePreload(
  containerRef: React.RefObject<HTMLDivElement | null>,
  optimizedSrc: string,
  srcset: string,
  effectiveSizes: string,
  variant: ImageVariant,
  predictive: boolean,
): void {
  const tier = usePerformanceTier()
  const preloadedRef = useRef(false)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    preloadedRef.current = false

    const el = containerRef.current
    if (!el || !predictive || tier === 'low' || !optimizedSrc) return

    ensureScrollTracker()

    function fire(trigger: PredictiveTrigger) {
      if (preloadedRef.current) return
      const fired = attemptPredictivePreload(optimizedSrc, srcset, effectiveSizes, variant, tier, trigger)
      if (fired) preloadedRef.current = true
    }

    function onMouseEnter() {
      hoverTimerRef.current = setTimeout(() => fire('hover'), HOVER_DEBOUNCE_MS)
    }
    function onMouseLeave() {
      if (hoverTimerRef.current !== null) {
        clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }
    }

    el.addEventListener('mouseenter', onMouseEnter, { passive: true })
    el.addEventListener('mouseleave', onMouseLeave, { passive: true })

    const margin = tier === 'high' ? INTERSECTION_MARGIN.high : INTERSECTION_MARGIN.medium
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            fire(tier === 'high' ? 'scroll' : 'viewport')
            observer.disconnect()
          }
        }
      },
      { rootMargin: margin, threshold: 0 },
    )
    observer.observe(el)

    return () => {
      el.removeEventListener('mouseenter', onMouseEnter)
      el.removeEventListener('mouseleave', onMouseLeave)
      if (hoverTimerRef.current !== null) clearTimeout(hoverTimerRef.current)
      observer.disconnect()
    }
  }, [containerRef, predictive, tier, optimizedSrc, srcset, effectiveSizes, variant])
}
