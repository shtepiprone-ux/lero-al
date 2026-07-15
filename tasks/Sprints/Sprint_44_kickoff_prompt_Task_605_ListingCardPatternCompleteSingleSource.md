# Task 605 — Rebuild `MantineListingCardPattern` as the COMPLETE listing card (single source of truth); Storybook story renders exactly what ships

**Sprint:** 44 (Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** UI — pattern rework + container thinning + story rebuild (presentational-split, single-source). **Owner P0.**
**Supersedes:** Task 604 (real-page hover verify) — its hover verification is absorbed here. **Keeps:** Task 603
(FavoriteButton compact-heart fix) intact — that primitive is unchanged, just passed into the pattern's favorite slot.

## Why (owner-directed, 2026-07-15)

Task 602 built `MantineListingCardPattern` as a thin **shell**: the real card's content (photo, badges, sold/rented
overlay, **photo counter**, real favorite, features, footer) is NOT in the pattern — `ListingCard.tsx` injects it via
`imageSlot`/`featuresSlot`/`footerSlot`. Consequences the owner caught:
- The `Patterns/Mantine/ListingCardPattern` **story does not render the favorite button or the photo counter** (it fills
  no slots), so it does NOT represent production. 602's "rendered proof" validated a demo that never ships.
- The story and the live card visibly diverge — there is no true single source for the card.

**Goal:** the pattern becomes the single source of truth for the WHOLE card. The story renders a pixel-complete
production-equivalent card (favorite + photo counter + footer included). `ListingCard` becomes a thin data-mapper.

**Pre-read:** `agent-contract.md`, `backlog.md`, `critical-flow-registry.md` (the Task-602 `ListingCard` row — this task
updates it), `docs/mantine-responsive-design-system.md` (§7 mobile gate, §8 Mantine story proof path, §18 CSS-cascade),
`docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` (clause 16, §5 shadow tokens), `docs/ui-rules.md`,
`docs/component-rules.md` (**"Container / Presentational Primitive Split"** — central), `docs/qa-rules.md`.

## Design contract — what the pattern OWNS vs what is passed IN

The pattern stays **hook-free and app-agnostic** (presentational-split gate). It OWNS layout + all pure-visual chrome,
driven by props/data. Behavior-bearing atoms are passed in as **positioned nodes/slots**, and the STORY supplies demo
versions of them so the story is production-complete.

**Pattern OWNS (data/prop-driven — must render in the story from fixtures):**
- Image frame (aspect ratio, `overflow:hidden`, the hover-zoom target) — the actual `<img>` element is passed in (see
  below) but the FRAME + everything overlaid on it is the pattern's.
- Badges: `badges: { label: string; color?: string }[]` → rendered top-left.
- Sold/Rented overlay: `overlayLabel?: string` + status color → the rotated centered overlay.
- **Photo counter:** `photoCount?: number` → camera icon + count, bottom-right. (Currently absent from the pattern — ADD it.)
- Type label, title, location (already present — keep).
- Features row: `features: { icon: React.ReactNode; value: string }[]` → the icon+value row (icons passed as nodes so the
  pattern needs no app-specific icon map).
- Price (+ struck old price) — already present, keep.
- Footer layout: the per-m²/original-price line + a `footerActions?: React.ReactNode` slot for the copy-id+date cluster
  (copy-id carries state → stays a passed node), positioned by the pattern.
- Premium ring/stripe, archived dimming, hover (elevation + photo zoom), reduced-motion + `(hover:hover)/(pointer:fine)`
  guards — keep from 602's CSS module.

**Passed IN as positioned nodes (pattern places them, does NOT implement them):**
- `image: React.ReactNode` — the `<img>`/`AppImage` element (app passes `AppImage`; story passes a plain `<img>` or
  Mantine `Image`). The pattern wraps it in the frame and targets it for the hover zoom (the existing `.imageSection img`
  tag selector already handles both).
- `favorite?: React.ReactNode` — the real `FavoriteButton` (app) / a demo heart button (story), positioned top-right by
  the pattern. **The story MUST pass a demo favorite so the heart shows.**
- `footerActions?: React.ReactNode` — copy-id + date cluster (app) / demo equivalent (story).

Keep the existing demo fallbacks ONLY if trivially compatible; otherwise it is acceptable to require `image` and render
the rest from data. Do not invent a second card component — extend THIS pattern.

## Container thinning — `ListingCard.tsx`

The vertical branch becomes a thin mapper: translate/convert/format real listing data → the pattern's data props, and
pass the real `AppImage` as `image`, the real `<FavoriteButton>` as `favorite`, and the copy-id+date cluster as
`footerActions`. No card structure/markup left in the container beyond building those nodes. The **horizontal branch
(List view) stays exactly as-is** (untouched — same lock as Task 602; grep-confirm the `variant==='horizontal'` block is
byte-identical). Public API of `ListingCard` unchanged. `LatestListings.tsx` unchanged (already vertical).

## Story rebuild — `ListingCardPattern.stories.tsx`

Single `Default` story, toolbar-driven, `skipCanvas:true`, `layout:'fullscreen'`, `storybook.mantine.*` i18n with full
sq/en/uk/it parity (no raw literals). It MUST render the full card: pass `image`, `badges`, `photoCount`, `features`, a
**demo `favorite` heart button**, price(+old for the reduced card), and a demo `footerActions`. Show the existing card
mix (regular / premium / plain / reduced-price) so the story visually equals production. New i18n keys as needed, ×4 locales.

## Mobile <640 full-width gate (clause 11)

Card is full-width in its 1-col grid at <640 (natural). The favorite is the documented icon-only exemption (compact
~32px, Task 603 — unchanged). Photo counter/badges are compact overlays (exempt). No text/container surface left
content-width. No horizontal scroll at 320 in any of sq/en/uk/it; labels (type/title/location/features) wrap, never clip.

## Positive / Negative flow

- **Positive:** homepage Latest + `/listings` Grid render the pattern with real data → photo, badges, photo counter,
  favorite (top-right), type, title, location, features, price(+old), footer; hover (desktop) lifts + zooms; click
  navigates via the enclosing `<Link>`; favorite click toggles without navigating.
- **Negative:** sold/rented → overlay + disabled favorite; archived → dimmed; no image → fallback; reduced-price → old
  struck + new; `photoCount` absent/0 → no counter; hover reverts under reduced-motion and is suppressed on coarse
  pointer; **horizontal List view still renders unchanged** (the exact regression to guard).

## Gates

- **Real-page rendered proof (clause 12) — homepage + grid, the ACTUAL Next.js page, NOT only Storybook.** Matrix
  320·375·390·768·1280·1440·2560 × sq/en/uk/it, **uk@320/375/390 mandatory**: card complete (favorite + photo counter
  present), no clip/overflow/h-scroll. PLUS a Storybook capture proving the story now renders the same complete card
  (favorite + photo counter visible). Side-by-side story-vs-real at 1 desktop width + uk@320.
- **Hover (absorbs Task 604):** computed-style before/after on `.card` + `.imageSection img` on the real page with a
  desktop pointer — elevation + `scale(1.05)` fire; `none` under `prefers-reduced-motion`; suppressed on coarse pointer.
  Class presence is NOT proof (the 602 lesson).
- **Presentational-split (owner P0):** pattern stays hook-free/app-agnostic; story + `ListingCard.smoke.test` render it
  with fixtures/real data — NO hook mock. The favorite/copy-id/image being passed as nodes is the mechanism.
- **Regression coverage (clause 15):** extend `ListingCard.smoke.test.tsx` — real `ListingCard` renders favorite +
  photo counter + features + footer via the pattern; reduced-price strike; sold overlay + disabled favorite; horizontal
  branch still renders. Planted-violation FAIL for at least the photo-counter and the horizontal-branch guard. Update the
  Task-602 `critical-flow-registry.md` row to cover the completed-pattern behavior.
- **TailAdmin (clause 16):** every value §-cited; hover shadow = §5 `shadow-theme-lg`/listing tokens; zero invented values.
- **File-integrity (clause 14)** clean; `tsc=0`/lint/`check:stories`/`check:i18n`/`check:mojibake` green.
- **No `git add`/`git commit` by Sonnet.** Session log: Files-Changed table + AC self-audit + the full rendered matrix +
  the story-vs-real side-by-side + hover transcript.

## Acceptance criteria

1. `MantineListingCardPattern` renders photo counter, badges, overlay, features, footer layout, price(+old), premium,
   archived, hover — all from data/props; favorite/image/copy-id passed as positioned nodes; pattern stays hook-free. *(diff)*
2. `ListingCard` vertical branch is a thin data-mapper passing real `AppImage`/`FavoriteButton`/copy-id into the pattern;
   horizontal branch byte-identical; public API unchanged. *(diff + grep)*
3. `ListingCardPattern` story renders the COMPLETE card incl. a demo favorite heart AND photo counter, 4 locales, single
   `Default`. *(Storybook capture)*
4. Real homepage/grid render matrix (favorite + photo counter present, no overflow) + story-vs-real side-by-side +
   real-page hover computed-style transcript. *(evidence, uk@320/375/390 mandatory)*
5. Regression tests extended (favorite/photo-counter/features/footer via pattern; reduced-price; sold overlay; horizontal
   still renders) with verified planted-violation FAILs; registry row updated. *(transcripts)*
6. Gates green; file-integrity clean; Files-Changed table + AC self-audit in the session log; NO git ops by Sonnet.
