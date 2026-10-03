# Sprint 88 — a struck-through price means the owner lowered it, and nothing else

**Opened:** 2026-10-01 · **Status:** 🟠 **OPEN** · **Landed tasks:** 1 (917) · **Kickoffs filed:** 2 (912, 917)

> **These counts drift.** Re-derive them from the Tasks table below, never from this line.

> **Opened by owner bug report, 2026-10-01, verbatim:** *"знайшов регрессію. Якщо користувач змінив у себе в
> налаштуваннях валюту, а потім перейшов у оголошення, то йому показується стара ціна і перекреслена. Але насправді
> так не має бути. Перекреслена ціна має бути лише тоді, коли власник оголошення змінив ціну на меньшу і тільки на
> меньшу."*

## The defect

Two price renderers strike a price through for a reason other than a reduction:

1. **Contact card (the reported regression).** `MantineListingContactPattern.tsx:156-160` renders the
   converted-currency disclosure (`Original price: <price in the listing's own currency>`) with `td="line-through"`.
   It shows whenever a signed-in user's preferred currency differs from the listing's (`[slug]/page.tsx:227,234`).
   Before Task 793 (`9596c60a5`, 2026-09-06) the live card was the legacy `ListingContact.tsx` markup, which rendered
   the same line plainly (`git show 9596c60a5^:src/modules/listings/components/ListingContact.tsx` lines 161-163).
   Task 793 swapped in the Mantine pattern, whose strikethrough dated from Task 616 (`4715ad093`).
2. **Listing card (same rule, latent).** `ListingCard.tsx:203` and `:292` pass `priceOld` whenever
   `listing.price_old` is set. `price_old` is a free owner-entered field (`validations/index.ts:9`,
   `z.number().positive().optional()`), so a `price_old` at or below `price` is struck through as if it were a
   reduction. The card's own badge (`:99`) already uses the correct predicate `price_old && price < price_old`.

## Goal

A price is struck through on any listing surface **only** when the owner's previous price is strictly higher than
the current price, and the contact card shows that struck old price too (D88-1). The converted-currency disclosure is a
plain informational line.

## Decisions

| ID | Question | Owner answer (verbatim) | Binding consequence |
|---|---|---|---|
| **D88-1** | (2026-10-01) Should the contact card show the reduced old price? Changing it needs `ListingDetailView.tsx` and `ListingContact.tsx`, whose censuses carry unmigrated nodes (clause 16d). | *"так, має показувати стару ціну, якщо вона була вищою за актуальну."* · layout: *"є актуальна ціна (червоним кольором, основна ціна), а нижче маленьким шрифтом має показуватись стара ціна, якщо вона була вищою. Оригінальну ціну треба показувати на насутпному рядку після зниженої ціни(оригінальна ціна - це ціна, у валюті якої було створено оголошення!)!"* · routing: *"так додай ці зміни у саму останню задачу у лланцюжку змін картки контактів"* | The contact card's three-line price block — current price (brand, main) · old price small and struck, **only when `price_old > price`** · original-currency price on the next line, plain — is built in **912**, the latest task in the contact-card chain. *Corrected 2026-10-01:* the first recording routed it to 795 (commit `5c9a9119f`); the owner rejected that reading the same day (*"Я сказав, що стара ціна має бути перечеркнута, якщо вона була вищою за актуальну"*). **Clause 16d scope of the routing instruction:** it was given in answer to the explanation that the pass-through edits to `ListingDetailView.tsx` and `ListingContact.tsx` reach 13 unmigrated nodes owned by other tasks. 912 therefore adds one prop to each file and migrates none of those nodes. Each node is listed in 912 §3.1 with its owner; the five with no open owner are filed as **913**. |
| **D88-2** | (2026-10-02) The owner lowered listing #22's price and saw no struck price and no badge. Measured: `price_old` is null on every public listing; nothing writes it (`updateListing.ts:62` stores the form payload, and the only form field for it lives in the unimported `steps/StepBasicInfo.tsx`). How should the old price be recorded? | Option chosen verbatim: *"Автоматично (Recommended)"*, whose text read: *"Власник зберіг нижчу ціну → сервер сам записує попередню в price_old. Якщо ціну потім піднято до старої або вище, price_old очищається, і бейдж та перекреслення зникають. У формі немає окремого поля."* | `price_old` becomes a **server-owned** field, computed in **917** from the stored row on every price save; a client-sent value is ignored. No form field is added. Supersedes 912's assumption A2 (*"`price_old` stays a free owner-entered field"*) for how the value is written; 912's display predicate is unchanged. |
| **D88-3** | (2026-10-02) The price was lowered several times: 120 000 → 100 000 → 90 000. Which old price is struck? | Option chosen verbatim: *"Найвищу (120 000) (Recommended)"* | `price_old` keeps the **highest** earlier price while the current price stays below it (**917**). |
| **D88-4** | (2026-10-03, in 917's review) Where does the contact card's struck old price sit? D88-1 said *"нижче"*; the owner then asked for "above" on the listing page. | Recorded as **D89-9** (Sprint 89 plan), option chosen verbatim: *"Зверху всюди (Recommended)"* | The old price sits **above** the current price everywhere, the contact card included. 912 was amended before execution (kickoff note under its title, R7, R9, §9, §10, AC8). Supersedes D88-1's position only. |
| **D88-5** | (2026-10-03, owner return on 912 review 2) The listing page still renders the legacy gallery (`GalleryStaticFrame`/`GalleryIsland`), not the Rozetka-style `MantineListingGalleryPattern` (Task 810/824). Where is it fixed? | Option chosen verbatim: *"Окремо 794, одразу після 912 (Recommended)"* | The gallery is **794**'s (Sprint 71), not 912's. 794 runs first after 912 and before 918. The same return also bound 912 Revision 2 (kickoff §18): one shared `MantineListingPrice`; the converted line is labelled "price in the owner's currency" (owner: *"Ціна у валюті власника"*), never "Original price"; the struck original price sits above the current price on every listing-page block. |
| **D88-6** | (2026-10-03, owner return during 912 review 4) The listing page still shows a non-reduced price in `brand`. | *"я вже неодноразово казав, що ціна по замовчуванню має бути темним кольором, наприклад #111111 (треба зробити токен). Але я все ще бачу ціну по замовчуванню brand кольром."* | Restates D89-7 for the listing page. 912 Revision 4 (§20) adds the token `theme.other.priceColor.regular` = `#111111`. `MantineListingPrice` uses that token when not reduced and `brand` when reduced. The orchestrator had routed this colour to 918; that routing was the defect. |

## Goal-fit (why no open sprint takes this)

| Open sprint | Goal | Fit |
|---|---|---|
| 46 | `ListingCard` de-Tailwind + overlay exit | No — a styling migration; this is a price-semantics bug. |
| 71 | listing-detail route leaves Tailwind | No — de-Tailwind goal; the contact pattern is already Mantine. |
| 74 | one card width for the whole site | No — layout. |
| 55 · 56 · 57 · 61 · 62 · 69 · 70 · 72 · 73 · 77 · 78 · 79 · 83 · 84 · 86 · 87 | ARIA, enum leaks, removal, projection, tokens, filters, chrome, similar listings, sold visibility, test suite, admin dashboards, CMS, type scale, dates, listing form, Story gutters | No — none is about what a rendered price means. |

## Tasks

The Tasks table is the single state source.

| # | Title | P | QA | Depends on | State |
|---|---|---|---|---|---|
| **917** | The server records the previous price on a reduction — `price_old` computed from the stored row in `updateListing` (D88-2, D88-3), ignored from the client, null on create | P1 | Q4 (critical-flow rows "Listings display — price" and "Listing card rendering" read it) | — | ✅ `APPROVED` 2026-10-03 (review 1; [ledger](../../docs/reviews/2026-10-03-task917-server-records-previous-price.review-ledger.json)) → [`…_Task_917_…`](../Archive/Sprint_88_kickoff_prompt_Task_917_Server_Records_Previous_Price.md) |
| **912** | Strikethrough only for a real reduction — contact card's converted-price line loses `line-through` and the card gains the struck old price when `price_old > price` (D88-1); `ListingCard` shows `priceOld` only when `price_old > price` | P1 | Q4 (critical-flow rows "Listings display — price" and "Listing card rendering") | — | `NEEDS REVISION` (review 5, 2026-10-03 → §21 Revision 5: the contact-card name line wraps instead of truncating, R25; §20 colour verified; owner matrix §18.9 after review 6), and the contact card's truncated owner-deleted line; §19 verified; owner matrix §18.9 after review 5) → [`…_Task_912_…`](Sprint_88_kickoff_prompt_Task_912_Strikethrough_Only_For_Real_Reduction.md) |

## Execution order

| Step | Task | Gate |
|---|---|---|
| 1 | **912** | — |
| 1 | **917** | — ✅ landed 2026-10-03 |

## Preconditions

- None. Both changed source files are clean in the worktree at design time (`git status --porcelain`, 2026-10-01).

## Exit criteria

- No listing surface renders a struck-through price unless `price_old > price` (detail block, card, contact card).
- A regression test fails if `line-through` returns to the converted-currency line or if the card strikes a
  non-reduced `price_old`.
- The owner confirms on a live listing, signed in with a preferred currency different from the listing's, that no
  struck-through price appears.
- Lowering a listing's price in the edit form stores the previous price (D88-2, D88-3). On `/listings` the card then
  shows the "price reduced" badge and the struck old price, and raising the price back to the old one or above removes
  both. A unit test covers every row of 917's rule table (917).
