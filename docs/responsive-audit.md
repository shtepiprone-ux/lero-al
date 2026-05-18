# Responsive Audit — Lero.al
**Phase 1 of Responsive/UI Governance Epic**  
Audit date: 2026-05-18  
Status: AUDIT-ONLY — no code was changed  

---

## §1 — RESPONSIVE RISK MATRIX

| Surface | Mobile Risk (320–480px) | Tablet Risk (640–768px) | Desktop Risk (1024–1440px) | Huge Desktop Risk (1720–2560px) | Overflow Risk | Touch Risk | Localization Risk |
|---|---|---|---|---|---|---|---|
| Homepage hero | LOW — scales sm→md→lg | LOW | LOW | MEDIUM (section padding doesn't scale up) | LOW | LOW | MEDIUM (hero title may wrap on narrow) |
| Homepage stats bar | LOW — 2→3 cols | LOW | LOW | MEDIUM (cols capped at 3) | LOW | LOW | MEDIUM (long labels) |
| Homepage sections | LOW — stacked | LOW | LOW | HIGH (container fills 2560px width) | LOW | LOW | LOW |
| Listings page | LOW — 1 col | LOW (2 col) | LOW (3 col with sidebar) | HIGH (grid capped at 3 cols, container unbounded) | LOW | LOW | LOW |
| Listings sidebar filters | MEDIUM (hidden lg:hidden, sheet on mobile) | MEDIUM | LOW | LOW (sidebar bounded to w-72) | LOW | MEDIUM (touch targets in filters) | MEDIUM |
| Listing detail | LOW | LOW | LOW | MEDIUM (container unbounded) | LOW | LOW | LOW |
| Homepage filter drawer | LOW | LOW | LOW | LOW | LOW | LOW | LOW |
| Listings filter sheet | LOW (conditional mount) | LOW | N/A (desktop sidebar) | N/A | LOW | LOW | LOW |
| Header | LOW — collapses md | LOW | LOW | MEDIUM (header stretches full width) | LOW | LOW | LOW |
| Footer | LOW — stacks | LOW | LOW | MEDIUM (container unbounded) | LOW | LOW | MEDIUM |
| Admin dashboard | MEDIUM (p-6 collapses ok) | MEDIUM | LOW | MEDIUM (max-w-6xl but admin shell unbounded) | LOW | LOW | LOW |
| Admin sidebar | LOW (w-60 desktop, mobile drawer) | LOW | LOW | LOW | LOW | MEDIUM (small close btn) | LOW |
| Admin tables | HIGH (horizontal overflow, no scroll wrapper) | MEDIUM | LOW | LOW | HIGH | LOW | MEDIUM (long cell text) |
| Admin forms | MEDIUM | LOW | LOW | LOW | LOW | LOW | MEDIUM |
| Cabinet | LOW (max-w-5xl) | LOW | LOW | LOW (bounded) | LOW | LOW | MEDIUM |
| Auth pages | LOW (max-w centered) | LOW | LOW | LOW | LOW | LOW | MEDIUM |
| Favorites | LOW | LOW | LOW | MEDIUM (container unbounded) | LOW | LOW | LOW |
| Mobile bottom nav | LOW | N/A (hidden sm:hidden) | N/A | N/A | LOW | LOW | LOW |

---

## §2 — HUGE DESKTOP AUDIT (1720px–2560px+)

### Identified Issues

#### A. Whitespace Wastelands

| Surface | Breakpoint | Issue |
|---|---|---|
| Homepage all sections | 1920px+ | `container mx-auto px-4` — Tailwind container caps at xl: (1280px) then content is centered. At 1920px: 320px empty margins each side. At 2560px: 640px empty margins each side. |
| Listings page | 1920px+ | Same as homepage — container bounded at ~1280px, leaving 630px+ whitespace per side at 2560px |
| Footer | 1920px+ | Same — 3-col grid at max ~1280px wide |
| Listing detail | 1920px+ | Container bounded, large side margins |
| Favorites | 1920px+ | Same |

**Analysis:** This is acceptable UX for reading context (long text pages benefit from max-width). However, the listing grid and homepage card sections would benefit from more columns or slightly wider containers at 2xl+ to use available space.

#### B. Stretched Layouts

| Surface | Issue |
|---|---|
| Admin shell | `admin-shell flex min-h-screen` — no max-width. At 2560px admin content stretches full width. `max-w-6xl` is only on dashboard page, not the shell wrapper. |
| Admin sidebar | Fixed `w-60` — OK at all widths |
| Header | `container mx-auto flex h-16` — Header itself is full-width (bg stretches), content bounded. OK behavior for headers. |

#### C. Underscaled Typography

| Surface | Issue |
|---|---|
| Homepage sections | Section headings `text-xl sm:text-2xl` — no 2xl:text-3xl step. At 2560px, section headings feel small relative to screen size. |
| Hero heading | `text-3xl sm:text-4xl md:text-5xl` — no huge-desktop step. OK for readability (max-width limits line length). |

#### D. Oversized Spacing

No oversized spacing detected — the standard `py-12 md:py-16` is reasonable, though could scale slightly higher at 2xl:py-20 or 2xl:py-24.

#### E. Fragmented Grids

| Surface | Issue |
|---|---|
| Listings grid | `xl:grid-cols-3` — no 2xl step. At 1920px with sidebar, 3 cols look sparse. |
| Admin stats grid | `xl:grid-cols-6` — likely OK at all widths (many small cards) |
| Homepage featured/latest | Uses FeaturedListings/LatestListings components — grid behavior unknown |

#### F. Toolbar Imbalance

| Surface | Issue |
|---|---|
| Listings sort bar | `flex items-center gap-2` — will spread at huge desktop, OK |
| Admin toolbars | Various `px-6` headers — no huge-desktop constraint |

#### G. Ultrawide UX Failures (3440px+)

| Surface | Issue |
|---|---|
| All public pages | Content island of ~1280px centered on 3440px screen — visually awkward |
| Admin | Full-width stretch — likely uncomfortable |

**Note:** The `.container-wide` (88rem = 1408px) and `.max-w-8xl/9xl/10xl` tokens exist in `globals.css` but are NOT applied to any public pages. This is a gap. `container-wide` was added (Task 50) but not backfilled to existing pages.

---

## §3 — RESPONSIVE HACK INVENTORY

### overflow-hidden Hacks

| File | Pattern | Assessment |
|---|---|---|
| `modules/listings/components/ListingCard.tsx` | `overflow-hidden` on card Link | Legitimate — prevents image bleed outside rounded corners |
| `components/admin/AdminShell.tsx` | `overflow-hidden` on flex container | Legitimate — prevents sidebar overflow |
| Various | `overflow-hidden` on image containers | Legitimate pattern |

No suspicious overflow-hidden hacks masking layout bugs detected.

### Arbitrary Responsive Patches

| File | Pattern | Issue |
|---|---|---|
| `components/layout/Header.tsx:109` | `className={cn(buttonVariants({...}), 'gap-1 px-2 hidden sm:flex')}` | Manual spacing override on buttonVariants |
| `modules/listings/components/ListingCard.tsx:148` | `w-32 shrink-0 sm:w-44` | Responsive width for horizontal card image |
| `components/layout/Header.tsx:104` | `LocaleSwitcher ... className="hidden sm:flex"` | OK — controlled responsive hiding |

### Mobile-Only Hacks

| File | Pattern | Issue |
|---|---|---|
| `components/admin/AdminSidebar.tsx:101` | `className="lg:hidden p-1.5 ..."` on close button | Normal responsive show/hide |
| Various | `hidden md:flex`, `md:hidden` | Normal breakpoint show/hide |

### Desktop-Only Hacks

| File | Pattern | Issue |
|---|---|---|
| `components/admin/AdminSidebar.tsx:167` | `hidden lg:flex w-60` | Normal responsive sidebar |
| `modules/listings/components/ListingsShell.tsx:173` | `hidden lg:block w-72` | Normal responsive sidebar |

### Viewport-Driven Rendering

No `typeof window` viewport-driven rendering detected in UI components. All responsive logic is CSS-driven via Tailwind breakpoints.

**SSR-safe:** All responsive visibility is via CSS `hidden`/`block` classes, not JavaScript viewport detection. No hydration risk from responsive rendering.

### Duplicated Responsive Wrappers

| Pattern | Locations | Risk |
|---|---|---|
| Mobile overlay drawer | `AdminSidebar.tsx` + `ListingsShell.tsx` | HIGH — two custom implementations |
| Filter sheet | `FiltersPanel.tsx` (Sheet) + `ListingsShell.tsx` (custom div) | HIGH — inconsistent |

---

## §4 — BREAKPOINT BEHAVIOR ANALYSIS

### Mobile (320px–480px)

**Public Header:**
- Logo + hamburger menu visible
- Desktop nav hidden (`hidden md:flex`)
- Sheet drawer opens from right (full max-w-xs)
- Mobile bottom nav visible (fixed bottom)
- LocaleSwitcher hidden sm:flex → hidden on 320-479px

**360px specific:**
- Header OK
- Hero title likely wraps correctly (max-w-3xl with centering)
- Stats bar: 2 columns of stats (grid-cols-2), third hidden

**Known risk at 320px:**
- Long Albanian translations in hero title/subtitle could push layout
- Filter chips in listings may need horizontal scroll

### Tablet (640px–768px)

**640px (sm:):**
- LocaleSwitcher appears in header
- Footer changes from 1-col to 2-col grid
- Stats bar shows all 3 (md:grid-cols-3 at 768px)

**768px (md:):**
- Homepage hero heading bumps up (`md:text-5xl`)
- Desktop nav appears (`hidden md:flex`)
- Hamburger hidden (`md:hidden`)
- Footer transitions to 3-col at `md:grid-cols-3`

### Desktop (1024px–1440px)

**1024px (lg:):**
- Admin sidebar appears (`hidden lg:flex w-60`)
- Listings filter sidebar appears (`hidden lg:block w-72`)
- Mobile filter button in listings hidden
- Admin mobile header hidden

**1280px (xl:):**
- Listings grid: 3 columns appear (`xl:grid-cols-3`)
- Admin stats: 6 columns (`xl:grid-cols-6`)

**1440px:**
- Standard desktop behavior
- Content bounded at ~1280px (Tailwind container)
- Reasonable whitespace margins

### Huge Desktop (1720px–2560px)

**1720px:**
- Content is ~1280px wide, ~220px margin per side
- Listings 3-col grid feels slightly sparse

**1920px:**
- ~320px margin per side — noticeable whitespace
- Listings grid still 3 cols
- Admin page stretches (no shell max-width)

**2560px:**
- ~640px margin per side — prominent whitespace on public pages
- Admin full-width without max-width
- Content readable but layout feels narrow relative to screen

**Observation:** The whitespace on public pages at 2560px is a result of the standard Tailwind `container` capping at ~1280px. This is the expected Tailwind behavior and not a bug, but the `container-wide` tokens defined in globals.css were designed to address this and should be applied.

---

## §5 — LOCALIZATION RESPONSIVE RISKS

Locales: `sq` (Albanian — default), `en`, `uk`, `it`

| Surface | Risk | Details |
|---|---|---|
| Hero heading | MEDIUM | Albanian and Ukrainian titles tend to be longer; at 320px `text-3xl` wrapping is expected |
| Header navigation | LOW | "Kreu", "Shpallje" (sq) are short; longer translations could wrap at small widths |
| Mobile locale switcher | LOW | "🇦🇱 SQ", "🇬🇧 EN" — short codes, no wrapping risk |
| Footer | LOW | 3-col grid with `gap-10` — localization of labels unlikely to overflow |
| Filter section labels | MEDIUM | Admin filters with long translated labels + uppercase tracking could wrap |
| CabinetShell tabs | MEDIUM | `hidden sm:inline` label hidden on mobile — RISKY: icon-only at 320px if translation is long |
| Admin sidebar nav | LOW | Items truncate with `truncate` class |
| Card titles | LOW | `line-clamp-2` limits display |
| Status badges | LOW | Short status labels |

**Key localization rule:** No hardcoded locale-specific widths detected. All responsive behavior is locale-agnostic. Good compliance.

---

## §6 — ACCESSIBILITY RESPONSIVE AUDIT

### Touch Target Violations

| File | Element | Size | Minimum Required | Risk |
|---|---|---|---|---|
| `components/admin/AdminSidebar.tsx:101` | Close button (`p-1.5` + h-4 icon) | ~28–32px | 44px | HIGH |
| `components/layout/Header.tsx` | Favorites link (`size="sm"` buttonVariants = h-7) | 28px height | 44px | HIGH |
| `components/layout/Header.tsx` | Login/Register buttons (`size="sm"` = h-7) | 28px | 44px | MEDIUM (desktop only) |
| `modules/listings/components/ListingCard.tsx` | Copy ID button | ~20px | 44px | HIGH (inline button) |
| `modules/listings/components/ListingCard.tsx` | Favorite button | h-8 (default) | 44px | MEDIUM |
| `modules/listings/components/ListingsFilters.tsx` | Close button `h-8 w-8` | 32px | 44px | MEDIUM |

**Compliant (44px):**
- Header hamburger: `size="icon"` = 40px — marginally below 44px
- Mobile locale switcher buttons: `min-h-[44px]` — compliant
- Mobile logout: `min-h-[44px]` — compliant
- Filter accordion triggers: `min-h-[44px]` — compliant
- FilterToggleGroup/FilterMultiToggle/FilterRoomsRow: `min-h-[44px]` — compliant

### Keyboard Navigation

| Surface | Risk | Status |
|---|---|---|
| Header mobile sheet | OK — Sheet manages focus trap | Compliant |
| Admin sidebar mobile drawer | MEDIUM — custom div, no built-in focus trap | Risk |
| Listings filter custom overlay | MEDIUM — custom div, no built-in focus trap | Risk |
| Dialogs/modals | OK — shadcn Dialog manages focus trap | Compliant |
| CabinetShell tabs | MEDIUM — manual buttons, no ARIA tab role | Risk |

### Focus Visibility

Global: `:focus-visible { @apply outline-2 outline-offset-2 outline-ring; }` — defined in globals.css, compliant.

Individual components: Most use `focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring` — compliant.

Exception: Raw `<button>` elements in AdminSidebar and Header use manual `transition-colors` only — relying on global `:focus-visible` rule. This is acceptable.
