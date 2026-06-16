# Task 437 — "Preloaded but not used" warnings: perf hygiene (DIAGNOSE → narrow FIX)

> **Type:** Performance / preload hygiene. **Low severity — NOT a functional bug.** Owner collected
> several browser console warnings (labelled "Error 2/3/4", 2026-06-15) that are all the SAME class:
> `The resource <url> was preloaded using link preload but not used within a few seconds…`.
> Consolidates them into ONE task. Separate from Task 434 (hydration), 435 (report submit), 436 (prevention).

## 🔴 GATE — confirm production-build reproduction FIRST (cheapest, may close the task)

Most of these warnings are **`next dev` / Turbopack artifacts** (note the dev-only chunk name
`[root-of-the-server]__*.css`, and the constant `[Fast Refresh] rebuilding` in the same logs). Before ANY
code change:
1. Run `npm run build && npm start` (production build, Turbopack-dev OFF).
2. Load the affected routes and record which "preloaded but not used" warnings **still appear in prod**.
3. **Any warning that does NOT reproduce in the production build is OUT OF SCOPE** — document it as
   dev-only noise and do not touch it. Only warnings that persist in prod are real waste worth fixing.

If NONE reproduce in prod → close the task as "dev-only Turbopack noise, no product issue", with the
prod-build transcript as evidence. Do not edit preload code in that case.

## Observed warnings (owner console, dev) — inventory targets

- A Cloudinary **LCP image** preloaded but not used (e.g. `…/listings/…_vorrxg.jpg`), on
  `/<locale>/listings/<slug>` and the `…/edit` page.
- `_next/static/chunks/%5Broot-of-the-server%5D__*.css` (a **CSS chunk**) — repeated ~12× on one load.
- `_next/static/media/*.woff2` (a **font**) — repeated alongside the CSS.
- `[PRED] scroll/hover → preloaded variant=listing` lines from a **predictive preloader**.

## Pre-read (rule-index → Performance task)

- `docs/agent-contract.md` + `docs/backlog.md` (always)
- `docs/performance.md` (Core Web Vitals RUM layer, budgets, preload strategy)
- `docs/qa-rules.md`

## Required investigation (report findings before any fix)

Inventory every place this app injects a preload, and check whether each is actually consumed:
1. **Middleware LCP `Link` header** — `src/middleware.ts` (`buildLcpLinkHeader` / `buildGalleryLcpPreloadHref`,
   the A/B/C/D variant system). The file's own comments already document a long-standing `PRELOAD_NOT_USED`
   investigation (Task 80) — read them; this may be the same unresolved image-preload issue.
2. **Predictive preloader** — find the source of the `[PRED] … preloaded variant=listing` logs and what it
   injects (link rel=preload? prefetch?) and whether the preloaded variant is used in time.
3. **Framework auto-preloads** — the CSS-chunk + font `preload` tags are emitted by Next/Turbopack; confirm
   whether they reproduce in prod (gate above) before assuming they are ours to fix.
4. Cross-check `as=` correctness on every preload we emit (the warning explicitly suggests an inappropriate
   `as` value as one cause).

## Fix (ONLY warnings confirmed in the production build; minimal, no functional change)

- For an image/CSS/font WE preload that prod confirms is unused-in-time: either correct the `as`/attributes
  so the browser accepts and uses it, align the preloaded URL with the one the page actually requests, or
  stop preloading it if it provides no measured LCP benefit. Decide per-resource with evidence; do not
  blanket-remove the LCP preload that benefits real listing pages without measuring LCP before/after.
- Preserve the existing LCP optimization intent (Task 80) — this is hygiene, not a teardown of the preload
  system. Any change must show LCP did not regress (use the existing RUM/`[LCP]` logging).

## Positive flow

Production build of an affected route loads with **no "preloaded but not used" warnings** for resources we
control, and the LCP image is preloaded AND used (LCP unchanged or improved).

## Negative flow

- Warning is dev-only (not in prod) → documented, no change.
- Removing/altering a preload regresses LCP → revert that change; keep the preload.
- `as=` corrected but browser still ignores it → investigate URL/attribute mismatch, document.

## Acceptance criteria

- AC1 — Prod-build reproduction matrix: each observed warning marked dev-only (out of scope) or
  prod-confirmed (in scope), with the `npm run build && npm start` transcript.
- AC2 — Preload-source inventory complete (middleware LCP header, predictive preloader, framework auto
  preloads) with consumed/not-consumed per source.
- AC3 — Only prod-confirmed warnings for resources we control are fixed; LCP not regressed (before/after).
- AC4 — No functional/UI change; scope limited to preload attributes/strategy.
- AC5 — `npx tsc --noEmit` = 0; file-integrity green; "Files Changed" table; no mutating git.
