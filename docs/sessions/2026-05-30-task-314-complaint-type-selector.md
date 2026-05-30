# Session: Task 314 — Admin complaint-type selector for "+ Нова скарга" modal

**Date:** 2026-05-30  
**Task:** 314  
**Type:** feature + small data-model addition  
**Sprint:** 22

---

## Root Cause / UX Gap

The admin "+ Нова скарга" create-complaint dialog had no classification field. Every complaint was an untyped free-text blob, weakening future filtering, analytics, escalation routing, moderation workflows, and audit review. This task adds a required complaint-type selector — persisted on a new `support_tickets.complaint_type` column, visible in the list row and detail modal.

---

## STOP & ASK Transcript + Resolutions

All 4 design points confirmed by owner before writing code:

1. **Enum reuse vs new enum:** NEW `complaint_type_t` enum. `report_reason_t` belongs to `listing_reports` — conflating would be a domain violation.
2. **Field placement:** Between "Reported user" and "Subject/title": Reporter → Reported → **Complaint type Combobox** → Subject → Reason.
3. **Display location:** Badge in subject cell of list row (below subject/reason, no new column) AND metadata cell in detail modal grid.
4. **Legacy backfill:** `NOT NULL DEFAULT 'other'` — existing rows receive 'other' automatically; column is never NULL.

---

## Required Investigation (Paste)

- `support_tickets` baseline: 11 columns (`id, user_id, subject, status, assigned_to, created_at, reported_user_id, reason, created_by_admin_id, ticket_type, updated_at`). No `complaint_type` yet.
- `createSupportTicket` signature: `{reportedUserId, reporterUserId, subject, reason}` + async `startTransition`.
- `AdminSupportManager` `CreateComplaintDialog` field order: Reporter → Reported → Subject → Reason (lines 473–512). Combobox added between Reported and Subject.
- Canonical `Combobox` is `@/components/shared/Combobox` (NOT `@/components/ui/combobox`). Props: `options`, `value`, `onChange`, `placeholder`, `error`, `variant` ('input'|'button'), `size`, etc. Used `variant="button"` for this static 8-item list.
- `Badge` confirmed at `@/components/ui/badge`. Variant `neutral` used for complaint-type classification.
- No existing `complaint_type` anywhere in `src/` or `scripts/`.
- Task 300 keys (`role_*`, `support_status_*`) present at line 888–895 in `admin.support` — no conflict.
- No `CREATE TYPE ... AS ENUM` in existing scripts — new enum naming `complaint_type_t` follows the `report_reason_t` convention.

---

## Data-Model Decision Narrative

`report_reason_t` was considered for reuse — rejected. It classifies why a **listing** is being reported (spam/fraud/duplicate/wrong_category/offensive/other). `complaint_type` classifies what a **user-vs-user complaint** is about — entirely different domain semantics. Sharing the enum would conflate admin moderation taxonomy with listing-report taxonomy.

New `complaint_type_t` ENUM with 8 values. `NOT NULL DEFAULT 'other'` was chosen so:
- Legacy rows automatically receive a valid safe value.
- The column is never NULL, keeping UI rendering and queries simple.
- The default does NOT bypass the admin form validation — new tickets require an explicit selection client-side and server-side; `'other'` is only a DB-safe fallback for rows that predate the feature.

---

## Complaint-Type Taxonomy — 4-Locale Table

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

---

## Localization Coverage

12 keys × 4 locales = 48 string additions. `npm run check:i18n` → ✅ Parity PASSED — 1383 keys (up from 1371).

New keys under `admin.support`: `complaint_type_label`, `complaint_type_placeholder`, `complaint_type_required`, `complaint_type_invalid`, `complaint_type_fraud_or_scam`, `complaint_type_fake_listing_or_profile`, `complaint_type_harassment_or_abuse`, `complaint_type_inappropriate_content`, `complaint_type_spam`, `complaint_type_payment_or_deposit_issue`, `complaint_type_duplicate_or_impersonation`, `complaint_type_other`.

---

## Responsive Coverage

**Breakpoint QA not owner-verified yet.** Combobox uses `variant="button"` with portal-positioned dropdown — will not clip inside the Dialog at any width. Ukrainian labels are the longest (`complaint_type_fake_listing_or_profile`: "Фейкове оголошення або профіль" ~31 chars). The Combobox closed-state displays the selected label inside the standard h-11 trigger. Owner visual QA at 320/375/390/768/1280/1440/2560 is pending.

---

## Validation Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ passes |
| `npm run lint` | ✅ 0/0 |
| `npm run check:i18n` | ✅ 1383 keys parity (+12 per locale) |
| `npm run governance:tailwind` | ✅ C0/H0/M0 |

---

## AC Self-Audit

| AC | Status |
|----|--------|
| `scripts/task-314-complaint-type.sql` created with `CREATE TYPE complaint_type_t` + `ALTER TABLE ... ADD COLUMN ... NOT NULL DEFAULT 'other'` | ✅ |
| `schema-drift-check.sql` updated — both blocks + comment (11→12 cols) | ✅ |
| `complaint_type_t` enum has exactly 8 values from taxonomy | ✅ |
| `createSupportTicket` accepts `complaintType`; validates non-empty + valid enum; emits `complaint_type_required` / `complaint_type_invalid`; INSERT writes column | ✅ |
| `AdminSupportManager` Create dialog renders canonical `Combobox` (`@/components/shared/Combobox`) between Reported and Subject | ✅ |
| `variant="button"` used for static 8-item list | ✅ |
| Client-side `complaintType_required` validation in `validate()`; server-side error handlers added | ✅ |
| After creation, list row shows `neutral` Badge with localized complaint type (below subject/reason in subject cell) | ✅ |
| Detail modal metadata grid shows `complaint_type_label` + `neutral` Badge | ✅ |
| `complaint_type: null` renders gracefully (Badge not shown) — pre-migration safety | ✅ |
| 12 new locale keys × 4 locales; parity 1383 | ✅ |
| All existing dialog fields, buttons, filter chips, status switcher, timeline, RLS, notifications unchanged | ✅ |
| No canonical primitive (Combobox/Button/Dialog/Badge component file) touched | ✅ |
| No Sprint 21 / Epic HH Phase 1+2 file touched | ✅ |
| tsc=0 · build=✅ · lint=0/0 · check:i18n=✅ · governance:tailwind=C0/H0/M0 | ✅ |
| Breakpoint owner QA pending | ⏳ |

---

## Owner-Action Note

**The migration SQL in `scripts/task-314-complaint-type.sql` must be run by the owner in the Supabase SQL editor BEFORE the new column reads correctly.**

Until the migration is run:
- Create dialog works (server action will receive `complaint_type` but INSERT will fail if the column doesn't exist; UI shows generic `create_error` toast)
- List/detail renders gracefully: `complaint_type` is not in the SELECT result → `null` → Badge not shown (existing rows show no badge; no crash)

After migration:
- New tickets will have the selected complaint type persisted and displayed
- Legacy rows will have `'other'` and show "Other" / "Tjetër" / "Інше" / "Altro" badge

**Schema drift check:** `npm run check:schema-drift` will fail until the migration is applied (column not yet in DB). Expected 0 rows after migration. Mark as `owner-SQL PENDING`.

---

## Scope Note — `page.tsx` (4th source file)

`src/app/admin/support/page.tsx` was added to the SELECT clause (`complaint_type` added alongside existing columns). This was necessary because the SELECT uses an explicit column list — without this change, `complaint_type` would never be returned from Supabase even after the migration, leaving every `SupportTicketRow.complaint_type` as `undefined`. This is a mechanical extension of the data-fetch contract, not a business logic change.

---

## Files Changed

| File | Change |
|------|--------|
| `src/types/database.ts` | Added `ComplaintType` type + `complaint_type: ComplaintType \| null` to `SupportTicket` |
| `src/components/admin/AdminSupportManager.tsx` | `SupportTicketRow` + `complaint_type`; `COMPLAINT_TYPES` constant; Create dialog: Combobox field + validation + server call; list row: Badge in subject cell; detail modal: metadata cell |
| `src/modules/admin/actions/index.ts` | `VALID_COMPLAINT_TYPES`; `complaintType` param; validation guards; INSERT includes `complaint_type` |
| `src/app/admin/support/page.tsx` | Added `complaint_type` to SELECT (necessary scope extension — without it the column is never fetched) |
| `scripts/task-314-complaint-type.sql` | NEW — migration: `CREATE TYPE complaint_type_t` + `ALTER TABLE support_tickets ADD COLUMN` |
| `scripts/schema-drift-check.sql` | +1 row per block (`('support_tickets', 'complaint_type')`); comment updated (11→12 cols) |
| `messages/sq.json` | +12 keys under `admin.support` |
| `messages/en.json` | +12 keys under `admin.support` |
| `messages/uk.json` | +12 keys under `admin.support` |
| `messages/it.json` | +12 keys under `admin.support` |
| `docs/sessions/2026-05-30-task-314-complaint-type-selector.md` | NEW — this log |
| `docs/backlog.md` | Closure entry + archive row |

**Self-validation: tsc=0 · build=passes · lint=0/0 · check:i18n=passes · governance:tailwind=C0/H0/M0 · DB migration script READY · admin Create dialog 7-bp PASS pending owner QA · sq/en/uk/it localized · existing controls preserved · scope=clean · owner-SQL PENDING · PASS**
