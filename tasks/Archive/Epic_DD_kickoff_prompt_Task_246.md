# Epic DD — Task 246 kickoff — Admin can clear user-profile change history (gated + audited, per-row AND per-entity)

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–14) FIRST.** Conforms to the
> current P0 contract + the Positive/Negative two-flow rule. Implements Epic DD Task 246 (source: `issues.txt` #26).
> Dependency Task 250 (R.3a `role_permissions` + `role_permission_events`) is SHIPPED and verified in code
> (`src/lib/auth/permissions.ts`, `src/modules/admin/actions/permissions.ts`).
>
> **🟢 ALL ARCHITECTURE/SCOPE DECISIONS ARE ALREADY MADE BY THE OWNER (2026-06-15) — DO NOT re-open them, DO NOT
> STOP&ASK on them. They are baked into this kickoff. If something OUTSIDE these decisions is ambiguous, stop and ask.**

```
Type:        feature (admin control + DB/server action + RLS/permission)
Priority:    medium
Area:        src/components/admin/AdminUserProfile.tsx  (the two history lists on /admin/users/[id])
             + a new clear-history server action + a new history_clear_events audit table + the audit.clear_history key
Task number: 246 (RESERVED for Epic DD — do NOT take a new number)
```

## Goal
Give admins a controlled, audited "clear history" operation on the **two change-history lists that the admin user-profile
page already displays**, with **two scopes**: a **per-row clear** (each history row has its own clear control) and a
**per-entity clear** ("Clear history" at the top of each list clears every row for that user). Both are
**permission-gated** (`audit.clear_history` — default true for admin, default false for moderator), **confirmed** (canonical
`Dialog`), and **audited** (one `history_clear_events` row per successful clear). The history LISTS render exactly as today;
this task only ADDS clear controls.

## 🔒 Owner decisions — FINAL (do not deviate)

1. **Surface scope = the TWO user-profile history lists ONLY**, both on `/admin/users/[id]` (an admin-only route),
   rendered by `src/components/admin/AdminUserProfile.tsx`:
   - **Profile change log** — `user_change_log` table, rendered under `t('sections.change_log')` (~line 1011–1032).
   - **Status history** — `user_status_history` table, rendered under `t('sections.status_history')` (~line 1034–1060).
2. **Listing-status history is EXPLICITLY OUT OF SCOPE.** Investigation (orchestrator, 2026-06-15) confirmed
   `StatusChangeControl`/`StatusChangeHistory` are **not wired to display history in any runtime admin or cabinet surface**
   — `historyEvents` is only ever passed in a `*.stories.tsx`, never in app code (`ListingFormShellView` mounts
   `StatusChangeControl` with NO `historyEvents`). Per Epic DD ("do NOT invent new history surfaces"), there is nothing to
   "clear" there. **Add a one-line session-log note that listing-status history was investigated and intentionally excluded
   because it has no runtime display.** Do NOT add a clear control to it and do NOT build a new display for it.
3. **Audit table = a NEW dedicated `history_clear_events` table.** Do NOT reuse `role_permission_events` (that remains the
   permission-audit trail ONLY). Use the `role_permission_events` *implementation* purely as the pattern/model.
4. **Audit-before-delete, hard ordering:** insert the `history_clear_events` row FIRST; only if the audit insert succeeds do
   you perform the delete. **If the audit insert fails → abort, do NOT delete, return an error.** (This is stricter than
   `setModeratorPermission`, where the audit insert is non-fatal — here it is mandatory.)
5. **No audit row for a no-op:** if there is nothing to clear (empty list / row already gone), do NOT insert an audit row and
   do NOT perform a delete.
6. **No global "clear ALL across the system"** and **no time-based/auto pruning** — out of scope (file a follow-up if wanted).
7. **Permission gate is the server action**, matching every existing admin destructive action in this codebase
   (`deactivateUser`, `hardDeleteUser` in `src/modules/admin/actions/index.ts` use `hasPermission(key)` + the service-role
   `createAdminClient()`). The server-action `hasPermission('audit.clear_history')` check is the authoritative enforcement —
   UI hiding is in addition, never instead. See "RLS / enforcement reality" below.

## Pre-read (mandatory — load ONLY these, per `docs/rule-index.md`)
1. **Always:** `docs/agent-contract.md` (clauses 1–14) · `docs/backlog.md`.
2. **DB / server action / RLS task:** `docs/data-access-rules.md` · `docs/rls-rules.md` · `docs/domain-rules.md` · `docs/qa-rules.md`.
3. **Admin control task:** `docs/design-system.md` (§14 dialogs, §26 mobile <640 bottom-sheet, §16 z-index) · `docs/ui-rules.md`
   · `docs/component-rules.md` · `docs/component-governance.md` · `docs/ai-behavior.md` → Note 20 + Note 22.
4. `tasks/Epics/Epic_DD_Admin_Audit_and_History_Hygiene.md` (Task 246 spec).
5. **Read before editing (code):**
   - `src/components/admin/AdminUserProfile.tsx` — the two history lists (the surfaces in scope).
   - `src/app/admin/users/[id]/page.tsx` — how `changeLog` (limit 20) and `statusHistory` (limit 10) are fetched and passed.
   - `src/lib/auth/permissionKeys.ts` — the `PERMISSION_KEYS` tuple (add the new key here).
   - `src/lib/auth/permissions.ts` — `hasPermission` / `roleHasPermission` / `assertPermission` (default-deny logic).
   - `src/modules/admin/actions/permissions.ts` — the `role_permission_events` insert pattern (the MODEL to mirror).
   - `src/modules/admin/actions/index.ts` (`deactivateUser`, `hardDeleteUser`) — the canonical admin-mutation shape:
     `hasPermission()` guard → `createAdminClient()` → `revalidatePath()` → `{ error? }` return.
   - `src/components/admin/AdminPermissionsManager.tsx` — confirms a new key auto-renders via `t('keys.<slug>')` /
     `t('descriptions.<slug>')` (slug = key with `.`→`_`), so the new key needs locale labels.
   - `src/components/ui/dialog.tsx` — canonical `Dialog` (already the mobile bottom-sheet primitive). The component already
     uses it for `DeleteConfirmDialog`/`DeactivateReasonDialog` — copy that pattern.
6. `package.json` validation scripts (`tsc`, `lint`, `check:i18n`, `build`).

## Required investigation (record results in the session log)
1. **Confirm the exact column/render shape of both lists** in `AdminUserProfile.tsx` so the per-row clear control attaches to
   the correct row key (`entry.id`) without restructuring the list markup.
2. **Confirm the `user_change_log` / `user_status_history` table columns** against `src/types/database.ts`
   (`UserChangeLog`, `UserStatusHistory`) so the delete filters on the right primary key (`id`) and `user_id`.
3. **RLS / enforcement reality (read `docs/rls-rules.md`, then verify):** the clear mutation MUST run through the server action
   using `createAdminClient()` (service role) exactly like `hardDeleteUser`. The service-role client bypasses RLS, so the
   AUTHORITATIVE gate is `hasPermission('audit.clear_history')` inside the action (returns `{ error: 'forbidden' }` when
   denied) — NOT UI hiding. Additionally confirm that **no existing RLS policy on `user_change_log` / `user_status_history`
   grants `DELETE` to a normal authenticated session** (default-deny must hold for any non-service-role path). If you find a
   permissive delete policy, STOP and ask — do not silently widen or narrow RLS.

## DB hand-off — EXACT idempotent SQL in the session log (single-writer; OWNER runs it, you do NOT)
Provide copy-paste idempotent SQL (the owner runs it in Supabase; you never run SQL):
1. **New table `history_clear_events`** (model on `role_permission_events`). Required columns:
   - `id` uuid PK default `gen_random_uuid()`
   - `actor_user_id` uuid NULL (FK to `users.id`, the admin who cleared)
   - `entity_type` text NOT NULL (e.g. `'user'`)
   - `entity_id` uuid NOT NULL (the user whose history was cleared)
   - `history_source` text NOT NULL (the source table, e.g. `'user_change_log'` | `'user_status_history'`)
   - `clear_scope` text NOT NULL CHECK (`clear_scope IN ('row','entity')`)
   - `cleared_row_ids` uuid[] NULL (the deleted row id(s); populated for per-row and, where feasible, per-entity)
   - `cleared_row_count` integer NOT NULL (count actually deleted)
   - `metadata` jsonb NULL (optional reviewer context)
   - `created_at` timestamptz NOT NULL default `now()`
   - Index on `(entity_type, entity_id, created_at desc)`.
   - RLS: enable RLS; **no public/authenticated policy** (writes happen only via the service-role action) — mirror how
     `role_permission_events` is locked down (confirm the exact posture from Task 250 and match it). Document the chosen
     policy posture in the SQL comment.
   - `CREATE TABLE IF NOT EXISTS` + guarded index/policy creation so re-running is safe.
2. **Seed the `audit.clear_history` permission row** for moderator default-deny, idempotently:
   `INSERT ... ON CONFLICT (role, permission_key) DO NOTHING` for `('moderator','audit.clear_history', false)`.
   (Admin needs no row — `roleHasPermission` returns true for admin unconditionally.)
3. **Read-back/verification SQL** the owner can run to confirm the table + seed exist.

After the owner applies it, ALSO update `src/types/database.ts` with a `HistoryClearEvent` interface matching the table.

## Permission key wiring
- Add `'audit.clear_history'` to `PERMISSION_KEYS` in `src/lib/auth/permissionKeys.ts`.
- This auto-surfaces a new toggle row in `AdminPermissionsManager` → add locale labels in ALL FOUR message files
  (`messages/sq.json`, `en.json`, `uk.json`, `it.json`) under `admin.permissions.keys.audit_clear_history` and
  `admin.permissions.descriptions.audit_clear_history` (same key set in all four — `check:i18n` parity must pass).

## New server action(s)
Add to `src/modules/admin/actions/index.ts` (or a focused `clearHistory.ts` re-exported from `index.ts` — match existing
module conventions). Signature shape mirrors `deactivateUser`:
- `clearHistoryRow(source: 'user_change_log' | 'user_status_history', entityId: string, rowId: string): Promise<{ error?: string }>`
- `clearHistoryForEntity(source: 'user_change_log' | 'user_status_history', entityId: string): Promise<{ error?: string }>`

Each action MUST:
1. `const allowed = await hasPermission('audit.clear_history').catch(() => false); if (!allowed) return { error: 'forbidden' }`.
2. Resolve actor via `getUser()`; `if (!me) return { error: 'Unauthorized' }`.
3. `const db = createAdminClient()`.
4. **Read the target row(s) first** (select `id` filtered by `user_id = entityId` and, for per-row, `id = rowId`) to compute
   `cleared_row_ids` + `cleared_row_count` and to detect the **no-op** (count 0 → return `{}` WITHOUT audit insert or delete).
5. **Insert the `history_clear_events` audit row FIRST.** If the insert errors → `return { error: 'audit_failed' }` and do NOT delete.
6. **Then delete** the row(s) (per-row: `.eq('id', rowId).eq('user_id', entityId)`; per-entity: `.eq('user_id', entityId)`).
   Per-entity delete MUST be scoped to `entityId` only (cross-entity safety). If delete errors → `return { error: 'delete_failed' }`.
7. `revalidatePath(\`/admin/users/${entityId}\`)`; `return {}`.

## Current behavior to preserve (Notes 19/20/22)
- The two history lists render **exactly as today** — same markup, ordering, date formatting, profile-type/status labels.
  This task ADDS clear controls; it does NOT restructure the lists.
- Every existing control on `AdminUserProfile` (edit, deactivate/reactivate, hard-delete, save/cancel, location request,
  all dialogs) stays present and working — before/after control inventory in the session log (Note 20).
- `AdminPermissionsManager` behavior unchanged except the one new auto-rendered key row.
- The data fetch in `page.tsx` keeps its `try/catch` graceful-degrade and limits (20 / 10).

## 🔴 Mobile <640 full-width gate (clause 11) — name each control
- **Confirm `Dialog`** (per-row AND per-entity) = full-width bottom sheet at <640 via the canonical `Dialog` (it already is —
  do NOT add `max-w-*` that defeats it; mirror the existing dialogs in this file). Closes on Esc + backdrop; focus returns to
  the trigger. Touch targets ≥44px; sq/en/uk/it labels wrap (`whitespace-normal break-words`), no clip, no h-scroll at 320.
- **Per-entity "Clear history" Button** (top of each list) = `max-sm:w-full`, ≥44px (`min-h-11`).
- **Per-row clear** = an **icon-only** trash `Button` → **EXEMPT from full-width** (icon-only); MUST still be ≥44px tap area
  and have an `aria-label` (i18n ×4). Justify this exemption explicitly in the session log.

## Positive flow (happy path) — admin at `uk` 375px on `/admin/users/[id]`
1. Each row in BOTH lists (change log + status history) shows a clear (trash) icon Button; each list shows a "Clear history"
   button at its top (only when the list is non-empty).
2. **Per-row:** click row clear → confirm `Dialog` with per-row copy (names the single entry) → confirm → ONLY that row is
   deleted → success toast (`admin.user_profile`/relevant namespace, i18n ×4) → `router.refresh()` re-renders the list without
   the row → one `history_clear_events` row written (`clear_scope='row'`, `cleared_row_ids=[rowId]`, `cleared_row_count=1`,
   `history_source` = the list's table, `entity_type='user'`, `entity_id`, `actor_user_id`).
3. **Per-entity:** click "Clear history" → confirm `Dialog` with per-entity copy (states "all entries for this user") →
   confirm → all rows for THIS user in that source table deleted (user B untouched) → success toast → `router.refresh()` shows
   the empty state → one `history_clear_events` row (`clear_scope='entity'`, `cleared_row_count=N`, ids where feasible).
4. Post-conditions: list reflects the deletion after refresh; the permission audit log (`role_permission_events`) is NOT touched.

## Negative flow (EVERY branch needs a verifiable diff line)
- **Moderator WITHOUT `audit.clear_history`** → clear controls hidden in UI AND the server action returns `{ error: 'forbidden' }`
  (server-side gate, not UI-only) → no delete, no audit row → toast `error_forbidden`-style message.
- **Unauthenticated / no session** → action returns `{ error: 'Unauthorized' }` → no delete.
- **Cancel/dismiss** confirm Dialog (Esc / backdrop tap / Cancel button) → nothing deleted, focus returns to trigger.
- **Empty / no-op** (nothing to clear, or row already deleted by a concurrent writer) → no audit row, no delete; per-entity
  "Clear history" button is hidden/disabled when the list is empty; show a benign message if triggered.
- **Audit insert fails** → abort: NO delete, return `{ error: 'audit_failed' }` → error toast.
- **Delete fails (server/500)** → error toast, return `{ error: 'delete_failed' }`; audit row already inserted is acceptable
  (it records an attempted clear) — note this explicitly in the session log so the reviewer expects it.
- **Double-submit / re-entry** → confirm button disabled while pending (`pending` state), prevents duplicate deletes.
- **Cross-entity safety** → per-entity delete filter is `.eq('user_id', entityId)` ONLY — verify in the diff query.
- **Locale mismatch** → all confirm copy + toasts + aria-labels resolve in the active locale (sq/en/uk/it), no raw key leak.

## Acceptance criteria (each maps to a flow by name)
- AC1 — Per-row clear icon Button on every row of BOTH user-profile history lists (canonical icon Button + confirm Dialog,
  i18n ×4). → Positive flow step 2.
- AC2 — Per-entity "Clear history" Button atop each non-empty list (canonical Button + confirm Dialog whose copy distinguishes
  per-entity from per-row). → Positive flow step 3.
- AC3 — Both actions gated by `hasPermission('audit.clear_history')` server-side (moderator default-deny via seeded
  `role_permissions` row); UI also hides controls. → Negative flow: moderator-without-permission.
- AC4 — Audit-before-delete ordering; no delete if audit insert fails; no audit row on no-op. → Negative flow: audit-fails + empty/no-op.
- AC5 — `history_clear_events` row written on every successful clear with actor/when/entity_type/entity_id/history_source/
  clear_scope/cleared_row_ids/cleared_row_count. → Positive flow steps 2–3.
- AC6 — Cross-entity isolation: per-entity clear filters on `user_id = entityId` only. → Negative flow: cross-entity safety.
- AC7 — `audit.clear_history` added to `PERMISSION_KEYS` + locale labels (`keys`/`descriptions`) in all four message files;
  `check:i18n` parity passes; the key renders in `AdminPermissionsManager`.
- AC8 — EXACT idempotent SQL (table + seed + verification) in the session log; `HistoryClearEvent` added to `database.ts`.
  Owner runs the SQL (single-writer); executor runs NO SQL and NO git.
- AC9 — Mobile <640 full-width gate met (Dialog bottom-sheet; per-entity Button `max-sm:w-full`; per-row icon-only exemption
  justified; ≥44px; labels wrap; no h-scroll at 320).
- AC10 — Listing-status history investigated and intentionally excluded — one-line session-log note (no code for it).
- AC11 — `tsc --noEmit`=0, `lint`=0 new, `check:i18n` PASS, `npm run build` passes; clause-14 file-integrity transcript pasted.
- AC12 — **Rendered verification matrix (clause 12)**: 320/375/390/768/1280/1440/2560 × sq/en/uk/it, with uk@320/375/390
  stress cells, covering both lists + both confirm dialogs (open state). Real per-cell evidence; tsc/build alone is NOT proof.
- AC13 — Before/after control inventory (Note 20/22); UX-flow trace (Note 19); AC-by-AC self-audit table; "Files Changed" table.
  Executor does NOT emit `git add`/`git commit` — orchestrator emits commits at review.

## Out of scope (do NOT do)
- Any clear control for listing-status history (no runtime display — excluded by owner decision 2).
- A global "clear ALL history across the system" sweep; time-based / automatic pruning.
- Reusing `role_permission_events` for history-cleared events (owner decision 3 — dedicated table only).
- Restructuring/redesigning the history lists themselves; adding new history display surfaces.
- Any change to `role_permissions` UI beyond adding the `audit.clear_history` key.
- Running SQL or git (single-writer; owner runs SQL and the orchestrator-emitted commits).
