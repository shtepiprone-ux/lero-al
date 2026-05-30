# Admin Modal / Dialog / Sheet Audit — Task 305

**Date:** 2026-05-30  
**Task:** 305 (Epic HH Phase 1 — task #3)  
**Auditor:** Sonnet 4.6  
**Scope:** All admin Dialog / Sheet / AlertDialog / custom modal surfaces

> **Methodology:** Source-code analysis. No browser rendering.

---

## 1. Summary Statistics

> **Count note:** This report has **26 audit rows** (§2.1–§2.26) = 25 data/workflow modal surfaces + 1 AdminSidebar mobile nav Sheet (§2.26). The sidebar Sheet is included for primitive completeness but is navigation infrastructure, not a data/workflow modal. The Task 305 session log counts 25 distinct modal surfaces; both numbers are correct.

| Primitive | Count | Non-canonical |
|-----------|-------|--------------|
| `<Dialog>` with canonical `DialogContent` | 19 | — |
| Custom `div` overlay (not Dialog primitive) | 2 | ⚠️ AdminCurrenciesManager + AdminExchangeProvidersManager |
| `<Sheet>` | 1 (sidebar nav — navigation infrastructure) | — |
| `<AlertDialog>` | 0 | (none yet; all confirms use Dialog) |
| `<Popover>` as modal-like surface | 0 | — |

**Phase 5 migration count:**
- Dialog → AlertDialog (destructive confirms): ~11 modals
- Custom div → canonical Dialog: 2 modals
- Dialog → Sheet on mobile: ~12 modals

---

## 2. Complete Modal Inventory

### 2.1 AdminListingsTable — PremiumToggleDialog

| Field | Value |
|-------|-------|
| Trigger | Premium star button (inline per listing row) |
| Current width | `max-w-sm` (384px) |
| Canonical tier | **sm** (400px) |
| Mobile fallback | Dialog OK at 320 (single confirmation) |
| Content | Title: "Set premium / Remove premium"; Description: listing title (line-clamp-2) |
| Footer | Cancel + Confirm buttons |
| Destructive? | No (reversible) |
| `showCloseButton` | default (visible) |
| Has `DialogDescription` | ✅ Yes (listing title) |
| Phase 5 action | Keep Dialog sm; no AlertDialog needed (non-destructive) |
| 320px observation | Fits comfortably; single action |

### 2.2 AdminListingsTable — ListingPreviewDialog

| Field | Value |
|-------|-------|
| Trigger | Row click anywhere in listings table |
| Current width | `max-w-md` (448px) |
| Canonical tier | **md** (560px) |
| Mobile fallback | **Full-height Sheet** (owner confirmed: action-heavy; status transitions, delete, edit/view links) |
| Content | Title: listing name + premium star; Body: status/type/price/agent grid; Action section: up to 5 status-transition outline buttons + destructive delete + edit link + view link |
| Footer | `flex-wrap gap-2 sm:flex-row` — Cancel + multiple action buttons |
| Has `DialogDescription` | ❌ No (flag LOW — title + visible grid sufficient) |
| `showCloseButton` | default |
| Phase 5 action | → Dialog md (desktop); → full-height Sheet (mobile); delete action → AlertDialog step |
| 320px observation | Dense action buttons likely clip or require scroll; full-height Sheet resolves |

### 2.3 AdminLocationsManager — LocationModal (create/edit)

| Field | Value |
|-------|-------|
| Trigger | Name cell click (edit) or Add button (create) |
| Current width | `max-w-md p-6 bg-card showCloseButton={false}` |
| Canonical tier | **md** (560px) |
| Mobile fallback | Sheet (form with multiple fields + parent Combobox) |
| Content | Name AL + Name EN + Type select + Parent Combobox + Region Combobox + is_featured toggle; Delete button (edit mode, destructive) |
| Footer | Cancel + Save; Delete button (destructive) triggers separate DeleteConfirm |
| Has `DialogDescription` | ❌ No (flag LOW) |
| `showCloseButton` | ❌ `false` — Cancel button in footer |
| Phase 5 action | OK; delete → AlertDialog; width → md |
| 320px observation | Form would crowd at 320; Sheet recommended |

### 2.4 AdminLocationsManager — DeleteConfirmDialog

| Field | Value |
|-------|-------|
| Trigger | Delete trigger from LocationModal |
| Current width | `max-w-sm` |
| Canonical tier | **sm** (400px) |
| Mobile fallback | AlertDialog OK at 320 |
| Content | Title: "Confirm delete" + entity name (DialogDescription) |
| Footer | Cancel + Delete (destructive) |
| Has `DialogDescription` | ✅ Yes (entity name_al) |
| Phase 5 action | → **AlertDialog sm** |

### 2.5 AdminCompaniesManager — CompanyFormDialog

| Field | Value |
|-------|-------|
| Trigger | Name click (edit) or New button (create) |
| Current width | `max-w-sm` (384px) |
| Canonical tier | **sm** → should widen to **md** for logo upload usability |
| Mobile fallback | Sheet (form + logo upload) |
| Content | Company name input + logo upload (file input) |
| Has `DialogDescription` | ❌ No |
| `showCloseButton` | default |
| Phase 5 action | → Dialog md; Sheet on mobile |
| 320px observation | Logo upload at 320 very cramped in sm; Sheet needed |

### 2.6 AdminCompaniesManager — DeleteConfirm (inline `deletingId` state)

| Field | Value |
|-------|-------|
| Trigger | Trash2 button in row (sets `deletingId`); renders inline in page or via Dialog? |
| Current width | `max-w-sm` |
| Canonical tier | **sm** |
| Mobile fallback | AlertDialog OK |
| Content | Confirm delete title + Cancel/Delete buttons |
| Phase 5 action | → **AlertDialog sm**; verify if current implementation is a proper Dialog or inline row state (if inline → must be converted to AlertDialog) |

### 2.7 AdminPropertyTypesManager — PropertyTypeFormDialog

| Field | Value |
|-------|-------|
| Trigger | Row click or New button |
| Current width | `max-w-lg p-0 bg-card showCloseButton={false}` |
| Canonical tier | **md** (560px) — multi-locale form (sq/en/uk/it tabs) |
| Mobile fallback | Full-height Sheet (multi-locale editor) |
| Content | Tabs: one per locale; Name + Icon fields per locale; sort_order; is_active toggle; Delete button (edit mode) |
| Has `DialogDescription` | ❌ No |
| `showCloseButton` | ❌ `false` |
| Phase 5 action | → Dialog md; Sheet on mobile; delete → AlertDialog |
| 320px observation | 4 locale tabs at 320 would be cramped; Sheet + scrollable content needed |

### 2.8 AdminPropertyTypesManager — DeleteDialog

| Field | Value |
|-------|-------|
| Trigger | Delete click in PropertyTypeFormDialog |
| Current width | `max-w-sm p-6 bg-card showCloseButton={false}` |
| Canonical tier | **sm** |
| Phase 5 action | → **AlertDialog sm** |

### 2.9 AdminCurrenciesManager — CurrencyFormModal (custom div) ⚠️

| Field | Value |
|-------|-------|
| Trigger | New currency or Edit button |
| Current width | `max-w-lg max-h-[90vh] overflow-y-auto` — custom `div`, NOT `<Dialog>` primitive |
| Canonical tier | **md** (560px) |
| Mobile fallback | Sheet |
| Issues | Non-canonical: custom div, no focus trap, no `aria-modal`, no Escape handler, no DialogHeader/Footer structure |
| Phase 5 action | → **migrate to canonical `<Dialog md>`** + Sheet on mobile |
| 320px observation | Custom div with `max-h-[90vh]` likely clips at 320 without proper overflow handling |

### 2.10 AdminCurrenciesManager — CurrencyDetailModal

| Field | Value |
|-------|-------|
| Trigger | Currency row click |
| Current width | `max-w-md` |
| Canonical tier | **md** |
| Mobile fallback | Sheet (action-heavy: Edit / Delete / Set-default / Toggle-active buttons) |
| Has `DialogDescription` | ✅ Yes (currency.name_en or name_sq) |
| Footer | `flex-wrap gap-2 sm:gap-2 sm:flex-wrap` |
| Phase 5 action | → Dialog md (desktop); Sheet on mobile; Delete → AlertDialog step |

### 2.11 AdminCurrenciesManager — CurrencyDeleteConfirm

| Field | Value |
|-------|-------|
| Trigger | Delete target set via CurrencyDetailModal |
| Current width | `max-w-sm` |
| Canonical tier | **sm** |
| Has `DialogDescription` | ✅ Yes (currency code + name) |
| Phase 5 action | → **AlertDialog sm** |

### 2.12 AdminExchangeProvidersManager — ProviderFormModal (custom div) ⚠️

| Field | Value |
|-------|-------|
| Trigger | New provider or Edit button |
| Current width | `max-w-lg p-6 max-h-[90vh] overflow-y-auto` — custom `div`, NOT `<Dialog>` |
| Canonical tier | **md** |
| Mobile fallback | Sheet |
| Issues | Non-canonical: same issues as AdminCurrenciesManager custom div |
| Phase 5 action | → **migrate to canonical `<Dialog md>`** + Sheet on mobile |

### 2.13 AdminExchangeProvidersManager — ProviderDeleteConfirm

| Field | Value |
|-------|-------|
| Current width | `max-w-sm` |
| Canonical tier | **sm** |
| Has `DialogDescription` | ✅ Yes (provider.name) |
| Phase 5 action | → **AlertDialog sm** |

### 2.14 AdminEmailTemplatesManager — PreviewDialog

| Field | Value |
|-------|-------|
| Trigger | "Preview" button on template card |
| Current width | `max-w-2xl` (672px) |
| Canonical tier | **lg** (720px) |
| Mobile fallback | Sheet (large read-only email preview) |
| Content | Email HTML preview; read-only |
| Has `DialogDescription` | ❌ No (flag LOW — title includes template key, preview is self-explanatory) |
| Phase 5 action | → Dialog lg; Sheet on mobile |

### 2.15 AdminEmailTemplatesManager — TemplateEditorDialog

| Field | Value |
|-------|-------|
| Trigger | Edit (Pencil) or Create button |
| Current width | `sm:max-w-2xl` → full-width below 640px |
| Canonical tier | **lg** (720px) |
| Mobile fallback | Full-height Sheet (multi-locale editor with subject + body textarea) |
| Content | Key field + locale tabs (sq/en/uk/it) × (subject + body + variables + active toggle) |
| Has `DialogDescription` | ✅ Yes — variables_hint with `{variableSyntax}` (Task 315 ICU fix applied) |
| Footer | `gap-2` — Cancel + Save |
| Phase 5 action | → Dialog lg (desktop); full-height Sheet (mobile); `sm:max-w-2xl` already responsive |
| Note | `sm:max-w-2xl` = already full-width below 640px — good responsive behavior exists |

### 2.16 AdminEmailTemplatesManager — DeleteConfirmDialog

| Field | Value |
|-------|-------|
| Current width | `max-w-sm` |
| Canonical tier | **sm** |
| Has `DialogDescription` | ✅ Yes (template key) |
| Phase 5 action | → **AlertDialog sm** |

### 2.17 AdminInquiriesManager — InquiryDetailDialog

| Field | Value |
|-------|-------|
| Trigger | Row click (entire inquiry card) |
| Current width | `max-w-2xl max-h-[90vh] overflow-y-auto` |
| Canonical tier | **lg** (720px) |
| Mobile fallback | Full-height Sheet (workflow: thread + reply form + status Combobox) |
| Content | Inquiry details + full reply thread + reply textarea + status Combobox |
| Has `DialogDescription` | Minimal (title from t('detail_title')) |
| Scroll | ✅ `max-h-[90vh] overflow-y-auto` already present |
| Phase 5 action | → Dialog lg (desktop); full-height Sheet (mobile); scroll is already handled |

### 2.18 AdminLegalManager — PageEditorDialog

| Field | Value |
|-------|-------|
| Trigger | Edit (Pencil) icon or New Doc button |
| Current width | `max-w-2xl p-6 bg-card showCloseButton={false}` |
| Canonical tier | **lg** (720px) |
| Mobile fallback | Full-height Sheet (content editor) |
| Content | Title input + Slug input + Body textarea + is_published toggle |
| Has `DialogDescription` | ❌ No |
| `showCloseButton` | ❌ `false` — verify Cancel button exists in footer |
| Phase 5 action | → Dialog lg; full-height Sheet; verify cancel button; add description (LOW) |

### 2.19 AdminPopularLocationsManager — DeleteConfirm

| Field | Value |
|-------|-------|
| Trigger | From edit dialog (delete flow) |
| Current width | `max-w-sm` |
| Canonical tier | **sm** |
| Has `DialogDescription` | ❌ No — title only |
| Phase 5 action | → **AlertDialog sm** (add description: required for AlertDialog) |

### 2.20 AdminPopularLocationsManager — LocationDialog (create/edit)

| Field | Value |
|-------|-------|
| Trigger | Row click or Add button |
| Current width | `max-w-md` |
| Canonical tier | **md** |
| Mobile fallback | Sheet (form with location Combobox + display order + photo upload) |
| Content | Location picker Combobox + display order + photo upload |
| Footer | `flex-wrap gap-2 sm:justify-between` — NON-CANONICAL footer |
| Phase 5 action | → Dialog md; Sheet mobile; fix footer to `gap-2` standard alignment |

### 2.21 AdminReportsManager — ReportDetailDialog (multi-state)

| Field | Value |
|-------|-------|
| Trigger | Row click |
| Current width | `max-w-md` |
| Canonical tier | **md** (560px) |
| Mobile fallback | Full-height Sheet (multi-state workflow, 5 states) |
| Content | Multi-state modal: review (initial state), take action (4 action variants), resolution complete |
| Issues | `DialogTitle className="text-destructive"` / `text-status-warning"` / `text-status-success"` — NON-CANONICAL; status color belongs in body Badge, not title |
| Has `DialogDescription` | ❌ — No per-state descriptions |
| Phase 5 action | → Dialog md; full-height Sheet; migrate status color from title text to body Badge |

### 2.22 AdminSupportManager — TicketDetailDialog

| Field | Value |
|-------|-------|
| Trigger | Row click |
| Current width | `max-w-2xl max-h-[90vh] overflow-y-auto` |
| Canonical tier | **lg** (720px) |
| Mobile fallback | Full-height Sheet (workflow: metadata + reason + status switcher + timeline) |
| Content | Metadata grid (reporter/reported/created-by/type/status/date) + reason section + status switcher + note textarea + Update button + timeline |
| Has `DialogDescription` | ❌ No (subject in title; content self-explanatory; flag LOW) |
| Scroll | ✅ `max-h-[90vh] overflow-y-auto` |
| Phase 5 action | → Dialog lg; full-height Sheet; scroll already handled |

### 2.23 AdminSupportManager — CreateTicketDialog

| Field | Value |
|-------|-------|
| Trigger | "+ New ticket" button |
| Current width | `max-w-lg` (512px) |
| Canonical tier | **md** (560px) |
| Mobile fallback | Full-height Sheet (form with Comboboxes + pickers + textarea) |
| Content | Ticket type Combobox + conditional fields (requester/reporter/reported/complaint-type/subject/reason) |
| Has `DialogDescription` | ❌ No |
| Footer | `gap-2` — Cancel + Create |
| Phase 5 action | → Dialog md; full-height Sheet |

### 2.24 AdminUserProfile — Confirmation Dialogs (×5, all `max-w-sm`)

| Dialog | Destructive? | Phase 5 action |
|--------|-------------|---------------|
| Block user | ✅ Yes | → AlertDialog sm |
| Deactivate user | ✅ Yes | → AlertDialog sm |
| Activate user | No | Keep Dialog sm |
| Role change | No | Keep Dialog sm |
| Email/status confirm | No | Keep Dialog sm |

All: `showCloseButton={false}` — verify Cancel button exists in each.

### 2.25 AdminDashboardRecentListings — ListingDialog

| Field | Value |
|-------|-------|
| Trigger | Recent listing click on dashboard |
| Current width | `max-w-md` |
| Canonical tier | **md** |
| Mobile fallback | Dialog OK if read-only preview only |
| Has `DialogDescription` | ❌ No (flag LOW) |
| Phase 5 action | Verify if any write actions exist; if read-only → Dialog OK |

### 2.26 AdminSidebar — Mobile Nav Sheet

| Field | Value |
|-------|-------|
| Trigger | Hamburger icon in mobile header |
| Current | `<Sheet side="left" className="w-64 p-0">` |
| Canonical | ✅ Already canonical Sheet |
| Phase 5 action | OK — no changes needed |

---

## 3. Task 305 STOP & ASK Resolutions

| Question | Resolution |
|----------|-----------|
| AdminListingsTable ListingPreviewDialog tier (md vs. lg) | **md (560px)** — standard detail+action, not multi-section. Mobile: full-height Sheet (owner confirmed). |
| Destructive confirm pattern (Dialog vs. AlertDialog) | **→ AlertDialog** — stronger accessibility semantics, clearer urgency. Non-destructive confirms stay Dialog. |
| Title + Description rule | Description **optional** (flag LOW). **Required** for AlertDialog. Complex/irreversible workflows required. |
| Status badge placement | **Body metadata grid** — header stays clean. AdminReportsManager colored title = non-canonical → Phase 5 migrates to body Badge. |

---

## 4. Phase 5 Migration Summary

### AlertDialog migrations required (~11 modals)

| Modal | Component |
|-------|-----------|
| Premium toggle dialog | AdminListingsTable |
| Location delete | AdminLocationsManager |
| Company delete | AdminCompaniesManager |
| Property type delete | AdminPropertyTypesManager |
| Currency delete | AdminCurrenciesManager |
| Provider delete | AdminExchangeProvidersManager |
| Email template delete | AdminEmailTemplatesManager |
| Popular location delete | AdminPopularLocationsManager |
| Block user | AdminUserProfile |
| Deactivate user | AdminUserProfile |
| (Listing delete step inside preview dialog) | AdminListingsTable |

### Custom div → canonical Dialog migrations (~2 modals)

- AdminCurrenciesManager CurrencyFormModal
- AdminExchangeProvidersManager ProviderFormModal

### Dialog → Sheet on mobile (~12 modals)

All md/lg tier modals listed as "Sheet" or "Full-height Sheet" in §11.11 of `admin-ux-rules.md`.

### Non-canonical patterns to fix

- AdminReportsManager: colored `DialogTitle` text → body Badge (3 state variants)
- AdminCompaniesManager delete: inline `deletingId` state → proper AlertDialog
- `showCloseButton={false}` audit: 6 modals (AdminLegalManager, AdminLocationsManager, AdminPropertyTypesManager ×2, AdminUserProfile ×5)

---

## 5. Width Divergence from Canonical Tiers

| Current class | px | Canonical tier | Delta |
|--------------|-----|----------------|-------|
| `max-w-sm` | 384px | sm (400px) | +16px |
| `max-w-md` | 448px | md (560px) | +112px |
| `max-w-lg` | 512px | md (560px) | +48px |
| `sm:max-w-2xl` / `max-w-2xl` | 672px | lg (720px) | +48px |

All current widths are narrower than the canonical tier. Phase 5 must apply the canonical tier classes.

---

## Appendix: Files Read

- `src/components/admin/AdminListingsTable.tsx`
- `src/components/admin/AdminLocationsManager.tsx`
- `src/components/admin/AdminCompaniesManager.tsx`
- `src/components/admin/AdminPropertyTypesManager.tsx`
- `src/components/admin/AdminCurrenciesManager.tsx`
- `src/components/admin/AdminExchangeProvidersManager.tsx`
- `src/components/admin/AdminEmailTemplatesManager.tsx`
- `src/components/admin/AdminInquiriesManager.tsx`
- `src/components/admin/AdminLegalManager.tsx`
- `src/components/admin/AdminPopularLocationsManager.tsx`
- `src/components/admin/AdminReportsManager.tsx`
- `src/components/admin/AdminSupportManager.tsx`
- `src/components/admin/AdminUserProfile.tsx`
- `src/components/admin/AdminDashboardRecentListings.tsx`
- `src/components/admin/AdminSidebar.tsx`
