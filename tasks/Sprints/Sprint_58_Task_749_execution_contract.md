# Task 749 — executable task contract

Completed from `docs/orchestrator-execution-contract-template.md` on 2026-08-15. Retained with
`tasks/Sprints/Sprint_58_kickoff_prompt_Task_749_RenderedProof_Mobile_Remediation.md`.

## 1. One active execution route

| Field | Value |
|---|---|
| Task | 749 — clear the 18 blocking `--mantine-only` cells (AdminUsersTable x2, HeroSearch x12, NotificationBellView x4) |
| Active route / owner decision | Fix the three product defects in CSS/layout. Gate and workflow byte-unchanged. |
| Decision source, date, scope | Owner, 2026-08-15, three decisions quoted verbatim in kickoff §2: **D-1** gate stays blocking (baseline-comparison CI mode rejected) · **D-2** Task 593 superseded for this one button, threshold 390 -> 640 · **D-3** HeroSearch three-band model (`>=860` icon+text, `640–859` icon-only, `<640` full-width labelled, `>=44px`) · **D-4** one task, not three |
| Starting worktree mode | dirty with manifest — branch `codex/fix-task741-lint-baseline`; `git status --porcelain` carries exactly 2 untracked files, `.click-shield-ci-fixture.stdout.log` and `.click-shield-ci-fixture.stderr.log`. Both are pre-existing CI-fixture logs, unrelated to this task, and must still be the only untracked entries besides this task's own evidence directory at final state. |
| Exact allowed final write set | kickoff §4 items 1–8, plus `.screenshots/task749-evidence/**` |
| Blocked rule or decision, if any | none — the one decision that previously blocked this work (superseding Task 593, recorded at `Sprint_53_kickoff_prompt_Task_724R_FullWidthButtons_Revision.md:145`) is given as D-2 |

There is exactly one route. The rejected alternative (CI compares the fail set against a versioned baseline and
blocks only on new FAILs) is not a fallback and must not appear in the execution plan.

## 2. Checkpoint matrix

| # | Preconditions and preserved inputs | Writes allowed through this checkpoint | Observable result | Producer and persisted artifact | Comparator and failure behavior |
|---:|---|---|---|---|---|
| 0 | clean tree except the 2 known untracked logs | none | the 2 logs are the only `??` entries | `git status --porcelain` | any third entry -> **stop**; the baseline is not what this contract assumes |
| 1 | ckpt 0 | none | `18 FAIL`, exit **1**, fail set identical to the 18 enumerated in kickoff §3.1 | `npm run build-storybook` then `npm run screenshots:assert -- --mantine-only`; `.screenshots/task749-evidence/B1-before-mantineonly.log` + the run's `manifest.json` path | set diff against §3.1. **Any** added or removed cell -> stop and report; the tree is not the tree this kickoff measured |
| 2 | ckpt 1 | `AdminUsersTable.tsx` | `styles={{ tab: { whiteSpace: 'normal', minWidth: 0 } }}` present | `git diff` | — |
| 3 | ckpt 2 | `MantineCountButton.tsx` + its smoke test | new `iconOnlyAbove` prop; `npm run test` exit 0 with the 3 new cases | `vitest run` -> `E1-vitest.log` | a red suite blocks ckpt 4; do not proceed with a failing unit gate |
| 4 | ckpt 3 | `HeroSearchView.tsx`, `HeroSearchView.module.css` | `iconOnlyAbove={640}`; `.filtersControl` base `flex-basis:100%` + `min-height: var(--space-11)`, reset at `40rem` | `git diff` | a raw `44px`/`2.75rem` literal -> `check:design-tokens` non-zero at ckpt 8 |
| 5 | ckpt 4 | `NotificationCenter.tsx` | both `notification-compact:` sites read `sm:` | `grep -rn "notification-compact" src/` = **1** match (`globals.css:32` only; pre-fix the census is **3** lines) | more than 1 -> a site was missed |
| 6 | ckpt 5 | `src/app/globals.css` (removal only) | `grep -rn "notification-compact" src/` = **0** matches | same grep -> `E2-token-census.log` | non-zero -> the deletion outran its consumers; restore and redo in order |
| 7 | ckpt 6 | none | `0 FAIL`, exit **0**, stdout `1182/1204 PASS, 0 FAIL`, `22 AMBIGUOUS` | `npm run build-storybook` then `npm run screenshots:assert -- --mantine-only`; `A1-after-mantineonly.log` + manifest | fail-set diff vs §3.1 must read `18 removed / 0 added`; the ambiguous set diffed separately must read `0 added / 0 removed` |
| 8 | ckpt 7 | none | every gate in kickoff §11 exits 0, **including the three critical-flow commands** (registry rows 33/45/50) | each command's own transcript under `.screenshots/task749-evidence/` | any non-zero exit -> `PARTIALLY IMPLEMENTED` at best |
| 9 | ckpt 8 | plant files, temporarily | six arms produce the §9 observables | `P1a…P3b-*.log` + `git hash-object` before/after each | an arm that does not produce its stated observable invalidates the fix it was meant to prove |
| 10 | ckpt 9 | none | plants gone | `git status --porcelain` free of plant paths; each plant file's `git hash-object` equals its pre-plant value | mismatch -> a plant leaked into the final tree |
| 11 | ckpt 10 | `docs/backlog.md`, new session log | records written | read-after-write | — |
| 12 | ckpt 11 | none | `npm run build` exit **0** | `F1-build.log` | non-zero -> `PARTIALLY IMPLEMENTED` / `BLOCKED`, never `IMPLEMENTED` |

**Formula, not a fixed number, for the token census (ckpt 5/6):** `grep -rn "notification-compact" src/ | wc -l`.
Expected **3** before ckpt 5, **1** after it (`globals.css:32`) and 0 after ckpt 6. A **valid zero** at ckpt 6 is the success
state and must not be treated as a missing artifact. `scripts/__tests__/css-var-resolvability.test.ts` is outside
`src/` by construction, so it never enters this census — that is deliberate, and it is why the census is scoped to
`src/` rather than the repo root.

**Task-created files and the baselines they could pollute:** `.screenshots/task749-evidence/**` and the new
`docs/sessions/` log are created **after** ckpt 1's baseline and **after** ckpt 0's `git status` reading. The
`.screenshots/rendered-assert/<timestamp>/` directories the gate itself writes are produced by the gate, not by the
executor, and are ignored by `.gitignore` — confirm that before ckpt 10 rather than assuming it.

## 3. Required counterexample trace

| Contract claim | Counterexample | Executed or analytical evidence | Required outcome | Result |
|---|---|---|---|---|
| Active route and final write set | Executor concludes the cleanest fix is a `MANTINE_PATTERN_KNOWN_FAILURES` entry or a widened `isChipSetMember` | `ANALYTICAL` — kickoff §4 lists `check-stories-rendered.mjs` as zero-diff; AC10 reads `git status --porcelain` | **blocked**, not a second route | contract holds |
| Active route and final write set | Executor makes the collapsed button drop its `.mantine-Button-label` so the gate skips it | `ANALYTICAL` — `Button.mjs:128` renders the span unconditionally, so this needs a wrapper hack; kickoff §3.2(a) forbids it by name, 724 corollary ② forbids the class of move | **blocked** | contract holds |
| Stateful baseline / manifest | ckpt 1 run produces a fail set that is not the 18 | `EXECUTED` at design time — two independent runs already compared `0 added / 0 removed` (`docs/reviews/artifacts/2026-08-14-task741-review/screenshots-assert-mantineonly-failset-diff.txt`) and a third on 2026-08-15 (`2026-08-15T05-29/manifest.json`, `summary.failed = 18`) | distinct, fail-closed: stop, do not absorb | contract holds |
| Stateful baseline / manifest | valid empty state: after the fix the fail list is **absent**, not empty | `ANALYTICAL` — `check-stories-rendered.mjs:1996` only enters the failure branch when `failed > 0`; the zero branch at `:2065-2073` prints `All hard assertions PASSED` and leaves `exitCode` unset | a missing `Failed cells:` block is **success**, not a missing artifact | contract holds |
| Status or diff assertion | a `.screenshots/rendered-assert/` run directory shows up as an unexpected new path | `EXECUTED` — `.gitignore` inspected; re-confirm at ckpt 10 | comparator distinguishes ignored gate output from an unauthorized write | contract holds |
| New gate | none — this task adds no gate | `ANALYTICAL` — the row is `NOT APPLICABLE`; the six §9 plants are fix-proofs, not gate-proofs, and P2b deliberately shows the gate **cannot** see the label requirement | the label/44px requirement is controlled by the AC4 DOM probe, and the report must say so | contract holds |
| Task-created artifact | `.screenshots/task749-evidence/` created before ckpt 1 and swept into a census | `ANALYTICAL` — ckpt ordering places it after ckpt 1; the token census is scoped to `src/` and cannot reach it | count/scope difference detected | contract holds |

## 4. Publication and review gate

Route, write set and checkpoint matrix were rebuilt from the final kickoff text on 2026-08-15, not from drafting
notes. The task author does not approve this work: Sonnet's strongest valid status is
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.
