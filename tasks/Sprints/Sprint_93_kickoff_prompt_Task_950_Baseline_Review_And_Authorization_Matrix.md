# Task 950 — Baseline secure review of every entry point and a machine-readable authorization matrix

Sprint 93. Priority P1. Owner decisions 2026-11-06: D1 "rewrite the rules of the flow and the gates" on the OWASP
reference; D2 "quality must cover all files in the project, without exceptions". OWASP Secure Code Review asks for a
baseline review of the whole code base at project initiation, for legacy code and after an incident (this project has
had none; Task 926 is an incident: anonymous company creation). OWASP Authorization Regression Testing asks for a
machine-readable actor × resource × action matrix and a required CI check; Next.js Security asks that tests fail when a
new entry point is unclassified. Implementer: Opus (review) then Sonnet (matrix and tests). Reviewer: Opus.
Human owner of the change: the owner. Revision 1 (Opus, 2026-11-06, OWASP re-read): pages and `generateMetadata` are
entry points too, the request gate is `src/proxy.ts` after Task 952, and every table is classified (Multi Tenant
Security: "Fail when a new table has no classification, RLS is disabled, or the expected policy is absent").

## Goal

Today the entry points are guarded by a syntax scan, `src/__tests__/security/serverEntryGuards.test.ts` (235 lines): an
exported function of a `'use server'` file or a `route.ts` handler passes when its body calls a guard name or is in an
allowlist with a reason. It proves that *a* check is called, not *which actor* may do *what* to *which object*; one
allowlist reason is false today (`:93`, "rate limited", Task 926). Measured 2026-11-06: 25 `'use server'` files with
about 94 exported functions, 18 `route.ts` handlers, `src/middleware.ts`. The database policies are not in version
control: `supabase/` holds 21 ad-hoc SQL files under `supabase/sql_migrations/task923|task927/` (23 `create policy`
statements), not the live schema — so no RLS change can be reviewed in a diff (OWASP Infrastructure as Code Security).

After the task: every entry point has a reviewed row in one matrix, every row has a test, a new entry point or policy
fails CI until it is classified, and the live schema with its policies is a reviewed file in the repository.

## Scope

- Baseline review (Opus, `secure-code-review.md` checklists, every category): every Server Action, Route Handler, page and
  `generateMetadata` of a signed-in or staff route, `src/proxy.ts`, every RLS and Storage policy, every service-role use. Findings in the template; each Critical/High
  becomes its own task before the matrix lands.
- `supabase/schema/` — the live schema, functions, grants and policies, dumped read-only (`supabase db dump
  --schema-only` by the owner, or `pg_dump --schema-only` through the read-only role), committed as the baseline;
  `supabase/sql_migrations/` evidence files moved out.
- SQL-02 (`docs/security/audit-2026-11-06/findings.md`): every draft under `supabase/sql_migrations/` whose objects the live
  catalog holds says so in its first line ("APPLIED <date>, see `supabase/schema/`") instead of "PROPOSED — NOT APPLIED";
  a draft never applied keeps its header. New `scripts/quality/sql-headers.mjs` (+ `.test.mjs`) fails on a
  "NOT APPLIED" header whose created objects are present in `supabase/schema/`.
- `src/tests/authz-matrix.json` — rows `{ entry, kind, actor, resource, action, expect, test }` with `actor` in
  anonymous | user | owner | agent | moderator | admin | machine, `expect` allow | deny, `test` a `SEC-…` tag.
- `src/__tests__/security/authzMatrix.test.ts` — enumerates entry points (reusing the scanner of
  `serverEntryGuards.test.ts`) and policies (from `supabase/schema/`), fails on an unlisted one, on a row whose test tag
  does not exist, and on an entry with no deny row for anonymous and for another user. Pages: every `page.tsx` is
  classified public | signed-in | staff; a signed-in page whose first await is not a session guard fails (the
  admin pages keep `staffPage.security.test.ts`). Tables: every table in `supabase/schema/` has RLS enabled and at least
  one policy, or a matrix row saying why not.
- Dependencies: none.
- Out of scope: fixing the findings (separate tasks), UI.

## Attack surface

Unchanged by this task itself (tests and records only); it measures the whole surface. Each finding of the baseline
review gets its own threat model in its own task.


## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — the baseline review lists the abuse cases per entry point in the Review section — AC1.
- Authorization: "Create tests that validate that the permissions mapped out in the design phase are being correctly enforced." — the matrix lists every entry point with its audience; the test fails on a missing row — AC1, AC4.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — a signed-in page that does not await its session guard first fails the matrix test — AC4.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — every non-public row needs its horizontal and vertical deny case — AC4.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — a new unguarded export or a new policy line fails until it has a row — AC3.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — authzMatrix.test.ts ties each row to a test tag that must exist — AC3, AC4.
- Bot_Management_and_Anti-Automation: not applicable — the review records missing limits as findings; the limiter is Task 959.
- Clickjacking_Defense: not applicable — the proxy is read for the matrix; headers are Task 954.
- Content_Security_Policy: not applicable — the proxy is read for its guards only; the script policy is Task 954.
- Credential_Stuffing_Prevention: not applicable — the review records sign-in findings; it changes no sign-in control itself.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the page guards read for the matrix render text through React escaping only; lint (react/no-danger, no-script-url) runs on them — AC5.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — the live schema is versioned so grants and policies are reviewable — AC2.
- Denial_of_Service: not applicable — findings only; limits and argument bounds are Tasks 955 and 959.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — the page guards read for the matrix add no eval, Function, innerHTML or computed URL; lint (no-eval, no-implied-eval) and client-sinks check them — AC5.
- GraphQL: "Ensure that the API has proper access control checks." — the schema in Git includes the policies that also guard the pg_graphql endpoint — AC2.
- HTTP_Headers: not applicable — no header changes; Task 954 owns the response headers.
- HTTP_Strict_Transport_Security: not applicable — no header changes; HSTS stays as headers.ts sets it.
- Injection_Prevention: not applicable — sql-headers.mjs only reads the SQL files as text and runs no query or command.
- OS_Command_Injection_Defense: "The primary defense is to avoid calling OS commands directly." — sql-headers.mjs reads files with Node APIs and starts no process — AC6.
- Input_Validation: not applicable — argument validation is Task 955; the matrix records which entry points have it.
- Insecure_Direct_Object_Reference_Prevention: "implement access control checks for each object that users try to access" — each owner-scoped row carries an other-user deny case — AC4.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL security-extended (CI) run on every changed file — AC5.
- Mass_Assignment: not applicable — the review records findings; column grants are changed by Task 956, not here.
- Multi_Tenant_Security: "Treat client-supplied tenant identifiers as selectors only." — a table with RLS off or without a policy fails unless its row explains it — AC4.
- Nextjs_Security: "Rendering the form only on a protected page does not authenticate the action request." — each Server Action is a row whether or not a protected page renders its form — AC1, AC3.
- Prototype_Pollution_Prevention: not applicable — the matrix test parses source with the TypeScript tree; no request object is merged.
- Query_Parameterization: not applicable — no query is written by this task; the dumped schema is read, not executed.
- REST_Security: "the access control decision should be taken locally by REST endpoints" — each route handler is a matrix row with its own deny cases — AC1.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input: Opus reruns every acceptance command in review — AC5.
- SQL_Injection_Prevention: not applicable — the task reads the schema and adds no query; queries stay parameterized PostgREST calls.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC5.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the page guards read for the matrix use no innerHTML; lint (react/no-danger) fails on one — AC5.
- Web_Service_Security: not applicable — no service contract changes; the review only lists the existing endpoints.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 `src/__tests__/security/authzMatrix.test.ts` fails while any entry point of the baseline review lacks a matrix
  row; the review itself is in this kickoff's "Review" section (summary template, one row per entry point with its
  audience and verdict, findings in the template, each Critical/High filed as a numbered task).
- AC2 `supabase/schema/` holds the live schema; `node scripts/quality/check-files.mjs supabase/schema` exits 0.
- AC3 `npx vitest run src/__tests__/security/authzMatrix.test.ts` passes; adding an unguarded exported function to a
  `'use server'` file, or a policy line to the schema, makes it fail (deliberate break shown, then removed).
- AC4 `src/__tests__/security/authzMatrix.test.ts` also fails when a row's test tag exists in no test file, or a
  non-public entry point lacks its horizontal (other user) or vertical (lower role) deny row, an unclassified
  `page.tsx` exists, a signed-in page does not await a session guard first, or a table has RLS disabled or no policy
  without a row (deliberate break of each shown, then removed).
- AC6 No applied SQL file claims it is not applied (SQL-02) — test: `scripts/quality/sql-headers.test.mjs` (new: a planted
  "NOT APPLIED" header over an object of the schema fails; the repository passes).
- AC5 `npm run lint`, `npm run typecheck`, `npm test`, `node scripts/quality/check-files.mjs --worktree` exit 0.

## Route

1. Opus: baseline review, findings filed, matrix rows drafted in the review.
2. Owner: run the read-only schema dump (command in the handoff: where to run it, what it changes — local file only).
3. Sonnet: `authz-matrix.json`, `authzMatrix.test.ts`, the missing deny tests for existing entry points.
4. Run AC2–AC6. Report each command, exit code, relevant output, and the deliberate-break output.

## Review
