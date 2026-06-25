# TailAdmin Style Reference — extracted source of truth (owner-supplied files, 2026-06-25)

> **Owner decision:** TailAdmin (https://demo.tailadmin.com) is the source of truth for lero-al UI styling —
> spacing matrix (H/V), typography, color, density, component conventions. Extracted directly from the owner's
> uploaded TailAdmin build (`css/style.css` Tailwind v4 `@theme` + HTML markup), NOT guessed.
>
> **Scope of "apply all styles":** adopt the FULL token system below into `src/design-system/mantine/theme.ts`,
> and apply the component conventions to the lero-al components/surfaces that actually exist (per the Epic MM
> migration map) — progressively, slice by slice. We do NOT clone all 500+ TailAdmin components; we match its
> visual system on our components. **Brand color stays `#EC5447`** (NOT TailAdmin's `#465fff`); everything else
> (gray, semantic, spacing, type, radius, density) is adopted.

## 1. Foundations

- **Font:** `Outfit, sans-serif` (owner-adopted).
- **Spacing grid:** 4px base (`--spacing: 0.25rem`). Common steps: 8 (gap), 12, 16 (card/table vertical), 20
  (card pad / table horizontal), 24 (block gap), 32.
- **Breakpoints:** sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536.

## 2. Type scale (px / line-height)

| Token | size | line-height | Use |
|---|---|---|---|
| theme-xs | 12 | 18 | labels, table headers, meta, badges |
| theme-sm | 14 | 20 | body, table cells, inputs, buttons |
| base | 16 | 24 | emphasized body |
| lg | 18 | — | card/section title |
| theme-xl | 20 | 30 | sub-heading |
| title-xs…2xl | 24 / 30 / 36 / 48 / 60 / 72 | 32 / 38 / 44 / 60 / 72 / 90 | page/hero headings |

## 3. Radius

xs 2 · sm 4 · md 6 · **lg 8 (controls)** · xl 12 · **2xl 16 (cards)** · 3xl 24 · full (pill badges).

## 4. Color palette

Adopt gray + semantic as-is; **keep brand `#EC5447`** (replace TailAdmin `brand-500 #465fff`).

| Scale | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| gray | #f9fafb | #f2f4f7 | #e4e7ec | #d0d5dd | #98a2b3 | #667085 | #475467 | #344054 | #1d2939 | #101828 | #0c111d |
| success | #ecfdf3 | #d1fadf | — | #6ce9a6 | — | #12b76a | #039855 | #027a48 | #05603a | — | — |
| warning | #fffaeb | — | — | — | #fdb022 | #f79009 | #dc6803 | #b54708 | — | — | — |
| error | #fef3f2 | #fee4e2 | — | #fda29b | #f97066 | #f04438 | #d92d20 | #b42318 | #912018 | — | — |
| blue-light | #f0f9ff | — | — | #7cd4fd | #36bffa | #0ba5ec | #0086c9 | — | — | — | — |
| orange | #fff6ed | — | — | — | #fd853a | #fb6514 | — | — | — | — | — |

Accent: theme-pink #ee46bc · theme-purple #7a5af8. `gray-dark` #1a2231. Primary text gray-700/800; secondary text gray-500; borders gray-100/200.

## 5. Shadow

- `shadow-theme-xs` ≈ `0 1px 2px 0 rgba(0,0,0,0.05)` — subtle, used on inputs/controls.
- Content cards: **NO shadow** (flat border). Shadow (`shadow-theme-lg`) only on dropdowns/popovers/menus.

## 6. Component conventions (real classes)

| Component | TailAdmin class essence | Mantine mapping |
|---|---|---|
| **Card** (content) | `rounded-2xl border border-gray-100 bg-white p-5 sm:p-6` (no shadow) | `Card`/`Paper` radius 16, `withBorder` (gray-100), shadow none, padding 20/24 |
| **Table header** | `px-5 py-4 text-left text-xs font-medium text-gray-500` | `Table.Th` 20×16 pad, `Text size=xs fw=500 c=dimmed` |
| **Table cell** | `px-5 py-4` (text-sm gray-700/800) | `Table` `horizontalSpacing≈20`, `verticalSpacing=16`, `highlightOnHover`, row divider gray-100 |
| **Status badge** | `text-theme-xs rounded-full px-2 py-0.5 font-medium bg-{sem}-50 text-{sem}-700` | `Badge` pill, size sm, variant light, color = success/warning/error |
| **Button (primary)** | `bg-brand-500 hover:bg-brand-600 rounded-lg p-3 text-theme-sm font-medium text-white` | `Button` filled brand, radius 8, ~44px, size md, fw 500 |
| **Button (secondary/outline)** | `border border-gray-300 bg-white rounded-lg p-3 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 shadow-theme-xs` | `Button` default/outline, radius 8, gray-300 border |
| **Input / Select / Textarea** | `h-11 rounded-lg border border-gray-200 bg-transparent py-2.5 px-4 text-sm text-gray-800 placeholder:text-gray-400 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 focus:ring-3` | `TextInput`/`Select`/`Textarea` size md (h 44), radius 8, border gray-200, focus ring brand |
| **Label** | `text-theme-sm font-medium text-gray-700` | form label 14 fw500 gray-700 |
| **Avatar (sm)** | `h-11 w-11 rounded-full` | `Avatar` ~44, radius full |

## 6b. Admin table BLOCK anatomy (CRM "Recent Orders" reference — exact)

The whole table is a **card**, not a bare table. Replicating this structure (not just tokens) is what makes it
look like the reference.

- **Card wrapper:** `rounded-2xl` (16) · `border border-gray-200` (#e4e7ec) · `bg-white` · `px-5 pt-5 pb-5
  sm:px-6 sm:pt-6` (20→24). Card header above table: title `text-lg font-semibold gray-800` + actions (Filter /
  See all / tabs).
- **Scroll:** `max-w-full overflow-x-auto`.
- **Thead tr:** `border-y border-gray-100` (#f2f4f7) + **`bg-gray-50`** (#f9fafb).
- **Th:** `px-6 py-3` (24×12) · `whitespace-nowrap` · `text-theme-xs` (12) · `font-medium` · `text-gray-500`
  · left · NOT uppercase.
- **Td:** `px-6 py-3` · `whitespace-nowrap` · 14px · `text-gray-700`. Row divider gray-100; hover `bg-gray-50`.
- **Composite user cell:** `flex items-center gap-3` → avatar `h-10 w-10 rounded-full` (tinted) + stack(name
  `text-theme-sm font-medium text-gray-700`, subtitle `text-theme-xs text-gray-500 mb-0.5`).
- **Status cell:** `rounded-full px-2 py-0.5 text-theme-xs font-medium bg-{sem}-50 text-{sem}-600`.
- **Action cell:** right-aligned icon buttons.

> The previous §6 "Table cell" row (20×16 from basic-tables) and this CRM block (24×12 card-wrapped) are two
> TailAdmin table densities. **Use THIS card-wrapped CRM block as the admin-table standard** — it is the owner's
> reference.

## 7. Application plan

1. **Task 484 (MM.0):** encode §1–§5 tokens + §6 core component defaults (Card, Table, Badge, Button, Input,
   Select, Textarea, focus ring) into `theme.ts`; cite this doc from `mantine-responsive-design-system.md` §6.
2. **MM slices:** each surface/primitive migration applies the §6 conventions for the components it uses,
   consuming theme tokens (zero raw spacing px).
3. **Gate:** any migrated surface that hand-rolls spacing/color instead of theme tokens FAILS review.
