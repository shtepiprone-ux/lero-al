'use client'

// ── Image Performance Guard ───────────────────────────────────────────────────
// Central authority for image system safety. Enforces rules across the full
// preload pipeline (priority + predictive). Guards against:
//   - duplicate URL preloads (same network request twice)
//   - combined contention (priority + predictive requests > threshold)
//   - rapid burst preloads (rate limiting)
//   - near-budget hover speculation (degrade to viewport-only near limit)
//
// Safety hierarchy — IMMUTABLE (guard ONLY downgrades levels 3 & 4):
//   1. LCP path            → never blocked
//   2. Priority preloads   → bypass guard checks; recorded for pressure state only
//   3. Predictive preloads → fully guarded
//   4. Lazy loading        → default fallback when all else is blocked
//
// Dependency direction (no cycles):
//   predictive.ts → imageGuard.ts ✓
//   useAdaptiveImageConfig.ts → imageGuard.ts ✓
//   imageGuard.ts → (nothing from predictive or useAdaptiveImageConfig) ✓

import { useSyncExternalStore } from 'react'
import type { PredictiveTrigger } from './predictive'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ImagePressure = 'low' | 'normal' | 'high'

export type GuardBlockReason =
  | 'duplicate-url'  // same URL already preloaded this page
  | 'rate-limit'     // > MAX_PRELOAD_RATE fires in the last 1 s
  | 'contention'     // combined priority + predictive count too high
  | 'near-limit'     // budget near limit; hover demoted to viewport-only

export interface GuardStats {
  pressure: ImagePressure
  conflicts: number   // duplicate-URL blocks this page
  suppressed: number  // contention/rate/near-limit blocks this page
}

// ── Constants ─────────────────────────────────────────────────────────────────

// Guard gate thresholds — control when preloads are BLOCKED (unchanged)
const CONTENTION_THRESHOLD = 3   // combined priority + predictive above this → block
const MAX_PRELOAD_RATE = 4       // max preloads per rolling 1-second window before blocking
const RATE_WINDOW_MS = 1000

// Pressure display thresholds — separate from guard gates.
// Describe system state (observable signal), NOT blocking decisions.
// With MAX_PRIORITY=3 and MAX_PREDICTIVE=2, the normal maximum combined is 5.
// HIGH requires budget to be genuinely exceeded — not just heavily used.
// LOW = default browsing; NORMAL = all slots filling up; HIGH = overload.
const PRESSURE_HIGH_COMBINED = 6   // combined exceeds both full budgets
const PRESSURE_HIGH_RATE = 6       // 6+ preloads/second — extreme burst
const PRESSURE_NORMAL_COMBINED = 4 // most budget slots in use
const PRESSURE_NORMAL_RATE = 3     // 3+ preloads/second — active loading

// ── Module-level state ────────────────────────────────────────────────────────

const preloadedUrls = new Set<string>()
const recentPreloadTimes: number[] = []

// Last-known counts pushed by external callers (updateImageSystemState)
let sysPredictive = 0
let sysPriority = 0

// Stable server snapshot constant — see note in store.ts. Must not be an inline
// object literal inside useGuardStats or React will loop on reference inequality.
const GUARD_SERVER_SNAPSHOT: GuardStats = { pressure: 'low', conflicts: 0, suppressed: 0 }

let guardStats: GuardStats = { pressure: 'low', conflicts: 0, suppressed: 0 }
let lastPressure: ImagePressure = 'low'
const statsListeners = new Set<() => void>()

const isDebug = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_PERF_DEBUG === 'true'

// ── Reactive store ────────────────────────────────────────────────────────────

function commit(next: GuardStats): void {
  // Skip if nothing actually changed — prevents redundant subscriber notifications
  // (e.g. recompute() called during scroll when pressure stays 'low').
  if (
    next.pressure === guardStats.pressure &&
    next.conflicts === guardStats.conflicts &&
    next.suppressed === guardStats.suppressed
  ) return

  guardStats = next

  // Emit observability event on pressure transitions
  if (next.pressure !== lastPressure) {
    lastPressure = next.pressure
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lero:vitals', {
        detail: { name: 'pressure-state-change', pressure: next.pressure },
      }))
    }
    if (isDebug && next.pressure === 'high') {
      console.warn(
        '%c[IMG GUARD] High pressure',
        'color:#f97316;font-weight:bold',
        `combined=${sysPredictive + sysPriority} rate=${getRecentCount()}/s`,
      )
    }
  }

  for (const cb of statsListeners) cb()
}

export function subscribeGuardStats(cb: () => void): () => void {
  statsListeners.add(cb)
  return () => statsListeners.delete(cb)
}

export function getGuardStats(): GuardStats { return guardStats }

// Stable named function — never inline. React 19 useSyncExternalStore calls
// getServerSnapshot during SSR and hydration. An inline arrow () => GUARD_SERVER_SNAPSHOT
// is safe TODAY (returns stable reference), but if anyone changes it to an inline
// object literal the result is a new reference each call → infinite re-render loop.
// Named function forces the pattern to stay explicit and auditable.
function getGuardServerSnapshot(): GuardStats { return GUARD_SERVER_SNAPSHOT }

export function useGuardStats(): GuardStats {
  return useSyncExternalStore(subscribeGuardStats, getGuardStats, getGuardServerSnapshot)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRecentCount(): number {
  const cutoff = Date.now() - RATE_WINDOW_MS
  while (recentPreloadTimes.length > 0 && recentPreloadTimes[0] < cutoff) {
    recentPreloadTimes.shift()
  }
  return recentPreloadTimes.length
}

function derivePressure(): ImagePressure {
  const combined = sysPredictive + sysPriority
  const rate = getRecentCount()
  // Scroll velocity is a preload gate in predictive.ts — not a pressure signal here.
  // Pressure reflects active preload counts and rate, not instantaneous scroll speed.
  if (combined >= PRESSURE_HIGH_COMBINED || rate >= PRESSURE_HIGH_RATE) return 'high'
  if (combined >= PRESSURE_NORMAL_COMBINED || rate >= PRESSURE_NORMAL_RATE) return 'normal'
  return 'low'
}

function recompute(patch?: Partial<Pick<GuardStats, 'conflicts' | 'suppressed'>>): void {
  commit({
    pressure: derivePressure(),
    conflicts: patch?.conflicts ?? guardStats.conflicts,
    suppressed: patch?.suppressed ?? guardStats.suppressed,
  })
}

// ── External state updates ────────────────────────────────────────────────────
// Callers PUSH their state here; guard never PULLS (avoids circular imports).

// Only pressure-relevant signals are accepted: predictiveCount and priorityCount.
// scrollVelocity was removed — it is a gate in predictive.ts (read locally there)
// and was never part of pressure computation. Keeping it here only caused a
// cross-module write on every scroll event with zero functional benefit.
export function updateImageSystemState(patch: {
  predictiveCount?: number
  priorityCount?: number
}): void {
  let changed = false
  if (patch.predictiveCount !== undefined && patch.predictiveCount !== sysPredictive) {
    sysPredictive = patch.predictiveCount; changed = true
  }
  if (patch.priorityCount !== undefined && patch.priorityCount !== sysPriority) {
    sysPriority = patch.priorityCount; changed = true
  }
  if (changed) recompute()
}

// ── Guard check ───────────────────────────────────────────────────────────────

export function canPredictivePreload(
  optimizedSrc: string,
  trigger: PredictiveTrigger,
  predictiveCount: number,
  maxPredictive: number,
): 'allow' | GuardBlockReason {
  if (preloadedUrls.has(optimizedSrc)) return 'duplicate-url'
  if (getRecentCount() >= MAX_PRELOAD_RATE) return 'rate-limit'
  if (predictiveCount + sysPriority > CONTENTION_THRESHOLD) return 'contention'
  // Near-limit: last budget slot reserved for viewport/scroll (not speculative hover)
  if (trigger === 'hover' && predictiveCount >= maxPredictive - 1) return 'near-limit'
  return 'allow'
}

// ── Notifications ─────────────────────────────────────────────────────────────

export function notifyPredictivePreload(optimizedSrc: string): void {
  preloadedUrls.add(optimizedSrc)
  recentPreloadTimes.push(Date.now())
  recompute()
}

// Register a priority preload URL so predictive doesn't duplicate it.
// Rate counter is skipped for already-registered URLs to be idempotent under
// React StrictMode (which invokes render twice in development).
export function notifyPriorityPreload(optimizedSrc: string): void {
  if (!preloadedUrls.has(optimizedSrc)) {
    recentPreloadTimes.push(Date.now())
  }
  preloadedUrls.add(optimizedSrc)
  recompute()
}

export function notifyGuardBlock(
  reason: GuardBlockReason,
  trigger: PredictiveTrigger,
  optimizedSrc: string,
): void {
  const isDuplicate = reason === 'duplicate-url'
  commit({
    pressure: derivePressure(),
    conflicts: isDuplicate ? guardStats.conflicts + 1 : guardStats.conflicts,
    suppressed: !isDuplicate ? guardStats.suppressed + 1 : guardStats.suppressed,
  })

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lero:vitals', {
      detail: {
        name: isDuplicate ? 'preload-suppressed' : 'image-guard-trigger',
        reason,
        trigger,
        src: optimizedSrc,
      },
    }))
  }

  // Guard block stats are surfaced via PerfDevOverlay (dup×N / sup×N counters).
  // Per-block console logs are intentionally omitted — too noisy during scrolling.
}

// ── Page navigation reset ─────────────────────────────────────────────────────

export function resetGuard(): void {
  preloadedUrls.clear()
  recentPreloadTimes.length = 0
  sysPredictive = 0
  sysPriority = 0
  lastPressure = 'low'
  commit({ pressure: 'low', conflicts: 0, suppressed: 0 })
}
