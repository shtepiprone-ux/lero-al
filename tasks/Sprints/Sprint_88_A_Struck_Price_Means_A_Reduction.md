# Sprint 88 — a struck-through price means the owner lowered it, and nothing else

**Opened:** 2026-10-01 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0 · **Kickoffs filed:** 1 (912)

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
| **912** | Strikethrough only for a real reduction — contact card's converted-price line loses `line-through` and the card gains the struck old price when `price_old > price` (D88-1); `ListingCard` shows `priceOld` only when `price_old > price` | P1 | Q4 (critical-flow rows "Listings display — price" and "Listing card rendering") | — | `KICKOFF FILED` → [`…_Task_912_…`](Sprint_88_kickoff_prompt_Task_912_Strikethrough_Only_For_Real_Reduction.md) |

## Execution order

| Step | Task | Gate |
|---|---|---|
| 1 | **912** | — |

## Preconditions

- None. Both changed source files are clean in the worktree at design time (`git status --porcelain`, 2026-10-01).

## Exit criteria

- No listing surface renders a struck-through price unless `price_old > price` (detail block, card, contact card).
- A regression test fails if `line-through` returns to the converted-currency line or if the card strikes a
  non-reduced `price_old`.
- The owner confirms on a live listing, signed in with a preferred currency different from the listing's, that no
  struck-through price appears.
