# Task 950 — Baseline secure review of every entry point and a machine-readable authorization matrix

Sprint 93. Priority P1. Owner decisions 2026-11-06: D1 "rewrite the rules of the flow and the gates" on the OWASP
reference; D2 "quality must cover all files in the project, without exceptions". OWASP Secure Code Review asks for a
baseline review of the whole code base at project initiation, for legacy code and after an incident (this project has
had none; Task 926 is an incident: anonymous company creation). OWASP Authorization Regression Testing asks for a
machine-readable actor × resource × action matrix and a required CI check; Next.js Security asks that tests fail when a
new entry point is unclassified. Implementer: Opus (review) then Sonnet (matrix and tests). Reviewer: Opus.
Human owner of the change: the owner.

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

- Baseline review (Opus, `secure-code-review.md` checklists, every category): every Server Action, Route Handler, the
  middleware, every RLS and Storage policy, every service-role use. Findings in the template; each Critical/High
  becomes its own task before the matrix lands.
- `supabase/schema/` — the live schema, functions, grants and policies, dumped read-only (`supabase db dump
  --schema-only` by the owner, or `pg_dump --schema-only` through the read-only role), committed as the baseline;
  `supabase/sql_migrations/` evidence files moved out.
- `src/tests/authz-matrix.json` — rows `{ entry, kind, actor, resource, action, expect, test }` with `actor` in
  anonymous | user | owner | agent | moderator | admin | machine, `expect` allow | deny, `test` a `SEC-…` tag.
- `src/__tests__/security/authzMatrix.test.ts` — enumerates entry points (reusing the scanner of
  `serverEntryGuards.test.ts`) and policies (from `supabase/schema/`), fails on an unlisted one, on a row whose test tag
  does not exist, and on an entry with no deny row for anonymous and for another user.
- Dependencies: none.
- Out of scope: fixing the findings (separate tasks), UI.

## Attack surface

Unchanged by this task itself (tests and records only); it measures the whole surface. Each finding of the baseline
review gets its own threat model in its own task.

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
  non-public entry point lacks its horizontal (other user) or vertical (lower role) deny row.
- AC5 `npm run lint`, `npm run typecheck`, `npm test`, `node scripts/quality/check-files.mjs --worktree` exit 0.

## Route

1. Opus: baseline review, findings filed, matrix rows drafted in the review.
2. Owner: run the read-only schema dump (command in the handoff: where to run it, what it changes — local file only).
3. Sonnet: `authz-matrix.json`, `authzMatrix.test.ts`, the missing deny tests for existing entry points.
4. Run AC2–AC5. Report each command, exit code, relevant output, and the deliberate-break output.

## Review
