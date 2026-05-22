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

## Follow-up tasks (opened 2026-05-22)

| Task | Type | Summary | Kickoff |
|---|---|---|---|
| 173 | Sonnet | Add interfaces for the 3 untyped tables (`collection_items`, `favorite_price_alerts`, `report_actions`) + add to `INTERFACE_TABLE_MAP` + regenerate SQL | `Sprint_8_kickoff_prompt_Task_173.md` |
| 174 | **Owner** (SQL) | Run the regenerated 24-table audit; confirm RESULT SET 1 empty; reconcile anything found | `Sprint_8_kickoff_prompt_Task_174.md` |

Task 174 is **blocked by** Task 173 (so the audit covers all 24 tables). 174 is owner-executed —
running SQL is not delegated to Sonnet (single-writer-SQL rule).

## Orchestrator verdict — Task 173 — 2026-05-22 — ✅ APPROVED

Verified against the **object store** (`git show f18d11df7:…`), not the working tree (the index was
transiently re-corrupted during concurrent git access — phantom truncation diff; the file on disk is
intact, confirmed via direct read).

- `CollectionItem` = { collection_id, listing_id, created_at } (composite PK).
- `FavoritePriceAlert` = { user_id, listing_id, last_notified_price, last_notified_at }.
- `ReportAction` = { id, report_id, actor_id, actor_role, old_status, new_status, notes|null, created_at }.
- `INTERFACE_TABLE_MAP` now 24 tables; `schema-drift-check.sql` = 220 columns. **RESULT SET 1 empty**
  (no PGRST204-risk drift across all 24 typed tables). RESULT SET 2 reconciled down to only the
  intentional `listings.search_vector` (tsvector).

Note: commit `f18d11df7`'s message says "217 cols" but the commit actually contains the 220-col
reconciled state (the message predates the reconcile) — content is correct; message is cosmetically
stale, not worth a history rewrite.

## Task 174 result + Sprint 8 closure — 2026-05-22 — ✅ CLOSED

Owner re-ran `scripts/schema-drift-check.sql` after Task 173:
- **RESULT SET 1 (types-expected-but-DB-missing): empty** → no PGRST204-risk drift across all 24 typed tables.
- **RESULT SET 2 (DB-only): only `listings.search_vector`** → the single intentional exclusion (tsvector, queried via `.textSearch()`, never read as a JS value).

The `.git/index` re-corrupted mid-work (concurrent git access; a phantom "truncation" diff on
`database.ts`) was recovered with `Remove-Item .git\index` + `git reset` — confirming no data loss
and re-validating the single-writer git rule. Reinforced lesson: the orchestrator must review with
`git show <sha>:<path>` only — never index-touching `git status`/`git diff` from the sandbox.

**Sprint 8 CLOSED.** Schema-drift guard is in place, all 24 typed tables reconciled.
