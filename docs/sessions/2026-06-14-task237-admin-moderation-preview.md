# Task 237 — Admin moderation preview: temporary listing page

**Epic Y.2** · Kickoff: `tasks/Epics/Epic_Y_kickoff_prompt_Task_237.md`
**Date:** 2026-06-14

## Summary

Fixes issue #28 (admin "View" button 404s for `pending`/`inactive` listings) by:

1. Extracting the public listing-detail body into a shared presentational component,
   split into an async wrapper `ListingDetailView` (production entry point — resolves
   translations + renders the live `SimilarListings`/`RecentlyViewedSection` Server
   Components) and a sync, exported `ListingDetailViewBody` (the actual JSX, taking
   `t`/`tNav`/`tc` translators and `similarListingsSlot`/`recentlyViewedSlot` as props).
2. A new staff-gated admin preview route `/admin/listings/[id]/preview`, which fetches
   the listing by id via the service-role admin client (no status filter) and renders
   `ListingDetailView` with `isStaffPreview` + a `previewBanner` derived from
   `isListingHidden(status)`.
3. Retargeting `AdminListingsTable`'s `ListingPreviewDialog` footer: `btn_view` now
   routes to the new preview route (never 404s); a new `btn_open_public` control opens
   the live public page, shown only when `!isListingHidden(status)`.
4. 4-locale i18n keys for the preview banners and the new admin control.
5. Mobile <640 full-width gate compliance on the preview banner and the (now wrapping)
   `ListingPreviewDialog` footer.
6. A narrowly-scoped Storybook story file (`ListingDetailView.stories.tsx`) providing
   rendered-evidence coverage for the shared presentational layout (preview banner
   states, layout reuse, locale wrapping, full-width mobile, gallery/title/price/
   features/contact/map layout).

## Evidence boundary (read before reviewing §8)

- **Storybook covers**: the shared presentational layout in `ListingDetailViewBody` —
  staff-preview banner (`unpublished` / `published` variants), public-listing layout
  (no banner), gallery/title/price/badges/features/description/attributes/map/contact
  sidebar, locale wrapping (sq/en/uk/it, incl. uk long strings), and the mobile <640
  full-width gate (no 320px overflow, `max-sm:w-full`/`min-h-11`).
- **Production async children remain covered by typecheck/build and unchanged server
  usage**: `SimilarListings` and `RecentlyViewedSection` are real, Supabase-querying
  Server Components, rendered ONLY by the async `ListingDetailView` wrapper in
  production (both the public page and the new admin preview route). They are NOT
  rendered in Storybook — `ListingDetailViewBody` instead receives placeholder
  `similarListingsSlot`/`recentlyViewedSlot` nodes reading "Omitted in story — live
  Supabase data in prod" (localized via `storyT(locale, 'storybook.listing_detail_view.*')`).
  This split required **no Supabase mocking** and **no project-wide RSC support** —
  `ListingDetailViewBody` is a plain sync component; `ListingDetailView` (async) is
  unchanged in its production responsibilities.
- Route-guard/data-fetch behavior of `/admin/listings/[id]/preview` (staff role assert,
  service-role fetch-by-id, `notFound()` on missing row) is covered by code-path
  inspection + `npx tsc --noEmit` + `npm run build` (the route compiles and is listed in
  the build's route table as `ƒ /admin/listings/[id]/preview`), not by Storybook.

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | New route `src/app/admin/listings/[id]/preview/page.tsx`; staff-gated; service-role fetch-by-id; renders `ListingDetailView`. | ✅ | File created; `getUser()` + role check (`admin`/`moderator`) → `redirect`; `createAdminClient()` `.from('listings').select(...).eq('id', id).single()`, no status filter; renders `<ListingDetailView isStaffPreview previewBanner={...} />`. |
| 2 | `btn_view` routes to `/admin/listings/<id>/preview` for EVERY non-deleted status, never 404s. (#28) | ✅ | `AdminListingsTable.tsx` `ListingPreviewDialog` footer — `btn_view` is now an internal `Link` to `/admin/listings/${listing.id}/preview` with no status condition. |
| 3 | Preview route still works after publish — no redirect; banner switches to "published" with working "Open public page" link. | ✅ | `previewBanner = isListingHidden(listing.status) ? 'unpublished' : 'published'` — `published` renders `t('preview_banner_published')` + a `target="_blank"` link to `/${locale}/listings/${slug}` reading `t('preview_open_public')`. |
| 4 | `ListingDetailView` is a single shared component used by BOTH public page and preview route; public page renders identically (extraction only). | ✅ | `ListingDetailView`/`ListingDetailViewBody` in `src/modules/listings/components/ListingDetailView.tsx`, imported by both `src/app/[locale]/listings/[slug]/page.tsx` (with `isStaffPreview=false, previewBanner=null`) and the new preview route. JSX moved verbatim into `ListingDetailViewBody`; public page's data-fetch/`notFound()` gate unchanged. |
| 5 | `previewBanner`/"Open public page" visibility uses `isListingHidden` — no hardcoded status arrays. | ✅ | Preview route: `isListingHidden(listing.status as ListingStatus)`. `AdminListingsTable.tsx`: `{!isListingHidden(listing.status) && (<Link ... btn_open_public />)}`. |
| 6 | `isStaffPreview` suppresses `ViewTracker`/`RecentlyViewedTracker`/`RecentlyViewedSection`, inertizes favorite/report; public mode unchanged. | ✅ | `ListingDetailViewBody`: `{!isStaffPreview && (<><ViewTracker/><RecentlyViewedTracker/></>)}`; `recentlyViewedSlot` is `null` when `isStaffPreview` (set by the async wrapper); `effectiveCanReport`/`effectiveIsFavorited`/`effectiveListingId` all force-disabled when `isStaffPreview`. `SimilarListings` (`similarListingsSlot`) is kept in both modes per §3. |
| 7 | Non-staff cannot reach the preview (guard + role assert); missing/deleted id → `notFound()`. | ✅ | `getUser()` → redirect to login if absent; `users.role` checked against `admin`/`moderator` → redirect to `/${locale}` otherwise. Missing row → `notFound()`. `listings` table has **no `deleted_at` column** (confirmed in `src/types/database.ts` — only `User`/`PublicUserProfile` carry `deleted_at`), so the soft-delete branch of §3.3 does not apply; `notFound()` on missing row covers the only deletion case for this table. |
| 8 | "Open public page" hidden when `isListingHidden(status)`. | ✅ | Same conditional as AC5. |
| 9 | Mobile <640 full-width gate satisfied for banner + footer action row (rendered matrix proof). | ✅ | See §8 below. Preview banner uses `min-h-11` on its link; `ListingPreviewDialog` footer is `flex flex-col gap-2 sm:flex-row sm:flex-wrap` with every control `max-sm:w-full max-sm:min-h-11`. |
| 10 | 4-locale parity for new keys (key-count proof). | ✅ | `npm run check:i18n` → 1787/1787 keys, all 4 locales PASS (1785 baseline + 2 new `storybook.listing_detail_view.*` keys added for the story harness; the 6 product-facing keys — `listing.preview_banner_unpublished/published/open_public` ×1 + `admin.listings.btn_open_public` — were already included in the prior 1785 count from this session's earlier work). |
| 11 | Before/after control inventory for `ListingPreviewDialog` footer (Note 20). | ✅ | See "Control inventory" below — nothing removed. |
| 12 | File-integrity (clause 14): 0 NUL bytes, no BOM, `.json` parses, `.tsx` compiles, not truncated. | ✅ | `npm run check:file-integrity:all` → 896/896 files PASS (see transcript below). |
| 13 | `npx tsc --noEmit` → 0; `npm run build` passes; `check:i18n`/`check:i18n-dynamic`/lint green; 0 new warnings. | ✅ | See "Validation suite" below. |

## Control inventory — `ListingPreviewDialog` footer (Note 20)

| Control | Before | After |
|---|---|---|
| `btn_view` | `Link` → `/${locale}/listings/${listing.slug}` (404s for `pending`/`inactive` — issue #28), `ExternalLink` icon | `Link` → `/admin/listings/${listing.id}/preview` (internal, never 404s), `Eye` icon, label unchanged (`t('btn_view')`) |
| "Open public page" | — (did not exist) | **NEW** `Link` → `/${locale}/listings/${listing.slug}`, `target="_blank"`, `ExternalLink` icon, `t('btn_open_public')`, shown only when `!isListingHidden(listing.status)` |
| Edit | `Link` → `/${locale}/listings/${listing.slug}/edit`, `target="_blank"`, `Pencil` icon, `tc('edit')` | **Unchanged** |
| Premium | `Button` `onClick={onPremium}`, `Star` icon, `t('premium_change')`/`t('premium_set')` | **Unchanged** |
| Delete | `Button` `onClick={() => setShowDeleteConfirm(true)}`, `Trash2` icon, `tc('delete')` | **Unchanged** |

All five original controls remain; one was retargeted (no longer 404s), one was added.
Mobile (<640): every control now carries `max-sm:w-full max-sm:min-h-11`; the footer
wrapper is `flex flex-col gap-2 sm:flex-row sm:flex-wrap` (full-width stack on mobile,
wrapping row on `sm:`+).

## Rendered-evidence matrix (§8)

Stories (all in `src/modules/listings/components/ListingDetailView.stories.tsx`,
`Listings/ListingDetailView`):

- `PublicListing` — `isStaffPreview=false`, `previewBanner=null` (public detail page reuse)
- `StaffPreviewUnpublished` — `status='pending'`, `previewBanner='unpublished'`
- `StaffPreviewPublished` — `status='active'`, `previewBanner='published'` (incl. "Open public page" link)
- Plus 11 supplementary stories (mobile-uk 320/375/390 variants of each of the 3 base
  states, and a tablet-768 / desktop-1440 sweep of `PublicListing`) — extra Storybook
  entries for ad-hoc/manual inspection, not required by §8's matrix.

### Commands run

1. `npm run build-storybook` — rebuilt static Storybook to include the new
   `ListingDetailView.stories.tsx` (14 stories). `check:stories` initially flagged 2
   hardcoded English literals in the placeholder slots — fixed via `storyT(...,
   'storybook.listing_detail_view.*')` (new keys added to all 4 locale files, parity
   1787/1787). Rebuild then passed.
2. `npm run screenshots:assert -- --fast` — full-repo mobile sweep (`mobile-320/375/390`
   × `sq/en/uk/it`, all 50 `ASSERT_STORIES`). **600/600 cells PASS**, including all 14
   `ListingDetailView` entries (manifest `2026-06-14T09-51`).
3. `npm run screenshots:assert` (full, non-`--fast`, **canonical 14-viewport set**:
   `mobile-320/375/390/480, canonical-560/680/810/960, tablet-768, desktop-1024/1440,
   canonical-1200, huge-1920/2560`) — scoped to the 3 base story-states
   (`PublicListing`, `StaffPreviewUnpublished`, `StaffPreviewPublished`) × 4 locales.
   **168/168 cells PASS** (manifest `2026-06-14T10-16`).

Combined: **0 FAIL across both runs** for the `ListingDetailView` stories. The
14-viewport canonical run is a superset of the kickoff's 7-breakpoint list
(320/375/390/768/1280/1440/2560 — `1280` isn't a named viewport in
`check-stories-rendered.mjs`'s canon, but `desktop-1024`/`canonical-1200`/`desktop-1440`
bracket it and `tablet-768`/`huge-1920`/`huge-2560` cover the rest).

### Coverage table — 3 base story-states × breakpoint × locale

All cells below: **PASS** — no render errors, `noHorizontalOverflow: true`,
`fullWidthControlsAtMobile: true`, `fullWidthButtonsAtMobile: true` (mobile cells),
`popupBottomSheetAtMobile: n/a` (no overlay popups in this view).

| Breakpoint | sq | en | uk | it |
|---|---|---|---|---|
| 320 (mobile-320) | PASS ×3 | PASS ×3 | **PASS ×3** | PASS ×3 |
| 375 (mobile-375) | PASS ×3 | PASS ×3 | **PASS ×3** | PASS ×3 |
| 390 (mobile-390) | PASS ×3 | PASS ×3 | **PASS ×3** | PASS ×3 |
| 480 (mobile-480) | PASS ×3 | PASS ×3 | PASS ×3 | PASS ×3 |
| 560 (canonical-560) | PASS ×3 | PASS ×3 | PASS ×3 | PASS ×3 |
| 680 (canonical-680) | PASS ×3 | PASS ×3 | PASS ×3 | PASS ×3 |
| 768 (tablet-768) | PASS ×3 | PASS ×3 | PASS ×3 | PASS ×3 |
| 810 (canonical-810) | PASS ×3 | PASS ×3 | PASS ×3 | PASS ×3 |
| 960 (canonical-960) | PASS ×3 | PASS ×3 | PASS ×3 | PASS ×3 |
| 1024 (desktop-1024) | PASS ×3 | PASS ×3 | PASS ×3 | PASS ×3 |
| 1200 (canonical-1200) | PASS ×3 | PASS ×3 | PASS ×3 | PASS ×3 |
| 1440 (desktop-1440) | PASS ×3 | PASS ×3 | PASS ×3 | PASS ×3 |
| 1920 (huge-1920) | PASS ×3 | PASS ×3 | PASS ×3 | PASS ×3 |
| 2560 (huge-2560) | PASS ×3 | PASS ×3 | PASS ×3 | PASS ×3 |

"×3" = `PublicListing`, `StaffPreviewUnpublished`, `StaffPreviewPublished` all PASS at
that breakpoint × locale. 14 breakpoints × 4 locales × 3 stories = 168/168 PASS.

### uk@320/375/390 mandatory stress cells — explicit confirmation

| Story | mobile-320 | mobile-375 | mobile-390 |
|---|---|---|---|
| `PublicListing` (uk) | PASS (noHOverflow ✅, fullWidthCtrl ✅, fullWidthBtn ✅) | PASS | PASS |
| `StaffPreviewUnpublished` (uk) | PASS (noHOverflow ✅, fullWidthCtrl ✅, fullWidthBtn ✅) | PASS | PASS |
| `StaffPreviewPublished` (uk) | PASS (noHOverflow ✅, fullWidthCtrl ✅, fullWidthBtn ✅) | PASS | PASS |

No horizontal overflow at 320px for any locale/story (`document.scrollWidth <=
document.clientWidth` for all 12 sq/en/uk/it × 3-story cells at `mobile-320`, both runs).
The 11 supplementary uk-mobile/desktop-sweep stories also PASS 168/168 in the `--fast`
run (manifest `2026-06-14T09-51`).

## File-integrity transcript (clause 14)

```
🔍  check:file-integrity — src/ + scripts/ + messages/ + docs/ (--all)
    Checking 896 file(s) — NUL bytes · BOM · JSON parse · node --check · truncation

✅  check:file-integrity PASSED — all 896 file(s) clean
```

## Validation suite

```
npx tsc --noEmit          → 0 errors
npm run build              → ✅ compiled, ƒ /admin/listings/[id]/preview present in route table
npm run check:i18n         → ✅ Parity PASSED — 1787/1787 keys, all 4 locales
npm run check:i18n-dynamic → ✅ PASSED — 195 keys · 4 locales · 0 errors
npm run check:i18n-hardcode → ✅ PASSED — 1 known baseline finding (pre-existing, unrelated), 0 NEW
npx eslint <touched files> → 0 errors, 0 warnings
npm run check:file-integrity:all → ✅ 896/896 PASS
npm run build-storybook    → ✅ (check:stories PASSED after fixing 2 hardcoded-label findings)
```

## Files Changed

| File | Change |
|---|---|
| `src/modules/listings/components/ListingDetailView.tsx` | **NEW** — extracted shared presentational view: async wrapper `ListingDetailView` (resolves `t`/`tNav`/`tc`, renders real `SimilarListings`/`RecentlyViewedSection`) + sync exported `ListingDetailViewBody` (all presentational JSX, incl. new staff-preview banner block), exported `SimilarListingsSkeleton`, `Translator`, `PreviewBanner`, `ListingDetailViewListing`, prop interfaces. |
| `src/app/[locale]/listings/[slug]/page.tsx` | Refactored: data-fetch/`notFound()` gate unchanged; JSX body replaced with `<ListingDetailView ... isStaffPreview={false} previewBanner={null} />`. Pure extraction — no behavior change. |
| `src/app/admin/listings/[id]/preview/page.tsx` | **NEW** — staff-gated admin preview route; service-role fetch-by-id (no status filter); `notFound()` on missing row; renders `ListingDetailView` with `isStaffPreview` + `previewBanner` derived from `isListingHidden`. |
| `src/components/admin/AdminListingsTable.tsx` | `ListingPreviewDialog` footer: retargeted `btn_view` → preview route (`Eye` icon); added `btn_open_public` (shown when `!isListingHidden`); all controls `max-sm:w-full max-sm:min-h-11`; footer `flex flex-col gap-2 sm:flex-row sm:flex-wrap`. Added `Eye` and `isListingHidden` imports. |
| `src/modules/listings/components/ListingDetailView.stories.tsx` | **NEW** — narrowly-scoped Storybook harness for `ListingDetailViewBody` (3 base states × desktop + uk mobile 320/375/390 + tablet/desktop sweep = 14 stories). Mocked listing/owner/images/features/attrs; `t`/`tNav`/`tc` via `useTranslations`; async sections replaced with localized "Omitted in story" placeholders via `storyT`. |
| `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json` | Added `listing.preview_banner_unpublished`, `listing.preview_banner_published`, `listing.preview_open_public`, `admin.listings.btn_open_public` (×4 locales); added `storybook.listing_detail_view.similar_listings_omitted`/`recently_viewed_omitted` (×4 locales, for the new story harness). |
| `scripts/check-stories-rendered.mjs` | Added the 14 new `ListingDetailView` story IDs to `ASSERT_STORIES` so `screenshots:assert` covers them going forward. |
| `docs/backlog.md` | "Last Session" updated — Task 237 complete, pending review. |
| `docs/sessions/2026-06-14-task237-admin-moderation-preview.md` | This session log. |

## Self-validation

Self-validation: all 13 ACs verified against the diff (table above); Positive flow
(staff opens pending listing → View → preview renders, no 404, unpublished banner →
approve → re-open → published banner + working "Open public page" link) and every
Negative branch (non-staff redirect, missing id → `notFound()`, hidden-status "Open
public page" suppression) are implemented and traceable in the diff; before/after
control inventory shows nothing removed (Note 20); file-integrity clean (896/896);
`tsc`/`build`/`check:i18n`/`check:i18n-dynamic`/`check:i18n-hardcode`/lint all green;
rendered-evidence matrix captured per §8 with uk@320/375/390 mandatory cells. No git
commands run by this executor.
