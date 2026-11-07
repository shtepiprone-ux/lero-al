# Kickoff template (at most 200 lines, the "## OWASP" checklist not counted)

`scripts/quality/check-files.mjs` enforces the first line, the sections and their order, at least one `- AC<n>` and the
200-line limit for every kickoff from Sprint 93 on, and runs the OWASP gate (`scripts/quality/owasp.mjs`, owner request
2026-11-07: every task design, edit and review is held against https://cheatsheetseries.owasp.org/index.html). A closed task's kickoff moves to `tasks/Archive/`; every kickoff
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

## OWASP
Start from `node scripts/quality/owasp.mjs plan <kickoff>`: it lists every sheet this kickoff requires (the triggers of
`docs/security/owasp/controls.json` over Goal, Scope and Attack surface — paths in backticks and words — plus Secure
Coding with AI and Verifying Third-Party Agent Execution Evidence for every task, and Threat Modeling, Attack Surface
Analysis, Secure Code Review and Secure Product Design when the attack surface changes), and the requirement quotes
of each. One line per required sheet, either:
- <Sheet>: "<quote of at least six words, verbatim from the sheet>" — <how this task meets it> — AC<n>[, AC<m>].
- <Sheet>: not applicable — <reason of at least five words, specific to this task>.
A requirement the mapping hands to this task (`"task": "<n>"`) is cited verbatim, or `owasp.mjs check` fails (O8).
A quote that is not in the cached sheet text fails, so a sheet cannot be cited without being read.

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

### OWASP check
(Required once the review carries a verdict. `node scripts/quality/owasp.mjs review <kickoff> --base main` lists the
sheets of "## OWASP" and those the actual diff triggers; one line each:)
- <Sheet>: met — "<quote>" — <evidence: `test file` or `command` or path:line>.
- <Sheet>: finding F<n> — <one line; the finding is in the findings list above>.
- <Sheet>: not applicable — <reason of at least five words>.
```
