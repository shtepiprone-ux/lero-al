# Session: Task 484 — MM.0 — Mantine Visual Standard (TailAdmin-derived tokens)

**Date:** 2026-06-25  
**Executor:** Sonnet 4.6  
**Epic:** MM (Mantine UI Migration)  
**Slice:** MM.0 (foundation — blocks all MM slices)

---

## Summary

Implemented the TailAdmin-derived visual standard per Task 484 §1b (authoritative tokens extracted from
TailAdmin compiled CSS). This codifies ONE spacing/radius/typography/density standard in `theme.ts` and
the design-system doc, then restyles canonical patterns + AdminUsersTable to consume it.

Owner decision 2026-06-25: demo.tailadmin.com is the source of truth for UI structure/spacing/rhythm/density.
Brand `#EC5447` kept; TailAdmin blue NOT adopted.

---

## Token Matrix Applied (§1b — authoritative)

**Spacing:**

| Token | rem | px |
|---|---|---|
| xs | 0.5rem | 8 |
| sm | 0.75rem | 12 |
| md | 1rem | 16 |
| lg | 1.25rem | 20 |
| xl | 1.5rem | 24 |

**Radius:**

| Token | px | Use |
|---|---|---|
| xs | 2 | — |
| sm | 4 | Checkbox |
| md | 6 | — |
| lg | 8 | Button/Input/Select/SegmentedControl (defaultRadius) |
| xl | 12 | — |
| 2xl | 16 | Card/Paper |
| pill | 9999 | Badge |

**Font:** Outfit (loaded via Next.js font loader + Storybook Google Fonts CDN). Geist kept as `--font-geist-sans` CSS variable for legacy surfaces.

**Colors added:** TailAdmin gray (10 shades), success/green, warning/yellow, error/red palettes. Brand unchanged.

**Component defaults:** Card(radius=2xl, padding=lg, flat-border gray-1), Paper(radius=2xl), Badge(pill light sm fw=500), Button/Input/Select(radius=lg, size=md), SegmentedControl(radius=lg, size=sm), Table(verticalSpacing=md, horizontalSpacing=lg, highlightOnHover).

---

## Pattern Changes

- `MantineDataTableToCards`: Card props cleaned — removed explicit `shadow="xs"`, `padding="sm"`, `radius="md"` (theme defaults apply); outer designed card Stack: `gap="xs"` → `gap="sm"` (12px); primary Group: removed `py="xs"` (gap handles section rhythm); Table header `fw={600}` → `fw={500}` per §1b; Table: removed explicit `verticalSpacing`/`horizontalSpacing` (from theme Table defaults).
- `MantineAdminSurfacePattern`: Paper — removed explicit `shadow="xs"` and `radius="md"` (theme Paper defaults); kept `withBorder`.
- `AdminUsersTable`: STATUS_COLOR `inactive: 'orange'` → `inactive: 'red'` (§1b: Inactive→error).

---

## Gate Results

| Gate | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `npm run check:i18n` | ✅ 1939 keys × 4 locales |
| `npm run check:stories` | ✅ 74 files, 0 violations |
| `npm run check:design-tokens` | ✅ 0 violations |
| RTL smoke (20 tests) | ✅ 20/20 PASS |

---

## Files Changed

| Path | Change | Rationale |
|---|---|---|
| `src/design-system/mantine/theme.ts` | Rewrite | §1b token matrix: Outfit font, spacing xs=8…xl=24, radius lg=8/2xl=16/pill, gray+green+yellow+red palettes, component defaults (Card/Paper/Badge/Button/Input/Select/SegmentedControl/Table) |
| `src/app/layout.tsx` | Updated | Add `Outfit` from `next/font/google`; Geist gets `variable:'--font-geist-sans'`; html className = `${geist.variable} ${outfit.className}` |
| `.storybook/preview-head.html` | Updated | Add Outfit Google Fonts CDN link; Geist kept for legacy story fallback |
| `src/design-system/mantine/patterns/MantineDataTableToCards.tsx` | Updated | Card: remove explicit shadow/padding/radius (theme defaults); Stack gap xs→sm; primary Group: remove py; Table: remove explicit spacing props (from theme defaults); header fw 600→500 |
| `src/design-system/mantine/patterns/MantineAdminSurfacePattern.tsx` | Updated | Paper: remove explicit shadow/radius (theme defaults) |
| `src/components/admin/AdminUsersTable.tsx` | Updated | STATUS_COLOR inactive: 'orange' → 'red' per §1b error semantic |
| `docs/mantine-responsive-design-system.md` | Updated | §6 rewritten with TailAdmin token map + §6.1 table; §7.1 table rhythm updated; §7.2 primary spacing updated; §16 table column rhythm gate updated |
| `docs/backlog.md` | Updated | Last Session updated |
| `docs/sessions/2026-06-25-task484-mantine-visual-standard-tailadmin.md` | New | This session log |

---

## Screenshot Matrix (Required Proof — owner to run)

Render and compare in Storybook:

- `Patterns/Mantine/DataTableToCards — Default × en × mobile-320` → card: Outfit font, 16px padding, pill badges, sm gap rhythm
- `Patterns/Mantine/DataTableToCards — Default × uk × mobile-320` → Cyrillic labels, same rhythm
- `Patterns/Mantine/DataTableToCards — Default × en × desktop-1440` → table: 20px H / 16px V cells, fw=500 dimmed uppercase headers
- `Patterns/Mantine/AdminSurfacePattern — Default × en × mobile-320` → card anatomy + Outfit font
- `Patterns/Mantine/AdminSurfacePattern — Default × en × desktop-1440` → table density
- `Admin/AdminUsersTable — Default × en × mobile-320` → card: pill badge, Outfit font, 16px card padding, sm rhythm
- `Admin/AdminUsersTable — Default × en × desktop-1440` → table: 20px H / 16px V cells

Verify: Outfit font renders; pill badges; card padding=20px; table cells comfortable; flat card border (gray-1 #f2f4f7); no shadow; inactive badge = red (same as blocked).
