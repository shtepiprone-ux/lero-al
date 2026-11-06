# Epic S — kickoff prompts (Domain Numeric IDs)

> Tasks 203–204. Shared hard contract: no scope change; no invented architecture; literal AC; update
> docs/backlog.md + docs/sessions/; 0 new lint/typecheck errors; governance PASS; locale parity
> sq/en/uk/it; responsive where UI; Global Change Verification Rule; commit + single `git add -A` then
> `git log -1`. **Owner runs all git AND all SQL.**
>
> ⚠️ HIGH-RISK / SCHEMA-BEARING. Both tasks must **STOP and confirm the approach with the orchestrator
> before writing any migration.** Recommended: add an ADDITIONAL numeric public id (sequence) shown to
> users, leaving internal UUID PKs, foreign keys, RLS and URLs intact — do NOT swap the PK casually.
> Update src/types/database.ts + the schema-drift INTERFACE_TABLE_MAP for any new/changed column.

## Task 203 — S.1 — Numeric user IDs, visible in cabinet & admin (Note 24)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top) + STOP-before-migration.
Pre-read: docs/domain-rules.md, docs/data-access-rules.md, docs/rls-rules.md, Sprint 8 schema-drift docs;
src/types/database.ts; src/components/admin/AdminUsersTable.tsx; src/app/admin/users/[id]/page.tsx;
src/app/[locale]/cabinet/page.tsx.
Scope: give each user a numeric, letter-free PUBLIC id (recommended: a `public_id` sequence, NOT replacing
the UUID PK). Show it in admin Users and the user's own cabinet. Confirm the approach with the orchestrator
before migrations.
Acceptance criteria:
- Each user has a stable numeric public id, shown in admin Users + cabinet; internal relationships/RLS/URLs
  unaffected; approach confirmed before SQL.
- Idempotent SQL in session log (owner runs it); database.ts + drift map updated.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.
Out of scope: listing IDs (204).
```

## Task 204 — S.2 — Listing IDs → numeric (Note 25)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top) + STOP-before-migration.
Pre-read: S.1; docs/domain-rules.md; Task 153 session log (listing URL / ?location_id strategy);
src/types/database.ts; listing URL building in src/app/[locale]/listings/[slug]/page.tsx.
Scope: replace the mixed (letters+digits) listing identifier shown to users with a numeric one
(recommended: numeric `public_id`, preserving internal keys + the slug/URL contract). Confirm approach
before migrations; add redirects for old URLs if the public URL changes.
Acceptance criteria:
- Listings expose a numeric public id; URL/slug contract preserved (or deliberately migrated, confirmed);
  redirects for old URLs if needed.
- Idempotent SQL in session log (owner runs it); database.ts + drift map updated.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.
Out of scope: user IDs (203).
```
