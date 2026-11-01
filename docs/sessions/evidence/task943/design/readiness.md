# Task 943 design and readiness record (Opus designer, 2026-11-01)

Platform: native Windows 11, PowerShell 5.1, Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`, branch
`task/935-governance-approval-route`, HEAD `01b8259fa` at design start (`p00-head.txt`), `18b7d762f` at publication. Same designer
session as Task 941; it may neither implement nor approve 943 (D1, D2).

| Step | Source / command / artifact | Observation | Result |
|---|---|---|---|
| C1 assignment | Owner D11; Sprint 92 plan; `docs/backlog.md` | Number 942 was taken by a parallel design session (listing visibility allowlist, evidence folder `task942` started 17:23); this design moved its files to `task943` without touching that session's files | PASS |
| C2 reproduction | `node docs/sessions/evidence/task943/design/p01-undetected-writes-probe.mjs` (EXECUTED, exit 0) | Twenty mutating forms report no target; independence check returns `[]` for all; `Set-Content` control detected | PASS |
| C2 guard | `node docs/sessions/evidence/task943/design/p02-pretool-probe.mjs` (EXECUTED, exit 0) | Executor `cp`, `sed -i`, `Copy-Item` into policy/product files allowed; `Set-Content` control refused | PASS |
| C2 other hooks | Grep of `.claude/hooks` | Only `block-mutating-git.ps1` covers Git; no other hook parses `cp`/`Copy-Item`/`tee`/`sed -i` | PASS |
| C2 manifest | Grep of `shellWriteTargets` consumers and of mutating commands in `*.selftest.mjs` hook inputs | Consumers `security-hook.mjs:128`, `:244`; no existing test feeds a mutating program to the hook | PASS |
| C2 941 interaction | 941 kickoff R2, AC3; 941 sidecar | 943 R1 keeps 941 results as a subset and the unparseable-command equality of GOV-941-HOOK-MALFORMED-ERROR; 941 tests must pass unchanged | PASS |
| C4 baseline | `node scripts/workflow-gates/selftests.mjs` (EXECUTED, exit 0) | `# pass 173`, 0 fail, 0 skipped (`p04-selftests-base.txt`) | PASS |
| C4 CI case | `node docs/sessions/evidence/task943/design/p03-ci-delete-probe.mjs` (EXECUTED, exit 0) | Deleted hook file refused outside every governance scope | PASS |
| C4 sensitivity | AC2 (drop `tee`), AC3 (drop `Copy-Item`) | Each break removes one table row, so its case assertion fails; temporary edit of an in-scope file by the implementer | PASS (ANALYTICAL) |
| C6 challenge | Directory expansion on `rm -rf .next` / `node_modules` | Unbounded walk would cost every hook call; kickoff section 5 now excludes `node_modules/` and `.next/` and keeps `.git` literal for the Git-metadata refusal | PASS after revision |
| C6 authority | In-memory `validateContract({...c, executionStatus:'ready'}, {phase:'plan'})` | `[]` | PASS |
| C6 timing | Route step 2 | 943 writes start only after 941 is reviewed and committed; the 943 approver rebases 935, 940, 941 (acyclic) | PASS |
| C7 checks | `check-kickoff-evidence --files` (943); `cli.mjs plan` (943, Sprint 92); `check:backlog-active`; `check-workflow.mjs`; `publication.mjs --base HEAD` | See the final session run before the owner handoff | PASS |

Undetectable by command text and out of scope: scripts run from files, `perl -i`, editors, programs outside the section 5 table.
