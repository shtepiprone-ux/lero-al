# Admin Filter Triage Evaluation — Task 299

**Date:** 2026-05-30  
**Executor:** Claude Code Sonnet 4.6  
**Task type:** Phase 1 — UX evaluation (audit-only, no code changes)

---

## Filter Inventory & Classification

| # | Surface | File:line | Current filter | Type | State layer | Multi-select candidate | Recommendation |
|---|---------|-----------|----------------|------|-------------|------------------------|----------------|
| 1 | AdminInquiriesManager | `AdminInquiriesManager.tsx:82,199` | `statusFilter: ContactStatus \| 'all'` (all/new/in_progress/closed) | Button group | Local `useState` | **YES** | **CONVERT** |
| 2 | AdminInquiriesManager | `AdminInquiriesManager.tsx:83,212` | `mailboxFilter: 'all' \| 'support' \| 'sales'` | Button group | Local `useState` | NO | **KEEP** |
| 3 | AdminReportsManager | `AdminReportsManager.tsx:219,241` | `filter: 'all' \| ReportStatus` (pending/reviewed/resolved/dismissed) | Underline-tab buttons | Local `useState` | **YES** | **CONVERT** |
| 4 | AdminSupportManager | `AdminSupportManager.tsx:544,600` | `typeFilter: 'all' \| 'support' \| 'user_complaint'` | Button group | Local `useState` | NO | **KEEP** |
| 5 | AdminSupportManager | `AdminSupportManager.tsx:545,618` | `statusFilter: '' \| TicketStatus` (open/in_progress/resolved/closed) | Button group | Local `useState` | LOW | **DEFER** |
| 6 | AdminListingsTable | `AdminListingsTable.tsx:482` | `activeStatus: string` (Combobox, all statuses) | Combobox | URL-state | LOW | **DEFER** |
| 7 | AdminUsersTable | `AdminUsersTable.tsx:163` | `activeRole: string` (user/agent/moderator/admin) | Raw button chips | URL-state | LOW | **DEFER** |
| 8 | AdminUsersTable | `AdminUsersTable.tsx:188` | `activeStatus: string` (active/inactive/blocked) | Raw button chips | URL-state | NO/LOW | **DEFER** |

---

## Per-filter analysis

### #1 AdminInquiriesManager — statusFilter → CONVERT (recommended)

**Current UX:** Four mutually-exclusive button choices — all / new / in_progress / closed. Single-select.

**Triage argument FOR multi-select:**
A contact-inquiries moderator typically wants to see all unresolved work at once: "show me new AND in_progress inquiries together so I can prioritize." With single-select they must switch back and forth between two views to get the full picture. Multi-select (OR within group) maps directly to "give me everything I haven't handled yet."

**Counter-argument:**
The natural workflow IS staged: first process all `new`, then follow up on `in_progress`. Single-select guides focused attention on one stage. Multi-select may create a longer list that distracts rather than helps.

**Verdict: CONVERT** — the triage benefit outweighs the distraction concern; the "all" option already shows everything, so multi-select adds granularity (e.g., "new + in_progress but NOT closed"). Estimated effort: **small** (local state, button group, same pattern as Task 294 chip rendering).

---

### #2 AdminInquiriesManager — mailboxFilter → KEEP

**Current UX:** all / support / sales — mutually exclusive mailbox selection.

**Triage argument FOR multi-select:** None meaningful. The two mailboxes (support / sales) are organizational routing buckets, not status stages. Showing both simultaneously is equivalent to "all." The only meaningful states are: one specific mailbox, or all mailboxes.

**Additional context:** Note 21 relocation — when `mailboxScope` prop is set (support or sales route), the mailbox filter is hidden entirely (server-side pre-filter). Multi-select here would be ignored in the most common admin usage.

**Verdict: KEEP as single-select.** No workflow benefit.

---

### #3 AdminReportsManager — filter → CONVERT (recommended)

**Current UX:** Five underline-tab choices — all / pending / reviewed / resolved / dismissed. Default is `'pending'`. Counts shown next to each tab.

**Triage argument FOR multi-select:**
A content moderator's most common need is "show me everything I still need to action": pending + reviewed together. Both represent unresolved states. With single-select, the moderator sees `pending` or `reviewed` separately but not the combined queue. Multi-select OR semantics gives them a "unresolved work queue" in one view.

**Counter-argument:**
The linear review workflow (pending → reviewed → resolved/dismissed) matches single-select naturally. The existing count badges next to each tab give the moderator a quick overview without needing to change selection. Converting to multi-select removes the clarity of "I am working in exactly this stage."

**Design note:** The current UI uses underline-tab style (border-b, -mb-px). Converting to multi-select would change this to a chip-group (toggle buttons) style — a minor visual redesign. Count badges are already present; these should be preserved.

**Verdict: CONVERT** — the triage benefit (combined unresolved queue) is concrete and used frequently by moderators. The tab-style UI would change to chip-group style (acceptable). Estimated effort: **medium** (local state + UI pattern change from underline-tabs to chip-group + count badges preserved).

---

### #4 AdminSupportManager — typeFilter → KEEP

**Current UX:** all / support / user_complaint — ticket type classification.

**Triage argument FOR multi-select:** None. Ticket types are categorically exclusive (a ticket is either a support request or a user complaint). Showing both at once is equivalent to "all." No workflow benefit from multi-select.

**Verdict: KEEP as single-select.**

---

### #5 AdminSupportManager — statusFilter → DEFER

**Current UX:** '' (all) / open / in_progress / resolved / closed — ticket lifecycle stages.

**Triage argument FOR multi-select:** Low. "Open + in_progress" = active tickets is the most likely multi-select use case, but the "all" option already covers this. Internal support tickets have a tighter workflow than public inquiries/reports.

**Verdict: DEFER.** Low ROI; "all" covers the combined need. Can be revisited in a dedicated admin UX sprint if internal team requests it.

---

### #6 AdminListingsTable — Combobox status → DEFER

**Current UX:** Single-select Combobox (URL-state) with all listing statuses (active/pending/inactive/archived/sold/rented).

**Triage argument FOR multi-select:** Medium. "Show active AND pending" is useful for admin review of new submissions alongside live listings.

**Counter-argument:** URL-state multi-select requires comma-separated convention (like Task 294) but admin tables don't use `filterEngine.ts`. Combobox component doesn't natively support multi-select; would need to switch to a `FilterMultiToggle` or similar. Medium/large effort with Note 22 risk.

**Verdict: DEFER.** Higher effort than local-state filters; lower ROI than the triage surfaces.

---

### #7 AdminUsersTable — role filter → DEFER

**Current UX:** Raw button chips (URL-state) — '' (all) / user / agent / moderator / admin.

**Triage argument FOR multi-select:** Low-medium. "Show agents AND moderators" for a combined staff view is plausible.

**Counter-argument:** URL-state + raw `<button>` (not canonical `<Button>` — a governance debt that's out of scope here). Touching this requires Note 22 inventory of the full table. Lower ROI.

**Verdict: DEFER.** Role filtering is infrequently combined; "all" covers most admin needs.

---

### #8 AdminUsersTable — status filter → DEFER

**Current UX:** Raw button chips (URL-state) — '' (all) / active / inactive / blocked.

**Triage argument FOR multi-select:** None meaningful. An admin checking blocked users uses a single "blocked" filter; "active + inactive" = most users = "all". No concrete combined-status use case.

**Verdict: DEFER.**

---

## Summary

| Verdict | Filters | Estimated effort |
|---------|---------|-----------------|
| **CONVERT** | #1 AdminInquiriesManager statusFilter, #3 AdminReportsManager filter | small + medium |
| **KEEP** | #2 AdminInquiriesManager mailboxFilter, #4 AdminSupportManager typeFilter | — |
| **DEFER** | #5–#8 (SupportManager statusFilter, ListingsTable status, UsersTable role/status) | — |

---

## Phase 2 decision — DEFERRED (owner/orchestrator 2026-05-30)

**Phase 2 will NOT be implemented in Task 299.**

The owner has identified a broader Admin UX System problem that makes partial filter conversion premature:
- Inconsistent admin table widths and responsive behavior
- Missing column sorting
- Too many filter buttons / inconsistent filter patterns across surfaces
- Inconsistent table / card / modal / dialog UX
- Narrow breakpoint failures (320/375/390) affecting admin surfaces broadly

Converting only 2 of 8 filters now would create another partial patch that may conflict with the upcoming canonical Admin UX System / AdminFilterBar architecture work.

**Status:** Task 299 closes as **documentation-only**. This evaluation report serves as input for the future Opus-led Admin UX System Epic. The CONVERT recommendations above are preserved as a starting point for that epic's filter design decisions.
