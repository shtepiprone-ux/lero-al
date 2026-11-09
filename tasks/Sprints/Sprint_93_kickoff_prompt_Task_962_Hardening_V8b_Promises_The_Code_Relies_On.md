# Task 962 — Hardening v8b, part 2: every database rule the code already relies on exists

Sprint 93. Priority P0. Owner decisions: the owner 2026-11-06 "all holes found must be fixed"; the owner 2026-11-07
(translated) "you are forbidden to walk past the gaps you find and only report them" and the question "did you write
v8b properly into the task?"; D71 (price ceilings EUR 10 000 000 000 and ALL 1 000 000 000 000); D53 / R84 (an owner's
edit of an active listing is published only after staff approve it); R78 (a) (the exchange-providers table goes);
D91 (pre-launch checks on the one project are allowed). Split from Task 956 by flow.md §1 (one kickoff ≤ 200 lines);
finding SQL-01 of `docs/security/audit-2026-11-06/findings.md`. Implementer: Sonnet (writes the SQL, the rollback, the
checks and the tests; never applies SQL). The owner applies. Reviewer: Opus (proves the preflight and the rollback
read-only on the owner's delivery path before the apply). Applied after Task 956, in its own transaction.

## Goal

Hardening v8a named what v8b must do after the push
(`supabase/sql_migrations/task923/db-catalog/proposed-hardening-v8a.sql:10-11`): R69 (a) the staff listings policy,
R69 (d) the `users` CHECKs and the sign-up trigger change, the price ceiling with R72 (d), R78 (a) the drop of
`exchange_providers`, R84 the moderation rules for an active listing, R86 (c)'s revoke. Task 956 carries R69 (a), R84 (a),
R86 (c) and the name, phone and website CHECKs. Five promises are in no task, while the code already says the database
keeps them (read 2026-11-07; live state from the read-only catalog snapshot of the same day):
- R69 (d) avatar and logo: `users.avatar_url` and `users.company_logo_url` must be null or on the project's Cloudinary
  prefix `https://res.cloudinary.com/die7okukn/` (the prefix `listing_images_url_prefix_check` already enforces). Code:
  `src/app/api/upload-avatar/route.ts:128` ("the `users` CHECK of hardening v8b requires it"),
  `src/modules/admin/actions/index.ts:484`. Live: `users` has only `users_preferred_locale_check` and
  `users_status_check`.
- R69 (d) sign-up trigger: `public.handle_new_user` (SECURITY DEFINER) inserts `avatar_url` from sign-up metadata (a
  Google picture address), `name` up to 200 characters and `phone` up to 32
  (`docs/sessions/evidence/task923/r24-03-inventory.md:163`), so the CHECKs of Task 956 and of this task would make a
  Google sign-up fail. The same inventory names two rows that break the logo and website rules today.
- D71 price ceiling: `src/modules/listings/validations/index.ts:5-9` ("Hardening v8b's per-currency CHECK on
  `listings.price` / `price_old` takes the same two numbers"). Live: only `listings_price_positive_check` and
  `listings_price_old_positive_check`.
- Catalogue values: `src/modules/listings/actions/createListing.ts:17-20` and `updateListing.ts:29` ("hardening v8b's
  CHECKs accept nothing else"): a listing's property type and currency must be ACTIVE rows of their catalogues. Live:
  no such rule.
- R78 (a): `src/modules/admin/actions/__tests__/exchangeProvidersRemoved.security.test.ts:3-8` ("hardening v8b drops
  the table after the push"); the table held third-party `api_key` values. Live: `public.exchange_providers` exists.
- R84 (b): a session INSERT, UPDATE or DELETE of `listing_images` for a listing whose status is `active` is refused
  (an owner otherwise swaps the photos of an approved listing without moderation). Live: no trigger on
  `listing_images`.

After the task each promise holds on the direct PostgREST path, the sign-up path still works, and every "hardening
v8b" sentence in `src/` names an object the catalog holds.

## Scope

- SQL in `supabase/sql_migrations/task962/`: `v8b2.sql`, `v8b2-rollback.sql`, `v8b2-preflight.sql` (read-only: counts
  and ids of the rows each new rule refuses; the apply stops on a non-zero count unless the owner decided that row),
  `v8b2-verify.sql` (read-only, after the apply). One transaction; every object schema-qualified.
  - `users_avatar_url_prefix_check`, `users_company_logo_url_prefix_check`: null or `starts_with(…, '<prefix>')`.
  - `public.handle_new_user`: keeps `avatar_url` only when it is on the prefix (else null), `left(name, 100)`, and
    `phone` only when it matches `^\+[1-9][0-9]{6,14}$` (else null); body otherwise unchanged (diffed in the report).
  - `listings_price_ceiling_check`: `(currency = 'EUR' and price <= 10000000000) or (currency = 'ALL' and price <=
    1000000000000)`, the same for `price_old` when not null; the numbers read from `MAX_LISTING_PRICE_BY_CURRENCY`.
  - `public.listings_catalogue_active()`: BEFORE INSERT, and BEFORE UPDATE OF the property type and currency columns,
    refuses (SQLSTATE `23514`) a value that is not an active row of its catalogue; the same rule as
    `catalogueRefusal`, including "a catalogue with no active row lets the database decide" only if the code keeps it.
  - `public.listing_images_owner_edit_moderation()`: BEFORE INSERT, UPDATE, DELETE on `listing_images`; a session
    (`auth.uid()` set, not staff) acting on an image of a listing whose status is `active` gets `42501`.
    `updateListing` moves the listing to `pending` before it writes images, so the application path is unchanged; the
    executor lists every session write to `listing_images` and proves it.
  - `drop table public.exchange_providers` after the preflight prints its row count and row ids (never the keys); the
    owner revokes any real key at its provider.
- Every "hardening v8b" sentence in `src/` (`grep -rn "hardening v8b" src`) gets its object in `v8b2-verify.sql` (or Task
  956's verify file) and the sentence names the constraint, trigger or function by its real name.
- `scripts/quality/db-catalog-audit.mjs`: new invariants I10 (the two prefix CHECKs), I11 (the price ceiling CHECK),
  I12 (the catalogue trigger), I13 (`exchange_providers` absent), I14 (the `listing_images` trigger); each with a
  planted failing case in `scripts/quality/db-catalog-audit.test.mjs`.
- The two rows that break the logo and website rules: the preflight lists their ids and values; the owner decides per
  row (correct or clear) before the apply. Opus asks with the values in the report.
- Dependencies: none. Out of scope: everything Task 956 carries.

## Attack surface

Changed: the data layer every direct PostgREST call meets, and the sign-up trigger.
- T1 Tampering: a session writes a foreign avatar or logo address, a price beyond the ceiling, an inactive catalogue
  value, or the photos of an approved listing. Mitigation: CHECKs and triggers.
- T2 Information disclosure: third-party API keys remain in `exchange_providers`. Mitigation: drop the table; the
  owner revokes the keys.
- T3 Denial of service on the application: a rule that refuses a legitimate write, a sign-up the trigger can no longer
  store. Mitigation: the preflight, the trigger change in the same transaction, the integration suites on the real
  database.

Authorization matrix: `users` (avatar, logo) and `listing_images` rows for anon, an active user, the owner, a
moderator, an admin; the sign-up path as the machine actor.

## OWASP

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — T1-T3 name the direct-API abuses each rule closes — AC1, AC3, AC4, AC5.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — the direct PostgREST path and the sign-up trigger are the changed surface; I10-I14 keep watching it — AC7.
- Authentication: not applicable — no credential, password or sign-in rule changes; the sign-up trigger only stores profile fields within the new bounds.
- Authentication_Patterns: not applicable — authentication stays with Supabase Auth; the trigger runs after it and decides nothing about identity.
- Authorization: "Implement defense in depth. Do not depend on any single framework, library, technology, or control to be the sole thing enforcing proper access control." — the database enforces what the Server Actions already check — AC1, AC3, AC4, AC5.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — each trigger raises and the write stops; nothing is written on a refusal — AC4, AC5.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — the rules live on the tables they protect — AC1, AC5.
- Authorization_Regression_Testing: "Relying on UI hiding is insufficient; the API layer must enforce the check" — each case runs a direct session call against the real database — AC1, AC3, AC4, AC5.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — the matrix rows of this task are integration cases — AC1, AC5.
- Bot_Management_and_Anti-Automation: not applicable — no endpoint, limit or automation path changes.
- Business_Logic_Security: "Always re-derive security-relevant values (prices, permissions, ownership) on the server. Client state is input, not truth." — the price ceiling and the active catalogue values hold in the database too — AC3, AC4.
- Cookie_Theft_Mitigation: not applicable — no cookie or session handling changes.
- Credential_Stuffing_Prevention: not applicable — no sign-in or credential path changes.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — the table holding third-party keys is dropped; the definer trigger keeps its fixed search_path — AC2, AC6.
- Denial_of_Service: "Using validation that is cheap in resources first" — a CHECK refuses before any trigger work; the sign-up trigger clamps instead of failing — AC2, AC3.
- File_Upload: not applicable — the upload routes are unchanged; only the stored address of an upload is bounded (Task 957 owns uploads).
- GraphQL: not applicable — the project exposes no GraphQL endpoint; the path trigger matched the SQL folder.
- HTTP_Strict_Transport_Security: not applicable — no header changes; "https" appears only in the stored address prefix.
- Injection_Prevention: not applicable — the SQL is static DDL with no value built from input; the triggers compare columns to constants.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — the database checks the same bounds as the schemas — AC1, AC3, AC4.
- Insecure_Direct_Object_Reference_Prevention: "This verification should be performed for all operations involving object references, including read, create, update, delete, export, and administrative actions." — the image trigger covers insert, update and delete — AC5.
- JavaScript_and_TypeScript_Security: not applicable — the TypeScript change is a test and comment wording; no runtime code path changes.
- Mass_Assignment: "Do not rely on a block-list as the sole protection: a new or overlooked sensitive field remains bindable." — the avatar and logo columns are bound by an allow-listed prefix, not by the form alone — AC1.
- Multi_Tenant_Security: "Do Not Use an RLS-Bypassing Role for Tenant-Scoped Request Paths" — the rules hold for the session roles the request paths use — AC1, AC5.
- Multifactor_Authentication: not applicable — no authentication factor changes (Task 960 owns MFA).
- Nextjs_Security: not applicable — no Server Action or route changes its inputs or outputs; the database adds the second check.
- Nodejs_Security: not applicable — no Node runtime code changes.
- OS_Command_Injection_Defense: "The primary defense is to avoid calling OS commands directly." — the new audit invariants read the catalog through the database driver and start no process — AC7.
- Prototype_Pollution_Prevention: not applicable — no object merge or JSON binding changes.
- Query_Parameterization: not applicable — no query is built from input; the migration is static DDL.
- REST_Security: not applicable — no REST endpoint changes; PostgREST is held by the table rules.
- SQL_Injection_Prevention: not applicable — static DDL only; the triggers read typed columns, no dynamic SQL.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — Opus reviews the four SQL files and the trigger diff, then proves the rollback — AC9.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the code's own "hardening v8b" sentences are verified against the catalog, not trusted — AC8.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — T1-T3 became AC1-AC6.
- Serverless_FaaS_Security: not applicable — no function trigger changes; the upload route only appears as the writer that keeps working.
- Session_Management: not applicable — no session is created, renewed or ended by this task.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — the attack surface section names each threat with its mitigation — AC1-AC6.
- Transport_Layer_Security: not applicable — no transport change; the prefix only fixes which HTTPS host an address may name.
- User_Privacy_Protection: not applicable — no personal data is added or kept longer; a foreign avatar address is cleared, not stored.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — Opus reruns the preflight, the rollback and every AC, not the executor's report — AC9, AC10.
- Web_Service_Security: "Schema validation enforces constraints and syntax defined by the schema." — the constraints mirror the schemas' bounds — AC3, AC4.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 A foreign avatar or logo address is refused on the direct path; the upload route still writes — test:
  `src/modules/admin/actions/userProfileFields.integration.test.ts` (extended: a session update of `avatar_url` or
  `company_logo_url` to `https://example.com/x.png` answers `23514`; `uploadAvatar.integration.test.ts` stays green).
- AC2 A Google sign-up with a picture, a 150-character name and a short phone still creates its profile — test:
  `src/tests/integration/signUpTrigger.integration.test.ts` (new: the row stores `avatar_url` null, a 100-character
  name, `phone` null; a Cloudinary avatar is kept).
- AC3 The per-currency ceiling holds — test: `src/modules/listings/actions/updateListing.integration.test.ts`
  (extended: a direct session update to EUR 10 000 000 001 or ALL 1 000 000 000 001 answers `23514`; the ceilings pass)
  and `src/modules/listings/validations/__tests__/priceCeiling.test.ts` (new: the SQL numbers equal
  `MAX_LISTING_PRICE_BY_CURRENCY`).
- AC4 An inactive property type or currency is refused on the direct path — test:
  `src/modules/listings/actions/updateListing.integration.test.ts` (extended).
- AC5 An owner cannot change the photos of an active listing directly; the application edit still moderates — test:
  `src/modules/listings/actions/updateListing.integration.test.ts` (extended: insert, update and delete of an image of
  an active listing answer `42501`; `updateListing` moves it to `pending` and writes the images).
- AC6 `exchange_providers` is gone — test: `node scripts/quality/db-catalog-audit.mjs` (I13) and
  `src/modules/admin/actions/__tests__/exchangeProvidersRemoved.security.test.ts` (unchanged, still green).
- AC7 The audit knows each promise — test: `scripts/quality/db-catalog-audit.test.mjs` (extended: I10-I14 each fail on
  a planted catalog without the object and pass with it); after the apply `node scripts/quality/db-catalog-audit.mjs`
  exits 0.
- AC8 Every "hardening v8b" sentence in `src/` names a live object — test:
  `src/__tests__/security/hardeningClaims.test.ts` (new: each sentence names a constraint, trigger or function that is
  present in `supabase/catalog.json`; a planted sentence naming a missing object fails).
- AC9 Rollback restores the previous catalog — test:
  `node scripts/quality/db-sql-roundtrip.mjs supabase/sql_migrations/task962/v8b2.sql supabase/sql_migrations/task962/v8b2-rollback.sql`
  exits 0 (run by Opus before the apply, D91).
- AC10 `npm run lint`, `npm run typecheck`, `npm test -- --coverage`, `node scripts/quality/check-files.mjs --worktree`,
  `node --test "scripts/quality/*.test.mjs"` and
  `node scripts/quality/ac-tests.mjs --base main tasks/Sprints/Sprint_93_kickoff_prompt_Task_962_Hardening_V8b_Promises_The_Code_Relies_On.md`
  exit 0.

## Route

1. After Task 956 is merged and applied: branch from `main`; `node scripts/quality/db-catalog-audit.mjs --save
   <scratch>/before.json`.
2. Tests first (AC1-AC8) against the live project with `SECURITY_TEST_PROJECT_REF`; save each failing output.
3. Write the four SQL files, the trigger change, the audit invariants and the claims test; list every session write
   to `listing_images`.
4. Run `v8b2-preflight.sql` read-only; report every count and the two rows' values. Hand over to Opus; Opus proves the
   preflight and the rollback (LF and CRLF, md5) and gives the owner the apply step.
5. After the owner's apply: `v8b2-verify.sql`, AC1-AC10, `--save supabase/catalog.json`.
6. Report: each command, exit code and relevant output; each failing-first run; one deliberate break per AC.

## Review
