# Epic S — Domain Numeric IDs

**Status:** OPEN — opened 2026-05-22 by the Opus 4.7 orchestrator.
**Source notes:** issues.txt #24 (admin Users: assign a numeric, letter-free ID; user sees it in their cabinet), #25 (change listing IDs from mixed to numeric).
**Kickoffs:** `Epic_S_kickoff_prompts.md` (Tasks 203–204).

> ⚠️ **Schema-bearing, high-risk.** Both tasks change identifiers that are likely primary keys / used in
> URLs, RLS, foreign keys, and external links. Do NOT replace the underlying UUID PK casually. The
> recommended approach is an ADDITIONAL human-facing numeric id (e.g. a `serial`/sequence "public_id")
> shown to users, leaving internal UUID relationships intact — but the executor must STOP and confirm
> the approach with the orchestrator before writing migrations. Coordinate ALL SQL with the owner
> (single-writer-SQL rule) and update `database.ts` + the schema-drift map.

## Goal

Users and listings have clean, human-facing numeric IDs (no letters), visible where the owner expects
(cabinet, admin), without breaking internal relationships, URLs, or RLS.

## Dependencies

- `src/types/database.ts` (id types), schema-drift guard (Sprint 8), RLS (`docs/rls-rules.md`),
  listing URL/slug strategy (Epic J Task 153), admin Users (`src/components/admin/AdminUsersTable.tsx`,
  `src/app/admin/users/[id]/page.tsx`), cabinet (`src/app/[locale]/cabinet/page.tsx`).

## Tasks

### Task 203 — S.1 — Numeric user IDs, visible in cabinet & admin (Note 24)

**Type:** feature (schema-bearing)
**Priority:** medium
**Area:** users identity, admin Users, cabinet

**Pre-read:**
1. docs/backlog.md, docs/ai-behavior.md (Domain Integrity Rules)
2. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md
3. docs/data-access-rules.md, docs/domain-rules.md, Sprint 8 schema-drift docs
4. `src/types/database.ts`, `src/components/admin/AdminUsersTable.tsx`, `src/app/admin/users/[id]/page.tsx`,
   `src/app/[locale]/cabinet/page.tsx`

**Localization coverage:** sq, en, uk, it (any "User ID" label).
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560.

**Goal:** Give each user a numeric, letter-free public ID, shown in admin Users and in the user's own
cabinet. **STOP and confirm the approach with the orchestrator before migrations** — recommended: an
additional `public_id` sequence, not replacing the UUID PK.

**Acceptance criteria:**
- Each user has a stable numeric public ID; shown in admin Users + cabinet.
- Internal relationships/RLS/URLs unaffected (approach confirmed before SQL).
- SQL coordinated with owner; `database.ts` + schema-drift map updated.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** listing IDs (S.2).

### Task 204 — S.2 — Listing IDs → numeric (Note 25)

**Type:** feature (schema-bearing)
**Priority:** medium
**Area:** listings identity + URLs

**Pre-read:** S.1; docs/domain-rules.md, Task 153 session log (listing URL/`?location_id=` strategy),
`src/types/database.ts`, listing URL building in `src/app/[locale]/listings/[slug]/page.tsx`.
**Localization coverage:** sq, en, uk, it (any visible ID label).
**Responsive coverage:** all 7 breakpoints.

**Goal:** Replace the mixed (letters+digits) listing identifier shown to users with a numeric one.
**STOP and confirm the approach with the orchestrator before migrations** — recommended: a numeric
`public_id`, preserving internal keys and the existing slug/URL contract.

**Acceptance criteria:**
- Listings expose a numeric public ID; URL/slug contract preserved (or migrated deliberately, confirmed).
- SQL coordinated with owner; `database.ts` + schema-drift map updated; redirects for old URLs if needed.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** user IDs (S.1).

## Epic-level acceptance

Users and listings have human-facing numeric IDs, visible where expected, with internal relationships,
RLS, and URLs intact.
