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
root stacking context. This matches the existing pattern for overlays that must escape ancestor contexts (see
`Combobox.tsx:207` portal escape-hatch).

> ### 🔴 STOP-AND-ASK RESOLVED (2026-07-16) — the portal alone is NOT enough; the `z-toast` class is DEAD
> Sonnet correctly stopped: after portaling, `getComputedStyle` on the lightbox root returned `z-index: auto`, so
> the header (which paints with a **working core `z-30`/`z-50` class**) still covers the scrim. **Orchestrator
> independently confirmed the diagnosis by source read:** the whole `--z-*` scale (`globals.css:245-251`) is declared
> inside `@theme inline` under the **`--z-*` namespace, which Tailwind v4 does NOT turn into `z-*` utilities**
> (utilities need a recognized namespace / an `@utility`; there is no `--z-index-*` block and no manual `.z-toast{}`
> rule anywhere in `src/**/*.css`). So `class="z-toast"` matches no rule → `z-index: auto`. The scale is dead CSS.
>
> **BUT the blast radius is small, not sitewide** (Sonnet's "affects every Dialog/Sheet/Popover" was an
> overstatement): the app has migrated overlays to **Mantine** (its own `z-index` tiers) and the few remaining raw
> overlays use **working core `z-30/z-40/z-50`** or the allowlisted **`z-[9999]` escape-hatch**. A `--z-*`-token grep
> across `src/**/*.tsx` finds exactly ONE live consumer: this lightbox's `z-toast`. (`Combobox.tsx:207` already uses
> `z-[9999] // design-tokens-allow`, NOT the token.)
>
> **DECISION (owner steer 2026-07-16: "we're moving off Tailwind onto Mantine"):**
> 1. **Task 612 stays NARROW.** Do NOT touch `globals.css`. Do NOT revive the dead Tailwind token scale (that is the
>    wrong direction — the project is deprecating it).
> 2. **Make the lightbox z-index actually work** by mirroring the repo's own sanctioned escape-hatch: on the lightbox
>    root `<div>` (`ListingGallery.tsx:156`), replace the dead `z-toast` with **`z-[9999]`** carrying a
>    `// design-tokens-allow:` justification comment identical in spirit to `Combobox.tsx:207` (e.g.
>    `design-tokens-allow: z-[9999] — portaled lightbox must sit above the site header (z-30) + sticky contact panel;
>    canonical overlay escape-hatch, matches Combobox §22.3; the --z-* token scale is dead (Task 613)`).
> 3. The dead-token scale itself → **follow-up Task 613** (remove/deprecate `--z-*` + reconcile `ui-rules.md §16`,
>    Mantine direction). Not this task.
> 4. A Mantine-native lightbox (convert to Mantine `Modal`/`Overlay`, inheriting Mantine's z-index) is the eventual
>    strategic end-state but is OUT of scope here — it risks the byte-identical-chrome requirement. STOP-AND-ASK
>    before going there.

## Current behavior to preserve (do NOT regress)
- Lightbox opens on thumbnail / "All photos" click (`setLightboxIndex`), closes on X / Esc / backdrop.
- Prev/Next (buttons + ArrowLeft/ArrowRight keys), counter, thumbnail strip, image (`AppImage variant="lightbox"`).
- Body scroll lock (`document.body.style.overflow='hidden'` on open, restored on close, `ListingGallery.tsx:60`).
- `role="dialog"`, `aria-modal="true"`, `aria-label`. Full-screen `fixed inset-0` (already full-bleed at <640 — P0
  mobile gate satisfied; the portal must keep it edge-to-edge). Lightbox chrome/visual byte-identical.

## Required after-behavior (the delta)
1. The lightbox subtree (the `fixed inset-0` block at `:155-200+`) is rendered via
   `createPortal(<lightbox/>, document.body)` so it escapes the listing-detail stacking context. **[DONE]**
1b. **On the lightbox root `<div>` (`:156`), replace the dead `z-toast` class with `z-[9999]` + a
   `// design-tokens-allow:` comment** (see the STOP-AND-ASK resolution above). `z-toast` compiles to `z-index: auto`
   (dead Tailwind token), so the portal alone leaves the header painting over the scrim. Do NOT touch `globals.css`;
   do NOT revive the `--z-*` token scale (→ Task 613).
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
1. Lightbox portaled to `document.body` **and** its root `<div>` uses a WORKING z-index — `z-[9999]` with a
   `design-tokens-allow` comment (dead `z-toast` removed); `globals.css`/`--z-*` untouched. (file:line)
2. **Rendered proof on the REAL page** (live `next dev`, `/[locale]/listings/[slug]`) that with the lightbox OPEN the
   scrim fully covers the header AND the sticky contact card — before/after screenshots at desktop + uk@320/375/390 ×
   sq/en/uk/it. This is the core of the bug; a code-only claim is NOT acceptable (clause 12 + §18.9). (persisted PNGs)
3. All existing lightbox behavior preserved: open/close (X/Esc/backdrop), Prev/Next (buttons + arrow keys), counter,
   thumbnail strip, body scroll-lock + restore, `role/aria`. Before/after control inventory. (evidence)
4. No hydration warning / console error on the listing-detail route, all 4 locales (`check:hydration` or a live
   console capture). (evidence)
5. `npx tsc --noEmit` = 0, `eslint` clean, `check:file-integrity` + `check:mojibake` clean. The `z-[9999]` node
   carries a `// design-tokens-allow:` marker so the z-index/design-token gate stays green (same mechanism as
   `Combobox.tsx:207`). (transcript)
6. Regression coverage (clause 15): add/extend a test or a persisted live-page assertion that the lightbox, when
   open, is a `document.body` child and its computed stacking sits above the header — with a planted-violation
   (remove the portal → header shows through / node is not a body child) that genuinely FAILs, then revert. If the
   listing-detail lightbox lacks a `critical-flow-registry.md` row, add one.
7. Session log + `docs/backlog.md` (mark 612 done, tidy, numbering tracker) + "Files Changed" table. NO git.

## Scope (files)
**In scope:** `src/modules/listings/components/ListingGallery.tsx` (portal the lightbox), a regression test +
`docs/critical-flow-registry.md` row if added, the persisted rendered assets, `docs/backlog.md`, session log.
Possibly a small ad-hoc QA script for the live-page proof (same convention as Tasks 605/606/608).
**Out of scope:** the dead `--z-*` z-index token scale in `globals.css` (do NOT touch here — its removal/reconcile
is **Task 613**), the header, the contact card, the
`MantineListingDetailPattern` (Task 609), `GalleryIsland`/`GalleryStaticFrame` unless the portal genuinely requires
a touch (STOP and ASK if so).

## Hard contract
Two-part fix: **portal (done) + a WORKING z-index** (`z-[9999]` allowlisted, replacing the dead `z-toast`). Do NOT
restyle the lightbox chrome, do NOT touch `globals.css`/`--z-*`, do NOT convert to a Mantine Modal (→ separate task).
Preserve every existing lightbox control and the scroll-lock. Rendered before/after proof on the REAL page is
mandatory (AC2) — this bug is only provable in pixels. Mandatory planted-violation (AC6). Mobile <640: lightbox stays
full-bleed `fixed inset-0`. Executor emits NO git; STOP and ASK on any hydration/SSR or sticky-panel surprise.
