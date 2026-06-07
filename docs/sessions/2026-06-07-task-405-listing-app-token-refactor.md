# Task 405 — Token refactor: listings/** + app listings/admin routes

**Date:** 2026-06-07  
**Executor:** Sonnet 4.6  
**Epic:** JJ Phase 3, area 3 of 4  
**Status:** COMPLETE — pending orchestrator diff review

---

## BEFORE (baseline from `check:design-tokens`)

```
── LISTING  (26 findings) ──
── APP      (6 findings)  ──
Total: 102 raw style-value violation(s) | 0 stale-marker(s) | 0 missing-reason error(s)
```

## AFTER

```
── LISTING  — (not listed = 0 findings)
── APP      — (not listed = 0 findings)
Total: 70 raw style-value violation(s) | 0 stale-marker(s) | 0 missing-reason error(s)
```

**unsuppressed LISTING+APP = 0** (was 32). Total dropped 102 → 70.

---

## Group A — Inert swaps (5 items, computed-identical proof)

| File | Raw | After | Computed equality |
|---|---|---|---|
| `ActiveFilterChips.tsx:191` | `min-h-[44px]` | `min-h-11` | `--space-11 = 2.75rem = 44px` ✓ |
| `ListingsFilters.tsx:34` | `min-h-[44px]` | `min-h-11` | same ✓ |
| `ListingCard.tsx:183` | `min-h-[80px]` | `min-h-20` | `--space-20 = 5rem = 80px` ✓ |
| `ListingsSortBar.tsx:84` | `min-w-[140px]` | `min-w-35` | `calc(0.25rem * 35) = 8.75rem = 140px` ✓ |
| `ListingFormShell.tsx:404` | `max-h-[32rem]` | `max-h-128` | `calc(0.25rem * 128) = 32rem` ✓ |

All values resolve through Tailwind v4 dynamic spacing scale. `min-w-35` and `max-h-128` use the auto-computed formula `calc(var(--spacing) * N)` for N values not explicitly defined in `--spacing-N` overrides. No visual change.

---

## Group B — Z-index swap (1 item)

| File | Raw | After | Computed z-index |
|---|---|---|---|
| `ListingGallery.tsx:135` | `z-[100]` | `z-toast` | `--z-toast: 100` → computed `z-index: 100` ✓ |

Lightbox `fixed inset-0` overlay remains above all product overlays (header z-30, sheet/dialog backdrop z-40/z-50). The `z-toast` semantic token is explicitly documented in §22.3 as "ListingGallery lightbox (allowlisted)". No stacking regression.

---

## Group C — Exact-value inline suppression (1 item)

| File | Value | Reason |
|---|---|---|
| `ListingMobileCTA.tsx:70` | `shadow-[0_-2px_12px_rgba(0,0,0,0.10)]` | Bespoke upward sticky-CTA shadow; negative-y offset; no `--shadow-*` token matches upward direction. Also a detector blind spot (negative-offset shadows, to close in Task 408). |

Marker placed on same physical line as the `className` attribute. `check:design-tokens` confirms 0 stale-markers, 0 missing-reason errors post-edit.

---

## Group D — `text-[10px]` per-occurrence log (11 items)

All 11 occurrences are micro-labels (badges, count indicators, secondary price reference, order position indicator, copy-ID mono text). None are primary button labels or interactive control primary text. All swapped to `text-2xs`.

| File:line | Nature | Resolution | line-height delta | Rendered shift |
|---|---|---|---|---|
| `ImageUpload.tsx:110` | Cover photo badge label inside `<Badge>` (h-5 constraint) | swap → `text-2xs` | 10px → 12px lh (badge h-5 absorbs it) | none visible |
| `ImageUpload.tsx:167` | Order position number in circular overlay badge (h-5 w-5) | swap → `text-2xs` | 10px → 12px lh (h-5 fixed, centers) | none visible |
| `ListingCard.tsx:81` | Original price micro-text (secondary below main price) | swap → `text-2xs` | `leading-tight` class retains 12.5px lh override | no visible shift |
| `ListingCard.tsx:194` | Horizontal card badge (New/Reduced/Sold/Rented) | swap → `text-2xs` | nominal; badge is height-constrained | none visible |
| `ListingCard.tsx:255` | Copy-ID button mono text (horizontal card) | swap → `text-2xs` | `inline-flex items-center` absorbs delta | none visible |
| `ListingCard.tsx:315` | Vertical card badge (same as 194) | swap → `text-2xs` | same as 194 | none visible |
| `ListingCard.tsx:388` | Copy-ID button mono text (vertical card) | swap → `text-2xs` | same as 255 | none visible |
| `ListingsFilterBar.tsx:128` | Active filter count badge (absolute positioned h-4 w-4) | swap → `text-2xs` | h-4 fixed; lh irrelevant | none visible |
| `ListingsSortBar.tsx:71` | Active filter count badge (same pattern) | swap → `text-2xs` | same | none visible |
| `app/admin/page.tsx:217` | Pending reports counter badge (rounded-full) | swap → `text-2xs` | badge-sized; lh absorbed | none visible |
| `app/admin/page.tsx:261` | Location requests counter badge (same) | swap → `text-2xs` | same | none visible |

All 11 pass: computed `font-size = 10px` (same as `text-[10px]`), `line-height` delta is structural (from browser default ≈12px to token 12px — effectively identical or absorbed by explicit constraints). No mobile layout shift; all badge sizes are height-constrained.

---

## Group E1 — Gallery height tokens (narrowly-scoped semantic layout tokens)

**Tokens added to `src/app/globals.css` → `@theme inline` → §8:**
```css
--listing-gallery-h-mobile:  340px;
--listing-gallery-h-tablet:  420px;
--listing-gallery-h-desktop: 500px;
```

**Consumed at 4 call sites only (via `h-[var(--token)]` arbitrary syntax — NOT a raw px literal; detector does not flag):**

| File | Before | After |
|---|---|---|
| `GalleryStaticFrame.tsx:32` | `h-[340px] sm:h-[420px] md:h-[500px]` | `h-[var(--listing-gallery-h-mobile)] sm:h-[var(--listing-gallery-h-tablet)] md:h-[var(--listing-gallery-h-desktop)]` |
| `ListingGallery.tsx:81` | same | same |
| `loading.tsx:32` | same | same |
| `page.tsx:375` | comment reference `h-[340px]` | updated comment to `h-[var(--listing-gallery-h-mobile)]` |

**Computed height proof:** `var(--listing-gallery-h-mobile)` resolves to `340px`, `var(--listing-gallery-h-tablet)` → `420px`, `var(--listing-gallery-h-desktop)` → `500px`. Zero CLS is preserved — the `GalleryStaticFrame` and `ListingGallery` both resolve to the same heights. Breakpoint mapping unchanged.

**Detector check:** `h-[var(--listing-gallery-h-mobile)]` is NOT flagged by the detector (pattern `[\w-]+-\[[\d.]+(?:px|rem)\]` requires a literal digit before px/rem — `var(...)` does not match). ✓

---

## Group E2 — ListingCard brand ring/elevation tokens

**Tokens added to `src/app/globals.css` → `@theme inline` → §3 (after `--shadow-xl`):**
```css
--shadow-listing-card-ring:         0 0 0 1px oklch(0.700 0.162 65 / 0.2);
--shadow-listing-card-elevation-md: 0 4px 16px oklch(0.700 0.162 65 / 0.25);
--shadow-listing-card-elevation-lg: 0 8px 24px oklch(0.700 0.162 65 / 0.2);
```

In Tailwind v4, `--shadow-*` tokens in `@theme inline` generate named `shadow-*` utilities (same mechanism as `--z-toast` → `z-toast`). Named utilities are NOT flagged by the detector (no `[...]` brackets). ✓

**Consumed in ListingCard.tsx brand-highlight states only:**

| Location | Before | After |
|---|---|---|
| Horizontal card (premium, line 174) | `shadow-[0_0_0_1px_oklch(0.700_0.162_65_/_0.2)] hover:shadow-[0_4px_16px_oklch(0.700_0.162_65_/_0.25)]` | `shadow-listing-card-ring hover:shadow-listing-card-elevation-md` |
| Vertical card (premium, line 278) | `shadow-[0_0_0_1px_oklch(0.700_0.162_65_/_0.2)] hover:shadow-[0_8px_24px_oklch(0.700_0.162_65_/_0.2)]` | `shadow-listing-card-ring hover:shadow-listing-card-elevation-lg` |

**Computed box-shadow proof:**
- Base (ring): `box-shadow: 0 0 0 1px oklch(0.700 0.162 65 / 0.2)` — exact match ✓
- Horizontal hover: `box-shadow: 0 4px 16px oklch(0.700 0.162 65 / 0.25)` — exact match ✓ (ring replaced on hover, same as pre-refactor behavior)
- Vertical hover: `box-shadow: 0 8px 24px oklch(0.700 0.162 65 / 0.2)` — exact match ✓

No unused tokens: all 3 tokens are consumed (ring at 2 places, elevation-md at 1, elevation-lg at 1).

**StoryListingCard cross-scope note:** `StoryListingCard.tsx:86` still has `shadow-[0_0_0_1px_oklch(0.700_0.162_65_/_0.2)]` (the ring pattern). This file is OUT OF SCOPE for Task 405. Recorded here for Task 406 / stories task to consume `shadow-listing-card-ring`.

---

## Authorized carry-forward — Combobox §22.4→§22.3 comment fix

`src/components/shared/Combobox.tsx:204` — changed comment from `(§22.4)` to `(§22.3)`. The z-index escape-hatch is documented under §22.3 (Elevation → Z-index), not §22.4 (Motion). Comment-only change, no code behavior change. `check:design-tokens` continues to suppress `z-[9999]` correctly (0 stale, 0 missing-reason). ✓

---

## Detector blind spots logged for Task 408

1. **JSX comment content scanned** — `page.tsx:375` had `h-[340px]` inside a `{/* */}` JSX comment block, which the detector flagged as a live violation. Fixed by updating the comment to reference the token variable name. The detector's `shouldSkipLine()` only skips `//`, `*`, `/*` line-leading comment styles — it does NOT strip JSX `{/* */}` blocks before scanning. Task 408 should add JSX comment stripping.

2. **Negative-offset shadows** (carry-forward from Task 404) — `shadow-[0_-2px_12px_rgba(...)]` with negative Y offset is a pattern the detector catches via the `shadow-\[[^\]]+\]` regex, but the value is legitimately un-tokenizable (upward shadow, no matching token direction). The suppression mechanism handles it; the root detector logic is fine, but the taxonomy note is needed.

3. **Inline `zIndex: N` marker-parser limitation** (carry-forward from Task 404) — the `zIndex: 9999` inline style detection fires even on non-production contexts; parser blind spot noted for Task 408.

---

## Four-part token-resolution report

| Category | Count | Headline |
|---|---|---|
| Fixed inert swaps (Group A) | 5 | All computed-identical |
| Token swaps to design token (Group D text-2xs, Group B z-toast) | 12 | All resolved |
| New tokens added (Group E1+E2) | 6 | Gallery heights × 3, ListingCard shadows × 3 |
| Inline suppressions (Group C) | 1 | ListingMobileCTA upward shadow |
| Path-allowlist changes | 0 | None (task rule respected) |

**Headline: unsuppressed LISTING+APP violations = 0** (was 32). Note: "0 violations" does not imply no bespoke values exist — it means all are either swapped to named tokens or exact-suppressed with reason.

---

## Mobile <640 full-width gate verification

Token swaps are visually inert — they do not alter any layout, margin, or width property. Verified:
- `min-h-[44px]→min-h-11`: height only, no width/layout change
- `min-h-[80px]→min-h-20`: height only
- `min-w-[140px]→min-w-35`: min-width only on Combobox (not a full-width-required surface)
- `max-h-[32rem]→max-h-128`: max-height only on description textarea
- `z-[100]→z-toast`: z-index only, no layout
- `text-[10px]→text-2xs`: font-size only (same computed value); no width/layout
- `h-[var(--listing-gallery-h-mobile)]` etc.: identical computed height at each breakpoint
- `shadow-listing-card-ring` etc.: box-shadow only, no layout

ListingMobileCTA suppression (`shadow-[0_-2px_12px_rgba(...)]`) preserves the full-width `fixed left-0 right-0` positioning unchanged. ✓

---

## Validation summary

| Gate | Result |
|---|---|
| `check:design-tokens` BEFORE | LISTING=26, APP=6 |
| `check:design-tokens` AFTER | LISTING=0, APP=0, 0 stale, 0 missing-reason |
| `npx tsc --noEmit` | 0 errors ✓ |
| `npm run lint` | 0 new errors ✓ (1 pre-existing warning in AdminTable.stories.tsx — unrelated) |
| `check:file-integrity` | 17/17 clean ✓ |

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `src/app/globals.css` | Added `--listing-gallery-h-mobile/tablet/desktop` (§8) + `--shadow-listing-card-ring/elevation-md/elevation-lg` (§3) | Group E1 + E2 tokens |
| `src/modules/listings/components/ActiveFilterChips.tsx` | `min-h-[44px]` → `min-h-11` | Group A inert swap |
| `src/modules/listings/components/ListingsFilters.tsx` | `min-h-[44px]` → `min-h-11` | Group A inert swap |
| `src/modules/listings/components/ListingFormShell.tsx` | `max-h-[32rem]` → `max-h-128` | Group A inert swap |
| `src/modules/listings/components/ListingsSortBar.tsx` | `min-w-[140px]` → `min-w-35`; `text-[10px]` → `text-2xs` | Group A + D |
| `src/modules/listings/components/ListingCard.tsx` | `min-h-[80px]` → `min-h-20`; 5× `text-[10px]` → `text-2xs`; brand shadow → named tokens | Group A + D + E2 |
| `src/modules/listings/components/ListingGallery.tsx` | Gallery height → token vars; `z-[100]` → `z-toast` | Group E1 + B |
| `src/modules/listings/components/GalleryStaticFrame.tsx` | Gallery height → token vars | Group E1 |
| `src/modules/listings/components/ListingMobileCTA.tsx` | Add inline suppression on upward shadow | Group C |
| `src/modules/listings/components/ListingsFilterBar.tsx` | `text-[10px]` → `text-2xs` | Group D |
| `src/modules/listings/components/ImageUpload.tsx` | 2× `text-[10px]` → `text-2xs` | Group D |
| `src/app/[locale]/listings/[slug]/loading.tsx` | Gallery height → token vars | Group E1 |
| `src/app/[locale]/listings/[slug]/page.tsx` | Update JSX comment to reference token name | Group E1 (comment; removes detector false-positive) |
| `src/app/admin/page.tsx` | 2× `text-[10px]` → `text-2xs` | Group D |
| `src/components/shared/Combobox.tsx` | Comment §22.4 → §22.3 | Authorized carry-forward |
| `docs/design-system.md` | Added §22.3 ListingCard shadow tokens + §22.5 listing gallery height tokens | Token registry documentation |
| `docs/backlog.md` | Updated last session + task numbering | Governance |
