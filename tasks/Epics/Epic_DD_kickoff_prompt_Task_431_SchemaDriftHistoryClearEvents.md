# Task 431 — Register `history_clear_events` in the schema-drift guard (Epic DD follow-up)

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus 4.8.
> **Origin:** Task 246 (Epic DD.1 — admin clear user-profile change history) shipped a new
> `history_clear_events` audit table + `HistoryClearEvent` interface in `src/types/database.ts`,
> but did NOT register it in the schema-drift guard (`scripts/check-schema-drift.mjs`). Task 246's
> session log flagged this as a candidate follow-up. This task closes it, mirroring **Task 430**
> (which did the identical registration for `listing_inquiries`).
> **Type:** schema-drift tooling / SQL-snapshot regeneration. **No UI, no runtime code, no locales.**

---

## Pre-read (rule-index → schema/tooling task — load ONLY these)

**Always required:**
- `docs/agent-contract.md` (P0 clauses 1–14)
- `docs/backlog.md`

**Required for this task:**
- `docs/qa-rules.md` → "Schema drift check" section (what the guard is for, how it's run)
- `docs/data-access-rules.md` (PostgREST `.from()` access patterns — relevant to the inclusion decision below)
- `scripts/check-schema-drift.mjs` (the file you are editing — read it in full first)
- `scripts/schema-drift-check.sql` (the generated artifact you will regenerate — read the current header counts)
- `docs/sessions/2026-06-15-task246-admin-clear-history.md` (the SQL that created the table — Section 1; the `HistoryClearEvent` interface shape)

Do NOT load UI / responsive / Storybook / i18n docs — none apply.

---

## Context — why this is a real decision, not a rote add

The map's own header comment states interfaces are included only when **confirmed via a `.from('<table>')` call in `src/`**. `history_clear_events` does **NOT** meet that literal criterion:

- The audit row is inserted **inside the `clear_user_history()` Postgres function** (SECURITY DEFINER), invoked from `src/modules/admin/actions/clearHistory.ts` via `db.rpc('clear_user_history', {...})`.
- There is **no `.from('history_clear_events')`** anywhere in `src/` — confirmed: the only references are the RPC call (`clearHistory.ts:28`) and a comment (`clearHistory.ts:10`).
- Therefore a column drift on `history_clear_events` would **not** produce a PGRST204 in app code (the table is never touched through PostgREST) — it would surface as a Postgres error *inside the function* instead.

**Owner/orchestrator decision (do NOT re-litigate, do NOT silently widen):** register it anyway, for **drift coverage**, consistent with (a) the Task 430 governance direction that every typed DB table belongs in the guard, and (b) the existing **Task 265 precedent** in the same map comment (the `listings.search_vector` column was added for coverage even though it is never SELECT-projected). Because this inclusion is an **exception to the ".from()-confirmed" rule**, you MUST document the reason in the map's header comment (see AC2) — exactly as Task 265's exception is documented there. This keeps the `HistoryClearEvent` TypeScript interface and the live `history_clear_events` table in lockstep and means a future direct-read consumer (e.g. an admin audit viewer) inherits drift protection for free.

`HistoryClearEvent` (`src/types/database.ts:112-123`) has **10 fields**: `id`, `actor_user_id`,
`entity_type`, `entity_id`, `history_source`, `clear_scope`, `cleared_row_ids`,
`cleared_row_count`, `metadata`, `created_at`.

---

## Scope — EXACTLY two implementation/generated files + 2 required docs

**Implementation / generated files:**
1. **`scripts/check-schema-drift.mjs`** — add ONE `INTERFACE_TABLE_MAP` entry + a documenting comment.
2. **`scripts/schema-drift-check.sql`** — regenerate by running `npm run check:schema-drift` (do NOT hand-edit; it is generated output).

**Required documentation files (mandatory — clause 10):**
3. **`docs/sessions/2026-06-15-task431-schema-drift-history-clear-events.md`** — new session log (summary, Files Changed table, gate transcript, N/A justifications).
4. **`docs/backlog.md`** — Task 431 row (Epic DD follow-up) + Last Session.

**No other files may be touched.**

**Out of scope — do NOT touch:**
- `src/types/database.ts` — the `HistoryClearEvent` interface already exists (Task 246); leave it byte-for-byte unchanged.
- Any `src/`, `app/`, component, locale, or runtime file.
- The Supabase database — you do NOT run any SQL (single-writer; the owner runs the regenerated `.sql` natively to confirm zero drift).
- The "no-op race success toast" UX nit noted on Task 246 — that is a **separate** concern (would be Task 432 if the owner wants it); bundling it here violates scope isolation (agent-contract clause 1). If you think it belongs here, STOP and ASK — do not add it.

---

## Required changes (literal)

### 0. Precondition — confirm the starting snapshot BEFORE editing

Before touching anything, read the current `scripts/schema-drift-check.sql` header and/or run `npm run check:schema-drift` once unchanged: confirm the baseline reports **32 tables / 305 columns**. If it reports anything else (the map drifted, `database.ts` changed upstream, or the snapshot is stale), **STOP and ASK** — do not blindly proceed expecting 33 / 315. The +1 table / +10 column delta in AC3 is only valid relative to a 32 / 305 baseline.

### 1. `scripts/check-schema-drift.mjs` — add the map entry

Add, as the **last** entry of `INTERFACE_TABLE_MAP` (after `ListingInquiry: 'listing_inquiries',`):

```js
  HistoryClearEvent:  'history_clear_events',
```

Keep the existing column-aligned formatting of the object (align the value column as the surrounding entries do).

### 2. `scripts/check-schema-drift.mjs` — document the exception

The map header comment currently documents the Task 265 `search_vector` coverage exception. Add a short, parallel note (adjacent to that block) recording WHY `history_clear_events` is included despite having no `.from()` call, e.g.:

```js
// Audit table with no .from() consumer (Task 431):
//   history_clear_events — written only via the clear_user_history() RPC
//     (SECURITY DEFINER), never accessed through PostgREST/.from() in src/.
//     Included for drift coverage (keeps HistoryClearEvent ⇄ live table in sync;
//     protects a future direct-read consumer) — an exception to the
//     ".from()-confirmed" inclusion rule, like the search_vector entry above.
```

Wording may be tightened, but it MUST state: (a) no `.from()` consumer, (b) written via the RPC, (c) included for drift coverage as a deliberate exception.

### 3. Regenerate the SQL snapshot

Run `npm run check:schema-drift`. Confirm the console summary reports **33 tables** (was 32) and **315 columns tracked** (was 305 — `HistoryClearEvent` contributes 10). The regenerated `scripts/schema-drift-check.sql` must now contain, in BOTH `VALUES (expected …)` lists, a 10-row `history_clear_events` block, and `'history_clear_events'` must appear in the `table_name IN (...)` list of RESULT SET 2. The `Generated <timestamp>` line will change — that is expected.

---

## Positive flow (happy path)

1. Executor adds the single `HistoryClearEvent: 'history_clear_events'` map entry + the exception comment to `check-schema-drift.mjs`.
2. Executor runs `npm run check:schema-drift` → exit 0; summary prints `Tables covered : 33`, `Columns tracked: 315`, and a `HistoryClearEvent → history_clear_events 10` row in the mapping table.
3. `scripts/schema-drift-check.sql` is rewritten: two new 10-row `history_clear_events` blocks (one per `VALUES` list, columns in interface order), `'history_clear_events'` added to the RESULT SET 2 `table_name IN (...)` list.
4. Executor runs `node --check scripts/check-schema-drift.mjs` → exit 0; file-integrity check on both touched files → 0 NUL / no BOM / intact tail.
5. Session log gets a "Files Changed" table with **4 rows total** (2 implementation/generated files + 2 docs) + the gate transcript. **Owner** later runs the regenerated `.sql` in Supabase → expects **RESULT SET 1 empty** (no missing columns — the table was created with exactly these 10 columns in Task 246), confirming zero real drift.

## Negative flow (every off-happy-path branch)

| Branch | Required handling |
|---|---|
| **Baseline ≠ 32 tables / 305 cols** (before editing) | STOP and ASK. The expected 33 / 315 result assumes a 32 / 305 starting point; a different baseline means the map or `database.ts` drifted upstream and the delta must be re-derived, not assumed. |
| **Interface name typo** (map key ≠ exported interface) | The parser warns `Warning: interface '<name>' not found in database.ts — skipped` and the table is silently dropped from the SQL. Executor MUST verify the console output shows `HistoryClearEvent → history_clear_events 10` (NOT a "not found" warning). If the warning appears, the map key is wrong — fix it; do not proceed. |
| **Column count ≠ 10** | If the mapping row shows a count other than 10, the interface was misread (or `database.ts` was accidentally edited). STOP — `database.ts` is out of scope and must be unchanged; investigate before continuing. |
| **Hand-editing the `.sql`** | FORBIDDEN — the `.sql` is generated. If it looks wrong, fix the `.mjs` and regenerate. A hand-edited `.sql` that diverges from generator output = task failure. |
| **Drift actually reported by owner** (RESULT SET 1 non-empty) | NOT expected (the live table matches the interface from Task 246). If the owner reports rows, do NOT alter the guard to hide them — STOP and ASK; it means the live table and the type genuinely disagree and needs a real reconciliation decision. |
| **Running SQL against Supabase yourself** | FORBIDDEN (single-writer). Only the owner runs the `.sql`. |
| **Scope creep into the no-op toast / any `src/` file** | FORBIDDEN — see "Out of scope". STOP and ASK if tempted. |

---

## Acceptance criteria (each verifiable in the diff / transcript)

- **AC1** — `INTERFACE_TABLE_MAP` in `scripts/check-schema-drift.mjs` gains exactly one entry, `HistoryClearEvent: 'history_clear_events'`, as the last entry, column-aligned. (Positive flow 1; diff at `check-schema-drift.mjs`.)
- **AC2** — A header comment documents the no-`.from()` coverage exception (states: no `.from()` consumer, written via `clear_user_history` RPC, included for drift coverage). (Required change 2; diff.)
- **AC3** — `npm run check:schema-drift` exits 0 and prints `Tables covered : 33`, `Columns tracked: 315`, and a `HistoryClearEvent → history_clear_events 10` mapping row. (Paste the console output in the session log.)
- **AC4** — `scripts/schema-drift-check.sql` regenerated: a 10-row `history_clear_events` block (interface-order columns: `id, actor_user_id, entity_type, entity_id, history_source, clear_scope, cleared_row_ids, cleared_row_count, metadata, created_at`) appears in BOTH `VALUES` lists, and `'history_clear_events'` is in the RESULT SET 2 `table_name IN (...)` list. (Verifiable in the `.sql` diff.)
- **AC5** — `src/types/database.ts` is **unchanged** (`git diff --stat` shows it is NOT in the touched set). No `src/`/`app/`/locale/UI file touched. (Scope isolation, clause 1.)
- **AC6** — File-integrity (clause 14): both touched files — `node --check scripts/check-schema-drift.mjs` exits 0, 0 NUL bytes, no BOM, intact tail. Paste the GREEN transcript. (Note: the `.sql` is data, not JS — integrity = 0 NUL / intact tail / parses as the expected SQL.)
- **AC7** — `docs/backlog.md` updated (Task 431 row under Epic DD / Last Session) + a session log `docs/sessions/2026-06-15-task431-schema-drift-history-clear-events.md` with the "Files Changed" table (4 rows: 2 implementation/generated files + 2 docs) and the gate transcript. Executor does NOT emit `git add`/`git commit` (orchestrator emits at review).

**N/A for this task (state so explicitly in the session log so the orchestrator doesn't flag them missing):** i18n / 4-locale parity (no user-facing strings), mobile <640 full-width gate + rendered matrix (no UI), Storybook/`check:stories` (no stories). The relevant gates are `node --check` + the regeneration determinism + file-integrity only.

---

## Files Changed (expected — 2 + 2 docs)

| File | Change |
|---|---|
| `scripts/check-schema-drift.mjs` | +1 `INTERFACE_TABLE_MAP` entry (`HistoryClearEvent: 'history_clear_events'`) + exception comment. |
| `scripts/schema-drift-check.sql` | Regenerated (32→33 tables, 305→315 cols; new 10-row `history_clear_events` blocks + `IN (...)` entry; `Generated` timestamp bumped). |
| `docs/sessions/2026-06-15-task431-schema-drift-history-clear-events.md` | New session log (summary, Files Changed, gate transcript, N/A justifications). |
| `docs/backlog.md` | Task 431 row (Epic DD follow-up) + Last Session. |

---

## Hard contract (verified against the real diff on return)

- No scope change; only the 2 script files + 2 docs. `database.ts` untouched.
- No invented architecture; the `.sql` is generated, never hand-edited.
- Self-validate before "complete": `node --check`, regeneration determinism (re-run produces identical `.sql` modulo the timestamp line), file-integrity transcript, AC-by-AC self-audit table in the session log.
- "Files Changed" table present; executor runs NO git (single-writer).
- Owner runs the regenerated `.sql` natively to confirm RESULT SET 1 is empty (zero real drift).
