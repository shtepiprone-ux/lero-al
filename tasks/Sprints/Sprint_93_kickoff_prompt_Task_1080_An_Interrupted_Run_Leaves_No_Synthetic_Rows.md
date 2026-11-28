# Task 1080 — An interrupted integration run leaves no synthetic rows

Sprint 93. Priority P1. Found in Task 990 Review 2 (checklist A4). Owner, 2026-11-28 (translated), on the rows that
run left: "yes, delete these test records, they are not needed"; on this kickoff: "Design the kickoff".
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

The integration run `zz_synth_mwyrxpon6e49` (2026-11-27, `src/tests/integration/moderatorKeys.integration.test.ts`)
left 79 rows in the one real project (D91): `amenities`, `locations` and `pages` 15 each, `companies` and
`contact_inquiries` 6, their translations, `email_templates` 3, `site_settings` 1. The 15 `pages` rows have
`content = {}`, so `isMigrationPending` (`src/components/admin/adminPagesContent.ts:34-36`) disabled "New page" for
every administrator (Task 990 Review 2). The rows were removed by hand on 2026-11-28. After the task the clean-up that
every suite and the CI sweep share removes, and counts, the run's rows in every table a suite writes by the run prefix,
and the sweep finds a stale run by any of them.

## Cause

Read at 862ba9bc1
- `removeRun` (`src/tests/integration/fixtures.ts:36-106`), the one clean-up of `createRun().cleanup()` and of
  `scripts/sweep-synthetic.mjs:186`, deletes only `listing_inquiries` by prefix (`fixtures.ts:62`), the dependent rows
  of the run's listings and users (`:63-71`), the listings (`:72`) and the users (`:75-83`), and counts only those
  (`:94-105`). Every other table a suite writes by the prefix is deleted only in that suite's own `afterAll`
  (`moderatorKeys.integration.test.ts:83`, the list `PREFIXED` at `:33-34`; `deleteAccount.integration.test.ts:41-47`;
  `adminPermissions.integration.test.ts:35`; `rateLimit.integration.test.ts:23`; `inboundEmail.integration.test.ts:17-21`).
  A run stopped before that line leaves those rows, and the sweep reports the prefix "removed, verified"
  (`sweep-synthetic.mjs:117`).
- The sweep finds an unlogged prefix only in an auth e-mail or a listing slug (`scripts/sweep-synthetic.mjs:28-29`,
  `:95-100`), so a run whose accounts and listings are gone, or that wrote none yet
  (`inboundEmail.integration.test.ts:27-34` inserts `contact_inquiries` before the first `makeUser` of its case, `:46`), is never
  found again.
- Every other table the suites write is a child that the database deletes with its parent (read-only
  `pg_constraint` query, 2026-11-28 → `amenity_translations`, `location_translations`, `page_translations`,
  `contact_inquiry_replies`, `report_actions`, `support_ticket_events`: `ON DELETE CASCADE` to their parent), or is
  already removed by `removeRun` through a user or listing id.

Fix: one exported list in `fixtures.ts` of each (table, column) a suite writes the run prefix to; `removeRun` deletes
and counts the run's rows of each, before the listings and users; the sweep also reads each listed column for stale
prefixes.

## Scope

- `src/tests/integration/fixtures.ts`:
  - new export `PREFIXED_COLUMNS: readonly (readonly [table: string, column: string])[]` = `amenities`/`name_al`,
    `companies`/`name`, `contact_inquiries`/`name`, `email_templates`/`key`, `listing_reports`/`comment`,
    `locations`/`name_al`, `pages`/`slug`, `rate_limit_hits`/`bucket`, `site_settings`/`key`,
    `support_tickets`/`subject`, `verification_requests`/`document_url`;
  - `removeRun`: before the step `inquiries` (`:62`), one `step` per pair: `delete().like(column, RUN_LIKE)`; in the
    verification (`:94-99`), one count per pair: `select('*', { count: 'exact', head: true }).like(column, RUN_LIKE)`,
    the count added to `remaining`, an error pushed to `errors` (never "zero left", as `:87-92`).
- `scripts/sweep-synthetic.mjs`:
  - `runSweep` (`:57-125`): a fourth read `readPrefixed(env)` (`Promise<string[]>`) after `readSlugs`, with the same
    refusal (`sweep-synthetic: the read of the synthetic rows failed; nothing was removed`, exit 1, nothing removed);
    its values matched by a new `PREFIXED_VALUE = ^(<TIME_AND_HEX>)(?![0-9a-z])` in the loop at `:95-100` under the
    same two-hour rule; the doc comment at `:44-56` names it.
  - `main` (`:149-188`): `readPrefixed` reads every pair of `fixtures.PREFIXED_COLUMNS` with
    `select(column).like(column, escapeLike('zz_synth_') + '%')`, paged by 1000 as `readSlugs` (`:175-184`), and
    throws on any read error.
- `scripts/__tests__/sweep-synthetic.test.ts`: `door()` gains `prefixed` and `prefixedFail`; the cases of AC3.
- `src/tests/integration/__tests__/removeRun.test.ts` (new): a recording fake admin client (`from().delete().like()`,
  `from().select().like()/in()`, `auth.admin.listUsers`, `auth.admin.deleteUser`); the cases of AC1 and AC2.
- Dependencies: none.
- Out of scope: each suite's own `afterAll` and its `PREFIXED` list (`moderatorKeys.integration.test.ts:33-34`, kept);
  the CI steps that log and sweep (`.github/workflows/ci.yml:173-184`, `:633-652`, unchanged); the admin pages.
- Kept as on `main` (checklist A2): `removeRun` — its order for inquiries, listings and users, the retry of a refused
  user delete, the verified result shape `{ verified, remaining, errors }`; the sweep — the target refused before any
  read, the log removed at any age, the two-hour rule, a failing read deleting nothing, `--dry-run`, output of counts
  and prefixes only, the e-mail and slug shapes.

## Attack surface

Changes: the service-role clean-up deletes rows of 11 more tables in the one real project (D91).

1. What are we working on? `removeRun` and `scripts/sweep-synthetic.mjs`, run by the integration suites and by the CI
   step `if: always()` with the service-role key of the approved development project (`loadIntegrationEnv`). No user
   reaches them; the trust boundary is the service role, which skips RLS.
2. What can go wrong? T1 — Tampering: a pattern broader than one run's prefix (an unescaped `_`, a shorter prefix, a
   value merely containing `zz_synth`) deletes real content (pages, settings, templates). T2 — Tampering: the sweep
   takes a prefix from a real value. T3 — Repudiation/integrity: a failed delete or count read as "zero left".
3. What are we going to do about it? T1 mitigate: every delete and count is `like(column, escapeLike(RUN) + '%')` with
   `RUN` of the exact shape → AC2. T2 mitigate: only a value starting with the exact shape and followed by a
   non-alphanumeric character or its end names a prefix, and only when older than two hours or logged → AC3. T3
   mitigate: an error is "unknown", `verified: false` → AC1.
4. Did we do a good enough job? Each mitigation has its `SEC-1080-*` case, broken once by I9.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-28).

- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — the service-role delete widens to 11 tables; named in "## Attack surface" with its mitigations — AC1, AC2, AC3.
- Authorization: not applicable — no permission check, role or session path changes; test clean-up only.
- Authorization_Decisions_And_Output_Handling: not applicable — no authorization decision is made or consumed by the changed code.
- Authorization_Patterns: not applicable — no protected resource gains or loses an enforcement point in this task.
- Authorization_Regression_Testing: not applicable — the suites' authorization cases are unchanged; only their shared clean-up widens.
- Authorization_Testing_Automation: not applicable — no authorization matrix row is added, removed or changed here.
- CI_CD_Security: not applicable — `.github/workflows/ci.yml` is read, never changed; the sweep step stays as it is.
- Database_Security: not applicable — no grant, policy, role or schema changes; the service role exists already.
- GitHub_Actions_Security: not applicable — no workflow, action pin, permission or secret placement changes in this task.
- GraphQL: not applicable — the project has no GraphQL endpoint; PostgREST filters only.
- Identity_Propagation_Patterns: not applicable — no identity crosses a service; the clean-up acts as the service role.
- Injection_Prevention: "The preferred option is to use a safe API which avoids the use of the interpreter entirely or provides a parameterized interface" — every delete, count and read is a PostgREST `like` filter with the `escapeLike` pattern, no query text is built — AC2.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — `PREFIXED_VALUE` is a fixed-length prefix and one negative lookahead, no nested quantifier — AC3.
- Key_Management: not applicable — the service-role key, its source and its use stay as on `main`.
- Logging: "The following should usually not be recorded directly in the logs, but instead should be removed, masked, sanitized, hashed, or encrypted" — the sweep still prints counts and prefixes only, never a read value — AC3.
- Logging_Vocabulary: not applicable — no security event is logged; the sweep prints its own counts only.
- Mass_Assignment: not applicable — no object is bound from input; the clean-up deletes by fixed columns.
- Multi_Tenant_Security: not applicable — synthetic rows of one run; the project has no tenants of its own.
- OS_Command_Injection_Defense: not applicable — the sweep starts no process and builds no shell command.
- Query_Parameterization: not applicable — no SQL text is written; PostgREST receives each filter as a parameter.
- SQL_Injection_Prevention: not applicable — no statement is concatenated; the run prefix is generated, never input.
- Secrets_Management: not applicable — the credentials are read by name as on `main`, never printed.
- Secure_Code_Review: "Security-Focused Review differs from functional code review by specifically targeting security concerns" — the review holds the diff against T1-T3 and the I9 breaks — AC1, AC2, AC3.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor changes only the Scope files and runs only the Route — AC5.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — T1-T3 are acceptance criteria with tests — AC1, AC2, AC3.
- Software_Supply_Chain_Security: not applicable — no dependency, lockfile entry or workflow pin changes in this task.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — the four answers are in "## Attack surface" — AC1, AC2, AC3.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the tests and the breaks, never takes the report alone — AC1, AC2, AC3, AC4.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 `removeRun` deletes and counts the run's rows of every pair of `PREFIXED_COLUMNS`, before the listings and the
  users; a row left or a failed delete or count gives `verified: false` — test:
  `src/tests/integration/__tests__/removeRun.test.ts` `[1080-REMOVE]`, `[SEC-1080-UNKNOWN]`.
- AC2 Every delete and count of a listed pair uses the escaped pattern of the whole prefix
  (`zz\_synth\_<8><4>%`), never a shorter or unescaped one — test: `src/tests/integration/__tests__/removeRun.test.ts`
  `[SEC-1080-PREFIX-ONLY]`.
- AC3 The sweep removes a prefix older than two hours found only in a listed column (no account, no listing); a
  younger one stays; `about`, `zz_synthx…`, `zz_synth_short`, a prefix followed by a letter or digit, and a value with
  the prefix inside it are never passed to `removeRun`; a failing `readPrefixed` removes nothing and exits 1; the target
  is refused before it — test: `scripts/__tests__/sweep-synthetic.test.ts` `[1080-SWEEP-FOUND]`,
  `[SEC-1080-SHAPE]`, `[1080-SWEEP-READ-FAILS]`.
- AC4 Every suite's verified clean-up passes against the real schema with the wider count (a wrong column name fails
  it) — test: `npm run test:security-integration -- <the integration files of "Route tests">`.
- AC5 CI is green — test: `gh pr checks <n>`.

## Route

1. Branch from `main`. Read the files of "## Cause" and `src/tests/integration/environment.ts`.
2. Tests first (AC1-AC3); save each failing output.
3. The change in `fixtures.ts`, then in `sweep-synthetic.mjs`.
4. Run the "Route tests" below and every test both searches of `quality-gates.md` §8.1 find over the changed files,
   each by the command §8.1 names; `npm run typecheck`; ESLint on the changed code files; `node
   scripts/quality/product-gates.mjs` once (checklist I8). The integration run with `TURNSTILE_SECRET_KEY` empty
   (Task 990 Review 4: `verifyTurnstile` accepts `dev-noop-token` only without it). Nothing else locally.
5. I9: remove the escaping of AC2, the shape check of AC3 and the error branch of AC1 once each, run, restore.
6. Report: each command, exit code, relevant output; the failing-first runs; the break outputs.

### Route tests

Both searches of §8.1 on 2026-11-28 over `src/tests/integration/fixtures.ts` and `scripts/sweep-synthetic.mjs`
(`main` at 862ba9bc1): the import graph, default collection → exit 0, 1 file, 13 tests; the text search
(`tests/integration/fixtures|sweep-synthetic|removeRun|PREFIX_SHAPE|runSweep`) → 36 files.

Default collection, `npm test --`: `scripts/__tests__/sweep-synthetic.test.ts`; new:
`src/tests/integration/__tests__/removeRun.test.ts`.

Integration collection, `npm run test:security-integration --` (35, every importer of `fixtures.ts`):
`src/app/api/upload-avatar/uploadAvatar.integration.test.ts`, `src/lib/account/deleteAccount.integration.test.ts`,
`src/lib/auth/accountAccess.integration.test.ts`, `src/lib/auth/googleSignIn.integration.test.ts`,
`src/lib/auth/sessionEnd.integration.test.ts`, `src/lib/auth/staffAccess.integration.test.ts`,
`src/modules/admin/actions/accountBan.integration.test.ts`, `src/modules/admin/actions/adminPermissions.integration.test.ts`,
`src/modules/admin/actions/userProfileFields.integration.test.ts`, `src/modules/cabinet/actions/emailChange.integration.test.ts`,
`src/modules/cabinet/actions/reauth.integration.test.ts`, `src/modules/cabinet/actions/reauthLimit.integration.test.ts`,
`src/modules/listings/actions/contactLifecycle.integration.test.ts`, `src/modules/listings/actions/contactSession.integration.test.ts`,
`src/modules/listings/actions/deleteListing.integration.test.ts`, `src/modules/listings/actions/listingR2Images.integration.test.ts`,
`src/modules/listings/actions/listingSlugGuard.integration.test.ts`, `src/modules/listings/actions/ownerPublish.integration.test.ts`,
`src/modules/listings/actions/updateListing.integration.test.ts`, `src/tests/integration/accessHardening.integration.test.ts`,
`src/tests/integration/accountLocale.integration.test.ts`, `src/tests/integration/accountStatusByEmail.integration.test.ts`,
`src/tests/integration/adminPage.integration.test.ts`, `src/tests/integration/authPasswordMatches.integration.test.ts`,
`src/tests/integration/cloudinarySignedUpload.integration.test.ts`, `src/tests/integration/contactGateway.integration.test.ts`,
`src/tests/integration/inboundEmail.integration.test.ts`, `src/tests/integration/inquiryReplies.integration.test.ts`,
`src/tests/integration/listingAccessState.integration.test.ts`, `src/tests/integration/listingImageOwner.integration.test.ts`,
`src/tests/integration/moderatorKeys.integration.test.ts`, `src/tests/integration/r2SignedUpload.integration.test.ts`,
`src/tests/integration/rateLimit.integration.test.ts`, `src/tests/integration/signUpTrigger.integration.test.ts`,
`src/tests/integration/syntheticListingsHidden.integration.test.ts`.

## Revision 1 (Review 1, 2026-11-28)

The item is written in full in [Task_1080_Review_1.md](../../docs/reviews/Task_1080_Review_1.md), "Revision 1"; it
stays in the Scope files `src/tests/integration/fixtures.ts` and `src/tests/integration/__tests__/removeRun.test.ts`.

- R1 (F1): `removeRun` refuses, before any read or delete, a `run` that is not of the shape
  `^zz_synth_[0-9a-z]{8}[0-9a-f]{4}$`, returning `{ verified: false, remaining: 0, errors: ['refused: not a run prefix'] }`;
  test `[SEC-1080-SHAPE-ONLY]` in `removeRun.test.ts`.

## Review
- [Review 1 — NEEDS REVISION](../../docs/reviews/Task_1080_Review_1.md)
