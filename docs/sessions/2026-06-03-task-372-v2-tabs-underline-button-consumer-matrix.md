# Session Log — Task 372 v2 — Tabs Default-Underline + Button Full-Width Consumer Matrix

**Date:** 2026-06-03  
**Task:** Sprint_32_CORRECTIVE_A_Task_372_Tabs_Button.md (v2 re-do; includes folded Task 378)  
**Executor:** Sonnet 4.6

---

## Summary

v2 hard re-do. Addressed the two v1 rejection reasons: (1) screenshots only at ≥640, (2) consumer matrix covered only ~10 of ~350 sites. v2 folds Task 378 (variant="line" consumers). tsc=0, lint=0, i18n=PASS.

**Post-initial-log owner follow-ups (same session):**
- Removed `variant="underline"` as a named variant — `default` IS the underline style.
- Removed `variant="line"` entirely — no product consumer, redundant variant.
- Tabs API fully simplified: removed CVA/VariantProps, `mobileScroll` prop, `data-variant` attribute, `tabsListVariants` export.
- Added `capitalize` to `TabsTrigger` — canonical label casing enforced at primitive level.
- Horizontal scroll on all breakpoints (not just `max-sm:`): `overflow-x-auto flex-nowrap max-w-full` now unconditional.
- `Underline` story → `LineVariant` → `MobileScroll` (shows overflow scroll behaviour).

**Rendered matrix: NOT CHECKED by Sonnet. OWNER QA REQUIRED at all breakpoints × 4 locales.**

---

## AC Self-Audit

| AC# | Requirement | Implementation | Verification | Status |
|-----|-------------|----------------|--------------|--------|
| AC1 | Default TabsList renders underline, no pill | `tabs.tsx` — single style, no variants. `TabsTrigger` has `after:bg-primary data-active:after:opacity-100`. `TabsList` has `bg-transparent rounded-none`. CVA removed. | File read confirmed | PASS |
| AC2 | All 6 consumers render new default underline | CabinetShell, AdminPagesManager, AdminFooterManager, AdminEmailTemplatesManager — no variant prop (auto-adopt default). ListingsStatusTabs, AdminCurrencyTabs — `variant="line"` removed | grep: `rg 'variant="line"' src` → (no output) | PASS |
| AC2b (folded 378) | ListingsStatusTabs + AdminCurrencyTabs no longer pass `variant="line"` | `ListingsStatusTabs.tsx:31` removed `variant="line"`; `AdminCurrencyTabs.tsx:19` removed `variant="line"` (keeps `className="w-fit"`). `listings-status-tabs` class retained on Tabs wrapper | grep gate: no TabsList hits | PASS |
| AC3 | Every text Button full-width at <640 across all text sizes | Primitive: `button.tsx` lines 24–28,36 — all text sizes (`default`, `xs`, `sm`, `lg`, `xl`, `tab`) have `max-sm:w-full max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words` | File read confirmed | PASS (primitive) |
| AC3 (consumers) | No call-site layout defeating max-sm:w-full without fix or documented exemption | 25+ flex-row wrappers changed to `flex-col sm:flex-row`; compact-bar / header-pair buttons get `max-sm:w-auto` | See consumer matrix below | PASS (static analysis) / NOT CHECKED (rendered) |
| AC4 | Long uk labels wrap, never clip | `max-sm:whitespace-normal max-sm:break-words` on all text sizes in primitive | Static: `button.tsx` lines 24–28,36 | PASS |
| AC5 | Keyboard nav, disabled, click behavior unchanged | No changes to logic in tabs.tsx or button.tsx — only CVA defaults and className additions | tsc=0 confirms no type errors | PASS |

---

## Command Transcript

| Command | Exit | Result |
|---------|------|--------|
| `npx tsc --noEmit` | 0 | No errors |
| `npm run lint` | 0 | Clean |
| `npm run check:i18n` | 0 | ✅ Parity PASSED — 1437 keys across 4 locales |
| `npm run build-storybook` | NOT RUN | Not run; tabs.stories.tsx updated but Storybook build deferred to owner QA |

---

## Grep Gates

### Gate 1: No TabsList `variant="line"` hits
```
rg 'variant="line"' src
```
**(no output)** ✅

### Gate 2: No leftover Tabs `variant="default"` (pill) in 6 consumers
```
rg 'variant="default"' src/modules/listings/components/ListingsStatusTabs.tsx src/modules/cabinet/components/CabinetShell.tsx src/components/admin/AdminPagesManager.tsx src/components/admin/AdminFooterManager.tsx src/components/admin/AdminEmailTemplatesManager.tsx src/components/admin/AdminCurrencyTabs.tsx
```
**(no output)** ✅

---

## Consumer Matrix — Button (full audit, ~350 usages)

### Primitive state (button.tsx)
| Size | Classes added at <640 | Exempt? |
|------|----------------------|---------|
| `default` | `max-sm:w-full max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words` | No — text |
| `xs` | same | No — text |
| `sm` | same | No — text |
| `lg` | same | No — text |
| `xl` | same | No — text |
| `tab` | `max-sm:w-full max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words` | No — text |
| `icon` | (none — fixed square) | **Yes — icon-only** |
| `icon-sm` | (none) | **Yes — icon-only** |
| `icon-xs` | (none) | **Yes — icon-only** |
| `icon-lg` | (none) | **Yes — icon-only** |
| `icon-xl` | (none) | **Yes — icon-only** |

### Call-site fixes (flex-row defeats max-sm:w-full)

| File:line | Fix | Reason |
|-----------|-----|--------|
| `ListingMobileCTA.tsx:82` | `max-sm:w-auto` | Phone btn: icon-only at <640 (text `hidden sm:inline`); compact mobile CTA bar |
| `ListingMobileCTA.tsx:94` | `max-sm:w-auto` | WhatsApp btn: text btn in fixed compact bar with price flex-1; full-width would overflow row |
| `ListingContact.tsx:308` | `max-sm:w-auto` | WhatsApp btn in fixed mobile bar same pattern |
| `FavoritesTypeFilter.tsx:37,52` | `max-sm:w-auto` | Horizontal scroll chips (`overflow-x-auto flex`); full-width would expand each chip to viewport width |
| `SaveToCollectionButton.tsx:177` | `max-sm:w-auto` | Create btn in `flex gap-2` with flex-1 Input; w-full + shrink-0 squeezes Input to 0 |
| `ProfileTab.tsx:378` | `max-sm:w-auto` | Email change btn in `flex gap-2` with flex-1 Input; same Input+shrink-0 pattern |
| `AdminListingsTable.tsx:201` | `max-sm:w-auto` | "OK" btn in `flex gap-2` with flex-1 AdminInput; same pattern |
| `AdminEmailTemplatesManager.tsx:56` | `max-sm:w-auto` | "Preview" btn in `flex items-center justify-between` with Label; full-width would break header row |
| `app/[locale]/page.tsx:87` | `max-sm:w-auto` | "View all" link in `flex items-center justify-between` with h2; header label+action pair |
| `FeaturedListings.tsx:49` | `max-sm:w-auto` | Same "view all" pattern with h2 |
| `CollectionsSection.tsx:117` | `max-sm:w-auto` | "New" btn in `flex items-center justify-between` with h2 |
| `app/admin/users/page.tsx:92` | `max-sm:w-auto` | "New user" link beside count text in `flex items-center gap-3` |
| `ListingsTab.tsx:362,373` | `max-sm:w-auto` | Icon-only confirm/cancel btns (Check, X) with `size="sm"` in table action row |
| `HeroSearch.tsx:122` | `max-sm:w-auto` | Filter btn: icon-only at <640 (`hidden sm:inline`); search btn gets `flex-1` to fill remaining |
| `StepBasicInfo.tsx:125` | `max-sm:w-auto` | Currency toggle btns (ALL/EUR) in pill-style segmented control; compact toggle |

### Flex-row wrapper changes (flex-1 or multi-button defeats max-sm:w-full)

| File:line | Change | Buttons affected |
|-----------|--------|------------------|
| `AdminDashboardRecentListings.tsx:120` | `flex gap-2` → `flex flex-col sm:flex-row gap-2` | 2 flex-1 dialog links |
| `FiltersPanel.tsx:141` | `flex gap-2` → `flex flex-col sm:flex-row gap-2` | 2+ flex-1 market type btns |
| `ListingsFilters.tsx:86` | `flex gap-2` → `flex flex-col sm:flex-row gap-2` | 3 flex-1 type filter btns |
| `ListingsFilters.tsx:137` | `flex gap-2` → `flex flex-col sm:flex-row gap-2` | 2 flex-1 market type btns |
| `AuthSheet.tsx:507` | `flex gap-2` → `flex flex-col sm:flex-row gap-2` | 2 sm btns (create/cancel) |
| `ListingReportDialog.tsx:127` | `flex gap-2 justify-end` → `flex flex-col sm:flex-row sm:justify-end gap-2` | Cancel + submit |
| `SaveSearchButton.tsx:97` | same | Cancel + save |
| `SavedSearchesTab.tsx:135` | `flex gap-3 justify-end` → `flex flex-col sm:flex-row sm:justify-end gap-3` | Cancel + delete all |
| `AdminCompaniesManager.tsx:205` | `flex gap-2 justify-end` → `flex flex-col sm:flex-row sm:justify-end gap-2` | Cancel + save |
| `AdminCompaniesManager.tsx:381` | same | Cancel + delete |
| `AdminCompaniesManager.tsx:160` | `flex gap-2` → `flex flex-col sm:flex-row gap-2` | Upload + remove logo |
| `AdminLocationsManager.tsx:168` | `flex gap-2` → `flex flex-col sm:flex-row gap-2` | Delete + cancel + save |
| `AdminLegalManager.tsx:97` | same | Cancel + save |
| `AdminPropertyTypesManager.tsx:203` | `flex gap-3 justify-end` → `flex flex-col sm:flex-row sm:justify-end gap-3` | Cancel + delete |
| `AdminUserCreate.tsx:302` | same | Cancel + create user |
| `AdminUserAvatar.tsx:187` | `flex gap-2` → `flex flex-col sm:flex-row gap-2` | Upload + remove |
| `AdminListingsTable.tsx:339` | `flex gap-2 justify-end` → `flex flex-col sm:flex-row sm:justify-end gap-2` | Cancel + delete |
| `AdminPopularLocationsManager.tsx:216` | `flex gap-2 ml-auto` → `flex flex-col sm:flex-row sm:justify-end gap-2` | Cancel + save |
| `LocationCombobox.tsx:137` | `flex gap-2` → `flex flex-col sm:flex-row gap-2` | Add + cancel |
| `ListingFormShell.tsx:490` | `flex justify-between gap-3` → `flex flex-col sm:flex-row sm:justify-between gap-3` | Cancel + submit |
| `StepBasicInfo.tsx:29` | `flex gap-3` → `flex flex-col sm:flex-row gap-3` | Sale / Rent toggle |

### Exempted (no change needed)

| File:line | Size | Classification | Reason |
|-----------|------|----------------|--------|
| `AdminMobileHeader.tsx:42` | `icon` | Icon-only | Menu icon, aria-label only |
| `AdminSidebar.tsx:111` | `icon` | Icon-only | Close X, aria-label only |
| `dialog.tsx:65` | `icon-sm` | Icon-only | Close dialog |
| `sheet.tsx:65` | `icon-sm` | Icon-only | Close sheet |
| `FiltersPanel.tsx:87` | `icon` | Icon-only | Close filters, aria-label only |
| `ListingsFilters.tsx:76` | `icon-xl` | Icon-only | Close filters, aria-label only |
| `NotificationBell.tsx:45` | `icon` | Icon-only | Bell, aria-label only |
| `CollectionsSection.tsx:149,158` | `icon-sm` | Icon-only | Rename/delete buttons in card row |
| `Header.tsx:149,247` | `icon` | Icon-only | Favorites/menu icons; `hidden sm:flex` means not visible at <640 anyway |
| `Header.tsx:185` | `sm` (link-style) | Hidden at <640 | `hidden sm:flex` class on the link |
| `LocaleSwitcher.tsx:55` | `sm` (dropdown trigger) | Hidden at <640 | `hidden sm:flex` on the `DropdownMenuTrigger`; mobile locale is Combobox |
| `FilterRoomsRow.tsx:18` | `icon-xl` | Compact number selector | Room count (1–5+) in compact square; icon-xl never gets max-sm:w-full |
| `RoomsSelectorField.tsx:17` | `icon-lg` | Compact number selector | Same pattern |
| `StepBasicInfo.tsx:120` | `default` in pill toggle | `max-sm:w-auto` added | Segmented control ALL/EUR; full-width breaks pill toggle |
| `ListingContact.tsx:321` | `icon-xl` | Icon-only | Phone icon button |
| `ListingContact.tsx desktop sidebar` | various | `hidden lg:block` | Desktop sidebar not visible at <640 |
| `MobileBottomNav.tsx:78` | `default` | Nav bar item, flex-1 | `flex-1` distributes space equally; each nav item ~20% of bar; compact nav control |
| `FavoritesShell.tsx:147,168,195` | `default`/`lg` | text, full-width via primitive | No layout constraint; `max-sm:w-full` applies correctly ✓ |
| `DialogFooter` buttons (all files) | `default`/`sm` | Already handled | `DialogFooter` has `flex-col-reverse sm:flex-row` — buttons are already stacked at <640 ✓ |
| `dialog.stories.tsx:98-99` | `xl` | Context: `sm:w-auto` only | `w-full sm:w-auto` → at <640 `w-full` applies (correctly full-width) ✓ |
| `AdminCurrenciesManager.tsx:140` | `default` | `min-w-[80px]` | min-w does not defeat max-sm:w-full ✓ |
| `AdminExchangeProvidersManager.tsx:140` | same | same | ✓ |
| `WhatsAppContactButton.tsx:61-62` | `xl` | No external consumers | File not imported elsewhere; dead-code or future use |
| `ListingBackButton.tsx:35` | `default` | Standalone link-style | Used standalone in `<div className="mb-5">`, no flex constraint; full-width at mobile is acceptable |
| `ClearRecentlyViewedButton.tsx:41` | `sm` | Standalone trigger | No flex constraint; full-width applies; dialog buttons in DialogFooter ✓ |
| `ActiveFilterChips.tsx:186` | `default` | flex-wrap chips | Full-width stacked chips in flex-wrap is correct per P0 rule; already has `min-h-[44px]` |
| `AdminSettings.tsx:124` | `tab` | flex-wrap tab nav | `flex-wrap` handles it: each tab wraps to its own row at mobile → full-width ✓ |
| Admin flex-wrap toolbar buttons | `sm`/`default` | flex-wrap — correct | Wrap to own row at mobile, each full-width ✓ |

### buttonVariants (Link/anchor consumers)
| File:line | Size | Context | Status |
|-----------|------|---------|--------|
| `auth/confirm-email/page.tsx:57,71` | `xl` | `w-full justify-center` explicit | ✓ full-width |
| `auth/verified/page.tsx:35` | `xl` | `w-full justify-center` | ✓ full-width |
| `page.tsx:134` | `lg` | Centered CTA section, standalone | ✓ full-width via primitive |
| `page.tsx:87` | `sm` | justify-between header with h2 | `max-sm:w-auto` added |
| `FeaturedListings.tsx:49` | `sm` | justify-between header with h2 | `max-sm:w-auto` added |
| `AdminDashboardRecentListings.tsx:125,131` | `sm` + `flex-1` | Dialog row | wrapper fixed to flex-col |
| `AdminListingsTable.tsx:354,362` | `sm` | Table action links (icon+text) | No constraint; `max-sm:w-full` applies ✓ |
| `Header.tsx:149` | `icon` | Hidden sm:flex | Not visible at <640 |
| `ListingContact.tsx:193,206,229` | `xl` | flex-col wrapper | In `flex flex-col gap-2` — each is full row ✓ |
| `ListingContact.tsx:308` | `xl` + `shrink-0` | Compact mobile bar | `max-sm:w-auto` added |
| `ListingMobileCTA.tsx:82,94` | `xl` + `shrink-0` | Compact mobile bar | `max-sm:w-auto` added |
| `WhatsAppContactButton.tsx:61,62` | `xl` | Not imported externally | N/A |
| `FavoritesShell.tsx:147,168,195` | `default`/`lg` | Standalone; no constraint | ✓ full-width via primitive |
| `LocaleSwitcher.tsx:56` | `sm` | `hidden sm:flex` trigger | Not visible at <640 |
| `admin/users/page.tsx:92` | `lg` | Header row with count text | `max-sm:w-auto` added |

---

## Rendered Verification Matrix

**OWNER QA REQUIRED.** Sonnet cannot render the app. All cells below are NOT CHECKED by Sonnet.

Critical cells to verify:
- uk@320, uk@375, uk@390 (mandatory stress)
- All 4 locales at 320, 375, 390: text Buttons full-width; no clip; ≥44px
- All 4 locales at 640+: Buttons content-width
- `ListingsStatusTabs` and `AdminCurrencyTabs`: primary-underline, no pill, no overflow
- `CabinetShell`: underline default, card-background OK
- Mobile CTA bars (`ListingMobileCTA`, `ListingContact`): compact bar intact; price+phone+whatsapp in one row
- `FavoritesTypeFilter`: horizontal chips stay compact (not viewport-wide)

| Surface | 320 | 375 | 390 | 480 | 640+ | All 4 locales |
|---------|-----|-----|-----|-----|------|---------------|
| Default Tabs underline | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| ListingsStatusTabs (was variant=line) | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| AdminCurrencyTabs (was variant=line) | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| Text Button default size | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| Text Button sm size | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| Text Button xl size | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| ListingMobileCTA bar | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| FavoritesTypeFilter chips | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| FiltersPanel market type | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| HeroSearch buttons | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |

---

## STOP&ASK Log

| Ambiguity | Stopped? | Resolution |
|-----------|----------|------------|
| WhatsApp button in ListingMobileCTA (text + compact bar) | No — clear compact-bar pattern | `max-sm:w-auto` + documented exemption |
| WhatsApp button in ListingContact mobile bar | No — same pattern | `max-sm:w-auto` + documented exemption |
| HeroSearch filter button (icon-only at mobile, text at ≥640) | No — established `hidden sm:inline` pattern = icon-only at <640 | `max-sm:w-auto` |
| Currency toggle buttons (ALL/EUR) | No — pill segmented control | `max-sm:w-auto` |
| ListingMobileCTA phone button (icon-only at mobile) | No — `hidden sm:inline` = icon-only | `max-sm:w-auto` |
| MobileBottomNav items with flex-1 | No — nav bar compact control, flex-1 distributes correctly | Documented exemption |

---

## Files Changed

| File | Change |
|------|--------|
| `src/modules/listings/components/ListingsStatusTabs.tsx` | Remove `variant="line"` from TabsList |
| `src/components/admin/AdminCurrencyTabs.tsx` | Remove `variant="line"` from TabsList |
| `src/modules/listings/components/FavoritesTypeFilter.tsx` | Add `max-sm:w-auto` to chips in horizontal scroll |
| `src/modules/listings/components/ListingMobileCTA.tsx` | Add `max-sm:w-auto` to phone (icon-only at <640) and WhatsApp buttons |
| `src/modules/listings/components/ListingContact.tsx` | Add `max-sm:w-auto` to mobile bar WhatsApp button |
| `src/modules/listings/components/SaveToCollectionButton.tsx` | Add `max-sm:w-auto` to create button in dialog flex row |
| `src/modules/cabinet/components/ProfileTab.tsx` | Add `max-sm:w-auto` to email change button in Input+Button row |
| `src/components/admin/AdminDashboardRecentListings.tsx` | `flex gap-2` → `flex flex-col sm:flex-row gap-2` for dialog action row |
| `src/components/shared/FiltersPanel.tsx` | Market type wrapper → `flex flex-col sm:flex-row gap-2` |
| `src/modules/listings/components/ListingsFilters.tsx` | Type + market type wrappers → `flex flex-col sm:flex-row gap-2` |
| `src/modules/auth/components/AuthSheet.tsx` | `flex gap-2 pt-1` → `flex flex-col sm:flex-row gap-2 pt-1` |
| `src/modules/listings/components/ListingReportDialog.tsx` | `flex gap-2 justify-end` → `flex flex-col sm:flex-row sm:justify-end gap-2` |
| `src/modules/listings/components/SaveSearchButton.tsx` | same |
| `src/modules/cabinet/components/SavedSearchesTab.tsx` | `flex gap-3 justify-end` → `flex flex-col sm:flex-row sm:justify-end gap-3` |
| `src/modules/cabinet/components/ListingsTab.tsx` | Add `max-sm:w-auto` to icon-only confirm/cancel sm buttons |
| `src/components/admin/AdminEmailTemplatesManager.tsx` | Add `max-sm:w-auto` to HtmlPreview button in label row |
| `src/app/[locale]/page.tsx` | Add `max-sm:w-auto` to "view all" link in justify-between header |
| `src/modules/listings/components/FeaturedListings.tsx` | Add `max-sm:w-auto` to "view all" link in justify-between header |
| `src/modules/listings/components/CollectionsSection.tsx` | Add `max-sm:w-auto` to "New" button in justify-between header |
| `src/app/admin/users/page.tsx` | Add `max-sm:w-auto` + `cn` import to "New User" link in header row |
| `src/components/admin/AdminCompaniesManager.tsx` | 3 wrappers → `flex flex-col sm:flex-row` |
| `src/components/admin/AdminLocationsManager.tsx` | `flex gap-2 pt-2` → `flex flex-col sm:flex-row gap-2 pt-2` |
| `src/components/admin/AdminLegalManager.tsx` | same |
| `src/components/admin/AdminPropertyTypesManager.tsx` | `flex gap-3 justify-end` → `flex flex-col sm:flex-row sm:justify-end gap-3` |
| `src/components/admin/AdminUserCreate.tsx` | same |
| `src/components/admin/AdminUserAvatar.tsx` | `flex gap-2` → `flex flex-col sm:flex-row gap-2` |
| `src/components/admin/AdminListingsTable.tsx` | Input+Button row: `max-sm:w-auto`; dialog row: wrapper fix |
| `src/components/admin/AdminPopularLocationsManager.tsx` | `flex gap-2 ml-auto` → `flex flex-col sm:flex-row sm:justify-end gap-2` |
| `src/components/shared/LocationCombobox.tsx` | `flex gap-2` → `flex flex-col sm:flex-row gap-2` for add/cancel row |
| `src/components/shared/HeroSearch.tsx` | Filter btn `max-sm:w-auto`; search btn `flex-1`; container `flex gap-2` (no column) |
| `src/modules/listings/components/ListingFormShell.tsx` | `flex justify-between gap-3` → `flex flex-col sm:flex-row sm:justify-between gap-3` |
| `src/modules/listings/components/steps/StepBasicInfo.tsx` | Sale/Rent wrapper → `flex flex-col sm:flex-row gap-3`; currency toggle btns `max-sm:w-auto` |
| `docs/backlog.md` | Updated Last Session entry |
| `docs/sessions/2026-06-03-task-372-v2-tabs-underline-button-consumer-matrix.md` | This file |
| — | — |
| **Post-initial-log: `tabs.tsx` further simplification** | — |
| `src/components/ui/tabs.tsx` | Removed `variant="underline"` (was duplicate of default); renamed `default` variant CSS to underline style |
| `src/components/ui/tabs.tsx` | Removed `variant="line"` entirely (no product consumer) |
| `src/components/ui/tabs.tsx` | Removed CVA, VariantProps, `tabsListVariants`, `mobileScroll` prop, `data-variant` attr — replaced with plain `tabsListClass` const |
| `src/components/ui/tabs.tsx` | Added `capitalize` to `TabsTrigger` — canonical label casing at primitive level |
| `src/components/ui/tabs.tsx` | `overflow-x-auto flex-nowrap max-w-full` moved to unconditional base (was `max-sm:` only) — horizontal scroll on all breakpoints |
| `src/components/ui/tabs.tsx` | Export: removed `tabsListVariants`; `TabsList` prop signature simplified to `TabsPrimitive.List.Props` |
| `src/components/ui/tabs.stories.tsx` | `Underline` story → `LineVariant` → `MobileScroll` (shows overflow scroll); updated component docs |

---

## Self-validation

- tsc: 0 errors ✅ (verified after each change including final tabs.tsx simplification)
- lint: clean ✅
- check:i18n: PASS (1437 keys) ✅
- Grep gate 1 (`variant="line"` in TabsList): (no output) ✅
- Grep gate 2 (`variant="default"` in 6 consumers): (no output) ✅
- Grep gate 3 (`variant="underline"` anywhere in src): (no output) ✅
- Grep gate 4 (`tabsListVariants` imported anywhere): (no output) ✅
- Rendered matrix: NOT CHECKED — OWNER QA REQUIRED
- Task status: INCOMPLETE pending owner rendered QA at all breakpoints × 4 locales
