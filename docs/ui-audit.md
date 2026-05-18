# UI Audit — Lero.al
**Phase 1 of Responsive/UI Governance Epic**  
Audit date: 2026-05-18  
Status: AUDIT-ONLY — no code was changed  

---

## §1 — GLOBAL UI AUDIT TABLE

| Category | File | Component | Current Implementation | Problem Type | Duplication Risk | Accessibility Risk | Responsive Risk | Huge Desktop Risk | Canonical Replacement Candidate | Migration Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| Button | `components/admin/AdminSidebar.tsx` | Close button (mobile) | Raw `<button>` with `p-1.5 rounded-lg` | Local clone | LOW | HIGH (≈30px touch target) | LOW | LOW | `Button size="icon-sm" variant="ghost"` | HIGH |
| Button | `components/admin/AdminSidebar.tsx` | Logout button | Raw `<button>` with `flex items-center gap-3 px-3 py-2.5 rounded-xl` | Local clone | LOW | LOW (≥44px effective) | LOW | LOW | `Button variant="ghost"` | MEDIUM |
| Button | `components/layout/Header.tsx` | Mobile logout | Raw `<button>` with `min-h-[44px]` | Local clone | LOW | OK (min-h set) | LOW | LOW | `Button variant="ghost"` | MEDIUM |
| Button | `modules/cabinet/components/CabinetShell.tsx` | Tab buttons | Custom styled `<button>` array with manual active state | Local clone | MEDIUM | LOW (py-2.5 ≈ ok) | LOW | LOW | shadcn `Tabs` component | HIGH |
| Button | `app/[locale]/page.tsx` | Nav/CTA links | `buttonVariants()` on `<Link>` | Pattern inconsistency | LOW | OK | LOW | LOW | `Button asChild` or consistent Link+variant | LOW |
| Input | `components/ui/input.tsx` | Input | Single size (h-9 / 36px) — no variants | Missing size system | MEDIUM | MEDIUM (below 44px on mobile) | MEDIUM | LOW | Extend Input with size variants | HIGH |
| Icon | All files | Lucide icons | Sizes: h-3, h-3.5, h-4, h-5, h-6, h-12 — no canonical map | Entropy | MEDIUM | LOW | LOW | LOW | Define canonical icon-size map | MEDIUM |
| Card | `app/admin/page.tsx` | StatCard | Inline `bg-card rounded-2xl border shadow-sm p-5` | Local clone | HIGH | LOW | LOW | LOW | Canonical card primitive | MEDIUM |
| Card | `modules/cabinet/components/CabinetShell.tsx` | User card | Inline `bg-card rounded-2xl border shadow-sm p-6` | Local clone | HIGH | LOW | LOW | LOW | Canonical card primitive | MEDIUM |
| Card | `modules/listings/components/ListingCard.tsx` | ListingCard | `rounded-xl border bg-card` (p-3 inside) | Inconsistent radius vs admin cards (rounded-2xl) | LOW | LOW | LOW | LOW | Standardize card radius | LOW |
| Container | `app/[locale]/page.tsx` | Sections | `container mx-auto px-4` — standard Tailwind | Huge-desktop unbound | LOW | LOW | LOW | HIGH | `.container-wide` | MEDIUM |
| Container | `app/[locale]/listings/page.tsx` | Page wrapper | `container mx-auto px-4` | Huge-desktop unbound | LOW | LOW | LOW | HIGH | `.container-wide` | MEDIUM |
| Container | `components/layout/Footer.tsx` | Footer | `container mx-auto px-4 py-12` | Huge-desktop unbound | LOW | LOW | LOW | HIGH | `.container-wide` | LOW |
| Container | `modules/cabinet/components/CabinetShell.tsx` | Cabinet | `container mx-auto px-4 py-8 max-w-5xl` | OK — bounded | LOW | LOW | LOW | OK | No change needed | — |
| Container | `app/admin/page.tsx` | Admin dashboard | `p-6 lg:p-8 max-w-6xl mx-auto` | Non-canonical max-width | LOW | LOW | LOW | MEDIUM | Admin container standard | LOW |
| Navigation | `components/layout/Header.tsx` | Mobile drawer | shadcn `Sheet` component | — | MEDIUM | OK | LOW | LOW | Canonical | — |
| Navigation | `components/admin/AdminSidebar.tsx` | Mobile drawer | Custom overlay `div` (not Sheet) | Duplicate drawer impl | HIGH | MEDIUM | LOW | LOW | Unify to Sheet or custom | HIGH |
| Navigation | `components/layout/MobileBottomNav.tsx` | Bottom nav | Fixed bottom bar with pb-safe | — | LOW | OK | LOW | LOW | Canonical | — |
| Filter | `components/shared/FiltersPanel.tsx` | Homepage filter drawer | shadcn `Sheet` | — | MEDIUM | OK | LOW | LOW | Canonical | — |
| Filter | `modules/listings/components/ListingsShell.tsx` | Listings filter drawer | Custom overlay `div` (not Sheet) | Duplicate drawer impl | HIGH | MEDIUM | LOW | LOW | Unify to Sheet | HIGH |
| Grid | `modules/listings/components/ListingsShell.tsx` | Listings grid | `xl:grid-cols-3` — no 2xl column step | No huge-desktop scaling | LOW | LOW | LOW | HIGH | Add `2xl:grid-cols-4` | MEDIUM |
| Grid | `app/[locale]/page.tsx` | Homepage sections | Max `sm:grid-cols-3` — no 2xl step | No huge-desktop scaling | LOW | LOW | LOW | HIGH | Consider 2xl+ columns | LOW |
| Modal | `components/shared/FiltersPanel.tsx` | Filters panel | Sheet (full-panel), no Modal sizing variants | — | LOW | OK | LOW | LOW | Canonical | — |
| Accordion | `modules/listings/components/ListingsFilters.tsx` | AccordionSection | Local accordion implementation | Local clone | MEDIUM | LOW (min-h-[44px] set) | LOW | LOW | shadcn Accordion | MEDIUM |
| Tabs | `modules/cabinet/components/CabinetShell.tsx` | Cabinet tabs | Custom tab buttons with manual state | Local clone | HIGH | LOW | LOW | LOW | shadcn `Tabs` | HIGH |
| Tabs | `components/admin/AdminCurrencyTabs.tsx` | Currency tabs | Custom implementation | Local clone | MEDIUM | UNKNOWN | LOW | LOW | shadcn `Tabs` | MEDIUM |
| Typography | `app/[locale]/page.tsx` | Hero heading | `text-3xl sm:text-4xl md:text-5xl` | OK — responsive | LOW | LOW | LOW | MEDIUM (no 2xl step) | Canonical type scale | LOW |
| Typography | All | Section headings | `text-xl sm:text-2xl font-bold` | Inconsistent (some `text-xl sm:text-2xl`, some just `text-xl`) | MEDIUM | LOW | LOW | LOW | Canonical heading scale | LOW |
| Badge | `modules/listings/components/ListingCard.tsx` | Status badge | Inline `${STATUS_STYLE[l.status]}` string map | OK — semantic | LOW | LOW | LOW | LOW | Canonical | — |
| Empty state | `modules/listings/components/ListingsShell.tsx` | No results | Inline `py-24` div with emoji | Local clone | MEDIUM | LOW | LOW | LOW | Shared EmptyState primitive | LOW |
| Spinner | `modules/listings/components/ListingsShell.tsx` | Load more | `Loader2 animate-spin` inline | OK | LOW | LOW | LOW | LOW | Canonical | — |

---

## §2 — LOCAL PRIMITIVE CLONE INVENTORY

### Local Button Clones

| File | Clone Description | Canonical Target |
|---|---|---|
| `components/admin/AdminSidebar.tsx:101` | Close button: `<button className="lg:hidden p-1.5 rounded-lg ...">` | `Button size="icon-sm" variant="ghost"` |
| `components/admin/AdminSidebar.tsx:144` | Logout button: `<button className="flex items-center gap-3 px-3 py-2.5 rounded-xl ...">` | `Button variant="ghost"` |
| `components/layout/Header.tsx:283` | Mobile logout: `<button ... className="flex items-center gap-2 ... min-h-[44px]">` | `Button variant="ghost" size="xl"` |
| `modules/cabinet/components/CabinetShell.tsx:105` | Tab buttons: `<button className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg ...">` | `Tabs`/`TabsTrigger` from shadcn |
| `app/admin/page.tsx:82` | Stat icon container: `h-11 w-11 rounded-xl flex items-center justify-center` (not interactive, just visual) | Not a button — decorative |

### Local Input Clones

No full local input clones found. The canonical `Input` is consistently used. However:
- `AdminSearchInput.tsx` wraps `Input` with an icon — this is an acceptable composition pattern, not a clone.
- `FilterRangeInputs` wraps two `Input` elements — acceptable composition.

### Local Card Clones

| File | Clone Pattern | Problem |
|---|---|---|
| `app/admin/page.tsx:80` | `bg-card rounded-2xl border shadow-sm p-5` | Duplicated inline card styles |
| `modules/cabinet/components/CabinetShell.tsx:74` | `bg-card rounded-2xl border shadow-sm p-6 mb-6` | Duplicated inline card styles |
| `app/admin/listings/page.tsx` (inferred) | Admin table wrapper inline styles | Likely duplicated |
| `modules/listings/components/ListingCard.tsx:240` | `rounded-xl border bg-card` | Different radius than admin cards |

### Local Modal/Drawer Clones

| File | Clone Pattern | Canonical Target |
|---|---|---|
| `components/admin/AdminSidebar.tsx:173` | `div.fixed.inset-0.z-50 + div.absolute.inset-0.bg-black/40` | shadcn `Sheet` |
| `modules/listings/components/ListingsShell.tsx:181` | `div.fixed.inset-0.z-50 + div.absolute.inset-0.bg-overlay/40` | shadcn `Sheet` |

### Local Accordion Clones

| File | Clone Pattern | Canonical Target |
|---|---|---|
| `modules/listings/components/ListingsFilters.tsx:24` | `AccordionSection` local component with `button + ChevronDown + collapse` | shadcn `Accordion` |

### Local Tab Clones

| File | Clone Pattern | Canonical Target |
|---|---|---|
| `modules/cabinet/components/CabinetShell.tsx:104` | `div.flex.gap-1 + button.flex-1` manual tab array | shadcn `Tabs` |
| `components/admin/AdminCurrencyTabs.tsx` | Custom currency tab switcher | shadcn `Tabs` |

### Local Responsive Wrappers

| File | Pattern | Risk |
|---|---|---|
| `app/[locale]/page.tsx` (all sections) | `container mx-auto px-4` without huge-desktop max-width | MEDIUM — stretches on 2560px |
| `components/layout/Footer.tsx` | `container mx-auto px-4 py-12` | MEDIUM |
| `components/layout/Header.tsx` | `container mx-auto flex h-16 items-center justify-between px-4` | LOW — header can stretch |

---

## §3 — TAILWIND ENTROPY INVENTORY

### Repeated Utility Fragments

| Fragment | Frequency | Locations | Risk |
|---|---|---|---|
| `bg-card rounded-2xl border shadow-sm` | 5+ | Admin dashboard, admin tables, cabinet | HIGH — repeated card pattern |
| `rounded-xl border bg-card` | 3+ | ListingCard, filters sidebar | MEDIUM — inconsistent radius |
| `container mx-auto px-4` | 9 files | All public pages + header + footer | HIGH — no huge-desktop max-width |
| `flex items-center gap-2` | 20+ | Everywhere | LOW — too generic to extract |
| `text-sm text-muted-foreground` | 30+ | Everywhere | LOW — semantic utility |
| `text-xs font-semibold uppercase tracking-wider` | 5+ | Section labels | MEDIUM — custom label style |
| `py-12 md:py-16` | 5 sections | Homepage sections | MEDIUM — consistent but not tokened |
| `rounded-xl` | 30+ | Inputs, buttons (non-canonical), cards | MEDIUM — inconsistent with `rounded-2xl` |
| `p-5` | 8+ | Admin cards | LOW |
| `px-3 py-2.5 rounded-xl` | 5+ | Sidebar nav items, cabinet tabs | MEDIUM — nav item pattern |
| `h-4 w-4 shrink-0` | 30+ | Icons in nav/buttons | LOW |
| `text-[10px]` | 8+ | Small labels, badges | MEDIUM — arbitrary text size |

### Arbitrary Spacing Patterns

| Pattern | File | Issue |
|---|---|---|
| `py-12 md:py-16` | `app/[locale]/page.tsx` (×5 sections) | Consistent but not a design token |
| `gap-10` | `components/layout/Footer.tsx` | Arbitrary gap for footer columns |
| `mb-10` | `app/[locale]/page.tsx` (hero) | Arbitrary hero bottom margin |
| `p-6 lg:p-8` | `app/admin/page.tsx` | Arbitrary admin page padding |

### Arbitrary Responsive Overrides

| File | Pattern | Issue |
|---|---|---|
| `components/layout/Header.tsx:109` | `className="gap-1 px-2 hidden sm:flex"` on Link | Manual px override on buttonVariants |
| `modules/listings/components/ListingCard.tsx:148` | `w-32 shrink-0 sm:w-44` | Arbitrary responsive width for horizontal card |
| `modules/cabinet/components/CabinetShell.tsx:117` | `hidden sm:inline` | OK — responsive label hide |

### Utility Duplication Hotspots

1. **Card container pattern** — `bg-card rounded-2xl border shadow-sm` duplicated across admin components.  
2. **Container pattern** — `container mx-auto px-4` used across all 9 public page/layout files without huge-desktop constraint.  
3. **Nav item pattern** — `px-3 py-2.5 rounded-xl text-sm font-medium` used in AdminSidebar nav items and CabinetShell tabs.  
4. **Section header pattern** — `flex items-center justify-between mb-6` + heading + view-all link.  
5. **Mobile drawer pattern** — duplicated in AdminSidebar and ListingsShell.  
