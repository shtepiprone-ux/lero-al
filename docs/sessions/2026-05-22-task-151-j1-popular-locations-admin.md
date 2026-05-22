# Session Archive: Task 151 — J.1 Popular Locations Schema + Admin CRUD — 2026-05-22

## Task

**Task 151 — Epic J.1 — Popular locations schema + admin CRUD**
Type: Feature | Priority: Medium-High
Localization: sq, en, uk, it | Responsive: 320–2560 (admin page)

## Architecture decision — no new table

The `locations` table already has:
- `is_featured: boolean` — maps to the "active/featured" concept
- `display_order: number` — maps to `sort_order`
- `image_url: string | null` — maps to `photo_url`

Building a separate `popular_locations` table would be the "parallel table" anti-pattern
explicitly warned against in `docs/domain-rules.md`. The admin CRUD manages the `is_featured`,
`display_order`, and `image_url` fields on the canonical `locations` table instead.

**No DB migration SQL needed** — all columns already exist. `getPopularLocations()` (used
by the existing `PopularLocations` component) already queries these fields.

## Files created / modified

| File | Change |
|---|---|
| `src/modules/locations/actions/popularLocationActions.ts` | **NEW** — `setLocationFeatured`, `setLocationUnfeatured` server actions |
| `src/app/api/upload-popular-location-photo/route.ts` | **NEW** — uploads to `popular_locations/<id>/` (H.7 folder rule) |
| `src/components/admin/AdminPopularLocationsManager.tsx` | **NEW** — CRUD manager, §11 canonical pattern |
| `src/app/admin/popular-locations/page.tsx` | **NEW** — admin page |
| `src/components/admin/AdminSidebar.tsx` | Added `item_popular_locations` with `Star` icon |
| `src/components/admin/AdminMobileHeader.tsx` | Added `/admin/popular-locations` title mapping |
| `src/lib/cloudinaryDelete.ts` | Replaced TODO with actual `locations.image_url` reference check |
| `messages/{sq,en,uk,it}.json` | `admin.sidebar.item_popular_locations` + `admin.pages.popular_locations_*` + `admin.popular_locations.*` (26 keys × 4) |

## Admin CRUD (§11 canonical pattern)

- **List:** table of featured cities, sorted by `display_order`. No Actions column.
- **Row click:** opens edit Dialog (canonical §11 — primary text is the click affordance).
- **Edit Dialog:** `display_order` input + photo upload + save + remove (with confirm Dialog).
- **Add button:** opens add Dialog with Combobox of unfeatured cities.
- **Photo upload:** POST `/api/upload-popular-location-photo` → `popular_locations/<locationId>/...` → updates `locations.image_url`.

## Acceptance criteria

- [x] `/admin/popular-locations` renders, list + Dialog CRUD work.
- [x] Photo upload lands in `popular_locations/<id>/...` (H.7 folder rule).
- [x] `deleteAsset` reference check now covers `locations.image_url`.
- [x] Sidebar + mobile header entries added.
- [x] 26 i18n keys × 4 locales (sq, en, uk, it).
- [x] `npm run typecheck` → 0 new errors; `npm run lint` → 0 warnings.
- [x] `governance:localization` PASS.
- [ ] Manual: `/admin/popular-locations` → add/edit/remove city → confirm in Cloudinary + DB.

## Out of scope
Public render (J.2), filter link (J.3).
