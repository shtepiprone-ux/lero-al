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
the current price. The converted-currency disclosure is a plain informational line.

## Decisions

None open. The owner's rule is the bug report quoted above.

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
| **912** | Strikethrough only for a real reduction — contact card's converted-price line loses `line-through`; `ListingCard` shows `priceOld` only when `price_old > price` | P1 | Q4 (critical-flow rows "Listings display — price" and "Listing card rendering") | — | `KICKOFF FILED` → [`…_Task_912_…`](Sprint_88_kickoff_prompt_Task_912_Strikethrough_Only_For_Real_Reduction.md) |

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
