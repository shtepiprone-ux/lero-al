# Task 306-Fix-2 — Admin mobile responsive primitives + status_control i18n governance

**Date:** 2026-05-31  
**Sprint:** 28  
**Type:** Corrective — systemic fix at primitive level  
**Gate:** Replaces Gate G3' (FAIL). Requires owner re-QA at G3'' before Tasks 308+309 can proceed.

---

## Root causes

### Root cause A — Missing `admin.common.status_control` keys (runtime i18n errors)

`StatusChangeControl` calls `useTranslations('admin.common.status_control')` and renders `t(s.labelKey)` where consumers pass `labelKey: 'status_new'`, `'status_in_progress'`, `'status_closed'`. These keys did not exist in `admin.common.status_control` in ANY of the 4 locales — all 4 files had identical gaps, so the parity check passed without catching them.

**Evidence:** `AdminInquiriesManager` passes `labelKey: \`status_${s}\`` for `ContactStatus` values `new`/`in_progress`/`closed`. These resolved to `admin.common.status_control.status_new` etc., which were absent → `MISSING_MESSAGE` runtime errors in all 4 locales.

### Root cause B — `useIsMobile` was a local private function

`useIsMobile` was defined inside `AdminListingsTable.tsx` with no export. Any other admin component needing the same Sheet/Dialog switch had to duplicate it or go without — creating the "inconsistent pattern" observed in production.

### Root cause C — `AdminPageHeader` (older primitive) has no mobile-stacking breakpoint

`AdminPageHeader` used `flex items-start justify-between gap-4` with no `flex-col md:flex-row` breakpoint. Below `md:`, title and action element contested horizontal space — causing header chaos at 320–390px. (`AdminPageShell` already stacked correctly; `AdminPageHeader` did not.)

### Root cause D — `AdminInquiriesManager` detail dialog was Dialog-only at all sizes

The detail popup for inquiry rows used `<Dialog>` at all widths with no mobile bottom-sheet fallback. Per `admin-ux-rules.md §11.2 Decision 5` and `§14.3`, action-heavy workflow dialogs must use `<Sheet side="bottom">` below `lg:` (1024px). The result: on mobile, the detail opened as a center-anchored dialog — potentially clipped by viewport, with buttons cramped at the bottom.

### Root cause E — `AdminInquiriesManager` filter bar: `ml-auto` mailbox section broke on mobile

The status filter buttons and mailbox filter buttons were in the same `flex flex-wrap` row. The mailbox div used `ml-auto flex gap-2`, which at narrow widths caused the buttons to squeeze against the right edge or overflow without wrapping. The buttons also used `size="lg"` (48px tall) which consumed excessive vertical space on mobile.

---

## Fixes

### A. i18n: Add 7 keys to `admin.common.status_control` in all 4 locales

Added to `messages/{sq,en,uk,it}.json` under `admin.common.status_control`:
- `status_new`, `status_in_progress`, `status_closed` — ContactStatus labels (used by `AdminInquiriesManager`)
- `support_status_open`, `support_status_in_progress`, `support_status_resolved`, `support_status_closed` — TicketStatus labels (for completeness + future `AdminSupportManager` migration)

Values reuse existing translations from `admin.inquiries.status_*` and `admin.support.support_status_*` namespaces for consistency.

**Governance:** Once these keys exist in all 4 locales, the parity check WILL catch any future single-locale addition. Additionally, `admin-ux-rules §13.4` (per-surface assignment table) documents that any `StatusChangeControl` consumer must co-locate its `labelKey` strings in `admin.common.status_control`.

### B. Shared `useIsMobile` hook

New file `src/hooks/useIsMobile.ts` — exports `useIsMobile(): boolean` that reads `window.matchMedia('(max-width: 1023px)')`. Starts `true` (mobile-first, SSR-safe); updates on client after hydration. Dialogs only open after user interaction, so the correct value is always set before the sheet/dialog renders.

`AdminListingsTable.tsx` updated to import from the shared hook (local definition removed).

### C. `AdminPageHeader` mobile fix

```diff
- <div className="admin-page-header flex items-start justify-between gap-4 mb-6">
-   <div>
-     <h1 className="text-2xl font-bold text-foreground">{title}</h1>
+ <div className="admin-page-header flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4 mb-6">
+   <div className="min-w-0">
+     <h1 className="text-xl font-bold text-foreground break-words md:text-2xl">{title}</h1>
```

- Below `md:` (768px): title stacks above action — no horizontal contest
- `text-xl` at mobile, `md:text-2xl` at 768px+
- `break-words` prevents long titles from overflowing
- `actions` div gets `flex-wrap gap-2` for button wrapping

`AdminPageShell.tsx` title updated to same `text-xl md:text-2xl` pattern for consistency.

### D. `AdminInquiriesManager` bottom-sheet for mobile

Detail row popup now uses `useIsMobile()`:
- `isMobile=true` → `<Sheet side="bottom">` with `rounded-t-2xl max-h-[90vh] overflow-y-auto`, drag handle, single-column metadata grid, full-width Send button (`w-full`)
- `isMobile=false` → existing `<Dialog>` (unchanged desktop behavior)

Both paths preserve all functionality: status change, reply history, reply composer, send action.

### E. `AdminInquiriesManager` filter bar

Restructured from single `flex flex-wrap` row to two stacked `flex flex-wrap` rows:
- Row 1: status filters (All / New / In progress / Closed)
- Row 2: mailbox filters (All mailboxes / Support / Sales) — hidden when `mailboxScope` is set per Note 21

Both rows use `size="sm"` buttons (36px, not 48px) — appropriate for a filter bar. Buttons wrap naturally at any width. No `ml-auto` overflow risk.

---

## Current behavior preserved (Notes 19/20/23)

- Desktop Dialog path in `AdminInquiriesManager`: **identical to before** (grid-cols-2, max-w-2xl, same content)
- StatusChangeControl in both Sheet and Dialog: **identical** — same `variant="select"`, same options, same `onSubmit`
- Reply composer in both Sheet and Dialog: **identical** — same Textarea, same Send button, same `disabled` logic
- All filter buttons still present: status (All/New/In progress/Closed) + mailbox (All/Support/Sales)
- All existing admin actions reachable: status change, reply send, mailbox filtering
- `AdminListingsTable` Sheet/Dialog switch: **unchanged** (only import changed from local to shared hook)
- `AdminPageShell` structural layout: **unchanged** (only title size responsive scaling added)
- `AdminPageHeader` structural layout: **unchanged** (stacking added; no action removal)
- `AdminTable`, `AdminCardList` primitives: **untouched**
- Tasks 308 + 309: **still blocked** — this corrective does NOT proceed with route migrations

---

## Responsive verification (code-level)

| Width | AdminInquiriesManager | AdminListingsTable | AdminPageHeader |
|-------|-----------------------|-------------------|-----------------|
| 320   | Card list wrap ✅; filter row stacks ✅; Sheet opens on tap ✅; full-width Send ✅ | Cards wrap; Sheet opens on tap ✅ | Title stacks above action ✅ |
| 375   | Same as 320 ✅ | Same ✅ | Same ✅ |
| 390   | Same ✅ | Same ✅ | Same ✅ |
| 480   | Filter buttons wrap if needed ✅ | Cards ✅ | Stacked ✅ |
| 768   | Still below lg:; Sheet active ✅ | Still below lg:; Sheet active ✅ | Transitions to row at md: ✅ |
| 1024  | Crosses lg:; Dialog active ✅ | Crosses lg:; Dialog active ✅; table visible ✅ | Row layout ✅ |
| 1920  | Desktop Dialog ✅ | Desktop Dialog ✅; table full-width ✅ | Row layout ✅ |
| 2560  | Same ✅ | container-admin caps at 1792px ✅ | Same ✅ |

---

## Routes checked

| Route | Issues fixed | Desktop preserved |
|-------|-------------|-------------------|
| `/admin/listings` | useIsMobile now shared; listing preview Sheet on mobile ✅ | Dialog on desktop ✅ |
| `/admin/inquiries/support` | i18n errors fixed; filter bar wrap; detail Sheet on mobile ✅ | Dialog on desktop ✅ |
| `/admin/inquiries/sales` | Same (same component) ✅ | Same ✅ |
| All routes using `AdminPageHeader` | Mobile stacking + title scaling ✅ | Desktop row layout preserved ✅ |

Routes NOT changed (Tasks 308/309 scope): `/admin/users`, `/admin/support`.

---

## Files Changed

| Path | Change | Rationale |
|------|--------|-----------|
| `messages/sq.json` | +7 keys to `admin.common.status_control` | Fix runtime MISSING_MESSAGE for sq locale |
| `messages/en.json` | +7 keys | Fix runtime MISSING_MESSAGE for en locale |
| `messages/uk.json` | +7 keys | Fix runtime MISSING_MESSAGE for uk locale (reported) |
| `messages/it.json` | +7 keys | Fix runtime MISSING_MESSAGE for it locale |
| `src/hooks/useIsMobile.ts` | NEW — shared hook | Single source of truth; prevents hook duplication |
| `src/components/admin/AdminListingsTable.tsx` | Import `useIsMobile` from shared hook; remove local definition | DRY |
| `src/components/admin/AdminPageHeader.tsx` | `flex-col md:flex-row`; `text-xl md:text-2xl`; `break-words`; action `flex-wrap` | Mobile stacking |
| `src/components/admin/AdminPageShell.tsx` | Title `text-xl md:text-2xl break-words` | Consistent title scaling |
| `src/components/admin/AdminInquiriesManager.tsx` | Import Sheet + `useIsMobile`; Sheet/Dialog detail switch; filter bar two-row wrap; full-width Send; single-col metadata in Sheet | Mobile responsive |

---

## Validation

```
tsc --noEmit       → 0 errors
next lint          → 0 warnings / 0 errors
check:i18n parity  → ✅ PASSED — 1438 keys × 4 locales (was 1431, +7 status_control keys)
next build         → passes
```

## Gate

Owner re-QA at widths **320, 375, 390, 768, 1024, 1920** × locales **sq/en/uk/it**:
- No MISSING_MESSAGE errors in console
- No clipped filter buttons
- Detail popup opens as Sheet from bottom on mobile
- Detail popup opens as Dialog on desktop
- StatusChangeControl Combobox shows label text (not key string)
- Send button full-width on mobile
- Admin page headers (AdminPageHeader + AdminPageShell) stack cleanly at 320–390px

Gate: **G3''** — Tasks 308 + 309 remain blocked until PASS.

Self-validation: tsc=0 · lint=0/0 · build=passes · check:i18n=1438×4 PASS · all admin actions preserved · scope=clean
