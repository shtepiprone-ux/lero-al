# Task 770 — Homepage Level 3: exit `@theme inline` runtime reads, with a fixed-manifest ownership gate

**Sprint:** 65 — Homepage finishes the Tailwind exit (`tasks/Sprints/Sprint_65_Homepage_Finishes_The_Tailwind_Exit.md`)
**Status:** `FILED — ready for executor`
**Base revision:** `06091ba1d` — Task 769 merged to `main` 2026-08-26; every measurement below was re-run against that commit
**Priority:** P1 · **QA profile:** `Q3 Full Visual Matrix`
**Supersedes:** `Codex-tasks/Task_770_Homepage_Theme_Inline_Runtime_Exit.md` (candidate brief; this kickoff is the
executable form and corrects three of its clauses — see §5)

## 1. Mode and task type

Implementation task. Two categories in one diff, deliberately:

1. **UI migration, current Mantine path** — twelve consumers stop reading `@theme inline`-only custom properties and
   read project-owned `:root` tokens of identical value instead. No restyle, no markup change, no component change.
2. **Governance control** — one new blocking gate, `check:homepage-theme-runtime-deps`, which makes that exact debt
   fail closed if it returns, and which carries D65-E's durable expected-zero `AppImage.module.css` control.

Sprint 65 binding rule 1 ("the control ships before or with the fix") is why they are one task, not two.

This is the fifth step of Sprint 65's strict sequence `766 → 767 → 768 → 769 → **770** → 771`. It is **not** a route
inventory, **not** Tailwind removal, and **not** route certification — only a live Task 667 can certify a route
(D65-C).

## 2. Objective

Close Sprint 65's Level 3 for the fixed twelve-path manifest of §3.1:

> No file in that manifest reads a custom property whose runtime declaration exists **only** through
> `@theme inline`.

and ship the control that keeps it closed.

`@theme inline` (`src/app/globals.css:35-316`) stays **byte-identical**. It remains the alias layer for legacy
Tailwind utilities still compiled on other routes, and §3.6 measures exactly who still depends on that. This task
removes twelve files' *reads* of it; it does not retire it, and it does not authorise removing any `@import`,
`@custom-variant`, `@source` or `@apply` rule (Sprint 65 §8).

## 3. Verified context

Everything below was measured by the orchestrator on 2026-08-26 and re-run after Task 769 landed in `main` as
`06091ba1d`; it is `FACT` against that commit unless labelled otherwise. Line numbers are from that state. The
measurement harness reused this repository's own exported primitives — `stripComments`, `findVarReferences`,
`extractCssDeclaredNames` from `scripts/check-css-var-resolvability.mjs` (§3.8) — not an ad-hoc regex, so the
executor's re-measure in §10.0 runs the same classification the shipped gate will run.

### 3.1 The census — 42 pairs / 79 uses, re-derived file by file

Method: for each manifest file, strip comments, extract every **literal** `var(--name)` reference, and classify the
name against four sources in this order — `--mantine-` prefix, a declaration in the same CSS module, a declaration in
a top-level `:root` block of `globals.css`, a declaration in `@theme inline`. A pair is one `(file, property)`; a use
is one literal reference occurrence.

| File | `theme-inline-only` properties (uses × line numbers) | Pairs | Uses |
|---|---|---:|---:|
| `src/app/[locale]/layout.tsx` | `--space-14` ×1 @50 | 1 | 1 |
| `src/app/[locale]/page.tsx` | `--space-16` ×1 @28 · `--space-24` ×1 @28 | 2 | 2 |
| `src/components/layout/FooterView.module.css` | `--space-12` ×2 @45,46 · `--space-14` ×1 @35 · `--space-2-5` ×1 @89 | 3 | 4 |
| `src/components/layout/HeaderView.module.css` | `--space-1` ×1 @70 · `--space-2` ×4 @55,56,114,127 · `--space-6` ×1 @90 · `--space-16` ×1 @61 | 4 | 7 |
| `src/components/layout/MobileBottomNavView.module.css` | `--space-0` ×4 @58,59,60,152 · `--space-3` ×1 @80 · `--space-5` ×2 @157,158 · `--space-6` ×2 @117,118 · `--space-12` ×2 @86,87 · `--space-14` ×1 @69 | 6 | 12 |
| `src/components/shared/HeroSearchView.module.css` | `--space-0` ×2 @95,99 · `--space-2` ×1 @71 · `--space-3` ×1 @59 · `--space-6` ×1 @120 · `--space-11` ×1 @109 | 5 | 6 |
| `src/design-system/mantine/patterns/MantineCopyIdButton.module.css` | `--text-2xs` ×1 @20 · `--color-muted-foreground` ×2 @21,34 · `--color-ring` ×1 @43 · `--color-status-success` ×1 @48 | 4 | 5 |
| `src/design-system/mantine/patterns/MantineHomeSection.tsx` | `--home-section-py-base` ×1 @44 · `--home-section-py-md` ×1 @45 · `--home-section-py-lg` ×1 @46 | 3 | 3 |
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | `--space-0` ×3 @302,386,392 · `--space-1` ×2 @213,222 · `--space-2` ×14 @209,210,218,219,245,246,266,267,272,284,285,290,351,382 · `--space-3` ×8 @54,412,413,417,418,423,424,443 · `--space-20` ×1 @197 · `--color-badge-premium` ×1 @58 · `--shadow-listing-card-elevation-lg` ×1 @92 | 7 | 30 |
| `src/modules/listings/components/FeaturedListingsView.module.css` | `--space-2` ×1 @46 · `--space-3` ×1 @43 | 2 | 2 |
| `src/modules/listings/components/LatestListingsView.module.css` | `--space-2` ×1 @35 · `--space-3` ×1 @32 | 2 | 2 |
| `src/modules/listings/components/ListingCard.module.css` | `--space-1` ×1 @77 · `--space-6` ×2 @51,52 · `--space-8` ×2 @58,59 | 3 | 5 |
| **Total** | | **42** | **79** |

**Zero `unknown` rows.** Every one of the 42 resolves in `@theme inline` and in no `:root` block — the migration has
no undefined-name surprise hiding in it.

**The distinct name set is exactly 19** — fourteen spacing names (`--space-0, -1, -2, -2-5, -3, -5, -6, -8, -11,
-12, -14, -16, -20, -24`), one type name (`--text-2xs`), three section-rhythm names
(`--home-section-py-base/md/lg`) and one elevation name (`--shadow-listing-card-elevation-lg`), plus the four colour
names of §3.3 which are handled differently (they already have a `:root` destination and need no new token).

### 3.2 Every value the migration must preserve — read from `globals.css`, not assumed

| Name | `globals.css` line | Declared value | New `:root` token | New value |
|---|---:|---|---|---|
| `--space-0` | 128 | `0px` | `--homepage-runtime-space-0` | `0px` |
| `--space-1` | 129 | `0.25rem` | `--homepage-runtime-space-1` | `0.25rem` |
| `--space-2` | 130 | `0.5rem` | `--homepage-runtime-space-2` | `0.5rem` |
| `--space-2-5` | 148 | `0.625rem` | `--homepage-runtime-space-2-5` | `0.625rem` |
| `--space-3` | 131 | `0.75rem` | `--homepage-runtime-space-3` | `0.75rem` |
| `--space-5` | 133 | `1.25rem` | `--homepage-runtime-space-5` | `1.25rem` |
| `--space-6` | 134 | `1.5rem` | `--homepage-runtime-space-6` | `1.5rem` |
| `--space-8` | 136 | `2rem` | `--homepage-runtime-space-8` | `2rem` |
| `--space-11` | 139 | `2.75rem` | `--homepage-runtime-space-11` | `2.75rem` |
| `--space-12` | 140 | `3rem` | `--homepage-runtime-space-12` | `3rem` |
| `--space-14` | 141 | `3.5rem` | `--homepage-runtime-space-14` | `3.5rem` |
| `--space-16` | 142 | `4rem` | `--homepage-runtime-space-16` | `4rem` |
| `--space-20` | 143 | `5rem` | `--homepage-runtime-space-20` | `5rem` |
| `--space-24` | 144 | `6rem` | `--homepage-runtime-space-24` | `6rem` |
| `--text-2xs` | 173 | `0.625rem` | `--homepage-runtime-font-size-2xs` | `0.625rem` |
| `--home-section-py-base` | 306 | `3rem` | `--homepage-runtime-section-py-base` | `3rem` |
| `--home-section-py-md` | 307 | `4rem` | `--homepage-runtime-section-py-md` | `4rem` |
| `--home-section-py-lg` | 308 | `5rem` | `--homepage-runtime-section-py-lg` | `5rem` |
| `--shadow-listing-card-elevation-lg` | 237 | `0 8px 24px oklch(0.700 0.162 65 / 0.2)` | `--homepage-runtime-listing-card-shadow` | `0 8px 24px oklch(0.700 0.162 65 / 0.2)` |

Every value is a literal in `@theme inline`, not an alias — so each new `:root` token is a **verbatim copy**, and
`§22.1`'s px column (`--space-2` = 8px, `--space-11` = 44px touch-target floor, …) still describes the copied
values. This is the same "reproduce the resolved value as a literal" rule §23.7 states.

### 3.3 The four colour names already have a `:root` destination — no new token

| `@theme inline` name | line | Its declaration | Required replacement | `:root` line | `.dark` override |
|---|---:|---|---|---:|---|
| `--color-muted-foreground` | 48 | `var(--muted-foreground)` | `--muted-foreground` | 408 (`var(--neutral-500)`) | 525 |
| `--color-ring` | 55 | `var(--ring)` | `--ring` | 441 (`var(--brand-700)`) | 551 |
| `--color-badge-premium` | 68 | `var(--badge-premium)` | `--badge-premium` | 448 (`oklch(0.700 0.162 65)`) | 557 |
| `--color-status-success` | 72 | `var(--status-success)` | `--status-success` | 453 (`oklch(0.527 0.173 150)`) | none (same in both themes) |

`INFERENCE` from those four rows: each `@theme inline` colour name is a **pure one-hop alias** of the `:root` name
this task points at, so replacing `var(--color-X)` with `var(--X)` is identical at computed-value time in light and
dark. Nothing is duplicated into `:root`; the destinations already exist.

### 3.4 `--homepage-runtime-*` is an existing family, not a new prefix

`globals.css:341-362` is a `:root` subsection Task 767 added, headed
`/* ── Homepage runtime typography/geometry tokens (Task 767 — Sprint 65 level 2) ── */`, holding twelve tokens:
`--homepage-runtime-font-size-{xs,sm,xl,2xl,3xl,4xl,5xl}`, `--homepage-runtime-line-height-{xs,sm,xl}`,
`--homepage-runtime-font-family-mono`, `--homepage-runtime-search-max-width`. They are consumed today by
`page.tsx:31,34`, `FooterView.module.css` (×9), `HeaderView.module.css` (×4), `MobileNavDrawer.module.css` (×2),
`HeroSearchView.tsx:50` and `MantineCopyIdButton.module.css:22`.

So this task **extends an approved, in-`main` family**; it does not invent a naming scheme. Its nineteen new tokens
go into their own adjacent subsection, immediately after line 362 and before the Brand-shade-scale comment.

### 3.5 The blast radius is wider than "the Homepage" — measured, and it matters

`FACT`, from an import census: five of the twelve manifest files render on routes other than `/[locale]`.
`ListingCard.tsx` (which owns `ListingCard.module.css` and composes `MantineListingCardPattern` +
`MantineCopyIdButton`) is imported by `src/app/[locale]/listings/page.tsx`, `.../favorites/page.tsx`,
`.../cabinet/page.tsx`, `ListingsShell.tsx`, `FavoritesShell.tsx`, `ListingsTab.tsx`, `RecentlyViewedGrid(View).tsx`
and `SimilarListings(View).tsx`, in addition to `FeaturedListingsView.tsx` / `LatestListingsView.tsx` on the
Homepage.

`INFERENCE`: this is a value-preserving rename (§3.2 — every replacement copies the same literal), so no other route
can render differently; but the *changed-file* set is not Homepage-exclusive, and the task's evidence must therefore
prove the **shared card surfaces**, not only the Homepage ones. §3.9 and §13 do that through the canonical
`ListingCard`, `ListingCardPattern`, `HomepageListingGrids` and `CopyIdButton` stories, which render exactly those
modules. The task name stays "Homepage Level 3" because the Homepage is what motivates and bounds the manifest —
not because the diff is Homepage-only. Say it this way in the session log too; do not claim a Homepage-only blast
radius.

### 3.6 What still reads `@theme inline` after this task — 8 files, 18 pairs / 27 uses

Same classifier, run over all of `src/**` **excluding** the twelve manifest files:

| File | Pairs / uses | Names |
|---|---:|---|
| `src/app/[locale]/listings/[slug]/loading.tsx` | 3 / 3 | `--listing-gallery-h-{desktop,mobile,tablet}` |
| `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` | 3 / 6 | same three |
| `src/modules/listings/components/GalleryStaticFrame.tsx` | 3 / 3 | same three |
| `src/modules/listings/components/ListingGallery.tsx` | 3 / 3 | same three |
| `src/components/shared/PerfDevOverlay.tsx` | 2 / 3 | `--color-status-success`, `--color-status-warning` |
| `src/components/ui/button.tsx` | 1 / 4 | `--radius-md` |
| `src/design-system/mantine/input-chrome.css` | 1 / 1 | `--color-input` |
| `src/stories/mantine/primitives/HeroSearch.stories.tsx` | 2 / 4 | `--space-16`, `--space-24` |
| **Total** | **18 / 27** | |

Three consequences, all binding:

1. **`@theme inline` must stay.** Removing or repointing any declaration in it would break these eighteen live
   references. This task changes none of them.
2. **`PerfDevOverlay.tsx` is D65-A-pending** and explicitly out of scope for every Sprint 65 task. Its two reads are
   named here so nobody mistakes them for migration debt this task missed.
3. **`HeroSearch.stories.tsx:57,94` is a known, deliberate divergence.** It duplicates `page.tsx:28`'s hero wrapper
   (`py={{ base: 'var(--space-16)', md: 'var(--space-24)' }}`). After this task, production reads
   `--homepage-runtime-space-16/24` while that story still reads `--space-16/24`. The two values are identical
   (§3.2), so the rendered proof is unaffected and every screenshot cell stays byte-comparable. The story is **not**
   in the production render graph and Sprint 65 §6 plus the candidate brief's own scope both forbid this task from
   editing a permanent story, so it is left alone **and recorded as an input to Task 771**: the day `@theme inline`
   is retired, that story breaks while production does not. Do not "fix it while you are there" — that is §14.7.

### 3.7 The D65-E expected-zero input

`FACT`: `src/components/ui/AppImage.module.css` contains **zero** live `var(--space-0)` references today — Task 768
replaced its single `.imageLayer` read with a native `0` under D65-D, and D65-E transferred the durable control for
that to this task. It is therefore an input the gate **scans** but never counts: it is not one of the 42 pairs and
contributes none of the 79 uses. Its required result is zero live reads; any read is a blocking
`expected-zero reintroduced` finding naming the exact path, property and line. This task never edits the real file.

### 3.8 The extractor primitives this gate must reuse

`scripts/check-css-var-resolvability.mjs` exports, and this repository already depends on, exactly what the new gate
needs — do not write a second implementation of any of them:

| Export | Line | What it gives this task |
|---|---:|---|
| `stripComments(content, isCss)` | 118 | Comment removal with string/template/regex-literal state tracking — the reason a `var(--x)` inside a `/* … */` block or a `"https://…"` string is never counted |
| `extractCssDeclaredNames(rawCssContent)` | 288 | Every `--x:` declaration in one file, anchor-based (the module-local bucket) |
| `findVarReferences(strippedContent)` | 317 | Literal `var(--name)` references with `line` and `hasFallback`, paren-depth aware, dynamic sites excluded by construction |
| `extractOwnedNames(rawGlobalsContent)` | 254 | `@theme` + `@theme inline` + `:root` **combined** — **not** what this task needs; it cannot distinguish the two sources |

`extractOwnedNames`'s block walker (`findAllBlocks`, `:223`, brace-balanced, comment-stripped) is the right
mechanism but the wrong granularity: this gate must hold `plain-root` and `theme-inline` as **separate** sets. Build
those two sets with the same brace-balanced block scan over the stripped source; do not regex the file, and do not
widen `extractOwnedNames`'s contract — `check:css-vars` depends on it as it is.

### 3.9 Storybook coverage — measured from the built index and the harness, not assumed

`storybook-static/index.json` resolves every canonical id this task needs (`FACT`, read 2026-08-26):

| Surface | Story id | Title → export |
|---|---|---|
| Footer | `mantine-primitives-footerview--default` | `Mantine/Primitives/FooterView` → Default |
| Header | `mantine-primitives-headerview--default` | `Mantine/Primitives/HeaderView` → Default |
| Mobile drawer | `mantine-primitives-mobilenavdrawer--default` | `Mantine/Primitives/MobileNavDrawer` → Default |
| Bottom nav | `mantine-primitives-mobilebottomnavview--guest` · `--authenticated` | `Mantine/Primitives/MobileBottomNavView` |
| Hero search | `mantine-primitives-herosearch--default` (+ `--fallback`) | `Mantine/Primitives/HeroSearch` |
| Copy-id button | `mantine-primitives-copyidbutton--default` | `Mantine/Primitives/CopyIdButton` |
| Listing card | `mantine-primitives-listingcard--default` (+ `--favorites-composition`) | `Mantine/Primitives/ListingCard` |
| Section rhythm | `patterns-mantine-homesection--default` | `Patterns/Mantine/HomeSection` |
| Card pattern | `patterns-mantine-listingcardpattern--default` | `Patterns/Mantine/ListingCardPattern` |
| Homepage grids | `patterns-mantine-homepagelistinggrids--default` (+ `--loading`) | `Patterns/Mantine/HomepageListingGrids` |

All ten titles are inside `--mantine-only` scope: `isCanonicalMantineTitle` admits both `Mantine/Primitives/*` and
`Patterns/Mantine/*` (`scripts/check-stories-rendered.mjs:462`, Task 607).

**Per-story viewport sets are not uniform** (`docs/qa-profiles.md`). Measured from
`scripts/check-stories-rendered.mjs:395-457`:

- Base `MANTINE_VIEWPORTS` = `mobile-320`, `mobile-375`, `mobile-390`, `desktop-1024`; `LOCALES` = `sq, en, uk, it`
  (`:115`) — **16 cells** per story.
- `HeroSearch` additionally gets `band-700` → 20 cells.
- `HomeSection` additionally gets `wide-1200`, `wide-1440`, `wide-1536` → 28 cells.
- **Every other affected story stops at 1024.** `FooterView`, `HeaderView`, `MobileNavDrawer`, `MobileBottomNavView`,
  `CopyIdButton`, `ListingCard`, `ListingCardPattern` and `HomepageListingGrids` have **no** standing cell above
  1024px. That measured gap — not a preference — is why §13.2's focused 1440 probe exists, and why the probe's set
  is `FooterView, HeaderView, HeroSearch, HomeSection, HomepageListingGrids, ListingCard`.
  `ListingCardPattern` and `CopyIdButton` are covered at 1440 *through* `ListingCard`/`HomepageListingGrids`, which
  render them as real children; `MobileNavDrawer` and `MobileBottomNavView` are mobile-only surfaces with nothing to
  prove at 1440. Do **not** add widths to `MANTINE_VIEWPORTS` — that injects unvetted cells into ~40 unrelated
  stories, which is precisely why `MANTINE_STORY_EXTRA_VIEWPORTS` exists (`:417`).

`FACT` correcting a Task 767 kickoff note: `screenshots:assert` writes to
`.screenshots/rendered-assert/<timestamp>/` (`:1470`), one directory per run. The pre-edit run is **not** overwritten
by the post-edit run; retain both timestamps and record them. Do not copy the directory aside "to protect it".

### 3.10 Visual source map

| Visible artifact/state | Component/markup | Selector / prop | Current token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Page bottom gutter above the mobile bottom nav | `layout.tsx:50` | Mantine `pb={{ base, md }}` | `var(--space-14)` → `@theme inline:141` | changed (rename, value identical) | route probe computed `padding-bottom` @320/768/1440 |
| Hero section vertical rhythm | `page.tsx:28` | Mantine `py={{ base, md }}` | `var(--space-16/24)` → `@theme inline:142,144` | changed (rename) | route probe computed `padding-top/bottom` |
| Footer column gaps, legal row | `FooterView.module.css:35,45,46,89` | `gap` / `padding` | `var(--space-12/14/2-5)` | changed (rename) | story cells + computed-style pass |
| Header nav paddings and gaps | `HeaderView.module.css:55,56,61,70,90,114,127` | `gap` / `padding` | `var(--space-1/2/6/16)` | changed (rename) | same |
| Bottom-nav item box, height, safe-area | `MobileBottomNavView.module.css:58,59,60,69,80,86,87,117,118,152,157,158` | `inset`/`height`/`gap`/`padding` | `var(--space-0/3/5/6/12/14)` | changed (rename) | Guest + Authenticated story cells |
| Hero search inner spacing and control height | `HeroSearchView.module.css:59,71,95,99,109,120` | `gap`/`padding`/`inset`/`height` | `var(--space-0/2/3/6/11)` | changed (rename) — `--space-11` is §12a's 44px touch-target floor | story cells incl. `band-700`; computed `height` ≥ 44px asserted |
| Copy-id glyph size and colours | `MantineCopyIdButton.module.css:20,21,34,43,48` | `font-size`, `color`, `color-mix`, `box-shadow`, icon `color` | `var(--text-2xs)`, `var(--color-{muted-foreground,ring,status-success})` | changed (rename / alias-hop removal) | CopyIdButton story cells, light **and** dark computed colour |
| Section band rhythm at base/md/xxl | `MantineHomeSection.tsx:44-46` | Mantine `py={{ base, md, xxl }}` | `var(--home-section-py-*)` → `@theme inline:306-308` | changed (rename) | HomeSection story's own `wide-1200/1440/1536` cells |
| Card grid gaps, badges, elevation | `MantineListingCardPattern.module.css` (30 uses, §3.1) | `gap`/`padding`/`inset`/`background`/`box-shadow` | `var(--space-*)`, `var(--color-badge-premium)`, `var(--shadow-listing-card-elevation-lg)` | changed (rename) | ListingCardPattern + ListingCard + HomepageListingGrids cells |
| Homepage grid section gaps | `FeaturedListingsView.module.css:43,46` · `LatestListingsView.module.css:32,35` | `gap` | `var(--space-2/3)` | changed (rename) | HomepageListingGrids cells |
| Listing card inner spacing | `ListingCard.module.css:51,52,58,59,77` | `gap`/`padding` | `var(--space-1/6/8)` | changed (rename) | ListingCard cells |
| Task 764 hover/scale, `imageActions` trigger area | `MantineListingCardPattern.module.css` (other rules) | — | — | **preserved — untouched** | `git diff` hunk inspection; no line outside §3.1's list changes |
| Task 765 `:root` motion/radius tokens; Task 767 `--homepage-runtime-*` tokens | `globals.css:328-340`, `:341-362` | — | — | **preserved — byte-unmodified** | `git diff` hunk inspection (AC10) |
| `@theme inline` block | `globals.css:35-316` | — | legacy utility alias layer | **byte-unmodified** | `git diff` hunk inspection (AC10) |
| `AppImage.module.css` | — | — | D65-E expected-zero input | **read-only — never edited** | `git diff --stat` shows no AppImage path |

### 3.11 Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Shared style/token path and required registration |
|---|---|---|---|---|
| Footer spacing | `storybook-static/index.json` read; `src/stories/mantine/primitives/FooterView.stories.tsx` opened | `Mantine/Primitives/FooterView` → Default | **reuse** | Auto-discovered by `screenshots:assert --mantine-only`; no story edit, no registration change |
| Header spacing | `HeaderView.stories.tsx` opened | `Mantine/Primitives/HeaderView` → Default | **reuse** | as above |
| Mobile drawer | `MobileNavDrawer.stories.tsx` opened | `Mantine/Primitives/MobileNavDrawer` → Default | **reuse** | as above |
| Bottom nav | `MobileBottomNavView.stories.tsx` opened | `Mantine/Primitives/MobileBottomNavView` → Guest, Authenticated | **reuse** | as above |
| Hero search | `HeroSearch.stories.tsx` opened (its own `--space-16/24` reads recorded in §3.6.3) | `Mantine/Primitives/HeroSearch` → Default | **reuse** | as above, plus its `band-700` cell |
| Copy-id button | `CopyIdButton.stories.tsx` opened | `Mantine/Primitives/CopyIdButton` → Default | **reuse** | as above |
| Section rhythm | `HomeSection.stories.tsx` opened | `Patterns/Mantine/HomeSection` → Default | **reuse** | as above, plus its `wide-1200/1440/1536` cells |
| Listing card / card pattern / grids | `ListingCard.stories.tsx`, `ListingCardPattern`, `HomepageListingGrids` resolved from the built index | `Mantine/Primitives/ListingCard`, `Patterns/Mantine/ListingCardPattern`, `Patterns/Mantine/HomepageListingGrids` | **reuse** | as above; `HomepageListingGrids` is the canonical coverage for the real `FeaturedListingsView`/`LatestListingsView` imports — do **not** call the legacy `System/FeaturedListings` or `System/LatestListings` stories |
| Hero and page shell at the real route | `page.tsx`, `layout.tsx` read in full | none — a route page has no story, by design | **reuse (nothing to create)** | Proven only by §13.3's route probe, exactly as Task 766 AC5 and Task 767 AC7 were |

**Permanent-story creation gate: satisfied with zero additions and zero edits.** Every changed surface is already
rendered by an existing canonical story with the real production component, or is a route-only state with a
task-owned probe. Sprint 65 §6 forbids adding a story to satisfy a detector; this task also does not *edit* one
(§3.6.3). If a required state turns out to be unreachable, that is §14.6 — not a licence to add markup.

### 3.12 Start state and the dirty-worktree rule

Task 769 was committed to `main` as `06091ba1d` while this kickoff was being written, so the design-time worktree
resolved to a clean tree at that commit plus **this task's own filing artifacts only** — `M docs/backlog.md`,
`M tasks/Sprints/Sprint_65_Homepage_Finishes_The_Tailwind_Exit.md`, `?? tasks/Sprints/Sprint_65_kickoff_prompt_Task_770_…md`.
Those three are committed by the owner as part of filing this task and are not present when the executor starts.

**The executor's required start state is a clean tree at or after `06091ba1d`.** If `git status --porcelain` is
non-empty at §10.0, return `BLOCKED` and name the entries — do not stash, do not commit, do not work around another
task's tree (§14.1). If the owner has instead left something else dirty on purpose, complete
`docs/orchestrator-dirty-worktree-manifest-template.md` for **every** entry before the first write, and recapture it
immediately before that write; a design-time snapshot is never the executor's start state.

**One measured environment note.** `.git/index.lock` is present as a zero-byte file in this working copy. It is an
artifact of a read-only mount that cannot unlink the lock Git creates for its own index refresh — the owner's native
commits at `7bde7242e` and `06091ba1d` both succeeded with it present. Run the standard stale-lock preflight before
any mutating Git command anyway; do not treat its presence alone as `GIT WRITE BLOCKED`.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Sprint 65 §2 level 3 | After the change, the twelve manifest files of §3.1 contain **zero** `theme-inline-only` and **zero** `unknown` literal `var()` references. | P0 | AC4, AC5 | Confirmed |
| R2 | §3.2 | Nineteen new tokens are declared **once each**, in one new `:root` subsection of `globals.css`, each value copied verbatim from the `@theme inline` line named in §3.2. | P0 | AC2 | Confirmed |
| R3 | §3.3 | The four colour reads point at the existing `:root` names (`--muted-foreground`, `--ring`, `--badge-premium`, `--status-success`). No colour token is duplicated into the new subsection. | P0 | AC2, AC3 | Confirmed |
| R4 | Sprint 65 §3 rule 3 (D28) | Every replacement is mechanical and value-preserving: same declaration, same property, same computed value, in light **and** dark. No markup, component, selector, media query, or Mantine prop other than the token name inside the `var()` changes. | P0 | AC3, AC7, AC8, AC9 | Confirmed |
| R5 | Candidate brief §4 | `scripts/check-homepage-theme-runtime-deps.mjs` exists, is registered as `check:homepage-theme-runtime-deps`, holds the **thirteen** input paths of §3.1 + §3.7 hardcoded, and is fatal if any of the thirteen is absent. | P0 | AC5, AC6 case 3 | Confirmed |
| R6 | Candidate brief §4 | The gate classifies every literal reference in the twelve migration inputs into exactly one of `root-owned`, `theme-inline-only`, `mantine-external`, `module-local`, `unknown`, reporting file, line and property. `theme-inline-only` and `unknown` are **blocking**. | P0 | AC5 | Confirmed |
| R7 | D65-E | `AppImage.module.css` is scanned as an **expected-zero** input, never as a migration pair or use: it can never change the required report totals. A live `var(--space-0)` read there is a blocking `expected-zero reintroduced` finding naming path, property and line, non-zero in normal mode **and** `--verify-gate`. | P0 | AC5, AC6 case 4 | Confirmed |
| R8 | Sprint 65 §3 rule 1 | `--verify-gate` asserts the **five** outcomes of §10.4 in `mkdtemp` copies. No plant, rename or delete touches the real worktree. Each case prints its actual exit code and its decisive path/line/property or fatal message. | P0 | AC6 | Confirmed |
| R9 | Sprint 65 §3 rule 2 | No `design-tokens-allow:` marker, allowlist row, baseline file, exemption or skip marker is added to reach green. The gate has no baseline by construction. | P0 | AC11 | Confirmed |
| R10 | §3.6, Sprint 65 §8 | `@theme inline` (`globals.css:35-316`) is **byte-unmodified**, as are Task 765's and Task 767's `:root` subsections, `AppImage.module.css`, and every file outside §7's write set. | P0 | AC10 | Confirmed |
| R11 | `docs/qa-profiles.md` Q3 | Pre/post `build-storybook` + `screenshots:assert -- --mantine-only` runs whose retained manifests cover the same affected canonical cell set, with a per-cell comparison; plus the §13.2 focused 1440 evidence and the §13.3 real-route evidence, pre and post. | P0 | AC7, AC8, AC9 | Confirmed |
| R12 | `CLAUDE.md` → Documentation update rule; `docs/design-system.md` §22.3 banner | `docs/design-system.md` gains (a) a registry subsection for the `--homepage-runtime-*` family listing every token and its value, and (b) a `§23.8` describing the new blocking gate: its thirteen fixed inputs, its five categories, its D65-E expected-zero arm, and the manifest-scoped boundary. | P1 | AC12 | Confirmed |
| R13 | `docs/agent-contract.md` §9 | `npm run build` exits 0 on the final diff, with its transcript retained. | P0 | AC13 | Confirmed |
| R14 | `docs/agent-contract.md` §10 | Session log with a `Files Changed` table matching the real diff, concise `docs/backlog.md` state, §10.0 and final measurements side by side, status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Never self-approve. | P1 | AC13 | Confirmed |

## 5. Assumptions and open questions

### Corrections this kickoff makes to the candidate brief

1. **Its §5 scope omits documentation.** It permits only `globals.css`, the twelve files, the gate script, its
   package entry, the two probe scripts and evidence records. But this task ships a **new blocking gate** and
   nineteen new durable `:root` tokens, and `CLAUDE.md`'s Documentation update rule ("when changing project rules,
   update the most specific file in `docs/`") is a project rule a planning file cannot waive. R12 adds
   `docs/design-system.md` to the write set. The registry subsection deliberately documents the **whole**
   `--homepage-runtime-*` family, including Task 767's twelve tokens, which `docs/design-system.md` records nowhere
   today (`FACT`: zero matches for `homepage-runtime` in that file) — documenting only the new nineteen would leave
   a half-registry, which is the failure mode §22.3's ⚠️ banner exists to prevent. This is a documentation-only
   extension: no Task 767 token value or consumer changes.
2. **Its §4 lists four verify-gate cases and then states a fifth requirement in prose** ("the unmodified temporary
   tree exits 0 with `42 / 79` migration totals and zero expected-zero findings"). §10.4 makes that the fifth
   asserted, printed outcome. The required count is **five**.
3. **Its §2 heading says the totals are "the fixed source manifest" without stating the classifier.** §3.1 states
   the exact classification order and reproduces the totals file by file, so the executor's §10.0 re-measure is a
   comparison against a derivation, not against a number.

### Assumptions (labelled; each cheap to reverse)

- `A1` — the 42 / 79 census and the nineteen values are stable between filing and execution. `FACT` at filing;
  re-measured in §10.0. Drift is a stop condition (§14.2), never licence to widen.
- `A2` — Task 769 is in `main` unchanged from its approved state. `FACT` at filing: committed as `06091ba1d`,
  after which the §3.1 census, the §3.2/§3.3 value probes and the §3.7 expected-zero probe were all re-run and were
  unchanged. §10.0 re-verifies it as freshness validation; §14.1 blocks without it.
- `A3` — `screenshots:assert --mantine-only` still discovers all ten titles of §3.9 at execution time. `FACT` from
  the built index at filing; the pre-edit run re-establishes it, and a story that disappears from the run is §14.5.

### Open questions

**None.** `UNKNOWN`: none. `CONFLICT`: none — the candidate brief's documentation-scope omission is resolved above
against a standing project rule, not against a competing owner decision.

### Not folded in, deliberately

- Task 766 F1 / Task 767 F7 — CI wiring for `check:homepage-literal-utilities` and
  `check:tailwind-runtime-tokens:verify-gate`. `Codex-tasks/README.md` routes them to a separate task. This task
  registers its own gate in `package.json` but adds **no** workflow entry, for the same reason.
- Task 767 F5 (JSX spread attributes are an undocumented scanner blind spot) and F6 (`evaluateTree` reimplements
  `run()`'s verdict rule), and Task 769's six P3 notes (F1 unreachable parse-failure arm, F2 banner omits the fourth
  ownership source, F3 AC3 evidence gap closed in review, F4 one header line, F5 kickoff label, F6 extractor slightly
  wider than the spec text). All remain open and unnumbered. The executor must not fix them opportunistically; the
  reviewer must not treat their absence as a defect.
- `PerfDevOverlay.tsx` — D65-A pending (§3.6.2).
- `HeroSearch.stories.tsx`'s two `@theme inline` reads — §3.6.3, recorded as an input to Task 771.

## 6. Pre-read rule bundle

Read exactly these, in this order. Do not read "all docs".

1. `docs/agent-contract.md` — P0 invariants 1, 2, 5, 6, 6a, 8, 9, 10.
2. `docs/rule-index.md` → "Always Required" and "UI / Layout / Component → Current Mantine path".
3. `docs/qa-profiles.md` → the `Q3` row, "UI evidence routing", "Viewport policy" (per-story viewport sets), and
   "Comparing a rendered run against a baseline".
4. `docs/backlog.md` — current state and the 770 registry row.
5. `tasks/Sprints/Sprint_65_Homepage_Finishes_The_Tailwind_Exit.md` — §2 levels and exit criteria, §3 binding rules
   1-6, §4 closed work, §5 decisions D65-A/D/E/F, §8 what the sprint does not authorise.
6. `docs/design-system.md` §22.1 (spacing registry), §22.2, §22.3 and its ⚠️ banner, §23.6.c (`css-undefined-var`),
   §23.7 (the Task 762/769 runtime-token section) — and the `§23.8` this task writes.
7. `docs/mantine-responsive-design-system.md` — the responsive prop/breakpoint contract behind
   `MantineHomeSection`'s `base/md/xxl` object and `page.tsx`'s `base/md` objects.
8. `docs/storybook-governance.md` §14.9.17 (per-story viewport mechanism) and §14.11 / D26 (the comparator and the
   sub-perceptual tolerance — do **not** invent a per-task pixel tolerance).
9. `scripts/check-css-var-resolvability.mjs` — `stripComments`, `extractCssDeclaredNames`, `findVarReferences`,
   `findAllBlocks`, `extractOwnedNames` (§3.8).
10. `scripts/check-tailwind-runtime-tokens.mjs` — the `--verify-gate` `mkdtemp` pattern and its fail-closed input
    handling, as the shape to follow.
11. `scripts/task767-homepage-runtime-probe.mjs` — the route-probe contract to model §13.3 on.

Not required, and not authority over this kickoff: `Codex-tasks/Task_770_Homepage_Theme_Inline_Runtime_Exit.md`
(superseded candidate; see §5).

## 7. Scope

| Path | Permitted change |
|---|---|
| `src/app/globals.css` | **One** new `:root` subsection with the nineteen tokens of §3.2, inserted after line 362 and before the Brand-shade-scale comment. Nothing else in the file. |
| the twelve files of §3.1 | Only the token name inside each listed `var()`, per §10.2's mapping. |
| `scripts/check-homepage-theme-runtime-deps.mjs` | New file — §10.3, §10.4. |
| `package.json` | Exactly two new script entries: `check:homepage-theme-runtime-deps` and `check:homepage-theme-runtime-deps:verify-gate`. No dependency change. |
| `scripts/task770-storybook-capture.mjs` | New file — §13.2. |
| `scripts/task770-homepage-route-probe.mjs` | New file — §13.3. |
| `docs/design-system.md` | R12 only: the `--homepage-runtime-*` registry subsection and `§23.8`. |

Plus the three records every task writes: the session log under `docs/sessions/`, its evidence directory
`docs/sessions/evidence/task770/`, and the concise `docs/backlog.md` state line.

## 8. Out of scope

Do not change, for any reason, including "while I was there":

- `@theme inline` (`globals.css:35-316`) — not one declaration, not one alias, not one byte. It is the live alias
  layer for the eighteen references of §3.6.
- Task 765's `:root` motion/radius subsection and Task 767's `--homepage-runtime-*` subsection — consumed, never
  rewritten. R12 documents 767's tokens; it does not touch them.
- `src/components/ui/AppImage.module.css`, `AppImage.tsx`, `appImageConfig.ts` — read-only expected-zero input
  (§3.7); D65-D was a one-line, one-task exception and is closed.
- `src/components/shared/PerfDevOverlay.tsx` — D65-A pending.
- Any permanent Storybook story, including `HeroSearch.stories.tsx` (§3.6.3), `mantine-migration-scope.json`,
  `MANTINE_VIEWPORTS`, `MANTINE_STORY_EXTRA_VIEWPORTS`, or any screenshot policy or command.
- `scripts/tailwind-runtime-token-baseline.json`, `scripts/design-tokens-allowlist.json`, any marker, allowlist or
  baseline anywhere.
- `scripts/check-tailwind-runtime-tokens.mjs`, `scripts/check-css-var-resolvability.mjs`,
  `scripts/check-homepage-literal-utilities.mjs` — reuse the exports of §3.8; do not widen, copy, weaken or work
  around any of these gates.
- `@import`, `@custom-variant`, `@source`, `@apply`, or any Tailwind directive (Sprint 65 §8).
- `.github/workflows/**` — no CI wiring here (§5).
- Any file not named in §7, and any of the eight non-manifest files of §3.6.

## 9. Current and required behavior

| | Current | Required |
|---|---|---|
| Twelve manifest files' `@theme inline` reads | 42 pairs / 79 uses | **0 / 0** |
| Their computed values | e.g. `HeaderView` gap `8px`, `HeroSearchView` control height `44px`, `HomeSection` `py` `48/64/80px`, card shadow `0 8px 24px oklch(0.700 0.162 65 / .2)` | **identical, every cell** |
| Copy-id colours in dark mode | `--color-muted-foreground` → `--muted-foreground` → `.dark:525` | **identical** — one alias hop removed, same terminal value |
| `@theme inline` | 185 declarations | **byte-identical** |
| Non-manifest `@theme inline` readers | 8 files, 18 pairs / 27 uses | **unchanged** — this task does not migrate them |
| `AppImage.module.css` `var(--space-0)` | 0 live reads | **0**, now enforced by a durable gate |
| `check:homepage-theme-runtime-deps` | does not exist | exists, exits 0 on the migrated tree, blocks on `theme-inline-only`, `unknown`, a missing input, or an expected-zero reintroduction |
| `--verify-gate` | n/a | five asserted outcomes (§10.4) |
| Rendered output on `/[locale]`, `/listings`, `/favorites`, `/cabinet` | — | **no change**, proven per §13 |

**Positive flow.** A visitor loads `/en`. The header, hero, hero search, section bands, listing-card grids, footer
and (below 768px) the bottom nav render with exactly the paddings, gaps, heights, radii, colours and card elevation
they render with today; the values now resolve from `:root` tokens this project owns rather than through Tailwind's
`@theme inline` alias layer. The same is true of the shared card surfaces on `/listings`, `/favorites` and
`/cabinet` (§3.5).

**Negative-flow applicability.**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation (gate input missing / unparsable) | **Yes** | the new gate's input contract, modelled on `check-tailwind-runtime-tokens.mjs`'s fail-closed shape | fatal naming every missing repo-relative path; non-zero in both modes | AC5, AC6 case 3 |
| Validation (expected-zero input reintroduced) | **Yes** | D65-E | blocking finding with exact path/property/line; non-zero in both modes | AC6 case 4 |
| Rendered regression (a value silently changes) | **Yes** | Sprint 65 rule 3 (D28) | zero computed-value delta and zero unexplained cell delta | AC7, AC8, AC9 |
| Dark mode | **Yes** | `globals.css:504-579` | the four colour reads resolve identically in `.dark` | AC3 |
| Authorization / RLS | No | No route handler, server action or data access is touched | N/A | — |
| Offline / network | No | CSS custom properties and a local CLI scan; no network path | N/A | — |
| Concurrent writer | No | Single-pass scan; the only writes are into `mkdtemp` copies torn down in `finally` | N/A | — |
| Localization | No | No user-facing string changes. All four locales are still rendered, because the screenshot matrix is per-locale and a spacing regression can be locale-dependent through text length | AC7 |

## 10. Implementation requirements

Order is load-bearing. The control's **report mode ships and runs before the first consumer edit** (Sprint 65 rule
1). A migration run whose pre-edit report was never taken cannot prove 42 → 0 and is `PARTIALLY IMPLEMENTED`.

### 10.0 Mandatory first action — prove the tree, before any source edit

Run these read-only from the project root in **native Windows PowerShell**, capture `$LASTEXITCODE` unpiped
immediately after each command, and paste every result into the session log:

```powershell
node.exe -p process.platform
git --no-optional-locks status --short --branch
git --no-optional-locks log -1 --oneline
git --no-optional-locks log --oneline -3

npm.cmd run check:tailwind-runtime-tokens;              "exit=$LASTEXITCODE"
npm.cmd run check:tailwind-runtime-tokens:verify-gate;  "exit=$LASTEXITCODE"
npm.cmd run check:css-vars;                             "exit=$LASTEXITCODE"
npm.cmd run check:design-tokens;                        "exit=$LASTEXITCODE"
npm.cmd run check:homepage-literal-utilities;           "exit=$LASTEXITCODE"

Select-String -Path src\app\globals.css -Pattern '^\s*--space-(0|1|2|2-5|3|5|6|8|11|12|14|16|20|24)\s*:'
Select-String -Path src\app\globals.css -Pattern '^\s*--(text-2xs|home-section-py-(base|md|lg)|shadow-listing-card-elevation-lg)\s*:'
Select-String -Path src\app\globals.css -Pattern '^\s*--(muted-foreground|ring|badge-premium|status-success)\s*:'
Select-String -Path src\components\ui\AppImage.module.css -Pattern 'var\(--space-0\)'
```

**Expected, exactly:**

- platform `win32`; branch `## main...origin/main`; **Task 769 present in `main`** — `06091ba1d`
  (`fix(Task769): fail-closed TSX inputs and theme.ts ownership in the runtime-token scanner (D65-F)`) must appear
  in `git log --oneline -3`, and `git status --short` must be **empty**. A `HEAD` behind `06091ba1d`, or a
  non-empty status, is `BLOCKED` (§14.1).
- all five gates exit 0 — 769's hardened runtime-token gate is a precondition (candidate brief §1) and its
  `--verify-gate` must report `10/10`.
- the three `Select-String` token probes print the nineteen `@theme inline` definition lines and the four `:root`
  colour definition lines with the values of §3.2 / §3.3. **Quote the matched lines in the session log** — a
  documented token is not an implemented token (`docs/orchestrator-procedures.md`).
- the `AppImage` probe prints **nothing** (zero live reads, §3.7).

Then, still before any consumer edit, build the gate's **report mode** (§10.3) and run it:

```powershell
node.exe scripts/check-homepage-theme-runtime-deps.mjs --report;  "exit=$LASTEXITCODE"
```

It must print **exactly `42` pairs / `79` uses**, the per-file breakdown of §3.1, and **zero** expected-zero
findings. Retain that transcript as `docs/sessions/evidence/task770/pre-edit-report.txt`. Any other total, path or
category is `BLOCKED` (§14.2) — re-measure the task design; do not add an exception, a file, or a category.

### 10.1 The new `:root` subsection — nineteen tokens, declared once

Insert **one** new subsection into `globals.css`'s `:root` block immediately after line 362
(`--homepage-runtime-search-max-width: 48rem;`) and before the `/* ── Brand shade scale … ── */` comment, headed in
the same style as Task 767's:

```
  /* ── Homepage runtime spacing/rhythm/elevation tokens (Task 770 — Sprint 65 level 3) ──────
     Project-owned runtime tokens that survive Tailwind's removal. Every value is copied verbatim
     from the @theme inline declaration named beside it (kickoff §3.2) — none is a restyle.
     @theme inline keeps its own --space-*/--text-2xs/--home-section-py-*/--shadow-* declarations
     untouched: it remains the alias layer for legacy Tailwind utilities and for the eighteen
     non-manifest references measured in kickoff §3.6. */
```

Then the nineteen declarations of §3.2's fourth column, each with the value from its fifth column and a trailing
comment naming its source line. Requirements:

- Exactly nineteen new declarations. Each name appears **once** in the file.
- No colour token is added — §3.3's four destinations already exist (R3).
- No existing line in `globals.css` changes. The `@theme inline` block stays byte-identical (R10).

### 10.2 The twelve consumers — mechanical replacement only

For every reference enumerated in §3.1, and for no other line, apply this mapping:

| Legacy reference | Required replacement |
|---|---|
| `var(--space-N)` | `var(--homepage-runtime-space-N)` (all fourteen N of §3.2, including `2-5`) |
| `var(--text-2xs)` | `var(--homepage-runtime-font-size-2xs)` |
| `var(--home-section-py-base\|md\|lg)` | `var(--homepage-runtime-section-py-base\|md\|lg)` |
| `var(--shadow-listing-card-elevation-lg)` | `var(--homepage-runtime-listing-card-shadow)` |
| `var(--color-muted-foreground)` | `var(--muted-foreground)` |
| `var(--color-ring)` | `var(--ring)` |
| `var(--color-status-success)` | `var(--status-success)` |
| `var(--color-badge-premium)` | `var(--badge-premium)` |

Binding constraints:

- **Only the name inside the `var()` changes.** The property, the shorthand position, the `color-mix()` wrapper at
  `MantineCopyIdButton.module.css:21`, the `box-shadow` geometry at `:43`, every media query, every Mantine
  responsive object key (`base`/`md`/`xxl`), and every surrounding declaration stay identical (R4).
- The `MantineHomeSection.tsx:44-46` and `page.tsx:28` and `layout.tsx:50` sites are Mantine responsive-prop object
  values — string literals. Replace the string content only; do not restructure the object or its breakpoint keys.
- Add a short trailing comment at each changed CSS declaration in the same style Task 767 used
  (`/* Task 770 — was @theme inline --space-2 = 0.5rem (§22.1) */`), so the next reader sees the provenance without
  opening the kickoff. TSX sites get one comment per changed prop, not per line.
- Do not touch a `var()` in those files that §3.1 does not list — several are `module-local` or already
  `root-owned`, and changing one is out of scope.

### 10.3 The control — `scripts/check-homepage-theme-runtime-deps.mjs` (R5, R6, R7)

A fixed-manifest ownership check. **Not** a route-graph parser, **not** a directory walk.

**Inputs.** Thirteen hardcoded repository-relative paths: the twelve of §3.1 as `migration inputs`, plus
`src/components/ui/AppImage.module.css` as the single `expected-zero input`. Resolve all thirteen **before** any
scanning; if one or more are absent, return a fatal naming **every** missing path, repository-relative and
forward-slashed, and exit non-zero in **both** modes. This is the same fail-closed shape Task 769 gave
`check-tailwind-runtime-tokens.mjs`; follow it, do not re-derive it.

**Ownership sources.** Read `src/app/globals.css` once. Using `stripComments` and a brace-balanced block scan
(§3.8), build **two separate** name sets:

- `plainRoot` — every `--x:` declared in a top-level `:root` block;
- `themeInline` — every `--x:` declared in an `@theme inline` block.

A missing, unreadable or empty-parse `globals.css` is fatal, exactly as `check-tailwind-runtime-tokens.mjs:637-651`
already is. Do not use `extractOwnedNames` — it merges the two sets and cannot answer this question (§3.8).

**Classification.** For every **literal** `var()` reference in each migration input — via `findVarReferences` over
`stripComments(raw, isCss)`, so a reference inside a comment or a string is never counted — emit one row with file,
line, property and exactly one category, decided in this order:

1. `mantine-external` — name starts with `--mantine-`;
2. `module-local` — declared in the same `.css` file (`extractCssDeclaredNames`); never applies to a `.tsx` input;
3. `root-owned` — in `plainRoot`;
4. `theme-inline-only` — in `themeInline` and not in `plainRoot`;
5. `unknown` — none of the above.

`theme-inline-only` and `unknown` are **blocking**. There is no baseline, marker, allowlist or exemption — none may
be added (R9).

**The D65-E expected-zero arm.** Scan `AppImage.module.css` with the same extractor, but it is **not** a migration
pair or use and can never change the report totals. Its required result is **zero** live `var(--space-0)`
references. Any such reference is a blocking `expected-zero reintroduced` finding printing the exact path, property
and line, and makes both normal mode and `--verify-gate` exit non-zero.

**Boundary to state in the script header and in `§23.8`:** the input list is closed at thirteen paths. A clean run
makes no claim about any other file in the repository, and it is not a route certification (D65-C). A thirteenth
file that starts reading `@theme inline` tomorrow is invisible to this gate by design — that is the deliberate cost
of a fixed manifest, and it is why the missing-input arm is fatal rather than skipped.

**Modes.**

- default — prints the totals and every blocking row; exits 1 if any `theme-inline-only`, `unknown`, missing input,
  or expected-zero finding exists; otherwise 0.
- `--report` — prints every row grouped by file with pair and use totals; exits 0 unless a fatal input error occurs
  (a fatal is never reported with exit 0, in any mode).
- `--verify-gate` — §10.4.

Register both `check:homepage-theme-runtime-deps` and `check:homepage-theme-runtime-deps:verify-gate` in
`package.json` (R5). No CI workflow entry (§5).

### 10.4 `--verify-gate` — five asserted outcomes (R8)

Every case runs inside its own fresh `mkdtempSync` copy of the tree it needs, torn down in `finally`. **No plant,
rename or delete may touch the real worktree** — the pattern is `scripts/check-tailwind-runtime-tokens.mjs`'s
`setupTempTree`/`evaluateTree`. Each case prints its **actual** exit code and its decisive path/line/property or
fatal message.

| # | Copied-tree operation | Required result | Why it is required |
|---:|---|---|---|
| 1 | add a `padding` declaration reading `var(--space-2)` to the copied `HeroSearchView.module.css` | exit 1; one `theme-inline-only` row naming that file, line and `--space-2` | the CSS failure path — the exact debt this task removes |
| 2 | replace the copied `MantineHomeSection.tsx`'s migrated base token with `var(--home-section-py-base)` | exit 1; one `theme-inline-only` row naming that file, line and property | the TSX failure path — a different extractor arm from case 1 |
| 3 | delete one configured migration input from the copied tree, leaving the hardcoded list untouched | exit 1; fatal naming the missing repository-relative path | R5 — the input list is fatal, never silently shortened |
| 4 | change the copied `AppImage.module.css`'s `inset: 0` to `inset: var(--space-0)` | exit 1; `expected-zero reintroduced` naming path, property and line | **D65-E** — the durable control Task 768 transferred here |
| 5 | unmodified copy | exit 0; **`42` pairs / `79` uses**; zero `theme-inline-only`, zero `unknown`, zero expected-zero findings | the passing control, and the standing assertion that the totals are an invariant |

Case 5's totals are asserted **after** the migration, so on the final tree it reads `42 / 79` **scanned** rows with
`0` blocking. State the two numbers the gate prints unambiguously in its output: total classified pairs/uses, and
blocking pairs/uses. Do not print one number that means both.

### 10.5 Documentation (R12)

Amend `docs/design-system.md` in place — no renumbering of any existing section:

1. **A registry subsection for the `--homepage-runtime-*` family**, placed with §22's token registry. List every
   token of the family — Task 767's twelve (`globals.css:348-362`) and this task's nineteen — with its value and
   its `globals.css` line, and state the rule: these are project-owned `:root` runtime tokens that survive
   Tailwind's removal; `@theme inline`'s `--space-*` / `--text-*` / `--color-*` remain the alias layer for legacy
   utilities and must not be read by a migrated consumer. Cross-reference §22.1's px column so the spacing scale is
   not documented twice with two sources of truth.
2. **A new `§23.8`** for the gate: its thirteen fixed inputs, the five categories and which two block, the D65-E
   expected-zero arm with its exact finding shape, the five `--verify-gate` outcomes, the no-baseline/no-marker
   rule, and the manifest-scoped boundary of §10.3 (it certifies thirteen files, not a route). Cite Sprint 65's
   level-3 definition and D65-E with its date.

## 11. Positive and negative flows

See §9 — the positive flow and the applicability table are stated there, against the current/required behavior they
belong to.

## 12. Acceptance criteria

- **AC1 [R1-R14]** — Given the final `git diff --stat`, then exactly these non-record paths appear: `src/app/globals.css`,
  the twelve files of §3.1, `scripts/check-homepage-theme-runtime-deps.mjs`, `scripts/task770-storybook-capture.mjs`,
  `scripts/task770-homepage-route-probe.mjs`, `package.json`, `docs/design-system.md`. No `AppImage`, no workflow,
  no story, no baseline, no allowlist. The full diff of `globals.css` and of the gate script is pasted.
- **AC2 [R2, R3]** — Given `Select-String -Path src\app\globals.css -Pattern '^\s*--homepage-runtime-'`, then it
  returns exactly **31** lines (Task 767's twelve + this task's nineteen), each name once, each new value equal to
  the §3.2 source value. No `--homepage-runtime-color-*` token exists.
- **AC3 [R3, R4]** — Given a computed-style read of `MantineCopyIdButton`'s `.copyId` in **both** light and dark
  from the built Storybook, pre and post, then `color`, `box-shadow` and the copied-icon `color` are string-equal
  across the pair. Both transcripts are pasted.
- **AC4 [R1]** — Given `node scripts/check-homepage-theme-runtime-deps.mjs` on the final tree, then it exits 0 with
  zero `theme-inline-only` rows, zero `unknown` rows and zero expected-zero findings; and `--report` shows the same
  42 pairs / 79 uses now classified `root-owned` (or `module-local`/`mantine-external` where §3.1 does not list
  them). The pre-edit and post-edit reports are pasted side by side.
- **AC5 [R5, R6, R7]** — Given the gate source, then its thirteen inputs are hardcoded, a missing input is fatal in
  both modes, the five categories are implemented in the §10.3 order, and `AppImage.module.css` is scanned outside
  the pair/use totals. Given `--verify-gate` case 3 and case 4 output, both exit 1 with their exact messages.
- **AC6 [R8]** — Given `npm run check:homepage-theme-runtime-deps:verify-gate`, then all **five** §10.4 outcomes are
  asserted and behave as required, each printing its actual exit code and decisive detail; `$LASTEXITCODE` is 0; and
  `git status --porcelain` immediately after the run is byte-equal to the snapshot taken immediately before it.
- **AC7 [R4, R11]** — Given `build-storybook` + `screenshots:assert -- --mantine-only` run pre-edit and post-edit,
  then both manifests contain the same affected canonical cell set — `FooterView`, `HeaderView`, `MobileNavDrawer`,
  `MobileBottomNavView` (Guest + Authenticated), `HeroSearch` (incl. `band-700`), `CopyIdButton`, `HomeSection`
  (incl. `wide-1200/1440/1536`), `ListingCardPattern`, `HomepageListingGrids`, `ListingCard` — and every one of
  those cells compares equal per `docs/storybook-governance.md` §14.11 / D26. Both run timestamps and the affected
  cell ID list are retained. A cell that changed and is not explained by D26's measured harness-noise set fails AC7.
- **AC8 [R4, R11]** — Given `scripts/task770-storybook-capture.mjs` run pre-edit and post-edit at **1440×900** over
  `FooterView`, `HeaderView`, `HeroSearch`, `HomeSection`, `HomepageListingGrids`, `ListingCard`, then the pre/post
  pairs and their JSON index are retained and reviewed side by side, closing the >1024 gap §3.9 measures.
- **AC9 [R4, R11]** — Given `scripts/task770-homepage-route-probe.mjs` run against a **production** `next start` of
  `/en` at **320×812, 768×1024 and 1440×900**, pre-edit and post-edit, then `main`'s computed `padding-bottom`, the
  first `main` section's computed `padding-top`/`padding-bottom`, and the screenshots are retained for both phases
  and the computed values are string-equal across the pair.
- **AC10 [R10]** — Given `git diff src/app/globals.css`, then every hunk lies inside the new subsection: lines
  35-316 (`@theme inline`), Task 765's and Task 767's subsections are untouched. Given `git diff --stat`, then no
  `AppImage` path appears.
- **AC11 [R9]** — Given the final diff, then it contains no `design-tokens-allow:` marker, no allowlist entry, no
  baseline file, no skip marker and no hand-maintained exemption list; and `check:design-tokens` and `check:css-vars`
  both exit 0 without any new suppression.
- **AC12 [R12]** — Given `docs/design-system.md`, then the `--homepage-runtime-*` registry subsection lists all
  thirty-one tokens with values and lines, and `§23.8` states the thirteen inputs, five categories, the two blocking
  ones, the D65-E arm, the five verify-gate outcomes and the manifest-scoped boundary, citing D65-E with its date.
  No existing section is renumbered.
- **AC13 [R13, R14]** — Given the session log, then it carries a `Files Changed` table matching the real diff, the
  §10.0 and final measurements side by side, every command's actual exit code including `npm run build` = 0, the §5
  not-folded-in list restated as still open, and status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** It applies because the changed surfaces are a navigation header, a footer, a
mobile drawer, a mobile bottom nav, a migrated Mantine pattern and the page shell's hero — every trigger
`docs/qa-profiles.md` lists for Q3 — and because the whole claim is "nothing rendered differently", which only
rendered evidence supports. Read each story's effective viewport set out of the built manifest before claiming a
tier is covered; do not infer coverage from the union of the run (§3.9).

Run everything in **native Windows PowerShell**. Record platform, Node version, working directory, the exact command
and the **real** exit code for each, captured unpiped.

```powershell
node.exe scripts/check-homepage-theme-runtime-deps.mjs --report;          "exit=$LASTEXITCODE"
npm.cmd run check:homepage-theme-runtime-deps;                            "exit=$LASTEXITCODE"
npm.cmd run check:homepage-theme-runtime-deps:verify-gate;                "exit=$LASTEXITCODE"
npm.cmd run check:tailwind-runtime-tokens;                                "exit=$LASTEXITCODE"
npm.cmd run check:tailwind-runtime-tokens:verify-gate;                    "exit=$LASTEXITCODE"
npm.cmd run check:homepage-literal-utilities;                             "exit=$LASTEXITCODE"
npm.cmd run check:css-vars;                                               "exit=$LASTEXITCODE"
npm.cmd run check:design-tokens;                                          "exit=$LASTEXITCODE"
npm.cmd run check:stories;                                                "exit=$LASTEXITCODE"
npm.cmd run check:file-integrity;                                         "exit=$LASTEXITCODE"
npm.cmd run typecheck;                                                    "exit=$LASTEXITCODE"
npm.cmd run build;                                                        "exit=$LASTEXITCODE"
npm.cmd run build-storybook;                                              "exit=$LASTEXITCODE"
npm.cmd run screenshots:assert -- --mantine-only;                         "exit=$LASTEXITCODE"
git --no-optional-locks status --porcelain
```

`npm.cmd run build` exiting 0 on the final diff is the agent-contract §9 hard gate; a failed, unrun or stale build
permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. Retain every transcript under `docs/sessions/evidence/task770/`.

`screenshots:assert:full` and `screenshots:assert:full:fast` are **forbidden** as evidence here
(`Codex-tasks/README.md`); the bare script is already `--mantine-only` and the explicit flag is retained so the
recorded scope is unambiguous.

### 13.1 Story evidence — the pixel proof (AC7)

Run `build-storybook` + `screenshots:assert -- --mantine-only` **before** any source edit, then again after.
`FACT` (§3.9): output goes to `.screenshots/rendered-assert/<timestamp>/`, a fresh directory per run — the pre-edit
run is not overwritten. **Record both timestamps** and compare per-cell for the ten affected stories only; the rest
of the run is regression signal, not this task's evidence. Comparator and tolerance for changed cells: 
`docs/storybook-governance.md` §14.11 (D26). Do not invent a per-task pixel tolerance.

Additionally capture the **computed-style** proof AC3 and AC4 need — `padding`, `gap`, `height`, `font-size`,
`color`, `box-shadow` per §3.10 row, light and dark — from the **built** Storybook with an ephemeral Playwright
script, pre and post. If you persist that script it must be named `task770-*`, live under `scripts/`, and have its
output retained; otherwise delete it. Do not leave an unregistered script behind either way.

### 13.2 Focused 1440 capture — `scripts/task770-storybook-capture.mjs` (AC8)

New task-owned script. It serves `storybook-static` on an **OS-assigned** port, resolves every requested story id
from `storybook-static/index.json` (never inferred from a filename), captures at **1440×900**, and writes PNGs plus
a JSON index under `docs/sessions/evidence/task770/`. It **fails closed** on a missing story id, a missing root
element, or a failed navigation. Its set is exactly `FooterView`, `HeaderView`, `HeroSearch`, `HomeSection`,
`HomepageListingGrids`, `ListingCard` — the six that §3.9 measures as having no standing cell above 1024.

This supplements the Mantine-only gate; it never replaces it, and it must not add a width to `MANTINE_VIEWPORTS`.

### 13.3 Real-route capture — `scripts/task770-homepage-route-probe.mjs` (AC9)

New task-owned script, modelled on `scripts/task767-homepage-runtime-probe.mjs`. Contract:

- `node scripts/task770-homepage-route-probe.mjs <label>`, writing per-label (never overwriting) to
  `docs/sessions/evidence/task770/homepage-route.<label>.json` plus a PNG per cell in the same folder.
- Reads `BASE_URL` from the environment, defaulting to `http://127.0.0.1:3000`. Navigates to `${BASE_URL}/en` at
  **320×812, 768×1024, 1440×900** — 320 for the bottom-nav gutter, 768 for the `md` step, 1440 for the `xxl` step
  `MantineHomeSection` reads.
- Per cell records: computed `padding-bottom` of `main`; computed `padding-top`/`padding-bottom` of the first
  `main > section`; the resolved value of `--homepage-runtime-space-14`, `--homepage-runtime-space-16/24` and
  `--homepage-runtime-section-py-base/md/lg` read off the document element, so the post-edit run positively shows a
  project-owned source; and a full-page screenshot.
- **Fails closed:** a non-OK response, a missing selector, a `<nextjs-portal>` element (meaning `next dev` was used
  by mistake), or a viewport it could not set writes what it measured and exits non-zero.

Sequence — both runs required, the pre-edit run before any source edit:

```powershell
npm.cmd run build
Start-Process npm.cmd -ArgumentList 'run','start'
node.exe scripts/task770-homepage-route-probe.mjs pre-edit
# stop the server, apply §10.1 and §10.2, then:
npm.cmd run build
Start-Process npm.cmd -ArgumentList 'run','start'
node.exe scripts/task770-homepage-route-probe.mjs post-edit
```

Stop the server after each capture. If a port other than 3000 is used, pass it via `BASE_URL` and record the exact
value. Storybook cannot substitute for this: `page.tsx` and `layout.tsx` have no story, and none may be created.

## 14. Stop conditions

Return `BLOCKED` and report the evidence — do not improvise — if any of these holds:

1. `HEAD` does not contain `06091ba1d` (Task 769), or `git status --porcelain` is non-empty at §10.0 (§3.12).
2. §10.0's pre-edit report is not exactly `42` pairs / `79` uses, or its per-file breakdown differs from §3.1 in any
   row, or the `AppImage` probe finds a live `var(--space-0)`.
3. Any §10.0 token probe fails to print its definition line, or prints a different value from §3.2 / §3.3.
4. Closing the migration appears to need a change to `@theme inline`, `AppImage.module.css`, `PerfDevOverlay.tsx`,
   any permanent story, `package.json` beyond the two script entries, a baseline, an allowlist, a marker, or any
   file outside §7.
5. `screenshots:assert -- --mantine-only` does not discover one of the ten stories of §3.9, or a cell changes and
   is not explained by D26's measured harness-noise set.
6. A required rendered state cannot be reached by an existing story or by the route probe. That is a design defect
   to report — never a licence to add or edit a permanent story (Sprint 65 §6).
7. Any `--verify-gate` case cannot produce its required result without weakening another case, or a plant is found
   in the real worktree after a run.
8. `npm run build` does not exit 0 on the final diff.

## 15. Completion report contract

State, in the session log and the completion message:

1. Changed files with reasons, matching the real diff.
2. Requirement IDs completed (R1-R14) and each AC's status with its evidence path.
3. The §10.0 pre-edit measurements and the final post-edit measurements side by side — the two gate reports, every
   command exit code, both `screenshots:assert` run timestamps and the affected cell verdicts, the focused-1440
   pre/post pairs, and the route-probe pre/post JSON.
4. Assumptions, deviations, known limitations, unresolved issues.
5. The standing boundary, verbatim: **the gate certifies thirteen fixed files, not a route; `@theme inline` remains
   live for the eighteen non-manifest references of §3.6; this task does not retire Tailwind and issues no route
   certification (D65-C).**
6. The §5 not-folded-in list restated as still open.
7. Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. **Never**
   self-approve, and never run, emit, suggest or delegate a mutating git command, including any `git push` form.

## Task quality gate — checked before publication

- A fresh Sonnet session can execute this without hidden chat context: every count, value, line number, story id and
  command is in the document. ✅
- Every P0 requirement has at least one binary acceptance criterion and one verification method (R1→AC4, R2/R3→AC2,
  R4→AC3/AC7/AC8/AC9, R5/R6/R7→AC5, R8→AC6, R9→AC11, R10→AC10, R11→AC7-AC9, R13/R14→AC13, R12→AC12). ✅
- Scope protects existing behavior and names what must not change (§8), including the two decisions that fence it
  (D65-A `PerfDevOverlay`, D65-C route certification) and the closed D65-D AppImage exception. ✅
- UI publication checks: current/legacy boundary stated (§1 — current Mantine path), QA profile selected and argued
  (§13), visual source map (§3.10), canonical UI decision record (§3.11), preservation classifications explicit
  (§3.10's `preserved` rows, each with positive evidence). ✅
- Permanent-story creation gate: zero additions **and** zero edits; every state is covered by an existing canonical
  story or by a task-owned route probe, and the one divergent story is recorded as a boundary, not silently left
  (§3.6.3, §3.11). ✅
- Negative flows selected by applicability, not copied (§9) — validation, expected-zero, rendered regression and
  dark mode are `Yes`; authorization, offline and concurrency are `No` with source-based reasons. ✅
- No command, source file, test, story, screenshot or existing behavior is claimed without inspection: the census
  was re-derived with the repository's own exported extractors, every value and line number was read out of
  `globals.css`, every story id out of `storybook-static/index.json`, and every viewport set out of
  `check-stories-rendered.mjs`. ✅
- The token requirement passes "grep the definition, never the table": §3.2 and §3.3 quote definition lines with
  line numbers, and §10.0 makes the executor re-grep them before writing. ✅
- The requested gate proves the changed behavior rather than asserting it: case 1 and case 2 are the two failure
  arms of the migration itself, case 4 is D65-E's, case 3 is the input contract, case 5 is the passing control
  (§10.4). ✅
- Every owner-only exception is traceable: D65-D (closed, quoted in Sprint 65 §5), D65-E (this task inherits the
  durable control), D65-C (route certification stays with 667), D65-A (pending, out of scope). The task grants
  itself none. ✅
- Every applicable selected rule has a `COMPLIANT` row (Appendix B). ✅
- The execution contract (Appendix A) has exactly one active route, and every checkpoint names a producer, a
  persisted artifact and a comparator that can reject a wrong result. ✅
- Dirty-worktree handling: §3.12 records the design-time snapshot, requires a clean start, and requires the executor
  to recapture immediately before its first write. ✅
- Task-created artifacts and measurement order: the pre-edit gate report, the pre-edit screenshot run and the
  pre-edit route probe all precede the first source edit; `docs/sessions/evidence/task770/` is created by the first
  of them and is not an input to any of the thirteen fixed gate inputs, so it cannot enter a count. ✅
- After the final revision, every cited section, count and artifact was re-checked against the actual plan; the
  census and every value were re-run after the last textual edit. ✅

### FACTS

1. The twelve-file census is exactly **42 pairs / 79 uses**, per-file as §3.1, with zero `unknown` rows.
2. The nineteen source values are as §3.2, each a literal in `@theme inline` at the line given.
3. The four colour names in `@theme inline` are pure one-hop aliases of `:root` names that already exist (§3.3),
   with `.dark` overrides at 525, 551, 557 and none for `--status-success`.
4. `--homepage-runtime-*` is an existing twelve-token family from Task 767 at `globals.css:341-362` (§3.4).
5. Five of the twelve files render on `/listings`, `/favorites` and `/cabinet` as well as `/[locale]` (§3.5).
6. Eight non-manifest files still read `@theme inline` — 18 pairs / 27 uses (§3.6).
7. `AppImage.module.css` has zero live `var(--space-0)` references (§3.7).
8. `check-css-var-resolvability.mjs` exports `stripComments`, `extractCssDeclaredNames`, `findVarReferences` and
   `extractOwnedNames` at the lines given in §3.8.
9. All ten canonical story ids of §3.9 exist in `storybook-static/index.json`; `Patterns/Mantine/*` is in
   `--mantine-only` scope; the per-story viewport sets and the `.screenshots/rendered-assert/<timestamp>/` output
   shape are as measured.
10. `docs/design-system.md` contains zero occurrences of `homepage-runtime` today.

### INFERENCES

1. Because every replacement copies an identical literal (§3.2) and every colour replacement removes one alias hop
   to the same terminal value (§3.3), no rendered output can change on any route — including the three non-Homepage
   routes of §3.5. The evidence plan is designed to falsify this, not to assume it.
2. Because the eighteen references of §3.6 resolve only through `@theme inline`, that block must stay live; this
   task's completion is not "Tailwind is retired" and must not be reported as such.
3. Because `HeroSearch.stories.tsx` keeps reading `--space-16/24` while `page.tsx` stops, the story becomes a stale
   copy of production — harmless today (identical values), material to Task 771.

### UNKNOWNS

None material. The one thing this kickoff does not fix is whether a thirteenth file will later read `@theme inline`
outside the gate's fixed manifest; that is a stated design boundary (§10.3), not an unknown.

### CONFLICTS

None. The candidate brief's documentation-scope omission is resolved in §5 against `CLAUDE.md`'s standing
Documentation update rule, with no competing owner decision.

## Appendix A — Executable task contract (`docs/orchestrator-execution-contract-template.md`, completed)

### A.1 One active execution route

| Field | Value |
|---|---|
| Task | 770 — Homepage Level 3: exit `@theme inline` runtime reads, with a fixed-manifest ownership gate |
| Active route / owner decision | Migrate the fixed twelve-path manifest to new project-owned `:root` tokens **and** ship `check:homepage-theme-runtime-deps` carrying D65-E's expected-zero AppImage control, in one diff. `@theme inline` byte-identical. |
| Decision source, date, scope | Sprint 65 §2 level 3 and §3 rules 1-3 (2026-08-24); **D65-E** (2026-08-26) transferring the durable AppImage control here; `Codex-tasks/Task_770_…md` §§2-6 as corrected by §5 of this kickoff. Base `06091ba1d`. |
| Starting worktree mode | clean isolated at `06091ba1d` — required by §10.0; a dirty start needs the §3.12 manifest before the first write |
| Exact allowed final write set | §7's seven paths plus `docs/sessions/2026-…-task770-*.md`, `docs/sessions/evidence/task770/`, `docs/backlog.md` |
| Blocked rule or decision, if any | none |

### A.2 Checkpoint matrix

| # | Checkpoint | Preconditions and preserved inputs | Writes allowed | Observable result | Producer and persisted artifact | Comparator and failure behavior |
|---:|---|---|---|---|---|---|
| 0 | Prove the tree | 769 in `main`; clean status | none | five gates exit 0; nineteen + four token definition lines printed; AppImage probe silent | §10.0 commands → `evidence/task770/preflight.txt` | any non-zero exit, any missing/differing definition line, or any AppImage match ⇒ `BLOCKED` (§14.1, §14.3) |
| 1 | Ship the gate's report mode | checkpoint 0 passed | `scripts/check-homepage-theme-runtime-deps.mjs`, `package.json` | `--report` prints 42 / 79 and the §3.1 breakdown; zero expected-zero findings | the new script → `evidence/task770/pre-edit-report.txt` | totals ≠ 42 / 79, or any per-file row ≠ §3.1 ⇒ `BLOCKED` (§14.2). This artifact is irreplaceable after checkpoint 4 |
| 2 | Pre-edit rendered baseline | checkpoint 1 passed; **no source edit yet** | none outside `.screenshots/`, `evidence/task770/` | a timestamped `rendered-assert` run containing all ten stories' cells | `build-storybook` + `screenshots:assert -- --mantine-only` → `.screenshots/rendered-assert/<ts-pre>/manifest.json` | a missing story ⇒ §14.5. The timestamp is recorded; the post run writes a new directory and cannot overwrite this one (§3.9) |
| 3 | Pre-edit route + 1440 baseline | checkpoint 2 passed; **no source edit yet** | `scripts/task770-*.mjs`, `evidence/task770/` | `homepage-route.pre-edit.json` + PNGs; focused 1440 pre-edit PNGs + index | the two new probes | either probe exits non-zero on a missing selector, non-OK response or `<nextjs-portal>`; a non-zero exit here blocks the edit |
| 4 | Migrate | checkpoints 1-3 complete and persisted | `globals.css` (new subsection only) + the twelve files | 19 new tokens; 42 references renamed | §10.1, §10.2 | AC2's `Select-String` count ≠ 31, or a hunk outside the new subsection ⇒ fails AC2/AC10 |
| 5 | Close the gate | checkpoint 4 done | the gate script (blocking mode + `--verify-gate`) | default mode exits 0 with 0 blocking rows; `--verify-gate` 5/5 | `check:homepage-theme-runtime-deps[:verify-gate]` → `evidence/task770/final-gates.txt`, `verify-gate.txt` | any non-zero, or a `git status --porcelain` differing from the snapshot taken immediately before the run ⇒ fails AC6 |
| 6 | Post-edit rendered proof | checkpoint 5 passed | `.screenshots/`, `evidence/task770/` | second `rendered-assert` timestamp; post-edit route JSON; post-edit 1440 PNGs | same producers as 2 and 3 | per-cell comparison against `<ts-pre>` under §14.11/D26; any unexplained changed cell ⇒ `BLOCKED` (§14.5). Route computed values must be string-equal (AC9) |
| 7 | Full gate sweep + build | checkpoint 6 passed | none | every §13 command exits 0, `npm run build` = 0 | §13's command list → `evidence/task770/final-gates.txt`, `build.log` | a non-zero build permits only `PARTIALLY IMPLEMENTED`/`BLOCKED` (§14.8) |
| 8 | Documentation | checkpoint 4 done | `docs/design-system.md` | registry subsection + `§23.8` | R12 | AC12; no existing section renumbered |
| 9 | Records | all above | session log, `evidence/task770/`, `docs/backlog.md` | `Files Changed` matches the real diff; status line correct | §15 | AC1/AC13; a claimed file absent from the diff, or a diff path absent from the table, fails AC13 |

**Zero/empty forms tested.** The blocking-row count has a valid **zero** state (checkpoint 5's success) and a
non-zero state (every `--verify-gate` plant); the gate must not treat zero blocking rows as a missing artifact. The
42 / 79 classified totals are, by contrast, an **invariant** — zero there means the manifest failed to resolve and
is a failure, not a pass. Print the two numbers distinctly (§10.4).

**Task-created artifacts and input order.** `evidence/task770/`, both probe scripts and the session log are created
at or after checkpoint 1 and are **not** among the thirteen fixed gate inputs, so none can enter the 42 / 79 count
at any point. `.screenshots/` is git-ignored working output, not part of the diff.

### A.3 Required counterexample trace

| Contract claim | Counterexample | Executed or analytical evidence | Required outcome | Result |
|---|---|---|---|---|
| Active route and final write set | the migration needs a thirteenth file, or `@theme inline` | `EXECUTED` — the §3.1 census over all twelve inputs returned zero `unknown` rows, and §3.6 enumerated every non-manifest reader separately, so no manifest file depends on a name outside §3.2/§3.3 | blocked or separate contract | route holds; §14.4 blocks the alternative |
| Stateful baseline / manifest | a valid empty result mistaken for a missing one | `ANALYTICAL` — §10.4 case 5 asserts the passing state as `42 / 79` classified **with** zero blocking, so "no findings" and "nothing scanned" are different printed values | distinct, fail-closed outcomes | specified in §10.3/§10.4 |
| Status or diff assertion | a plant left in the real worktree by `--verify-gate` | `EXECUTED` on the precedent: `check-tailwind-runtime-tokens.mjs --verify-gate` was run at design time and `git status --porcelain` was byte-identical before and after, proving the `mkdtemp` pattern this gate copies | comparator rejects it | AC6's before/after porcelain snapshot |
| New gate | a `--button-`-style prefix shortcut or an author-applied exemption | `ANALYTICAL` — the classifier has no prefix arm except `--mantine-`, and R9/AC11 grep the diff for markers and allowlists | observed failure, then clean recovery | §10.4 cases 1, 2, 4 are the failure arms; case 5 the recovery |
| Rendered equivalence | a value silently changes on a non-Homepage route | `ANALYTICAL` — §3.5's import census names the shared consumers, and AC7's cell set includes `ListingCard`, `ListingCardPattern`, `HomepageListingGrids` and `CopyIdButton`, which render exactly those modules | comparator rejects it | AC7 + AC8 |
| Task-created artifact | evidence directory created before a baseline and counted | `ANALYTICAL` — the thirteen gate inputs are hardcoded paths under `src/`; nothing under `docs/` can enter them | count/scope difference detected | A.2 note above |

### A.4 Publication and review gate

The reviewer must rebuild the active route, the expected write set and the checkpoint matrix from this document
alone, without relying on this appendix's summary. Any omitted checkpoint, ambiguous route, missing producer,
non-failing comparator, or mismatch between the matrix and §§7-15 makes the task `DRAFT`, `NEEDS REVISION` or
`BLOCKED`.

## Appendix B — Unwaivable rule-compliance ledger (`docs/orchestrator-rule-compliance-ledger-template.md`, completed)

| Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| `agent-contract.md` P0-1 "Scope stays bounded" | the diff touches a shared design-system pattern used by four routes (§3.5) | change only what the task requires; no drive-by refactor | §7 write set; AC1's `git diff --stat`; §10.2's "only the name inside the `var()`" | `COMPLIANT` |
| `agent-contract.md` P0-2 "No invented architecture or facts" | nineteen token values and four colour destinations are consumed | every value grepped from `globals.css` and quoted | §3.2, §3.3; §10.0 re-grep | `COMPLIANT` |
| `agent-contract.md` P0-5 "Existing UX flows remain intact" | header, bottom nav, hero search and cards are interactive surfaces | no entry point, control or state transition changes | §3.10's `preserved` rows; AC7's story cells incl. Guest/Authenticated bottom-nav states | `COMPLIANT` |
| `agent-contract.md` P0-6 / 6a | UI kickoff | current + required behavior explicit; positive flow and applicability table present | §9 | `COMPLIANT` |
| `agent-contract.md` P0-7 "Localization covers all four locales" | no user-facing string changes | `NOT APPLICABLE` for new strings; all four locales are still rendered because spacing regressions can be text-length dependent | §9's applicability table; AC7's `sq/en/uk/it` cells | `COMPLIANT` |
| `agent-contract.md` P0-8 "Responsive verification follows the QA profile" | Q3 selected | full canonical visual evidence for the affected stories, plus the measured >1024 gap closed | §13.1, §13.2, §13.3; AC7-AC9 | `COMPLIANT` |
| `agent-contract.md` P0-9 "Validation evidence is mandatory" | non-Q0 task | final `npm run build` exit 0 with transcript | §13's command list; AC13; §14.8 | `COMPLIANT` |
| `agent-contract.md` P0-10 "Session evidence, backlog and git ownership" | every implementation task | `Files Changed` table matching the diff; concise backlog state; no mutating git by Sonnet | §15; AC13 | `COMPLIANT` |
| `qa-profiles.md` — profile selection + "Per-story viewport sets are not uniform" | Q3 triggers present (header, footer, nav, migrated pattern, page shell) | read each story's effective viewport set from the manifest before claiming a tier | §3.9's measured per-story sets; §13.1's instruction | `COMPLIANT` |
| `qa-profiles.md` — "Comparing a rendered run against a baseline" | the claim is "nothing rendered differently" | comparator and tolerance governed by `storybook-governance.md` §14.11 / D26 | §13.1; AC7 | `COMPLIANT` |
| Sprint 65 §3 rule 1 "The control ships before or with the fix" | a new detector is introduced | two actually-executed failing plants, restored tree, clean re-run | §10.4 cases 1-4 (four failing arms) + case 5; AC6's porcelain snapshot | `COMPLIANT` |
| Sprint 65 §3 rule 2 "No author-applied exemption" | a gate is introduced | no marker, allowlist or baseline may be added to reach green | R9; AC11; §10.3 "no baseline by construction" | `COMPLIANT` |
| Sprint 65 §3 rule 3 "Mechanism only, never restyle" (D28) | twelve rendered consumers change | computed styles or rendered evidence prove equivalence | AC3, AC7, AC8, AC9 | `COMPLIANT` |
| Sprint 65 §3 rule 4 "New runtime values live in `:root`" | nineteen new tokens | declared in `:root`, not in `@theme inline` | §10.1; AC2 | `COMPLIANT` |
| Sprint 65 §3 rule 5 "`globals.css` is high-risk after 765" | `globals.css` changes | never combined in one PR with AppImage work, card hover work, or global Tailwind removal | §8 forbids all three; AC10 proves no AppImage path and no `@theme inline` hunk | `COMPLIANT` |
| Sprint 65 §3 rule 6 "No new permanent Storybook stories to satisfy a detector" | rendered proof needed for ten surfaces | reuse an existing story, or a reversible probe with proven restoration | §3.11 — zero additions and zero edits; the route states use task-owned probes, not stories | `COMPLIANT` |
| Sprint 65 §4 — closed work | 763/764/765 boundaries | AppImage, card hover/trigger area and 765's `:root` tokens are not re-derived | §8; §3.10's `preserved` rows | `COMPLIANT` |
| Sprint 65 §8 — what the sprint does not authorise | Tailwind directives exist in the touched file | no `@import`/`@custom-variant`/`@source`/`@apply` removal; no route certification | §8; §15's standing-boundary sentence | `COMPLIANT` |
| D65-C (2026-08-16/24) — route certification stays with 667 | this task reads route state | make no route-coverage claim | §1, §15.5 | `COMPLIANT` |
| D65-E (2026-08-26) — durable AppImage control transfers here | Task 768 shipped no permanent detector | the expected-zero control must live in this task's gate | R7; §10.3's expected-zero arm; §10.4 case 4; AC5 | `COMPLIANT` |
| D65-A (pending) — `PerfDevOverlay` | it reads `--color-status-success` (§3.6) | out of scope for every Sprint 65 task until decided | §8; §3.6.2 | `NOT APPLICABLE` — excluded, not silently absorbed |
| `CLAUDE.md` → Documentation update rule | a new blocking gate and nineteen durable tokens ship | update the most specific file in `docs/` | R12; §10.5; AC12 | `COMPLIANT` |
| `orchestrator-procedures.md` → "A documented token is not an implemented token" | the task directs the executor to consume 19 + 4 custom properties | grep the definition and quote the matched line | §3.2, §3.3 (quoted with line numbers); §10.0's three `Select-String` probes | `COMPLIANT` |
| `design-system.md` §23.6.c `css-undefined-var` | new `var()` references are introduced | every referenced name must resolve against `globals.css` or the same file | the nineteen names are declared in `:root` before the first consumer edit (checkpoint 4 order); `check:css-vars` and `check:design-tokens` in §13 | `COMPLIANT` |
| `design-system.md` §23.7 (Task 762/769) | the migrated names must not be Tailwind-owned | a project-owned literal replaces a Tailwind-sourced alias | `check:tailwind-runtime-tokens` stays green in §13; the new tokens are `:root` literals | `COMPLIANT` |
| `orchestrator-ui-task-design.md` — source map + canonical decision record | changed visible artifacts | both artifacts mandatory, with `reuse`/`extend`/`create canonical` dispositions | §3.10, §3.11 | `COMPLIANT` |
| `orchestrator-evidence-first-preflight.md` — dirty-worktree manifest | the design-time worktree was dirty | capture a pre-write porcelain snapshot; complete the manifest for every entry | §3.12; A.2 checkpoint 0; AC6's before/after snapshot | `COMPLIANT` |

Every applicable row is `COMPLIANT`. No row is `BLOCKED`; no rule was weakened, reinterpreted, or replaced by an
alternative, and this task grants itself no exception.
