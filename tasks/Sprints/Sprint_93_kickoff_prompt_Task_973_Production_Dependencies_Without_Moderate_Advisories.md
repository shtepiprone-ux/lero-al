# Task 973 — CI blocks a moderate advisory in a production dependency

Sprint 93. Priority P2. Found 2026-11-12 by Opus with Task 972; revised 2026-11-17 after owner decision O972-1 (Task
972 takes the `glob` and `minimatch` advisories out by scoped overrides) and the withdrawal of the `deepmerge` advisory;
revised again 2026-11-17 after owner decision O972-3 (Task 972 Review 1: the audit runs through `audit-gate.mjs`, which
lets only an owner-accepted advisory through).
Implementer: Opus (`.github/**` and `.claude/**` are outside `execute-task`). Reviewer: Opus, in a session of its own.
Human owner of the change: the owner. Starts after Task 972 merges.

## Goal

CI lets a moderate advisory in a production dependency through: its audit gate blocks only high and critical. After Task
972 the only advisory in the tree is GHSA-fc5q-39xc-vjpf (high, `picomatch`, no fix), accepted by O972-3 until
2026-12-17; after the task CI fails on a moderate, high or critical advisory in a production dependency that no owner
decision accepts.

## Cause

`.github/workflows/ci.yml:165` runs the production audit gate at `--level high`, and `.claude/rules/quality-gates.md:80`
names that level. The advisories this task was filed for leave by other means: `glob` (GHSA-3g3m-2fjr-6pw4) and
`minimatch` (GHSA-g3hv-75wg-m249) through Task 972 Revision 2 (probe: `npm audit --package-lock-only` → `total 0`, Task
972 "## Cause"); `gh api advisories/GHSA-gcqx-w48m-w2h4` → `withdrawn_at=2026-11-16T18:55:38Z` (`deepmerge`), and
`npm audit --json` → no `deepmerge` entry (2026-11-17). `@sentry/nextjs` 11 is no longer needed for them.
Fix: the production audit step runs `audit-gate.mjs --omit-dev --level moderate`; the "Dependency audit" row says so.

## Scope

- `.github/workflows/ci.yml:165`: `node scripts/quality/audit-gate.mjs --omit-dev --level moderate`.
- `.claude/rules/quality-gates.md:80`: the row names the moderate level for production dependencies.
- Dependencies: none.
- Out of scope: any package version (Task 972); `@sentry/nextjs` 11 (no advisory asks for it); the whole-tree high step
  of Task 972.

## Attack surface

Unchanged: a CI gate becomes stricter; no route, action, permission, secret or dependency changes.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-17).

- AI_Agent_Security: not applicable — only the audit row of the rules text changes; no agent tool, permission or setting.
- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — the stricter audit runs in a job that `CI Required` needs — AC2.
- Dependency_Graph_SBOM: not applicable — the SBOM job is unchanged; only the audit level of another step moves.
- GitHub_Actions_Security: "Always set permissions: {} at the workflow level to disable all permissions by default." — the changed step adds no permission, secret or action — AC3.
- Key_Management: not applicable — no key is created, read, rotated or stored by an audit level change.
- LLM_Prompt_Injection_Prevention: not applicable — no model input or agent tool boundary changes in this task.
- Logging: not applicable — `@sentry/nextjs` and its logging are not touched; its upgrade left this task.
- Logging_Vocabulary: not applicable — no log event is added or renamed by an audit level change.
- MCP_Security: not applicable — no MCP server is configured or changed by this task.
- NPM_Security: "Always vet and perform due-diligence on third-party modules you install to confirm their health and credibility." — CI refuses a production package with a moderate advisory — AC1, AC2.
- Secrets_Management: not applicable — the dependency-audit job holds no secret and gains none.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the reviewer reruns the audit and reads the CI check, not the report — AC1, AC2.
- Software_Supply_Chain_Security: "limit the application's dependencies to a specific version that has been previously verified as legitimate and secure" — a production version with a moderate advisory no longer passes CI — AC2.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns AC1 and AC2 and reads the pull request's checks — AC1, AC2.
- Vulnerable_Dependency_Management: "It's highly recommended to perform automated analysis of the dependencies from the birth of the project." — CI blocks moderate production advisories on every change — AC1, AC2.

## UI

No visible change.

## Mobile adaptation record

- Scope: none

## Acceptance criteria

- AC1 Production dependencies have no moderate, high or critical advisory that no owner decision accepts — test:
  `node scripts/quality/audit-gate.mjs --omit-dev --level moderate` exits 0 on the branch after Task 972.
- AC2 CI blocks a moderate advisory in a production dependency — test: `scripts/quality/audit-gate.test.mjs` ("the level
  decides which severities count": a moderate advisory blocks at `--level moderate`) and `gh pr checks <n>` (the
  "Dependency audit" check of this task's pull request).
- AC3 The workflow stays valid and pinned — test: `node --test "scripts/quality/*.test.mjs"` (`ci-secrets.test.mjs`)
  and `node scripts/quality/check-files.mjs --worktree` exit 0.

## Route

1. After Task 972 merges: branch from `main`; AC1 on it.
2. Change the two lines of Scope; the AC2 break on a scratch copy; AC3.
3. Report each command with its exit code; the review runs in its own session.

## Review
