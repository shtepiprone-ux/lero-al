# Task 991 — Sign-up with a registered address, and a blocked account, are told the truth without telling strangers

Sprint 94. Priority P1. Owner decisions: owner list item 30 (2026-11-19, translated): "if a user with this e-mail already
exists, after all fields and 'Register' show an error that the e-mail exists and offer to sign in. Now I see 'Registration
completed', but that is not true!"; O991-1 (2026-11-19): the same neutral message, plus an e-mail to the existing address
("you already have an account: sign in or reset your password"); O991-2 (2026-11-19, translated): "I agree with sending
the e-mail, but it is still poor UX when the user does not understand why they cannot get into their account" (item 32);
D21 (2026-10-17, Task 923): a banned account sees the wrong-credentials text — O991-2 narrows it to a caller who has not
proved the password. Plan file: `tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`. Implementer: Sonnet. Reviewer:
Opus. Human owner of the change: the owner.

## Goal

A person who registers with an address that already has an account reads "Registration completed" and gets no mail; a
blocked person who signs in with the right password reads "wrong e-mail or password", and a reset request for a blocked
address sends a link that cannot work. After the task: the sign-up answer is neutral and true for every address ("check
your e-mail"), and the mail tells the owner of an existing address to sign in or reset, or that the account is blocked and
how to reach support; a blocked account that proves its password at sign-in is told it is blocked and how to reach
support; a reset request for a blocked address sends the blocked mail instead of a link. Nobody who proves neither the
address nor the password learns that an account exists or is blocked.

## Cause

Read at `dc5e3af66`
- `signUpWithCaptcha` returns `ok` whenever Supabase returns no error (`src/modules/auth/actions/captcha.ts:34-41`), and the sheet then shows `auth.register_success_title` (`src/modules/auth/components/AuthSheet.tsx:469-470`) "Ваш акаунт створено". Measured 2026-11-19 on the real Auth with the test account `HYDRATION_AGENT2`: `node auth-991-probe.mjs` → `signUp existing confirmed address → error: none | user returned: true | identities: 0 | session: false | same id as the real account: false`.
- A blocked account is banned in Auth (`src/lib/auth/accountAccess.ts:7-12`), and Auth refuses it before it checks the password: the same run → `banned + WRONG password → error: user_banned 400`, `banned + RIGHT password → error: user_banned 400`, `unknown address → error: invalid_credentials 400` (ban of 2 minutes, lifted in the same run: `ban lifted: yes`). So the sheet maps `user is banned` to the wrong-credentials text (`src/modules/auth/lib/mapAuthError.ts:4-6`): showing the ban as it comes would tell anyone that an address is registered and blocked.
- The reset request passes every address to Auth (`src/modules/auth/actions/captcha.ts:59-66`), so a blocked address gets a reset link it cannot use.

Fix: the sign-up action detects the existing address (`identities` empty) and mails it, the answer stays neutral; a refused sign-in with `user_banned` is explained only after a server check of the password (service role, CAPTCHA, limiter); the reset action sends the blocked mail to a blocked address instead of calling Auth.

## Scope

- Dependencies: Task 957 (the shared limiter `consume_rate_limit`, O957-1). Measured first by the task (`UNKNOWN` today): what `signUp` answers for an address whose account is not confirmed yet; the case gets the answer the measurement shows, with a test.
- `supabase/sql_migrations/task991/` (owner-applied, with rollback and read-only checks): `public.auth_password_matches(p_email text, p_password text) returns boolean`, `SECURITY DEFINER`, `search_path` pinned, `EXECUTE` revoked from `public`, `anon`, `authenticated` and granted to `service_role` only; it compares `crypt(p_password, encrypted_password)` for the one `auth.users` row of the lower-cased address and runs one dummy `crypt` for an unknown address; it raises nothing that carries an argument. Two sq rows in `email_templates` (`account_exists`, `account_blocked`), shaped like the existing keys (read first).
- `src/modules/auth/actions/captcha.ts`: `signUpWithCaptcha` — after Auth's answer with `identities` empty, looks up the address in `users` (service role) and, through `consume_rate_limit('signup_existing_mail', <address>)` (one mail per address per hour), sends `account_exists` (sign-in and reset links) or, for `blocked`/`inactive`, `account_blocked` (support link `/<locale>/contact`, the end date when `suspended_until` is set); the lookup and the mail run in `after()` (`next/server`), so the answer and its time do not depend on the address; returns `ok` in every case. `requestPasswordResetWithCaptcha` — looks the address up first; a `blocked`/`inactive` address verifies the token with `verifyTurnstile` (`src/lib/captcha/verifyTurnstile.ts:35`) and sends `account_blocked` in `after()` instead of calling Auth; the answer is the same `ok`.
- `src/modules/auth/actions/explainRefusedSignIn.ts` (new server action): input `{ email, password, captchaToken }`; `verifyTurnstile` first, then `consume_rate_limit('blocked_signin', <address> + <client address>)`, then `auth_password_matches` and the `users` status; `{ blocked: true, until? }` only when the password matches and the status is `blocked`/`inactive`; otherwise `{ blocked: false }`.
- `src/modules/auth/components/AuthSheet.tsx`: on `user_banned` the sheet takes a fresh token from the existing `CaptchaWidget` and calls the action; `blocked` → `auth.error_account_blocked` with the support link (and the date); otherwise the wrong-credentials text as today. `auth.register_success_title`/`_body` become true for every address ("Check your e-mail: we sent the next step to the address you gave").
- `messages/{sq,en,uk,it}.json`: the keys above.
- Out of scope: Google sign-in of a blocked account (Auth refuses it with the same ban; the sheet keeps its text, Task 960 carries staff MFA).

## Attack surface

Changed: a new password check outside Auth, two public actions that send mail, and a new answer of the sign-in sheet.
1. **What are we working on?** `explainRefusedSignIn` and the two existing auth actions — callable by any visitor;
   `auth_password_matches` — reads `auth.users.encrypted_password`, service role only. Input: address, password, token.
2. **What can go wrong?**
   - T1 S/I (enumeration): the answer, the time or the mail tells a stranger that an address exists or is blocked →
     mitigate: the same answer and shape for every address; the blocked status only after the password matches;
     the dummy `crypt` → AC1, AC3, `SEC-991-ENUM-DENY`.
   - T2 S (password guessing past CAPTCHA and Auth's limit): the new check becomes a free guessing oracle → mitigate:
     a fresh Turnstile token and the shared limiter before the check; the action never signs anyone in → AC3,
     `SEC-991-GUESS-DENY`.
   - T3 E/I: `auth_password_matches` callable by `anon`/`authenticated`, or its search path hijacked → mitigate: grants
     and `search_path` checked by `db-catalog-audit` → AC5.
   - T4 D (mail bombing): repeated sign-ups or resets flood an address → mitigate: one mail per address per hour → AC2.
   - T5 I: the password reaches a log → mitigate: no argument in any raise or log line; the action logs codes only → AC3.
3. Each mitigation is an acceptance criterion with a test that fails when the control is removed.
4. Authorization matrix: rows `SEC-991-BLOCKED-EXPLAIN-ALLOW` (right password, blocked → told), `SEC-991-ENUM-DENY`
   (wrong password or unknown address → the wrong-credentials answer), `SEC-991-GUESS-DENY` (no or reused token, over the
   limit → refused before the check), `SEC-991-RPC-DENY` (`anon`/`authenticated` call → permission denied).

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-19).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — T1-T5 name enumeration, guessing, the open function, mail bombing and a logged password — AC1-AC5.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the new action, the SQL function and the two changed actions — AC3, AC5.
- Authentication: "Using any of the authentication mechanisms (login, password reset, or password recovery), an application must respond with a generic error message regardless of whether:" — sign-up, reset and sign-in answer alike for every address; the block is told only after the password matches — AC1-AC4.
- Authentication_Patterns: "Do not embed authentication in new systems." — Auth stays the only sign-in; the new check never creates a session and only explains a refusal Auth already gave — AC3.
- Authorization: not applicable — the actions act for an anonymous visitor on nothing but the address they typed; no role check changes.
- Authorization_Decisions_And_Output_Handling: not applicable — no authorization decision is added; the output is one boolean and a date.
- Authorization_Patterns: not applicable — no access rule moves between layers.
- Authorization_Regression_Testing: not applicable — no role rule changes; AC5 covers the new function's grants.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — `SEC-991-RPC-DENY` runs on the real development project — AC5.
- Bot_Management_and_Anti-Automation: "Per endpoint — the login endpoint deserves a tighter limit than the home page." — the explain action and the mails have their own limiter keys — AC1, AC3.
- Content_Security_Policy: not applicable — the existing Turnstile widget and policy are unchanged.
- Cookie_Theft_Mitigation: not applicable — no cookie is set or read by the new action.
- Credential_Stuffing_Prevention: "or similar puzzle for each login attempt can help to identify automated/bot attacks" — a fresh Turnstile token for each explain call — AC3.
- Cross_Site_Scripting_Prevention: not applicable — the new texts are message keys; the date is formatted text.
- Cryptographic_Storage: not applicable — the stored hash is Auth's own; the function only compares with `crypt` and stores nothing.
- DOM_based_XSS_Prevention: not applicable — no new sink; the support link is a fixed internal path.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — `EXECUTE` for `service_role` only, `search_path` pinned — AC5.
- Denial_of_Service: "Using validation that is cheap in resources first" — the token and the limiter run before the costly `crypt` — AC3.
- GraphQL: not applicable — the project serves no GraphQL endpoint.
- Identity_Propagation_Patterns: "Each receiving service must still authorize the requested action and resource." — the database grants the function to the service role alone, whatever the caller — AC5.
- Input_Validation: "Reject invalid requests with a clear error; do not continue with partially validated data." — an address, password or token of the wrong shape is refused before any lookup — AC3.
- Insecure_Direct_Object_Reference_Prevention: not applicable — the only object is the account of the address the caller proves.
- JavaScript_and_TypeScript_Security: not applicable — no merge, path setter or regular expression over input.
- Key_Management: not applicable — no key is created, read or rotated; Turnstile's secret is used as today.
- Logging: "The following should usually not be recorded directly in the logs, but instead should be removed, masked, sanitized, hashed, or encrypted" — the actions log codes only, never the address or password — AC3.
- Logging_Vocabulary: not applicable — the task adds no security event to the log vocabulary.
- Mass_Assignment: not applicable — no record is written from caller fields.
- Multi_Tenant_Security: not applicable — no tenant-scoped data is read; the account is the caller's own address.
- Multifactor_Authentication: not applicable — the factors of sign-in are unchanged (Task 960 carries MFA).
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — `explainRefusedSignIn` checks token and limiter itself, tested by direct call — AC3.
- OAuth2: not applicable — Google sign-in is out of scope and unchanged.
- Prototype_Pollution_Prevention: not applicable — no object is built from client keys.
- Query_Parameterization: "Dynamic SQL can be parameterized using bind variables, to ensure the dynamically constructed SQL is secure." — the function takes typed arguments and builds no dynamic SQL — AC5.
- SQL_Injection_Prevention: "use parameterized queries for dynamic data values" — the address and password reach SQL only as function arguments through the RPC — AC5.
- Secrets_Management: not applicable — no secret is added; the service-role key and the Turnstile secret stay where they are.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — reviewed with the review-task skill on this task's diff — AC7.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC7.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threat model's mitigations are AC1-AC5.
- Session_Management: not applicable — no session is created, renewed or ended by the new action.
- Third_Party_Javascript_Management: not applicable — the Turnstile script is already loaded by the existing widget; nothing is added.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — answered in "## Attack surface" — AC1-AC5.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results and Opus proves the SQL — AC7.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the sheet renders message keys and a link, no HTML — AC4.

## UI

GR-0 queries: "sign-in error with a link", "registration success". Inspected: `AuthSheet` (its Stories), the existing
error `Alert` of the sheet and `CaptchaWidget`. Decision: REUSE the sheet's error alert and success view with new text
and a support link. Reference research (GR-7): inherited canonical design — owner decision 2026-10-20 (`AuthSheet`).

## Mobile adaptation record
- Scope: visible
- Surfaces: src/modules/auth/components/AuthSheet.tsx — the sign-in error with the support link and the registration success text
- Component families: form-picker-and-choice
- Pattern IDs: form-stack
- Standards: w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineFormSectionStack.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): the sheet's existing stack; 640px transition unchanged
- Mobile order: e-mail → password → error with the support link → sign-in button
- Required-content treatment: the error text and the link wrap at full width; no truncation
- Story and verification: AuthSheet sign-in with the blocked error and the registration success at 320px, 639px and 640px × sq, en, uk, it

## Acceptance criteria

- AC1 Sign-up is neutral and the existing address gets its mail — test: `src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts` (extended): `identities: []` → `ok` and one `account_exists` mail; a blocked address → `account_blocked`; a new address → no mail; a second attempt within the hour → `ok`, no second mail; `SEC-991-ENUM-DENY`: the answers of the three cases are equal.
- AC2 A reset for a blocked address sends the blocked mail — test: `src/modules/auth/actions/__tests__/requestPasswordReset.smoke.test.ts` (extended): blocked → `verifyTurnstile`, `account_blocked`, no Auth call, `ok`; active → Auth as today; a failed token → `captcha_failed` in both.
- AC3 Only the right password learns the block — test: `src/modules/auth/actions/__tests__/explainRefusedSignIn.security.test.ts` (new): right password + blocked → `blocked: true` (with `until`); wrong password, unknown address, active account → `blocked: false`; `SEC-991-GUESS-DENY`: no token, a refused token, over the limit → refused before `auth_password_matches` is called; no log line carries the password.
- AC4 The sheet tells a blocked person — test: `src/modules/auth/components/__tests__/AuthSheet.blocked.test.tsx` (new): `user_banned` + `blocked: true` → `error_account_blocked` with the `/contact` link; `blocked: false` → `error_invalid_credentials`; `src/modules/auth/lib/__tests__/mapAuthError.test.ts` (new): `user is banned` → `error_invalid_credentials`.
- AC5 The function is reachable by the service role only — test: `src/tests/integration/authPasswordMatches.integration.test.ts` (new, real Supabase development project, CI `authz` job): `anon` and `authenticated` → permission denied (`SEC-991-RPC-DENY`), service role → true/false; `node scripts/quality/db-catalog-audit.mjs` reports none of: `auth_password_matches` executable by `anon`/`authenticated`, without a pinned `search_path`.
- AC6 Texts and Stories hold — test: `node scripts/check-i18n-parity.mjs`, `node scripts/quality/locale-safety.mjs`, `node scripts/check-mobile-adaptation-contract.mjs` and the census of `.claude/rules/shared/rendered-state-census.md` for the changed `AuthSheet` Stories.
- AC7 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. Starts after Task 957 is merged. Branch from `main`. Read the auth actions, `AuthSheet`, `CaptchaWidget`, `verifyTurnstile`, `accountAccess.ts`, the limiter of 957 and `email_templates` rows. Measure the unconfirmed-address case on the development project.
2. Tests first (AC1-AC5); save each failing output.
3. The SQL with rollback and read-only checks, the actions, the sheet, the texts. One pass over every changed file (checklist I7).
4. Run: the task tests · CI on GitHub only (`gh pr checks <n>`, checklist A5); deliberate breaks: the token check, the limiter, the password condition, the grant — each restored.
5. Report: each command, exit code, relevant output. Opus proves the SQL on the owner's delivery path before the owner applies it; after the merge Opus repeats `auth-991-probe.mjs` through the site with `HYDRATION_AGENT2` (sign-up, reset, blocked sign-in) and reads the mails' log rows.

## Review
