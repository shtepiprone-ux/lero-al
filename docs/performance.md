# Performance Observability & Adaptation

Real-user monitoring (RUM) for Core Web Vitals + runtime UI adaptation based on measured
device capability. Measures, classifies, and adapts — without affecting rendering performance.

---

## Architecture

```
src/lib/performance/
  budgets.ts              — thresholds and metric classifier
  collector.ts            — native PerformanceObserver (LCP, CLS, INP)
  reporter.ts             — dev logging + analytics event dispatch
  tier.ts                 — PerformanceTier, TierSignals, classifyTier, useIdleMount
  store.ts                — module-level reactive store, usePerformanceTier
  predictive.ts           — predictive preload engine, budget, scroll tracker, usePredictivePreload
  imageGuard.ts           — image system guard: URL dedup, pressure state, rate limit, contention checks

src/components/ui/
  appImageConfig.ts           — VARIANTS table, URL utilities (internal to AppImage)
  useAdaptiveImageConfig.ts   — tier adaptation hook + priority image counter
  AppImage.tsx                — orchestrator: priority + predictive prop, containerRef

src/components/shared/
  WebVitalsReporter.tsx       — 'use client' leaf, mounts observers after hydration
  PerformanceStoreInit.tsx    — 'use client' leaf, store init + predictive budget reset on navigation
  PerfDevOverlay.tsx          — dev-only fixed badge (prod-stripped)
```

**No extra npm package.** Uses native browser `PerformanceObserver` API and
`useSyncExternalStore` for the reactive store (built into React 18+).

---

## How Metrics Are Collected

`WebVitalsReporter` is rendered as a leaf node inside `src/app/[locale]/layout.tsx`.
It calls `startWebVitalsCollection(pathname, reportMetric)` inside `useEffect([], [])` — 
runs once after hydration, never during SSR, never during render.

| Metric | Observer type                    | Finalized when                          |
|--------|----------------------------------|-----------------------------------------|
| LCP    | `largest-contentful-paint`       | First user interaction or `pagehide`    |
| CLS    | `layout-shift` (accumulated)     | `visibilitychange → hidden` / `pagehide`|
| INP    | `event` (98th percentile latency)| `visibilitychange → hidden` / `pagehide`|

**INP computation:** all `event` entries with `interactionId` and `duration ≥ 40ms` are 
tracked per interaction ID (max duration per interaction). The final value is the 98th 
percentile of all interaction latencies — matching the Chrome INP algorithm.

**LCP cross-origin images:** if Cloudinary does not send `Timing-Allow-Origin`, 
`renderTime` will be 0. The collector falls back to `loadTime` in that case.

**iOS Safari:** `pagehide` is used in addition to `visibilitychange` because Safari's
implementation of `visibilitychange` is unreliable before navigation.

---

## Performance Budgets

Thresholds defined in `src/lib/performance/budgets.ts`:

| Metric | Good       | Needs Improvement | Poor       |
|--------|------------|-------------------|------------|
| LCP    | ≤ 2,500 ms | 2,500–4,000 ms    | > 4,000 ms |
| CLS    | ≤ 0.10     | 0.10–0.25         | > 0.25     |
| INP    | ≤ 200 ms   | 200–500 ms        | > 500 ms   |

`classifyMetric(name, value)` returns `'good' | 'needs-improvement' | 'poor'`.

---

## Logging Behavior

### Development (or `NEXT_PUBLIC_PERF_DEBUG=true`)

Colored console output:

```
[LCP] 1820ms — GOOD    | desktop 1440×900 | route: /sq/listings/...
[CLS] 0.0000 — GOOD    | desktop 1440×900 | route: /sq
[INP] 95ms   — GOOD    | desktop 1440×900 | route: /sq
```

**LCP image warning** — if the LCP element is an `<img>` on pages where hero text should own LCP:
```
[Perf] LCP is an image on "/sq" — hero text should own LCP.
```

**Route-aware policy:** The warning is suppressed on listing detail pages
(`/[locale]/listings/[slug]`) where the gallery image legitimately owns LCP.
It fires on all other routes (homepage, listings grid, etc.) where an image as LCP
indicates a competing above-fold image or missing `priority` annotation.

**Regression warning** — if any metric is `poor`:
```
[Perf Regression] LCP POOR (4800ms) on "/sq/listings". Budget: good ≤ 2500ms, poor > 4000ms.
```

### Production

Silent. No console output. Only the `lero:vitals` custom event is dispatched.

---

## Where Metrics Are Sent

Metrics are dispatched as a DOM `CustomEvent` named `lero:vitals`:

```ts
window.dispatchEvent(new CustomEvent('lero:vitals', { detail: metric }))
```

This decouples the collection layer from any specific analytics provider.
When a provider is integrated (Plausible, PostHog, GA4, etc.), subscribe in its init:

```ts
window.addEventListener('lero:vitals', (e) => {
  const metric = (e as CustomEvent<WebVitalMetric>).detail
  provider.track('web_vitals', metric)
})
```

---

## Metric Payload Shape

```ts
interface WebVitalMetric {
  name: 'LCP' | 'CLS' | 'INP'
  value: number          // ms for LCP/INP, unitless for CLS
  rating: 'good' | 'needs-improvement' | 'poor'
  id: string             // unique per metric instance
  navigationType: string // 'navigate' | 'reload' | 'back_forward' | 'prerender'
  route: string          // pathname at page load (e.g. '/sq/listings/...')
  deviceType: 'mobile' | 'tablet' | 'desktop'
  viewportWidth: number
  viewportHeight: number
  lcpIsImage: boolean    // true if LCP element is an image (warning: should be false)
}
```

---

## Page Attribution

Every metric includes:

- `route` — pathname at the time of collection (captured at `useEffect` mount)
- `deviceType` — derived from `window.innerWidth` (mobile < 768, tablet < 1024, desktop ≥ 1024)
- `viewportWidth` / `viewportHeight` — actual viewport dimensions at collection time

This allows correlating slow metrics with specific pages, device classes, and viewport sizes.

---

## Regression Detection

Any metric with `rating === 'poor'` triggers:

1. `console.warn` in dev with the threshold context (suppressed in prod)
2. The standard `lero:vitals` event (analytics layer can add alerting)

No regression data is stored in the database — this is a RUM/observability layer only.

---

## Non-Blocking Guarantee

- `WebVitalsReporter` renders `null` — zero DOM impact
- All observers start inside `useEffect([], [])` — after hydration, never during render
- The `pagehide` / `visibilitychange` handlers fire when the page is already leaving
- `dispatchEvent` (synchronous) replaces any network call — does not block INP
- No synchronous network requests anywhere in the pipeline

---

## Optional Debug Flag

Set `NEXT_PUBLIC_PERF_DEBUG=true` in `.env.local` to enable verbose console logging
in production builds (useful for staging environment debugging).

---

## Runtime Adaptation Layer

The performance store drives UI adaptation based on measured device capability.

### Performance Store (`store.ts`)

Module-level reactive store using `useSyncExternalStore`. Initialized **synchronously at
module-load time** — components receive the correct tier on their very first render, before
any `useEffect` fires. This prevents the "wrong tier on first render → flicker" problem.

Initialization sequence:
1. Module loads → `readInitialTier()` → sessionStorage saved tier OR hardware heuristic
2. `PerformanceStoreInit.useEffect` → applies `data-perf-tier` DOM attribute + subscribes to `lero:vitals`
3. When INP arrives (first user interaction) → tier locked from measurement; never changes again this session

```ts
usePerformanceTier()       // 'high' | 'medium' | 'low'
usePerformanceState()      // { lcp, cls, inp, rating, tier, isLocked }
```

### Tier Lifecycle & Locking

The tier is **determined once per session** and locked after the first real INP measurement.
This prevents mid-session UI changes that would cause inconsistent behavior.

```
Page 1 load:      hardware heuristic → tier = 'medium', isLocked = false
User interacts:   INP measured → tier = 'low', isLocked = true
                  tier saved to sessionStorage('lero:perf-tier')
Page 2 load:      sessionStorage read → tier = 'low', isLocked = true (immediately)
                  no waiting for new INP measurement
```

After lock: metric values (LCP, CLS, INP) and overall rating continue to update,
but `tier` and `data-perf-tier` remain frozen.

If `sessionStorage` already has a saved tier on page load, `isLocked` starts as `true`.
A saved tier always came from a prior INP measurement in the same session.

### Device Tier Classification (`tier.ts`)

**Signals used (combined into `TierSignals` interface):**

| Signal | Source | Notes |
|--------|--------|-------|
| `inp` | PerformanceObserver | Definitive — supersedes all other signals |
| `cores` | `navigator.hardwareConcurrency` | Available universally |
| `memory` | `navigator.deviceMemory` | Chromium only (rounded to 0.25–8 GB) |
| `viewport` | `window.innerWidth` | Used as a supporting signal only |

**Classification rules (INP takes priority over hardware):**

| Tier | INP (when available) | Hardware heuristic |
|------|---------------------|-------------------|
| low  | INP > 300 ms | cores ≤ 2 OR memory ≤ 1 GB OR (viewport < 480 AND cores ≤ 4 AND memory ≤ 2) |
| medium | 120 ms ≤ INP ≤ 300 ms | default |
| high | INP < 120 ms | cores ≥ 8 AND memory ≥ 4 GB |

The tier is **persisted in sessionStorage** (`lero:perf-tier`) across page navigations
within a session. On browsers without `deviceMemory` (Firefox, Safari), `memory` defaults
to 4 GB, so classification falls back to `cores` only.

The `data-perf-tier` attribute on `<html>` is set in `PerformanceStoreInit.useEffect`
(not during SSR — no hydration mismatch). CSS rules in `globals.css` use it as a hook
to suppress paint-expensive effects.

### Adaptation by Tier

#### AppImage (`src/components/ui/AppImage.tsx`)

| Behavior              | low                          | medium                    | high                      |
|-----------------------|------------------------------|---------------------------|---------------------------|
| srcSet candidates     | Drops widest candidate       | Full set                  | Full set                  |
| `fetchPriority`       | `"auto"` (natural loading)   | `"high"` for priority     | `"high"` for priority     |
| React 19 `preload()`  | Skipped                      | Skipped                   | Applied for priority      |
| Hover scale/brightness| Disabled                     | Enabled                   | Enabled                   |

**CLS safety**: Dropping a srcSet entry only affects which network request fires.
The `<img>` layout (aspect-ratio container) is unchanged — zero CLS.

**LCP safety**: Hero text is the LCP — not an image. Lowering `fetchPriority` on LOW
only affects listing card images (none of which are LCP candidates). `loading="eager"` is
retained on all tiers to prevent intersection-observer delays for above-fold images.

#### FiltersPanel (`src/components/shared/FiltersPanel.tsx`)

The panel shell (CSS `translate-x-full` container) always mounts immediately.
On LOW tier, the inner content (form fields, header, footer) defers to `requestIdleCallback`
with an 800 ms timeout. `forceNow=open` ensures content mounts instantly when the user
opens the panel — there is no gap between click and visible content.

```
low + panel closed: inner content deferred → reduced initial main-thread work
low + panel open:   inner content mounts immediately (forceNow = true)
medium/high:        inner content mounts immediately (no defer)
```

#### CSS (globals.css)

Three layout-safe rules applied via `[data-perf-tier="low"]`:

```css
[data-perf-tier="low"] .card          → box-shadow: none (reduces paint)
[data-perf-tier="low"] .transition    → transition-duration: 0ms (skips animation)
[data-perf-tier="low"] .backdrop-blur → backdrop-filter: none (removes GPU layer)
```

All three target visual properties only — no size, position, or display changes. Zero CLS risk.

### `useIdleMount(defer, forceNow)` hook

Available from `@/lib/performance/tier`. Use for any component that:
- Is not visible above the fold on initial paint
- Has meaningful JS initialization cost
- Has a user interaction that triggers it (provide as `forceNow`)

```ts
const tier = usePerformanceTier()
const ready = useIdleMount(tier === 'low', userOpened)
```

Falls back to `setTimeout(200ms)` on browsers without `requestIdleCallback` (Firefox, Safari ≤ 16).

---

## Debugging

### Dev Console Logs

In development (or with `NEXT_PUBLIC_PERF_DEBUG=true`), the system logs two events:

**Initial tier** (logs in `PerformanceStoreInit.useEffect`, once per page):
```
[PERF] Initial tier: medium  (source: hardware — 8 cores, 4GB memory, 1440px viewport)
[PERF] Initial tier: low     (source: sessionStorage (prior INP measurement))
```

**Tier locked** (logs when first INP arrives):
```
[PERF] Tier locked: low    (source: INP 380ms)
[PERF] Tier locked: high   (source: INP 95ms)
```

Individual metric logs (from `reporter.ts`):
```
[LCP] 1820ms — GOOD    | desktop 1440×900 | route: /sq
[CLS] 0.0000 — GOOD    | desktop 1440×900 | route: /sq
[INP] 95ms   — GOOD    | desktop 1440×900 | route: /sq
```

### Dev Overlay (`PerfDevOverlay`)

A non-interactive fixed badge renders in the bottom-right corner in development builds only.
`pointer-events: none` — zero interaction impact. Stripped from production via
`process.env.NODE_ENV !== 'development'` (build-time constant check, not a runtime branch).

```
⚡ MEDIUM ◌          ← tier + lock status (🔒 = locked, ◌ = unlocked/heuristic)
LCP 1820ms
INP —                ← '—' until first interaction
```

Colors: `text-destructive` (LOW), `text-status-warning` (MEDIUM), `text-status-success` (HIGH).

### Forcing a Tier for Testing

Clear sessionStorage to reset the tier:
```js
// browser console
sessionStorage.removeItem('lero:perf-tier')
```

Override the `data-perf-tier` attribute to test CSS adaptation without reloading:
```js
document.documentElement.setAttribute('data-perf-tier', 'low')
```

---

## Governance & Safety

### ESLint Enforcement

Two sets of automated rules protect the system from accidental bypasses:

**Image governance** (`eslint.config.mjs` — applied to all `src/**`):
- Raw `<img>` elements → must use `<AppImage variant="...">`
- Inline `srcSet` attribute → must use AppImage
- Inline `fetchPriority` attribute → must use AppImage's `priority` prop
- Exception: `src/components/ui/AppImage.tsx` (the single render site)

**Status mutation governance**: protects listing state transitions (separate concern).

### Rules That Must NEVER Be Changed

These invariants are load-bearing. Breaking them silently degrades LCP, CLS, or INP.

| Rule | Location | Why |
|------|----------|-----|
| `next/image` is banned | `eslint.config.mjs` | next/image introduces proxy overhead; Cloudinary CDN is the delivery path |
| Tier locks after first INP | `store.ts:handleVitalsEvent` | Prevents mid-session UI shifts when tier would change |
| `isLocked` initialized from sessionStorage | `store.ts` module init | Ensures page 2+ starts with stable tier immediately |
| `SERVER_SNAPSHOT` is a stable module-level constant | `store.ts` | `useSyncExternalStore` uses `Object.is` — a new object each call causes an infinite re-render loop in React 19 |
| `GUARD_SERVER_SNAPSHOT` is a stable module-level constant | `imageGuard.ts` | Same rule — `useGuardStats` server snapshot must be a fixed reference |
| `getServerSnapshot()` always returns `tier: 'medium'` | `store.ts` | Prevents SSR/client hydration mismatch |
| `data-perf-tier` set in `useEffect` only | `store.ts:initPerformanceStore` | DOM attribute after hydration = no hydration mismatch |
| CSS rules target paint properties only | `globals.css` | No layout properties = zero CLS risk |
| `display:none`/`visibility:hidden` forbidden in tier CSS | `globals.css` | Content must remain accessible on all tiers |
| `notifyPriorityPreload()` called in `useEffect`, never in render | `AppImage.tsx` | Synchronous listener callbacks during render trigger "Cannot update component while rendering another component" |
| `commit()` in imageGuard skips listeners when state is unchanged | `imageGuard.ts` | Prevents redundant re-renders of PerfOverlayContent when pressure/counts haven't actually changed |
| `appImageConfig.ts` / `useAdaptiveImageConfig.ts` are private | import boundary | Public API is `AppImage.tsx` only; internal coupling is expected |

### Common Mistakes

**1. Adding display:none to a tier CSS rule**

```css
/* ❌ FORBIDDEN — hides content, breaks accessibility */
[data-perf-tier="low"] .some-section { display: none; }

/* ✓ CORRECT — visual effect only */
[data-perf-tier="low"] .some-section { box-shadow: none; }
```

**2. Returning an inline object from `getServerSnapshot`**

```ts
// ❌ INFINITE LOOP — new object reference on every React 19 call
function getServerSnapshot() {
  return { tier: 'medium', lcp: null, ... }
}

// ✓ CORRECT — stable module-level constant, same reference every call
const SERVER_SNAPSHOT: PerformanceState = { tier: 'medium', lcp: null, ... }
function getServerSnapshot() { return SERVER_SNAPSHOT }
```

React 19 `useSyncExternalStore` calls `getServerSnapshot` during both SSR and hydration
and compares results with `Object.is`. A new object literal fails the identity check every
time, forcing React into an infinite re-render loop. The same rule applies to any `useSyncExternalStore`
server snapshot — never use inline `() => ({...})` as the third argument.

**3. Calling guard/store mutation functions during render**

```tsx
// ❌ REACT LIFECYCLE VIOLATION — fires statsListeners during AppImage render,
//    updating PerfOverlayContent: "Cannot update a component while rendering another"
if (shouldPreload) {
  preload(optimizedSrc, { as: 'image' })
  notifyPriorityPreload(optimizedSrc)  // ← synchronous listener storm
}

// ✓ CORRECT — preload() is render-safe (React 19 resource API);
//             guard notification deferred to post-commit useEffect
if (shouldPreload) {
  preload(optimizedSrc, { as: 'image' })
}
useEffect(() => {
  if (!shouldPreload || !optimizedSrc) return
  notifyPriorityPreload(optimizedSrc)
}, [shouldPreload, optimizedSrc])
```

Any function that calls `commit()` → `statsListeners` must not run during render.
Effect ordering in AppImage guarantees the URL is registered before the
predictive observer setup (notifyPriorityPreload is effect 3, usePredictivePreload
is effect 4 — React fires effects in registration order).

**4. Calling `usePerformanceTier()` in a Server Component**

Server Components cannot use client-side hooks. The hook returns the server snapshot
(`'medium'`) correctly, but calling it from a Server Component will throw. Always use
tier-aware logic in `'use client'` components only.

**4. Bypassing AppImage with a raw `<img>`**

```tsx
// ❌ Bypasses: Cloudinary, srcset, LQIP, tier adaptation, lazy loading
<img src={url} fetchPriority="high" />

// ✓ AppImage handles all of this
<AppImage src={url} variant="listing" priority alt="..." />
```

**4. Removing the `isLow` srcSet trim in `useAdaptiveImageConfig`**

The trim drops the widest srcSet candidate on LOW devices. Removing it silently
re-introduces bandwidth waste on weak connections. If you change srcSet logic,
verify behavior on the `low` tier.

**5. Adding a new Cloudinary transform string outside `appImageConfig.ts`**

All Cloudinary URL construction must go through `insertTransform` / `buildSrcset`
in `appImageConfig.ts`. Never build `res.cloudinary.com` URLs inline in components.

### How to Safely Extend the System

**Add a new image variant:**
1. Add the entry to `VARIANTS` in `appImageConfig.ts`
2. Add the type to `ImageVariant`
3. If the variant should never be `priority`, add it to `NEVER_PRIORITY_VARIANTS` in `useAdaptiveImageConfig.ts`
4. If the variant has hover effects, add them to `hoverClass` (never `imageClass`)

**Add a new grid layout context:**
1. Add the type to `ListingLayoutContext` in `imageDelivery.ts`
2. Add the sizes string to `LISTING_LAYOUT_SIZES`
3. Pass `layoutContext` to `<AppImage variant="listing" layoutContext="your-context">`

**Add a new LOW-tier CSS rule:**
1. Confirm the property is paint-only (safe list: `box-shadow`, `transition-*`, `filter`, `backdrop-filter`, `opacity` on decorative elements)
2. Add the `/* SAFE: ... */` comment explaining why
3. Verify no layout changes with the rule active

**Add a new performance signal to tier classification:**
1. Add the signal to the `TierSignals` interface in `tier.ts`
2. Update `classifyTier` to incorporate the signal
3. Update `readInitialTierWithSource` to read the signal
4. Update `handleVitalsEvent` in `store.ts` if the signal comes from a vitals metric

**Add a new analytics provider:**
Subscribe to the `lero:vitals` event in the provider's initialization code:
```ts
window.addEventListener('lero:vitals', (e) => {
  const metric = (e as CustomEvent<WebVitalMetric>).detail
  provider.track('web_vitals', metric)
})
```
Never modify `reporter.ts` to add provider-specific calls inline.

---

## layoutContext Normalization

The `listing` variant on `AppImage` accepts an optional `layoutContext` prop. Omitting it
is valid — it defaults to `'default'` (the 3-col responsive grid used on the homepage).

```ts
const DEFAULT_LISTING_LAYOUT_CONTEXT: ListingLayoutContext = 'default'
const effectiveLayoutContext = layoutContext ?? DEFAULT_LISTING_LAYOUT_CONTEXT
```

The dev warning for missing `layoutContext` was removed in the stabilization pass.
The default sizing matches the most common usage (homepage, featured, latest sections).
Pass an explicit context only when the card renders in a different known grid:

| Context | When to use |
|---------|-------------|
| `'default'` | Homepage grids, any 3-col lg layout (default — no prop needed) |
| `'sidebar'` | `/listings` page with filter sidebar |
| `'4-col'` | Similar listings section |
| `'3-col-xl'` | Favorites page (3-col starts at xl, not lg) |

Incompatible combinations (e.g. `priority` on avatar/strip variants) still warn in dev.

---

## StrictMode Behavior

React 18 StrictMode runs effects twice in development (mount → cleanup → mount) to
surface side-effect bugs. The image delivery system is hardened for this:

**Priority preload registration** (`notifyPriorityPreload` in `imageGuard.ts`):
The rate counter (`recentPreloadTimes`) is skipped for URLs already in `preloadedUrls`.
This prevents the StrictMode double-render from inflating the rate count.

**Priority image counter** (`useAdaptiveImageConfig.ts`):
The `useEffect` cleanup decrements the counter. StrictMode: increment → decrement → increment
→ final count is correct (same as a single mount).

**Performance store** (`initPerformanceStore` in `store.ts`):
Guard against double-registration via `if (vitalsHandler) return () => {}`.
StrictMode: registers → cleanup removes → re-registers → single active listener.

**Listing view tracking** (`ViewTracker.tsx`):
Uses `AbortController` with `signal` on the `fetch` call. StrictMode: first fetch is
aborted by cleanup before it completes; second fetch succeeds. Exactly one view increment
per real mount — in both development and production.

---

## Predictive Preload Layer

Behavior-driven image delivery that preloads images based on user intent signals,
layered above the deterministic priority system. Implemented in `predictive.ts`.

### Tier Rules

| Tier | Hover | Viewport proximity | Scroll prediction |
|------|-------|--------------------|-------------------|
| LOW  | ✗ off | ✗ off | ✗ off |
| MEDIUM | ✓ (60ms debounce) | ✓ 300px ahead | ✗ off |
| HIGH | ✓ (60ms debounce) | ✓ 500px ahead | ✓ 500px ahead |

### Budget

`MAX_PREDICTIVE_PRELOADS = 2` — global per page. Separate from `MAX_PRIORITY_IMAGES = 3`.
Priority preloads never compete with predictive slots (independent counters).

Budget resets on each SPA page navigation via `PerformanceStoreInit`'s pathname `useEffect`.

### Velocity Guard

Viewport and scroll-trigger preloads are suppressed when `scrollVelocity > 1500 px/s`.
Fast-scrolling users fly past listings before images could load — wasted bandwidth.
Hover preloads are never gated by velocity (hover implies deliberate intent).

### AppImage `predictive` Prop

```tsx
<AppImage
  variant="listing"
  src={url}
  alt="..."
  priority={false}     // deterministic: LCP budget
  predictive           // behavioral: intent signals
  layoutContext="sidebar"
/>
```

`predictive` is a hint — the engine enforces tier rules and budget internally.
Passing `predictive={true}` on LOW tier is safe (hook is a complete no-op).

**Currently enabled for:** `ListingCard` (both `listing` and `listing-thumb` variants).

### Observability

Every preload attempt dispatches `lero:vitals`:

```ts
{
  name: 'predictive-preload',
  variant: ImageVariant,
  trigger: 'hover' | 'viewport' | 'scroll',
  success: boolean   // false = blocked by budget or tier
}
```

### Dev Overlay

The `PerfDevOverlay` shows `pred N/2` counter. Turns red with `⚠` if budget exceeded.
Shows `off` label when tier is LOW.

### Per-instance Deduplication

Each AppImage instance fires at most one predictive preload per mount (via `preloadedRef`).
If hover triggers first, the viewport observer is disconnected immediately — no double-preload.

### Extending

To enable predictive on a new image component: pass `predictive` to `<AppImage>`.
To change proximity margins: update `INTERSECTION_MARGIN` in `predictive.ts`.
To change the budget: update `MAX_PREDICTIVE_PRELOADS` in `predictive.ts`.
To add a new trigger type: add to `PredictiveTrigger`, wire it in `usePredictivePreload`,
pass to `attemptPredictivePreload`.

---

## Image Guard Layer (`imageGuard.ts`)

The guard is the bottom layer of the dependency graph. It has NO imports from
`predictive.ts` or `useAdaptiveImageConfig.ts`. Callers push state to it via
`updateImageSystemState()` and `notifyPredictivePreload()` / `notifyPriorityPreload()`.

### Safety Hierarchy

```
Level 1: LCP path         → never blocked (no guard calls on the LCP render path)
Level 2: Priority preloads → bypass canPredictivePreload; URL registered via notifyPriorityPreload
Level 3: Predictive preloads → fully guarded (all 4 guard gates)
Level 4: Lazy loading      → default fallback when guard blocks predictive
```

The guard NEVER touches level 1 or 2. Only levels 3 and 4 are affected.

### Guard Gates (applied to predictive preloads only)

| Gate | Trigger | Block reason |
|------|---------|-------------|
| URL dedup | Same `optimizedSrc` already preloaded this page | `duplicate-url` |
| Rate limit | More than 4 preloads fired in the last 1 second | `rate-limit` |
| Contention | `predictiveCount + priorityCount > 3` | `contention` |
| Near-limit | `predictiveCount >= MAX-1` AND `trigger === 'hover'` | `near-limit` |

The near-limit gate degrades the last budget slot to viewport/scroll only (not hover).
Viewport-based preloads are higher certainty than hover speculation.

### Pressure State

`ImagePressure: 'low' | 'normal' | 'high'`

**Important: pressure thresholds are separate from guard gate thresholds.**
Guard gates control *when preloads are blocked*. Pressure describes *observable system state*.

With `MAX_PRIORITY_IMAGES=3` and `MAX_PREDICTIVE_PRELOADS=2`, the theoretical maximum
combined count is 5. Pressure levels are calibrated so that filling the normal budget
produces at most NORMAL (not HIGH) pressure.

Computed from: `sysPredictive + sysPriority` and recent preload rate.
Scroll velocity is a gate in `predictive.ts` — it is NOT included in pressure to
avoid false HIGH signals during ordinary touch-scroll or mouse-wheel usage.

| Pressure | Condition |
|----------|-----------|
| high | combined ≥ 6 (budget exceeded) OR rate ≥ 6/s (extreme burst) |
| normal | combined ≥ 4 (most slots in use) OR rate ≥ 3/s |
| low | default — all normal browsing |

**Dev overlay behavior:** The "IMG" row is hidden at LOW pressure (no signal value).
It appears in yellow (NORMAL) or red+bold (HIGH) only when the system is under load.

`console.warn` fires only on HIGH pressure transitions. NORMAL and LOW never log.
Per-block debug logs are suppressed — stats are surfaced via the dev overlay's
`dup×N` / `sup×N` counters instead.

Pressure transitions fire `lero:vitals` events with `name: 'pressure-state-change'`.

### Page Reset

`resetGuard()` is called from `PerformanceStoreInit` on every pathname change.
This clears: `preloadedUrls`, `recentPreloadTimes`, all system state, stats, and pressure.

### Observability Events

All dispatched via `lero:vitals` CustomEvent:

| Event name | Emitted when |
|------------|-------------|
| `image-guard-trigger` | Guard blocks a preload (contention/rate/near-limit) |
| `preload-suppressed` | Duplicate URL blocked |
| `pressure-state-change` | Pressure transitions (low→normal, normal→high, etc.) |

### Dev Overlay

`PerfDevOverlay` shows (image system section):
- `IMG NORMAL/HIGH` — pressure state, only when above LOW (LOW is hidden to reduce noise)
- `dup×N` — duplicate URL blocks this page
- `sup×N` — guard rule blocks this page
The dup/sup rows are hidden when both values are zero (clean state).

---

## React 19 Concurrency Invariants

Hardening rules for the entire performance/image runtime layer. These invariants
were established during the React 19 Concurrency Stability Pass and must be
preserved as the system evolves.

---

### External Store Safety Contract

Every `useSyncExternalStore` usage in this codebase (`store.ts`, `imageGuard.ts`,
`predictive.ts`, `useAdaptiveImageConfig.ts`) must satisfy all four of these:

| Requirement | Why |
|-------------|-----|
| `getServerSnapshot` must be a **named, stable, module-level function** | React 19 calls it during SSR and hydration and compares results with `Object.is`. A new function reference is fine — but any function that returns a new object literal each call creates an infinite re-render loop. Named functions are auditable; inline arrows hide this risk. |
| `getSnapshot` must return the **same reference** unless state actually changed | React compares `Object.is(prevSnapshot, nextSnapshot)`. An unnecessary new object triggers a re-render for no reason. All `setStore`/`commit` calls create new objects only on genuine state changes. |
| `subscribe` must add and clean up exactly one listener per call | Returning the unsubscribe function from `subscribe` must remove exactly the callback that was added — never more, never all. |
| Subscriber callbacks (`listeners.forEach(cb)`) must only be called **post-commit** | Calling them during React's render phase triggers "Cannot update a component while rendering a different component". All store mutations in this system go through `useEffect` or window event handlers — never render. |

**The named-function rule applies even for primitive returns:**

```ts
// ❌ DANGEROUS — works today for primitive 0, breaks if someone changes it to an object
export function usePredictiveImageCount(): number {
  return useSyncExternalStore(subscribePredictiveCount, getPredictiveCount, () => 0)
}

// ✓ CORRECT — named function forces the pattern to be auditable and safe
function getPredictiveServerSnapshot(): number { return 0 }
export function usePredictiveImageCount(): number {
  return useSyncExternalStore(subscribePredictiveCount, getPredictiveCount, getPredictiveServerSnapshot)
}
```

---

### Render-Phase Mutation Prohibition

**NEVER call any of these during React render (outside of effects/event handlers):**

- `commit()` in `imageGuard.ts` — calls `statsListeners` synchronously
- `notifyPriorityPreload()` — calls `commit()` → `statsListeners`
- `notifyPredictivePreload()` — calls `commit()` → `statsListeners`
- `notifyGuardBlock()` — calls `commit()` → `statsListeners`
- `updateImageSystemState()` — calls `recompute()` → `commit()` → `statsListeners`
- `setStore()` in `store.ts` — calls `listeners` synchronously
- `notifyPriorityCount()` / `notifyPredictiveCount()` — call subscriber sets directly
- `window.dispatchEvent(new CustomEvent('lero:vitals', ...))` — synchronously invokes
  `handleVitalsEvent` → `setStore` → `listeners`

All of these ultimately notify `useSyncExternalStore` subscriber callbacks. Calling them
during render causes React to update another component while the current one is still
rendering — the "Cannot update a component while rendering another component" error.

```tsx
// ❌ RENDER-PHASE VIOLATION
function AppImage({ ... }) {
  const { shouldPreload } = useAdaptiveImageConfig(...)
  if (shouldPreload) {
    notifyPriorityPreload(optimizedSrc)  // fires statsListeners DURING render
  }
  ...
}

// ✓ CORRECT — deferred to post-commit effect
function AppImage({ ... }) {
  const { shouldPreload } = useAdaptiveImageConfig(...)
  if (shouldPreload) {
    preload(optimizedSrc, { as: 'image' })  // React 19 resource API — render-safe
  }
  useEffect(() => {
    if (!shouldPreload || !optimizedSrc) return
    notifyPriorityPreload(optimizedSrc)    // post-commit — safe
  }, [shouldPreload, optimizedSrc])
}
```

---

### StrictMode Safety Rules

React 18/19 StrictMode invokes every `useEffect` twice in development:
mount → cleanup → mount. Every effect in this system must satisfy:

| Effect | Cleanup requirement | Idempotency guarantee |
|--------|--------------------|-----------------------|
| `initPerformanceStore` | Removes `lero:vitals` listener, nulls `vitalsHandler` | Guard `if (vitalsHandler) return () => {}` prevents double-registration |
| `notifyPriorityPreload` | No cleanup (URL registrations are page-scoped) | `preloadedUrls.has(url)` prevents double rate-counting |
| Priority image counter | Cleanup decrements counter | StrictMode: +1 −1 +1 = final count is 1 (correct) |
| `usePredictivePreload` | Removes mouse listeners, disconnects observer, clears timer | StrictMode: `preloadedUrls.has(url)` on second mount → `duplicate-url` gate → no double preload |
| WebVitals observers | Disconnects all 3 observers | Fresh local flags (`lcpReported`, etc.) on second mount — clean slate |
| `useIdleMount` timer | Cancels `requestIdleCallback` / `clearTimeout` | Second mount re-schedules cleanly |

**The critical invariant:** no counter, URL set, or budget may be permanently inflated
by StrictMode double-invocation. The `preloadedUrls` Set is the central deduplication
mechanism — it must be checked before every increment.

---

### Singleton Lifecycle Rules

Module-level singletons in this system:

| Singleton | File | Reset on navigation? | Cleanup on unmount? |
|-----------|------|---------------------|---------------------|
| `state` (PerformanceState) | `store.ts` | No — tier persists across pages | N/A — lives for session |
| `listeners` Set | `store.ts` | No — store is session-scoped | Managed by `subscribe` return |
| `preloadedUrls` Set | `imageGuard.ts` | Yes — `resetGuard()` | N/A — page-scoped |
| `recentPreloadTimes` array | `imageGuard.ts` | Yes — `resetGuard()` | N/A — page-scoped |
| `sysPredictive/sysPriority` | `imageGuard.ts` | Yes — `resetGuard()` | N/A — page-scoped |
| `guardStats` / `statsListeners` | `imageGuard.ts` | Partial — `resetGuard()` resets stats | Managed by `subscribeGuardStats` return |
| `predictiveCount` | `predictive.ts` | Yes — `resetPredictiveBudget()` | N/A — page-scoped |
| `scrollVelocity / lastScrollY / lastScrollTime` | `predictive.ts` | Yes — `resetScrollTracker()` | N/A — page singleton |
| `scrollTrackerReady` | `predictive.ts` | **NO** — listener must persist across pages | N/A — page singleton |
| `vitalsHandler` | `store.ts` | No — session singleton | Removed by `initPerformanceStore` cleanup |

**Navigation reset order in `PerformanceStoreInit` `[pathname]` effect:**
```
resetPredictiveBudget()  → clears predictiveCount, notifies subscribers
resetScrollTracker()     → resets lastScrollY/Time/scrollVelocity to current page state
resetGuard()             → clears preloadedUrls, recentPreloadTimes, sysState, stats
```

Order matters: `resetGuard()` must run BEFORE any new `notifyPriorityPreload()` calls
from newly-mounted AppImage components. React guarantees this: `PerformanceStoreInit`
is in the layout (parent), AppImage is in the page (child). Setup effects run
parent-before-child.

---

### Scroll Tracker Safety

`ensureScrollTracker()` registers a module-level `scroll` listener on first call.
`scrollTrackerReady` prevents duplicate registration. The listener persists for the
entire page session — this is intentional (the scroll tracker is a page singleton).

`resetScrollTracker()` must be called on every SPA navigation to prevent stale velocity:
- `lastScrollY` retains the old page's scroll position after navigation
- `lastScrollTime` retains the old page's timestamp
- First scroll on new page: `velocity = |newY - staleOldY| / smallDt` → artificially high
- Result: `FAST_SCROLL_THRESHOLD (1500 px/s)` gate incorrectly blocks legitimate preloads

`resetScrollTracker()` sets `lastScrollY = window.scrollY` (current page position) and
`lastScrollTime = performance.now()` — giving the first scroll event a correct baseline.
`scrollVelocity` is reset to `0` — the velocity gate is inactive until first scroll.

---

### Subscriber Notification Efficiency

Scroll events do not touch `imageGuard.ts` at all. The scroll handler in `predictive.ts`
only updates the module-local `scrollVelocity` variable:

```ts
// predictive.ts — updateScrollVelocity (fires on every 'scroll' event)
scrollVelocity = Math.abs(window.scrollY - lastScrollY) / (dt / 1000)
// Gate 3 in attemptPredictivePreload reads scrollVelocity directly — no cross-module write
```

`scrollVelocity` is a **telemetry signal**, not a pressure signal:
- It gates speculative preloads locally inside `attemptPredictivePreload` Gate 3
- It is never passed to `imageGuard.ts` or included in pressure computation
- `derivePressure()` and `getRecentCount()` are not called on scroll events
- `statsListeners` (PerfOverlayContent) are not notified on scroll events

`updateImageSystemState` only accepts genuine pressure signals:
- `predictiveCount` — active speculative preload slots (affects combined count → pressure)
- `priorityCount` — active LCP-candidate preload slots (affects combined count → pressure)

The `commit()` equality check (`pressure + conflicts + suppressed`) provides a second-layer
guard: even if `recompute()` is called when counts haven't meaningfully changed, `commit()`
bails early and no subscriber is notified. This prevents pressure-flicker during burst preloads.

---

### NEVER DO THIS — Concurrency Anti-Patterns

**1. Inline object literal as server snapshot**
```ts
// ❌ INFINITE LOOP in React 19 — new reference on every call
useSyncExternalStore(subscribe, getSnapshot, () => ({ pressure: 'low', conflicts: 0, suppressed: 0 }))

// ✓ Module-level constant + named function
const SNAP: GuardStats = { pressure: 'low', conflicts: 0, suppressed: 0 }
function getSnap(): GuardStats { return SNAP }
useSyncExternalStore(subscribe, getSnapshot, getSnap)
```

**2. Store mutation during render**
```ts
// ❌ LIFECYCLE VIOLATION — synchronous listener cascade during render
function MyComponent({ src }) {
  notifyPriorityPreload(src)  // calls commit() → statsListeners → re-render storm
  return <img src={src} />
}

// ✓ Post-commit via useEffect
function MyComponent({ src }) {
  useEffect(() => { notifyPriorityPreload(src) }, [src])
  return <img src={src} />
}
```

**3. Observer registration during render**
```ts
// ❌ A new IntersectionObserver on every render, leaks on unmount
function MyComponent() {
  const observer = new IntersectionObserver(...)
  observer.observe(ref.current)
  return <div ref={ref} />
}

// ✓ Inside useEffect with disconnect() in cleanup
function MyComponent() {
  useEffect(() => {
    const observer = new IntersectionObserver(...)
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref} />
}
```

**4. Synchronous window.dispatchEvent from render**
```ts
// ❌ dispatchEvent fires lero:vitals listener → setStore → listeners → re-render during render
function MyComponent() {
  window.dispatchEvent(new CustomEvent('lero:vitals', { detail: metric }))
  return null
}

// ✓ Dispatch from event handlers, effects, or PerformanceObserver callbacks only
window.addEventListener('pagehide', () => {
  window.dispatchEvent(new CustomEvent('lero:vitals', { detail: metric }))
})
```

**5. Skipping resetScrollTracker() on navigation**
```ts
// ❌ stale lastScrollY causes false high-velocity readings on first scroll after navigation
useEffect(() => {
  resetPredictiveBudget()
  resetGuard()
  // ← missing resetScrollTracker()
}, [pathname])

// ✓ Always reset all three on navigation
useEffect(() => {
  resetPredictiveBudget()
  resetScrollTracker()
  resetGuard()
}, [pathname])
```

---

## LCP Sample Validity & Reporter Contract

Established during the LCP Stabilization Pass (2026-05). No new perf subsystems
were introduced — only correctness gates and log-level discipline were added to
the existing collector + reporter.

---

### Root Causes of the Observed Invalid LCP Values

**406 840 ms on `/[locale]/listings/[slug]`**

The `LargestContentfulPaint` PerformanceObserver was created with `{ buffered: true }`
and never disconnected after the initial LCP finalization. `WebVitalsReporter` lives
in the locale layout and stays mounted across SPA navigations. After the user clicked
a link (which triggered `finalizeLCP()` and set `lcpReported = true`), the observer
remained active and accumulated LCP entries from subsequent SPA pages rendered into
the same document. When the user eventually hid the tab, `handlePageHide()` dispatched
the accumulated value — 406 seconds of elapsed session time — under the original
page's route.

Additionally, `takeRecords()` return values were silently discarded (the return value
was never processed), causing the final pending entry to be dropped.

**21 148 ms on `/[locale]` (homepage, all locales)**

Turbopack dev cold-compile latency — **not** a hydration-blocked H1. The homepage
`<h1>` is server-rendered (the page component is an `async` Server Component with no
`'use client'` directive; `getTranslations()` runs on the server). The H1 is present
in the initial SSR HTML response for all 4 locales. The inflated LCP is caused by
Turbopack's cold-compile delaying the server response (TTFB) by 15–30 s. Because LCP
is measured from `navigationStart`, a 20 s TTFB produces a 20 s LCP even though the
H1 paints instantly once the HTML arrives. This is not a production regression — it
is a dev build artefact. The reporter had no dev/prod separation, so it emitted
`[Perf Regression]` for both real regressions and build-time noise.

---

### LCP Sample Validity Gates

A sample is **dropped** (not classified, not warned) when ANY of the following is
true. Dropped samples are logged at `console.debug` level and dispatched as a
separate analytics event (see below).

| Gate | Condition | Reason |
|------|-----------|--------|
| Sanity ceiling | `LCP value > 60 000 ms` | Physically impossible paint time. Observer accumulated entries from SPA page transitions. |
| bfcache restore | `navigationType === 'back_forward'` | LCP is defined only for initial page loads, not document restores. |
| Hidden during collection | `wasHiddenDuringCollection === true` | Metric measured on a backgrounded tab. May not reflect real user experience; dropped to prevent inflating POOR-rate in analytics. |

`wasHiddenDuringCollection: boolean` is a **hard drop gate** (Gate 3 in `shouldReport()`).
It is `true` if the page was hidden at any point between navigation start and metric
finalization. A metric collected on a backgrounded tab is routed to a `dispatchDroppedEvent()`
with `reason: 'hidden-during-collection'` and does NOT reach the budget-classification path or
the `[Perf Regression]` warning path.

---

### DEV vs PROD Reporting Policy

| Condition | Log output | Analytics dispatch |
|-----------|-----------|-------------------|
| Sample dropped (any gate above) | `console.debug [perf-reporter] dropped invalid sample` | `lero:vitals` with `name: 'LCP-dropped'` envelope |
| Dev mode + `rating === 'poor'` | `console.info [perf-reporter] dev-only LCP=Nms route=/...` | `lero:vitals` with normal metric (includes `env: 'development'`) |
| Production + `rating === 'poor'` + first occurrence | `console.warn [Perf Regression] ...` | `lero:vitals` with normal metric |
| Any metric, any rating | `console.log [LCP] Nms — GOOD ...` (in debug mode) | `lero:vitals` with normal metric |

**`[Perf Regression]` is reserved for production-equivalent samples that survive
all validity gates.** Every line with this tag is an actionable regression on a
real user-visible paint.

**Deduplication:** at most one `[Perf Regression]` warning per `(navigation-id, metric type,
locale-normalised route)` tuple per page load. The normalised route strips the locale prefix
so `/uk/listings/slug` and `/sq/listings/slug` share one warning budget. The `navigationId`
is derived from `Math.round(performance.timeOrigin).toString(36)` — unique per hard navigation
(each full page load re-evaluates the module) — so a second real regression on the same route
in a new page load is never silently swallowed by a stale Set entry from the previous load.

---

### Log-Tag Contract

| Tag | Level | Meaning |
|-----|-------|---------|
| `[perf-reporter] dropped invalid sample` | `console.debug` | Sample above ceiling, bfcache, or otherwise invalid. Not a regression. |
| `[perf-reporter] dev-only` | `console.info` | Poor metric in dev build. Likely Turbopack cold-compile. Not a regression. |
| `[Perf Regression]` | `console.warn` | Real actionable regression on a production-equivalent, valid sample. |
| `[Perf] LCP is an image on "..."` | `console.warn` | LCP element is an image where hero text should own it. Separate from budget gate. |
| `[LCP] Nms — GOOD/NEEDS IMPROVEMENT/POOR` | `console.log` | Normal metric log (debug mode only). |

---

### Dropped-Sample Envelope Shape

Dropped samples dispatch a `lero:vitals` CustomEvent whose `detail` matches
`DroppedMetricEnvelope` from `reporter.ts`. Consumers check `name.endsWith('-dropped')`.

```ts
interface DroppedMetricEnvelope {
  name: string           // e.g. 'LCP-dropped'
  reason: 'sanity-ceiling' | 'bfcache' | 'dev-cold-start' | 'hidden-during-collection'
  originalValue: number  // the raw value that was rejected
  route: string          // locale-normalised (e.g. '/listings/slug')
  navigationType: string
  env: 'development' | 'production'
}
```

Example analytics listener:
```ts
window.addEventListener('lero:vitals', (e) => {
  const payload = (e as CustomEvent).detail
  if (typeof payload.name === 'string' && payload.name.endsWith('-dropped')) {
    provider.track('lcp_dropped', payload)
    return
  }
  provider.track('web_vitals', payload)
})
```

---

### WebVitalMetric — New Fields (v2)

Two fields were added to `WebVitalMetric` during the stabilization pass.
Existing analytics consumers that only read `name`, `value`, `rating`, `route`,
`navigationType`, and `deviceType` are not affected.

| Field | Type | Description |
|-------|------|-------------|
| `wasHiddenDuringCollection` | `boolean` | Page was hidden at any point between navigation start and metric finalization. |
| `env` | `'development' \| 'production'` | Runtime environment at collection time. Allows sinks to filter dev build noise. |

---

### Dropped-Sample Dashboard Contract

All analytics consumers of the `lero:vitals` CustomEvent **must** isolate dropped samples
from valid metrics. The only in-codebase consumer of `lero:vitals` is `store.ts`
(`handleVitalsEvent`), which is guarded against non-`WebVitalMetric` events (drops,
predictive, guard events) by an explicit name filter:

```ts
// store.ts — handleVitalsEvent
if (payload?.name !== 'LCP' && payload?.name !== 'CLS' && payload?.name !== 'INP') return
```

This guard prevents dropped-sample envelopes (`'LCP-dropped'`, `'CLS-dropped'`, `'INP-dropped'`),
predictive-preload events (`'predictive-preload'`), and image-guard events (`'image-guard-trigger'`,
`'preload-suppressed'`, `'pressure-state-change'`) from mutating the performance store or
triggering spurious re-renders.

**For any future analytics provider integration**, the pattern must ensure dropped samples
are routed to a SEPARATE counter / dimension and are NOT included in any POOR-rate or
p75 LCP aggregation. Dropped events may appear in dashboards under a dedicated `dropped`
dimension, never folded into the regression rate.

**Consumer audit (2026-05-07):**

| Consumer | File | Guards dropped samples? |
|----------|------|------------------------|
| `handleVitalsEvent` | `store.ts` | ✅ name-filter guard added — only `LCP/CLS/INP` processed |
| Future analytics provider | (not yet integrated) | Must check `payload.name.endsWith('-dropped')` before calling regression-rate aggregation |

No external analytics provider is currently integrated. When one is added, subscribe via
the `lero:vitals` pattern and use the `DroppedMetricEnvelope.reason` field to route
dropped samples to a separate `dropped_metrics` counter:

```ts
window.addEventListener('lero:vitals', (e) => {
  const payload = (e as CustomEvent).detail
  if (typeof payload.name === 'string' && payload.name.endsWith('-dropped')) {
    // Route to dropped-metrics counter — NEVER to regression-rate aggregation
    provider.track('vitals_dropped', payload)
    return
  }
  provider.track('web_vitals', payload)
})
```

---

### Collector Hardening (observer lifecycle)

- The LCP observer now **disconnects itself in `finalizeLCP()`** (first user interaction)
  to prevent SPA navigation content from updating `lcpValue` after the initial page's
  LCP has been reported.
- `takeRecords()` return values are now **processed** (updating `lcpValue` / `clsValue` /
  `interactionLatencies`) before reports are dispatched. Previously the return value was
  discarded, silently dropping the final pending entry.
- A `hiddenTracker` visibility listener is registered at collection start and torn down
  in the cleanup function, independently of the page-hide handler.

### Routes Affected (locale-agnostic)

All fixes are applied at the **component level** (collector + reporter), not per-locale.
`normalizeRoute()` strips the locale segment from any route before dedup or log output.
The `/[locale]` and `/[locale]/listings/[slug]` route patterns are validated identically
for `sq`, `en`, `uk`, and `it` locales.

---

## Store Metric Handling Contract

The `lero:vitals` channel is shared by several subsystems (collector, reporter, predictive
preload, image guard). `handleVitalsEvent` in `store.ts` uses an allow-list so only the
three Core Web Vitals produced by `collector.ts` mutate the performance store:

```ts
if (payload?.name !== 'LCP' && payload?.name !== 'CLS' && payload?.name !== 'INP') return
```

**FCP and TTFB are never dispatched by `collector.ts`** — the collector only measures LCP,
CLS, and INP via `PerformanceObserver`. FCP and TTFB are not in scope for the RUM layer.
If a future pass adds FCP/TTFB collection, they must be added to this allow-list or the
store must be extended to handle them explicitly.

The other event names sharing the channel (`LCP-dropped`, `CLS-dropped`, `INP-dropped`,
`predictive-preload`, `image-guard-trigger`, `preload-suppressed`, `pressure-state-change`)
are intentionally blocked by the allow-list — they are diagnostic/observability events,
not WebVitalMetric instances.

---

## Gallery LCP Delivery Contract

### Cloudinary Image Sizing for the Gallery Hero

The `gallery-main` AppImage variant uses **height-constrained srcset entries** to cap the
downloaded image to the gallery container's visible area (mobile `h-[340px]`, desktop
`h-[500px]`). Without heights, Cloudinary serves full-ratio images even when the container
clips the bottom portion — wasting bandwidth on invisible pixels.

| Srcset entry | Dimensions | When selected (sizes=`(max-width: 768px) 100vw, 50vw`) |
|---|---|---|
| 640×360 | 16:9 crop | 1× DPR mobile / small viewport |
| 960×540 | 16:9 crop | 2× DPR mobile (375px viewport) |
| 1200×675 | 16:9 crop | Lighthouse mobile 2.625× DPR (412px) |
| 1600×900 | 16:9 crop | High-DPR or desktop large |

### Cloudinary CDN Preconnect

`<link rel="preconnect" href="https://res.cloudinary.com">` is emitted in the root layout's
explicit `<head>` element (`src/app/layout.tsx`). This eliminates DNS + TCP + TLS connection
overhead before the first Cloudinary image request, most critically the gallery LCP candidate
on listing detail pages.

The preconnect is placed in the explicit `<head>` (not via React 19's `preconnect()` API or
JSX `<link>` hoisting) because in Next.js App Router, React 19 resource hints from Server
Components are serialized as RSC payload data — processed after hydration — not as raw HTML
`<link>` tags. Only the root layout's `<head>` element reliably injects into the HTML `<head>`.

### Server-Side LCP Image Preload

The listing detail page (`src/app/[locale]/listings/[slug]/page.tsx`) calls React 19's
`preload()` from `react-dom` during SSR to register the gallery cover image as a preload hint.
This is complementary to the preconnect: the preconnect establishes the Cloudinary TCP/TLS
connection, and the preload registers the specific image URL.

### Gallery Hero — RSC First Frame (updated 2026-05-07)

**Previous approach:** `ListingGallery` (`'use client'`) was SSR'd but hydrated as part of
the initial React tree. The cover image was in the SSR HTML but Chrome deferred its paint
until after the main-thread hydration sweep (~888ms at 4× CPU throttle).

**Current approach:** `GalleryStaticFrame` (Server Component, zero JS) renders the cover
image as a plain `<img>` with `fetchPriority="high"` and the full Cloudinary srcSet. Chrome
composites this image on the GPU thread **before** `ListingGallery` hydrates. The interactive
gallery (`GalleryIsland` → `ListingGallery`) loads lazily (`ssr: false`) and swaps in after
LCP has been measured.

### Gallery Hero Opacity Strategy

Priority images (`priority=true`) in `AppImage` start as `opacity-100` from the initial SSR
HTML. The `GalleryStaticFrame` cover `<img>` also has no opacity constraint — it is always
visible from DOM parse. Chrome includes images with opacity > 0 in LCP candidate evaluation
immediately from DOM render, without waiting for JavaScript to set a `loaded` state.

### Lighthouse Mobile LCP vs Real-World CWV

Lighthouse "Slow 4G" mobile (default) applies 150ms RTT simulation + 1.638 Mbps throughput
+ 4× CPU slowdown. Pre-pass lab LCP for `/[locale]/listings/[slug]` was 5329–5787ms (POOR).

**Root cause (confirmed):** The 4× CPU throttle causes React fiber hydration work
(827 individual tasks, 222ms total at native speed → ~888ms at 4× throttle) to block the
main thread. Chrome defers compositing the LCP image while the main thread is busy.

**Post-pass approach (hydration budget):**
- `GalleryStaticFrame` (RSC) → cover image in HTML, Chrome can composite before hydration
- `ListingGallery` → lazy `ssr: false` → hydration fully deferred
- `SimilarListings` → RSC + Suspense → 4× `ListingCard` hydrations deferred below fold
- `RelativeTime` → inlined server-side → one fewer client component above fold
- `LazyListingContact` → ssr:true dynamic → separate chunk, deferred hydration

**Desktop unthrottled lab LCP** (confirmed 2026-05-07): 746–1073ms across all 4 locales —
well within the 2500ms "good" budget. Post-pass desktop must not regress past 1100ms.

---

## Listing Detail Hydration Budget

**Route:** `/[locale]/listings/[slug]` — 4 locales (sq, en, uk, it)

### Above-fold inventory rule

Every component on the critical path from layout root to the gallery hero `<img>` must be
a Server Component **or** justified as a necessary client island. New `'use client'`
directives on this path require an inventory entry and a justification.

### Server/Client boundary (as of this pass)

| Component | Type | Above fold? | Justification |
|-----------|------|-------------|---------------|
| `LocaleLayout` | RSC | — | Resolves auth session, provides messages |
| `NextIntlClientProvider` | Client (provider) | wraps all | Required for `useTranslations` in client islands |
| `AuthProvider` | Client (provider) | wraps all | Auth state for FavoriteButton, Header |
| `Header` | Client | yes | useLocale, useRouter, interactive menu |
| `GalleryStaticFrame` | **RSC** | **yes (LCP)** | Plain `<img>` — no JS, paints before hydration |
| `GalleryIsland` → `ListingGallery` | Client (lazy, ssr:false) | after hydration | Lightbox, keyboard nav, swipe |
| `ListingBackButton` | Client | yes | sessionStorage restore, scroll-to-top |
| `FavoriteButton` | Client | yes | toggleFavorite server action, optimistic UI |
| Date string (inline) | **RSC** (static string) | **yes** | Was `RelativeTime` ('use client'); now formatted server-side |
| `ListingFeatureIcon` | RSC | yes | Pure icon → text mapping |
| `MapWrapper` | Client (ssr:false) | no | Leaflet requires DOM |
| `LazyListingContact` | Client (ssr:true) | no on mobile | Phone/WhatsApp links; JS chunk lazy-loaded |
| `SimilarListings` | **RSC** | **no** | Was 'use client' + useEffect + client Supabase; now server query |
| `WebVitalsReporter` | Client | no | Leaf, no rendering |
| `PerformanceStoreInit` | Client | no | Leaf, no rendering |

### Gallery LCP delivery contract (updated)

**Phase 1 — SSR:** `GalleryStaticFrame` (Server Component) renders the cover image as a
plain `<img>` with `fetchPriority="high"`, `loading="eager"`, and the full Cloudinary srcSet.
This element is in the raw SSR HTML. Chrome discovers it immediately on HTML parse and
composites it on the GPU thread **independently of main-thread hydration work**.

**Phase 2 — client:** `GalleryIsland` wraps `ListingGallery` in `next/dynamic({ ssr: false })`.
The gallery JS chunk downloads after the main bundle. When it mounts, a single synchronous
`useEffect` removes `#gallery-static-frame` and reveals `#gallery-interactive-shell`
(Tailwind `hidden` class removed). Both DOM mutations happen in one JS task — the browser
performs one layout recalculation after both, producing **zero CLS**.

The interactive gallery (`ListingGallery`) exposes the full grid (cover + 4 thumbnails),
the "All photos" button, and the lightbox modal. Visually identical to before this pass;
only the rendering boundary changed.

### Hydration cost contributors (top 3, post-pass)

1. **Header** — unavoidable client (locale switcher, auth menu, Sheet). No above-fold RSC
   alternative without major architectural change.
2. **ListingGallery** — now deferred (ssr: false). Hydration cost fully deferred behind the
   LCP paint opportunity.
3. **AuthProvider + NextIntlClientProvider** — provider overhead; unavoidable at current
   scale. Each provider adds minimal per-tree traversal during hydration.

### SSR HTML Verification Matrix — Listing Detail (verified 2026-05-07)

Reference slug: `test-2-mokkj60o`. All checks confirmed via `curl -s` (no JS).

| Locale | `<title>` | `<h1>` | Price text | Gallery `<img>` w/ `fetchpriority="high"` | Description | Spec-rules | Spec-rules with `Save-Data: on` |
|--------|-----------|--------|-----------|------------------------------------------|-------------|------------|----------------------------------|
| sq | ✅ "Test #2 \| Lero.al" | ✅ "Test #2" | ✅ "1 249 999 ALL" | ✅ 1 img | ✅ present | ❌ (no similar listings in DB) | ❌ (would be suppressed) |
| en | ✅ same | ✅ same | ✅ present | ✅ 1 img | ✅ present | ❌ same | ❌ same |
| uk | ✅ same | ✅ same | ✅ "1 249 999 ALL" | ✅ 1 img | ✅ present | ❌ same | ❌ same |
| it | ✅ same | ✅ same | ✅ present | ✅ 1 img | ✅ present | ❌ same | ❌ same |

**Speculation rules:** Correct — `SimilarListings` returns null when no similar listings exist in the
DB for the test slug. The `<script type="speculationrules">` is only emitted when `speculationUrls.length > 0`.
The `Save-Data: on` suppression is implemented and verified.

**Streaming:** 19 `self.__next_f.push` blocks confirmed in the response. Above-fold content (gallery
`<img>`, `<h1>`, price) is in the FIRST HTML flush. SimilarListings Suspense resolves via streaming.

### First Load JS target

Turbopack (Next.js 16) does not emit per-route First Load JS in the build output. The
key reductions in this pass:
- `SimilarListings` → RSC: removes the component's client bundle (useState/useEffect/
  useTranslations + client Supabase query logic) from the listing detail page chunk.
- `LazyListingContact` → ssr:true dynamic: splits the contact card JS into a separate
  lazy chunk, reducing the synchronous main-bundle parse time.
- `GalleryIsland` → ssr:false: the interactive gallery JS does not block initial hydration;
  it downloads concurrently and mounts after the LCP candidate has painted.

### Lighthouse Mobile Measurements — Listing Detail (post-pass, 2026-05-07)

Route: `/[locale]/listings/test-2-mokkj60o` | 3 runs per locale, median reported.
Build: wrapper-fix build (gallery-wrapper-static approach, CLS = 0).

| Locale | LCP (ms) | TBT (ms) | CLS | FCP (ms) | LCP element |
|--------|----------|----------|-----|----------|-------------|
| sq | 5339 | 109 | **0.0000** | 1207 | `div.listing-gallery > div.col-span-4 > div.relative > img.absolute` |
| en | 5390 | 148 | **0.0000** | 1215 | same |
| uk | 5523 | 155 | **0.0000** | 1219 | same |
| it | 5385 | 163 | **0.0000** | 1221 | same |

**Verdict:**
- LCP: **ALL POOR** (> 4000ms) — hydration budget pass did NOT achieve the ≤ 2500ms "good" target. Residual bottleneck is main-thread JS at 4× CPU throttle. See backlog entry "Listing detail mobile LCP — residual hydration cost."
- TBT: **ALL GOOD** (≤ 200ms) — improvement confirmed. Range: 109–163ms.
- CLS: **0.0000 in all 4 locales** — fixed by `gallery-wrapper-static` approach (see §CLS fix below).
- LCP element: the GalleryStaticFrame cover `<img>` (RSC-rendered) — consistent across all locales.

### CLS Fix — Gallery Wrapper (2026-05-07)

**Bug:** CLS = 0.0127 was introduced by the hydration pass. Root cause: `GalleryStaticFrame` and
`gallery-btn-placeholder` were separate flex items under `div.flex.flex-col.gap-8`. The `gap-8`
parent applied a 32px flex gap BEFORE the placeholder (in addition to the placeholder's own `mt-3`),
creating a total height mismatch with the interactive shell after the swap.

**Fix:** Both elements are now wrapped in `<div id="gallery-wrapper-static">`, making them ONE flex
item. Before swap: wrapper (340px frame + 12px margin + 20px button placeholder = 372px) ↔ gap-8
↔ title section. After swap: shell (340px grid + 12px button margin + ~20px button = 372px) ↔ gap-8
↔ title section. Net height change = 0 → CLS = 0. Both operations happen in one synchronous JS task.

### Provider Audit — Layout Chain (verified 2026-05-07)

Full audit from `app/layout.tsx` → `app/[locale]/layout.tsx` → listing detail page.

| Provider | File | `'use client'` | Above-fold consumer? | Render-blocking? | Verdict |
|----------|------|----------------|----------------------|-----------------|---------|
| `NextIntlClientProvider` | next-intl | Yes | Yes (Header: `useTranslations`) | No (passes children immediately) | NECESSARY, clean |
| `AuthProvider` | `auth/context/AuthContext.tsx` | Yes | Yes (Header: `useUser`, `useAuth`) | No (children rendered immediately; Supabase in `useEffect`) | NECESSARY, clean |
| `ThemeProvider` | — | — | — | — | **ABSENT** — not mounted anywhere |
| `Toaster` (Sonner) | `components/ui/sonner.tsx` | — | — | — | **ABSENT** — not mounted in any layout |
| `TooltipProvider` | — | — | — | — | **ABSENT** — not used |
| `Header` | `components/layout/Header.tsx` | Yes | Yes (above fold, always visible) | No (interactive client component, renders immediately) | NECESSARY |
| `Footer` | `components/layout/Footer.tsx` | **No** (RSC) | No (below fold) | None | Clean |
| `WebVitalsReporter` | `components/shared/WebVitalsReporter.tsx` | Yes | No (renders null) | No | Clean, leaf |
| `PerformanceStoreInit` | `components/shared/PerformanceStoreInit.tsx` | Yes | No (renders null) | No | Clean, leaf |
| `PerfDevOverlay` | `components/shared/PerfDevOverlay.tsx` | Yes | No (production-stripped) | No | Dev-only |

**Verdict:** All providers are clean. `NextIntlClientProvider` and `AuthProvider` have above-fold
consumers (Header), so wrapping the full locale tree is justified. No theme, toast, or tooltip
provider on the critical path.

**`Footer` note:** Despite importing `useLocale` and `useTranslations` from `next-intl`, `Footer`
is a Server Component (no `'use client'` directive). next-intl's hooks have dual implementations:
client (via `NextIntlClientProvider`) and server (via the `i18n/request.ts` scope). Server Component
usage is valid and preferred.

### `revalidateTag('site-stats', 'default')` contract

The `getSiteStats` cache is tagged `'site-stats'`. Every mutation that affects the public
active-listing count MUST call `revalidateTag('site-stats', 'default')` immediately after
a successful write.

| Mutation | File | Triggers revalidation? |
|----------|------|------------------------|
| Listing status transition (approve/deactivate/archive) | `applyListingTransition.ts` `executeTransition` | ✅ yes |
| Admin hard-delete | `admin/actions/index.ts` `deleteListing` | ✅ yes |
| User delete from cabinet | `listings/actions/deleteListing.ts` `deleteListingAction` | ✅ yes |
| View count increment | `api/listings/[slug]/view/route.ts` | ❌ no (read, not a listing-count change) |
| Favorite / unfavorite | `listings/actions/toggleFavorite.ts` | ❌ no |
| Listing create (status: pending) | `listings/actions/createListing.ts` | ❌ no (pending ≠ active) |
| Contact form submission | — | ❌ no |

`revalidatePath('/')` is NEVER called for this purpose — it invalidates the entire homepage
cache segment instead of just the stats fragment.

---

## Homepage Rendering Strategy

`/[locale]` (homepage) is intentionally **server-rendered per request (SSR)** because it
displays auth-aware content via `resolveSession()` in the locale layout.

The `getSiteStats()` query (active listing count + city count) is the only Supabase call
in the homepage page component. It is wrapped in `unstable_cache(fn, ['site-stats'], { revalidate: 3600, tags: ['site-stats'] })`:

- **First request after deploy/restart**: Supabase query executes (~200–400ms overhead).
- **Subsequent requests within 1 hour**: served from the Next.js data cache (~0ms overhead).
- **After 1 hour**: background revalidation on next request — no user-facing latency spike.

The stats data (listing count + city count) changes slowly and does not need per-request
freshness. 1-hour cache TTL is appropriate.

**Cold-start LCP (all locales, desktop, unthrottled):**
- First request (cold, stats cache empty): ~685ms
- Warm requests (stats cache filled): ~86–104ms

Both pass the ≤2500ms "good" budget. The first-request penalty is inherent to SSR with
remote database queries and is a one-time cost per deploy per locale, not per user.

