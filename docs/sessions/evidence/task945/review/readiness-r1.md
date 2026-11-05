# Task 945 — readiness record of revision 1 (the review session, 2026-11-05)

Native Windows 11, Node v22.22.3, cwd `C:/Claude_Code_Projects/lero-al`, branch `task/935-governance-approval-route`, base of the route commit `0c1e09eb1`. Applies `.claude/rules/shared/task-readiness.md`. This session wrote this revision and may neither implement nor approve it (D1, D2).

## 1. Affected-path manifest

| Changed symbol | Callers and tests | Disposition |
|---|---|---|
| `added`, refuse rules (`code-check.mjs`) | `runStage`, `change-review.mjs`, `code-check.selftest.mjs`, `change-review.selftest.mjs` | change: R10, R11 |
| `changedFiles` (`change-review.mjs`) | `reviewChange`, `change-review.selftest.mjs` | change: R12 (c), R13 |
| `publishedTimes`, `checkDependencies` (`dependency-check.mjs`) | the registry's package row, `change-review.mjs`, `dependency-check.selftest.mjs:72-76` | change: R12 (a), R18 |
| `planOf`, `runMutation`, `reportLines` (`mutation-check.mjs`) | `code-check.mjs`, `change-review.mjs`, `mutation-check.selftest.mjs` | change: R12 (b), R15, R16 |
| `reportsFile`, `namesFile` entries | `runStage`, the two real gates, `code-check.selftest.mjs` | change: R14 |
| Stop and SubagentStop paths | `runCodeCheck`, the IMPACT case | change: R16; the IMPACT case keeps its meaning at `Stop` |
| `isPolicyPath`, `isDoc` (`contract.mjs`) | `security-hook.mjs`, `cli.mjs`, every contract check | change: R19, seven paths; whole suite green in memory with all of them (`r20-paths.txt:10`), the sidecar validates (`p03`:2); four of the five rebased contracts hold `contract.mjs` and no other reviewed one (`r12`); a changed path of R19 other than `AGENTS.md` is held by a reviewed governance contract (`r20-paths.txt:2,4`) |
| `hook-differential.mjs` main | `code-check.json`, no test | unchanged code, a test added: R17 |
| `secure-code-review.md` sections 3 and 4 | all roles; no contract's rule input (`r08`: `ruleHits` empty) | change: R18; 7385 bytes today, at most 8192 after it (AC18) |

Which contracts stale is measured, not read: `stale-measure.mjs`, `r08-stale.txt`.

## 2. Write authority

Every write of the route is a policy path, an evidence path or the sidecar, all for an Opus governance implementer (C45, C46). `AGENTS.md` cannot enter the sidecar's scope before `contract.mjs` holds it: executed, `p03-agents-policy-path.txt:1-2`. So R19 changes both in one save, and the saved scope omits it until then, which section 4 says.

## 3. Commands

| Actor, phase | Command | Input state | Effect | Expected |
|---|---|---|---|---|
| Owner, step 1 | the commit of the final handoff | this revision uncommitted | one commit, no push | `git status --short scripts .claude` prints nothing |
| Implementer, step 2 | `node scripts/workflow-gates/selftests.mjs` | before the first write | none | saved to `impl/base-runs-r10.txt`; 288 of 288 at this base (this review) |
| Implementer, step 3 | `cli.mjs sensitivity` on 8 cases, `governance-report`, `verify`, `change-review.mjs` | stage `implemented` | evidence files | as AC9, AC11 to AC20 |
| Approver, step 4 | `stale-measure.mjs` with the approved commit; the AC10 harness | after the rebases | none | lists of R9; `reviewedFreshnessErrors` `[]` |
| Approver, step 4 | `gh run view`, the `static` artifact | first CI run of the approved commit | none | AC21 |

The tests R10 to R20 name do not exist yet, by design; their runner and fixtures do: `change-review.selftest.mjs`, `dependency-check.selftest.mjs`, `mutation-check.selftest.mjs`, `code-check.selftest.mjs`, all green at this base.

## 4. The proposed proof, challenged

Each correction was executed before it was written down. `p01` holds the allowlist on every real name, the whole-diff read, `-z`, the grep and the finding forms. `p02` found its own first defect, an untracked file left lost, and the union fixed it. `p01` section E on history gave 30 of 104 still named, which changed R13 from a refusal to a note. `p03` found that `AGENTS.md` cannot wait in the scope, which changed the route. Critical cases get saved break specs, in memory (`cli.mjs sensitivity`), under section 4 of the readiness rule; a check by a break that survived now has a test (AC17).

Not proven here, and stated as such in the route: R16 (d), (e), (f) and the real hook's behaviour on Linux. They get tests in the route and AC21. R16 (f) was added by the self-audit from a run of the defect (`r24-mutation-last.txt:4`), with no prototype of the correction.

## 5. Other kickoffs this session changed

Under D14, this review session also changed three other open kickoffs. Each passed its own gates in `r22-rerun-after-corrections.txt`.

| Kickoff | Change | Proof before the text | Affected paths |
|---|---|---|---|
| Task 942, revision 6 | R15, AC12, one critical case, four scope paths | `p04-census-limit-prototype.txt`: as committed exit 1; corrected, exit 0 with limit 300; 301 and 2000 refused; 5000 with no candidate pass; all 12 arms pass; tree unchanged | `runPipeline`: its main, `--verify-gate` and no other caller (`scripts/check-surface-census-changed.mjs:466,592,759`); the mapper unchanged; no contract's scope holds either (`r19-measure.txt:14`). `--update-baseline` keeps the mapper's own limit, an operator's path that CI does not run |
| Task 931 | C25 to `cli.mjs:20-20`; R14 and AC9 name the unhandled error (C57, C58) | `r17:5-10`; `r21-hydration-alone.txt`: alone, no error in 3 of 3 | The hydration test, already in its scope (`r21:4`) |
| Task 937 | A note of two more failed commands; C36 moved by the lines added to the Task 931 kickoff | `r14:13-19` | None; its route is unchanged |

Not proven here: that the test-only fix of Task 931 R14 ends the error under the full suite. CI decides, through AC9.

## 6. Bindings

Written after the last save of the kickoff and the sidecar: see `r22-rerun-after-corrections.txt`, which holds each digest and each gate's result.
