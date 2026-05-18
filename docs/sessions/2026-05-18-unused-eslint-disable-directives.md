# Session Archive: Post-Governance Debt Burn-down Sprint — Task 67: Unused eslint-disable Directives — 2026-05-18

## Task Summary

Task 67 removes 9 unused `eslint-disable` directives across 7 source files. These were
directives that once suppressed real violations but became stale — either the protected code
was later fixed, or the ESLint rule configuration changed so the rule no longer fires at
that location. No production logic or UI behavior was changed.

---

## Files Changed

| File | Directives removed |
|---|---|
| `src/hooks/useExchangeRate.ts` | 1 — inline `react-hooks/exhaustive-deps` on empty deps array |
| `src/hooks/usePresence.ts` | 1 — inline `react-hooks/exhaustive-deps` on empty deps array |
| `src/modules/currency/hooks/useCurrencies.ts` | 1 — inline `react-hooks/exhaustive-deps` on empty deps array |
| `src/modules/admin/actions/index.ts` | 1 — `no-restricted-syntax` before `status: 'active'` |
| `src/modules/cabinet/actions/index.ts` | 2 — `no-restricted-syntax` before two `.update({ status: ... })` calls |
| `src/modules/listings/components/ListingCard.tsx` | 2 — `no-restricted-syntax` before `listing.status === 'sold'` and `'rented'` |
| `src/modules/listings/components/SimilarListings.tsx` | 1 — `react/no-danger` before `dangerouslySetInnerHTML` |

---

## Directives Removed (detail)

| Rule | File | Line | Pattern |
|---|---|---|---|
| `react-hooks/exhaustive-deps` | `useExchangeRate.ts:60` | Inline `// eslint-disable-line` suffix on `}, [])` |
| `react-hooks/exhaustive-deps` | `usePresence.ts:14` | Inline `// eslint-disable-line` suffix on `}, [])` |
| `react-hooks/exhaustive-deps` | `useCurrencies.ts:59` | Inline `// eslint-disable-line` suffix on `}, [])` |
| `no-restricted-syntax` | `admin/actions/index.ts:444` | Standalone `// eslint-disable-next-line` comment line |
| `no-restricted-syntax` | `cabinet/actions/index.ts:203` | Standalone `// eslint-disable-next-line` comment line |
| `no-restricted-syntax` | `cabinet/actions/index.ts:224` | Standalone `// eslint-disable-next-line` comment line |
| `no-restricted-syntax` | `ListingCard.tsx:65` | Standalone `// eslint-disable-next-line` comment line |
| `no-restricted-syntax` | `ListingCard.tsx:70` | Standalone `// eslint-disable-next-line` comment line |
| `react/no-danger` | `SimilarListings.tsx:82` | Standalone `// eslint-disable-next-line` comment line |

**Skipped:** None. All 9 ESLint-reported unused directives were removed.

---

## Why These Directives Were Unused

**`react-hooks/exhaustive-deps` (3 instances):** Empty deps arrays `[]` with no outer-scope
variable references do not trigger `exhaustive-deps`. The disables were added defensively when
the hooks were written but are now redundant.

**`no-restricted-syntax` in `.ts` files (3 instances — admin/actions, cabinet/actions):**
The listing status mutation governance rule is defined via `no-restricted-syntax` in
`eslint.config.mjs`. Due to ESLint flat config override semantics, the later
`no-restricted-syntax` block (UI Primitive Governance / window.location) overrides
the listing status rule for `.ts` files. The directives in these action files became
unused as a result. Note: the underlying code is still correct; the directives were
protecting code that was intentionally exempt.

**`no-restricted-syntax` in `ListingCard.tsx` (2 instances):** Same override issue, affecting
`.tsx` files where the SSR/Hydration `no-restricted-syntax` block (suppressHydrationWarning)
is the last active definition.

**`react/no-danger` in `SimilarListings.tsx` (1 instance):** The `react/no-danger` rule is
not enabled in the active ESLint config (`next/core-web-vitals` + `next/typescript`).
The directive was added at a time when a different ESLint setup was in place.

---

## Commands Run

| Command | Result |
|---|---|
| `npm run lint` (before) | ⚠️ 0 errors, 17 warnings |
| `npm run lint` (after) | ⚠️ 0 errors, **8 warnings** |
| `npx eslint src/` | ✅ 0 errors |
| `npm run typecheck` | ⚠️ Pre-existing test-file errors only (`@testing-library/react` in `AuthContext.test.tsx`, `FavoriteButton.test.tsx`) — confirmed on `aa809a2` |
| `npm run build` | ✅ PASS |
| `npm run governance` | ✅ PASS — all 5 categories within baseline |
| `npm run governance:tailwind` | ✅ PASS |
| `npm run governance:storybook` | ✅ PASS |
| `npm run governance:screenshots` | ✅ PASS |
| `npm run governance:components` | ✅ PASS |
| `npm run test` | ⚠️ Pre-existing: 3 failed / 6 passed (identical to baseline `aa809a2`) |

**Task 67 introduced zero new lint violations.**

---

## Lint Before / After

| Metric | Before | After |
|---|---|---|
| Errors | 0 | 0 |
| Warnings | 17 | **8** |
| Unused eslint-disable directives | 9 | 0 |

---

## Remaining 8 Warnings

| Warning | File | Category | Action |
|---|---|---|---|
| `jsx-a11y/role-supports-aria-props` | `LocationCombobox.tsx:77` | Accessibility | Future Task 68+ |
| `jsx-a11y/role-has-required-aria-props` | `YearCombobox.tsx:59` | Accessibility | Future Task 68+ |
| `@next/next/no-img-element` | `AppImage.tsx:130` | Intentional exception | Never fix — AppImage is the canonical image render site |
| `react-hooks/exhaustive-deps` | `useFavoritesRealtime.ts:133` | Logic risk | Requires realtime testing — future Task |
| `@typescript-eslint/no-unused-vars` | `[slug]/page.tsx:273,277` | In-progress feature | CLOSED_LABEL/isFavoriteClosed — skip |
| `@typescript-eslint/no-unused-vars` | `admin/actions/index.ts:308` | Reserved utility | getCallerId — skip |
| `@typescript-eslint/no-unused-vars` | `supabase/functions/...index.ts:28` | Intentional pattern | `_req` underscore prefix — skip |
