# Task 999 — The premium period and its end date in the admin listings table and the premium tab

Sprint 94. Priority P2. Owner decision: owner list item 31 (2026-11-19, translated): "In the admin, in the listings table
on the 'Listings' page, show under the listing title the chosen period and the end date of a premium listing, if the
listing has 'Premium' status. On the 'Premium listings' tab the period and the end date must be separate columns of the
table." Plan file: `tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`. Implementer: Sonnet. Reviewer: Opus. Human
owner of the change: the owner.

## Goal

After the task: every premium grant is recorded on the server with its period (1, 3, 6 or 12 months, or a chosen date),
its end and the staff member who gave it; the admin listings table shows "Premium · <period> · until <date>" under a
premium listing's title, and the premium tab has "Period" and "Ends" columns; the server, not the browser, computes the
end of a period.

## Cause

Read at `dc5e3af66`
- The period is never stored: the dialog turns 30, 90, 180 or 365 days into a date in the browser (`src/components/admin/PremiumDialog.tsx:27-32`, `:41-43`) and `setListingPremium` writes only `is_premium` and `premium_until` (`src/modules/admin/actions/index.ts:84-88`, `:112-114`).
- The table's listing cell shows a star, the title and the meta line only (`src/components/admin/AdminListingsView.tsx:145-152`), and the premium tab filters rows without other columns (`src/app/admin/listings/page.tsx:73`).
- Leftover found by the 998 design: `revalidatePath('/admin/badges')` (`src/modules/admin/actions/index.ts:127`; the one at `:224` goes with Task 998), a page deleted in `121401d77`.
- Read-only 2026-11-19, `node premium-count.mjs` → `premium rows 2 | with premium_until 2 | until in the past 2` (the badge's handling of a past end is Task 933's).

Fix: a staff-only record of each grant, written by the action that computes the end; the view reads the latest grant that matches the listing's end.

## Scope

- `supabase/sql_migrations/task999/` (owner-applied; preflight, apply, rollback, read-only checks; LF and CRLF proven by Opus): table `public.listing_premium_grants` (`id uuid default gen_random_uuid() primary key`, `listing_id uuid not null references public.listings(id) on delete cascade`, `period_days smallint null check (period_days in (30, 90, 180, 365))`, `premium_until timestamptz not null`, `granted_by uuid not null references public.users(id)`, `granted_at timestamptz not null default now()`), an index on `(listing_id, granted_at desc)`; row security on with no policy; `revoke all` from `anon` and `authenticated`. The `listings` guard and grants are not touched.
- `setListingPremium(listingId, isPremium, choice)`: `choice` is `{ periodDays: 30 | 90 | 180 | 365 }` or `{ until: string }` (the custom date, refused in the past as today) or `null` to remove; the server computes `now + periodDays` days; after the `listings` update it inserts the grant row with `granted_by` = the acting staff id; a failed grant insert is logged and returns `transient`. `PremiumDialog.tsx` sends the choice, not a date. `revalidatePath('/admin/badges')` is removed.
- `src/app/admin/listings/page.tsx`: reads the latest grant of each listing on the page (service client, one query by the page's ids); a grant counts only when its `premium_until` equals the listing's.
- `AdminListingsView.tsx`: under a premium title (table and card) a dimmed line `listing_premium_line` ("Premium · {period} · until {date}", or "until {date}" without a period, "ended {date}" for a past end); on the premium tab two columns, `col_premium_period` and `col_premium_until`, which stay out of the card's meta. Its Story `src/stories/patterns/mantine/AdminListingsView.stories.tsx` shows a period, a custom date, a past end and the premium tab.
- Messages in four locales under `admin.listings`.

## Attack surface

Changed: a new table and a changed staff action.
1. **What are we working on?** `listing_premium_grants` (service role only); `setListingPremium` (staff with
   `listings.set_premium`), now computing the end.
2. **What can go wrong?**
   - T1 I/T: a session reads or writes grant rows → mitigate: row security with no policy and no grant to session roles
     → AC1, `SEC-999-GRANTS-DENY`.
   - T2 T: the browser chooses any end for a period → eliminate: the server computes it from an allowed period → AC2.
   - T3 R: nobody knows who gave a premium → mitigate: `granted_by` from the acting staff member → AC2.
   - T4 E: a person without the permission grants premium → mitigate: `assertPermission` first, unchanged → AC2.
3. Each mitigation is an acceptance criterion with a test that fails when the control is removed.
4. Authorization matrix: rows `SEC-999-GRANTS-DENY` (anon and authenticated: select, insert, update, delete → refused)
   and `SEC-999-PREMIUM-DENY` (a user without `listings.set_premium` → `forbidden`, nothing written).

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-19).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — the threat model lists the abuse of a browser-chosen end and of session access to the grants — AC1, AC2.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the new table and the changed action — AC1.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — `assertPermission('listings.set_premium')` stays first in the action and `requireStaffPage` on the page — AC2.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — a permission check that throws answers `forbidden` and writes nothing — AC2.
- Authorization_Patterns: not applicable — the permission model is unchanged; the new table has no session access at all.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — `SEC-999-GRANTS-DENY` fails if a policy or grant opens the table — AC1.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — the matrix rows run on the real development project in the `authz` job — AC1.
- Business_Logic_Security: "Always re-derive security-relevant values (prices, permissions, ownership) on the server. Client state is input, not truth." — the end of a period is computed on the server from an allowed period — AC2.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the period and the dates render as React text — AC3.
- DOM_based_XSS_Prevention: not applicable — no value from the address or storage reaches a sink.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — row security on, no policy, all privileges revoked from session roles — AC1.
- GraphQL: not applicable — the project serves no GraphQL endpoint.
- Identity_Propagation_Patterns: "Each receiving service must still authorize the requested action and resource." — the service-role write follows the permission check and takes `granted_by` from the session, never from input — AC2.
- Insecure_Direct_Object_Reference_Prevention: not applicable — staff act on any listing by design; the permission check is the control.
- JavaScript_and_TypeScript_Security: not applicable — no merge, path setter or regular expression over input.
- Logging: "The following should usually not be recorded directly in the logs, but instead should be removed, masked, sanitized, hashed, or encrypted" — a failed grant insert logs the error code and the two ids only — AC2.
- Logging_Vocabulary: not applicable — the existing failure log line keeps its form; no new security event type.
- Mass_Assignment: "Do not rely on a block-list as the sole protection: a new or overlooked sensitive field remains bindable." — the grant row is built from the allowed period, the computed end and the session id only — AC2.
- Multi_Tenant_Security: not applicable — the table is staff-only and holds no tenant-scoped session path.
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — the action is tested by direct call with forged choices — AC2.
- Query_Parameterization: not applicable — the SQL is a fixed schema change with no dynamic statements.
- SQL_Injection_Prevention: not applicable — the SQL takes no input; the action writes through the client library.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — reviewed with the review-task skill on this task's diff — AC5.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC5.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threat model's mitigations are AC1 and AC2.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — answered in "## Attack surface" — AC1, AC2.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results and Opus proves the SQL — AC5.
- Web_Cache_Security: not applicable — removing a path from revalidation adds no cache; staff pages stay uncached.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — no HTML sink is added — AC3.

## UI

GR-0 queries: "admin table extra column", "meta line under title". Inspected: `AdminListingsView` with `AdminTable`
(columns, `visibility`, `cardRow`) and its Story, `PremiumDialogView`. Decision: EXTEND `AdminListingsView` (columns and
the meta line through the existing `AdminTable` API); REUSE `RelativeTime`/date formatting. Reference research (GR-7):
inherited canonical design — owner decision 2026-10-20 (`AdminTable`, one table anatomy GR-8).

## Mobile adaptation record
- Scope: visible
- Surfaces: src/components/admin/AdminListingsView.tsx — the premium line under the title and the premium tab's two columns
- Component families: record-list-and-data
- Pattern IDs: data-table-to-cards, key-value-stack
- Standards: w3c-reflow, w3c-meaningful-sequence, apple-hig-lists-tables, android-common-layouts, apple-hig-layout, android-content-structure
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineDataTableToCards.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm) and up to the table's card switch: record cards, the premium line in the card meta; 640px transition unchanged; from the switch the table with the two columns on the premium tab
- Mobile order: card — title → premium line → price and badges → meta
- Required-content treatment: the premium line wraps at full width; no truncation
- Story and verification: AdminListingsView Story at 320px, 639px, 640px and the card switch × sq, en, uk, it

## Acceptance criteria

- AC1 Sessions cannot reach the grants — test: `src/tests/integration/premiumGrants.integration.test.ts` (new, CI `authz` job): `SEC-999-GRANTS-DENY` for anon and authenticated on all four commands; and the read-only checks of `supabase/sql_migrations/task999/` plus `node scripts/quality/db-catalog-audit.mjs` report no new violation.
- AC2 The server computes and records the grant — test: `src/modules/admin/actions/__tests__/adminOperations.security.test.ts` (extended): a period of 90 days stores `premium_until` = now + 90 days and a grant row with `period_days` 90 and the actor's id; a custom date stores it with `period_days` null; a period outside the four and a past date are refused with nothing written; `SEC-999-PREMIUM-DENY`; `/admin/badges` is never revalidated (the case at `:117` changes).
- AC3 The table shows the period and the end — test: `src/components/admin/__tests__/AdminListingsView.premium.test.tsx` (new): the premium line for a period, a custom date and a past end; none for a listing without premium or with a grant whose end differs; the two columns on the premium tab only.
- AC4 Stories, texts and widths hold — test: `node scripts/check-mobile-adaptation-contract.mjs`, `node scripts/check-i18n-parity.mjs`, `node scripts/quality/locale-safety.mjs` and the census of `.claude/rules/shared/rendered-state-census.md` for the Story.
- AC5 The CI jobs pass — test: every no-secret job of `.github/workflows/ci.yml` as written (CI-parity rule of `flow.md`, `npx --yes npm@10.9.8 ci`), then `gh pr checks <n>`.

## Route

1. Branch from `main`. Read `setListingPremium`, `PremiumDialog.tsx`, the admin listings page and view, the Story, `adminOperations.security.test.ts`, the `listings` catalog lines (`node scripts/quality/db-catalog-audit.mjs`).
2. Tests first (AC1-AC3); save each failing output.
3. The SQL set, the action, the dialog, the page read, the view and Story, the messages. Three passes over every changed file (`flow.md` §2).
4. Run: the task tests · the CI job commands of the CI-parity rule (`flow.md`), read from `ci.yml`, with `npx --yes npm@10.9.8 ci`; deliberate break: the server-computed end replaced by the browser's, restored.
5. Report: each command, exit code, relevant output. Opus proves the SQL on the owner's delivery path; after the apply and the merge Opus grants and removes a premium on a test listing and reads the table.

## Review
