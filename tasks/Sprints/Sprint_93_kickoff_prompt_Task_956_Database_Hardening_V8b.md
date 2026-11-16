# Task 956 — Hardening v8b: the database enforces the moderator keys, the contact gateway, the profile bounds, edit moderation and one public-listing rule

Sprint 93. Priority P0. Owner decisions: D1, D53/R74, D72, D77/D79/D80, R75, D91, O956-1, O956-2 (2026-11-15, "everything
must be fixed in the current task"), 2026-11-16 (cause rule; the rules and tools ship here). Filed by the audit
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

- F14-F22 (Review 6 gives each with its source and proof): `scripts/quality/read-coverage.mjs` takes what decides its
  verdict from what the session controls: membership from modification time (`read-coverage.mjs:271-272`), the order
  from command spellings (:47), the generated-file proof from any command text (:302), reads from any record it is
  pointed at (:223); `scripts/quality/check-files.mjs` holds counts, sources and grandfathering only at design
  (:385-386, :84, :81); `.claude/skills/review-task/SKILL.md:8-10` writes OWASP files into the reviewer's read set and
  `.claude/rules/secure-code-review.md:16-19` still asks for the whole branch.
Fix: membership by content against a committed base (each session starts from a tree the owner committed locally; a
reviewer names the revision's base with `--review <commit>`, an ancestor of HEAD); every shell command, subagent
records included, is a run or a change unless on a read-only allow-list; the generated-file proof is the tool's own
invocation with a result that is not an error; only the running session's record or one the reviewer names, never
empty, never written by the session; whole lines only; `sheets.json` (written by `owasp.mjs sync`) is a generated
file and JSON data files are read by their changed objects; the Read set names the commit it was counted at and every
count is checked against it; a `path:line` source exists with that line, a command source carries its quoted output;
a grandfathered kickoff whose sha256 differs from the one recorded at grandfathering is held to the rule.
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
  checks of `check-files.mjs`, with their tests. Revision 4a (Opus): the F14-F22 fix in the files of "## Read set", and
  two gaps its sessions met: execute-task step 8 named `CLAUDE_CODE_SESSION_ID`, which `read-coverage.mjs` holds as
  touching the record; no rule said that a session that changes nothing counts its runs from its first command.
- Revision 4, Opus: F5 in `db-catalog-audit.mjs` and its test (they hold unreviewed edits of the stopped session
  9de8af74). Revision 4, Sonnet: F13 in `createAdminUser` and its test. Their read set replaces the one below when
  Revision 4a is approved.
- Out of scope: application reveal limits, uploads (957), the rest of v8b (962), hand types (978), `parking` (979),
  public profiles (980), the unused admin create form (982).

## Read set
Counted at be5a3d867
- `scripts/quality/read-coverage.mjs` — 315 lines
- `scripts/quality/read-coverage.test.mjs` — 193 lines
- `scripts/quality/check-files.mjs` — 631 lines
- `scripts/quality/check-files.test.mjs` — 341 lines
- `.claude/rules/flow.md` — 172 lines
- `.claude/rules/kickoff-template.md` — 93 lines
- `.claude/rules/secure-code-review.md` — 163 lines
- `CLAUDE.md` — 102 lines
- `.claude/skills/review-task/SKILL.md` — 52 lines
- `.claude/skills/create-task/SKILL.md` — 44 lines
- `.claude/skills/execute-task/SKILL.md` — 35 lines

## Attack surface

Changed: the data layer every direct PostgREST call meets (all session roles), and the agent's self-review record.
T1 a moderator without a key writes through PostgREST (key in the policy); T2 contact scraping, expired listings and
profile flags read directly (revoke, one public rule, fewer view columns); T3 profile columns, unbounded text,
unmoderated edits (grants, CHECKs, trigger); T4 a refused legitimate write (preflight, admin-client writes, integration
suites); T5 a session that satisfies its own read check (AC17). Matrix: per I5 table and command, anon, user, owner,
moderator with and without the key, admin, blocked account.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- AI_Agent_Security: "Fail closed when risk classification, approval validation, policy lookup, or audit logging fails." — `read-coverage.mjs` fails when the session record is missing, empty, not the session's own or written by the session, and decides nothing from what the session can set — AC17.
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
- AC17 `read-coverage.mjs` cannot be satisfied by what the session sets — test: `scripts/quality/read-coverage.test.mjs`
  (each proof of Review 6 is a red case: a forged or empty record, a record the session wrote, a 1000-character prefix,
  each of the nine command spellings and a subagent command before the third pass, a set-back mtime, an `echo` of the
  three generated-file commands; a review read set with `sheets.json` and `controls.json` stays within the limit).
- AC18 A kickoff's counts, sources and grandfathering hold after design — test: `scripts/quality/check-files.test.mjs`
  (a wrong count against the named commit, a missing `path:line` source, a command source without output, and a
  revised grandfathered kickoff each fail).

## Route

Every session starts from a tree the owner committed locally on this branch (no push) and ends with that commit.
0. Done: Review 6 (rules and tools), F14-F22.
1. Revision 4a, Opus, own session: AC17-AC18 tests first (red), the F14-F22 fix, three passes, `read-coverage.mjs` 0,
   the gates; the Read set line names its commit.
2. Review 7, Opus, own session: `read-coverage.mjs --review <commit before step 1>`; on approval the Read set becomes that of steps 3 and 4.
3. Revision 4, Opus (F5) and 4. Revision 4, Sonnet (F13), each in its own session, one after the other.
5. Review 8, Opus, own session: `--review <commit before step 3>`; the gates; AC10 LF and CRLF; `v8b-verify.sql` in a
   rolled-back apply; OAuth2 and Unvalidated_Redirects_and_Forwards in `Task_956.json`; the verdict; the apply step.
6. After the owner's apply: `v8b-verify.sql`, AC1-AC11, `--save supabase/catalog.json`.

## Review
Reviews 1-2 (Part A) APPROVED, F1, F2 closed; Review 3 (Part B) NEEDS REVISION 2 of 2, F4, F6-F8 closed; Review 4 LOOP LIMIT, O956-2.
Review 5 (2026-11-16) — F10-F12, AC13-AC15 closed; gates 0 (6589 tests); AC10 0 LF/CRLF/mixed, red without the CRLF
block; rolled-back apply: preflight 0 (row 15 = 1), audit 0, verify 16/16, session INSERT on `users` 42501.
F3 — (open) every sheet whose evidence is AC1-AC7 waits for the apply.
F5 — (P2, open, Opus) and F13 — (P3, open, Sonnet): see "## Cause"; Revision 4.
F9 — (process, closed by cause) the three passes were asked over 62 472 lines (`wc -l`); now the read set (`flow.md` §2).
Review 6 (rules and tools, Route step 0, 2026-11-16, session b23abf9c) — facts: `read-coverage.mjs --files-since
  2026-11-16T05:50:00Z` exit 0 (17 files, 2823 lines, 3 passes each; `db-catalog-audit.mjs` and its test came in by
  mtime: session 9de8af74 ran Route step 1 at the same time, last write 06:37:21Z, stopped by the owner); README.md read
  in full. `owasp.mjs sync`/`check` 1/1 (Kubernetes_Security, Multi_Tenant_Security changed upstream: managed-cluster
  and SQLAlchemy text, no new requirement here), remapped in `controls.json`, then 0/0. `node --test
  "scripts/quality/*.test.mjs"` 0 (176 pass, 3 skip: no BASE_URL); eslint on the four tool files 0; check-files 0 on
  the 20 changed files and on the 32 Sprint 93 kickoffs. 23 deliberate breaks (11 read-coverage, 12 check-files) each
  red, sha256 restored. Record: AI_Agent_Security F14, LLM_Prompt_Injection_Prevention met, MCP_Security not applicable.
  `owasp.mjs review <kickoff> --base main` exit 1: no verdict for OAuth2 and Unvalidated_Redirects_and_Forwards, which
  the diff against main (94 files) triggers; their verdicts are Route step 3's.
F14 — (P2, open, Opus) read-coverage trusts any record: `--transcript` takes any file (`read-coverage.mjs:223`), any
  JSON line counts as a Read (:71-102), so forged reads exit 0, a record that wrote nothing has an empty read set and
  exits 0 (:307), and 1000 characters count as reading a 37 210-character line (:108; Read here shows whole lines).
  Contradicts `flow.md:118` and `read-coverage.mjs:13-14`. Fix: the read set does not come from the record (F16); only
  the running session's record or one the reviewer names is read; the prefix branch goes.
F15 — (P2, open, Opus) the order rule knows only the spellings of GREEN_RUN (`read-coverage.mjs:47`): `npx eslint`,
  `npx tsc`, `npm t`, `npm run-script test`, `node --experimental-vm-modules --test`, a direct vitest path,
  `check-files.mjs --worktree`, `npm run check:*`, `owasp.mjs gate` before the third pass exit 0; subagent commands
  are in `<session>/subagents/agent-*.jsonl` (session 1450b70d: 38 Bash calls there, 0 sidechain lines in the parent),
  never read (:206-216). Contradicts `CLAUDE.md:63-64`, `flow.md:119-120`. Fix: every shell command in the window is
  a run unless read-only by an allow-list; the session's subagent records are read.
F16 — (P2, open, Opus) membership by modification time (`read-coverage.mjs:271-272`): a shell-written file whose
  mtime is set back leaves the author's and the reviewer's read set (probe file absent, its twin present, both
  deleted), and another session's writes enter it (9de8af74 reset this review's passes). Fix: membership by content
  against the revision's recorded base, not by mtime.
F17 — (P3, open, Opus) the generated-file rule takes any command containing the three names
  (`read-coverage.mjs:302`): `echo change-report.mjs --lockfile-age install-scripts.test.mjs npm audit` exits 0.
  Fix: the tool's own invocation, with a result that is not an error.
F18 — (P2, open, Opus) `review-task/SKILL.md:8-10` (and create-task step 1) runs `owasp.mjs sync` and the remap before
  the passes; `sheets.json` (967 lines) and `controls.json` (2287) then join the read set (`read-coverage.mjs:271`):
  3790 lines, exit 1, until `sheets.json` was put back to HEAD bytes. Fix: the files `owasp.mjs` writes are checked by
  `owasp.mjs check` as generated files, or sync and remap run after `read-coverage.mjs`.
F19 — (P2, open, Opus) `secure-code-review.md:16-19` has the reviewer read every file of `git diff main...HEAD` (F9:
  62 472 lines); `review-task/SKILL.md:25` and `flow.md:134` only the read set, and `flow.md:137-138` sends the
  reviewer to `secure-code-review.md`. Fix: §1.4 names the read set and what covers the rest of the branch.
F20 — (P3, open, Opus) Read set counts are compared only while "## Review" is empty (`check-files.mjs:385-386`, :395),
  so a revision's never are: 242 and 134 above match neither HEAD (203, 98) nor the files now (265, 178), and counts
  1 and 5 for the 1022- and 92-line files pass. Contradicts `check-files.mjs:371-372`, `flow.md:92-93`. Fix: the
  revision under design is checked until its review is written.
F21 — (P3, open, Opus) the "## Cause" source is a pattern (`check-files.mjs:84`, :378) and kickoffs skip the
  stale-path check (:189): `src/nope/does-not-exist.ts:1`, or a `grep` with no output, passes. Fix: a `path:line`
  source exists with that line; a command source carries its quoted output.
F22 — (P3, open, Opus) "until next revised" (`kickoff-template.md:5`, `check-files.mjs:78-79`) has no check: the list
  (:81) is fixed and the 962 kickoff with an added revision line passes without both sections. Fix: a listed kickoff
  that differs from HEAD is held to them.
