import { type WebVitalMetric } from './collector'
import { PERFORMANCE_BUDGETS, type MetricName } from './budgets'

// ── Log-tag constants ─────────────────────────────────────────────────────────
// All reporter output uses exactly one of these two prefixes so log consumers
// (Sentry integrations, grep, browser filters) can reliably distinguish
// dev-tooling noise from actionable production regressions.
//
//   PERF_REPORT_TAG   — dropped samples, dev-only notices, internal diagnostics.
//   PERF_REGRESSION_TAG — production-equivalent poor metric on a valid sample.
//                         Every line with this tag is actionable.

const PERF_REPORT_TAG = '[perf-reporter]'
const PERF_REGRESSION_TAG = '[Perf Regression]'

// LCP entries with a value above this ceiling are physically impossible as
// real user-visible paints. They are artefacts of long-lived observers
// accumulating entries across SPA page transitions or browser freeze/thaw
// cycles. Drop unconditionally with a debug-level log.
const LCP_SANITY_CEILING_MS = 60_000

const isDev = process.env.NODE_ENV === 'development'
const isDebug = isDev || process.env.NEXT_PUBLIC_PERF_DEBUG === 'true'

// ── Locale-aware route normalisation ─────────────────────────────────────────
// Strip the locale prefix (e.g. '/uk', '/sq', '/en', '/it') from the route so
// that deduplication and regression key aggregation are not fragmented per
// locale. The LCP on '/uk/listings/slug' and '/sq/listings/slug' are the same
// page pattern and must share the same warning budget.
// Matches a 2–4 lower-case letter locale segment at the start of the path.
const LOCALE_SEGMENT_RE = /^\/[a-z]{2,4}(\/|$)/

function normalizeRoute(route: string): string {
  const stripped = route.replace(LOCALE_SEGMENT_RE, '/')
  // Collapse '//' → '/' if the locale segment was the entire path (e.g. '/uk' → '/')
  return stripped === '' ? '/' : stripped
}

// ── Dropped-sample envelope ───────────────────────────────────────────────────
// When a metric is gated and not classified, a typed envelope is dispatched via
// lero:vitals so analytics sinks can observe the drop rate without receiving
// a POOR classification. Consumers check `name.endsWith('-dropped')`.
export interface DroppedMetricEnvelope {
  name: string           // e.g. 'LCP-dropped'
  reason: 'sanity-ceiling' | 'bfcache' | 'dev-cold-start' | 'hidden-during-collection'
  originalValue: number
  route: string          // locale-normalised
  navigationType: string
  env: 'development' | 'production'
}

// ── Navigation identifier ────────────────────────────────────────────────────
// Unique per hard navigation (module is re-evaluated on every full page load).
// Included in the dedup key so that a second real regression on the same route
// in the same browser session is not silently swallowed — each hard navigation
// gets an independent warning budget regardless of session-scoped Set state.
const navigationId = Math.round(
  typeof performance !== 'undefined' ? performance.timeOrigin : Date.now(),
).toString(36)

// ── Deduplication ─────────────────────────────────────────────────────────────
// One regression warning per (metric type, normalised route, navigation) tuple
// per page load. The Set lives at module scope, which persists for a single page
// session (reset on hard navigation / full reload via module re-evaluation).
const emittedWarnings = new Set<string>()

// ── Validity gate ─────────────────────────────────────────────────────────────

type ReportDecision =
  | { action: 'drop'; reason: DroppedMetricEnvelope['reason'] }
  | { action: 'dev-only' }
  | { action: 'report' }

function shouldReport(metric: WebVitalMetric): ReportDecision {
  if (metric.name === 'LCP') {
    // Gate 1 — sanity ceiling.
    // Values above 60 000 ms cannot represent a real user-visible paint.
    // Root cause of the 406 840 ms sample: the LCP observer persisted across
    // SPA navigations and accumulated entries from subsequent pages, producing
    // a value equal to the elapsed session time rather than the actual paint.
    if (metric.value > LCP_SANITY_CEILING_MS) {
      return { action: 'drop', reason: 'sanity-ceiling' }
    }

    // Gate 2 — bfcache restore.
    // LCP is defined only for initial page loads. A back/forward navigation
    // restores a frozen document; the browser does not re-measure LCP.
    if (metric.navigationType === 'back_forward') {
      return { action: 'drop', reason: 'bfcache' }
    }
  }

  // Gate 3 — hidden during collection.
  // Metrics measured on a backgrounded tab may not reflect real user experience.
  // Dropping these prevents backgrounded tabs from inflating the POOR-rate in
  // analytics dashboards with noise the user never actually experienced.
  if (metric.wasHiddenDuringCollection) {
    return { action: 'drop', reason: 'hidden-during-collection' }
  }

  // Gate 4 — dev cold-start artefact.
  // In development, Turbopack compiles modules on first load. This inflates
  // LCP by 10–30 s on cold starts (observed: 21 148 ms on '/uk'). These are
  // not production regressions; downgrade to console.info so the dev overlay
  // still shows the value but [Perf Regression] is not polluted.
  if (isDev && metric.rating === 'poor') {
    return { action: 'dev-only' }
  }

  return { action: 'report' }
}

// ── Label / style maps (unchanged) ───────────────────────────────────────────

const RATING_LABEL: Record<string, string> = {
  'good':              'GOOD',
  'needs-improvement': 'NEEDS IMPROVEMENT',
  'poor':              'POOR',
}

const RATING_STYLE: Record<string, string> = {
  'good':              'color:#22c55e;font-weight:bold', // design-tokens-allow: #22c55e — perf reporter status palette (console output only; not user-facing UI)
  'needs-improvement': 'color:#f59e0b;font-weight:bold', // design-tokens-allow: #f59e0b — perf reporter status palette (console output only; not user-facing UI)
  'poor':              'color:#ef4444;font-weight:bold', // design-tokens-allow: #ef4444 — perf reporter status palette (console output only; not user-facing UI)
}

function formatValue(name: MetricName, value: number): string {
  if (name === 'CLS') return value.toFixed(4)
  return `${Math.round(value)}ms`
}

// ── Primary reporter ──────────────────────────────────────────────────────────

export function reportMetric(metric: WebVitalMetric): void {
  const decision = shouldReport(metric)

  // ── Dropped sample — invalid, not classifiable ────────────────────────────
  if (decision.action === 'drop') {
    // Always log at debug level (suppressed in default browser settings; visible
    // in verbose mode). Never emit console.warn for dropped samples.
    console.debug(
      `${PERF_REPORT_TAG} dropped invalid sample`,
      `${metric.name}=${metric.value} reason=${decision.reason}` +
      ` route=${normalizeRoute(metric.route)} nav=${metric.navigationType}`,
    )
    dispatchDroppedEvent({
      name: `${metric.name}-dropped`,
      reason: decision.reason,
      originalValue: metric.value,
      route: normalizeRoute(metric.route),
      navigationType: metric.navigationType,
      env: metric.env,
    })
    return
  }

  // ── Valid sample — log and dispatch ──────────────────────────────────────
  if (isDebug) {
    const label = `[${metric.name}] ${formatValue(metric.name, metric.value)} — ${RATING_LABEL[metric.rating]}`
    console.log(
      `%c${label}`,
      RATING_STYLE[metric.rating],
      `| ${metric.deviceType} ${metric.viewportWidth}×${metric.viewportHeight} | route: ${metric.route}`,
    )

    if (metric.name === 'LCP' && metric.lcpIsImage) {
      // Listing detail pages (/[locale]/listings/[slug]) legitimately have a gallery
      // image as LCP — expected behavior, not a regression. Only warn on pages where
      // hero text is expected to own LCP (homepage, listings grid, other content pages).
      const isListingDetailPage = /\/listings\/[^/]+/.test(metric.route)
      if (!isListingDetailPage) {
        console.warn(
          `[Perf] LCP is an image on "${metric.route}" — hero text should own LCP. ` +
          `Check image priority or competing above-fold images.`,
        )
      }
    }

    if (metric.rating === 'poor') {
      if (decision.action === 'dev-only') {
        // Dev build / Turbopack cold-compile artefact — informational only.
        // The dev overlay receives the value via dispatchVitalsEvent below.
        console.info(
          `${PERF_REPORT_TAG} dev-only` +
          ` ${metric.name}=${formatValue(metric.name, metric.value)}` +
          ` route=${normalizeRoute(metric.route)}` +
          ` (dev build — not a production regression)`,
        )
      } else {
        // Production-equivalent poor metric on a valid sample.
        // Dedup: emit at most one warning per (metric type, normalised route)
        // per hard-navigation session so log noise stays proportional to the
        // number of distinct broken page patterns, not repeated page views.
        // navigationId changes on every hard navigation (module re-evaluation),
        // so a second real regression on the same route in a new page load is
        // never silently swallowed by a stale Set entry from the previous load.
        const dedupKey = `${navigationId}|${metric.name}|${normalizeRoute(metric.route)}`
        if (!emittedWarnings.has(dedupKey)) {
          emittedWarnings.add(dedupKey)
          const { good, poor } = PERFORMANCE_BUDGETS[metric.name]
          console.warn(
            `${PERF_REGRESSION_TAG} ${metric.name} POOR (${formatValue(metric.name, metric.value)})` +
            ` on "${metric.route}".` +
            ` Budget: good ≤ ${formatValue(metric.name, good)}, poor > ${formatValue(metric.name, poor)}.` +
            ` Device: ${metric.deviceType} | nav: ${metric.navigationType} | env: ${metric.env}`,
          )
        }
      }
    }
  }

  dispatchVitalsEvent(metric)
}

// ── Analytics dispatch ────────────────────────────────────────────────────────

function dispatchVitalsEvent(metric: WebVitalMetric): void {
  if (typeof window === 'undefined') return
  try {
    // Decoupled analytics hook — subscribe in any future provider init:
    //   window.addEventListener('lero:vitals', (e) => provider.track('web_vitals', e.detail))
    // The metric payload now includes `env` and `wasHiddenDuringCollection`
    // so providers can filter dev noise or backgrounded measurements client-side.
    window.dispatchEvent(new CustomEvent('lero:vitals', { detail: metric }))
  } catch {
    // Dispatcher must never throw into the collection pipeline
  }
}

function dispatchDroppedEvent(envelope: DroppedMetricEnvelope): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent('lero:vitals', { detail: envelope }))
  } catch {
    // Dispatcher must never throw into the collection pipeline
  }
}
