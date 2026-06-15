# Task 431 — Register `history_clear_events` in the schema-drift guard (Epic DD follow-up)

**Executor:** Sonnet 4.6. **Type:** schema-drift tooling / SQL-snapshot regeneration only. No UI, no runtime code, no locales.

## Summary

Closes the Task 246 follow-up: `history_clear_events` (table + `HistoryClearEvent` interface, shipped in Task 246)
was not registered in `scripts/check-schema-drift.mjs`'s `INTERFACE_TABLE_MAP`. This task mirrors Task 430's
identical registration for `listing_inquiries`.

`history_clear_events` does NOT meet the map's literal ".from()-confirmed" inclusion criterion — the audit row is
written only via the `clear_user_history()` SECURITY DEFINER RPC (`src/modules/admin/actions/clearHistory.ts:28`),
never through `.from('history_clear_events')`. Per the owner/orchestrator decision documented in the kickoff, it is
registered anyway for **drift coverage**, as a deliberate exception — parallel to the existing Task 265
`search_vector` exception. This exception is documented inline in the map's header comment (AC2).

## Precondition check (Step 0)

Ran `npm run check:schema-drift` once, unchanged, before any edits. Baseline reported **32 tables / 305 columns** —
matches the kickoff's expected baseline exactly. Proceeded with the +1 table / +10 column delta (→ 33 / 315).

## Changes made

1. **`scripts/check-schema-drift.mjs`**:
   - Added a new exception comment block (adjacent to the existing Task 265 `search_vector` comment, inside the
     header comment above `INTERFACE_TABLE_MAP`) documenting: no `.from()` consumer in `src/`, written via the
     `clear_user_history()` SECURITY DEFINER RPC, included for drift coverage as a deliberate exception to the
     ".from()-confirmed" rule (like the `search_vector` entry).
   - Added `HistoryClearEvent: 'history_clear_events',` as the new **last** entry of `INTERFACE_TABLE_MAP`, after
     `ListingInquiry: 'listing_inquiries',`, column-aligned with the surrounding wider-padding entries
     (`RecentlyViewed`, `ContactInquiryReply`, etc.).

2. **`scripts/schema-drift-check.sql`**: regenerated via `npm run check:schema-drift` (never hand-edited).

`src/types/database.ts` was NOT touched (read-only reference for the `HistoryClearEvent` interface shape, which
already existed from Task 246).

## AC3 — console output (regeneration run)

```
> lero-al@0.1.0 check:schema-drift
> node scripts/check-schema-drift.mjs

✔ Generated: scripts/schema-drift-check.sql
  Tables covered : 33
  Columns tracked: 315

  Interface            → Table                      Cols
  ─────────────────────────────────────────────────────
  User                 → users                    29
  UserChangeLog        → user_change_log          7
  UserStatusHistory    → user_status_history      7
  EmailChangeToken     → email_change_tokens      7
  EmailTemplate        → email_templates          10
  Location             → locations                12
  Listing              → listings                 42
  ListingImage         → listing_images           5
  Favorite             → favorites                4
  FavoritePriceAlert   → favorite_price_alerts    4
  SavedSearch          → saved_searches           12
  ListingReport        → listing_reports          7
  ReportAction         → report_actions           8
  SupportTicket        → support_tickets          12
  Notification         → notifications            10
  DBCurrency           → currencies               12
  DBExchangeProvider   → exchange_providers       11
  DBPropertyType       → property_types           10
  Page                 → pages                    7
  SiteSetting          → site_settings            3
  Company              → companies                4
  Collection           → collections              5
  CollectionItem       → collection_items         3
  RecentlyViewed       → recently_viewed          4
  RolePermission       → role_permissions         5
  RolePermissionEvent  → role_permission_events   8
  ContactInquiry       → contact_inquiries        13
  ContactInquiryReply  → contact_inquiry_replies  5
  PublicUserProfile    → public_user_profiles     9
  SiteFooter           → site_footer              12
  ListingContactEvent  → listing_contact_events   9
  ListingInquiry       → listing_inquiries        9
  HistoryClearEvent    → history_clear_events     10

Next: run scripts/schema-drift-check.sql in the Supabase SQL Editor.
```

Exit code: 0. `Tables covered : 33` (was 32), `Columns tracked: 315` (was 305), and the new
`HistoryClearEvent → history_clear_events 10` mapping row is present — no "not found in database.ts" warning.

## AC4 — regenerated `.sql` verification

`grep -n "history_clear_events" scripts/schema-drift-check.sql` confirms:
- Line 38: mapping comment `HistoryClearEvent    → history_clear_events     (10 cols)`.
- Lines 355–364: 10-row `history_clear_events` block in RESULT SET 1's `VALUES` list, in interface-field order
  (`id, actor_user_id, entity_type, entity_id, history_source, clear_scope, cleared_row_ids, cleared_row_count,
  metadata, created_at`).
- Lines 691–700: identical 10-row block in RESULT SET 2's `VALUES` list.
- Line 711: `'history_clear_events'` appended to RESULT SET 2's `table_name IN (...)` list (as the last entry).

## Regeneration determinism

Re-ran `npm run check:schema-drift` a second time. `diff` against the first regeneration shows only the
`Generated <timestamp>` line differs:

```
2c2
< -- Generated 2026-06-15T19:55:06.791Z by: npm run check:schema-drift
---
> -- Generated 2026-06-15T19:57:35.167Z by: npm run check:schema-drift
```

All other lines (including both new `history_clear_events` blocks and the `IN (...)` list) are byte-identical.

## AC6 — file-integrity GREEN transcript

```
=== check-schema-drift.mjs ===
NUL count: 0
BOM bytes:  23 21 2f      (= "#!/" — not a BOM)
tail (last 80 bytes): ...ext: run scripts/schema-drift-check.sql in the Supabase SQL Editor.')
}

main()

=== schema-drift-check.sql ===
NUL count: 0
BOM bytes:  2d 2d 20      (= "-- " — not a BOM)
tail (last 80 bytes): ...ar_events')
  AND e.column_name IS NULL
ORDER BY ic.table_name, ic.column_name;
```

`node --check scripts/check-schema-drift.mjs` → exit 0 ("syntax OK"), confirmed before the regeneration run.

Both files: 0 NUL bytes, no BOM, intact (non-truncated) tails.

## Scope confirmation

The **implementation** diff (right after the code/SQL change, before the docs were written) showed only:
- `scripts/check-schema-drift.mjs` (M)
- `scripts/schema-drift-check.sql` (M)

The **final task** changeset additionally includes the required governance docs: this session log (new), `docs/backlog.md` (Task 431 row + Last Session), and `docs/backlog-archive.md` (backlog-tidy: prior Task 246 Last-Session row moved to the archive top — owner P0 rule, reconciled at orchestrator review). Full set = 5 files (2 script + 3 docs). `src/types/database.ts` remains untouched (AC5).

`src/types/database.ts` is NOT in the touched set — unchanged, as required (AC5). No `src/`, `app/`, component,
locale, or runtime file was touched.

**Note:** `git status` also shows `tasks/Epics/Epic_I_kickoff_prompt_Task_427_AdminOwnerFullEditAndStatusAccess.md`
as modified. This is a **pre-existing, unrelated** uncommitted change from Task 427 (not part of Task 431's scope
or diff) — left untouched, not included in this task's Files Changed table below.

## N/A justifications

- **i18n / 4-locale parity (sq/en/uk/it):** N/A — no user-facing strings; the only string changes are JS code
  comments and SQL comments.
- **Mobile <640 full-width gate + rendered matrix:** N/A — no UI surface touched.
- **Storybook / `check:stories`:** N/A — no stories affected; neither file is a component.

The relevant gates for this task are: `node --check` (GREEN), regeneration determinism (confirmed identical
modulo timestamp), and file-integrity (GREEN, both files).

## AC self-audit

| AC | Status | Evidence |
|---|---|---|
| AC1 | ✅ | `HistoryClearEvent: 'history_clear_events'` added as last `INTERFACE_TABLE_MAP` entry, column-aligned. |
| AC2 | ✅ | New header comment block documents: no `.from()` consumer, written via `clear_user_history` RPC, included for drift coverage as a deliberate exception (parallel to Task 265 `search_vector`). |
| AC3 | ✅ | Console output above: `Tables covered : 33`, `Columns tracked: 315`, `HistoryClearEvent → history_clear_events 10` row, exit 0. |
| AC4 | ✅ | `.sql` regenerated: 10-row `history_clear_events` blocks in both `VALUES` lists (lines 355–364, 691–700) + `'history_clear_events'` in RESULT SET 2 `IN (...)` (line 711). |
| AC5 | ✅ | `git diff --stat` shows only the 2 script files touched; `src/types/database.ts` unchanged. |
| AC6 | ✅ | `node --check` exit 0; file-integrity transcript above (0 NUL, no BOM, intact tails) for both files. |
| AC7 | ✅ | This session log + `docs/backlog.md` Task 431 row / Last Session update (below). No git commands run by executor. |

## Files Changed

| File | Change |
|---|---|
| `scripts/check-schema-drift.mjs` | +1 `INTERFACE_TABLE_MAP` entry (`HistoryClearEvent: 'history_clear_events'`) + Task 431 exception comment documenting the no-`.from()` drift-coverage exception. |
| `scripts/schema-drift-check.sql` | Regenerated (32→33 tables, 305→315 cols; new 10-row `history_clear_events` blocks in both `VALUES` lists + `'history_clear_events'` in RESULT SET 2's `table_name IN (...)`; `Generated` timestamp bumped). |
| `docs/sessions/2026-06-15-task431-schema-drift-history-clear-events.md` | New session log (this file). |
| `docs/backlog.md` | Task 431 row updated under Epic DD + Last Session entry. |
| `docs/backlog-archive.md` | Backlog-tidy (owner P0): the prior Task 246 Last-Session entry moved to the TOP of the archive ledger so `backlog.md` Last Session holds only Task 431. Required by the backlog-tidy rule; not listed in the kickoff's 4-file scope but mandated by CLAUDE.md — reconciled at orchestrator review (precedent: Task 425). |

## Next step (owner)

Run the regenerated `scripts/schema-drift-check.sql` natively in the Supabase SQL Editor — RESULT SET 1 is expected
to be **empty** (the live `history_clear_events` table was created with exactly these 10 columns in Task 246, so
no drift is expected). If RESULT SET 1 returns rows, do NOT alter the guard — flag for a real reconciliation
decision (per the kickoff's negative-flow table).

## Closure (orchestrator, 2026-06-15)

First native drift run reported **all 10** `history_clear_events` columns as "missing in DB" — the signature of an
**absent table**, not column drift, because **Task 246's table-creation migration had not yet been applied** (Task 246
was still "pending owner SQL run"). The guard behaved correctly (it flagged that the types expect a table the live DB
lacked); per the negative-flow rule the guard was **NOT** altered. Owner then applied Task 246's full SQL (Sections 1–3:
`history_clear_events` table + `clear_user_history()` RPC + `audit.clear_history` moderator default-deny seed) → "Success.
No rows returned", and re-ran `scripts/schema-drift-check.sql` → **"Success. No rows returned"** (RESULT SET 1 empty).
**Zero real drift confirmed natively. Task 431 CLOSED.** Side effect: this also discharged Task 246's pending SQL migration.
