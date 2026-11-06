# Sprint 28 — Task 327 kickoff (Owner evidence-driven admin mobile QA matrix + Task 303 severity supersession)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits. **AUDIT-ONLY task — NO product source code may be touched.**

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is an **audit/spec-only task** — your output is a governance report doc + targeted updates to `docs/admin-ux-rules.md` + an annotation on `docs/sessions/2026-05-30-task-303-admin-responsive-audit.md`. Pre-read: `docs/orchestrator-role.md`, `docs/ai-behavior.md` (Notes 18/19/20), `docs/qa-rules.md`, `docs/admin-ux-rules.md` (current), `docs/sessions/2026-05-30-task-303-admin-responsive-audit.md` (the audit you are SUPERSEDING for severity), `tasks/Sprints/Sprint_28_—_Admin_Mobile_Responsive_and_Status_Workflow_Foundation.md` (your sprint context). No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 327 = first audit in Sprint 28. Parallel-safe with Task 328 (spec audit). Both must complete before Task 306 starts.

---

```
Type:        audit (governance report + doc updates)
Priority:    HIGH (blocks Task 306 admin shell primitives)
Area:        docs/governance-reports/ + docs/admin-ux-rules.md + docs/sessions/<task-303>
```

## Why this task exists

Task 303 (Epic HH Phase 1 audit, 2026-05-30) produced a 18-route × 7-bp evidence matrix and classified findings as **0 CRITICAL / 7 HIGH / 22 MEDIUM / 6 LOW**. Owner performed manual 375px QA on 2026-05-30 (post-Task-303) and observed CRITICAL admin mobile defects on 6 surfaces that Task 303 had marked HIGH or MEDIUM:

- `/admin/support` complaints tabs/table overflow
- complaint detail modal overflows and clips right-side content
- `/admin/listings` table/card content clips horizontally
- `/admin/users` header/count/action overlap and table clips
- `/admin/inquiries/support` and `/admin/inquiries/sales` layouts use different status/list patterns
- status-change UX is inconsistent across detail modals

Owner directive (Sprint 28 decision 3): **Task 303 audit is SUPERSEDED for severity** by a new evidence-driven matrix scoped to the 6 owner-flagged surfaces. Task 303 stays as historical inventory only.

Task 327 produces that new matrix.

## Current behavior to preserve (Notes 19/20)

`AUDIT-ONLY task — no product code is touched.` The "current behavior" you preserve here is the **documentation contract**:

- `docs/admin-ux-rules.md` — your edits MUST only ADD or REFINE sections; never silently delete approved sections (sections 1-12 capture Epic HH Phase 1 approved decisions and must remain intact). Append a new sub-section if needed, OR refine the per-route policy table (§4) with severity columns.
- `docs/sessions/2026-05-30-task-303-admin-responsive-audit.md` — your annotation MUST be additive (a top-of-file "SUPERSEDED for severity" banner + a closing pointer to the new governance report). DO NOT rewrite Task 303's body.
- `docs/governance-reports/` — new report file. No replacement of existing governance reports.

## Positive flow (happy path)

As Sonnet 4.6 producing this audit:

1. Open the running app (`npm run dev`) at admin URLs `/uk/admin/support`, `/uk/admin/support` (with complaints filter), `/uk/admin/listings`, `/uk/admin/users`, `/uk/admin/inquiries/support`, `/uk/admin/inquiries/sales`.
2. For each of the 5 components above (note: `/admin/support` covers both complaints + tickets via filter, so only 5 components for 6 surfaces) AND the shared ticket-detail modal + inquiry-detail modal:
   - Capture the rendered layout at 7 breakpoints (320, 375, 390, 768, 1280, 1440, 2560) × 4 locales (sq, en, uk, it).
   - For each cell, classify the defect (if any) using the owner severity baseline:
     - **CRITICAL** = blocks reading, editing, status changes, modal use, OR causes horizontal overflow / clipped content at 320/375/390.
     - **HIGH** = usable but visibly degraded, inconsistent, or risky at mobile breakpoints.
     - **MEDIUM** = polish/consistency issue that does not block the admin action.
     - **LOW** = cosmetic only.
   - For each defect, write a concrete description: what overflows / what clips / what overlaps / which action is unreachable / which i18n string raw-keys / which control reflows poorly. NO abstract phrasing ("looks bad").
3. Write the matrix to a NEW file:
   - `docs/governance-reports/2026-05-30-sprint-28-admin-mobile-evidence-matrix.md`
   - Use markdown tables: one table per surface, rows = breakpoints, columns = locales, cells = severity letter + 1-line defect note.
   - One section per surface: "Surface 1 — /admin/support (Internal Tickets + Complaints)" etc.
   - For shared ticket-detail modal: one dedicated table; same for inquiry-detail modal.
4. Add a "Severity rollup" table at the top of the report (surface × max severity).
5. Add a "Comparison with Task 303" section explaining how cells reclassify from Task 303 (mostly HIGH/MEDIUM) to the new baseline (mostly CRITICAL/HIGH for the 6 surfaces).
6. Edit `docs/admin-ux-rules.md`:
   - In §4 Per-Route Policy Table, ADD a new column "Severity baseline (Sprint 28)" with CRITICAL / HIGH / MEDIUM / LOW per route — populate ONLY for the 6 owner-flagged surfaces; leave blank for others (will be filled by a future audit).
   - Add a new sub-section §4.1 "Severity baseline source-of-truth" stating: "Severity for owner-flagged 6 surfaces comes from `docs/governance-reports/2026-05-30-sprint-28-admin-mobile-evidence-matrix.md`. Task 303 severity is historical inventory only and MUST NOT be used to plan Sprint 28+ work."
7. Edit `docs/sessions/2026-05-30-task-303-admin-responsive-audit.md`:
   - Insert at the top (under H1 heading) a `> ⚠️ **SUPERSEDED for severity 2026-05-30 by Sprint 28 Task 327.** This audit's inventory of components and breakpoints remains valid as historical reference, but its severity classification is no longer authoritative. See `docs/governance-reports/2026-05-30-sprint-28-admin-mobile-evidence-matrix.md`.` blockquote.
   - Append a closing "Supersession note 2026-05-30 (Sprint 28 Task 327)" paragraph linking the new governance report.
   - DO NOT rewrite the body.
8. Update `docs/backlog.md` per backlog rules (your job; orchestrator audits).
9. Write session log `docs/sessions/2026-05-30-task-327-admin-mobile-evidence-matrix.md` per Note 18 self-validation + Files Changed table.

## Negative flow (every off-happy-path branch)

- **Defect not reproducible on your machine at one breakpoint** → mark cell `?` with note "owner screenshot confirms; local repro unclear — request owner re-verify at this combination". Do NOT mark PASS to avoid blocking.
- **Locale renders raw i18n key** → CRITICAL (i18n hardcode / missing key = blocks user action) — flag for Epic II Task 316 cross-reference in the cell note.
- **Component already migrated mid-session by parallel Sonnet on Task 328** → STOP. Do NOT continue auditing. Re-pull repo, confirm Task 328 has only touched docs (its kickoff is spec-only), then resume.
- **Detail modal does not open** on one breakpoint → CRITICAL with note "modal trigger failed at this breakpoint".
- **Status-change button hidden / unreachable** at a breakpoint → CRITICAL — direct confirmation of owner-named "unreachable actions" failure mode.
- **5 surfaces × 7 bp × 4 loc = 140 audit cells but you find one combination you literally cannot test** (e.g. real 2560 monitor unavailable) → use browser devtools to simulate; if devtools cannot reach 2560, document the limitation in the cell ("simulated via devtools at 2560") and proceed.
- **Owner screenshot evidence appears more severe than your audit finds** → trust owner evidence; reclassify upward and note the divergence at the cell-level ("owner screenshot shows CRIT; local repro shows HIGH at this combination — using owner baseline").
- **Task 303 audit shows a finding you cannot reproduce** → do NOT mark Task 303 wrong. Note "Task 303 finding X not reproduced at <combination>; possibly fixed by intermediate Sprint 21/26/27 changes" — Task 303 stays valid as historical inventory.
- **You feel like also auditing /admin/reports or /admin/locations** → STOP & ASK. Sprint 28 scope is the 6 owner-flagged surfaces only. Do NOT expand.
- **An admin-ux-rules.md section seems wrong** → DO NOT delete or rewrite. STOP & ASK with the specific section and proposed change.

## Required investigation (paste in session log BEFORE writing the report)

```
# 1. Confirm 5 components + 5 routes + 1 ticket-detail modal + 1 inquiry-detail modal
ls src/app/admin/support src/app/admin/listings src/app/admin/users src/app/admin/inquiries
grep -nE 'export (default )?function|TicketDetail|InquiryDetail' \
  src/components/admin/AdminSupportManager.tsx \
  src/components/admin/AdminListingsTable.tsx \
  src/components/admin/AdminUsersTable.tsx \
  src/components/admin/AdminInquiriesManager.tsx | head -40

# 2. Confirm ticket_type filter mechanism (complaints vs tickets share one component)
grep -n "typeFilter\|ticket_type" src/components/admin/AdminSupportManager.tsx | head -10

# 3. Confirm mailbox=support|sales mechanism (inquiries-support vs inquiries-sales share one component)
grep -n "mailbox\|scope" src/components/admin/AdminInquiriesManager.tsx | head -10

# 4. Reaffirm Task 303 severity baseline before superseding
head -80 docs/sessions/2026-05-30-task-303-admin-responsive-audit.md
```

## Acceptance criteria

- A NEW file exists at `docs/governance-reports/2026-05-30-sprint-28-admin-mobile-evidence-matrix.md` with:
  - Severity rollup table.
  - One section per surface (5 components covering 6 owner-flagged surfaces) + shared ticket-detail modal section + inquiry-detail modal section.
  - Each section has a 7-row × 4-col table (bp × locale) with severity letter + 1-line defect note per cell, OR `—` for PASS cells.
  - At least one CRITICAL cell per surface (otherwise the owner directive that owner observed CRITICAL would not be captured).
  - "Comparison with Task 303" closing section.
- `docs/admin-ux-rules.md` §4 has a NEW "Severity baseline (Sprint 28)" column populated for owner-flagged 6 surfaces only; blank for other 12 routes.
- `docs/admin-ux-rules.md` has a NEW §4.1 "Severity baseline source-of-truth" sub-section.
- `docs/sessions/2026-05-30-task-303-admin-responsive-audit.md` has a top-of-file SUPERSEDED banner + closing supersession note. Body untouched.
- `docs/backlog.md` Last-Session block updated per backlog rules (≤80 active lines).
- `docs/sessions/2026-05-30-task-327-admin-mobile-evidence-matrix.md` exists with Note 18 self-validation block + Files Changed table (governance-report file + admin-ux-rules.md + task-303 session log + backlog + this session log).
- `npx tsc --noEmit` → 0 errors (verify no incidental code drift even though task is audit-only).
- Zero source-code (`src/`, `messages/`, migrations) modifications.

## Out of scope (HARD)

- Any change under `src/`.
- Any change under `messages/`.
- Any change under `scripts/` or `supabase/`.
- Any change to Task 303's body (annotation only).
- Audits of admin routes outside the 6 owner-flagged surfaces.
- Severity reclassification of Task 303's other 12 routes.
- StatusChangeControl design — that is Task 328's scope.
- Building primitives — that is Task 306's scope.
- Migrating surfaces — that is Tasks 308 + 309's scope.

## Notes for orchestrator review

- The 5 owner-flagged components (covering 6 surfaces) collapse to: `AdminSupportManager`, `AdminListingsTable`, `AdminUsersTable`, `AdminInquiriesManager`. Plus the shared ticket-detail modal (rendered inside AdminSupportManager) and the inquiry-detail modal (inside AdminInquiriesManager).
- Severity supersession is decided; the audit's job is to populate the matrix, not to re-litigate whether Task 303 was wrong.
- Orchestrator will reject the diff if Sonnet edits any product code file or marks a single CRITICAL cell with only "unclear / needs review".
