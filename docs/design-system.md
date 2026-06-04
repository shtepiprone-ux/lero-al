# Global Responsive Design System Contract — v1

**Status:** CANONICAL RULE LAYER — single global source of truth for responsive layout, containers, spacing, typography, data surfaces, forms, overlays, and responsive QA across the **entire** lero-al app (public site + cabinet/auth + admin + shared primitives + all future surfaces). **Task 340 is rejected as an implementation path; execution is superseded by Task 344's graduated DS-1..DS-8 queue.**
**Created:** 2026-05-31 — Task 340 (Opus 4.7 orchestrator/architect).
**Supersedes:** the 7-width and 9-width verification canons previously listed in `docs/responsive-governance.md §1`, `docs/ui-rules.md §17`, and `docs/admin-ux-rules.md §14`. Those documents now INHERIT this contract (see "Document inheritance map" below).
**Source:** Owner-uploaded `issues.md` (2026-05-31, ~6100 lines) — "Create Global Responsive Design System Contract v1" + ADDENDUM (14-width × 4-locale canon supersedes 7/9-width canons). `issues.md` itself is not checked into the repo; this document is the canonical, repo-resident embodiment of its Sections 1–21 + ADDENDUM, reconciled against the already-shipped Sprint 28 primitives.

> **Governance status of this document.** This file is authoritative as the **rule layer** for future UI / layout / responsive / component work. However, 
> **Task 340's original delivery mechanism is NOT approved for execution**: the all-five-primitives Task 343 kickoff is frozen, and implementation now follows Task 344's graduated DS-1..DS-8 queue. Where a local doc disagrees with this contract, THIS contract wins and the local doc is to be corrected to point here. Pointer updates already applied:
> `responsive-governance.md`, `ui-rules.md §17`, `admin-ux-rules.md §14`, `rule-index.md`,
> `component-catalog.md`.

---

## Document inheritance map

| Doc | Relationship to this contract |
|---|---|
| `docs/design-system.md` (this file) | **Canonical rule layer.** Defines the global rules; implementation is superseded by Task 344's DS-1..DS-8 queue. |
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
| `/admin/users` (+`/new`,`/[id]`) | `AdminUsersTable` | AdminPageShell | raw `<table>` | `tableAtLg`; `[id]` = detailLayout | 4 |
| `/admin/support`,`/inquiries`,`/inquiries/sales`,`/inquiries/support` | `AdminSupportManager`, inquiries managers | mixed | raw `<table>` | `tableAtLg` | 4 |
| `/admin/reports` | `AdminReportsManager` | mixed | raw `<table>` | `tableAtLg` | 4 |
| `/admin/locations`,`/popular-locations`,`/companies`,`/property-types`,`/pages`,`/legal` | respective `*Manager` | mixed | raw `<table>` | `tableAtLg` / `nonTabular` | 5 |
| `/admin/currency` | `AdminCurrenciesManager`,`AdminExchangeProvidersManager` | mixed | raw `<table>` + custom tabs | `tableAtLg` + Tabs primitive | 5 |
| `/admin/email-templates`,`/footer`,`/settings`,`/permissions` | respective managers | mixed | forms / lists | `formLayout` / `nonTabular` | 5 |

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
