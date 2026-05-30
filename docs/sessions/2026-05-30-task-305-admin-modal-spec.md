# Session: Task 305 — Admin modal / dialog / sheet canonical spec

**Date:** 2026-05-30  
**Task:** 305 (Epic HH Phase 1 — task #3)  
**Type:** AUDIT + CANONICAL SPEC — no production code  
**Sprint:** 23

---

## Investigation Summary

- 25 distinct admin modal/dialog surfaces found across 15 components
- 19 use canonical `<Dialog>` primitive ✅
- 2 use non-canonical custom `div` overlay ⚠️ (AdminCurrenciesManager + AdminExchangeProvidersManager)
- 1 canonical `<Sheet>` (AdminSidebar mobile nav) ✅ — navigation infrastructure, not a data/workflow modal
- 0 `<AlertDialog>` in use — all destructive confirms currently use `<Dialog>`
- 0 `<Popover>` used as modal-like surface in admin

> **Count note:** The audit report (`-admin-modal-audit.md`) and the spec table (`admin-ux-rules.md §11.11`) each have **26 rows** — 25 data/workflow modal surfaces plus the AdminSidebar mobile nav Sheet (§2.26). The sidebar Sheet is included in both documents for primitive completeness, but is not counted as a data/workflow modal.

---

## STOP & ASK Resolutions

| Question | Resolution |
|----------|-----------|
| AdminListingsTable ListingPreviewDialog tier | **md** (560px); mobile: full-height Sheet (owner confirmed) |
| Destructive confirm primitive | **→ AlertDialog** (stronger accessibility; non-destructive confirmations stay Dialog) |
| Title + Description rule | Description optional (flag LOW); **required** for AlertDialog; required for complex/irreversible workflows |
| Status badge placement | **Body metadata grid** — header stays clean; AdminReportsManager colored title = non-canonical |

---

## Documents Produced

1. **`docs/admin-ux-rules.md`** — extended with §11–§12:
   - §11 Modal / Dialog / Sheet / Popover canonical rules (Decisions 4+5 verbatim)
   - §11.1 Width tiers (sm/md/lg/xl) + current-to-canonical mapping
   - §11.2 Mobile fallback rules
   - §11.3 Destructive pattern → AlertDialog
   - §11.4 Title + Description rule
   - §11.5 Status badge → body metadata grid
   - §11.6 Action footer canonical pattern
   - §11.7 Non-canonical custom div modals
   - §11.8 Close pattern (X / backdrop / Esc / Cancel)
   - §11.9 Scroll pattern for tall content
   - §11.10 Accessibility expectations
   - §11.11 Per-modal canonical assignment table (26 rows)
   - §12 Owner approval gate for Phase 5

2. **`docs/governance-reports/2026-05-30-admin-modal-audit.md`** — full evidence:
   - 26 modal inventory rows with all required fields
   - Phase 5 migration summary (AlertDialog ×11, custom div ×2, Sheet ×12, non-canonical fixes ×4)
   - Width divergence table
   - STOP & ASK resolutions

---

## AC Self-Audit

| AC | Status |
|----|--------|
| `docs/admin-ux-rules.md` §11 with Decision 4 (width tiers) + Decision 5 (mobile fallback) verbatim | ✅ |
| Every admin modal inventoried (Dialog + Sheet + AlertDialog + custom div) | ✅ |
| Per-modal tier (sm/md/lg/xl) + mobile fallback + rationale | ✅ |
| Action-footer canonical pattern documented | ✅ |
| Destructive-action → AlertDialog documented | ✅ |
| Title + Description rule documented | ✅ |
| Status-badge-in-body-grid documented | ✅ |
| Close pattern documented | ✅ |
| Scroll pattern documented | ✅ |
| Accessibility expectations documented | ✅ |
| All STOP & ASK conflicts resolved before spec finalized | ✅ |
| Non-canonical custom div modals identified + flagged | ✅ |
| Owner approval gate §12 set (Phase 5 blocked) | ✅ |
| Zero source / locale / migration changes | ✅ |
| `npx tsc --noEmit` → 0 | ✅ |
| `npm run lint` → 0/0 | ✅ |
| `npm run governance:tailwind` → C0/H0/M0 | ✅ |

---

## Files Changed

| File | Change |
|------|--------|
| `docs/admin-ux-rules.md` | Extended: §11 Modal/Dialog/Sheet canonical rules + §12 owner approval gate |
| `docs/governance-reports/2026-05-30-admin-modal-audit.md` | NEW — full modal audit evidence (26 modals) |
| `docs/sessions/2026-05-30-task-305-admin-modal-spec.md` | NEW — this log |
| `docs/backlog.md` | Closure entry + archive row |

**Self-validation: tsc=0 · build=passes · lint=0/0 · governance:tailwind=C0/H0/M0 · admin modal spec section shipped · src diff=empty · owner approval gate set for Phase 5 · PASS**
