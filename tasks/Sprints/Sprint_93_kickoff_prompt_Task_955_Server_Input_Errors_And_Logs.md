# Task 955 — No Server Action hands a database or Supabase error text to the browser

Sprint 93. Priority P1. Owner decisions: 2026-11-06 "all holes found must be fixed"; 2026-11-23 the split of Task 955 by
checklist D4 (one cause per task; translated: "I accept"): this task keeps findings S-04 and S-05 of
`docs/security/audit-2026-11-06/findings.md`; S-07, S-08, A-02, P-02, C-04, T-02 go to Task 1024, C-03 and A-06 to Task 1021,
S-01 to Task 1025, OW-05 to Task 1026, A-07 to Task 1027, C-02 to Task 1028, P-03 to Task 1029. Rewritten 2026-11-23 to the
checklists. Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

Two Server Actions put the error text of the database or of Supabase Auth into the result the browser receives: the
favourite actions return the PostgREST message (S-04), and the sign-up and password-reset actions return Supabase's own
message in `supabaseErrorMessage` (S-05), which the sheet then maps to a text in the browser. A visitor reads table names,
constraint names or Auth's wording in the network answer. After the task each answers a fixed code only; the text goes to
the server log, and every screen shows what it shows on `main`.

## Cause

`src/modules/listings/actions/favoriteActions.ts:40` and `:66` return `{ error: error.message }`;
`src/modules/auth/actions/captcha.ts:40` and `:65` return `supabaseErrorMessage: error.message`, typed at `:20` and `:48`;
`src/modules/auth/components/AuthSheet.tsx:456` maps that text in the browser with `mapAuthError`
(`src/modules/auth/lib/mapAuthError.ts:2-14`).
Fix: the favourite actions answer the fixed code `favorite_failed`; the sign-up action maps the Supabase message on the
server and answers only the resulting key (`errorKey`), the reset action answers no text; the sheet shows that key; each
action logs the error's code and status on the server.

## Scope

- `src/modules/listings/actions/favoriteActions.ts`: `addFavorite` (`:39-40`) and `removeFavorite` (`:64-66`) return
  `{ error: 'favorite_failed' }`; the existing `console.error` keeps the error for the server log.
- `src/modules/auth/actions/captcha.ts`: `SignUpResult` (`:18-20`) carries `errorKey?: string` instead of
  `supabaseErrorMessage`; `signUpWithCaptcha` (`:40`) sets `errorKey: mapAuthError(error.message)` when the reason is
  `signup_failed`; `ResetResult` (`:46-48`) and `requestPasswordResetWithCaptcha` (`:65`) drop the field; both actions log
  `{ code, status }` of a refused call with `console.error` (no address, no message).
- `src/modules/auth/components/AuthSheet.tsx:456`: `setErrorKey(result.errorKey ?? 'error_generic')`.
- Tests: the files of AC1-AC3, including the smoke tests that pin the old field (`signUpWithCaptcha.smoke.test.ts:100`,
  `:119`, `:135`; `requestPasswordReset.smoke.test.ts:106`).
- Dependencies: none.
- Out of scope: what the sign-up says for an address that already has an account (Task 991, owner decision O991-1: one
  neutral answer and a mail); the argument schemas of the actions (Task 1025); every other finding of the old Task 955
  (the tasks named above).
- Kept as on `main` (checklist A2): `favoriteActions.ts`: the same result for success, `unauthenticated` and the blocked
  codes; `FavoriteButton.tsx:97-99` shows `favorite_error` for any error, as today. `captcha.ts`: the same `ok` and `reason`
  values and the same captcha handling. `AuthSheet.tsx`: every sign-up refusal shows the same text as today (the key comes
  from the same `mapAuthError`, now on the server); the reset form stays neutral (`:244-245`); sign-in (`:79`) unchanged.

## Attack surface

Changed: the output of two entry points (`'use server'` actions reachable by any visitor as POST).
- T1 Information disclosure: the database's and Auth's own error text (table and constraint names, Auth's wording)
  reaches the browser → mitigate: a fixed code or a key from a closed set, the text in the server log only → AC1, AC2.
- T2 Denial of service on the person: a sign-up refusal loses its explanation → mitigate: the key is computed on the
  server from the same message, the screen text is unchanged → AC2, AC3.
Authorization matrix: unchanged (no check moves).

## OWASP

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — T1 is the abuse: a visitor provokes a refusal to read the provider's text — AC1, AC2.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — the output of the two actions is the changed surface, named in "## Attack surface" — AC1, AC2.
- Authentication: not applicable — no credential rule or sign-in path changes; the sign-up keeps its checks and only its refusal text moves to the server.
- Authentication_Patterns: not applicable — authentication stays with Supabase Auth; the action changes the shape of its answer only.
- Authorization: not applicable — no access check of the favourite or auth actions moves or changes in this task.
- Authorization_Decisions_And_Output_Handling: not applicable — no authorization decision changes; the favourite actions keep their session and block checks.
- Authorization_Patterns: not applicable — no authorization pattern is added or changed; only the error result changes.
- Authorization_Regression_Testing: not applicable — no access rule changes; the existing favourite access cases stay as they are.
- Authorization_Testing_Automation: not applicable — the authorization matrix is unchanged; the new cases test output, not access.
- Bot_Management_and_Anti-Automation: not applicable — the captcha handling is unchanged; limits are Tasks 959 and 985.
- Cookie_Theft_Mitigation: not applicable — no cookie or session handling changes in either action.
- Credential_Stuffing_Prevention: not applicable — the sign-in path is unchanged; sign-up only loses its raw text.
- Cross_Site_Scripting_Prevention: not applicable — the sheet still renders a key from a fixed list through React text; nothing new is rendered.
- DOM_based_XSS_Prevention: not applicable — no DOM sink changes; the sheet reads a key and shows its translation as before.
- Database_Security: not applicable — no grant, policy or query changes; the PostgREST error is only kept off the result.
- Denial_of_Service: not applicable — no request path gains work; the key mapping is a few string tests on the server.
- Error_Handling: "Unhandled errors can assist an attacker in this initial phase, which is very important for the rest of the attack." — the provider's error text never reaches the browser; the result holds a fixed code or key, the detail stays in the server log — AC1, AC2.
- GraphQL: not applicable — the project exposes no GraphQL endpoint; the word came from the PostgREST mention.
- Input_Validation: not applicable — no argument handling changes here; the schemas of the actions are Task 1025.
- Insecure_Direct_Object_Reference_Prevention: not applicable — the favourite actions keep their user-scoped queries unchanged.
- JavaScript_and_TypeScript_Security: not applicable — no merge, eval or dynamic code; one field of a result type is replaced.
- Logging: not applicable — the server log keeps the error code and status only, no address; personal data in logs is Task 1021.
- Logging_Vocabulary: not applicable — no security event is added here; the vocabulary helper is Task 1026.
- Mass_Assignment: not applicable — no write takes new fields; the insert and delete are unchanged.
- Multi_Tenant_Security: not applicable — no tenant or ownership rule changes in the favourite queries.
- Multifactor_Authentication: not applicable — no authentication factor changes; staff MFA is Task 960.
- Nextjs_Security: "Return only authorized result fields because Server Action return values are serialized to the client." — the results of the two actions lose the provider's text field — AC1, AC2.
- Prototype_Pollution_Prevention: not applicable — no object is merged from input; the results are literals.
- Query_Parameterization: not applicable — no query text is built; the builder calls are unchanged.
- SQL_Injection_Prevention: not applicable — no SQL is written; the PostgREST builder calls stay as they are.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the diff of the two actions, the sheet and the tests — AC1-AC3.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the old kickoff and the audit lines were read against the code before this rewrite, not trusted — AC1-AC3.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — T1 and T2 became AC1-AC3.
- Session_Management: not applicable — no session is created, renewed or ended by either action change.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them for the two outputs — AC1, AC2.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — Opus reruns each test and break of the report — AC1-AC3.
- Web_Frontend_Security: not applicable — no page, header or browser API changes; the sheet shows the same texts.

## UI

No visible change: every refusal shows the same text as on `main`.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 A failed favourite write answers a fixed code — test: `src/modules/listings/actions/__tests__/visitorActions.security.test.ts`
  (extended, `[SEC-955-FAVORITE-ERROR-DENY]`: the insert and the delete answer `{ error: { code: 'XX000', message:
  'permission denied for table favorites' } }`; each action returns `{ error: 'favorite_failed' }`, its result holds no
  part of the message, and the server log receives the code).
- AC2 The auth actions answer no Supabase text — test: `src/modules/auth/actions/__tests__/captcha.security.test.ts`
  (changed `:59`, `:67`, `:154`, `[SEC-955-AUTH-TEXT-DENY]`: for "User already registered", "Password should be at least 6
  characters", "email rate limit" and an unknown message the sign-up result is `{ ok: false, reason: 'signup_failed',
  errorKey }` with `error_email_exists`, `error_weak_password`, `error_rate_limit`, `error_generic`, and
  `JSON.stringify(result)` holds no part of the message; a captcha refusal is `{ ok: false, reason: 'captcha_failed' }`;
  the reset result is `{ ok: false, reason: 'reset_failed' }` with no other field), with the smoke tests of the Scope.
- AC3 The sheet shows the key it receives — test: `src/modules/auth/components/__tests__/AuthSheet.test.tsx` (changed
  `:452-460`: the mocked action answers `errorKey`; the alert shows `error_email_exists`, `error_weak_password`,
  `error_rate_limit`; a result with no key shows `error_generic`).
- AC4 CI — test: `gh pr checks <n>`: every check passes.

## Route

1. Read this kickoff, the Scope files and their `main` versions (`git show origin/main:<path>`).
2. Write the AC1-AC3 tests; run each and keep its failing output:
   `npm test -- src/modules/listings/actions/__tests__/visitorActions.security.test.ts`
   `npm test -- src/modules/auth/actions/__tests__/captcha.security.test.ts src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts src/modules/auth/actions/__tests__/requestPasswordReset.smoke.test.ts`
   `npm test -- src/modules/auth/components/__tests__/AuthSheet.test.tsx`
3. Make the change of the Scope; run the same three commands; each exits 0. Nothing else runs locally (A5).
4. I9: put `error.message` back once in `favoriteActions.ts` and `supabaseErrorMessage` once in `captcha.ts`, show AC1 and
   AC2 failing, restore.
5. Report (checklist I12). CI runs only on GitHub after the owner's push and is read with `gh pr checks <n>`.

## Review
