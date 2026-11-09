# Task 959 — One password rule on every path, atomic abuse limits, a key per purpose, and staff read only what their keys allow

Sprint 93. Priority P1. Owner decisions: D1 2026-11-06 (rules on the OWASP reference); the owner 2026-11-06 "all holes
found must be fixed". Filed by the whole-project audit
(`docs/security/audit-2026-11-06/findings.md`: A-03, A-04, A-09, S-02, S-06, S-09, S-10, S-11, OW-02, OW-03, L-02, L-03, C-01, P-01,
P-04, P-05, P-06 application part, P-07). Implementer: Sonnet, after Task 952 (it owns `src/proxy.ts`) and after Task 956
(the read keys reuse `caller_has_permission`). Reviewer: Opus. The owner applies the SQL and sets the new variables.

Three owner decisions before the route starts (Opus proposals, the owner confirms or changes them); O-R01 is decided:
- O-R01, how long personal data is kept (P-07). DECIDED by the owner 2026-11-07 (translated: "agreed"): the IP address of a contact-form or inquiry sender is cleared
  after 7 days (the limits read 24 hours); reveal rows are deleted after 2 days (unchanged); a listing view keeps its
  account id and fingerprint for 2 days (the dedup window is 24 hours), then both are cleared and the row stays, so the
  public view count does not drop.
- O-L03, the password rule. Proposal, from the OWASP Authentication Cheat Sheet: at least 12 characters, at most 128,
  every character allowed, no composition rules, refused when it appears in a breached-password list (the k-anonymity
  range query of Have I Been Pwned: only the first five hex of the SHA-1 leave the server).
- O-P01, what a moderator reads. Proposal: each admin page needs the key of the work it serves (users pages
  `users.edit`, inquiries `inquiries.manage`, support `support.manage`, companies `companies.manage`, e-mail templates
  `email_templates.manage`, reports `reports.manage`); an administrator reads everything.

## Goal

Today:
- Passwords: composition rules with an 8-character floor (`src/lib/passwordRules.ts:9-22`) applied on the server only
  for the cabinet change (`cabinet/actions/index.ts:650`); sign-up (`auth/actions/captcha.ts:22-36`) and recovery
  (`ResetPasswordClient.tsx:29`) check in the browser only (L-03).
- Abuse: the public contact form has no human check and a count-then-insert limit (`contacts/actions/index.ts:71`,
  S-02); the reveal and inquiry limits race (`contactGateway.ts:37`, `submitListingInquiry.ts:33`, S-11); the view
  counter has no limit and an unsalted 24-hex fingerprint of IP and user agent (`api/listings/[slug]/view/route.ts:44-55`,
  A-03, A-04); saved searches have no cap and skip the block check, as does `getCollectionsWithMembership`
  (`cabinet/actions/index.ts:238-397`, `collectionActions.ts:11`, S-06).
- Keys: `LOG_CORRELATION_SALT` falls back to the public constant `'lero-al'` (`recovery.ts:36`, S-09); the upload grant
  key falls back to the service-role key (`uploadGrant.ts:20`, S-10); the proxy reads a public setting with the
  service-role key (`src/proxy.ts:23`, C-01).
- Session and redirects: a server `getSession()` export (`lib/auth/server.ts:30`, L-02); two return-path sanitizers
  with different rules (`lib/auth/safeRedirect.ts`, `modules/auth/lib/sanitizeReturnTo.ts`, P-04); the e-mail change is
  consumed by a GET render of `[locale]/auth/confirm-email/page.tsx`, so a link scanner completes it (A-09).
- Data exposure: 14 admin pages read every account, inquiry and ticket with the service role behind `requireStaffPage()`
  alone (P-01); the cabinet passes the whole own `users` row to a client component (`cabinet/page.tsx:63`, P-05); a
  notification `link` is rendered as `href` without a URL guard (`NotificationItem.tsx:289`, P-06).
- Retention (P-07): `contact_inquiries.requester_ip` and `listing_inquiries.requester_ip` are kept forever
  (`contacts/actions/index.ts:117`, `submitListingInquiry.ts:137`); `listing_views` keeps `user_id` and `ip_hash` forever
  (`api/listings/[slug]/view/route.ts:44-63`; its comment "cannot identify individuals" is false, A-03); the reveal
  rows are deleted only inside a later reveal (`contactGateway.ts:84-89`).

## Scope

- `src/lib/passwordRules.ts` rewritten to O-L03 (one server function `checkPassword` and the same rule for the form
  hint); called by `signUpWithCaptcha`, the recovery action and the cabinet change before Supabase; the breached check
  in `src/lib/auth/breachedPassword.ts` (timeout 3 s; on a network failure the length rule alone decides and the event
  is logged); `messages/*.json` hint texts in all four locales.
- SQL in `supabase/sql_migrations/task959/` (`limits.sql`, `limits-rollback.sql`, `limits-preflight.sql`): a table
  `rate_limit_hits` (RLS on, no session grant) and a SECURITY DEFINER function `consume_rate_limit(bucket text, subject
  text, window_seconds int, max_hits int) returns boolean`: a sliding window, not a fixed one (OW-02; OWASP Bot Management:
  "Avoid fixed-window counters: they allow bursts at boundary times"; revised 2026-11-07 by the OWASP gate). It takes
  `pg_advisory_xact_lock` on the bucket and subject, deletes that key's hits older than `window_seconds`, counts the rest
  and inserts the hit only below `max_hits`, so parallel calls cannot pass the limit and a burst across a boundary
  cannot pass it twice; `search_path = ''`; EXECUTE for `service_role` only. Used by the contact form,
  the reveal, the listing inquiry, the view counter (per fingerprint and listing, per hour), and the saved-search
  creation; proven with `node scripts/quality/db-sql-roundtrip.mjs` (Task 956).
- Contact form: Turnstile through `src/lib/captcha/verifyTurnstile.ts`, as sign-up uses.
- One e-mail normalization (OWASP Email Validation: "Applications must define a consistent normalization strategy
  before storing or comparing email addresses"; added 2026-11-07 by the OWASP gate, finding OW-03): `normalizeEmail` in
  `src/lib/security/inputs.ts` (trim, lower-case, NFC; no dot or plus folding) replaces the inline forms at
  `contacts/actions/index.ts:82`, `submitListingInquiry.ts:93`, `auth/actions/recovery.ts:38`,
  `lib/auth/googleIdentity.ts:133`, `lib/auth/rememberedGoogleAccount.ts:23` and the e-mail change comparison.
- View route: the fingerprint becomes HMAC-SHA-256 with `VIEW_HASH_SECRET` (new, server-only, required: no fallback).
- Saved searches: `requireViewer` / `getBlockedError` on every action and `getCollectionsWithMembership`; a cap of 20
  per account (Opus proposal).
- Keys: `LOG_CORRELATION_SALT` and `UPLOAD_GRANT_SECRET` required, no fallback (the server refuses to run the feature
  and logs once); `src/proxy.ts` reads `default_locale` with the anon key; `docs/env.md` lists the three variables.
- `getSession` removed from `lib/auth/server.ts`; one sanitizer in `lib/auth/safeRedirect.ts`, the other file deleted
  and its callers moved; the e-mail confirmation page renders a confirm button whose POST (a Server Action) consumes
  the token.
- Admin pages: a read key per page per O-P01 through a new optional argument of `requireStaffPage`
  (`src/lib/auth/staff.ts:84`), checked with the same function the writes use; the cabinet selects only the
  columns its client component renders; `NotificationItem.tsx` renders `link` through `safeNextPath` (internal paths
  only) and the `REVIEWED` entry for P-06 is removed from `scripts/quality/client-sinks.mjs` in the same change.
- Retention per O-R01: a new daily cron `src/app/api/cron/retention/route.ts` (the `CRON_SECRET` check and the pause
  switch of the other cron routes; listed in `vercel.json`) clears `requester_ip` on both inquiry tables, deletes old
  reveal rows, and clears `user_id` and `ip_hash` of old `listing_views` rows without deleting them (the column becomes
  nullable in `limits.sql`; `lower_views_count_on_view_delete` must not fire). The false comment in the view route goes.
- Dependencies: none (HIBP is a plain HTTPS call).
- Out of scope: MFA (a separate product decision), Supabase Auth dashboard settings (the owner's; Opus lists them).

## Attack surface

Changed: sign-up, recovery and password change; the contact form; the view counter; staff page reads; e-mail change.
- T1 Spoofing: weak or breached passwords on sign-up and recovery. Mitigation: one server rule on every path.
- T2 Denial of service / abuse: parallel requests pass the limits; bots fill the staff mailbox; counters inflated.
  Mitigation: one atomic limiter, Turnstile on the anonymous form.
- T3 Information disclosure: re-identifiable fingerprints, correlation ids from a public salt, staff reading without a
  key, the whole own row in the browser. Mitigation: keyed hashes, required secrets, read keys, column lists.
- T4 Tampering: a GET completes an e-mail change; a notification link leads off-site. Mitigation: POST to consume;
  internal paths only.

Authorization matrix: per admin page, rows for an admin, a moderator with the page key, a moderator without it, a user.


## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — contact spam, view inflation and unlimited saved searches are the abuse cases — AC3, AC4, AC5.
- AI_Agent_Security: not applicable — the client-sinks rule loses one reviewed entry; no agent permission changes.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names each entry point the task adds, removes or changes — AC1, AC2, AC3, AC4, AC6, AC8, AC9, AC12.
- Authentication: "Minimum length for passwords should be enforced by the application." — one server rule of 12 characters on every password path — AC1.
- Authentication_Patterns: "Do not embed authentication in new systems." — Supabase stays the authenticator; the app adds checks before calling it — AC1.
- Authentication: "Maximum password length should be at least 64 characters to allow passphrases (NIST SP800-63B)." — the maximum is 128 characters — AC1.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — each admin page checks its read key on every request — AC9.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — a missing key renders the refusal, never the data — AC9.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — requireStaffPage(permission) runs in the page itself — AC9.
- Authorization_Regression_Testing: "Relying on UI hiding is insufficient; the API layer must enforce the check" — the page guard is tested per page, not through the menu — AC9.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — one test row per admin page of the matrix — AC9.
- Bot_Management_and_Anti-Automation: "Per endpoint — the login endpoint deserves a tighter limit than the home page." — each endpoint has its own bucket and limit — AC2, AC3, AC4.
- Bot_Management_and_Anti-Automation: "Avoid fixed-window counters: they allow bursts at boundary times." — consume_rate_limit is a sliding window — AC2.
- Business_Logic_Security: "Always re-derive security-relevant values (prices, permissions, ownership) on the server. Client state is input, not truth." — the saved-search cap is counted in the same statement as the insert — AC5.
- Clickjacking_Defense: not applicable — the proxy change reads the locale with another key; headers are Task 954.
- Content_Security_Policy: not applicable — the proxy keeps its nonce; the enforced policy is Task 954.
- Cookie_Theft_Mitigation: not applicable — no cookie is added or changed; Task 960 makes the session cookies HttpOnly.
- Credential_Stuffing_Prevention: "or similar puzzle for each login attempt can help to identify automated/bot attacks" — the contact form gets the Turnstile check sign-up already has — AC3.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the confirmation page and NotificationItem render text through React escaping only; lint (react/no-danger, no-script-url) runs on them — AC10, AC11.
- Cross-Site_Request_Forgery_Prevention: "First, check if your framework has built-in CSRF protection and use it" — the token is consumed by a Server Action POST, which the framework guards by Origin — AC8.
- Cryptographic_Storage: "Cryptographically Secure Pseudo-Random Number Generators (CSPRNG) are designed to produce a much higher quality of randomness" — the view fingerprint is an HMAC with its own secret — AC4.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — rate_limit_hits has RLS on and no session grant; the function runs for service_role only — AC2.
- Denial_of_Service: "Using validation that is cheap in resources first" — the limiter answers before any send or write — AC2, AC3.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — the confirmation page and NotificationItem add no eval, Function, innerHTML or computed URL; lint (no-eval, no-implied-eval) and client-sinks check them — AC10, AC11.
- DOM_Clobbering_Prevention: not applicable — the sanitizer handles paths, not HTML; no markup is sanitized here.
- Email_Validation_and_Verification: "Applications must define a consistent normalization strategy before storing or comparing email addresses." — one normalizeEmail for every compare and store — AC13.
- File_Upload: not applicable — the upload grant only stops falling back to the service-role key; upload rules are Task 957.
- Forgot_Password: "Return a consistent message for both existent and non-existent accounts." — the recovery action applies the password rule and keeps its neutral answer — AC1.
- GraphQL: "Ensure that the API has proper access control checks." — the new table is invisible to sessions on PostgREST and graphql alike — AC2.
- HTTP_Headers: not applicable — no header changes in this task; Task 954 owns them.
- HTTP_Strict_Transport_Security: not applicable — no header changes; HSTS stays as tested in Task 954.
- Identity_Propagation_Patterns: "Each receiving service must still authorize the requested action and resource." — the proxy reads the locale with the anon key, not the service role — AC6.
- Injection_Prevention: not applicable — the SQL files are static; no command line is built.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — the password rule runs on the server for every path — AC1.
- Insecure_Direct_Object_Reference_Prevention: "implement access control checks for each object that users try to access" — saved-search actions check the session owner and the block — AC5.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL security-extended (CI) run on every changed file — AC11.
- JSON_Web_Token: "This can be achieved using a deny list of revoked sessions/tokens." — the server reads the user through getUser, which sees revoked sessions; getSession is removed — AC7.
- Key_Management: "a single key should be used for only one purpose" — a salt, a grant key and a view key, each required, none derived from the service-role key — AC6.
- LLM_Prompt_Injection_Prevention: not applicable — no agent tool or prompt boundary changes in this task.
- Logging: "The following should usually not be recorded directly in the logs, but instead should be removed, masked, sanitized, hashed, or encrypted" — the breached-check fallback and refused limits log hashes, not addresses — AC1, AC6.
- Logging_Vocabulary: "Developers must embrace this standard and begin to implement" — a refused limit writes excess_rate_limit_exceeded through the Task 955 helper — AC2.
- Mass_Assignment: "DTOs and field allowlists restrict writable properties; they do not replace authorization for the requested object and operation." — the cabinet select names its columns — AC10.
- MCP_Security: not applicable — no MCP server or permission changes in this task.
- Multi_Tenant_Security: not applicable — the limiter keys by bucket and subject; no tenant row is read by a session.
- Multifactor_Authentication: not applicable — staff MFA is Task 960 (owner decision O-MFA).
- Nextjs_Security: "Return only authorized result fields because Server Action return values are serialized to the client." — the cabinet selects only the columns its client renders — AC10.
- Nodejs_Security: not applicable — the cron and the breached check use fetch and the framework runtime; nothing new is enabled.
- OAuth2: "Clients and Authorization Server must not expose URLs that forward the user's browser to arbitrary URIs obtained from a query parameter" — the OAuth return path goes through the same sanitizer — AC7.
- OS_Command_Injection_Defense: not applicable — client-sinks.mjs loses one REVIEWED entry; no process call changes.
- Prototype_Pollution_Prevention: not applicable — no request object is merged; actions read named fields.
- Query_Parameterization: "Dynamic SQL can be parameterized using bind variables, to ensure the dynamically constructed SQL is secure." — bucket and subject are bound parameters of the function — AC2.
- REST_Security: "the access control decision should be taken locally by REST endpoints" — the retention cron checks CRON_SECRET itself — AC12.
- Secrets_Management: "Consider enabling secrets detection at the developer level to avoid checking secrets into code before commit/PR" — docs/env.md lists the three new server variables; none is committed — AC6.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the whole diff; changed-line coverage and the file checks run on it — AC11.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input: Opus reruns every acceptance command in review — AC11.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the mitigations of the threat model are the acceptance criteria of this task — AC1, AC2, AC3, AC4, AC6, AC8, AC9, AC12.
- Server_Side_Request_Forgery_Prevention: "Application can send request only to identified and trusted applications" — the breached-password check calls one fixed host with a 3 s timeout — AC1.
- Serverless_FaaS_Security: "Enforce authentication and authorization on all triggers (API Gateway, Pub/Sub, S3, IoT)." — the new cron refuses calls without the secret — AC12.
- Session_Management: not applicable — session cookies keep their options; HttpOnly is Task 960.
- SQL_Injection_Prevention: "use parameterized queries for dynamic data values" — the limiter takes parameters only, search_path empty — AC2.
- Subdomain_Takeover_Prevention: not applicable — vercel.json gains a cron path; no DNS record changes (DNS watch is Task 961).
- Third_Party_Javascript_Management: not applicable — Turnstile is loaded as on sign-up; its script policy is Task 954.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them and each mitigation is an acceptance criterion — AC1, AC2, AC3, AC4, AC6, AC8, AC9, AC12.
- Transaction_Authorization: "An authorization method must permit a user to identify and acknowledge the data that is significant to a given" — the e-mail change completes only on the explicit confirm button — AC8.
- Transport_Layer_Security: "HTTP Strict Transport Security (HSTS) instructs the user's browser to always request the site over HTTPS" — the breached-password API is called over https only — AC1.
- Unvalidated_Redirects_and_Forwards: "If used, do not allow the URL as user input for the destination." — one sanitizer accepts only paths of this site — AC7.
- User_Privacy_Protection: "Preventing leakage of user IP addresses is of great significance when user protection is in scope." — IP, account id and fingerprint are cleared after the O-R01 periods — AC4, AC12.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC11.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the confirmation page and NotificationItem use no innerHTML; lint (react/no-danger) fails on one — AC10, AC11.
- Web_Service_Security: not applicable — no new service schema; the cron takes no body.
- XSS_Filter_Evasion: "input filtering is an incomplete defense for XSS" — the redirect sanitizer allow-lists a single leading slash instead of filtering patterns — AC7.

## UI

Visible (text changes inside existing components; the button is the existing primary button, so the mobile adaptation scope is none): the password hint text (four locales) and a confirm button on the e-mail confirmation page, both built from
existing canonical components (`.claude/rules/shared/canonical-component-reuse.md`); the hint is the existing
component with new text.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 Every password path applies the one rule on the server — test: `src/lib/__tests__/passwordRules.test.ts` (the
  O-L03 table: 11 and 129 characters refused, 12 accepted, any character accepted, a breached password refused, a
  network failure falls back to the length rule) and `src/modules/auth/actions/__tests__/captcha.security.test.ts`
  (extended: sign-up and recovery with a short password never reach Supabase).
- AC2 Limits are atomic and slide — test: `src/tests/integration/rateLimit.integration.test.ts` (new: 20 parallel calls
  with a limit of 5 give exactly 5 `true`; 5 hits at the end of one window and 5 at the start of the next give 5
  `true`, never 10, within any `window_seconds`).
- AC13 One e-mail normalization — test: `src/lib/security/__tests__/inputs.test.ts` (extended: `normalizeEmail` of
  ` Ana@Example.COM ` and of a decomposed accent) and `src/__tests__/security/emailNormalization.test.ts` (new: no
  product file outside `inputs.ts` lower-cases or trims a value named like an e-mail).
- AC3 The contact form needs Turnstile and the limiter — test:
  `src/modules/contacts/actions/__tests__/contactFormLimit.security.test.ts` (extended).
- AC4 The view route is limited and its fingerprint keyed — test:
  `src/app/api/listings/[slug]/view/__tests__/viewRoute.security.test.ts` (extended: the stored hash changes with the
  secret; the request over the limit counts nothing).
- AC5 Saved searches check the block and the cap — test:
  `src/modules/cabinet/actions/__tests__/savedSearches.security.test.ts` (new: a blocked session is refused; the 21st
  search is refused).
- AC6 No secret falls back — test: `src/lib/security/__tests__/requiredSecrets.test.ts` (new: without
  `LOG_CORRELATION_SALT`, `UPLOAD_GRANT_SECRET` or `VIEW_HASH_SECRET` the feature refuses; no code path reads
  `SUPABASE_SERVICE_ROLE_KEY` for a hash or a grant) and `src/lib/auth/__tests__/middlewareScope.security.test.ts`
  (extended: the proxy's locale read uses the anon key).
- AC7 One redirect sanitizer, no server `getSession` — test: `src/lib/auth/__tests__/safeRedirect.security.test.ts`
  (extended with every case of `sanitizeReturnTo.test.ts`, which is deleted) and `npm run typecheck`.
- AC8 A GET never consumes the e-mail token — test: `src/modules/cabinet/actions/emailChange.integration.test.ts`
  (extended: rendering the page leaves the token unused; the POST consumes it).
- AC9 Each admin page follows its read key — test: `src/lib/auth/__tests__/staffPage.security.test.ts` (extended: one
  row per page of the matrix).
- AC10 The cabinet sends only rendered columns, and notification links stay internal — test:
  `src/app/[locale]/cabinet/__tests__/cabinetColumns.test.ts` (new) and `node scripts/quality/client-sinks.mjs`
  (exits 0 with the P-06 entry removed).
- AC12 Personal data leaves on time and the view count stays — test:
  `src/app/api/cron/retention/__tests__/route.security.test.ts` (new: without the secret 401; rows older than each
  O-R01 period (`requester_ip` 7 days, reveal rows 2 days, a view's `user_id` and `ip_hash` 2 days) are cleared or
  deleted, rows one minute inside each period untouched) and `src/tests/integration/retention.integration.test.ts`
  (new, real database: after the job a listing's `views_count` is unchanged and no old row keeps an IP, account id or
  fingerprint).
- AC11 `npm run lint`, `npm run typecheck`, `npm test -- --coverage`,
  `node scripts/quality/changed-lines-coverage.mjs --base main`, `node scripts/quality/check-files.mjs --worktree`,
  `node scripts/quality/product-gates.mjs` and
  `node scripts/quality/ac-tests.mjs --base main tasks/Sprints/Sprint_93_kickoff_prompt_Task_959_Auth_Abuse_Keys_Data_Exposure.md`
  exit 0.

## Route

1. Confirm that Tasks 952 and 956 are merged and that O-L03 and O-P01 are recorded in this kickoff by Opus (O-R01 is, 2026-11-07). Branch.
2. Tests first (AC1-AC10, AC12); save each failing output.
3. Passwords; the limiter SQL (handed to Opus for the round-trip proof, the owner applies); the call sites; keys;
   sanitizer; e-mail confirmation; read keys; cabinet columns; notification links; the retention job.
4. Run AC1-AC13; one deliberate break per security test.
5. Report: each command, exit code and relevant output; the three new variables for the owner to set in Vercel.

## Review
