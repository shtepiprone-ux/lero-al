# Sprint 19 — Task 299 kickoff (Admin filter triage UX evaluation — multi-select decision)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10 (Task 264 commit hand-off).

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is an **admin table / control** task — pre-read: `ui-rules.md`, `component-rules.md`, `component-governance.md` (canonical `AdminTableRow`), `domain-rules.md`, `rls-rules.md`, `qa-rules.md`, `ai-behavior.md` Note 22 (Admin Table Preservation). No scope change; STOP & ASK if ambiguous.

---

```
Type:        UX evaluation + (conditional) refactor (admin filter chips)
Priority:    MEDIUM (kickoff-intent gap from Task 294 review)
Area:        admin triage filters — AdminInquiriesManager, AdminReportsManager, AdminSupportManager
```

## Why this task exists (2026-05-29 orchestrator review of Task 294)

Task 294's kickoff said:
> *"Admin filters: grep admin tables for filter chips/selects used as filters (listings/users/reports/support/requests). Apply the SAME canonical count model + multi-select where logical."*

Task 294's session log claimed:
> *"Admin tables ... do NOT use filterEngine.ts functions ... No admin filter count badges exist. **No admin changes needed or made.**"*

The orchestrator confirmed that admin tables do **not** share `filterEngine.ts` — that part is true. But the kickoff's intent ("multi-select where logical") was not evaluated; Sonnet's interpretation skipped the UX question entirely. Admin tables DO have single-select status/role filter chips that *could* be multi-select for triage workflows:

| File | Filter | Current type | Multi-select candidate? |
|------|--------|--------------|-------------------------|
| `AdminInquiriesManager.tsx` | `statusFilter: ContactStatus \| 'all'` | single-select buttons | Likely YES — triage "show new AND in_progress" |
| `AdminInquiriesManager.tsx` | `mailboxFilter: 'all' \| 'support' \| 'sales'` | single-select buttons | NO — route IS the filter (Note 21 relocation already documented) |
| `AdminReportsManager.tsx` | `filter: StatusFilter` (`'all' \| ReportStatus`) | single-select FILTERS array | Likely YES — moderator workflow "show pending AND reviewed" |
| `AdminSupportManager.tsx` | `statusFilter: string` | single-select chips | Likely YES — same triage pattern |
| `AdminListingsTable.tsx` | tab `all` / `premium` + Combobox status | tab single + Combobox single | Combobox status could be multi; tabs are tab-nav not filters → keep single |
| `AdminUsersTable.tsx` | tab `all` / `verified` + role filter | tab single + role single | Same — tabs single; role could be multi |

The owner asked the orchestrator to evaluate (not blindly implement). This task delivers a written UX evaluation per filter, then **conditionally implements** the ones the orchestrator approves.

## Goal

Two-phase task with STOP & ASK gate:

**Phase 1 (mandatory, audit-only):** produce `docs/governance-reports/2026-05-29-admin-filter-triage-evaluation.md` (NEW) — a table of every admin filter currently rendered as single-select that COULD be multi-select, with per-filter:
- Surface + file:line.
- Current UX (single chip / radio / combobox).
- Triage workflow argument FOR multi-select (when does a moderator need "show A AND B"?).
- Counter-argument (when does single-select reflect a mutually-exclusive workflow?).
- Recommendation: convert / keep / defer (with reason).
- Estimated effort if converted (small / medium / large — based on whether the filter is local-state, URL-state, or server-action-state).

Submit the document and STOP & ASK the orchestrator which filters (if any) to convert in Phase 2.

**Phase 2 (conditional, only after orchestrator approval):** convert the approved filters to multi-select using the same patterns Task 294 established:
- Local-state filters (`AdminInquiriesManager.statusFilter` etc.): change `useState<X | 'all'>` to `useState<Set<X>>` or `useState<X[]>` with explicit "all = empty set" convention. Render as chip group (multi-select), preserve every existing handler.
- URL-state filters (admin tables that drive URL params): comma-separated convention, matching Task 294.
- The filter-result computation must use `.some()` / `.in()` semantics (OR within group).
- No count badge added unless the orchestrator explicitly asks for one (admin tables currently have no count badge — that's intentional).
- Note 22 inventory: every admin row action / search / sort / pagination / row click MUST stay working.

If Phase 1 concludes "no filter should be multi-select" (i.e. all current single-select patterns are intentional), the task closes after Phase 1 with documentation only — that is a valid outcome.

## Required investigation (PASTE in session log)

```
sed -n '75,225p' src/components/admin/AdminInquiriesManager.tsx
sed -n '30,250p' src/components/admin/AdminReportsManager.tsx
sed -n '535,625p' src/components/admin/AdminSupportManager.tsx
sed -n '455,510p' src/components/admin/AdminListingsTable.tsx   # status Combobox
sed -n '85,120p'  src/components/admin/AdminUsersTable.tsx       # role + tab filters
grep -rn "statusFilter\|roleFilter\|setStatusFilter\|setRoleFilter" src/components/admin/
grep -rn "ContactStatus\|ReportStatus\|TicketStatus" src/modules/admin/ src/modules/contacts/ src/types/database.ts | head -30
# Confirm there is no shared admin filter count utility (kickoff said there isn't):
grep -rn "countActive\|filterCount" src/components/admin/ src/app/admin/
```

## Current behavior to preserve (Note 22 — mandatory inventory per surface)

For each touched admin table (Phase 2 only), inventory in the session log BEFORE editing:
- Every column.
- Every row action (edit, delete, status change, etc.).
- Row click behavior.
- Search input + debounce.
- Sort affordance.
- Pagination.
- Empty + loading states.
- Mobile (320px `uk`) layout.

AFTER editing, re-list and prove nothing was dropped. **Any silently-removed admin action is a P0 regression — STOP and rollback.**

## Positive flow (Phase 2 — happy path per converted surface)

Actor: admin / moderator.
1. Open admin page (`/admin/inquiries` for example).
2. Click a status chip (e.g. "new") → that status is selected (one chip active).
3. Click another status chip (e.g. "in_progress") → BOTH chips active; the table shows rows matching EITHER status (OR within group).
4. Click "new" again → deselects new; only "in_progress" remains.
5. Click "All" (or reset affordance) → all status chips deselected (or all selected — choose ONE convention and document it).
6. Search / sort / pagination still work alongside the multi-status filter.
7. Mobile 320 `uk`: chips wrap, no overflow, 44px touch.

## Negative flow (Phase 2 — every off-happy-path branch)

- **Empty multi-selection** (= "All"): no rows hidden by status filter; other filters (search, mailbox) still applied.
- **Invalid combination:** e.g. a status that doesn't exist in the data → empty results; existing empty-state UI rendered.
- **Search + multi-status:** intersection (AND across groups: search AND any-of-statuses).
- **Mailbox scope override** (`AdminInquiriesManager` with `mailboxScope` prop set): mailbox filter hidden; status multi-select still works.
- **URL-state filters** (if any in Phase 2 scope): comma-separated; back-compat with old single-value URLs.
- **Pagination:** changing status selection resets to page 1.

## Acceptance criteria (literal)

**Phase 1 (always required):**
- `docs/governance-reports/2026-05-29-admin-filter-triage-evaluation.md` exists.
- The document covers every single-select admin filter listed in the table above + any additional one Sonnet finds during the grep.
- Each row has Recommendation + reason + estimated effort.
- A summary "Recommended for Phase 2" list with the orchestrator's STOP & ASK question at the bottom.

**Phase 2 (conditional, only after orchestrator approval):**
- Approved filters converted to multi-select with the patterns above.
- Note 22 BEFORE/AFTER inventory in the session log proves no admin action silently removed.
- OR semantics within a group, AND across groups.
- `npx tsc --noEmit` → 0. `npm run build` → passes. `npx vitest run` → no regression. `npm run lint` → no new errors/warnings vs current baseline.
- Visual parity at 320/375/390/768/1280/1440/2560 in `uk`; no truncation of translated chip labels (per Task 294's no-truncate rule for translated strings).
- All four locales render identical structure; reuse existing keys where possible; add keys only with orchestrator approval if a new label is genuinely needed.
- Note 18 self-validation + AC self-audit + "Files Changed" table in session log.
- Self-validation verdict: `Self-validation: tsc=0 · build=passes · vitest no-regression · admin actions preserved · OR-within/AND-across · breakpoints=7 · scope=clean · PASS`.

## Out of scope (do NOT touch)

- `filterEngine.ts` (public filter engine — completely separate).
- Public listings filter UI (Task 294 owns it).
- Task 282 admin dialog conversions (already shipped).
- Task 283 admin tab Button migrations (already shipped).
- Task 295 lint baseline files.
- Task 296 entropy audit.
- Task 297 text-[11px] mono-ID.
- Task 298 saved-search canonical hash.
- Admin table column changes, row-action changes, search/sort/pagination logic changes.
- New filter categories.
- Any visual redesign beyond chip rendering.
- DB schema / migrations / RLS / locale-file changes.

Do NOT emit git commands. Do NOT run git. **STOP & ASK between Phase 1 and Phase 2 — do not proceed to implementation without explicit orchestrator approval of which filters to convert.**
