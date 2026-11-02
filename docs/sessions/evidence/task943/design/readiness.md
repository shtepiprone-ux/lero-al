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

## Revision 1 (Opus, 2026-11-02, native Windows, Node v22.22.3, HEAD 2693c6b9a; owner D12, D13)

| Step | Source / command / artifact | Observation | Result |
|---|---|---|---|
| C1 assignment | owner D12 (extend D9, in 943, before 931), D13 (no new task) | holes from `docs/sessions/evidence/task931/design/revision-3-inventory.md` class D and F | PASS |
| C2 need | `d08-rev3-contract-impact.txt` (931 design) | 19 case tests of reviewed contracts change in 931 revision 3; `scopeEntryErrors` refuses them (`contract.mjs:158`) | PASS (EXECUTED) |
| C2 CI rerun | `cli.mjs:283` | the diff check reruns the mapped cases of every touched product contract, so a tests entry needs no new runner | PASS (ANALYTICAL) |
| C2 935 N1 | `security-hook.mjs:135-137` | exemption already requires an evidence path and a valid rules entry (Task 940 R5): closed, no requirement | PASS |
| C2 940 N3 | `cli.mjs:31-35` | `allContracts` walks the disk, untracked contracts included → R8 (tracked at HEAD) | PASS |
| C2 935 N4 | `check-workflow.mjs:99-104`; `.claude/rules/README.md` | the 8 KiB limit binds phase files, skills and five named shared files; no rule binds other shared contracts: no defect | PASS (disposition) |
| C3 rule size | `wc -c .claude/rules/review/03-decision-closure.md` = 7879 | R9 text does not fit; rebase paragraphs move to new sibling `04-contract-rebases.md` (README size rule) | PASS (EXECUTED) |
| C6 authority | `p05-rev1-ready-candidate.mjs` | every scope file is a governance scope path; in-memory ready plan errors `[]` after the task hash update | PASS (EXECUTED) |
| C6 rebases | contract scan (session) | 935 and 940 scope `contract.mjs`, `publication.json`, `03-decision-closure.md`, the hook; 941 the hook and `publication.json` → R6 lists | PASS (EXECUTED) |
| C7 checks | `check-kickoff-evidence --files <943>` PASS; `check-mobile-adaptation-contract --files <943>` PASS; `cli.mjs plan` 943 exit 0, 941 exit 0 | ready | PASS (EXECUTED) |

### Revision 1 self-audit correction (same day)

| Step | Source / command / artifact | Observation | Result |
|---|---|---|---|
| R8 feasibility | `scope-rebase.selftest.mjs:33`, `:274` | GOV-940-HOOK-EXEMPT-ALLOW builds its root with `mkdtempSync(join(tmpdir(), prefix))`, no `.git`; the first R8 wording ("outside a Git work tree nothing is exempt") would fail this reviewed case and contradicted AC9 ("pass unchanged"). Sidecar set back to `draft` | FAIL → fixed |
| R8 mechanism | `p06-git-worktree-probe.mjs` / `.txt` (EXECUTED, exit 0) | tracked: exit 0; untracked: exit 128 `exists on disk, but not in 'HEAD'`; plain temp folder: `not a git repository`; missing binary and empty `PATH`: ENOENT | PASS (EXECUTED) |
| R8 revised | kickoff R8, AC9, case GOV-943-EXEMPT-UNTRACKED-DENY | the tracked check applies only when `<root>/.git` exists; non-zero exit or spawn error exempts nothing; no `.git` keeps today's behaviour (fixtures; the project root always has `.git`) | PASS |
| R4 / section 6 | kickoff text | said the consumers' code is unchanged, contradicting R8; both now name the R8 exemption-loop change | PASS after revision |
| Counts | kickoff step 5, section 8, section 9 | "R1–R6" → "R1–R10"; "both" sensitivity diffs → four | PASS after revision |
| Objective wording | kickoff section 2 | "the 19 case tests" understated the scope (19 among the first 39 files; 82 files in `d09`); reworded | PASS after revision |
| 940 N1 | `review-940.md:76-79` | the base anchor is skipped for a review rewritten in the diff; a rewritten review is a forged approval in any case, which no gate can detect without a signature: the defences are the D2 hook for approving sessions and owner-only commits. Residual, reported to the owner; no 943 requirement | PASS (disposition) |
| 940 N2 | `review-940.md:80-81`; `contract.mjs:65-67` | runtime files stay non-rebasable (D9, D12 covers case tests only). Constraint for 931 revision 3: it must not change `package.json`, `package-lock.json`, `tsconfig.json`, `.nvmrc`, `src/tests/setup.ts`, `src/tests/integration/setup.ts` or a root runtime config, or every reviewed contract goes stale for good | PASS (constraint recorded in `task931/design/revision-3-inventory.md`) |
| C6 authority | `p07-task-digest.mjs` → taskSha256 `6364bdbf…a803`; `p05-rev1-ready-candidate.mjs` | saved `ready`; plan errors `[]`; exit 0 | PASS (EXECUTED) |
| C7 checks | `check-kickoff-evidence --files <943>` PASS; `check-mobile-adaptation-contract --files <943>` PASS; `cli.mjs plan` 943 exit 0, 941 exit 0 | ready | PASS (EXECUTED) |

### Revision 1 second self-audit (same day, owner: "check your work again")

| Step | Source / command / artifact | Observation | Result |
|---|---|---|---|
| 5b testName check | `p08-testname-literal-probe.mjs` / `.txt` (EXECUTED, exit 0) | the static "testName text after `[<id>] `" check was infeasible: 923 D8/D9 186 of 231 misses, 931 17 of 17 (describe titles in the full name; escaped quotes in source); `[<id>]` present in every file | FAIL → fixed: static check keeps `[<id>]`; the exact name is bound by `runMappedTests` (`cli.mjs:240`) on the CI rerun and by the approver's `cli.mjs verify` after the entry |
| CI anchor for `tests` | `cli.mjs:83` | `diffRebaseErrors` reads only `rules`/`scope` lists; a `tests` entry would have listed nothing and failed the anchor check, and `cli.mjs` was not in scope | FAIL → fixed: `cli.mjs` in scope, R7 extends `diffRebaseErrors` with `testsRebaseFiles`, AC8 and the ALLOW/DENY cases cover it, R6 adds `cli.mjs` to the 935/940 rebases (both scope it, line 14) |
| Hook branch | `security-hook.mjs:213-226` | the independence check runs only for `governance` receipts, so product approvers (931, 937) writing rebase entries are not refused | PASS |
| Rule expansion | `contract.mjs:52-63` | `workflowRuleInputs` expands only `workflow-gates.md` companions; new `04-contract-rebases.md` binds no contract | PASS |
| Integration identity | `cli.mjs:196-203` | `cli.mjs verify` of a contract with integration cases needs `SECURITY_TEST_TARGET`, `SECURITY_TEST_PROJECT_REF`, `NEXT_PUBLIC_SUPABASE_URL`; stated in 5b | PASS after revision |
| C6/C7 | `p07-task-digest.mjs`, `p05`, `check-kickoff-evidence`, `check-mobile-adaptation-contract`, `cli.mjs plan` | ready, plan errors `[]`, all exit 0 | PASS (EXECUTED) |

### Revision 1 third self-audit (same day, owner: "check your work again")

| Step | Source / command / artifact | Observation | Result |
|---|---|---|---|
| Mapped cases of reviewed contracts | `task931/design/d11-verify-mapped-cases.txt` (EXECUTED, development project) | 923 D8/D9 430+86 passed, exit 0; 923 owner fixes 1142+6 and 927 86+4 passed but `BLOCKED: Security report scope hash is stale` | FAIL (found) |
| Freshness census | `task931/design/d12-reviewed-digest-freshness.txt` | of 6 reviewed contracts, 923 owner fixes and 927 are stale with no rebase entry | FAIL (found) |
| Cause | `task931/design/d13-stale-cause.txt` | six shared rule files changed by `23206fb7f` and `94288edbb` (PR #12 branch only); the 935 approver rebased only 923 D8/D9 | root cause: missed rebase in the 935 review; no gate checks reviewed contracts outside the diff |
| Fix feasibility | `task931/design/d14-rules-rebase-feasibility.txt` | digest with base rule bytes = recorded review digest for both (`MATCH true`); 935 is reviewed and scopes all six | PASS (EXECUTED) |
| Fix | kickoff R6 (two `rules` entries by 935), new R11 `reviewedFreshnessErrors` in the CI `diff` command, AC7, AC12, case GOV-943-CI-STALE-REVIEW-DENY (critical) | `validateDiff` unchanged; only CI runs `diff` (`governance-pr.yml:191`), no self-test calls it | PASS after revision |
| C6/C7 | digest `8577ff84…4116`; `p05` ready, plan errors `[]`; `check-kickoff-evidence`, `check-mobile-adaptation-contract`, `cli.mjs plan` 943 and 941 | all exit 0 | PASS (EXECUTED) |

Order: 941 → 943 → Task 931 revision 3 (Sonnet; its case-test rebases need R7) → Task 937 (its R12 rebases 931 and 935).

## Fourth self-audit (Opus, 2026-11-02, while writing Task 931 revision 3)

| Check | Source / command | Observation | Result |
|---|---|---|---|
| Deleted reviewed contract | `scripts/workflow-gates/cli.mjs:31-37` (`allContracts`), `validateDiff` selection | a contract deleted by a diff is in no list, so nothing validates it: deleting a stale reviewed contract would bypass its rebase | FAIL (found) |
| Fix | kickoff R11: `reviewedFreshnessErrors(root, selected, { files, readBase })` also returns `reviewed contract removed: <path>` for a deleted contract that is `reviewed` at the base, unless a reviewed contract of the same file name exists at head under `tasks/`; claim C59; AC12 and GOV-943-CI-STALE-REVIEW-DENY gain the deleted, moved and replaced controls | the planned retirement of the archived Task 931 pair (revision 3 R13) passes, a plain deletion fails | PASS after revision |
| C6/C7 | digest `a22a264f…23f5`; `check-kickoff-evidence`, `check-mobile-adaptation-contract`, `cli.mjs plan` 943 and 941 | all exit 0 | PASS (EXECUTED) |
