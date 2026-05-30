# Sprint 22 — Admin Support Workflow Refinements (Epic HH Phase 6 early slice)

> **Formed:** 2026-05-30 (owner directive — complaint-type taxonomy gap on `/admin/support` create-complaint modal)
> **Status:** FORMED — Task 314 kickoff ready for Sonnet
> **Run order:** 314 (standalone; ships independently of Sprint 21 + Epic HH Phase 1+)

## Sprint goal

Ship one targeted admin support-ticket workflow refinement that does NOT block on Epic HH Phase 1 owner approval gate:

**Task 314 — Admin complaint-type selector** — add a required canonical complaint-type field to the `/admin/support` "+ Нова скарга" modal; persist it on a new `support_tickets.complaint_type` enum column; display it in the list + detail surfaces; localise to sq/en/uk/it.

This task is positioned as an **Epic HH Phase 6 early slice** (Internal Tickets workflow refinement) — independent of Phase 1 (canonical narrow-bp / filter / sort / row-action / modal specs) because:
- The Create dialog already exists and works; this task ADDS one field — no canonical-modal-spec dependency.
- The list display already has a row/badge pattern; this task adds one Badge — no canonical-table-spec dependency.
- The new field is required, validated, and persisted by canonical primitives (`Combobox` / `Button` / `Dialog` / `Badge`) already in the design system — no canonical-primitive dependency.

If Phase 1 audit later mandates a different field placement / display location, Task 314 is small enough to revise in a follow-up.

## Numbering rationale

Backlog 2026-05-30 reservations:
- 300, 301, 302 — Sprint 21 critical hotfixes
- 303–313 — Epic HH (Admin UX System) 6-phase plan
- 314, 315 — **free**
- 316–323 — Epic II (Global i18n Hardening)
- 324+ — free

**Task 314** is the next free global number outside the Epic HH / Epic II reservations.

## Tasks

### Task 314 — Admin complaint-type selector [MEDIUM-HIGH]

- Kickoff: [`Sprint_22_kickoff_prompt_Task_314.md`](Sprint_22_kickoff_prompt_Task_314.md)
- Type: feature + small data-model addition (admin / support-ticket workflow)
- Files: `AdminSupportManager.tsx` + `actions/index.ts` + `types/database.ts` + `scripts/task-314-complaint-type.sql` (NEW) + `scripts/schema-drift-check.sql` (extend) + `messages/{sq,en,uk,it}.json` (12 keys × 4 = 48 strings) + session log + backlog (optional `docs/domain-rules.md` 1-paragraph addition).
- New schema: `CREATE TYPE complaint_type_t AS ENUM (8 values)` + `ALTER TABLE support_tickets ADD COLUMN complaint_type complaint_type_t NOT NULL DEFAULT 'other'`.
- AC: required Combobox field in Create dialog; client + server validation; persisted column; Badge in list + detail; 4-locale parity; 7-breakpoint Create-dialog PASS at `uk`; existing fields/buttons/filters/status/notifications/RLS unchanged.
- STOP & ASK before editing: enum reuse vs new (recommend new), field placement (recommend between Reported-user and Subject), display location (recommend Badge in row AND detail), legacy backfill (recommend `'other'` default).
- Independence: ships independently of Sprint 21 (300/301/302) and Epic HH Phase 1+.
- Owner action: runs `scripts/task-314-complaint-type.sql` in Supabase SQL editor; UI degrades gracefully without migration (Badge shows "—" or hides).

## Out of scope for Sprint 22

- Filter-by-complaint-type chip on the list (separate follow-up).
- Analytics dashboards on complaint_type.
- Email notifications mentioning complaint_type.
- Moderation automation / escalation routing.
- Public listing-report flow harmonisation.
- Epic HH Phase 1+2 audit/primitive work.
- Sprint 21 hotfixes (300/301/302) — independent.

## Exit criteria

Sprint 22 closes when:
- Task 314 diff APPROVED on orchestrator review.
- Owner runs the migration SQL in Supabase editor.
- Owner confirms at runtime in all 4 locales:
  - New required field renders in Create dialog with localised options.
  - Cannot create complaint without selecting a type.
  - Saved complaint shows correct Badge in list + detail after refresh.
- Orchestrator emits explicit-path commit command for the diff.
- Backlog updated; Sprint 22 row in archive table.

## References

- Epic HH — Admin UX System (Phase 6 host for this slice): [`../Epics/Epic_HH_Admin_UX_System.md`](../Epics/Epic_HH_Admin_UX_System.md)
- Sprint 21 — Admin Critical Hotfixes (independent, parallel): [`Sprint_21_—_Admin_Critical_Hotfixes_and_Footer_Fix.md`](Sprint_21_—_Admin_Critical_Hotfixes_and_Footer_Fix.md)
- Task 284 (admin unification + Support/Inquiries split — context): [`../../docs/sessions/2026-05-29-task-284-admin-unification.md`](../../docs/sessions/2026-05-29-task-284-admin-unification.md)
- `docs/domain-rules.md` → Support vs Inquiries section (referenced by the new complaint_type taxonomy)
