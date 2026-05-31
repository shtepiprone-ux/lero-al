# Sprint 28 — Task 309 kickoff (Migrate `/admin/support` + `/admin/inquiries/support` + `/admin/inquiries/sales` to `AdminPageShell` + `AdminCardList` + `StatusChangeControl`)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **workflow-surface migration** finishing AdminInquiriesManager pilot started in Task 307 + bringing AdminSupportManager to canonical primitives + Sheet-on-narrow detail modal. Pre-read: `docs/orchestrator-role.md`, `docs/ai-behavior.md` (Notes 18/19/20/21/22/23 — ALL of them), `docs/ui-rules.md`, `docs/admin-ux-rules.md` (§1-§13 ALL — esp §11-§12 modal/dialog/sheet spec from Task 305 and §13 StatusChangeControl from Task 328), `docs/component-rules.md`, `docs/component-governance.md §1`, `docs/governance-checklists.md` Checklists A + B, `docs/qa-rules.md`, `docs/governance-reports/2026-05-30-sprint-28-admin-mobile-evidence-matrix.md` (Task 327), `tasks/Sprints/Sprint_28_—_Admin_Mobile_Responsive_and_Status_Workflow_Foundation.md`, `tasks/Sprints/Sprint_28_kickoff_prompt_Task_306.md`, `tasks/Sprints/Sprint_28_kickoff_prompt_Task_307.md`. No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 309 = sixth (impl) task in Sprint 28. Activates Epic HH Phase 3 reserved number 309 scoped to workflow surfaces only. Parallel-safe with Task 308. Depends on Tasks 306 + 307 shipped + approved.

---

```
Type:        refactor + UX (workflow-surface migration to canonical shell + canonical status control)
Priority:    HIGH (owner-flagged surfaces — closes mobile responsive + status workflow inconsistency for support + inquiries)
Area:        src/components/admin/AdminSupportManager.tsx (full migration; status workflow block REPLACED with StatusChangeControl variant="workflow")
             src/components/admin/AdminInquiriesManager.tsx (finalize Task 307 pilot + AdminCardList + Sheet detail modal)
             src/app/admin/support/page.tsx + src/app/admin/inquiries/support/page.tsx + src/app/admin/inquiries/sales/page.tsx (verify shell wrapping unchanged)
```

## Why this task exists

Owner manually QA'd at 375px (2026-05-30) and found:
- `/admin/support` complaints tabs/table overflow.
- Complaint detail modal (= ticket detail modal in AdminSupportManager) overflows + clips right-side content.
- `/admin/inquiries/support` and `/admin/inquiries/sales` use different status/list patterns.
- Status change UX inconsistent across detail modals.

AdminSupportManager today has the workflow-block status UX (pills + note + Update button + timeline) inside its ticket detail modal — this becomes the canonical `variant="workflow"` reference. AdminInquiriesManager has the Combobox UX (Task 307 piloted `variant="select"`). Task 309 finishes both migrations + standardizes the detail modal to a Sheet bottom-drawer on `<md` per Epic HH Decision 5 + canonical modal §11-§12.

## Current behavior to preserve (Notes 19/20/21/22/23)

### `AdminSupportManager.tsx` — INVENTORY BEFORE EDIT (session log)

- Page header: title + count badge + "+ Нова скарга / + Create ticket" CTA opening `CreateTicketDialog`.
- Filter bar: type filter tabs (`all` / `support` / `user_complaint`) + status filter chips (open / in_progress / resolved / closed) + assignee filter (if present) + search (if present).
- Table columns (desktop): Subject, Type badge, Reporter, Reported, Status, Updated, Actions.
- Column visibility breakpoints.
- Row click → opens `TicketDetail` modal (lines 254-402).
- TicketDetail modal contents:
  - Ticket meta: subject, type badge (`type_user_complaint` / `type_support`), complaint type badge if `user_complaint`, reporter / reported user chips, requester chip if `support`, status badge.
  - **Workflow status block** (lines 349-385): label "Status change", 4 pill buttons (`TICKET_STATUSES`), optional note `Textarea`, "Update status" `Button` with disabled-when-no-change semantics, `STATUS_ICON` decorations.
  - History timeline below: `events.filter(e => e.ticket_id === ticket.id)` with `status_changed` event rendering `old → new`.
  - Action handlers: `handleStatusUpdate` calls `updateTicketStatus(ticket.id, newStatus, note)` + parent `onStatusUpdated`.
- `CreateTicketDialog` (lines 422+): type selector, conditional fields per type (support: subject + details; complaint: reporter + reported + complaint_type + reason), Combobox-based pickers — preserve verbatim.
- Locale keys (sq/en/uk/it).

**NOTE: Existing inline workflow block IS the canonical reference for `variant="workflow"`.** Migrating it to `<StatusChangeControl variant="workflow">` is essentially a parameterization — the visible UX stays the same; the implementation moves into the shared primitive. PRESERVE: pill semantics, optional note, Update button, timeline, all locale keys (or re-mapped to `admin.common.status_control.*` per Task 328 spec while preserving the same on-screen wording).

### `AdminInquiriesManager.tsx` — INVENTORY BEFORE EDIT (session log)

- Page header: title + count badge.
- Filter bar: status tabs (`all` / `new` / `in_progress` / `closed`) + mailbox scope (`support` / `sales`) passed via prop.
- List: card rows today (NOT a `<table>`) — preserve card-list metaphor.
- Detail panel: opens on row click (right-side panel today, or modal on narrow — verify).
  - Inquiry meta: status badge, type, date, contact info.
  - Reply thread.
  - Reply composer.
  - **StatusChangeControl `variant="select"`** (piloted in Task 307).
- Action handlers: `handleStatusChange`, `handleReply`, `handleSendReply`.
- Auto-status-bump on reply (`new → in_progress`) — PRESERVE.
- Locale keys.

### Detail modal mobile pattern

Per Epic HH Decision 5 + admin-ux-rules §11-§12: at `<md` (768px) action-heavy detail modals MUST be `Sheet` bottom-drawer. The TicketDetail + InquiryDetail panels MUST use Sheet on narrow; Dialog or inline panel on `≥md` is acceptable per current implementation. STOP & ASK if existing implementation is inline panel (no modal at all) — then evaluate whether the Sheet pattern adds value vs preserving the inline pattern.

## Positive flow (happy path)

### AdminSupportManager migration

As admin at `uk` 375px:

1. Navigate to `/uk/admin/support`. Page renders inside `AdminPageShell`:
   - Header: title "Support / Tickets" + count badge + "+ Нова скарга" action.
   - Filter bar: type filter tabs (all / support / complaints) + status chips (open / in_progress / resolved / closed) — all reachable; no overflow at 375.
2. Below the filter bar: `AdminCardList` rendered:
   - Each ticket = one card with subject + type badge + reporter + status badge + updated_at.
   - Card click → opens `TicketDetail` as a `Sheet` bottom drawer at `<md`; Dialog `lg` tier at `≥md` (per Epic HH Decision 4).
3. Open TicketDetail:
   - Ticket meta rendered.
   - **`<StatusChangeControl variant="workflow" currentStatus={ticket.status} statuses={TICKET_STATUS_OPTIONS} transitions={TICKET_TRANSITIONS} historyEvents={ticketEvents} onSubmit={handleStatusUpdate} aria-label={t('status_change_label')} />`**.
     - Pills render as before (4 statuses); selected pill highlighted; status_change_label / update_status_btn / note placeholder all localized via `admin.common.status_control.*`.
     - Note `Textarea` optional (existing behaviour).
     - History timeline rendered below by the primitive's `StatusChangeHistory` subcomponent.
   - "Update status" submits → server action `updateTicketStatus(id, newStatus, note)` → success toast (primitive-owned).
4. At `≥md`: Dialog `lg` tier; same content; same behaviour.
5. CreateTicketDialog unchanged (Sprint 28 does NOT touch creation UX).
6. All 4 locales (sq/en/uk/it) verified at 320/375/390/768/1280/1440/2560.

### AdminInquiriesManager migration

As admin at `uk` 375px:

1. Navigate to `/uk/admin/inquiries/support` (or `/sales`). Page renders inside `AdminPageShell`.
2. Filter bar: status tabs + mailbox scope label (read-only badge showing "Support inbox" or "Sales inbox").
3. List = `AdminCardList`. Each inquiry = one card: contact, subject, status, date.
4. Card click → opens `InquiryDetail` as a Sheet bottom drawer at `<md`; inline panel or Dialog at `≥md` per existing pattern.
5. InquiryDetail:
   - Inquiry meta, reply thread, reply composer (unchanged).
   - `<StatusChangeControl variant="select" currentStatus={selected.status} statuses={INQUIRY_STATUS_OPTIONS} onSubmit={handleStatusChange} aria-label={t('change_status')} />` (already piloted Task 307 — Task 309 verifies inside the new shell + Sheet wrapping).
6. Reply → auto-bump `new → in_progress` (existing behaviour) PRESERVED.
7. Both mailbox scopes (`/support` + `/sales`) render correctly with the same shell pattern.

## Negative flow (every off-happy-path branch)

- **Workflow block visually shifts** because the primitive's pill spacing differs from current → adjust primitive's class on workflow row to match current spacing OR adjust call-site wrapping; do NOT compromise visual continuity (Note 19).
- **Existing `status_change_label` / `update_status_btn` locale keys retained at call-site** vs primitive's `admin.common.status_control.*` keys → Task 328 spec mandates new namespace; on migration, REUSE existing values verbatim (4-locale) for the new keys; the old keys may be left dormant in `admin.support` namespace (DO NOT remove in this task — separate i18n cleanup).
- **Detail modal becomes Sheet on `<md` but `≥md` Dialog isn't `lg` tier** → confirm Dialog tier matches Epic HH Decision 4; if owner wants larger `xl` tier, STOP & ASK.
- **CreateTicketDialog gets accidentally migrated** → STOP. Out of scope. Sprint 28 doesn't touch creation flows.
- **Filter type tabs lose tab-on-tab look** → preserve canonical `Tabs` primitive; tab labels localized; current/active state visible.
- **AdminInquiriesManager list reorders after migration** → preserve sort order (e.g. `updated_at desc`); do NOT introduce default sort change.
- **Sheet detail modal at `<md` blocks reply composer** → ensure Sheet body is scrollable; reply composer remains reachable; auto-bump on reply works.
- **Implicit row click vs explicit action button** — preserve whichever the surface already uses; if currently row click opens detail, the AdminCardList `onRowClick` handler runs.
- **History timeline overflow** at 320 — `StatusChangeHistory` wraps to vertical list per Task 307 design; ensure no clipping; long actor names truncate with title attr.
- **Locale parity check fails** because you added `admin.support.*` keys without sq/en/uk/it parity → re-run; fix; do NOT bypass.
- **You feel like ALSO migrating /admin/reports** → STOP. Not in Sprint 28.
- **You feel like ALSO refactoring CreateTicketDialog** → STOP. Out of scope.
- **You feel like ALSO removing the deprecated workflow-block source from AdminSupportManager** → DO remove it (the migration replaces it); confirm nothing else depends on `STATUS_ACTIONS_FOR_TICKETS` / `TICKET_STATUSES` constants — if they are reused elsewhere, keep the constants; only remove the inline UI block + handler-duplication.

## Required investigation (paste in session log BEFORE writing code)

```
# 1. Confirm Task 306 + 307 primitives + AdminInquiriesManager pilot landed
ls src/components/admin/AdminPageShell.tsx \
   src/components/admin/AdminCardList.tsx \
   src/components/admin/StatusChangeControl.tsx \
   src/components/admin/StatusChangeHistory.tsx
grep -n "StatusChangeControl" src/components/admin/AdminInquiriesManager.tsx

# 2. Inventory AdminSupportManager workflow block + locale keys
sed -n '250,420p' src/components/admin/AdminSupportManager.tsx
grep -nE "status_change_label|update_status_btn|status_update_(success|error)|TICKET_STATUSES" \
  messages/sq.json messages/en.json messages/uk.json messages/it.json

# 3. Inventory AdminInquiriesManager detail panel structure (where Sheet wraps)
sed -n '200,320p' src/components/admin/AdminInquiriesManager.tsx

# 4. Confirm canonical Sheet + Dialog primitives
ls src/components/ui/sheet.tsx src/components/ui/dialog.tsx
grep -n "DialogContent.*max-w\|SheetContent" src/components/ui/dialog.tsx src/components/ui/sheet.tsx | head -10

# 5. Confirm Tabs primitive usage in support filter
grep -n "Tabs\|TabsList\|TabsTrigger" src/components/admin/AdminSupportManager.tsx | head -10
```

## Acceptance criteria

- `AdminSupportManager.tsx`:
  - Outer wrapper = `<AdminPageShell ...>`.
  - List render = `<AdminCardList rows={tickets} card={renderTicketCard} onRowClick={openTicketDetail} ...>`.
  - TicketDetail modal: `Sheet` bottom drawer at `<md`; Dialog `lg` tier at `≥md`.
  - Inline workflow block replaced with `<StatusChangeControl variant="workflow" ...>` consuming canonical `TICKET_STATUS_OPTIONS` + `TICKET_TRANSITIONS` (cross-product across `TicketStatus` minus self-loops) + `historyEvents={ticketEvents}` + `onSubmit={handleStatusUpdate}`.
  - Note Textarea is OPTIONAL (no `requireNote`).
  - All locale keys preserved or remapped to `admin.common.status_control.*` (with sq/en/uk/it parity).
  - Filter type tabs + status chips preserved.
  - CreateTicketDialog UNTOUCHED.
- `AdminInquiriesManager.tsx`:
  - Outer wrapper = `<AdminPageShell ...>`.
  - List render = `<AdminCardList ...>` (replacing existing list render).
  - InquiryDetail panel wrapped in `Sheet` on `<md`; inline / Dialog on `≥md` (preserve existing pattern; if no modal today, add Sheet only on narrow + keep inline at `≥md`).
  - `StatusChangeControl variant="select"` already present from Task 307 pilot — verified to render inside the new Sheet on `<md`.
  - Auto-bump on reply PRESERVED.
- Both mailbox scopes (`support` / `sales`) render correctly.
- 7-bp × 4-loc runtime verified — UI pre-flight + UX flow trace in session log per Note 19; before/after control inventory per Note 20 + 22.
- `npx tsc --noEmit` → 0 errors.
- `npm run build` → passes.
- `npm run governance:components` → no new MANUAL_REVIEW.
- `npm run check:i18n` → PASS; locale parity confirmed.
- Self-validation block in session log (Note 18); AC table all green.
- Files Changed table in session log.

## Out of scope (HARD)

- `/admin/reports` migration — Epic HH Phase 3 follow-up.
- CreateTicketDialog refactor.
- AdminInquiriesManager reply thread refactor.
- DB schema changes — no support_ticket_events / contact_submissions schema touched.
- Adding new admin filter / column / row action / control.
- Email-template or notification i18n hardening — Epic II.
- Verified Agents workflow — Epic HH Phase 6.
- Adding inline per-row status change (status remains in detail modal only on these surfaces).

## Notes for orchestrator review

- This task touches the failure-mode-epicenter (Notes 20/22/23 — admin detail modals + status flows). Review will be especially strict on:
  - Before/after control inventory.
  - Workflow block visual continuity (no visual regression).
  - Sheet bottom-drawer pattern at `<md` (no Dialog-on-narrow overflow).
  - StatusChangeControl props correctly mapped to existing handlers / events.
  - Auto-status-bump on reply preserved.
  - 7-bp × 4-loc runtime evidence.
- Orchestrator may emit two commits (one per component) if owner prefers atomic.
- After Task 309 + Task 308 approved → Sprint 28 exit gate G7 → Task 326B becomes UNBLOCKED.
