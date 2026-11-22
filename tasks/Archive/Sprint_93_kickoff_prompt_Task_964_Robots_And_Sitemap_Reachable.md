# Task 964 — Search engines can read robots.txt and every sitemap file

Sprint 93. Priority P1. Found by the Task 952 review (2026-11-07), pre-existing on production; no owner decision needed.
Implementer: Sonnet, on `task/964-robots-sitemap` from `main` (Task 952 is in `main`; both change `src/proxy.ts`).
Re-checked 2026-11-11 on `main` after PR #28: production still answers 307 to `/sq/robots.txt` (404) for `/robots.txt`,
`/sitemap.xml` and `/sitemap/0.xml`; `src/proxy.ts:94`, `src/app/robots.ts:16` and `src/app/sitemap.ts:10` unchanged.
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
- Revision 1 (Opus, 2026-11-11, Review 1 F1; owner, 2026-11-11, translated: "a new listing must reach search engines
  at once, not through a deployment"). The set of sitemap files follows the current public listings, not the build:
  - R1-1 `src/app/sitemap.ts`: no `dynamicParams = false` (Next's default serves an id `generateSitemaps` returns at
    request time). `generateSitemaps` reads the public count through `unstable_cache` (as `src/modules/admin/lib/propertyTypes.ts`)
    with the tag `PUBLIC_LISTINGS_CACHE_TAG` and `revalidate: 3600`: the Next wrapper of the route calls it on every
    request, so an id past the last file answers 404 from the cache, and the tag reaches every cached sitemap file and
    `robots.txt`. The non-whole-number check stays. `revalidate = 3600` stays on both files: listings that lapse by
    time change no row, so the hour bounds how long one stays listed.
  - R1-2 `PUBLIC_LISTINGS_CACHE_TAG` is one exported constant (`src/modules/listings/lib/cacheTags.ts`, new). Every
    Server Action that changes which listings are public or a field a sitemap shows (`slug`, `updated_at`) expires it
    with `updateTag` after a successful write: `applyListingTransition` (every status change, publish and approval
    included), `deleteListing` (owner) and `deleteListing` of `src/modules/admin/actions/index.ts`, `updateListing`, and
    the two account deletions (`src/modules/admin/actions/index.ts` and `src/modules/cabinet/actions/index.ts` after
    `deleteAccount`, whose cascade removes the listings).
  - R1-3 `src/proxy.ts`: the sitemap exclusion is `sitemap/\d{1,3}\.xml$`. A route that serves request-time ids caches
    each path it answers, 404 included; three digits bound the paths an anonymous visitor can add to the cache to 1 110
    (1 000 files, 5 000 000 listings). `/sitemap/1234.xml` keeps the proxy, which sends it to a 404 page.
- Files to change: the three above, and for Revision 1 `src/modules/listings/lib/cacheTags.ts` (new), the actions R1-2
  names, and their tests. Dependencies: none.
- Out of scope: sitemap content rules, per-language `alternates`, submission to search consoles (the owner's console step).

## Attack surface

Changed: `/robots.txt` and `/sitemap/<id>.xml` become reachable by anonymous visitors, outside the proxy.
- What can go wrong: T1 information disclosure, a listing a visitor may not see appears in a sitemap. T2 denial of
  service, anonymous requests each run a service-role read of up to 5000 rows (`src/app/sitemap.ts:10`).
- Mitigate T1: the read stays behind `applyPublicVisibility`, only `slug` and `updated_at` are selected; test AC4.
- Mitigate T2: the response is cached for an hour, and a bad id reads nothing; test AC3. Revision 1: an id past the
  last file is answered from the cached count, and the proxy bound keeps the cached paths to 1 110; tests AC1, AC3.
- The proxy never carried authorization (`docs/state-authority.md`, "Middleware role"), so leaving these paths out
  removes no access check. Both are public and read no session.

Authorization matrix: two anonymous read rows.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (238de6895289, mapping of 2026-11-11).

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
- Denial_of_Service: "Using validation that is cheap in resources first" — a bad id answers 404 before any database read, and the good answer is cached; Revision 1: an id past the last file is answered from the cached count, and the proxy bound keeps the cached paths to 1 110 — AC1, AC3.
- HTTP_Headers: not applicable — the headers come from `next.config.ts`, which runs for these paths without the proxy.
- HTTP_Strict_Transport_Security: not applicable — the HSTS header comes from `next.config.ts` and does not change.
- Input_Validation: not applicable — Revision 1 adds one `updateTag` call after the existing successful writes of the actions R1-2 names; no input, parsing or validation of them changes.
- Insecure_Direct_Object_Reference_Prevention: not applicable — the tag is expired only after each action's existing ownership or staff check and successful write; no object lookup or check changes (R1-2).
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — the new matcher alternatives are fixed strings and one digit run — AC1.
- Mass_Assignment: not applicable — no write payload or bound field changes; the actions R1-2 names keep their writes.
- Nextjs_Security: "Return only authorized result fields because Server Action return values are serialized to the client." — the sitemap selects only `slug` and `updated_at`, the same discipline for a public route — AC4.
- Prototype_Pollution_Prevention: not applicable — no object is built from input; the tag is one exported string constant.
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
  new cases: `/robots.txt`, `/sitemap/0.xml`, `/sitemap/12.xml`, `/sitemap/999.xml` left out; `/robots.txt.bak`,
  `/sitemapx`, `/sitemap`, `/sitemap/1234.xml` (Revision 1, R1-3), `/sq/listings`, `/admin` still matched.
- AC2 `robots.txt` names every sitemap file and no `/sitemap.xml` — test: `src/app/__tests__/robots.test.ts` (new), with
  one and with three ids from a mocked `generateSitemaps`.
- AC3 A bad sitemap id reads nothing — test: `src/app/__tests__/sitemap.security.test.ts` (new): `abc`, `-1`, `1.5` answer
  404 and the client double records no query; a good id reads one range; both files export `revalidate = 3600`.
  Revision 1: `dynamicParams` is not exported as `false`; `generateSitemaps` reads the count through `unstable_cache`
  with the tags `[PUBLIC_LISTINGS_CACHE_TAG]` and `revalidate: 3600` (the double of `next/cache` records the options), so
  a second call within the cache makes no second query, and the ids follow a count that grows from 1 to 12 000 rows.
- AC4 Only public listings are listed — test: `src/app/__tests__/sitemap.security.test.ts`: the query goes through
  `applyPublicVisibility` and selects only `slug, updated_at`; removing the call fails the test.
- AC5 The live answers — test: `scripts/quality/robots-sitemap-live.test.mjs` (new; Opus places it and adds the click-shield
  CI step after the server starts): `/robots.txt` and `/sitemap/0.xml` answer 200 with no redirect, and the `Sitemap:`
  line of `robots.txt` is a URL of the configured origin that ends in `/sitemap/0.xml`. Review 1 F2 (added by Opus):
  `robots.txt` names exactly the files `0..n-1`, each answers 200, and `/sitemap/<n>.xml` and `/sitemap/01.xml` answer
  404 with no redirect.
- AC7 (Revision 1, R1-2) A change to the public listings reaches the sitemap at once — test:
  `src/__tests__/security/publicListingsTag.test.ts` (new): every product file that calls `updateTag('site-stats')`
  also calls `updateTag(PUBLIC_LISTINGS_CACHE_TAG)`, and so do `updateListing.ts`, `src/modules/admin/actions/index.ts`
  and `src/modules/cabinet/actions/index.ts`; and `src/modules/listings/actions/ownerPublish.security.test.ts`: a
  publish expires the tag once, a refused one does not.
- AC6 `npm run lint`, `npm run typecheck`, `npm test -- --coverage`, `npm run build`,
  `node scripts/quality/changed-lines-coverage.mjs --base main` and `node scripts/quality/check-files.mjs --worktree`
  exit 0 — test: those commands.

## Route

1. Tests first: AC1 to AC4, run on the unchanged code, save the failing output.
2. Change the matcher, `robots.ts` and `sitemap.ts`. The draft of AC5 goes in the report.
3. Run AC6, then `next start` with `SENTRY_AUTH_TOKEN=` empty and `curl` the AC5 paths.
4. Report: each command, exit code and relevant output; each new test's failing run; a deliberate break per security test.
5. Revision 1: change the tests of AC1, AC3 and AC7 first and run them on the Review 1 code (keep the failures), then
   R1-1 to R1-3; a deliberate break per new control (the tag dropped from one action, `dynamicParams = false` back, the
   digit bound widened); `npm run build` (`ƒ` or `●` for `/sitemap/[__metadata_id__]`) and AC5 on `next start`.

## Review

Review 1 of the working tree on `task/964-robots-sitemap` (base ac4bbdfa7) — NEEDS REVISION (1 of 2)
Scope: the whole diff: `src/proxy.ts`, `src/app/robots.ts`, `src/app/sitemap.ts`, the AC1 cases of
`middlewareScope.security.test.ts`, `src/app/__tests__/robots.test.ts` and `sitemap.security.test.ts` (new), and Opus's
`scripts/quality/robots-sitemap-live.test.mjs` and the click-shield step of `ci.yml`; the Next 16.4.3 sitemap wrapper
(`next-metadata-route-loader.js`) and the route cache (`build/templates/app-route.js`) the change relies on.
Tools: `owasp.mjs sync` and `check` 0, `check-ruleset.mjs` 0, `claims.mjs check` 0, `ac-tests.mjs` 0
[локально: `node scripts/quality/ac-tests.mjs --base main <kickoff>`]; `ci-local.mjs` exit 1: 4 jobs passed (quality,
unit, dependencies, change report), the OWASP task gate failed on G1, as it must before an approved review, and 14 jobs
were not run [локально: `node scripts/quality/ci-local.mjs`]; AC1 to AC4 13/13 [локально: `npx vitest run` of the three
files]; `npm run build` 0 (`○ /robots.txt 1h`, `● /sitemap/0.xml 1h`); AC5 on `next start` 3/3, the F2 case included
[локально: `BASE_URL=http://127.0.0.1:3000 ROBOTS_LIVE_REQUIRED=1 node --test scripts/quality/robots-sitemap-live.test.mjs`].
Findings: Critical 0, High 0, Medium 0, Low 2
Overall risk: no exposure (only public listings, cached answers); the sitemap files are fixed at build, so they lag the
public listings, and around a multiple of 5000 listings robots.txt names a file that answers 404.

F1 — The sitemap files are fixed at build while robots.txt counts them every hour
Severity: Low      Category: availability (business logic)      CWE: —
Location: `src/app/sitemap.ts:17` (`dynamicParams = false`), `src/app/robots.ts:10-13`
Description: Next answers only the ids `generateSitemaps` returned at build (`fallback: false` → `NoFallbackError` before
the handler, `app-route.js`), but `robots.txt` is rebuilt every hour from the current count, and the sitemap wrapper
calls `generateSitemaps` again on each regeneration and caches a 404 (`status: response.status`). Making `robots.txt`
static only moves the mismatch: once the count falls below a multiple of 5000, the last file regenerates as a 404.
Impact: past 5000 public listings, until the next deployment, robots.txt names `/sitemap/<n>.xml`, which answers 404, and
the newest listings are in no sitemap. The owner, 2026-11-11 (translated): "a new listing must reach search engines at
once, not through a deployment".
Reproduction: `npm run build` lists `○ /robots.txt 1h` and only `● /sitemap/0.xml`; `/sitemap/1.xml` answers 404
[локально: `curl` on `next start`]; `next-metadata-route-loader.js:241-283` and `app-route.js` read.
Recommendation: Revision 1, R1-1 to R1-3 and AC1, AC3, AC7: the files follow a cached count, the tag expires on every
change of the public listings, and the proxy bounds the ids.
References: Denial_of_Service, Web_Cache_Security; `src/modules/admin/lib/propertyTypes.ts` (the tag pattern).
Status: fixed in Revision 1 (Review 2)

F2 — AC3's "an id past the last file answers 404" was tested on the configuration only
Severity: Low      Category: testing      CWE: —
Location: `src/app/__tests__/sitemap.security.test.ts` (the `dynamicParams` case)
Description: the unit test reads `dynamicParams === false`; no test requested a file past the last one from the server
that answers crawlers.
Impact: a Next change of the wrapper or of `fallback` would pass every test.
Reproduction: the executor's report says so; the case is absent from `robots-sitemap-live.test.mjs` of the report.
Recommendation: AC5 (Opus's file): robots.txt names exactly `0..n-1`, each answers 200, `/sitemap/<n>.xml` and
`/sitemap/01.xml` answer 404 with no redirect.
References: Verifying_Third_Party_Agent_Execution_Evidence; `.claude/rules/quality-gates.md` §8.
Status: fixed in Review 1 (`scripts/quality/robots-sitemap-live.test.mjs`, third test; 3/3 on `next start`)

Accepted from Review 1: the matcher (Next serves the excluded paths: `/robots.txt` 200 and `/sitemap/0.xml` 200, no
redirect; `/robots.txt.bak`, `/sitemapx`, `/sitemap.xml`, `/sitemap/abc.xml` 307 to `/sq/…`, then 404), the whole-number
check, `applyPublicVisibility` with `slug, updated_at` only, the headers of `next.config.ts` on both answers
(`Strict-Transport-Security`, `X-Content-Type-Options`). Every claim of the executor's report reproduced. Deliberate
breaks, each restored and byte-compared: both matcher exclusions removed and the `$` dropped fail AC1; the old
`/sitemap.xml` address fails 2 AC2 cases; the id check removed, `dynamicParams = true`, `applyPublicVisibility` removed
and `select('*')` each fail one AC3 or AC4 case [локально: `npx vitest run <file>` after each break].
Pipeline, owner's request of 2026-11-11 (translated: "fix the pipeline"): a review under `NEEDS REVISION` could never
complete, because the OWASP task gate needs an approved task. `ci-local.mjs --hold owasp-gate` and the review phase's
`underRevision` variants (`pipeline-steps.json`, `pipeline.mjs`; `flow.md`, Pipeline; `review-task` step 8); tests in
`pipeline.test.mjs` and `ci-local.test.mjs`, six deliberate breaks each failing one [локально: `node --test`]. The owner
had the revision executed in the same turn (2026-11-11), so its criteria have their tests when the review phase runs.

Review 2 of the working tree on `task/964-robots-sitemap` (base ac4bbdfa7, Revision 1) — APPROVED
Scope: the whole Revision 1 diff: `src/modules/listings/lib/cacheTags.ts` (new), `src/app/sitemap.ts` (the count through
`unstable_cache` with the tag, no `dynamicParams = false`), `src/app/robots.ts` (comment), `src/proxy.ts` (`\d{1,3}`),
`updateTag(PUBLIC_LISTINGS_CACHE_TAG)` after the successful write of `applyListingTransition.ts`, the owner and admin
`deleteListing`, `updateListing.ts`, `hardDeleteUser` and `deleteOwnAccount`; the tests of AC1, AC3, AC7 and the five
action test files Sonnet extended, and the `updateTag` stubs of six test files (no assertion removed or weakened;
`cacheTags.test.ts` still counts the twelve other `updateTag` calls and requires one argument on the new ones).
Tools: the AC tests and the action tests 121/121 [локально: `npx vitest run` of the ten files]; `npm run build` 0
(`○ /robots.txt 1h`, `● /sitemap/0.xml 1h`); AC5 3/3 on `next start` [локально: `BASE_URL=http://127.0.0.1:3000
ROBOTS_LIVE_REQUIRED=1 node --test scripts/quality/robots-sitemap-live.test.mjs`]; `/sitemap/999.xml` and `/sitemap/01.xml`
404, `/sitemap/1234.xml` 307 to `/sq/…` [локально: `curl` on `next start`]; the review phase below.
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: low; the sitemap files and robots.txt follow the public listings at once on every Server Action that changes
them, and within the hour for listings that lapse by time.
Acceptance: AC1 `middlewareScope.security.test.ts`; AC2 `robots.test.ts`; AC3 and AC4 `sitemap.security.test.ts`; AC5
the live run above; AC7 `publicListingsTag.test.ts` and `ownerPublish.security.test.ts`; AC6 the execute and review
phases. The route cache carries the tag: `unstable_cache` adds its tags to the work unit store, which the route's cache
entry records as `collectedTags` (`next/dist/server/web/spec-extension/unstable-cache.js:125-133`,
`app-route/module.js:277`), so `updateTag` expires every sitemap file and `robots.txt`. Deliberate breaks by Opus, each
restored and byte-compared: the tag dropped from the status gateway fails 4 tests, dropped from the count cache 2, and
expired before a failed account deletion 4 [локально: `npx vitest run <files>` after each break]; Sonnet's ten breaks
are in its report. Listings that lapse by time change no row; `revalidate = 3600` bounds them (R1-1), and the expiry cron
changes no listing (Task 923 R77 (d)).
