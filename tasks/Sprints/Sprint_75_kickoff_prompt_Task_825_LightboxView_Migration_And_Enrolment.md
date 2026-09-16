# Task 825 — `LightboxView` leaves Tailwind, then is enrolled: the last tier-1 node the gallery surface renders

Sprint 75 · P2 · QA profile **Q4** (was `Q2` "one manifest entry" — rescoped by the owner decision in §5.1; the
lightbox is a critical-flow row)

**Status: `NEEDS REVISION`** — Opus implementation review 1, 2026-09-17. The owner returned the §13.3 visual matrix;
**the executor's next route is §16 (R10–R16 / AC7–AC14)**. §1–§15 stay binding except where §16 supersedes them by
number. Filed 2026-09-16 as `READY FOR SONNET`, sequenced after Task 797's approved commit.

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

## 16. Revision 1 — Opus implementation review 1, 2026-09-17 (`NEEDS REVISION`)

### 16.0 Re-entry mode

`remediation`. **Keep** every Revision 0 change and every transcript `01`–`30` under
`docs/sessions/evidence/task825/`; never overwrite or renumber one. New transcripts start at `31`. **Do not revert**
the R1–R4 migration: it is accepted as implemented, and R6's before/after rects stand for the elements R6 measured.
Start at the first step of the §16.8 order (the AC10 failing arm).

### 16.1 Why it was returned — measured

The owner returned the §13.3 matrix (screenshots `Screenshot_1/2/4/6/7/8/9/10.png`: `lightboxview--default` at
320, 360, 390, 480, 560, 640, 768 and 960 px, `en`). Opus reproduced it with a Playwright probe against Storybook on
2026-09-17 (`win32`, Node v22.22.3):

| Owner observation | Measurement | Cause |
|---|---|---|
| Mobile: the row of lines runs past the screen edges | `320×812`: pagination rail `x:-124, width:568`; `Modal.Content` (`section.mantine-Modal-content`) `clientWidth 320, scrollWidth 444`, `overflow-x: auto`. `390×844`: rail `x:-89, width:568`, content `scrollWidth 479`. | 24 segments × 16 px + 23 gaps × 8 px = 568 px, centred by `left:50%` + `translateX(-50%)` in a narrower screen. The overflow makes `Modal.Content` scroll sideways; its scrollbar is the white line under the rail on mobile. |
| Tablet/desktop: a white line under the thumbnails | Strip scroller (`.strip` `Group`) `640×900`: `clientWidth 512, scrollWidth 1256`; `960×812`: `832 / 1256`; `1440×900`: `1024 / 1256`; `overflow-x: auto`, `scrollbar-width: auto`. | The strip's native horizontal scrollbar. Headless Chromium launches with `--hide-scrollbars`, so the probe read `offsetHeight − clientHeight = 0`; the owner's browser draws a classic bar. **A probe without `ignoreDefaultArgs: ['--hide-scrollbars']` cannot see this defect** (not measured at design time — Storybook was stopped before that arm ran; R13's failing arm is the executor's first proof). |
| Stepping through photos: the strip never moves, the active photo is off-screen | `grep` over `src/modules/listings`, `src/design-system/mantine/patterns` and `src/hooks` finds no `scrollIntoView`, `scrollTo` or `scrollLeft` write for the strip or rail. | Never implemented. Task 824 R35 only made the start of the strip reachable at `scrollLeft = 0`. |

`FACT` — **none of the three is a regression of Revision 0.** `20_r6_before.json` (Tailwind) and `21_r6_after.json`
both record `swipe-track-mode` `320x800` rail `{x:-124, width:568}` and `390x800` `{x:-89, width:568}`. The strip's
`overflow-x-auto` is unchanged. They are older defects, dating from Task 824, and the owner's returned tuple brings
them into scope (§13.3, checkpoint 8).

`FACT` — **Revision 0's R6 skipped elements the kickoff required.** R6 names *strip scroller, strip row, pagination
rail*; `20_r6_before.json` records only `close, counter, prev, next, mediaImgRect, firstThumbRect` (desktop) and
`close, counter, paginationRailRect, paginationSegmentCount` (mobile). The session log still says R6 is complete. The
unmeasured element is the one that shows the scrollbar.

`FACT` — **R5 was only partly met.** `scripts/surface-census-baseline.json` still has all **7**
`… :: LightboxView.tsx :: tier1-unenrolled-or-unstoried` entries (lines 133, 250, 562, 1213, 1216, 1543, 1615). The
file is unchanged in `git diff`. Only the rendered-scope edge was removed. The writer transcript
`15_surface-census-changed_update-baseline.txt` maps only the 4 diff surfaces and keeps entries for surfaces it did not
census. The session log's "1 of the 8" is the rendered-scope row, not a surface-census row.

### 16.2 Owner decisions — 2026-09-17, quoted verbatim

Asked by Opus during this review. Answers:

> **Мобільний рядок-індикатор:** "Має бути карусель в рядок, яка показує активне фото. Якщо фото більше, аніж
> карусель може показати на екрані, то під час перемикання на наступне фото, яке поза межами видимої частини
> каруселі, має з'явитись праворуч/ліворуч (в залежності від напрямку гортання каруселі) у видимій частині каруселі.
> Така сама поведінка і на мобільних екранах, має показуватись активна лінія(показник активного прев'ю фото). Не
> треба нічого стискати, відступи змінювати, все має бути як є."
>
> **Скролбар під мініатюрами:** "Сховати скролбар (Recommended)"
>
> **Рух каруселі:** "Лише щоб була видима"

Binding reading: ① the desktop thumbnail strip **and** the mobile pagination rail are both single-row scrollable
carousels; ② **no size, gap, inset or token changes**: segment 16×2 px, gap `xs`, thumbnail 44 px, strip `px xs` /
`pt md` all stay the same; ③ after the active index changes, the carousel scrolls **as little as needed** to show
the active item fully. It scrolls right when the item is past the right edge and left when it is past the left edge.
It does not scroll when the item is already fully visible, and it never centres the item; ④ the native scrollbar
is hidden on both carousels, and wheel, trackpad and touch scrolling still work.

### 16.3 Opus decision — the 7 stale surface-census rows (not an owner decision)

`check:surface-census:changed:update-baseline` is diff-mapped by design. From this diff it cannot reach the 7 parent
surfaces, so the kickoff's "removed only by the writer" (R5) was unsatisfiable as written. **That is a kickoff
defect, corrected here.** The rows are removed by R15's scoped proof-then-remove procedure. The mapper gap itself
is reserved as **Task 831** (Sprint 75) and is not fixed in 825.

### 16.4 Requirements (add to §4; R5 is amended by R15)

| ID | Source | Observable requirement | P | AC |
|---|---|---|---|---|
| **R10** | §16.2 ①② | **Mobile pagination rail is an inset, scrollable, single-row carousel.** Outer scroller: `pos="absolute"`, `bottom`/`left`/`right` = `resolveGalleryOffset(theme, 'md')`, horizontal overflow scrolls. The segment row inside it uses 824 R35's `justify-content: flex-start` scroller + `margin-inline: auto` row pattern, so a rail that fits stays centred and a rail that overflows starts at `scrollLeft 0`. Segments are `flex-shrink: 0`, width `boxSize.paginationSegment`, height `boxSize.paginationSegmentThickness`, row gap `var(--mantine-spacing-xs)`: all unchanged. The `.centerX` translate is removed from the rail only; the counter keeps it. `Modal.Content` never overflows sideways. | **P0** | AC7, AC11 |
| **R11** | §16.2 ③ | **Keep-active-in-view, nearest.** One shared hook, `src/hooks/useKeepActiveInView.ts`, with a pure exported helper `computeNearestScrollLeft({ scrollLeft, clientWidth, itemStart, itemEnd })` → the new `scrollLeft`. `itemStart`/`itemEnd` are the item's offsets in the scroller's scroll coordinates. It returns `itemStart` when `itemStart < scrollLeft`, `itemEnd − clientWidth` when `itemEnd > scrollLeft + clientWidth`, and `scrollLeft` unchanged otherwise. The hook runs when `activeIndex` changes and calls `scroller.scrollTo({ left, behavior })` on **that scroller only**. `behavior` is `'smooth'`, or `'auto'` under `prefers-reduced-motion: reduce` and on the first run after mount, so a lightbox opened on photo 18 shows thumbnail 18 at once. **`scrollIntoView` is forbidden**: it also scrolls ancestors (`Modal.Content`, the page). The hook finds item *i* as the scroller's row's *i*-th element child; no new DOM attribute is needed. | **P0** | AC8, AC9, AC12 |
| **R12** | §16.2 ③ | `LightboxView` applies R11 to the desktop strip scroller (thumbnails) and the mobile rail scroller (segments). Wrap-around works like any other step: from 24 to 1 the carousel scrolls back to 0, from 1 to 24 it scrolls to the end. | **P0** | AC8, AC9 |
| **R13** | §16.2 ④ | Both scrollers get one `LightboxView.module.css` class, `.hiddenScrollbar { scrollbar-width: none }` plus `.hiddenScrollbar::-webkit-scrollbar { display: none }`. The legacy `globals.css` `.no-scrollbar` utility is **not** used: this is a migrated Mantine surface, and Tailwind-layer utilities are what R1 removed. `overflow-x` stays scrollable. | **P0** | AC10 |
| **R14** | 16c | `LightboxView.stories.tsx` covers both rail states at mobile width with the real component: **overflowing** (existing `SwipeTrackMode`, 24 photos) and **fitting**, a new `SwipeTrackModeFewPhotos` export with 4 photos drawn from `DEMO_IMAGES`, `opened` always true, no play function. This is a changed visible state of the production component, not a probe (orchestrator-procedures corollary 726). | **P0** | AC11, AC13 |
| **R15** | §16.3 (amends R5) | For each of the 7 parent surfaces on lines 133, 250, 562, 1213, 1216, 1543 and 1615, run `node.exe scripts\check-surface-census.mjs --surface <parent> --json` and retain the output. Remove a baseline entry **only** if that surface's census has `LightboxView.tsx` with `manifest:yes story:yes` and no blocking tier. Use one Node script (UTF-8 I/O) that ① prints the exact 7 keys it will delete, ② refuses to write (`SCOPE GUARD FAILED`) if any key is missing, extra, or not in that set, ③ removes only those keys, keeps every other byte, and writes the result as JSON with the same indentation. Record `git hash-object` before and after. Then `check:surface-census:changed -- --base HEAD` and `check:surface-census:changed:verify` must both exit 0. The script is a scratch file under the session scratchpad, not committed. | **P1** | AC14 |
| **R16** | R6 gap | **R6 completion.** Extend the probe with the missing elements, strip scroller and strip row, at the §4 R6 cells. Record the `after` state of the final code for close, counter, prev, next, media, first thumbnail, strip scroller rect, strip row rect (at `scrollLeft 0`) and mobile counter/close. These must equal `21_r6_after.json` where that file has the element. The strip scroller rect must also match the pre-825 Tailwind geometry, derived from the unchanged `firstThumbRect` and the scroller's `px xs`: scroller `x = firstThumbRect.x − 8`. **Expected change, by owner decision §16.2 only:** the mobile rail rect (now inset scroller + row). No other difference is allowed. | P1 | AC12 |

### 16.5 Acceptance criteria (add to §12)

Every Playwright measurement below runs against `build-storybook` output served locally, launched with
`chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] })`, `locale:en`. The session log says so and lists the
probe path and exit code. Transcripts are unpiped with exit codes.

- **AC7 [R10]** — `swipe-track-mode` (24 photos) at 320×800, 360×800, 390×844, 480×900 and 560×812:
  `Modal.Content.scrollWidth ≤ clientWidth`. The rail scroller's rect is `left = 16`, `right = viewport − 16`. Every
  segment is 16 × 2 px, and adjacent segment lefts differ by 24 px. Retain the raw per-cell JSON.
- **AC8 [R11, R12]** — mobile, 320 and 390: open at index 0, then press `ArrowRight` 24 times and `ArrowLeft` 24
  times, waiting for `scrollend` or a stable `scrollLeft` over 2 animation frames each time. After each step, the
  active segment's rect lies inside the rail scroller's rect (±0.5 px). When the active segment was already fully
  visible before the step, `scrollLeft` is unchanged. After the step from 24 to 1, `scrollLeft = 0`. Record
  `document.scrollingElement.scrollLeft/scrollTop` and `Modal.Content.scrollLeft/scrollTop`: all 0 at every step.
- **AC9 [R11, R12]** — `default` at 640×900, 960×812 and 1440×900: the same 24-forward/24-back walk through the
  **Next/Prev buttons**, with the same containment check (active thumbnail, `aria-current="true"`, inside the strip
  scroller), the "already visible → `scrollLeft` unchanged" check, and the ancestor-`scrollLeft/scrollTop = 0` check.
  The first-run `behavior: 'auto'` (opening on a far index) is proven by vitest in AC12, not here.
- **AC10 [R13]** — at 640×900 and 960×812 (strip) and 320×800 (rail): computed `scrollbar-width` is `none`, and
  `offsetHeight − clientHeight = 0` on both scrollers. **Failing arm, required first:** on the unrevised code
  (before R13 lands), the same probe records `offsetHeight − clientHeight > 0` on the strip scroller at 640×900. If
  that arm reads 0, the probe cannot see the defect: stop with `BLOCKED — PROBE BLIND` and both readings. Do not
  continue.
- **AC11 [R10, R14]** — `swipe-track-mode-few-photos` at 320 and 390: rail row width = 4×16 + 3×8 = 88 px, its centre
  = `viewport / 2` ±0.5 px, rail scroller `scrollWidth = clientWidth`.
- **AC12 [R11, R16]** — `vitest` unit test `src/hooks/__tests__/useKeepActiveInView.test.ts` covers
  `computeNearestScrollLeft`: item past the right edge, past the left edge, fully visible (unchanged), wider than the
  viewport (returns `itemStart`), exactly on both edges (unchanged). Plus a hook test: the first run uses `'auto'`, a
  later change uses `'smooth'`, reduced motion uses `'auto'`, and `scrollIntoView` is never called (spy). R16's
  completed after-table is retained, with its equality statement per element.
- **AC13 [R14]** — `check:stories`, `check:story-coverage` and `build-storybook` exit 0. The new export statically
  renders `LightboxView`.
- **AC14 [R15]** — 7 per-surface census transcripts; the removal script's printed manifest; before/after
  `hash-object`; `grep -c "LightboxView.tsx :: tier1-unenrolled-or-unstoried" scripts/surface-census-baseline.json` = 0;
  `check:surface-census:changed -- --base HEAD` and `:verify` exit 0.

`GR-4 AC AUDIT — 8 criteria (AC7–AC14); each states an observable property; absolutes: AC7's "≤" and AC14's "= 0" are
the requirement's own definition (no sideways overflow; the stale rows gone). The AC8/AC9 ±0.5 px tolerance absorbs
sub-pixel layout.`

### 16.6 Negative flows (add to §11)

| Negative flow | Expected |
|---|---|
| Single photo | no rail, no strip scrolling, hook is a no-op (`images.length ≤ 1`) |
| Rail/strip fits (4 photos) | centred, `scrollLeft` stays 0 on every step (AC11 + AC8 unchanged-rule) |
| Wrap 24 → 1 and 1 → 24 | carousel jumps to the matching end (AC8/AC9) |
| Reduced motion | `behavior: 'auto'` (AC12) |
| Ancestor scroll | `Modal.Content` and page never scroll (AC8/AC9) |
| Probe blind to scrollbars | `BLOCKED — PROBE BLIND` (AC10 failing arm) |
| Rapid key repeat | last `scrollTo` wins; final state satisfies AC8 containment |

### 16.7 Scope (amends §7)

**Edited in addition to §7:** `src/hooks/useKeepActiveInView.ts` (new), `src/hooks/__tests__/useKeepActiveInView.test.ts`
(new), `src/stories/mantine/primitives/LightboxView.stories.tsx` (R14), `scripts/surface-census-baseline.json` (R15
procedure only), and the session log (append a `Revision 1` section; correct the R6 paragraph so it no longer claims
coverage of the strip scroller/row, and correct the "1 of the 8" sentence to match §16.1). **Not edited:**
`MantineListingGalleryPattern.tsx` (the closed gallery's own thumbnail row, Task 829), `GalleryThumbnailButton.tsx`,
`useSwipeTrackSync.ts`, `theme.ts` (no new role: §16.2 ② forbids changing a value, and R10/R13 need none).

### 16.8 Verification plan

`§13.1` is not re-run (remediation). Order: AC10 failing arm → R13 → R11 hook + AC12 → R10/R12 in `LightboxView` →
R14 Story → AC7–AC11 probe → R16 → R15 → the §13.2 block (every command, unchanged, plus the two lines below) → hash
block for every changed path.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npx.cmd vitest run src/hooks/__tests__/useKeepActiveInView.test.ts src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx
npm.cmd run check:surface-census:changed:verify
```

Expected: `win32`; vitest all pass; verify exit 0. `task612` and `check:click-shield` must be re-run after the change
(§13.2) because the rail and strip DOM changed.

### 16.9 Owner visual review — re-handed (`OWNER VISUAL QA REQUIRED`)

Set the width in DevTools device mode, as in §13.3. The owner steps through all 24 photos with the arrows or keys in
each cell.

| Story | Widths | Locales | Owner checks |
|---|---|---|---|
| `mantine-primitives-lightboxview--swipe-track-mode` | 320, 360, 390, 480, 560 | en, uk | rail inside the screen, no white line, active line always visible, sizes unchanged |
| `mantine-primitives-lightboxview--swipe-track-mode-few-photos` | 320, 390 | en | rail centred |
| `mantine-primitives-lightboxview--default` | 640, 768, 960, 1440 | en, uk | no white line under thumbnails, active thumbnail always visible, carousel moves only when needed |

### 16.10 Completion contract (amends §14)

Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` only when AC7–AC14 and the whole §13.2 block are green and the
§16.9 matrix is handed over. AC10's failing arm reading 0 → `BLOCKED — PROBE BLIND`. No self-approval, no git.
