import { type MetricName, type MetricRating, classifyMetric } from './budgets'

export interface WebVitalMetric {
  name: MetricName
  value: number
  rating: MetricRating
  id: string
  navigationType: string
  route: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
  viewportWidth: number
  viewportHeight: number
  lcpIsImage: boolean
  /**
   * True if the page became hidden at any point between navigation start and
   * LCP finalization. Informational — allows analytics sinks to filter
   * measurements made on backgrounded tabs. The reporter uses this together
   * with other signals; it is NOT a standalone drop gate (valid LCP can still
   * be reported after a user tabs out).
   */
  wasHiddenDuringCollection: boolean
  /** Runtime environment. Allows analytics sinks to filter dev build noise. */
  env: 'development' | 'production'
}

function getNavigationType(): string {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  return nav?.type ?? 'unknown'
}

function getDeviceType(width: number): 'mobile' | 'tablet' | 'desktop' {
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

function makeId(name: MetricName): string {
  return `${name.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function makeMetric(
  name: MetricName,
  value: number,
  route: string,
  lcpIsImage = false,
  wasHiddenDuringCollection = false,
): WebVitalMetric {
  return {
    name,
    value,
    rating: classifyMetric(name, value),
    id: makeId(name),
    navigationType: getNavigationType(),
    route,
    deviceType: getDeviceType(window.innerWidth),
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    lcpIsImage,
    wasHiddenDuringCollection,
    env: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  }
}

export function startWebVitalsCollection(
  route: string,
  onMetric: (metric: WebVitalMetric) => void,
): () => void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return () => {}
  }

  // Track whether the page was hidden at any point during this collection window.
  // Initialized from current state so backgrounded-on-load is captured immediately.
  let pageHiddenAtAnyPoint = document.visibilityState === 'hidden'
  const hiddenTracker = () => {
    if (document.visibilityState === 'hidden') pageHiddenAtAnyPoint = true
  }
  document.addEventListener('visibilitychange', hiddenTracker)

  // ── LCP ──────────────────────────────────────────────────────────────────
  let lcpValue = 0
  let lcpIsImage = false
  let lcpReported = false
  let lcpObserver: PerformanceObserver | null = null

  try {
    lcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as LargestContentfulPaint
        // renderTime is 0 for cross-origin images without Timing-Allow-Origin
        lcpValue = e.renderTime || e.loadTime
        const tag = (e.element as HTMLElement | null)?.tagName?.toUpperCase()
        lcpIsImage = !!(e.url || tag === 'IMG' || tag === 'IMAGE' || tag === 'PICTURE')
      }
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {
    // Browser does not support LCP
  }

  function reportLCP() {
    if (lcpReported || lcpValue === 0) return
    lcpReported = true
    onMetric(makeMetric('LCP', lcpValue, route, lcpIsImage, pageHiddenAtAnyPoint))
  }

  // LCP finalizes on first user interaction or page hide.
  // After finalization the observer is disconnected to prevent subsequent SPA
  // navigation content from updating lcpValue and producing impossibly large
  // values (e.g. 406 840 ms) attributed to the original page route.
  const lcpEvents = ['keydown', 'click', 'pointerdown'] as const
  function finalizeLCP() {
    // Flush any pending entries not yet delivered to the callback.
    // takeRecords() empties the queue; process the returned entries so lcpValue
    // reflects the most up-to-date candidate before we disconnect.
    for (const entry of lcpObserver?.takeRecords() ?? []) {
      const e = entry as LargestContentfulPaint
      lcpValue = e.renderTime || e.loadTime
      const tag = (e.element as HTMLElement | null)?.tagName?.toUpperCase()
      lcpIsImage = !!(e.url || tag === 'IMG' || tag === 'IMAGE' || tag === 'PICTURE')
    }
    // Disconnect stops the observer from accumulating entries from subsequent
    // SPA pages rendered into the same document after this interaction.
    lcpObserver?.disconnect()
    lcpObserver = null
    reportLCP()
    lcpEvents.forEach((e) => document.removeEventListener(e, finalizeLCP))
  }
  lcpEvents.forEach((e) => document.addEventListener(e, finalizeLCP, { once: true, passive: true }))

  // ── CLS ──────────────────────────────────────────────────────────────────
  let clsValue = 0
  let clsReported = false
  let clsObserver: PerformanceObserver | null = null

  try {
    clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // LayoutShift is not in TypeScript's standard lib.dom.d.ts for all versions
        const e = entry as PerformanceEntry & { hadRecentInput: boolean; value: number }
        if (!e.hadRecentInput) {
          clsValue += e.value
        }
      }
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })
  } catch {
    // Browser does not support CLS
  }

  function reportCLS() {
    if (clsReported) return
    clsReported = true
    onMetric(makeMetric('CLS', clsValue, route, false, pageHiddenAtAnyPoint))
  }

  // ── INP ──────────────────────────────────────────────────────────────────
  // Track per-interaction max duration, then take 98th percentile
  const interactionLatencies = new Map<number, number>()
  let inpReported = false
  let inpObserver: PerformanceObserver | null = null

  try {
    inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // interactionId was added to PerformanceEventTiming in Chrome 96+ (not in all TS lib versions)
        const e = entry as PerformanceEventTiming & { interactionId?: number }
        if (e.interactionId && e.duration >= 40) {
          const prev = interactionLatencies.get(e.interactionId) ?? 0
          interactionLatencies.set(e.interactionId, Math.max(prev, e.duration))
        }
      }
    })
    // durationThreshold is a Chrome extension to PerformanceObserverInit (not in TS types)
    inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 40 } as PerformanceObserverInit)
  } catch {
    // Browser does not support INP event observer
  }

  function computeINP(): number {
    const values = [...interactionLatencies.values()].sort((a, b) => a - b)
    if (values.length === 0) return 0
    const idx = Math.max(0, Math.ceil(values.length * 0.98) - 1)
    return values[idx]
  }

  function reportINP() {
    if (inpReported) return
    inpReported = true
    const value = computeINP()
    if (value > 0) onMetric(makeMetric('INP', value, route, false, pageHiddenAtAnyPoint))
  }

  // ── Page-hide handler (reports all accumulated metrics) ──────────────────
  // Process takeRecords() return values explicitly: the browser queues entries
  // asynchronously and takeRecords() removes them from the internal queue
  // without triggering the callback. Discarding the return value (the previous
  // bug) caused the final pending entry to be silently dropped.
  function handlePageHide() {
    // Flush and process any pending LCP entries before disconnecting
    for (const entry of lcpObserver?.takeRecords() ?? []) {
      const e = entry as LargestContentfulPaint
      lcpValue = e.renderTime || e.loadTime
      const tag = (e.element as HTMLElement | null)?.tagName?.toUpperCase()
      lcpIsImage = !!(e.url || tag === 'IMG' || tag === 'IMAGE' || tag === 'PICTURE')
    }

    // Flush pending CLS entries
    for (const entry of clsObserver?.takeRecords() ?? []) {
      const e = entry as PerformanceEntry & { hadRecentInput: boolean; value: number }
      if (!e.hadRecentInput) clsValue += e.value
    }

    // Flush pending INP entries
    for (const entry of inpObserver?.takeRecords() ?? []) {
      const e = entry as PerformanceEventTiming & { interactionId?: number }
      if (e.interactionId && e.duration >= 40) {
        const prev = interactionLatencies.get(e.interactionId) ?? 0
        interactionLatencies.set(e.interactionId, Math.max(prev, e.duration))
      }
    }

    reportLCP()
    reportCLS()
    reportINP()
  }

  const visibilityHandler = () => {
    if (document.visibilityState === 'hidden') handlePageHide()
  }
  document.addEventListener('visibilitychange', visibilityHandler)
  // pagehide is more reliable than visibilitychange on iOS Safari
  window.addEventListener('pagehide', handlePageHide, { capture: true, passive: true })

  return () => {
    lcpObserver?.disconnect()
    clsObserver?.disconnect()
    inpObserver?.disconnect()
    lcpEvents.forEach((e) => document.removeEventListener(e, finalizeLCP))
    document.removeEventListener('visibilitychange', visibilityHandler)
    document.removeEventListener('visibilitychange', hiddenTracker)
    window.removeEventListener('pagehide', handlePageHide, { capture: true })
  }
}
