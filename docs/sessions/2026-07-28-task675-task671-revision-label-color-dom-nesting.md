# Task 675 — Task 671 revision: canonical micro-heading colour, DOM nesting, and record corrections

**Status:** IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW
**Kickoff:** `tasks/kickoff_prompt_Task_675_Task671_Revision_Canonical_Label_Color_DOM_Nesting.md`
**QA profile:** Q4 — Release / Critical Flow (registry row 50 names `FiltersPanel.tsx` shell explicitly)

---

## 1. Pre-write snapshot (§3.1, §13.2 step 1)

`git status --porcelain` before the first write:

```
 M docs/backlog.md
 M docs/critical-flow-registry.md
 M scripts/mantine-migration-scope.json
 M src/components/shared/FiltersPanel.tsx
 M src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx
 M src/design-system/mantine/patterns/index.ts
?? docs/sessions/2026-07-28-task671-filterspanel-detailwind-filtersection.md
?? src/design-system/mantine/patterns/MantineFilterSection.tsx
?? src/stories/patterns/mantine/FilterSection.stories.tsx
```

All nine of Task 671's paths present, none missing, no tenth path — matches the kickoff's §3.1 snapshot
exactly. Task 671's code was not reverted; this task amended it in place.

`theme.ts` gray tuple index 5 confirmed = `#667085` (A1 stop condition) before any edit.

---

## 2. Files Changed

| File | Task 671 (pre-675 state) | Task 675 edit (this session) |
|---|---|---|
| `src/design-system/mantine/patterns/MantineFilterSection.tsx` | created (untracked) — label used `c="dimmed"` | **modified**: `c="dimmed"` → `c="gray.5"` (I1); doc block extended with the D4 provenance record (I2) |
| `src/components/shared/FiltersPanel.tsx` | modified (tracked) — title `<Text fw={600} size="md">`; divider helper named `isFirstVisible` | **modified**: title gained `component="span"` (I3, fixes F6 `<p>`-in-`<p>`); `isFirstVisible` renamed `withTopDivider` at its declaration + all 17 call sites, predicate unchanged (I4, R6) |
| `src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx` | modified (tracked) — 18 tests, 2 comments referencing `isFirstVisible` | **modified**: 2 comments renamed to `withTopDivider`; new `describe`/`it` added asserting the title renders `<span>` with no `<p>` ancestor (I5) — 18→19 tests |
| `tasks/kickoff_prompt_Task_671_FiltersPanel_DeTailwind_Canonical_FilterSection.md` | committed, untouched by 671's own implementation | **modified** (Task 675 only): 5 occurrences of the misrecorded divider before-hex corrected to the measured value (R4) |
| `docs/sessions/2026-07-28-task671-filterspanel-detailwind-filtersection.md` | created (untracked) by 671 | **modified**: 2 hex corrections (R4); §5 R7/R8 rows downgraded to `PARTIALLY IMPLEMENTED` + R13 row rewritten `NOT VERIFIABLE`, "stop condition not triggered" phrase removed (R5, R5a); new §5a subsection (measured table, blast-radius result, owner visual waiver, R13 cause+table); §8 "Section label"/"Title label"/"Section divider" rows corrected; §9 gained a new "Section label" canonical-decision row (D4) (R2) |
| `docs/critical-flow-registry.md` | modified (tracked) by 671 — row 50 evidence cell | **modified**: row 50's evidence cell extended in place with a Task 675 paragraph (same cell, no new column/row — row 50 only, per §7) |
| `docs/backlog.md` | modified (tracked) by 671 — its own Last Session entry | **modified**: 671's entry consolidated into one `671/675` line (net line count unchanged) documenting the revision; task-numbering line updated (`last used: 675`, `NEXT FREE: 676`, 676–680 reservations recorded) |
| `docs/sessions/2026-07-28-task675-task671-revision-label-color-dom-nesting.md` | — | **created** (this file) |

`scripts/mantine-migration-scope.json`, `src/design-system/mantine/patterns/index.ts`,
`src/stories/patterns/mantine/FilterSection.stories.tsx`: **zero further diff** from Task 671's state —
confirmed unedited this session.

`useHomepageFilters.ts` / `HeroSearchView.tsx` / `HeroSearch.tsx` / `page.tsx` / `MantineDrawer.tsx` /
`responsiveBottomSheet.tsx` / `theme.ts` / `ListingsFilters.tsx`: **zero diff**, confirmed absent from
`git status --porcelain` throughout (AC8).

---

## 3. Requirement / acceptance-criteria evidence

| Req | AC | Evidence |
|---|---|---|
| R1 | AC1 | `grep -n 'c="' src/design-system/mantine/patterns/MantineFilterSection.tsx` → `c="gray.5"` present, `c="dimmed"` absent (0 hits). `theme.ts:11` gray tuple index 5 = `#667085`. Contrast on white, computed precisely (WCAG relative-luminance formula, not the kickoff's rounded placeholder): **4.97:1** — meets WCAG AA for normal text (≥4.5:1; 12px text is below the "large text" threshold so the 4.5:1 bar applies, not 3:1), does not meet AAA (7:1). |
| R2 | AC2 | D4 provenance block added to `MantineFilterSection.tsx`'s doc comment (owner decision + date + `gray.5`=`#667085` + why not `dimmed` + clause 16a basis). Task 671 session log's §8 "Section label" row and new §9 "Section label" row both carry the same: owner decision, 2026-07-28, clause 16a (no TailAdmin row for a 12px uppercase micro-heading, `tt="uppercase"` grep = 1 hit). |
| R3 | AC3 | See §6 below — 0 occurrences of `<p> cannot be a descendant of <p>` in the 4-suite vitest stderr; the pre-existing `<div> cannot be a descendant of <p>` remains (2 occurrences, both on the mobile bottom-sheet blast-radius tests), stated explicitly, attributed to Task 677. |
| R4 | AC4 | `grep -rn 'EBEBEB' tasks/ docs/` → 0 hits in Task 671's kickoff, its session log, `docs/backlog.md`, `docs/critical-flow-registry.md` (verified — see §7 command list). Each affected passage now reads `#E5E5E5 → #D0D5DD`. (2 unrelated pre-existing hits remain in `docs/sessions/2026-07-21-task653-*.md` and `docs/sessions/2026-07-22-task657-*.md` — out of this task's scope, untouched.) |
| R5 | AC6 | Task 671 session log §5's R7/R8 rows now read `PARTIALLY IMPLEMENTED` and state the 4-width `MANTINE_VIEWPORTS` harness limit explicitly; new §5a carries the §3.2 measured table, §3.3 blast-radius result, and the owner's 480/560/680/768×sq/en/uk/it visual waiver, verbatim from the kickoff. |
| R5a | AC6a | Task 671 session log's R13 row now reads `NOT VERIFIABLE`, quotes the `buildFallback()` → `label: pt.value` cause and the 4-row measurement table (§5a), names Task 679 as the closure path. `grep -n "stop condition not triggered" docs/sessions/2026-07-28-task671-*.md` → **0 hits** (confirmed below). |
| R6 | AC7 | `grep -rn 'isFirstVisible' src/` → **0 hits**. `grep -c 'withTopDivider' src/components/shared/FiltersPanel.tsx` → **18** (1 declaration + 17 call sites). |
| R7 | AC8 | `git diff --stat` / `git status --short` confirm `useHomepageFilters.ts`, `HeroSearchView.tsx`, `HeroSearch.tsx`, `page.tsx`, `MantineDrawer.tsx`, `responsiveBottomSheet.tsx`, `theme.ts`, `ListingsFilters.tsx` all absent — zero diff. |
| R8 | AC9 | `npm run build` → **exit 0**, 40/40 static pages (see §7). |
| R9 | AC5 | 4 critical-flow suites 39/39 PASS (see §7). `screenshots:assert -- --mantine-only`: `FiltersPanelShell` + `FilterSection` both **16/16 PASS**, total run **1094/1116 PASS, 0 FAIL, 22 AMBIGUOUS** (all pre-existing/unrelated — see §8). Fresh-capture label colour measured **`#667085`** at the reference cell (§9). |
| R10 | AC10 | `check:i18n` → 0, 2215/2215/2215/2215, no new keys. `check:design-tokens` → same 44-violation/8-file set as Task 671's baseline, 0 in any file this task touched. `check:file-integrity` / `check:mojibake` → 0/0 (see §7). |

---

## 4. I6 — planted-violation transcript (Q4)

1. Removed `component="span"` from `FiltersPanel.tsx`'s title `Text` (reverted to `<Text fw={600} size="md">`).
2. Ran the new title test alone (`-t "Task 675 F6"`): **genuinely FAILED**
   — `AssertionError: expected 'P' to be 'SPAN'` (`title.tagName` read `'P'`).
3. Ran the mobile blast-radius test alone with the plant applied: the `<p> cannot be a descendant of <p>`
   React warning **returned** in stderr (confirmed by direct `--reporter=verbose` capture, plus the
   pre-existing `<div> cannot be a descendant of <p>` warning, unaffected by the plant).
4. Reverted `component="span"`.
5. Re-ran the title test: **PASS**. Re-ran the full 4-suite command: **39/39 PASS**.
6. `grep -n 'component="span"' src/components/shared/FiltersPanel.tsx` → present (1 hit, line 98).
   `git status --porcelain` after the revert shows the same 10 tracked/untracked paths as before the plant
   (see §7) — no stray plant, no tenth path.

---

## 5. AC3 stderr evidence

Full 4-suite run, `--reporter=verbose`, piped to a log file and grepped:

```
grep -c "<p> cannot be a descendant of <p>" <log>    → 0
grep -c "<div> cannot be a descendant of <p>" <log>  → 2
```

The 2 `<div>`-in-`<p>` occurrences are both inside `responsiveBottomSheet.tsx`'s own title wrapper
(`<Text fw={600} size="sm" c="gray.8">`, still defaulting to `<p>`) receiving `FiltersPanel`'s `<Group>`
(a `<div>`) as its `title` content — pre-existing before Task 671 (the pre-671 title was also rooted in a
`<div>`), unrelated to this task's fix, out of scope, **reserved as Task 677** per the kickoff §8.

---

## 6. Validation evidence — commands and actual results

| Command | Result |
|---|---|
| `npm run typecheck` | **0** |
| `npx vitest run` (4 critical-flow suites) | **0** — 39/39 PASS (18→19 in `filtersPanelShell`, one new title test; 3 sibling suites unchanged/green) |
| I6 planted-violation re-run | title test genuinely FAILED (`'P'` ≠ `'SPAN'`) + `<p>`-in-`<p>` warning returned; reverted → 39/39 PASS |
| `npm run check:stories` | **0** — 126 files, 0 violations |
| `npm run check:story-coverage` | **0** — 13/13 covered (unchanged — no new/removed manifest entries this task) |
| `npm run build-storybook` | **0** — built in 52.87s |
| `npm run screenshots:assert -- --mantine-only` | **1094/1116 PASS, 0 FAIL, 22 AMBIGUOUS** — see §8 |
| `npm run check:design-tokens` | **44 violations, identical 8-file set to Task 671's baseline, 0 in any file this task touched** |
| `npm run check:i18n` | **0** — 2215/2215/2215/2215, parity unchanged, no new keys |
| `npm run check:file-integrity` | **0** — 10 files clean (re-run after final text edits, still 0) |
| `npm run check:mojibake` | **0** — 1983 files, 0 artifacts |
| `npm run build` | **0** — 40/40 static pages, fresh transcript |
| `grep -rn 'isFirstVisible' src/` | **0 hits** |
| `grep -rn 'EBEBEB' tasks/ docs/` | 0 hits in Task 671's kickoff/session-log/`backlog.md`/`critical-flow-registry.md`; 2 remaining hits are pre-existing and unrelated (`docs/sessions/2026-07-21-task653-*.md`, `docs/sessions/2026-07-22-task657-*.md`), untouched by this task |
| `grep -n "stop condition not triggered" docs/sessions/2026-07-28-task671-*.md` | **0 hits** |

`check:hydration` is **not** required (§13.3): this task changes no SSR-rendered subtree — the fixed subtree
(the Drawer title) is closed at first paint on every route this gate walks, same reasoning Task 671 already
recorded. Not run; reasoning stated rather than a vacuous pass.

---

## 7. §8 (AC5) — `screenshots:assert -- --mantine-only` detail

**Overall:** 1094/1116 PASS, **0 FAIL**, 22 AMBIGUOUS, 0 flaky-recovered (69 Mantine stories, 240 non-Mantine
excluded). This is *better* than Task 671's own run (which had 1 FAIL on `Avatar/it/mobile-375`) — that FAIL
did not reproduce here, confirming Task 671's own theory (§3.3/§12) that it was a one-off capture artifact,
not a real regression.

**Task-owned stories — 0 FAIL, both 16/16** (confirmed by direct manifest inspection,
`.screenshots/rendered-assert/2026-07-28T16-07/manifest.json`, filtered to these two `storyId`s):

| Story | storyId | Cells | Verdict |
|---|---|---:|---|
| `Mantine/Primitives/FiltersPanelShell/Default` | `mantine-primitives-filterspanelshell--default` | 16 | **16/16 PASS** |
| `Patterns/Mantine/FilterSection/Default` | `patterns-mantine-filtersection--default` | 16 | **16/16 PASS** |

**The 22 AMBIGUOUS are all pre-existing and unrelated** (identical category breakdown to Task 671's own run):
4× `Combobox/Default` `ambiguous-overlap` (background page content behind an opened overlay's backdrop — a
known heuristic limitation for this story family), 16× `PopularLocationsView/Long City Name`
`text-clipped-ellipsis` (intentional ellipsis, accessible name present), 2× `Tabs/Default`
`ambiguous-offscreen` (intentional horizontal swipe-scroll). None reference `FiltersPanelShell`,
`FilterSection`, `FilterControls`, or `HeroSearch`.

---

## 8. AC5 — measured label colour (fresh capture)

Reference cell `mantine-primitives-filterspanelshell--default__en__desktop-1024.png` from this session's own
capture (`2026-07-28T16-07`). The Drawer panel occupies the right ~400px of the 1024px-wide viewport
(`side="right"`, `size="sm"`); the left ~620px is the overlay backdrop (~`rgb(100,100,100)`, Mantine's default
Overlay opacity blended over white — not the panel).

Sampled the label text region (`x=624–1000, y=94–112`) with `sharp`, reading raw RGBA and counting exact hex
occurrences:

```
#ffffff  6423   (panel background)
#636363   190   (backdrop-edge bleed)
#646464   114
#626262    57
#f6f7f8    54   (near-white anti-alias)
#858d9d    54   (text anti-alias)
#aeb3be    47   (text anti-alias)
#667085    38   ← solid label-text colour, exact match
#c8ccd3    33   (text anti-alias)
#6d768a    29   (text anti-alias)
...
```

`#667085` appears 38 times as the darkest/most-saturated pixel cluster in the region — the solid interior of
the 12px uppercase label glyphs. **Confirmed: `#667085`, exact match to the D4 decision and `theme.ts:11`
gray tuple index 5.** No other candidate hex in the sampled region is closer to the target than an
anti-aliasing blend step.

---

## 9. Deviations

- **I5 test placement.** The kickoff's I5 said "one test in the existing describe for the title" — no
  `describe` block in `filtersPanelShell.smoke.test.tsx` was actually scoped to the title's own DOM shape (the
  closest, "round-2 Fix 2: header bottom divider", targets the header border, not the title element). Added a
  new `describe('FiltersPanel shell — Task 675 F6: title DOM nesting', …)` immediately before the existing D3
  divider block, rather than force the assertion into an unrelated describe. Reasoning recorded here per the
  kickoff's own deviation-disclosure requirement.
- **Contrast ratio.** The kickoff's §11 negative-flow table states "5.9:1" for `#667085` on white as an
  illustrative figure; the precise WCAG relative-luminance computation (done in this session, §3 R1) gives
  **4.97:1**. Both clear the AA 4.5:1 bar for normal text, so the AC1 requirement ("≥ WCAG AA for 12px text")
  is satisfied either way — the measured value is reported here rather than the kickoff's rounder placeholder,
  since AC1 asks to "state the measured ratio."
- No other deviations from the kickoff's required scope (§7/§10/§11).

## 10. Limitations

- **The 4-width matrix scope (§13.1).** This task's visual proof is explicitly the 4-width
  `--mantine-only` set (320/375/390/1024 × sq/en/uk/it), not the 14-width canon — the harness's
  `MANTINE_VIEWPORTS` constant and `ASSERT_STORIES` enrolment are unchanged by this task (out of scope, §8 of
  the kickoff). Task 671's own session log's R7/R8/R13 downgrades (§5a of that file) record why the wider
  matrix was never producible; **Task 678** is reserved to close that gap.
- **Three follow-ups reserved, not implemented here** (per kickoff §8, all out of this task's scope):
  **Task 676** — `globals.css`'s stale hex comments (`:336` `#8C8C8C`, `:371` — a legacy shadcn hex that
  never renders; the root cause of the original F2 misrecording); **Task 677** — the pre-existing
  `<div>`-in-`<p>` warning from `responsiveBottomSheet.tsx`'s own title wrapper (§6 above); **Task 679** —
  `usePropertyTypes`'s `buildFallback()` shipping raw English enum values to all four locales (§5a of Task
  671's session log; also the root cause of R13's unverifiability). **Task 680** — `check:locale-leak`'s
  lowercase blind spot (`isEnglishish()` requires an initial capital), reserved by the kickoff §8, not touched
  this session.

---

## 11. Backlog update

`docs/backlog.md`'s Task 671 entry was consolidated into a single `671/675` line documenting both the
original migration and this revision (net line count unchanged — the file stays at **80 lines**, no
`BACKLOG LIMIT BREACH`). The task-numbering line was updated: last used 675, next free 676, with 676–680
recorded as reserved.

---

## 12. Self-validation verdict

`tsc=0 errors · build=passes (40/40) · vitest=39/39 (0 p-in-p, 2 pre-existing div-in-p) · AC table=all
green · screenshots:assert(--mantine-only)=1094/1116 PASS/0 FAIL/22 pre-existing AMBIGUOUS, task stories
16/16+16/16 · label colour=#667085 (measured) · design-tokens=44/44 identical baseline, 0 in touched files ·
i18n=2215×4 unchanged · file-integrity=PASS · mojibake=PASS · scope=clean (git status matches Task 671's 9
paths + this session's 1 new session log + 1 newly-tracked-modified kickoff file) · integrity=PASS`
