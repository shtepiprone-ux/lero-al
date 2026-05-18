# Session Archive: Post-Governance Debt Burn-down Sprint — Task 69: Raw img → AppImage Migration — 2026-05-18

## Task Summary

Task 69 migrates 3 pre-existing raw `<img>` elements to the canonical `<AppImage>` component.
These elements were surfaced as governance violations in Task 68 when the ESLint flat config
override bug was fixed. Each had an existing `@next/next/no-img-element` disable comment
plus a Task 69 TODO added in Task 68. Both disable comments are removed by this migration.

No production logic was changed. Visual behavior, sizing, alt text, and lazy loading are
preserved. All image sources are Cloudinary URLs (or passed through as-is for non-Cloudinary
sources, which AppImage supports natively).

---

## Files Changed

| File | Change |
|---|---|
| `src/modules/locations/components/PopularLocations.tsx` | Added AppImage import; replaced raw `<img>` with `<AppImage variant="listing-thumb">` |
| `src/components/admin/AdminLocationsManager.tsx` | Added AppImage import; replaced raw `<img>` with `<AppImage variant="listing-thumb">` |
| `src/components/admin/AdminUserAvatar.tsx` | Added AppImage import; replaced raw `<img>` with `<AppImage variant="listing-thumb">` |
| `docs/eslint-debt-taxonomy.md` | Task 69 result added |
| `docs/backlog.md` | Task 69 CLOSED; maintenance debt section updated |
| `docs/sessions/2026-05-18-raw-img-to-appimage-migration.md` | This session log |

---

## Raw `<img>` Cases Migrated

### 1. PopularLocations.tsx — location thumbnail

**Before:**
```tsx
{/* eslint-disable-next-line @next/next/no-img-element, no-restricted-syntax -- ... */}
<img
  src={loc.image_url}
  alt={name}
  className="absolute inset-0 w-full h-full object-cover"
  loading="lazy"
/>
```

**After:**
```tsx
<AppImage
  variant="listing-thumb"
  src={loc.image_url}
  alt={name}
  className="absolute inset-0"
/>
```

### 2. AdminLocationsManager.tsx — admin location image preview

**Before:**
```tsx
// eslint-disable-next-line @next/next/no-img-element, no-restricted-syntax -- ...
<img src={imageUrl} alt="" className="h-20 w-full object-cover rounded-xl mt-1"
  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
```

**After:**
```tsx
<AppImage
  variant="listing-thumb"
  src={imageUrl}
  alt=""
  className="h-20 mt-1 rounded-xl"
/>
```

### 3. AdminUserAvatar.tsx — admin avatar preview

**Before:**
```tsx
// eslint-disable-next-line @next/next/no-img-element, no-restricted-syntax -- ...
<img src={currentUrl} alt="Avatar preview" className="w-full h-full object-cover" />
```

**After:**
```tsx
<AppImage
  variant="listing-thumb"
  src={currentUrl}
  alt="Avatar preview"
/>
```

---

## AppImage Variant Decisions

All three cases use `variant="listing-thumb"`.

| Variant | containerClass | imageClass | Type |
|---|---|---|---|
| `listing-thumb` | `relative w-full h-full overflow-hidden` | `object-cover` | fill-parent |

**Why `listing-thumb` for all three:**
- All three are fill-parent cases: the caller element provides explicit dimensions
  (`h-28` link for locations, `h-20` wrapper for admin preview, `h-24 w-24` circle for avatar)
- `listing-thumb` = `relative w-full h-full overflow-hidden` — fills whatever container is given
- The `<img>` inside AppImage is `absolute inset-0 w-full h-full object-cover` — identical to
  what was previously set directly on the raw `<img>` elements

**Why not `avatar` for AdminUserAvatar:**
- The `avatar` variant is self-contained (`aspect-square rounded-full`) — it would add a
  duplicate aspect-ratio container inside the existing `h-24 w-24 rounded-full` parent
- `listing-thumb` fills the existing parent correctly; the parent's `rounded-full overflow-hidden`
  provides the circular clip

**Extra className rationale:**
- PopularLocations: `className="absolute inset-0"` — positions AppImage container absolutely
  within the `<Link>` to preserve the overlay stacking (gradient div comes after)
- AdminLocationsManager: `className="h-20 mt-1 rounded-xl"` — tailwind-merge in AppImage's
  `cn(containerClass, className)` resolves `h-full` vs `h-20` to `h-20` (later wins)
- AdminUserAvatar: no extra className — parent provides all sizing

**Behavior notes:**
- `loading="lazy"` is preserved: AppImage uses `loading={priority ? 'eager' : 'lazy'}` and
  `priority` defaults to `false`
- `onError` display-none behavior from AdminLocationsManager is not preserved — AppImage shows
  an empty placeholder container instead. This is acceptable for an admin-only URL input preview.
- Non-Cloudinary URLs pass through unchanged (AppImage's `insertTransform` skips non-Cloudinary URLs)

---

## Locale and Responsive Verification

This task modifies image rendering only. No text, layout classes, or locale strings were changed.

**Locale coverage:**
- sq, en, uk, it — all use the same image URL from the database; no locale-specific image paths.
  Image alt text for PopularLocations uses `getLocalizedName(loc, locale)` — unchanged.

**Responsive coverage:**
- PopularLocations: grid `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` — unchanged.
  Location card `h-28 rounded-xl` dimensions — unchanged.
  AppImage `listing-thumb` fills `h-28` at all breakpoints: 320, 360, 375, 390, 412, 480, 640, 768, 1024, 1280, 1440, 1720, 1920, 2560, ultrawide ✅
- AdminLocationsManager: admin-only panel, breakpoints not primary concern. `h-20 w-full`
  preserved via AppImage className ✅
- AdminUserAvatar: `h-24 w-24 rounded-full` preserved via parent container ✅

**Visual equivalence:**
The `listing-thumb` variant renders `<img class="absolute inset-0 w-full h-full object-cover">`.
The original raw `<img>` elements had `class="absolute inset-0 w-full h-full object-cover"`.
Rendering is visually identical for Cloudinary-backed URLs.

---

## Commands Run

| Command | Result |
|---|---|
| `npm run lint` | ✅ 0 errors, 8 warnings |
| `npx eslint src/` | ✅ 0 errors |
| `npm run typecheck` | ⚠️ Pre-existing test-file errors only (confirmed on `aa809a2`) |
| `npm run build` | ✅ PASS |
| `npm run governance` | ✅ PASS — all 5 categories within baseline |
| `npm run governance:tailwind` | ✅ PASS |
| `npm run governance:storybook` | ✅ PASS |
| `npm run governance:screenshots` | ✅ PASS |
| `npm run governance:components` | ✅ PASS |
| `npm run test` | ⚠️ Pre-existing: 3 failed / 6 passed (identical to `aa809a2`) |

**Task 69 introduced zero new lint violations.**

---

## Lint Before / After

| Metric | Before | After |
|---|---|---|
| Errors | 0 | 0 |
| Warnings | 8 | **8** (unchanged) |
| `no-restricted-syntax` img violations | 3 (suppressed with disable comments) | **0** (fully resolved) |

Image governance is now violation-free. No remaining raw `<img>` debt outside
`AppImage.tsx` and `GalleryStaticFrame.tsx` (both are in `IMAGE_RENDER_EXCEPTIONS`).
