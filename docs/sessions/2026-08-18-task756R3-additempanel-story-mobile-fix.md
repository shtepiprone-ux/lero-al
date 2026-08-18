# Task 756 — REWORK 3: `AddItemPanel` canonical story fails the blocking mobile gate

**Kickoff:** `tasks/Sprints/Sprint_60_kickoff_prompt_Task_756_REWORK3_AddItemPanel_Story_Mobile_Proof.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## Reconciliation

Base Task 756 (`LocationCombobox`/`MantineCopyIdButton`/`MantineListingCardPattern` migration) is committed at
`29f9b16de` and approved (backlog row 756). This session's kickoff is a separate, narrower follow-up: the
canonical `AddItemPanel` Storybook fixture used a different button-row component than its real production
consumer, failing 12 cells of the blocking `screenshots:assert:fast` mobile gate. Working tree was clean at
session start except this task's own edits.

## Requirement and acceptance-criteria evidence

| AC | Requirement | Evidence |
|---|---|---|
| AC1 | Story's button row is `<Flex direction={{ base: 'column', sm: 'row' }} gap="xs">`, matching `LocationCombobox.tsx:172` | Quoted below |
| AC2 | 12 AddItemPanel cells: 12 fail → 0 fail, from own two runs | `screenshots-assert-before.log` (12 AddItemPanel fails) vs `screenshots-assert-after.log`/`screenshots-assert-after-run2.log` (0 AddItemPanel fails, grep confirmed) |
| AC3 | Reconcile every other verdict change | Full diff below — exactly one transient, self-resolving cell |
| AC4 | Production untouched | `git hash-object` == `git rev-parse HEAD:<path>` for both files |
| AC5 | typecheck/design-tokens/check:stories/check:story-coverage/build exit 0 | All logs below, all `EXIT_CODE=0` |
| AC6 | Evidence retained under `docs/sessions/evidence/task756R3/` | Confirmed, not scratch |

## Current versus required behavior

- **Current (before):** Story used `<Group gap="xs">` for the Add/Cancel button row — a row layout at every
  viewport, so buttons never stack full-width below 640px, unlike the real consumer.
- **Required (after):** Story uses `<Flex direction={{ base: 'column', sm: 'row' }} gap="xs">`, identical to
  `LocationCombobox.tsx:172`, so buttons stack full-width at <640px and sit side by side at ≥640px, matching
  production exactly.
- **Negative flows:** ≥640 desktop branch unchanged (`sm: 'row'` reproduces side-by-side); long uk/sq labels at
  320 — full-width buttons make clipping less likely; confirmed no new failure introduced for those locales.

## Files Changed

| File | Lines | Reason |
|---|---|---|
| `src/stories/patterns/mantine/AddItemPanel.stories.tsx` | 2 (import), 20-23 (docs description), 40-44 (button row) | Replace `Group` import/usage with `Flex` responsive row matching the real consumer; document the fixture's fidelity to `LocationCombobox` in `docs.description.component` |

Quoted button rows:

```
// AddItemPanel.stories.tsx (after)
<Flex direction={{ base: 'column', sm: 'row' }} gap="xs">

// LocationCombobox.tsx:172 (real consumer, unchanged)
<Flex direction={{ base: 'column', sm: 'row' }} gap="xs">
```

Identical.

## Validation evidence

All commands run from repo root, output captured unpiped to a file with `EXIT_CODE=$?` appended as a separate
statement (never piped through another command).

| Command | Result | Log |
|---|---|---|
| `npm run typecheck` (pre-restore-confirmation) | exit 0 | `typecheck.log` |
| `npm run typecheck` (final state) | exit 0 | `typecheck-final.log` |
| `npm run build-storybook` (fix applied, run 1) | exit 0 | `build-storybook.log` |
| `npm run build-storybook` (reverted, before-run) | exit 0 | `build-storybook-before.log` |
| `npm run build-storybook` (fix restored, run 2) | exit 0 | `build-storybook-after-restore.log` |
| `npm run screenshots:assert:fast` (before) | exit 1 (pre-existing repo-wide FAIL baseline) | `screenshots-assert-before.log` |
| `npm run screenshots:assert:fast` (after, run 1) | exit 1 (pre-existing baseline minus 12; one transient) | `screenshots-assert-after.log` |
| `npm run screenshots:assert:fast` (after, run 2 — confirming) | exit 1 (pre-existing baseline minus 12, transient gone) | `screenshots-assert-after-run2.log` |
| `npm run check:design-tokens` | exit 0, "0 violations found" | `check-design-tokens.log` |
| `npm run check:stories` | exit 0, "128 files checked, 0 violations" | `check-stories.log` |
| `npm run check:story-coverage` | exit 0, "17 covered … 0 enrolled but unproven" | `check-story-coverage.log` |
| `npm run build` | exit 0 | `build.log` |

**AC2 counts (own runs, not the kickoff's):**

- Before: `Results: 2005/2276 PASS, 193 FAIL` — includes all 12 `Patterns/Mantine/AddItemPanel/Default × {sq,en,uk,it} × {mobile-320,mobile-375,mobile-390}` cells.
- After run 1: `Results: 2016/2276 PASS, 182 FAIL` — 0 AddItemPanel cells (grep -i "additempanel" → no hits); includes one transient `Command/MobileBottomSheet × en × mobile-390` (`blank-canvas`/`horizontal overflow`).
- After run 2 (confirming): `Results: 2017/2276 PASS, 181 FAIL` — 0 AddItemPanel cells; the transient MobileBottomSheet cell is gone (no mention in the log at all).

193 − 181 = 12, matching the AddItemPanel cell count exactly.

**AC3 reconciliation (full diff, before vs. after-run2 failing-cell headers):**

```
diff before-stories.txt after-run2-stories.txt
1,12d0
<   Patterns/Mantine/AddItemPanel/Default × sq × mobile-320
<   Patterns/Mantine/AddItemPanel/Default × sq × mobile-375
<   Patterns/Mantine/AddItemPanel/Default × sq × mobile-390
<   Patterns/Mantine/AddItemPanel/Default × en × mobile-320
<   Patterns/Mantine/AddItemPanel/Default × en × mobile-375
<   Patterns/Mantine/AddItemPanel/Default × en × mobile-390
<   Patterns/Mantine/AddItemPanel/Default × uk × mobile-320
<   Patterns/Mantine/AddItemPanel/Default × uk × mobile-375
<   Patterns/Mantine/AddItemPanel/Default × uk × mobile-390
<   Patterns/Mantine/AddItemPanel/Default × it × mobile-320
<   Patterns/Mantine/AddItemPanel/Default × it × mobile-375
<   Patterns/Mantine/AddItemPanel/Default × it × mobile-390
```

No other line differs — **explained**, all 12 are the intended fix. Ambiguous-cell (⚠️) sets are byte-identical
between before and after-run2 (diff empty). Out-of-range (ℹ️) sets identical (12 `Planted/LargeRangeGuard` cells,
unrelated).

**The `Command/MobileBottomSheet × en × mobile-390` cell** (before vs after-run1 vs after-run2):

| Run | Present? |
|---|---|
| before | No |
| after run 1 | Yes — `render failure [blank-canvas]: near-uniform (bg=100.0%, var=0.0)` + `horizontal overflow detected` |
| after run 2 | No |

Classification: **known-flaky** (harness non-determinism — a render/screenshot timing glitch on an unrelated
`Command/MobileBottomSheet` story, self-resolved on immediate re-run with no code change in between; not caused
by this diff, which touches only `AddItemPanel.stories.tsx`). No `UNEXPLAINED` entries remain.

**`Command/MobileBottomSheet × it × mobile-320`** (the kickoff's separately-flagged, not-yet-classified "new as
of 2026-08-18" cell): searched all three of this session's own runs — **absent from all three** (before, after
run 1, after run 2). Not reproduced in this session; left unclassified for whoever next observes it, per the
kickoff's explicit "do not fix here."

**AC4 hash witnesses:**

```
MantineAddItemPanel.tsx  worktree=c1407fb7427e662e150703d7114cb2c25b891d21  HEAD=c1407fb7427e662e150703d7114cb2c25b891d21
LocationCombobox.tsx     worktree=cb8e111caefe95385da91f69178a08ddfa705265  HEAD=cb8e111caefe95385da91f69178a08ddfa705265
```

Both match — production untouched.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Path | Disposition | Evidence |
|---|---|---|---|---|---|
| AddItemPanel canonical story's Add/Cancel button row | `AddItemPanel.stories.tsx` `Default.render` | `@mantine/core` `Flex`/`Group` (Storybook-only fixture, not app CSS) | `src/stories/patterns/mantine/AddItemPanel.stories.tsx:40-44` | **Change** — story-only, mirrors `LocationCombobox.tsx:172` | `screenshots-assert-*` runs; hash witnesses proving `MantineAddItemPanel.tsx`/`LocationCombobox.tsx` (the actual production chrome/consumer) untouched |
| `MantineAddItemPanel.tsx` (chrome-only component) | production | N/A | `src/design-system/mantine/patterns/MantineAddItemPanel.tsx` | **Preserve exactly** (task-named) | Hash witness match |
| `LocationCombobox.tsx` (real consumer) | production | N/A | `src/components/shared/LocationCombobox.tsx` | **Preserve exactly** (task-named) | Hash witness match |

## Canonical UI decision record

This task edits an existing canonical Storybook fixture only (no new visible production artifact). The story's
`docs.description.component` was extended by one sentence to record that its children mirror the real
`LocationCombobox` composition — no new shared style/token, no registration change; `Group`/`Flex` are both
existing `@mantine/core` exports already in use elsewhere in the codebase.

## Implementation validation notes

No defects found beyond the one the kickoff described. `git stash` is owner-only mutating git, so the "before"
baseline was captured by manually reverting the story file's 3 hunks via Edit (confirmed byte-identical to
`HEAD` via empty `git diff`), running the full build+assert cycle, then restoring the fix via Edit and
confirming the diff matched the original fix exactly before the final build+assert+gates pass.

## Assumptions, deviations, and limitations

- Used Edit-based revert/restore instead of `git stash` per the Sonnet git boundary (read-only git only). Verified
  byte-identical reversion via `git diff` (empty) before the before-run, and the final restored diff matches the
  originally-applied fix exactly.
- Two full `screenshots:assert:fast` runs after the fix (not required by AC2 alone) were run because AC3 requires
  resolving the one non-baseline verdict change (`Command/MobileBottomSheet × en × mobile-390`) to a definite
  classification rather than leaving it `UNEXPLAINED`.

## Opus handoff

- Evidence: `docs/sessions/evidence/task756R3/` — `typecheck.log`, `typecheck-final.log`, `build-storybook*.log`
  (×3), `screenshots-assert-before.log`, `screenshots-assert-after.log`, `screenshots-assert-after-run2.log`,
  `check-design-tokens.log`, `check-stories.log`, `check-story-coverage.log`, `build.log`.
- Please independently re-open `src/stories/patterns/mantine/AddItemPanel.stories.tsx` and
  `src/components/shared/LocationCombobox.tsx:172` to confirm the button-row quote match.
- Please independently confirm the `Command/MobileBottomSheet × en × mobile-390` flakiness classification by
  spot-checking the three logs' MobileBottomSheet mentions (before: none; after-run1: one; after-run2: none).
- `Command/MobileBottomSheet × it × mobile-320` (the kickoff's separately-flagged cell) did not reproduce in any
  of this session's three runs — still unclassified, left for the next observer per the kickoff's instruction.

## Backlog update

`docs/backlog.md` "Last Session" line replaced in place (line count held at 80, matching `HEAD`'s baseline of
80). **BACKLOG LIMIT BREACH flagged** — file is at the ~80-line target; Opus should consolidate on next review
rather than this session adding further lines.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.
