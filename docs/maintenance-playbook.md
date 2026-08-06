# Maintenance Playbook — Lero.al
**Phase 1 of Future Maintenance Direction Epic**
Established: 2026-05-18
Status: PERMANENT OPERATIONAL REFERENCE

This playbook defines how to conduct recurring governance, audits, and maintenance sessions for the Lero.al project. It is the operational companion to `docs/governance-enforcement.md`.

---

## §1 — MAINTENANCE CADENCE OVERVIEW

| Cadence | When | Output | Owner |
|---|---|---|---|
| Weekly governance scan | End of each sprint/week | `docs/governance-reports/weekly/weekly-YYYY-MM-DD.md` | Claude Code or developer |
| Monthly responsive audit | First Monday of month | `docs/governance-reports/monthly/monthly-YYYY-MM.md` | Claude Code or developer |
| Monthly Tailwind entropy audit | First Monday of month | Appended to monthly report | Claude Code or developer |
| Monthly primitive audit | First Monday of month | Appended to monthly report | Claude Code or developer |
| Quarterly huge-desktop audit | First Monday of quarter | `docs/governance-reports/quarterly/quarterly-YYYY-qN.md` | Claude Code or developer |
| Quarterly localization audit | First Monday of quarter | Appended to quarterly report | Claude Code or developer |

---

## §2 — WEEKLY GOVERNANCE SCAN PLAYBOOK

**Time estimate:** 15–30 minutes.

### Step 1: Run automated grep scans

```bash
# From project root

# 1. Primitive violations
grep -rn "<button" src/ --include="*.tsx" | grep -v "ui/button\|'use client'\|//\|shadcn"
grep -rn "className.*h-11" src/ --include="*.tsx" | grep -v "size-11\|icon-xl"
grep -rn "fixed inset-0" src/ --include="*.tsx" | grep -v "Sheet\|Dialog\|sheet\|dialog"

# 2. Navigation violations
grep -rn "window\.location\.href" src/ --include="*.tsx"
grep -rn "window\.location\.replace\|window\.location\.assign" src/ --include="*.tsx"

# 3. Hydration risk
grep -rn "typeof window\|useWindowSize\|window\.innerWidth\|window\.outerWidth" src/ --include="*.tsx"
grep -rn "suppressHydrationWarning" src/ --include="*.tsx"

# 4. Icon library violations
grep -rn "from '@heroicons\|from 'react-icons\|from 'feather-icons\|from 'phosphor" src/ --include="*.tsx"

# 5. i18n violations (basic check)
grep -rn "placeholder=\"[A-Z]\|placeholder='[A-Z]" src/ --include="*.tsx"
```

### Step 2: Review scan results

For each finding:
- Classify severity using the escalation matrix in `governance-enforcement.md §3`
- Document findings in the weekly report
- Create fix tasks for MEDIUM+ findings

### Step 3: Create weekly report

File: `docs/governance-reports/weekly/weekly-YYYY-MM-DD.md`

Use Checklist C from `governance-checklists.md`.

### Step 4: Update backlog if needed

If MEDIUM or HIGH findings exist:
- Add fix tasks to `docs/backlog.md` under "Next Immediate Tasks"
- Assign severity label to each task

---

## §3 — MONTHLY AUDIT PLAYBOOK

**Time estimate:** 60–90 minutes.

### Step 1: Open Chrome DevTools responsive mode

For each key surface (homepage, listings, listing detail, admin, cabinet, auth):
1. Step through breakpoints: 320 → 375 → 768 → 1024 → 1440 → 1920 → 2560
2. Use Checklist D from `governance-checklists.md`
3. Screenshot any issues found

### Step 2: Run Tailwind entropy scan

```bash
# Count arbitrary values in className attributes
grep -rn "\[.*\]" src/ --include="*.tsx" | grep "className" | wc -l

# List all arbitrary padding values
grep -rn "py-\[" src/ --include="*.tsx"
grep -rn "px-\[" src/ --include="*.tsx"

# List non-canonical spacing
grep -rn " py-7\b\| py-10\b\| py-13\b\| py-15\b" src/ --include="*.tsx"
```

### Step 3: Run primitive duplication audit

```bash
# Count raw buttons
grep -rn "<button" src/ --include="*.tsx" | grep -v "//\|ui/button" | wc -l

# Count custom overlays
grep -rn "fixed inset-0" src/ --include="*.tsx" | grep -v "Sheet\|Dialog" | wc -l

# Count local tab clones
grep -rn "role=\"tab\"" src/ --include="*.tsx" | grep -v "ui/tabs" | wc -l

# Count container mx-auto usage on public pages (should be container-wide)
grep -rn "container mx-auto" src/app/\[locale\]/ --include="*.tsx" | wc -l
```

### Step 4: Create monthly report

File: `docs/governance-reports/monthly/monthly-YYYY-MM.md`

Structure:
```markdown
# Monthly Governance Report — YYYY-MM
Date: YYYY-MM-DD

## Responsive Audit
[Checklist D results]

## Tailwind Entropy
- Total arbitrary values: N (delta: +/- N from last month)
- Non-canonical spacing found: [list]
- Action required: YES / NO

## Primitive Duplication
- Raw buttons: N
- Custom overlays: N
- Local tab clones: N
- Action required: YES / NO

## Findings
### HIGH
- [finding list]

### MEDIUM
- [finding list]

### LOW
- [finding list]

## Recommended Actions
- [prioritized list]
```

### Step 5: Update backlog

- Add HIGH findings as priority tasks in `docs/backlog.md`
- MEDIUM findings: add to backlog with lower priority
- LOW findings: document in report only (no backlog entry)

---

## §4 — QUARTERLY AUDIT PLAYBOOK

**Time estimate:** 2–3 hours.

### Step 1: Huge-desktop audit

1. Open Chrome at 1920px and 2560px width
2. Check each public page:
   - Does content have a max-width? (should be container-wide / max 88rem)
   - Do listing grids show 4 columns at 2560px? (2xl:grid-cols-4)
   - Is section padding scaled at 2xl:? (2xl:py-20)
   - Is section typography scaled at 2xl:? (2xl:text-3xl)
3. Check admin:
   - Does admin shell have a max-width at 2560px?
   - Are admin tables readable at 2560px?

### Step 2: Localization audit

For each locale (sq, en, uk, it):
1. Switch locale via the locale switcher in the app
2. Check key surfaces at 320px, 768px, 1440px:
   - No toolbar overflow
   - No modal/dialog overflow
   - No navigation link wrapping
   - Cards show text correctly
3. Focus extra attention on Ukrainian (uk) — longest strings

### Step 3: Accessibility audit

```bash
# Find icon-only buttons potentially missing aria-label
grep -rn 'size="icon"' src/ --include="*.tsx" -A 3 | grep -B 1 -v "aria-label"

# Find Sheet/Dialog usage (verify they're all shadcn)
grep -rn "import.*Sheet\|import.*Dialog" src/ --include="*.tsx"
```

Manual tab navigation:
1. Homepage — tab through all interactive elements
2. Listings — tab through filters, cards, pagination
3. Admin table — tab through table actions
4. Cabinet — tab through tabs and forms

### Step 4: Update governance matrices

After the audit, update the matrices in `governance-enforcement.md §8`:
- Update the Responsive Validation Matrix with new findings
- Update any newly discovered drift patterns in the Drift Detection Matrix
- Update the Primitive Governance Matrix if new canonical patterns were established

### Step 5: Create quarterly report

File: `docs/governance-reports/quarterly/quarterly-YYYY-qN.md`

Structure:
```markdown
# Quarterly Governance Report — YYYY-qN
Date: YYYY-MM-DD

## Huge Desktop Audit
[Checklist E huge desktop section results]

## Localization Audit
[Checklist E localization section results]

## Accessibility Audit
[Checklist E accessibility section results]

## Architecture Health
[Checklist E architecture section results]

## Governance Drift Review
- New anti-patterns added to ai-behavior.md: YES / NO
- Governance matrices updated: YES / NO

## Findings Summary
[Severity-classified findings]

## Migration Recommendations
[List of recommended migration phases for next quarter]
```

### Step 6: Update governance documents

After quarterly audit:
- If new anti-patterns found: add to `docs/ai-behavior.md`
- If new canonical patterns defined: add to `docs/ui-rules.md` and `docs/component-governance.md`
- Update `docs/responsive-governance.md §3` migration priorities

---

## §5 — GOVERNANCE REPORT STORAGE RULES

```
docs/governance-reports/
├── weekly/
│   └── weekly-YYYY-MM-DD.md          ← one file per weekly scan
├── monthly/
│   └── monthly-YYYY-MM.md            ← one file per month
└── quarterly/
    └── quarterly-YYYY-qN.md          ← one file per quarter
```

**Naming examples:**
- `weekly-2026-05-18.md`
- `monthly-2026-05.md`
- `quarterly-2026-q2.md`

**Storage rules:**
- Governance reports MUST NOT be stored in `docs/backlog.md`
- Historical governance logs MUST NOT be appended to `docs/backlog.md`
- Session logs go in `docs/sessions/` — not `docs/governance-reports/`
- Governance reports go in `docs/governance-reports/` — not `docs/sessions/`

---

## §6 — ESCALATION & REMEDIATION WORKFLOW

### When a CRITICAL finding is discovered

1. **Stop current task** (if in progress)
2. Document finding with file, line number, and impact
3. Create an immediate fix task in `docs/backlog.md`
4. Fix the critical issue
5. Verify fix does not introduce regressions
6. Document resolution in the weekly governance report
7. Resume original task

### When HIGH findings accumulate (3+)

1. Document all findings in current report
2. Add dedicated cleanup task to `docs/backlog.md` (priority: before next feature)
3. Schedule for next available sprint

### When MEDIUM findings accumulate (5+)

1. Document in monthly report
2. Add to backlog as a "governance sprint" batch task
3. Schedule within 2 sprints

### When LOW findings accumulate (10+)

1. Document in monthly/quarterly report
2. Create a single batch cleanup task for the next available slow sprint
3. No urgency — schedule at convenience

---

## §7 — AI TASK GOVERNANCE WORKFLOW

For every future Claude Code UI task:

### Before starting
1. Read `docs/governance-enforcement.md` if not read this session
2. Read `docs/ui-rules.md` §1–§11 for scope
3. Complete Pre-Task Governance Gate (Checklist A from `governance-checklists.md`)

### During development
1. Consult `docs/component-governance.md §1` before any new component creation
2. Consult `docs/responsive-governance.md §2` for any responsive patterns
3. Run Checklist F (New Component) or Checklist G (Shared Component Modification) if applicable

### After completing the task
1. Run Post-Task UI Governance Gate (Checklist B from `governance-checklists.md`)
2. All boxes must be checked before marking the task complete
3. Update `docs/backlog.md` (compact summary only — see Backlog & Session Log Rules)
4. Create session log in `docs/sessions/` if session spans multiple tasks

---

## §8 — GOVERNANCE ENFORCEMENT BOUNDARIES

### What governance enforcement covers
- UI primitive usage (Button, Input, Sheet, Dialog, Tabs, Icons)
- Responsive behavior and breakpoint consistency
- Accessibility requirements (touch targets, ARIA, focus)
- Localization safety (all four locales)
- Huge-desktop behavior (containers, grids, typography scaling)
- Tailwind utility governance (canonical scale, no arbitrary growth)
- SSR/hydration safety (no viewport JS, no suppressHydrationWarning)
- i18n completeness (all four locale files)

### What governance enforcement does NOT cover
- Business logic correctness
- Feature completeness
- Performance optimization (separate: `docs/performance.md`)
- Database query correctness (separate: `docs/data-access-rules.md`)
- Authentication flow correctness (separate: `docs/rls-rules.md`)
- Domain model integrity (separate: `docs/domain-rules.md`)

---

## §9 — GOVERNANCE DOCUMENT MAINTENANCE

### When to update governance documents

| Trigger | Document to Update |
|---|---|
| New anti-pattern discovered in review | `docs/ai-behavior.md` — add to anti-pattern section |
| New canonical primitive established | `docs/component-governance.md` + `docs/ui-rules.md` |
| New responsive rule required | `docs/responsive-governance.md` |
| New localization risk identified | `docs/ui-rules.md §11` |
| New SSR/hydration risk identified | `docs/ai-behavior.md` SSR/Hydration section |
| Quarterly audit reveals new migration priorities | `docs/responsive-governance.md §3` |
| New primitive migrated to canonical | `docs/component-governance.md §2` (update migration map) |

### Document freshness rules
- `docs/ai-behavior.md` — update after any task that reveals new anti-patterns
- `docs/ui-rules.md` — update after any new governance decision
- `docs/component-governance.md` — update after any primitive migration or new primitive
- `docs/responsive-governance.md` — update after any responsive audit cycle
- `docs/governance-enforcement.md` — update if cadences or escalation rules change
- `docs/governance-checklists.md` — update if new verification requirements arise
- `docs/maintenance-playbook.md` — update if maintenance procedures change

---

## §10 — TAILWIND ENTROPY MAINTENANCE (Phase 3)

### Weekly Tailwind Entropy Scan

**Already integrated into weekly scan via `npm run governance`.**

Additional steps:
1. Check arbitrary values count delta: `node scripts/governance/tailwind-entropy.mjs | grep "Arbitrary values"`
2. If count increased by >5: investigate which files added them
3. Verify allowlist entries haven't expired: check `tailwind-entropy.allowlist.json` dates

### Monthly Entropy Report

```bash
node scripts/governance/tailwind-entropy.mjs --report
```

Writes to: `docs/governance-reports/monthly/monthly-YYYY-MM-tailwind-entropy.md`

Review:
- Duplicated chain count (target: stable or declining)
- Arbitrary values count (target: stable or declining)
- New HIGH+ findings (must be zero or allowlisted)

### Quarterly Huge-Desktop Utility Review

Check:
1. All listing grids have `2xl:grid-cols-4` — `grep -rn "xl:grid-cols-3" src/ | grep -v "2xl:"`
2. All public sections have container-wide — `grep -rn "min-h-screen" src/app/\[locale\]/ | grep -v "container-wide"`
3. Admin shell has max-width — check `AdminShell.tsx`
4. Update `docs/tailwind-entropy-audit.md §6` Huge Desktop table with findings

### Quarterly Localization Utility Review

Check:
1. Fixed pixel widths on translatable elements — `grep -rn "w-\[.*px\]" src/ | grep -v "tailwind-entropy\|allowlist"`
2. `whitespace-nowrap` usage — `grep -rn "whitespace-nowrap" src/ | grep -v "overflow-hidden\|truncate"`
3. Test with uk locale at 320px, 375px, 768px for toolbar wrapping
4. Update `docs/tailwind-entropy-audit.md §5` Localization table with findings

### Allowlist Review Cadence

**Quarterly: first Monday of each quarter.**

For each entry in `scripts/governance/tailwind-entropy.allowlist.json`:
1. Is the `expires` date past? If yes: evaluate if still needed
2. Is the underlying issue fixed? If yes: remove entry, update baseline
3. Is the `why_safe` still accurate? If no: update or remove

### Baseline Burn-Down Process

When violations are fixed:
1. Verify the fix: run `npm run governance` — count must have decreased
2. Update baseline: `npm run governance:update-baseline`
3. Commit updated `scripts/governance/baseline.json`
4. Update `docs/tailwind-entropy-audit.md §1` summary counts

Target: reduce HIGH findings from current 52 (primitives) toward 0 over upcoming sprints.

### Escalation Rules

| Condition | Action |
|---|---|
| Arbitrary values count increases >10 since last audit | Create entropy cleanup task, MEDIUM priority |
| New duplicate chain not in canonical fragments | Add to `docs/tailwind-canonical-fragments.md`, MEDIUM |
| New fixed px width on nav/modal/button | Immediate fix, HIGH |
| New `whitespace-nowrap` without truncation | Fix in same PR, MEDIUM |
| Allowlist entry expired | Review and renew or remove, LOW |

---

## §11 — STORYBOOK MAINTENANCE (Phase 4)

### When to run Storybook locally
- After adding a new shared component (verify story renders)
- Before a PR that modifies canonical UI primitives
- During governance audit to spot-check visual consistency

```bash
npm install       # required if storybook not yet installed
npm run storybook # opens http://localhost:6006
```

### When to run Storybook build validation
```bash
npm run governance:storybook
# or
npm run build-storybook
```
Run when: modifying .storybook/*, adding new stories, before major releases.

### Monthly story coverage review
During the monthly governance audit, verify:
- All new shared components added this month have stories
- No stories have been broken by component API changes
- Stories still represent the correct canonical usage

### Storybook upgrade cadence
Storybook follows a regular release cadence. Upgrade when:
- A security vulnerability is reported
- A major Next.js compatibility issue arises
- The current version reaches end-of-life

Do NOT upgrade Storybook as part of a UI task — create a dedicated chore task.

### Allowlist review for Storybook
Story files are scanned by governance scripts. If a story intentionally uses a
pattern that triggers a governance warning (e.g., demonstrating an anti-pattern),
add an inline `// storybook-docs-only` comment and add to the allowlist.

---

## §12 — RESPONSIVE SCREENSHOT REVIEW PROCESS

**Reference:** `docs/responsive-screenshot-governance.md`, `docs/responsive-screenshot-matrix.md`

### Weekly — after any UI component change

```bash
npm run build-storybook          # ~3–5 min
npm run screenshots:responsive   # fast-check matrix (~2–3 min)
# Review .screenshots/responsive/YYYY-MM-DD/ in file manager
```

**What to check (fast-check):**
1. Open `.screenshots/responsive/YYYY-MM-DD/` sorted by story name
2. For each primitive story: compare `mobile-320` and `mobile-375` — no overflow
3. For each system story: compare `desktop-1280` and `huge-2560` — correct grid cols
4. For all stories: compare `__en__` vs `__uk__` at same viewport — Ukrainian text fits

### Monthly — responsive regression sweep

```bash
npm run build-storybook
npm run screenshots:responsive -- --full   # all 15 viewports × 4 locales
```

Review priority order:
1. `*__uk__mobile-320.png` — maximum stress (Ukrainian × narrowest)
2. `*__uk__mobile-375.png` — typical mobile × stress locale
3. `system-featuredlistings--default__*__huge-2560.png` — 4-column grid check
4. `system-containers--container-wide__*__huge-2560.png` — container bounds check

### Quarterly — full screenshot audit

Run full matrix and compare against previous quarterly run if available.

```bash
npm run build-storybook
npm run screenshots:responsive -- --full
# Compare with .screenshots/responsive/ from previous quarter (manual)
```

### Governance check (CI-safe, no browser)

```bash
npm run governance:screenshots   # validates infrastructure, exits 0 if ready
```

This runs as part of governance validation without requiring Playwright browsers.

### Browser installation (one-time)

```bash
npx playwright install chromium
```

Run once per developer machine. Not required for CI (governance:screenshots uses --check mode).

---

## §13 — COMPONENT CATALOG REVIEW PROCESS

**Reference:** `docs/component-catalog-governance.md`

### Monthly — component catalog refresh

```bash
npm run catalog:components
# Review docs/component-risk-register.md for new/changed items
```

Check:
1. Any new `MANUAL_REVIEW` components introduced this month?
2. Any NEEDS_STORY items that can be closed with a story PR?
3. Any arbitrary Tailwind values that should be in the allowlist?

### Quarterly — canonical component review

```bash
npm run catalog:components
```

Review:
1. `docs/component-catalog.md §Canonical UI Primitives` — all should be CANONICAL
2. `docs/component-risk-register.md §Governance Violations` — triage each flag
3. `docs/component-risk-register.md §Storybook Coverage Gap` — create story tasks
4. Any DEPRECATED_CANDIDATE components that can be removed?
5. Update `docs/component-catalog-governance.md` if new patterns emerge

### Storybook / screenshot coverage burn-down

Target: progressively add stories for NEEDS_STORY shared-ui and admin-shared components.
Priority order from `docs/component-coverage-matrix.md §Coverage Gaps`.

For each story added:
1. Follow `docs/storybook-governance.md §3`
2. Add to screenshot matrix if the component has responsive/locale risk
3. Re-run `npm run catalog:components` to update status
