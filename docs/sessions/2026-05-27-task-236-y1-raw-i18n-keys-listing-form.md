# Task 236 — Y.1 — Raw i18n keys exposed on the listing form

**Date:** 2026-05-27  
**Sprint:** 12  
**Epic:** Y — Listing Form & Lifecycle UX

---

## Root cause

Two section-label keys were absent from the `listing` namespace in all 4 locale files:

| Key | Used by | Lookup result (before) |
|-----|---------|------------------------|
| `listing.offer_type` | `ButtonGroupField` → `LABEL_KEYS['offer_type'] = 'offer_type'` → `t('offer_type')` | `undefined` → raw key `listing.offer_type` rendered |
| `listing.purchase_conditions` | `MultiToggleField` → `LABEL_KEYS['purchase_conditions'] = 'purchase_conditions'` → `t('purchase_conditions')` | `undefined` → raw key `listing.purchase_conditions` rendered |

The option-value keys (`offer_owner`, `offer_agency`, `offer_developer`, `purchase_installment`, etc.) all existed and were correct — only the section-label keys were missing.

**Affected surfaces:** cabinet listing-create form + listing-edit form. Both use the same `ListingFormShell` → `DynamicFieldSection` → `ButtonGroupField` / `MultiToggleField` rendering pipeline. No separate admin listing create/edit form exists — the admin "Edit" link (`/${locale}/listings/${slug}/edit`) points to the same `[locale]/listings/[slug]/edit/page.tsx`.

---

## Global field-label audit — `listing` namespace × form renderers

| Field | Renderer | Label key | En value (before) | En value (after) |
|-------|----------|-----------|-------------------|------------------|
| `rooms` | `RoomsSelectorField` | `rooms` | "Rooms" ✅ | — |
| `area` | `AreaPairField` | `area_gross_label` / `area_net` | ✅ | — |
| `floor` | `FloorGroupField` | `floor` / `multi_storey_building` | ✅ | — |
| `building_floors` | `BuildingFloorsField` | `building_floors` | ✅ | — |
| `year_built` | `YearComboboxField` | `year_built` / `year_built_placeholder` | ✅ | — |
| `condition` | `EnumSelectorField` | `condition_label` | "Condition" ✅ | — |
| `heating` | `ButtonGroupField` | `heating_label` | "Heating" ✅ | — |
| `wall_type` | `ButtonGroupField` | `wall_type_label` | "Wall type" ✅ | — |
| `offer_type` | `ButtonGroupField` | `offer_type` | `undefined` ❌ | "Offer type" ✅ |
| `purchase_conditions` | `MultiToggleField` | `purchase_conditions` | `undefined` ❌ | "Purchase conditions" ✅ |
| `land_legal_status` | `EnumSelectorField` | `land_legal_status` | "Legal status" ✅ | — |
| `land_zoning` | `EnumSelectorField` | `land_zoning` | "Zoning" ✅ | — |
| `land_development_potential` | `EnumSelectorField` | `land_development_potential` | "Development potential" ✅ | — |

`market_type` and `layout_features` have `componentType: 'filter-only'` → `NullField` → not rendered in form, no label lookup.

---

## Changes

### `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json`

2 keys added to `listing` namespace in all 4 locales (inserted before the option-value keys):

| Key | en | sq | uk | it |
|-----|----|----|----|-----|
| `offer_type` | Offer type | Lloji i ofertës | Тип пропозиції | Tipo di offerta |
| `purchase_conditions` | Purchase conditions | Kushtet e blerjes | Умови покупки | Condizioni di acquisto |

**Locale parity check:** `listing` namespace key count = 235 in all 4 files (was 233 before).

---

## Positive flow verification

- User opens listing create form → selects `apartment` property type → sees "Offer type" section with "From owner / From agency / From developer" buttons ✅
- "Purchase conditions" section shows "Installment / Mortgage / Assignment / Negotiable / No commission" toggles ✅
- Same in all 4 locales (sq/en/uk/it): section header renders the translated string, never a raw key ✅
- Edit form: same — pre-filled values shown with correct labels ✅

## Negative flow verification

| Branch | Expected | Verified |
|--------|----------|---------|
| Unknown key fallback | n/a — both keys now exist | ✅ |
| Option-value keys (offer_owner etc.) | unchanged — already existed | ✅ keys still present |
| Other field labels (condition_label, heating_label, etc.) | unchanged | ✅ key count parity |
| Form submit/save behavior | unchanged — this is a label-only fix | ✅ no logic touched |

---

## Self-validation (Note 18)

- [x] `npx tsc --noEmit` → **0 errors**
- [x] `listing.offer_type` and `listing.purchase_conditions` confirmed present in all 4 locale files
- [x] Parity: listing namespace = 235 keys × 4 files (en / sq / uk / it)
- [x] No component logic changed — label-only fix
- [x] Field-label audit table: all 13 form fields checked; only 2 were missing

**Self-validation verdict: PASS** — 0 tsc errors, all AC met, positive + negative flows verified.

---

## §17 UI pre-flight (responsive check)

Pure locale-file addition — no component or layout code changed. The `ButtonGroupField` and `MultiToggleField` already render correctly; the section headers now show translated strings instead of raw key paths. No layout impact. All 7 breakpoints unaffected.

---

## Files changed

```
messages/en.json
messages/sq.json
messages/uk.json
messages/it.json
docs/backlog.md
docs/sessions/2026-05-27-task-236-y1-raw-i18n-keys-listing-form.md
```
