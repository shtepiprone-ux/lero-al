# Session: Task 485 — MM.1b — Admin table TailAdmin-faithful composition

**Date:** 2026-06-25  
**Executor:** Sonnet 4.6  
**Epic:** MM (Mantine UI Migration)  
**Slice:** MM.1b (admin table card-wrapped composition — builds on MM.0 tokens from Task 484)

---

## Summary

Replicated TailAdmin CRM card-wrapped table block (§6b) 1:1 in `MantineDataTableToCards` (desktop).
Restructured `AdminUsersTable` to composite user cell + right-aligned actions column per TailAdmin anatomy.
Updated theme Table defaults (sm×xl = 12×24, correcting Task 484's md×lg = 16×20).
UI-only. All 20 smoke tests pass. All gates green.

---

## TailAdmin §6b anatomy applied

```
Paper(radius 2xl, gray-2 border, overflow hidden)
  └─ ScrollArea
       └─ Table(withRowBorders, --table-border-color: gray-1)
            THEAD TR: bg-gray-0, border-top + border-bottom gray-1
              TH: size=xs fw=500 c=gray.5 — NOT uppercase — spacing from theme (xl×sm = 24×12)
            TBODY TR: row dividers gray-1, hover bg-gray-0
              TD: whitespace-nowrap, c=gray.7, spacing from theme (xl×sm = 24×12)
```

---

## Changes

### Theme (corrected Task 484 error)
- `Table.defaultProps.verticalSpacing`: `'md'` → `'sm'` (12px — §6b py-3=12)
- `Table.defaultProps.horizontalSpacing`: `'lg'` → `'xl'` (24px — §6b px-6=24)

### `MantineDataTableToCards` (desktop table path)
- Added `Paper, ScrollArea` imports
- Added `tableHeader?: ReactNode` prop
- Desktop render: `Paper(withBorder, gray-2 border, overflow hidden) > ScrollArea > Table`
- `Table`: `withRowBorders`, no `withTableBorder`; `styles.thead` bg-gray-0 + border-y gray-1; `styles.td/th` whitespace-nowrap; `styles.table['--table-border-color']` = gray-1
- `Th` text: `c="gray.5"` (was `c="dimmed"`, now exact §6b gray-500 match)
- Default `renderCell` Text: `c="gray.7"` (§6b text-gray-700 on cells)

### `MantineAdminSurfacePattern`
- Removed `<Paper withBorder>` wrapper — `MantineDataTableToCards` is now self-wrapping
- Removed `Paper` from imports

### `AdminUsersTable`
- Removed `verifyToggleCell()` helper (verify/revoke now inline in `actions` column)
- `userColumns`:
  - `user` (35%): Avatar `size={40}` `radius="pill"` (40px circular), name as Link (no testid), company+#id subtitle in one line
  - `role` (10%), `status` (10%), `phone` (13%): unchanged except narrowed widths
  - `date` (20%): unchanged
  - NEW `actions` (12%, right): verify/revoke ActionIcon (`revoke-btn`/`verify-btn`) + ChevronRight Link (`user-detail-link`)
- `verifiedColumns`:
  - `agent` (55%): Avatar `size={40}` `radius="pill"` + name Link (`agent-detail-link`) + company subtitle
  - Removed `company` column (merged into agent composite)
  - `date` (25%): unchanged
  - NEW `revoke` (10%, right): revoke ActionIcon (`revoke-btn`)
- `userCard.avatar`: `size="sm"` → `size="md"` + `radius="pill"` for circular mobile avatar
- Row loading: handled by `rowClassName` opacity-50; per-element opacity removed from user column

---

## Gate Results

| Gate | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `npm run check:i18n` | ✅ 1939 keys × 4 locales |
| `npm run check:stories` | ✅ 74 files, 0 violations |
| `npm run check:design-tokens` | ✅ 0 violations |
| RTL smoke (vitest) | ✅ 20/20 PASS |

---

## Files Changed

| Path | Change | Rationale |
|---|---|---|
| `src/design-system/mantine/theme.ts` | Updated | Table defaultProps: verticalSpacing sm(12) + horizontalSpacing xl(24) per §6b CRM |
| `src/design-system/mantine/patterns/MantineDataTableToCards.tsx` | Updated | Desktop: Paper card-wrapper + ScrollArea + Table with §6b styling; `tableHeader?` prop; Th gray.5 not uppercase; Td gray.7 nowrap |
| `src/design-system/mantine/patterns/MantineAdminSurfacePattern.tsx` | Updated | Remove Paper wrapper (MantineDataTableToCards self-wraps) |
| `src/components/admin/AdminUsersTable.tsx` | Updated | Composite user cell (40px avatar + name + subtitle); actions column (verify/revoke + detail link); verifiedColumns composite agent; userCard avatar pill |
| `docs/mantine-responsive-design-system.md` | Updated | §6.1 token use updated (sm/xl); §6.1 Table defaults row updated; §7.1 table rhythm updated (sm×xl); §16 table column rhythm gate updated with card-wrapper requirement + §6b citation |
| `docs/sessions/2026-06-25-task485-admin-table-tailadmin-composition.md` | New | This session log |

---

## Screenshot Matrix (Required Proof — owner to run)

Render and compare in Storybook vs [demo.tailadmin.com](https://demo.tailadmin.com) CRM table:

- `Patterns/Mantine/DataTableToCards — Default × en × desktop-1440` → card wrapper (rounded-2xl, gray-200 border), thead bg-gray-50 + border-y, cells 24×12, gray-700 text, row dividers
- `Patterns/Mantine/DataTableToCards — Default × en × desktop-1024` → columns balanced, nowrap, no horizontal scroll
- `Admin/AdminUsersTable — Default × en × desktop-1440` → composite user cell (40px avatar + name + company+#id subtitle) + right-aligned actions (shield + chevron)
- `Admin/AdminUsersTable — Default × uk × desktop-1440` → Cyrillic, same layout
- `Admin/AdminUsersTable — Default × en × mobile-320` → cards, 40px circular avatar, pill badges
- `Admin/AdminUsersTable — Default × uk × mobile-320` → Cyrillic cards

Verify: card has rounded-2xl + gray-200 border; thead is bg-gray-50 + border-y gray-100; cells are 24px horizontal / 12px vertical (inspect computed style); user column shows avatar+name+subtitle; actions column right-aligned; no horizontal scroll at 1024.
