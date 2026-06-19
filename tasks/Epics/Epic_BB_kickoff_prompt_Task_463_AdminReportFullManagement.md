# Task 463 — Full admin report management: free status change · reopen · close · HARD delete

> **Epic BB — Listing Inquiries: Report & Message.** Follows Task 462 (owner-row cleanup). Executor: **Sonnet 4.6**.
> Orchestrator (Opus) reviews the real diff + emits commits. **Do not run git yourself.**
> **Owner directive (2026-06-18):** a user with role **`admin`** must be able to fully manage reports —
> reopen a closed/resolved report, change a report's status freely, close/resolve it, and **hard-delete** it from the DB.
> All four privileged powers are enforced **server-side (capability/permission guard, NOT just UI hiding).**
>
> **🔴 Permission-model revision (owner decision 2026-06-19) — READ FIRST.** The new powers are **capability-gated and
> delegable via the existing "Дозволи" admin UI (`AdminPermissionsManager`)**, exactly like every other `PermissionKey`:
> **admin holds them automatically; moderator does NOT by default, but an admin MAY grant them to moderator in Дозволи.**
> There is NO "hard admin-only / unseedable" key in this system — `AdminPermissionsManager` renders a moderator toggle for
> EVERY entry in `PERMISSION_KEYS` and `setModeratorPermission` accepts any key. Therefore: (a) the server guards check
> `hasPermission(key)` (capability), never a raw `isAdmin` role check; (b) the UI shows each control to whoever holds the
> capability (so a granted moderator sees it too) — UI gating is UX only, the server action is the boundary; (c) every new
> key REQUIRES `keys.<slug>` + `descriptions.<slug>` i18n entries in all four locales or the Дозволи page renders a raw
> key / MISSING_MESSAGE (the exact bug class Task 462 just fixed).

## Pre-read (`docs/rule-index.md` → "Admin control" + "DB / server action / RLS" bundles + always-required)

- `docs/agent-contract.md` (clauses 1–15) · `docs/backlog.md` · `docs/critical-flow-registry.md` → **"Report listing" row** (clause 15 applies — add/extend regression tests; cannot close without automated proof old behavior still works)
- `docs/design-system.md` → §25 (control-preservation), **§26 (mobile <640 full-width + bottom-sheet gate)**, §24 (forbidden hardcodes)
- `docs/ui-rules.md` · `docs/component-rules.md` · `docs/component-governance.md` (canonical confirm/AlertDialog pattern) · `docs/qa-rules.md`
- `docs/data-access-rules.md` · `docs/rls-rules.md` → **"RLS-Change Test Requirement"** + `docs/qa-rules.md` → **"Actionable Error-Toast Rule"** (Task 436) · `docs/domain-rules.md`
- `docs/ai-behavior.md` → Notes 18, 19, 20, 22, 23

## Design decisions already made by the owner (do NOT re-decide; STOP & ASK only on the flagged ambiguities)

1. **Delete = HARD delete.** The row is permanently removed from `public.listing_reports`. Not soft-delete, not a status flag.
2. **Delete is capability-gated** (`reports.delete`), enforced **server-side** (`hasPermission('reports.delete')` in the action), not merely by hiding the button. Admin holds it by default; a moderator holds it only if granted in Дозволи.
3. **Free any→any status + reopen is capability-gated** (`reports.status_override`), admin-only by default, delegable to moderator via Дозволи. A holder can move a report from any status to any valid status (`pending`/`reviewed`/`resolved`/`dismissed`), including reopening a terminal (`resolved`/`dismissed`) report back to `pending`/`reviewed`.
4. **Moderator keeps the EXISTING `reports.manage` forward-on-open transitions** — the ALLOWLIST `pending → {reviewed, resolved, dismissed}` and `reviewed → {resolved, dismissed}`. **⚠️ This is a deliberate TIGHTENING, not "preserve current code":** the current action imposes NO transition restriction, so a `reports.manage` holder can today set ANY status. After this task a `reports.manage`-only holder is restricted to the allowlist; every other (non-noop) transition — `reviewed → pending`, terminal↔terminal (`resolved ↔ dismissed`), and reopen — requires `reports.status_override`. Do NOT describe the moderator path as "byte-for-byte preserved"; the allowlist transitions behave identically, but the out-of-allowlist transitions are now gated. Tests must assert BOTH (allowlist still works under `reports.manage`; out-of-allowlist denied without `reports.status_override`).
5. **Delete requires a confirmation dialog** before it fires.
6. After a successful delete, the report disappears from the list **without a full page reload** (optimistic state removal, like the existing status-update flow).
7. **"Close"** is satisfied by the existing terminal transitions (`resolved` / `dismissed`). **Do NOT add a new `ReportStatus` enum value** (no `closed`) unless the orchestrator approves a separate schema task.

## What already exists (read before changing)

- `updateReportStatusAction(reportId, newStatus, notes)` in `src/modules/listings/actions/reportListing.ts`: already validates status, gates on `hasPermission('reports.manage')`, updates via the **service-role `createAdminClient()`**, and logs to `report_actions` (actor, old/new status). It currently imposes **no transition restriction** — any `reports.manage` holder can already set any status. The allowlist boundary + the `reports.status_override` gate must therefore be ADDED at the server.
- `roleHasPermission` (`src/lib/auth/permissions.ts`): **admin returns true for every key**; moderator only gets keys with an `allowed` row in `role_permissions`. So a new key defaults to OFF for moderator. **But it is NOT "admin-only forever":** `AdminPermissionsManager.tsx` maps over ALL `PERMISSION_KEYS` and renders a moderator Switch per key, and `setModeratorPermission(key, value)` (`src/modules/admin/actions/permissions.ts`) accepts ANY `PermissionKey` with no exclusion list — so an admin can grant the new keys to a moderator in Дозволи. The cited `users.hard_delete` precedent works exactly this way (a delegable, default-OFF Дозволи toggle), NOT an unseedable key. Gate the server actions on `hasPermission(key)` so a granted moderator is actually empowered both in UI and server.
- `PERMISSION_KEYS` (`src/lib/auth/permissionKeys.ts`): currently `listings.delete`, `listings.set_premium`, `users.create`, `users.change_role`, `users.soft_delete`, `users.hard_delete`, `locations.manage`, `settings.manage`, `legal.manage`, `reports.manage`, `audit.clear_history`. Add the new key(s) here.
- `AdminPermissionsManager.tsx` renders each key's label via `t('admin.permissions.keys.<slug>')` and `t('admin.permissions.descriptions.<slug>')`, where `<slug> = key.replace('.', '_')`. **Adding a key WITHOUT these i18n entries breaks the Дозволи page.**
- The detail dialog (`ReportDetailDialog` in `AdminReportsManager.tsx`) currently shows status-change buttons **only when status is `pending` or `reviewed`**; for `resolved`/`dismissed` it shows only a "Close" button. There is **no reopen and no delete** today.

## Required after-behavior

### Server actions (`src/modules/listings/actions/reportListing.ts`)

1. **Allowlist + capability-gated status guard.** In `updateReportStatusAction`, after the existing `invalid_status` validation, classify the transition:
   ```
   const MODERATOR_ALLOWED = {
     pending:  ['reviewed', 'resolved', 'dismissed'],
     reviewed: ['resolved', 'dismissed'],
   }
   const isNoop = oldStatus === newStatus
   const isModeratorAllowed = !isNoop && MODERATOR_ALLOWED[oldStatus]?.includes(newStatus)
   ```
   - If `isModeratorAllowed` → require `hasPermission('reports.manage')` (existing behavior, byte-for-byte for these transitions).
   - Else (any non-noop transition NOT in the allowlist — incl. `reviewed → pending`, `resolved ↔ dismissed`, and any terminal → `pending`/`reviewed` reopen) → require `hasPermission('reports.status_override')`. Admin passes automatically; a `reports.manage`-only moderator is denied (`forbidden`); a moderator granted `reports.status_override` passes.
   - Decide the `isNoop` (same→same) handling explicitly: treat as `invalid_status` (no write) unless the current code already no-ops it — match existing behavior and state which in the log.
   - Keep the `report_actions` audit-log write for every status change (including reopen). Emit `console.error` + typed error keys on failure (Task 436 actionable-error rule). On permission failure → `return { error: 'forbidden' }` (do NOT throw to the client).
2. **`deleteReportAction(reportId)`** — new action. Gate on `hasPermission('reports.delete')`. If not permitted → `return { error: 'forbidden' }` (do NOT throw). If unauthenticated → `return { error: 'unauthorized' }`. Use the service-role `createAdminClient()`. **Hard-delete** the `listing_reports` row. Handle the `report_actions` FK: if `report_actions.report_id` references `listing_reports.id` **without `ON DELETE CASCADE`**, the raw delete will fail — either (a) delete dependent `report_actions` rows first in the same action, or (b) add an `ON DELETE CASCADE` migration. **Verify the actual FK in the schema and pick the correct path; both the FK situation AND whether deleting the audit rows conflicts with audit-retention policy are STOP & ASK triggers (see below).** On a missing/already-deleted row → `return { error: 'not_found' }` (do NOT return `{}` for a missing row — a no-op would let the UI show a false success). **Implement missing-row detection explicitly** — a bare Supabase `.delete().eq('id', reportId)` does not clearly signal that no row matched, so use a count-/return-aware path (e.g. `.delete().eq('id', reportId).select('id')` and treat an empty result as `not_found`) so an already-deleted report can never return a false success. On DB error → `console.error('[deleteReport] …', error)` + `return { error: 'save_failed' }`. On success → `return {}`.
3. Do NOT weaken `reportListingAction` (submission) or the reporter-notification path.

> **STOP & ASK triggers (clause 2):** (a) the report's `report_actions` audit rows would be removed — whether by an **explicit dependent-delete OR by an existing `ON DELETE CASCADE`** — and the audit-retention policy does NOT explicitly permit disposing of audit history for deleted reports. Cascade can silently erase audit history exactly like a manual delete, so document the FK/cascade situation and STOP & ASK unless retention is explicitly disposable for deleted reports; (b) a confirm/AlertDialog canonical primitive does not already exist. *(The "is moderator seeded?" question is RESOLVED: keys default OFF, delegable via Дозволи — no seed, no exclusion.)*

### Permission catalog (`src/lib/auth/permissionKeys.ts` + i18n)

- Add **`reports.status_override`** and **`reports.delete`** to `PERMISSION_KEYS`. Do **not** seed them for moderator (admin holds them automatically; admin may grant via Дозволи).
- **MANDATORY i18n (or the Дозволи page breaks):** add `keys.reports_status_override`, `descriptions.reports_status_override`, `keys.reports_delete`, `descriptions.reports_delete` under the `admin.permissions` namespace in **all four** `messages/{sq,en,uk,it}.json`, with the same key set. Verify `check:i18n` is green and that the Дозволи page renders the two new toggles with localized label + description (no raw key / MISSING_MESSAGE) in every locale.
- If the project maintains a permission-seed/registry doc or SQL, update it consistently and provide idempotent SQL in the session log (Task 243/246/460 pattern) — do not assume auto-migration. (No moderator seed row is created; the new rows only ever exist if an admin toggles them in Дозволи.)

### Admin UI (`src/components/admin/AdminReportsManager.tsx`)

Determine the viewer's capabilities **server-side** and thread them as explicit props — **NOT a raw `isAdmin` flag** (a raw `isAdmin` would wrongly hide the controls from a moderator the admin granted the key to). The admin reports **page** server component computes and passes:
- `canOverrideReportStatus = await hasPermission('reports.status_override')`
- `canDeleteReports = await hasPermission('reports.delete')`

If the page does not already provide a clean place to compute these, STOP & ASK how to thread them. UI gating is UX only; the server actions remain the boundary.

When `canOverrideReportStatus` is true, `ReportDetailDialog` exposes, for a report in ANY status — pin the exact form (so review is not subjective):
- a **status `Select`** listing all four statuses + an **Apply** button that calls `updateReportStatusAction(reportId, selectedStatus, notes)` (free any→any);
- a dedicated **Reopen** quick-action shown on terminal (`resolved`/`dismissed`) reports that calls `updateReportStatusAction(reportId, 'pending', notes)`;
- the existing review/dismiss/resolve actions remain available where currently shown (open reports).

When `canDeleteReports` is true, the dialog also exposes a **Delete** action (destructive styling) that opens a **confirmation dialog** (canonical `AlertDialog`/`Dialog`, full-width bottom sheet at <640). Confirm → calls `deleteReportAction`; on success the report is removed from the list state (no full reload) and the detail dialog closes with a success toast; Cancel → closes the confirm only, nothing deleted.

When a capability is false, its control is not rendered (a `reports.manage`-only moderator sees today's behavior: review/dismiss/resolve for open reports; "Close" for terminal; no reopen, no free-status, no delete).

All new strings via `t()` with **sq/en/uk/it** parity. No hardcoded user-facing text.

## Positive flow (happy path)

- **Capable viewer changes status:** open report dialog → pick a new status in the `Select` (e.g. `reviewed`→`resolved`) → Apply → `updateReportStatusAction` passes the allowlist/`reports.status_override` classification → toast success → list row reflects new status, no reload → `report_actions` row written.
- **Capable viewer reopens:** open a `resolved` report → Reopen → `updateReportStatusAction(reportId, 'pending', notes)` is classified out-of-allowlist → passes `hasPermission('reports.status_override')` → status back to `pending`, audit logged, list updates.
- **Capable viewer deletes:** open report → Delete → confirm dialog → Confirm → `deleteReportAction` passes `hasPermission('reports.delete')` → removes the row → detail+confirm dialogs close → report gone from the list without reload → success toast.
- **Delegation case:** an admin grants `reports.status_override` (and/or `reports.delete`) to moderator in Дозволи → that moderator now passes the same server guards and sees the same controls.

## Negative flow (every off-happy-path branch — each needs a verifiable handler/guard/test)

- **`reports.manage`-only moderator attempts an out-of-allowlist transition** (`reviewed → pending`, `resolved → dismissed`, `dismissed → resolved`, or reopen `resolved → pending`): server classifies it out-of-allowlist → `hasPermission('reports.status_override')` false → `forbidden`. **Server tests prove this for each case** (UI-hide is not the boundary). Toast = `error_forbidden`/equivalent if somehow invoked.
- **`reports.manage`-only moderator attempts delete:** `deleteReportAction` → `hasPermission('reports.delete')` false → `forbidden`; server test proves it. No row deleted.
- **Moderator WITH the key granted:** passes (covered as a positive delegation case) — assert the guard reads the capability, not a role string.
- **Unauthenticated:** both actions → `unauthorized`.
- **Report not found / already deleted (double-submit):** `deleteReportAction` on a missing id → `not_found` + toast; no crash; idempotent.
- **DB/FK error on delete:** `console.error` logged, typed `save_failed` returned, toast shown, row stays in the list.
- **Confirm dialog cancel / Esc / backdrop:** nothing deleted; returns to detail dialog.
- **Invalid status / same→same noop:** `invalid_status` (per existing guard / decision above) — no write.
- **Network offline / pending:** action buttons disabled during the transition (`isPending`), no double fire.
- **Locale:** every toast/label/confirm string AND the two new Дозволи `keys.*`/`descriptions.*` resolve in sq/en/uk/it (no raw keys).

## Mobile <640 full-width gate (OWNER P0)

- The new **status `Select` + Apply**, **Reopen** button, **Delete** button, and the **confirmation dialog** must all be **full-width at `max-sm`** (controls `max-sm:w-full`; the `Select` dropdown AND the confirm dialog are full-width bottom sheets via the canonical primitives — drag-handle, ≥90dvh internal scroll, close on backdrop + Esc). Action rows use `flex-wrap`/full-width at <640. ≥44px touch targets. Labels wrap in all 4 locales. No h-scroll at 320. Spell out the exact `max-sm` classes — no "make it responsive".
- The two new rows on the **Дозволи** matrix are an existing surface (+2 rows); confirm they still render full-width with wrapping labels at <640 in all 4 locales (no regression, no clip).

## Regression coverage (clause 15 — MANDATORY, "Report listing" critical flow)

Baseline first: record that the existing report tests pass before the change. Then ADD:
- **Server-action tests** (`src/modules/listings/actions/__tests__/` — new `deleteReport.smoke.test.ts` + status-guard cases): capable viewer delete → row delete invoked + `{}`; **`reports.manage`-only moderator delete → `forbidden`, no delete call**; **moderator WITH `reports.delete` granted → delete invoked** (delegation); unauthenticated → `unauthorized`; missing row → `not_found`; DB error → `console.error` + `save_failed`. Status guard: allowlist transition under `reports.manage` passes; **each out-of-allowlist transition (`reviewed→pending`, `resolved→dismissed`, terminal→pending reopen) by a `reports.manage`-only moderator → `forbidden`**; same transitions with `reports.status_override` granted → pass; audit row written on every successful change. Include a **planted-violation transcript** (e.g. drop the `reports.status_override` classification so the out-of-allowlist guard always passes → the "moderator forbidden" cases FAIL; restore → PASS).
- **UI tests** (`AdminReportsManager.smoke.test.tsx`): `canOverrideReportStatus`/`canDeleteReports` true → status `Select` + Reopen + Delete render; both false → none render (control visibility is **capability-prop driven**, asserted explicitly). Confirm dialog gates the delete; confirm → report removed from rendered list AND **assert `router.refresh`/`window.location` are NOT called** (no full reload) — mock them and assert zero calls + local state removal; cancel/Esc/backdrop → still present.
- **Дозволи i18n:** assert (or rely on green `check:i18n` + a render check) that the two new keys show localized label/description in all four locales — no raw key / MISSING_MESSAGE.
- Update the `docs/critical-flow-registry.md` "Report listing" row: add Task 463 coverage (admin/capable full management + hard delete + allowlist/`reports.status_override` classification + `reports.delete`), command(s), and the planted-violation note.

## Scope

**Allowed:** `src/components/admin/AdminReportsManager.tsx`; `src/modules/listings/actions/reportListing.ts`; `src/lib/auth/permissionKeys.ts`; the admin reports **page** server component (to compute + thread `canOverrideReportStatus`/`canDeleteReports`; name it in the log; STOP & ASK before widening); `src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx`; new server-action test file(s); `src/components/admin/AdminReportsManager.stories.tsx`; `messages/{sq,en,uk,it}.json` (report controls + the two new `admin.permissions.keys.*`/`descriptions.*`); migration/seed SQL file if FK-cascade is required (provide idempotent SQL in the session log); `docs/critical-flow-registry.md` / `docs/backlog.md` / `docs/sessions/` / `docs/rls-rules.md` (RLS-change test note).

**Do NOT touch:** report submission flow behavior, the reporter-notification email/in-app path, public listing UI, unrelated admin surfaces, middleware, the Task 462 owner-row cleanup (assume it landed), and the `AdminPermissionsManager` component logic itself (it auto-renders the new keys — only the i18n entries are added). **Do not add a new `ReportStatus` enum value.** **Do not emit git commands.**

## Acceptance criteria (each maps to a flow + verifiable in the diff)

1. A holder of `reports.status_override` can set any report status from any status, incl. reopen terminal→pending; a `reports.manage`-only moderator keeps ONLY the allowlist (`pending→{reviewed,resolved,dismissed}`, `reviewed→{resolved,dismissed}`) and is denied every out-of-allowlist transition — *server diff + tests*.
2. Free status-override + hard delete are **capability-gated server-side via `hasPermission`** (admin by default, delegable in Дозволи); a `reports.manage`-only moderator is denied at the server, and a granted moderator is allowed (both proven by tests, not UI-hide) — *negative + delegation tests + planted-violation transcript*.
3. `deleteReportAction` hard-deletes the `listing_reports` row (FK handled), returns `not_found` for a missing row, and logs `console.error` + typed `save_failed` on DB failure — *diff:line + test*.
4. Delete is fronted by a confirmation dialog; confirm removes the report from the list **without full reload** (`router.refresh`/`window.location` asserted NOT called); cancel/Esc/backdrop does nothing — *positive + negative flows + UI test*.
5. New keys (`reports.status_override`, `reports.delete`) added to `PERMISSION_KEYS`; their `admin.permissions.keys.*`/`descriptions.*` + all report-control strings have sq/en/uk/it parity; no raw keys; Дозволи page renders both toggles localized; `check:i18n` green.
6. UI control visibility is driven by the `canOverrideReportStatus`/`canDeleteReports` capability props (not `isAdmin`) — *UI test asserts both true→shown, both false→hidden*.
7. Mobile <640 gate satisfied for all new controls + the confirm dialog + the Дозволи new rows, with the rendered matrix (uk@320/375/390) in the log.
8. Gates green: `tsc --noEmit`=0; `check:i18n`; `check:stories`; the new vitest suites; `screenshots:assert`; file-integrity (clause 14) on every touched file. Idempotent SQL (if any) pasted for owner apply.

## Hard contract (verified against the diff)

No scope creep; no invented architecture (use the STOP & ASK triggers); literal AC; self-validation block + AC-by-AC table; UX-flow + control-preservation before/after inventory; both positive AND every negative branch implemented with the correct typed error/locale key; **"Files Changed" table**; do NOT run or emit git. Security boundary is the **server action via `hasPermission`**, never UI hiding or a role-string check.
