# Task 701 — Consolidate the homepage grid invariants into one CI gate

**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**Kickoff:** `tasks/kickoff_prompt_Task_701_Homepage_Grid_Invariants_CI_Gate.md`
**Branch:** `task/q0-ci-rendered-locale-split`
**Date:** 2026-08-01 (executed 2026-07-31)

## 1. Files Changed

| Path | Action | Reason |
|---|---|---|
| `scripts/check-homepage-grid.mjs` | **created** | R1, R3, R4 — the consolidated gate |
| `package.json` | **modified** — 2 script entries added | R2 |
| `.github/workflows/governance-pr.yml` | **modified** — 2 steps added inside `rendered-proof` | R5 |
| `docs/backlog.md` | **modified** — appended concise Task 701 entry to the Last Session line | R10 |
| `docs/sessions/2026-08-01-task701-homepage-grid-invariants-gate.md` | **created** | R10 (this file) |

Confirmed by `git status --porcelain` after all implementation work (final, taken after this session log and the encoding gates completed):

```
 M .github/workflows/governance-pr.yml
 M docs/backlog.md
 M package.json
?? docs/sessions/2026-08-01-task701-homepage-grid-invariants-gate.md
?? scripts/check-homepage-grid.mjs
```

Exactly the 5 paths in the table above, no more, no fewer. No `src/` path, no `task420-qa-grid-step.mjs`, `task668-qa-grid-1440.mjs`, or `task668-qa-header-geometry.mjs` appear — R6/R7 held.

## 2. I0 snapshot and final git status

**I0 (start):** `git status --porcelain` was empty — clean start, matching §3.6.

**Final `git status --porcelain`** (identical to §1's capture): 5 paths — 3 modified (`governance-pr.yml`, `package.json`, `docs/backlog.md`), 2 new (`scripts/check-homepage-grid.mjs`, this session log).

**md5 of the three untouched probes (unchanged from I0 to now, byte-identical):**

```
dd6fcd9c2989cbb11ac0caf38205278e  scripts/task420-qa-grid-step.mjs
4d79ac2e3cdcb63629452eaf237e66cc  scripts/task668-qa-grid-1440.mjs
1a43b7ee898c415527f70db9ecefb386  scripts/task668-qa-header-geometry.mjs
```

## 3. R1–R10 mapped to AC1–AC6

| Req | AC | Status | Evidence |
|---|---|---|---|
| R1 — one gate, neutrally named, asserts I-A/I-B/I-C + 2 supporting | AC1 | ✅ | `scripts/check-homepage-grid.mjs`, §4 below |
| R2 — `check:homepage-grid` / `:verify` script pair | AC1 | ✅ | `package.json` diff §7 |
| R3 — `--verify-gate` plants each invariant separately | AC2 | ✅ | §5, all 6 plants each trip only their own invariant |
| R4 — `--verify-gate` negative arm | AC2 | ✅ | §5, negative arm 0/260 FAIL both before and after the 6 plants |
| R5 — CI wiring inside `rendered-proof`, no new job/build/install | AC3 | ✅ | §7 workflow diff — exactly 2 steps, no other change |
| R6 — 3 probes not deleted/renamed/edited | AC4 | ✅ | §2 md5s unchanged |
| R7 — no `src/` file edited | AC4 | ✅ | §1 diff has no `src/` path |
| R8 — expected tables transcribed, not re-derived | AC1 | ✅ | §6 transcription table; I1 baseline probe runs (§8) match the transcribed tables exactly, no disagreement found |
| R9 — gate suite green | AC5 | ✅ | §8 |
| R10 — session log + backlog at 80 lines | AC6 | ✅ | this file; `docs/backlog.md` confirmed `wc -l` = 80 both before and after the edit (appended within the existing Last-Session line, no new line added) |

## 4. The new script, in full

See `scripts/check-homepage-grid.mjs` (783 lines). Structure:

- **Header comment** names the 3 source probes, the 8 ported invariants with their authority, and states this is a port (A2), not a wrapper — the script never shells out to the originals.
- **Three matrices**, each faithfully reproducing one source probe's own story/width/locale matrix and locator mechanism:
  - `runStepMatrixReal` — ports `task420-qa-grid-step.mjs`: `FeaturedListings/Default` (mechanism-agnostic locator) + `SimilarListings/Default` (verbatim Tailwind-token locator, A4) × 11 widths × 4 locales = 88 cells. Asserts column count, no-h-scroll, container cap (≥1536).
  - `runGapMatrix` — ports `task668-qa-grid-1440.mjs`: Featured/Latest × Default/Loading × 10 widths × 4 locales = 160 cells. Asserts column count + column-gap + row-gap.
  - `runHeaderMatrix` — ports `task668-qa-header-geometry.mjs`: Featured header row × 3 widths × 4 locales = 12 cells. Asserts the 7 computed CSS rules + the live-vs-synthetic-gap:0 rect-delta/overflow comparison, exactly as the source probe does.
- **Plant mechanism**: `evalGridCell`/`evalHeaderCell` accept an optional `plant` argument, applied via inline `element.style` inside the same `page.evaluate` call that measures the cell, and removed (`restore()`) before the call returns — the DOM never carries a plant across a call boundary (A3). No `src/` file is ever touched.
- **Two modes**: default (`runGate`) asserts the real tree once; `--verify-gate` (`runVerifyGate`) runs the negative arm, then each of 6 named `PLANTS`, then a second negative arm to confirm full restore.

## 5. All seven `--verify-gate` runs, verbatim

Full command: `npm run check:homepage-grid:verify` (`node scripts/check-homepage-grid.mjs --verify-gate`). Exit code: **0**.

```
check-homepage-grid.mjs --verify-gate

Purpose: prove the gate is not a no-op, per-invariant (kickoff §I5/§3.4).

── Negative arm: no plant, full real-tree matrix ──
  I-A/supporting: 88/88 PASS, 0 FAIL
  I-A/I-B gap: 160/160 PASS, 0 FAIL
  I-C header: 12/12 PASS, 0 FAIL
✅ Negative arm PASS — 0/… FAIL on the unmodified tree.

── Plant: I-A-Featured — Featured column count: override grid-template-columns to 3 tracks at 1440 (expected 4) ──
[
  {
    "matrix": "step",
    "invariant": "I-A Featured",
    "storyId": "system-featuredlistings--default",
    "label": "FeaturedListings/Default",
    "locale": "en",
    "width": 1440,
    "expectedCols": 4,
    "pass": false,
    "reasons": [ "columnCount=3 expected=4" ],
    "grid": {
      "found": true, "columnCount": 3, "gridTemplateColumns": "416px 416px 416px",
      "columnGap": "16px", "rowGap": "16px", "childrenCount": 8,
      "containerWidthPx": 1280, "noHScroll": true
    }
  }
]
✅ I-A-Featured: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Plant: I-A-Latest — Latest column count: override grid-template-columns to 2 tracks at 1440 (expected 3) ──
[
  {
    "matrix": "gap",
    "invariant": "I-A/I-B Latest",
    "storyId": "system-latestlistings--default",
    "component": "Latest", "branch": "populated", "locale": "en", "width": 1440,
    "expectedCols": 3, "expectedGap": 12,
    "pass": false,
    "reasons": [ "columnCount=2 expected=3" ],
    "grid": {
      "found": true, "columnCount": 2, "gridTemplateColumns": "634px 634px",
      "columnGap": "12px", "rowGap": "12px", "childrenCount": 8,
      "containerWidthPx": 1280, "noHScroll": true
    }
  }
]
✅ I-A-Latest: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Plant: I-A-Similar — Similar column count: force 4-track (1440-migrated) behaviour at 1440 (expected 3, still Tailwind-1536) ──
[
  {
    "matrix": "step",
    "invariant": "I-A Similar",
    "storyId": "system-similarlistings--default",
    "label": "SimilarListings/Default",
    "locale": "en", "width": 1440, "expectedCols": 3,
    "pass": false,
    "reasons": [ "columnCount=4 expected=3" ],
    "grid": {
      "found": true, "columnCount": 4, "gridTemplateColumns": "308px 308px 308px 308px",
      "columnGap": "16px", "rowGap": "16px", "childrenCount": 8,
      "containerWidthPx": 1280, "noHScroll": true
    }
  }
]
✅ I-A-Similar: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Plant: I-B-Featured-gap — Featured gap: plant Latest's 12px value onto Featured's grid at 1024 (expected 16px) ──
[
  {
    "matrix": "gap",
    "invariant": "I-A/I-B Featured",
    "storyId": "system-featuredlistings--default",
    "component": "Featured", "branch": "populated", "locale": "en", "width": 1024,
    "expectedCols": 2, "expectedGap": 16,
    "pass": false,
    "reasons": [ "columnGap=12px expected=16px", "rowGap=12px expected=16px" ],
    "grid": {
      "found": true, "columnCount": 2, "gridTemplateColumns": "442px 442px",
      "columnGap": "12px", "rowGap": "12px", "childrenCount": 8,
      "containerWidthPx": 896, "noHScroll": true
    }
  }
]
✅ I-B-Featured-gap: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Plant: I-B-Latest-gap — Latest gap: plant Featured's 16px value onto Latest's grid at 1024 (expected 12px) ──
[
  {
    "matrix": "gap",
    "invariant": "I-A/I-B Latest",
    "storyId": "system-latestlistings--default",
    "component": "Latest", "branch": "populated", "locale": "en", "width": 1024,
    "expectedCols": 2, "expectedGap": 12,
    "pass": false,
    "reasons": [ "columnGap=16px expected=12px", "rowGap=16px expected=12px" ],
    "grid": {
      "found": true, "columnCount": 2, "gridTemplateColumns": "440px 440px",
      "columnGap": "16px", "rowGap": "16px", "childrenCount": 8,
      "containerWidthPx": 896, "noHScroll": true
    }
  }
]
✅ I-B-Latest-gap: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Plant: I-C-Header — Header geometry: set --group-gap to 40px (a value the row must not tolerate; expected 16px) ──
[
  {
    "matrix": "header",
    "invariant": "I-C Header",
    "locale": "en", "width": 1440,
    "pass": false,
    "reasons": [ "computed columnGap=40px expected=16px" ],
    "groupDeltaMax": 0, "titleDeltaMax": 0, "linkDeltaMax": 0,
    "liveOverflowPx": 0, "syntheticOverflowPx": 0
  }
]
✅ I-C-Header: plant correctly tripped its own invariant (1 cell(s)), no unrelated cell affected.

── Post-plant re-check: negative arm again, confirming full restore ──
✅ Tree fully restored — 0 FAIL after all six plants.
```

**Cross-invariant isolation, read from the raw cells above:**
- I-A-Featured/I-A-Latest/I-A-Similar plants (column-count overrides) leave `columnGap`/`rowGap` at their correct expected values (16px/12px/16px respectively) — the gap assertion did not fire.
- I-B-Featured-gap/I-B-Latest-gap plants (gap overrides) leave `columnCount` at the correct expected value (2/2) — the column-count assertion did not fire. The cross-swap (Latest's 12px onto Featured, Featured's 16px onto Latest) proves the gate distinguishes the two values rather than accepting "some gap" (per the kickoff's explicit note).
- I-C-Header's plant only changed `computed.columnGap`; `groupDeltaMax`/`titleDeltaMax`/`linkDeltaMax` are all `0` because this story's header row has enough free space at every measured width that neither a 40px nor a 0px gap moves any element (consistent with the original `task668-qa-header-geometry.mjs`'s own finding, §10.14 freeSpace diagnostic) — the computed-rule check is what catches this plant, exactly as designed.

## 6. Transcription table

| Invariant | Expected value | Source probe / constant | Re-derived? |
|---|---|---|---|
| I-A Featured cols | `{320:1,375:1,390:1,640:2,768:2,1024:2,1280:3,1440:4,1536:4,1920:4,2560:4}` (step matrix) / `{320:1,640:2,768:2,1024:2,1280:3,1439:3,1440:4,1535:4,1536:4,1920:4}` (gap matrix) | `task420-qa-grid-step.mjs` `EXPECTED_COLS_BY_WIDTH.featured` / `task668-qa-grid-1440.mjs` `EXPECTED_COLS.Featured` | No — copied verbatim |
| I-A Latest cols | `{320:1,640:1,768:2,1024:2,1280:2,1439:2,1440:3,1535:3,1536:3,1920:3}` | `task668-qa-grid-1440.mjs` `EXPECTED_COLS.Latest` | No — copied verbatim |
| I-A Similar cols | `{320:1,375:1,390:1,640:2,768:2,1024:2,1280:3,1440:3,1536:4,1920:4,2560:4}` | `task420-qa-grid-step.mjs` `EXPECTED_COLS_BY_WIDTH.similar` | No — copied verbatim |
| I-B Featured gap | 16px | `task668-qa-grid-1440.mjs` `EXPECTED_GAP_PX.Featured` | No — copied verbatim |
| I-B Latest gap | 12px | `task668-qa-grid-1440.mjs` `EXPECTED_GAP_PX.Latest` | No — copied verbatim |
| I-C Header rules | `display:flex, flexDirection:row, justifyContent:space-between, alignItems:center, flexWrap:nowrap, marginBottom:24px, columnGap:16px` | `task668-qa-header-geometry.mjs` `EXPECTED_RULES` | No — copied verbatim |
| supporting: no h-scroll | `scrollWidth <= clientWidth + 2` | `task420-qa-grid-step.mjs` inline check | No — copied verbatim |
| supporting: container cap | 1408px at ≥1536 | `task420-qa-grid-step.mjs` `CONTAINER_CAP_PX` | No — copied verbatim |

**Confirmation the tables were not re-derived:** I1 (§8) ran all three original probes against the current tree BEFORE the new script was written, and every probe passed 100% against its own OWN hardcoded tables (88/88, 160/160, 12/12). The new script then asserted the same values against the same tree and also passed 260/260 (§9), with zero disagreement between the transcribed tables and the live render — satisfying R8/A1.

## 7. Workflow diff, in full

```diff
diff --git a/.github/workflows/governance-pr.yml b/.github/workflows/governance-pr.yml
index 714a66c3b..aeefda687 100644
--- a/.github/workflows/governance-pr.yml
+++ b/.github/workflows/governance-pr.yml
@@ -147,6 +147,12 @@ jobs:
       - name: Build Storybook (runs check:stories pre-gate)
         run: npm run build-storybook

+      - name: Homepage grid invariants gate (column steps, gaps, header geometry)
+        run: npm run check:homepage-grid
+
+      - name: Homepage grid invariants gate self-test (verifies gate detects violations — CI-safe)
+        run: npm run check:homepage-grid:verify
+
       - name: Rendered-proof gate (Task 529 — Mantine/Primitives/* enforced, auto-discovered)
         # --mantine-only: blocks CI specifically on the Mantine/Primitives/* gate this task adds.
         # Deliberately does NOT also run the pre-existing ASSERT_STORIES/geometry-only phases here —
diff --git a/package.json b/package.json
index 2e392d830..8ff336af7 100644
--- a/package.json
+++ b/package.json
@@ -76,6 +76,8 @@
     "check:listing-visibility": "node scripts/check-listing-visibility.mjs",
     "check:listing-visibility:report": "node scripts/check-listing-visibility.mjs --report",
     "check:listing-visibility:verify": "node scripts/check-listing-visibility.mjs --verify-gate",
+    "check:homepage-grid": "node scripts/check-homepage-grid.mjs",
+    "check:homepage-grid:verify": "node scripts/check-homepage-grid.mjs --verify-gate",
     "capture:admin-session": "node scripts/capture-admin-session.mjs",
     "new:story": "node scripts/scaffold-story.mjs"
   },
```

Exactly two steps added inside `rendered-proof`, both after `build-storybook` (line 147-148) and before the pre-existing `Rendered-proof gate` step (R5). No job added, no `playwright install` added, no second `build-storybook` added — confirmed by the diff itself (only the `rendered-proof` job's step list changed; `locale-leak` and `governance` are untouched).

## 8. I1 baselines — every command with actual exit code

Run BEFORE `scripts/check-homepage-grid.mjs` existed, against the clean I0 tree:

| Command | Result | Exit |
|---|---|---|
| `npm run typecheck` | 0 errors | 0 |
| `npm run check:stories` | 127 files checked, 0 violations | 0 |
| `npm run check:story-coverage` | 15/15 covered, 0 unproven | 0 |
| `npm run check:i18n` | sq/en/uk/it all 2215 keys, 0 raw-enum leaks | 0 |
| `npm run check:design-tokens` | 28 raw style-value violations (pre-existing, unrelated files), 0 stale-markers | 1 (strict mode — pre-existing, expected per kickoff R9 baseline) |
| `npx vitest run` | 1190 passed / 2 failed (74 files, 72 passed) | 1 (2 pre-existing documented full-run-only timeout flakes: `date-format-ssr-parity.smoke.test.ts`, `RangeDatePicker.smoke.test.tsx` — same pair the backlog has documented as flaky across multiple prior sessions) |
| `npm run build-storybook` | `storybook-static/` built successfully | 0 |
| `node scripts/task420-qa-grid-step.mjs` | **88/88 PASS, 0 FAIL** | 0 |
| `node scripts/task668-qa-grid-1440.mjs --verify` | **160/160 PASS, 0 FAIL** (baseline already existed from Task 668, reused) | 0 |
| `node scripts/task668-qa-header-geometry.mjs` | **12/12 PASS, 0 FAIL** | 0 |

No probe failed on the current tree — I1's stop condition ("if any of them already fails on the current tree, stop and report before writing anything") was not triggered.

## 9. I3/I7 — gate checks re-run after implementation

| Command | Result | Exit |
|---|---|---|
| `node scripts/check-homepage-grid.mjs` | `I-A/supporting: 88/88 PASS` / `I-A/I-B gap: 160/160 PASS` / `I-C header: 12/12 PASS` — **TOTAL: 260/260 PASS, 0 FAIL** | 0 |
| `npm run check:homepage-grid:verify` | See §5 — negative arm 0/260 FAIL, all 6 plants correct, post-plant restore 0/260 FAIL | 0 |
| `npm run typecheck` (re-run, I7) | 0 errors | 0 |
| `npm run check:stories` (re-run, I7) | 127 files, 0 violations — unchanged | 0 |
| `npm run check:story-coverage` (re-run, I7) | 15/15 — unchanged | 0 |
| `npm run check:i18n` (re-run, I7) | 2215×4 — unchanged | 0 |
| `npm run check:design-tokens` (re-run, I7) | **28**/0/0 — unchanged from I1 | 1 (strict mode, pre-existing, unchanged count) |

`check:homepage-grid`'s 260-cell total (88+160+12) matches I1's per-probe cell counts (88+160+12) exactly — R8's live-render-vs-transcribed-table agreement holds.

## 10. I8 — production build, run last (re-run after §12's fix, so this is the final-edit-inclusive build)

`npm run build` — **exit 0**.

```
 ✓ Compiled successfully in 44s
   Checking validity of types ...
 ✓ Generating static pages (40/40)
```

(First run, before the §12 CI-label fix, also exit 0 in 67s with a byte-identical route table — the fix touched only a YAML step-name comment, outside the Next.js build graph.)

Full 54-row route table (counted): `/`, `/_not-found`, `/[locale]`, `/[locale]/[slug]`, `/[locale]/auth/confirm-email`, `/[locale]/auth/login`, `/[locale]/auth/register`, `/[locale]/auth/reset-password`, `/[locale]/auth/verified`, `/[locale]/cabinet`, `/[locale]/contact`, `/[locale]/favorites`, `/[locale]/listings`, `/[locale]/listings/[slug]`, `/[locale]/listings/[slug]/edit`, `/[locale]/listings/create`, `/admin`, `/admin/companies`, `/admin/currency`, `/admin/email-templates`, `/admin/footer`, `/admin/inquiries`, `/admin/inquiries/sales`, `/admin/inquiries/support`, `/admin/legal`, `/admin/listings`, `/admin/listings/[id]/preview`, `/admin/locations`, `/admin/pages`, `/admin/permissions`, `/admin/popular-locations`, `/admin/property-types`, `/admin/reports`, `/admin/settings`, `/admin/support`, `/admin/users`, `/admin/users/[id]`, `/admin/users/new`, `/api/auth-email-hook`, `/api/auth/me`, `/api/cron/inactivity`, `/api/cron/listings-expiry`, `/api/cron/price-alerts`, `/api/cron/saved-searches`, `/api/exchange-rate`, `/api/listings`, `/api/listings/[slug]/view`, `/api/presence`, `/api/property-types`, `/api/upload-avatar`, `/api/upload-company-logo`, `/api/upload-popular-location-photo`, `/auth/callback`, `/auth/confirm` — **54 routes**, all `ƒ` dynamic except `/api/exchange-rate` (`○` static, ISR 1h/1y).

## 11. I9 — encoding gates (after records exist)

Run after this session log and the `docs/backlog.md` edit were written:

| Command | Result | Exit |
|---|---|---|
| `npm run check:file-integrity` | `Checking 5 file(s)` — **PASSED, all 5 clean** (NUL bytes / BOM / JSON parse / `node --check` / truncation) | 0 |
| `npm run check:mojibake` | `scanning 2024 text file(s)` — **0 artifacts in 2024 files** | 0 |

## 12. Self-review finding, caught and fixed before completion

The first CI step label was originally written as `Homepage grid invariants gate (Task 701 — column steps, gaps, header geometry)` — a direct violation of R1's "no task number in the filename, the npm script, **or the CI step label**." Caught on adversarial self-review against AC1 (after §7's diff was first drafted, before this report), corrected to `Homepage grid invariants gate (column steps, gaps, header geometry)`. Re-grepped `.github/workflows/governance-pr.yml` and `package.json` for `Task 701`/task-number leaks in any label or script name — none remain. The script's own internal header comment (not a filename/script-name/CI-label) still names Task 701, consistent with every precedent script in this repo (`check-hydration-console.mjs` etc. all name their originating task in their doc comment).

## 13. Deviations

1. **Matrix structure (A2/R1).** Rather than merging the three probes' widths into one union matrix, the gate runs three separate matrices (88+160+12 = 260 cells), each preserving its source probe's exact story set, width list, and locator mechanism. This was a deliberate choice: the kickoff's own §3.1 table documents that the three probes use different locators (`mechanism-agnostic` vs `tailwind-tokens` vs `first-grid`) and different width lists that agree at every overlapping point but are not identical supersets of each other (e.g. only `task420` tests 375/390/2560; only `task668-grid` tests Latest at all). Merging would have required either re-deriving Latest's values at 375/390/2560 (forbidden by R8/A1, since neither source probe states them) or silently dropping cells the original probes covered. Keeping three matrices is a strict, lossless port of "the same story × width × locale matrix the three probes cover today" (R1), at the cost of overlapping coverage for Featured's column count (asserted in both the step and gap matrices, consistently, at every shared width).
2. **`--verify-gate` per-plant scope.** Each of the 6 plants targets a single representative cell (one story × one width × one locale) rather than the full matrix, to keep the self-test's runtime bounded. Cross-invariant isolation for that plant is proven from the single cell's own returned fields (e.g. the `I-A-Featured` plant's response object shows `columnGap:"16px"` unaffected alongside the tripped `columnCount`). Full-tree isolation (that no OTHER cell anywhere in the 260-cell matrix was disturbed) is proven once, by the final negative-arm re-run after all 6 plants (§5), rather than after each individual plant — acceptable because each plant's `restore()` runs synchronously inside the same `page.evaluate` call before the result is returned, so there is no code path by which a leak could persist only transiently between plants without also surviving to the final check.
3. **Gap-matrix loading-branch skeleton count not ported.** `task668-qa-grid-1440.mjs`'s `EXPECTED_SKELETON_COUNT` assertion (loading-branch skeleton count) is not part of §3.5's 8 named invariants and was left out of the port — the Loading-branch stories are still exercised (for column-count + gap, which ARE named invariants) but their skeleton count is not asserted. This is a narrower port than the original probe on this one axis; flagged for the reviewer to confirm this is acceptable or should be added back.

## 14. Limitations

- The gate measures the **Storybook render** of `FeaturedListings`, `LatestListings`, and `SimilarListings`, not the live app route — identical to all three source probes' own scope; it inherits their assumption that the Storybook story faithfully represents the production component tree.
- `SimilarListings` remains **unmigrated** (still Tailwind grid, steps at 1536px) by design (A4) — this gate protects that as an invariant, it does not fix it.
- The three original probes (`task420-qa-grid-step.mjs`, `task668-qa-grid-1440.mjs`, `task668-qa-header-geometry.mjs`) are **still on disk**, byte-identical, and still not referenced by any CI job or `package.json` script — deleting or wiring them is step 3 of the owner sequence and explicitly out of scope here (R6, §8).
- `check:design-tokens`'s 28 pre-existing violations are in files unrelated to this task (`NotificationCenter.tsx` and others named in the I1/I7 output) and were not touched.

---

## Orchestrator review outcome (Opus, 2026-07-31) — `APPROVED WITH NOTES`

### It is a port, not a wrapper — the predicted defect was avoided

`grep` for `child_process`/`spawn`/`exec` in `scripts/check-homepage-grid.mjs` returns **nothing**; every mention
of the three source probes is a provenance comment naming which table came from where. 782 lines replace 1084 with
no shell-out. A2 satisfied.

**Transcription verified byte-faithful, not re-derived (R8).** Reviewer compared the new tables against
`task668-qa-grid-1440.mjs` directly:

- `WIDTHS` `[320,640,768,1024,1280,1439,1440,1535,1536,1920]` → `GAP_WIDTHS` — identical.
- `EXPECTED_COLS.Featured/.Latest` → `GAP_EXPECTED_COLS` — identical at every one of the ten widths.
- `EXPECTED_GAP_PX {16,12}` → `GAP_EXPECTED_PX` — identical.
- The four `STORIES` entries → `GAP_STORIES` — identical.

A4 is honoured precisely: `STEP_EXPECTED_COLS.similar` reads `1440: 3, 1536: 4` while `.featured` reads
`1440: 4` — so the gate still demands that `SimilarListings` steps at 1536, and the original hardcoded-Tailwind
locator is preserved as evidence it was never migrated.

Cell arithmetic checks out: 11 widths × 4 locales × 2 stories = 88; 10 × 4 × 4 = 160; 3 × 4 = 12. **260 total**,
matching the reported run.

### The self-test exceeds what was asked

All seven runs are in §5 with verbatim JSON cells. Each of the six plants is asserted to trip **its own** named
invariant with "no unrelated cell affected", there is an explicit cross-invariant isolation read-out, and the
executor added a **closing** negative arm after the plants to prove full restore — which R4 did not require.
AC2 is met with margin. The I-B cross-swap (16↔12) does what it was designed to do: the gate distinguishes the
two gaps rather than accepting "some gap".

### CI wiring is exactly as scoped

Two steps, inside `rendered-proof`, immediately after `build-storybook`. No new job, no second
`playwright install`, no second `build-storybook`. The self-test label reproduces the house convention verbatim
("verifies gate detects violations — CI-safe"), matching the existing `check:hydration:verify` and
`check:listing-visibility:verify` steps. `package.json` follows the same `check:<name>` / `:verify` →
`--verify-gate` pair convention and is placed directly after `check:listing-visibility`. No task number appears in
the filename, the npm scripts, or the CI labels — the executor self-caught and fixed a violation of this before
reporting, then re-ran the production build so the evidence covers the final edit.

### Findings

- **F1 `P2` — a source assertion was lost in consolidation, and it is the orchestrator's omission.**
  `scripts/task668-qa-grid-1440.mjs:77` carries `EXPECTED_SKELETON_COUNT = { Featured: 3, Latest: 4 }`, asserted
  on the loading branch as that probe's own AC4. The new gate **includes both `--loading` stories** in its matrix
  and measures their columns and gaps, but does **not** port the skeleton-count assertion — `grep -i skeleton`
  on `check-homepage-grid.mjs` returns zero hits.
  The executor is not at fault: the kickoff's §3.5 invariant table never listed it, and R1 enumerated only
  I-A/I-B/I-C plus the two supporting checks, so this is literal compliance with an incomplete specification.
  **Why it matters:** owner-sequence **step 3 deletes the source probe**, at which point the loading-grid shape
  becomes permanently unasserted — and the rendered matrix cannot cover for it, because
  `HomepageListingGrids/Loading` is a documented noise-flaky story (Task 698 §8.1; the Task 699 review measured
  10 md5-changed cells on it under a zero-code-diff control).
  **Required before step 3:** port `EXPECTED_SKELETON_COUNT` into `check-homepage-grid.mjs` as invariant **I-D**,
  with its own plant in `--verify-gate` on the same per-invariant standard as the other six. Do not delete
  `task668-qa-grid-1440.mjs` until that lands.
- **F2 `NOTE`** — the executor caught the task-number-in-CI-label defect in self-review and re-ran the build after
  fixing it, rather than reporting a stale transcript. Recorded as the standard the queue should hold.

**Requirement coverage.** R1–R10 `VERIFIED` as specified; R1 is complete against its own enumeration, which F1
shows was itself short by one invariant. **Verdict: `APPROVED WITH NOTES`.** No code revision to what shipped.
Owner-sequence step 2 is complete; **step 3 is gated on F1**.
