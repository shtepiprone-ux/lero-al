# Sprint 8 — Schema Integrity (types ↔ DB drift guard)

> Opened 2026-05-22 by the Opus 4.7 orchestrator. Root cause of the profile-save outage (Task A /
> `PGRST204`): `src/types/database.ts` is hand-maintained and migrations are applied by hand in
> Supabase, so the two drift — a column can exist in the types but be missing in the live DB. The
> `users` table was reconciled manually; this sprint adds a repeatable guard so the next drift is
> caught before it reaches runtime.

## Decision (orchestrator) — approach is fixed, do NOT re-architect

The project depends on **`@supabase/supabase-js` only** (no `pg`, no direct DB connection string in
env). PostgREST cannot read `information_schema` directly. So the guard is a **codegen + owner-run
SQL** design, not a live-connecting script:

1. A Node script parses the table interfaces in `database.ts` and emits a single **SQL audit file**.
2. The **owner** runs that SQL in Supabase (single-writer-SQL rule) — it returns every column that
   the types expect but the live DB is missing.

This needs **no new dependency, no DB credentials in the script, and creates no DB objects.**

## Task

| Task | Summary | Kickoff |
|---|---|---|
| 172 | Schema-drift guard: parse `database.ts` → emit owner-run SQL audit; run once; document | `Sprint_8_kickoff_prompt_Task_172.md` |

## Out of scope

- Auto-applying migrations (owner only).
- Adding `pg`/any DB driver, or creating RPC/DB objects to self-query `information_schema`.
- Switching to generated types (`supabase gen types`) — a separate, larger decision deferred for now.
- Fixing whatever drift the audit finds (owner applies the SQL; orchestrator opens follow-ups if needed).

## Orchestrator verdict — 2026-05-22 — ✅ APPROVED (Task 172)

Reviewed commits `7fbaec360` + `26769ebea` (script + generated SQL + the reconciliation it produced).

- `scripts/check-schema-drift.mjs`: no new deps (fs/url/path only); explicit 21-table
  `INTERFACE_TABLE_MAP`; brace-matched parser; deterministic regen; prints a summary.
- Map names verified against actual `.from('<table>')` usage in `src/` — all 21 are real table
  names, so no false-positive floods. Non-table types (enums, `LocationRequest`, `CollectionWithCount`)
  correctly excluded.
- `scripts/schema-drift-check.sql`: two valid, read-only result sets — (1) types-expected-but-DB-missing
  (PGRST204 risk), (2) informational DB-only columns. `package.json` script added; qa-rules/integrations
  documented.
- The guard already earned its keep: it surfaced `users.inactivity_warning_sent_at` (DB col absent from
  types) → reconciled in `26769ebea`.

**Review finding (NOT a Task 172 defect — pre-existing gap):** three tables the code queries via
`.from()` have **no interface** in `database.ts` and are therefore untyped in code AND invisible to the
drift guard: `collection_items`, `favorite_price_alerts`, `report_actions`. Recommend a follow-up
(Task 173) to add interfaces for them, after which they should be added to `INTERFACE_TABLE_MAP`.

**Open question for owner:** when you ran `schema-drift-check.sql`, did **RESULT SET 1**
(types-expected-but-DB-missing) come back **empty**? If yes, all 21 typed tables are free of the
PGRST204-risk drift. (Result set 2 already produced the `inactivity_warning_sent_at` fix.)
