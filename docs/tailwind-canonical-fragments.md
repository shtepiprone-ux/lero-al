# Tailwind Canonical Fragments — Lero.al
**Phase 3 of Future Maintenance Direction Epic**
Established: 2026-05-18
Status: CANONICAL REFERENCE — consult before composing Tailwind classes

Fragments documented here are justified by actual codebase repetition (3+ occurrences).
Do NOT copy these fragments blindly — always verify they apply to your context.

---

## §1 — PAGE CONTAINERS

### Public Wide Container
```
container-wide mx-auto
```
- **Use:** All public pages (homepage, listings, listing detail, favorites)
- **Max width:** 88rem (1408px)
- **Responsive:** Fluid below 88rem, centered with padding above
- **Localization:** Locale-agnostic — proportional gutters
- **Huge desktop:** Caps at 1408px — no whitespace wasteland at 2560px
- **Accessibility:** N/A
- **Forbidden:** `container mx-auto px-4` on public pages without `.container-wide`
- **Migration:** Replace `container mx-auto px-4` on public pages with this pattern

### Reading Container (auth, cabinet)
```
max-w-5xl mx-auto px-4 sm:px-6
```
- **Use:** User-focused pages — auth, cabinet, settings
- **Max width:** ~64rem (1024px)
- **Responsive:** Fluid below, centered above
- **Huge desktop:** Comfortable reading width at all viewports

### Admin Content Area
```
p-6 lg:p-8 max-w-6xl mx-auto
```
- **Use:** Admin page content (tables, forms)
- **Max width:** ~72rem (1152px)
- **Responsive:** Tighter padding on mobile, generous on desktop

---

## §2 — CARD WRAPPERS

### Admin / Content Card (MOST COMMON — 26 occurrences)
```
bg-card rounded-2xl border shadow-sm p-5
```
- **Use:** Admin dashboard cards, detail panels, form sections
- **Responsive:** `p-5` on all sizes (dense enough for all)
- **Localization:** No fixed widths — content can grow freely
- **Huge desktop:** Bounded by page container
- **Accessibility:** N/A (decorative container)
- **Forbidden variations:** `bg-white` (hardcoded), `rounded-xl` (mixing context)
- **Migration note:** 26+ occurrences — candidate for a `.card-content` CSS utility class

### Listing Card
```
rounded-xl border bg-card overflow-hidden
```
- **Use:** Property listing cards in grid view
- **Inner content:** `p-3` for compact metadata section
- **Forbidden variations:** `rounded-2xl` (inconsistent with listing context)

### Compact Info Card
```
bg-muted/50 rounded-xl p-4
```
- **Use:** Small informational panels, stat boxes
- **Forbidden:** `bg-white`, `bg-gray-*`

---

## §3 — TOOLBAR WRAPPERS

### Standard Toolbar Row (82 occurrences)
```
flex items-center gap-2
```
- **Use:** Page toolbars, action bars, header rows
- **Localization:** Add `flex-wrap` when label text may differ by locale
- **Responsive:** On mobile, consider `flex-col sm:flex-row`

### Spaced Toolbar (between items)
```
flex items-center justify-between
```
- **Use:** Section headers (title + action button), card headers

### Locale-Safe Wrapping Toolbar
```
flex items-center flex-wrap gap-2
```
- **Use:** Toolbars with translatable labels (filters, navigation groups)
- **Why:** Prevents overflow in Ukrainian/Albanian

### Admin Page Header
```
flex items-center justify-between mb-6
```
- **Use:** Admin page-level header (title + primary action)

---

## §4 — LISTING / CARD GRIDS

### Listing Cards (canonical)
```
grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5
```
- **Use:** All property listing grids (listings page, favorites, search results)
- **Breakpoints:** 1col → 2col@640 → 3col@1280 → 4col@1536
- **Huge desktop:** `2xl:grid-cols-4` REQUIRED — no whitespace wasteland
- **Localization:** Grid cells adapt to content — locale-safe
- **Forbidden:** Stopping at `xl:grid-cols-3` without 2xl step

### Featured Listings Grid
```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4
```
- **Use:** Featured/highlighted listings on homepage

### Latest Listings (compact)
```
grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3
```
- **Use:** Latest listings sidebar or compact grid

---

## §5 — ADMIN TABLE WRAPPERS

### Admin Table Container
```
bg-card rounded-2xl border shadow-sm overflow-hidden
```
- **Inner table:** Use shadcn `Table` component

### Table Toolbar
```
flex items-center justify-between p-4 md:p-6 border-b
```
- **Use:** Table header with search + actions

### Mobile Table Scroll Wrapper
```
overflow-x-auto
```
- **Use:** Wrap tables at mobile width to enable horizontal scroll
- **Localization:** Required for admin tables with localized column headers

---

## §6 — DIALOG / MODAL SPACING

### Standard Dialog Content
```
p-6                    — content area
p-6 pb-0              — header
p-6 pt-0              — footer
```
- **Use:** All confirmation dialogs, form modals
- **Responsive:** Same on all viewports
- **Mobile:** `max-w-[calc(100vw-2rem)]` for narrow viewport safety

### Form Section in Dialog
```
space-y-4             — standard form field stack
```

---

## §7 — FORM LAYOUTS

### Standard Form
```
flex flex-col gap-6
```
- **Use:** Form wrapper

### Form Row (label + input)
```
flex flex-col gap-2
```
- **Use:** Individual form field

### Form Grid (2-column on desktop)
```
grid grid-cols-1 md:grid-cols-2 gap-4
```
- **Use:** Side-by-side form fields (price range, date range)

---

## §8 — FILTER LAYOUTS

### Desktop Sidebar Filter
```
hidden lg:block w-72 shrink-0
```
Inner: `sticky top-20 rounded-2xl border bg-card shadow-sm p-5 max-h-[calc(100vh-6rem)] overflow-y-auto`

### Filter Section Header
```
flex items-center justify-between py-3 text-sm font-semibold
```

### Filter Tag/Badge Row
```
flex flex-wrap gap-2
```
- **Localization:** `flex-wrap` ensures tags wrap when text is longer in some locales

---

## §9 — RESPONSIVE STACKS

### Vertical to Horizontal
```
flex flex-col sm:flex-row gap-4
```
- **Use:** Stacked mobile → side-by-side desktop

### Grid to Stack (reverse)
```
grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6
```
- **Use:** Content + sidebar layout (listings page)

---

## §10 — EMPTY STATES

### Standard Empty State
```
flex flex-col items-center justify-center py-24 gap-4 text-center
```
Inner icon: `h-16 w-16 rounded-2xl bg-muted flex items-center justify-center`
Heading: `text-lg font-semibold`
Description: `text-sm text-muted-foreground max-w-sm`

- **Localization:** `max-w-sm` for description (locale text may vary in length)

---

## §11 — LOADING STATES

### Skeleton Card
```
<Skeleton className="h-[200px] w-full rounded-xl" />
```

### Inline Spinner
```
<Loader2 className="h-4 w-4 animate-spin" />
```

---

## §12 — MOBILE ACTION BARS

### Bottom Action Bar
```
fixed bottom-0 left-0 right-0 pb-safe bg-background border-t p-4
```
- **Use:** Mobile sticky CTA bar
- **Accessibility:** `pb-safe` for iOS notch safety area

### Mobile Sheet Trigger
```
<Button size="icon-xl" variant="outline" className="lg:hidden">
```
- **Use:** Mobile filter/menu open button
- **Touch target:** `size="icon-xl"` = 44px ✅

---

## §13 — HUGE DESKTOP LAYOUT

### Huge Desktop Section Scaling
```
py-12 md:py-16 2xl:py-20    — standard → huge desktop section
```
```
text-xl sm:text-2xl 2xl:text-3xl font-bold  — section heading + huge desktop step
```

### Huge Desktop Grid Enhancement
```
grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4  — listing grid
```

### Huge Desktop Admin
```
max-w-[1800px] mx-auto  — or: max-w-screen-2xl mx-auto
```
- **Use:** Admin shell content area at 2560px

---

## §14 — ADMIN SEGMENTED TABS (Task 296, Path A)

### AdminSegmentedTab — canonical usage

The admin segmented-tab pattern (ghost button + active bg-card state in a muted pill container) uses the canonical `Button` component with `size="tab"`.

**Container (muted pill):**
```tsx
<div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
```

**Tab button:**
```tsx
<Button
  variant="ghost"
  size="tab"
  className={active ? 'bg-card shadow-sm text-foreground hover:bg-card' : 'text-muted-foreground hover:text-foreground'}
>
  {label}
</Button>
```

- **`size="tab"`** = `h-auto px-4 py-2` (overrides default `h-8`; base already provides `rounded-lg`, `text-sm`, `transition-colors`)
- **Active state** — `bg-card shadow-sm` creates the raised pill; `hover:bg-card` prevents ghost's `hover:bg-muted` from fighting it
- **Inactive state** — `text-muted-foreground hover:text-foreground` dims label; no bg so ghost hover applies naturally
- **Extraction path** — Path A chosen (2026-05-30): Button CVA size variant preferred over a new wrapper component; active/inactive conditional className stays at call sites (3 sites: AdminListingsTable, AdminSettings, AdminUsersTable)
- **Do NOT** add the active/inactive logic to the `tab` size variant — it is state-dependent and must be composed at the call site
