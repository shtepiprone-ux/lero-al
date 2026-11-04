# Task 942 — design and readiness record (Opus designer, 2026-11-01)

Platform: native Windows 11, Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`, branch `task/935-governance-approval-route`,
design HEAD `ad6e1b08e` (`p00-head.txt`); the owner's later commit `01b8259fa` (Task 940 approval) changes none of the cited
files. This designer session may neither implement nor approve 942 (D1, D2).

| Step | Source / command / artifact | Observation | Result |
|---|---|---|---|
| C1 assignment | owner D7, D8; the red Governance Check job of PR #12; `docs/backlog.md` registry (941 taken by a parallel session at D10) | the policy half of the Governance Check job, numbered 942 | PASS |
| C2 reproduction | CI excerpt `task937/design/l00-ci-excerpts.txt:20-30`; local `node scripts/check-listing-visibility.mjs` → `p01-gate-local.txt` | three issues: two stale entries, one inline literal at `contactEvents.ts:58`; exit 1 | PASS (EXECUTED) |
| C2 cause | `sources/` snapshots of `contactEvents.ts:52,58`, the detail page `:47,165`, `visibility.ts:127`, the Task 923 R66 row; `p05-detail-page-expiry.txt` | Task 923 R66 (f) made the lookup status-only; the detail page reads statuses through a constant and applies no expiry filter, so `applyPublicVisibility` would refuse cards the page shows | PASS (EXECUTED) |
| C3 design | kickoff R1–R3 | allowlist fingerprint + stale entry removal; exported pure stale check; guarded main (idiom of `publication.mjs:71`) | PASS |
| C3 feasibility | `p02-planned-allowlist-probe.mjs` on a temporary copy of the HEAD gate with exactly the planned allowlist | strict run exit 0, `Allowlist: 8 entries, 0 stale.`; `--verify-gate` 34/0; the literal is still reported in another file | PASS (EXECUTED) |
| C4 proof | sidecar 4 GOV-942 cases; AC2 sensitivity break (path-blind allowlist) | hook and CI layers, allow/deny/error; the break makes GOV-942-CI-PATH-DENY fail | PASS (ANALYTICAL) |
| C5 mobile record | `node scripts/check-mobile-adaptation-contract.mjs --files <kickoff>` | PASS (`Scope: none`) | PASS (EXECUTED) |
| C6 authority | `p03-authority-probe.mjs` (real `evaluateHook`, real `validateDiff`, fixture roots) | Sonnet edit refused, Opus allowed; CI refuses the changed gate outside every governance scope | PASS (EXECUTED) |
| C6 reviewed contracts | `p06-contract-scope-grep.txt` (HEAD and working tree) | no task contract and no publication-manifest entry names the gate script; no rebase due; `publication.json` deliberately unchanged | PASS (EXECUTED) |
| C6 timing | route step 2 | starts only when `git status --short scripts` is empty, so 941 and 942 implementations never share a working tree | PASS |
| C7 evidence | `node scripts/check-kickoff-evidence.mjs --files <kickoff>` | PASS (after re-creating two `sources/` snapshots that had disappeared from disk between 17:36 and 17:39; re-created from HEAD by `p04-snapshot-sources.mjs`, byte sizes as first written) | PASS (EXECUTED) |
| C7 plan | `node scripts/workflow-gates/cli.mjs plan --contract <sidecar>` | exit 0; kickoff digest 1dc481d48969afa1a10a5744c206ecaf68154868ddc1f9d01639c9fb98fe93c0 | PASS (EXECUTED) |
| C7 publication | `node scripts/workflow-gates/publication.mjs --base HEAD` | `0 dependency errors` | PASS (EXECUTED) |

## Revision 2 (Opus, Task 944 review 3 session 343df3cf, 2026-11-04, owner D20)

Platform: native Windows 11, Git Bash, Node v22.22.3, cwd `C:/Claude_Code_Projects/lero-al`, HEAD `22c6871a3`. This session neither
implements nor approves 942.

| Step | Source / command / artifact | Observation | Result |
|---|---|---|---|
| 1 manifest | `p08-hook-scope-contracts.txt`; the hook-importing self-tests found by `p07-shell-forms-run.mjs` | five contracts scope the hook and get an R5 rebase; nine self-tests import it and stay unchanged; `publication.json` unchanged | PASS (EXECUTED) |
| 2 write authority | `isPolicyPath` (C25), route step 3 | the hook and the new self-test are policy paths; Opus implementer only (D1); the Task 944 guard checks each hook Edit | PASS (ANALYTICAL) |
| 3 commands | `cli.mjs sensitivity` read in the 944 review; AC6 corpus input `test-results/task943-prototype/corpus.json` present and gitignored | the corpus exists on this machine only, so AC6 runs on native Windows here; a missing corpus is `BLOCKED`, not skipped | PASS (EXECUTED) |
| 4 proof | `node docs/sessions/evidence/task942/design/p07-shell-forms-run.mjs` → `p07-shell-forms-run.txt` | 29 forms reported and refused for the executor, 20 controls quiet, nine self-tests pass, corpus dropped 0, guarded 0, refused 0, scope 0; 1922 ms and 7416 ms; `FAILURES 0` | PASS (EXECUTED) |
| 5 saved contract | `check-kickoff-evidence.mjs --files <kickoff>`; `check-mobile-adaptation-contract.mjs --files <kickoff>`; `p09-readiness.mjs` in memory; `cli.mjs plan --contract <sidecar>` on the saved ready sidecar | PASS; PASS; `[]`; exit 0; kickoff digest `397df2e3ae6970de8947101124d231764304116b52b1375a0699292a12633a5a` | PASS (EXECUTED) |
