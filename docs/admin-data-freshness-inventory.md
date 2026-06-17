# Admin Data Freshness Inventory (Task 452 / Epic KK Slice KK.1)

Every `/admin/**` page classified for the `useAdminPageFreshness` hook (mounted in `AdminShell`).

## Classification key

- **Mutable:** data changes frequently via other operators → freshness matters
- **Reference:** rarely changes, single-operator edits → freshness nice-to-have
- **SSR→client:** server component fetches data, passes as props to client component
- **Re-syncs:** client component re-syncs from refreshed SSR props via `useEffect([prop])`

## Page inventory

| Route | Page file | Client component | Mutable? | Pattern | Re-syncs? | Task 452 action |
|---|---|---|---|---|---|---|
| `/admin` | `admin/page.tsx` | Server-only (stat cards, links) | Mutable | Pure SSR, no client state | N/A — re-renders on refresh | None needed |
| `/admin/listings` | `admin/listings/page.tsx` | `AdminListingsTable` | Mutable | SSR→client, URL-backed filters | ✅ Yes (`useEffect(() => setItems(init), [init])` line 439) | None — already re-syncs |
| `/admin/users` | `admin/users/page.tsx` | `AdminUsersTable` | Mutable | SSR→client, URL-backed filters | ✅ **FIXED** (Task 452: added `useEffect(() => setItems(init), [init])` line 78) | **Fixed** |
| `/admin/users/[id]` | `admin/users/[id]/page.tsx` | `AdminUserProfile` | Mutable | SSR→client, uses react-hook-form `reset()` on prop change | ✅ Yes (form `reset(user)` in useEffect) | None — already re-syncs |
| `/admin/users/new` | `admin/users/new/page.tsx` | `AdminUserCreate` | N/A | Create form, no initial data | N/A | None needed |
| `/admin/reports` | `admin/reports/page.tsx` | `AdminReportsManager` | Mutable | SSR→client | ✅ **FIXED** (Task 452: added `useEffect(() => setReports(initial), [initial])` line 219) | **Fixed** |
| `/admin/support` | `admin/support/page.tsx` | `AdminSupportManager` | Mutable | SSR→client | ✅ **FIXED** (Task 452: added `useEffect` for `items` line 665 + `allEvents` line 666) | **Fixed** |
| `/admin/inquiries/support` | `admin/inquiries/support/page.tsx` | `AdminInquiriesManager` | Mutable | SSR→client | ✅ **FIXED** (Task 452: added `useEffect` for `inquiries` line 81 + `allReplies` line 82) | **Fixed** |
| `/admin/inquiries/sales` | `admin/inquiries/sales/page.tsx` | `AdminInquiriesManager` | Mutable | SSR→client (same component, different mailbox) | ✅ **FIXED** (same component) | **Fixed** |
| `/admin/inquiries` | `admin/inquiries/page.tsx` | Redirect page | N/A | — | N/A | None needed |
| `/admin/companies` | `admin/companies/page.tsx` | `AdminCompaniesManager` | Reference | SSR→client | ❌ No re-sync (`useState` copies props, no `useEffect`) — deferred **KK.2 / Task 453** | Deferred |
| `/admin/currency` | `admin/currency/page.tsx` | `AdminCurrenciesManager` | Reference | SSR→client, form fields | ❌ No re-sync (form fields copy initial to state) — deferred **KK.2 / Task 453** | Deferred |
| `/admin/email-templates` | `admin/email-templates/page.tsx` | `AdminEmailTemplatesManager` | Reference | SSR→client | ❌ No re-sync (`useState(initial)` L331, no `useEffect`) — deferred **KK.2 / Task 453** | Deferred |
| `/admin/locations` | `admin/locations/page.tsx` | `AdminLocationsManager` | Reference | SSR→client | ✅ Yes (`useEffect(() => setItems(init), [init])` line 198) | None — already re-syncs |
| `/admin/popular-locations` | `admin/popular-locations/page.tsx` | `AdminPopularLocationsManager` | Reference | SSR→client, dialog/picker pattern | ✅ Uses props directly (no `useState(init)` list copy; dialog state is local UI) | None — uses props directly |
| `/admin/property-types` | `admin/property-types/page.tsx` | `AdminPropertyTypesManager` | Reference | SSR→client | ❌ No re-sync (`useState(initialTypes)` L225, no `useEffect`) — deferred **KK.2 / Task 453** | Deferred |
| `/admin/settings` | `admin/settings/page.tsx` | `AdminSettings` | Reference | SSR→client | ❌ No re-sync (`useState(initialSettings)` L81, no `useEffect`; nested form state = non-trivial) — deferred **KK.2 / Task 453** | Deferred |
| `/admin/permissions` | `admin/permissions/page.tsx` | `AdminPermissionsManager` | Reference | SSR→client | ❌ No re-sync (`useState(initial)` L24, no `useEffect`) — deferred **KK.2 / Task 453** | Deferred |
| `/admin/pages` | `admin/pages/page.tsx` | `AdminPagesManager` | Reference | SSR→client | ✅ **FIXED** (Task 452 rework: added `useEffect(() => setItems(init), [init])` L241; prior `router.refresh()` after own mutation was self-triggered, NOT prop re-sync) | **Fixed** |
| `/admin/footer` | `admin/footer/page.tsx` | `AdminFooterManager` | Reference | SSR→client | ❌ No re-sync (`useState(() => buildInitialForm(...))` L244-248; nested form state = non-trivial) — deferred **KK.2 / Task 453** | Deferred |
| `/admin/legal` | `admin/legal/page.tsx` | `AdminLegalManager` | Reference | SSR→client | ✅ **FIXED** (Task 452 rework: added `useEffect(() => setItems(init), [init])` L117; prior `router.refresh()` after own mutation was self-triggered, NOT prop re-sync) | **Fixed** |
| `/admin/listings/[id]/preview` | `admin/listings/[id]/preview/page.tsx` | Read-only preview | N/A | SSR read-only | N/A | None needed |

## Summary

**Fixed in Task 452 (priority mutable-data surfaces):**
- `AdminUsersTable` — added `useEffect([init])` re-sync (L78)
- `AdminReportsManager` — added `useEffect([initial])` re-sync (L219)
- `AdminSupportManager` — added `useEffect([init])` + `useEffect([initEvents])` re-sync (L665-666)
- `AdminInquiriesManager` — added `useEffect([initialInquiries])` + `useEffect([initialReplies])` re-sync (L81-82)

**Fixed in Task 452 rework (FALSE ✅ corrected — reference pages with trivial re-sync):**
- `AdminPagesManager` — added `useEffect([init])` re-sync (L241); prior verdict "calls router.refresh() after mutation" was self-triggered refresh, NOT external prop re-sync
- `AdminLegalManager` — added `useEffect([init])` re-sync (L117); same correction

**Already re-syncing (no change needed):**
- `AdminListingsTable` (L439), `AdminLocationsManager` (L198), `AdminUserProfile` (react-hook-form reset), `AdminPopularLocationsManager` (uses props directly, no local list copy)

**Deferred to KK.2 / Task 453 (reference/config pages — rarely change, single-operator):**
- `AdminCompaniesManager`, `AdminCurrenciesManager`, `AdminEmailTemplatesManager`, `AdminPropertyTypesManager`, `AdminPermissionsManager`, `AdminSettings` (nested form state = non-trivial), `AdminFooterManager` (nested form state = non-trivial)

## Admin reads: dynamic, not cached stale

All admin pages use `createAdminClient()` which creates a Supabase service-role client per request. The admin layout (`admin/layout.tsx`) uses `cookies()` + `getUser()` which opts the route into dynamic rendering. No admin page has `export const dynamic = 'force-static'` or caching headers. `router.refresh()` always returns fresh rows.
