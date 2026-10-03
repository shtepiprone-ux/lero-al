# Task 912 — a price is struck through only for a real reduction (session log, 2026-10-03)

Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**. Evidence: `docs/sessions/evidence/task912/`.
Executor preflight: `CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`
Kickoff amended 2026-10-03 (D89-9): the struck old price sits **above** the current price; implemented that way. Price colour untouched (918's).

## Files Changed

| Path | Change |
|---|---|
| `src/design-system/mantine/patterns/MantineListingContactPattern.tsx` | `priceOld?: string` on the price info; struck `xs dimmed` line above the main price; `td="line-through"` removed from the converted-currency line |
| `src/modules/listings/components/ListingContact.tsx` | one prop `priceOld?: number`, formatted and forwarded. Nothing else |
| `src/modules/listings/components/ListingDetailView.tsx` | one prop on `LazyListingContact`: `priceOld={isPriceReduced && displayPriceOld != null ? displayPriceOld : undefined}` |
| `src/modules/listings/components/ListingCard.tsx` | `isListingPriceReduced()`; used by `getBadges` and both `priceOld` sites |
| `src/stories/patterns/mantine/ListingContactPattern.stories.tsx` | `Default`: first ("normal") section gets `priceReduced`; shared `originalPrice` now `card_price_1` |
| `src/design-system/mantine/patterns/__tests__/MantineListingContactPattern.smoke.test.tsx` | new (a)(b)(c) |
| `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` | 5 new cases (grid/horizontal × equal/below; converted reduced) |
| `docs/backlog.md` | 912's row only |
| `docs/sessions/evidence/task912/` | transcripts, measurement script and JSON |

`docs/critical-flow-registry.md` **not edited** (§10.6): `git status` shows it modified by 868's work at I0.
Other entries that appear in `git status` after the run (task857 evidence, Sprint 78 files, `MantineNavRowList.module.css`, etc.) are Task 857's concurrent work, not 912's (`42-status-after.txt` vs `00-status-before.txt`).

### Registry addition owed

Rows `docs/critical-flow-registry.md:62` and `:63` should list, as added regression evidence:
`src/design-system/mantine/patterns/__tests__/MantineListingContactPattern.smoke.test.tsx` and the new `Task 912` cases in `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx`.

## Requirements

R1 ✔ · R2 ✔ · R3 ✔ (one predicate) · R4 ✔ (existing `:142`/`:251` cases unchanged and green) · R5 ✔ (registry vitest equal to I0, 54/54) · R6 ✔ (plants) · R7 ✔ · R8 ✔ · R9 ✔.

## Commands

| Command | Exit |
|---|---|
| `node -p process.platform` | 0 — `win32` |
| I0 hashes | equal F11 (`00-i0.txt`) |
| I0 registry vitest (54) / card+detail-view vitest (19) | 0 / 0 |
| final card + pattern + detail-view vitest (27) | 0 |
| final registry vitest (54) | 0 |
| `npm run typecheck` / `lint` | 0 / 0 |
| `check:story-coverage` / `check:rendered-scope` / `check:mojibake` | 0 / 0 / 0 |
| `npm run check:design-tokens` | **1** — see below |
| `npm run build` | **0** |
| `npm run build-storybook` | 0 |

**I0 vs final vitest:** I0 had no failing case (the archived-badge cases were green on this tree); final has the same pass set plus the new cases, 0 failures.

### `check:design-tokens` red — not 912's

One finding: `src/design-system/mantine/patterns/MantineNavRowList.module.css:24 "box-shadow: 1px"`. The file is untracked (`??`), i.e. Task 857's new work. None of 912's files is named (`22-check:design-tokens.txt`).

## Plants (AC5) — `10-plants.txt`

Post-fix hashes: pattern `aa9fcd0d…`, card `8b514185…`.

| Plant | Fails | Restored hash |
|---|---|---|
| A: `td="line-through"` back on the disclosure | pattern (a), (b) | `aa9fcd0d…` (equal) |
| C: old-price render disabled | pattern (a) | `aa9fcd0d…` (equal) |
| B: `displayPriceOld ?` at both card sites | 4 Task 912 grid/horizontal cases | `8b514185…` (equal) |

## Rendered measurements — `31-measure.json`, `measure.mjs`

Built Storybook, served statically, Chromium at `deviceScaleFactor` 1. `en` at 320/390/768/1024/1440; `sq`, `uk`, `it` at 320/1440 (uk@320 included). No horizontal page overflow in any of the 33 runs.

**Price block** (identical in every locale/width; only the label text translates):

- `ListingContactPattern/Default` "normal": `€92,000` struck 12px → `€80,000` 20px → `Original price: €80,000` plain 12px.
- "loading" section: `€80,000` 20px → plain disclosure 12px; nothing struck.
- `ListingDetailView/PublicListing` contact card: `138,000 EUR` struck 12px above `125,000 EUR` 20px (AC9).
- `ListingDetailPattern/Default` contact card: `€80,000` 20px → `Original price: €92,000` plain 12px (blast-radius row).

**Edges (top/right/bottom/left px), measured on text/control leaves and card roots; media (carousel slides, map tiles) excluded as clipped:**

- `ListingContactPattern/Default`: 24/16/24/16 at 320 and 390; 24/444/24/24 at 768; 24/592/24/32 at 1024; 24/949/24/32 at 1440. The card is 288 px wide at 320 and 459 px at 1440 (4/12 of 1376 − 32), matching the production sidebar span.
- `ListingDetailPattern/Default`: 416/16/24/16 at 320 (top is the gallery height) down to 104/32/24/32 at 1440.
- `ListingDetailView/PublicListing`: 34/32/80/32 at 320 … 34/96/80/96 at 1440 (production `ListingsPageFrame`).
- No side is 0 anywhere.

**Note:** the kickoff predicts `ListingsPageFrame` `px: base 'md'` at 320; the render measures 32 px. I did not investigate; the side is non-zero.

Receipts:

- `GR-3b STORY RESPONSIVE CHECK — ListingContactPattern/Default: no fixed width in the Story; card sits in Grid.Col span {base 12, md 5, xl 4}; widths 288/288/300/…/459 at 320/390/768/…/1440; no overflow.` Same for `ListingDetailPattern/Default` and `ListingDetailView/PublicListing` (Stories unchanged apart from fixtures).
- `GR-3c TYPE RESPONSIVE CHECK — price block: main 20px (xl), old price 12px (xs), disclosure 12px (xs) at 320/390/768/1024/1440 (en) and 320/1440 (sq/uk/it). No changed text ≥24px; the contact pattern has no heading.`
- `GR-3d STORY GUTTER CHECK — ContactPattern 24/16/24/16 @320, 24/…/32 @1440 (StoryPageGutter present); DetailPattern 24 bottom, 16/32 sides; DetailView own gutter 32…96. No side at 0.`

## Receipts

- `GR-0 CANONICAL REUSE PREFLIGHT` — decision EXTEND, owner `MantineListingContactPattern.tsx`, token path `fontSizes.xs`, `c="dimmed"`, `td="line-through"` (card pattern idiom); new hardcoded visual values: NONE (kickoff §3.3, re-verified against the three inspected patterns).
- `GR-3a STORY PREFLIGHT` — EXTEND of `Patterns/Mantine/ListingContactPattern` → `Default`; no new Story or export.
- `GR-3 STORY PROVEN — MantineListingContactPattern ← src/stories/patterns/mantine/ListingContactPattern.stories.tsx`.
- `GR-1` censuses (`40-censuses.txt`):
  - `MantineListingContactPattern.tsx` → `GR-1 CENSUS COMPLETE — 1 nodes; tier1 1 migrated+enrolled+story; tier2 0 …`.
  - `ListingCard.tsx` → `GR-1 CENSUS COMPLETE — 7 nodes; tier1 7 migrated+enrolled+story …`.
  - `ListingContact.tsx` → BLOCKED on exactly the §3.1 set: `ListingInquiryDialog`, `ListingReportDialog` + tier-2 `button/dialog/input/label/textarea` (owner 795).
  - `ListingDetailView.tsx` → BLOCKED on exactly the §3.1 set: `MapWrapper`, `GalleryIsland`, `GalleryStaticFrame`, `ListingReportDialog`, `ListingShareButton`, `RecentlyViewedSection/Tracker/Grid`, `SimilarListings`, `ViewTracker`, `ClearRecentlyViewedButton`, `ViewAllLink` + tier-2 primitives. Nothing new.

## Final hashes (`41-hashes.txt`)

pattern `aa9fcd0d…` · ListingCard `8b514185…` · ListingContact `259f0481…` · ListingDetailView `f29076bb…` · Story `9d2a5d25…` · pattern test `95ba95d5…` · card test `3cb710bc…`.

## Assumptions, deviations, limitations

- The converted-reduced card test uses `rates { ALL: 1, EUR: 100 }` and asserts `9 200 000` loosely across locale separators.
- Unmigrated nodes of the two pass-through parents are untouched (D88-1, clause 16d).
- `check:design-tokens` red is Task 857's untracked file; reported, not fixed.
- Owner visual matrix (§13.5) and live check remain owed. No git commands were run.

## Revision 1

**Mode:** remediation (kickoff §16). I did not re-run I0 or the plants. New evidence is under `docs/sessions/evidence/task912/r1-*`.

### Files Changed delta

| Path | Reason |
|---|---|
| `src/stories/patterns/mantine/ListingDetailView.stories.tsx` | R10: the meta gains `parameters: { skipCanvas: true }`. One line, nothing else. |

Records also touched: this session log, 912's row in `docs/backlog.md` (still 80 lines, no `BACKLOG LIMIT BREACH`) and the `r1-*` evidence files.

### Revision gate block (`r1-gate.sh`; each transcript unpiped, exit code appended to its own file)

- `node.exe -p process.platform`: exit 0
- `node.exe -v`: exit 0
- vitest (pattern, card, favorite): exit 0, 27 passed (27), no failures (`r1-vitest.txt`)
- `npm run typecheck`: exit 0
- `npm run lint`: exit 0
- `npm run check:design-tokens`: exit 0, `0 raw style-value violation(s)`. The 857 file finding from review 1 did not reproduce in this run.
- `npm run check:story-coverage`: exit 0
- `npm run check:mojibake`: exit 0
- `npm run build`: exit 0
- `npm run build-storybook`: exit 0
- Hashes (`r1-hashes.txt`): the five files that must stay unchanged equal `41-hashes.txt` (pattern `aa9fcd0d`, card `8b514185`, ListingContact `259f0481`, ListingDetailView `f29076bb`, contact Story `9d2a5d25`). The edited Story went from `5756d83a` to `40da042b`.
- `git status --porcelain` (`r1-status.txt`): the only product-code change I made is the Story above. Every other entry is other tasks' pre-existing work.

### AC10 table (`r1-measure.json`, `r1-measure.mjs`; storybook-static on 127.0.0.1:6107, deviceScaleFactor 1)

| Export | Locale | Width | top | right | bottom | left | h-overflow | contact card block (top to bottom) |
|---|---|---|---|---|---|---|---|---|
| public-listing | en | 320 | 10 | 16 | 56 | 16 | false | 138,000 EUR (line-through, 12px) → 125,000 EUR (none, 20px) |
| public-listing | en | 390 | 10 | 16 | 56 | 16 | false | 138,000 EUR (line-through, 12px) → 125,000 EUR (none, 20px) |
| public-listing | en | 1024 | 10 | 32 | 56 | 32 | false | 138,000 EUR (line-through, 12px) → 125,000 EUR (none, 20px) |
| public-listing | en | 1440 | 10 | 64 | 56 | 64 | false | 138,000 EUR (line-through, 12px) → 125,000 EUR (none, 20px) |
| public-listing | uk | 320 | 10 | 16 | 56 | 16 | false | 138 000 EUR (line-through, 12px) → 125 000 EUR (none, 20px) |
| staff-preview-unpublished | en | 320 | 10 | 16 | 56 | 16 | false | 138,000 EUR (line-through, 12px) → 125,000 EUR (none, 20px) |
| staff-preview-unpublished | en | 390 | 10 | 16 | 56 | 16 | false | 138,000 EUR (line-through, 12px) → 125,000 EUR (none, 20px) |
| staff-preview-unpublished | en | 1024 | 10 | 32 | 56 | 32 | false | 138,000 EUR (line-through, 12px) → 125,000 EUR (none, 20px) |
| staff-preview-unpublished | en | 1440 | 10 | 64 | 56 | 64 | false | 138,000 EUR (line-through, 12px) → 125,000 EUR (none, 20px) |
| staff-preview-published | en | 320 | 10 | 16 | 56 | 16 | false | 138,000 EUR (line-through, 12px) → 125,000 EUR (none, 20px) |
| staff-preview-published | en | 390 | 10 | 16 | 56 | 16 | false | 138,000 EUR (line-through, 12px) → 125,000 EUR (none, 20px) |
| staff-preview-published | en | 1024 | 10 | 32 | 56 | 32 | false | 138,000 EUR (line-through, 12px) → 125,000 EUR (none, 20px) |
| staff-preview-published | en | 1440 | 10 | 64 | 56 | 64 | false | 138,000 EUR (line-through, 12px) → 125,000 EUR (none, 20px) |

Control: `ListingContactPattern/Default` at en 320/390/1024/1440. Gutters and every price block are identical to `31-measure.json` on all four widths. In the contact card the struck old price sits above the current price, as D89-9 requires.

**Deviation to check.** AC10 expects left/right 16/16/32/32. At 1440 it measures **64**.
- The cause is the frame's own ladder. At `xxl`, `3xl` gives 48px, and `maw=var(--width-page-max)` (88rem, 1408px) centres the content by a further 16px.
- So 64 is the production value, not a doubled gutter. The doubled value before the fix was 96.
- 320, 390 and 1024 match 16/16/32.
- Top is 10, the breadcrumb band's own `padding-block` (§16.1). No side is 0 and nothing exceeds the frame's own value.
- I changed nothing for this.

### Receipts

- `GR-3b STORY RESPONSIVE CHECK — ListingDetailView/PublicListing, StaffPreviewUnpublished, StaffPreviewPublished: no fixed width added; the Story only drops the canvas wrapper; no horizontal overflow at 320/390/1024/1440 (en) or uk@320.`
- `GR-3c TYPE RESPONSIVE CHECK — no text changed. Contact card price 20px, old price 12px at every measured width.`
- `GR-3d STORY GUTTER CHECK — ListingDetailView x3 exports: the Story adds none, the production frame supplies it. Left/right 16/16/32/64 at 320/390/1024/1440; top 10; bottom 56; no side 0. ListingContactPattern/Default (control) unchanged: 24/16/24/16 at 320 and 390.`
- `GR-3e TEXT BUTTONS STACKED — n/a: no popup`
- `GR-3f CIRCLE CHECK — n/a`

### Limitations

- The registry addition (§10.6) stays owed while `docs/critical-flow-registry.md` is dirty.
- Owner visual QA (§13.5) is still owed. I have not marked any tuple visually passed.
- No git commands were run.

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## Revision 2 (kickoff §18) — executor evidence

**Task path and status:** `tasks/Sprints/Sprint_88_kickoff_prompt_Task_912_Strikethrough_Only_For_Real_Reduction.md` §18 — `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Evidence prefix `r2-` in `docs/sessions/evidence/task912/`.

### Receipts (start)

- `CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`
- `GR-0`, `GR-3a`, `GR-4` receipts: as written in kickoff §18.6 (decision `CREATE` for `MantineListingPrice`; the search was re-verified against the tree: no shared price block existed — the detail and contact patterns each wrote their own and disagreed).
- §18.6 precondition: the read-only status query over `messages`, `scripts/mantine-migration-scope.json`, `src/design-system/mantine/patterns/index.ts` and `docs/critical-flow-registry.md` printed nothing at I0 (`r2-i0.txt`). No `BLOCKED — dirty shared file`.

### Requirements

| ID | Status | Evidence |
|---|---|---|
| R11 | done | new `src/design-system/mantine/patterns/MantineListingPrice.tsx` (Stack `micro` → struck `xs` dimmed old price → `Group sm baseline wrap` price `xl` 700 brand + `trailing` → `xs` dimmed `{label}: {value}`); exported from `patterns/index.ts`; enrolled in `scripts/mantine-migration-scope.json` |
| R12 | done | `MantineListingContactPattern.tsx` price block is one `MantineListingPrice`; `originalPrice`/`originalPriceLabel` → `ownerCurrency`; doc comments say "price in the owner's currency" |
| R13 | done | `MantineListingDetailPattern.tsx` price `Group` + disclosure `Text` replaced by one `MantineListingPrice` (`trailing` = per-m² `Text` moved as is) |
| R14 | done | `listing.price_in_owner_currency` in sq/en/uk/it; `ListingDetailView.tsx` two key literals only; `listing.original_price` and `storybook.mantine.listing_detail_original_price_label` deleted; `git grep -n "original_price" -- src messages` → no hit (the E4 section key was renamed `listing_detail_section_converted_price`, because AC13's grep matches its old name) |
| R15 | done | no hand-written price string in the four Stories; `formatPrice`, `convertPrice` with `rates = { ALL: 1, EUR: 100 }`, labels via `storyT(l, 'listing.price_in_owner_currency')` |
| R16 | done | `ListingContactPattern/Default`: one fixture (125000 / 138000 EUR, not converted) in every section incl. the production `ListingContact` section (`priceOld` prop); `priceReduced` deleted |
| R17 | done | `ListingDetailPattern/Default`: base and `demoContact` both 80000 / 92000 EUR, no `originalPrice` on the contact; the E4 section is the converted case (ALL price, EUR owner line) for both detail block and contact card; the four section-label values updated (key renamed, see R14) |
| R18 | done | new `src/stories/patterns/mantine/ListingPrice.stories.tsx`, `Patterns/Mantine/ListingPrice` → `Default`, `StoryPageGutter`, four sections; four `storybook.mantine.listing_price_section_*` keys in four locales |
| R19 | done | `ListingDetailView.stories.tsx`: wrapper computes `formattedPrice = formatPrice(props.displayPrice, props.displayCurrencyCode, storyLocale)`; the arg is deleted and the prop omitted from the wrapper type; `skipCanvas` kept |

Kept untouched (hash-equal to `41-hashes.txt`): `ListingCard.tsx` `8b514185…`, `ListingContact.tsx` `259f0481…`, `ListingCard.smoke.test.tsx` `3cb710bc…`, `MantineListingContactPattern.smoke.test.tsx` `95ba95d5…`.

### Files Changed (Revision 2 delta)

New: `MantineListingPrice.tsx`, `__tests__/MantineListingPrice.smoke.test.tsx`, `src/stories/patterns/mantine/ListingPrice.stories.tsx`.
Modified: `MantineListingContactPattern.tsx`, `MantineListingDetailPattern.tsx`, `patterns/index.ts`, `scripts/mantine-migration-scope.json`, `ListingDetailView.tsx` (two key literals), `messages/{sq,en,uk,it}.json`, `ListingContactPattern.stories.tsx`, `ListingDetailPattern.stories.tsx`, `ListingDetailView.stories.tsx`, `docs/critical-flow-registry.md` (rows `:62`, `:63` only), `docs/backlog.md` (912's row only; 80 lines, `check:backlog-active` exit 0).
Final hashes: `r2-hashes.txt`. Status after: `r2-status-after.txt`.

### I0 vs final

| Check | I0 | Final |
|---|---|---|
| platform | `win32` | `win32` |
| `check:i18n` | exit 0, parity 2563 keys | exit 0 |
| `check:i18n-hardcode` | exit 1 — 2 findings `AdminHeader.tsx:53`, `AdminSidebar.tsx:93` | exit 1 — the same two (not mine; AC13 "same exit code and finding list") |

### Gate block (`r2-*.txt`, unpiped, exit printed in each)

| Command | Exit |
|---|---|
| `vitest` (Price + ContactPattern + ListingCard + ListingDetailView.favorite) | 0 — 4 files, 32 tests passed |
| `typecheck` | 0 |
| `lint` | **1** — 4 errors, all in `docs/sessions/evidence/task912/rv2-opus-probe.cjs` (`no-require-imports`), Opus's review-2 probe, not a §18 path; not edited. No finding in a file I wrote. |
| `check:design-tokens` | 0 |
| `check:story-coverage` | 0 |
| `check:i18n` | 0 |
| `check:i18n-hardcode` | 1 — equals I0 (above) |
| `check:mojibake` | 0 |
| `check:rendered-scope` | 0 |
| `build` | **0** |
| `build-storybook` | 0 |
| `governance:components` | 0 |

`GR-2 SCOPE STATED — check:story-coverage inspects only components already enrolled; it cannot see an unenrolled child; the criterion is closed by the surface censuses (r2-censuses.txt) and the Story that imports each changed component by name.`

### Plants (AC15, `r2-plants.txt`; Node read/write; blob hash computed, then cross-checked with `git hash-object`)

Post-fix hash `35f6d13b44515cfd0f1113859fee59f3a3a5958a`.

| Plant | Planted hash | Result |
|---|---|---|
| P-D drop the `priceOld` render | `0dbdf2f3…` | exit 1 — AC11(a) and the detail-pattern order test failed (2 failed / 3 passed) |
| P-E `priceOld` after the price | `7474e359…` | exit 1 — the same two order tests failed (2 failed / 3 passed) |
| P-F `td="line-through"` on the owner-currency line | `584ed0e7…` | exit 1 — (b), (c) and the detail test failed (3 failed / 2 passed) |

After each restore the hash was `35f6d13b…`; the restored run is 5/5 (`r2-plant-restored.txt`); the final `git hash-object` equals the post-fix value.

### Censuses (`r2-censuses.txt`)

- `MantineListingContactPattern.tsx` → `GR-1 CENSUS COMPLETE — 2 nodes; tier1 2 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none.`
- `MantineListingPrice.tsx` → `GR-1 CENSUS COMPLETE — 1 nodes; tier1 1 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none.`
- `MantineListingDetailPattern.tsx` → `GR-1 CENSUS COMPLETE — 10 nodes; tier1 10 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none.`
- `ListingCard.tsx` → `GR-1 CENSUS COMPLETE — 7 nodes; tier1 7 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none.`
- `ListingContact.tsx` and `ListingDetailView.tsx` → `GR-1 CENSUS BLOCKED`, on exactly the §3.1 node set (795 dialogs + 5 tier-2 primitives; 794 gallery; 839 map; 838 share; 834 `ViewAllLink`; 814 `ClearRecentlyViewedButton`; 913 the five). `MantineListingPrice` is the only new node and it is migrated, enrolled and storied. Nothing new is blocked.

### Rendered measurements (`r2-measure.json`, `r2-measure-summary.txt`, `r2-probe-gutter.json`; storybook-static on 127.0.0.1:6107, `deviceScaleFactor` 1)

`en` at 320/390/768/1024/1440, `sq`/`uk`/`it` at 320/1440, four Stories. In every price block of every Story and width: the struck line is 12px `line-through` and its bottom is at or above the 20px price's top; the owner-currency line is 12px and never struck; no horizontal overflow.

| Story | Price block (en 1440) |
|---|---|
| `ListingPrice/Default` | `125,000 EUR` · `138,000 EUR` struck above `125,000 EUR` · `12,500,000 ALL` over `Price in the owner's currency: 125,000 EUR` · `13,800,000 ALL` struck above `12,500,000 ALL` over the owner line. `uk@320`: `Ціна у валюті власника: 125 000 EUR`. `sq@1440`: `Çmimi në monedhën e pronarit: 125 000 EUR` |
| `ListingContactPattern/Default` | all 7 contact cards: `138,000 EUR` struck (12px, top 160) above `125,000 EUR` (20px, top 180); no owner line |
| `ListingDetailView/PublicListing` | detail block `138,000 EUR` (top 781) above `125,000 EUR` (801); contact card the same (231 / 251, 12px / 20px) |
| `ListingDetailPattern/Default` | 9 blocks `92,000 EUR` struck above `80,000 EUR`; the converted E4 section (detail and contact): `9,200,000 ALL` struck above `8,000,000 ALL`, owner line `Price in the owner's currency: 80,000 EUR` — the only two owner lines |

### Receipts

- `GR-3 STORY PROVEN — MantineListingPrice ← src/stories/patterns/mantine/ListingPrice.stories.tsx` (imports it by name); `MantineListingContactPattern ← ListingContactPattern.stories.tsx`; `MantineListingDetailPattern ← ListingDetailPattern.stories.tsx`.
- `GR-3b STORY RESPONSIVE CHECK — ListingPrice/Default, ListingContactPattern/Default, ListingDetailView/PublicListing, ListingDetailPattern/Default: 320 · 390 · 1024 · 1440 each fills its container (ListingPrice fluid inside the gutter; ListingContactPattern in the production sidebar Grid.Col span {12, md 5, xl 4}; ListingDetailView in the production ListingsPageFrame); overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE.`
- `GR-3c TYPE RESPONSIVE CHECK — block lines in every Story: old price 12 · 12 · 12 · 12px, price 20px, owner line 12px at 320/390/768/1440; ListingDetailView/PublicListing H1 20 · 20 · 30 · 36 (320/390/768/1440 → 20/20/30/36), H2 18 · 18 · 24 · 24; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.` The detail block's old price changed from 16px to 12px (§18.6).
- `GR-3d STORY GUTTER CHECK`:
  - `ListingPrice/Default`: gutter `StoryPageGutter all` — padding 24/16/24/16 at 320 and 390, 24/32/24/32 at 1024 and 1440 (`r2-probe-gutter.json`); content top 24; content bottom to the gutter's bottom edge 24 (below the short content the page is empty canvas, which the edge measure reports as 500); side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.
  - `ListingContactPattern/Default`: `StoryPageGutter all` (unchanged); 24/16/24/16 at 320 and 390, 24/–/24/32 at 1024 and 1440 (the right side is the unfilled part of the grid); control unchanged.
  - `ListingDetailView/PublicListing`: `n/a: own gutter (ListingsPageFrame.tsx:93-94)`; 10/16/56/16 · 10/16/56/16 · 10/32/56/32 · 10/64/56/64, equal to review 2's values; side at 0: NONE.
  - `ListingDetailPattern/Default`: `StoryPageGutter all`; the first leaf (the gallery image) is at top 104 at every width (24 + the Task 886 sticky spacer 80), left/right 16/16/32/32, bottom 24; side at 0: NONE. (`r2-measure.json` reports `top` 416 at 320 and 390 only because that probe skips `<img>`; `r2-probe-gutter.json` shows the image at 104.)
- `GR-3e TEXT BUTTONS STACKED — n/a: no popup opened.` · `GR-3f CIRCLE CHECK — n/a: no circular element changed.` · `GR-3g CORNER CHECK — n/a: no border or ring changed.`

### Registry rows added (§10.6)

`docs/critical-flow-registry.md` `:62` and `:63` each gained one `**Task 912:**` sentence naming `MantineListingPrice.smoke.test.tsx`, `MantineListingContactPattern.smoke.test.tsx` and the `Task 912` cases in `ListingCard.smoke.test.tsx`. The file was clean at I0 and nothing else in it changed (2 lines in the diff stat).

### Assumptions, deviations, limitations

- `MantineListingContactPattern` now shows the owner-currency line only when both `originalPrice` and `originalPriceLabel` are set (before: `originalPrice` alone). The production caller always passes both.
- The E4 section key was renamed (`listing_detail_section_original_price` → `listing_detail_section_converted_price`) so the AC13 search returns nothing; the kickoff said "update the value", not rename.
- `MantineListingPrice` accepts `size?: 'xl'` only (918 adds more).
- `docs/design-system-pattern-ownership.md` still lists the pattern census at 816's counts; it is not a gate and I did not edit it.
- Owner visual QA §18.9 is owed. I have not marked any tuple visually passed.
- Only read-only Git inspection was run.

### Opus handoff

Inspect: `r2-plants.txt` and the three `r2-plant-*.txt` transcripts; `r2-measure-summary.txt`; `r2-censuses.txt`; the `messages/*.json` diff (one replaced key, one deleted key, one renamed key and five added keys per file); the lint finding in `rv2-opus-probe.cjs` (yours) and the two `check:i18n-hardcode` findings (admin work, not 912).

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## Revision 3 (kickoff §19) — executor evidence

**Task path and status:** `tasks/Sprints/Sprint_88_kickoff_prompt_Task_912_Strikethrough_Only_For_Real_Reduction.md` §19 — `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Evidence prefix `r3-`.

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` The change corrects fixture data in an existing Story; no component, Story, export, key, wrapper or style is added, so no new GR-0 or GR-3a decision is needed.

### R20 (done)

In `src/stories/patterns/mantine/ListingDetailPattern.stories.tsx` only:
- `const STORY_AREA = 85`, commented as equal to the area feature value `'85 m²'`;
- `buildBaseProps`: `pricePerSqm` = `` `${formatPrice(Math.round(STORY_PRICE / STORY_AREA), STORY_CURRENCY, l)} ${storyT(l, 'listing.per_sqm')}` `` (941 EUR);
- the converted E4 section: `convertedData.pricePerSqm` = the same shape from `Math.round(convertPrice(STORY_PRICE, STORY_CURRENCY, STORY_VIEWER_CURRENCY, rates) / STORY_AREA)` in `STORY_VIEWER_CURRENCY` (94,118 ALL);
- `storybook.mantine.card_price_per_sqm_1` is untouched in `messages/*.json` (`ListingCardPattern.stories.tsx` still uses it).

### Files Changed (delta)

One path: `src/stories/patterns/mantine/ListingDetailPattern.stories.tsx`, blob `6eb7befe…` → `fb10c5f6c1b62831da48f4f9492e482d2cab29ea`. Every other §18 file is hash-equal to `r2-hashes.txt` (`diff r2-hashes.txt r3-hashes.txt` differs on that one line only; `r3-status.txt` has the same entries outside the evidence folder as `r2-status-after.txt`).

### Verification (`r3-*.txt`, unpiped, exit code printed in each)

| Command | Exit |
|---|---|
| `node -p process.platform` | 0 (`win32`) |
| `vitest` (the four files) | 0 — 32/32 |
| `typecheck` | 0 |
| `lint` | 0 (0 errors; the `rv2-opus-probe.cjs` finding from Revision 2 is gone) |
| `check:design-tokens` | 0 |
| `check:story-coverage` | 0 |
| `check:i18n` | 0 |
| `check:mojibake` | 0 |
| `build-storybook` | 0 |
| `node docs/sessions/evidence/task912/rv3-opus-probe.mjs` | 0 → `rv3-opus-probe.json`, copied to `r3-probe.json` |

`npm run build` was not re-run, as §19.3 says. The Revision 2 build (`r2-build.txt`, exit 0) stays the build evidence.

### AC16 rows (`r3-probe.json`, built `storybook-static`, 1440)

- `en`, all five non-converted price rows: `80,000 EUR` · `941 EUR /m²`; the E4 section: `8,000,000 ALL` · `94,118 ALL /m²`.
- `uk`: `80 000 EUR` · `941 EUR /м²`; the E4 section: `8 000 000 ALL` · `94 118 ALL /м²`.
- The search for `card_price_per_sqm_1` in the Story file returns no hit.
- No price row in the four §18 Stories contains `€` (the `ListingContactPattern`, `ListingPrice` and `ListingDetailView` rows are unchanged from Revision 2; `rv3-opus-probe.json` also covers `ListingDetailView/PublicListing`).

### Receipts (`ListingDetailPattern/Default`; `r3-measure.json`, `deviceScaleFactor` 1; an exact match to Revision 2 at every width)

- `GR-3b STORY RESPONSIVE CHECK — ListingDetailPattern/Default: 320 · 390 · 1024 · 1440 fluid inside StoryPageGutter, as in Revision 2; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE.`
- `GR-3c TYPE RESPONSIVE CHECK — ListingDetailPattern/Default: H1 20 · 20 · 30 · 36px (320/390/768/1440), H2 18 · 18 · 24 · 24px; price 20px, old price and owner line 12px, per-m² 14px (unchanged `sm`); ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`
- `GR-3d STORY GUTTER CHECK — ListingDetailPattern/Default: gutter StoryPageGutter all; left/right 16/16/32/32 at 320/390/1024/1440, bottom 24, top 104 (24 + the Task 886 sticky spacer 80); `r3-measure.json` reports top 416 at 320/390 for the same reason as Revision 2 (its probe skips `<img>`); side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.` These equal Revision 2's values.
- `GR-3e TEXT BUTTONS STACKED — n/a: no popup.`

### Limitations

- Owner matrix §18.9 stays owed and is not marked passed.
- Only read-only Git inspection was run.

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## Revision 4 (kickoff §20) — executor evidence

**Task path and status:** `tasks/Sprints/Sprint_88_kickoff_prompt_Task_912_Strikethrough_Only_For_Real_Reduction.md` §20 — **`PARTIALLY IMPLEMENTED`**. Evidence prefix `r4-`.

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`
GR-0 for R21/R22: `REUSE`/`EXTEND` of the canonical owner `MantineListingPrice.tsx` and the theme token source `theme.ts` (`theme.other`, the `MantineThemeOther` augmentation); no new component, Story, wrapper or style. GR-7: the kickoff §20.3 carries the research and its receipt; I did not redo it.

### Requirements

| ID | Status | Evidence |
|---|---|---|
| R21 | done | `theme.ts`: `priceColor: { regular: string }` in `MantineThemeOther`; `priceColor: { regular: '#111111' }` in `theme.other`, with a comment quoting the owner (§20.1) and D89-7. `git grep -n "#111111" -- src` → `theme.ts:734` (the comment) and `:736` (the value); no other file |
| R22 | done | `MantineListingPrice.tsx`: `c={priceOld ? 'brand' : theme.other.priceColor.regular}` via `useMantineTheme()`; doc comment updated; struck line, owner line and `trailing` untouched; card and admin surfaces untouched |
| R23 | **blocked — contradiction** | `truncate` deleted from the subtitle `Text` (`MantineListingContactPattern.tsx:148`) as written. It does not fix the reported cut, see below |
| R24 | done | `MantineListingPrice.smoke.test.tsx`: (e), (f), (g) added; jsdom resolves the dark price to `rgb(17, 17, 17)` and the reduced price to `var(--mantine-color-brand-…)` |

### TASK SPECIFICATION CONTRADICTION (R23 / AC18)

- §20.2 F4 says the cut line is the **subtitle** (`:148`). `r4-overrun.json` (the kickoff's own probe) still returns one hit for `uk` and one for `it`, and its element chain starts at `p.mantine-focus-auto[ov hidden … w 178]`: that is the agent **name** `Text` (`fw={600} size="sm" truncate`, `:140`), not the subtitle.
- In the `ownerDeleted` state the Story passes `agent={{ name: storyT(l, 'storybook.mantine.listing_detail_deleted_title') }}`, with no subtitle; production does the same: `ListingContact.tsx:156` `{ name: t('owner_deleted_label'), isVerified: false }`. The text the probe flags (`Власник видалив свій обліковий запис`, `Il proprietario ha eliminato il proprio account`) is that name.
- §20 R23 says the agent name's `truncate` (`:140`) **stays**, and AC18 asks for the full message, no ellipsis. Both cannot hold.
- I did not remove the name's `truncate`, because R23 forbids it. I did not claim AC18. The same cause shows in `r4-probe.txt`: `ListingContactPattern/Default` right gaps `uk@320` −63 and `it@320` −91 (the clipped text box extends past the viewport; `ovf` is 0).
- Needed from Opus: either R23 also removes (or replaces with wrapping) the name's `truncate` for the `ownerDeleted` state, or AC18 is dropped.

### Files Changed (Revision 4 delta)

`src/design-system/mantine/theme.ts` (`5a54df56…` → `ba342c49de7f90a442c2785c2f8e4373c870c54c`), `MantineListingPrice.tsx` (`35f6d13b…` → `199810d73a457100b1b4faaaaaa3f96d4d42615f`), `MantineListingContactPattern.tsx` (`c8881721…` → `42bec75f2190e882bd6fed64df8ec7c23c678fd6`), `__tests__/MantineListingPrice.smoke.test.tsx` (`72a457ef…` → `6e5e07000049900c71907edeaee62ef55a1dffce`). `ListingDetailPattern.stories.tsx` is still `fb10c5f6…`. `r4-status.txt` differs from `r3-status.txt` outside the evidence folder by one entry: `theme.ts`.

### Verification (`r4-*.txt`, unpiped, exit printed in each)

| Command | Exit |
|---|---|
| `node -p process.platform` | 0 (`win32`) |
| `vitest` (the four files) | 0 — 35/35 |
| `typecheck` | 0 |
| `lint` | 0 |
| `check:design-tokens` | 0 |
| `check:story-coverage` | 0 |
| `check:mojibake` | 0 |
| `build` | 0 |
| `build-storybook` | 0 |
| `rv4-opus-probe.mjs` | 0 → `r4-probe.txt` (40 cells, `bad 0`, no popups, no horizontal overflow) |
| `rv4-opus-overrun.mjs` | 0 → `r4-overrun.json`: `en` hits `[]`; **`uk` and `it` each 1 hit (the name, see above)** |
| `r4-colour.mjs` (copy of the probe with `color` added) | 0 → `r4-colour.json` |

`GR-2 SCOPE STATED — check:story-coverage inspects only enrolled components and none of their colours; check:design-tokens sees raw literals in non-allowlisted files and none in theme.ts; the colour criterion is closed by r4-colour.json, computed in the built Storybook.`

### AC17 (`r4-colour.json`, computed `color`, `en` at 320 and 1440, identical at both)

- `ListingPrice/Default`: section 1 (plain) `rgb(17, 17, 17)`; section 2 (reduced) `rgb(236, 84, 71)`; section 3 (converted) `rgb(17, 17, 17)`; section 4 (reduced + converted) `rgb(236, 84, 71)`.
- `ListingContactPattern/Default` (7 blocks), `ListingDetailView/PublicListing` (2) and `ListingDetailPattern/Default` (11): every price `rgb(236, 84, 71)`, the brand shade, as before.

### AC19 plants (`r4-plants.txt`; Node read/write; blob hash computed)

Post-fix hash `199810d73a457100b1b4faaaaaa3f96d4d42615f`.

| Plant | Planted hash | Result |
|---|---|---|
| P-G not-reduced branch returns `'brand'` | `ff7488e8…` | exit 1 — (e) and (g) failed (2 failed / 6 passed) |
| P-H reduced branch returns the token | `22b31115…` | exit 1 — (f) and (g) failed (2 failed / 6 passed) |

Each restore gave `199810d7…`; the restored run is 8/8 (`r4-plant-restored.txt`); the final hash of the file is the post-fix value.

### Measurements and receipts (`r4-probe.txt`; clip-aware probe, `deviceScaleFactor` 1)

- Every price block, every Story, every width: struck line 12px `line-through` above the 20px price; owner line 12px, plain; no horizontal overflow; no popup.
- `GR-3b STORY RESPONSIVE CHECK — ListingPrice, ListingContactPattern, ListingDetailView/PublicListing, ListingDetailPattern: unchanged from Revision 3 (no Story file changed); overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE.` Exception recorded above: `ListingContactPattern/Default` `uk@320` and `it@320` ownerDeleted name still clipped (not a fixed width; the pattern's name `truncate`).
- `GR-3c TYPE RESPONSIVE CHECK — price 20px, old price and owner line 12px, per-m² 14px; ListingDetailView and ListingDetailPattern headings H1 20 · 20 · 36 · 36 at 320/390/1024/1440 (H2 18 · 18 · 24 · 24); ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.` No text size changed in this revision.
- `GR-3d STORY GUTTER CHECK — gutters unchanged: ListingPrice StoryPageGutter all 24/16/…/16 at 320, left 32 at 1024/1440; ListingContactPattern 24/–/58/16 at 320, left 32 from 1024; ListingDetailView own gutter (ListingsPageFrame.tsx:93-94), left 16/16/32/64, top 7; ListingDetailPattern 104/…/16, left 32 from 1024; side at 0: NONE; doubled gutter: NONE.` The probe's bottom values (58, 90, 59, 46, 501) are its scroll-height arithmetic below the last content box, as in review 4's run, not Story padding.
- `GR-3e TEXT BUTTONS STACKED — n/a: no popup.` · `GR-3f CIRCLE CHECK — n/a.` · `GR-3g CORNER CHECK — n/a: no line.`

### Observations (not caused by 912)

- `r4-probe.txt` reports four `CUT` lines for the `ListingDetailView`/`ListingDetailPattern` title at 232px shown 224px; they pre-date this revision and none concerns a price.

### Limitations

- AC18 / R23 stays open (contradiction above). The owner matrix §18.9 is not marked passed.
- Only read-only Git inspection was run.

`PARTIALLY IMPLEMENTED`

## Revision 5 (kickoff §21) — executor evidence

**Task path and status:** `tasks/Sprints/Sprint_88_kickoff_prompt_Task_912_Strikethrough_Only_For_Real_Reduction.md` §21 — `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Evidence prefix `r5-`.

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` The change deletes one prop on an existing `Text` in its canonical owner; no component, Story, wrapper or style is added. GR-7: §21.2 carries the research and its receipt.

### R25 (done)

`src/design-system/mantine/patterns/MantineListingContactPattern.tsx:140`: `<Text fw={600} size="sm" truncate>` → `<Text fw={600} size="sm">`. Nothing else: no `lineClamp`, `style`, `miw` or `wrap` change; the `Group wrap="nowrap"` with the verified badge stays; Revision 4's subtitle change stays.

### Files Changed (delta)

One path: `MantineListingContactPattern.tsx`, `42bec75f2190e882bd6fed64df8ec7c23c678fd6` → `979cda6184b529ebdfe4eb49a16d6cdcfe2ccd45`. `theme.ts` `ba342c49…`, `MantineListingPrice.tsx` `199810d7…` and `MantineListingPrice.smoke.test.tsx` `6e5e0700…` are hash-equal to `r4-hashes.txt`. `r5-status.txt` equals `r4-status.txt` outside the evidence folder.

### Verification (`r5-*.txt`, unpiped, exit printed in each)

| Command | Exit |
|---|---|
| `node -p process.platform` | 0 (`win32`) |
| `vitest` (four files) | 0 — 35/35 |
| `typecheck` | 0 |
| `lint` | 0 |
| `check:design-tokens` | 0 |
| `check:story-coverage` | 0 |
| `check:mojibake` | 0 |
| `build` | 0 |
| `build-storybook` | 0 |
| `rv4-opus-overrun.mjs` | 0 → `r5-overrun.json`: `en`, `uk`, `it` all `hits=[]`, `scrollW` 320 |
| `rv4-opus-probe.mjs` | 0 → `r5-probe.txt` / `r5-probe.json` (40 cells, all `bad 0`, no popups, no horizontal overflow) |
| `r5-namerow.mjs` (new) | 0 → `r5-namerow.json` |

### AC18 (restated) — `r5-namerow.json`, `r5-overrun.json`

| Cell | `normal` name row | Owner-deleted message |
|---|---|---|
| `en@320` | name top 97 / badge top 96, badge right of the name (name right 182, badge left 188): same row | 2 lines, not ellipsised |
| `en@1440` | 79 / 78, same row | 1 line |
| `uk@320` | 115 / 114, same row | 2 lines |
| `it@320` | 97 / 96, same row | 3 lines |
| `uk@1440`, `it@1440` | 97 / 96, same row | 1 line |

In every cell the name's `scrollWidth` does not exceed its `clientWidth`, `text-overflow` is not `ellipsis`, and the document has no horizontal overflow. The probe's right gap for `ListingContactPattern/Default` `uk@320` is now 23 and `it@320` 17 (Revision 4: −63 and −91).

### Receipts

- `GR-3b STORY RESPONSIVE CHECK — ListingContactPattern/Default: 320 · 390 · 1024 · 1440 fills the production sidebar Grid.Col (span {12, md 5, xl 4}); overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE.` (the name and the verified badge are an inline pair, not sections.)
- `GR-3c TYPE RESPONSIVE CHECK — ListingContactPattern/Default: name 14px (`sm`), subtitle 12px, price 20px, old price and owner line 12px at 320/390/1024/1440; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.` No text size changed.
- `GR-3d STORY GUTTER CHECK — ListingContactPattern/Default: gutter StoryPageGutter all (unchanged); top/right/bottom/left 320 24/22/58/16 · 390 24/27/58/16 · 1024 24/606/58/32 · 1440 24/958/58/32 (right is the unfilled part of the grid; bottom is the probe's scroll-height arithmetic, as in review 4); side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.`
- `GR-3e TEXT BUTTONS STACKED — n/a: no popup.` · `GR-3f CIRCLE CHECK — n/a.` · `GR-3g CORNER CHECK — n/a: no line.`

### Limitations

- The probe still prints four `CUT` lines for the `ListingDetailView`/`ListingDetailPattern` title (232px, 224px shown); they pre-date this task and none concerns a price or the contact card.
- Owner matrix §18.9 is not marked passed.
- Only read-only Git inspection was run.

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## Revision 6 (kickoff §23) — executor evidence

**Task path and status:** `tasks/Sprints/Sprint_88_kickoff_prompt_Task_912_Strikethrough_Only_For_Real_Reduction.md` §23 — `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Evidence prefix `r6-`. Story files only; no production file, test, message key or token changed.

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`
`GR-3a STORY PREFLIGHT` is the receipt in kickoff §23.4 (decision `EXTEND`, three existing Stories, two new exports in the existing `ListingDetailView` file). I re-checked it: each of the three Stories imports its component directly (`ListingContactPattern.stories.tsx` → `MantineListingContactPattern`; `ListingDetailView.stories.tsx` → `ListingDetailViewBody`; `ListingDetailPattern.stories.tsx` → `MantineListingDetailPattern`). `GR-7: n/a` as §23.2 states.

### Requirements

| ID | Status | Evidence |
|---|---|---|
| R26 | done | `ListingContactPattern.stories.tsx` → `Default`: the "normal" section keeps its caption and now holds four `state="normal"` cards in the order plain · reduced · converted · reduced+converted, each under its own `listing_price_section_{key}` caption (the existing keys; rendered with one `map`, no copied markup). Converted = `convertPrice(125000,'EUR','ALL',rates)` in `ALL` plus `originalPrice`/`originalPriceLabel`; reduced+converted adds `convertPrice(138000,…)` as `priceOld`. Every other section keeps the reduced fixture |
| R27 | done | `ListingDetailView.stories.tsx`: exports `PublicListingNotReduced` (`isPriceReduced: false`, `displayPriceOld: null`) and `PublicListingConverted` (`displayCurrencyCode: 'ALL'`, `displayPrice` = `convertPrice(…)`, `pricePerSqm: Math.round(convertedPrice / baseListing.area_gross)`, `storyOwnerPrice`). The wrapper takes the Story-only prop `storyOwnerPrice` and passes `originalPriceStr={formatPrice(amount, currency, storyLocale)}` when it is set, otherwise the arg; the meta `originalPriceStr: null` stays. `rates` is declared once at module level, with the same comment as the other Stories |
| R28 | done | `ListingDetailPattern.stories.tsx` → `Default`: two sections directly after the first one, captions `listing_price_section_plain` and `listing_price_section_converted`; plain = `data` and `contact.price` without `priceOld`; converted = ALL price, ALL per-m² (`Math.round(convertPrice(80000,…) / STORY_AREA)`), owner line on both blocks, not reduced. The existing E4 section stays and now shares `convertedPricePerSqm` with the new one |

### Files Changed (delta)

Three paths, all Story files:
- `ListingContactPattern.stories.tsx` `3b0bb274…` → `05c80272c0dc5b9e06d96d4e1005cecba272780e`
- `ListingDetailView.stories.tsx` `8b4b92f3…` → `48b74f159a060d4e7503f599a3aa7c433216e782`
- `ListingDetailPattern.stories.tsx` `fb10c5f6…` → `df9378ca64cabb042659fcbe6e9c8644ef1e640e`

Every production and test file is hash-equal to `r5-hashes.txt` (`theme.ts` `ba342c49…`, `MantineListingPrice.tsx` `199810d7…`, `MantineListingContactPattern.tsx` `979cda61…`, `MantineListingPrice.smoke.test.tsx` `6e5e0700…`), and `messages/*` is untouched (`r6-hashes.txt`). `git status` differs from `r5-status.txt` outside the evidence folder by `.claude/agents/orchestrator.md`, `.claude/skills/create-task/SKILL.md`, `.claude/skills/review-task/SKILL.md`, `docs/golden-rules.md` and `docs/rule-index.md`, which were modified by someone else during this session; I did not touch them.

### Verification (`r6-*.txt`, unpiped, exit printed in each)

| Command | Exit |
|---|---|
| `node -p process.platform` | 0 (`win32`) |
| `typecheck` | 0 |
| `lint` | 0 |
| `check:design-tokens` | 0 |
| `check:story-coverage` | 0 |
| `check:mojibake` | 0 |
| `build-storybook` | 0 |
| `r6-probe.mjs` (copy of the rv4 probe: `color` added, the two new IDs, `uk@390` added) | 0 → `r6-probe.json`, `r6-probe.txt`: 66 cells, every price block `bad 0`, no popups, no overflow |
| `rv4-opus-overrun.mjs` | 0 → `r6-overrun.json`: `en`, `uk`, `it` all `hits=[]` |
| `r6-struck.mjs` (new: every `line-through` element on the page) | 0 → `r6-struck.json` |

`npm run build` was not re-run, as §23.5 says; `r5-build.txt` stays the production build evidence. `AC24`: the search for `card_price_(1|old_1|per_sqm_1)` and `'€` over the three Story files returns no hit; no file under `messages/` changed.

GR-2: `check:story-coverage` inspects only whether each enrolled component has a Story that imports it; it cannot see which price states a Story renders. The state criteria are closed by `r6-probe.json`, computed in the built Storybook.

### AC21 — `ListingContactPattern/Default` (`r6-probe.json`; `DARK` = `rgb(17, 17, 17)`, `CORAL` = `rgb(236, 84, 71)`)

First four cards, in DOM order, identical at `en@320`, `en@1440`, `uk@320` and `uk@1440` (digit grouping and label per locale):
1. `125,000 EUR` DARK, nothing struck, no owner line;
2. struck `138,000 EUR` above `125,000 EUR` CORAL;
3. `12,500,000 ALL` DARK, then `Price in the owner's currency: 125,000 EUR` (`uk`: `12 500 000 ALL`, `Ціна у валюті власника: 125 000 EUR`);
4. struck `13,800,000 ALL` above `12,500,000 ALL` CORAL, then the owner line.

The other six cards stay the reduced fixture (`138,000 EUR~125,000 EUR` CORAL ×7 in total, including card 2). Also recorded at `sq`, `it` (320/1440), 390 and 1024.

### AC22 — `ListingDetailView` (`en`/`uk` at 390 and 1440)

| Export | Detail block | Contact card | Per-m² | Struck elements on the page (`r6-struck.json`) |
|---|---|---|---|---|
| `PublicListing` | struck `138,000 EUR` above `125,000 EUR` CORAL | the same | `1,471 EUR /m²` | 2 (`138,000 EUR` ×2; `uk` `138 000 EUR`) |
| `PublicListingNotReduced` | `125,000 EUR` DARK | `125,000 EUR` DARK | `1,471 EUR /m²` | **0** |
| `PublicListingConverted` | `12,500,000 ALL` DARK + `Price in the owner's currency: 125,000 EUR`, `td=none` | the same | **`147,059 ALL /m²`** | **0** |

`uk@390` and `uk@1440`: the same values with `uk` grouping and label (`147 059 ALL /м²`, `Ціна у валюті власника: 125 000 EUR`). No overflow in any cell.

### AC23 — `ListingDetailPattern/Default`, `en@1440`

Blocks in DOM order (detail block, contact card, per section): 0–1 the first section, reduced, `92,000 EUR` struck above `80,000 EUR` CORAL, `941 EUR /m²`; **2–3 plain: `80,000 EUR` DARK, nothing struck, `941 EUR /m²` on the detail block**; **4–5 converted: `8,000,000 ALL` DARK, owner line `Price in the owner's currency: 80,000 EUR` plain, `94,118 ALL /m²`**; 6–14 the existing sections unchanged (reduced, CORAL); 11–12 the E4 section: struck `9,200,000 ALL` above `8,000,000 ALL` CORAL with the owner line, `94,118 ALL /m²`.

### Receipts (per changed Story or new export; `r6-probe.json`, `deviceScaleFactor` 1)

- `GR-3b STORY RESPONSIVE CHECK — ListingContactPattern/Default, ListingDetailView/{PublicListing, PublicListingNotReduced, PublicListingConverted}, ListingDetailPattern/Default: 320 · 390 · 1024 · 1440 fluid in their production containers (the sidebar Grid.Col for the contact card, ListingsPageFrame for the view, StoryPageGutter for the pattern); overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE.`
- `GR-3c TYPE RESPONSIVE CHECK — price blocks: old 12px · price 20px · owner line 12px · per-m² 14px at every width; ListingDetailView exports H1 20 · 20 · 36 · 36 (320/390/1024/1440), H2 18 · 18 · 24 · 24; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.` No text size changed.
- `GR-3d STORY GUTTER CHECK`:
  - `ListingContactPattern/Default`: `StoryPageGutter all` (unchanged); t/r/b/l 320 24/22/58/16 · 390 24/27/58/16 · 1024 24/606/58/32 · 1440 24/958/58/32;
  - `ListingDetailView` ×3 exports: `n/a: own gutter (ListingsPageFrame.tsx:93-94)`; 320/390 7/16–24/90/16, 1440 7/208/78/64 (left 16 · 16 · 32 · 64);
  - `ListingDetailPattern/Default`: `StoryPageGutter all`; top 104 (24 + the 886 spacer), left 16 · 16 · 32 · 32;
  - side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE (no wrapper, `style`, padding or width was added).
- `GR-3e TEXT BUTTONS STACKED — n/a: no popup.` · `GR-3f CIRCLE CHECK — n/a.` · `GR-3g CORNER CHECK — n/a: no line.`

### Limitations

- The probe's bottom edge values are scroll-height arithmetic below the last content box, as in earlier reviews.
- Owner matrix §23.6 is not marked passed; O88-1 is the owner's accepted row.
- Only read-only Git inspection was run.

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## Revision 7 (kickoff §24) — executor evidence

**Task path and status:** `tasks/Sprints/Sprint_88_kickoff_prompt_Task_912_Strikethrough_Only_For_Real_Reduction.md` §24 — `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Evidence prefix `r7-`. Two Story files only.

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` `GR-7: n/a` as §24.3 states (two fixtures aligned with production's badge and `isPriceReduced` logic; no layout, control or style chosen). The §24.3 retraction is the orchestrator's; I made no claim from §20.3/§21.2.

### Requirements

| ID | Status | Evidence |
|---|---|---|
| R29 | done | `ListingDetailPattern.stories.tsx` → `Default`: the "plain" and "converted" sections (the two `Task 912 R28` sections) pass `badges={base.badges.filter((b) => b.tone !== 'reduced')}`, with a one-line comment citing `ListingDetailView.tsx:266`. Every reduced section keeps `base.badges`. No key, Story, wrapper or style added |
| R30 | done | `ListingDetailView.stories.tsx`: `PublicListingNotReduced` and `PublicListingConverted` both add `listing: { ...baseListing, price_old: null }` to `args`; nothing else changed |

### Files Changed (delta)

- `ListingDetailPattern.stories.tsx` `df9378ca…` → `65449bcc8658caf00088c6fb57d1ec404049141a`
- `ListingDetailView.stories.tsx` `48b74f15…` → `3bc688851b95e99d9e328525b01072c8ad74a62c`
- `ListingContactPattern.stories.tsx` stays `05c80272c0dc5b9e06d96d4e1005cecba272780e` (equal to Revision 6).

`theme.ts` `ba342c49…`, `MantineListingPrice.tsx` `199810d7…`, `MantineListingContactPattern.tsx` `979cda61…` and `MantineListingPrice.smoke.test.tsx` `6e5e0700…` are unchanged (`r7-hashes.txt`). `r7-status.txt` equals `r6-status.txt` outside the evidence folder, except that the five governance/policy entries listed in Revision 6 (`.claude/…`, `docs/golden-rules.md`, `docs/rule-index.md`) are no longer modified; I did not touch them.

### Verification (`r7-*.txt`, unpiped, exit printed in each)

| Command | Exit |
|---|---|
| `node -p process.platform` | 0 (`win32`) |
| `typecheck` | 0 |
| `lint` | 0 |
| `check:design-tokens` | 0 |
| `check:story-coverage` | 0 |
| `check:mojibake` | 0 |
| `build-storybook` | 0 |
| `rv7-crops.mjs` | 0 → `r7-crops.txt` |
| `r6-probe.mjs` | 0 → `r7-probe.txt` (and the rewritten `r6-probe.json`; the Revision 6 output is kept as `r6-probe.before-r7.json`): 66 cells, `bad 0` in all, `ovf` 0 in all |

### AC25 — `ListingDetailPattern/Default`, `en@1440` (`r7-crops.txt`)

| Section | Badges | Price | Struck |
|---|---|---|---|
| first (reduced) | New / Premium / **Price reduced** / Sale | `80,000 EUR` CORAL | `92,000 EUR` |
| plain | New / Premium / Sale | `80,000 EUR` DARK | — |
| converted | New / Premium / Sale | `8,000,000 ALL` DARK | — |
| gallery slot, contact slot, content footer, sidebar-lg (reduced) | with **Price reduced** | `80,000 EUR` CORAL | `92,000 EUR` |
| E4 (reduced + converted) | with **Price reduced** | `8,000,000 ALL` CORAL | `9,200,000 ALL` |

### AC26 — `ListingDetailView`

`price_old: null` appears on both new exports (`ListingDetailView.stories.tsx:196` and `:202`). `r7-crops.txt`: `PublicListing` has the `Price reduced` badge, `125,000 EUR` CORAL and struck `138,000 EUR`; `PublicListingNotReduced` (`Premium / For sale / Apartment`) `125,000 EUR` DARK, nothing struck, no badge; `PublicListingConverted` `12,500,000 ALL` DARK, nothing struck, no badge. These two rows are the same as in review 7.

### Receipts (the two changed Stories; `r7-probe.txt`, `deviceScaleFactor` 1)

- `GR-3b STORY RESPONSIVE CHECK — ListingDetailPattern/Default, ListingDetailView/{PublicListingNotReduced, PublicListingConverted}: unchanged layout (a badge list and a fixture field only); 320 · 390 · 1024 · 1440 fluid; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE.`
- `GR-3c TYPE RESPONSIVE CHECK — no text size changed: price 20px, old price and owner line 12px, per-m² 14px; ListingDetailView H1 20 · 20 · 36 · 36 (320/390/1024/1440), H2 18 · 18 · 24 · 24; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`
- `GR-3d STORY GUTTER CHECK — ListingDetailPattern/Default: StoryPageGutter all, unchanged (top 104 = 24 + the 886 spacer, left 16 · 16 · 32 · 32); ListingDetailView exports: n/a: own gutter (ListingsPageFrame.tsx:93-94), left 16 · 16 · 32 · 64, top 7; side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.`
- `GR-3e TEXT BUTTONS STACKED — n/a: no popup.` · `GR-3f CIRCLE CHECK — n/a.` · `GR-3g CORNER CHECK — n/a: no line.`

### Limitations

- Owner matrix §23.6 is not marked passed; review 8 looks at every tuple first.
- Only read-only Git inspection was run.

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## Revision 8 (kickoff §25.2 R31, §26) — executor evidence

**Task path and status:** `tasks/Sprints/Sprint_88_kickoff_prompt_Task_912_Strikethrough_Only_For_Real_Reduction.md` §25.2 / §26 — `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Evidence prefix `r8-`. One Story file; no production file, test, key or token changed; no price, badge or colour touched. The owner accepted every §23.6 row (§26).

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` The change replaces a hand-written fixture arg with production's own computation in an existing Story wrapper; no component, Story, export or style is added.

### R31 (done)

`src/stories/patterns/mantine/ListingDetailView.stories.tsx`:
- `STORY_NOW = '2026-05-03T00:00:00.000Z'` (the fixture's `created_at` + 2 days) and `STORY_DATE_LOCALES = { en: enUS, it, uk, sq }`, with a comment citing `[slug]/page.tsx:3,243-244`;
- the wrapper `ListingDetailViewStory` passes `relativeTimeStr={formatDistance(new Date(props.listing.created_at), new Date(STORY_NOW), { addSuffix: true, locale: STORY_DATE_LOCALES[storyLocale] ?? enUS })}`;
- the `relativeTimeStr: '2 days ago'` arg is deleted and `'relativeTimeStr'` is added to the wrapper's `Omit<…>`. The search for `'2 days ago'` (single-quoted) in the file returns no hit.

### Files Changed (delta)

One path: `ListingDetailView.stories.tsx` `3bc68885…` → `ac74438b41d1222ea25ae19fe42425ee793806b8`. `ListingDetailPattern.stories.tsx` stays `65449bcc…`, `ListingContactPattern.stories.tsx` `05c80272…`. The production files are hash-equal to `r5-hashes.txt`: `theme.ts` `ba342c49…`, `MantineListingPrice.tsx` `199810d7…`, `MantineListingContactPattern.tsx` `979cda61…`, and the test `6e5e0700…`; `MantineListingDetailPattern.tsx` `aa1901d0…` and `ListingDetailView.tsx` `57ac2061…` are unchanged since Revision 2, so `r5-build.txt` stays the build for the production diff. `r8-status.txt` equals `r7-status.txt` outside the evidence folder.

### Verification (`r8-*.txt`, unpiped, exit printed in each)

| Command | Exit |
|---|---|
| `node -p process.platform` | 0 (`win32`) |
| `typecheck` | 0 |
| `lint` | 0 |
| `check:mojibake` | 0 |
| `build-storybook` | 0 |
| `r8-date.mjs` (new) | 0 → `r8-date.json`, `r8-date.txt` |
| `rv7-crops.mjs` | 0 → `r8-crops.txt` |
| `rv7-shots.mjs` | 0 → `r8-shots.txt` (the screenshots in `rv7-shots/` are rewritten) |

`rv7-crops.mjs` output equals `rv8-crops.txt` line for line (11 rows: badges, price, colour and struck text unchanged). The only byte difference is a UTF-8 byte-order mark on the first line of `rv8-crops.txt`, which is Opus's file and is not part of the output.

### AC27 (`r8-date.json`, the text beside the CalendarDays icon, 390px)

Every export (`PublicListing`, `PublicListingNotReduced`, `PublicListingConverted`, `StaffPreviewUnpublished`, `StaffPreviewPublished`, `ArchivedListing`):
- `en`: "2 days ago";
- `uk`: "2 днi тому" (date-fns `uk`);
- `sq`: "2 ditë më parë";
- `it`: "2 giorni fa".

No export shows an English relative date in a non-English locale.

### Receipts

- `GR-3b STORY RESPONSIVE CHECK — ListingDetailView exports: unchanged layout (a text value changed); overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE.` The last full probe (Revision 7, `r7-probe.txt`: 66 cells, `ovf` 0) precedes this change; the date text is one short line in the existing meta `Group wrap="wrap"`, and `r8-shots` was regenerated for every §23.6 tuple.
- `GR-3c TYPE RESPONSIVE CHECK — no text size changed (the date is the meta row's existing 14px dimmed text); ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`
- `GR-3d STORY GUTTER CHECK — ListingDetailView exports: n/a: own gutter (ListingsPageFrame.tsx:93-94); unchanged; side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.`
- `GR-3e TEXT BUTTONS STACKED — n/a: no popup.` · `GR-3f CIRCLE CHECK — n/a.` · `GR-3g CORNER CHECK — n/a: no line.`

### Limitations

- I did not re-run `r6-probe.mjs` (not in §25.2's verification list); no layout changed, and the screenshots were regenerated.
- Only read-only Git inspection was run.

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## Approval (Opus, 2026-10-03)

`APPROVED` — kickoff §27. The kickoff moved to `tasks/Archive/Sprint_88_kickoff_prompt_Task_912_Strikethrough_Only_For_Real_Reduction.md`; the "Task path" lines above record where it was at each revision. Final gate block run by Opus: `docs/sessions/evidence/task912/rv9-gates.txt` (every command exit 0, build included).
