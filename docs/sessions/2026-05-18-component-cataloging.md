# Session Archive: Future Maintenance Direction Epic — Phase 6: Component Cataloging — 2026-05-18

## Task Summary

Task 63 establishes the permanent component cataloging system for Lero.al.
Built on top of Phases 1–5 of the Future Maintenance Direction Epic, Phase 6 creates
static analysis tooling, a full component inventory, a risk register, a coverage matrix,
and governance rules for future component work. This is the final phase of the epic.
No UI changes, no component rewrites, no production runtime changes.

---

## Files Created

| File | Purpose |
|---|---|
| `scripts/governance/component-catalog.mjs` | Static analysis script — scans src/, generates JSON + markdown catalog |
| `docs/component-catalog.md` | Human-readable component inventory by area |
| `docs/component-coverage-matrix.md` | Storybook/screenshot/locale/breakpoint coverage mapping |
| `docs/component-risk-register.md` | Risk register: violations, locale risk, huge-desktop risk, TW entropy |
| `docs/component-catalog-governance.md` | Permanent governance reference: classification model, rules, forbidden patterns |
| `docs/sessions/2026-05-18-component-cataloging.md` | This session log |

## Files Modified

| File | Change |
|---|---|
| `package.json` | Added `governance:components` and `catalog:components` scripts |
| `.gitignore` | Added `/scripts/governance/reports/*.json` and `*.md` patterns |
| `docs/component-governance.md` | Added §5 Cataloging System reference |
| `docs/governance-enforcement.md` | Added §9 Component Catalog Enforcement |
| `docs/governance-checklists.md` | Added Checklist I: Component Catalog Pre-Creation Gate |
| `docs/maintenance-playbook.md` | Added §13 Component Catalog Review Process |
| `docs/storybook-governance.md` | Added §11 Catalog Integration |
| `docs/responsive-screenshot-governance.md` | Added §14 Catalog Integration |
| `docs/ui-rules.md` | Added §14 Component Reuse Rules |
| `docs/ai-behavior.md` | Added Component Catalog Rules section |
| `docs/backlog.md` | Phase 6 closed, epic closure, session archive row added |

---

## Component Catalog Strategy

**Strategy: Node.js static analysis with regex-based pattern detection.**

The catalog script (`scripts/governance/component-catalog.mjs`) scans all `.tsx` files in:
- `src/app/` — route-level pages and layouts
- `src/components/` — UI primitives, shared, layout, admin shared
- `src/modules/` — feature components across all modules

Pattern detection (no AST parser — faster, deterministic):
- Component export detection (`function Foo()`, `const Foo =`, `export { Foo }`)
- `'use client'` boundary detection
- `useTranslations` (locale-awareness)
- Canonical primitive usage (Button, Input, Dialog, Sheet, Tabs)
- Anti-pattern detection (raw `<button>`, custom overlays, viewport JS, suppressHydrationWarning)
- Tailwind arbitrary value detection `[value]`
- Responsive class detection (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`)
- Colocated story detection

---

## Classification Model Summary

| Type | Count | Description |
|---|---|---|
| `canonical-primitive` | 31 | `src/components/ui/` — shadcn/base-ui primitives |
| `shared-ui` | 20 | `src/components/shared/` — reusable domain-agnostic |
| `layout` | 2 | `src/components/layout/` — Header, Footer/MobileBottomNav |
| `admin-shared` | 18 | `src/components/admin/` — admin panel components |
| `auth-feature` | 5 | Login/register forms and wrappers |
| `cabinet-feature` | 6 | User cabinet components |
| `listings-feature` | 49 | Listing cards, forms, gallery, shell, pagination, etc. |
| `locations-feature` | 1 | PopularLocations |
| `notifications-feature` | 5 | NotificationBell, Center, Item |
| `page` | 11 | Route-level page.tsx / layout.tsx / loading.tsx |
| `unknown` | 10 | Needs manual classification review |

**Total cataloged: 158 components**

---

## Component Inventory Summary

**Key inventory facts:**
- **31 canonical UI primitives** in `src/components/ui/`
- **20 shared components** in `src/components/shared/`
- **18 admin shared components** in `src/components/admin/`
- **49 listings feature components** — largest module
- **65 locale-aware components** using `useTranslations`
- **17 client components** with `'use client'` boundary

See `docs/component-catalog.md` for the full inventory by area.

---

## Storybook Coverage Summary

| Category | Total | With Story | Coverage % |
|---|---|---|---|
| Canonical primitives | 31 | 8 | 26% |
| System stories (src/stories/) | — | 4 | — |
| Shared components | 20 | 0 | 0% |
| Layout components | 2 | 0 | 0% |
| Admin shared | 18 | 0 | 0% |
| Feature components | ~67 | 0 | 0% |

**Storybook coverage gap:** Shared UI, layout, and admin shared components have no stories.
Priority queue documented in `docs/component-coverage-matrix.md §Coverage Gaps`.

---

## Responsive Screenshot Coverage Summary

Phase 5 screenshot targets cover 21 story variants across:
- 8 primitive stories + 4 system stories
- 6 viewports in fast-check matrix (320, 375, 768, 1280, 1440, 2560px)
- 4 locales (sq, en, uk, it)

Components with `HUGE_DESKTOP` risk (grids without 2xl step): 28
Components with `MOBILE` risk (locale-sensitive, mobile breakpoint concern): see risk register

---

## Locale Coverage Summary

- **65 components** use `useTranslations` — all locale-aware
- **All 4 locales** (sq/en/uk/it) served by Storybook global decorator
- **Ukrainian (uk) stress tests** in 8 explicit story variants
- `LOCALIZATION` risk flag applied to all 65 locale-aware components in risk register

---

## Breakpoint Coverage Summary

All 15 breakpoints documented in coverage matrix:
- Mobile: 320, 360, 375, 390, 412, 480px
- Tablet: 640, 768px
- Desktop: 1024, 1280, 1440px
- Huge: 1720, 1920, 2560px, 3440px ultrawide

**28 components** have grid layouts without `2xl:` step — documented as `HUGE_DESKTOP` risk.

---

## Huge Desktop Coverage Summary

Phase 6 explicitly documents huge desktop risk:
- `system-listinggrid--huge-desktop` story at 2560px
- `system-containers--container-wide` story at 2560px
- `docs/component-risk-register.md §Huge Desktop Risk` lists all 28 affected components
- Quarterly audit should resolve each item

---

## Tailwind Entropy Mapping Summary

- **54 components** with arbitrary Tailwind values detected (`[value]` pattern)
- These are pre-existing — none introduced in Phase 6
- All are documented in `docs/component-risk-register.md §Tailwind Entropy Risk`
- Allowlist management: `scripts/governance/tailwind-entropy.allowlist.json`

---

## Governance Integration Summary

| Command | Mode | CI-safe? |
|---|---|---|
| `npm run governance:components` | Config + infrastructure check | ✅ Yes (fast) |
| `npm run catalog:components` | Full scan + report generation | ✅ Yes (static analysis) |
| `npm run governance` | Unchanged — does NOT include catalog | ✅ Yes (fast) |

`governance:components` is NOT added to `npm run governance` — full catalog generation
is deferred to `catalog:components` to keep the fast governance gate lightweight.

---

## Validation Results

| Check | Result |
|---|---|
| `npm run lint` | ⚠️ Pre-existing 163 errors / 11,004 warnings — zero new violations from Task 63 |
| `npm run typecheck` | ✅ PASS |
| `npm run governance` | ✅ All 5 categories PASS (no regressions) |
| `npm run governance:tailwind` | ✅ PASS |
| `npm run build` | ✅ PASS |
| `npm run build-storybook` | ✅ PASS |
| `npm run governance:storybook` | ✅ PASS |
| `npm run governance:screenshots` | ✅ PASS |
| `npm run governance:components` | ✅ PASS |
| `npm run catalog:components` | ✅ PASS — 158 components cataloged |

**Lint note:** `scripts/governance/component-catalog.mjs` is `.mjs` (not in TypeScript ESLint scope).
Zero lint violations in any modified production source file.

---

## Known Limitations

1. **Static analysis only.** The catalog uses regex pattern matching, not AST parsing. Complex patterns (dynamic components, HOCs, conditional exports) may not be detected. Mark as MANUAL_REVIEW in such cases.

2. **Raw `<button>` count includes pre-existing violations.** 38 components flagged for raw `<button>` — all pre-existing debt. Not introduced by Phase 6.

3. **`withStory` count includes inferred story matches.** The story count (~31) may slightly over-count due to pattern matching. The JSON catalog (`scripts/governance/reports/component-catalog.latest.json`) has exact per-component data.

4. **Story coverage is Phase 4 baseline.** Shared-ui, layout, and admin-shared components have no stories. This is known coverage debt, tracked in the risk register.

5. **`MANUAL_REVIEW` does not block CI.** The `governance:components` check validates infrastructure, not individual component violations. Pre-existing violations are tracked in the risk register.

---

## Future Technical Debt

| Item | Priority | Notes |
|---|---|---|
| Global ESLint Debt Burn-down | MEDIUM | 163 errors / 11,004 warnings — pre-existing, not from this epic |
| Storybook story coverage expansion | MEDIUM | Add stories for shared-ui and admin-shared components |
| Raw `<button>` migration | MEDIUM | 38 components with raw buttons — migrate to `Button` component |
| Grid `2xl:` steps | MEDIUM | 28 grids without 2xl step — add `2xl:grid-cols-4` progressively |
| Arbitrary Tailwind cleanup | LOW | 54 components — add to allowlist or replace with canonical tokens |

---

## Final Epic Closure Summary

**Future Maintenance Direction Epic — All 6 Phases Complete:**

| Phase | Task | Status | Deliverable |
|---|---|---|---|
| 1 | Task 58 | ✅ CLOSED | Periodic Governance Enforcement |
| 2 | Task 59 | ✅ CLOSED | CI Lint Rules for UI Consistency |
| 3 | Task 60 | ✅ CLOSED | Tailwind Utility Entropy Detection |
| 4 | Task 61 | ✅ CLOSED | Storybook / Visual Snapshots Foundation |
| 5 | Task 62 | ✅ CLOSED | Responsive Regression Screenshots |
| 6 | Task 63 | ✅ CLOSED | Component Cataloging |

**Epic outcome:**
- Automated governance gates for all major risk dimensions
- CI-enforced primitive and responsive governance
- Tailwind entropy detection and allowlist system
- Storybook foundation for visual review
- Playwright-based responsive screenshot infrastructure
- Complete component catalog with classification, coverage, and risk register
- Permanent governance documentation for all future maintenance
