# Sprint 89 — the listing card, rebuilt on the owner's reference

**Opened:** 2026-10-02 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0 · **Kickoffs filed:** 1 (918)

> **These counts drift.** Re-derive them from the Tasks table below, never from this line.

> **Opened by owner instruction, 2026-10-02, verbatim:** *"Необхідно картку взагалі переробити як ось тут зроблено
> https://techzaa.in/lahomes/admin/property-grid.html . Мені у картці референсу подорбається лаконічність, ієрархія,
> структурованість."* The same message reported that `/listings` shows neither the "price reduced" badge nor a struck
> price. That data defect is Sprint 88's **917**, not this sprint.

## Goal

Every public listing card (grid and list) has the reference's hierarchy: the photo with deal-type and status badges,
a property-type tile beside the title and address, feature chips, and a footer that holds the price block at left and
the ID and date at right. It is built on canonical Mantine with Solar icons, and the reduced price reads the way the
owner's Rozetka screenshot shows.

The reference was captured live and recorded in `docs/tailadmin-style-reference.md` §6w.

## Decisions

| ID | Question (2026-10-02) | Owner answer (verbatim option chosen) | Binding consequence |
|---|---|---|---|
| **D89-1** | The reference card has no price per m², no listing ID, no date and no photo counter. Which of these stay on our card? | *"Ціна за м², ID з копіюванням, Дата публікації, Лічильник фото"* (all four) | All four are preserved. Nothing is removed from the card's information. |
| **D89-2** | Is the list-mode card (≡ on `/listings`) rebuilt in the same style? | *"Так, обидва режими (Recommended)"* | `layout="grid"` and `layout="list"` get the same parts and hierarchy in one task (918). |
| **D89-3** | How does the reduced price show in the new footer? | *"як у https://rozetka.com.ua/"* + a screenshot of Rozetka's recommendations row | Reduced: the old price is small, grey and struck, on its own line **above** the current price; the current price is large, bold and red. Not reduced: the current price is large, bold and **dark** (the screenshot's "180 ₴"; confirmed by D89-7). The "price reduced" photo badge stays (`docs/domain-rules.md:171`). The colour rule is confirmed by the owner in **D89-7**. |
| **D89-4** | Icons: switch to the reference's Solar set? | *"Solar на картці (Recommended)"* + note: *"Картка бере іконки Solar (стиль broken 16px для характеристик, duotone для плитки типу). Забрати увесь набір іконок, щоб у майбутньому його використовувати!"*; then: *"@solar-icons/react - запиши це у правило, щоб завжди використовували іконки з цього набору"* | Install the full `@solar-icons/react` (MIT, 1,451 icons × 6 styles, tree-shakeable). Feature icons use `broken`, the type tile uses `bold-duotone`. The rule is written: `docs/mantine-responsive-design-system.md` §26. `ListingFeatureIcon` stays the single icon map and moves to Solar, so the detail page and the admin preview dialog change with it. |
| **D89-5** | What sits in the footer at the right of the price? | *"ID і дата (Recommended)"* | `#ID` with copy, and the publication date, stacked at the footer's right. No "More details →" link, since the whole card is already a link. |
| **D89-6** | Deal type and property type: as in the reference? | *"Як у референсі (Recommended)"*, whose text read: *"«Продаж» / «Оренда» стає кольоровим бейджем на фото. Тип нерухомості стає плиткою-іконкою ліворуч від заголовка: своя іконка на кожен тип, назва типу в підказці та для читалок екрана. Текстовий рядок «Продаж · Квартира» зникає."* | Deal-type badge on the photo (Оренда `green`, Продаж `orange`, the reference's colours). Property-type tile with a per-type Solar icon, its name in `aria-label` and a tooltip. The text type line is removed. |
| **D89-7** | (2026-10-02, unprompted, while 918 was being written) Price colour | *"і ціну за замовчуванням у картках і на стоірнці оголошення треба зробити також чорною, а ціну, якщо її зменьшили червоним (кораловим), щоб візуально було видно які картки мають знижену ціну"* | On the card (both layouts) **and** on the listing page (the detail price block `MantineListingDetailPattern` and the contact card `MantineListingContactPattern`), a non-reduced price is dark (the default text colour) and a reduced price is coral, the theme `brand` (`#EC5447` at primary shade 7). Confirms D89-3's reading and extends it to the listing page. Built in **918** (the listing-page part needs 912's contact-card change first, already a start gate). Supersedes D88-1's "актуальна ціна (червоним кольором)" for the non-reduced case. |
| **D89-8** | (2026-10-02, unprompted) Admin price colours | *"і в адмінці кольори ціни мають бути ідентичні як і на сайті"* | Every admin surface that shows a listing price follows D89-7: the admin listings table (rows and phone cards), the dashboard's recent listings (row and dialog), and the admin preview page (which renders `ListingDetailView`). Each admin query selects `price_old`, so a reduced price shows coral with the struck old price above it, exactly as on the card. One shared price block owns the rule (918). |
| **D89-9** | (2026-10-03, in 917's review) The owner saw listing #22's page with the old price **beside** the current one: *"Але стара ціна чомусь збоку, а не зверху"*. Contact card position, given D88-1's "нижче"? | *"Зверху всюди (Recommended)"*, whose text read: *"Стара ціна дрібна перекреслена над актуальною в усіх місцях: картка, блок ціни на сторінці, картка контактів, адмінка. Один спільний блок ціни. Рядок «Оригінальна ціна: …» (інша валюта) лишається під актуальною."* | One shared price block (`MantineListingPrice`, 918) renders the struck old price **above** the current price on the card, the listing-page price block, the contact card and the admin. The original-currency line stays below. 912 is amended to the same order before execution. |

## Goal-fit (why no open sprint takes this)

| Open sprint | Goal | Fit |
|---|---|---|
| 46 | `ListingCard` de-Tailwind + overlay exit | No. Its goal is removing Tailwind with nothing rendered changing (D28); this sprint is a redesign. Its open **741 Revision 2** touches the same badges and overlay, so 918 runs after it. |
| 74 | one card width for the whole site | No. It sets widths; 918 keeps them. |
| 88 | a struck price means a reduction | No. It owns price semantics (912, 917); 918 consumes them. |
| 55 · 56 · 57 · 61 · 62 · 69 · 70 · 71 · 72 · 73 · 77 · 78 · 79 · 83 · 84 · 86 · 87 | ARIA, enum leaks, removal, projection, tokens, filters, chrome, detail route, similar listings, sold visibility, test suite, admin, CMS, type scale, dates, listing form, Story gutters | No. None of them is a card redesign. |

## Tasks

The Tasks table is the single state source.

| # | Title | P | QA | Depends on | State |
|---|---|---|---|---|---|
| **918** | The listing card rebuilt on the owner's reference — grid and list, Solar icons, property-type tile, feature chips, footer with the Rozetka price block and ID/date (D89-1…D89-6); one price block and colour rule on the card, the listing page and the admin (D89-7, D89-8) | P1 | Q4 (critical-flow rows "Listing card rendering" and "Listings display — price") | **912**, **741 R2**, **857** approved | `KICKOFF FILED` → [`…_Task_918_…`](Sprint_89_kickoff_prompt_Task_918_Listing_Card_Reference_Rebuild.md) |

## Execution order

| Step | Task | Gate |
|---|---|---|
| 1 | **918** | **912** (Sprint 88) approved: it changes the card's `priceOld` predicate in `ListingCard.tsx`. **741 R2** (Sprint 46) approved: it changes the card's status badge and overlay colour source. **857** (Sprint 78) approved: its `ListingPreviewDialogView` renders `MantineListingCardPattern layout="list"` and `ListingFeatureIcon`. All three edit files that 918 rewrites. |

## Preconditions

- The three gates above. At design time (2026-10-02), `MantineListingCardPattern.tsx`, its CSS module, `ListingCard.tsx`
  and `ListingFeatureIcon.tsx` are clean in the worktree. `src/design-system/mantine/patterns/index.ts` and `theme.ts` are
  modified by 857's uncommitted work.

## Exit criteria

- On `/listings` (grid and list), the homepage rails, favorites, recently viewed and similar listings, every card shows
  the §6w anatomy, with Solar icons and the D89-3 price block.
- The owner accepts the 918 visual matrix.
- On the listing page, the price is dark when not reduced and coral (`brand`) when reduced (D89-7).
- Every admin surface that shows a listing price follows the same rule (D89-8).
- No information or capability is lost from the card: price per m², original-currency price, ID copy, date, photo
  count, favorite, the sold/rented overlay, premium and archived states, and the "new" / "price reduced" badges.
