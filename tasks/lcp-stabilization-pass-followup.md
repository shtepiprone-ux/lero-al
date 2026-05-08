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

Task: Validation-only follow-up for the LCP Stabilization Pass — close the verification gaps left open by the previous pass.

IMPORTANT — LOCALE SCOPE:
The project ships 4 supported locales: `sq`, `en`, `uk`, `it`. All checks, reproductions, and validation steps in this task MUST be executed against EVERY one of those 4 locales for both affected route patterns (`/[locale]` and `/[locale]/listings/[slug]`). No locale may be skipped. Any code-level changes (only those required to close the gaps below) must live in shared route-pattern / component / reporter code — not in per-locale branches and not with hardcoded `/uk` / `/sq` / `/en` / `/it` paths.

Context:
The previous LCP Stabilization Pass landed reporter-side validity gates, dev/prod log policy split, dedupe, locale-stripped route normalization, and observer hardening. Browser console is now clean of impossible-value warnings.

However, the post-pass report contains 5 unverified or potentially under-specified items that prevent the task from being formally closed:

  (a) Production-build LCP measurement was DECLARED ("should be < 500 ms", "Already correct") but not actually MEASURED.
  (b) The 21 148 ms dev-mode LCP on `/[locale]` was attributed to "H1 cannot paint until JS hydration completes" — this would only be true if the homepage hero is client-rendered, which would itself be a regression worth confirming or refuting.
  (c) The dedupe key for `[Perf Regression]` warnings is documented as `emittedWarnings` Set but the key composition was not shown — it must include a navigation identifier so a second real regression on the same route in the same session is not silently swallowed.
  (d) The collector now exposes `wasHiddenDuringCollection` on `WebVitalMetric`, but the report did not confirm whether the reporter DROPS samples flagged hidden, or merely tags them.
  (e) `dispatchDroppedEvent()` exists, but it was not confirmed that downstream analytics aggregation does NOT count dropped samples toward POOR-rate metrics. Otherwise the noise was simply moved from console to dashboard.

This task is verification + minimal corrective fixes only. No new features, no new subsystems, no architectural change.

Requirements:
- DO NOT add new performance subsystems
- DO NOT add new metrics, new budgets, new dispatch channels
- DO NOT change the WebVitalMetric public field shape (only confirm or correct existing wiring)
- DO NOT redesign the reporter or collector
- DO NOT change image components, predictive preload, image guard, or Cloudinary delivery
- ONLY: measure, confirm, and apply the smallest possible corrective fix where a gap is found
- Preserve every guarantee already preserved by the previous pass (budgets, analytics event name `shtepi:vitals`, CLS=0, no hydration mismatch, Cloudinary-first delivery, all 4 locales handled identically by the locale-stripped route key)

--------------------------------------------------
1. Production-build LCP measurement — actually measure it
--------------------------------------------------

Required steps:
- Run `next build` then `next start` (or the project's equivalent prod-mode command).
- For each of the 4 locales (`sq`, `en`, `uk`, `it`) and for both route patterns (`/[locale]` homepage and `/[locale]/listings/[slug]` detail), record:
  - LCP value (ms)
  - LCP element (CSS selector + tag) as identified by the browser's Performance panel
  - Network profile used (must be a normal profile — no throttling, no cold cache simulation; and additionally one run on Lighthouse default mobile throttling for reference)
- For listing detail, use a real listing slug that the project considers representative (not only `test-2-mokkj60o`); pick one with a real photo gallery.

Acceptance:
- LCP must be in the "good" budget (≤ 2 500 ms) on a normal desktop network profile in EVERY one of the 8 (4 locales × 2 routes) measurements.
- Lighthouse mobile-throttled run is reported for reference, but is not a pass/fail gate in this task.
- If any of the 8 measurements fails the "good" budget, identify the LCP element and the cause, and apply ONLY the minimal route-pattern-level fix needed (priority/sizes/Cloudinary settings, or removing a render-blocking factor on that page). Do NOT introduce a new component or pipeline.

Deliverable:
- An 8-row table in the final report: locale × route → LCP value, LCP element, pass/fail.

--------------------------------------------------
2. Confirm or refute the "H1 not paintable before hydration" hypothesis on `/[locale]`
--------------------------------------------------

Required steps:
- Run the project in production mode (`next build && next start`).
- For each of the 4 locales, fetch the raw SSR HTML response with curl (or equivalent) without executing JS:
  - `curl -s -H 'Accept-Language: <locale>' http://localhost:<port>/<locale> > /tmp/home-<locale>.html`
- Verify the homepage `<h1>` is present in the raw HTML response body for every locale.
- Walk the React tree from the homepage page component up through the layout chain. For every component on the path that wraps or contains the H1, record whether it is `'use client'` or a server component.

Decision tree:
- If the H1 IS present in raw SSR HTML in every locale AND no client provider blocks initial child render → the original "H1 cannot paint until hydration" explanation is wrong. Update `docs/performance.md` to replace it with the correct explanation: in dev mode, Turbopack cold-compile delays TTFB, which delays first paint, which inflates the LCP timestamp because it is measured from `navigationStart`. No code change required — but the docs must reflect reality.
- If the H1 is NOT present in raw SSR HTML, OR a client provider blocks initial render → this is a real CSR regression on the homepage. Document it precisely (which component made the homepage CSR-only, which provider blocks paint, in which file). Do NOT fix it in this task — file a separate backlog item in `docs/backlog.md` titled "Homepage CSR regression — restore SSR for above-fold hero" with the exact root cause and the affected files.

Deliverable:
- The decision (SSR-correct vs CSR-regression) with concrete evidence (raw HTML excerpt around the `<h1>`, and the server/client classification of every component on the path from page → H1).

--------------------------------------------------
3. Confirm dedupe key composition in the reporter
--------------------------------------------------

Required steps:
- Open `src/lib/performance/reporter.ts` and locate the `emittedWarnings` Set and the place where keys are composed.
- The key MUST include all three of: `metric name`, `locale-stripped route`, AND a stable navigation identifier that changes on every hard navigation (acceptable identifiers: `performance.timeOrigin`, `crypto.randomUUID()` generated once per page load and stored in module state, or the `navigationId` already attached to the metric envelope if one exists).
- If the current key omits the navigation identifier, ADD it. This is the only code change permitted in this section.
- Add a single small inline comment next to the key composition explaining why navigation-id is required (so a future second real regression on the same route is not silently swallowed).

Reproduction test:
- In a dev session, hard-reload the same route twice in a row while artificially producing a poor LCP value (any reasonable trick — e.g. throttling CPU). Confirm: TWO `[Perf Regression]` warnings appear, one per hard navigation. Before the fix (or if the fix is not needed because the key already included nav-id), only ONE would appear.

Deliverable:
- Exact key-composition snippet (before / after if changed; "already correct" with the snippet if no change was needed).
- Reproduction outcome: 2 warnings observed across 2 hard reloads.

--------------------------------------------------
4. Confirm hidden-tab samples are DROPPED, not merely tagged
--------------------------------------------------

Required steps:
- Open `src/lib/performance/reporter.ts` and locate the `shouldReport()` gate (or whatever function consumes `wasHiddenDuringCollection`).
- Confirm: when `metric.wasHiddenDuringCollection === true`, the metric is DROPPED from the budget-classification path AND a `dispatchDroppedEvent()` is sent with `reason: 'hidden-during-collection'`. It must NOT reach the `[Perf Regression]` warning path under any circumstances.
- If the current code merely tags the metric but still classifies it against the budget, ADD the gate. This is the only code change permitted in this section.

Reproduction test:
- In a dev session, open a homepage tab, immediately switch to another tab BEFORE the page finishes painting, leave it backgrounded for 2 minutes, return.
- Expected console output:
  - exactly one `console.debug [perf-reporter] dropped invalid sample reason=hidden-during-collection`
  - zero `[Perf Regression]` lines
  - one `dispatchDroppedEvent()` payload with the matching reason

Deliverable:
- Exact `shouldReport()` snippet covering the hidden case.
- Reproduction outcome (console excerpt).

--------------------------------------------------
5. Confirm analytics aggregation does not count dropped samples as POOR
--------------------------------------------------

Required steps:
- Locate every consumer of `dispatchDroppedEvent()` and every consumer of `dispatchVitalsEvent()` (search the codebase end-to-end for both function names AND for the analytics event name `shtepi:vitals` if dropped events share the same envelope).
- For each consumer, confirm: dropped events are routed to a SEPARATE counter / dimension and are NOT included in any "POOR rate" or "p75 LCP" aggregation. They may be visible in dashboards, but only under a dedicated `dropped` dimension, never folded into the regression rate.
- If any consumer folds dropped samples into the regression-rate calculation, document it precisely and fix at that consumer (smallest possible change). If the consumer is an external sink that cannot be edited from this codebase, document it in `docs/performance.md` under a new subsection "Dropped-sample dashboard contract" so the dashboard owner can correct it.

Deliverable:
- List of every consumer of `dispatchDroppedEvent` / `dispatchVitalsEvent` (file path + function name).
- For each consumer: pass/fail on dropped-sample isolation.
- For any failure: the corrective change applied (or, if external, the docs entry filed).

--------------------------------------------------
6. Documentation updates
--------------------------------------------------

Update `docs/performance.md`:
- If section 2 produced a corrected dev-mode LCP explanation (Turbopack TTFB inflation), replace the old hydration-blocked phrasing with the correct one.
- Document the dedupe-key composition rule (must include navigation-id) in the existing reporter contract section.
- Document the hidden-tab DROP gate (not "tagged") in the validity-gates table.
- If section 5 produced a "Dropped-sample dashboard contract" subsection, include it.

Update `docs/backlog.md`:
- Add a closed entry "LCP Stabilization Pass — verification follow-up" summarizing the 5 gap closures.
- If section 2 surfaced a real CSR regression on the homepage, add an OPEN entry "Homepage CSR regression — restore SSR for above-fold hero" with the cause and affected files.

--------------------------------------------------
7. Validation checklist
--------------------------------------------------

After implementation verify:

Production-build measurements:
- 8 measurements taken (4 locales × 2 route patterns)
- Every measurement in "good" budget on normal desktop profile
- LCP element identified for each route pattern, identical across locales
- Lighthouse mobile reference numbers attached for context

Homepage hydration claim:
- Decision (SSR-correct vs CSR-regression) made with concrete raw-HTML evidence per locale
- If CSR-regression: backlog entry filed, NOT fixed in this task
- If SSR-correct: docs corrected to attribute the dev-mode 21 s value to Turbopack TTFB inflation

Dedupe key:
- Key includes (metric, locale-stripped route, navigation-id)
- Two hard reloads with poor LCP produce TWO warnings, not one
- Inline comment present

Hidden-tab gate:
- Hidden samples DROPPED from budget classification (not merely tagged)
- Reproduction: backgrounded tab produces zero `[Perf Regression]` warnings, one `console.debug` drop, one `dispatchDroppedEvent` with `hidden-during-collection`

Analytics aggregation:
- Every consumer of `dispatchDroppedEvent` / `dispatchVitalsEvent` audited
- No consumer folds dropped samples into POOR-rate or p75 calculations
- Any external-sink gap documented under "Dropped-sample dashboard contract" in `docs/performance.md`

Locale parity:
- Every check above performed against ALL 4 locales (`sq`, `en`, `uk`, `it`)
- No code change introduces a per-locale branch or hardcoded locale prefix

Preserved guarantees (still hold):
- Budgets unchanged (good ≤ 2500 ms, poor > 4000 ms)
- Analytics event name `shtepi:vitals` unchanged
- WebVitalMetric public field shape unchanged (additive fields from the previous pass remain, no new ones in this pass unless absolutely required)
- Zero CLS, no hydration mismatch
- Cloudinary-first image delivery untouched
- Predictive preload / imageGuard untouched
- Locale-stripped route normalization continues to apply uniformly

Final report (in PR description) must include:
- The 8-row production-LCP measurement table
- The SSR-vs-CSR decision for the homepage hero with raw-HTML evidence
- The exact dedupe-key composition snippet (before/after or "already correct")
- The exact hidden-tab gate snippet (before/after or "already correct")
- The audit table of dropped-event consumers and their pass/fail
- Files modified (expected to be small; this is a validation-led pass)
- Confirmation that all "Preserved guarantees" still hold
- Any new backlog entries filed
