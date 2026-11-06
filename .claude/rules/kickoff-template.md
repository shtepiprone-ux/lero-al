# Kickoff template (at most 200 lines)

`scripts/quality/check-files.mjs` enforces the first line, the sections and their order, at least one `- AC<n>` and the
200-line limit for every kickoff from Sprint 93 on. A closed task's kickoff moves to `tasks/Archive/`; every kickoff
outside it is an open task's and carries a complete mobile adaptation record.

```markdown
# Task <n> — <outcome in plain words>

Sprint <s>. Priority P0–P3. Owner decision(s): D<n> (<date>) "<quote, translated to English>".
Implementer: Sonnet | Opus (rules/CI/hooks). Reviewer: Opus. Human owner of the change: the owner.

## Goal
<2–5 sentences: what is wrong today (with source path:line or command output) and what is true after the task>

## Scope
- Files to change: <paths>
- Dependencies: none | <name@version — npm view result: first release, version date, install script>
- Out of scope: <what is deliberately not touched>

## Attack surface
"Unchanged" — or the threat model of `.claude/rules/threat-model.md` (≤ 30 lines) and the authorization-matrix rows.

## UI
"No visible change" — or the canonical owner, token owner, direct Story and mobile treatment
(`.claude/rules/shared/*.md`).

## Mobile adaptation record
- Scope: none
(For visible work: `Scope: visible` and every field of `.claude/rules/shared/mobile-adaptation-contract.md`; the IDs come
from `scripts/mobile-adaptation-patterns.json`. `scripts/check-mobile-adaptation-contract.mjs` checks every kickoff
outside `tasks/Archive/`.)

## Acceptance criteria
- AC1 <observable result> — test: <test file, Story with a play function, or `command` that exits non-zero on failure>
- AC2 ...
(For a changed attack surface: the SEC-…-ALLOW / -DENY cases of `security-testing.md`.)

## Route
1. <ordered steps>
2. Run: npm run lint · npm run typecheck · npm test -- --coverage · node scripts/quality/changed-lines-coverage.mjs --base main ·
   node scripts/quality/check-files.mjs --worktree · <task tests>
3. Report: each command, exit code, relevant output; each new test's failing run before the change; the deliberate-break
   output for each security test.

## Review
<filled by Opus: the review summary and the findings in the templates of secure-code-review.md>
```
