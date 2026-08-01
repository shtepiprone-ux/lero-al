# Task 703 — Port the skeleton-count invariant (I-D) into `check:homepage-grid`

**Status: IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW**

Handoff: `tasks/kickoff_prompt_Task_703_Skeleton_Count_Invariant_ID.md` under
`.claude/skills/execute-task/SKILL.md`. Origin: finding F1 (P2) of the Task 701 review, 2026-07-31.

## 1. Files Changed

| Path | Action | Reason |
|---|---|---|
| `scripts/check-homepage-grid.mjs` | **modified** | Added invariant I-D (loading-branch grid direct-children count 3/4) to the existing gap-matrix pass, plus a seventh `--verify-gate` plant proving it trips. |
| `docs/backlog.md` | **modified** | Concise active-state entry for 703 (§7 below). |
| `docs/sessions/2026-08-01-task703-skeleton-count-invariant.md` | **created** | This session log. |

No file under `src/` was touched. No probe was edited, renamed, or deleted.

## 2. I0 / final `git status --porcelain` + probe md5s

**I0 (start, verbatim):**
```
(empty)
```

**Probe md5s at I0:**
```
4d79ac2e3cdcb63629452eaf237e66cc *scripts/task668-qa-grid-1440.mjs
dd6fcd9c2989cbb11ac0caf38205278e *scripts/task420-qa-grid-step.mjs
1a43b7ee898c415527f70db9ecefb386 *scripts/task668-qa-header-geometry.mjs
```

**Mid-implementation git status (after I3/I4, before I8 records):**
```
 M scripts/check-homepage-grid.mjs
```

**Probe md5s re-checked mid-implementation — unchanged:**
```
dd6fcd9c2989cbb11ac0caf38205278e *scripts/task420-qa-grid-step.mjs
4d79ac2e3cdcb63629452eaf237e66cc *scripts/task668-qa-grid-1440.mjs
1a43b7ee898c415527f70db9ecefb386 *scripts/task668-qa-header-geometry.mjs
```

**`git diff --stat` (scoped file only):**
```
 scripts/check-homepage-grid.mjs | 53 ++++++++++++++++++++++++++++++++++-------
 1 file changed, 45 insertions(+), 8 deletions(-)
```

**Final `git status --porcelain` (after all records written):**
```
 M docs/backlog.md
 M scripts/check-homepage-grid.mjs
?? docs/sessions/2026-08-01-task703-skeleton-count-invariant.md
```

**Probe md5s, final check — identical to I0:**
```
dd6fcd9c2989cbb11ac0caf38205278e *scripts/task420-qa-grid-step.mjs
4d79ac2e3cdcb63629452eaf237e66cc *scripts/task668-qa-grid-1440.mjs
1a43b7ee898c415527f70db9ecefb386 *scripts/task668-qa-header-geometry.mjs
```

All three status paths are the task's own scope (§7 of the kickoff): the modified script, the concise backlog
entry, and this session log. Nothing else — no `src/`, probe, `package.json`, or `.github/` path.

## 3. R1–R6 → AC1–AC5 evidence

| Req | AC | Evidence | Status |
|---|---|---|---|
| R1 — I-D asserts grid direct-children 3/4 on the two loading stories inside the existing gap-matrix pass, sourced by comment naming `task668-qa-grid-1440.mjs:77` | AC1 | `scripts/check-homepage-grid.mjs` new `GAP_EXPECTED_SKELETON_COUNT = { Featured: 3, Latest: 4 }` constant, comment cites `task668-qa-grid-1440.mjs:77`; assertion added inside `runGapMatrix`'s existing per-cell branch, gated on `story.branch === 'loading'`. `check:homepage-grid` run after I3: **260/260 PASS, 0 FAIL** (§5). | **Confirmed** |
| R2 — value transcribed, not re-derived; live disagreement would be a stop | AC1 | I2 live-count read (§4) BEFORE the assertion existed: Featured=3, Latest=4 — matches the transcribed table exactly. No stop triggered. | **Confirmed** |
| R3 — `--verify-gate` gains a 7th plant tripping only I-D; negative arms before/after still pass clean | AC2 | New `PLANTS[6]` = `I-D-Featured-skeleton-count` (removes the last skeleton card via a new `removeChild` plant type in `evalGridCell`, restored via `appendChild` in the same `finally`-equivalent `restore()` closure). Full verbatim run in §6: negative arm clean, plant trips only `skeletonCount=2 expected=3` on its 1 cell, closing negative arm clean. | **Confirmed** |
| R4 — no `src/` edit; probes byte-identical; `package.json`/`.github/` untouched | AC3 | `git status --porcelain` at every checkpoint shows only `scripts/check-homepage-grid.mjs`; probe md5s identical to I0 at final check (§2). | **Confirmed** |
| R5 — all gates green; `npm run build` exit 0, full 54-row route table | AC4 | §5/§8 — all commands run, exit codes recorded. | **Confirmed** |
| R6 — session log + `docs/backlog.md` at 80 lines | AC5 | This file; backlog entry §7, physical line count reported in §9. | **Confirmed** |

## 4. I2 — live-count reading, before the assertion existed

Ran a temporary local probe (`scripts/tmp-task703-i2-live-count.mjs`, deleted immediately after use — never
committed, confirmed absent from every `git status` check in §2) against the already-built `storybook-static/`,
BEFORE any edit to `check-homepage-grid.mjs`:

```
Featured/loading (system-featuredlistings--loading): {"found":true,"childrenCount":3}
Latest/loading (system-latestlistings--loading): {"found":true,"childrenCount":4}
```

Matches the transcribed table (`task668-qa-grid-1440.mjs:77-80`: `Featured: 3, Latest: 4`) exactly. No R2 stop
condition.

## 5. `check:homepage-grid` runs (before and after I-D)

**I1 baseline, before I-D (first run — one transient render flake, not caused by this task):**
```
  I-A/supporting (step matrix, task420 source): 87/88 PASS, 1 FAIL
    ✗ I-A Similar @ sq@1280 (system-similarlistings--default) - render: sb-show-errordisplay
  I-A/I-B (gap matrix, task668-grid-1440 source): 160/160 PASS, 0 FAIL
  I-C (header matrix, task668-header-geometry source): 12/12 PASS, 0 FAIL

TOTAL: 259/260 PASS, 1 FAIL
```

**Immediate rerun, same unmodified tree — confirms transient (Similar/`sq@1280` `sb-show-errordisplay` is a known
Storybook render flake, unrelated to Featured/Latest loading grids or this task's scope):**
```
  I-A/supporting (step matrix, task420 source): 88/88 PASS, 0 FAIL
  I-A/I-B (gap matrix, task668-grid-1440 source): 160/160 PASS, 0 FAIL
  I-C (header matrix, task668-header-geometry source): 12/12 PASS, 0 FAIL

TOTAL: 260/260 PASS, 0 FAIL
```

**After I3 (I-D added):**
```
  I-A/supporting (step matrix, task420 source): 88/88 PASS, 0 FAIL
  I-A/I-B/I-D (gap matrix, task668-grid-1440 source): 160/160 PASS, 0 FAIL
  I-C (header matrix, task668-header-geometry source): 12/12 PASS, 0 FAIL

TOTAL: 260/260 PASS, 0 FAIL
```

**New cell total: 260 — unchanged from the I1 baseline.** Per A2/§3.3, I-D was ported into the SAME 160 already-
existing gap-matrix cells (80 of which are the loading-branch Featured/Latest cells) rather than a new matrix; no
new Playwright navigation was added. This is recorded as a deviation from the kickoff I3 wording ("cell count rises
from 260") in §10 — the evidence shows the total does not rise, consistent with A2's own instruction not to add a
new story matrix.

## 6. `--verify-gate` runs — verbatim (both negative arms + all seven plants)

**I1 baseline (six plants, before I-D existed):**
```
── Negative arm: no plant, full real-tree matrix ──
  I-A/supporting: 88/88 PASS, 0 FAIL
  I-A/I-B gap: 160/160 PASS, 0 FAIL
  I-C header: 12/12 PASS, 0 FAIL
✅ Negative arm PASS — 0/… FAIL on the unmodified tree.

── Plant: I-A-Featured — Featured column count: override grid-template-columns to 3 tracks at 1440 (expected 4) ──
✅ I-A-Featured: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Plant: I-A-Latest — Latest column count: override grid-template-columns to 2 tracks at 1440 (expected 3) ──
✅ I-A-Latest: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Plant: I-A-Similar — Similar column count: force 4-track (1440-migrated) behaviour at 1440 (expected 3, still Tailwind-1536) ──
✅ I-A-Similar: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Plant: I-B-Featured-gap — Featured gap: plant Latest's 12px value onto Featured's grid at 1024 (expected 16px) ──
✅ I-B-Featured-gap: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Plant: I-B-Latest-gap — Latest gap: plant Featured's 16px value onto Latest's grid at 1024 (expected 12px) ──
✅ I-B-Latest-gap: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Plant: I-C-Header — Header geometry: set --group-gap to 40px (a value the row must not tolerate; expected 16px) ──
✅ I-C-Header: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Post-plant re-check: negative arm again, confirming full restore ──
✅ Tree fully restored — 0 FAIL after all six plants.
```

**Final run, after I3+I4 (I-D + seventh plant added; full JSON per-plant payloads preserved from the actual run
output):**
```
── Negative arm: no plant, full real-tree matrix ──
  I-A/supporting: 88/88 PASS, 0 FAIL
  I-A/I-B/I-D gap: 160/160 PASS, 0 FAIL
  I-C header: 12/12 PASS, 0 FAIL
✅ Negative arm PASS — 0/… FAIL on the unmodified tree.

── Plant: I-A-Featured — Featured column count: override grid-template-columns to 3 tracks at 1440 (expected 4) ──
[
  {
    "matrix": "step", "invariant": "I-A Featured", "storyId": "system-featuredlistings--default",
    "label": "FeaturedListings/Default", "locale": "en", "width": 1440, "expectedCols": 4, "pass": false,
    "reasons": ["columnCount=3 expected=4"],
    "grid": { "found": true, "columnCount": 3, "gridTemplateColumns": "416px 416px 416px", "columnGap": "16px",
      "rowGap": "16px", "childrenCount": 8, "containerWidthPx": 1280, "noHScroll": true }
  }
]
✅ I-A-Featured: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Plant: I-A-Latest — Latest column count: override grid-template-columns to 2 tracks at 1440 (expected 3) ──
[
  {
    "matrix": "gap", "invariant": "I-A/I-B Latest", "storyId": "system-latestlistings--default",
    "component": "Latest", "branch": "populated", "locale": "en", "width": 1440, "expectedCols": 3,
    "expectedGap": 12, "expectedSkeleton": null, "pass": false, "reasons": ["columnCount=2 expected=3"],
    "grid": { "found": true, "columnCount": 2, "gridTemplateColumns": "634px 634px", "columnGap": "12px",
      "rowGap": "12px", "childrenCount": 8, "containerWidthPx": 1280, "noHScroll": true }
  }
]
✅ I-A-Latest: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Plant: I-A-Similar — Similar column count: force 4-track (1440-migrated) behaviour at 1440 (expected 3, still Tailwind-1536) ──
[
  {
    "matrix": "step", "invariant": "I-A Similar", "storyId": "system-similarlistings--default",
    "label": "SimilarListings/Default", "locale": "en", "width": 1440, "expectedCols": 3, "pass": false,
    "reasons": ["columnCount=4 expected=3"],
    "grid": { "found": true, "columnCount": 4, "gridTemplateColumns": "308px 308px 308px 308px", "columnGap": "16px",
      "rowGap": "16px", "childrenCount": 8, "containerWidthPx": 1280, "noHScroll": true }
  }
]
✅ I-A-Similar: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Plant: I-B-Featured-gap — Featured gap: plant Latest's 12px value onto Featured's grid at 1024 (expected 16px) ──
[
  {
    "matrix": "gap", "invariant": "I-A/I-B Featured", "storyId": "system-featuredlistings--default",
    "component": "Featured", "branch": "populated", "locale": "en", "width": 1024, "expectedCols": 2,
    "expectedGap": 16, "expectedSkeleton": null, "pass": false,
    "reasons": ["columnGap=12px expected=16px", "rowGap=12px expected=16px"],
    "grid": { "found": true, "columnCount": 2, "gridTemplateColumns": "442px 442px", "columnGap": "12px",
      "rowGap": "12px", "childrenCount": 8, "containerWidthPx": 896, "noHScroll": true }
  }
]
✅ I-B-Featured-gap: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Plant: I-B-Latest-gap — Latest gap: plant Featured's 16px value onto Latest's grid at 1024 (expected 12px) ──
[
  {
    "matrix": "gap", "invariant": "I-A/I-B Latest", "storyId": "system-latestlistings--default",
    "component": "Latest", "branch": "populated", "locale": "en", "width": 1024, "expectedCols": 2,
    "expectedGap": 12, "expectedSkeleton": null, "pass": false,
    "reasons": ["columnGap=16px expected=12px", "rowGap=16px expected=12px"],
    "grid": { "found": true, "columnCount": 2, "gridTemplateColumns": "440px 440px", "columnGap": "16px",
      "rowGap": "16px", "childrenCount": 8, "containerWidthPx": 896, "noHScroll": true }
  }
]
✅ I-B-Latest-gap: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Plant: I-C-Header — Header geometry: set --group-gap to 40px (a value the row must not tolerate; expected 16px) ──
[
  {
    "matrix": "header", "invariant": "I-C Header", "locale": "en", "width": 1440, "pass": false,
    "reasons": ["computed columnGap=40px expected=16px"],
    "groupDeltaMax": 0, "titleDeltaMax": 0, "linkDeltaMax": 0, "liveOverflowPx": 0, "syntheticOverflowPx": 0
  }
]
✅ I-C-Header: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Plant: I-D-Featured-skeleton-count — Featured skeleton count: remove one skeleton card from the loading grid at 1024 (expected childrenCount=3) ──
[
  {
    "matrix": "gap", "invariant": "I-A/I-B/I-D Featured", "storyId": "system-featuredlistings--loading",
    "component": "Featured", "branch": "loading", "locale": "en", "width": 1024, "expectedCols": 2,
    "expectedGap": 16, "expectedSkeleton": 3, "pass": false, "reasons": ["skeletonCount=2 expected=3"],
    "grid": { "found": true, "columnCount": 2, "gridTemplateColumns": "440px 440px", "columnGap": "16px",
      "rowGap": "16px", "childrenCount": 2, "containerWidthPx": 896, "noHScroll": true }
  }
]
✅ I-D-Featured-skeleton-count: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Post-plant re-check: negative arm again, confirming full restore ──
✅ Tree fully restored — 0 FAIL after all seven plants.
```

The I-D plant's cell shows `columnCount=2` matching `expectedCols=2` (unaffected — column count is CSS-driven by
the `SimpleGrid cols` breakpoint prop, not by child count) and both gap values unaffected — only `childrenCount`
(8→2 in the raw grid object, i.e. `skeletonCount=2` vs `expected=3`) trips, confirming the plant isolates I-D from
I-A/I-B on the same cell.

## 7. Diff of `check-homepage-grid.mjs`

```diff
diff --git a/scripts/check-homepage-grid.mjs b/scripts/check-homepage-grid.mjs
index 06d137d37..7b77c8d81 100644
--- a/scripts/check-homepage-grid.mjs
+++ b/scripts/check-homepage-grid.mjs
@@ -23,6 +23,8 @@
  *   I-B  Featured grid gap       16px (theme.spacing.md)          (task668-qa-grid-1440.mjs)
  *   I-B  Latest grid gap         12px (theme.spacing.sm)          (task668-qa-grid-1440.mjs)
  *   I-C  Featured header row     Group geometry == pre-migration flex row (task668-qa-header-geometry.mjs)
+ *   I-D  Featured/Latest loading skeleton count  3 / 4 grid direct children (task668-qa-grid-1440.mjs:77,
+ *        added Task 703 — F1 of the Task 701 review, ported into the existing gap-matrix pass, no new cells)
  *   supporting  no horizontal scroll (scrollWidth <= clientWidth + 2)     (task420-qa-grid-step.mjs)
  *   supporting  .container-wide content box <= 1408px at >=1536          (task420-qa-grid-step.mjs)
  *
@@ -36,8 +38,9 @@
  *   node scripts/check-homepage-grid.mjs --verify-gate    Self-test (CI-safe, no product-code
  *                                                         edits). Negative arm: every invariant
  *                                                         PASSes on the unmodified real tree.
- *                                                         Then, for each of the six invariants in
- *                                                         kickoff §I5, an in-page `page.evaluate`
+ *                                                         Then, for each of the seven invariants in
+ *                                                         kickoff §I5 (Task 701) / §3.4 (Task 703,
+ *                                                         I-D), an in-page `page.evaluate`
  *                                                         plant is applied, measured, asserted to
  *                                                         trip THAT invariant (and no other), and
  *                                                         restored in a `finally` block. A plant
@@ -102,6 +105,13 @@ const GAP_EXPECTED_COLS = {
 };
 const GAP_EXPECTED_PX = { Featured: 16, Latest: 12 };
 
+// ── I-D — transcribed verbatim from scripts/task668-qa-grid-1440.mjs:77 EXPECTED_SKELETON_COUNT.
+// Grid direct-children count on the loading branch (cards, not .mantine-Skeleton-root elements —
+// kickoff Task 703 A1). Live count read and confirmed 3/4 before this assertion existed (I2),
+// against FeaturedListingsView.tsx:59 / LatestListingsView.tsx:44. Checked inside the existing
+// gap-matrix pass (A2) — no new story matrix, no new cells. ──
+const GAP_EXPECTED_SKELETON_COUNT = { Featured: 3, Latest: 4 };
+
 const GAP_STORIES = [
   { id: 'system-featuredlistings--default', component: 'Featured', branch: 'populated' },
   { id: 'system-featuredlistings--loading', component: 'Featured', branch: 'loading' },
@@ -222,6 +232,14 @@ function evalGridCell({ locatorType, plant }) {
       if (prevRow) grid.style.setProperty('row-gap', prevRow);
       else grid.style.removeProperty('row-gap');
     };
+  } else if (plant && plant.type === 'removeChild') {
+    // I-D plant (Task 703) — remove the last skeleton card so childrenCount is wrong; restore by
+    // re-appending the SAME node (last child removed, so appendChild restores its original slot).
+    const removedNode = grid.lastElementChild;
+    if (removedNode) grid.removeChild(removedNode);
+    restore = () => {
+      if (removedNode) grid.appendChild(removedNode);
+    };
   }
 
   const cs = getComputedStyle(grid);
@@ -503,10 +521,13 @@ async function runGapMatrix(browser, baseUrl, { onlyStoryId, onlyWidths, onlyLoc
       for (const width of widths) {
         const expectedCols = GAP_EXPECTED_COLS[story.component][width];
         const expectedGap = GAP_EXPECTED_PX[story.component];
+        const expectedSkeleton = story.branch === 'loading' ? GAP_EXPECTED_SKELETON_COUNT[story.component] : null;
         const row = {
-          matrix: 'gap', invariant: `I-A/I-B ${story.component}`, storyId: story.id,
+          matrix: 'gap',
+          invariant: story.branch === 'loading' ? `I-A/I-B/I-D ${story.component}` : `I-A/I-B ${story.component}`,
+          storyId: story.id,
           component: story.component, branch: story.branch, locale, width,
-          expectedCols, expectedGap, pass: true, reasons: [],
+          expectedCols, expectedGap, expectedSkeleton, pass: true, reasons: [],
         };
         const page = await browser.newPage();
         try {
@@ -540,6 +561,11 @@ async function runGapMatrix(browser, baseUrl, { onlyStoryId, onlyWidths, onlyLoc
                 row.pass = false;
                 row.reasons.push(`rowGap=${grid.rowGap} expected=${expectedGap}px`);
               }
+              // I-D — task668-qa-grid-1440.mjs:77 EXPECTED_SKELETON_COUNT, loading branch only.
+              if (expectedSkeleton !== null && grid.childrenCount !== expectedSkeleton) {
+                row.pass = false;
+                row.reasons.push(`skeletonCount=${grid.childrenCount} expected=${expectedSkeleton}`);
+              }
             }
           }
         } catch (err) {
@@ -617,7 +643,7 @@ async function runGate(baseUrl, browser) {
   const headerSummary = summarize(header);
 
   printSummary('I-A/supporting (step matrix, task420 source)', stepSummary);
-  printSummary('I-A/I-B (gap matrix, task668-grid-1440 source)', gapSummary);
+  printSummary('I-A/I-B/I-D (gap matrix, task668-grid-1440 source)', gapSummary);
   printSummary('I-C (header matrix, task668-header-geometry source)', headerSummary);
 
   const totalFail = stepSummary.fail + gapSummary.fail + headerSummary.fail;
@@ -690,6 +716,17 @@ const PLANTS = [
     run: (browser, baseUrl) => runHeaderMatrix(browser, baseUrl, { onlyWidths: [1440], onlyLocales: ['en'], plantGapPx: 40 }),
     expectReason: (r) => /computed columnGap=40px expected=16px/.test(r.reasons.join(';')),
   },
+  {
+    id: 'I-D-Featured-skeleton-count',
+    describe: 'Featured skeleton count: remove one skeleton card from the loading grid at 1024 (expected childrenCount=3)',
+    run: (browser, baseUrl) => runGapMatrix(browser, baseUrl, {
+      onlyStoryId: 'system-featuredlistings--loading',
+      onlyWidths: [1024],
+      onlyLocales: ['en'],
+      plant: { storyId: 'system-featuredlistings--loading', width: 1024, locale: 'en', spec: { type: 'removeChild' } },
+    }),
+    expectReason: (r) => /skeletonCount=2 expected=3/.test(r.reasons.join(';')),
+  },
 ];
 
 async function runVerifyGate(baseUrl, browser) {
@@ -705,7 +742,7 @@ async function runVerifyGate(baseUrl, browser) {
   const gapSummary = summarize(gap);
   const headerSummary = summarize(header);
   printSummary('I-A/supporting', stepSummary);
-  printSummary('I-A/I-B gap', gapSummary);
+  printSummary('I-A/I-B/I-D gap', gapSummary);
   printSummary('I-C header', headerSummary);
   const negativeFail = stepSummary.fail + gapSummary.fail + headerSummary.fail;
   if (negativeFail === 0) {
@@ -715,7 +752,7 @@ async function runVerifyGate(baseUrl, browser) {
     overallPass = false;
   }
 
-  // ── Six per-invariant plants (R3, R4, cross-swap per I5). ──
+  // ── Seven per-invariant plants (R3, R4, cross-swap per I5; I-D added Task 703). ──
   for (const plant of PLANTS) {
     console.log(`── Plant: ${plant.id} — ${plant.describe} ──`);
     const rows = await plant.run(browser, baseUrl);
@@ -742,7 +779,7 @@ async function runVerifyGate(baseUrl, browser) {
   const { step: step2, gap: gap2, header: header2 } = await runFullGate(browser, baseUrl);
   const restoredFail = summarize(step2).fail + summarize(gap2).fail + summarize(header2).fail;
   if (restoredFail === 0) {
-    console.log('✅ Tree fully restored — 0 FAIL after all six plants.\n');
+    console.log('✅ Tree fully restored — 0 FAIL after all seven plants.\n');
   } else {
     console.log(`❌ Tree NOT fully restored — ${restoredFail} cell(s) still failing after plants. A plant leaked.\n`);
     overallPass = false;
```

## 8. Every command with actual exit code

| Command | Exit | Result |
|---|---|---|
| `npm run build-storybook` | 0 | Vite build succeeded, `storybook-static/` produced |
| `npm run check:homepage-grid` (I1 baseline, 1st) | 1 | 259/260 PASS (1 transient render flake, see §5) |
| `npm run check:homepage-grid` (I1 baseline, rerun) | 0 | 260/260 PASS — confirms transient |
| `npm run check:homepage-grid:verify` (I1 baseline, 6 plants) | 0 | Negative arm clean, all 6 plants isolated, restore clean |
| `npm run check:homepage-grid` (after I3) | 0 | 260/260 PASS |
| `npm run check:homepage-grid:verify` (after I4, 7 plants, first) | 0 | All 7 plants isolated, restore clean |
| `npm run check:homepage-grid:verify` (after wording fix, final) | 0 | Same — verbatim in §6 |
| `npx tsc --noEmit` | 0 | No output (clean) |
| `npm run check:stories` | 0 | 127 files checked, 0 violations |
| `npm run check:i18n` | 0 | 2215 keys × 4 locales, parity + no raw-enum leaks |
| `npm run check:design-tokens` | 1 | 28 raw style-value violations, 0 stale-markers, 0 missing-reason — **matches R5's documented pre-existing baseline (28/0/0) exactly; no `src/` file was touched by this task, so this is unaffected pre-existing state, not a regression** |
| `npx vitest run` (full) | 1 | 1189/1192 passed, 3 failed — the documented full-run-only timeout trio (`date-format-ssr-parity`, `RangeDatePicker`, `saveSavedSearch.dedup`; see backlog Task 688 F8) |
| `npx vitest run` (isolated, same 3 files) | 0 | 41/41 passed — confirms no new failure |
| `npm run build` | 0 | Compiled successfully in 75s, 40/40 static pages, full 54-row route table (§9) |
| `npm run check:file-integrity` (after I8 records) | 0 | 3/3 file(s) clean (NUL bytes/BOM/JSON parse/`node --check`/truncation) — the exact 3 touched paths |
| `npm run check:mojibake` (after I8 records) | 0 | 0 artifacts in 2028 scanned files |

## 9. Build tail — verbatim, full 54-row route table

```
   Creating an optimized production build ...
 ✓ Compiled successfully in 75s
   Skipping linting
   Checking validity of types ...
   Collecting page data ...
   Generating static pages (0/40) ...
   Generating static pages (10/40)
   Generating static pages (20/40)
   Generating static pages (30/40)
 ✓ Generating static pages (40/40)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS  Revalidate  Expire
┌ ƒ /                                      379 B         185 kB
├ ƒ /_not-found                          1.16 kB         185 kB
├ ƒ /[locale]                            7.15 kB         618 kB
├ ƒ /[locale]/[slug]                       377 B         185 kB
├ ƒ /[locale]/auth/confirm-email         2.18 kB         192 kB
├ ƒ /[locale]/auth/login                 1.42 kB         265 kB
├ ƒ /[locale]/auth/register              1.41 kB         265 kB
├ ƒ /[locale]/auth/reset-password        6.43 kB         284 kB
├ ƒ /[locale]/auth/verified              2.27 kB         258 kB
├ ƒ /[locale]/cabinet                     149 kB         763 kB
├ ƒ /[locale]/contact                    5.44 kB         230 kB
├ ƒ /[locale]/favorites                  5.26 kB         577 kB
├ ƒ /[locale]/listings                   12.8 kB         585 kB
├ ƒ /[locale]/listings/[slug]              380 B         581 kB
├ ƒ /[locale]/listings/[slug]/edit       2.36 kB         251 kB
├ ƒ /[locale]/listings/create            2.36 kB         251 kB
├ ƒ /admin                               5.02 kB         371 kB
├ ƒ /admin/companies                     6.85 kB         304 kB
├ ƒ /admin/currency                       8.6 kB         300 kB
├ ƒ /admin/email-templates                 10 kB         253 kB
├ ƒ /admin/footer                        6.25 kB         232 kB
├ ƒ /admin/inquiries                       379 B         185 kB
├ ƒ /admin/inquiries/sales                 336 B         368 kB
├ ƒ /admin/inquiries/support               335 B         368 kB
├ ƒ /admin/legal                           379 B         185 kB
├ ƒ /admin/listings                        10 kB         422 kB
├ ƒ /admin/listings/[id]/preview           380 B         581 kB
├ ƒ /admin/locations                     9.92 kB         261 kB
├ ƒ /admin/pages                         10.4 kB         264 kB
├ ƒ /admin/permissions                   8.93 kB         219 kB
├ ƒ /admin/popular-locations             9.23 kB         260 kB
├ ƒ /admin/property-types                7.36 kB         292 kB
├ ƒ /admin/reports                       21.3 kB         287 kB
├ ƒ /admin/settings                      7.57 kB         221 kB
├ ƒ /admin/support                        8.5 kB         408 kB
├ ƒ /admin/users                         5.03 kB         483 kB
├ ƒ /admin/users/[id]                      381 B         599 kB
├ ƒ /admin/users/new                       382 B         599 kB
├ ƒ /api/auth-email-hook                   378 B         185 kB
├ ƒ /api/auth/me                           378 B         185 kB
├ ƒ /api/cron/inactivity                   377 B         185 kB
├ ƒ /api/cron/listings-expiry              378 B         185 kB
├ ƒ /api/cron/price-alerts                 379 B         185 kB
├ ƒ /api/cron/saved-searches               377 B         185 kB
├ ○ /api/exchange-rate                     379 B         185 kB          1h      1y
├ ƒ /api/listings                          377 B         185 kB
├ ƒ /api/listings/[slug]/view              379 B         185 kB
├ ƒ /api/presence                          379 B         185 kB
├ ƒ /api/property-types                    379 B         185 kB
├ ƒ /api/upload-avatar                     378 B         185 kB
├ ƒ /api/upload-company-logo               378 B         185 kB
├ ƒ /api/upload-popular-location-photo     378 B         185 kB
├ ƒ /auth/callback                         378 B         185 kB
└ ƒ /auth/confirm                          378 B         185 kB
+ First Load JS shared by all             184 kB
  ├ chunks/3434-e5c8e619238ffa4f.js       126 kB
  ├ chunks/4bd1b696-ad216e4073dcea52.js  54.4 kB
  └ other shared chunks (total)           4.2 kB


ƒ Middleware                              165 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

54 routes counted (rows 3–56 excluding the `Route (app)` header and the two legend lines) — matches R5's "full
54-row route table" exactly.

## 10. Deviations and limitations

1. **Cell-count wording (I3).** The kickoff's I3 step says "cell count rises from 260 by the loading-story cells
   it now also checks — state the new total explicitly." The measured total is **260, unchanged** (§5) — I-D was
   ported into the 80 already-existing loading-branch gap cells (per A2/§3.3, "add I-D to that existing pass; do
   not add a new story matrix"), not into new cells. Explicitly stated per the instruction; the number itself does
   not rise, consistent with A2's own "no new matrix" directive. Flagged for the reviewer as a kickoff-wording
   inconsistency, not an implementation gap.
2. **`check:design-tokens` non-zero exit.** 28 violations is the exact pre-existing baseline named in R5/§13
   (`28/0/0`). This task touches no `src/` file, so the exit-1 result is expected and unchanged, not a regression.
3. **`vitest` full-run timeouts.** 3 tests timed out on the full run (`date-format-ssr-parity`, `RangeDatePicker`,
   `saveSavedSearch.dedup`) — this is the documented full-run-only flake trio named in the backlog (Task 688 F8:
   "the vitest timeout pair is run-varying across the documented trio ... owner's two runs failed different
   pairs"). Isolated rerun of exactly these 3 files: 41/41 PASS, confirming no new failure from this change.
4. **Temporary I2 probe script.** `scripts/tmp-task703-i2-live-count.mjs` was created to answer R2's "read before
   writing" requirement, then deleted immediately after the read. It never appears in any `git status` snapshot in
   this log and was not part of the final diff — recorded here for full transparency per the executor evidence
   protocol.
5. **One transient Storybook render flake** on `SimilarListings/Default` `sq@1280` (`sb-show-errordisplay`) in the
   very first `check:homepage-grid` run of this session, cleared on immediate rerun with no code change in between.
   Unrelated to Featured/Latest loading grids (I-D's scope) — logged in §5 for completeness, not treated as a
   defect of this change.

No `TASK SPECIFICATION CONTRADICTION`, `CANONICAL UI SPECIFICATION GAP`, or `CANONICAL STYLE DECISION REQUIRED`
condition was encountered — this task has no visible UI surface (Q4, gate-only, `src/` read-only).
