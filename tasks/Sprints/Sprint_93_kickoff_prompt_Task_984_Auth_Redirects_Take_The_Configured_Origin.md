# Task 984 — No redirect the site answers takes its origin from the request's Host

Sprint 93. Priority P3. Filed 2026-11-16 by Task 983 (the OWASP `Input_Validation` sheet gained "Host and Forwarded
Headers" that day). Open owner decision O984-1: which hosts besides the production origins are allowed (a Vercel
preview deployment's own address; the CI browser jobs' `http://127.0.0.1:3000`). Implementer: Sonnet. Reviewer: Opus,
in a session of its own. Human owner of the change: the owner.

## Goal

The e-mail confirmation route, the OAuth callback route and the locale redirects of the request proxy answer with an
absolute `Location` whose origin is the one of the incoming request, which comes from its `Host`; the proxy serves a
request whatever `Host` it names. After the task every such `Location` has an origin of the allowed list (the production
origins and the configured site URL, plus localhost outside production), whatever `Host` or `X-Forwarded-Host` the
request carries; a request on an allowed origin keeps it; the proxy refuses a request whose host is not allowed.

## Cause

Read at bb9e2b35a
`src/app/auth/confirm/route.ts:21` and `src/app/auth/callback/route.ts:11`: `const { searchParams, origin } = new URL(request.url)`;
the redirects use it (`src/app/auth/confirm/route.ts:28-45`, `src/app/auth/callback/route.ts:28-34`).
`src/proxy.ts:74-83` hands locale routing to `next-intl` and returns its response, whose redirect builds `new URL(url, request.url)`
(the installed package, `middleware.js` under `node_modules/next-intl/dist/esm/development/middleware/`, its function
`redirect`) and, with `x-forwarded-host` present, takes protocol and port from the request headers.
`grep -n "Accept only the hostnames\|Build absolute URLs" .cache/owasp/Input_Validation.md` → 70 and 71: "Build absolute
URLs, such as password reset and email links, from configuration instead of the request" and "Accept only the hostnames
the application serves and reject other requests".
The allowed list exists for e-mailed links only: `src/lib/auth/trustedOrigin.ts:20-42` (`allowedAppOrigins`,
`trustedAppOrigin`).
Vercel, https://vercel.com/docs/headers/request-headers (read 2026-11-16): `host` "represents the domain name as it was
accessed by the client"; `x-forwarded-host` "is identical to the `host` header". UNKNOWN: whether Vercel passes a
client-sent `X-Forwarded-Host` through, and whether `NEXT_PUBLIC_SITE_URL` is set per preview deployment.
The same section (the cached Input_Validation sheet, lines 71-72; `owasp.mjs check` verifies both quotes) asks to "Accept only the hostnames the application serves and
reject other requests" and to use `X-Forwarded-*` values "only when they come from your own proxies". No code checks the
request's host: `src/proxy.ts:58-83` routes every matched request whatever its `Host`. The five rate-limit keys that read
`x-forwarded-for` (`src/app/api/listings/[slug]/view/route.ts:47`, `src/modules/auth/actions/recovery.ts:77`,
`src/modules/cabinet/actions/index.ts:545`, `src/modules/contacts/actions/index.ts:94`,
`src/modules/listings/actions/contactGateway.ts:42`) read a header the same page (read 2026-11-17) describes as "The
public IP address of the client that made the request", adding: "If you are trying to use Vercel behind a proxy, we
currently overwrite the [`X-Forwarded-For`] header and do not forward external IPs. This restriction is in place to
prevent IP spoofing." UNKNOWN: whether Vercel delivers to the project a request whose `Host` is none of its domains, and
what it does with a client-sent `X-Forwarded-For` when no proxy is in front (neither is on that page). The CI browser
job serves the `start` script (`next start`) on `http://127.0.0.1:3000` with no `NEXT_PUBLIC_SITE_URL`
(`.github/workflows/ci.yml:465-496`).
Fix: the three places take the origin of their `Location` from the allowed list, never from the request alone; the proxy
refuses a host that is not allowed.

## Scope

- `src/app/auth/confirm/route.ts`, `src/app/auth/callback/route.ts`: the origin of every redirect comes from
  `trustedAppOrigin` (the canonical owner of the allowed list), with the request's origin as the candidate.
- `src/proxy.ts`: a locale redirect whose `Location` origin is not allowed is answered with the same path on the
  configured origin; a request whose host is not the host of an allowed origin (O984-1 decides the list beyond the
  production origins and the configured site URL) is refused with a 4xx status, without session refresh or locale
  routing; every other response is unchanged.
- Tests: `src/app/auth/confirm/__tests__/route.security.test.ts`, `src/app/auth/callback/__tests__/route.security.test.ts`,
  `src/lib/auth/__tests__/middlewareScope.security.test.ts`.
- Dependencies: none.
- Out of scope: any host in the allowed list that O984-1 does not name (`allowedAppOrigins` changes only by it);
  `safeNextPath` (unchanged, it keeps judging `next`); `next-intl` (no patch, no version change).

## Attack surface

Changed: what decides the `Location` of three anonymous entry points (GET `/auth/confirm`, GET `/auth/callback`, the
locale redirects of `src/proxy.ts`), and which hosts the proxy serves at all. Trust boundary: request headers (`Host`,
`X-Forwarded-Host`, `X-Forwarded-Proto`) into a response header the browser follows.
- T1 — S/T: a request whose `Host` or `X-Forwarded-Host` names another site gets a `Location` on that site; a person who
  followed a crafted e-mail link signs in and lands on the other site (phishing after a real sign-in) → mitigate: origin
  from the allowed list → AC1, AC2, AC3.
- T2 — I/T: a shared cache keeps such a redirect for other visitors (cache poisoning) → mitigate: no `Location` carries
  a request-chosen origin, so no stored redirect can → AC1, AC2, AC3.
- T3 — D: a sign-in on an allowed origin (`https://www.lero.al`, localhost in development) is sent elsewhere and the
  session cookie set for that host is lost → mitigate: an allowed request origin is kept → AC4.
- T4 — S/I: a request naming a host the site does not serve (another domain pointed at the deployment, an old address)
  gets the site's pages, session refresh and redirects under that host → mitigate: the proxy refuses a host that is not
  allowed → AC7.
Matrix rows: anonymous × each of the three entry points × foreign `Host` → `Location` on the configured origin (DENY of
the foreign origin); anonymous × each × allowed origin → `Location` on that origin (ALLOW); anonymous × the proxy ×
a host that is not allowed → 4xx, no `Location`, no cookie (REFUSE).

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (registry at `31f5b8f5ad29`, mapping of Task 983).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — T1–T4 name the crafted `Host`, the cached redirect and the foreign host — AC1, AC2, AC3, AC4, AC7.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the three entry points, the host the proxy serves and the header boundary — AC1, AC2, AC3, AC7.
- Authentication: not applicable — no credential, password rule or sign-in factor changes; only the response origin does.
- Authentication_Patterns: not applicable — the task embeds no authentication; Supabase Auth stays the provider.
- Authorization: not applicable — no access decision changes; the three entry points stay anonymous by design.
- Authorization_Decisions_And_Output_Handling: not applicable — no policy decision point takes part in choosing a redirect origin.
- Authorization_Patterns: not applicable — no enforcement point moves; the routes authorize nothing new.
- Authorization_Regression_Testing: not applicable — no authorization rule changes; the matrix rows above are redirect-origin cases.
- Authorization_Testing_Automation: not applicable — no authorization rule changes, so the matrix of Task 950 is untouched.
- Bot_Management_and_Anti-Automation: not applicable — no rate limit or automated-traffic control of these routes changes.
- Clickjacking_Defense: not applicable — the frame headers of the proxy response stay exactly as they are.
- Content_Security_Policy: not applicable — the report-only script policy set by the proxy is untouched.
- Cookie_Theft_Mitigation: not applicable — cookie attributes and the moment they are issued stay unchanged.
- Credential_Stuffing_Prevention: not applicable — no login attempt handling or captcha changes in these routes.
- Denial_of_Service: not applicable — the added work is one comparison of an origin with a short fixed list.
- Email_Validation_and_Verification: not applicable — the token verification of the confirm route is unchanged.
- HTTP_Headers: not applicable — only the `Location` value changes; the security response headers stay unchanged.
- HTTP_Strict_Transport_Security: not applicable — HSTS comes from `next.config.ts`, which the task does not touch.
- Input_Validation: "Build absolute URLs, such as password reset and email links, from configuration instead of the request" — the origin of every `Location` of the three entry points comes from the allowed list — AC1, AC2, AC3; "Accept only the hostnames the application serves and reject other requests." — the proxy refuses a host that is not allowed — AC7; "Use `Forwarded` and `X-Forwarded-*` values only when they come from your own proxies" — no `Location` takes its origin from `X-Forwarded-Host`; the `x-forwarded-for` keys read the header Vercel documents as the client's public IP ("## Cause") — AC1, AC3.
- Insecure_Direct_Object_Reference_Prevention: not applicable — the changed code reads or writes no object by reference.
- JavaScript_and_TypeScript_Security: not applicable — the change compares origins with a fixed list; no merge or regex is added.
- Mass_Assignment: not applicable — no request body is bound to a model by the changed code.
- Multifactor_Authentication: not applicable — no sign-in factor or enrollment step changes in this task.
- Nextjs_Security: not applicable — no Server Action changes; the entry points are GET handlers and the proxy.
- OAuth2: "Clients and Authorization Server must not expose URLs that forward the user's browser to arbitrary URIs obtained from a query parameter" — `next` stays judged by `safeNextPath`, and the origin it is joined to no longer comes from the request — AC2, AC4.
- Prototype_Pollution_Prevention: not applicable — no object is built from request keys by the changed code.
- REST_Security: not applicable — no access control decision of an endpoint changes in this task.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the three changed entry points and their tests whole — AC5.
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries" — no dependency is added; `next-intl` is neither patched nor upgraded — AC5.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threat model's mitigations are the criteria — AC1, AC2, AC3, AC4, AC7.
- Session_Management: not applicable — session issuance and renewal stay in the unchanged helpers they live in.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them in T1–T4 — AC1, AC2, AC3, AC4, AC6, AC7.
- Transport_Layer_Security: not applicable — the allowed production origins are https and TLS settings are unchanged.
- Unvalidated_Redirects_and_Forwards: "If used, do not allow the URL as user input for the destination." — the request's `Host` is input and no longer chooses the destination origin — AC1, AC2, AC3.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the tests and the deliberate break of AC6 — AC5, AC6.
- Web_Cache_Security: "Canonicalize the host and scheme before using them to generate links, redirects, or security-sensitive headers." — the redirect origin is one of the allowed origins, never the raw request host — AC1, AC2, AC3.
- Web_Service_Security: not applicable — no schema-validated web service message passes through these routes.

## UI

No visible change.

## Mobile adaptation record

- Scope: none

## Acceptance criteria

- AC1 `/auth/confirm` called as `https://evil.example/auth/confirm?…` (a valid token, an invalid token, no token) and as
  `https://lero.al/…` with `x-forwarded-host: evil.example` answers every redirect on the configured origin — test:
  `src/app/auth/confirm/__tests__/route.security.test.ts`, `[SEC-984-CONFIRM-HOST-DENY]`.
- AC2 `/auth/callback` with the same requests (a code that exchanges, one that fails, none) — test:
  `src/app/auth/callback/__tests__/route.security.test.ts`, `[SEC-984-CALLBACK-HOST-DENY]`.
- AC3 The proxy's locale redirect of `/` and of an unprefixed path, for the same two requests, has its `Location` on the
  configured origin — test: `src/lib/auth/__tests__/middlewareScope.security.test.ts`, `[SEC-984-PROXY-HOST-DENY]`.
- AC4 A request on an allowed origin (`https://www.lero.al`; `http://localhost:3000` outside production) keeps that origin
  on all three — test: the same three files, `[SEC-984-CONFIRM-HOST-ALLOW]`, `[SEC-984-CALLBACK-HOST-ALLOW]`,
  `[SEC-984-PROXY-HOST-ALLOW]`; `src/app/auth/confirm/__tests__/route.test.ts` stays green unchanged.
- AC5 The usual gates — test: `npm run lint`, `npm run typecheck`, `npm test -- --coverage`,
  `node scripts/quality/changed-lines-coverage.mjs --base main` and `node scripts/quality/check-files.mjs --worktree`
  exit 0.
- AC6 Each DENY case fails when its entry point takes the origin from the request again, and the REFUSE case fails when
  the proxy's host check is removed (deliberate break, not committed; `security-testing.md`) — test:
  `src/app/auth/confirm/__tests__/route.security.test.ts`, `src/app/auth/callback/__tests__/route.security.test.ts` and
  `src/lib/auth/__tests__/middlewareScope.security.test.ts` run red on the break, their failing output in the report.
- AC7 A request to the proxy whose `Host` is `evil.example` (a page path, `/api/…`, `/admin`) is refused with a 4xx status
  and carries no `Location` and no session cookie; the same request on an allowed host is served as before — test:
  `src/lib/auth/__tests__/middlewareScope.security.test.ts`, `[SEC-984-PROXY-HOST-REFUSE]`; the CI browser jobs stay
  green on the pull request (`gh pr checks <n>`).

## Route

1. Wait for O984-1: the host check of AC7 refuses every host the list leaves out, the preview addresses and the CI
   server included.
2. Write the seven SEC-984 cases first; run them on the unchanged code and keep the failing output of the DENY and
   REFUSE cases.
3. Change the two routes and the proxy (Scope); read every changed file in full once (checklist I7) and close any hole found at once.
4. Run: `npm run lint` · `npm run typecheck` · `npm test -- --coverage` ·
   `node scripts/quality/changed-lines-coverage.mjs --base main` · `node scripts/quality/check-files.mjs --worktree` ·
   the three test files; then AC6's deliberate break per DENY and REFUSE case.
5. Report: each command with its exit code and output, the failing-first runs, the deliberate-break output.

## Review
