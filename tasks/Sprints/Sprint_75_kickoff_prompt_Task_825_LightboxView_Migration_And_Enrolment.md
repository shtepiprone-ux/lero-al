# Task 825 — `LightboxView` leaves Tailwind, then is enrolled: the last tier-1 node the gallery surface renders

Sprint 75 · P2 · QA profile **Q4** (was `Q2` "one manifest entry" — rescoped by the owner decision in §5.1; the
lightbox is a critical-flow row)

**Status: `READY FOR SONNET`** — filed 2026-09-16. **Sequenced after Task 797's approved commit** (822 → 797 → 825
all add roles to `src/design-system/mantine/theme.ts`).

## 1. Mode and task type

`IMPLEMENTATION` — Mantine migration of one presentational component and the two enrolled gallery controls whose
public API currently takes Tailwind classes, then manifest enrolment and baseline reconciliation. Value-preserving:
every position, size and colour renders as today.

## 2. Objective

`LightboxView.tsx` is the only `tier1-unenrolled-or-unstoried` node under `MantineListingGalleryPattern`. The
reservation proposed adding one manifest line. Measured: the component still renders through Tailwind utilities,
so that line would make the census report a Tailwind component as migrated. Migrate it to Mantine style props,
theme tokens and its co-located CSS Module — including the Tailwind position contract of `GalleryNavActionIcon` and
`GalleryDesktopNavigation` it depends on — then enrol it, reconcile both census baselines, and prove the lightbox
behaves and renders exactly as before.

## 3. Verified context — measured 2026-09-16

### 3.1 The census

`FACT` — `docs/sessions/evidence/task825/design/01_surface-census-gallery-pattern.txt`: 6 nodes, exit 1,
`FAIL src/modules/listings/components/LightboxView.tsx [tier1-unenrolled-or-unstoried]` — `manifest:no story:yes
className:13 ui-imports:0`. Its own Story exists (`Mantine/Primitives/LightboxView`, exports `Default` and
`SwipeTrackMode`). The other five nodes are enrolled with Stories.

`FACT` — `scripts/surface-census-baseline.json` carries 7 `… :: LightboxView.tsx :: tier1-unenrolled-or-unstoried`
entries (`:133` click-shield-modal page, `:250` listing `[slug]` page, `:562` admin preview page, `:1213`
`MantineListingDetailPattern`, `:1216` `MantineListingGalleryPattern`, `:1543` `ListingDetailView`, `:1615`
`ListingGallery`); `scripts/rendered-scope-baseline.json:22` carries the edge
`MantineListingGalleryPattern.tsx -> LightboxView.tsx`. Enrolment makes all 8 stale.

### 3.2 What is still Tailwind — `LightboxView.tsx` (192 lines)

`FACT` — utility classes and their built values (`.next/static/css`, 2026-09-16 build; `--space-N` from
`globals.css:130-142`, `--container-5xl: 64rem`, `.text-sm{font-size:.875rem;line-height:var(--tw-leading,1.25rem)}`,
`--z-dropdown: 10` at `globals.css:257`):

| Line | Element | Tailwind | Value | Resolution (identical value) |
|---|---|---|---|---|
| 82 | `Modal.Body` | `h-full flex items-center justify-center` | 100%, flex centre | Mantine style props + `LightboxView.module.css` `.body` for `display/align/justify` |
| 83 | stage | `relative w-full h-full flex items-center justify-center` | | `<Center pos="relative" w="100%" h="100%">` |
| 85 | close control | `top-4 right-4 z-10` (via `GalleryNavActionIcon className`) | 1rem, 1rem, z 10 | new `GalleryNavActionIcon` placement API (R2) → `top="md" right="md"`, raised |
| 86 | close icon | `size-5` | 1.25rem (20px) | `size={theme.other.iconSize.roomy}` (20) |
| 90 | counter | `absolute top-4 left-1/2 -translate-x-1/2 text-sm` (+ `styles.counter`) | 1rem; 50%; −50%; 0.875rem / 1.25rem | `pos="absolute" top="md" left="50%"` + module `.centerX { transform: translateX(-50%) }` + `fz="sm" lh={theme.other.lineHeight.lightboxCounter}` |
| 125 | desktop column | `relative w-full h-full max-w-5xl mx-16 min-w-0 flex flex-col min-h-0` | max 64rem, margin-inline 4rem | `<Stack pos="relative" w="100%" h="100%" maw={boxSize.lightboxMediaMaxWidth} mx={boxSize.lightboxMediaInlineMargin} gap={0}>` + module `.minZero { min-width:0; min-height:0 }` |
| 126 | media | `relative w-full flex-1 min-h-0` | | `<Box pos="relative" w="100%">` + module `.fill { flex:1; min-height:0 }` |
| 141 | strip scroller | `shrink-0 flex justify-start overflow-x-auto px-2 pt-4` | 0.5rem / 1rem | `<Group wrap="nowrap" justify="flex-start" px="xs" pt="md">` + module `.strip { flex-shrink:0; overflow-x:auto }` |
| 142 | strip row | `flex gap-2 mx-auto` | 0.5rem, auto | `<Group wrap="nowrap" gap="xs" mx="auto">` |
| 157 | mobile viewport | `h-full w-full overflow-hidden` | | `<Box h="100%" w="100%">` + module `.clip { overflow:hidden }` |
| 160 | mobile slide | `relative h-full shrink-0` | | `<Box pos="relative" h="100%">` + module `.noShrink { flex-shrink:0 }` |
| 174 | pagination rail | `absolute bottom-4 left-1/2 -translate-x-1/2 flex` (+ `styles.paginationRail`) | 1rem, 50%, −50% | `pos="absolute" bottom="md" left="50%"` + module `.centerX` + `display:flex` added to the existing `.paginationRail` |

`FACT` — the long comments at `:104-123` and `:129-140` explain **why** `min-w-0`, `min-h-0`, `flex-1`, `justify-start`
+ `mx-auto` exist (Task 824 kickoff §19-§20 A/B evidence). Those mechanics must survive in the new form; the comments
are updated to name the new classes/props, not deleted.

### 3.3 The Tailwind contract in two enrolled patterns

`FACT` — `GalleryNavActionIcon.tsx:10` documents `className: string` as "Tailwind position-offset utility classes only";
it renders `ActionIcon size="xl" radius="50%" pos="absolute"`. Consumers: `LightboxView.tsx:85` (close) and
`GalleryDesktopNavigation.tsx:52,55`.

`FACT` — `GalleryDesktopNavigation.tsx:22-35` `NAV_VARIANTS`: `gallery` → `left-2`/`right-2 top-1/2 -translate-y-1/2
z-10`, icons `size-5`; `lightbox` → `left-3 sm:left-6`/`right-3 sm:right-6 top-1/2 -translate-y-1/2`, icons `size-6`.
Values: `left-2` 0.5rem (`xs`), `left-3` 0.75rem (`sm`), `sm:left-6` 1.5rem (`xl`) at ≥640px, `size-5` 20px
(`iconSize.roomy`), `size-6` 24px (`iconSize.decorative`). The `gallery` variant renders inside
`MantineListingGalleryPattern` (`:115`); changing the API changes that consumer too, value-preserving.

`FACT` — `GalleryNavActionIcon.stories.tsx:25-55` passes the Tailwind offsets through a local identifier
specifically so `check:design-tokens:strict` does not see them.

### 3.4 Critical flow and regression assets

`FACT` — `docs/critical-flow-registry.md:111`, "Listing-detail gallery lightbox stacking (portal + z-index)": Mantine
`fullScreen Modal` portaled to `document.body` above the site header and sticky contact card; Prev/Next (buttons and
arrow keys, wrap), thumbnail jump, counter, close (X/Esc/backdrop), scroll-lock and restore, focus return preserved;
automated proof = `npx vitest run src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx`
plus the live script `scripts/task612-qa-listinggallery-lightbox-portal.mjs` (7 breakpoints × 4 locales).

`FACT` — `scripts/check-click-shield.mjs:149,183` drives the production `LightboxView` through
`src/components/ci/ClickShieldModalFixture.tsx` on `/[locale]/ci/click-shield-modal`; CI runs it blocking in the
`click-shield` job.

`FACT` — Storybook ids: `mantine-primitives-lightboxview--default`, `mantine-primitives-lightboxview--swipe-track-mode`,
`mantine-primitives-gallerynavactionicon--default`, `mantine-primitives-gallerydesktopnavigation--default`,
`patterns-mantine-listinggallerypattern--default`.

### 3.5 Found while measuring — filed, not in scope

`INFERENCE` — a heuristic scan of `className` string literals in all 72 manifest entries
(`02_manifest-tailwind-utility-scan.txt`) finds Tailwind utilities in `MantineListingGalleryPattern.tsx` (9),
`MantineListingDetailPattern.tsx` (4) and `ListingDetailView.tsx` (1); it misses `GalleryDesktopNavigation`'s
`NAV_VARIANTS` strings, so it undercounts. The census's `manifest:yes` therefore does not mean "no Tailwind".
**Filed as Task 829.** `MantineListingGalleryPattern`'s own Tailwind is its parent's, not `LightboxView`'s render
tree, and stays out of 825.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.2 | `LightboxView.tsx` contains **no** Tailwind utility class: every `className` is a `LightboxView.module.css` class or absent; every row of §3.2 is resolved as its column says. Three new roles, exact values, typed and source-cited in `theme.ts`: `other.boxSize.lightboxMediaMaxWidth = '64rem'`, `other.boxSize.lightboxMediaInlineMargin = '4rem'`, `other.lineHeight.lightboxCounter = '1.25rem'` (the `lineHeight` group exists after Task 822). | **P0** | AC1 | Confirmed |
| **R2** | §3.3 | `GalleryNavActionIcon` drops `className` and takes `placement: { top?, right?, bottom?, left?: StyleProp<MantineSpacing \| string>; centerY?: boolean; raised?: boolean }`, applied through Mantine style props on the `ActionIcon`; `centerY` → `top: 50%` + `translateY(-50%)`, `raised` → `z-index: var(--z-dropdown)` (10), both from a co-located `GalleryNavActionIcon.module.css`. Size, radius, tone colours unchanged. | **P0** | AC2 | Confirmed |
| **R3** | §3.3 | `GalleryDesktopNavigation` `NAV_VARIANTS` become placement objects with the identical values: `gallery` `{ left:'xs' \| right:'xs', centerY, raised }`, icon `iconSize.roomy`; `lightbox` `{ left:{ base:'sm', sm:'xl' } \| right:{ base:'sm', sm:'xl' }, centerY }`, icon `iconSize.decorative`; icons take `size=` not `className`. | **P0** | AC2 | Confirmed |
| **R4** | 16c | `GalleryNavActionIcon.stories.tsx` and `GalleryDesktopNavigation.stories.tsx` render through the new API (no Tailwind string, no local-identifier workaround); `LightboxView.stories.tsx` keeps `Default` and `SwipeTrackMode` rendering the real component. | **P0** | AC2, AC6 | Confirmed |
| **R5** | §3.1 | `src/modules/listings/components/LightboxView.tsx` is appended to `scripts/mantine-migration-scope.json`; `check-surface-census --surface MantineListingGalleryPattern.tsx` exits 0 with `LightboxView.tsx manifest:yes story:yes`; the 7 surface-census and 1 rendered-scope baseline entries of §3.1 are removed **only** by `npm run check:surface-census:changed:update-baseline` and `npm run check:rendered-scope:update-baseline`, each run reporting exactly those removals and no addition. | **P0** | AC3 | Confirmed |
| **R6** | value preservation | A scratch Playwright probe records, before and after, `getBoundingClientRect()` (x, y, width, height, rounded to 0.1px) and computed `z-index`/`transform`/`font-size`/`line-height` for: close control, counter, prev, next, media box, strip scroller, strip row, first thumbnail, pagination rail — in `lightboxview--default` at 640/1024/1440×900 and `--swipe-track-mode` at 320/390×800, plus prev/next in `gallerydesktopnavigation--default` and `listinggallerypattern--default` at 1024/1440; `locale:en`. Before and after tables are equal. | **P0** | AC4 | Confirmed |
| **R7** | §3.4 critical flow | `ListingGallery.portal.smoke.test.tsx` passes; `scripts/task612-qa-listinggallery-lightbox-portal.mjs` passes all 28 cells on the real route; `check:click-shield` passes. | **P0** | AC5 | Confirmed |
| **R8** | Q3/Q4 visual | `OWNER VISUAL QA REQUIRED` for the tuples in §13.3; the owner records accepted/returned per tuple. | **P0** | AC6 | Confirmed |
| **R9** | 794 rescope | Task 794's scope no longer includes `LightboxView` (recorded by the orchestrator in this design change); 825 does not touch `GalleryStaticFrame.tsx` or `ListingGallery.tsx` except where a type import breaks. | P1 | AC1 | Confirmed |

## 5. Assumptions and open questions

### 5.1 Owner decision — 2026-09-16, quoted verbatim

Asked in the task-design session with §3.2's measurement. The owner selected:

> **825 мігрує LightboxView** — 825 розширюється: de-Tailwind LightboxView на Mantine/токени + manifest + наявна
> Story, Q4 (critical flow: portal/z-index lightbox, регресійний тест 612). 794 втрачає LightboxView і лишає собі
> GalleryStaticFrame/ListingGallery.

### 5.2 Assumptions and stops

- `ASSUMPTION` (reversible) — Mantine's `top="md"` resolves to `var(--mantine-spacing-md)` = 1rem, identical to
  `--space-4`. R6 measures it.
- The Task 824 layout mechanics (§3.2 comments) are behaviour, not styling. If any R6 cell differs, stop with
  `BLOCKED` and both tables; do not tune values to match.
- If the `task612` live script cannot run (no dev server/data), record `MISSING EVIDENCE` with the owner-native
  command (§13.2) — the task is then `PARTIALLY IMPLEMENTED`, never `IMPLEMENTED`.
- A new tier-2 edge or a baseline writer adding an entry → `BLOCKED — OWNER DECISION REQUIRED`.

## 6. Pre-read rule bundle

`docs/golden-rules.md` GR-1, GR-3 · `docs/agent-contract.md` clauses 9, 11, 12, 13, 15, 16b, 16c, 16d ·
`docs/qa-profiles.md` (Q3, Q4) · `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` ·
`docs/critical-flow-registry.md:111` · `docs/orchestrator-ui-task-design.md` · the 5 components and 4 Story files of
§3 · `LightboxView.module.css` · `src/design-system/mantine/theme.ts` (`other` block) · `scripts/check-surface-census-changed.mjs`
and `scripts/check-rendered-scope.mjs` baseline writers · Task 824 kickoff §19-§20 · this kickoff.

## 7. Scope

- **Edited:** `src/modules/listings/components/LightboxView.tsx` · `LightboxView.module.css` ·
  `src/design-system/mantine/patterns/GalleryNavActionIcon.tsx` (+ new `GalleryNavActionIcon.module.css`) ·
  `GalleryDesktopNavigation.tsx` · `src/design-system/mantine/theme.ts` (+3 roles) ·
  `src/stories/mantine/primitives/GalleryNavActionIcon.stories.tsx` · `GalleryDesktopNavigation.stories.tsx` ·
  `LightboxView.stories.tsx` (only if the API change requires) · `scripts/mantine-migration-scope.json` (+1) ·
  `scripts/surface-census-baseline.json`, `scripts/rendered-scope-baseline.json` (writers only) · `docs/backlog.md`.
- **Written:** `docs/sessions/evidence/task825/*` (not `design/`) · session log.

## 8. Out of scope

`MantineListingGalleryPattern.tsx`'s own Tailwind (829) · `GalleryStaticFrame.tsx`, `ListingGallery.tsx` (794) ·
`useSwipeTrackSync` · any behaviour change · the `color-mix` scrim and `.counter` colour rules (already non-Tailwind).

## 9. Current and required behavior

**Before.** The lightbox renders correctly through Tailwind utilities; the census fails on it; the nav controls'
public API is a Tailwind class string. **After.** Identical rendering and behaviour from Mantine style props, theme
tokens and CSS Modules; the census passes because the component is actually migrated; the controls take a typed
placement.

## 10. Implementation requirements

1. Order: §13.1 baseline + R6 "before" → R2/R3 pattern API + their Stories → standalone Stories inspected → R1
   `LightboxView` → R6 "after" → R7 → R5 enrolment and writers → §13.2 → hand the §13.3 matrix to the owner.
2. Story first: the two control Stories render the new API before `LightboxView` consumes it (16c).
3. No raw dimension anywhere: tokens, roles, `%` and `auto` only; `check:design-tokens:strict` must stay at its
   post-797 state.
4. Update, don't delete, the explanatory comments of §3.2.
5. Node UTF-8 I/O; transcripts unpiped with exit codes; the final block records every changed file's hash.

## 11. Positive and negative flows

**Positive.** A visitor opens a listing photo: the full-screen dark lightbox paints above header and contact card,
arrows/keys/thumbnails/swipe work, the counter reads "3 / 12", Esc closes and focus returns — pixel-identical.

| Negative flow | Applicable | Expected |
|---|---:|---|
| Modal inline instead of portaled | Yes | smoke test fails (existing plant, R7) |
| Prev/next on a single image | Yes | controls hidden (`hasMultiple`), unchanged |
| Mobile (<640) | Yes | swipe track + pagination rail, no desktop controls — R6 320/390 |
| Many thumbnails overflow | Yes | strip scrolls from `scrollLeft` 0 (824 R35) — R6 strip rects + owner tuple |
| Locale with long counter label | Yes | owner tuples in 4 locales |
| Any R6 difference | Yes | stop, §5.2 |
| Auth / RLS / data | No | presentational component |

## 12. Acceptance criteria

- **AC1 [R1, R9]** — `Select-String` for Tailwind utility tokens in `LightboxView.tsx` class strings returns nothing;
  the three role definitions quoted; `git diff --stat` shows no change to `GalleryStaticFrame.tsx`/`ListingGallery.tsx`.
- **AC2 [R2, R3, R4]** — diffs of both patterns and both control Stories; the two control Stories render in Storybook
  at 390 and 1440 (screenshots retained for the owner, not used as a verdict).
- **AC3 [R5]** — census transcript exit 0 with the `LightboxView` line; both writer transcripts listing exactly the
  8 removals; `check:surface-census:changed`, `check:rendered-scope`, `check:story-coverage` exit 0.
- **AC4 [R6]** — before/after tables, equal cell by cell; probe script path and exit code.
- **AC5 [R7]** — vitest summary; `task612` script summary 28/28; `check:click-shield` exit 0.
- **AC6 [R8]** — the §13.3 tuple list handed over; owner results recorded before approval.

**GR-4 AC AUDIT — 6 criteria; each states an observable property; absolutes: AC1's "returns nothing" is R1's
definition of migrated; AC4's equality is the value-preservation requirement on named measurements.**

## 13. QA profile and verification plan

**`Q4`** — critical-flow row 612 (automated regression proof, R7) on top of a Q3 visible migration (R6 + owner matrix).

### 13.1 Baseline

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
git --no-optional-locks status --porcelain
git --no-optional-locks log -1 --oneline -- src/design-system/mantine/theme.ts
node.exe scripts\check-surface-census.mjs --surface src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx
npx.cmd vitest run src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx
npm.cmd run check:design-tokens:strict
npm.cmd run build-storybook
```

Expected: `win32`; last `theme.ts` commit is 797's; census exit 1 on `LightboxView.tsx` only (§3.1); vitest pass;
strict at 797's final state; Storybook exit 0. Then capture R6 "before".

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:BASE_URL = "http://localhost:3000"
$env:MODE = "after"
$env:SLUG = "test-7-molyl9c8"
node.exe -p process.platform
npm.cmd run typecheck
npm.cmd run lint
npx.cmd vitest run src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx src/design-system/mantine
npm.cmd run check:design-tokens:strict
npm.cmd run check:stories
npm.cmd run check:story-coverage
node.exe scripts\check-surface-census.mjs --surface src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx
npm.cmd run check:rendered-scope
npm.cmd run check:rendered-scope:verify
npm.cmd run check:surface-census:changed -- --base HEAD
npm.cmd run check:surface-census:changed:verify
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:click-shield
node.exe scripts\task612-qa-listinggallery-lightbox-portal.mjs
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks diff --stat
```

Expected: every command exit 0. `check:click-shield` needs `npm.cmd run start` (after `build`) in a second native PowerShell window; the
`task612` script is written against a live `next dev` server (its header, `:5`) — stop `start`, run `npm.cmd run dev`,
then the script; `SLUG` is the script's own documented example (`task612-qa-listinggallery-lightbox-portal.mjs:29`) — if that listing does
not exist in the executor's database, set `$env:SLUG` to any listing with ≥ 2 photos and record which. Append `git --no-optional-locks hash-object` for every §7 path.

### 13.3 Owner visual review — `OWNER VISUAL QA REQUIRED`

The Storybook toolbar viewport switcher does not resize the preview (Task 799) — set width in DevTools device mode.

| Story | State | Widths | Locales |
|---|---|---|---|
| `mantine-primitives-lightboxview--default` | desktop, many photos | 640, 1024, 1440 | sq, en, uk, it |
| `mantine-primitives-lightboxview--swipe-track-mode` | mobile | 320, 390 | sq, en, uk, it |
| `mantine-primitives-gallerynavactionicon--default` | both tones | 390, 1440 | en |
| `mantine-primitives-gallerydesktopnavigation--default` | both variants | 1024, 1440 | en |
| `patterns-mantine-listinggallerypattern--default` | closed gallery, nav on photo | 640, 1440 | en |

## 14. Completion report contract

Files and hashes · R1-R9 · baseline · R6 tables · Story render notes · census and both writer transcripts · R7
outputs · §13.3 tuples handed over · commands with exit codes and paths · assumptions · deviations · limitations.
Status per execute-task (`PARTIALLY IMPLEMENTED` if R7's live script could not run). No self-approval, no git.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Why not just the manifest line? | It would mark a Tailwind component migrated (§2); owner decision §5.1. |
| Why change two enrolled patterns? | Their API is a Tailwind string `LightboxView` must pass (§3.3); 16d: rendered children are in scope; extend the canonical owner once (16b). |
| Is `MantineListingGalleryPattern`'s Tailwind excluded? | It is the parent, not the child tree; named and filed as 829 in the same change (GR-1). |
| Critical flow? | Row 612 — its vitest, live script and click-shield all in §13.2. |
| Visual proof? | R6 measurement plus the owner matrix; no screenshot verdict. |
| GR-1 census | 6 nodes; tier1 5 enrolled+story, 1 (`LightboxView`) in scope here; tier2 0; tier3 0; 829 filed for the parent's Tailwind. |

## Appendix — execution contract

| Checkpoint | Producer | Comparator / failure |
|---|---|---|
| 0 baseline | §13.1 | census fails on another node → `BLOCKED` |
| 1 before | R6 probe | missing cell → no edit |
| 2 patterns + stories | Storybook build + diffs | Tailwind string remains → not done |
| 3 LightboxView | AC1 search | any utility → not done |
| 4 after | R6 probe | any difference → `BLOCKED` |
| 5 regression | R7 | any failure → not `IMPLEMENTED` |
| 6 enrol | writers | an addition or other removal → `BLOCKED` |
| 7 final | §13.2 | any non-zero → not `IMPLEMENTED` |
| 8 owner | §13.3 | returned tuple → revision |
