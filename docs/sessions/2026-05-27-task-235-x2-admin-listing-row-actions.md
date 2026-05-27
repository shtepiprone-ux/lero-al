# Task 235 — X.2 — Restore admin row actions on `/admin/listings`

**Date:** 2026-05-27  
**Sprint:** 12  
**Epic:** X — Domain Type Integrity & Admin Controls

---

## Root cause

K.1 commit (`d91929a0b`) introduced the canonical `ListingPreviewDialog` and removed the `col_actions` table column. The dialog shipped with only View / Edit / Premium / Delete actions — all status-change actions (Approve, Reject, Activate, Deactivate, Archive, Mark as Sold, Mark as Rented, Restore) were missing.

The `updateListingStatus()` server action already existed and was wired to `applyListingTransitionByStatus()` (the transition engine). No DB or action layer work was needed — only UI.

---

## Changes

### `src/components/admin/AdminListingsTable.tsx`

1. **Import**: added `updateListingStatus` to the existing import from `@/modules/admin/actions`.

2. **`STATUS_ACTIONS` constant** (module-level): maps each `ListingStatus` to its allowed target statuses and locale key/styling, derived directly from `ALLOWED_LISTING_TRANSITIONS` in `listingTransitionEngine.ts`:

   | From status | Actions (→ target) |
   |-------------|---------------------|
   | `pending`   | Approve (→ active), Reject (→ inactive), Archive |
   | `active`    | Deactivate (→ inactive), Mark as sold, Mark as rented, Archive |
   | `inactive`  | Activate (→ active), Send to review (→ pending), Archive |
   | `sold`      | Archive |
   | `rented`    | Archive |
   | `archived`  | Restore (→ inactive) |

3. **`ListingPreviewDialog`**: new prop `onStatusChanged: (id, newStatus) => void`; new state `changingStatus: ListingStatus | null`; new `handleStatusChange(toStatus)` async handler; new "Change status" section between the details grid and the footer with per-transition buttons.

4. **Parent `AdminListingsTable`**: `onStatusChanged` handler updates `items` (table row reflects new status badge immediately) and `previewListing` (dialog title/badge updates live). `router.refresh()` syncs from server.

### `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json`

12 new keys added to `admin.listings` in all 4 locales:

| Key | en | sq | uk | it |
|-----|----|----|----|-----|
| `status_section_label` | Change status | Ndrysho statusin | Змінити статус | Cambia stato |
| `btn_approve` | Approve | Aprovo | Схвалити | Approva |
| `btn_reject` | Reject | Refuzo | Відхилити | Rifiuta |
| `btn_activate` | Activate | Aktivizo | Активувати | Attiva |
| `btn_deactivate` | Deactivate | Çaktivizo | Деактивувати | Disattiva |
| `btn_mark_sold` | Mark as sold | Shëno si shitur | Позначити як продане | Segna come venduto |
| `btn_mark_rented` | Mark as rented | Shëno si dhënë me qira | Позначити як здане | Segna come affittato |
| `btn_archive` | Archive | Arkivo | Архівувати | Archivia |
| `btn_send_review` | Send to review | Dërgo për rishikim | Надіслати на перевірку | Invia in revisione |
| `btn_restore` | Restore | Rivendos | Відновити | Ripristina |
| `status_update_success` | Status updated | Statusi u përditësua | Статус оновлено | Stato aggiornato |
| `status_update_error` | Failed to update status — please try again | Gabim gjatë ndryshimit të statusit | Помилка при зміні статусу | Errore nell'aggiornamento dello stato |

---

## Positive flow verification

- Admin opens the dialog for a `pending` listing → sees "Change status" section with: Approve (green), Reject (amber), Archive (muted) ✅
- Admin clicks Approve → spinner shown on that button → `updateListingStatus(id, 'active')` called → success toast → listing row updates to `active` badge live → dialog updates to show `active` status + new action set ✅
- Admin opens dialog for `active` listing → sees: Deactivate, Mark as sold (blue), Mark as rented (purple), Archive (muted) ✅
- Admin opens dialog for `inactive` listing → sees: Activate (green), Send to review, Archive (muted) ✅
- Admin opens dialog for `archived` listing → sees: Restore (green) ✅
- View / Edit / Premium / Delete footer buttons unaffected — preserved exactly ✅

## Negative flow verification

| Branch | Expected | Verified |
|--------|----------|---------|
| `updateListingStatus` returns `{ error }` | toast.error(`status_update_error`) shown; state cleared | ✅ error path in `handleStatusChange` |
| Invalid transition (engine rejects) | `result.error` set → error toast | ✅ engine returns `not_allowed`; surfaced as error toast |
| Clicking while another change is in-flight | all status buttons disabled (`changingStatus !== null`) | ✅ `disabled={changingStatus !== null}` |
| Delete confirm shown | status section hidden (`!showDeleteConfirm`) | ✅ conditional gate |
| `sold` / `rented` listing | only Archive button shown | ✅ `STATUS_ACTIONS.sold/rented = [archive]` |
| No status change → re-open dialog | status badge in dialog and table row unchanged | ✅ no mutation occurs |

---

## Self-validation (Note 18)

- [x] `npx tsc --noEmit` → **0 errors**
- [x] `STATUS_ACTIONS` covers all 6 `ListingStatus` values — exhaustive match
- [x] `updateListingStatus` imported and wired; no direct DB calls
- [x] Transition engine authority preserved: app only passes `toStatus`; engine resolves the action
- [x] 12 locale keys added in all 4 locales (sq/en/uk/it)
- [x] Footer buttons (View, Edit, Premium, Delete) preserved — no regression
- [x] `changingStatus` state prevents double-submit
- [x] `onStatusChanged` parent handler updates both `items` and `previewListing` local state

**Self-validation verdict: PASS** — 0 tsc errors, all AC met, positive + negative flows verified.

---

## §17 UI pre-flight (responsive check)

New "Change status" section is a `flex-wrap` row of `Button` (size sm, variant outline) inside the existing `DialogContent max-w-md`. Buttons wrap naturally on narrow widths. The `DialogContent` uses `overflow-y-auto` at smaller breakpoints. No new layout primitives introduced. All 7 breakpoints unaffected.

---

## Files changed

```
src/components/admin/AdminListingsTable.tsx
messages/en.json
messages/sq.json
messages/uk.json
messages/it.json
docs/backlog.md
docs/sessions/2026-05-27-task-235-x2-admin-listing-row-actions.md
```
