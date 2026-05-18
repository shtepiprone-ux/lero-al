# Responsive Governance — Lero.al
**Phase 1 of Responsive/UI Governance Epic**  
Audit date: 2026-05-18  
Status: GOVERNANCE REFERENCE — defines rules for all future responsive work  

---

## §1 — CANONICAL RESPONSIVE STRATEGY

### Breakpoint Philosophy

**Framework:** Tailwind CSS v4 mobile-first breakpoint system.  
**Approach:** CSS-driven responsiveness only. No JavaScript viewport detection during render.  
**SSR safety:** All responsive logic via static CSS classes — zero hydration risk.  

**Canonical breakpoints:**

| Token | Width | Label | Use |
|---|---|---|---|
| (base) | 0px | Mobile S | 320px–479px — narrow mobile |
| `sm:` | 640px | Mobile L / Small Tablet | 480px–767px |
| `md:` | 768px | Tablet | 768px–1023px |
| `lg:` | 1024px | Desktop | 1024px–1279px |
| `xl:` | 1280px | Wide Desktop | 1280px–1535px |
| `2xl:` | 1536px | Huge Desktop | 1536px–2559px |

**Non-standard breakpoints:** FORBIDDEN. Do not introduce arbitrary `min-width` or `max-width` inline styles for breakpoints. Use canonical Tailwind breakpoints only.

**Missing breakpoints:** The current project does not use `2xl:` anywhere. This is the primary gap for huge-desktop support. Future phases should add `2xl:` steps for grids, containers, and section padding.

---

### Responsive Scaling Philosophy

1. **Mobile-first:** Base styles apply to 320px. Scale UP with `sm:`, `md:`, `lg:`, `xl:`, `2xl:` prefixes.
2. **No desktop-only resets:** Never write styles that work only on desktop and need to be reset on mobile.
3. **Fluid by default:** Prefer `w-full`, `flex-1`, `min-w-0` for flexible widths.
4. **Max-width governs large screens:** Add `max-w-*` to prevent content from stretching on huge desktops.
5. **Grid scaling:** Always define at least a `2xl:` column step for content grids on pages with cards/listings.

---

### Toolbar Behavior Philosophy

1. Toolbars are `flex items-center gap-2` containers.
2. On mobile (`<lg:`) toolbars that would overflow MUST stack vertically (`flex-col`) or use a compact mobile variant.
3. Toolbars with many actions (admin) MUST show a mobile-friendly layout (fewer visible actions, overflow menu).
4. No toolbar may clip or overflow horizontally — overflow-x-auto is acceptable for tables, NOT for toolbars.
5. Responsive breakpoint for toolbar layout change: `lg:` (sidebar appears at lg:).

---

### Modal Behavior Philosophy

1. **Mobile (<md):** Modals/dialogs should be full-width or near-full-width. Use shadcn Sheet with `side="bottom"` or Dialog with `w-full max-w-[calc(100vw-2rem)]`.
2. **Tablet (md-lg):** Standard dialog width (sm:max-w-lg or similar).
3. **Desktop (lg+):** Standard dialog widths as defined by shadcn Dialog defaults.
4. **Huge desktop (2xl+):** Dialogs MUST have a max-width cap — no dialogs wider than 768px unless explicitly justified.
5. No `overflow-y-hidden` on `<body>` via custom JS — use shadcn primitives which handle scroll lock correctly.

---

### Huge Desktop Philosophy (1536px+)

1. **Content max-width:** Public pages MUST NOT stretch content beyond 88rem (1408px). Use `.container-wide` or `max-w-8xl`.
2. **Grid columns:** Add `2xl:grid-cols-4` to listing grids (currently `xl:grid-cols-3`).
3. **Section padding:** Consider `2xl:py-20` step for homepage sections (currently `md:py-16`).
4. **Typography:** Consider `2xl:text-3xl` step for section headings (currently `sm:text-2xl`).
5. **Admin:** Admin shell content should have a `max-w-screen-2xl` or `max-w-[1800px]` constraint.

---

### Ultrawide Philosophy (3440px+)

1. **Content islands are acceptable** for reading-context pages (listing detail, auth, cabinet).
2. **Wide grids preferred** for card/listing pages — avoid single narrow column at ultrawide.
3. **Never stretch interactive toolbars** to full ultrawide width.
4. `.container-wide` (88rem = 1408px) is the primary tool for controlling max-width at ultrawide.

---

## §2 — RESPONSIVE GOVERNANCE RULES

### Acceptable Responsive Patterns

```
✅ Tailwind mobile-first breakpoint prefixes: sm:, md:, lg:, xl:, 2xl:
✅ CSS-driven show/hide: hidden md:block, md:hidden, hidden lg:flex
✅ Responsive grid columns: grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4
✅ Responsive padding: px-4 sm:px-6 lg:px-8 2xl:px-12
✅ Responsive typography: text-xl sm:text-2xl 2xl:text-3xl
✅ Responsive max-width: max-w-5xl (ok for bounded containers)
✅ Container pattern: container-wide or max-w-8xl mx-auto px-4
✅ Sticky sidebar: sticky top-20 with overflow-y-auto
✅ Safe area insets: pb-safe, pt-safe for mobile notches
✅ Responsive flex direction: flex-col md:flex-row
✅ Responsive gap: gap-4 lg:gap-6
```

### Forbidden Responsive Patterns

```
❌ typeof window or navigator.userAgent for responsive logic (hydration risk)
❌ JavaScript viewport width checks during component render (hydration risk)
❌ arbitrary min-width/max-width values in className: className="min-w-[375px]" for breakpoints
❌ Inline style={{ width: viewport > 768 ? '...' : '...' }} (hydration risk)
❌ Custom breakpoint values not in Tailwind config: md:[min-width:900px] (unless documented)
❌ overflow-hidden used to mask layout overflow bugs (legitimate use for rounded corners OK)
❌ Responsive logic duplicated in JS that mirrors CSS (pick one source of truth)
```

### Acceptable Adaptive Rendering

```
✅ CSS show/hide for responsive: hidden lg:block for desktop elements
✅ Lazy loaded components (ssr:false) when the reason is explicit and documented
✅ Conditional mount for mobile sheet (when closed, unmounted to save DOM size)
✅ Dynamic import with loading fallback for expensive components
```

### Forbidden Adaptive Rendering

```
❌ suppressHydrationWarning to fix responsive rendering bugs
❌ typeof window rendering branches for visible UI
❌ Dynamic SSR-disabled components without a written justification
❌ Duplicated mobile/desktop render trees in JSX (render both, hide one with CSS — only for lightweight elements)
❌ useEffect-driven layout changes that cause CLS
```

### Acceptable Responsive Wrappers

```
✅ shadcn Sheet for mobile drawers/panels
✅ shadcn Dialog for modal dialogs
✅ container-wide or max-w-8xl mx-auto for page containers
✅ Sticky sidebar with overflow-y-auto for desktop
✅ Conditional mount of mobile sheet (open state governs mount)
```

### Forbidden Responsive Hacks

```
❌ Custom overlay div that duplicates Sheet behavior (AdminSidebar, ListingsShell patterns must be migrated)
❌ Using padding/margin hacks instead of proper Flexbox/Grid layout
❌ Hard-coding breakpoint widths in component logic
❌ Emergency z-index overrides (z-[999], z-[9999])
❌ position:fixed inside scrollable containers without careful overflow management
```

---

## §3 — FUTURE MIGRATION PRIORITIES

### Critical Responsive Risks (Address First)

| Priority | Issue | File | Impact | Migration Task |
|---|---|---|---|---|
| P1 | Public pages lack huge-desktop max-width | All public pages | HIGH — stretches on 2560px | Phase 4 |
| P1 | Listings grid has no 2xl: column step | `ListingsShell.tsx` | MEDIUM — sparse at 1920px | Phase 4 |
| P1 | Admin sidebar mobile drawer uses custom overlay | `AdminSidebar.tsx` | MEDIUM — no focus trap, inconsistent | Phase 5 |
| P1 | Listings filter uses custom overlay (not Sheet) | `ListingsShell.tsx` | MEDIUM — inconsistent with homepage | Phase 5 |
| P2 | Admin shell has no max-width constraint | `AdminShell.tsx` | MEDIUM — stretches on huge desktop | Phase 4 |
| P2 | Input height (h-9/36px) below 44px mobile target | `input.tsx` | MEDIUM — mobile usability | Phase 3 |
| P2 | Admin sidebar close button below 44px | `AdminSidebar.tsx` | HIGH — accessibility | Phase 3 |
| P3 | Homepage section padding stops at md:py-16 | `app/[locale]/page.tsx` | LOW — visual only | Phase 4 |
| P3 | Section headings stop at sm:text-2xl | Multiple pages | LOW — visual only | Phase 4 |

### Critical Duplication Hotspots

| Priority | Issue | Files | Migration Task |
|---|---|---|---|
| P1 | Two custom mobile overlay implementations | `AdminSidebar.tsx` + `ListingsShell.tsx` | Phase 5 |
| P1 | Custom tab implementations | `CabinetShell.tsx` + `AdminCurrencyTabs.tsx` | Phase 3 |
| P2 | Custom accordion in filters | `ListingsFilters.tsx` | Phase 3 |
| P2 | Raw `<button>` elements in sidebar/header | `AdminSidebar.tsx`, `Header.tsx` | Phase 3 |
| P2 | Inline card pattern duplicated | `admin/page.tsx`, `CabinetShell.tsx` | Phase 3 |
| P3 | `container mx-auto px-4` (9 files) without huge-desktop constraint | Multiple | Phase 4 |

### Critical Primitive Fragmentation

| Priority | Primitive | Status | Target |
|---|---|---|---|
| P1 | Button | Exists canonically, raw `<button>` leaking | Phase 3 — migrate raw buttons |
| P1 | Mobile drawer | Duplicated (Sheet vs custom div) | Phase 5 |
| P2 | Input | Exists, needs size variants | Phase 3 |
| P2 | Tabs | shadcn Tabs exists, local clones used | Phase 3 |
| P2 | Accordion | shadcn exists, local clone in filters | Phase 3 |
| P3 | Card | shadcn card.tsx exists, inline patterns preferred | Phase 3 |
| P3 | EmptyState | No canonical primitive | Phase 4 |
| P3 | Container | `container-wide` defined, not applied | Phase 4 |

### Critical Huge Desktop Issues

| Priority | Issue | Target |
|---|---|---|
| P1 | Public pages at 2560px: large whitespace margins | Apply `container-wide` to all public page sections |
| P1 | Listings grid: 3 cols max even at 2560px | Add `2xl:grid-cols-4` |
| P2 | Admin shell: full-width stretch at 2560px | Add max-width to admin main content area |
| P2 | Section padding stops at md:py-16 | Add `2xl:py-20` step |
| P3 | Section headings stop at sm:text-2xl | Add `2xl:text-3xl` step |

---

## §4 — PERFORMANCE / SSR / HYDRATION AUDIT

### Current SSR-Safe Practices

| Component | Strategy | Status |
|---|---|---|
| `ListingsFilters` | `ssr:false` — prevents Input hydration mismatch | OK — documented |
| `HeroSearchClient` | `ssr:false` — hero search with filter state | OK — documented |
| `NotificationBell` | `ssr:false` — auth-dependent, client-only | OK |
| `SaveSearchButton` | `ssr:false` — auth-dependent | OK |
| All responsive breakpoints | CSS-only — zero JS viewport detection | OK — SSR-safe |
| Filter visibility | `getFilterVisibility()` in filterEngine | OK — deterministic |

### Hydration Risks

| Issue | File | Risk | Status |
|---|---|---|---|
| `suppressHydrationWarning` | Not found | N/A | Clean |
| `typeof window` branches | Not found in UI components | N/A | Clean |
| Viewport-based conditional render | Not found | N/A | Clean |
| `useEffect`-driven DOM changes | `ListingsShell.tsx` (scroll restore) | LOW — post-hydration only | Acceptable |

### Performance Tier Adaptation

`globals.css` includes a performance-tier system (`[data-perf-tier="low"]`) that disables:
- `box-shadow` on cards
- `transition` durations (set to 0ms)
- `backdrop-filter` effects

This is applied after hydration via `PerformanceStoreInit` — no SSR/hydration risk by design.

### Client Boundary Audit

| Component | Client boundary | Justification | Risk |
|---|---|---|---|
| `Header.tsx` | `'use client'` | Auth state, router, locale switching | Acceptable |
| `ListingsShell.tsx` | `'use client'` | URL filter state, view toggle, load-more | Acceptable |
| `CabinetShell.tsx` | `'use client'` | Tab state, avatar upload | Acceptable |
| `AdminShell.tsx` | `'use client'` | Mobile sidebar state, presence | Acceptable |
| `FiltersPanel.tsx` | `'use client'` | Draft filter state | Acceptable |
| `ListingsFilters.tsx` | `'use client'` (inside ssr:false) | URL filter state | Acceptable |

**No client boundary sprawl detected.** All client components have clear justification.
