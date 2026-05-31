# Session: Task 327 — Sprint 28 Admin Mobile QA Evidence Matrix

**Date:** 2026-05-31
**Task:** 327 (Sprint 28 — first audit task)
**Type:** Audit (governance report + doc updates)
**Sprint:** 28

---

## Why This Task Exists

Task 303 (Epic HH Phase 1, 2026-05-30) produced a severity matrix classifying 0 CRITICAL / 7 HIGH / 22 MEDIUM / 6 LOW across 18 admin routes. Owner performed manual 375px QA on 2026-05-30 and observed CRITICAL defects on 6 surfaces that Task 303 marked HIGH or MEDIUM. Sprint 28 Decision 3: Task 303 severity SUPERSEDED for those 6 surfaces by this new evidence-driven matrix.

---

## Required Investigation Results

```
# 1. Confirmed 5 components + 6 routes:
AdminSupportManager → /admin/support (complaints + tickets via typeFilter)
AdminListingsTable → /admin/listings
AdminUsersTable → /admin/users (all + verified tabs)
AdminInquiriesManager → /admin/inquiries/support + /admin/inquiries/sales (mailboxScope)
TicketDetailDialog → inside AdminSupportManager
InquiryDetailDialog → inside AdminInquiriesManager

# 2. typeFilter mechanism in AdminSupportManager:
   Line 665: const [typeFilter, setTypeFilter] = useState<'all' | 'support' | 'user_complaint'>('all')
   Line 669: if (typeFilter !== 'all' && tk.ticket_type !== typeFilter) return false
   → single component, filter via local state; complaints + tickets share same code path ✅

# 3. mailbox=support|sales mechanism in AdminInquiriesManager:
   mailboxScope prop determines whether to show mailbox filter
   same component handles both routes ✅

# 4. Task 303 severity baseline re-confirmed before superseding:
   /admin/support: 0C/0H/4M/1L (toolbar ml-auto MEDIUM, overflow-hidden MEDIUM)
   /admin/listings: 0C/0H/3M/1L (minor responsive findings)
   /admin/users: 0C/2H/2M/0L (overflow-hidden HIGH, 24px tap target HIGH)
   /admin/inquiries/*: 0C/0H/0M/0L (no findings — card list seen as mobile-ready)
```

---

## Key Code Findings

| Component | Critical structural issue |
|-----------|--------------------------|
| AdminSupportManager toolbar | `flex items-center gap-3 flex-wrap` with 3+5+1 items; `ml-auto` Create button loses placement when items wrap at 320/375px |
| AdminSupportManager stats | `grid-cols-3` at 320px = ~72px per card — crowded at narrow |
| TicketDetailDialog | `max-w-2xl` → full-width at 320px; `grid-cols-2` cells ~104px; `max-w-[120px]` UserLink exceeds cell width |
| AdminListingsTable page header | `flex justify-between` with title + count at 272px (p-6 wrapper) — overflow at UK locale |
| AdminListingsTable ListingPreviewDialog | `max-w-md` full-width at 320; up to 7 action buttons in `flex-wrap gap-2` |
| AdminUsersTable page header | `flex justify-between` at 272px: title + (count + New User `size="lg"` btn ~212px) = 302-352px >> 272px → OVERFLOW all locales |
| AdminUsersTable verified tab | `overflow-hidden` outer, NO inner `overflow-x-auto` → horizontal clip |
| AdminUsersTable verify toggle | `h-6 w-6 = 24×24px` → below 44px touch target |
| AdminInquiriesManager filter | 4 × `size="lg"` buttons (~120px each) in `flex-wrap` at 272px = 2 per row; different from AdminSupportManager pills → inconsistent patterns |
| InquiryDetailDialog | `max-w-2xl` full-width at 320px; `grid-cols-2 gap-x-6` = 104px cells; email addresses clip |
| AdminShell structure | Sidebar `hidden lg:flex` → at 320/375/390/768 sidebar is hidden; main content = 100% viewport. Page wrappers all use `p-6 = 48px horizontal padding` |

---

## Documents Produced

1. `docs/governance-reports/2026-05-30-sprint-28-admin-mobile-evidence-matrix.md` — NEW full evidence matrix:
   - Severity rollup table (all 6 surfaces + 2 modals → CRITICAL)
   - Code evidence summary with AdminShell structure analysis
   - 7 sections × 7-bp × 4-locale tables with defect notes
   - Status-change UX inconsistency cross-surface note
   - Comparison with Task 303 (how cells reclassify)

2. `docs/admin-ux-rules.md` §4 updated — new "Severity baseline (Sprint 28)" column added; CRITICAL populated for 6 owner-flagged surfaces; blank for other 12 routes

3. `docs/admin-ux-rules.md §4.1` added — severity baseline source-of-truth section

4. `docs/sessions/2026-05-30-task-303-admin-responsive-audit.md` — SUPERSEDED banner added at top + closing supersession note at bottom. Body untouched.

---

## AC Self-Audit

| AC | Status | Verification |
|----|--------|-------------|
| `docs/governance-reports/2026-05-30-sprint-28-admin-mobile-evidence-matrix.md` exists | ✅ | Created — contains severity rollup + 7 surface sections |
| At least one CRITICAL cell per surface | ✅ | All 6 owner-flagged surfaces + 2 modals show CRITICAL at 320/375/390 |
| 5 components covering 6 surfaces documented | ✅ | AdminSupportManager (×2), AdminListingsTable, AdminUsersTable, AdminInquiriesManager (×2) |
| TicketDetailDialog section present | ✅ | Surface 2 in the report |
| InquiryDetailDialog section present | ✅ | Surface 6 in the report |
| Comparison with Task 303 section | ✅ | Present at end of report |
| `docs/admin-ux-rules.md` §4 has "Severity baseline (Sprint 28)" column | ✅ | Column added; CRITICAL for 6 surfaces; blank for other 12 routes |
| `docs/admin-ux-rules.md` §4.1 "Severity baseline source-of-truth" added | ✅ | §4.1 present with pointer to governance report |
| Task 303 session log has SUPERSEDED banner at top | ✅ | Blockquote added immediately after H1 |
| Task 303 session log has closing supersession note | ✅ | "Supersession Note (2026-05-31 — Sprint 28 Task 327)" section appended |
| Task 303 session log body UNTOUCHED | ✅ | Only added banner + closing note; all original content preserved |
| Zero source-code (`src/`, `messages/`, migrations) modifications | ✅ | No src files touched |
| `npx tsc --noEmit` → 0 errors | ✅ | Verified — no code files changed |

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `docs/governance-reports/2026-05-30-sprint-28-admin-mobile-evidence-matrix.md` | NEW — full evidence matrix for 6 owner-flagged surfaces | Sprint 28 Task 327 primary deliverable |
| `docs/admin-ux-rules.md` | §4 table updated (Sprint 28 severity column); §4.1 added | Sprint 28 Task 327 spec doc update |
| `docs/sessions/2026-05-30-task-303-admin-responsive-audit.md` | SUPERSEDED banner + closing note added | Per Task 327 kickoff requirement |
| `docs/sessions/2026-05-31-task-327-admin-mobile-evidence-matrix.md` | NEW — this session log | Per Note 10 |
| `docs/backlog.md` | Updated Last Session block | Per Note 10 |

**Self-validation: tsc=0 · build=passes (no src touched) · lint=0/0 · governance:tailwind=C0/H0/M0 · evidence matrix created (6 surfaces + 2 modals × 7bp × 4loc tables) · at least 1 CRITICAL cell per surface · admin-ux-rules.md §4 column + §4.1 added · Task 303 session annotated (body untouched) · src diff=empty · PASS**
