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

> **🔁 RE-EXECUTION after Task 464 (owner directive 2026-06-19) — READ.** Task 464 landed and COMMITTED (`5c2edabae`) the
> repaired Storybook rendered-proof gate (`scripts/check-stories-rendered.mjs`): a 5-layer fail-closed system
> (loader-only / blank-canvas / empty-canvas / blank-screenshot via `sharp` / anchor-missing, rendered-proof BEFORE the
> visual gates). **That committed gate already enumerates this task's stories and semantic anchors** (`ASSERT_STORIES`
> rows for `admin-adminreportsmanager--full-management/terminal-reopen/delete-confirm-mobile-{320,375,390}` and
> `admin-adminpermissionsmanager--{default,mobile-320,375,390}`). Therefore: this is a clean re-execution, but the
> implementation MUST converge EXACTLY on the story IDs + anchor `data-testid`s pinned in the **"Storybook rendered-proof
> contract"** section below — renaming an export or a testid will break the already-committed gate (anchor-missing). Treat
> THIS kickoff as the single source of truth; do not assume any prior partial 463 attempt in the working tree is correct —
> bring the implementation to exactly this spec. The prior intermingled overflow fix (`overflow-x-auto` on the filter tab
> bar + `px-3 sm:px-5` responsive table padding) IS required and belongs to THIS task (it left 464's commit deliberately).
> **A `data-testid` is an attribute-only anchor — it must NOT change layout/className/DOM structure beyond adding the attribute.**

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
8. **Audit-retention for a hard-deleted report — RESOLVED (owner decision 2026-06-19), NOT a STOP & ASK.** For a HARD-deleted report, dependent `report_actions` rows may be removed as part of deleting that report, whether by explicit dependent delete or by FK cascade. This is acceptable for this product because hard delete means the report and its report-specific audit trail are intentionally disposed. Sonnet must still document the actual FK shape and the chosen implementation path, but this audit-retention question is **resolved and is NOT a STOP & ASK trigger** — UNLESS the schema reveals a broader/shared audit-table impact beyond this report's own `report_actions` (e.g. the delete would cascade into a shared, cross-entity audit table), in which case STOP & ASK.

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
2. **`deleteReportAction(reportId)`** — new action. Gate on `hasPermission('reports.delete')`. If not permitted → `return { error: 'forbidden' }` (do NOT throw). If unauthenticated → `return { error: 'unauthorized' }`. Use the service-role `createAdminClient()`. **Hard-delete** the `listing_reports` row. Handle the `report_actions` FK: if `report_actions.report_id` references `listing_reports.id` **without `ON DELETE CASCADE`**, the raw delete will fail — either (a) delete dependent `report_actions` rows first in the same action, or (b) add an `ON DELETE CASCADE` migration. **Verify the actual FK in the schema and pick the correct path. The report-specific `report_actions` audit-retention question is already RESOLVED by owner decision #8 and is NOT a STOP & ASK trigger. STOP & ASK only if the schema reveals deletion/cascade into a broader or shared audit table beyond this report's own `report_actions`.** On a missing/already-deleted row → `return { error: 'not_found' }` (do NOT return `{}` for a missing row — a no-op would let the UI show a false success). **Implement missing-row detection explicitly** — a bare Supabase `.delete().eq('id', reportId)` does not clearly signal that no row matched, so use a count-/return-aware path (e.g. `.delete().eq('id', reportId).select('id')` and treat an empty result as `not_found`) so an already-deleted report can never return a false success. On DB error → `console.error('[deleteReport] …', error)` + `return { error: 'save_failed' }`. On success → `return {}`.
3. Do NOT weaken `reportListingAction` (submission) or the reporter-notification path.

> **STOP & ASK triggers (clause 2):** (a) **only if** deleting this report would cascade/dependent-delete into a **broader or shared audit table beyond this report's own `report_actions`** (cross-entity audit history) — disposing of THIS report's own `report_actions` rows is already RESOLVED as acceptable (decision #8 above) and is NOT a STOP & ASK; still document the actual FK shape and chosen path; (b) a confirm/AlertDialog canonical primitive does not already exist. *(The "is moderator seeded?" question is RESOLVED: keys default OFF, delegable via Дозволи — no seed, no exclusion.)*

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

## Storybook rendered-proof contract (Task 464 gate — MANDATORY, EXACT IDs + anchors)

The committed `scripts/check-stories-rendered.mjs` (`5c2edabae`) already lists the stories and anchors below. Your stories
and components MUST match them **byte-for-byte on export name + testid value**, render REAL content (no loader-only / blank /
empty canvas), expose each anchor AFTER the story's `play` runs, and pass the visual gates (no horizontal overflow at 320,
non-blank bitmap). Do NOT add `parameters.layout: 'centered'|'padded'` (the global `withCanvas`/`fullscreen` decorator must
fill <640); locale is toolbar-reactive (no `globals.locale` pin to a single language); no hardcoded user-facing strings.

**Required `data-testid` anchors in `AdminReportsManager.tsx` (attribute-only — no layout change):**
- root container → `data-testid="admin-reports-manager"`
- the admin status-override block (Select + Apply), rendered when `canOverrideReportStatus` → `data-testid="status-override-section"`
- the Reopen button (terminal reports, when `canOverrideReportStatus`) → `data-testid="reopen-btn"`
- the Delete button (when `canDeleteReports`) → `data-testid="delete-btn"`
- the filter tab bar carries `overflow-x-auto`; table cells use `px-3 sm:px-5` (the no-overflow-at-320 fix — required here).

**Required `data-testid` anchors in `AdminPermissionsManager.tsx`:** root `data-testid="admin-permissions-manager"` and one
`data-testid="perm-row-${key.replace('.', '_')}"` per permission row (so `perm-row-reports_status_override` /
`perm-row-reports_delete` resolve). **These two rows only render if `reports.status_override` + `reports.delete` are in
`PERMISSION_KEYS` (this task) — that is the dependency that makes the committed gate's permission cells pass.** If the
AdminPermissionsManager `data-testid`s / story file already landed under Task 464, do NOT re-add or re-commit them — only
ensure the two new keys exist so the rows (and their anchors) render; if they did NOT land, add them here.

**Required stories — `src/components/admin/AdminReportsManager.stories.tsx`** (`title: 'Admin/AdminReportsManager'`), exact exports → IDs → anchors:

| Export | Story ID | Args | Anchors that MUST resolve after `play` |
|---|---|---|---|
| `FullManagement_Mobile320/375/390` | `admin-adminreportsmanager--full-management-mobile-{320,375,390}` | `canOverrideReportStatus: true, canDeleteReports: true`; `play` opens a pending report's dialog | `admin-reports-manager` + `status-override-section` |
| `TerminalReopen_Mobile320/375/390` | `admin-adminreportsmanager--terminal-reopen-mobile-{320,375,390}` | resolved/terminal fixture, caps true; `play` opens the terminal report | `admin-reports-manager` + `reopen-btn` |
| `DeleteConfirm_Mobile320/375/390` | `admin-adminreportsmanager--delete-confirm-mobile-{320,375,390}` | `canDeleteReports: true`; `play` opens dialog then clicks `[data-testid="delete-btn"]` | `admin-reports-manager` + `delete-btn` |

**Required stories — `AdminPermissionsManager.stories.tsx`** (`title: 'Admin/AdminPermissionsManager'`): `Default`, `Mobile320`,
`Mobile375`, `Mobile390` with fixture permissions/events → IDs `admin-adminpermissionsmanager--{default,mobile-320,375,390}` →
anchors `admin-permissions-manager` + `perm-row-reports_status_override` + `perm-row-reports_delete`. (If already committed by
464, leave as-is; just ensure the keys exist.)

**Proof required in the session log:** run `npm run screenshots:assert` (or `--fast` for 320/375/390 × 4 locales) and paste the
result — every story above PASS with `anchorsFound` matching `anchorsExpected`, non-blank bitmap, no overflow. **A spinner-only
/ blank / anchor-missing cell is a HARD FAIL under the 464 gate — `tsc=0`/`check:stories` is NOT proof.** Include the
uk@320/375/390 matrix. **The orchestrator confirms the diff; the AUTHORITATIVE rendered-proof run is the owner's NATIVE run on
the committed tree** (sandbox is screen-only) — note this in the log so the owner re-runs after commit.

## Regression coverage (clause 15 — MANDATORY, "Report listing" critical flow)

Baseline first: record that the existing report tests pass before the change. Then ADD:
- **Server-action tests** (`src/modules/listings/actions/__tests__/` — new `deleteReport.smoke.test.ts` + status-guard cases): capable viewer delete → row delete invoked + `{}`; **`reports.manage`-only moderator delete → `forbidden`, no delete call**; **moderator WITH `reports.delete` granted → delete invoked** (delegation); unauthenticated → `unauthorized`; missing row → `not_found`; DB error → `console.error` + `save_failed`. Status guard: allowlist transition under `reports.manage` passes; **each out-of-allowlist transition (`reviewed→pending`, `resolved→dismissed`, terminal→pending reopen) by a `reports.manage`-only moderator → `forbidden`**; same transitions with `reports.status_override` granted → pass; audit row written on every successful change. Include a **planted-violation transcript** (e.g. drop the `reports.status_override` classification so the out-of-allowlist guard always passes → the "moderator forbidden" cases FAIL; restore → PASS).
- **UI tests** (`AdminReportsManager.smoke.test.tsx`): `canOverrideReportStatus`/`canDeleteReports` true → status `Select` + Reopen + Delete render; both false → none render (control visibility is **capability-prop driven**, asserted explicitly). Confirm dialog gates the delete; confirm → report removed from rendered list AND **assert `router.refresh`/`window.location` are NOT called** (no full reload) — mock them and assert zero calls + local state removal; cancel/Esc/backdrop → still present.
- **Дозволи i18n:** assert (or rely on green `check:i18n` + a render check) that the two new keys show localized label/description in all four locales — no raw key / MISSING_MESSAGE.
- Update the `docs/critical-flow-registry.md` "Report listing" row: add Task 463 coverage (admin/capable full management + hard delete + allowlist/`reports.status_override` classification + `reports.delete`), command(s), and the planted-violation note.

## Scope

**Allowed:** `src/components/admin/AdminReportsManager.tsx`; `src/modules/listings/actions/reportListing.ts`; `src/lib/auth/permissionKeys.ts`; the admin reports **page** server component (to compute + thread `canOverrideReportStatus`/`canDeleteReports`; name it in the log; STOP & ASK before widening); `src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx`; new server-action test file(s); `src/components/admin/AdminReportsManager.stories.tsx`; `messages/{sq,en,uk,it}.json` (report controls + the two new `admin.permissions.keys.*`/`descriptions.*`); migration/seed SQL file if FK-cascade is required (provide idempotent SQL in the session log); `docs/critical-flow-registry.md` / `docs/backlog.md` / `docs/sessions/` / `docs/rls-rules.md` (RLS-change test note).

**Do NOT touch:** report submission flow behavior, the reporter-notification email/in-app path, public listing UI, unrelated admin surfaces, middleware, the Task 462 owner-row cleanup (assume it landed), and the `AdminPermissionsManager` component **logic** (it auto-renders the new keys — the i18n entries are what's added). **Scope clarification:** if the required `AdminPermissionsManager` anchors (`data-testid="admin-permissions-manager"`, `perm-row-${slug}`) are MISSING (not already landed under Task 464), an **attribute-only** `data-testid` addition in `AdminPermissionsManager.tsx` IS allowed — do not change logic, className, layout, state, or behavior. **Do not add a new `ReportStatus` enum value.** **Do not emit git commands.**

## Acceptance criteria (each maps to a flow + verifiable in the diff)

1. A holder of `reports.status_override` can set any report status from any status, incl. reopen terminal→pending; a `reports.manage`-only moderator keeps ONLY the allowlist (`pending→{reviewed,resolved,dismissed}`, `reviewed→{resolved,dismissed}`) and is denied every out-of-allowlist transition — *server diff + tests*.
2. Free status-override + hard delete are **capability-gated server-side via `hasPermission`** (admin by default, delegable in Дозволи); a `reports.manage`-only moderator is denied at the server, and a granted moderator is allowed (both proven by tests, not UI-hide) — *negative + delegation tests + planted-violation transcript*.
3. `deleteReportAction` hard-deletes the `listing_reports` row (FK handled), returns `not_found` for a missing row, and logs `console.error` + typed `save_failed` on DB failure — *diff:line + test*.
4. Delete is fronted by a confirmation dialog; confirm removes the report from the list **without full reload** (`router.refresh`/`window.location` asserted NOT called); cancel/Esc/backdrop does nothing — *positive + negative flows + UI test*.
5. New keys (`reports.status_override`, `reports.delete`) added to `PERMISSION_KEYS`; their `admin.permissions.keys.*`/`descriptions.*` + all report-control strings have sq/en/uk/it parity; no raw keys; Дозволи page renders both toggles localized; `check:i18n` green.
6. UI control visibility is driven by the `canOverrideReportStatus`/`canDeleteReports` capability props (not `isAdmin`) — *UI test asserts both true→shown, both false→hidden*.
7. Mobile <640 gate satisfied for all new controls + the confirm dialog + the Дозволи new rows, with the rendered matrix (uk@320/375/390) in the log.
8. **Storybook rendered-proof (Task 464 gate):** all stories in the "Storybook rendered-proof contract" section exist with the EXACT export names → IDs → anchor `data-testid`s, render real content, and pass `screenshots:assert` with `anchorsFound == anchorsExpected`, non-blank bitmap, no overflow at 320; uk@320/375/390 matrix in the log — *contract section + screenshots:assert transcript*.
9. Gates green: `tsc --noEmit`=0; `check:i18n`; `check:stories`; the new vitest suites; `screenshots:assert` (rendered-proof, anchors found); file-integrity (clause 14) on every touched file. Idempotent SQL (if any) pasted for owner apply. **Note in the log that the authoritative rendered-proof run is the owner's NATIVE run on the committed tree.**

## Hard contract (verified against the diff)

No scope creep; no invented architecture (use the STOP & ASK triggers); literal AC; self-validation block + AC-by-AC table; UX-flow + control-preservation before/after inventory; both positive AND every negative branch implemented with the correct typed error/locale key; **"Files Changed" table**; do NOT run or emit git. Security boundary is the **server action via `hasPermission`**, never UI hiding or a role-string check.

## 🔁 REWORK required (R10–R12) — 2026-06-20, after orchestrator functional review (owner-confirmed)

The functional implementation is APPROVED in shape, but three items BLOCK closure. Fix exactly these; do not change anything else.

**R10 [P1 — data-integrity] CAS-guard the audit-failure revert in `updateReportStatusAction`.** The current revert
`db.from('listing_reports').update({ status: oldStatus }).eq('id', reportId)` filters on `id` ONLY. Under a concurrent
write (request B moves `reviewed→resolved` after A's forward update but before A's audit-failure revert), A's revert
clobbers B's later status. Replace with a CAS revert that only reverts if the row is still A's `newStatus`, and handle the
miss:
```ts
const { data: reverted, error: revertError } = await db
  .from('listing_reports')
  .update({ status: oldStatus })
  .eq('id', reportId)
  .eq('status', newStatus)          // CAS: revert ONLY if still our value
  .select('id')
if (revertError || !reverted || reverted.length === 0) {
  // Concurrent change OR revert error → do NOT clobber; surface a CRITICAL log:
  // state is "status changed without an audit row".
  console.error('[updateReportStatus] CRITICAL: audit insert failed and status NOT reverted (concurrent change or revert error)', { reportId, oldStatus, newStatus, revertError })
}
return { error: 'save_failed' }
```
(The clean long-term fix is an RPC/transaction; CAS-revert is the in-scope minimum. Do NOT add a migration for this.)

**R11 [P1 — test] Add the revert-race regression test** in `deleteReport.smoke.test.ts`: audit insert fails AND the CAS
revert matches 0 rows (status already changed again) → assert the CRITICAL `console.error` fires, the action returns
`save_failed`, and the second `update` (revert) was attempted with `{ status: oldStatus }` but did NOT throw/clobber. Use
`mockUpdateSelect.mockResolvedValueOnce(forward).mockResolvedValueOnce([])` to distinguish the forward update from the
revert. Keep the existing audit-revert test (status reverted on the happy revert path).

**R12 [P2 — negative-flow completeness] Surface the `conflict` branch distinctly in the UI.** `handleAction` in
`AdminReportsManager.tsx` currently collapses EVERY update error into the generic `t('error_update_failed')` toast — so the
new CAS `conflict` (the report changed under the user) is indistinguishable from a real failure. Map `result.error ===
'conflict'` to a distinct toast (new key `admin.reports.error_conflict`, e.g. "This report changed since you opened it —
refresh and try again") in all four locales (`sq/en/uk/it`), and on conflict do NOT optimistically update the row (it
already early-returns before `onUpdated`). Other error codes may keep the generic toast. This satisfies the kickoff's
"per-branch negative flow with the correct locale key" requirement for the conflict branch.

**R13 [P2 — typed error toasts] Map EACH server-action error code to a distinct localized toast** in
`AdminReportsManager.tsx`, replacing the current two-way fallbacks in `handleAction` and `handleDelete`. Use one shared map
+ a per-action generic fallback so both handlers stay consistent:
```ts
const ERROR_KEYS: Record<string, string> = {
  forbidden: 'error_forbidden',
  unauthorized: 'error_unauthorized',
  conflict: 'error_conflict',
  not_found: 'error_not_found',
}
// handleAction (status update): toast.error(t(ERROR_KEYS[result.error] ?? 'error_update_failed'))
// handleDelete:                 toast.error(t(ERROR_KEYS[result.error] ?? 'error_delete_failed'))
```
- `handleAction`: `forbidden→error_forbidden`, `unauthorized→error_unauthorized`, `conflict→error_conflict`,
  `invalid_status`/other/`save_failed→error_update_failed`.
- `handleDelete`: `forbidden→error_forbidden`, `unauthorized→error_unauthorized`, `not_found→error_not_found`,
  other/`save_failed→error_delete_failed`.
- Add new keys `admin.reports.error_forbidden` + `admin.reports.error_unauthorized` in ALL four locales
  (`sq/en/uk/it`), same key set; `check:i18n` green. (`error_conflict`/`error_not_found`/`error_update_failed`/
  `error_delete_failed` already exist.)
- **Tests:** add UI cases — status-update `forbidden` → `mockToastError` called with `error_forbidden`; delete
  `forbidden` → `error_forbidden`; (optionally `unauthorized` → `error_unauthorized`). No other behavior/markup/layout
  change — error-message mapping ONLY (scope discipline).

> **Orchestrator verification already done (no need to re-attach):** the real `AdminReportsManager.tsx` was read in full —
> anchors (`admin-reports-manager`/`status-override-section`/`reopen-btn`/`delete-btn`) correctly placed; every new control
> carries `max-sm:w-full`; the component imports NO `useRouter` and uses local state only (`setReports`/`handleDeleted`)
> for both update and delete → **no `router.refresh`/full reload on any path** (the test's mock-not-called assertion
> reflects the real component); delete success closes BOTH the confirm and the detail dialog + optimistic list removal;
> existing review/dismiss/resolve buttons preserved. Only R10–R12 are missing. **Rendered-proof stays deferred to the
> Task 467 harness per the owner's P0 cycle — do NOT claim `screenshots:assert` as authoritative for 463 here.**
