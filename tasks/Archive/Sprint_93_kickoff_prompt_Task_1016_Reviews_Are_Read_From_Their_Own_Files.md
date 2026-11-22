# Task 1016 — The quality tools read a task's reviews from their own files

Sprint 93. Priority P1. Owner decisions: the owner 2026-11-19 (translated): "write reviews as separate files, and add links to these files in the kickoff"; the owner 2026-11-22 (translated): "you do not make changes to the project according to the documentation before handing the result to the owner for a commit" (pull request #50 failed the task gate and CodeQL).
Implementer: Opus (`scripts/quality/**`, which the executor may not edit). Reviewer: Opus. Human owner of the change: the owner.

## Goal

Reviews are now written as `docs/reviews/Task_<n>_Review_<k>.md` and linked from the kickoff, but the OWASP tools read a task's verdict and findings only from the kickoff's own "## Review" text, so a kickoff whose review lives in its own file has no verdict and its OWASP record names findings the tool cannot find. After the task both tools read the linked review files, a kickoff's "## Review" holds only those links, and no regular expression is built from a task number.

## Cause

Read at `213103f0a`
- `scripts/quality/owasp.mjs:403` `lastVerdict(body)` reads the verdict from the kickoff text only; `scripts/quality/owasp.mjs:389` looks for each finding of the record in that text ("is not in the findings of "## Review""). Running `main`'s `check-files.mjs` on the Task 957 kickoff, whose four reviews are linked files → "Business_Logic_Security: F27 is not in the findings of "## Review"" (2026-11-22).
- `gh api repos/:owner/:repo/check-runs/137140646571/annotations` (pull request #50, 2026-11-22) → "scripts/quality/check-files.mjs:534 | Regular expression injection | This regular expression is constructed from a command-line argument": `kickoffOf(task)` built `new RegExp(...${task}...)`.
Fix: `owasp.mjs` reads the review files a kickoff links (`reviewLinks`, `reviewLines`, `lastVerdict`, `checkReview`, `checkGate` take a file reader); `check-files.mjs` checks that "## Review" holds only ordered links to existing review files of the same task and that each review file opens with its title and a verdict; `kickoffOf` compares the task number instead of building a pattern from it.

## Scope

- `scripts/quality/owasp.mjs`: `REVIEW_FILE`, `REVIEW_LINK`, `verdictsOf`, `readRepoFile`, `reviewLinks`, `reviewLines`; `lastVerdict`, `checkReview` and `checkGate` read the linked files through `read`.
- `scripts/quality/check-files.mjs`: `reviewSectionFindings` (with `INLINE_REVIEW_GRANDFATHERED`, the kickoffs whose reviews were written inline before 2026-11-19), `reviewFileFindings`, `kickoffOf` (the number compared, no pattern built from it).
- Tests: `scripts/quality/owasp.test.mjs`, `scripts/quality/check-files.test.mjs`.
- State: the two scripts and their tests were written on `task/957-signed-listing-uploads` (commit `da4470783`) and travel in pull request #50 with the rule documents that need them; this kickoff and its review make that change a task (the gate of `.github/workflows/ci.yml`, "Every change of code or configuration carries its approved task").
- Dependencies: none. Out of scope: the Codex lines of `.gitignore` and `eslint.config.mjs` (they stay as on `main` until a task of their own); every other gate.
- Kept as on `main` (checklist A2): a kickoff with an inline review written before 2026-11-19 keeps passing; every other check of both tools is unchanged.

## Attack surface

Unchanged: two local and CI quality tools read repository files; no product code, data, role or request path changes.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-22).

- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — the tools that hold the review gate change only through this reviewed pull request, merged by the owner — AC3.
- Denial_of_Service: "can take exponential time on some inputs, so one short request can keep a CPU core busy" — every pattern the change adds is fixed and anchored, and no pattern is built from input — AC2.
- File_Upload: not applicable — the tools read repository files; nothing is uploaded.
- GitHub_Actions_Security: not applicable — no workflow file or step changes in this task.
- Injection_Prevention: "The preferred option is to use a safe API which avoids the use of the interpreter entirely or provides a parameterized interface" — the task number is compared as a string instead of being placed into a regular expression — AC2.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — `REVIEW_FILE`, `REVIEW_LINK` and the kickoff-name pattern are fixed and linear — AC1, AC2.
- Nodejs_Security: "some third-party rulesets can be used to flag dangerous patterns such as eval()" — ESLint with the security rules and CodeQL run on the changed scripts in CI — AC2, AC3.
- OS_Command_Injection_Defense: "The primary defense is to avoid calling OS commands directly." — the new code reads files with `readFileSync` and starts no process — AC1.
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries" — no package is added; the change is held to its tests and CodeQL — AC3.
- Software_Supply_Chain_Security: not applicable — no dependency, action or install step changes.
- User_Privacy_Protection: not applicable — the tools read task documents, no personal data.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the review reruns the tests and the gate itself — AC1, AC3.
## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 The tools read the linked reviews — test: `node --test scripts/quality/owasp.test.mjs scripts/quality/check-files.test.mjs` (a verdict and a finding found only in a linked review file are read; a "## Review" line that is not a link, a link to another task's review and an out-of-order link are findings; a grandfathered kickoff's inline review still counts).
- AC2 No regular expression is built from a task number — test: `node --test scripts/quality/check-files.test.mjs` (a kickoff is found by its number, and a number such as `1.*` finds nothing) and the CodeQL check of `gh pr checks <n>`.
- AC3 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. Opus: the change above on the branch of pull request #50; `node --test scripts/quality/owasp.test.mjs scripts/quality/check-files.test.mjs`; `node scripts/quality/owasp.mjs gate --base main`.
2. Run: only those. CI runs only on GitHub after the owner's push and is read with `gh pr checks <n>` (checklist A5).
3. Report: each command, exit code, relevant output.

## Review
- [Review 1 — APPROVED](../../docs/reviews/Task_1016_Review_1.md)
