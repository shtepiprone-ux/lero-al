# Task 962 — Review 1

Kickoff: [Sprint_93_kickoff_prompt_Task_962_Hardening_V8b_Promises_The_Code_Relies_On.md](../../tasks/Archive/Sprint_93_kickoff_prompt_Task_962_Hardening_V8b_Promises_The_Code_Relies_On.md) · OWASP record: [Task_962.json](../security/owasp/reviews/Task_962.json)

Review 1 of the working tree on 791f7f1fb (uncommitted, branch `task/962-hardening-v8b2`) — NEEDS REVISION
Scope: `supabase/sql_migrations/task962/v8b2.sql`, `v8b2-rollback.sql`, `v8b2-preflight.sql` (new), `src/tests/__tests__/v8b2Sql.test.ts` (new),
`src/tests/integration/signUpTrigger.integration.test.ts` (new), `userProfileFields.integration.test.ts`, `updateListing.integration.test.ts`,
`accessHardening.integration.test.ts` and `fixtures.ts` (changed); every file is in the kickoff's Scope (`git diff --stat 791f7f1fb` and the untracked list).
Tools (local, 2026-11-23): `owasp.mjs sync`, `owasp.mjs check`, `check-ruleset.mjs` → exit 0; `gh run list --branch main --limit 3` → `success` on
`5d7bd89ec`; `npm test --` the two unit files → exit 0, 40 passed; `npm run test:security-integration --` the four integration files → exit 1, 6 failed
(exactly the six DENY cases of AC1-AC6), 44 passed, as reported; `v8b2-preflight.sql` read-only with LF and CRLF copies → rows 1-8: 0 problems, row 9: 1
(public_id 37), row 10: 2 (no key); `db-sql-roundtrip.mjs` LF and CRLF → exit 0, "the rollback restores the catalog (51 catalog row(s) changed)"; the body of
`public.handle_new_user` inside a rolled-back transaction, LF and CRLF: before `cefa51890d93634aa2f2ff012b44b964` (918), after the rollback the same;
`owasp.mjs review <kickoff> --base origin/main` → exit 0 (local `main` is behind `origin/main`, so `--base main` read 198 files). Not run (A5): `tsc`, lint,
the full unit and integration runs, build, census.
Findings: Critical 0, High 0, Medium 0, Low 1 (F1)
Overall risk: the SQL does what the kickoff names and its way back is proven; the application paths stay as on `main` (the ALLOW cases pass on the live
database before the apply); one test file is larger than the task needs.

## Secure code review (`secure-code-review.md` §2, §3)

1. Impact on existing controls: none weakened; the avatar line of `handle_new_user` is narrowed from any `https://` to two hosts (`v8b2.sql:31`); the
   `SERVER_ONLY` fixture addresses move to the project cloud (`userProfileFields.integration.test.ts:68`, `:70`) because the new CHECK refuses another cloud.
2. New attack vectors: none; no entry point, parameter or outbound call.
3. Trust boundaries: server ↔ database: the new rules hold for the session and the service role (`[SEC-962-USER-IMAGE-PREFIX-DENY]` writes as the service
   role); the photo trigger exempts what `listings_owner_edit_moderation` exempts (`v8b.sql:221-226`, `v8b2.sql:93-98`).
4. New integrations: none. 5. No regression: no test or assertion removed (`git diff 791f7f1fb` has no `-` line in a test body except the two fixture
   addresses and the moved `restored` assertion of `updateListing.integration.test.ts`'s `afterAll`, now asserted after every row is removed).
6. Categories: Authorization — touched: the database twin of three application guards (`v8b2.sql:14-16`, `:48-74`, `:79-110`); every application write
   of `users.avatar_url` (`upload-avatar/route.ts:145`, `admin/actions/index.ts:747`) and of `listing_images` (`createListing.ts:93` on a pending listing,
   `updateListing.ts:164`, `:177` after the move to pending, `deleteListing.ts:42-56` with the service role) passes the new rules (the ALLOW cases).
   Input and output — touched: CHECKs mirror the schemas. Business logic — touched: the price and catalogue invariants with tests. Authentication and
   sessions, Requests and redirects, Next.js entry points, JavaScript and TypeScript, Data exposure, Files, Dependencies and configuration — not touched
   (no file of them in `git diff --name-only`). Agent and tool output — the executor's scratch scripts stay outside the repository (`git status`).
   Tests — F1.

## Rendered comparison (V5a)

No visible element changes: the diff holds SQL and tests only. The one stored value a user could see, user #37's logo, is an empty string (preflight row 9;
the executor's read) and renders nothing before and after (O962-2). V9: no Story changes.

## Findings

F1 — the SQL text test checks far more than AC3
Severity: Low      Category: Tests (checklist A1, D10)      CWE: none
Location: src/tests/__tests__/v8b2Sql.test.ts:1-341
Description: the kickoff names this file for AC3 only ("the two numbers in `v8b2.sql` equal `MAX_LISTING_PRICE_BY_CURRENCY`"); it holds 39 tests that match
the text of the three SQL files (statement spelling, comments removed, the rollback's grants and columns, the preflight's wording, an md5 of the restored
body). What they claim is proven by the preflight, `db-sql-roundtrip.mjs`, the body md5 inside a rolled-back transaction (above) and the integration
suite on the real database; a change of whitespace or wording in a SQL file fails them without any change of behaviour.
Impact: no security impact; a test the Cause does not need (A1: "no file, component, refactor, rename, test … the Cause does not need").
Recommendation: `v8b2Sql.test.ts` keeps only the AC3 test: it reads `v8b2.sql` and asserts that the EUR and ALL numbers of `listings_price_ceiling_check`
(for `price` and `price_old`) equal `MAX_LISTING_PRICE_BY_CURRENCY`; every other `describe` leaves.
Status: Revision 1 R1-1.

## Notes

- The kickoff's AC5 ALLOW names "a moderator session with `listings.moderate` on the active one": row-level security on `listing_images` ("Users can manage
  own listing images") lets only the owner write, so the trigger's exemption is proven on the moderator's own active listing (`updateListing.integration.test.ts`,
  case (2)), as the executor reported; no change is needed.
- A4, outside this task: the catalogue offers the property type `parking` (`property_types.slug = 'parking'`, active) and the code accepts it
  (`src/modules/listings/validations/index.ts:26`, `src/modules/listings/constants/index.ts:9`), but the enum refuses it (read-only, 2026-11-23:
  `select 'parking'::public.property_type` → `22P02 invalid input value for enum property_type: "parking"`); no open task holds it (979 was withdrawn into Task
  957, O957-15 returned to Task 1001, whose kickoff does not name the enum). Filed as Task 1022.
- The executor's other A4 items: `googleSignIn.integration.test.ts:44` sends an `example.com` avatar and has no assertion on the avatar (`grep -n avatar` → only
  line 44), so the trigger change does not fail it; `scripts/check-schema-drift.mjs` and `schema-drift-check.sql` are Task 978's (kickoff "Out of scope").

## Revision 1 (Sonnet; only this item)

- R1-1 (F1) `src/tests/__tests__/v8b2Sql.test.ts` keeps only the AC3 test.

## After the apply (V8, 2026-11-23)

The owner applied `v8b2.sql` (md5 `27e9edb1ab98e14a57e06aad289d4d06`) in the SQL Editor: "Success. No rows returned". Then:
- `npm run test:security-integration --` the four integration files → exit 0, 4 files, 50 passed: every DENY case that failed before the apply passes, every
  ALLOW case still passes (V8: each test fails without the change and passes with it).
- The other integration files that touch the new rules, read: `listingImageOwner` writes photos of a `pending` listing (`:27-28`), `uploadAvatar` stores a
  `die7okukn` address (`:21`, `:28`), `googleSignIn` has no avatar assertion; the whole suite is `CI Required`'s "Authorization regression".
- `node scripts/quality/db-catalog-audit.mjs --save supabase/catalog.json` → exit 0, no finding; the snapshot diff holds only the three CHECKs, the two
  functions and triggers, and `exchange_providers` gone (with its columns, grants and policy).

Open parts, in order: Revision 1 (Sonnet) → Review 2 → the commit and pull request (H) → `gh pr checks <n>` → the merge.
