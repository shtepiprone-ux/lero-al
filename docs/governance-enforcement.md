# Governance Enforcement Framework — Lero.al
**Phase 1 of Future Maintenance Direction Epic**
Established: 2026-05-18
Status: PERMANENT GOVERNANCE REFERENCE

---

## §1 — PERIODIC AUDIT CADENCE

### Weekly Governance Scan
**Scope:** Detect new primitive violations and Tailwind entropy growth.
**Trigger:** After any UI task completion, or at end of each weekly sprint.
**Output:** `docs/governance-reports/weekly/weekly-YYYY-MM-DD.md`

Checks:
- New raw `<button>` elements (grep `<button` in src/)
- New `h-11` className hacks (grep `h-11` in src/ — must be `size="xl"`)
- New `container mx-auto px-4` without `.container-wide` on public pages
- New viewport JS patterns (`typeof window`, `useWindowSize`, `window.innerWidth`)
- New hardcoded text strings (grep for non-i18n strings in JSX)
- New arbitrary padding values (py-7, py-10, py-13, py-15)
- New icon library imports (anything other than lucide-react)

### Monthly Responsive Audit
**Trigger:** First Monday of each month.
**Output:** `docs/governance-reports/monthly/monthly-YYYY-MM.md`

Breakpoints to validate:
- 320px, 360px, 375px, 390px, 412px (mobile narrow → standard)
- 480px, 640px (mobile L / small tablet)
- 768px (tablet)
- 1024px, 1280px, 1440px (desktop)
- 1720px, 1920px, 2560px (huge desktop)
- ultrawide (3440px+)

Surfaces to audit:
- Homepage (hero, filters, sections, footer)
- Listings page (grid, sidebar, filter sheet)
- Listing detail
- Admin dashboard and tables
- Cabinet / auth pages
- Mobile bottom nav

### Monthly Tailwind Entropy Audit
**Trigger:** First Monday of each month (can combine with responsive audit).
**Output:** Appended to monthly governance report.

Checks:
- Count arbitrary values in className: `[XXXX]` patterns — must not grow
- Count `py-*` values not in canonical scale
- Count `text-*` values not in canonical type scale
- Count `rounded-*` mixing between `rounded-xl` and `rounded-2xl` in same context
- New utility classes in `globals.css` without active consumers

### Monthly Primitive Duplication Audit
**Trigger:** First Monday of each month.
**Output:** Appended to monthly governance report.

Checks:
- Local button clones (raw `<button>` elements with styling)
- Local input clones (div-wrapped inputs with custom heights)
- Local dialog clones (custom `div.fixed.inset-0` overlays)
- Local tab implementations (non-shadcn tab buttons)
- Custom overlay drawers (non-Sheet mobile drawers)
- Duplicated responsive container logic

### Quarterly Huge-Desktop Audit
**Trigger:** First Monday of each quarter (Q1: Jan, Q2: Apr, Q3: Jul, Q4: Oct).
**Output:** `docs/governance-reports/quarterly/quarterly-YYYY-qN.md`

Checks:
- All public pages: verify `.container-wide` or max-width constraint at 2560px
- All listing grids: verify `2xl:grid-cols-4` step
- Admin shell: verify max-width constraint at 2560px
- Section padding: verify `2xl:py-*` step where applicable
- Section typography: verify `2xl:text-*` step where applicable
- Whitespace wasteland detection at 1920px, 2560px

### Quarterly Localization-Responsive Audit
**Trigger:** First Monday of each quarter (same as huge-desktop audit).
**Output:** Appended to quarterly governance report.

Locales to validate: `sq`, `en`, `uk`, `it`
Surfaces to check with each locale:
- Toolbar wrapping at 320px, 375px, 768px
- Navigation overflow at all breakpoints
- Modal content overflow
- Listing card text truncation
- Hero title wrapping
- Footer column wrapping
- Filter label truncation

---

## §2 — GOVERNANCE REVIEW CHECKPOINTS

Every future UI task MUST verify ALL of the following before marking complete:

### Pre-Task Checklist (confirm before writing any code)
- [ ] Searched `src/components/` for existing similar components — no duplicates planned
- [ ] All text strings have i18n key paths — no hardcode planned
- [ ] Scope is isolated — files to be modified are listed
- [ ] Governance docs consulted: `ui-rules.md`, `component-governance.md`, `responsive-governance.md`

### Post-Task UI Checklist (verify after each UI change)
- [ ] **Canonical primitives** — used `Button`, `Input`, `Sheet`, `Dialog`, `Tabs` from canonical sources
- [ ] **Responsive breakpoints** — mobile-first, no arbitrary viewport overrides
- [ ] **2xl: step** — added for any new listing grid or public container
- [ ] **Accessibility** — every interactive element has keyboard/ARIA support
- [ ] **Localization safety** — layout works for sq/en/uk/it without hardcoded widths
- [ ] **Huge-desktop rendering** — no whitespace wastelands, content is bounded
- [ ] **Touch targets** — all mobile-reachable elements ≥ 44px
- [ ] **Container governance** — public pages use `.container-wide`, not raw `container mx-auto px-4`
- [ ] **Spacing governance** — used canonical section/card/toolbar spacing scale
- [ ] **Typography governance** — used canonical type scale, no deviations
- [ ] **No viewport JS** — no `typeof window`, `useWindowSize`, `window.innerWidth` in render logic
- [ ] **No primitive duplication** — no raw `<button>`, no local dialog clone, no custom drawer
- [ ] **SSR safety** — no `suppressHydrationWarning`, no `typeof window` branches
- [ ] **i18n completeness** — all four locale files updated, runtime locale switch tested

---

## §3 — GOVERNANCE ESCALATION RULES

### Severity Levels

| Level | Label | Response Time | Action |
|---|---|---|---|
| LOW | Minor drift | Next monthly audit | Document, fix in next cleanup sprint |
| MEDIUM | Governance gap | Within 2 weeks | Schedule dedicated fix task |
| HIGH | Regression risk | Within 1 sprint | Immediate fix task before next feature |
| CRITICAL | Production risk | Immediate | Block current task, fix now |

### Classification Rules

| Finding | Severity | Reason |
|---|---|---|
| Single raw `<button>` in non-critical page | LOW | Contained, no behavior risk |
| Multiple raw `<button>` clones spreading | MEDIUM | Governance drift pattern |
| Local dialog clone replacing Sheet/Dialog | MEDIUM | Focus trap missing, a11y regression |
| Viewport JS in render path | HIGH | Hydration mismatch risk |
| `suppressHydrationWarning` introduced | CRITICAL | Masks hydration contract violation |
| Public page missing max-width at 2xl | MEDIUM | Huge-desktop whitespace wasteland |
| Listing grid missing `2xl:grid-cols-4` | MEDIUM | Huge-desktop grid regression |
| Accessibility regression (no aria-label, no focus) | HIGH | A11y contract violation |
| Hardcoded locale text | HIGH | Localization contract violation |
| i18n key missing in any locale file | HIGH | Broken locale at runtime |
| Locale layout overflow (modal, toolbar) | MEDIUM | UX regression for affected locale |
| SSR/hydration boundary violation | CRITICAL | Production rendering risk |
| New non-lucide icon library imported | HIGH | Icon system fragmentation |
| Arbitrary Tailwind value growth (>5 new) | MEDIUM | Utility entropy signal |
| Duplicate filter adapter logic | HIGH | Architecture integrity violation |
| `window.location.href` for navigation | HIGH | Next.js router contract violation |

---

## §4 — PERIODIC AUDIT PROCEDURES

### A. Primitive Audit Procedure

**Detection commands (run from project root):**

```bash
# Find raw <button> elements (excluding shadcn internals)
grep -rn "<button" src/ --include="*.tsx" | grep -v "ui/button"

# Find h-11 className hacks (should be size="xl")
grep -rn "h-11" src/ --include="*.tsx" | grep -v "size-11"

# Find local dialog clones (div fixed inset-0 for modals)
grep -rn "fixed inset-0" src/ --include="*.tsx" | grep -v "sheet\|dialog\|Sheet\|Dialog"

# Find non-shadcn tab patterns
grep -rn "role=\"tab\"" src/ --include="*.tsx" | grep -v "ui/tabs"

# Find icon library violations
grep -rn "from '@heroicons\|from 'react-icons\|from 'feather" src/ --include="*.tsx"

# Find viewport JS patterns
grep -rn "typeof window\|useWindowSize\|window\.innerWidth" src/ --include="*.tsx"
```

**Pass criteria:**
- Zero non-justified raw `<button>` elements in interactive UI
- Zero `h-11` className on `Button` components (must be `size="xl"`)
- Zero custom `div.fixed.inset-0` modal overlays
- Zero non-lucide icon imports
- Zero viewport JS in render paths

### B. Responsive Audit Procedure

**Manual validation (Chrome DevTools):**
1. Open each surface in DevTools responsive mode
2. Step through each breakpoint: 320 → 360 → 375 → 390 → 412 → 480 → 640 → 768 → 1024 → 1280 → 1440 → 1720 → 1920 → 2560
3. At each step, verify:
   - No horizontal scroll (overflow-x)
   - No toolbar wrapping (items stay in row)
   - No text overflow/truncation (unless intentional)
   - No card density issues (not too sparse, not too dense)
   - No touch target violations (interactive elements ≥ 44px on mobile)
   - Grid step correctly applied (correct col count at each breakpoint)

**Automated checks:**
```bash
# Find container mx-auto on public pages (should be container-wide)
grep -rn "container mx-auto" src/app/\[locale\]/ --include="*.tsx"

# Find listing grids missing 2xl step
grep -rn "xl:grid-cols-3" src/ --include="*.tsx" | grep -v "2xl:"

# Find public pages missing max-width
grep -rn "min-h-screen" src/app/\[locale\]/ --include="*.tsx"
```

### C. Localization Audit Procedure

**For each locale (sq, en, uk, it):**
1. Set `NEXT_PUBLIC_DEFAULT_LOCALE=<locale>` or switch locale via UI
2. Check each surface at 320px, 375px, 768px, 1440px, 2560px:
   - No toolbar overflow
   - No modal overflow
   - No navigation wrapping
   - Listing card labels readable
   - Hero title wraps gracefully
   - Footer columns intact
3. Special focus on Ukrainian (uk) — longest strings in most labels

**Automated check:**
```bash
# Verify all four locale files have same key count
node -e "
const sq = Object.keys(require('./messages/sq.json')).length;
const en = Object.keys(require('./messages/en.json')).length;
const uk = Object.keys(require('./messages/uk.json')).length;
const it = Object.keys(require('./messages/it.json')).length;
console.log({sq, en, uk, it});
"
```

### D. Accessibility Audit Procedure

**Manual checks:**
1. Tab through each interactive surface — every element must be reachable
2. Verify focus ring visibility on all interactive elements
3. Verify all icon-only buttons have `aria-label`
4. Open each modal/sheet — verify focus is trapped inside
5. Check screen reader labels for filter accordion, tabs, navigation
6. Verify `role="tablist"` + `role="tab"` on tab components (shadcn Tabs provides these)

**Automated checks:**
```bash
# Find icon-only buttons without aria-label
grep -rn "size=\"icon\"" src/ --include="*.tsx" -A2 | grep -v "aria-label"

# Find dialogs/sheets without aria attributes
grep -rn "<Dialog\|<Sheet" src/ --include="*.tsx"
```

---

## §5 — PERFORMANCE / SSR / HYDRATION GOVERNANCE

### Forbidden Patterns (CRITICAL violations)
- `suppressHydrationWarning` — masks hydration contract violations
- `typeof window` in render-path logic for visible UI elements
- `window.innerWidth` in component render
- `useWindowSize` hook driving visible layout
- `dynamic(..., { ssr: false })` inside Server Components without documented justification
- `useEffect` driving layout changes that cause visible CLS
- Duplicated render trees (render mobile + desktop, hide with CSS) for heavy components

### Approved Patterns
- CSS-driven responsiveness via Tailwind breakpoint classes
- Static breakpoint composition (classes applied at build time)
- SSR-safe responsive rendering (breakpoint classes, no JS)
- Compile-time styling consistency via Tailwind
- `ssr:false` for explicitly auth-dependent or client-only components (documented)
- CSS `hidden lg:block` / `lg:hidden` for lightweight conditional show/hide

### Client Boundary Rules
- Client boundaries must be justified in a comment
- Auth-dependent components: acceptable client boundary
- URL-state components (filters, pagination): acceptable client boundary
- Pure presentation components: MUST be server components

---

## §6 — LOCALIZATION GOVERNANCE

### Permanent Enforcement Rules
- ALL layouts MUST work for all locales: sq, en, uk, it
- NO locale-specific width hacks (`min-w-[200px]` for Ukrainian labels forbidden)
- NO locale-specific breakpoint overrides
- NO hardcoded widths for navigation, buttons, or modals
- Text that must not wrap: use `truncate` — do not use `whitespace-nowrap` without `overflow-hidden`
- Toolbars with many items: use `flex-wrap` so items wrap gracefully instead of overflowing
- Test Albanian (sq) and Ukrainian (uk) — they have the longest strings in this project

### Truncation Governance
| Context | Rule |
|---|---|
| Navigation labels | Truncate with `truncate max-w-*` |
| Card titles | Truncate after 2 lines: `line-clamp-2` |
| Filter labels | Allow wrapping — never truncate filter labels |
| Button labels | Allow text to wrap inside button, or shorten translation |
| Modal titles | Allow wrapping — never truncate |

### Toolbar Wrapping Governance
- Toolbars MUST use `flex-wrap` on mobile (`< lg:`)
- Compact mobile variants allowed via `hidden lg:flex` pattern
- Never clip toolbar items with `overflow-hidden` on the toolbar container

---

## §7 — HUGE DESKTOP GOVERNANCE (1536px+)

### Permanent Enforcement Rules
- Every public page MUST use `.container-wide` (max 88rem = 1408px)
- Every listing card grid MUST have `2xl:grid-cols-4`
- Admin shell content MUST have a max-width constraint at 2560px
- Section padding MUST scale at `2xl:` for new sections (add `2xl:py-20`)
- Section headings MUST scale at `2xl:` for new sections (add `2xl:text-3xl`)
- NO whitespace wastelands — content must be bounded but space must be used wisely

### Whitespace Wasteland Definition
A whitespace wasteland is a viewport condition where:
- Content occupies less than 40% of horizontal space at 2560px
- OR a grid renders with the same column count at 1440px and 2560px

### Required 2xl: Steps

| Element | Required 2xl: class |
|---|---|
| Public listing grid | `2xl:grid-cols-4` |
| Public page container | `container-wide` (already enforces max 88rem) |
| Section padding | `2xl:py-20` (add to new sections) |
| Section heading | `2xl:text-3xl` (add to new section H2s) |
| Hero heading | No additional step needed (md:text-5xl is sufficient) |

---

## §8 — GOVERNANCE VALIDATION MATRICES

### Matrix 1: Responsive Validation Matrix

| Surface | Mobile (320–480px) | Tablet (768px) | Desktop (1024–1440px) | Huge Desktop (1720–2560px) | Localization Safe | Accessibility Safe | Governance Compliant |
|---|---|---|---|---|---|---|---|
| Homepage hero | ✅ | ✅ | ✅ | ⚠️ no 2xl:py step | ⚠️ uk title wraps | ✅ | PARTIAL |
| Homepage sections | ✅ | ✅ | ✅ | ❌ no max-width container | ✅ | ✅ | FAIL |
| Listings page | ✅ | ✅ | ✅ | ❌ grid 3-col max, no container | ✅ | ⚠️ filter touch | FAIL |
| Listing detail | ✅ | ✅ | ✅ | ⚠️ no container-wide | ✅ | ✅ | PARTIAL |
| Admin dashboard | ⚠️ overflow | ⚠️ | ✅ | ⚠️ shell unbounded | ✅ | ⚠️ small close btn | PARTIAL |
| Cabinet | ✅ | ✅ | ✅ | ✅ max-w-5xl | ⚠️ uk | ✅ | PASS |
| Auth | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |

*This matrix reflects state as of 2026-05-18 after Responsive/UI Governance Epic completion. Update after each monthly audit.*

### Matrix 2: Primitive Governance Matrix

| Primitive | Canonical Source | Allowed Variants | Forbidden Patterns | Accessibility Rules | Responsive Rules |
|---|---|---|---|---|---|
| Button | `@/components/ui/button` | xs/sm/default/lg/xl/icon/icon-xl/icon-sm/icon-xs/icon-lg | raw `<button>`, `h-11` className, size="sm" on mobile | aria-label for icon-only | size="xl" on mobile-reachable |
| Input | `@/components/ui/input` | default (h-9) | local wrappers with custom height, className height override | visible or accessible label | min-h-[44px] wrapper on mobile forms |
| Icons | lucide-react | h-3/h-3.5/h-4/h-5/h-6/h-12 | other icon libraries, custom SVG unless justified | aria-hidden on decorative | shrink-0 in flex containers |
| Tabs | `@/components/ui/tabs` | TabsList/TabsTrigger/TabsContent | local tab button clones, custom role="tab" | Built-in shadcn ARIA | no responsive rules needed |
| Dialog | `@/components/ui/dialog` | standard shadcn variants | div.fixed.inset-0 custom overlays | Built-in focus trap | max-w-[calc(100vw-2rem)] on mobile |
| Sheet | `@/components/ui/sheet` | side: left/right/top/bottom | custom overlay drawers | Built-in focus trap | Use for ALL mobile drawers/panels |
| Card | bg-card + rounded-2xl (admin), rounded-xl (listings) | both radius tokens | hardcoded bg-white, arbitrary backgrounds | N/A | p-5 admin, p-3 listings |
| Container | .container-wide / max-w-5xl | container-wide, max-w-5xl, max-w-6xl | container mx-auto px-4 on public pages, unbounded sections | N/A | Must have 2xl: constraint |
| Grid | grid-cols-1 sm:2 xl:3 2xl:4 | per-context steps | stopping at xl:3 without 2xl:4, JS-driven columns | N/A | Always include 2xl: step |

### Matrix 3: Drift Detection Matrix

---

## §9 — CI GOVERNANCE ENFORCEMENT (Phase 2)

### CI Governance Matrix

| Rule | Detection Type | Severity | CI Blocking | Autofixable | False-Positive Risk |
|---|---|---|---|---|---|
| Raw `<button>` element | Script regex + ESLint | HIGH | ✅ | No | LOW |
| `suppressHydrationWarning` | ESLint AST | CRITICAL | ✅ | No | NONE |
| `window.location.href` | ESLint no-restricted-properties | HIGH | ✅ | No | LOW |
| Non-lucide icon import | ESLint no-restricted-imports | HIGH | ✅ | No | NONE |
| `typeof window` outside useEffect | Script regex | HIGH | ✅ | No | MEDIUM |
| `xl:grid-cols-N` without `2xl:` | Script regex | MEDIUM | ❌ | No | LOW |
| Non-canonical py-* spacing | Script regex | MEDIUM | ❌ | No | LOW |
| Missing locale file | Script check | CRITICAL | ✅ | No | NONE |
| Locale key count mismatch | Script JSON analysis | HIGH | ✅ | No | NONE |
| `fixed inset-0` non-Sheet/Dialog | Script regex | HIGH | ✅ | No | LOW |
| `useWindowSize`/viewport hooks | Script regex + ESLint | HIGH | ✅ | No | LOW |
| `useLayoutEffect` | Script regex | HIGH | ✅ | No | LOW |
| Hardcoded hex colors | Script regex | MEDIUM | ❌ | No | LOW |
| Arbitrary `max-w-[Npx]` | Script regex | MEDIUM | ❌ | No | MEDIUM |
| Emergency z-index `z-[999]` | Script regex | MEDIUM | ❌ | No | LOW |

### Primitive Enforcement Matrix

| Primitive | Allowed Source | Forbidden Patterns | Detection Method | Severity |
|---|---|---|---|---|
| Button | `@/components/ui/button` | `<button>` raw, `h-11` className | Script regex | HIGH |
| Input | `@/components/ui/input` | Local input wrappers, height overrides | Script regex | MEDIUM |
| Icons | `lucide-react` only | Any other icon library | ESLint no-restricted-imports | HIGH |
| Tabs | `@/components/ui/tabs` | `role="tab"` outside shadcn | Script regex | MEDIUM |
| Dialog | `@/components/ui/dialog` | `div.fixed.inset-0` custom overlays | Script regex | HIGH |
| Sheet | `@/components/ui/sheet` | Custom overlay drawers | Script regex | HIGH |
| Navigation | `router.push()` from next/navigation | `window.location.href` | ESLint no-restricted-properties | HIGH |
| Container | `.container-wide` on public pages | `container mx-auto px-4` alone | Script regex | MEDIUM |
| Grid | `2xl:grid-cols-4` on listing grids | `xl:grid-cols-3` without 2xl: step | Script regex | MEDIUM |

### Responsive Enforcement Matrix

| Pattern | Allowed | Forbidden | Detection Method | Severity |
|---|---|---|---|---|
| Breakpoints | `sm:/md:/lg:/xl:/2xl:` Tailwind | Arbitrary `min-[Npx]:`, `max-[Npx]:` | Script regex | MEDIUM |
| Responsive logic | CSS-only breakpoints | `typeof window`, `useWindowSize`, `window.innerWidth` | Script regex + ESLint | HIGH |
| Mobile drawers | `Sheet` from shadcn | Custom `div.fixed.inset-0` overlays | Script regex | HIGH |
| 2xl: step | Required on all listing grids | `xl:grid-cols-3` final (no 2xl:) | Script regex | MEDIUM |
| Container bound | `.container-wide` on public pages | Unbounded public sections | Script regex | MEDIUM |
| Hydration | CSS static classes only | `suppressHydrationWarning`, `useLayoutEffect` | ESLint AST + script | CRITICAL/HIGH |

### Governance Commands Reference

```bash
# Full scan (fails CI on HIGH/CRITICAL)
npm run governance

# Individual scans (fail on HIGH/CRITICAL in scope)
npm run governance:primitives
npm run governance:ssr
npm run governance:responsive
npm run governance:tailwind
npm run governance:localization

# Generate weekly report to docs/governance-reports/weekly/
npm run governance:report
```

### CI Workflow Reference

| Workflow | Trigger | Scope | Blocking |
|---|---|---|---|
| `.github/workflows/governance-pr.yml` | PR to main | All governance scans + ESLint + TypeScript | ✅ |
| `.github/workflows/governance-scheduled.yml` | Weekly Monday 09:00 UTC | Full scan + report generation | ✅ on violations |

| Drift Type | Detection Method | Severity | Escalation Path | Recommended Action |
|---|---|---|---|---|
| Primitive duplication | grep weekly scan | MEDIUM–HIGH | Document in weekly report | Schedule dedicated migration task |
| Responsive fragmentation | monthly breakpoint audit | MEDIUM | Document in monthly report | Add canonical responsive classes |
| Accessibility regression | monthly a11y audit | HIGH | Immediate fix task | Restore aria-labels/roles |
| Localization overflow | quarterly locale audit | MEDIUM | Document in quarterly report | Add truncate/flex-wrap/shorter key |
| Hydration-risk patterns | weekly grep scan | CRITICAL | Block task, fix immediately | Remove viewport JS, use CSS only |
| Arbitrary Tailwind growth | monthly entropy audit | LOW–MEDIUM | Document count in monthly report | Refactor to canonical token |
| Huge-desktop regression | quarterly huge-desktop audit | MEDIUM | Document in quarterly report | Add 2xl: step / container-wide |
| i18n key missing | pre-commit check | HIGH | Block commit | Add key to all 4 locale files |
| Raw button leak | weekly grep scan | LOW–MEDIUM | Document in weekly report | Migrate to Button component |
| Navigation href violation | code review / grep | HIGH | Immediate fix | Replace with router.push |
| SSR boundary violation | weekly grep scan | CRITICAL | Block task, fix immediately | Fix at deterministic render layer |

---

## §10 — TAILWIND ENTROPY ENFORCEMENT (Phase 3)

### Rule Categories

| Category | Description | Detection | Blocking |
|---|---|---|---|
| DUPLICATE_CHAIN | Same utility chain repeated 3+ times | tailwind-entropy.mjs | HIGH+ |
| ARBITRARY_VALUE | w-[]/h-[]/text-[] outside canonical allowlist | tailwind-entropy.mjs | HIGH+ |
| RESPONSIVE_DRIFT | Missing 2xl: steps, inconsistent chains | scan-tailwind.mjs | MEDIUM+ |
| FRAGMENT_CLONE | Button/input/dialog styled outside canonical primitives | tailwind-entropy.mjs | CRITICAL/HIGH |
| OVERFLOW_RISK | whitespace-nowrap without truncate, fixed-width + overflow-hidden | tailwind-entropy.mjs | HIGH+ |
| HUGE_DESKTOP_RISK | Unbounded sections at 2xl, missing grid steps | tailwind-entropy.mjs | MEDIUM+ |
| ICON_DENSITY_RISK | Non-canonical icon sizes | tailwind-entropy.mjs | LOW |

### Severity Model

| Severity | Description | CI Behavior |
|---|---|---|
| CRITICAL | Pattern breaks mobile layout or all locales | Always blocks CI |
| HIGH | Repeated primitive clones, locale-unsafe widths, missing 2xl grids | Blocks CI if above baseline |
| MEDIUM | Repeated arbitrary spacing, inconsistent chains | Warning only |
| LOW | Minor ordering drift, isolated arbitrary values | Report only |
| INFO/MANUAL_REVIEW | Dynamic class composition requiring review | Report only |

### CI Behavior

- `npm run governance:tailwind` — CI gate, fails on baseline regression
- `node scripts/governance/tailwind-entropy.mjs` — deep analysis, report only
- `node scripts/governance/tailwind-entropy.mjs --report` — write JSON + Markdown report
- Weekly scheduled: `npm run governance:report` auto-commits report to `docs/governance-reports/weekly/`

### Allowlist Policy

File: `scripts/governance/tailwind-entropy.allowlist.json`

- Every HIGH/CRITICAL exception MUST be in the allowlist
- Allowlist entries expire quarterly (max 6 months)
- CRITICAL suppression requires written justification in `why_safe`
- No blanket directory allowlisting

### Baseline Policy

File: `scripts/governance/baseline.json`

- Pre-existing violations are in baseline (technical debt, not blocking)
- New violations above baseline fail CI immediately
- Run `npm run governance:update-baseline` after fixing violations (reduces counts)
- NEVER increase baseline to accommodate new violations

### Report Locations

| Type | Location |
|---|---|
| Weekly governance report (auto) | `docs/governance-reports/weekly/weekly-YYYY-MM-DD.md` |
| Monthly Tailwind entropy report | `docs/governance-reports/monthly/monthly-YYYY-MM-tailwind-entropy.md` |
| Machine-readable JSON | `scripts/governance/reports/tailwind-entropy.latest.json` |
| Entropy audit baseline doc | `docs/tailwind-entropy-audit.md` |

### Interpretation Guide

1. **CRITICAL FRAGMENT_CLONE** → Migrate to canonical primitive (Dialog/Sheet/Button/Input)
2. **HIGH DUPLICATE_CHAIN** → Extract to CSS utility in globals.css or shadcn component
3. **HIGH ARBITRARY_VALUE** → Replace with canonical token or add to allowlist with reason
4. **MEDIUM RESPONSIVE_DRIFT** → Add missing 2xl: step or use container-wide
5. **MEDIUM OVERFLOW_RISK** → Add truncate + overflow-hidden or remove whitespace-nowrap


---

## §8 — RESPONSIVE SCREENSHOT GOVERNANCE (Phase 5)

**Established:** 2026-05-18  
**Reference:** `docs/responsive-screenshot-governance.md`, `docs/responsive-screenshot-matrix.md`

### Screenshot Requirement Triggers

Responsive screenshot capture is **required** when any PR changes:
- UI components listed in `docs/responsive-screenshot-matrix.md §3`
- Tailwind responsive classes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`)
- Container or grid layout classes
- Components rendering differently per locale
- Touch-target or interactive element sizing

### Screenshot Commands

```bash
# Validate infrastructure (no browser required — CI-safe):
npm run governance:screenshots

# Capture fast-check matrix (6 viewports × 4 locales):
npm run screenshots:responsive

# Capture full matrix (15 viewports × 4 locales):
npm run screenshots:responsive -- --full
```

### Screenshot Infrastructure Status

| Component | Status |
|---|---|
| Playwright installed | ✅ devDependency |
| Browser required | `npx playwright install chromium` (one-time) |
| Storybook build required | `npm run build-storybook` |
| Output folder | `.screenshots/responsive/YYYY-MM-DD/` |
| Gitignored | ✅ Yes |
| CI screenshot gate | ❌ Phase 6 (avoid making CI slow/flaky) |

### Huge Desktop Regression Checks

At every quarterly audit, run:
```bash
npm run build-storybook
npm run screenshots:responsive -- --full
```
Then manually review:
- `system-listinggrid--huge-desktop__*__huge-2560.png` — must show 4 columns
- `system-containers--container-wide__*__huge-2560.png` — must not stretch full width

### Violations

| Finding | Severity |
|---|---|
| Listing grid shows < 4 columns at 2560px | HIGH |
| Public page stretches full 2560px width | HIGH |
| Ukrainian text overflows at any breakpoint | MEDIUM |
| Screenshot infrastructure broken (`governance:screenshots` fails) | MEDIUM |

---

## §9 — COMPONENT CATALOG ENFORCEMENT (Phase 6)

**Established:** 2026-05-18  
**Reference:** `docs/component-catalog-governance.md`, `docs/component-catalog.md`

### Commands

```bash
npm run governance:components   # fast check (CI-safe, exit 0 if ready)
npm run catalog:components      # regenerate catalog docs + JSON
```

### Pre-task component check

Before creating any new component, run:
```bash
npm run catalog:components
grep -i "ComponentName" docs/component-catalog.md
```
Verify no equivalent component exists.

### Monthly catalog maintenance

Run `npm run catalog:components` at each monthly audit to refresh the catalog.
Review `docs/component-risk-register.md` for new items.

### Violations classification

| Finding | Severity |
|---|---|
| New raw `<button>` created | HIGH |
| New `div.fixed.inset-0` modal overlay created | HIGH |
| New viewport JS in render path | HIGH |
| New component without catalog update | MEDIUM |
| Canonical primitive duplicated | HIGH |
| Component with `suppressHydrationWarning` | CRITICAL |
| Grid without `2xl:` step | MEDIUM |
| Arbitrary Tailwind value without allowlist entry | MEDIUM |
