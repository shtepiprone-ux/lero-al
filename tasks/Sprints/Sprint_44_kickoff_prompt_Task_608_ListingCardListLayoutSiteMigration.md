# Task 608 — Migrate `ListingCard.tsx` `horizontal` branch onto `MantineListingCardPattern layout="list"` (site wiring)

Sprint 44 (Epic MM Phase-2 — Mantine/TailAdmin migration). Owner-directed 2026-07-15: after the
Storybook `layout="grid"|"list"` pattern was approved (Task 606) and the Grid/List title-hover
asymmetry was fixed (orchestrator hotfix, 2026-07-15), the owner approved porting the completed
single-source card to the live site.

> **⚠ This is the site-wiring half that Task 606 explicitly HELD.** Task 602/605 already migrated the
> `vertical` branch of `ListingCard.tsx` onto `MantineListingCardPattern`. This task does the SAME for
> the `horizontal` branch, collapsing the last hand-rolled listing-card markup onto the single source.
> **No pattern/story edits, no new pattern features** — the pattern's `layout="list"` already exists and
> is owner-approved. You are only rewriting the container branch to consume it.

## Why this exists

`src/modules/listings/components/ListingCard.tsx` still has two very different code paths:
- **`variant === 'vertical'`** (lines ~278–373) — a thin data-mapper: builds `image`/`favorite`/
  `footerActions` nodes and renders `<MantineListingCardPattern … />` inside a `<Link>`. ✅ already single-source.
- **`variant === 'horizontal'`** (lines ~173–276) — the LEGACY hand-rolled row markup (image + info column,
  badges, `PriceBlock`, features, footer copy-id/date). This is a byte-for-byte duplicate of what now lives
  in `MantineListingCardPattern`'s `layout="list"` branch. It must be replaced by a consume-the-pattern mapper,
  exactly like the vertical branch.

Because `/listings` (and any list surface) selects the row shape via the `variant` prop, migrating this one
branch propagates to every list-view consumer with no other wiring.

## Pre-read (rule-index → UI / layout / component task)

**Always:** `docs/agent-contract.md` (all 16 clauses — esp. 3/4/5 control+UX preservation, 11 mobile full-width,
12/13 rendered evidence, 14 file-integrity, 15 regression, 16 TailAdmin), `docs/backlog.md`,
`docs/critical-flow-registry.md` (**scan — listing-card display is a critical flow; baseline the existing test,
add/update coverage for the horizontal branch, do not close without automated proof the old behavior still works**).
**Required:** `docs/mantine-responsive-design-system.md` (§7 mobile gate, §12 patterns, §18 cascade-layer pitfalls —
the list layout relies on the unlayered `.listRow`/`.card` rules), `docs/tailadmin-style-reference.md` (§5 content-card
chrome the pattern already conforms to — no new extraction needed), `docs/ui-rules.md`, `docs/component-rules.md`
(Container/Presentational split — the container stays the thin data-mapper), `docs/qa-rules.md`.
**Read (the files in play):** `src/modules/listings/components/ListingCard.tsx` (both branches — the vertical branch
IS your template), `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` (the `layout="list"` branch +
its prop contract for `favorite` inline positioning, `overlay`/`photoCount` intentionally absent),
`src/design-system/mantine/patterns/MantineListingCardPattern.module.css`,
`src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx`.

## Current behavior to preserve (horizontal branch, real page)

Every one of these must still work identically on the live list view after the migration:
- The row is a single clickable `<Link href="/{locale}/listings/{slug}">` carrying `data-track="listing_click"`,
  `data-listing-slug`, and the `onBeforeNavigate?.(slug)` click. **Keep the `<Link>` wrapper** — the pattern does
  not render a link (same as the vertical branch).
- Image = **`AppImage variant="listing-thumb"`** (thumb, NOT the vertical `"listing"` variant), with the `Maximize2`
  no-image fallback, `priority`, `predictive`.
- **Badges** (new / price_reduced / sold / rented / archived / expired) via `getBadges` + `t()`, top-left over the image.
- **Favorite** = real `FavoriteButton` rendered **inline** in the info column's top row next to the type label —
  it MUST stay non-absolutely-positioned (`className="shrink-0 -mt-0.5 -mr-1"`, the pattern's `layout="list"` favorite contract).
- **Title** — brand-red on hover (the fix just shipped: pattern list uses `<h3 … group-hover:text-primary>`).
- **Price** via the same converted/`price_old`/per-sqm logic (`priceSize="base"` equivalent — the pattern list price is `text-base`).
- **Features** row (`getCardFeatures` → `ListingFeatureIcon` nodes + values).
- **Footer** = copy-id button (with `idCopied` state, `copyId` handler, `#public_id`/`Copy`/`Check` icons) **+** the
  `formatListingDate` date, bottom-right next to the location. Copy-id `stopPropagation`/`preventDefault` must still fire
  without navigating.
- **Location** with `MapPin`.
- `isPremium` and `isArchived` states.
- **NO overlay, NO photo-count pill, NO contact CTA** in the list row (the ported legacy design never had them —
  do NOT pass `overlay`/`photoCount`/`onContact`).

## Required after-behavior (the delta)

1. Replace the entire `if (variant === 'horizontal') { … legacy markup … }` block with a **thin data-mapper** that
   renders `<MantineListingCardPattern layout="list" … />` inside the same `<Link>`, mirroring the vertical branch:
   - `data` = `{ id, title, location: locationName, price: formatPrice(displayPrice,…), priceOld: displayPriceOld ? … : undefined }` (identical to vertical).
   - `image` = the `listing-thumb` `AppImage` node (built in the container — the container owns image delivery).
   - `favorite` = the real `FavoriteButton` with the **inline** `className="shrink-0 -mt-0.5 -mr-1"` (NOT `absolute`).
   - `typeLabel`, `badges` (pre-translated `patternBadges`), `features` (pre-rendered icon nodes), `originalPriceStr`,
     `pricePerSqmStr`, `isPremium`, `isArchived` — same mappings the vertical branch already builds.
   - `footerActions` = the copy-id button + date (the pattern's `layout="list"` positions `footerActions` bottom-right
     next to the location — do not add an extra `justify-end` wrapper; match the vertical `footerActions` node contents).
   - Do **NOT** pass `overlay`, `photoCount`, or `onContact`.
2. **De-duplicate cleanly.** If `PriceBlock` (local component) and any imports (`Badge`, `Maximize2`, etc.) become
   unused ONLY because the horizontal branch is gone, remove them — but ONLY if they are truly unused after the change
   (the vertical branch still uses many of them; verify each with the compiler / a grep, do not guess). No unrelated cleanup.
3. **Authorized convergence deltas (owner-approved — do NOT stop-and-ask on these; they are the single-source goal).**
   The legacy horizontal chrome converges to the already-approved pattern where they differed:
   - hover elevation: legacy `hover:shadow-md` / premium `hover:shadow-listing-card-elevation-md` → pattern's
     `.card:hover` TailAdmin shadow-lg / `.premium:hover` elevation-lg;
   - archived: legacy `hover:opacity-70` → pattern has no archived hover-opacity change (resting `grayscale opacity-60` kept);
   - radius: legacy `rounded-xl` → pattern `radius="md"`;
   - feature-icon size: converge to the vertical mapping's `h-3.5 w-3.5`.
   Document each in the session log as an intentional single-source convergence, with before/after rendered evidence.
   Any OTHER visual change is out of scope — flag it, do not ship it.
4. Public API of `ListingCard` is unchanged (`variant?: 'vertical' | 'horizontal'` stays; all props stay). Callers untouched.

## Positive flow (happy path)

Actor: a visitor on `/{locale}/listings` who toggles the List view (or any surface passing `variant="horizontal"`).
1. The list renders one `<Link>` row per listing; each shows thumb image, badges, type label, inline favorite, title,
   price(+old/per-sqm), features, location, copy-id + date — visually identical to the approved Storybook `layout="list"`.
2. Hovering a row: card elevates (TailAdmin shadow-lg) and the **title turns brand-red** (parity with grid — the just-shipped fix).
3. Clicking the row navigates to the listing; `data-track`/`onBeforeNavigate` fire. Clicking the favorite toggles it
   WITHOUT navigating. Clicking copy-id copies the id WITHOUT navigating and flips to the `Check` icon for 1.5s.
4. Currency conversion, `price_old` strike-through, per-sqm, and `originalPriceStr` render exactly as the vertical branch does.

## Negative flow (every off-happy-path branch)

- **No cover image** → `Maximize2` fallback renders in the thumb frame (no broken `<img>`), row still clickable.
- **Closed listing (sold/rented)** → status badge shows; `FavoriteButton` is `disabled` with `closedLabel`; NO rotated
  overlay in the list row (list design never had it). Link still navigates to the detail page.
- **Archived/expired** → `grayscale opacity-60` on the row; badge shows; no hover-opacity flip.
- **Favorite toggle while unauthenticated / server error** → whatever `FavoriteButton` already does is preserved
  (this task does not touch `FavoriteButton`); verify the inline placement doesn't change its behavior.
- **Copy-id double-click / rapid click** → `idCopied` state + 1.5s reset still debounces the icon swap; no navigation.
- **`prefers-reduced-motion`** → pattern's reduced-motion rules already disable transform/zoom; confirm on the real row.
- **RTL/long titles (uk/it) at 320** → title `line-clamp-2`, no clip, no horizontal scroll (see mobile gate).
- **No location** → renders the empty `<span />` placeholder (footer still right-aligned), no layout break.

## Mobile <640 full-width gate (OWNER P0 — agent-contract clause 11) — MANDATORY

- The list **row is a full-width container** at `max-sm` (edge-to-edge within the list column; NOT a centered
  fixed-width card). The image column stays `w-32 sm:w-44 shrink-0`; the info column is `flex-1 min-w-0` so text
  wraps and truncates rather than overflowing.
- **≥44px touch targets** for the favorite and copy-id controls; long sq/en/uk/it labels wrap (`line-clamp`/`truncate`
  as in the pattern), never clip.
- **No horizontal scroll at 320** on the real `/listings` list view. Exempt/icon-only controls: the favorite heart and
  copy-id are icon+compact controls (documented exemption — they are not full-width text buttons).
- Prove with the rendered matrix below — a class-correct diff is NOT proof.

## TailAdmin conformance (OWNER P0 — clause 16)

No new tokens or extraction — the `layout="list"` chrome (border, `radius="md"`, resting no-shadow, TailAdmin
`shadow-theme-lg` on hover) is already the approved pattern. Verify the migrated **real** row renders side-by-side
identical to the Storybook `Patterns/Mantine/ListingCardPattern` List section (border color, radius, hover shadow,
Outfit font, density) at the canonical breakpoints × sq/en/uk/it.

## Presentational-primitive split (OWNER P0)

`ListingCard` stays the thin container (uses `useTranslations`/`useLocale`, builds behavior nodes); ALL card chrome
lives in `MantineListingCardPattern`. The test targets the container with fixture data — **no hook mock** (the pattern
is already prop-driven; the container's hooks are `next-intl`, which the existing smoke test renders through a real provider).

## Regression coverage (clause 15) — MANDATORY

- Scan `docs/critical-flow-registry.md` for the listing-card-display row. Baseline the existing
  `ListingCard.smoke.test.tsx` green BEFORE the change.
- Add/extend a test asserting the **`variant="horizontal"`** path now renders through `MantineListingCardPattern`
  and still surfaces: title, price, favorite control, copy-id button, features, badges — with a **planted-violation**
  proof (e.g. temporarily break the horizontal render → test FAILs → revert). No-op test = task failure.

## Acceptance criteria (each verifiable in the diff / transcript)

1. The `variant === 'horizontal'` block renders `<MantineListingCardPattern layout="list" …/>` inside the existing
   `<Link>`; all legacy row markup removed; `overlay`/`photoCount`/`onContact` not passed. (file:line)
2. Node mapping matches the preserved behavior: thumb `AppImage` (+fallback), inline `FavoriteButton`, footer copy-id+date,
   pre-translated badges, feature icon nodes, converted price/old/per-sqm/original. (file:line each)
3. Any now-unused local (`PriceBlock`) / imports removed ONLY if truly unused post-change (compiler-verified); vertical
   branch untouched and still green. (diff + tsc)
4. Public API + all callers unchanged. (grep of `ListingCard` consumers)
5. Authorized convergence deltas documented with before/after rendered evidence; no other visual change. (session log)
6. **Rendered verification matrix** — real `/listings` List view at 320·375·390·768·1280·1440·2560 × sq·en·uk·it
   (uk@320/375/390 mandatory): full-width row, no clip, no h-scroll@320, title brand-red on hover, favorite+copy-id
   don't navigate. Persisted under `docs/sessions/2026-07-15-task608-assets/` with a manifest. (clause 12)
7. Regression test added/extended for the horizontal path + planted-violation transcript. (clause 15)
8. Gates: `npx tsc --noEmit`=0, `npm run lint`=0 new, `npm run check:i18n` parity unchanged (no new keys expected —
   confirm), `check:file-integrity` clean on every touched file, `check:mojibake` clean, `npm run build` if non-trivial.
   NO `git add`/`git commit` (orchestrator emits at review).
9. Session log: AC-by-AC self-audit, UX-flow trace, before/after control inventory (nothing dropped — favorite, copy-id,
   date, badges, features all still present), convergence-delta table, rendered matrix, "Files Changed" table.
   `docs/backlog.md` updated.

## Scope (files)

**In scope:** `src/modules/listings/components/ListingCard.tsx` (horizontal branch → pattern mapper; remove now-dead
local `PriceBlock`/imports iff unused), `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx`
(horizontal-path regression), `docs/critical-flow-registry.md` (row/coverage note if applicable), the persisted assets
dir, `docs/backlog.md`, session log.

**Out of scope (do NOT touch):** `MantineListingCardPattern.tsx` / `.module.css` / its story (the pattern is approved —
no new features, no edits to force parity), `FavoriteButton`, `AppImage`, `getCardFeatures`/presentation engine, the
vertical branch, any other consumer, currency/formatter logic.

## Hard contract

No scope change; no invented architecture. Mirror the vertical branch's mapping exactly; converge ONLY the four listed
deltas (item 3); everything else preserves current horizontal behavior. **STOP and ASK** on: any behavior that can't be
reproduced through the pattern's existing props, any needed pattern change (means the port isn't a pure consume — flag it),
or any ambiguity in the node contracts. Both the positive AND every negative branch above must be exercised in the
transcript. Rendered matrix (clause 12) + regression test with planted-violation (clause 15) are mandatory. Self-validate
before "complete"; AC-by-AC table + control inventory + convergence-delta table + "Files Changed" table required; executor
emits NO git. A diff that drops any existing list-row control (favorite, copy-id, date, badge, feature), leaves the row
non-full-width at <640, or edits the pattern to force parity is a TASK FAILURE.
