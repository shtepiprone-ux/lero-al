# Session Log — Task 664: Reshape the `AmbiguousOverlap` planted fixture to re-exercise its R1 branch

**Date:** 2026-07-23
**Kickoff:** `tasks/kickoff_prompt_Task_664_AmbiguousOverlap_Fixture_Reshape.md`
**QA profile:** Q1 Targeted + gate-integrity (planted-violation) proof.
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## 1. Summary

`Planted/AmbiguousOverlap` (Task 467) was created to prove Check 4's R1 `isAbsoluteOverOwnTrigger` branch: an
`absolute`-positioned popup over its own `static` sibling trigger classifies as `ambiguous-overlap`, not a hard FAIL
and not a silent PASS. Task 663's review (finding N2) discovered the fixture's trigger and popup render to
**byte-identical rects**, so the Task-611 `isContained` bounding-box guard (added for the Mantine
`rightSection`/adornment pattern) treats them as mutually contained and short-circuits **before** the code ever
reaches the R1 branch — the fixture has returned `pass` (no finding) since ~Task 611 (2026-07-15) and stopped proving
its own gate.

This task reshapes only the fixture's markup (offsets the popup horizontally) so the pair partially overlaps without
either rect containing the other, restoring the R1 code path. `scripts/geometry-integrity.mjs` is byte-for-byte
unchanged, per scope.

## 2. Files changed

| File | Change |
|---|---|
| `src/stories/PlantedVisualViolations.stories.tsx` | `AmbiguousOverlap` popup: `left: 0` → `left: 60` (one line). |
| `scripts/check-stories-rendered.mjs` | Added a 3-line comment above the `AmbiguousOverlap` `ASSERT_STORIES` entry stating the expected `ambiguous-overlap` (R1) verdict. No anchor/id change. |
| `docs/backlog.md` | Added the Task 664 entry (top of "Last Session"); updated the task-numbering line. |
| `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` | Regenerated as a side effect of running `screenshots:assert` (this report auto-writes on every run). Not edited directly; already showed as locally modified before this session started (pre-existing, unrelated). Per kickoff §8 (mirrors Task 663 precedent), committing this regenerated inventory is the owner's call, not this task's scope. |

`git status --short` at completion:
```
 M docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md
 M scripts/check-stories-rendered.mjs
 M src/stories/PlantedVisualViolations.stories.tsx
```
(`docs/backlog.md` and this new session log are additional expected artifacts of the executor protocol.)

`scripts/geometry-integrity.mjs` is **absent** from the diff — confirmed via `git status`/`git diff` — satisfying R3/AC4.

## 3. The reshape

Before (defect, byte-identical rects):
```jsx
<div style={{ position: 'relative', width: 200, height: 50 }}>
  <div role="button" tabIndex={0} data-testid="planted-ambiguous-trigger"
       style={{ padding: 8, cursor: 'pointer', width: 120 }}>Trigger #467</div>
  <div role="button" tabIndex={0} data-testid="planted-ambiguous-popup"
       style={{ position: 'absolute', left: 0, top: 0, width: 120, height: 40, padding: 8, cursor: 'pointer' }}>Popup #467</div>
</div>
```

After (this task):
```jsx
<div role="button" tabIndex={0} data-testid="planted-ambiguous-popup"
     style={{ position: 'absolute', left: 60, top: 0, width: 120, height: 40, padding: 8, cursor: 'pointer' }}>Popup #467</div>
```
Only the popup's `left` changed (`0` → `60`); the wrapper (`width: 200`), the trigger, both `data-testid`s, `role="button"`,
`tabIndex`, and the static-trigger/absolute-popup sibling relationship are all unchanged (A1's assumption that a 200px
wrapper still fits held — no widening was needed).

## 4. AC1 — Live rect probe (R1)

Method: a disposable, uncommitted throwaway Playwright script (same method as the Task 538/569/663 precedent — never
committed), served `storybook-static/` (built via `npm run build-storybook`), navigated to
`Planted/AmbiguousOverlap` at 320/375/390 × `en`, and read `getBoundingClientRect()` for both testids plus
`isContained`/`rectsOverlap` computed with the harness's own tolerance (1px).

Result — **identical at all 3 widths** (fixture is a fixed-pixel layout, no responsive breakpoint in scope):

| Width | Trigger rect | Popup rect | overlapX | overlapY | `isContained` (either direction) |
|---|---|---|---|---|---|
| 320 | `[16,24,136,64]` | `[76,24,196,64]` | 60 | 40 | `false` / `false` |
| 375 | `[16,24,136,64]` | `[76,24,196,64]` | 60 | 40 | `false` / `false` |
| 390 | `[16,24,136,64]` | `[76,24,196,64]` | 60 | 40 | `false` / `false` |

`trigger.position = static`, `popup.position = absolute`, `sameParent = true` at all 3 widths. **AC1 confirmed:**
rects partially overlap and neither contains the other.

## 5. AC3 — OLD-fixture-vs-NEW-fixture proof (R4, same unmodified harness)

Ran the same throwaway probe's `checkGeometryIntegrity` call (imported directly from the **committed**
`scripts/geometry-integrity.mjs` — untouched by this task) against two different rendered DOMs: the fixture markup
before this task's edit (temporarily reverted, storybook rebuilt, probed, then restored — no git operations used) and
the fixture markup after this task's edit.

**OLD fixture markup** (`left: 0`, pre-existing defect) — same harness:
```
width=320: trigger=[16,24,136,64] popup=[16,24,136,64] overlapX=120 overlapY=40 isContained(both dirs)=true
verdict: {"pass":true,"ambiguousOnly":false,"violations":[],"ambiguous":[]}
```
(byte-identical at 375/390 — same fixed-pixel layout)

**NEW fixture markup** (`left: 60`, this task) — identical harness:
```
width=320: trigger=[16,24,136,64] popup=[76,24,196,64] overlapX=60 overlapY=40 isContained(both dirs)=false
verdict: {"pass":false,"ambiguousOnly":true,"violations":[],
          "ambiguous":[{"failReason":"ambiguous-overlap",
            "selector":"[data-testid=\"planted-ambiguous-trigger\"] ↔ [data-testid=\"planted-ambiguous-popup\"]",
            "reason":"library-internal or position:absolute/fixed over own trigger/anchor"}]}
```
(byte-identical at 375/390)

**AC3/R4 confirmed:** the reshape alone flips the fixture `pass` → `ambiguous-overlap` against the exact same,
unmodified harness code — direct proof the fixture now exercises the R1 `isAbsoluteOverOwnTrigger` branch it was
built to guard.

## 6. AC2/AC4 — `screenshots:assert -- --fast` (R2/R3)

`npm run screenshots:assert -- --fast` (full command, `.screenshots/rendered-assert/2026-07-23T16-52/`):

```
Results: 1819/2108 PASS, 219 FAIL, 12 OUT-OF-RANGE, 58 AMBIGUOUS (needs-owner-decision)
```

`Planted/AmbiguousOverlap` appears in the **AMBIGUOUS** section at all 12 cells (3 widths × 4 locales), each:
```
? [ambiguous-overlap]: [data-testid="planted-ambiguous-trigger"] ↔ [data-testid="planted-ambiguous-popup"]
  — library-internal or position:absolute/fixed over own trigger/anchor
```
It does **not** appear in the FAIL section (verified via `grep -n "AmbiguousOverlap"` across the full log — all 12
matches are in the ambiguous list, none in the failed-cells list).

**Baseline comparison (Task 663 session log §5.1, same `--fast` command, pre-this-task):**

| Metric | Task 663 baseline | This run | Delta |
|---|---|---|---|
| PASS | 1831 | 1819 | −12 |
| FAIL | 219 | 219 | 0 |
| OUT-OF-RANGE | 12 | 12 | 0 |
| AMBIGUOUS | 46 | 58 | +12 |

The delta is exactly the 12 `AmbiguousOverlap` cells moving from PASS to AMBIGUOUS — no other planted or Mantine
story's verdict changed (FAIL and OUT-OF-RANGE counts are byte-identical; every other AMBIGUOUS-section entry in
this run — Combobox ×4, PopularLocationsView ×16, Tabs ×2, IntentionalEllipsis ×12, OverlayNoBackdrop ×12 = 46 —
matches the Task 663 baseline's pre-existing/unrelated set). **AC2 and AC4 confirmed.**

## 7. Standard gates

1. `npx tsc --noEmit` → **0 errors**.
2. `npm run build` → `✓ Compiled successfully in 44s`, `✓ Generating static pages (40/40)`, exit 0 (full transcript captured).
3. `npm run check:stories` → `✅ check:stories PASSED — 126 files checked, 0 violations`.
4. `npm run check:file-integrity` → `✅ PASSED — all 3 file(s) clean` (the 3 git-changed files).
5. `npm run check:mojibake` → `0 artifacts in 1882 files`.
6. `node --check scripts/geometry-integrity.mjs && node --check scripts/check-stories-rendered.mjs` → both exit 0.

## 8. Acceptance criteria self-audit

| AC | Requirement | Evidence | Result |
|---|---|---|---|
| AC1 [R1] | Rects partially overlap, neither contains the other, at 320/375/390 | §4 (rects recorded, `isContained`=false both directions all 3 widths) | ✅ |
| AC2 [R2] | Classified `ambiguous-overlap` (`ambiguousOnly:true`) at all 3×4 cells, not pass/fail | §6 (`--fast` console, 12/12 in AMBIGUOUS section, 0 in FAIL) | ✅ |
| AC3 [R4] | OLD fixture = `pass`, NEW fixture = `ambiguous-overlap`, same unmodified harness | §5 (throwaway OLD-vs-NEW probe) | ✅ |
| AC4 [R3] | `geometry-integrity.mjs` absent from diff; no other fixture's verdict changed | §2 (`git diff`/`git status`), §6 (PASS/FAIL/OUT-OF-RANGE deltas exactly account for the 12 flipped cells) | ✅ |
| AC5 [R5] | `tsc` clean, `build` exit 0 | §7 | ✅ |

## 9. Assumptions, deviations, limitations

- **A1 confirmed true:** the existing 200px-wide `position:relative` wrapper comfortably fits the shifted popup
  (rect right edge 196 < wrapper's rendered right edge) at all 3 required widths — no widening was needed.
- No deviation from the kickoff's verification plan; all 5 listed commands ran using their exact repo-known form.
- The regenerated visual-defect inventory report (`docs/governance-reports/2026-06-19-task467-...md`) is a known
  side effect of running `screenshots:assert` and, per kickoff §8 (Task 663 precedent), is not this task's to commit —
  flagging for the owner/orchestrator same as Task 663.
- OQ1 (special-casing exact-equal rects in the `isContained` guard) remains a separate, non-blocking spawn candidate
  per the kickoff — not addressed here.

## 10. Not done / out of scope (confirmed unchanged)

- `scripts/geometry-integrity.mjs` — byte-for-byte unchanged (confirmed via `git diff`).
- No other planted fixture's markup touched.
- No product component/route/style/i18n change.
