# Task 918 — The listing card rebuilt on the owner's reference (grid and list), one price colour rule everywhere

**Sprint 89** (`tasks/Sprints/Sprint_89_The_Listing_Card_Rebuilt_On_The_Owners_Reference.md`) · **P1** · **QA profile Q4**
· Executor: Sonnet via `.claude/skills/execute-task/SKILL.md`. Evidence goes to `docs/sessions/evidence/task918/`.

> **Start gate.** Do not start until **912** (Sprint 88), **741 Revision 2** (Sprint 46) and **857** (Sprint 78) are
> `APPROVED` and committed. All three edit files this task rewrites (Sprint 89 → Execution order). At I0, check each one
> in `docs/backlog-archive.md`. If any is not archived as approved, return `BLOCKED — START GATE` and make no write.
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
| F3 | FACT | `ListingFeatureIcon` maps `PresentationIcon` (`home, bed-double, bath, area, building, layers, calendar`) to `lucide-react` components. Consumers: `ListingCard`, `MantineListingCardPattern` (doc only), `ListingDetailView`, `ListingPreviewDialogView` (857), and its own Story. | `src/modules/listings/components/ListingFeatureIcon.tsx:1-12`; whole-`src` search for `ListingFeatureIcon` |
| F4 | FACT | `ListingCard` consumers: `ListingsShellView.tsx:131` (grid) and `:148` (list), `FeaturedListingsView.tsx:94`, `LatestListingsView.tsx:66`, `RecentlyViewedGridView.tsx:70`, `SimilarListingsView.tsx:62`, `FavoritesShell.tsx:205`. `MantineListingCardPattern` is also rendered directly by `ListingPreviewDialogView` (857, `layout="list"`). | whole-`src` search for `<ListingCard` and `MantineListingCardPattern` |
| F5 | FACT | Theme keys used by this design exist: spacing `xs 8 · sm 12 · md 16 · lg 20` (`theme.ts:654-670`); fontSizes `xs 12 · sm 14 · md 16 · lg 18 · xl 20` (`:698-706`); radius `sm 4 · md 6` (`:674-679`); shadow `xs` (`:720`); colours `green`, `orange`, `sale`, `blueLight`, `purple`, `yellow`, `gray` (gray.0 `#f9fafb`, gray.1 `#f2f4f7`) (`colors:` line); `theme.other.iconSize` `standard 16 · decorative 24` (`:48-62`); Badge theme entry (`:1230+`, default `size sm` 12px/500, radius pill, variant light). | `src/design-system/mantine/theme.ts` |
| F6 | FACT | `AppImage variant="listing"` frames at 4:3 (`AppImage.module.css:85-87`). The reference is 3:2. **Kept at 4:3** (preserve; LCP `sizes` hints and Sprint 74 width contracts depend on it). | that file |
| F7 | FACT | The card CSS module carries Task 734's reserved N1 hits (4 `transition`, 8 hover `box-shadow`) and `.card { box-shadow: none }` (`MantineListingCardPattern.module.css:36-38, 85-92`). | that file |
| F8 | FACT | `@solar-icons/react` 2.3.2: MIT, `"sideEffects": false`, peer `react >= 16.8`, per-style subpath imports (`@solar-icons/react/broken`, `/bold-duotone`, …), component names end in `Icon` (README). | `npm view @solar-icons/react` |
| F9 | FACT | `MantineTooltip` opens as a bottom sheet below 640px through an `onClick={openDrawer}` wrapper around its children (`MantineTooltip.tsx:53-70`). Interactive nodes inside the card link stop navigation with `e.preventDefault(); e.stopPropagation()` (`FavoriteButton.tsx:72-73`, `MantineCopyIdButton.tsx:32-33`). | those files |
| F10 | FACT | Stories rendering the card: `Patterns/Mantine/ListingCardPattern` (direct import, `skipCanvas` + `StoryPageGutter`, `:9,14,22,212`), `Mantine/Primitives/ListingCard` (`MantineStoryShell`, `:9,26`), `Patterns/Mantine/ListingCardTrack` (`StoryPageGutter`, `:7`), `Patterns/Mantine/ListingPreviewDialogView` (857, modal). `Mantine/Primitives/ListingFeatureIcon` (`MantineStoryShell`). `Mantine/Primitives/Badge` (`MantineStoryShell`; carries a `style` object at `:79`). `Patterns/Mantine/ListingDetailView` (default canvas; renders feature icons). | those files |
| F12 | FACT | The listing page renders the price in `brand` unconditionally twice: the detail block `<Text fw={700} size="xl" c="brand">` (`MantineListingDetailPattern.tsx:204`), which shows the struck `priceOld` beside it only when the view passes it (`ListingDetailView.tsx:289`, gated on `isPriceReduced`), and the contact card `<Text fw={700} size="xl" c="brand">` (`MantineListingContactPattern.tsx:153`), to which **912** adds `priceOld` below the price (D88-1 layout). Their Stories: `Patterns/Mantine/ListingDetailPattern` (`StoryPageGutter`, `:5, :268`) and `Patterns/Mantine/ListingContactPattern` (`StoryPageGutter`, `:9, :84`). Both patterns are `manifest:yes story:yes`. Their surface census (13 unmigrated nodes in `ListingDetailView`/`ListingContact`, owners listed, five filed as **913**) is in 912 §3.1. This task edits only the two pattern files, not those surfaces. | those files; 912 kickoff F4, F12, §3.1 |
| F13 | FACT | Admin price surfaces, none of which reads `price_old`: `AdminListingsView.tsx:159` (table cell, `Text size="sm" fw={500}`) and `:292` (phone card), data from `src/app/admin/listings/page.tsx:60-61` (select without `price_old`); `ListingPreviewDialogView.tsx:143-148` (`MantineListingCardPattern layout="list"`, `data` without `priceOld`); `AdminDashboardRecentListings.tsx:146-148` (row, `Text size="sm" fw={500} c="gray.8"`) and `:213-215` (dialog), data from `src/modules/admin/dashboard/queries.ts:254` (select without `price_old`), `:368` (mapper) and `types.ts:86` (`RecentListingRow`). `/admin/listings/[id]/preview` computes `isPriceReduced` (`preview/page.tsx:77`) and renders `ListingDetailView`, so it is covered by the detail-pattern change. `AdminDashboardRecentListings` has 0 `className`, a manifest entry (`mantine-migration-scope.json:117`) and its own Story `Patterns/Mantine/AdminDashboardRecentListings`. `AdminListingsView`, `ListingPreviewDialogView` and the listings route are 857's uncommitted work at design time. | those files; `git status` |
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
node.exe scriptscheck-surface-census.mjs --surface srccomponentsadminAdminListingsView.tsx
node.exe scriptscheck-surface-census.mjs --surface srccomponentsadminListingPreviewDialogView.tsx
node.exe scriptscheck-surface-census.mjs --surface srccomponentsadminAdminDashboardRecentListings.tsx
node.exe scriptscheck-surface-census.mjs --surface srcdesign-systemmantinepatternsMantineListingDetailPattern.tsx
node.exe scriptscheck-surface-census.mjs --surface srcdesign-systemmantinepatternsMantineListingContactPattern.tsx
```

At design time, `AdminDashboardRecentListings` is `manifest:yes` (`mantine-migration-scope.json:117`) with 0 `className` and its own Story. `AdminListingsView` and `ListingPreviewDialogView` are 857's, which enrols them with their own Stories. The two patterns are `manifest:yes story:yes` (912 §3.1). Paste each census into the session log and emit one `GR-1 CENSUS COMPLETE` receipt per surface. **If any node is unmigrated (no manifest entry and no Story of its own), return `BLOCKED — CLAUSE 16d` with the node list and make no write to that surface.**

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
| Price block (card footer, admin cells) | card price markup (F1), `AdminListingsView.tsx:159,292`, `AdminDashboardRecentListings.tsx:146,213`, the detail and contact patterns (F12) | none: the same price/old-price markup is written separately in each place | **create canonical** `MantineListingPrice` (`src/design-system/mantine/patterns/MantineListingPrice.tsx`), the single owner of the D89-7 colour rule: props `price: string`, `priceOld?: string`, `size: 'sm' \| 'lg'`. Renders `Stack gap={0}`: [old price `fz="xs"` `c="dimmed"` `td="line-through"`] above the current price `fw={700}` `fz={size}`, `c="brand"` when `priceOld` is present, default text colour otherwise. Own Story `Patterns/Mantine/ListingPrice` with both states at both sizes; enrolled in `scripts/mantine-migration-scope.json`. Consumed by the card footer and the four admin sites. The detail and contact patterns keep their owner-decided layouts (old price beside / below, D88-1) and apply the same predicate to their price colour (R17). | theme `brand`, `fontSizes.sm/lg/xs` |
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
| Current price | emphasized body | 18 | 18 | 18 | 18 | `fz="lg"` `fw={700}` | D89-3 (large bold) |
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
| R17 | D89-7 | On the listing page, the price in `MantineListingDetailPattern` and `MantineListingContactPattern` uses `c="brand"` only when the pattern receives `priceOld` (the reduced case), and the default text colour otherwise. Sizes, layouts and every other line are unchanged. | P0 | computed colour in both Stories, both states; smoke assertion | Confirmed |
| R18 | D89-8 | Admin: `src/app/admin/listings/page.tsx` and `src/modules/admin/dashboard/queries.ts:254` select `price_old`; `RecentListingRow` and the listings row type carry `price_old: number \| null`. `AdminListingsView` (cell and phone card) and `AdminDashboardRecentListings` (row and dialog) render `MantineListingPrice size="sm"`; `ListingPreviewDialogView` passes `priceOld` to the card pattern. `priceOld` is passed only when `isPriceReduced(price, price_old)` holds. | P0 | Stories + smoke assertions | Confirmed |
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
- `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` and `MantineListingContactPattern.tsx`: the price `Text` colour only (R17); their Stories show a reduced and a non-reduced price (extend if a state is missing after 912)
- Admin (R18): `src/app/admin/listings/page.tsx`, `src/components/admin/AdminListingsView.tsx`, `src/components/admin/ListingPreviewDialogView.tsx`, `src/components/admin/AdminDashboardRecentListings.tsx`, `src/modules/admin/dashboard/queries.ts`, `src/modules/admin/dashboard/types.ts`, and the Stories `AdminListingsView.stories.tsx`, `ListingPreviewDialogView.stories.tsx`, `AdminDashboardRecentListings.stories.tsx` (a reduced fixture row in each)
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
- `messages/*.json` (F11) and `theme.ts` (dirty with 857; no theme change is needed).

## 9. Current and required behavior

| Area | Current | Required |
|---|---|---|
| Grid card | border, flat; type text line; title 14/600; location with pin; bordered feature row; price + struck old side by side in the body; ID/date in the body | no border, `shadow xs`; deal badge on the photo; tile + title 16/500 + address 14; chips; footer section with the D89-3 price block (left) and ID/date (right) |
| List row | type text + favorite row; price above features; location + ID/date row | badges on the photo; head row tile + title/address + inline favorite; chips; footer row (price block left, ID/date right) |
| Icons | lucide | Solar (`broken` features, `bold-duotone` tile; photo-count camera Solar too) |
| Detail page / admin preview feature icons | lucide | Solar (same map) |
| Listing page price (detail block, contact card) | always `brand` | dark when not reduced, `brand` when reduced (D89-7) |
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
5. `MantineListingCardPattern`: rebuild both layouts per §3.3/§3.4/§3.5. New props, all optional so that 857's dialog
   keeps compiling:
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
8. Listing page (R17): the price colour in `MantineListingDetailPattern` and `MantineListingContactPattern`; their
   Stories show both states.
9. Admin (R18): queries and types first, then `AdminListingsView`, `ListingPreviewDialogView`,
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
  then the main price's computed colour equals the theme primary `brand` shade; when it does not, the colour is the
  default text colour and differs from it.
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
npx.cmd vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx
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
| `Patterns/Mantine/ListingPreviewDialogView` → `Active` (blast radius: list card + icons) | unchanged states | `n/a: overlay-only` |
| `Patterns/Mantine/ListingPrice` → `Default` (new) | sm and lg × reduced and not reduced | `n/a: default canvas` unless the file uses `skipCanvas`; then `StoryPageGutter all` |
| `Patterns/Mantine/ListingDetailPattern` → `Default` (R17) | reduced + non-reduced price | **profile present** (`ListingDetailPattern.stories.tsx:268`) |
| `Patterns/Mantine/ListingContactPattern` → `Default` (R17) | reduced + non-reduced price | **profile present** (`ListingContactPattern.stories.tsx:84`) |
| `Patterns/Mantine/AdminListingsView` (R18) | a reduced row | `n/a: own gutter (AdminPageFrame)` under `withAdminShell` (GR-3b admin rule) |
| `Patterns/Mantine/AdminDashboardRecentListings` (R18) | a reduced row + its dialog | `n/a: own gutter (MantineDashboardGrid.tsx:58)`, all four sides (`p={{ base: 'md', md: 'xl' }}`) |
| `MantineTooltip` Story (only if extended) | new prop state | as its file states at I0 |

Receipts per changed or matrix Story:
- **GR-3, GR-3b, GR-3c, GR-3d** for every row above;
- **GR-3e** for `ListingPreviewDialogView` (popup);
- **GR-3f**: not applicable unless a circular element changes. The favorite button is unchanged; the tile is a rounded
  square. If the photo-count or another circle changes, emit GR-3f.

### 13.4 OWNER VISUAL QA REQUIRED

| # | Story → export | Locale | Viewports |
|---|---|---|---|
| O89-1 | `ListingCardPattern` → `Default` | uk | 320, 390, 768, 1024, 1440, 1920 |
| O89-2 | `ListingCardPattern` → `Default` | en, sq, it | 390, 1440 |
| O89-3 | `ListingCard` → `Default` | uk | 390, 1440 |
| O89-4 | `ListingCardTrack` → `Grid`, `Rail` | uk | 390, 1024, 1440 |
| O89-5 | `ListingFeatureIcon` → `Default` | uk | 1440 |
| O89-6 | `Badge` → `Default` | uk | 390, 1440 |
| O89-7 | `ListingDetailView` → `PublicListing` | uk | 390, 1440 |
| O89-8 | `ListingPreviewDialogView` → `Active` | uk | 390, 1440 |
| O89-10 | `ListingPrice` → `Default`; `ListingDetailPattern` → `Default`; `ListingContactPattern` → `Default` | uk | 390, 1440 |
| O89-11 | `AdminListingsView`, `AdminDashboardRecentListings` (reduced row + dialog), `ListingPreviewDialogView` → `Active` with a reduced listing | uk | 390, 1440 |
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
- Dirty-worktree boundary: `messages/*.json`, `theme.ts`, `patterns/index.ts` are 857's. This task does not edit the
  first two. It edits `patterns/index.ts` only after the start gate has made it clean, and only to export new pattern
  types if needed.
