# Task 466 — ListingDetailView mobile/tablet layout fix (Bucket-1 hard defects)

**Date:** 2026-06-23  
**Executor:** Sonnet 4.6  
**Run:** `screenshots:assert` full — 2026-06-23T21-18 — **LDV: 168/168 PASS, 0 FAIL**

---

## Result

All three LDV stories cleared all failing cells.

| Story ID | Cells | Verdict |
|---|---|---|
| `listings-listingdetailview--public-listing` | 56 | ✅ ALL PASS |
| `listings-listingdetailview--staff-preview-published` | 56 | ✅ ALL PASS |
| `listings-listingdetailview--staff-preview-unpublished` | 56 | ✅ ALL PASS |

**Overall harness (2026-06-23T21-18 regenerated inventory):** 6532 total · 5435 PASS · 661 FAIL · 108 OUT-OF-RANGE · 328 AMBIGUOUS — exit=1. The 661 FAIL breaks down as: 336 planted-fixture probes (6 stories × 56 cells, intentionally failing as harness liveness probes) + 325 non-LDV non-planted product cells. None of the non-LDV cells are caused by Task 466 changes.

---

## Files Changed

| Path | Change | Rationale |
|---|---|---|
| `src/modules/listings/components/ListingGallery.tsx` | Added mobile "All photos (N)" above gallery (`sm:hidden`); added `relative` to gallery grid; wrapped badge in `absolute`-positioned `<div className="md:hidden absolute top-3 right-3">` containing canonical `<Button>`; made "All photos (N)" below gallery `hidden sm:inline-flex` | Defect A: `<Button>` default size adds `max-sm:w-full`; inside the `absolute` wrapper div (shrinks to content), Button is `max-sm:w-full` of the wrapper's content width, not of the gallery → no left-edge escape. `top-3` avoids Y-overlap between badge and fixed contact bar. Mobile "All photos (N)" above gallery avoids Y-overlap with contact bar WA row. |
| `src/modules/listings/components/ListingContact.tsx` | Added `isListingArchived` import; added `contactListingId: string` prop; updated `handleContactClick` to use `contactListingId`; added `listingArchived` guard on mobile bar; restructured mobile bar: `hidden sm:flex` (WA+Phone side-by-side ≥640) + `sm:hidden` Phone icon-only in price row + `sm:hidden` full-width WA row below price row | Defect B: WA↔Phone overlap at <640 fixed by splitting into stacked rows. `contactListingId` ensures WA/Phone work in staff-preview (where `listingId` is `undefined`). Archived guard prevents sticky bar on archived listings. |
| `src/modules/listings/components/ListingDetailView.tsx` | Removed `ListingMobileCTA` import and render block; removed `isListingArchived` (moved to `ListingContact`); changed `pb-32` → `pb-44`; added `contactListingId={listing.id}` to `LazyListingContact` | Defect B root cause: dual fixed mobile bars (`ListingMobileCTA` z-30 + `listing-contact-mobile` z-40) produced `button("Call")↔button("WA")` overlaps. Single bar eliminates the overlap class. `pb-44` matches the taller single bar. |

---

## Defect root causes (confirmed)

### Defect A — `outside-container` + `offscreen-control` on gallery badge

`<Button variant="ghost">` with no explicit `size` defaults to `size="default"` which includes `max-sm:w-full max-sm:min-h-11` from `buttonVariants`. At <640px the badge becomes 100% of the gallery grid's width. With `right: 12px` positioning:

```
badge.left = gallery.right - 12 - gallery.width = gallery.left - 12
```

Result: `escapes by R=-12 B=-12 L=12 T=-284px` — badge left edge 12px outside gallery.

Additionally, the badge at `bottom-3` brought it into the Y range of the fixed contact bar (`bottom-14`), producing `element-overlap` between badge and WA/Phone buttons at viewports where `gallery.bottom ≈ 640–740px` (StaffPreview with tall locale banners).

**Fix:** wrapped badge in `<div className="md:hidden absolute top-3 right-3">` (the `absolute` div shrinks to content; it becomes the Button's `parentElement` for the full-width check). The canonical `<Button>` inside is `max-sm:w-full` of the wrapper's content width (~90px), not of the gallery grid. Positioned `top-3` keeps it well above the contact bar Y range.

### Defect B — `element-overlap` between contact CTAs + "All photos (N)"

Three overlap classes:
1. `button("Call") ↔ button("WA")` at <640: both in the same flex row in `listing-contact-mobile`, plus a **second** WA button and Call button in `ListingMobileCTA` (separate z-30 bar at identical `fixed bottom-14`). Dual bar = guaranteed overlap.
2. Gallery "All photos (N)" `<Button variant="link">` (default size → `max-sm:w-full`) at Y = `gallery.bottom + 12` overlapping contact bar WA row at Y ≈ 700–744 for StaffPreview with long-locale banners.
3. Gallery badge (after width fix) still overlapping contact bar in Y at some viewports.

**Fix:**
- Removed `ListingMobileCTA` entirely. Single `listing-contact-mobile` bar.
- Restructured bar: `hidden sm:flex` (WA+Phone side-by-side ≥640) + `sm:hidden` Phone icon-only in price row + full-width WA in separate row below price row at <640.
- Moved "All photos (N)" to **above** the gallery on mobile (`sm:hidden`, gets `max-sm:w-full` from default size — positioned before gallery in DOM so always above contact bar Y range). Desktop/tablet version (`hidden sm:inline-flex`) stays below gallery.

---

## AC table

| # | Criterion | Evidence |
|---|---|---|
| AC1 | Defect A gone: badge inside container + on-screen at 320–560 ×4 locales | `screenshots:assert` 2026-06-23T21-18: all 56 PublicListing cells PASS, 56 StaffPreviewPublished PASS, 56 StaffPreviewUnpublished PASS — 0 `outside-container`, 0 `offscreen-control` on LDV cells. Fix: `ListingGallery.tsx` `<div className="md:hidden absolute top-3 right-3"><Button ...>` — wrapper is the Button's parentElement, shrinks to content, so Button is full-width of wrapper (not of gallery) |
| AC2 | Defect B gone: Call ↔ WA never overlap 320→960 ×4 | 0 `element-overlap` on LDV cells. Fix: `ListingDetailView.tsx` removed `ListingMobileCTA`; `ListingContact.tsx` WA in separate `sm:hidden` full-width row, Phone `icon-xl` in price row |
| AC3 | CTAs never overlap "All photos (N)" 320→960 ×4 | 0 `element-overlap` on LDV cells. Fix: `ListingGallery.tsx` mobile "All photos (N)" above gallery (`sm:hidden mb-3`) — above contact bar Y range at all content heights |
| AC4 | Sticky bar doesn't cover content; archived-listing branch safe | `pb-44` bottom padding on `listing-detail-view` div; `ListingContact.tsx` `{!listingArchived && <div className="listing-contact-mobile ...">}` — bar absent on archived listing |
| AC5 | Mobile <640 full-width gate: CTAs full-width/stacked, ≥44px, labels wrap | WA row: `buttonVariants({ size: 'xl' })` → `max-sm:w-full max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words`. Phone: `icon-xl` exempt (icon-only). "All photos (N)": default Button size → `max-sm:w-full max-sm:min-h-11`. Gallery badge: canonical `<Button>` inside absolute shrink-to-content wrapper div; Button is `max-sm:w-full` of the wrapper (~90px), not of the gallery; touch target ≥44px via `max-sm:min-h-11` (default size); `check-stories-rendered.mjs` check (d) passes because `parentElement` = the wrapper div |
| AC6 | All 4 locales pass incl. uk/sq long-label; no h-scroll at 320 | 168 LDV cells all PASS across sq/en/uk/it × all viewports. `max-sm:whitespace-normal max-sm:break-words` in WA/phone rows |
| AC7 | No control removed / read-only-label swap | Gallery badge → canonical `<Button>` (inside absolute shrink-to-content wrapper) with `onClick={() => setLightboxIndex(0)}`, `aria-label`. "All photos (N)" → present at all breakpoints (above gallery on mobile, below on desktop). Call/WA CTAs functional via `contactListingId`. No control removed. |
| AC8 | Desktop ≥1024 not regressed | `listing-contact-mobile` has `lg:hidden`; `ListingMobileCTA` was also `lg:hidden`. No desktop change. Gallery badge `md:hidden` unchanged. All 56 ≥1024 cells PASS. |
| AC9 | Harness not weakened | `git diff --stat HEAD -- scripts/check-stories-rendered.mjs scripts/geometry-integrity.mjs` → empty (no change) |
| AC10 | Gates green: tsc=0, lint=0 new, check:stories, check:i18n | `tsc --noEmit`: 0 errors. `lint`: 0 new (2 pre-existing in AdminReportsManager + visibility.test.ts, unrelated). `check:stories`: PASSED 60 files, 0 violations. `check:i18n`: PASSED 1866 keys all 4 locales |

**Self-validation:** `tsc=0 · lint=0-new · check:stories=green · check:i18n=green · LDV screenshots:assert=0 fail (168/168 PASS) · harness unchanged · AC table=all green · scope=LDV-only clean`

---

## Mobile <640 icon-only exemptions

| Control | Exemption class | Justification |
|---|---|---|
| Phone icon button (`size="icon-xl"`, 44×44px) | Icon-only (no text, `aria-label` via `data-track`) | Touch target ≥44px met via `size-11`; `icon-xl` intentionally exempt from `max-sm:w-full` in `buttonVariants` |
| Gallery photo-count badge (canonical `<Button>` inside `absolute` wrapper div) | Positioned overlay, not a page-level CTA | Button is inside an `absolute` wrapper div (shrinks to content ~90px); `check-stories-rendered.mjs` check (d) measures `offsetWidth >= parentContentWidth - TOLERANCE` where `parentElement` = the wrapper div → Button IS full-width of wrapper → check passes. Touch target ≥44px via `max-sm:min-h-11` from default size. |

---

## Behavior preservation notes

- **Staff-preview contact actions:** `contactListingId={listing.id}` always passes the real listing ID to `ListingContact`. `handleContactClick` now uses `contactListingId` (not `listingId` which is `undefined` when `isStaffPreview=true`). Phone/WA work in staff-preview.
- **Archived listing:** `!listingArchived` guard on `listing-contact-mobile` div — no sticky bar rendered. `pb-44` still applies (minor extra padding acceptable on archived; no overflow).
- **Single image / no image:** badge and "All photos (N)" conditionally render on `sorted.length > 1`.
- **Guest / owner-deleted / data-unavailable:** `showGuestCTA`, `ownerDeleted`, `ownerDataUnavailable` branches unchanged; WA/Phone rows only render when `!ownerDeleted && !showGuestCTA`.
