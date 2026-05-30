# Session: Task 304 — Admin filter / sort / row-action canonical spec

**Date:** 2026-05-30  
**Task:** 304 (Epic HH Phase 1 — task #2)  
**Type:** AUDIT + CANONICAL SPEC — no production code  
**Sprint:** 23

---

## Investigation Summary

### Filter sites found (complete inventory)
- 14 distinct filter sites across 9 admin routes
- 3 routes use `AdminSearchInput` (canonical) ✅
- 2 routes use plain `<Input>` for search → non-canonical (need `AdminSearchInput`)
- All admin status/type filters use local `useState` (violates Decision 3 URL-state) except `/admin/listings` + `/admin/users` which already use URL params
- Zero admin tables have user-controllable sort today (all hardcoded server-side)

### Sort — key finding
All 13 admin routes have hardcoded server-side `ORDER BY` — none user-controllable. Decision 3 (`?sort=<col>&dir=asc|desc`) is entirely new; Phase 3 implements it.

### Row-action violations found
- `/admin/users` verify toggle: 24×24px — below 44px touch target
- `/admin/legal` delete: no confirm Dialog (immediate delete = BUG)
- `/admin/companies` delete: `deletingId` inline pattern — needs verification if Dialog or inline state only

---

## STOP & ASK Resolutions

| Question | Resolution |
|----------|-----------|
| AdminInquiriesManager statusFilter (4 opts + badges) | Keep segmented tabs + badges (owner-approved exception) |
| AdminUsersTable role filter (4 opts) | → Combobox (Decision 2 rule) |
| AdminReportsManager status filter + count badges | → Combobox with counts in option labels ("Pending (N)") |
| Sortable columns | Listings: created_at + price + status. Users: created_at + name |
| Destructive row-action | Always require confirm Dialog; /admin/legal = BUG; /admin/companies = verify |
| Active-filter-count helper | `countActiveAdminFilters` approved as Phase 2 helper; semantics must match `filterEngine.countActiveFilterValues()` (count = total active VALUES; multi-select 2 selected = 2; search non-empty = 1; "all"/default = 0). Phase 2 MAY reuse existing helper if admin filter shape allows. |

---

## Documents Produced

1. **`docs/admin-ux-rules.md`** — extended with:
   - §7 Filter taxonomy (Decision 2 + exception + per-route assignment + active-count helper spec + global reset rule)
   - §8 Sort canonical rules (Decision 3 + URL shape + per-table sortable-column matrix)
   - §9 Row-action / inline-control canonical rules (row-click patterns + inline-control policy + destructive-action spec + per-route assignment)
   - §10 Owner approval gate for Task 304 additions

2. **`docs/governance-reports/2026-05-30-admin-filter-sort-rowaction-audit.md`** — full audit evidence:
   - Complete filter inventory per route (14 filter sites)
   - Sort inventory (all hardcoded; Decision 3 is new)
   - Row-action inventory with violations identified
   - STOP & ASK resolutions
   - Task 305 pre-input (dialog patterns observed)

---

## AC Self-Audit

| AC | Status |
|----|--------|
| `docs/admin-ux-rules.md` has §7 Filter taxonomy, §8 Sort rules, §9 Row-action rules | ✅ |
| Decision 2 encoded verbatim in §7 | ✅ |
| Decision 3 encoded verbatim in §8 | ✅ |
| Per-filter assignment table covers every active filter found (14 filters) | ✅ |
| Sortable-column matrix covers every admin table (all columns explicit) | ✅ |
| Active-filter-count rule cites new `countActiveAdminFilters` helper + Phase 2 delivery | ✅ |
| Single-global-reset canonical rule documented | ✅ |
| Sort URL shape `?sort=<col>&dir=asc|desc` documented | ✅ |
| Row-action canonical pattern documented per surface | ✅ |
| All STOP & ASK conflicts resolved before spec finalized | ✅ |
| Owner approval gate §10 set | ✅ |
| Zero source / locale / migration changes | ✅ |
| `npx tsc --noEmit` → 0 | ✅ |
| `npm run lint` → 0/0 | ✅ |
| `npm run governance:tailwind` → C0/H0/M0 | ✅ |

---

## Files Changed

| File | Change |
|------|--------|
| `docs/admin-ux-rules.md` | Extended: §7 Filter taxonomy + §8 Sort rules + §9 Row-action rules + §10 approval gate |
| `docs/governance-reports/2026-05-30-admin-filter-sort-rowaction-audit.md` | NEW — full audit evidence |
| `docs/sessions/2026-05-30-task-304-admin-filter-sort-rowaction-spec.md` | NEW — this log |
| `docs/backlog.md` | Closure entry + archive row |

**Self-validation: tsc=0 · build=passes · lint=0/0 · governance:tailwind=C0/H0/M0 · filter+sort+row-action spec sections shipped · src diff=empty · owner approval gate set for Phase 2/3 · PASS**
