# Task 956 — Hardening v8b: the database enforces the moderator keys, the contact gateway, the profile bounds, edit moderation and one public-listing rule

Sprint 93. Priority P0. Owner decisions: D1 2026-11-06 (rules on the OWASP reference); the owner 2026-11-06 "all holes
found must be fixed"; D53 / R74 (an owner's edit of an active listing is published only after staff approve it); D72
(a visitor may open an active, sold or rented listing address); D77 / D79 / D80 (contact reveal limits); R75 (a key for
every action that admits a moderator); D91 (pre-launch checks on the one project are allowed). Filed by the whole-project
audit (`docs/security/audit-2026-11-06/findings.md`: DB-01 to DB-08, SQL-01, L-04, P-06 database part).
Implementer: Sonnet (writes the SQL, the rollback, the checks and the tests; never applies SQL). The owner applies.
Reviewer: Opus (proves the preflight and the rollback read-only on the owner's delivery path before the apply).

## Goal

Today, `node scripts/quality/db-catalog-audit.mjs --snapshot <catalog of 2026-11-07>` reports 59 findings (the live
catalog read read-only on 2026-11-07):
- I3: `get_listing_owner_contact(uuid)` is SECURITY DEFINER and executable by `authenticated`: any signed-in account
  reads the phone and WhatsApp of any active listing without Turnstile, limits or the reveal record (DB-01).
- I5: 22 write policies on 17 tables admit `role in (admin, moderator)` without the moderator's key (DB-02); the keys
  live only in `role_permissions`, read by the application through the admin client (`src/lib/auth/permissions.ts:6-28`).
- I6: `authenticated` holds UPDATE on every `users` column; the guard trigger protects role, status and a few more;
  `avatar_url`, `company_id`, `company_logo_url`, `created_at`, `inactivity_warning_sent_at`, `last_seen_at`,
  `location_request`, `pending_email`, `public_id`, `social_provider` stay session-writable, and the seven text columns
  have no CHECK (DB-03; the code cites "the `users` CHECKs of hardening v8b", `upload-avatar/route.ts:128`).
- I8: "Users can update own listings" lets the owner change an active listing's content directly (DB-04).
- I4: `anon` holds INSERT / UPDATE / DELETE on 15 tables (DB-05). I9: bucket `avatars` has no size or type bound (DB-06).
- I7: "Listings viewable by everyone" admits an active listing whose expiry passed (DB-08). Three definitions of a
  public listing: `listings/lib/visibility.ts:15-23`, `listings/lib/listingAccessState.ts:11`,
  `listings/lib/recentlyViewedQueries.ts:41,68` (active, sold, rented, archived).
- `public_user_profiles` is a definer view listing `deleted_at` and has-phone flags of every account (DB-07).
- `notifications` has two duplicate SELECT and two duplicate UPDATE policies (P-06; the column grant is already
  `is_read` only). `src/types/database.ts` is written by hand (L-04).

After the task the same command against the live catalog exits 0, and CI fails when the hand types and the catalog
differ.

## Scope

- SQL in `supabase/sql_migrations/task956/`: `v8b.sql`, `v8b-rollback.sql`, `v8b-preflight.sql` (read-only: counts the
  rows each new CHECK and the new public rule would refuse or hide; any non-zero count stops the apply),
  `v8b-verify.sql` (read-only, after the apply). One transaction; every object named schema-qualified.
  - `public.caller_has_permission(key text) returns boolean`: SECURITY DEFINER, `search_path = ''`, STABLE; true for an
    active `admin`; for an active `moderator` the `allowed` value of `role_permissions` (missing row = false); false
    otherwise. Added to `DEFINER_EXECUTE_ALLOWED` in `scripts/quality/db-catalog-audit.mjs` with its reason;
    `PERMISSION_CHECK` there accepts `caller_has_permission(`.
  - The 22 I5 policies rewritten with the key the application checks for the same write: `listings` UPDATE
    `listings.moderate`, DELETE `listings.delete` (the ALL policy is split per command; INSERT stays the owner's);
    `pages`, `page_translations` `legal.manage`; `locations`, `location_translations` `locations.manage`; `amenities`,
    `amenity_translations` `catalog.manage`; `listing_reports`, `report_actions` `reports.manage` (DELETE
    `reports.delete`); `site_settings` `settings.manage`; `support_tickets`, `support_ticket_events` `support.manage`;
    `verification_requests` `users.verify`; `companies` `companies.manage`; `email_templates` `email_templates.manage`;
    `contact_inquiries`, `contact_inquiry_replies` `inquiries.manage`. Sources: the `checkStaff` / `resolveAdminActor` /
    `roleHasPermission` calls (`grep -rnE "'(listings|legal|locations|catalog|reports|settings|support|users|companies|email_templates|inquiries)\.[a-z_]+'" src`).
    A table whose application key differs from this list is reported, not guessed.
  - `revoke execute on function public.get_listing_owner_contact(uuid) from authenticated, anon, public` (the server
    gateway uses the admin client).
  - `users`: revoke UPDATE on the ten server-only columns from `authenticated`; revoke INSERT and UPDATE from `anon`;
    CHECKs on `name`, `last_name`, `company_name`, `position` (length), `website` (length, `https://` prefix),
    `phone`, `whatsapp` (E.164: `^\+[1-9][0-9]{6,14}$`), each bound equal to or looser than the application's bound
    (cited per column from `src/lib/security/inputs.ts` and the profile schemas). Every application write of a revoked
    column goes through the admin client (`cabinet/actions/index.ts:530,786`, `api/upload-avatar/route.ts:136` and any
    other the grep `\.update\(\{[^}]*(<column>)` finds).
  - `listings`: a BEFORE UPDATE trigger `listings_owner_edit_moderation` refuses (`raise exception`, SQLSTATE `42501`)
    an update by the owning session (`auth.uid() = old.user_id`, not staff) of a content column while
    `old.status = 'active'`. `updateListing.ts:102-117` already moves the listing to `pending` first, so the
    application path is unchanged.
  - One public rule: `(status = 'active' and expires_at > now()) or status in ('sold', 'rented') or auth.uid() = user_id`
    (D72 keeps sold and rented openable), in the SELECT policy, `visibility.ts`, `listingAccessState.ts` and the
    recently-viewed queries (archived leaves the public set).
  - `revoke insert, update, delete on` the 15 I4 tables `from anon`.
  - `storage.buckets.avatars`: `file_size_limit` and `allowed_mime_types` equal to the route's bounds
    (2 MB; `image/jpeg`, `image/png`, `image/webp`: `api/upload-avatar/route.ts:81,85`).
  - `public_user_profiles`: only the columns a public page renders (each consumer named in the report); `deleted_at`
    and the has-phone flags leave unless a consumer needs them.
  - `notifications`: drop `notifications_select` and `notifications_update` (duplicates).
- Types: `db-catalog-audit.mjs` gains a `columns` query and writes `supabase/catalog.json` with `--save`; a new
  `scripts/quality/db-types-drift.mjs` (+ `.test.mjs`) compares every table and column of `src/types/database.ts` with
  `supabase/catalog.json` and exits 1 on a difference; the snapshot is committed after the apply.
- Rollback proof: a new `scripts/quality/db-sql-roundtrip.mjs` (+ `.test.mjs`, reusable by every database task):
  inside ONE transaction it reads the catalog, runs the change file, then the rollback file, reads the catalog again and
  ends with `rollback`; exit 1 when the two catalogs differ or either file fails. Nothing it runs is ever committed.
- Dependencies: none.
- Out of scope: the application-side reveal limits (they exist), uploads (Task 957), applied-file headers (Task 950), the
  rest of v8b (Task 962: avatar and logo prefix, sign-up trigger, price ceiling, catalogue rule, image moderation,
  `exchange_providers`).

## Attack surface

Changed: the data layer every direct PostgREST call meets (all session roles).
- T1 Elevation of privilege: a moderator without a key writes through PostgREST. Mitigation: the key in the policy.
- T2 Information disclosure: contact scraping through the RPC; expired listings and profile flags read directly.
  Mitigation: revoke; one public rule; fewer view columns.
- T3 Tampering: profile columns, unbounded text, unmoderated listing edits. Mitigation: column grants, CHECKs, trigger.
- T4 Denial of service on the application: a CHECK or revoke that refuses a legitimate write. Mitigation: the preflight
  counts, the application writes moved to the admin client first, the integration suites on the real database.

Authorization matrix: per I5 table and command, rows for anon, an active user, the owner, a moderator with the key, a
moderator without it, an admin, a blocked account.


## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — a direct PostgREST write that skips moderation is the abuse case of T-rows — AC5.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names each entry point the task adds, removes or changes — AC1, AC2, AC3, AC4, AC5, AC6, AC7.
- Authentication: not applicable — no sign-in change; permissions.ts reads the same keys the policies use.
- Authentication_Patterns: not applicable — no authentication code; the database authorizes by auth.uid() as before.
- Authorization: "Implement defense in depth. Do not depend on any single framework, library, technology, or control to be the sole thing enforcing proper access control." — policies check the permission key in the database as the actions do in code — AC2.
- Authorization_Decisions_And_Output_Handling: "Intersect predicates. Combine authorization restrictions with application and tenant predicates using logical AND." — the public rule ANDs status, expiry and ownership in one predicate — AC6.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — caller_has_permission runs inside each policy next to the rows — AC2.
- Authorization_Policy_And_Data_Distribution: "Avoid embedding mutable account status or revocation data in releases that cannot update promptly." — keys are read from role_permissions at query time, so a switched-off key takes effect at once — AC2.
- Authorization_Regression_Testing: "Relying on UI hiding is insufficient; the API layer must enforce the check" — each key is tested through PostgREST, not through the admin UI — AC2.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — the moderator-key integration test covers every I5 table and command — AC2.
- Bot_Management_and_Anti-Automation: not applicable — no limit changes; the limiter is Task 959.
- Business_Logic_Security: "Enforce workflows as explicit state machines. Don't rely on the UI to gate the order of steps." — the trigger refuses a direct edit of an active listing; the moderated path is the only one — AC5.
- Content_Security_Policy: not applicable — no header or script change; the Turnstile mention is about sign-up, unchanged.
- Cookie_Theft_Mitigation: not applicable — no cookie changes in the database hardening.
- Credential_Stuffing_Prevention: not applicable — no sign-in path changes; limits are Task 959.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — anon writes nothing, the bucket is bounded, duplicate policies go — AC1, AC7.
- Denial_of_Service: "Using validation that is cheap in resources first" — the bucket size limit refuses large files before storage — AC7.
- Email_Validation_and_Verification: not applicable — pending_email becomes server-only by column grant; the confirmation flow is unchanged.
- File_Upload: "Validate the file type, don't trust the Content-Type header as it can be spoofed" — the avatars bucket allows only jpeg, png and webp up to 2 MB — AC7.
- GraphQL: "Ensure that the API has proper access control checks." — the same policies guard pg_graphql; the catalog audit reads them — AC1.
- HTTP_Strict_Transport_Security: not applicable — no header changes in a database task.
- Identity_Propagation_Patterns: "Each receiving service must still authorize the requested action and resource." — the admin client paths still authorize the caller before the write — AC4.
- Injection_Prevention: not applicable — the SQL files are static migrations; no command or query is built from input.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — name and phone CHECKs hold on the direct database path — AC4.
- Insecure_Direct_Object_Reference_Prevention: "This verification should be performed for all operations involving object references, including read, create, update, delete, export, and administrative actions." — read, update and delete paths of listings and profiles are tested per role — AC4, AC5, AC6.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL security-extended (CI) run on every changed file — AC11.
- Mass_Assignment: "Do not rely on a block-list as the sole protection: a new or overlooked sensitive field remains bindable." — server-only users columns are revoked by column grant, an allow-list in the database — AC4.
- Multi_Tenant_Security: "Do Not Use an RLS-Bypassing Role for Tenant-Scoped Request Paths" — the contact RPC is closed to sessions; only the server gateway with its own checks reveals — AC3.
- Multifactor_Authentication: not applicable — no sign-in factor changes; staff MFA is Task 960.
- Nextjs_Security: not applicable — the cabinet action changes no contract; the database now enforces the same rules.
- OS_Command_Injection_Defense: not applicable — db-catalog-audit.mjs gains an allow-list entry; no process call changes.
- Prototype_Pollution_Prevention: not applicable — the cabinet action keeps its field list; no request object is merged.
- Query_Parameterization: "Dynamic SQL can be parameterized using bind variables, to ensure the dynamically constructed SQL is secure." — the policies call the function with literal keys; no dynamic SQL — AC9.
- REST_Security: "the access control decision should be taken locally by REST endpoints" — the avatar route keeps its own checks; the bucket bounds back them up — AC7.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the whole diff; changed-line coverage and the file checks run on it — AC11.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input: Opus reruns every acceptance command in review — AC11.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the mitigations of the threat model are the acceptance criteria of this task — AC1, AC2, AC3, AC4, AC5, AC6, AC7.
- Session_Management: not applicable — no session handling changes in the database hardening.
- SQL_Injection_Prevention: "Use least privilege alongside parameterized queries and allow-list mapping." — the definer function has search_path empty and takes the key as a parameter — AC9, AC10.
- Third_Party_Javascript_Management: not applicable — no script loading changes in a database task.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them and each mitigation is an acceptance criterion — AC1, AC2, AC3, AC4, AC5, AC6, AC7.
- Transport_Layer_Security: not applicable — connections stay Supabase-managed TLS; no transport change.
- User_Privacy_Protection: "Preventing leakage of user IP addresses is of great significance when user protection is in scope." — public_user_profiles exposes only the columns a page renders — AC7.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC11.
- Web_Service_Security: not applicable — no service schema changes; the database adds constraints behind the same API.

## UI

No visible change (an expired active listing already shows as hidden in the application).

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 After the apply, the live catalog has no finding — test: `node scripts/quality/db-catalog-audit.mjs` exits 0
  (run by Opus before and after the apply; the before run shows the 59).
- AC2 Each rewritten policy follows the key — test: `src/tests/integration/moderatorKeys.integration.test.ts`
  (extended: per I5 table and command, a moderator session with the key switched off is refused through PostgREST,
  with it switched on succeeds, an admin succeeds; the key is restored in `finally`).
- AC3 The contact RPC is closed to sessions — test: `src/tests/integration/contactGateway.integration.test.ts`
  (extended: `rpc('get_listing_owner_contact')` with a user session and with anon answers a permission error; the
  server gateway still reveals within limits).
- AC4 Server-only `users` columns and the CHECKs hold on the direct path, and the application still writes them —
  test: `src/modules/admin/actions/userProfileFields.integration.test.ts` (extended: a session update of each of the ten
  columns is refused; an over-long name and a non-E.164 phone are refused; `emailChange.integration.test.ts` and
  `uploadAvatar.integration.test.ts` stay green).
- AC5 An owner cannot change an active listing's content directly; the application edit still moderates — test:
  `src/modules/listings/actions/updateListing.integration.test.ts` (extended: a direct session update of an active
  listing's title answers `42501`; `updateListing` moves it to `pending` and writes the content).
- AC6 One public rule — test: `src/tests/integration/listingAccessState.integration.test.ts` (extended: anon reads no
  active listing with a past or null expiry, reads sold and rented, reads no archived) and
  `src/modules/listings/lib/__tests__/visibility.test.ts` (the TypeScript rule and the SQL predicate in `v8b.sql` are
  the same table of cases).
- AC7 `anon` writes nothing, the bucket is bounded, the duplicate policies are gone, the view lists only rendered
  columns — test: `node scripts/quality/db-catalog-audit.mjs` (I4, I9) and
  `src/tests/integration/accessHardening.integration.test.ts` (extended: the exact column set of
  `public_user_profiles`; the policy names on `notifications`).
- AC8 The hand types equal the catalog — test: `node scripts/quality/db-types-drift.mjs` exits 0, and
  `scripts/quality/db-types-drift.test.mjs` proves a removed, an added and a retyped column each fail.
- AC9 The audit tool knows the new function — test: `scripts/quality/db-catalog-audit.test.mjs` (extended: a policy
  calling `caller_has_permission(` passes I5; a definer function not on the allow-list still fails I3).
- AC10 Rollback restores the previous catalog — test:
  `node scripts/quality/db-sql-roundtrip.mjs supabase/sql_migrations/task956/v8b.sql supabase/sql_migrations/task956/v8b-rollback.sql`
  exits 0 (run by Opus before the apply, D91), and `scripts/quality/db-sql-roundtrip.test.mjs` proves that a rollback
  missing one statement fails and that the transaction never commits.
- AC11 `npm run lint`, `npm run typecheck`, `npm test -- --coverage`, `node scripts/quality/check-files.mjs --worktree`,
  `node --test "scripts/quality/*.test.mjs"` and
  `node scripts/quality/ac-tests.mjs --base main tasks/Sprints/Sprint_93_kickoff_prompt_Task_956_Database_Hardening_V8b.md`
  exit 0.

## Route

1. Branch from `main`. Run `node scripts/quality/db-catalog-audit.mjs --save <scratch>/before.json`; keep the output.
2. Tests first (AC2-AC9) against the live project with `SECURITY_TEST_PROJECT_REF`; save each failing output.
3. Move every application write of a revoked column to the admin client; align `visibility.ts`,
   `listingAccessState.ts`, the recently-viewed queries; write the four SQL files; extend the audit tool; add the
   drift tool.
4. Run `v8b-preflight.sql` read-only; report every count. Hand over to Opus; Opus proves the preflight and the rollback
   (LF and CRLF, md5) and gives the owner the apply step.
5. After the owner's apply: `v8b-verify.sql`, AC1-AC11, `--save supabase/catalog.json`.
6. Report: each command, exit code and relevant output; each failing-first run; one deliberate break per AC.

## Review
