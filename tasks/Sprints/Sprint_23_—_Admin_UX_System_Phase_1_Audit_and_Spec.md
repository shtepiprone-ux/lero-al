# Sprint 23 — Admin UX System Phase 1 (Audit + Canonical Spec)

> **Formed:** 2026-05-30 (owner approved 6 Epic HH product decisions; Phase 1 audit/spec unblocked).
> **Status:** FORMED — three audit kickoffs ready for Sonnet.
> **Run order:** 303 → 304 → 305 (each builds on the prior — 303 creates `docs/admin-ux-rules.md`; 304 + 305 extend it).
> **Owner gate after sprint closes:** Phase 2 (Tasks 306/307) blocked until owner reviews + approves the three new spec sections + the three audit reports.

## Sprint goal

Produce the canonical **Admin UX System** specification document (`docs/admin-ux-rules.md`) + three governance audit reports that, taken together, encode owner Decisions 1–5 from `tasks/Epics/Epic_HH_Admin_UX_System.md`. These artefacts unblock Epic HH Phase 2 (canonical primitives) and Phase 3+ (page migrations).

**No production code in this sprint.** All three tasks are audit/spec only.

## Tasks

### Task 303 — Admin responsive audit + canonical narrow-bp per-route policy CONFIRMATION

- Kickoff: [`Sprint_23_kickoff_prompt_Task_303.md`](Sprint_23_kickoff_prompt_Task_303.md)
- Type: audit + canonical spec (docs only)
- Output: `docs/admin-ux-rules.md` (NEW) "Narrow-breakpoint model" section + per-route policy table + sticky-column + scroll-affordance rules; `docs/governance-reports/2026-05-30-admin-responsive-audit.md` (NEW); session log; backlog entry.
- Encodes: Decision 1 (Hybrid: workflow=card-row, data-dense=controlled scroll).
- STOP & ASK on: per-route policy conflicts, Footer/Settings classification, sticky-column choice, scroll-affordance choice.
- Independence: foundational — Tasks 304 + 305 extend the doc Task 303 creates.

### Task 304 — Admin filter / sort / row-action canonical spec

- Kickoff: [`Sprint_23_kickoff_prompt_Task_304.md`](Sprint_23_kickoff_prompt_Task_304.md)
- Type: audit + canonical spec (docs only)
- Output: `docs/admin-ux-rules.md` (EXTEND) "Filter taxonomy" + "Sort canonical rules" + "Row-action / inline-control canonical rules" sections; `docs/governance-reports/2026-05-30-admin-filter-sort-rowaction-audit.md` (NEW); session log; backlog entry.
- Encodes: Decision 2 (filter taxonomy ≥4=Combobox / ≤3=segmented / per-value count / single global reset) + Decision 3 (sort always in URL, canonical `?sort=col&dir=asc|desc`).
- STOP & ASK on: filter-assignment boundary calls, long-tail option handling, per-column sortability, inline-vs-dropdown row-action pattern, active-filter-count helper source of truth.
- Dependency: Task 303 ships first (creates the `admin-ux-rules.md` file).

### Task 305 — Admin modal / dialog / popover / sheet canonical spec

- Kickoff: [`Sprint_23_kickoff_prompt_Task_305.md`](Sprint_23_kickoff_prompt_Task_305.md)
- Type: audit + canonical spec (docs only)
- Output: `docs/admin-ux-rules.md` (EXTEND) "Modal / Dialog / Sheet / Popover canonical rules" section; `docs/governance-reports/2026-05-30-admin-modal-audit.md` (NEW); session log; backlog entry.
- Encodes: Decision 4 (width tiers sm/md/lg/xl = 400/560/720/960) + Decision 5 (action-heavy → Sheet at <md, read-only Dialog if usable).
- STOP & ASK on: tier boundary calls, mobile-fallback edge cases, destructive-action canonical, title+description rule, status-badge-in-modal placement.
- Dependency: Task 303 ships first.

## Run order rationale

- **303 first** — creates the spec file (`admin-ux-rules.md`); 304 + 305 are EXTEND, not CREATE.
- **304 second** — filter / sort / row-action rules are referenced by Phase 2 primitives (AdminFilterBar, AdminTable). Ships before modal spec because Phase 2 primitive count is higher than Phase 5 modal count.
- **305 third** — modal spec is independently mostly self-contained but is the gate for Phase 5 (Task 311).

Tasks 304 + 305 can run in parallel only if Sonnet sessions coordinate on `admin-ux-rules.md` edits (different sections, but same file — recommend sequential to avoid section-overlap merge conflicts).

## Exit criteria

Sprint 23 closes when:
- All three tasks have approved diffs (orchestrator review).
- `docs/admin-ux-rules.md` contains the 4+ sections (narrow-bp / filter / sort / row-action / modal).
- All three governance audit reports exist in `docs/governance-reports/`.
- Owner reviews the spec + reports and provides explicit Phase 2 sign-off (separate Sprint 25 kickoff for AdminPageShell / AdminFilterBar / AdminTable primitives).
- Orchestrator emits explicit-path commit commands per task.
- Backlog updated; Sprint 23 row in archive table.

## Out of scope for Sprint 23

- Any production code change (`src/` untouched).
- Any new component / primitive.
- Any DB / RLS / migration change.
- Any locale key addition / copy edit.
- Page migrations — Phase 3+.
- Modal implementation — Phase 5 (Task 311).
- Verified Agents workflow — Phase 6 (Task 313).
- Re-litigating Decisions 1-5 — they are fixed inputs.

## Owner-decisions reference

All 7 owner decisions live in `tasks/Epics/Epic_HH_Admin_UX_System.md` → "APPROVED owner decisions (2026-05-30)". Tasks 303/304/305 encode Decisions 1-5; Decisions 6 + 7 (Verified Agents schema direction + public badge) are recorded in the Epic but not implemented in this sprint (Phase 6 / Task 313 territory).

## References

- Epic HH — Admin UX System: [`../Epics/Epic_HH_Admin_UX_System.md`](../Epics/Epic_HH_Admin_UX_System.md)
- Task 296 (failed-narrow-bp browser verification — the trigger for Epic HH): [`../../docs/sessions/2026-05-30-task-296-tailwind-entropy-audit.md`](../../docs/sessions/2026-05-30-task-296-tailwind-entropy-audit.md)
- Task 299 (admin filter triage evaluation — Task 304 seed): [`../../docs/governance-reports/2026-05-30-admin-filter-triage-evaluation.md`](../../docs/governance-reports/2026-05-30-admin-filter-triage-evaluation.md)
- Task 282 (Design System Lockdown — canonical Dialog/Sheet precedent for Task 305): [`../../docs/sessions/2026-05-29-task-282-design-system-lockdown.md`](../../docs/sessions/2026-05-29-task-282-design-system-lockdown.md)
- Task 229 (single global reset precedent for Task 304): in Session Archive.
- Task 294 (multi-select counter precedent for Task 304): in Session Archive.
