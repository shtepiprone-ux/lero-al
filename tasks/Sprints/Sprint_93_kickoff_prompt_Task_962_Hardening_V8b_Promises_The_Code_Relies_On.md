# Task 962 — Hardening v8b, part 2: every database rule the code already relies on exists

Sprint 93. Priority P0. Owner decisions: 2026-11-06 "all holes found must be fixed"; D71 (price ceilings EUR 10 000 000 000
and ALL 1 000 000 000 000); D53 / R84 (an owner's edit of an active listing is published only after staff approve it);
R78 (a) (the exchange-providers table goes); D91 (tests may run on the one project, one break at a time, restored);
O962-1 (2026-11-23, to the question which avatar addresses the database allows, translated: "Cloudinary + Google"): the
project's Cloudinary and Google's picture host, so a Google sign-up keeps its picture as on `main`; O962-2 (2026-11-23,
user #37's company logo that is not an https address, translated: "Clear"). Split from Task 956 (finding SQL-01 of
`docs/security/audit-2026-11-06/findings.md`); rewritten 2026-11-23 to the checklists after Task 957 merged.
Implementer: Sonnet (the SQL files and the tests; never applies SQL). Reviewer: Opus (runs the preflight and proves the
rollback read-only before the apply, H4). The owner applies the SQL. Human owner of the change: the owner.

## Goal

The code says the database keeps five rules that it does not keep (read 2026-11-23, live catalog):
- the avatar and company-logo addresses are on the project's Cloudinary (`src/app/api/upload-avatar/route.ts:128`); the
  sign-up trigger `public.handle_new_user` stores any `https://` avatar address from sign-up metadata, which anyone can
  send to Supabase Auth directly, and the header renders it (`src/components/layout/UserMenu.tsx:50`);
- the per-currency price ceiling (`src/modules/listings/validations/index.ts:5-9`); a session may write `listings`;
- a listing's property type and currency are active catalogue rows (`src/modules/listings/actions/createListing.ts:17-20`);
- `exchange_providers` is dropped (`src/modules/admin/actions/__tests__/exchangeProvidersRemoved.security.test.ts:6`); it
  still holds 2 rows (no `api_key` value in either);
- an owner's session cannot change the photos of an active listing (R84 (b)); `listing_images` grants `authenticated`
  INSERT, UPDATE, DELETE under the policy "Users can manage own listing images", so an owner swaps the photos of an
  approved listing without moderation.
After the task each rule holds on the direct PostgREST path, the sign-up path still works, and the application paths
(`createListing`, `updateListing`, `deleteListing`, the avatar and logo uploads) behave as on `main`.

## Cause

`node scripts/quality/db-catalog-audit.mjs --save <scratch>/live.json` (2026-11-23) → exit 0; the snapshot holds no CHECK
on `users.avatar_url` or `users.company_logo_url`, no price-ceiling CHECK on `listings` (only
`listings_price_positive_check`, `listings_price_old_positive_check`), no catalogue trigger on `listings`, the table
`exchange_providers`, and on `listing_images` only the trigger `listing_images_owner_folder` (Task 957).
Task 956 left these rules to this task: `supabase/sql_migrations/task956/v8b.sql:196-198` ("public.handle_new_user() (the
sign-up trigger, Task 962)"), and the part-2 migration was never written: `ls supabase/sql_migrations/task962` → "No
such file or directory".
Fix: one migration `supabase/sql_migrations/task962/v8b2.sql` (one transaction) that creates the five rules and changes the
sign-up trigger's avatar line, with its rollback and a read-only preflight; no application code changes.

## Scope

- `supabase/sql_migrations/task962/v8b2.sql` (new), one `begin; … commit;`, every object schema-qualified:
  1. `update public.users set company_logo_url = null where public_id = 37 and company_logo_url !~ '^https://'` (O962-2);
  2. `users_avatar_url_prefix_check`: `avatar_url is null or starts_with(avatar_url, 'https://res.cloudinary.com/die7okukn/')
     or starts_with(avatar_url, 'https://lh3.googleusercontent.com/')` (O962-1);
  3. `users_company_logo_url_prefix_check`: `company_logo_url is null or starts_with(company_logo_url,
     'https://res.cloudinary.com/die7okukn/')`;
  4. `create or replace function public.handle_new_user()`: the live body (read with `pg_get_functiondef`, quoted in the
     report) with one change: `v_avatar` is kept only when it starts with one of the two prefixes of item 2, else null;
     `security definer`, `search_path` and every other line unchanged;
  5. `listings_price_ceiling_check`: `(currency = 'EUR' and price <= 10000000000 and (price_old is null or price_old <=
     10000000000)) or (currency = 'ALL' and price <= 1000000000000 and (price_old is null or price_old <= 1000000000000))`;
  6. `public.listings_catalogue_active()` (`set search_path = ''`, invoker) and its trigger `listings_catalogue_active`
     BEFORE INSERT OR UPDATE OF `property_type`, `currency` ON `public.listings`: when `public.property_types` has an
     active row and `new.property_type::text` is not an active `slug`, raise `23514`; the same for `public.currencies`
     `code` and `new.currency::text` (the rule of `catalogueRefusal`, `createListing.ts:23-41`);
  7. `public.listing_images_owner_edit_moderation()` (`set search_path = ''`) and its trigger
     `listing_images_owner_edit_moderation` BEFORE INSERT OR UPDATE OR DELETE ON `public.listing_images`, the guard of
     `public.listings_owner_edit_moderation` (`v8b.sql:215-236`): only when `current_user` is `authenticated` or `anon`,
     `auth.uid()` is the listing's `user_id`, and not `public.caller_has_permission('listings.moderate')`; the listing of
     `new` (insert, update) and of `old` (update, delete) is read; status `active` → raise `42501`; a listing that no
     longer exists (the cascade of a delete) passes; returns `old` for DELETE, `new` otherwise;
  8. `drop table public.exchange_providers`.
- `supabase/sql_migrations/task962/v8b2-rollback.sql` (new): drops 2, 3, 5, 6, 7 and restores the live `handle_new_user`
  body exactly; recreates `exchange_providers` with its 11 columns, defaults, RLS on and the grants read live (rows are
  not restored: neither holds a key); the cleared logo of item 1 is not restored (O962-2).
- `supabase/sql_migrations/task962/v8b2-preflight.sql` (new, read-only, `begin transaction read only; … rollback;`): the
  count and `public_id` of the rows items 2 and 3 would refuse after item 1, the listings items 5 and 6 would refuse, and
  the `id`, `name` and key presence (`api_key is not null and api_key <> ''`) of `exchange_providers`; never a key value.
- `src/tests/integration/fixtures.ts`: `makeUser` takes optional `metadata` merged into `user_metadata` (AC2 needs it).
- Tests: the files of AC1-AC6.
- Dependencies: none.
- Out of scope: the `name` and `phone` lines of `handle_new_user` (the CHECKs of Task 956 accept what it writes: `name`
  ≤ 200; a non-E.164 `phone` fails only a sign-up whose metadata bypassed `cleanSignupMetadata`); the hand-run
  `scripts/check-schema-drift.mjs` and `scripts/schema-drift-check.sql` that still list `exchange_providers` (Task 978
  removes them); `db-catalog-audit.mjs` invariants (the integration suite on the real database proves each rule).
- Kept as on `main` (checklist A2): `createListing` inserts its images while the listing is `pending`; `updateListing`
  moves an owner's active listing to `pending` before it writes the images (`updateListing.ts:116-122`, `:164`, `:177`);
  `deleteListing` and staff write with the service role (`deleteListing.ts:42-56`, `updateListing.ts:105`); a Google
  sign-up stores its picture (O962-1); every other sign-up field as today. Changed with a decision: user #37's logo is
  cleared (O962-2).

## Attack surface

Changed: the data layer every direct PostgREST call meets, and the sign-up trigger (an attack-surface change: business
invariants, ownership rules). Actors: anon, a signed-in owner, a moderator, an admin, Supabase Auth (the trigger).
- T1 Tampering (I): a person sends `avatar_url` of a foreign host in sign-up metadata; every visitor's browser loads it
  in the header → mitigate: the trigger keeps only the two allowed prefixes, the CHECK refuses any other writer → AC1, AC2.
- T2 Tampering: an owner's session inserts or updates a listing with a price past its ceiling or a switched-off type or
  currency → mitigate: CHECK and trigger on `listings` → AC3, AC4.
- T3 Tampering / Elevation: an owner's session swaps, adds or deletes the photos of an approved listing → mitigate: the
  `listing_images` trigger (42501) → AC5.
- T4 Information disclosure: a table built to hold third-party keys stays → eliminate: drop it → AC6.
- T5 Denial of service: a rule refuses a legitimate write (a Google sign-up, an owner's edit, a delete's cascade) →
  mitigate: the preflight before the apply, the ALLOW cases of AC1-AC5.
Authorization matrix rows: `users.avatar_url` and `company_logo_url` (service role, trigger); `listings` price and
catalogue (owner session, service role); `listing_images` on an active and a pending listing (owner session, moderator
session with `listings.moderate`, service role).

## OWASP

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — T1-T5 name the direct-API abuses each rule closes — AC1, AC3, AC4, AC5.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — the direct PostgREST path and the sign-up trigger are the changed surface, each with its cases — AC1-AC6.
- Authentication: not applicable — no credential, password or sign-in rule changes; the sign-up trigger only bounds the stored avatar address.
- Authentication_Patterns: not applicable — authentication stays with Supabase Auth; the trigger runs after it and decides nothing about identity.
- Authorization: "Implement defense in depth. Do not depend on any single framework, library, technology, or control to be the sole thing enforcing proper access control." — the database enforces what the Server Actions already check — AC1, AC3, AC4, AC5.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — each trigger raises and the write stops; nothing is written on a refusal — AC4, AC5.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — the rules live on the tables they protect — AC1, AC5.
- Authorization_Policy_And_Data_Distribution: not applicable — the trigger reads the permission live through `caller_has_permission` on every write; nothing is cached or distributed.
- Authorization_Regression_Testing: "Relying on UI hiding is insufficient; the API layer must enforce the check" — each case is a direct session call against the real database — AC1, AC3, AC4, AC5.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — the matrix rows of this task are integration cases — AC1, AC5.
- Bot_Management_and_Anti-Automation: not applicable — no endpoint, limit or automation path changes in this task.
- Business_Logic_Security: "Always re-derive security-relevant values (prices, permissions, ownership) on the server. Client state is input, not truth." — the price ceiling and the active catalogue values hold in the database too — AC3, AC4.
- Cookie_Theft_Mitigation: not applicable — no cookie or session handling changes in this task.
- Credential_Stuffing_Prevention: not applicable — no sign-in or credential path changes in this task.
- Cross_Site_Scripting_Prevention: not applicable — the avatar address is rendered as an image source by Mantine `Avatar`, never as markup; this task bounds its host only.
- DOM_based_XSS_Prevention: not applicable — no client code changes; the stored address only reaches an image source attribute.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — the table built for third-party keys is dropped; the new triggers set an empty search_path — AC6.
- Denial_of_Service: "Using validation that is cheap in resources first" — a CHECK refuses before any trigger work; the sign-up trigger clears a foreign avatar instead of failing the sign-up — AC2, AC3.
- File_Upload: not applicable — the upload routes are unchanged; only the stored address of an upload is bounded in the database.
- GraphQL: not applicable — the project exposes no GraphQL endpoint; the path trigger matched the SQL folder.
- HTTP_Strict_Transport_Security: not applicable — no header changes; "https" appears only in the stored address prefixes.
- Identity_Propagation_Patterns: "Each receiving service must still authorize the requested action and resource." — the database authorizes each write itself instead of trusting the caller — AC1, AC5.
- Injection_Prevention: not applicable — the SQL is static DDL with no value built from input; the triggers compare columns to constants.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — the database checks the same bounds as the schemas — AC1, AC3, AC4.
- Insecure_Direct_Object_Reference_Prevention: "This verification should be performed for all operations involving object references, including read, create, update, delete, export, and administrative actions." — the image trigger covers insert, update and delete — AC5.
- JavaScript_and_TypeScript_Security: not applicable — no runtime TypeScript changes; only tests and a fixture parameter change.
- Mass_Assignment: "Do not rely on a block-list as the sole protection: a new or overlooked sensitive field remains bindable." — the avatar and logo columns are bound by an allow-listed prefix, not by the form alone — AC1.
- Multi_Tenant_Security: "Apply object-level access control checks according to the OWASP Insecure Direct Object Reference Prevention Cheat Sheet." — the image trigger checks the listing's owner and status on every write — AC5.
- Multifactor_Authentication: not applicable — no authentication factor changes (Task 960 owns MFA).
- Nextjs_Security: not applicable — no Server Action or route changes its inputs or outputs; the database adds the second check.
- Nodejs_Security: not applicable — no Node runtime code changes in this task; tests only.
- OS_Command_Injection_Defense: not applicable — no process is started; the schema-drift script is only named as out of scope.
- Prototype_Pollution_Prevention: not applicable — no object merge or JSON binding changes in this task.
- Query_Parameterization: not applicable — no query is built from input; the migration is static DDL.
- REST_Security: not applicable — no REST endpoint changes; PostgREST is held by the table rules.
- SQL_Injection_Prevention: not applicable — static DDL only; the triggers read typed columns, no dynamic SQL.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — Opus reviews the three SQL files and the trigger diff, then proves the rollback — AC7.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the code's "hardening v8b" sentences were checked against the live catalog, not trusted — AC1-AC6.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — T1-T5 became AC1-AC6.
- Serverless_FaaS_Security: not applicable — no function trigger changes; the upload route only appears as the writer that keeps working.
- Session_Management: not applicable — no session is created, renewed or ended by this task.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — the attack surface section names each threat with its mitigation and test — AC1-AC6.
- Transport_Layer_Security: not applicable — no transport change; the prefixes only fix which HTTPS hosts an address may name.
- User_Privacy_Protection: not applicable — no personal data is added or kept longer; a foreign avatar address is cleared, not stored.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — Opus reruns the preflight, the rollback and every AC, not the executor's report — AC7, AC8.
- Web_Frontend_Security: not applicable — no frontend code changes; the header keeps rendering the stored address as an image.
- Web_Service_Security: "Schema validation enforces constraints and syntax defined by the schema." — the constraints mirror the schemas' bounds — AC3, AC4.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 A foreign avatar or logo address is refused on the direct path; the allowed ones are stored — test:
  `src/modules/admin/actions/userProfileFields.integration.test.ts` (extended, `[SEC-962-USER-IMAGE-PREFIX-DENY]`: a
  service-role update of `avatar_url` or `company_logo_url` to `https://example.com/x.png`, and of `company_logo_url` to a
  `https://lh3.googleusercontent.com/` address, answers `23514`, the row unchanged; `[SEC-962-USER-IMAGE-PREFIX-ALLOW]`: a
  Cloudinary address in both columns and a Google address in `avatar_url` are stored).
- AC2 The sign-up trigger keeps only an allowed avatar and still creates the profile — test:
  `src/tests/integration/signUpTrigger.integration.test.ts` (new, `[SEC-962-SIGNUP-AVATAR-DENY]`: metadata
  `avatar_url` `https://example.com/a.png` → the row exists with `avatar_url` null; `[SEC-962-SIGNUP-AVATAR-ALLOW]`: a
  `https://lh3.googleusercontent.com/` and a Cloudinary address are stored as sent).
- AC3 The per-currency ceiling holds on the direct path — test:
  `src/modules/listings/actions/updateListing.integration.test.ts` (extended, `[SEC-962-PRICE-CEILING-DENY]`: the owner's
  session updates its `pending` listing to EUR 10000000001 or ALL 1000000000001 → `23514`; `-ALLOW`: EUR 10000000000 and
  ALL 1000000000000 are stored) and `src/tests/__tests__/v8b2Sql.test.ts` (new: the two numbers in `v8b2.sql` equal
  `MAX_LISTING_PRICE_BY_CURRENCY`).
- AC4 A switched-off property type or currency is refused on the direct path — test:
  `src/modules/listings/actions/updateListing.integration.test.ts` (extended, `[SEC-962-CATALOGUE-DENY]`: with `room`
  switched off by the service role (restored in `finally`, D91) the owner's session inserts or updates a listing to `room`
  → `23514`; the same for currency `EUR`; `-ALLOW`: active values are stored).
- AC5 An owner's session cannot change the photos of an active listing; the application edit, staff and a pending
  listing are not held — test: `src/modules/listings/actions/updateListing.integration.test.ts` (extended,
  `[SEC-962-ACTIVE-PHOTOS-DENY]`: insert, update and delete of a `listing_images` row of the owner's active listing →
  `42501`, the gallery unchanged; `-ALLOW`: the same writes on a `pending` listing, a moderator session with
  `listings.moderate` on the active one, `updateListing` saving new photos of an active listing (now `pending`), and
  `deleteListing` of an active listing with photos).
- AC6 `exchange_providers` is gone — test: `src/tests/integration/accessHardening.integration.test.ts` (extended,
  `[SEC-962-EXCHANGE-PROVIDERS-GONE]`: a service-role select answers the missing-table error `PGRST205`) and
  `src/modules/admin/actions/__tests__/exchangeProvidersRemoved.security.test.ts` (unchanged, green).
- AC7 The rollback restores the previous catalog — test (Opus, before the apply, D91):
  `node scripts/quality/db-sql-roundtrip.mjs supabase/sql_migrations/task962/v8b2.sql supabase/sql_migrations/task962/v8b2-rollback.sql` exits 0.
- AC8 CI — test: `gh pr checks <n>`: every check passes, "Authorization regression" among them.

## Route

1. Sonnet (checklist I): read this kickoff, the Scope files and their `main` versions; read the live bodies of
   `public.handle_new_user` and `public.listings_owner_edit_moderation` read-only (`pg_get_functiondef` inside `begin
   transaction read only`) and the `exchange_providers` columns, defaults and grants.
2. Write the AC1-AC6 tests; run each new or extended test file and keep its failing output (the rules are not applied):
   `npm test -- src/tests/__tests__/v8b2Sql.test.ts`;
   `npm run test:security-integration -- <file>` for each of `userProfileFields.integration.test.ts`,
   `signUpTrigger.integration.test.ts`, `updateListing.integration.test.ts`, `accessHardening.integration.test.ts`.
3. Write the three SQL files; run `npm test -- src/tests/__tests__/v8b2Sql.test.ts` and
   `npm test -- src/modules/admin/actions/__tests__/exchangeProvidersRemoved.security.test.ts`. Never apply SQL.
4. Report (checklist I12); the integration files pass only after the apply.
5. Opus: review (V); runs `v8b2-preflight.sql` read-only and AC7 (LF and CRLF, md5, H4); the owner applies `v8b2.sql`;
   Opus runs the four integration files of step 2, then `node scripts/quality/db-catalog-audit.mjs --save
   supabase/catalog.json`. CI runs only on GitHub after the owner's push and is read with `gh pr checks <n>` (A5).

## Review
