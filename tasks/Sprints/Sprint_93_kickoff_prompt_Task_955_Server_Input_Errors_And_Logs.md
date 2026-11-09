# Task 955 — Every Server Action refuses malformed arguments, no error is swallowed, and no log line carries a person's address

Sprint 93. Priority P1. Owner decisions 2026-11-06: D1 "rewrite the rules of the flow and the gates" on the OWASP
reference; the owner, the same day: "all holes found must be fixed"; and "check the whole project, every file, every
line". Filed by the whole-project audit (`docs/security/audit-2026-11-06/findings.md`, findings S-01, S-04, S-05, S-07,
S-08, A-02, A-06, A-07, C-02, C-03, C-04, P-02, P-03, T-02, OW-05). Implementer: Sonnet, after Task 952 (it edits
`eslint.config.mjs`). Reviewer: Opus. Human owner of the change: the owner.

## Goal

Today (sources in `findings.md`):
- 94 exported functions in 25 `'use server'` files are public POST endpoints (`grep -cE "^export (async )?function"` per
  file, 2026-11-07). About 30 of them read fields of an argument whose runtime type is never checked, so a number, `null`
  or an object gives a 500 instead of a refusal, and several text fields have no length bound (S-01: `sendInquiryReply`
  `body`, `updateUserProfileFull` `locationId`, `setListingPremium` `premiumUntil`, `createLocation` `image_url`, …).
- Database error text reaches the browser: `favoriteActions.ts:40,66` (S-04); Supabase's own sign-up text ("User already
  registered") is returned by `captcha.ts:40,65`, which tells a stranger that an address has an account (S-05).
- Failed writes vanish: four `catch {}` around `support_ticket_events` inserts and notifications whose PostgREST error
  is returned, not thrown (`admin/actions/index.ts:918-1002`, S-07); empty `catch {}` at `admin/actions/locale.ts:27`,
  `lib/auth/server.ts:120`, `app/auth/confirm/route.ts:109` (S-08, A-02); `admin/listings/page.tsx:50-58` (P-02, stale
  comment "RPC not yet applied"); a dead module with an empty catch, `notifications/lib/emails/resolveUserLocale.ts` (C-04).
  No lint rule refuses an empty catch (T-02).
- Personal data in logs: the recipient address is logged on a failed send (`emails/send.ts:58-61,76,110`,
  `emailChange.ts:205,208`, `contactInquiry.ts:270`, `listingInquiry.ts:156`, C-03); `upload-avatar/route.ts:91,113`
  logs user id and public id on every upload (A-06); Sentry samples every trace (`tracesSampleRate: 1` in
  `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation-client.ts`, C-02).
- `Number(sp.page)` gives `NaN` for `?page=x` at `admin/users/page.tsx:36` and `admin/listings/page.tsx:32` (P-03).

After the task: every exported Server Action parses its arguments with a zod schema before any other work and answers a
typed refusal for anything else; no catch is empty without a written reason; errors to the browser are generic; no log
line carries an e-mail address; the trace sample rate is a stated fraction.

## Scope

- Files to change: every `'use server'` file listed by
  `grep -rlE "^['\"]use server['\"]" src --include=*.ts | grep -v test` (25 files); a schema module per action module
  (`<module>/actions/schemas.ts`), reusing `src/lib/security/inputs.ts`; `favoriteActions.ts`; `auth/actions/captcha.ts`
  (no `supabaseErrorMessage` field in either result type, lines 20 and 48; `signup_failed` and `reset_failed` stay
  generic; the Supabase text goes to the server log
  only); `admin/actions/index.ts:918-1002`, `admin/actions/locale.ts`, `lib/auth/server.ts`, `app/auth/confirm/route.ts`,
  `app/admin/listings/page.tsx`, `app/admin/users/page.tsx`; delete `emails/resolveUserLocale.ts` with its test `emails/__tests__/resolveUserLocale.test.ts`, and correct the
  comments that name it (`InactivityWarningEmail.tsx:8`, `ReporterNotificationEmail.tsx:7`); `emails/send.ts`,
  `emailChange.ts`, `contactInquiry.ts`, `listingInquiry.ts` (log a 12-hex SHA-256 of the lower-cased address with
  `LOG_CORRELATION_SALT`, the scheme of `auth/actions/recovery.ts`, never the address); `api/upload-avatar/route.ts`;
  the three Sentry configurations (`tracesSampleRate: 0.1`, Opus proposal; the owner may change the number);
  `eslint.config.mjs` (`no-empty` with `allowEmptyCatch: false` for `src/**`; a catch that must stay empty holds a
  comment saying why, which `no-empty` accepts).
- Security events in the OWASP Logging Vocabulary (added 2026-11-07 by the OWASP gate, finding OW-05): one helper
  `src/lib/security/securityEvent.ts` writes one JSON line `{ datetime (ISO 8601 with offset), appid: "lero.al", event,
  level, description }` with the vocabulary's names: `input_validation_fail:(<fields>),<user hash>` when a schema refuses
  (T1), `authz_fail:<user hash>,<resource>` when a guard refuses, `excess_rate_limit_exceeded:<user hash>,<max>` (used by
  Task 959), `authn_login_fail:<address hash>` on a failed sign-in action, `authz_admin:<user hash>,<event>` on each
  staff write; the user is the salted hash above, never an address.
- The Supabase e-mail hook (A-07): `src/app/api/auth-email-hook/route.ts` refuses with 401 whenever
  `SUPABASE_EMAIL_HOOK_SECRET` is unset, whatever `NODE_ENV` says (a local run sets the secret in `.env.local`).
- Dependencies: none (zod 4 is already a dependency, `package.json:187`).
- Out of scope: authentication and abuse controls (Task 959), database policies (Task 956), uploads (Task 957).

## Attack surface

Changed: the argument handling of every Server Action (94 endpoints) and the error text they return.
- T1 Tampering / denial of service: a malformed or oversized argument reaches a query or throws a 500. Mitigation: a
  schema per action (types, allow-listed keys, lengths, integer ranges, UUIDs), parsed first.
- T2 Information disclosure: database and Supabase error text, and account existence, reach the browser. Mitigation:
  generic codes; details in the server log only.
- T3 Repudiation: a lost audit row or notification is invisible. Mitigation: every returned error is read and logged.
- T4 Information disclosure: e-mail addresses in logs and Sentry. Mitigation: a salted hash instead of the address.

Authorization matrix: unchanged (the schemas run before the existing checks; the order of the checks is not changed).


## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — hostile argument shapes are the abuse cases of T1 — AC1.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names each entry point the task adds, removes or changes — AC1, AC3, AC6.
- Authentication: "the same approach of a generic error message can be applied regarding the case in which the user exists" — sign-up answers the same for a new and an existing address — AC3.
- Authentication_Patterns: not applicable — no authentication mechanism changes; captcha.ts loses an error field only.
- Authorization: not applicable — the schemas run before the existing checks; the order and the checks are unchanged (matrix unchanged).
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — an unparsable argument is denied, never passed on — AC1.
- Authorization_Patterns: not applicable — no access check moves; the parse runs first and the checks stay where they are.
- Authorization_Regression_Testing: not applicable — no access rule changes; the existing suites run unchanged in AC11.
- Authorization_Testing_Automation: not applicable — the matrix is Task 950; this task adds argument tables, not access rows.
- Bot_Management_and_Anti-Automation: not applicable — limits and the contact-form captcha are Task 959.
- Cookie_Theft_Mitigation: not applicable — no cookie is created or changed by argument parsing or logging.
- Credential_Stuffing_Prevention: not applicable — the sign-in defenses are unchanged; their limits are Task 959.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the two admin pages render text through React escaping only; lint (react/no-danger, no-script-url) runs on them — AC11.
- Cryptographic_Storage: not applicable — the existing salted SHA-256 correlation hash is reused; nothing new is stored.
- Database_Security: not applicable — no grant or policy changes; PostgREST errors are only read and logged.
- Denial_of_Service: "Using validation that is cheap in resources first" — length and type limits run before any database call — AC1, AC2.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — the two admin pages add no eval, Function, innerHTML or computed URL; lint (no-eval, no-implied-eval) and client-sinks check them — AC11.
- Email_Validation_and_Verification: not applicable — the e-mail change flow only stops logging the address; normalization is Task 959 AC13.
- Error_Handling: "Unhandled errors can assist an attacker in this initial phase, which is very important for the rest of the attack." — no empty catch and no database text to the browser — AC3, AC5.
- File_Upload: not applicable — upload-avatar only loses its debug line; upload validation is Task 957.
- Forgot_Password: "Return a consistent message for both existent and non-existent accounts." — the recovery answer stays neutral and carries no Supabase text — AC3.
- GraphQL: not applicable — the graphql endpoint is not touched; PostgREST error handling only.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — a schema per action is parsed first, whatever the form checked — AC1, AC2.
- Input_Validation: "Reject invalid requests with a clear error; do not continue with partially validated data." — a refused argument answers the refusal result and nothing runs — AC1.
- Insecure_Direct_Object_Reference_Prevention: "implement access control checks for each object that users try to access" — ids are parsed as UUIDs before the existing ownership checks run — AC1.
- JavaScript_and_TypeScript_Security: "Never pass untrusted input to a recursive merge or set-by-path helper" — no action merges argument objects; the schema output is the only object used — AC1.
- Key_Management: not applicable — LOG_CORRELATION_SALT is reused as is; making it required is Task 959.
- Logging: "The following should usually not be recorded directly in the logs, but instead should be removed, masked, sanitized, hashed, or encrypted" — addresses are logged as a salted hash only — AC6.
- Logging_Vocabulary: "Developers must embrace this standard and begin to implement" — security events use the vocabulary names and format — AC12.
- Mass_Assignment: "DTOs and field allowlists restrict writable properties; they do not replace authorization for the requested object and operation." — the schemas allow-list the keys each action reads — AC1.
- Multi_Tenant_Security: not applicable — row ownership rules are unchanged; Task 956 owns the policies.
- Multifactor_Authentication: not applicable — no sign-in factor changes; staff MFA is Task 960.
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — every exported action is called directly with hostile arguments — AC1.
- Prototype_Pollution_Prevention: "If objects have to be used then they should be created using the Object.create(null) API" — an argument with a __proto__ key is refused; parsed objects carry only schema keys — AC1.
- Query_Parameterization: not applicable — no query text is built; values go through the builder as before.
- REST_Security: not applicable — the confirm route changes only its error handling; its access decision is unchanged.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the whole diff; changed-line coverage and the file checks run on it — AC11.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input: Opus reruns every acceptance command in review — AC11.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the mitigations of the threat model are the acceptance criteria of this task — AC1, AC3, AC6.
- Session_Management: not applicable — no session handling changes; lib/auth/server.ts changes its error path only.
- SQL_Injection_Prevention: not applicable — queries stay PostgREST builder calls; the task adds no query text.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them and each mitigation is an acceptance criterion — AC1, AC3, AC6.
- Transaction_Authorization: not applicable — the re-authentication of e-mail change is unchanged; only its log line changes.
- User_Privacy_Protection: "Preventing leakage of user IP addresses is of great significance when user protection is in scope." — no address reaches a log line or Sentry — AC6.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC11.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the two admin pages use no innerHTML; lint (react/no-danger) fails on one — AC11.
- Web_Service_Security: "Schema validation enforces constraints and syntax defined by the schema." — zod schemas with allow-listed keys, lengths and ranges — AC1, AC2.
- Webhook_Security: "Return `401` when the signature is missing or does not match, and do not say why." — the e-mail hook answers 401 when its secret is unset in any environment — AC13.
- Serverless_FaaS_Security: "Enforce authentication and authorization on all triggers (API Gateway, Pub/Sub, S3, IoT)." — the hook trigger is authenticated in every environment, never open in development — AC13.
- Secrets_Management: not applicable — no secret is created, stored or moved; the hook only refuses when its existing secret is absent.
- Nodejs_Security: not applicable — no new Node API, module or runtime pattern; the change removes one environment branch.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 Every exported Server Action, called with each of `undefined`, `null`, `42`, `{}`, `[]`, a 100 000-character
  string and an object with an unknown key `__proto__`, answers its refusal result and never throws — test:
  `src/__tests__/security/serverActionArguments.test.ts` (new): it lists the exports of every `'use server'` file through
  the TypeScript syntax tree (the method of `serverEntryGuards.test.ts`), fails on an export missing from its table, and
  calls each one with Supabase and the session mocked. Deliberate break: remove one schema, see its rows fail.
- AC2 The fields S-01 names are bounded — test: `src/__tests__/security/serverActionArguments.test.ts`, one case per field of S-01 (the longest allowed value
  passes, one character more is refused; `premiumUntil` that does not parse is refused; `image_url` outside
  `isTrustedImageUrl` is refused).
- AC3 No database or Supabase error text reaches the browser, and sign-up answers the same for a new and an existing
  address — test: `src/modules/listings/actions/__tests__/favoriteActions.security.test.ts` (new) and
  `src/modules/auth/actions/__tests__/captcha.security.test.ts` (changed: the three cases expecting `supabaseErrorMessage`, lines 59, 67 and 154,
  now expect no such field).
- AC4 A returned PostgREST error on the support-event and notification writes is logged with its code — test:
  `src/modules/admin/actions/__tests__/adminOperations.security.test.ts` (extended: the insert answers `{ error }`, the
  log spy sees the code, the action still answers its result).
- AC5 No empty catch in product code — test: `npm run lint` (the `no-empty` rule) and
  `src/__tests__/eslintConfig.test.ts` (Task 952 creates it; extended: `no-empty` is an error with `allowEmptyCatch: false` for `src/**`).
- AC6 No log line carries an e-mail address — test: `src/modules/notifications/lib/emails/__tests__/send.security.test.ts`
  (new): each failure path of `send.ts`, `emailChange.ts`, `contactInquiry.ts`, `listingInquiry.ts` is driven with
  `ana@example.com`; no `console` argument contains it, and the hash does.
- AC7 `upload-avatar` writes no debug line on success — test:
  `src/app/api/upload-avatar/uploadAvatar.security.test.ts` (extended: no `console.log` call on a successful upload).
- AC8 The trace sample rate is below 1 in all three Sentry configurations — test:
  `src/lib/security/__tests__/sentryConfig.test.ts` (new) reads the three files.
- AC9 `?page=x`, `?page=-1` and `?page=1e9` give page 1 or the last page, never `NaN` — test:
  `src/app/admin/users/__tests__/pageParam.test.ts` (new, both admin pages through one shared parser).
- AC10 `resolveUserLocale.ts` is gone and nothing imports it — test: `node scripts/quality/check-files.mjs --worktree`
  (stale paths) and `npm run typecheck`.
- AC11 `npm run lint`, `npm run typecheck`, `npm test -- --coverage`,
  `node scripts/quality/changed-lines-coverage.mjs --base main`, `node scripts/quality/check-files.mjs --worktree` and
  `node scripts/quality/ac-tests.mjs --base main tasks/Sprints/Sprint_93_kickoff_prompt_Task_955_Server_Input_Errors_And_Logs.md`
  exit 0.
- AC13 The e-mail hook refuses every request when its secret is missing, in every environment (A-07: today
  `src/app/api/auth-email-hook/route.ts:237` refuses only when `NODE_ENV` is `production`) — test:
  `src/app/api/auth-email-hook/__tests__/route.security.test.ts` (new or extended: no secret with `NODE_ENV` test or
  development answers 401 and sends nothing; a valid signature still passes).
- AC12 Security events use the vocabulary — test: `src/lib/security/__tests__/securityEvent.test.ts` (new: each event
  name of the scope renders the vocabulary's format, the datetime parses with its offset, an address passed as the user
  never appears) and `src/__tests__/security/serverActionArguments.test.ts` (a refused argument writes one
  `input_validation_fail` line naming the field).

## Route

1. Wait until Task 952 is merged (it owns `eslint.config.mjs` and `package.json`). Branch from `main`.
2. Tests first: AC1-AC9 on the unchanged code; save each failing output.
3. Schemas and parsing, file by file; then errors, logging, Sentry, the page parser, the ESLint rule; delete
   `resolveUserLocale.ts`.
4. Run AC1-AC13. For AC1, AC6 and AC12, remove the control once, show the failure, restore it.
5. Report: each command, its exit code and the relevant output; each failing-first run; each deliberate break.

## Review
