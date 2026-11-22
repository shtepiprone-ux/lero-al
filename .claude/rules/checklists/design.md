# Checklist D — Opus creates a task (skill `create-task`)

Every item, in this order, under checklist A. The report to the owner names each item with its result.

| # | Step | Done when |
|---|---|---|
| D1 | `node scripts/quality/owasp.mjs sync`, then `node scripts/quality/owasp.mjs check` | both exit 0; a sheet changed upstream is read and mapped first |
| D2 | Read the code where the problem is, its `main` version (`git show main:<path>`) and its Story; for an owner's reference, every element of it; for an admin setting, every admin page that edits the same data | every file the Scope will name was read |
| D3 | Write "## Cause": the fact that produces the problem, with its source (`path:line`, or a command followed by "→ <its output>"), and a "Fix:" line | the Fix removes that cause and nothing else |
| D4 | Write "## Scope": every file the Fix changes, each with the function or lines it changes. A legacy part of a file the Fix changes migrates to Mantine (owner, 2026-11-19) | no file the Fix does not need; one Cause per task: a problem with several causes is split into numbered tasks now |
| D5 | Add "Kept as on `main`": per changed file, the behaviour it keeps (A2) | every file of the Scope has its line |
| D6 | Attack surface: `.claude/rules/threat-model.md`. Answer the attack-surface question; data, roles or SQL: `node scripts/quality/db-catalog-audit.mjs`; uploads: `node scripts/quality/cloudinary-config.mjs` | "Unchanged", or the threat model whose mitigations are acceptance criteria |
| D7 | A new dependency: `npm view <name> time repository scripts --json` | first release ≥ 30 days old, version ≥ 14 days, install script understood |
| D8 | Visible UI: checklist U (`ui.md`) items U1-U7, U11, U12 | the kickoff's "## UI" and "## Mobile adaptation record" are complete |
| D9 | `node scripts/quality/owasp.mjs plan <kickoff>`, then "## OWASP" | every required sheet has a verbatim quote and its AC, or "not applicable" with a reason |
| D10 | Acceptance criteria: only for the Cause, the OWASP requirements and the attack surface; each names one automated test; the Route names the exact test files the executor runs, and nothing else | no criterion or test outside the Cause; the CI criterion's test is `gh pr checks <n>` |
| D11 | Write the kickoff from `.claude/rules/kickoff-template.md` in `tasks/Sprints/`, and one row in `docs/backlog.md` | at most 200 lines without the OWASP checklist |
| D12 | `node scripts/quality/check-files.mjs <kickoff> docs/backlog.md`, `node scripts/quality/owasp.mjs check` | both exit 0; every Route step runs in Sonnet's session |
| D13 | Report to the owner in Ukrainian | what the task does, the kickoff path, D1-D12 with exit codes |

A revision after `NEEDS REVISION` adds one "Revision <k>" block to the kickoff with one item per finding of the review;
it adds no other change and does not grow the Scope (checklist V, V11).
