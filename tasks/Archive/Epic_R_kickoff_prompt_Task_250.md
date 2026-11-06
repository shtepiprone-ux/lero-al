# Epic R — kickoff prompt — Task 250 — R.3a — role_permissions schema hardening (Task 197 follow-up)

**Filed by:** Opus 4.7 orchestrator 2026-05-25
**Follow-up to:** Task 197 (R.3 RBAC) shipped 2026-05-24, owner-pending SQL.
**Source:** owner directive 2026-05-25 (in `issues.txt`):
> Do not proceed with the current schema exactly as-is. The direction is approved, but the schema
> needs a few hardening improvements before implementation.

> ⚠️ **Blocks the pending owner SQL for Task 197.** The current Pending Action Item in
> `docs/backlog.md` — "SQL: Task 197 `role_permissions` table + RLS + seed" — is REPLACED by the SQL
> emitted in this task's session log. The owner runs ONE migration (Task 250's), not two.

---

You are Claude Code Sonnet 4.6 working in `lero-al`.

**Hard contract** (`docs/orchestrator-role.md` → "Hard contract embedded in EVERY Sonnet prompt"):
no scope change; no invented architecture (STOP & ask the orchestrator if anything is ambiguous);
literal AC; **self-validate BEFORE claiming complete** (Note 18 in `docs/ai-behavior.md` — tsc=0,
AC-by-AC table in session log, diff self-review, runtime check in `uk` 320px); **preserve UX flow**
(Note 19); **preserve existing controls** (Note 20 — list every control on
`/admin/permissions` BEFORE you change it, then list AFTER — nothing dropped without explicit
authorisation); update `docs/backlog.md` + add session log under `docs/sessions/`; 0 new
lint/typecheck errors; `npm run build` passes; governance PASS; 4 locales sq/en/uk/it; 7
breakpoints if UI changes; **single-writer SQL — owner runs all SQL; emit the EXACT idempotent SQL
into the session log**; **single-writer git — emit ready-to-run git commit commands as plain text
at the end; the executor never runs git**.

## Pre-read

1. `docs/agent-contract.md` (P0 contract — read first)
2. `docs/backlog.md`
3. Task-relevant docs from `docs/rule-index.md` → **"Admin table / admin control task"** + **"DB / server action / RLS task"**:
   - `docs/rls-rules.md` (RLS patterns + security-definer helpers used elsewhere in the project)
   - `docs/data-access-rules.md`
   - `docs/domain-rules.md`
   - `docs/qa-rules.md`
   - `docs/ui-rules.md`
   - `docs/component-rules.md`
   - `docs/component-governance.md` (canonical `AdminTableRow` pattern §11)
4. `docs/ai-behavior.md` — Note 18 (self-validation), Note 19 (UX flow), Note 20 (control preservation), **Note 22 (Admin Table Preservation Rule)**, **Note 23 (Edit-Flow Preservation Rule)**
5. Task 197 session log: `docs/sessions/2026-05-24-task-197-rbac.md` (current schema + UI + helpers)
6. `src/lib/auth/permissions.ts`, `permissionKeys.ts`; `src/modules/admin/actions/permissions.ts`;
   `src/components/admin/AdminPermissionsManager.tsx`; `src/app/admin/permissions/page.tsx`
7. `src/types/database.ts` + the schema-drift map (Sprint 8 / Task 172) — must be extended for the new table
8. Inspect `package.json` for current validation scripts.

## Localization coverage

- sq, en, uk, it for any new permission labels / descriptions / audit-list strings (`messages/*.json`).
- Runtime locale switching must be visually confirmed (Note 18 step 4).

## Responsive coverage

- 320, 375, 390, 768, 1280, 1440, 2560 for `/admin/permissions` and the new audit list.

## Current behavior to preserve

Before editing, inspect `/admin/permissions` + `AdminPermissionsManager.tsx` and list in the session log:

- Affected routes: `/admin/permissions`.
- Affected components: `AdminPermissionsManager.tsx`, `src/app/admin/permissions/page.tsx`.
- Existing controls: the permission matrix (rows × `allowed` Switch), role tabs, save behavior.
- Existing editable controls: the `allowed` Switch per (role, permission_key) row.
- Existing read-only labels: any informational text on the page.
- Existing server actions: `togglePermission` (or equivalent) in `src/modules/admin/actions/permissions.ts`.
- Existing success/error behavior: toast confirmation on successful toggle; error toast on failure.
- Existing mobile behavior at 320px in `uk`.

Any existing control must either remain, move to a specified new place, or be explicitly listed as removed.
Silent removal is forbidden — see Note 20.

**Admin table preservation rule (Note 22):**
Before editing the matrix, inventory in the session log: columns; row click behavior; row actions;
inline controls (the Switch); filters; search; pagination; sort; empty state; loading state; mobile
layout. After the change, every existing admin action must remain reachable unless explicitly removed.

**Edit-flow preservation rule (Note 23):**
The `allowed` Switch is the editable control. After this task it must still be editable, save must
still work, success / error / loading states must still be visible, and the persisted value must
survive `router.refresh()`. The new "last updated by" + audit list are read-only additions; they
must not replace the Switch.

## Required after behavior

As an admin, on `/admin/permissions`:
1. Toggle the `allowed` Switch for a (moderator role, permission_key) row.
2. The Switch flips in the UI optimistically.
3. The server action updates `role_permissions` AND inserts a row into `role_permission_events` in the same transaction; `updated_by_user_id` and `updated_at` are set on the `role_permissions` row.
4. Success toast appears (4 locales).
5. On failure, the Switch reverts and an error toast appears (4 locales).
6. After `router.refresh()` / page reload, the new value persists and the new audit entry appears in the recent-changes list.

As a moderator, on `/admin/permissions` (or wherever their read view lives):
1. The moderator can SEE their current matrix (`allowed` per permission_key) but cannot toggle.
2. The moderator can see the audit history for their role (SELECT-only RLS).
3. A server-side `hasPermission()` / `assertPermission()` call denies any action whose `allowed=false` OR whose row is missing.



## Goal

Revise Task 197's `role_permissions` schema + RLS + seed + admin UI per the owner's 7-point
hardening list. Direction is approved (admins not stored in DB; moderators read their effective
permissions but cannot self-grant; dangerous permissions default-deny). Make it auditable,
idempotent, and tamper-resistant before the SQL is executed.

## Scope — exact owner spec (literal)

### 1. Human accountability on `role_permissions`
- Add `updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL` to `role_permissions`.
- Keep `updated_at`; ensure it is updated on every permission change. Either set
  `updated_at = now()` in the server action, OR add a DB trigger — pick one and document the
  choice in the session log. Both must produce the same result; do not do both.

### 2. Permission change history / audit table
Create a lightweight audit table:

```sql
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
```

- Every admin permission change inserts one event row (in the same server action / transaction as
  the `role_permissions` UPDATE).
- Document the RLS for this audit table: admin can SELECT/INSERT (server-side via action),
  moderator can SELECT (so they can see history of their own role), no UPDATE / DELETE policy.

### 3. No DELETE through normal flow
- `role_permissions` rows are toggled (`allowed` boolean flip), not deleted.
- Explicit RLS policies:
  - admin can SELECT / INSERT / UPDATE
  - moderator can SELECT
  - no DELETE policy exists (unless the owner explicitly justifies one — none given).
- If a DELETE policy currently exists in 197's RLS, remove it.

### 4. Idempotent seed that does NOT overwrite later admin changes
- Use `INSERT … ON CONFLICT (role, permission_key) DO NOTHING` for initial seeds (197's
  session-log SQL already uses this — verify it is preserved; do NOT switch to an upsert that
  resets `allowed`).

### 5. Server-side default-deny for moderators
- `hasPermission()` / `assertPermission()` return / enforce **deny** when the row is missing OR
  when `allowed = false`. Admin always bypasses and is allowed.
- Verify every existing call site uses the server-side check, not UI-only hiding. UI hiding is
  allowed as a nice-to-have on top, never as the security boundary.

### 6. RLS admin-check helper
- The current 197 policy uses `EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role =
  'admin')`. If this conflicts with the project's `users` RLS or with the existing security-
  definer / helper approach in `docs/rls-rules.md`, switch the policy to the helper pattern.
- Audit the rest of the project's RLS files for the canonical admin-check pattern; reuse it. If
  the project does not yet have a canonical helper, STOP and ask the orchestrator before adding
  one — that's an architectural decision.

### 7. Admin UI requirements (extends `AdminPermissionsManager` + `/admin/permissions` page)
- Show admin role as "Full access / not configurable" — display only; do NOT store admin rows in
  DB.
- Show the moderator permission matrix with clear labels (not just raw permission keys).
- For every permission row, show:
  - permission name (clear label, i18n × 4)
  - description / rationale (i18n × 4)
  - current allowed/denied state (the existing Switch)
  - last updated date
  - last updated by (admin name) if available
- Add a history / timeline section (or at least a compact audit list of recent permission
  changes) reading from `role_permission_events`.

## Important — schema confirmation gate

Per the owner's instruction "Please provide the revised idempotent SQL for owner confirmation
before writing code" — Sonnet must:

1. First, produce the COMPLETE revised idempotent SQL (schema + RLS + seed + audit table +
   trigger if chosen) in the session log.
2. Then STOP and report back to the orchestrator BEFORE writing any TS / TSX code. The
   orchestrator routes the SQL to the owner for confirmation.
3. Resume code work only after the orchestrator returns "owner-confirmed SQL". Do not
   skip this gate.

## Acceptance criteria

- **Schema-gate:** revised idempotent SQL pasted into the session log + a STOP / wait-for-
  confirmation line. (No code written before owner confirmation; the orchestrator gates this.)
- After confirmation, code changes:
  - `role_permissions` gains `updated_by_user_id`; server action sets it + `updated_at`.
  - `role_permission_events` table + RLS + INSERT path in the server action (same transaction
    as the UPDATE).
  - No DELETE policy on `role_permissions`; toggle-only.
  - Server-side default-deny for moderator enforced; missing row → denied.
  - RLS uses the canonical project admin-check (helper if applicable).
  - `AdminPermissionsManager` UI shows: clear name + description + last updated date + last
    updated-by, plus a compact recent-changes audit list.
- `database.ts` + schema-drift map (Task 172) extended for the new table and column.
- Locale parity sq/en/uk/it for all new strings; before/after key-count audit in the session log.
- §17 UI pre-flight output in the session log.
- **Self-validation block** per Note 18 (tsc=0, AC table all green, scope=clean) — without this
  block the task is INCOMPLETE.
- UX-flow trace + control-inventory before/after per Notes 19 + 20 (the existing matrix UI must
  not lose any control).
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- `docs/backlog.md` Pending Action Item replaced: "SQL: Task 250 `role_permissions` hardening +
  `role_permission_events` (supersedes Task 197 SQL)".
- Session log: `docs/sessions/2026-05-25-task-250-r3a-role-permissions-hardening.md`.

## Out of scope

- Adding admin rows to `role_permissions` (explicit owner directive: admins stay out of the DB).
- Adding new permission keys beyond what Task 197 already defined (file a follow-up if needed).
- The Task 246 "Clear history" feature (Epic DD) — that depends on this task but is filed
  separately.

## Hard contract reminder (single-writer)

- Do NOT run SQL; emit it for the owner.
- Do NOT run git; emit ready-to-run commit commands as plain text at the end (single `git add`
  with explicit paths or `git add -A`; do NOT use `^` / backtick continuations — PowerShell
  fails them silently).
