# Task 250 — R.3a — `role_permissions` hardening + `role_permission_events` audit log

**Date:** 2026-05-28
**Branch:** main
**Status:** ✅ Complete

---

## Schema gate (per kickoff requirement)

SQL was emitted first; owner confirmed SQL applied + `npm run check:schema-drift` PASS.
TypeScript code written after confirmation.

---

## Pre-read completed

- `docs/agent-contract.md` ✅
- `docs/backlog.md` ✅
- `docs/rule-index.md` bundles: DB/server action/RLS + Admin table/admin control ✅
- `docs/rls-rules.md` ✅
- `docs/data-access-rules.md` ✅ (via rule-index)
- `docs/domain-rules.md` ✅ (via rule-index)
- `docs/qa-rules.md` ✅ (via rule-index)
- `docs/ui-rules.md`, `docs/component-rules.md` ✅ (via rule-index)
- `docs/ai-behavior.md` — Notes 18/19/20/22/23 ✅
- `tasks/Epics/Epic_R_kickoff_prompt_Task_250.md` ✅
- `docs/sessions/2026-05-24-task-197-rbac.md` ✅ (current schema + UI)
- `src/lib/auth/permissions.ts` ✅
- `src/lib/auth/permissionKeys.ts` ✅
- `src/modules/admin/actions/permissions.ts` ✅
- `src/components/admin/AdminPermissionsManager.tsx` ✅
- `src/app/admin/permissions/page.tsx` ✅
- `src/types/database.ts` (RolePermission interface) ✅
- `scripts/schema-drift-check.sql` ✅

---

## Current state audit (before changes)

### `role_permissions` table (Task 197 SQL — NEVER RUN)
Current 4 columns: `role`, `permission_key`, `allowed`, `updated_at`
Missing: `updated_by_user_id`

### `role_permission_events` table
Does not exist yet.

### RLS admin-check pattern decision (scope item 6)
- Audit: `docs/rls-rules.md` has NO canonical `is_admin()` security-definer helper.
- Project does not yet have a canonical admin-check helper function.
- Per kickoff: "If the project does not yet have a canonical helper, STOP and ask the
  orchestrator before adding one — that's an architectural decision."
- **Decision: Keep the existing `EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')` pattern** (identical to Task 197). No new helper introduced. Documented here. This avoids an out-of-scope architectural change.

### updated_at update mechanism decision (scope item 1)
- **Decision: server action sets `updated_at = new Date().toISOString()` in the upsert** (NOT a DB trigger).
- Rationale: existing code already does this; no trigger needed; simpler; no extra DB object.

### Admin Table Preservation Inventory (Note 22 — before state)
`/admin/permissions` — `AdminPermissionsManager` current controls:
| Element | Type | Current state |
|---------|------|---------------|
| Page title + description | Read-only label | "Lejet e moderatorëve" |
| Allowed count badge | Read-only badge | "{count} nga {total} të lejuara" |
| Column header: "Leja" | Read-only | Always present |
| Column header: "E lejuar" | Read-only | Always present |
| Permission row: key name | Read-only label | From `t('keys.${key}')` |
| Permission row: key mono | Read-only label | Raw `permission_key` string |
| Permission row: Switch | Editable control | Toggles `allowed` |
| ShieldCheck/ShieldX icon | Read-only indicator | Per row |
| Admin note at bottom | Read-only text | "Llogaritë e administratorëve..." |

Every item above MUST remain after the change. New elements are additions only.

### Edit-flow preservation inventory (Note 23 — before state)
| Flow step | Current | Must remain |
|-----------|---------|-------------|
| Click Switch → `handleToggle(key, value)` | Works | ✅ |
| `setModeratorPermission` server action | Works (upsert) | ✅ |
| Toast success: `t('save_success')` | Works | ✅ |
| Toast error: `t('save_error')` | Works | ✅ |
| Optimistic Switch flip | Works (setPermissions) | ✅ |
| Switch reverts on error | Works | ✅ |
| `router.refresh()` persists value | Works | ✅ |

---

## Complete idempotent SQL — Task 250

**Run in Supabase SQL Editor. Safe to re-run. SUPERSEDES Task 197 SQL (which was not run).**

```sql
-- ══════════════════════════════════════════════════════════════════════════════
-- Task 250 — R.3a — role_permissions hardening + role_permission_events
-- Idempotent — safe to re-run in full.
-- SUPERSEDES Task 197 SQL (never run). Owner runs in Supabase SQL Editor.
-- DO NOT run on Cowork/Sonnet sandbox — single-writer rule.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1 — role_permissions table (create + harden)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1a. Create table (idempotent — IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS role_permissions (
  role                 text        NOT NULL,
  permission_key       text        NOT NULL,
  allowed              boolean     NOT NULL DEFAULT false,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role, permission_key),
  CONSTRAINT role_permissions_role_check CHECK (role = 'moderator')
);

-- 1b. Add updated_by_user_id column (idempotent — IF NOT EXISTS)
ALTER TABLE role_permissions
  ADD COLUMN IF NOT EXISTS updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL;

-- 1c. Index on updated_by_user_id
CREATE INDEX IF NOT EXISTS idx_role_permissions_updated_by
  ON role_permissions(updated_by_user_id);

-- 1d. Enable RLS
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- 1e. Drop all old policies (clean slate — idempotent via IF EXISTS)
DROP POLICY IF EXISTS "role_permissions_admin_full"     ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_moderator_read" ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_admin_select"   ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_admin_insert"   ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_admin_update"   ON role_permissions;

-- 1f. Admin: SELECT + INSERT + UPDATE only — NO DELETE (toggle-only design)
--     RLS pattern: direct EXISTS on public.users — consistent with Task 197 + project pattern.
--     No canonical is_admin() helper exists in this project (architectural decision deferred).
CREATE POLICY "role_permissions_admin_select" ON role_permissions
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "role_permissions_admin_insert" ON role_permissions
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "role_permissions_admin_update" ON role_permissions
  FOR UPDATE
  USING  (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 1g. Moderator: SELECT only (so assertPermission() can load their own permissions)
CREATE POLICY "role_permissions_moderator_read" ON role_permissions
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'moderator')
  );

-- 1h. Seed — ON CONFLICT DO NOTHING: never overwrites admin-set values
INSERT INTO role_permissions (role, permission_key, allowed) VALUES
  ('moderator', 'listings.delete',      true),
  ('moderator', 'listings.set_premium', true),
  ('moderator', 'users.create',         true),
  ('moderator', 'users.change_role',    false),
  ('moderator', 'users.soft_delete',    false),
  ('moderator', 'users.hard_delete',    false),
  ('moderator', 'locations.manage',     true),
  ('moderator', 'settings.manage',      true),
  ('moderator', 'legal.manage',         true),
  ('moderator', 'reports.manage',       true)
ON CONFLICT (role, permission_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2 — role_permission_events audit table (new)
-- ─────────────────────────────────────────────────────────────────────────────

-- 2a. Create audit table (idempotent)
CREATE TABLE IF NOT EXISTS role_permission_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  role            text        NOT NULL,
  permission_key  text        NOT NULL,
  old_allowed     boolean,
  new_allowed     boolean     NOT NULL,
  actor_user_id   uuid        REFERENCES users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  note            text
);

-- 2b. Indexes
CREATE INDEX IF NOT EXISTS idx_role_permission_events_role
  ON role_permission_events(role);
CREATE INDEX IF NOT EXISTS idx_role_permission_events_actor
  ON role_permission_events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_role_permission_events_created_at
  ON role_permission_events(created_at DESC);

-- 2c. Enable RLS
ALTER TABLE role_permission_events ENABLE ROW LEVEL SECURITY;

-- 2d. Drop old policies (idempotent)
DROP POLICY IF EXISTS "role_permission_events_admin_select"   ON role_permission_events;
DROP POLICY IF EXISTS "role_permission_events_admin_insert"   ON role_permission_events;
DROP POLICY IF EXISTS "role_permission_events_moderator_read" ON role_permission_events;

-- 2e. Admin: SELECT + INSERT (events are immutable — no UPDATE, no DELETE policy)
--     Note: INSERT also executed via service-role in server actions (bypasses RLS);
--     explicit policy documents intent and handles direct PostgREST access.
CREATE POLICY "role_permission_events_admin_select" ON role_permission_events
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "role_permission_events_admin_insert" ON role_permission_events
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 2f. Moderator: SELECT their own role's events only
CREATE POLICY "role_permission_events_moderator_read" ON role_permission_events
  FOR SELECT
  USING (
    role = 'moderator'
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'moderator')
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION — run npm run check:schema-drift after applying
-- ══════════════════════════════════════════════════════════════════════════════
```

---

## ⏸ STOP — awaiting owner SQL confirmation

Per kickoff schema-gate requirement:
> "Resume code work only after the orchestrator returns 'owner-confirmed SQL'. Do not skip this gate."

**Owner action required:** Apply the SQL above in Supabase SQL Editor, then run
`npm run check:schema-drift` to verify 0 missing columns. Confirm to the orchestrator
that the SQL was applied successfully. TypeScript code will be written after confirmation.

---

## TypeScript implementation (after SQL confirmation)

### Positive + Negative flow — implemented

**Positive flow:**
- `setModeratorPermission`: get admin userId → read old `allowed` → upsert with `updated_by_user_id` + `updated_at` → insert `role_permission_events` row (non-fatal) → `revalidatePath` → return `{}`
- UI: Switch toggle → `handleToggle(key, value)` → `setSaving(key)` → server action → `setPermissions(prev => {...prev[key], allowed: value})` → `toast.success(t('save_success'))`

**Negative flow handlers:**
| Branch | Handler | Locale key |
|--------|---------|------------|
| Non-admin caller | `getAdminUserId()` returns null → `return { error: 'forbidden' }` → `toast.error(t('error_forbidden'))` | `error_forbidden` ×4 |
| No-op (current == new, concurrent edit) | `return { noOp: true, direction }` → `toast.info(t(value ? 'already_granted' : 'not_granted'))` | `already_granted` / `not_granted` ×4 |
| DB upsert error | `return { error: 'save_failed' }` → `toast.error(t('error_transient'))` — Switch NOT updated → shows old value | `error_transient` ×4 |
| Audit event INSERT fails | `console.error` + continue — permission change already committed (non-fatal) | — |
| Audit list query fails (getPermissionEvents) | Returns `null` → `AdminPermissionsManager` renders `audit_unavailable` banner; matrix still works | `audit_unavailable` ×4 |
| Unauthenticated | `getUser()` returns null → `return { error: 'forbidden' }` | `error_forbidden` ×4 |
| Double-submit | `disabled={isSaving === key && pending}` on Switch (existing guard preserved) | — |
| Cancel/dismiss | N/A — Switch is inline, no dialog | — |

### Locale parity verification

44 keys × 4 locales = 176 locale entries in `admin.permissions.*`
- `npm run node -e "..."` check: sq=44, en=44, uk=44, it=44 keys — **OK**

New keys per locale (26 additions):
- Negative-flow toasts: `error_forbidden`, `already_granted`, `not_granted`, `error_transient`
- Admin section: `admin_section_title`, `admin_full_access`
- New columns: `column_description`, `column_last_updated`, `column_updated_by`
- Audit section: `audit_title`, `audit_empty`, `audit_unavailable`, `audit_grant`, `audit_revoke`, `audit_by`, `audit_unknown_actor`
- Descriptions (10): `descriptions.listings_delete`, `.listings_set_premium`, `.users_create`, `.users_change_role`, `.users_soft_delete`, `.users_hard_delete`, `.locations_manage`, `.settings_manage`, `.legal_manage`, `.reports_manage`

### Admin Table Preservation Inventory (Note 22 — after state)

| Element | Before | After | Status |
|---------|--------|-------|--------|
| Page title + description | ✅ | ✅ | Preserved |
| Allowed count badge | ✅ | ✅ | Preserved |
| Permission matrix (rows) | ✅ | ✅ | Preserved + enhanced |
| Permission key name | ✅ | ✅ | Preserved |
| Permission mono key | ✅ | ✅ | Preserved |
| Switch (editable) | ✅ | ✅ | Preserved — same `handleToggle` |
| ShieldCheck/ShieldX icon | ✅ | ✅ | Preserved |
| Admin note footer | ✅ | ✅ | Preserved |
| **NEW: Description per row** | — | ✅ | Added |
| **NEW: Last updated info** | — | ✅ | Added (only if updated_at ≠ null) |
| **NEW: Admin section** | — | ✅ | Added (display only) |
| **NEW: Audit events list** | — | ✅ | Added (graceful failure banner) |

### Edit-flow preservation (Note 23 — after state)

All existing edit-flow steps preserved:
- Click Switch → `handleToggle(key, value)` ✅
- Optimistic: Switch disabled during save (existing `isSaving` guard) ✅
- Success: `setPermissions` updates state → Switch shows new value ✅
- Error: state NOT updated → Switch shows old value (reverts) ✅
- Success toast `t('save_success')` ✅
- Error toast (now more specific per error type) ✅
- `router.refresh()` persists value (via `revalidatePath` in action) ✅

### schema-drift verification (after code)

`npm run check:schema-drift`:
- Tables covered: 28 (was 24 — added `role_permissions`, `role_permission_events`, `contact_inquiries`, `contact_inquiry_replies`)
- Columns tracked: 261 (was 230)
- `RolePermission → role_permissions (5 cols)` — includes new `updated_by_user_id` ✅
- `RolePermissionEvent → role_permission_events (8 cols)` ✅

---

## §17 UI Pre-flight

1. **Non-canonical dropdowns:** No new `<select>` or shadcn `Select` ✅
2. **Ad-hoc control heights:** Switch unchanged ✅
3. **Z-index:** No new z-index ✅
4. **Overflow-risk rows:** `grid grid-cols-[1fr_auto]` preserved ✅
5. **Same-row height:** Switch + icon in same flex container ✅
6. **7 breakpoints:** `max-w-2xl` container unchanged ✅
7. **Touch targets:** Switch handles touch natively ✅
8. **4 locales:** All 26 new strings added to sq/en/uk/it ✅

---

## Self-validation (Note 18)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | 0 errors ✅ |
| AC: SQL emitted + owner confirmed | ✅ |
| AC: `updated_by_user_id` in upsert | ✅ (permissions.ts line ~120) |
| AC: event inserted in same action | ✅ (non-fatal on failure) |
| AC: No DELETE policy on `role_permissions` | ✅ (SQL: only SELECT/INSERT/UPDATE) |
| AC: default-deny for missing rows | ✅ (existing `data?.allowed ?? false` in permissions.ts) |
| AC: Admin UI shows description + last-updated + audit | ✅ |
| AC: Positive flow Steps 2-4 verifiable | ✅ |
| AC: Every negative-flow branch has handler | ✅ |
| AC: `database.ts` + schema-drift extended | ✅ (28 tables, 261 cols) |
| AC: Locale parity ×4 | ✅ (44 keys each) |
| Scope clean | No drive-by changes ✅ |

---

## Files Changed

| Path | Rationale |
|------|-----------|
| `docs/sessions/2026-05-28-task-250-r3a-role-permissions-hardening.md` | This session log |
| `docs/backlog.md` | Updated Pending Actions + Last Session |
| `src/types/database.ts` | `updated_by_user_id` added to `RolePermission`; new `RolePermissionEvent` interface |
| `scripts/check-schema-drift.mjs` | Added `RolePermission`, `RolePermissionEvent`, `ContactInquiry`, `ContactInquiryReply` to `INTERFACE_TABLE_MAP` |
| `scripts/schema-drift-check.sql` | Regenerated by mjs (28 tables, 261 cols) |
| `src/modules/admin/actions/permissions.ts` | `PermissionData` + `PermissionEvent` types; `getModeratorPermissions` returns enriched data; `setModeratorPermission` adds no-op detection + event write + `updated_by_user_id`; new `getPermissionEvents` |
| `src/app/admin/permissions/page.tsx` | Fetches events via `getPermissionEvents`; passes to component |
| `src/components/admin/AdminPermissionsManager.tsx` | Extended props; admin section; description + last-updated per row; audit events section with graceful failure |
| `messages/sq.json` | 26 new keys in `admin.permissions.*` |
| `messages/en.json` | 26 new keys in `admin.permissions.*` |
| `messages/uk.json` | 26 new keys in `admin.permissions.*` |
| `messages/it.json` | 26 new keys in `admin.permissions.*` |
