# Session Archive: geometry checker Check 4 clip-awareness (Task 569) — 2026-07-10

## Context

Task 569, `tasks/Sprints/Sprint_43_kickoff_prompt_Task_569_GeometryCheck4ClipAwareness.md`. Opened by
the orchestrator at the Task 567 round-2 review: the pinned-footer pattern (Fix 4) surfaced a real
limitation in the shared `scripts/geometry-integrity.mjs` Check 4 (`element-overlap`), which Task 567
worked around with a scoped, precedented `GEOMETRY_ALLOWLIST` entry rather than a self-authored
algorithm change (self-verification-conflict concern — see the Task 567 round-2 session log). This
task does the algorithm fix under its own independent review (blast radius = the shared checker that
judges every story).

## Root cause (recap)

Check 4 compared two elements' raw `getBoundingClientRect()` values with no awareness of
`overflow:auto`/`scroll` clipping. When one element sits inside a `flex:1; overflow-y:auto` scroll
region taller than itself, content near the bottom of that region has a DOM layout position that
geometrically extends past the region's own clipped viewport — coincidentally into a sibling's (e.g.
a pinned footer's) on-screen coordinates — even though `overflow:auto` clips it so nothing is actually
painted there. Check 3 (`outside-container`) already exempts `auto|scroll` ancestors from its own
escape check for the identical reason; Check 4 never got the same treatment.

## Fix

**`scripts/geometry-integrity.mjs`:**
- Factored the shared `isClippingAncestor(el)` predicate (the `/hidden|clip|auto|scroll/` regex test)
  out of `findClippingAncestor` (Check 3's nearest-ancestor walk) so it is defined ONCE, not
  duplicated.
- Added `getVisibleClippedRect(el)`: walks EVERY clipping ancestor in the element's chain (not just
  the nearest), progressively intersecting the element's rect against each one. Returns `null` if the
  intersection ever collapses to nothing (the element is fully clipped away at the current scroll
  position — not painted, so it cannot visually overlap anything). An element with no clipping
  ancestor, or one that doesn't actually clip it, gets its full unmodified rect back.
- In Check 4's overlap loop: after the existing cheap raw-rect `rectsOverlap()` pre-filter, both
  candidates' rects are re-computed via `getVisibleClippedRect()` and re-checked before any
  ambiguous/violation classification. If either is fully clipped away, or the clipped rects no longer
  overlap, the pair is skipped entirely (not even `ambiguous-overlap`) — it was never a real collision.

**`scripts/check-stories-rendered.mjs`:** removed the `mantine-primitives-filterspanelshell--default`
/ `element-overlap` `GEOMETRY_ALLOWLIST` entry Task 567 added as an interim suppression. The
`PasswordInput`/`RangeDatePicker` (icon-in-field) and `Tabs` (swipe-scroll) entries are untouched —
a different intentional-containment class, not this clip class.

**`src/stories/PlantedVisualViolations.stories.tsx`:** added 2 new planted fixtures under the existing
`Planted/VisualViolations` story file (auto-discovered by the harness's Phase 2 "geometry-only" sweep
— they do NOT need a static `ASSERT_STORIES` entry, confirmed by inspecting how existing planted
stories are discovered):
- **`ScrollClippedOverlap`** — a `height:60px; overflow-y:auto` region containing 4 rows (160px total
  content) followed by a footer sibling. The 2nd/3rd rows' raw rects geometrically extend past the
  region's clipped boundary into the footer's coordinates. Proves the false-positive class the fix
  removes.
- **`ScrollVisibleOverlap`** — two `position:absolute` buttons forced to overlap, BOTH fully inside a
  scrollable container's visible viewport (neither exceeds it). Proves the clip-aware exemption only
  triggers on genuinely clipped-away pixels, not merely "inside something scrollable" — a naive
  "any scroll ancestor → exempt" fix would have wrongly passed this; it must still hard-FAIL.

## Verification methodology (per the kickoff's corrected AC4)

`--mantine-only` only runs Phase 0 (`Mantine/Primitives/*`) and skips Phase 1 (`ASSERT_STORIES`),
where `Planted/OverlappingActions` and `Planted/AmbiguousOverlap` — the two stories that prove the
check still catches real overlaps — live. Since this task changes the SHARED algorithm (evaluated for
every story via the geometry-only Phase 2 sweep too), the **full** `npm run screenshots:assert` (no
flag) is the only valid evidence — confirmed by re-reading the kickoff after the orchestrator's AC4
correction commit (`91c88da47`).

**Before-baseline** (OLD checker, current stories, before adding the 2 new planted fixtures):
7228 cells total, 6058 PASS / 804 FAIL / 258 ambiguous / 108 out-of-range, elementOverlap=90,
ambiguousOverlap=282. Saved to `.screenshots/rendered-assert/2026-07-09T15-47/manifest.json`.

**Before-fix-with-new-stories** (OLD checker restored via `git stash` on `geometry-integrity.mjs`,
storybook rebuilt to pick up the 2 new planted stories): 7252 cells (+24 = 2 new stories × 4 locales ×
3 mobile viewports), 6058 PASS / 828 FAIL (+24, exactly the new stories), elementOverlap=114 (+24).
Confirmed both new stories genuinely FAIL pre-fix:
- `Planted/VisualViolations/Scroll Clipped Overlap` — 12/12 FAIL, `element-overlap` on
  `planted-scroll-row-2 ↔ planted-scroll-footer` and `planted-scroll-row-3 ↔ planted-scroll-footer`
  (exactly the false-positive class being fixed).
- `Planted/VisualViolations/Scroll Visible Overlap` — 12/12 FAIL, `element-overlap` on
  `planted-scroll-visible-a ↔ planted-scroll-visible-b` (the genuine-overlap guard).

**After** (fix restored via `git stash pop`, `FiltersPanelShell` allowlist entry removed, same
storybook build — no story/component changes, only the checker algorithm + allowlist config changed):
7252 cells, 6070 PASS / 816 FAIL, elementOverlap=102 (-12, exactly `ScrollClippedOverlap`'s 12 cells
flipping FAIL→PASS).

## Per-cell diff (before-fix-with-new-stories → after) — the authoritative regression check

A full `story|locale|viewport`-keyed diff across all 7252 cells (comparing `verdict` +
`visualIntegrity.violations`/`.ambiguous` failReason sets, not raw pass totals — legacy Phase-1/2
stories carry known pre-existing failures unrelated to this change) found **25 diffs total**, all
accounted for:

1. **12× `Planted/VisualViolations/Scroll Clipped Overlap`** (sq/en/uk/it × mobile-320/375/390):
   `fail`→`pass`, `element-overlap`→none. **Intended fix.**
2. **12× `AdminSidebar/MobileDrawerOpen`** (sq/en/uk/it × desktop-1024/canonical-1200/desktop-1440):
   verdict UNCHANGED (`out-of-range` both before/after — this story has a `maxWidth` viewport-range
   guard, so these cells never count toward pass/fail either way). The underlying violation/ambiguous
   counts shrank (e.g. 7 `element-overlap`→1, 4 `ambiguous-overlap`→1) — inspected directly: the
   removed entries were nav links (`Property Types`/`Currency`/`Email templates`/`Companies`/`Pages`)
   scrolled out of view in the sidebar's own nav list, geometrically overlapping the footer/logout
   button below — **the exact same false-positive class this task fixes, occurring independently in
   an unrelated pre-existing story** (confirms the fix generalizes correctly, per the kickoff's
   "any other pinned-footer/tall-scroll story added later is covered automatically"). The ONE
   remaining violation (`"Open site" ↔ "Logout"`, both fully visible/unclipped) is correctly still
   flagged — the fix did not over-suppress.
3. **1× `AdminReportsManager/DialogOwnerRow|it|canonical-560`**: verdict UNCHANGED (`fail`→`fail`).
   Inspected directly: `styleIntegrity.signals.fontFamily` differs between the two runs
   (`"Open Sans", system-ui, -apple-system, sans-serif` vs `"Times New Roman"`) — a font failed to
   load in one run, shifting text width/wrapping and moving which specific check fires
   (`offscreen-control` vs `fullWidthButtonsAtMobile`). Nothing in this diff touches font loading or
   CSS — this is an environmental/network flake unrelated to the Check 4 change, and the cell's overall
   verdict (fail) is identical in both runs.

**Zero real PASS/FAIL regressions.** `Planted/OverlappingActions` (56/56 `fail`, unchanged) and
`Planted/AmbiguousOverlap` (56/56 `ambiguous`, unchanged) — the two guard stories the kickoff required
— behave exactly as before. `FiltersPanelShell` passes 16/16 with the allowlist entry removed.

## Files Changed

| File | Rationale |
|---|---|
| `scripts/geometry-integrity.mjs` | Factored `isClippingAncestor` shared predicate; added `getVisibleClippedRect` (walks the full clip-ancestor chain, progressive intersection); wired into Check 4's overlap loop before the ambiguous/violation classification. |
| `scripts/check-stories-rendered.mjs` | Removed the `mantine-primitives-filterspanelshell--default`/`element-overlap` `GEOMETRY_ALLOWLIST` entry (now unnecessary); documented why in a replacement comment. |
| `src/stories/PlantedVisualViolations.stories.tsx` | +2 planted fixtures: `ScrollClippedOverlap` (proves the false-positive fix) + `ScrollVisibleOverlap` (proves the genuine-overlap guard still fires). |
| `docs/storybook-governance.md` | §14.4.2 point 3 (`element-overlap`) extended documenting the clip-awareness mechanism and the guard against over-suppression. |
| `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` | Auto-regenerated by the harness (story/cell counters: +2 stories, +24 cells). |
| `docs/sessions/2026-07-10-task569-geometry-check4-clip-awareness.md` | This log. |

## Acceptance-criteria self-audit

| AC | Where verified | Result |
|---|---|---|
| 1. Check 4 clip-aware via a shared helper with Check 3 (no duplicated logic); genuine painted overlap still FAILs (planted transcript) | `isClippingAncestor` factored once, used by both `findClippingAncestor` and `getVisibleClippedRect`; `ScrollVisibleOverlap` 12/12 FAIL after the fix | ✅ |
| 2. `FiltersPanelShell` passes 16/16 with the allowlist entry REMOVED | Confirmed in the "after" manifest, entry removed from `GEOMETRY_ALLOWLIST` | ✅ |
| 3. `Planted/OverlappingActions` + `Planted/AmbiguousOverlap` behavior unchanged | 56/56 `fail` and 56/56 `ambiguous` respectively, identical before/after | ✅ |
| 4. Full `screenshots:assert` green; no new AMBIGUOUS/FAIL vs baseline except the intended path change | Per-cell diff: 25 total diffs, all explained (12 intended fix, 12 unrelated-story generalization at an out-of-range viewport, 1 environmental font-load flake) | ✅ |
| 5. `docs/storybook-governance.md` documents the fix + removal rationale; Files-Changed table; session log | Done above | ✅ |

## Self-validation

`Self-validation: tsc=0 · check:i18n=PASS (2128×4, unchanged) · check:design-tokens --strict=PASS ·
check:mojibake=PASS (1637 files) · check:file-integrity=PASS (4 files) · check:stories=PASS (110
files) · npx vitest run=1103/1105 (2 pre-existing/environmental, confirmed unrelated —
checksRan===13 stale count, one TZ-invariance timeout) · full screenshots:assert run 3× (baseline,
before-fix-with-new-stories, after) · per-cell diff across all 7252 cells found 25 total diffs, ALL
accounted for (12 intended ScrollClippedOverlap fix, 12 AdminSidebar out-of-range-viewport
generalization of the SAME false-positive class in an unrelated story, 1 environmental font-load
flake unrelated to this change) · zero real PASS/FAIL regressions · Planted/OverlappingActions 56/56
fail unchanged · Planted/AmbiguousOverlap 56/56 ambiguous unchanged · ScrollVisibleOverlap (genuine
overlap inside a scrollable ancestor) 12/12 fail both before and after — the exemption never widens
to "anything inside something scrollable" · FiltersPanelShell 16/16 pass with allowlist entry removed
· scope=clean, no stray files, no leftover processes`. **Git was NOT run** — held for orchestrator
review per the kickoff's AC5.
