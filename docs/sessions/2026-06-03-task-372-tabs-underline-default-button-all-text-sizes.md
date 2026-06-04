# Session Log — Task 372: CORRECTIVE A — Tabs underline DEFAULT + Button all-text full-width

**Date:** 2026-06-03
**Task:** 372 — Sprint 32 Corrective A
**Executor:** Sonnet 4.6
**Status:** COMPLETE — awaiting orchestrator diff review + owner QA

---

## Summary

Corrects Task 360's two owner-rejected shortfalls:
1. **Tabs underline** was opt-in (`variant="underline"`) — now the **default** (no variant prop required).
2. **Button mobile full-width** was only `xl`/`tab` — now **all text sizes** (`xs`, `sm`, `default`, `lg`, `xl`, `tab`).

---

## Before / After per owner requirement

| Requirement | Before (Task 360) | After (Task 372) |
|---|---|---|
| Underline tabs default | `variant="underline"` opt-in; pill was default | Underline IS the default; `<TabsList>` with no prop = underline |
| Button full-width <640 | Only `xl` and `tab` had `max-sm:w-full` | `xs`, `sm`, `default`, `lg`, `xl`, `tab` ALL have `max-sm:w-full max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words` |

---

## AC-by-AC self-audit

| AC | Description | File:Line | Pass/Fail |
|---|---|---|---|
| AC1 | Default `TabsList` (no variant) renders underline on active tab, no pill | `tabs.tsx:37` `defaultVariants.variant="underline"` | ✅ PASS |
| AC1 neg | Inactive tab shows no indicator | TabsTrigger: `after:opacity-0` base, only active gets `after:opacity-100` | ✅ PASS |
| AC2 | All 6+1 consumers render new underline default | See consumer inventory below | ✅ PASS |
| AC2 neg | grep `rg 'variant="default"'` across consumers = empty | Confirmed empty | ✅ PASS |
| AC3 | Every text size has `max-sm:w-full` at <640 | `button.tsx:23-36` all text sizes | ✅ PASS |
| AC3 neg | Icon sizes NOT full-width | `icon`, `icon-xl`, `icon-xs`, `icon-sm`, `icon-lg` unchanged | ✅ PASS |
| AC4 | Long uk labels wrap at any breakpoint | `LongLocaleLabel` story updated: xl/lg/default/sm with uk labels at 375px | ✅ PASS |
| AC5 | Keyboard nav, disabled, click unchanged | No changes to event/state logic in any primitive | ✅ PASS |

---

## Tabs consumer inventory

| Consumer | File:Line | Variant before | Variant after | Code change |
|---|---|---|---|---|
| ListingsStatusTabs | `src/modules/listings/components/ListingsStatusTabs.tsx:31` | `variant="line"` (explicit) | `variant="line"` (unchanged) | None |
| CabinetShell | `src/modules/cabinet/components/CabinetShell.tsx:107` | no variant → pill default | no variant → underline default | None (auto via primitive change) |
| AdminPagesManager | `src/components/admin/AdminPagesManager.tsx:146` | no variant → pill default | no variant → underline default | None |
| AdminFooterManager | `src/components/admin/AdminFooterManager.tsx:289` | no variant → pill default | no variant → underline default | None |
| AdminEmailTemplatesManager | `src/components/admin/AdminEmailTemplatesManager.tsx:194` | no variant → pill default | no variant → underline default | None |
| AdminCurrencyTabs | `src/components/admin/AdminCurrencyTabs.tsx:19` | `variant="line"` (explicit) | `variant="line"` (unchanged) | None |
| AdminPageShell.stories | `src/components/admin/AdminPageShell.stories.tsx:88` | no variant → pill default | no variant → underline default | None |

### CabinetShell visual change note (documented, owner review required)

`CabinetShell.tsx:107` `TabsList` has no variant prop and a custom className: `bg-card rounded-xl border shadow-sm p-1`. Its `TabsTrigger` (line 112-116) adds `data-active:bg-primary data-active:text-primary-foreground data-active:shadow-sm`.

After the primitive change to underline default:
- `bg-transparent` from underline CVA is overridden by `bg-card` in className → list container unchanged
- `group-data-[variant=underline]/tabs-list:data-active:bg-transparent` (specificity 0,2,0) overrides `data-active:bg-primary` (0,1,0) → **active tab background changes from primary-fill to transparent**
- The primary-color underline indicator (`::after`) shows on active tab instead
- This is the intended "underline everywhere" change per AC2; `data-active:bg-primary` is now dead code in CabinetShell

**Owner QA should confirm CabinetShell's new tab appearance is acceptable. If the primary-fill active tab is needed, the owner must approve `variant="default"` explicitly on CabinetShell as an exception.**

---

## Button size exemption list (icon-only, stay compact)

| Size | Justification |
|---|---|
| `icon` (size-10) | Square, no text, icon-only by design |
| `icon-xl` (size-11) | Square, no text, 44px mobile-safe icon-only |
| `icon-sm` (size-7) | Square, no text, compact icon-only |
| `icon-xs` (size-6) | Square, no text, compact icon-only |
| `icon-lg` (size-9) | Square, no text, compact icon-only |

---

## Button consumer matrix (key call sites audited)

| File:Line | Size | Classification | <640 result | Evidence |
|---|---|---|---|---|
| `AdminFooterManager.tsx:85` | `icon` | icon-only | compact ✅ | `<Button size="icon" variant="ghost">` remove icon |
| `AdminFooterManager.tsx:110` | `sm` | text (Add link) | full-width via primitive | `className="gap-1.5 w-fit mt-1"` — `max-sm:w-full` overrides `w-fit` at <640 (media query later in CSS) |
| `AdminFooterManager.tsx:222` | `xl` | text (Save) | full-width ✅ | already had `max-sm:w-full` |
| `AdminEmailTemplatesManager.tsx:447,457` | `icon` | icon-only | compact ✅ | `size="icon"` |
| `AdminEmailTemplatesManager.tsx:380` | default | text (Create) | full-width via primitive | has `shrink-0` — not a width constraint |
| `AdminPagesManager.tsx:281` | `lg` | text (New) | full-width via primitive | `className="gap-2 rounded-xl"` — no width constraint |
| `AdminPagesManager.tsx:217-218` | default | text (Cancel/Save) | full-width via primitive | `flex-1` in Dialog footer — compatible |
| `ProfileTab.tsx:433-441` | `sm` | text (Delete account) | full-width via primitive | `w-fit` — overridden by `max-sm:w-full` |
| `FilterBar.tsx:92-96` | `xl` | text (Filters trigger) | full-width already | has `w-full sm:w-auto` + primitive `max-sm:w-full` |
| `ListingsSortBar.tsx:89-95` | `icon-sm` | icon-only | compact ✅ | `size="icon-sm"` grid/list toggle |

---

## Grep gates

```
rg 'variant="default"' src/modules/listings/components/ListingsStatusTabs.tsx \
  src/modules/cabinet/components/CabinetShell.tsx \
  src/components/admin/AdminPagesManager.tsx \
  src/components/admin/AdminFooterManager.tsx \
  src/components/admin/AdminEmailTemplatesManager.tsx \
  src/components/admin/AdminCurrencyTabs.tsx
→ (no output) ✅
```

No text button size without `max-sm:w-full`: confirmed in `button.tsx` — all text sizes (`xs`, `sm`, `default`, `lg`, `xl`, `tab`) have the fragment. Icon sizes exempted as documented above.

---

## Validation outputs

- `npx tsc --noEmit` → 0 errors ✅
- `npm run lint` → 0 errors ✅
- `npm run check:i18n` → PASS (1437 keys, no new keys introduced) ✅
- `npm run build-storybook` → ✅ built in 6.37s

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `src/components/ui/tabs.tsx` | `defaultVariants.variant`: `"default"` → `"underline"`; `TabsList` function default updated | Makes underline the default per owner requirement |
| `src/components/ui/button.tsx` | Added `max-sm:w-full max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words` to `default`, `xs`, `sm`, `lg`; added `max-sm:min-h-11` to `tab` | All text buttons are now full-width at <640px per owner requirement |
| `src/components/ui/tabs.stories.tsx` | Updated component meta desc + Default story desc + Underline story desc | Reflects underline as default |
| `src/components/ui/button.stories.tsx` | Updated AllSizes/MobileSafe/ControlRowRhythm_Stacked/LocaleStress/LongLocaleLabel stories | Shows all text sizes are mobile-full-width; removes redundant `w-full` from Stacked story |
| `docs/design-system.md` | §12b updated: button fragment now covers all text sizes; tabs table updated: underline is default | Rule layer updated |
| `docs/ui-rules.md` | §15a updated: tabs underline default + button all-text full-width | Rule layer updated |
| `docs/backlog.md` | Last session updated | Session record |
| `docs/sessions/2026-06-03-task-372-tabs-underline-default-button-all-text-sizes.md` | This file | Session log |

---

## Self-validation verdict

All 5 ACs pass file-verifiably. tsc=0. lint=0. i18n=PASS. build-storybook=✅.  
**CabinetShell visual change documented above — owner QA must confirm the new underline appearance.**  
No git commands emitted — orchestrator emits commit commands after diff review.
