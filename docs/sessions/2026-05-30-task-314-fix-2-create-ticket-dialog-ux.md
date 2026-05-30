# Session: Task 314 - Fix 2 — Create Ticket dialog UX + conditional support/complaint labels

**Date:** 2026-05-30  
**Task:** 314 - Fix 2 (corrective follow-up to Task 314 Fix)  
**Type:** bugfix / UX correction / i18n hardening  
**Sprint:** 22 corrective 2

---

## Root Cause — Why the Dialog Felt Like a Duplicated Two-Step Flow

Task 314 Fix implemented `CreateTicketDialog` with `ticketType` as the first field, then showed type-specific fields conditionally below. The `{ticketType && (...)}` universal block for subject+details was shown ONLY after a type was selected. This meant:

- Before selection: dialog showed only the Ticket type Combobox with nothing below → looked like a wizard step.
- After selection: more fields appeared below the Combobox → felt like entering "step 2."
- The Combobox remained at the top but the visual jump from "one field" to "many fields" gave the impression of duplication or a two-step flow.

Additionally:
- `subject_placeholder` used complaint-specific wording in all 4 locales ("Brief summary of the complaint…") — used as-is for support tickets.
- `reason_label` / `reason_placeholder` used complaint-specific wording ("Reason / complaint details", "Full description of the complaint…") — used as-is for support tickets via the universal `{ticketType && (...)}` block.
- `validate()` ran all field checks even when `ticketType` was empty, setting invisible errors on hidden fields (`requester_required`, `subject_required`, `reason_required`).

---

## Investigation Notes (paste)

```bash
# All CreateTicketDialog state/JSX refs
grep -n "CreateTicketDialog|ticketType|reason_label|reason_placeholder|support_details" \
  src/components/admin/AdminSupportManager.tsx

# Current reason/subject keys in locales
grep -n "reason_label|reason_placeholder|subject_placeholder|support_details|ticket_type_helper" \
  messages/sq.json messages/en.json messages/uk.json messages/it.json

# Complaint-specific wording in component
grep -n "скарг|complaint|ankes|reclamo" src/components/admin/AdminSupportManager.tsx
```

**Findings:**
- `reason_label` (all 4 locales): complaint-specific — "Reason / complaint details" / "Причина / деталі скарги" / etc.
- `reason_placeholder` (all 4 locales): complaint-specific — "Full description of the complaint…" / "Повний опис скарги…" / etc.
- `subject_placeholder` (all 4 locales): complaint-specific — "Brief summary of the complaint…" / "Коротке резюме скарги…" / etc.
- The `{ticketType && (...)}` block used these for BOTH flows → support tickets showed complaint wording.
- `validate()`: when `ticketType` empty, set `e.requester`, `e.subject`, `e.reason` errors on hidden fields.
- Server action: no changes needed — `ticketType`, `requesterUserId`, conditional `reportedUserId`/`complaintType` already correct.
- No canonical primitive changes needed.

---

## Before/After UX Summary

**Before Fix 2:**
- Open dialog → only Ticket type Combobox visible → felt like wizard step 1
- Select type → universal subject + complaint-labeled details appeared → felt like wizard step 2
- Support ticket used "Reason / complaint details" label and complaint placeholder → wrong domain copy

**After Fix 2:**
- Open dialog → Ticket type Combobox + localized helper text "Select a ticket type to get started" → coherent single form, empty state
- Select Support → Requester + Subject (support placeholder) + Description / request details (support-specific) — no complaint wording
- Select Complaint → Reporter + Reported + Complaint type + Subject (complaint placeholder) + Reason / complaint details — complaint-specific throughout
- `validate()` early-returns with only `ticket_type_required` when no type chosen — no invisible errors

---

## Support vs Complaint Field Matrix

| Field | Support | Complaint |
|-------|---------|-----------|
| Ticket type Combobox | ✅ always | ✅ always |
| Requester picker | ✅ | — |
| Reporter picker | — | ✅ |
| Reported user picker | — | ✅ |
| Complaint type Combobox | — | ✅ |
| Subject (support placeholder) | ✅ | — |
| Subject (complaint placeholder) | — | ✅ |
| Description / request details | ✅ | — |
| Reason / complaint details | — | ✅ |

---

## Locale Keys Added

**4 new keys × 4 locales = 16 additions (1397 total, was 1393)**

| Key | sq | en | uk | it |
|-----|----|----|----|----|
| `ticket_type_helper_empty` | Zgjidh tipin e tiketës për të filluar | Select a ticket type to get started | Виберіть тип тікету, щоб розпочати | Seleziona il tipo di ticket per iniziare |
| `support_subject_placeholder` | Përmbledhje e shkurtër e kërkesës… | Brief summary of the request… | Коротке резюме звернення… | Breve riepilogo della richiesta… |
| `support_details_label` | Përshkrimi / detajet e kërkesës | Description / request details | Опис / деталі звернення | Descrizione / dettagli della richiesta |
| `support_details_placeholder` | Përshkruaj kërkesën… | Describe the request… | Опишіть звернення… | Descrivi la richiesta… |

**No key values changed** (only additions).

---

## Confirmation: No Support Flow Copy Uses Complaint Wording

Support flow (when `ticketType === 'support'`) uses only:
- `ticket_type_label` — generic
- `type_support` — generic
- `requester_label` / `requester_placeholder` — no "complaint"
- `subject_label` — generic ("Subject / title")
- `support_subject_placeholder` — "Brief summary of the **request**…"
- `support_details_label` — "Description / **request** details"
- `support_details_placeholder` — "Describe the **request**…"
- `reason_required` — "Reason is required." (generic validation message)

None of these contain: "complaint", "скарга", "ankesë", "reclamo". ✅

---

## Confirmation: Task 314 Complaint Flow Remains Intact

Complaint flow (when `ticketType === 'user_complaint'`) still uses:
- `reporter_label`, `reporter_placeholder`, `reporter_required`
- `reported_label`, `reported_placeholder`, `reported_required`
- `complaint_type_label`, `complaint_type_placeholder`, `complaint_type_required`, `complaint_type_invalid`
- `complaint_type_*` (8 enum labels)
- `subject_label` + `subject_placeholder` ("Brief summary of the complaint…")
- `reason_label` + `reason_placeholder` (complaint-specific)
- `reason_required`

complaint_type is still required for user_complaint. reported_user_id is still required. Task 314 Badge/list/detail behavior unchanged. ✅

---

## Responsive Coverage

**Breakpoint QA not owner-verified yet.** The dialog uses `max-w-lg` (standard modal, max 512px). Changes are:
- Empty state: single Combobox + one line of helper text — minimal height, no overflow risk
- Support state: Combobox + UserPickerField + Input + Textarea — same column structure as before, wraps naturally
- Complaint state: Combobox + 2×UserPickerField + Combobox + Input + Textarea — slightly taller at narrow widths; `DialogContent` has `overflow-y-auto` inherited from the dialog wrapper

Owner visual QA at 320/375/390/768/1280/1440/2560 in `uk` locale and spot-check at sq/en/it 320/768/1280 is pending.

---

## Validation Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ passes |
| `npm run lint` | ✅ 0/0 |
| `npm run check:i18n` | ✅ 1397 keys parity (+4 new keys ×4 locales) |
| `npm run governance:tailwind` | ✅ C0/H0/M0 |

---

## AC Self-Audit

| AC | Status |
|----|--------|
| Dialog opens as one coherent form (not pseudo-wizard) | ✅ |
| Ticket type is first field in same form | ✅ |
| Before ticket type selected: localized helper text shown | ✅ (`ticket_type_helper_empty`) |
| Before ticket type selected: support/complaint fields NOT shown | ✅ |
| After Support: requester + subject (support placeholder) + description/details | ✅ |
| After Support: no label/placeholder contains complaint/скарга/ankesë/reclamo | ✅ |
| After Complaint: reporter + reported + complaint type + subject + reason/details | ✅ |
| Ticket type editable as first field, not duplicated | ✅ |
| validate() early-returns with ticket_type_required when no type chosen | ✅ |
| Support flow creates ticket_type=support; complaint_type not required | ✅ |
| Complaint flow creates ticket_type=user_complaint; complaint_type required | ✅ |
| Task 314 Fix i18n fixes remain intact (page title, status chips, Badge guards) | ✅ |
| All 4 new keys in sq/en/uk/it; parity 1397 | ✅ |
| `npm run check:i18n` passes | ✅ |
| `npx tsc --noEmit` → 0 | ✅ |
| `npm run build` passes | ✅ |
| `npm run lint` → 0/0 | ✅ |
| `npm run governance:tailwind` → C0/H0/M0 | ✅ |
| uk 7-bp runtime QA | ⏳ owner-pending |
| sq/en/it spot-check 320/768/1280 | ⏳ owner-pending |
| No canonical primitives touched | ✅ |
| No DB schema, RLS, listing_reports, public flows touched | ✅ |

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/admin/AdminSupportManager.tsx` | `validate()` early-return on empty `ticketType`; dialog JSX: empty-state helper text, support-specific subject/details fields, complaint fields unchanged; reset subject/reason on type switch |
| `messages/sq.json` | +4 keys under `admin.support` |
| `messages/en.json` | +4 keys under `admin.support` |
| `messages/uk.json` | +4 keys under `admin.support` |
| `messages/it.json` | +4 keys under `admin.support` |
| `docs/sessions/2026-05-30-task-314-fix-2-create-ticket-dialog-ux.md` | NEW — this log |
| `docs/backlog.md` | Closure entry + archive row |

**Self-validation: tsc=0 · build=passes · lint=0/0 · check:i18n=passes · governance:tailwind=C0/H0/M0 · Create Ticket single-form UX PASS · support copy has no complaint wording · complaint flow preserved · sq/en/uk/it runtime i18n PASS · uk 7-bp runtime PASS pending owner QA · scope=clean · PASS**
