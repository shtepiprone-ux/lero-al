# Task 945 revision 2 — readiness record

Under `.claude/rules/shared/task-readiness.md`, by the review session of commit `51109a901`. Each row is `step | source | observation | result`. EXECUTED means a probe ran; ANALYTICAL means reading.

| Step | Source | Observation | Result |
|---|---|---|---|
| 1. Manifest | `mutation-check.mjs` (`treeGuard`, `attempt`, `runMutation`), `mutation-loader.mjs`; consumers `code-check.mjs` (`mutated`), `change-review.mjs`, the main of `mutation-check.mjs`, `mutation-vitest.config.mjs`; tests `mutation-check.selftest.mjs` | A guard change reaches both callers with no change of theirs, since `runMutation` keeps its result shape. The test of the staged rename and the nested repository changes: `git` is no Node process. ANALYTICAL | PASS |
| 1. Old versus new | Not `security-hook.mjs` and no shared gate logic: the registry of commands is unchanged | No differential applies; the suite and the mutation self-tests do. ANALYTICAL | Justified N/A |
| 1. Stale contracts | `a-reviewed-scope.txt`, C152 | No reviewed contract holds `selftests.mjs` or a mutation file; R9's measure still decides at approval. EXECUTED | PASS |
| 2. Write authority | `isPolicyPath`, `.claude/rules/shared/role-boundaries.md:13` | Every write is a policy path, so the route names an Opus implementer in a fresh session (D1). The sidecar's scope holds each. ANALYTICAL; `cli.mjs plan` exit 0 EXECUTED | PASS |
| 3. Commands | `a-plan-r2.txt`, `a-kickoff-evidence-r2.txt`, `a-check-workflow-r2.txt`, `a-publication-r2.txt` | exit 0 each on the saved files. EXECUTED | PASS |
| 3. Timing | Route step 1 | The commit of this revision comes first; the mutation runs of step 3 need no other writer until R21 lands, which the route says. ANALYTICAL | PASS |
| 4. Allow | `p05-attribution.txt:1-3`, `p05-compat.txt` | The recording preload records all forms, a spawned script and a Vitest worker; the suite passes 310 of 310 and 966 Vitest tests pass under it. EXECUTED | PASS |
| 4. Deny | `p05-attribution.txt:4` | Another writer is not on the record. EXECUTED | PASS |
| 4. What it gives up | `p05-attribution.txt:5` | A program that is no Node process leaves no record, so its write is named and left. Stated in section 3. EXECUTED | PASS |
| 4. Forbidden effect | `a-probes.txt:19,22` | The defect is reproduced on the real main, so AC22 can fail before R21. EXECUTED | PASS |
| 4. Sensitivity | New break spec by the implementer, in memory, target `mutation-check.mjs` | The code to break is not written yet, so its `find` text is the implementer's; the route says to save it. The runner is the one of the eight cases I ran. ANALYTICAL | PASS |
| 4. R22 fixtures | `a-breaks.mjs`, `a-probes.mjs` section 2 | Each break is applied through the loader and each fixture ran. EXECUTED | PASS |
| 4. R23 | `p06-suite-reason.txt` | The preload reaches the branch of the real script at once. EXECUTED | PASS |
| 5. Saved contract | `a-plan-r2.txt`, `a-kickoff-evidence-r2.txt` | Run after the last edit of the kickoff, with the task digest rebound in the sidecar. EXECUTED | PASS |

Not proven by this record: the guard's change itself, which is not written; CI, which runs after approval.
