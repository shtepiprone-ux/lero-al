# Task 741 Revision 3 — closed-status hardcode exit (executor session log)

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`** — with one required gate red, stated below
(`governance:tailwind`, a regression that already exists at HEAD). Kickoff:
`tasks/Archive/Sprint_46_kickoff_prompt_Task_741_ClosedOverlayStyleModuleExit.md` §17. QA profile **Q4**.
No git was run beyond read-only inspection. Evidence: `docs/sessions/evidence/task741r3/`.

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

## 1. §17.1 facts, re-measured at I0

| Fact | Re-measured |
|---|---|
| 886 R40 already deleted `CLOSED_OVERLAY_STYLE`; the colour lives in `.overlaySold`/`.overlayRented` | confirmed (`MantineListingCardPattern.module.css`, `overlay.tone`) |
| `LISTING_STATUS_COLOR` exists; banner `inactive` was `yellow`, the map says `gray` | confirmed; banner `inactive` now `gray` (D46-1) |
| Mantine `Overlay` default z-index would sit above badges | handled: `zIndex="auto"`; BEFORE and AFTER scrim `z-index` both `auto` |
| Story Tailwind at `:104`, `:116`, `:191` | confirmed, all three replaced |
| Tree status | 8 in-scope files modified; unrelated in-flight work (admin support, messages, scripts) untouched |

Censuses (pasted from the run, both exit 0):
- `ListingCard.tsx`: 7 nodes — ListingCard, MantineCopyIdButton, MantineListingCardPattern, AppImage, FavoriteButton,
  ListingFeatureIcon, MediaPlaceholder.
- `ListingStatusBanner.tsx`: 1 node.

## 2. Requirements and evidence

| ID | Result | Evidence |
|---|---|---|
| R30 | `getBadges` reads `LISTING_STATUS_COLOR` for sold/rented/archived/expired; banner `COLORS` deleted; comments updated (ListingCard, banner, `listingStatusTone.ts`) | `19_greps_hashes.txt` (AC30 empty), `probe-diff.txt` |
| R31 | Label is `Box component="span"` with `fz="sm" lh="sm" fw={700} px="sm" py="compact" bdrs="2xl" c="var(--overlay-foreground)" bd=...`; `cn(styles.overlayLabel, tone, overlay.className)` kept; `.overlayLabel` = `rotate` only; tone classes keep backgrounds only; `theme.other.borderWidth.statusOverlay` added (value, type, comment) | diff, `probe-diff.txt` |
| R32 | scrim is `Overlay color="var(--overlay)" backgroundOpacity={0.3} zIndex="auto" center`; `.overlayCenter` and its `@supports` deleted | AC31 grep, probe z-index `auto` before and after |
| R33 | Story: three Tailwind sites replaced (`Text miw="max-content"`, `Group fz c`, production `styles.inlineFavorite`/`styles.overlayFavorite`); status literals read `LISTING_STATUS_COLOR`; play test untouched, no `style`, width or viewport pin added | `15_build-storybook.txt`, `10_check-stories.txt` |
| R34 | (a) border contains `0.125rem solid var(--status-info)`; (b) scrim has `mantine-Overlay-root` and `--overlay-z-index: auto`; (c) pass-through test unchanged and green | red `01_red.txt` (exit 1, 3 failed), green `02_green_vitest.txt` (33/33) |
| R35 | `ListingCard.tsx` both date spans use `miw="max-content"`, no `style` | diff |

**R34 caveat.** I replaced the planned "no tone → `currentColor`" assertion: jsdom drops the `currentColor` keyword when it
serialises the `border` shorthand, so it asserts `border: 0.125rem solid` and the absence of `--status-`. The
real-browser computed value for that branch is not covered by a rendered probe (no Story renders an overlay without
`tone`). It is the unchanged no-colour-given default, and the branch has no production consumer.

## 3. AC32 / AC33 preservation probe (BEFORE built at I0, outside the repo; AFTER = final build)

Files: `probe.mjs`, `probe-before.json`, `probe-after.json`, `probe-diff.txt` (49 rows). `en`; 1440 and 320; sold and
rented cards of `mantine-primitives-listingcard--default` and `patterns-mantine-listingcardpattern--default`.

| Property | Before | After | Expected? |
|---|---|---|---|
| label `border-*-radius` | 18px | 16px | yes — D46-2 |
| label `line-height` | 20px | 20.02px | yes — `lh="sm"` (§17.6) |
| scrim `background-color` | `oklab(0 0 0 / 0.3)` | `color(srgb 0 0 0 / 0.3)` | yes — spelling only, black at 30% in both |
| label bg, border colour/width/style, text colour, font-size/weight, padding, rotate | — | equal | yes |
| scrim `z-index`; favourite `elementFromPoint` hit; label inside photo | `auto`; true; true | same | yes |
| banner sold/rented/archived/expired/pending | — | equal | yes (AC33) |
| banner `inactive` | `rgb(255, 250, 235)` / border `rgb(247, 144, 9)` | `rgb(249, 250, 251)` / `rgb(102, 112, 133)` | yes — D46-1 |

## 4. Gate block (each transcript ends `EXIT_CODE=`)

| Command | Exit |
|---|---|
| `vitest run` (3 files) | 0 (33/33) |
| `check:stories` | 0 |
| `check:story-coverage` | 0 |
| `check:design-tokens:strict` | 0 |
| **`governance:tailwind`** | **1 — see below** |
| `build-storybook` | 0 |
| `typecheck` | 0 |
| `lint` | 0 |
| `build` | 0 |
| `check:file-integrity` | 0 (after BOM strip of four of my own transcripts, manifest-guarded) |
| `check:mojibake` | 0 |
| two `git grep` (`'blueLight'|'purple'`, `overlayCenter`) | 1 each, no output (expected) |

**`governance:tailwind` is red and I did not fix it.** It reports `H:+5` against baseline (`C0/H15/M0` vs `H10`). All 15
lines are `scan-tailwind.mjs` rule T6 hits in `theme.ts` (9), `MantineDashboardStatCard.tsx` (4 lines, 5 entries) and
`MantineDataTableToCards.tsx` (1). I ran the T6 regex over the HEAD blob and the working tree of all three files:
9/4/1 in both. My diff to `theme.ts` is two comment lines, one type union member and one value, none a palette
class, and the other two files are not in my diff (last commits `12ccef6d0` Task 891 and `1748f28f4` Task 857). The
failure therefore exists at HEAD. Closing it needs a baseline or source change in files outside §17.8; I have not
made it. Needs an Opus decision.

## 5. GR receipts

`GR-0 CANONICAL REUSE PREFLIGHT — request: closed-listing overlay label + scrim, status colour map, card Story footer/favourite chrome; semantic queries: "status colour map", "LISTING_STATUS_COLOR", "overlay scrim", "borderWidth", "whiteSpace nowrap", "overlayFavorite"; inspected candidates: src/modules/listings/lib/listingStatusTone.ts, src/design-system/mantine/theme.ts, src/design-system/mantine/patterns/GalleryThumbnailButton.tsx:35, src/modules/listings/components/ListingCard.tsx, ListingCard.module.css .inlineFavorite/.overlayFavorite, MantineListingCardPattern(.module.css), ListingStatusBanner.tsx, Mantine/Primitives/ListingCard and ListingStatusBanner Stories; decision: REUSE (EXTEND theme.other.borderWidth by one role); selected canonical owner: listingStatusTone.ts + theme.ts + MantineListingCardPattern; Mantine/TailAdmin token path: theme.ts spacing.sm/compact, radius.2xl, fontSizes.sm, lineHeights.sm, other.borderWidth.statusOverlay; new hardcoded visual values: NONE; rationale: as kickoff §17.3.`

`GR-1 CENSUS COMPLETE — 7 nodes; tier1 7 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none.` (`ListingCard.tsx`; `ListingStatusBanner.tsx`: 1 node, tier1 1.)

`GR-2 SCOPE STATED — check:story-coverage inspects enrolled components' Story coverage; it cannot see rendered colour, radius or z-order; the visual criteria are closed by probe-before/after.json and probe-diff.txt.`

`GR-3 STORY PROVEN — MantineListingCardPattern ← src/stories/patterns/mantine/ListingCardPattern.stories.tsx; ListingCard ← src/stories/mantine/primitives/ListingCard.stories.tsx; ListingStatusBanner ← src/stories/mantine/primitives/ListingStatusBanner.stories.tsx`

`GR-3a STORY PREFLIGHT` — decision REUSE, no new Story or export; the three existing Stories render sold, rented and the banner statuses.

Measured on `storybook-static` (`probe-gr3.mjs` → `probe-gr3.json`), widths 320/390/768/1024/1440, `en`:

- **GR-3b STORY RESPONSIVE CHECK** — all three Stories, every width: no horizontal overflow; I added no width, `style` or viewport pin.
- **GR-3c TYPE RESPONSIVE CHECK** — overlay label 14px at every width; card `h3` 14px; banner text 14px. The Story page titles measure 18px (Pattern, 320/390) and 24px (Pattern from 768; Primitive ListingCard at every width). Those titles come from the existing Story code, which I did not change.
- **GR-3d STORY GUTTER CHECK** — `Patterns/Mantine/ListingCardPattern`: top/bottom 24; left/right 16 (320, 390), 24 (768), 32 (1024, 1440); `StoryPageGutter` unchanged. `Mantine/Primitives/ListingCard` and `ListingStatusBanner`: `n/a: MantineStoryShell primitive`.
- **GR-3e** n/a (no popup). **GR-3f** n/a (no circle change).
- **GR-3g CORNER CHECK** — the label is centred; the smallest gap from the label to the photo edge is 55px (768, ListingCard), 84px at 320. It touches no clipping corner, so no 10× crop.

## 6. Not done, stated plainly

- The owner visual matrix O46-1 (§17.9) is the owner's step; production `/uk/listings` needs a deploy.
- Rendered proof covers `en` only (as AC32 specifies); `uk`/`sq`/`it` long-label and 390/768/1024 label checks are owner-matrix items.
- `governance:tailwind` red, above.

## 7. Files Changed

| File | Change |
|---|---|
| `src/design-system/mantine/theme.ts` | `borderWidth.statusOverlay` (type, value, comment) |
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | `Overlay` scrim, label style props + `bd`, `OVERLAY_TONE_BORDER`, `useMantineTheme` |
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | `.overlayCenter` removed; `.overlayLabel` = `rotate`; tone `border-color` lines removed |
| `src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx` | three R34 tests |
| `src/modules/listings/components/ListingCard.tsx` | `LISTING_STATUS_COLOR`; `miw="max-content"` ×2 |
| `src/modules/listings/components/ListingStatusBanner.tsx` | `COLORS` deleted; reads `LISTING_STATUS_COLOR` |
| `src/modules/listings/lib/listingStatusTone.ts` | comment only |
| `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` | Tailwind removed; status colours from the map |
| `docs/backlog.md` | 741 state, one line |
| `docs/sessions/evidence/task741r3/` | probes, JSON, diff, transcripts |
| `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md` | this log |

## Revision 3a

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.** Scope: kickoff §17.11 (F25 fix, F26 corrected AC35 clause).
Only read-only repository inspection was used. Transcripts: `docs/sessions/evidence/task741r3/rev3a/`.

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` (re-read at the start of this session.)

`GR-0 CANONICAL REUSE PREFLIGHT — request: section titles of Mantine/Primitives/ListingCard Story; semantic queries: "TITLE_FZ", "Title order={4}"; inspected candidates: src/design-system/mantine/typography.ts (TITLE_FZ.h4), src/stories/patterns/mantine/ListingCardPattern.stories.tsx:218/240 (same Title usage), src/stories/mantine/primitives/ListingCard.stories.tsx:119/128; decision: REUSE; selected canonical owner: typography.ts TITLE_FZ; Mantine/TailAdmin token path: TITLE_FZ.h4 (h6/h5/h4 theme font-size keys); new hardcoded visual values: NONE; rationale: kickoff F25, the pattern Story already does this.`

`GR-3a STORY PREFLIGHT` — decision REUSE: existing `Mantine/Primitives/ListingCard` Story edited in place, no new Story or export.

**F25.** `ListingCard.stories.tsx`: both `Title order={4}` now carry `fz={TITLE_FZ.h4}`; `TITLE_FZ` imported from
`@/design-system/mantine/typography`. Measured on the AFTER `storybook-static` (`rev3a/probe-titles.mjs` →
`probe-titles.json`), both titles: **18px @320, 18px @390, 24px @768, 24px @1440** (expected 18/18/24/24); card `h3`
14px at every width, so no child heading exceeds the page title.

- **GR-3b STORY RESPONSIVE CHECK** — `Mantine/Primitives/ListingCard` at 320/390/768/1440: no horizontal overflow; no width, `style` or viewport pin added.
- **GR-3c TYPE RESPONSIVE CHECK** — titles 18/18/24/24px (`TITLE_FZ.h4`), card title 14px, overlay label 14px (measured in the first pass); nothing is 24px below 768.
- **GR-3d STORY GUTTER CHECK** — `n/a: MantineStoryShell primitive`.

**F26 gate clause.** `governance:tailwind` exits 1: HIGH 15, `H:+5` vs baseline, the same as HEAD. T6 palette-line counts by
file, HEAD vs tree, are identical (`theme.ts` 9/9, `MantineDashboardStatCard.tsx` 4/4, `MantineDataTableToCards.tsx` 1/1).
**One discrepancy with the clause as worded:** the clause says the output lists no §17.8 path, but `theme.ts` is a
§17.8 path and its 9 pre-existing lines appear. The lines are unchanged and I added no palette class; the "HIGH set unchanged
from HEAD" half holds. I record this rather than claim the "no §17.8 path" half. It needs an Opus ruling.

`GR-2 SCOPE STATED — governance:tailwind inspects className palette strings repo-wide; it cannot attribute a pre-existing HEAD finding to this diff; the criterion is closed by the per-file HEAD/tree T6 counts, with the caveat above that theme.ts appears in its output.`

| Command | Exit |
|---|---|
| `node.exe -p process.platform` (`win32`) | 0 |
| `build-storybook` | 0 |
| `check:stories` / `check:story-coverage` / `check:design-tokens:strict` | 0 / 0 / 0 |
| `governance:tailwind` | 1 (judged above) |
| `typecheck` / `lint` / `build` | 0 / 0 / 0 |
| `check:file-integrity` / `check:mojibake` | 0 / 0 |

Hashes: the eight earlier files equal `19_greps_hashes.txt` (`rev3a/19_hashes.txt`); the ninth, `ListingCard.stories.tsx`, is `b1fc2c653a8a7d693dcfffd3287338cb1325f242`.

| File | Change |
|---|---|
| `src/stories/mantine/primitives/ListingCard.stories.tsx` | F25: `fz={TITLE_FZ.h4}` on both section titles, `TITLE_FZ` import |
| `docs/sessions/evidence/task741r3/rev3a/` | transcripts, `probe-titles.mjs`, `probe-titles.json`, `19_hashes.txt` |
| `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md` | this section |
| `docs/backlog.md` | 741 state, one line |

The owner matrix O46-1 (§17.9) is handed over only after the review of 3a.

## Revision 3b

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.** Scope: kickoff §18 (O46-1 returned; D46-3, D46-4). Authoritative transcripts:
`docs/sessions/evidence/task741r3/rev3b/final/` (run after the last source write). The `rev3b/*.txt` files at the folder root are
earlier passes kept as history (`00_i0.txt`, `01_red.txt` are the I0 and red runs and are authoritative for those steps).
Only read-only Git inspection was used.

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` (the files were read before the task was acted on.)

`GR-0 CANONICAL REUSE PREFLIGHT` — as written in kickoff §18.3, re-checked against the tree: decision REUSE, owners `ListingCard getBadges` + `LISTING_STATUS_COLOR`, `ListingsShellView`, Mantine `useMatches`/`visibleFrom`; new hardcoded visual values: NONE.
`GR-3a STORY PREFLIGHT` — EXTEND the three existing `Default` exports; no new Story, no new export.
`GR-1 CENSUS COMPLETE — surface ListingCard.tsx 7 nodes; tier1 7 migrated+enrolled+story; tier2 0; tier3 0 listed and filed as none.` (`win32`, exit 0.) `Surface ListingsShell.tsx 23 nodes: before, FAIL = ListingsShell.tsx (baselined container debt, not changed) + ListingsActionRow.tsx; after R38, FAIL = ListingsShell.tsx only; tier2 0; tier3 0.`

### I0 (`rev3b/00_i0.txt`)
`git status --porcelain` showed a dirty tree (Task 859's uncommitted work plus the earlier 741 R3 files). I0 hashes of the nine §18.8 files are in `00_i0.txt`; `ListingsShellView.viewReset.test.tsx` did not exist. `scripts/mantine-migration-scope.json` and `scripts/surface-census-baseline.json` carried 859's hunks: I added **one line** to the first and removed **two keys (6 lines)** from the second, and nothing else; `rendered-scope-baseline.json` was clean at HEAD and lost **one key (3 lines)**. The 859 hunks are untouched (numstat of the census baseline before 5+/14−, after 5+/20−).

### Requirements → evidence

| Req | Change | Evidence |
|---|---|---|
| R36 | `getBadges`: `inactive` → gray, `pending` → yellow, each returns early (no New / price-reduced); comment names D46-4; two `eslint-disable-next-line no-restricted-syntax -- reason` lines, the same convention the sold/rented branches already use (no helper separates inactive from pending) | `final/02_vitest.txt`; `01_red.txt` |
| R37 | `ListingsShellView`: `useMatches({ base: true, sm: false }, { getInitialValueInEffect: false })` + `useEffect` calling `onViewChange('grid')` when below sm and `view === 'list'`; render uses the grid track when `view === 'grid' \|\| isBelowSm` | `probe-viewreset.json` (below) |
| R38 | `ListingsActionRow.tsx` enrolled; 3 stale baseline keys removed (the two census keys the kickoff names and the one rendered-scope key); `ListingsShell.tsx` stays baselined | `final/04,07,08,09,10`; `pre_*.txt` (stale reports before the edit) |
| R39 | `Mantine/Primitives/ListingCard` → `Default`: eleven states in the §18.4 order in the grid and again in the list section (`Stack visibleFrom="sm"`, citing `ListingsSortBar`); `makeFixtureListing(l, key, opts)` | `probe-states.json`, `probe-states-verify.txt` |
| R40 | `Patterns/Mantine/ListingCardPattern` → `Default`: the same eleven states in both sections; `DemoCard` takes `status`/`isNew`; badge labels from `storyT(l, 'listing.status_*')`; list section + `Divider` `visibleFrom="sm"`; `consumer-overlay-hook` play test unchanged | same |
| R41 | 2 `ListingCard.smoke` tests + new `ListingsShellView.viewReset.test.tsx` (4 tests) | red `01_red.txt`: 2 files failed, **4 failed / 23 passed, exit 1**; green `final/02_vitest.txt`: **4 files, 39 passed, exit 0** |

### Probes (final build, `rev3b/final/12_build-storybook.txt`, exit 0)
- **AC37** `probe-viewreset.json`, `patterns-mantine-listingsshellview--default`: 1440 initial = 8 vertical cards, Grid `filled`; click List → 8 horizontal, List `filled`; resize 390 → **0 `.listing-card--horizontal`**, 8 vertical cards, toggle **not visible**; back to 1440 → 0 horizontal, toggle visible, **Grid `filled`**, List `subtle` (D46-3: List not restored).
- **AC39** `probe-states.json` (2 stories × `en`,`uk` × 320/390/768/1440 = 16 cells per clock pass, 2 passes), checked by `verify-states.mjs` → `probe-states-verify.txt` = **`AC39 OK`**, exit 0: every grid shows eleven cards; `en` badge texts per card are `[New] [] [New,Price reduced] [] [Inactive] [Under review] [Sold] [Rented] [Archived] [Expired] []`; overlay on cards 7 and 8 only; card 9 dimmed; card 11 placeholder; the list section is hidden at 320/390 and shows the same eleven at 768/1440 with no overlay; `uk` primitive grid: `Нове · · Нове+Ціну знижено · · Неактивне · На модерації · Продано · Орендовано · Архів · Прострочене ·`; pass B (browser clock fixed to 2027-03-01) equals pass A cell for cell.

### Deviations from the kickoff, reported (the tree wins)
1. **The `Date.now` pin in R39 / §18.3 was not added; the §18.1 RETRACTION's cause is wrong for Storybook.** `.storybook/preview-head.html` (Task 698, D25) already freezes `Date.now()` and zero-argument `new Date()` to 2026-07-30 for every Story, so "New" never depended on the wall clock there. I built the pin first, then **planted its absence** (removed the `beforeEach`, rebuilt `storybook-static`, ran the moved-clock pass on the primitive Story): `probe-states-plant.json` still shows `[New] [] [New+Price reduced] …`, so the pin did nothing and would be a second, duplicate clock freeze (GR-0). Pre-plant story hash `fb09d0db5642966140347984f603fe70d269c7e0`; final `cfd74494f064b1361055c0aa701663d9686a2308` (pin gone, comment states the preview freeze). `clock-check.mjs` shows `page.clock.setFixedTime` does move the page clock, so pass B is not vacuous. The "New" badge in *vitest* does read the real clock; the new smoke tests use `new Date()` for that reason.
2. **R40 sold badge label.** The pattern Story's sold badge used `card_overlay_sold` ("SOLD"); production shows `status_sold` ("Sold") on the badge and "SOLD" only on the overlay. The first AC39 pass caught it. The badge now reads `storyT(l, 'listing.status_sold')`; the overlay label (and the play test) keep `card_overlay_sold`.
3. **`useMatches` option.** Mantine's `useMatches` returns the `base` value (`true`, "below sm") on the first client render until its effect runs. With the default, a desktop `list` would be reset on mount. `{ getInitialValueInEffect: false }` reads `matchMedia` synchronously. On the server `window` is absent, so `isBelowSm` is `true` there and the grid renders, which is what `view` ('grid' at mount) says anyway.
4. **`check:surface-census:changed`** requires `--base`; I ran `--base HEAD`, as Task 859 did (`final/09_census-changed.txt`: new blocks 0, stale 0). `check:surface-census:changed:verify` (`final/10`) is exit 0.
5. **BOM in my own transcripts.** `check:file-integrity` first failed (exit 1, 39 files) on my PowerShell-written `rev3b/*.txt` files (UTF-8 BOM). I stripped it with a Node script restricted to `*.txt` under `rev3b/` (manifest printed first, 31 files in the second pass after my first run was cut short by a pipe), then re-ran the gate: `final/16_file-integrity.txt`, 204 files, exit 0.

### Gate block (`rev3b/final/`, each transcript ends `EXIT_CODE=`; `node.exe -p process.platform` = `win32`, Node v22.22.3)

| Command | Exit |
|---|---|
| `vitest` (4 files, 39 tests) | 0 |
| `check:stories` / `check:story-coverage` / `check:design-tokens:strict` / `check:type-responsive` | 0 / 0 / 0 / 0 |
| `check:rendered-scope` / `:verify` | 0 / 0 |
| `check:surface-census:changed --base HEAD` / `:verify` | 0 / 0 |
| `governance:tailwind` | **1** (judged below) |
| `build-storybook` / `typecheck` / `lint` / `build` | 0 / 0 / 0 / 0 (`/[locale]` 6.03 kB, First Load 670 kB) |
| `check:file-integrity` / `check:mojibake` | 0 / 0 |

`GR-2 SCOPE STATED — governance:tailwind inspects className palette strings repo-wide; it cannot attribute a pre-existing HEAD finding to this diff; the criterion is closed by the AC35 clause (§17.12 F27): its HIGH set (15 lines: theme.ts 9, MantineDashboardStatCard.tsx 5, MantineDataTableToCards.tsx 1) is identical, line numbers included, to Revision 3a's transcript (`rev3a/13_governance-tailwind.txt`), and no finding sits on a line this diff adds or changes (this diff does not touch those three files).`

The first lint run found **2 errors** in my `getBadges` (`no-restricted-syntax`, direct `.status` comparison); fixed with the documented disable-comment convention above; `lint` is 0 errors / 150 warnings (all pre-existing, none in the touched files: `21b_lint-touched.txt`).

Hashes (`final/18_hashes.txt`): the six untouched source files equal Revision 3a's hashes; the nine §18.8 files are
`ListingCard.tsx 28bd4310…`, `ListingsShellView.tsx 1907dd72…`, `ListingCard.stories.tsx cfd74494…`, `ListingCardPattern.stories.tsx 4dc5a740…`, `ListingCard.smoke.test.tsx 09991c9e…`, `ListingsShellView.viewReset.test.tsx 7063470c…`, `mantine-migration-scope.json 006e0f58…`, `surface-census-baseline.json 1d8da2ae…`, `rendered-scope-baseline.json 77f04d83…`. `git status` for the 741 paths is `final/19_status-741-paths.txt`.

### Receipts (probe `probe-gr3.json`, `en`, DPR 1, final build; component width = viewport − left − right gutter)

`GR-3b STORY RESPONSIVE CHECK — mantine-primitives-listingcard--default: 320 288/320 · 390 358/390 · 1024 926/1024 · 1440 1342/1440 (fluid in MantineStoryShell); overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE (list section hidden below sm; titles stacked at 768+).`
`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-listingcardpattern--default: 320 288/320 · 390 358/390 · 1024 960/1024 · 1440 1376/1440 (fluid in StoryPageGutter); overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE.`
`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-listingsshellview--default: 320 288/320 · 390 358/390 · 1024 960/1024 · 1440 1376/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE.`
`GR-3c TYPE RESPONSIVE CHECK — mantine-primitives-listingcard--default: section Title 320 18px · 390 18px · 768 24px · 1440 24px; card h3 14px; overlay label 14px; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`
`GR-3c TYPE RESPONSIVE CHECK — patterns-mantine-listingcardpattern--default: section Title 320 18px · 390 18px · 768 24px · 1440 24px; card h3 14px; overlay label 14px; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`
`GR-3c TYPE RESPONSIVE CHECK — patterns-mantine-listingsshellview--default: no Title; card h3 14px, largest text 18px at 320/390/768/1440; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`
`GR-3d STORY GUTTER CHECK — mantine-primitives-listingcard--default: gutter n/a: MantineStoryShell primitive; top/right/bottom/left 320 16/16/16/16 · 390 16/16/16/16 · 1024 49/49/49/49 · 1440 49/49/49/49 (the shell frame, known exception; Task 909 D87-2 owns it); side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.`
`GR-3d STORY GUTTER CHECK — patterns-mantine-listingcardpattern--default: gutter StoryPageGutter all (unchanged); top/right/bottom/left 320 24/16/24/16 · 390 24/16/24/16 · 1024 24/32/24/32 · 1440 24/32/24/32 (expected 24 / 16·16·32·32); side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.`
`GR-3d STORY GUTTER CHECK — patterns-mantine-listingsshellview--default: gutter StoryPageGutter all (ListingsShellView.stories.tsx:55, unchanged); top/right/bottom/left 320 45/16/24/16 · 390 45/16/24/16 · 1024 36/32/24/32 · 1440 36/32/24/32 (the top is the profile's 24 plus the page's own first row); side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.`
`GR-3e TEXT BUTTONS STACKED — all three: n/a, no popup.` `GR-3f CIRCLE CHECK — n/a: no circular element changed.`
`GR-3g CORNER CHECK — overlay label (sold, rented): unchanged in 3b; clipping ancestor = card photo frame; corners meeting it: none (label centred, 70px wide, radius 16px at every width in the probe); line cut at a corner: NONE.`

### Files Changed

| File | Change |
|---|---|
| `src/modules/listings/components/ListingCard.tsx` | R36: `inactive` / `pending` badges in `getBadges`, comment, 2 disable lines |
| `src/modules/listings/components/ListingsShellView.tsx` | R37: `useMatches` + `useEffect` reset, grid track below sm |
| `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` | R41: inactive and pending tests |
| `src/modules/listings/components/__tests__/ListingsShellView.viewReset.test.tsx` | R41: new, 4 tests |
| `src/stories/mantine/primitives/ListingCard.stories.tsx` | R39: eleven states, `visibleFrom="sm"` list section, fixture options |
| `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` | R40: eleven states, `status`/`isNew`, status labels, `visibleFrom="sm"` |
| `scripts/mantine-migration-scope.json` | R38: +1 line (`ListingsActionRow.tsx`) — 859's four lines are not mine |
| `scripts/surface-census-baseline.json` | R38: −2 keys (6 lines) — 859's hunks untouched |
| `scripts/rendered-scope-baseline.json` | R38: −1 key (3 lines) |
| `docs/sessions/evidence/task741r3/rev3b/` | transcripts, probes, JSON, plant evidence |
| `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md` | this section |
| `docs/backlog.md` | 741 state, one phrase (63 lines, HEAD baseline 63) |

### Not done / for Opus
- Owner matrix **O46-2** (§18.9) is the owner's step; production `/uk/listings` and `/uk/favorites` need a deploy. Phone landscape ↔ portrait is not exercisable here; the Playwright resize in `probe-viewreset.json` is the stand-in.
- Rendered proof is `en` for geometry and `en`+`uk` for badge texts; `sq` / `it` long-label checks at 320 (for example *Nën shqyrtim*) are owner-matrix items.
- `check:locale-leak:mantine-only` is not in the §18.7 block and was not run.
- The 859 hunks in the two shared script files must be separated from the R38 hunks at commit time (listed above by key).
- **Question for review:** the §18.1 RETRACTION and R39's `beforeEach` pin rest on a cause that `.storybook/preview-head.html` already prevents; deviation 1 above. The owner's complaint (states missing from the primitive) stands either way, and is fixed.

## Revision 3c

Kickoff §18.11 (only executable route). Re-entry mode: remediation. Evidence: `docs/sessions/evidence/task741r3/rev3c/`.

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

`GR-0 CANONICAL REUSE PREFLIGHT — request: three badge label keys in the pattern Story and one test; semantic queries: listing.new / price_reduced / status_archived, card_badge_*, getBadges labels; inspected candidates: src/modules/listings/components/ListingCard.tsx (getBadges, t = useTranslations('listing')), src/stories/patterns/mantine/ListingCardPattern.stories.tsx, ListingDetailPattern.stories.tsx (still uses card_badge_new/premium/reduced), messages/uk.json; decision: REUSE; selected canonical owner: production keys listing.new, listing.price_reduced, listing.status_archived; Mantine/TailAdmin token path: NONE (no visual value touched); new hardcoded visual values: NONE; rationale: the Story label equals production's own label.`

`GR-7 REFERENCE RESEARCH — moment: execution, role: Sonnet.` The kickoff says no audit is run, but GR-7 allows only the owner to narrow it, so a proportionate live check was run. Library `docs/research/references/2026-10-04/` read for the subject (badge, card, status pages: lahomes 008/049/052, kamr 026/031, omah 013/014, tailadmin 064/068). Live, own session, 1440, full-page screenshots plus computed styles in `rev3c/research-exec/` (`gr7-live.json`, `*.png`): Lahomes `/property-grid.html`, `/ui-badge.html`; Kamr `/ui-badge` (logged in as `demo@example.com`, given by the owner mid-session; the earlier `admin` attempts failed on the email field); Omah `/property-list.html`; TailAdmin `/badge`. Result: status badges are small (11–13px) labelled pills with a tinted colour per state (Omah "For Rent" 4px radius; TailAdmin pill 2px/10px; Kamr 7px radius). R42 chooses no layout, control or value; it makes a Story label equal to production's label, so no kickoff conflict. Only these pages were opened, not every page of each reference; a full-library re-crawl was not run (no difference found for the subject).

### I0
`rev3c/00_i0.txt`: the two §18.11.2 files hash `4dc5a740…` and `7063470c…`, equal to `rev3b/final/18_hashes.txt`.

### Requirements
| ID | Result | Evidence |
|---|---|---|
| R42 | `DemoCard` New → `listing.new`, Price reduced → `listing.price_reduced`, Archived → `listing.status_archived`; three lines, nothing else; `messages/*.json` untouched | `final/13_hashes.txt` pattern Story `b00428d3…` |
| R43 | `matchMedia` stub records each `change` listener with its query; test 4 renders below sm with list (one call `grid`), grows the viewport, fires each listener with `{ matches: query.includes('min-width') }` in `act()`, re-renders, asserts one call in total, never `'list'`, no `.listing-card--horizontal`. Tests 1–3 unchanged | `r43-green.txt` 4/4; test file `a9a456eb…` |

### Red runs
- **AC42 red** (`r43-red.txt`, EXIT_CODE=1): with the firing loop replaced by `void changeListeners` (temporary edit, reverted), 1 failed / 3 passed. Green after the revert: `r43-green.txt` 4/4, EXIT_CODE=0.
- **AC41 red** (`verify-red.txt`, EXIT_CODE=1): the extended verifier on the old `rev3b/probe-states.json` gives 36 `parity` lines, all in `uk` cells at 320/390/768/1440, in both passes.

### Gate block (`rev3c/final/`)
| # | Command | Exit |
|---|---|---|
| 00–01 | platform / node | 0 / 0 |
| 02 | vitest, four files | 0, 39 passed |
| 03 | check:stories | 0 |
| 04 | check:story-coverage | 0 |
| 05 | check:design-tokens:strict | 0 |
| 06 | check:i18n | 0 |
| 07 | build-storybook | 0 |
| 08 | typecheck | 0 |
| 09 | lint | 0 |
| 10 | build | 0 |
| 11 | check:file-integrity | 0 |
| 12 | check:mojibake | 0 |
| 13 | hashes | ListingCard.stories `cfd74494…`, ListingCard.tsx `28bd4310…`, ListingsShellView.tsx `1907dd72…` equal 3b |
| 14 | status --porcelain | 142 lines, working tree shared with Task 859 hunks |

`card_badge_archived` is now unused by the card Story; no gate failed on it.

### AC41
`probe-states.json` (en/uk at 320/390/768/1440, plus sq and it at 1440, both passes) and `probe-states-verify.txt`: `AC39 OK`, `EXIT_CODE=0`, no failure lines, so the pattern Story's grid and list badge texts equal the primitive Story's card by card for every locale.

### Story receipts — `patterns-mantine-listingcardpattern--default` (`probe-gr3.json`)
- `GR-3b STORY RESPONSIVE CHECK`: no horizontal overflow at 320/390/1024/1440 (nor 768); list section hidden below 640, two stacked sections from 768.
- `GR-3c TYPE RESPONSIVE CHECK`: section Title 18px at 320/390 and 24px at 768/1440; body 12–16px; card h3 14px. Same values as 3b.
- `GR-3d STORY GUTTER CHECK`: top/bottom 24; left/right 16 at 320/390, 32 at 1024/1440 (24 at 768).
- GR-3e n/a (no popup). GR-3f n/a. GR-3g unchanged from 3a/3b (no border or ring edited).
- `uk` at 320 (`probe-uk320.json`): 9 badges, 0 outside the photo; card 3 *Нове* and *Ціну знижено* both inside.

### Deviations
1. **R43 extra assertion.** With the kickoff's four steps only, the AC42 red arm cannot fail: skipping the firing leaves the hook below sm, and a grid re-render still passes. I added one step between 2 and 3: a `view="list"` re-render must render `.listing-card--horizontal`, proving the hook sees sm or more. Without it AC42's red arm passes, which defeats it.
2. **GR-7.** The kickoff says no audit; I ran the proportionate one above because GR-7 allows only the owner to narrow it.
3. **Verifier path.** `rev3c/verify-states.mjs` takes the JSON path as argv[2] (default unchanged) so the red arm can run on the 3b file.

### Files Changed
| Path | Change |
|---|---|
| `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` | R42: three label keys |
| `src/modules/listings/components/__tests__/ListingsShellView.viewReset.test.tsx` | R43: listener-recording stub, test 4 |
| `docs/sessions/evidence/task741r3/rev3c/` | new: I0, red/green runs, gate transcripts, probes, GR-7 live check |
| `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md` | this section |
| `docs/backlog.md` | 741 state, one phrase |

### Not done / for Opus
- Owner matrix O46-2 (§18.9) is the owner's step; production needs a deploy.
- Rendered `sq`/`it` is covered for badge text at 1440 only, not geometry at 320.
- GR-7: the owner's rule says every page of each reference; only the pages named above were opened live.

## Revision 3d

Kickoff §18.12 (only executable route; R44, AC43). Re-entry mode: remediation. Evidence: `docs/sessions/evidence/task741r3/rev3d/`. No source, Story, test, script or `messages/*.json` file was written.

### I0 and final hashes
`rev3d/00_i0.txt` and `rev3d/01_final_hashes.txt` (both `win32`, Node v22.22.3): the five files equal `rev3c/final/13_hashes.txt` — pattern Story `b00428d3…`, viewReset test `a9a456eb…`, primitive Story `cfd74494…`, `ListingCard.tsx` `28bd4310…`, `ListingsShellView.tsx` `1907dd72…`. Both runs show the working tree shared with Task 859 and others, so the Revision 3c build, test and probe evidence stays current.

### Audit record
`docs/sessions/evidence/task741r3/rev3d/research-exec/gr7-exec.md` — 12 rows (6 pages × 1440 and 390), each with a full-page screenshot (`exec-00…11-*.png`), badge `getComputedStyle` values, the view-toggle controls and `unchanged`/difference against the library row.

`GR-7 REFERENCE RESEARCH — moment: execution; role: Sonnet; task: 741 (Revision 3c); subject: listing-card status badges, sold/rented overlay label, grid/list toggle below 640; references: Lahomes, Kamr, Omah, TailAdmin + none; library: docs/research/references/2026-10-04; live-checked pages: Lahomes /property-grid.html → unchanged, /property-list.html → unchanged, Omah /property-list.html → unchanged, Kamr /room (signed in as demo@example.com) → unchanged page, difference: the live sign-in works while the library crawl recorded a failed login, TailAdmin /cards → unchanged, /badge → unchanged; route inventory: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0; inspected in depth: the six live pages at 1440 and 390 (gr7-exec.md rows 1–12); workflow states operated: page load, Kamr sign-in, 1440→390 on every page, grid/list control inventory; options across references: filled on-photo pill ← Omah 013 (11px/400, r4); tinted labelled pill ← Lahomes 009 (13px/600, r4), Kamr 005 (r7), TailAdmin 064/068 (pill); icon tab toggle kept at 390 ← Omah 013; separate routes ← Lahomes 008/009; no toggle ← Kamr, TailAdmin; strike-through old price ← Lahomes 008; chosen 2026 best practice: labelled badge per status from one colour map + owner D46-3 toggle hidden below 640 with list→grid reset, as shipped (not contradicted); absent or unverified: inactive/pending card badges, phone orientation reset (no reference), the other library pages not opened live; lero.al data map: ListingCard × listings.status (7 values)/price/price_old/created_at/is_premium/images, ListingsShellView × view; owner decisions: D46-1…D46-4, O83-1; evidence: docs/sessions/evidence/task741r3/rev3d/research-exec/gr7-exec.md.`

### Difference reported, not a conflict
§18.12.2 credits "a filled pill at the photo's top corner (13px/600, radius 4px)" to Lahomes 008 and Omah 013. Measured live: Omah 013 has a filled on-photo pill but at 11px/400, radius 4px. Lahomes' 13px/600, radius 4px pill is on 009, tinted (`bg-*-subtle`), not on a photo; Lahomes 008 shows no card status pill. The chosen practice (a labelled badge per status) is supported by all four references, so I did not stop with `BLOCKED — GR-7 KICKOFF CONFLICT`; the attribution in §18.12.2 needs Opus's correction.

### Files Changed
| Path | Change |
|---|---|
| `docs/sessions/evidence/task741r3/rev3d/` | new: I0, final hashes, `research-exec/` (audit script, JSON, 12 screenshots, `gr7-exec.md`) |
| `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md` | this section |
| `docs/backlog.md` | 741 state, one phrase |

### Not done / for Opus
- O46-2 rows 1–2 moved to Task 918 by D46-5 (§18.13); row 3 awaits the owner; row 4 needs a deploy.
- Only the six pages named above were opened live; the library rows stand for the rest.

## Revision 3d-1

Kickoff §18.14 / R45, executed inside Revision 3e (§18.15). Evidence: `docs/sessions/evidence/task741r3/rev3d/` (new files only: `04_i0.txt`, `05_final_hashes.txt`, `research-exec/badges-390-remeasure.{mjs,json}`; `research-exec/gr7-exec.md` rows 1–2, the options table and the difference section corrected).

**RETRACTION (executor).**
- **Invalid prior claim:** Revision 3d said Lahomes `/property-grid.html` (008) "shows no status pill on its cards" and that "For Rent/For Sale are filter labels".
- **Why invalid:** my own `card-badges2.json` recorded `span.badge bg-success|bg-danger|bg-warning text-white fs-13` "For Rent", "Sold", "For Sale" on the photos (13px/600, radius 4px, padding 3px 6px, white on `rgb(92,193,132)` / `rgb(233,103,103)` / `rgb(240,147,78)`), and the screenshot shows them.
- **Evidence:** `card-badges2.json` → `lahomes-grid@1440`; re-measured at 390 and 1440 in `badges-390-remeasure.json` (same values, `onPhoto: true`); `exec-00-lahomes-1440.png`, `exec-01-lahomes-390.png`.
- **Corrected status:** FACT. Lahomes 008 has a filled on-photo pill. Omah 013 is also an on-photo filled pill, at 11px/400, radius 4px. The chosen practice is unchanged.

`GR-7 REFERENCE RESEARCH — moment: execution (corrected, supersedes Revision 3d); role: Sonnet; task: 741 (Revision 3c); subject: listing-card status badges, sold/rented overlay label, grid/list toggle below 640; references: Lahomes, Kamr, Omah, TailAdmin + none; library: docs/research/references/2026-10-04; live-checked pages: Lahomes /property-grid.html → unchanged (on-photo filled pills, re-measured at 390), /property-list.html → unchanged, Omah /property-list.html → unchanged, Kamr /room (signed in as demo@example.com) → unchanged page, difference: the live sign-in works while the library crawl recorded a failed login, TailAdmin /cards → unchanged, /badge → unchanged; route inventory: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0; inspected in depth: the six live pages at 1440 and 390 (gr7-exec.md rows 1–12); workflow states operated: page load, Kamr sign-in, 1440→390 on every page, grid/list control inventory; options across references: filled pill on the photo ← Lahomes 008 (13px/600, r4), Omah 013 (11px/400, r4); tinted labelled pill ← Lahomes 009, Kamr 005, TailAdmin 064/068; icon tab toggle kept at 390 ← Omah 013; separate routes ← Lahomes 008/009; no toggle ← Kamr, TailAdmin; strike-through old price ← Lahomes 008; chosen 2026 best practice: labelled badge per status from one colour map + owner D46-3 toggle hidden below 640 with list→grid reset, as shipped (not contradicted); absent or unverified: inactive/pending card badges, phone orientation reset (no reference), the other library pages not opened live; lero.al data map: ListingCard × listings.status (7 values)/price/price_old/created_at/is_premium/images, ListingsShellView × view; owner decisions: D46-1…D46-4, O83-1; evidence: docs/sessions/evidence/task741r3/rev3d/research-exec/gr7-exec.md.`

**AC44 hash clause — deviation.** `rev3d/04_i0.txt` (I0) equals `rev3c/final/13_hashes.txt` for all five files. `rev3d/05_final_hashes.txt` equals it for three; `ListingsShellView.tsx` and `ListingCard.stories.tsx` differ **by design**, because §18.15 R46 and R50 edit them in the same session. The other three are unchanged.

## Revision 3e

Kickoff §18.15 (only executable route; R45–R51, AC44–AC48). Re-entry mode: remediation. Evidence: `docs/sessions/evidence/task741r3/rev3e/exec/`.

### GR-7 and canonical preflights
- `GR-7 REFERENCE RESEARCH` receipt: `rev3e/exec/research-exec/gr7-exec-3e.md` (Lahomes 008/060, Kamr 038/013, Omah 013, TailAdmin 016/066 all `unchanged`; Rozetka catalogue in headed Chrome: primary "Показати ще" 16/500, radius 8, 40px, centred above the paginator, same at 390; D46-7 full width below 640 is the owner's decision). No kickoff conflict.
- `CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` The GR-0 and GR-3a records are the kickoff's §18.15.4; I re-checked each owner: theme `Button`, `MantineEmptyLoadingErrorState`, Mantine `Divider`, `cardListingData.fixture.ts`; no new hardcoded visual value.
- Note: I opened the task file before reading the GR-0 files, then re-read them and restarted from the gate before any write.
- `GR-1 CENSUS COMPLETE` for `ListingsShell.tsx`: `final/02_census.txt` lists only `ListingsShell.tsx` as FAIL (baselined container debt), exit 1 as expected.

### I0 and tests (red first)
`00_i0.txt`: hashes of the six scope files (`ListingsShellView.tsx` `1907dd72…`, `ListingCard.stories.tsx` `cfd74494…`, …) and the porcelain status; the worktree was already dirty from earlier revisions and Task 859. New file `ListingsShellView.smoke.test.tsx`: `01_red.txt` 4 failed / 4, exit 1 on the pre-change tree; `02_green.txt` 3 files, 31 passed, exit 0.

### Changes
- R46 `ListingsShellView.tsx`: "Show more" is `<Button variant="filled" color="brand" loading={isLoadingMore} w={{ base:'100%', sm:'auto' }}>`; no `size`, `leftSection` or `disabled`; `Loader`, `Center`, `ThemeIcon`, `Text` imports removed (`useMantineTheme` stays: the icon size uses it).
- R47 same file: the empty branch renders `MantineEmptyLoadingErrorState` with a lucide `Home` icon at `iconSize.decorative`; description only on the active tab.
- R48 `ListingsSortBar.tsx`: the `style` object is gone; a `Divider color="gray.2"` follows the row inside a `Stack gap={0}`; `.listings-sort-bar` stays on the `Group`. (The whole `Group` block is re-indented, which makes the diff large.)
- R49 `SaveSearchButton.tsx`: confirm button `loading={isPending}`, `leftSection` Bookmark; `Loader` import removed.
- R50 `cardListingData.fixture.ts` gains `makeStateListing`, `StateListingOpts`, `FIXTURE_CREATED_AT`, `FIXTURE_OLD_CREATED_AT` (same output as the old `makeFixtureListing`); `ListingCard.stories.tsx` imports them; `ListingsShellView.stories.tsx` exports `Default` (6 states, 2 chips via URL query, `perPage` 6 / `total` 18), `ClosedTab`, `ClosedEmpty`, `Empty`, `LoadingMore`.
- R51 the test file above.
- R45 recorded in `## Revision 3d-1`.

### Gate block (`rev3e/exec/final/`, each ends `EXIT_CODE=`)
platform `win32`, Node v22.22.3; census 1 (expected); vitest (viewReset + smoke + `ListingCard.smoke`) 0; `check:stories` 0; `check:story-coverage` 0; `check:design-tokens:strict` 0; `check:i18n` 0; `build-storybook` 0; `typecheck` 0; `lint` 0; `build` 0; `check:file-integrity` 0; `check:mojibake` 0; `check:backlog-active` 0 (re-run after the backlog edit: `14b_backlog-active.txt`, 0, `docs/backlog.md` 80 lines, baseline 80). Hashes `15_hashes.txt`, status `16_status.txt`.

### AC48 probe (`probe-ac48.mjs` → `probe-ac48.json`, `.txt`; en/uk, 390/1440)
- `Default`: 6 cards, badges New / – / New+Price reduced / – (premium) / – (placeholder, 1) / – (favourite, 1 pressed), 2 chips, pagination controls 1 and 3 plus Previous/Next (the canonical `MantinePagination` collapses page 2 for 3 pages; not changed here), "Show more" `filled` 14px 44px high, not loading.
- `ClosedTab`: Sold and Rented cards, 2 overlays, no "Show more", no pagination.
- `ClosedEmpty`: "No sold or rented listings found", no description. `Empty`: "No listings found". No 🏠 in any export.
- `LoadingMore`: `data-loading` true. "Save search" and "Show more" both compute 14px and 44px high (Show more radius is in the JSON).
- Sort-bar line: `mantine-Divider-root`, 1px, `rgb(228,231,236)` (`gray.2`). The before-y offset was not re-captured against an old build: the old line was the `Group`'s own bottom border (inside its border box), and the new line is the 1px `Divider` directly after it, so the total height is equal by construction.
- Primitive `Mantine/Primitives/ListingCard` probe (`probe-states.json`, 140 cells) vs `rev3c/probe-states.json`: 0 diffs (`probe-states-compare.txt`).

### Story receipts (`probe-receipts.mjs` → `probe-receipts.json`)
- `GR-9 REVIEW DEPTH — patterns-mantine-listingsshellview--default/--closed-tab/--closed-empty/--empty/--loading-more: elements per export traced to the canonical owner (tabs, filter bar, chips, action row, view toggle, MantinePagination, ListingCard → manifest yes / Story yes; "Show more" → theme Button; empty → MantineEmptyLoadingErrorState; sort line → Divider; Save search confirm → theme Button loading); non-canonical props/values: none left from F37–F40; production states: active variants, closed tab, both empty states, loading-more, pagination, chips all rendered; unreachable shown: none (Show more only with total 18 > 6 loaded; chips equal Filters 2); variant parity grid/list → Task 918 §16; executor claims checked: AC48 probe; evidence rev3e/exec/probe-ac48.json.`
- `GR-3b STORY RESPONSIVE CHECK`: no horizontal overflow for every ListingsShellView export, `ListingsSortBar`, `ListingsActionRow` and `Mantine/Primitives/ListingCard` at 320/390/1024/1440 (768 also measured).
- `GR-3c TYPE RESPONSIVE CHECK` (320/390/768/1440): card h3 14px, h4 18px (24px at 1440 in the primitive Story, unchanged); body 12–18px (empty title 18px, description 14px); buttons 14px (16px is the sort combobox input, unchanged). No heading above 20px below 640.
- `GR-3d STORY GUTTER CHECK`: `ListingsShellView` exports (`StoryPageGutter`, unchanged): content left/right 16 at 320/390 and 32 at 1024/1440; top 60/36 and bottom 56 or more (content-driven by tabs and pagination, none at 0). `ListingsSortBar` story: 16/16/32/48; `ListingsActionRow` story: left 16/16/32/48, right 16/16/49/65 (content-driven). I did not change those two Story files; the values are as measured.
- `GR-3e TEXT BUTTONS STACKED`: Save search modal (`gr3e-save-search-{390,1440}.png`): one text button (Cancel, subtle) beside the filled Save; at 390 they stack full width, at 1440 they share a row. One text button only, so the lone-text-button allowance applies.
- `GR-3f CIRCLE CHECK`: n/a (no circular control changed).
- `GR-3g CORNER CHECK`: overlay label in `ClosedTab` at 1440: the only ancestor with overflow and a radius is the card (6px); the label is centred and does not touch a card corner; 10× crop `gr3g-overlay-10x.png` shows the label's own border and rounded ends uncut.

### Files Changed
| Path | Change |
|---|---|
| `src/modules/listings/components/ListingsShellView.tsx` | R46, R47 |
| `src/modules/listings/components/ListingsSortBar.tsx` | R48 |
| `src/modules/listings/components/SaveSearchButton.tsx` | R49 |
| `src/stories/patterns/mantine/ListingsShellView.stories.tsx` | R50: five exports |
| `src/stories/mantine/primitives/ListingCard.stories.tsx` | R50: imports the moved fixture |
| `src/stories/fixtures/cardListingData.fixture.ts` | R50: `makeStateListing` |
| `src/modules/listings/components/__tests__/ListingsShellView.smoke.test.tsx` | R51 (new) |
| `docs/sessions/evidence/task741r3/rev3d/` | R45: corrected `gr7-exec.md`, `04_i0.txt`, `05_final_hashes.txt`, re-measure script and JSON |
| `docs/sessions/evidence/task741r3/rev3e/exec/` | new: GR-7 record, I0, red/green, gates, probes, receipts |
| `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md` | this section |
| `docs/backlog.md` | 741 state, one phrase (80 lines) |

### Not done / for Opus
- Owner matrix O46-3 (§18.15.10) is the owner's step; `OWNER VISUAL QA REQUIRED` for `ListingsShellView` `Default`/`LoadingMore`/`ClosedTab`/`ClosedEmpty`/`Empty` (390, 1440; en, uk) and `ListingsSortBar` exports (390, 1440; en).
- Sort-bar line: before-y offset not measured against an old build (see AC48 notes).
- The `ListingsShellView.stories.tsx` header JSDoc still describes the Phase 4 migration (ThemeIcon etc.); left as written.
- In `probe-ac48.json` the uk "Show more" is `null` because my label regex missed the uk text; `probe-pag.mjs` output confirms `Показати ще` and the uk pagination.
- Only the pages named in the GR-7 record were opened live; the library rows stand for the rest.

## Revision 3f

Kickoff §18.16 (only executable route; R52–R56, AC49–AC51). Re-entry mode: remediation, on the current working tree. Evidence: `docs/sessions/evidence/task741r3/rev3f/exec/`. No consumer file and no Revision 3e file is edited, apart from `ListingsSortBar.tsx`'s comment.

**RETRACTION (executor, R55 / F44).**
- **Invalid prior claim:** `## Revision 3e` (AC48 probe) said "pagination controls 1 and 3 plus Previous/Next (the canonical MantinePagination collapses page 2 for 3 pages; not changed here)" and reported AC48 met.
- **Why invalid:** the "3" was the hidden measuring probe (`position: fixed; visibility: hidden`, the last `Pagination.Control`, text `String(total)`); only "1" was visible. My probe filtered controls by text and did not exclude the probe, and my `probe-pag.mjs` printed the same two controls, which I read as a legitimate collapse instead of checking what was drawn.
- **Evidence:** `rev3e/review/pagination-probe.json` and `pagination-parent.json` (Opus): 112px root, floor level only. The corrected probe `rev3f/exec/probe-ac49.mjs` excludes `position: fixed` controls.
- **Corrected status:** FACT. In 3e `ListingsShellView` `Default` showed "‹ 1 ›" (F43). AC48 for 3e was not met on its pagination clause; it is re-run below on the 3f build.

### GR-7 and canonical preflights
- `GR-7 REFERENCE RESEARCH` receipt: `rev3f/exec/research-exec/gr7-exec-3f.md` (Lahomes 008/060, Kamr 038 `unchanged`; Rozetka "1 2 3 4 ... 100", 42px at 1440 and 32x34 at 390). No kickoff conflict.
- `CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` The GR-0 and GR-3a records are the kickoff's §18.16.3: EXTEND the canonical owner `MantinePagination.tsx` and the canonical Story `Mantine/Primitives/Pagination`; I re-opened `MantinePagination.tsx` and `Pagination.stories.tsx`; no new hardcoded visual value.
- `GR-1 CENSUS COMPLETE` for `ListingsShell.tsx`: `final/02_census.txt` lists only `ListingsShell.tsx` as FAIL (baselined container debt), exit 1 as expected.

### I0 and tests (red first)
`00_i0.txt` (the `ListingsSortBar.tsx` hash from 3e) and `00_i0_status_from_3e_final.txt` (the porcelain list at the end of 3e; `MantinePagination.*`, `Pagination.stories.tsx` and the smoke test were not in it). The R54 two-armed test: `01_red.txt` is the same test file run with the budget forced back to `Pagination.Root` (the pre-change measurement): 1 failed / 26 (`renders pages 1, 2 and 3 for total=3 inside a wide consumer wrapper`, received only "1"), exit 1; `02_green.txt`: 26 passed, exit 0.
Method note: I made the source edit before the red run and then temporarily restored the old `const parent = root` line, ran, and put the fix back. The restored file is the one in the gates.

### Changes
- R52 `MantinePagination.tsx`: `const root = row.parentElement; const parent = root?.parentElement ?? root`, observed by the existing `ResizeObserver`; the ladder, `computeShedRange`, the floor-first rule and the probe width are unchanged.
- R53 same file plus new `MantinePagination.module.css`: the row is `<Group gap="xs" wrap="nowrap" align="center" maw="100%" className={styles.row}>` and the probe is `pos="fixed" className={styles.probe}`. The module holds only `overflow: hidden` and `visibility: hidden; pointer-events: none`. `style={{` count in the file: 0.
- Existing jsdom tests that read inline `style` values (`row is flex-nowrap + overflow:hidden`, `the probe renders … pointer-events:none`) could not hold once the values moved into Mantine props and a module class, because jsdom loads no stylesheet. I changed those two assertions to check each declaration at its source (the Group CSS variables and `max-width`, the `_row_` / `_probe_` module class, the probe's inline `position: fixed`). The computed values are measured in the real browser in AC50 below. This is a change to assertions in a test file the kickoff lists; it is not a weakened gate, but Opus should look at it.
- R54 `Pagination.stories.tsx`: export `InCenteredGroup` (rows `total` 3 / 10 / 50 with `value` 1 / 1 / 25, each in `<Group justify="center">`); `MantinePagination.smoke.test.tsx`: the two-armed test (wrapper 1000px, root 100px, probe 32px).
- R56 `ListingsSortBar.tsx`: comment only.

### Gate block (`rev3f/exec/final/`, each ends `EXIT_CODE=`)
`win32`, Node v22.22.3; census 1 (expected); vitest (`MantinePagination.smoke`, `ListingsShellView.smoke`, `ListingsShellView.viewReset`, `ListingCard.smoke`) 0; `check:stories` 0; `check:story-coverage` 0; `check:design-tokens:strict` 0; `build-storybook` 0; `typecheck` 0; `lint` 0; `build` 0; `check:file-integrity` 0; `check:mojibake` 0; `check:backlog-active` 0. Hashes `14_hashes.txt`, status `15_status.txt`. Deviation from §18.16.6: I ran the gates from Git Bash (`node`, `npm`), not PowerShell with `node.exe` / `npm.cmd`, as in 3e; the `win32` transcript is `00_platform.txt`.

### AC49 probe (`probe-ac49.mjs` → `probe-ac49.json`, `.txt`; en 320/390/1440, uk 390/1440)
Visible page numbers (a control counts when it is not `position: fixed` and sits inside the row's box); no horizontal overflow in any cell:
- `ListingsShellView` `Default` and `LoadingMore`: "1 2 3" at 320, 390 and 1440 (en), and at 1440 (uk).
- `Mantine/Primitives/Pagination` `InCenteredGroup`: 1440: "1 2 3", "1 2 3 4 5 10", "1 24 25 26 50"; 390: "1 2 3", "1 10", "1 25 50"; 320: "1 2 3", "1 10", "1 25" (sheds, row 252 in a 288 wrapper).
- `Mantine/Primitives/Pagination` `Default`: unchanged from `rev3e/review/pagination-parent.json` (1440: "1 4 5 6 10", "1 24 25 26 50", "1 136 137 138 250", "1 2 3 4 5 10", "1 6 7 8 9 10", "1").
- `Patterns/Mantine/ListingsPagination` `Default`: "1 2 3 4 5" at 390 and 1440 for the 3/5/… page rows (320 sheds to "1 5" / "1 3" / "1 10").
- `AdminListingsView` `Paginated`: "1 2" at 320, "1 2 8" at 390, "1 2 3 4 5 8" at 1440. `AgentStatisticsView`: "1 2" (320–1440; "1 2 3" for `SortedByViews` at 390 and 1440). `AdminSurfacePattern` `Default`: "1 2 3".
- The 3e build's `pagination-parent.json` (floor only) is the red arm.

### AC50
`style={{` count in `MantinePagination.tsx`: 0; `check:design-tokens:strict` exit 0. Computed row styles on every paginator in `probe-ac49.json`: `display: flex`, `flex-wrap: nowrap`, `gap: 8px`, `overflow: hidden`, `max-width: 100%`; the probe: `position: fixed`, `visibility: hidden`, `pointer-events: none`.

### AC48 re-run on the 3f build (`probe-ac48.mjs` → `probe-ac48.json`, `.txt`)
`Default` en 390 and 1440: pagination controls `1,2,3,3` in the old probe's output, where the last "3" is the hidden probe; the three visible pages are "1 2 3" (AC49). Everything else equals the 3e run: 6 cards, 2 chips, "Show more" filled 14px 44px high, `LoadingMore` `data-loading` true, no 🏠.

### Receipts (`probe-receipts.mjs` → `probe-receipts.json`)
- `GR-9 REVIEW DEPTH` for `Mantine/Primitives/Pagination` (`Default`, `InCenteredGroup`), `Patterns/Mantine/ListingsPagination`, `ListingsShellView` `Default` / `LoadingMore`, `AdminListingsView` `Paginated`, `AgentStatisticsView` `Default`, `AdminSurfacePattern` `Default`: each paginator traced to `MantinePagination` (manifest yes, Story yes); non-canonical values: none left (the two `style` objects are gone); visible page numbers at 390 and 1440 as listed in AC49; claims checked: my 3e AC48 claim was wrong (F44) and is retracted; variant parity n/a; evidence `rev3f/exec/probe-ac49.json`.
- `GR-3b`: no horizontal overflow at 320/390/1024/1440 for all eight Stories above (`probe-receipts.json`, `overflow: false`).
- `GR-3c`: no text change; buttons 14px, no heading above 20px below 640 in the paginator Stories.
- `GR-3d`: `Mantine/Primitives/Pagination` (stories on `MantineStoryShell`, unchanged): 16 at 320 and 390, 49 at 1024 and 1440 on every side measured; `ListingsPagination` story: 16/16/24/24; `ListingsShellView`: left/right 16/16/32/32, none at 0. `AdminListingsView` `Paginated` reports negative left/bottom values (-320, -152): they come from table cells scrolled inside a horizontal-scroll container (my leaf-element measure), not from a gutter; the page itself does not overflow. I did not change these Story files.
- `GR-3e` n/a (no popup changed). `GR-3f` n/a (pagination controls are 8px-radius rounded squares).
- `GR-3g`: the paginator control's only ancestor with `overflow` other than visible is the row (`overflow: hidden`, radius 0), so there is no rounded clip (`gr3g@390`, `gr3g@1440`). The row's square clip is the Task 535 behaviour and was not changed.

### Files Changed
| Path | Change |
|---|---|
| `src/design-system/mantine/patterns/MantinePagination.tsx` | R52 budget from the consumer wrapper; R53 Group + module classes, no `style` object |
| `src/design-system/mantine/patterns/MantinePagination.module.css` | new: keyword-only `.row` and `.probe` |
| `src/stories/mantine/primitives/Pagination.stories.tsx` | R54: `InCenteredGroup` |
| `src/design-system/mantine/patterns/__tests__/MantinePagination.smoke.test.tsx` | R54: two-armed test; two assertions moved to their source (see Changes) |
| `src/modules/listings/components/ListingsSortBar.tsx` | R56: comment only |
| `docs/sessions/evidence/task741r3/rev3f/exec/` | new: GR-7 record, I0, red/green, gates, probes, receipts |
| `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md` | this section |
| `docs/backlog.md` | 741 state, one phrase (80 lines) |

### Not done / for Opus
- Owner matrix O46-3 (§18.15.10) and its §18.16.8 rows are the owner's step: `OWNER VISUAL QA REQUIRED` for `ListingsShellView` `Default` (390, 1440; en, uk) "‹ 1 2 3 ›"; `Mantine/Primitives/Pagination` `InCenteredGroup` and the existing exports (320, 390, 1440; en); `ListingsPagination`, `AdminListingsView`, `AgentStatisticsView` (390, 1440; uk).
- Gates ran from Git Bash, not PowerShell (see the gate block).
- Opus should look at the two changed existing assertions in `MantinePagination.smoke.test.tsx`.
- Keyboard focus ring at the row's square clip was not measured (not changed by 3f).
- Only the pages named in the GR-7 record were opened live; the library rows stand for the rest.

## Revision 3g

Kickoff §18.17 (only executable route; R57–R61, AC52–AC54, owner D46-8). Re-entry mode: remediation, on the current working tree. Evidence: `docs/sessions/evidence/task741r3/rev3g/exec/`. No consumer, Story file or other 3e/3f file is edited.

**RETRACTION (executor, R59 / F49).**
- **Invalid prior claim:** `rev3f/exec/00_i0.txt` was labelled an I0 and said "ListingsSortBar.tsx = rev3e hash".
- **Why invalid:** the hash it records, `174d8209…`, is the file after the R56 comment edit (`rev3f/exec/final/14_hashes.txt`); the 3e final hash is `ebb6709f…` (`rev3e/exec/final/15_hashes.txt`). So it was written after a 3f write, not before it. I ran the hash command after editing, and I did not take an I0 before the first 3f write.
- **Evidence:** the two hash files above.
- **Corrected status:** FACT. 3g's I0, `rev3g/exec/00_i0.txt`, was captured first: the line `2026-10-04T20:00:16+02:00`, then the three file hashes (`MantinePagination.tsx` `6679e4d1…`, `.module.css` `f3336cba…`, smoke test `c3ba9789…`, equal to the 3f finals) and the porcelain list. The mtimes of every 3g source file are later: `MantinePagination.smoke.test.tsx` 20:00:48, `MantinePagination.module.css` 20:01:10, `MantinePagination.tsx` 20:01:22 (`stat`). The only later change to `00_i0.txt` is stripping a UTF-8 BOM that PowerShell `Out-File` added (check:file-integrity flagged it); its content and timestamp are unchanged.

### GR-7 and canonical preflights
- `GR-7 REFERENCE RESEARCH` receipt: `rev3g/exec/research-exec/gr7-exec-3g.md`. One difference reported, not a conflict: I did not reproduce Kamr's ring on the page-number controls (computed `outline: 3px none`, no shadow); TailAdmin shows "Page 1 of 10" at 390 and a default outline ring at 1440. The choice (fill to width, D46-8; whole ring) is not contradicted.
- `CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` GR-0 and GR-3a records are the kickoff's §18.17.4 (EXTEND `MantinePagination`, REUSE the existing Pagination Stories); I re-opened `MantinePagination.tsx`, `.module.css` and `Pagination.stories.tsx`; no new hardcoded visual value, no Story file edited.
- `GR-1 CENSUS COMPLETE` for `ListingsShell.tsx`: `final/02_census.txt` lists only `ListingsShell.tsx` as FAIL (baselined container debt), exit 1 as expected.

### I0 and tests (red first)
`01_red.txt`: my new tests on the 3f source: 3 failed of 30 (the fill-range test, the seven-level ladder test, the 230px-wrapper component test), exit 1. `02_green.txt`: 30 passed, exit 0. `01b_r54_arm_red.txt`: with the budget line temporarily set back to `const parent = root` (restored afterwards; final hash `8e3246bd…`), 2 failed of 30 (the R54 three-page test and the R61 component test), so the R54 test still fails on the 3e budget line.

### Changes
- R57 `MantinePagination.tsx` / `.module.css`: the `Group` is `gap="xs" wrap="nowrap" align="center" maw="100%"` with no `className`; the module keeps only `.probe`. Rule 1's doc comment now states the by-construction bound (the estimate gives every control the probe's width and the edge controls and dots are never wider, so the estimate is at least the rendered width; the floor fits the narrowest wrapper) and that the row carries no `overflow: hidden`.
- R58: `computeFillRange` plus a `fill` argument on `computeShedRange`; `SHED_LEVELS` is the seven levels full, fill 3, fill 2, fill 1, drop siblings, drop trailing, floor. The measurement loop, `computeFullRange`, `computeAsymmetricRange`, the floor-first rule and the probe are unchanged.
- R60 / R61 `MantinePagination.smoke.test.tsx`: `afterAll` deletes the own `clientWidth` property when `HTMLElement.prototype` had no descriptor (otherwise re-defines it), and a following test asserts `Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')` is `undefined`; the fill-range cases, the seven-level order test and the 230px-wrapper component test (probe 32, gap 0, `total={10} value={1}` renders `1 2 3 10`) are added; the `_row_` class assertion is dropped.

### Gate block (`rev3g/exec/final/`, PowerShell with `node.exe` / `npm.cmd` via `cmd /c`, each ends `EXIT_CODE=`)
`win32`, Node v22.22.3; census 1 (expected); vitest (4 files) 0; `check:stories` 0; `check:story-coverage` 0; `check:design-tokens:strict` 0; `build-storybook` 0; `typecheck` 0; `lint` 0; `build` 0; `check:mojibake` 0; `check:backlog-active` 0. `11_file-integrity.txt` exited 1 on the BOM in my own `00_i0.txt` (and a later run on a UTF-16 `ALLDONE` marker); after fixing both, `11c_file-integrity-final.txt`: 480 files clean, exit 0. Hashes `14_hashes.txt`, status `15_status.txt`.

### AC52 / AC53 (`probe-ac52.mjs` → `probe-ac52.json`, `.txt`; `check-ac52-53.mjs` → `check-ac52-53.json`; en 320/390/1024/1440, uk 390/1440; 15 Stories × 6 = 90 cells)
- No document overflow in any of 90 cells; `row.scrollWidth <= row.clientWidth` on every row.
- Focus: 99 paginator controls Tab-focused (`InCenteredGroup`, `Default`, `ListingsPagination` `Default`, `ListingsShellView` `Default`, `AdminListingsView` `Paginated`, `AgentStatisticsView` `Default` at 390 and 1440). Ring 2px at offset 2px. 93 have no ancestor with non-visible overflow; for the other 6 the smallest room is 21px; 0 controls have any clipped side. 10× crops of the first and last control per Story and width are in `crops/` (names include the full Story id); `…in-centered-group-390-first-10x.png` shows the whole ring on four sides.
- Visible items: 390: 10 pages page 1 "‹ 1 2 3 … 10 ›", page 10 "‹ 1 … 8 9 10 ›", page 5 "‹ 1 … 5 … 10 ›", 50 pages page 25 "‹ 1 … 25 … 50 ›", 3 pages "‹ 1 2 3 ›"; 320: 10 pages page 1 "‹ 1 … 10 ›"; 1024 and 1440: every one of the 45 cells equals `rev3f/review-3f/review-probe.json`. `ListingsShellView` `Default` shows "‹ 1 2 3 ›" at 390 and 1440.
- Level check: for the 84 rows whose total and page I know from the Story source (`InCenteredGroup`, `Default`, `ListingsPagination` `Default`) the rendered items equal the first level in the ladder whose estimate fits the budget the probe records (independent copy of the item counts in `check-ac52-53.mjs`): 0 mismatches.

### Receipts
- `GR-9 REVIEW DEPTH` for `Mantine/Primitives/Pagination` (`Default`, `InCenteredGroup`), `Patterns/Mantine/ListingsPagination`, `ListingsShellView` `Default` / `LoadingMore`, `AdminListingsView` `Paginated`, `AgentStatisticsView` (8 exports), `AdminSurfacePattern` `Default`: each paginator traced to `MantinePagination` (manifest yes, Story yes); non-canonical props/values: none (the `Group` has no `style` or `className`); visible items at 320, 390, 1440 as listed above and in `probe-ac52.json`; claims checked: my 3e and 3f claims about the ring ("not measured") are superseded by AC52; evidence `rev3g/exec/probe-ac52.json`.
- `GR-3b`: no overflow at 320/390/1024/1440 for all 15 Stories (0 of 90).
- `GR-3c`: no text change.
- `GR-3d` (content edges, en, from `probe-ac52.json`): `Pagination` primitives on `MantineStoryShell` 16 at 320/390 and 49 at 1024/1440; `ListingsPagination` 16 / 24; `ListingsShellView` l/r 16 then 32, top 60 then 36 (content, none at 0); `AgentStatisticsView` 16 then 24; `AdminSurfacePattern` 16 then 24 (right 37 at 1024+); `AdminListingsView` `Paginated` l 12–20, b −152 at 1024+ (the shell navbar chrome and table cells in the scroll area, as the reviewer recorded; not a page gutter). No Story file changed; no side at 0.
- `GR-3e` n/a. `GR-3f` n/a (rounded squares).
- `GR-3g` (focus ring): AC52 above, with crops.

### Files Changed
| Path | Change |
|---|---|
| `src/design-system/mantine/patterns/MantinePagination.tsx` | R57 no row clip; R58 fill ladder; Rule 1 comment |
| `src/design-system/mantine/patterns/MantinePagination.module.css` | R57: `.row` removed, `.probe` kept |
| `src/design-system/mantine/patterns/__tests__/MantinePagination.smoke.test.tsx` | R57, R60, R61 |
| `docs/sessions/evidence/task741r3/rev3g/exec/` | new: I0, red/green, gates, probes, crops, GR-7 record |
| `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md` | this section |
| `docs/backlog.md` | 741 state, one phrase (80 lines) |

### Not done / for Opus
- Owner matrix O46-3 and its §18.17.9 rows are the owner's step: `OWNER VISUAL QA REQUIRED` for `ListingsShellView` `Default` (390, 1440; en, uk), `Mantine/Primitives/Pagination` `InCenteredGroup` and `Default` (320, 390, 1440; en), `ListingsPagination`, `AdminListingsView` `Paginated`, `AgentStatisticsView` (390, 1440; uk).
- The level check covers the 84 rows with known total and page; the remaining pagers (`AdminListingsView`, `AgentStatisticsView`, `AdminSurfacePattern`) are covered by the overflow, scroll and focus checks and by the 1024/1440 equality with 3f, not by the first-fit recomputation.
- `Omah` was not opened live for this subject (no paginator page relied on).
- The `ListingsShellView.stories.tsx` JSDoc and other 3e leftovers are unchanged.

## Revision 3h

Kickoff §18.19 (only executable route; R62–R68, AC55–AC59, owner D46-9, D90-1, rules GR-10 and GR-11). Re-entry mode: mixed (paginator corners remediate 3g; card unification is new work). Evidence: `docs/sessions/evidence/task741r3/rev3h/exec/`.

### GR-7 and canonical preflights
- `GR-7 REFERENCE RESEARCH` receipt: `rev3h/exec/research-exec/gr7-exec-3h.md`. Omah `/property-list` (toggle operated) and the Rozetka catalogue (both tile views) at 1440 and 390: the text styles are the same in both views; TailAdmin `/pagination` at DPR 1 and 1.25: unchanged. No kickoff conflict.
- `CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` GR-0 and GR-3a records are the kickoff's §18.19.5 (EXTEND `MantineListingCardPattern`, `theme.ts` one token, `pagination-chrome.css`; REUSE the three Stories). I read GR-10 and GR-11 (`docs/golden-rules.md`) before the first write.
- `GR-1 CENSUS COMPLETE` for `ListingsShell.tsx`: `final/02_census.txt` lists only `ListingsShell.tsx` as FAIL (baselined container debt), exit 1 as expected.

### I0 and tests (red first)
`00_i0.txt`: timestamp `2026-10-04T21:48:38+02:00`, then the hashes of the ten scope files, written with `[IO.File]::WriteAllText` (UTF-8, no BOM), before any 3h write. `01_red.txt`: the new parity tests and the flipped overlay test on the 3g tree: 5 failed of 12, exit 1. `02_green.txt`: the pattern and `ListingCard` suites, 35 passed, exit 0. Plant (AC55): with `fz={horizontal ? "lg" : undefined}` temporarily on the title, `03_plant_red.txt` shows 3 failed of 12, exit 1; `plant-hash-before.txt` and `plant-hash-after.txt` are both `1e14ef14…` (restore proven).

### Changes
- **R62/R63** `MantineListingCardPattern.tsx`: the six parts (`badges`, `overlay`, `photo-count`, `head`, `chips`, `footer`) are built once per render and placed by both layouts, each root with `data-card-part`. The layouts differ only in the arrangement (photo `Card.Section` on top, or a left column of `theme.other.layout.listingCardListThumb`) and in the favourite position (floating on the photo in grid, at the end of the head row in list). The overlay and the photo count render in both layouts; the photo count is bottom-right in both; the badges are a wrapping row top-left in both. No class ends in `List` or `Grid` (the layout classes are `horizontal` / `vertical`).
- **R64** both CSS modules carry no literal size, duration or colour (`design-tokens-allow` markers, `rem`, `ms`, `#…`, `rgba` all gone); positions are Mantine `pos` / `top` / `left` / `bottom` / `right` = `xs`; transitions use `var(--motion-duration-slow)` (`--motion-duration-base` for the title colour); the hover lift is `translateY(calc(var(--mantine-spacing-micro) * -1))` and the hover shadow `var(--mantine-shadow-lg)`; the photo count is a Mantine `Badge`; the contact section is `Card.Section withBorder`; `style={{` count in the pattern: 0. `theme.ts`: `layout.listingCardListThumb: { base: 128, sm: 176 }` and its type (the only `theme.ts` change). `ListingCard.module.css` keeps `.card`, `.cardVertical` and `.overlayFavorite` (`var(--mantine-shadow-xs)`); `.featureIcon` and `.inlineFavorite` are removed.
- **R65** `ListingCard.tsx` builds every shared node once for both variants (badges, overlay, features with `ListingFeatureIcon size={theme.other.iconSize.compact}`, price strings, one `footerActions`) and every secondary text is `c="dimmed"`; `muted-foreground` has 0 hits in the four files.
- **R66** the parity test in `MantineListingCardPattern.smoke.test.tsx` (open reduced, sold, premium; each `data-card-part` node's normalised HTML equal) and `parity-probe.mjs` (rendered, see below).
- **R67** `pagination-chrome.css`: the active control's border is `transparent`; edge controls get `box-shadow: var(--mantine-shadow-xs)`; a disabled control gets `opacity: 1` and the gray-4 text colour (border stays gray-300, `cursor: not-allowed` stays).

### Deviations and judgement calls (for Opus)
1. **`color="dark"` was refused by `check:stories`** (Check 15, unregistered Mantine colour). I used `color="gray.9"` (an opaque near-black shade of a registered colour) for the photo-count `Badge`. The first gate run is kept as `final/run1-before-gray9/` (`check:stories` and `build-storybook` exit 1, then the probe ran against a stale build and compared 0 parts); the final run is `final/`.
2. **Stories outside the kickoff's file list were edited** because they read classes this revision removed: `FavoriteButton.stories.tsx` (no more `styles.inlineFavorite`), `ListingFeatureIcon.stories.tsx` (no more `styles.featureIcon`; one icon path left), and in the in-scope `ListingCardPattern.stories.tsx` the footer actions are one node for both layouts and the list favourite carries no class. Without these, the Stories would have rendered unsized icons and lost their margins.
3. **Existing test assertions changed** (listed as §18.19.9 requires): `MantineListingCardPattern.smoke.test.tsx` — "does NOT render the overlay in list mode" became "renders the overlay in list mode too" (R63), and the structural test now ignores the inline `<style>` element Mantine adds for the responsive photo-column width.
4. The grid card's resting layout moved slightly: the head, chips and footer are nested `Stack`s with the same `tight` gap, the chips part carries a `Divider` instead of a `border-top`, and the price block is always a `Group`. The hover zoom keeps the measured 1.1025 on the vertical card and 1.05 on the horizontal one.
5. **GR-11 numbers for the card objects are incomplete.** The diagonal-coverage metric (hide the element and diff) is valid for the paginator controls, which are axis-aligned fills. For the card root (white fill, 1px border, over a photo), the pill badges, the rotated overlay label and the circular favourite it does not give a trustworthy number (the overlay label is rotated −8°; my measured values for these are in `corners.json` but I do not rely on them). For those I saved the DPR 1 and 1.25 crops, 10× pixelated, and looked at the card-root and paginator crops (smooth). The radius tokens are theme tokens, unchanged by 3h.
6. Gates ran from PowerShell with `node.exe` / `npm.cmd` (via `cmd /c`). `check:file-integrity` flagged BOMs that PowerShell `Add-Content -Encoding utf8` put into three small transcripts; I stripped them with Node and re-ran: `12b_file-integrity-after-bom-strip.txt`, 627 files clean, exit 0.

### Gate block (`rev3h/exec/final/`, each ends `EXIT_CODE=`)
`win32`, Node v22.22.3; census 1 (expected); vitest (5 files) 0; `check:stories` 0; `check:story-coverage` 0; `check:design-tokens:strict` 0; `build-storybook` 0; `parity-probe.mjs` 0; `typecheck` 0; `lint` 0; `build` 0; `check:mojibake` 0; `check:backlog-active` 0; the three `Select-String` searches print nothing (`15_select-css.txt`, `16_select-tsx.txt`, `17_select-muted.txt`); hashes `18_hashes.txt`, status `19_status.txt`.

### Parity probe (AC58) — `parity-probe.mjs` → `parity.json`
8 cells (two Stories × en/uk × 768/1440), 424 part comparisons, 0 differences: for every state and every `data-card-part`, the font-size, font-weight, line-height, color and letter-spacing of every text leaf equal in the grid and list card. On a build carrying the AC55 plant (`plant2-build-storybook.txt`, built to a scratch directory, file restored: `plant2-hash-before.txt` = `plant2-hash-after.txt` = `af18ff43…`): 88 differences, exit 1, first cell `patterns-mantine-listingcardpattern--default@en@768 state 1 part head` (`parity-red.json`, `parity-red.txt`).

### AC56 — overlay in the list photo column (`probe-3h.mjs` → `probe-3h.json`, `crops/ac56-*-10x.png`)
Both Stories, `uk`, 768 and 1440: every sold/rented list card shows its label inside the 176px photo column (*ПРОДАНО* 105px wide, 36px room each side; *ОРЕНДОВАНО* 133px wide, 21px room each side), 2px solid border, `rotate: -8deg`. No `BLOCKED — OVERLAY WIDTH`. At 640–767px the column is 176px as well; below 640 the list is not shown (D46-3).

### AC59 / GR-11 (`corner-check.mjs` → `corners.json`, `corners/`; 8px radius, DPR 1 diagonal coverage; ideal arc 60/75/60)
- Active page control: lero.al **54/85/54** against TailAdmin **54/85/54** (3g measured 37/50/38 by the owner-return probe). Same fill, a transparent border, opacity 1.
- Inactive control, hover: 53/93/53 against TailAdmin 54/85/54.
- Edge control, enabled (rest and hover): 41/45/43, equal to TailAdmin's 41/45/43.
- Edge control, disabled (page 1 "‹"): **41/45/43**, equal to the enabled one (3g: it faded to a vanishing corner); opacity 1, text gray-4, border gray-300.
- Focused active control: a whole 2px ring (`58/86/99` includes the ring pixels, informational).
Crops at DPR 1 and 1.25, 10×, for all of these are in `corners/`; I looked at the active control against TailAdmin's and at the card-root corner. `GR-11 CORNER CHECK` receipts:
- `GR-11 CORNER CHECK — MantinePagination active/rest: radius 8px (--pagination-control-radius); fill brand-7, border transparent; opacity 1; DPR 1 diagonal 54/85/54 vs reference 54/85/54; DPR 1.25 crop corners/lero-pagination-active-rest-dpr1.25-10x.png; reads as a smooth curve like the reference: yes.`
- `GR-11 CORNER CHECK — MantinePagination inactive/hover: radius 8px; fill gray-0, no border; opacity 1; DPR 1 diagonal 53/93/53 vs reference 54/85/54; DPR 1.25 crop corners/lero-pagination-inactive-hover-dpr1.25-10x.png; reads as a smooth curve like the reference: yes (diagonal match; crop saved, not individually viewed).`
- `GR-11 CORNER CHECK — MantinePagination edge/rest, edge/hover: radius 8px; white fill, 1px gray-300 border, shadow-xs; opacity 1; DPR 1 diagonal 41/45/43 vs reference 41/45/43; DPR 1.25 crops corners/lero-pagination-edge-enabled-{rest,hover}-dpr1.25-10x.png; reads as a smooth curve like the reference: yes (diagonal match; crops saved, not individually viewed).`
- `GR-11 CORNER CHECK — MantinePagination edge/disabled: radius 8px; white fill, 1px gray-300 border, text gray-4; opacity 1; DPR 1 diagonal 41/45/43 vs reference 41/45/43 (TailAdmin Previous on page 1); DPR 1.25 crop corners/lero-pagination-edge-disabled-dpr1.25-10x.png; reads as a smooth curve like the reference: yes (diagonal match; crop saved, not individually viewed).`
- `GR-11 CORNER CHECK — MantinePagination active/focus-visible: radius 8px; fill brand-7, 2px outline at 2px offset; opacity 1; DPR 1 diagonal 58/86/99 (ring included) vs reference n/a; DPR 1.25 crop corners/lero-pagination-active-focus-dpr1.25-10x.png; reads as a smooth curve like the reference: yes (looked at the crop; the diagonal number is not a like-for-like measure).`
- Card objects (card root grid and list, status badge, photo-count badge, overlay label grid and list, favourite button): crops at DPR 1 and 1.25 in `corners/lero-card-*`; radius tokens `md` (6px), pill and `2xl`; diagonal not measured reliably (see deviation 5). `GR-11 CORNER CHECK — card objects: radius theme tokens, unchanged by 3h; fill/border as before; opacity 1 except archived cards (0.6, unchanged); DPR 1 diagonal not measured reliably vs reference tailadmin-card; DPR 1.25 crops in corners/; reads as a smooth curve like the reference: yes for the card root and the paginator (looked), not verified numerically for the others.`

### AC52 / AC53 re-run (`probe-ac52.mjs` → `probe-ac52.json`, `check-ac52-53.json`)
Identical to 3g: 90 cells, 0 overflow, every `row.scrollWidth <= row.clientWidth`, 99 focused controls with 0 clipped sides, 84 of 84 ladder rows equal the first fitting level, 45 of 45 desktop cells equal 3f.

### Receipts
- `GR-9 REVIEW DEPTH — Patterns/Mantine/ListingCardPattern Default, Mantine/Primitives/ListingCard Default, Patterns/Mantine/ListingsShellView Default / ClosedTab, Mantine/Primitives/Pagination InCenteredGroup / Default: elements per card 9 (photo, badges, overlay, photo count, favourite, type, title, address, chips, price, per-m², id/date), each traced to MantineListingCardPattern (manifest yes, Story yes); non-canonical props/values: none left in the pattern, its module and ListingCard (searches empty); production states: open, new, reduced, premium, inactive, pending, sold, rented, archived, expired, no image in grid and list, en/uk → rendered all (424 part comparisons); unreachable shown: none; variant parity grid/list → 0 differences; executor claims checked: AC55–AC59 below; evidence rev3h/exec/.`
- `GR-10 CANONICAL MATCH — Patterns/Mantine/ListingsShellView (all exports) → ListingCard → MantineListingCardPattern: elements 9 per card; with canonical owner 9/9; matching the original 9/9 between layouts (original: one card for both views, Omah /property-list, Kamr ecom, Rozetka both tile views; parity-probe 424/424); missing or differing: NONE for the grid/list match. Not verified here: the card against the Rozetka tile part by part (918 §16.3 owns the reference rebuild).`
- `GR-10 CANONICAL MATCH — MantinePagination page controls: elements 4 (edge, inactive, active, dots); with canonical owner 4/4; matching TailAdmin /pagination 3/3 measured (active, edge, edge disabled); the dots control not compared; missing or differing: NONE for the measured controls.`
- `GR-3b`: no horizontal overflow at 320/390/768/1024/1440 for the six Stories in `probe-3h.json` and the 15 paginator Stories in `probe-ac52.json`.
- `GR-3c`: card title 14px, secondary text 12px, price 16px at all widths; the Story's own section titles 18px (24px at 1440) are unchanged; no heading above 20px below 640 in the card. 
- `GR-3d` (content edges): `ListingCardPattern` Story 24/16/37/16 at 320–390 and 24/32/37/32 at 1440 (`StoryPageGutter`); `Mantine/Primitives/ListingCard` 16 at 320/390 and 49 at 1440 (`MantineStoryShell`, the known exception); `ListingsShellView` 16/32; no side at 0; no Story gutter file changed.
- `GR-3e` (Save search modal, `gr3e-3h.json`, `gr3e-save-search-{390,1440}.png`): one text button (Cancel, subtle) beside the filled Save: stacked at 390, one row at 1440; the lone-text-button allowance applies; not changed by 3h.
- `GR-3f` (favourite button, circle): 32px box, radius 9999px; `crops/gr3f-favourite-dpr1-10x.png` and `…dpr1.25-10x.png`; the shadow is now `var(--mantine-shadow-xs)`. I did not open the crop with the image viewer beyond the card-root and paginator ones, so this is recorded as saved, not as looked at.
- `GR-3g`: the overlay label border is uncut in the 176px column (AC56 crops); the paginator focus ring is whole (AC52 crops).

### Files Changed
| Path | Change |
|---|---|
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | R62–R65: one source per part, no literals, no `style` objects |
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | R64: rewritten without literals |
| `src/modules/listings/components/ListingCard.tsx` | R65: one shared mapping for both variants, `c="dimmed"` |
| `src/modules/listings/components/ListingCard.module.css` | R64: `.featureIcon`, `.inlineFavorite` removed; shadow token |
| `src/design-system/mantine/theme.ts` | R64: `layout.listingCardListThumb` and its type |
| `src/design-system/mantine/pagination-chrome.css` | R67: round corners |
| `src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx` | R66a parity test; two assertions updated |
| `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` | one footer node, favourite class, comments |
| `src/stories/mantine/primitives/FavoriteButton.stories.tsx`, `ListingFeatureIcon.stories.tsx` | stopped reading removed classes (outside the kickoff's list, see deviation 2) |
| `docs/sessions/evidence/task741r3/rev3h/exec/` | new: I0, red/green/plant, gates, probes, corners, GR-7 |
| `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md` | this section |
| `docs/backlog.md` | 741 state, one phrase (80 lines) |

### Not done / for Opus
- **`OWNER VISUAL QA REQUIRED` (O46-4, §18.19.10):** `ListingsShellView` `Default` / `LoadingMore` / `ClosedTab` / `ClosedEmpty` / `Empty` (390, 1440; en, uk); `Mantine/Primitives/ListingCard` and `Patterns/Mantine/ListingCardPattern` (768, 1440; en, uk); `Mantine/Primitives/Pagination` `InCenteredGroup` / `Default` (320, 390, 1440; en); `ListingsPagination`, `AdminListingsView` `Paginated`, `AgentStatisticsView` (390, 1440; uk).
- GR-11 numeric coverage for the card objects (deviation 5) and a part-by-part comparison of the card with the Rozetka tile are not done; GR-3f's favourite crop was saved, not inspected.
- The photo-count badge is `gray.9` (deviation 1), an Opus-returnable decision.
- The `.listing-card` hover title colour uses `--text-color: var(--primary)`; I kept it as it was.
- `ListingsShellView`'s 3e/3f states were not re-probed; the shell Story ran the parity-neutral gates only.

## Revision 3i

Kickoff §18.20 (only executable route; R69–R73, AC60–AC62). Re-entry mode: remediation, on the current working tree. Evidence: `docs/sessions/evidence/task741r3/rev3i/exec/`. `rev3h/design/` and `rev3h/review/` were not written.

### GR-7 and canonical preflights
- `GR-7 REFERENCE RESEARCH` receipt: `rev3i/exec/research-exec/gr7-exec-3i.md`. Live this session: Omah `/property-list` (status badge `position: absolute`, on the photo) and the Rozetka catalogue (promo labels on the photo at its top-left corner, 1440 and 390). No kickoff conflict. The paginator and card-text records of 3h were not re-run (this revision does not change them) and the receipt says so.
- `CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` The GR-0 record is the kickoff's §18.20.2 (REUSE `resolveGalleryOffsetValue` from `GalleryNavActionIcon.tsx`, EXTEND `.archived`); I opened both before the first write. No new hardcoded value.
- `GR-1 CENSUS COMPLETE` for `ListingsShell.tsx`: `final/02_census.txt` lists only `ListingsShell.tsx` as FAIL, exit 1 as expected.

### I0 and tests (red first)
`00_i0.txt`: timestamp `2026-10-04T22:48:05+02:00` and the four file hashes, written with `[IO.File]::WriteAllText` (no BOM) before any 3i write. R73a: `01_red.txt`: the new offsets test fails 2 of 14 on the 3h source (`top` / `left` / `bottom` / `right` are empty because Mantine drops the invalid `top: xs`), exit 1; `02_green.txt`: 37 passed (pattern + `ListingCard` suites), exit 0. R73b: `badge-visible-probe.mjs` on the unchanged 3h `storybook-static` (still the 22:01 build; its source hash equalled the I0 hash): `01b_red_probe.txt` / `badge-visible-red-3h-build.json`: **226 of 226** badges and photo counts are hidden or outside their photo, exit 1.

### Changes
- **R69** `MantineListingCardPattern.tsx`: `const inset = resolveGalleryOffsetValue(theme, 'xs')`, imported from `./GalleryNavActionIcon`, used for the badge stack (`top`, `left`) and the photo count (`bottom`, `right`). Both render `var(--mantine-spacing-xs)`.
- **Overlay order (a finding of the probe, not in the kickoff).** With the offsets fixed, the first probe run on the 3i build still failed 26 of 226: the Sold and Rented badges were not topmost, because the overlay scrim (`Overlay`, `position: absolute`, inset 0) came after the badges in the DOM and painted over them (dimming them by the 30% scrim). I placed the overlay part before the badges and the photo count in both layouts (`{image}{overlayPart}{badgesPart}{photoCountPart}`), with a comment; the parts themselves are unchanged, so parity is unaffected. That first run is kept in `final/run1-before-overlay-order/`. This is a placement change inside the file R69 already scopes; Opus should look at it.
- **R70** `MantineListingCardPattern.module.css`: `.archived { filter: grayscale(1) }` loses `opacity`; `.archived .imageSection { opacity: 0.6 }` fades the photo only; the comment cites GR-11.
- **R72** `FavoriteButton.stories.tsx`: the two overlay photo stand-ins are the production `AppImage variant="listing"` (the canonical `MediaPlaceholder`, no source) inside a fluid `SimpleGrid cols={{ base: 1, sm: 2 }}`; the `Stack` gaps are `gap="tight"`. A search for `w={`, `h={`, `gap={4}` and `style={{` returns only `fw={500}` text props (the pattern `w={` also matches `fw={`); with `fw` excluded it returns nothing.
- **R73a** the offsets test in `MantineListingCardPattern.smoke.test.tsx`.

### Gate block (`rev3i/exec/final/`, PowerShell, `node.exe` / `npm.cmd`, each ends `EXIT_CODE=`)
`win32`, Node v22.22.3; census 1 (expected); vitest (5 files) 0; `check:stories` 0; `check:story-coverage` 0; `check:design-tokens:strict` 0; `build-storybook` 0; `parity-probe.mjs` (the 3h probe, output redirected to `rev3i/exec/parity.json` so the 3h evidence file stays untouched) 0: 424 comparisons, 0 differences; `badge-visible-probe.mjs` 0: 12 cells, 226 badges and photo counts, **0** hidden or outside their photo; `typecheck` 0; `lint` 0; `build` 0; `check:file-integrity` 0; `check:mojibake` 0; `check:backlog-active` 0; the three `Select-String` searches print nothing; hashes `18_hashes.txt`, status `19_status.txt`. The first complete run is `final/run1-before-overlay-order/` (`08b` exit 1, the overlay order above).

### AC60 / AC61 / AC62
- **AC60.** The R73 tests are red on 3h and green on the final tree (above). On the final build every badge and photo count across the four Stories × 390/768/1440 is topmost at its centre and inside its photo (0 of 226 failing). `shell-grid-1440.png` and `shell-list-1440.png` (`shell-shots.mjs`, re-shot by me and viewed) show "New" and "Price reduced" on the photos at the top-left (offset 8px, 8px) and the photo count at the bottom-right, in grid and list. Parity probe: 0 differences.
- **AC61.** The archived card root computes `opacity: 1` (`filter: grayscale(1)`, border `1px rgb(208,213,221)`), the photo `opacity: 0.6` (`shell-shots.json`, `primitive-archived-1440.png`).
- **AC62.** See R72 above. GR-3b for `Mantine/Primitives/FavoriteButton`: no overflow at 320/390/768/1024/1440 (`probe-fav.txt`).

### R71 / GR-11 corner check (`corner-check-r71.mjs` → `corners-r71.json`, `corners/`)
In the browser only (`page.addStyleTag`, never in source) the photo gets a flat fill and the overlay label is un-rotated. For each object, in grid and list, DPR 1 and 1.25 crops at 10× are saved. The metric is the corner's area ratio: the sum of the per-pixel coverage over the r × r corner square divided by r², in percent, where an ideal quarter circle gives 78.5.
- **Filled objects, within 10 points of the ideal arc.** Status badges (r 12): grid New 72.6, Price reduced 72.1, Sold 76.3, Rented 77.4, Archived 75.6, Expired 77.3, Inactive 79.5, Pending 79.4; list 77.2–83.5. Photo count: grid 81.2, list 75.9. Grid favourite 78.0. TailAdmin's badge (r 10) measures 63.4 by the same method, so my badges are 9–20 points rounder-fuller than that reference by this metric; I treat the ideal arc as the target there.
- **Not within 10 points by the metric, judged by eye.** The grid card root (39.5), grid premium (21.6), grid archived (23.0), the overlay label (65.8 grid, 66.4 list), and the list favourite (33.6). The numbers are not a corner defect: the flat-fill style did not take on the grid card's photo (its corner area is a light border ring over a light photo), a 1px border ring has low coverage by construction, the label's translucent fill with a solid 2px border lowers the sum, and the list favourite is a ghost icon button with no shape (33.6 is the heart glyph). Instead I **viewed** these crops: list card root (rest), grid card root (rest), grid archived (rest), the grid overlay label, the Sold badge, the list favourite. Each shows a smooth rounded corner (or, for the favourite, no corner at all). I did not view the premium, hover, rented, expired and other badge crops one by one, so those rest on the metric.
- The kickoff's reference for the card (TailAdmin `/cards`) was not found by my selector (`tailadmin-card` is absent from `corners-r71.json`), and the Rozetka tile was not measured with this probe. So there is no card-root reference number; AC61's "within 10 points of its reference" is **not met numerically** for the card roots. Opus should decide whether the viewed crops suffice or ask for a better probe.
- Archived: the root now keeps full-contrast corners (`opacity: 1`); the photo is faded.
`GR-11 CORNER CHECK — card status badges (8 colours, grid and list): radius pill (h/2 = 12px); fill theme colour, no border; opacity 1; DPR 1 area ratio 72–84 vs reference ideal arc 78.5 (TailAdmin badge 63.4); DPR 1.25 crops corners/lero-card-{grid,list}-badge-*-dpr1.25-10x.png; reads as a smooth curve like the reference: yes by the metric; the Sold crop viewed.`
`GR-11 CORNER CHECK — photo-count badge (grid, list): radius pill; fill gray.9; opacity 1; area ratio 81.2 / 75.9 vs ideal 78.5; crops saved; smooth: yes by the metric (not viewed).`
`GR-11 CORNER CHECK — overlay label (grid, list): radius 2xl (clamped to h/2); fill status colour at 80%, 2px solid border; opacity 1; area ratio 65.8 / 66.4 (not within 10 of the ideal; see above); crops saved; reads as a smooth curve: yes (grid crop viewed).`
`GR-11 CORNER CHECK — card root (grid rest/hover/premium/archived, list rest/hover/archived): radius md (6px); 1px gray-300 border, white fill; opacity 1 (archived root fixed from 0.6); area ratio not reliable (grid 39.5/21.6/23.0, list 86.4/88.3); reference not measured; crops saved; smooth: yes (list rest, grid rest and grid archived crops viewed; the others not).`
`GR-11 CORNER CHECK — favourite button (grid overlay, list inline): grid 32px circle, radius 9999px, shadow-xs, opacity 1, area ratio 78.0 vs ideal 78.5; list inline button has no shape (ghost icon), crop viewed; smooth: yes.`

### AC52 / AC53 re-run (`probe-ac52.mjs` → `probe-ac52.json`, `check-ac52-53.json`)
Identical to 3g and 3h: 90 cells, 0 overflow, every row scrollWidth within clientWidth, 99 focused controls with 0 clipped sides, 84 of 84 ladder rows equal the first fitting level, 45 of 45 desktop cells equal 3g.

### AC56 re-check (`probe-3i.mjs` → `probe-3i.json`)
Both card Stories, `uk`, 768 and 1440 (the overlay now precedes the badges): the sold/rented labels are inside the 176px column, *ПРОДАНО* 105px (36px room each side), *ОРЕНДОВАНО* 133px (21px room each side), 2px border.

### Receipts
- `GR-9 REVIEW DEPTH — Patterns/Mantine/ListingCardPattern Default, Mantine/Primitives/ListingCard Default, Patterns/Mantine/ListingsShellView Default / ClosedTab, Mantine/Primitives/FavoriteButton, Mantine/Primitives/Pagination InCenteredGroup: elements per card 9 parts, each traced to MantineListingCardPattern; non-canonical props/values: the invalid top/left/bottom/right="xs" (R69, fixed) and the .archived opacity (R70, fixed), searches empty; production states open, new, reduced, premium, inactive, pending, sold, rented, archived, expired, no image in grid and list → badges visible on screen in all (226/226); unreachable shown: none; variant parity grid/list 424/0; executor claims checked: AC60–AC62 above, and my 3h claim "badges in both layouts" was wrong in the browser (F57); evidence rev3i/exec/.`
- `GR-10 CANONICAL MATCH — Patterns/Mantine/ListingsShellView → ListingCard → MantineListingCardPattern: elements 9 per card; with canonical owner 9/9; matching the original 9/9 between layouts (parity 424/0, badges visible); missing or differing: NONE for grid/list. Not verified: the card against the Rozetka tile part by part (Task 918).`
- `GR-3b`: no horizontal overflow at 320/390/768/1024/1440 for the six Stories in `probe-3i.json`, `FavoriteButton` in `probe-fav.json` and the 15 paginator Stories in `probe-ac52.json`.
- `GR-3c`: unchanged from 3h (card title 14px, secondary 12px, price 16px).
- `GR-3d`: unchanged from 3h (`ListingCardPattern` Story 24/16/37/16 then 24/32/37/32; `Mantine/Primitives/ListingCard` 16 then 49; `ListingsShellView` 16/32; `FavoriteButton` 16 then 49; no side at 0).
- `GR-3e` (Save search, `gr3e-3i.json`): one text button (Cancel, subtle) beside the filled Save, stacked at 390 and in one row at 1440; the lone-text-button allowance applies.
- `GR-3f` (favourite): 32px, radius 9999px; crops `crops/gr3f-favourite-dpr{1,1.25}-10x.png`; the grid favourite's area ratio is 78.0 and the list one is a ghost icon. I viewed the list favourite crop.
- `GR-3g`: the overlay label border is uncut in the 176px column (AC56); the paginator focus ring is whole (AC52).

### Files Changed
| Path | Change |
|---|---|
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | R69 offsets via `resolveGalleryOffsetValue`; overlay placed before badges |
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | R70 archived fade on the photo only |
| `src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx` | R73a offsets test |
| `src/stories/mantine/primitives/FavoriteButton.stories.tsx` | R72 production photo frame, theme gaps |
| `docs/sessions/evidence/task741r3/rev3i/exec/` | new: I0, red/green, gates, probes, corners, GR-7 |
| `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md` | this section |
| `docs/backlog.md` | 741 state, one phrase (80 lines) |

### Not done / for Opus
- **`OWNER VISUAL QA REQUIRED` (O46-4, §18.19.10 and §18.20.7):** `ListingsShellView` `Default` / `LoadingMore` / `ClosedTab` / `ClosedEmpty` / `Empty` (390, 1440; en, uk); `Mantine/Primitives/ListingCard` and `Patterns/Mantine/ListingCardPattern` (768, 1440; en, uk), with the badges on the photo in grid and list; `Mantine/Primitives/Pagination` (320, 390, 1440; en); `ListingsPagination`, `AdminListingsView` `Paginated`, `AgentStatisticsView` (390, 1440; uk).
- AC61 is met for the archived root (`opacity: 1`) and for the filled objects by the metric, **not numerically met** for the card roots and the overlay label (see the corner section); I viewed six crops and not the rest. A card-root reference (TailAdmin `/cards`, Rozetka tile) was not measured.
- The overlay-before-badges placement (above) is an addition to R69.
- The photo-count colour stays `gray.9` (Opus decision, F61).


## Revision 3j

Task path: `tasks/Archive/Sprint_46_kickoff_prompt_Task_741_ClosedOverlayStyleModuleExit.md` §18.21. Evidence: `docs/sessions/evidence/task741r3/rev3j/exec/` (gate transcripts in `final/`). Executor: Sonnet 5.5, win32, Node v22.22.3, 2026-10-05.

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

`GR-0 CANONICAL REUSE PREFLIGHT — request: archived fade on the photo node only; semantic queries: archived, imageSection, opacity, first-child; inspected candidates: MantineListingCardPattern.module.css .archived, MantineListingCardPattern.tsx photo sections (both Card.Section blocks); decision: EXTEND; selected canonical owner: src/design-system/mantine/patterns/MantineListingCardPattern.module.css; Mantine/TailAdmin token path: NONE (the existing unitless opacity moves selector); new hardcoded visual values: NONE; rationale: image is the photo section's first child in both layouts, so a child selector fades it alone and no wrapper is added.`

`GR-7 REFERENCE RESEARCH — moment: execution (741 Revision 3j); role: Sonnet; task: 741; subject: archived card look, card-chrome corners; library: docs/research/references/2026-10-04 (rows unchanged); live-checked pages: Lahomes /property-grid (Sold card), TailAdmin /cards, TailAdmin /badge, at 1440 and 390, full-page shots; inspected: Lahomes Sold label, photo and card all effective opacity 1, filter none; TailAdmin card 12px, 1px rgb(228,231,236), opacity 1; TailAdmin badges pill, opacity 1; result: unchanged, no BLOCKED — GR-7 KICKOFF CONFLICT; chosen: archived fade on the photo only, never on badges, photo count, label or favourite; evidence: rev3j/exec/research-exec/ (gr7-exec-3j.mjs/.json/.md, shots/). Not re-opened in this revision: Kamr and Omah (kickoff §18.21 names only the three pages above; library rows relied on).`

### I0, red, green
- I0 `00_i0.txt` (before any source write; the worktree was already dirty with earlier revisions and unrelated files).
- Red 1 `01_red.txt`: archived-opacity-probe on the unchanged 3i build: exit 1, 20 failures (badges, photo count, favourite at 0.6).
- Red 2 `01b_red_plant.txt`: corner-twin-probe `--plant` on the same build: exit 1, names the planted `grid-badge-new` (opacity 0.4) and `grid-photo-count` (same-colour border).
- Green (final build): `final/08c` exit 0 (8 archived cards, 0 failures); `final/08d` exit 0 (0 failures, 33 size checks ok); `final/08e` (`--plant`) exit 1 naming both planted objects.

### R74 / R75 / R76
- R74: `.archived .imageSection > :first-child { opacity: 0.6 }` in `@layer utilities`, comment updated. `MantineListingCardPattern.tsx` keeps `{image}` first in both layouts; one comment line in each of the two `Card.Section` blocks (kickoff says "a one-line comment"; two layouts, so two lines). No wrapper added.
- R75: `corner-twin-probe.mjs`. Each DPR in its own context; DPR 1.25 crops are 1.25x the DPR 1 size (33/33). Twin = a plain fixed `<div>` with the object's width, height, radius, border, background, box-shadow, filter, opacity 1, in the browser only. Points = 100*sum/n^2 over the n x n corner square, normalised by the twin's straight-edge contrast. GR-11 style checks are added to the pixel metric: effective opacity must be 1, and no same-colour border on a fill (exact colour string). Live references: TailAdmin `/cards` card and `/badge` pill, saved as `corners/ref-*`, not scored. Contact sheets `corners-sheet-dpr1.png`, `corners-sheet-dpr1.25.png`.
- R76: `archived-opacity-probe.mjs`, both card Stories, 390 and 1440.
- Design note for Opus: normalising by the object's own contrast would hide a uniform fade, so F comes from the twin. A same-colour border is invisible in pixels at border-box sizing, so it is caught by the computed-style check.

### Gates (`final/`, each ends `EXIT_CODE=`)
00 win32; 01 v22.22.3; 02 census exit 1, FAIL only `ListingsShell.tsx`; 03 vitest 5 files / 75 tests pass; 04 check:stories 0; 05 story-coverage 0; 06 design-tokens:strict 0; 07 build-storybook 0; 08 parity 8 cells, 424 comparisons, 0 differences; 08b badge-visible 0 failing; 08c/08d 0; 08e 1 (expected); 09 typecheck 0; 10 lint 0; 11 build 0; 12 file-integrity 0; 13 mojibake 0; 14 backlog-active 0; 15–17 Select-String print nothing; 18 hashes; 19 status. The PreToolUse hook blocks a nested `run-gates.ps1`, so each command was run directly with the same transcript names; `final/run-gates.ps1` is kept as the plan and was not executed.

### Acceptance criteria
- AC63: red on 3i (20 failures), green on the final build (0). `primitive-archived-1440.png` re-shot and viewed: the *Archived* badge, the photo count and the favourite are full contrast on a faded grey photo.
- AC64: twin probe exit 0 / `--plant` exit 1 naming both objects; size check 33/33; both contact sheets viewed (very tall, so I viewed them downscaled; the 10x detail is in the individual crops under `corners/`). Rows to look at: the card-root rows have radius 6px beside TailAdmin's 12px (they match their own twin; the radius is a decision for Opus/owner, not changed here). The TailAdmin card reference crop shows a stray blue corner of a neighbouring element (reference saved, not scored). The list favourite paints white 80% on a white info column, so its coverage is 0 by construction (measured, not n/a).
- AC65: badge-visible 0 failing, parity 0 differences, R73a test green (03).

### Receipts
GR-3b/3c/3d/3e/3f/3g, GR-9 and GR-10: unchanged from 3i (`rev3i/exec/final`, `gr3e-3i.*`, `probe-3i.*`, `probe-fav.*`); R74 changes only which node carries the archived opacity and touches no width, text size, gutter, text button, circle geometry or focus ring. GR-3f favourite crops: `corners/grid-favourite-dpr1-object.png` / `-twin.png`.

### GR-11 corner receipts (one per object and state; twin numbers in place of a reference)
GR-11 CORNER CHECK — card-grid-root-rest: r 6px; DPR1 object 25.8 / twin 25; DPR1.25 object 31.4 / twin 30.5; opacity 1; border 1px solid rgb(208, 213, 221); within 10 points: true.
GR-11 CORNER CHECK — card-list-root-rest: r 6px; DPR1 object 25.8 / twin 25.1; DPR1.25 object 36.2 / twin 38; opacity 1; border 1px solid rgb(208, 213, 221); within 10 points: true.
GR-11 CORNER CHECK — card-grid-premium-rest: r 6px; DPR1 object 22 / twin 21.8; DPR1.25 object 21.4 / twin 24; opacity 1; border 1px solid oklch(0.7 0.162 65); within 10 points: true.
GR-11 CORNER CHECK — card-grid-archived-rest: r 6px; DPR1 object 25.4 / twin 25; DPR1.25 object 32.1 / twin 31.4; opacity 1; border 1px solid rgb(208, 213, 221); within 10 points: true.
GR-11 CORNER CHECK — card-list-archived-rest: r 6px; DPR1 object 25.4 / twin 25.2; DPR1.25 object 27.4 / twin 31.2; opacity 1; border 1px solid rgb(208, 213, 221); within 10 points: true.
GR-11 CORNER CHECK — card-grid-root-hover: r 6px; DPR1 object 31.2 / twin 29.8; DPR1.25 object 38.3 / twin 37.8; opacity 1; border 1px solid rgb(208, 213, 221); within 10 points: true.
GR-11 CORNER CHECK — card-list-root-hover: r 6px; DPR1 object 31.1 / twin 29.7; DPR1.25 object 43 / twin 41.6; opacity 1; border 1px solid rgb(208, 213, 221); within 10 points: true.
GR-11 CORNER CHECK — grid-badge-new: r 12px; DPR1 object 72.6 / twin 78.3; DPR1.25 object 79.2 / twin 85.8; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — grid-badge-price-reduced: r 12px; DPR1 object 72.1 / twin 78.3; DPR1.25 object 73.7 / twin 80.3; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — grid-badge-sold: r 12px; DPR1 object 76.3 / twin 78.3; DPR1.25 object 84.2 / twin 84.3; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — grid-badge-rented: r 12px; DPR1 object 77.4 / twin 78.4; DPR1.25 object 86.3 / twin 84.4; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — grid-badge-archived: r 12px; DPR1 object 75.2 / twin 78.3; DPR1.25 object 81.9 / twin 84.4; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — grid-badge-expired: r 12px; DPR1 object 72.5 / twin 78.3; DPR1.25 object 77.4 / twin 84.5; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — grid-badge-inactive: r 12px; DPR1 object 73.4 / twin 78.3; DPR1.25 object 81.6 / twin 84.5; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — grid-badge-pending: r 12px; DPR1 object 73.3 / twin 78.3; DPR1.25 object 81.7 / twin 84.5; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — grid-photo-count: r 12px; DPR1 object 75.7 / twin 78.3; DPR1.25 object 79.4 / twin 82; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — grid-overlay-label-sold: r 16px; DPR1 object 65.8 / twin 66; DPR1.25 object 69.8 / twin 70.4; opacity 1; border 2px solid oklch(0.577 0.174 240); within 10 points: true.
GR-11 CORNER CHECK — grid-overlay-label-rented: r 16px; DPR1 object 66.4 / twin 66.1; DPR1.25 object 66.2 / twin 66.8; opacity 1; border 2px solid oklch(0.577 0.174 295); within 10 points: true.
GR-11 CORNER CHECK — grid-favourite: r 16px; DPR1 object 71 / twin 77.6; DPR1.25 object 75.2 / twin 82; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — grid-favourite-hover: r 16px; DPR1 object 77.3 / twin 77.7; DPR1.25 object 80.1 / twin 80.5; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — list-badge-new: r 12px; DPR1 object 78.1 / twin 78.4; DPR1.25 object 86.9 / twin 84.5; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — list-badge-price-reduced: r 12px; DPR1 object 78.1 / twin 78.3; DPR1.25 object 78.9 / twin 78.9; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — list-badge-sold: r 12px; DPR1 object 78.2 / twin 78.2; DPR1.25 object 84.8 / twin 84.3; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — list-badge-rented: r 12px; DPR1 object 78.2 / twin 78.2; DPR1.25 object 83.8 / twin 84.2; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — list-badge-archived: r 12px; DPR1 object 77.5 / twin 78.4; DPR1.25 object 85.5 / twin 84.6; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — list-badge-expired: r 12px; DPR1 object 76.9 / twin 78.4; DPR1.25 object 84.6 / twin 83.4; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — list-badge-inactive: r 12px; DPR1 object 78.4 / twin 78.4; DPR1.25 object 87.1 / twin 84.5; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — list-badge-pending: r 12px; DPR1 object 77.2 / twin 78.4; DPR1.25 object 85.2 / twin 84.4; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — list-photo-count: r 12px; DPR1 object 75.9 / twin 78.4; DPR1.25 object 83 / twin 85.7; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — list-overlay-label-sold: r 16px; DPR1 object 66.4 / twin 66; DPR1.25 object 74 / twin 72.6; opacity 1; border 2px solid oklch(0.577 0.174 240); within 10 points: true.
GR-11 CORNER CHECK — list-overlay-label-rented: r 16px; DPR1 object 66.2 / twin 65.7; DPR1.25 object 65.7 / twin 65.3; opacity 1; border 2px solid oklch(0.577 0.174 295); within 10 points: true.
GR-11 CORNER CHECK — list-favourite: r 16px; DPR1 object 0 / twin 0; DPR1.25 object 0 / twin 0; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.
GR-11 CORNER CHECK — list-favourite-hover: r 16px; DPR1 object 0 / twin 0; DPR1.25 object 0 / twin 0; opacity 1; border 1px solid rgba(0, 0, 0, 0); within 10 points: true.

### Files Changed
| Path | Reason |
|---|---|
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | R74 selector and comment |
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | R74 order comments (two lines) |
| `docs/sessions/evidence/task741r3/rev3j/exec/` | new: probes, red/green, gate transcripts, crops, sheets, research |
| `docs/sessions/2026-10-04-task741r3-closed-status-hardcode-exit.md` | this section |
| `docs/backlog.md` | 741 state, 80 lines (count unchanged) |

The parity and badge-visible probes were pointed at `rev3j/exec/` by `PARITY_OUT` / `BADGE_OUT` environment variables; the 3h/3i scripts are not edited.

OWNER VISUAL QA REQUIRED (O46-4, §18.19.10 / §18.20.7 / §18.21.7), same tuples; in row 2 also check an archived card's *Archived* badge and photo count at full contrast on the faded photo. Not marked passed by the executor.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.
