# Task 918 — The listing card rebuilt on the owner's reference (grid and list), one price colour rule everywhere

**Sprint 89** (`tasks/Sprints/Sprint_89_The_Listing_Card_Rebuilt_On_The_Owners_Reference.md`) · **P1** · **QA profile Q4**
· Executor: Sonnet via `.claude/skills/execute-task/SKILL.md`. Evidence goes to `docs/sessions/evidence/task918/`.

> **Start gate.** Do not start until **912** (Sprint 88), **794** (Sprint 71, the listing-page gallery, D88-5), **741
> Revision 3** (Sprint 46, kickoff §17; superseded Revision 2 on 2026-10-04) and **857** (Sprint 78) are `APPROVED` and committed. All four edit files this task rewrites (Sprint 89 → Execution order). At I0, check each one
> in `docs/backlog-archive.md`. If any is not archived as approved, return `BLOCKED — START GATE` and make no write.
>
> **Amended 2026-10-04 (owner D89-10, Task 741 O46-2 rows 1–2 returned):** one listing card for both layouts, with one
> source per part, no literal visual value, one secondary colour, and a parity proof. **§16 is binding.** Where §3–§15
> differ from §16, §16 wins. The executor runs its own GR-7 audit before the first write (§16.6).
>
> **Amended 2026-10-03 (917 review):** owner decision **D89-9**: the struck old price sits **above** the current price
> everywhere, on the card, the listing-page price block, the contact card and the admin, through one shared
> `MantineListingPrice`. **857 Revision 8** (R56) removed the listing card and the price from `ListingPreviewDialogView`,
> so that dialog is no longer in this task. 857 stays a start gate because this task edits its `AdminListingsView` and
> its listings route.
> **Amended 2026-10-03 (912 review 4, owner return; 912 kickoff §20):** the D89-7 colour on the **listing page** is built
> in **912**. It adds the token `theme.other.priceColor.regular` (`#111111`, owner, 2026-10-03) and `MantineListingPrice`
> renders the price in that token when not reduced and in `brand` when reduced. 918 **consumes** that rule for the card and
> admin through the same component and token. It does not add another colour value, and R17 is reduced to nothing on
> the colour side.
>
> **Amended 2026-10-03 (912 review 2, owner return; 912 kickoff §18.7):** **912 Revision 2 creates
> `MantineListingPrice`** (`size="xl"`, props `price`, `priceOld`, `trailing`, `ownerCurrency`), its Story
> `Patterns/Mantine/ListingPrice` and the manifest entry, and moves the detail block and the contact card onto it
> (struck original price above). This task therefore **extends** the pattern: it adds `lg`/`sm`, the D89-7 colour, and
> the card and admin consumers. R17 shrinks to the D89-7 colour on those two blocks, and §10.1 items 3 and 8 read
> "extend". The GR-0 receipt for the price block becomes `EXTEND`. The converted-currency line is labelled
> `listing.price_in_owner_currency` (owner: *"Ціна у валюті власника"*); `listing.original_price` no longer exists.
> After the gate, re-read every line reference below against the tree. Where the tree differs, the tree wins; record
> the difference.

## 1. Mode and task type

`TASK DESIGN` → implementation task. Types: **UI / Component (current Mantine path)** + **Storybook / Visual Proof**.
This is a material restyle of a migrated pattern, `MantineListingCardPattern`, and its data mapper `ListingCard`. It
adds one dependency (`@solar-icons/react`, D89-4). It touches the critical-flow rows "Listing card rendering"
(`docs/critical-flow-registry.md:63`) and "Listings display — price" (`:62`), hence **Q4**.

## 2. Objective

Rebuild the public listing card, in both layouts, on the owner's reference (`docs/tailadmin-style-reference.md` §6w):
- the photo carries the deal-type or status badge, the "new" / "price reduced" badges, the favorite button and the
  photo count;
- the body is a property-type tile beside the title and address, followed by feature chips with Solar icons;
- the footer holds the price block at left (Rozetka style, D89-3) and the ID and date at right.

No information or capability is lost (D89-1). The price colour rule applies on the card, the listing page (D89-7) and every admin surface that shows a listing price (D89-8): dark when not reduced, coral (`brand`) with the struck old price when reduced.

## 3. Verified context

### 3.1 Facts (Opus, 2026-10-02, working tree, `win32`)

| # | Label | Fact | Evidence |
|---|---|---|---|
| F1 | FACT | `MantineListingCardPattern` (406 lines) owns both layouts. Grid: photo section with badges (top-left), overlay, photo count (bottom-right) and favorite slot (`:310-339`), then a `Stack p="sm"` with type label `xs dimmed`, title `h3 fw 600 size sm`, location with `MapPin`, the bordered feature row, the price (`fw 700 md brand`, old price `xs dimmed line-through` beside it), the original-price / per-m² row, and `footerActions` (`:341-389`). There is an optional `onContact` CTA section (`:391-403`). List: photo left with badges and photo count (`:183-205`); info column with a type label + inline favorite row, title, price block, features and a location + footer row (`:207-292`). | `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` |
| F2 | FACT | `ListingCard` maps data in both branches: badges via `getBadges` (`:70-102`, closed statuses return early with only a status badge), conversion and `displayPriceOld` (`:117-130`), type label `` `${t(listing_type)} · ${t(property_type_*)}` `` (`:207`, `:296`), features via `getCardFeatures` + `ListingFeatureIcon` (`:162-165`, `:254-257`), per-m² string (`:167`, `:259`), and footer ID copy + date (`:174-186`, `:264-276`). | `src/modules/listings/components/ListingCard.tsx` |
| F3 | FACT | `ListingFeatureIcon` maps `PresentationIcon` (`home, bed-double, bath, area, building, layers, calendar`) to `lucide-react` components. Consumers: `ListingCard`, `MantineListingCardPattern` (doc only), `ListingDetailView`, and its own Story (857 Revision 8 removed it from `ListingPreviewDialogView`; re-verify at I0). | `src/modules/listings/components/ListingFeatureIcon.tsx:1-12`; whole-`src` search for `ListingFeatureIcon` |
| F4 | FACT | `ListingCard` consumers: `ListingsShellView.tsx:131` (grid) and `:148` (list), `FeaturedListingsView.tsx:94`, `LatestListingsView.tsx:66`, `RecentlyViewedGridView.tsx:70`, `SimilarListingsView.tsx:62`, `FavoritesShell.tsx:205`. No other file renders `MantineListingCardPattern` once 857 Revision 8 lands (R56 removes it from `ListingPreviewDialogView`; re-verify at I0). | whole-`src` search for `<ListingCard` and `MantineListingCardPattern` |
| F5 | FACT | Theme keys used by this design exist: spacing `xs 8 · sm 12 · md 16 · lg 20` (`theme.ts:654-670`); fontSizes `xs 12 · sm 14 · md 16 · lg 18 · xl 20` (`:698-706`); radius `sm 4 · md 6` (`:674-679`); shadow `xs` (`:720`); colours `green`, `orange`, `sale`, `blueLight`, `purple`, `yellow`, `gray` (gray.0 `#f9fafb`, gray.1 `#f2f4f7`) (`colors:` line); `theme.other.iconSize` `standard 16 · decorative 24` (`:48-62`); Badge theme entry (`:1230+`, default `size sm` 12px/500, radius pill, variant light). | `src/design-system/mantine/theme.ts` |
| F6 | FACT | `AppImage variant="listing"` frames at 4:3 (`AppImage.module.css:85-87`). The reference is 3:2. **Kept at 4:3** (preserve; LCP `sizes` hints and Sprint 74 width contracts depend on it). | that file |
| F7 | FACT | The card CSS module carries Task 734's reserved N1 hits (4 `transition`, 8 hover `box-shadow`) and `.card { box-shadow: none }` (`MantineListingCardPattern.module.css:36-38, 85-92`). | that file |
| F8 | FACT | `@solar-icons/react` 2.3.2: MIT, `"sideEffects": false`, peer `react >= 16.8`, per-style subpath imports (`@solar-icons/react/broken`, `/bold-duotone`, …), component names end in `Icon` (README). | `npm view @solar-icons/react` |
| F9 | FACT | `MantineTooltip` opens as a bottom sheet below 640px through an `onClick={openDrawer}` wrapper around its children (`MantineTooltip.tsx:53-70`). Interactive nodes inside the card link stop navigation with `e.preventDefault(); e.stopPropagation()` (`FavoriteButton.tsx:72-73`, `MantineCopyIdButton.tsx:32-33`). | those files |
| F10 | FACT | Stories rendering the card: `Patterns/Mantine/ListingCardPattern` (direct import, `skipCanvas` + `StoryPageGutter`, `:9,14,22,212`), `Mantine/Primitives/ListingCard` (`MantineStoryShell`, `:9,26`), `Patterns/Mantine/ListingCardTrack` (`StoryPageGutter`, `:7`). `Mantine/Primitives/ListingFeatureIcon` (`MantineStoryShell`). `Mantine/Primitives/Badge` (`MantineStoryShell`; carries a `style` object at `:79`). `Patterns/Mantine/ListingDetailView` (default canvas; renders feature icons). | those files |
| F12 | FACT | The listing page renders the price in `brand` unconditionally twice: the detail block `<Text fw={700} size="xl" c="brand">` (`MantineListingDetailPattern.tsx:204`), which shows the struck `priceOld` beside it only when the view passes it (`ListingDetailView.tsx:289`, gated on `isPriceReduced`), and the contact card `<Text fw={700} size="xl" c="brand">` (`MantineListingContactPattern.tsx:153`), to which **912** adds `priceOld` below the price (D88-1 layout). Their Stories: `Patterns/Mantine/ListingDetailPattern` (`StoryPageGutter`, `:5, :268`) and `Patterns/Mantine/ListingContactPattern` (`StoryPageGutter`, `:9, :84`). Both patterns are `manifest:yes story:yes`. Their surface census (13 unmigrated nodes in `ListingDetailView`/`ListingContact`, owners listed, five filed as **913**) is in 912 §3.1. This task edits only the two pattern files, not those surfaces. | those files; 912 kickoff F4, F12, §3.1 |
| F13 | FACT | Admin price surfaces, none of which reads `price_old`: `AdminListingsView.tsx:159` (table cell, `Text size="sm" fw={500}`) and `:292` (phone card), data from `src/app/admin/listings/page.tsx:60-61` (select without `price_old`); (`ListingPreviewDialogView` showed a price through the card pattern at design time; 857 Revision 8, R56, removes it, so it is not a price surface); `AdminDashboardRecentListings.tsx:146-148` (row, `Text size="sm" fw={500} c="gray.8"`) and `:213-215` (dialog), data from `src/modules/admin/dashboard/queries.ts:254` (select without `price_old`), `:368` (mapper) and `types.ts:86` (`RecentListingRow`). `/admin/listings/[id]/preview` computes `isPriceReduced` (`preview/page.tsx:77`) and renders `ListingDetailView`, so it is covered by the detail-pattern change. `AdminDashboardRecentListings` has 0 `className`, a manifest entry (`mantine-migration-scope.json:117`) and its own Story `Patterns/Mantine/AdminDashboardRecentListings`. `AdminListingsView`, `ListingPreviewDialogView` and the listings route are 857's uncommitted work at design time. | those files; `git status` |
| F11 | FACT | No new i18n key is needed: the deal type uses `listing.sale` / `listing.rent` (existing `t(listing.listing_type)`), the tile label uses the existing `listing.property_type_*`, ID/date/per-m² keys already exist. `messages/*.json` are dirty with 857's work; **this task must not edit them**. If the executor finds a string is needed, return `BLOCKED — I18N` rather than edit a dirty locale file. | `ListingCard.tsx:207, 296`; `git status` |

### 3.2 GR-1 census (run at design time, re-run at I0)

```powershell
node.exe scripts\check-surface-census.mjs --surface src\modules\listings\components\ListingCard.tsx
```

`GR-1 CENSUS COMPLETE — 7 nodes; tier1 7 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none.`
The nodes are `ListingCard`, `MantineCopyIdButton`, `MantineListingCardPattern`, `AppImage`, `FavoriteButton`,
`ListingFeatureIcon` and `MediaPlaceholder`, all `manifest:yes story:yes`. New nodes this task adds to the surface:
`ThemeIcon`, `Badge` (Mantine primitives), `MantineTooltip` (pattern, enrolled, own Story) and the Solar icon
components (library). Re-run the census after the change; every node must stay `manifest:yes story:yes`.

**Admin and listing-page surfaces (R17, R18).** These files are edited only for the price colour / price block. After the start gate, run the census on each:

```powershell
node.exe scripts\check-surface-census.mjs --surface src\components\admin\AdminListingsView.tsx
node.exe scripts\check-surface-census.mjs --surface src\components\admin\AdminDashboardRecentListings.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineListingDetailPattern.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineListingContactPattern.tsx
```

At design time, `AdminDashboardRecentListings` is `manifest:yes` (`mantine-migration-scope.json:117`) with 0 `className` and its own Story. `AdminListingsView` is 857's, which enrols it with its own Story. The two patterns are `manifest:yes story:yes` (912 §3.1). Paste each census into the session log and emit one `GR-1 CENSUS COMPLETE` receipt per surface. **If any node is unmigrated (no manifest entry and no Story of its own), return `BLOCKED — CLAUSE 16d` with the node list and make no write to that surface.**

### 3.3 Visual source map

| Visible artifact/state | Component/markup now | Disposition | Evidence |
|---|---|---|---|
| Card chrome | `Card withBorder radius="md"`, `.card{box-shadow:none}` | **changed** → no border, `shadow="xs"` (§6w named exception to §5); premium gold border and archived dim preserved | F1, F7 |
| Photo frame, overlay, favorite, photo count | `Card.Section` + slots | preserved (positions unchanged) | F1 |
| Top-left badges | `getBadges` → `Badge filled` | **changed** → deal-type badge first for open listings (D89-6); closed statuses unchanged | F2 |
| Type label line | `Text xs dimmed` | **removed** (D89-6), replaced by the tile | F1 |
| Property-type tile | — | **new**: `ThemeIcon` + Solar `bold-duotone` + `MantineTooltip` | §3.4 |
| Title / address | `h3 sm 600` / `MapPin + xs dimmed` | **changed** → `md 500` / `sm dimmed`, no pin icon | §6w |
| Feature row | bordered `Group` of icon + value | **changed** → `Badge variant="default"` chips with Solar `broken` icons | §6w |
| Price block | price beside struck old | **changed** → D89-3 Rozetka block in the footer | D89-3 |
| Original-price / per-m² | row under price | moved into the footer price block, preserved | D89-1 |
| ID copy + date | `footerActions` node | moved to the footer's right, preserved | D89-5 |
| `onContact` CTA section | optional | preserved, after the footer | F1 |

### 3.4 Canonical UI decision record

| Visible artifact | Search and inspected paths | Canonical Mantine Story/source | Disposition | Token path and registration |
|---|---|---|---|---|
| Card pattern (both layouts) | `MantineListingCardPattern.tsx`, `ListingCardPattern.stories.tsx`, `ListingCard.stories.tsx`, `ListingCardTrack.stories.tsx` | `Patterns/Mantine/ListingCardPattern` (direct import) | **extend** (restyle the owner) | theme keys per §3.5; already enrolled |
| Feature chip | Badge theme entry, `Badge.stories.tsx`, the card's feature row | `Mantine/Primitives/Badge` | **extend** the Badge Story with the chip state (`variant="default"`, `radius="sm"`, Solar `leftSection` at `iconSize.standard`) | theme Badge entry; no theme edit |
| "New" badge beside the deal badge | `getBadges`, Badge Story | `Mantine/Primitives/Badge` | **extend**: "new" moves to `variant="white" color="green"` so it differs from the green "Оренда" badge. Opus decision; the owner can return it in the matrix. Add the white-variant row to the Badge Story. | theme `green` |
| Property-type tile | `ThemeIcon` theme entry (`theme.ts:1191-1220`), Mantine ThemeIcon | Mantine `ThemeIcon` (native) | **compose**: `ThemeIcon variant="filled" color="gray.1" c="brand.6" size="xl" radius="md"`, inside `MantineTooltip` | theme ThemeIcon `xl`, `iconSize.decorative` |
| Tooltip on the tile | `MantineTooltip.tsx`, its Story | `Patterns/Mantine/MantineTooltip` (verify the exact title at I0) | **reuse**; **extend** only if §10.5's touch behaviour needs a prop, with its Story | — |
| Feature icons | `ListingFeatureIcon.tsx` + Story | `Mantine/Primitives/ListingFeatureIcon` | **extend**: the same single map moves to Solar `broken` (D89-4, §26) | `iconSize.standard` |
| Price block (card footer, admin cells) | card price markup (F1), `AdminListingsView.tsx:159,292`, `AdminDashboardRecentListings.tsx:146,213`, the detail and contact patterns (F12) | none: the same price/old-price markup is written separately in each place | **create canonical** `MantineListingPrice` (`src/design-system/mantine/patterns/MantineListingPrice.tsx`), the single owner of the D89-7 colour rule: props `price: string`, `priceOld?: string`, `size: 'sm' \| 'lg' \| 'xl'`, `trailing?: ReactNode`. Renders `Stack gap={0}`: [old price `fz="xs"` `c="dimmed"` `td="line-through"`] above a `Group gap="sm" align="baseline" wrap="wrap"` holding the current price `fw={700}` `fz={size}` (`c="brand"` when `priceOld` is present, default text colour otherwise) and `trailing` (for example the detail page's per-m² text). Own Story `Patterns/Mantine/ListingPrice` with both states at all three sizes and one `trailing` row; enrolled in `scripts/mantine-migration-scope.json`. Consumed by the card footer (`lg`), the listing-page price block and the contact card (`xl`, D89-9), and the four admin sites (`sm`). | theme `brand`, `fontSizes.sm/lg/xs` |
| Tile icons per property type | — (no map exists) | `ListingFeatureIcon`'s file | **extend**: add a `PropertyTypeIcon` export in the same file (one owner for listing icons), Solar `bold-duotone`, keyed by the `property_type` enum | `iconSize.decorative`; Story row added to `ListingFeatureIcon.stories.tsx` |

`GR-0 CANONICAL REUSE PREFLIGHT — request: listing card restyle (both layouts) + feature chips + property-type tile + Solar icons + one price block for card and admin (MantineListingPrice, CREATE after the search found the same markup written separately in five places and no shared owner); semantic queries: listing card, feature row, chip, badge variant, icon tile, ThemeIcon, tooltip, icon map; inspected candidates: MantineListingCardPattern.tsx + patterns-mantine-listingcardpattern--default, ListingCard.tsx + mantine-primitives-listingcard--default, ListingCardTrack.stories.tsx, Badge.stories.tsx + theme Badge entry, theme ThemeIcon entry, MantineTooltip.tsx, ListingFeatureIcon.tsx + mantine-primitives-listingfeatureicon--default; decision: EXTEND (+ CREATE for the price block only); selected canonical owner: src/design-system/mantine/patterns/MantineListingCardPattern.tsx (+ ListingFeatureIcon.tsx for icons, Badge Story for the chip state, new MantineListingPrice for the price block); Mantine/TailAdmin token path: src/design-system/mantine/theme.ts keys in §3.5, docs/tailadmin-style-reference.md §6w; new hardcoded visual values: NONE; rationale: every part maps to an existing theme key or native Mantine prop, and each owner already has its canonical Story.`

`GR-3a STORY PREFLIGHT — MantineListingCardPattern × grid/list restyle, reduced/not-reduced, open/closed/premium/archived; canonical candidates: patterns-mantine-listingcardpattern--default, mantine-primitives-listingcard--default, patterns-mantine-listingcardtrack--grid; direct-import evidence: src/stories/patterns/mantine/ListingCardPattern.stories.tsx:9, src/stories/mantine/primitives/ListingCard.stories.tsx:4, src/stories/patterns/mantine/ListingCardTrack.stories.tsx:3; toolbar coverage: locale=Storybook toolbar locale global, viewport=Storybook toolbar viewport; decision: EXTEND; target: patterns-mantine-listingcardpattern--default (+ the two ListingCard Stories as composition rows); rationale: the card states are missing variants of existing Stories, so no new card Story file is created.`

`GR-3a STORY PREFLIGHT — MantineListingPrice × sm/lg, reduced/not reduced; canonical candidates: NONE (no Story imports a shared price block; the card, detail and contact Stories render their own price markup); direct-import evidence: NONE; toolbar coverage: locale=Storybook toolbar locale global, viewport=Storybook toolbar viewport; decision: CREATE; target: Patterns/Mantine/ListingPrice (new file src/stories/patterns/mantine/ListingPrice.stories.tsx); rationale: a new shared pattern needs its own canonical Story before the card and admin consume it (16c).`

### 3.5 Type-scale table (GR-3c)

No row reaches 24px, so no breakpoint step is required. Each value is the same at every width.

| Element | Role | base | sm | md | lg | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| Title (`h3`, lineClamp 2) | card title | 16 | 16 | 16 | 16 | `fz="md"`, `fw={500}` | §6w 16/500 |
| Address | label | 14 | 14 | 14 | 14 | `fz="sm"` `c="dimmed"` | §6w 14/400 |
| Feature chip text | label | 12 | 12 | 12 | 12 | theme Badge `sm` | §6w 12; theme Badge entry |
| Photo badges | label | 12 | 12 | 12 | 12 | theme Badge `sm` | theme Badge entry |
| Current price (card footer) | emphasized body | 18 | 18 | 18 | 18 | `MantineListingPrice size="lg"` → `fz="lg"` `fw={700}` | D89-3 (large bold) |
| Current price (listing page block, contact card) | emphasized body | 20 | 20 | 20 | 20 | `MantineListingPrice size="xl"` → `fz="xl"` `fw={700}` | unchanged from today (`MantineListingDetailPattern.tsx:204`, `MantineListingContactPattern.tsx:153`) |
| Current price (admin cells) | body | 14 | 14 | 14 | 14 | `MantineListingPrice size="sm"` → `fz="sm"` `fw={700}` | admin cell body size today (`AdminListingsView.tsx:159`) |
| Old price (struck) | label | 12 | 12 | 12 | 12 | `fz="xs"` `c="dimmed"` `td="line-through"` | D89-3 (small grey) |
| Per-m² / original price | label | 12 | 12 | 12 | 12 | `fz="xs"` `c="dimmed"` | current card |
| ID / date | label | 12 | 12 | 12 | 12 | `fz="xs"` `c="dimmed"` | current card |

### 3.6 Width contract (GR-3b)

The card is fluid inside its production parent. `MantineListingCardTrack` gives it its width (Sprint 74 D74-1…D74-3;
`ListingsShellView.tsx:131` grid, the rails in `FeaturedListingsView.tsx:94` and the others). The list row is
full-width in `ListingsShellView.tsx:148`. Stories must reproduce this. `ListingCard` Stories already render through
`MantineListingCardTrack` (`ListingCard.stories.tsx:5`). The `ListingCardPattern` Story must render its grid cards
inside the same track and its list rows full-width. It must not use a fixed `w`/`maw`, a `style` object or a viewport
pin.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| R1 | D89-4, §26 | `@solar-icons/react` is a dependency (exact installed version recorded). Icons are imported by name from style subpaths only. | P0 | `package.json` diff; import grep | Confirmed |
| R2 | D89-4 | `ListingFeatureIcon` maps every `PresentationIcon` to a Solar `broken` icon. `lucide-react` is no longer imported in that file. Consumers are unchanged at the call site. | P0 | grep; ListingFeatureIcon Story | Confirmed |
| R3 | D89-6 | `PropertyTypeIcon` (same file) maps all 10 `property_type` values (`validations/index.ts:12`) to Solar `bold-duotone` icons; a missing key is a type error. | P0 | typecheck; Story row with all 10 | Confirmed |
| R4 | §6w | Card chrome: no border, `shadow="xs"`, `radius="md"` in both layouts. The premium gold border, archived dimming and existing hover are preserved. | P1 | computed style at 1440 | Confirmed |
| R5 | D89-6 | Open listings show the deal-type badge first on the photo (Оренда `green`, Продаж `orange`, `variant="filled"`). Closed/archived/expired listings keep today's single status badge and overlay, unchanged. "New" uses `variant="white" color="green"`. "Price reduced" is unchanged. | P0 | Stories + smoke test | Confirmed (white variant = Opus decision) |
| R6 | D89-6 | Body head row: tile (44px, gray.1, brand icon at 24px) beside a column of title and address; the type text line is removed. The tile has `aria-label` = the translated property type and shows it in `MantineTooltip`. | P0 | Story; a11y query in smoke test | Confirmed |
| R7 | §6w | Features render as chips: `Badge variant="default" radius="sm"`, a Solar icon at 16px in `leftSection`, in a wrapping `Group gap="xs"`. | P0 | Story | Confirmed |
| R8 | D89-3, D89-7 | Footer price block, rendered by `MantineListingPrice size="lg"` (§3.4), reduced (`price_old > price`): the old price `xs` dimmed struck on its own line, then the current price `lg 700` in `brand`. Not reduced: the current price `lg 700` in the default text colour. Per-m² and original-currency lines follow in `xs` dimmed. | P0 | Story both states; smoke test | Confirmed (D89-7) |
| R9 | D89-5 | Footer right: the ID copy button above the date, right-aligned. In the footer, the price block and the ID/date column share a row and wrap to two rows when they do not fit (GR-3b). | P0 | Story at 320/1440 | Confirmed |
| R10 | §6w | Footer is a `Card.Section withBorder` with `bg="gray.0"` `px="lg" py="md"` in grid. In list, the info column ends with the same footer: top border, gray.0 background, same contents. | P1 | computed style | Confirmed |
| R11 | D89-2 | The list layout has the same parts in the same order (badges on the photo, head row, chips, footer). The favorite stays inline at the end of the head row (not absolutely positioned). | P0 | Story list section | Confirmed |
| R12 | D89-1 | Nothing is lost: price per m², original-currency price, ID copy, date, photo count, favorite, overlay, premium, archived, the "new" and "price reduced" badges, the `onContact` slot, `data-track` / `data-listing-slug` attributes, `onBeforeNavigate`. | P0 | smoke tests + Stories | Confirmed |
| R13 | GR-3a, 16c | The Stories in §3.4 are extended with every state in §13.3. The only new Story file is `ListingPrice.stories.tsx` for the new pattern. The Badge Story's `style` object (`:79`) is replaced with Mantine props, because the Story is changed (GR-3b). | P0 | Story diff; GR receipts | Confirmed |
| R14 | GR-0 | No new raw px/rem/hex, inline `style`, or new CSS rule with a literal value. Rules the restyle makes dead in `MantineListingCardPattern.module.css` (and `ListingCard.module.css` `.featureIcon`, if unused) are deleted. Task 734's reserved hits in that file that this task deletes are listed in the session log; they are not re-added elsewhere. | P0 | `check:design-tokens` + diff | Confirmed |
| R15 | Q4, critical flow | `ListingCard.smoke.test.tsx` and `MantineListingCardPattern.smoke.test.tsx` assert the new structure: deal badge, tile `aria-label`, chips, price block both states, ID/date, and every R12 item. Both are red against the pre-change tree first (two-armed). | P0 | vitest transcripts | Confirmed |
| R17 | D89-7, D89-9 | On the listing page, `MantineListingDetailPattern` (`:203-217`) and `MantineListingContactPattern` (`:152-160`, after 912) render their price through `MantineListingPrice size="xl"`: the struck old price above, the current price dark or coral. The detail page passes its per-m² text as `trailing`. The original-currency line stays below the price in both. Nothing else in either pattern changes. | P0 | computed colour + box order in both Stories, both states; smoke assertion | Confirmed |
| R18 | D89-8 | Admin: `src/app/admin/listings/page.tsx` and `src/modules/admin/dashboard/queries.ts:254` select `price_old`; `RecentListingRow` and the listings row type carry `price_old: number \| null`. `AdminListingsView` (cell and phone card) and `AdminDashboardRecentListings` (row and dialog) render `MantineListingPrice size="sm"` (`ListingPreviewDialogView` shows no price after 857 Revision 8). `priceOld` is passed only when `isPriceReduced(price, price_old)` holds. | P0 | Stories + smoke assertions | Confirmed |
| R19 | GR-0 | One predicate: `isPriceReduced(price, priceOld)` (`price_old != null && price < price_old`) is exported from `src/modules/listings/domain/listingSemanticHelpers.ts` with a unit test. `ListingCard`, `[slug]/page.tsx:221`, `preview/page.tsx:77` and the admin mappers use it. Inline copies of the predicate are removed. | P1 | grep + unit test | Confirmed |
| R16 | §10.5 | Tapping the tile below 640px opens the tooltip sheet and does not navigate. At or above 640px, hover/focus shows the tooltip and a click on the tile does not navigate. | P1 | rendered check at 390 and 1440 | Confirmed |

## 5. Assumptions and open questions

- **A1, resolved by D89-7.** A non-reduced price is dark; a reduced one is coral (`brand`), on the card, the listing page
  and the admin (D89-8).
- **A2.** "New" `variant="white" color="green"` resolves the clash with the green "Оренда" badge. Opus decision with
  theme provenance; returnable in the matrix.
- **A3.** The image stays 4:3 (F6).
- **A4.** Theme font unchanged (§6w).
- **Open (owner, not blocking).** A site-wide `lucide-react` → Solar migration and a gate for §26 are not filed. The
  owner decides whether to file them.

## 6. Pre-read rule bundle

1. `docs/golden-rules.md`: GR-0, GR-1, GR-2, GR-3, GR-3a…GR-3f, GR-4 (receipts required)
2. `docs/agent-contract.md` (3, 7, 11, 13, 16, 16a–16d)
3. `docs/mantine-responsive-design-system.md`: §7 (responsive), §8 (Storybook proof), §18 (pitfalls), §25 (Tooltip),
   §26 (Solar icons)
4. `docs/tailadmin-style-reference.md`: §2, §3, §5, §6w
5. `docs/component-rules.md` (container/presentational split)
6. `docs/ui-rules.md` (routing only)
7. `docs/qa-rules.md`, `docs/qa-profiles.md` (Q4)
8. `docs/critical-flow-registry.md` rows `:62`, `:63`
9. `docs/storybook-governance.md` (enrolment and coverage gates)
10. The Sprint 89 plan and this kickoff.

## 7. Scope

- `package.json`, `package-lock.json` (add `@solar-icons/react`)
- `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` and `.module.css`
- `src/modules/listings/components/ListingCard.tsx` and `ListingCard.module.css` (only rules made dead)
- `src/modules/listings/components/ListingFeatureIcon.tsx` (Solar map + `PropertyTypeIcon`)
- `src/design-system/mantine/patterns/MantineTooltip.tsx` + its Story, **only if** §10.5 needs an extension
- Stories: `src/stories/patterns/mantine/ListingCardPattern.stories.tsx`, `src/stories/mantine/primitives/ListingCard.stories.tsx`,
  `src/stories/patterns/mantine/ListingCardTrack.stories.tsx` (re-render only; edit only if a fixture needs a new field),
  `src/stories/mantine/primitives/ListingFeatureIcon.stories.tsx`, `src/stories/mantine/primitives/Badge.stories.tsx`
- Fixture `src/stories/fixtures/cardListingData.fixture.ts` (reduced and non-reduced listings, both deal types, all 10
  property types across the Story rows)
- Tests: `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx`, `MantineListingCardPattern.smoke.test.tsx`
  (locate it at I0)
- `src/design-system/mantine/patterns/MantineListingPrice.tsx` (new) + `src/stories/patterns/mantine/ListingPrice.stories.tsx` (new) + `scripts/mantine-migration-scope.json` entry + `patterns/index.ts` export
- `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` and `MantineListingContactPattern.tsx`: the price block only, now `MantineListingPrice size="xl"` (R17); their Stories show a reduced and a non-reduced price (extend if a state is missing after 912)
- Admin (R18): `src/app/admin/listings/page.tsx`, `src/components/admin/AdminListingsView.tsx`, `src/components/admin/AdminDashboardRecentListings.tsx`, `src/modules/admin/dashboard/queries.ts`, `src/modules/admin/dashboard/types.ts`, and the Stories `AdminListingsView.stories.tsx`, `AdminDashboardRecentListings.stories.tsx` (a reduced fixture row in each)
- `src/modules/listings/domain/listingSemanticHelpers.ts` (+ its test), `src/app/[locale]/listings/[slug]/page.tsx:221` and `src/app/admin/listings/[id]/preview/page.tsx:77` (predicate only, R19)
- `docs/component-catalog.md` row for the card if it describes the old anatomy
- `docs/backlog.md` (state line) and the session log

## 8. Out of scope

- How `price_old` is written (**917**) and the card's `priceOld` predicate (**912**); this task consumes both.
- Card widths and track (Sprint 74).
- The detail page and admin layouts. They change only their **icons** (through `ListingFeatureIcon`) and their price
  **colour / price block** (R17, R18). Their other markup is not touched.
- Other `lucide-react` icons on the site (A4 open item). On the card itself, every icon must be Solar after this task:
  the camera of the photo count and any icon the pattern renders (§26 "one visual group").
- `messages/*.json` (F11). `theme.ts` gets exactly one change, the §16 R22 token `theme.other.layout.listingCardListThumb`; nothing else in it changes.

## 9. Current and required behavior

| Area | Current | Required |
|---|---|---|
| Grid card | border, flat; type text line; title 14/600; location with pin; bordered feature row; price + struck old side by side in the body; ID/date in the body | no border, `shadow xs`; deal badge on the photo; tile + title 16/500 + address 14; chips; footer section with the D89-3 price block (left) and ID/date (right) |
| List row | type text + favorite row; price above features; location + ID/date row | badges on the photo; head row tile + title/address + inline favorite; chips; footer row (price block left, ID/date right) |
| Icons | lucide | Solar (`broken` features, `bold-duotone` tile; photo-count camera Solar too) |
| Detail page / admin preview feature icons | lucide | Solar (same map) |
| Listing page price (detail block, contact card) | always `brand`; detail: old price beside, contact: old price below (912) | `MantineListingPrice size="xl"`: old price above, dark when not reduced, `brand` when reduced (D89-7, D89-9) |
| Admin prices (table, phone card, preview dialog, dashboard row and dialog) | dark `fw 500`, `price_old` not loaded | `MantineListingPrice size="sm"`: dark, or coral with the struck old price above (D89-8) |
| Closed / archived / expired | status badge + overlay; dimming | unchanged |

**Preserve:**
- the link wrapper, `data-track="listing_click"`, `data-listing-slug`, `onBeforeNavigate`;
- `FavoriteButton` behaviour and disabled state on closed listings;
- copy-ID behaviour;
- currency conversion and the original-price line;
- LCP `priority`/`layoutContext` on `AppImage`;
- every badge colour for statuses (741/886);
- premium styling;
- the `onContact` slot.

## 10. Implementation requirements

### 10.1 Order (GR-3 / clause 16c: component Story before composition)

1. Install `@solar-icons/react`. Record the version. Look up the real export names in
   `node_modules/@solar-icons/react/dist` for:
   - `broken`: bed, bath, area/scale, building, layers, calendar, home, camera;
   - `bold-duotone`: one icon per property type (apartment, house, room, land, commercial, office, garage, parking,
     warehouse, other).

   Write the chosen names into the session log. Never guess them (§26).
2. `ListingFeatureIcon.tsx` → Solar map + `PropertyTypeIcon`. Update `ListingFeatureIcon.stories.tsx` to show every
   feature icon and all 10 tile icons (inside a `ThemeIcon` as on the card).
3. `MantineListingPrice` + `ListingPrice.stories.tsx` (both sizes × both states), enrolled in
   `scripts/mantine-migration-scope.json`; `isPriceReduced` + its unit test in `listingSemanticHelpers.ts` (R19).
4. `Badge.stories.tsx`: add the chip state and the `white` variant row; replace the `:79` `style` object with Mantine
   props.
5. `MantineListingCardPattern`: rebuild both layouts per §3.3/§3.4/§3.5. New props, all optional so that existing
   callers keep compiling:
   - `dealBadge?: MantineListingCardBadge` (or the deal badge as the first entry of `badges` — pick one and document
     it);
   - `typeTile?: { icon: ReactNode; label: string }`;
   - `priceOld` keeps its meaning;
   - `isReduced` is derived from `priceOld` being present.

   Remove `typeLabel`'s rendering. Keep the prop accepted but unused only if a consumer still passes it, and say so in
   the session log.
6. Extend `ListingCardPattern.stories.tsx` with the §13.3 states, grid inside `MantineListingCardTrack`, list
   full-width.
7. `ListingCard.tsx`: map the new props. Deal badge: `t(listing.listing_type)`, `sale` → `orange`, `rent` → `green`,
   only for open listings. Tile: `PropertyTypeIcon` + `t(property_type_*)`. Leave the price predicate exactly as 912
   left it.
8. Listing page (R17): `MantineListingDetailPattern` and `MantineListingContactPattern` render `MantineListingPrice
   size="xl"` (old price above, D89-9); their Stories show both states.
9. Admin (R18): queries and types first, then `AdminListingsView` and
   `AdminDashboardRecentListings` and their Stories (a reduced fixture row each).
10. Tests (R15, plus an `isPriceReduced` unit test and an admin smoke assertion for a reduced row), two-armed.

### 10.2 Grid anatomy (top to bottom)

`Card padding={0} radius="md" shadow="xs"` (no `withBorder`)
- `Card.Section` photo: unchanged frame. Top-left `Box` badge stack = [deal badge] + [new] + [price reduced], or the
  single closed-status badge. Favorite top-right, photo count bottom-right (Solar camera), overlay for sold/rented.
- `Stack p="lg" gap="sm"`:
  - `Group gap="sm" wrap="nowrap" align="flex-start"`: tile, then `Stack gap={0}` with title and address
    (`truncate`).
  - chips `Group gap="xs" wrap="wrap"`.
- `Card.Section withBorder bg="gray.0" px="lg" py="md"`: `Group justify="space-between" align="flex-end" wrap="wrap"
  gap="xs"`.
  - Left `Stack gap={0}`: `MantineListingPrice size="lg"` (old price above, D89-7 colour), then the per-m² ·
    original-price line in xs dimmed.
  - Right `Stack gap={0} align="flex-end"`: ID copy, date.
- `onContact` section (unchanged), after the footer.

### 10.3 List anatomy

Photo left (unchanged width) with the same badge stack and photo count. Info column `Stack justify="space-between"`:
- the head row with the favorite inline at its end;
- the chips;
- the footer `Box` with top border and gray.0 background using Mantine props (`bg="gray.0"`; a top border through
  `Divider` or `Card.Section`-equivalent native means, never a literal);
- the same footer contents as in grid.

Below 640px, no section sits beside another (GR-3b): the footer's two columns wrap.

### 10.4 Styles

Every value comes from §3.5 or the theme keys named in §3.3/§3.4. Delete the CSS rules the restyle makes dead,
including `.metaRowBordered`, `.priceMetaRow`, `.locationIcon*` and the type-label rules, if unused after the change.
Check each with a grep before deleting. Add no CSS rule with a literal value. The resting shadow must measure as the
theme `shadow-xs` (computed `box-shadow`). If `.card { box-shadow: none }` blocks it, remove that declaration rather
than add another.

### 10.5 Tile tooltip inside a link

- At 390, tapping the tile opens the `MantineTooltip` sheet with the property-type name and does **not** navigate or
  call `onBeforeNavigate`.
- At 1440, hover and keyboard focus show the tooltip; a click on the tile does not navigate.

Precedent for stopping navigation: `FavoriteButton.tsx:72-73`. If `MantineTooltip`'s click wrapper (F9) prevents a
child guard from opening the sheet, **extend** `MantineTooltip` with an opt-in prop that guards the event itself, prove
it in its Story, and record it. Never add a card-local tooltip.

## 11. Positive and negative flows

**Positive:** `/uk/listings` grid at 1440 shows each card with the deal badge, tile, title, address, chips and the
footer; a reduced listing shows the old price struck above the red current price. Switching to list view shows the
same parts in a row. Clicking the card body opens the listing.

| Branch | Applicable? | Owner/source | Expected | Evidence |
|---|---:|---|---|---|
| No photo | Yes | `AppImage` → `MediaPlaceholder` | unchanged placeholder | Story row |
| No features | Yes | `getCardFeatures` empty | no chip row, no empty gap | Story row |
| Long title / address (it, sq) | Yes | lineClamp 2 / truncate | no overflow at 320 | GR-3b check |
| Closed (sold/rented) | Yes | `getBadges` early return, overlay | status badge + overlay, no deal badge, favorite disabled | Story + smoke |
| Archived / expired | Yes | `isListingArchived` | dimmed, status badge | Story |
| Premium | Yes | `isPremium` | gold border kept | Story |
| Currency conversion | Yes | `showConversion` | converted price + original line in the footer | smoke |
| `price_old <= price` | Yes | 912 predicate | no struck price, no reduced badge, dark price | smoke |
| Tile tap on touch | Yes | §10.5 | sheet opens, no navigation | rendered check |
| Validation / RLS / offline / concurrency | No | no data write | — | — |

## 12. Acceptance criteria

- **AC1 [R1, R2]** Given the changed files, when a read-only search runs for `lucide-react` in
  `ListingFeatureIcon.tsx`, `MantineListingCardPattern.tsx` and `ListingCard.tsx`, then it returns no hit. Solar icons
  are imported from style subpaths.
- **AC2 [R3]** Given `PropertyTypeIcon`, when typecheck runs, then a map missing any of the 10 `property_type` values
  fails to compile. The Story shows all 10.
- **AC3 [R4]** Given a grid card at 1440, then its computed `border-top-width` is 0 and its `box-shadow` equals the
  theme `shadow-xs` value; a premium card still shows the gold border.
- **AC4 [R5]** Given an open sale listing, then the first photo badge reads the translated "sale" text with the orange
  filled colour; for rent it is green. A sold listing shows only its status badge plus the overlay.
- **AC5 [R6, R16]** Given any card, then an element with `aria-label` equal to the translated property type exists.
  At 390, tapping it opens the tooltip sheet and the URL is unchanged.
- **AC6 [R7]** Given a listing with features, then each feature renders as a Mantine Badge with an SVG icon in its left
  section.
- **AC7 [R8]** Given `price_old > price`, then the struck old price's box sits above the current price's box, and the
  current price's computed colour equals the theme primary `brand` shade (shade 7, `theme.ts:608`). Given no reduction, no struck element exists and the price colour
  is the default text colour.
- **AC13 [R17]** Given the `ListingDetailPattern` and `ListingContactPattern` Stories, when a state passes `priceOld`,
  then the struck old price's box sits above the main price's box and the main price's computed colour equals the theme
  primary `brand` shade; when it does not, no struck element exists and the colour is the default text colour. The
  original-currency line, when present, sits below the main price.
- **AC14 [R18]** Given a listing with `price_old > price`, when the admin listings table, its phone card, the preview
  dialog and the dashboard's recent-listings row and dialog render it, then each shows the struck old price above a
  coral current price; given `price_old` null, each shows a dark price and no struck element.
- **AC15 [R19]** Given the repository, when a read-only search runs for the inline predicate `price < listing.price_old`
  / `price < price_old` outside `listingSemanticHelpers.ts`, then it returns no hit in the files this task changed.
- **AC8 [R9, R10]** Given a grid card at 1440, then the footer section has a top border and the gray.0 background; the
  ID button and date sit at the right edge; at 320 the two footer columns occupy separate rows when they do not fit,
  with no horizontal overflow.
- **AC9 [R11]** Given the list layout, then the parts appear in §10.3 order and the favorite is inside the head row.
- **AC10 [R12, R15]** Given the smoke suites, then they pass, and they fail against the pre-change tree for the new
  assertions (two-armed transcripts saved).
- **AC11 [R13]** Given the extended Stories, then each §13.3 state is present, and each changed Story emits its GR-3b,
  GR-3c, GR-3d and GR-3e receipts with no violation.
- **AC12 [R14]** Given `npm.cmd run check:design-tokens`, then it reports no new violation in the changed files
  compared with its pre-change run on the same tree.

`GR-4 AC AUDIT — 15 criteria; each states an observable property; absolutes: none.`

## 13. QA profile and verification plan

### 13.1 Profile

**Q4**: critical-flow rows `:62`, `:63`, plus a material restyle of a pattern with seven consumers. The full canonical
viewport matrix applies to the rendered checks (`docs/qa-profiles.md`).

### 13.2 Executor gate block (one pass, transcripts to `docs/sessions/evidence/task918/`)

```powershell
node.exe -p process.platform
node.exe --version
node.exe scripts\check-surface-census.mjs --surface src\modules\listings\components\ListingCard.tsx
npx.cmd vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx
npm.cmd run test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:design-tokens
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:i18n
npm.cmd run check:hydration
npm.cmd run build
git hash-object package.json src/design-system/mantine/patterns/MantineListingCardPattern.tsx src/design-system/mantine/patterns/MantineListingCardPattern.module.css src/modules/listings/components/ListingCard.tsx src/modules/listings/components/ListingFeatureIcon.tsx
```

Expected results:
- `win32`;
- census: every node `manifest:yes story:yes`;
- all others exit 0. For `npm.cmd run test`, record any pre-existing failure set from a pre-change run on the same
  tree and show it unchanged. Sprint 77's 790 tracks the suite's known red state.

Also locate the `MantineListingCardPattern` smoke test at I0 and add its path to the vitest line. The build must exit
0, or the status is `PARTIALLY IMPLEMENTED` / `BLOCKED`.

`GR-2 SCOPE STATED — check:story-coverage inspects enrolled components' direct Story imports; it cannot see visual
correctness or the tile's touch behaviour; the criteria are closed by the receipts below, the smoke suites and the
owner matrix.`

### 13.3 Stories, states and receipts

| Story | States required | GR-3d line |
|---|---|---|
| `Patterns/Mantine/ListingCardPattern` → `Default` | grid: open sale reduced · open rent not reduced · new · no photo · no features · long it title · sold · rented · archived · premium; list: the same set | own gutter: none (pattern has no page gutter); **profile present** (`StoryPageGutter`, `ListingCardPattern.stories.tsx:212`), all four sides |
| `Mantine/Primitives/ListingCard` → `Default`, `FavoritesComposition` | real `ListingCard`: reduced + converted, closed, premium | `n/a: MantineStoryShell primitive` |
| `Patterns/Mantine/ListingCardTrack` → `Grid`, `Rail` | re-render only | **profile present** (`ListingCardTrack.stories.tsx:7`) |
| `Mantine/Primitives/ListingFeatureIcon` → `Default` | every feature icon + 10 tile icons | `n/a: MantineStoryShell primitive` |
| `Mantine/Primitives/Badge` → `Default` | + chip state, + white variant | `n/a: MantineStoryShell primitive` |
| `Patterns/Mantine/ListingDetailView` → `PublicListing` (blast radius: icons) | unchanged states | `n/a: default canvas` (View root has no page gutter, `ListingDetailView.tsx:57`) |
| `Patterns/Mantine/ListingPrice` → `Default` (new) | sm and lg × reduced and not reduced | `n/a: default canvas` unless the file uses `skipCanvas`; then `StoryPageGutter all` |
| `Patterns/Mantine/ListingDetailPattern` → `Default` (R17) | reduced + non-reduced price | **profile present** (`ListingDetailPattern.stories.tsx:268`) |
| `Patterns/Mantine/ListingContactPattern` → `Default` (R17) | reduced + non-reduced price | **profile present** (`ListingContactPattern.stories.tsx:84`) |
| `Patterns/Mantine/AdminListingsView` (R18) | a reduced row | `n/a: own gutter (AdminPageFrame)` under `withAdminShell` (GR-3b admin rule) |
| `Patterns/Mantine/AdminDashboardRecentListings` (R18) | a reduced row + its dialog | `n/a: own gutter (MantineDashboardGrid.tsx:58)`, all four sides (`p={{ base: 'md', md: 'xl' }}`) |
| `MantineTooltip` Story (only if extended) | new prop state | as its file states at I0 |

Receipts per changed or matrix Story:
- **GR-3, GR-3b, GR-3c, GR-3d** for every row above;
- **GR-3e** for the `AdminDashboardRecentListings` dialog (popup);
- **GR-3f**: not applicable unless a circular element changes. The favorite button is unchanged; the tile is a rounded
  square. If the photo-count or another circle changes, emit GR-3f.

### 13.4 OWNER VISUAL QA REQUIRED

| # | Story → export | Locale | Viewports |
|---|---|---|---|
| O89-1 | `ListingCardPattern` → `Default` (+ §16: every state's grid and list cards identical part by part) | uk | 320, 390, 768, 1024, 1440, 1920 |
| O89-2 | `ListingCardPattern` → `Default` | en, sq, it | 390, 1440 |
| O89-3 | `ListingCard` → `Default` (+ §16: grid and list identical part by part; the O46-2 rows 1–2 return) | uk, en | 390, 768, 1440 |
| O89-4 | `ListingCardTrack` → `Grid`, `Rail` | uk | 390, 1024, 1440 |
| O89-5 | `ListingFeatureIcon` → `Default` | uk | 1440 |
| O89-6 | `Badge` → `Default` | uk | 390, 1440 |
| O89-7 | `ListingDetailView` → `PublicListing` | uk | 390, 1440 |
| O89-10 | `ListingPrice` → `Default`; `ListingDetailPattern` → `Default`; `ListingContactPattern` → `Default` | uk | 390, 1440 |
| O89-11 | `AdminListingsView`, `AdminDashboardRecentListings` (reduced row + dialog) | uk | 390, 1440 |
| O89-9 | live `/uk/listings` grid and list (after deploy) | uk | 390, 1440 |

The owner records each tuple accepted or returned. `screenshots:assert` is not used.

## 14. Completion report contract

Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. The report lists:
- files changed, the installed Solar version, and the chosen icon export names;
- R/AC IDs completed;
- each command with its real exit code;
- evidence paths (gate transcript, two-armed test outputs, one
  1440 and one 390 capture per §13.3 Story);
- every GR receipt;
- deleted CSS rules and Task 734 hits removed;
- assumptions, deviations, limitations.

Update `docs/backlog.md` with one state line; write the session log with "Files Changed". No git commands.

## 15. Task quality gate

- Executable by a fresh Sonnet from this file, the Sprint 89 plan and §6w; every cited line was opened on 2026-10-02
  and is re-verified after the start gate.
- One route. The open owner items (site-wide icon migration, §26 gate) do not affect execution.
- Clause 16d: census complete, no unmigrated node. Every changed visible part has an owner Story (§3.4); the only new Story is the new pattern's own (`ListingPrice`), created before its consumers; no other new Story
  file.
- Type-scale table present (§3.5); no text reaches 24px.
- Width contract named (§3.6); GR-3d line for every matrix row (§13.3).
- Two-armed proof required (AC10); build is a hard gate.
- Dirty-worktree boundary: `messages/*.json`, `theme.ts`, `patterns/index.ts` are 857's. This task does not edit
  `messages/*.json`. It edits `theme.ts` only for §16 R22, and only if `git status --porcelain` shows it clean at I0; otherwise it returns `BLOCKED — DIRTY THEME`. It edits `patterns/index.ts` only after the start gate has made it clean, and only to export new pattern
  types if needed.

## 16. Amendment 2026-10-04 — one card for grid and list (owner D89-10)

**Moved to Task 741 Revision 3h** (kickoff `Sprint_46_kickoff_prompt_Task_741_ClosedOverlayStyleModuleExit.md` §18.19,
R62–R66) **by owner decision D46-9**, 2026-10-04. The owner returned 741's `ListingsShellView` because its cards are
non-canonical (rule GR-10), and chose *"Перенести 918 §16 у 741"*. When 918 starts (after 741 is approved), this section
is already implemented. 918 rebuilds the card on its reference **on top of** that single source: one source per part,
no layout-suffixed classes, no literals, one secondary colour, and the parity tests stay green. 918 does not re-do §16;
its §13 gates re-run 741's parity probe (`docs/sessions/evidence/task741r3/rev3h/exec/parity-probe.mjs`). The text below
is kept as the design record.

**Binding (for the design record).** Where §3–§15 differ from this section, this section wins.

### 16.1 Owner return and decision, verbatim

Task 741's owner matrix O46-2 was returned on 2026-10-04:
- row 1, `Mantine/Primitives/ListingCard`: *"не приймаю, стилі карток не збігаються між видом картки та списку. Це хардкодне рішення! Мають бути канонічні і однакові стилі."*
- row 2, `Patterns/Mantine/ListingCardPattern`: *"аналогічна проблема як і в першому пункті."*

Decision **D89-10** (= Task 741's **D46-5**), 2026-10-04. The owner chose, verbatim, *"У 918, жорсткіше (Recommended)"*,
whose text read: *"741 закривається на тому, що вже зроблено …, а рядки 1–2 O46-2 переходять у 918. Я доповнюю 918:
одні й ті самі компоненти частин для обох видів (фото-рамка, заголовок, чіпи, футер), нуль літералів в обох CSS-модулях,
тест на рівність стилів кожної частини між видами."*

Also on 2026-10-04 the owner asked: *"а ти тільки один референс перевіряв? Я ж тобі надав як мінімум 3 референса, чому ти
орієнтуєшся тільки на один?"* §16.2 is the audit of all four standing references plus the owner's Rozetka link.

### 16.2 Reference research (GR-7)

The record, with one row per page, is `docs/sessions/evidence/task741r3/rev3e/design/gr7-design.md`. The live data and
screenshots are in `…/rev3e/design/gr7-pairs/`, `gr7-omah-toggle.json` and `variant-diff.json`.

| Reference | Pair inspected live (1440 + 390) | Grid → list, shared parts | Verdict |
|---|---|---|---|
| Omah | `/property-list.html`, list toggle operated | price 21/600, badge 11px, agent 13.1/600, description 12.25px: all identical; the photo moves left | same card |
| Kamr (signed in) | `/ecom-product-grid` · `/ecom-product-list` | title 14/600, price 21/600 coral: identical; the list adds reviews | same card |
| Omah | `/ecom-product-grid.html` · `/ecom-product-list.html` | the price jumps from 14px to 21px | per-layout restyle |
| Lahomes | property, agents and customers grid · list | the list is an admin table; the badge changes from filled to tinted | different pattern |
| TailAdmin | `/products-list`, `/task-list`, `/list`, `/cards` | no grid/list pair | nothing shown |
| Rozetka (owner, D89-3; URL re-supplied by the owner 2026-10-04) | catalogue `/ua/notebooks/c80004/` view toggle operated: "Мала плитка" (205px tiles) → "Крупна плитка" (261px) | title 14/400 `rgb(34,31,31)`, struck old price 14/400 grey `rgb(121,120,120)` **above** the current price, current price 20/700 red `rgb(248,65,71)` when reduced and dark `rgb(34,31,31)` when not: identical in both views; home tiles the same | **same card** (also confirms D89-3 / D89-7) |

**Chosen 2026 best practice:** one card, with one source per part and the same tokens for every part; only the photo's
position changes. Omah's property list, Kamr's shop and Rozetka's catalogue (both tile sizes) show it, and it is the owner's rule. The two other options are the
defect the owner returned.

**lero.al today** (`variant-diff.json`, 1440, the same listing in both layouts):
- the type label and the location are `rgb(71,84,103)` (`dimmed`) in grid and `oklch(0.556 0 0)` (`--muted-foreground`) in list;
- the location line height is 18px in grid and 16px in list;
- per-m² is 10px/12px at 70% in grid and 12px/18px in list;
- the block order differs;
- the badges sit in a row in grid and in a column in list;
- the photo count is bottom-right in grid and bottom-left in list;
- the overlay is grid only.

`MantineListingCardPattern.tsx` builds the two layouts as two separate markups (`:173-298` list, `:301-420` grid). They
use layout-suffixed class pairs: `badgesList`/`badgesGrid`, `photoCountList`/`photoCountGrid`, `metaRow`/`metaRowBordered`,
`locationIcon`/`locationIconGrid`. There are also six `style={{…}}` objects.

The literal values in `MantineListingCardPattern.module.css`:
- `#0009` ×2, `.75rem` ×4, `.625rem` ×3, `1rem` ×4, `.75rem` line heights, `.125rem` ×2, `3.40282e+38px` ×2, `8rem`, `11rem`;
- 4 × `300ms` and 8 hover box-shadow literals (Task 734's reserved 12).

The literal values in `ListingCard.module.css`: `.875rem` ×2, `-.125rem`, and the `rgba(…)` shadow.

`GR-7 REFERENCE RESEARCH — moment: task creation (amendment D89-10); role: Opus; task: 918; subject: one listing card for grid and list, identical part styles; references: Lahomes, Kamr, Omah, TailAdmin + Rozetka (owner); library: docs/research/references/2026-10-04; live-checked pages: 17 (gr7-design.md rows) → unchanged, Kamr login works live; Rozetka home + catalogue (both tile views) → live in headed Chrome; route inventory: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0, Rozetka 2/2/0; inspected in depth: the 17 pages at 1440 and 390; workflow states operated: Kamr sign-in, Omah grid→list toggle, 1440→390; options across references: same card ← Omah /property-list, Kamr ecom, Rozetka catalogue; table ← Lahomes; per-layout restyle ← Omah ecom; chosen 2026 best practice: one card, one source per part, only the photo position changes; absent or unverified: none; lero.al data map: ListingCard/MantineListingCardPattern × grid/list; owner decisions: D89-10, D89-2; evidence: docs/sessions/evidence/task741r3/rev3e/design/.`

### 16.3 Requirements

| ID | Source | Observable requirement | P |
|---|---|---|---|
| **R20** | D89-10 | **One source per part.** `MantineListingCardPattern` builds each part **once per render**, as a local JSX value, and both layouts place that same value. The parts are: <ul><li>the photo chrome: the badge stack, the overlay and the photo count;</li><li>the head row: the tile, the title and the address;</li><li>the chips;</li><li>the footer: the price block, the per-m² / original-price line, the ID and the date.</li></ul> The parts are not new components, and the pattern stays their canonical owner, proven by its Story. Each part's root carries `data-card-part="badges"`, `"overlay"`, `"photo-count"`, `"head"`, `"chips"` or `"footer"` as a test hook. The layouts may differ in only two ways: <ol><li>the arrangement: the photo `Card.Section` on top in grid, and a left photo column of width `theme.other.layout.listingCardListThumb` (R22) in list;</li><li>the favorite position, per D89-2: on the photo in grid, and inline at the end of the head row in list, outside the `head` part node.</li></ol> No class name, style prop or token appears in only one layout's part markup, and no layout-suffixed class pair remains. | P0 |
| **R21** | D89-10 | The sold/rented overlay is part of the shared photo chrome, so it renders in **both** layouts. This replaces "grid only" in §3.3 and F1. The badge stack has the same direction (row, wrapping) and the same position (top-left, theme `xs` inset) in both layouts. The photo count has the same position (bottom-right) in both. | P0 |
| **R22** | D89-10, GR-0 | **No literal visual value** in `MantineListingCardPattern.module.css`, `ListingCard.module.css` or `MantineListingCardPattern.tsx`. The rules, the replacements, and Task 734's reserved 12 card-module hits (734's row is re-scoped in `docs/backlog-reserved.md`) are listed below this table. | P0 |
| **R23** | D89-10 | **One secondary-text colour.** Every secondary text in the pattern and in `ListingCard.tsx` uses `c="dimmed"`. `var(--muted-foreground)` no longer appears in `MantineListingCardPattern.tsx`, its module, `ListingCard.tsx` or `ListingCard.module.css`. | P0 |
| **R24** | D89-10 | **Parity proof**, in two parts below this table: (a) a unit parity test and (b) a rendered parity probe. | P0 |

**R22 rules.**
- Neither CSS module keeps a `design-tokens-allow` marker, or a px, rem, ms, hex or `rgb()`/`rgba()` literal.
- The TSX has no `style={{…}}` object.
- Allowed, because they are not design values:
  - unitless numbers (`scale(1.05)`, `opacity: 0.6`, `grayscale(1)`);
  - keywords (`nowrap`, `pointer`, `hidden`);
  - `rotate: -8deg` on the overlay label. Mantine has no prop for it, and the comment there says so.

**R22 replacements.**
- **Transitions:** `var(--motion-duration-slow)` (`:root`, `src/app/globals.css:340`). Not `--duration-slow`: that is an `@theme inline` name, never emitted at runtime (`AppImage.module.css:12`).
- **Hover shadow:** `var(--mantine-shadow-lg)`.
- **Hover lift:** `translateY(calc(var(--mantine-spacing-micro) * -1))`.
- **Badge and photo-count position:** Mantine props `pos="absolute"` with theme `top`/`left`/`right`/`bottom` = `xs`.
- **Photo count:** a Mantine `Badge`, with the size, radius and spacing taken from its theme entry, `variant="filled"` `color="dark"`, and the Solar camera in `leftSection`.
  - This changes the 60% translucent black to opaque `dark`. It is an Opus decision, and the owner can return it in O89-1.
- **List photo column width:** a new token `theme.other.layout.listingCardListThumb: { base: 128, sm: 176 }`, which keeps today's 8rem/11rem, read through `useMantineTheme` and `rem()`.
  - Its type goes in the `MantineThemeOther` augmentation.
  - It is the only `theme.ts` change.
- **Favorite shadow:** `var(--mantine-shadow-xs)`.
- **Margins:** `.inlineFavorite`'s negative margins are removed; the head row's `Group align` places it.
- **Icon sizing:** `.featureIcon` is replaced by the Solar icon `size={theme.other.iconSize.standard}`.
- **Inline styles:** the six `style` objects become Mantine props (`pos`, `Card.Section withBorder`) or keyword-only module classes (`cursor: pointer`, `white-space: nowrap`).

**R24 parts.**
- **(a) Unit parity.** `MantineListingCardPattern.smoke.test.tsx` renders the same props with `layout="grid"` and `layout="list"`, for:
  - an open reduced listing;
  - a sold listing;
  - a premium listing.

  For every `data-card-part` node, the normalised `outerHTML` (Mantine's generated ids stripped) is equal between the two layouts.
- **(b) Rendered parity.** A Playwright probe on the built Storybook covers:
  - the Stories `Patterns/Mantine/ListingCardPattern` and `Mantine/Primitives/ListingCard`;
  - `en` and `uk`, at 768 and 1440;
  - every state in both sections.

  For every text leaf inside every `data-card-part` node, the computed `font-size`, `font-weight`, `line-height`, `color` and `letter-spacing` of the grid card equal those of the list card for the same state.

### 16.4 Acceptance criteria

`GR-4 AC AUDIT — 5 criteria; each states an observable property; absolutes: none.`

- **AC16 [R20, R24a]** Given the final tree, the parity test passes. Given a plant (a temporary edit giving the list
  title a different `fz`), it fails. The plant's restore is proven by the pre-plant `git hash-object` of the pattern
  file and its final hash. Separately, a search of the pattern TSX and module for class names ending in `List` or `Grid`
  returns no hit.
- **AC17 [R21]** Given the two card Stories at 768 and 1440 in `uk`, every sold/rented card in the list section shows
  the overlay label inside its photo column, with its 2px border uncut. This needs a GR-3g crop for the widest `uk` label
  (*ОРЕНДОВАНО*) on the 128px/176px column. If the label does not fit inside the column, return
  `BLOCKED — OVERLAY WIDTH` with the measurement; do not shrink or clip it.
- **AC18 [R22]** Given the final tree, a read-only search of the two CSS modules for `design-tokens-allow`, a px/rem/ms
  number, `#` followed by a hex digit, or `rgb` returns no hit. A search of the pattern TSX for `style={{` returns no
  hit. `check:design-tokens` reports no violation in the changed files.
- **AC19 [R23]** Given the final tree, a read-only search for `muted-foreground` in the four files named in R23 returns
  no hit.
- **AC20 [R24b]** Given the final Storybook build, the parity probe writes `task918/parity.json` with every tuple equal
  and exits 0. On a build carrying the AC16 plant, it exits 1 and names the cell (`task918/parity-red.json`).

### 16.5 Verification additions to §13.2

Add these lines to the gate block, in this order, after `npm.cmd run build`:

```powershell
npm.cmd run build-storybook
node.exe docs\sessions\evidence\task918\parity-probe.mjs
Select-String -Path src\design-system\mantine\patterns\MantineListingCardPattern.module.css,src\modules\listings\components\ListingCard.module.css -Pattern 'design-tokens-allow|\d(px|rem|ms)\b|#[0-9a-fA-F]|rgb'
Select-String -Path src\design-system\mantine\patterns\MantineListingCardPattern.tsx -Pattern 'style=\{\{|[A-Za-z](List|Grid)\b'
Select-String -Path src\design-system\mantine\patterns\MantineListingCardPattern.tsx,src\design-system\mantine\patterns\MantineListingCardPattern.module.css,src\modules\listings\components\ListingCard.tsx,src\modules\listings\components\ListingCard.module.css -Pattern 'muted-foreground'
git --no-optional-locks hash-object src/design-system/mantine/theme.ts src/modules/listings/components/ListingCard.module.css
```

Expected:
- `build-storybook` and the probe exit 0;
- the three `Select-String` lines print nothing;
- the `layout`/`variant` prop values `'list'` and `'grid'` are string literals in quotes, not class names. If the
  second search matches one, record it in the session log as not a class.

Write the probe (`parity-probe.mjs`) under `docs/sessions/evidence/task918/`. It reads `storybook-static` the way
`docs/sessions/evidence/task741r3/rev3c/review/review-probe.mjs` does.

**Story receipts (§13.3) additionally include:**
- a GR-3g corner check of the overlay label in the list section;
- a GR-3b check that the list section stays hidden below 640 (Task 741 D46-3).

### 16.6 GR-7 at execution

Before the first write, Sonnet runs its own GR-7 audit (`docs/golden-rules.md` GR-7) into
`docs/sessions/evidence/task918/research-exec/`. It reads the library rows named in §16.2 and in
`docs/tailadmin-style-reference.md` §6w. It opens live every page in §16.2's table and §6w's Lahomes page at 1440 and
390, and records `unchanged` or the difference. It emits the full receipt in the session log. If the audit contradicts
§16.2's chosen practice, it stops with `BLOCKED — GR-7 KICKOFF CONFLICT`.

### 16.7 Files added to §7 scope

- `src/design-system/mantine/theme.ts` (R22: one token and its type only)
- `docs/sessions/evidence/task918/parity-probe.mjs` (new)
