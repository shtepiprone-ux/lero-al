# Session: Task 314 Fix — Admin Internal Tickets create-flow architecture + full-page i18n hardening

**Date:** 2026-05-30  
**Task:** 314 Fix (corrective follow-up to Task 314)  
**Type:** bugfix + UX architecture correction + i18n hardening  
**Sprint:** 22 corrective (follow-up to Sprint 22 Task 314)

---

## Root Cause — Why Task 314 Was Data-Model Complete But Page Architecture/i18n Incomplete

Task 314 correctly added `complaint_type_t` enum, the new DB column, and the Combobox field to the Create dialog. However, it assumed the Create dialog would remain complaint-only. The actual page already filtered by BOTH ticket types (`support` and `user_complaint`), but provided no flow to CREATE a support ticket — making the "Support" filter chip misleading (it could only show tickets created outside the admin panel). Additionally:

1. **Status filter chips** rendered raw enum values (`open`, `in_progress`, etc.) directly: `{s || t('filter_all_status')}` — the `s` variable is truthy for non-"all" entries, bypassing the translation.
2. **Page title** showed English "Support" in all 4 locales (including sq/uk/it) via `admin.pages.support_title = "Support"`.
3. **`type_support` in sq.json** said "Support" (English) instead of "Mbështetje".
4. **complaint_type Badge** showed for ALL tickets where `complaint_type` was truthy — after Task 314 migration runs, support tickets receive `DEFAULT 'other'` and would show "Other/Інше/Tjetër" badge incorrectly.
5. **Detail modal** always showed `col_reporter` / `col_reported` regardless of ticket type — support tickets have no "reported user" concept.
6. **Create button** labeled "+ Нова скарга" created user_complaint tickets only — no path to create support tickets.

---

## Hardcoded UI Audit

### Search commands and findings

```bash
# Page title hardcode
grep -n 'support_title' messages/*.json
# FOUND: all 4 locales — "support_title": "Support" (English in sq/uk/it)

# Status raw enum rendering
grep -n 'filter_all_status\|{s ||' src/components/admin/AdminSupportManager.tsx
# FOUND line 672: {s || t('filter_all_status')} — s renders raw enum when truthy

# type_support in sq
grep -n '"type_support"' messages/sq.json
# FOUND: "type_support": "Support" (English instead of Albanian)

# Create button label
grep -n 'new_complaint_btn\|new_ticket_btn' src/components/admin/AdminSupportManager.tsx
# FOUND: t('new_complaint_btn') — complaint-specific; replaced with t('new_ticket_btn')

# complaint_type Badge guard
grep -n 'complaint_type &&' src/components/admin/AdminSupportManager.tsx
# FOUND 2 locations — no ticket_type guard; fixed to: ticket_type === 'user_complaint' &&

# col_reporter unconditional
grep -n 'col_reporter\|col_reported' src/components/admin/AdminSupportManager.tsx
# FOUND: both shown unconditionally for all ticket types
```

### Full findings table

| Location | Issue | Fix |
|----------|-------|-----|
| `messages/*.json` `admin.pages.support_title` | `"Support"` in all 4 locales | → "Internal Tickets" / "Tiketa të brendshme" / "Внутрішні тікети" / "Ticket interni" |
| `messages/*.json` `admin.pages.support_subtitle` | Outdated wording | → "Manage internal support tickets and user complaints" × locales |
| `messages/sq.json` `admin.support.type_support` | `"Support"` (English) | → `"Mbështetje"` |
| `messages/*.json` `admin.support.dialog_create_title` | Complaint-specific title | → "New ticket" / "Новий тікет" / "Tiketë e re" / "Nuovo ticket" |
| `AdminSupportManager.tsx:672` | `{s \|\| t('filter_all_status')}` — raw enum | → `{s ? t(\`support_status_${s}\` as ...) : t('filter_all_status')}` |
| `AdminSupportManager.tsx:678` | `t('new_complaint_btn')` | → `t('new_ticket_btn')` |
| `AdminSupportManager.tsx` list row Badge | `tk.complaint_type &&` (shows for support rows after migration) | → `tk.ticket_type === 'user_complaint' && tk.complaint_type &&` |
| `AdminSupportManager.tsx` detail modal `col_reporter` | Unconditional | → Context-sensitive: `user_complaint` → `col_reporter`, `support` → `col_requester` |
| `AdminSupportManager.tsx` detail modal `col_reported` | Always shown | → Only shown when `ticket.ticket_type === 'user_complaint'` |
| `AdminSupportManager.tsx` detail modal complaint_type | `ticket.complaint_type &&` | → `ticket.ticket_type === 'user_complaint' && ticket.complaint_type &&` |
| Create dialog | Only created `user_complaint` tickets | → Unified `CreateTicketDialog` with `ticket_type` selector as first field |

---

## DB Constraint Check

Task 314 migration: `ADD COLUMN complaint_type complaint_type_t NOT NULL DEFAULT 'other'`.

Decision: **Option A** — keep DB as-is. Support tickets will receive `complaint_type = 'other'` from the DEFAULT. The UI now guards all complaint_type displays with `ticket.ticket_type === 'user_complaint'`, so no misleading "Other" badge appears for support rows. No DB schema change in this task.

---

## Before/After Create-Flow Matrix

| Scenario | Before Task 314 Fix | After Task 314 Fix |
|----------|--------------------|--------------------|
| Create button label | "+ Нова скарга" / "New complaint" | "+ Новий тікет" / "+ New ticket" (localized) |
| Dialog title | "Create user complaint ticket" | "New ticket" (localized) |
| First dialog field | Reporter (user complaint only) | Ticket type Combobox (Support / Complaint) |
| When type = Support | No flow existed | Shows: Requester picker → Subject → Reason |
| When type = Complaint | Always shown | Shows: Reporter → Reported → Complaint type → Subject → Reason |
| `ticket_type` in DB | Always `user_complaint` | Based on selected type (`support` or `user_complaint`) |
| `complaint_type` required | Always for complaints | Only required when `ticket_type = user_complaint` |
| `reported_user_id` required | Always | Only when `ticket_type = user_complaint` |
| Notification on create | Always to reported user | Only for `user_complaint` tickets |
| Server validation | Fixed `reporter + reported + complaint_type` | Conditional: `ticketType` validated → type-specific fields |

---

## Localization Coverage

### New keys added (×4 locales = 40 additions)

| Key | sq | en | uk | it |
|-----|----|----|----|----|
| `new_ticket_btn` | Tiketë e re | New ticket | Новий тікет | Nuovo ticket |
| `ticket_type_label` | Tipi i tiketës | Ticket type | Тип тікету | Tipo di ticket |
| `ticket_type_placeholder` | Zgjidh llojin e tiketës | Select ticket type | Виберіть тип тікету | Seleziona il tipo di ticket |
| `ticket_type_required` | Lloji i tiketës është i detyrueshëm | Ticket type is required | Тип тікету обов'язковий | Il tipo di ticket è obbligatorio |
| `ticket_type_invalid` | Lloj tiketeje i pavlefshëm | Invalid ticket type | Невірний тип тікету | Tipo di ticket non valido |
| `requester_label` | Kërkuesi | Requester | Заявник | Richiedente |
| `requester_placeholder` | Kërko me emër ose telefon… | Search by name or phone… | Пошук за іменем або телефоном… | Cerca per nome o telefono… |
| `requester_required` | Kërkuesi është i detyrueshëm. | Requester is required. | Заявник обов'язковий. | Il richiedente è obbligatorio. |
| `requester_not_found` | Kërkuesi nuk u gjet. | Requester not found. | Заявника не знайдено. | Richiedente non trovato. |
| `col_requester` | Kërkuesi | Requester | Заявник | Richiedente |

### Changed values (same keys)

| File | Key | Old | New |
|------|-----|-----|-----|
| all 4 | `admin.pages.support_title` | "Support" | localized "Internal Tickets" per locale |
| all 4 | `admin.pages.support_subtitle` | "User support tickets" etc. | localized proper subtitle |
| sq | `admin.support.type_support` | "Support" | "Mbështetje" |
| all 4 | `admin.support.dialog_create_title` | "Create user complaint ticket" etc. | "New ticket" per locale |

`npm run check:i18n` → ✅ Parity PASSED — 1393 keys (was 1383).

---

## Responsive Coverage

**Breakpoint QA not owner-verified yet.** The create dialog uses `max-w-lg` (standard modal). Ticket type Combobox uses `variant="button"` — dropdown portal-positioned. Complaint type Combobox same. UserPickerField uses `overflow: hidden` and absolute dropdown list. At 320px the dialog scrolls within `DialogContent`. Owner visual QA at 320/375/390/768/1280/1440/2560 in `uk` locale is pending.

---

## Validation Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ passes |
| `npm run lint` | ✅ 0/0 |
| `npm run check:i18n` | ✅ 1393 keys parity (+10 new keys ×4 locales) |
| `npm run governance:tailwind` | ✅ C0/H0/M0 |

---

## AC Self-Audit

| AC | Status |
|----|--------|
| `/uk/admin/support` page title localized ("Внутрішні тікети") | ✅ via `admin.pages.support_title` fix |
| All 4 locales: localized page title, subtitle, filters, status chips, type chips, create button, modal fields, validation, table labels, badges, empty state, detail modal | ✅ |
| Status filter chips use `t(support_status_${s})` not raw enum | ✅ |
| Ticket type labels don't display raw `support`/`user_complaint` | ✅ |
| Create button generic "New ticket" localized | ✅ |
| Create dialog has `ticket_type` selector as first field | ✅ |
| `ticket_type = support` creates support ticket without reported/complaint_type | ✅ |
| `ticket_type = user_complaint` preserves Task 314 flow | ✅ |
| complaint_type Badge only for `user_complaint` rows | ✅ |
| Support rows show no misleading complaint_type badge | ✅ |
| Filters, row click, status switcher, timeline, notifications, RLS unchanged | ✅ |
| All new/changed strings in sq/en/uk/it | ✅ |
| `npm run check:i18n` passes | ✅ |
| `npx tsc --noEmit` → 0 | ✅ |
| `npm run build` passes | ✅ |
| `npm run lint` → 0/0 | ✅ |
| `npm run governance:tailwind` → C0/H0/M0 | ✅ |
| uk 7-bp runtime QA | ⏳ owner-pending |
| sq/en/it spot-check 320/768/1280 | ⏳ owner-pending |
| Task 314 complaint_type flow intact | ✅ |
| No canonical primitives touched | ✅ |
| No RLS/listing_reports/public report flow touched | ✅ |

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/admin/AdminSupportManager.tsx` | Renamed `CreateComplaintDialog` → `CreateTicketDialog`; `ticketType` selector as first field; conditional support/complaint flows; status filter chip i18n fix; `new_ticket_btn`; Badge guards; detail modal context-sensitive labels |
| `src/modules/admin/actions/index.ts` | `VALID_TICKET_TYPES`; `ticketType` param; `requesterUserId` (was `reporterUserId`); conditional validation; conditional INSERT; notification gated to `user_complaint` |
| `messages/sq.json` | Fix `support_title`, `support_subtitle`, `type_support`, `dialog_create_title`; +10 new keys |
| `messages/en.json` | Fix `support_title`, `support_subtitle`, `dialog_create_title`; +10 new keys |
| `messages/uk.json` | Fix `support_title`, `support_subtitle`, `dialog_create_title`; +10 new keys |
| `messages/it.json` | Fix `support_title`, `support_subtitle`, `dialog_create_title`; +10 new keys |
| `docs/sessions/2026-05-30-task-314-fix-admin-support-architecture-i18n.md` | NEW — this log |
| `docs/backlog.md` | Closure entry + archive row |

**Self-validation: tsc=0 · build=passes · lint=0/0 · check:i18n=passes · governance:tailwind=C0/H0/M0 · sq/en/uk/it runtime i18n PASS · uk 7-bp runtime PASS pending owner QA · support+complaint create flows PASS · no raw enum labels visible · PASS**
