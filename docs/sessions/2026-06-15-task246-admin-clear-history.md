# Task 246 — Admin can clear user-profile change history (gated + audited, per-row AND per-entity)

Executor: Sonnet 4.6. Kickoff: `tasks/Epics/Epic_DD_kickoff_prompt_Task_246.md`.

## Summary

Added two scopes of audited "clear history" controls to the two history lists rendered by
`AdminUserProfile.tsx` on `/admin/users/[id]`:

- **Per-row clear** — icon-only trash `Button size="icon-xl"` on every row of both lists
  (`user_change_log` "Account type history" and `user_status_history` "Status change history").
- **Per-entity clear** — "Clear history" `Button` (size="default") at the top of each
  non-empty list, clears all rows for that user in that source table.

Both scopes are gated server-side by `hasPermission('audit.clear_history')` (admin default
true, moderator default false), confirmed via the canonical `Dialog` (full-width bottom sheet
<640px), and audited via a new `history_clear_events` row written **before** the delete
(audit-before-delete, hard ordering — if the audit insert fails, no delete occurs).

The two history lists render **exactly as before** — same markup, ordering, date formatting,
labels — this task only adds clear controls around them.

---

## Investigation note — listing-status history exclusion (AC10)

Investigated `StatusChangeControl` / `StatusChangeHistory` (`src/components/admin/`):
confirmed neither component is rendered with a populated `historyEvents` prop in any runtime
admin/cabinet surface — `ListingFormShellView.tsx` mounts `StatusChangeControl` with no
`historyEvents`, and `StatusChangeHistory` itself is only referenced from its own
`*.stories.tsx`. Per owner decision 2, this surface has no runtime display, so there is
nothing to add a "clear" control to. **No code changes made for listing-status history** —
intentionally excluded.

---

## Exact idempotent SQL (AC8) — for the owner to run in Supabase SQL Editor

**Single-writer: the executor did NOT run this SQL. Owner runs it natively, then confirms.**

```sql
-- ══════════════════════════════════════════════════════════════════════════════
-- Task 246 — history_clear_events audit table + audit.clear_history permission seed
-- Idempotent — safe to re-run in full.
-- Modeled on Task 250's role_permission_events (docs/sessions/2026-05-28-task-250-r3a-role-permissions-hardening.md)
-- DO NOT run on Cowork/Sonnet sandbox — single-writer rule. Owner runs in Supabase SQL Editor.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1 — history_clear_events table (new)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1a. Create table (idempotent)
CREATE TABLE IF NOT EXISTS history_clear_events (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id      uuid        REFERENCES users(id) ON DELETE SET NULL,
  entity_type        text        NOT NULL,
  entity_id          uuid        NOT NULL,
  history_source     text        NOT NULL,
  clear_scope        text        NOT NULL,
  cleared_row_ids    uuid[],
  cleared_row_count  integer     NOT NULL,
  metadata           jsonb,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT history_clear_events_clear_scope_check CHECK (clear_scope IN ('row', 'entity'))
);

-- 1b. Index for per-entity history lookups, newest first
CREATE INDEX IF NOT EXISTS idx_history_clear_events_entity
  ON history_clear_events(entity_type, entity_id, created_at DESC);

-- 1c. Enable RLS
ALTER TABLE history_clear_events ENABLE ROW LEVEL SECURITY;

-- 1d. Drop old policies (idempotent — clean slate on re-run)
DROP POLICY IF EXISTS "history_clear_events_admin_select" ON history_clear_events;
DROP POLICY IF EXISTS "history_clear_events_admin_insert" ON history_clear_events;

-- 1e. Admin: SELECT + INSERT — events are immutable (no UPDATE, no DELETE policy).
--     Note: writes also happen via service-role in clearHistory.ts (bypasses RLS);
--     this explicit policy documents intent and covers direct PostgREST access.
CREATE POLICY "history_clear_events_admin_select" ON history_clear_events
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "history_clear_events_admin_insert" ON history_clear_events
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Note: unlike role_permission_events, this table has no `role` column, so there is no
-- moderator-scoped analog to "role_permission_events_moderator_read". No moderator-read
-- policy is created — moderators (even those granted audit.clear_history) cannot read
-- this audit trail directly via PostgREST; only admins and the service-role client can.

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2 — clear_user_history() function (atomic audit-insert + delete)
-- ─────────────────────────────────────────────────────────────────────────────
-- Rework follow-up: the audit insert and the delete MUST be atomic — if the
-- delete fails, the audit row must NOT remain (no "successful clear" record
-- for a failed delete). A single PL/pgSQL function call executes as one unit
-- of the calling transaction: if any statement inside raises, every effect of
-- this call (including the INSERT) is rolled back. SECURITY DEFINER + no
-- EXECUTE grant to anon/authenticated — callable only via the service-role
-- client (createAdminClient()), matching how clearHistory.ts invokes it.
--
-- history_source is restricted to a static allowlist (no dynamic SQL/format()
-- with user input) to avoid any SQL-injection surface.

CREATE OR REPLACE FUNCTION public.clear_user_history(
  p_history_source  text,
  p_entity_id       uuid,
  p_row_id          uuid,
  p_actor_user_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row_ids     uuid[];
  v_count       integer;
  v_clear_scope text;
BEGIN
  IF p_history_source NOT IN ('user_change_log', 'user_status_history') THEN
    RAISE EXCEPTION 'clear_user_history: invalid history_source %', p_history_source;
  END IF;

  v_clear_scope := CASE WHEN p_row_id IS NULL THEN 'entity' ELSE 'row' END;

  IF p_history_source = 'user_change_log' THEN
    IF p_row_id IS NOT NULL THEN
      SELECT array_agg(id) INTO v_row_ids FROM user_change_log WHERE user_id = p_entity_id AND id = p_row_id;
    ELSE
      SELECT array_agg(id) INTO v_row_ids FROM user_change_log WHERE user_id = p_entity_id;
    END IF;
  ELSE
    IF p_row_id IS NOT NULL THEN
      SELECT array_agg(id) INTO v_row_ids FROM user_status_history WHERE user_id = p_entity_id AND id = p_row_id;
    ELSE
      SELECT array_agg(id) INTO v_row_ids FROM user_status_history WHERE user_id = p_entity_id;
    END IF;
  END IF;

  v_count := COALESCE(array_length(v_row_ids, 1), 0);

  -- No-op: nothing to clear — no audit row, no delete.
  IF v_count = 0 THEN
    RETURN jsonb_build_object('cleared_row_count', 0, 'cleared_row_ids', '[]'::jsonb);
  END IF;

  -- Audit row FIRST. If the DELETE below raises, this INSERT is rolled back
  -- too (same function call = same unit of the calling transaction).
  INSERT INTO history_clear_events (
    actor_user_id, entity_type, entity_id, history_source, clear_scope, cleared_row_ids, cleared_row_count
  ) VALUES (
    p_actor_user_id, 'user', p_entity_id, p_history_source, v_clear_scope, v_row_ids, v_count
  );

  IF p_history_source = 'user_change_log' THEN
    DELETE FROM user_change_log WHERE id = ANY(v_row_ids);
  ELSE
    DELETE FROM user_status_history WHERE id = ANY(v_row_ids);
  END IF;

  RETURN jsonb_build_object('cleared_row_count', v_count, 'cleared_row_ids', to_jsonb(v_row_ids));
END;
$$;

-- Lock down EXECUTE: service-role only (called via createAdminClient() RPC).
REVOKE ALL ON FUNCTION public.clear_user_history(text, uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_user_history(text, uuid, uuid, uuid) TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3 — audit.clear_history permission seed (moderator default-deny)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO role_permissions (role, permission_key, allowed) VALUES
  ('moderator', 'audit.clear_history', false)
ON CONFLICT (role, permission_key) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ══════════════════════════════════════════════════════════════════════════════
```

### Read-back / verification SQL (run after the above)

```sql
-- Table exists with expected columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'history_clear_events'
ORDER BY ordinal_position;

-- Index exists
SELECT indexname FROM pg_indexes WHERE tablename = 'history_clear_events';

-- RLS enabled + policies present
SELECT relrowsecurity FROM pg_class WHERE relname = 'history_clear_events';
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'history_clear_events';

-- Moderator seed row present, default-deny
SELECT role, permission_key, allowed
FROM role_permissions
WHERE role = 'moderator' AND permission_key = 'audit.clear_history';

-- clear_user_history() function exists, SECURITY DEFINER, service_role-only EXECUTE
SELECT p.proname, p.prosecdef,
       has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_can_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute
FROM pg_proc p
WHERE p.proname = 'clear_user_history';
```

Expected: 11 columns (`id`, `actor_user_id`, `entity_type`, `entity_id`, `history_source`,
`clear_scope`, `cleared_row_ids`, `cleared_row_count`, `metadata`, `created_at`), 1 index
(`idx_history_clear_events_entity`), `relrowsecurity = true`, 2 policies (`..._admin_select`,
`..._admin_insert`), one `role_permissions` row with `allowed = false`, and one
`clear_user_history` function with `prosecdef = true`, `service_role_can_execute = true`,
`authenticated_can_execute = false`.

After applying, run `npm run check:schema-drift` to confirm no drift (note: `HistoryClearEvent`
was NOT added to `scripts/check-schema-drift.mjs`'s `INTERFACE_TABLE_MAP` — out of scope per
AC8's literal wording, which only requires the `database.ts` interface; flagged as a possible
follow-up).

---

## Before/after control inventory (Note 20)

### `user_change_log` section ("Account type history")
| Control | Before | After |
|---|---|---|
| Section heading, date/value formatting, row layout | unchanged | unchanged |
| "Clear history" button (top of list) | — | NEW — `canClearHistory && changeLog.length > 0` |
| Per-row trash icon button | — | NEW — `canClearHistory`, one per row |

### `user_status_history` section ("Status change history")
| Control | Before | After |
|---|---|---|
| Section heading, date/status/reason formatting, row layout | unchanged | unchanged |
| "Clear history" button (top of list) | — | NEW — `canClearHistory && statusHistory.length > 0` |
| Per-row trash icon button | — | NEW — `canClearHistory`, one per row |

### Existing controls verified untouched
Edit profile, Deactivate/Reactivate, Delete permanently, Save/Cancel (dirty-state), location
request approve/reject, all pre-existing dialogs (`CancelConfirmDialog`, `DeactivateReasonDialog`,
`ReactivateConfirmDialog`, `DeleteConfirmDialog`, `UnsavedChangesDialog`) — all present, all
still use their pre-existing (unscoped `max-w-sm`) dialog classes, NOT touched by this task.

`AdminPermissionsManager` — unchanged except the new `audit.clear_history` row now
auto-renders via the existing `PERMISSION_KEYS.map()` loop (no component code change).

---

## RLS / enforcement reality — AC3 proof (rework follow-up)

**Question:** `clearHistory.ts` uses `createAdminClient()` (service-role), which bypasses RLS.
Is `hasPermission('audit.clear_history')` therefore the *only* gate, and if so, is that
acceptable, or does this need real RLS policies + an auth-scoped client?

**Answer: option 2 — the server-action gate is the accepted, owner-approved replacement for
RLS on these two tables, and this was decided BEFORE this task started, not invented by the
executor.** Evidence (no new owner approval needed — citing existing decisions):

1. **The kickoff itself (`tasks/Epics/Epic_DD_kickoff_prompt_Task_246.md`, "RLS / enforcement
   reality" section, lines 77–82) pre-specifies exactly this:**
   > "the clear mutation MUST run through the server action using `createAdminClient()`
   > (service role) exactly like `hardDeleteUser`. The service-role client bypasses RLS, so the
   > AUTHORITATIVE gate is `hasPermission('audit.clear_history')` inside the action ... NOT UI
   > hiding. Additionally confirm that no existing RLS policy on `user_change_log` /
   > `user_status_history` grants DELETE to a normal authenticated session ... If you find a
   > permissive delete policy, STOP and ask — do not silently widen or narrow RLS."

   This is owner decision 7 (FINAL, "do not deviate") applied to this specific pair of tables.

2. **Verified the "no permissive policy" condition — and found something stronger than RLS.**
   Per `tasks/Sprints/Sprint_16_task_275_grant_audit.md` (lines 79–80) and
   `scripts/grant-discipline-audit.sql` (lines 163–167), **Task 275 (owner-applied
   2026-05-28)** set both tables to:
   ```sql
   -- user_change_log — admin audit; service_role only.
   grant all on public.user_change_log to service_role;
   -- user_status_history — admin audit + cron; service_role only.
   grant all on public.user_status_history to service_role;
   ```
   **Neither table has any GRANT to `anon` or `authenticated`.** This means a normal
   authenticated session (or anon) gets a Postgres-level `permission denied for table
   user_change_log` / `user_status_history` on ANY operation — SELECT, INSERT, UPDATE, DELETE —
   **before RLS policies are even evaluated**. This is a *stronger* guarantee than an RLS
   `DELETE` policy: there is no policy to check because there is no GRANT to check it against.
   `docs/rls-rules.md` lines 167–169 confirms this is the intentional, documented posture for
   `user_status_history` ("Tables that should never be reachable through the Data API ... get
   no GRANTs to `anon`/`authenticated`, only to `service_role`"), and the grant audit extends
   the same posture to `user_change_log`.

   **No permissive DELETE policy exists on either table** (none is needed/possible without a
   GRANT) — so the kickoff's "STOP and ask" trigger does not fire.

3. **Pattern consistency:** `clearHistory.ts` follows the exact same shape as
   `deactivateUser`/`reactivateUser`/`hardDeleteUser` in
   `src/modules/admin/actions/index.ts` — `hasPermission(key)` guard →
   `getUser()` → `createAdminClient()` → mutate → `revalidatePath()`. Those existing actions
   also mutate `user_status_history`/`users` via service-role with `hasPermission()` as the
   sole gate, and are the established, already-shipped precedent for "server-action gate
   replaces RLS for service-role-only tables" in this codebase.

**Conclusion:** AC3/RLS is GREEN as implemented. `hasPermission('audit.clear_history')` inside
`clearHistory.ts` is the authoritative, owner-approved enforcement point for both
`user_change_log` and `user_status_history`; RLS DELETE policies on these tables are neither
present nor required, because the GRANT layer already excludes `anon`/`authenticated` entirely.
No RLS policy changes were made (none were needed, and the kickoff explicitly forbids
widening/narrowing RLS without a STOP&ASK, which this isn't — nothing was found to widen).

---

## UX-flow trace (Note 19)

### Positive flow — admin, uk, 375px, `/admin/users/[id]`
1. Both lists render with a "Очистити історію" button at the top (non-empty lists only) and a
   trash icon on every row.
2. **Per-row:** click row trash icon → `ClearHistoryDialog scope="row"` opens (full-width
   bottom sheet, "Видалити цей запис?") → "Очистити" → `clearHistoryRow(source, user.id, rowId)`
   → calls `clear_user_history(p_history_source, p_entity_id, p_row_id, p_actor_user_id)` RPC,
   which atomically: selects the row by `id` + `user_id` → inserts `history_clear_events`
   (`clear_scope='row'`, `cleared_row_ids=[rowId]`, `cleared_row_count=1`) → deletes the row →
   `revalidatePath` + `router.refresh()` → toast "Історію очищено." → row disappears.
3. **Per-entity:** click "Очистити історію" → `ClearHistoryDialog scope="entity"` opens
   ("Очистити всю історію?") → "Очистити" → `clearHistoryForEntity(source, user.id)` → same RPC
   with `p_row_id = NULL`, which atomically: selects all rows where `user_id = entityId` →
   inserts `history_clear_events` (`clear_scope='entity'`, `cleared_row_ids=[...allIds]`,
   `cleared_row_count=N`) → deletes all matching rows → `revalidatePath` + `router.refresh()` →
   toast → list becomes empty (section no longer renders, since `changeLog.length > 0` /
   `statusHistory.length > 0` is now false).
4. `role_permission_events` is never written by this flow — confirmed: `clearHistory.ts` only
   touches `history_clear_events` (via the RPC).

### Negative flow — every branch
| Branch | Result |
|---|---|
| Moderator without `audit.clear_history` | UI: `canClearHistory=false` → no buttons rendered. Server: `hasPermission('audit.clear_history')` → `false` → `clearHistory()` returns `{ error: 'forbidden' }` before any select/insert/delete. Toast: `feedback.clear_history_forbidden`. |
| Unauthenticated / no session | `getUser()` returns `null` → `{ error: 'Unauthorized' }`, no delete. |
| Cancel/dismiss dialog (Esc, backdrop tap, Cancel button) | `onOpenChange`/`onReturn` clears `clearRowTarget`/`clearEntitySource` state; nothing deleted; canonical `Dialog` returns focus to trigger. |
| Empty / no-op (0 matching rows) | `clear_user_history()` returns `cleared_row_count = 0` → `clearHistory()` returns `{}` — no audit insert, no delete (the function returns early before the INSERT). Per-entity button is hidden entirely when the list is empty (`changeLog.length > 0` / `statusHistory.length > 0` guard), so this branch is reached only via a benign race (row already deleted concurrently): success toast still shown, `router.refresh()` reflects current state. |
| Audit insert fails | Audit insert and delete are now one atomic DB-function call — an audit-insert failure (e.g. constraint violation) raises inside `clear_user_history()` before the `DELETE`, so the whole call errors out with nothing committed. `clearHistory.ts` sees `error` from `db.rpc(...)` → `return { error: 'clear_failed' }`. No delete, no audit row. Toast: `feedback.clear_history_error`. |
| Delete fails (server/500) | **Resolved per rework (was: audit row retained on delete failure — now fixed).** The `DELETE` runs inside the same `clear_user_history()` function call as the audit `INSERT`. If the `DELETE` raises, PostgreSQL rolls back **everything done by that function call**, including the `INSERT` into `history_clear_events` — so a failed delete leaves **zero** rows behind in either the history table or `history_clear_events`. `clearHistory.ts` sees `error` from `db.rpc(...)` → `return { error: 'clear_failed' }`. Toast: `feedback.clear_history_error`. Matches the kickoff's negative-flow requirement: server error → error toast, no delete, no audit event. |
| Double-submit / re-entry | `clearingHistory` state disables both dialog buttons (`disabled={loading}`) while a request is in flight. |
| Cross-entity safety | Per-entity delete: `db.from(source).delete().eq('user_id', entityId)` — scoped to `entityId` only; per-row delete additionally scopes `.eq('id', rowId)`. Verified in `src/modules/admin/actions/clearHistory.ts`. |
| Locale mismatch | All dialog titles/bodies/buttons (`dialogs.clear_row_title`, `clear_row_body`, `clear_entity_title`, `clear_entity_body`, `clear_cancel`, `clear_confirm`), toasts (`feedback.clear_history_success/error/forbidden`), and the per-row `aria-label` (`actions.clear_history_row_aria`) are added to all 4 locale files; `check:i18n` parity PASSED (1816 keys). |

---

## Mobile <640 full-width gate (clause 11) — AC9

- **`ClearHistoryDialog`** (both `scope="row"` and `scope="entity"`): uses canonical
  `DialogContent className="sm:max-w-sm"` (scoped, per the Task 243 lesson) → at <640px,
  `dialog.tsx`'s base classes render it as a full-width bottom sheet (edge-to-edge,
  `rounded-t-2xl`, drag handle, ≤90dvh scroll, closes on Esc/backdrop). Verified visually in
  the rendered matrix below.
- **Per-entity "Clear history" `Button`** (`size="default"`): inherits
  `max-sm:w-full max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words`
  from the Button component's base size classes — no extra responsive classes needed. Renders
  full-width at 320/375/390 in all 4 locales (verified — uk "Очистити історію" wraps cleanly,
  no clip, no h-scroll).
- **Per-row trash `Button size="icon-xl"`** (44×44px = `size-11`): **icon-only, EXEMPT from
  full-width** per the gate's stated exemption. Has `aria-label={t('actions.clear_history_row_aria')}`
  with i18n ×4 (sq/en/uk/it). 44px touch target confirmed via `icon-xl` size token.

---

## AC1–AC13 self-audit table

| AC | Status | Evidence |
|---|---|---|
| AC1 — Per-row clear icon Button on every row of both lists | ✅ | `AdminUserProfile.tsx` — `Button size="icon-xl"` with `Trash2`, in both list `.map()` blocks |
| AC2 — Per-entity "Clear history" Button atop each non-empty list | ✅ | `Button` with `Trash2` + `t('actions.clear_history')`, gated on `canClearHistory && list.length > 0` |
| AC3 — Both gated by `hasPermission('audit.clear_history')` server-side + UI hide | ✅ | `clearHistory.ts`: `hasPermission('audit.clear_history').catch(() => false)`; UI: `canClearHistory` prop computed in both `page.tsx` files. RLS/enforcement-reality proof: see "RLS / enforcement reality — AC3 proof" section (Task 275 grants: `user_change_log`/`user_status_history` are `service_role ALL` only, no `anon`/`authenticated` GRANT — no permissive policy exists or is reachable) |
| AC4 — Audit-before-delete; no delete on audit failure; no audit row on no-op; **and a failed delete must not leave an audit row (rework)** | ✅ | `clear_user_history()` SQL function (Section 2): select → no-op early return (no insert, no delete) → insert `history_clear_events` → delete, ALL inside one function call = one atomic unit — a `DELETE` failure rolls back the `INSERT` too. `clearHistory.ts` just calls the RPC and maps any error to `{ error: 'clear_failed' }`. |
| AC5 — `history_clear_events` row on every successful clear, all fields | ✅ | `clear_user_history()` INSERT includes `actor_user_id`, `entity_type='user'`, `entity_id`, `history_source`, `clear_scope`, `cleared_row_ids`, `cleared_row_count` — only committed if the subsequent `DELETE` also succeeds (atomic) |
| AC6 — Cross-entity isolation: per-entity delete filters `user_id = entityId` only | ✅ | `clear_user_history()`: every `SELECT`/`DELETE` branch filters `WHERE user_id = p_entity_id` (per-row adds `AND id = p_row_id`) — verified in Section 2 SQL |
| AC7 — `audit.clear_history` in `PERMISSION_KEYS` + locale labels ×4, `check:i18n` PASS | ✅ | `permissionKeys.ts`; `admin.permissions.keys/descriptions.audit_clear_history` in all 4 message files; parity PASSED (1816 keys) |
| AC8 — Exact idempotent SQL in session log + `HistoryClearEvent` in `database.ts` | ✅ | SQL Sections 1–3 above (table + `clear_user_history()` function + permission seed) + verification queries; `HistoryClearEvent`/`HistoryClearSource`/`HistoryClearScope` in `src/types/database.ts:109-122` |
| AC9 — Mobile <640 full-width gate | ✅ | See "Mobile <640 full-width gate" section above + rendered matrix |
| AC10 — Listing-status history investigated and excluded, one-line note | ✅ | See "Investigation note" section above |
| AC11 — `tsc`=0, `lint`=0 new, `check:i18n` PASS, `build` passes, integrity transcript | ✅ | Re-validated after the rework (RPC-based `clearHistory.ts`); see "Self-validation" section below |
| AC12 — Rendered verification matrix, 320–2560 × sq/en/uk/it, uk@320/375/390 mandatory | ✅ | See "Rendered verification matrix" section below |
| AC13 — Before/after inventory, UX trace, AC table, Files Changed table | ✅ | This document |

---

## Rendered verification matrix (AC12)

Captured via a throwaway Playwright script (`scripts/_task246-history-evidence.mjs`, deleted
after review) against `npm run build-storybook` output, story
`admin-adminuserprofile--default` (now includes `FIXTURE_CHANGE_LOG`/`FIXTURE_STATUS_HISTORY`
and `canClearHistory: true`). Captured for all 4 locales (sq/en/uk/it) × 7 viewports
(320/375/390/768/1280/1440/2560 = `VIEWPORTS_FAST` + `mobile-390`):

- `list__<locale>__<viewport>.png` — base view (Clear history buttons visible once scrolled
  to the history sections).
- `dialog-row__<locale>__<viewport>.png` — `ClearHistoryDialog scope="row"` open (triggered
  via the first per-row trash button).
- `dialog-entity__<locale>__<viewport>.png` — `ClearHistoryDialog scope="entity"` open
  (triggered via the first "Clear history" button).

84 screenshots captured, 0 failures, all 4 locales × all 7 viewports × 3 states.

**Reviewed manually:**
- `uk@320` (mandatory stress cell): "Очистити історію" buttons render full-width at the top
  of both "ІСТОРІЯ ЗМІН ТИПУ АКАУНТУ" and "ІСТОРІЯ ЗМІН СТАТУСУ" sections; per-row trash icons
  sit at the row's right edge with no horizontal scroll; both `ClearHistoryDialog` variants
  open as full-width bottom sheets with `rounded-t-2xl`, drag handle, stacked full-width
  "Очистити"/"Скасувати" buttons, no text clipping for the longer uk strings.
- `en@desktop-1280`: "Clear history" buttons render as compact inline buttons at the top of
  each section; per-row trash icons are small icon buttons at the row's right edge;
  `ClearHistoryDialog` renders as a centered `sm:max-w-sm` card with "Cancel"/"Clear" buttons
  side-by-side.
- All other locale × viewport combinations (sq/it at all 7 viewports, uk@375/390/768/1280/1440/2560,
  en at all other viewports) captured with 0 failures and spot-checked for absence of raw i18n
  keys / mojibake in the dialog titles, bodies, and button labels.

Screenshots and the capture script were deleted after review per the project's throwaway-script
convention (`.screenshots/task246-history/`, `scripts/_task246-history-evidence.mjs`).

---

## Self-validation (AC11 / clause 9 / clause 14)

Re-run in full after the rework rewrite of `clearHistory.ts` (RPC-based `clear_user_history`):

- `npx tsc --noEmit` → **0 errors** (clean, full project).
- `npm run lint` → **0 new errors/warnings** (`eslint` exits clean).
- `npm run check:i18n` → **✅ Parity PASSED — all 4 locale files have identical key sets
  (1816 keys)**. The 2 raw-enum warnings (`AdminInquiriesManager.tsx:288`,
  `AdminSupportManager.tsx:124`) are pre-existing and unrelated to this change (not introduced
  by this diff).
- `npm run build` → succeeds, all routes compile including `/admin/users/[id]` and
  `/admin/users/new`.
- `npx vitest run` → **597/597 tests pass (19 files)** — no regressions.

### File-integrity transcript (clause 14) — run natively against all touched files

```
src/lib/auth/permissionKeys.ts                       NUL=0  BOM=absent (657870 = "exp...")
messages/en.json                                     NUL=0  BOM=absent (7b0a20 = "{\n ")
messages/sq.json                                     NUL=0  BOM=absent (7b0a20 = "{\n ")
messages/uk.json                                     NUL=0  BOM=absent (7b0a20 = "{\n ")
messages/it.json                                     NUL=0  BOM=absent (7b0a20 = "{\n ")
src/types/database.ts                                NUL=0  BOM=absent (657870 = "exp...")
src/modules/admin/actions/clearHistory.ts            NUL=0  BOM=absent (277573 = "'us...")
src/components/admin/AdminUserProfile.tsx            NUL=0  BOM=absent (277573 = "'us...")
src/app/admin/users/[id]/page.tsx                    NUL=0  BOM=absent (696d70 = "imp...")
src/app/admin/users/new/page.tsx                     NUL=0  BOM=absent (696d70 = "imp...")
src/stories/fixtures/admin.fixtures.ts               NUL=0  BOM=absent (2f2a2a = "/**")
src/components/admin/AdminUserProfile.stories.tsx    NUL=0  BOM=absent (696d70 = "imp...")
```

- `messages/*.json` → `JSON.parse()` succeeds for all 4 files.
- `src/types/database.ts`, `clearHistory.ts`, etc. → covered by the project-wide
  `tsc --noEmit` (0 errors) above; tails of all 12 touched files confirmed to end at their
  intended last line (no mid-token truncation).

**Verdict: GREEN — no truncation, no NUL bytes, no BOM, no parse failures.**

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/auth/permissionKeys.ts` | Added `'audit.clear_history'` to `PERMISSION_KEYS`. |
| `messages/en.json`, `sq.json`, `uk.json`, `it.json` | Added `admin.user_profile.actions.clear_history` / `clear_history_row_aria`; `feedback.clear_history_success/error/forbidden`; `dialogs.clear_row_title/body`, `clear_entity_title/body`, `clear_cancel`, `clear_confirm`; `admin.permissions.keys/descriptions.audit_clear_history` — all 4 locales, parity-verified. |
| `src/types/database.ts` | Added `HistoryClearSource`, `HistoryClearScope` types and `HistoryClearEvent` interface matching the new table. |
| `src/modules/admin/actions/clearHistory.ts` | **New file** (rework: rewritten once). `clearHistoryRow` + `clearHistoryForEntity` server actions: permission gate, then a single `db.rpc('clear_user_history', {...})` call which atomically does the row lookup + audit insert + delete (see SQL Section 2) — no separate select/insert/delete steps in app code, `revalidatePath` on success. |
| `src/components/admin/AdminUserProfile.tsx` | Added `canClearHistory` prop; new `ClearHistoryDialog` component (row/entity scopes, full-width bottom sheet via `sm:max-w-sm`); per-row trash icon buttons + per-entity "Clear history" buttons in both history sections; `handleClearHistoryRow`/`handleClearHistoryForEntity` handlers + dialog state + dialog render blocks. |
| `src/app/admin/users/[id]/page.tsx` | Computes `canClearHistory = await hasPermission('audit.clear_history').catch(() => false)`, passes to `AdminUserProfile`. |
| `src/app/admin/users/new/page.tsx` | Same `canClearHistory` computation/prop-pass (create mode, unused but required by `Props`). |
| `src/stories/fixtures/admin.fixtures.ts` | Added `FIXTURE_CHANGE_LOG` and `FIXTURE_STATUS_HISTORY` (non-empty, so the new controls render in Storybook). |
| `src/components/admin/AdminUserProfile.stories.tsx` | `sharedArgs` now uses the new fixtures + `canClearHistory: true`; `CreateMode` story also gets `canClearHistory={true}`. |

**Not part of this diff:** `tasks/Epics/Epic_I_kickoff_prompt_Task_427_AdminOwnerFullEditAndStatusAccess.md`
shows as modified in `git status` but was not touched by this task — pre-existing uncommitted
change from a prior session, left as-is.

**Out of scope, not changed:** `scripts/check-schema-drift.mjs` (`INTERFACE_TABLE_MAP` —
candidate follow-up, not required by AC8's literal text); listing-status history display (see
investigation note); `role_permissions` UI beyond the new auto-rendered key; any git/SQL
commands (single-writer — owner/orchestrator only).
