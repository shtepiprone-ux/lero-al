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
- AC2 The walk fails on each defect it exists for: a status of 500, a page error, a hydration message, an unexpected
  redirect, a row with no session — test: `scripts/__tests__/check-signed-in-pages.test.ts`.
- AC3 A page missing from the route table fails, and every role has a row for it — test:
  `scripts/__tests__/check-signed-in-pages.test.ts`.
- AC4 CI runs the walk after the target check, never skipped, and `CI Required` needs it — test:
  `scripts/quality/ci-workflow.test.mjs` (Opus writes the case with the step).
- AC5 The walk sends no write: a non-GET request is aborted and counted — test: `scripts/__tests__/check-signed-in-pages.test.ts`.
- AC6 The walk's users and listing are removed after the run, when it passes and when it fails, and a clean-up that
  leaves rows fails the step — test: `scripts/__tests__/check-signed-in-pages.test.ts`.

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

## Review

