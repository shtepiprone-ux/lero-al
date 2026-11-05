# Readiness of Task 942 revision 7 and Task 931 revision 5 (2026-11-05)

Written by the Task 945 review 1 session on the owner's D30, D31 and D32. This session neither implements nor approves either.

## What was run before the text

| Fact | Evidence |
|---|---|
| The `dependency` entry on a copy of the gate: 14 of 14 scenarios, 21 real contracts same result old and new, four rebase self-test files green | `p14-dependency-rebase.txt` |
| The first name of the kind, `runtime`, broke the case GOV-940-VAL-MALFORMED-ERROR, so the kind is `dependency` and no existing self-test changes | `scripts/workflow-gates/scope-rebase.selftest.mjs:202` |
| 246 Vercel MCP tools: 98 refused, 148 read, 0 neither; the hook and the deny list agree on every tool | `p15-vercel-read-only.txt`, `p17-mcp-guard-and-routes.txt` |
| Settings check: planned settings pass, six breaks each give their error, hook self-tests green | `p17-mcp-guard-and-routes.txt` |
| The update on the manifests: 8 serious advisories of the baseline closed, 0 new, the Task 945 dependency check passes, 14 lock entries added, all from the registry with integrity | `p16-update-effects.txt`, `p17-mcp-guard-and-routes.txt` |
| A product contract's rerun needs its own report script, because `verify` writes no report; all three scripts exist and refuse a failing run | `scripts/workflow-gates/cli.mjs:398`, `p17-mcp-guard-and-routes.txt` |
| `npm install` is a write of five files for the hook, so all five are in the 931 sidecar | `scripts/workflow-gates/security-hook.mjs:384` |

## What is not proven

- A real `npm install`, `npm run build` and `npm test` on the updated tree: the owner ran them after this text was first written, on native Windows (`docs/sessions/evidence/task931/design/owner-update-run.txt`), and they pass, apart from ignored leftovers under `test-results/`. Linux and Vercel are still open.
- A rerun of the three product contracts on the update, with 96 integration cases against the development project: R25 does it; a failure stops the update.
- That the deny rule form refuses a Vercel tool in the Claude Code version the project runs: read in the documentation only. AC15 proves it live.
- A rerun of a real contract with a real `dependency` entry: only fixtures here, plus `governance-report` in memory on Task 941.
- Linux and Vercel: CI and the preview build of R14 and AC14.

## Limits the owner should know

- Tools that read environment values stay open (`get_project_env`, `filter_project_envs`, `get_shared_env_var`), because D31 names write tools; D32 decides them again at launch.
- The `vercel` command line through a shell is not covered. It is not installed today.
- Nine high production advisories stay after the update, because they need major versions.
