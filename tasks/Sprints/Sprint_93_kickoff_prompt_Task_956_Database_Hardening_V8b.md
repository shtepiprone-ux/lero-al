# Task 956 — Hardening v8b: the database enforces the moderator keys, the contact gateway, the profile bounds, edit moderation and one public-listing rule

Sprint 93. Priority P0. Owner decisions: D1, D53/R74, D72, D77/D79/D80, R75, D91, O956-1, O956-2 (2026-11-15, "everything must be fixed in the current
task"), 2026-11-16 (cause rule; the rules and tools ship here), O956-3 (F25), O956-4 (F28), O956-5 (2026-11-16: Revision 6 is Opus's work), O956-6
(2026-11-16, "only audit --snapshot": the snapshot's proof). Filed by the audit `docs/security/audit-2026-11-06/findings.md` (DB-01 to DB-08, SQL-01, L-04,
P-06). Implementers: Opus (`scripts/quality/**`, rules), Sonnet (SQL, application, tests; never applies SQL). The owner applies. Reviewer: Opus.

## Goal

On 2026-11-07 `node scripts/quality/db-catalog-audit.mjs` reported 59 findings on the live catalog (I3 contact RPC, I5 staff policies without keys, I6
`users` columns and CHECKs, I8 direct edits of active listings, I4 `anon` writes, I9 the avatars bucket, I7 expired listings, a definer view, duplicate
`notifications` policies). After the task the same command exits 0 on the live catalog and `supabase/catalog.json` is committed for Task 978. Since
2026-11-16 the task also carries the rules and tools that hold every session to its read set (owner choice: they ship here). State: the owner applied v8b
on bmxkzcxaojgmpgzawwtn (2026-11-16); the results of Route step 6 are in "## Review".

## Cause

- Revision 6: step 6 writes the snapshot: `node scripts/quality/db-catalog-audit.mjs --save supabase/catalog.json` → `no finding`, 8391 lines (2026-11-16).
  `.gitignore:112` (`supabase/*`) ignores it: `git check-ignore -v supabase/catalog.json` → `.gitignore:112:supabase/*`, so it cannot be committed. And
  `scripts/quality/read-coverage.mjs:53-62` names only `package-lock.json` and `docs/security/owasp/sheets.json` as generated, so it is read line by line against
  the limit of `scripts/quality/read-coverage.mjs:418`: with the AC20 cases on that code `node --test scripts/quality/read-coverage.test.mjs` → `# fail 2`.
Fix: `!supabase/catalog.json` in `.gitignore`; the snapshot joins GENERATED, proved by the session's own run of `db-catalog-audit.mjs --snapshot
supabase/catalog.json` without error (O956-6; not `db-types-drift.mjs`, exit 1 on the 42 differences of 978 and 979); `flow.md` §2 step 4, review-task step 3.

## Scope

- Done (Parts A, B, Revisions 1-3): the four SQL files in `supabase/sql_migrations/task956/`, the tools `db-catalog-audit.mjs`, `db-types-drift.mjs`,
  `db-sql-roundtrip.mjs`, `pg` 8.23.1 (dev), the application changes of AC4-AC6 and AC13-AC15.
- Rules and tools (Opus, 2026-11-15/16): the facts rule, the cause rule and the read set in `CLAUDE.md`, `flow.md`, `kickoff-template.md`, `README.md`, the
  three skills, two agents; `read-coverage.mjs` and the "## Cause"/"## Read set" checks of `check-files.mjs`, with their tests; Revision 4a (993c14088,
  F14-F22); Revision 4b (F23-F27, approved in Review 8). No further change of the command allow-list in this task (O956-4).
- F5 closed without a change (Revision 4 check). Revision 4 (F13, F29) approved in Review 9; Revision 5 (F30, AC19) approved in Review 10.
- Revision 6, Opus (O956-5): the snapshot of step 6, committed (`.gitignore`) and generated for `read-coverage.mjs` (AC20), not read, so not in "## Read set"
  (`flow.md` §2 step 4); the step-6 results in "## Review"; the 980 kickoff rewritten with the definer-view scope (owner, 2026-11-16); both backlog rows.
- Out of scope: application reveal limits, uploads (957), the rest of v8b (962), hand types (978), `parking` (979), public profiles and definer views
  (980), the unused admin create form (982).

## Read set
Counted at c0a948345
- `scripts/quality/read-coverage.mjs` — 515 lines
- `scripts/quality/read-coverage.test.mjs` — 365 lines
- `.claude/rules/flow.md` — 197 lines
- `.claude/skills/review-task/SKILL.md` — 64 lines
- `tasks/Sprints/Sprint_93_kickoff_prompt_Task_956_Database_Hardening_V8b.md` — 257 lines
- `tasks/Sprints/Sprint_93_kickoff_prompt_Task_980_Public_Profiles_Show_Only_What_A_Reader_May_See.md` — 93 lines
- `docs/backlog.md` — 81 lines
- `.gitignore` — 128 lines

## Attack surface

Changed: the data layer every direct PostgREST call meets (all session roles), and the agent's self-review record. T1 a moderator without a key writes
through PostgREST (key in the policy); T2 contact scraping, expired listings and profile flags read directly (revoke, one public rule, fewer view columns);
T3 profile columns, unbounded text, unmoderated edits (grants, CHECKs, trigger); T4 a refused legitimate write (preflight, admin-client writes, integration
suites); T5 a session that satisfies its own read check (AC17, AC20). Matrix: per I5 table and command, anon, user, owner, moderator with and without the
key, admin, blocked account.

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

Admin user profile only: the website shows `lero.al` in view and edit; a refused save shows a translated text. Canonical components unchanged; the
`AdminUserProfileView` Story shows both modes. No token changes.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 After the apply, the live catalog has no finding — test: `node scripts/quality/db-catalog-audit.mjs` exits 0 (run by Opus before and after the apply).
- AC2 Each rewritten policy follows the key — test: `src/tests/integration/moderatorKeys.integration.test.ts` (per I5 table and command through PostgREST:
  key off refused; where `authenticated` holds the privilege, key on and an admin succeed, elsewhere the grant refuses every session;
  `caller_has_permission` per role; keys restored in `afterAll`).
- AC3 The contact RPC is closed to sessions — test: `src/tests/integration/contactGateway.integration.test.ts`.
- AC4 Server-only `users` columns and the CHECKs hold on the direct path, and the application still writes them — test:
  `src/modules/admin/actions/userProfileFields.integration.test.ts`.
- AC5 An owner cannot change an active listing's content directly; the application edit still moderates — test:
  `src/modules/listings/actions/updateListing.integration.test.ts`.
- AC6 One public rule — test: `src/tests/integration/listingAccessState.integration.test.ts` and `src/modules/listings/lib/__tests__/visibility.test.ts`
  (the TypeScript rule and the SQL predicate are one table).
- AC7 `anon` writes nothing, the bucket is bounded, the duplicate policies are gone, the view lists only rendered columns — test:
  `node scripts/quality/db-catalog-audit.mjs` (I4, I9, I15) and `src/tests/integration/accessHardening.integration.test.ts` (the exact column set of
  `public_user_profiles`).
- AC8 The drift tool fails on drift, and this task adds none — test: `scripts/quality/db-types-drift.test.mjs`; after the apply
  `node scripts/quality/db-types-drift.mjs` shows no difference beyond the 42 of Tasks 978 and 979.
- AC9 The audit tool knows the new function and sees duplicates and INSERT — test: `scripts/quality/db-catalog-audit.test.mjs` (a policy calling
  `caller_has_permission(` passes I5; a definer function off the allow-list fails I3; two PERMISSIVE policies of one table, command and roles with the same
  expressions fail I15, two that differ pass; a session INSERT grant on a server-only `users` column fails I6).
- AC10 Rollback restores the previous catalog — test:
  `node scripts/quality/db-sql-roundtrip.mjs supabase/sql_migrations/task956/v8b.sql supabase/sql_migrations/task956/v8b-rollback.sql`
  exits 0 with LF and CRLF files (run by Opus before the apply, D91) and `scripts/quality/db-sql-roundtrip.test.mjs`.
- AC11 `node scripts/quality/read-coverage.mjs` (each implementer's session), `npm run lint`, `npm run typecheck`, `npm test -- --coverage`,
  `node scripts/quality/check-files.mjs --worktree`, `node --test "scripts/quality/*.test.mjs"`, `node scripts/quality/change-report.mjs main HEAD` exit 0.
- AC12 `pg` 8.23.1 is the only new direct dependency, without an install script, every new lockfile version at least 14 days old — test:
  `node --test scripts/quality/install-scripts.test.mjs`, `node scripts/quality/change-report.mjs --lockfile-age main`, each exit 0, and
  `npm audit --json` lists no advisory for `pg` or a package it brings (the whole tree still holds the advisories of Task 972).
- AC13 The website is typed and shown without its scheme — test: `AdminUserProfile.smoke.test.tsx` and `userWebsite.security.test.ts`.
- AC14 No raw code in the admin banner — test: `AdminUserProfile.smoke.test.tsx` (each code of the two actions translated).
- AC15 No session write to `users` that always fails — test: `authCore.security.test.ts` and the confirm route test.
- AC16 A staff member without `users.create` gets the refusal, never a hang — test:
  `src/modules/admin/actions/__tests__/createAdminUser.security.test.ts` (without the key `{ error: 'forbidden' }` and no Auth admin call; with it the
  account is created as before).
- AC17 `read-coverage.mjs` decides from the repository and the session's own record, never from a spelling — test: `scripts/quality/read-coverage.test.mjs`
  (each proof of Reviews 6 and 7 is a red case: a forged or empty record, a record the session wrote, a 1000-character prefix, the nine command spellings,
  a subagent command before the third pass, a set-back mtime, an `echo` of the generated-file commands, the four commands of F23; a review read set with
  `sheets.json` and `controls.json` stays within the limit; a scratchpad command is no record touch and the only-matching option of grep is read-only).
- AC18 A kickoff's counts, sources and grandfathering hold after design — test: `scripts/quality/check-files.test.mjs` (a wrong count against the named
  commit, a `path:line` source not in that commit, a command source without output, and a revised grandfathered kickoff each fail; a source whose file is
  gone now but is in the commit passes).
- AC19 The preflight stops only on what would fail or leave broken data — test: `src/tests/__tests__/v8bPreflight.test.ts` (row 8 counts only active
  listings with `expires_at is null`; row 16 counts those with `expires_at <= now()` and is named informational; the headers of both files name rows 15
  and 16 as informational; red on the file of 7a027e736), and Opus's rolled-back apply on the live project: rows 1-14 are 0 and row 16 counts the lapsed
  active listings.
- AC20 The catalog snapshot is a committed, generated file — test: `scripts/quality/read-coverage.test.mjs` (8391 lines not read, out of the limit, proved only by
  the session's own `db-catalog-audit.mjs --snapshot supabase/catalog.json` without error; no run, a failed run, an `echo`, another file, `--save` and
  `db-types-drift.mjs` prove nothing; red on c0a948345) and `node scripts/quality/check-files.mjs .claude/rules/flow.md` (stale-path while it is ignored).

## Route

Every session starts from a tree the owner committed locally on this branch (no push) and ends with that commit.
0. Done: Revisions 4a, 4b, 4 (F13, F29), 5 (F30), 6; Reviews 7-10; F5 check; step 5, the owner's apply on bmxkzcxaojgmpgzawwtn (2026-11-16).
6. Done (see "## Review"): `v8b-verify.sql`, AC1-AC8 on the applied catalog, `--save supabase/catalog.json`; AC9, AC11, AC17-AC20: Revision 6 report.
7. Review 11 of Revision 6 in a session of its own (`read-coverage.mjs --review c0a948345`; F3 judged from the step-6 facts); then the owner's commit, push
   and PR (`flow.md` §4).

## Review
Reviews 1-2 (Part A) APPROVED, F1, F2 closed; Review 3 (Part B) NEEDS REVISION 2 of 2, F4, F6-F8 closed; Review 4 LOOP LIMIT, O956-2.
Review 5 (2026-11-16) — F10-F12, AC13-AC15 closed; gates 0 (6589 tests); AC10 0 LF/CRLF/mixed, red without the CRLF block; rolled-back apply: preflight 0
  (row 15 = 1), audit 0, verify 16/16, session INSERT on `users` 42501.
F3 — (open) every sheet whose evidence is AC1-AC7 waits for the apply; the apply's facts are "Step 6" below, judged in Review 11.
F5 — closed (Revision 4 check, see below). F13, F29 — fixed in 7a027e736 (Review 9).
F9 — (process, closed by cause) the three passes were asked over 62 472 lines (`wc -l`); now the read set (`flow.md` §2).
Review 6 (rules and tools, 2026-11-16, session b23abf9c) — F14-F22 found (read-coverage trusted what the session sets; check-files held the kickoff only at
  design); OWASP: OAuth2, Unvalidated_Redirects_and_Forwards are Review 9's.
Review 7 of 993c14088 (Revision 4a, 2026-11-16, session c38a3209) — NEEDS REVISION (O956-2 keeps the work here). Three passes over the 13 files of
  `git diff be5a3d867` (2875 lines); `read-coverage.mjs --review be5a3d867` 3 passes each, exit 1: this session ran `check-files` and `node --test` before its
  passes (a breach, the owner asked for the review in this session) and F24, F27. `node --test "scripts/quality/*.test.mjs"` 0 (200 pass, 3 skip), eslint
  0, check-files 0 (worktree; 33 Sprint 93 kickoffs and the backlog), `owasp.mjs check` 0. 16 deliberate breaks of F14-F18 and F20-F22 each red, restored
  by sha256 (d02f36c80d02, 8ff2a29f63bf); the 9 transcripts of Review 6 exit 2. CI: the quality job checks out with `fetch-depth: 0`
  (`.github/workflows/ci.yml:36`), fetches `+refs/heads/*` (run 43745661716) and runs `check-files --all` (:59); `delete_branch_on_merge` is false.
  F14-F22 closed (F14's rest is F25); the 982 kickoff edit is required by F20 and F21.
F25 — fixed in Revision 4b: the limit and the reviewer's duty are written (O956-3, `flow.md` §3, review-task step 2). F23, F24, F26, F27: fixed there too.
Review 8 of Revision 4b (working tree on 3c002a197, 2026-11-16, session 2c16cac1) — APPROVED. Scope: the 9 files of `git diff 3c002a197` (2491 lines), three
  passes; `read-coverage.mjs --review 3c002a197` exit 0; the implementer's record e573d35b rerun with `--transcript` exit 0; every command of that session
  and both of its scripts (`probe.mjs`, `break.ps1` in `%TEMP%\rc956`) read: none writes the record. Tools: check-ruleset 0, eslint 0, `npm run lint` 0,
  `npm run typecheck` 0, `npm test -- --coverage` 0 (399 files, 6589 tests), changed-lines-coverage 0 (73/73), `check-files --worktree` 0, change-report 0.
  `node --test "scripts/quality/*.test.mjs"` 1 (206 pass, 1 fail: `owasp.test.mjs:287`) and `check-files` on this kickoff 1 (O3 File_Upload,
  Input_Validation): both from upstream OWASP changes this session's `owasp.mjs sync` wrote into `sheets.json` (2 sheets added, 6 changed), not from the
  revision. 5 deliberate breaks (Bash escape, `(`/`{`, bare id, global `-o`, Cause source read now) each red, restored by sha256 (f3caa165fcd1,
  772d9e30e08f). Findings: Critical 0, High 0, Medium 1 (F28, accepted), Low 0.
F28 — Read-only allow-list runs a quoted command word (Medium, Agent and tool output). `scripts/quality/read-coverage.mjs:80` takes a whole segment in
  double quotes as a PowerShell string, but Bash runs it as a command, and PowerShell runs it after `&`: `isReadOnly('"./node_modules/.bin/vitest"')` and
  `isReadOnly('& "node_modules/.bin/vitest.cmd"')` are true; `"pwd"` ran pwd in this session's Bash. Status: accepted by the owner on 2026-11-16 (O956-4,
  translated: "I accept your proposal": a hand-written shell reader cannot be completed, each review found another spelling (F15, F23, F28); the
  allow-list stays an aid, and the reviewer reading every command of the session (O956-3) is the control). The OWASP remap of the 8 changed sheets goes
  to its own pull request from `main` (owner, 2026-11-16). For F13 the admin banner already maps `forbidden` to `save_errors.forbidden`
  (AdminUserProfile.tsx line 214).
Revision 4, F5 check (dfcf2085b, 2026-11-16, session 2c16cac1, Opus). The I6 INSERT grants and I15 of the stopped session 9de8af74 were already in
  `db-catalog-audit.mjs` (lines 124-134, 160-172) and its test; read in full, no change needed. `node --test scripts/quality/db-catalog-audit.test.mjs` 0
  (18 pass); 3 deliberate breaks (INSERT grants ignored, I15 off, operand order not normalised) each red (tests 12, 13, 13), restored byte for byte. Live
  baseline: `node scripts/quality/db-catalog-audit.mjs` 1, 62 findings (I3 1, I4 15, I5 22, I6 17, I7 1, I8 1, I9 2, I15 3); the I15 pair of
  `notifications` is dropped by `v8b.sql`, the `site_settings` pair is not: F29.
Review 9 of 7a027e736 (Revision 4, F13 and F29; 2026-11-16, session fdc173af) — NEEDS REVISION (F30 only; O956-2). Scope: the 7 files of
  `git diff f1a72ef15` (2197 lines), three passes. The first `read-coverage.mjs --review f1a72ef15` exited 1: this session ran a read-only
  `git diff | while read f; do wc -l` before its passes (off the allow-list). Three new passes over the final 11 files cleared the order; the rerun stays
  exit 1 on 4 record touches: the search for the executor's record used `git -C`, `node -e` and `$CLAUDE_CONFIG_DIR` beside `.claude/projects` (reads
  only). Not repairable in this session: Review 10 rereads from f1a72ef15 in a session of its own (Route step 5).
  Executor record found under `~/.claude-account1/` (another account's config folder, not searched first; rule gap closed in `flow.md` §2 step 6 and §3,
  review-task step 2): `--transcript` on the tree of 7a027e736 exit 0; all 89 tool calls read, none writes or names the record (its break ran on a
  `git archive` copy in its scratchpad).
  Tools: check-ruleset 0, `npm run lint` 0, `npm run typecheck` 0, `npm test -- --coverage` 0 (399 files, 6590 tests), changed-lines-coverage 0
  (index.ts 8/8), check-files 0 (the 7 files and this kickoff), change-report 0 (sensitive paths and the two weakened auth suites are from Reviews 5-8).
  `owasp.mjs sync`/`check` 1 and `node --test "scripts/quality/*.test.mjs"` 1 (206 pass, `owasp.test.mjs:287`): the 8 upstream sheets of Review 8, remap
  is its own PR from `main` (owner); `sheets.json` restored to HEAD. Live audit 62 (exit 1, the v8b baseline).
  AC10: `db-sql-roundtrip.mjs` LF 0 and CRLF 0 (234 rows). Rolled-back apply: verify 16/16, audit checks 62 → 0, `site_settings` keeps
  `site_settings_public_read` and the three staff policies; preflight row 8 = 5 (F30).
  Breaks, each restored by sha256: the throwing guard back (AC16 and userAdministration:194 red), the guard removed (2 red), the old userWebsite mock (11
  red), rollback without `site_settings_read` (roundtrip 1), v8b without its drop (audit I15), `next` without `safeNextPath` in callback and confirm (4 red
  each). Files outside "## Read set", accepted: `userAdministration.security.test.ts:193-194` asserts the returned refusal and still no Auth call (same
  strength, the F13 contract); `userWebsite.security.test.ts:42` allows only `users.create`, the key `createAdminUser` now asks (`assertPermission` stayed
  allow-all), no assertion changed. OWASP: OAuth2 and Unvalidated_Redirects_and_Forwards met; Database_Security F5 → F3. Findings: Medium 1 (F30).
F30 — The preflight stops the apply on lapsed active listings (Medium, Business logic). Cause (Revision 5, Read set counted at 7a027e736: `v8b-preflight.sql`
  81 lines, `v8b.sql` 291, `src/tests/__tests__/v8bPreflight.test.ts` new, 40): `v8b-preflight.sql:2` stopped the apply on any row 1-14 above 0, and row 8
  (`:31-32`) counted an active listing whose expiry had passed, the state the one public rule (D72) closes and the application already hides
  (`src/modules/listings/lib/visibility.ts:59-60`, the public queries `:165`); the expiry job changes no listing (`src/app/api/cron/listings-expiry/route.ts:6`,
  D56/D58), so lapsed active listings appear every day: 5 active with `expires_at <= now()` (2026-11-16, all expired 2026-11-15 23:00Z), 0 active with
  `expires_at is null`. Fix: row 8 counts only active listings with no expiry; an informational row 16 counts the lapsed ones; the headers of
  `v8b-preflight.sql` (`:1-4`) and `v8b.sql` (`:4`) name rows 15 and 16 informational. Fixed in Revision 5 (Review 10).
Review 10 of Revision 5 (working tree on 911652197, 2026-11-16, session 86b5cec6) — APPROVED. Scope: the 12 files of `git diff f1a72ef15` (2889 lines),
  three passes; own `read-coverage.mjs --review f1a72ef15` 1: `wc -l $(git diff --name-only …)` ran before them (a substitution, off the allow-list: this
  session's breach), three new passes follow this text. Executor record f730b1d9: `--transcript --review 911652197` 0, all 71 tool calls read, none writes
  or names it. Tools 0: check-ruleset, lint, typecheck, `npm test -- --coverage` (400 files, 6594 tests), changed-lines-coverage, check-files,
  change-report, `node --test` (207 pass, 3 skip); `owasp.mjs sync`/`check` 1 (the 8 upstream sheets of Review 8; `sheets.json` restored by sha256). Live
  audit 62 (baseline). AC10 LF 0, CRLF 0. AC19: 4/4 red on 7a027e736; row 8 put back 1 red, row 16 and the new `v8b.sql` header removed 2 red; rolled-back
  apply: rows 1-14 0, row 16 = 5 (direct count 5), verify 16/16, audit 62 → 0, anon reads 0 lapsed listings. Findings: Critical 0, High 0, Medium 0, Low
  0; risk low.
Step 6 (after the owner's apply on bmxkzcxaojgmpgzawwtn, 2026-11-16). Session 86b5cec6, as the owner reported it: `v8b-preflight.sql` rows 1-14 = 0, row
  15 = 1, row 16 = 5; `v8b-verify.sql` 16/16; `db-catalog-audit.mjs` exit 0 (no finding); AC2-AC7 integration suites 6 files, 74 tests pass
  (`SECURITY_TEST_TARGET=development`, `SECURITY_TEST_PROJECT_REF=bmxkzcxaojgmpgzawwtn`, the project the owner approved); `role_permissions` equal before
  and after; `db-types-drift.mjs` on the snapshot 42 differences. Revision 6 session (Opus, `DATABASE_URL` host of bmxkzcxaojgmpgzawwtn):
  `--save supabase/catalog.json` exit 0, no finding (52 tables, 197 policies, 58 table grants, 26 column grants, 31 functions, 39 checks, 28 triggers, 1
  bucket, 452 columns), 8391 lines, sha256 dd36a4309468; `--snapshot supabase/catalog.json` exit 0, no finding; `db-types-drift.mjs` exit 1, 42
  differences (the count AC8 allows). The gates of AC11 on Revision 6 are in its report (run after its three passes).
