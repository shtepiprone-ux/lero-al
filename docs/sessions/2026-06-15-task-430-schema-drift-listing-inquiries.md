# Task 430 — Epic BB follow-up: register `listing_inquiries` in the schema-drift guard

**Date:** 2026-06-15
**Epic:** BB — Listing Inquiries: Report & Message (chore follow-up to Task 243 / BB.2)
**Status:** ✅ Complete

## Summary

`scripts/check-schema-drift.mjs`'s `INTERFACE_TABLE_MAP` did not include the `ListingInquiry`
interface (added by Task 243), so the regenerated `scripts/schema-drift-check.sql` covered 31
tables and omitted `listing_inquiries` — leaving the new table without drift protection. Added
exactly one map entry, regenerated the SQL artifact, no other change.

## 1. Map entry (`scripts/check-schema-drift.mjs`)

Added after `ListingContactEvent` (kept existing alignment):

```js
  ListingContactEvent:    'listing_contact_events',
  ListingInquiry:         'listing_inquiries',
}
```

## 2. Parser-compatibility check (§2)

`src/types/database.ts` contains:

```ts
export interface ListingInquiry {
  id: string
  listing_id: string
  listing_owner_id: string
  name: string
  email: string
  message: string
  requester_ip: string | null
  status: ListingInquiryStatus
  created_at: string
}
```

All 9 fields are `snake_case` and map 1:1 to the expected DB columns (`id, listing_id,
listing_owner_id, name, email, message, requester_ip, status, created_at`). No camelCase fields,
no computed/non-column fields, no missing columns. Parser-compatible — no STOP/ASK needed.

## 3. Generator console output (`npm run check:schema-drift`)

```
✔ Generated: scripts/schema-drift-check.sql
  Tables covered : 32
  Columns tracked: 305

  Interface            → Table                      Cols
  ─────────────────────────────────────────────────────
  ... (31 unchanged rows omitted for brevity — table count grew 31 → 32) ...
  ListingContactEvent  → listing_contact_events   9
  ListingInquiry       → listing_inquiries        9

Next: run scripts/schema-drift-check.sql in the Supabase SQL Editor.
```

32 tables covered (was 31), 305 columns tracked (was 296, +9). `ListingInquiry →
listing_inquiries (9 cols)` row present.

## Regenerated SQL — `listing_inquiries` rows (for the owner to run)

**Header mapping comment** (`scripts/schema-drift-check.sql:37`) now includes:

```
--   ListingInquiry       → listing_inquiries        (9 cols)
```

**RESULT SET 1** (`expected` columns missing in DB) — `listing_inquiries` rows added to the
`VALUES` list at `scripts/schema-drift-check.sql:345-353`:

```sql
    ('listing_inquiries', 'id'),
    ('listing_inquiries', 'listing_id'),
    ('listing_inquiries', 'listing_owner_id'),
    ('listing_inquiries', 'name'),
    ('listing_inquiries', 'email'),
    ('listing_inquiries', 'message'),
    ('listing_inquiries', 'requester_ip'),
    ('listing_inquiries', 'status'),
    ('listing_inquiries', 'created_at')
```

**RESULT SET 2** (DB columns not in types) — same 9 `listing_inquiries` rows added to the
`expected` `VALUES` list at `scripts/schema-drift-check.sql:671-679`, and `'listing_inquiries'`
added to the `table_name IN (...)` filter at `scripts/schema-drift-check.sql:690`.

**⚠️ Single-writer SQL — the owner runs this:** the full regenerated `scripts/schema-drift-check.sql`
(committed, fully generator-emitted, no hand edits) must be run by the owner in the Supabase SQL
Editor. Per the kickoff problem statement, the prior run (31 tables) returned "Success. No rows
returned"; this run additionally exercises `listing_inquiries`. Expected result: still "No rows
returned" (no drift), since the table was created exactly per the Task 243 SQL. If any rows ARE
returned for `listing_inquiries`, that is a real type/DB mismatch — open a follow-up, do not
hand-edit the generated SQL.

## Files Changed

| File | Rationale |
|---|---|
| `scripts/check-schema-drift.mjs` | Added one `INTERFACE_TABLE_MAP` entry: `ListingInquiry: 'listing_inquiries'`. No other map entry, parser, or emitter touched. |
| `scripts/schema-drift-check.sql` | Regenerated via `npm run check:schema-drift` — fully generator-emitted, no hand edits. Now covers 32 tables / 305 columns, including the new `listing_inquiries` (9 cols) block in both result sets. |

**Not part of this diff (pre-existing, untouched by this session):**
`tasks/Epics/Epic_I_kickoff_prompt_Task_427_AdminOwnerFullEditAndStatusAccess.md` shows as modified
in `git status` from a prior/parallel session — left as-is.

## AC-by-AC self-audit

1. `INTERFACE_TABLE_MAP` gained exactly one entry, `ListingInquiry: 'listing_inquiries'`
   (`scripts/check-schema-drift.mjs`, after `ListingContactEvent`); no other entry/parser/emitter
   changed. ✅
2. `scripts/schema-drift-check.sql` regenerated: header mapping comment lists `ListingInquiry →
   listing_inquiries (9 cols)` (line 37); both `VALUES` lists contain the 9
   `('listing_inquiries', '<col>')` rows (lines 345-353 and 671-679); RESULT SET 2's
   `table_name IN (...)` includes `'listing_inquiries'` (line 690). Fully generator-emitted. ✅
3. Session log (this file) includes the generator console summary (32 tables, 305 columns, +9),
   the new `listing_inquiries` SQL rows, and the owner-must-run note. ✅
4. Self-validation: `node scripts/check-schema-drift.mjs` exits 0 (verified, `exit=0`); `git status`
   confirms only the two named files changed (plus an unrelated pre-existing modification to a
   Task 427 kickoff file, not part of this diff); file-integrity below. ✅

## File-integrity transcript

- `scripts/check-schema-drift.mjs` — clean UTF-8, 0 NUL bytes, parses (generator ran successfully
  against it: `node scripts/check-schema-drift.mjs` → exit 0).
- `scripts/schema-drift-check.sql` — clean UTF-8, 0 NUL bytes, valid SQL (fully generator-emitted
  by the same successful run; structure verified above — both `VALUES` lists and the
  `table_name IN (...)` filter are well-formed).

## Self-validation verdict

**PASS.** `node scripts/check-schema-drift.mjs` exits 0, reports 32 tables / 305 columns including
`ListingInquiry → listing_inquiries (9 cols)`. Only the two specified files changed. No UI/i18n/
Storybook work performed (out of scope, per kickoff). `listing_inquiries` table schema and
`src/types/database.ts` untouched (no STOP/ASK triggered — interface is parser-compatible).
No git or Supabase SQL run by this session.
