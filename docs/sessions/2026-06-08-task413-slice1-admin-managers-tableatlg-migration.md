# Task 413 — Slice 1: Admin Managers tableAtLg Migration

**Date:** 2026-06-08  
**Executor:** Sonnet 4.6  
**Task file:** `tasks/Sprints/Sprint_35_kickoff_prompt_Task_413_Slice1_AdminManagersTableAtLgMigration.md`

---

## Scope

Migrated three admin managers off raw `<table className="w-full text-sm">` onto the canonical
`AdminTable`/`AdminCardList` `tableAtLg` pattern (cards `<lg` / table `≥lg`), fixing the 60
machine-confirmed horizontal-overflow cells from the Task 411 rendered run.

**In scope:**
- `src/components/admin/AdminCurrenciesManager.tsx`
- `src/components/admin/AdminPropertyTypesManager.tsx`
- `src/components/admin/AdminCompaniesManager.tsx`
- `src/components/admin/AdminCompaniesManager.stories.tsx` (render-fn → args pattern fix)

**Out of scope (preserved exactly):** Raw `fixed inset-0` CurrencyFormDialog modal; all other
modals (Slice 2 = §26.2 bottom-sheet compliance). `AdminTable`/`AdminCardList` primitives not
modified.

---

## Before/After Control Inventory

### AdminCurrenciesManager

| Control | Before | After |
|---------|--------|-------|
| Search input | `Input` with `flex-1 max-w-xs` wrapper | `Input` with `flex-1` in `flex-col sm:flex-row` toolbar |
| Add button | `Button` next to search at all sizes | `Button` full-width `<sm`, side-by-side `≥sm` |
| Table columns | raw `<table>`: code (button→detail), symbol, name_en, is_active (badges), last_updated | `AdminTable` columns: same 5 cols, `last_updated` `visibility:'lg'` |
| Row click | Only code button clickable → detail dialog | `onRowClick` makes whole row/card clickable → detail dialog; code button preserves `e.stopPropagation()` in table mode |
| Detail dialog | Unchanged (canonical Dialog) | Unchanged |
| Delete dialog | Unchanged (canonical Dialog) | Unchanged |
| CurrencyFormDialog | Unchanged (`fixed inset-0` — out of scope) | Unchanged |
| Card (new) | N/A | title=code, subtitle=symbol·name, meta=badges, trailing=ChevronRight |
| Empty state | `<td colSpan={5}>` | `emptyState` prop |

### AdminPropertyTypesManager

| Control | Before | After |
|---------|--------|-------|
| AdminSearchInput | `flex-1 max-w-xs` | `flex-1` in `flex-col sm:flex-row` toolbar |
| Add button | `Button` side-by-side | Full-width `<sm`, side-by-side `≥sm` |
| Table columns | raw `<table>`: ID, slug (code), SQ name (button→edit), EN/UK/IT, sort_order, is_active (toggle badge), created | `AdminTable` 7 cols: id(`xl`), slug(`sm`), name_sq(`always`), names(`md`), sort_order(`lg`), is_active(`always`), created(`xl`) |
| Row click | Only name_sq button → edit | `onRowClick` whole row/card → edit; name_sq button `e.stopPropagation()` |
| is_active toggle | Inline clickable badge in table row | Preserved in BOTH table cell AND cardRow meta; `e.stopPropagation()` prevents edit-dialog opening on toggle |
| Edit dialog (PropertyTypeFormDialog) | Unchanged | Unchanged |
| Delete dialog | Unchanged | Unchanged |
| Card (new) | N/A | title=name_sq, subtitle=slug code, meta=is_active toggle + EN/UK/IT names |
| Empty state | `<p>` inside bg-card wrapper | `emptyState` prop |

### AdminCompaniesManager

| Control | Before | After |
|---------|--------|-------|
| Search input | `Input` `flex-1 max-w-xs` wrapper | `Input` `flex-1` in `flex-col sm:flex-row` toolbar |
| Add button | `Button` `ml-auto` | Full-width `<sm`, natural-width `≥sm` |
| Table columns | raw `<table>`: logo(`w-14`), name(button→edit + Trash2), agents(`hidden sm:table-cell`), created(`hidden md:table-cell`) | `AdminTable` 4 cols: logo(`always`,`w-14`), name(`always`), agents(`visibility:'sm'`), created(`visibility:'md'`) |
| ad-hoc `hidden sm/md:table-cell` | Present — non-canonical partial pattern | **Replaced** by `AdminTable` `visibility` tokens (`sm`/`md`) |
| Row click | Only name button → edit | `onRowClick` whole row/card → edit; name button `e.stopPropagation()` |
| Trash2 delete | Inline button in name cell | Preserved in BOTH table cell AND cardRow trailing; `e.stopPropagation()` prevents edit-dialog opening on delete |
| CompanyFormDialog | Unchanged (canonical Dialog with logo upload) | Unchanged |
| Delete confirmation Dialog | Unchanged | Unchanged |
| Card (new) | N/A | title=name, subtitle=agent count, trailing=Trash2 + ChevronRight |
| Empty state | Separate `<p>` before table | `emptyState` prop |

### AdminCompaniesManager.stories.tsx

| Before | After |
|--------|-------|
| `meta: Meta` (untyped) + `render: () => <AdminCompaniesManager companies={FIXTURE_COMPANIES} />` in each story | `meta: Meta<typeof AdminCompaniesManager>` with `component` + `args: { companies: FIXTURE_COMPANIES }` |
| 3 stories each have `render` fn | 3 stories each have only `globals` (Default/Tablet/LocaleStress) — consistent with other 2 manager stories |

---

## Validation Transcripts

### 1. `npx tsc --noEmit`

```
(no output = exit 0)
```

### 2. `npm run lint`

```
> lero-al@0.1.0 lint
> eslint

C:\Claude_Code_Projects\lero-al\src\components\admin\AdminTable.stories.tsx
  647:5  warning  Unused eslint-disable directive (no problems were reported from 'react-hooks/rules-of-hooks')

✖ 1 problem (0 errors, 1 warning)
  0 errors and 1 warning potentially fixable with the --fix` option.
```

Pre-existing warning in `AdminTable.stories.tsx` (not from this task). 0 new errors.

### 3. `npm run check:stories`

```
✅ check:stories PASSED — 47 files checked, 0 violations.
```

### 4. `npm run check:i18n`

```
✅ Parity PASSED — all 4 locale files have identical key sets (1768 keys).
⚠️  Raw-enum scan found potential issues — see above for manual review.
   (Non-blocking — does not fail the build.)
```

Parity clean; the raw-enum warning is the pre-existing `AdminInquiriesManager.tsx:288` false-positive from prior tasks. No new keys added (all column headers use pre-existing locale keys).

### 5. `npm run check:story-coverage`

```
✅  check:story-coverage PASSED — all components are covered or explicitly exempt.
```

### 6. `npm run build-storybook`

```
◇  Storybook build completed successfully
   Output directory: C:/Claude_Code_Projects/lero-al/storybook-static
   Built in 22.36s (Storybook v10.4.2)
```

### 7. File-integrity gate (clause 14)

| File | NUL | BOM | Lines | Tail |
|------|-----|-----|-------|------|
| `AdminCurrenciesManager.tsx` | 0 | False | 460 | `}` |
| `AdminPropertyTypesManager.tsx` | 0 | False | 412 | `}` |
| `AdminCompaniesManager.tsx` | 0 | False | 438 | `}` |
| `AdminCompaniesManager.stories.tsx` | 0 | False | 24 | `}` |

✅ All clean.

### 8. `npm run screenshots:assert`

```
📸  Starting rendered assertion (full mode)
    Stories: 45 | Viewports: 14 | Locales: 4
    Output: .screenshots/rendered-assert/2026-06-08T12-42/

✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓ ... (2520 ✓ total)

Results: 2520/2520 PASS, 0 FAIL
Manifest: .screenshots/rendered-assert/2026-06-08T12-42/manifest.json
PNGs: .screenshots/rendered-assert/2026-06-08T12-42/*.png

✅ All rendered assertions PASSED.
```

**Previously: 2459/2520 PASS, 61 FAIL (60 overflow + 1 infra flake)**  
**Now: 2520/2520 PASS, 0 FAIL — the 60 overflow cells are green, infra flake gone this run.**

---

## Rendered Verification Matrix

**Card mode (below lg = <1024px) — machine-confirmed PASS:**

All 3 managers now render `AdminCardList` at `<lg` viewports. The `divide-y rounded-2xl border bg-card` card container is full-width at all breakpoints. Cards at 320/375/390/480/560/680/768/810/960 show:
- **Currencies:** code (span) · symbol · name · badges
- **PropertyTypes:** name_sq · slug code · is_active toggle · names
- **Companies:** name · agent count · Trash2+ChevronRight trailing

All 45 stories × 14 viewports × 4 locales = 2520 cells PASS. No raw `<table>` at any `<lg` viewport.

**Table mode (lg+ = ≥1024px) — machine-confirmed PASS:**

`AdminTable` column visibility tokens: Currencies (`last_updated` hidden `<lg`), PropertyTypes (`id`/`created` hidden `<xl`, `slug` from `sm`, `sort_order` from `lg`), Companies (`agents` from `sm`, `created` from `md`).

**§MQ manual checks:**

- ✅ Cards full-width edge-to-edge at <640 (`divide-y rounded-2xl border bg-card` spans 100% of container)
- ✅ Toolbar: `flex flex-col sm:flex-row gap-3` → search Input full-width at <640, Add button full-width at <640
- ✅ is_active toggle: `button` wrapper around `Badge` — accessible, `≥44px` combined touch target
- ✅ Trash2 delete: `size="icon-sm"` icon-only button with `aria-label={tc('delete')}` — icon-only exemption applies
- ✅ No `overflow-hidden` masking, no `whitespace-nowrap` on localized labels, no arbitrary widths
- ✅ Modals preserved exactly (Slice 2 scope, not regressed)
- ✅ uk@320/375/390: all 3 managers render cards, no overflow

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/components/admin/AdminCurrenciesManager.tsx` | Replace raw `<table>` with `AdminTable`; toolbar `flex-col sm:flex-row`; add `AdminTable`/`ChevronRight` imports | Fix 20 overflow cells (5 narrow vp × 4 locales) |
| `src/components/admin/AdminPropertyTypesManager.tsx` | Replace raw `<table>` + `overflow-x-auto` wrapper with `AdminTable`; toolbar `flex-col sm:flex-row`; replace ad-hoc none | Fix 20 overflow cells; replace non-canonical search wrapper |
| `src/components/admin/AdminCompaniesManager.tsx` | Replace raw `<table>` with `AdminTable`; replace `hidden sm/md:table-cell` with `visibility` tokens; toolbar `flex-col sm:flex-row` | Fix 20 overflow cells; canonicalize ad-hoc visibility pattern |
| `src/components/admin/AdminCompaniesManager.stories.tsx` | render-fn → args pattern; type `Meta<typeof AdminCompaniesManager>` | Consistent story structure; args-driven controls work |
