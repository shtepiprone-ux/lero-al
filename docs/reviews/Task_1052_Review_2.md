# Task 1052 — Review 2

Kickoff: [Sprint_93_kickoff_prompt_Task_1052_OWASP_Mapping_Follows_The_Sheets_Of_2026_11_26.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_1052_OWASP_Mapping_Follows_The_Sheets_Of_2026_11_26.md) · OWASP record: [Task_1052.json](../security/owasp/reviews/Task_1052.json)

Review 2 of Revision 1, the working tree on cfa0613d3 — APPROVED
Scope: diff-based; `git diff --stat cfa0613d3` → 4 files (32+, 7−): the executor's `docs/security/owasp/controls.json` (2 lines) and `docs/security/owasp/sheets.json` (the tool's output, 3 lines); Opus's `docs/backlog.md` (the 1052 note, the 1053 and 1054-1064 rows) and the kickoff's "## Revision 1", carried as documentation (checklist H1); untracked: the Task 1053 kickoff (Opus, documentation). No entry point, code or configuration.
Tools: `owasp.mjs sync` → exit 0 (141 sheets at 7eb130bc64f5, nothing changed), `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 45786338194 red only at the OWASP upstream step (Task 1052's Cause); `owasp.mjs sync --verify` → exit 0; `node --test scripts/quality/owasp.test.mjs` → 25 passed; `node --test scripts/quality/check-files.test.mjs` → 32 passed; `check-files.mjs` on both files → exit 0; one break → exit 1, restored; `owasp.mjs review --base origin/main` → exit 0. CI of the pull request: UNKNOWN until the push (V14).
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: mapping only; the registry equals upstream at 7eb130bc64f5 and `OAuth2` is mapped at its current version.

## Checklist V

- V1: `node scripts/quality/owasp.mjs sync` → "141 sheets at 7eb130bc64f5; 0 downloaded; added 0, changed 0, removed 0", exit 0; `check` → "141 sheets mapped (87 apply), every one read at its current version, every quote verified", exit 0; `check-ruleset.mjs` → "the live ruleset matches scripts/quality/main-ruleset.json", exit 0; `gh run list --branch main --limit 3` → CI 45786338194 failure (the merge of PR #80, the Cause of this task), Scorecard runs green.
- V2: `git diff --stat cfa0613d3` → `controls.json` 4, `sheets.json` 6, `docs/backlog.md` 4, the kickoff 25; `git ls-files --others --exclude-standard` → the Task 1053 kickoff. The executor's two files are R1-1's Scope; the other three are Opus's documentation (checklist H1).
- V3: every claim of the report reproduced: `sync --verify` exit 0; `check` exit 0; `owasp.test.mjs` 25 of 25; `check-files.mjs` on both files 0 findings; `check-files.test.mjs` 32 of 32 (the kickoff gate reads the mapping). No code file changed: no typecheck, no ESLint.
- V4: the whole diff of both files read (`git diff cfa0613d3 -- docs/security/owasp/controls.json docs/security/owasp/sheets.json`): `OAuth2` `reviewedSha` `11e383b988e14b6e5cd7946953d3694ee8a30649` and `reviewedOn` `2026-11-26`, as R1-1; `sheets.json` changes `commit` to `7eb130bc…`, `fetchedOn` and the `OAuth2` `sha`, as the tool writes them. The Cause is removed: `check` reports no O3.
- V5: `applies`, `triggers` and `requirements` of `OAuth2` equal `cfa0613d3` (the hunk touches only the two version lines); no other sheet changed. The mapped quote is in the new text (`grep -c` on `.cache/owasp/OAuth2.md` → 1, the kickoff's "## Revision 1").
- V5a: no visible element changed (no page, component or Story in the diff).
- V6: no allowlist, baseline, skip or disable in the diff.
- V7: below.
- V8: AC2 — `OAuth2` `reviewedSha` set back to `765d6e48…` → `owasp.mjs check` exit 1 with O3; restored (sha256 `a80532673566c3fe…` before and after) → exit 0. The report's step-1 run (exit 1, one O3) is the failing run before the change. AC1: `sync --verify` exit 0; AC3: 25 passed. AC4: CI, V14.
- V9: no Story.
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base origin/main` → exit 0, 5 sheets (9 files); each has its verdict in the record, the evidence of the two met sheets extended by this review.

## V7 — secure code review

Six steps: (1) no control weakened: no requirement, trigger or applicability changes; the two version fields record the reviewer's read of the new `OAuth2` text (the kickoff's "## Revision 1": the old blob through `gh api` compared with `diff`; the new section "Device Authorization Grant and Cross-Device Flows" asks nothing of a product that offers no device or cross-device flow, `grep` over `src` and `supabase` → no output); (2) no new vector; (3) no trust boundary changes; (4) no new package or integration; (5) no test, assertion or rule removed; (6) categories:

- Authorization, Input and output, Authentication and sessions, Requests and redirects, Next.js entry points, Business logic, JavaScript and TypeScript, Data exposure, errors, logging, Files, Dependencies and configuration: not touched — `git diff --name-only cfa0613d3` holds no file under `src/`, `supabase/`, `.github/`, `package.json`, a lockfile or a configuration file.
- Agent and tool output: touched — the upstream sheet text is data read by the tool; the mapping decision rests on the reviewer's own line-by-line comparison, not on the executor's report.
- Tests: AC2 fails without the change (V8).

## Findings

No findings.

## Open parts

- Owner: read the diff; the handoff gives the commit and the push to `task/1052-owasp-remap` (PR #81 exists).
- V14 `gh pr checks 81`; then H1a again right before the merge command; after the merge, the `main` run green, then the archive of Tasks 1047 and 1052 (H7).
