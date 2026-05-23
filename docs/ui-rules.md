# UI Rules & Governance — Lero.al

## Reference & Inspiration
- Primary reference: https://dom.ria.com/ — study its listing cards, search filters, listing detail page, user cabinet, photo gallery.
- Follow modern real estate marketplace UX patterns.
- Albanian market context: users expect simple, fast, mobile-friendly experience.

## UI Rules (Gate)

### Must
- No hardcoded user-visible text in UI. Use i18n keys (messages/*.json) or DB-driven content.
- No hardcoded colors. Use semantic tokens only (globals.css via semantic utility classes).
- If a UI pattern is missing, create a reusable component first, then use it.
- If blocked, apply the smallest safe local fix, then immediately extract/refactor into a reusable component.
- Dropdowns must use the project Combobox pattern (input + popover list). Do not use Select components for UI dropdowns.

### Prefer
- Fix styling in shared/module components or src/components/ui/*, not via one-off patches in pages.
- Keep controls consistent (size, spacing, focus) by reusing existing components.

### Canonical Primitive Quick Reference

| Primitive | Canonical | Location |
|---|---|---|
| Button | `Button` with `size` + `variant` | `@/components/ui/button` |
| Input | `Input` | `@/components/ui/input` |
| Icon family | lucide-react only | — |
| Tabs | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | `@/components/ui/tabs` |
| Dialog/Modal | `Dialog`, `DialogContent` etc. | `@/components/ui/dialog` |
| Sheet/Drawer | `Sheet`, `SheetContent` etc. | `@/components/ui/sheet` |
| Combobox | `Combobox` | `@/components/shared/Combobox` |
| Location select | `LocationCombobox` | `@/components/shared/LocationCombobox` |
| Mobile nav | `LocaleSwitcher` | `@/components/shared/LocaleSwitcher` |
| Mobile drawer | `Sheet side="left"` or `side="right"` | `@/components/ui/sheet` |
| Confirmation popup | `Dialog` | `@/components/ui/dialog` |

### §0 — Single-source-of-truth for shared controls (enforced 2026-05-22)

**Combobox (Note 1 — canonical answer to "do we need separate comboboxes?").** No. There is exactly
ONE canonical selection primitive: `Combobox` (`@/components/shared/Combobox`) with the
`ComboboxOption` type. It already covers every case via the `variant` prop:
`variant="input"` (searchable, long lists) and `variant="button"` (click-to-open, NO typing — for
short static lists, so the mobile keyboard does NOT appear).
- Domain selectors (`LocationCombobox`, `YearCombobox`, `PropertyTypeCombobox`, the currency selector,
  the phone country-code selector) MUST be **thin wrappers** that only supply options/data and
  delegate ALL popover / list / filtering / keyboard / a11y behaviour to the canonical `Combobox`.
- NEVER create a parallel combobox implementation, a local `Select`-based domain dropdown, or a
  second popover-list component. A wrapper that re-implements the dropdown internals is a violation —
  fold it back into the canonical `Combobox`.
- Non-typeable lists MUST use `variant="button"` (prevents the mobile keyboard popping up — Note 12).

**Button (Note 6 — single source per type).** Every button of the same semantic type MUST render
through the same canonical `Button` configuration — one shared `size`+`variant` (and, where the type
recurs, a single shared wrapper component), never ad-hoc per-button styling.
- Header icon-action buttons (e.g. Notifications, Favorites) are ONE type and MUST be visually
  identical: same shape, size, radius, hover/active state. Hand-styling one and leaving the other
  different is a governance violation — extract a single canonical icon-button and use it everywhere.

**Composition (no conflicting baked-in styles).** A shared/canonical component MUST NOT hardcode
structural styles (shape, width, height, radius, padding) into its base that fight the `className` a
caller passes — that breaks composition and makes the component render inconsistently across surfaces.
- Example defect (2026-05-22): `FavoriteButton` bakes `rounded-full w-8 h-8 p-0` into its base; when
  `ListingContact` passes `flex-1 h-9 rounded-xl border`, the heart refuses to size/shape like its
  sibling pills (Save-to-collection / Share). The fix is to express shape/size as a `variant`/`size`
  prop (like canonical `Button`), not a fixed base + className tug-of-war.
- Rule: structural variants belong in the component's API (props/variants); callers tune layout
  (`flex-1`, margins) only. If a component must look different per surface, add a variant — never rely
  on `className` overriding baked-in structural classes.

**Responsive is non-negotiable.** Every interactive control must meet the touch-target (§8) and
breakpoint rules (§7) at all seven widths (320/375/390/768/1280/1440/2560). "It looks fine on my
desktop" is not verification — the canonical task template requires all seven.

---

## §1 — CANONICAL SPACING GOVERNANCE

### Section Spacing Scale

| Token | Value | Use |
|---|---|---|
| Section tight | `py-8 md:py-12` | Compact informational sections |
| Section standard | `py-12 md:py-16` | Standard homepage/listing sections |
| Section wide | `py-16 md:py-24` | Hero sections, major CTAs |

**Rules:**
- Use `py-12 md:py-16` for standard content sections (homepage featured, latest, popular locations, how-it-works, agent CTA).
- Never use arbitrary padding like `py-7`, `py-10`, `py-13`, `py-15`.
- `2xl:py-20` may be added in Phase 4 for large-screen adaptation.

### Card Spacing

| Context | Padding | Radius |
|---|---|---|
| Standard content card | `p-5` | `rounded-2xl` |
| Compact card (listing, table row) | `p-3` | `rounded-xl` |
| Modal/dialog content | `p-6` | `rounded-2xl` |
| Form section | `p-4 md:p-6` | `rounded-2xl` |

**Rules:**
- Admin cards: `bg-card rounded-2xl border shadow-sm p-5` — canonical.
- Listing cards: `rounded-xl border bg-card` with `p-3` content — canonical (compact).
- Never mix `rounded-xl` and `rounded-2xl` in the same visual context.

### Toolbar Spacing

| Context | Padding | Gap |
|---|---|---|
| Page toolbar | `py-4 px-0` | `gap-2` |
| Admin page inner | `p-6 lg:p-8` | — |
| Sidebar sticky container | `p-5` | `gap-3` |

### Modal Spacing

| Context | Padding |
|---|---|
| Dialog content | `p-6` |
| Dialog header | `p-6 pb-0` |
| Dialog footer | `p-6 pt-0` |

### Form Spacing

| Context | Spacing |
|---|---|
| Field gap | `gap-4` |
| Section gap | `gap-6` |
| Form wrapper | `gap-6 md:gap-8` |

---

## §2 — CANONICAL TYPOGRAPHY GOVERNANCE

### Type Scale

| Token | Classes | Use |
|---|---|---|
| Page title / H1 | `text-2xl sm:text-3xl font-bold` | Page headings |
| Hero title | `text-3xl sm:text-4xl md:text-5xl font-bold leading-tight` | Hero sections |
| Section heading / H2 | `text-xl sm:text-2xl font-bold` | Section headings |
| Subsection / H3 | `text-lg font-semibold` | Card titles, subsections |
| Label / H4 | `text-sm font-semibold` | Card titles, compact headings |
| Group label | `text-xs font-semibold uppercase tracking-widest text-muted-foreground` | Section group labels (sidebar, admin nav) |
| Body | `text-sm leading-relaxed` | Body text (also default) |
| Caption | `text-xs text-muted-foreground` | Metadata, captions |
| Micro | `text-[10px]` | Badges, tiny labels |

**Rules:**
- Use `text-[10px]` only for badges and truly tiny labels. Never for body content.
- Section headings MUST use `text-xl sm:text-2xl font-bold` — no deviations.
- Group labels (sidebar nav groups, filter section labels) MUST use `text-xs font-semibold uppercase tracking-widest`.
- `2xl:text-3xl` may be added in Phase 4 for huge-desktop section heading adaptation.

### Responsive Typography Rules

- Always write mobile-first: start small, scale up with `sm:` or `md:` prefixes.
- Hero titles: required to have responsive steps (text-3xl sm:text-4xl md:text-5xl).
- Section headings: required to have at least one responsive step (text-xl sm:text-2xl).
- No static `text-2xl` or larger on elements that appear on mobile without a responsive step.

---

## §3 — CANONICAL BUTTON GOVERNANCE

**Canonical source:** `Button` from `@/components/ui/button`  
**Underlying primitive:** `@base-ui/react/button`

### Button Sizes

| Size | Height | Touch Safe | Approved Usage |
|---|---|---|---|
| `xs` | 24px | ❌ | Admin table micro-actions only |
| `sm` | 28px | ❌ | Desktop secondary actions only |
| `default` | 32px | ❌ | Desktop standard actions |
| `lg` | 36px | ❌ | Desktop emphasized actions |
| `xl` | 44px | ✅ | All mobile-reachable primary actions |
| `icon` | 40px | ⚠️ | Desktop icon buttons |
| `icon-xl` | 44px | ✅ | Mobile icon buttons |
| `icon-sm` | 28px | ❌ | Admin table icon actions |
| `icon-xs` | 24px | ❌ | Admin table micro icon actions |
| `icon-lg` | 36px | ❌ | Desktop larger icon actions |

### Button Rules

- **NEVER** use raw `<button>` for interactive UI — always use `Button` from `@/components/ui/button`.
- **NEVER** use `h-11` as a className on `Button` — use `size="xl"`.
- **NEVER** use `size="sm"` or smaller on mobile-reachable interactive elements.
- **ALWAYS** use `size="xl"` or `size="icon-xl"` for buttons that must be reachable on mobile.
- For `<Link>` styled as button: acceptable to apply `buttonVariants()` + `cn()`.
- Raw `<button>` is only acceptable for non-standard interactive patterns that cannot be expressed via Button (custom ARIA roles, special composites) — document the reason in a comment.
- Touch target minimum: 44px. Add `min-h-[44px]` explicitly if Button size doesn't guarantee it.

---

## §4 — CANONICAL INPUT GOVERNANCE

**Canonical source:** `Input` from `@/components/ui/input`  
**Underlying primitive:** `@base-ui/react/input`

### Input Sizes

| Context | Height | Class | Status |
|---|---|---|---|
| Standard | 36px | `h-9` (default) | Current canonical |
| Mobile-safe (Phase 3 target) | 44px | `h-11` via size variant | To be implemented |

### Input Rules

- **NEVER** create local input wrappers with custom height/padding.
- `AdminSearchInput` (Input + icon) is an acceptable composition — not a clone.
- `FilterRangeInputs` (two Inputs) is an acceptable composition — not a clone.
- **NEVER** override Input height via direct className unless using a future canonical size variant.
- For mobile forms, consider adding `min-h-[44px]` wrapper or await Phase 3 size variants.

---

## §5 — CANONICAL ICON GOVERNANCE

**Canonical family:** lucide-react — the ONLY approved icon library.

### Icon Size Map

| Semantic Role | Size Class | px | Where Used |
|---|---|---|---|
| Button icon | `size-4` (CVA default) | 16px | Inside Button (auto-applied) |
| Navigation item icon | `h-4 w-4` | 16px | Sidebar nav, header nav |
| Standard UI icon | `h-4 w-4` | 16px | Most inline UI icons |
| Secondary metadata icon | `h-3.5 w-3.5` | 14px | Listing card metadata |
| Tiny label icon | `h-3 w-3` | 12px | Badges, micro-labels |
| Larger action icon | `h-5 w-5` | 20px | Header hamburger, prominent actions |
| Section icon | `h-6 w-6` | 24px | Section decorative icons |
| Hero/CTA icon | `h-12 w-12` | 48px | Hero decorative icons |

### Icon Rules

- **NEVER** use icon sizes outside the canonical size map without justification.
- **NEVER** import from a different icon library.
- **NEVER** set `h-*` on icons inside `Button` — CVA handles sizing via `[&_svg:not([class*='size-'])]:size-4`.
- `shrink-0` is REQUIRED on all icons in flex containers to prevent compression.
- For icon-only buttons: use `size="icon"` (40px) on desktop, `size="icon-xl"` (44px) on mobile.
- Stroke consistency: lucide-react defaults to `strokeWidth=2` — do not override unless justified.

---

## §6 — CANONICAL LAYOUT & CONTAINER GOVERNANCE

### Container System

| Token | Value | Use |
|---|---|---|
| Standard container | `container mx-auto px-4` | Pages bounded at ~1280px (Tailwind default) |
| Wide container | `.container-wide` | Max 88rem (1408px) — huge-desktop preferred |
| Reading container | `max-w-5xl mx-auto px-4` | Content pages (cabinet, auth) |
| Admin container | `p-6 lg:p-8 max-w-6xl mx-auto` | Admin page content area |
| Section inner | `max-w-3xl mx-auto` | Narrow centered content within sections |

### Container Rules

- **ALWAYS** apply a max-width to page content containers — never allow unbounded full-width content.
- Use `.container-wide` for public listing pages and homepage (better huge-desktop experience).
- Use `max-w-5xl` for user-focused pages (cabinet, auth, favorites).
- Never use `max-w-[ARBITRARY_VALUE]` — use the canonical container tokens.
- Admin shell content: must use `max-w-6xl` or similar to prevent full-width stretch at 2560px.

### Grid System

| Use Case | Grid Classes |
|---|---|
| Listing cards | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` |
| Admin stats | `grid-cols-2 lg:grid-cols-3 xl:grid-cols-6` |
| Homepage how-it-works | `grid-cols-1 sm:grid-cols-3` |
| Footer columns | `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` |
| Admin cards | `grid-cols-1 lg:grid-cols-2` |

### Grid Rules

- Listing card grids MUST include `2xl:grid-cols-4` step (currently missing — Phase 4 work).
- Never use more than `xl:grid-cols-6` without a strong justification.
- Always use responsive step: at minimum `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.

---

## §7 — CANONICAL RESPONSIVE GOVERNANCE

See `docs/responsive-governance.md` for complete rules.

### Breakpoint Reference

| Token | Width | When to Add Styling |
|---|---|---|
| (base) | 0px | Mobile default — always write base styles first |
| `sm:` | 640px | Small tablet / large mobile |
| `md:` | 768px | Tablet — navigation changes here |
| `lg:` | 1024px | Desktop — sidebars appear here |
| `xl:` | 1280px | Wide desktop — grid expansions |
| `2xl:` | 1536px | Huge desktop — MUST be added for grids/containers |

### Responsive Rules Summary

- Mobile-first: base styles for 320px, scale UP.
- **ALWAYS** add `2xl:` step for listing grids and public page containers.
- **NEVER** use viewport JS for responsive logic.
- Touch targets: 44px minimum on ALL mobile-reachable interactive elements.
- `pb-safe` for fixed bottom elements (bottom nav, mobile CTAs).

---

## §8 — CANONICAL TOUCH TARGET GOVERNANCE

Minimum touch target: **44×44px** on all mobile-reachable interactive elements.

| Element Type | Minimum Size | Enforcement |
|---|---|---|
| Primary mobile buttons | 44px | `size="xl"` (h-11) |
| Mobile icon buttons | 44px | `size="icon-xl"` (size-11) |
| Navigation links (mobile) | min-h-[44px] | Explicit class |
| Filter accordion triggers | min-h-[44px] | Explicit class (already applied) |
| Desktop-only controls | 28–40px | No mobile touch requirement |

**Rules:**
- On mobile (reachable by thumb) ALL interactive elements MUST be ≥44px in their smaller dimension.
- Desktop-only elements (desktop nav links, admin table actions) may be smaller.
- `size="sm"` buttons (28px) MUST only appear in desktop-only contexts.
- Admin sidebar close button is currently below 44px — Phase 3 fix required.

---

## §9 — ACCESSIBILITY GOVERNANCE

### Required Accessible Patterns

- Every interactive element MUST be keyboard-reachable.
- Every icon-only button MUST have an `aria-label`.
- Every modal/dialog MUST trap focus (use shadcn Dialog/Sheet — do NOT create custom focus traps).
- Every form field MUST have a visible or accessible label.
- Focus ring: global `:focus-visible` rule in globals.css — do not override.

### Required ARIA Attributes

| Element | Required ARIA |
|---|---|
| Mobile drawer | `aria-modal="true"` (provided by Sheet) |
| Dialog | `aria-modal="true"` (provided by Dialog) |
| Filter panel | `role="dialog"` + `aria-modal="true"` + `aria-label` |
| Icon-only buttons | `aria-label` |
| Loading state | `aria-busy="true"` or accessible label |
| Tab navigation | `role="tablist"` + `role="tab"` (use shadcn Tabs) |

---

## §10 — HUGE DESKTOP GOVERNANCE (1536px+)

### Canonical Strategy

- Public content pages: use `.container-wide` (max 88rem / 1408px).
- Listing grids: `2xl:grid-cols-4` (add this to all listing grids in Phase 4).
- Admin: add `max-w-[1800px]` or `max-w-screen-2xl` to admin content area in Phase 4.
- No ultrawide stretching: every page MUST have a max-width at 2xl:.

### Typography at 2xl+

Consider adding in Phase 4:
- Section headings: add `2xl:text-3xl` step.
- Section padding: add `2xl:py-20` step.

### Rules

- **NEVER** leave a public page without a max-width constraint.
- **NEVER** allow listings grid to stop at `xl:grid-cols-3` — add `2xl:grid-cols-4`.
- **NEVER** allow admin main content to stretch full viewport at 2560px.

---

## §11 — LOCALIZATION GOVERNANCE

- ALL layout and responsive rules MUST work for all locales: sq, en, uk, it.
- NO locale-specific width hacks.
- NO hardcoded widths for navigation, buttons, or modals that would break with long translations.
- Use `truncate` on text that should not wrap.
- Use `flex-wrap` on toolbar items that may wrap with long translations.
- Test with Albanian (sq) and Ukrainian (uk) — longest locale strings.

---

## §13 — TAILWIND UTILITY GOVERNANCE

> Full rules: `docs/tailwind-governance.md`. Canonical fragments: `docs/tailwind-canonical-fragments.md`.

### Class Ordering (summary)
Layout → Position → Sizing → Spacing → Typography → Colors → Borders → Effects → Transitions → Responsive (sm:/md:/lg:/xl:/2xl:) → State (hover:/focus:)

### Arbitrary Values
- **Canonical allowed:** `text-[10px]`, `min-h-[44px]`, `max-h-[90vh]`
- **Forbidden without allowlist:** `text-[11px]`, `w-[Npx]` on translated text, `max-w-[Npx]`
- **Must allowlist:** Gallery heights, dev-overlay z-index

### Anti-Patterns (enforced from 2026-05-18)
- DO NOT introduce arbitrary spacing without canonical reason — use canonical scale (§1)
- DO NOT duplicate utility chains — check `docs/tailwind-canonical-fragments.md` first
- DO NOT use `whitespace-nowrap` alone — combine with `overflow-hidden truncate`
- DO NOT add fixed px widths to elements containing translated text
- DO NOT use arbitrary `2xl:` values — use only `2xl:grid-cols-4`, `2xl:py-20`, `2xl:text-3xl`
- DO NOT bypass canonical fragments when one exists in `docs/tailwind-canonical-fragments.md`
- DO NOT use raw Tailwind palette colors (`text-green-500`, `bg-blue-600`, `border-red-400`, ...). Only semantic design tokens from `globals.css` are allowed (`text-foreground`, `text-muted-foreground`, `text-status-success`, `bg-card`, `border-destructive`, ...).

### Hardcoded color enforcement (governance:tailwind)

All hardcoded colors are **HIGH** severity and BLOCK the governance gate (MEDIUM/LOW never fail it):

| Rule | Catches | Example |
|---|---|---|
| T3 | arbitrary hex in text | `text-[#22c55e]` |
| T4 | arbitrary hex / `bg-white` / `bg-black` | `bg-[#fff]`, `bg-white` |
| T6 | raw Tailwind palette colors | `text-green-500`, `bg-blue-600` |

Use the semantic tokens defined in `globals.css` instead. Storybook (`*.stories.tsx`) files are exempt from T6 only (literal swatches are their purpose). Added 2026-05-21 (Task 121 review follow-up) after a raw-palette color slipped past governance.

---

## §12 — AI GOVERNANCE ENFORCEMENT

> This section defines mandatory verification requirements for all future Claude Code UI tasks.
> See `docs/governance-enforcement.md` for full framework and `docs/governance-checklists.md` for checklists.

### Before Any UI Task
1. Read `docs/governance-enforcement.md §2` (review checkpoints)
2. Confirm canonical source for every primitive being used
3. Complete Checklist A (Pre-Task Gate) from `docs/governance-checklists.md`

### After Any UI Task
1. Complete Checklist B (Post-Task Gate) from `docs/governance-checklists.md`
2. Every box must be checked before the task is marked complete

### Quick Governance Reference

| Concern | Rule | Source |
|---|---|---|
| Button | `Button` from `@/components/ui/button`, `size="xl"` on mobile | §3 above |
| Input | `Input` from `@/components/ui/input`, no custom wrappers | §4 above |
| Mobile drawer | shadcn `Sheet` always — never custom div overlay | §7 / component-governance.md |
| Modal | shadcn `Dialog` always — never custom div overlay | §7 / component-governance.md |
| Container | `.container-wide` on public pages — never unbounded | §6 above |
| Listing grid | Always `2xl:grid-cols-4` — never stop at xl:3 | §6 above |
| Icons | lucide-react only — no other library | §5 above |
| Navigation | `router.push()` only — never `window.location.href` | ai-behavior.md |
| Responsive | CSS-only breakpoints — no viewport JS | §7 above |
| Control height | Same row → one height; reconcile at primitive level | §15 above |
| Z-index | Chrome `z-30` · scrim `z-40` · floating `z-50` | §16 above |
| UI pre-flight | Run the mechanical checklist; paste output in session log | §17 above |
| Touch targets | 44px minimum — `size="xl"` or `min-h-[44px]` | §8 above |
| Localization | sq/en/uk/it all work — no hardcoded widths | §11 above |
| Huge desktop | All pages bounded — no whitespace wastelands | §10 above |
| SSR | No `suppressHydrationWarning`, no `typeof window` in render | ai-behavior.md |
| i18n | All 4 locale files updated — runtime switch tested | ai-behavior.md |

---

## §14 — Component Reuse Rules (Phase 6)

**DO NOT create a new component before:**
1. Running `npm run governance:components`
2. Checking `docs/component-catalog.md` for existing equivalent
3. Confirming canonical primitives cannot satisfy the requirement

**Component reuse hierarchy:**
1. Canonical primitives (`src/components/ui/`) — ALWAYS prefer these
2. Shared components (`src/components/shared/`) — reuse Combobox, LocaleSwitcher, etc.
3. Module components — create in `src/modules/{module}/components/` only if module-specific

**Forbidden duplication:**
- Local button clones → use `Button` from `@/components/ui/button`
- Custom tab implementations → use `Tabs` from `@/components/ui/tabs`
- Custom dialog overlays → use `Dialog` from `@/components/ui/dialog`
- Custom mobile drawers → use `Sheet` from `@/components/ui/sheet`
- New locale-switcher → use `LocaleSwitcher` from `@/components/shared/LocaleSwitcher`
- New combobox implementation → use `Combobox` from `@/components/shared/Combobox`

See `docs/component-catalog-governance.md` for the full classification model.

---

## §15 — CONTROL-HEIGHT ALIGNMENT (enforced 2026-05-23)

> Added after the `/listings` toolbar review (Task 220): the canonical `Combobox` and canonical `Button`
> do NOT use the same pixel height for the same `size` token. `Combobox` heights are
> `default=h-11 | sm=h-9 | xs=h-8` (`Combobox.tsx`), while `Button` `sm`=28px / `default`=32px (§3). So a
> `Combobox size="sm"` (36px) placed next to a `Button size="sm"` (28px) renders visibly taller — this is
> the "the combobox looks bigger than the other buttons" defect.

**Rule — one row, one height.** Any group of controls that sits on the same horizontal line (toolbars,
filter bars, sort bars, inline action rows) MUST share ONE pixel height. Pick the row's canonical height
and configure EVERY control to it:

| Row context | Canonical row height | Button | Combobox | Input |
|---|---|---|---|---|
| Desktop toolbar / filter bar | **36px (`h-9`)** | `size="sm"` + `h-9` is NOT allowed ad-hoc — see note | `size="sm"` (already h-9) | `h-9` (default) |
| Mobile-reachable row | **44px (`h-11`)** | `size="xl"` | `size="default"` (h-11) | mobile size variant |

- The fix for the Button↔Combobox mismatch belongs at the **primitive level** (align the `Button` size
  scale and the `Combobox` size scale so the same `size` token = the same px), NOT via per-call `h-9`
  hacks sprinkled on each button. If you must reconcile at the call site temporarily, STOP and ask the
  orchestrator before shipping a per-call height override — it violates §3 ("never use `h-11`/`h-9` as a
  className on `Button`").
- Never mix `size="sm"` Buttons with `size="sm"` Comboboxes on the same row expecting them to align —
  they will not until the scales are reconciled.
- The grid/list toggle, the sort Combobox, the type Combobox, and the sale/rent buttons on `/listings`
  MUST all be the same height.

---

## §16 — Z-INDEX LAYERING SCALE (enforced 2026-05-23)

> Added after the homepage-drawer review (Task 219): `z-50` was overloaded across the sticky header,
> dialog, sheet, popover, combobox, admin modals AND the drawer panel, so the sticky site header showed
> through the drawer and the backdrop never dimmed it.

**Canonical scale — use ONLY these three tiers for app chrome and overlays:**

| Tier | Token | What lives here |
|---|---|---|
| Chrome | `z-30` | Sticky site header, mobile bottom nav, sticky toolbars |
| Scrim | `z-40` | Drawer / sheet / dialog **backdrops** (must dim the chrome) |
| Floating | `z-50` | Drawer / sheet / dialog **panels**, popovers, comboboxes, dropdowns, toasts |

**Rules:**
- The site header + mobile bottom nav are **chrome → `z-30`** (not `z-50`). A drawer/sheet/dialog backdrop
  (`z-40`) MUST therefore cover and dim them; the panel (`z-50`) sits on top.
- Portaled popovers/comboboxes opened INSIDE a drawer share the floating tier (`z-50`) and stay above the
  panel via DOM order (portal appended last). Verify visually — do not bump them to `z-[60]`.
- **NEVER** introduce ad-hoc `z-[NN]` values or a new tier without orchestrator approval. Document any
  unavoidable exception (e.g. dev overlay) in `docs/tailwind-governance.md` allowlist.
- Two pieces of chrome must never both sit at `z-50`.

---

## §17 — UI PRE-FLIGHT CHECKLIST (MANDATORY, mechanical — enforced 2026-05-23)

> Why this exists: the same UI/responsive defects (overflowing button rows, mismatched control heights,
> non-canonical dropdowns, z-index collisions) keep recurring because "looks fine on desktop" was treated
> as verification. Prose rules above were not enough. For ANY task that touches UI, run these mechanical
> checks and **paste the command output / per-breakpoint notes into the session log**. A task that touches
> UI is NOT complete until this checklist is in its session log.

**Run and record (grep the touched files, ideally the whole `src/`):**

1. **No non-canonical dropdowns:** `grep -rn "<select"` and shadcn `Select` imports in touched UI →
   must be 0 (use `Combobox`). Record the result.
2. **No ad-hoc control heights on Button:** `grep -rn "h-8\|h-9\|h-10\|h-11\|h-12" <touched Button usages>`
   → each hit must be justified against §3/§15 or removed. Record.
3. **Z-index on the scale:** `grep -rn "z-\[" <touched>` and any `z-30/40/50` → must match §16; chrome at
   `z-30`. Record.
4. **Overflow-risk rows:** every `flex` row with icon + translatable label must have `min-w-0` and/or
   `flex-wrap`/`truncate`; verify the row does not clip at **320px** in **uk** (longest). Record the
   widths checked.
5. **Same-row height:** confirm every control on a shared row is one height (§15). Record.
6. **All 7 breakpoints:** 320/375/390/768/1280/1440/2560 — state, per touched screen, that each was
   checked (screenshots strongly preferred). "Desktop only" is a fail.
7. **Touch targets:** mobile-reachable controls ≥44px (§8). Record.
8. **4 locales:** sq/en/uk/it render without truncation breakage on the touched screens. Record.

If any check fails and the fix is out of scope, STOP and ask the orchestrator (open a follow-up) rather
than shipping the defect.
