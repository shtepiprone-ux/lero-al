Before starting this task, Claude Code MUST read and follow these docs:
- /docs/ai-behavior.md
- /docs/analytics-rules.md
- /docs/architecture.md
- /docs/backlog.md
- /docs/component-rules.md
- /docs/data-access-rules.md
- /docs/dependencies.md
- /docs/domain-rules.md
- /docs/env.md
- /docs/integrations.md
- /docs/performance.md
- /docs/qa-rules.md
- /docs/rls-rules.md
- /docs/ui-rules.md

Task: LCP regression investigation + stabilization pass for the performance reporter and the affected route patterns — homepage `/[locale]` and listing detail `/[locale]/listings/[slug]` — across ALL supported locales.

IMPORTANT — LOCALE SCOPE:
The console examples below show `/uk` and `/uk/listings/...` because those were the routes navigated during the capture. The actual route patterns are locale-prefixed (`/[locale]` and `/[locale]/listings/[slug]`) and the project ships at minimum `uk` and `sq` locales (both visible in dev logs). All fixes in this task — reporter validity gates, dev/prod log policy, LCP-element priority/sizes/Cloudinary settings, view-event dedupe, hardening — MUST be applied at the route-pattern / component level, NOT specialized to a single locale. Validation must explicitly cover every supported locale. No locale-specific branches, no hardcoded `/uk` or `/sq` paths anywhere in the implementation. Route normalization / classification inside the reporter must operate on the locale-stripped path so that aggregation, dedupe, and one-warning-per-(metric, route, navigation-id) logic are not fragmented per locale.

Context:
The Core Web Vitals reporter (`src/lib/performance/reporter.ts`) is currently producing catastrophic, clearly-invalid LCP values that do NOT reflect real user-visible paints. Examples observed in browser console (locale prefix is incidental — same behavior is expected for any locale):

  [browser] [Perf Regression] LCP POOR (21148ms) on "/uk".
            Budget: good ≤ 2500ms, poor > 4000ms. Device: desktop
            (src/lib/performance/reporter.ts:48:15)

  [browser] [Perf Regression] LCP POOR (406840ms) on "/uk/listings/test-2-mokkj60o".
            Budget: good ≤ 2500ms, poor > 4000ms. Device: desktop
            (src/lib/performance/reporter.ts:48:15)

A 406-second LCP is physically impossible as a real user-visible paint. The 21s value on `/uk` is also implausible for a real user but is plausible as a Turbopack cold-compile artefact in dev. Both indicate the reporter is accepting and dispatching samples taken under conditions where the LCP metric is, by definition, meaningless (backgrounded tab, SPA soft navigation, restored bfcache, late-fired observer after long idle, dev-mode cold compile).

The goal of this task is NOT to add new performance systems. The goal is:
(a) Reporter-side correctness — discard / ignore samples captured under invalid conditions and add proper sample tagging/gating so dev cold-starts don't masquerade as production regressions.
(b) Page-side validation — confirm whether `/uk` and `/uk/listings/[slug]` have any REAL LCP regression after reporter is fixed; fix only verified real regressions; do not refactor the pipeline.
(c) Logging discipline — `[Perf Regression]` console output must signal actionable problems, not noise.

Requirements:
- DO NOT redesign the performance reporter architecture
- DO NOT remove the LCP budget logic
- DO NOT silence the reporter globally — only filter invalid samples
- DO NOT introduce new performance subsystems, new preload layers, or new adaptation tiers
- DO NOT change CLS / INP / FCP / TTFB collection contracts
- DO NOT change the analytics dispatch contract documented in docs/performance.md
- ONLY stabilize the reporter, filter invalid samples, fix verified real LCP regressions, and reduce console noise
- Preserve:
  - existing budget thresholds (good ≤ 2500ms, poor > 4000ms)
  - DEV vs PROD reporting parity (both still emit, just correctly tagged)
  - zero CLS guarantee
  - no hydration mismatch
  - Cloudinary-first image delivery
  - all existing image-pipeline / predictive-preload guarantees
  - existing analytics event names and shape

--------------------------------------------------
1. Reporter — sample validity gates
--------------------------------------------------

Current issue:
`reporter.ts:48` emits `[Perf Regression] LCP POOR ...` for samples that are not legitimate user-visible LCP events.

Required behavior:
A measurement must be DROPPED (not dispatched, not warned) when ANY of the following is true at the moment LCP would be finalized:

- `document.visibilityState !== 'visible'` for the entire measurement window
- Page was hidden at any point between `navigationStart` and the LCP entry timestamp
- Sample originates from a soft (SPA / App Router client) navigation rather than a hard navigation. LCP per spec is only defined for the initial page load.
- Sample originates from a bfcache restore (`PerformanceNavigationTiming.type === 'back_forward'`) — must be reported separately or dropped, not budget-classified as POOR
- Sample value exceeds a hard sanity ceiling (e.g. 60 000 ms). Anything above the ceiling is a clock / observer artefact and must be discarded with a single `console.debug` (not `warn`) entry tagged `[perf-reporter] dropped invalid sample`.
- Reporter is running under Next.js dev mode AND `process.env.NODE_ENV !== 'production'` AND value > poor budget — emit as `console.info` tagged `[perf-reporter] dev-only`, never as `[Perf Regression]`. Real `[Perf Regression]` warnings are reserved for prod-equivalent samples.

Implementation requirements:
- Prefer `web-vitals` library primitives if already a dependency (they handle visibility + bfcache correctly out of the box). If `web-vitals` is in use, ensure the `onLCP` callback receives entries only for the first hard navigation and the reporter consumes the `metric.navigationType` field.
- If a custom PerformanceObserver is in use, add explicit guards mirroring the rules above before calling the dispatcher.
- Introduce explicit internal constants:
  - `LCP_SANITY_CEILING_MS = 60_000`
  - `PERF_REPORT_TAG = '[perf-reporter]'`
  - `PERF_REGRESSION_TAG = '[Perf Regression]'`
- Centralize the gate in a single private function `shouldReport(metric)` so all metrics share the same validity logic where applicable.
- Add a typed envelope for dropped samples so the analytics layer can still receive a "dropped" signal if it chooses, without classifying it as POOR.

Goal:
Zero impossible-value warnings. `[Perf Regression]` line in console means a real, actionable regression on a real user-visible paint.

--------------------------------------------------
2. Reporter — DEV vs PROD reporting parity
--------------------------------------------------

Current issue:
Turbopack dev compile + slow-FS warning (`Slow filesystem detected. The benchmark took 525ms`) make every cold dev paint look like a POOR regression. This drowns out real regressions during development.

Required changes:
- In dev mode, still collect the metric (so the dev overlay continues to work), but do NOT emit `[Perf Regression]` warnings.
- Add an environment-tagged log path: `[perf-reporter] dev-only LCP=<ms> route=<path>`.
- In production, behavior is unchanged: real samples that survive the validity gate emit `[Perf Regression]` when over budget.
- Keep the analytics dispatch path active in both envs, but include an `env: 'development' | 'production'` field so downstream sinks can filter.

Goal:
Dev console stays clean of false-positive regressions. The dev overlay still surfaces dev-mode values for local inspection.

--------------------------------------------------
3. Investigate real LCP on `/[locale]` (homepage) — ALL locales
--------------------------------------------------

After the reporter is fixed, validate whether the homepage route pattern `/[locale]` still trips a real-mode LCP regression. Test against every supported locale (at minimum `uk` and `sq`). If yes, fix at the source. Do NOT refactor architecture. Fixes must be locale-agnostic — applied in the shared page / layout / component code, NOT in any per-locale branch.

Suspect surfaces to check:
- Hero / above-the-fold image: must use the AppImage component with `priority`/`fetchPriority="high"` and a correct `sizes` value. No lazy-loading on the LCP element.
- Cloudinary delivery params for the LCP candidate: appropriate `q_auto`, `f_auto`, and a correct width-set matching the rendered slot.
- Avoid render-blocking resources: confirm fonts use `font-display: swap` or `next/font` with display swap, no large blocking CSS, no synchronous third-party scripts above the fold.
- Server response: check `proxy.ts` and `application-code` timings on `/uk` for unusually slow first-byte; if `application-code` is high, profile the SSR data-loading path against `docs/data-access-rules.md` rules (no N+1, paginate, batch).
- Confirm no client-side waterfall delays the LCP candidate (e.g. hero image src derived only after a client effect).

Constraints:
- Do not introduce new image components.
- Do not change the AppImage public API.
- Apply only the minimum prop / config changes required to bring the LCP element into the priority path.

--------------------------------------------------
4. Investigate real LCP on `/[locale]/listings/[slug]` (detail page) — ALL locales
--------------------------------------------------

Same approach as section 3, focused on the listing detail page route pattern. Validate against every supported locale. All fixes must live in shared listing-detail code (page / gallery / hero image component) and behave identically regardless of locale prefix.

Suspect surfaces:
- Main listing photo / gallery first frame must be the LCP candidate, served via Cloudinary with correct sizes, marked priority, with no lazy-load.
- Confirm gallery component does not defer the first image behind a client-only mount or a Suspense boundary that delays paint.
- Confirm `POST /api/listings/[slug]/view` is NOT blocking initial paint (it must remain a fire-and-forget side-effect, ideally after `requestIdleCallback` or after LCP).
- Confirm no large layout-affecting hydration just before the gallery (CLS budget must remain at zero).

Constraints:
- Do not redesign the gallery.
- Do not change the listing data access layer.
- Apply minimal prop / ordering fixes only.

--------------------------------------------------
5. Console hygiene for `[Perf Regression]`
--------------------------------------------------

Current issue:
The `[Perf Regression]` warning is emitted from `src/lib/performance/reporter.ts:48` and currently fires for both dev cold-compile artefacts and impossible values, eroding signal value.

Required changes:
- One warning per unique (metric, route, navigation-id) tuple per page lifetime. No repeat warnings for the same paint.
- Warnings must include the navigation type (`navigate` | `reload` | `back_forward`) and `env`.
- Dropped samples log at `console.debug` level only.
- Dev-only samples log at `console.info` with a clear `[perf-reporter] dev-only` prefix.

--------------------------------------------------
6. Hardening / safety pass on the reporter
--------------------------------------------------

Stability audit, no rewrites:

- Ensure PerformanceObservers are disconnected on `pagehide` and on App Router client navigation transitions.
- Ensure no duplicate observer subscriptions across React StrictMode double-invoke in dev.
- Ensure singleton state is keyed per hard navigation, not per component mount.
- Ensure listeners on `visibilitychange`, `pagehide`, `freeze`, `resume` are added once and removed in cleanup.
- Ensure no closure captures stale route paths — read the current route at dispatch time.
- Ensure the dispatcher is null-safe and never throws into the reporter pipeline.

Requirements:
- No architectural rewrites
- No feature expansion
- Only stabilization and correctness fixes

--------------------------------------------------
7. Documentation updates
--------------------------------------------------

Update `docs/performance.md` with:
- LCP sample validity rules (visibility, bfcache, soft-navigation exclusion, sanity ceiling)
- DEV vs PROD warning policy
- `[perf-reporter]` vs `[Perf Regression]` log-tag contract
- Dropped-sample envelope shape sent to analytics
- Confirmation that no new perf subsystems were introduced

Update `docs/backlog.md` with the completed LCP stabilization pass entry, summarizing root cause and changes.

--------------------------------------------------
8. Validation checklist
--------------------------------------------------

After implementation, manually verify in a fresh dev session AND a production build:

Reporter behavior:
- No `[Perf Regression]` line for any sample > 60 000 ms (these must be dropped)
- No `[Perf Regression]` line in `next dev` for cold-compile paints (only `[perf-reporter] dev-only`)
- LCP samples captured while tab was hidden are NOT classified
- LCP samples on App Router soft navigation are NOT classified as initial-load LCP
- bfcache-restore navigations are clearly tagged, never classified as POOR
- One warning per (metric, route, navigation-id) — no duplicates
- Observers are torn down on `pagehide` and on SPA navigation

Page behavior (verify for EVERY supported locale — at minimum `uk` and `sq`):
- `/[locale]` in production build: LCP under "good" budget on a normal network profile, in every locale
- `/[locale]/listings/[slug]` in production build: LCP under "good" budget, in every locale
- LCP element is the intended hero / listing primary image, identical across locales
- Hero / primary image uses Cloudinary delivery with correct sizes and priority, identically per route pattern (no per-locale variation)
- No CLS regressions in any locale
- No hydration warnings in any locale
- `POST /api/listings/[slug]/view` does not block paint and fires exactly once per real view in any locale (consistent with the existing dedupe guarantee from the previous stabilization pass)
- Reporter aggregates by locale-stripped route key — duplicate warnings must NOT appear when the same paint problem exists across multiple locales of the same page

Final report (in PR description) must include:
- Root cause(s) of the impossible 406 840 ms sample and the 21 148 ms sample
- Exact list of validity gates added
- DEV vs PROD log-policy diff (before / after)
- Any real LCP fixes applied to `/uk` and `/uk/listings/[slug]`
- Files modified
- Confirmation that all "Preserve" guarantees from the Requirements section still hold
