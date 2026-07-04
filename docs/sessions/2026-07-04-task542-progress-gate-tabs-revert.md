# Task 542 — Task 539 commit-unblock: Progress rendered-gate FAIL resolution + Tabs revert

**Executor:** Sonnet. **Type:** UI / rendered-gate resolution + small revert (gate-tooling + docs +
`input-chrome.css`) — NOT product code. **Status:** IMPLEMENTED, pending orchestrator review — **HELD, do NOT
run git**. Kickoff: `tasks/Sprints/Sprint_40_kickoff_prompt_Task_542_Task539CommitUnblock_ProgressGate_TabsRevert.md`.

## Pre-read confirmation

Read in full: `docs/storybook-governance.md` §14 (§14.3/14.4/14.9 incl. all sub-sections §14.9.1–14.9.7),
`docs/backlog.md`, `src/design-system/mantine/input-chrome.css` (full, pre-session), `scripts/check-stories-rendered.mjs`
(full, incl. `waitForStoryReady`/`captureCell`/`LOADER_ALLOWLIST`/`GEOMETRY_ALLOWLIST` mechanisms),
`docs/critical-flow-registry.md` (scanned — rows 89/93/99 reference `check-stories-rendered.mjs` as the gate
mechanism itself, not "Progress" or "Tabs" as a product flow; this task only adds one `LOADER_ALLOWLIST` entry
following the exact pre-existing `mantine-primitives-button--default` precedent — the loader/anchor/geometry
detection logic is unmodified for every other story — so no registered critical flow is touched, confirmed).

## Item 1 — Progress/Default `[loader-only]` gate false-positive (CONFIRMED root cause, primitive untouched)

**Root cause, confirmed by reading `waitForStoryReady`** (`scripts/check-stories-rendered.mjs`): the readiness
detector's `hasProgressbar = root.querySelector('[role="progressbar"]') !== null` signal feeds directly into
`loaderPresent`. This is correct for a transient spinner but Mantine's `ProgressSection` renders
`role="progressbar"` **permanently** on every determinate `<Progress>` bar (confirmed in `MantineProgress.tsx`'s
own doc comment, verified against `Progress.mjs`/`ProgressSection.mjs`). `Progress.stories.tsx`'s `Default`
export renders 7 `<MantineProgress>` instances — `loaderPresent` can never resolve to `false` for this story, so
every cell hits the 15s readiness timeout and hard-FAILs `[loader-only]` before any geometry/overflow assertion
ever runs (the early-return at `captureCell` line ~660 short-circuits before Layer 2's `noHorizontalOverflow`
check) — the primitive was never actually measured for overflow by this gate; the FAIL was purely the loader
heuristic, never a real defect.

**Fix (gate-tooling only, scoped to exactly one story):** added `'mantine-primitives-progress--default'` to
`LOADER_ALLOWLIST` in `scripts/check-stories-rendered.mjs`, following the identical mechanism/precedent as the
pre-existing `mantine-primitives-button--default` entry (Task 529, §14.9.4). Global loader/spinner detection is
UNCHANGED for every other story — `hasProgressbar`/`hasSpinner`/etc. still fire `loader-only` normally elsewhere.

**Docs:** added `docs/storybook-governance.md` §14.9.8 recording the root cause, the owner's 2026-07-04 manual-QA
render set (en/uk/sq/it@320, en/uk@375, uk@480, uk@1280 — confirmed §6 chrome, sm/md/lg/xl heights, all
determinate values incl. clamped out-of-range, long-label wrap with no clip/h-scroll at 320), and the fix.

**Primitive UNCHANGED — grep-proven:**
```
$ git status --short
 M docs/storybook-governance.md
 M scripts/check-stories-rendered.mjs
 M src/design-system/mantine/input-chrome.css
?? src/design-system/mantine/patterns/MantineProgress.tsx      (untracked, Task 539's file — 0 bytes touched this session)
?? src/stories/mantine/primitives/Progress.stories.tsx         (untracked, Task 539's file — 0 bytes touched this session)
```
`MantineProgress.tsx` and `Progress.stories.tsx` do not appear as modified by this session (they remain the
untracked Task 539 files, byte-identical to before this task started — this session made zero edits to either).
`theme.ts`'s modification is Task 539's own pre-existing Scope A/B diff, not touched further by Task 542.

## Item 2 — Revert the premature Task 539 Tabs underline text-color block

Removed the `.mantine-Tabs-tab` / `.mantine-Tabs-tab[data-active]` block + its "Task 539 Scope C finding" comment
from `src/design-system/mantine/input-chrome.css` (12 lines, end of file). SegmentedControl §6c block (Scope B,
lines ~300–329) is untouched — grep-proven:

```
$ grep -rn "mantine-Tabs-tab" src/ docs/ scripts/ --include="*.{ts,tsx,css}"
(no matches)
```

`input-chrome.css` now ends cleanly at the SegmentedControl `::before` radius rule (line 329); no dangling
whitespace/orphan comment left behind.

## Gates — all green

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | ✅ clean, zero output |
| `npm run check:mojibake` | ✅ 0 artifacts in 1552 files |
| `npm run check:i18n` | ✅ parity PASSED, 2082 keys × 4 locales; 0 raw-enum leaks |
| `npm run check:design-tokens -- --strict` | ✅ 0 violations |
| `npm run check:file-integrity` | ✅ 27 files clean |
| `npm run check:stories` | ✅ 99 files checked, 0 violations (all 13 checks + stale-allowlist) |
| `npm run build-storybook` | ✅ built in 39.55s |
| `npm run screenshots:assert -- --mantine-only` | ✅ **397/400 PASS, 0 FAIL, 3 AMBIGUOUS** |

### Native rendered-gate manifest (`--mantine-only`)

```
Mantine/Primitives/* stories: 25 (400 cells @ 320/375/390/1024 × 4 locales)
Results: 397/400 PASS, 0 FAIL, 3 AMBIGUOUS (needs-owner-decision)
  ambiguous-overlap: 3
Manifest: .screenshots/rendered-assert/2026-07-04T13-17/manifest.json
```

Manifest inspection (`node -e "require(...).matrix.filter(...)"`):
- **`mantine-primitives-progress--default`: 16/16 cells, all `verdict: 'pass'`.** `loaderOnly: 0` in the
  top-level summary (was 16 before this fix). Zero unexplained red Progress cell.
- **`mantine-primitives-tabs--default`: 16 cells — 13 `pass` + 3 `ambiguous`** (sq/uk/it × mobile-320,
  `ambiguous-offscreen`, the pre-existing owner-accepted swipe-scroll design state per §14.9.7 — unrelated to
  this task, untouched, exactly as the kickoff predicted: "only the 3 Tabs-swipe ambiguous cells remain").
- Top-level `summary`: `total:400, passed:397, failed:0, ambiguousOnly:3, loaderOnly:0` — every other
  `*Only`/fail-reason counter is 0.

### Regression (clause 15)

No product code, no `src/app`/`components`/`modules` touched. `docs/critical-flow-registry.md` scanned — no
registered flow references Progress or Tabs chrome; the gate mechanism itself (rows 89/93/99) is unmodified in
its detection logic, only extended by one allowlist entry using the pre-existing, already-reviewed mechanism.
Confirmed: no regression.

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `scripts/check-stories-rendered.mjs` | Added `'mantine-primitives-progress--default'` to `LOADER_ALLOWLIST` with a documented comment | Closes the confirmed `[loader-only]` false-positive (permanent `role="progressbar"` on a determinate bar) without weakening global loader detection |
| `docs/storybook-governance.md` | Added §14.9.8 documenting root cause, owner manual-QA render set, and the fix | Owner-required record per Task 539/542 kickoff §14.9-style gate-limitation convention |
| `src/design-system/mantine/input-chrome.css` | Removed the `.mantine-Tabs-tab`/`[data-active]` underline text-color block + its comment | Task 541 supersedes this with the §6c/§6l segmented/pill redesign; keeps 539's `input-chrome.css` diff to SegmentedControl-only, avoids a stale/contradictory rule |

## Acceptance-criteria self-audit

1. ✅ Progress/Default 16-cell gate result resolved: all PASS (manifest-confirmed `loaderOnly: 0`, 16/16
   `verdict: 'pass'`), documented owner-acknowledged exemption attached (§14.9.8). No unexplained red Progress
   cell. (clause 13)
2. ✅ `.mantine-Tabs-tab` block removed from `input-chrome.css`, grep-proven zero matches repo-wide. (clause 1)
3. ✅ SegmentedControl (Scope B) unchanged — no diff to that block this session; still PASS (no SegmentedControl
   cell appears in the 3 remaining AMBIGUOUS cells or any FAIL bucket). No other primitive regressed (400-cell
   run: 397 PASS + 3 pre-existing ambiguous Tabs cells only).
4. ✅ All light gates green (table above); native rendered manifest attached
   (`.screenshots/rendered-assert/2026-07-04T13-17/manifest.json`).
5. ✅ This session log: Files-Changed table above, AC-by-AC self-audit (this section), self-validation line
   below. Git was NOT run — HELD for orchestrator diff review + commit emission.

**Self-validation:** all 5 acceptance criteria met; native `screenshots:assert -- --mantine-only` exits 0
(397/400 PASS, 0 FAIL, 3 pre-existing/unrelated AMBIGUOUS); Progress primitive files grep/git-status-confirmed
byte-identical to their Task 539 state; Tabs revert grep-proven complete; no product code touched; no git run.
