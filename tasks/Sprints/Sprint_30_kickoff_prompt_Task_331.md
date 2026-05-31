# Sprint 30 — Task 331 kickoff (Opus) — Admin Permissions Role Model Contract v1 + Sonnet fix sub-task

> **You are Opus 4.7 orchestrator / architect / reviewer.** Planning + spec only. Allowed: `docs/`, `tasks/Epics/`, `tasks/Sprints/`. Forbidden: `src/`, `messages/`, migrations, scripts. Single-writer git (Opus never runs git).
>
> **Numbering:** Task 331 = Opus architectural in Sprint 30 (renumbered from old "330"). Sonnet sub-task consumes next free number ≥ 343. Wave 2.
>
> **Source:** `issues.md` 2026-05-31 — "Create Admin Permissions Role Model Contract v1 + produce Sonnet fix task".

```
Type:     architecture / UX / admin / RBAC
Priority: high
Area:     docs/admin-permissions-role-model-contract.md (NEW)
          docs/rule-index.md (UPDATE)
          docs/backlog.md
          tasks/Sprints/Sprint_30_kickoff_prompt_Task_<NEXT_FREE>.md (NEW Sonnet sub-task ≥ 343)
          docs/sessions/2026-05-31-task-331-admin-permissions-role-model-contract.md
```

## Pre-read

1. `docs/agent-contract.md` (always)
2. `docs/orchestrator-role.md`
3. `docs/backlog.md` (always)
4. `docs/ai-behavior.md` → Notes 14 / 19 / 20 / 21 / 22
5. `docs/ui-rules.md` (§0 + §15 + §16 + §17)
6. `docs/component-rules.md` + `docs/component-governance.md` §1 + §11
7. `docs/admin-ux-rules.md` (§1–§14)
8. `docs/rls-rules.md` + `docs/data-access-rules.md`
9. `docs/qa-rules.md`
10. `src/app/admin/permissions/page.tsx`
11. `src/components/admin/AdminPermissionsManager.tsx`
12. `src/modules/admin/actions/permissions.ts`
13. `src/components/admin/AdminSidebar.tsx` (route guards)
14. `docs/sessions/2026-05-28-task-250-r3a-role-permissions-hardening.md` + `docs/sessions/2026-05-24-task-197-rbac.md`
15. `messages/{sq,en,uk,it}.json` — `admin.permissions.*`

## Owner-reported problem

On the admin "Дозволи" page:
- Header: "0 з 10 дозволено".
- Role block: "АДМІНІСТРАТОР" with "Повний доступ (не налаштовується)".
- Toggle click → toast "Привілей вже надано". Toggle does not visually flip. Count stays 0/10.

**Root-mismatch hypothesis:** UI count uses **explicit stored** rows in `role_permissions`; admin "full access" is implemented by **code-level role bypass** (`role === 'admin'` short-circuit). The two sources disagree.

## Current behavior to preserve (Notes 20 / 22)

Before changing anything, Sonnet sub-task MUST inventory in session log:
- Current roles shown (use real role values; do NOT invent).
- Current permission rows (the 10 keys — list verbatim).
- Current toggles, counts, toasts.
- Current server actions (grant/revoke signatures, "Привілей вже надано" call site).
- Current loading / error state.
- Current sidebar / nav access.
- Current mobile layout.

After change: every existing intended permission key remains represented; admin access preserved; moderator permission management remains available; no route/sidebar permission silently removed.

## Required Opus output (THIS task)

### 1. Canonical doc `docs/admin-permissions-role-model-contract.md`

Sections (per `issues.md`):

1. Purpose
2. Current problems (root-cause confirmation from investigation)
3. Current architecture summary
4. **Canonical terminology** (4 terms):
   - **Explicit permission** — stored row in `role_permissions`.
   - **Inherited / default** — granted by role definition; no stored row.
   - **Effective** — final value from `effective(role, key)` = `(systemFullAccess) || (¬explicitDeny ∧ (explicitAllow || roleDefault))`. **Single source of truth used by guards AND UI.**
   - **System-protected** — cannot be edited because role requires it.
5. Role model (use real project values; document each).
6. Permission key inventory (10 keys; list verbatim from code).
7. Effective calculation pseudocode.
8. **Admin full-access policy**:
   - Count: "Повний доступ" OR "10 з 10 дозволено" (NEVER "0 з 10").
   - Toggles: replaced by locked/checked read-only state + tooltip.
   - No grant/revoke mutation fires on click for system-full-access role.
   - No "Привілей вже надано" toast on visible-off toggle (toggle MUST NOT look off when effective=true).
9. **Moderator configurable policy**:
   - Toggles reflect `effective(moderator, key)`.
   - Grant persists explicit-allow row.
   - Revoke removes explicit-allow OR adds explicit-deny (Opus picks; recommend allow-only for MVP).
   - Count updates immediately; persists after refresh.
   - Failed mutation reverts optimistic state + localized toast.
10. UI state model per row (allowed-editable / denied-editable / inherited-allowed / locked-system-allowed / loading / error).
11. Toggle behavior contract per state.
12. Count behavior contract (formula).
13. Toast / error behavior contract (all localized).
14. **Route / sidebar guard alignment**: sidebar guards MUST call the same `effective()` helper; server actions MUST re-check server-side.
15. Localization sq/en/uk/it.
16. Responsive 14-width canon (320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560).
17. Accessibility.
18. Security (server-side authorization; no privileged endpoint exposure; admin self-lockout prevention).
19. MVP Sonnet fix scope.
20. Deferred follow-up.

### 2. Sonnet sub-task kickoff (Opus must write to file ≥ 343)

Title: `Task <NEXT_FREE> — Sonnet: Fix admin permissions effective-state UI + moderator-permission management`.

The Sonnet sub-task kickoff MUST follow the Canonical Task Template and MUST include ALL of:
- Pre-read
- Current behavior to preserve
- Required after behavior
- **Positive flow (happy path)** — explicit section
- **Negative flow (every off-happy-path branch)** — explicit section: cancel/dismiss, server error, permission-denied, locale mismatch, network offline, double-submit
- Implementation requirements
- Acceptance criteria (each bullet cites Positive or Negative flow)
- Out of scope
- Validation (pnpm tsc / pnpm build / pnpm lint)
- Manual QA
- Final report

**Recommended MVP scope (for sub-task):**
- Implement `effective(role, key)` as shared server+client helper (single source of truth — Note 14).
- Wire `AdminPermissionsManager` to compute count + per-row state from `effective()`.
- `role = 'admin'`: full-access banner + locked rows; NO grant/revoke on click; NO misleading toast.
- `role = 'moderator'`: editable toggles; grant/revoke wired; optimistic count update; persist after refresh; revert on error.
- Server actions enforce server-side: `(currentUser.role === 'admin' || currentUser.hasPermission('settings.manage'))` AND `targetRole !== 'admin'` (admin permissions immutable).
- Sidebar guards switch to same `effective()` helper.
- Localize sq/en/uk/it (existing `admin.permissions.*` namespace).
- Verify all 14 canonical widths × 4 locales.

**Explicit test expectations in Sonnet AC** (per owner comment on Task 331):
- Admin → locked checked rows; click → NO mutation, NO "Привілей вже надано".
- Moderator → grant a permission, toggle flips, count increments, persists after refresh.
- Moderator → revoke same permission, toggle flips back, count decrements, persists.
- Sidebar guard hides admin-only sidebar entry when `effective(moderator, '<sidebar key>')` is false.

### 3. Session log + backlog update + rule-index pointer to new contract doc

Standard.

## Required investigation

1. Read all Area files end-to-end. Document data flow.
2. Run:
   ```
   rg -n "permission|permissions|privilege|privileges|role_permissions|user_permissions|Дозволи|дозволено|Привілей|already granted|grant|revoke|moderator|admin|administrator|settings.manage|effective|hasPermission" docs tasks src messages
   ```
3. Confirm real role values (do NOT invent).

## Acceptance criteria for THIS Opus task

- Investigation findings + root-cause documented.
- Canonical terminology + role model defined.
- Admin full-access + moderator configurable policies specified.
- Effective calculation + count + toggle + toast contracts specified.
- Route/sidebar guard alignment specified.
- Security constraints specified.
- Localization sq/en/uk/it required.
- 14-width canon required.
- Sonnet sub-task kickoff file written (with ALL canonical sections enumerated above).
- `docs/rule-index.md` updated to reference the new contract.
- `docs/backlog.md` updated.
- Session log created.
- NO `src/` / `messages/` / migration changes by Opus.

## Out of scope

- Do NOT implement code.
- Do NOT invent custom-role builder beyond existing.
- Do NOT merge with Tasks 332 / 338 / other Sprint 30 tasks.
- Do NOT change real permission enforcement without Sonnet sub-task.

## Validation

```
rg -n "permission|role_permissions|effective|hasPermission" docs tasks src messages
git status --short        # read-only; Opus never mutates
```

## Final report

1. Files Changed table.
2. Current architecture summary.
3. Root-cause confirmation.
4. Admin + moderator policies summary.
5. Effective calculation summary.
6. Count + toggle + toast contracts summary.
7. Sonnet sub-task number + file path.
8. Confirmation no `src/` / `messages/` / DB changes.
9. Ready-to-run explicit-path `git add` + `git commit` commands for owner.
