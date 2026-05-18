# Governance Checklists — Lero.al
**Phase 1 of Future Maintenance Direction Epic**
Established: 2026-05-18
Status: REUSABLE GOVERNANCE REFERENCE

These checklists are the mandatory verification interface for all future UI tasks.
Every checklist is self-contained — copy and paste the relevant checklist into a task session log to track completion.

---

## CHECKLIST A — Pre-Task Governance Gate

Run before writing any code for a UI task.

```
PRE-TASK GOVERNANCE GATE
========================
Task: _______________
Date: _______________

[ ] Searched src/components/ for similar existing components — result: _______________
[ ] All planned text strings have i18n key paths — no hardcode planned
[ ] Scope is isolated — files to modify listed: _______________
[ ] Governance docs consulted: ui-rules.md, component-governance.md, responsive-governance.md
[ ] No modification of shared components outside task scope
[ ] If shared component MUST be modified: all consumers audited and listed
```

---

## CHECKLIST B — Post-Task UI Governance Gate

Run after completing any UI task. All boxes must be checked before task is marked complete.

```
POST-TASK UI GOVERNANCE GATE
=============================
Task: _______________
Date: _______________

CANONICAL PRIMITIVES
[ ] Used Button from @/components/ui/button — no raw <button> created
[ ] Used Input from @/components/ui/input — no local input wrapper created
[ ] Used Sheet for mobile drawers/panels — no custom div.fixed overlay
[ ] Used Dialog for confirmation/form modals — no custom overlay
[ ] Used Tabs from @/components/ui/tabs — no local tab button clones
[ ] Used only lucide-react icons — no other icon library introduced

RESPONSIVE GOVERNANCE
[ ] Mobile-first: base styles for 320px, scaled up with sm:/md:/lg:/xl:/2xl:
[ ] 2xl: step added for any new listing grid (2xl:grid-cols-4)
[ ] 2xl: step added for any new public container (or .container-wide used)
[ ] No arbitrary viewport JS (typeof window, useWindowSize, window.innerWidth)
[ ] No arbitrary min-width/max-width breakpoint hacks in className

TOUCH TARGETS
[ ] All mobile-reachable interactive elements ≥ 44px (size="xl" or min-h-[44px])
[ ] No size="sm" or smaller on mobile-reachable elements

ACCESSIBILITY
[ ] Every icon-only button has aria-label
[ ] Every form field has visible or accessible label
[ ] Every modal/sheet uses shadcn Dialog/Sheet (built-in focus trap)
[ ] Keyboard navigation works for new interactive elements
[ ] Focus ring visible on all new interactive elements (global :focus-visible handles this)

LOCALIZATION SAFETY
[ ] Layout works for sq/en/uk/it at all breakpoints
[ ] No hardcoded widths for elements containing translatable text
[ ] Toolbar items use flex-wrap on mobile if text may differ per locale
[ ] New text-containing elements tested with Ukrainian (uk) — longest strings

HUGE DESKTOP
[ ] Public pages use .container-wide or max-w-* — no unbounded full-width sections
[ ] No page stretches full-width at 2560px
[ ] Content grid has 2xl: step — no whitespace wasteland

SPACING & TYPOGRAPHY
[ ] Used canonical section spacing: py-8 md:py-12 / py-12 md:py-16 / py-16 md:py-24
[ ] No arbitrary section padding (py-7, py-10, py-13, py-15)
[ ] Used canonical type scale — no deviations
[ ] No static text-2xl or larger on mobile-visible elements without responsive step

SSR & HYDRATION
[ ] No suppressHydrationWarning introduced
[ ] No typeof window rendering branches for visible UI
[ ] No useEffect-driven layout changes that cause visible CLS
[ ] New client boundaries justified in a comment

I18N COMPLETENESS
[ ] All four locale files updated: sq.json, en.json, uk.json, it.json
[ ] Key count matches across all four files
[ ] Runtime locale switch tested — strings visibly change
```

---

## CHECKLIST C — Weekly Governance Scan

Run at end of each sprint/week. Store results in `docs/governance-reports/weekly/weekly-YYYY-MM-DD.md`.

```
WEEKLY GOVERNANCE SCAN
=======================
Date: _______________
Performed by: _______________

PRIMITIVE SCAN
[ ] grep "<button" src/ — count of raw buttons: ___ (expected: 0 or justified)
[ ] grep "h-11" src/ className usage — count: ___ (expected: 0, must be size="xl")
[ ] grep "fixed inset-0" src/ non-Sheet/Dialog — count: ___ (expected: 0)
[ ] grep "typeof window\|useWindowSize" src/ — count: ___ (expected: 0 in render paths)
[ ] grep "window\.location\.href" src/ — count: ___ (expected: 0, must use router.push)
[ ] grep "from '@heroicons\|react-icons\|feather" src/ — count: ___ (expected: 0)

TAILWIND ENTROPY SCAN
[ ] Count of new arbitrary values [XXXX] since last scan: ___
[ ] Count of new py-* values outside canonical scale: ___
[ ] Count of new text-* values outside canonical scale: ___
[ ] New utility classes in globals.css: ___ (must have active consumers)

I18N SCAN
[ ] All four locale files exist and have matching top-level key count
[ ] No hardcoded user-visible strings found in recent commits

ESCALATIONS
[ ] HIGH findings: ___ (list below)
[ ] CRITICAL findings: ___ (list below — must be resolved immediately)

NOTES:
```

---

## CHECKLIST D — Monthly Responsive Audit

Run first Monday of each month. Store in `docs/governance-reports/monthly/monthly-YYYY-MM.md`.

```
MONTHLY RESPONSIVE AUDIT
=========================
Date: _______________
Performed by: _______________

BREAKPOINT VALIDATION
Surface: _______________

320px:  [ ] overflow [ ] toolbar [ ] modal [ ] nav [ ] cards [ ] touch [ ] locale
375px:  [ ] overflow [ ] toolbar [ ] modal [ ] nav [ ] cards [ ] touch [ ] locale
480px:  [ ] overflow [ ] toolbar [ ] modal [ ] nav [ ] cards [ ] touch [ ] locale
640px:  [ ] overflow [ ] toolbar [ ] modal [ ] nav [ ] cards [ ] touch [ ] locale
768px:  [ ] overflow [ ] toolbar [ ] modal [ ] nav [ ] cards [ ] touch [ ] locale
1024px: [ ] overflow [ ] toolbar [ ] modal [ ] nav [ ] cards [ ] grid [ ] locale
1280px: [ ] overflow [ ] toolbar [ ] modal [ ] nav [ ] cards [ ] grid [ ] locale
1440px: [ ] overflow [ ] toolbar [ ] modal [ ] nav [ ] cards [ ] grid [ ] locale
1720px: [ ] overflow [ ] whitespace [ ] grid [ ] container [ ] typography
1920px: [ ] overflow [ ] whitespace [ ] grid [ ] container [ ] typography
2560px: [ ] overflow [ ] whitespace [ ] grid [ ] container [ ] typography

TAILWIND ENTROPY (monthly)
[ ] Total arbitrary values count: ___
[ ] Delta since last month: +/- ___
[ ] New py-* outside canonical: ___
[ ] New text-* outside canonical: ___
[ ] Entropy trend: STABLE / GROWING / SHRINKING

PRIMITIVE DUPLICATION (monthly)
[ ] Raw <button> count: ___
[ ] Local dialog/overlay count: ___
[ ] Local tab clone count: ___
[ ] Custom drawer/overlay count: ___
[ ] Migration priority: ___ items queued

ESCALATIONS
[ ] MEDIUM findings: ___
[ ] HIGH findings: ___
[ ] CRITICAL findings: ___

NOTES:
```

---

## CHECKLIST E — Quarterly Governance Audit

Run first Monday of each quarter. Store in `docs/governance-reports/quarterly/quarterly-YYYY-qN.md`.

```
QUARTERLY GOVERNANCE AUDIT
===========================
Quarter: _______________
Date: _______________
Performed by: _______________

HUGE DESKTOP AUDIT (1720–2560px+)
[ ] All public pages use .container-wide or max-w-* — no whitespace wastelands
[ ] All listing grids have 2xl:grid-cols-4
[ ] Admin shell has max-width constraint
[ ] Section padding has 2xl: step where applicable
[ ] Section headings have 2xl: step where applicable
[ ] No new unbounded full-width sections introduced this quarter

LOCALIZATION AUDIT (sq, en, uk, it × all breakpoints)
Locale: sq
[ ] 320px: no overflow [ ] 768px: no overflow [ ] 1440px: no overflow
Locale: en
[ ] 320px: no overflow [ ] 768px: no overflow [ ] 1440px: no overflow
Locale: uk  ← longest strings — most likely to break
[ ] 320px: no overflow [ ] 768px: no overflow [ ] 1440px: no overflow
[ ] Toolbar wrapping: ___  [ ] Modal overflow: ___  [ ] Nav overflow: ___
Locale: it
[ ] 320px: no overflow [ ] 768px: no overflow [ ] 1440px: no overflow

ACCESSIBILITY AUDIT
[ ] Tab navigation covers all interactive surfaces
[ ] Focus rings visible on all interactive elements
[ ] All icon-only buttons have aria-label (grep result: ___)
[ ] All modals/sheets use shadcn Dialog/Sheet (focus trap verified)
[ ] Minimum touch targets maintained (44px) on all mobile surfaces

GOVERNANCE DRIFT REVIEW
[ ] Primitive governance matrices updated (component-governance.md)
[ ] Responsive governance matrix updated (responsive-audit.md)
[ ] New anti-patterns identified and added to ai-behavior.md
[ ] New canonicals identified and documented

ARCHITECTURE HEALTH
[ ] No new viewport JS patterns
[ ] No new suppressHydrationWarning
[ ] Filter architecture anti-patterns maintained
[ ] State authority map unchanged or correctly updated

ESCALATIONS
[ ] Items carried over from this quarter: ___
[ ] NEW HIGH findings: ___
[ ] NEW CRITICAL findings: ___
[ ] Recommended migration phases: ___

QUARTERLY SUMMARY:
```

---

## CHECKLIST F — New Component Creation Gate

Run when introducing any NEW component to the project.

```
NEW COMPONENT CREATION GATE
============================
Component name: _______________
Location: _______________
Task: _______________

PRE-CREATION
[ ] Searched src/components/ — confirmed no existing similar component
[ ] Confirmed this cannot be satisfied by an existing shadcn/ui primitive
[ ] Confirmed this cannot be satisfied by a composition of existing primitives
[ ] Component scope is clearly defined — it does one thing

IMPLEMENTATION
[ ] Uses only canonical primitives internally (Button, Input, Sheet, Dialog, etc.)
[ ] Mobile-first responsive styles
[ ] All text strings use i18n keys
[ ] No hardcoded colors — semantic tokens only
[ ] No arbitrary Tailwind values
[ ] Props are typed with TypeScript interface/type
[ ] Component is exported from appropriate module barrel (if shared)

ACCESSIBILITY
[ ] Keyboard accessible
[ ] ARIA attributes defined where needed
[ ] Focus management handled (if modal/overlay)
[ ] Touch targets ≥ 44px on mobile-reachable interactive elements

GOVERNANCE
[ ] Component added to component-governance.md if shared primitive
[ ] Component usage rules documented if complex
[ ] No client boundary unless justified
```

---

## CHECKLIST G — Shared Component Modification Gate

Run before modifying any shared component.

```
SHARED COMPONENT MODIFICATION GATE
=====================================
Component: _______________
Reason for modification: _______________
Task: _______________

PRE-MODIFICATION
[ ] All consumers identified — list: _______________
[ ] Modification is minimal and targeted — no scope creep
[ ] Modification does not alter external API (props, exports) — OR migration plan documented
[ ] Regression risk assessed: LOW / MEDIUM / HIGH

VERIFICATION PLAN
[ ] Homepage flow verified after change
[ ] Filters flow verified after change
[ ] Forms flow verified after change
[ ] Modals/dialogs flow verified after change
[ ] Admin flows verified after change
[ ] Mobile layouts verified after change

POST-MODIFICATION
[ ] All consumers tested
[ ] No regressions in any consumer
[ ] TypeScript passes
[ ] ESLint passes
```

---

## CHECKLIST H — Tailwind Entropy Gate (Phase 3)

Run before AND after any UI task. Replaces ad-hoc style decisions with canonical fragment lookup.

```
TAILWIND ENTROPY GATE
======================
Task: _______________
Date: _______________

PRE-TASK (before writing any className)
[ ] Checked docs/tailwind-canonical-fragments.md — fragment exists or will be created
[ ] Checked docs/tailwind-governance.md §4 for spacing scale — no arbitrary values planned
[ ] Checked docs/tailwind-governance.md §6 for grid patterns — 2xl: step included
[ ] Checked docs/tailwind-governance.md §8 for container tokens — .container-wide for public pages
[ ] Verified no existing utility chain will be duplicated
[ ] Run npm run governance:tailwind — baseline count: ___

POST-TASK
[ ] No new arbitrary values introduced (or each one has allowlist entry reason)
[ ] No new utility chain duplication (checked against docs/tailwind-canonical-fragments.md)
[ ] No whitespace-nowrap without overflow-hidden + truncate
[ ] No fixed px widths on elements with translated text
[ ] All listing grids include 2xl:grid-cols-4
[ ] All public page containers use .container-wide or canonical max-w-*
[ ] Run npm run governance:tailwind — result: PASS / FAIL
[ ] If FAIL: new violation count vs baseline: ___

LOCALIZATION SAFETY
[ ] sq locale: no overflow / no toolbar wrapping at 320px
[ ] uk locale: no overflow / no label clipping at 375px (longest strings)
[ ] it locale: no overflow at 768px
[ ] All 4 locales: modal content fits at mobile widths

HUGE DESKTOP SAFETY (spot-check)
[ ] Content bounded at 2560px (no whitespace wasteland)
[ ] Listing grids show 4 columns at 1920px+
[ ] No section stretches full viewport width
```

---

## CHECKLIST I — New Component Story Gate (Phase 4)

Run when adding a new shared component that requires a story.

```
NEW COMPONENT STORY GATE
=========================
Component: _______________
Story file: _______________
Task: _______________

STORY REQUIREMENTS
[ ] Default state story created
[ ] All variants covered (if variant prop exists)
[ ] Disabled state covered (if applicable)
[ ] Long locale label story (Ukrainian uk stress test)
[ ] Mobile viewport story with size="xl" touch targets
[ ] Huge desktop viewport story if component is container/grid

STORY QUALITY
[ ] No raw <button> elements — only Button from @/components/ui/button
[ ] No live API calls, fetch(), or Supabase imports
[ ] No auth session dependencies
[ ] All fixture data is stable (no Math.random(), no new Date())
[ ] No arbitrary Tailwind values introduced in story
[ ] No hardcoded English-only text for locale-sensitive elements

LOCALIZATION COVERAGE
[ ] Ukrainian (uk) text included for all visible text areas
[ ] Story works at 320px with uk locale — no overflow
[ ] Story works at 1280px with uk locale — no clipping

RUN
[ ] npm run governance passes (no new HIGH/CRITICAL)
[ ] npm run lint passes (0 errors)
[ ] Story renders correctly in Storybook locally (after npm install)
```

---

## CHECKLIST H — Responsive Screenshot Review Gate

Run when a PR changes any component in the screenshot target list
(see `docs/responsive-screenshot-matrix.md §3`).

```
RESPONSIVE SCREENSHOT REVIEW GATE
===================================
Task/PR: _______________
Date: _______________
Components changed: _______________

SETUP
[ ] npm run build-storybook — builds storybook-static/
[ ] npx playwright install chromium — browser available (one-time)

CAPTURE
[ ] npm run screenshots:responsive — fast-check matrix captured
[ ] Output folder: .screenshots/responsive/YYYY-MM-DD/

MOBILE REVIEW (compare before/after if baseline exists)
[ ] mobile-320: no overflow, touch targets visible
[ ] mobile-375: no overflow, touch targets ≥ 44px

LOCALE REVIEW (compare en vs uk at same viewport)
[ ] uk × mobile-375: Ukrainian text does not overflow or break layout
[ ] uk × tablet-768: No toolbar/nav label overflow
[ ] sq × mobile-375: Albanian labels render correctly
[ ] it × desktop-1280: Italian strings fit correctly

HUGE DESKTOP REVIEW
[ ] huge-2560: listing grid shows 4 columns (2xl:grid-cols-4)
[ ] huge-2560: containers bounded by container-wide or max-w-*
[ ] huge-2560: no unbounded full-width sections

GOVERNANCE
[ ] npm run governance passes (no new HIGH/CRITICAL)
[ ] npm run governance:screenshots passes (exit 0)
[ ] No screenshots committed to git

SIGN-OFF
[ ] All regressions from screenshots addressed or documented
[ ] PR approved for merge
```

---

## CHECKLIST I — Component Catalog Pre-Creation Gate

Run before creating any new UI component.

```
COMPONENT CATALOG PRE-CREATION GATE
======================================
Task/PR: _______________
Component name: _______________
Intended location: _______________

CATALOG CHECK
[ ] Ran npm run catalog:components
[ ] Searched docs/component-catalog.md — no equivalent component found
[ ] Confirmed existing canonical primitives cannot satisfy requirement
[ ] Confirmed existing shared components cannot be composed to satisfy requirement

CLASSIFICATION
[ ] Component type determined: _______________
[ ] Placed in correct source directory per docs/component-catalog-governance.md §1

LOCALIZATION
[ ] Will use useTranslations — no hardcoded strings
[ ] Verified layout works for sq/en/uk/it at 320px and 768px

RESPONSIVE
[ ] Mobile-first: base styles for 320px, scaling with sm:/md:/lg:/xl:/2xl:
[ ] If grid: added 2xl:grid-cols-4 for listing grids
[ ] No viewport JS (typeof window, useWindowSize, window.innerWidth)

PRIMITIVE USAGE
[ ] Using Button from @/components/ui/button (not raw <button>)
[ ] Using Dialog/Sheet for overlays (not div.fixed.inset-0)
[ ] Using lucide-react icons only
[ ] No local primitive clone created

POST-CREATION
[ ] npm run catalog:components re-run to include new component
[ ] If shared-ui or canonical-primitive: Storybook story queued/created
[ ] docs/component-catalog.md reviewed to confirm new component appears
```
