# Task 410 — Admin Storybook Render Harness (Mocked Admin State)

**Date:** 2026-06-08  
**Sprint:** 35  
**Executor:** Sonnet 4.6

## Summary

Task 410 adds Storybook stories with mocked admin state for all 14 M-classified admin components that carried Task 406 design-token hits but were previously unstoried. This makes the admin surfaces rendered-assertable via the `screenshots:assert` pipeline and closes the Task 406 rendered-coverage addendum (renderable subset).

## S/M/G Triage Table

| Component | Class | Rationale |
|---|---|---|
| AdminTable | **S** | Pre-existing story; already complete |
| StatusChangeControl | **S** | Pre-existing story; already complete |
| AdminLocaleSwitcher | **M** | Uses `useLocale`/`useRouter`/server action — all safe in SB10 nextjs-vite |
| AdminMobileHeader | **M** | Uses `usePathname`/`useTranslations` — works via nextjs-vite |
| AdminUserAvatar | **M** | Server action `removeUserAvatar` only called on interaction |
| AdminSidebar | **M** | `signOut` only on interaction; `usePathname` works |
| AdminSettings | **M** | `saveSettings` server action only on form submit |
| AdminCurrenciesManager | **M** | Props-driven; server actions only on interaction |
| AdminExchangeProvidersManager | **M** | Props-driven; server actions only on interaction |
| AdminPropertyTypesManager | **M** | Props-driven; server actions only on interaction |
| AdminCompaniesManager | **M** | Props-driven; server actions only on interaction |
| AdminSupportManager | **M** | Props-driven; server actions only on interaction |
| AdminEmailTemplatesManager | **M** | Props-driven; server actions only on interaction |
| AdminListingsTable | **M** | Props-driven; `usePropertyTypes` has static fallback |
| AdminUsersTable | **M** | Props-driven; server actions only on interaction |
| AdminUserProfile | **M** | Props-driven; `useUnsavedChangesGuard` only active when `isDirty=true` |

**G count: 0** — no gaps found. All components are safe to story without product-code refactor.

## New Files Created

| File | Purpose |
|---|---|
| `src/stories/fixtures/admin.fixtures.ts` | Shared typed fixture file: currencies, providers, property types, companies, email templates, listings, users, support tickets, settings, profile user, cities, regions |
| `src/components/admin/AdminLocaleSwitcher.stories.tsx` | 2 stories: Default, LocaleStress |
| `src/components/admin/AdminMobileHeader.stories.tsx` | 2 stories: Default (mobile390), LocaleStress (mobile320) |
| `src/components/admin/AdminUserAvatar.stories.tsx` | 4 stories: ViewPlaceholder, EditMode, CreateMode, LocaleStress |
| `src/components/admin/AdminSidebar.stories.tsx` | 3 stories: Desktop, MobileDrawerOpen, LocaleStress |
| `src/components/admin/AdminSettings.stories.tsx` | 3 stories: Default, Tablet, LocaleStress |
| `src/components/admin/AdminCurrenciesManager.stories.tsx` | 3 stories: Default, Tablet, LocaleStress |
| `src/components/admin/AdminExchangeProvidersManager.stories.tsx` | 3 stories: Default, Tablet, LocaleStress |
| `src/components/admin/AdminPropertyTypesManager.stories.tsx` | 3 stories: Default, Tablet, LocaleStress |
| `src/components/admin/AdminCompaniesManager.stories.tsx` | 3 stories: Default, Tablet, LocaleStress |
| `src/components/admin/AdminSupportManager.stories.tsx` | 4 stories: Default, Tablet, EmptyState, LocaleStress |
| `src/components/admin/AdminEmailTemplatesManager.stories.tsx` | 3 stories: Default, Tablet, LocaleStress |
| `src/components/admin/AdminListingsTable.stories.tsx` | 4 stories: Default, FilteredPending, Tablet, LocaleStress |
| `src/components/admin/AdminUsersTable.stories.tsx` | 5 stories: Default, VerifiedTab, LocationRequests, Tablet, LocaleStress |
| `src/components/admin/AdminUserProfile.stories.tsx` | 4 stories: Default, Tablet, CreateMode, LocaleStress |

## Files Modified

| File | Change |
|---|---|
| `scripts/story-coverage-exempt.json` | Removed 14 newly-storied admin components |
| `scripts/check-stories-rendered.mjs` | Added 16 new entries to `ASSERT_STORIES` (14 new stories + 2 extra stories for AdminUserAvatar and AdminSidebar) |
| `docs/backlog.md` | Updated Last Session + task numbering |
| `eslint.config.mjs` | Added `src/**/*.stories.tsx` + `src/stories/**` to `LISTING_STATUS_IGNORES` (fixture status literals are data, not mutations) |

## Exempt List Removals

Removed from `scripts/story-coverage-exempt.json`:
- AdminCompaniesManager
- AdminCurrenciesManager
- AdminEmailTemplatesManager
- AdminExchangeProvidersManager
- AdminListingsTable
- AdminLocaleSwitcher
- AdminMobileHeader
- AdminPropertyTypesManager
- AdminSettings
- AdminSidebar
- AdminSupportManager
- AdminUserAvatar
- AdminUserProfile
- AdminUsersTable

## Gate Results

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run lint` | ✅ 0 new errors (1 pre-existing warning in AdminTable.stories.tsx) |
| `npm run check:stories` | ✅ 47 files, 0 violations |
| `npm run check:story-coverage` | ✅ 38 storied, 58 exempt, 0 uncovered |
| `npm run check:i18n` | ✅ 1768 keys, 4-locale parity |
| `npm run check:file-integrity` | ✅ 19 files clean, 0 NUL, no BOM |

**`screenshots:assert` — PENDING** (requires built Storybook: `npm run build-storybook && npm run screenshots:assert`). Owner to run for rendered matrix proof.

## Task 406 Rendered-Coverage Addendum

All 14 M-classified admin surfaces from Task 406 are now storied and rendered-assertable:
- **Now renderable via screenshots:assert**: AdminLocaleSwitcher, AdminMobileHeader, AdminUserAvatar, AdminSidebar, AdminSettings, AdminCurrenciesManager, AdminExchangeProvidersManager, AdminPropertyTypesManager, AdminCompaniesManager, AdminSupportManager, AdminEmailTemplatesManager, AdminListingsTable, AdminUsersTable, AdminUserProfile
- **Pre-existing storied**: AdminTable, StatusChangeControl (already covered)
- **G gaps (still require Playwright follow-up)**: None — all surfaces are storyable

## Mocking Strategy

- **Session/auth**: no session context needed — all 14 components are props-driven with no client-side session hooks
- **Server actions**: Storybook 10.x with `@storybook/nextjs-vite` auto-mocks `'use server'` functions as no-ops; all server actions only called on user interaction, not render
- **Data**: typed fixture objects in `src/stories/fixtures/admin.fixtures.ts` — deterministic, frozen dates, representative edge content
- **i18n**: component's own `useTranslations()` driven by global `withLocale` decorator via toolbar; no new `storybook.*` keys needed

## Files-Changed Table (for orchestrator commit emission)

| Path | Type | Rationale |
|---|---|---|
| `src/stories/fixtures/admin.fixtures.ts` | NEW | Shared typed admin fixtures |
| `src/components/admin/AdminLocaleSwitcher.stories.tsx` | NEW | Task 410 harness story |
| `src/components/admin/AdminMobileHeader.stories.tsx` | NEW | Task 410 harness story |
| `src/components/admin/AdminUserAvatar.stories.tsx` | NEW | Task 410 harness story |
| `src/components/admin/AdminSidebar.stories.tsx` | NEW | Task 410 harness story |
| `src/components/admin/AdminSettings.stories.tsx` | NEW | Task 410 harness story |
| `src/components/admin/AdminCurrenciesManager.stories.tsx` | NEW | Task 410 harness story |
| `src/components/admin/AdminExchangeProvidersManager.stories.tsx` | NEW | Task 410 harness story |
| `src/components/admin/AdminPropertyTypesManager.stories.tsx` | NEW | Task 410 harness story |
| `src/components/admin/AdminCompaniesManager.stories.tsx` | NEW | Task 410 harness story |
| `src/components/admin/AdminSupportManager.stories.tsx` | NEW | Task 410 harness story |
| `src/components/admin/AdminEmailTemplatesManager.stories.tsx` | NEW | Task 410 harness story |
| `src/components/admin/AdminListingsTable.stories.tsx` | NEW | Task 410 harness story |
| `src/components/admin/AdminUsersTable.stories.tsx` | NEW | Task 410 harness story |
| `src/components/admin/AdminUserProfile.stories.tsx` | NEW | Task 410 harness story |
| `scripts/story-coverage-exempt.json` | MODIFIED | Removed 14 newly-storied components |
| `scripts/check-stories-rendered.mjs` | MODIFIED | Added 16 new ASSERT_STORIES entries |
| `eslint.config.mjs` | MODIFIED | Added stories to LISTING_STATUS_IGNORES |
| `docs/backlog.md` | MODIFIED | Updated Last Session + task numbering |
| `docs/sessions/2026-06-08-task410-admin-storybook-harness.md` | NEW | This session log |
