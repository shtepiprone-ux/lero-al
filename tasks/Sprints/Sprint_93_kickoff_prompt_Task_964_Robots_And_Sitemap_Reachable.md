# Task 964 — Search engines can read robots.txt and every sitemap file

Sprint 93. Priority P1. Found by the Task 952 review (2026-11-07), pre-existing on production; no owner decision needed.
Implementer: Sonnet, on `governance/reset-2026-11-06`, after Task 952 is committed (both change `src/proxy.ts`).
Reviewer: Opus. Human owner of the change: the owner.

## Goal

Task 923 R72 (h) added `src/app/robots.ts` and `src/app/sitemap.ts`, but no crawler can read them. Measured 2026-11-07:
- production: `curl -sI https://lero.al/robots.txt` answers 307 with `Location: /sq/robots.txt`; the same for `/sitemap.xml` and `/sitemap/0.xml`;
- the candidate of Task 952 on `next start`: the same 307, and `/sq/robots.txt` and `/sq/sitemap.xml` answer 404;
- cause: the matcher of `src/proxy.ts` leaves out images but not `.txt` or `.xml`, so next-intl adds a language prefix;
- second cause: `src/app/robots.ts:16` names `${SITE_URL}/sitemap.xml`, and that route does not exist. `src/app/sitemap.ts`
  has `generateSitemaps`, so `.next/app-path-routes-manifest.json` has only `/sitemap/[__metadata_id__]`.

After the task `/robots.txt` and each `/sitemap/<id>.xml` answer 200 on the production server, `robots.txt` names each
sitemap file that exists, and the list holds only what a visitor may see.

## Scope

- `src/proxy.ts`: `config.matcher` also leaves out exactly `/robots.txt` and `/sitemap/<id>.xml`. Any other path keeps
  its session refresh and language routing (`/robots.txt.bak` and `/sitemapx` stay matched).
- `src/app/robots.ts`: `sitemap` lists `${SITE_URL}/sitemap/<id>.xml` for every id of `generateSitemaps()`.
- `src/app/sitemap.ts`: the build lists the id files (`● /sitemap/0.xml`), so a new listing and a new file reach crawlers
  only on the next deployment. Both `robots.ts` and `sitemap.ts` get `export const revalidate = 3600`, one hour, the same
  as the homepage stats cache. An id that `generateSitemaps` did
  not return, or a value that is not a whole number, answers 404 and reads nothing from the database.
- Files to change: the three above and their tests. Dependencies: none.
- Out of scope: sitemap content rules, per-language `alternates`, submission to search consoles (the owner's console step).

## Attack surface

Changed: `/robots.txt` and `/sitemap/<id>.xml` become reachable by anonymous visitors, outside the proxy.
- What can go wrong: T1 information disclosure, a listing a visitor may not see appears in a sitemap. T2 denial of
  service, anonymous requests each run a service-role read of up to 5000 rows (`src/app/sitemap.ts:10`).
- Mitigate T1: the read stays behind `applyPublicVisibility`, only `slug` and `updated_at` are selected; test AC4.
- Mitigate T2: the response is cached for an hour, and a bad id reads nothing; test AC3.
- The proxy never carried authorization (`docs/state-authority.md`, "Middleware role"), so leaving these paths out
  removes no access check. Both are public and read no session.

Authorization matrix: two anonymous read rows.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — the two threats of "## Attack surface" are the attacks: a hidden listing in a sitemap and a read per anonymous request — AC3, AC4.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the two paths that become reachable — AC1, AC5.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — the paths are public by design; what they list is bounded by `applyPublicVisibility` — AC4.
- Authorization_Decisions_And_Output_Handling: not applicable — no protected decision exists on these two public paths.
- Authorization_Patterns: not applicable — no guard moves; the proxy never carried authorization on any route.
- Authorization_Regression_Testing: not applicable — no protected action changes; the visibility rule is tested in AC4.
- Authorization_Testing_Automation: not applicable — the matrix is Task 950; this task adds two public rows only.
- Bot_Management_and_Anti-Automation: not applicable — the answer is a cached public document, so no per-actor limit applies; AC3 bounds the read.
- Clickjacking_Defense: not applicable — a text and an XML document are not framed pages, and `next.config.ts` headers still apply to them.
- Content_Security_Policy: not applicable — the two documents run no script, and the report-only script policy never covered them.
- Credential_Stuffing_Prevention: not applicable — neither path takes a credential or touches the sign-in flow.
- Denial_of_Service: "Using validation that is cheap in resources first" — a bad id answers 404 before any database read, and the good answer is cached — AC3.
- HTTP_Headers: not applicable — the headers come from `next.config.ts`, which runs for these paths without the proxy.
- HTTP_Strict_Transport_Security: not applicable — the HSTS header comes from `next.config.ts` and does not change.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — the new matcher alternatives are fixed strings and one digit run — AC1.
- Nextjs_Security: "Return only authorized result fields because Server Action return values are serialized to the client." — the sitemap selects only `slug` and `updated_at`, the same discipline for a public route — AC4.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the whole diff and the matcher tests — AC6.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input; Opus reruns the live check — AC5, AC6.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threats became criteria — AC3, AC4.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them — AC3, AC4.
- Transport_Layer_Security: not applicable — no transport setting changes; the `Sitemap:` line keeps the configured origin.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC5, AC6.
- Web_Cache_Security: not applicable — the cached answers are public and hold no session or personal data; shared-cache rules for session answers are Task 954.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 The matcher leaves out exactly the two paths — test: `src/lib/auth/__tests__/middlewareScope.security.test.ts`,
  new cases: `/robots.txt`, `/sitemap/0.xml`, `/sitemap/12.xml` left out; `/robots.txt.bak`, `/sitemapx`, `/sitemap`,
  `/sq/listings`, `/admin` still matched.
- AC2 `robots.txt` names every sitemap file and no `/sitemap.xml` — test: `src/app/__tests__/robots.test.ts` (new), with
  one and with three ids from a mocked `generateSitemaps`.
- AC3 A bad sitemap id reads nothing — test: `src/app/__tests__/sitemap.security.test.ts` (new): `abc`, `-1`, `1.5` and an
  id past the last file answer 404 and the client double records no query; a good id reads one range; both files
  export `revalidate = 3600`.
- AC4 Only public listings are listed — test: `src/app/__tests__/sitemap.security.test.ts`: the query goes through
  `applyPublicVisibility` and selects only `slug, updated_at`; removing the call fails the test.
- AC5 The live answers — test: `scripts/quality/robots-sitemap-live.test.mjs` (new; Opus places it and adds the click-shield
  CI step after the server starts): `/robots.txt` and `/sitemap/0.xml` answer 200 with no redirect, and the `Sitemap:`
  line of `robots.txt` is a URL of the configured origin that ends in `/sitemap/0.xml`.
- AC6 `npm run lint`, `npm run typecheck`, `npm test -- --coverage`, `npm run build`,
  `node scripts/quality/changed-lines-coverage.mjs --base main` and `node scripts/quality/check-files.mjs --worktree`
  exit 0.

## Route

1. Tests first: AC1 to AC4, run on the unchanged code, save the failing output.
2. Change the matcher, `robots.ts` and `sitemap.ts`. The draft of AC5 goes in the report.
3. Run AC6, then `next start` with `SENTRY_AUTH_TOKEN=` empty and `curl` the AC5 paths.
4. Report: each command, exit code and relevant output; each new test's failing run; a deliberate break per security test.

## Review
