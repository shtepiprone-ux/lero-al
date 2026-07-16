# Task 616 — Rebuild `MantineListingDetailPattern` into the COMPLETE, production-representative listing-detail pattern (single source of truth), fix the broken story fixture

Sprint 44 (Epic MM Phase-2). Orchestrator-opened 2026-07-16 after the owner rendered
`Patterns/Mantine/ListingDetailPattern/Default` and correctly rejected it as "not ready": the story
fixture is broken and the pattern is a hollow skeleton next to the real `ListingDetailView`. This is the
analogue of **Task 605** (which rebuilt `MantineListingCardPattern` into the complete, data-driven card) —
apply the same treatment to the detail pattern. Owner decision 2026-07-16 (`AskUserQuestion`): **full
production-ready rebuild**, not a fixture-only patch.

## Why this task exists (confirmed defects in the current story)
`src/stories/patterns/mantine/ListingDetailPattern.stories.tsx`:
1. **Description uses the wrong i18n key.** `description: storyT(l, 'storybook.mantine.empty_description')`
   → resolves to **"Try a different search"** (an EMPTY-STATE string), so the description block reads
   "Try a different search" twice (the component renders `description.split('.')[0]` bold + the full text
   dimmed).
2. **Feature rows are garbled — labels are full phrases, values duplicate them.** The fixture pairs
   `label = listing_feature_rooms` ("3 rooms") with `value = '3'` → "3 rooms / 3";
   `label = listing_feature_area` ("85 m²") with `value = '85 m²'` → "85 m² / 85 m²";
   `label = listing_feature_floor` ("3rd floor") with `value = '3'` → "3rd floor / 3". This is a
   **Demo-content source-of-truth gate** violation (agent-contract clause + `orchestrator-role.md`
   "Demo-content source-of-truth gate", the Task 606 drift rule): the demo was hand-guessed, not derived
   from `getDetailFeatures`.
3. **The pattern is a hollow skeleton.** Compared to the real `src/modules/listings/components/ListingDetailView.tsx`
   (`ListingDetailViewBody`), the pattern is missing: the badges row (new/premium/reduced + listing-type +
   property-type), the price block (per-sqm + struck original price), the meta row (location · views · date · ID),
   a proper **key-features card with per-feature icons**, a titled **description card**, and an **amenities
   (additional-details) card**. It renders bare text with no card chrome — which is why the owner reads it as
   "no styles at all."

## Pre-read (rule-index: UI / layout / component task)
- **Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — this
  pattern is Storybook-only, NOT yet wired to the live page; `ListingDetailView.tsx` stays untouched, so no
  live critical-flow behavior changes; the rendered gate is the coverage).
- **Required:** `docs/mantine-responsive-design-system.md` (**FIRST** — §7 mobile gate, responsive-prop
  system, §18 CSS pitfalls), `docs/tailadmin-style-reference.md` (§6a Button, §6m card chrome, gray ramp,
  Outfit type — the cards must match TailAdmin), `docs/ui-rules.md`, `docs/component-rules.md`
  (Container/Presentational split), `docs/qa-rules.md`.
- **Reference the source of truth (do NOT edit them):** `src/modules/listings/components/ListingDetailView.tsx`
  (`ListingDetailViewBody` — the production chrome to mirror), `src/modules/listings/domain/presentationEngine.ts`
  (`getDetailFeatures`/`getDetailAttributes`/`DetailFeature`/`DetailAttribute` — the data shapes), and
  `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` (the Task 605 precedent for a source-cited demo).

## Required after-behavior — the rebuilt pattern
Rebuild `MantineListingDetailPattern` so its Storybook story renders a **production-representative** listing
detail. Keep it a **pure, prop-driven presentational primitive** (no data/network hook, no Supabase) — the
container split stays clean. Preserve the existing responsive shell decisions and the Task 615 fix:

- **Two-column responsive grid** — content left, sticky contact panel right (`position:sticky; top:80`).
  `<640` single column, `sm+` two columns. Keep the Task 609 `gutter={0}` + `pr`/`mb` gap approach.
- **Contact CTAs** — the Task 615 fix is preserved verbatim: `Flex direction={{ base:'column', sm:'row' }}`,
  each `Button` `flex:1 minWidth:0` + `styles.inner/label minWidth:0` + wrapping `<span>` (labels wrap, never
  clip/overflow at tight `sm+` widths). Do NOT regress this.
- **Add the missing production chrome (mirror `ListingDetailViewBody`, TailAdmin §6m card chrome — bordered,
  `rounded-2xl`/theme radius, `shadow-theme-xs`, `bg` card, gray-ramp text):**
  - **Badges row:** new/premium/reduced status badges + a listing-type badge + a property-type badge.
  - **Price block:** primary price (brand), struck original price when reduced, per-sqm string.
  - **Meta row:** location (MapPin) · views (Eye) · relative date (CalendarDays) · ID.
  - **Key-features card:** a bordered card containing an icon+label+value grid
    (`cols={{ base:2, sm:3, md:4 }}`) — **each feature has its own icon** (via a passed node, mirroring
    `ListingFeatureIcon`), a SHORT translated label, and a distinct value.
  - **Description card:** a titled card ("Description" heading + body text) — NOT the current
    `split('.')[0]` bold-then-dimmed hack.
  - **Amenities/additional-details card:** a bordered card with a label/value grid (condition/heating/wall).
- **Prop API:** extend `MantineListingDetailData` (or the props) so all of the above are passed in as data /
  positioned nodes — icons and the favorite/gallery-style elements passed as nodes (hook-free split, Task 605
  pattern). Keep the public export name `MantineListingDetailPattern`. Document the new API in the JSDoc.

## Demo-content source-of-truth spec (MANDATORY — enumerate, do NOT guess; agent-contract Demo-content gate)
The story fixture MUST mirror the real engine output. Cite each to source. For a demo **apartment**:

- **Key features** — mirror `getDetailFeatures` (`presentationEngine.ts:138`) order + icons (schema
  `presentation.icon`, `showInDetail`): **rooms**, **bathrooms**, **area (gross)**, **floor** — each row =
  `{ icon, label = t(short labelKey), value }`, e.g. Rooms→`3`, Bathrooms→`2`, Area→`85 m²`, Floor→`3/5`.
  Use the schema's icons (bed-double / bath / area / building — match `ListingCardPattern.stories.tsx`
  `demoFeatures`, cited to `propertyTypeSchema.ts`). Do NOT reuse the current full-phrase
  `listing_feature_*` strings as labels.
- **Amenities** — mirror `getDetailAttributes`: condition / heating / wall_type as `{ label, value }` pairs.
- **Description** — a REAL multi-sentence property description key (add a new
  `storybook.mantine.listing_detail_description` with all four locales — NOT `empty_description`).
- **Badges / price / meta** — reuse the existing correct `storybook.mantine.card_*` keys where they exist
  (`card_title_1`, `card_location_tirana`, `card_price_1`, `card_price_old_1`, `card_price_per_sqm_1`,
  `card_badge_new`/`premium`/`reduced`, `card_type_label`, `card_footer_date`). Any NEW string → add to ALL
  four `messages/*.json` (`sq`/`en`/`uk`/`it`), `check:i18n` green, short labels (Rooms/Bathrooms/Area/Floor/
  Views/Description/Amenities) as their own keys.

## Positive flow
- `Patterns/Mantine/ListingDetailPattern/Default`, desktop (≥1024), any locale → full production-representative
  detail: badges row, price + per-sqm + struck original, meta row, key-features **card** with icons + short
  labels + distinct values (no "3 rooms / 3" duplication), a titled description card with a REAL description
  (never "Try a different search"), an amenities card, and the sticky contact panel with the Call/WhatsApp row.
- `<640` → single column, all cards full-width, CTAs full-width stacked (Task 615 base behavior preserved).
- `sm` tight (~768) → CTAs side-by-side, long `uk` labels wrap (Task 615), no overflow/clip.

## Negative flow
- **Any feature/amenity/description value diverges from the cited source** (wrong icon, wrong order, a
  full-phrase used as a label, `empty_description` as the description) → REJECT (Demo-content gate).
- **A card is not full-width at `<640`** (mobile gate, clause 11) → REJECT.
- **Card chrome doesn't match TailAdmin §6m** (border color, radius, shadow, Outfit, density) → REJECT (clause 16).
- **The pattern grows a data/network hook or Supabase** (breaks the presentational-primitive split) → REJECT.
- **CTA row (Task 615) regresses** (clips/overflows/overlaps at `sm+`, or not full-width stacked `<640`) → REJECT.
- **`ListingDetailView.tsx` or `presentationEngine.ts` is edited** (out of scope — this is Storybook-only) → REJECT.
- If any production-chrome element's correct mobile/stacking behavior is genuinely ambiguous → **STOP and ASK**.

## Acceptance criteria
1. Story renders the full production-representative detail (badges/price/meta/features-card/description-card/
   amenities-card/contact panel) — rendered proof at 320/375/390/768/1024 × `sq/en/uk/it`, `uk@320` + `uk@768`
   mandatory. (clause 11 + 12 + 16)
2. **Demo values + icons + order + labels verified against the cited source** (`getDetailFeatures`/
   `getDetailAttributes`/`propertyTypeSchema.ts`, `file:line`) — the review checks parity, not "renders fine".
3. Description is a real key (all four locales); `empty_description` is gone from this story; feature labels are
   SHORT (no full-phrase-as-label, no value duplication).
4. Card chrome matches TailAdmin §6m/§6a — rendered side-by-side with the zip reference.
5. Pattern stays a pure presentational primitive (no data/network hook, no Supabase) — container split intact.
6. Task 615 CTA behavior preserved (probe/gate proof at the tight `sm+` cells incl. `uk@768`).
7. `npm run screenshots:assert -- --mantine-only` → `ListingDetailPattern` cells PASS, overall 0 FAIL,
   AMBIGUOUS unchanged (full transcript); durable coverage — **add a persisted `band-768` viewport cell for
   `ListingDetailPattern`** in `scripts/check-stories-rendered.mjs` (mirroring Task 573's `band-700` for
   HeroSearch) so the tight two-across CTA wrap has CI coverage, not just an ad-hoc probe.
8. Anti-regression (clause 13): plant a real overflow/wrong-fixture violation, show the gate FAILs, revert.
9. `npx tsc --noEmit`, `check:file-integrity`, `check:mojibake`, `check:stories`, `check:i18n` all clean.
   Session log + `docs/backlog.md` (mark 616 done, tidy) + "Files Changed" table. **NO git commands** (single-writer).

## Scope (files)
**In scope:** `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` (rebuild),
`src/stories/patterns/mantine/ListingDetailPattern.stories.tsx` (source-cited fixture), `messages/*.json`
(new keys ×4), `scripts/check-stories-rendered.mjs` (the `band-768` cell only), the persisted screenshots dir,
`docs/backlog.md`, session log.
**Out of scope:** `ListingDetailView.tsx`, `presentationEngine.ts`, `propertyTypeSchema.ts`, `getDetailFeatures`
(read-only source), every other pattern/primitive, any live-page wiring.

## Hard contract
Full production-representative rebuild mirroring `ListingDetailViewBody`, fixture cited to `getDetailFeatures`/
`getDetailAttributes` (Demo-content gate — enumerate, never guess). Preserve the Task 615 CTA fix and the Task
609 Grid-gutter fix verbatim. Pure presentational primitive (no hook/Supabase). TailAdmin §6m card chrome, all
four locales, mobile full-width `<640`. Rendered matrix 320/375/390/768/1024 × `sq/en/uk/it` (`uk@320`+`uk@768`
mandatory) + the new persisted `band-768` gate cell. Planted-violation anti-regression proof. STOP and ASK on any
ambiguity. Executor emits NO git.
