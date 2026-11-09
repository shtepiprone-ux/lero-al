# Task 612 (RE-SCOPED 2026-07-16) — Migrate the `ListingGallery` lightbox to Mantine (full-screen `Modal`) — root-cause z-index fix + presentational split + story

Sprint 44. Orchestrator-opened 2026-07-16 from an **owner bug report** (with a rendered screenshot): on the live
listing-detail page `/[locale]/listings/[slug]`, opening a photo leaves the **site header AND the sticky agent
contact card painted ON TOP of the lightbox** — the dark scrim + photo appear *behind* the chrome.

> ## 🔴 RE-SCOPE DECISION (owner, 2026-07-16) — fix at the ROOT via Mantine, not a `z-[9999]` hack
> The first-pass narrow fix (portal + swap the dead `z-toast` for an allowlisted `z-[9999]`) would work but ships a
> throwaway Tailwind hack on a component we're migrating anyway. **Owner chose to migrate the lightbox to Mantine
> now** (`AskUserQuestion`, 2026-07-16) so Mantine's own z-index tiers fix the stacking at the root.
>
> **Two roots, both closed by this task:**
> 1. **Not portaled** → the overlay is trapped in the listing-detail stacking context. Mantine `Modal` portals to
>    `document.body` for free.
> 2. **`z-toast` is DEAD CSS** — the `--z-*` scale (`globals.css:245-251`) sits under the `--z-*` namespace Tailwind
>    v4 never compiles into `z-*` utilities (no `--z-index-*` block, no `@utility`/`.z-toast{}` fallback), so it
>    computes `z-index: auto`. Mantine `Modal` applies a **working** managed z-index (`--mantine-z-index-modal` = 200
>    > header's core `z-30`/`z-50`), so the scrim genuinely covers the header + sticky card. No `z-[9999]`, no
>    `globals.css` touch. (The dead-token scale cleanup is separate → **Task 613**.)

## 🔴 Mechanism (concrete — do NOT reach for the wrong primitive)
- **Use Mantine raw `Modal` from `@mantine/core` with `fullScreen`**, styled to a full-bleed dark scrim — NOT the
  `MantineModal` pattern (`src/design-system/mantine/patterns/MantineModal.tsx`). That pattern imposes a **centered
  padded card ≥640 and a bottom-sheet <640** (`ResponsiveBottomSheet`), which is WRONG for a full-screen media
  lightbox (the lightbox is full-bleed `inset-0` at **every** breakpoint, never a bottom sheet).
- Required `Modal` props/overrides: `fullScreen`, `padding={0}`, `withCloseButton={false}`, `radius={0}`,
  `transitionProps` matching the current fade (or Mantine default), `styles`/`classNames` so the modal **content/body
  is the `bg-overlay/95` scrim filling 100% height** (the current look), `zIndex` left to the Mantine modal default
  (do NOT hardcode). `keepMounted={false}`.
- **Mantine gives for free — DELETE the hand-rolled equivalents:** portal-to-body (`createPortal` + the `mounted`
  guard), body scroll-lock (`document.body.style.overflow` effect), **Esc-to-close** (Mantine `Modal` closes on Esc),
  backdrop-click close, focus-trap + **return-focus to the opener**. Remove `import { createPortal } from 'react-dom'`.
- **KEEP the hand-rolled Arrow Left / Arrow Right key handlers** (prev/next) — Mantine does not provide these. They
  must fire only while the lightbox is open, same as today.
- **If (and only if) a thin reusable wrapper is warranted** (e.g. `FullScreenLightbox` under
  `src/design-system/mantine/patterns/`) rather than inlining the styled `Modal` in `LightboxView` — **STOP and ASK
  the orchestrator first.** Default assumption: inline the styled `Modal` inside the new `LightboxView` primitive; do
  not create a new pattern file without sign-off.

## 🔴 Presentational-primitive split (OWNER P0 gate — mandatory here)
`ListingGallery` is a **smart** component (`useTranslations`, `useState`, `useEffect`, `useCallback`) with **no story
and no split today** — a standing gap this task closes.
- **Extract `LightboxView`** — a pure, prop-driven presentational primitive (new file
  `src/modules/listings/components/LightboxView.tsx`). Props (data via props only, ZERO hooks/data/network):
  `images: {url:string}[]`, `activeIndex: number`, `title: string`, `labels: { close:string; prev:string; next:string;
  counter?(i,n):string }`, `onClose()`, `onPrev()`, `onNext()`, `onSelect(i:number)`. It renders the Mantine
  `fullScreen Modal` + all chrome. Arrow-key handling may live in the container OR the view — keep it prop-safe
  (open state controlled by the container).
- **Container `ListingGallery`** keeps `useTranslations` + `lightboxIndex` state + prev/next/open/close handlers and
  feeds `LightboxView` the resolved strings + handlers. Public API of `ListingGallery` (`{ images, title }`) unchanged.
- **Story targets `LightboxView`** with deterministic fixtures — **NO hook mock, NO `.storybook` alias, NO Supabase.**

## Inner controls → Mantine primitives
- Close / Prev / Next icon buttons: legacy `@/components/ui/button` (`Button variant="ghost" size="icon-xl"`) →
  **Mantine `ActionIcon`** (canonical — cite existing usage `HeaderView.tsx` / `NotificationBellView.tsx`), preserving
  the exact current look (dark translucent round button, same icon sizes `X`/`ChevronLeft`/`ChevronRight`, ≥44px).
- Thumbnail-strip buttons → Mantine `UnstyledButton` (they are image tiles, no chrome).
- Preserve `AppImage variant="lightbox"` for the main image and `variant="gallery-strip"` for thumbnails (unchanged).
- **Out of scope:** the outer gallery grid + the "All photos" / `Maximize2` open triggers — leave them exactly as-is
  (this task migrates the LIGHTBOX overlay only, not the whole gallery surface).

## Pre-read (rule-index: UI/layout task + Storybook task — load BOTH bundles)
- **Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — listing-detail
  hydration row #445 applies).
- **UI Required:** `docs/mantine-responsive-design-system.md` (**§7 mobile gate, §18 Mantine theming/z-index
  pitfalls**), `docs/ui-rules.md`, `docs/component-rules.md` (**"Container / Presentational Primitive Split"**),
  `docs/tailadmin-style-reference.md` (visual parity — the lightbox chrome must not change), `docs/qa-rules.md`.
- **Storybook Required:** `docs/mantine-responsive-design-system.md` §8 + §13 (Mantine story proof path),
  `docs/storybook-governance.md`.

## Current behavior to preserve (do NOT regress — full inventory)
- Opens on thumbnail / "All photos" / `Maximize2` click (`setLightboxIndex`).
- Closes on X, **Esc**, backdrop tap (now via Mantine). Focus returns to the opener.
- Prev / Next via **buttons AND ArrowLeft / ArrowRight keys**; wraps around (modulo `sorted.length`).
- Counter (`{index+1} / {n}`), thumbnail strip (active tile highlighted), main image (`AppImage variant="lightbox"`).
- Body scroll locked while open, restored on close (now via Mantine's scroll-lock).
- `role="dialog"`, `aria-modal="true"`, `aria-label` (Mantine `Modal` provides dialog semantics + label via `title`
  visually-hidden or `aria-label` — ensure the accessible name is preserved in all 4 locales).
- **Full-screen `inset-0` at ALL breakpoints** (full-bleed media viewer). Images sorted cover-first (`is_cover`, `order`).
- Single-image case: Prev/Next hidden. No-image case: lightbox not reachable.

## Required after-behavior (the delta)
1. Lightbox renders through a Mantine **`fullScreen Modal`** portaled to `document.body`; with it open the
   `bg-overlay/95` scrim + photo **fully cover the site header AND the sticky contact card** at every breakpoint ×
   locale — nothing from the page chrome shows through. (Root fix — Mantine's managed z-index.)
2. `LightboxView` presentational primitive extracted; `ListingGallery` is a thin container (public API unchanged).
3. Hand-rolled portal / `mounted` guard / scroll-lock effect / Esc handler / backdrop handler **removed** (now
   Mantine); Arrow-key prev/next **retained**. Inner icon buttons are Mantine `ActionIcon`; thumbs `UnstyledButton`.
4. `globals.css` / the `--z-*` scale **untouched** (→ Task 613). No `z-[9999]`, no hardcoded z-index anywhere.
5. Canonical `Mantine/Primitives/LightboxView` story (single `Default`, multi-image + single-image fixtures,
   toolbar-driven viewport/locale, `storybook.mantine.*` i18n parity sq/en/uk/it, no hook mock).

## Positive flow (happy path)
Visitor on `/[locale]/listings/[slug]` clicks a photo → `LightboxView` opens as a Mantine `fullScreen Modal` child of
`<body>` → the `bg-overlay/95` scrim covers the header, the agent contact card and all page content → photo centered,
counter + thumbnail strip visible → Prev/Next (`ActionIcon` buttons + Arrow keys) cycle with wrap-around → clicking a
thumbnail jumps to that image → **Esc / X / backdrop tap** closes → body scroll restored, **focus returns to the
trigger**. Verified on the real `next dev` server at desktop + uk@320/375/390.

## Negative flow (every branch)
- **Rapid open/close / re-entry:** no orphaned portal node; scroll-lock always restored (Mantine unmount cleanup);
  no double-open.
- **SSR / first paint:** no `document is not defined`, **no hydration mismatch / console error** on the listing-detail
  route in all 4 locales. Mantine `Modal` is controlled + closed on first paint (same SSR caveat as the other Mantine
  overlays; `getInitialValueInEffect`). STOP and ASK if a `useId`/hydration mismatch surfaces.
- **Esc while open:** closes (Mantine). Arrow keys **do nothing when closed** (guard on open state).
- **Backdrop click vs image/nav-button click:** closes on backdrop only; clicking the image or a nav button does NOT
  close.
- **Single image:** Prev/Next hidden; thumbnail strip may collapse; Modal still correct. **No images:** unreachable.
- **Another overlay open (e.g. a toast):** acceptable; toast is its own Mantine tier. No z-fighting with page chrome.
- **Locale switch:** all labels (close/prev/next/counter/aria) resolve in sq/en/uk/it; long uk labels don't clip.

## Mobile <640 gate (clause 11) — documented EXEMPTION
The lightbox is a **full-screen media viewer** (`fullScreen`, edge-to-edge `inset-0`) at ALL breakpoints — it is the
"fuller-than-full-width" case, **NOT a bottom sheet**. This is the intended pattern (owner-confirmed on the original
kickoff), recorded here as the explicit exemption from the "all popups = bottom sheet <640" rule. Controls are
**icon-only `ActionIcon`** (close/prev/next) — listed icon-only exemption; each ≥44px touch target. No text labels to
wrap. No horizontal scroll at 320 (the thumbnail strip already scrolls internally with `overflow-x-auto`).

## TailAdmin conformance (clause 16)
The lightbox is a bespoke **dark media overlay**, not a TailAdmin card/form surface — the visual target is **parity
with the current lightbox chrome** (same `bg-overlay/95` scrim, same translucent round controls, same counter/strip).
**Zero invented colors/px/radius** — reuse the existing `overlay`/`overlay-foreground` semantic tokens already in the
component. `ActionIcon` styling must reproduce the current button look (do not adopt a different TailAdmin button
chrome for these overlay controls). If any control's resting/hover state is ambiguous, match the current rendered
pixel, don't invent.

## Rendered verification matrix (clause 12 + Sprint 33 gate) — BOTH required
1. **Real-page before/after** on live `next dev` `/[locale]/listings/[slug]`: with the lightbox OPEN, the scrim fully
   covers the header AND the sticky contact card — before/after PNGs at **desktop + uk@320/375/390 × sq/en/uk/it**.
   This is the core bug proof; a code-only claim is NOT acceptable.
2. **Storybook Mantine matrix** for `LightboxView` — `responsive-screenshots --assert` PNG/JSON, breakpoints ×
   sq/en/uk/it, **uk@320/375/390 mandatory**, gates (`check:stories`, `check:i18n`, `--assert`) exit 0 + a
   planted-violation FAIL transcript.

## Acceptance criteria
1. Lightbox migrated to a Mantine `fullScreen Modal` (not `MantineModal`); portaled to `document.body`; managed
   z-index (no `z-[9999]`, no `globals.css` touch). (file:line)
2. Real-page proof (AC-matrix #1) that the scrim covers header + sticky card, before/after. (persisted PNGs)
3. `LightboxView` presentational primitive extracted; `ListingGallery` thin container, public API unchanged;
   **no data-hook in the primitive**. (file:line)
4. All prior lightbox behavior preserved: open/close (X/Esc/backdrop), Prev/Next (buttons + Arrow keys, wrap),
   thumbnail jump, counter, strip, scroll-lock+restore, focus-return, role/aria in 4 locales. Before/after control
   inventory. (evidence)
5. Hand-rolled portal/scroll-lock/Esc/backdrop removed; Arrow keys retained; inner buttons = Mantine
   `ActionIcon`/`UnstyledButton`. (diff)
6. Canonical `Mantine/Primitives/LightboxView` story (Default, fixtures, no hook mock) + Storybook rendered matrix
   (AC-matrix #2) + gates green + planted-violation FAIL transcript. (artifacts)
7. No hydration warning / console error on listing-detail, all 4 locales (`check:hydration` with
   `HYDRATION_LISTING_PATH` or a live console capture). (evidence)
8. Regression coverage (clause 15): update `src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx`
   (or add a `LightboxView` test) to assert the open lightbox is a `document.body`-rooted Mantine Modal whose computed
   stacking sits above the header, WITH a planted-violation (e.g. render without the Modal / non-portaled) that
   genuinely FAILs, then revert. Add/point a `critical-flow-registry.md` row for the listing-detail lightbox if none
   maps. (transcript)
9. `npx tsc --noEmit`=0, `eslint` clean, `check:file-integrity` + `check:mojibake` clean, `check:stories` green. (transcript)
10. Session log + `docs/backlog.md` (mark 612 done, tidy, numbering) + "Files Changed" table. **NO git.**

## Scope (files)
**In scope:** `src/modules/listings/components/ListingGallery.tsx` (→ thin container), **new**
`src/modules/listings/components/LightboxView.tsx`, **new** `src/stories/mantine/primitives/LightboxView.stories.tsx`,
`src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx` (update), new `storybook.mantine.*`
i18n keys × 4 locales (if the story needs them), `docs/critical-flow-registry.md` (row if added), persisted rendered
assets, `docs/backlog.md`, session log. A small ad-hoc live-page QA script is fine (Tasks 605/606/608 convention).
**Out of scope:** `globals.css` / the `--z-*` scale (→ **Task 613**), the header, the contact card, the outer gallery
grid + open triggers, `MantineListingDetailPattern` (Task 609). Creating a new `FullScreenLightbox` **pattern** file
→ **STOP and ASK** before doing so.

## Hard contract
Migrate the lightbox to a Mantine `fullScreen Modal` (root-cause z-index fix — Mantine's managed tier, NOT `z-[9999]`,
NOT a `globals.css` edit). Extract the `LightboxView` presentational primitive + canonical Mantine story (P0 split
gate). Preserve EVERY existing lightbox control + behavior with **visual parity** (no restyle); delete only the
hand-rolled portal/scroll-lock/Esc/backdrop that Mantine now owns; keep the Arrow-key nav. Full-screen at all
breakpoints (documented mobile exemption). Rendered before/after proof on the REAL page is mandatory (AC2) — this bug
is only provable in pixels. Mandatory planted-violation (AC8). Executor emits **NO git**. **STOP and ASK** on: adding
a new pattern file, any hydration/SSR surprise, or any ambiguity about the scrim styling vs the current pixel.
