import { useState, useEffect } from 'react'

export type PerformanceTier = 'high' | 'medium' | 'low'

const SESSION_KEY = 'shtepi:perf-tier'

// ── Classification ────────────────────────────────────────────────────────────

export interface TierSignals {
  /** INP in ms — definitive signal when available; supersedes all heuristics. */
  inp?: number | null
  /** navigator.hardwareConcurrency — number of logical CPU cores. */
  cores?: number
  /** navigator.deviceMemory in GB (Chromium only, optional). */
  memory?: number
  /** window.innerWidth — used to detect constrained viewport scenarios. */
  viewport?: number
}

export function classifyTier({
  inp = null,
  cores = 4,
  memory = 4,
  viewport = 1024,
}: TierSignals): PerformanceTier {
  // INP is the definitive signal — actual measured interaction latency.
  // Supersedes all hardware heuristics when available.
  if (inp != null) {
    if (inp > 300) return 'low'
    if (inp < 120) return 'high'
    return 'medium'
  }

  // Hardware heuristic: low if any strong constraint signal
  if (cores <= 2 || memory <= 1) return 'low'

  // High requires strong signals on both axes
  if (cores >= 8 && memory >= 4) return 'high'

  // Mobile viewport + moderate CPU tends toward medium (not low — avoids false penalties)
  // Note: viewport alone is not reliable; combine with at least one hardware signal
  if (viewport < 480 && cores <= 4 && memory <= 2) return 'low'

  return 'medium'
}

// ── sessionStorage helpers ────────────────────────────────────────────────────

export type TierInitSource = 'hardware' | 'session'

export interface InitialTierResult {
  tier: PerformanceTier
  source: TierInitSource
}

export function readInitialTierWithSource(): InitialTierResult {
  if (typeof window === 'undefined') return { tier: 'medium', source: 'hardware' }
  try {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved === 'low' || saved === 'medium' || saved === 'high') {
      return { tier: saved, source: 'session' }
    }
  } catch {
    // sessionStorage unavailable (private browsing restrictions)
  }
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
  const tier = classifyTier({
    cores: navigator.hardwareConcurrency ?? 4,
    memory,
    viewport: window.innerWidth,
  })
  return { tier, source: 'hardware' }
}

export function readInitialTier(): PerformanceTier {
  return readInitialTierWithSource().tier
}

export function hasSavedTier(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(SESSION_KEY) !== null
  } catch {
    return false
  }
}

export function saveTier(tier: PerformanceTier): void {
  try {
    sessionStorage.setItem(SESSION_KEY, tier)
  } catch {
    // Ignore sessionStorage errors
  }
}

// ── useIdleMount ──────────────────────────────────────────────────────────────
// Defers a component's inner content to browser idle time on LOW devices.
// `forceNow` bypasses the defer (e.g., user opened the component interactively).
// Once ready, remains ready — never un-mounts after idle fires.

export function useIdleMount(defer: boolean, forceNow = false): boolean {
  const [ready, setReady] = useState(!defer)

  useEffect(() => {
    if (!defer || ready) return
    let id: number
    if (typeof requestIdleCallback !== 'undefined') {
      id = requestIdleCallback(() => setReady(true), { timeout: 800 }) as number
    } else {
      id = window.setTimeout(() => setReady(true), 200)
    }
    return () => {
      if (typeof cancelIdleCallback !== 'undefined') cancelIdleCallback(id)
      else clearTimeout(id)
    }
  }, [defer, ready])

  // When the user triggers the component (e.g., opens a panel), mount immediately
  useEffect(() => {
    if (forceNow) setReady(true)
  }, [forceNow])

  return ready
}
