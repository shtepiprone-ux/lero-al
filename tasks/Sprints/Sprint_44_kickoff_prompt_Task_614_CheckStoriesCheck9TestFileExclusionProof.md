# Task 614 — Planted-violation proof for the `check-stories.mjs` Check-9 test-file exclusion (+ reconcile the stale `checksRan` assertion)

Sprint 44. Orchestrator-opened 2026-07-16 from the **Task 612 review**. Task 612 self-merged a change to a
**shared verification gate** — `scripts/check-stories.mjs` Check 9 now excludes `.test.tsx` / `__tests__/**`
files from its runtime-hardcode scan (`isNonRuntimeFile`, `check-stories.mjs:525-528`) — but shipped it with
**no dedicated regression proof for the gate change itself**. Per the project's own Task 567 precedent, changes
to shared verification infrastructure must be provable (planted-violation), not self-asserted. This task closes
that gap. **Low priority / cleanup — NOT a blocker. Do AFTER 612 lands.**

## The finding (confirmed by orchestrator source read, 2026-07-16)
`scripts/check-stories.mjs` Check 9 ("Runtime component hardcoded literals") scans `src/components/**` +
`src/modules/**` `.tsx` files for raw English user-facing literals. Task 612 widened the exclusion:
```js
// check-stories.mjs:525-528
const isNonRuntimeFile = (f) => f.endsWith('.stories.tsx') || f.endsWith('.test.tsx') || f.includes('__tests__');
const RUNTIME_FILES = [
  ...collectFiles(join(root, 'src', 'components'), ['.tsx']).filter(f => !isNonRuntimeFile(f)),
  ...collectFiles(join(root, 'src', 'modules'), ['.tsx']).filter(f => !isNonRuntimeFile(f)),
];
```
The change is defensible (a vitest `getByRole('button', { name: 'Next' })` assertion matches a Mantine
`aria-label`, not user-facing copy — same "not runtime UI" reasoning that already excluded `.stories.tsx`), but
the gate's own vitest suite (`scripts/__tests__/check-stories.test.ts`) has only the pre-612 Check-9 pair
(`check-stories.test.ts:418-430`: BAD `>Previous<` runtime component, GOOD `t()` call). **Nothing pins the new
exclusion boundary** — nothing proves that (a) a `.test.tsx` / `__tests__` file is now correctly skipped, and,
more importantly, (b) the exclusion did NOT open a blind spot: a genuine hardcode in a real NON-test
`src/modules/**` component must STILL be caught.

Separately, `check-stories.test.ts:739` asserts `checksRan === 13` on a clean root. Task 612's session log
records (via `git stash` at HEAD `82b5f1d0b`) that this assertion **fails identically at HEAD, independent of
Task 612** — pre-existing stale drift (the gate runs more checks than 13 now). A gate whose own completeness
test is red undermines the gate's credibility. Reconcile it here.

## Pre-read (rule-index: Storybook/visual-snapshot + governance)
- **Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — this touches
  the NO-HARDCODE gate, `check-stories.mjs`; the registry's "Storybook rendered-proof gate" row is a DIFFERENT
  script (`check-stories-rendered.mjs`) — do not conflate; no registry row change expected, confirm).
- **Required:** `docs/storybook-governance.md` (§14 enforced gates — Check 9 lives here), `docs/qa-rules.md`
  (test conventions), `docs/component-rules.md`.
- Read `scripts/check-stories.mjs` Check 9 (`:515-550`) and the existing gate test
  `scripts/__tests__/check-stories.test.ts` (Check-9 block `:416-430`; gate-completeness block `:736-750`;
  fixture helpers `:36-91`) in full before touching anything.

## Scope (files)
**In scope (ONLY these):**
- `scripts/__tests__/check-stories.test.ts` — add the Check-9 exclusion-boundary tests + reconcile `checksRan`.
- `docs/backlog.md` — mark 614 done, tidy, numbering.
- `docs/sessions/2026-07-16-task614-*.md` — session log.

**Out of scope (do NOT touch):**
- `scripts/check-stories.mjs` — the exclusion already landed in Task 612; this task only PROVES it. Do NOT
  modify the gate logic. If a test reveals the exclusion is actually WRONG (e.g. it skips a real component),
  STOP-AND-ASK — do not "fix" the gate here.
- Any product code, any `.stories.tsx`, any other gate script.

## Positive flow (happy path)
Actor: Sonnet executor. Adds, to the existing Check-9 `describe` block in `check-stories.test.ts`, using the
existing temp-root fixture helpers (extend with a `writeTestFile`/`writeModule` helper as needed — same pattern
as `writeComponent`, `:59-63`):
1. **GOOD (exclusion works) — `.test.tsx`:** write a `src/components/**/Foo.test.tsx` (and a second under
   `src/modules/**/__tests__/Foo.tsx`) whose body contains a real English literal in the exact shape that
   triggered the false-positive — e.g. `getByRole('button', { name: 'Next' })` and a JSX `>Previous<` — then
   assert `hasRule(gate(root).violations, 'runtime-hardcode') === false` for BOTH. This proves the false-positive
   is genuinely fixed.
2. **BAD (blind-spot guard) — real non-test component STILL caught:** write the SAME English literal into a real
   non-test `src/modules/**/RealComponent.tsx` (no `.test`/`__tests__` in the path) and assert
   `hasRule(..., 'runtime-hardcode') === true`. This proves the exclusion did NOT open a hole.
3. **Boundary pin:** ideally the SAME literal string in both files in one test-pair, so the only difference is the
   path — the cleanest possible proof that the exclusion keys on the filename, nothing else.
4. **Reconcile `checksRan`:** determine the real check count on a clean root (run the gate, read `checksRan`),
   update `check-stories.test.ts:739` to the true value, and add a one-line comment that it tracks the real
   number of checks the gate runs (so the next check-addition updates it deliberately). If the real count is
   ambiguous or the drift looks like an accidental missing-check, STOP-AND-ASK rather than blindly bumping.
5. `npx vitest run scripts/__tests__/check-stories.test.ts` → all green (the pre-existing suite + the new tests +
   the now-correct `checksRan`). `npx tsc --noEmit` → 0. `eslint` clean.

## Negative flow (every off-happy-path branch)
- **Exclusion is actually wrong (skips a real component):** if the blind-spot BAD test does NOT fire
  `runtime-hardcode` on a genuine non-test component, that means the Task-612 exclusion over-matched — STOP-AND-ASK
  the orchestrator immediately; do NOT patch `check-stories.mjs` in this task.
- **`checksRan` real value can't be pinned deterministically** (varies by root contents): keep the assertion but
  make it assert the count observed on the clean `makeRoot()` fixture with a comment; if it still flaps,
  STOP-AND-ASK — do not delete the completeness test to make it "pass".
- **Adding the `writeTestFile` helper breaks an existing test** (temp-root pollution): scope the new helper so it
  only writes the intended file; re-run the FULL suite (`:1-751`) to confirm zero regression, paste the count.
- **A new test itself is a no-op** (passes even with the exclusion reverted): MANDATORY anti-no-op proof below —
  if reverting the exclusion does NOT turn the GOOD `.test.tsx` test red, the test is worthless; rewrite it.

## Acceptance criteria
1. New Check-9 tests added to `check-stories.test.ts`: (a) `.test.tsx` GOOD (no `runtime-hardcode`), (b)
   `__tests__/*.tsx` GOOD, (c) real non-test `src/modules/**` component with the same literal BAD
   (`runtime-hardcode` fires) — the blind-spot guard. (file:line each)
2. **Anti-no-op planted-violation transcript (the whole point of this task):** with `check-stories.mjs`'s
   `isNonRuntimeFile` reverted to the pre-612 `.stories.tsx`-only form, the new `.test.tsx`/`__tests__` GOOD
   tests genuinely FAIL (the test-file literal now gets flagged `runtime-hardcode`); revert restores green. Paste
   both directions. Separately note: the blind-spot BAD test stays green in both directions (it must — it proves
   real components are always scanned). (transcript)
3. `check-stories.test.ts:739` `checksRan` assertion updated to the real value with a tracking comment; the
   gate-completeness test passes. If STOP-AND-ASK was needed, record the resolution. (file:line + transcript)
4. `npx vitest run scripts/__tests__/check-stories.test.ts` → full suite green (paste pass count, before N →
   after N+new). `npx tsc --noEmit`=0, `eslint` clean, `check:file-integrity` + `check:mojibake` clean on the
   touched test file. (transcript)
5. `scripts/check-stories.mjs` confirmed UNTOUCHED by this task (`git diff --stat` shows only the test file +
   docs). (evidence — owner native diff at review)
6. Session log + `docs/backlog.md` (mark 614 done, tidy per the backlog rules, numbering) + "Files Changed"
   table. Executor emits NO git.

## Hard contract
Prove the gate, do NOT change the gate. `check-stories.mjs` stays byte-identical — if a test shows the exclusion
is wrong, STOP-AND-ASK. Every new test must be anti-no-op (reverting the exclusion turns the exclusion-GOOD tests
red — proven by transcript). No product code, no `.stories.tsx`, no scope creep. Executor emits NO git commands
(single-writer rule) — the orchestrator emits the commit at review after reading the real diff.
