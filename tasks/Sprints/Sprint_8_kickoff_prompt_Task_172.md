# Kickoff prompt — Task 172 (Sprint 8 — schema-drift guard: database.ts ↔ live DB)

> Prevents the `PGRST204` class of bug (a column exists in `src/types/database.ts` but is missing in
> the live `users`/other table → write fails at runtime). The approach is FIXED by the orchestrator
> (see Sprint 8 doc): a Node script parses `database.ts` and emits a SQL audit file that the OWNER
> runs in Supabase. No live DB connection from the script. No new dependencies. Report-only.

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract:
- Do NOT change scope; do NOT introduce architecture beyond what is specified. If anything is
  ambiguous (e.g. an interface→table mapping you cannot determine confidently), STOP and ask the
  orchestrator — do NOT guess a table name.
- Do NOT add any dependency (no `pg`, no DB driver). Do NOT create DB objects (no RPC/function/view).
  Do NOT connect to the database from the script. If you think the task can't be done within these
  limits, STOP and ask.
- Execute AC literally. Update docs/backlog.md + add docs/sessions/2026-05-22-task-172-schema-drift-guard.md.
- 0 new lint/typecheck errors; governance PASS.
- Commit + push. SINGLE `git add -A` (no `^`/backtick continuations). Then `git log -1`, paste real output.
- Concurrency: ensure no other Claude/editor session is editing the repo at the same time.

Pre-read:
- src/types/database.ts (the table interfaces + enum/union types + composite types)
- docs/dependencies.md (confirm: no new deps), docs/env.md, docs/qa-rules.md
- scripts/ (match the existing .mjs script style, e.g. import-locations.js / analyze-eslint-debt.mjs)
- the codebase's `.from('<table>')` / `db.from('<table>')` usages (to derive the interface→table map)

Scope — build a guard with two pieces:

1. `scripts/check-schema-drift.mjs` (Node, ESM, no new deps):
   - Parse `src/types/database.ts` and extract, per DB table, the expected column names from its
     interface. Build an EXPLICIT interface→table-name map (do NOT rely on fragile auto-pluralization).
     Derive it by cross-referencing the interfaces with actual `.from('<table>')` calls in src/.
   - EXCLUDE non-table types: enums/unions (e.g. UserRole, ListingStatus), JSONB-shape interfaces
     (e.g. LocationRequest), and computed/view/composite types (e.g. *WithCount, CollectionWithCount).
     If you are not sure whether an interface maps to a real table, STOP and ask rather than include it.
   - Emit a single SQL file `scripts/schema-drift-check.sql` that, for the mapped tables, compares the
     expected columns (as a VALUES list per table) against `information_schema.columns`
     (table_schema='public') and RETURNS every (table_name, column_name) that is EXPECTED in the types
     but MISSING in the DB. (Optionally include a second result set listing DB columns absent from the
     types, clearly labeled "informational".)
   - The script only WRITES the .sql file and prints a short summary (tables covered, column counts).
     It must be re-runnable (regenerate after any database.ts change).

2. `package.json`: add a script, e.g. `"check:schema-drift": "node scripts/check-schema-drift.mjs"`.

3. Docs: in docs/qa-rules.md (and reference from docs/integrations.md) add a short "Schema drift check"
   section: how to regenerate + run the SQL in Supabase before deploys; note it is owner-run SQL.

4. Run it once: generate the SQL, then RECORD in the session log the list of mapped tables and the
   generated SQL path. (You cannot run the SQL yourself — the OWNER runs it in Supabase. Do NOT
   attempt to connect to the DB.)

Acceptance criteria:
- `npm run check:schema-drift` regenerates `scripts/schema-drift-check.sql` deterministically, no errors.
- The generated SQL is valid Postgres and, when run by the owner, returns expected-but-missing columns
  per table (and the informational extras set, if included).
- Explicit interface→table map; non-table types excluded; no guessed mappings (ambiguities were asked).
- No new dependencies; no DB connection from the script; no DB objects created.
- 0 new lint/typecheck errors; backlog + session log + qa-rules.md updated; commit pushed.

Out of scope:
- Auto-applying migrations or fixing any drift found (owner runs SQL; orchestrator opens follow-ups).
- Switching to `supabase gen types` (separate decision).
- Any runtime/app code change.
```
