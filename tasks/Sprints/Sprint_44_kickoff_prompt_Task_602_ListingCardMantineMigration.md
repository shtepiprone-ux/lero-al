# Task 602 — Extend `MantineListingCardPattern` (price + reduced-price variants + hover) and make it the live VERTICAL listing card

Sprint 44 (Epic MM Phase-2/Phase-4 — Mantine/TailAdmin migration). Owner-directed 2026-07-15.

> **⚠️ Orchestrator note — scale & risk.** The live `ListingCard` is the most feature-dense and most-reused
> component on the site (a **critical-flow-registry** surface, hydration-sensitive — Task 563). Do it
> **incrementally**, keep the public `ListingCard` API stable, and **STOP and ASK** on any genuine ambiguity.

## Owner intent (all messages 2026-07-15, reconciled — read carefully)

- The site has TWO card presentations, driven by the `/listings` **List/Grid toggle** (standard UI/UX — keep both):
  - **Grid (default) = VERTICAL card** — photo on top, text below. This is also what the homepage Latest section
    should use.
  - **List = HORIZONTAL card** — photo left, text right (reference: `https://dom.ria.com/uk/prodazha-kvartir/`
    "List" view). **This stays horizontal — do NOT retire or verticalize it.**
- "Тільки вертикальні картки" from earlier applies to the **grid/default card and the homepage Latest**, NOT to
  the List view.
- **`MantineListingCardPattern` + its Mantine story already have the CORRECT (vertical) structure / adaptation.
  Do NOT redesign that structure or its responsive behavior — ADD content only.**
- **ADD to the pattern:** a price display with two variants — (1) regular price, and (2) reduced price = **old
  price struck through + new price** ("variant з ціною / variant з перечеркнутою ціною та новою ціною").
- **Make the pattern the live VERTICAL card** — `ListingCard`'s vertical branch renders `MantineListingCardPattern`.
- **Add a hover effect** to the vertical card like dom.ria: **photo zooms in + card gets an elevation shadow.**
- **Mantine stories only** (legacy stories are being deleted project-wide — create none; extend the pattern's
  existing Mantine story additively with the price variants).

## What changes vs what stays (blast radius — grep-verified)

Two consumers reference `variant`:
- `LatestListings.tsx:55` — literal `variant="horizontal"`. **Change → drop it** so Latest renders the VERTICAL
  card (Latest is a grid card; horizontal there was the 320px cramping the owner reported).
- `ListingsShell.tsx:234` — `variant={view === 'list' ? 'horizontal' : 'vertical'}`. **UNCHANGED.** The List/Grid
  toggle keeps switching horizontal (List) vs vertical (Grid).

So the **`variant` prop STAYS** on `ListingCard`. The **vertical** branch is migrated to Mantine (+ hover + price
variants). The **horizontal** branch is KEPT working for the List view (legacy implementation retained this task;
its Mantine migration, if wanted, is a separate future task — do NOT break or redesign it here). All other
consumers already use the default vertical card.

## Pre-read (rule-index → UI/layout/component + regression)

**Always:** `docs/agent-contract.md` (clauses 1–16, esp. 3/4/5 preservation, 7 i18n, 8/12 breakpoints+rendered matrix, 11 mobile full-width, 14 file-integrity, 15 regression, 16 TailAdmin), `docs/backlog.md`, `docs/critical-flow-registry.md` (**scan the `ListingCard`/`PriceBlock` hydration rows — Task 563 — clause 15 applies**).
**UI (required):** `docs/mantine-responsive-design-system.md` (FIRST — §8 Mantine Storybook proof, §12 canonical patterns, §18 theming pitfalls incl. `:hover` cannot live in inline `styles`), `docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` (card chrome + price/shadow §-rows; extract to a §6x row before implementing if missing — zero invented values), `docs/ui-rules.md` (dom.ria reference), `docs/component-rules.md` (→ "Container / Presentational Primitive Split"), `docs/qa-rules.md`.
**Read (do NOT redesign):** `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` + `src/stories/patterns/mantine/ListingCardPattern.stories.tsx`.
**Only if relevant:** `docs/design-system.md` (legacy migration context), `docs/state-authority.md`.

## Part 1 — Extend `MantineListingCardPattern` (structure UNCHANGED, ADD content)

Keep the pattern's structure (Card → top image → Stack title/location/rooms·area/price → optional contact) and its
responsive behavior EXACTLY. Additive changes only:

1. **Price variants.** Add optional `priceOld?: string` (already-formatted). Present → render the **old price
   struck through** next to/above the **new `price`** (TailAdmin-cited; new price brand `#EC5447`, old price muted
   + `line-through`). Absent → today's single-price render, unchanged.
2. Keep all new props **optional + backward-compatible**; do NOT change layout/spacing/image ratio/grid usage/API
   shape beyond additive props.
3. **Story (additive):** extend the EXISTING Mantine story to show a regular-price card AND a reduced-price card
   (old strike + new). New strings via `storybook.mantine.*`, full sq/en/uk/it parity (`check:i18n` green). Single
   `Default` export + toolbar-driven viewport/locale (§8). No legacy story; no per-viewport/per-locale/`Ukrainian*`.

## Part 2 — Make the pattern the live VERTICAL card + hover

`ListingCard`'s **vertical** branch becomes a thin container mapping real listing data → `MantineListingCardPattern`
(the pattern is the presentational primitive → split gate satisfied). The container owns: translation, locale,
currency conversion, real `FavoriteButton`, real `AppImage` (priority/layoutContext/predictive), `<Link>` nav
(`data-track`/`data-listing-slug`/`onBeforeNavigate`), badges/status. Public `ListingCard` API unchanged
(`variant` stays). `LatestListings.tsx:55` drops `variant="horizontal"`. `ListingsShell.tsx` UNCHANGED.

**Content parity (vertical card) — keep, do NOT silently drop (Note 20/21):** currency conversion
(`displayCurrency`/`rates`/`convertPriceMulti`, converted `price`+`priceOld`, `originalPriceStr` always-'en'
grouping), status badges (`sold`/`rented`/`archived`/`expired`/`new`/`price_reduced`), sold/rented overlay,
premium styling, favorite (disabled+`disabledLabel` when closed), features row (`getCardFeatures`+
`ListingFeatureIcon`), location (`name_al`), `AppImage` aspect-[4/3], Link nav. **Confirm-with-owner (in today's
vertical card, not in the bare pattern — default KEEP unless owner says drop):** per-m² price line, photo-count
badge, copy-ID button, listing date. **Contact CTA:** the pattern has an optional `onContact` button; today's card
has none (click = navigate) — default do NOT pass `onContact`. Record each decision in the session log.

## Hover / interaction effect (OWNER request — dom.ria.com/uk parity, vertical card)

On card hover: **photo zooms in AND the card gains an elevation shadow.**
- **Image zoom:** cover image scales up smoothly (~`scale(1.05)`, `transition ~200–300ms ease`) on hover of the
  **whole card** (`group`/`group-hover`); image container keeps `overflow-hidden` (zoom clipped to rounded corners).
- **Card shadow:** raises to a TailAdmin-cited elevation shadow (`shadow-theme-*` / a §-row — not invented); keep
  premium ring/elevation for premium cards.
- **Mantine (§18):** `:hover`/`group-hover` CANNOT live in inline `styles` — use a CSS module/stylesheet or
  Tailwind `group`/`group-hover`. Verify zoom + shadow render together on real hover.
- **A11y:** wrap the transform in `prefers-reduced-motion: reduce`; transform-only, no layout shift; graceful on touch.

## Mobile <640 full-width gate (OWNER P0)

Vertical card is full-width in its `grid-cols-1` column below 768 — confirm + document. In-card controls (favorite
`ActionIcon`, any kept copy-ID) ≥44px; long sq/en/uk/it strings wrap/clamp; no horizontal scroll at 320; no overlap.

## TailAdmin conformance gate (OWNER P0, clause 16)

Vertical card chrome (border, radius, shadow, gray ramp, Outfit type scale, price brand `#EC5447`, muted meta, the
struck-through-old + new-price treatment, the hover shadow) matches the TailAdmin reference; every value §-cited or
extracted from the zip first. Proven RENDERED side-by-side; `tsc=0`/build is NOT style proof.

## Hydration-safety + regression coverage (clause 15 — ListingCard is a registered critical flow)

- Price/date/count formatting hydration-deterministic (do NOT reintroduce the Task-563 `/sq|it/listings` mismatch;
  keep always-'en' grouping; avoid render-time locale `Intl.*` per Task 564/565). No render-time
  `window`/`document`/`localStorage`/browser-Supabase.
- Baseline the existing listing-card regression coverage (record green), then add/update a regression test for the
  migrated vertical card (renders content, reduced-price shows the strike, vertical layout, hover markup present, no
  hydration mismatch) AND assert the horizontal List branch still renders (not broken by the refactor).
  **Planted-violation FAIL transcript** required. Update `docs/critical-flow-registry.md`.

## Positive flow

1. Grid/default + Latest → vertical Mantine card (photo top, then title/location/rooms·area/price + kept content), 4 locales.
2. `/listings` Grid view → vertical cards; **List view → horizontal cards (unchanged)**; toggle still works.
3. Reduced listing (`price_old > price`) → old price struck through + new price (+ `price_reduced` badge if kept).
4. Hover on a vertical card → photo zooms + card shadow (reduced-motion respected).
5. Click → navigates; favorite (+ copy-ID if kept) work and don't navigate.

## Negative flow

- No image → fallback, layout intact. Sold/Rented → overlay + status badge, favorite disabled with `disabledLabel`, nav still allowed. Archived/Expired → grayscale + badge; no strike unless `price_old`. Conversion off/rates null → own currency, no `originalPriceStr`, no crash. `area_gross` 0/absent → no per-m² line, no divide-by-zero. Long uk/it strings → wrap/clamp, no clip, no h-scroll@320. Double-click favorite/copy-ID → existing debounce/swap preserved. Guest vs authed → favorite unchanged. **List (horizontal) view → still renders correctly (regression guard).**

## Acceptance criteria (each verifiable in the diff / rendered matrix; cite both flows)

1. `MantineListingCardPattern` extended **additively** with the price variants (`priceOld` reduced = old strike + new); structure/layout/adaptation/API otherwise unchanged (diff = additive-only). (file:line)
2. Its Mantine story extended (additive) to showcase regular-price + reduced-price; single `Default`, toolbar-driven, `storybook.mantine.*` sq/en/uk/it parity; no legacy story. (file:line)
3. `ListingCard` vertical branch = thin container over the pattern (split gate satisfied); public API stable; `variant` prop retained; the **horizontal branch still works** (List view). (file:line)
4. `LatestListings.tsx` drops `variant="horizontal"` (→ vertical); `ListingsShell.tsx` unchanged (List/Grid toggle intact: List=horizontal, Grid=vertical); grep confirms blast radius. (file:line)
5. **Content parity (vertical):** every "keep" item reproduced (file:line); every "confirm" item's decision recorded; nothing silently dropped (before/after control inventory, Note 20).
6. Reduced-price: old struck through + new, TailAdmin-cited, sq/en/uk/it; plain-price no strike. (file:line + PNG)
7. **Hover:** photo zoom (~`scale(1.05)`, clipped) + TailAdmin-cited elevation shadow on hover; `prefers-reduced-motion` guarded; no layout shift. Proven with a rendered hover-state capture. (file:line + hover PNG)
8. Hydration-safe (no Task-563 regression); regression test added/updated (vertical migrated + horizontal-still-renders) with green baseline + planted-violation FAIL transcript; registry updated. (clause 15)
9. **Rendered matrix** (clause 12): canonical breakpoints × sq/en/uk/it, uk@320/375/390 mandatory; per-cell evidence (photo-first vertical? full-width? strike shown? no clip/overflow? no h-scroll?). `tsc=0`/build NOT proof.
10. TailAdmin conformance proven side-by-side vs the zip. Gates: `tsc`=0, eslint clean, `check:i18n` 4-locale parity, `check:stories`, `check:file-integrity`, `check:mojibake`, relevant vitest green. No `git add`/`git commit` (orchestrator emits at review).
11. Session log: AC-by-AC self-audit, UX flow trace, before/after control inventory, content-parity decisions, "Files Changed" table, rendered matrix, planted-violation transcript. `docs/backlog.md` + registry updated.

## Scope (files)

**In scope:** `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` (additive: price variants + hover-capable markup), `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` (additive: price-variant showcase), `src/modules/listings/components/ListingCard.tsx` (vertical branch → thin container over the pattern; horizontal branch kept), `src/modules/listings/components/LatestListings.tsx` (drop `variant="horizontal"`), a CSS module/stylesheet for the hover (per §18), any `theme.ts`/tailadmin §6x row needed, `messages/*.json` (only genuinely new `storybook.mantine.*` keys ×4), `docs/critical-flow-registry.md`, regression test file(s), `docs/backlog.md`, session log.

**Out of scope (do NOT touch):** `ListingsShell.tsx` toggle logic (unchanged); the horizontal card branch's design (kept as-is — its Mantine migration is a separate future task); redesigning the pattern's structure/adaptation; other consumer call sites; any non-listing surface; creating any legacy story.

## Hard contract

No scope change beyond the above; **do NOT redesign the pattern's structure or adaptation — additive only; do NOT
retire or verticalize the horizontal List card; do NOT design new breakpoint logic.** STOP and ASK on: any
TailAdmin value not in a §-row, the "confirm" content-parity items if you cannot get a decision, any consumer
needing an API change beyond `LatestListings`. Preserve every kept control + UX flow (clause 3/4/5) — including the
horizontal List view. Both positive AND every negative branch. All 4 locales. Hydration-safe. Self-validate before
"complete"; AC-by-AC table + "Files Changed" table + rendered matrix + planted-violation transcript required;
executor emits NO git. Critical-flow surface — a silently dropped behavior, a broken List view, or a reintroduced
hydration mismatch is a TASK FAILURE.
