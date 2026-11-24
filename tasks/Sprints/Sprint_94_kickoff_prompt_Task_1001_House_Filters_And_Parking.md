# Task 1001 — Houses get the apartment filters, the layout filter gets its column, and a parking attribute with its filter

Sprint 94. Priority P2. Owner decisions (owner list 2026-11-19, translated): item 16 "Private houses need the same
filters as apartments."; item 17 "Add 'parking' to the filters with the options 'private parking', 'street parking',
'no parking'."; O1001-1 (2026-11-19, translated): "I agree. But all current property types must be checked, because
it seems that somewhere there is parking and somewhere it is missing, although it should be there." Plan file:
`tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`. Implementer: Sonnet. Reviewer: Opus.
Human owner of the change: the owner.

## Goal

After the task: the house filters are the apartment filters except the apartment's own floor; the "Layout" filter finds
listings because the column it reads exists and the form fills it for apartments and houses; every listing of the types
O1001-1 names can state its parking (private, street, none), shown on its page and filtered; a failed search shows an
error, never "no results".

## Cause

Read at `dc5e3af66`
- House filters lack `layout_features`: apartment `src/modules/listings/domain/propertyTypeSchema.ts:192-196`, house `:209-213`. `floor` is missing too, and rightly: the house form has no floor field (`:203-207`, `building_floors` instead).
- The layout filter queries a column that does not exist: `filterEngine.ts:332` `q.contains('layout_features', …)`; read-only 2026-11-19 `node filter-cols.mjs <every filtered column>` → `layout_features MISSING (42703)`, the other 17 exist; no form writes it (`propertyTypeSchema.ts:127-130`, `componentType: 'filter-only'`). Measured on production 2026-11-19, `node layout-filter-prod.mjs` → `property_type=apartment … cards 22`, `property_type=apartment&layout_features=studio … cards 0`.
- The failure looks like an empty result: the listings page logs the query error and renders `listings ?? []` (`src/app/[locale]/listings/page.tsx:76-78`, `:88-89`).
- Parking does not exist: `grep -rni parking src` → only the property type `parking` (`src/modules/listings/constants/index.ts:9`) and floor comments; the `amenities` table is empty and read by no code (plan file, read-only 2026-11-19).
- Live data, read-only: `listings by type {"apartment":32,"house":7,"office":7,"garage":1,"room":1}`.
- Every type checked for O1001-1, read-only 2026-11-19: the ten types of `PROPERTY_TYPE_SCHEMA` (`src/modules/listings/domain/propertyTypeSchema.ts:313-324`) equal the ten active production `property_types` rows, and none has a parking field or filter; parking appears only in owners' free text (`node ptypes.mjs` → descriptions naming parking or a garage: house 2, apartment 3, garage 1).

Fix: add the two columns (SQL), make layout a form field for apartments and houses and add it to the house filters, add parking as a form field, detail line and filter, and show an error state when the search query fails.

## Scope

- `supabase/sql_migrations/task1001/` (owner-applied; preflight, apply, rollback, read-only checks; LF and CRLF proven by Opus): `listings.layout_features text[] not null default '{}'` with `check (layout_features <@ array['studio','free_layout','duplex','penthouse','small_family'])`, and `listings.parking text null` with `check (parking in ('private','street','none'))`. The protected-columns guard and the moderation trigger need no change: the trigger compares the whole row, so new columns are content (`supabase/sql_migrations/task956/v8b.sql:224-225`).
- `propertyTypeSchema.ts` and `listingFields.ts`: `layout_features` becomes a `multi-toggle` form field, visible for apartment and house, with a detail presentation; the house filters gain `layout_features`; a new field `parking` (`button-group`, filter `eq`, detail presentation) visible and filtered for the types of O1001-1; `PARKING_OPTIONS` in `src/modules/listings/constants/index.ts`.
- `filterEngine.ts` parses `parking` against the three values and applies `eq`; `savedSearchCanonicalize` keeps it; `src/modules/listings/validations/index.ts` accepts `layout_features` (distinct values of the five, at most five) and `parking` (the three or empty); the create and update actions store both through the validated object only.
- `src/app/[locale]/listings/page.tsx`: a failed query renders `MantineEmptyLoadingErrorState state="error"` with a retry link, not the list.
- Messages in four locales (`listing.parking_*`, the field and filter labels).
- Parking types (O1001-1): apartment, house, room, commercial, office, warehouse and other get the `parking` form field, detail line and filter; garage, parking and land do not (they are the parking themselves or have none). The test names all ten types, so a type added later needs its own decision.
- Split of Task 957 (owner, 2026-11-22, translated: "split the task into several subtasks"; option A): Task 957 already builds a parking field (O1001-2: `supabase/sql_migrations/task957/task957-parking.sql`, `src/modules/listings/components/form/ParkingField.tsx`), which reaches `main` with its pull request; this task starts after that merge and builds only what Task 957 does not. Moved here from the Task 957 kickoff (Revision 4):
  Parking and garage per property type (O957-14; O957-15, owner 2026-11-21, translated: "land shows no Garage and no Parking option at all; the type Garage shows only the choice of the garage kind (underground, above ground …); the type Parking shows a dropdown of parking kinds and the floor when needed"; the garage kinds "underground, above ground standalone, built into the house" confirmed; in the other types the garage option is "a choice of the garage kind"; it supersedes O1001-1 of 2026-11-19 and the "every type but land" of Revision 3): today the parking field shows in every type but land, the type Garage included (`src/modules/listings/domain/propertyTypeSchema.ts`, `SCHEMA_GARAGE`, `SCHEMA_PARKING`), no garage kind exists, and the database enum `property_type` has `garage` but no `parking` (`supabase/catalog.json`, column `listings.property_type`), so a listing of the offered type Parking is refused on save (Task 979's cause). Fix: `task957-parking.sql` (with its rollback and verify) also adds `parking` to `property_type` and a nullable `listings.garage_type` (enum `garage_type`: `underground`, `above_ground`, `built_in`) with its grants; a CHECK refuses on land any parking or garage value, on the type Garage a parking kind or floor, on the type Parking a garage kind. The form: land none; Garage the garage kind only; Parking the parking kind and, for underground, the floor; every other type the parking kind (with the floor) and the garage kind. The parking kind and the garage kind are each one dropdown (`MantineSelect`) in every type where they show (one element, one look; owner 2026-11-21, translated: "I agree with the dropdown"). The server schema and `validateListingForm` hold the same rules; a type change clears what the new type does not show. The listing page shows both among the building attributes, as `heating` (`propertyTypeSchema.ts:112-116`: `presentation` with `showInAttrs`), and the listings filter offers both (`filter` `eq`). Opus: `db-sql-roundtrip.mjs` on `task957-parking.sql` and its rollback, and the catalog after the owner's apply.

## Attack surface

Changed: two new owner-writable listing columns and a new query parameter.
1. **What are we working on?** `listings.layout_features`, `listings.parking` (written by a listing's owner through
   the create and update actions); `?parking=` and `?layout_features=` read by the search, the API route and the
   saved-search job.
2. **What can go wrong?**
   - T1 T: a value outside the lists is stored → mitigate: the validation schema and the database CHECKs → AC1, AC4.
   - T2 T (mass assignment): other columns ride along → mitigate: the actions store the validated object only → AC4.
   - T3 D/I: a bad parameter breaks or widens a search → mitigate: the engine keeps only known values → AC3.
3. Each mitigation is an acceptance criterion with a test that fails when the control is removed.
4. Authorization matrix: unchanged rows; the existing owner-edit and moderation rows cover the new columns (`SEC-1001-ATTR-CHECK`: a value outside the list is refused by the database for an owner session).

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-19).

- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the two columns and the new parameter — AC1, AC3.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — the new columns are written only through the existing owner checks of the create and update actions — AC4.
- Authorization_Decisions_And_Output_Handling: not applicable — no decision point changes; the moderation trigger already covers new columns.
- Authorization_Patterns: not applicable — row security and the owner checks of listings are unchanged.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — the owner-session case runs on the real database in the `authz` job — AC1.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — `SEC-1001-ATTR-CHECK` is an integration case — AC1.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — values render as message-key labels through React — AC2, AC5.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — query parameters only select from fixed lists — AC3.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — no grant changes; CHECK constraints bound the new values — AC1.
- GraphQL: not applicable — the project serves no GraphQL endpoint.
- Injection_Prevention: "The preferred option is to use a safe API which avoids the use of the interpreter entirely or provides a parameterized interface" — filters go through the client library's parameterized builders with allow-listed values — AC3.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — the validation schema checks both fields on the server and the database repeats it — AC1, AC4.
- JavaScript_and_TypeScript_Security: not applicable — fixed tables of options; no merge, path setter or new regular expression.
- Mass_Assignment: "Do not rely on a block-list as the sole protection: a new or overlooked sensitive field remains bindable." — the actions store the validated object, an allow-list of fields — AC4.
- Multi_Tenant_Security: not applicable — listing ownership rules are unchanged; the columns add no tenant path.
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — the create and update actions are tested by direct call with extra and invalid fields — AC4.
- Prototype_Pollution_Prevention: not applicable — no object is built from client keys; the schema picks named fields.
- Query_Parameterization: "SQL Injection is best prevented through the use of" — the search binds values through the client library's builders, never string concatenation — AC3.
- React_Security: "Where possible, render untrusted content as text using JSX expressions." — values render as message-key labels through React — AC2, AC5.
- REST_Security: "Achieve an implicit input validation by using strong types like numbers, booleans, dates, times or fixed data ranges in API parameters." — the API route reads `parking` and `layout_features` only from fixed value lists — AC3.
- SQL_Injection_Prevention: not applicable — the SQL is a fixed schema change; no statement is built from input.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — reviewed with the review-task skill on this task's diff — AC7.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC7.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threat model's mitigations are AC1, AC3 and AC4.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — answered in "## Attack surface" — AC1, AC3, AC4.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results and Opus proves the SQL — AC7.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — no HTML sink is added — AC5.
- Web_Service_Security: not applicable — the API route's contract and protection are unchanged; it gains one allow-listed parameter.

## UI

GR-0 queries: "filter chips", "button group field", "search error state". Inspected: `FiltersPanel` with
`MantineFilterSection` and `FilterChoiceGroup`, the form's `multi-toggle` and `button-group` field kinds,
`MantineEmptyLoadingErrorState`. Decision: REUSE all of them; no new component. Reference research (GR-7): inherited
canonical design — owner decision 2026-10-20 (`MantineFilterSection`, `MantineEmptyLoadingErrorState`).

## Mobile adaptation record
- Scope: visible
- Surfaces: src/components/shared/FiltersPanel.tsx — the layout and parking filter sections; src/app/[locale]/listings/page.tsx — the error state of a failed search
- Component families: form-picker-and-choice, structural-layout-and-feedback
- Pattern IDs: form-stack, inline-control, linear-flow
- Standards: w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure, w3c-target-size, apple-hig-menus, android-layout-navigation, w3c-meaningful-sequence, android-adapt-layouts, android-layout-basics
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineFilterSection.tsx, src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): filter sections stacked in the panel, choices wrap; 640px transition unchanged
- Mobile order: filters — … → layout → parking → offer; error state — title → text → retry
- Required-content treatment: choice labels wrap inside their chips; the error text wraps at full width
- Story and verification: the filter panel and EmptyLoadingErrorState Stories at 320px, 639px and 640px × sq, en, uk, it

## Acceptance criteria

- AC1 The columns exist and hold only allowed values — test: `src/tests/integration/listingAttributes.integration.test.ts` (new, CI `authz` job): an owner session stores layout and parking on its pending listing; `SEC-1001-ATTR-CHECK`: an unknown layout or parking value is refused by the database; a `contains` search finds the listing; and the read-only checks of `supabase/sql_migrations/task1001/` plus `node scripts/quality/db-catalog-audit.mjs` report no new violation.
- AC2 Houses filter like apartments — test: `src/modules/listings/domain/__tests__/listingDomain.test.ts` (extended): the house filters equal the apartment filters without `floor`; `layout_features` is a visible form field for apartment and house; `parking` is visible and filtered for the seven O1001-1 types and absent for garage, parking and land; the test names every key of `PROPERTY_TYPE_SCHEMA`.
- AC3 The engine applies parking and layout safely — test: `src/modules/listings/domain/filterEngine.test.ts` and `filterEngine.security.test.ts` (extended): `parking=private` → `eq('parking','private')`; an unknown value is dropped; layout on houses → `contains`; saved searches keep both.
- AC4 Only valid values are stored — test: `src/modules/listings/validations/__tests__/listingAttributes.test.ts` (new): the five layouts and three parking values pass, others and duplicates fail; and the create and update action tests (extended) store both from the validated object and no other field.
- AC5 A failed search says so — test: `src/app/[locale]/listings/__tests__/listingsPageError.test.tsx` (new): a query error renders the error state with a retry link and no "no results" text.
- AC6 Stories, texts and widths hold — test: `node scripts/check-mobile-adaptation-contract.mjs`, `node scripts/check-i18n-parity.mjs`, `node scripts/quality/locale-safety.mjs` and the census for the changed Stories.
- AC7 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).
- AC8 The parking and the garage follow the property type and are shown and filtered (Review 4, O957-14, O957-15) — test: `src/modules/listings/validations/__tests__/listingParking.test.ts` and `validateListingForm.test.ts` (extended): land refuses any parking or garage value, Garage refuses a parking kind or floor, Parking refuses a garage kind, the other types take both, a floor only with an underground parking; `ListingFormShell.parking.test.tsx` (extended): each type shows exactly its fields as dropdowns and a type change clears the rest; `task957-parking-verify.sql` (extended) checks `parking` in `property_type`, the `garage_type` enum and the CHECK; a `propertyTypeSchema` test (extended): `parking` and the garage kind have `presentation` with `showInAttrs` and a `filter`; the listing page attribute test and the filter test of the listings page (extended) show and apply the kind; the Story `Patterns/Mantine/ListingDetailView` passes a parking; Opus: `node scripts/quality/db-sql-roundtrip.mjs supabase/sql_migrations/task957/task957-parking.sql supabase/sql_migrations/task957/task957-parking-rollback.sql` exits 0 and, after the owner's apply, `db-catalog-audit.mjs` reports no invariant and `supabase/catalog.json` is refreshed.

## Route

1. Branch from `main`. Read `propertyTypeSchema.ts`, `listingFields.ts`, `filterEngine.ts`, `validations/index.ts`, the create and update actions, `FiltersPanel.tsx`, the listings page, `v8b.sql:211-236`.
2. Tests first (AC1-AC5); save each failing output.
3. The SQL set, the schema and fields, the engine, the validation, the page error state, the messages. One pass over every changed file (checklist I7).
4. Run: the task tests · CI on GitHub only (`gh pr checks <n>`, checklist A5); deliberate break: the CHECK dropped in a scratch copy of the SQL → AC1 fails.
5. Report: each command, exit code, relevant output. Opus proves the SQL on the owner's delivery path; after the apply and the merge Opus reruns `filter-cols.mjs` and `layout-filter-prod.mjs`.

## Review
