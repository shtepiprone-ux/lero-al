# Task 988 — Review 3

Kickoff: [Sprint_94_kickoff_prompt_Task_988_The_Chosen_Language_Stays.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_988_The_Chosen_Language_Stays.md) · OWASP record: [Task_988.json](../security/owasp/reviews/Task_988.json)

Review 3 of the working tree on 913e9c65d (Revision 2, branch `task/988-chosen-language-stays`, uncommitted) — NEEDS REVISION
Scope: diff-based; `git diff --stat 913e9c65d -- src scripts` → 11 files (+280, −276): the walk table and its test, four CI tables and two gate scripts (R2-1), the crawler rule and its test (R2-3), one integration case (R2-4); `scripts/governance/reports/component-catalog.latest.json` changed but ignored by Git (`.gitignore:64`). The `.claude/`, `docs/` and `tasks/` changes are Opus's. Entry points: none new; `robots.txt` (public) changes one rule; the sign-up trigger was broken once and restored on the real project (D91).
Tools: `owasp.mjs sync`, `check`, `check-ruleset.mjs` → exit 0; `main` CI 45833291216 and 45825365315 green; typecheck → exit 1, 80 errors, all in the stale `.next/types/validator.ts` (B6); ESLint on the 7 changed code files → exit 0; `vitest related` → 3 files, 86/86; integration graph → 1 file, 2/2; `client-sinks.mjs` → exit 0; `src/lib/__tests__/pureLibs.test.ts` → 1 failed of 101 (F5).
Findings: Critical 0, High 0, Medium 0, Low 2
Overall risk: Revision 2 does what Review 2 asked and every claim of its report reproduces; the move of Scope 5 still leaves one unit test red (the reserved CMS slugs: `admin` is now a static route under `[locale]`), and the new crawler rule hides public addresses that start with `admin`.

## Checklist V

- V1: `node scripts/quality/owasp.mjs sync` → "142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0", exit 0; `check` → "every one read at its current version, every quote verified", exit 0; `check-ruleset.mjs` → "the live ruleset matches", exit 0; `gh run list --branch main --limit 3` → Repository settings 45834513363 success, CI 45833291216 success (schedule), CI 45825365315 success (Task 1053, #82). No pull request exists for the branch yet (`gh pr list --head task/988-chosen-language-stays --state all` → none).
- V2: `git diff --stat 913e9c65d` → the 11 product files above plus Opus's documentation and rules. Each is an item of Revision 2: the walk table, `PAGE_ROOTS`, comments and two lines of logic (deviation 1: `routeOf` cuts `src/app/[locale]`, the landing target carries `/sq`; both needed for the table to follow the move, both tested, V8), `check-signed-in-pages.test.ts` (deviation 2: Scope 5, "every test path follow the move"; 41 lines, paths and the `/en` → `/sq` expectation only), `MIGRATION_SIGNATURE` (deviation 3, V6), the gitignored catalog (deviation 4: no effect on the commit). No hunk outside Revision 2.
- V3: every claim of the report reproduces:
  - `npm test -- src/app/__tests__/robots.test.ts` → 4/4, exit 0.
  - `npm run test:security-integration -- src/tests/integration/accountLocale.integration.test.ts` with `SECURITY_TEST_TARGET=development` and `SECURITY_TEST_PROJECT_REF` (the ref of `NEXT_PUBLIC_SUPABASE_URL`; `project-facts.md`, D91) → 2/2, exit 0.
  - §8.1 import graph: `npx vitest related --run --reporter=verbose` over the 11 files → 3 files (`check-signed-in-pages.test.ts` 73, `robots.test.ts` 4, `sitemap.security.test.ts` 9), 86/86, exit 0; with `--config vitest.integration.config.ts` → 1 file, 2/2, exit 0.
  - §8.1 text search (the paths of the 11 files without `src/` and the extension, plus `MIGRATION_SIGNATURE`, `AWAY_FROM_ADMIN`, `moderatorExpectation`, `pageKeyOf`, `ROUTES`) → 6 test files; beyond the graph: `adminSlug.test.tsx`, `sweep-synthetic.test.ts`, `adminPages.test.ts` (a match of `ADMIN_ONLY_ROUTES`, run anyway) → `npm test --` 24/24; `node --test scripts/quality/robots-sitemap-live.test.mjs` → 3 skipped (no `BASE_URL`), exit 0.
  - `npm run typecheck` → exit 1 (the report says 2; the same command through Git Bash, as in Review 2), 80 errors, every one in `.next/types/validator.ts`; none in `src` or `scripts`. Not a finding (B6).
  - `npx eslint --no-warn-ignored --max-warnings 0` over the 7 changed code files → exit 0.
  - `node scripts/quality/client-sinks.mjs` → "580 files, every sink controlled or reviewed", exit 0; `node --test client-sinks.test.mjs check-files.test.mjs` → 36/36.
  - The CI tables: each changed table, with the moved paths substituted back (`(site)/` and `[locale]/admin/` removed), equals its `913e9c65d` bytes (`cmp`): `surface-census-baseline.json`, `tailwind-entropy.allowlist.json`, `i18n-dynamic-manifest.json`, `type-responsive-baseline.json`. `computeMigrationSignature(MIGRATION_TARGETS)` → `0408cfdb…` = the new constant; over the old paths → `25eba7c6…` = the old constant.
  - No path of the old tree is left in `scripts`, `.github`, `eslint.config.mjs`, `package.json` or the vitest and Playwright configs (`grep -rnE "src/app/admin|src/app/\[locale\]/(\[slug\]|auth|cabinet|ci|contact|favorites|listings|page\.tsx)"` → none).
  - A test the Route, the report and Review 2 left out: `src/lib/__tests__/pureLibs.test.ts` [reserved slugs] builds its folder with `join(process.cwd(), 'src', 'app', '[locale]')`, which neither §8.1 search sees (no import, no path string); found here by a search for tests naming `'[locale]'` as a path segment (10 files, `npm test --` → 207/208): F5.
- V4: read once: the whole Revision 2 diff, and the sources its comments cite: `src/app/[locale]/admin/layout.tsx:25` (`redirect(`/${locale}`)` for a non-staff role), `src/app/[locale]/admin/page.tsx:29-43` and `:35` (`adminHref(await getAdminLocale(), page.paths[0])`), `permissions/page.tsx:20`, `footer/page.tsx:19`; `(site)/cabinet/statistics/page.tsx:38` and `(site)/listings/[slug]/edit/page.tsx:96` keep the lines `main` cites (both files equal `main` byte for byte). Review 2's F1, F3 and F4 are removed. The walk's synthetic users get no language metadata, so the applied trigger gives them `sq` (`task988.sql`), which the table's `/sq` addresses and `AWAY_FROM_ADMIN` assume.
- V5: against `git show main:<path>`: `robots.ts` keeps `main`'s rule "the admin panel … not for search engines" (Task 923 R72 (h)) for the admin under the slug, but `'/*/admin'` also disallows public addresses that `main` lets crawlers read (F6). The walk's expectations change only where O988-4 moved the admin (addresses `/sq/admin/...`, the non-staff target `/sq`).
- V5a: Revision 2 changes no visible element. (1) Pages: `http://localhost:3000/sq/admin/users` in the owner's Chrome (extension) → `/uk`: the session there is not a staff session, so the 22 admin pages are `BLOCKED: no staff session in the owner's Chrome` (as in Review 2). (2) Stories (Review 2's open part): the 51 Stories of the 8 Story files the task changed, on the Storybook dev server in the owner's Chrome, each at 320, 640, 1024 and 1440 px (204 renders, an iframe of that width each): every link, button, input and tab measured (height, radius, border width and colour, padding, font size and weight, colour, shadow). No render overflows its width; `HeroSearch/Fallback` has no control at any width (its fallback state). The shapes per file: `HeroSearch` 5 button shapes, 44px r8 14px/500; `AdminLocaleSwitcher` 2 (idle `rgb(52, 64, 84)`, pending `rgb(102, 112, 133)`), 44px r8 14px/500 with shadow; `VerifiedPage` 1 link, 44px r12 14px/500 white; `AdminDashboardView` 12 button and 30 link shapes, `AdminPermissionsView` 3 and 2, `AdminUserProfileView` 15 and 3, `AdminUsersTable` 12 and 6, `AdminUsersTableContainer` 9 and 6, `AgentStatisticsView` 11 and 12, the primary controls 44px r8 14px/500 as `HeroSearch` and the switcher. Every admin link carries the slug (`/en/admin`, `/en/admin/users/<id>`, `/en/admin/listings`; Storybook's locale is `en`). Against `main`: the 8 Story files change only comments, one docs string and one import path (`git diff main -- src/stories`, 11 lines), and the 16 components the task changed change no visual prop (`git diff main` over their `.tsx`: only `href`, `router.push` targets and the `NotificationItem` link variable), so `main` renders the same shapes; `main`'s Storybook was not run beside it.
- V6: the diff adds or removes no allowlist entry, baseline row, `skip` or `eslint-disable`; it renames the path of 4 allowlist and baseline rows, 174 census rows and 2 migration targets and recomputes one signature, each proven equal to its base by the reverse substitution and the signature recomputation of V3. A planted bad case through the same checkers (`check-tailwind-entropy`, `check-type-responsive`, the census, `check-homepage-theme-runtime-deps`) is not run: they are product gates, which A5 runs only in CI. Reported to the owner as a contradiction between V6 and A5 (A16).
- V7: below.
- V8: each change of Revision 2 undone once (one exact string replaced, the test run, the file restored from its bytes, sha256 equal; `git status --short src scripts` hash equal before and after):
  - R2-3: `'/*/admin'` removed from `robots.ts` → `robots.test.ts` 1 of 4 fails; restored `116524e7…`.
  - R2-1: the walk's admin row back to `src/app/admin/page.tsx` → `check-signed-in-pages.test.ts` fails at load (`TypeError: Cannot read properties of undefined (reading 'path')`, its `templateOf`), and `checkRouteTable(ROUTES, listPages())` names both "route table row has no page: /sq/admin (src/app/admin/page.tsx)" and "page missing from the route table: src/app/[locale]/admin/page.tsx"; `routeOf` back to `/^src\/app/` → 19 of 73 fail; the landing target without `/sq` → 2 of 73 fail; `AWAY_FROM_ADMIN` back to `/en` → 1 of 73 fails; restored `d21bea21…`.
  - R2-4 (AC4, the trigger, D91, one break, `finally` restores): before: catalog fingerprint `0a07c216` (sha256 of `readCatalog()` of `db-catalog-audit.mjs`), `md5(prosrc)` `a7475919`, verify 1-4 true; the four-code check replaced by `if v_locale is null` → verify row 1 false, AC4 fails ("fixture: could not create user signup-locale-xx"; INFERENCE: the column check `users_preferred_locale_check` refuses `xx`, so the sign-up itself fails), AC3 passes; after `task988.sql`: catalog `0a07c216`, body `a7475919`, verify 1-4 true, equal. `auth.users` holds 0 synthetic sign-up users afterwards.
- V9: Revision 2 changes no Story. The task's changed Stories for the owner's look, last: `VerifiedPage` (Success, Error state, Sync fail, Locale stress), `HeroSearch` (Default, Fallback, Container), `AdminDashboardView` (10 states), `AdminLocaleSwitcher` (Idle, Pending), `AdminPermissionsView` (6), `AdminUserProfileView` (11), `AdminUsersTable` (6) and its container (1), `AgentStatisticsView` (8); measurements in V5a (2).
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → the diff (185 files with Opus's rule files) triggers 60 sheets; each has its verdict in the record, exit 0. `Authorization_Regression_Testing` changes from the F1 finding to `met`; `Secure_Code_Review` and `Secure_Coding_with_AI` name this review. F5 and F6 map to no sheet (a CMS slug check and a crawler rule).

## V7 — secure code review

- Six steps: (1) existing controls: the walk still fails a role that sees a page it must not (`check-signed-in-pages.test.ts` "a plain user must not see an admin page", now on `/sq/admin/reports`); no test weakened: every changed expectation follows a moved path, none is removed. (2) new vectors: none. (3) trust boundaries: none crossed. (4) no package. (5) CI tables change paths only (V6); no workflow, lockfile or agent configuration in the product diff. (6) below.
- Authorization: touched (tests only). The role regression walk covers the 22 moved admin pages and the moderator's switches after the slug (V8).
- Input and output: not touched (`git diff --name-only 913e9c65d -- src` shows no validator or renderer).
- Authentication and sessions: not touched.
- Requests and redirects: not touched in code; the walk's expected redirects follow `src/app/[locale]/admin/layout.tsx:25` and `page.tsx:35`.
- Next.js entry points: touched: `src/app/robots.ts:23` (F6); no route, Server Action or proxy change.
- Business logic: not touched.
- JavaScript and TypeScript: `routeOf` (`scripts/check-signed-in-pages.mjs:149`) is an anchored regular expression with no quantifier over input.
- Data exposure, errors, logging: not touched.
- Files: not touched.
- Dependencies and configuration: not touched.
- Agent and tool output: the report is rerun claim by claim (V3); `check-files.mjs` runs on the kickoff, this review and the record (V12).
- Tests: R2-1, R2-3 and R2-4 each fail when undone (V8); F5 is a red test of the move.
- `db-catalog-audit.mjs`: not run; the diff changes no table, policy, grant or function (the trigger break of V8 left the catalog fingerprint equal).

## Findings

F5 — `admin` became a static route under `[locale]` but is not a reserved CMS slug, and the test that holds the list sees only the admin folder
Severity: Low      Category: Tests, Next.js entry points (routing)      CWE: —
Location: `src/lib/reserved-slugs.ts:5-14`, `src/lib/__tests__/pureLibs.test.ts:21-24`
Description: the move of Scope 5 put the admin at `src/app/[locale]/admin` and every site route into `src/app/[locale]/(site)/`. `RESERVED_SLUGS` ("Keep in sync with src/app/[locale]/* directory entries") has no `admin`, and the test reads only `src/app/[locale]`, skipping folders that start with `(`, so it now sees one route (`admin`) and none of the site's.
Impact: CI's unit job fails (`expected 1 to be greater than 3`, and `admin` is not reserved); an administrator can save a CMS page with the slug `admin` (`src/lib/slug-validator.ts:11` lets it through), whose address `/<language>/admin` now opens the admin panel, so the page is never reachable; on `main` that address served the CMS page. No live page uses the slug (read-only, 2026-11-26: 0 rows of `public.pages` with `admin%`).
Reproduction: `npm test -- src/lib/__tests__/pureLibs.test.ts` → "every static route under [locale] is reserved…" failed, "AssertionError: expected 1 to be greater than 3", exit 1; `ls src/app/[locale]` → `(site) admin layout.tsx`.
Recommendation: Revision 3, R3-1.
References: kickoff Scope 5 ("every test path follow the move"), AC6; checklist A2, A4; `quality-gates.md` §5.
Status: open

F6 — `'/*/admin'` also hides public addresses whose segment starts with `admin`
Severity: Low      Category: Next.js entry points (crawler rules)      CWE: —
Location: `src/app/robots.ts:23`
Description: a robots rule matches by prefix and `*` matches any characters, so `/*/admin` disallows `/sq/listings/administrative-office-…` (`generateSlug`, `src/modules/listings/lib/generateSlug.ts:8-19`, builds the slug from the title) and a CMS page `/sq/administrata`, as well as `/sq/admin/...`.
Impact: a public listing or page whose address segment starts with `admin` is no longer read by search engines; `main` lets them be read (A2). Read-only on 2026-11-26: 0 listings and 0 pages with such a slug today.
Reproduction: `src/app/robots.ts:23` → `disallow: ['/admin', '/*/admin', …]`; against the matching of Google's robots rules (`*` any sequence, `$` end of URL), `/sq/listings/administrative-x` begins with a match of `/*/admin`.
Recommendation: Revision 3, R3-2. The same prefix match of `'/*/auth'` and `'/*/cabinet'` is on `main`: Task 1067 (checklist A4).
References: Task 923 R72 (h); checklist A2, A4.
Status: open

## Revision 3 (executor)

The kickoff's "Revision 3" block holds these items; the revision starts from the owner's local commit of this reviewed tree.

- R3-1 (F5): `src/lib/reserved-slugs.ts`: add `'admin'` to `RESERVED_SLUGS` with the comment `// the admin, under the language slug since Task 988 (src/app/[locale]/admin)`, and the line `:5` becomes `// Keep in sync with src/app/[locale]/admin and the directory entries of src/app/[locale]/(site)/*.`; `src/lib/__tests__/pureLibs.test.ts:21-22`: the test lists the static folders of both `src/app/[locale]` and `src/app/[locale]/(site)` with the same filter (`[`, `_`, `(` skipped) and keeps its two expectations unchanged. No other line.
- R3-2 (F6): `src/app/robots.ts:23`: `'/*/admin'` → `'/*/admin$', '/*/admin/', '/*/admin?'` (the landing, every admin page, the landing with a query), and the comment of `:4-6` says why (`*` and a prefix would also match `/sq/listings/administrative-…`); `src/app/__tests__/robots.test.ts:37` follows. `'/admin'` and the other rules stay (Task 1067).
- Tests and report: failing first: `npm test -- src/lib/__tests__/pureLibs.test.ts` before R3-1 (fails) and after (passes); `npm test -- src/app/__tests__/robots.test.ts` before R3-2's source edit with the new list in the test (fails) and after (passes). `npx vitest related --run --reporter=verbose` over the four changed files and the §8.1 text search over them (`reserved-slugs`, `RESERVED_SLUGS`, `isReservedSlug`, `app/robots`), each found test run by §8.1's command; ESLint on the four files; `npm run typecheck`. One break each, restored: `'admin'` removed from `RESERVED_SLUGS` → `pureLibs.test.ts` fails; `'/*/admin/'` removed → `robots.test.ts` fails. The product gates stay CI-only (A5).

## Notes (no change asked)

- N1: comments in product files still name pre-move paths (`src/app/[locale]/admin/users/page.tsx:23`, `src/modules/admin/dashboard/components/AdminDashboardView.tsx:103`, `src/stories/_StoryAdminShell.tsx:5`, `src/app/globals.css:455`, `src/design-system/mantine/typography.ts:6`, `src/modules/cabinet/statistics/components/AgentStatisticsView.tsx:87`, `src/modules/cms/components/CmsPageView.tsx:12`, `src/modules/listings/components/ListingsPageFrame.tsx:25`, `src/modules/listings/domain/filterEngine.ts:12`); no check reads them. Not asked in this revision (A1).
- N2: the line numbers of `scripts/i18n-dynamic-manifest.json` (`:396`, `:397`, `:438`) point past the end of the 333-line `listings/[slug]/page.tsx` on `main` too; `scripts/check-i18n-dynamic.mjs:106` checks only that `site` is a non-empty string. Pre-existing, documentation only.
- N3: deviations 1-5 of the report are accepted (V2, V6); the trigger break's failure mode (the sign-up fails rather than storing `xx`) is the column check behind the trigger, as the report infers.
- Checklist gaps for the owner (A16): (1) V6 asks for a planted bad case through the checker of every changed baseline row, and A5 forbids running those checkers locally; this review proved the rows by reverse substitution instead. (2) §8.1's two searches cannot see a test that builds a path with `join(…, '[locale]')` (F5's test): neither an import nor a path string names the moved folder.

## Open parts

- Opus, Review 4: V5a for the 22 admin pages at 320, 640, 1024 and 1440 px with a staff session in the owner's Chrome (`BLOCKED` until the owner signs in as staff there).
- Opus, after the merge: the production checks of the kickoff's Route step 5.
