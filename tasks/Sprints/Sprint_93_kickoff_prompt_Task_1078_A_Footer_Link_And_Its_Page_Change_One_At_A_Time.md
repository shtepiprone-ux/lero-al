# Task 1078 — A footer link and its page change one at a time

Sprint 93. Priority P3. Owner decision O1078-1 (2026-11-28, translated, on Task 990 Review 1 F5): "Create a separate
task." O1078-2 (2026-11-28, translated): "I allow" — the integration test writes the real `it` row of `site_footer` and
restores it in `finally`, the restore checked equal (an exception to D91's synthetic fixtures). Found in Task 990
Review 1 (F5, CWE-367). After Task 990 (its guard is the code this task makes atomic).
Implementer: Sonnet (the SQL files, the action changes, the tests); Opus (the rollback proof and the catalog snapshot
after the owner's apply). Reviewer: Opus. Human owner of the change: the owner.

## Goal

Task 990 keeps an enabled footer link and its page together: a page a footer names is not deleted, unpublished or
renamed, and a footer is not saved with a link to a page that is not published. Each side checks and then writes in two
separate requests, so two administrators acting at the same moment can each pass their check and leave a footer link
that answers 404. After the task the database itself refuses the second write, both sides take one lock, and the
administrator sees the same message as today.

## Cause

- The page side reads the footers, then writes, in two requests: `deletePage` calls `footerLocalesLinking`
  (`src/modules/admin/actions/index.ts:414`) and deletes afterwards (`src/modules/admin/actions/index.ts:417`);
  `updatePage` checks at `src/modules/admin/actions/index.ts:383` and updates at `src/modules/admin/actions/index.ts:404`.
- The footer side reads the published pages, then writes, in two requests: `saveFooterShared` checks at
  `src/modules/admin/actions/footer.ts:170` and updates the four rows at `src/modules/admin/actions/footer.ts:186`;
  `upsertFooterContent` checks at `src/modules/admin/actions/footer.ts:228` and upserts at
  `src/modules/admin/actions/footer.ts:232`.
- The database does not hold the rule: `pages` and `site_footer` have only their `updated_by_name` triggers
  (`node scripts/quality/db-catalog-audit.mjs --save <scratch file>` → exit 0 on 2026-11-28, `triggers`:
  `pages_updated_by_name`, `site_footer_updated_by_name`), and no CHECK or function names a footer link.

Fix: one owner-applied SQL file adds two `BEFORE` row triggers that take one transaction lock and check the rule inside
the write; the four actions map the trigger's refusal to the error they already return.

## Scope

- `supabase/sql_migrations/task1078/task1078.sql` (new, owner-applied, LF, one `begin; ... commit;`, every object
  schema-qualified, as `supabase/sql_migrations/task957/task957.sql:17-37` and `:56-86`):
  - `public.footer_link_path(url text) returns text`, `immutable`: the same steps as `normalizeInternalPath`
    (`src/lib/footer-route-allowlist.ts:21-27`) after `trim()`: leading and trailing white space removed, cut at the
    first `?`, then at the first `#`, one trailing `/` removed when longer than one character.
  - `public.pages_footer_guard()` trigger function, `security definer`, `set search_path = ''`: first
    `perform pg_advisory_xact_lock(hashtextextended('task1078:footer-pages', 0))`; on `DELETE`, on `UPDATE` with
    `old.is_published and not new.is_published`, and on `UPDATE` with `new.slug is distinct from old.slug`, it raises
    `using errcode = '23514', message = 'page_in_footer'` when an element of `nav_links`, `info_links` or
    `social_links` of any `public.site_footer` row has `enabled` = JSON `true` and a URL starting with `/` whose
    `footer_link_path` equals `'/' || old.slug` (the rule of `footerLocalesLinking`, `index.ts:345-362`). Trigger
    `pages_footer_guard` `before delete or update of slug, is_published on public.pages for each row`.
  - `public.site_footer_pages_guard()` trigger function, the same lock first: it raises
    `using errcode = '23514', message = 'invalid_internal_link'` when an element of the three lists of `new` has
    `enabled` = JSON `true`, a URL starting with `/`, a `footer_link_path` outside the array
    `array['/', '/contact', '/favorites', '/listings', '/listings/create']` (on a line of its own ending
    `-- STATIC_INTERNAL_PATHS`), and no `public.pages` row with `is_published` and `slug` equal to that path without
    its leading `/` (the rule of `checkCmsSlugs`, `footer.ts:68-90`). Trigger `site_footer_pages_guard`
    `before insert or update of nav_links, info_links, social_links on public.site_footer for each row`.
  - `revoke execute` on the three functions `from public, anon, authenticated`.
- `supabase/sql_migrations/task1078/task1078-rollback.sql` (new): drops the two triggers and the three functions.
- `supabase/sql_migrations/task1078/task1078-verify.sql` (new, read-only, one statement, rows `n, check_name, ok` as
  `supabase/sql_migrations/task1022/task1022-verify.sql`): both triggers exist with their events; both trigger
  functions are `security definer` with `search_path=""`; `anon` and `authenticated` cannot execute the three functions.
- `src/modules/admin/actions/index.ts`: `updatePage` and `deletePage` — a write error with `code` `'23514'` and
  `message` `'page_in_footer'` returns `{ error: 'page_in_footer', locales }`, the locales read again with
  `footerLocalesLinking` (`'transient'` when that read fails); every other error as today.
- `src/modules/admin/actions/footer.ts`: `saveFooterShared` and `upsertFooterContent` — a write error with `code`
  `'23514'` and `message` `'invalid_internal_link'` returns the result of `checkCmsSlugs` read again, or
  `{ error: 'invalid_internal_link', links: [] }` when that read finds nothing; every other error as today.
- `src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts` (extended): the four mappings.
- `src/lib/__tests__/footerStaticPathsSql.test.ts` (new): the array on the `-- STATIC_INTERNAL_PATHS` line of
  `task1078.sql` equals `STATIC_INTERNAL_PATHS` (`src/lib/footer-route-allowlist.ts:8-14`).
- `src/tests/integration/footerPagesGuard.integration.test.ts` (new): the cases of AC1-AC3, synthetic pages
  `it1078-<RUN>` through `createRun()` (`src/tests/integration/fixtures.ts`); the `it` row of `site_footer` is read
  first and restored in `finally`, the restore checked equal (owner decision O1078-2, 2026-11-28).
- `supabase/catalog.json` (Opus, after the owner's apply): `db-catalog-audit.mjs --save supabase/catalog.json`.
- Dependencies: none.
- Out of scope: the write grants of `authenticated` on `site_footer` (Task 1079); the `site_settings` write of
  `saveFooterShared` before its footer write (`footer.ts:174-183`), which a refused footer write does not undo; the
  messages, the admin pages and their components.
- Kept as on `main` (checklist A2), with Task 990 merged: every application check, its order and its result; the
  errors `page_in_footer` with its locales and `invalid_internal_link` with its links; the toasts and inline errors of
  `AdminPagesManager.tsx` and `AdminFooterManager.tsx`; the grants and policies of `pages` and `site_footer`; the
  `updated_by_name` triggers.

## Attack surface

Changes: a business invariant is enforced in the database.

1. What are we working on? The four Server Actions above (staff with `legal.manage` for pages, an administrator for
   the footer) and, through the grant Task 1079 removes, an administrator's session writing `site_footer` directly.
   Trust boundary: the database, which now holds the rule for every writer.
2. What can go wrong? T1 — Tampering (abuse case "race two requests"): a page change and a footer save interleave and
   both pass. T2 — Tampering: a writer outside the actions (the direct grant, a future action) skips the
   application check. T3 — Denial of service: the lock serialises every page and footer write; these are rare staff
   writes. T4 — Elevation: a `security definer` function callable by a session.
3. What are we going to do about it? T1 mitigate: both triggers take one transaction lock, then read with a fresh
   snapshot → AC1, AC2. T2 mitigate: the triggers run for every writer → AC1, AC2. T3 mitigate: a transaction lock (`pg_advisory_xact_lock`), released
   at the end of each write's one-statement transaction, taken only by staff writes of two tables → AC1, AC2. T4 mitigate: execute revoked from `public`, `anon`,
   `authenticated` → AC4.
4. Did we do a good enough job? Each mitigation has its `SEC-1078-*` case; the rollback proof covers the apply.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-28).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — the abuse case "race two requests" is T1 of the threat model, answered by the lock — AC2.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — the writers of `pages` and `site_footer` are named in the threat model; Task 1079 removes the session one — AC1, AC2.
- Authorization: "Implement defense in depth. Do not depend on any single framework, library, technology, or control to be the sole thing enforcing proper access control." — the rule moves from the actions alone to the actions and the database — AC1, AC2.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — a refused write writes nothing; a failed re-read returns `transient` — AC3.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — the triggers run on the two tables themselves — AC1, AC2.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — the integration cases fail when a trigger is dropped or loses a condition — AC1, AC2.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — the `SEC-1078-*` cases run against the real database — AC1, AC2.
- Bot_Management_and_Anti-Automation: not applicable — staff-only writes behind `legal.manage` and the administrator check; no public entry point.
- Business_Logic_Security: "Each of these is a race condition waiting to happen unless the check and the act are inside a single atomic operation." — the check runs inside the write, after one transaction lock — AC1, AC2.
- Credential_Stuffing_Prevention: not applicable — no sign-in, credential or account recovery path is touched here.
- Cross_Site_Scripting_Prevention: not applicable — no output, markup or rendering changes; the admin components are unchanged.
- DOM_based_XSS_Prevention: not applicable — no browser code changes; the admin components stay as on `main`.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — the definer functions are executable by no session role — AC4.
- Denial_of_Service: not applicable — the lock is transaction-scoped and taken only by rare staff writes of two tables.
- GraphQL: not applicable — the project has no GraphQL endpoint; the SQL is a fixed schema change.
- Injection_Prevention: "The preferred option is to use a safe API which avoids the use of the interpreter entirely or provides a parameterized interface" — the functions use no dynamic SQL; the URL is compared as a value — AC1, AC2.
- Input_Validation: "Reject invalid requests with a clear error; do not continue with partially validated data." — a refused write returns today's named error and writes nothing — AC3.
- Insecure_Direct_Object_Reference_Prevention: not applicable — the page id and footer locale checks of the actions are unchanged.
- JavaScript_and_TypeScript_Security: not applicable — the action change compares two strings; no merge, regular expression or dynamic key.
- Mass_Assignment: not applicable — no field becomes writable; the patch objects of the actions are unchanged.
- Multi_Tenant_Security: not applicable — pages and the footer are site-wide content with no tenant of their own.
- Nextjs_Security: "Return only authorized result fields because Server Action return values are serialized to the client." — the refusal returns only the error code and the locale or link list of today — AC3.
- Prototype_Pollution_Prevention: not applicable — no object is built from client keys in the changed lines.
- Query_Parameterization: not applicable — the SQL is fixed text the owner applies; no query is built from input.
- React_Security: not applicable — no React component, prop or rendered value changes in this task.
- SQL_Injection_Prevention: not applicable — no statement is concatenated; the trigger reads columns, never builds SQL.
- Secure_Code_Review: "Security-Focused Review differs from functional code review by specifically targeting security concerns" — the review runs `secure-code-review.md` §2 and §3 over the SQL and the actions — AC1-AC5.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency; every claim is rerun by the reviewer — AC1-AC6.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — each threat of "## Attack surface" is an acceptance criterion — AC1-AC4.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — the four answers are in "## Attack surface" — AC1-AC4.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reproduces every failing-first run and exit code — AC1-AC6.
- Web_Frontend_Security: not applicable — no browser code, header or storage changes in this task.

## UI

No visible change: the administrator sees the same `page_in_footer` and `invalid_internal_link` messages as today.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 The page side holds in the database — test: `src/tests/integration/footerPagesGuard.integration.test.ts`:
  `SEC-1078-PAGE-DENY`: with the `it` footer row naming the page enabled, as `/it1078-<RUN>` and as
  ` /it1078-<RUN>/?x#y`, a service-role delete, unpublish and slug change of that page fail with `23514`
  `page_in_footer` and the page is unchanged; `SEC-1078-PAGE-ALLOW`: with the link disabled, the same writes succeed.
- AC2 The footer side holds in the database — test: `src/tests/integration/footerPagesGuard.integration.test.ts`: `SEC-1078-FOOTER-DENY`: a service-role update of
  the `it` row with an enabled link to an unpublished or missing `it1078-<RUN>` page fails with `23514`
  `invalid_internal_link` and the row is unchanged; `SEC-1078-FOOTER-ALLOW`: the row written back unchanged, a
  disabled link, an external URL and each static path succeed; `SEC-1078-RACE`: 10 rounds of `Promise.all` of
  "add the link" and "delete the page" never end with both committed.
- AC3 The administrator sees today's message — test: `src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts`: the trigger's
  `23514` refusal of each of the four writes returns `page_in_footer` with the locales read again, or
  `invalid_internal_link` with the links read again (and `links: []` when the re-read finds none); another `23514`
  message stays `save_error`/`delete_error`/`transient` as today.
- AC4 The functions are not a session's — test: `task1078-verify.sql` every row `ok = true` and
  `node scripts/quality/db-catalog-audit.mjs` exit 0 after the apply (Opus, read-only).
- AC5 The way back is proven — test: `node scripts/quality/db-sql-roundtrip.mjs supabase/sql_migrations/task1078/task1078.sql supabase/sql_migrations/task1078/task1078-rollback.sql`
  exit 0, LF and CRLF (Opus, before the owner's apply; checklist H4).
- AC6 The static paths agree — test: `src/lib/__tests__/footerStaticPathsSql.test.ts`.
- AC7 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. Starts after Task 990 is merged. Branch from `main`. Read the
   files of "## Cause", `supabase/sql_migrations/task957/task957.sql` and
   `src/tests/integration/rateLimit.integration.test.ts`.
2. Tests first (AC1-AC3, AC6); save each failing output (AC1 and AC2 fail until the owner applies the SQL).
3. The three SQL files, then the two action files. Do not apply the SQL.
4. Run the "Route tests" below and every test both searches of `quality-gates.md` §8.1 find over the changed files,
   each by the command §8.1 names; `npm run typecheck`; ESLint on the changed code files (checklist I8). Nothing else
   locally; CI on GitHub only (`gh pr checks <n>`).
5. Report: each command, exit code, relevant output; the failing-first runs; one deliberate break of each action mapping.
6. Opus, after the review: AC5; the owner applies `task1078.sql`, then `task1078-verify.sql`; Opus AC4 and the snapshot;
   `npm run test:security-integration -- src/tests/integration/footerPagesGuard.integration.test.ts` exit 0 before the push.

### Route tests

Both searches of §8.1 on 2026-11-28 over `src/modules/admin/actions/index.ts` and `src/modules/admin/actions/footer.ts`
(the tree of Task 990 Review 1): the import graph, default collection → exit 0, 39 files, 838 tests; integration
collection → exit 0, 8 files, 52 tests; the text search (`modules/admin/actions/index|modules/admin/actions/footer|
modules/admin/actions['"]|footerLocalesLinking|checkCmsSlugs`). Repeat both searches after Task 990 is merged.

Default collection, `npm test --` (39 by the graph, 4 by text only, 1 new): `src/__tests__/reactHooksV7Components.test.tsx`, `src/__tests__/security/staffActions.test.ts`, `src/app/[locale]/admin/__tests__/adminSlug.test.tsx`, `src/app/[locale]/admin/footer/__tests__/footerPage.test.tsx`, `src/app/[locale]/admin/settings/__tests__/settingsPage.test.tsx`, `src/app/[locale]/admin/users/__tests__/adminUserGone.security.test.ts`, `src/app/[locale]/admin/users/__tests__/adminUsersNotice.security.test.tsx`, `src/app/__tests__/serverNowProps.test.tsx`, `src/components/admin/__tests__/AdminFooterManager.shared.test.tsx`, `src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx`, `src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx`, `src/components/admin/__tests__/AdminSettings.seo.test.tsx`, `src/components/admin/__tests__/AdminSupportManager.smoke.test.tsx`, `src/components/admin/__tests__/AdminUserCreate.watch.test.tsx`, `src/components/admin/__tests__/AdminUserProfile.bounds.security.test.tsx`, `src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx`, `src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx`, `src/components/admin/__tests__/adminPagesHydration.test.tsx`, `src/components/layout/__tests__/FooterView.security.test.tsx`, `src/lib/account/deleteAccount.security.test.ts`, `src/lib/auth/__tests__/moderatorKeys.security.test.ts`, `src/lib/auth/staffAccess.security.test.ts`, `src/modules/__tests__/noDbMessage.security.test.ts`, `src/modules/admin/actions/__tests__/adminActorRank.security.test.ts`, `src/modules/admin/actions/__tests__/adminCatalog.security.test.ts`, `src/modules/admin/actions/__tests__/adminOperations.security.test.ts`, `src/modules/admin/actions/__tests__/adminPermissions.security.test.ts`, `src/modules/admin/actions/__tests__/adminResults.security.test.ts`, `src/modules/admin/actions/__tests__/createAdminUser.security.test.ts`, `src/modules/admin/actions/__tests__/hardDeleteUser.smoke.test.ts`, `src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts`, `src/modules/admin/actions/__tests__/profileBounds.security.test.ts`, `src/modules/admin/actions/__tests__/updateUserProfileFull.smoke.test.ts`, `src/modules/admin/actions/__tests__/userAdministration.security.test.ts`, `src/modules/admin/actions/__tests__/userWebsite.security.test.ts`, `src/modules/admin/actions/accountBan.security.test.ts`, `src/modules/cabinet/components/__tests__/CabinetShell.now.test.tsx`, `src/modules/cabinet/components/__tests__/ProfileTab.deletePassword.security.test.tsx`, `src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx`; text only: `src/__tests__/security/filterStrings.test.ts`, `src/__tests__/security/publicListingsTag.test.ts`, `src/modules/admin/__tests__/adminOrphans.test.ts`, `src/modules/admin/actions/__tests__/footerContent.security.test.ts`; new: `src/lib/__tests__/footerStaticPathsSql.test.ts`.

Integration collection, `npm run test:security-integration --` (8 by the graph, 1 new): `src/lib/account/deleteAccount.integration.test.ts`, `src/lib/auth/sessionEnd.integration.test.ts`, `src/lib/auth/staffAccess.integration.test.ts`, `src/modules/admin/actions/accountBan.integration.test.ts`, `src/modules/admin/actions/adminPermissions.integration.test.ts`, `src/modules/admin/actions/userProfileFields.integration.test.ts`, `src/tests/integration/adminPage.integration.test.ts`, `src/tests/integration/moderatorKeys.integration.test.ts`; new (after the owner's apply): `src/tests/integration/footerPagesGuard.integration.test.ts`.

## Review
