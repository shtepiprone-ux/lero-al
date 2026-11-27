# Task 988 — Review 1

Kickoff: [Sprint_94_kickoff_prompt_Task_988_The_Chosen_Language_Stays.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_988_The_Chosen_Language_Stays.md) · OWASP record: [Task_988.json](../security/owasp/reviews/Task_988.json)

Review 1 of the working tree on aacf6ebce (branch `task/988-chosen-language-stays`, uncommitted) — NEEDS REVISION
Scope: diff-based; `git diff --stat aacf6ebce -- src messages` → 26 files (183+, 26−) and 4 new files (`notificationHref.ts` and the tests of AC1-AC3); entry points: the request proxy (a new 307), `NotificationItem` (the rendered link), 18 admin pages and their `generateMetadata`. The `.claude/`, `docs/` and `tasks/` changes are Opus's (Task 1053 archive, `quality-gates.md` §8.1, this kickoff).
Tools: `owasp.mjs sync`, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 45825365315 green (the scheduled run 45833291216 in progress); typecheck → exit 0; ESLint on the changed code → exit 0; the 4 task tests → 23/23; `vitest related` → 197 files, 4 failed (F2); integration graph → 14 files, 79/80 (F3); `client-sinks.mjs` → exit 1 (F1).
Findings: Critical 0, High 0, Medium 0, Low 3
Overall risk: the product change removes the Cause and its two controls hold (the cookie never steers the redirect outside four codes, a stored link never leaves the site); three reached checks fail until their doubles and one stale exemption follow the change.

## Checklist V

- V1: `node scripts/quality/owasp.mjs sync` → "142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0", exit 0; `check` → "every quote verified", exit 0; `check-ruleset.mjs` → "the live ruleset matches", exit 0; `gh run list --branch main --limit 3` → CI 45825365315 success (Task 1053, #82), a scheduled CI 45833291216 in progress; HEAD = `aacf6ebce` = `origin/main`.
- V2: `git diff --stat aacf6ebce -- src messages` and `git status --short`: the product files are the Scope's (`notificationHref.ts`, `NotificationItem.tsx`, `src/proxy.ts`, `src/i18n/routing.ts`, the 18 admin pages, `messages/*.json`) and the tests of AC1-AC3. No file outside the Scope; the renumbered comment "3." → "4." of `src/proxy.ts` follows the inserted step. The report's open items are files the Scope did not name: `scripts/quality/client-sinks.mjs` (named by the Scope, forbidden to Sonnet: F1) and two reached tests (F2, F3).
- V3: every claim of the report reproduced:
  - `npm run typecheck` → exit 0. `npx eslint --no-warn-ignored --max-warnings 0` on the 26 changed and new code files of `src` → exit 0.
  - The 4 task tests → 4 files, 23 passed, exit 0.
  - §8.1 import graph: `npx vitest related --run` over the changed and new files and `messages/*.json` → 197 files, 3045 tests, 4 failed, exit 1: the 4 cases of `src/app/admin/users/__tests__/adminUserGone.security.test.ts` ("`cookies` was called outside a request scope", F2), as reported.
  - Text search extras: `npm test -- filterStrings proxyFile RangeDatePickerLocalization exchangeProvidersRemoved` → 13/14; the failed case is `[SEC-T1-SRV-BUILT-PROXY]`, which reads the built manifest; `config.matcher` of `src/proxy.ts` is unchanged by the diff, so only CI checks it (I8). `node --test client-sinks.test.mjs check-files.test.mjs` → 35/36, `not ok 31 - the product code of this repository passes` (F1).
  - Integration: the Route's 5 files → 19/20; the graph with `--config vitest.integration.config.ts` → 14 files, 79/80; the failed case is `adminPage.integration.test.ts` [SEC-X-INT-ADMINPAGE-GUARD-ALLOW], "No `setRequestLocale` export is defined on the `next-intl/server` mock" (F3).
  - `client-sinks.mjs` → "K0 … reviewed entry no longer matches a sink: href={notification.link}", exit 1 (F1). `check-i18n-parity.mjs` → 2711 keys, exit 0. `locale-safety.mjs` → no finding, exit 0.
  - Breaks (each file restored from a copy; `git diff --stat` unchanged after them): the four-code check of the proxy → `[SEC-988-PROXY-LOCALE-DENY]` fails; `localeCookie` removed → `[AC2] the language cookie lives 10 days` fails; `safeNextPath` removed from the helper → `[SEC-988-NOTIF-LINK-DENY]` fails; `getAdminLocale()` removed from the email-templates page → `[AC3] … awaits getAdminLocale()` fails.
- V4: read once: the whole diff of every changed file and the 4 new files. The Cause is gone: `NotificationItem.tsx:286` renders `notificationHref(notification.link, locale)`; `src/proxy.ts:77-88` sends an address without a language to the cookie's language; `src/i18n/routing.ts:11` gives the cookie 10 days; `email-templates/page.tsx` and `users/[id]/page.tsx` await `getAdminLocale()` before they translate; no admin page keeps a literal tab title. Per page, the access of `generateMetadata` equals the page's `requireStaffPage` argument and its key equals the key of the page heading (18 of 18; `support` and `users/new` render the heading in `AdminSupportView.tsx:165` and `AdminUserCreate.tsx:185`).
- V5: against `git show aacf6ebce:<path>`: `NotificationItem` keeps its markup, texts, read marking and click handler, and an item without a usable link renders without an anchor; the proxy keeps the session refresh, `carriesNoLocale` and next-intl's answer for every other request; each admin page keeps `requireStaffPage` as its first await, its heading and its data. The changes of behaviour are the ones the kickoff names (O988-1).
- V5a: on the app dev server with the owner's session (admin language `uk`): the 17 admin pages answer 200 with a Ukrainian tab title equal to their heading plus " — Admin" (e.g. "Email шаблони — Admin" / heading "Email шаблони"; "Користувачі — Admin"; "Новий користувач — Admin"); a profile page title is "<name> — Admin"; a missing account goes to `/admin/users?notice=user_gone`. The bell on `/uk` lists 9 anchors, every `href` `/uk/…` (`/uk/cabinet?tab=searches`, `/uk/listings/<slug>`), `display: block`, colour inherited as on `main` (no style in the diff). `curl` on the dev server: `/cabinet?tab=listings` with `NEXT_LOCALE=uk` → 307 `/uk/cabinet?tab=listings`, `Cache-Control: private, no-store`; with `//evil.com` or none → `/sq/…`; `/en` with `NEXT_LOCALE=uk` → `Set-Cookie: NEXT_LOCALE=en; Path=/; Expires=…; Max-Age=864000; SameSite=lax` (the real next-intl). No style, size or Story changes, so there is no computed-style difference to measure.
- V6: the diff adds no `eslint-disable`, `.skip`, `.only`, `.todo`, `@ts-*`, allowlist or baseline (grep over the diff and the new files: no match). The one registry change the kickoff asks for, the removal of the P-06 entry, is not made (F1).
- V7: below.
- V8: with the product files at `aacf6ebce` and the helper reduced to `link || null` → 13 of the 23 task cases fail (every AC1, AC2 and AC3 case that asserts the new behaviour); restored, the hashes equal. AC4 has no test of its own beyond `client-sinks.mjs` (F1). The DENY cases pass on `main` because `main` never redirects by the cookie; each fails with its own break (V3).
- V9: no Story changed; nothing for the owner's look in Storybook.
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → exit 0; the diff (with Opus's rule files) triggers 35 sheets, among them `AI_Agent_Security`, `Insecure_Direct_Object_Reference_Prevention`, `LLM_Prompt_Injection_Prevention`, `MCP_Security`, `Query_Parameterization`, `SQL_Injection_Prevention`, `Serverless_FaaS_Security` and `Transport_Layer_Security` beyond "## OWASP". Each of the 49 sheets has its verdict in the record; `Authorization_Regression_Testing` is F2.

## V7 — secure code review

- Access control: touched. Each new `generateMetadata` (18) calls `requireStaffPage` first with the page's own access (V4); the page gates are unchanged. `staffPage.security.test.ts` passes.
- Input and output: touched. The cookie value is compared with four exact codes (`src/proxy.ts:9`, `:79`); the stored link passes `safeNextPath` (`notificationHref.ts:15`); an absolute link is accepted only with the site's own origin (`:14`).
- Redirects: touched. The 307 target is the request's own URL with a fixed code in front (`src/proxy.ts:80-81`); a path that already starts with a code never redirects (no loop).
- Caching: touched. The cookie-dependent 307 carries `private, no-store` (`src/proxy.ts:83`); the pages are `private, no-cache, no-store` on production (measured 2026-11-26).
- Sessions: touched. The refreshed session cookies are copied onto the 307 as onto next-intl's answer (`src/proxy.ts:84-86`).
- Authentication, business logic, data and SQL, uploads, webhooks, server-side fetches, secrets: not touched (`git diff --name-only aacf6ebce` names no auth action, migration, upload, route handler or key).

## Findings

F1 — The stale P-06 exemption keeps `client-sinks` red
Severity: Low      Category: Verification (gate registry)      CWE: —
Location: `scripts/quality/client-sinks.mjs:44-45`
Description: the line `href={notification.link}` is gone from `NotificationItem.tsx`, so the `REVIEWED` entry of P-06 matches nothing; the gate fails on a stale entry by design ("remove the entry with the fix"). The kickoff's Scope names the removal, but checklist I forbids Sonnet any edit of `scripts/quality/**`: the kickoff gave the executor a file it may not change (a design defect of Opus).
Impact: CI's client-sinks step and `client-sinks.test.mjs` case 31 fail; AC4 is not met.
Reproduction: `node scripts/quality/client-sinks.mjs` → exit 1; `node --test scripts/quality/client-sinks.test.mjs` → `not ok 31`.
Recommendation: remove the P-06 entry (Opus, at the owner's word; see "Open parts").
References: `quality-gates.md` §1; kickoff AC4.
Status: fixed by Opus on the owner's word (2026-11-26, "ок"): the entry removed, uncommitted; `client-sinks.mjs` → "every sink controlled or reviewed", exit 0; `node --test scripts/quality/client-sinks.test.mjs` → 4/4

F2 — The profile guard test fails: its doubles lack the admin language
Severity: Low      Category: Verification (authorization regression test)      CWE: —
Location: `src/app/admin/users/__tests__/adminUserGone.security.test.ts:56`
Description: `users/[id]/page.tsx` now awaits `getAdminLocale()`, which calls `cookies()` (`src/lib/admin/getAdminLocale.ts:10`) and `setRequestLocale` (`:13`); the test mocks neither `next/headers` nor `getAdminLocale`, so all 4 cases throw before they reach the guard they check.
Impact: the four `[SEC-X-SRV-ADMIN-USER-*]` regression tests no longer test the missing-account guard; CI's unit job fails.
Reproduction: `npm test -- src/app/admin/users/__tests__/adminUserGone.security.test.ts` → 4 failed, "`cookies` was called outside a request scope".
Recommendation: Revision 1, R1-1.
References: OWASP Authorization_Regression_Testing; kickoff Route step 4.
Status: open

F3 — The admin page integration test fails: its `next-intl/server` double lacks `setRequestLocale`
Severity: Low      Category: Verification (authorization regression test)      CWE: —
Location: `src/tests/integration/adminPage.integration.test.ts:27`
Description: the double returns `getLocale` and `getTranslations` only; `getAdminLocale()` now runs on the profile page and calls `setRequestLocale`.
Impact: `[SEC-X-INT-ADMINPAGE-GUARD-ALLOW]` fails on the real project; CI's integration job fails.
Reproduction: `npm run test:security-integration -- src/tests/integration/adminPage.integration.test.ts` → 1 failed, "No `setRequestLocale` export is defined on the `next-intl/server` mock".
Recommendation: Revision 1, R1-2.
References: OWASP Authorization_Regression_Testing; kickoff Route step 4.
Status: open

## Revision 1 (executor)

Superseded the same day: the owner redesigned the task after this review (O988-1 to O988-4 in the kickoff); the kickoff's "Revision 1" block is the redesign, and F2 and F3 are covered by its AC6. The items below were the fix for the first design.

- R1-1 (F2) `src/app/admin/users/__tests__/adminUserGone.security.test.ts`: add `vi.mock('@/lib/admin/getAdminLocale', () => ({ getAdminLocale: async () => 'en' }))` beside the `next-intl/server` double of `:56` (which already answers `en`). No other line of the test changes.
- R1-2 (F3) `src/tests/integration/adminPage.integration.test.ts:27`: add `setRequestLocale: () => undefined` to the `next-intl/server` double. No other line changes.
- Report: `npm test -- src/app/admin/users/__tests__/adminUserGone.security.test.ts` and the integration file (environment: `project-facts.md`) with exit codes; the §8.1 import graph again over every file changed since the commit the revision starts from; typecheck and ESLint on the two files.

## Notes (no change asked)

- N1: the executor did not run I8a and named it; the diff changes no style or markup, and V5a above measured the changed text and links on the dev server.
- N2: the kickoff's Route (D10 at `aacf6ebce`) named 5 integration files; the change's new imports (`getAdminLocale` on 18 pages) widen the graph to 14, and a test double that lacks a newly called function is not visible to either search of §8.1 before the code exists. The executor ran the graph after the change, as §8.1 asks, and found both (F2, F3).

## Open parts

- Opus, after the merge: the production checks of Route step 5.
