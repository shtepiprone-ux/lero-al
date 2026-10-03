# Task 912 — a price is struck through only when the owner lowered it, and the contact card shows it

**Sprint:** 88 ([plan](Sprint_88_A_Struck_Price_Means_A_Reduction.md)) · **Priority:** P1 · **QA profile:** Q4 ·
**Filed:** 2026-10-01 · **Amended:** 2026-10-01 (owner decision D88-1, §5) · **Executor workflow:**
`.claude/skills/execute-task/SKILL.md` · **Required final status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approval.

> **Amended 2026-10-03 before execution (owner decision D89-9, Sprint 89 plan):** *"Зверху всюди (Recommended)"*. The
> contact card's struck old price sits **above** the current price, not below it. Every order statement below already
> reads the new order. The price **colour** (dark when not reduced, coral when reduced, D89-7) is **918**'s, not this
> task's: keep the main price's colour unchanged here.

> **Revision 3 (2026-10-03, review 3): §19 is the current executable route.** It touches one Story fixture only. §18
> is implemented and verified apart from that fixture.
>
> **Revision 2 (2026-10-03, owner return on the review-2 matrix): §18.** It adds the
> shared `MantineListingPrice`, the "price in the owner's currency" label and Story fixtures that follow production.
> Precondition §18.6: shared files free of other tasks' uncommitted work. The gallery is **794** (D88-5), not 912.

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
- left/right equal the frame's own `px` (16 / 16 / 32 / **64**, the `ListingsPageFrame.tsx:93` ladder; *corrected in
  review 2:* at 1440 the frame's `xxl` rung gives `3xl` = 48px, and `maw="var(--width-page-max)"` (1408px) centres it
  by a further 16px, so production shows 64. The original "32" ignored both);
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

## 17. Review 2 (2026-10-03): Revision 1 verified — `PARTIALLY VERIFIED`, owner matrix owed

**Scope reviewed.** One changed path: `src/stories/patterns/mantine/ListingDetailView.stories.tsx`, meta
`parameters: { skipCanvas: true }` (blob `40da042b`). The six untouched files and both test files hash-equal
`41-hashes.txt` / `r1-hashes.txt`. The revision gate block (`r1-summary.txt`, `win32`, Node v22.22.3) exits 0 on every
command, `check:design-tokens` included (0 violations). Vitest is 27/27, and build and build-storybook were run after the
Story edit (08:16 edit, gate from 08:16:59).

**Reviewer measurement** (`docs/sessions/evidence/task912/rv2-opus-probe.cjs` → `rv2-opus-probe.json`, the built
`storybook-static`, `deviceScaleFactor` 1, a clip-aware probe independent of the executor's):

| Story | 320 t/r/b/l | 390 | 1024 | 1440 | Contact card order |
|---|---|---|---|---|---|
| `ListingDetailView` ×4 exports (`PublicListing`, `StaffPreviewUnpublished`, `StaffPreviewPublished`, `ArchivedListing`) | 10/16/56/16 | 10/16/56/16 | 10/32/56/32 | 10/64/56/64 | struck `138,000 EUR` 12px → `125,000 EUR` 20px |
| `ListingDetailView/PublicListing` `uk` | 10/16/56/16 | — | — | 10/64/56/64 | `138 000 EUR` struck → `125 000 EUR` |
| `ListingContactPattern/Default` (control) | 24/16/24/16 | 24/16/24/16 | 24/–/24/32 | 24/–/24/32 | first section `€92,000` struck → `€80,000` → plain "Original price"; later sections have no struck text |

- There is no `.container-wide` wrapper, and `#storybook-root` padding is 0. The Story adds nothing. Top 10 is the
  breadcrumb band's own `padding-block`. Bottom 56 is the frame's `py="xl"` (24) plus `ListingDetailView.tsx:404`
  `pb="2xl"` (32). Both are production values. No horizontal overflow.
- **1440 = 64 is production** (`theme.ts` `xxl: '90em'`, `3xl` = 48px; `globals.css:299` `--width-page-max: 88rem`).
  AC10 is corrected in §16.1. The original "32" was an orchestrator error, not an executor deviation.
- §16.1 said "three exports". The meta change reaches the fourth, `ArchivedListing`, too. The reviewer measured it, and
  it matches.
- GR-1 re-run (`win32`): the pattern has 1 node and the card 7, all migrated, enrolled and storied. The two
  pass-through parents report exactly §3.1's node set, with nothing new.

**Requirement status.** R1–R4, R6–R10 and AC1–AC6, AC8–AC10 are `VERIFIED` (AC1–AC9 from review 1, AC10 here).
- **R5 / AC7: `PARTIALLY VERIFIED`.** The regression commands keep their baseline (review 1). The registry addition
  (§10.6) is still owed: `docs/critical-flow-registry.md` is now dirty with **Task 857**'s uncommitted line on the
  "Listing public visibility invariant" row, not 868's.
- **Visual criterion: `NOT VERIFIABLE`** until the owner returns §13.5.

**NOTE (P3, not a 912 finding).** `Patterns/Mantine/ListingDetailPattern/Default` shows its first content 104px from
the top at every width: 24 from `StoryPageGutter` plus the `Box pt={theme.other.layout.listingContactStickyOffset}`
(80) that Task 886 R11 put there on purpose. It keeps the sticky contact card level with the gallery at `lg+`
(Story comment `:231-239`). Below `lg` the sticky offset is inactive, so the 80px is a Story-only top gap at 320/390.
This is pre-existing and approved in 886. 912 does not change it. The §13.5 row for this Story is `en@1440`, where the
spacer does its job. Record it at the owner matrix, and change nothing here.

**Receipts (review).**
- `GR-1 CENSUS COMPLETE — pattern 1 node + card 7 nodes migrated+enrolled+story; pass-through parents ListingContact/ListingDetailView: unchanged §3.1 set (13 tier-1 with owners 794·795·834·838·839·814·913, tier-2 primitives owned by 795's dialogs); tier3 filed as 913.`
- `GR-3b STORY RESPONSIVE CHECK — ListingDetailView ×4: 320 320/320 · 390 390/390 · 1024 1024/1024 · 1440 1440/1440 (fluid, production frame); overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE.`
- `GR-3c TYPE RESPONSIVE CHECK — ListingDetailView/PublicListing: H1 320 20px · 390 20px · 1024 36px · 1440 36px; H2 18 · 18 · 24 · 24 (r1-measure.json); contact price 20px, old price 12px; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`
- `GR-3d STORY GUTTER CHECK — ListingDetailView ×4: gutter n/a: own gutter (ListingsPageFrame.tsx:93-94, :52-56; ListingDetailView.tsx:404); top/right/bottom/left 320 10/16/56/16 · 390 10/16/56/16 · 1024 10/32/56/32 · 1440 10/64/56/64 (expected the frame's own values); side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.`
- `GR-3e TEXT BUTTONS STACKED — n/a: no popup opened.` · `GR-3f CIRCLE CHECK — n/a: no circular element changed.` · `GR-3g CORNER CHECK — n/a: no line changed.`

**What closes 912.**
1. The owner returns the §13.5 matrix.
2. Once `docs/critical-flow-registry.md` carries no other task's uncommitted change, the §10.6 rows `:62` and `:63` are
   added (exact text in the session log, "Registry addition owed"), and nothing else in that file changes.
3. Then comes the approval review. No executor code work is owed.

## 18. Revision 2 (owner return on §17's matrix, 2026-10-03): `NEEDS REVISION`

**§18 supersedes §7, §8, §10, §12 and §13 wherever they conflict.** Re-entry mode: `remediation`. Keep these as they
are:
- the card predicate (`ListingCard.tsx`);
- `ListingContact.tsx`;
- both existing test files;
- every earlier evidence file;
- the plants.

New evidence files use an `r2-` prefix.

### 18.1 Owner return, verbatim (2026-10-03)

- On `ListingContactPattern/Default`: *"Original price: має з'являтись лише при умові, якщо користувач змінив у себе в
  налаштуваннях валюту. Якщо валюта співпадає з валютою користувача - Original price: не показується!"*
- On `ListingDetailView/PublicListing`: *"Стара ціна завжди має бути над поточною ціною. … в одній картці є стара ціна,
  в іншій немає."*
- On `ListingDetailPattern/Default`: *"Як … користувач може зрозуміти що це … за оригінальна ціна? … В розумінні
  людини Original price - це ціна, яка була спочатку виставлена. А в нас є три види ціни: 1. Original price -
  оригінальна перша ціна від власника 2. Ціна у валюті власника - … та валюта, яка була обрана під час
  створення/редагування оголошення. 3. Знижена ціна - ціна, яку власник знизив під час редагування оголошення. Тільки
  в цьому випадку має показуватись перечеркнута оригінальна ціна над ціною зі зножкою!"*
- On the gallery: the listing page still renders the legacy gallery, not the Rozetka-style
  `MantineListingGalleryPattern`. The owner chose the routing as **D88-5**, option chosen verbatim: *"Окремо 794,
  одразу після 912 (Recommended)"*. The gallery is **not** 912's. **794** runs first after 912 and before 918.

### 18.2 What was wrong (measured by review 2's probe, `rv2-opus-probe.json`)

| # | Defect | Source |
|---|---|---|
| D1 | The converted-currency line is labelled "Original price". The owner reads that as the first price the listing owner set. It is really **the price in the listing owner's currency**. | `listing.original_price` in `messages/*.json` → `ListingDetailView.tsx:290,357` |
| D2 | One page uses two layouts. The detail block puts the struck old price **beside** the current price (`Group`, 16px). The contact card puts it **above** (12px). | `MantineListingDetailPattern.tsx:203-217` vs `MantineListingContactPattern.tsx:152-166` |
| D3 | The Story fixtures contradict production. In `ListingContactPattern/Default` and the `ListingDetailPattern` E4 section, "Original price" shows the same value and currency as the price. `ListingDetailPattern`'s contact card shows `€92,000` as a plain "Original price", while its detail block strikes the same €92,000. The `ListingContactPattern` sections disagree: one has an old price and the rest do not. | `ListingContactPattern.stories.tsx:74-79`; `ListingDetailPattern.stories.tsx:162-166,206-207,364` |
| D4 | Price strings are written by hand. The `ListingDetailView` Story arg `formattedPrice: '€125,000'` sits beside the contact card's `formatPrice` output `125,000 EUR`. Both pattern Stories pass `card_price_1` / `card_price_old_1` (`€80,000`) instead of using the production formatter. | `ListingDetailView.stories.tsx` args; both pattern Stories |

### 18.3 Price semantics (binding for every surface this task touches)

| Owner's term | Meaning | Shown when | How |
|---|---|---|---|
| Original price | the higher price before the listing owner lowered it (`price_old`) | only when `price_old > price` | **struck, `xs` dimmed, no label, on its own line above the current price** |
| Current price | `price`, in the viewer's currency when converted | always | `xl` 700 `brand` (the colour is 918's, D89-7) |
| Price in the owner's currency | `price` in `listing.currency` | only when the signed-in viewer's preferred currency differs from `listing.currency` (production `needsConversion`, `[slug]/page.tsx:227`, unchanged) | `xs` dimmed, **not struck**, last line: "{label}: {value}", with the new label |

### 18.4 Requirements

| ID | Requirement | P | AC |
|---|---|---|---|
| R11 | **New shared pattern `MantineListingPrice`** (`src/design-system/mantine/patterns/MantineListingPrice.tsx`), moved here from 918 R17 (§18.7). Props: `price: string`; `priceOld?: string`; `trailing?: ReactNode`, rendered on the current price's row; `ownerCurrency?: { label: string; value: string }`; `size?: 'xl'`, default `'xl'` (918 adds `lg`/`sm`). Markup, top to bottom inside `Stack gap="micro"`: when `priceOld` is set, `Text size="xs" c="dimmed" td="line-through"`; then `Group gap="sm" align="baseline" wrap="wrap"` holding `Text fw={700} size="xl" c="brand"` (the price) and `trailing`; then, when `ownerCurrency` is set, `Text size="xs" c="dimmed"` "{label}: {value}". No other visual value, no `style`, no CSS module, no raw px. Export it from `patterns/index.ts` and enrol it in `scripts/mantine-migration-scope.json`. | P1 | AC11 |
| R12 | `MantineListingContactPattern` renders its price block through `MantineListingPrice`. It passes `priceOld`, and `ownerCurrency` built from `originalPrice`/`originalPriceLabel` when `originalPrice` is set. The prop names of `MantineListingContactPriceInfo` stay; their doc comments say "price in the owner's currency". | P1 | AC12 |
| R13 | `MantineListingDetailPattern` replaces `:203-223` (the price `Group` and the separate disclosure `Text`) with one `MantineListingPrice`. It passes `priceOld`; `trailing` = the existing per-m² `Text`, moved as is; and `ownerCurrency` from `originalPrice`/`originalPriceLabel`. The struck old price moves **above** the price and becomes `xs` (it was `md`, beside the price). Nothing else in the pattern changes. | P1 | AC12 |
| R14 | Label: a new key `listing.price_in_owner_currency` in all four locales: uk *"Ціна у валюті власника"* (the owner's words), en *"Price in the owner's currency"*, sq *"Çmimi në monedhën e pronarit"*, it *"Prezzo nella valuta del proprietario"*. `ListingDetailView.tsx:290` and `:357` change `t('original_price')` to `t('price_in_owner_currency')`. These two key literals are the **only** other edit to that file (D88-1, extended by §18.1). Then `git grep` that no consumer remains, and delete `listing.original_price` and `storybook.mantine.listing_detail_original_price_label` from all four files. | P1 | AC13 |
| R15 | **Story fixtures follow production.** No price string in the four Stories is written by hand. Every price is `formatPrice(<number>, <currency>, l)` (`src/lib/formatters.ts:64`). Every converted value is `convertPrice(…, rates)` (`src/lib/getExchangeRate.ts:18`) with `const rates: ExchangeRates = { ALL: 1, EUR: 100 }`, the `ListingCard.smoke.test.tsx:189` fixture. Labels come from `storyT(l, 'listing.price_in_owner_currency')`, the production key; `storyT` resolves any key (`src/stories/_storyI18n.ts`). | P1 | AC14 |
| R16 | `ListingContactPattern.stories.tsx` → `Default`: **every** section uses one price fixture. It is reduced and not converted, with the same numbers as `ListingDetailView` (`125000` / `138000` `EUR`). So every contact card shows the struck `138,000 EUR` above `125,000 EUR` and **no** owner-currency line. Delete `priceReduced`. The price states are proven in `ListingPrice` (R18), not here. | P1 | AC14 |
| R17 | `ListingDetailPattern.stories.tsx` → `Default`: `base.data.price`/`priceOld` and `demoContact`'s `price` come from the same numbers (`80000` / `92000` `EUR`), so the detail block and the contact card both strike `92,000 EUR` above `80,000 EUR`. `demoContact` passes **no** `originalPrice`. The E4 section (`listing_detail_section_original_price`) becomes the converted case: display currency `ALL`, `price` = converted `80000`, `priceOld` = converted `92000`, `originalPrice` = `formatPrice(80000, 'EUR', l)`. Its `contact` gets the same converted price object, with the owner-currency line. Update that section label's value in all four locales so it says the section shows a converted price (en *"Converted price — the viewer chose another currency"*). | P1 | AC14 |
| R18 | New Story `src/stories/patterns/mantine/ListingPrice.stories.tsx`, title `Patterns/Mantine/ListingPrice`, one export `Default`, wrapped in `StoryPageGutter`. It has four labelled sections: not reduced, reduced, converted, and reduced + converted (fixtures per R15). Add four new section-label keys `storybook.mantine.listing_price_section_{plain,reduced,converted,reduced_converted}` in all four locales. | P1 | AC11 |
| R19 | `ListingDetailView.stories.tsx`: the Story wrapper computes `formattedPrice = formatPrice(props.displayPrice, props.displayCurrencyCode, storyLocale)`. Delete the `formattedPrice` arg. The `skipCanvas` parameter stays. | P1 | AC14 |

### 18.5 Acceptance criteria

- **AC11 [R11, R18]** `MantineListingPrice.smoke.test.tsx` is new and uses the harness of
  `MantineListingContactPattern.smoke.test.tsx`. It asserts:
  - (a) with `priceOld`, that line has `line-through` and comes before the price in DOM order;
  - (b) without `priceOld`, no element has `line-through`;
  - (c) with `ownerCurrency`, "{label}: {value}" follows the price without `line-through`; without it, the line is
    absent;
  - (d) `trailing` renders.

  `check:story-coverage` passes with the new manifest entry, and `ListingPrice.stories.tsx` imports the pattern
  directly.
- **AC12 [R12, R13]** In `ListingDetailView/PublicListing` and `ListingDetailPattern/Default`, at 320 and 1440:
  - the detail block's struck old price is its own 12px line, and its bottom is at or above the current price's top;
  - the contact card shows the same order.

  A detail-pattern assertion checks that the old price comes before the current price in DOM order. Put it in
  `MantineListingPrice.smoke.test.tsx` (rendering `MantineListingDetailPattern`) or in a new
  `MantineListingDetailPattern.smoke.test.tsx`.
- **AC13 [R14]**
  - `git grep -n "original_price" -- src messages` returns no hit.
  - All four locales carry `listing.price_in_owner_currency`.
  - `npm.cmd run check:i18n` exits 0.
  - `npm.cmd run check:i18n-hardcode` ends with the same exit code and finding list as at I0.
- **AC14 [R15–R17, R19]**
  - `git grep -nE "card_price_(1|old_1)|'€"` over the four Stories in R15–R19 returns no hit.
  - In every section of `ListingContactPattern/Default`, the struck `138,000 EUR` sits above `125,000 EUR`, and there
    is no owner-currency line.
  - In `ListingDetailPattern/Default`, the owner-currency line exists **only** in the converted (E4) section. There
    its value is in `EUR` and the price is in `ALL`.
- **AC15 [R11]** Plants, with Node read/write and a hash witness:
  - P-D: drop the `priceOld` render in `MantineListingPrice`. AC11(a) must fail.
  - P-E: render `priceOld` after the price. The order assertions must fail.
  - P-F: add `td="line-through"` to the owner-currency line. AC11(c) must fail.

  After each restore the tests pass and the hash is equal.

### 18.6 Sequencing precondition (I0, STOP if unmet)

At I0 run:

```powershell
git --no-optional-locks status --porcelain -- messages scripts/mantine-migration-scope.json src/design-system/mantine/patterns/index.ts docs/critical-flow-registry.md
```

**If it prints any line, report `BLOCKED — dirty shared file` and write nothing.** On 2026-10-03 all of these files
carry Task 857's uncommitted work. Wait until the owner has committed it. Once they are clean, this revision also:
- adds the §10.6 registry rows (`:62`/`:63`);
- includes `MantineListingPrice.smoke.test.tsx` in those rows.

Write set (exact):
- `MantineListingPrice.tsx` (new), `MantineListingContactPattern.tsx`, `MantineListingDetailPattern.tsx`;
- `patterns/index.ts` and `scripts/mantine-migration-scope.json`;
- `ListingDetailView.tsx`: the two key literals only;
- `messages/{sq,en,uk,it}.json`;
- the four Stories in R15–R19;
- `MantineListingPrice.smoke.test.tsx` (new), and optionally `MantineListingDetailPattern.smoke.test.tsx` (new);
- `docs/critical-flow-registry.md`: the §10.6 rows only;
- the session log, 912's backlog row and `docs/sessions/evidence/task912/r2-*`.

`GR-0 CANONICAL REUSE PREFLIGHT — request: one listing price block (struck original price above, current price, price in the owner's currency); semantic queries: line-through, priceOld, originalPrice, ListingPrice, Price( over src/design-system, src/components, src/modules, src/stories; inspected candidates: MantineListingContactPattern.tsx:152-166 + Patterns/Mantine/ListingContactPattern, MantineListingDetailPattern.tsx:203-223 + Patterns/Mantine/ListingDetailPattern, MantineListingCardPattern.tsx:228-242,366-382 + Patterns/Mantine/ListingCardPattern (card-internal CSS-module markup, rebuilt by 918); decision: CREATE; selected canonical owner: src/design-system/mantine/patterns/MantineListingPrice.tsx; Mantine/TailAdmin token path: theme fontSizes xs/xl, c="dimmed"/"brand", spacing micro/sm; new hardcoded visual values: NONE; rationale: the same price block is written separately in the detail and contact patterns and already disagrees (D2); 918's own GR-0 reached CREATE for the same block.`

`GR-3a STORY PREFLIGHT — MantineListingPrice × plain/reduced/converted/reduced+converted; canonical candidates: NONE (no Story imports a shared price block); direct-import evidence: NONE; toolbar coverage: locale=toolbar globals.locale, viewport=toolbar; decision: CREATE; target: Patterns/Mantine/ListingPrice — Default; rationale: a new canonical pattern needs its own Story (GR-3).`

`GR-4 AC AUDIT — 5 criteria; each states an observable property; absolutes: none.`

Type scale (GR-3c): every line in this block is 20px or less at every width (`xs` 12, `xl` 20, per-m² `sm` 14). The
detail block's old price changes from 16px (`md`) to 12px (`xs`).

GR-3d lines:
- `ListingPrice/Default` → `StoryPageGutter all` (wrap in this task).
- `ListingContactPattern/Default` → profile present (`:84`).
- `ListingDetailPattern/Default` → profile present (`:268`), with the 886 sticky spacer (§17 NOTE).
- `ListingDetailView` ×4 → own gutter (§17).

### 18.7 Effect on 918

918 R17 and §10.1 items 3 and 8 change. After 912, `MantineListingPrice` and its Story exist. 918 **extends** them and
does not create them:
- it adds the `lg`/`sm` sizes, the D89-7 colour and the card/admin consumers;
- its GR-0 becomes `EXTEND`;
- its start gate gains **794** (D88-5).

### 18.8 Verification plan

I0:
- the §18.6 precondition;
- `node.exe -p process.platform`;
- `git hash-object` of every write-set file;
- `npm.cmd run check:i18n` and `npm.cmd run check:i18n-hardcode`, with the exit code and finding list recorded.

Final gate block (one pass, exit code printed after each command):

```powershell
node.exe -p process.platform
npx.cmd vitest run src/design-system/mantine/patterns/__tests__/MantineListingPrice.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantineListingContactPattern.smoke.test.tsx src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx src/modules/listings/components/__tests__/ListingDetailView.favorite.test.tsx
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:design-tokens
npm.cmd run check:story-coverage
npm.cmd run check:i18n
npm.cmd run check:i18n-hardcode
npm.cmd run check:mojibake
npm.cmd run build
npm.cmd run build-storybook
git --no-optional-locks status --porcelain
```

Expected:
- Every command exits 0, except `check:i18n-hardcode`, which matches I0 (AC13).
- `git status` shows only §18.6 paths plus other tasks' pre-existing entries.

Then:
- run the plants (AC15);
- re-run the four §3.1 censuses, plus `--surface src\design-system\mantine\patterns\MantineListingPrice.tsx`;
- measure every §18.9 Story at 320, 390, 1024 and 1440, plus `uk@320` and `uk@1440`. For each price block, record the
  line order (tops), `text-decoration-line` and `font-size`. Record all four edge gaps;
- emit GR-3b, GR-3c and GR-3d per Story. GR-3e: `n/a: no popup`. GR-3f: `n/a`. GR-3g: `n/a: no line`.

### 18.9 OWNER VISUAL QA REQUIRED (replaces §13.5)

| Story | What to see | Locales | Viewports |
|---|---|---|---|
| `Patterns/Mantine/ListingPrice` → `Default` | four sections: plain; struck original price above; converted, with "Price in the owner's currency" plain below; both | sq · en · uk · it | 320 · 1440 |
| `Patterns/Mantine/ListingContactPattern` → `Default` | every section: struck `138,000 EUR` above `125,000 EUR`, no owner-currency line | en · uk | 320 · 1440 |
| `Patterns/Mantine/ListingDetailView` → `PublicListing` | detail block **and** contact card: struck `138,000 EUR` above `125,000 EUR`, the same format in both | en · uk | 390 · 1440 |
| `Patterns/Mantine/ListingDetailPattern` → `Default` | the detail block and contact card agree; the owner-currency line appears only in the converted section | en | 1440 |

Owner live check after deploy: §13.5 steps 1–3, reading "Price in the owner's currency" where they say "Original
price".

### 18.10 Completion

Append `## Revision 2` to the session log. Include:
- the Files Changed delta;
- I0 vs final;
- the gate block with exit codes;
- the plants with hashes;
- the measurement table;
- the receipts;
- the registry rows added.

Update 912's backlog row. End with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or
`BLOCKED`.

## 19. Revision 3 (review 3, 2026-10-03): `NEEDS REVISION` — one Story fixture

**§19 is the current executable route.** Review 3 inspected Revision 2's full diff. Everything §18 asked for is
verified except one R15 fixture. Re-entry mode: `remediation`. **The only file you may edit is
`src/stories/patterns/mantine/ListingDetailPattern.stories.tsx`.** Keep every other §18 file hash-equal to
`docs/sessions/evidence/task912/r2-hashes.txt`. Do not re-run the I0 block, the plants or the censuses. New evidence
files use an `r3-` prefix.

Review 3 verified these, so do not redo them: vitest (4 files, 32/32, `win32`); `MantineListingPrice` and both
consumers (R11–R13); the key rename and deletions (R14); `ListingContactPattern`, `ListingPrice` and `ListingDetailView`
fixtures (R16, R18, R19); the plants (AC15); the registry rows; the GR-1 censuses (`MantineListingPrice` 1 node,
`MantineListingDetailPattern` 10 nodes, all migrated, enrolled and storied).

### 19.1 Finding F2 (P2, R15/AC14, defect D4 not fully closed)

- **Observed.** `ListingDetailPattern.stories.tsx:217` still passes `pricePerSqm: storyT(l, 'storybook.mantine.card_price_per_sqm_1')`,
  a hand-written `"€941 /m²"`. It sits on the price row beside the production-formatted price. In the converted E4
  section, `convertedData` does not override it. Review 3's probe (`docs/sessions/evidence/task912/rv3-opus-probe.json`,
  built `storybook-static`, `en`/`uk` at 1440) reads these rows:
  - every non-converted section: `80,000 EUR` · `€941 /m²` (`uk`: `80 000 EUR` · `€941 /м²`);
  - the converted E4 section: `8,000,000 ALL` · `€941 /m²`, a euro per-m² beside a lek price.
- **Production** (`ListingDetailView.tsx:292`, `[slug]/page.tsx:236`) computes
  `pricePerSqm = Math.round(displayPrice / area_gross)` and renders it as
  `` `${formatPrice(pricePerSqm, displayCurrencyCode, locale)} ${t('per_sqm')}` ``. `ListingDetailView/PublicListing`
  shows `125,000 EUR` · `1,471 EUR /m²`.
- **Why it is a defect.** R15 says no price string in the four Stories is written by hand. D4 is the owner's return
  for exactly this mismatch: a hand-written `€…` string beside `formatPrice` output. AC14's grep
  (`card_price_(1|old_1)|'€`) could not see it, because the euro sign lives in `messages/*.json` under
  `card_price_per_sqm_1`. That was a task-design gap in AC14, not executor negligence.
- **GR-7.** Not applicable. This revision corrects fixture data to match production. It chooses no layout, control,
  action or visual style, and the price block's layout is the owner's (D89-9, §18.1).

### 19.2 Requirement and acceptance criterion

**R20 [R15] (P2).** In `ListingDetailPattern.stories.tsx`:
- Add `const STORY_AREA = 85`, with a comment that it equals the fixture's area feature value (`:129`, `'85 m²'`).
- Build the per-m² string the way production does:
  `` `${formatPrice(Math.round(<displayed price number> / STORY_AREA), <displayed currency>, l)} ${storyT(l, 'listing.per_sqm')}` ``.
- In `buildBaseProps` (`:217`), the displayed price is `STORY_PRICE` in `STORY_CURRENCY`. That gives `941 EUR /m²` (en).
- In the converted E4 section, add `pricePerSqm` to `convertedData`. Its number is
  `Math.round(convertPrice(STORY_PRICE, STORY_CURRENCY, STORY_VIEWER_CURRENCY, rates) / STORY_AREA)`, formatted in
  `STORY_VIEWER_CURRENCY`. That gives `94,118 ALL /m²` (en).
- Do not edit or delete the key `storybook.mantine.card_price_per_sqm_1`. `ListingCardPattern.stories.tsx:199` still
  consumes it, and that Story belongs to **918**.
- Add no other change: no new key, Story, export, wrapper, `style` or padding.

**AC16 [R20].**
- `git grep -n "card_price_per_sqm_1" -- src/stories/patterns/mantine/ListingDetailPattern.stories.tsx` returns no hit.
- In `Patterns/Mantine/ListingDetailPattern/Default` at `en@1440` and `uk@1440`, every price row's per-m² string has
  the same currency code and number format as the price beside it:
  - non-converted sections: `80,000 EUR` · `941 EUR /m²`;
  - the E4 section: `8,000,000 ALL` · `94,118 ALL /m²`.

  Exact digit grouping follows `formatPrice` for the locale.
- No price row in any of the four §18 Stories contains `€`.

### 19.3 Verification (one pass, exit code printed after each command)

```powershell
node.exe -p process.platform
npx.cmd vitest run src/design-system/mantine/patterns/__tests__/MantineListingPrice.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantineListingContactPattern.smoke.test.tsx src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx src/modules/listings/components/__tests__/ListingDetailView.favorite.test.tsx
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:design-tokens
npm.cmd run check:story-coverage
npm.cmd run check:i18n
npm.cmd run check:mojibake
npm.cmd run build-storybook
node.exe docs\sessions\evidence\task912\rv3-opus-probe.mjs
git hash-object src\stories\patterns\mantine\ListingDetailPattern.stories.tsx
git --no-optional-locks status --porcelain
```

Expected:
- Every command exits 0. `lint` is now green: review 3 added an `eslint-disable` header to Opus's own
  `rv2-opus-probe.cjs`, and the full `npm.cmd run lint` exits 0 (0 errors).
- `rv3-opus-probe.json` is rewritten and shows the AC16 rows. Copy its output to `r3-probe.json`.
- `npm.cmd run build` is not re-run. The change is in a Story file, which the Next build does not compile. The
  Revision 2 build (`r2-build.txt`) stays the build evidence for the production diff.
- Only the Story file is new in `git status`, apart from paths that were already listed.

Receipts (one each, for `ListingDetailPattern/Default` only):
- `GR-3b`, `GR-3c` and `GR-3d` with values measured at 320, 390, 1024 and 1440. They must equal Revision 2's, because
  per-m² is on the price row, and the row wraps.
- `GR-3e`: `n/a: no popup`.

### 19.4 Completion

Append `## Revision 3` to the session log. Include the one-path Files Changed delta, the block transcript with exit
codes, the AC16 rows and the receipts. Update 912's backlog row. End with
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

After that comes review 4. If it verifies AC16, the §18.9 owner matrix goes to the owner, unchanged. The matrix is not
handed over before then, because the `ListingDetailPattern` row would show the defect.
