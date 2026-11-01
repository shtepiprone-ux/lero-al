# Task 937 — design and readiness record (Opus, 2026-11-01)

Platform: native Windows 11, Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`, branch `task/935-governance-approval-route`
at `ad6e1b08e` (PR #12 head on GitHub: `c2f918a59`).

| Step | Source / command / artifact | Observation | Result |
|---|---|---|---|
| C1 assignment | `docs/backlog-reserved.md` 937 row; owner D7, D8 (2026-11-01) | the red Governance Check job of PR #12 | PASS |
| C2 reproduction | CI run 41300859846, Governance Check job log → `l00-ci-excerpts.txt` | 46 of 51 static gates pass; failures: file integrity, mojibake, enrolled Tailwind, design tokens, listing visibility | PASS (EXECUTED) |
| C2 split | canonical `isPolicyPath` on `scripts/check-listing-visibility.mjs` | policy and governance scope path; its allowlist fix is governance Task 942 (Opus), not this product task | PASS (EXECUTED) |
| C3 design, design tokens | `p02-design-token-fix-probe.mjs` → `p02-design-token-fix-probe.txt` | the three planned texts clear every design-token finding of the three files; none left after | PASS (EXECUTED) |
| C3 design, mojibake | `p03-mojibake-repair-probe.mjs` → `p03-mojibake-repair-probe.txt` | only two CP1252 sequences; exact repair leaves no signature lead character, ASCII text unchanged, sha256 97cd5cc0… → 19b24328… | PASS (EXECUTED) |
| C3 design, enrolled Tailwind | `npm run check:enrolled-tailwind` → `p04-enrolled-tailwind-local.txt` | the gallery `overflow-clip` is the only new utility; the `overflow-hidden` count is stale; baseline update is remove-only | PASS (EXECUTED) |
| C3 sources | `p06-snapshot-sources.mjs` → `p06-snapshot-sources.txt`, `sources/` | HEAD text of the four UI files and the listing-visibility gate snapshotted at `ad6e1b08e` | PASS (EXECUTED) |
| C4 proof | sidecar 6 SEC-937 cases; R7 planted breaks P1–P3 | frontend and server allow/deny/error on the real view and the real resend action; each break reaches a named case | PASS (ANALYTICAL) |
| C5 mobile record | `node scripts/check-mobile-adaptation-contract.mjs --files <kickoff>` | PASS (`Scope: none`, no rendered change) | PASS (EXECUTED) |
| C6 receipts | `p05-receipt-blackbox.ps1` against the real `phase-write-gate.ps1` (event on stdin from a file) | the three receipts allow all four UI edits; no receipts and no mobile receipt are denied with the right reason | PASS (EXECUTED) |
| C6 reviewed scope | `p01-reviewed-scope-membership.txt` | the four UI files are in the Task 923 D8/D9 scope; the gate data and evidence files are not → reviewer R12 rebase (D9) | PASS (EXECUTED) |
| C6 evidence gate | `node scripts/check-kickoff-evidence.mjs --files <kickoff>` | PASS | PASS (EXECUTED) |
| C7 publication | `node scripts/workflow-gates/cli.mjs plan --contract <sidecar>` | exit 0; kickoff digest b4ac439ede544ff18eeda3323344bc5a16b75f3bd92deec559a56f5f83b1bdba | PASS (EXECUTED) |
| C7 numbering | `docs/backlog.md` registry line 47 | a parallel session filed 941 (D10, read-only commands); the listing-visibility governance task was renumbered 941 → 942 in this kickoff, the 939 kickoff and the design evidence | PASS |
| C7 diff gate | `cli.mjs diff --phase plan` at `ad6e1b08e` | BLOCKED on paths that are not this task's (archived Task 935 sidecar, `scope-rebase.selftest.mjs` of Task 940) | RECORDED, NOT THIS TASK |
