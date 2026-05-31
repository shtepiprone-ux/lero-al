# Session: Task 306-Fix — Admin responsive contract (primitive-level fix)

**Date:** 2026-05-31
**Task:** 306-Fix (Sprint 28 — corrective after Task 306 owner QA HOLD/FAIL)
**Type:** Feature + refactor (canonical responsive contract at primitive level)
**Sprint:** 28

---

## Why This Task Exists

Owner manual QA on 2026-05-31 found Task 306 primitives had a broken responsive contract:
- 320/375/390/480: `min-w-[640px]` on `<table>` forces horizontal scroll at mobile instead of cards
- 1024: table still rendered (card mode was not wired); sidebar + main = 784px visible but table required scroll
- 2560 / 1920: `.container-wide` (88rem cap) left large empty margins in admin area
- AdminCardList existed as a standalone primitive but AdminTable never switched to it at mobile

**Orchestrator Decision A locked:** AdminTable internally switches between table (lg:+) and AdminCardList card mode (<lg:) at the CSS level (SSR-safe, no JS viewport detection).

---

## Zero-consumer check for AdminCardList card prop type change

```
grep -rn "AdminCardList" src/ --include="*.tsx" --include="*.ts" | grep -v "stories|AdminTable"
→ Results: AdminCardList.tsx itself only — 0 external consumers
→ STOP & ASK trigger: NOT triggered (safe to add structured card shape)
```

---

## Changes Made

### `src/components/admin/AdminTable.tsx`

- **Internal lg: switch:** Renders `<div className="lg:hidden">` containing `<AdminCardList>` (card mode) + `<div className="hidden lg:block admin-table-scroll-wrap ...">` containing `<table>` (table mode). Both paths consume the same `rows`, `loading`, `emptyState`, `errorState`, `ariaLabel`, `onRowClick`, `rowClassName` props.
- **`min-w-[640px]` REMOVED** — no longer needed since card mode handles <lg:.
- **`cardRow` prop added** — `(row: Row) => StructuredCard` — explicit card renderer. If omitted, `synthesizeCard()` builds a StructuredCard from columns definition (stickyCol = title; other-always = subtitle; sm/md = meta).
- AdminCardList receives `rowClassName` pass-through.

### `src/components/admin/AdminCardList.tsx`

- **Structured card support:** `card` prop now accepts `(row: Row) => StructuredCard | ReactNode`. `isStructuredCard()` type guard renders title/subtitle/meta/trailing layout when structured; falls back to raw ReactNode for legacy usage.
- **`compact?: boolean` prop added** — `compact=true` → `p-3`, `compact=false` → `p-4`. AdminTable uses `compact={false}` (default).
- **`rowClassName?: (row: Row) => string` added** — pass-through from AdminTable; applied to each card wrapper div.
- `StructuredCard` type exported for consumer use.

### `src/components/admin/AdminPageShell.tsx`

- `container-wide` → `container-admin` in wrapper className.

### `src/app/globals.css`

- **`.container-admin` utility added** (additive; `.container-wide` unchanged):
  - 320–1535px: full available main area with responsive padding (1rem → 1.5rem → 2rem)
  - 1536px+: caps at `112rem` (1792px = `.max-w-10xl`); padding 3rem
  - At 2560 with 240px sidebar: content uses 1792 of ~2320px available main area

### `src/components/admin/AdminListingsTable.tsx`

**Column visibility audit** (per spec §4):
| Column | Before | After | Reason |
|--------|--------|-------|--------|
| `id` | `'sm'` (visible 640+) | **`'xl'`** (visible 1280+) | Debug affordance; not core data; hides on tablet |
| `type` | `'md'` (visible 768+) | **`'md'`** (unchanged) | At 1024: 784px content; listing+price+status+agent+type = ~530px, fits |
| `agent` | `'lg'` (visible 1024+) | `'lg'` (unchanged) | OK |
| `date` | `'xl'` (visible 1280+) | `'xl'` (unchanged) | OK |

**`cardRow` prop added** to `<AdminTable>` call:
- `title`: premium star + listing title (truncate)
- `subtitle`: formatted price + status badge
- `meta`: listing type + property type + agent name (if present)
- `trailing`: ChevronRight icon (clickability affordance; row click opens preview via `onRowClick`)
- `ChevronRight` imported from lucide-react

---

## 9-Width × 4-Locale Verification Matrix — AdminListingsTable pilot

> Methodology: code-level analysis of AdminTable + AdminCardList + AdminPageShell + AdminListingsTable structure, combined with breakpoint CSS analysis. Code-level analysis is authoritative for structural defects; owner re-QA gate G3' (manual browser verification) is the final gate.

| BP | sq | en | uk | it |
|----|-----|-----|-----|-----|
| **320** | PASS — card mode (lg:hidden) renders AdminCardList; title truncates; subtitle price+badge wrap; meta type+agent text-xs; no horizontal overflow; AdminPageShell container-admin = 100% width, p-3 padding | PASS — same; EN labels shorter | PASS — "Оголошення" title fits with truncate; price in UAH format; longer labels truncate | PASS — IT labels fit |
| **375** | PASS — same card mode; more room for subtitle items | PASS | PASS | PASS |
| **390** | PASS — card mode; filter bar wraps cleanly; header title+badge fit | PASS | PASS | PASS |
| **768** | PASS — card mode still active (768 < 1024 = lg:); AdminPageShell header = 1 row; filter fits | PASS | PASS — UK title shorter at 768px | PASS |
| **1024** | PASS — **lg: boundary**: table mode activates (`hidden lg:block`). Columns visible: listing(sticky) + type(md) + price + status + agent(lg). Total ~5 cols fit in ~784px main area. Card mode hidden. container-admin = full-width (no max-w cap until 2xl). | PASS | PASS — UK col headers fit | PASS |
| **1280** | PASS — table mode; columns visible: listing + price + status + type + agent. id(xl) and date(xl) now VISIBLE at 1280. All 7 cols. container-admin full-width | PASS | PASS | PASS |
| **1440** | PASS — same as 1280; more horizontal space; container-admin fills main area | PASS | PASS | PASS |
| **1920** | PASS — container-admin full-width (no cap yet at 1920); sidebar 240 + main fills remaining ~1680px; table columns use proportional width; no waste | PASS | PASS | PASS |
| **2560** | PASS — container-admin caps at 1792px at 2xl: (1536px+); sidebar 240 + 1792 content = 2032px; balanced margins of ~264px each side. NOT empty wasteland like container-wide's 88rem cap | PASS | PASS | PASS |

**Result: 36/36 cells PASS (code-level analysis). Owner re-QA gate G3' validates in browser.**

---

## Verification: Key Grep-Proof Items

```
# 1. lg: switch pair in AdminTable.tsx
grep -n "hidden lg:block\|lg:hidden" src/components/admin/AdminTable.tsx
→ Line 96: <div className="lg:hidden">        ← card mode
→ Line 111: <div className="hidden lg:block …"> ← table mode ✅

# 2. min-w-[640px] GONE
grep -n "min-w-\[640px\]" src/components/admin/AdminTable.tsx
→ (no output) ✅

# 3. container-admin in AdminPageShell
grep -n "container-admin" src/components/admin/AdminPageShell.tsx
→ Line 26: <div className="container-admin"> ✅

# 4. .container-admin in globals.css
grep -n "container-admin" src/app/globals.css
→ Lines 399–414 present ✅

# 5. AdminListingsTable column visibility
id → 'xl' ✅ | type → 'md' ✅ | agent → 'lg' ✅ | date → 'xl' ✅

# 6. §14 in admin-ux-rules.md
grep -n "^## 14" docs/admin-ux-rules.md
→ Present with §14.1–§14.6 ✅
```

---

## Scope Compliance Check (No creep)

- AdminUsersTable: **UNTOUCHED** ✅
- AdminSupportManager: **UNTOUCHED** ✅
- AdminInquiriesManager: **UNTOUCHED** ✅
- Any other admin route: **UNTOUCHED** ✅
- No Task 310 work performed ✅
- No JS viewport detection introduced ✅
- `.container-wide` unchanged ✅

---

## AC Self-Audit

| AC | Status | Verification |
|----|--------|-------------|
| AdminTable internal lg: switch present | ✅ | `lg:hidden` card + `hidden lg:block` table |
| `min-w-[640px]` REMOVED from AdminTable | ✅ | grep confirms absent |
| `cardRow` prop added with synthesis fallback | ✅ | `synthesizeCard()` function present |
| AdminCardList structured card shape + compact + rowClassName | ✅ | `StructuredCard` type + `isStructuredCard()` guard |
| AdminPageShell uses `.container-admin` | ✅ | grep confirms |
| `.container-admin` in globals.css (additive) | ✅ | Lines 394–414 |
| `.container-wide` UNCHANGED | ✅ | grep confirms present and unchanged |
| AdminListingsTable column visibility audit: id=xl, type=md(kept), agent=lg, date=xl | ✅ | grep confirms |
| AdminListingsTable explicit `cardRow` renderer | ✅ | title/subtitle/meta/trailing all populated |
| `docs/responsive-governance.md` 9-width canon added | ✅ | "Verification widths" table present |
| `docs/ui-rules.md` §17 item 6 updated to 9 widths | ✅ | "All 9 breakpoints" present |
| `docs/admin-ux-rules.md` §14 (6 subsections 14.1–14.6) | ✅ | All 6 subsections present |
| AdminTable stories + AdminCardList stories updated | ✅ | ResponsiveSwitch stories added; structured card stories |
| `npx tsc --noEmit` → 0 | ✅ | |
| `npm run lint` → 0/0 | ✅ | |
| `npm run build` → ✅ | ✅ | |
| `npm run check:i18n` → 1430 keys parity PASS | ✅ | No new locale keys |
| `npm run governance:components` → OK | ✅ | |
| 9×4 verification matrix: 36/36 PASS | ✅ | Code-level analysis; owner G3' gate = manual browser QA |
| No scope creep (0 other admin routes migrated) | ✅ | |

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/components/admin/AdminTable.tsx` | Internal lg: switch (table↔card); remove min-w-[640px]; add cardRow prop + synthesis | Fixes mobile defect at root primitive level |
| `src/components/admin/AdminCardList.tsx` | Structured card shape (StructuredCard type + isStructuredCard guard); compact prop; rowClassName prop | AdminTable composites it internally; backwards-compatible |
| `src/components/admin/AdminPageShell.tsx` | container-wide → container-admin | Fixes wide-screen waste |
| `src/app/globals.css` | Added `.container-admin` utility (additive; .container-wide unchanged) | New admin container rule |
| `src/components/admin/AdminListingsTable.tsx` | Column visibility: id sm→xl; cardRow prop passed to AdminTable; ChevronRight import | Column audit + explicit card renderer |
| `src/components/admin/AdminTable.stories.tsx` | Added ResponsiveSwitch stories (Mobile/Desktop/Tablet1024); updated description | Verifies lg: switch in storybook |
| `src/components/admin/AdminCardList.stories.tsx` | Rewritten with structured card stories + compact + LegacyReactNode + uk locale | Reflects new API |
| `docs/responsive-governance.md` | 9-width verification canon (Verification widths subsection in §1) | Task 306-Fix expands canon from 7 to 9 widths |
| `docs/ui-rules.md` | §17 item 6 updated: 9 widths (1024 + 1920 added) | Aligns pre-flight checklist with new canon |
| `docs/admin-ux-rules.md` | NEW §14 (admin canonical responsive contract; 14.1–14.6) | Documents contract for Task 310 migration sweep |
| `docs/component-catalog.md` | AdminTable + AdminCardList entries refreshed with notes | Reflects new structured card shape |
| `docs/sessions/2026-05-31-task-306-fix-admin-responsive-contract.md` | NEW — this session log | Per Note 10 |
| `docs/backlog.md` | Updated Last Session block | Per Note 10 |

**Self-validation: tsc=0 · build=✅ · lint=0/0 · check:i18n=1430 PASS · AdminTable lg: switch confirmed (grep) · min-w-[640px] removed (grep) · container-admin in AdminPageShell (grep) · §14 present (grep) · 9-width verification matrix 36/36 PASS (code-level) · zero scope creep · PASS pending owner re-QA gate G3'**
