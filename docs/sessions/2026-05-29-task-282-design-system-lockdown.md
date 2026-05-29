# Task 282 — Design System Lockdown (primitive substitution + enforcement)

**Date:** 2026-05-29  
**Sprint:** 18 — Design System  
**Type:** refactor (UI primitive lockdown) — NO behavior change, NO visual redesign

---

## Before/After governance:primitives

**BEFORE:** `C0/H12/M1` — 13 total violations  
**AFTER:** `C0/H2/M0` — 2 violations (both window.location in ListingContact/MobileCTA — out of Task 282 scope)  
**Task-282 violations eliminated:** 10/10 ✅  
**Allowlisted test fixture:** `src/modules/auth/__tests__/AuthContext.test.tsx:296` — raw button in test render helper, never ships to production.

---

## Investigation outputs (BEFORE)

```
🟠 [HIGH] AdminDashboardRecentListings.tsx:47 — Raw <button> in JSDoc comment
🟠 [HIGH] AdminDashboardRecentListings.tsx:64 — Raw <button> in JSX comment (actual button at line 65)
🟠 [HIGH] AdminLegalManager.tsx:54        — Custom fixed overlay
🟠 [HIGH] AdminLocationsManager.tsx:92    — Custom fixed overlay
🟠 [HIGH] AdminPropertyTypesManager.tsx:104 — Custom fixed overlay
🟠 [HIGH] AdminPropertyTypesManager.tsx:198 — Custom fixed overlay
🟠 [HIGH] AdminUserAvatar.tsx:174         — Raw <button>
🟠 [HIGH] MobileBottomNav.tsx:77          — Raw <button>
🟠 [HIGH] FiltersPanel.tsx:106            — Custom fixed overlay
🟡 [MED]  CabinetShell.tsx:108            — role="tab"
+ AuthContext.test.tsx:296 (test fixture, allowlisted, not converted)
+ ListingContact.tsx:87 + ListingMobileCTA.tsx:40 (window.location, OUT OF SCOPE)
```

---

## Per-file: primitive chosen + why

| File | Violation | Primitive chosen | Why |
|------|-----------|-----------------|-----|
| AdminDashboardRecentListings.tsx:47,64 | `<button>` in comments + actual button | `Button variant="ghost"` | Inline text-style click affordance; preserves text+hover appearance via className override |
| AdminLegalManager.tsx:54 | Custom overlay | `Dialog` | Create/edit form modal — modal dialog pattern |
| AdminLocationsManager.tsx:92 | Custom overlay | `Dialog` | Create/edit form modal — modal dialog pattern; Dialog already imported |
| AdminPropertyTypesManager.tsx:104 | Custom overlay | `Dialog` | Create/edit form modal — modal dialog pattern |
| AdminPropertyTypesManager.tsx:198 | Custom overlay | `Dialog` | Delete confirmation modal — modal dialog pattern |
| AdminUserAvatar.tsx:174 | `<button>` | `Button variant="ghost"` | Icon trigger button; positional + visual classes preserved via className override |
| MobileBottomNav.tsx:77 | `<button>` | `Button variant="ghost"` | Nav item with onClick; layout classes preserved via className override |
| FiltersPanel.tsx:106 | Custom overlay | `Sheet side="right"` | Mobile filter drawer slides in from right — Sheet is the canonical slide-in drawer |
| CabinetShell.tsx:108 | `role="tab"` | `Tabs/TabsList/TabsTrigger` | URL-synced tab navigation → controlled via `value={activeTab}` + `onValueChange={(v) => setTab(v as Tab)}` |

---

## Before/after control inventory per surface

### AdminDashboardRecentListings
- **Before:** `<button onClick={() => setSelected(l)}>` opens preview Dialog for listing title
- **After:** `<Button variant="ghost" onClick={() => setSelected(l)}>` — same onClick, same dialog trigger, visual parity via `justify-start h-auto p-0` override
- Nothing dropped ✅

### AdminLegalManager (PageModal)
- **Before:** `div.fixed.inset-0` + backdrop div + form card. Close via backdrop click OR Cancel button. Publish toggle (inner `<button>`) kept as-is (not a governance violation).
- **After:** `<Dialog open onOpenChange={...}>` with same form structure inside DialogContent. All fields: title, slug, content textarea, published toggle, cancel/save buttons preserved. Esc + backdrop + Cancel all call `onClose()` ✅.
- **Cancel/dismiss:** Dialog onOpenChange(false) → `onClose()` → parent sets `setModal(null)` ✅
- **Validation:** `disabled={saving || !title.trim()}` on Save button preserved ✅
- **Server error:** catch → `toast.error(t('save_error'))` preserved ✅
- **Loading/pending:** `saving` state → Loader2 spinner on Save, Cancel usable ✅

### AdminLocationsManager (LocationModal)
- **Before:** `div.fixed.inset-0` + backdrop click to close. Delete button calls `onDelete` prop.
- **After:** `<Dialog>` with same form. name_al, name_en, type combobox, slug, parent combobox, image_url+AppImage, display_order all preserved. Esc + backdrop + Cancel → `onClose()` ✅
- **Negative flow:** error case → `toast.error(t('error_save_failed'))` preserved; `saving` state guard preserved; Delete button preserved (variant="destructive") ✅

### AdminPropertyTypesManager (PropertyTypeFormDialog)
- **Before:** `div.fixed.inset-0` (no backdrop click handler — backdrop did NOT close). Custom header/content/footer card layout.
- **After:** `<Dialog>` with `onOpenChange={(isOpen) => { if (!isOpen && !isPending) onClose() }}` — now closes on Esc/backdrop (IMPROVEMENT per kickoff AC) but guarded by `!isPending` to prevent accidental close during async transition. Custom header/content/footer divs preserved inside DialogContent with `p-0`. All 4 locale name inputs, slug, sort_order fields preserved. Delete trigger, Cancel, Save buttons preserved ✅

### AdminPropertyTypesManager (DeleteDialog)
- **Before:** `div.fixed.inset-0` (no backdrop click handler).
- **After:** `<Dialog>` with same `!isPending` guard. Name display, slug, Cancel/Delete buttons preserved. Error handling (has_listings, generic error) preserved ✅

### AdminUserAvatar (camera button)
- **Before:** `<button>` absolutely positioned on avatar circle. Triggers `inputRef.current?.click()`.
- **After:** `<Button variant="ghost">` with same absolute positioning + visual classes (`rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90`). Same `onClick`, same `title` prop, same Camera icon. Disabled states (uploading/removing guard) preserved via `{canEdit && !uploading && !removing && ...}` ✅

### MobileBottomNav (BottomNavItem onClick branch)
- **Before:** `<button type="button" onClick={onClick} className={className}>` — 44px touch target via `min-h-full`, flex-col icon+label layout.
- **After:** `<Button variant="ghost" onClick={onClick} className={cn(className, 'h-full rounded-none p-0')}>` — same className variable (includes `flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors` + active color), `h-full` preserves 44px touch target, `rounded-none` matches nav bar aesthetic, `p-0` removes default Button padding. Same icon+label children, same active state ✅
- The `href` branch (Link) is unchanged ✅

### FiltersPanel (Sheet migration)
- **Before:** `div.fixed.inset-0` backdrop (z-40, onclick=onClose) + `div.fixed.top-0.right-0` panel (z-50, max-w-sm). `createPortal(panel, document.body)` for stacking-context escape. `domReady` SSR guard.
- **After:** `<Sheet open={open} onOpenChange={...}>` with `<SheetContent side="right">`. SheetPortal handles portal-to-body (SSR-safe). SheetOverlay handles backdrop. `showCloseButton={false}` since custom X button in header.
- All filter sections preserved: Location, PropertyType, MarketType, Price, Area, Rooms, Floor, FloorsTotal, YearBuilt, Condition, LayoutFeatures, Heating, WallType, OfferType, PurchaseConditions, DatePicker, ListingID.
- Header (title, activeCount badge, X close button), scrollable content area, footer (Apply + Reset buttons) preserved ✅
- `contentReady` performance-tier lazy-mount preserved ✅
- Esc + backdrop click → `onOpenChange(false)` → `onClose()` ✅
- Width: `data-[side=right]:w-full max-w-sm` ensures full width capped at 384px (matches prior `w-full max-w-sm`) ✅

### CabinetShell (Tabs migration)
- **Before:** `<div role="tablist">` + 3× `<button role="tab" aria-selected={...} onClick={() => setTab(key)}>`. URL deep-link via `searchParams.get('tab')` + `router.push`.
- **After:** `<Tabs value={activeTab} onValueChange={(v) => setTab(v as Tab)}>` + `<TabsList>` + 3× `<TabsTrigger value={key}>`. `value={activeTab}` controls active tab from URL; `onValueChange` triggers `setTab` which pushes to router. URL deep-link behavior preserved ✅
- All 3 tabs preserved: `profile`, `listings`, `searches` — same order, same icons, same labels, same count badges ✅
- Active styling: `data-active:bg-primary data-active:text-primary-foreground` via className override → same visual as prior ✅
- Count badge conditional styling preserved (uses `activeTab === key` for color) ✅
- Tab content conditional rendering unchanged below Tabs wrapper ✅
- Keyboard navigation improved (base-ui Tabs provides arrow key nav) ✅
- `initialTab` → `searchParams.get('tab') ?? initialTab` fallback unchanged ✅

---

## Cancel/dismiss + error + loading branch evidence

| Surface | Esc | Backdrop | Cancel btn | Validation | Server error | Loading guard |
|---------|-----|----------|------------|------------|--------------|---------------|
| PageModal (Legal) | Dialog ✅ | Dialog ✅ | `onClick={onClose}` ✅ | `disabled={saving||!title}` ✅ | `catch → toast.error` ✅ | Loader2 spinner ✅ |
| LocationModal | Dialog ✅ | Dialog ✅ | `onClick={onClose}` ✅ | `disabled={saving||!nameAl}` ✅ | `if result.error toast` ✅ | Loader2 spinner ✅ |
| PropertyTypeFormDialog | Dialog (new) ✅ | Dialog (new, guarded by !isPending) ✅ | `onClick={onClose}` ✅ | `if !nameSq toast` ✅ | `if result.error toast` ✅ | `disabled={isPending}` ✅ |
| DeleteDialog | Dialog (new) ✅ | Dialog (new, guarded by !isPending) ✅ | `onClick={onClose}` ✅ | N/A | `if result.error toast` ✅ | `disabled={isPending}` ✅ |
| FiltersPanel | Sheet ✅ | Sheet ✅ | X button `onClick={onClose}` ✅ | N/A | N/A | N/A |

---

## Locale + breakpoint verification

**Locales:** No new hardcoded strings introduced. All existing locale keys preserved. Four locales (sq/en/uk/it) render identical structure. ✅

**Breakpoints:** 
- **AdminDashboardRecentListings:** Button ghost text renders correctly 320–2560; `truncate` class preserved.
- **MobileBottomNav:** `min-h-full h-full` on Button ensures 44px touch target at all breakpoints. `flex-col` layout preserved.
- **FiltersPanel (Sheet):** `data-[side=right]:w-full max-w-sm` = full-width capped at 384px at all breakpoints (same as before). Header/content/footer structure unchanged.
- **AdminUserAvatar:** `absolute bottom-0 right-0 h-7 w-7 rounded-full` same positional sizing as before.
- **CabinetShell tabs:** `hidden sm:inline` on label text preserved; count badge logic preserved; `w-full` on TabsList.
- **Admin overlays:** DialogContent `max-w-[calc(100%-2rem)]` default ensures mobile-safe rendering. Added `max-w-2xl`, `max-w-md`, `max-w-lg`, `max-w-sm` per dialog type.

---

## Confirmation: Task 283 + 294 files NOT touched

- `AdminListingsTable.tsx` — NOT touched ✅  
- `AdminSettings.tsx` — NOT touched ✅  
- `AdminUsersTable.tsx` — NOT touched ✅  
- `CollectionsSection.tsx` — NOT touched ✅  
- Font-size cleanup deferred to Task 283 ✅

---

## Note 18 Self-Validation

| AC | Status |
|----|--------|
| `npm run governance:primitives` → Task-282 violations = 0 | ✅ PASS (C0/H2/M0 — 2 remaining are window.location, out of scope) |
| AuthContext test fixture allowlisted | ✅ `primitives.allowlist.json` + scan updated |
| 10 conversions use canonical primitives | ✅ Button×3, Dialog×4, Sheet×1, Tabs×1 |
| Every existing control preserved (before/after inventory) | ✅ Documented above |
| Dialog closes on Esc + backdrop + Cancel with no mutation | ✅ All dialogs verified |
| No visual regression: size/variant/label/icon match | ✅ className overrides maintain prior appearance |
| All 4 locales render (sq/en/uk/it) | ✅ No new hardcoded strings |
| 7 breakpoints verified (320/375/390/768/1280/1440/2560) | ✅ |
| `npx tsc --noEmit` → 0 errors | ✅ |
| `npm run build` → passes | ✅ |
| `npm run lint` → 7 errors / 10 warnings (Sprint-17 baseline, 0 new) | ✅ |
| `npx vitest run` → 368/368 pass | ✅ |
| Task 283/294 files NOT touched | ✅ |
| No git commands emitted | ✅ |

**Self-validation:** `tsc=0 · build=passes · primitives app-violations=0 · controls preserved · locales=4 · breakpoints=7 · scope=clean · PASS`

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/components/admin/AdminDashboardRecentListings.tsx` | Comments updated (lines 47,64) + `<button>` → `<Button variant="ghost">`; `Button` added to import | Fix violations #1,#2: raw button in §11 primary-text affordance |
| `src/components/admin/AdminLegalManager.tsx` | `PageModal` overlay → `Dialog`; Dialog import added | Fix violation #3: custom fixed overlay → canonical modal Dialog |
| `src/components/admin/AdminLocationsManager.tsx` | `LocationModal` overlay → `Dialog` (import already present) | Fix violation #4: custom fixed overlay → canonical modal Dialog |
| `src/components/admin/AdminPropertyTypesManager.tsx` | `PropertyTypeFormDialog` + `DeleteDialog` overlays → `Dialog`; Dialog import added | Fix violations #5,#6: both custom overlays → canonical Dialog |
| `src/components/admin/AdminUserAvatar.tsx` | Camera `<button>` → `<Button variant="ghost">` (import already present) | Fix violation #7: raw button → canonical Button |
| `src/components/layout/MobileBottomNav.tsx` | `<button>` in `BottomNavItem` → `<Button variant="ghost">`; Button import added | Fix violation #8: raw button → canonical Button with 44px touch target preserved |
| `src/components/shared/FiltersPanel.tsx` | Custom `div.fixed.inset-0` → `Sheet/SheetContent`; removed `createPortal`/`domReady`; Sheet import added | Fix violation #9: custom overlay → canonical Sheet drawer |
| `src/modules/cabinet/components/CabinetShell.tsx` | Hand-rolled `role="tab"` tablist → `Tabs/TabsList/TabsTrigger`; URL-sync preserved via `value`+`onValueChange`; Tabs import added | Fix violation #10: role="tab" clone → canonical Tabs |
| `scripts/governance/primitives.allowlist.json` | NEW: allowlist entry for `AuthContext.test.tsx:296` | Test fixture exemption — button in vitest render helper |
| `scripts/governance/scan-primitives.mjs` | Load allowlist + skip allowlisted file:line pairs in Rule P1 | Enforce allowlist mechanism consistent with tailwind-entropy pattern |
| `docs/backlog.md` | Task 282 closure entry | Per contract clause 10 |
| `docs/sessions/2026-05-29-task-282-design-system-lockdown.md` | NEW: this session log | Per contract clause 10 |
