# Task 965 — Signed-in pages are checked on the production build for every role

Sprint 93. Priority P1. Found by the Task 952 review (2026-11-07), the page error is present on Next 15 too; no owner
decision needed. Implementer: Sonnet, on `task/965-signed-in-pages` from `main` after PR #29 (Task 964) merges: both
change the `click-shield` job of `ci.yml`. Re-checked 2026-11-12 against the Task 964 head: the 27 pages of the route
table below, `AdminReportsManager.tsx`, `AdminSupportManager.tsx`, the `click-shield` job and
`src/tests/integration/fixtures.ts` exist as named; the 2026-11-07 measurement of the error is repeated in Route step 1.
Reviewer: Opus. Human owner of the change: the owner.

## Goal

Two gaps, measured 2026-11-07 with the saved admin session on `next start`, Next 15 baseline against Next 16:
- `/admin/reports` and `/admin/support` throw React error 418 (hydration mismatch) on both builds, at widths 1280 and 390.
  The server HTML is thrown away and the page is rendered again in the browser. The cause is not yet known:
  `formatDateTime` (`src/lib/formatters.ts:166`) is built from UTC parts and does not differ between server and browser.
- Nothing checks signed-in pages on a build. `scripts/check-hydration-console.mjs` covers `/admin`, `/admin/users` and
  one user page, needs a session captured by hand, and runs on `next dev`; moderator, agent and user pages were not
  checked for Task 952. The sign-in form needs a Turnstile token, but the integration fixtures already obtain real
  sessions without one: a password sign-in through a service-role caller, which Supabase's CAPTCHA protection lets
  through (`src/tests/integration/fixtures.ts:42`, Task 923 R154).

After the task both pages hydrate without an error, and CI signs in as each role on the development project and walks
every signed-in page of the production build.

## Scope

- Files to change: the component behind the mismatch (start at `src/components/admin/AdminReportsManager.tsx` and
  `src/components/admin/AdminSupportManager.tsx`, reproduce with `next dev`, which names the differing node);
  `scripts/check-signed-in-pages.mjs` (new) with `scripts/__tests__/check-signed-in-pages.test.ts` (Vitest, like the other
  tests of `scripts/`). Opus, not the executor (`execute-task` forbids `.github/**` and `scripts/quality/**`), adds the
  step to the `click-shield` job of `.github/workflows/ci.yml`, which already runs the production server on the
  development project, and its case in `scripts/quality/ci-workflow.test.mjs` (AC4); the executor reports the step it needs.
- The route table covers each `page.tsx` under `src/app/admin` (22 today) and `src/app/[locale]/cabinet` (2),
  `favorites`, `listings/create` and `listings/[slug]/edit` (27 in all), under `/sq`, for the four roles of
  `UserRole` (`src/types/database.ts:1`): admin, moderator (no permission key granted), agent, user. Each row states the
  expected result: the page, or the redirect a role without access gets. A `page.tsx` missing from the table fails the
  check. The three paths with a parameter (`/admin/listings/[id]/preview`, `/admin/users/[id]`,
  `/sq/listings/[slug]/edit`) use a listing owned by the run's agent and the run's user.
- The walk fails on a status of 500 or more, a page error, a hydration message or an unexpected redirect. It only reads:
  every request that is not GET, HEAD or OPTIONS is aborted, as the review walk of Task 952 did.
- Sessions and data come from `createRun()` of `src/tests/integration/fixtures.ts` (`makeUser` with each role,
  `makeListing`), the same code as `npm run test:security-integration`; each session goes into the browser as the
  `@supabase/ssr` auth cookie. `cleanup()` runs after the walk, pass or fail, and its result is in the step output.
  `scripts/quality/ci-target.mjs` runs first, so the walk can never reach production.
- Dependencies: none. Out of scope: Turnstile itself, moving any gate off `next dev`, pages a guest can reach.
- Revision 1 (Opus, 2026-11-12, Review 1 F1 to F5). The first browser render reads no clock, and later renders are right:
  - R1-1 (F1) `AdminCompaniesManager`, `AdminCurrenciesManager`, `AdminPropertyTypesManager`: a row saved in the browser
    gets `created_at` / `updated_at` from the browser clock while `now` stays the page's instant, so it reads "in 12
    minutes". Each keeps the instant its relative times use in state, starting from the page's `now` (the hydrating
    render is unchanged), and moves it to the saved row's own timestamp when it inserts or replaces a row.
  - R1-2 (F3) `ListingCard` decides the `new` badge from `Date.now()` while it renders (`ListingCard.tsx:116`), on
    `/sq/favorites` among others: near the 7-day edge, or with a browser clock off by hours, the badge differs from the
    server HTML (error 418). The badge reads an instant the server gave (`isListingNew`, `src/modules/listings/lib/isListingNew.ts`),
    never the browser clock in the first render; every renderer of `ListingCard` keeps working.
  - R1-3 (F4) the walk opens every row at widths 1280 and 390 (the two widths of the Goal), each width a row of its own
    in the output and the per-role count.
  - R1-4 (F2) the AC2 case "a row with no session" fails when such a row counts as passed, also for a role whose
    missing session does not remove the listing (the moderator).
  - R1-5 (F5) `serverNowProps.test.tsx` covers every page that passes `now`: `/admin/companies` and `/admin/listings` too.
  - Files: the three managers, `ListingCard.tsx` and the data path of its `now` or `isNew`, `check-signed-in-pages.mjs`,
    and the tests below.

## Attack surface

Unchanged. The check runs in CI against the development project and adds no route, action or permission.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (a270842ecd9b, mapping of 2026-11-12).

- Abuse_Case: not applicable — no feature or entry point is added, only a read-only check in CI.
- Authentication: not applicable — sign-in is not changed; the check reuses the sessions of the existing integration tests.
- Authentication_Patterns: not applicable — sign-in is not changed; no new way to obtain a session reaches the product.
- Authorization: not applicable — no permission changes; the walk observes the rules that already exist.
- Authorization_Decisions_And_Output_Handling: not applicable — no decision or returned field changes; the fix concerns rendering only.
- Authorization_Patterns: not applicable — no authorization pattern changes; the role table only records existing results.
- Authorization_Policy_And_Data_Distribution: not applicable — no permission data or its distribution changes; the moderator rows run with no permission key granted, read from the database on each request as today.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — each role has a row with its expected page or redirect, on the production build — AC3.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — the role table is data, and a page missing from it fails the check — AC3.
- Bot_Management_and_Anti-Automation: not applicable — Turnstile stays as it is; the walk runs only on the development project.
- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — the step binds its secrets to itself and runs after the target check — AC4.
- Content_Security_Policy: not applicable — no header changes here; the policy work belongs to Task 954.
- Cookie_Theft_Mitigation: not applicable — no cookie attribute changes; sessions exist only inside the CI run.
- Credential_Stuffing_Prevention: not applicable — no sign-in limit changes; test users exist only in the development project.
- Cross_Site_Scripting_Prevention: not applicable — the hydration fix adds no raw HTML sink; existing sink rules still apply.
- DOM_based_XSS_Prevention: not applicable — the hydration fix adds no DOM write from a URL or user value.
- Denial_of_Service: not applicable — no public endpoint changes; the walk is bounded by the route table.
- GitHub_Actions_Security: "Always set permissions: {} at the workflow level to disable all permissions by default." — the workflow change keeps full-SHA pins and step-level secrets — AC4.
- Injection_Prevention: not applicable — the walk builds no query or command from outside input.
- JavaScript_and_TypeScript_Security: not applicable — the new script takes fixed routes and uses no dynamic evaluation.
- Multifactor_Authentication: not applicable — no second factor exists or changes in this task.
- Nextjs_Security: "Rendering the form only on a protected page does not authenticate the action request." — the server render and the first browser render agree again on both pages — AC1.
- OAuth2: not applicable — no provider flow changes; the walk does not use Google sign-in.
- OS_Command_Injection_Defense: not applicable — the new script starts no process from outside input.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor reports the first CI run; Opus reads that run — AC2, AC4.
- Session_Management: not applicable — session handling is not changed; the walk only reads with existing test sessions.
- Software_Supply_Chain_Security: not applicable — no dependency or action is added; the step reuses installed tools.
- Third_Party_Javascript_Management: not applicable — no third-party script is added, removed or moved here.
- Unvalidated_Redirects_and_Forwards: not applicable — no redirect target changes; the walk only compares existing redirects.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — each detection case is a test that fails without the check — AC2.
- Web_Frontend_Security: not applicable — the fix changes when markup renders, not what the browser receives.

## UI

No visible change: the pages render the same content, without the second render in the browser.

## Mobile adaptation record

- Scope: none

## Acceptance criteria

- AC1 Both pages hydrate without a recoverable error — test: `src/components/admin/__tests__/adminPagesHydration.test.tsx`
  (server render, then `hydrateRoot`, `onRecoverableError` is never called, with the data shape that failed).
  Revision 1 (R1-5): every page that lists relative times hands its own `now` to its container — test:
  `src/app/__tests__/serverNowProps.test.tsx` (companies and listings included).
- AC2 The walk fails on each defect it exists for: a status of 500, a page error, a hydration message, an unexpected
  redirect, a row with no session — test: `scripts/__tests__/check-signed-in-pages.test.ts`. Revision 1: each row is
  opened at 1280 and at 390, a hydration message at 390 only fails its row (R1-3), and a moderator with no session fails
  the run (R1-4).
- AC3 A page missing from the route table fails, and every role has a row for it — test:
  `scripts/__tests__/check-signed-in-pages.test.ts`.
- AC4 CI runs the walk after the target check, never skipped, and `CI Required` needs it — test:
  `scripts/quality/ci-workflow.test.mjs` (Opus writes the case with the step).
- AC5 The walk sends no write: a non-GET request is aborted and counted — test: `scripts/__tests__/check-signed-in-pages.test.ts`.
- AC6 The walk's users and listing are removed after the run, when it passes and when it fails, and a clean-up that
  leaves rows fails the step — test: `scripts/__tests__/check-signed-in-pages.test.ts`.
- AC7 (Revision 1, R1-1) A company, currency or property type saved in the browser reads "less than a minute ago" on a
  page rendered 12 minutes earlier, and the page still hydrates with its server `now` — test:
  `src/components/admin/__tests__/savedRowRelativeTime.test.tsx`.
- AC8 (Revision 1, R1-2) A listing card hydrates without a recoverable error when the browser clock is two hours ahead
  of the server and the listing is 6 days 23 hours old, and the `new` badge follows the server's instant — test:
  `src/modules/listings/components/__tests__/ListingCard.hydration.test.tsx`.

## Route

1. Reproduce on today's `main` with `next dev`, signed in through the login form with the `.env.local` HYDRATION_ADMIN
   account (a Node Playwright script that reads `.env.local` itself, so no password appears in a command or output).
   Record the console output and the differing node in the report and fix it at its owner. If neither page throws, the
   report says so with that output, and AC1 still holds both pages with the data shape of 2026-11-07.
2. Tests first: AC1 to AC3, AC5 and AC6 on the unchanged code; save the failing output. Then write the walk; the CI step
   it needs goes in the report for Opus.
3. Run: npm run lint · npm run typecheck · npm test -- --coverage · node scripts/quality/changed-lines-coverage.mjs --base main ·
   node scripts/quality/check-files.mjs --worktree · npx vitest run scripts/__tests__/check-signed-in-pages.test.ts ·
   node scripts/quality/ac-tests.mjs --base main tasks/Sprints/Sprint_93_kickoff_prompt_Task_965_Signed_In_Pages_Checked_On_The_Build.md
4. Report: each command, exit code, relevant output; each new test's failing run before the change; a deliberate break
   per detection case of AC2; the first CI run of the walk with its row count per role.
5. Revision 1: change or write the tests of AC1 (R1-5), AC2, AC7 and AC8 first and run them on the Review 1 code (keep
   the failures), then R1-1 to R1-4; a deliberate break per change (the state update removed from one manager, the
   badge back on `Date.now()`, the 390 width dropped, a no-session row counted as passed); `node scripts/quality/pipeline.mjs
   run execute <kickoff>`; the live walk on `next start` with `SENTRY_AUTH_TOKEN` empty (216 rows, clean-up verified).

## Review

Review 1 of the working tree on `task/965-signed-in-pages` (base c26222402) — NEEDS REVISION (1 of 2)
Scope: the whole diff (25 files under `src/`: the empty wrapper, `now` to `RelativeTime`'s `baseDate`; the walk and its
tests; Opus's AC4 step and test) and every other clock read in a render of the 27 pages.
Tools: `owasp.mjs sync` and `check` 0, `check-ruleset.mjs` 0, `ac-tests.mjs` 0 [локально: `node scripts/quality/ac-tests.mjs --base main <kickoff>`];
the four new test files 57/57 [локально: `npx vitest run` of the four files]; `next build` 0 and the live walk on
`next start` against the development project: `ci-target.mjs` 0, 108 rows passed (27 per role), 176 writes aborted,
clean-up verified, 0 rows left [локально: `node walk965.mjs`]; `ci-workflow.test.mjs` 15/15, 2 fail with the step removed
[локально: `node --test scripts/quality/ci-workflow.test.mjs`]; `ci-local.mjs` in the review phase below.
Findings: Critical 0, High 0, Medium 0, Low 5
Overall risk: no security exposure (a read-only CI check on the development project); display and test gaps below.

F1 — A row saved in the browser reads "in 12 minutes"
Severity: Low      Category: business logic (display)      CWE: —
Location: `AdminCurrenciesManager.tsx:70-71`, `AdminPropertyTypesManager.tsx:98-99`, `AdminCompaniesManager.tsx:122`
Description: a saved row gets `created_at` / `updated_at` from the browser clock and no `router.refresh` follows, while
`now` stays the page's instant. Impact: a currency saved 12 minutes after opening the page reads "in 12 minutes".
Reproduction: `formatDistance(10:12, 10:00, { addSuffix: true })` prints "in 12 minutes" [локально: `node -e` with date-fns].
Recommendation: R1-1 and AC7. References: `.claude/rules/flow.md` Golden rule.
Status: fixed in Revision 1 (Review 2)

F2 — The AC2 case "a row with no session" does not fail when such a row counts as passed
Severity: Low      Category: tests      CWE: —
Location: `scripts/__tests__/check-signed-in-pages.test.ts:224`
Description: the case removes the agent's session, so the run fails only through the missing listing. Impact: a walk
that counts an admin, moderator or user it could not sign in as passed stays green.
Reproduction: with `ok: true` on the no-session rows, 43/43 pass [локально: `node mutate965.mjs`].
Recommendation: R1-4. References: Verifying_Third_Party_Agent_Execution_Evidence; `quality-gates.md` §8.
Status: fixed in Revision 1 (Review 2)

F3 — `ListingCard` decides the `new` badge from the browser clock while hydrating
Severity: Low      Category: business logic (rendering)      CWE: —
Location: `src/modules/listings/components/ListingCard.tsx:116`
Description: `getBadges` compares `created_at` with `Date.now()` during render. Impact: on `/sq/favorites` a listing near
7 days old, or a browser clock hours off, differs from the server HTML: error 418, the class this task removes.
Reproduction: code read; the walk passes only because no fixture listing is near the edge.
Recommendation: R1-2 and AC8. References: `src/modules/listings/lib/isListingNew.ts`.
Status: fixed in Revision 1 (Review 2)

F4 — The walk opens each page at 1280 only
Severity: Low      Category: tests      CWE: —
Location: `scripts/check-signed-in-pages.mjs:261`
Description: the Goal measured the error at 1280 and 390, and below 640 the pages render cards and sheets. Impact: a
hydration error only a phone width shows passes CI.
Reproduction: the executor's report ("Не зроблено": the walk runs at 1280 only).
Recommendation: R1-3. References: `.claude/rules/shared/mobile-adaptation-contract.md`.
Status: fixed in Revision 1 (Review 2)

F5 — Two of the seven pages that pass `now` have no test of it
Severity: Low      Category: tests      CWE: —
Location: `src/app/__tests__/serverNowProps.test.tsx`
Description: `/admin/companies` and `/admin/listings` hand `now` down untested. Impact: a dropped prop goes unnoticed.
Reproduction: the test names five pages.
Recommendation: R1-5. References: `.claude/rules/quality-gates.md` §8.
Status: fixed in Revision 1 (Review 2)

Accepted from Review 1: the cause of the 418 (a `<p>` inside the empty state's `<p>`) and its fix at the shared pattern;
the scope beyond the two pages (the minute boundary of `RelativeTime` is the cause the walk found on `/admin`, fixed at
its owner through the documented `baseDate`; within "the component behind the mismatch"). Deliberate breaks, each
restored: the empty wrapper back to `<p>` fails 2 AC1 cases, `baseDate` ignored fails 3 [локально: `npx vitest run
adminPagesHydration.test.tsx`]; nine of the ten breaks of the script fail as reported (F2 is the tenth) [локально:
`node mutate965.mjs`]. AC4 (Opus, by the kickoff): the step in `click-shield` after the click-shield check with
step-level secrets, `signedInWalkProblems` with seven planted cases, and `check-signed-in-pages` in the browser list
that requires the Playwright install. OWASP record: `docs/security/owasp/reviews/Task_965.json`.

Review 2 of the working tree on `task/965-signed-in-pages` (base c26222402, Revision 1) — APPROVED
Scope: the whole Revision 1 diff: `asOf` in the three managers; `ListingCard`'s badge from the server's `now` (none in a
hydrating render without it, `useSyncExternalStore` server snapshot `false`), threaded from favorites, listings and
similar listings (the home lists load in the browser, so they are not hydrated); `WIDTHS = [1280, 390]`; every new test.
Tools: the seven test files of the task 85/85 [локально: `npx vitest run` of the seven files]; `next build` 0 and the
live walk on `next start`: `ci-target.mjs` 0, 54 rows per role, 108 at 1280 and 108 at 390, clean-up verified, 0 rows
left [локально: `node walk965.mjs`]; `owasp.mjs review` 0 with the same sheets; `ci-local.mjs` in the review phase.
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: none found; a read-only CI check on the development project, and a first render that no longer depends on
the browser clock.

Every claim of the Revision 1 report reproduced. Deliberate breaks, each restored and hash-compared: `setAsOf` removed
from the currencies manager fails 2 AC7 cases; the badge back on the browser clock fails 3 AC8 cases [локально: `npx
vitest run` after each break]; eleven breaks of the walk script each fail (a no-session row counted as passed: 4, the
390 width dropped: 5) [локально: `node mutate965.mjs`]. Found in review and fixed (golden rule): `findBy` waited 1 s
suite-wide, so `ListingDetailView.contactSession.security.test.tsx` failed under load and passed alone; `setup.ts` sets
5 s, `src/tests/__tests__/asyncUtilTimeout.test.tsx` failed 2/2 before it. The walk's first CI run follows the push.

