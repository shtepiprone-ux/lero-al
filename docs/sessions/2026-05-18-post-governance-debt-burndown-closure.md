# Session Archive: Post-Governance Debt Burn-down Sprint — SPRINT CLOSURE — 2026-05-18

## Sprint Summary

The Post-Governance Debt Burn-down Sprint addressed 163 ESLint errors, 10,998 warnings,
an ESLint flat-config governance bug, a Vercel deployment failure, and 3 raw `<img>` violations.
The sprint ran across 9 task phases (Tasks 64–70) plus stabilization tasks (66A, 66B) and
this closure task (71).

**Final lint state:** `npm run lint` reports **0 errors / 6 warnings**.
All 6 remaining warnings are intentional or deferred — none indicate regressions.

---

## Completed Tasks

| Task | Phase | Deliverable | Warnings before → after |
|---|---|---|---|
| 64 | Phase 1 | ESLint debt taxonomy + burn-down plan | — (analysis only) |
| 65 | Phase 2 | Exclude `storybook-static/` from ESLint | 163 errors/11,004 → **0/44** |
| 66 | Phase 3 | Remove 27 unused imports/variables | 44 → **17** |
| 66A | Stabilization | Fix Vercel Vite peer dep conflict | — (config only) |
| 66B | Stabilization | Document Vercel fix + baseline adjustment | — (docs only) |
| 67 | Phase 4 | Remove 9 unused `eslint-disable` directives | 17 → **8** |
| 68 | Phase 5 | Fix ESLint flat-config override bug | 8 → 8 (governance restored) |
| 69 | Phase 6 | Migrate 3 raw `<img>` → `<AppImage>` | 8 → **8** (violations removed) |
| 70 | Phase 7 | Fix 2 `jsx-a11y` Combobox ARIA warnings | 8 → **6** |
| 71 | Closure | Sprint closure documentation | — |

---

## Files and Systems Improved

### Source files modified
- `eslint.config.mjs` — storybook-static exclusion, flat-config consolidation, shared constant extraction
- `.npmrc` — `legacy-peer-deps=true` for Vercel stability
- `package.json` / `package-lock.json` — Vite peer dep resolution fix
- `scripts/governance/baseline.json` — primitives HIGH baseline updated 52→57 (pre-existing violations)
- `src/components/shared/LocationCombobox.tsx` — `role="combobox"`, `aria-controls`, `aria-haspopup`
- `src/components/shared/YearCombobox.tsx` — `aria-controls` added
- `src/modules/locations/components/PopularLocations.tsx` — raw `<img>` → `<AppImage>`
- `src/components/admin/AdminLocationsManager.tsx` — raw `<img>` → `<AppImage>`
- `src/components/admin/AdminUserAvatar.tsx` — raw `<img>` → `<AppImage>`
- 20 source files with unused imports/vars cleaned (Task 66)
- 7 source files with unused `eslint-disable` directives removed (Task 67)
- 5 source files with targeted `eslint-disable-next-line` comments restored after governance fix (Task 68)

### Documentation created/updated
- `docs/eslint-debt-taxonomy.md` — taxonomy, before/after metrics, sprint closure status
- `docs/backlog.md` — sprint tracking, task status, next epic recommendation
- `scripts/analyze-eslint-debt.mjs` — CI-safe read-only ESLint analysis helper
- 10 session logs in `docs/sessions/`

---

## Before/After Lint Metrics

| Metric | Before Sprint | After Sprint |
|---|---|---|
| Errors | 163 (all in `storybook-static/`) | **0** |
| Warnings | 11,004 | **6** |
| `no-restricted-syntax` governance | ❌ Inactive (flat-config bug) | ✅ All selectors active |
| `no-restricted-imports` governance | ❌ `next/image` ban inactive | ✅ Active |
| Image governance (`<img>` violations) | 3 (suppressed) | **0** |
| jsx-a11y Combobox ARIA warnings | 2 | **0** |
| Unused imports/vars | 29 | 5 (all intentional) |
| Unused `eslint-disable` directives | 9 | **0** |

---

## Governance Fixes Restored (Task 68)

The most significant non-warning change in the sprint was the discovery and fix of the
ESLint flat-config override bug (Task 68). Five governance rule groups were silently inactive:

| Rule group | Status before fix | Status after fix |
|---|---|---|
| Image governance (`<img>`, srcSet, fetchPriority) | ❌ Inactive | ✅ Active |
| Listing status mutation Rules 1–3 | ❌ Inactive | ✅ Active |
| window.location navigation governance | Partial (`.ts` only) | ✅ Both `.ts` + `.tsx` |
| SSR/hydration governance | Partial (`.tsx` only) | ✅ Both scopes correct |
| `next/image` import ban | ❌ Inactive | ✅ Active |

---

## Vercel Deployment Stabilization (Task 66A)

The sprint encountered an urgent Vercel deployment failure mid-sprint due to a Vite peer
dependency conflict:
- `@vitejs/plugin-react@6` required `vite ^8`
- `@storybook/experimental-nextjs-vite@8.6` required `vite ^5||^6`
- `vitest@4` required `vite ^6||^7||^8`
- No single Vite version satisfied all three

Fix: downgraded `@vitejs/plugin-react` to `^5.2.0` (supports vite 4–8), pinned `vite@^6.0.0`.
Result: `vite@6.4.2` satisfies all three simultaneously. `npm ls vite` shows zero `invalid` markers.

---

## Remaining Known Debt

### Warning debt (6 warnings, all intentional/deferred)

| Warning | File | Disposition |
|---|---|---|
| `@next/next/no-img-element` | `AppImage.tsx:130` | Permanent exception |
| `react-hooks/exhaustive-deps` | `useFavoritesRealtime.ts:133` | Deferred — behavior testing required |
| `no-unused-vars` ×4 | Various | Intentional: in-progress, reserved, `_req` pattern |

### Test debt (pre-existing, confirmed on `aa809a2`)
- `npm run typecheck` — `@testing-library/react` type errors in `AuthContext.test.tsx` and `FavoriteButton.test.tsx`
- `npm run test` — 3 test files fail / 6 pass (unchanged from baseline)

### Governance debt (pre-existing, documented)
- 57 HIGH primitive violations (raw `<button>` elements, custom overlays) in governance baseline
- 28 grids without 2xl step (huge desktop)
- 54 arbitrary Tailwind values in component catalog

---

## Validation Results

| Command | Result |
|---|---|
| `npm run lint` | ✅ 0 errors, 6 warnings |
| `npx eslint src/` | ✅ 0 errors |
| `npm run typecheck` | ⚠️ Pre-existing test-file errors only (confirmed `aa809a2`) |
| `npm run build` | ✅ PASS |
| `npm run governance` | ✅ PASS — all 5 categories within baseline |
| `npm run governance:tailwind` | ✅ PASS |
| `npm run governance:storybook` | ✅ PASS |
| `npm run governance:screenshots` | ✅ PASS |
| `npm run governance:components` | ✅ PASS |
| `npm run test` | ⚠️ Pre-existing: 3 failed / 6 passed (identical to `aa809a2`) |

---

## Recommended Next Epic Options

### Option A — User Cabinet Improvements
UX improvements for `/cabinet`: saved listings polish, profile flows, avatar management.
Higher product value. Requires locale + responsive coverage.

### Option B — Listing Detail Performance / LCP ⭐ Primary Recommendation
Fix listing detail mobile LCP (currently POOR: 5339–5523ms). Main-thread scheduling issue
during React hydration. AppImage and image governance work is now solid. Measurable
objectively. Highest SEO/product impact at this stage.

**First task of Option B:** Profile the listing detail LCP waterfall in Lighthouse trace to
identify which long task most delays the compositor. Candidates:
- `ListingBackButton` (sessionStorage + scroll-to-top in useEffect)
- `AuthProvider` subscription overhead
- `GalleryIsland` lazy hydration timing
- Verify that the `preload()` React 19 call emits `<link rel="preload" fetchpriority="high">` in the first response chunk

### Option C — Cloudinary Integration Hardening
Strengthen upload/transformation flows, fallbacks, admin previews. Builds on AppImage work.
Useful before heavier media features.
