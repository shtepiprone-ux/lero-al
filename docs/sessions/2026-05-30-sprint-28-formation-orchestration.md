# Session Archive: Sprint 28 Formation — Admin Mobile Responsive + Canonical StatusChangeControl Foundation (Opus orchestration) — 2026-05-30

> **Layer:** Opus 4.7 orchestrator / architect / Lead QA. NO product code touched. Planning + governance files only.
> **Trigger:** Owner directive 2026-05-30 (two STOP-messages: admin status-workflow inconsistency + admin mobile 375px QA failure).
> **Outcome:** Sprint 28 FORMED. 6 kickoffs written. Task 326B BLOCKED. Task 326A visual QA narrowed. Epic HH Phase 2-3 activated under reduced scope. Owner decisions captured.

## 1. Trigger — owner STOP messages (2026-05-30)

### Message 1 — Admin status-workflow inconsistency

> Виявлена критична UX-непослідовність у статусах адмінки. У complaint/ticket detail modal зміна статусу реалізована як окремий workflow-блок з кнопками статусів, приміткою, кнопкою "Оновити статус" і хронологією. У inquiry/request detail modal статус змінюється через простий dropdown у верхній інформаційній картці. Це однакова за суттю адмінська дія — зміна статусу об'єкта, але UI/UX і функціонал різні. Необхідно не локально переробити один popup, а сформувати канонічний admin status workflow pattern для всіх admin modal/detail surfaces.

Expectations stated:
- one canonical `StatusChangeControl` OR clear shared pattern;
- identical behaviour for statuses in complaints/tickets/inquiries/support-related modals;
- identical badge/select/buttons system;
- identical save/loading/error/success behaviour;
- status history + notes either standardized OR explicitly justified as domain-specific exception;
- sq/en/uk/it coverage;
- 320/375/390/768/1280/1440/2560 coverage;
- existing status transitions + timeline/history MUST NOT break.

### Message 2 — Admin mobile 375px QA failure (STOP)

Owner manually tested admin at 375px and found blocking responsive defects across multiple admin surfaces:
- `/admin/complaints` tabs/table overflow;
- complaint detail modal overflows + clips right-side content;
- `/admin/listings` table/card content clips horizontally;
- `/admin/users` header/count/action overlap + table clips;
- `/admin/tickets` layout differs from support/sales request patterns;
- `/admin/support` + `/admin/sales` request lists use another status/list pattern;
- status change UX is inconsistent across detail modals.

Directives:
- Do not mark 7-breakpoint QA PASS.
- Do not start Task 326B.
- Do not approve final closure until admin mobile responsive foundation is corrected.
- Required next action: focused follow-up for global Admin Mobile Responsive + Status Workflow Consistency.
- 326A may remain code/build/sql DONE but visual QA gate stays BLOCKED until the owner confirms the relevant `/admin/pages` + public renderer surfaces.

## 2. Code-level diagnosis (read-only inventory)

Confirmed at code level — 4 different status-change UX patterns across 4 components:

| Component | Pattern | File / lines |
|-----------|---------|--------------|
| `AdminSupportManager` (ticket detail modal) | Workflow block: status pills + optional note Textarea + "Update status" Button + history timeline | `src/components/admin/AdminSupportManager.tsx` lines 254–402 |
| `AdminInquiriesManager` (inquiry detail card) | Simple `Combobox` immediate-save dropdown | `src/components/admin/AdminInquiriesManager.tsx` lines 124–137, 290–296 |
| `AdminReportsManager` (report detail card) | Inline action buttons (`handleAction(newStatus)`) + notes Textarea | `src/components/admin/AdminReportsManager.tsx` lines 57–146 |
| `AdminListingsTable` (per-row transitions) | Per-current-status transition button cluster via `STATUS_ACTIONS` map | `src/components/admin/AdminListingsTable.tsx` lines 31–62 |

Confirmed admin route → component mapping:
- `/admin/support` → `AdminSupportManager` (both `support` + `user_complaint` ticket types via `typeFilter`)
- `/admin/listings` → `AdminListingsTable`
- `/admin/users` (+ verified-agents subset) → `AdminUsersTable`
- `/admin/inquiries/support` → `AdminInquiriesManager` (mailbox=support)
- `/admin/inquiries/sales` → `AdminInquiriesManager` (mailbox=sales)
- `/admin/reports` → `AdminReportsManager`

Owner-flagged "complaints" route does not exist as a separate URL — complaints live inside `AdminSupportManager` via `ticket_type='user_complaint'` filter; same for "tickets" via `ticket_type='support'`. The shared `TicketDetail` modal is THE locus of the canonical workflow-block status UX.

## 3. Product decisions (asked + answered 2026-05-30)

Three questions surfaced to owner via AskUserQuestion before any kickoff writing (orchestrator rule: kickoffs must be concrete, not abstract; owner-only decisions cannot be invented).

### Decision 1 — Canonical `StatusChangeControl` tier model

**Answer:** Tiered (low-stakes vs moderation).
- `variant="select"` — simple `Combobox` for low-stakes (Inquiries: new/in_progress/closed).
- `variant="workflow"` — pills + optional note + Update button + timeline for moderation/destructive (tickets, complaints, listings transitions).
- One shared component; surfaces declare `variant` + `transitions` whitelist.
- Apply only where required to fix owner-flagged inconsistency on the 6 surfaces; defer wider adoption to a separate follow-up.

### Decision 2 — Sprint 28 scope

**Answer:** Owner-flagged 6 surfaces only.
- `/admin/support` (complaints filter `ticket_type='user_complaint'`)
- `/admin/support` (tickets filter `ticket_type='support'`)
- `/admin/listings`
- `/admin/users`
- `/admin/inquiries/support` (support requests)
- `/admin/inquiries/sales` (sales requests)

Goal: Fix real visible 320/375/390 mobile failures first (horizontal overflow, clipped tabs, table/card width overflow, modal content clipping, header/title/count/action overlap, unreachable actions, inconsistent mobile list/detail layout). All fixes cover sq/en/uk/it and 320/375/390/768/1280/1440/2560.

Do not expand to all 18 admin routes. Remaining routes covered by follow-up audit/pass.

StatusChangeControl designed as the canonical tiered shared primitive, but applied only where required on the 6 surfaces; wider adoption deferred.

### Decision 3 — Task 303 audit severity reclassification

**Answer:** Task 303 audit SUPERSEDED for severity by new evidence-driven matrix.
- Task 303 body remains useful as historical inventory.
- Sprint 28 uses owner screenshot evidence as the current severity baseline.
- Severity classification:
  - **CRITICAL** = blocks reading, editing, status changes, modal use, or causes horizontal overflow / clipped content at 320/375/390.
  - **HIGH** = usable but visibly degraded, inconsistent, or risky at mobile breakpoints.
  - **MEDIUM** = polish/consistency issue that does not block the admin action.
  - **LOW** = cosmetic only.

Do not call current mobile state PASS. Do not start 326B until 326A-specific 7-breakpoint gate and Sprint 28 blocking admin mobile issues are properly classified.

## 4. Sprint 28 task graph

| # | Task | Type | Output | Depends on | Parallel-safe |
|---|------|------|--------|-----------|---------------|
| 1 | **327** Owner evidence-driven mobile QA matrix + Task 303 severity supersession | AUDIT-ONLY | `docs/governance-reports/2026-05-30-sprint-28-admin-mobile-evidence-matrix.md` + `docs/admin-ux-rules.md §4` severity column + Task 303 session-log supersession banner | — | ‖ Task 328 |
| 2 | **328** Canonical `StatusChangeControl` spec + per-surface assignment | SPEC-ONLY | `docs/admin-ux-rules.md §13` + 4-implementation inventory in session log | — | ‖ Task 327 |
| 3 | **306** `AdminPageShell` + `AdminTable` controlled-scroll + `AdminCardList` card-row primitives + listings pilot | IMPLEMENTATION | 3 new canonical primitives + storybook + AdminListingsTable shell migration (pilot) | Task 327 | ‖ Task 307 |
| 4 | **307** `StatusChangeControl` + `StatusChangeHistory` primitive + inquiries pilot | IMPLEMENTATION | 2 new canonical primitives + storybook + AdminInquiriesManager `variant="select"` pilot + 11 new locale keys × 4 locales | Task 328 | ‖ Task 306 |
| 5 | **308** Migrate `/admin/listings` + `/admin/users` to AdminPageShell + AdminTable; StatusChangeControl `variant="workflow"` in listings transitions; sort URL state | IMPLEMENTATION | 2 component migrations + Sheet-on-narrow row-action fallback | Tasks 306 + 307 | ‖ Task 309 |
| 6 | **309** Migrate `/admin/support` + `/admin/inquiries/{support,sales}` to AdminPageShell + AdminCardList; Sheet detail modals on `<md`; StatusChangeControl `variant="workflow"` in AdminSupportManager + `variant="select"` finalized in AdminInquiriesManager | IMPLEMENTATION | 2 component migrations + Sheet bottom-drawer pattern | Tasks 306 + 307 | ‖ Task 308 |

Run order: **327 ‖ 328** (owner G1+G2 gates) **→ 306 ‖ 307** (owner G3+G4 gates) **→ 308 + 309** (owner G5+G6 gates) **→ G7 Sprint 28 close → 326B unblocked**.

## 5. Numbering rationale

Backlog "Next free: 327" before this session. Sprint 28 consumes:
- **327** + **328** (new, from free pool).
- **306** + **307** (Epic HH Phase 2 reserved range — activated under Sprint 28 with reduced scope).
- **308** + **309** (Epic HH Phase 3 reserved range — activated under Sprint 28 with reduced scope).

Remaining Epic HH reserved numbers unconsumed:
- **310** (Phase 4 — 12 remaining admin routes, deferred).
- **311** (Phase 5 — modal migration generalization, deferred; Sprint 28 ships the Sheet pattern proven on support+inquiries).
- **313** (Phase 6 — Verified Agents workflow, blocked on owner DB schema approval).
- **312** unused (was an optional Phase 5 placeholder).

Next free after Sprint 28: **329**.

## 6. Sonnet hard-contract clauses encoded in every Sprint 28 kickoff

Per `docs/orchestrator-role.md` "Hard contract embedded in EVERY Sonnet prompt":
- Pre-read list (task-type-specific per `docs/rule-index.md`; no "read all docs").
- Current behavior to preserve (Notes 19/20/21/22/23 depending on task scope).
- Positive flow (happy path) end-to-end.
- Negative flow (every off-happy-path branch) — cancel/dismiss, validation error, server error, permission denied, not found, empty state, loading, double submit, network offline, expired session, locale mismatch, admin-vs-owner-vs-guest, conflict-with-another-writer.
- Acceptance criteria with literal behavioral bullets traceable to Positive + Negative flow lines.
- Self-validation block (Note 18): `tsc=0 errors · build=passes · AC table=all green · runtime locale=uk PASS · scope=clean`.
- UX flow trace (Note 19).
- Before/after control inventory (Notes 20/22).
- Files Changed table (Task 264 rule); no `git add` / `git commit` emitted by Sonnet.
- Out of scope HARD list.
- Notes for orchestrator review (review-side parity).

## 7. Cross-Epic + cross-Sprint impact

- **Sprint 27**: Task 326A's broader visual QA gate REDUCED to `/admin/pages` + `[locale]/[slug]` only (owner-verifies these independently of Sprint 28). Task 326B BLOCKED until Sprint 28 ships.
- **Epic HH**: Phase 2-3 ACTIVATED under Sprint 28 with reduced scope (owner-flagged 6 surfaces only). Phase 4 (Task 310 — remaining 12 routes) DEFERRED. Phase 5 (Task 311) DEFERRED; Sprint 28 proves the Sheet-on-narrow pattern. Phase 6 (Task 313) independent + still blocked on owner DB schema.
- **Epic II**: independent track. Sprint 24 (316/317/318) audits + Sprint 25 (315 + 324) hotfixes proceed in parallel.

## 8. Self-validation (orchestrator session)

| Orchestrator review checklist (rule from `docs/orchestrator-role.md`) | Status |
|-----------------------------------------------------------------------|--------|
| Plans + writes kickoffs to FILES, not chat | ✅ 6 kickoff files + Sprint 28 plan + Epic HH update + backlog update + this session log |
| Kickoffs concrete (current-behavior + positive/negative flow + literal AC) | ✅ all 6 |
| Pre-read selected per `docs/rule-index.md` per task type | ✅ each kickoff has explicit task-type Pre-read |
| No "read all docs" anywhere | ✅ |
| Sonnet hard contract embedded | ✅ each kickoff |
| Positive + Negative flow sections | ✅ each kickoff (and Sprint plan G1-G7 gates) |
| Locale parity rules: sq/en/uk/it | ✅ encoded in every kickoff that touches text |
| Breakpoint coverage: 320/375/390/768/1280/1440/2560 | ✅ each impl kickoff |
| Files Changed table requirement | ✅ each kickoff |
| Single-writer git rule (no commit cmds by Sonnet) | ✅ |
| Orchestrator NO product code modifications | ✅ this session touched ONLY `docs/`, `tasks/` files |
| Decisions captured + linked | ✅ Owner Decisions 1-3 in Sprint 28 plan + Epic HH file |
| Task 303 supersession recorded | ✅ Epic HH file + backlog + Task 327 kickoff |
| 326B explicit block | ✅ backlog + Sprint 27 row + Sprint 28 plan + Task 327 kickoff (cross-reference) |
| Numbering coherent + Next free updated | ✅ 327 + 328 new; 306-309 activated; Next free 329 |

Self-validation: `scope=docs+tasks only · diff=no src/messages/scripts/supabase · numbering=coherent · decisions=captured · cross-refs=valid · 326B=blocked · 326A QA=reduced · Task 303=superseded for severity`.

## 9. Files Changed

| File | Rationale |
|------|-----------|
| `tasks/Sprints/Sprint_28_—_Admin_Mobile_Responsive_and_Status_Workflow_Foundation.md` | NEW — Sprint 28 plan: scope, run order, owner gates, exit criteria, out-of-scope |
| `tasks/Sprints/Sprint_28_kickoff_prompt_Task_327.md` | NEW — Sonnet kickoff: owner evidence-driven mobile QA matrix + Task 303 severity supersession (audit-only) |
| `tasks/Sprints/Sprint_28_kickoff_prompt_Task_328.md` | NEW — Sonnet kickoff: canonical `StatusChangeControl` spec + per-surface assignment (spec-only) |
| `tasks/Sprints/Sprint_28_kickoff_prompt_Task_306.md` | NEW — Sonnet kickoff: `AdminPageShell` + `AdminTable` + `AdminCardList` primitives + listings pilot |
| `tasks/Sprints/Sprint_28_kickoff_prompt_Task_307.md` | NEW — Sonnet kickoff: `StatusChangeControl` + `StatusChangeHistory` primitive + inquiries pilot |
| `tasks/Sprints/Sprint_28_kickoff_prompt_Task_308.md` | NEW — Sonnet kickoff: migrate `/admin/listings` + `/admin/users` |
| `tasks/Sprints/Sprint_28_kickoff_prompt_Task_309.md` | NEW — Sonnet kickoff: migrate `/admin/support` + `/admin/inquiries/{support,sales}` |
| `tasks/Epics/Epic_HH_Admin_UX_System.md` | EDIT — Phase status table updated (Phase 2-3 ACTIVATED under Sprint 28; Phase 4-5 DEFERRED); Sprint 28 emergency activation section + owner Decisions 1-3 added |
| `docs/backlog.md` | EDIT — Last-session block updated (Sprint 28 FORMED + 326A QA narrowed + 326B BLOCKED); Next-Immediate-Tasks "Last task number" updated to 328; Sprint 28 row added to Active product backlog table; pre-written kickoffs list updated |
| `docs/sessions/2026-05-30-sprint-28-formation-orchestration.md` | NEW — this orchestrator session log |

## 10. Commit emission

NO commits emitted in this session. Per Task 264 + orchestrator rule, commits are emitted per task at review time, not pre-staged. This session creates planning + governance files only — when owner is ready to commit them in one batch, the orchestrator-emitted command will be:

```
git add tasks/Sprints/Sprint_28_—_Admin_Mobile_Responsive_and_Status_Workflow_Foundation.md ^
        tasks/Sprints/Sprint_28_kickoff_prompt_Task_327.md ^
        tasks/Sprints/Sprint_28_kickoff_prompt_Task_328.md ^
        tasks/Sprints/Sprint_28_kickoff_prompt_Task_306.md ^
        tasks/Sprints/Sprint_28_kickoff_prompt_Task_307.md ^
        tasks/Sprints/Sprint_28_kickoff_prompt_Task_308.md ^
        tasks/Sprints/Sprint_28_kickoff_prompt_Task_309.md ^
        tasks/Epics/Epic_HH_Admin_UX_System.md ^
        docs/backlog.md ^
        docs/sessions/2026-05-30-sprint-28-formation-orchestration.md
git commit -m "docs(Sprint28): form Admin Mobile Responsive + StatusChangeControl Foundation (6 kickoffs); supersede Task 303 severity; block 326B"
```

⚠️ NOTE: the `^` continuation form above is PowerShell-incorrect (Task 264 lesson). Owner should run as a SINGLE LINE — orchestrator will re-emit on actual review request from owner. This snippet is illustrative; do not run as-is.

Single-line PowerShell:

```
git add tasks/Sprints/Sprint_28_—_Admin_Mobile_Responsive_and_Status_Workflow_Foundation.md tasks/Sprints/Sprint_28_kickoff_prompt_Task_327.md tasks/Sprints/Sprint_28_kickoff_prompt_Task_328.md tasks/Sprints/Sprint_28_kickoff_prompt_Task_306.md tasks/Sprints/Sprint_28_kickoff_prompt_Task_307.md tasks/Sprints/Sprint_28_kickoff_prompt_Task_308.md tasks/Sprints/Sprint_28_kickoff_prompt_Task_309.md tasks/Epics/Epic_HH_Admin_UX_System.md docs/backlog.md docs/sessions/2026-05-30-sprint-28-formation-orchestration.md
git commit -m "docs(Sprint28): form Admin Mobile Responsive + StatusChangeControl Foundation (6 kickoffs); supersede Task 303 severity; block 326B"
```

Owner runs in PowerShell at C:\Claude_Code_Projects\lero-al when ready.

## 11. Next actions (Sonnet — when owner releases)

1. Sonnet picks up `tasks/Sprints/Sprint_28_kickoff_prompt_Task_327.md` (parallel-safe with 328).
2. Sonnet picks up `tasks/Sprints/Sprint_28_kickoff_prompt_Task_328.md` (parallel-safe with 327).
3. Owner gate G1 + G2 after both ship (single review batch).
4. Sonnet picks up 306 ‖ 307 after owner sign-off.
5. Owner gate G3 + G4.
6. Sonnet picks up 308 + 309 in parallel.
7. Owner gate G5 + G6 then Sprint 28 close G7.
8. Sprint 27 Task 326B becomes UNBLOCKED.
