# Task 954 — Production responses name no framework, every cookie is Secure, and no server secret reaches the client bundle

Sprint 93. Priority P2. Owner decisions 2026-11-06: D1 "rewrite the rules of the flow and the gates" on the OWASP
reference; the owner, the same day: "all holes found must be fixed". Found by the OWASP re-read of 2026-11-06 (HTTP
Headers, Transport Layer Security, Next.js Security, Key Management, Vulnerability Disclosure), extended by the whole-project audit 2026-11-07 with finding L-01
(`docs/security/audit-2026-11-06/findings.md`). Implementer: Sonnet, after
Task 952 (it edits `next.config.ts` and `src/proxy.ts`). Reviewer: Opus. Human owner of the change: the owner.

## Goal

Measured on production 2026-11-06 (`curl -sS -I https://lero.al/sq`):
- the page answers `X-Powered-By: Next.js`. HTTP Headers: "Remove all X-Powered-By headers". `next.config.ts` does not
  set `poweredByHeader`, so Next sends it.
- the answer sets `NEXT_LOCALE=…; Path=/; SameSite=lax` with no `Secure`. Transport Layer Security: "All cookies must be
  marked with the "Secure" attribute". `src/i18n/routing.ts` sets `localeDetection: false`, so the cookie may not be
  read at all.

No test checks the built client code for server secrets (Next.js Security: "Prefix an environment variable with
NEXT_PUBLIC_ only when its value is intentionally public"; Key Management: secrets are never "embedded in build
artifacts"). The code reads 9 `NEXT_PUBLIC_` names today (`git grep -ohE "NEXT_PUBLIC_[A-Z0-9_]+" -- src next.config.ts`).

There is no `/.well-known/security.txt` (`public/` has none). Vulnerability Disclosure: "Provide a clear method for
researchers to securely report vulnerabilities" — RFC 9116, with the required `Contact` and `Expires` fields.

No script policy is enforced anywhere (L-01): `src/lib/security/headers.ts:13` sets only `frame-ancestors`, `base-uri`,
`form-action` and `object-src`; the nonce + `strict-dynamic` script policy (`headers.ts:36-38`) is report-only, and only on
`/admin`, the cabinet and the auth pages (`headers.ts:48-50`). Content Security Policy: "enforce"; a nonce + `strict-dynamic`
policy is the recommended form.

After the task:
- no response carries `X-Powered-By`;
- every cookie the site sets is `Secure`, or the locale cookie is not set at all;
- a test fails when a new `NEXT_PUBLIC_` name appears outside a reviewed list, or when the built client code contains a
  secret;
- `security.txt` is served;
- the script policy is enforced on every dynamically rendered route, and a test fails on any violation.

## Scope

- `next.config.ts`: `poweredByHeader: false`.
- `src/i18n/routing.ts`: read the next-intl 4 docs for `localeCookie`. If the cookie is used only for locale detection
  (off here), set `localeCookie: false`; otherwise set its `secure` option. State which, with the docs link, in the
  report.
- `src/lib/security/__tests__/headers.security.test.ts`: extend for the two points above.
- `src/lib/security/publicEnv.ts`: the reviewed list of the 9 public names, each with the reason it is public.
- `src/__tests__/security/publicEnv.test.ts` (new): the source code reads no `NEXT_PUBLIC_` name missing from the list,
  and the list has no stale name.
- `scripts/check-client-bundle.mjs` (new): after `npm run build`, it reads every file under `.next/static`. It fails on
  any match of `SECRET_PATTERNS` from `scripts/quality/check-files.mjs`, a JWT whose payload says `service_role`, and the
  names `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `RESEND_API_KEY`, `CLOUDINARY_API_SECRET`, `TURNSTILE_SECRET_KEY`.
  Its self-test (`--verify`) plants each kind in a temporary folder and must see each one fail. Opus adds the CI step
  after the unit job's build.
- `public/.well-known/security.txt`: `Contact`, `Expires` (at most one year ahead), `Preferred-Languages: en, sq`,
  `Canonical: https://lero.al/.well-known/security.txt`. Contact: `mailto:shtepiprone@gmail.com` (owner decision D4,
  2026-11-06, translated: "my e-mail shtepiprone@gmail.com").
- Script policy (L-01): `src/proxy.ts` sends `scriptReportOnlyPolicy` as the enforced `Content-Security-Policy` script
  part on every route `npm run build` marks dynamic (the build's route table is the source; quote it in the report),
  keeping `CSP_BASELINE`; `carriesScriptReportOnly` becomes the list of routes still report-only, empty when every route
  is dynamic. A route the build marks static cannot carry a nonce: list each with its reason in the report; Opus brings
  the trade-off (enforce through dynamic rendering, or keep report-only there) to the owner as a decision.
  Known blocker (Task 952 review, 2026-11-07): the inline `<script data-mantine-script="true">` that `ColorSchemeScript` writes (`src/app/layout.tsx:44`) has no nonce, on every
  page (32 of 33 scripts of `/sq/auth/login` carry the nonce, this one does not). It gets the nonce or is removed; `check-csp-violations.mjs` is the test.
- Shared caches (added 2026-11-07 by the OWASP gate, Web Cache Security, finding OW-04): every answer rendered for a session (the
  cabinet, `/admin`, the auth pages, any route handler reading the session) carries `Cache-Control` with `private` or
  `no-store`; `src/proxy.ts` sets it where the framework does not. The click-shield run reads the answer of
  `/sq/cabinet` and `/admin` with a signed-in test account (`.env.local` HYDRATION_* logins).
  `CSP_SCRIPT_HOSTS` gains only hosts a violation proves are needed (Turnstile, Vercel scripts are same-origin);
  the comment at `headers.ts:10-11` is corrected.
- `scripts/check-csp-violations.mjs` (new): starts from the built server, opens one page of every route group (home,
  search, a listing, a CMS page, sign-in, cabinet and admin with the `.env.local` test accounts) in Playwright and fails
  on any `securitypolicyviolation` event or CSP console error; `--verify` serves a page with an inline script without the
  nonce and must fail. Opus adds the CI step to the click-shield job.
- The CI fixture page (found in the Task 953 review 2, from the Vercel build log of `b23104b`, 2026-11-08):
  `/[locale]/ci/click-shield-modal` ships in every production build and is closed only by
  `process.env.CLICK_SHIELD_CI_FIXTURE !== '1'` → `notFound()` (`src/app/[locale]/ci/click-shield-modal/page.tsx:10`);
  production answers 404 today (`curl https://lero.al/en/ci/click-shield-modal`, 2026-11-08), but no test holds the
  guard. A test does: without the flag, or with any value other than `'1'`, the page calls `notFound()`.
- Dependencies: none.
- Out of scope: other headers (already set and tested).

## Attack surface

Changed (response headers, cookies, a new public file):
- T1 Information disclosure — the framework banner helps an attacker pick exploits (Next.js advisories). Mitigation: no
  `X-Powered-By`; tested on the built server.
- T2 Information disclosure — a cookie sent over plain HTTP. Mitigation: no non-Secure cookie.
- T3 Information disclosure — a server secret inlined into client code by a `NEXT_PUBLIC_` name or an import.
  Mitigation: the reviewed public list, and the bundle scan in CI.
- T4 Repudiation / delayed fixes — a researcher has no channel. Mitigation: `security.txt`.
- T5 Tampering / elevation (XSS) — an injected script runs because no script policy is enforced. Mitigation: the
  enforced nonce + `strict-dynamic` policy; T6 denial of service on our own pages — a policy that blocks a legitimate
  script. Mitigation: the violation check on every route group before and in CI.

Authorization matrix: unchanged.


## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- Abuse_Case: not applicable — no business rule changes; the threats are header and policy gaps.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names each entry point the task adds, removes or changes — AC1, AC3, AC4, AC5, AC7.
- Authentication: not applicable — Turnstile and sign-in are unchanged; only their pages get the enforced policy.
- Authentication_Patterns: not applicable — no authentication code changes; the proxy adds headers only.
- Authorization: not applicable — no access decision changes; the signed-in test account only reads response headers.
- Authorization_Decisions_And_Output_Handling: not applicable — no authorization decision changes in headers or policy.
- Authorization_Patterns: not applicable — no guard moves; the proxy adds response headers after its guards.
- Authorization_Regression_Testing: not applicable — no authorization behaviour changes; the existing suite runs in CI.
- Authorization_Testing_Automation: not applicable — the matrix is Task 950; this task changes headers only.
- Bot_Management_and_Anti-Automation: not applicable — Turnstile stays as configured; the task only lets its script run under the policy.
- Clickjacking_Defense: "The "DENY" setting is recommended unless a specific need has been identified for framing." — X-Frame-Options DENY and frame-ancestors stay in the extended header test — AC1, AC5.
- Content_Security_Policy: "The strict-dynamic directive can optionally also be used to make it easier to implement a Strict CSP." — the enforced script policy carries a nonce and strict-dynamic on every dynamic route — AC5.
- Cookie_Theft_Mitigation: not applicable — Secure on every cookie is AC1; the session-cookie HttpOnly work is Task 960.
- Credential_Stuffing_Prevention: not applicable — sign-in defenses are unchanged; the CSP must not break the Turnstile script.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the enforced CSP is the second layer behind React escaping and the sanitizer — AC5.
- Cross-Site_Request_Forgery_Prevention: not applicable — the framework Origin check for Server Actions is unchanged; SameSite stays Lax on every cookie.
- Cryptographic_Storage: not applicable — the nonce comes from the existing proxy generator; nothing is stored or encrypted.
- Denial_of_Service: not applicable — no limits change; the policy and headers add no request path.
- Dependency_Graph_SBOM: not applicable — no dependency changes; the SBOM job is unaffected.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — strict-dynamic without unsafe-eval blocks string evaluation in the browser — AC5.
- DOM_Clobbering_Prevention: not applicable — the CMS sanitizer is unchanged; the CSP does not address named-element clobbering.
- HTTP_Headers: "Content Security Policy (CSP) frame-ancestors directive obsoletes X-Frame-Options for supporting browsers" — the header test asserts the baseline and the removed X-Powered-By — AC1.
- HTTP_Strict_Transport_Security: "This example sets a long (2 years = 63072000 seconds) max-age for the issuing host." — the HSTS value stays under test — AC1.
- Identity_Propagation_Patterns: not applicable — the service-role key is only scanned for in the bundle; no caller identity is passed anywhere new.
- Injection_Prevention: "the values for commands and the relevant arguments should be both validated" — check-client-bundle.mjs and check-csp-violations.mjs pass file names and arguments as array items; no value is joined into a command line — AC3, AC5.
- Input_Validation: not applicable — the task reads no new input; the CSP report endpoint is not added.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL security-extended (CI) run on every changed file — AC6.
- JSON_Web_Token: "if you use JWTs for user sessions, you will need a solution for managing session invalidation" — a JWT whose payload says service_role in the bundle fails the scan — AC3.
- Key_Management: "a single key should be used for only one purpose" — the public-name list states why each NEXT_PUBLIC_ value may be public — AC2.
- Mass_Assignment: not applicable — no request is bound to a model in this task.
- Multifactor_Authentication: not applicable — no sign-in factor changes; staff MFA is Task 960.
- Nextjs_Security: "Rendering the form only on a protected page does not authenticate the action request." — the proxy sets the enforced policy for every dynamic route — AC5.
- NPM_Security: not applicable — no dependency is added; the advisories are Task 947 and 952.
- OS_Command_Injection_Defense: "The primary defense is to avoid calling OS commands directly." — check-client-bundle.mjs and check-csp-violations.mjs start git and node with argument arrays, never a shell string — AC3, AC5.
- Prototype_Pollution_Prevention: not applicable — no request object is merged in this task.
- REST_Security: not applicable — route handlers only gain a Cache-Control header; no access decision or method changes.
- Secrets_Management: "prevent them from leaking and compromising the organization" — the built client code is scanned for every server secret — AC3.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the whole diff; changed-line coverage and the file checks run on it — AC6.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input: Opus reruns every acceptance command in review — AC6.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the mitigations of the threat model are the acceptance criteria of this task — AC1, AC3, AC4, AC5, AC7.
- Session_Management: not applicable — the session cookie options are unchanged; HttpOnly is Task 960.
- Software_Supply_Chain_Security: not applicable — no dependency or install step changes in this task.
- Third_Party_Javascript_Management: "Secure transmission of the third-party code (to prevent modifications while in-transit) and various types of sandboxing." — Turnstile loads over https as a nonce-allowed script and renders in its own cross-origin frame; the violation check covers its pages — AC5.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them and each mitigation is an acceptance criterion — AC1, AC3, AC4, AC5, AC7.
- Transport_Layer_Security: "HTTP Strict Transport Security (HSTS) instructs the user's browser to always request the site over HTTPS" — Secure on every cookie keeps them off plain http — AC1.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC6.
- Vulnerability_Disclosure: "A security.txt file on the website at /.well-known/security.txt as per RFC 9116." — public/.well-known/security.txt with Contact and Expires, parsed by its test — AC4.
- Vulnerable_Dependency_Management: not applicable — no dependency changes in this task.
- Web_Cache_Security: "Default to preventing shared caching for authenticated, personalized, tenant-specific, or otherwise sensitive responses." — session answers carry private or no-store — AC7.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — an injected inline script fails the violation check — AC5.
- Web_Service_Security: not applicable — no request schema changes; the task sets response headers only.
- XS_Leaks: "The SameSite attribute of a cookie tells the browser whether it should include the cookie in the request from the other site." — every cookie the site sets is Secure and keeps SameSite=Lax — AC1.
- XSS_Filter_Evasion: "input filtering is an incomplete defense for XSS" — the policy blocks script execution whatever markup slips through a filter — AC5.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 No response carries `X-Powered-By`, and every `Set-Cookie` of the site has `Secure` (or the locale cookie is gone)
  — test: `src/lib/security/__tests__/headers.security.test.ts` (configuration), and `scripts/check-click-shield.mjs`
  (extended; the CI click-shield job runs it on the production server) asserts the answers of `/` and `/sq`.
- AC2 A `NEXT_PUBLIC_` name outside the reviewed list fails — test: `src/__tests__/security/publicEnv.test.ts`
  (deliberate break: add an unlisted name to a source file, see it fail, remove it).
- AC3 A secret in the built client code fails — test: `node scripts/check-client-bundle.mjs --verify` (each planted kind
  fails) and `node scripts/check-client-bundle.mjs` on the real build passes.
- AC4 `security.txt` is served with `Contact: mailto:shtepiprone@gmail.com` (D4) and a future `Expires` — test:
  `src/__tests__/security/securityTxt.test.ts` (new) parses the file; it fails on a missing field, another contact or a
  past date.
- AC5 The script policy is enforced and nothing legitimate breaks — test: `node scripts/check-csp-violations.mjs` (no
  violation on any route group) and `node scripts/check-csp-violations.mjs --verify` (the planted inline script fails),
  and `src/lib/security/__tests__/headers.security.test.ts` (extended: a dynamic route answers an enforced
  `Content-Security-Policy` with `'nonce-` and `'strict-dynamic'`).
- AC7 No session answer can be stored by a shared cache — test: `scripts/check-click-shield.mjs` (extended: signed in,
  `/sq/cabinet` and `/admin` answer `Cache-Control` with `private` or `no-store`; anonymous `/sq` is unaffected) and
  `src/lib/auth/__tests__/sessionMiddleware.test.ts` (extended: a request with a session gets the header from the proxy).
- AC8 The CI fixture page stays closed outside CI — test: `src/app/[locale]/ci/click-shield-modal/__tests__/page.test.tsx`
  (new): the flag unset, `''`, `'0'` and `'true'` each make the page call `notFound()`; `'1'` renders the fixture; red
  when the guard is removed.
- AC6 `npm run lint`, `npm run typecheck`, `npm test -- --coverage`, `npm run build`,
  `node scripts/quality/changed-lines-coverage.mjs --base main`, `node scripts/quality/check-files.mjs --worktree` and
  `node scripts/quality/ac-tests.mjs --base main tasks/Sprints/Sprint_93_kickoff_prompt_Task_954_Response_Headers_Cookies_And_Client_Bundle.md`
  exit 0.

## Route

1. Tests first: AC1, AC2 and AC4 tests on the unchanged code. Save the failing output.
2. `next.config.ts`, `src/i18n/routing.ts`, the public list, `security.txt` (contact per D4), the bundle
   scanner and its `--verify`.
3. The script policy and `check-csp-violations.mjs`; then run AC1–AC7. Report each command, its exit code and the relevant output, and each deliberate break.

## Review
