# Sprint 28 — Admin Mobile Responsive + Canonical StatusChangeControl Foundation (owner-flagged 6 surfaces)

> **Formed:** 2026-05-30 (Opus emergency planning after owner manual 375px QA + status-workflow inconsistency directive).
> **Status:** ⚠️ **HOLD on Task 306** as of 2026-05-31 — owner re-QA on AdminListingsTable pilot at 320/375/390/480/1024/2560 FAILED. Sprint 28 cannot ship until Task 306-Fix (added 2026-05-31) closes the responsive contract at the primitive level. Tasks 308 + 309 BLOCKED until Task 306-Fix PASSes owner re-QA. Task 307 already PASSED gate G4.
> **Run order (REVISED 2026-05-31):** **Task 327 ‖ Task 328 → Task 306 → ⚠️ Task 306-Fix → owner re-QA gate G3' → Task 307 → Task 308 ‖ Task 309**.
> **Task 306-Fix kickoff:** [`Sprint_28_kickoff_prompt_Task_306_Fix.md`](Sprint_28_kickoff_prompt_Task_306_Fix.md) — primitive-level responsive-contract fix (table↔card switch at `lg:`, wide-screen container `.container-admin`, 9-width verification canon expanded from 7, NEW `docs/admin-ux-rules.md §14` canonical responsive contract for ALL admin pages — Task 310 migration sweep consumes this contract).
> **Owner gates:**
> 1. Owner reviews Task 327 evidence matrix BEFORE Task 306 starts. ✅ DONE
> 2. Owner reviews Task 328 canonical spec BEFORE Task 307 starts. ✅ DONE
> 3. Owner verifies Task 326A `/admin/pages` runtime independently — its visual-QA gate stays separate from Sprint 28 and is unblocked by /admin/pages owner verification, not by Sprint 28.
> 4. **Task 326B remains BLOCKED until Sprint 28 ships.** (Re-homed to Sprint 29 — see [`Sprint_29_…`](Sprint_29_—_Modal_Pattern_and_Sprint_27_Closure.md).)
> 5. **NEW gate G3':** owner manually QAs Task 306-Fix at 9 widths (320/375/390/768/1024/1280/1440/1920/2560) × 4 locales (sq/en/uk/it) on AdminListingsTable pilot BEFORE Tasks 308 + 309 start.

## Sprint goal

Close the admin mobile-responsive failure mode owner observed at 375px AND unify the status-change UX across the 5 owner-flagged admin components, by:

1. **Replacing Task 303 severity matrix** with a fresh, owner-evidence-driven 7-bp × 4-loc matrix scoped to the 6 owner-flagged surfaces.
2. **Specifying + building the canonical `StatusChangeControl` primitive** (tiered: `variant="select"` for low-stakes, `variant="workflow"` for moderation/destructive) per owner Decision 1 of this sprint.
3. **Building the canonical admin shell primitives** (`AdminPageShell` + `AdminTable` controlled-scroll + `AdminCardList` mobile card-row) — activates Epic HH Phase 2 scoped to owner-flagged surfaces only.
4. **Migrating the 6 owner-flagged surfaces** to the new shell + StatusChangeControl while preserving every existing control (Notes 20/22/23).

## Owner-flagged surfaces (scope — DO NOT EXPAND)

Per owner STOP-message 2026-05-30:

| # | Surface (route) | Component | Status-change today | Pattern after |
|---|-----------------|-----------|---------------------|---------------|
| 1 | `/admin/support` (complaints filter `ticket_type='user_complaint'`) | `AdminSupportManager` | Workflow block (pills + note + Update btn + timeline) inside ticket detail modal | Card-row list + Sheet detail on `<md`; StatusChangeControl `variant="workflow"` |
| 2 | `/admin/support` (tickets filter `ticket_type='support'`) | `AdminSupportManager` | Same workflow block (shared) | Same as #1 — same component |
| 3 | `/admin/listings` | `AdminListingsTable` | Inline transition buttons per row (Approve/Reject/Archive/Activate/…) | Controlled-scroll table + StatusChangeControl `variant="workflow"` (transition set per current status) |
| 4 | `/admin/users` | `AdminUsersTable` | (read users table; status filter only) | Controlled-scroll table; no StatusChangeControl change in this sprint — Verified Agents = Epic HH Phase 6 / Task 313 |
| 5 | `/admin/inquiries/support` | `AdminInquiriesManager` (mailbox=`support`) | Simple `Combobox` dropdown in detail card | Card-row list + Sheet detail on `<md`; StatusChangeControl `variant="select"` |
| 6 | `/admin/inquiries/sales` | `AdminInquiriesManager` (mailbox=`sales`) | Same `Combobox` (shared component) | Same as #5 — same component |

Notes:
- `/admin/support` collapses two owner-flagged surfaces (complaints + tickets) into one component — both ticket types ship together.
- `/admin/reports` (`AdminReportsManager`) was NOT in owner's flagged list → deferred to Epic HH Phase 3 (separate task). Its current inline action-button + notes pattern is left untouched in Sprint 28.
- StatusChangeControl primitive built in Task 307; only AdminInquiriesManager + AdminSupportManager + AdminListingsTable integrate it in this sprint. Other admin surfaces continue with current status UX until a separate follow-up.

## Tasks

### Task 327 — Owner evidence-driven mobile QA matrix + Task 303 severity supersession (AUDIT-ONLY) [HIGH]

- Kickoff: [`Sprint_28_kickoff_prompt_Task_327.md`](Sprint_28_kickoff_prompt_Task_327.md)
- Type: audit
- Output: `docs/governance-reports/2026-05-30-sprint-28-admin-mobile-evidence-matrix.md` (NEW) + `docs/admin-ux-rules.md` per-route policy table updated + Task 303 audit doc annotated as superseded for severity (historical inventory only) + backlog Severity-baseline note added to `docs/qa-rules.md` (or noted in Sprint 28 plan if qa-rules has no slot).
- 5 surfaces × 7 breakpoints × 4 locales = 140 cells minimum (5×7×4). Each cell classified CRITICAL / HIGH / MEDIUM / LOW per owner baseline.
- NO source code. NO migrations. NO new components.
- Parallel-safe with Task 328.

### Task 328 — Canonical `StatusChangeControl` spec + per-surface assignment (SPEC-ONLY) [HIGH]

- Kickoff: [`Sprint_28_kickoff_prompt_Task_328.md`](Sprint_28_kickoff_prompt_Task_328.md)
- Type: spec
- Output: `docs/admin-ux-rules.md` new §13 "Canonical StatusChangeControl" section + per-surface assignment table + API surface + locale-key list. Inventory of the 4 current implementations (AdminSupportManager workflow / AdminInquiriesManager combobox / AdminReportsManager inline action-button / AdminListingsTable transition button-cards) in the session log.
- Encodes owner Decision 1 (Tiered: variant=select | variant=workflow) verbatim. NO RE-LITIGATION.
- NO source code. NO storybook. NO migrations.
- Parallel-safe with Task 327.

### Task 306 — `AdminPageShell` + `AdminTable` (controlled-scroll) + `AdminCardList` (card-row) primitives [HIGH]

- Kickoff: [`Sprint_28_kickoff_prompt_Task_306.md`](Sprint_28_kickoff_prompt_Task_306.md)
- Type: feature (canonical primitives)
- Output: `src/components/admin/AdminPageShell.tsx` (NEW) + `src/components/admin/AdminTable.tsx` (NEW) + `src/components/admin/AdminCardList.tsx` (NEW) + storybook stories for each + 1 pilot integration on `/admin/listings` (validates AdminTable end-to-end without scope creep into other tables).
- Activates Epic HH Phase 2 reserved number 306. Scope reduced from "all 18 routes" to "owner-flagged surfaces only".
- Depends on Task 327 evidence matrix.

### Task 307 — `StatusChangeControl` primitive implementation [HIGH]

- Kickoff: [`Sprint_28_kickoff_prompt_Task_307.md`](Sprint_28_kickoff_prompt_Task_307.md)
- Type: feature (canonical primitive)
- Output: `src/components/admin/StatusChangeControl.tsx` (NEW) + `src/components/admin/StatusChangeHistory.tsx` (NEW shared timeline subcomponent) + storybook stories + 1 pilot integration on `AdminInquiriesManager` (variant=select, lowest risk surface).
- Activates Epic HH Phase 2 reserved number 307.
- Depends on Task 328 spec.

### Task 308 — Migrate `/admin/listings` + `/admin/users` to AdminPageShell + AdminTable [HIGH]

- Kickoff: [`Sprint_28_kickoff_prompt_Task_308.md`](Sprint_28_kickoff_prompt_Task_308.md)
- Type: refactor + UX
- Output: `AdminListingsTable.tsx` + `AdminUsersTable.tsx` migrated to shell + table primitives. AdminListingsTable transition row-actions migrated to StatusChangeControl `variant="workflow"`. AdminUsersTable: no StatusChangeControl change (Verified Agents = Task 313). Header/count/action layout fixed per Task 327 evidence. 7 bp × 4 loc.
- Activates Epic HH Phase 3 reserved number 308. Scope = ONLY these two surfaces.
- Depends on Tasks 306 + 307.

### Task 309 — Migrate `/admin/support` + `/admin/inquiries/support` + `/admin/inquiries/sales` to AdminPageShell + AdminCardList [HIGH]

- Kickoff: [`Sprint_28_kickoff_prompt_Task_309.md`](Sprint_28_kickoff_prompt_Task_309.md)
- Type: refactor + UX
- Output: `AdminSupportManager.tsx` migrated to shell + card-list. Existing inline workflow block REPLACED with `StatusChangeControl variant="workflow"` (preserving note, timeline, transition set, locale keys). `AdminInquiriesManager.tsx` migrated similarly with `StatusChangeControl variant="select"` (preserving Combobox UX semantics). Ticket detail modal + Inquiry detail modal become Sheet on `<md` per Epic HH Decision 5. 7 bp × 4 loc.
- Activates Epic HH Phase 3 reserved number 309. Scope = ONLY these three surfaces.
- Depends on Tasks 306 + 307.

## Numbering rationale

- **327 + 328** consumed from "Next free" pool (backlog had `Next free: 327`).
- **306 + 307 + 308 + 309** consumed from Epic HH Phase 2-3 reserved range (originally planned 306-313). Epic HH Phase 4 Task 310 (Locations + Companies + Legal + Property Types + Currency + Email Templates + Footer + Settings + Permissions) is **NOT** included in Sprint 28 — deferred to a follow-up Epic HH Phase 4 sprint after Sprint 28 ships.
- **Epic HH Phase 5-6 reserved numbers (311, 312, 313)** remain UNCONSUMED.
- **Next free after Sprint 28:** 329.

## Run order rationale

1. **Task 327 ‖ Task 328** — both audit/spec, NO code. Run in parallel; both must complete before Phase 2.
2. **Owner reviews 327 + 328 outputs** — single review batch; signs off on both before Phase 2 begins.
3. **Task 306 ‖ Task 307** — both build primitives. Task 306 needs evidence matrix from Task 327; Task 307 needs spec from Task 328. Run in parallel after owner sign-off.
4. **Owner reviews 306 + 307 diffs** — single review batch; signs off on primitives before migrations begin.
5. **Task 308 + Task 309** — independent surface batches. Run in parallel after owner sign-off on primitives. Each is its own diff review + commit.

## Owner sign-off gates

| Gate | What owner verifies | When |
|------|--------------------|------|
| G1 | Task 327 evidence matrix matches owner screenshots; severity baseline reasonable | After 327 diff + before 306 starts |
| G2 | Task 328 spec captures owner Decision 1 verbatim; per-surface assignment correct | After 328 diff + before 307 starts |
| G3 | Task 306 primitives render correctly at 320/375/390 in pilot `/admin/listings` | After 306 diff + before 308 starts |
| G4 | Task 307 StatusChangeControl renders correctly in pilot `AdminInquiriesManager` | After 307 diff + before 309 starts |
| G5 | Task 308 migrated surfaces preserve every existing control + status transition | After 308 diff |
| G6 | Task 309 migrated surfaces preserve workflow block semantics (note + timeline + transitions) | After 309 diff |
| G7 | Sprint 28 closes; **Task 326B becomes UNBLOCKED** | After G3-G6 all PASS |

## Exit criteria

Sprint 28 closes when:
- Tasks 327, 328 audit/spec docs accepted by owner.
- Tasks 306, 307, 308, 309 diffs approved by orchestrator.
- Owner runtime-verifies on 6 owner-flagged surfaces:
  - 320/375/390/768/1280/1440/2560 — no horizontal overflow, no clipped tabs, no clipped table/card width, no clipped modal content, no header/title/count/action overlap, every existing action reachable.
  - sq/en/uk/it — all four locales render correctly at narrow widths.
  - StatusChangeControl: workflow variant preserves note + timeline + transitions; select variant preserves Combobox UX; locale-key parity across 4 locales; save / loading / error / success states identical to current.
- Backlog updated: Sprint 28 row added to Active sprints; Sprint 27 row updated (326B unblocked); Task 326A QA gate updated (only `/admin/pages` + `[locale]/[slug]` surfaces remaining, which owner verifies independently).

## Out of scope for Sprint 28

- `/admin/reports` migration (`AdminReportsManager`) — not in owner-flagged list; deferred to Epic HH Phase 3 follow-up.
- `/admin/locations`, `/admin/popular-locations`, `/admin/companies`, `/admin/property-types`, `/admin/currency`, `/admin/email-templates`, `/admin/legal` (now `/admin/pages` per Sprint 27), `/admin/footer`, `/admin/settings`, `/admin/permissions`, `/admin` dashboard — Epic HH Phase 4 (Task 310 or split). NOT Sprint 28.
- Verified Agents workflow (Task 313) — Epic HH Phase 6, independent.
- DB schema changes — none in Sprint 28. `support_tickets` / `support_inquiries` / `listings` schemas frozen.
- Public site responsive — separate Epic.
- Email-template ICU / i18n hardening — Epic II tracks (Sprints 24 + 25).
- Sprint 27 Task 326B execution — BLOCKED until Sprint 28 ships.
- Re-litigating Epic HH owner Decisions 1-7 — those are fixed inputs.
- Re-litigating Sprint 28 owner Decisions 1-3 (StatusChangeControl tier model / 6-surface scope / Task 303 severity supersession) — fixed inputs.

## Cross-Epic references

- Epic HH: [`../Epics/Epic_HH_Admin_UX_System.md`](../Epics/Epic_HH_Admin_UX_System.md) — Sprint 28 ACTIVATES Phase 2 (Tasks 306/307) + Phase 3 (Tasks 308/309) scoped to owner-flagged surfaces only.
- Sprint 23 Task 303 audit (superseded for severity): `docs/sessions/2026-05-30-task-303-admin-responsive-audit.md` — kept as historical inventory.
- Sprint 23 Task 304 filter/sort/row-action spec: `docs/admin-ux-rules.md` §7-9 — applies during Tasks 308/309 implementations.
- Sprint 23 Task 305 modal/dialog/sheet spec: `docs/admin-ux-rules.md` §11-12 — Sheet bottom-drawer pattern applies in Task 309 for detail modals.
- Sprint 27 Task 326B: BLOCKED until Sprint 28 ships.
- Opus orchestration session: [`../../docs/sessions/2026-05-30-sprint-28-formation-orchestration.md`](../../docs/sessions/2026-05-30-sprint-28-formation-orchestration.md).
