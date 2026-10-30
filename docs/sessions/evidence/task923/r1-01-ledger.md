# Task 923 - requirement / AC ledger, behaviour, QA profile, flows, write scope (execute/01-start step 5)

Recorded 2026-10-10 by Sonnet, after the first script files were written (see the ordering deviation in
`research-exec/r1-gr7-exec-923.md`) and before any further write.

Non-visible task: the kickoff's Mobile adaptation record is `Scope: none` and the task writes tooling only (scripts,
a registry, fixtures, a unit test, `package.json` script entries, evidence). `shared/ui-token-contract.md`, the mobile
receipt, GR-0 and the Storybook-proof receipt do not apply; none of the write set is a UI/Story path of
`phase-write-gate.ps1` (`src/stories|components|design-system|modules|app`). The mobile adaptation contract's proof
paragraph ("app root and every portal root", `rendered-state-census.md`) is what this task implements.

## Requirements -> planned evidence

| ID | Requirement (short) | Where | Evidence |
|---|---|---|---|
| R1 | registry file + validator | `scripts/rendered-interaction-states.json`, `scripts/rendered-state-census/registry.mjs` | unit test (R8), discover (AC2) |
| R2 | `--discover` | `scripts/rendered-state-census/discover.mjs` | AC2 transcript |
| R3 | runner, closed sweep, exit codes | `scripts/check-rendered-state-census.mjs`, `runner.mjs` | AC3 |
| R4 | metrics per target | `in-page.mjs` + focus/dismiss in `runner.mjs` | AC3, AC4 |
| R5 | JSONL + summary | `check-rendered-state-census.mjs` (`--out`) | AC3 |
| R6 | `--verify-gate` + 9 fixtures | `verify.mjs`, `scripts/__fixtures__/rendered-state-census/*.html` | AC1 |
| R7 | three package scripts | `package.json` | AC5 |
| R8 | validator unit tests | `scripts/__tests__/rendered-state-census.test.ts` | AC5 |
| R9 | first full run, violations with owners | session log table | AC4 |

## Preserved / required behaviour
Preserved: every product source, Story, fixture, theme and token file; `scripts/check-stories-rendered.mjs` and the
retired aliases; the CI workflow and the policy documents (Opus edits those at closure, kickoff section 9).
Required: see the kickoff section 5 table.

## QA profile and flows
Q4 (a new blocking gate, planted-failure proof). Negative flows: a click selector that matches nothing -> `open-failed`;
a state that opens more or fewer portals than declared -> `portal-count`; a Story that errors on render ->
`error-screen`; no `storybook-static` -> exit 1 "Build first". Validation / authorization / network / concurrent
writer: not applicable (tooling on a static build).

## Task-owned write scope (kickoff section 4)
`scripts/check-rendered-state-census.mjs`; `scripts/rendered-state-census/*`; `scripts/rendered-interaction-states.json`;
`scripts/__fixtures__/rendered-state-census/*.html`; `scripts/__tests__/rendered-state-census.test.ts`; `package.json`
(three script entries only); `docs/sessions/evidence/task923/*`; `docs/sessions/2026-10-10-task923-rendered-state-census.md`;
the 923 backlog cell. Everything else is frozen.

## Write set written so far (hashes in `r1-60-hashes-end.txt` at the end)
registry.mjs, in-page.mjs, runner.mjs, discover.mjs, verify.mjs, check-rendered-state-census.mjs, 9 fixtures
(generated once from a scratchpad script, committed as static files). Exploratory scratch scripts (import scan, state
probe, GR-7 probes) live in the session scratchpad, outside the repository; their raw output is in this folder
(`r2-00-import-scan.json`, `r2-01-probe.jsonl`).
