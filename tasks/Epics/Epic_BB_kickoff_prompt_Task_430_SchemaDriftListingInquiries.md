# Epic BB — Task 430 kickoff (Sonnet) — register `listing_inquiries` in the schema-drift guard

> **Status: READY.** Epic: BB — Listing Inquiries: Report & Message. Follow-up to Task 243 (BB.2),
> which added the `listing_inquiries` table + the `ListingInquiry` interface in `src/types/database.ts`
> but did NOT add it to the schema-drift generator's coverage.
>
> **You are Sonnet 4.6 executor.** Implement exactly as specified. Do NOT change scope. If a required
> detail is ambiguous, **STOP and ASK the orchestrator** — do not guess.
>
> **Single-writer git:** you do NOT run git. End with a "Files Changed" table; the orchestrator reads
> the real diff and emits commit commands at review.
> **Single-writer SQL:** you do NOT run the generated SQL against Supabase — the **owner** runs it
> natively in the SQL Editor. You only regenerate the `.sql` file and paste its new `listing_inquiries`
> block into the session log for the owner.

```
Type:     chore (tooling / drift-guard coverage)
Priority: low
Area:     scripts/check-schema-drift.mjs (generator) + scripts/schema-drift-check.sql (generated artifact)
```

## Required pre-read (rule-index: "Schema / migration task" — tooling subset)

**Always:** `docs/agent-contract.md`, `docs/backlog.md`.
**Required:** `docs/qa-rules.md` (→ "Schema drift check" section), `docs/data-access-rules.md`.
**Reference:** `scripts/check-schema-drift.mjs` (the generator — note the manual `INTERFACE_TABLE_MAP`
at lines ~46-78), `src/types/database.ts` (the `ListingInquiry` interface added by Task 243).

**NOT a UI task** — the mobile <640 full-width gate, the rendered verification matrix, and i18n parity
do NOT apply here. Do not add UI/Storybook evidence; it is out of scope.

## Problem

`scripts/check-schema-drift.mjs` builds its drift SQL from a **manual** `INTERFACE_TABLE_MAP`
(`check-schema-drift.mjs:46-78`). Task 243 added the `listing_inquiries` table and a matching
`ListingInquiry` interface in `src/types/database.ts`, but did NOT register the mapping. As a result
the regenerated `scripts/schema-drift-check.sql` covers 31 tables and **omits `listing_inquiries`** —
so the new table has no drift protection (a future column drop/rename on it would go undetected).
The owner confirmed (2026-06-15) that running the current `schema-drift-check.sql` returns
"Success. No rows returned", i.e. clean for the 31 mapped tables — but that result does NOT exercise
`listing_inquiries` at all.

## Owner decision (captured 2026-06-15)

Add `listing_inquiries` to the drift guard so the new table is covered, mirroring how every other
listing-related table is registered. No schema change to the table itself.

## Architecture to implement (specified — do NOT invent an alternative)

### 1. Register the interface→table mapping

In `scripts/check-schema-drift.mjs`, add one entry to `INTERFACE_TABLE_MAP` (keep the existing
alignment/formatting; place it logically next to the other listing-related entries, e.g. after
`ListingContactEvent`):

```js
  ListingInquiry:         'listing_inquiries',
```

Do NOT touch any other entry, the parser, or the SQL emitter. The parser already reads field names
from `export interface ListingInquiry { … }` in `src/types/database.ts`.

### 2. Verify the `ListingInquiry` interface is parser-compatible

Confirm `src/types/database.ts` contains `export interface ListingInquiry { … }` with one
`fieldName: Type` per line (the parser matches `^(\w+)\??:`). The expected DB columns are:
`id, listing_id, listing_owner_id, name, email, message, requester_ip, status, created_at`.
If the interface field names do NOT map 1:1 to those snake_case DB columns (e.g. a camelCase field, a
computed/non-column field, or a missing column), **STOP and ASK** — do not silently rename DB columns
or hand-edit the generated SQL. (The drift guard's whole contract is that the SQL is generated, never
hand-authored.)

### 3. Regenerate the artifact

Run `npm run check:schema-drift`. Confirm the console output now reports **32 tables covered** and the
`ListingInquiry → listing_inquiries (9 cols)` row appears. Confirm the regenerated
`scripts/schema-drift-check.sql` now contains a `('listing_inquiries', …)` block in BOTH `VALUES`
lists and `listing_inquiries` in the RESULT SET 2 `table_name IN (...)` list. Paste the new
`listing_inquiries` rows + the generation summary into the session log for the owner to run.

## Positive flow (happy path)

1. Add the map entry → `npm run check:schema-drift` → generator parses `ListingInquiry` (9 fields) →
   `schema-drift-check.sql` regenerates with the `listing_inquiries` block in both result sets →
   console reports 32 tables / +9 columns. Owner later runs the SQL in Supabase → "No rows returned"
   (no drift), confirming the live table matches the type.

## Negative flow (implement / handle each)

- **Interface fields ≠ DB columns** (camelCase, extra computed field, missing column) → the generated
  RESULT SET 1 would list false "missing in DB" rows. **Do not paper over this by editing the SQL** —
  STOP and ASK the orchestrator so the interface (or the DB) is reconciled properly.
- **Generator warns `interface 'ListingInquiry' not found in database.ts — skipped`** → the interface
  name or `export` is wrong; fix the mapping key to match the real exported interface name (or STOP
  and ASK if the interface is genuinely absent). The regenerated file must NOT silently drop the table.
- **Owner's Supabase run returns drift rows** (reported back later) → that is a real type/DB mismatch,
  not a tooling bug → open a follow-up; do not mutate the generated SQL by hand.

## Acceptance criteria (each verifiable in the diff)

1. `scripts/check-schema-drift.mjs` `INTERFACE_TABLE_MAP` gains exactly one entry
   `ListingInquiry: 'listing_inquiries'`; no other map entry, the parser, or the emitter changed.
2. `scripts/schema-drift-check.sql` regenerated (committed) — header mapping comment lists
   `ListingInquiry → listing_inquiries (9 cols)`; both `VALUES` lists contain the 9
   `('listing_inquiries', '<col>')` rows; RESULT SET 2's `table_name IN (...)` includes
   `'listing_inquiries'`. (The file is fully generator-emitted — NO hand edits.)
3. Session log includes: the generator console summary (32 tables, column count), the new
   `listing_inquiries` SQL rows, and a note that the **owner** must run the regenerated SQL in Supabase
   (single-writer SQL).
4. Self-validation: `node scripts/check-schema-drift.mjs` exits 0; the only changed files are the two
   named above; file-integrity (0 NUL, parses) on both; "Files Changed" table present.

## Out of scope

Any change to the `listing_inquiries` table schema; any change to `src/types/database.ts` (unless §2
STOP-and-ASK surfaces a genuine field/column mismatch, in which case ASK first); any UI/i18n/Storybook
work; changing the generator's parser or emitter logic; adding other unregistered tables.

## Deliverables on return

A session log under `docs/sessions/` with: the one-line map change, the regenerated-file evidence
(mapping comment + the new `listing_inquiries` rows), the generator console output, the Files Changed
table (2 rows), the AC-by-AC self-audit, and the file-integrity transcript. Do NOT edit
`docs/backlog.md` (orchestrator-owned) and do NOT run git or the Supabase SQL.
