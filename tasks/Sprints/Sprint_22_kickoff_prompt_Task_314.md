# Sprint 22 — Task 314 kickoff (Admin complaint-type selector for "+ Нова скарга" modal — canonical taxonomy + DB column + 4-locale labels)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10 (Task 264 commit hand-off). Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is an **admin UX + small data-model addition + i18n** task. Pre-read `docs/orchestrator-role.md`, `docs/ai-behavior.md` (Notes 18/19/20/21/22/23), `docs/component-rules.md`, `docs/ui-rules.md` (canonical Combobox/Select rule §0), `docs/data-access-rules.md`, `docs/rls-rules.md`, `docs/qa-rules.md`, `docs/domain-rules.md` (Support/Inquiries distinction), `docs/sessions/2026-05-29-task-284-admin-unification.md`. No scope change; STOP & ASK if ambiguous.

> **Numbering rationale:** Orchestrator confirmed against `docs/backlog.md` 2026-05-30 — Task 303–313 are reserved by Epic HH (Admin UX System, 6-phase plan), Task 316–323 are reserved by Epic II (Global i18n Hardening). The next free global number outside those reservations is **314**. This task is positioned as an **Epic HH Phase 6 early slice** (Internal Tickets workflow refinement — Notes 22/23 compliant) and ships **before** the broader Epic HH Phase 1 audit because it is independent of the canonical narrow-bp / filter / sort / row-action specs.

---

```
Type:        feature + small data-model addition (admin / support-ticket workflow)
Priority:    medium-high (admin moderation hygiene — missing classification weakens triage, analytics, audit review)
Area:        admin/support — AdminSupportManager.tsx (Create modal + table/detail display) — support_tickets table — messages/{sq,en,uk,it}.json
```

## Why this task exists (2026-05-30 owner directive)

The `/admin/support` page hosts the "+ Нова скарга" / "New complaint" flow that admins use to create a `support_tickets` row with `ticket_type = 'user_complaint'` against a reported user. Owner audit of the current modal:

Current fields in the Create-complaint dialog:
- Complainant (reporter user picker)
- Reported user (picker)
- Subject / title
- Reason / details (free-text)

Missing: a **complaint type** selector. The admin is creating a user complaint, but cannot classify what kind of complaint it is. Downstream consequences: future filtering, analytics, escalation routing, moderation workflows, audit review, and admin reporting all become weak because every complaint is an untyped free-text blob.

Owner directive: add a canonical complaint-type selector — required on creation, persisted with the ticket, visible to admins post-creation, localised to sq/en/uk/it, with the taxonomy below.

## Investigation already done by orchestrator (do NOT repeat — read & verify)

- `support_tickets` table currently has 11 columns: `id, user_id (complainant), subject, status, assigned_to, created_at, reported_user_id, reason, created_by_admin_id, ticket_type, updated_at` (confirmed via `scripts/schema-drift-check.sql` rows 202–212).
- `ticket_type` enum = `'support' | 'user_complaint'` — describes the kind of TICKET (general support vs. user-vs-user complaint), NOT what the complaint is ABOUT. This is **NOT** a substitute for complaint_type.
- `createSupportTicket` server action at `src/modules/admin/actions/index.ts:727–795` takes `{reportedUserId, reporterUserId, subject, reason}`, validates, INSERTs with `ticket_type: 'user_complaint'`, status `'open'`, writes a `support_ticket_events` row, and notifies the reported user.
- `ReportReason` enum at `src/types/database.ts:48` = `'spam' | 'fraud' | 'duplicate' | 'wrong_category' | 'offensive' | 'other'` — this is for `listing_reports` (reporting a LISTING), NOT for user-vs-user complaints. Reusing it would conflate two distinct domain concepts. Recommended: **NEW enum** for complaint_type (see "Required investigation → STOP & ASK").
- `AdminSupportManager.tsx` is the manager component (verified: `useTranslations('admin.support')` at lines 103, 146, 253, 411, 537; Create modal section + ticket list rendering + detail modal all live in this file).
- Existing `admin.support` locale namespace has the existing modal copy keys (`dialog_create_title`, `subject_label`, `subject_placeholder`, `reason_label`, `reason_placeholder`, `reason_required`, `reported_label`, `reporter_label`, `cancel_btn`, `create_btn`, `new_complaint_btn`, etc.) — confirmed via the python parity check used in Task 300.
- Task 300 (Sprint 21) adds `admin.support.role_*` and `admin.support.support_status_*` keys — **this task adds DIFFERENT keys (`complaint_type_*`) under the same `admin.support` namespace**. The two tasks do not conflict on key names; both must end up in all 4 locale files.

## Goal

Add a **required** canonical complaint-type selector to the admin "+ Нова скарга" create-complaint modal. After this task:

- The modal renders the new selector between "Reported user" and "Subject / title" (orchestrator-recommended placement; STOP & ASK to confirm).
- The selector uses the project's **canonical `Combobox` primitive** (`@/components/ui/combobox` per `docs/ui-rules.md §0` Combobox-only rule). It is NOT a raw `<select>` or a local one-off component.
- Submit is blocked client-side AND server-side if no complaint_type is selected — both sides emit the same error code (e.g. `complaint_type_required`) and the UI shows a localised error message.
- The selected `complaint_type` is persisted on the new `support_tickets.complaint_type` enum column.
- After creation, the complaint type is visible to admins:
  - As a small Badge in the ticket-list row (preferred — small visual footprint).
  - AND in the ticket detail surface (modal or detail panel) — exact location depends on current architecture; STOP & ASK if architecture differs from inventory.
- All four locales render localised labels for the taxonomy (no English fallback in sq/uk/it).
- All existing modal fields, buttons, dialog behaviour, filter chips, status switcher, audit/event history, notifications, and RLS remain unchanged.

## Taxonomy (canonical 8-value enum)

Suggested by owner; orchestrator-approved as the starting set:

| Enum value | sq | en | uk | it |
|---|---|---|---|---|
| `fraud_or_scam` | Mashtrim ose skemë | Fraud or scam | Шахрайство або афера | Frode o truffa |
| `fake_listing_or_profile` | Profil ose njoftim i rremë | Fake listing or profile | Фейкове оголошення або профіль | Annuncio o profilo falso |
| `harassment_or_abuse` | Ngacmim ose abuzim | Harassment or abuse | Переслідування або зловживання | Molestie o abuso |
| `inappropriate_content` | Përmbajtje e papërshtatshme | Inappropriate content | Неприйнятний контент | Contenuto inappropriato |
| `spam` | Spam | Spam | Спам | Spam |
| `payment_or_deposit_issue` | Problem pagese ose depozite | Payment or deposit issue | Проблема з оплатою або депозитом | Problema di pagamento o deposito |
| `duplicate_or_impersonation` | Dublikim ose imitim | Duplicate or impersonation | Дубль або імітація | Duplicato o impersonificazione |
| `other` | Tjetër | Other | Інше | Altro |

If Sonnet disagrees with any localised label, STOP & ASK BEFORE editing — do not silently substitute.

## Current behavior to preserve (Notes 19 + 20 + 22 — admin tables + Note 23 — edit-flow)

Before editing, inventory in the session log (Note 22 — admin table preservation):

**AdminSupportManager surface — Create dialog:**
- Dialog title ("Нова скарга" / locale equivalents)
- Field: Complainant (reporter user picker) — searchable
- Field: Reported user (picker) — searchable
- Field: Subject / title (Input)
- Field: Reason / details (Textarea)
- Footer: Cancel + Create buttons
- Validation: `subject_required`, `reason_required`, `reporter_required`, `reported_required` — all server-side, surfaced client-side via toast
- Success: ticket inserted, `support_ticket_events` row created, reported user notified, toast `create_success`, dialog closes, list refreshes
- Error: toast `create_error` (or specific reason key)

**AdminSupportManager surface — list/table:**
- Filter row (status filter + type filter — DO NOT touch; Task 299 evaluation already classified these)
- Search
- Rows: subject, reporter, reported, type, status, created_at, updated_at (verify columns against actual code)
- Row click: opens ticket detail modal/panel
- Detail modal: subject, reason, parties, events timeline, status switcher, close

After this task, EVERY one of the above must still exist and work. The ONLY additions are:
- One new required field (`complaint_type` Combobox) in the Create dialog, between Reported-user and Subject.
- One new client-side validation gate (`complaint_type_required`).
- One new server-side error code (`complaint_type_required`).
- One new column-or-Badge display in the list AND in the detail modal (DOM addition, not replacement).
- One new server-side enum value to persist + localised display.

No filter chip is added in this task (filter-by-complaint-type can be a separate follow-up — out of scope).

## Positive flow (happy path)

As an admin at `uk` locale, viewport 1280px:
1. Navigate to `/uk/admin/support`.
2. Click "+ Нова скарга" → dialog opens; existing fields render unchanged + new "Тип скарги" Combobox appears between "Оскаржуваний користувач" and "Тема".
3. Pick "Скаржник" → search/pick → select.
4. Pick "Оскаржуваний користувач" → search/pick → select.
5. Open the new Combobox → see 8 localised options in `uk` (Шахрайство або афера, Фейкове оголошення або профіль, ...).
6. Pick "Шахрайство або афера".
7. Type "Test complaint" into Subject.
8. Type "Details here" into Reason.
9. Click Create → success toast `create_success`, dialog closes, list refreshes, the new row shows a Badge with the localised complaint type ("Шахрайство або афера").
10. Click the row → detail modal opens; complaint type visible there too.
11. Refresh page → row persists with the same Badge → complaint_type column was saved to DB.
12. Switch locale to `sq` / `en` / `it` and reload list → Badge re-renders in that locale; the underlying enum value is locale-agnostic.

## Negative flow (every off-happy-path branch)

- **Missing complaint type (client)** — Create button enabled OR disabled when complaint_type is empty: orchestrator recommends **enabled + on-click validation toast** (matches existing pattern for `subject_required` etc.). Toast shows localised `complaint_type_required`. Dialog stays open. No DB write. No notification.
- **Missing complaint type (server)** — even if client is bypassed (manual API call), server action returns `{error: 'complaint_type_required'}`. No INSERT happens. Toast surfaces same key.
- **Invalid enum value** — server rejects unknown values (`{error: 'complaint_type_invalid'}`). Same UX as `validation` errors.
- **Combobox dropdown overflow at 320px** — must not clip; the Combobox primitive already handles `popper` positioning; verify at 320/375/390 in `uk` (longest labels) that the dropdown does not push off-screen or get cut by the dialog bounds. If it does, fix via Combobox `align="start"` or `side="bottom"` props — NOT by adding a custom CSS class.
- **Locale label too long** — at 320, the field label "Тип скарги" + the longest enum value ("Фейкове оголошення або профіль" ~30 chars) must wrap or be readable; DO NOT truncate with `ellipsis` (Task 290 no-ellipsis policy applies). The Combobox closed-state value display may use `break-words` if needed.
- **Cancel pressed mid-fill** — dialog closes, no DB write, no notification, fields reset on next open (existing behaviour preserved).
- **Double submit** — existing pattern in `createSupportTicket` is server-authoritative; double-click should result in two attempts, only one INSERT if the server enforces unique-on-something; if not, document as known concern (not in this task's scope to add idempotency).
- **DB migration not yet applied** — UI must render gracefully if the column does not yet exist (e.g. `complaint_type undefined` in fetched rows): show "—" or no Badge. Migration is owner-run; the kickoff includes the SQL.
- **Existing rows pre-migration** — backfill is OPTIONAL; recommended `complaint_type = 'other'` for legacy rows so the column is NOT NULL. Decide in Required investigation → STOP & ASK.
- **Notification text unchanged** — the `support_reply` notification to the reported user does NOT need to include the complaint_type. Existing notify code remains untouched.
- **RLS** — adding a new column does NOT change RLS posture; existing `support_tickets` policies remain.

## Required investigation (PASTE in session log BEFORE writing code)

```
# 1. Confirm support_tickets schema baseline
grep -n "'support_tickets'" scripts/schema-drift-check.sql | head -20

# 2. Confirm createSupportTicket server action shape
sed -n '720,800p' src/modules/admin/actions/index.ts

# 3. Inspect AdminSupportManager Create dialog (find the JSX section)
grep -n 'dialog_create_title\|new_complaint_btn\|Dialog\|Combobox\|subject_label\|reason_label' src/components/admin/AdminSupportManager.tsx

# 4. Confirm canonical Combobox primitive path + props API
sed -n '1,60p' src/components/ui/combobox.tsx 2>/dev/null || \
  find src/components/ui -name 'combobox*' -print
cat docs/ui-rules.md | sed -n '/Combobox/,/##/p' | head -40

# 5. Confirm Badge primitive
sed -n '1,40p' src/components/ui/badge.tsx

# 6. Confirm no existing complaint_type / category column on support_tickets
grep -rn 'complaint_type\|complaintType\|complaint_category' src/ scripts/ 2>&1 | head -20

# 7. Confirm Task 300 (admin.support.role_* / support_status_*) is not in conflict
grep -n 'role_user\|support_status_open\|complaint_type_' messages/sq.json messages/en.json messages/uk.json messages/it.json 2>&1 | head -20

# 8. Confirm DB enum naming conventions in existing migrations
grep -rn 'CREATE TYPE.*AS ENUM' scripts/*.sql 2>&1 | head -10

# 9. Schema drift baseline post-migration check (owner-runnable in Supabase)
# After owner runs the migration:
#   SELECT column_name, data_type, is_nullable
#   FROM information_schema.columns
#   WHERE table_name = 'support_tickets' ORDER BY ordinal_position;
# Expected: 12 columns (11 existing + complaint_type)
```

After investigation, STOP & ASK the orchestrator on:
1. **Enum reuse vs new enum** — confirm orchestrator's recommendation to create a NEW `complaint_type_t` enum (not reuse `report_reason_t`) is correct after reading the existing migration patterns.
2. **Field placement** — confirm "between Reported-user and Subject" is the right position vs. "first field" or "after Subject".
3. **Display location** — confirm Badge-in-row-AND-detail-modal is correct vs. detail-only OR row-only.
4. **Legacy row backfill** — confirm `'other'` is the right default vs. `NULL` allowed.

Do NOT proceed past Required investigation without orchestrator answers to the above.

## Scope (files Sonnet may touch)

- `src/components/admin/AdminSupportManager.tsx` — add Combobox field to Create dialog; add Badge to list row + detail modal; client validation
- `src/modules/admin/actions/index.ts` — extend `createSupportTicket` signature with `complaintType`; add server-side validation; INSERT new column
- `src/types/database.ts` — add `ComplaintType` enum type + extend `SupportTicketRow` / equivalent type with `complaint_type` field
- `scripts/task-314-complaint-type.sql` (NEW) — owner-runnable: `CREATE TYPE complaint_type_t AS ENUM (...)` + `ALTER TABLE support_tickets ADD COLUMN complaint_type complaint_type_t NOT NULL DEFAULT 'other'` + verification SELECT
- `scripts/schema-drift-check.sql` — add `('support_tickets', 'complaint_type')` row to the expected-columns list (so `npm run check:schema-drift` passes after owner runs migration)
- `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json` — add under `admin.support`: `complaint_type_label`, `complaint_type_placeholder`, `complaint_type_required`, `complaint_type_invalid`, and the 8 enum value labels (`complaint_type_fraud_or_scam`, ..., `complaint_type_other`). Total: 12 keys × 4 locales = **48 string additions**
- `docs/sessions/2026-05-30-task-314-complaint-type-selector.md` (NEW; adjust date to actual run date)
- `docs/backlog.md` — closure entry + bump task counter
- `docs/domain-rules.md` — optional one-paragraph addition under existing Support/Inquiries section documenting the complaint_type taxonomy

**MUST NOT touch:**
- Listing reports (`listing_reports` / `report_reason` enum) — distinct domain
- AdminInquiriesManager, AdminReportsManager — separate workstreams (Epic HH Phase 3/4)
- Public-side contact / report flows — out of scope
- `ticket_type` enum (`support | user_complaint`) — orthogonal
- Status enum (`open | in_progress | resolved | closed`) — orthogonal
- Filter chips, sort, pagination, status switcher logic
- RLS policies on `support_tickets`
- Notification text / templates
- Email templates
- Any Sprint 21 file (300/301/302) — independent workstream
- Any Epic HH Phase 1/2 audit work
- `src/components/ui/combobox.tsx` (Q.x canonical primitive — off-limits in this task)
- `src/components/ui/button.tsx`, `src/components/ui/dialog.tsx`, `src/components/ui/badge.tsx` — canonical primitives, off-limits

Maximum SOURCE-FILE delta: **3 source files** (`AdminSupportManager.tsx`, `actions/index.ts`, `types/database.ts`) + 2 SQL files + 4 locale JSONs + 3 docs. If you find yourself touching more, STOP & ASK.

## Localization (sq/en/uk/it parity)

Add the following keys under `admin.support` in ALL FOUR locale files (same key set):

- `complaint_type_label`
- `complaint_type_placeholder` (e.g. "Select complaint type")
- `complaint_type_required`
- `complaint_type_invalid`
- `complaint_type_fraud_or_scam`
- `complaint_type_fake_listing_or_profile`
- `complaint_type_harassment_or_abuse`
- `complaint_type_inappropriate_content`
- `complaint_type_spam`
- `complaint_type_payment_or_deposit_issue`
- `complaint_type_duplicate_or_impersonation`
- `complaint_type_other`

Use the verbatim strings from the Taxonomy table above for the 8 enum value keys. For the 4 control keys (label/placeholder/required/invalid), use:

| Key | sq | en | uk | it |
|---|---|---|---|---|
| `complaint_type_label` | Tipi i ankesës | Complaint type | Тип скарги | Tipo di reclamo |
| `complaint_type_placeholder` | Zgjidh tipin e ankesës | Select complaint type | Виберіть тип скарги | Seleziona il tipo di reclamo |
| `complaint_type_required` | Tipi i ankesës është i detyrueshëm | Complaint type is required | Тип скарги обов'язковий | Il tipo di reclamo è obbligatorio |
| `complaint_type_invalid` | Tip ankese i pavlefshëm | Invalid complaint type | Невірний тип скарги | Tipo di reclamo non valido |

After edit: run `npm run check:i18n` (key parity guard) — all 4 files must have identical key sets under `admin.support`.

## Responsive coverage (all 7 breakpoints)

Verify in running app at all of: 320 / 375 / 390 / 768 / 1280 / 1440 / 2560 in `uk` locale (longest labels). Specifically:
- Modal is usable; no horizontal scroll inside the dialog.
- Combobox trigger renders the placeholder + selected value without ellipsis.
- Combobox dropdown opens within the viewport (does not push off-screen at 320).
- All field labels, placeholders, validation toasts wrap correctly.
- Submit + Cancel buttons remain reachable (44px touch targets — canonical `Button` size).

Repeat the modal check in `sq` (Albanian — second-longest in this taxonomy) to spot-check.

The admin-page narrow-bp clipping debt (Task 301) is NOT this task's concern; if narrow-bp clipping reproduces OUTSIDE the modal (page-level), document and DEFER.

## Acceptance criteria (literal)

- `support_tickets` table has a new `complaint_type` enum column (NOT NULL DEFAULT 'other'); migration SQL exists in `scripts/task-314-complaint-type.sql`.
- `scripts/schema-drift-check.sql` includes the new column row; `npm run check:schema-drift` passes after owner runs the migration (Sonnet writes "owner-action PENDING" in session log).
- `complaint_type` enum has exactly the 8 values from the Taxonomy table; documented in the migration SQL comment.
- `createSupportTicket` signature accepts a required `complaintType` arg; server-validates non-empty + valid enum value; emits `complaint_type_required` / `complaint_type_invalid` error codes; INSERT writes the column.
- `AdminSupportManager.tsx` Create dialog renders a canonical `Combobox` between Reported-user and Subject; localized label + placeholder + 8 localized options + required-validation toast.
- Submit button blocks (or surfaces toast) if `complaintType` empty; existing required-field validation (subject/reason/reporter/reported) unchanged.
- After creation, the ticket row in the list shows a Badge with the localized complaint-type label; the detail modal/panel shows the same.
- All existing modal fields, buttons, dialog open/close behaviour, list filter/sort/search, status switcher, event timeline, RLS, notifications — UNCHANGED.
- All 12 new locale keys present in `messages/{sq,en,uk,it}.json` under `admin.support` with the strings from the table above; key parity verified.
- `npx tsc --noEmit` → 0 errors.
- `npm run build` → passes.
- `npm run lint` → 0/0 (Task 295 baseline preserved; no new errors / no new warnings).
- `npm run check:i18n` (if exists) → passes.
- `npm run governance:tailwind` → no regression (still C0/H0/M0).
- All four locales verified at runtime at 320 + 768 + 1280 on the Create dialog AND list/detail surfaces.
- All seven breakpoints verified for the Create dialog at `uk`.
- Note 18 self-validation block + AC-by-AC self-audit table + "Files Changed" table in session log.
- Verdict line: `Self-validation: tsc=0 · build=passes · lint=0/0 · check:i18n=passes · governance:tailwind=C0/H0/M0 · DB migration script READY · admin Create dialog 7-bp PASS uk · sq/en/uk/it localized · existing controls preserved · scope=clean · owner-SQL PENDING · PASS`.

## Out of scope (do NOT touch)

- Filter chip "by complaint type" on the list — separate follow-up (orchestrator will decide if/when to file).
- Analytics dashboards on complaint_type — separate Epic.
- Email notifications mentioning complaint_type — separate task.
- Moderation automation / escalation routing based on complaint_type — Epic HH Phase 6 sibling task.
- Renaming Support / Internal Tickets section again (Task 284 already done that; do not re-litigate).
- Merging `/admin/support` and `/admin/reports` — distinct domains per `docs/domain-rules.md`.
- Public user report flow from listing details — separate Epic (Epic BB territory).
- `ReportReason` enum on `listing_reports` — distinct concept; do not "harmonise" with this new enum.
- `ticket_type` ('support' | 'user_complaint') changes — orthogonal.
- Status taxonomy changes.
- Admin sidebar / route changes.
- RLS policy edits.
- Any change to `Combobox` / `Button` / `Dialog` / `Badge` canonical primitives.
- Sprint 21 work (300/301/302) — independent.
- Epic HH Phase 1 audit / Phase 2 primitives — this task ships BEFORE those.

## Final report required (Sonnet → orchestrator)

1. Task number and title.
2. Files Changed table (one row per touched path + 1-line rationale).
3. Root cause / UX gap confirmation paragraph.
4. Data-model decision narrative: enum reuse considered → rejected (why) → new `complaint_type_t` enum chosen; default + NOT NULL rationale; legacy row backfill decision.
5. Complaint-type taxonomy implemented + the 4-locale label table (verbatim).
6. Localization coverage confirmation: 12 keys × 4 locales × parity guard PASS.
7. Responsive coverage confirmation: 7 breakpoints × `uk` PASS on Create dialog; spot-check on `sq` PASS.
8. Validation commands and results (tsc, build, lint, check:i18n, governance:tailwind).
9. Runtime QA notes: positive flow steps 1–12 walked end-to-end at 1280 `uk`; negative-flow validation cases (missing complaint_type client + server, locale switch, narrow-bp Combobox overflow) verified.
10. AC-by-AC self-audit table.
11. Confirmation that NO canonical primitive (Combobox/Button/Dialog/Badge) was touched.
12. Confirmation that NO Sprint 21 / Epic HH Phase 1+2 file was touched.
13. Owner-action note: the migration SQL must be run by the owner in Supabase SQL editor BEFORE the new column reads correctly; UI degrades gracefully without it (Badge shows "—" or none).

Do NOT emit git commands. Do NOT run git. Do NOT run SQL. STOP & ASK on the 4 design points in Required investigation before editing.
