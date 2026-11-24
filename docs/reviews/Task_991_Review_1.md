# Task 991 — Review 1

Kickoff: [Sprint_94_kickoff_prompt_Task_991_Existing_And_Blocked_Accounts_Are_Told.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_991_Existing_And_Blocked_Accounts_Are_Told.md) · OWASP record: [Task_991.json](../security/owasp/reviews/Task_991.json)

Review 1 of the working tree on d1cc78258 (branch `task/991-existing-and-blocked-accounts`, uncommitted) — NEEDS REVISION
Scope: every product file of the diff is in the kickoff's Scope; the `docs/` and `tasks/` changes are Opus's (Task 1007 archive, the kickoff re-check).
Findings: Critical 0, High 1, Medium 0, Low 0
Overall risk: the sign-up, sign-in and reset answers are neutral and tested; the reset request runs an unvalidated wildcard search over `auth.users`
with up to 100 Auth admin calls before any human check (F1). The SQL is not applied, so AC5 is UNKNOWN; the unconfirmed-address case is still unmeasured.

## Checklist V

- V1: `owasp.mjs sync` → exit 1, `owasp.mjs check` → exit 1: `O2 React_Security sheet not mapped` (upstream `18e6c89f960e` added the sheet;
  `docs/security/owasp/sheets.json` now lists it). CI runs `sync --verify` and `check` (`.github/workflows/ci.yml:49,51`), so the next CI run fails
  until the sheet is mapped in `docs/security/owasp/controls.json`: Opus's part below, not the executor's. The executor's report restored
  `sheets.json` by hand after its own sync; that hid the O2 result, it did not fix it. `check-ruleset.mjs` → exit 0. `gh run list --branch main`
  → CI and Scorecard of `d1cc78258` success.
- V2: `git diff --stat HEAD` + untracked: `.storybook/main.ts`, `.storybook/stubs/{supabase-client,auth-captcha-actions,auth-explain-refused-sign-in}.ts`,
  `messages/{sq,en,uk,it}.json`, `captcha.ts`, `explainRefusedSignIn.ts`, `AuthSheet.tsx`, `AuthSheet.stories.tsx`, the four tests, the integration
  test and `supabase/sql_migrations/task991/` — all named by Scope. No hunk outside the Cause.
- V3: `npm test --` the six Route files → exit 0, 6 files, 204 passed (reproduces). Deliberate breaks of `explainRefusedSignIn.ts` (token check,
  limit check, password condition), each restored → 2, 1, 2 failed (reproduce). The two report claims that do not hold as written: the dev
  measurement of the unconfirmed address (BLOCKED in the report, still open, see Open parts) and the AC5 run (not run, needs the SQL).
- V4: every changed file read once. The Cause is removed for sign-up (`captcha.ts:112-113`), the blocked sign-in (`explainRefusedSignIn.ts`,
  `AuthSheet.tsx` `explainBan`) and the blocked reset (`captcha.ts:132-146`). `findAccount` (`captcha.ts:30-47`) and `statusOf`
  (`explainRefusedSignIn.ts:17-30`) are the same lookup twice; F1's fix replaces both.
- V5: against `git show main:`: `register_success_*` text changed by owner item 30 / O991-1; the blocked alert is new by O991-2; the
  wrong-credentials answer for an unconfirmed ban is kept (`[SEC-D9-FE-DENY]`). No other surface changed.
- V5a: (1) Pages: BLOCKED: the blocked sign-in needs `public.auth_password_matches`, not applied; the success view needs a sign-up the dev Auth
  answers with 500 (report). (2) Stories, Storybook dev server on port 6008 (the owner's 6006 fails with `ReferenceError: __dirname is not
  defined` from `next/server`: it predates the `.storybook/main.ts` aliases and needs a restart), empty `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
  widths 320, 639, 640, 1024, 1440 × sq, en, uk, it, 60 renders, no horizontal overflow:
  - `LoginBlocked` alert = `LoginValidationError` alert = canonical `mantine-primitives-alert--default` red alert: 16px/24px, weight 400, colour
    rgb(180,35,24), background rgb(254,243,242), radius 12px, border 1px solid rgb(240,68,56), padding 16px, no shadow. Height `LoginBlocked`:
    320px 102 (en) / 126 (sq, uk, it); 639px 82; 640-1440px 102 (126 uk). `LoginValidationError`: 54 everywhere (one line).
  - Link: rgb(180,35,24) (`red.7`, the alert's text colour), underline, 16px/400, `href` `/<locale>/contact` in every locale; focus-visible: outline
    2px solid rgb(236,84,71), offset 2px (the theme's focus ring). The colour differs from the sheet's other `Anchor`s (brand) for contrast on the
    red background (report: 3.2:1 with brand); the theme token is used, no literal: accepted under U12.
  - `RegisterSuccess`: h3 18px/28.08px weight 600 rgb(0,0,0); body 14px/20.02px rgb(71,84,103); button 44px, 14px/500, radius 8px, rgb(236,84,71);
    titles "Kontrolloni emailin tuaj" / "Check your email" / "Перевірте електронну пошту" / "Controlla la tua email". The view's markup is unchanged
    from `main`, only the text.
  - Firefox: not reachable here; no new control or hover state, the link's focus ring is the theme's.
- V6: no allowlist, baseline, `skip` or `eslint-disable` added.
- V7: §2: (1) no control weakened; (2) new entry point `explainRefusedSignIn` (anonymous Server Action) and a new pre-check lookup in the reset
  action (F1); (3) the service role is used by anonymous actions: in `explainRefusedSignIn` only after token, limit and password; in the reset
  action before the token (F1); (4) no package; (5) no test weakened (`[SEC-D9-FE-DENY]` kept and extended); (6) below. §3: Authorization —
  touched (`explainRefusedSignIn.ts`, anonymous by design, service role after the checks); Input and output — touched, F1; Authentication —
  touched, equal answers tested (`[SEC-991-ENUM-DENY]`), timing of the reset lookup is F1; Requests and redirects — touched, fixed internal
  link, `SITE_URL` base (`captcha.ts:65-66`); Next.js entry points — touched, `admin.ts:1` imports `server-only`; Business logic — touched,
  per-address limits `account_notice_mail` and `blocked_signin`; JS/TS — not touched (no new regular expression over unbounded input: the
  `/user is banned/i` test reads Auth's message); Data exposure, errors, logging — touched, codes only, tested; Files — not touched (no upload
  in `git diff --name-only`); Dependencies and configuration — `.storybook/main.ts` only (Story aliases); Agent and tool output — not touched;
  Tests — touched, every AC test fails without the change (V8). `db-catalog-audit.mjs` → exit 0, no finding (before the apply). Read-only on the
  dev database: `admin_search_users_by_email` is `WHERE au.email ILIKE '%' || q || '%' ... LIMIT 100`; `email_templates` has defaults for `id`,
  `created_at`, `updated_at` and `UNIQUE (key, locale)`; `extensions.crypt` and `extensions.gen_salt` exist; all 10 password hashes are `$2a$`.
- V8: the four AC test files on `HEAD` versions of `captcha.ts` and `AuthSheet.tsx` without `explainRefusedSignIn.ts` → exit 1, 14 failed
  (the explain file fails to load); restored, sha1 checked. AC5, AC6, AC7: CI only.
- V9: Stories for the owner: `LoginBlocked` (sign-in → blocked alert with the support link), `RegisterSuccess` (success view, new text), with
  the V5a values; the owner restarts Storybook 6006 first.
- V10: `owasp.mjs review <kickoff> --base main` → exit 0, 45 sheets; `docs/security/owasp/reviews/Task_991.json` written (F1 on
  Denial_of_Service and Input_Validation). React_Security is not in the list because it is not mapped (V1).

## Findings

F1 — The reset request searches `auth.users` by an unvalidated wildcard before any human check
Severity: High      Category: Input and output; Business logic (Denial_of_Service)      CWE: 400, 203
Location: `src/modules/auth/actions/captcha.ts:30-47` (`findAccount`), `:134-139` (called before `verifyTurnstile`); `src/modules/auth/actions/explainRefusedSignIn.ts:17-30`
Description: `requestPasswordResetWithCaptcha` calls `findAccount(email)` for every request whose token is any non-empty string, before the token
is verified. `findAccount` calls `admin_search_users_by_email`, whose body is `au.email ILIKE '%' || q || '%' LIMIT 100` (read on the dev
database), then `auth.admin.getUserById` once per candidate. The address is not checked for shape or length, and `%` and `_` are not escaped.
Impact: any visitor, without solving a CAPTCHA, makes one request cost up to 100 Auth admin calls plus a database search (`email: "%"` returns 100
candidates; none matches exactly, so all 100 are fetched); the response time grows with the number of accounts whose address contains the input,
an enumeration signal before the human check (kickoff T1). The same search in the sign-up mail and in `statusOf` can miss the exact account when
more than 100 addresses contain it.
Reproduction: `requestPasswordResetWithCaptcha({ email: '%', captchaToken: 'x', redirectTo })` → `admin_search_users_by_email('%')` returns up to
100 ids → 100 `getUserById` calls → then Auth refuses the token. The tests mock the search as `includes(q)`, so no test covers it.
Recommendation: look the account up by its exact address in one service-role call, after a shape check of the address (Revision 1).
References: OWASP Denial_of_Service ("Using validation that is cheap in resources first"), Input_Validation, Authentication; `secure-code-review.md` §3.
Status: open

## Revision 1 (executor)

- R1-1 (F1) `supabase/sql_migrations/task991/task991.sql`: add `public.account_status_by_email(p_email text) returns table (id uuid, email text,
  status text, suspended_until timestamptz)`, `language sql stable security definer set search_path = ''`, one row from `auth.users u join
  public.users p on p.id = u.id where lower(u.email) = lower(p_email) and u.deleted_at is null` (exact match, no `like`), `revoke all ... from
  public, anon, authenticated`, `grant execute ... to service_role`. Add a row to `task991-preflight.sql` (the function must not exist yet), to `task991-verify.sql`
  (security definer, empty `search_path`, service role only) and `task991-rollback.sql` (drop). Use the column types of `public.users` as the
  database has them (read them, do not assume).
- R1-2 (F1) one shared helper used by `captcha.ts` and `explainRefusedSignIn.ts` (new file
  `src/modules/auth/lib/accountStatus.ts` with `import 'server-only'`), calling only `account_status_by_email`; `findAccount` and `statusOf`
  are removed. `admin_search_users_by_email` is no longer called by any auth action.
- R1-3 (F1) `requestPasswordResetWithCaptcha`: before the lookup, an address that is not a string, is empty, is longer than 254 characters or has
  no `@` goes straight to Auth as today (no lookup).
- R1-4 tests: `requestPasswordReset.smoke.test.ts` — an address of the wrong shape makes no service-role call; the lookup is one
  `account_status_by_email` call with the lower-cased trimmed address and never `admin_search_users_by_email`; `email: '%'` and `'_'` look up
  nothing else (the double answers exact matches only, as the SQL does). The same assertion in `signUpWithCaptcha.smoke.test.ts` and
  `explainRefusedSignIn.security.test.ts`. `src/tests/integration/authPasswordMatches.integration.test.ts` (or a new
  `accountStatusByEmail.integration.test.ts`): `anon` and `authenticated` → 42501; service role → one row for the synthetic address in any
  letter case, no row for `%` and for an unknown address. Each new test fails with the old `findAccount` (save the failing output).
- Report: the commands, exit codes, failing-first output and a deliberate break (swap the exact lookup back to the wildcard search) with its
  result.

## Open parts of Opus and the owner

- Opus (before the push): map `React_Security` in `docs/security/owasp/controls.json` (O2), keep the synced `sheets.json`, add its verdict to
  `Task_991.json`; until then CI `owasp.mjs sync --verify` / `check` fail.
- Opus (H4): prove `task991*.sql` on the delivery path, then the owner applies it; AC5 runs in the CI `authz` job.
- Unconfirmed address (kickoff Scope, measured first): BLOCKED: the dev Auth answers `unexpected_failure` 500 to a new address as well (report),
  so the case cannot be separated; the cause (the Auth mail sender on dev is the likely one) is UNKNOWN. The owner reads the Auth logs of the dev
  project for those two sign-ups; Opus repeats the measurement once a new address signs up. The executor's test only pins today's mapping of a 500.
- Kickoff deviation accepted: `account_exists` carries the sign-in link and names "Harruat fjalëkalimin?"; no route opens the reset view directly,
  and adding one is outside the Cause (A1).
- Owner: restart Storybook 6006 (the new aliases of `.storybook/main.ts` are read at start).
