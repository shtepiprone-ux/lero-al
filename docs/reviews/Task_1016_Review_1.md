# Task 1016 — Review 1

Kickoff: [Sprint_93_kickoff_prompt_Task_1016_Reviews_Are_Read_From_Their_Own_Files.md](../../tasks/Archive/Sprint_93_kickoff_prompt_Task_1016_Reviews_Are_Read_From_Their_Own_Files.md) · OWASP record: [Task_1016.json](../security/owasp/reviews/Task_1016.json)

Review 1 of the branch `rules/checklists-and-957-split`, working tree on df0022227 (uncommitted) — APPROVED

The implementer and the reviewer are both Opus (the kickoff: `scripts/quality/**` is not the executor's); every claim
below was rerun in this review, none is taken from a report.

## Tools (local, 2026-11-22)

- `node scripts/quality/owasp.mjs sync` → 0 changed (c2a1e3e32cec); `node scripts/quality/owasp.mjs check` → exit 0.
- `node --test scripts/quality/owasp.test.mjs scripts/quality/check-files.test.mjs` → 57 pass, 0 fail.
- Deliberate break: the old `kickoffOf` line (`new RegExp` with the task number) put back → the test "a kickoff is
  found by its task number, never by a pattern built from it" fails (1 fail); the fix restored → 57 pass.
- `main`'s own `check-files.mjs` and `owasp.mjs` on this pull request's documents → "Business_Logic_Security: F27 is
  not in the findings of "## Review"" on the Task 957 kickoff: the documents need the new tools, so both travel together.
- `node scripts/quality/owasp.mjs gate --base main` → exit 0 once this review and its record are in the change.

## Scope

`git diff --stat main` on code and configuration: `scripts/quality/owasp.mjs`, `scripts/quality/owasp.test.mjs`,
`scripts/quality/check-files.mjs`, `scripts/quality/check-files.test.mjs`; `.gitignore` and `eslint.config.mjs` equal
`main` (the Codex lines wait for their own task). Nothing outside the kickoff's Scope.

## Secure code review (secure-code-review.md §2)

- Input: the tools read repository files only; a review path comes from `REVIEW_LINK`, which accepts only
  `docs/reviews/Task_<digits>_Review_<digits>.md`, so a link cannot name a file outside that folder.
- Patterns: `REVIEW_FILE`, `REVIEW_LINK` and the kickoff-name pattern are fixed and linear; the CodeQL alert of
  pull request #50 (`scripts/quality/check-files.mjs:534`, js/regex-injection) is removed by comparing the number.
- Fail closed: a missing review file, a link to another task's review, and a link whose verdict differs from its file
  are findings of `checkReview`; a kickoff without an approved linked review keeps failing the gate (G1).
- Kept as on `main`: the kickoffs in `INLINE_REVIEW_GRANDFATHERED` keep their inline reviews.

## Acceptance criteria

- AC1 — met: `node --test scripts/quality/owasp.test.mjs scripts/quality/check-files.test.mjs` → 57 pass.
- AC2 — met locally (the kickoffOf test and its deliberate break); the CodeQL check is read with `gh pr checks 50`.
- AC3 — open until every check of pull request #50 has concluded.

## Findings

No findings.
