# Checklist V — Opus reviews a task (skill `review-task`)

Every item, in this order, under checklist A. The review judges the diff against its kickoff; it is not a new design.

| # | Step | Done when |
|---|---|---|
| V1 | `node scripts/quality/owasp.mjs sync`, `check`; `node scripts/quality/check-ruleset.mjs`; `gh run list --branch main --limit 3` | all exit 0; the state of `main` CI is named |
| V2 | **Scope first:** `git diff --stat <commit the revision started from>` against the kickoff's Scope | a file outside the Scope, or a hunk the Cause does not need, is a finding whose fix is to revert it |
| V3 | **The report is a supplier assertion:** rerun each claim (the Route's tests, the failing-first runs, the deliberate breaks) | a claim that does not reproduce is a finding |
| V4 | Read every changed file once, tests included; a generated file through the tool that checks it | a change that does not remove the "## Cause" is a finding |
| V5 | Approved behaviour: each changed surface against `git show main:<path>` and its `main` Story | a change of what `main` does without an owner decision is a finding (A2) |
| V6 | Exemptions: every added or removed allowlist, baseline, registry row, `skip`, `eslint-disable` in the diff | each is proven with a planted bad case through the same checker, or is a finding |
| V7 | Secure code review: `.claude/rules/secure-code-review.md` §2 (the six steps) and §3 (every category); data or roles: `db-catalog-audit.mjs`; uploads: `cloudinary-config.mjs` | every category of §3 answered: "touched" with `path:line`, or "not touched" with the fact (`git diff --name-only` shows no file of it) |
| V8 | Each acceptance criterion: run its test, undo the product change once, run again, restore | the test fails without the change |
| V9 | Stories: list each changed Story and the states it renders, read from its code | the list is for the owner, who checks Stories by hand; no Storybook run |
| V10 | `node scripts/quality/owasp.mjs review <kickoff> --base main`; write `docs/security/owasp/reviews/Task_<n>.json` | every listed sheet is `met`, `finding` or `not applicable` with its reason |
| V11 | Findings: only defects of this diff against the kickoff, A2 or OWASP. No new requirement, redesign or "nice to have"; a new idea is one line proposing a numbered task. Each finding's revision item says exactly what to change | every finding cites `path:line` and the rule it breaks |
| V12 | Write `docs/reviews/Task_<n>_Review_<k>.md` (`secure-code-review.md` §4, §5), link it in "## Review"; `node scripts/quality/check-files.mjs <kickoff> <review file>` | exit 0 |
| V13 | Verdict: `APPROVED`, `APPROVED WITH NOTES` or `NEEDS REVISION` | every note is fixed now or is a numbered task |
| V14 | After the owner's push: `gh pr checks <n>` | every check concluded; a red job is opened with `gh run view <id> --log-failed` and fixed in the same pull request |
