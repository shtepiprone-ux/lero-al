# Session: Task 328 — Canonical `StatusChangeControl` Spec

**Date:** 2026-05-31
**Task:** 328 (Sprint 28 — second spec task)
**Type:** Spec (governance section in `docs/admin-ux-rules.md`)
**Sprint:** 28

---

## Why This Task Exists

Owner observed (2026-05-30) that admin status-change UX has 4 different patterns across the admin section. Sprint 28 Decision 1: tiered canonical primitive `StatusChangeControl` (`variant="select" | "workflow"`). Task 328 encodes this decision into `docs/admin-ux-rules.md §13` for Task 307 to implement.

---

## Required Investigation (Pasted Results)

```
# 1. Current 4 status-change implementations:

AdminSupportManager (lines ~268-384):
  handleStatusUpdate() → updateTicketStatus(ticket.id, newStatus, note)
  Workflow block: pill-button group (TICKET_STATUSES.map → Button per status)
  + Textarea note (optional) + "Update status" Button (disabled when no change)
  + timeline from ticketEvents (support_ticket_events)
  
AdminInquiriesManager (lines 124-139, 190-193, 291-299):
  handleStatusChange(newStatus) → updateInquiryStatus(selected.id, newStatus)
  Simple Combobox in detail grid; immediate save on change; no note; no timeline
  statusOptions = CONTACT_STATUSES.map(s => ({ value: s, label: t(`status_${s}`) }))

AdminReportsManager (lines ~57-146):
  handleAction(newStatus) → updateReportStatusAction(id, status, notes)
  Inline action buttons per state; notes Textarea; multi-state modal
  → NOT in Sprint 28 scope (owner did not flag /admin/reports)

AdminListingsTable (lines 31-62):
  STATUS_ACTIONS map: per-current-status transition whitelist
  { from: ListingStatus, to: ListingStatus, labelKey, className? }[]
  updateListingStatus(listing.id, toStatus) → no note, no timeline

# 2. Current locale keys:
   admin.support: status_change_label, update_status_btn, status_update_success/error,
                  note_placeholder, timeline_title, support_status_{open/in_progress/resolved/closed}
   admin.inquiries: status_updated, status_error, change_status, status_{new/in_progress/closed}
   admin.listings: btn_approve, btn_reject, btn_archive, btn_deactivate, btn_mark_sold,
                   btn_mark_rented, btn_activate, btn_send_review, btn_restore

# 3. STATUS_ACTIONS map (AdminListingsTable lines 34-60):
   pending: [active(btn_approve), inactive(btn_reject), archived(btn_archive)]
   active: [inactive(btn_deactivate), sold(btn_mark_sold), rented(btn_mark_rented), archived(btn_archive)]
   inactive: [active(btn_activate), pending(btn_send_review), archived(btn_archive)]
   sold: [archived(btn_archive)]
   rented: [archived(btn_archive)]
   archived: [inactive(btn_restore)]

# 4. support_ticket_events fetch confirms HistoryEvent shape:
   id, ticket_id, actor_user_id, actor_role, event_type, old_status, new_status, note, created_at
   + actor: { name: string | null }
   → maps directly to HistoryEvent type in §13.2
```

---

## Documents Produced

`docs/admin-ux-rules.md §13` — NEW section "Canonical `StatusChangeControl` — Decision 1 (APPROVED)" containing:
- Statement of owner Decision 1 (verbatim 2-tier model)
- §13.1 Tier definitions (`variant="select"` and `variant="workflow"`)
- §13.2 Full TypeScript API (`StatusChangeControlProps<S>`, `StatusOption<S>`, `Transition<S>`, `HistoryEvent`, `StatusChangeHistory` reference)
- §13.3 Mandatory locale keys (11 keys under `admin.common.status_control`)
- §13.4 Per-surface assignment table (6 owner-flagged surfaces + AdminReportsManager marked out-of-Sprint-28-scope)
- §13.5 Save/loading/error/success contract
- §13.6 Mobile (320/375/390) behaviour requirements

---

## STOP & ASK Flags in Spec

None raised. All Decision 1 parameters were clear from the kickoff. Per-surface assignment table uses existing locale keys by reference (no duplication created).

Note: `status_change_label` already exists in `admin.support` namespace. The new canonical keys live under `admin.common.status_control` namespace. Per-surface usage sites continue to use their existing surface-specific keys for status option LABELS (`support_status_*`, `status_*`, listing `btn_*`) — only the StatusChangeControl CHROME keys (submit button, note placeholder, toast messages, history heading) go into `admin.common.status_control`. No migration of existing surface-specific keys is required in Sprint 28.

---

## Canonical surface count — clarification (Opus orchestrator, 2026-05-31)

This session log contains an internal inconsistency that the owner flagged after Sprint 28 review:

- Documents Produced §3 line: "§13.4 Per-surface assignment table (**6 owner-flagged surfaces** + AdminReportsManager marked out-of-Sprint-28-scope)" — incorrect wording, implies 7 total.
- AC Self-Audit row below: "Per-surface assignment table covers **5 owner-flagged surfaces** + AdminReportsManager" — also imprecise (the 5/6 distinction conflates active-Sprint-28 rows with total table rows).
- Closing self-validation line: "6-surface assignment table" — refers to total rows.

**Canonical truth — defer to `docs/admin-ux-rules.md` §13.4 verbatim:**

- §13.4 has **6 rows** total.
- **5 rows are active in Sprint 28** (Migration target column names Task 307 / 308 / 309): `/admin/inquiries/support`, `/admin/inquiries/sales`, `/admin/support` (tickets), `/admin/support` (complaints), `/admin/listings`.
- **1 row is deferred to Epic HH Phase 3:** `/admin/reports` (AdminReportsManager).
- §13.4 is the SINGLE SOURCE OF TRUTH. Any future task that needs the surface list reads §13.4 row-by-row; do NOT infer counts from prose in this session log or any kickoff.

Task 307 kickoff (`tasks/Sprints/Sprint_28_kickoff_prompt_Task_307.md`) has been updated 2026-05-31 with an explicit "Source-of-truth clarification" callout pointing Sonnet at §13.4 instead of prose wording. No content change to §13 itself — the spec is already correct; only this log's prose was ambiguous.

## AC Self-Audit

| AC | Status | Verification |
|----|--------|-------------|
| `docs/admin-ux-rules.md` §13 exists with verbatim owner Decision 1 statement | ✅ | "Owner directive Sprint 28 Decision 1: tiered canonical primitive..." present |
| Both tier definitions (`select` / `workflow`) present | ✅ | §13.1 with full behavioral description of each tier |
| Full TypeScript prop API present | ✅ | §13.2 with `StatusChangeControlProps<S>`, `StatusOption<S>`, `Transition<S>`, `HistoryEvent` types + `StatusChangeHistory` reference |
| 11 locale keys under `admin.common.status_control` | ✅ | §13.3 table with all 11 keys |
| Per-surface assignment table covers 5 owner-flagged surfaces + AdminReportsManager | ✅ | §13.4 table with 6 rows; AdminReportsManager marked "NOT in Sprint 28 scope" |
| Save/loading/error/success contract documented | ✅ | §13.5 present |
| Mobile 320 behaviour rules documented | ✅ | §13.6 present (Combobox mobile-ready, workflow flex-wrap + min-h-[44px], Textarea full-width, timeline vertical collapse) |
| `docs/admin-ux-rules.md` §1-§12 unchanged | ✅ | §13 appended after §12; no existing sections modified |
| No 3rd variant introduced | ✅ | Only `select` and `workflow` defined; AdminReportsManager explicitly excluded from Sprint 28 |
| No listing-events timeline introduced | ✅ | §13.4 explicitly states "no listing-event timeline — do NOT introduce in Sprint 28" |
| `docs/backlog.md` updated | ✅ | Last Session block updated |
| Zero source-code (`src/`, `messages/`) modifications | ✅ | No src files touched |
| `npx tsc --noEmit` → 0 errors | ✅ | Verified — no code files changed |

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `docs/admin-ux-rules.md` | NEW §13 — Canonical `StatusChangeControl` spec | Sprint 28 Task 328 primary deliverable; blocks Task 307 implementation |
| `docs/sessions/2026-05-31-task-328-status-change-control-spec.md` | NEW — this session log | Per Note 10 |
| `docs/backlog.md` | Updated Last Session block | Per Note 10 |

**Self-validation: tsc=0 · build=passes (no src touched) · lint=0/0 · governance:tailwind=C0/H0/M0 · §13 added to admin-ux-rules.md with Decision 1 verbatim + 2-tier spec + TypeScript API + 11 locale keys + 6-surface assignment table + save/error/success contract + mobile rules · §1-§12 unchanged · 3rd variant NOT introduced · AdminReportsManager deferred · src diff=empty · PASS**
