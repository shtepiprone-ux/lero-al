# Task 940 — design and readiness record (Opus, 2026-11-01)

Platform: native Windows 11, Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`, branch `task/935-governance-approval-route`
at `c2f918a59` (`p00-head.txt`).

| Step | Source / command / artifact | Observation | Result |
|---|---|---|---|
| C1 assignment | owner AskUserQuestion 2026-11-01 (D7, D8, D9) | publication in PR #12; one task per red check; audited rebase governance task | PASS |
| C2 reproduction | `p01-923-scope-probe.mjs` output `p01-923-scope-probe.txt` (canonical `scopeDigest` with in-memory overrides) | editing the three auth test files changes the 923 D8/D9 digest; the cron test does not | PASS (EXECUTED) |
| C2 dependency | `sources/scripts__workflow-gates__cli.mjs.txt:93-95`, `sources/scripts__workflow-gates__release-blockers.json.txt:4` | the 923 contract is selected in every diff through resolved S59-S62 | PASS (ANALYTICAL) |
| C2 dependency | `p02-935-scope-probe.txt` | editing contract.mjs, cli.mjs, security-hook.mjs or the review rule stales the reviewed 935 contract, which is in the PR #12 diff | PASS (EXECUTED) |
| C3 design | kickoff R1-R7 | ordered `review.rebases` chain, legacy `rulesRebase` kept as implicit first entry; scope kind limited to the rebased scope minus its case tests, owned by a later reviewed contract; runtime files excluded (D9 wording) | PASS |
| C4 proof | `p03-selftests-base.txt` | 164 pass, 0 fail, 0 skipped before the task | PASS (EXECUTED) |
| C4 proof | `sources/scripts__workflow-gates__governance-contract.selftest.mjs.txt:248-295` | the GOV-935 rebase tests assert the messages R4 (f) preserves; the file stays unchanged (AC4) | PASS (ANALYTICAL) |
| C6 authority | canonical `isPolicyPath` / `isGovernanceScopePath` on every scope path | all 13 scope paths are governance scope; 6 are policy paths; implementer Opus (D1) | PASS (EXECUTED) |
| C6 counterexample | `sources/scripts__workflow-gates__publication.json.txt:58` | the publication manifest lists each self-test, so the new file must be added: `publication.json` added to scope (C31) and it is in the 935 scope (C32) | PASS after correction |
| C6 counterexample | `scripts/workflow-gates/cli.mjs:318` | importing cli.mjs does not run the CLI, so the AC7 scoped harness is feasible without the CI database secrets | PASS (ANALYTICAL) |
| C6 counterexample | R4 (e) | a contract absent at the diff base (935, new in PR #12) cannot be anchored to a base digest; limitation recorded, by-contract check still applies | PASS (recorded limitation) |
| C6 evidence gate | `node scripts/check-kickoff-evidence.mjs --files <kickoff>` | PASS | PASS (EXECUTED) |
| C6 ready candidate | canonical `validateContract({...sidecar, executionStatus:'ready'}, {phase:'plan'})` in memory | no errors | PASS (EXECUTED) |
| C7 publication | `node scripts/workflow-gates/cli.mjs plan --contract <sidecar>` after saving `ready`; `cli.mjs diff --phase plan --working-tree`; `publication.mjs --base HEAD` | plan exit 0; diff-plan exit 0 (5 task contracts); publication 0 dependency errors; final digests: kickoff 7f9a50db1d82a73e74a788c9e004bc8f198a9dbc781e61401bb1dfd965ee1a6a, sidecar file c534a915b068712d861045da9fca4a31b3248067e1c2fc705d64340608466dc8 | PASS (EXECUTED) |
