# Task 468 — Storybook story de-duplication + canonical scenario set + blocking gate

**Date:** 2026-06-22  
**Executor:** Sonnet 4.6  
**Precondition:** Task 463 functional code FROZEN + reviewed (commit `8ff5a0557`)

## Before / After

| Metric | Before | After |
|--------|--------|-------|
| Story exports | 283 | 237 (−46) |
| ASSERT_STORIES | 98 | 80 (−18) |
| Width-suffixed ASSERT IDs | 23 | 0 |
| Hardcoded locale pins | 16 | 0 |
| `checksRan` | 11 | 13 |
| Gate violations | 0 (Checks 1–11) | 0 (Checks 1–13) |
| Tests | 53 | 81 |

**ASSERT_STORIES count note:** The kickoff specified 94→76 (−18). The actual baseline was 98 (not 94) because Task 467 V3/V4 added 4 planted stories (AmbiguousOverlap, ContainerEscape, UnstyledFrame, IntentionalEllipsis) after the kickoff's count was locked on 2026-06-20. The delta (−18) is correct; the absolute count is 80, not 76.

## Group verdicts (three-way classification)

### Group 1 — ListingDetailView (14→3)
PURE_DUPLICATE: 11 width-suffixed + locale-pinned exports deleted. Kept: `PublicListing`, `StaffPreviewUnpublished`, `StaffPreviewPublished`.

### Group 2 — NotificationItem (5→3)
PURE_DUPLICATE: `AllCasesMobile320`, `AllCasesMobile375` — identical render + viewport pin only. Deleted.

### Group 3 — NumInputField (4→1)
PURE_DUPLICATE: `FloorsTotalMobile320/375/390` — identical render + width+locale pin. Deleted.

### Group 4 — AdminSupportManager (8→4)
PURE_DUPLICATE: `Tablet` (viewport pin), `UserCardStatusBadgesMobile320/375/390` (width+locale pin). Deleted.

### Group 5 — AdminListingsTable (7→6)
PURE_DUPLICATE: `Tablet` (viewport pin). Deleted. REAL_MODE: `VisibilityMobile320` renamed → `Visibility` (distinct filter args).

### Group 6 — ListingsTab (2→1)
**Verdict: PURE_DUPLICATE.** `VisibilityMobile320` has no args override — identical render to `Default` at different viewport. Deleted.

### Group 7 — bare Tablet family (11 total, 8 unique files)
PURE_DUPLICATE: all `Tablet` exports across AdminCurrencies/Companies/ExchangeProviders/EmailTemplates/Settings/PropertyTypes/UserProfile/UsersTable. Deleted.

### Group 8 — AdminReportsManager (16→6)
PURE_DUPLICATE: 10 width-suffixed exports collapsed into 4 canonical scenarios. `Tablet` deleted. `meta.args.locale:'uk'` removed → toolbar-reactive via meta-level render: `render: (args, ctx) => <AdminReportsManager {...args} locale={ctx.globals.locale ?? 'en'} />`. Kept: `Default`, `LocaleStress`, `DialogOwnerRow`, `FullManagement`, `TerminalReopen`, `DeleteConfirm`.

### Group 9 — AdminPermissionsManager (4→1)
PURE_DUPLICATE: `Mobile320/375/390` — identical render + width pin. Deleted. Kept: `Default`.

### Group 10 — non-numeric viewport-named exports
| Export | File | Verdict | Action |
|--------|------|---------|--------|
| ListingGrid/Desktop | ListingGrid.stories.tsx | RESPONSIVE_PROOF_DUPLICATE | Consolidated into `Default` (full responsive grid + all fixtures) |
| ListingGrid/HugeDesktop | ListingGrid.stories.tsx | RESPONSIVE_PROOF_DUPLICATE | Consolidated into `Default` |
| ListingGrid/Mobile | ListingGrid.stories.tsx | RESPONSIVE_PROOF_DUPLICATE | Consolidated into `Default` |
| RVS/HugeDesktop | RecentlyViewedSection.stories.tsx | RESPONSIVE_PROOF_DUPLICATE | Deleted (Populated covers) |
| AdminSidebar/Desktop | AdminSidebar.stories.tsx | REAL_MODE | Renamed → `CollapsedRail` |
| FilterBar/TabletStack | FilterBar.stories.tsx | RESPONSIVE_PROOF_DUPLICATE | Deleted |
| FilterBar/MobileStack | FilterBar.stories.tsx | RESPONSIVE_PROOF_DUPLICATE | Deleted |
| FilterBar/AllLocalesDesktop | FilterBar.stories.tsx | RESPONSIVE_PROOF_DUPLICATE | Deleted |
| button/ControlRowRhythm_Desktop | button.stories.tsx | REAL_MODE | Renamed → `ControlRowRhythm_Inline` |
| button/MobileSafe | button.stories.tsx | REAL_MODE | Renamed → `TouchSafe` |
| input/MobileForm | input.stories.tsx | REAL_MODE | Renamed → `PhoneForm` |
| EmptyState/MobileEmptyState | EmptyState.stories.tsx | RESPONSIVE_PROOF_DUPLICATE | Deleted |
| RVS/MobileScroll | RecentlyViewedSection.stories.tsx | REAL_MODE | KEEP (allowlisted) |
| tabs/MobileScroll | tabs.stories.tsx | REAL_MODE | KEEP (allowlisted) |

### Group 11 — ASSERT_STORIES rewrite
- LDV: 14→3 (delete 11 width IDs)
- AdminReportsManager: 9→5 (canonical scenario IDs: `--default`, `--dialog-owner-row`, `--full-management`, `--terminal-reopen`, `--delete-confirm`)
- AdminPermissionsManager: 4→1 (`--default`)
- ListingGrid: `system-listinggrid--desktop` → `system-listinggrid--default`

### Group 12 — Blocking gate
- **Check 3 broadened:** locale-NAME export families via identifier-token segmentation + file-scoped allowlist
- **Check 4 broadened:** all hardcoded locale literals (uk/sq/en/it) in object properties and JSX props; excludes function parameter defaults and fixture data files
- **Check 12 (NEW):** viewport/width-named exports via identifier-token vs `scripts/story-realmode-allowlist.json`
- **Check 13 (NEW):** duplicate-family exports (Proof/Demo/Filtered/Canonical) vs same allowlist
- `checksRan` → 13; stale-entry check added
- File discovery extended to `*.stories.ts`
- **ListingDetailView** made toolbar-reactive: removed `locale: 'en'` from meta.args, wrapper overrides locale with `useLocale()`

## Self-validation

| Gate | Result |
|------|--------|
| `tsc --noEmit` | 0 errors |
| `npm run lint` | 0 new errors (2 pre-existing in AdminReportsManager.tsx + visibility.test.ts) |
| `check:stories` | PASSED — 60 files, 0 violations, `checksRan: 13` |
| `check-stories.test.ts` | 81/81 green |
| `build-storybook` | ✅ success |
| ASSERT_STORIES ⊆ index.json | ✅ 80 IDs, 0 stale, 0 phantom |
| Scope | Only `*.stories.{ts,tsx}` + `scripts/` + `eslint.config.mjs` + `docs/` — no component className/logic change |
| `screenshots:assert` | NOT authoritative (deferred to Task 467 against this taxonomy) |

## Files Changed

| File | Rationale |
|------|-----------|
| `src/modules/listings/components/ListingDetailView.stories.tsx` | G1: delete 11 width+locale exports (14→3); toolbar-reactive locale fix |
| `src/modules/notifications/components/NotificationItem.stories.tsx` | G2: delete 2 mobile exports (5→3) |
| `src/modules/listings/components/form/NumInputField.stories.tsx` | G3: delete 3 width+locale exports (4→1) |
| `src/components/admin/AdminSupportManager.stories.tsx` | G4: delete Tablet+3 locale-pinned mobile (8→4) |
| `src/components/admin/AdminListingsTable.stories.tsx` | G5: delete Tablet, rename VisibilityMobile320→Visibility (7→6) |
| `src/modules/cabinet/components/ListingsTab.stories.tsx` | G6: delete PURE_DUPLICATE VisibilityMobile320 (2→1) |
| `src/components/admin/AdminCurrenciesManager.stories.tsx` | G7: delete Tablet |
| `src/components/admin/AdminCompaniesManager.stories.tsx` | G7: delete Tablet |
| `src/components/admin/AdminExchangeProvidersManager.stories.tsx` | G7: delete Tablet |
| `src/components/admin/AdminEmailTemplatesManager.stories.tsx` | G7: delete Tablet |
| `src/components/admin/AdminSettings.stories.tsx` | G7: delete Tablet |
| `src/components/admin/AdminPropertyTypesManager.stories.tsx` | G7: delete Tablet |
| `src/components/admin/AdminUserProfile.stories.tsx` | G7: delete Tablet |
| `src/components/admin/AdminUsersTable.stories.tsx` | G7: delete Tablet |
| `src/components/admin/AdminReportsManager.stories.tsx` | G8: collapse 16→6, remove locale:'uk' pin → toolbar-reactive |
| `src/components/admin/AdminPermissionsManager.stories.tsx` | G9: delete 3 width exports (4→1) |
| `src/stories/ListingGrid.stories.tsx` | G10: consolidate Desktop/HugeDesktop/Mobile → Default |
| `src/stories/RecentlyViewedSection.stories.tsx` | G10: delete HugeDesktop |
| `src/components/admin/AdminSidebar.stories.tsx` | G10: rename Desktop → CollapsedRail |
| `src/components/layout/FilterBar.stories.tsx` | G10: delete TabletStack/MobileStack/AllLocalesDesktop |
| `src/components/ui/button.stories.tsx` | G10: rename ControlRowRhythm_Desktop→_Inline, MobileSafe→TouchSafe |
| `src/components/ui/input.stories.tsx` | G10: rename MobileForm → PhoneForm |
| `src/stories/EmptyState.stories.tsx` | G10: delete MobileEmptyState |
| `scripts/check-stories-rendered.mjs` | G11: ASSERT_STORIES 98→80 |
| `scripts/check-stories.mjs` | G12: broaden Checks 3/4 + new Checks 12/13 + .stories.ts discovery |
| `scripts/story-realmode-allowlist.json` | NEW: file-scoped real-mode allowlist (18 entries) |
| `scripts/__tests__/check-stories.test.ts` | Tests for Checks 3/4/12/13 (53→81) |
| `eslint.config.mjs` | Story-block glob extended to `src/**/*.stories.ts` |
| `docs/storybook-governance.md` | §8b/§15.3: no locale pin on LocaleStress; new checks documented |
| `docs/sessions/2026-06-22-task468-storybook-story-dedup.md` | This session log |
