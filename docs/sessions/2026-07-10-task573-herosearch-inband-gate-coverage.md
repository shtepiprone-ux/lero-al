# Session — Task 573: Durable gate coverage for the HeroSearch 640–767px band

**Date:** 2026-07-10
**Executor:** Sonnet 4.6
**Kickoff:** `tasks/Sprints/Sprint_43_kickoff_prompt_Task_573_HeroSearchInBandGateCoverage.md`
**Type:** Storybook / rendered-gate infrastructure only — NO product-UI change.
**Depends on:** Task 572 (HeroSearch Search-button wraps to row 2 in the 640–767px band — implemented,
uncommitted in the working tree at session start).

## Problem recap

Task 572's fix is correct, but its ONLY rendered proof for the 640–767px band was a one-off,
non-persisted Playwright script. The standing gate (`npm run screenshots:assert -- --mantine-only`)
samples only 320/375/390/1024 (`MANTINE_VIEWPORTS`), so nothing CI-runnable guarded the exact band
Task 572 fixes — a future edit dropping `sm:basis-full` from the Search button would pass every
existing gate and silently re-introduce the crushed-Location regression.

## What was implemented

`scripts/check-stories-rendered.mjs` (the only code file touched):

1. **`MANTINE_STORY_EXTRA_VIEWPORTS`** (new const, ~line 272) — `{ HeroSearch: [{ name: 'band-700',
   width: 700, height: 812 }] }`, keyed by the SAME `componentName` `discoverMantinePrimitiveStories()`
   already derives from the story title suffix (never a hardcoded story id). `discoverMantinePrimitiveStories()`
   now carries `componentName` onto every discovered story object (line ~316) so the main loop and
   `captureCell` can read it.
2. **Per-story effective viewport union** — the Phase-0 mantine-gate loop (~line 1238) now builds
   `effectiveViewports = [...MANTINE_VIEWPORTS, ...(MANTINE_STORY_EXTRA_VIEWPORTS[story.componentName] ?? [])]`
   per story, instead of iterating the global `MANTINE_VIEWPORTS` directly. `MANTINE_VIEWPORTS` itself is
   UNCHANGED. `totalMantineCells` (~line 1220) sums the per-story extra count so the printed cell total
   stays accurate (596 = 592 + 4, not 592).
3. **HeroSearch-only, 640≤w<768-only row-structure assertion** (new Assertion (f), ~line 1049, inside
   `captureCell`) — reads the 4 search-bar controls (direct children of the `.flex.flex-wrap` container
   inside the search-bar card) via `getBoundingClientRect().top` and asserts the Search button's top is
   strictly below (>1px) the Location field's top. Result recorded as `cell.assertions.heroSearchWrapInBand`
   (`true`/`false`/`null`).
4. **Non-transient hard-fail wiring** — `isTransientFailure()` (~line 528) gained
   `if (cell.assertions.heroSearchWrapInBand === false) return false;`, alongside the pre-existing
   `fullWidthControlsAtMobile`/`fullWidthButtonsAtMobile`/`popupBottomSheetAtMobile`/`visualIntegrity.pass`
   guards — this IS the file's existing mechanism for "real defect, never retried into a false pass"
   for assertions that live on `cell.assertions` (as opposed to `HARD_FAIL_REASONS`, which matches
   `renderCheck.failReason` strings from a different code path). `hardPass` (~line 1095) now also requires
   `heroSearchWrapInBand !== false`.
5. **Doc header comment** (~line 27) and a failed-cell console line (~line 1586) added for the new
   assertion, matching the file's existing self-documentation style.

**Mid-task bug found and fixed (still scoped to `scripts/check-stories-rendered.mjs`):** the first
implementation used `document.querySelector('.bg-background')` to locate the search-bar card. This is
AMBIGUOUS inside Storybook: `.storybook/preview.tsx`'s `withTheme` decorator wraps EVERY story
(Mantine included — it does not check `skipCanvas`) in an outer
`<div class="min-h-screen bg-background text-foreground">`, which `querySelector` matches FIRST — never
reaching the real search-bar card nested inside. This was caught empirically: the first "after script
change" run showed `heroSearchWrapInBand: null` on all 4 band-700 cells (should have been `true`) even
though the story was rendering correctly. Fixed by narrowing to the element that ALSO carries the card's
other literal classes (`border` + `shadow-xl`, from `HeroSearchView.tsx`'s own className string), which
can never resolve to the outer theme wrapper. Re-verified `true` after the fix (see transcripts below).

`docs/critical-flow-registry.md` row 49 — Coverage cell extended with a new sentence naming
`heroSearchWrapInBand` @700 and the command, explicitly stating this replaces the retired Task-572
one-off script as the authoritative proof for the 640–767 band.

`docs/storybook-governance.md` — new `§14.9.17` subsection documenting the per-story extra-viewport +
per-story assertion mechanism, so a future primitive needing a similar narrow-band guard can reuse the
pattern instead of reinventing it.

## AC-by-AC self-audit

| # | Acceptance criterion | Status | Evidence |
|---|---|---|---|
| 1 | `MANTINE_STORY_EXTRA_VIEWPORTS` added, keyed by `componentName`, `HeroSearch → [{name:'band-700',width:700,height:812}]`; unioned per story with `MANTINE_VIEWPORTS`; `MANTINE_VIEWPORTS` itself unchanged | ✅ | `scripts/check-stories-rendered.mjs:272-296` (const), `:1238-1246` (union in loop); `MANTINE_VIEWPORTS` (`:265-270`) byte-identical to before |
| 2 | HeroSearch-only, `640<=w<768`-only assertion reads the 4 control tops, asserts Search.top > Location.top, recorded as a named HARD (non-transient) cell assertion | ✅ | `scripts/check-stories-rendered.mjs:1049-1081` (assertion), `:528-531` (non-transient wiring in `isTransientFailure`), `:1095` (`hardPass` gate) |
| 3 | Manifest shows HeroSearch at 320/375/390/700/1024 × sq/en/uk/it (20 cells), all PASS; every other story's cell count unchanged | ✅ | Final clean manifest `.screenshots/rendered-assert/2026-07-10T21-13/manifest.json`: HeroSearch 20/20 PASS, `wrap:true` on all 4 band-700 cells (see transcript). CountButton/FilterControls/FiltersPanelShell each still exactly 16/16 (unchanged cell counts) |
| 4 | Planted-violation (drop `sm:basis-full` locally, rebuild, run) → new assertion FAILs at the 700 cells (hard fail, non-zero FAIL count); product file reverted; re-run green | ✅ | Planted run `.screenshots/rendered-assert/2026-07-10T15-31/manifest.json`: 4 FAIL, all 4 HeroSearch band-700 cells, `wrap:false`, `retryCount:0` (never retried into a pass); `HeroSearchView.tsx` reverted, `diff` against pre-edit backup = empty (see transcript); final re-run green (see below) |
| 5 | `node --check` = 0, file-integrity clean; `tsc --noEmit` = 0; lint clean on the script | ✅ | Transcripts below |
| 6 | `docs/critical-flow-registry.md` row 49 Coverage cell extended with the `heroSearchWrapInBand` @700 assertion + command | ✅ | `docs/critical-flow-registry.md` row 49, new trailing sentence added to the Coverage cell |
| 7 | `docs/storybook-governance.md` gains a short subsection documenting the per-story extra-viewport + per-story assertion mechanism | ✅ | `docs/storybook-governance.md` §14.9.17 (new, ~45 lines) |
| 8 | No product UI touched; clause 11/16 N/A (no surface changed), stated explicitly; scope clean | ✅ | See "Clause 11/16 — N/A" below. `HeroSearchView.tsx` shows ZERO diff at session end (scratch edit fully reverted, `diff` transcript below) |

## Clause 11 / Clause 16 — N/A

This task changes NO product UI, adds NO i18n key, NO breakpoint, NO chrome, NO dependency. The only
product file touched during the session was `src/components/shared/HeroSearchView.tsx`, and ONLY as a
temporary, fully-reverted scratch edit to prove the new gate assertion genuinely detects a regression
(mandatory per clause 15 / kickoff's planted-violation requirement). Clause 11 (mobile <640 full-width)
and clause 16 (TailAdmin conformance) are both **N/A** — no product surface exists in the committed diff
for either clause to apply to. This is stated explicitly rather than fabricating a rendered matrix for a
non-change.

## Gate transcripts

### 1. Baseline (BEFORE any script change)

```
$ npm run screenshots:assert -- --mantine-only
Results: 566/592 PASS, 0 FAIL, 26 AMBIGUOUS (needs-owner-decision)
```
Manifest: `.screenshots/rendered-assert/2026-07-10T13-19/manifest.json`
`{"total":592,"passed":566,"failed":0,"outOfRange":0,"ambiguousOnly":26}`
HeroSearch: 16/16 PASS (all `mantine-primitives-herosearch--default` cells `verdict:"pass"`).

### 2. After the gate-script change (product file untouched, no violation planted)

Selector bug found + fixed mid-task (see above); this is the transcript AFTER the fix.

```
$ npm run screenshots:assert -- --mantine-only
    Mantine/Primitives/* stories (Task 529 ENFORCED gate, always runs incl. --fast): 37
    (596 cells @ 320/375/390/1024 × 4 locales + 4 per-story extra-viewport cells (Task 573); ...)
Results: 570/596 PASS, 0 FAIL, 26 AMBIGUOUS (needs-owner-decision)
```
Manifest: `.screenshots/rendered-assert/2026-07-10T13-51/manifest.json`
`{"total":596,"passed":570,"failed":0,"outOfRange":0,"ambiguousOnly":26}`
HeroSearch: 20/20 PASS. All 4 `band-700` cells: `{verdict:"pass", heroSearchWrapInBand:true}` (sq/en/uk/it).
570 = 566 baseline + 4 new PASS, 0 new FAIL — exactly matches the spec's "Positive flow" expectation.

### 3. Planted violation (`sm:basis-full` dropped from the Search button, LOCAL scratch edit)

```
$ diff HeroSearchView.tsx HeroSearchView.tsx.orig-backup
124c124
<               className="px-6 font-semibold grow shrink basis-0 md:grow-0 md:basis-auto"
---
>               className="px-6 font-semibold grow shrink basis-0 sm:basis-full md:grow-0 md:basis-auto"

$ npm run build-storybook   # fresh rebuild, confirmed via bundle grep the violation is baked in
$ grep -l "sm:basis-full" storybook-static/assets/*.js | grep -i hero   # → (no match, confirms dropped)

$ npm run screenshots:assert -- --mantine-only
Results: 566/596 PASS, 4 FAIL, 26 AMBIGUOUS (needs-owner-decision)

❌ Failed cells:
  Mantine/Primitives/HeroSearch/Default × sq × band-700
    ✗ HeroSearch: Search button did not wrap to row 2 in the 640-767 band (Task 573)
  Mantine/Primitives/HeroSearch/Default × en × band-700
    ✗ HeroSearch: Search button did not wrap to row 2 in the 640-767 band (Task 573)
  Mantine/Primitives/HeroSearch/Default × uk × band-700
    ✗ HeroSearch: Search button did not wrap to row 2 in the 640-767 band (Task 573)
  Mantine/Primitives/HeroSearch/Default × it × band-700
    ✗ HeroSearch: Search button did not wrap to row 2 in the 640-767 band (Task 573)
```
Manifest: `.screenshots/rendered-assert/2026-07-10T15-31/manifest.json`
`{"total":596,"passed":566,"failed":4,"outOfRange":0,"ambiguousOnly":26}`
All 4 failing cells: `{viewport:"band-700", verdict:"fail", heroSearchWrapInBand:false, retryCount:0,
hardAfterRetries:undefined}` — `retryCount:0` proves it was NEVER retried into a false pass (a single
hard attempt, exactly what a non-transient guard is for). This is the mandatory clause-15 proof that the
new gate cell is a REAL guard, not a no-op.

### 4. Revert + re-run (final state)

```
$ diff HeroSearchView.tsx HeroSearchView.tsx.orig-backup
ZERO_DIFF_CONFIRMED   # (diff exits 0, no output — byte-identical to the pre-scratch-edit backup)

$ npm run build-storybook   # fresh rebuild with the reverted (fixed) source
$ grep -l "sm:basis-full" storybook-static/assets/*.js | grep -i hero
storybook-static/assets/HeroSearch.stories-DVn1ji-v.js   # confirms the fix is restored in the bundle

$ npm run screenshots:assert -- --mantine-only            # first re-run
Results: 569/596 PASS, 1 FAIL, 26 AMBIGUOUS (needs-owner-decision)
❌ Failed cells:
  Mantine/Primitives/FilterControls/Default × en × mobile-390
    ✗ render failure [blank-canvas]: near-uniform (bg=100.0%, var=0.0)
```
This 1 FAIL is on `FilterControls` (an unrelated story — no `MANTINE_STORY_EXTRA_VIEWPORTS` entry, no
`heroSearchWrapInBand` involvement), `mobile-390` (not `band-700`), with `pageErrors:[]`/`consoleErrors:[]`
— a genuine one-off environmental render flake (this machine had heavy concurrent load throughout the
session — a background gate run had to be killed for hanging earlier, and the platform's own Bash/
PowerShell command classifier was unavailable for roughly an hour mid-session). HeroSearch itself was
already 20/20 PASS with `heroSearchWrapInBand:true` on all 4 band-700 cells in this same run — the flake
was on a different, unrelated story.

```
$ npm run screenshots:assert -- --mantine-only            # confirmation re-run
Results: 570/596 PASS, 0 FAIL, 26 AMBIGUOUS (needs-owner-decision)
```
Manifest: `.screenshots/rendered-assert/2026-07-10T21-13/manifest.json`
`{"total":596,"passed":570,"failed":0,"outOfRange":0,"ambiguousOnly":26}`
The `FilterControls` flake did NOT reproduce — confirms environmental, not a regression from this task's
diff (which touches zero code paths `FilterControls` runs through). Final state: back to 570/596/0/26,
identical to transcript #2 (after-script-change, before-violation).

Per-story breakdown (final clean manifest):

| Story | Cells | PASS | FAIL |
|---|---|---|---|
| `Mantine/Primitives/HeroSearch` | 20 | 20 | 0 |
| `Mantine/Primitives/CountButton` | 16 | 16 | 0 |
| `Mantine/Primitives/FilterControls` | 16 | 16 | 0 |
| `Mantine/Primitives/FiltersPanelShell` | 16 | 16 | 0 |

The 26 AMBIGUOUS cells are the same pre-existing `ambiguous-overlap`/`ambiguous-offscreen` findings on
`Combobox`/`RangeDatePicker`/`Tabs` documented in every prior Sprint 43 session log — unrelated to this
task, unchanged in count across all 5 runs this session.

## File-integrity transcript (clause 14)

```
$ node --check scripts/check-stories-rendered.mjs
(exits 0, no output)

$ tr -cd '\000' < scripts/check-stories-rendered.mjs | wc -c   → 0
$ head -c3 scripts/check-stories-rendered.mjs | od -An -tx1     → 23 21 2f   (#!/  — no BOM)

$ tr -cd '\000' < docs/critical-flow-registry.md | wc -c        → 0
$ head -c3 docs/critical-flow-registry.md | od -An -tx1         → 23 20 43   (# C  — no BOM)

$ tr -cd '\000' < docs/storybook-governance.md | wc -c          → 0
$ head -c3 docs/storybook-governance.md | od -An -tx1           → 23 20 53   (# S  — no BOM)

$ tr -cd '\000' < src/components/shared/HeroSearchView.tsx | wc -c → 0
$ head -c3 src/components/shared/HeroSearchView.tsx | od -An -tx1  → 27 75 73  ('us — no BOM)
```
0 NUL bytes, no BOM, not truncated (each file's tail was re-read via the Read tool and confirmed to end
at its intended final line) on all 4 touched files.

## tsc / lint

```
$ npx tsc --noEmit
(0 errors)

$ npx eslint scripts/check-stories-rendered.mjs
  0:0  warning  File ignored because of a matching ignore pattern.
✖ 1 problem (0 errors, 1 warning)
```
`scripts/**` is globally ignored by `eslint.config.mjs` (pre-existing rule, line ~103 — "Utility scripts
are Node.js/CommonJS files — not part of the Next.js app"), unchanged by this task. 0 errors, matching
the baseline for every file in `scripts/`.

## Environment note (transparency)

This session encountered two infrastructure issues unrelated to the implementation itself, both worth
recording:
1. A `screenshots:assert -- --mantine-only` run hung mid-execution (stalled with zero output growth for
   several minutes despite the static server still listening on port 6008) and had to be killed
   (`taskkill /F /PID ...`) and restarted from scratch. Consistent with heavy concurrent system load
   observed throughout the session (dozens of concurrent `node`/`chrome` processes from other sessions on
   the same machine).
2. The platform's own Bash/PowerShell command-safety classifier became unavailable for roughly an hour
   mid-session (`"claude-sonnet-5 is temporarily unavailable, so auto mode cannot determine the safety of
   Bash right now"`), blocking ANY `node`/`npm run` invocation (while shell builtins like `echo`/`pwd`/
   `netstat` continued to work) — confirmed via ~20 varied retry attempts across both Bash and PowerShell
   tools before it cleared on its own. Neither issue reflects a defect in the delivered gate script.

## Files Changed

| Path | Rationale |
|---|---|
| `scripts/check-stories-rendered.mjs` | Added `MANTINE_STORY_EXTRA_VIEWPORTS` (per-story extra viewport map) + `componentName` threading through `discoverMantinePrimitiveStories()` + per-story effective-viewport union in the Phase-0 loop + the new HeroSearch-only in-band `heroSearchWrapInBand` row-structure assertion (Assertion f) + its non-transient wiring in `isTransientFailure`/`hardPass` + doc-comment/console-line updates |
| `docs/critical-flow-registry.md` | Row 49 Coverage cell extended — names the new persisted `heroSearchWrapInBand` @700 assertion + command, replacing the retired Task-572 one-off script as the band's authoritative proof |
| `docs/storybook-governance.md` | New §14.9.17 subsection documenting the per-story extra-viewport + per-story assertion mechanism for future reuse |
| `docs/backlog.md` | Last Session entry updated (see below) |
| `docs/sessions/2026-07-10-task573-herosearch-inband-gate-coverage.md` | This session log |

**Not touched (confirmed via the final `diff` transcript above):** `src/components/shared/HeroSearchView.tsx`
— the planted-violation scratch edit was made and fully reverted; the file is byte-identical to its
pre-session state (Task 572's already-uncommitted fix, untouched). No other `src/`/`app/`/`components/`
file, no `theme.ts`, no `globals.css`, no locale file, no other story file.

**Incidental (not authored by this task, regenerated by every `screenshots:assert` run):**
`docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` — the harness's own
standing output file, already showing as modified before this session started.

## STOP-AND-ASK items

None of the kickoff's listed triggers applied:
- The row-structure assertion inserted cleanly into the existing `captureCell` cell/assert flow without
  restructuring it (single new assertion block between the existing popup-bottom-sheet check and the
  Layer-3 geometry check).
- The optional ≥768 single-row assertion was deliberately NOT implemented (kept scope to the primary
  700px in-band assert only, per the kickoff's explicit allowance to drop it and note the decision rather
  than risk destabilizing the existing, already-passing 1024 cell).
- No pre-existing per-story extra-viewport facility was found — `MANTINE_STORY_EXTRA_VIEWPORTS` is new,
  confirmed via reading the full file before starting.
- No new test runner or standalone spec file was added — everything extends the existing
  `check-stories-rendered.mjs` gate structures (`MANTINE_VIEWPORTS`, discovery, `captureCell`,
  `isTransientFailure`) as instructed.

## Self-validation

`node --check` = 0 (script parses, not truncated). `tsc --noEmit` = 0. Lint on the touched script = 0
errors (pre-existing `scripts/**` ignore, unchanged). File-integrity clean on all 4 touched files (0 NUL,
no BOM, not truncated). Baseline 592/566/0/26 → after-fix 596/570/0/26 (HeroSearch 20/20, +4 PASS/0 FAIL
exactly as spec'd) → planted-violation 596/566/4/26 (4 hard FAILs, `retryCount:0`, non-transient, all 4 on
HeroSearch's new band-700 cells, zero effect on any other story) → reverted + rebuilt → confirmed green
570/596/0/26 (one intervening unrelated environmental flake on `FilterControls` did not reproduce on
re-run). `HeroSearchView.tsx` shows ZERO diff against its pre-session state. Scope held to the 5 files
listed in the kickoff; no drive-by edits; no git commands run. **Self-validation: PASS.**
