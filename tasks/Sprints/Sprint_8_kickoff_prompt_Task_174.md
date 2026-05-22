# Kickoff prompt — Task 174 (Sprint 8 — final schema-drift audit + reconcile) — OWNER-RUN

> **This task is executed by the owner in PowerShell + Supabase, NOT by Sonnet** — running SQL is not
> delegated (single-writer-SQL rule, see docs/orchestrator-role.md "Environment & git safety").
> **Blocked by Task 173** — run only after the guard covers all 24 tables.

## Steps (owner)

1. Regenerate the audit so it covers all 24 tables (after Task 173 is merged):
   ```powershell
   cd D:\Work\Claude_Code_Projects\lero-al
   npm run check:schema-drift      # rewrites scripts/schema-drift-check.sql
   ```

2. Open `scripts/schema-drift-check.sql` and run it in the **Supabase SQL Editor** (read-only).

3. Read the two result sets:
   - **RESULT SET 1 — types-expected-but-DB-missing (the PGRST204 risk).** This is the one that
     matters. **Goal: empty.** Any row here = a column the code/types expect that the live DB lacks;
     a write touching it will fail at runtime (as `users.suspended_until` did).
   - **RESULT SET 2 — DB columns absent from types (informational).** May be intentional
     (DB internals, audit columns) or a missing type — judgment call.

4. Reconcile:
   - For each RESULT SET 1 row → add the column to the live table with the correct type, then reload
     the cache:
     ```sql
     alter table public.<table> add column if not exists <column> <type>;
     notify pgrst, 'reload schema';
     ```
     (Match the type to the TS interface: text→text, number→int/bigint, boolean→boolean,
     string-timestamp→timestamptz.)
   - For RESULT SET 2 rows that are real columns the app should know about → ask the orchestrator to
     open a follow-up to add them to `database.ts` (do not hand-edit types blindly).

5. Re-run the SQL until **RESULT SET 1 is empty**. Then report the outcome to the orchestrator
   (paste both result sets) so the verdict + Sprint 8 closure can be recorded.

## Definition of done

- RESULT SET 1 empty across all 24 typed tables (no PGRST204-risk drift remains).
- RESULT SET 2 reviewed; any genuinely-missing types routed back as a follow-up.
- Outcome reported to the orchestrator.

> Note: the orchestrator (Cowork/Opus) cannot do this — it has no DB access and must not run git/SQL.
> If you'd prefer, paste the column dump and the orchestrator will pre-write the exact ALTER
> statements for you to run.
