# Task 573 — Durable gate coverage for the HeroSearch 640–767 two-row band (persist Task 572's proof)

**Sprint:** 43 (FiltersPanel/HeroSearch → Mantine, Epic MM Phase-2 composite)
**Type:** Storybook / rendered-gate infrastructure + regression coverage (NOT a product-UI change)
**Follows / hardens:** Task 572 (HeroSearch Search-button wraps to row 2 in the 640–767px band — approved).
**Why this exists:** Task 572's fix is correct, but its ONLY rendered proof for the 640–767 band was a
**one-off, non-persisted** Playwright capture. The standing gate `npm run screenshots:assert -- --mantine-only`
samples only 320/375/390/1024 (`MANTINE_VIEWPORTS` in `scripts/check-stories-rendered.mjs`), so **no persisted,
CI-runnable gate guards the exact band Task 572 fixes.** A future edit that drops `sm:basis-full` from the Search
button (collapsing it back onto row 1 and re-crushing the Location combobox) would pass every current gate. This
task makes that regression un-shippable.

## Files in scope (the ONLY files this task may change)

- `scripts/check-stories-rendered.mjs` — the rendered gate: add a per-story in-band viewport for HeroSearch **and**
  a HeroSearch-only row-structure assertion. **This is shared verification infrastructure — see the Hard Contract:
  a genuine planted-violation transcript is mandatory, and the orchestrator reviews the diff independently.**
- `docs/critical-flow-registry.md` — row 49 Coverage cell: add the in-band assertion + its command.
- `docs/storybook-governance.md` — document the new per-story extra-viewport + per-story assertion mechanism (one short subsection).
- `docs/backlog.md` (Last Session + mark 573) and `docs/sessions/2026-07-10-task573-herosearch-inband-gate-coverage.md`.

**MUST NOT touch:** `src/components/shared/HeroSearchView.tsx` (or any `src/`/`app/`/`components/` product file),
`theme.ts`, `globals.css`, any locale file, any other story. This task changes NO product UI, adds NO i18n key, NO
breakpoint, NO dependency, NO chrome. Clause 11 (mobile full-width) and clause 16 (TailAdmin) are **N/A — no product
surface is touched** (state this explicitly in the session log; do not fabricate a matrix for a non-change).

## Pre-read (rule-index → Storybook / visual-snapshot + regression bundle)

- **Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (row 49 is the one you extend).
- **Required:** `docs/mantine-responsive-design-system.md` §8 (Mantine proof path) + §13; `docs/storybook-governance.md`
  (§14 enforced gates, §MQ machine-detection limits); `docs/storybook-visual-snapshots.md`; `docs/qa-rules.md`.
- **Only if relevant:** `docs/responsive-screenshot-governance.md` (§MQ machine-detection limits).

Read `scripts/check-stories-rendered.mjs` in full FIRST — specifically `MANTINE_VIEWPORTS` (~line 265),
`discoverMantinePrimitiveStories` (~line 276), `STORY_VIEWPORT_RANGE`/`isOutOfViewportRange` (~line 457), and the
per-cell capture/assert path `captureCell` (~line 644) + the mantine-gate cell loop (~line 1067+). You are extending
these; do not restructure them.

## Current behavior to PRESERVE (must be byte-identical after this task)

- Every NON-HeroSearch Mantine primitive story is captured at EXACTLY 320/375/390/1024 × sq/en/uk/it, as today. The
  per-story extra viewport applies to HeroSearch ONLY — no other story gains or loses a cell.
- The existing assertions (no-h-overflow, full-width-at-mobile, full-width-buttons-at-mobile, popup-bottom-sheet,
  geometry integrity, visual/style integrity, bitmap sanity) are unchanged for every existing cell.
- `--fast`, `VIEWPORTS_FULL`, `STORY_VIEWPORT_RANGE`, the transient-retry logic, and the manifest schema keep working.
- The overall PASS/FAIL/AMBIGUOUS accounting stays consistent (the only NEW cells are HeroSearch's in-band ones).

## Required after-behavior (the new things)

1. **Per-story extra viewport (surgical, NOT global).** Add a map — e.g.
   `MANTINE_STORY_EXTRA_VIEWPORTS = { HeroSearch: [{ name: 'band-700', width: 700, height: 812 }] }` — keyed by the
   SAME `componentName` that `discoverMantinePrimitiveStories` derives from the story title suffix (NEVER a hardcoded
   story id — the script's standing discipline). For each discovered mantine story the effective viewport list =
   `MANTINE_VIEWPORTS` concatenated with `MANTINE_STORY_EXTRA_VIEWPORTS[componentName] ?? []`. Only HeroSearch gets the
   700px cell (× 4 locales = 4 new cells); all other stories are untouched.
   - **Do NOT add 700 to `MANTINE_VIEWPORTS` globally** — that would inject an unvetted width into ~37 unrelated
     overlay/primitive stories, risk new AMBIGUOUS/FAIL noise, and slow every run. Keep it per-story.
2. **HeroSearch-only row-structure assertion (this is what makes the cell a real guard).** A 700px cell that only
   checks "no h-overflow" would NOT catch the regression — the crushed single-row layout also has no overflow. So add a
   targeted assertion that runs ONLY for the HeroSearch story and ONLY when `640 <= viewport.width < 768`:
   - In the page, locate the 4 search-bar controls (the direct children of the `.flex.flex-wrap` container inside the
     `.bg-background` search-bar card — the same set Task 572's one-off script read). Read each one's
     `getBoundingClientRect().top`.
   - Assert the **Search** button's `top` is strictly greater than the **Location** field's `top` (Search sits on a
     LOWER row — i.e. it wrapped). Equivalently: cluster the 4 tops and assert exactly 2 rows with Search alone on row 2.
   - Record the result as a named boolean assertion on the cell (e.g. `cell.assertions.heroSearchWrapInBand`) that is a
     HARD fail reason (never transient — add it to `HARD_FAIL_REASONS`/the non-transient guards so a real defect can't be
     retried into a pass, mirroring `fullWidthControlsAtMobile`).
   - For HeroSearch at `>= 768`, optionally also assert a single row (all 4 tops equal within tolerance). Keep this
     additive and low-risk; if the ≥768 single-row assertion proves flaky against the existing 1024 cell, spec it as
     the primary 700px in-band assert only and STOP-AND-ASK before broadening.
3. The new assertion must have zero effect on any non-HeroSearch story and on HeroSearch cells outside 640–767.

## Positive flow (happy path)

- Actor: CI / a developer running `npm run screenshots:assert -- --mantine-only`.
- The gate discovers `Mantine/Primitives/HeroSearch`, captures it at 320/375/390/**700**/1024 × sq/en/uk/it.
- At the 700px cell (× all 4 locales): the row-structure assertion reads the 4 control tops, finds Search on row 2
  (its top > Location's top), and the cell PASSES. Manifest records `heroSearchWrapInBand: true` for each 700 cell.
- Every other story's cell set and result is identical to before this task. Overall run PASS count = previous PASS +
  the 4 new HeroSearch 700 cells; 0 new FAIL; the 26 pre-existing AMBIGUOUS are unchanged.

## Negative flow (every off-happy-path branch)

- **Planted regression — Search forced back to row 1** (temporarily drop `sm:basis-full` from the Search button in a
  LOCAL working copy of `HeroSearchView.tsx`, rebuild `storybook-static`, run the gate, then REVERT the product file —
  do not commit any product change): the 700px HeroSearch cell's `heroSearchWrapInBand` assertion FAILS (Search top ==
  Location top, single row), the cell is a HARD FAIL (not retried into a pass), and the run reports a non-zero FAIL
  count. **Capture this transcript** — it is the proof the guard is real (a no-op gate is a task failure, clause 15).
- **Non-HeroSearch story:** `MANTINE_STORY_EXTRA_VIEWPORTS[componentName]` is `undefined` → no extra cell, no
  row-structure assertion, byte-identical behavior. Prove with the unchanged per-story cell counts in the manifest.
- **HeroSearch at 320/375/390:** below 640 → the in-band assertion does NOT run (guarded by `640 <= w < 768`); the
  existing mobile full-width assertions run exactly as before. No double-assert, no conflict.
- **HeroSearch at 1024:** ≥768 → in-band assertion does not run; if the optional single-row assert is included it runs
  here and at 700 only as specced. No change to the existing 1024 PASS.
- **Missing/late-rendered controls (style-not-ready):** if the 4 controls are not found (transient unstyled render),
  reuse the existing style-integrity/transient-retry path — do NOT emit a false hard FAIL on a capture miss; only a
  genuinely-rendered wrong-row layout is a hard fail.
- **Story renamed / not discovered:** if no story maps to `HeroSearch`, the extra-viewport map simply contributes
  nothing (no crash). Do not throw on a missing key.

## Regression coverage (clause 15 — critical-flow-registry row 49)

- Baseline: run `npm run screenshots:assert -- --mantine-only` on the current tree; record HeroSearch 16/16 PASS and
  the overall count BEFORE your change.
- After: HeroSearch is 20/20 (16 + 4 new 700 cells) PASS; overall = baseline + 4 PASS, 0 new FAIL.
- Planted-violation transcript (per Negative flow) proving the new `heroSearchWrapInBand` assertion genuinely FAILS on
  the reverted layout, then reverts to green.
- Extend `docs/critical-flow-registry.md` row 49 **Coverage** cell to name the in-band gate assertion
  (`heroSearchWrapInBand` @700 × sq/en/uk/it) and its command, so the row's regression shield now covers the 640–767
  behavior with a PERSISTED gate (not the retired one-off script).

## Hard contract (verified against the real diff on return)

1. Scope = the files listed at top only. No product-UI edit; `HeroSearchView.tsx` is untouched in the committed diff
   (any planted change to it during the negative-flow test is REVERTED before completion — prove via re-read).
2. Do not invent architecture. Extend the existing gate structures (`MANTINE_VIEWPORTS`, discovery, `captureCell`,
   `HARD_FAIL_REASONS`). If the row-structure assertion cannot be inserted cleanly into the existing cell/assert flow,
   or the ≥768 single-row assert conflicts with the existing 1024 cell, **STOP and ASK** — do not restructure the gate
   or add a parallel test runner without approval.
3. Keep story identification off the discovered `componentName`/title — NO hardcoded story id (matches the script's
   existing no-hardcode rule).
4. File-integrity (clause 14): after editing `scripts/check-stories-rendered.mjs`, read it back — 0 NUL, no BOM,
   `node --check scripts/check-stories-rendered.mjs` exits 0, not truncated. Paste the green integrity transcript.
5. `npx tsc --noEmit` = 0 (no new errors); `npm run lint` no new errors/warnings on the touched script; the full
   `screenshots:assert -- --mantine-only` run is green with the new cells; the planted-violation FAIL transcript is
   present and reverted. AC-by-AC self-audit table + final `Self-validation:` line.
6. "Files Changed" table (one row per path + rationale). **Do NOT run git / do NOT emit `git add`/`git commit`** — the
   orchestrator emits the commit at review.
7. Update `docs/backlog.md` (Last Session + mark 573) and add the session log.

## Acceptance criteria (each verifiable in the diff at file:line OR in a named gate transcript/manifest cell)

1. `MANTINE_STORY_EXTRA_VIEWPORTS` (or equivalently-named per-story map) added, keyed by `componentName`, with
   `HeroSearch → [{ name:'band-700', width:700, height:812 }]`; the mantine cell loop unions it with `MANTINE_VIEWPORTS`
   per story; NO change to `MANTINE_VIEWPORTS` itself. *(scripts/check-stories-rendered.mjs)*
2. A HeroSearch-only, `640<=w<768`-only assertion reads the 4 search-bar control tops and asserts Search.top >
   Location.top (Search on row 2); recorded as a named HARD (non-transient) cell assertion. *(script diff)*
3. Manifest/run shows HeroSearch captured at 320/375/390/700/1024 × sq/en/uk/it (20 cells), all PASS; every other
   story's cell count is unchanged. *(gate manifest)*
4. Planted-violation (drop `sm:basis-full` from Search in a local copy, rebuild, run) → the new assertion FAILS at the
   700 cells (hard fail, non-zero FAIL count); product file reverted; re-run green. *(transcript)*
5. `node --check scripts/check-stories-rendered.mjs` = 0, file-integrity clean; `tsc --noEmit` = 0; lint clean on the
   script. *(transcripts)*
6. `docs/critical-flow-registry.md` row 49 Coverage cell extended with the `heroSearchWrapInBand` @700 assertion + command. *(diff)*
7. `docs/storybook-governance.md` gains a short subsection documenting the per-story extra-viewport + per-story assertion mechanism. *(diff)*
8. No product UI touched; clause 11 / clause 16 explicitly marked N/A (no surface changed) in the session log; scope clean. *(diff + log)*

## STOP-AND-ASK triggers

- The row-structure assertion cannot be inserted without restructuring `captureCell`/the cell loop.
- The ≥768 optional single-row assertion is flaky against the existing 1024 cell.
- You find the existing gate already has a per-story extra-viewport facility (then reuse it and note so — do not add a second).
- Any temptation to add a new Playwright test runner / persist a standalone spec instead of extending this gate.
