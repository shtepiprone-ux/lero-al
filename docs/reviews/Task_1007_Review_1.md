# Task 1007 — Review 1

Kickoff: [Sprint_93_kickoff_prompt_Task_1007_A_Moderator_Opens_Only_The_Admin_Pages_Switched_On.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_1007_A_Moderator_Opens_Only_The_Admin_Pages_Switched_On.md) · OWASP record: [Task_1007.json](../security/owasp/reviews/Task_1007.json)

Review 1 of the working tree on de99ecd87 (uncommitted, branch `task/1007-admin-page-access`) — NEEDS REVISION
Scope: 63 changed files and 8 new ones (`git diff --stat HEAD`, `git status --short`); every product file is named in the kickoff's Scope; the kickoff's
own uncommitted change is Opus's (O1007-3, the AC7 text). One existing test the kickoff did not name fails (F1).
Tools (local, 2026-11-24): `owasp.mjs sync`, `owasp.mjs check`, `check-ruleset.mjs` → exit 0; `gh run list --branch main --limit 3` → `success` on
`03c9a9773` (run 45341689705); the Route's ten files (`npm test -- <the ten files of Route step 4>`) → exit 0, 10 files, 315 passed, as reported; the
existing tests that import the changed code, outside the Route (21 files, among them `permissions.security.test.ts`, `staffAccess.security.test.ts`,
`serverNowProps.test.tsx`, `adminUsersNotice.security.test.tsx`, `previewIsNew.test.ts`) → exit 1, 1 failed, 344 passed (F1); the V8 breaks (ten, below)
→ each exit 1, each file restored byte for byte; `db-catalog-audit.mjs` (live, read-only) → exit 0, no finding; H4 on the three SQL files, LF and CRLF
(below); `owasp.mjs review <kickoff> --base main` → exit 0. Not run (A5): `tsc`, lint, the full unit and integration runs, build, census.
Findings: Critical 0, High 0, Medium 1 (F1), Low 0
Overall risk: the page guard, the three loaders, the sidebar and the landing follow the page keys and fail closed, each proven by a test that fails when the
check is removed; one existing unit test still expects the action keys alone, so `CI Required` would fail; the live table already holds the owner's page
switches, so the AC7 precondition does not hold (owner decision below).

## The owner's four questions

1. AC7 in the new wording (H4). `task1007-preflight.sql` read-only and `task1007.sql` + `task1007-rollback.sql` inside one transaction ended by
   `rollback`, LF copies (md5 preflight `f9f80652a27972c559ca159aebf59cb8`, apply `9eaea21b037227bd456909fd38630494`, rollback
   `2233b40a92a2d318befcfdedbf3296b1`) and CRLF copies (`bbbb938a061e1873ccee3d24fd6e3392`, `2b110a18827696eb0507f16f40bfd644`,
   `b67f6f7f6d1178b1729cd9099e7eb043`); the files on disk are LF (`git ls-files --eol`, `.gitattributes` `* text=auto eol=lf`). Both copies give the same
   result: the preflight runs read-only and reports row 1 = 11 `page.%` rows, row 2 = 1 moderator; after the apply 15 page keys (the 15 of `ADMIN_PAGES`),
   not all allowed; after the rollback 0 page rows; `role_permission_events` 22 before and after. The preflight's "no `page.%` row before the apply" does
   NOT hold: the table already holds 11 page rows written through the new section on 2026-11-24 08:49-08:50 UTC (12 events with an actor: ten pages on,
   `page.popular_locations` on, then off). So the rollback's `like 'page.%'` would also delete those 11 rows, and the apply leaves `page.popular_locations`
   off (`on conflict do nothing`); `roundtrip()` with a row query reports "11 row(s) only before the change". The files are correct for the state the
   kickoff assumed; the state is the owner's to decide (below). The after-apply part of AC7 waits for the apply.
2. IntlError in Storybook: present on `main`. `patterns-mantine-adminpermissionsview--default` logs "IntlError: ENVIRONMENT_FALLBACK: The `timeZone`
   parameter wasn't provided" with its stack at `format.dateTime` of the action rows, code that is the same on `main`; `.storybook/preview.tsx:112` passes
   no `timeZone` and is unchanged (`git diff main -- .storybook` empty); `main`'s Story `Default` already carries `updated_at` values
   (`git show main:src/stories/patterns/mantine/AdminPermissionsView.stories.tsx:27-28`). The app passes none either (`src/i18n/request.ts`,
   `src/app/admin/layout.tsx:60`, `src/app/[locale]/layout.tsx:46`). Outside this task (A4): filed as Task 1031. The diff adds one more call site (a page
   row with `updated_at`), not the cause.
3. The scripted edit of `src/lib/auth/permissions.ts`: clean. `file` → ASCII, LF; `git ls-files --eol` → `i/lf w/lf`; no mode change
   (`git diff HEAD --summary` empty); the diff is +34/−4, the three signatures and `allowedAdminPageKeys` only. Every changed and new file is LF.
4. V5a on the live pages through the owner's session: done as an administrator (the owner's session); measurements below. A moderator's view was not opened
   in this session (the owner's Chrome holds an administrator session; signing in as `HYDRATION_MODERATOR` would end it): `BLOCKED: no moderator session in
   the owner's browser`; the executor reports the owner saw it work; Route step 5 has Opus check it as the moderator after the merge.

## Secure code review (`secure-code-review.md` §2, §3)

1. Impact on existing controls: none weakened. `requireStaffPage` keeps every refusal of `main` and adds the page key (`src/lib/auth/staff.ts:102-104`);
   Permissions keeps administrator-only (`src/app/admin/permissions/page.tsx:14`); Footer becomes administrator-only at the guard (O1007-1); the writes keep
   `catalog.manage` and `support.manage`; the two currency and property-type reads move from `catalog.manage` to the page key (`currencies.ts:43`,
   `propertyTypes.ts:208`), so a moderator with the page switched on and without `catalog.manage` now reads both lists: the kickoff's design ("the read is
   the page's"), the columns read hold no secret (`currencies.ts:47`).
2. New attack vectors: none; the landing redirect takes its target from the constant `ADMIN_PAGES` (`src/app/admin/page.tsx:33-35`).
3. Trust boundaries: server ↔ database: `allowedAdminPageKeys` reads with the service role for display and routing only (`permissions.ts:50-71`);
   `role_permissions` stays without session grants (`db-catalog-audit.mjs` exit 0). Client ↔ server: the sidebar receives a list of paths only.
4. New integrations: none (`package.json` unchanged). 5. No regression: every changed assertion is as strict or stricter (the census now needs the page
   key, `staffPage.security.test.ts:138-144`; the counts include the page keys); one existing test was not updated (F1).
6. Categories: Authorization — touched: `staff.ts:102-104`, `currencies.ts:43`, `propertyTypes.ts:208`, `index.ts:826`, fail closed on a failed or throwing
   read (`permissions.ts:26`, `:64`, `:71`); the page keys gate reads only, the writes keep their action keys and database twins (Task 956), so no new twin
   is needed. Input and output — touched: `setModeratorPermission` accepts only `ACCESS_KEYS` and a boolean (`actions/permissions.ts:157`); labels and paths
   render as React text. Requests and redirects — touched: the landing redirect (constant target). Next.js entry points — touched: 22 pages (first await is
   the guard with its key, `[SEC-1007-PAGE-CENSUS]`), three `'use server'` loaders; `adminPages.ts` imports types only, safe for the client sidebar.
   Data exposure, errors, logging — touched: `allowedAdminPageKeys` logs the error code only (`permissions.ts:63`, `:70`). Business logic — the landing never
   redirects to `/admin` (`page.tsx:33`). Authentication and sessions, JavaScript and TypeScript, Files, Dependencies and configuration — not touched (no
   file of them in `git diff --name-only HEAD`). Agent and tool output — the executor's scratch outputs are outside the repository (`git status`). Tests — F1.
V6: no `skip`, `eslint-disable`, baseline or allowlist added; `scripts/mantine-migration-scope.json` gains seven files (an enrolment, stricter).

## Acceptance criteria (V8)

Each test run with its product change undone once (one literal replacement), then restored byte for byte (md5):
- AC1 `/admin/reports` passes `page.users` → `adminPages.test.ts` `[SEC-1007-PAGE-CENSUS]` fails (1 of 4).
- AC2 the key check removed from `requireStaffPage` → `staffPage.security.test.ts` `[SEC-1007-PAGE-DENY]` fails for every key.
- AC4 `getAllCurrenciesAdmin` admits any staff → 1 of 197 fails; `searchUsersForPicker` without `page.support` → 1 of 197 fails.
- AC5 the sidebar ignores `allowedPaths` → 4 of 9 fail; an empty group keeps its heading (O1007-3) → 2 of 9 fail; the landing gives every moderator the
  dashboard → 3 of 6 fail (`dashboardLanding.test.tsx`).
- AC6 a page switch toggles another key → T8 fails (1 of 8).
- AC10 the frame caps at 64rem → 1 of 4 fails; a page passes a prop to the frame → 1 of 4 fails.
- AC3 (`[SEC-1007-PAGE-SWITCH]`, CI `authz`) and AC9: UNKNOWN until `gh pr checks <n>`. AC7: the files pass H4 (above); the precondition and the
  after-apply check wait for the owner's decision and the apply. AC8: the executor's I8a and the V5a below; the CI part UNKNOWN.

## Rendered comparison (V5a)

Pages (`http://localhost:3000`, the owner's administrator session, Chrome, viewport 1920px; the window did not narrow when resized, `innerWidth` stayed
1920, so the narrower widths come from the Stories of the same component):
- The frame on all 18 rendered admin pages (`/admin`, `/admin/listings`, `/admin/users`, `/admin/support`, `/admin/inquiries/support`,
  `/admin/inquiries/sales`, `/admin/reports`, `/admin/locations`, `/admin/popular-locations`, `/admin/companies`, `/admin/pages`, `/admin/property-types`,
  `/admin/currency`, `/admin/email-templates`, `/admin/footer`, `/admin/settings`, `/admin/permissions`, `/admin/users/new` by code): padding 32px on
  every side, `max-width: none`, margin 0, width 1674-1680px of a 1914-1920px main (the 240px navbar aside), no horizontal overflow. `main`: caps from 672px
  (`permissions`) to 1792px and seven hand-written `max-w-3xl`-`max-w-5xl`; the change is O1007-2.
- `/admin/permissions`, the new section against the action rows: section card border 1px `rgb(208, 213, 221)`, radius 16px, title 16px, the same as the
  three other cards. Page row: label 14px/500 `rgb(0, 0, 0)`, path 12px/400 `rgb(71, 84, 103)`, "last updated" 12px/400 the same colour; action row: the
  same label and line styles plus the description and the monospace key (a page row shows its path as the description, as the kickoff says). Switch root
  38×44, track 38×20, radius 1000px, on `rgb(236, 84, 71)`, off `lab(85.152 0 0)`, the same for both; icon 16px, `rgb(2, 122, 72)` on, `rgb(71, 84, 103)` off,
  the same; divider 1px `rgb(228, 231, 236)`, the same; `aria-label` = the sidebar label. Row height 56px with an update line, 44px without (action rows
  74px: two more text lines).
- The sidebar as an administrator: every item and group as on `main`.
Stories (`http://localhost:6006`, iframes at 320, 640, 1024, 1440px):
- `AdminPermissionsView` `WithPagesSection`, sq, en, uk, it: 15 page rows; label 14px/500; switch 38×44; no clipped text; no horizontal overflow; the
  saving row `page_users` disabled; row height 56px or 44px from 640px, 44-92px at 320px (the path wraps under the label, the action rows 110-148px).
- `AdminSidebar` `ModeratorPages`, four locales: groups Overview, Management, Content (System hidden, O1007-3), items Dashboard, Listings, Inquiries
  support, Reports, Pages; item height 44px; group heading 12px/600; no overflow. `Default`: the four groups and every item, as on `main`.
- `AdminPageFrame` `Default` and `AdminDashboardView` `Default`: padding 24px at 320 and 640px, 32px at 1024 and 1440px, `max-width: none`, margin 0, no
  overflow; the dashboard grid adds no padding of its own (`framed={false}`).
Firefox: not reachable in this session; the only interactive change is the page `Switch`, the same Mantine control as the action rows: the owner's look.

## Stories for the owner (V9)

`Patterns/Mantine/AdminPermissionsView` `WithPagesSection` (pages on and off, one saving) and the other five exports (the section in each);
`Patterns/Mantine/AdminSidebar` `ModeratorPages`; `Patterns/Mantine/AdminPageFrame` `Default` (the six width exports are gone); every export of
`Patterns/Mantine/AdminDashboardView` inside the frame; the ten page View Stories without `width`. Measurements: above.

## Findings

F1 — an existing unit test still expects the action keys alone
Severity: Medium      Category: Tests      CWE: none
Location: src/modules/admin/actions/__tests__/permissions.security.test.ts:117
Description: `getModeratorPermissions` now returns `PERMISSION_KEYS` and `ADMIN_PAGE_KEYS` (`src/modules/admin/actions/permissions.ts:10`, `:63`); the test
still asserts `Object.keys(res).sort()` equals `[...PERMISSION_KEYS].sort()`. The kickoff's line "Existing tests the Fix breaks" names three other files
and missed this one (the design's gap); the executor ran only the Route's files.
Impact: `CI Required` fails on the unit run; no product defect.
Reproduction: `npm test -- src/modules/admin/actions/__tests__/permissions.security.test.ts` → exit 1, "returns every permission, off unless a row says
on, with who changed it": expected 21 keys, received 36 (the 15 `page.*` keys).
Recommendation: the assertion becomes `expect(Object.keys(res).sort()).toEqual([...PERMISSION_KEYS, ...ADMIN_PAGE_KEYS].sort())`, with the
`ADMIN_PAGE_KEYS` import from `@/lib/auth/adminPages`; nothing else in the file changes (as strict: every key present, nothing more).
Status: Revision 1 R1-1.

## Notes

- A4, outside this task: next-intl has no global time zone in the app or Storybook (question 2): filed as Task 1031.
- The executor's decision points: (1) AC7 is Opus's (above); (2) the landing never redirects to `page.dashboard`: in the code and its test; (3) the sq, uk
  and it texts of `pages_section_description` and `pages_access.none` are the owner's to read; (4) the release order holds: the SQL before the merge;
  (5) IntlError: question 2; (6) P-01 moves to fixed at the archive (H7); (7) the scripted edit: question 3; (8) commands are Opus's (H).

## Revision 1 (Sonnet; only this item)

- R1-1 (F1) `src/modules/admin/actions/__tests__/permissions.security.test.ts:117` expects `[...PERMISSION_KEYS, ...ADMIN_PAGE_KEYS].sort()`.

Open parts, in order: Revision 1 (Sonnet) → Review 2 → the owner's decision on the 11 existing page rows (keep them, or run `task1007-rollback.sql`
first so the apply seeds all 15 on) → the apply of `task1007.sql` and the AC7 after-apply check → the commit and pull request (H) → `gh pr checks <n>` →
the merge → the moderator check of Route step 5.
