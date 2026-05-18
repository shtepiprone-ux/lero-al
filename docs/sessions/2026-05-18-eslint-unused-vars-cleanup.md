# Session Archive: Post-Governance Debt Burn-down Sprint — Task 66: Unused Vars Cleanup — 2026-05-18

## Task Summary

Task 66 removes `@typescript-eslint/no-unused-vars` warnings from `src/` in a controlled,
reviewed batch. No production behavior was changed. No broad autofix was applied.
Each file was read and analyzed before modification.

---

## Files Changed (20 source files)

| File | Change |
|---|---|
| `src/app/admin/page.tsx` | Removed unused `Badge` import |
| `src/app/admin/support/page.tsx` | Removed unused `Link` import |
| `src/components/admin/AdminExchangeProvidersManager.tsx` | Removed unused `RelativeTime` import |
| `src/components/admin/AdminShell.tsx` | Removed `locale` from destructuring (kept in type) |
| `src/components/layout/Header.tsx` | Removed `loading` from `useUser()` destructuring |
| `src/components/shared/FiltersPanel.tsx` | Removed unused `PROPERTY_TYPES` import; removed `visibleSections` from destructuring |
| `src/components/shared/useHomepageFilters.ts` | Removed unused `FILTER_SECTION_PARAMS` import |
| `src/components/ui/dialog.stories.tsx` | Removed unused `useState` import |
| `src/components/ui/sheet.stories.tsx` | Removed unused `X` from lucide import |
| `src/lib/auth/__tests__/controller.test.ts` | Removed unused `AuthStatus` from type import |
| `src/modules/listings/components/FavoritesTypeFilter.tsx` | Removed unused `t = useTranslations('listing')` call |
| `src/modules/listings/components/ImageUpload.tsx` | Removed unused `Button` import |
| `src/modules/listings/components/ListingContact.tsx` | Removed unused `Badge` import |
| `src/modules/listings/components/ListingsFilters.tsx` | Removed unused `PROPERTY_TYPES` import; removed `getMulti` from destructuring |
| `src/modules/listings/components/ListingsPagination.tsx` | Removed unused `cn` import |
| `src/modules/listings/components/ListingsSortBar.tsx` | Removed unused `cn` import; removed unused `tc = useTranslations('common')` call |
| `src/modules/listings/components/SaveSearchButton.tsx` | Removed unused `useLocale`/`useRouter` imports and their call sites |
| `src/modules/listings/domain/propertyTypeSchema.ts` | Removed unused `FieldComponentType` from type import |
| `src/modules/listings/hooks/useListingsUrlFilters.ts` | Removed unused `type FilterSection` from import |
| `src/modules/listings/lib/queries.ts` | Removed unused `createServerClient` import and `ListingStatus` type |
| `src/modules/cabinet/components/ProfileTab.tsx` | Removed unused `interceptHref` from destructuring |
| `src/modules/notifications/components/NotificationItem.tsx` | Removed unused `typeKey` assignment |
| `docs/eslint-debt-taxonomy.md` | Category B marked partially resolved; current status updated |
| `docs/backlog.md` | Task 66 CLOSED; Task 67 queued; last session updated |
| `docs/sessions/2026-05-18-eslint-unused-vars-cleanup.md` | This session log |

No generated files were modified. No Storybook build output was changed.

---

## Commands Run

| Command | Result |
|---|---|
| `npm run lint` (before) | ⚠️ 0 errors, 44 warnings |
| `npm run lint` (after) | ⚠️ 0 errors, **17 warnings** |
| `npx eslint src/` | ✅ 0 errors confirmed |
| `npm run typecheck` | ✅ PASS |
| `npm run build` | ✅ PASS |
| `npm run governance` | ✅ PASS — no regressions |
| `npm run governance:tailwind` | ✅ PASS |
| `npm run governance:storybook` | ✅ PASS |
| `npm run governance:screenshots` | ✅ PASS |
| `npm run governance:components` | ✅ PASS |

**Task 66 introduced zero new lint violations.**

---

## Unused Vars Warnings Before / After

| | Before Task 66 | After Task 66 |
|---|---|---|
| `@typescript-eslint/no-unused-vars` | ~29 | **4** (all intentionally skipped) |
| Total warnings | 44 | **17** |
| Errors | 0 | 0 |

---

## Skipped Warnings (intentional)

| Warning | File | Reason |
|---|---|---|
| `CLOSED_LABEL` | `src/app/[locale]/listings/[slug]/page.tsx:273` | In-progress feature — display map for contact-disabled state on closed listings |
| `isFavoriteClosed` | `src/app/[locale]/listings/[slug]/page.tsx:277` | Same — supporting data for the same in-progress feature |
| `getCallerId` | `src/modules/admin/actions/index.ts:308` | Reserved utility in critical admin code boundary — skip pending future use |
| `_req` | `supabase/functions/saved-search-notify/index.ts:28` | Underscore-prefixed parameter — intentional unused param pattern in Edge Function |

---

## Remaining 17 Warnings by Category

| Category | Count | Notes |
|---|---|---|
| Unused `eslint-disable` directives | 8 | Old directives whose violations no longer fire — Task 67 (low risk) |
| `@typescript-eslint/no-unused-vars` | 4 | All intentionally skipped (see above) |
| `jsx-a11y` | 2 | Accessibility warnings in Combobox components — Task 68+ |
| `react-hooks/exhaustive-deps` | 1 | `useFavoritesRealtime.ts` — requires realtime behavior testing |
| `@next/next/no-img-element` | 1 | `AppImage.tsx` — intentional exception (canonical image component) |
| `@typescript-eslint/no-unused-vars` (`_req`) | 1 | Supabase Edge Function parameter — intentional underscore pattern |

---

## Future Technical Debt

| Item | Priority | Task | Notes |
|---|---|---|---|
| Unused eslint-disable directives | LOW | Task 67 | 8 instances — simple removal |
| `react-hooks/exhaustive-deps` | MEDIUM–HIGH | Task 68+ | 1 instance in useFavoritesRealtime — requires testing |
| jsx-a11y accessibility | MEDIUM | Task 69+ | Combobox ARIA attributes |
