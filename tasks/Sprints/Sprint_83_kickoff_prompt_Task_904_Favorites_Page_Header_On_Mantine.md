# Task 904 — `/favorites` uses the canonical listings route chrome: a Mantine breadcrumb and a responsive page title, with no legacy Tailwind

**Sprint 83** · **P3** · **Q3** · owner action **O83-7** · **Status: `KICKOFF FILED` 2026-09-30** · execute with
`.claude/skills/execute-task/SKILL.md`

## 1. Mode and task type

- **Mode:** `TASK DESIGN`, UI migration of route chrome. The Mantine current path applies.
- **Surface:** `src/app/[locale]/favorites/page.tsx`. The page body, `FavoritesShell`, was migrated by Task 809.
- **Origin:** owner decision **O83-2** (2026-09-30), legacy site **L4** of Task 886 §3.2.

## 2. Objective

The page's own markup (`page.tsx:67-98`) is legacy Tailwind: a `min-h-screen bg-background` wrapper, a hand-built
breadcrumb band with lucide icons, a `container-wide py-8` gutter, and an `<h1 className="text-2xl font-bold">` that is
24px at every width. Replace all of it with the canonical route chrome that `/listings` and the listing-detail page
already use:
- `ListingsPageFrame`, which carries the background, the Mantine `Breadcrumbs` band and the gutter;
- `MantinePageHeaderWithActions`, which renders an h1 with `TITLE_FZ.h2`.

`page.tsx` then carries no `className`, and the L4 row leaves `scripts/type-responsive-baseline.json`.

## 3. Verified context — measured 2026-09-30 by the orchestrator

### 3.1 The route today (read in full)

- `page.tsx:38-39`: a guest is redirected to login. Data comes from `getFavoriteListingsPaginated`,
  `getFavoriteTypeCounts` and `getUserCollections` (`:54-63`), and a fetch error sets `fetchError` (`:56-59`).
- The render is `:67-98`, and it is the only markup in the file. `Link`, `ChevronRight` and `Home` (`:2`, `:4`) are
  used only by the breadcrumb.

### 3.2 Visual source map

| Visible artifact | Today (`page.tsx`) | Canonical source | Disposition |
|---|---|---|---|
| Page background | `div.min-h-screen.bg-background` (`:68`) | `ListingsPageFrame.tsx:42` `Box mih="100vh" bg="var(--background)"` | reuse |
| Breadcrumb band | `div.bg-muted/40.border-b` + `container-wide py-2.5` + `nav.flex.text-xs`, a `Home` icon link and a `ChevronRight` separator (`:70-81`) | `ListingsPageFrame.tsx:43-86`: the same `--muted` 40% band and `--border` rule; Mantine `Breadcrumbs`, `sm` 14px, links gray.5, current gray.8, separator `/` (TailAdmin §6d, D775-B) | reuse. This is a **visible change**: 12px with icons becomes the canonical 14px text breadcrumb, identical to `/listings` and the listing detail. |
| Content gutter | `div.container-wide.py-8` (`:83`) | `ListingsPageFrame.tsx:89-95` `px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }} py="xl"`, `maw="var(--width-page-max)"` | reuse |
| Page title | `<h1 className="text-2xl font-bold">` + `div.mb-6` (`:84-86`) | `MantinePageHeaderWithActions.tsx:36-46`: `Stack mb="lg"` + `Title order={1} size="h2" fz={TITLE_FZ.h2}` | reuse |
| Page body | `FavoritesShell` (`:87-96`) | unchanged | preserve |

### 3.3 GR-1 census

`node.exe scripts\check-surface-census.mjs --surface "src\app\[locale]\favorites\page.tsx"` visits 17 nodes. Every
child is tier 1, migrated, enrolled and Storied: `FavoritesShell`, `CollectionsSection`, `FavoritesTypeFilter`,
`ListingCard`, `ListingsPagination`, `MantineListingCardPattern`, `MantineModal`, `AppImage`, `MediaPlaceholder`, …

The route file itself is baselined debt: `scripts/surface-census-baseline.json:130`,
`page.tsx :: page.tsx :: tier1-unenrolled-or-unstoried`. `/listings/page.tsx` carries the same row after its own
migration. A route file cannot have a Story, and the row stays.

After this task the route adds two edges, `ListingsPageFrame` and `MantinePageHeaderWithActions`. Both are enrolled
(`scripts/mantine-migration-scope.json:19`) and Storied, so no new block appears.

`GR-1 CENSUS COMPLETE — 17 nodes; tier1 16 migrated+enrolled+story + the route node (baselined route debt, unchanged); tier2 0 imports; tier3 0.`

### 3.4 GR preflights, run at design time

- `GR-0 CANONICAL REUSE PREFLIGHT — request: /favorites route chrome (breadcrumb, gutter, page title); semantic queries: breadcrumb, Breadcrumbs, aria_breadcrumb, page header, container-wide, h1 page title; inspected candidates: src/modules/listings/components/ListingsPageFrame.tsx + Patterns/Mantine/ListingsPageFrame, src/design-system/mantine/patterns/MantinePageHeaderWithActions.tsx + Patterns/Mantine/PageHeaderWithActions, src/app/[locale]/listings/page.tsx:80-96 (consumer precedent), ListingDetailView.tsx:414-425 (consumer precedent); decision: REUSE; selected canonical owner: ListingsPageFrame + MantinePageHeaderWithActions; Mantine/TailAdmin token path: ListingsPageFrame (D775-A/B, TailAdmin §6d), TITLE_FZ.h2 (typography.ts:39); new hardcoded visual values: NONE; rationale: both routes that already left Tailwind render exactly this chrome.`
- `GR-3a STORY PREFLIGHT — ListingsPageFrame × favorites-page composition; canonical candidates: patterns-mantine-listingspageframe--default (imports ListingsPageFrame, ListingsPageFrame.stories.tsx:4), mantine-primitives-favoritesshell--* (imports FavoritesShell); direct-import evidence: ListingsPageFrame.stories.tsx:4; toolbar coverage: locale=storyT toolbar, viewport=Storybook toolbar; decision: EXTEND; target: Patterns/Mantine/ListingsPageFrame; rationale: the missing state (the frame with a real page header and body) extends the frame's own Story; no new file or title.`
- **GR-3d.** `ListingsPageFrame.stories.tsx:22` writes its own gutter (`Box px={{ base: 'md', sm: 'xl' }} py="md"`),
  which is forbidden in a changed Story. `ListingsPageFrame` is a page-level View whose production root sets the page
  gutter with Mantine spacing props (`ListingsPageFrame.tsx:56` and `:93`: 16 / 24 from 640 / 32 from 1024). So the
  O83-3 exemption applies once the Story stops writing a gutter (R3).

### 3.5 Type scale (GR-3c) — binding

| Element | Role | base (<640) | sm | md | lg (≥1024) | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| Page title | page title | 20px | 24px | 30px | 36px | `TITLE_FZ.h2` (`h5`/`h4`/`h3`/`h2`) | `MantinePageHeaderWithActions.tsx:44`, `typography.ts:39` |
| Breadcrumb links/current | label | 14px | 14px | 14px | 14px | `size="sm"` | `ListingsPageFrame.tsx:74-84` |

Before this task the title was 24px at every width.

## 4. Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R1** | `page.tsx` returns `<ListingsPageFrame homeHref={`/${locale}`} homeLabel={tNav('home')} currentLabel={t('page_title')} breadcrumbAriaLabel={tc('aria_breadcrumb')}>`, containing `<MantinePageHeaderWithActions title={t('page_title')} />`, then the unchanged `<FavoritesShell … />`.<br>• Delete the `Link`, `ChevronRight` and `Home` imports.<br>• The file keeps 0 `className`.<br>• The data fetching, the redirect and `generateMetadata` (`:28-65`) are unchanged. | P1 | AC1 |
| **R2** | Delete the `src/app/[locale]/favorites/page.tsx :: text-2xl` entry from `scripts/type-responsive-baseline.json`. | P1 | AC2 |
| **R3** | `ListingsPageFrame.stories.tsx`:<br>• delete the Story-written gutter `Box` (`:22`);<br>• each `Default` section label (`Title order={6}`) moves inside its frame's `children`, above the body text;<br>• add an export `FavoritesPage`: `ListingsPageFrame` + `MantinePageHeaderWithActions` + the real `FavoritesShell`, with the `Populated` fixtures and the `AuthContext` mock of `src/stories/mantine/primitives/FavoritesShell.stories.tsx` (`makeCardListingFixtures`; mirror that file's mock shape and cite it). Labels come through `storyT` with the production keys (`nav.home`, `favorites.page_title`, `common.aria_breadcrumb`); `storyT` resolves any key path (`src/stories/_storyI18n.ts:40-50`).<br>• No `style`, `px`/`py`, `maw` or `globals` in the file. | P1 | AC3 |

## 5. Assumptions and open questions

- **Accepted visible change:** the breadcrumb loses its home icon and chevron, and becomes the canonical 14px text
  breadcrumb (`/` separator), identical to `/listings`. That is the purpose of the migration. The owner judges it in
  O83-7.
- None open.

## 6. Pre-read rule bundle

`docs/golden-rules.md`, `docs/agent-contract.md` (16a–16d), `docs/mantine-responsive-design-system.md`,
`docs/tailadmin-style-reference.md` §6d, `docs/component-rules.md`, `docs/qa-rules.md`, `docs/qa-profiles.md`,
this kickoff.

## 7. Scope

- `src/app/[locale]/favorites/page.tsx`
- `scripts/type-responsive-baseline.json`
- `src/stories/patterns/mantine/ListingsPageFrame.stories.tsx`
- `docs/backlog.md` (the 904 state), and the session log `docs/sessions/2026-09-30-task904-favorites-page-header.md`

## 8. Out of scope

`ListingsPageFrame.tsx`, `MantinePageHeaderWithActions.tsx`, `FavoritesShell` and its children, `messages/*` (no new
key is needed), and every other route.

## 9. Current and required behavior

- **Preserve:**
  - the guest redirect (`:39`);
  - the pagination and type-filter parsing;
  - `fetchError` → `FavoritesShell error`;
  - the page `<title>` metadata;
  - the breadcrumb's accessible name (`common.aria_breadcrumb`) and its home link to `/${locale}`.
- **Required after:** every item in §3.2's "Canonical source" column, and the type scale in §3.5.

## 10. Implementation requirements

- Server component: `page.tsx` stays without `'use client'`. `MantinePageHeaderWithActions` is a client component
  and receives only a string, which is serialisable.
- No new `className`, `style`, raw px/rem or Tailwind utility, anywhere in the scope.

## 11. Positive and negative flows

**Positive:** a signed-in user with favourites opens `/uk/favorites`. They see the breadcrumb (Головна / Обране), the
responsive title and the list.

| Branch | Applicable? | Owner/source | Expected | Evidence |
|---|---|---|---|---|
| Guest | Yes (preserved) | `page.tsx:39` | redirect to login, unchanged | code diff: `:38-39` untouched |
| Fetch error | Yes (preserved) | `page.tsx:56-59` → `FavoritesShell error` | error state inside the new chrome | `mantine-primitives-favoritesshell--error` unchanged; R1 diff |
| Empty list | Yes (preserved) | `FavoritesShell` | empty state inside the new chrome | unchanged component |
| Long localized title (`uk`/`sq`) at 320 | Yes | `MantinePageHeaderWithActions` | wraps; no horizontal overflow | `story-measure.log` |
| Validation, RLS, concurrent writer | No | the route renders only; no write path changes | — | — |

## 12. Acceptance criteria

`GR-4 AC AUDIT — 4 criteria; each states an observable property; absolutes: none.`

- **AC1 [R1].** `page.tsx`:
  - it has no `className=` and imports none of `Link`, `ChevronRight`, `Home`;
  - it renders `ListingsPageFrame` and `MantinePageHeaderWithActions`;
  - its `:1-65` hunk is unchanged in the diff, apart from the three import removals.
- **AC2 [R2].** `npm run check:type-responsive` exits 0 with no stale entry. `scripts/type-responsive-baseline.json`
  no longer lists the favorites page.
- **AC3 [R3].** In `story-measure.log`:
  - `patterns-mantine-listingspageframe--favorites-page` and `--default` measure an edge gap of 16/16/32/32 (±1) at
    320/390/1024/1440, with no overflow;
  - the h1 measures 20/20/30/36 at 320/390/768/1440;
  - the breadcrumb is 14px.
  - The Story file has no `style`, `px`, `py`, `maw` or `globals`.
- **AC4.** Every gate in §13.2 exits 0, `npm run build` included, and the census adds no new block.

## 13. QA profile and verification plan

**Q3.** This is page-shell chrome on a user route. It is not a registered critical flow (`docs/critical-flow-registry.md`
has no favorites-page row).

### 13.1 I0 — before any write

```powershell
$ev = "docs\sessions\evidence\task904"
New-Item -ItemType Directory -Force $ev
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\i0.log"
git --no-optional-locks status --short | Tee-Object -Append "$ev\i0.log"
git --no-optional-locks hash-object "src/app/[locale]/favorites/page.tsx" src/stories/patterns/mantine/ListingsPageFrame.stories.tsx scripts/type-responsive-baseline.json | Tee-Object -Append "$ev\i0.log"
```

Expected: `win32`, then, in order:
1. `0e7b6842cb4afe9e77e7f5c6f5a47aa6593e0f44`
2. `d7648ac6be913318a02c023e7b2f8c4c96d73a11`
3. `c08a1d6f7326aa6c7556193e1278e1690a5df0b1`

A different hash is `TASK SPECIFICATION CONTRADICTION`: stop.

### 13.2 Final gate block (one pass, on the final tree)

```powershell
$ev = "docs\sessions\evidence\task904"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\typecheck.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\typecheck.log"
npm.cmd run lint *>&1 | Tee-Object "$ev\lint.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\lint.log"
npm.cmd run check:type-responsive *>&1 | Tee-Object "$ev\check-type-responsive.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-type-responsive.log"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\check-design-tokens.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-design-tokens.log"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\check-story-coverage.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-story-coverage.log"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\check-rendered-scope.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-rendered-scope.log"
npm.cmd run check:surface-census:changed *>&1 | Tee-Object "$ev\census-changed.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\census-changed.log"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\check-file-integrity.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-file-integrity.log"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\check-mojibake.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-mojibake.log"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\build-storybook.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\build-storybook.log"
npm.cmd run build *>&1 | Tee-Object "$ev\build.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\build.log"
git --no-optional-locks hash-object "src/app/[locale]/favorites/page.tsx" src/stories/patterns/mantine/ListingsPageFrame.stories.tsx scripts/type-responsive-baseline.json | Tee-Object "$ev\hash-object.log"
```

Every log ends `EXIT_CODE=0`. Normalise each `Tee-Object` file to UTF-8 without a BOM through Node.

**Measurement**, with a throwaway native Playwright probe under `.artifacts/` on the rebuilt `storybook-static`, into
`$ev\story-measure.log`:
- Stories: `listingspageframe--favorites-page` and `--default`.
- Widths: 320/390/768/1024/1440.
- Locales: `en`, `uk`.
- Record:
  - the edge gap of the frame's content box;
  - horizontal overflow;
  - the h1 `fontSize`;
  - the breadcrumb `fontSize`;
  - the h1's line count in `uk` at 320.

### 13.3 OWNER VISUAL QA REQUIRED — O83-7

| Story | GR-3d | Locales | Widths |
|---|---|---|---|
| `Patterns/Mantine/ListingsPageFrame` → `FavoritesPage` | n/a: View carries the page gutter (`ListingsPageFrame.tsx:56`, `:93`) | `en`, `uk` | 320, 768, 1440 |
| `Patterns/Mantine/ListingsPageFrame` → `Default` | n/a: View carries the page gutter (same lines) | `en` | 320, 1440 |

The owner records **accepted**, or **returned** with a concrete defect, for each.

## 14. Completion report contract

Write `docs/sessions/2026-09-30-task904-favorites-page-header.md`. It contains:
- the Files Changed table;
- R1–R3 with their evidence paths;
- every §13 command with its exit code;
- the `story-measure.log` summary;
- these receipts: GR-0, GR-1 (the surface census re-run), GR-2, GR-3 (`ListingsPageFrame` ← its own Story), GR-3a,
  GR-3b, GR-3c and GR-3d for both exports.

Update the 904 state in `docs/backlog.md`. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED` or `BLOCKED`. No mutating git.

## 15. Task quality gate

- A fresh Sonnet session can run this from the file alone. Every fact in §3 was read at design time, and its hash is
  pinned in §13.1.
- One route only: REUSE of two inspected canonical sources. No new component or CSS.
- GR-3b/3c/3d lines are written for both Story exports, and the owner matrix is named (O83-7).
