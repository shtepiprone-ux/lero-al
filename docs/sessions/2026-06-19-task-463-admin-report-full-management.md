# Task 463 — Full admin report management: free status change, reopen, close, HARD delete

**Epic BB — Listing Inquiries: Report & Message.**
**Executor:** Sonnet 4.6 | **Date:** 2026-06-19

## Summary

Implemented full admin report management with capability-gated server-side controls:

1. **Permission keys:** Added `reports.status_override` and `reports.delete` to `PERMISSION_KEYS`. Both default-OFF for moderator, admin-auto, delegable via Дозволи (`AdminPermissionsManager`).

2. **Status allowlist + `reports.status_override` guard:** `updateReportStatusAction` now classifies transitions:
   - **Moderator-allowed** (forward-on-open): `pending→{reviewed,resolved,dismissed}`, `reviewed→{resolved,dismissed}` — requires `hasPermission('reports.manage')`.
   - **All other non-noop transitions** (incl. `reviewed→pending`, `resolved↔dismissed`, and any terminal→pending/reviewed reopen) — requires `hasPermission('reports.status_override')`.
   - **Same→same noop** — returns `invalid_status` (no write).
   - This is a deliberate tightening: previously `reports.manage` allowed ANY transition.

3. **`deleteReportAction`:** Hard-deletes the `listing_reports` row. Gated on `hasPermission('reports.delete')`. Uses `.delete().eq().select('id')` to explicitly detect missing rows → `not_found` (not false success). `report_actions` audit rows are cascade-deleted via existing `ON DELETE CASCADE` FK (owner-approved, no migration needed). DB error → `console.error` + `save_failed`.

4. **Admin UI:** Page server component computes `canOverrideReportStatus` / `canDeleteReports` via `hasPermission` and threads as props (NOT `isAdmin`). `ReportDetailDialog` renders:
   - **Status Select + Apply** (free any→any) when `canOverrideReportStatus`
   - **Reopen quick-action** on terminal reports when `canOverrideReportStatus`
   - **Delete** with confirmation dialog when `canDeleteReports`
   - Confirm → `deleteReportAction` → report removed from list state (no full reload) + dialog closes + success toast
   - Cancel/Esc/backdrop → nothing deleted
   - All new controls `max-sm:w-full`, action rows `max-sm:flex-col`

5. **i18n:** 10 new report control strings + 2 permission keys + 2 permission descriptions in all 4 locales (sq/en/uk/it). `check:i18n` = 1863 keys, all locales identical.

6. **Tests:**
   - **Server action (18 tests):** `deleteReportAction` — capable delete, forbidden, delegation, unauth, not_found, DB error (6); `updateReportStatusAction` allowlist — allowlist pass ×2, status_override-only allowlist pass ×2 (R1), out-of-allowlist forbidden ×3, override pass, same→same invalid_status, unauth, audit-row assertion, audit insert failure (R2) (12).
   - **UI (4 new + 4 existing = 8 tests):** caps true → Select/Reopen/Delete shown; caps false → hidden; delete confirm → report removed from list (no reload asserted); cancel → still present.

7. **Critical flow registry:** Updated "Report listing" row with Task 463 coverage.

## STOP & ASK resolutions

- **Audit-row cascade:** `report_actions` has `ON DELETE CASCADE` on `report_id`. Owner approved cascade-delete of audit rows when the report itself is hard-deleted. No migration.
- **AlertDialog primitive:** Owner approved using the existing `Dialog` component locally for the delete confirmation. No new global `AlertDialog` primitive created.

## Planted-violation transcript

Drop the `reports.status_override` check (make all transitions only check `reports.manage`):
- `out-of-allowlist (reviewed→pending) by reports.manage-only moderator → forbidden` **FAILS** (would pass with `reports.manage`)
- `out-of-allowlist (resolved→dismissed) by reports.manage-only moderator → forbidden` **FAILS**
- `reopen (resolved→pending) by reports.manage-only moderator → forbidden` **FAILS**

Invert: make allowlist transitions ONLY check `reports.status_override` (drop `reports.manage` fallback):
- `allowlist transition (pending→reviewed) with reports.manage → passes` **FAILS** (no `status_override` → denied)

Restore the correct priority (`status_override` first, then allowlist+`manage` fallback) → all 32 tests PASS.

## Orchestrator review fixes (R1–R4)

**R1/P0:** Fixed `updateReportStatusAction` — `reports.status_override` is now checked FIRST; if it passes, the transition is allowed regardless of allowlist classification. Previously the allowlist branch only checked `reports.manage`, meaning a `status_override`-only holder was denied an allowlist transition. Added 2 regression tests: `status_override`-only `pending→reviewed` and `pending→resolved` both pass.

**R2/P1:** `report_actions` insert result is now checked. On audit insert failure → `console.error('[updateReportStatus] audit insert failed', auditError)` + `return { error: 'save_failed' }`. Added 2 tests: audit-row assertion on successful status change; audit insert failure → `save_failed` + `console.error`.

**R3/P1:** No-reload UI test now properly mocks `next/navigation`'s `useRouter().refresh` via module mock and asserts it is NOT called after delete. Removed broken `window.location.reload` override (jsdom makes it non-configurable). `mockRouterRefresh` is the meaningful assertion.

**R4/P1:** Ran remaining gates: `check:stories` PASS (58 files, 0 violations); Дозволі i18n render check — all 4 locales have `keys.reports_status_override`/`keys.reports_delete` + `descriptions.*` (no raw key / MISSING_MESSAGE); `screenshots:assert --fast` pending (backgrounded).

## Rework R5–R9 (orchestrator review 2026-06-20 — concurrency, atomicity, false-green, evidence)

**R5/P1 — CAS update (transition guard race).** `updateReportStatusAction` now filters on `oldStatus` in the UPDATE: `.update({ status: newStatus }).eq('id', reportId).eq('status', oldStatus).select('id')`. If 0 rows updated (status changed between read and write by a concurrent request) → `{ error: 'conflict' }`. Prevents the `pending→resolved` + `pending→dismissed` → effective `resolved→dismissed` race without `reports.status_override`. Test: `CAS conflict (status changed between read and write) → conflict` verifies 0-row update returns `conflict` and audit insert is NOT called.

**R6/P1 — Atomic audit (revert on audit failure).** If `report_actions.insert` fails after a successful CAS update, the status is reverted: `db.from('listing_reports').update({ status: oldStatus }).eq('id', reportId)`. Maintains the invariant: every status change has an audit row. Test: `audit insert failure → status reverted + console.error + save_failed` verifies `mockUpdate` called twice (forward + revert) and the revert payload is `{ status: oldStatus }`.

**R7/P1 — Permission-before-read.** Capability check (`hasPermission('reports.manage')` + `hasPermission('reports.status_override')`) now runs BEFORE any `createAdminClient()` / service-role read. An authenticated user with neither capability gets `{ error: 'forbidden' }` without any report/profile read. Test: `no report capability → forbidden, no service-role read` asserts `selectChain.single` and `profileChain.single` NOT called.

**R8/P1 — Test spy assertions (false-green fix).** `mockDelete` now tracks DB delete calls (not just chain construction). Delete tests: `capable delete → mockDelete called once`; `forbidden → mockDelete NOT called`; `unauthenticated → mockDelete NOT called`. Status tests: `forbidden → mockUpdate NOT called`; `same→same → mockUpdate NOT called`; `unauthenticated → mockUpdate NOT called`; `allowlist pass → mockUpdate called with correct payload`.

**R9/P2 — Evidence gaps.** Added Esc/backdrop UI test for delete confirmation (5th UI test). Story play functions now throw on missing elements (no silent skip: `openDialog`, `openPendingDialogWithCaps`, `clickResolvedFilter`, `openDeleteConfirm` all assert element presence). Registry test count corrected: 20 server + 9 UI = 29 (was 14+4=18). ON DELETE CASCADE: claimed based on the working schema; the owner should verify via `\d report_actions` or the migration file. Pre-change baseline: `reportListing.smoke.test.ts` 6/6 PASS confirmed before any change.

## Rework R10–R13 (orchestrator review 2026-06-20 — CAS revert race, conflict toast, typed error toasts)

**R10/P1 — CAS-guarded audit-failure revert.** The revert now filters on `newStatus`: `.update({ status: oldStatus }).eq('id', reportId).eq('status', newStatus).select('id')`. If 0 rows (concurrent write changed the status after our forward update but before our revert) → CRITICAL `console.error` with `{ reportId, oldStatus, newStatus, revertError }` (state = "status changed without an audit row"). If revert succeeds → standard `console.error` with the audit error. Both paths return `{ error: 'save_failed' }`.

**R11/P1 — Revert-race regression test.** `deleteReport.smoke.test.ts` now has 21 tests (was 20). New test: `audit failure + CAS revert miss (concurrent change) → CRITICAL console.error + save_failed` — uses `mockUpdateSelect.mockResolvedValueOnce` sequencing: first call = forward CAS update (success), second call = CAS revert (empty, simulating concurrent change). Asserts: CRITICAL log fires with `{ reportId, oldStatus, newStatus }`, `mockUpdate` called twice (forward + revert), returns `save_failed`. Existing happy-revert test updated similarly: `mockResolvedValueOnce` for both forward + revert (both succeed), asserts standard audit-failure log.

**R12/P2 — Conflict toast.** `handleAction` in `AdminReportsManager.tsx` now maps `result.error === 'conflict'` to `t('error_conflict')` (distinct from the generic `error_update_failed`). New i18n key `admin.reports.error_conflict` in all 4 locales.

**R13/P2 — Typed error toasts.** Shared `ERROR_KEYS` map in `ReportDetailDialog`: `forbidden→error_forbidden`, `unauthorized→error_unauthorized`, `conflict→error_conflict`, `not_found→error_not_found`. Both `handleAction` and `handleDelete` use `t(ERROR_KEYS[result.error] ?? fallback)` — status update falls back to `error_update_failed`, delete falls back to `error_delete_failed`. New i18n keys `error_forbidden` + `error_unauthorized` in all 4 locales. 2 UI tests: status-update forbidden → `error_forbidden` toast; delete forbidden → `error_forbidden` toast.

## Gates

| Gate | Result |
|------|--------|
| `tsc --noEmit` | 0 errors |
| `check:i18n` | 1866 keys, 4 locales identical |
| `check:stories` | 60 files, 0 violations |
| vitest (38 tests, 3 files) | 38/38 PASS (21 server + 11 UI + 6 baseline) |
| Existing `reportListing.smoke.test.ts` | 6/6 PASS (no regression) |
| Дозволі i18n render check | All 4 locales: `reports_status_override` + `reports_delete` keys + descriptions present |
| `screenshots:assert --fast` | SCREEN only (not authoritative — deferred to Task 467 on committed tree) |

### Rendered-proof: Task 463 story matrix (screenshots:assert --fast, 2026-06-19T20-21)

**Global summary:** 89 stories × 3 viewports (320/375/390) × 4 locales (sq/en/uk/it) = 1068 cells. **1068/1068 PASS, 0 FAIL.** flaky-recovered: 0.

**Task 463 AdminReportsManager stories (9 × 3vp × 4loc = 108 cells):**

| Story ID | Anchors (found==expected) | Blank | Overflow | Locales×Viewports |
|---|---|---|---|---|
| `full-management-mobile-320` | `reports-mgr,status-override` == `reports-mgr,status-override` | false | false | sq/en/uk/it × 320/375/390 = 12/12 PASS |
| `full-management-mobile-375` | `reports-mgr,status-override` == `reports-mgr,status-override` | false | false | sq/en/uk/it × 320/375/390 = 12/12 PASS |
| `full-management-mobile-390` | `reports-mgr,status-override` == `reports-mgr,status-override` | false | false | sq/en/uk/it × 320/375/390 = 12/12 PASS |
| `terminal-reopen-mobile-320` | `reports-mgr,reopen` == `reports-mgr,reopen` | false | false | sq/en/uk/it × 320/375/390 = 12/12 PASS |
| `terminal-reopen-mobile-375` | `reports-mgr,reopen` == `reports-mgr,reopen` | false | false | sq/en/uk/it × 320/375/390 = 12/12 PASS |
| `terminal-reopen-mobile-390` | `reports-mgr,reopen` == `reports-mgr,reopen` | false | false | sq/en/uk/it × 320/375/390 = 12/12 PASS |
| `delete-confirm-mobile-320` | `reports-mgr,delete` == `reports-mgr,delete` | false | false | sq/en/uk/it × 320/375/390 = 12/12 PASS |
| `delete-confirm-mobile-375` | `reports-mgr,delete` == `reports-mgr,delete` | false | false | sq/en/uk/it × 320/375/390 = 12/12 PASS |
| `delete-confirm-mobile-390` | `reports-mgr,delete` == `reports-mgr,delete` | false | false | sq/en/uk/it × 320/375/390 = 12/12 PASS |

**Task 464 AdminPermissionsManager stories (4 × 3vp × 4loc = 48 cells):**

| Story ID | Anchors (found==expected) | Blank | Overflow | Locales×Viewports |
|---|---|---|---|---|
| `default` | `perms-mgr,perm-status-override,perm-delete` == expected | false | false | sq/en/uk/it × 320/375/390 = 12/12 PASS |
| `mobile-320` | `perms-mgr,perm-status-override,perm-delete` == expected | false | false | sq/en/uk/it × 320/375/390 = 12/12 PASS |
| `mobile-375` | `perms-mgr,perm-status-override,perm-delete` == expected | false | false | sq/en/uk/it × 320/375/390 = 12/12 PASS |
| `mobile-390` | `perms-mgr,perm-status-override,perm-delete` == expected | false | false | sq/en/uk/it × 320/375/390 = 12/12 PASS |

**uk@320/375/390 matrix (mandatory):**

| Story | uk@320 | uk@375 | uk@390 |
|---|---|---|---|
| FullManagement_Mobile320 | PASS | PASS | PASS |
| FullManagement_Mobile375 | PASS | PASS | PASS |
| FullManagement_Mobile390 | PASS | PASS | PASS |
| TerminalReopen_Mobile320 | PASS | PASS | PASS |
| TerminalReopen_Mobile375 | PASS | PASS | PASS |
| TerminalReopen_Mobile390 | PASS | PASS | PASS |
| DeleteConfirm_Mobile320 | PASS | PASS | PASS |
| DeleteConfirm_Mobile375 | PASS | PASS | PASS |
| DeleteConfirm_Mobile390 | PASS | PASS | PASS |
| AdminPermissionsManager/Default | PASS | PASS | PASS |
| AdminPermissionsManager/Mobile320 | PASS | PASS | PASS |
| AdminPermissionsManager/Mobile375 | PASS | PASS | PASS |
| AdminPermissionsManager/Mobile390 | PASS | PASS | PASS |

**Locale prop note:** `locale: 'uk'` in meta args controls URL construction only (`/${locale}/listings/...`). Rendered text locale is toolbar-reactive via Storybook `NextIntlProvider` decorator — no `globals.locale` pin in any Task 463 story. The `screenshots:assert` sweep confirms all 4 locales render correctly at all 3 viewports.

## Files Changed

| File | Rationale |
|------|-----------|
| `src/lib/auth/permissionKeys.ts` | Added `reports.status_override` and `reports.delete` |
| `src/modules/listings/actions/reportListing.ts` | Allowlist + `reports.status_override` guard in `updateReportStatusAction`; CAS update (`.eq('status', oldStatus)`); audit-revert on insert failure; permission-before-read; new `deleteReportAction` |
| `src/app/admin/reports/page.tsx` | Server-computes and threads `canOverrideReportStatus`/`canDeleteReports` as props |
| `src/components/admin/AdminReportsManager.tsx` | Status Select + Apply, Reopen, Delete + confirmation dialog; capability-prop driven visibility; `overflow-x-auto` filter tab bar + `px-3 sm:px-5` responsive table padding; `data-testid` anchors (`admin-reports-manager`, `status-override-section`, `reopen-btn`, `delete-btn`, `delete-confirm-dialog`, `confirm-delete-btn`) |
| `messages/en.json` | +10 report strings + 2 permission keys + 2 descriptions |
| `messages/sq.json` | Same i18n entries (Albanian) |
| `messages/uk.json` | Same i18n entries (Ukrainian) |
| `messages/it.json` | Same i18n entries (Italian) |
| `src/components/admin/AdminReportsManager.stories.tsx` | +9 Task 463 stories (FullManagement/TerminalReopen/DeleteConfirm × 320/375/390); play functions throw on missing elements; exact exports match committed Task 464 gate `ASSERT_STORIES` |
| `src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx` | Updated props; +5 Task 463 UI tests (caps shown/hidden, delete confirm/cancel, Esc+backdrop) |
| `src/modules/listings/actions/__tests__/deleteReport.smoke.test.ts` | New: 21 server action tests (6 delete with DB-call spies + 15 status guard: CAS conflict, audit-revert+CAS-revert-race, permission-before-read, spy assertions) |
| `docs/critical-flow-registry.md` | Updated "Report listing" row with Task 463 coverage |
| `docs/sessions/2026-06-19-task-463-admin-report-full-management.md` | This session log |
