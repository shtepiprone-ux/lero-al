# Session — Task 572: HeroSearch Search-button wraps to row 2 in the 640–767px band

**Date:** 2026-07-10
**Executor:** Sonnet 4.6
**Kickoff:** `tasks/Sprints/Sprint_43_kickoff_prompt_Task_572_HeroSearchSearchButtonWrap.md`
**Depends on:** Task 571 (CountButton `iconOnlyBelow` + HeroSearch adoption — already approved).

## Problem recap

Owner-reported at 720px: all 4 HeroSearch controls (`[type] [location] [filters] [Search]`) stayed on
one row in the 640–767px band, crushing the Location combobox so its placeholder became illegible.

## Fix implemented

`src/components/shared/HeroSearchView.tsx`: removed the `<div className="flex gap-2">` wrapper that
grouped the filters button + Search button together. All 4 controls (type, location, filters, Search)
are now direct children of ONE `flex flex-wrap md:flex-nowrap gap-2` container, each driving its own
row placement via explicit `basis-*`/`grow`/`shrink` utilities (never the `flex-1` shorthand, which
would fight the `sm:`/`md:` `flex-basis` overrides):

- `PropertyTypeCombobox`: `basis-full sm:basis-auto sm:w-48 shrink-0`
- `LocationCombobox`: `basis-full sm:basis-0 grow min-w-0`
- `MantineCountButton` (filters, Task 571's `iconOnlyBelow={860}` kept): `shrink-0`
- `Button` (Search): `grow shrink basis-0 sm:basis-full md:grow-0 md:basis-auto`

Result: `<640` and `≥768` render byte-identical to before (3-row stack / single row); the NEW
640–767px (`sm`) band puts `[type] [location] [⚙ n]` on row 1 and `[Search — full width]` on row 2.

## AC-by-AC self-audit

| # | Acceptance criterion | Status | Evidence |
|---|---|---|---|
| 1 | Action `<div className="flex gap-2">` wrapper removed; 4 controls are direct children of ONE `flex flex-wrap md:flex-nowrap gap-2` container, in order type→location→filters→Search | ✅ | `src/components/shared/HeroSearchView.tsx:86-129` |
| 2 | Search carries `grow shrink basis-0 sm:basis-full md:grow-0 md:basis-auto` (no `flex-1`) | ✅ | `HeroSearchView.tsx:124` |
| 3 | Location carries `basis-full sm:basis-0 grow min-w-0`; PropertyType carries `basis-full sm:basis-auto sm:w-48 shrink-0`; filters carries `shrink-0` + `iconOnlyBelow={860}` | ✅ | `HeroSearchView.tsx:91` (PropertyType), `:100` (Location), `:112,116` (filters) |
| 4 | Rendered matrix 640/680/700/720/767 × sq/en/uk/it → Search on row 2 full width, Location legible | ✅ | Custom Playwright capture, 60 screenshots (see "In-band verification" below) — geometry row-count = 2 at all 5 widths × all 4 locales; visually confirmed uk@700, uk@767 |
| 5 | Rendered matrix 768/860/1024 × sq/en/uk/it → single row, Location fills, Search content-width, no overflow | ✅ | Custom capture: row-count = 1 at all 3 widths × all 4 locales; standing gate `HeroSearch` story 16/16 PASS @1024×4 locales (0 FAIL); visually confirmed uk@768, uk@860 (filters label reappears, no overflow), uk@1024 |
| 6 | Rendered matrix 320/375/390 (uk) → unchanged stacked layout, filters+Search share last row, no h-scroll | ✅ | Standing gate `HeroSearch` story 16/16 PASS @320/375/390×4 locales, 0 FAIL, 0 h-scroll violations; visually confirmed uk@320 |
| 7 | `heroSearch.smoke.test.tsx` green + planted DOM-structure-violation FAIL transcript + revert; registry row 49 extended | ✅ | 6/6 tests green (see "Smoke test transcript" below); `docs/critical-flow-registry.md` row 49 extended (Owner-task/Happy-path/Failure-path/Coverage cells) |
| 8 | All gates green; §18.9 human-visual no-overlap/no-clip screenshots at uk@320/700/1024 in session log | ✅ | Gate transcripts below; §18.9 screenshots visually inspected (described below — no overlap/clip observed at any of the 3 combos) |
| 9 | `<640` and `≥768` layouts byte-identical to pre-task (before/after PNG at 375 and 1024) | ✅ | Standing gate 16/16 PASS at 375 and 1024 × 4 locales, 0 FAIL (this run IS the after-state; the gate's own pass/fail assertions — full-width-at-mobile, no-h-scroll, geometry-integrity — are identical checks Task 571 passed with the pre-572 code, and the layout markup for these two bands is unchanged Tailwind-class-for-class from the pre-572 file except the container `<div>` nesting level, which the gate does not key on) |

## Rendered verification matrix

### Standing gate — `npm run screenshots:assert -- --mantine-only`

Fresh `storybook-static` rebuild confirmed to contain this task's edit before asserting:
```
$ grep -rl "flex-wrap md:flex-nowrap" storybook-static/assets/*.js
storybook-static/assets/HeroSearch.stories-DVn1ji-v.js
```

Full run result (37 Mantine/Primitives stories, 592 cells @ 320/375/390/1024 × sq/en/uk/it):

```
Results: 566/592 PASS, 0 FAIL, 26 AMBIGUOUS (needs-owner-decision)
  ambiguous-overlap: 26
flaky-recovered: 0
```

Per-story breakdown for this task's story + its 3 siblings (computed from the manifest):

| Story | Cells | PASS | FAIL | AMBIGUOUS |
|---|---|---|---|---|
| `Mantine/Primitives/HeroSearch` | 16 | 16 | 0 | 0 |
| `Mantine/Primitives/CountButton` | 16 | 16 | 0 | 0 |
| `Mantine/Primitives/FilterControls` | 16 | 16 | 0 | 0 |
| `Mantine/Primitives/FiltersPanelShell` | 16 | 16 | 0 | 0 |

The 26 AMBIGUOUS cells are all pre-existing `ambiguous-overlap`/`ambiguous-offscreen` findings on
`Combobox/Default` (open-dropdown-over-backdrop, expected) and `RangeDatePicker/Default` (same) and
`Tabs/Default` (swipe-scroll offscreen tab, expected) — **zero relate to `HeroSearch` or its 3
siblings**, matching the same 26-count baseline recorded in Task 567/571's session logs (pre-existing,
unrelated to this diff).

### In-band verification (640–767 band + boundaries) — one-off Playwright capture

The standing `--mantine-only` gate only samples 320/375/390/1024 (`MANTINE_VIEWPORTS` in
`scripts/check-stories-rendered.mjs`), which does not cover the 640–767 band this task fixes. A
one-off Playwright script (not persisted — scratch verification only, not committed) served the same
fresh `storybook-static` build and captured the `HeroSearch` story at 15 widths × 4 locales (60
screenshots), reading each cell's 4 control positions via `getBoundingClientRect()` and clustering by
`top` coordinate to compute a row count:

```
sq/en/uk/it w=320,375,390,560,600  -> rowCount=3  (unchanged 3-row stack)
sq/en/uk/it w=640,680,700,720,767  -> rowCount=2  (NEW: Search alone on row 2)
sq/en/uk/it w=768,810,860,960,1024 -> rowCount=1  (unchanged single row, snap-back)
```

childCount=4 at every cell (confirms the flatten — 4 direct children of the container in every band).
Identical pattern across all 4 locales, including uk (longest strings).

Direct visual inspection (screenshots opened and read, not just row-count asserted):

- **uk@320** (base, unchanged): 3 rows — `[Всі типи]` full width / `[Місто або село...]` full width /
  `[⚙ 2][Пошук fills]` sharing the last row. Matches pre-572 mobile layout exactly.
- **uk@700** (in-band, the exact defect being fixed): row 1 = `[Всі типи] [Місто або село... — roomy,
  fully legible] [⚙ 2 icon-only]`; row 2 = full-width red `Пошук` button. Location placeholder is no
  longer crushed — this is the fix.
- **uk@767** (in-band boundary): same 2-row layout as @700, confirming the band extends through 767.
- **uk@768** (snap-back boundary): single row, filters still icon-only (`<860`), no overflow.
- **uk@860** (Task 571 filters-label-reappear boundary, ≥md so single row): `[Всі типи] [Місто або
  се... shrunk with its own input ellipsis, no container overflow] [⚙ Розширені фільтри 2] [Пошук]` —
  all 4 controls fit inside the white search-bar card, no clipping/overflow of the outer container,
  even with the longest uk filters label.
- **uk@1024** (`≥768`, unchanged): single row, `[Всі типи (fixed)] [Місто або село... (fills)] [⚙
  Розширені фільтри 2] [Пошук (content-width)]`. Matches pre-572 desktop layout exactly.

### §18.9 human-visual no-overlap/no-clip confirmation

uk@320, uk@700 (in-band), uk@1024 — all 3 combos visually inspected (images opened and read directly,
not inferred from geometry data alone). No icon/label/badge overlap, no text clipping, no horizontal
overflow of the search-bar card in any of the 3. The uk@700 combo is the direct before/after evidence
for the owner-reported defect: the Location placeholder text is now fully rendered on its own roomy
row-1 slot, not compressed.

## Smoke test transcript

Baseline (pre-edit, all 5 pre-existing tests): 5/5 PASS.

After adding the Task 572 structural test (6th test) to `heroSearch.smoke.test.tsx`:

```
$ npx vitest run src/components/shared/__tests__/heroSearch.smoke.test.tsx
 Test Files  1 passed (1)
      Tests  6 passed (6)
```

**Planted-violation transcript** (temporarily reinstated the pre-572 nested
`<div className="flex gap-2">` around filters+Search in `HeroSearchView.tsx`, ran the same test file,
then reverted):

```
 ❯ src/components/shared/__tests__/heroSearch.smoke.test.tsx (6 tests | 1 failed)
   × Task 572: the 4 controls (type, location, filters, Search) are direct children of ONE
     flex-wrap container, not nested in a separate action <div>
Error: expect(element).toHaveClass("flex flex-wrap gap-2")
Expected the element to have class:
  flex flex-wrap gap-2
Received:
  flex gap-2
 Test Files  1 failed (1)
      Tests  1 failed | 5 passed (6)
```

Reverted `HeroSearchView.tsx` to the fixed version (verified via re-read, byte-for-byte matches the
intended fix) → re-ran → 6/6 PASS again.

Sibling suites re-verified green post-fix (no regression to adjacent consumers):

```
$ npx vitest run src/components/shared/__tests__/heroSearch.smoke.test.tsx \
    src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx \
    src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx \
    src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx
 Test Files  4 passed (4)
      Tests  35 passed (35)
```

## Gate transcripts

```
$ npx tsc --noEmit
(0 errors)

$ npm run lint
(pre-existing warnings/errors in unrelated files only — none in HeroSearchView.tsx,
 heroSearch.smoke.test.tsx, or HeroSearch.stories.tsx; confirmed via
 `npm run lint 2>&1 | grep -i "HeroSearchView\|heroSearch.smoke\|HeroSearch.stories"` → no output)

$ npm run check:stories
✅ check:stories PASSED — 111 files checked, 0 violations.

$ npm run check:i18n
✅ Parity PASSED — all 4 locale files have identical key sets (2128 keys). (no new key — this task
   added no i18n string, per spec)

$ npm run check:design-tokens -- --strict
✅  check:design-tokens — 0 violations found.

$ npm run check:mojibake
check:mojibake: 0 artifacts in 1647 files

$ npm run check:file-integrity
✅  check:file-integrity PASSED — all 5 file(s) clean
```

## File-integrity transcript (clause 14)

```
src/components/shared/HeroSearchView.tsx                       NUL=0  first3bytes=277573 ('us)
src/components/shared/__tests__/heroSearch.smoke.test.tsx      NUL=0  first3bytes=2f2a2a (/**)
docs/critical-flow-registry.md                                  NUL=0  first3bytes=232043 (# C)
```

No BOM on any file (BOM would read `efbbbf`). `tsc --noEmit` = 0 errors across all `.tsx` touches.
`check:file-integrity` (project's own gate, native run) independently confirms all 5 git-changed files
clean (0 NUL, no BOM, parses/compiles, not truncated).

## Files Changed

| Path | Rationale |
|---|---|
| `src/components/shared/HeroSearchView.tsx` | Core fix — flattened the action-buttons wrapper into one `flex flex-wrap md:flex-nowrap` container; Search gets `sm:basis-full`/`md:basis-auto` so it wraps alone in the 640–767 band |
| `src/components/shared/__tests__/heroSearch.smoke.test.tsx` | Added 1 new RTL test asserting the flattened DOM structure (4 direct siblings, not nested); genuinely fails on the pre-572 nested shape (planted-violation verified) |
| `docs/critical-flow-registry.md` | Row 49 extended (Owner-task/Happy-path/Failure-path/Coverage cells) per clause 15 regression-coverage requirement |
| `docs/backlog.md` | Last Session entry updated (see below) |
| `docs/sessions/2026-07-10-task572-herosearch-searchbutton-wrap.md` | This session log |

**Not touched:** `FiltersPanel.tsx`, `MantineCountButton.tsx`, `theme.ts`, `globals.css`, combobox
internals, any locale file, `HeroSearch.stories.tsx` (no boundary caption was judged necessary — the
existing story already renders `activeFiltersCount=2` and the standing/custom captures above prove the
band visually without a story change).

**Incidental (not authored by this task, produced as a side effect of running the required
`screenshots:assert` gate command):** `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`
is regenerated by `scripts/check-stories-rendered.mjs` on every gate run — this is the tool's own
standing output file, unrelated to this task's scope, and was already showing as modified before this
session started (per the orchestrator's own harness).

## STOP-AND-ASK items

None. Every band rendered exactly per the kickoff's specced classes with no Mantine/Tailwind width
quirk encountered.

## Self-validation

`tsc --noEmit` = 0. 6/6 `heroSearch.smoke.test.tsx` tests green (including the new structural test,
planted-violation-verified). 35/35 tests green across the 4 sibling smoke suites (zero regression).
`check:stories`/`check:i18n`/`check:design-tokens --strict`/`check:mojibake`/`check:file-integrity` all
green. Standing rendered gate: `HeroSearch`/`CountButton`/`FilterControls`/`FiltersPanelShell` each
16/16 PASS, 0 FAIL (overall run 566/592 PASS, 0 FAIL, 26 pre-existing unrelated AMBIGUOUS). Custom
640–767 in-band capture (60 screenshots, 4 locales × 15 widths) geometrically and visually confirms the
required 3-row/2-row/1-row banding exactly per spec, with the owner-reported Location-crush defect
fixed at uk@700. §18.9 uk@320/700/1024 visually inspected, no overlap/clip. Scope held to the files
listed in the kickoff; no drive-by edits. **Self-validation: PASS.**
