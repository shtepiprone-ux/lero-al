# Task 985 — The password-reset request and the e-mail link confirmation are rate limited

Sprint 93. Priority P2. Found 2026-11-17 by Opus in the OWASP remap of Task 972 Review 1: the Node.js Security Cheat
Sheet (upstream 7af0ef1b745f) now requires rate limits on every authentication flow. Revised 2026-11-19 by Opus: the
atomic limiter `consume_rate_limit` is built by Task 957 (owner decision O957-1, 2026-11-18), not by Task 959.
Implementer: Sonnet, after Tasks 957 (the limiter), 959 (`normalizeEmail`, `clientIp`) and 991 (it changes the same reset
action). Reviewer: Opus. Human owner of the change: the owner.

## Goal

The password-reset request and the e-mail link confirmation run without an application rate limit, as the Node.js
sheet requires for every authentication flow; only CAPTCHA guards the reset request. After the task both are refused past a limit before Supabase Auth is called, and the unused
reset helper without CAPTCHA is gone.

## Cause

Read at `213103f0a`
- `src/modules/auth/actions/captcha.ts:50-65`: `requestPasswordResetWithCaptcha` checks that a CAPTCHA token is present
  and calls `resetPasswordForEmail` (`:60`); no limit is consumed.
- `src/app/auth/confirm/route.ts:69`: the route calls `verifyOtp` for every request; no limit is consumed.
- `src/lib/auth/browser.ts:45-47`: `requestPasswordReset` calls `resetPasswordForEmail` without a CAPTCHA token;
  `grep -rn "requestPasswordReset(" src` → `src/lib/auth/browser.ts:45` (the definition) and
  `src/lib/auth/__tests__/browserAuth.security.test.ts:84` (the only call).
- Sign-in goes from the browser straight to Supabase Auth with a CAPTCHA token (`src/lib/auth/browser.ts:23-24`); its
  limit is the Supabase Auth project setting, which the repository does not hold (UNKNOWN: its value).

Fix: the reset action consumes the Task 957 limiter per normalized e-mail and per client IP, and the confirm route per
client IP, each before Supabase Auth is called; the unused `requestPasswordReset` and its test lines leave.

## Scope

- `src/modules/auth/actions/captcha.ts`: the reset action consumes `consume_rate_limit` (Task 957) before
  `resetPasswordForEmail`: `auth-reset-email`, per `normalizeEmail` address, 3 per hour, and `auth-reset-ip`, per client
  IP, 10 per hour; past either it answers the existing refusal without calling Supabase; an RPC error refuses (fail
  closed).
- `src/app/auth/confirm/route.ts`: `auth-confirm-ip`, per client IP, 20 per 10 minutes, before `verifyOtp`; past the
  limit or on an RPC error it redirects to the existing failure page without calling `verifyOtp`.
- The values are Opus proposals; the owner may change them. The client IP is `clientIp` of Task 959; a refusal writes
  `excess_rate_limit_exceeded` through `src/lib/security/securityEvent.ts` (Task 955).
- `src/lib/auth/browser.ts`: `requestPasswordReset` removed; its lines in `browserAuth.security.test.ts` removed.
- Dependencies: none added.
- Out of scope: the Supabase Auth dashboard limits for sign-in (the owner's setting); the limiter itself (Task 957).

## Attack surface

Changed: the password-reset request (anonymous Server Action) and `/auth/confirm` (anonymous route). Threat model:
- T1 Denial of service / abuse (repeated reset mail to one address, repeated link confirmations from one client) →
  the atomic limiter per e-mail and per IP, refused before Supabase Auth — mitigate, AC1, AC2.
- T2 Spoofing (a helper that sends reset mail without CAPTCHA) → the unused helper leaves — eliminate, AC3.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (upstream 7af0ef1b745f, 2026-11-17).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — repeated reset mail and link confirmations are the abuse cases of the threat model — AC1, AC2.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — two anonymous entry points gain a limit; one unused helper leaves — AC1, AC2, AC3.
- Authentication: not applicable — the password rule belongs to Task 959; this task only limits two requests.
- Authentication_Patterns: not applicable — Supabase Auth stays the identity provider; no authentication scheme is added.
- Authorization: not applicable — both entry points are anonymous by design; no permission or object check changes.
- Authorization_Decisions_And_Output_Handling: not applicable — no policy decision point is called; the limiter is not authorization.
- Authorization_Patterns: not applicable — no resource gains or loses an access rule in this task.
- Authorization_Regression_Testing: not applicable — no authorization rule changes; the limits have their own tests.
- Authorization_Testing_Automation: not applicable — the authorization matrix is unchanged by two rate limits.
- Bot_Management_and_Anti-Automation: "Per endpoint — the login endpoint deserves a tighter limit than the home page." — the reset request and the confirmation each get their own bucket and values — AC1, AC2.
- Cookie_Theft_Mitigation: not applicable — no cookie option changes; session cookies are Task 960.
- Credential_Stuffing_Prevention: "or similar puzzle for each login attempt can help to identify automated/bot attacks" — the reset request keeps its CAPTCHA and gains a limit; the helper without CAPTCHA leaves — AC1, AC3.
- Denial_of_Service: "Using validation that is cheap in resources first" — the limit is consumed before the call to Supabase Auth — AC1, AC2.
- Email_Validation_and_Verification: "Applications must define a consistent normalization strategy before storing or comparing email addresses." — the per-address bucket uses the Task 959 `normalizeEmail` — AC1.
- Input_Validation: "Use `Forwarded` and `X-Forwarded-*` values only when they come from your own proxies" — the client IP comes from the one `clientIp` rule of Task 959 — AC1, AC2.
- Insecure_Direct_Object_Reference_Prevention: not applicable — no object is read or written by an identifier from the request.
- JavaScript_and_TypeScript_Security: not applicable — no regular expression, merge or dynamic code is added; one call per entry point.
- Mass_Assignment: not applicable — no request field is bound to a stored record by this task.
- Multifactor_Authentication: not applicable — MFA is Task 960; no factor changes here.
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — the reset action limits itself, not the form that calls it — AC1.
- Nodejs_Security: "Apply rate limiting to sensitive authentication-related endpoints, including login, password reset, account recovery, and verification flows." — the reset request and the link confirmation consume the atomic limiter; sign-in keeps the Supabase Auth setting — AC1, AC2.
- OAuth2: not applicable — the OAuth return path and its sanitizer are not touched by this task.
- Prototype_Pollution_Prevention: not applicable — no object is built from request keys in this task.
- REST_Security: "the access control decision should be taken locally by REST endpoints" — the confirm route applies its own limit before `verifyOtp` — AC2.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the diff of the three files and their tests — AC4.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the reviewer reruns AC1-AC4 instead of reading the report — AC4.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — each threat of the model is an acceptance criterion — AC1, AC2, AC3.
- Session_Management: not applicable — no session is created, renewed or ended differently by a limit.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them for two entry points — AC1, AC2, AC3.
- Unvalidated_Redirects_and_Forwards: not applicable — the refused confirmation redirects to the existing fixed failure page.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — each claimed run is repeated in review — AC4.
- Web_Service_Security: not applicable — no schema or service contract changes; the route takes the same query.

## UI

No visible change: past the limit the reset form shows its existing refusal text and the route its existing failure page.

## Mobile adaptation record

- Scope: none

## Acceptance criteria

- AC1 The reset request is limited — test: `src/modules/auth/actions/__tests__/captcha.security.test.ts` (extended: the
  request past the limit for one e-mail, and for one IP, is refused and `resetPasswordForEmail` is not called; a
  request inside the limit reaches it).
- AC2 The link confirmation is limited — test: `src/app/auth/confirm/__tests__/route.security.test.ts` (extended: past the
  limit for one IP the route redirects to the failure page and `verifyOtp` is not called; inside the limit it is called).
- AC3 No reset helper without CAPTCHA is left — test: `npm run typecheck` and
  `src/lib/auth/__tests__/browserAuth.security.test.ts` (the `requestPasswordReset` lines removed, the rest unchanged).
- AC4 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. Confirm Tasks 957, 959 and 991 are merged. Branch from `main`.
2. Tests first (AC1, AC2); save each failing output.
3. The change; one pass over every changed file (checklist I7).
4. Run: the task tests · CI on GitHub only (`gh pr checks <n>`, checklist A5); one deliberate break per security test (remove the limiter call once, the test fails,
   restore).
5. Report: each command, exit code and relevant output.

## Review
