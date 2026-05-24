# Task 208 — U.1: Preload w_640 vs rendered width mismatch

**Date:** 2026-05-24  
**Epic:** U — Performance & RSC Diagnostics  
**Status:** ✅ Complete

## Root Cause

The `sizes` string for `gallery-main` was `(max-width: 768px) 100vw, 50vw`. This was wrong on two counts:

**Problem 1 — md boundary off-by-one:**  
`md:col-span-2` (Tailwind) applies at `min-width: 768px`. At exactly 768px, the gallery-main is **half the gallery** (~356px). But CSS `max-width: 768px` is inclusive of 768px, so the old `sizes` condition matched and returned `100vw = 768px`. The browser selected the `960w` srcset entry for a 356px element — and critically, this differed from the HTTP Link preload which always returns `w_640`. **This is the mismatch warning.**

**Problem 2 — sidebar not accounted for:**  
At `lg+` (1024px+), the listing detail page uses `grid-cols-[1fr_320px] gap-8`. The left column (containing the gallery) is `1fr` = viewport − 64px padding − 320px sidebar − 32px gap. The gallery-main spans `col-span-2` of 4, so its width is roughly `34vw` at 1280px (not `50vw`).

## Per-Breakpoint Analysis

| Viewport | DPR | Actual gallery-main width | Old `sizes` → browser picks | New `sizes` → browser picks | HTTP Link preload |
|----------|-----|--------------------------|-----------------------------|-----------------------------|-------------------|
| 320px    | 1   | ~288px                   | 100vw=320px → **640w** ✓   | 100vw=320px → **640w** ✓   | 640w ✓ match |
| 375px    | 1   | ~343px                   | 100vw=375px → **640w** ✓   | 100vw=375px → **640w** ✓   | 640w ✓ match |
| 375px    | 2   | ~343px                   | 100vw=750px → **960w** ✓   | 100vw=750px → **960w** ✓   | 640w (single-URL limit — inherent) |
| 390px    | 1   | ~358px                   | 100vw=390px → **640w** ✓   | 100vw=390px → **640w** ✓   | 640w ✓ match |
| 768px    | 1   | ~356px                   | max-width:768 → 100vw=768px → **960w** ✗ | max-width:767 → 50vw=384px → **640w** ✓ | 640w ✓ match |
| 1024px   | 1   | ~304px                   | 50vw=512px → **640w** (ok) | max-width:1023 → 50vw=512px → **640w** ✓ | 640w ✓ match |
| 1280px   | 1   | ~436px                   | 50vw=640px → **640w** ✓   | 34vw=435px → **640w** ✓   | 640w ✓ match |
| 1440px   | 1   | ~516px                   | 50vw=720px → **960w** ✗ (over-fetches) | 34vw=490px → **640w** ✓   | 640w ✓ match |
| 2560px   | 1   | ~484px (container capped)| 50vw=1280px → **1600w** ✗ | 34vw=870px → **960w** (ok) | 640w (DPR=1 single-URL) |

**Note on 768px**: At 1440px with old sizes, `50vw=720px` → browser picked `960w` for a 516px element. With `34vw=490px`, it picks `640w` which is closer to the actual size. With the old `50vw` at 2560px (capped container), `50vw=1280px` caused `1600w` to be fetched for a ~484px element.

## Fix

Updated sizes from `(max-width: 768px) 100vw, 50vw` to:
```
(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 34vw
```

**Breakpoints explained:**
- `(max-width: 767px) 100vw` — below md: `col-span-4` = full gallery width
- `(max-width: 1023px) 50vw` — md to below lg: `col-span-2`, no sidebar ≈ 50% viewport
- `34vw` — lg+: `col-span-2` in `1fr`/`320px` grid: at 1280px `(1280-416)/2 = 432px ≈ 34vw`

**Why `buildGalleryLcpPreloadHref` still returns w_640:**  
At 1280px DPR=1 with new sizes: `34vw = 435px` → browser picks `640w` (smallest srcset entry ≥ 435px). HTTP Link preload still matches at the dominant desktop width.

## Files Changed

| File | Change |
|------|--------|
| `src/lib/imageDelivery.ts` | `GALLERY_MAIN_SIZES`: `(max-width: 768px) 100vw, 50vw` → `(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 34vw`; updated `buildGalleryLcpPreloadHref` comment |
| `src/components/ui/appImageConfig.ts` | `gallery-main.sizes`: same change |

## LCP Integrity

- `buildGalleryLcpPreloadHref` returns `w_640` — unchanged, still correct
- GalleryStaticFrame and AppImage both use the same corrected `sizes` → browser picks consistently
- No change to srcset entries, preload URL construction, or component rendering
- `tsc --noEmit` → 0 errors
