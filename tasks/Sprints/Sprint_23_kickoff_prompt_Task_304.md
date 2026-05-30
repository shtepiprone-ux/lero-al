# Sprint 23 — Task 304 kickoff (Epic HH Phase 1 — Admin filter / sort / row-action canonical spec)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **PURE AUDIT/SPEC TASK — no production code**. Pre-read `docs/orchestrator-role.md`, `docs/ai-behavior.md` (Notes 18/19/20/22), `docs/ui-rules.md` (§0 Combobox-only), `docs/component-rules.md`, `docs/tailwind-canonical-fragments.md`, `docs/qa-rules.md`, `tasks/Epics/Epic_HH_Admin_UX_System.md` (APPROVED owner decisions 2 + 3), `docs/governance-reports/2026-05-30-admin-filter-triage-evaluation.md` (Task 299 — direct input), `docs/sessions/2026-05-29-task-294-multi-select-filters.md` (multi-select counter precedent). No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 304 is Epic HH Phase 1 task #2. Active now because owner approved Decisions 2 + 3 on 2026-05-30.

> **⚠️ 2026-05-30 owner directive (`issues2.md`):** Task 304 MUST consume Task 303 evidence (the per-route × per-breakpoint × per-locale audit matrix with severity tags) and produce CONCRETE canonical rules anchored to specific Task 303 findings. Abstract / generic spec language is forbidden — every rule cites a Task 303 audit row that motivated it. If a proposed rule has no Task 303 anchor, STOP & ASK.

---

```
Type:        audit + canonical spec (DOCUMENTATION ONLY — no production code, no migration, no copy changes)
Priority:    HIGH (blocks Phase 3+ page migrations — pages cannot be migrated without canonical filter / sort / row-action rules)
Area:        admin filters · admin sort · admin row-actions / inline-controls across all admin tables/lists
```

## Why this task exists

Owner approved on 2026-05-30:

**Decision 2 — Filter taxonomy:**
- ≥4 options OR long-tail → canonical `Combobox` (or `Select`; Combobox preferred per `ui-rules.md §0`)
- ≤3 mutually exclusive scopes → segmented tabs allowed
- Free-text → `Search` input
- Active filter count = total active VALUES (multi-select with 2 picked = 2 active)
- Single global reset required when ≥1 filter active

**Decision 3 — Sort URL-state policy:**
- Sort always in URL: `?sort=<column>&dir=asc|desc`
- Stable shape across all admin tables

Task 299 already audited 8 single-select filters across `/admin/inquiries` + `/admin/reports` + `/admin/support` + `/admin/listings` + `/admin/users`. That report is the seed for Task 304's broader audit (every filter + every sort + every row-action across every admin route).

This task produces the canonical spec; **no implementation**. Phase 3+ (Task 308+) migrations apply the spec.

## Goal

Extend `docs/admin-ux-rules.md` (created by Task 303) with three new sections:

1. **"Filter taxonomy"** — encode Decision 2 verbatim; per-route filter inventory; per-filter assignment (segmented tabs vs Combobox vs Search vs date range); active-filter-count rule + canonical reset behaviour; reference to `filterEngine.ts` canonical layer.

2. **"Sort canonical rules"** — encode Decision 3 verbatim; canonical query shape; per-table column-sortability matrix (which columns sortable, which intentionally non-sortable + why); default sort per surface; URL parsing helper plan (no implementation — just spec what helper is needed).

3. **"Row-action / inline-control canonical rules"** — when row click opens detail vs. exposes inline action; canonical action-column layout (icon row vs. dropdown menu vs. primary button); inline status switcher vs. dropdown; destructive-action pattern within a row (confirm dialog vs. icon button); per-route current pattern → canonical assignment.

Plus produce **`docs/governance-reports/2026-05-30-admin-filter-sort-rowaction-audit.md`** (NEW; date = actual run date) — the audit data behind the spec.

**NO production code changes.** **NO source files in `src/` touched.** **NO new components.** **NO DB migration.** **NO new locale keys.** **NO `filterEngine.ts` edits.**

## Current behavior to preserve (Notes 19 + 20 + 22)

Audit must not silently establish a spec that removes an existing filter or inline control. For every admin route:
- inventory EVERY filter (segmented tab / button / Combobox / Select / Search / date / etc.)
- inventory EVERY sort affordance (sortable column headers, sort dropdown, default sort)
- inventory EVERY row action (icon button, dropdown menu, inline switcher, link, etc.)
- inventory EVERY inline control (status switcher, role selector, currency selector, etc.)

If the canonical assignment in the spec drops an existing capability, route as STOP & ASK with the conflict + proposed alternative.

## Required investigation (PASTE summary in session log)

```
# 1. Re-read Task 299 evaluation as seed
cat docs/governance-reports/2026-05-30-admin-filter-triage-evaluation.md

# 2. Inventory every admin filter site
grep -rn 'FilterToggleGroup\|FilterMultiToggle\|<Combobox\|<Select\|<SegmentedControl\|statusFilter\|typeFilter\|roleFilter\|mailboxFilter\|<Input.*search\|searchTerm' src/components/admin/

# 3. Inventory every admin sort site (sortable column headers or sort selectors)
grep -rn 'orderBy\|sortBy\|order=\|sort=\|ListingSort\|VALID_SORTS\|onSortChange' src/components/admin/ src/app/admin/ src/modules/admin/

# 4. Inventory every admin row-action site
grep -rn 'DropdownMenu\|<button.*onClick.*setStatus\|<Button.*size="icon"\|inline_action\|row.*onClick' src/components/admin/ | head -60

# 5. Cross-reference canonical filter engine
grep -n 'countActiveFilters\|countActiveFilterValues\|getFilterVisibility\|FilterValues' src/lib/filterEngine.ts src/modules/

# 6. Cross-reference canonical reset rule (Task 229 precedent)
grep -rn 'resetFilters\|reset.*filter' src/components/admin/ src/modules/listings/ | head -20

# 7. Render every admin route in dev at 1280 desktop + 320/375/390 narrow in `uk`. Capture filter density per surface.
```

After investigation, paste:
- Per-route filter / sort / row-action inventory (tabular).
- Mapping of each filter → proposed assignment (segmented tab / Combobox / Search / date).
- Sortable column matrix per table.
- Row-action pattern per surface.
- Any conflicts with Decisions 2 / 3.

## STOP & ASK before finalising the spec

Before extending `admin-ux-rules.md`:
1. **Filter assignment edge cases** — if a current filter has exactly 3-4 options, document the boundary call (segmented vs. Combobox).
2. **Long-tail option lists** — for filters like `companies` (potentially hundreds) or `cities`, confirm Combobox WITH `Search` field embedded (not just Combobox).
3. **Sortable column decisions** — for each table, propose sortable columns + non-sortable justified. STOP & ASK if any column is ambiguous (e.g. is "Created by admin" sortable? Probably no; is "Updated_at" sortable? Probably yes).
4. **Inline status switcher vs. dropdown menu** — for admin tables that currently use inline status buttons (e.g. AdminListingsTable status column), propose canonical pattern: keep inline OR move into row dropdown. STOP & ASK on each surface.
5. **Active-filter-count source of truth** — confirm orchestrator's expectation: `filterEngine.countActiveFilterValues()` is the canonical helper for admin (mirroring listings). Or propose a separate `adminFilterEngine.countActive()` helper if admin filter shape diverges.

Do NOT silently pick defaults — every contested call goes to STOP & ASK.

## Scope (files Sonnet may touch)

- `docs/admin-ux-rules.md` (EXTEND — Task 303 created this; Task 304 adds 3 new sections)
- `docs/governance-reports/2026-05-30-admin-filter-sort-rowaction-audit.md` (NEW; adjust date if run later — task number stays 304)
- `docs/sessions/2026-05-30-task-304-admin-filter-sort-rowaction-spec.md` (NEW; adjust date)
- `docs/backlog.md` (closure entry)

**MUST NOT touch:**
- Any file under `src/` (including `filterEngine.ts`)
- Any file under `messages/`
- Any file under `scripts/`
- Sprint 21 / 22 / 24 files
- Task 303 spec sections (just extend; do not edit Task 303's "Narrow-breakpoint model" section)
- Canonical primitives
- DB migrations / RLS

**Maximum SOURCE-FILE delta: 0.** If you touch `src/`, STOP & ASK.

## Locale + responsive coverage

- Locales: sq / en / uk / it — audit observes existing strings; longest in `uk`/`sq` for active-count rendering.
- Breakpoints: 320 / 375 / 390 / 768 / 1280 / 1440 / 2560 — confirms filter / sort UI density is appropriate for each pattern at narrow widths.

## Acceptance criteria (literal)

- `docs/admin-ux-rules.md` has new sections "Filter taxonomy", "Sort canonical rules", "Row-action / inline-control canonical rules"; each section opens with the verbatim owner decision (2 or 3).
- `docs/governance-reports/2026-05-30-admin-filter-sort-rowaction-audit.md` exists with: per-route filter inventory + per-route sort inventory + per-route row-action inventory.
- Per-filter assignment table covers EVERY active filter found in the inventory.
- Per-table sortable-column matrix covers every admin table; every column is either sortable (with default sort direction) OR explicitly marked non-sortable + 1-line reason.
- Active-filter-count rule cites `filterEngine.countActiveFilterValues()` (or a justified admin-side equivalent if owner-approved via STOP & ASK).
- Canonical single-global-reset behaviour documented (mirrors Task 229).
- Sort URL shape `?sort=<col>&dir=asc|desc` documented as canonical.
- Row-action canonical pattern documented per surface; every existing row action mapped to either "keep as-is" / "move into canonical dropdown" / "promoted to primary button".
- All conflicts surfaced as STOP & ASK + resolved before the spec is finalised.
- Zero source / locale / migration changes.
- `npx tsc --noEmit` → 0 errors. `npm run build` → passes. `npm run lint` → 0/0. `npm run governance:tailwind` → C0/H0/M0.
- Note 18 self-validation block + AC self-audit table + "Files Changed" table.
- Verdict line: `Self-validation: tsc=0 · build=passes · lint=0/0 · governance:tailwind=C0/H0/M0 · filter+sort+row-action spec sections shipped · src diff=empty · owner approval gate set for Phase 2/3 · PASS`.

## Out of scope

- Modal / dialog canonical spec — Task 305.
- AdminPageShell / AdminFilterBar implementation — Task 306 (Phase 2).
- AdminTable / column-sort primitive implementation — Task 307 (Phase 2).
- Migration of any admin page to apply the spec — Phase 3+.
- New filter logic in `filterEngine.ts`.
- New locale keys (filter labels are existing strings).
- Re-litigating Decisions 2 / 3.

## Final report required

1. Files Changed table.
2. Per-route filter / sort / row-action inventory matrices.
3. Filter-assignment table + STOP & ASK resolutions.
4. Sortable-column matrix per table.
5. Row-action canonical assignment per surface.
6. Active-filter-count canonical helper choice.
7. AC-by-AC self-audit table.
8. Confirmation NO `src/` / `messages/` / `scripts/` file was edited.

Do NOT emit git commands. Do NOT run git. Do NOT touch source code. STOP & ASK on every contested boundary.
