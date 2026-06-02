# Task 359 — Mobile control & tab stacking contract (< sm)

**Date:** 2026-06-02  
**Executor:** Sonnet 4.6  
**Type:** global responsive correctness contract — buttons + tabs full-width below sm (640px); NO route migration, NO new primitives

---

## Summary

Establishes the canonical mobile stacking contract at the `sm` (640px) breakpoint: below 640px, action button clusters stack vertically (each full-width), and tab lists become full-width with ≥44px touch targets. Applies to `tabs.tsx` (primitive), `PageHeader.tsx`, `FilterBar.tsx`, and `AdminPageShell.tsx`. All 6 real tab consumers inherit the fix from the primitive without direct edits.

No new primitive was added. `button.tsx` unchanged. No `src/app` diff.

---

## §17 UI Pre-flight

| Check | Files touched | Result |
|---|---|---|
| Arbitrary `h-[...]` | `tabs.tsx` — `h-[calc(100%-1px)]` is pre-existing in the primitive trigger (desktop-only; overridden by `max-sm:min-h-11` on mobile) | JUSTIFIED — pre-existing, necessary for desktop pill height |
| Arbitrary `z-[...]` | none in touched files | CLEAN |
| `max-md:` / `md:flex-row` stale breakpoints | none remain in touched files | CLEAN |
| Inline `style={}` | none | CLEAN |
| Same-row height | action clusters use `size="xl"` (44px) consistently | PASS |

---

## Changes made

### `src/components/ui/tabs.tsx`

**`tabsListVariants` base:** added `max-sm:flex max-sm:w-full max-sm:h-auto`
- `max-sm:flex`: overrides `inline-flex` → block-level flex container on mobile
- `max-sm:w-full`: full container width on mobile
- `max-sm:h-auto`: removes fixed `group-data-horizontal/tabs:h-8` (32px) constraint on mobile so list grows to trigger height

**`TabsList` function:** added `mobileScroll?: boolean` prop (default `false`)
- When `true`: adds `max-sm:overflow-x-auto max-sm:flex-nowrap` → horizontal scroll strip for >3 long-label tabs

**`TabsTrigger` className:** added `max-sm:min-h-11`
- Ensures ≥44px touch target on mobile via `min-height: 2.75rem`
- Does not override consumer `h-auto` absolutely — uses `min-height` so natural content height can still expand

### `src/components/layout/PageHeader.tsx`

| Before | After |
|---|---|
| `flex flex-col gap-4 md:flex-row md:items-center md:justify-between` | `flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between` |
| `shrink-0 max-md:w-full [&>*]:max-md:w-full` | `shrink-0 max-sm:w-full [&>*]:max-sm:w-full` |

Action slot becomes full-width below 640px (was 768px); header goes inline at 640px (was 768px).

### `src/components/admin/AdminPageShell.tsx`

| Before | After |
|---|---|
| `flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4` | `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4` |
| `flex flex-col gap-2 md:flex-row md:items-center md:flex-wrap md:shrink-0 max-md:w-full [&>*]:max-md:w-full` | `flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap sm:shrink-0 max-sm:w-full [&>*]:max-sm:w-full` |

Admin page header + actions stack fully below 640px (was 768px).

### `src/components/layout/FilterBar.tsx`

Outer container: added `[&>*]:max-sm:w-full` to the existing `flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center` class string. FilterBar already used `sm:` breakpoints correctly; this makes the canonical contract explicit.

### Docs updated

- `docs/design-system.md` §12a: updated "mobile stacking / full-width" to reference `max-sm:` breakpoint + specific class fragments
- `docs/design-system.md` §12b (NEW): full "Mobile control & tab stacking contract (< sm)" section with canonical fragment, tab ≤3/>3 rule, and overflow prohibition
- `docs/ui-rules.md` §15a (NEW): canonical action-cluster fragment, tab stacking rule, forbidden patterns, threshold enforcement
- `docs/backlog.md`: Last Session updated

---

## Note 20 — Before/after control inventory per surface

### `tabs.tsx` (TabsList + TabsTrigger)
| Before | After |
|---|---|
| `inline-flex w-fit` always | `inline-flex w-fit` at sm+; `flex w-full` at <sm |
| `h-8` on list (desktop) | `h-8` at sm+; `h-auto` at <sm (auto-sizes to trigger) |
| Trigger `h-[calc(100%-1px)]` ≈ 31px | + `min-h-11` (44px) at <sm → ≥44px always |
| No `mobileScroll` API | `mobileScroll` prop for >3 tab horizontal scroll |

No controls removed. Triggers stack in fill mode (equal `flex-1`), scroll mode available via prop.

### `PageHeader.tsx`
| Before | After |
|---|---|
| Action stacks at <md (768px) | Action stacks at <sm (640px) |
| Header inline at md+ | Header inline at sm+ |

No controls removed. Action cluster full-width below 640px instead of 768px.

### `AdminPageShell.tsx`
| Before | After |
|---|---|
| Actions stack at <md (768px) | Actions stack at <sm (640px) |
| Header row inline at md+ | Header row inline at sm+ |

No controls removed. Action cluster full-width below 640px.

### `FilterBar.tsx`
| Before | After |
|---|---|
| `sm:flex-row` outer ✅ | `sm:flex-row` outer ✅ (unchanged) |
| No `[&>*]:max-sm:w-full` | `[&>*]:max-sm:w-full` on outer container |

No controls removed. Explicit canonical fragment now on container.

---

## 6 Tab consumer verification

| Consumer | Tab count | Labels | Change needed | Resolution |
|---|---|---|---|---|
| `CabinetShell.tsx` | 3 (profile/listings/searches) | short | None — already has `w-full h-auto` + `flex-1` triggers; primitive adds `min-h-11` | Inherits from primitive ✅ |
| `ListingsStatusTabs.tsx` | 2 (active/closed) | short | None — primitive adds `max-sm:flex max-sm:w-full`; `flex-1` triggers fill equally | Inherits from primitive ✅ |
| `AdminCurrencyTabs.tsx` | 2 (currencies/providers) | short | `w-fit` consumer class overridden by `max-sm:w-full` in CSS (media query wins) | Inherits from primitive ✅ |
| `AdminEmailTemplatesManager.tsx` | 4 (sq/en/uk/it) | 2-char codes | Already has `w-full` + `flex-1` triggers; primitive adds `min-h-11` | Inherits from primitive ✅ |
| `AdminFooterManager.tsx` | 4 (sq/en/uk/it) | 2-char codes | Same as above | Inherits from primitive ✅ |
| `AdminPagesManager.tsx` | 4 (sq/en/uk/it) | 2-char codes | Same as above | Inherits from primitive ✅ |

No consumer logic, props, or data changed. Tab lists/trigger classes only via primitive inheritance.

---

## Validation outputs

### No ActionBar/ControlGroup resurrection
```
(empty) ✅
```

### Tab/cluster class audit
```
src/components/ui/tabs.tsx:27: ... max-sm:flex max-sm:w-full max-sm:h-auto ✅
src/components/ui/tabs.tsx:53: mobileScroll && "max-sm:overflow-x-auto max-sm:flex-nowrap" ✅
src/components/ui/tabs.tsx:66: ... max-sm:min-h-11 ✅
src/components/layout/PageHeader.tsx:24: sm:flex-row sm:items-center sm:justify-between ✅
src/components/layout/PageHeader.tsx:39: max-sm:w-full [&>*]:max-sm:w-full ✅
src/components/layout/FilterBar.tsx:48: ... [&>*]:max-sm:w-full ✅
src/components/admin/AdminPageShell.tsx:30: sm:flex-row sm:items-center sm:justify-between sm:gap-4 ✅
src/components/admin/AdminPageShell.tsx:52: sm:flex-row sm:items-center sm:flex-wrap sm:shrink-0 max-sm:w-full [&>*]:max-sm:w-full ✅
```

### `npx tsc --noEmit`
```
(no output — exit 0) ✅
```

### `npm run lint`
```
(no output — 0 errors, 0 warnings) ✅
```

### `npm run check:i18n`
```
✅ Parity PASSED — all 4 locale files have identical key sets (1434 keys).
```

### `npm run build-storybook`
```
✓ built in 6.83s
info => Preview built (8.24 s)
info => Output directory: storybook-static
```
Exit 0 ✅

### Out-of-scope diff
```
git diff -- src/app src/components/ui/button.tsx package.json package-lock.json .storybook
(empty) ✅
```

### `src/modules` diff
```
(empty — no consumer changes made; primitive inheritance handles all 6 consumers)
```

---

## Rendered QA matrix

Executor has no browser access during this session. All cells are **OWNER QA REQUIRED**.

| Surface | 320 | 375 | 390 | 480 | 560 | 640 | 768 | 1280 |
|---|---|---|---|---|---|---|---|---|
| CabinetShell tabs | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR |
| ListingsStatusTabs | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR |
| AdminCurrencyTabs | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR |
| AdminEmailTemplates tabs | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR |
| AdminFooter tabs | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR |
| AdminPages tabs | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR |
| PageHeader actions | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR |
| FilterBar trigger | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR |
| AdminPageShell actions | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR |

OQR = OWNER QA REQUIRED. `build-storybook` exit 0 proves compilation; visual inspection at each viewport + locale is required by the owner to close PASS. Use the Storybook viewport toolbar (320→2560) and locale toolbar (sq/en/uk/it).

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `src/components/ui/tabs.tsx` | `TabsList`: `max-sm:flex max-sm:w-full max-sm:h-auto` + `mobileScroll` prop; `TabsTrigger`: `max-sm:min-h-11` | Primitive mobile stacking + 44px touch target |
| `src/components/layout/PageHeader.tsx` | `md:` → `sm:` stacking threshold; action slot `max-md:` → `max-sm:` | Stack at 640px not 768px |
| `src/components/admin/AdminPageShell.tsx` | `md:` → `sm:` stacking threshold in header + actions container | Stack at 640px not 768px |
| `src/components/layout/FilterBar.tsx` | `[&>*]:max-sm:w-full` added to outer container | Explicit canonical fragment |
| `docs/design-system.md` | Updated §12a mobile stacking description; added §12b "Mobile control & tab stacking contract (< sm)" | Document the contract |
| `docs/ui-rules.md` | Added §15a "Mobile control & tab stacking contract" with canonical fragment + tab rule | Codify for future reference |
| `docs/backlog.md` | Last Session updated | W4 docs |
| `docs/sessions/2026-06-02-task-359-mobile-control-tab-fullwidth-contract.md` | Session log (this file) | W4 docs |

*No `git add` / `git commit` issued. The ORCHESTRATOR (Opus) reviews the real diff and emits explicit-path commit commands.*
