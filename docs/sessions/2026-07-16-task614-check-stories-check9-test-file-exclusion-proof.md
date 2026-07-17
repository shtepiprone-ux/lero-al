# Task 614 — Planted-violation proof for `check-stories.mjs` Check-9 test-file exclusion + `checksRan` reconciliation

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_614_CheckStoriesCheck9TestFileExclusionProof.md`.

## Pre-read
`docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scanned — no row for
`check-stories.mjs`/Check-9; the registry's Storybook-rendered-proof row is the separate
`check-stories-rendered.mjs` script, not this gate — confirmed, no registry change), `docs/storybook-governance.md`
§14, `docs/qa-rules.md`, `docs/component-rules.md`. Read `scripts/check-stories.mjs` Check 9 (`:515-550`) and
`scripts/__tests__/check-stories.test.ts` (Check-9 block, gate-completeness block, fixture helpers) in full before
touching anything.

## What was done
1. Added a `writeModule()` fixture helper (mirrors `writeComponent()`, writes into `src/modules/**`)
   — `scripts/__tests__/check-stories.test.ts:65-69`.
2. Added a new `describe('Check 9 exclusion boundary (Task 612 test-file exclusion)')` block
   (`:438-471`) with a single shared literal (`CHECK9_BOUNDARY_CONTENT`, mirrors the real false-positive
   shape: `getByRole('button', { name: 'Next' })` + JSX `>Previous<`) used across all three fixtures so the
   ONLY variable between them is the file path:
   - GOOD — `src/components/**/Pagination.test.tsx` → `runtime-hardcode` does NOT fire.
   - GOOD — `src/modules/**/__tests__/Pagination.tsx` → `runtime-hardcode` does NOT fire.
   - BAD (blind-spot guard) — `src/modules/**/Pagination.tsx` (no test marker) with the **same literal**
     → `runtime-hardcode` DOES fire. Proves the widened exclusion did not open a hole for real components.
3. Reconciled `checksRan` — the gate hardcodes `checksRan: 14` (`check-stories.mjs:872`, 14 checks:
   Check 1–14, Check 14 = the Task 520 Mantine-Button-size gate that was added after the test's `=== 13`
   assertion was last touched). Updated `check-stories.test.ts:780-786` to `toBe(14)` with a tracking
   comment explaining the drift and instructing future check-additions to bump it deliberately. Value is
   unambiguous (hardcoded return in the gate itself) — no STOP-AND-ASK needed.
4. `scripts/check-stories.mjs` — **confirmed byte-identical to HEAD** (`git diff --stat scripts/check-stories.mjs`
   empty both before AND after the temporary planted-violation revert used for the anti-no-op proof below).

## Anti-no-op planted-violation transcript (the whole point of this task)

**Step 1 — plant the reversion** (temporary, in-memory edit, reverted immediately after):
```diff
- const isNonRuntimeFile = (f) => f.endsWith('.stories.tsx') || f.endsWith('.test.tsx') || f.includes('__tests__');
+ const isNonRuntimeFile = (f) => f.endsWith('.stories.tsx');
```

**Step 2 — run the new tests with the plant in place:**
```
$ npx vitest run "scripts/__tests__/check-stories.test.ts" --exclude "**/.claude/**" -t "Check 9"

 ❯ scripts/__tests__/check-stories.test.ts (91 tests | 2 failed | 86 skipped)
     × GOOD — src/components/**/*.test.tsx is excluded (no runtime-hardcode)
     × GOOD — src/modules/**/__tests__/*.tsx is excluded (no runtime-hardcode)

 FAIL  ... GOOD — src/components/**/*.test.tsx is excluded (no runtime-hardcode)
 AssertionError: expected true to be false
 FAIL  ... GOOD — src/modules/**/__tests__/*.tsx is excluded (no runtime-hardcode)
 AssertionError: expected true to be false

 Tests  2 failed | 3 passed | 86 skipped (91)
```
Both new GOOD tests genuinely turn RED when the exclusion is reverted — not a no-op. The pre-existing
Check-9 pair (BAD `>Previous<` fires / GOOD `t()` skipped) and the new blind-spot BAD test stayed
green throughout (3 passed = those three), confirming real components are always scanned regardless of
the exclusion state.

**Step 3 — revert the plant, confirm byte-identical + full green:**
```
$ git diff --stat scripts/check-stories.mjs
(empty)

$ npx vitest run "scripts/__tests__/check-stories.test.ts" --exclude "**/.claude/**"
 Test Files  1 passed (1)
      Tests  91 passed (91)
```

## Validation transcript
- `npx tsc --noEmit` → 0 errors (no output).
- `npx eslint scripts/__tests__/check-stories.test.ts` → 0 errors (1 pre-existing "file ignored" warning —
  `scripts/**` is outside the repo's ESLint include globs; identical warning reproduces on the untouched
  `check-stories.mjs`, confirming this is a pre-existing repo config, not introduced by this task).
- `node scripts/check-file-integrity.mjs` (git-changed + untracked default) →
  `✅ check:file-integrity PASSED — all 2 file(s) clean` (0 NUL bytes, no BOM, no truncation on both
  touched files: this test file + the pre-existing unrelated `docs/governance-reports/...` edit already
  present at session start).
- `node scripts/check-mojibake.mjs` → `0 artifacts in 1759 files`.
- `npx vitest run "scripts/__tests__/check-stories.test.ts" --exclude "**/.claude/**"` → baseline 88 tests
  (1 pre-existing `checksRan` fail) → **91 tests, all green** (88 + 3 new).
- `git diff --stat` → only `scripts/__tests__/check-stories.test.ts` (+ the pre-existing, unrelated
  `docs/governance-reports/2026-06-19-task467-*.md` edit already dirty at session start — not touched by
  this task). `scripts/check-stories.mjs` absent from the diff — confirmed untouched.

Note: a stale, unrelated git worktree at `.claude/worktrees/shimmering-yawning-pony` (pre-existing, from an
earlier isolated-agent run, not part of this task) mirrors this test file and is picked up by a bare
`vitest run` glob — all commands above used `--exclude "**/.claude/**"` to scope strictly to the real repo
file. Not touched, not in scope.

## AC-by-AC self-audit
1. Three new Check-9 tests added — `check-stories.test.ts:441` (.test.tsx GOOD), `:447` (`__tests__` GOOD),
   `:453` (blind-spot BAD). ✅
2. Anti-no-op planted-violation transcript — see above; both directions pasted, blind-spot BAD confirmed
   green in both. ✅
3. `checksRan` reconciled to 14 with tracking comment at `check-stories.test.ts:776-783`; no STOP-AND-ASK
   needed (value is a hardcoded literal in the gate itself, unambiguous). ✅
4. Full suite green (88→91), `tsc`=0, eslint clean (pre-existing ignore-pattern only), file-integrity +
   mojibake clean on the touched file. ✅
5. `scripts/check-stories.mjs` confirmed untouched (`git diff --stat` empty for that path). ✅
6. Session log + backlog update below; "Files Changed" table below; no git commands emitted by this
   session. ✅

**Self-validation: tsc=0 errors · vitest=91/91 green (88→91) · eslint=clean (pre-existing ignore only) ·
file-integrity=PASSED · mojibake=0 artifacts · check-stories.mjs=byte-identical to HEAD · AC table=all
green · scope=clean (test file + docs only).**

## Files Changed
| File | Rationale |
|---|---|
| `scripts/__tests__/check-stories.test.ts` | Added `writeModule()` helper + the Check-9 exclusion-boundary test trio (2 GOOD + 1 blind-spot BAD) + reconciled the stale `checksRan===13` assertion to the true `14`. |
| `docs/sessions/2026-07-16-task614-check-stories-check9-test-file-exclusion-proof.md` | This session log. |
| `docs/backlog.md` | Mark Task 614 done, tidy per backlog rules. |

`scripts/check-stories.mjs` is NOT in this list — confirmed untouched by `git diff --stat`.
