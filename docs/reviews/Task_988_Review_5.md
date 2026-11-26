# Task 988 — Review 5

Kickoff: [Sprint_94_kickoff_prompt_Task_988_The_Chosen_Language_Stays.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_988_The_Chosen_Language_Stays.md) · OWASP record: [Task_988.json](../security/owasp/reviews/Task_988.json)

Review 5 of the working tree on 0179d9298 (Revision 4, branch `task/988-chosen-language-stays`, uncommitted) — APPROVED
Scope: diff-based; `git diff --stat 0179d9298 -- src scripts` → 16 files (+45, −23): the 22 admin `pathname` rows of 15 Story files and one test case in `src/lib/auth/__tests__/adminPages.test.ts` (R4-1). The `.claude/`, `docs/` and `tasks/` changes are Opus's. Entry points: none; no product file changes.
Tools: `owasp.mjs sync`, `check`, `check-ruleset.mjs` → exit 0; `main` CI 45833291216 and 45825365315 green; typecheck → exit 1, 80 errors, all in the stale `.next/types/validator.ts` (B6); ESLint on the 16 files → exit 0; `vitest related` → 1 file, 5/5; integration graph → no test file; DevTools in the owner's Chrome and the Storybook dev server for V5a.
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: Revision 4 removes F7: every admin Story mocks an address under the slug, so the sidebar and the header render their states again, equal to the dev server's; the new test fails for any admin Story address `adminRouteOf` does not resolve. The task's 4 revisions are complete; one pre-existing defect of `main` seen on the way (the header's fallback "Admin" on 8 pages) is Task 1068.

## Checklist V

- V1: `node scripts/quality/owasp.mjs sync` → "142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0", exit 0; `check` → "142 sheets mapped (87 apply), every one read at its current version, every quote verified", exit 0; `check-ruleset.mjs` → "the live ruleset matches scripts/quality/main-ruleset.json", exit 0; `gh run list --branch main --limit 3` → Repository settings 45834513363 success, CI 45833291216 success (schedule), CI 45825365315 success (Task 1053, #82). No pull request exists for the branch.
- V2: `git diff --stat 0179d9298 -- src scripts` → the 15 Story files of F7's Location (22 rows, `'/admin…'` → `'/en/admin…'`, nothing else in them) and `adminPages.test.ts` (+23, −1). Deviations of the report: (1) the executor measured in Playwright's Chromium, DevTools not reaching the owner's Chrome: I8a is the executor's; this review measures in the owner's Chrome (V5a); (2) the test's import gains `adminRouteOf`: needed by the case; (3) `expect(found.length).toBeGreaterThanOrEqual(22)` keeps the case from passing on an empty scan, as `[SEC-1007-PAGE-CENSUS]` does: accepted; (4) the shell's menu items below 1024 px sit in the closed drawer: confirmed (V5a); (5) Storybook console 404s (`/api/presence`, `/api/property-types`, `favicon.ico`) and next-intl's `ENVIRONMENT_FALLBACK`: the diff changes only mocked address strings, none of which a request or the time zone reads. No hunk outside R4-1.
- V3: every claim of the report reproduces:
  - Failing first: the 22 rows set back to `'/admin…'` in a copy-and-restore (one `sed` over the 15 files, the files restored from their copies, the sha256 of the 16 files `d1d4a00ccc88…` before and after) → `npm test -- src/lib/auth/__tests__/adminPages.test.ts` exit 1, "AssertionError: src/stories/patterns/mantine/AdminCurrenciesView.stories.tsx: pathname '/admin/currency'" (the list of 22); restored → 5/5.
  - The report's break: `AdminSidebar.stories.tsx:48` back to `'/admin/listings'` → exit 1, "…AdminSidebar.stories.tsx: pathname '/admin/listings': expected [ Array(1) ] to deeply equal []"; this review's break: `'/xx/admin/listings'` (a code outside the four) → the same failure naming `'/xx/admin/listings'`; restored, sha256 `81971238…` equal to the report's.
  - §8.1 import graph: `npx vitest related --run --reporter=verbose` over the 16 files → 1 file, 5/5, exit 0; with `--config vitest.integration.config.ts` and the integration environment → "No test files found", exit 0.
  - §8.1 text search (`adminRouteOf`, `pathname: '/en/admin`, each Story file name, `adminPages.test`) → `src/app/[locale]/admin/__tests__/adminSlug.test.tsx` and `adminPages.test.ts` → `npm test --` 12/12, exit 0; `scripts/story-realmode-allowlist.json` and `scripts/ui-contract-registry.json` name Story files by path, none renamed (CI gates, A5).
  - `npm run typecheck` → exit 1 (the report says 2; the same command through Git Bash, as in Reviews 2-4), 80 errors, every one in `.next/types/validator.ts`, none in `src`. Not a finding (B6).
  - `npx eslint --no-warn-ignored --max-warnings 0` over the 16 files → exit 0.
- V4: read once: the whole diff. The case walks `src/stories` recursively, takes each single-quoted `pathname: '…'` containing `/admin` (every admin Story address is single-quoted: `grep -rnE "pathname[^,]{0,6}[\"\`]/admin" src/stories` → none), and fails naming each one `adminRouteOf` (`src/lib/auth/adminPages.ts:50-55`) does not resolve. `allowedPaths` (`AdminSidebar.stories.tsx:61`) holds routes and stays. Review 4's F7 is removed.
- V5: against `git show main:<path>`: `main`'s `AdminSidebar` and `AdminHeader` matched the raw address, so its Stories marked "Listings", "Locations", "Site settings" and headed "Listings"; the Stories now render the same states through the slug. The headings "Admin" of the Inquiries, Pages, Permissions and user profile Stories are `main`'s too (`git show main:src/components/admin/AdminHeader.tsx:18-35` has no key for those routes; production shows "Admin" on those pages, V5a): Task 1068.
- V5a: (1) Pages: Revision 4 changes no product file (`git diff --name-only 0179d9298 -- src` → Story files and one test), so no page renders differently from Review 4's measurement; the live reference for the Stories, `http://localhost:3000/uk/admin/support` in the owner's Chrome at 1440 px: the active item "Внутрішні тікети" 44 px, background `rgba(236, 84, 71, 0.1)`, colour `rgb(236, 84, 71)`, 16px/400, padding 8px 12px. (2) Stories: on the Storybook dev server, in the owner's Chrome (DevTools), the tab in front, every Story of the 15 changed Story files (72 Stories) at 320, 640, 1024 and 1440 px, an iframe of that width each (288 renders): every visible link, button, input, select, textarea, tab, heading, `th` and dialog read (height, radius, border width and colour, padding, font size and weight, colour, background, shadow), the shell's menu items (`a.mantine-NavLink-root`, `data-active`) and the header's text. No render overflows; no admin link without the slug; every Story with the menu has exactly one active item at every width, styled as the dev server's (44 px, `rgba(236, 84, 71, 0.1)`, `rgb(236, 84, 71)`, 16px/400, 8px 12px; visible at 320 and 640 px only where the menu is open: `AdminSidebar/*`, `AdminShell/DrawerOpen`). Active item and heading per file: `AdminSidebar` Default "Dashboard", ManagementActive "Listings", ContentActive "Locations", SystemActive "Site settings", ModeratorPages "Listings" (6 items); `AdminHeader` Default "Listings", UnknownPath "Admin", DrawerOpen "Dashboard"; `AdminShell` Default and DrawerOpen "Dashboard"/"Dashboard"; `AdminCurrenciesView` (4) "Currency"/"Currency"; `AdminPageFrame` "Currency"/"Currency"; `AdminDashboardView` (10) "Dashboard"/"Dashboard"; `AdminInquiriesView` (4) "Sales Inbox"/"Admin"; `AdminListingsView` (8) "Listings"/"Listings"; `AdminPagesView` (5) "Pages"/"Admin"; `AdminPermissionsView` (6) "Permissions"/"Admin"; `AdminReportsView` (3) "Reports"/"Reports"; `AdminSupportView` (3) "Internal Tickets"/"Internal Tickets"; `AdminUserProfileView` (11) "Users"/"Admin"; `AdminUsersTable` (6) and its container (1) "Users"/"Users". The controls at 1440 px keep Review 3's shapes (44 px, radius 8 px, 14px/500 for buttons; inputs 44 px, radius 8 px, border `rgb(208, 213, 221)`). No interactive element changes, so no Firefox look is asked by this revision (Review 4's list stands).
- V6: the diff adds or removes no allowlist entry, baseline row, `skip` or `eslint-disable`.
- V7: below.
- V8: R4-1's test fails without the change (V3: all 22 rows back, one row back, one row with a code outside the four), and passes with it.
- V9: the task's Stories for the owner's look, last: the 8 changed Story files of Review 3 (`VerifiedPage`, `HeroSearch`, `AdminDashboardView`, `AdminLocaleSwitcher`, `AdminPermissionsView`, `AdminUserProfileView`, `AdminUsersTable` and its container, `AgentStatisticsView`) and the 15 Story files of R4-1, with the active item and heading of each listed in V5a (2); `AdminSidebar` ManagementActive, ContentActive and SystemActive are the three to compare first.
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → the diff (200 files with Opus's rule and review files) triggers the same 60 sheets; each has its verdict in the record, exit 0. `Secure_Code_Review` and `Secure_Coding_with_AI` name this review.

## V7 — secure code review

- Six steps: (1) existing controls: no test weakened; one case added. (2) new vectors: none. (3) trust boundaries: none crossed. (4) no package. (5) no workflow, lockfile, CI table or agent configuration in the product diff. (6) below.
- Authorization: not touched (`git diff --name-only 0179d9298 -- src` shows no guard, action or access table; `adminRouteOf` is read, not changed).
- Input and output: not touched.
- Authentication and sessions: not touched.
- Requests and redirects: not touched.
- Next.js entry points: not touched.
- Business logic: not touched.
- JavaScript and TypeScript: the test's `/pathname: '([^']*)'/g` is a negated class with no nested quantifier, run over the repository's own Story files.
- Data exposure, errors, logging: not touched.
- Files: the test reads `src/stories` of the repository only (`readdirSync`, `readFileSync`), never input.
- Dependencies and configuration: not touched.
- Agent and tool output: the report is rerun claim by claim (V3); `check-files.mjs` runs on the kickoff, this review and the record (V12).
- Tests: R4-1's case fails when undone (V8).
- `db-catalog-audit.mjs`: not run; no table, policy, grant or function changes.

## Findings

No findings.

## Notes (no change asked)

- N7: the header falls back to "Admin" on 8 of the 20 admin pages on production (`/admin/footer`, `/admin/inquiries/sales`, `/admin/inquiries/support`, `/admin/listings/<id>/preview`, `/admin/pages`, `/admin/permissions`, `/admin/users/new`, `/admin/users/<id>`): `main`'s `PAGE_TITLES` (`src/components/admin/AdminHeader.tsx:20-35`) has no key for them and keys `'/admin/pages-admin'`, no route. Kept as on `main` by this task (A2); filed as Task 1068 (checklist A4).
- Reviews 1-4 and their revisions stand as written; F1-F7 are closed.

## Open parts

- Opus, after the push: `gh pr checks <n>` (V14).
- Opus, after the merge: the production checks of the kickoff's Route step 5.
