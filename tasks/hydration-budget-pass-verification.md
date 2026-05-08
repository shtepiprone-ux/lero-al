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

Task: Verification-only follow-up for the Listing detail hydration budget pass. Produce the missing measurements, close the unanswered questions, and apply ONLY minimal corrective fixes if a measurement reveals a real bug.

IMPORTANT — LOCALE & ROUTE SCOPE:
Project ships 4 locales: `sq`, `en`, `uk`, `it`. Every measurement and validation step MUST be executed against ALL 4 locales for the listing detail route pattern `/[locale]/listings/[slug]`. The reference slug for ALL Lighthouse measurements and SSR curl checks is `test-2-mokkj60o` (10 real Cloudinary images). If unavailable, use the closest alternative slug with ≥ 8 photos and explicitly note which.

Context:
The Hydration Budget Pass landed architecturally correct changes (RSC gallery frame + lazy interactive island, RSC SimilarListings + Suspense, server-side date formatting, lazy ListingContact, Speculation Rules, `revalidateTag('site-stats')` wiring on the right mutations). However the final report did NOT include the headline measurements that were the entire reason the pass existed. Specifically missing:

- Lighthouse mobile LCP / TBT / INP / CLS — 4 locales × before/after
- First Load JS for `/[locale]/listings/[slug]` — before/after
- Streaming verification (DevTools Network multi-flush check)
- Raw `curl` SSR HTML on all 4 locales (above-fold content present in the initial HTML)
- Hydration warnings sanity (clean console on all 4 locales)
- The full §1 inventory table (only the top-3 contributors were surfaced)

The pass also raised four open questions:

  Q1. `revalidateTag('site-stats', 'default')` was reported with a second argument. Next.js 15's public `revalidateTag` signature is `(tag: string) => void`. Either there is a custom wrapper, a typo in the report, or an unstable API in use. Confirm and document.
  Q2. `eslint.config.mjs` is in the Modified list with no description. Confirm what changed and why.
  Q3. `AuthProvider` and `NextIntlClientProvider` (and any other layout-level provider on the critical path) were not surfaced in the §1 inventory. Either they are clean — in which case the inventory must say so explicitly — or they were not audited — in which case the inventory is incomplete.
  Q4. Cabinet now uses a new Server Action (`listings/actions/deleteListing.ts`) instead of a direct Supabase client call from the client component. Behavior of the cabinet UI (optimistic update, error handling, success/failure UX) must be confirmed unchanged.

This task is measurement + confirmation only. The success criterion is "we have the numbers and the answers, and the pass actually achieved its stated goal".

Requirements:
- DO NOT add new features
- DO NOT refactor
- DO NOT introduce new components, libraries, caching strategies, or perf subsystems
- DO NOT change the public API of AppImage, ListingGallery, GalleryStaticFrame, GalleryIsland, SimilarListings, or any cabinet component
- DO NOT modify the Speculation Rules implementation
- ONLY: measure, audit, document, and apply the smallest possible corrective fix if a measurement reveals a real defect (bug, regression, or contract violation)
- Preserve every guarantee from prior passes (budgets unchanged, `shtepi:vitals` event name, WebVitalMetric public field shape, zero CLS, no hydration mismatch, Cloudinary-first delivery, predictive preload / imageGuard untouched, locale-stripped route normalization, `revalidateTag('site-stats')` on the documented mutation set only)

--------------------------------------------------
1. Lighthouse mobile measurements — the headline
--------------------------------------------------

For each of the 4 locales, run Lighthouse with the default mobile profile (Slow 4G, 4× CPU throttle, Moto G4 emulation) against `/[locale]/listings/test-2-mokkj60o` on a fresh `next start` (production build). Take 3 runs per locale and report the median to dampen variance.

Record per locale:
- LCP (ms) — target ≤ 2500 ms ("good")
- TBT (ms) — target ≤ 200 ms
- INP / responsiveness as reported by Lighthouse (ms) — target < 200 ms
- CLS — target = 0
- LCP element selector + tag (must be the gallery cover `<img>` rendered by `GalleryStaticFrame`, identical across locales)
- FCP (ms) — for context

Acceptance:
- Mobile LCP ≤ 2500 ms in ALL 4 locales (this is the contract this entire chain of tasks was supposed to satisfy)
- Mobile TBT ≤ 200 ms in ALL 4 locales (the hydration budget claim)
- CLS = 0 in ALL 4 locales
- LCP element identity unchanged across locales

If LCP is still > 2500 ms after the hydration pass:
- DO NOT attempt new fixes in this task
- Open a backlog entry "Listing detail mobile LCP — residual hydration cost" with the Lighthouse trace summary (which long task is now the bottleneck), and stop. The verification task succeeds in identifying the gap; the next pass closes it.

If LCP regressed on desktop:
- Open a backlog entry and stop.

Deliverable: a 4-row × N-column table (locale × LCP/TBT/INP/CLS/FCP) with median values, plus the LCP-element selector column.

--------------------------------------------------
2. First Load JS — before vs after
--------------------------------------------------

Required steps:
- Check git history for the build output of `/[locale]/listings/[slug]` BEFORE the hydration pass landed. If the build output is not preserved in git, check out the parent commit, run `next build`, record the route's First Load JS, then return to HEAD.
- Run `next build` on HEAD and record the route's First Load JS now.
- For each, also record the top 5 chunk contributors as printed by the build summary (or by `@next/bundle-analyzer` if it is already a project dev dependency — DO NOT install it if it is not).

Acceptance:
- Meaningful reduction (≥ 15 %) in First Load JS for the route is expected given that `ListingGallery` is now `ssr: false` lazy, `SimilarListings` is RSC, `RelativeTime` is gone client-side, and `ListingContact` is `next/dynamic`.
- If reduction is < 15 %, investigate which chunks did not move and document the finding (still a pass, but flag it for a future bundle-shrink pass).

Deliverable: 2-row table (before / after) with totals + top 5 chunks each.

--------------------------------------------------
3. Streaming verification
--------------------------------------------------

For one locale (`uk` is fine — confirmation, not parity), open `/[locale]/listings/test-2-mokkj60o` in Chrome DevTools Network panel with "Disable cache" on, throttling = Slow 4G:

- Inspect the document response. Confirm chunked transfer encoding (`Transfer-Encoding: chunked`) and multiple response chunks visible in the timeline.
- Confirm the first response chunk contains: `<title>`, `<h1>`, the gallery cover `<img>` (full URL), the listing price, and the listing description preamble.
- Confirm subsequent chunks contain the SimilarListings section (Suspense fallback first, then the streamed content).

Acceptance:
- Multi-flush streaming confirmed
- Above-fold content in the FIRST flush
- Below-fold (SimilarListings) in a LATER flush

Deliverable: short paragraph + screenshot description (or text summary of the flush boundaries).

--------------------------------------------------
4. Raw SSR HTML on all 4 locales
--------------------------------------------------

For each of the 4 locales:

```
curl -s -H 'Accept-Language: <locale>' http://localhost:<port>/<locale>/listings/test-2-mokkj60o > /tmp/listing-<locale>.html
```

Run with JS disabled at the request level (curl already does this by definition — no JS executes on raw fetch). For each locale, confirm presence in the raw HTML body of:

- `<title>` containing the listing title
- `<h1>` with the listing title
- Listing price as plain text
- Gallery cover `<img>` with a Cloudinary URL and proper `width` / `height` / `alt` / `fetchpriority="high"`
- The first ~200 characters of the listing description as plain text
- Speculation Rules `<script type="speculationrules">` block (if present in the implementation; verify against `Save-Data` header behavior — try once with `-H 'Save-Data: on'` and confirm the script is omitted)

Acceptance:
- Every above-fold marketing-critical element present in the raw HTML for every locale.
- Speculation Rules script behaves correctly under `Save-Data: on`.

Deliverable: 4-row table — locale × {title-in-html, h1-in-html, price-in-html, hero-img-in-html, description-in-html, speculation-rules-emitted, speculation-rules-suppressed-on-save-data}.

--------------------------------------------------
5. Hydration warnings sanity
--------------------------------------------------

Required steps:
- Open `/[locale]/listings/test-2-mokkj60o` in Chrome DevTools Console for ALL 4 locales (one tab each, fresh load each).
- Confirm: zero React hydration warnings, zero "Text content does not match" warnings, zero "Hydration failed" warnings.
- Confirm the cover image src/srcset/sizes attributes are byte-identical between SSR HTML and what the client gallery shell renders once hydrated. Use the `view-source:` trick for SSR HTML and the Elements panel for post-hydration DOM.

Acceptance:
- Clean console in all 4 locales.
- Server-rendered first frame matches client-rendered first frame on the gallery hero.

Deliverable: short note "Clean — 4/4 locales" or specific warning text + locale + likely cause.

--------------------------------------------------
6. Resolve open question Q1 — `revalidateTag` second argument
--------------------------------------------------

Required steps:
- `grep -rn "revalidateTag(" src/` — list every call site.
- For each call site, record the EXACT call signature (single arg vs two args).
- If any call uses two arguments:
  - If `revalidateTag` is imported from `next/cache` directly: this is invalid. Next.js 15's public signature is `revalidateTag(tag: string): void`. The build was reported clean, so either the report contained a typo, or the second arg is being silently ignored at runtime and the cache is still being invalidated only by the first arg. Determine which.
  - If `revalidateTag` is imported from a project-local wrapper module: read the wrapper, document its signature and rationale.
- If all calls use a single arg: the original report contained a typo. Note this in the deliverable and move on — no fix needed.

Fix policy:
- If a real bug exists (e.g. wrapper that drops the tag), fix it minimally — change the call to the correct single-arg form.
- If it's a typo in the prior report, no code change.

Deliverable: list of every `revalidateTag` call site with file:line, exact arg signature, source of import, and verdict (typo / wrapper / bug).

--------------------------------------------------
7. Resolve open question Q2 — `eslint.config.mjs` diff
--------------------------------------------------

Required steps:
- `git log -p eslint.config.mjs` for the commits introduced by the hydration pass.
- Capture the exact diff.
- For every rule added/removed/modified, record the rule name, the change, and a one-line rationale.

Acceptance:
- No safety-relevant rule was disabled (e.g. `react-hooks/exhaustive-deps`, `@typescript-eslint/no-floating-promises`, `react/no-unescaped-entities` for security-relevant content).
- If any safety-relevant rule was disabled, REVERT that change in this task. Other lint adjustments (e.g. allowing the new RSC patterns) are fine — just document them.

Deliverable: diff excerpt + rule-by-rule rationale.

--------------------------------------------------
8. Resolve open question Q3 — provider audit
--------------------------------------------------

Required steps:
- Walk the React tree from `app/[locale]/layout.tsx` (and `app/layout.tsx` if it adds providers) downward to the listing detail page.
- For EVERY provider on the path, record:
  - Component name + file path
  - `'use client'` directive presence
  - Whether it has a consumer ABOVE THE FOLD on listing detail (mobile 360w viewport)
  - Whether it does any work in render or in mount (`useEffect`) that delays initial paint
  - Verdict: clean / acceptable / problem-but-out-of-scope-for-this-task

Specific providers to confirm (do not skip — verify each):
- `AuthProvider` (or whatever provides current-user context)
- `NextIntlClientProvider`
- Theme provider (next-themes or equivalent)
- Toast / Sonner provider
- Tooltip provider (radix-ui pattern from shadcn/ui)
- Any analytics / web-vitals reporter mount
- Any router/navigation context wrapper

Fix policy:
- If a provider is on the critical path, hydration-blocking, AND has zero above-fold consumers — it is a real defect. Mark it as a backlog item (do NOT fix in this task). The verification task surfaces it; a separate small follow-up fixes it.
- If all providers are clean or acceptable, that is the answer. Document the audit so it does not need to be re-done.

Deliverable: full provider table with the columns above. This is the §1 inventory addendum that was missing from the original report.

--------------------------------------------------
9. Full §1 inventory addendum
--------------------------------------------------

The original pass surfaced only the top-3 hydration contributors (`ListingGallery`, `SimilarListings`, `RelativeTime`). The task required the FULL inventory. Either:

a) The full inventory exists in `docs/performance.md` (the report says "documented in docs/performance.md") — in which case extract it verbatim into this verification report. OR
b) The full inventory does not exist — in which case build it now, using the same column shape:
   - File path
   - Server / Client
   - Above-fold? (yes / no / partial)
   - On critical path to gallery hero? (yes / no)
   - Reason it's client (if client)
   - Verdict (kept / converted to RSC / lazy via next/dynamic / out-of-scope)

Acceptance: a single complete table representing every component in the listing detail render tree from layout to first below-fold section.

--------------------------------------------------
10. Resolve open question Q4 — cabinet delete behavior parity
--------------------------------------------------

Required steps:
- Locate `src/cabinet/components/ListingsTab.tsx` (or equivalent) before-vs-after diff.
- Confirm the behavior contract:
  - User clicks "Delete" on their own listing in cabinet
  - UI shows confirmation dialog (unchanged)
  - On confirm: optimistic removal from list (or pending spinner — whatever the prior UX was)
  - On Server Action success: list updated, toast / success indicator shown, homepage stats counter revalidated via `revalidateTag('site-stats')`
  - On Server Action failure: list reverted to prior state, error toast / message shown
- Confirm RLS coverage: the new Server Action MUST verify that the authenticated user owns the listing being deleted. Read `docs/rls-rules.md` and confirm the action either relies on RLS (and uses the user-scoped Supabase client) or performs an explicit ownership check.
- Confirm error states: what does the cabinet show if the Server Action throws? Compare to prior behavior.

Acceptance:
- UX behavior parity with the prior client-side flow (or documented improvement).
- Ownership check present (either via RLS through user-scoped client, or explicit check).
- No optimistic-update regression (e.g. UI doesn't get stuck if the action fails).

Fix policy:
- If a regression is found, fix the smallest amount needed to restore parity.
- If RLS / ownership is not enforced, this is a security defect — open a HIGH-priority backlog entry and apply a minimal explicit-check fix in this task (do NOT defer security).

Deliverable: behavior matrix (before / after) for: confirm dialog, optimistic update, success path, failure path, ownership check.

--------------------------------------------------
11. Documentation updates
--------------------------------------------------

Update `docs/performance.md`:
- Append the Lighthouse mobile measurement table from §1 (4 locales × LCP/TBT/INP/CLS/FCP).
- Append the First Load JS before/after summary from §2.
- Append the full inventory table from §9 if it was not already there.
- Append the provider audit table from §8.

Update `docs/backlog.md`:
- Closed entry: "Hydration Budget Pass — verification follow-up."
- One OPEN entry per defect surfaced by §1, §6, §7, §8, §10 if any (one entry per distinct issue).

--------------------------------------------------
12. Validation checklist
--------------------------------------------------

After implementation verify:

Measurements:
- §1 Lighthouse table complete for ALL 4 locales (median of 3 runs each)
- LCP ≤ 2500 ms in all 4 locales — OR a backlog entry filed with the residual long-task culprit
- TBT ≤ 200 ms in all 4 locales — OR a backlog entry filed
- CLS = 0 in all 4 locales
- §2 First Load JS before/after captured with chunk breakdown
- §3 streaming verified for `uk`
- §4 raw SSR HTML verified for all 4 locales (above-fold content + Speculation Rules `Save-Data` behavior)
- §5 hydration console clean in all 4 locales

Open questions resolved:
- §6 every `revalidateTag` call site listed with arg signature and verdict
- §7 `eslint.config.mjs` diff captured with rule-by-rule rationale; no safety-relevant rule silently disabled
- §8 provider audit complete, including AuthProvider and NextIntlClientProvider
- §9 full inventory table present
- §10 cabinet delete behavior parity confirmed, ownership check confirmed

Locale parity:
- Every measurement and check executed for ALL 4 locales
- No code change introduces a per-locale branch or hardcoded locale prefix

Preserved guarantees (still hold):
- Budgets unchanged (good ≤ 2500 ms, poor > 4000 ms)
- Analytics event name `shtepi:vitals` unchanged
- WebVitalMetric public field shape unchanged
- Zero CLS, no hydration mismatch
- Cloudinary delivery contract unchanged
- Predictive preload / imageGuard untouched
- Locale-stripped route normalization continues to apply uniformly
- `revalidateTag('site-stats')` is called on listing approve / deactivate / archive / hard-delete / cabinet-delete only — NOT on view, favorite, contact, or pending-creation

Final report (in PR description) must include:
- §1 Lighthouse table (4 locales × LCP/TBT/INP/CLS/FCP, median of 3)
- §2 First Load JS before/after with top 5 chunks each
- §3 streaming verification note
- §4 raw SSR HTML matrix
- §5 hydration sanity result
- §6 `revalidateTag` call-site table
- §7 `eslint.config.mjs` diff + rationale
- §8 provider audit table
- §9 full inventory table
- §10 cabinet delete behavior matrix + ownership-check verdict
- Files modified (expected to be small or zero in this verification-led pass)
- Any new backlog entries filed
- Confirmation that all "Preserved guarantees" still hold
