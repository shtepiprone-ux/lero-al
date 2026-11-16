# Task 980 — A session reads only the profile of the owner of a listing it may read, and no public view runs with its owner's rights

Sprint 93. Priority P2. Found 2026-11-15 by Task 956 Part B review (DB-07 of `docs/security/audit-2026-11-06/findings.md`).
Owner request 2026-11-16 (Task 956 session under O956-5, translated): add the Supabase linter warning "View
public.public_user_profiles is defined with the SECURITY DEFINER property" with a design decision, its AC and test, and a
`db-catalog-audit.mjs` check of definer views (an allow-list with a reason), since the audit does not see them.
Implementers: Sonnet (SQL, the listing page, the tests; never applies SQL), Opus (`scripts/quality/db-catalog-audit.mjs`
and its test). The owner applies. Reviewer: a separate Opus session (proves the preflight and the rollback first).

## Goal

On the development project bmxkzcxaojgmpgzawwtn (Task 956 v8b applied by the owner, 2026-11-16) one active non-staff
session reads 12 accounts through `public.public_user_profiles`, while it reads 1 row of `public.users` directly and 3
accounts own a publicly openable listing ("## Cause"). The pages need one row: the owner of the listing shown. After the
task a session gets that row only for a listing it may read, no view of `public` runs with its owner's rights (the linter
warning ends), and `db-catalog-audit.mjs` reports any view that does unless it is allow-listed with a reason.

## Cause

- The view runs with its owner's rights and admits every active session:
  `select c.reloptions, pg_get_userbyid(c.relowner) as owner, c.relacl from pg_class c where c.oid = 'public.public_user_profiles'::regclass` → `{security_invoker=false}`, `postgres`, `{postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres,authenticated=r/postgres}` (2026-11-16, read-only; Review 11 of Task 956, F31);
  its filter (`pg_get_viewdef`, same day) admits a caller whose `CURRENT_USER` is neither `authenticated` nor `anon`, or
  for whom `caller_is_active()` is true.
- As one active non-staff session (role `authenticated`, its live session id, rolled back):
  `select count(*) from public.public_user_profiles` → 12; `select count(*) from public.users` → 1;
  as `postgres`: `select count(distinct user_id) from public.listings where (status = 'active' and expires_at > now()) or status in ('sold', 'rented')` → 3.
- The listing page reads the view by the owner's id: `src/app/[locale]/listings/[slug]/page.tsx:222-226`; the staff
  preview reads it with the service-role client after its staff check: `src/app/admin/listings/[id]/preview/page.tsx:33-51`;
  `select rolbypassrls from pg_roles where rolname = 'service_role'` → true; `select has_table_privilege('service_role', 'public.users', 'SELECT')` → true.
- The audit reads no view option, so it passes the definer view: `scripts/quality/db-catalog-audit.mjs:24-55` (the queries);
  `node scripts/quality/db-catalog-audit.mjs --snapshot supabase/catalog.json` → `no finding` (2026-11-16).
Fix: the view becomes `security_invoker=true` without `authenticated` SELECT (the service role keeps the staff preview);
one definer function `public.listing_owner_profile(p_listing_id uuid)` with `set search_path = ''` returns the nine
columns of the owner of that listing only when `public.caller_is_active()` and the listing passes the PERMISSIVE SELECT
policies of `public.listings` (the one public rule, the caller's own listing, a staff caller); the page calls it; the audit
gains I16 for definer views.
Design decision (Opus): option (a) of the owner's request. Option (b), a definer view with a row filter, keeps the linter
warning (it flags every definer view of an exposed schema) and its filter over `listings` would still run with the
owner's rights; (a) ends the warning and leaves one definer object with a fixed `search_path` and one parameter, held by
I3 to an allow-list with its reason.

## Scope

- SQL in `supabase/sql_migrations/task980/`, one transaction each, every name schema-qualified: `v1.sql` (the view's
  option, the revoke, the function: `stable`, `security definer`, `set search_path = ''`, EXECUTE revoked from `public`
  and `anon`, granted to `authenticated`); `v1-rollback.sql` (the view as `security_invoker=false` with `authenticated`
  SELECT, the function dropped); `v1-preflight.sql` (read-only: the view's options and grants as "## Cause" reads them,
  the function absent); `v1-verify.sql` (the option `security_invoker=true`, no `authenticated` or `anon` SELECT on the view, the
  function's `search_path`, EXECUTE for `authenticated` only).
- The listing page: the owner read becomes `supabase.rpc('listing_owner_profile', { p_listing_id: listing.id })` with
  `.maybeSingle()`; `ListingDetailView` gets the same nine fields; the guest branch is unchanged.
- `db-catalog-audit.mjs` (Opus): a `views` query (each `public` view with its `reloptions`), invariant I16 (a view
  without `security_invoker` set to true or on is a finding unless `DEFINER_VIEW_ALLOWED` names it with a reason; empty
  after the apply), `listing_owner_profile` in `DEFINER_EXECUTE_ALLOWED` with its reason; its test.
- After the apply (Opus): `node scripts/quality/db-catalog-audit.mjs --save supabase/catalog.json` (the snapshot gains
  `views`; a generated file, proved by `--snapshot`, `flow.md` §2 step 4).
- Dependencies: none (no package). Task 956 v8b applied: done on bmxkzcxaojgmpgzawwtn (owner, 2026-11-16); production:
  UNKNOWN, read before the apply there.
- Out of scope: the nine columns, `has_phone` semantics, the staff preview page (the service role reads the invoker view
  as before), `src/types/database.ts` (the function returns the `PublicUserProfile` shape).

## Read set
Counted at c0a948345
- `supabase/sql_migrations/task980/v1.sql` — new, 60 lines
- `supabase/sql_migrations/task980/v1-rollback.sql` — new, 30 lines
- `supabase/sql_migrations/task980/v1-preflight.sql` — new, 20 lines
- `supabase/sql_migrations/task980/v1-verify.sql` — new, 40 lines
- `src/app/[locale]/listings/[slug]/page.tsx` — 330 lines
- `src/app/[locale]/listings/[slug]/__tests__/ownerProfile.test.ts` — new, 80 lines
- `src/tests/integration/accessHardening.integration.test.ts` — 731 lines
- `scripts/quality/db-catalog-audit.mjs` — 265 lines
- `scripts/quality/db-catalog-audit.test.mjs` — 178 lines

## Attack surface

Changed: a read path of signed-in sessions. PostgREST `public_user_profiles` closes to sessions; RPC
`listing_owner_profile` opens to `authenticated`.
- T1 Information disclosure: listing accounts (name, company, deletion date, phone and WhatsApp presence) through the
  view, or through the function with ids it was not meant for. Mitigation: the view refuses sessions; the function takes
  a listing id and answers only for a listing the caller may read — AC1, AC2.
- T2 Elevation of privilege: a definer object with a mutable `search_path`, or a definer view nobody sees. Mitigation:
  `search_path = ''`; I3 and I16 of the audit — AC4.
- T3 Denial of a legitimate read: the owner card disappears for a reader who may see the listing. Mitigation: the
  function answers exactly when the session's own `listings` read returns the listing; the page test — AC1, AC3.
Matrix: anon (view and function refused, 42501); active stranger (a public listing: row; an expired or archived one:
none); the listing's owner (own archived listing: row); staff session (row for any listing); blocked session
(none); service role (the view: every row).

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-16).

- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the read path that closes and the RPC that opens — AC1, AC2.
- Authorization: "Implement defense in depth. Do not depend on any single framework, library, technology, or control to be the sole thing enforcing proper access control." — the function checks the reader in the database, the view refuses sessions, the audit watches definer objects — AC1, AC2, AC4.
- Authorization_Decisions_And_Output_Handling: "Intersect predicates. Combine authorization restrictions with application and tenant predicates using logical AND." — the function ANDs `caller_is_active()`, the listings SELECT policies and the listing id — AC1.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — the check runs inside the function, next to the `users` rows it returns — AC1.
- Authorization_Regression_Testing: "Relying on UI hiding is insufficient; the API layer must enforce the check" — the integration tests call PostgREST directly, not the page — AC1, AC2.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — each row of the matrix in "## Attack surface" is a case of the integration test — AC1, AC2.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — sessions lose SELECT on the view and get EXECUTE on one function only — AC2, AC4.
- GraphQL: "Ensure that the API has proper access control checks." — pg_graphql uses the same grants: the view loses the session grant, the function keeps its own check — AC1, AC2.
- Identity_Propagation_Patterns: "Each receiving service must still authorize the requested action and resource." — the staff preview reads with the service role only after its own staff check, unchanged — AC2.
- Injection_Prevention: "The preferred option is to use a safe API which avoids the use of the interpreter entirely or provides a parameterized interface" — the page passes the listing id as an RPC argument, a typed parameter of the function — AC1.
- Input_Validation: not applicable — no form or request schema changes; the one input is a uuid parameter Postgres types.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — the I16 option check is a linear pattern; lint and CodeQL run on each changed file — AC4, AC6.
- Mass_Assignment: not applicable — a read path changes; no writable field or column grant changes.
- Multi_Tenant_Security: "Treat client-supplied tenant identifiers as selectors only." — the listing id only selects; the function decides from the caller and the listing whether to answer — AC1.
- Prototype_Pollution_Prevention: not applicable — no object merge; the page passes the returned row unchanged.
- Query_Parameterization: not applicable — the function body is static SQL; no statement text is built at run time.
- SQL_Injection_Prevention: "use parameterized queries for dynamic data values" — the listing id reaches SQL only as the typed parameter of the function — AC1.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the whole diff and reruns AC1-AC6 — AC6.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the reviewer reruns every claimed command and the live checks — AC6.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — T1-T3 are AC1-AC4 — AC1, AC2, AC3, AC4.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them; each threat has its test — AC1, AC3, AC4.
- User_Privacy_Protection: "Preventing leakage of user IP addresses is of great significance when user protection is in scope." — the deletion dates and phone presence of accounts without a readable listing leave a session's reach — AC1, AC2.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — failing-first runs and deliberate breaks are rerun in review — AC6.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 A session gets an owner's profile only for a listing it may read — test:
  `src/tests/integration/accessHardening.integration.test.ts` (extended, through PostgREST: for an active, an expired
  active, an archived and a sold listing of another account and an archived listing of the caller,
  `rpc('listing_owner_profile')` returns the owner's row exactly when the same session's `from('listings')` read returns
  the listing; a staff session gets it for each; anon is refused with 42501; a blocked session gets none; the row has
  exactly the nine columns and no phone digits).
- AC2 No session reads `public_user_profiles` — test: `src/tests/integration/accessHardening.integration.test.ts`
  (`authenticated` and anon refused with 42501; the service-role client reads the owner's row, the staff preview's path).
- AC3 The page passes the function's row to the contact card — test:
  `src/app/[locale]/listings/[slug]/__tests__/ownerProfile.test.ts` (new: a signed-in reader → the RPC is called with the
  listing id and its row reaches `ListingDetailView` as `owner`; a guest → no call).
- AC4 The audit sees a definer view — test: `scripts/quality/db-catalog-audit.test.mjs` (a `public` view with
  `security_invoker=false` or without the option fails I16; `true` and `on` pass; a view in `DEFINER_VIEW_ALLOWED`
  passes; `listing_owner_profile` executable by `authenticated` passes I3, without a pinned `search_path` it fails I3);
  after the apply `node scripts/quality/db-catalog-audit.mjs` exits 0 on the live catalog.
- AC5 Rollback restores the previous catalog — test: `node scripts/quality/db-sql-roundtrip.mjs
  supabase/sql_migrations/task980/v1.sql supabase/sql_migrations/task980/v1-rollback.sql` exits 0 (Opus, before the apply).
- AC6 `npm run lint`, `npm run typecheck`, `npm test -- --coverage`, `node scripts/quality/changed-lines-coverage.mjs
  --base main`, `node scripts/quality/check-files.mjs --worktree`, `node --test "scripts/quality/*.test.mjs"` exit 0, and
  `node scripts/quality/read-coverage.mjs` exits 0 in each implementer's session.

## Route

1. Branch from `main` after Task 956 is merged; the owner commits the tree before each session.
2. Tests first, each failing output kept: AC1-AC3 (Sonnet) with `SECURITY_TEST_TARGET=development` and
   `SECURITY_TEST_PROJECT_REF` set to the project the owner names for this task (bmxkzcxaojgmpgzawwtn was approved for
   Task 956's suites on 2026-11-16); AC4 (Opus, `scripts/quality/**`).
3. The SQL and the page (Sonnet), the audit (Opus); three passes; `read-coverage.mjs`; the green runs of AC6.
4. Opus proves `v1-preflight.sql` and AC5 and gives the owner the apply step; after the apply: `v1-verify.sql`, AC1, AC2,
   AC4 on the live catalog, `--save supabase/catalog.json`.
5. Report: each command, exit code and relevant output; each failing-first run; one deliberate break per AC.

## Review
