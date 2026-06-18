# Session — Task 460: Fix `listing_reports` authenticated table grants

**Date:** 2026-06-18  
**Epic:** BB · **Type:** DB grants fix + grant regression check  
**Executor:** Sonnet 4.6

No UI surface touched; mobile full-width gate N/A — DB/grants-only task.

## Phase 0 — Code audit

### §1 — reportListingAction client (reportListing.ts)
- L37: `const supabase = await createClient()` — **authenticated user-scoped client**
- L40-45: `.from('listing_reports').select('id')...maybeSingle()` — needs **SELECT**
- L49-58: `.from('listing_reports').insert({...})` — needs **INSERT**

### §2 — Admin update client
- L78: `const db = createAdminClient()` — **service_role** (bypasses grants + RLS)
- `updateReportStatusAction` does not use `createClient()` → no authenticated UPDATE needed

### §3 — Migration convention
House style: `scripts/task-<NNN>-<slug>.sql`, idempotent, ends with `notify pgrst, 'reload schema';`. Mirrored from `scripts/task-289-listing-contact-events-anon-revoke.sql`.

### §4 — Grant-check home
No existing grant-check exists. Created `scripts/check-listing-reports-grants.mjs` — static check over SQL source files. Strips comments, normalizes case/whitespace.

### §5 — PK/sequence audit
`ListingReport.id: string` (UUID type, `gen_random_uuid()` default). No `serial`/`nextval` sequence. No additional `USAGE`/`SELECT` sequence grant required.

**Decision: grant INSERT + SELECT to authenticated only. No UPDATE/DELETE. No sequence grant.**

## Deliverables

### Migration: `scripts/task-460-listing-reports-authenticated-grants.sql`
```sql
grant insert, select on table public.listing_reports to authenticated;
notify pgrst, 'reload schema';
```

### Corrected: `scripts/grant-discipline-audit.sql`
- L56: Comment fixed to state `createClient()` (authenticated), not `createAdminClient()`
- L58: Changed `revoke select, insert, update, delete ... from authenticated` → `revoke update, delete ... from authenticated` (keeps INSERT + SELECT)
- L178: Added `grant insert, select on public.listing_reports to authenticated;` (SECTION 3 confirmation)

### Grant regression check: `scripts/check-listing-reports-grants.mjs`
Strips SQL comments + normalizes case/whitespace. Asserts: authenticated INSERT+SELECT present, no un-countered revoke, anon not granted, no overgrant (UPDATE/DELETE/ALL to authenticated). Wired as `npm run check:listing-reports-grants` + blocking CI step in `governance-pr.yml`.

## Planted-violation transcripts

### (a) Missing grant — re-introduced bad revoke
```
❌ listing_reports grant check FAILED:
   Un-countered revoke of INSERT/SELECT from authenticated:
   scripts/grant-discipline-audit.sql → revoke select, insert, update, delete on public.listing_reports from authenticated
```

### (b) Overgrant — `grant all ... to authenticated`
```
❌ listing_reports grant check FAILED:
   Overgrant to authenticated (UPDATE/DELETE/ALL):
   scripts/grant-discipline-audit.sql → grant all on public.listing_reports to authenticated
```

### Restored → PASS
```
✅ listing_reports grant check PASSED — 5 statements scanned across 2 files.
```

## Owner SQL verification (run in Supabase SQL Editor after applying the migration)

```sql
select
  has_table_privilege('authenticated', 'public.listing_reports', 'INSERT') as authenticated_can_insert,
  has_table_privilege('authenticated', 'public.listing_reports', 'SELECT') as authenticated_can_select,
  has_table_privilege('authenticated', 'public.listing_reports', 'UPDATE') as authenticated_can_update,
  has_table_privilege('authenticated', 'public.listing_reports', 'DELETE') as authenticated_can_delete,
  has_table_privilege('anon',          'public.listing_reports', 'INSERT') as anon_can_insert,
  has_table_privilege('anon',          'public.listing_reports', 'SELECT') as anon_can_select;
```

Expected: `authenticated_can_insert=true`, `authenticated_can_select=true`, rest=false.

Production-like acceptance: `npm run build && npm start`, authenticated user → Report → Submit → success toast (or `already_reported` toast if duplicate). No `42501`.

## Verification

- `tsc --noEmit` = 0 errors
- Report-listing tests: 16/16 GREEN
- `check:listing-reports-grants` = PASS
- `node --check scripts/check-listing-reports-grants.mjs` = parses OK
- Planted violations: (a) missing-grant FAIL, (b) overgrant FAIL, restored PASS

## AC self-audit

| AC | Status | Evidence |
|---|---|---|
| AC1 | ✅ | Phase 0 audit: reportListing.ts L37/L40/L49 createClient(); updateReportStatusAction L78 createAdminClient(); UUID PK no sequence grant |
| AC2 | ✅ | `scripts/task-460-listing-reports-authenticated-grants.sql` — grant insert,select; no update/delete/anon; notify pgrst |
| AC3 | ✅ | `scripts/grant-discipline-audit.sql` L56-58 comment fixed + revoke narrowed; L178 grant confirmation added |
| AC4 | ✅ | `check:listing-reports-grants` gate; planted-violation (a) missing-grant FAIL + (b) overgrant FAIL; restored PASS |
| AC5 | ✅ | Registry row updated with Task 460 + grant check command |
| AC6 | ✅ | tsc=0; grant-check PASS; report tests 16/16 GREEN; file-integrity clean |
| AC7 | ✅ | Owner SQL verification + production-like acceptance documented above |
| AC8 | ✅ | `docs/backlog.md` Last Session updated (Task 460 status); session log at `docs/sessions/2026-06-18-task-460-listing-reports-grants.md` |

## Files Changed

| Path | Rationale |
|---|---|
| `scripts/task-460-listing-reports-authenticated-grants.sql` | New: migration granting INSERT+SELECT to authenticated |
| `scripts/grant-discipline-audit.sql` | Fix: removed over-revoke, added grant confirmation |
| `scripts/check-listing-reports-grants.mjs` | New: static grant regression check |
| `package.json` | +1 script: `check:listing-reports-grants` |
| `.github/workflows/governance-pr.yml` | +1 blocking CI step |
| `docs/critical-flow-registry.md` | Registry row updated with Task 460 |
| `docs/backlog.md` | Last Session updated with Task 460 status |
| `docs/sessions/2026-06-18-task-460-listing-reports-grants.md` | This session log |

Self-validation: tsc=0 errors · grant-check=green+planted-fail-proven · report tests=green · file-integrity=clean · scope=DB/grants-only (no UI/middleware/locale) · AC table=all green.
