# Kickoff prompt — Task 173 (Sprint 8 — add interfaces for 3 untyped tables; extend drift guard)

> Review of Task 172 found three tables the code queries via `.from()` that have **no interface** in
> `src/types/database.ts` — so they are untyped in code AND invisible to the schema-drift guard:
> `collection_items`, `favorite_price_alerts`, `report_actions`. Add accurate interfaces and bring
> them under the guard.

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract:
- Do NOT change scope; no new architecture; if a table's columns cannot be determined from code,
  STOP and ask the orchestrator (do NOT invent columns).
- Do NOT connect to the DB; do NOT add dependencies.
- Execute AC literally. Update docs/backlog.md + add docs/sessions/2026-05-22-task-173-untyped-tables.md.
- 0 new lint/typecheck errors; governance PASS.
- Commit + push. SINGLE `git add -A` (no `^`/backtick continuations). Then `git log -1`, paste real output.
- Concurrency: ensure no other Claude/editor session edits the repo simultaneously.

Pre-read:
- Every `.from('collection_items')`, `.from('favorite_price_alerts')`, `.from('report_actions')`
  call in src/ — and the `.select(...)`, `.insert({...})`, `.update({...})`, `.upsert({...})`,
  `.eq(...)`, `.order(...)` around them. These reveal the columns the code relies on.
- src/types/database.ts — match the existing interface style (e.g. Collection, Favorite, ListingReport).
- scripts/check-schema-drift.mjs — the INTERFACE_TABLE_MAP to extend.

Scope:
1. Derive each table's columns from CODE USAGE (the select/insert/update/eq/order references above)
   and add a TypeScript interface per table to src/types/database.ts:
     - `collection_items`     → interface `CollectionItem`
     - `favorite_price_alerts`→ interface `FavoritePriceAlert`
     - `report_actions`       → interface `ReportAction`
   Use correct TS types inferred from usage (string for ids/text, number for ints, boolean, string
   for timestamps as elsewhere in this file, `| null` where the code treats a value as nullable).
   Include only columns you can justify from code; if a table's usage is too sparse to define a
   meaningful interface, STOP and ask rather than guessing.
2. Add the three interfaces to `INTERFACE_TABLE_MAP` in scripts/check-schema-drift.mjs and remove any
   now-stale "excluded" note for them.
3. Run `npm run check:schema-drift` to regenerate scripts/schema-drift-check.sql (now 24 tables) and
   confirm it runs clean. Record the new table/column counts in the session log.

Acceptance criteria:
- Three interfaces added, matching existing style; no `any`.
- INTERFACE_TABLE_MAP covers all 24 tables that src/ queries via `.from()`.
- `npm run check:schema-drift` regenerates the SQL deterministically (24 tables), no errors.
- 0 new lint/typecheck errors; backlog + session log updated; commit pushed.
- The generated SQL's RESULT SET 2 (informational) will reveal any columns these tables have that
  code usage didn't surface — note in the session log that the owner will reconcile via Task 174.

Out of scope:
- Connecting to the DB or running the SQL (owner — Task 174).
- Refactoring code that uses these tables; any migration.
```
