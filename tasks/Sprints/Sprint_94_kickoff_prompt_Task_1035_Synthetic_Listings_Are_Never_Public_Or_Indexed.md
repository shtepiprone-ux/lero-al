# Task 1035 — Synthetic test listings are never listed publicly and never indexed

Sprint 94. Priority P2. Owner request 2026-11-24 (translated): "the production sitemap https://lero.al/sitemap/0.xml lists test listings whose slug
starts with zz_synth_: 5 listings in 4 languages, 20 unwanted addresses; exclude test listings from every sitemap whatever their status and
language, serve noindex on their pages, do not block them in robots.txt, check they reach no public component, keep the automated tests working,
make the indexing rule reusable for IndexNow, and check how the sitemap cache follows a change".
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

While a CI integration run is under way, its synthetic listings are live on the one database the site reads, and the active ones are listed like
any other: in the catalogue, search, similar listings and the sitemap, which then keeps their addresses for up to an hour after the run removes
them. After the task one rule says whether a listing may be indexed; every public listing read leaves synthetic listings out, and a synthetic
listing's own page carries `noindex`.

## Cause

Read at `756950f15`
- The integration fixtures create listings on the real project with the slug `${RUN}-${tag}`, `RUN = zz_synth_<time><hex>` (`src/tests/integration/fixtures.ts:111`, `:160`), many of them `active` (`src/lib/account/deleteAccount.integration.test.ts:132-134`, `src/modules/listings/actions/deleteListing.integration.test.ts:38-39`), and remove them by that prefix at the end of the run (`fixtures.ts:32-39`).
- Every public listing read goes through `applyPublicVisibility` (`src/modules/listings/lib/visibility.ts:137`), which filters by status and expiry only, so an active synthetic listing is public while it exists; the sitemap reads through it (`src/app/sitemap.ts:58`) and caches each file and the count for an hour (`sitemap.ts:21`, `:25-33`); the clean-up deletes rows directly, which expires no cache tag.
- The listing page's metadata knows no synthetic listing: an active one gets full, indexable metadata (`src/app/[locale]/listings/[slug]/page.tsx:91-126`).
- The prefix is a safe marker: a session cannot write a slug with `_` (`public.guard_listings_protected_columns()`: `new.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'`, read 2026-11-24), and none of the 49 listings has `_` in its slug (`select count(*) filter (where slug ~ '_') from public.listings` → 0); no column marks a test row (`information_schema.columns` of `listings`, read 2026-11-24). No synthetic listing exists between runs (`slug ilike 'zz%synth%'` → 0 rows, 2026-11-24).

Fix: one module names the marker and the indexing rule; `applyPublicVisibility` also excludes slugs that start with the escaped prefix `zz\_synth\_`, so every public read (sitemap included) leaves them out and no cache can hold them; the listing page answers `noindex, nofollow` for a synthetic slug.

## Scope

- `src/modules/listings/lib/indexing.ts` (new): `SYNTHETIC_LISTING_SLUG_PREFIX = 'zz_synth_'`, `SYNTHETIC_LISTING_SLUG_LIKE = 'zz\\_synth\\_%'` (the LIKE pattern with both underscores escaped), `isSyntheticListingSlug(slug)` (exact `startsWith` of the prefix) and `isListingIndexable({ slug })` (false for a synthetic slug; the one place a future IndexNow submission asks).
- `src/modules/listings/lib/visibility.ts` `applyPublicVisibility` (`:137`): add `.not('slug', 'like', SYNTHETIC_LISTING_SLUG_LIKE)`; the generic constraint gains `not`.
- `src/app/[locale]/listings/[slug]/page.tsx` `generateMetadata`: before the full metadata, `!isListingIndexable({ slug })` → `{ title: 'Lero.al', robots: { index: false, follow: false } }`.
- Existing tests whose query doubles meet the new `.not` call (Scope amendment 2026-11-24, after the executor's BLOCKED report; Opus ran the tests of every `applyPublicVisibility` consumer on the executor's tree → 2 files failed, `TypeError: q.not is not a function`): `src/modules/listings/components/__tests__/SimilarListings.visibility.test.ts` (`createRecordingQuery`, `:15-23`) and `src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx` (the builder that `applyAdminListingsVisibility` receives, `:244-300`): each double gains `not(column, op, value)` recorded like its other methods, and each assertion of the full visibility chain also expects `{ not, slug, like, 'zz\\_synth\\_%' }`; no assertion is removed (A9).
- Dependencies: none.
- Out of scope: `src/app/robots.ts` (no disallow is added, so a crawler can read the `noindex`); the fixtures and their clean-up; Task 992 (sold and rented listings in the sitemap, which edits `sitemap.ts` later); an IndexNow integration; an `X-Robots-Tag` header (the server-rendered meta tag is the control the page already uses for `noindex`).
- Kept as on `main` (checklist A2): every non-synthetic listing is listed, opened and indexed exactly as today; statuses, expiry, caches and their tags unchanged; the admin "all listings" view still shows synthetic rows; the admin dashboard counts and the admin "visible" filter, which read through `applyPublicVisibility`, leave synthetic rows out (owner request of 2026-11-24: no public component shows them).

## Attack surface

Changed: a business invariant of every public listing read (what is public).
1. **What are we working on?** `applyPublicVisibility` (anonymous and signed-in public reads: catalogue, search API, similar listings, saved-search mail, sitemap, admin counts) and the listing page metadata (anonymous).
2. **What can go wrong?** T1 I: synthetic test data is published and indexed → mitigate: the exclusion in the one public filter and `noindex` on the page → AC1, AC3, AC4. T2 D/T: a pattern too broad hides real listings (an unescaped `_` matches any character, `zz-synth-…` is a valid user slug) → mitigate: both underscores escaped; a user slug cannot contain `_` (the guard) → AC2, AC4.
3. Each mitigation is an acceptance criterion with a test that fails when it is removed.

## OWASP

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — T1 (test data published) and T2 (real listings hidden by a broad pattern) — AC1, AC2, AC4.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the one public filter and the page metadata — AC1, AC3.
- Bot_Management_and_Anti-Automation: not applicable — no limit or automation control changes in this task.
- Credential_Stuffing_Prevention: not applicable — no sign-in or credential path is touched here.
- Cross_Site_Scripting_Prevention: not applicable — the metadata adds fixed values; no output of input changes.
- DOM_based_XSS_Prevention: not applicable — no client code or DOM sink changes.
- Denial_of_Service: "Using validation that is cheap in resources first" — the exclusion is one indexed-column predicate in the existing query, no extra request — AC1.
- JavaScript_and_TypeScript_Security: not applicable — a fixed prefix test, no regular expression over input.
- Nextjs_Security: not applicable — no Server Action or route handler changes; one page's metadata changes.
- React_Security: not applicable — no component or prop changes in this task.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — reviewed with the review-task skill on this task's diff — AC6.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — T1 and T2 are AC1-AC4 — AC1, AC4.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — answered in "## Attack surface" — AC1-AC4.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the marker's safety is measured on the database (the guard, 0 underscores), not assumed — AC2, AC4.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns every test and break — AC1-AC5.
- Web_Frontend_Security: not applicable — no HTML sink or script is added.

## UI

No visible change: synthetic listings stop appearing; no component, text or style changes.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 Every public read excludes synthetic listings — test: `src/modules/listings/lib/__tests__/visibility.test.ts` (extended): `applyPublicVisibility` calls `.not('slug', 'like', 'zz\\_synth\\_%')` besides the status and expiry filters; fails without the line.
- AC2 The indexing rule is exact — test: `src/modules/listings/lib/__tests__/indexing.test.ts` (new): `zz_synth_abc-x` → not indexable; `zz-synth-house`, `zzsynth`, `apartament-1` → indexable; the LIKE pattern escapes both underscores.
- AC3 A synthetic listing's page says `noindex` — test: `src/app/[locale]/listings/[slug]/__tests__/closedListing.security.test.ts` (extended): an active listing with a synthetic slug → `robots: { index: false, follow: false }`; an active listing with a normal slug → no `robots` (indexed as today).
- AC4 The real database applies the exclusion and hides nothing else — test: `src/tests/integration/syntheticListingsHidden.integration.test.ts` (new, CI `authz` job, fixtures of `createRun`): an active synthetic listing is returned by a plain read of its slug and NOT by `applyPublicVisibility` with the same slug; the count of public listings without synthetic slugs is equal with and without the `.not` filter (no real listing excluded).
- AC5 The sitemap leaves them out — test: `src/app/__tests__/sitemap.security.test.ts` (extended): a synthetic row the double returns is excluded by the filter the route applies, and `src/app/__tests__/robots.test.ts` still has no rule for listing addresses.
- AC6 The CI jobs pass — test: `gh pr checks <n>` after every check has concluded (checklist A5).

## Route

1. Work on the branch the owner created from `main` (checklist H1); its first commit carries this kickoff and the archive of Task 1034 (Opus's).
2. Tests first (AC1-AC5); save each failing output.
3. `indexing.ts`, the filter, the metadata. Check that `node scripts/check-listing-visibility.mjs`'s anchor still holds (it is a CI gate: read its rule, do not run it).
4. Run: `npm test -- src/modules/listings/lib/__tests__/visibility.test.ts src/modules/listings/lib/__tests__/indexing.test.ts "src/app/[locale]/listings/[slug]/__tests__/closedListing.security.test.ts" src/app/__tests__/sitemap.security.test.ts src/app/__tests__/robots.test.ts src/modules/listings/components/__tests__/SimilarListings.visibility.test.ts src/modules/admin/dashboard/__tests__/queries.test.ts src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx` (AC4 in the CI `authz` job). Deliberate breaks: drop the `.not` line → AC1 fails; an unescaped pattern `zz_synth_%` → AC2 fails; drop the metadata branch → AC3 fails; each restored.
5. Report: each command, exit code, relevant output, each break and its result.

## Revision 1

- R1-1 (Review 2, F1) `src/app/admin/listings/visibilityFilter.ts:10`: the generic constraint of `applyAdminListingsVisibility` gains `not: any`, so its `Q` meets `applyPublicVisibility`'s constraint (CI run 45479979660: TS2322 and TS2345 at `:15`). No other line changes.

## Review

- [Review 1 — APPROVED](../../docs/reviews/Task_1035_Review_1.md)
- [Review 2 — NEEDS REVISION](../../docs/reviews/Task_1035_Review_2.md)
- [Review 3 — APPROVED](../../docs/reviews/Task_1035_Review_3.md)
