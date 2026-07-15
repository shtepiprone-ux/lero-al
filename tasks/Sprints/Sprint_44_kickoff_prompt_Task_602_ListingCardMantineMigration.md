# Task 602 — Migrate the live `ListingCard` to Mantine to match `ListingCardPattern` behavior + real content + reduced-price variant

Sprint 44 (Epic MM Phase-2/Phase-4 — Mantine/TailAdmin migration). Owner-directed 2026-07-15.

> **⚠️ Orchestrator note — scale & risk.** `ListingCard` is the most feature-dense and most-reused component on
> the site (29 consumers, a **critical-flow-registry** surface, hydration-sensitive — Task 563). Do it
> **incrementally**, keep the public `ListingCard` API stable for the vertical consumers, and **STOP and ASK**
> the orchestrator on any genuinely ambiguous sub-decision. Expect review follow-ups; a faithful, regression-free
> migration matters more than closing in one pass.

## Why this exists (owner, 2026-07-15)

The homepage **"Останні" (Latest)** card is cramped at 320px because it uses the legacy `variant="horizontal"`
(photo-left / text-right). The **Mantine `ListingCardPattern` already has the correct adaptation behavior**
(photo-on-top vertical, full-width in its grid column). The owner's directive, stated repeatedly:

- **Make the live card behave exactly like `MantineListingCardPattern`.** Its adaptation behavior is correct.
- **DO NOT design, add, or change any adaptation/breakpoint logic** — no custom `<480`/`≥480` switch, no invented
  media queries. Adopt the pattern's adaptation **as-is**.
- **DO NOT modify** `MantineListingCardPattern.tsx` **or** its Storybook story
  (`src/stories/patterns/mantine/ListingCardPattern.stories.tsx`) — they are the correct reference.
- The card's price must support a **reduced-price** presentation (old price struck through + new price) in
  addition to the plain price (the "variant з ціною / variant з перечеркнутою ціною та новою ціною").

**Consequence (confirmed by grep):** only ONE consumer uses `variant="horizontal"` — `LatestListings.tsx:55`.
After this migration every listing surface renders the pattern's vertical/photo-first layout, so the legacy
`horizontal` variant is retired and `LatestListings` drops that prop. All other 28 consumers already use the
default vertical layout and keep working unchanged.

## Owner decisions (resolved via AskUserQuestion + follow-ups 2026-07-15)

1. **Approach:** migrate the LIVE card to Mantine so it matches `MantineListingCardPattern` (not a Tailwind tweak, not a story-only change).
2. **Adaptation behavior:** the pattern's, **UNCHANGED** — do not redesign or add breakpoint logic.
3. **`MantineListingCardPattern` + its story:** OUT OF SCOPE — do not touch.
4. **Stories:** Mantine-only. Legacy stories are being deleted project-wide — create NONE here.
5. **Packaging:** one combined task (this file).

## Pre-read (rule-index → UI/layout/component + regression)

**Always:** `docs/agent-contract.md` (clauses 1–16, esp. 3/4/5 control+UX preservation, 7 i18n, 8/12 breakpoints+rendered matrix, 11 mobile full-width, 14 file-integrity, 15 regression, 16 TailAdmin), `docs/backlog.md`, `docs/critical-flow-registry.md` (**scan the `ListingCard`/`PriceBlock` hydration rows — Task 563 — this task touches a registered flow → clause 15 applies**).
**UI (required):** `docs/mantine-responsive-design-system.md` (FIRST — §8 Mantine Storybook proof, §12 canonical patterns, §18 theming/CSS pitfalls), `docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` (card chrome §-rows; if the card chrome is not an authoritative §6x row, EXTRACT it from the zip before implementing), `docs/ui-rules.md`, `docs/component-rules.md` (→ "Container / Presentational Primitive Split"), `docs/qa-rules.md`.
**Reference for the target layout/behavior:** `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` (read it — it is the behavior to match; do NOT edit it).
**Only if relevant:** `docs/design-system.md` (legacy — this IS a legacy-surface migration), `docs/state-authority.md` (SSR vs client for hydration-safe price/date).

## Current CONTENT to preserve (clause 3/4/5, Note 20 — every item must survive in the pattern's vertical layout)

Source of truth = `src/modules/listings/components/ListingCard.tsx` + `PriceBlock`. The LAYOUT changes to the
pattern's vertical/photo-first; the CONTENT below must all still render (correct data + placement within the
vertical card), at every locale:

- Public props consumed by the 28 vertical consumers unchanged: `{ listing, onBeforeNavigate?, displayCurrency?, rates?, isFavorited?, onFavoriteToggled?, priority?, layoutContext? }`. (The `variant` prop is retired — see below.)
- Wrapping `<Link href={/{locale}/listings/{slug}}>` with `data-track="listing_click"` + `data-listing-slug` + `onClick={onBeforeNavigate}`. Navigation must still work.
- Currency conversion: `showConversion`, `convertPriceMulti`, `activeCurrency`, `displayPrice`, `displayPriceOld`, `originalPriceStr` (always-'en' grouping, hydration-safe), `pricePerSqm` (rounded `displayPrice/area_gross`).
- Badges (`getBadges`): `sold`/`rented`/`archived`/`expired` (each exact color), `new` (within `LISTING_NEW_DAYS`), `price_reduced` (when `price_old && price < price_old`). Premium via card styling, not a text badge (premium top stripe + ring/elevation shadow tokens `--shadow-listing-card-ring`/`-elevation-lg`).
- Image: `AppImage variant="listing"` (aspect-[4/3], `priority`, `layoutContext`, `predictive`); no-image `Maximize2` fallback; sold/rented rotated overlay (`CLOSED_OVERLAY_STYLE`); photo-count bottom-right (`Camera` + count).
- Favorite: real `FavoriteButton` (`isFavorited`/`onFavoriteToggled`, `disabled` when `isListingClosed`, `disabledLabel` = localized `action_disabled_{status}`).
- Copy-ID button: `#{public_id ?? id.slice(0,8)}`, copies `listing.id`, 1.5s Check/Copy swap, `aria-label` `copy_id`/`id_copied`, focus ring, `preventDefault`+`stopPropagation` (must not navigate).
- Type label `t(listing_type) · t(property_type_{property_type})`; title `line-clamp-2`; features row `getCardFeatures` → `ListingFeatureIcon` + value; location `MapPin` + `name_al` (truncate); date `formatListingDate(created_at, locale)`; archived → `grayscale opacity-60`.

## Required after-behavior (the delta)

1. **Card renders the `MantineListingCardPattern` layout/adaptation** (photo-on-top vertical, full-width in its
   grid column) — Mantine primitives + TailAdmin chrome — carrying ALL the content above. **No new/changed
   adaptation logic**; the responsive behavior IS the pattern's.
2. **Reduced-price variant:** when `displayPriceOld` is present, show the **old price struck through** + the
   **new price** (first-class, TailAdmin-cited); plain-price case shows no strike.
3. **Retire the legacy `horizontal` variant:** remove it from `ListingCard`; update the single consumer
   `LatestListings.tsx:55` to drop `variant="horizontal"` so it renders the vertical card. Confirm no other
   consumer references `variant` (grep). No other consumer edited.
4. **Do NOT touch** `MantineListingCardPattern.tsx` or `ListingCardPattern.stories.tsx`.
5. **Hover effect (owner request 2026-07-15, dom.ria.com/uk reference — see gate below).**

## Hover / interaction effect (OWNER request — dom.ria.com/uk parity)

The owner wants the same hover behavior as the cards on `https://dom.ria.com/uk/`: **on card hover the cover photo
zooms in, and the card gains an elevation shadow.** Concretely:

- **Image zoom:** the cover image scales up smoothly (~`scale(1.05)`, `transition: transform ~200–300ms ease`) on
  hover of the **whole card** (use a `group` / `group-hover` relationship, NOT hover on the image alone — the whole
  card is the hover target, matching dom.ria). The image container MUST keep `overflow-hidden` so the zoom is
  clipped to the card's rounded corners (no bleed past the radius).
- **Card shadow:** on hover the card raises to an elevation shadow around the whole card. **Preserve** the existing
  behavior — vertical card `hover:shadow-lg` + subtle `hover:-translate-y-0.5` lift; premium keeps its
  `--shadow-listing-card-elevation-lg` ring/elevation. The shadow value must be a TailAdmin-cited token
  (`tailadmin-style-reference.md` shadow §-row / `shadow-theme-*`), not invented. Do not remove the lift or the
  premium ring.
- **Mantine implementation note (§18):** `:hover`/`group-hover` state styling CANNOT live in Mantine inline
  `styles` — use a CSS module / `input-chrome`-style stylesheet or Tailwind `group`/`group-hover` classes on the
  primitive (per `mantine-responsive-design-system.md` §18 "theme.styles = inline, no state selectors"). Verify
  the zoom + shadow render together on real hover, not just in the class list.
- **Accessibility:** wrap the transform in `@media (prefers-reduced-motion: reduce)` (or the Tailwind
  `motion-reduce:` variant) so the zoom is disabled/limited for users who opt out. No layout shift from the zoom
  (transform only — the image scales within its clipped container; card box does not resize).
- **Applies to the vertical card** (the only layout after this task). Confirm it works on touch devices gracefully
  (no stuck hover state).

## Presentational-primitive split gate (OWNER P0)

Extract a **prop-driven presentational primitive** (e.g. `ListingCardView`) — fully-resolved data via props, no
data/network hooks, no `useLocale`/`useTranslations` inside (pass locale + formatted strings/labels in). Model it
on `MantineListingCardPattern`'s structure (Card / Card.Section image / Stack), extended to the real content +
reduced price. `ListingCard` stays thin (translation, conversion, favorite wiring) rendering the primitive.

**🔴 Mantine-stories-only (owner P0):** the project works ONLY with Mantine stories; legacy stories are being
deleted — create NONE. Add ONE Mantine-native story at the primitive in `src/stories/mantine/primitives/`
(`Mantine/Primitives/ListingCardView`, matching the Sprint-44 Header primitives) per the Mantine proof path
(`mantine-responsive-design-system.md` §8/§13): `skipCanvas`/`layout:'fullscreen'`, single `Default` export,
`storybook.mantine.*` i18n with full sq/en/uk/it parity, toolbar-driven viewport+locale (no per-viewport /
per-locale / `Ukrainian*` exports, no `globals.locale` pin). Deterministic fixtures: plain-price + reduced-price
× status states (active/sold/rented/archived/expired) × premium × no-image. NO hook mock / `.storybook` alias /
live Supabase. Do NOT reuse or edit the existing `ListingCardPattern` story or any legacy listing story
(`StoryListingCard.tsx`, `ListingGrid.stories.tsx`, `FeaturedListings.stories.tsx`, `SimilarListings.stories.tsx`,
`RecentlyViewedSection.stories.tsx`) — if one breaks on the retired `variant`/API, STOP and ASK (their removal is
separate cleanup, not silent scope creep here).

## Mobile <640 full-width gate (OWNER P0)

The card is full-width in its `grid-cols-1` column below 768 — confirm + document. In-card interactive controls
(favorite `ActionIcon`, copy-ID) keep ≥44px touch targets; long sq/en/uk/it strings (type, title, badges,
features, location) wrap/clamp per the existing rules with **no horizontal scroll at 320** and **no overlap** in
the vertical layout. Image + info span the full card width.

## TailAdmin conformance gate (OWNER P0, clause 16)

Card chrome (border, radius, shadow, gray ramp, Outfit type scale, price = brand `#EC5447`, muted meta) matches
the TailAdmin reference; every color/px/radius/shadow traces to a `tailadmin-style-reference.md` §-row or the zip
— **zero invented values**. If the listing-card chrome (incl. the struck-through-old + new-price treatment) is not
yet an authoritative §6x row, EXTRACT it from `demo_tailadmin_com.zip` into a new row BEFORE implementing. Proven
RENDERED side-by-side vs the zip, not asserted; `tsc=0`/build is NOT style proof.

## Hydration-safety + regression coverage (clause 15 — ListingCard is a registered critical flow)

- Price/date/count formatting must be **hydration-deterministic** (Task 563 fixed a `ListingCard`/`PriceBlock`
  mismatch on `/sq|it/listings` — do NOT reintroduce it; keep always-'en' grouping for `originalPriceStr`, avoid
  locale-dependent `Intl.*` at render time per Task 564/565). No render-time `window`/`document`/`localStorage`/
  browser-Supabase.
- **Baseline the existing listing-card regression coverage** BEFORE changing anything (record green), then
  **add/update** a regression test for the migrated card (renders all content, reduced-price shows the strike,
  vertical layout, no hydration mismatch, retired `horizontal` prop gone). Provide a **planted-violation FAIL
  transcript** (clause 15). Update the `docs/critical-flow-registry.md` row(s). Cannot close without automated
  proof the old behavior still works.

## Positive flow (happy path)

Actor: visitor on `/{locale}` (homepage Latest) + `/{locale}/listings` (search) + favorites/cabinet grids.
1. Active listing, plain price → pattern-style vertical card (photo on top, then type→title→price→features→location/date/ID), all four locales.
2. Homepage "Останні" → now renders vertical cards (was horizontal); no h-scroll/overlap at 320.
3. Reduced listing (`price_old > price`) → `price_reduced` badge + old price struck through + new price.
4. Click card → navigates; `onBeforeNavigate` fires; favorite toggle + copy-ID still work (don't navigate).

## Negative flow (every off-happy-path branch)

- **No image** → `Maximize2` fallback, layout intact.
- **Sold/Rented** → rotated overlay + status badge; `isClosed` → favorite disabled with `disabledLabel`; navigation still allowed.
- **Archived/Expired** → grayscale/opacity + correct badge; no strike unless `price_old`.
- **Conversion off / rates null** → listing's own currency, no `originalPriceStr`, no crash.
- **`area_gross` 0/absent** → no per-m² line, no divide-by-zero.
- **Long title/location/type in uk/it** → wraps/clamps, no clip, no h-scroll at 320.
- **Double-click favorite / copy-ID** → existing debounce/1.5s swap preserved.
- **Guest vs authed** → favorite state/handler unchanged.

## Acceptance criteria (each verifiable in the diff / rendered matrix; cite both flows)

1. New `ListingCardView` Mantine presentational primitive (prop-driven, no data/network hook) renders the pattern's vertical layout with all preserved content; `ListingCard` is a thin container. The 28 vertical consumers compile untouched (grep-list + confirm). (file:line)
2. Full content inventory reproduced — each item verifiable (Positive/Negative flow line → file:line). Before/after control inventory in the session log; nothing silently dropped except the explicitly-authorized `horizontal` variant. (Note 20)
3. Card matches `MantineListingCardPattern`'s adaptation behavior — **no new/changed breakpoint logic** (diff shows no invented media queries); rendered proof across breakpoints. (file:line + PNG)
4. Reduced-price variant: old price struck through + new price, TailAdmin-cited, sq/en/uk/it; plain-price has no strike. (file:line + PNG)
4a. **Hover effect (dom.ria parity):** on card hover the cover image zooms (~`scale(1.05)`, smooth transition, clipped by `overflow-hidden`) AND the card raises to a TailAdmin-cited elevation shadow (+ existing lift/premium ring preserved); wrapped in `prefers-reduced-motion`; no layout shift. Proven with a rendered hover-state capture, not just class presence. (file:line + hover PNG)
5. `horizontal` variant removed from `ListingCard`; `LatestListings.tsx` updated to drop it; grep proves no other `variant=` consumer. (file:line)
6. `MantineListingCardPattern.tsx` + `ListingCardPattern.stories.tsx` **untouched** (`git diff` = zero on both).
7. Presentational-split gate: new **Mantine-native** story in `src/stories/mantine/primitives/` (`Mantine/Primitives/ListingCardView`), single `Default`, `skipCanvas`/`fullscreen`, `storybook.mantine.*` sq/en/uk/it parity, toolbar-driven; fixtures plain/reduced × status × premium × no-image; NO hook mock/alias/live Supabase; NO legacy story created. (file:line)
8. Hydration-safe (no reintroduced Task-563 mismatch); regression test added/updated with green baseline + **planted-violation FAIL transcript**; `critical-flow-registry.md` updated. (clause 15)
9. **Rendered verification matrix** (clause 12): canonical breakpoints × sq/en/uk/it, **uk@320/375/390 mandatory**; real per-cell evidence (photo-first vertical? full-width? strike shown? no clip/overflow? no h-scroll?). `tsc=0`/build is NOT proof.
10. TailAdmin conformance proven side-by-side vs the zip (border/radius/shadow/font/price brand color/strike style); every value §-cited.
11. Gates: `tsc`=0, eslint clean, `check:i18n` 4-locale parity for any new `storybook.mantine.*` keys, `check:stories`, `check:file-integrity`, `check:mojibake`, relevant vitest suites green. No `git add`/`git commit` (orchestrator emits at review).
12. Session log: AC-by-AC self-audit, UX flow trace, before/after control inventory, "Files Changed" table, rendered matrix, planted-violation transcript. `docs/backlog.md` + registry updated.

## Scope (files)

**In scope:** new `ListingCardView` primitive + its Mantine story (+ any new `storybook.mantine.*` keys ×4 locales), `src/modules/listings/components/ListingCard.tsx` (→ thin container, retire `horizontal`), `src/modules/listings/components/LatestListings.tsx` (drop `variant="horizontal"` + its `RowSkeleton` if it no longer matches — adjust skeleton to the vertical card shape), any `theme.ts`/tailadmin §6x row needed for the card chrome, `docs/critical-flow-registry.md`, regression test file(s), `docs/backlog.md`, session log.

**Out of scope (do NOT touch):** `MantineListingCardPattern.tsx`, `ListingCardPattern.stories.tsx`; the 28 vertical consumer call sites' logic; any legacy story (their deletion is separate cleanup); any non-listing surface.

## Hard contract

No scope change; no invented architecture — in particular **do NOT design any adaptation/breakpoint logic**; adopt
the pattern's behavior as-is (STOP and ASK on: any TailAdmin value not in a §-row, whether a legacy story must be
deleted, any consumer that would need an API change beyond `LatestListings`). Preserve every content item and UX
flow (clause 3/4/5); the ONLY authorized removal is the `horizontal` variant (+ its single consumer prop). Both
positive AND every negative branch implemented. All 4 locales. Hydration-safe. Self-validate before "complete";
AC-by-AC table + "Files Changed" table + rendered matrix + planted-violation transcript required; executor emits
NO git. This is a critical-flow surface — a silently dropped behavior or a reintroduced hydration mismatch is a
TASK FAILURE.
