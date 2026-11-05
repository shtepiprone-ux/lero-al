# Task 931 — readiness record of revision 4 (the Task 945 review 1 session, 2026-11-05)

Native Windows 11, Node v22.22.3, cwd `C:/Claude_Code_Projects/lero-al`, branch `task/935-governance-approval-route`, base `b3d9c4cbc`. Applies `.claude/rules/shared/task-readiness.md`. This session wrote the revision and neither implements nor reviews it.

## 1. Affected-path manifest

| Changed symbol | Callers and tests | Disposition |
|---|---|---|
| `createFakeDb`: log fields, `db.fail` with `error: null` and a count (`src/tests/fakeSupabase.ts`) | 42 current users (R6), the 70 of R8 | change, additions only: EXECUTED on a generated copy (`r4-proto/make-fake.mjs`, `run.txt:2`); the real one is the executor's, with R6 |
| `contactEvents.test.ts`, `submitListingInquiry.test.ts`, `AdminListingsTable.smoke.test.tsx` | already among the 70 and the scope of revision 3 (`r4-proto/affected.txt:5-7`) | change: tests added |
| `page.test.tsx`, `permissions.failures.test.ts`, `applyListingTransition.effects.test.ts` | new; held by no reviewed contract (`r4-proto/affected.txt:2-4,10`) | new |
| `contactEvents.ts`, `submitListingInquiry.ts`, `permissions.ts`, `applyListingTransition.ts`, `page.tsx`, `AdminListingsTable.tsx` | read and broken in memory only | unchanged: `git status --short -- src` is an acceptance criterion |

`scopeDigest` measure: the new files are in no reviewed scope or case. The rebase lists of R13 are unchanged, and C35 stays right, because no mapped case title changes.

## 2. Write authority

Every executor write of class D is a product test file or the shared fake, for Sonnet. `isPolicyPath` holds none of them. The sidecar is valid with the three new paths and the 12 cases: `r22-rerun-after-corrections.txt`.

## 3. Commands

| Actor, phase | Command | Input state | Effect | Expected |
|---|---|---|---|---|
| Prerequisite | Task 945 reviewed | `scripts/workflow-gates/mutation-check.mjs` in its reviewed form | none | R1 |
| Executor, route step 4 | `node scripts/workflow-gates/mutation-check.mjs --all --minutes=60 <file>` | R15 to R21 done | in memory, a report saved | AC12 |
| Reviewer | the same on at least `page.tsx` and `applyListingTransition.ts` | implemented | in memory | AC12 |

The mutation check's arguments can change with Task 945 revision 1. The executor uses the usage line of the reviewed version.

## 4. The proposed proof, challenged

EXECUTED: `r4-proto/run.mjs` ran 15 tests on the real source and applied 28 named defects in memory, one at a time, through a transform that fails when a break does not apply: 28 noticed (`r4-proto/run.txt`). That is the set of lines R16 to R20 name, except those below.

Found by the prototype and written into the route: the shared fake needs a log of what a query asked for, or `head: true` and the order cannot be seen; and a count that cannot be read needs an injection with no error (R15). A first draft kept the prototype's TypeScript beside its runner, inside the project's typecheck (`tsconfig.json` excludes only `node_modules` and `supabase/functions`); it was moved to the ignored `test-results/`, and only its text is tracked.

Not proven here, stated as such:

- ANALYTICAL: R21, the table's survivors. The prototype does not touch the table. R22 decides; a defect only a product change could show stops the task.
- ANALYTICAL: `applyListingTransition.ts:122`, `:222` and `:277`, `permissions.ts:133` and `:135`, and `page.tsx` lines other than the ones in `run.mjs`. The same.
- The prototype's fake does not evaluate `.or()`; R6's does, so the real test expects an audit total of 1 where the prototype asserts 2 (the comment in `holes.test.tsx.txt`).
- Whether every remaining defect of `page.tsx` can be shown by behaviour. R22 asks for a reason for each one that cannot.

## 5. Other kickoffs this revision changed

| Kickoff | Change | Proof |
|---|---|---|
| Task 937 | C36 moved by the lines added above R10 of this kickoff; its route is unchanged | `check-kickoff-evidence.mjs` on the file, `r22-rerun-after-corrections.txt` |

## 6. Bindings

Written after the last save of the kickoff and the sidecar: see `docs/sessions/evidence/task945/review/r22-rerun-after-corrections.txt`, which holds each digest and each gate's result.
