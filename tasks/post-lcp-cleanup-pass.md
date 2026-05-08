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

Task: Post-LCP cleanup pass — close 4 follow-on items surfaced by the LCP Stabilization verification report. Targeted, small-scope fixes only.

IMPORTANT — LOCALE SCOPE:
Project ships 4 locales: `sq`, `en`, `uk`, `it`. Every measurement, audit, and validation step in this task MUST be executed against ALL 4 locales for the affected route patterns. No code change in this task may introduce a per-locale branch or hardcode a locale prefix.

Context:
The LCP Stabilization verification follow-up landed cleanly, but the post-pass review surfaced 4 distinct items that the verification task could not legitimately absorb (some are scope-adjacent, some are real regressions hidden by the desktop-only pass/fail gate). They are grouped here because they all stem from that pass and should be closed together before moving on.

The 4 items:
  (a) Mobile-throttled LCP on listing detail measured 5343–5543 ms across all 4 locales — that is a real Google CWV POOR value (> 4000 ms). Desktop is fine; mobile is not.
  (b) `src/lib/performance/store.ts` now uses an allow-list guard `name === 'LCP' | 'CLS' | 'INP'`. If the collector ever dispatches FCP or TTFB as `shtepi:vitals` events, those metrics are now silently dropped at the store. The original Stabilization Pass requirements explicitly listed FCP and TTFB as preserved signals.
  (c) The verification pass made Zod v4 compat fixes in `src/components/admin/AdminUserCreate.tsx` and `src/components/admin/AdminUserProfile.tsx` as `next build` unblockers. This is a partial Zod v4 migration. Other Zod call sites in the codebase may be in an incompatible state and need a single audit pass to confirm or fix.
  (d) First-run desktop LCP on `/sq` (538 ms) was ~3× higher than the other 3 locales (166–191 ms). Attributed in the verification report to "server-side cache warming". If `/[locale]` hits Supabase on every request without caching/ISR/SSG, the first unique visitor per locale per deploy pays a real penalty.

Requirements:
- DO NOT add new performance subsystems
- DO NOT add new metrics, new budgets, new dispatch channels
- DO NOT redesign the reporter, collector, or store
- DO NOT change image components, predictive preload, image guard, or Cloudinary delivery contracts
- DO NOT migrate Zod globally beyond what is required to bring already-broken call sites back to a working state — this task is a CONFIRMATION audit, not a refactor
- DO NOT change route caching strategies blindly — measure first, then apply minimal change matching `docs/data-access-rules.md`
- ONLY: measure, confirm, and apply the smallest possible corrective fix per item below
- Preserve every guarantee already preserved by the previous two passes (budgets unchanged, analytics event name `shtepi:vitals` unchanged, WebVitalMetric public field shape unchanged, zero CLS, no hydration mismatch, Cloudinary-first delivery, locale-stripped route normalization)

--------------------------------------------------
1. Listing detail mobile LCP — bring under 2500 ms on Lighthouse mobile profile
--------------------------------------------------

Current state:
- Desktop unthrottled: 361–805 ms (PASS)
- Lighthouse mobile (default throttling, Slow 4G, 4× CPU): 5343–5543 ms (POOR by Google CWV — > 4000 ms)
- LCP element: gallery `<img>` with `priority` / `fetchPriority="high"` / `loading="eager"` already set

The hero photo is correctly marked priority, so the regression is NOT a missing-priority issue. Investigate the most likely real causes in this order, fix only what is confirmed:

Investigation checklist (record finding for each, not all need fixing):
- Cloudinary delivery params for the LCP candidate at mobile viewport widths: confirm `f_auto`, `q_auto` (or `q_auto:eco` for above-fold mobile), and that the rendered width matches a srcset breakpoint — not a 2× oversized variant.
- `sizes` attribute on the gallery hero `<img>`: must reflect actual mobile viewport width (e.g. `100vw` on mobile, narrower at higher breakpoints). An incorrect `sizes` attribute causes the browser to download a desktop-sized variant on mobile.
- Origin-level `<link rel="preconnect">` to the Cloudinary delivery domain in the document `<head>` (App Router: `app/[locale]/layout.tsx` or a metadata export). Missing preconnect adds 1 RTT on the LCP candidate fetch.
- `<link rel="preload" as="image" imagesrcset=... imagesizes=...>` for the listing's primary photo, emitted from the listing detail page's metadata or a server-injected `<head>` fragment. With App Router this is done via `generateMetadata` or by rendering a `<link>` in the page's server component head. Verify: is it present? If yes, does it match the actual chosen srcset variant?
- Render-blocking JS before the gallery: confirm no large client component above the gallery wraps it in a Suspense boundary that defers the image fetch on mobile CPU.
- Critical CSS for the gallery container: confirm aspect-ratio / fixed dimensions are set so the browser can begin the image fetch from the SSR HTML, not after a layout pass.

Fix policy:
- Apply the smallest possible change that brings mobile Lighthouse LCP for `/[locale]/listings/[slug]` under 2500 ms in ALL 4 locales.
- Do NOT introduce new image components.
- Do NOT change the AppImage public API.
- Do NOT add a new preload subsystem — if a `<link rel="preload">` is required, emit it via the existing Next.js metadata / head mechanism.

Validation:
- Re-run Lighthouse mobile (default throttling) for `/[locale]/listings/<representative-slug>` for ALL 4 locales.
- Record before/after LCP for each locale in the final report.

--------------------------------------------------
2. Confirm FCP and TTFB are not silently dropped by the store
--------------------------------------------------

Required steps:
- Open `src/lib/performance/collector.ts` and identify EVERY metric name that may be passed to `dispatchVitalsEvent` (search for the dispatcher call sites). Record the full list.
- Open `src/lib/performance/store.ts` `handleVitalsEvent` and confirm the current guard:
  `if (payload?.name !== 'LCP' && payload?.name !== 'CLS' && payload?.name !== 'INP') return`
- Cross-reference: is FCP dispatched? Is TTFB dispatched? Are any other Web Vitals or sub-metric names dispatched (e.g. LCP-dropped, CLS-dropped, INP-dropped, soft-nav variants)?

Decision matrix:
- If FCP and TTFB are NEVER dispatched by the collector → the current allow-list is fine. Document this in `docs/performance.md` so the constraint is explicit ("store handles LCP/CLS/INP only; FCP/TTFB are collected for analytics-only and bypass the store").
- If FCP or TTFB ARE dispatched and the store is supposed to surface them (check `docs/performance.md` and existing UI/dashboards for any consumer reading FCP/TTFB from the store) → CONVERT the allow-list to a deny-list of known noise events:
  ```
  // Drop dropped-envelopes and adjacent perf signals that are not WebVitalMetric-shaped.
  const NON_VITAL_NAMES = new Set([
    'LCP-dropped', 'CLS-dropped', 'INP-dropped',
    'predictive-preload', 'image-guard-trigger',
    'preload-suppressed', 'pressure-state-change',
  ])
  if (!payload?.name || NON_VITAL_NAMES.has(payload.name)) return
  ```
  This is more robust to future metric additions.
- If FCP or TTFB ARE dispatched but the store has no consumer for them → keep the allow-list AND add FCP/TTFB to it explicitly so the contract is self-documenting, even if no UI renders them today.

Constraints:
- No new metric collection, no new dispatch channel.
- The fix is at most a few lines in `store.ts` plus a docs note.

Validation:
- For each metric in the collector's dispatch set, manually trigger or simulate it in dev and confirm: store either processes it correctly OR drops it intentionally with a documented reason. No metric is silently lost without a documented reason.

--------------------------------------------------
3. Zod v4 migration audit — confirm or fix remaining call sites
--------------------------------------------------

Context:
The verification pass touched two admin components for Zod v4 compat. The rest of the codebase has not been confirmed against the new Zod major.

Required steps:
- Read `package.json` and confirm the installed Zod major version.
- Run a codebase-wide grep / ripgrep for Zod usage:
  - `import .* from ['"]zod['"]`
  - `z\.` call sites
  - `.parse(`, `.safeParse(`, `.parseAsync(`, `.refine(`, `.superRefine(`, `.transform(`, `.preprocess(`, `.brand(`, `.pipe(`
  - `z.coerce.`, `z.discriminatedUnion(`, `z.record(`, `z.intersection(`, `z.union(`, `z.lazy(`
- For every call site, confirm it is compatible with the installed Zod version. Specifically check known v3→v4 breaking patterns:
  - `z.string({ required_error, invalid_type_error })` → new error params API
  - `z.record(valueSchema)` → must now be `z.record(keySchema, valueSchema)`
  - `.refine(fn, message)` shorthand — confirm signature still works or needs `{ message }`
  - `ZodError.errors` vs `ZodError.issues`
  - `.parse()` thrown error shape if any code consumes it directly
  - `z.preprocess` argument order
- Run `pnpm typecheck` (or project's equivalent) and `next build` after the audit. Both must pass clean.

Fix policy:
- Apply the minimum mechanical fix per call site to restore compatibility.
- Do NOT refactor schemas, do NOT consolidate, do NOT introduce new validation patterns.
- If a call site is so broken that a real schema rewrite is required, STOP and add an OPEN backlog entry with the file path and the specific Zod feature involved — do NOT silently rewrite.

Deliverable:
- A table of all Zod call sites: `file path | function/area | v4-compatible? (Y/N) | fix applied (if any)`.

Validation:
- `pnpm typecheck` clean.
- `next build` clean.
- Every form / validation flow that uses the modified schemas is manually exercised once in dev (sign-up, listing create/edit, admin user create, admin user profile, search filters, anywhere else found by the audit). Record outcome.

--------------------------------------------------
4. Homepage `/[locale]` first-run latency — measure and decide
--------------------------------------------------

Observation:
First-run desktop LCP `/sq` = 538 ms vs subsequent runs and other locales 166–191 ms. Verification report attributed this to "server-side cache warming" but did not investigate.

Required steps:
- Open the homepage server component(s) and identify EVERY data fetch that runs on each request (Supabase queries, API calls, getTranslations, etc.).
- For each fetch, classify:
  - Cache strategy: `force-cache`, `no-store`, `revalidate: <n>`, `unstable_cache`, untagged
  - Locale-keyed: yes / no
  - Per-request cost in ms (measure once with `console.time` in dev or via the network panel)
- Confirm whether the page is statically generated (SSG), incrementally regenerated (ISR), or fully SSR per request.

Decision matrix:
- If the page is intentionally SSR per request and data is locale-keyed and small → 538 ms first-run is acceptable cold-start cost; no change needed. Document the decision in `docs/performance.md` under a new subsection "Homepage rendering strategy" so it is not re-investigated later.
- If the page CAN be ISR/SSG-eligible per `docs/data-access-rules.md` rules → apply the minimal Next.js caching primitive that fits the rules (e.g. `export const revalidate = N`, or `unstable_cache` around the locale-keyed fetch). Do NOT change the data layer; only the cache annotation.
- If a fetch is hitting Supabase per request without a cache annotation AND `docs/data-access-rules.md` mandates caching for that pattern → fix at the call site, not at the page level.

Constraints:
- No global cache strategy changes.
- No new caching subsystem.
- Changes confined to the homepage page component(s) and the specific fetch call sites identified.

Validation:
- Re-run the production build measurement: 4 desktop runs against `/sq`, `/en`, `/uk`, `/it`, EACH preceded by a server cold-start (restart `next start` between runs OR use a fresh process per locale).
- Record before/after first-run LCP per locale.
- Acceptance: first-run LCP per locale within 2× of the warm-run LCP, AND under the "good" budget (≤ 2500 ms) on a normal desktop profile.

--------------------------------------------------
5. Documentation updates
--------------------------------------------------

Update `docs/performance.md`:
- Add finding from §1: confirmed mobile LCP optimization on listing detail (root cause + fix).
- Add finding from §2: store metric handling contract (allow-list vs deny-list decision, and which metrics are intentionally bypassed).
- Add finding from §4: homepage rendering strategy decision (SSR-per-request vs ISR/SSG, with the rationale).

Update `docs/backlog.md`:
- Add a closed entry "Post-LCP cleanup pass" summarizing the 4 closures.
- If §3 surfaced any Zod call site that needs a real schema rewrite, add an OPEN entry per such site.

--------------------------------------------------
6. Validation checklist
--------------------------------------------------

After implementation verify:

§1 Mobile listing detail:
- Lighthouse mobile LCP < 2500 ms for `/[locale]/listings/<representative-slug>` in ALL 4 locales
- LCP element unchanged (still the gallery hero `<img>`)
- No new image component introduced, no AppImage API change

§2 Store metric handling:
- Every metric name dispatched by the collector is either processed by the store OR documented as intentionally bypassed
- FCP and TTFB are not silently lost if they are dispatched
- `shtepi:vitals` event name unchanged

§3 Zod audit:
- `pnpm typecheck` clean
- `next build` clean
- Every modified form / validation flow exercised once in dev with no runtime error
- No silent schema rewrites — anything requiring a rewrite is in `docs/backlog.md` instead

§4 Homepage cold-start:
- 4 cold-start measurements taken (one per locale)
- First-run LCP within 2× of warm-run AND under "good" budget for every locale
- Caching strategy decision documented in `docs/performance.md`

Locale parity:
- Every check above performed against ALL 4 locales (`sq`, `en`, `uk`, `it`)
- No code change introduces a per-locale branch or hardcoded locale prefix

Preserved guarantees (still hold):
- Budgets unchanged (good ≤ 2500 ms, poor > 4000 ms)
- Analytics event name `shtepi:vitals` unchanged
- WebVitalMetric public field shape unchanged
- Zero CLS, no hydration mismatch
- Cloudinary-first image delivery untouched (delivery params may be tuned, contract unchanged)
- Predictive preload / imageGuard untouched
- Locale-stripped route normalization continues to apply uniformly

Final report (in PR description) must include:
- §1 before/after Lighthouse mobile LCP table (4 locales) with the exact change applied
- §2 collector → store metric matrix and the allow-list/deny-list decision
- §3 full Zod call-site audit table with fix outcomes
- §4 homepage cold-start before/after table (4 locales) with the caching decision and rationale
- Files modified
- Confirmation that all "Preserved guarantees" still hold
- Any new backlog entries filed
