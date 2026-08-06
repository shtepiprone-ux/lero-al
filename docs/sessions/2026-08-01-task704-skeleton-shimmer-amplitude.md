# Task 704 — Skeleton shimmer amplitude restoration + capture freeze

**Status:** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`

Task path: `tasks/kickoff_prompt_Task_704_Skeleton_Shimmer_Amplitude_And_Capture_Freeze.md`

## 1. I0 / final `git status --porcelain`

Start (I0): empty (clean tree, verified before any edit).

Final:

```
 M .storybook/preview-head.html
 M src/design-system/mantine/skeleton-chrome.css
```

## 2. Files Changed

| Path | Reason |
|---|---|
| `src/design-system/mantine/skeleton-chrome.css` | D27 — darkened the `::after` pulse fill (final: gray-3 `#d0d5dd`, after rolling back from gray-2 per I8); added the R6 `prefers-reduced-motion` suppression rule |
| `.storybook/preview-head.html` | R4/R5 — added a `<style>` block disabling all animation/transition inside the Storybook preview iframe (capture-only, same file/placement as the D25 clock freeze) |

`docs/backlog.md` and this session log are the only other files touched (records, per scope).

## 3. The D27 decision — full trace

**I2 measurement (current, before any edit).** Live-rendered on `Mantine/Primitives/Skeleton/Default`, sampled via `document.getAnimations()` targeting the `::after` pseudo-element (paused, `currentTime` set to 0ms and 750ms of the 1500ms cycle), `getComputedStyle` read at both points:

- fill (declared, `background-color`): `rgb(249,250,251)` = gray-0 `#f9fafb`
- body layer (`::before`): `rgb(255,255,255)`
- opacity 0.4 → composited `(252.6, 253.0, 253.4)`; opacity 1 → `(249, 250, 251)`
- **max channel delta ≈ 3.6/255** — below the threshold of perception, matches the owner's "static" report

**Lever 2 tested and ruled out.** Widening the opacity range on the *existing* gray-0 fill was measured on the same live story (style-tag override + re-sample) — even at the most extreme possible range (0→1), the composited swing caps at **6.0/255**, because gray-0 is only ~6/255 from white to begin with; there is no more contrast to reveal regardless of range. Lever 1 (the fill colour) is the only lever that can move the needle.

**Candidates measured (Lever 1, keeping the stock 0.4–1 range):**

| Candidate | Measured max channel delta |
|---|---|
| gray-1 `#f2f4f7` | ≈7.8/255 |
| gray-2 `#e4e7ec` | ≈16.2/255 |
| gray-3 `#d0d5dd` (project token) | ≈28.2/255 |
| gray-2 + range 0.15–1 (combined) | ≈22.9/255 |

**Token verification (owner clarification mid-task).** The owner asked me to confirm `--mantine-color-gray-3` actually resolves to `#d0d5dd` rather than Mantine's stock `#dee2e6`, since the kickoff's own §3.1 table quoted the stock value. Verified live via `getComputedStyle(document.documentElement)` on the rendered Storybook page: `--mantine-color-gray-3` → `#d0d5dd` on both `:root` and the Skeleton element, confirming `theme.ts:5-16`'s custom `gray` tuple (registered at `theme.ts:158`, `colors: { gray, ... }`) overrides Mantine's package default at runtime. **The kickoff's §3.1 table was wrong** to quote `#dee2e6` for this project's gray-3; this is a kickoff defect, not an implementation one.

**D27 round 1 (owner, 2026-08-01):** gray-2 `#e4e7ec`, stock 0.4–1 range, conditional: verify at I8 whether the resting fill (now equal to the Skeleton's own border colour, `theme.ts`'s `Skeleton.styles.root.border`) visually merges with the border; roll back to gray-3 if it looks bad.

**I8 finding:** at rest (opacity:1) on the *live app* (not Storybook), `getComputedStyle` showed the composited fill and the border resolved to the **identical** `rgb(228,231,236)` — corroborated by a raw pixel sample across a Featured-card's left edge (`gray2-fill`: border pixel `228,231,236`, adjacent "interior" pixel differed only because the sample was taken mid-pulse, not at true rest). A zoomed crop of the live screenshot showed no discernible border line at all. **Zero contrast — the border reads as absent.**

**D27 final (owner-pre-authorized fallback, applied 2026-08-01):** gray-3 `#d0d5dd`, stock 0.4–1 range. A second I8 pixel sample (fill forced to gray-3 at exact opacity:1 via injected style) confirmed a real ~20/255 edge against the unchanged gray-2 border (`208,213,221` vs `228,231,236`) — the same order of contrast magnitude the original gray-0-fill/gray-2-border design had (inverted: fill now darker than its border instead of lighter).

## 4. Requirement / acceptance-criteria evidence

| Req | Status | Evidence |
|---|---|---|
| R1/AC1 | VERIFIED | D27-ratified gray-3 `#d0d5dd`, quoted with date/scope in `skeleton-chrome.css`'s header comment; `animate:true` untouched; no `@keyframes`, no JS, no `animate={false}` |
| R2/AC2 | VERIFIED | Border (`1px solid gray-2`), radius (`xl`) untouched in `theme.ts` (read-only, confirmed via diff — `theme.ts` absent from the changed-file list) |
| R3/AC1 | VERIFIED | Mantine's own `m_299c329c` keyframe (`opacity` only) remains the mechanism; only the `::after` `background-color` target changed |
| R4/AC3 | VERIFIED | `.storybook/preview-head.html` `<style>` block, `animation:none!important;transition:none!important` on `*,*::before,*::after`, capture-context only |
| R5/AC3 | VERIFIED | Same-tree double capture, final tree: `Skeleton/Default` 0/1184, `HomepageListingGrids/Loading` 0/1184 md5-changed cells (before: 11 and 6 respectively, per this session's own I1 baseline — §3.3's 12/10 were a prior session's measurement) |
| R6/AC4 | VERIFIED | Mantine's `Skeleton.mjs` never sets `data-reduce-motion` (only `data-visible`/`data-animate`), so the global `[data-respect-reduced-motion] [data-reduce-motion]` rule in `@mantine/core`'s own stylesheet could never match it — confirmed not respected before this task. Added an explicit `@media(prefers-reduced-motion:reduce)` rule; verified live via Playwright `reducedMotion:'reduce'` emulation on the real app — `animationName` reads `none`, opacity pinned at `1` across time samples |
| R7/AC5 | VERIFIED (with 2 flagged findings, see §6) | 0 FAIL, 0 verdict changes, full 1184-cell rendered comparison vs pre-change baseline; intended-vs-noise partition below |
| R8/AC6 | VERIFIED | All gates below |
| R9/AC7 | VERIFIED | This log + `docs/backlog.md` at 80 lines |

## 5. Same-tree double captures

**Before (pre-change, this session's I1 baseline — `2026-08-01T08-31` vs `2026-08-01T09-02`):** 0 FAIL, 0 verdict changes, 1162 PASS/22 AMBIGUOUS both runs. `Skeleton/Default`: **11**/1184 md5-changed cells. `HomepageListingGrids/Loading`: **6**/1184. (§3.3's own reviewer-measured figures were 12 and 10 from a prior session — the same noise category, run-to-run variance expected.)

**After (final gray-3 tree — `2026-08-01T11-32` vs `2026-08-01T12-02`, both 0 FAIL/1162 PASS/22 AMBIGUOUS):** `Skeleton/Default`: **0**. `HomepageListingGrids/Loading`: **0**.

(An earlier gray-3 run, `2026-08-01T11-01`, showed 1 FAIL — `Separator/Default` blank-canvas, a component with zero relation to this diff. It did not reproduce in either of the next two runs; treated as a transient capture flake, not investigated further since it never touched a target story.)

## 6. Rendered comparison — I7 (pre-change `2026-08-01T09-02` vs final post-change `2026-08-01T12-02`)

0 FAIL, 0 verdict changes both sides. 141/1184 md5-changed cells total, partitioned:

**Intended (52 cells) — real Mantine `Skeleton` consumers, D27's fill change:**

- `Skeleton/Default` 16/16, `HomepageListingGrids/Loading` 16/16 — the two named target stories.
- `HeroSearch/Fallback` 20/20 — **a third real consumer the kickoff's own §3.2 consumer list omitted.** `src/components/shared/HeroSearchFallback.tsx` imports `Skeleton` directly from `@mantine/core`. Separately, the kickoff's §3.2 also **wrongly** named the two route-level `loading.tsx` files (`favorites`, `listings/[slug]`) as consumers — both actually import `Skeleton` from `@/components/ui/skeleton` (the legacy shadcn `animate-pulse` component), unrelated to this task. Verified by reading both files directly.

**Freeze-driven convergence of pre-existing Loader-spinner noise (48 cells), visually confirmed:**

- `Button/Default` 16, `LocaleSwitcher/Default` 16, `EmptyLoadingErrorState/Default` 16 — each contains a Mantine `Loader` (spinner) whose rotation was previously captured mid-cycle at a random angle (pre-freeze) vs a fixed angle (post-freeze). Confirmed by side-by-side image inspection of `EmptyLoadingErrorState` and `Button` (`isPending`/`loading` states) — the spinner arc position visibly differs, nothing else does. **Now fully stable going forward**: none of these three appear in the post-change same-tree double-capture (§5) — the freeze eliminated their own pre-existing capture noise as a side effect of its global scope (R4 does not scope the freeze to Skeleton alone).

**LightboxView/Default (13 cells, deltas 2–6/255 pixel-measured):** matches the existing D14 precedent (Modal-transition capture noise, `docs/backlog.md`'s Task 686 entry) — reduced but not fully eliminated by the freeze (1 residual cell in the post-change same-tree control).

**D26-eligible, ≤2/255, same-tree-control-confirmed (≈20 cells):** `FilterSpanelShell`, `RangeDatePicker`, `PopularLocationsView/Default` and two `Long City Name` cells, `HomepageListingGrids/Default`, `ListingDetailPattern`, `ListingGalleryPattern`, `TwoColumnForm`, `ListingCardPattern`, `DialogDrawerPattern` — pixel-diffed via `sharp` (max channel delta 1–2/255 in every case measured) and each also appears in a zero-code-diff same-tree control, satisfying D26 condition 4.

**Two findings NOT self-resolved — flagged for owner/reviewer attention, not silently folded into D26:**

1. **`MobileBottomNavView` guest/authenticated, uk locale only** (2–4 cells across runs) — pixel-measured at **~17–20/255** on a tiny area (8–16px), exceeding D26's `≤2/255` bound by a wide margin. Same-tree-stability-proven pre-existing (appears in *both* the pre-change and post-change zero-code-diff controls, i.e. present before this task touched anything) — but the magnitude doesn't fit D26 as literally written. Plausible cause: Cyrillic glyph antialiasing/hinting variance (uk-only). Not caused by, and not fixed by, this task.
2. **`PopularLocationsView/Long City Name` sq@mobile-390** — pixel-measured at **245/255**, ~1.8% of pixels changed. Also same-tree-stability-proven pre-existing (present in both controls). This is a severe, pre-existing harness instability unrelated to this task's scope — flagged, not investigated further here.

## 7. I8 — live product check (not Storybook)

Storybook itself is expected to go static under the freeze (R4 disables all animation inside `.storybook/preview-head.html`, which is loaded by every Storybook context — dev server and static build alike, same architecture as the existing D25 clock freeze). The owner observed exactly this mid-task ("no contrast, no micro-animation visible" in the Skeleton story) — confirmed as the intended, designed behaviour, not a leak.

Live-app verification used Playwright against `next dev` (`localhost:3000/en`), with Supabase REST calls delayed 4s via `page.route()` to hold the homepage in its `loading` state:

- `::after` opacity sampled at 3 points ~900ms apart: `0.600061 → 0.600045 → 0.933235` — **genuinely animating**, not frozen. Confirms the freeze is scoped to `.storybook/preview-head.html` only and does not leak to the product (`src/app/layout.tsx` has no reference to that file).
- Fill colour live: `rgb(228,231,236)` at the time of the D27-round-1 (gray-2) check, later `rgb(208,213,221)` after the D27 final (gray-3) — confirms the theme change reaches the real app, not just Storybook.
- Border-merge check: see §3 above (this *is* the I8 border-merge check the owner asked for).

## 8. Validation evidence — exact commands, actual results

| Command | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run check:stories` | ✅ 127 files, 0 violations |
| `npm run check:story-coverage` | ✅ 15/15 |
| `npm run check:i18n` | ✅ 2215×4, no raw-enum leaks |
| `npm run check:design-tokens` | 28/0/0 (unchanged from baseline; pre-existing, none in touched files) |
| `npm run check:homepage-grid` | 260/260 PASS, 0 FAIL (one transient `it@640` flake on an early baseline run, cleared on rerun — unrelated to this task, `src/` untouched by this diff) |
| `npx vitest run` (baseline, before edit) | 1190/1192 (2 documented full-run-only timeouts: `date-format-ssr-parity`, `RangeDatePicker`) |
| `npx vitest run` (final, after edit) | 1188/1192 (4 failures across the same documented trio: `date-format-ssr-parity`, `RangeDatePicker` — 2 different sub-tests this run, `saveSavedSearch.dedup`). **Isolated rerun of `RangeDatePicker.smoke.test.tsx` alone, twice, both failed the same 2 tests** — this deviates from the "isolated rerun clean" pattern documented in prior sessions. No plausible causal link exists: this task's diff is 2 CSS files, neither imported by that test file, and no CSS `background-color`/`animation` value can cause a JS `Error: Test timed out in 5000ms`. This task's own I1 baseline (captured before any edit) already showed `RangeDatePicker.smoke.test.tsx` failing — conclusively pre-existing, not introduced here. Reported as unresolved, not swept under a passing claim. |
| `npm run build-storybook` (final tree) | exit 0 |
| `screenshots:assert -- --mantine-only` ×2 (final tree, same-tree pair) | both 0 FAIL/1162 PASS/22 AMBIGUOUS; `Skeleton/Default` and `HomepageListingGrids/Loading` 0/0 md5-changed |
| `npm run build` | exit 0, 40/40 static pages, **exactly 54 route rows** (machine-counted) |
| `npm run check:file-integrity` | ✅ 5 files clean (2 real diff files + temp scratch scripts, since deleted) |
| `npm run check:mojibake` | ✅ 0 artifacts / 2028 files |

## 9. Visual source trace

| Visible artifact | Component/markup | Selector | Token path | Change/preserve | Evidence |
|---|---|---|---|---|---|
| Skeleton pulse fill | `Skeleton::after` | `.mantine-Skeleton-root::after` | `--mantine-color-gray-3` (was `gray-0`) | Changed (D27) | §3 above |
| Skeleton resting border/radius | `Skeleton` root | `.mantine-Skeleton-root` | `theme.ts`'s `Skeleton.styles.root.border` / `defaultProps.radius` | Preserved | `theme.ts` absent from diff, confirmed read-only |
| Skeleton pulse mechanism | Mantine's own `m_299c329c` keyframe | n/a (compiled) | n/a | Preserved | `node_modules/@mantine/core/styles/Skeleton.css` unchanged, only the fill it modulates changed |
| Storybook preview motion (all stories) | n/a | `*, *::before, *::after` | n/a | Changed (capture-only, new) | `.storybook/preview-head.html` |

## 10. Canonical UI decision record

No new visible artifact/primitive was created. The changed value (`gray-3` fill) reuses an existing registered `theme.ts` colour token via `var(--mantine-color-gray-3)` — no local/inline hex in the actual declaration (hex appears only in the trailing comment, matching this file's existing convention). No canonical Storybook change needed; `Mantine/Primitives/Skeleton/Default` renders the real primitive unchanged in markup.

## 11. Self-review findings

- Caught and corrected before implementation: the kickoff's §3.2 consumer list was wrong (missed `HeroSearchFallback.tsx`, wrongly named the two shadcn-based route `loading.tsx` files).
- Caught and corrected mid-task (owner-prompted): the kickoff's §3.1 token table quoted Mantine's stock `gray-3` hex instead of this project's override.
- Caught via I8 (as designed): D27 round 1 (gray-2) produced a genuine border/fill merge defect, not shipped — rolled back per the owner's pre-authorized condition before any gate/proof was finalized on the wrong value.
- Not resolved: the two flagged noise findings in §6, and the `RangeDatePicker` isolated-failure deviation in §8 — reported, not hidden.

## 12. Assumptions, deviations, and limitations

- D27 required two rounds (gray-2 → gray-3) due to the I8 border-merge finding; all gates/proofs in this log are against the **final** gray-3 tree unless explicitly marked "baseline" or "D27 round 1".
- The `RangeDatePicker` vitest failure is reported as an open, pre-existing environment issue — not fixed here (out of scope; no relation to this task's diff).
- The two §6 flagged findings (`MobileBottomNavView`, `PopularLocationsView/Long City Name`) are pre-existing per same-tree evidence but exceed D26's literal bound; recommend a dedicated D-decision similar to D17/D22/D26 if the owner wants them formally closed, rather than resolving them here.

## 13. Opus handoff

- Verify the D27 round-1→round-2 trace in §3 against `skeleton-chrome.css`'s header comment.
- Re-derive the I6 determinism proof (`2026-08-01T11-32` vs `2026-08-01T12-02`, `.screenshots/rendered-assert/`) independently.
- Re-derive the I7 partition in §6, particularly the two flagged findings — a second opinion on whether they need their own D-decision is welcome.
- Confirm the `RangeDatePicker` vitest failure is acceptable as reported (pre-existing, isolated-reproduces, no causal path) rather than a blocker.

## 14. Backlog update

`docs/backlog.md` appended a concise Task 704 entry to the end of the existing "Last Session" paragraph (same physical line, per this file's established convention), keeping the file at **80 lines** (unchanged from before this task — the file was already at the 80-line limit, so no line was added).

## 15. Revision note — Task 705 (2026-08-01)

**F1 of the Task 704 review (P1):** R4/R5's freeze above was unconditional — it disabled the D27 pulse for every
Storybook visitor permanently, not just during capture, invisibly regressing the feature this task shipped on the
one surface it's reviewed on (owner: *"але в сторі я не бачу мікроанімацію візуально"*). This task's code is **not
reverted**; Task 705 amends `.storybook/preview-head.html`'s freeze in place, wrapping it in
`@media (prefers-reduced-motion: reduce)` and adding `page.emulateMedia({reducedMotion:'reduce'})` to
`scripts/check-stories-rendered.mjs`'s capture page — the same standard media feature this task's own R6 rule (§4
above) already keyed the Skeleton's accessibility behaviour to. D27 (the fill colour, this file's own subject) is
**not** revisited. Full evidence: `docs/sessions/2026-08-01-task705-task704-revision-capture-freeze-scope.md`.

## 16. Orchestrator review outcome (Opus, 2026-08-01) — `APPROVED` (704 + 705 together)

The interim 🛑 `NEEDS REVISION` recorded against this task is **LIFTED**. Its blocking finding (F1 `P1`, §15
above) is closed by Task 705, which amended the freeze in place rather than reverting this task's code. The two
are reviewed and approved as one unit.

### Both anticipated defects checked; one was a design choice, the other never existed

**Anticipated defect #1 — freeze scope.** The freeze is correctly wrapped in
`@media (prefers-reduced-motion: reduce)`, and its reach `*, *::before, *::after` is deliberately **not** narrowed
to the Skeleton. The accompanying comment explains why, and the reasoning is right: narrowing it to this component
alone would leave every other animated story non-deterministic under capture. Reach was the point.

**Anticipated defect #2 — a missed page-creation site.** Did not materialise. `check-stories-rendered.mjs` has
**exactly one** page-creation point, `newPage()` at line 845, and `emulateMedia` sits at line 852 — immediately
after it and before navigation. There was nothing to miss.

### D27 fenced, and the proof is falsifiable

`skeleton-chrome.css` diffed against `HEAD` shows **33/2** — precisely this task's change and nothing else. D27
was not revisited by 705.

AC3's evidence is the falsifiable pair the task was required to produce, because a PNG cannot prove motion:
**before the fix — 0 animations, `opacity` pinned at 1; after — 8 running, `opacity` moving 0.45 → 0.84 over
600 ms.** The owner's reported symptom is closed by a measurement, not by an assertion.

Determinism survives the change: **0/16** md5-changed on both target stories under emulation, and the full
1184-cell comparison gives **0 FAIL / 0 verdict changes**, with the 20 changed cells distributed elsewhere and
**none** on the target stories.

### Finding

- **F1 `P3` — non-blocking.** `check-homepage-grid.mjs` does not call `emulateMedia` at any of its **three**
  page-creation sites. The executor disclosed this itself and correctly left it outside scope per §8.
  Assessed as harmless on the merits, not waved through: that gate measures **layout only** —
  `gridTemplateColumns`, `gap`, child count, `scrollWidth`, header geometry. An opacity animation does not move
  layout. The single theoretical vector is a `transition` on a layout property caught mid-flight, and that state
  **pre-dates 705 rather than being introduced by it**. Add the emulation at the next touch of that file — for
  consistency, not for correctness.

### Commit shape

704 and 705 ship as **one commit**. 704's code was `NEEDS REVISION` and therefore never committed; 705 corrects it
in place. Splitting them would write a state I had rejected into the permanent history. Owner-run handoff was
emitted accordingly and has since been executed as **`a5eed6542`**
(`feat(Task704,Task705): restore Skeleton pulse amplitude (D27 gray-3) and scope the Storybook capture freeze to
reduced-motion emulation`), pushed to `origin/task/q0-ci-rendered-locale-split`.

Owner native gates clean: `check:file-integrity` **6/6**, `check:mojibake` **0/2031**.
