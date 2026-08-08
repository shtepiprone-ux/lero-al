# Global Responsive Design System Contract — v1

> **Task 482 supersession notice — 2026-06-24.**
> This document is now a LEGACY reference for existing Tailwind/Base UI/shadcn-style surfaces only.
> It is not the future responsive UI authority. New UI/layout/component work must use
> `docs/mantine-responsive-design-system.md` as the source of truth. Mantine patterns,
> Mantine theme, Mantine responsive props, and the Mantine Storybook toolbar proof path supersede
> the old `.container-wide` / Tailwind breakpoint / `withCanvas` responsive proof model.

**Status:** ~~CANONICAL RULE LAYER~~ **LEGACY REFERENCE** — This document now governs only existing legacy Tailwind/Base UI/shadcn-style surfaces during the migration period. For new UI/layout/component work, `docs/mantine-responsive-design-system.md` is the canonical source of truth. **Task 340 is rejected as an implementation path; execution is superseded by Task 344's graduated DS-1..DS-8 queue.**
**Created:** 2026-05-31 — Task 340 (Opus 4.7 orchestrator/architect).
**Supersedes:** the 7-width and 9-width verification canons previously listed in `docs/responsive-governance.md §1`, `docs/ui-rules.md §17`, and `docs/admin-ux-rules.md §14`. Those documents now INHERIT this contract (see "Document inheritance map" below).
**Source:** Owner-uploaded `issues.md` (2026-05-31, ~6100 lines) — "Create Global Responsive Design System Contract v1" + ADDENDUM (14-width × 4-locale canon supersedes 7/9-width canons). `issues.md` itself is not checked into the repo; this document is the canonical, repo-resident embodiment of its Sections 1–21 + ADDENDUM, reconciled against the already-shipped Sprint 28 primitives.

> ~~**Governance status of this document.** This file is authoritative as the **rule layer** for future UI / layout / responsive / component work.~~ **SUPERSEDED by Task 482 (2026-06-24).** This document is now a LEGACY reference only. It is NOT the rule layer for future UI work. `docs/mantine-responsive-design-system.md` is the active canonical source of truth for all new UI/layout/component work. The sections below remain valid governance ONLY for existing Tailwind/Base UI/shadcn surfaces during the migration period.

---

## Document inheritance map

> **Task 482 update (2026-06-24):** `docs/design-system.md` is no longer the future canonical UI authority. It is a legacy reference for existing Tailwind/Base UI surfaces. `docs/mantine-responsive-design-system.md` is the active canonical source of truth for new UI work.

| Doc | Relationship to this contract |
|---|---|
| `docs/design-system.md` (this file) | **LEGACY reference layer.** Governs existing Tailwind/Base UI surfaces only. New UI work must use `docs/mantine-responsive-design-system.md`. |
| `docs/mantine-responsive-design-system.md` | **ACTIVE canonical source of truth** for new UI/layout/component work (Task 482, 2026-06-24). Supersedes this document for future work. |
| `docs/responsive-governance.md` | INHERITS. 7/9-width lists marked SUPERSEDED; breakpoint philosophy still valid; verification widths now = the 14-width canon here. |
| `docs/ui-rules.md` §17 | INHERITS. UI pre-flight checklist runs the 14-width canon defined here. |
| `docs/admin-ux-rules.md` §14 | INHERITS. Admin container/table/switch rules are a SPECIALISATION of §4/§9/§10 here. |
| `docs/component-catalog.md` | INHERITS the primitive ownership taxonomy in §7. |
| `docs/tailwind-governance.md`, `docs/tailwind-canonical-fragments.md` | Implementation tooling. Tailwind is the implementation layer; this contract is the rule layer. |

---

## §1 — One design system

There is exactly **one** design system for lero-al. It governs, with no per-surface fork of the rules:

- **Public site** — homepage, listings index/search, listing detail, contact, popular locations, static `[slug]` pages, public header/footer.
- **Cabinet / auth** — login, register, reset-password, confirm-email, verified, cabinet/profile, favorites, create listing, edit listing.
- **Admin** — dashboard + all data-surface and config/content routes.
- **Shared primitives** — `src/components/ui/*` and global layout primitives.
- **Future surfaces** — anything added later (chat, notifications center, agent dashboards) inherits this contract automatically.

Surfaces may differ in **visual density** and **container width** (public reading-column vs admin data-shell), but NOT in the rules that produce them. A new spacing scale, container, card style, table style, or breakpoint may not be invented locally inside a route or feature module. New global needs are added to this contract first (orchestrator change), then consumed.

---

## §2 — Mobile-first principle

1. Base (unprefixed) styles target the **smallest** canonical width (320px). Layout scales **up** with `sm: md: lg: xl: 2xl:`.
2. No desktop-only rule that must be undone on mobile. Never `width: 1200px` reset to `width: 100%` at a smaller breakpoint.
3. Fluid by default: `w-full`, `flex-1`, `min-w-0`. Fixed pixel widths are reserved for genuinely fixed chrome (icons, avatars, badges), never for content columns.
4. Responsiveness is **CSS-driven only**. No JS viewport detection during render (`typeof window`, `navigator.userAgent`, `window.innerWidth` in render) — it is a hydration-risk anti-pattern (see §15). SSR emits the final responsive markup; CSS does the adapting.
5. Touch-first: interactive controls are reachable and ≥44px on touch widths (§12).

---

## §3 — Canonical viewport bands (14 widths) — THE CANON

Every responsive task verifies at these **14 widths × 4 locales (sq / en / uk / it)**. This list **supersedes** the older 7-width and 9-width lists everywhere they appear.

| # | Width | Band | Tailwind ≥ | What it proves |
|---|---|---|---|---|
| 1 | **320** | Mobile S | base | Narrowest supported; longest-locale (uk) overflow guard |
| 2 | **375** | Mobile M | base | Common iPhone |
| 3 | **390** | Mobile L | base | Modern iPhone Pro |
| 4 | **480** | Phablet | base | Large phone / small-tablet portrait edge |
| 5 | **560** | Small tablet | base | Pre-`sm` content reflow |
| 6 | **680** | Tablet portrait | `sm:` | Two-column emergence |
| 7 | **768** | Tablet | `md:` | `md:` breakpoint; header row consolidation |
| 8 | **810** | Tablet landscape | `md:` | iPad portrait/landscape edge |
| 9 | **960** | Small desktop | `md:` | Pre-`lg` density |
| 10 | **1024** | Desktop narrow | `lg:` | **Table↔card flip; admin sidebar appears.** Owner QA found defects here. |
| 11 | **1200** | Desktop | `lg:` | Full table column set emerging |
| 12 | **1440** | Laptop standard | `xl:` | Standard laptop; container cap not yet active |
| 13 | **1920** | Wide monitor | `2xl:` | Widescreen content-spread / waste guard. Owner QA found waste here. |
| 14 | **2560** | 4K / huge | `2xl:` | Container max-width cap validation; balanced margins |

**Tailwind breakpoint TOKENS are unchanged:** `sm:640 md:768 lg:1024 xl:1280 2xl:1536`. The 14 widths are **verification widths**, not new breakpoints. Introducing arbitrary `min-[NNNpx]:` breakpoints remains forbidden (§15).

**Fast-check subset (when a full 14-width pass is impractical for a tiny change):** 320 / 768 / 1024 / 1440 / 2560 — but the full 14 is required for any task that touches a container, grid, table, filter bar, or page shell.

---

## §4 — Global container system

Five canonical containers. A route picks exactly one as its outermost content wrapper. No route invents its own `max-w-* mx-auto` pair.

| Container | Utility | Max width | Owner | Use |
|---|---|---|---|---|
| **page-container** | `.container-wide` | 88rem / **1408px** (`.max-w-8xl`) | public site | Public page wrappers (home, listings, detail, contact, slug). Header/footer inner row. |
| **content-container** | `.container-wide` + inner `max-w-3xl`/`max-w-4xl` | reading column | public + cabinet | Reading-context column inside a page-container (article body, auth card, listing detail text column). |
| **data-container** | `.container-admin` | full-width → cap **1792px** (`.max-w-10xl`) at `2xl:` | admin | Admin data surfaces (tables, lists). |
| **form-container** | `max-w-xl`/`max-w-2xl` centered inside page/data-container | bounded form column | public + cabinet + admin | Forms; keeps inputs at a readable measure, never full-bleed on wide screens. |
| **admin-container** | `.container-admin` | same as data-container | admin | Admin config/content pages; alias of data-container for non-tabular admin pages. |

Defined in `src/app/globals.css`:

- `.container-wide` — `margin-inline:auto; max-width:88rem;` padding `1rem → 1.5rem (640) → 2rem (1024) → 3rem (1536)`. **Public only.**
- `.container-admin` — full available main area; padding `1rem → 1.5rem (640) → 2rem (1024) → 3rem (1536)`; caps at `112rem (1792px)` at `1536px+`. **Admin only.** DO NOT use `.container-wide` in admin (leaves wasteland margins at 1920/2560 inside the admin shell). DO NOT use `.container-admin` in public.

`content-container` / `form-container` are **composition patterns** (an inner `max-w-*` block) inside a `page-container`/`data-container`, not separate global utilities — to avoid utility proliferation. If a third hard-coded reading width appears, promote it to a named utility here (orchestrator change), do not clone it locally.

---

## §5 — Global spacing system

Spacing uses Tailwind's default 4px scale (`gap-2 = 8px`, `p-4 = 16px`, …). The **rhythm**, not new values, is canonical:

| Token role | Canonical pattern | Notes |
|---|---|---|
| Page section vertical rhythm | `py-8 sm:py-12 lg:py-16 2xl:py-20` | Public sections. Add the `2xl:` step (older pages stopped at `md:py-16`). |
| Page horizontal padding | owned by the container utility (`.container-wide` / `.container-admin`) | Do NOT add per-page `px-*` that fights the container. |
| Card padding | `p-4` (default) / `p-3` (compact, e.g. AdminCardList compact mode) | One of the two; no `p-5`/`p-7` one-offs. |
| Control gap (toolbars/rows) | `gap-2` (tight) / `gap-3` / `gap-4` | Toolbars are `flex items-center gap-2`. |
| Grid gap | `gap-4 lg:gap-6` | Card/listing grids. |
| Stack gap (form fields, list items) | `space-y-3` / `space-y-4` / `gap-4` | One per surface; consistent within a form. |
| Section heading → body | one step (`mb-4`/`mb-6`) | No ad-hoc `mt-7`/`mb-9`. |

Forbidden: arbitrary spacing values (`p-[13px]`, `gap-[7px]`, `mt-[22px]`) for layout rhythm. Arbitrary values are only acceptable for pixel-exact chrome alignment with a comment justification.

---

## §6 — Typography + text-wrapping rules

1. Type scale is the Tailwind default plus a `2xl:` step for large headings: e.g. section H2 = `text-xl sm:text-2xl 2xl:text-3xl`. Older pages that stop at `sm:text-2xl` are to be extended, not forked.
2. **Every flex row containing an icon + a translatable label MUST carry `min-w-0`** on the text element (and the row), so labels can shrink/ellipsize rather than push siblings off-screen. This is the #1 recurring overflow defect.
3. Truncation vs wrapping:
   - **`truncate`** — single-line labels in dense rows (table cells, chips, nav). Must always sit in a `min-w-0` parent or it does nothing.
   - **`line-clamp-N`** — multi-line summaries (card descriptions, listing titles in grids).
   - **Never** use `truncate`/`overflow-hidden` to mask a layout-overflow bug; fix the layout (`min-w-0`, `flex-wrap`).
4. Longest-locale rule: **uk** (Ukrainian) is the overflow stress locale; **sq/it** also run long. A label that fits in `en` is not proof. Verify uk at 320.
5. Numbers/prices/dates: never truncate a price or status; wrap the row instead (`flex-wrap`) so the value stays fully visible.

---

## §7 — Component system ownership (the taxonomy)

Every visual element belongs to exactly one tier. This determines where it may be styled and who owns its responsive behaviour.

| Tier | Definition | Lives in | Responsive ownership |
|---|---|---|---|
| **1. Primitive UI** | Atomic, domain-agnostic (Button, Input, Combobox, Dialog, Sheet, DropdownMenu, Card, Badge, Tabs, Table primitive). | `src/components/ui/*` | The primitive. Consumers do NOT restyle its internals. Single-source (`ui-rules.md §0`): one Button, one Combobox. |
| **2. Global layout primitive** | App-wide structural shells: **PageShell, PageHeader, Section, FilterBar**, plus admin specialisations **AdminPageShell, AdminTable, AdminCardList**. | `src/components/layout/*`, `src/components/admin/*` | The primitive owns container + spacing + responsive switch. Consumers pass content + config, never override layout. |
| **3. Data-surface primitive** | Tabular/list/grid surfaces: AdminTable, AdminCardList, listing grid, card list. | `src/components/admin/*`, `src/modules/*/components` | Owns the table↔card switch (§10) and column visibility. |
| **4. Domain component** | Feature-specific composition (ListingCard, ListingsFilters, CabinetShell, AdminListingsTable). | `src/modules/*`, feature folders | Composes tiers 1–3. May choose a `tableAt` decision and pass a `cardRow`, but may NOT invent a new container/spacing/table style. |

Rule: **layout styling flows down from tiers 1–3; domain components (tier 4) consume, never re-author it.** A tier-4 component that hand-rolls `max-w-* mx-auto`, a raw `<table>`, or a custom mobile-overlay is a violation and a migration target.

---

## §8 — Public site layout rules

1. Every public page's outermost content wrapper is a **page-container** (`.container-wide`). Header and footer inner rows also use `.container-wide` so chrome aligns with content.
2. Reading-context pages (listing detail, contact, static `[slug]`, auth cards) use a **content-container** (inner `max-w-3xl`/`max-w-4xl`) inside the page-container — content does not stretch to 1408px when it is prose/forms.
3. Listing/card grids: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4`. Add the `2xl:` column step (older grids capped at 3 columns and looked sparse at 1920/2560).
4. No public page stretches raw content past **1408px**. The container enforces this; pages must not override with a wider `max-w-*`.
5. Public mobile drawers/filters use the canonical **Sheet** primitive, never a hand-rolled `fixed inset-0` overlay (the `ListingsShell`/filters custom overlay is a migration target — §16).

---

## §9 — Admin layout rules

1. Every admin route wraps content in **AdminPageShell** (data-container / `.container-admin`).
2. AdminPageShell header = title + optional countBadge + optional subtitle + an optional actions slot (right-aligned at `md:+`, stacked `<md`), with a FilterBar slot below the header.
3. Tabular data uses **AdminTable** (Sprint 28 primitive). Non-tabular row data uses **AdminCardList** directly. No raw `<table>` and no card-imitating `<div>` rows outside these primitives in admin routes.
4. Admin content fills the main area up to `2xl:`, then caps at **1792px** (`.max-w-10xl`). Admin does NOT use `2xl:grid-cols-N` for tables — natural column widths consume available space.
5. Admin inherits the same spacing, typography, overlay, and form rules as the rest of the app; only its container width and density differ.

---

## §10 — Data tables / cards / lists — `tableAt` decisions

Every data surface declares ONE of these responsive strategies. The decision is explicit and recorded in the surface's session log / kickoff.

| Decision | Behaviour | When |
|---|---|---|
| `cardOnly` | Cards at all widths; never a table. | ≤3 fields per row; mostly visual (e.g. media-led lists). |
| `grid` | Responsive card grid (`grid-cols-1 sm:2 xl:3 2xl:4`). | Listing/catalog surfaces. |
| `tableAtLg` | **Canonical default.** Cards `<lg:`, table `lg:+` (1024). | Most admin data tables. Matches AdminTable's internal switch. |
| `tableAtXl` | Cards `<xl:`, table `xl:+` (1280). | Very wide tables (≥8 columns) that won't fit at 1024. Requires orchestrator note. |
| `detailLayout` | Two-column detail at `lg:+`, stacked below. | Record-detail pages (user detail, listing detail). |
| `formLayout` | Single bounded column (`form-container`); no table. | Create/edit forms, settings. |
| `nonTabular` | AdminCardList (structured cards) at all widths. | Row data that is never tabular. |

Column-visibility tokens for tables (`tableAtLg`/`tableAtXl`): `'always'` (sticky-first + 1–2 critical, e.g. price/status), `'sm'` (640+), `'md'` (768+), `'lg'` (1024+), `'xl'` (1280+). Sticky first column applies at `lg:+` only. Cards must carry an explicit `cardRow` (`title/subtitle/meta/trailing`) for any surface with non-trivial row visuals; synthesis from columns is a best-effort fallback only.

**Capability preservation (§25):** every `tableAt` migration MUST record and preserve all existing user capabilities — columns, row-click behavior, row actions, inline controls, filters, search, sort, pagination, bulk actions, empty/loading/error/validation states. No capability may be silently removed. See §25 for the full rule.

**768/810/960 tablet widths** (where `tableAtLg` shows cards because `<1024`) must be intentionally designed: the card layout at these widths must be usable — not a squished desktop table or a broken hybrid. Each of 768, 810, and 960 is a distinct verification target in the 14-viewport canon (§3).

---

## §11 — Filters / search / tabs / actions — one global pattern

1. **FilterBar** — one global layout primitive for filter chips + search + reset. Canonical outer fragment: `flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start [&>*]:max-sm:w-full`; on `<lg:` collapses overflow filters into a Sheet ("Filters" trigger). Active-filter count badge + a single global Reset. No per-route custom accordion/overlay filter (the `ListingsFilters` custom accordion is a migration target).

   **Alignment rule (Task 362, 2026-06-02):** The outer container uses `sm:items-start` (not `items-center`). When the filter cluster wraps to multiple chip rows, the search/badge/reset top-align with the first chip row — preventing the "scatter" caused by `items-center` vertically centering shorter elements against a tall multi-row chip cluster. The filter cluster itself uses `flex-wrap items-start gap-2` so all chip rows align consistently from the top edge.
2. **Search** — canonical search input (Input primitive) inside the FilterBar; `min-w-0 flex-1` so it shrinks, never pushes the row.
3. **Tabs** — the shadcn **Tabs** primitive only. Local tab clones (`CabinetShell`, `AdminCurrencyTabs`) are migration targets.
4. **Action clusters** — page-level action clusters use a plain `div` with `flex flex-wrap gap-2` in the component's action slot (PageHeader, AdminPageShell). The `ActionBar` primitive was removed (Task 358, 2026-06-02; zero product consumers). Buttons are the Button primitive at one shared height per row (§12 / `ui-rules.md §15`). Toolbars never overflow horizontally; they wrap or move overflow actions into a menu (`overflow-x-auto` is acceptable for tables, NOT for toolbars).

---

## §12 — Forms — global rules

1. Forms live in a **form-container** (bounded column), centered, never full-bleed on wide screens.
2. **Touch targets ≥44px** for every mobile-reachable interactive control. The Input primitive default height is **`h-11` (44px)** as of Task 375 (2026-06-03) — the prior `h-9`/36px sub-44 target is now fixed at the primitive. See the canonical form-control height ladder in §12a "One-row-one-height".
3. Dropdown / combobox menus **must fit the viewport**: max-height with internal scroll, and must not overflow horizontally at 320 (uk). Use the canonical Combobox/DropdownMenu; never a `<select>` or a raw popover.
4. One label-control vertical rhythm per form (`space-y-3`/`space-y-4`), consistent.
5. Field rows that hold two controls collapse to stacked (`flex-col`) `<sm:` and side-by-side `sm:+`.
6. Validation/error/empty/loading/success states are all styled with primitives and verified (this is a responsive AND a flow requirement; see §19).

---

## §12a — Mobile Control Touch Target and Stacking Contract (Task 354-Fix, 2026-06-01)

**Established after owner rendered-QA failures. This section is CANONICAL and ENFORCED for all DS primitives.**

### Touch target floor
- Every **interactive mobile control** (button, chip, filter pill, combobox trigger, select trigger, any tappable element) has a **minimum practical touch target of 44px height** at 320 / 375 / 390px widths.
- `size="xl"` (h-11 = 44px) is the canonical mobile-safe Button size. `size="icon-xl"` (44px) for icon-only buttons.
- `size="sm"` (28px) and `size="default"` (32px) are **desktop-only** sizes. They MUST NOT appear as the primary size for tappable controls at mobile widths.

### Mobile stacking / full-width
- At 320 / 375 / 390 / 480 / 560px (i.e. `<sm:`), primary and secondary action buttons in DS primitives are **full-width or stacked in a column** unless a documented exception applies.
- `PageHeader` action slot uses `max-sm:w-full [&>*]:max-sm:w-full`; the row goes inline at `sm:` (640px). The `ActionBar` primitive was removed (Task 358, 2026-06-02); page-level action clusters use a plain flex-wrap div with the canonical stacking fragment in the action slot.
- `AdminPageShell` actions container: `flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap sm:shrink-0 max-sm:w-full [&>*]:max-sm:w-full`.
- `FilterBar` outer row: `flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center [&>*]:max-sm:w-full`.

### Filter chips / filter pills
- Filter chips used as tappable controls MUST use `size="xl"` (44px) — NOT `size="sm"` (28px).
- Chip text must never appear larger than its chip container (chip must accommodate its label).
- In Storybook fixtures, `FilterChips` or equivalent helpers must use `size="xl"`.

### One-row-one-height (§15 / ui-rules.md §15)
- Text inputs, Combobox triggers, Select triggers, Buttons, and filter chips that share a row or surface must have **consistent height / rhythm**.
- **Canonical form-control height ladder (Task 375, 2026-06-03 — single source).** `Input`, `SelectTrigger`, and `Combobox` all expose a `size` prop with identical heights, so any two can sit on the same row at the same height:

  | `size` | Height | Use |
  |---|---|---|
  | `default` | **`h-11` (44px)** | DEFAULT — mobile-safe, the canonical shared row height |
  | `sm` | `h-9` (36px) | Desktop-dense rows only; never the primary tappable control at `<sm` |
  | `xs` | `h-8` (32px) | Compact desktop/admin chrome only; never tappable-primary at `<sm` |

- `Button size="xl"` (h-11) matches the `default` form-control height; pair it with `default` form controls on shared rows.
- Mixing heights within the same row (e.g., a `size="sm"` button next to a `size="default"` Combobox) is a DS violation.
- The `Input` `size` prop uses `Omit<…, "size">` so it never collides with the native HTML `size` attribute; `InputGroupInput` and `PasswordInput` inherit `InputProps`.

### No horizontal overflow
- At 320 / 375 / 390px, no component or chip row creates horizontal page overflow.
- Controls that cannot fit one row must **wrap or stack predictably** — never horizontal-scroll a toolbar.
- Dropdowns / sheets / popovers are viewport-bounded (clamped to viewport width) at all mobile widths.

---

## §12b — Mobile control & tab stacking contract (< sm = < 640px) — Task 359, 2026-06-02

**Threshold: `sm` (640px).** Below 640px, buttons AND tab groups become full-width / stacked. This eliminates the ragged flex-wrap grid that appears between ~480–640px.

### Canonical action-cluster fragment
```
flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center [&>*]:max-sm:w-full
```
Apply this to any container that holds a group of action buttons (page-level actions, form action rows, admin header clusters). Children (buttons) become full-width below `sm`; inline row from `sm` upward.

### Button primitive mobile fragment (Task 372, 2026-06-03 — corrects Task 360)
ALL text button sizes (`xs`, `sm`, `default`, `lg`, `xl`, `tab`) in `button.tsx` carry the canonical mobile fragment:
- `max-sm:w-full` — full-width at < sm (640px)
- `max-sm:h-auto max-sm:min-h-11` — height grows with content but stays ≥ 44px
- `max-sm:whitespace-normal max-sm:break-words` — long labels wrap / break rather than overflow

(`tab` carries the same fragment; `max-sm:h-auto` is implicit since `tab` is already `h-auto`.)

Icon-only sizes (`icon`, `icon-xl`, `icon-sm`, `icon-xs`, `icon-lg`) are **NOT** given `max-sm:w-full` and stay compact at all widths. The container fragment (`[&>*]:max-sm:w-full`) remains the preferred approach for action clusters; the primitive fragment covers standalone text buttons used outside such containers.

### Tabs — single canonical style, NO variants (Task 372 v2, 2026-06-03 — supersedes Task 360 + the earlier variant model)
`src/components/ui/tabs.tsx` has **one** style. There is **no `variant` prop, no CVA, no `tabsListVariants` export, and no `mobileScroll` prop** — all were removed in Task 372 v2 (owner decision). Do NOT reintroduce a Tabs variant; if a consumer appears to need a different tab style, **STOP & ASK** the owner.

- **Active indicator:** primary-color underline (`after:bg-primary`, `data-active:after:opacity-100`). No filled pill, no list background (`bg-transparent rounded-none`).
- **Labels:** `capitalize` is applied at the primitive (`TabsTrigger`) — canonical casing, do not re-case in consumers.
- **Horizontal scroll is unconditional** (all breakpoints, not just `<sm`): `overflow-x-auto flex-nowrap max-w-full` + `no-scrollbar`. Long tab rows scroll horizontally instead of wrapping; there is no separate scroll mode to opt into.
- **Mobile (`<sm` = 640px):** `max-sm:flex max-sm:w-full max-sm:h-auto` on `TabsList`; triggers `flex-1` (equal fill) and `max-sm:min-h-11` (≥44px). Consumers inherit this automatically — no per-consumer props.
- Consumer overrides are limited to layout `className` (e.g. `AdminCurrencyTabs` `w-fit`, `ListingsStatusTabs` `listings-status-tabs`); they must not attempt to change the indicator style.

### No horizontal page overflow (320–640px)
No tab list, action cluster, filter chip row, or toolbar may produce horizontal page overflow at 320 / 360 / 375 / 390 / 412 / 480 / 560 / 640px. Controls that cannot fit one row MUST wrap or stack predictably — never produce a half-width pill grid.

---

## §12c — Select trigger label-resolution + Combobox/Select trigger left-align contract (Task 371, 2026-06-03)

### Select value→label resolution (canonical Base-UI pattern)

`SelectRoot` (`<Select>`) MUST receive an `items` prop of shape `Array<{ value: string; label: string }>` whenever the trigger must display a human label for a pre-selected value.

**Why:** Base-UI's `SelectValue` resolves labels from `store.state.items`. Without `items`, the popup (and its `SelectItem` children) must have been opened at least once to register labels — so the trigger shows the raw `value` string on first render and after hard navigation. Passing `items` to `SelectRoot` pre-populates the store and resolves labels immediately, even on SSR / initial render.

**Canonical pattern:**
```tsx
const OPTIONS = [
  { value: 'tirana', label: 'Tirana' },
  { value: 'durres', label: 'Durrës' },
]

<Select defaultValue="tirana" items={OPTIONS}>
  <SelectTrigger>
    <SelectValue placeholder="Select city" />
  </SelectTrigger>
  <SelectContent>
    {OPTIONS.map(o => (
      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Rules:**
- Always pass `items` to `<Select>` when using `defaultValue` or a controlled `value`.
- The `items` array MUST contain every value that can appear as the selected value (at minimum the currently selected item).
- `items` and the rendered `SelectItem` children MUST be consistent (same value/label pairs).
- Placeholder-only selects (no initial value, value=null) still benefit from `items` for immediate label resolution after selection — pass it anyway.
- Do NOT rely on the popup having been opened once to register labels; that is not SSR-safe.

### Combobox and Select trigger text alignment (canonical rule)

Every `Select` trigger and `Combobox` button-variant trigger MUST display its selected label (or placeholder) **left-aligned**, with the chevron right-aligned. This matches the canonical `flex justify-between` layout.

**Root cause of centering bug:** `<button>` elements carry `text-align: center` in browser user-agent stylesheets. Tailwind's preflight does NOT reset this. Without an explicit `text-left` on the trigger or its label span, text content inside a `<button>` flex container appears centered.

**Canonical fix:**
- `Combobox` (`src/components/shared/Combobox.tsx`): `triggerBase` contains `text-left` — ensures left-alignment for both `variant="input"` and `variant="button"`. Added Task 371.
- `SelectValue` (`src/components/ui/select.tsx`): already carries `text-left` in its className — no change needed.
- Consumers that pass `triggerClassName` MUST NOT override with `text-center`.

**Verification:** every Select trigger and Combobox button-variant trigger across the app (StatusChangeControl, LocationCombobox, all story viewports) renders label left-aligned, chevron right.

---

## §13 — Cards + grids

1. Card = the Card primitive (or AdminCardList structured card). Padding `p-4` (or `p-3` compact). No inline ad-hoc card `<div>` patterns (`admin/page.tsx`, `CabinetShell` inline cards are migration targets).
2. Grid = `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6` for catalog/listing surfaces; tune columns to content but ALWAYS define a `2xl:` step.
3. Cards must not fix a pixel width; they fill their grid track (`w-full min-w-0`).
4. Card internal rows obey §6 (`min-w-0` + truncate/line-clamp).

---

## §14 — Dialogs / sheets / dropdowns — consistent across public/admin/cabinet

1. **Width tiers** (from `admin-ux-rules.md §11`, now global): dialogs cap at a sensible max (≤768px unless justified); content-heavy dialogs use the tier table in `admin-ux-rules.md §11.1`.
2. **Mobile fallback**: at `<lg:` (1024), Dialog → **bottom Sheet** (matches the table↔card switch boundary and Epic Z.2 modal pattern). Below `lg:` overlays are full-width / near-full-width.
2a. **Mobile bottom-sheet contract (`<640px`)** — see **§26.2** for the full contract. At `<640px` ALL overlay/popup primitives (Dialog / Sheet / Select dropdown / Combobox dropdown / DropdownMenu / NavigationMenu / Popover / Command) render as full-width bottom sheets (bottom-anchored, edge-to-edge, rounded-top, ≤90dvh + internal scroll, drag-handle). The item-2 rule above is the wider tablet-level transition (Dialog → Sheet at 1024); §26.2 is the tighter mobile-specific contract (full-width bottom sheet at 640).
3. **Destructive actions** use **AlertDialog**, never a plain Dialog.
4. **One overlay implementation**: shadcn Dialog/Sheet/DropdownMenu only. Hand-rolled `fixed inset-0` overlays (AdminSidebar mobile drawer, ListingsShell filter overlay) are forbidden and are migration targets.
5. Dropdowns/popovers respect the z-index scale (`ui-rules.md §16`); chrome at `z-30`; no `z-[999]`/`z-[9999]` emergency overrides.
6. Scroll-lock and focus-trap come from the primitives — never custom `body { overflow:hidden }` JS.

### Sheet canonical padding (Task 373 correction — Task 361 superseded)
`SheetContent` outer popup carries NO own padding (only structural flex/sizing classes). A **non-scrolling close strip** (`shrink-0 flex justify-end px-3 pt-3`) holds the X button above the scroll region. An inner scroll container (`flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col gap-4 px-6 pb-6`) carries the canonical **p-6** (24px) modal padding per §5 and scrolls only when content overflows. `SheetHeader` and `SheetFooter` have **no own padding** — they inherit from the inner container. Consumers who need non-standard padding pass `p-0` / `p-5` etc. to `SheetContent` via `className`.

### Dialog scroll-clip canonical pattern (Task 373 correction — Task 361 rejected by owner)
`DialogContent` outer popup: `flex flex-col overflow-hidden` with NO own padding. A **non-scrolling close strip** (`shrink-0 flex justify-end px-3 pt-3`) holds the X button ABOVE the scroll region — scrollbar track never overlaps the X. An **inner scroll container** (`flex-1 min-h-0 overflow-y-auto overflow-x-hidden grid gap-4 min-w-0 break-words px-6 pb-6`) scrolls only when content exceeds `max-h-[90dvh]` (no scrollbar on short content). Horizontal scroll cannot occur (`overflow-x-hidden` + `break-words` + `min-w-0`). `DialogFooter` uses `border-t pt-4` for clean separation — no `bg-muted/50` bleed, no negative margins. Stories use triggers, never `defaultOpen`, to prevent stacked overlays in Docs view.

---

## §15 — Forbidden Tailwind / responsive patterns

```
❌ JS viewport detection in render: typeof window, navigator.userAgent, window.innerWidth   (hydration risk)
❌ Inline style={{ width: vw > 768 ? ... : ... }}                                            (hydration risk)
❌ suppressHydrationWarning to mask a responsive bug
❌ Arbitrary breakpoints: md:[min-width:900px], min-[940px]:                                 (use canonical tokens)
❌ Arbitrary layout widths: w-[937px], max-w-[1100px], min-w-[640px] on content columns      (use a container)
❌ Arbitrary spacing for rhythm: p-[13px], gap-[7px], mt-[22px]
❌ overflow-hidden / truncate used to hide a layout-overflow bug (fix min-w-0 / flex-wrap)
❌ overflow-x-auto on toolbars/filter rows (acceptable ONLY for tables)
❌ Raw <table> or card-imitating <div> rows outside AdminTable/AdminCardList in admin
❌ Hand-rolled fixed inset-0 mobile overlay instead of Sheet/Dialog
❌ Emergency z-index: z-[999], z-[9999]
❌ Duplicated mobile/desktop JSX render trees for heavy content (render once, adapt with CSS)
❌ Per-route invented container (max-w-* mx-auto) instead of a §4 container
❌ Local clone of a primitive (tabs, accordion, button, card) instead of the canonical one
```

Acceptable exceptions (must be justified inline): fixed pixel widths for genuinely fixed chrome (icons, avatars, badges, a min-w on a numeric badge); `overflow-x-auto` on a real `<table>`; arbitrary value for pixel-exact alignment with a code comment.

---

## §16 — Required inventory (entry point)

Full route inventories are maintained in the Task 340 session log
(`docs/sessions/2026-05-31-task-340-global-responsive-design-system-contract.md`) and summarized below in §16.A–C. Each migration phase kickoff re-derives the inventory for its scope before touching code.

### §16.A Public site (snapshot 2026-05-31)

| Route | Primary files | Container today | Grid/table/form | Target | Phase |
|---|---|---|---|---|---|
| `/[locale]` (home) | `[locale]/page.tsx`, `PopularLocations`, `HeroSearch` | `.container-wide` ✅ | hero + card grid (no `2xl:` col step) | page-container + `2xl:grid-cols-4`; `2xl:py-20` | 2 |
| `/[locale]/listings` | `listings/page.tsx`, `ListingsShell`, `ListingsFilters` | `.container-wide` ✅ | grid + **custom overlay filter** | grid + FilterBar(Sheet) | 2 |
| `/[locale]/listings/[slug]` | detail `page.tsx` | `.container-wide` ✅ | detail; reading column | detailLayout + content-container | 2 |
| `/[locale]/contact` | `contact/page.tsx` | `.container-wide` ✅ | form | form-container | 2 |
| `/[locale]/[slug]` (static) | `[slug]/page.tsx` | none explicit | prose | content-container | 2 |
| Header / Footer | `layout/Header.tsx`, `Footer.tsx` | `.container-wide` ✅ | nav rows (raw `<button>` in Header) | page-container + Button primitive | 2 |

### §16.B Cabinet / auth (snapshot)

| Route | Primary files | Container today | Pattern | Target | Phase |
|---|---|---|---|---|---|
| `/auth/login`,`/register`,`/reset-password`,`/confirm-email`,`/verified` | `[locale]/auth/*/page.tsx` | none explicit | auth card + form | content-container + form-container | 3 |
| `/cabinet` | `cabinet/page.tsx`, `CabinetShell` | inline | **custom tabs + inline cards + min-w badge** | Tabs primitive + Card primitive | 3 |
| `/favorites` | `favorites/page.tsx` | `.container-wide` ✅ | grid | grid + `2xl:` step | 3 |
| `/listings/create`,`/listings/[slug]/edit` | create/edit `page.tsx` | inline | large form | form-container | 3 |

### §16.C Admin (snapshot) — `tableAt` per surface

| Route | Component | Container | Today | `tableAt` target | Phase |
|---|---|---|---|---|---|
| `/admin` (dashboard) | `admin/page.tsx` | inline cards | ad-hoc card grid | AdminPageShell + Card grid | 5 |
| `/admin/listings` | `AdminListingsTable` | AdminPageShell ✅ | **migrated (Task 306-Fix pilot)** `tableAtLg` ✅ | (done; reference impl) | — |
| `/admin/users` (+`/new`,`/[id]`) | `AdminUsersTable` | AdminPageShell | **migrated (Task 416 Slice 3)** main list + verified-agents sub-table → `tableAtLg` ✅ | `tableAtLg` ✅ (done); `[id]`/`/new` (`AdminUserProfile`) = `detailLayout`/`formLayout` (verified Task 416, AdminEditLayout `flex-col lg:flex-row` stack <1024, no broken hybrid) | — |
| `/admin/support`,`/inquiries`,`/inquiries/sales`,`/inquiries/support` | `AdminSupportManager`, inquiries managers | mixed | **`AdminSupportManager` migrated (Task 416 Slice 3)** → `tableAtLg` ✅; inquiries managers still raw `<table>` | `AdminSupportManager` `tableAtLg` ✅ (done); inquiries managers `tableAtLg` | 4 |
| `/admin/reports` | `AdminReportsManager` | mixed | raw `<table>` | `tableAtLg` | 4 |
| `/admin/locations`,`/popular-locations`,`/companies`,`/property-types`,`/pages`,`/legal` | respective `*Manager` | mixed | raw `<table>` | `tableAtLg` / `nonTabular` | 5 |
| `/admin/currency` | `AdminCurrenciesManager`,`AdminExchangeProvidersManager` | mixed | `AdminCurrenciesManager` migrated (Task 413) `tableAtLg` ✅; **`AdminExchangeProvidersManager` migrated (Task 416 Slice 3)** provider list → `tableAtLg` ✅ | both `tableAtLg` ✅ (done) + Tabs primitive | — |
| `/admin/email-templates`,`/footer`,`/settings`,`/permissions` | respective managers | mixed | forms / lists | `AdminEmailTemplatesManager` = `nonTabular` (template list rows) + `formLayout` (editor `Dialog`, canonical, verified Task 416, tablet-stable); `/footer`,`/settings`,`/permissions` `formLayout` / `nonTabular` | 5 |

---

## §17 — Required grep / audit (re-run each phase)

```
rg -n "max-w-"                    src/app src/components src/modules
rg -n "mx-auto"                   src/app src/components src/modules
rg -n "container-wide|container-admin" src/app src/components src/modules
rg -n "overflow-x-auto"           src/app src/components src/modules
rg -n "min-w-\["                  src/app src/components src/modules
rg -n "w-\["                      src/app src/components src/modules
rg -n "<table"                    src/app src/components src/modules
rg -n "truncate"                  src/app src/components src/modules
rg -n "line-clamp"                src/app src/components src/modules
rg -n "hidden lg:block|lg:hidden" src/app src/components src/modules
rg -n "grid-cols-"                src/app src/components src/modules
rg -n "columns-"                  src/app src/components src/modules
```

Classify every hit as one of: **`allowed global primitive usage`** · **`allowed form/content exception`** · **`must migrate`** · **`needs owner decision`**. The Task 340 baseline audit (counts + classification) is in the session log. Summary of the 2026-05-31 baseline:

- `<table>` (27): shadcn `ui/table.tsx` + AdminTable = allowed; **11 admin `*Manager` raw tables = must migrate** (Phases 4–5); 4 email/notification templates = allowed (HTML email layout).
- `min-w-[` (7): all `allowed` (dropdown/popover min-width, button min, numeric badge, sort/search control) — none are content-column width hacks.
- `container-wide|container-admin` (32): public pages on `.container-wide` ✅, admin on `.container-admin` ✅; gaps = auth/cabinet/static pages with **no** container (must migrate, Phase 2–3).
- `overflow-x-auto` (9): table primitives + gallery/filter scroll-rows = allowed; verify none are toolbars.
- `grid-cols-` (63): catalog grids `must migrate` to add the `2xl:` step; the rest allowed.
- `columns-` (0): clean.

---

## §18 — Implementation planning rule — phased migration (MANDATORY)

This contract is **never** migrated in a single task. Migration is phased; each phase is a separate Sonnet kickoff produced one at a time AFTER the prior phase ships and the owner approves.

- **Phase 1 — Global Design System Foundation.** Create/normalize global containers + the layout primitives (PageShell, PageHeader, Section, FilterBar, ActionBar) if missing; document spacing/container/typography. **NO route migration.** Proves the primitives only.
  > **Execution note (owner decision 2026-06-01, Task 344):** Phase 1 is NOT executed as one kickoff. **Task 343 (all-five-primitives-at-once) is FROZEN / rejected for implementation** — too large, loop-prone, low-verifiability. Phase 1 is delivered as a **graduated DS-1..DS-4 queue, one small slice at a time, owner-approved between each**: **DS-1 PageShell + Section** (`Task 345`) → **DS-2 PageHeader** → **DS-3 ActionBar** → **DS-4 FilterBar**. DS-5 hardens Storybook proof; **no route migration (Phase 2+) begins until the full primitive foundation is shipped, reviewed, and owner-approved.** Full queue + diagnosis: `docs/sessions/2026-06-01-task-344-design-system-implementation-path.md`.
- **Phase 2 — Public Site Critical Responsive Migration.** Home, listing grid/search, listing detail, public header/footer, auth entry points.
- **Phase 3 — Cabinet/Auth Responsive Migration.** Login/register/reset, cabinet/profile, favorites, create/edit listing.
- **Phase 4 — Admin Data Surfaces Migration.** Listings (done — reference), users, tickets, support, sales, reports.
- **Phase 5 — Admin Config/Content Pages Migration.** Locations, popular-locations, companies, pages, property-types, currency, email-templates, footer, settings, permissions, dashboard.
- **Phase 6 — Final Global Sweep.** Remove leftover hardcoded layout; verify component catalog + docs; full QA matrix; owner visual approval.

A kickoff that migrates public + admin + cabinet at once is FORBIDDEN (explicit owner rule on Task 340).

---

## §19 — Responsive QA rule — real rendered layout only

**Code-level / structural analysis is NOT proof of responsive correctness.** A diff that "looks structurally correct" has repeatedly shipped owner-visible defects (Task 306 → 306-Fix).

PASS requires **real rendered verification** at the §3 canon:

1. The running app (or Storybook story) rendered at each of the **14 widths × 4 locales**.
2. Screenshots strongly preferred; at minimum, per-width × per-locale pass/fail notes in the session log.
3. **uk @ 320px** walked end-to-end for the touched flow (longest-locale overflow guard).
4. For interactive surfaces: empty / loading / error / success / cancel states each verified at mobile + desktop (this is also a flow requirement, §12/§14).
5. Either **browser QA evidence** (preferred) **OR an explicit `OWNER QA REQUIRED` gate** recorded in the session log. A task may not self-approve a responsive change purely from code analysis.

**§27 (Storybook responsive-proof contract)** governs what counts as PASS/FAIL for each story × viewport × locale cell. See §27.3 for what `screenshots:assert` does and does NOT prove (button full-width and popup bottom-sheet compliance are machine-checked as of Task 421; wide-desktop sparsity is NOT machine-checked); §27.4 for the error-screen = FAIL rule.

---

## §20 — Definition of PASS

A responsive task PASSES only when ALL hold:

- Uses a §4 container; no invented `max-w-* mx-auto`.
- Uses §7 primitives; no local clones; no raw `<table>`/overlay outside primitives.
- No §15 forbidden pattern introduced.
- All user-facing strings exist in **sq / en / uk / it** (locale parity).
- Verified at **all 14 widths × 4 locales** with rendered evidence (§19); uk@320 walked.
- Touch targets ≥44px; menus fit viewport; toolbars do not overflow.
- `tableAt` decision declared for any data surface; `cardRow` supplied where non-trivial.
- `npx tsc --noEmit` = 0; lint 0/0 new; relevant governance gates PASS.
- Session log contains the §17 audit output + §19 QA matrix + the `ui-rules.md §17` pre-flight checklist.
- No existing interactive control silently removed (Note 20).

## §21 — Definition of FAIL

ANY of the following = FAIL (route back, do not approve):

- "Desktop only" verification, or code-level analysis presented as final responsive proof.
- A missing width or locale in the QA matrix.
- An invented container / spacing / table / card / overlay style inside a route.
- A raw `<table>` or `fixed inset-0` overlay added outside the primitives.
- A sub-44px mobile touch target on a reachable control; a menu that overflows at 320.
- A toolbar/filter row that clips or scrolls horizontally.
- A migration kickoff that spans public + admin + cabinet at once.
- A `2xl:` column/padding step missing on a catalog grid / public section that needs it.
- Locale drift (string in `en` only).
- A silently removed control.

---

## ADDENDUM — 14-width × 4-locale canon (verbatim authority)

> This ADDENDUM is the authority that **supersedes** every prior 7-width and 9-width verification list in the repo. Where any doc still lists 7 or 9 widths, that list is SUPERSEDED by the 14 widths below.

**Canonical widths (14):**
`320 / 375 / 390 / 480 / 560 / 680 / 768 / 810 / 960 / 1024 / 1200 / 1440 / 1920 / 2560`

**Canonical locales (4):** `sq` (Albanian, default) · `en` · `uk` · `it`.

**Verification matrix:** 14 widths × 4 locales = **56 cells** per touched screen. Screenshots strongly preferred; per-cell pass/fail mandatory. Any failed cell = task NOT complete.

**Longest-locale rule:** `uk` is the primary overflow-stress locale; `sq`/`it` also run long. `en` fitting is never sufficient evidence.

### Localization + wrapping contract (ADDENDUM Sections 1–17, condensed to enforceable rules)

1. Every user-facing string exists in all four locales with an identical key set (no key present in one locale only).
2. Layout is verified against the **longest** rendered locale per string, not the shortest.
3. Icon+label rows carry `min-w-0`; labels `truncate`/`line-clamp`, never push siblings.
4. No fixed-width content column that cannot accommodate a longer locale (use containers + fluid widths).
5. Numeric/price/status values are never truncated; their rows wrap.
6. Buttons/chips with translatable labels size to content with a sane `min-w` only where needed (badges), and wrap in their toolbar rather than overflow.
7. Dropdown/select/combobox menus fit the viewport in every locale at 320.
8. Form labels and helper text wrap; inputs keep ≥44px touch height in every locale.
9. Tabs labels in long locales collapse/scroll within the Tabs primitive, never break the row.
10. Table headers in long locales use the column-visibility tokens (§10) to drop non-critical columns rather than overflow.
11. Card titles use `line-clamp`; meta rows use `min-w-0`.
12. Empty/error/loading copy is localized in all four and verified for wrapping at 320.
13. Date/number formatting follows locale; layout tolerates the longest format.
14. RTL is not in scope (all four locales are LTR) — but no rule may assume a fixed text direction width.
15. The 14×4 matrix is the QA gate for any task touching localized layout.
16. Locale switch does not change layout structure (CSS-driven; same DOM), only text — verified by switching locale at a fixed width and confirming no structural reflow defect.
17. Where a long locale forces a defect that cannot be fixed in scope, STOP & ASK the orchestrator — do not ship the clipped layout.

---

*End of Global Responsive Design System Contract v1 (Task 340).*

---

## §22 — Design Variables (canonical token registry) — Task 401, Epic JJ Phase 1

> **This registry is the single source of truth for all style values.**
> Raw hex/rgb/hsl/px/rem/z-index/shadow/duration literals in `src/**` are forbidden
> (enforced by `check:design-tokens`, Task 402/407). To change a value project-wide,
> change it HERE. All tokens live in `src/app/globals.css` → `@theme inline`, Epic JJ
> section (added 2026-06-06). Note: the kickoff referenced §20 but that section was already
> occupied; §22 is the correct placement.

### §22.1 — Spacing tokens

| Token | Value | px | Use via |
|---|---|---|---|
| `--space-0` | `0px` | 0 | `p-0`, `m-0`, `gap-0`, or `var(--space-0)` |
| `--space-1` | `0.25rem` | 4 | `p-1`, `m-1`, `gap-1` |
| `--space-2` | `0.5rem` | 8 | `p-2`, `gap-2` — toolbar/button-group gap |
| `--space-3` | `0.75rem` | 12 | `p-3`, `gap-3` — compact card padding |
| `--space-4` | `1rem` | 16 | `p-4`, `gap-4` — standard card/form gap |
| `--space-5` | `1.25rem` | 20 | `p-5` — admin card padding |
| `--space-6` | `1.5rem` | 24 | `p-6`, `gap-6` — dialog/section inner |
| `--space-7` | `1.75rem` | 28 | `p-7`, `gap-7` |
| `--space-8` | `2rem` | 32 | `p-8`, `py-8` — tight section padding |
| `--space-9` | `2.25rem` | 36 | `p-9`, `h-9` — sm form-control height |
| `--space-10` | `2.5rem` | 40 | `p-10` |
| `--space-11` | `2.75rem` | 44 | `h-11` — **touch-target floor** (§12a) |
| `--space-12` | `3rem` | 48 | `py-12` — standard section padding |
| `--space-14` | `3.5rem` | 56 | `h-14` — bottom-nav height |
| `--space-16` | `4rem` | 64 | `py-16` — wide section padding |
| `--space-20` | `5rem` | 80 | `py-20` — 2xl section padding |
| `--space-24` | `6rem` | 96 | `py-24` — hero section padding |
| `--space-0-5` | `0.125rem` | 2 | `var(--space-0-5)` (fractional — var only) |
| `--space-1-5` | `0.375rem` | 6 | `var(--space-1-5)` |
| `--space-2-5` | `0.625rem` | 10 | `var(--space-2-5)` |
| `--space-3-5` | `0.875rem` | 14 | `var(--space-3-5)` |

Utilities are wired: `--spacing-N: var(--space-N)` → `p-N` / `m-N` / `gap-N` / `h-N` resolve through the token.

### §22.2 — Typography tokens

**Font sizes + line-heights**

| Token | Value | px | Paired line-height token | Use via |
|---|---|---|---|---|
| `--text-2xs` | `0.625rem` | 10 | `--text-2xs--line-height: 0.75rem` | `text-2xs` — **micro-label only**: badge counter, metadata badge, compact status, helper/counter text. Do NOT use for primary copy, form labels, button labels, filter chips, or nav labels. (Task 404, Epic JJ) |
| `--text-xs` | `0.75rem` | 12 | `--text-xs--line-height: 1rem` | `text-xs` |
| `--text-sm` | `0.875rem` | 14 | `--text-sm--line-height: 1.25rem` | `text-sm` — body, labels |
| `--text-base` | `1rem` | 16 | `--text-base--line-height: 1.5rem` | `text-base` |
| `--text-lg` | `1.125rem` | 18 | `--text-lg--line-height: 1.75rem` | `text-lg` — subsection H3 |
| `--text-xl` | `1.25rem` | 20 | `--text-xl--line-height: 1.75rem` | `text-xl` — section H2 base |
| `--text-2xl` | `1.5rem` | 24 | `--text-2xl--line-height: 2rem` | `text-2xl` — section H2 sm: |
| `--text-3xl` | `1.875rem` | 30 | `--text-3xl--line-height: 2.25rem` | `text-3xl` — page H1 sm: |
| `--text-4xl` | `2.25rem` | 36 | `--text-4xl--line-height: 2.5rem` | `text-4xl` — hero sm: |
| `--text-5xl` | `3rem` | 48 | `--text-5xl--line-height: 1` | `text-5xl` — hero md: |

**Font weights**

| Token | Value | Use via |
|---|---|---|
| `--font-weight-normal` | `400` | `font-normal` |
| `--font-weight-medium` | `500` | `font-medium` — label H4 |
| `--font-weight-semibold` | `600` | `font-semibold` — subsection H3, card titles |
| `--font-weight-bold` | `700` | `font-bold` — headings, section H2 |

**Letter-spacing**

| Token | Value | Use via |
|---|---|---|
| `--tracking-tight` | `-0.025em` | `tracking-tight` — headings |
| `--tracking-normal` | `0em` | `tracking-normal` — body |
| `--tracking-wide` | `0.025em` | `tracking-wide` — labels |

### §22.3 — Elevation tokens

**Shadows**

| Token | Value | Use via |
|---|---|---|
| `--shadow-xs` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | `shadow-xs` — very subtle (selection highlight) |
| `--shadow-sm` | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` | `shadow-sm` — **canonical card** (`bg-card rounded-2xl border shadow-sm`) |
| `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | `shadow-md` — popover/dropdown |
| `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | `shadow-lg` — sheet/combobox, hover-elevated card |
| `--shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` | `shadow-xl` — DatePicker |

**Shadows — ListingCard brand-highlight (Task 405, §22.3)**

Narrowly-scoped semantic tokens for the ListingCard premium brand-highlight states only.
Do NOT apply to panels, galleries, admin tables, dialogs, or generic cards.
`StoryListingCard` uses the same shadow pattern — recorded cross-scope for Task 406.

| Token | Value | Use via |
|---|---|---|
| `--shadow-listing-card-ring` | `0 0 0 1px oklch(0.700 0.162 65 / 0.2)` | `shadow-listing-card-ring` — premium card base ring (both horizontal + vertical variants) |
| `--shadow-listing-card-elevation-md` | `0 4px 16px oklch(0.700 0.162 65 / 0.25)` | `hover:shadow-listing-card-elevation-md` — hover elevation on horizontal (list-row) premium card |
| `--shadow-listing-card-elevation-lg` | `0 8px 24px oklch(0.700 0.162 65 / 0.2)` | `hover:shadow-listing-card-elevation-lg` — hover elevation on vertical (grid) premium card |

**Z-index** (reconciles `ui-rules.md §16`: Chrome=30 / Scrim=40 / Floating=50)

> ✅ **Defined by Task 718 (2026-08-06).** All seven `--z-*` tokens below are now real custom
> properties in `src/app/globals.css`'s `@theme inline` block (`:279-285`), at exactly the values in
> this table — `^\s*--z-[a-z-]+\s*:` returns 7 matches. `var(--z-sticky)` and its siblings resolve.
> The prior ⚠️ NOT-IMPLEMENTED banner (added by Task 715's review, F1) is retired: Task 715 had
> shipped `var(--z-sticky)` into two chrome surfaces while the token was tabled here but undefined in
> `globals.css`, caught only at review. **718 also closed the detector blind spot** that let that
> ship silently — `check:design-tokens` now has a `css-undefined-var` category (§23.6.c) that fails
> closed on any `var(--x)` in `src/**/*.css` that does not resolve.
>
> **The "Use via" column below states the two forms that actually exist — not three.** Tailwind v4
> has no `--z-index-*` theme namespace (measured: 0 occurrences in `tailwindcss`'s `theme.css` and
> `dist/lib.js`; `z` is a bare-value functional utility, unlike `--space-N`'s bridge into
> `--spacing-N`). Defining `--z-sticky` makes `var(--z-sticky)` resolve; it **cannot** make a
> `z-sticky` utility class exist. Use `var(--z-*)` directly in CSS/inline style, or the bare-value
> `z-30`/`z-40`/`z-50` Tailwind utilities — never a `z-{name}` class, which Tailwind will not generate.

| Token | Value | Tier | Use via |
|---|---|---|---|
| `--z-base` | `0` | base | `var(--z-base)` or `z-0` — base page content |
| `--z-dropdown` | `10` | within-card | `var(--z-dropdown)` or `z-10` — sticky cols, count badges, abs-within-card |
| `--z-sticky` | `30` | chrome | `var(--z-sticky)` or `z-30` — site header, bottom nav, sticky admin header |
| `--z-overlay` | `40` | scrim | `var(--z-overlay)` or `z-40` — sheet/dialog backdrop (covers chrome) |
| `--z-modal` | `50` | floating | `var(--z-modal)` or `z-50` — dialog/sheet panels |
| `--z-popover` | `50` | floating | `var(--z-popover)` or `z-50` — combobox, dropdowns (same tier as modal) |
| `--z-toast` | `100` | highest | `var(--z-toast)` — Sonner toasts, ListingGallery lightbox (Task 405) |

Exception: `z-[9999]` (Combobox mobile bottom sheet, PerfDevOverlay) is intentionally above the scale and stays as an allowlisted arbitrary value.

**Zero rendered delta from this definition (Task 718, R2).** As of 2026-08-06, no `.css` or `.tsx`
file under `src/` consumes any `--z-*` token — the two former consumers
(`HeaderView.module.css:35`, `MobileBottomNavView.module.css:55`) carry a marked, unconsumed
`z-index: 30` instead (Task 715 §5.3). Defining the tokens therefore cannot change a rendered pixel;
it only makes the documentation and `globals.css` agree, and makes the next `var(--z-sticky)`
consumption resolve instead of silently computing to `auto`.

### §22.4 — Motion tokens

**Durations** (derived from actual usage: dialog=100ms, hover=200ms, image=300ms)

| Token | Value | Use via |
|---|---|---|
| `--duration-fast` | `100ms` | `duration-fast` — micro-interactions (backdrop, chip state) |
| `--duration-base` | `200ms` | `duration-base` — standard hover/active transitions |
| `--duration-slow` | `300ms` | `duration-slow` — deliberate: image fade-in, reveal |

**Easing**

| Token | Value | Use via |
|---|---|---|
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | `ease-standard` — general-purpose (ease-in-out) |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | `ease-in` — accelerating/exiting elements |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | `ease-out` — decelerating/entering elements |

Note: navigation-menu uses a spring curve `cubic-bezier(0.22,1,0.36,1)` — a justified allowlisted special case that stays as an arbitrary value.

### §22.5 — Breakpoints + sizing tokens

**Breakpoint reference tokens** (documentation/JS use — Tailwind breakpoints NOT forked)

| Token | Value | Tailwind prefix | Note |
|---|---|---|---|
| `--bp-sm` | `640px` | `sm:` | First responsive step; mobile/tablet boundary |
| `--bp-md` | `768px` | `md:` | Tablet; navigation changes |
| `--bp-lg` | `1024px` | `lg:` | Desktop; admin sidebar + table↔card flip |
| `--bp-xl` | `1280px` | `xl:` | Wide desktop; grid expansions |
| `--bp-2xl` | `1536px` | `2xl:` | Huge desktop; MUST add for grids/containers |

Source of truth for breakpoints: `@import "tailwindcss"`. Use `sm:` / `lg:` etc. in Tailwind classes; use `var(--bp-lg)` only in JS (e.g., matchMedia calls, portal positioning).

**Control heights** (one-row-one-height contract — `design-system.md §12a` / `ui-rules.md §15`)

| Token | Value | px | Use via |
|---|---|---|---|
| `--control-h-sm` | `2rem` | 32 | `var(--control-h-sm)` — xs: compact admin chrome (desktop only) |
| `--control-h-md` | `2.25rem` | 36 | `var(--control-h-md)` — sm: desktop-dense rows (`h-9` / `size="sm"`) |
| `--control-h-lg` | `2.75rem` | 44 | `var(--control-h-lg)` — default: **mobile-safe touch target** (`h-11` / `size="xl"`) |

**Icon sizes** (canonical from `ui-rules.md §5`)

| Token | Value | px | Use via |
|---|---|---|---|
| `--icon-sm` | `0.75rem` | 12 | `var(--icon-sm)` — `h-3 w-3`: tiny/badge icons |
| `--icon-md` | `1rem` | 16 | `var(--icon-md)` — `h-4 w-4`: standard UI icons |
| `--icon-lg` | `1.5rem` | 24 | `var(--icon-lg)` — `h-6 w-6`: section/decorative icons |

**Container**

| Token | Value | Use via |
|---|---|---|
| `--width-page-max` | `88rem` (1408px) | `var(--width-page-max)` / the `.container-wide` rule — **NOT** `max-w-max` (that resolves to CSS `max-content`, not the token) |

**Listing gallery frame heights (Task 405, §22.5)**

Narrowly-scoped semantic layout tokens for the listing detail gallery frame only. Consumed via `h-[var(--listing-gallery-h-mobile)]` etc. in Tailwind arbitrary syntax (not a raw px literal — no detector violation). Applied ONLY at the 4 named call sites: `GalleryStaticFrame.tsx`, `ListingGallery.tsx`, `loading.tsx` (listing detail loading skeleton), `page.tsx` comment reference. Do NOT adopt on any other gallery/image/card surface.

| Token | Value | Breakpoint | Call sites |
|---|---|---|---|
| `--listing-gallery-h-mobile` | `340px` | base (mobile) | `h-[var(--listing-gallery-h-mobile)]` |
| `--listing-gallery-h-tablet` | `420px` | `sm:` (640px+) | `sm:h-[var(--listing-gallery-h-tablet)]` |
| `--listing-gallery-h-desktop` | `500px` | `md:` (768px+) | `md:h-[var(--listing-gallery-h-desktop)]` |

---

## §23 — `check:design-tokens` gate — BLOCKING (Task 407, Epic JJ final) — Task 402, Epic JJ Phase 2

> **FINAL CONTRACT (Task 407, Epic JJ complete): `check:design-tokens` is now STRICT and
> BLOCKING — no baseline.** The bare `npm run check:design-tokens` and
> `npm run check:design-tokens:strict` both run `--strict`: any **unsuppressed** raw style-value
> violation, missing-reason marker, or stale marker exits **1**, failing the local script AND
> the `governance-pr` CI job (the "Design token strict gate" step, no `continue-on-error`).
> "Unsuppressed" means not covered by the canonical, frozen (Task 408) exemption mechanisms:
> inline `// design-tokens-allow: <exact value> — <reason>` markers (incl. the
> JSX-comment-wrapped form, §23.1.a) and the path-level `scripts/design-tokens-allowlist.json`
> (§23.2.a). The report/inventory tool is preserved separately as
> `npm run check:design-tokens:report` (non-blocking, for inventory only).
>
> **Escalation guardrail (standing policy, carried from Tasks 404–407):** if the same bespoke
> off-scale value is inline-suppressed **3+ times** across areas, it should be escalated as a
> token-candidate for owner/orchestrator review rather than suppressed again. No action this
> task — noted as standing policy.

### §23.1 — What it detects

`scripts/check-design-tokens.mjs` scans `src/**/*.{tsx,ts,css}` for raw style-value literals
that bypass the token system defined in §22:

| Category | Examples flagged | Examples NOT flagged |
|---|---|---|
| Color literals | `#abcdef`, `#fff`, `rgb(255,0,0)`, `hsl(220,100%,50%)`, `oklch(...)` | `var(--color-primary)`, `text-red-500` |
| Length (arbitrary) | `p-[13px]`, `h-[340px]`, `text-[10px]`, `max-w-[220px]`, `w-[calc(100px+2rem)]`, `min-h-[calc(100vh-4rem)]` (function-wrapped, raw px/rem, no `var()` — Task 408 rework) | `p-4`, `h-11`, `text-sm`, `max-w-md`, `h-[var(--listing-gallery-h-mobile)]`, `w-[var(--some-token)]`, `rounded-[min(var(--radius-md),10px)]`, `rounded-[calc(var(--radius)-5px)]` (var-anchored function forms) |
| Z-index (arbitrary) | `z-[100]`, `z-[9999]`, `zIndex: 9999`, `zIndex:9999`, `'z-index': 50` | `z-50`, `z-30`, `zIndex: Z_TOKEN`, `zIndex: 'var(--z-toast)'`, `zIndex: someVar` |
| Shadow (arbitrary) | `shadow-[0_2px_4px_rgba(...)]`, `shadow-[0_-2px_12px_rgba(...)]` (negative offset — also flagged) | `shadow-sm`, `shadow-md` |
| Duration (arbitrary) | `duration-[450ms]`, `transitionDuration: '300ms'` | `duration-200`, `duration-300` |
| Inline style px/rem | `width: '220px'`, `height: "44px"` | `var(--control-h-lg)` |

Excluded from scanning:
- `src/app/globals.css` — the token source of truth (§22 lives here)
- Everything in `scripts/design-tokens-allowlist.json` (email templates, brand SVG colors)
- `{/* ... */}` JSX comment blocks (see §23.1.a)

### §23.1.a — JSX comment handling (Task 408, blind spot 1)

Before per-line detection, every `{/* ... */}` block — including multi-line spans — is
stripped to whitespace (newlines preserved, so line numbers of real code are unaffected).
This means:

- A commented-out attribute value, e.g. `{/* className="text-[10px]" */}` (single- or
  multi-line), is **NOT flagged** — it is dead code, not a live violation.
- A **real** violation earlier on the same physical line as a trailing `{/* ... */}` comment
  is **still flagged** — only the comment span is blanked.
- `design-tokens-allow:` markers are parsed from the **original, unstripped** line, so a
  marker placed *inside* a `{/* ... */}` JSX comment (the existing AdminTable convention for
  `z-[1]`/`z-[2]`, see §23.2.b) continues to work unchanged.
- Existing `//` / `/* */` / leading-`*` comment-line skipping (`shouldSkipLine`) is unchanged
  and applies after the JSX-comment strip.

### §23.1.b — Negative-offset / function-wrapped / var() arbitrary values (Task 408, blind spot 3)

Audited and locked with tests (`scripts/__tests__/check-design-tokens.test.ts`):

| Form | Behavior | Status |
|---|---|---|
| `shadow-[0_-2px_12px_rgba(0,0,0,0.1)]` (negative Y offset) | **FLAGGED** — the existing `\bshadow-\[[^\]]+\]` regex already matches `-` inside the brackets; no evasion. Locked with a test. | Resolved |
| `*-[var(--token)]` (any utility, e.g. `h-[var(--listing-gallery-h-mobile)]`) | **NOT FLAGGED** — the approved token-consumption form. No detection pattern starts a match on `var(...)`. Locked with a test so future regex changes can't regress it. | Resolved |
| `*-[calc(...)]`, `*-[min(...)]`, `*-[max(...)]`, `*-[clamp(...)]` containing a raw `px`/`rem` literal AND no `var(--…)` reference (e.g. `w-[calc(100px+2rem)]`, `min-h-[calc(100vh-4rem)]`, `max-w-[calc(100vw-2rem)]`) | **FLAGGED** (Task 408 rework, owner decision: pure-literal forms only, no broad viewport exemption). Same form WITH a `var(--…)` reference anywhere in the brackets (e.g. `rounded-[min(var(--radius-md),10px)]`, `rounded-[calc(var(--radius)-5px)]`) is **NOT FLAGGED** (token-anchored exemption). The 6 pre-existing pure-literal occurrences (5 distinct values: `min-h-[calc(100vh-4rem)]` in `layout.tsx`, `max-h-[calc(90dvh-2.5rem)]` in `Combobox.tsx`, `translate-x-[calc(100%-2px)]` ×2 in `switch.tsx`, `h-[calc(100%-1px)]` in `tabs.tsx`, `max-w-[calc(100vw-2rem)]` in `SaveSearchButton.tsx`) are exact-suppressed with `design-tokens-allow` markers + reasons. `button.tsx`/`input-group.tsx` `rounded-[min/calc(var(--radius...),...)]` clamps remain clean without markers (var-anchored). All 4 lock tests pass. | **Resolved (Task 408 rework)** |

### §23.2 — Allowlist mechanisms (path-level + exact-value inline)

Two complementary suppression mechanisms cover genuinely un-tokenizable values. Both require
explicit justification — no stubs, no undocumented suppressions.

#### §23.2.a — Path-level allowlist (`scripts/design-tokens-allowlist.json`)

A JSON map of `"path-prefix": "one-line justification"` for whole files or directories where
**every** raw value is legitimately un-tokenizable (e.g. HTML email templates, inline SVG):

| Path | Reason |
|---|---|
| `src/modules/notifications/lib/emails` | HTML email clients do not support CSS custom properties |
| `src/modules/notifications/lib/sendTemplatedEmail.ts` | HTML email layout with inline hex literals |
| `src/app/api/auth-email-hook/route.ts` | Supabase auth email hook — inline HTML email for email_change events |
| `src/modules/auth/components/AuthSheet.tsx` | Official Google brand SVG colors (policy-fixed) |
| `src/components/ui/appImageConfig.ts` | Next/Image sizes media-descriptor strings + inline SVG blur placeholder color — neither can reference CSS custom properties |

To add an entry: edit the file directly with a real justification (no stubs). Stale entries
(pointing to non-existent paths) are printed as warnings but do NOT fail the check.

#### §23.2.b — Exact-value inline suppression (Task 403, Epic JJ Phase 3)

For individual bespoke off-scale values inside otherwise-tokenizable files, place a
`design-tokens-allow` marker comment on the **same physical line** as the value:

```ts
"...rounded-[4px]...", // design-tokens-allow: rounded-[4px] — 4px corner on 16px box; no scale radius token
```

**Semantics:**

- **One marker suppresses one exact value string** on that physical line. Distinct raw values
  on the same line need distinct markers.
- **Duplicate occurrences** of the same exact value on the same physical line are suppressed
  together by one marker. If only one occurrence should be suppressed, split the class/value
  string so the occurrences live on separate physical lines before adding the marker.
- **Reason is required.** A marker with a missing or empty `<reason>` (nothing after `—`) is
  an **error** — the scanner exits 1 in BOTH report and strict modes. It is NOT a warning.
- **Stale marker** — a marker whose `<exact raw value>` is not detected on that line is reported
  as a `stale-marker` violation (exits 1 in strict; listed in report mode).
- Markers are parsed from the `//` comment portion; detection runs on the code portion only.

**Inline zIndex marker form (Task 408, §B):** the marker's `<exact raw value>` is everything
between the `design-tokens-allow:` prefix and the `—` separator, **trimmed** — this may contain
internal whitespace (widened from the original single-token `\S+` extraction). For an inline
`zIndex: 9999`, the marker must reproduce the detected source text byte-for-byte, e.g.:

```ts
style={{ zIndex: 9999 }} // design-tokens-allow: zIndex: 9999 — needed above modal overlay
```

If the source has no space after the colon (`zIndex:9999`), the marker must match that exactly
(`design-tokens-allow: zIndex:9999 — …`). Missing-reason and stale-marker semantics are
identical to the className mechanism above.

**Current inline-suppressed values (Task 403, 2026-06-06; Task 408 additions, 2026-06-13):**

| File | Value | Reason |
|---|---|---|
| `src/components/ui/checkbox.tsx` | `rounded-[4px]` | 4px corner on a 16px box; no scale radius token (radius-sm = 7.2px here) |
| `src/components/ui/tabs.tsx` | `p-[3px]` | Tablist inset; off-scale (space-0.5=2px, space-1=4px) |
| `src/components/ui/button.tsx` | `text-[0.8rem]` | 12.8px on size=sm button; off-scale (xs=12px, sm=14px) |
| `src/components/ui/switch.tsx` | `h-[18.4px]` | Switch default track height; no scale token |
| `src/components/layout/MobileBottomNav.tsx` | `shadow-[0_-2px_16px_rgba(0,0,0,0.08)]` | Bespoke upward nav shadow (negative-Y offset); no `--shadow-*` token matches upward direction |
| `src/modules/listings/components/ListingMobileCTA.tsx` | `shadow-[0_-2px_12px_rgba(0,0,0,0.10)]` | Bespoke upward sticky-CTA shadow; negative-Y offset; no `--shadow-*` token matches upward direction |
| `src/app/[locale]/layout.tsx` | `min-h-[calc(100vh-4rem)]` | Viewport-minus-header height; no scale token (Task 408 rework, §23.1.b row 2) |
| `src/components/shared/Combobox.tsx` | `max-h-[calc(90dvh-2.5rem)]` | Mobile sheet height minus header; no scale token (Task 408 rework, §23.1.b row 2) |
| `src/components/ui/switch.tsx` | `translate-x-[calc(100%-2px)]` (×2, same line — one marker) | Switch thumb travel minus border; no scale token (Task 408 rework, §23.1.b row 2) |
| `src/components/ui/tabs.tsx` | `h-[calc(100%-1px)]` | Tab trigger fills list height minus border; no scale token (Task 408 rework, §23.1.b row 2) |
| `src/modules/listings/components/SaveSearchButton.tsx` | `max-w-[calc(100vw-2rem)]` | Viewport-minus-margin dialog width; no scale token (Task 408 rework, §23.1.b row 2) |

**§D — `--z-table-sticky` token decision (carried from Task 406, closed Task 408 rework,
2026-06-13): KEEP-SUPPRESSED.** `AdminTable.tsx`'s `z-[1]`/`z-[2]` remain exact-suppressed
(plain local sticky-cell stacking, unrelated to the negative-offset-shadow analogy) — no
`--z-table-sticky` token added, no product-code change. If the owner later wants Decision B
(add the token), that is a separate follow-up touching `globals.css` + `AdminTable.tsx` + a
computed-z-index inert proof + the Task 410 story render.

**Escalation guardrail (Tasks 404–407):** if the same bespoke off-scale value is
inline-suppressed **3+ times** across areas 403–406, it MUST be escalated as a token-candidate
for owner/orchestrator review instead of being repeatedly suppressed. Do NOT create a new token
inside 404–406 — only escalate for owner decision.

### §23.3 — CLI modes

| npm script | Behavior |
|---|---|
| `npm run check:design-tokens` | **Strict mode (default, Task 407)** — exit 1 on any unsuppressed violation, missing-reason, or stale marker. Blocks CI. |
| `npm run check:design-tokens:strict` | Same as above (explicit alias, kept for clarity) |
| `npm run check:design-tokens:report` | Report mode — prints inventory, **always exit 0** for raw-value findings (missing-reason/stale still exit 1). Non-blocking inventory tool. |
| `npm run check:design-tokens:update-allowlist` | Seed/refresh allowlist stubs from current scan |

### §23.4 — Rollout plan

| Task | Action |
|---|---|
| **402** (done) | Detector built + report mode wired to CI (`continue-on-error: true`) |
| **403–406** | Refactor consumers: replace raw values with tokens from §22 |
| **408** (done) | Detector hardening: JSX-comment strip (§23.1.a), inline-zIndex detect+suppress (§23.2.b), negative-offset/var()/function-wrapped audit (§23.1.b — all 3 rows closed), planted-violation test harness (§23.5, 25 tests). §D `--z-table-sticky` decision recorded: KEEP-SUPPRESSED (§23.2.b). All 3 blind spots closed — Task 407 strict flip is safe. |
| **407** (done) | Strict flip landed: `governance-pr.yml` design-token step now runs `check:design-tokens:strict` with `continue-on-error` removed (blocking); `package.json` bare `check:design-tokens` repointed to `--strict`; `check:design-tokens:report` added for the preserved inventory path. Green-on-flip (0 violations on clean tree, native transcript). **Epic JJ complete.** |

### §23.5 — Detector test harness (Task 408, §E)

`scripts/__tests__/check-design-tokens.test.ts` (run via `npx vitest run
scripts/__tests__/check-design-tokens.test.ts` or `npm test`) imports `scanContent`,
`stripJsxComments`, and `parseInlineMarkers` directly from `scripts/check-design-tokens.mjs`
(no filesystem fixtures — content is planted as in-memory strings against a fixture path that
does not match any `design-tokens-allowlist.json` entry).

For every category and blind spot, the suite plants **both** a violating case (must be caught)
and a valid/commented/var/suppressed case (must NOT be caught or must be suppressed):

- **§A (JSX comments):** live arbitrary value flagged; single- and multi-line `{/* ... */}`
  commented value NOT flagged; real value + trailing comment on the same line still flagged;
  `//` / `/* */` / leading-`*` line skipping unchanged; marker inside a `{/* ... */}` block
  (AdminTable convention) still suppresses.
- **§B (inline zIndex):** raw `zIndex: 9999` and `'z-index': 50` flagged; `var(--z-toast)` and
  identifier-bound zIndex NOT flagged; matching marker+reason suppresses; missing-reason marker
  reported as `missing-reason` (does not suppress); stale marker reported as `stale-marker`
  (real value remains flagged).
- **§C (shadow/var):** negative-offset shadow flagged; `*-[var(--token)]` (incl. the listing
  gallery height tokens) NOT flagged.
- **§C row 2 (function-wrapped calc/min/max/clamp, Task 408 rework):** pure-literal
  `w-[calc(100px+2rem)]` flagged; viewport-relative literal `min-h-[calc(100vh-4rem)]` /
  `max-w-[calc(100vw-2rem)]` flagged (no broad viewport exemption); var-anchored
  `rounded-[min(var(--radius-md),10px)]` / `rounded-[calc(var(--radius)-5px)]` NOT flagged; an
  in-tree pure-literal form with a marker suppresses, with missing-reason and stale-marker still
  gating.

**25 tests, all passing** (`npx vitest run scripts/__tests__/check-design-tokens.test.ts`).

This harness is the evidence that the gate's positive AND negative paths are exercised, and
backs the Task 407 strict/blocking flip (now landed — see §23.4).

### §23.6 — Plain CSS declaration coverage: `css-length`/`css-duration`/`css-zindex` (Task 714, report-only)

> **Coverage decrease this closes:** every pattern in §23.1 is shaped around Tailwind's
> arbitrary-value bracket syntax (`*-[Npx]`) or an inline style-object literal. A plain CSS
> declaration in a `.module.css` file — `font-size: 10px;`, `gap: 1.5rem;`,
> `transition-duration: .15s;`, `z-index: 30;` — matched none of them. Task 713's D28 migration
> moved three previously-detected, explicitly-marked `text-[10px]` TSX sites into exactly this
> blind spot (proof: `docs/sessions/2026-08-05-task713-mobile-bottom-nav-de-tailwind.md` §4); the
> gate reported `0 violations` while the site-level protection was gone. Task 714 closes the gap.

Three new categories, extending `DETECTION_PATTERNS`, `.css` files only:

| Category | Matches | Does NOT match |
|---|---|---|
| `css-length` | A declaration whose value is a single bare `px`/`rem`/`em` literal (incl. scientific notation, e.g. `border-radius: 3.40282e38px`) followed by `;` or `}`; **and, since Task 716, a raw `px`/`rem`/`em` literal anywhere inside a multi-value/shorthand declaration or a CSS function, per-literal (§23.6.a)** | Zero values (`0`, `0px`, `0rem`, `0em`); `var(--token)`; `calc(var(...))`; a literal whose own outermost enclosing function contains a `var(--…)` reference anywhere (§23.6.a A1/A4) |
| `css-duration` | A declaration whose value is a single bare `s`/`ms` literal (incl. leading-dot, e.g. `.15s`); **and, since Task 716, the same shorthand/function-wrapped generalization** | Zero values; the same var-anchored exclusion as above |
| `css-zindex` | `z-index: N;` with a raw unitless integer; **and, since Task 716, the same generalization for a function-wrapped z-index value** | `z-index: 0`; `z-index: var(--z-toast)` |

**Scope boundary as of Task 714 (superseded — kept for history):** these patterns originally matched
only a declaration whose entire value was one bare token; a multi-value list or a function-wrapped
value was explicitly out of scope, pending the same nested-function handling Task 408 built for
Tailwind's `calc/min/max/clamp` brackets. **Task 716 closed that gap — see §23.6.a.**

**CSS comment stripping (A2):** a new `stripCssComments()` helper strips `/* ... */` spans (incl.
multi-line) to whitespace, used only to build the detection source for these three patterns — the
existing color/Tailwind-bracket patterns keep reading the unstripped source, so their behavior on
`.css` files is byte-identical to before this task. `design-tokens-allow` markers are still parsed
from the original, unstripped physical line — unchanged mechanism, first proven for CSS colour
markers by Task 713 (`MobileBottomNavView.module.css:60`, `:87`), now proven for length too
(Task 714 R5: suppression and orphaned-marker-as-stale-marker, both arms, on a throwaway copy).

**rawValue convention (A1):** reported as `property: value` (e.g. `font-size: 10px`, `z-index:
30`), matching the existing inline-`zIndex` convention — this disambiguates identical bare values
on one line coming from different properties, and is the exact string a `design-tokens-allow`
marker must reproduce byte-for-byte. Task 716 keeps this convention for shorthand findings too:
`property: literal` where `literal` is the one raw token found, not the whole multi-value list
(e.g. `border-bottom: 1px`, not `border-bottom: 1px solid var(--border)`).

**`@media`/`@supports` preludes (A5):** never match. A condition's numeric token (e.g. `(min-width:
40rem)`) is always followed by `)`, never `;`/`}`, so the terminator lookahead structurally
excludes preludes without special-casing. Proven with a dedicated test — including a Task 716
regression arm confirming the shorthand-scanning code path is equally excluded.

**Report-only, not silent (R3/A4), historical:** `REPORT_ONLY_CATEGORIES` (`css-length`,
`css-duration`, `css-zindex`) were excluded from the strict/blocking exit-code computation and from
the main per-area violation printout, but always printed under their own `CSS DECLARATION LITERALS —
report-only, not blocking` heading with an explicit count — never silently absorbed. **Superseded by
Task 715 (§23.6.b) — the categories now block.**

### §23.6.a — Shorthand / function-wrapped generalization (Task 716)

Task 714's single-token-only boundary left every multi-value CSS declaration
(`border-bottom: 1px solid var(--border)`) and every function-wrapped value (`filter: blur(8px)`)
undetected. Task 716 generalizes all three categories to a **per-literal** scan of the declaration's
full value, following the same token-anchored-exemption mechanism Task 408 built for Tailwind's
`*-[calc/min/max/clamp(...)]` brackets, but corrected for the declaration-list case:

- **A1 (the central design problem, resolved):** Task 408's filter exempts a match containing
  `var(--` **anywhere in the same bracket**, which is correct when the bracket is one function-call
  value. It is wrong applied to a whole *declaration list*, where `border-bottom: 1px solid
  var(--border)` has THREE independent top-level tokens (`1px`, `solid`, `var(--border)`) — exempting
  `1px` because a sibling token is a `var()` would be an over-exemption. The fix: the exemption is
  **per-literal, scoped to that literal's own outermost enclosing function call** (`isVarAnchoredLiteral`
  in `scripts/check-design-tokens.mjs`). A literal at the declaration's top level (no enclosing
  function at all) is never exempted by a sibling `var()` — this is exactly what makes `1px` in
  `border-bottom: 1px solid var(--border)` a finding. A literal genuinely INSIDE a function that also
  contains a `var(--…)` reference anywhere within that same function (e.g. `calc(var(--x) + 2px)`)
  stays exempt — the frozen Task 408 `rounded-[calc(var(--radius)-5px)]` precedent, generalized from
  Tailwind brackets to arbitrary CSS functions.
- **A2 (zero/unitless forms):** structurally silent without extra filtering — the unit regex requires
  a `px`/`rem`/`em`/`s`/`ms` suffix, so unitless multi-value tokens (`flex: 1 1 0`, `border: 0`,
  `line-height: 1.5`, `scale: 0.95`) never match at all; a zero-WITH-unit token (`margin: 0px 8px`)
  is filtered by the same zero-value check the single-value pattern already used.
- **A3 (the 1px policy, decided):** the 1px/-1px hairline exemption is **single-value-only** and
  unchanged (`border-top-width: 1px;` stays silent). The instant `1px` co-occurs with any other token
  in a shorthand list, it is a full finding like any other raw literal — one consistent rule ("the
  exemption applies only when 1px IS the whole value"), not two different policies, proven by
  `border-bottom: 1px solid var(--border)` now reporting `border-bottom: 1px`.
- **A4 (nesting):** handled to arbitrary depth by walking paren balance rather than a fixed pattern —
  `calc(var(--x) + 2px)` (var-anchored, exempt), `clamp(1rem, 2vw, 3rem)` (no var anywhere in the
  function, both `1rem`/`3rem` flagged), `color-mix(in oklab, var(--primary) 90%, transparent)` (no
  unit literal present, nothing to flag) are all proven with tests.
- **A5 (`--*` custom properties, decided):** IN scope, unchanged from the property-name pattern
  already in use (`[\w-]+` matches a leading `--`) — no special-casing needed. Proven against the
  real `MobileBottomNavView.module.css:60`/`:87` `--tw-shadow` shapes.
- **A declaration whose value IS exactly one bare token** is left to the pre-existing single-value
  pattern (incl. its own zero/A3 exemption) so the two code paths never double-count a finding.

**R4 — reason-less CSS marker diagnostic fix:** a `design-tokens-allow` marker with no `—` separator
inside a CSS block comment (`/* design-tokens-allow: font-size: 10px */`) had its own comment
terminator `*/` absorbed into the extracted value (`parseInlineMarkers`), so it never matched the
detected source text and misreported as `stale-marker` instead of the documented missing-reason
error. Fixed by stripping a trailing `*/` **only in the no-reason branch** (a marker with a reason
never has `*/` before the `—` separator, so that path is untouched; the TSX `//` form has no
terminator to strip, so it is unaffected).

**Measured 2026-08-06 (re-run, supersedes Task 714's 45-item table):** **60 literals across the same
6 files** (`npm run check:design-tokens` still exits **0**) — **delta: +15, 0 files added or
removed**, all 15 newly-detected literals classified `COMPILED-ARTIFACT` (0 new `N1-VIOLATION`).
`src/design-system/mantine/patterns/MantineListingCardPattern.module.css` is excluded at the
path-level allowlist (`scripts/design-tokens-allowlist.json`) regardless of detector coverage — it
was never in either census. Classified inventory:
`.screenshots/task716-evidence/task716-css-declaration-inventory.md` (local-only, D6), summarized in
`docs/sessions/2026-08-06-task716-design-tokens-shorthand-and-function-coverage.md`. **715 must scope
its remediation from this 60-item table, not Task 714's 45-item one.**

**Test coverage:** Task 714 shipped 18 planted arms (§D) on top of 25 pre-existing (43 total). Task
716 adds 24 new arms (§E/§F, plus 2 `parseInlineMarkers` arms) and corrects 2 pre-existing §D
assertions whose old behavior this task's own requirements mandate changing — not a silent
weakening: (1) the 1px-in-shorthand assertion (now split so the single-value case stays exempt and a
new §E arm proves the shorthand case is a finding, per A3/AC1); (2) the reason-less-CSS-marker
assertion (flipped from asserting the `stale-marker` bug to asserting the `missing-reason` fix, per
R4/AC4). **67 total, all passing** (`npx vitest run scripts/__tests__/check-design-tokens.test.ts`).

### §23.6.b — Strict flip and inventory closure (Task 715)

**`css-length`/`css-duration`/`css-zindex` are now BLOCKING.** `REPORT_ONLY_CATEGORIES` is empty
(`scripts/check-design-tokens.mjs:262`) — `npm run check:design-tokens` (which already runs
`--strict`, Task 407) now exits non-zero on any raw length, duration, or z-index literal in a
`.css` file under `src/**`, matching the treatment every other category already received.

**The 716 60-item inventory is closed.** Every item was either tokenized (`N1-VIOLATION`, consuming
its §22 token — value verified equal, not assumed) or marked with a `design-tokens-allow` reason
(`COMPILED-ARTIFACT`) across the six owning files (`FooterView`, `HeaderView`,
`MobileBottomNavView`, `FeaturedListingsView`, `LatestListingsView`, `PopularLocationsView`
`.module.css`). Full literal → token → §22-value substitution table and every marker string:
`docs/sessions/2026-08-06-task715-design-tokens-strict-flip-and-remediation.md`.

**The nav-label `10px` decision (§3.3 of the Task 715 kickoff) is a restoration, not a new policy
call.** `MobileBottomNavView.module.css`'s `.fabLabel`/`.navItemLabel` `font-size: 10px` sites carry
`design-tokens-allow` markers reusing the exact reason text from the pre-Task-713 TSX markers
(`git show 8199a5aae^:src/components/layout/MobileBottomNavView.tsx:56,:92,:101`) — consistent with
this section's own `--text-2xs` prohibition (§22.2: "Do NOT use for … nav labels"). `--text-2xs` was
never substituted here.

**Two remediated files have no rendered Storybook coverage** (`FeaturedListingsView.module.css`,
`LatestListingsView.module.css` — no story lives under the `--mantine-only` `Mantine/Primitives/` or
`Patterns/Mantine/` title prefixes). Their substitutions are proven by a numeric literal→token
equality table instead of the rendered comparator — recorded in the Task 715 session log, not
papered over.

**The `z-index: 30` sites are marked, not tokenized (review finding F1).** 716's inventory classified
`HeaderView.module.css:35` and `MobileBottomNavView.module.css:55` as `N1-VIOLATION → --z-sticky (30)`
against §22.3's z-index table. That table is documentation-only — see its ⚠️ banner. Both sites keep
`z-index: 30` with a `design-tokens-allow` marker, matching `PopularLocationsView.module.css:56`'s
`z-index: 1`. Final split: **30 tokenized / 30 marked**.

**Standing gap, not closed here:** `scripts/design-tokens-allowlist.json`'s `src/design-system/mantine`
entry allowlists the whole directory at the path level, exempting
`MantineListingCardPattern.module.css` from token enforcement entirely regardless of this flip —
registered as **717**, out of scope for Task 715 (its own blast radius across a whole library).

### §23.6.c — Undefined CSS custom-property references: `css-undefined-var` (Task 718, R4)

> **Origin.** Every category above validates *syntax* — `var(--token)` is exempt everywhere it
> appears, regardless of whether `--token` is actually defined. Task 715 shipped `var(--z-sticky)`
> into two chrome surfaces on the strength of §22.3's table alone; `--z-sticky` did not exist in
> `globals.css`, so the declaration was invalid at computed-value time and silently computed to
> `auto` — caught only at review (Task 715 §5.3, F1). `css-undefined-var` closes that blind spot:
> **blocking from the start**, no report-only staging, because the pre-existing baseline measured 0
> (§3.6 of the Task 718 kickoff).

**Scope:** `.css` files only (`cssOnly`), a `var(--x)` reference with NO resolvable definition. A
reference resolves against exactly three sources:

1. **`src/app/globals.css`** — the token source of truth. It is itself excluded from scanning
   (`SKIP_FILES`), so `run()` reads it once and threads its definitions through every `.css` scan as
   `globalsDefinedProps`.
2. **The same file being scanned** — a `--x:` declaration anywhere in that file (position-independent
   — the detector does not model selector/media scoping, a documented simplification consistent with
   the rest of this file's line-based design). `extractCssCustomPropertyDefinitions` registers **every**
   top-level declaration, not only the first one on a physical line (Task 720, R1/R2): a declaration
   start is recognized right after a top-level `{` or `;` (or at the very start of the source), where
   "top-level" is tracked by a quote-state + paren-depth walk over the already CSS-comment-stripped
   source — never inside a quoted string or inside `(...)` nesting. That is what makes
   `.x { --local: 1px; width: var(--local); }` resolve correctly (a same-line define-and-use no longer
   a phantom finding) while a declaration-shaped literal inside a `content` string or a data-URI value
   is still never mistaken for a definition. Name case is never normalized — `--Foo` and `--foo` remain
   two distinct entries.
3. **A measured external prefix/exact-name list** — variables a framework supplies at build time that
   this repo does not define. Every entry is proven present in the production build and/or
   `node_modules` (measured 2026-08-06):

   | Entry | Kind | Proof |
   |---|---|---|
   | `--tw-` | prefix | Tailwind v4 internal utility vars (`--tw-shadow`, `--tw-ring-color`, …) — present in `.next/static/css/*.css`, generated by every Tailwind utility class |
   | `--mantine-` | prefix | Mantine v9 `createTheme()` output — present in `.next/static/css/*.css` and every `node_modules/@mantine/core/styles/*.css` |
   | `--spacing` | exact name | Tailwind v4's own base spacing-scale unit (`--spacing: .25rem`) — `node_modules/tailwindcss/theme.css:325`, also in the production build. **Distinct** from this repo's `--spacing-N` named tokens |
   | `--default-transition-timing-function` | exact name | Tailwind v4's own base easing variable — `node_modules/tailwindcss/theme.css:493`, also in the production build. Consumed as the fallback arm of a nested `var(--tw-ease, var(--default-transition-timing-function))` at `MobileBottomNavView.module.css:92` |

   `--z-` is deliberately **absent** — it is the token family this task defines in `globals.css`; if
   it needed the external list, R1 failed.

**A5 — the `var(--x, fallback)` decision:** a reference **with** a fallback is treated as resolved,
even when `--x` itself is undefined — it cannot silently fall back to the property's initial value,
which is the exact failure mode this category exists to catch. Only a `var()` with **no** fallback
and no resolvable definition is a finding. A fallback is detected as a top-level comma inside the
`var(...)` call, scoped to that call's own paren depth, so a nested reference used *as* another
`var()`'s fallback (the real `MobileBottomNavView.module.css:92` shape) is still independently
checked for its own resolution.

**A3 — comment stripping reused, not duplicated:** runs on the same CSS-comment-stripped source
(`codeOnlyCss`) the shorthand `css-length`/`css-duration`/`css-zindex` scanner already uses.

**A4 — known coverage limitation, not closed here:** the path-level allowlist
(`scripts/design-tokens-allowlist.json`) still short-circuits a whole file before any category runs,
so `src/design-system/mantine/**` is exempt from `css-undefined-var` too. Narrowing that allowlist is
**717**'s blast radius, not this task's.

**A6 — known coverage limitation, not closed here:** `globals.css` is excluded from the scanner
entirely (unchanged), so a self-referential mistake inside `globals.css` itself (e.g. one token
defined in terms of a misspelled sibling) is not caught by this category.

**A7 — closed by Task 719.** A `var(` reference — and, cross-category, a `css-length`/`css-duration`/
`css-zindex` declaration too — on a line whose first non-space character is `*` used to be silently
not a finding, because `shouldSkipLine` treated any such line as a comment before any category ran,
conflating the CSS-comment heuristic with the universal selector. Task 719 made the `.css` skip
decision consult the already CSS-comment-stripped line (Task 714 A2) and skip only when that line is
blank, so a universal-selector rule is scanned like any other; the `.ts`/`.tsx` leading-`*`/`/*` JSDoc
heuristic is unchanged, because nothing else strips those continuation lines. Proof: four planted
arms, one per blinded category, each failing before the fix and passing after
(`scripts/__tests__/check-design-tokens.test.ts` §I).

**A8 — known coverage limitation, not closed here (718R):** a `var(` call split across physical
lines (the opening paren on one line, its contents or closing paren on another) is silently not a
finding, because `findUndefinedCssVarReferences` scans one physical line and bails on an unbalanced
paren. This is deliberate and consistent with the whole file's line-based scan model (§3.4 of the
718R kickoff) — making one category multi-line would give it a different source model from every
other category in the same loop. Owner: none — architectural, unowned; fixing it is a
scanner-architecture task, not a regex change.

**Proof (Task 718 R5, D32):** a planted `var(--z-does-not-exist)` in a scanned `.css` file makes
`npm run check:design-tokens` exit non-zero, naming it; removing the plant restores exit 0 — both
arms captured unpiped, `git status` confirming the plant is gone. Detector unit suite: 16 new arms
(§H) covering all seven branches above, `npx vitest run scripts/__tests__/check-design-tokens.test.ts`
— 85/85 passing (69 pre-existing + 16 new).

---

## §24 — Forbidden responsive hardcodes and pseudo-fixes (A2 mandate, 2026-06-08)

> **This clause is BINDING and OVERRIDES any weaker local wording. Any pattern listed here
> applied in a task without an approved exception entry is a FAIL — do not approve or commit.**

The §15 list covers forbidden Tailwind/responsive patterns at a class-fragment level. This
section adds the complete, enforceable rule for every form of responsive hardcode or pseudo-fix.

### 24.1 — Raw dimension values

- Raw pixel widths, heights, min-width, max-width in `className` or `style={{}}` for layout
  purposes: `w-[NNNpx]`, `min-w-[NNNpx]`, `max-w-[NNNpx]`, `h-[NNNpx]` — unless already a
  documented, approved design-system exception (§22, §22.5, or §24.8 table).
- Raw `rem`/`em` width or height values not drawn from the token system (§22).
- Inline `style={{ width: '…', height: '…', maxWidth: '…', minWidth: '…' }}` layout fixes.

### 24.2 — Arbitrary Tailwind values for layout rhythm

- `w-[…]`, `min-w-[…]`, `max-w-[…]` on content columns or surfaces — use §4 container classes.
- `h-[…]`, `text-[…]`, `gap-[…]`, `p-[…]`, `m-[…]`, `z-[…]` when a canonical token exists (§22).
- Exception: token-equivalent inline-suppressed values with `design-tokens-allow` markers
  (§23.2.b) cover the token-detection gate only; the responsive-layout rule still applies
  independently — both gates must be satisfied.

### 24.3 — Local breakpoint invention

- `min-[NNNpx]:` or `max-[NNNpx]:` arbitrary responsive prefixes — only the 5 canonical
  Tailwind breakpoints (`sm: md: lg: xl: 2xl:`) are allowed.
- Component-local media queries that bypass the canonical breakpoint system.
- Per-component `useEffect`/`useState` window-width checks for layout switching (§2.4 —
  hydration risk).

### 24.4 — Overflow masking

- `overflow-hidden` applied to hide a responsive layout defect — fix the root cause (`min-w-0`,
  `flex-wrap`, `flex-1`, or a §4 container).
- `whitespace-nowrap` on localized labels unless paired with an approved `truncate`/`line-clamp`
  AND a `min-w-0` parent (§6.3).

### 24.5 — Capability shrinkage and silent removal

- Shrinking text or buttons below canonical touch/readability rules (`size="xl"` = 44px floor,
  §12a) to "make it fit" — expand the container or use a §10 `tableAt` pattern instead.
- Removing labels, actions, columns, filters, row actions, pagination, validation, or
  empty/loading/error states to make a screenshot pass. See §25 for the full preservation rule.
- Making an editable control read-only to eliminate a layout challenge (agent-contract clause 4).

### 24.6 — Locale-specific hacks

- CSS or class-name changes scoped to `uk`/`it`/`sq`/`en` locale to paper over a
  wrapping/overflow defect — the fix must work for all four locales.
- Story-only hardcoded text or layout fixtures that make screenshots pass while product
  behavior remains non-canonical.

### 24.7 — Storybook proof masking

- `parameters.layout: 'centered'` or `'padded'` in stories — forbidden; use `layout:'fullscreen'`
  + `withCanvas` (§27.1).
- Story-local `max-w-*` / padding wrappers that artificially compress the canvas to hide an
  overflow defect.

### 24.8 — Approved exception proposal

If a genuine, un-tokenizable deviation is required, it MUST be recorded in the **Approved
Exception Proposal** table before it may be committed. Unapproved exceptions = FAIL.

| Surface | Reason | Affected locales | Affected viewports | Why canonical tokens/classes cannot solve it | Owner approval |
|---|---|---|---|---|---|
| _(example: DatePicker `w-[272px]`)_ | _(Fixed-width calendar grid; fluid layout breaks day-cell alignment)_ | all | all | _(No Tailwind scale equivalent; day-cell grid requires exact pixel alignment)_ | _(Task 404 §23.2.b allowlist)_ |

---

## §25 — Global control-preservation rule (A4 mandate, 2026-06-08)

**Every user capability, control, and action MUST remain reachable and usable at EVERY
canonical viewport (§3) and EVERY locale (sq/en/uk/it). Silent removal is FORBIDDEN.**

A task that removes a control without explicit owner approval is a TASK FAILURE regardless
of whether the result is "visually clean."

### 25.1 — Capability categories

For every data surface (table, list, card grid) or form touched by a task, the session log
MUST record the current and post-task state of:

| Capability | What to preserve |
|---|---|
| **Columns** | All columns present; column-visibility tokens (`'always'`, `'sm'`, `'md'`, `'lg'`, `'xl'`) declared per §10. |
| **Row-click behavior** | Primary-text click → detail page OR preview dialog (§11, `component-governance.md §11`). |
| **Row actions** | Edit / delete / status-change / custom actions present and reachable at every viewport. |
| **Inline controls** | Status selectors, toggle switches, inline edits — must remain editable, not replaced with read-only labels. |
| **Filters / search / sort** | Search input, filter chips, column sort — all reachable; not pushed off-screen at narrow widths. |
| **Pagination** | Page controls reachable at every viewport; never hidden to save space. |
| **Bulk actions** | If present: selection checkboxes + bulk action buttons present and reachable. |
| **Empty state** | Styled, localized empty state present and visible when the list has 0 rows. |
| **Loading state** | Skeleton or spinner state present during data fetch. |
| **Error state** | Error message + retry control present on fetch failure. |
| **Validation states** | Form validation errors styled and visible; never hidden by overflow. |
| **Submit / save / cancel / destructive actions** | Buttons visible and ≥44px at every viewport; destructive actions use AlertDialog (§14.3). |
| **Mobile / tablet / desktop behavior** | 320 / 768 / 1024 / 1440 / 2560 each have an intentionally designed layout — no "desktop squeezed onto mobile" or "broken hybrid at 768–960". |

### 25.2 — Allowed capability moves

A capability MAY move to a new location/pattern ONLY when:

1. The new location is **implemented in the same task** (never deferred to a follow-up).
2. The new location / pattern is explicitly documented in the session log.
3. The new location is **equally discoverable** (not hidden behind an undocumented gesture).
4. The new pattern still meets the ≥44px touch target rule at every mobile viewport.

### 25.3 — Capability-removal approval

A capability MAY be removed (not moved) ONLY with **explicit owner approval** recorded in the
kickoff. The session log must cite the exact kickoff text authorizing the removal.

### 25.4 — Read-only label is not a replacement

Replacing an editable control (text input, select, combobox, checkbox, toggle) with a
read-only text label is **NOT** an acceptable responsive fix. The editable control must remain
editable — either in-place or in a discoverable alternate location implemented in the same task.

---

## §26 — Mobile `<640px` full-width gate + popup bottom-sheet contract (owner P0, 2026-06-08)

> This section codifies agent-contract clauses 11–12 as a design-system rule. It applies to ALL
> surfaces globally. Where this section conflicts with an older or weaker rule, this section wins.
> Slice kickoffs MUST reference the specific clauses they enforce.

### 26.1 — Full-width interactive controls at `<sm` (`<640px`)

At every viewport **below 640px**, ALL of the following MUST span the **full available width**
(no side margins, no content-width centering, no fixed-width, no `w-auto` shrinkage):

| Element class | Canonical mobile class | Notes |
|---|---|---|
| Text `Button` (all label-bearing sizes) | `max-sm:w-full` (already in primitive, §12b) | Icon-only sizes exempt — see §26.4 |
| `TabsList` / Tabs triggers | `max-sm:flex max-sm:w-full` (already in primitive, §12b) | |
| `FilterBar` controls / triggers | `[&>*]:max-sm:w-full` on container (§11, §12a) | |
| `SelectTrigger` | `max-sm:w-full` | Inherited from primitive |
| `Combobox` button-variant trigger | `max-sm:w-full` | |
| `PhoneField` | `max-sm:w-full` | |
| Form action rows (Submit / Save / Cancel / Destructive) | `[&>*]:max-sm:w-full` on container (§12a/§12b) | |
| Admin action clusters / toolbars | `[&>*]:max-sm:w-full` on container (§12a) | |
| CTA buttons | `max-sm:w-full` | |

An interactive surface that is NOT full-width at `<640px` without a documented icon-only
exemption (§26.4) is a **FAIL** (§21).

### 26.2 — All popups = full-width bottom sheet at `<640px`

Every overlay/popup primitive MUST render below 640px as a **full-width bottom sheet**:
bottom-anchored, edge-to-edge (no `max-w-*` leaking below 640px), rounded TOP corners only,
slide-up animation, `≤90dvh` with internal vertical scroll, drag-handle bar at top.

| Primitive | `<640` contract |
|---|---|
| `Dialog` | Bottom-anchored, edge-to-edge, rounded-top only, `≤90dvh` + internal scroll. |
| `Sheet` | `side="bottom"`, edge-to-edge, rounded top corners. |
| `Select` dropdown | Bottom-anchored, full-width. |
| `Combobox` dropdown (all variants: Location/PropertyType/Year) | Bottom-anchored, full-width. |
| `DropdownMenu` | Bottom-anchored, full-width. |
| `NavigationMenu` | Bottom-anchored, full-width. |
| `Popover` | Bottom-anchored, full-width. |
| `Command` | Bottom-anchored, full-width. |

**NOT a centered card, NOT a mini-dropdown, NOT an anchored popover** at `<640px`.
At `≥640px` the existing desktop popup/anchor behavior is restored.

**Drag handle:** every mobile bottom sheet displays a small centered grabber strip at the top.

**Close/dismiss:** backdrop tap + Esc closes; focus returns to trigger.

**Touch targets:** ≥44px (`min-h-11`) for all items inside the bottom sheet.

**Labels:** `whitespace-normal break-words` — long sq/en/uk/it labels wrap, never clip.

**Horizontal scroll at 320:** forbidden inside any bottom sheet.

### 26.3 — Map-marker popup exemption

Non-UI map-marker popups (e.g. Leaflet `Map.tsx` pin labels) are **exempt** — they are
positioning artifacts, not interactive popups. If encountered in a task, **STOP & ASK** before
applying the bottom-sheet rule.

### 26.4 — Icon-only / compact control exemptions

Icon-only controls are exempt from the full-width rule. Each exemption MUST be listed in the
session log:

| Control | Reason |
|---|---|
| `Button size="icon"` / `size="icon-xl"` | Icon-only tap target; fixed size intentional |
| `Button size="icon-sm"` / `size="icon-xs"` | Admin table micro-actions |
| Search icon prefix inside `Input` (icon-group) | Icon takes fixed width; input fills remaining |
| Column sort ⇅ icon (12px) | Metadata icon in table header; no label |

Any text-containing control NOT listed = subject to full-width enforcement.

### 26.5 — PASS / FAIL for the mobile full-width gate

**PASS:** every text interactive control fills the full available width at `<640px`; every popup
renders as a bottom sheet edge-to-edge.

**FAIL (auto-reject):**
- A text button, select trigger, combobox trigger, tabs list, filter control, form action row,
  or CTA that is NOT full-width at any viewport `<640px` without a documented icon-only exemption.
- A popup that renders as a centered card, mini-dropdown, or anchored popover at `<640px`.
- An overlay with `max-w-sm` / `max-w-[calc(100%-2rem)]` that does not go edge-to-edge below 640px.

### 26.6 — Approved §26.2 pattern exceptions (owner-approved, 2026-06-10, Task 414 Slice 2)

Two overlay surfaces are **owner-approved exceptions** to the literal §26.2 bottom-sheet contract.
They are NOT defects and MUST NOT be "fixed" into bottom sheets by any future slice without a fresh
owner decision (sibling precedent: §26.3 map-marker exemption).

| Surface | File | Pattern kept | Why it is exempt |
|---|---|---|---|
| Fullscreen image lightbox | `src/modules/listings/components/ListingGallery.tsx` (`fixed inset-0 z-toast bg-overlay/95`) | Fullscreen, edge-to-edge, full-viewport photo viewer with `icon-xl` (≥44px) prev/next/close | A fullscreen media viewer is a different category from a transient popup. It is already stronger than "full-width bottom sheet" (full-viewport, not `≤90dvh`); converting it would shrink the image area and break the prev/next/close gallery UX (matches dom.ria.com reference). |
| Admin left nav drawer | `src/components/admin/AdminSidebar.tsx` (`Sheet`/`SheetContent` `side="left"`) | Left-anchored slide-in nav drawer (`data-[side=left]:w-3/4 … sm:max-w-sm`) | A persistent app-chrome navigation drawer is a different interaction pattern from a transient popup/menu/dialog. Users expect the hamburger menu to slide from the edge, not the bottom. The `ui/sheet.tsx` primitive gives only `side="bottom"` the §26.2 treatment by design; adding a `side="left"` mobile override is a separate primitive change, not in scope for the overlay slice. |

Any OTHER overlay/popup remains bound by §26.2. These two exemptions are exhaustive as of Task 414.

**Combobox pointer-dismiss focus-return residual (owner-approved, 2026-06-10, Task 415).** For the
shared `Combobox`, the §26.2 dismiss contract is satisfied as follows: **Esc closes AND returns
focus to the trigger (required — implemented, PASS)**, and **backdrop / outside-pointer tap closes
the dropdown (PASS)**. The one accepted residual: an outside-**pointer** tap MAY close the dropdown
**without** force-returning focus to the trigger. Forcing focus-return after a pointer dismissal is
UX-questionable (a user who taps elsewhere usually does not expect focus to jump back) and would
require a document-level `pointerdown`/`mousedown` listener in a high-blast-radius shared component.
This is an **owner-approved residual**, not a defect or a silent PASS — do NOT add a document-level
pointer listener to fix it without a fresh owner decision. Esc focus-return must remain PASS.

---

## §27 — Storybook responsive-proof contract (2026-06-08)

> Supplements `docs/storybook-governance.md §14` and `docs/responsive-screenshot-governance.md`.
> This section defines what counts as PASS/FAIL for a rendered Storybook cell (story × viewport × locale).

### 27.1 — Canvas requirement

Every story MUST render in a full-available-width frame that accurately reflects `<640` behavior:

- **Required:** `parameters.layout: 'fullscreen'` + global `withCanvas` decorator (`.storybook/preview.tsx`).
- **Forbidden:** `parameters.layout: 'centered'` or `'padded'` — lint-enforced; defeats full-width enforcement.
- A `max-sm:w-full` primitive MUST visibly fill the `<640` viewport in the Storybook canvas. If
  it does not, the canvas is masking a layout defect — fix the story setup, not the component.

### 27.2 — Proof requirements

`tsc=0` / `lint=0` / `build-storybook` are baselines, **never proof**. A Storybook/UI cell is
PASS ONLY when:

1. The story renders in a browser at the specified viewport × locale (not just "builds").
2. The rendered output is visually inspected or machine-asserted against the acceptance criteria.
3. Evidence is recorded: `screenshots:assert` PNG/JSON artifacts per cell (uk@320/375/390 mandatory).

### 27.3 — What `screenshots:assert` does and does NOT prove

`scripts/check-stories-rendered.mjs` machine-checks five assertions per cell:

| Assertion | What it checks | Reliable? |
|---|---|---|
| (a) No horizontal overflow | `scrollWidth > clientWidth` at the viewport | ✅ Reliable |
| (b) Form controls full-width | `SelectTrigger`, `TabsList`, form `input` elements fill their parent at `<640` | ✅ Reliable for those selectors |
| (c) No render failure | Error-boundary screen, blank canvas, missing router/provider | ✅ Reliable for known error patterns |
| (d) Text buttons full-width | Every visible `[data-slot="button"]:not([data-icon-only])` (excluding `[data-slot="button-group"]` members) fills its parent at `<640` — including text CTAs inside open overlays | ✅ Reliable for those selectors (Task 421) |
| (e) Open popups = bottom sheet | Every visible open overlay content slot (`dialog-content`, `sheet-content` except `data-side="left"`, `select-content`, `popover-content`, `dropdown-menu-content`, `navigation-menu-popup`) is edge-to-edge full-width and bottom-anchored at `<640` | ✅ Reliable for those selectors (Task 421) |

**What `screenshots:assert` does NOT detect (requires manual visual QA):**

| Gap | Description | Manual QA gate |
|---|---|---|
| Overflow-hidden masking | `overflow-hidden` hides a defect — no overflow but content clipped | §24.4 |
| Inaccessible table columns | Columns off-screen at specific viewport but parent not overflowing | §25.1 |
| Wide-desktop sparsity | Whitespace waste at 1920/2560 — no whitespace detector | §4, §8 |
| Labels behind sticky/fixed layers | z-index collision hiding content | §22.3 z-index |
| Visually broken but non-overflowing | Layout broken but `scrollWidth` not exceeded | General |

**These gaps MUST be covered by manual visual QA** and recorded as `OWNER QA REQUIRED`
in the session log for any task touching these surfaces.

### 27.4 — Error screen = FAIL

A screenshot of a Storybook error boundary (`sb-show-errordisplay`, blank canvas, "invariant
expected app router") is a FAILED render — it is NOT proof of any kind. The cell must be
re-rendered after the root cause is fixed before it can contribute to PASS evidence.

### 27.5 — PASS / FAIL per cell (story × viewport × locale)

**PASS:**
- Story renders without error (27.4 not triggered).
- No horizontal overflow at the viewport.
- Full-width form controls at `<640` (machine-checked).
- `screenshots:assert` exit 0 for the cell.
- uk@320/375/390 cells explicitly passed (mandatory stress cells).

**FAIL:**
- Render error / error-boundary screen.
- Any `scrollWidth > clientWidth` overflow.
- Form control (SelectTrigger / TabsList / input) not full-width at `<640`.
- Cell not run — untested cells are NOT PASS; mark `OWNER QA REQUIRED`.
- `screenshots:assert` exit 1 for the cell.
