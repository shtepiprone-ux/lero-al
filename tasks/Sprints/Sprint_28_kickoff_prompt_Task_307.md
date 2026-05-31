# Sprint 28 — Task 307 kickoff (`StatusChangeControl` + `StatusChangeHistory` primitive + AdminInquiriesManager pilot)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **canonical primitive build** activating Epic HH Phase 2 reserved number 307. Pre-read: `docs/orchestrator-role.md`, `docs/ai-behavior.md` (Notes 18/19/20/21/23), `docs/ui-rules.md §0` (canonical primitives + Combobox-only rule), `docs/admin-ux-rules.md` (esp. **§13** "Canonical `StatusChangeControl`" produced by Task 328), `docs/component-rules.md`, `docs/component-governance.md §1`, `docs/governance-checklists.md` Checklist I, `tasks/Sprints/Sprint_28_—_Admin_Mobile_Responsive_and_Status_Workflow_Foundation.md`. No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 307 = fourth (impl) task in Sprint 28. Activates Epic HH Phase 2 reserved number 307. Depends on Task 328 spec. Parallel-safe with Task 306.

> **Source-of-truth clarification (Opus, 2026-05-31):** **`docs/admin-ux-rules.md` §13.4 Per-Surface Assignment Table is the SINGLE SOURCE OF TRUTH for which surfaces use `StatusChangeControl`, which `variant` each uses, and which Sprint 28 task migrates each one.** Do NOT infer surface count, scope, or owner-flagging from prose wording in any session log, kickoff narrative, or backlog entry. The Task 328 session log contains an internal inconsistency between two AC rows — one says "6 owner-flagged surfaces + AdminReportsManager", another says "5 owner-flagged surfaces + AdminReportsManager" — neither phrasing is canonical; both refer back to the §13.4 table, which has **6 rows total** of which **`/admin/reports` (AdminReportsManager) is explicitly marked "NOT in Sprint 28 scope" → Epic HH Phase 3 follow-up**. Task 307 itself integrates ONLY the rows whose "Migration target" column names Task 307 (i.e. `/admin/inquiries/support` — "Task 307 pilot + Task 309 finalize"). The sales mailbox row (`/admin/inquiries/sales`) names Task 309, but because both mailboxes share `AdminInquiriesManager.tsx`, the pilot integration in Task 307 covers both surfaces by construction — verify this against §13.4 row-by-row, not against prose counts. If §13.4 ever contradicts §13.x prose or any session log, §13.4 wins. If §13.4 itself is ambiguous → STOP and ask the orchestrator before guessing.

---

```
Type:        feature (canonical primitive + 1 pilot integration)
Priority:    HIGH (blocks Tasks 308 + 309 status-change UX migration)
Area:        src/components/admin/StatusChangeControl.tsx + StatusChangeHistory.tsx (NEW)
             src/components/admin/AdminInquiriesManager.tsx (pilot integration only)
             messages/{sq,en,uk,it}.json (11 new keys under admin.common.status_control)
             src/components/admin/*.stories.tsx (NEW stories)
```

## Why this task exists

Owner Decision 1 (Sprint 28): tiered canonical `StatusChangeControl` (`variant="select" | "workflow"`). Task 328 specifies the API + per-surface assignment table. Task 307 implements the primitive AND pilots it on AdminInquiriesManager (variant=select, lowest-risk surface). Tasks 308 + 309 then integrate it across the remaining owner-flagged surfaces.

## Current behavior to preserve (Notes 19/20/21/23)

### `AdminInquiriesManager.tsx` (pilot integration site)

Inventory BEFORE editing — capture in session log:

- Detail panel: when an inquiry is selected, the right side shows: inquiry meta (status badge, type, date), reply thread, reply composer, and **a "Change status" row** with `<Combobox options={statusOptions} value={selected.status} onChange={handleStatusChange} />` (line 291-296).
- `handleStatusChange(newStatus)` (line 124-137): server action `updateInquiryStatus(selected.id, newStatus)`; on error → `toast.error(t('status_error'))`; on success → local state mutate + `toast.success(t('status_updated'))`.
- Status options come from `CONTACT_STATUSES = ['new', 'in_progress', 'closed']` (line 60).
- Status badges: `STATUS_VARIANT` map (line 48-52); `STATUS_ICON` map (line 54-58).
- Implicit side-effect: replying to an inquiry auto-bumps status `new → in_progress` (line 150, 173) — PRESERVE this behaviour; it is NOT a StatusChangeControl concern.
- Mailbox scoping: AdminInquiriesManager renders both `/admin/inquiries/support` and `/admin/inquiries/sales` via `scope` prop. The status-change UX is identical across both mailboxes — primitive integration covers both.

**EVERY one of the above must remain functionally identical after pilot integration**. The Combobox + handler is replaced by `<StatusChangeControl variant="select" ... onSubmit={...}>` whose `onSubmit` calls the existing server action and triggers the existing toast. Pre-existing toast keys (`status_updated` / `status_error`) are mapped via prop OR kept as the surface's own `onSubmit` body (the primitive's own success/error toasts are localized via `admin.common.status_control.*` — see Task 328 spec).

### `StatusChangeControl` / `StatusChangeHistory` (NEW)

Strict adherence to Task 328 §13 spec. Do NOT introduce undocumented props.

## Positive flow (happy path)

### Build steps

1. Pre-read Task 328 spec §13 verbatim. Lock the prop API; no deviation.
2. Create `src/components/admin/StatusChangeHistory.tsx`:
   - Props: `events: HistoryEvent[]` + `emptyKey?: I18nKey` (default `'admin.common.status_control.status_change_history_empty'`).
   - Renders `<div class="rounded-lg border bg-muted/30 p-3"><h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{t('admin.common.status_control.status_change_history_title')}</h4><ol class="space-y-2">{events.map(...)}</ol></div>`.
   - Each event: small `from → to` arrow with `Badge`s using existing status colour map (passed via prop or resolved at call-site? — Task 307 receives event's raw `fromStatus`/`toStatus` strings and renders them as text, NOT badges, to keep the primitive status-namespace-agnostic; call-site responsibility to format labels via `labelFormatter?: (status: string) => string` optional prop).
   - Note shown below the arrow as muted text if present.
   - Actor + relative timestamp on the right.
   - Empty state: `{t(emptyKey)}` in muted text.
   - Mobile (≤md): vertical stack, larger tap targets (no interactive elements — read-only).
3. Create `src/components/admin/StatusChangeControl.tsx`:
   - Props per Task 328 §13.
   - `variant="select"` branch:
     - Renders the canonical `<Combobox>` from `@/components/ui/combobox` (per `docs/ui-rules.md §0` Combobox-only rule) with `options` derived from `statuses` (label = `t(statusOption.labelKey)`, value = `statusOption.code`).
     - On change → call `onSubmit({ toStatus, note: null })` directly (immediate save semantics matching current AdminInquiriesManager UX).
     - If `enableNote`, show an optional `Textarea` below the Combobox with `placeholder={t('admin.common.status_control.status_change_note_placeholder')}` and a small "Save" `Button` (since user must commit note explicitly).
     - If `historyEvents.length > 0`, render `<StatusChangeHistory events={historyEvents} />` below.
   - `variant="workflow"` branch:
     - Filter `transitions` for those with `from === currentStatus`.
     - Render a `flex flex-wrap gap-2` row of pill `<Button variant="outline" size="sm" min-h-[44px]>` per allowed transition; selected pill highlighted; destructive transitions get `variant="outline"` + `text-destructive border-destructive/30`.
     - Below: optional note `Textarea`. Visible always; required-flag (`requireNote` OR the selected `Transition.requireNote`) renders `*` indicator + blocks submit when empty.
     - Submit `<Button>` with `t(submitLabelKey ?? 'admin.common.status_control.update_status_btn')`; disabled when no transition chosen OR `requireNote` violated OR `disabled` prop true.
     - On submit → spinner + call `onSubmit({ toStatus: selectedTransition.to, note: note.trim() || null })`; await; reset selection on success.
     - If `historyEvents.length > 0`, render `<StatusChangeHistory events={historyEvents} />` below the submit row.
   - Common behaviour:
     - Localized toast on success/error from the primitive itself (per Task 328 contract). Caller's `onSubmit` may throw to trigger the error toast; success path triggers success toast. To avoid double-toasting when caller also toasts, document in the prop API: "Caller's `onSubmit` should NOT call `toast.success` / `toast.error` itself; the primitive owns toasting."
     - "No change" guard: workflow submit is no-op if `toStatus === currentStatus`; select onChange is no-op if `newValue === currentStatus`.
     - Pending state: button shows `<Loader2 className="animate-spin">` icon; label unchanged.
4. Add the 11 mandatory locale keys to `messages/{sq,en,uk,it}.json` under `admin.common.status_control`:
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
   - All four files updated SIMULTANEOUSLY (no parity drift). Run `npm run check:i18n` to verify.
5. Storybook stories:
   - `src/components/admin/StatusChangeControl.stories.tsx`:
     - `Select_BasicInquiry` (variant=select; CONTACT_STATUSES fixture; no note; no history).
     - `Select_WithNote` (variant=select; enableNote=true).
     - `Select_WithHistory` (variant=select; 3-event fixture).
     - `Workflow_TicketStatuses` (variant=workflow; 4-state cross-product transitions; no note; no history).
     - `Workflow_WithRequiredNote` (variant=workflow; requireNote=true; demonstrates submit blocked when note empty).
     - `Workflow_WithHistory` (variant=workflow; 5-event fixture).
     - `Workflow_ListingTransitions` (variant=workflow; per-current-status filtered transitions from AdminListingsTable's STATUS_ACTIONS map).
     - Each story: desktop1280, mobile320 viewports.
     - One `uk` locale variant per variant to verify wrap.
   - `src/components/admin/StatusChangeHistory.stories.tsx`:
     - `Empty`, `Single`, `Multiple` stories with stable fixtures.
6. Pilot integration on `AdminInquiriesManager.tsx`:
   - Define `INQUIRY_STATUS_OPTIONS: StatusOption<ContactStatus>[]` using existing `STATUS_VARIANT` + `STATUS_ICON` + locale-key mapping (label = `t(\`status_\${s}\`)`).
   - Replace lines 290-296 (the existing Combobox + `<span class="text-xs text-muted-foreground block mb-1">{t('change_status')}</span>`) with `<StatusChangeControl variant="select" currentStatus={selected.status} statuses={INQUIRY_STATUS_OPTIONS} onSubmit={handleStatusChange} aria-label={t('change_status')} />`.
   - Refactor `handleStatusChange` to match the new `onSubmit({ toStatus, note })` signature: ignore `note` (variant=select default behaviour without `enableNote`), call existing `updateInquiryStatus(selected.id, toStatus)` server action.
   - REMOVE the duplicate `toast.success(t('status_updated'))` / `toast.error(t('status_error'))` calls from `handleStatusChange` body — the primitive now owns toasting via `admin.common.status_control.status_change_success` / `..._error`. Verify the localized strings (the primitive's success/error) match the prior UX semantically; if owner wants to keep `status_updated` / `status_error` keys, reuse them as the canonical values for the new `status_change_success` / `..._error` keys (4-locale parity).
   - Implicit `new → in_progress` auto-bump on reply (lines 150, 173): PRESERVE — independent of StatusChangeControl.
   - Mobile (≤md) check at 320: Combobox renders correctly; no overflow.
7. Run governance checks: `npm run governance:components`, `npm run catalog:components`, `npm run check:i18n`.
8. Update `docs/component-catalog.md` (2 new canonical primitives).
9. Update `docs/backlog.md`.
10. Write session log `docs/sessions/2026-05-30-task-307-status-change-control-primitive.md` per Note 18 self-validation + Files Changed table.

## Negative flow (every off-happy-path branch)

- **Task 328 §13 not yet present in `admin-ux-rules.md`** → STOP. Task 328 must complete before Task 307. Verify with `grep -n "Canonical \`StatusChangeControl\`" docs/admin-ux-rules.md`. If missing, report to orchestrator and pause.
- **Toast duplication after pilot integration** (caller AND primitive both toast on save) → confirm only primitive toasts; remove caller-side `toast.success` / `toast.error` from `handleStatusChange`.
- **Primitive emits success toast even on caller-thrown error** → catch in primitive `onSubmit` wrapper; await with try/catch; only emit success after `await onSubmit(...)` resolves; emit error on throw.
- **`enableNote` + `requireNote` semantics overlap** → `enableNote` is select-variant-only; `requireNote` is workflow-variant-only (also per-transition via `Transition.requireNote`). Document in the prop JSDoc; assert in dev (TS overloads or runtime warning).
- **`Combobox` doesn't accept a controlled value + onChange pair the way you need** → check `src/components/ui/combobox.tsx` signature; adapt prop names. NEVER replace `Combobox` with `Select` (per `docs/ui-rules.md §0`).
- **`Textarea` canonical primitive missing** → check `src/components/ui/textarea.tsx`. If missing, use existing `Input` styled or extract a `Textarea` from shadcn — STOP & ASK before introducing a new canonical.
- **Pilot integration breaks the reply-auto-status-bump UX** → preserve the `setSelected(prev => prev ? { ...prev, status: prev.status === 'new' ? 'in_progress' : prev.status } : null)` lines verbatim; auto-bump runs independently of StatusChangeControl.
- **AdminInquiriesManager status badges in row + detail use `STATUS_VARIANT` / `STATUS_ICON` directly** → DO NOT migrate these to the primitive; the primitive renders its own status display internally for the editor; the row badge stays as today.
- **`messages/*.json` parity check fails** → re-run; you forgot one of the 4 files; fix.
- **Storybook story breaks build** → fix; do NOT comment out; do NOT skip.
- **You feel like ALSO integrating into AdminSupportManager or AdminListingsTable** → STOP. Task 309 / Task 308 own those.

## Required investigation (paste in session log BEFORE writing code)

```
# 1. Confirm Task 328 §13 spec landed
grep -n "Canonical \`StatusChangeControl\`" docs/admin-ux-rules.md
grep -n "StatusChangeControlProps" docs/admin-ux-rules.md
grep -n "admin.common.status_control" docs/admin-ux-rules.md

# 2. Inventory AdminInquiriesManager current status-change handler
sed -n '110,200p' src/components/admin/AdminInquiriesManager.tsx
sed -n '270,310p' src/components/admin/AdminInquiriesManager.tsx

# 3. Confirm canonical Combobox + Textarea primitives
ls src/components/ui/combobox.tsx src/components/ui/textarea.tsx 2>/dev/null
grep -nE "^export (default )?(function|const) (Combobox|Textarea)" \
  src/components/ui/combobox.tsx src/components/ui/textarea.tsx 2>/dev/null

# 4. Confirm STATUS_VARIANT + STATUS_ICON shape (re-use in pilot)
sed -n '40,70p' src/components/admin/AdminInquiriesManager.tsx
```

## Acceptance criteria

- `src/components/admin/StatusChangeControl.tsx` exists with both variants + prop API exactly matching Task 328 §13.
- `src/components/admin/StatusChangeHistory.tsx` exists with the documented contract.
- `src/components/admin/StatusChangeControl.stories.tsx` + `StatusChangeHistory.stories.tsx` exist with 6+ stories + desktop1280 + mobile320 + `uk` variant coverage.
- `messages/{sq,en,uk,it}.json` each contain the 11 new keys under `admin.common.status_control`; `npm run check:i18n` PASS; parity confirmed.
- `AdminInquiriesManager.tsx` pilot-migrated:
  - Combobox in detail panel replaced with `<StatusChangeControl variant="select" ...>`.
  - `handleStatusChange` refactored to new signature; duplicate toasts removed.
  - Auto-bump on reply behaviour preserved.
  - Status row badge unchanged.
  - Mobile 320 (`uk`) verified end-to-end (capture in session log UX flow trace).
- `npx tsc --noEmit` → 0 errors.
- `npm run build` → passes.
- `npm run governance:components` → no new MANUAL_REVIEW flags.
- `npm run catalog:components` → catalog updated.
- Self-validation block in session log (Note 18); AC table all green; UX flow trace covers: inquiry select → status change select → success toast → reply → status auto-bump.
- Files Changed table in session log.
- Zero diff in non-listed files. AdminSupportManager / AdminListingsTable / AdminReportsManager / AdminUsersTable UNTOUCHED.

## Out of scope (HARD)

- Migrating AdminSupportManager / AdminListingsTable / AdminReportsManager → Task 309 / Task 308 / future Epic HH Phase 3 follow-up.
- Adding a third `variant`.
- Introducing a listing-events DB schema / timeline.
- Adding new locale keys outside `admin.common.status_control` namespace.
- Touching `src/components/ui/combobox.tsx` or `src/components/ui/textarea.tsx`.
- Modifying `docs/admin-ux-rules.md §13` produced by Task 328 (spec is locked).

## Notes for orchestrator review

- Orchestrator runs the pilot integration at 320/375/390/768/1280/1440/2560 × sq/en/uk/it on `/admin/inquiries/support` AND `/admin/inquiries/sales`.
- Orchestrator verifies the primitive's prop surface matches Task 328 §13 byte-for-byte.
- Orchestrator verifies AdminInquiriesManager reply-auto-status-bump still works (Note 19 UX flow trace required).
- Orchestrator verifies toast localization: 4 locales render correctly for `status_change_success` / `status_change_error`.
- A diff that ships the primitive without the pilot integration is INCOMPLETE.
