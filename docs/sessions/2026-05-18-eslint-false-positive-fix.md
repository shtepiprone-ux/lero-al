# Session Archive: Post-Governance Debt Burn-down Sprint — Task 65: ESLint False-Positive Fix — 2026-05-18

## Task Summary

Task 65 eliminates all 163 pre-existing ESLint errors by excluding `storybook-static/**`
from ESLint's `globalIgnores`. This is a config-only change — no source files modified,
no UI behavior changed, no warnings touched, no lint autofix applied.

---

## Files Changed

| File | Change |
|---|---|
| `eslint.config.mjs` | Added `"storybook-static/**"` to `globalIgnores` |
| `docs/eslint-debt-taxonomy.md` | Category A marked resolved; current lint status updated |
| `docs/backlog.md` | Task 65 CLOSED; last session updated; Task 66 queued |
| `docs/sessions/2026-05-18-eslint-false-positive-fix.md` | This session log |

No production source files were changed.

---

## Change Details

`eslint.config.mjs` — `globalIgnores` array:

```diff
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
+   "storybook-static/**",
  ]),
```

---

## Commands Run

| Command | Result |
|---|---|
| `npm run lint` | ✅ 0 errors, 44 warnings (was: 163 errors, 11,004 warnings) |
| `npx eslint src/ --max-warnings=99999` | ✅ 0 errors, 43 warnings |
| `npm run typecheck` | ✅ PASS |
| `npm run build` | ✅ PASS |
| `npm run governance` | ✅ PASS — no regressions |
| `npm run governance:tailwind` | ✅ PASS |
| `npm run governance:storybook` | ✅ PASS |
| `npm run governance:screenshots` | ✅ PASS |
| `npm run governance:components` | ✅ PASS |

---

## Lint Before / After

| Metric | Before Task 65 | After Task 65 |
|---|---|---|
| Errors | 163 | **0** |
| Warnings | 11,004 | **44** |
| Error source | `storybook-static/**` false positives | — |
| Remaining warnings | — | Genuine source warnings in `src/` |

**Task 65 introduced zero new lint violations.**

---

## Remaining 44 Warnings (genuine source debt)

All remaining warnings are in actual source files. Representative categories:

| Rule | Typical location | Count |
|---|---|---|
| `@typescript-eslint/no-unused-vars` | Unused imports/variables in `src/**` | ~35 |
| `react-hooks/exhaustive-deps` | Missing hook deps (`useFavoritesRealtime.ts`) | ~1 |
| Unused eslint-disable directives | `SimilarListings.tsx`, `AppImage.tsx` | ~3 |
| Other | `supabase/functions/**` | ~5 |

These are pre-existing. Task 65 did not introduce any of them.

---

## Future Technical Debt

| Item | Priority | Notes |
|---|---|---|
| Unused imports/variables cleanup | MEDIUM | ~15 src files — Task 66 |
| `react-hooks/exhaustive-deps` | MEDIUM–HIGH | 1 instance — `useFavoritesRealtime.ts` — Task 67+ |
| Unused eslint-disable directives | LOW | 3 instances — can clean up with warnings batch |
