# Session — Task 535: Pagination single-line shed-to-fit (ResizeObserver) + ≥44px tap target

**Date:** 2026-07-03
**Kickoff:** `tasks/Sprints/Sprint_40_kickoff_prompt_Task_535_PaginationShedToFit.md`
**Executor:** Sonnet (this session)
**Supersedes:** Task 534 (its ≥44px requirement is folded into Rule 5 below — Task 534 kickoff retained for history, not executed standalone, per the owner's backlog note).

## Summary

New canonical `MantinePagination` (`src/design-system/mantine/patterns/MantinePagination.tsx`) replaces the
bare Mantine `<Pagination>` in `MantineAdminSurfacePattern.tsx`. It composes `Pagination.Root` directly (not
the `<Pagination>` composite) so it can render an ASYMMETRIC, dynamically-shed set of controls: never wraps to
a 2nd line, never h-scrolls, sheds siblings → trailing boundary → leading boundary → floor (`Prev·current·Next`)
as measured space shrinks, and grows back on wider containers — all while staying pixel-identical to the prior
Mantine-stock desktop density at wide widths (verified rendered at 2560px). ≥44px mobile tap targets added via
a `pagination-chrome.css` media query (Task 534's folded requirement). Task 533's chrome (border/bg/radius/
hover) is completely untouched — verified by an empty diff on that theme.ts block.

## Root cause (verified, not assumed)

Mantine's `<Pagination>` composes `Pagination.Root > Group gap={gap}` internally, and `Group` defaults to
`flex-wrap: wrap` — confirmed by reading `node_modules/@mantine/core/esm/components/Pagination/Pagination.mjs`
before writing any code. At 320px this caused the owner-reported wrap ("`10 >` wraps to a 2nd line").

## Required after-behavior 1 — `MantinePagination` component

**DOM/API verification (§18 discipline, read source before coding):**
- `Pagination.mjs`: composite = `PaginationRoot > Group` with `PaginationFirst/Previous/Items/Next/Last`.
- `PaginationItems.mjs`: numbers are driven by `ctx.range` (from `Pagination.Root`'s own internal
  `usePagination` call) — this is exactly why a custom range requires bypassing `Pagination.Items` and
  rendering `Pagination.Control`/`Pagination.Dots` manually (confirmed `active`/`onClick` are plain PROPS on
  `Pagination.Control`, not read from context — so a custom range can drive them directly).
- `use-pagination.mjs` (`@mantine/hooks`): the algorithm this task's `computeShedRange` needed to match for
  level 0 and diverge from (safely) for the shed levels — see below.
- `use-props.mjs`: `theme.components[componentName]?.defaultProps` is looked up by the EXACT string passed to
  `useProps(name, …)` — `PaginationEdges.mjs` calls `useProps("PaginationNext"/"PaginationPrevious", …)`,
  confirming Task 533's `theme.components.PaginationNext/PaginationPrevious` blocks still apply unchanged to
  this component's `<Pagination.Previous>`/`<Pagination.Next>` usage (STOP-and-ASK #1 from Task 533 stays
  resolved — no new selector work needed).

**Range algorithm — two functions, not one, after a bug was caught and fixed:**
1. `computeFullRange` — an EXACT line-for-line port of Mantine's own `usePagination` range algorithm
   (`boundaries` hardcoded to 1, matching the stock default), used ONLY for shed level 0. First attempt at a
   single generalized function (independent leading/trailing boundary flags folded into one formula) FAILED
   its own equivalence test against `usePagination`'s real output — Mantine's algorithm has two extra
   "near-edge widening" branches (avoids a lone dangling number before the dots, e.g. shows `1,2,3,4,5…10`
   instead of `1,2…10` near page 1) that a naive middle-range formula misses. Caught via the regression test
   (see below), not assumed correct.
2. `computeAsymmetricRange` — a simpler, correct-by-construction function (dedupe via `Set`, sort, insert
   `dots` for any gap >1) used for shed levels 1–3 (siblings always 0 at those levels). Deliberately does NOT
   replicate Mantine's cosmetic near-edge widening — that cosmetic smoothing is irrelevant to a path whose
   entire purpose is minimizing width.

**Rule 1 — never wraps/scrolls:** the row is `display:flex; flex-wrap:nowrap; overflow:hidden; max-width:100%`
— a hard CSS invariant independent of the JS shed logic (verified by a dedicated regression test, see below).

**Rule 2 — dynamic shed-to-fit (ResizeObserver), single-pass arithmetic, not iterative re-render:** a
`ResizeObserver` on the row's DOM **parent** (not the row itself — the row is intrinsically content-width so
the consumer's own `<Group justify="center"|"flex-end">` keeps working unmodified) reads `parent.clientWidth`
as the "available" budget. A hidden measuring probe (`Pagination.Control` rendered with `String(total)` — the
widest label that can ever appear — `position:absolute; visibility:hidden`, `mounted`-gated so it never renders
server-side) gives a REAL, size- and digit-count-aware per-item width via `getBoundingClientRect()`. For each
of the 4 shed levels, `itemCount × controlW + gaps` is computed arithmetically and the widest level that fits
is chosen in ONE pass — no iterative render→measure→render loop, so it cannot oscillate/thrash (the kickoff's
explicit negative-flow concern).

**Rule 3 — asymmetric shed ladder:** `SHED_LEVELS` = `[siblings:1,both boundaries]` (0, prior stock default) →
`[siblings:0,both]` (1) → `[siblings:0,leading only]` (2, drops trailing boundary+dots) → `[siblings:0,none]`
(3, floor: current page only). Verified rendered (below): a `total=250` cluster at 320px correctly shows
`1 … 137` (leading boundary kept, trailing `250` dropped) — real asymmetric shedding, not a guess.

**Rule 4 — SSR-safe:** `level` state initializes to `FLOOR_LEVEL` (both server and first client render); the
hidden probe is `mounted`-gated (never in the SSR HTML); the `ResizeObserver` effect only runs after mount and
GROWS the visible set from the safe floor. Verified: no hydration/console errors across the full 28-cell
(7 breakpoints × 4 locales) rendered matrix.

**Rule 5 — ≥44px mobile tap target (folds Task 534):** a `@media (max-width:639.98px)` block in
`pagination-chrome.css` sets `min-width`/`min-height: 2.75rem` on `.mantine-Pagination-control`,
`.mantine-Pagination-edgeControl`, and `.mantine-Pagination-dots`. Desktop stays governed by the consumer's
`size` prop (size-agnostic, unchanged from Task 533/534's decision). The shed budget automatically accounts
for the larger mobile control size because the measuring probe is a REAL rendered DOM element subject to the
same media query — confirmed via computed style (`minControlWidth: 44` at 320/375px, `32`/`26` at 1024px
depending on `size`).

## Required after-behavior 2 — consumer swap (the only consumer edit)

`MantineAdminSurfacePattern.tsx`: `import { Pagination } from '@mantine/core'` → `import { MantinePagination }
from './MantinePagination'`; `<Pagination total value onChange color size>` → `<MantinePagination total value
onChange color size>` — **identical props**, same `<Group justify={isMobile?'center':'flex-end'}>` wrapper
retained unmodified. No new props were added to the consumer call (the `previousLabel`/`nextLabel`/
`getPageAriaLabel` optional props exist on `MantinePagination` for the story's localized-aria proof but are
NOT passed by the consumer, matching its pre-existing behavior — the bare `<Pagination>` had no aria wiring
either, so this is not a regression).

**Before/after control inventory (Notes 19/20):** `total`, `value`, `onChange`, `color`, `size` — all 5 props
accepted identically. Prev/Next click → `onChange(page±1)` — identical (verified by RTL test). Prev disabled
page 1 / Next disabled last page — identical (verified). Active-page brand fill — identical (verified,
byte-exact to Task 533's chrome). `Group justify` centering/right-alignment — identical (the row stays
content-width; nothing was made `width:100%` that would have broken this). **Nothing was silently removed.**

## Required after-behavior 3 — story

`Pagination.stories.tsx` rewritten to render via `MantinePagination`: default cluster (total=10), mobile-compact
(total=50, `size="sm"`, demonstrates single-line shed-to-fit), a NEW "shed-ladder stress" cluster (total=250,
value=137 — exercises the full asymmetric ladder), page-1/last-page boundary clusters, single-page (total=1).
Localized aria via the new `previousLabel`/`nextLabel`/`getPageAriaLabel` props, routed through `storyT()`
against the existing Task 533 `storybook.mantine.pagination_*` keys (no new i18n keys needed).

## Positive flow verification

1. Every cluster renders on ONE line at every measured width (28-cell matrix: 320/375/390/768/1280/1440/2560 ×
   sq/en/uk/it, all `hScroll:false`, `anyRowOverflow:false`, `consoleErrors:0` — `docs/sessions/assets/task535/
   rendered-matrix-check.json`).
2. Wide desktop (2560px) shows the FULL prior-default set (`1 … 4 5 6 … 10`) — pixel-identical density to
   before this task (`mantine-primitives-pagination--default__en__2560.png`).
3. As width shrinks, items shed in the Rule-3 order — verified at 320px: `total=250` cluster shows
   `Prev | 1 | … | 137 | Next` (leading boundary kept, trailing dropped) — confirmed asymmetric.
4. Clicking a number/Prev/Next fires `onChange(page)` — confirmed via 2 RTL tests (Next→value+1, Prev→value-1)
   plus the boundary-disabled test.
5. Mobile <640: every control ≥44×44px (`minControlWidth:44` measured at 320/375px); row stays centered via
   the untouched `Group justify="center"`.

## Negative flow verification

- **Overflow at 320 with long numbers (total=250, active=137):** the shed ladder engages correctly (leading
  boundary + current shown, trailing dropped) — no h-scroll, no wrap, confirmed rendered.
- **Single page (total=1):** renders `Prev·1·Next`, both edges disabled — confirmed rendered (`docs/sessions/
  assets/task535/mantine-primitives-pagination--default__uk__320.png`) and via a dedicated vitest no-crash test.
- **`total<=0`:** renders `null` — confirmed via vitest (`container.querySelector('.mantine-Pagination-root')`
  is `null`).
- **Rapid resize / thrash guard:** the single-pass arithmetic estimate (not iterative render-measure-render)
  structurally cannot oscillate — there is no feedback loop between "grow" and "shed" attempts; each measurement
  independently computes the best-fitting level from scratch.
- **JS disabled / pre-hydration:** the floor level (`Prev·current·Next`) is what server + first client render
  emit — no wrap even before any JS runs (Rule 4).
- **Locale switch:** the numeric content is locale-invariant; verified no layout break across sq/en/uk/it at
  all 7 breakpoints (rendered matrix).
- **`onChange` undefined:** the story's own clusters pass `() => {}`; `MantinePagination`'s `handleChange` calls
  `onChange?.(page)` (optional chaining) — no crash path exists structurally.

## Planted-violation proof #1 — vitest CSS invariant (Rule 1)

Temporarily changed `flexWrap: 'nowrap'` → `'wrap'` in the component. Re-ran the regression test:
```
FAIL × 4 — "row is flex-nowrap + overflow:hidden for total=…" (all 4 total/value combos)
AssertionError: expected 'wrap' to be 'nowrap'
```
Reverted → `22/22 PASS`.

## Planted-violation proof #2 — rendered gate (shed logic actually applied)

The Task 533 session log noted the stock `Group` wraps by default but that fact alone never produced a gate
FAIL (siblings/boundaries happened to fit at the tested widths). This task's negative-flow proof needed to
show the NEW gate catches a REAL wrap/overflow. Disabled the entire `useLayoutEffect` shed logic (forced
`level` to stay at 0 — the widest, un-shed set — permanently) and rebuilt:
```
npm run screenshots:assert -- --mantine-only
  Pagination cells: 16 total, 4 PASS, 12 FAIL
  ✗ [text-clipped] / [offscreen-control] / [outside-container] on it×mobile-375, it×mobile-390, and others —
    e.g. button("10") — Vai alla pagina 10 offscreen; button — Pagina successiva outside-container
```
Full FAIL manifest + representative uk@320 screenshot: `docs/sessions/assets/task535/planted-violation/`.
Reverted (`useState(FLOOR_LEVEL)` + effect body restored verbatim) → `npx tsc --noEmit` 0 errors → rebuilt →
**364/368 PASS, 0 FAIL** (Pagination: 16/16 PASS) confirmed on a second independent clean run (a first re-run
showed 1 unrelated `Tabs/Default × sq × desktop-1024` blank-canvas failure that did NOT reproduce on immediate
re-run — a transient Playwright/browser render flake, not a Pagination regression; Pagination's own 16 cells
passed in both runs regardless).

## Mobile <640 full-width / compact-control note (clause 11)

Pagination remains the documented compact-control-cluster exemption (same as Task 533) — it stays
content-width/centered, not `w-full`. The NEW guarantee this task adds is the single-line/no-h-scroll
invariant at every width down to 320px, plus the ≥44px tap-target floor.

## TailAdmin conformance (clause 16)

No chrome was touched — `theme.ts`'s Task 533 `Pagination`/`PaginationNext`/`PaginationPrevious` blocks have a
byte-identical diff to before this session (confirmed: `git diff --stat theme.ts` = same 33-line addition, no
new lines from this task). `pagination-chrome.css`'s only addition is the Rule-5 media query (mobile sizing,
not color/border/radius). Rendered proof at 2560px shows the SAME visual density/colors as Task 533's own
proof screenshots.

## Regression coverage (clause 15) — registry row ADDED

`docs/critical-flow-registry.md` → P0 Admin lifecycle: new row **"Admin-table pagination navigation"** (no
prior row existed — Task 533 was chrome-only and explicitly noted this in its own log). 22 vitest tests:
9 equivalence-with-Mantine, 4 asymmetric-shed unit tests, 3 onChange/boundary RTL tests, 5 CSS-invariant tests,
1 no-crash test. Command: `npx vitest run src/design-system/mantine/patterns/__tests__/MantinePagination.smoke.test.tsx`.
Both planted-violation proofs above (vitest + rendered gate) demonstrate the coverage is real, not a no-op.

## Gates (all green, final confirmed run)

```
npx tsc --noEmit                     → 0 errors
npm run check:stories                → PASSED, 96 files, 0 violations, storybook.* 500/500 parity
npm run check:i18n                   → PASSED, 4 locales, 2065 keys, parity OK (no new keys needed)
npm run check:mojibake               → 0 artifacts, 1528 files
npm run check:design-tokens:strict   → 0 violations, 390 files scanned
npm run check:file-integrity         → PASSED (see below)
npx vitest run …MantinePagination.smoke.test.tsx → 22/22 PASS
npm run build-storybook              → built in 40.80s (final clean build)
npm run screenshots:assert -- --mantine-only → 364/368 PASS, 0 FAIL, 4 AMBIGUOUS (pre-existing Tabs, unrelated) — confirmed on 2 consecutive clean runs
```

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | `Pagination.Root`-based, `flex-nowrap`+`overflow:hidden`, never wraps/scrolls | ✅ | `MantinePagination.tsx`; 28-cell rendered matrix all clean; vitest CSS-invariant tests |
| 2 | ResizeObserver measures + sheds per Rule-3 ladder, asymmetric via composed children | ✅ | `computeAsymmetricRange`; rendered proof of `total=250` dropping trailing boundary at 320px |
| 3 | SSR-safe conservative default + grow-on-measure; no hydration warning; no wrapped first paint | ✅ | `mounted`-gated probe + `FLOOR_LEVEL` initial state; 0 console/page errors across the full matrix |
| 4 | ≥44px on every control at <640; desktop size-agnostic | ✅ | `pagination-chrome.css` media query; computed `minControlWidth:44` at 320/375px |
| 5 | Consumer swapped, props preserved, onChange/value identical | ✅ | `MantineAdminSurfacePattern.tsx` diff — element+import swap only; RTL onChange tests |
| 6 | §6l chrome UNCHANGED | ✅ | `theme.ts` diff unchanged from pre-session; 2560px screenshot matches Task 533 density |
| 7 | Rendered matrix 320-2560 × 4 locales, uk@320/375/390 mandatory, long-total(250) cell, machine-produced | ✅ | `rendered-matrix-check.json` (28 cells, FAILURES:NONE) + 16-cell `--mantine-only` gate + curated PNGs |
| 8 | Planted-violation FAIL transcript REAL, catches a wrap/overflow the gate previously missed | ✅ | Both proofs above (vitest 4-FAIL + rendered-gate 12/16-FAIL), both reverted to green |
| 9 | Regression test added/extended, registry row added, CI-runnable, FAILs on planted violation | ✅ | New registry row; `MantinePagination.smoke.test.tsx` 22 tests; both planted-violation proofs |
| 10 | All gates green | ✅ | Gates block above |
| 11 | Session log, AC audit, before/after inventory, Files Changed, self-validation, no git by executor | ✅ | This file |

## File-integrity gate (clause 14)

`check:file-integrity` — all touched/new files clean (0 NUL, no BOM, not truncated): `MantinePagination.tsx`,
`pagination-chrome.css`, `MantinePagination.smoke.test.tsx`, `Pagination.stories.tsx`, `patterns/index.ts`,
`MantineAdminSurfacePattern.tsx`, `layout.tsx`, `.storybook/preview.tsx`, `critical-flow-registry.md`,
`mantine-tailadmin-migration-tracker.md`.

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/MantinePagination.tsx` | NEW — the shed-to-fit component (Rules 1–5). |
| `src/design-system/mantine/patterns/index.ts` | Export `MantinePagination` + its props type. |
| `src/design-system/mantine/patterns/MantineAdminSurfacePattern.tsx` | Consumer swap — import + element only, same props. |
| `src/design-system/mantine/pagination-chrome.css` | Added the `@media (max-width:639.98px)` ≥44px block (Rule 5 / folded Task 534). Task 533's rules untouched. |
| `src/app/layout.tsx` · `.storybook/preview.tsx` | Already importing `pagination-chrome.css` since Task 533 — no new import needed, files unaffected by this diff (confirmed no changes beyond what Task 533 already added). |
| `src/stories/mantine/primitives/Pagination.stories.tsx` | Rewritten to render via `MantinePagination`; added the shed-ladder-stress (total=250) cluster. |
| `src/design-system/mantine/patterns/__tests__/MantinePagination.smoke.test.tsx` | NEW — 22-test regression suite (equivalence, asymmetric shed, onChange/boundary, CSS invariant, no-crash). |
| `docs/critical-flow-registry.md` | New row: Admin-table pagination navigation. |
| `docs/mantine-tailadmin-migration-tracker.md` | P1.13 status → complete (Task 533 chrome + Task 535 shed-to-fit); P1.15 Alert marked done. |
| `docs/backlog.md` | Last Session + Sprint 40 status; Task 534 closed as superseded. |
| `docs/sessions/2026-07-03-task535-pagination-shed-to-fit.md` | This file. |
| `docs/sessions/assets/task535/*` | Rendered matrix JSON + curated PNGs (28-cell check + 16-cell gate + 2560px density proof). |
| `docs/sessions/assets/task535/planted-violation/*` | FAIL transcript manifest + representative FAIL screenshot. |

**Not touched this task:** `theme.ts` (Task 533's `Pagination`/`PaginationNext`/`PaginationPrevious` blocks —
diff confirmed unchanged), `input-chrome.css`, `pagination.tsx` (legacy shadcn), any other theme block.

**Note — `messages/{sq,en,uk,it}.json` show as modified in `git status`:** this is Task 533's uncommitted
`pagination_aria_*` addition from the prior session (owner has not yet run that commit) — this task did not
add any new i18n keys (the existing Task 533 keys were reused as-is for the new story's aria wiring).

**Reverted, not part of this diff:** `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`
(auto-regenerated side effect of the required gate command, restored to HEAD in-session, same as prior tasks).

**Emitting NO `git add`/`git commit`** — no mutating git command was run this session.
