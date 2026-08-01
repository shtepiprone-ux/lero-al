# Task 705 — Task 704 revision: scope the capture freeze to reduced-motion emulation

**Status:** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`

Task path: `tasks/kickoff_prompt_Task_705_Task704_Revision_Scope_The_Capture_Freeze.md`

## 1. I0 dirty-worktree manifest / final `git status --porcelain`

**Deviation from the kickoff's expected I0 state.** §3.5 expected 4 entries (incl. `M docs/backlog.md`). Actual I0
`git status --porcelain` had only 3 — `docs/backlog.md` was already committed in `566c21b8c` ("docs(Task705): file
the Task 704 revision…"), the same commit that filed this task's own kickoff. Verified via
`git show --stat 566c21b8c` (touched `docs/backlog.md` + the kickoff file). Not an unexpected/extra entry — a
documented absence, no stop condition per §3.5 ("any **other** entry is a stop and report").

| Start porcelain entry | Path | Owner / classification | Task action | Witness | Start (md5) | End (md5) | Result |
|---|---|---|---|---|---|---|---|
| ` M` | `.storybook/preview-head.html` | OWNED (Task 704, amended by Task 705) | edit (I3) | md5 | `16dbf7584dc7bea7e1402b060480e94a` | `500d97853`-tree (see diff §6) | CHANGED (intended) |
| ` M` | `src/design-system/mantine/skeleton-chrome.css` | EXCLUDED AS UNRELATED (R5, do-not-touch) | none | md5 | `960a9b0f7e03c48978832c0272b6abe6` | `960a9b0f7e03c48978832c0272b6abe6` | **UNCHANGED** |
| `??` | `docs/sessions/2026-08-01-task704-skeleton-shimmer-amplitude.md` | OWNED (Task 704 log, revision note per scope) | edit (I11) | md5 | `ee02d78d31f3a8306c3cfae3fbeb6ec4` | see §7 | CHANGED (intended) |
| (already committed, HEAD) | `docs/backlog.md` | OWNED (scope, I11) | edit (I11) | md5 | `358a4184e6870fc5a34a38f3c420fb29` | see §9 | CHANGED (intended) |

Final `git status --porcelain` (after all edits, before this log's own write):

```
 M .storybook/preview-head.html
 M scripts/check-stories-rendered.mjs
 M src/design-system/mantine/skeleton-chrome.css
?? docs/sessions/2026-08-01-task704-skeleton-shimmer-amplitude.md
```

`skeleton-chrome.css` shows ` M` because it was already dirty at I0 (Task 704's own uncommitted D27 work) — its
content md5 is byte-identical to the I0 witness, confirming R5 (this task never touched it).

## 2. Files Changed

| Path | Reason |
|---|---|
| `.storybook/preview-head.html` | R1 — wrapped Task 704's unconditional `animation:none!important;transition:none!important` freeze in `@media (prefers-reduced-motion: reduce)`; reach (`*, *::before, *::after`) unchanged |
| `scripts/check-stories-rendered.mjs` | R2 — added `await page.emulateMedia({ reducedMotion: 'reduce' })` on the single page-creation site (`captureCell`, before `goto`) |
| `docs/sessions/2026-08-01-task704-skeleton-shimmer-amplitude.md` | revision note pointing here (§7) |
| `docs/backlog.md` | concise active-state update (§9) |
| `docs/sessions/2026-08-01-task705-task704-revision-capture-freeze-scope.md` | this log (new) |

`src/design-system/mantine/skeleton-chrome.css` — **not touched** (R5, confirmed §1).

## 3. Requirement / acceptance-criteria evidence

| Req | AC | Status | Evidence |
|---|---|---|---|
| R1 | AC1 | VERIFIED | `.storybook/preview-head.html` freeze now lives only inside `@media (prefers-reduced-motion: reduce)`; `*, *::before, *::after` reach preserved (diff §6) |
| R2 | AC1 | VERIFIED | `check-stories-rendered.mjs`'s only `browser.newPage()` call (grep-confirmed single site, line 845) gains `page.emulateMedia({reducedMotion:'reduce'})` immediately after, before any `page.goto` (diff §6) |
| R3 | AC2 | VERIFIED | Post-fix same-tree double capture under emulation: `Skeleton/Default` 0/16, `HomepageListingGrids/Loading` 0/16 md5-changed (§5) |
| R4 | AC3 | VERIFIED | `getAnimations()` before (I2, §4): 0 animations, `animationName:"none"`, opacity pinned `1` across two 600ms-apart samples. After (I5, §4), no emulation: 8 running `::after` animations, `animationName:"m_299c329c"`, opacity `0.453426 → 0.839975` across 600ms |
| R5 | AC4 | VERIFIED | `skeleton-chrome.css` final md5 `960a9b0f7e03c48978832c0272b6abe6` == I0 witness; no new `src/` entry in final `git status` (§1) |
| R6 | AC2 | VERIFIED | Pre-fix (I1) vs post-fix (I6) full 1184-cell comparison: 0 FAIL, 0 verdict changes both sides; 20/1184 md5-changed, fully partitioned (§7), none in the two target stories |
| R7 | AC5 | VERIFIED (1 flagged limitation) | All gates below (§8); `check:homepage-grid` flagged per §8/§10 |
| R8 | AC6 | VERIFIED | This log; Task 704 log revision note (§10); `docs/backlog.md` at 80 lines (§9) |

## 4. `getAnimations()` — both readings verbatim

Probed via a throwaway Playwright script (`scripts/task705-probe-skeleton-animations.mjs`, deleted after use —
not part of this task's scope table) serving the built `storybook-static/` and navigating
`iframe.html?id=mantine-primitives-skeleton--default&globals=locale:en&viewMode=story`, sampling
`document.getAnimations()` plus `getComputedStyle(.mantine-Skeleton-root, '::after')` opacity twice, 600ms apart.

**I2 — before the fix, no emulation (owner-reported symptom, reproduced):**

```json
{
  "totalAnimations": 0,
  "details": [],
  "afterOpacitySampleA": "1",
  "afterAnimationName": "none"
}
opacitySampleB (after +600ms): 1
```

**I5 — after the fix (R1+R2 applied, Storybook rebuilt), no emulation (pulse restored):**

```json
{
  "totalAnimations": 8,
  "details": [ /* 8× { playState:"running", pseudoElement:"::after", targetClass:"m_18320242 mantine-Skeleton-root" } */ ],
  "afterOpacitySampleA": "0.453426",
  "afterAnimationName": "m_299c329c"
}
opacitySampleB (after +600ms): 0.839975
```

(8 animations = the story's 8 stacked `Skeleton` cards, `ListingCardSkeleton` fixture — each has its own `::after`
pulse.)

**Sanity check — after the fix, WITH `--emulate-reduced-motion`:** `totalAnimations: 0`, `animationName: "none"`,
opacity `1` both samples — confirms the media-query gate itself, not just its absence, actually freezes motion when
the condition is true.

## 5. Both double-capture runs

**I1 — pre-fix baseline, current (still-unconditional) mechanism**, same tree, two runs:
`2026-08-01T17-11` vs `2026-08-01T17-40`. Summary A: 1162 PASS/0 FAIL/22 AMBIGUOUS. Summary B: 1161 PASS/**1
FAIL**/22 AMBIGUOUS — `Mantine/Primitives/Drawer/Default` uk@mobile-320, `blank-canvas`, a transient capture flake
(same class Task 704's own session log recorded for `Separator/Default`); not reproduced in run A, not a target
story, not investigated further.

- `Skeleton/Default`: **0**/16 md5-changed.
- `HomepageListingGrids/Loading`: **0**/16 md5-changed.

**I6 — post-fix, harness now emulates**, same tree, two runs: `2026-08-01T18-12` vs `2026-08-01T18-41`. Both: 1162
PASS/0 FAIL/22 AMBIGUOUS (identical distributions, no flake this pair).

- `Skeleton/Default`: **0**/16 md5-changed.
- `HomepageListingGrids/Loading`: **0**/16 md5-changed.

R3 satisfied: 0/0 under emulation, matching I1's own pre-fix 0/0 (Task 704's own final result).

## 6. Diffs — `preview-head.html` and `check-stories-rendered.mjs`, in full

```diff
--- a/.storybook/preview-head.html
+++ b/.storybook/preview-head.html
@@ -46,6 +46,25 @@
     window.Date = FrozenDate;
   })();
 </script>
+<style>
+  /* Frozen Storybook preview motion, capture-only (Task 704 R4/R5, revised Task 705 — Task 704
+     review F1, 2026-08-01). Task 704's freeze was unconditional, which also froze the pulse for
+     every human visitor to Storybook, invisibly regressing the D27 feature on the one surface the
+     team reviews it on. Scoped here to `prefers-reduced-motion: reduce` — the same standard media
+     feature Task 704 already keyed the Skeleton's own accessibility rule to
+     (skeleton-chrome.css R6) — so it applies only when the capture harness emulates that condition
+     (scripts/check-stories-rendered.mjs, Task 705 R2) or a real OS/browser reduced-motion setting is
+     on, never to a default browser tab. Reach (`*, *::before, *::after`) intentionally unchanged
+     (Task 705 A2): narrowing it to Skeleton alone would leave every other animating story
+     non-deterministic under emulation. Scoped to this Storybook-only file, never loaded by the real
+     app (src/app/layout.tsx has no reference to it, verified at Task 704 I8). */
+  @media (prefers-reduced-motion: reduce) {
+    *, *::before, *::after {
+      animation: none !important;
+      transition: none !important;
+    }
+  }
+</style>
 <!-- Fonts from Google Fonts CDN — mirrors src/app/layout.tsx font setup -->
 <link rel="preconnect" href="https://fonts.googleapis.com">
 <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

```diff
--- a/scripts/check-stories-rendered.mjs
+++ b/scripts/check-stories-rendered.mjs
@@ -844,6 +844,13 @@ async function captureCell(browser, storyUrl, story, locale, viewport, filename,
   try {
     page = await browser.newPage();
 
+    // Task 705 R2 — every capture page emulates prefers-reduced-motion:reduce, matching the
+    // condition .storybook/preview-head.html's capture-only freeze is now keyed to (Task 705,
+    // Task 704 review F1). Without this, the preview no longer freezes animation/transition for a
+    // default-media Playwright page, and the rendered comparator's determinism proof (R3/R6) would
+    // flake on every animating story (Skeleton, Loader spinners, Modal/Drawer transitions).
+    await page.emulateMedia({ reducedMotion: 'reduce' });
+
     // ── Render-failure signal collectors (attached before goto) ────
     const pageErrors = [];
     const consoleErrors = [];
```

Confirmed via grep that `browser.newPage()` occurs exactly once in this file (line 845) — this is the only capture
page, so R2's "every capture page" is satisfied by this single site.

## 7. Rendered comparison and changed-cell partition (R6)

**Pair:** I1 pre-fix baseline (`2026-08-01T17-11`) vs I6 post-fix run A (`2026-08-01T18-12`). Full 1184-cell
comparison, matched by `storyId`+`locale`+`viewport`.

- **0 FAIL both sides, 0 verdict changes** (every `pass` field identical).
- **20/1184 md5-changed**, partitioned:

| Story | Cells | Attribution |
|---|---|---|
| `Skeleton/Default` | **0** | target story — 0 changed cells |
| `HomepageListingGrids/Loading` | **0** | target story — 0 changed cells |
| `MobileBottomNavView/Guest` | 1 | §14.11 documented harness-noise-set story |
| `PopularLocationsView/Default` | 4 | §14.11 documented harness-noise-set story |
| `PopularLocationsView/Long City Name` | 1 | §14.11 documented harness-noise-set story |
| `ListingDetailPattern/Default` | 1 | §14.11 documented harness-noise-set story |
| `ListingGalleryPattern/Default` | 1 | §14.11 documented harness-noise-set story |
| `LightboxView/Default` | 2 | D14 (Task 686) Modal-transition capture-noise precedent |
| `RangeDatePicker/Default` | 5 | **D26-eligible** — see below |
| `TwoColumnForm/Default` | 4 | **D26-eligible** — see below |
| `Alert/Default` (uk@mobile-320) | 1 | **flagged, not D26-eligible** — see below |

**D26 verification for `RangeDatePicker/Default` (5 cells) + `TwoColumnForm/Default` (4 cells):**

1. Attribution — this task's diff is `preview-head.html` CSS + `check-stories-rendered.mjs` harness code, neither
   imported by `RangeDatePicker`/`TwoColumnForm` or their story fixtures.
2. 0 FAIL / 0 verdict changes globally — confirmed above.
3. Assertion payload identical (Mantine-ID-normalized, per §14.11's `stableSelector()` precedent) for all 9 cells —
   verified by diffing `{pass, assertions}` with `/mantine-[a-z0-9]+/g` stripped: **all 9 `true`**.
4. Same-tree stability control exists on **this** tree: pre-fix same-tree pair (`17-11` vs `17-40`) already shows
   `RangeDatePicker/Default` 6/16 and `TwoColumnForm/Default` 6/16 changed with zero code diff; post-fix same-tree
   pair (`18-12` vs `18-41`) shows 4/16 and 4/16. Pixel-diffed (`sharp`, raw RGBA, max per-channel delta): **all 9
   cells max channel delta = 1/255** — inside the `≤2/255` bound.

All 4 D26 conditions met — folded into standing noise, not a rendered regression.

**`Alert/Default` uk@mobile-320 — flagged, NOT D26-eligible (matches Task 704's own precedent for severe
pre-existing noise, e.g. `PopularLocationsView/Long City Name` sq@390 at 245/255):**

- Pixel-diffed: **max channel delta = 241/255** — far outside D26's `≤2/255` bound.
- Same-tree-proven pre-existing: the pre-fix zero-code-diff control (`17-11` vs `17-40`) already shows this **exact**
  cell (`Alert/Default`, uk, mobile-320) changing with zero code touched. Post-fix same-tree control (`18-12` vs
  `18-41`) shows `Alert/Default` **0/16** changed (did not reproduce that run).
- Not caused by, and not fixed by, this task's diff (no import path from either changed file to `Alert` or its
  fixtures). Reported per Task 704's own precedent (§6 of its log): flagged for owner/reviewer attention, not
  silently resolved or hidden.

## 8. Validation evidence — exact commands, actual results

| Command | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run check:stories` | ✅ 127 files, 0 violations |
| `npm run check:story-coverage` | ✅ 15/15 |
| `npm run check:i18n` | ✅ 2215×4, no raw-enum leaks |
| `npm run check:design-tokens` | 28/0/0 (unchanged pre-existing baseline, none in touched files — matches Task 704's own figure) |
| `npm run check:homepage-grid` (1st run) | 259/260 PASS, 1 FAIL — `Featured @ en@320` blank-canvas |
| `npm run check:homepage-grid` (rerun) | **260/260 PASS, 0 FAIL** — cleared, transient (Task 704's own log recorded an identical-class `it@640` transient flake on this same gate) |
| `npx vitest run` | 1190/1192 (2 failures: `date-format-ssr-parity` TZ-invariance, `RangeDatePicker.smoke.test.tsx` "tapping days alone" — both inside the documented full-run-only-timeout trio; `RangeDatePicker` is A3's pre-existing failure, not touched here) |
| `npm run build-storybook` (post-R1 tree, before I5) | exit 0 |
| `screenshots:assert -- --mantine-only` ×2 (I1, pre-fix) | 0/0 md5-changed on target stories; 1 transient FAIL on an unrelated story in run B only |
| `screenshots:assert -- --mantine-only` ×2 (I6, post-fix) | 0/0 md5-changed on target stories; 0 FAIL both runs |
| `npm run build` | exit 0, 40/40 static pages, **54 route rows** (machine-counted from the printed table) |
| `npm run check:file-integrity` (pre-records) | ✅ 4 files clean |
| `npm run check:mojibake` (pre-records) | ✅ 0 artifacts / 2030 files |
| `npm run check:file-integrity` (post-records, final) | ✅ 6 files clean |
| `npm run check:mojibake` (post-records, final) | ✅ 0 artifacts / 2031 files |

## 9. Backlog update

`docs/backlog.md`'s "Last Session (2026-07-29)" heading's single paragraph gained one sentence appending Task 705's
outcome to the existing Task 704 entry (same physical-line convention this file already uses), keeping the file at
**80 physical lines** (unchanged from before this task).

## 10. Task 704 session log — revision note

Appended a short pointer section at the end of
`docs/sessions/2026-08-01-task704-skeleton-shimmer-amplitude.md` (§15, below its existing §13 Opus handoff /
§14 backlog-update sections) noting the Task 705 revision, the F1 defect it fixes, and pointing to this log.

## 11. Self-review findings

- Caught before implementation: the kickoff's §3.5 expected 4 dirty I0 entries; only 3 were present because
  `docs/backlog.md`'s kickoff-filing edit had already landed in `HEAD` via `566c21b8c` — verified via `git show
  --stat`, documented as a non-blocking deviation rather than silently treated as "clean" (§1).
- Caught during I9: `check:homepage-grid`'s first run showed 1 FAIL (`Featured @ en@320` blank-canvas); a rerun
  cleared it to 260/260. Investigated whether this gate needs `emulateMedia` too (§8 of the kickoff explicitly
  anticipates this as a possible finding): confirmed via grep that `check-homepage-grid.mjs` never calls
  `emulateMedia` at any of its 3 `browser.newPage()` sites — it captures under default media, meaning Skeleton (and
  any other animating primitive) now genuinely animates during its captures too. Per the kickoff's explicit
  instruction ("report as a finding; fix here only if R3/R6 cannot pass without it"), **not fixed here** — R3/R6
  passed via `screenshots:assert`, not this gate. Recorded as a limitation (§12).
- Caught during I7: one cell (`Alert/Default` uk@mobile-320) exceeded D26's `≤2/255` bound by a wide margin
  (241/255). Rather than folding it into D26 or silently ignoring it, traced it to the pre-fix same-tree
  zero-code-diff control, where the identical cell already flakes — confirming pre-existing harness instability
  unrelated to this task, and flagged rather than hidden (§7), consistent with Task 704's own precedent for
  similarly severe non-D26 noise.
- Not resolved: `RangeDatePicker.smoke.test.tsx`'s pre-existing vitest timeout (A3, carried from Task 704); the
  `check:homepage-grid` emulation gap (§12); the `Alert/Default` uk@320 severe pre-existing noise cell (§7).

## 12. Assumptions, deviations, and limitations

- **A3 observation.** `RangeDatePicker.smoke.test.tsx` failed in the full `vitest run` ("tapping days alone does NOT
  fire onChange") with the same `Test timed out in 5000ms` signature Task 704's own I1/final runs recorded. Not
  investigated further per A3; this task's diff (2 files, neither imported by that test) has no plausible causal
  path.
- **I0 deviation.** See §1 — `docs/backlog.md` was not dirty at I0 because its kickoff-filing edit was already
  committed; not a stop condition, documented instead.
- **Limitation — `check:homepage-grid` emulation gap (§8 of the kickoff, explicitly anticipated).**
  `scripts/check-homepage-grid.mjs` does its own page setup (3 independent `browser.newPage()` call sites, grep-
  confirmed) and never calls `page.emulateMedia({reducedMotion:'reduce'})`. Under the OLD unconditional freeze this
  didn't matter (every page was frozen regardless of media state); under the NEW scoped freeze, this gate's capture
  pages now render with Skeleton and other animations genuinely running by default, same as a real browser tab.
  This run's single FAIL cleared on rerun (transient, matching Task 704's own precedent for this exact gate), but
  the underlying exposure — a loading/skeleton-anchored cell captured against a moving target — is real and was not
  present before this task's fix. Not fixed here per the kickoff's explicit instruction; flagged for the owner/
  reviewer to decide whether `check-homepage-grid.mjs` needs the same one-line `emulateMedia` addition this task
  gave `check-stories-rendered.mjs`.
- `docs/backlog.md`'s hard 80-line limit continues to hold only because this task's addition was a single
  appended sentence, not a new paragraph — no `BACKLOG LIMIT BREACH`.

## 13. Opus handoff

- Re-derive the I1/I6 same-tree 0/0 pairs independently from `.screenshots/rendered-assert/2026-08-01T{17-11,17-40,
  18-12,18-41}/manifest.json` plus their PNGs.
- Re-derive the I7 20-cell partition, in particular the D26 4-condition check for `RangeDatePicker`/`TwoColumnForm`
  (§7) and the `Alert/Default` uk@320 same-tree-flake evidence.
- Decide whether `check-homepage-grid.mjs` needs its own `emulateMedia` addition (§12) — own blast radius per the
  kickoff's §8, a candidate follow-up task rather than a rider here.
- Confirm the `getAnimations()` before/after pair (§4) is accepted as AC3's decisive artifact.

## 14. Backlog update (repeated per completion-report contract §14.14)

See §9 — one appended sentence to the existing Task 704 paragraph in `docs/backlog.md`'s "Last Session" section,
file held at 80 physical lines.
