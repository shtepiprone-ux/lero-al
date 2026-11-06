# Task 606 — Add a `layout: 'grid' | 'list'` variant to `MantineListingCardPattern` + a List section in its Storybook story (STORYBOOK ONLY — no site wiring)

**Sprint:** 44 (Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** UI — pattern extension + story, Storybook-only. **NO site wiring this task.**
**Owner directive (2026-07-15):** the List-view (horizontal) card must exist as part of the SAME single-source pattern
before we wire anything to the site. Build it in Storybook first; the site implementation of BOTH shapes (grid + list)
is a SEPARATE later task the owner will authorize after approving both in Storybook.
**Owner decision (2026-07-15, `AskUserQuestion`):** ONE pattern with a `layout: 'grid' | 'list'` variant (NOT a
separate component). The grid layout is the current Task-605 output; the list layout is the new horizontal shape.

**Pre-read:** `agent-contract.md`, `backlog.md`, `critical-flow-registry.md`,
`docs/mantine-responsive-design-system.md` (§7 mobile gate, **§8 Mantine story proof path — one `Default` export per
pattern group**, §18 CSS pitfalls), `docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` (clause 16),
`docs/storybook-governance.md` (§9/§14 canonical-primitives-in-stories), `docs/ui-rules.md`, `docs/component-rules.md`,
`docs/qa-rules.md`.

## Design source — port the EXISTING horizontal card, do NOT invent a new list design

The owner-accepted horizontal list-row design already exists as the legacy branch in
`src/modules/listings/components/ListingCard.tsx` — the `if (variant === 'horizontal')` block (image-left fixed width
`w-32 sm:w-44` self-stretch; info column: type-label + favorite on the top row, title (2-line clamp), price block,
features row, location + copy-id/date footer). **Reproduce THAT visual through the pattern's `layout='list'` branch**,
driven by the same data props + passed nodes the grid layout already uses. Do not redesign it; this is a structural port
into the single-source pattern, not a restyle. Cross-check against dom.ria's list rows only for mobile behavior parity.

## Scope

- `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` — add `layout?: 'grid' | 'list'` (default
  `'grid'`). 
  - **`layout='grid'` — BYTE-IDENTICAL to the current Task-605 output.** No regression to the live grid card. Verify by
    diff + the existing grid story cells rendering unchanged.
  - **`layout='list'`** — horizontal row: image-left (fixed width, self-stretch, `overflow:hidden`, hover-zoom target
    kept), info-right column reproducing the legacy horizontal content arrangement. Reuse the SAME props
    (`data`/`image`/`favorite`/`badges`/`overlay`/`photoCount`/`features`/`originalPriceStr`/`pricePerSqmStr`/
    `footerActions`/`isPremium`/`isArchived`) — no new data model. The favorite/image/footerActions stay passed-in nodes
    (the node's self-positioning contract differs per layout — document the expected className contract for list mode).
    Keep the pattern hook-free.
- `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` — keep the SINGLE `Default` export (governance §8). Add a
  clearly-labelled **List section** below the existing Grid section: a vertical `Stack` of horizontal rows
  (`layout='list'`) covering the same states already demoed in grid (regular / premium / reduced-price / sold / archived;
  a no-image row optional). Reuse the existing demo nodes/fixtures. If a genuinely separate sidebar story entry is
  wanted, that conflicts with the one-`Default`-per-group rule and the "one pattern" decision — **STOP and ASK** rather
  than splitting the group.

**MUST NOT touch (no site wiring this task):** `src/modules/listings/components/ListingCard.tsx` (its legacy horizontal
branch stays live and untouched), `LatestListings.tsx`, `ListingsShell.tsx`, `FeaturedListings.tsx`,
`RecentlyViewedGrid.tsx`, `SimilarListings.tsx`, or any other consumer. Grid layout default guarantees the live grid
card (already on the pattern via 605) is unaffected.

## Mobile <640 full-width gate (clause 11)

The list row must adapt at <640: full-width row edge-to-edge, image + info stack/scale sensibly (match the legacy
horizontal branch's current <640 behavior — do NOT regress it), ≥44px touch targets for any interactive control, labels
(type/title/location/features) wrap and never clip, no horizontal scroll at 320 in sq/en/uk/it. The favorite is the
documented icon-only exemption (Task 603, compact ~32px). If the correct <640 pattern for the list row is ambiguous
(e.g. does the image shrink or the row wrap?), STOP and ASK — do not guess.

## Positive / Negative flow (Storybook render)

- **Positive:** the `Default` story shows a Grid section (unchanged) AND a List section; each list row renders
  image-left, info-right, with favorite + photo-count on the image, type/title/price/features/location/footer in the
  info column; premium ring, reduced-price strike, sold overlay, archived dimming all render in list mode too.
- **Negative:** `layout='grid'` output unchanged (no regression); list mode with no image → fallback; reduced → old
  struck; sold → overlay + (disabled) favorite; archived → dimmed; hover (desktop pointer) elevates/zooms, suppressed
  under reduced-motion/coarse-pointer (same guards, both layouts).

## Gates

- **Rendered matrix (clause 12) — Storybook `Default` (both sections):** 320·375·390·768·1280·1440·2560 × sq/en/uk/it,
  **uk@320/375/390 mandatory**. Prove: grid section unchanged; list rows render correctly, full-width at <640, no clip/
  overflow/h-scroll, labels wrap. (Real-page proof is N/A this task — no site consumer yet; it applies to the later
  wiring task.)
- **Grid-unchanged proof:** explicit before/after (or byte-diff) showing `layout='grid'` renders identically to HEAD.
- **TailAdmin (clause 16):** list row chrome matches the ported legacy design + TailAdmin tokens; zero invented values.
- **Canonical primitives in stories (§9/§14):** demo nodes on `Button`/Mantine `Image`, no raw `<img>`/`<button>`; any
  new user-facing string via `storyT` with sq/en/uk/it parity.
- **Regression:** extend the pattern/story tests — assert `layout='list'` renders the horizontal structure (image-left
  marker + info column) and `layout='grid'` is unchanged; one verified planted-violation FAIL.
- **File-integrity (clause 14)** clean; `tsc=0`/lint/`check:stories`/`check:i18n`/`check:mojibake` green.
- **No `git add`/`git commit` by Sonnet.** Session log: Files-Changed table + AC self-audit + the rendered matrix.

## Acceptance criteria

1. `MantineListingCardPattern` gains `layout: 'grid' | 'list'` (default `'grid'`); grid output byte-identical to HEAD;
   list output reproduces the legacy horizontal design via the same props/nodes; pattern stays hook-free. *(diff + before/after)*
2. `ListingCardPattern` `Default` story (single export) shows both a Grid section and a List section across the state
   matrix, on canonical primitives, 4 locales. *(Storybook captures)*
3. No site consumer touched — legacy horizontal `ListingCard` branch and all grid consumers unchanged. *(diff + grep)*
4. Storybook rendered matrix (both sections, breakpoints × locales, uk@320/375/390) + list-row <640 full-width proof +
   grid-unchanged proof. *(evidence)*
5. Regression test for the list layout + verified planted-violation FAIL; grid-layout regression stays green. *(transcripts)*
6. Gates green; file-integrity clean; Files-Changed table + AC self-audit in the session log; NO git ops by Sonnet.
