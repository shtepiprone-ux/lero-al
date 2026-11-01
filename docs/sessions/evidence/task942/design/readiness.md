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
