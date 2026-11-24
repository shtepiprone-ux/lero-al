# Task 959 — One password rule on every path, abuse limits on the shared limiter, a key per purpose, and staff read only what their keys allow

Sprint 93. Priority P1. Owner decisions: D1 2026-11-06 (rules on the OWASP reference); the owner 2026-11-06 "all holes
found must be fixed"; O-R01 2026-11-07; O957-1 2026-11-18 (Task 957 builds the shared sliding limiter
`consume_rate_limit`; this task moves its call sites onto it). Filed by the whole-project audit
(`docs/security/audit-2026-11-06/findings.md`: A-03, A-04, A-09, S-02, S-06, S-09, S-11, OW-02, OW-03, L-02, L-03, C-01,
P-04, P-05, P-07; P-06 moved to Task 988 and P-01 to Task 1007 on 2026-11-19). Revised 2026-11-19 by Opus (cause rule, O957-1, Task 988).
Implementer: Sonnet, after Tasks 955 (the `securityEvent` helper) and 957 are merged (952 and 956 are: `b1c7b4147`, `d506fae33`). Reviewer: Opus (also the SQL
round trip). The owner applies the SQL, sets the variables and the Supabase Auth password settings.

Owner decisions:
- O-R01, retention (P-07). DECIDED 2026-11-07 (translated: "agreed"): a contact-form or inquiry sender's IP is cleared
  after 7 days; reveal rows are deleted after 2 days; a listing view keeps its account id and fingerprint for 2 days, then
  both are cleared and the row stays, so the public view count does not drop.
- O-L03, the password rule. Opus proposal: at least 12 characters, at most 128, every character allowed, the composition
  rule of `src/lib/passwordRules.ts:11-15` (an upper-case and a lower-case letter, a digit, one of `!@#$%*=`, 8
  characters) removed, because the Authentication sheet says "There should be no requirement for upper or lower case or
  numbers or special characters."; the server refuses a password found in the breached list (Have I Been Pwned range
  query: only the first five hex of the SHA-1 leave the server). Supabase Auth's own length and required-character
  settings apply to "new users and existing users changing their passwords"
  (supabase.com/docs/guides/auth/password-security, read 2026-11-19); its leaked-password check "is available on the
  Pro Plan and above". DECIDED 2026-11-19 for the residual (translated): "if a password leaked, it is certainly not from
  us, it is the user's responsibility. Moreover, this check now happens in Chrome itself." The owner accepts that a
  direct Auth API call on the free plan can set a breached password; the breached check on the app's own paths stays.
  DECIDED 2026-11-19 for the composition (translated): "and by the way, we have password composition requirements!" and
  "this is the Lero platform's own protection, so that users create strong passwords!" The composition rule stays on
  every path, a deliberate owner deviation from that sentence of the sheet. DECIDED 2026-11-19 for the length
  (translated): "The password length must be from 8 to 128!" The minimum stays 8 as today (`:11`) and a maximum of 128
  is added; the sheet calls a password under 15 characters weak without MFA, a second owner deviation.
- O-P01, what a moderator reads. DECIDED 2026-11-19 (translated): "On the 'Permissions' page a setting must be added:
  the list of pages with a switcher that turns the moderator's access to the page on or off (a separate section 'Admin
  panel pages')." The admin pages and finding P-01 moved to Task 1007.

## Goal

After the task: every password path applies one rule; the contact form, the reveal, the inquiry, the view counter and
saved-search creation are refused past their limits by the shared atomic limiter; no secret falls back to a public
constant; one redirect sanitizer; a GET never completes an e-mail change; the
cabinet sends only the columns it renders; personal data is cleared on the O-R01 schedule.

## Cause

Read at `213103f0a`
- Passwords (L-03): an 8-character floor plus composition rules (`src/lib/passwordRules.ts:11-15`), checked on the server only for the cabinet change (`src/modules/cabinet/actions/index.ts:657`); sign-up passes the password to Auth unchecked (`src/modules/auth/actions/captcha.ts:29-36`); recovery checks in the browser and updates from there (`src/modules/auth/components/ResetPasswordClient.tsx:29`, `src/lib/auth/browser.ts:49-50`).
- Limits (S-02, S-11, OW-02, A-04): read-then-insert counts in the contact form, without a human check (`src/modules/contacts/actions/index.ts:46-58`), the reveal (`src/modules/listings/actions/contactGateway.ts:37` records "parallel requests pass") and the inquiry (`src/modules/listings/actions/submitListingInquiry.ts:41-42`); the view route has none (`src/app/api/listings/[slug]/view/route.ts:46-64`); five inline client-IP readers with different fallbacks (`src/app/api/listings/[slug]/view/route.ts:48`, `src/modules/auth/actions/recovery.ts:77`, `src/modules/cabinet/actions/index.ts:548`, `src/modules/contacts/actions/index.ts:94`, `src/modules/listings/actions/contactGateway.ts:42`).
- Fingerprint (A-03): an unsalted 24-hex SHA-256 of IP and user agent (`src/app/api/listings/[slug]/view/route.ts:52-55`) under the comment "it cannot identify individuals" (`:46`).
- Saved searches (S-06): `saveSavedSearch` has no cap and no blocked answer (`src/modules/cabinet/actions/index.ts:242`); `getCollectionsWithMembership` has no blocked answer (`src/modules/listings/actions/collectionActions.ts:11`) while the other collection actions do (`:82`). The database already refuses a blocked account on both tables (the `blocked_account_no_*` policies in `supabase/catalog.json`, Task 956), so the person gets a database error instead of the blocked answer.
- Keys (S-09, C-01): `src/modules/auth/actions/recovery.ts:36` falls back to `'lero-al'`; `src/proxy.ts:23` reads the public `default_locale` with the service-role key.
- Session and redirects (L-02, P-04, A-09): a server `getSession` export (`src/lib/auth/server.ts:31`); two sanitizers (`src/lib/auth/safeRedirect.ts`, `src/modules/auth/lib/sanitizeReturnTo.ts`); the e-mail change token is consumed by a GET render (`src/app/[locale]/auth/confirm-email/page.tsx:28-29`), so a link scanner completes it.
- The cabinet (P-05): the cabinet passes the whole own row to a client component (`src/app/[locale]/cabinet/page.tsx:63`).
- E-mail (OW-03): inline `trim().toLowerCase()` at `src/modules/contacts/actions/index.ts:82`, `src/modules/listings/actions/submitListingInquiry.ts:93`, `src/modules/auth/actions/recovery.ts:38`, `src/lib/auth/googleIdentity.ts:133`, `src/lib/auth/rememberedGoogleAccount.ts:23`.
- Retention (P-07): `requester_ip` is stored and never cleared (`src/modules/contacts/actions/index.ts:117`, `src/modules/listings/actions/submitListingInquiry.ts:137`); reveal rows are deleted only inside a later reveal (`src/modules/listings/actions/contactGateway.ts:85`); `listing_views.ip_hash` is `NOT NULL` (`supabase/catalog.json`), so it cannot be cleared today.

Fix: each cause above is removed by the Scope line that names it; the limiter itself is Task 957's.

## Scope

- Passwords (O-L03): `src/lib/passwordRules.ts` → `checkPassword` (server) and the same rule for `PasswordRequirementsHint`; `src/lib/auth/breachedPassword.ts` (one fixed host, https, 3 s timeout; on a network failure the length rule decides and the event is logged once); called before Supabase by `signUpWithCaptcha`, the cabinet change and a new `src/modules/auth/actions/updateRecoveredPassword.ts`, which the reset page calls instead of the browser `updatePassword` (removed from `browser.ts`); hint texts in four locales. The rule: 8 to 128 characters, every character allowed, and the composition rule kept (an upper-case and a lower-case letter, a digit, one of `!@#$%*=`). The owner sets the Supabase Auth minimum length to 8 and its required characters to "lowercase, uppercase letters, digits and symbols".
- Client IP: `src/lib/security/clientIp.ts` (new): one rule (the first `x-forwarded-for` entry, then `x-real-ip`, else `null`) replacing the five readers.
- Limits: the contact form, the reveal (the D77 values of `contactGateway.ts:23-24`), the inquiry (today's values), the view counter (per fingerprint and listing, 10 per hour) and saved-search creation (per account, 30 per hour) call `consume_rate_limit` (Task 957) before any write; `false` gives today's `rate_limited` answer, an RPC error refuses (fail closed); a refusal writes `excess_rate_limit_exceeded` through `src/lib/security/securityEvent.ts` (Task 955); the count functions are deleted.
- Contact form: Turnstile through `src/lib/captcha/verifyTurnstile.ts`, as sign-up.
- `normalizeEmail` in `src/lib/security/inputs.ts` (trim, lower-case, NFC; no dot or plus folding) replaces the five inline forms and the e-mail change comparison.
- View route: HMAC-SHA-256 with `VIEW_HASH_SECRET` (new, server-only, required); the false comment goes.
- Saved searches and collections: `getBlockedError` on every saved-search action and on `getCollectionsWithMembership`.
- SQL `supabase/sql_migrations/task959/` (`task959.sql`, `task959-rollback.sql`, `task959-preflight.sql`): `listing_views.ip_hash` drops `NOT NULL`; trigger `saved_searches_cap` BEFORE INSERT (function with `search_path = ''`, `pg_advisory_xact_lock` on the account, refuses a 21st row with 23514); the preflight lists accounts above 20 rows.
- Keys: `LOG_CORRELATION_SALT` required (no fallback; the feature refuses and logs once); `src/proxy.ts` reads `default_locale` with the anon key; `docs/env.md` lists both variables.
- `getSession` leaves `src/lib/auth/server.ts`; `src/lib/auth/safeRedirect.ts` is the one sanitizer, `sanitizeReturnTo.ts` and its test are deleted and its callers moved; the confirm-email page renders a confirm button whose Server Action POST consumes the token.
- Cabinet: the page selects only the columns its client component renders (the admin pages are Task 1007).
- Retention (O-R01): a daily cron `src/app/api/cron/retention/route.ts` (the `CRON_SECRET` check and pause switch of the other cron routes; listed in `vercel.json`) clears `requester_ip` on both inquiry tables, deletes old reveal rows, clears `user_id` and `ip_hash` of old `listing_views` rows without deleting them (`listing_views_lower_count` fires on DELETE only).
- Ledger: P-06's status names Task 988; OW-02's names this task's call sites on 957's limiter. Dependencies added: none.
- Out of scope: the limiter (957); notification links (988); MFA and session cookies (960); the reset and confirm limits (985).

## Attack surface

Changed: sign-up, recovery and password change; the contact form, reveal, inquiry, view counter and saved searches;
the cabinet read; the e-mail change; a new cron route.
- T1 Spoofing: weak or breached passwords. Mitigate: one server rule on every server path plus the Supabase length setting (AC1); the direct-API breached residual is accepted by the owner (O-L03).
- T2 Denial of service / abuse: parallel requests pass the limits; bots fill the staff mailbox; counters inflated. Mitigate: the shared atomic limiter, Turnstile on the anonymous form (AC2-AC5).
- T3 Information disclosure: re-identifiable fingerprints, correlation ids from a public salt, the whole own row in the browser, data kept forever. Mitigate: keyed hashes, required secrets, column lists, retention (AC4, AC6, AC9, AC11).
- T4 Tampering: a GET completes an e-mail change. Mitigate: POST to consume (AC8).

Authorization matrix: a blocked session on every saved-search action and on `getCollectionsWithMembership` (AC5); the
cron route: with and without the secret; the admin page rows are Task 1007's.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-19, revision of the 2026-11-07 section).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — contact spam, view inflation and unlimited saved searches are the abuse cases — AC2, AC3, AC4, AC5.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names each entry point the task adds, removes or changes — AC1, AC2, AC3, AC4, AC6, AC8, AC11.
- Authentication: "Minimum length for passwords should be enforced by the application." — one server rule of 8 characters on every server path, and the Supabase length setting for direct calls — AC1.
- Authentication: "Maximum password length should be at least 64 characters to allow passphrases (NIST SP800-63B)." — the maximum is 128 characters — AC1.
- Authentication: "If MFA is not enabled passwords shorter than 15 characters are considered to be weak" — not followed: owner decision O-L03 (2026-11-19) keeps the minimum of 8, with the composition rule and the breached-list check on the app's paths — AC1.
- Authentication: "There should be no requirement for upper or lower case or numbers or special characters." — not followed: owner decision O-L03 (2026-11-19) keeps the composition rule as the platform's own protection; the task meets the sheet's length and breached-list checks on every path — AC1.
- Authentication_Patterns: "Do not embed authentication in new systems." — Supabase stays the authenticator; the app adds checks before calling it — AC1.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — every saved-search action and `getCollectionsWithMembership` check the blocked account on every call — AC5.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — a limiter error refuses; a blocked account gets the blocked answer, never the data — AC2, AC5.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — the blocked check runs inside each saved-search action — AC5.
- Authorization_Regression_Testing: "Relying on UI hiding is insufficient; the API layer must enforce the check" — the blocked answer is tested by calling each action directly, not through the cabinet screen — AC5.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — the saved-search cap runs on the real database — AC5.
- Bot_Management_and_Anti-Automation: "Per endpoint — the login endpoint deserves a tighter limit than the home page." — each call site has its own bucket and values — AC2.
- Bot_Management_and_Anti-Automation: "Avoid fixed-window counters: they allow bursts at boundary times." — the call sites move onto Task 957's sliding limiter; no fixed or read-then-insert count remains — AC2.
- Business_Logic_Security: "Always re-derive security-relevant values (prices, permissions, ownership) on the server. Client state is input, not truth." — the saved-search cap is counted by the database under a lock — AC5.
- Clickjacking_Defense: not applicable — no header changes; the proxy only changes the key of one read.
- Content_Security_Policy: not applicable — the proxy keeps its nonce; the enforced policy is Task 954.
- Cookie_Theft_Mitigation: not applicable — no cookie is added or changed; Task 960 owns the session cookies.
- Credential_Stuffing_Prevention: "or similar puzzle for each login attempt can help to identify automated/bot attacks" — the contact form gets the Turnstile check sign-up already has — AC3.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the confirmation page renders text through React escaping only; lint (react/no-danger, no-script-url) runs on it — AC8, AC13.
- Cross-Site_Request_Forgery_Prevention: "First, check if your framework has built-in CSRF protection and use it" — the token is consumed by a Server Action POST, which the framework guards by Origin — AC8.
- Cryptographic_Storage: "Cryptographically Secure Pseudo-Random Number Generators (CSPRNG) are designed to produce a much higher quality of randomness" — the view fingerprint is an HMAC with its own random secret — AC4.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — the cap trigger grants nothing and runs with an empty `search_path`; the limiter's grants are Task 957's — AC10.
- Denial_of_Service: "Using validation that is cheap in resources first" — the limiter answers before any send or write — AC2, AC3.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — the confirmation page adds no eval, Function, innerHTML or computed URL; lint and client-sinks check it — AC8, AC13.
- DOM_Clobbering_Prevention: not applicable — the sanitizer handles paths, not HTML; no markup is sanitized here.
- Email_Validation_and_Verification: "Applications must define a consistent normalization strategy before storing or comparing email addresses." — one `normalizeEmail` for every compare and store — AC12.
- Forgot_Password: "Return a consistent message for both existent and non-existent accounts." — the recovery action applies the password rule; the reset request keeps its neutral answer — AC1.
- GraphQL: not applicable — no table or grant is added; the cap trigger acts on every insert path alike.
- HTTP_Headers: not applicable — no header changes in this task; Task 954 owns them.
- HTTP_Strict_Transport_Security: not applicable — no header changes; HSTS stays as tested in Task 954.
- Identity_Propagation_Patterns: "Each receiving service must still authorize the requested action and resource." — the proxy reads the locale with the anon key, not the service role — AC6.
- Injection_Prevention: not applicable — the SQL files are static; no command line is built.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — the password rule runs on the server for every server path — AC1.
- Input_Validation: "Use `Forwarded` and `X-Forwarded-*` values only when they come from your own proxies" — one `clientIp` rule replaces five readers — AC2.
- Insecure_Direct_Object_Reference_Prevention: "implement access control checks for each object that users try to access" — saved-search actions check the session owner and the block — AC5.
- JSON_Web_Token: "This can be achieved using a deny list of revoked sessions/tokens." — the server reads the user through `getUser`, which sees revoked sessions; `getSession` is removed — AC7.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL security-extended (CI) run on every changed file — AC13.
- Key_Management: "a single key should be used for only one purpose" — a salt and a view key, each required, none derived from the service-role key — AC6.
- Logging: "The following should usually not be recorded directly in the logs, but instead should be removed, masked, sanitized, hashed, or encrypted" — the breached-check fallback and refused limits log hashes, not addresses — AC1, AC2.
- Logging_Vocabulary: "Developers must embrace this standard and begin to implement" — a refused limit writes `excess_rate_limit_exceeded` through the Task 955 helper — AC2.
- Mass_Assignment: "DTOs and field allowlists restrict writable properties; they do not replace authorization for the requested object and operation." — the cabinet select names its columns — AC9.
- Multi_Tenant_Security: not applicable — the limiter keys by bucket and subject; no tenant row is read by a session.
- Multifactor_Authentication: not applicable — staff MFA is Task 960 (owner decision O-MFA).
- Nextjs_Security: "Return only authorized result fields because Server Action return values are serialized to the client." — the cabinet selects only the columns its client renders — AC9.
- Nodejs_Security: "Apply rate limiting to sensitive authentication-related endpoints, including login, password reset, account recovery, and verification flows." — the reset request and the link confirmation are limited by Task 985; the new recovery action runs only with the session that confirmation creates — AC1.
- OAuth2: "Clients and Authorization Server must not expose URLs that forward the user's browser to arbitrary URIs obtained from a query parameter" — the OAuth return path goes through the one sanitizer — AC7.
- Prototype_Pollution_Prevention: not applicable — no request object is merged; actions read named fields.
- Query_Parameterization: "Dynamic SQL can be parameterized using bind variables, to ensure the dynamically constructed SQL is secure." — the call sites pass bucket and subject as RPC parameters; the trigger has no dynamic SQL — AC2, AC10.
- REST_Security: "the access control decision should be taken locally by REST endpoints" — the retention cron checks `CRON_SECRET` itself — AC11.
- Secrets_Management: "Consider enabling secrets detection at the developer level to avoid checking secrets into code before commit/PR" — `docs/env.md` lists the two new server variables; none is committed — AC6.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the whole diff with the review-task skill — AC13.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input: Opus reruns every acceptance command — AC13.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threat model's mitigations are the acceptance criteria — AC1, AC2, AC3, AC4, AC6, AC8, AC11.
- Server_Side_Request_Forgery_Prevention: "Application can send request only to identified and trusted applications" — the breached-password check calls one fixed host with a 3 s timeout — AC1.
- Serverless_FaaS_Security: "Enforce authentication and authorization on all triggers (API Gateway, Pub/Sub, S3, IoT)." — the new cron refuses calls without the secret — AC11.
- Session_Management: not applicable — session cookies keep their options; HttpOnly is Task 960.
- SQL_Injection_Prevention: "use parameterized queries for dynamic data values" — the trigger and the RPC calls take values as parameters only — AC10.
- Subdomain_Takeover_Prevention: not applicable — `vercel.json` gains a cron path; no DNS record changes.
- Third_Party_Javascript_Management: not applicable — Turnstile is loaded as on sign-up; its script policy is Task 954.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them and each mitigation is an acceptance criterion — AC1, AC2, AC4, AC6, AC8, AC11.
- Transaction_Authorization: "An authorization method must permit a user to identify and acknowledge the data that is significant to a given" — the e-mail change completes only on the explicit confirm button — AC8.
- Transport_Layer_Security: "HTTP Strict Transport Security (HSTS) instructs the user's browser to always request the site over HTTPS" — the breached-password API is called over https only — AC1.
- Unvalidated_Redirects_and_Forwards: "If used, do not allow the URL as user input for the destination." — one sanitizer accepts only paths of this site — AC7.
- User_Privacy_Protection: "Preventing leakage of user IP addresses is of great significance when user protection is in scope." — IP, account id and fingerprint are cleared after the O-R01 periods — AC4, AC11.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC13.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the confirmation page uses no innerHTML; lint (react/no-danger) fails on one — AC8, AC13.
- Web_Service_Security: not applicable — no new service schema; the cron takes no body.
- XSS_Filter_Evasion: "input filtering is an incomplete defense for XSS" — the redirect sanitizer allow-lists a single leading slash instead of filtering patterns — AC7.

## UI

Visible (text inside existing components): the password hint (four locales) and a confirm button on the e-mail
confirmation page, both existing canonical components (`.claude/rules/shared/canonical-component-reuse.md`).

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 Every password path applies the rule — test: `src/lib/__tests__/passwordRules.test.ts` (new: 7 and 129 characters refused, 8 and 128 with the four classes accepted, each missing class refused, any other character allowed, a breached password refused, a network failure falls back to the length rule) and `src/modules/auth/actions/__tests__/captcha.security.test.ts` (extended: sign-up, the recovery action and the cabinet change with a short or breached password never reach Supabase).
- AC2 The call sites use the shared limiter — test: `src/__tests__/security/rateLimitCallSites.test.ts` (new: each of the five call sites calls `consume_rate_limit` with its bucket before any write; `false` refuses without a write; an RPC error refuses; a refusal writes `excess_rate_limit_exceeded`; no read-then-insert count remains) and `src/lib/security/__tests__/clientIp.test.ts` (new: the one rule; no product file outside it reads `x-forwarded-for`).
- AC3 The contact form needs Turnstile — test: `src/modules/contacts/actions/__tests__/contactFormLimit.security.test.ts` (extended).
- AC4 The view route is limited and its fingerprint keyed — test: `src/app/api/listings/[slug]/view/__tests__/viewRoute.security.test.ts` (extended: the stored hash changes with the secret; the request over the limit counts nothing).
- AC5 Saved searches answer blocked and stop at 20 — test: `src/modules/cabinet/actions/__tests__/savedSearches.security.test.ts` (new: a blocked session gets the blocked answer from every saved-search action and `getCollectionsWithMembership`) and `src/tests/integration/savedSearchCap.integration.test.ts` (new, real database: 25 parallel inserts by one account leave 20 rows).
- AC6 No secret falls back — test: `src/lib/security/__tests__/requiredSecrets.test.ts` (new: without `LOG_CORRELATION_SALT` or `VIEW_HASH_SECRET` the feature refuses; no code path hashes or signs with `SUPABASE_SERVICE_ROLE_KEY`) and `src/lib/auth/__tests__/middlewareScope.security.test.ts` (extended: the locale read uses the anon key).
- AC7 One redirect sanitizer, no server `getSession` — test: `src/lib/auth/__tests__/safeRedirect.security.test.ts` (extended with every case of the deleted `sanitizeReturnTo.test.ts`) and `npm run typecheck`.
- AC8 A GET never consumes the e-mail token — test: `src/modules/cabinet/actions/emailChange.integration.test.ts` (extended: rendering the page leaves the token unused; the POST consumes it).
- AC9 The cabinet sends only rendered columns — test: `src/app/[locale]/cabinet/__tests__/cabinetColumns.test.ts` (new).
- AC10 The SQL holds — test: `node scripts/quality/db-sql-roundtrip.mjs` over the three `task959` files exits 0, and after the apply `node scripts/quality/db-catalog-audit.mjs --snapshot supabase/catalog.json` reports none of its invariants.
- AC11 Personal data leaves on time and the view count stays — test: `src/app/api/cron/retention/__tests__/route.security.test.ts` (new: without the secret 401; rows older than each O-R01 period are cleared or deleted, rows one minute inside untouched) and `src/tests/integration/retention.integration.test.ts` (new, real database: `views_count` unchanged; no old row keeps an IP, account id or fingerprint).
- AC12 One e-mail normalization — test: `src/lib/security/__tests__/inputs.test.ts` (extended: ` Ana@Example.COM ` and a decomposed accent) and `src/__tests__/security/emailNormalization.test.ts` (new: no product file outside `inputs.ts` lower-cases or trims a value named like an e-mail).
- AC13 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. Tasks 955 and 957 merged; the owner reports the current Supabase Auth password settings (length, required characters) and Opus records them. Branch from `main`.
2. Tests first (AC1-AC12); save each failing output.
3. Passwords, client IP, call sites, normalization, keys, sanitizer, e-mail confirmation, cabinet columns, the SQL (handed to Opus for AC10; the owner applies), the retention job, the ledger rows. One pass over every changed file (checklist I7).
4. Run: the task tests · CI on GitHub only (`gh pr checks <n>`, checklist A5); one deliberate break per security test.
5. Report: each command, exit code, relevant output; the two new variables for Vercel; the Supabase password settings for the owner.

## Review
