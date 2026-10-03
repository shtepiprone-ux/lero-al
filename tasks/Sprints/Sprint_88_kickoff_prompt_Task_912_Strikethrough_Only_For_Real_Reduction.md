# Task 912 — a price is struck through only when the owner lowered it, and the contact card shows it

**Sprint:** 88 ([plan](Sprint_88_A_Struck_Price_Means_A_Reduction.md)) · **Priority:** P1 · **QA profile:** Q4 ·
**Filed:** 2026-10-01 · **Amended:** 2026-10-01 (owner decision D88-1, §5) · **Executor workflow:**
`.claude/skills/execute-task/SKILL.md` · **Required final status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approval.

> **Amended 2026-10-03 before execution (owner decision D89-9, Sprint 89 plan):** *"Зверху всюди (Recommended)"*. The
> contact card's struck old price sits **above** the current price, not below it. Every order statement below already
> reads the new order. The price **colour** (dark when not reduced, coral when reduced, D89-7) is **918**'s, not this
> task's: keep the main price's colour unchanged here.

## 1. Mode and task type

`TASK DESIGN` → bug fix (regression) on current Mantine UI, plus a latent instance of the same rule in the listing
card, plus the owner's contact-card price block (D88-1). Four production files change (§7). There is no new
component, string, token or route. One canonical Story is extended (§3.3).

## 2. Objective

The owner's rule, verbatim (2026-10-01): *"Перекреслена ціна має бути лише тоді, коли власник оголошення змінив ціну
на меньшу і тільки на меньшу."* After this task:

1. Every listing surface strikes a price through **only** when `price_old > price`.
2. The contact card's price block reads, top to bottom:
   - the old price in small struck text, **only** when `price_old > price` (D89-9: above the current price);
   - the current price (main);
   - on the next line, the original price in the listing's own currency, plain, only when the price is converted.

## 3. Verified context

All facts below were read in this session (2026-10-01) from the working tree. Re-measure at I0 (freshness only).

| # | Label | Fact | Source |
|---|---|---|---|
| F1 | FACT | The contact card renders `{originalPriceLabel}: {originalPrice}` inside `<Text size="xs" c="dimmed" td="line-through">`, under `<Text fw={700} size="xl" c="brand">{price.price}</Text>`, both in `<Stack gap="micro">`. `MantineListingContactPriceInfo` has `price`, `originalPrice?`, `originalPriceLabel?` and no old-price field. | `src/design-system/mantine/patterns/MantineListingContactPattern.tsx:17-21,152-161` |
| F2 | FACT | `originalPrice` is the converted-currency disclosure, not an old price. The route sets `originalPriceStr = needsConversion ? formatPrice(listing.price, listing.currency, locale) : null`, where `needsConversion = !!exchangeRates && !!authUser && preferredCurrency !== listing.currency`. | `src/app/[locale]/listings/[slug]/page.tsx:227,234` |
| F3 | FACT | The contact card's data path is `ListingDetailView.tsx:349-366` (`LazyListingContact` with `price={displayPrice}`, `currency={displayCurrencyCode}`, `originalPrice`, `originalPriceLabel`) → `ListingContact.tsx` props `:40-61` and the call `:213-217`, which builds `price={{ price: formatPrice(price, currency, locale), originalPrice, originalPriceLabel }}` → the pattern. `ListingDetailViewBody` already receives `isPriceReduced` and `displayPriceOld` (already converted to `displayCurrencyCode`) as props (`:193,198`). | those lines; `page.tsx:230-232` |
| F4 | FACT | The detail block renders the **same** disclosure plainly (`MantineListingDetailPattern.tsx:219-223`). It strikes `priceOld` (`<Text size="md" c="dimmed" td="line-through">`, `:207-211`) only when the view passes it, and `ListingDetailView.tsx:289` gates that on `isPriceReduced`. `isPriceReduced` is `listing.price_old && listing.price < listing.price_old` (`page.tsx:221`; admin preview `preview/page.tsx:77`). | those lines |
| F5 | FACT | **Regression origin.** Before `9596c60a5` (Task 793, 2026-09-06), the live card was legacy markup that rendered the line plainly: `<p className="text-xs text-muted-foreground mt-0.5">{originalPriceLabel}: {originalPrice}</p>`. The pattern's `td="line-through"` dates from `4715ad093` (Task 616) and went live only when 793 swapped the pattern in. | `git show 9596c60a5^:src/modules/listings/components/ListingContact.tsx` lines 161-163 |
| F6 | FACT | `ListingCard` passes `priceOld` whenever `listing.price_old` is truthy, in **both** branches. The pattern renders it as `<Text … size="xs" … td="line-through">` (list branch `MantineListingCardPattern.tsx:228-232`, grid branch `:371-373`, `size="xs" c="dimmed" td="line-through"`). | `src/modules/listings/components/ListingCard.tsx:123-125,203,292` |
| F7 | FACT | The same file's badge already uses the correct predicate: `listing.price_old && listing.price < listing.price_old`. So a card with `price_old <= price` today shows a struck price **and no** "price reduced" badge. | `ListingCard.tsx:99` |
| F8 | FACT | `price_old` is a free, optional owner-entered field. Validation is `z.number().positive().optional()`, so a value at or below `price` can be stored. | `src/modules/listings/validations/index.ts:9` |
| F9 | FACT | The card's own converted-currency line (`originalPriceStr`) is plain and stays out of scope. | `MantineListingCardPattern.module.css:315-329` |
| F10 | FACT | **Worktree at design time.** The files this task writes are clean. `docs/critical-flow-registry.md` and `messages/*.json` are modified by **Task 868**'s uncommitted work. | `git status --porcelain` 2026-10-01 |
| F11 | FACT | **Pre-change blob hashes:** `MantineListingContactPattern.tsx` `cb418386cafbc00aac8cd64d30c5f396314843fb` · `ListingCard.tsx` `d58d07b20e6e27a3bf39271382a57a3401c8e6db` · `ListingContact.tsx` `055561d9512565019dbbd82669f167f4909be2e8` · `ListingDetailView.tsx` `5ee5ed0876da0fa99f1efaab111c653f5965e52f` · `ListingContactPattern.stories.tsx` `c068f3d8ba5378cf2606aeba8e116aa7bd52e0f3`. | `git hash-object` 2026-10-01 |
| F12 | FACT | **Story fixtures.** `ListingContactPattern.stories.tsx:74-79` builds one `price` object (`card_price_1` "€80,000", `originalPrice` = `card_price_old_1` "€92,000"), and every section of `Default` reuses it (normal `:93`, loading `:122`, …). `ListingDetailPattern.stories.tsx:162-166` passes the same shape to its contact column. `ListingDetailView.stories.tsx` args carry `isPriceReduced: true`, `displayPrice: 125000`, `displayPriceOld: 138000` and `originalPriceStr: null` (`:146-159`). | those lines |
| F13 | FACT | **Existing tests.** `ListingCard.smoke.test.tsx` asserts the reduced case (`:142-154` grid, `:251-262` list) and the plain case (`:156-160`). It has no case for `price_old >= price`. No test renders `MantineListingContactPattern`. `ListingDetailView.favorite.test.tsx` renders `ListingDetailViewBody`. | test files |
| F14 | FACT | Two critical-flow rows bind `ListingCard`'s price output: "Listings display — price + date formatting" (`docs/critical-flow-registry.md:62`) and "Listing card rendering" (`:63`). | registry |
| F15 | INFERENCE | Only the contact card (F1) and the card (F6) strike a price for a non-reduction. Basis: every `line-through` / `td=` hit in `src/` was enumerated and opened: 4 pattern sites plus `StepPreview.tsx:62`, which sits in the dead `steps/` directory that **905** deletes. | grep, 2026-10-01 |

### 3.1 GR-1 census (`scripts/check-surface-census.mjs`, 2026-10-01, `win32`)

- `MantineListingContactPattern.tsx` → `GR-1 CENSUS COMPLETE — 1 nodes; tier1 1 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none.`
- `ListingCard.tsx` → `GR-1 CENSUS COMPLETE — 7 nodes; tier1 7 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none.`
- `ListingContact.tsx` and `ListingDetailView.tsx` → `GR-1 CENSUS BLOCKED`. Both get a one-prop pass-through and
  nothing else. Under D88-1 (§5) none of their unmigrated nodes is migrated here. Every one of them is baselined in
  `scripts/surface-census-baseline.json` and listed with its owner:

| Node | className | Owner |
|---|---|---|
| `ListingInquiryDialog`, `ListingReportDialog` (+ tier-2 `@/components/ui/{button,dialog,input,label,textarea}`) | 11 / 15 | **795** |
| `GalleryIsland`, `GalleryStaticFrame` | 0 / 5 | **794** |
| `MapWrapper` | 1 | **839** |
| `ListingShareButton` (story:yes, manifest:no) | 0 | **838** |
| `ViewAllLink` | 0 | **834** |
| `ClearRecentlyViewedButton` | 6 | **814** |
| `RecentlyViewedSection`, `RecentlyViewedGrid`, `SimilarListings`, `RecentlyViewedTracker`, `ViewTracker` | 0 / 0 / 1 / 0 / 0 | **913**, filed 2026-10-01 by this design (their former owner 792 is archived) |

`GR-1 CENSUS COMPLETE — pattern 1 node + card 7 nodes migrated+enrolled+story; pass-through parents ListingContact/ListingDetailView: tier1 unmigrated 13 listed with owners 794·795·834·838·839·814·913, tier2 5 primitives (owned by 795's dialogs); tier3 filed as 913.`

### 3.2 Visual source map

| Visible artifact/state | Component/markup | Selector / prop | Token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Contact card — main price | pattern `:153-155` | `fw={700} size="xl" c="brand"` | theme | preserved | F1 |
| Contact card — **old price** (new) | pattern, new `<Text size="xs" c="dimmed" td="line-through">` between the price and the disclosure | `price.priceOld` | `fontSizes.xs` (`theme.ts:685`), `c="dimmed"` | **added**, only when `priceOld` is passed | D88-1; idiom = `MantineListingCardPattern.tsx:371` |
| Contact card — converted-currency line | pattern `:156-160` | `td="line-through"` → **removed** | `xs`, `dimmed` | changed: decoration only; stays the last line | F1, F5 |
| Card — struck `priceOld` (grid + list) | `MantineListingCardPattern` | kept | unchanged | the container stops passing it unless reduced | F6 |
| Card — `price_reduced` badge | `ListingCard.tsx:99` | — | `sale` | preserved (predicate shared) | F7 |
| Detail block — `priceOld` + disclosure | `MantineListingDetailPattern:207-223` | — | — | preserved, not edited | F4 |

### 3.3 Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Shared style/token path and registration |
|---|---|---|---|---|
| Contact card price block (old price + disclosure) | `line-through`, `originalPrice`, `priceOld`, `original_price` over `src/`. Inspected: `MantineListingContactPattern.tsx`; `MantineListingDetailPattern.tsx:203-223`; `MantineListingCardPattern.tsx:228-232,366-373`; `ListingContactPattern.stories.tsx`; `ListingDetailPattern.stories.tsx`. | `Patterns/Mantine/ListingContactPattern` (`src/stories/patterns/mantine/ListingContactPattern.stories.tsx`, direct import `:7`) | **extend**: `MantineListingContactPriceInfo` gains `priceOld?: string`, rendered with the card pattern's existing struck-price idiom `size="xs" c="dimmed" td="line-through"` (`MantineListingCardPattern.tsx:371`). | No new value. Pattern already enrolled (`manifest:yes story:yes`). Story extended per §10.5. |

`GR-0 CANONICAL REUSE PREFLIGHT — request: contact-card struck old price + plain converted-currency line; semantic queries: line-through, priceOld, originalPrice, original_price; inspected candidates: MantineListingContactPattern.tsx + Patterns/Mantine/ListingContactPattern, MantineListingDetailPattern.tsx:203-223 + Patterns/Mantine/ListingDetailPattern, MantineListingCardPattern.tsx:228-232,366-373 + Patterns/Mantine/ListingCardPattern; decision: EXTEND; selected canonical owner: src/design-system/mantine/patterns/MantineListingContactPattern.tsx; Mantine/TailAdmin token path: theme.fontSizes.xs, c="dimmed", td="line-through" (MantineListingCardPattern.tsx:371 precedent); new hardcoded visual values: NONE; rationale: the old-price line reuses the card pattern's struck-price idiom inside the contact pattern that already owns the price block.`

`GR-3a STORY PREFLIGHT — MantineListingContactPattern × reduced price (old price + disclosure) and non-reduced (disclosure only); canonical candidates: Patterns/Mantine/ListingContactPattern (Default), Patterns/Mantine/ListingDetailPattern (Default), Patterns/Mantine/ListingDetailView (PublicListing); direct-import evidence: ListingContactPattern.stories.tsx:7; toolbar coverage: locale=toolbar globals.locale, viewport=toolbar; decision: EXTEND; target: Patterns/Mantine/ListingContactPattern — Default; rationale: the reduced state is a missing distinct state of the existing canonical Story; no new Story or export.`

`GR-3 STORY PROVEN — MantineListingContactPattern ← src/stories/patterns/mantine/ListingContactPattern.stories.tsx`

### 3.4 Type-scale table (GR-3c)

| Element | Role | base | sm | md | lg | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| Contact card main price | price | 20px | 20px | 20px | 20px | `xl` | unchanged (`:153`) |
| Contact card old price (new) | meta, struck | 12px | 12px | 12px | 12px | `xs` | `theme.ts:685`; owner: *"маленьким шрифтом"* (D88-1), position above the price (D89-9) |
| Contact card converted-currency line | meta | 12px | 12px | 12px | 12px | `xs` | unchanged size |

The executor confirms `xl` = 20px from `theme.ts` `fontSizes` at I0. No changed text is 24px or larger.

### 3.5 Width and gutter contracts (GR-3b, GR-3d) for the owner-matrix Stories

- **`Patterns/Mantine/ListingContactPattern` — `Default`.**
  - Width: `Grid.Col span={{ base: 12, md: 5, xl: 4 }}` = the pattern's default `sidebarFrom='md'` `rightSpan`
    (`MantineListingDetailPattern.tsx:146`).
  - GR-3d: all four sides `profile` — `StoryPageGutter` all (`:84`). The card's `Paper p="lg"` is internal padding.
    Action: `profile present`.
- **`Patterns/Mantine/ListingDetailPattern` — `Default`** (blast radius).
  - Width: fluid inside `StoryPageGutter` (`:268`).
  - GR-3d: all four sides `profile` (`:268`). Action: `profile present`.
- **`Patterns/Mantine/ListingDetailView` — `PublicListing`** (blast radius: its args are a reduced listing, so the
  contact card gains the struck €138,000).
  - Width: production `ListingsPageFrame`.
  - GR-3d: all four sides `own gutter (src/modules/listings/components/ListingsPageFrame.tsx:93-94`,
    `px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }} py="xl"`). **Action: remove the Story's doubled gutter in
    this task (§16, R10).** *Corrected in review 1:* this line originally said "Action: none". That was wrong,
    because the Story's meta has no `skipCanvas`, so `.storybook/preview.tsx` `withCanvas` wraps the frame in
    `.container-wide py-6`. The executor measured 32px left/right at 320, where production gives 16.

If any of these measures a side at 0 or a doubled gutter, GR-3d binds the executor to fix it in this task.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner 2026-10-01 | The contact card's converted-currency line renders with **no** `line-through`. Its text, `xs` size and `dimmed` colour are unchanged, and it is the **last** line of the price block. | P1 | AC1, AC6 | Confirmed |
| R2 | Owner 2026-10-01 | `ListingCard` (grid and list) passes `priceOld` **only** when `price_old > price`. | P1 | AC2, AC3 | Confirmed |
| R3 | F7 | One predicate decides both the card's struck price and its `price_reduced` badge. | P2 | source + AC2/AC3 | Confirmed |
| R4 | Preserve | A real reduction still shows the struck old price and the badge on the card (both branches, converted when conversion is active). The detail block is unchanged. | P1 | AC4 | Confirmed |
| R5 | Clause 15 | Both critical-flow regression commands keep their baseline. The new tests are recorded under rows `:62`/`:63`. | P1 | AC7; §10.6 | Confirmed |
| R6 | Q4 | A planted violation proves each new test can fail. | P1 | AC5 | Confirmed |
| R7 | D88-1 | When `price_old > price`, the contact card shows the old price in **`xs` struck `dimmed`** text directly **above** the current price (D89-9). It is formatted in the **same currency as the displayed current price** (the converted `displayPriceOld` when conversion is active). | P1 | AC8, AC9 | Confirmed |
| R8 | D88-1 | When `price_old` is null or `<= price`, the contact card shows no old price. | P1 | AC8, AC9 | Confirmed |
| R9 | D88-1, D89-9 | Order inside the card: old price (if any) → current price → converted-currency line (if any). | P1 | AC8 (DOM order), AC6 | Confirmed |

## 5. Assumptions and open questions

- **D88-1, owner decision 2026-10-01**, quoted verbatim in the Sprint 88 plan.
  - The contact card shows the struck old price only when it was higher, with the original-currency price on the next
    line. This is built **in 912**.
  - The owner gave the routing instruction after being told that the pass-through edits reach 13 unmigrated nodes
    owned by other tasks. So `ListingContact.tsx` and `ListingDetailView.tsx` get exactly one forwarded prop each and
    nothing else, and none of those nodes is migrated here (§3.1).
  - Any other edit to either file is `BLOCKED — CLAUSE 16d`.
- **A2.** `price_old` stays a free owner-entered field (F8). This task makes the display truthful whatever is stored.
- Open owner decisions: **none**.

## 6. Pre-read rule bundle

- `docs/golden-rules.md`: GR-0, GR-1, GR-2, GR-3, GR-3a, GR-3b, GR-3c, GR-3d, GR-4.
- `docs/agent-contract.md`: clauses 1, 3, 9, 14, 15, 16b-16d.
- `docs/qa-profiles.md`.
- `docs/critical-flow-registry.md`, rows `:62` and `:63`.
- `docs/component-rules.md` → "Container / Presentational Primitive Split".

## 7. Scope

Write paths (exact):

1. `src/design-system/mantine/patterns/MantineListingContactPattern.tsx`: add `priceOld?: string` to
   `MantineListingContactPriceInfo` and render it; remove `td="line-through"` from the disclosure.
2. `src/modules/listings/components/ListingContact.tsx`: one new optional prop `priceOld?: number`, formatted and
   forwarded. Nothing else.
3. `src/modules/listings/components/ListingDetailView.tsx`: pass `priceOld` to `LazyListingContact`. Nothing else.
4. `src/modules/listings/components/ListingCard.tsx`: one predicate (§10.4).
5. `src/stories/patterns/mantine/ListingContactPattern.stories.tsx`: extend `Default` (§10.5).
5a. `src/stories/patterns/mantine/ListingDetailView.stories.tsx`: the meta's `parameters` only (§16, R10). Added in
    review 1.
6. Tests:
   - `src/design-system/mantine/patterns/__tests__/MantineListingContactPattern.smoke.test.tsx` (new);
   - `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` (new cases).
7. `docs/critical-flow-registry.md`: only under §10.6's condition.
8. Records:
   - `docs/sessions/2026-10-0X-task912-strikethrough-only-for-reduction.md`;
   - 912's own row in `docs/backlog.md`;
   - evidence under `docs/sessions/evidence/task912/`.

## 8. Out of scope

- Any edit to `ListingContact.tsx` / `ListingDetailView.tsx` beyond the single prop (D88-1, §3.1).
- `[slug]/page.tsx` and `admin/listings/[id]/preview/page.tsx`. They already compute `isPriceReduced` and
  `displayPriceOld` correctly (F3, F4).
- `MantineListingCardPattern.tsx`, `MantineListingDetailPattern.tsx`, and every Story other than
  `ListingContactPattern.stories.tsx` and the `ListingDetailView.stories.tsx` meta parameter (§16).
- `messages/*.json` (dirty with 868's work). The Story uses existing keys only.
- `StepPreview.tsx` (deleted by **905**). How `price_old` is written (A2).

## 9. Current and required behavior

| Case | Today | Required |
|---|---|---|
| Converted, no reduction | Contact card: "Original price: 120 000 EUR" **struck** | Current price, then "Original price: …" plain |
| Converted, `price_old > price` | Contact card: struck "Original price", no old price | Struck old price (converted) · current price · "Original price: …" plain |
| Not converted, `price_old > price` | Contact card: current price only | Struck old price · current price |
| `price_old` null or `<= price` | Contact card: current price (+ struck disclosure if converted) | Current price (+ plain disclosure if converted) |
| Card, `price_old > price` | Struck old price + badge | Unchanged |
| Card, `price_old <= price` | Struck `price_old`, no badge | No struck price, no badge |
| Detail block | Struck old price when reduced | Unchanged |

## 10. Implementation requirements

1. **Pattern.** In `MantineListingContactPriceInfo` add `priceOld?: string`. Inside the existing `<Stack gap="micro">`,
   render in this order:
   - `{price.priceOld && <Text size="xs" c="dimmed" td="line-through">{price.priceOld}</Text>}`;
   - the main price, unchanged;
   - the disclosure, with `td="line-through"` deleted and `size="xs" c="dimmed"` kept.

   No other change.
2. **`ListingContact.tsx`.** Add `priceOld?: number` to the props, documented as "Already in `currency`; passed
   only when the owner lowered the price". In the `price` object add
   `priceOld: priceOld != null ? formatPrice(priceOld, currency, locale) : undefined`.
3. **`ListingDetailView.tsx`.** On `LazyListingContact` add
   `priceOld={isPriceReduced && displayPriceOld != null ? displayPriceOld : undefined}`. This uses the same gate and
   the same converted value as the detail block's `:289`.
4. **`ListingCard.tsx`.** Add a module-level `isListingPriceReduced(listing)` that returns
   `listing.price_old != null && listing.price < listing.price_old`.
   - Use it in `getBadges` (`:99`).
   - Use it at both `priceOld` sites:
     `priceOld: isListingPriceReduced(listing) && displayPriceOld != null ? formatPrice(displayPriceOld, activeCurrency, locale) : undefined`.
   - Do not keep a second copy of the comparison.
5. **Story.** In `ListingContactPattern.stories.tsx` → `Default`, add
   `const priceReduced = { ...price, priceOld: storyT(l, 'storybook.mantine.card_price_old_1') }` and pass it to the
   **first** ("normal") section only. Every other section keeps `price`, so the Story shows both states.
   - In the shared `price` object, change `originalPrice` to `storyT(l, 'storybook.mantine.card_price_1')`
     (precedent: `ListingDetailPattern.stories.tsx:364`). Otherwise the struck old price and "Original price" would
     read the same €92,000.
   - Add no Story, export, string key, wrapper or style.
6. **Critical-flow registry.** At I0 run `git status --porcelain -- docs/critical-flow-registry.md`.
   - Empty output: add the new test files to rows `:62`/`:63`.
   - A line printed (868's work): do not edit the file. Put the exact row text in the session log under "Registry
     addition owed".
7. **Tests (observable behaviour).**
   - New `MantineListingContactPattern.smoke.test.tsx`, using the harness shape of
     `MantineListingCardPattern.smoke.test.tsx:15-35`. It asserts:
     - (a) with `priceOld` + `originalPrice`: the old price text is present with `line-through`; the "Original
       price: …" text is present **without** it; the DOM order is old price → main price → disclosure (D89-9;
       corrected in review 1, the pre-D89-9 order was left here by mistake);
     - (b) without `priceOld`: no element with `line-through`;
     - (c) without `originalPrice`: no disclosure.
   - `ListingCard.smoke.test.tsx`, both variants:
     - `price_old == price` and `price_old < price` → no struck old price, no badge;
     - one converted reduced case (`displayCurrency` + `rates`) → the struck value is the **converted** old price.
   - `ListingDetailView.favorite.test.tsx` must still pass unchanged.

## 11. Positive and negative flows

**Positive:**
1. A signed-in user sets the preferred currency to ALL.
2. They open a EUR listing whose owner lowered the price from 92 000 to 80 000.
3. The contact card shows the current price in ALL, then the struck old price in ALL, then "Original price: 80 000 EUR"
   plain.
4. The detail block shows the same struck old price.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| `price_old` equal to or below `price` | Yes | F8 | No struck price, no badge, on card, contact card and detail | AC2, AC3, AC9 |
| Exchange rates unavailable / guest | Yes (preserve) | `page.tsx:227` | No conversion, no disclosure; the old price (if reduced) in the listing currency | AC8 (b) form, existing path |
| Staff preview | Yes (preserve) | `preview/page.tsx:77,85` | Same gate; the contact card shows the struck old price when reduced | unchanged code path; F4 |
| Validation / Authorization / Offline / Concurrent writer | No | read-only display | N/A | — |

## 12. Acceptance criteria

- **AC1 [R1]** Given `MantineListingContactPattern` with `originalPrice`, then "Original price: …" is present and its
  `text-decoration-line` is not `line-through`. Without `originalPrice`, it is absent.
- **AC2 [R2, R3]** Given a `ListingCard` (grid and list) with `price_old === price`, then no element whose text is the
  old price has `line-through`, and "Price reduced" is absent.
- **AC3 [R2, R3]** Given `price_old < price`, the same as AC2.
- **AC4 [R4]** Given `price_old > price`, with and without conversion, then the struck old price (converted when
  active) and "Price reduced" render in both variants. The existing tests at `:142` and `:251` pass unchanged.
- **AC5 [R6]** Plants (§13.3):
  - A: re-add `td="line-through"` to the disclosure;
  - B: restore `displayPriceOld ? …` at both card sites;
  - C: drop the `priceOld` render in the pattern.

  Each makes its test fail. When restored, the test passes and `git hash-object` equals the post-fix value.
- **AC6 [R1, R9]** Given Storybook `Patterns/Mantine/ListingContactPattern` → `Default` at 320 and 1440:
  - the "normal" section shows main price → struck old price → plain "Original price";
  - the other sections show no struck text;
  - all four GR-3d sides are non-zero.
- **AC7 [R5]** Given the two critical-flow commands, run before and after, their pass/fail sets are equal apart from
  the new tests, which pass.
- **AC8 [R7, R8, R9]** Given the pattern test (a)/(b), the old price is struck, comes before the main price in DOM
  order and sits above it, the disclosure follows the main price, and is absent when `priceOld` is not passed.
- **AC9 [R7, R8]** Given `ListingDetailView` source, `LazyListingContact` receives `priceOld` only under
  `isPriceReduced`. Given `Patterns/Mantine/ListingDetailView` → `PublicListing` (`isPriceReduced: true`,
  `displayPriceOld: 138000`), the contact card shows a struck "138,000 EUR" **above** "125,000 EUR" (D89-9; the
  contact card formats through `formatPrice`, so the text is `138,000 EUR`, not the detail block's fixture
  `€125,000` string).

`GR-4 AC AUDIT — 9 criteria; each states an observable property; absolutes: none.`

## 13. QA profile and verification plan

**Q4.** The change touches two critical-flow rows (F14). It is a visible change on an existing surface, which needs
the Q2 rendered widths. There is no new primitive, overlay or layout.

### 13.1 I0 baseline (before any write)

```powershell
node.exe -p process.platform
git --no-optional-locks status --porcelain
git hash-object src\design-system\mantine\patterns\MantineListingContactPattern.tsx src\modules\listings\components\ListingCard.tsx src\modules\listings\components\ListingContact.tsx src\modules\listings\components\ListingDetailView.tsx src\stories\patterns\mantine\ListingContactPattern.stories.tsx
npx.cmd vitest run src/lib/__tests__/price-format-ssr-parity.smoke.test.ts src/lib/__tests__/date-format-icu-independence.smoke.test.ts src/lib/__tests__/date-format-ssr-parity.smoke.test.ts
npx.cmd vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx src/modules/listings/components/__tests__/ListingDetailView.favorite.test.tsx
```

Expected:
- `win32`.
- The hashes equal F11. A mismatch is a stop: report it.
- Record every vitest pass/fail list verbatim. `ListingCard.smoke.test.tsx` may already be red on the two
  archived-badge cases (reserved **790**). Record them; do not fix them.

### 13.2 Final gate block (after the last write, one pass, transcript retained)

```powershell
node.exe -p process.platform
npx.cmd vitest run src/design-system/mantine/patterns/__tests__/MantineListingContactPattern.smoke.test.tsx src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx src/modules/listings/components/__tests__/ListingDetailView.favorite.test.tsx
npx.cmd vitest run src/lib/__tests__/price-format-ssr-parity.smoke.test.ts src/lib/__tests__/date-format-icu-independence.smoke.test.ts src/lib/__tests__/date-format-ssr-parity.smoke.test.ts
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:design-tokens
npm.cmd run check:story-coverage
npm.cmd run check:rendered-scope
npm.cmd run check:mojibake
npm.cmd run build
git hash-object src\design-system\mantine\patterns\MantineListingContactPattern.tsx src\modules\listings\components\ListingCard.tsx src\modules\listings\components\ListingContact.tsx src\modules\listings\components\ListingDetailView.tsx src\stories\patterns\mantine\ListingContactPattern.stories.tsx src\design-system\mantine\patterns\__tests__\MantineListingContactPattern.smoke.test.tsx src\modules\listings\components\__tests__\ListingCard.smoke.test.tsx
git --no-optional-locks status --porcelain
```

Expected:
- The new tests pass, and the pre-existing failures equal the I0 list.
- Every `npm.cmd` command exits 0. `build` is the hard gate.
- `git status` shows only §7 paths plus pre-existing unrelated entries.

After the block, re-run the four §3.1 censuses. Each pass-through parent must report exactly its §3.1 node set, with
nothing new.

### 13.3 Plants (AC5)

- Use Node `readFileSync`/`writeFileSync`, never `Get-Content -Raw`.
- Record `git hash-object` before each plant and after each restore. Both must equal the post-fix hash.
- Plants A and C (pattern) must fail the pattern test. Plant B (card) must fail the AC2/AC3 cases.
- Retain all three transcripts.

### 13.4 Rendered checks (AC6, AC9, GR-3b/3c/3d)

Build Storybook and measure the three §3.5 Stories:
- `en` at **320, 390, 768, 1024, 1440**;
- `sq`, `uk` and `it` at 320 and 1440 (`uk@320` is mandatory).

For each, record:
- the price block's line order;
- each line's computed `text-decoration-line` and `font-size`;
- all four edge distances.

Emit `GR-3b`, `GR-3c` and `GR-3d` receipts per Story.

### 13.5 OWNER VISUAL QA REQUIRED

| Story | State | Locales | Viewports |
|---|---|---|---|
| `Patterns/Mantine/ListingContactPattern` | `Default`: "normal" section (reduced, three lines) and "loading" section (no old price) | sq · en · uk · it | 320 · 1440 |
| `Patterns/Mantine/ListingDetailView` | `PublicListing` (contact card, struck €138,000) | en · uk | 390 · 1440 |
| `Patterns/Mantine/ListingDetailPattern` | `Default` (sidebar contact card, plain "Original price") | en | 1440 |

Owner live check after deploy (non-command steps):

1. Sign in and set the preferred currency to one different from a listing's currency.
2. Open a listing **without** a reduction. No struck price appears anywhere, and "Original price" is plain under the
   price.
3. Open a listing whose owner **lowered** the price. The contact card shows the current price, then the struck old
   price in your currency, then "Original price" plain. The detail block shows the same struck old price.

## 14. Completion report contract

Write the session log `docs/sessions/2026-10-0X-task912-strikethrough-only-for-reduction.md`. It contains:
- a Files Changed table matching `git status`;
- R1–R9 status;
- every command with its exit code;
- the I0 vs final vitest pass/fail lists;
- plant transcripts with hashes;
- rendered measurements;
- receipts GR-0, GR-1 (all four censuses), GR-3, GR-3a, GR-3b, GR-3c, GR-3d;
- the registry outcome (§10.6);
- assumptions, deviations and limitations.

Update only 912's row in `docs/backlog.md`. End with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED` or `BLOCKED`. No git commands.

## 15. Task quality gate

- Fresh-session executable: every path, line, hash and command above was read or run on 2026-10-01.
- Absence claim F15 rests on a whole-`src` grep with each hit opened.
- No new visual value: the old-price line reuses `MantineListingCardPattern.tsx:371`'s idiom. No new string key:
  the Story reuses `card_price_1` / `card_price_old_1`.
- Clause 16d: every unmigrated node of the two pass-through parents is listed with its owner. The five with no open
  owner are filed as **913**. The pass-through scope rests on owner decision D88-1, quoted in the Sprint 88 plan.
- Dirty worktree: the shared `docs/critical-flow-registry.md` has an explicit conditional (§10.6). `messages/*.json`
  is not written.

## 16. Revision 1 (review 1, 2026-10-03): `NEEDS REVISION`

**Re-entry mode: `remediation`.** The production change, tests, plants and the `ListingContactPattern` Story change
were inspected in review 1. Their final hashes equal `docs/sessions/evidence/task912/41-hashes.txt`. Keep them.
**Do not edit** `MantineListingContactPattern.tsx`, `ListingCard.tsx`, `ListingContact.tsx`, `ListingDetailView.tsx`,
`ListingContactPattern.stories.tsx` or either test file. Do not re-run the I0 block or the plants. Keep every
existing evidence file and write new ones with an `r1-` prefix.

### 16.1 Finding F1 (P2, GR-3d): `ListingDetailView/PublicListing` has a doubled gutter

- **Observed.** At `en@320`, `31-measure.json` gives `gut` left/right **32/32**, and **96/96** at 1440.
- **Cause.** `src/stories/patterns/mantine/ListingDetailView.stories.tsx` meta (`:142-170`) has no `parameters`, so
  `.storybook/preview.tsx:135-145` `withCanvas` wraps the Story in `<div className="container-wide py-6">`. The
  production frame inside (`ListingsPageFrame.tsx:93-94`) already sets `px={{ base: 'md', … }} py="xl"`, and the
  breadcrumb band (`:52-56`) sets its own `px`. So the canvas adds a second gutter on all four sides.
- **Precedent.** `ListingsPageFrame.stories.tsx:10`, `ListingDetailPattern.stories.tsx:31` and
  `ListingContactPattern.stories.tsx:15` all set `skipCanvas: true`.
- **Why it is in 912.** GR-3d covers every Story in the owner matrix (§13.5), and this one is in it. §3.5 wrongly
  said "Action: none". That line is corrected above.

**R10 [GR-3d] (P2).** In the meta of `ListingDetailView.stories.tsx`, add `parameters: { skipCanvas: true }`. Add
nothing else: no `StoryPageGutter`, padding, wrapper or `style`. The change affects all three exports
(`PublicListing`, `StaffPreviewUnpublished`, `StaffPreviewPublished`). All three render the same frame.

**AC10 [R10].** Given `Patterns/Mantine/ListingDetailView`, each of its three exports at 320, 390, 1024 and 1440
(`en`), plus `PublicListing` at `uk@320`:
- left/right equal the frame's own `px` (16 / 16 / 32 / 32, the `ListingsPageFrame.tsx:93` ladder);
- no side is 0;
- nothing exceeds the frame's own value.

Measure the top edge to the first visible text. That is the breadcrumb band's own `padding-block`
(`ListingsPageFrame.module.css:10`, 10px), which is a production gutter, so it is not added in the Story. Also
record the contact card's price block order: struck `138,000 EUR` above `125,000 EUR`.

### 16.2 Gate expectation for `check:design-tokens` (corrected)

§13.2 required every `npm.cmd` command to exit 0. Review 1 accepts the run's single finding,
`src/design-system/mantine/patterns/MantineNavRowList.module.css:24`. That file is untracked work of **Task 857**
(Sprint 78). It is named in that kickoff and is not a §7 path.

From now on, the criterion is: **`check:design-tokens` reports no finding in a §7 path.** If it still exits 1 on
another task's file, record that path and its owning task, and do not edit it.

Every other §13.2 command must still exit 0.

### 16.3 Revision gate block (one pass, transcript retained, exit code printed after each command)

```powershell
node.exe -p process.platform
node.exe -v
npx.cmd vitest run src/design-system/mantine/patterns/__tests__/MantineListingContactPattern.smoke.test.tsx src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx src/modules/listings/components/__tests__/ListingDetailView.favorite.test.tsx
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:design-tokens
npm.cmd run check:story-coverage
npm.cmd run check:mojibake
npm.cmd run build
npm.cmd run build-storybook
git hash-object src\stories\patterns\mantine\ListingDetailView.stories.tsx src\design-system\mantine\patterns\MantineListingContactPattern.tsx src\modules\listings\components\ListingCard.tsx src\modules\listings\components\ListingContact.tsx src\modules\listings\components\ListingDetailView.tsx src\stories\patterns\mantine\ListingContactPattern.stories.tsx
git --no-optional-locks status --porcelain
```

Expected:
- Every command exits 0, except `check:design-tokens` under §16.2.
- The six hashes after the first are unchanged from `41-hashes.txt`.
- After the block, re-measure `AC10` with the existing `docs/sessions/evidence/task912/measure.mjs` (or an `r1-`
  copy). Write the output to `r1-measure.json`.
- Re-measure `ListingContactPattern/Default` at 320 and 1440 as a control. It must be unchanged.

Receipts:
- `GR-3b`, `GR-3c` and `GR-3d`, one per export of `ListingDetailView` with the measured values.
- `GR-3e`: no popup is opened. Write `n/a: no popup`.
- `GR-3f`: no circular element changed. Write `n/a`.

### 16.4 Completion

Append a `## Revision 1` section to `docs/sessions/2026-10-03-task912-strikethrough-only-for-reduction.md`. Include
the Files Changed delta (one path), the block transcript with exit codes, the AC10 table and the receipts. Update
912's row in `docs/backlog.md`. The registry addition (§10.6) stays owed while `docs/critical-flow-registry.md` is
dirty. End with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.
