# ESLint Debt Taxonomy & Burn-down Plan

## Current Lint Status

`npm run lint` reports **0 errors, 44 warnings** as of Task 65.

**History:**
- Before Task 65: `npm run lint` failed due to 163 pre-existing errors / 11,004 warnings.
- Task 65: added `storybook-static/**` to `globalIgnores`. Result: 0 errors, 44 warnings.
- Task 66: removed 27 `@typescript-eslint/no-unused-vars` warnings across 20 source files.
- After Task 66: 0 errors, **17 warnings**.

No session has introduced new violations:
- Future Maintenance Direction Epic (Tasks 58–63): zero new violations.
- Post-Governance Debt Burn-down Sprint Tasks 64–66: zero new violations.

---

## Root Cause Analysis

All 163 errors originate from a **single root cause**: `storybook-static/` is not in the
`globalIgnores` list in `eslint.config.mjs`. ESLint scans the Storybook static build output
(minified/bundled JS), which triggers false positives because:

- Minified function names (`_e`, `qt`, `le`, `be`, etc.) are not PascalCase → triggers
  `react-hooks/rules-of-hooks` (component/hook naming rule).
- Bundled third-party code uses old-style `var self = this` → triggers
  `@typescript-eslint/no-this-alias`.
- Bundled code contains deprecated React APIs (`findDOMNode`) → triggers
  `react/no-find-dom-node`.
- Bundled storybook runtime has a regexp ESLint plugin rule that is not installed in this
  project → triggers `regexp/*` "rule not found" errors.

**Verified fact:** Running `npx eslint src/ --max-warnings=99999` produces **0 errors**.
All 163 errors exist exclusively in `storybook-static/` files.

---

## Error Count by Rule (163 total)

| Rule | Count | Source | Origin |
|---|---|---|---|
| `react-hooks/rules-of-hooks` | 82 | `storybook-static/**` | Minified React code — short function names not PascalCase |
| `@typescript-eslint/no-this-alias` | 71 | `storybook-static/**` | Bundled dependencies using `var self = this` |
| `react/no-find-dom-node` | 4 | `storybook-static/**` | Third-party library using deprecated `findDOMNode` |
| `@typescript-eslint/no-array-constructor` | 2 | `storybook-static/**` | Bundled code using `new Array()` |
| `@typescript-eslint/ban-ts-comment` | 2 | `storybook-static/**` | `@ts-ignore` in bundled storybook code |
| `regexp/strict` | 1 | `storybook-static/**` | Missing plugin — not installed in this project |
| `regexp/no-dupe-characters-character-class` | 1 | `storybook-static/**` | Missing plugin — not installed in this project |
| **TOTAL** | **163** | | |

---

## File / Module Hotspots

### storybook-static/ (all 163 errors)

All errors originate in these files (minified build artifacts — not source code):

| Area | Files |
|---|---|
| Storybook assets | `storybook-static/assets/*.js` (~47 files) |
| Storybook addons | `storybook-static/sb-addons/**/*.js` (~9 files) |
| Storybook manager | `storybook-static/sb-manager/*.js` (~4 files) |

### src/ (0 errors, warnings only)

Source files have no errors. Pre-existing warnings (not addressed in this task):

| File | Warning | Rule |
|---|---|---|
| Multiple `src/**` files | Unused variables / unused imports | `@typescript-eslint/no-unused-vars` |
| `src/modules/listings/hooks/useFavoritesRealtime.ts:133` | Missing `displayedIdsRef` in deps array | `react-hooks/exhaustive-deps` |
| `src/modules/listings/components/SimilarListings.tsx:82` | Unused eslint-disable directive | `--report-unused-disable-directives` |

---

## Risk Level per Category

### CATEGORY A — storybook-static/ not excluded ✅ RESOLVED (Task 65)
**Risk: LOW** — **Fixed in Task 65**

`storybook-static/**` added to `globalIgnores` in `eslint.config.mjs`. Result: −163 errors.
- No source code changes.
- No UI/behavior impact.
- Does not affect `npm run build`, `npm run typecheck`, or production runtime.

### CATEGORY B — @typescript-eslint/no-unused-vars in src/ — ✅ PARTIALLY RESOLVED (Task 66)
**Risk: MEDIUM**

Task 66 removed 27 unused-vars warnings across 20 source files (pure import removals and confirmed-safe destructuring fixes). Remaining 4 no-unused-vars warnings are intentionally skipped:
- `CLOSED_LABEL`, `isFavoriteClosed` — in-progress feature data in listing slug page
- `getCallerId` — reserved utility function in admin actions (critical code boundary)
- `_req` — underscore-prefixed parameter in Supabase Edge Function (intentional pattern)

### CATEGORY C — react-hooks/exhaustive-deps in src/
**Risk: MEDIUM–HIGH**

Missing hook dependencies are a logic bug risk:
- Adding a missing dep may cause infinite re-renders.
- Removing the dep array annotation must be verified against hook semantics.
- File: `src/modules/listings/hooks/useFavoritesRealtime.ts:133`
- Must test realtime behavior after any change.

### CATEGORY D — @ts-ignore → @ts-expect-error
**Risk: LOW (in bundled code, do not touch)**

The 2 `@typescript-eslint/ban-ts-comment` errors are in `storybook-static/` bundled code.
These disappear automatically once Category A is fixed.
Do not attempt to fix `@ts-ignore` in bundled files.

---

## Recommended Fix Order

| Order | Batch | Category | Risk | Expected impact |
|---|---|---|---|---|
| 1 | ~~Add `storybook-static/**` to `globalIgnores`~~ | A | LOW | ✅ Done (Task 65) — −163 errors |
| 2 | ~~Remove unused imports in `src/**`~~ | B | MEDIUM | ✅ Done (Task 66) — −27 warnings |
| 3 | Review `react-hooks/exhaustive-deps` violations case by case | C | MEDIUM–HIGH | One instance currently |

---

## Do Not Fix Yet

| Item | Reason |
|---|---|
| `react-hooks/rules-of-hooks` in `storybook-static/` | These are false positives from minified code — fix by ignoring the directory, not by touching the files |
| `@typescript-eslint/no-this-alias` in `storybook-static/` | Same — ignore the directory |
| `react/no-find-dom-node` in `storybook-static/` | Third-party library code — do not modify |
| Any broad `--fix` pass across the entire repo | Too noisy until storybook-static is excluded |
| `react-hooks/exhaustive-deps` (useFavoritesRealtime) | Requires realtime behavior testing before touching |

---

## Proposed Batch Strategy

### Batch 1 — `storybook-static/**` ignore ✅ DONE (Task 65)
**Scope:** 1 line in `eslint.config.mjs`
**Expected result:** 163 → 0 errors (all errors eliminated)
**Validation checklist:**
- [ ] `npm run lint` error count drops from 163 to 0
- [ ] `npm run typecheck` still passes
- [ ] `npm run build` still passes
- [ ] `npm run governance` still passes
- [ ] `npm run governance:tailwind` still passes
- [ ] `npm run governance:storybook` still passes
- [ ] `npm run governance:screenshots` still passes
- [ ] `npm run governance:components` still passes
- [ ] No production behavior changes (ignore rules only)
- [ ] No UI changes — locale review not required for this batch

### Batch 2 — Unused imports / variables in src/ (Task 66+)
**Scope:** ~15 source files, imports only
**Expected result:** Meaningful warning reduction
**Validation checklist for each file:**
- [ ] TypeScript still compiles without errors
- [ ] Build passes
- [ ] Component renders correctly at sq/en/uk/it
- [ ] Component renders correctly at 320px, 375px, 768px, 1280px, 1440px, 1920px, 2560px
- [ ] No runtime errors visible in browser console
- [ ] Governance passes

### Batch 3 — react-hooks/exhaustive-deps case-by-case (Task 67+)
**Scope:** Individual hooks, one at a time
**Expected result:** Corrects potential stale-closure bugs
**Validation checklist for each hook:**
- [ ] No infinite re-render loops
- [ ] Realtime/subscription behavior verified in browser
- [ ] TypeScript compiles
- [ ] Build passes
- [ ] Affected component tested at sq/en/uk/it locales
- [ ] Governance passes

---

## Validation Checklist (reusable for all future lint burn-down batches)

Before closing any lint burn-down task:

- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] `npm run governance` passes (or only pre-documented baselines fail)
- [ ] `npm run governance:tailwind` passes
- [ ] `npm run governance:storybook` passes
- [ ] `npm run governance:screenshots` passes
- [ ] `npm run governance:components` passes
- [ ] `npm run lint` — error count documented (not required to be zero until all batches complete)
- [ ] Zero new lint violations introduced by this task (verified by comparing error lines)
- [ ] No production behavior changes

---

## Locale & Breakpoint Reminder

For any future lint burn-down batch that touches **UI-facing source files**, verify all 4 locales:
- **sq** (Albanian — primary market)
- **en** (English)
- **uk** (Ukrainian — long strings, stress-test layout)
- **it** (Italian)

And verify all responsive breakpoints:
- **Mobile:** 320, 360, 375, 390, 412, 480px
- **Tablet:** 640, 768px
- **Desktop:** 1024, 1280, 1440px
- **Huge desktop:** 1720, 1920, 2560px, 3440px (ultrawide)

Pure infrastructure changes (ESLint config, `globalIgnores`, unused import removal in non-UI files) do not require breakpoint/locale validation.

---

## Analysis Script

A helper script is available at `scripts/analyze-eslint-debt.mjs`.

**Usage:**
```bash
node scripts/analyze-eslint-debt.mjs
```

The script:
- Runs `npm run lint` and captures output
- Groups errors by rule name
- Reports file-level error distribution (source vs. storybook-static)
- Is read-only (does not modify any files)
- Is deterministic and CI-safe

Do not add it to `npm run governance` yet — use it manually for planning purposes.
