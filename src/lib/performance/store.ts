'use client'

import { useSyncExternalStore } from 'react'
import { type MetricRating } from './budgets'
import { type WebVitalMetric } from './collector'
import {
  type PerformanceTier,
  type TierInitSource,
  classifyTier,
  readInitialTierWithSource,
  hasSavedTier,
  saveTier,
} from './tier'

export type TierSource = TierInitSource | 'inp'

export interface PerformanceState {
  lcp: number | null
  cls: number | null
  inp: number | null
  rating: MetricRating
  tier: PerformanceTier
  /** True after the first INP-based classification. Tier is frozen once locked. */
  isLocked: boolean
  /** How the current tier was determined: hardware heuristic, prior session, or live INP. */
  tierSource: TierSource
}

// ── Module-level store ────────────────────────────────────────────────────────
// Initialized synchronously at module-load time so the correct tier is available
// on the very first React render (before any useEffect fires).

const { tier: initialTier, source: initialSource } = readInitialTierWithSource()

let state: PerformanceState = {
  lcp: null,
  cls: null,
  inp: null,
  rating: 'good',
  tier: initialTier,
  // If sessionStorage has a saved tier, it came from a prior INP measurement — already locked
  isLocked: hasSavedTier(),
  tierSource: initialSource,
}

const listeners = new Set<() => void>()

function setStore(next: PerformanceState): void {
  state = next
  for (const cb of listeners) cb()
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot(): PerformanceState {
  return state
}

// Server snapshot: medium tier, unlocked — prevents hydration mismatch.
// MUST be a stable module-level constant. React 19 useSyncExternalStore calls
// getServerSnapshot during both SSR and hydration reconciliation and uses
// referential equality (Object.is) to detect changes. Returning a new object
// literal on every call would trigger an infinite re-render loop:
//   "The result of getServerSnapshot should be cached to avoid an infinite loop"
const SERVER_SNAPSHOT: PerformanceState = {
  lcp: null, cls: null, inp: null,
  rating: 'good', tier: 'medium',
  isLocked: false, tierSource: 'hardware',
}

function getServerSnapshot(): PerformanceState {
  return SERVER_SNAPSHOT
}

// ── Debug helpers ─────────────────────────────────────────────────────────────

const isDebug = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_PERF_DEBUG === 'true'

function tierColor(tier: PerformanceTier): string {
  return tier === 'low' ? '#ef4444' : tier === 'high' ? '#22c55e' : '#f59e0b'
}

function logTierLock(tier: PerformanceTier, inp: number): void {
  if (!isDebug) return
  console.log(
    `%c[PERF] Tier locked: ${tier}`,
    `color:${tierColor(tier)};font-weight:bold`,
    `(source: INP ${Math.round(inp)}ms)`,
  )
}

function logInitialTier(): void {
  if (!isDebug) return
  const { tier, tierSource } = state
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
  const cores = navigator.hardwareConcurrency ?? 4
  const source = tierSource === 'session'
    ? 'sessionStorage (prior INP measurement)'
    : `hardware — ${cores} cores, ${memory}GB memory, ${window.innerWidth}px viewport`
  console.log(
    `%c[PERF] Initial tier: ${tier}`,
    `color:${tierColor(tier)};font-weight:bold`,
    `(source: ${source})`,
  )
}

// ── Vitals event handler ──────────────────────────────────────────────────────

function handleVitalsEvent(event: Event): void {
  const payload = (event as CustomEvent<{ name?: string }>).detail
  // Allow-list: only process the 3 Core Web Vitals collected by collector.ts.
  // The collector dispatches LCP, CLS, and INP only — FCP and TTFB are not
  // collected or dispatched anywhere in this codebase and therefore cannot reach
  // this handler. The allow-list additionally guards against non-WebVitalMetric
  // payloads that share the lero:vitals channel (dropped-sample envelopes,
  // predictive-preload signals, image-guard events) to prevent spurious store
  // mutations and unnecessary re-renders.
  if (payload?.name !== 'LCP' && payload?.name !== 'CLS' && payload?.name !== 'INP') return
  const metric = payload as unknown as WebVitalMetric
  const key = metric.name.toLowerCase() as 'lcp' | 'cls' | 'inp'

  // Always update metric values and overall rating, even after tier is locked
  const prevRating = state.rating
  const rating: MetricRating =
    metric.rating === 'poor' || prevRating === 'poor' ? 'poor'
    : metric.rating === 'needs-improvement' || prevRating === 'needs-improvement'
      ? 'needs-improvement'
    : 'good'

  if (state.isLocked) {
    // Tier frozen — update metric values and rating only; tier/tierSource unchanged
    setStore({ ...state, [key]: metric.value, rating })
    return
  }

  if (metric.name === 'INP') {
    // First INP measurement — compute definitive tier and lock for the session
    const tier = classifyTier({
      inp: metric.value,
      cores: navigator.hardwareConcurrency ?? 4,
      memory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4,
      viewport: window.innerWidth,
    })
    saveTier(tier)
    document.documentElement.setAttribute('data-perf-tier', tier)
    logTierLock(tier, metric.value)
    setStore({ ...state, [key]: metric.value, rating, tier, isLocked: true, tierSource: 'inp' })
  } else {
    // LCP or CLS before first INP — update values only; tier stays as heuristic
    setStore({ ...state, [key]: metric.value, rating })
  }
}

// ── Init / cleanup ────────────────────────────────────────────────────────────

let vitalsHandler: ((e: Event) => void) | null = null

export function initPerformanceStore(): () => void {
  if (typeof window === 'undefined') return () => {}

  // Apply the already-computed initial tier to the DOM attribute
  document.documentElement.setAttribute('data-perf-tier', state.tier)

  // Log initial tier determination (runs once per page, after hydration)
  logInitialTier()

  // Guard against double-registration in React strict mode
  if (vitalsHandler) return () => {}
  vitalsHandler = handleVitalsEvent
  window.addEventListener('lero:vitals', vitalsHandler)

  return () => {
    if (vitalsHandler) {
      window.removeEventListener('lero:vitals', vitalsHandler)
      vitalsHandler = null
    }
  }
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function usePerformanceState(): PerformanceState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function usePerformanceTier(): PerformanceTier {
  return usePerformanceState().tier
}
