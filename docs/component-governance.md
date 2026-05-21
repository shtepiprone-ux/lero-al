# Component Governance — Lero.al
**Phase 1 of Responsive/UI Governance Epic**  
Audit date: 2026-05-18  
Status: GOVERNANCE REFERENCE — no code was changed during creation  

---

## §1 — CANONICAL PRIMITIVE MAP

This map defines the single canonical implementation for each primitive type. Future Claude Code tasks MUST consult this map before creating or modifying primitives.

### Buttons

**Canonical:** `Button` from `@/components/ui/button`  
**Underlying primitive:** `@base-ui/react/button`  
**Variant system:** CVA via `buttonVariants`

| Size | Height | Use Case | Touch Target | Status |
|---|---|---|---|---|
| `xs` | 24px (h-6) | Compact badges, inline actions | ❌ Below 44px | Admin table micro-actions only |
| `sm` | 28px (h-7) | Desktop-only secondary actions | ❌ Below 44px | Desktop only — never on mobile |
| `default` | 32px (h-8) | Standard actions | ❌ Below 44px | Desktop only — never on mobile |
| `lg` | 36px (h-9) | Emphasized actions | ❌ Below 44px | Desktop only — never on mobile |
| `xl` | 44px (h-11) | Mobile-safe CTA, primary actions | ✅ 44px | Use for all mobile-reachable buttons |
| `icon` | 40px (size-10) | Icon-only desktop | ⚠️ Below 44px | Desktop icon buttons |
| `icon-xl` | 44px (size-11) | Icon-only mobile-safe | ✅ 44px | Mobile icon buttons |
| `icon-sm` | 28px (size-7) | Micro icon actions | ❌ Below 44px | Admin tables only |
| `icon-xs` | 24px (size-6) | Tiny icon actions | ❌ Below 44px | Admin tables only |
| `icon-lg` | 36px (size-9) | Larger icon actions | ❌ Below 44px | Desktop only |

**Canonical Variants:**
- `default` — Primary action (filled brand color)
- `outline` — Secondary action
- `secondary` — Alternative secondary
- `ghost` — Nav links, subtle actions
- `destructive` — Danger/delete
- `link` — Text links with underline behavior

**Rules:**
- NEVER create raw `<button>` for interactive UI — always use `Button`
- NEVER use `h-11` as a className on `Button` — use `size="xl"`
- NEVER use `size="sm"` or smaller on mobile-reachable elements
- For `<Link>` styled as button: acceptable to use `buttonVariants()` + `cn()` on Link when `asChild` semantics are needed
- Raw `<button>` is only acceptable for non-standard interactive patterns that cannot be expressed via Button (e.g., custom accordion triggers with specific ARIA roles)

---

### Inputs

**Canonical:** `Input` from `@/components/ui/input`  
**Underlying primitive:** `@base-ui/react/input`  
**Height:** `h-9` (36px) — currently the only size  

**Known Gap:** Input has no size variants. On mobile, 36px falls below the recommended 44px touch target for text inputs. Future Phase 3 work should add `size="lg"` (44px) for mobile forms.

**Rules:**
- NEVER create local input wrappers — always use `Input`
- `AdminSearchInput` (wraps Input + icon) is an acceptable composition pattern
- `FilterRangeInputs` (wraps two Inputs) is an acceptable composition pattern
- NEVER override Input height via className — wait for size variant

---

### Icons

**Canonical family:** `lucide-react` — the ONLY approved icon library.  
**Mixed icon systems:** FORBIDDEN.

**Current icon sizes (observed, no canonical map enforced yet):**

| Size Class | px | Usage |
|---|---|---|
| `h-3 w-3` | 12px | Tiny metadata (e.g., camera count, small badges) |
| `h-3.5 w-3.5` | 14px | Secondary metadata, small inline icons |
| `h-4 w-4` | 16px | Standard size — nav items, button icons (default CVA) |
| `h-5 w-5` | 20px | Prominent icons — header hamburger, admin |
| `h-6 w-6` | 24px | Large decorative icons |
| `h-12 w-12` | 48px | Hero/CTA decorative icons |

**Phase 3 canonical target — icon size map to be enforced:**

| Semantic Role | Canonical Size | px |
|---|---|---|
| Button icon (default) | `size-4` (CSS default via CVA) | 16px |
| Nav item icon | `h-4 w-4` | 16px |
| Metadata icon | `h-3.5 w-3.5` | 14px |
| Tiny label icon | `h-3 w-3` | 12px |
| Hero/CTA icon | `h-6 w-6` | 24px |
| Section feature icon | `h-12 w-12` | 48px |

**Rules:**
- NEVER use arbitrary icon sizes not in the canonical size map
- NEVER import from a different icon library
- NEVER set `h-*` on icons inside Button — CVA handles icon sizing via `[&_svg:not([class*='size-'])]:size-4`

---

### Cards

**Current state:** No canonical Card primitive is being consistently used. The shadcn `Card` component exists at `@/components/ui/card.tsx` but is rarely used in favor of inline Tailwind utility composition.

**Common inline pattern (admin/cabinet):**
```
bg-card rounded-2xl border shadow-sm p-5
```

**Listing card pattern:**
```
rounded-xl border bg-card overflow-hidden
```

**Gap:** `rounded-xl` vs `rounded-2xl` inconsistency. Admin uses `rounded-2xl`, listing cards use `rounded-xl`.

**Phase 2 canonical target:** Define a canonical card token — likely `rounded-2xl border bg-card` as the standard, with `rounded-xl` only for compact contexts (e.g., listing card images).

**Rules:**
- NEVER use hardcoded bg-white or arbitrary background colors for cards
- ALWAYS use `bg-card` token
- ALWAYS use `border` (semantic border token)
- Prefer `rounded-2xl` for primary content cards
- Prefer `rounded-xl` for compact/inline cards

---

### Modals & Dialogs

**Canonical:** shadcn `Dialog` from `@/components/ui/dialog.tsx` for true modals/dialogs.  
**Canonical:** shadcn `Sheet` from `@/components/ui/sheet.tsx` for panel/drawer patterns.

| Use Case | Canonical Component |
|---|---|
| Confirmation dialogs | `Dialog` |
| Form modals | `Dialog` |
| Filter panel (homepage) | `Sheet` (side="right") |
| Mobile navigation drawer | `Sheet` (side="right") — currently only Header uses Sheet; AdminSidebar uses custom div |
| Mobile filter sheet (listings) | `Sheet` (side="left") — currently custom div |
| Avatar crop modal | `Dialog` (correctly implemented) |

**Duplication gap:** Mobile filter sheet in `ListingsShell.tsx` and mobile nav drawer in `AdminSidebar.tsx` both use custom `div`-based overlays instead of `Sheet`. This creates maintenance duplication and accessibility gaps (no built-in focus trap).

---

### Tables

**Canonical:** shadcn `Table` from `@/components/ui/table.tsx` for all data tables.  
**Current state:** Admin tables use the shadcn Table component — correct.  
**Gap:** Tables lack horizontal scroll wrapper on mobile — overflow behavior undefined.

---

### Comboboxes / Search Inputs

**Canonical:** `Combobox` from `@/components/shared/Combobox.tsx`  
**Extended variants:** `LocationCombobox`, `PropertyTypeCombobox`, `YearCombobox`  
**Rule:** Combobox is the canonical selection component. shadcn `Select` is deprecated for domain flows.

---

### Toolbars

**Current state:** No canonical Toolbar primitive. Toolbars are composed inline in each page.  
**Common pattern:** `flex items-center gap-2` or `flex items-center justify-between` with child Buttons.  
**Admin toolbar pattern:** `AdminPageHeader` wraps a title + optional actions area.  
**Phase 4 target:** Define canonical toolbar composition rules.

---

### Containers

**Canonical wide container:** `.container-wide` from `globals.css` — max-width: 88rem (1408px)  
**Canonical standard container:** Tailwind `container mx-auto px-4` (caps at ~1280px at xl:)  
**Custom max-width tokens:** `.max-w-8xl` (88rem), `.max-w-9xl` (96rem), `.max-w-10xl` (112rem)

**Gap:** Public pages use `container mx-auto px-4` (1280px max) but `.container-wide` was introduced in Task 50 and not backfilled to existing pages. Future work should migrate public pages to `.container-wide` for better huge-desktop behavior.

---

### Responsive Wrappers

**Canonical responsive sidebar pattern (listings):**
```jsx
{/* Desktop */}
<aside className="hidden lg:block w-72 shrink-0">
  <div className="sticky top-20 rounded-2xl border bg-card shadow-sm p-5 max-h-[calc(100vh-6rem)] overflow-y-auto">
    {content}
  </div>
</aside>
{/* Mobile sheet */}
{open && <Sheet>...</Sheet>}
```

**Canonical responsive sidebar pattern (admin):**
```jsx
{/* Desktop */}
<aside className="hidden lg:flex w-60 shrink-0 border-r h-screen sticky top-0">
  {content}
</aside>
{/* Mobile: custom div (should become Sheet) */}
```

---

### Empty States

**Current state:** Empty state implemented inline in `ListingsShell.tsx`:
```jsx
<div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
  <div className="h-16 w-16 rounded-2xl bg-muted ...">🏠</div>
  <h3>...</h3>
  <p>...</p>
</div>
```

**Phase target:** Extract to shared `EmptyState` component.

---

### Loading States

**Current patterns:**
- `Skeleton` from `@/components/ui/skeleton` — used in ListingsShell lazy load fallback
- `Loader2 animate-spin` from lucide-react — used inline in load-more button
- `loading.tsx` — page-level loading skeleton in listings detail

**No canonical loading state primitive** — these are acceptable patterns at current scale.

---

## §2 — DUPLICATE MIGRATION MAP

| Duplicate Primitive | File | Canonical Primitive | Migration Complexity | Regression Risk |
|---|---|---|---|---|
| Raw close `<button>` | `AdminSidebar.tsx:101` | `Button size="icon-sm" variant="ghost"` | LOW | LOW |
| Raw logout `<button>` | `AdminSidebar.tsx:144` | `Button variant="ghost"` | LOW | LOW |
| Raw logout `<button>` | `Header.tsx:283` | `Button variant="ghost" size="xl"` | LOW | LOW |
| Custom tab buttons | `CabinetShell.tsx:104` | shadcn `Tabs` | MEDIUM (state management change) | MEDIUM |
| Custom tab buttons | `AdminCurrencyTabs.tsx` | shadcn `Tabs` | MEDIUM | MEDIUM |
| Local AccordionSection | `ListingsFilters.tsx:24` | shadcn `Accordion` | MEDIUM (behavior parity needed) | MEDIUM |
| Custom mobile overlay | `AdminSidebar.tsx:173` | shadcn `Sheet` | MEDIUM | MEDIUM |
| Custom filter overlay | `ListingsShell.tsx:181` | shadcn `Sheet` | MEDIUM | MEDIUM |
| Inline card pattern | `admin/page.tsx:80` | Canonical card token | LOW (class extraction) | LOW |
| Inline card pattern | `CabinetShell.tsx:74` | Canonical card token | LOW | LOW |

---

## §3 — ANTI-PATTERN INVENTORY

### Inline Responsive Logic

| File | Pattern | Issue |
|---|---|---|
| `ListingCard.tsx:148` | `w-32 sm:w-44` | Arbitrary responsive width on image container |
| `Header.tsx:109` | Manual `gap-1 px-2` override on buttonVariants | Bypasses Button padding system |

### Local Primitive Clones

See §2 above. Key items:
- Custom accordion in `ListingsFilters.tsx`
- Custom tab buttons in `CabinetShell.tsx` and `AdminCurrencyTabs.tsx`
- Custom overlay drawers in `AdminSidebar.tsx` and `ListingsShell.tsx`
- Raw `<button>` elements in sidebar and header

### Duplicated Tailwind Fragments

See `ui-audit.md §3`. Key items:
- `bg-card rounded-2xl border shadow-sm` — card pattern (5+ locations)
- `container mx-auto px-4` — container pattern (9 files)
- `px-3 py-2.5 rounded-xl text-sm font-medium` — nav item / tab button pattern

### Page-Level Styling Systems

| File | System | Issue |
|---|---|---|
| `app/admin/page.tsx` | Inline `STATUS_STYLE` map | Acceptable — presentation layer |
| `app/admin/page.tsx` | `StatCard` local component | Could be shared admin primitive |
| `modules/listings/components/ListingCard.tsx` | `CLOSED_OVERLAY_STYLE` map | Acceptable — presentation layer |

### Uncontrolled Utility Composition

| Pattern | Frequency | Issue |
|---|---|---|
| `text-[10px]` | 8+ | Arbitrary sub-scale text size, not in canonical type scale |
| `rounded-xl` vs `rounded-2xl` | Mixed | Inconsistent card radius across admin vs listings |
| `py-12 md:py-16` | 5 sections | Consistent but not a design token |
| `text-xs font-semibold uppercase tracking-widest` | 3+ | Section group label — should be a utility class |

---

## §5 — COMPONENT CATALOGING SYSTEM (Phase 6)

---

## §11 — Admin Table Row Interaction Pattern (Epic K / Task 127)

**Established:** 2026-05-21

### Problem

Multiple admin tables use inconsistent row-interaction patterns:
- Some have a dedicated "Actions" column with Pencil + Trash2 icon buttons (duplication)
- Some use `window.confirm()` for destructive actions (blocks main thread, no i18n)
- Row primary text is rarely clickable, hiding the affordance

### Canonical pattern

**Rule 1 — Single click affordance.** The row's primary text field (listing title, user name, report reason) is the **only** clickable element in the row. All other row cells are read-only.

**Rule 2 — No Actions column.** The dedicated "Actions" / icon-button column is removed. Actions live inside the dialog or detail page opened by Rule 1.

**Rule 3 — Click target outcome:**
- If the table has a **full-page detail view** (e.g., `/admin/users/[id]`): primary text is a `<Link>` navigating there.
- If the table has **no detail page**: primary text is a `<button>` that opens a preview `Dialog` containing key details + action buttons (Edit, Delete, Close).

**Rule 4 — Destructive confirmation via Dialog.** Delete actions show a shadcn `Dialog` confirmation dialog. `window.confirm()` is forbidden.

**Rule 5 — Canonical primitives only.**
- Buttons: `Button` from `@/components/ui/button` (never raw `<button>`)
- Dialog: `Dialog/DialogContent/DialogHeader/DialogTitle/DialogFooter` from `@/components/ui/dialog`
- Toast: `toast` from `sonner` for success/error feedback

### Reference implementation

`src/components/admin/AdminReportsManager.tsx` — **already canonical.**
- Report row primary field opens `ReportDetailDialog` (Dialog)
- Dialog contains all actions (review, resolve, dismiss)
- No Actions column
- Uses `Dialog` for confirmation via status transitions

### Audit results (as of Task 127)

| Component | Clickable title | Actions col | Delete method | Status |
|---|---|---|---|---|
| `AdminReportsManager` | ✅ → Dialog | ❌ | Dialog | **CANONICAL** |
| `AdminUsersTable` | ✅ → profile page | ⚠️ verify toggle only | — | Mostly OK — K.3 removes verify column |
| `AdminListingsTable` | ❌ | ✅ Pencil+Trash+Star | `window.confirm()` | **K.2 migration needed** |
| `AdminCompaniesManager` | ❌ | ✅ Pencil+Trash in card | Dialog | **K.4 migration needed** |
| `AdminLocationsManager` | ❌ | ✅ Pencil+Trash | `window.confirm()` | **K.4 migration needed** |
| `AdminPropertyTypesManager` | ❌ | ✅ Pencil+Trash | Dialog | **K.4 migration needed** |
| `AdminEmailTemplatesManager` | ✅ Edit button | Pencil+Trash | Dialog | Minor — K.4 review |
| `AdminCurrenciesManager` | — | ✅ buttons | — | K.4 audit |

### Migration checklist (for K.2 / K.3 / K.4)

For each non-canonical table:
- [ ] Make primary text field a `<button>` (or `<Link>` if detail page exists)
- [ ] Add preview Dialog (or use existing detail page)
- [ ] Move Edit/Delete actions into the Dialog
- [ ] Remove the Actions column header + cell
- [ ] Replace `window.confirm()` with Dialog confirmation
- [ ] Replace raw `<button>` with `Button` component
- [ ] Verify all 4 locales and 7 breakpoints still render correctly

**Established:** 2026-05-21

The project maintains a machine-readable + human-readable component catalog.

### Commands

```bash
npm run governance:components   # fast check (CI-safe)
npm run catalog:components      # full scan + report generation
```

### Catalog output files

| File | Contents |
|---|---|
| `docs/component-catalog.md` | Full component inventory by area |
| `docs/component-coverage-matrix.md` | Storybook/screenshot/locale/breakpoint coverage |
| `docs/component-risk-register.md` | Risk register (violations, locale, huge-desktop, TW entropy) |
| `docs/component-catalog-governance.md` | Classification rules (canonical/approved/debt) |
| `scripts/governance/reports/component-catalog.latest.json` | Machine-readable catalog (gitignored) |

### Classification model

See `docs/component-catalog-governance.md` for the full classification model.

**Status values:**
- `CANONICAL` — canonical primitive with story, fully compliant
- `APPROVED` — approved, no critical flags
- `NEEDS_STORY` — should have a Storybook story
- `MANUAL_REVIEW` — has governance flags, requires human review

### Story / screenshot coverage expectations

See `docs/component-catalog-governance.md §4–5` for when stories and screenshot
targets are required. The current coverage gap is documented in
`docs/component-coverage-matrix.md § Coverage Gaps`.
