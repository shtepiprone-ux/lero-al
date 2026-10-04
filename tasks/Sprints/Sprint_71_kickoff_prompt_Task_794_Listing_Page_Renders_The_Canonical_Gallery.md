# Task 794: the listing page renders the canonical gallery, and its LCP mechanism survives

> **Sprint 71** (`tasks/Sprints/Sprint_71_The_Listing_Detail_Route_Leaves_Tailwind.md`). **P2 · Q4.** Kickoff filed
> 2026-10-04 by Opus. **Runs next**, before **918** (owner D88-5, 2026-10-03, Sprint 88 plan). 918's start gate
> waits on this task's approval.
>
> Executor: run through `@executor` with the `execute-task` workflow. This file is the only instruction source.
>
> **Start precondition (I0).** `git --no-optional-locks status --porcelain` shows no uncommitted change in any §7
> path. At design time, other tasks' work in progress (741, 859) was modifying `src/design-system/mantine/theme.ts`,
> `scripts/mantine-migration-scope.json`, `scripts/surface-census-baseline.json` and `messages/*.json`. If any §7
> path is dirty at I0, return `BLOCKED — §7 path carries another task's uncommitted work` and make no write.

## 1. Mode and task type

`TASK DESIGN` → UI migration on the current Mantine path, plus a critical-flow DOM change (Task 612 row) and a
governance-baseline pay-down (Task 829's `enrolled-tailwind` baseline). The route's server/client boundary does
**not** move (§10.1).

Files: 10 production files (one of them deleted), 1 Story file, 1 smoke test, 2 scripts, 4 governance data files,
4 locale files and 2 docs (§7). No new route, server action, permission or table. One new theme key (§10.6, under D71-4).

## 2. Objective

The owner's return on 2026-10-03 (D88-5, quoted in the Sprint 88 plan): the listing page still renders the legacy
gallery (`GalleryStaticFrame` → `GalleryIsland` → `ListingGallery`), while the canonical Rozetka-style
`MantineListingGalleryPattern` (Tasks 810/824/825) already exists. The page must render that pattern. Option chosen
verbatim: *"Окремо 794, одразу після 912 (Recommended)"*.

After this task:

1. Both `/[locale]/listings/[slug]` and `/admin/listings/[id]/preview` render `MantineListingGalleryPattern` once
   the page is interactive.
2. The SSR HTML still carries the cover photo as an immediately paintable `fetchpriority="high"` `<img>` before any
   client JS runs. The static frame now has the pattern's own geometry, so revealing the pattern moves nothing.
3. The Task 612 lightbox flow is unchanged for users: portal and z-index, prev/next buttons, ArrowLeft/ArrowRight with
   wrap, thumbnail jump, counter, close with X/Esc/backdrop, scroll lock and focus return.
4. No Tailwind class is left in the gallery subtree, and `scripts/enrolled-tailwind-baseline.json` holds zero keys
   (owner decision 2026-09-17, Task 829: *794 must empty its 27 keys*).

## 3. Verified context

All facts were read or run on 2026-10-04 on `win32` at `HEAD` `2f1d85845` (clean worktree apart from the untracked
`.playwright-mcp/` and this task's research directory).

| ID | Fact | Source |
|---|---|---|
| F1 | `GalleryStaticFrame` is a Server Component. It renders a raw `<img>` with `fetchPriority="high"`, `loading="eager"`, and `srcSet`/`sizes` from `buildGalleryMainPreloadAttrs`. Its frame is a Tailwind `grid-cols-4 grid-rows-2` with the cover in the left half from `md` and four grey desktop cells, at heights `--listing-gallery-h-*` with `rounded-2xl`. It has 5 `className` attributes. When there is no Cloudinary URL it renders a `bg-muted` div. | `src/modules/listings/components/GalleryStaticFrame.tsx:26-58` |
| F2 | `GalleryIsland` lazy-loads `ListingGallery` with `next/dynamic(..., { ssr: false })` and renders only that. | `GalleryIsland.tsx:19-33` |
| F3 | `ListingGallery` (165 lines, `'use client'`): re-sorts images (cover first) at `:24-28`. Swap effect at `:42-52`: removes `#gallery-wrapper-static` and calls `classList.remove('hidden')` on `#gallery-interactive-shell`. Document `keydown` ArrowLeft/ArrowRight while the lightbox is open at `:56-64`. Empty state at `:66-72`. Mobile "All photos (N)" link at `:80-89`. The 4×2 grid with 4 side tiles and a "+N photos" overlay at `:92-118`. Mobile "N photos" button at `:122-132`. Desktop "All photos (N)" link at `:136-145`. `LightboxView` labels at `:147-162`. It imports `@/components/ui/button` (`:7`) and its own `ListingGallery.module.css` (`:10`). | file |
| F4 | `ListingDetailView` builds `gallerySlot` at `:311-344`. It contains: the preload `<link>` (`:313-322`); `#gallery-wrapper-static` with `GalleryStaticFrame` and `#gallery-btn-placeholder` (`Box mt="sm" h={theme.other.iconSize.roomy}`, 20px, shown when there is more than 1 image) (`:323-331`); and `#gallery-interactive-shell` with `className="hidden"`, wrapping `GalleryIsland` (`:339-341`). | file |
| F5 | `MantineListingGalleryPattern` (166 lines, `'use client'`) has these parts. **Mode:** `useMatches({ base: true, sm: false })` with no options (`:44`). **Empty state:** `Paper withBorder radius="lg"`, Tailwind heights, lucide `Maximize2` (`:63-73`). **Frame:** a Tailwind div (`:77`). **Desktop main photo:** an `UnstyledButton` with `AppImage variant="gallery-main"` and **no `priority`** (`:86-93`). **Mobile:** swipe track (`:95-114`). **Nav:** `GalleryDesktopNavigation` (`:117-124`). **Counter badge:** `cn(styles.photoCountBadge, 'pointer-events-none absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-xs')` (`:125-129`). **Thumbnail row:** `ScrollArea mt="xs"` with `GalleryThumbnailButton`; a click selects only (`:136-151`). **Lightbox:** `LightboxView` (`:153-163`). It has **no keyboard listener for the desktop lightbox.** | file |
| F6 | `LightboxView` has no `keydown` handling. `useSwipeTrackSync` handles ArrowLeft/ArrowRight only on its **focused** container (mobile track). | `grep -n "Arrow\|keydown"` over both files; `src/hooks/useSwipeTrackSync.ts:276-314` |
| F7 | Mantine `useMatches(payload, options)` forwards `options` to `useMediaQuery`. With `{ getInitialValueInEffect: false }` it reads `window.matchMedia` synchronously on the first render; the default reads it in an effect, so the first render returns `base`. | `node_modules/@mantine/core/esm/core/MantineProvider/use-matches/use-matches.mjs`, `node_modules/@mantine/hooks/esm/use-media-query/use-media-query.mjs` |
| F8 | `MantineListingDetailPattern` renders `gallerySlot ?? <MantineListingGalleryPattern …/>` (`:154`). Left column is `span={{ base: 12, lg: 7, xl: 8 }}` with `pr={{ base: 0, lg: 'lg' }}` when `sidebarFrom='lg'` (`:144-147`); `ListingDetailView` passes `sidebarFrom="lg"`. | file |
| F9 | `scripts/enrolled-tailwind-baseline.json` has **27 keys / 36 occurrences**, all with `owner: "794"`. 26 keys are in `MantineListingGalleryPattern.tsx` and 1 (`hidden`) in `ListingDetailView.tsx`. The writer `--update-baseline` may only lower or drop. | file; `scripts/check-enrolled-tailwind.mjs:32-50` |
| F10 | The `gallery-main` `sizes` (`appImageConfig.ts:164`) and `GALLERY_MAIN_SIZES` (`imageDelivery.ts:20`) are the same string, `'(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 34vw'`. It describes the legacy cover cell (half the grid from `md`), not the pattern's full-column photo (F8). `imageDelivery.ts:19` says the two "must match". | files |
| F11 | Both routes sort images cover-first, then by `order`, before the view: `src/app/[locale]/listings/[slug]/page.tsx:209-214` and `src/app/admin/listings/[id]/preview/page.tsx:66-71`. `coverImage = sortedImages[0]` feeds the preload link and the static frame. | files |
| F12 | Critical-flow row `docs/critical-flow-registry.md:119` (Task 612) names `ListingGallery.tsx → LightboxView.tsx`. The smoke test `ListingGallery.portal.smoke.test.tsx` opens the lightbox through the "All photos" button (`:121-124`) and asserts ArrowRight/ArrowLeft on `document` (`:169-185`). The Playwright script selects `.listing-gallery` (`:131`) and `.listing-gallery .cursor-zoom-in` (`:154`). Both are Tailwind/legacy hooks this task removes. | files |
| F13 | `check:surface-census:changed:verify` arm 12 uses `src/modules/listings/components/ListingGallery.tsx` as its "unmigrated `.tsx` control that still blocks" (`scripts/check-surface-census-changed.mjs:620-633`). After this task that file no longer blocks, so the arm must take a different control. The candidate `src/modules/listings/components/ListingReportDialog.tsx` blocks today (census 2026-10-04: tier1 `manifest:no story:no`, 15 `className`, 7 ui imports, plus a tier-2 `button` block) and stays unmigrated until **795**. | file; census run |
| F14 | `scripts/governance/tailwind-entropy.allowlist.json:176-205` holds three `ListingGallery.tsx` entries (`z-[100]`, `h-[420px]`, `h-[500px]`). None of those patterns occurs in `ListingGallery.tsx` today, so all three are already stale. | file + grep |
| F15 | `src/app/[locale]/listings/[slug]/loading.tsx:47-64` is the route's Suspense skeleton. Its gallery block "mirrors ListingGallery grid exactly" (4×2, four side cells from `md`). | file |
| F16 | `eslint.config.mjs:77-82` allows a raw `<img>` and inline `srcSet`/`fetchPriority` only in `AppImage.tsx` and `GalleryStaticFrame.tsx`. | file |
| F17 | `MediaPlaceholder` is the canonical photo placeholder: a `Center pos="absolute" inset={0} bg="gray.2"` with a `theme.other.iconSize` glyph. `AppImage` already shows it inside this same gallery when a photo fails to load (Task 886 R21/R41). | `src/design-system/media/MediaPlaceholder.tsx:22-37`; `MantineListingGalleryPattern.tsx:91` |
| F18 | `AppImage.module.css` `.imageLayer` (absolute, inset 0, 100%×100%) and `.fitCover` (`object-fit: cover`) are the classes `AppImage` puts on the same `gallery-main` `<img>`. `.frameClip` is `overflow: hidden`. | `AppImage.module.css:105-140`; `AppImage.tsx:157-166` |
| F19 | Theme tokens exist for every counter-badge value except its line-height: spacing `xs` 8px, `micro` 2px; radius `lg` 8px, `pill`; `fontSizes.xs`; `boxSize.galleryThumb` 44px. `theme.other.lineHeight` has no 16px (1rem) key. `lightboxCounter` is 20px. | `src/design-system/mantine/theme.ts:656-684`, `:777`, `:817` at `HEAD` `2f1d85845`. Locate by key: Task 741 Revision 3's in-flight edit (`borderWidth.statusOverlay`) shifts these by 2–3 lines and changes none of these values |
| F20 | i18n keys `listing.all_photos` and `listing.photo_count` keep other consumers (`ClickShieldModalFixture.tsx:19`, `steps/StepPreview.tsx:37`), so they **stay**. Labels the pattern needs exist: `listing.close_gallery`, `common.aria_prev`, `common.aria_next`. | `git grep` |
| F21 | `docs/mantine-responsive-design-system.md:664` (§11) and `:811` (§17) still read "Listing gallery: BLOCKED, owner architecture decision". D88-5 is that decision. | file |
| F22 | `Patterns/Mantine/ListingGalleryPattern` has one export, `Default`. It has `skipCanvas`, `StoryPageGutter` at `:50`, sections "multi" and "empty", and a `play` that opens the lightbox. Its "multi" label key `storybook.mantine.listing_detail_gallery_section_default` says "click the main photo **or a thumbnail** to open the lightbox", which contradicts D824-3 (a thumbnail selects only). | `src/stories/patterns/mantine/ListingGalleryPattern.stories.tsx`; `messages/en.json:2633` |
| F23 | Pre-write `git hash-object` values for the 14 files below: `MantineListingGalleryPattern.tsx` `7b2841b0…`, `GalleryStaticFrame.tsx` `e9694ecb…`, `GalleryIsland.tsx` `096bc9eb…`, `ListingGallery.tsx` `27369023…`, `ListingGallery.module.css` `20d77117…`, `ListingDetailView.tsx` `57ac2061…`, `ListingGalleryPattern.stories.tsx` `09bda946…`, `ListingGallery.portal.smoke.test.tsx` `af68a1af…`, `task612-qa-listinggallery-lightbox-portal.mjs` `e7cd9513…`, `enrolled-tailwind-baseline.json` `1ea7c556…`, `imageDelivery.ts` `178e4d80…`, `appImageConfig.ts` `35cc2166…`, `mantine-migration-scope.json` `fd1ae9c9…`, `critical-flow-registry.md` `3c146889…` | `git hash-object` |

### 3.1 GR-1 census (`node.exe scripts\check-surface-census.mjs --surface src\modules\listings\components\ListingDetailView.tsx`, 2026-10-04, `win32`)

The census visits 38 nodes. It **cannot see** `next/dynamic` imports, so `ListingGallery.tsx` (loaded by `GalleryIsland`)
is added by hand, which makes **39 nodes**.

| Node | Tier | manifest / story / className / ui | Owner in this census |
|---|---|---|---|
| `MantineListingGalleryPattern.tsx` | 1 | yes / yes / 7 / 0 | **794**: remove all Tailwind (R7) |
| `GalleryStaticFrame.tsx` | 1 | no / no / 5 / 0 | **794**: migrate, enrol, own Story section (R9) |
| `GalleryIsland.tsx` | 1 | no / no / 0 / 0 | **794**: container-exempt (GR-1 D81-2: 0 `className`, renders only `ListingGallery`) |
| `ListingGallery.tsx` (dynamic, by hand) | 1 | no / no / 15 / 1 (`button`) | **794**: becomes a pure container of the pattern (R8). Its tier-2 `button` import is removed |
| `ListingDetailView.tsx` | 1 | yes / yes / 1 / 0 | **794**: the one `className` (`hidden`) goes (R7) |
| `LightboxView`, `GalleryDesktopNavigation`, `GalleryThumbnailButton`, `GalleryNavActionIcon`, `AppImage`, `MediaPlaceholder` | 1 | yes / yes | migrated, unchanged here |
| `MantineListingDetailPattern`, `MantineListingContactPattern`, `MantineListingPrice`, `MantineListingCardTrack`, `MantineListingCardPattern`, `MantineCopyIdButton`, `ListingCard`, `SimilarListingsView`, `RecentlyViewedGridView`, `ListingsPageFrame`, `ListingBackButton`, `ListingStatusBanner`, `ListingFeatureIcon`, `FavoriteButton` | 1 | yes / yes | migrated, untouched |
| `ListingReportDialog.tsx` (+ tier-2 `button`, `dialog`, `label`, `textarea`) | 1/2 | no / no / 15 / 7 | **795** (reserved, Sprint 71) |
| `MapWrapper.tsx` | 1 | no / no / 1 / 0 | **839** (reserved, Sprint 71) |
| `ListingShareButton.tsx` | 1 | no / yes / 0 / 0 | **838** (reserved) |
| `RecentlyViewedSection`, `RecentlyViewedGrid`, `RecentlyViewedTracker`, `SimilarListings`, `ViewTracker` | 1 | no / no | **913** (reserved, Sprint 71) |
| `ClearRecentlyViewedButton.tsx` | 1 | no / yes / 6 / 6 | **814** (Sprint 74) |
| `ViewAllLink.tsx` | 1 | no / no / 0 / 0 | **834** (reserved) |

Every node outside the gallery subtree already has an open owning task, so no new number is filed. Re-run this census
at I0 and after the final write.

### 3.2 Visual source map

| Visible artifact / state | Today (component · selector) | Utility, cascade and token path | Disposition |
|---|---|---|---|
| SSR photo frame (before JS) | `GalleryStaticFrame` 4×2 grid, `rounded-2xl` (16px), cover in left half from `md`, 4 grey cells | Tailwind `grid-*`, `h-[var(--listing-gallery-h-*)]`, `bg-muted` | **changed**: one full-width photo frame, radius `lg` (8px), the same three height tokens, `bg="gray.2"`. From `sm`, a thumbnail-row reservation when there is more than 1 image (R3) |
| SSR photo | raw `<img>` `absolute inset-0 w-full h-full object-cover` | Tailwind | **changed mechanism, same paint**: `AppImage.module.css` `imageLayer` + `fitCover` (F18) |
| SSR "All photos" placeholder | `#gallery-btn-placeholder` 20px + `mt="sm"` | `theme.other.iconSize.roomy` | **removed**: replaced by the thumbnail-row reservation |
| Interactive gallery, multi photo, ≥ `sm` | legacy grid + side tiles + "All photos" link | Tailwind + shadcn `Button` | **replaced** by the pattern: main photo, arrows, counter badge, square thumbnail strip |
| Interactive gallery, multi photo, < `sm` | legacy grid + "N photos" button + "All photos" link | Tailwind + shadcn | **replaced** by the pattern's swipe track + counter badge |
| Counter badge | pattern `:125-129` | module `.photoCountBadge` (bg/colour) + Tailwind position/padding/radius/type | **changed mechanism, same computed values** (R7, §10.6) |
| Empty gallery | pattern `Paper withBorder` + lucide `Maximize2`; legacy `aspect-[16/9]` grey | Tailwind | **changed**: `MediaPlaceholder` inside the shared frame (R11). It is the same placeholder a failed photo already shows |
| Route loading skeleton, gallery block | `loading.tsx:47-64` 4×2 grid | Tailwind | **changed**: mirrors the new frame + reservation (R19) |
| Lightbox | `LightboxView` | enrolled, Task 825 | **preserved** (R6) |

### 3.3 Canonical UI decision record

| Visible artifact | Searches and inspected paths | Canonical owner | Disposition | Registration |
|---|---|---|---|---|
| Listing gallery on the page | `gallery`, `lightbox`, `thumbnail`, `photo` over `src/design-system/mantine/patterns/`, `src/modules/listings/components/`, `src/stories/**`; opened `MantineListingGalleryPattern.tsx` + `Patterns/Mantine/ListingGalleryPattern`, `ListingGallery.tsx`, `LightboxView.tsx` + `Mantine/Primitives/LightboxView` | `MantineListingGalleryPattern` | **reuse** on the page; **extend** it (R4, R5, R6, R7, R11) | already in manifest + Story |
| Photo frame geometry, shared by the SSR frame and the pattern | same queries plus `frame`, `AspectRatio`, `Paper`; opened `AppImage.tsx`/`.module.css`, `MediaPlaceholder.tsx`, the pattern's empty-state `Paper` | **new named export `MantineListingGalleryFrame` in `MantineListingGalleryPattern.tsx`**, composed of Mantine `Paper radius="lg" pos="relative" bg="gray.2"`, responsive `h` with the three existing `--listing-gallery-h-*` vars, and `AppImage.module.css` `.frameClip` | **compose** (GR-0): existing Mantine component + existing tokens + existing class, exported once so two consumers cannot drift | covered by the pattern file's manifest entry and Story |
| SSR static frame | `GalleryStaticFrame.tsx`; no canonical Story imports it (census `story:no`) | `GalleryStaticFrame` (stays at its path, because `eslint.config.mjs:77-82` names it) | **extend** to compose `MantineListingGalleryFrame` | **enrol** in `scripts/mantine-migration-scope.json`; own sections in the pattern Story file (R9, R10) |
| Empty gallery / no cover | `placeholder`, `empty`, `no photo`; opened `MediaPlaceholder.tsx`, `MantineEmptyLoadingErrorState` | `MediaPlaceholder` (`iconSize="hero"`, `label=""`) | **reuse** | none needed |
| Counter badge line-height | `lineHeight` keys in `theme.ts` | `theme.other.lineHeight` | **extend** with `galleryCountBadge: '1rem'` (16px, the Tailwind `text-xs` line-height measured at I0), under D71-4 | typed in `MantineThemeOther` |
| Thumbnail-row reservation | `galleryThumb` | `theme.other.boxSize.galleryThumb` + `mt="xs"` (the pattern's own `ScrollArea mt="xs"`) | **reuse**, then measure equality (R3) | none |

`GR-0 CANONICAL REUSE PREFLIGHT — request: production listing gallery + SSR frame + empty state + counter badge; semantic queries: gallery, lightbox, thumbnail, photo, frame, placeholder, empty, counter, lineHeight; inspected candidates: MantineListingGalleryPattern.tsx + Patterns/Mantine/ListingGalleryPattern, ListingGallery.tsx, GalleryStaticFrame.tsx, LightboxView.tsx + Mantine/Primitives/LightboxView, AppImage.tsx + Mantine/Primitives/AppImage, MediaPlaceholder.tsx, MantineEmptyLoadingErrorState.tsx, theme.ts lineHeight/boxSize/spacing/radius; decision: REUSE (pattern, MediaPlaceholder, tokens) + COMPOSE (MantineListingGalleryFrame from Paper + existing vars + .frameClip) + EXTEND (pattern props, theme lineHeight key under D71-4); selected canonical owner: src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx; Mantine/TailAdmin token path: theme.ts spacing xs/micro, radius lg/pill, fontSizes.xs, boxSize.galleryThumb, lineHeight.galleryCountBadge (new), globals.css --listing-gallery-h-*; new hardcoded visual values: NONE; rationale: the page must render the owner-accepted pattern (D88-5) and the SSR frame must share its geometry from one owner.`

`GR-3a STORY PREFLIGHT — GalleryStaticFrame × {multi, single, no cover}; MantineListingGalleryPattern × single; canonical candidates: Patterns/Mantine/ListingGalleryPattern (imports the pattern directly, :8), Patterns/Mantine/ListingDetailView (renders GalleryStaticFrame only through ListingDetailViewBody, a composition); direct-import evidence: ListingGalleryPattern.stories.tsx:8 for the pattern, NONE for GalleryStaticFrame; toolbar coverage: locale=globals.locale toolbar, viewport=toolbar; decision: EXTEND; target: Patterns/Mantine/ListingGalleryPattern (new export ClosedStates); rationale: the frame's geometry contract is the pattern's, so its proof belongs on the pattern's page beside it; no second page.`

### 3.4 Type-scale table (GR-3c)

| Element | Role | base | sm | md | lg | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| Counter badge text ("3 / 9") | label | 12px | 12px | 12px | 12px | `fontSizes.xs`; line-height `lineHeight.galleryCountBadge` (16px) | Tailwind `text-xs`, measured at I0 (R7) |
| Story section labels | label (Story chrome) | 12px | 12px | 12px | 12px | `Text size="xs"` | unchanged idiom (`ListingGalleryPattern.stories.tsx:53`) |

There is no heading, and no text at 24px or more.

### 3.5 Width and gutter contracts (GR-3b, GR-3d) for the owner-matrix Stories

- **`Patterns/Mantine/ListingGalleryPattern` (`Default`, new `ClosedStates`).**
  - Width: fluid. In production the gallery fills the left column (F8). Fluid inside the profile gutter matches
    that below `lg`.
  - GR-3d: the pattern has no own gutter on any side, so `profile` on all four. `StoryPageGutter` all is present at
    `:50`; `ClosedStates` wraps the same way. Action: `profile present` (`Default`), `wrap in this task`
    (`ClosedStates`).
- **`Patterns/Mantine/ListingDetailView` — `PublicListing`** (blast radius: the gallery inside it changes).
  - Width: production `ListingsPageFrame`.
  - GR-3d: `own gutter (src/modules/listings/components/ListingsPageFrame.tsx:93-94`,
    `px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }} py="xl"`) on all four sides; the Story has `skipCanvas`
    (fixed by Task 912 §16). Action: none expected; re-measure.
- **`Patterns/Mantine/ListingDetailPattern` — `Default`** (blast radius: its internal gallery is this pattern).
  - Width: fluid inside `StoryPageGutter` (`:302`).
  - GR-3d: `profile` on all four (`:302`). Action: `profile present`.

GR-3e: the only changed popup is the lightbox, which has icon buttons only. There are 0 text buttons, so the rule
yields nothing, but the receipt is still owed. GR-3f: no circular element changes (the counter badge is a pill, and the
arrows are `GalleryNavActionIcon`, unchanged). GR-3g: the shared frame clips its photo, but no line sits inside it,
because the old empty-state border is removed. The thumbnail active border (`GalleryThumbnailButton`) is unchanged and
sits in an unclipped `ScrollArea`. Both rules therefore produce "none" receipts with the measurement in §13.4.

### 3.6 Reference research (GR-7)

Audit run in this session on 2026-10-04 with Playwright 1.60.0 (`win32`). Scripts, logs, inventories and screenshots
are in `docs/sessions/evidence/task794/research/`.

**Route inventory** (crawler `gr7-crawl.mjs`; same-scope links followed until the queue was empty):

| Reference | Entry (final URL) | Enumerated | Inspected | Blocked | Inventory |
|---|---|---|---|---|---|
| TailAdmin | https://demo.tailadmin.com/ | 167 visits / 87 unique routes | 167 (all HTTP 200) | 0 | `inventory-tailadmin.json` |
| Lahomes | https://techzaa.in/lahomes/admin/ | 107 | 107 (all 200) | 0 | `inventory-lahomes.json` |
| Kamr | https://kamr-vite.vercel.app/dashboard (demo login "Sign Me In") | 62 visits / 61 unique | 62 (all 200, signed in) | 0 | `inventory-kamr.json` |
| Rozetka (owner's gallery reference, Task 813 → 824) | https://rozetka.com.ua/ua/mobile-phones/c80003/ | 2 | 1 | 1 | `operate-log-rozetka.json`, `operate2-log.json` |

**Page-level evidence** (pages that carry a photo gallery, carousel or lightbox, plus the domain analogues):

| Ref | URL | Discovery | Operated / observed | Evidence | Supports |
|---|---|---|---|---|---|
| Kamr | `/ecom-product-detail` | Apps → Shop → Product Details | Main photo 423×482 with 4 square thumbs 99×99 below, ≈9px apart. Clicking thumb 2 switches the main photo (`1-…jpg` → `2-…jpg`) and opens nothing. At 390: main 334×380, 4 thumbs stay. | `op-kamr-product-detail-1440.png`, `op2-kamr-product-detail-thumb2.png`, `op2-kamr-product-detail-390.png`, `operate2-log.json` | main photo + square strip; a thumbnail **selects only** (= D824-3) |
| Kamr | `/uc-lightgallery` | Plugins → Light Gallery | Clicking tile 1 opens lightGallery: backdrop `rgba(30,30,30,0.9)`, counter "1 / 8", prev/next/close/zoom controls, strip of 8. ArrowRight → 2/8 → 3/8; ArrowLeft → 2/8; Next button → 3/8; thumb 6 → 6/8; 4× ArrowRight from 6 → 2/8 (**wraps**); Escape closes. | `op2-kamr-lightgallery-open.png`, `op2-kamr-lightgallery-nav.png`, `operate2-log.json` | lightbox keys with wrap, thumbnail jump, counter, Esc (R6) |
| Kamr | `/guest-details` | Customers → Guest Details | Room-photo Swiper, slides 731×438 `object-fit: cover`. Next moves one slide. | `kamr-003.png`, `op-kamr-guest-details-1440.png` | one-photo-per-step track |
| Kamr | `/ui-carousel` | Bootstrap → Carousel | Bootstrap carousel; next control advances 0 → 1. | `kamr-032.png`, `op-kamr-ui-carousel-1440.png` | — |
| Lahomes | `/property-details.html` | Property → Property Details | **One** hero photo 768×336, radius 5.6px, "For Sale" badge. No thumbnails, arrows or counter. Clicking opens nothing. 310×135 at 390. | `lahomes-property-details-1440.png`, `lahomes-property-details-390.png`, `operate-log.json` | the domain analogue has no gallery; it offers no counter-pattern |
| Lahomes | `/agents-details.html`, `/index.html` | Agents → Agent Details; Dashboards | Bootstrap carousel 308×206 / 216×144, radius 5.6px, prev/next controls. Next 0 → 1; ArrowRight with focus 1 → 2. | `op-lahomes-agents-details-carousel.png`, `op-lahomes-index-carousel.png` | arrow-key stepping |
| Lahomes | `/ui-carousel.html`, `/extended-swiper-silder.html`, `/property-grid.html`, `/customers-details.html`, `/post-details.html` | Base UI / Extended UI / Property / Customers / Post | Carousels 384×256 radius 0 (the first has no controls); Swipers; a card grid and detail pages with no gallery. | `lahomes-054.png`, `lahomes-071.png`, `lahomes-*-1440.png`/`-390.png`, `op-lahomes-ui-carousel-carousel.png` | — |
| TailAdmin | `/carousel` | UI Elements → Carousel | 4 Swiper variants 489×300, radius **8px**, 1px border `rgb(228,231,236)`, slide image radius 0. **The next-arrow click was not operated:** the selector hit the 487×298 slide container, so the active index stayed 0. Geometry only. | `tailadmin-069.png`, `op-tailadmin-carousel-1440.png`, `op-tailadmin-carousel-390.png` | photo-frame radius 8px (= theme `lg`, the pattern's frame) |
| TailAdmin | `/images` | UI Elements → Images | Static image grid, radius 12px, 1px border. Clicking opens nothing. | `tailadmin-images-1440.png`, `op-tailadmin-images-1440.png` | — |
| Rozetka | `/ua/mobile-phones/c80003/` | entry | Category grid, no gallery. | `op-rozetka-category.png` | — |
| Rozetka | `/ua/samsung-sm-s741blggeuc/p613521086/` | first product on the category | **Blocked:** the anti-bot interstitial "Трохи зачекайте…" stayed for 8 × 4s. | `op2-rozetka-product-1440.png`, `operate2-log.json` | **UNVERIFIED** |

**Comparison.**
- **Main photo plus a square thumbnail strip with select-only thumbnails** is demonstrated by Kamr's product detail.
  The pattern already has it (D824-3). Lahomes' property page and TailAdmin show no such gallery.
- **Lightbox with counter, prev/next, arrow keys with wrap, thumbnail jump and Esc** is demonstrated by Kamr's
  lightGallery. lero.al's `LightboxView` has the same set **only while `ListingGallery` supplies the keys** (F3, F6).
  Moving to the pattern would drop the keys, so R6 keeps them.
- **Frame radius 8px:** TailAdmin `/carousel` matches the pattern's `rounded-lg`. Lahomes uses 5.6px and Kamr 0.
- **Below `sm`:** Kamr keeps thumbnails at 390, while lero.al hides them and swipes (owner D824-1). The owner decided
  this; it is not reopened.
- **SSR placeholder / LCP swap:** no reference can show it (not observable from outside), so it is **absent** from the
  references. It is decided by lero.al's LCP constraint (§10.1).
- **Download/zoom controls** (Kamr): no lero.al requirement. **Not adopted.**

**Chosen pattern.** The owner-accepted `MantineListingGalleryPattern` (D88-5; visuals accepted in 824/825). Its
behaviour matches Kamr `/ecom-product-detail` + `/uc-lightgallery`, and its frame radius matches TailAdmin
`/carousel`.

**lero.al data map.**

| Surface | Entity / fields | Actions / guards | Routes | Existing UI → after |
|---|---|---|---|---|
| Public listing page | `listing_images(url, is_cover, order)` through the listing select (`page.tsx:68`, `:151`); sorted cover-first (`:209-214`); `coverImage` → preload link + static frame | none: the gallery is read-only, no server action | `/[locale]/listings/[slug]` | `GalleryStaticFrame` → `GalleryIsland` → `ListingGallery` → `LightboxView` ⇒ `GalleryStaticFrame` (frame geometry) → `GalleryIsland` → `ListingGallery` (container) → `MantineListingGalleryPattern` → `LightboxView` |
| Staff preview | same select (`preview/page.tsx:41`), same sort (`:66-71`) | staff-only route; `isStaffPreview` does not touch the gallery | `/admin/listings/[id]/preview` | same as above |
| Pattern props filled | `images` = `sortedImages.map(({ url }) => ({ url }))`; `title` = `listing.title` (alt + main-photo `aria-label`); `labels` = `close: listing.close_gallery`, `prev: common.aria_prev`, `next: common.aria_next`, `counter: (i, n) => \`${i} / ${n}\`` (today's format, F3 `:152-157`) | — | — | — |

`absent or unverified`: Rozetka product gallery (blocked); TailAdmin carousel arrow operation (selector miss). Neither
decides anything here. The owner accepted the gallery's visuals in 824/825, and this task does not change them (§9).

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| R1 | D88-5 | After hydration, both routes render `MantineListingGalleryPattern` inside `#gallery-interactive-shell`, and nothing from the legacy grid. | P1 | AC1 | Confirmed |
| R2 | Sprint 71 goal, D71-1 | The SSR HTML of both routes contains `#gallery-static-frame` with a cover `<img fetchpriority="high" loading="eager">` whose `srcset`/`sizes` equal the preload `<link>`. `GalleryIsland` keeps `ssr: false`. The swap still keys on `#gallery-wrapper-static` / `#gallery-interactive-shell` in one effect. | P1 | AC2 | Confirmed |
| R3 | Sprint 71 goal (zero CLS) | Revealing the pattern moves nothing: the element after the gallery keeps its top, and no `layout-shift` entry has a source inside the gallery. Covers ≥ 2 photos, exactly 1 photo and 0 photos, at 390 / 768 / 1024 / 1440. | P1 | AC3 | Confirmed |
| R4 | F7 | The pattern's first committed client render already shows the correct mode for the viewport (desktop: arrows + thumbnail row; mobile: track). There is no base→desktop flip after the shell is revealed. | P1 | AC4 | Confirmed |
| R5 | F3 `:98`, F5 | The photo visible on the pattern's first render is an `AppImage` with `priority`, so it paints opaque without a fade at the swap. Other photos stay lazy. | P1 | AC5 | Confirmed |
| R6 | 612 row (F12), GR-7 | With the lightbox open at ≥ `sm`, ArrowRight/ArrowLeft step one photo per press and wrap. They do nothing once it is closed. Below `sm`, the existing track keys still step exactly one photo per press (no double step). Prev/next buttons, thumbnail jump, counter, close (X/Esc/backdrop), portal + z-index above header and contact card, scroll lock and focus return all hold. | P1 | AC6, AC7 | Confirmed |
| R7 | Task 829 owner decision 2026-09-17 | `MantineListingGalleryPattern.tsx`, `GalleryStaticFrame.tsx`, `ListingGallery.tsx` and `ListingDetailView.tsx` contain no Tailwind utility. `scripts/enrolled-tailwind-baseline.json` has `"entries": {}`, written by `--update-baseline`. The counter badge's computed font-size, line-height, padding, offsets, radius, colours and `pointer-events` equal the I0 values. | P1 | AC8 | Confirmed |
| R8 | GR-1 D81-2 | `ListingGallery.tsx` is a pure container: 0 `className`, no `@/components/ui/*` import, no JSX besides the pattern. `ListingGallery.module.css` is deleted (its only consumer is `ListingGallery.tsx`). | P2 | AC9 | Confirmed |
| R9 | clause 16c/16d, GR-3 | `GalleryStaticFrame.tsx` is in `scripts/mantine-migration-scope.json`, and a canonical Story imports it by name. Census rows that turn stale are dropped by their writers (remove-only). | P1 | AC10 | Confirmed |
| R10 | GR-3a, owner matrix | `Patterns/Mantine/ListingGalleryPattern` gains export `ClosedStates` (no `play`) with sections: multi (9), single (1), empty, static frame multi, static frame single, static frame no cover. `Default` keeps its `play`. The stale "or a thumbnail" wording is corrected in 4 locales. | P2 | AC11 | Confirmed |
| R11 | GR-0 REUSE, F17 | The pattern's empty state and the static frame's no-cover state are `MediaPlaceholder iconSize="hero" label=""` inside `MantineListingGalleryFrame`. lucide `Maximize2` leaves the pattern. | P2 | AC12 | Confirmed |
| R12 | F10 | `sizes` describes the new geometry. One constant feeds the `gallery-main` variant, `GALLERY_MAIN_SIZES`, the preload link and the static frame. At DPR 1 and 2, the browser's chosen candidate is at least the rendered width × DPR (or the largest 1600w candidate). | P2 | AC13 | Confirmed |
| R13 | clause 3, D88-5 | Removing these legacy controls is **authorised** by D88-5 (the page renders the pattern). Each has a replacement path: mobile "All photos (N)" link and "N photos" button → tap the photo; desktop 4 side tiles + "+N photos" overlay + "All photos (N)" link → thumbnail strip + click on the main photo; "N photos" count → counter badge "i / N". Nothing else is removed. | P2 | AC14 | Confirmed |
| R14 | 612 row, clause 9 | The registry row (`:119`) names the new component path and test. The smoke test opens through the main photo and scopes the counter to the dialog. The Playwright script uses no Tailwind/legacy class hook. Arm 12's control becomes `ListingReportDialog.tsx`. The three stale entropy-allowlist entries (F14) are removed. | P2 | AC7, AC15 | Confirmed |
| R15 | D71-1 | A real `next start` request to the detail route in 4 locales returns the gallery markup, and the server log body has no error. `check:hydration` passes on the listing-detail path. | P1 | AC16 | Confirmed |
| R16 | F21 | `docs/mantine-responsive-design-system.md` §11 (`:664`) and §17 (`:811`) record the gallery as resolved by D88-5 + Task 794. | P3 | AC17 | Confirmed |
| R17 | Sprint 71 exit 3 | The route's First Load JS (build route table) is recorded before and after, with the delta explained. The boundary does not move. | P2 | AC18 | Confirmed |
| R18 | D71-2, Q4 | Owner visual matrix §13.5. | P1 | owner | Confirmed |
| R19 | F15 | The gallery block of `[slug]/loading.tsx` mirrors the new geometry (shared frame + reservation), using no Tailwind in that block. | P2 | AC3 (loading arm) | Confirmed |

## 5. Assumptions and open questions

- **FACT / orchestrator decision (not an owner product decision): the LCP route.** Keep the SSR static frame and the
  `ssr: false` island, and swap the island's content. Server-rendering the pattern directly was rejected for three
  reasons. It would move the boundary (Sprint 71 exit 3). Its `useMatches` would render the mobile track during SSR on
  every device (F7). And it would add the pattern + lightbox to the hydration path. The chosen route is reversible and
  changes no boundary.
- **INFERENCE:** the thumbnail-row reservation equals `mt="xs"` + `boxSize.galleryThumb` (52px) because the row is a
  `ScrollArea` with `scrollbarSize={0}` around 44px squares. **I0 measures the real row height.** If it differs and no
  existing token expresses it, stop with `BLOCKED — R3 reservation token` and report the measured value. Do not write
  a raw value.
- **UNKNOWN until I0:** a live published listing with **exactly one** Cloudinary photo. If none exists, the 1-photo
  route arm of AC3 is `BLOCKED (no data)`. Do not seed data (793 N3). Storybook still proves the single state.
- **UNKNOWN until execution:** a staff session for `/admin/listings/[id]/preview`. Without one, its route arms are
  `BLOCKED`, as in 791 R7. The view is shared, so the public route plus Storybook still prove the component.
- None of the following is ambiguous or conflicting, and none needs an owner decision.

## 6. Pre-read rule bundle

- `docs/golden-rules.md`: GR-0, GR-1 (with the container exemption), GR-2, GR-3, GR-3a, GR-3b, GR-3c, GR-3d, GR-3e,
  GR-3f, GR-3g, GR-4.
- `docs/agent-contract.md`: clauses 1, 3, 5, 7, 9, 14, 15, 16b-16d.
- `docs/qa-profiles.md`.
- `docs/critical-flow-registry.md` row `:119`.
- `docs/mantine-responsive-design-system.md` §7 (responsive props), §18 (pitfalls), §26 (icons: this task removes a
  lucide icon and adds none).
- `docs/component-rules.md` → "Container / Presentational Primitive Split".
- `tasks/Sprints/Sprint_71_The_Listing_Detail_Route_Leaves_Tailwind.md` → D71-1…D71-4.
- `docs/orchestrator-procedures.md` → corollaries 818/819 (encoding, hash witnesses) and 791 (read `start.log`).

## 7. Scope

Production:
1. `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx`: R4, R5, R6, R7, R11, plus the
   `MantineListingGalleryFrame` export.
2. `src/design-system/mantine/patterns/MantineListingGalleryPattern.module.css`: the counter badge's non-prop
   declarations (§10.6).
3. `src/modules/listings/components/GalleryStaticFrame.tsx`: R2, R3, R11.
4. `src/modules/listings/components/ListingGallery.tsx`: R8; it keeps the swap.
5. `src/modules/listings/components/ListingGallery.module.css`: **delete**.
6. `src/modules/listings/components/ListingDetailView.tsx`: the gallery slot only (`:311-344`). Pass `imageCount`,
   drop `#gallery-btn-placeholder`, and replace `className="hidden"` with the `hidden` attribute.
7. `src/design-system/mantine/theme.ts`: the `lineHeight.galleryCountBadge` key + type (§10.6).
8. `src/lib/imageDelivery.ts`, `src/design-system/media/appImageConfig.ts`: R12.
9. `src/app/[locale]/listings/[slug]/loading.tsx`: the gallery block only (R19).

Stories, tests, governance and docs:

10. `src/stories/patterns/mantine/ListingGalleryPattern.stories.tsx`: R10.
11. `messages/{sq,en,uk,it}.json`: `storybook.mantine.listing_detail_gallery_section_*` keys only (R10).
12. `src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx`: R6/R14.
13. `scripts/task612-qa-listinggallery-lightbox-portal.mjs`: selectors (R14).
14. `scripts/check-surface-census-changed.mjs`: arm 12's `controlSurface` constant only (R14).
15. `scripts/enrolled-tailwind-baseline.json` (writer only), `scripts/mantine-migration-scope.json` (one entry),
    `scripts/surface-census-baseline.json` (writer only), `scripts/governance/tailwind-entropy.allowlist.json`
    (three stale entries).
16. `docs/critical-flow-registry.md` row `:119`; `docs/mantine-responsive-design-system.md` `:664`, `:811`.
17. Session log, evidence directory `docs/sessions/evidence/task794/`, and 794's backlog line.

## 8. Out of scope

- `LightboxView.tsx` and its Story. Its visuals were accepted in 825, and R6's key handling lives in the pattern
  (§10.4). If AC6 cannot pass without touching it, stop and report.
- `GalleryDesktopNavigation`, `GalleryThumbnailButton`, `GalleryNavActionIcon`, `AppImage`, `MediaPlaceholder`: reused
  unchanged.
- `useSwipeTrackSync` behaviour (D824-1).
- The rest of `loading.tsx`: its non-gallery layout is not in `ListingDetailView`'s census (it is a route-level
  Suspense shell that 792 migrated Skeleton-only). This task touches only the block whose stated job is to mirror the
  gallery.
- Every census node owned by 795, 814, 834, 838, 839 and 913 (§3.1).
- `messages/*.json` product keys: `all_photos` and `photo_count` keep consumers (F20). No product string is added.

## 9. Current and required behavior

| Aspect | Current (preserve where marked) | Required |
|---|---|---|
| SSR paint | Cover `<img fetchpriority=high>` in HTML before JS (**preserve**) | Same element and attributes, inside the pattern-shaped frame |
| Swap | One effect: remove `#gallery-wrapper-static`, reveal `#gallery-interactive-shell` (**preserve**) | Same ids and timing; reveal by clearing the `hidden` attribute |
| Sort order | Cover first, then `order` (**preserve**, done by both routes) | Unchanged; the container passes images in the given order |
| Desktop gallery | 4×2 grid, 4 side tiles, "+N" overlay, "All photos (N)" link | Pattern: main photo, arrows when there are 2+ photos, counter badge, square strip; a thumbnail selects only |
| Mobile gallery | Grid cell, "N photos" button, "All photos (N)" link above | Pattern: swipe track, counter badge, tap opens the lightbox |
| Lightbox | `LightboxView`, keys from `ListingGallery` (**preserve all behaviour**) | Same `LightboxView`; keys owned by the pattern |
| 1 photo | Single photo, no side tiles, no "All photos" | Pattern: single photo, no arrows/counter/strip; tap/click opens the lightbox |
| 0 photos | Grey `aspect-[16/9]` box with `Maximize2` | Shared frame with `MediaPlaceholder`, same heights as the SSR frame |
| Non-Cloudinary cover | Static frame shows grey, then the island shows the photo (**preserve**) | Static frame shows `MediaPlaceholder`, then the pattern shows the photo |
| Route skeleton | 4×2 grid block | Frame + reservation, matching the new gallery |

## 10. Implementation requirements

### 10.1 The LCP mechanism (R2)

- `GalleryIsland` keeps `next/dynamic(() => import('./ListingGallery'), { ssr: false })`.
- `ListingGallery` keeps the swap effect, keyed on the two ids. Replace `shell.classList.remove('hidden')` with
  clearing the `hidden` attribute (`shell.hidden = false`). In `ListingDetailView`, render the shell as
  `<Box id="gallery-interactive-shell" hidden>`.
- The preload `<link>` stays in `gallerySlot` unchanged.

### 10.2 `MantineListingGalleryFrame` and `GalleryStaticFrame` (R3, R11)

- Export `MantineListingGalleryFrame({ children })` from `MantineListingGalleryPattern.tsx`: `Paper radius="lg"
  pos="relative" bg="gray.2"`, `h={{ base: 'var(--listing-gallery-h-mobile)', sm: 'var(--listing-gallery-h-tablet)',
  md: 'var(--listing-gallery-h-desktop)' }}`, `className={appImageStyles.frameClip}`. It has no border, no hook and no
  state.
- The pattern uses it for the main frame (multi and single) and the empty state.
- `GalleryStaticFrame({ coverUrl, title, imageCount })` stays a Server Component at its path. It renders
  `MantineListingGalleryFrame` with:
  - the raw `<img>` (all current attributes, `className={cn(appImageStyles.imageLayer, appImageStyles.fitCover)}`)
    when preload attrs exist;
  - otherwise `MediaPlaceholder iconSize="hero" label=""`.
- Below the frame, when `imageCount > 1`: `<Box visibleFrom="sm" mt="xs" h={theme.other.boxSize.galleryThumb}
  aria-hidden />`, subject to the I0 measurement (§5).
- Keep `id="gallery-static-frame"` and `aria-hidden="true"` on the frame root.
- Delete the four desktop grey cells.

### 10.3 Mode on first render (R4)

- Call `useMatches({ base: true, sm: false }, { getInitialValueInEffect: false })` in the pattern.
- State in the pattern's header comment that it is mounted client-only (the `ssr: false` island and Storybook), and
  that an SSR consumer would need the default.
- Do not change `LightboxView`'s own `useMatches`.

### 10.4 Lightbox keys (R6)

- In the pattern, while `opened && !isMobile`, add one `document` `keydown` listener. ArrowLeft calls `goPrev`,
  ArrowRight calls `goNext`. Remove it on close and unmount.
- Below `sm`, add nothing: the track's own focused-container handler stays the only one (F6).

### 10.5 Priority (R5)

- Add `priority?: boolean` (default `false`) to `MantineListingGalleryPatternProps`.
- When it is `true`, the desktop main `AppImage` and the mobile slide at the initial visible index get `priority`.
  Clone slides and thumbnails never do.
- `ListingGallery` passes `priority`. Stories leave it at the default.

### 10.6 Counter badge without Tailwind (R7)

- At I0, record the badge's computed values at 390 and 1440: `font-size`, `line-height`, `padding-*`, `bottom`,
  `left`, `border-radius`, `background-color`, `color`, `pointer-events`.
- Rebuild it as `Box component="span" pos="absolute" bottom="xs" left="xs" px="xs" py="micro" fz="xs"
  lh={theme.other.lineHeight.galleryCountBadge}`.
- Add `border-radius: var(--mantine-radius-pill)` and `pointer-events: none` to the existing `.photoCountBadge` rule.
  Mantine has no prop for either.
- Add `galleryCountBadge: '1rem'` to `theme.other.lineHeight` and to its type: the `lineHeight: Record<…>`
  declaration, at `theme.ts:178` at `HEAD` `2f1d85845` (locate it by key). Write the provenance
  comment: Tailwind `text-xs` line-height, measured at I0, created under D71-4.
- Remove `cn` from the file if it becomes unused.

### 10.7 `sizes` (R12)

- At 320 / 390 / 768 / 1024 / 1280 / 1440 / 1920, measure the main photo's rendered width on the real route.
- Write one `sizes` string that bounds it, with media conditions on the theme breakpoints (`sm` 640, `md` 768, `lg`
  1024, `xl` 1280) and `vw` or `calc()` widths.
- Define it once and import it in the other file. Either `appImageConfig.ts` imports `GALLERY_MAIN_SIZES`, or the
  reverse; choose the direction with no import cycle. Keep `GALLERY_MAIN_ENTRIES` and `srcsetEntries` equal.

### 10.8 Census control, registry, docs (R14, R16)

- Arm 12: change `controlSurface` to `'src/modules/listings/components/ListingReportDialog.tsx'`, and add a comment
  that 795 must swap it again.
- Registry `:119`:
  - component path: `ListingGallery.tsx` (container) → `MantineListingGalleryPattern.tsx` → `LightboxView.tsx`;
  - the test's new open path (main photo);
  - this task's matrix result.
- Docs `:664` / `:811`: `RESOLVED`. Cite D88-5 and Task 794.

### 10.9 Encoding and writes

- Edit with Node `readFileSync`/`writeFileSync` or the editor tools. Never `Get-Content -Raw` without
  `-Encoding utf8` (corollary 818/819).
- The baselines change only through their writers: `npm.cmd run check:enrolled-tailwind:update-baseline` and
  `npm.cmd run check:surface-census:changed:update-baseline`. Never edit them by hand.

## 11. Positive and negative flows

**Positive.**
1. A visitor opens a listing with 9 Cloudinary photos at 1440.
2. The cover paints from the SSR frame.
3. JS loads and the pattern appears in the same box with its arrows and 9-square strip.
4. Thumbnail 4 shows photo 4. Clicking the main photo opens the lightbox at 4.
5. ArrowRight → 5. Esc closes, and focus returns to the main photo.
6. At 390 the same listing swipes, and a tap opens the lightbox.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| 0 photos | Yes | F3 `:66-72`, F5 `:63-73` | Shared frame + `MediaPlaceholder` before and after the swap, no shift, nothing clickable | AC3, AC12, Story |
| 1 photo | Yes | pattern `:123-136` | No arrows, counter or strip, and no reservation in the SSR frame; click/tap opens the lightbox | AC3, Story |
| Non-Cloudinary cover | Yes | `buildGalleryMainPreloadAttrs` returns null | SSR frame shows the placeholder; the pattern shows the photo; no shift | AC3 (Story arm) |
| Photo fails to load | Yes | Task 886 R41 | `AppImage` placeholder inside the frame (unchanged) | Story |
| JS disabled / island fails | Yes | SSR frame | Cover stays visible in the SSR frame; nothing interactive (as today) | AC2 |
| Staff preview route | Yes | shared view | Same gallery | AC1/AC16 (staff session or `BLOCKED`) |
| Many photos (9+) | Yes | pattern `ScrollArea` | The strip scrolls; the page does not widen | AC3, GR-3b |
| Validation / auth / concurrent writer | No | read-only gallery, no action | — | — |

## 12. Acceptance criteria

- **AC1 [R1]** Given the real route after hydration at 390 and 1440, when the DOM under
  `#gallery-interactive-shell` is read, then it contains the pattern's main-photo button (accessible name = listing
  title), and no element carries `listing-gallery`, `grid-cols-4` or an "All photos" text.
- **AC2 [R2]** Given `curl` of the SSR HTML for 2 locales, when `#gallery-static-frame` is parsed, then it contains
  exactly one `<img>` with `fetchpriority="high"` and `loading="eager"`. Its `srcset` and `sizes` equal the `<link
  rel="preload">` `imagesrcset` and `imagesizes`. `#gallery-interactive-shell` carries `hidden` and contains no gallery
  `<img>`. `GalleryIsland.tsx` still calls `dynamic(…, { ssr: false })`.
- **AC3 [R3, R19]** Given the real route (2+ photos; 1 photo if data exists; 0-photo via the Story arm) at 390, 768,
  1024 and 1440:
  - **Swap:** when a `PerformanceObserver('layout-shift')` and a `rAF` sampler record from navigation until 1s after
    the shell is revealed, then no `layout-shift` source node lies inside `#gallery-wrapper-static` or
    `#gallery-interactive-shell`, and the next sibling block's `top` before and after the reveal differs by less than
    1px.
  - **Loading skeleton:** the same comparison passes between the `loading.tsx` gallery block (rendered through a
    navigation) and the SSR frame.
- **AC4 [R4]** Given the route at 1440, when a `MutationObserver` captures the first frame after `hidden` is cleared,
  then the thumbnail row and the arrows are already present. At 390, the track is already present and the thumbnail
  row is absent.
- **AC5 [R5]** Given the revealed pattern at 1440 and 390, when the visible main `<img>` is read, then it has
  `fetchpriority="high"`, `loading="eager"` and computed `opacity` 1 at the first sampled frame. Every thumbnail
  `<img>` has `loading="lazy"`.
- **AC6 [R6]** Given the smoke test:
  - ≥ `sm` (`matchMedia` reports `40em` matched): ArrowRight/ArrowLeft on `document` step the in-dialog counter
    (`1 / 2` → `2 / 2` → `1 / 2`, and wrap from the last), and do nothing after close.
  - < `sm`: one ArrowRight on the focused track steps exactly once.
  - Prev/next buttons cycle the counter.
  - The dialog is portaled outside the ancestor, with declared `--mb-z-index` > 30.
  - The two Task 886 R43 tests pass.
  - The planted removal of §10.4's listener fails the ≥ `sm` key test, and restoring it passes (hash witnesses).
- **AC7 [R6, R14]** Given `next start` and the updated 612 script at 7 breakpoints × 4 locales, when it runs, then
  28/28 cells pass. The script locates the main photo without any class selector.
- **AC8 [R7]**
  - `npm.cmd run check:enrolled-tailwind` exits 0 and `--update-baseline` leaves `"entries": {}`.
  - `check:enrolled-tailwind:verify` exits 0.
  - The badge's 9 computed values equal the I0 record at 390 and 1440.
- **AC9 [R8]** Given `ListingGallery.tsx`, when the census and a grep run, then it has 0 `className` and no
  `@/components/ui` import, and `ListingGallery.module.css` no longer exists and has no importer.
- **AC10 [R9]** `GalleryStaticFrame.tsx` is a manifest entry. `check:story-coverage` exits 0. The `ListingDetailView`
  census reports `GalleryStaticFrame` `manifest:yes story:yes`. `check:surface-census:changed` exits 0 after its writer
  ran, and the writer only removed rows.
- **AC11 [R10]**
  - `ClosedStates` renders the six sections in 4 locales.
  - `Default` still opens the lightbox in its `play`.
  - `check:i18n` exits 0.
  - The section-default label no longer says a thumbnail opens the lightbox.
- **AC12 [R11]** The pattern's empty state and the static frame's no-cover state each render one
  `[data-testid="media-placeholder"]` inside the frame. `MantineListingGalleryPattern.tsx` has no `lucide-react`
  import.
- **AC13 [R12]** At 390 / 768 / 1024 / 1440 and DPR 1 and 2, the main `<img>`'s chosen candidate width (from
  `currentSrc`) is at least its rendered CSS width × DPR, or is the 1600w candidate. One `sizes` definition is
  imported by the other file (grep shows one string literal).
- **AC14 [R13]** At 390 and 1440 on the real route:
  - the counter badge reads `1 / N` for an N-photo listing;
  - tapping/clicking the main photo opens the lightbox at the current photo;
  - every photo is reachable through the strip (≥ `sm`) or the track (< `sm`).
- **AC15 [R14]**
  - `check:surface-census:changed:verify` exits 0 with arm 12 naming `ListingReportDialog.tsx`.
  - Registry `:119` names the new path.
  - `tailwind-entropy.allowlist.json` has no `ListingGallery.tsx` entry, and its consumer (`node.exe
    scripts\governance\tailwind-entropy.mjs`) exits as it did at I0.
- **AC16 [R15]** Given `next start` and a real request to `/{sq,en,uk,it}/listings/$slug`, when the body and
  `start-final.log` are read, then each body holds `#gallery-static-frame`, and `start-final.log` holds no `Error`.
  `check:hydration` with `HYDRATION_LISTING_PATH=/en/listings/$slug` passes.
- **AC17 [R16]** Docs `:664` and `:811` read `RESOLVED` with D88-5 + Task 794.
- **AC18 [R17]** The session log quotes the `/[locale]/listings/[slug]` route-table line from the I0 build and from
  the final build, and explains the delta.

`GR-4 AC AUDIT — 18 criteria; each states an observable property; absolutes: none.` (The two "< 1px" tolerances
compare two renders of token-identical boxes, where only sub-pixel rounding can differ.)

## 13. QA profile and verification plan

**Q4.** It touches critical-flow row `:119` (Task 612), migrates the visible gallery of a page shell (Q3 visual
matrix), and changes a governance baseline. Plan state: `from-scratch`.

### 13.1 I0 baseline (before any write)

```powershell
$slug = "shitet-gazonjere-ne-pogradec-mtu8u1lg"
node.exe -p process.platform
git --no-optional-locks status --porcelain
git hash-object src\design-system\mantine\patterns\MantineListingGalleryPattern.tsx src\modules\listings\components\GalleryStaticFrame.tsx src\modules\listings\components\GalleryIsland.tsx src\modules\listings\components\ListingGallery.tsx src\modules\listings\components\ListingGallery.module.css src\modules\listings\components\ListingDetailView.tsx src\stories\patterns\mantine\ListingGalleryPattern.stories.tsx src\modules\listings\components\__tests__\ListingGallery.portal.smoke.test.tsx scripts\task612-qa-listinggallery-lightbox-portal.mjs scripts\enrolled-tailwind-baseline.json src\lib\imageDelivery.ts src\design-system\media\appImageConfig.ts scripts\mantine-migration-scope.json docs\critical-flow-registry.md
node.exe scripts\check-surface-census.mjs --surface src\modules\listings\components\ListingDetailView.tsx
npx.cmd vitest run src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx
npm.cmd run check:enrolled-tailwind
npm.cmd run check:surface-census:changed:verify
node.exe scripts\governance\tailwind-entropy.mjs
npm.cmd run build
```

Expected:
- `win32`; no §7 path dirty (start precondition).
- Hashes are compared with F23. A file whose hash differs because a commit after `2f1d85845` changed it
  (`git log --oneline 2f1d85845..HEAD -- <file>` lists it) is **not** a stop. Re-read every line this kickoff cites
  in that file and record whether each fact still holds. A cited fact that no longer holds is a stop: report it.
- Census = §3.1.
- Smoke test passes (record the list).
- `check:enrolled-tailwind` exit 0 with 27 baselined keys.
- Verify passes. Record the entropy output and the route-table line (AC18).

Then, with `npm.cmd run start` on the I0 build:
- **Slug.** Confirm that `$slug` resolves (an HTTP 200 body containing `#gallery-static-frame`). If it does not,
  pick a published listing with ≥ 2 Cloudinary photos, set `$slug`, and record why.
- **Data.** Look for a 1-photo and a 0-photo listing (§5).
- **Before-measurements.** Record the counter badge's computed values (§10.6), the row height (§5), the main photo's
  rendered widths (§10.7), and the AC3 sampler output as the "before" reference.
- Save `start-i0.log`.

### 13.2 Final gate block (after the last write, one pass, transcript retained, exit code after each command)

```powershell
$slug = "shitet-gazonjere-ne-pogradec-mtu8u1lg"
node.exe -p process.platform
npx.cmd vitest run src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx
npm.cmd run test:listings
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:design-tokens
npm.cmd run check:enrolled-tailwind
npm.cmd run check:enrolled-tailwind:verify
npm.cmd run check:story-coverage
npm.cmd run check:pattern-enrolment
npm.cmd run check:rendered-scope
npm.cmd run check:rendered-scope:verify
npm.cmd run check:surface-census:changed
npm.cmd run check:surface-census:changed:verify
npm.cmd run check:i18n
npm.cmd run check:stories
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
node.exe scripts\governance\tailwind-entropy.mjs
npm.cmd run build
npm.cmd run build-storybook
git hash-object src\design-system\mantine\patterns\MantineListingGalleryPattern.tsx src\design-system\mantine\patterns\MantineListingGalleryPattern.module.css src\modules\listings\components\GalleryStaticFrame.tsx src\modules\listings\components\GalleryIsland.tsx src\modules\listings\components\ListingGallery.tsx src\modules\listings\components\ListingDetailView.tsx src\design-system\mantine\theme.ts src\lib\imageDelivery.ts src\design-system\media\appImageConfig.ts "src\app\[locale]\listings\[slug]\loading.tsx" src\stories\patterns\mantine\ListingGalleryPattern.stories.tsx src\modules\listings\components\__tests__\ListingGallery.portal.smoke.test.tsx scripts\task612-qa-listinggallery-lightbox-portal.mjs scripts\check-surface-census-changed.mjs scripts\enrolled-tailwind-baseline.json scripts\mantine-migration-scope.json scripts\surface-census-baseline.json scripts\governance\tailwind-entropy.allowlist.json docs\critical-flow-registry.md docs\mantine-responsive-design-system.md
git --no-optional-locks status --porcelain
```

Expected:
- Every command exits 0. `build` is the hard gate.
- `status` shows only §7 paths, the evidence directory and pre-existing unrelated entries.
- The hash list ties the transcript to the shipped files (corollary 818).

Then the live block, with `npm.cmd run start` on that build (logging to `start-final.log`):

```powershell
$slug = "shitet-gazonjere-ne-pogradec-mtu8u1lg"
curl.exe -s -o docs\sessions\evidence\task794\final-body-sq.html -w "%{http_code}" "http://localhost:3000/sq/listings/$slug"
curl.exe -s -o docs\sessions\evidence\task794\final-body-en.html -w "%{http_code}" "http://localhost:3000/en/listings/$slug"
curl.exe -s -o docs\sessions\evidence\task794\final-body-uk.html -w "%{http_code}" "http://localhost:3000/uk/listings/$slug"
curl.exe -s -o docs\sessions\evidence\task794\final-body-it.html -w "%{http_code}" "http://localhost:3000/it/listings/$slug"
$env:BASE_URL = "http://localhost:3000"
$env:SLUG = $slug
$env:MODE = "after"
node.exe scripts\task612-qa-listinggallery-lightbox-portal.mjs
$env:HYDRATION_LISTING_PATH = "/en/listings/$slug"
npm.cmd run check:hydration
```

Expected:
- each `curl.exe` prints `200`, and each body passes AC2 and AC16 (a 200 alone proves nothing, corollary 791);
- 612 → `28/28 PASS`;
- hydration → PASS.

Read `start-final.log` in full (corollary 791).

After that block, re-run the §3.1 census. It must show `GalleryStaticFrame` `manifest:yes story:yes`, the same
owners for every other node, and nothing new.

### 13.3 Plant (AC6)

- Use Node I/O.
- Record `git hash-object` of the pattern before the plant.
- Delete §10.4's listener and run the smoke test. The ≥ `sm` key test must fail.
- Restore, and confirm the hash equals the pre-plant value. Re-run: pass.
- Retain both transcripts.

### 13.4 Rendered checks (AC1, AC3–AC5, AC13, AC14, GR-3b–3g)

**Real route:**
- `en` at 320, 390, 768, 1024, 1280, 1440 and 1920 (`sizes` needs all seven);
- `sq`, `uk` and `it` at 320 and 1440;
- AC3 and AC4 samplers at 390, 768, 1024 and 1440;
- AC13 at DPR 1 and 2.

**Storybook:** the three §3.5 Stories at 320, 390, 768, 1024 and 1440, and `uk@320`. Measure:
- component width vs viewport;
- all four edge distances;
- the badge font-size;
- text-button pairs in the open lightbox (0 expected);
- a DPR-1 10× crop of the frame's four corners, which shows no line (GR-3g "none").

Emit these receipts:
- `GR-3b`, `GR-3c` and `GR-3d`, one per Story;
- `GR-3e` for `Default` (lightbox open);
- `GR-3f` "no changed circle";
- `GR-3g` "no line in a clipping ancestor", with the crop path.

### 13.5 OWNER VISUAL QA REQUIRED

| Story | State | Locales | Viewports |
|---|---|---|---|
| `Patterns/Mantine/ListingGalleryPattern` | `ClosedStates`: multi, single, empty, static frame multi, static frame single, static frame no cover | sq · en · uk · it | 320 · 1440 |
| `Patterns/Mantine/ListingGalleryPattern` | `ClosedStates` (same six) | en | 390 · 768 · 1024 |
| `Patterns/Mantine/ListingGalleryPattern` | `Default` (lightbox open by `play`) | en · uk | 390 · 1440 |
| `Patterns/Mantine/ListingDetailView` | `PublicListing` (gallery after the island mounts) | en · uk | 390 · 1440 |
| `Patterns/Mantine/ListingDetailPattern` | `Default` (internal gallery) | en | 390 · 1440 |

Owner live check after deploy (non-command steps):
1. Open a listing with several photos on a phone and on a desktop. The first photo appears at once, and nothing below
   the gallery jumps when the thumbnails appear.
2. Desktop: click a thumbnail (the photo changes, nothing opens), then click the photo. The lightbox opens; ← and →
   step and wrap; Esc closes.
3. Phone: swipe the photo, then tap it. The lightbox opens.

## 14. Completion report contract

Write the session log `docs/sessions/2026-10-0X-task794-listing-page-renders-the-canonical-gallery.md`, with evidence
under `docs/sessions/evidence/task794/` (the `research/` folder is Opus's and stays unchanged). It contains:
- a Files Changed table matching `git status`;
- R1–R19 status;
- every command with its exit code;
- the I0 and final vitest lists;
- the plant transcripts with hashes;
- the I0 record (badge values, row height, photo widths, slug, data availability, route-table line);
- every rendered measurement;
- receipts GR-0, GR-1 (I0 and final census), GR-2 (for each gate used to close a criterion), GR-3 (pattern and
  `GalleryStaticFrame`), GR-3a, GR-3b, GR-3c, GR-3d, GR-3e, GR-3f, GR-3g;
- assumptions, deviations, limitations and every `BLOCKED` arm with its reason.

Update only 794's lines in `docs/backlog.md` and its row state in the Sprint 71 plan. End with
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No git commands.

## 15. Task quality gate

- **Fresh-session executable.** Every path, line, hash and command above was read or run on 2026-10-04. The one
  scheduled command that needs data (`$slug`) has an I0 fallback.
- **Absence claims carry their traces.**
  - "No keyboard listener" (F5, F6) rests on greps over both files and a reading of `useSwipeTrackSync:276-314`.
  - "Only consumer" for `ListingGallery.module.css` rests on a whole-repo grep (one importer).
  - "`all_photos`/`photo_count` keep consumers" rests on a grep with each hit opened.
- **Detector feasibility.**
  - `check:enrolled-tailwind` reads only `className`/`classNames` in enrolled files. The `hidden` attribute and
    Mantine props are outside it by design. AC8's computed-value comparison covers what the gate cannot see (GR-2).
  - Enrolling `GalleryStaticFrame` puts it under that gate, so its CSS-module classes must not resolve as Tailwind
    utilities. `.imageLayer` and `.fitCover` are hashed module names.
- **Clause 16d.** Every census node is in scope or has a named open owner (§3.1). `ListingGallery.tsx`, which the
  census cannot see, is listed by hand.
- **No new visual value.** Every value maps to an existing token or class. The one new key (`galleryCountBadge`)
  preserves a measured value under D71-4.
- **Dirty worktree.** Facts F1–F23 were read on a clean tree (apart from the untracked `.playwright-mcp/`). By the end
  of design, other tasks' in-flight work (741 Revision 3, 859) had modified four §7 paths (`theme.ts`,
  `mantine-migration-scope.json`, `surface-census-baseline.json`, `messages/*.json`) and none of the gallery sources.
  The start precondition blocks execution until those paths are clean. The I0 rule re-verifies cited facts in any
  file a later commit changed.
- **One route.** The kickoff carries one LCP route (§5) and no owner question.
