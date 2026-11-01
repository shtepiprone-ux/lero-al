# Task 941 design and readiness record (Opus designer, 2026-11-01)

Platform: native Windows 11, PowerShell 5.1, Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`, branch
`task/935-governance-approval-route`, HEAD `ad6e1b08e` (`p00-head.txt`). This designer session may neither implement nor
approve 941 (D1, D2); it is also not an eligible 940 approver, because the hook counts its first read-only `grep` as a write
of `scripts/workflow-gates/security-hook.mjs` (`p01-false-positive-probe.txt` line 2).

| Step | Source / command / artifact | Observation | Result |
|---|---|---|---|
| C1 assignment | Owner D10; Sprint 92 plan; `docs/backlog.md` registry | Next free number 941; governance task under D1/D2; Sprint 92 | PASS |
| C2 reproduction | `node docs/sessions/evidence/task941/design/p01-false-positive-probe.mjs` (EXECUTED, exit 0) | Four read-only commands reported as writes; independence refusal on the Task 940 approver's read-only command; writes detected | PASS |
| C2 manifest | Grep of `shellWriteTargets` over `scripts`, `.claude`, `.github` | Consumers only `security-hook.mjs:128` and `:244`; no other module imports it | PASS |
| C2 tests | Grep of shell commands in `*.selftest.mjs` | `diff-hook.selftest.mjs:160-161,352` expect `[]` for reads (consistent); `:162,164,341-349` and `governance-contract.selftest.mjs:193` use non-read-only commands (unchanged under R2) | PASS |
| C2 contracts | Grep of `tasks/**/*.security.json` for the hook and publication manifest | Only the 935 and 940 contracts scope them; case test files of 935 are untouched by 941 | PASS |
| C4 baseline | `node scripts/workflow-gates/selftests.mjs` (EXECUTED, exit 0) | `# pass 173`, 0 fail, 0 skipped (`p02-selftests-base.txt`) | PASS |
| C4 CI case | `node docs/sessions/evidence/task941/design/p03-ci-policy-probe.mjs` (EXECUTED, exit 0) | `outside every changed governance contract scope` on a fixture root | PASS |
| C4 sensitivity | AC2 break: classify only the first simple command | The chained `grep …; node -e …` variant then returns no target, so GOV-941-HOOK-WRITE-DENY fails; the break is a temporary edit of an in-scope file by the implementer | PASS (ANALYTICAL) |
| C6 authority | `isPolicyPath` / `isGovernanceScopePath`; in-memory `validateContract({...c, executionStatus:'ready'}, {phase:'plan'})` | Every scope path is a governance scope path; `[]` | PASS |
| C6 timing | Route step 2 | 941 writes start only after the 940 approval commit; the 941 approver rebases 935 and 940 after its own review (acyclic) | PASS |
| C6 concurrency | Sprint plan reread mid-design | A parallel session approved and archived 940 (uncommitted); C19, C20 and C31 re-cited to the archived 940 snapshot; the prerequisite now checks the commit | PASS |
| C7 evidence | `node scripts/check-kickoff-evidence.mjs --files tasks/Sprints/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.md` | `PASS — 1 changed active kickoff(s) verified` | PASS |
| C7 plan | `node scripts/workflow-gates/cli.mjs plan --contract` on the 941 sidecar and on the Sprint 92 sidecar | exit 0, exit 0 | PASS |
| C7 state | `npm run check:backlog-active`; `node scripts/workflow-gates/check-workflow.mjs`; `node scripts/workflow-gates/publication.mjs --base HEAD` | PASSED (after removing a closed-state marker another session added to line 45); passed; `0 dependency errors` | PASS |

Known limitation recorded, not in scope (owner scope D10): write programs without a write word (`cp`, `mv`, `tee`, `sed -i`)
are not detected today and stay undetected after 941; the PowerShell hooks under `.claude/hooks/` keep their own parsers.
