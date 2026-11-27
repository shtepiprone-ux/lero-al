# Task 988 — Review 7

Kickoff: [Sprint_94_kickoff_prompt_Task_988_The_Chosen_Language_Stays.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_988_The_Chosen_Language_Stays.md) · OWASP record: [Task_988.json](../security/owasp/reviews/Task_988.json)

Review 7 of the working tree on 7ba9ef38d (Revision 5, branch `task/988-chosen-language-stays`, pull request #83, uncommitted) — APPROVED
Scope: diff-based. `git diff --stat 7ba9ef38d -- src scripts docs` → 20 files (+131, −34).
- R5-1: the permissions page, its manager, its view, the smoke test, the Story file and the security test's mock.
- R5-2: `clientSinks.test.ts`. `src/components/layout/Header.tsx` is equal to 7ba9ef38d: sha256 `1608c54eae6d…` for both.
- R5-3: 12 docs.

`docs/backlog.md`, the kickoffs and Reviews 6-7 are Opus's. Entry points: none new. The permissions page (`/<language>/admin/permissions`, administrator only) now formats its dates on the server.
Tools:
- `owasp.mjs sync`, `check`, `check-ruleset.mjs` → exit 0.
- `main` CI 45833291216 and 45825365315 → green.
- typecheck → exit 1, 80 errors, all in the stale `.next/types/validator.ts` (B6), 0 in `src`.
- ESLint on the 7 changed code files → exit 0.
- `vitest related` → 3 files, 65/65. The text search found 5 files, 77/77. Integration graph → no test file.
- `client-sinks.mjs` → exit 0. `check-files.mjs` on 24 files → exit 0.
- DevTools in the owner's Chrome for V5a.

Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: Revision 5, as amended by Review 6 after the executor's three BLOCKED items, removes F8-F10.
- F8: the permissions view no longer formats a date in the browser, so its text cannot differ from the server's.
- F9: the header's admin link keeps `adminHref(...)` inside `window.open(...)`, so K7 and AC6 still pass. The new-tab checker now reads one level of nested parentheses and still flags a missing `noopener` there.
- F10: the 20 doc lines name the current files.

The walk on the production build, where F8 showed, runs only in CI (V14).

## Checklist V

- V1:
  - `node scripts/quality/owasp.mjs sync` → "142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0", exit 0.
  - `check` → "142 sheets mapped (87 apply), every one read at its current version, every quote verified", exit 0.
  - `check-ruleset.mjs` → "the live ruleset matches scripts/quality/main-ruleset.json", exit 0.
  - `gh run list --branch main --limit 3` → Repository settings 45834513363 success, CI 45833291216 success, CI 45825365315 success. GitHub `main` = `aacf6ebce`.
- V2: `git diff --stat 7ba9ef38d -- src scripts docs` → the files of R5-1, R5-2 and R5-3 as amended in Review 6, and Opus's `docs/backlog.md`. No hunk outside Revision 5. Deviations of the report:
  - (1) The typecheck exit is 2 in PowerShell; through Git Bash it is 1, with the same 80 errors in `.next/types/validator.ts`.
  - (2) I8a ran in Playwright's Chromium. This review measures in the owner's Chrome (V5a).
  - (3) `/en/admin/permissions` was not measured: the proxy sends the owner's account to `uk` (the task's behaviour). The view no longer formats in the browser for any locale, so the text is the server's in each one.
  - (4) The Story event times are Node's `en` at `timeZone: 'UTC'` ("Jun 18, 2026, 10:00 AM", "Jun 17, 2026, 8:00 AM"), as Review 6's R5-1 asks. 7ba9ef38d's Story formatted them in the viewer's time zone. This is fixture text only.
  - (5) The executor ran `npm run test:security-integration -- src/tests/integration/adminPage.integration.test.ts` against the development project (owner decision D91), beyond the Route. The integration import graph over the changed files finds no test (V3).
- V3: every claim of the report reproduces:
  - R5-2 failing first: `clientSinks.test.ts` with the old pattern restored, in a copy-and-restore (sha256 equal after) → "Tests 4 failed | 10 passed (14)" (the three cases and the planted case). With the new pattern → 14/14.
  - Break: `noopener` removed from `Header.tsx`'s call → "Tests 3 failed | 11 passed (14)". Restored, sha256 equal.
  - R5-1, mock: `permissions.security.test.ts` from 7ba9ef38d → "No "getFormatter" export is defined on the "next-intl/server" mock". With the change → 42/42.
  - R5-1, view: `AdminPermissionsView.tsx` from 7ba9ef38d with the new T9 → "AssertionError: every key shows its passed date: expected +0 to be 36", "1 failed | 8 passed (9)". With the change → 9/9.
  - R5-3: `check-files.mjs` on the 12 docs, the kickoffs of Tasks 980, 982 and 988, Reviews 6 and 7's inputs and the 7 code files (24 files) → 0 findings, exit 0. The audit record's notes stand in the third cell, so `ledgerFindings` still reads each status.
  - §8.1 import graph: `npx vitest related --run --reporter=verbose` over the 7 code files → 3 files, 65/65, exit 0. With `--config vitest.integration.config.ts` → "No test files found", exit 0.
  - §8.1 text search: `clientSinks`, `windowOpenViolations`, `AdminPermissionsView`, `AdminPermissionsManager`, `updatedDates`, `eventDates`, `admin/permissions/page`, `permissions.security`, `getFormatter` → `clientSinks.test.ts`, `src/app/[locale]/admin/__tests__/adminLanguage.test.ts` (it names the page file), `AdminPermissionsManager.smoke.test.tsx`, `permissions.security.test.ts`. Run with `adminSlug.test.tsx` (AC6, which F9's first form broke) by `npm test --` → 5 files, 77/77.
  - `node scripts/quality/client-sinks.mjs` → "580 files, every sink controlled or reviewed", exit 0.
  - `npm run typecheck` → exit 1, 80 errors, every one in `.next/types/validator.ts`, 0 in `src`. Not a finding (B6).
  - `npx eslint --no-warn-ignored --max-warnings 0` over the 7 code files → exit 0.
- V4: read once, the whole diff:
  - The page formats with `getFormatter()` after `requireStaffPage({ adminOnly: true })` and the two reads (`page.tsx:21-37`), so the guard order of Task 923 R68 (a) stands.
  - `updatedDates` holds only the keys with an `updated_at`.
  - The view renders `updatedDates[key]`, `updatedDates[page.key]` and `eventDates[ev.id]` under the same `updated_at &&` and event conditions as before, and imports no formatter.
  - `AdminPermissionsManager` passes both maps through. A toggle changes only `allowed`, as before, so the server text stays the text of the stored `updated_at`.
  - The checker's pattern `/window\.open\((?:[^()]|\([^()]*\))*\)/g` has no nested quantifier over overlapping input (V7).
  - F8-F10 are removed.
- V5: against `git show main:<path>`. `main`'s view formatted in the browser (`AdminPermissionsView.tsx:41,103,170,238`). The text a reader sees in `en`, `uk` and `it` is unchanged (V5a). In `sq` it is now the server's Albanian text instead of the browser's English fallback, which is the fix of F8. `main`'s `Header.tsx:97` opened `/admin`. The task's slug form stays, and that one line is equal to 7ba9ef38d.
- V5a:
  - (1) Page, `http://localhost:3000/uk/admin/permissions` on the dev server in the owner's Chrome, the tab in front:
    - The base: the three R5-1 product files set back to 7ba9ef38d in a copy-and-restore (sha256 equal after), reloaded, measured at 1440 px → 56 date lines, e.g. "Оновлено: 24 трав. 2026 р." and "ким shtepiprone · 24 лист. 2026 р., 12:32".
    - With Revision 5, at 320, 640, 1024 and 1440 px: the 56 lines are equal to the base, string by string, at every width.
    - Style: 12px/400, line height 18px, colour `rgb(71, 84, 103)`, the same as the base.
    - No overflow. No console error or warning, so no hydration message.
  - (2) Stories: on the Storybook dev server, every Story of `AdminPermissionsView` (Default, AllAllowed, WithPagesSection, Saving, AuditEmpty, AuditUnavailable) at 320, 640, 1024 and 1440 px, an iframe of that width each (24 renders):
    - Date lines per Story: Default 3, AllAllowed 37, WithPagesSection 7, Saving 3, AuditEmpty 2, AuditUnavailable 2, equal at every width.
    - Texts: "Jun 17, 2026", "Jun 18, 2026", "Jun 18, 2026, 10:00 AM", and in WithPagesSection also "Jun 17, 2026, 8:00 AM".
    - No line with an empty date. Every date line 12px/400, line height 18px, `rgb(71, 84, 103)`. No overflow.
    - No control, state or interactive element changes, so no Firefox look is asked by this revision.
- V6: the diff changes one checker of `clientSinks.test.ts`, the `window.open` pattern. It is proven through the same function by the planted case at `clientSinks.test.ts:92-95`: a nested call without `noopener` → 1 violation; with it → 0. The case fails with the old pattern (V3). No allowlist entry, baseline row, `skip` or `eslint-disable` is added or removed; `OPENER_ALLOWED` is unchanged and its case passes.
- V7: below.
- V8: each revision item's test fails without its change and passes with it (V3: R5-1 T9 and the mock, R5-2's four cases, R5-3's `check-files.mjs`). The break of `noopener` fails three cases.
- V9: for the owner's look, last: `AdminPermissionsView` Default, AllAllowed, WithPagesSection, Saving, AuditEmpty, AuditUnavailable, with the dates listed in V5a (2). Also the Story files listed in Review 5's V9.
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → the diff (220 files with Opus's records) triggers the same 60 sheets, each with its verdict in the record, exit 0. `Secure_Code_Review` and `Secure_Coding_with_AI` name this review.

## V7 — secure code review

- Six steps:
  - (1) Existing controls: the guard of the permissions page runs first, as before. The new-tab checker still fails closed, now also through a nested call (planted case).
  - (2) New vectors: none. The page passes the client two maps of strings it formatted from the dates it already passed.
  - (3) Trust boundaries: server to client, the same fields as before (`updated_at`, `created_at`), now as display text.
  - (4) No package.
  - (5) No workflow, lockfile, CI table or agent configuration.
  - (6) Below.
- Authorization: touched, unchanged. `src/app/[locale]/admin/permissions/page.tsx:21` `requireStaffPage({ adminOnly: true })` before any read. `[SEC-X-SRV-PERMS-ADMIN-ONLY]` passes, 42/42.
- Input and output: touched. The dates are rendered as React text (`AdminPermissionsView.tsx:108,175,243`), escaped, with no raw HTML.
- Authentication and sessions: not touched.
- Requests and redirects: not touched. `Header.tsx` is equal to 7ba9ef38d, and its `window.open` passes `noopener,noreferrer`.
- Next.js entry points: touched, the server component `page.tsx`. No new route, action or parameter.
- Business logic: not touched.
- JavaScript and TypeScript: `clientSinks.test.ts:36`'s pattern is linear (an alternation of a negated class and a bounded group with no quantifier inside it), run over the repository's own files.
- Data exposure, errors, logging: no new field reaches the client.
- Files: not touched.
- Dependencies and configuration: not touched.
- Agent and tool output: the report is rerun claim by claim (V3). The first Revision 5 report's three BLOCKED items were each reproduced before the revision was amended (Review 6).
- Tests: no test weakened. The checker change is proven with a planted case in both directions (V6).
- `db-catalog-audit.mjs`: not run; no table, policy, grant or function changes.

## Findings

No findings.

## Notes (no change asked)

- N9: Review 6's first Revision 5 items carried three requirements that this review's tools had not checked against the repository's other checkers: K7 of `client-sinks.mjs`, `ledgerFindings` of `check-files.mjs`, and the `next-intl/server` mock of `permissions.security.test.ts`. The executor stopped on each as BLOCKED (A16). Each was reproduced and the items were amended in Review 6 with a probe of the fix. Review 6's response did not open the executor's prompt with `/execute-task`, as V13 names.
- The `moderator /sq/admin @1280` timeout of run 45877879937 stays UNKNOWN until the next run (Review 6).
- F1-F10 are closed.

## Open parts

- Opus, after the push: `gh pr checks 83` (V14), including the signed-in walk's `/sq/admin/permissions` and `moderator /sq/admin` rows.
- Opus, after the merge: the production checks of the kickoff's Route step 5.
