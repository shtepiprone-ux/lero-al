# Task 977 — The CI-01 secret check finds a secret inside any workflow expression

Sprint 93. Priority P3. Found 2026-11-15 by Task 974 Review 6 (note N1); no owner decision needed (golden rule,
2026-11-07: a gap found is fixed or handed to a task in the same turn). Implementer: Opus (`scripts/quality/**` is a
policy path). Reviewer: a separate Opus session. Human owner of the change: the owner.

## Goal

`secretScopeProblems` in `scripts/quality/ci-secrets.test.mjs:21` matches a secret with `/\$\{\{[^}]*\bsecrets\b/`:
it reads from `${{` only up to the first `}`, so an expression with a brace before the `secrets` context passes.
Measured 2026-11-15 (Task 974 Review 6, an in-memory call): a job-level `env` holding
`${{ format('{0}', secrets.X) }}` or `${{ fromJSON('{"a":1}').a || secrets.X }}` returns `[]`, while `${{ secrets.X }}`
returns one problem. After the task every `secrets` context inside a `${{ … }}` expression is found, whatever text
precedes it in the expression, and the check stays linear in the length of the text.

## Scope

- `scripts/quality/ci-secrets.test.mjs`: the `SECRET` match finds `secrets` anywhere between `${{` and the `}}` that
  closes the expression (a brace inside a string literal or a format placeholder does not end it); a planted case for
  `format('{0}', secrets.X)` and `fromJSON('{"a":1}').a || secrets.X` in the workflow `env`, a job `env` and a third-party
  action's `with`; the existing forms and the `github.token` and plain-text cases keep their results.
- Dependencies: none.
- Out of scope: every other function of `ci-secrets.test.mjs`; `.github/workflows/*.yml` (no workflow holds such a form today).

## Attack surface

Unchanged: a test of the repository's own workflow files gets stricter; no workflow, secret or permission changes.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-15).

- CI_CD_Security: not applicable — no pipeline job, trigger, permission or protection changes; only a test of the workflows tightens.
- GitHub_Actions_Security: "it must be treated as a critical asset, potentially even more critical than the source code it processes" — a secret bound at workflow or job level in any expression form fails the test — AC1.
- Injection_Prevention: not applicable — the test parses the workflow YAML as data and builds no query, command or markup.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — the new match has no nested quantifier and no alternation over the same characters — AC1, AC2.
- Key_Management: not applicable — no key is created, stored or rotated; the secrets stay in the `security-ci` environment.
- OS_Command_Injection_Defense: not applicable — the changed test starts no process and calls no operating system command.
- Secrets_Management: "Consider enabling secrets detection at the developer level to avoid checking secrets into code before commit/PR" — the scope check runs in the quality job on every pull request — AC1.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the reviewer reruns the planted cases and the deliberate break, not the report — AC1.
- Software_Supply_Chain_Security: not applicable — no dependency, action pin or install step changes in this task.
- Verifying_Third_Party_Agent_Execution_Evidence: "Reconcile supplier reports with observations you control when possible" — the result of the quality job is read from GitHub with `gh pr checks <n>` — AC3.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 A secret inside any `${{ … }}` expression, a brace before it included, is refused at workflow level, job level
  and on a third-party action; a step secret, `github.token` and plain text pass — test:
  `node --test scripts/quality/ci-secrets.test.mjs` (the two brace forms red before the change, measured; green after;
  red again with the previous `SECRET` pattern put back, then restored).
- AC2 The quality scripts and every file pass their checks — test: `node --test "scripts/quality/*.test.mjs"`,
  `node scripts/quality/check-files.mjs --worktree` and `npm run lint`.
- AC3 The pull request's quality job passes — test: `gh pr checks <n>` on this task's pull request.

## Route

1. Add the planted cases of AC1 and run them on the unchanged code (keep the failing output).
2. Change `SECRET`; run: `node --test "scripts/quality/*.test.mjs"` · `node scripts/quality/check-files.mjs --worktree` ·
   `npm run lint`; deliberate break: the previous pattern put back (the brace cases fail), restored.
3. Report: each command, exit code, relevant output. After the push: `gh pr checks <n>` until every check has concluded.

## Review
