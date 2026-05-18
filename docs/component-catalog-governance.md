# Component Catalog Governance — Lero.al
**Phase 6 of Future Maintenance Direction Epic**
Established: 2026-05-18
Status: PERMANENT GOVERNANCE REFERENCE

This document defines the rules for the component cataloging system.
Machine-readable catalog: `scripts/governance/reports/component-catalog.latest.json`
Human-readable catalog: `docs/component-catalog.md`
Coverage matrix: `docs/component-coverage-matrix.md`
Risk register: `docs/component-risk-register.md`

---

## §1 — COMPONENT CLASSIFICATION MODEL

Every component is classified by **type**:

| Type | Location | Description |
|---|---|---|
| `canonical-primitive` | `src/components/ui/` | shadcn/base-ui primitives — canonical usage points |
| `shared-ui` | `src/components/shared/` | Reusable domain-agnostic components |
| `layout` | `src/components/layout/` | Page structure and navigation |
| `admin-shared` | `src/components/admin/` | Admin-panel-specific shared components |
| `auth-feature` | `src/modules/auth/` | Authentication feature components |
| `cabinet-feature` | `src/modules/cabinet/` | User cabinet feature components |
| `listings-feature` | `src/modules/listings/` | Listings feature components |
| `locations-feature` | `src/modules/locations/` | Location feature components |
| `notifications-feature` | `src/modules/notifications/` | Notification feature components |
| `page` | `src/app/**/page.tsx` etc. | Route-level components |
| `unknown` | Any | Needs manual classification |

---

## §2 — GOVERNANCE STATUS VALUES

| Status | Meaning |
|---|---|
| `CANONICAL` | Canonical UI primitive with colocated story — fully compliant |
| `APPROVED` | Approved component with no critical flags |
| `NEEDS_STORY` | Should have a Storybook story — queue for story addition |
| `NEEDS_SCREENSHOT_COVERAGE` | Should be in responsive screenshot matrix |
| `NEEDS_LOCALIZATION_REVIEW` | Uses translated text — not yet reviewed for all locales |
| `NEEDS_RESPONSIVE_REVIEW` | Has layout concerns — not yet reviewed at all breakpoints |
| `DEPRECATED_CANDIDATE` | Should be removed or replaced — document migration path |
| `MANUAL_REVIEW` | Has static analysis flags — requires human review |

---

## §3 — WHEN A NEW COMPONENT IS ALLOWED

A new component may be created ONLY when:

1. The catalog (`npm run catalog:components`) was checked for existing similar components
2. Existing canonical primitives cannot satisfy the requirement
3. Existing shared components cannot be extended to satisfy the requirement
4. The component has a single, well-defined responsibility
5. The component name follows PascalCase
6. The component is placed in the correct source directory

### Decision flow before creating a new component:

```
Is it a generic UI primitive (button, input, etc.)?
  → Use existing canonical primitive from src/components/ui/
  → NEVER create a local primitive clone

Is it reusable across multiple modules?
  → Place in src/components/shared/
  → Check catalog for existing Combobox, LocaleSwitcher, etc.

Is it admin-panel-specific?
  → Place in src/components/admin/
  → Check for similar AdminXxx components

Is it module-specific?
  → Place in src/modules/{module}/components/
  → Must not import from other modules
```

---

## §4 — WHEN A STORY IS REQUIRED

A Storybook story is **required** when:

| Component type | Story required? |
|---|---|
| `canonical-primitive` | ✅ Required |
| `shared-ui` with `useTranslations` | ✅ Required |
| `layout` with visible UI | ✅ Required |
| `admin-shared` used in 2+ admin pages | ✅ Required |
| `auth-feature` or `cabinet-feature` | ⚠️ Recommended |
| `listings-feature` with complex layout | ⚠️ Recommended |
| `page` route | ❌ Not required |

Story must follow rules in `docs/storybook-governance.md`.

---

## §5 — WHEN SCREENSHOT COVERAGE IS REQUIRED

Add a component to the screenshot target list in `scripts/responsive-screenshots.mjs` when:
- It is a canonical primitive with visible text
- It has a responsive layout that changes across breakpoints
- It renders locale-sensitive text (especially toolbars, dialogs, filters)
- It contains a grid or container with `2xl:` behavior

See `docs/responsive-screenshot-matrix.md §3` for the current target list.

---

## §6 — CANONICAL vs APPROVED vs DEBT CLASSIFICATION

**CANONICAL:**
- Only `src/components/ui/` primitives
- Must have a colocated `.stories.tsx` file
- Must use only canonical patterns (no raw `<button>`, no arbitrary Tailwind without reason)
- Upgrade path: add story → becomes CANONICAL

**APPROVED:**
- No governance flags (no RAW_BUTTON, CUSTOM_OVERLAY, VIEWPORT_JS, SUPPRESS_HW)
- May have arbitrary Tailwind if documented in allowlist
- May lack stories (queue for NEEDS_STORY)

**MANUAL_REVIEW (debt):**
- Has at least one governance flag
- Must be reviewed quarterly
- Each flag is a migration task — add to backlog when time budget allows

---

## §7 — COMPONENT OWNERSHIP AND STATUS DOCUMENTATION

When adding a new component, document in the file header (if non-obvious):

```tsx
// COMPONENT: ComponentName
// Type: shared-ui | canonical-primitive | admin-shared | ...
// Status: APPROVED | CANONICAL | NEEDS_STORY
// Story: src/components/ui/component-name.stories.tsx (or: NONE — ticket #NNN)
// Screenshot: primitives-component-name--default (or: NONE — queue for Phase 6)
// Locales: all 4 (sq/en/uk/it) reviewed on YYYY-MM-DD
```

This is optional for simple components but required for shared-ui and admin-shared components.

---

## §8 — DEPRECATION AND MIGRATION RULES

A component is a deprecation candidate when:
- It duplicates a canonical primitive (local button clone, custom overlay, etc.)
- It is no longer imported anywhere in the project
- It was built for a feature that was removed

**Deprecation process:**
1. Mark status as `DEPRECATED_CANDIDATE` in a catalog update PR
2. Add migration comment in the file: `// DEPRECATED: use XxxComponent instead`
3. Create a migration task in the backlog
4. Remove only after all consumers have been migrated

---

## §9 — LOCALIZATION REQUIREMENTS FOR COMPONENTS

All components that render user-visible text MUST:
- Use `useTranslations()` — never hardcode strings
- Work correctly in all 4 locales: `sq`, `en`, `uk`, `it`
- Not use fixed widths for elements containing translatable text
- Support Ukrainian (`uk`) — longest strings — without overflow

Components using `useTranslations` are flagged `LOCALIZATION` risk.
Review at `uk × mobile-320` (maximum stress) before marking as APPROVED.

---

## §10 — RESPONSIVE BREAKPOINT REQUIREMENTS

Any component with layout styling MUST:
- Be mobile-first: base styles for 320px, scale up with `sm:`/`md:`/`lg:`/`xl:`/`2xl:`
- NOT use viewport JS (`typeof window`, `useWindowSize`, `window.innerWidth`)
- Use canonical container (`.container-wide`) on public-facing containers
- Use `2xl:grid-cols-4` on listing card grids

Components with grid layouts missing `2xl:` steps are flagged `HUGE_DESKTOP` risk.

---

## §11 — HUGE DESKTOP REQUIREMENTS (2560px)

The 2560px viewport is the primary regression check. Every component:
- MUST be bounded — no full-width stretch at 2560px
- MUST use `.container-wide` or explicit `max-w-*` on public surfaces
- Listing grids MUST have `2xl:grid-cols-4` (4 columns at 1536px+)
- Admin grids MUST be bounded by `max-w-6xl` or similar

---

## §12 — TAILWIND ENTROPY REQUIREMENTS

- Prefer canonical utility fragments from `docs/tailwind-canonical-fragments.md`
- Arbitrary values `[value]` require justification in `tailwind-entropy.allowlist.json`
- Components with arbitrary Tailwind are flagged `ARBITRARY_TW`
- Add to allowlist with reason, or replace with canonical token

---

## §13 — ACCESSIBILITY EXPECTATIONS

Every interactive component MUST:
- Be keyboard-navigable (Tab, Enter/Space for activation)
- Have visible focus ring (`focus-visible:ring-2 focus-visible:ring-ring`)
- Have `aria-label` on icon-only buttons
- Use shadcn Dialog/Sheet (built-in focus trap) — never `div.fixed.inset-0`
- Meet 44px touch target on mobile (`size="xl"` or `min-h-[44px]`)

---

## §14 — FORBIDDEN COMPONENT ANTI-PATTERNS

These MUST NOT be created in any new component:

- **Raw `<button>` elements** — use `Button` from `@/components/ui/button`
- **Custom dialog overlays** — `div.fixed.inset-0` replacing `Sheet`/`Dialog`
- **Viewport JS** — `typeof window`, `useWindowSize`, `window.innerWidth`
- **suppressHydrationWarning** — masks hydration contract violations
- **window.location.href** — use `router.push` from `next/navigation`
- **Hardcoded text strings** — use `useTranslations`
- **Fixed widths for translated text** — locale overflow risk
- **Non-lucide icons** — only `lucide-react` icons allowed
- **Local primitive clones** — never recreate Button, Input, Dialog, Sheet, Tabs
- **Arbitrary breakpoints** — only canonical Tailwind breakpoints (`sm:`/`md:`/`lg:`/`xl:`/`2xl:`)

---

## §15 — CATALOG MAINTENANCE CADENCE

| Cadence | Action |
|---|---|
| Per-UI-task | Run `npm run governance:components` before and after |
| Monthly | Run `npm run catalog:components` to refresh docs |
| Quarterly | Review `docs/component-risk-register.md` — close resolved items |
| When adding component | Update catalog immediately via `npm run catalog:components` |

---

## §16 — CATALOG COMMANDS

```bash
# Fast infrastructure check (CI-safe):
npm run governance:components

# Full catalog scan + docs regeneration:
npm run catalog:components

# View generated catalog:
# docs/component-catalog.md
# docs/component-coverage-matrix.md
# docs/component-risk-register.md
# scripts/governance/reports/component-catalog.latest.json
```
