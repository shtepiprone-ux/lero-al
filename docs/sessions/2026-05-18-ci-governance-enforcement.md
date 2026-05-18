# Session Archive: Future Maintenance Direction Epic — Phase 2: CI Governance & Lint Enforcement — 2026-05-18

## Implementation Summary

Task 59 established automated governance enforcement for the Lero.al project. This phase created governance validation scripts, ESLint rules, GitHub Actions CI workflows, and a baseline system. No UI changes, no code refactors, no responsive behavior changes.

---

## Governance Rules Summary

### ESLint Rules Added (`eslint.config.mjs`)
Two new config blocks added at the end of the ESLint flat config:

1. **UI Primitive Governance block:**
   - `no-restricted-imports` — Blocks non-lucide icon libraries (@heroicons, react-icons, phosphor-react, feather-icons)
   - `no-restricted-syntax` (AST) — Blocks `window.location.href = ...` assignments and `.replace()`/`.assign()` calls only. Read-only accesses (`.origin`, `.pathname`, `.href` as value) are NOT blocked.

2. **SSR/Hydration Governance block:**
   - `no-restricted-syntax` (JSX) — Blocks `suppressHydrationWarning` attribute on any JSX element (exception: app/layout.tsx for next-themes)

### Governance Scripts Created (`scripts/governance/`)

| Script | Scope | Findings (baseline) |
|---|---|---|
| `scan-primitives.mjs` | Raw buttons, custom overlays, icon imports, navigation violations, missing 2xl: | H:52 M:8 |
| `scan-ssr.mjs` | suppressHydrationWarning, typeof window in components, useLayoutEffect, ssr:false | All clean (C:0 H:0) |
| `scan-responsive.mjs` | Viewport hooks, arbitrary breakpoints, missing 2xl:, z-index overrides | H:0 M:15 |
| `scan-tailwind.mjs` | Non-canonical py-*, hardcoded colors, arbitrary font sizes | H:0 M:14 L:42 |
| `scan-localization.mjs` | Missing locale files, key count parity, hardcoded widths | H:0 M:18 (locale keys: sq=en=uk=it=852) |
| `governance.mjs` | Main runner: executes all scans, compares vs baseline, reports | — |
| `baseline.json` | Snapshot of pre-governance violation counts | Established 2026-05-18 |

### Governance Commands (`package.json`)

```bash
npm run governance                    # Full scan, baseline comparison (CI gate)
npm run governance:primitives         # Primitive violations only
npm run governance:responsive         # Responsive violations only
npm run governance:tailwind           # Tailwind entropy only
npm run governance:localization       # Localization violations only
npm run governance:ssr                # SSR/hydration violations only
npm run governance:report             # Full scan + write weekly report to docs/governance-reports/weekly/
npm run governance:update-baseline    # Update baseline.json to current state (after fixing violations)
```

---

## CI Workflow Summary

### `.github/workflows/governance-pr.yml`
**Trigger:** Every PR to `main` that touches `src/**`, `scripts/governance/**`, `eslint.config.mjs`, `package.json`, `messages/**`
**Steps:**
1. TypeScript check (`tsc --noEmit`)
2. ESLint (with governance rules)
3. Primitive governance scan
4. SSR/Hydration governance scan
5. Responsive governance scan
6. Tailwind entropy scan
7. Localization governance scan
8. Full governance summary

**Blocking behavior:** Fails CI if any scan category has MORE violations than baseline (prevents new governance regressions).

### `.github/workflows/governance-scheduled.yml`
**Trigger:** Weekly, every Monday at 09:00 UTC (+ manual `workflow_dispatch`)
**Steps:**
1. Full governance scan with `--report` flag
2. Commits generated report to `docs/governance-reports/weekly/weekly-YYYY-MM-DD.md`
3. Posts summary to GitHub Actions workflow summary
4. Fails if violations found

---

## Enforcement Matrix Summary

### Baseline Architecture
The governance system uses a baseline comparison approach:
- `scripts/governance/baseline.json` stores violation counts at governance-establishment time
- CI fails ONLY if a category's violation count INCREASES above the baseline
- This prevents new governance regressions without blocking CI on pre-existing technical debt
- When violations are fixed: run `npm run governance:update-baseline` to lower the baseline

### What blocks CI (new violations above baseline)
- Any new CRITICAL violation (e.g., new suppressHydrationWarning)
- Any new HIGH violation (e.g., new raw button, new custom overlay, new viewport JS)
- ESLint errors: non-lucide imports, window.location usage, suppressHydrationWarning JSX attr

### What is reported but doesn't block CI (at baseline)
- 52 existing raw button / custom overlay HIGH findings (pre-governance debt)
- 15 existing responsive MEDIUM findings
- 14 existing Tailwind entropy MEDIUM findings
- 18 existing localization MEDIUM findings

---

## Drift Detection Summary

Governance detects drift by:
1. **Baseline regression tracking**: any increase in violation count = CI failure
2. **ESLint hard rules**: icon library imports and window.location = error-level ESLint (always blocks)
3. **suppressHydrationWarning**: ESLint AST rule blocks this in all files except layout.tsx
4. **Weekly scheduled scans**: auto-generates governance reports to docs/governance-reports/weekly/

---

## Files Created / Modified

| File | Action |
|---|---|
| `scripts/governance/scan-primitives.mjs` | Created |
| `scripts/governance/scan-ssr.mjs` | Created |
| `scripts/governance/scan-responsive.mjs` | Created |
| `scripts/governance/scan-tailwind.mjs` | Created |
| `scripts/governance/scan-localization.mjs` | Created |
| `scripts/governance/governance.mjs` | Created |
| `scripts/governance/baseline.json` | Created |
| `.github/workflows/governance-pr.yml` | Created |
| `.github/workflows/governance-scheduled.yml` | Created |
| `eslint.config.mjs` | Updated — added UI Primitive + SSR/Hydration governance blocks |
| `package.json` | Updated — added 8 governance npm scripts |
| `docs/governance-enforcement.md` | Updated — added §9 CI Governance Matrices |
| `docs/backlog.md` | Updated |

---

## Validation Checklist

- [x] Automated governance enforcement established
- [x] Governance CI workflows established (`governance-pr.yml`)
- [x] Primitive governance linting established (scan-primitives.mjs + ESLint)
- [x] Responsive governance linting established (scan-responsive.mjs)
- [x] Tailwind governance linting established (scan-tailwind.mjs)
- [x] Localization governance linting established (scan-localization.mjs)
- [x] SSR/hydration governance linting established (scan-ssr.mjs + ESLint)
- [x] Governance commands established (`npm run governance:*`)
- [x] Governance reports structure established (docs/governance-reports/)
- [x] Weekly governance scans established (governance-scheduled.yml)
- [x] Governance severity matrix established (baseline.json + regression tracking)
- [x] Drift detection established (baseline comparison system)
- [x] No UI redesign performed
- [x] No responsive behavior changed
- [x] No business logic changed
- [x] No domain logic changed
- [x] No SSR behavior changed
- [x] No hydration behavior changed
- [x] No runtime governance systems introduced
- [x] No flaky CI introduced (deterministic regex-based scanning)
- [x] Localization safety preserved (locale key parity: sq=en=uk=it=852 keys)
- [x] Accessibility safety preserved
- [x] Responsive safety preserved
- [x] Huge-desktop safety preserved
- [x] Build remains clean (no code changes)
- [x] ESLint remains clean (governance rules added but don't break existing code)
- [x] TypeScript remains clean

---

## Future Phase Readiness

**Phase 3 (Task 60: Tailwind Utility Entropy Detection & Governance Hardening) is now unblocked:**
- Baseline Tailwind entropy established: 100 arbitrary values, 14 MEDIUM findings
- Governance scripts in place for entropy tracking
- CI infrastructure ready for entropy enforcement
- `npm run governance:tailwind` provides detailed entropy data

---

## Confirmation

This phase:
- Introduced automation only — no UI refactors performed
- No responsive behavior changed
- No business logic changed
- No domain logic changed
- Automated governance enforcement is now active
- CI governance enforcement is now active (PR workflow + scheduled)
- Localization governance is now enforced automatically (locale file parity, key counts)
- Responsive governance is now enforced automatically (scan-responsive.mjs)
- Huge-desktop governance is now enforced automatically (2xl: step detection in scan-primitives)
- Future governance phases are now unblocked
- All locales continue to be validated (sq/en/uk/it key parity verified)
- All breakpoints continue to be validated (responsive scan covers all canonical breakpoints)
- SSR/hydration governance remains protected (ESLint suppressHydrationWarning rule + scan-ssr.mjs)
