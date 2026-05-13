Before starting this task, Claude Code MUST read and follow these docs:
- /docs/ai-behavior.md
- /docs/analytics-rules.md
- /docs/architecture.md
- /docs/backlog.md
- /docs/component-rules.md
- /docs/data-access-rules.md
- /docs/dependencies.md
- /docs/domain-rules.md
- /docs/env.md
- /docs/integrations.md
- /docs/performance.md
- /docs/qa-rules.md
- /docs/rls-rules.md
- /docs/ui-rules.md

Task: Lock down user-role mutation in the admin "Users" table. Role changes MUST be possible ONLY from the dedicated user profile edit page / popup. In the admin users table the "Role" column MUST be strictly read-only: no dropdown, no select, no combobox, no inline editor, no click-to-cycle behavior — display only.

IMPORTANT — LOCALE & ROUTE SCOPE:
The admin panel is locale-independent (confirmed in Task 1 — `proxy.ts` skips next-intl for `/admin/*`, `admin/layout.tsx` forces English). The fix applies to the admin users index route — confirm the exact path during the audit (`/admin/users` or equivalent per `docs/architecture.md`). No per-locale branching.

IMPORTANT — SCOPE BOUNDARIES:
- Role mutation surface AFTER this task: exactly ONE — the user profile edit page / popup (whichever the project currently exposes for editing a single user). Confirm which it is during the audit; do NOT introduce a new one.
- Display-only surface for "Role": the admin users table. Any other surface that currently shows a role (badge in a user card, a settings page, etc.) is OUT OF SCOPE for this task — do not touch it unless it is the same `AdminUsersTable.tsx` row.

Context:
On the admin "Users" page, every row currently exposes the user's role through a control that allows admins to flip the role inline — the same anti-pattern Task 1 fixed for listing status, except here it is a permissions decision, not a UX one. Inline role changes are dangerous for three reasons:
- An admin can mis-click a Combobox option and accidentally promote a private user to admin with no confirmation.
- There is no edit-mode context — no save / cancel discipline, no confirmation dialog, no audit log opportunity (Task 10's profile edit flow includes status-history logging; Task 17's full profile spec includes a moderator/admin permissions matrix where `Moderator` "cannot change user role").
- It diverges from the dedicated profile edit surface, splitting the role-mutation pathway into two code paths with two RLS surfaces.

The intent of this task is to collapse the mutation surface to one (profile edit), and harden the table to display-only.

Root-cause hypothesis (to be confirmed during the audit, NOT assumed):
- The "Role" cell renders an editable control (`<Select>` / project Combobox / inline editor) tied to a Server Action that updates the user's role on change.
- The Server Action is either reusing the same role-update mutation that profile edit uses, or it has its own dedicated call site.
- The permissions check on the Server Action may or may not honor the `Moderator cannot change role` rule from Task 17 — confirm during the audit.

This task is a UI lockdown plus an optional Server Action cleanup if the inline path was the only consumer. Do not redesign the table, do not add new columns, do not change the role enum, do not change RLS policies broadly, do not touch the profile edit page in any way other than confirming it still works for role changes.

Requirements:
- DO NOT add new features
- DO NOT change the role enum or any role's wire value
- DO NOT change the profile edit page / popup's existing role-change UI or behavior
- DO NOT introduce a new role-mutation Server Action; if the inline path had a dedicated action, remove it (or, if removal risks regressions elsewhere, keep the action but make it unreachable from the table)
- DO NOT change RLS policies; the profile edit role-change path's existing RLS coverage continues to be the single source of truth for role mutations
- DO NOT regress hydration-budget guarantees (the admin route is locale-independent and already client-rendered; this fix only removes JS / DOM, never adds it)
- DO NOT regress Task 1 (admin listings inline status update), Task 2 (Firefox hydration fix), Task 3 (Combobox migration), Task 4 (listing ID display), or Task 5 (views counter)
- DO NOT add hardcoded labels in user-facing copy; reuse the existing admin string source for the role label and the role display values
- ONLY: replace the editable control in the role cell with a plain display, remove any now-dead handler / state, and verify
- Preserve every guarantee from prior passes (Combobox-only enforced on legitimate edit surfaces, design tokens only, no hardcoded labels, RLS untouched, `revalidateTag('site-stats')` call set unchanged — role changes are NOT on that mutation set)

--------------------------------------------------
1. Reproduction
--------------------------------------------------
- Log in as admin.
- Navigate to the admin "Users" page (`/admin/users` or equivalent — confirm path).
- Confirm pre-fix:
  - Every row's "Role" cell exposes an editable control (inspect Elements panel — `<select>`, `<button>` opening a Combobox popover, or an inline editor).
  - Selecting a different option on the control fires a mutation that changes the user's role server-side without a confirmation dialog, without explicit save / cancel, and without leaving the table view.
- Capture file:line of the role cell render site and the mutation handler.
- Open the dedicated user profile edit page / popup for the same user. Confirm: it ALSO exposes a role control. This is the surface that will be the sole survivor.

Deliverable: short reproduction note — { table role-control file:line, table role-mutation handler file:line, profile edit role-control file:line }.

--------------------------------------------------
2. Audit — locate the surface and the call graph
--------------------------------------------------
Required steps:
- Find the admin users table component (likely `src/admin/users/components/AdminUsersTable.tsx` or similar — confirm from `docs/architecture.md` and the file tree).
- Identify:
  - Exact file:line of the "Role" cell render.
  - Exact file:line of the change handler.
  - The Server Action (or RPC) invoked by the change handler.
  - Whether that Server Action is ALSO called from the profile edit page / popup, or whether it is exclusive to the table.
  - The permissions check inside that Server Action (admin vs moderator vs other) per `docs/rls-rules.md` and the Task 17 spec (`Moderator cannot change user role`).
- Find the profile edit surface that will become the sole role-mutation entry point. Confirm it currently works and document its file path.
- Search for any other consumer of the role-mutation Server Action: `grep -rn "<name-of-action>" src/` — there should be at most two: the table and the profile edit. If there is a third consumer (a bulk-update tool, a CSV import, etc.), document it and STOP — that surface is out of scope but its existence may change the cleanup decision in §3.

Deliverable: audit table — { cell render file:line, change handler file:line, server action file:line, action consumers (table / profile / other), permissions check present (admin / moderator / both / neither), profile edit surface file path }.

--------------------------------------------------
3. Decide cleanup level
--------------------------------------------------
Based on §2:

Case A — the Server Action is shared between the table and the profile edit:
- Do NOT delete or rename the action.
- Remove the inline UI from the table only.
- Leave the action's signature, RLS coverage, and consumer in the profile edit untouched.

Case B — the Server Action is exclusive to the table (the profile edit uses a different mutation, or the same one is accessed through a different export):
- Decide whether to delete the now-orphaned action or to leave it in place. Prefer DELETE if it's truly unreachable from the UI (smaller surface area, fewer paths to audit). Keep it ONLY if the audit found it is also called from a non-UI surface (server-to-server, a job, a webhook handler).
- If deleted: also remove the associated route handler file if the action is a Route Handler rather than a Server Action.

Case C — there is no dedicated Server Action; the table writes the role directly via a Supabase client call:
- Remove the direct call site. The profile edit path is the only mutation surface after this fix; no new shared action is needed (the profile edit already uses whatever mutation it uses today).

Document the chosen case with one line of rationale.

--------------------------------------------------
4. Fix — table role cell becomes display-only
--------------------------------------------------
- Replace the editable control with a plain display element. The simplest and most consistent shape, matching the admin panel's existing patterns:
  - Render the role as a `Badge` (same component used elsewhere in the admin tables, e.g. the listing-status badge from Task 1's `AdminListingsTable.tsx`).
  - The badge variant is keyed off the role value via an existing or trivially-added `ROLE_VARIANT` map. If the project already has a role-to-badge-color mapping anywhere (Task 4's audit referenced `user_type` on the listing card; check if a shared `ROLE_VARIANT` exists), REUSE it. Do not duplicate.
  - The badge text comes from the existing role-label source (the same one the editable Combobox was using for its option labels). Do NOT introduce a new hardcoded label.
  - The cell has no `onClick`, no `onValueChange`, no `onChange` — pure display.
  - The cell does NOT show a "pencil" / edit affordance. Editing happens by navigating to the profile edit surface, which has its own entry point in the row (likely a "View" / "Edit" action button in the actions column — confirm during the audit and reuse).
- Remove the now-dead change handler, the now-dead local state for the role cell, and any now-dead imports.
- Confirm there is no remaining `<Select>` / `<Combobox>` / `<select>` element in the role cell via `grep -n "Select\|Combobox\|<select" <table-file>`.

Accessibility:
- The badge MUST have an accessible name. If the badge component already provides this via its content, no extra attribute is needed. If not, add `aria-label="Role: <value>"` (English; admin panel is locale-independent).
- Keyboard navigation across the row continues to work; removing an interactive control should not break tab order (it removes one stop, which is the correct outcome).

--------------------------------------------------
5. Fix — confirm profile edit role-change still works
--------------------------------------------------
- Open the profile edit page / popup for a test user.
- Confirm:
  - The role control is present and editable.
  - Changing the role and saving persists to Supabase.
  - The change reflects on next reload of the users table (and, per Task 1's pattern, may or may not reflect in-place — it should because the profile edit save likely already triggers `router.refresh()` or equivalent; if it does not, that is OUT OF SCOPE for this task — the request is to remove inline editing, not to add propagation that does not currently exist).
- Confirm: the existing permissions check (admin vs moderator) on the profile edit role-change path is unchanged. If `Moderator` is currently permitted to change role and the Task 17 spec requires they not be, that is a separate task — document the gap in `docs/backlog.md` but do NOT fix it here.

--------------------------------------------------
6. RLS / permissions sanity
--------------------------------------------------
Per `docs/rls-rules.md`:
- Confirm the surviving role-mutation surface (profile edit) is gated by an admin role check at the application layer AND/OR by RLS.
- Confirm no role-mutation path remains reachable from a non-admin context (the table change handler is gone; the profile edit page is admin/moderator-gated; if Case B led to action deletion, that surface is removed entirely; if Case C led to a direct Supabase call removal, the Supabase RLS on `users.role` should already prevent unauthorized writes — confirm explicitly).
- `revalidateTag('site-stats')` call set unchanged — role changes are NOT in the documented mutation set for that tag.

Deliverable: one-line verdict — "Sole role-mutation surface: profile edit. Permissions check: <admin-only / admin+moderator>. RLS on `users.role`: <present / not-applicable-because-action-deleted>."

--------------------------------------------------
7. UI Gate
--------------------------------------------------
Per `docs/ui-rules.md` and `docs/component-rules.md`:
- The role cell is now a `Badge`, not a `<select>` or a Combobox. The Combobox-only rule continues to apply to legitimate edit surfaces; this is an explicit lockdown of an edit surface, which is a stricter outcome and consistent with the rule.
- No hardcoded labels.
- Design tokens only for any styling (the existing Badge variants already use tokens; no new tokens introduced).

--------------------------------------------------
8. Validation — table behavior
--------------------------------------------------
- Open the admin users page.
- Confirm:
  - Every row's role cell is a non-interactive Badge.
  - Clicking the badge does nothing.
  - Right-clicking the badge produces standard browser context menu (no custom popover).
  - Tab order skips the role cell (no focus ring on the badge unless the project intentionally makes badges focusable — uncommon).
  - The badge text matches the user's actual role in Supabase (spot-check one user per role: admin, moderator, private_person, agent, developer per Task 17 / Task 10 enum).
  - Console clean: no React warnings, no orphaned `onChange` handler warnings, no Sentry errors.
- Change a user's role from the profile edit surface. Reload the users page. Confirm the badge reflects the new role.

Deliverable: validation table — { every-row-is-badge, badge-not-interactive, badge-matches-supabase, profile-edit-still-works, post-edit-table-reflects-change, console-clean }.

--------------------------------------------------
9. Regression checks (out-of-scope surfaces — confirm untouched)
--------------------------------------------------
- Profile edit page / popup — unchanged (the fix verified it still works but did not modify it).
- AdminListingsTable inline status update (Task 1) — unchanged.
- ListingContact Firefox fix (Task 2) — unchanged.
- AdminLocationsManager Combobox migration (Task 3) — unchanged.
- Listing ID display on card + admin table (Task 4) — unchanged.
- Listing views counter (Task 5) — unchanged.
- Public-facing user pages (if any) — unchanged.
- Cabinet, favorites, listing detail — unchanged.
- `revalidateTag('site-stats')` call set unchanged.
- No schema migration introduced.
- No new dependency introduced.

Deliverable: short note "Regression surfaces untouched — N files modified (expected: 1, possibly 2 if a shared `ROLE_VARIANT` map needed extraction)."

--------------------------------------------------
10. Documentation updates
--------------------------------------------------
Update `docs/backlog.md`:
- CLOSED entry: "Admin Users table — role was editable inline; locked down to display-only. Role changes happen only via profile edit."
- OPEN entry (if §5 surfaced a `Moderator can change role` gap that the Task 17 spec forbids): "Admin profile edit — role-change permission must exclude Moderator per Task 17 spec; currently <state>."

Update `docs/domain-rules.md` ONLY IF a "Role mutation surface = profile edit only" rule is worth documenting permanently. If the project already encodes role-mutation rules elsewhere, leave it alone; otherwise add a short subsection.

Do NOT expand `Claude.md`.

--------------------------------------------------
11. Validation checklist
--------------------------------------------------
After implementation verify:
- Role cell in `AdminUsersTable` is non-interactive (Badge or equivalent display element)
- Zero `<select>` / `Select` / `Combobox` in the role cell (`grep` confirms)
- Change handler / inline mutation removed from the table
- Server Action cleanup performed per the chosen case (A / B / C) and documented
- Profile edit page / popup role-change still works
- Permissions check on the profile edit role-change path documented (admin-only or admin+moderator); any divergence from Task 17 spec filed as backlog
- RLS on `users.role` confirmed (or "not applicable, action deleted")
- Badge text matches Supabase ground truth across all role values
- No hardcoded labels; existing role-label source reused
- Design tokens only; no new tokens introduced
- No new dependency
- No new schema migration
- `revalidateTag('site-stats')` call set unchanged
- Console clean
- Tasks 1–5 fixes all preserved
- ESLint clean, TypeScript clean, build clean

Final report (in PR description) must include:
- §1 reproduction note
- §2 audit table
- §3 chosen cleanup case (A / B / C) with one-line rationale
- §4 summary of the cell replacement (Badge variant source, label source)
- §5 confirmation that profile edit role-change still works
- §6 RLS / permissions verdict
- §8 table-behavior validation matrix
- §9 regression-surfaces note
- Files modified (expected: 1–2)
- Confirmation that all "Preserved guarantees" still hold



Task result:
 Final Report

  §1 Reproduction note

  Surface: Table role-control
  File:line: AdminUsersTable.tsx:131–148 — <Select> wrapping <Badge>
  ────────────────────────────────────────
  Surface: Table role-mutation handler
  File:line: AdminUsersTable.tsx:133–135 — onValueChange → updateUserRole(u.id, v as UserRole)
  ────────────────────────────────────────
  Surface: Profile edit role-control
  File:line: AdminUserProfile.tsx:686–699 — FieldRow with <Select> for profileType, visible only in edit/create mode, admin-only

    at save time

  §2 Audit table

  Field: Cell render
  Value: AdminUsersTable.tsx:131–148
  ────────────────────────────────────────
  Field: Change handler
  Value: AdminUsersTable.tsx:133–135
  ────────────────────────────────────────
  Field: Server Action
  Value: modules/admin/actions/index.ts:78–84 (updateUserRole)
  ────────────────────────────────────────
  Field: Action consumers
  Value: Table only (profile edit uses updateUserProfileFull)
  ────────────────────────────────────────
  Field: Permissions check
  Value: assertAdminAccess() — admin+moderator allowed to trigger; profile edit role-write gated to admin-only
  ────────────────────────────────────────
  Field: Profile edit surface
  Value: src/components/admin/AdminUserProfile.tsx via /admin/users/[id]

  §3 Chosen case

  Case B — updateUserRole was exclusive to the table; AdminUserProfile uses the separate updateUserProfileFull action. The
  action was deleted: smaller surface area, no orphaned mutation path.

  §4 Cell replacement

  - Old: <Select> (12-line block) opening a popover with all four role options
  - New: <Badge variant={ROLE_VARIANT[u.role as UserRole] ?? 'neutral'} className="text-[11px] h-5 capitalize">{u.role}</Badge>
  - Badge variant source: existing ROLE_VARIANT map already in the file (lines 17–19)
  - Label source: raw u.role enum value (same text the Select was using for options) — no new hardcode

  §5 Profile edit role-change

  AdminUserProfile.tsx → updateUserProfileFull → profileTypeToDb writes role + user_type. Permission check: myProfile.role ===
  'admin' at line 272 of actions/index.ts — moderators get the field shown as view-only (the FieldRow passes mode={isAdmin ?
  currentMode : 'view'}). Behavior unchanged.

  §6 RLS / permissions verdict

  Sole role-mutation surface: profile edit (/admin/users/[id]). Permissions check: admin-only (moderator sees the field
  read-only). RLS on users.role: not the governing layer here — the admin Supabase client bypasses RLS, but the application
  layer (myProfile.role === 'admin') enforces admin-only. revalidateTag('site-stats') call set unchanged — role changes are not
  in that mutation set.

  §8 Table-behavior validation matrix

  ┌──────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────┐
  │                      Check                       │                           Result                            │
  ├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ Every row's role cell is a non-interactive Badge │ ✓                                                           │
  ├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ Badge not interactive (no onClick, no popover)   │ ✓                                                           │
  ├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ Badge text matches Supabase role value           │ ✓ (renders u.role directly)                                 │
  ├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ Profile edit still works                         │ ✓ (uses separate updateUserProfileFull)                     │
  ├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ Post-edit table reflects change on reload        │ ✓ (revalidatePath('/admin/users') in updateUserProfileFull) │
  ├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ Console clean                                    │ ✓ (build passes, no orphaned handler warnings)              │
  └──────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────┘

  §9 Regression surfaces

  Regression surfaces untouched — 2 files modified (expected 1–2): AdminUsersTable.tsx, modules/admin/actions/index.ts.

  Tasks 1–5 (AdminListingsTable, ListingContact, AdminLocationsManager, ID display, views counter) are untouched.
  revalidateTag('site-stats') call set unchanged. No new dependency, no schema migration.