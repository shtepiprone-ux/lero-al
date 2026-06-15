# Task 432 — Distinct "nothing to clear" feedback for the no-op clear-history race (Epic DD follow-up)

**Executor:** Sonnet 4.6. **Type:** server-action return-shape + client toast branch + i18n (4 locales). No new UI
control, no new dialog, no layout/responsive change.

## Summary

Closes the Task 246 follow-up: the `clear_user_history()` no-op (nothing to clear — race/double-submit) previously
showed the same green "History cleared." success toast as a real clear. The action now surfaces
`cleared_row_count` via a new `cleared?: number` field on its return value; both clear handlers in
`AdminUserProfile.tsx` branch on `result.cleared === 0` to show a neutral `toast.info(feedback.clear_history_noop)`
instead, then close the dialog and `router.refresh()`. Every other branch (success, forbidden, unauthorized,
RPC error, cancel, double-submit-in-flight) is unchanged.

## §0 — `toast.info(` pre-edit investigation (mandatory)

```
grep -rn "toast\.info(" src/
src/components/admin/AdminPermissionsManager.tsx:33:        toast.info(t(value ? 'already_granted' : 'not_granted'))
src/modules/listings/components/ListingReportDialog.tsx:56:        toast.info(t('report_already_reported'))
src/modules/listings/components/SaveSearchButton.tsx:53:        toast.info(t('already_saved'))
```

`toast.info(` is an established project convention (sonner), already used for "no real change occurred but it's
not an error" feedback (`already_granted`, `report_already_reported`, `already_saved`) — semantically identical to
this task's "nothing to clear" case. `npx tsc --noEmit` and `npm run lint` (run after the edits, see AC5) both pass
with `toast.info(t('feedback.clear_history_noop'))`, confirming the call is valid and lint-clean. No STOP-and-ASK
needed.

## Changes made

1. **`src/modules/admin/actions/clearHistory.ts`**:
   - Widened the return type of `clearHistory`, `clearHistoryRow`, `clearHistoryForEntity` from
     `Promise<{ error?: string }>` to `Promise<{ error?: string; cleared?: number }>`.
   - Replaced the no-op/success tail:
     ```ts
     const result = data as { cleared_row_count: number } | null
     const cleared = result?.cleared_row_count ?? 0
     if (cleared === 0) return { cleared: 0 }   // no-op: no audit row, no delete, no revalidate

     revalidatePath(`/admin/users/${entityId}`)
     return { cleared }
     ```
   - Error path (permission/auth/RPC-error) unchanged.

2. **`src/components/admin/AdminUserProfile.tsx`**:
   - `handleClearHistoryRow`: after the existing `if (result.error) { … return }` block, added:
     ```ts
     if (result.cleared === 0) {
       toast.info(t('feedback.clear_history_noop'))
       setClearRowTarget(null)
       router.refresh()
       return
     }
     ```
   - `handleClearHistoryForEntity`: same shape, closing `setClearEntitySource(null)` instead.
   - Both `toast.success(t('feedback.clear_history_success'))` lines and their close/refresh calls are
     unchanged and now only reached when `cleared > 0`.

3. **`messages/{en,sq,uk,it}.json`**: added `feedback.clear_history_noop` immediately after
   `feedback.clear_history_forbidden` (added trailing comma to that line in each file):
   - en: `"Nothing to clear — the history was already empty."`
   - sq: `"Asgjë për të pastruar — historiku ishte tashmë bosh."`
   - uk: `"Немає чого очищати — історія вже порожня."`
   - it: `"Niente da cancellare — la cronologia era già vuota."`

## AC5 — gate transcript

```
$ npx tsc --noEmit
(no output — 0 errors)

$ npm run lint
> lero-al@0.1.0 lint
> eslint
(no output — 0 errors/warnings)

$ npx vitest run
 Test Files  19 passed (19)
      Tests  597 passed (597)
```

Consumer check — `clearHistoryRow`/`clearHistoryForEntity` are imported only by `AdminUserProfile.tsx`:
```
$ grep -rn "clearHistoryRow\|clearHistoryForEntity" src/ --include="*.ts*"
src/components/admin/AdminUserProfile.tsx:36:import { clearHistoryRow, clearHistoryForEntity } from '@/modules/admin/actions/clearHistory'
src/components/admin/AdminUserProfile.tsx:636:    const result = await clearHistoryRow(clearRowTarget.source, user.id, clearRowTarget.rowId)
src/components/admin/AdminUserProfile.tsx:656:    const result = await clearHistoryForEntity(clearEntitySource, user.id)
src/modules/admin/actions/clearHistory.ts:48:export async function clearHistoryRow(
src/modules/admin/actions/clearHistory.ts:56:export async function clearHistoryForEntity(
```
No other consumer — the widened return type has no downstream impact beyond the two handlers edited.

## AC3 — i18n parity gate

```
$ npm run check:i18n
── Part 1: Locale key-set parity ──────────────────────────────
  ✅ en  — 1817 keys (matches sq)
  ✅ uk  — 1817 keys (matches sq)
  ✅ it  — 1817 keys (matches sq)
✅ Parity PASSED — all 4 locale files have identical key sets (1817 keys).
```
(The 2 raw-enum-scan warnings in `AdminInquiriesManager.tsx`/`AdminSupportManager.tsx` are pre-existing,
unrelated to this task — not touched.)

## AC6 — file-integrity GREEN transcript

```
=== src/modules/admin/actions/clearHistory.ts ===   NUL: 0   BOM: none ("'us..." — code, not BOM)
=== src/components/admin/AdminUserProfile.tsx ===   NUL: 0   BOM: none ("'us..." — code, not BOM)
=== messages/en.json ===                            NUL: 0   BOM: none ("{\n " — JSON, not BOM)
=== messages/sq.json ===                            NUL: 0   BOM: none ("{\n " — JSON, not BOM)
=== messages/uk.json ===                            NUL: 0   BOM: none ("{\n " — JSON, not BOM)
=== messages/it.json ===                            NUL: 0   BOM: none ("{\n " — JSON, not BOM)

JSON.parse: messages/en.json OK, messages/sq.json OK, messages/uk.json OK, messages/it.json OK

Tails intact:
  clearHistory.ts      → ends "...return clearHistory(source, entityId, null)\n}\n"
  AdminUserProfile.tsx → ends "...        />\n      )}\n    </div>\n  )\n}\n" (unchanged file end)
```
`npx tsc --noEmit` (0 errors) covers `.ts`/`.tsx` compile-integrity for the two code files.

## AC4 — existing-control preservation (Note 20)

Before/after control inventory — unchanged, byte-for-byte:
- Per-row trash buttons (history list rows) — unchanged.
- Per-entity "Clear history" buttons — unchanged.
- `ClearHistoryDialog` markup (lines ~334–390) — **not touched**.
- `setClearRowTarget` / `setClearEntitySource` state plumbing — unchanged shape, only new call sites added
  in the new no-op branches (same setters already used on the success path).
- `clearingHistory` loading-state guard — unchanged.

Only the two handler bodies gained a new `if (result.cleared === 0) { … }` branch placed between the existing
error branch and the existing success branch. No JSX/markup edited.

## AC7 — runtime two-tab no-op reproduction — **BLOCKED, not performed**

This session has **no browser/automation tool available** (no Playwright/browser MCP tool was offered in this
environment — confirmed via tool search). AC7 requires a real two-tab race reproduction against a running dev
server plus 4-locale × 3-width (320/375/390) visual evidence of the `clear_history_noop` toast.

Per the kickoff's explicit instruction: *"If no suitable test data exists to reproduce a real no-op, document the
blocker in the session log and STOP — do not fake the runtime proof."* Faking this evidence is exactly what the
kickoff forbids, so **AC7 is left undone and flagged here** rather than fabricated.

**What IS verified (gives high confidence the toast will fire correctly when reproduced):**
- `tsc`/`lint`/`vitest` all green with the new branch and return shape.
- The new branch is structurally identical to the existing, working `toast.success` branch (same
  close-dialog + `router.refresh()` shape), just gated on `cleared === 0` and using `toast.info` (an established,
  lint-clean pattern per §0).
- The locale strings parse, have parity, and were translated consistent with the kickoff's suggested wording.

**Recommended path forward (for owner/orchestrator):**
- Either the owner performs the AC7 two-tab manual test natively (dev server + 2 browser tabs/profiles) and
  records the 12-cell (4 locale × 3 width) evidence, or
- A follow-up task adds browser-automation tooling (e.g. Playwright) to this environment, after which AC7 can be
  completed without re-touching the code/locale changes already made here.

**STOPPING HERE per the kickoff's AC7 instruction — all other ACs (AC1–AC6, AC8) are complete; this task is NOT
closed until AC7 is resolved one of the two ways above.**

## N/A justifications

- Full 14-breakpoint × 4-locale rendered matrix: N/A — no layout/container/control changed (AC4 confirms).
- Mobile <640 full-width gate: N/A — no new/edited control or container.
- Storybook / `check:stories`: N/A — no story touched.
- RLS / SQL: N/A — data-layer no-op contract (Task 246) unchanged.

## AC self-audit

| AC | Status | Evidence |
|---|---|---|
| AC1 | ✅ | `clearHistory.ts` diff: widened return types, `{ cleared: 0 }` no-op (no revalidate), `{ cleared }` real clear after revalidate. |
| AC2 | ✅ | `AdminUserProfile.tsx` diff: both handlers gain `result.cleared === 0` branch → `toast.info` + correct dialog-close setter + `router.refresh()` + early return, BEFORE `toast.success`. |
| AC3 | ✅ | 4 locale files +`feedback.clear_history_noop`; `check:i18n` parity 1817/1817/1817/1817. |
| AC4 | ✅ | Control inventory above — dialog/buttons/markup byte-for-byte unchanged. |
| AC5 | ✅ | tsc=0, lint=0, vitest 597/597, single-consumer grep, §0 toast.info investigation recorded. |
| AC6 | ✅ | File-integrity transcript above — 0 NUL / no BOM / JSON parses / intact tails, all 6 files. |
| AC7 | ❌ BLOCKED | No browser tooling available — documented above; STOP per kickoff instruction, not faked. |
| AC8 | ✅ | This session log + `docs/backlog.md` update (below); `docs/backlog-archive.md` NOT touched (orchestrator's job). |

## Files Changed

| File | Change |
|---|---|
| `src/modules/admin/actions/clearHistory.ts` | Return type widened to `{ error?; cleared? }`; no-op returns `{ cleared: 0 }`, real clear `{ cleared: n }`. |
| `src/components/admin/AdminUserProfile.tsx` | No-op `result.cleared === 0` branch in both clear handlers → `toast.info(clear_history_noop)` + close dialog + refresh. |
| `messages/en.json` | +`feedback.clear_history_noop`. |
| `messages/sq.json` | +`feedback.clear_history_noop`. |
| `messages/uk.json` | +`feedback.clear_history_noop`. |
| `messages/it.json` | +`feedback.clear_history_noop`. |
| `docs/sessions/2026-06-15-task432-clear-history-noop-toast.md` | New session log (this file). |
| `docs/backlog.md` | Task 432 row + Last Session (flags AC7 blocker). |
