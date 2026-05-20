# Session Archive: Task 115 — Epic B.5 — Admin Company Management — 2026-05-20

**Epic:** B — Auth, Registration & Agent Onboarding  
**Task:** 115 (global numbering)  
**Type:** Feature  
**Status:** ✅ CLOSED

---

## Goal

Admin page `/admin/companies` for full company CRUD: list with logo, name, agent count; create/edit dialog with logo upload; delete with confirmation. Companies nav item added to sidebar.

---

## Changes Made

### `src/modules/companies/actions.ts` — new server actions

- `assertAdminOrMod()` — shared auth guard (checks role via admin client)
- `updateCompanyAction(id, name)` — requires admin/moderator role
- `deleteCompanyAction(id)` — requires admin/moderator role

### `src/components/admin/AdminCompaniesManager.tsx` (new, 330 lines)

Client component following the existing admin manager pattern:
- **Table:** Logo (AppImage variant="avatar" for Cloudinary URLs, Building2 icon for none) | Name | Agents count | Created (RelativeTime) | Edit/Delete buttons
- **CompanyFormDialog:** Dialog-based (canonical) create/edit form with name input + logo upload (reuses blob preview + `/api/upload-company-logo`). Logo upload is non-fatal — company saved regardless of upload result.
- **Delete confirmation:** Dialog with cancel/confirm-destructive buttons
- **Local optimistic state:** After create/edit/delete, items list updates immediately without page refresh
- **Search:** normalizeSearch-based client-side filtering via AdminSearchInput
- **Blob preview note:** `eslint-disable no-restricted-syntax, @next/next/no-img-element` on the form preview `<img>` — blob URLs genuinely cannot use AppImage or next/image

### `src/app/admin/companies/page.tsx` (new)

Server component (follows `AdminLocationsPage` pattern):
- Fetches companies + agent counts in parallel
- `agentCountMap` built from `users.company_id` aggregation (two queries, no JOIN)
- Renders `AdminCompaniesManager` with combined rows

### `src/components/admin/AdminSidebar.tsx`

- Added `Briefcase` icon import
- Added Companies nav item to "group_content" between Locations and Legal: `{ href: '/admin/companies', label: t('item_companies'), icon: Briefcase }`

### `src/components/admin/AdminMobileHeader.tsx`

- Added `'/admin/companies': t('item_companies')` to `PAGE_TITLES` map

### `messages/{sq,en,uk,it}.json`

New keys:
- `admin.sidebar.item_companies` (1 key × 4 locales)
- `admin.pages.companies_title`, `.companies_subtitle` (2 keys × 4 locales)
- `admin.companies.*` — full new namespace: 17 keys × 4 locales (add/edit titles, labels, table headers, success/error toasts, confirm delete, empty state, search placeholder, agent count plurals)

---

## Epic B Closure

With Task 115 done, all 5 Epic B tasks are closed:
- ✅ Task 108 — B.1 Side popup auth flow (AuthSheet)
- ✅ Task 112 — B.2 Agent city selection
- ✅ Task 113 — B.3 Agent company selection (companies table)
- ✅ Task 114 — B.4 Company logo upload
- ✅ Task 115 — B.5 Admin company management page

---

## Acceptance Criteria Checklist

- [x] List all companies: logo thumbnail, name, agent count, created date
- [x] Create company: Dialog form with name input + optional logo upload
- [x] Edit company: same form pre-populated with existing values
- [x] Delete company: Dialog confirmation, admin/moderator only (server action auth guard)
- [x] Consistent with admin table pattern (AdminLocationsManager / AdminPropertyTypesManager)
- [x] Companies nav item in sidebar (Briefcase icon, between Locations and Legal)
- [x] Mobile header title for /admin/companies
- [x] All 4 locales via t() — 20 new keys × 4 locales
- [x] 0 new lint errors / 0 new warnings
- [x] `governance:localization` PASS
- [ ] `npm run build` — user's manual step
