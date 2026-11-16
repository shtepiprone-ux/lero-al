# Task 956 — Hardening v8b: the database enforces the moderator keys, the contact gateway, the profile bounds, edit moderation and one public-listing rule

Sprint 93. Priority P0. Owner decisions: D1, D53/R74, D72, D77/D79/D80, R75, D91, O956-1, O956-2 (2026-11-15, "everything
must be fixed in the current task"), 2026-11-16 (cause rule; the rules and tools ship here), O956-3 (F25), O956-4 (F28). Filed by the audit
`docs/security/audit-2026-11-06/findings.md` (DB-01 to DB-08, SQL-01, L-04, P-06). Implementers: Opus
(`scripts/quality/**`, rules), Sonnet (SQL, application, tests; never applies SQL). The owner applies. Reviewer: Opus.

## Goal

On 2026-11-07 `node scripts/quality/db-catalog-audit.mjs` reported 59 findings on the live catalog (I3 contact RPC, I5
staff policies without keys, I6 `users` columns and CHECKs, I8 direct edits of active listings, I4 `anon` writes, I9
the avatars bucket, I7 expired listings, a definer view, duplicate `notifications` policies). After the task the same
command exits 0 on the live catalog and `supabase/catalog.json` is committed for Task 978. Since 2026-11-16 the task
also carries the rules and tools that hold every session to its read set (owner choice: they ship here). State
(Reviews 5 and 6): SQL, application and AC1-AC15 verified in a rolled-back apply; the causes below remain.

## Cause

- F13: `src/modules/admin/actions/index.ts:590` calls `assertPermission('users.create')`, which throws
  `Error('forbidden')` (`src/lib/auth/permissions.ts:42`); `handleCreate`
  (`src/components/admin/AdminUserProfile.tsx:244-258`) awaits it without a catch: "saving" forever, no banner.
Fix: `createAdminUser` returns `{ error: 'forbidden' }` (translated, AC14) when the caller lacks `users.create`.
- F5: `scripts/quality/db-catalog-audit.mjs:121` collects only UPDATE grants for I6 and no invariant compares two
  PERMISSIVE policies of one table and command: the `notifications` duplicates (AC7) and a session INSERT on a
  server-only `users` column pass unseen.
Fix: invariant I15 (two PERMISSIVE policies of one table, command and roles with the same expressions) and I6 over
INSERT grants, each with its failing test; the live baseline re-counted.

## Scope

- Done (Parts A, B, Revisions 1-3): the four SQL files in `supabase/sql_migrations/task956/`, the tools
  `db-catalog-audit.mjs`, `db-types-drift.mjs`, `db-sql-roundtrip.mjs`, `pg` 8.23.1 (dev), the application changes
  of AC4-AC6 and AC13-AC15.
- Rules and tools (Opus, 2026-11-15/16): the facts rule, the cause rule and the read set in `CLAUDE.md`, `flow.md`,
  `kickoff-template.md`, `README.md`, the three skills, two agents; `read-coverage.mjs` and the "## Cause"/"## Read set"
  checks of `check-files.mjs`, with their tests; Revision 4a (993c14088, F14-F22); Revision 4b (F23-F27, approved in
  Review 8). No further change of the command allow-list in this task (O956-4).
- Revision 4, Opus: F5 in `db-catalog-audit.mjs` and its test (they hold unreviewed edits of the stopped session
  9de8af74). Revision 4, Sonnet: F13 in `createAdminUser` and its test (the banner already translates `forbidden`:
  Review 8).
- Out of scope: application reveal limits, uploads (957), the rest of v8b (962), hand types (978), `parking` (979),
  public profiles (980), the unused admin create form (982).

## Read set
Counted at 3c002a197
- `scripts/quality/db-catalog-audit.mjs` — 265 lines
- `scripts/quality/db-catalog-audit.test.mjs` — 178 lines
- `src/modules/admin/actions/index.ts` — 1022 lines
- `src/modules/admin/actions/__tests__/createAdminUser.security.test.ts` — 92 lines

## Attack surface

Changed: the data layer every direct PostgREST call meets (all session roles), and the agent's self-review record.
T1 a moderator without a key writes through PostgREST (key in the policy); T2 contact scraping, expired listings and
profile flags read directly (revoke, one public rule, fewer view columns); T3 profile columns, unbounded text,
unmoderated edits (grants, CHECKs, trigger); T4 a refused legitimate write (preflight, admin-client writes, integration
suites); T5 a session that satisfies its own read check (AC17). Matrix: per I5 table and command, anon, user, owner,
moderator with and without the key, admin, blocked account.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- AI_Agent_Security: "Fail closed when risk classification, approval validation, policy lookup, or audit logging fails." — `read-coverage.mjs` fails when the session record is missing, empty or not the session's own, and when the session edits it or names it in a command — AC17.
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
- Dependency_Graph_SBOM: not applicable — `pg` is a development dependency; the SBOM job covers production dependencies and is unchanged.
- Email_Validation_and_Verification: not applicable — pending_email becomes server-only by column grant; the confirmation flow is unchanged.
- File_Upload: "Validate the file type, don't trust the Content-Type header as it can be spoofed" — the avatars bucket allows only jpeg, png and webp up to 2 MB — AC7.
- GraphQL: "Ensure that the API has proper access control checks." — the same policies guard pg_graphql; the catalog audit reads them — AC1.
- HTTP_Strict_Transport_Security: not applicable — no header changes in a database task.
- Identity_Propagation_Patterns: "Each receiving service must still authorize the requested action and resource." — the admin client paths still authorize the caller before the write — AC4.
- Injection_Prevention: not applicable — the SQL files are static migrations; no command or query is built from input.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — name and phone CHECKs hold on the direct database path — AC4.
- Insecure_Direct_Object_Reference_Prevention: "This verification should be performed for all operations involving object references, including read, create, update, delete, export, and administrative actions." — read, update and delete paths of listings and profiles are tested per role — AC4, AC5, AC6.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL security-extended (CI) run on every changed file — AC11.
- LLM_Prompt_Injection_Prevention: "Check all hidden text, not only text that reads like an instruction." — `check-files.mjs` refuses invisible characters in every changed file, rules included — AC11.
- MCP_Security: not applicable — no MCP server, permission or tool description is added or changed.
- Mass_Assignment: "Do not rely on a block-list as the sole protection: a new or overlooked sensitive field remains bindable." — server-only users columns are revoked by column grant, an allow-list in the database — AC4.
- Multi_Tenant_Security: "Do Not Use an RLS-Bypassing Role for Tenant-Scoped Request Paths" — the contact RPC is closed to sessions; only the server gateway with its own checks reveals — AC3.
- Multifactor_Authentication: not applicable — no sign-in factor changes; staff MFA is Task 960.
- NPM_Security: "Always vet and perform due-diligence on third-party modules you install to confirm their health and credibility." — `pg` is checked with `npm view` (age, maintainer repository, no install script) and `ignore-scripts=true` stays — AC12.
- Nextjs_Security: not applicable — the cabinet action changes no contract; the database now enforces the same rules.
- OS_Command_Injection_Defense: not applicable — db-catalog-audit.mjs gains an allow-list entry; no process call changes.
- Prototype_Pollution_Prevention: not applicable — the cabinet action keeps its field list; no request object is merged.
- Query_Parameterization: "Dynamic SQL can be parameterized using bind variables, to ensure the dynamically constructed SQL is secure." — the policies call the function with literal keys; no dynamic SQL — AC9.
- REST_Security: "the access control decision should be taken locally by REST endpoints" — the avatar route keeps its own checks; the bucket bounds back them up — AC7.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the whole diff; changed-line coverage and the file checks run on it — AC11.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input: Opus reruns every acceptance command in review — AC11.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the mitigations of the threat model are the acceptance criteria of this task — AC1, AC2, AC3, AC4, AC5, AC6, AC7.
- Session_Management: not applicable — no session handling changes in the database hardening.
- Software_Supply_Chain_Security: "limit the application's dependencies to a specific version that has been previously verified as legitimate and secure" — `pg` pinned to 8.23.1 and every new lockfile version at least 14 days old — AC12.
- SQL_Injection_Prevention: "use parameterized queries for dynamic data values" — the definer function has search_path empty and takes the key as a parameter — AC9, AC10.
- Third_Party_Javascript_Management: not applicable — no script loading changes in a database task.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them and each mitigation is an acceptance criterion — AC1, AC2, AC3, AC4, AC5, AC6, AC7.
- Transport_Layer_Security: not applicable — connections stay Supabase-managed TLS; no transport change.
- User_Privacy_Protection: "Preventing leakage of user IP addresses is of great significance when user protection is in scope." — public_user_profiles exposes only the columns a page renders — AC7.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC11.
- Vulnerable_Dependency_Management: "It's highly recommended to perform automated analysis of the dependencies from the birth of the project." — the CI dependency audit runs on the change that adds `pg` — AC12.
- Web_Service_Security: not applicable — no service schema changes; the database adds constraints behind the same API.

## UI

Admin user profile only: the website shows `lero.al` in view and edit; a refused save shows a translated text. Canonical
components unchanged; the `AdminUserProfileView` Story shows both modes. No token changes.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 After the apply, the live catalog has no finding — test: `node scripts/quality/db-catalog-audit.mjs` exits 0 (run by Opus before and after the apply).
- AC2 Each rewritten policy follows the key — test: `src/tests/integration/moderatorKeys.integration.test.ts` (per I5
  table and command through PostgREST: key off refused; where `authenticated` holds the privilege, key on and an admin
  succeed, elsewhere the grant refuses every session; `caller_has_permission` per role; keys restored in `afterAll`).
- AC3 The contact RPC is closed to sessions — test: `src/tests/integration/contactGateway.integration.test.ts`.
- AC4 Server-only `users` columns and the CHECKs hold on the direct path, and the application still writes them —
  test: `src/modules/admin/actions/userProfileFields.integration.test.ts`.
- AC5 An owner cannot change an active listing's content directly; the application edit still moderates — test:
  `src/modules/listings/actions/updateListing.integration.test.ts`.
- AC6 One public rule — test: `src/tests/integration/listingAccessState.integration.test.ts` and
  `src/modules/listings/lib/__tests__/visibility.test.ts` (the TypeScript rule and the SQL predicate are one table).
- AC7 `anon` writes nothing, the bucket is bounded, the duplicate policies are gone, the view lists only rendered
  columns — test: `node scripts/quality/db-catalog-audit.mjs` (I4, I9, I15) and
  `src/tests/integration/accessHardening.integration.test.ts` (the exact column set of `public_user_profiles`).
- AC8 The drift tool fails on drift, and this task adds none — test: `scripts/quality/db-types-drift.test.mjs`; after
  the apply `node scripts/quality/db-types-drift.mjs` shows no difference beyond the 42 of Tasks 978 and 979.
- AC9 The audit tool knows the new function and sees duplicates and INSERT — test:
  `scripts/quality/db-catalog-audit.test.mjs` (a policy calling `caller_has_permission(` passes I5; a definer function
  off the allow-list fails I3; two PERMISSIVE policies of one table, command and roles with the same expressions fail
  I15, two that differ pass; a session INSERT grant on a server-only `users` column fails I6).
- AC10 Rollback restores the previous catalog — test:
  `node scripts/quality/db-sql-roundtrip.mjs supabase/sql_migrations/task956/v8b.sql supabase/sql_migrations/task956/v8b-rollback.sql`
  exits 0 with LF and CRLF files (run by Opus before the apply, D91) and `scripts/quality/db-sql-roundtrip.test.mjs`.
- AC11 `node scripts/quality/read-coverage.mjs` (each implementer's session), `npm run lint`, `npm run typecheck`,
  `npm test -- --coverage`, `node scripts/quality/check-files.mjs --worktree`, `node --test "scripts/quality/*.test.mjs"`,
  `node scripts/quality/change-report.mjs main HEAD` exit 0.
- AC12 `pg` 8.23.1 is the only new direct dependency, without an install script, every new lockfile version at least 14
  days old — test: `node --test scripts/quality/install-scripts.test.mjs`,
  `node scripts/quality/change-report.mjs --lockfile-age main`, each exit 0, and `npm audit --json` lists no advisory for `pg` or a package it brings (the whole tree still holds the advisories of Task 972).
- AC13 The website is typed and shown without its scheme — test: `AdminUserProfile.smoke.test.tsx` and
  `userWebsite.security.test.ts`.
- AC14 No raw code in the admin banner — test: `AdminUserProfile.smoke.test.tsx` (each code of the two actions translated).
- AC15 No session write to `users` that always fails — test: `authCore.security.test.ts` and the confirm route test.
- AC16 A staff member without `users.create` gets the refusal, never a hang — test:
  `src/modules/admin/actions/__tests__/createAdminUser.security.test.ts` (without the key `{ error: 'forbidden' }` and
  no Auth admin call; with it the account is created as before).
- AC17 `read-coverage.mjs` decides from the repository and the session's own record, never from a spelling — test:
  `scripts/quality/read-coverage.test.mjs` (each proof of Reviews 6 and 7 is a red case: a forged or empty record, a
  record the session wrote, a 1000-character prefix, the nine command spellings, a subagent command before the third
  pass, a set-back mtime, an `echo` of the generated-file commands, the four commands of F23; a review read set with
  `sheets.json` and `controls.json` stays within the limit; a scratchpad command is no record touch and the
  only-matching option of grep is read-only).
- AC18 A kickoff's counts, sources and grandfathering hold after design — test: `scripts/quality/check-files.test.mjs`
  (a wrong count against the named commit, a `path:line` source not in that commit, a command source without output,
  and a revised grandfathered kickoff each fail; a source whose file is gone now but is in the commit passes).

## Route

Every session starts from a tree the owner committed locally on this branch (no push) and ends with that commit.
0. Done: Revision 4a (993c14088), Review 7 (F23-F27), Revision 4b, Review 8 (APPROVED, O956-4).
3. Revision 4, Opus (F5) and 4. Revision 4, Sonnet (F13), each in its own session, one after the other.
5. Review 9, Opus, own session: `--review <commit before step 3>`; the gates; AC10 LF and CRLF; `v8b-verify.sql` in a
   rolled-back apply; OAuth2 and Unvalidated_Redirects_and_Forwards in `Task_956.json`; the verdict; the apply step.
6. After the owner's apply: `v8b-verify.sql`, AC1-AC11, `--save supabase/catalog.json`.

## Review
Reviews 1-2 (Part A) APPROVED, F1, F2 closed; Review 3 (Part B) NEEDS REVISION 2 of 2, F4, F6-F8 closed; Review 4 LOOP LIMIT, O956-2.
Review 5 (2026-11-16) — F10-F12, AC13-AC15 closed; gates 0 (6589 tests); AC10 0 LF/CRLF/mixed, red without the CRLF
block; rolled-back apply: preflight 0 (row 15 = 1), audit 0, verify 16/16, session INSERT on `users` 42501.
F3 — (open) every sheet whose evidence is AC1-AC7 waits for the apply.
F5 — (P2, open, Opus) and F13 — (P3, open, Sonnet): see "## Cause"; Revision 4.
F9 — (process, closed by cause) the three passes were asked over 62 472 lines (`wc -l`); now the read set (`flow.md` §2).
Review 6 (rules and tools, 2026-11-16, session b23abf9c) — F14-F22 found (read-coverage trusted what the session sets;
  check-files held the kickoff only at design); OWASP: OAuth2, Unvalidated_Redirects_and_Forwards are Review 9's.
Review 7 of 993c14088 (Revision 4a, 2026-11-16, session c38a3209) — NEEDS REVISION (O956-2 keeps the work here).
  Three passes over the 13 files of `git diff be5a3d867` (2875 lines); `read-coverage.mjs --review be5a3d867` 3
  passes each, exit 1: this session ran `check-files` and `node --test` before its passes (a breach, the owner asked for
  the review in this session) and F24, F27. `node --test "scripts/quality/*.test.mjs"` 0 (200 pass, 3 skip), eslint 0,
  check-files 0 (worktree; 33 Sprint 93 kickoffs and the backlog), `owasp.mjs check` 0. 16 deliberate breaks of
  F14-F18 and F20-F22 each red, restored by sha256 (d02f36c80d02, 8ff2a29f63bf); the 9 transcripts of Review 6 exit 2.
  CI: the quality job checks out with `fetch-depth: 0` (`.github/workflows/ci.yml:36`), fetches `+refs/heads/*` (run
  43745661716) and runs `check-files --all` (:59); `delete_branch_on_merge` is false. F14-F22 closed (F14's rest is
  F25); the 982 kickoff edit is required by F20 and F21.
F23, F24, F26, F27 — fixed in Revision 4b (Review 8).
F25 — fixed in Revision 4b: the limit and the reviewer's duty are written (O956-3, `flow.md` §3, review-task step 2).
Review 8 of Revision 4b (working tree on 3c002a197, 2026-11-16, session 2c16cac1) — APPROVED.
  Scope: the 9 files of `git diff 3c002a197` (2491 lines), three passes; `read-coverage.mjs --review 3c002a197` exit 0;
  the implementer's record e573d35b rerun with `--transcript` exit 0; every command of that session and both of its
  scripts (`probe.mjs`, `break.ps1` in `%TEMP%\rc956`) read: none writes the record. Tools: check-ruleset 0, eslint 0,
  `npm run lint` 0, `npm run typecheck` 0, `npm test -- --coverage` 0 (399 files, 6589 tests), changed-lines-coverage 0
  (73/73), `check-files --worktree` 0, change-report 0. `node --test "scripts/quality/*.test.mjs"` 1 (206 pass, 1 fail:
  `owasp.test.mjs:287`) and `check-files` on this kickoff 1 (O3 File_Upload, Input_Validation): both from upstream
  OWASP changes this session's `owasp.mjs sync` wrote into `sheets.json` (2 sheets added, 6 changed), not from the
  revision. 5 deliberate breaks (Bash escape, `(`/`{`, bare id, global `-o`, Cause source read now) each red, restored
  by sha256 (f3caa165fcd1, 772d9e30e08f). Findings: Critical 0, High 0, Medium 1 (F28, accepted), Low 0.
F28 — Read-only allow-list runs a quoted command word (Medium, Agent and tool output). `scripts/quality/read-coverage.mjs:80`
  takes a whole segment in double quotes as a PowerShell string, but Bash runs it as a command, and PowerShell runs it
  after `&`: `isReadOnly('"./node_modules/.bin/vitest"')` and `isReadOnly('& "node_modules/.bin/vitest.cmd"')` are
  true; `"pwd"` ran pwd in this session's Bash. Status: accepted by the owner on 2026-11-16 (O956-4, translated: "I
  accept your proposal": a hand-written shell reader cannot be completed, each review found another spelling (F15,
  F23, F28); the allow-list stays an aid, and the reviewer reading every command of the session (O956-3) is the
  control). The OWASP remap of the 8 changed sheets goes to its own pull request from `main` (owner, 2026-11-16).
  For F13 the admin banner already maps `forbidden` to `save_errors.forbidden` (AdminUserProfile.tsx line 214).
