# Task 612 — `ListingGallery` lightbox renders BELOW the header + sticky contact card (portal / stacking-context fix)

Sprint 44. Orchestrator-opened 2026-07-16 from an **owner bug report** (with a rendered screenshot): on the live
listing-detail page `/[locale]/listings/[slug]`, opening a photo (the lightbox) leaves the **site header AND the
sticky agent contact card painted ON TOP of the lightbox overlay** — the dark full-screen scrim and photo appear
*behind* the chrome instead of covering it.

## Pre-read (rule-index: UI/layout task)
- **Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan).
- **Required:** `docs/mantine-responsive-design-system.md` (§7 mobile gate), `docs/ui-rules.md` (**§16 z-index scale
  — MANDATORY**), `docs/component-rules.md`, `docs/qa-rules.md`, `docs/tailadmin-style-reference.md` (visual parity —
  the lightbox chrome must not change).

## Root cause (confirmed by source read)
`src/modules/listings/components/ListingGallery.tsx:149-150` renders the lightbox INLINE in the component tree:
```tsx
{lightboxIndex !== null && (
  <div className="fixed inset-0 z-toast bg-overlay/95 flex items-center justify-center" role="dialog" aria-modal="true" ...>
```
The z-scale (`src/app/globals.css:245-251`) is:
`--z-sticky: 30` (site header, sticky chrome) · `--z-overlay: 40` · `--z-modal: 50` · `--z-toast: 100`
(*"highest: Sonner toasts, ListingGallery lightbox"* — the lightbox is INTENDED to sit above everything).

So by raw value `z-toast (100)` already beats the header (`z-sticky 30`) and the sticky contact panel — **but
`z-index` only compares WITHIN a stacking context.** The lightbox is **not portaled**; it lives deep inside the
listing-detail subtree, so its `z-100` is local to an ancestor stacking context. The site header (root-layout
level) and the `position:sticky` contact card (sticky + its own paint order create their own stacking contexts)
sit in a higher/sibling context and therefore paint over the trapped lightbox regardless of its `z-100`.

**Fix:** portal the lightbox to `document.body` via `createPortal` so it becomes a direct child of `<body>` at the
root stacking context, where `z-toast:100` genuinely sits above the header (`z-sticky:30`) and the sticky contact
panel. This matches the z-scale's stated intent and the existing pattern for overlays that must escape ancestor
contexts (see `Combobox.tsx:207` portal escape-hatch).

## Current behavior to preserve (do NOT regress)
- Lightbox opens on thumbnail / "All photos" click (`setLightboxIndex`), closes on X / Esc / backdrop.
- Prev/Next (buttons + ArrowLeft/ArrowRight keys), counter, thumbnail strip, image (`AppImage variant="lightbox"`).
- Body scroll lock (`document.body.style.overflow='hidden'` on open, restored on close, `ListingGallery.tsx:60`).
- `role="dialog"`, `aria-modal="true"`, `aria-label`. Full-screen `fixed inset-0` (already full-bleed at <640 — P0
  mobile gate satisfied; the portal must keep it edge-to-edge). Lightbox chrome/visual byte-identical.

## Required after-behavior (the delta)
1. The lightbox subtree (the `fixed inset-0 z-toast` block at `:149-200+`) is rendered via
   `createPortal(<lightbox/>, document.body)` so it escapes the listing-detail stacking context. Keep `z-toast`
   (do NOT bump to a new hardcoded z-value — the token is correct; the bug is the stacking context, not the value).
2. With the lightbox open, the **dark scrim + photo fully cover the site header AND the sticky contact card** at
   every breakpoint × locale — nothing from the page chrome shows through. Prev/Next/Esc/backdrop-close/scroll-lock/
   aria all still work identically.
3. SSR-safe: the portal target is `document.body`, only reachable client-side. The component is already
   `'use client'` and the lightbox only mounts on a client interaction (`lightboxIndex !== null`), so `document`
   exists — but guard defensively if needed (render nothing / no portal until mounted) rather than referencing
   `document` during SSR. STOP and ASK if a hydration concern surfaces.

## Positive flow
Visitor on `/[locale]/listings/[slug]` clicks a photo → lightbox opens as a `document.body` child → the full-screen
`bg-overlay/95` scrim covers the header, the agent contact card, and all page content → photo centered, counter +
thumbnail strip visible → Prev/Next (buttons + arrow keys) cycle → Esc / X / backdrop tap closes → body scroll
restored, focus returns to the trigger. Verified on the real `next dev` server at desktop + uk@320/375/390.

## Negative flow
- Rapid open/close → no orphaned portal node, scroll-lock always restored (mount/unmount cleanup intact).
- SSR / first paint → no `document is not defined`, no hydration mismatch (portal only after mount).
- Esc while open → closes (existing handler, `:54-57`) — still fires after portaling (document-level listener).
- Backdrop click vs image click → closing on backdrop only (preserve existing behavior; don't close on image/nav
  button click).
- No images / single image → Prev/Next hidden as today; portal still correct.
- Other overlays open simultaneously (e.g. a toast) → both are `z-toast` at root; acceptable (unchanged tier).

## Acceptance criteria
1. Lightbox portaled to `document.body`; `z-toast` retained (no new hardcoded z-value). (file:line)
2. **Rendered proof on the REAL page** (live `next dev`, `/[locale]/listings/[slug]`) that with the lightbox OPEN the
   scrim fully covers the header AND the sticky contact card — before/after screenshots at desktop + uk@320/375/390 ×
   sq/en/uk/it. This is the core of the bug; a code-only claim is NOT acceptable (clause 12 + §18.9). (persisted PNGs)
3. All existing lightbox behavior preserved: open/close (X/Esc/backdrop), Prev/Next (buttons + arrow keys), counter,
   thumbnail strip, body scroll-lock + restore, `role/aria`. Before/after control inventory. (evidence)
4. No hydration warning / console error on the listing-detail route, all 4 locales (`check:hydration` or a live
   console capture). (evidence)
5. `npx tsc --noEmit` = 0, `eslint` clean, `check:file-integrity` + `check:mojibake` clean. If a z-index/design-token
   gate flags `z-toast` on the portaled node, carry the existing allowlist marker. (transcript)
6. Regression coverage (clause 15): add/extend a test or a persisted live-page assertion that the lightbox, when
   open, is a `document.body` child and its computed stacking sits above the header — with a planted-violation
   (remove the portal → header shows through / node is not a body child) that genuinely FAILs, then revert. If the
   listing-detail lightbox lacks a `critical-flow-registry.md` row, add one.
7. Session log + `docs/backlog.md` (mark 612 done, tidy, numbering tracker) + "Files Changed" table. NO git.

## Scope (files)
**In scope:** `src/modules/listings/components/ListingGallery.tsx` (portal the lightbox), a regression test +
`docs/critical-flow-registry.md` row if added, the persisted rendered assets, `docs/backlog.md`, session log.
Possibly a small ad-hoc QA script for the live-page proof (same convention as Tasks 605/606/608).
**Out of scope:** the z-index scale itself (`globals.css` — correct as-is), the header, the contact card, the
`MantineListingDetailPattern` (Task 609), `GalleryIsland`/`GalleryStaticFrame` unless the portal genuinely requires
a touch (STOP and ASK if so).

## Hard contract
Do NOT bump z-values or restyle the lightbox — the token is right, the bug is the missing portal / stacking context.
Preserve every existing lightbox control and the scroll-lock. Rendered before/after proof on the REAL page is
mandatory (AC2) — this bug is only provable in pixels. Mandatory planted-violation (AC6). Mobile <640: lightbox stays
full-bleed `fixed inset-0`. Executor emits NO git; STOP and ASK on any hydration/SSR or sticky-panel surprise.
