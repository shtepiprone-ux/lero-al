# Session Archive: Post-Governance Debt Burn-down Sprint — Task 64: ESLint Debt Taxonomy — 2026-05-18

## Task Summary

Task 64 establishes the ESLint debt taxonomy and burn-down plan for Lero.al.
This is the opening task of the Post-Governance Debt Burn-down Sprint.
No production code was modified. No ESLint auto-fixes were applied. No warnings were touched.

---

## Files Created

| File | Purpose |
|---|---|
| `docs/eslint-debt-taxonomy.md` | ESLint debt taxonomy, root cause analysis, risk classification, fix order, batch strategy, validation checklists |
| `docs/sessions/2026-05-18-eslint-debt-taxonomy.md` | This session log |
| `scripts/analyze-eslint-debt.mjs` | Read-only helper script — groups lint output by rule and origin |

## Files Modified

| File | Change |
|---|---|
| `docs/backlog.md` | Added Post-Governance Debt Burn-down Sprint section; Task 64 CLOSED |

---

## Commands Run

| Command | Result |
|---|---|
| `npm run lint` | ⚠️ FAIL (expected) — `npm run lint` currently fails due to 163 pre-existing errors / 11,004 warnings |
| `npx next lint --dir src` | ✅ PASS — 0 errors in `src/` (warnings only) |
| `npx eslint src/ --max-warnings=99999` | ✅ 0 errors confirmed |
| `npm run typecheck` | ✅ PASS |
| `npm run build` | ✅ PASS |
| `npm run governance` | ✅ PASS — no regressions |
| `npm run governance:tailwind` | ✅ PASS |
| `npm run governance:storybook` | ✅ PASS |
| `npm run governance:screenshots` | ✅ PASS (Chromium not installed — check-only passes) |
| `npm run governance:components` | ✅ PASS |

**Lint note:** `npm run lint` fails due to pre-existing global lint debt. This is expected.
Task 64 introduced zero new lint violations.

---

## Key Finding

**All 163 ESLint errors are false positives from `storybook-static/` not being excluded.**

The `eslint.config.mjs` `globalIgnores` list covers `.next/**`, `out/**`, `build/**`, and
`scripts/**` — but NOT `storybook-static/**`. When `npm run build-storybook` produces
minified JS in `storybook-static/assets/`, ESLint scans these bundled files and reports:
- `react-hooks/rules-of-hooks` (82) — minified function names are not PascalCase
- `@typescript-eslint/no-this-alias` (71) — old-style `var self = this` in bundles
- `react/no-find-dom-node` (4) — third-party library code
- other minor rules (6)

Running `npx eslint src/ --max-warnings=99999` confirms: **0 errors in actual source code**.

---

## Error Breakdown (163 errors)

| Rule | Count | Origin |
|---|---|---|
| `react-hooks/rules-of-hooks` | 82 | `storybook-static/**` (minified React) |
| `@typescript-eslint/no-this-alias` | 71 | `storybook-static/**` (bundled deps) |
| `react/no-find-dom-node` | 4 | `storybook-static/**` (third-party library) |
| `@typescript-eslint/no-array-constructor` | 2 | `storybook-static/**` |
| `@typescript-eslint/ban-ts-comment` | 2 | `storybook-static/**` |
| `regexp/strict` | 1 | `storybook-static/**` (missing plugin) |
| `regexp/no-dupe-characters-character-class` | 1 | `storybook-static/**` (missing plugin) |
| **Total** | **163** | **All in storybook-static/** |

---

## Recommended Burn-down Batches

| Batch | Task | Scope | Risk | Impact |
|---|---|---|---|---|
| 1 | Task 65 | Add `storybook-static/**` to `globalIgnores` | LOW | −163 errors |
| 2 | Task 66+ | Remove unused imports in `src/**` | MEDIUM | Warning reduction |
| 3 | Task 67+ | `react-hooks/exhaustive-deps` case-by-case | MEDIUM–HIGH | Logic bug fixes |

---

## Future Technical Debt

| Item | Priority | Notes |
|---|---|---|
| Add `storybook-static/**` to `globalIgnores` | HIGH (easy win) | 1-line fix — eliminates all 163 errors |
| Unused imports cleanup | MEDIUM | ~15 src files |
| `react-hooks/exhaustive-deps` audit | MEDIUM | 1 instance now, may grow |
