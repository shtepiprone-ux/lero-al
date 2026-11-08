# Task 965 — Signed-in pages are checked on the production build for every role

Sprint 93. Priority P1. Found by the Task 952 review (2026-11-07), the page error is present on Next 15 too; no owner
decision needed. Implementer: Sonnet, on `governance/reset-2026-11-06`, after Task 952 is committed.
Reviewer: Opus. Human owner of the change: the owner.

## Goal

Two gaps, measured 2026-11-07 with the saved admin session on `next start`, Next 15 baseline against Next 16:
- `/admin/reports` and `/admin/support` throw React error 418 (hydration mismatch) on both builds, at widths 1280 and 390.
  The server HTML is thrown away and the page is rendered again in the browser. The cause is not yet known:
  `formatDateTime` (`src/lib/formatters.ts:166`) is built from UTC parts and does not differ between server and browser.
- Nothing checks signed-in pages on a build. `scripts/check-hydration-console.mjs` covers `/admin`, `/admin/users` and
  one user page, needs a session captured by hand, and runs on `next dev`. Sign-in needs a Turnstile token, so a local
  run cannot produce a session; moderator and agent pages were not checked for Task 952.

After the task both pages hydrate without an error, and CI signs in as each role on the development project and walks
every signed-in page of the production build.

## Scope

- Files to change: the component behind the mismatch (start at `src/components/admin/AdminReportsManager.tsx` and
  `src/components/admin/AdminSupportManager.tsx`, reproduce with `next dev`, which names the differing node);
  `scripts/check-signed-in-pages.mjs` (new) with `scripts/quality/signed-in-pages.test.mjs`; `.github/workflows/ci.yml`:
  a step in the `click-shield` job, which already runs the production server on the development project.
- The route table covers each `page.tsx` under `src/app/admin` and `src/app/[locale]/cabinet`, `favorites`,
  `listings/create` and `listings/[slug]/edit` for three roles: admin, moderator, agent. Each row states the expected result: the page, or the
  redirect a role without access gets. A `page.tsx` missing from the table fails the check.
- The walk fails on a status of 500 or more, a page error, a hydration message or an unexpected redirect. It only reads:
  every request that is not GET, HEAD or OPTIONS is aborted, as the review walk of Task 952 did.
- Sessions come from test users created in the development project the same way as `npm run test:security-integration`.
  `scripts/quality/ci-target.mjs` runs first, so the walk can never reach production.
- Dependencies: none. Out of scope: Turnstile itself, moving any gate off `next dev`, pages a guest can reach.

## Attack surface

Unchanged. The check runs in CI against the development project and adds no route, action or permission.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- Abuse_Case: not applicable — no feature or entry point is added, only a read-only check in CI.
- Authentication: not applicable — sign-in is not changed; the check reuses the sessions of the existing integration tests.
- Authentication_Patterns: not applicable — sign-in is not changed; no new way to obtain a session reaches the product.
- Authorization: not applicable — no permission changes; the walk observes the rules that already exist.
- Authorization_Decisions_And_Output_Handling: not applicable — no decision or returned field changes; the fix concerns rendering only.
- Authorization_Patterns: not applicable — no authorization pattern changes; the role table only records existing results.
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
  redirect, a row with no session — test: `scripts/quality/signed-in-pages.test.mjs`.
- AC3 A page missing from the route table fails, and every role has a row for it — test:
  `scripts/quality/signed-in-pages.test.mjs`.
- AC4 CI runs the walk after the target check, never skipped, and `CI Required` needs it — test:
  `scripts/quality/ci-workflow.test.mjs`.
- AC5 The walk sends no write: a non-GET request is aborted and counted — test: `scripts/quality/signed-in-pages.test.mjs`.

## Route

1. Reproduce the mismatch with `next dev`, record the differing node in the report, fix it at its owner.
2. Write the walk and its tests, then the CI step.
3. Run: npm run lint · npm run typecheck · npm test -- --coverage · node scripts/quality/changed-lines-coverage.mjs --base main ·
   node scripts/quality/check-files.mjs --worktree · node --test scripts/quality/signed-in-pages.test.mjs scripts/quality/ci-workflow.test.mjs
4. Report: each command, exit code, relevant output; each new test's failing run before the change; the first CI run of
   the walk with its row count per role.

## Review

