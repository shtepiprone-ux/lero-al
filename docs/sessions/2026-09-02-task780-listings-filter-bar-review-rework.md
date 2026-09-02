# Task 780 — `ListingsFilterBar` review rework: responsive layout + reproducible D68-2 evidence

**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` — owner disposition of the Task 779 S1 census-instrument
defect received in-session (see §7); no further validation reruns required per that same instruction.

**Executor session:** 2026-09-02, platform `win32`, Node `v22.22.3`, cwd `C:\Claude_Code_Projects\lero-al`.

---

## 1. Files changed (actual, this session only)

| Path | Change |
|---|---|
| `src/modules/listings/components/ListingsFilterBar.tsx` | Layout rework: responsive `w`/`ms`/`me` cascade, `Box`-wrapped comboboxes, `Indicator` width parity — Modified |
| `docs/backlog.md` | State update — Modified |
| `docs/sessions/2026-09-02-task780-listings-filter-bar-review-rework.md` | This log — Created |
| `docs/sessions/evidence/task780/**` | Retained transcripts, manifests, measurement JSON — Created |

`src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx` was **not** edited — no structural
assertion was genuinely needed; the existing T1–T7 suite already covers the URL contract and continues to pass
unmodified against the reworked layout.

No edit was made to `ListingsShellView.tsx`, `useListingsUrlFilters.ts`, `LocationCombobox.tsx`,
`MantineCombobox.tsx`, `scripts/mantine-migration-scope.json`, any Storybook gate script, or the Task 779 kickoff.
(`ListingsShellView.tsx` shows as modified in `git status` — that is Task 779's carried-over, still-uncommitted
change; verified no `Edit`/`Write` tool call touched it in this session.)

Four temporary helper scripts were created at the project root during this session and **deleted before this
report**: `_task780-measure-layout.mjs`, `_task780-diagnose-overflow.mjs`,
`_task780-diagnose-overflow-mobile.mjs`, `_task780-compare-manifests.mjs`. None were placed in `scripts/`.
`git status --porcelain` (re-taken after deletion, recorded in §8) confirms none remain.

---

## 2. Layout contract — implementation

```tsx
const FULL_BELOW_SM = { base: '100%', sm: 'auto' } as const

<Stack gap={0} me="sm" data-testid="listings-filter-bar-root">
  <Group wrap="wrap" gap="xs" py="sm">
    <Group wrap="wrap" gap="xs" w={FULL_BELOW_SM}>            {/* left controls */}
      <Group gap="xs" wrap="wrap" w={FULL_BELOW_SM}>          {/* listing-type toggle set */}
        <Button w={FULL_BELOW_SM} .../> × 3
      </Group>
      <Divider orientation="vertical" color="gray.3" />
      <Box w={FULL_BELOW_SM}><MantineCombobox .../></Box>
      <Box w={FULL_BELOW_SM}><LocationCombobox .../></Box>
      <Button w={FULL_BELOW_SM} .../>                         {/* premium */}
    </Group>
    <Group gap="xs" wrap="wrap" w={FULL_BELOW_SM} ms={{ sm: 'auto' }}>   {/* right actions */}
      <Button w={FULL_BELOW_SM} .../>                         {/* reset, conditional */}
      <Indicator ... w={FULL_BELOW_SM}>
        <Button data-testid="task775-advanced-filters" w={FULL_BELOW_SM} .../>
      </Indicator>
    </Group>
  </Group>
  <Divider color="gray.3" />
</Stack>
```

Two real defects were found and fixed during this session, neither visible to the generic
`screenshots:assert` gate's immediate-parent width check (exactly the trap the task warned against):

1. **Combobox triggers stayed content-sized.** `MantineCombobox`/`LocationCombobox`'s own outer wrapper `Box`
   carries no width; as a bare flex item, their internal `triggerWidth: '100%'` resolved against an undetermined
   containing block and collapsed to content size — not a bug in either file (both are out of edit scope), but a
   composition gap. Fixed by wrapping each in a local `<Box w={FULL_BELOW_SM}>`: a definite-width flex item whose
   unwidthed block child then fills it via ordinary CSS block auto-width. First measurement run (pre-fix):
   4/16 cells PASS, `propertyType`/`location` FAIL at every mobile viewport/locale
   (`layout-measurements-run.log`). Post-fix: full pass (`layout-measurements-run2.log`).
2. **Page-level horizontal overflow from the Indicator badge.** Once the advanced-filters `Button` was pinned
   flush to the bar's true right edge (satisfying the alignment requirement), the `Indicator`'s corner badge — an
   absolutely-positioned element that by design overhangs its own box (Task 779 §3.7; not overridden here) — poked
   ~7.4px past the viewport's true edge in the zero-gutter Storybook story, at every viewport including
   desktop-1024. Diagnostic: `document.documentElement.scrollWidth` (1031) `>` `clientWidth` (1024), offending
   element `.mantine-Indicator-indicator`. Fixed with `me="sm"` (12px, token-based) on the root `Stack`, **and**
   removing the literal `w="100%"` I had first added to it — `width` and `margin` both explicitly set on the same
   normal-flow block box is CSS's classic "over-constrained" case, where the browser silently zeroes the margin;
   leaving `width` at its default `auto` lets the same block-width equation solve `auto` down to
   `container − margin`, so the reserved space is real. Confirmed via the same diagnostic post-fix:
   `scrollWidth === clientWidth` at desktop-1024 (`1024/1024`) and at all 12 mobile cells
   (320/375/390 × sq/en/uk/it, all `scrollWidth === clientWidth`). Full 16-cell re-measurement after this fix:
   16/16 PASS (`layout-measurements-run3.log`), and the subsequent full `screenshots:assert` run confirms zero
   `horizontal-overflow` verdicts anywhere in the `ListingsFilterBar` cells.

---

## 3. Real-browser layout measurement — `docs/sessions/evidence/task780/layout-measurements.json`

Produced by a temporary Playwright script (deleted — §1) driving real Chromium against the post-edit
`storybook-static` build, navigating directly to
`iframe.html?id=patterns-mantine-listingsfilterbar--default&globals=locale:<l>&viewMode=story`. 16/16 cells PASS.

| Locale | Viewport | propertyType ≥ barW−2 | location ≥ barW−2 | premium ≥ barW−2 | reset ≥ barW−2 | advanced ≥ barW−2 | Verdict |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| sq | mobile-320 | ✓ | ✓ | ✓ | ✓ | ✓ | PASS |
| sq | mobile-375 | ✓ | ✓ | ✓ | ✓ | ✓ | PASS |
| sq | mobile-390 | ✓ | ✓ | ✓ | ✓ | ✓ | PASS |
| en | mobile-320 | ✓ | ✓ | ✓ | ✓ | ✓ | PASS |
| en | mobile-375 | ✓ | ✓ | ✓ | ✓ | ✓ | PASS |
| en | mobile-390 | ✓ | ✓ | ✓ | ✓ | ✓ | PASS |
| uk | mobile-320 | ✓ | ✓ | ✓ | ✓ | ✓ | PASS |
| uk | mobile-375 | ✓ | ✓ | ✓ | ✓ | ✓ | PASS |
| uk | mobile-390 | ✓ | ✓ | ✓ | ✓ | ✓ | PASS |
| it | mobile-320 | ✓ | ✓ | ✓ | ✓ | ✓ | PASS |
| it | mobile-375 | ✓ | ✓ | ✓ | ✓ | ✓ | PASS |
| it | mobile-390 | ✓ | ✓ | ✓ | ✓ | ✓ | PASS |

| Locale | Viewport | \|barRoot.right − advancedButton.right\| ≤ 2px | Verdict |
|---|---|:---:|:---:|
| sq | desktop-1024 | ✓ | PASS |
| en | desktop-1024 | ✓ | PASS |
| uk | desktop-1024 | ✓ | PASS |
| it | desktop-1024 | ✓ | PASS |

Listing-type toggle buttons (All/Sale/Rent) are the sole chip-set exception per the task's own contract — not
measured against the full-width floor. Tolerance: 2px, recorded in the JSON per cell alongside every raw measured
value (`barRootWidth`, `propertyTypeWidth`, `locationWidth`, `premiumWidth`, `resetWidth`, `advancedWidth`,
`advancedRight`, `barRootRight`, `rightEdgeDiff`) — see the file itself for the full per-cell numeric record.

---

## 4. D68-2 baseline — isolated `git archive HEAD` reconstruction

**HEAD verification (not assumed):** `git --no-optional-locks log --oneline -3` → `3beabc9cc
docs(Task779): file ListingsFilterBar Mantine kickoff…` is the current `HEAD`. All of Task 779's code changes
(the legacy → Mantine migration itself) are **uncommitted working-tree modifications** — confirmed by
`git --no-optional-locks diff --stat HEAD` showing `ListingsFilterBar.tsx`/`ListingsShellView.tsx`/
`scripts/mantine-migration-scope.json` as diffs against `HEAD`, and `git status --porcelain` listing the new
story/test files as untracked. Therefore `git archive --format=zip HEAD` is demonstrably the pre-Task-779 tree —
not inferred from one file hash, but from the commit log and the fact that zero commits exist between the kickoff
commit and this session.

**Isolation procedure, executed exactly as specified:**

1. `git --no-optional-locks archive --format=zip HEAD -o %TEMP%\task780-B-20260902-143907\head.zip` — exit 0.
2. `Expand-Archive` into that directory; verified `ListingsFilterBar.stories.tsx` is **absent** (pre-779 has no
   story) and `ListingsFilterBar.tsx`'s first lines are the legacy shadcn header — confirms the extracted tree is
   genuinely pre-migration, not merely pre-780.
3. `New-Item -ItemType Junction` linked `<iso>\node_modules` → the workspace's `node_modules`; `.env.local`
   (gitignored, needed for the build) copied in.
4. In the isolated tree: `npm.cmd run build-storybook` (exit 0, `B-build-storybook.log`), then
   `npm.cmd run screenshots:assert -- --mantine-only` (exit 1 — expected, pre-existing FAILs;
   `B-screenshots-assert.log`).
5. **B: 1380 total, 1273 PASS, 80 FAIL, 27 AMBIGUOUS**, 83 Mantine stories selected. Manifest preserved at
   `docs/sessions/evidence/task780/B-manifest.json` (copied from
   `<iso>\.screenshots\rendered-assert\2026-09-02T12-42\manifest.json`).
6. In the current tree, post all layout fixes: `npm.cmd run build-storybook` then
   `npm.cmd run screenshots:assert -- --mantine-only` → **P: 1396 total, 1289 PASS, 80 FAIL, 27 AMBIGUOUS**, 84
   Mantine stories selected (`P2-screenshots-assert.log`). Manifest preserved at
   `docs/sessions/evidence/task780/P-manifest.json`.
7. Isolated tree and its `head.zip` deleted after both manifests were copied out; the `node_modules` junction was
   removed first (`rmdir` on a junction removes only the link) — verified the real `node_modules` remained intact
   (`node_modules/@mantine/core` present) after cleanup.

**Note:** B's counts (1380/1273/80/27) are numerically identical to the figures Task 779 originally cited from
Task 778's closure transcript — this session does not rely on that prior reuse; B here is a freshly, independently
captured isolated run, and the match is corroborating, not assumed.

### Programmatic comparison — `docs/sessions/evidence/task780/differential-comparison.json`

Computed by a temporary Node script (deleted — §1) that loads both manifests, builds a
`Story × locale × viewport` identity for every matrix row, and compares verdict sets.

```json
{
  "arithmetic": { "totalDiff": 16, "passDiff": 16, "failDiff": 0, "ambiguousDiff": 0 },
  "arithmeticPass": true,
  "newFailedIdentities": [],
  "newAmbiguousIdentities": [],
  "pMinusBEmpty": true,
  "listingsFilterBarCellCount": 16,
  "listingsFilterBarAllPass": true,
  "listingsFilterBarNonPassCells": []
}
```

- `P` failed-identity set minus `B` failed-identity set = **∅** (`newFailedIdentities: []`).
- `P` ambiguous-identity set minus `B` ambiguous-identity set = **∅** (`newAmbiguousIdentities: []`).
- Exactly **16** `Patterns/Mantine/ListingsFilterBar/Default` cells exist in `P`; **all 16 are `pass`**
  (`listingsFilterBarNonPassCells: []`).
- `total(P) = 1396 = total(B) + 16`; `pass(P) = 1289 = pass(B) + 16`. Both hold exactly.

One unrelated flaky cell recovered on retry in the `P` run (`Mantine/Primitives/HeroSearch/Fallback × uk ×
band-700`, retries: 1) — not a `ListingsFilterBar` cell, ended `pass`, does not affect the comparison above.

---

## 5. Required final gates

| # | Command | Exit | Transcript |
|---|---|---:|---|
| 1 | `npx vitest run listingsFilterBar.smoke.test.tsx` + 3 sibling suites | 0 | `V1-final.log` (60/60) |
| 2 | `npm run check:stories` | 0 | `V2-final.log` (133 files, 0 violations) |
| 3 | `npm run check:story-coverage` | 0 | `V3-final.log` (22/22 covered) |
| 4 | `npm run governance:tailwind` | 0 | `V4-final.log` (C0/H10/M0, baseline unchanged) |
| 5 | `npm run check:design-tokens:strict` | 0 | `V5-final.log` (0 violations) |
| 6 | `npm run typecheck` | 0 | `V6-final.log` |
| 7 | `npm run build-storybook` (post-edit, final) | 0 | `P3-build-storybook.log` |
| 8 | `npm run screenshots:assert -- --mantine-only` (post-edit, final = P) | 1* | `P2-screenshots-assert.log` — *80 pre-existing FAILs, identical set to B |
| 9 | `npm run check:locale-leak:mantine-only` | 1* | `V9-locale-leak.log` — *23 pre-existing leaks, 0 attributable to `ListingsFilterBar` |
| 10 | `npm run build` | 0 | `V10-build.log` |
| 11 | `git --no-optional-locks diff --check` | 0 | `V11-diff-check.log` |
| 12 | `git --no-optional-locks diff --stat` | 0 | `V12-diff-stat.log` |

All commands run in native Windows PowerShell; `node.exe -p process.platform` → `win32` confirmed at session start
and before the isolated-tree build.

---

## 6. AC1/R-equivalent checks on the reworked file

- `className=`: 0. `<Combobox` (legacy): 0. Forbidden imports (`@/components/ui/button`,
  `@/components/shared/Combobox`, `cn(`, `@/lib/utils`): 0. No `style`/`styles` prop; no raw px/rem/hex; no
  `Indicator` `size`/`offset` override — grep-confirmed against the final file.
- `data-testid="task775-advanced-filters"` preserved verbatim.
- `Indicator` remains the outside-the-Button count mechanism (unchanged structurally from Task 779; only its own
  `w` prop and its child `Button`'s `w` prop were added).
- Filter URL contract untouched: `updateParams`/`handlePropertyTypeChange`/`resetFilters` call sites are
  byte-identical to Task 779's version — confirmed by the unmodified T1–T7 suite passing without any test edit.

---

## 7. Census disposition — owner decision required, not available

The Task 779 S1 named command (`Get-Content -LiteralPath <file> | Measure-Object -Line`) returned **119**, not the
kickoff's expected **135**, against the byte-identical pre-edit file. This session does **not** claim S1 passed,
and the Task 779 kickoff has **not** been rewritten.

`git hash-object` equality (the file measured was proven byte-identical to the design-time witness) explains *why*
the named instrument produced a different number — a `Measure-Object -Line` quirk in this repository's
PowerShell 5.1 that undercounts by excluding blank lines — but per this task's explicit instruction, that
explanation does **not** override the kickoff's own stop rule, which names this exact command as the sole
authorized measurement with no substitute.

**Owner decision received (in-session, 2026-09-02, verbatim):**

> 119 від Measure-Object -Line класифікується як дефект інструмента вимірювання, не як content drift: pre-edit git
> hash-object збігається з witness. Task 780 може перейти в IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW; повторні
> screenshot/test прогони не потрібні.

Translation: the 119 result from `Measure-Object -Line` is classified as a measurement-instrument defect, not
content drift — the pre-edit `git hash-object` match against the witness is accepted as sufficient proof. Task 780
is authorized to move to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`; repeat screenshot/test runs are not
required.

This resolves option (1) of the three offered above (accept the hash-equality explanation as sufficient
disposition). No `docs/binding-decisions.md` or `docs/backlog.md` entry existed for this question before this
session; the decision is recorded here and reflected in `docs/backlog.md`'s "Last Session" note. Per the owner's
explicit instruction, no screenshot/test evidence in §2–§6 was rerun following this decision — all of it stands as
already captured before the decision request was made.

---

## 8. Final worktree state

```
 M docs/backlog.md
 M scripts/mantine-migration-scope.json          (Task 779, unmodified this session)
 M src/modules/listings/components/ListingsFilterBar.tsx
 M src/modules/listings/components/ListingsShellView.tsx   (Task 779, unmodified this session)
?? docs/sessions/2026-09-02-task779-listings-filter-bar-mantine.md
?? docs/sessions/2026-09-02-task780-listings-filter-bar-review-rework.md
?? docs/sessions/evidence/task779/
?? docs/sessions/evidence/task780/
?? src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx
?? src/stories/patterns/mantine/ListingsFilterBar.stories.tsx
```

No `_task780-*` temporary file remains at the project root (verified by `ls` returning "No such file or
directory" after cleanup). No mutating Git command was run at any point in this session.
