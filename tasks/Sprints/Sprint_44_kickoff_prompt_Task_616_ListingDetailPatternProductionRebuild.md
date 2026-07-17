# Task 616 (RE-SCOPED 2026-07-16) — Rebuild the listing-detail surface as an ALL-MANTINE composition: new Mantine gallery pattern (→ lightbox), new Mantine contact-card pattern (own story), Mantine badges/features/description, schema-sourced fixture

Sprint 44 (Epic MM Phase-2). **RE-SCOPED after the owner rejected the first 616 attempt.** The first kickoff
told the executor to "mirror `ListingDetailViewBody`" and pointed at the real `ListingDetailView.tsx` as the
chrome model — but that view is built on **legacy `@/components/ui/*` primitives** (legacy `Badge`, legacy
`Button`, legacy `Avatar`). So the executor faithfully reproduced legacy chrome inside a `Patterns/Mantine/*`
story (legacy badges, legacy buttons, no contact-card story, a plain `Paper` gallery). That defeats the entire
Mantine migration. **This is an orchestrator kickoff failure — corrected here.** Owner decisions 2026-07-16
(`AskUserQuestion`): **one comprehensive task**, and **a NEW Mantine gallery pattern that owns its lightbox
behavior** (not merely reusing `LightboxView`). Plus (owner, same session): **the photo must be a Mantine
component; clicking it opens a Mantine lightbox**; **the contact card must be its own Mantine story**; **badges
and buttons must be Mantine, not legacy.**

## 🔴 CORE MANDATE — ALL-MANTINE, ZERO LEGACY PRIMITIVES (the #1 requirement)
Every visual element in the in-scope patterns AND their stories MUST be a **Mantine primitive** (`@mantine/core`)
or a canonical project **Mantine pattern** (`src/design-system/mantine/*`). **NO `@/components/ui/*` imports
anywhere in the in-scope files** — no legacy `Badge`, `Button`, `Avatar`, `Input`, `Card`, `Sheet`, `Dialog`,
etc. `lucide-react` icons are allowed (they are icon SVGs, not UI primitives — the same as every other Mantine
story). **Machine-gated:** `grep -rn "@/components/ui/" <in-scope files>` MUST return **zero** matches; this is an
acceptance criterion and a planted-violation target. You MAY *read* `ListingDetailView.tsx` / `ListingContact.tsx`
/ `GalleryStaticFrame.tsx` / `GalleryIsland.tsx` as **content & behavior models**, but you re-implement every
element with Mantine — never import from them.

## Pre-read (rule-index: UI / layout / component task)
- **Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — these
  patterns are Storybook-only, NOT wired to the live page; `ListingDetailView.tsx`/`ListingContact.tsx` stay
  untouched → no live critical-flow change; the rendered gate is the coverage).
- **Required:** `docs/mantine-responsive-design-system.md` (**FIRST** — §7 mobile gate, responsive props, §18
  CSS/cascade-layer pitfalls — CRITICAL for the lightbox + any icon-in-field/overlay chrome), `docs/tailadmin-style-reference.md`
  (§6a Button, §6m card chrome, gray ramp, Outfit), `docs/ui-rules.md`, `docs/component-rules.md`
  (Container/Presentational split — every new pattern is prop-driven, hook-free), `docs/qa-rules.md`.
- **Read as models (do NOT edit, do NOT import):** `src/modules/listings/components/ListingContact.tsx`
  (contact-card CONTENT), `src/modules/listings/components/LightboxView.tsx` (the Task 612 Mantine fullScreen-Modal
  lightbox — its API + its §18 cascade-layer notes are the proven technique), `src/modules/listings/components/GalleryStaticFrame.tsx`
  + `GalleryIsland.tsx` (gallery behavior), `src/modules/listings/components/ListingDetailView.tsx`
  (`ListingDetailViewBody` — overall LAYOUT/content only), `src/stories/patterns/mantine/ListingCardPattern.stories.tsx`
  (the Task 605 precedent for a source-cited, hook-free demo).
- **Source of truth for demo data:** `src/modules/listings/domain/presentationEngine.ts`
  (`getDetailFeatures`/`getDetailAttributes`), `src/app/globals.css:373-375` (badge tokens).

## Deliverables

### D1 — `MantineListingGalleryPattern` (NEW pattern + NEW story) — the photo IS a Mantine component that opens a Mantine lightbox
- New file `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx`, exported from `patterns/index.ts`.
- Pure, prop-driven, `'use client'` (needs open-state), **hook-free of data/network** (no Supabase/router):
  props = `images: {url}[]`, `title`, `labels` (close/prev/next/counter — i18n passed in), optional `photoCount`.
- Renders a **Mantine** main photo (Mantine `Image`, `radius`, cover) + (if >1) a thumbnail row / "N photos"
  counter, all Mantine. **Clicking the photo opens a Mantine fullScreen-Modal lightbox** — the gallery pattern
  **owns the lightbox open/active-index/prev/next/select state**. Reuse the Task 612 `LightboxView` primitive as
  the modal it renders (single source of the lightbox chrome) — the gallery owns the state and open-trigger,
  `LightboxView` renders the modal. Follow Task 612's §18 cascade-layer/z-index notes so the lightbox sits above
  page chrome (do NOT reintroduce the z-index bug). If reusing `LightboxView` conflicts with "gallery owns its
  lightbox", **STOP and ASK** — do not silently fork a second lightbox.
- New story `Mantine/Patterns/…/ListingGalleryPattern` (or under the existing Patterns/Mantine group), single
  `Default`, `play` opens the lightbox so the rendered gate captures the OPEN state (Task 607 open-trigger
  precedent). Skeleton/no-image fallback covered.

### D2 — `MantineListingContactPattern` (NEW pattern + NEW story) — the contact card, all Mantine, its own story
- New file `src/design-system/mantine/patterns/MantineListingContactPattern.tsx`, exported from `patterns/index.ts`.
- Pure, prop-driven, hook-free presentational primitive. Content MIRRORS `ListingContact.tsx` but **all Mantine**:
  - Agent block: Mantine `Avatar` (avatar url / initials fallback), name, **verified** indicator (Mantine
    `Badge`/`ThemeIcon` + `CheckCircle`), company/user-type, deleted/guest/unavailable states.
  - Price block: price + optional original price (struck) — Mantine `Text`/`Title`, brand color.
  - Actions: **Call** (`Phone`) + **WhatsApp** (`MessageCircle`) Mantine `Button`s, **Share** (`Share2`),
    **Favorite**, **Inquiry** trigger, **Report** trigger, guest **Login** CTA — all Mantine `Button`/`ActionIcon`.
    Handlers passed as props (`onCall`/`onWhatsApp`/`onShare`/…); favorite/inquiry/report may be passed as
    positioned **nodes** (hook-free split, Task 605 pattern) so the pattern never imports the real stateful
    components. Preserve the Task 615 CTA behavior for Call/WhatsApp (`Flex direction={{base:'column',sm:'row'}}`
    + `flex:1 minWidth:0` + wrapping `<span>`; sticky `Paper position:sticky; top:80`).
  - States mirror `ListingContact`: normal / guest-CTA / owner-deleted / owner-unavailable / closed-listing.
- New story `Mantine/Patterns/…/ListingContactPattern`, single `Default`, showing the key states (normal + guest
  + deleted) via a `Stack` of instances (like `ListingCardPattern.stories.tsx`).

### D3 — `MantineListingDetailPattern` (REBUILD) — compose D1 + Mantine info block + D2
- Rebuild so the story renders a production-representative detail, **entirely Mantine**:
  - Two-column responsive grid, content left + **D2 sticky contact card** right; `<640` single column.
  - Left column: **D1 gallery**, then a **badges row** (Mantine `Badge` — new/premium/reduced status + listing-type
    + property-type; colors mapped to the `--badge-*` tokens `globals.css:373-375`: new=green, premium=gold,
    reduced=brand; type badges = neutral/outline — cite tokens, invent nothing), **price block** (price + struck
    original + per-sqm), **meta row** (MapPin location · Eye views · CalendarDays date · ID), a **key-features
    card** (Mantine `Card`/`Paper`, bordered, TailAdmin §6m; icon+short-label+value grid `cols={{base:2,sm:3,md:4}}`),
    a **titled description card**, and an **amenities card** (label/value grid). No `split('.')[0]` hack, no legacy
    `Badge`, no plain-`Paper` gallery.
  - Keep the Task 609 `gutter={0}` + `pr`/`mb` gap approach.
- The pattern composes D1 and D2 (imports them from `patterns/index.ts`), plus its own Mantine info block.

## Demo-content source-of-truth spec (MANDATORY — enumerate, cite, never guess)
- **Key features** — mirror `getDetailFeatures` (`presentationEngine.ts:138`) order + icons: **rooms** (bed-double),
  **bathrooms** (bath), **area gross** (area/Maximize2), **floor** (building) — each `{ icon, label=t(short key),
  value }`; short labels (Rooms/Bathrooms/Area/Floor), distinct values (3 · 2 · 85 m² · 3/5). Icons cited to
  `propertyTypeSchema.ts` / matching `ListingCardPattern.stories.tsx demoFeatures`.
- **Amenities** — mirror `getDetailAttributes`: condition / heating / wall_type as `{label, value}`.
- **Description** — a NEW real multi-sentence key `storybook.mantine.listing_detail_description` (all 4 locales).
  **`empty_description` is FORBIDDEN here.**
- **Badges / price / meta / contact** — reuse existing correct `storybook.mantine.card_*` keys where present
  (`card_title_1`, `card_location_tirana`, `card_price_1`, `card_price_old_1`, `card_price_per_sqm_1`,
  `card_badge_new`/`premium`/`reduced`, `card_type_label`, `card_footer_date`, `card_favorite_aria_*`,
  `listing_contact_call`/`_wa`). Any NEW string (short feature labels, amenity labels/values, description,
  contact/agent/verified/share/inquiry/report/views/photos-counter labels) → add to ALL four `messages/*.json`
  (`sq`/`en`/`uk`/`it`), `check:i18n` green. **After each `messages/*.json` write, read it back + `JSON.parse`
  (clause 14) — the first 616 attempt left `en.json` with an unterminated string; do NOT repeat.**

## Positive flow
- `ListingDetailPattern/Default` desktop → full Mantine detail: Mantine gallery photo (clickable), Mantine badges
  (new/premium/reduced/type), price+per-sqm+struck original, meta row, Mantine key-features card with icons +
  short labels + distinct values, titled description card with a REAL description, amenities card, and the Mantine
  sticky contact card (agent + Call/WhatsApp row + share/favorite/inquiry/report).
- Clicking the gallery photo → Mantine fullScreen lightbox opens above all page chrome; prev/next/thumbnails work.
- `ContactCardPattern/Default` and `GalleryPattern/Default` render standalone in their own stories.
- `<640` → single column, every card + control full-width; CTAs full-width stacked (Task 615). `sm`~768 → CTAs
  side-by-side, long `uk` labels wrap (Task 615), no clip/overflow.

## Negative flow
- **ANY `@/components/ui/*` import in an in-scope file** → REJECT (the core failure this re-scope fixes; grep-gated).
- Legacy-looking badge/button/avatar rendered instead of the Mantine primitive → REJECT.
- Gallery photo not clickable / lightbox doesn't open / opens below page chrome (z-index regression) → REJECT.
- No standalone Mantine story for the contact card OR the gallery → REJECT.
- Fixture diverges from the cited source (wrong icon/order, full-phrase-as-label, `empty_description`) → REJECT.
- Any card/control not full-width at `<640` (clause 11) → REJECT. Card chrome ≠ TailAdmin §6m (clause 16) → REJECT.
- A pattern grows a data/network hook or Supabase (breaks the presentational split) → REJECT.
- `messages/*.json` unparseable / truncated (clause 14) → REJECT.
- `ListingDetailView.tsx` / `ListingContact.tsx` / `presentationEngine.ts` edited (out of scope) → REJECT.
- Any ambiguity in decomposition, lightbox reuse, or contact-card states → **STOP and ASK**, do not guess.

## Acceptance criteria
1. **Mantine purity:** `grep -rn "@/components/ui/"` across all in-scope files = 0 (transcript). Planted-violation:
   add one legacy import → grep/gate flags it → revert.
2. Three deliverables present: `MantineListingGalleryPattern` (+story, lightbox opens via `play`),
   `MantineListingContactPattern` (+story), rebuilt `MantineListingDetailPattern` composing both.
3. Demo values/icons/order/labels verified against the cited source (`getDetailFeatures`/`getDetailAttributes`/
   `propertyTypeSchema.ts`, `file:line`); description is a real key; `empty_description` gone; short feature labels.
4. Rendered proof for ALL THREE stories at 320/375/390/768/1024 × `sq/en/uk/it` (`uk@320`+`uk@768` mandatory);
   gallery story proven with the lightbox OPEN. Card chrome side-by-side vs TailAdmin §6m/§6a.
5. `npm run screenshots:assert -- --mantine-only` → the three stories PASS, overall 0 FAIL, AMBIGUOUS unchanged
   (full transcript); add a persisted `band-768` viewport cell for `ListingDetailPattern` (Task 573 precedent).
6. Task 615 CTA behavior + Task 609 gutter preserved (probe/gate proof incl. `uk@768`).
7. Anti-regression (clause 13): plant a real overflow/legacy-import/wrong-fixture violation → gate FAILs → revert.
8. `npx tsc --noEmit`, `check:file-integrity`, `check:mojibake`, `check:stories`, `check:i18n` all clean (each
   `messages/*.json` read-back + `JSON.parse` verified). Session log + `docs/backlog.md` (mark 616 done, tidy) +
   "Files Changed" table. **NO git commands** (single-writer).

## Scope (files)
**In scope:** `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` (new),
`…/MantineListingContactPattern.tsx` (new), `…/MantineListingDetailPattern.tsx` (rebuild), `…/patterns/index.ts`,
their three story files under `src/stories/patterns/mantine/`, `messages/*.json` (new keys ×4),
`scripts/check-stories-rendered.mjs` (register the two new stories + the `band-768` cell), the persisted
screenshots dir, `docs/backlog.md`, session log. Any new CSS module for a pattern is in scope.
**Out of scope:** `ListingDetailView.tsx`, `ListingContact.tsx`, `LightboxView.tsx` (reuse, don't edit),
`presentationEngine.ts`, `propertyTypeSchema.ts`, all other patterns/primitives, any live-page wiring.

## Hard contract
ALL-Mantine, ZERO `@/components/ui/*` (grep-gated, the P0 of this task). Three deliverables: new Mantine gallery
pattern (photo → Mantine lightbox, own story), new Mantine contact-card pattern (own story), rebuilt detail pattern
composing both with Mantine badges/features-card/description-card/amenities-card. Fixture cited to
`getDetailFeatures`/`getDetailAttributes` (Demo-content gate — enumerate, never guess), real description key,
`empty_description` forbidden. Preserve Task 615 CTA + Task 609 gutter. Pure presentational primitives (no
hook/Supabase). TailAdmin §6m/§6a chrome, all four locales, mobile full-width `<640`. Rendered matrix
320/375/390/768/1024 × `sq/en/uk/it` (`uk@320`+`uk@768`) for all three stories + `band-768` gate cell + lightbox-open
proof. Read-back + `JSON.parse` every `messages/*.json` write (clause 14). Planted-violation anti-regression
(legacy-import + overflow). STOP and ASK on ANY ambiguity — this task was re-scoped precisely because the first
attempt guessed. Executor emits NO git.
