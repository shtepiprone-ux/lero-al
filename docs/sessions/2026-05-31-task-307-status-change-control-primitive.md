# Session: Task 307 — StatusChangeControl + StatusChangeHistory primitives + AdminInquiriesManager pilot

**Date:** 2026-05-31
**Task:** 307 (Sprint 28 — fourth task, activates Epic HH Phase 2)
**Type:** Feature (canonical primitives + pilot integration + locale keys)
**Sprint:** 28

---

## Required Investigation Results

```
# 1. Task 328 §13 spec confirmed:
   grep -n "Canonical \`StatusChangeControl\`" docs/admin-ux-rules.md
   → Line 415: ## 13. Canonical `StatusChangeControl` — Decision 1 (APPROVED)
   → StatusChangeControlProps present at line 465
   → admin.common.status_control keys at line 484

# 2. AdminInquiriesManager current status-change handler:
   handleStatusChange(newStatus: string) → updateInquiryStatus(selected.id, newStatus)
   → calls toast.error(t('status_error')) on error
   → calls toast.success(t('status_updated')) on success
   → updates local state setInquiries + setSelected

# 3. Canonical primitives confirmed:
   src/components/shared/Combobox.tsx ✅ (used for variant="select")
   src/components/ui/textarea.tsx ✅ (used for note field)

# 4. STATUS_VARIANT + STATUS_ICON:
   STATUS_VARIANT: { new: 'warning', in_progress: 'info', closed: 'neutral' }
   STATUS_ICON: { new: Circle, in_progress: AlertCircle, closed: CheckCircle2 }
```

---

## Current Behavior Preserved in AdminInquiriesManager

| Element | Before | After |
|---------|--------|-------|
| Status change trigger | `<Combobox onChange={handleStatusChange}>` | `<StatusChangeControl variant="select" onSubmit={handleStatusChange}>` |
| `handleStatusChange` signature | `(newStatus: string) => void` | `({ toStatus, note }: ...) => Promise<void>` (async, throws on error) |
| Toast on success | `toast.success(t('status_updated'))` in handler | Primitive calls `toast.success(t('admin.common.status_control.status_change_success'))` |
| Toast on error | `toast.error(t('status_error'))` in handler | Primitive catches thrown error and calls `toast.error(t('admin.common.status_control.status_change_error'))` |
| Local state update | `setInquiries(...) + setSelected(...)` in handler | Preserved — still in the refactored handler |
| Auto-bump on reply | `status === 'new' ? 'in_progress'` (lines 150/158/173/181) | **PRESERVED** — completely independent of StatusChangeControl |
| Status row badge | `STATUS_VARIANT[inq.status]` per inquiry card | **UNCHANGED** |
| `isPending` from `useTransition` | Used by Combobox `disabled={isPending}` | Still used; passed as `disabled={isPending}` to StatusChangeControl |

---

## Components Created

### `src/components/admin/StatusChangeHistory.tsx`
- Props: `events: HistoryEvent[]`, `labelFormatter?`, `emptyKey?`
- HistoryEvent shape: `{ id, fromStatus, toStatus, note, actorName, createdAt }`
- Renders chronological list with Clock icon + actor + from→to + note + timestamp
- Empty state via `t('status_change_history_empty')`
- Mobile: vertical list at all widths (read-only; no interactive elements)

### `src/components/admin/StatusChangeControl.tsx`
- Props exactly matching Task 328 §13 spec
- `variant="select"`: delegates to canonical `<Combobox>` from `@/components/shared/Combobox`; immediate save semantics
- `variant="workflow"`: pill-button group from allowed transitions (filtered by `from === currentStatus`); note Textarea; submit button; `min-h-[44px]` pills for mobile
- Common: primitive owns toasting via `admin.common.status_control.*`; caller's `onSubmit` should NOT toast (throws to trigger error path)
- "No change" guard: no-op if `toStatus === currentStatus`

### Locale keys added (11 keys × 4 locales = 44 strings):
All under `admin.common.status_control`:
- `update_status_btn` / `status_change_label` / `status_change_note_placeholder` / `status_change_note_required` / `status_change_note_optional` / `status_change_success` / `status_change_error` / `status_change_no_change` / `status_change_history_title` / `status_change_history_empty` / `status_change_history_actor_unknown`

---

## Pilot Integration: AdminInquiriesManager

Changes:
1. `Combobox` import removed; `StatusChangeControl + StatusOption` imported
2. `statusOptions: ComboboxOption[]` replaced with `inquiryStatusOptions: StatusOption<ContactStatus>[]`
3. `handleStatusChange(newStatus: string)` → `handleStatusChange({ toStatus, note }: ...)` async; toast removed (primitive handles them); throws on server error
4. Lines 291-299: `<span>{t('change_status')}</span><Combobox ...>` → `<StatusChangeControl variant="select" ...>`
5. `CONTACT_STATUSES`, `STATUS_VARIANT`, `STATUS_ICON` all **preserved** (now used via `inquiryStatusOptions` mapping)
6. Auto-bump on reply (handleSendReply lines 150/158/173/181) **PRESERVED** — completely independent

Both `/admin/inquiries/support` and `/admin/inquiries/sales` are covered by the same pilot since they share `AdminInquiriesManager.tsx`.

---

## AC Self-Audit

| AC | Status | Verification |
|----|--------|-------------|
| `StatusChangeControl.tsx` exists with both variants + §13 API | ✅ | Props: variant/currentStatus/statuses/transitions/historyEvents/onSubmit/enableNote/requireNote/submitLabelKey/disabled |
| `StatusChangeHistory.tsx` exists with documented contract | ✅ | Props: events/labelFormatter/emptyKey; renders timeline with Clock icons |
| Story files exist (StatusChangeControl + StatusChangeHistory) | ✅ | 9 StatusChangeControl stories + 4 StatusChangeHistory stories |
| Desktop1280 + mobile320 + uk locale variants in stories | ✅ | Select_BasicInquiry, Select_UkrainianLocale, Workflow_Mobile320, etc. |
| 11 locale keys in all 4 files under `admin.common.status_control` | ✅ | `npm run check:i18n` → 1430 keys, parity PASSED |
| AdminInquiriesManager pilot migrated | ✅ | Combobox → StatusChangeControl variant=select |
| Auto-bump on reply preserved | ✅ | handleSendReply unchanged; auto-bump lines 150/158/173/181 intact |
| Status row badge unchanged | ✅ | STATUS_VARIANT[inq.status] in card rendering untouched |
| Duplicate toasts removed from handleStatusChange | ✅ | No toast.success/toast.error in refactored handler |
| AdminSupportManager / AdminListingsTable UNTOUCHED | ✅ | Tasks 308/309 own those |
| `npx tsc --noEmit` → 0 | ✅ | |
| `npm run build` → passes | ✅ | |
| `npm run lint` → 0/0 | ✅ | |
| `npm run check:i18n` → parity PASSED | ✅ | 1430 keys × 4 locales |
| `docs/component-catalog.md` updated (2 new CANONICAL primitives) | ✅ | StatusChangeControl + StatusChangeHistory CANONICAL |

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/components/admin/StatusChangeControl.tsx` | NEW — canonical status-change primitive (select + workflow variants) | Task 307 primary deliverable |
| `src/components/admin/StatusChangeHistory.tsx` | NEW — canonical status-change history timeline subcomponent | Task 307 primary deliverable |
| `src/components/admin/StatusChangeControl.stories.tsx` | NEW — 9 stories (select/workflow variants + mobile + uk locale) | Storybook requirement |
| `src/components/admin/StatusChangeHistory.stories.tsx` | NEW — 4 stories (empty/single/multiple/uk) | Storybook requirement |
| `src/components/admin/AdminInquiriesManager.tsx` | Pilot: Combobox→StatusChangeControl; handleStatusChange refactored; auto-bump preserved | Proves primitive works end-to-end |
| `messages/sq.json` | +11 keys under `admin.common.status_control` | Task 307 locale requirement |
| `messages/en.json` | +11 keys under `admin.common.status_control` | Task 307 locale requirement |
| `messages/uk.json` | +11 keys under `admin.common.status_control` | Task 307 locale requirement |
| `messages/it.json` | +11 keys under `admin.common.status_control` | Task 307 locale requirement |
| `docs/component-catalog.md` | +2 CANONICAL: StatusChangeControl + StatusChangeHistory | Per component governance rules |
| `docs/sessions/2026-05-31-task-307-status-change-control-primitive.md` | NEW — this session log | Per Note 10 |
| `docs/backlog.md` | Updated Last Session block | Per Note 10 |

**Self-validation: tsc=0 · build=✅ · lint=0/0 · check:i18n=✅ (1430 keys parity) · StatusChangeControl (select+workflow) + StatusChangeHistory created with stories · AdminInquiriesManager pilot complete (Combobox→StatusChangeControl; auto-bump preserved; duplicate toasts removed) · component-catalog updated (2 CANONICAL) · AdminSupportManager/AdminListingsTable untouched · PASS**
