# Sprint 28 — Task 328 kickoff (Canonical `StatusChangeControl` spec + per-surface assignment)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits. **SPEC-ONLY task — NO product source code may be touched.**

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **spec-only task** — your output is one new section in `docs/admin-ux-rules.md` (§13 "Canonical `StatusChangeControl`") + an evidence inventory in the session log. Pre-read: `docs/orchestrator-role.md`, `docs/ai-behavior.md` (Notes 19/20/21), `docs/ui-rules.md` §0 (canonical primitives + Combobox-only rule), `docs/admin-ux-rules.md` (existing sections — do NOT modify §1-§12), `docs/component-rules.md`, `tasks/Sprints/Sprint_28_—_Admin_Mobile_Responsive_and_Status_Workflow_Foundation.md`. No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 328 = second audit/spec in Sprint 28. Parallel-safe with Task 327. Both must complete before Tasks 306 + 307 start.

---

```
Type:        spec (governance section in docs/admin-ux-rules.md)
Priority:    HIGH (blocks Task 307 StatusChangeControl primitive implementation)
Area:        docs/admin-ux-rules.md §13 (NEW)
```

## Why this task exists

Owner observed (2026-05-30) that the same admin action — "change status of an object" — has 4 different UX patterns across the admin section. From code inventory:

| Component | Pattern today | Evidence |
|-----------|---------------|----------|
| `AdminSupportManager` (tickets + complaints detail modal) | Workflow block: status pills + optional note Textarea + "Update status" button + history timeline | `src/components/admin/AdminSupportManager.tsx` lines 254–402 (`TicketDetail`, `STATUS_VARIANT`, `STATUS_ICON`, `TICKET_STATUSES`, `handleStatusUpdate`, `t('status_change_label')` block) |
| `AdminInquiriesManager` (inquiry detail card) | Simple `Combobox` dropdown bound to `handleStatusChange`, no note, no timeline, immediate save on change | `src/components/admin/AdminInquiriesManager.tsx` lines 124–137, 190–199, 291–296 |
| `AdminReportsManager` (report detail card) | Inline action buttons (`handleAction(newStatus)`) + notes Textarea | `src/components/admin/AdminReportsManager.tsx` lines 57–146 |
| `AdminListingsTable` (per-row transitions) | Transition buttons per current status (Approve / Reject / Archive / Activate / Send-review / Mark-sold / Mark-rented / Restore) via `STATUS_ACTIONS` map | `src/components/admin/AdminListingsTable.tsx` lines 31–62 |

Owner directive (Sprint 28 Decision 1): **Tiered canonical primitive** — `StatusChangeControl` with `variant="select" | "workflow"`. Low-stakes inquiries → `variant="select"`. Moderation / destructive (tickets, complaints, listing transitions) → `variant="workflow"` (pills + optional note + Update button + timeline). One shared component; surfaces declare `variant` + `transitions` whitelist.

Task 328 produces the canonical spec; Task 307 implements it.

## Current behavior to preserve (Notes 19/20/21)

`SPEC-ONLY task.` No product code touched. The "current behavior preserved" is the documentation contract:

- `docs/admin-ux-rules.md` §1-§12 — DO NOT modify. Only append new §13.
- The existing implementations in `AdminSupportManager` / `AdminInquiriesManager` / `AdminReportsManager` / `AdminListingsTable` are NOT modified by this task. Your inventory of them in the session log is read-only.

Your spec must encode owner Decision 1 verbatim (tiered). DO NOT introduce a third tier. DO NOT recommend reuniting workflow + select into one UX. The decision is fixed input.

## Positive flow (happy path)

As Sonnet 4.6 writing this spec:

1. Pre-read all listed docs.
2. Open the 4 referenced components and inventory the current status-change UX in detail:
   - Field shapes (what the component renders today: pills / select / buttons; size + spacing)
   - Server action signature each calls (`updateTicketStatus(id, status, note)` / `updateInquiryStatus(id, status)` / `updateReportStatusAction(id, status, notes)` / `updateListingStatus(...)`)
   - Whether a note field is offered (and required / optional)
   - Whether a history / timeline / events display is rendered (and where the data comes from — `support_ticket_events` / none / none / none)
   - Whether transitions are filtered per current state (yes for `AdminListingsTable` via `STATUS_ACTIONS`; effectively no for the others — all final states reachable)
   - Locale keys used (`status_change_label`, `update_status_btn`, `support_status_*`, `status_*`, `btn_approve`, `btn_reject`, …)
   - Mobile behaviour (does it wrap? does it overflow? does anything become unreachable?)
3. Write a NEW section `## 13. Canonical `StatusChangeControl` — Decision 1 (APPROVED)` in `docs/admin-ux-rules.md` containing:

   a. **Statement of the decision** (verbatim): "Owner directive Sprint 28 Decision 1: tiered canonical primitive — `variant=\"select\"` for low-stakes admin status changes (Inquiries); `variant=\"workflow\"` for moderation / destructive status changes (Support tickets, complaints, listing transitions). One shared component; per-surface variant declared at usage site."

   b. **Tier definitions**:
   - **`variant="select"`** — single `Combobox`-styled dropdown, immediate save on change, optional `note` field hidden by default (revealed only if `enableNote` prop is `true`), no timeline by default (revealed if `historyEvents` prop is non-empty), localized toast on save success / error.
   - **`variant="workflow"`** — pill-button group of allowed transitions, optional note `Textarea` (mandatory if `requireNote` prop set), "Update status" submit button (disabled while pending or when no transition selected), required timeline below the workflow block fed by `historyEvents` prop.

   c. **Canonical API surface** (exact prop shape — Task 307 implements this):
   ```ts
   type StatusOption<S extends string> = {
     code: S
     labelKey: I18nKey
     badgeVariant: 'neutral' | 'success' | 'warning' | 'destructive' | 'info'
     icon?: ReactNode
     destructive?: boolean
   }

   type Transition<S extends string> = {
     from: S
     to: S
     labelKey: I18nKey
     destructive?: boolean
     requireNote?: boolean
   }

   type HistoryEvent = {
     id: string
     fromStatus: string | null
     toStatus: string
     note: string | null
     actorName: string | null
     createdAt: string
   }

   type StatusChangeControlProps<S extends string> = {
     variant: 'select' | 'workflow'
     currentStatus: S
     statuses: StatusOption<S>[]                 // canonical badge / label / icon registry
     transitions?: Transition<S>[]               // required for variant="workflow"; ignored for "select"
     historyEvents?: HistoryEvent[]              // optional; renders <StatusChangeHistory /> when non-empty
     onSubmit: (next: { toStatus: S; note: string | null }) => Promise<void> | void
     enableNote?: boolean                        // select variant only — show optional note field
     requireNote?: boolean                       // workflow variant only — block submit until note present
     submitLabelKey?: I18nKey                    // default 'update_status_btn'
     disabled?: boolean
     'aria-label'?: string
   }
   ```
   Plus a separate `<StatusChangeHistory events={HistoryEvent[]} />` subcomponent (renders the canonical timeline; Task 307 ships both).

   d. **Mandatory locale keys** (Task 307 must add these to `messages/{sq,en,uk,it}.json` under `admin.common.status_control`):
   - `update_status_btn`
   - `status_change_label`
   - `status_change_note_placeholder`
   - `status_change_note_required`
   - `status_change_note_optional`
   - `status_change_success`
   - `status_change_error`
   - `status_change_no_change`
   - `status_change_history_title`
   - `status_change_history_empty`
   - `status_change_history_actor_unknown`

   Re-use existing `support_status_*` / `status_*` / `complaint_type_*` / listing-status keys for the option labels — DO NOT duplicate. Reference: `messages/sq.json` `admin.support` namespace + `admin.inquiries` namespace + `admin.listings` namespace.

   e. **Per-surface assignment table** (canonical owner-flagged surfaces; other admin surfaces remain on current pattern until a separate follow-up):

   | Surface | Component | variant | transitions | historyEvents | enableNote | requireNote | Migration target task |
   |---------|-----------|---------|-------------|---------------|-----------|-------------|----------------------|
   | `/admin/inquiries/support` | `AdminInquiriesManager` (mailbox=support) | `select` | — | (none today) | false | false | Task 307 pilot + Task 309 finalize |
   | `/admin/inquiries/sales` | `AdminInquiriesManager` (mailbox=sales) | `select` | — | (none today) | false | false | Task 309 |
   | `/admin/support` (tickets) | `AdminSupportManager` | `workflow` | open↔in_progress↔resolved↔closed (full cross-product within `TicketStatus`) | `support_ticket_events` rows from existing fetch | false | false (notes optional today) | Task 309 |
   | `/admin/support` (complaints) | `AdminSupportManager` | `workflow` | same as above | same as above | false | false | Task 309 |
   | `/admin/listings` (per-row + per-detail) | `AdminListingsTable` | `workflow` | derived from existing `STATUS_ACTIONS` map (preserve current per-current-state transition whitelist verbatim) | — (no listing-event timeline today; do NOT introduce one in Sprint 28) | false | false | Task 308 |
   | `/admin/reports` | `AdminReportsManager` | — | NOT in Sprint 28 scope | — | — | — | Epic HH Phase 3 follow-up (NOT this sprint) |

   f. **Required save / loading / error / success contract** (consistent across variants):
   - On `onSubmit` success → `toast.success(t('admin.common.status_control.status_change_success'))`. Caller's `onSubmit` may also do its own post-success refetch / mutate.
   - On `onSubmit` error → `toast.error(t('admin.common.status_control.status_change_error'))`. Submit stays unlocked for retry.
   - "No change" (workflow user clicks current state pill OR select set to current value) → button stays disabled OR Combobox change is a no-op + silent.
   - Pending state → submit button shows spinner + label remains the same key (no `t('saving')` swap to keep behaviour predictable across locales).

   g. **Mobile (320/375/390) behaviour** — required:
   - `variant="select"` Combobox uses the canonical Combobox primitive (`docs/ui-rules.md §0`) which is already mobile-ready.
   - `variant="workflow"` pill row uses `flex-wrap gap-2`; pills `size="sm"` per `docs/ui-rules.md`; tap target ≥ 44×44 via `min-h-[44px]` wrapper if pill size is below threshold.
   - Note `Textarea` is full-width at narrow breakpoints with `min-h-[88px]`.
   - History timeline collapses to vertical list (the desktop card-style is preserved at ≥ md).

4. Append the section to `docs/admin-ux-rules.md` directly below §12 (do NOT renumber existing sections).
5. Update `docs/backlog.md` per backlog rules.
6. Write session log `docs/sessions/2026-05-30-task-328-status-change-control-spec.md` per Note 18 self-validation + Files Changed table.

## Negative flow (every off-happy-path branch)

- **Tempted to introduce a 3rd variant** (e.g. `variant="buttons"` for AdminReportsManager) → STOP. Owner Decision 1 is 2-tier. `/admin/reports` is out of Sprint 28 scope; the spec mentions it as "deferred to Epic HH Phase 3 follow-up" without proposing a tier.
- **Tempted to introduce a timeline for listings** → STOP. No listing-events table exists; Sprint 28 must not add DB schema.
- **Tempted to make note REQUIRED on all workflow transitions** → STOP. Owner Decision 1 says note is "optional in workflow" by default; surfaces may declare `requireNote` per-instance. Current AdminSupportManager treats note as optional → preserve that default.
- **Tempted to centralize status registry as a constants file** → out of scope. Each surface keeps its own status enum + locale keys; the primitive consumes them via props.
- **Tempted to add inline status change to admin tables** (not in detail modal) → STOP. AdminListingsTable today has per-row buttons; Task 308 will migrate those to `StatusChangeControl variant="workflow"` rendered inline per row. Sprint 28 does NOT add per-row status change to AdminUsersTable / AdminSupportManager table / AdminInquiriesManager table.
- **Tempted to spec the `submit` action server-side** → out of scope. Each surface keeps its own server action; the primitive only calls `onSubmit({ toStatus, note })` and surfaces the toast.
- **An existing `admin-ux-rules.md §1-§12` decision contradicts your draft spec** → STOP & ASK. Do NOT silently adjust an existing section.
- **STOP & ASK** if you cannot map an existing locale key to a canonical name without duplication (e.g. `status_change_label` already exists in `admin.support` namespace) — propose a migration path in the spec, mark with `[STOP & ASK]` in the doc, do not perform the migration in Task 328.

## Required investigation (paste in session log BEFORE writing spec)

```
# 1. Inventory current 4 status-change implementations
grep -nE "(handleStatusUpdate|handleStatusChange|handleAction\\(newStatus|updateListingStatus|updateInquiryStatus|updateReportStatusAction|updateTicketStatus)" \
  src/components/admin/AdminSupportManager.tsx \
  src/components/admin/AdminInquiriesManager.tsx \
  src/components/admin/AdminReportsManager.tsx \
  src/components/admin/AdminListingsTable.tsx | head -40

# 2. Inventory current locale keys
grep -nE "(status_change|update_status_btn|status_updated|status_error|support_status_)" \
  messages/sq.json messages/en.json messages/uk.json messages/it.json | head -40

# 3. Inventory current STATUS_ACTIONS map for AdminListingsTable
sed -n '30,70p' src/components/admin/AdminListingsTable.tsx

# 4. Inventory current ticket events fetch + timeline render
grep -nE "support_ticket_events|status_changed|events.filter" src/components/admin/AdminSupportManager.tsx | head -20
```

## Acceptance criteria

- `docs/admin-ux-rules.md` has a NEW §13 "Canonical `StatusChangeControl` — Decision 1 (APPROVED)" section with:
  - Verbatim owner decision statement.
  - Both tier definitions (`select` / `workflow`).
  - Full TypeScript prop API for `StatusChangeControlProps<S>` + `StatusOption<S>` + `Transition<S>` + `HistoryEvent` + `StatusChangeHistory` subcomponent reference.
  - Locale keys list (11 keys minimum under `admin.common.status_control`).
  - Per-surface assignment table covering 5 owner-flagged surfaces explicitly + `/admin/reports` marked out-of-Sprint-28-scope.
  - Save / loading / error / success contract.
  - Mobile 320 behaviour rules.
- `docs/admin-ux-rules.md` §1-§12 unchanged.
- `docs/backlog.md` Last-Session block updated.
- `docs/sessions/2026-05-30-task-328-status-change-control-spec.md` exists with Note 18 self-validation block + Files Changed table.
- `npx tsc --noEmit` → 0 errors (no incidental code drift).
- Zero source-code (`src/`, `messages/`) modifications.

## Out of scope (HARD)

- Implementing `StatusChangeControl.tsx` or `StatusChangeHistory.tsx` — that is Task 307.
- Adding locale keys to `messages/*.json` — Task 307 does that.
- Touching any of the 4 referenced components.
- Adding admin status-change to any surface not in the per-surface assignment table.
- Introducing a 3rd `variant`.
- Adding listing event timeline / DB schema.
- Migrating `/admin/reports` to the new primitive in Sprint 28.
- Editing `docs/admin-ux-rules.md` §1-§12.

## Notes for orchestrator review

- The spec encodes owner Decision 1 verbatim. Orchestrator rejects the diff if the section drifts from the 2-tier model.
- The per-surface assignment table is the SOLE input for Tasks 308 + 309. Any change to the assignment must STOP & ASK.
- Orchestrator verifies Task 307 implementation against this spec — the API surface in this doc must match `src/components/admin/StatusChangeControl.tsx` in Task 307 byte-for-byte (modulo formatting).
