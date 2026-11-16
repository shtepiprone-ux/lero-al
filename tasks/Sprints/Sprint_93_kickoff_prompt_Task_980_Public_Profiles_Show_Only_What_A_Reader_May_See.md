# Task 980 — `public_user_profiles` shows a reader only the accounts behind a listing they may open

Sprint 93. Priority P2. Found 2026-11-15 by Task 956 Part B review (finding DB-07 of the whole-project audit,
`docs/security/audit-2026-11-06/findings.md`): Task 956 kept the view's nine columns because every one is rendered
(`src/app/[locale]/listings/[slug]/page.tsx:223-224`, `src/app/admin/listings/[id]/preview/page.tsx:48-49`), so the row
exposure stays. No owner decision needed. Implementer: Sonnet (the SQL, the application read, the tests; never applies
SQL). The owner applies. Reviewer: a separate Opus session (proves the preflight and the rollback before the apply).

## Goal

Read on the live project 2026-11-15 (read-only transaction): `public.public_user_profiles` is owned by `postgres` with
`security_invoker=false`, selects `id, name, avatar_url, user_type, is_verified, company_name, deleted_at, has_phone,
has_whatsapp` from `public.users` where `current_user` is not a session role or `caller_is_active()`; `authenticated`
holds SELECT, `anon` does not; it returns all 12 accounts. So any active signed-in account lists every account with its
name, company, deletion date and whether it has a phone and a WhatsApp number, including accounts that publish nothing.
The pages need the row of one account: the owner of the listing being shown. After the task a session reads through the
view only the accounts that own a listing the same session may open by its address (the one public rule of Task 956,
`visibility.ts` `isListingOpenableByAddress`, and the session's own row), and the two pages still render the contact card.

## Scope

- SQL in `supabase/sql_migrations/task980/`: `v1.sql`, `v1-rollback.sql`, `v1-preflight.sql` (read-only: the rows the
  view returns today, and the rows it would return to a session), `v1-verify.sql`; one transaction, schema-qualified.
- The listing page and the staff preview keep their output (`ListingContact`); a staff read may use the service role
  after its own permission check.
- Dependencies: Task 956 applied (its public rule in the listings policy).
- Out of scope: the columns of the view (Task 956 kept them); `has_phone` semantics.

## Attack surface

Changed: one read path of signed-in sessions (PostgREST `public_user_profiles`).
- T1 Information disclosure: enumeration of accounts (deletion date, phone presence). Mitigation: rows limited to the
  owners of listings the reader may open, and the reader's own row.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-15).

- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the one read path that changes — AC1.
- Authorization: "Implement defense in depth. Do not depend on any single framework, library, technology, or control to be the sole thing enforcing proper access control." — the view itself limits rows; the page does not rely on asking for one id only — AC1.
- Authorization_Decisions_And_Output_Handling: "Intersect predicates. Combine authorization restrictions with application and tenant predicates using logical AND." — the row filter ANDs the reader's session with the one public listing rule — AC1.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — the filter is in the view next to the rows it returns — AC1.
- Authorization_Regression_Testing: "Relying on UI hiding is insufficient; the API layer must enforce the check" — the test reads the view straight through PostgREST — AC1.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — stranger, owner and own-row cases in the integration suite — AC1.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — a session reads only the rows a page needs — AC1, AC3.
- GraphQL: "Ensure that the API has proper access control checks." — pg_graphql reads the same view with the same filter — AC1.
- Identity_Propagation_Patterns: "Each receiving service must still authorize the requested action and resource." — a staff read through the service role runs after the staff permission check — AC2.
- Injection_Prevention: not applicable — the SQL files are static migrations; no query is built from input.
- Input_Validation: not applicable — no input field or schema changes; the view takes no parameter.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL run on every changed file — AC4.
- Mass_Assignment: not applicable — a read-only view changes; no writable field list changes.
- Multi_Tenant_Security: "Do Not Use an RLS-Bypassing Role for Tenant-Scoped Request Paths" — the definer view no longer returns every account to a session — AC1.
- Prototype_Pollution_Prevention: not applicable — no object merge; one SQL view and one read change.
- Query_Parameterization: not applicable — static migration; the page passes the owner id as a filter value.
- SQL_Injection_Prevention: not applicable — no value from input reaches SQL text.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the whole diff and reruns the AC tests — AC4.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the reviewer reruns AC1-AC3 on the live project — AC1, AC3.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — T1 is AC1 — AC1.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them; T1 has its test — AC1.
- User_Privacy_Protection: "Preventing leakage of user IP addresses is of great significance when user protection is in scope." — the deletion date and phone presence of accounts with no openable listing leave the session's reach — AC1.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — failing-first runs are rerun in review — AC1, AC2.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 A session reads only the profiles behind listings it may open — test:
  `src/tests/integration/accessHardening.integration.test.ts` (extended: a signed-in stranger reads the profile of the
  owner of an active listing, not of an account with no openable listing, not of the owner of an archived or expired
  listing; the session reads its own row).
- AC2 The pages still render the owner — test: `src/app/[locale]/listings/[slug]/__tests__/ownerProfile.test.ts`
  (new: the page of an active listing reads the owner's row and passes it to the contact card) and
  `src/app/admin/listings/[id]/preview/__tests__/previewIsNew.test.ts` (extended: the preview still reads the owner).
- AC3 Rollback restores the previous catalog — test: `node scripts/quality/db-sql-roundtrip.mjs
  supabase/sql_migrations/task980/v1.sql supabase/sql_migrations/task980/v1-rollback.sql` exits 0 (Opus, before the apply).
- AC4 `npm run lint`, `npm run typecheck`, `npm test -- --coverage`, `node scripts/quality/changed-lines-coverage.mjs
  --base main`, `node scripts/quality/check-files.mjs --worktree`, `node scripts/quality/db-catalog-audit.mjs` exit 0.

## Route

1. Branch from `main` after Task 956 is merged and applied.
2. Tests first (AC1, AC2) against the live project with `SECURITY_TEST_PROJECT_REF`; save each failing output.
3. The SQL and the application read. Hand over to Opus; Opus proves the preflight and the rollback and gives the owner
   the apply step.
4. After the apply: `v1-verify.sql`, AC1-AC4.
5. Report: each command, exit code and relevant output; each failing-first run; one deliberate break per AC.

## Review
