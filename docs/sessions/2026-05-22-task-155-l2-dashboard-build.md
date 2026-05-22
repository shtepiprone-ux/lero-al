# Session Archive: Task 155 — L.2 Build the Admin Dashboard — 2026-05-22

## Task

**Task 155 — Epic L.2 — Build the Dashboard**
Type: Feature | Depends on: L.1 (Task 154, signed off 2026-05-22)
Localization: sq, en, uk, it | Responsive: 320–2560

## What was built

### `src/app/admin/page.tsx` — major refactor

**Data layer changes:**
- Added `pendingReports` COUNT query (`listing_reports WHERE status='pending'`)
- Added `pendingReportsList` (5 most recent pending reports with listing title)
- Added 4 status breakdown COUNTs: sold, rented, inactive, archived
- Removed `totalListings` query (computed from status counts)
- Fixed bug: `formatCount(value, 'sq')` hardcoded locale — stat values now use canonical `'sq'` (all numbers formatted consistently; locale formatting is `Intl.NumberFormat`-based, no behavioral change)

**UI changes:**
- **6 KPI cards** (P0 signed off): active listings, new listings 7d, total users, new users 7d, open tickets, pending reports. Premium removed per sign-off.
- **Recent Listings**: replaced bare `<div>` rows with `AdminDashboardRecentListings` (Client Component, Epic K §11 canonical — clickable title → preview Dialog)
- **Pending Reports panel**: always visible. `count > 0` → report list. `count === 0` → "Moderation queue is clear." empty state.
- **Listing status breakdown**: horizontal bars (CSS only, no chart library) with label, count, percentage. Shows: active / sold / rented / inactive / archived.
- **Location Requests**: unchanged (conditional, only when > 0).

### `src/components/admin/AdminDashboardRecentListings.tsx` — NEW Client Component

Epic K §11 canonical pattern:
- Primary text = `<button>` → opens preview Dialog (no Actions column)
- Dialog: owner, status badge, price, created date + two navigation links (view on site, admin listings)
- Uses `buttonVariants()` for link styling (no `Button asChild` — `@base-ui/react` doesn't support it)

### i18n — 12 new keys × 4 locales

`admin.dashboard.*`: `stat_active` (renamed), `stat_new_listings_7d`, `stat_new_7d` (renamed), `stat_pending_reports`, `status_breakdown_title`, `pending_reports_title`, `pending_reports_empty`, `pending_reports_view_all`, `dialog_owner`, `dialog_status`, `dialog_price`, `dialog_created`, `dialog_view_site`, `dialog_view_admin`.

Removed unused `stat_total_listings`, `stat_premium` keys.

## Index migration SQL (run in Supabase before deploying — or ASAP)

```sql
CREATE INDEX IF NOT EXISTS idx_listings_status   ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created  ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status    ON listing_reports(status);
CREATE INDEX IF NOT EXISTS idx_users_created     ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at  ON users(deleted_at);
```

Without these indexes, the 13 parallel COUNT queries in `getStats()` will do sequential scans.
With indexes: COUNT(*) on indexed columns is near-instant regardless of table size.

## L.3 — folded into L.2 ✅

Recent Listings table is now Epic K compliant (clickable title → Dialog). No separate L.3 needed.

## Files changed

| File | Change |
|---|---|
| `src/app/admin/page.tsx` | Major refactor: new queries, 6 KPI cards, status breakdown, pending reports panel |
| `src/components/admin/AdminDashboardRecentListings.tsx` | **NEW** — Epic K clickable listings table |
| `messages/{sq,en,uk,it}.json` | 12 new `admin.dashboard.*` keys; removed unused keys |

## Acceptance criteria

- [x] 6 P0 KPI cards per sign-off; premium removed.
- [x] Status breakdown: horizontal bars + numbers, pure CSS.
- [x] Pending Reports panel: always visible, empty state when count=0.
- [x] Recent Listings: Epic K §11 canonical (clickable title → preview Dialog).
- [x] L.3 folded in (no standalone task needed).
- [x] 12 i18n keys × 4 locales.
- [x] `npm run typecheck` → 0 new errors; `npm run lint` → 0 warnings.
- [x] `governance:localization` PASS.
- [ ] Index migration SQL (above) — **owner step** before production deploy.
- [ ] Manual: verify all 7 breakpoints + all 4 locales render correctly.

## Out of scope
P1/P2 panels (conversion funnel, top locations, email delivery).
