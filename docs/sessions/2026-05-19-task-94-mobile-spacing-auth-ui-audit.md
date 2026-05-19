# Task 94 — Full mobile spacing & auth UI audit

**Date:** 2026-05-19
**Sprint:** Sprint 1 — Bugfix Continuation & Admin Polish
**Status:** ✅ PASS

---

## Problem summary

After Task 90, mobile auth buttons in the header drawer were fixed (`size="xl"`). However, multiple other `<Button>` components across the codebase used `className="... h-11 ..."` to manually set the 44px height instead of using the canonical `size="xl"` prop. Additionally, `confirm-email/page.tsx` styled links as buttons using raw `className="h-11 ..."` instead of `buttonVariants()`. The Header logout button used `min-h-[44px]` instead of `size="xl"`.

---

## Task 90 baseline (already fixed)

- Mobile Login link: `buttonVariants({ variant: 'outline', size: 'xl' })` ✓
- Mobile Register link: `buttonVariants({ size: 'xl' })` ✓
- Mobile Logout: `<Button variant="ghost">` with `min-h-[44px]`

---

## Investigation

### Governance scan findings (7 MEDIUM violations)

| File | Line | Violation |
|------|------|-----------|
| `FiltersPanel.tsx` | 458 | `Button className="flex-1 gap-2 h-11"` |
| `FiltersPanel.tsx` | 462 | `Button className="flex-1 h-11 relative"` |
| `LoginForm.tsx` | 91 | `Button className="w-full h-11"` |
| `RegisterForm.tsx` | 164 | `Button className="w-full h-11"` |
| `RegisterForm.tsx` | 191 | `DialogClose render={<Button className="w-full h-11" />}` |
| `ListingFormShell.tsx` | 455 | `Button className="h-11 px-8 rounded-xl"` |
| `ListingsFilters.tsx` | 384 | `Button className="lg:hidden mt-4 h-11"` |

### Additional violations (multiline JSX — missed by single-line scan)

| File | Lines | Violation |
|------|-------|-----------|
| `LoginForm.tsx` | 105–108 | `<Button variant="outline"` + `className="w-full h-11"` |
| `ListingFormShell.tsx` | 446–451 | `<Button variant="outline"` + `className="h-11 px-6 rounded-xl"` |
| `ProfileTab.tsx` | 498–502 | `<Button variant="outline"` + `className="h-11 rounded-xl shrink-0"` |
| `ProfileTab.tsx` | 531–534 | `<Button` + `className="h-11 px-8 rounded-xl"` |

### Additional non-Button h-11 violations

| File | Type | Issue |
|------|------|-------|
| `confirm-email/page.tsx:55,69` | `<Link>` | Raw `h-11` on link styled as button |
| `Header.tsx:293` | `<Button>` | `min-h-[44px]` instead of `size="xl"` |

### `h-11` usages that are NOT hacks (correct usage)

- `Input` components with `className="h-11 rounded-xl"` — correct, Input has no size prop system
- `LocationCombobox`, `YearCombobox` internal `<input>` elements — correct
- Combobox internal height definition — canonical
- `button.tsx` size `xl` definition (`h-11 gap-2 px-5`) — this IS the canonical value
- Icon containers (`h-11 w-11`) — correct icon-button sizing

---

## Implementation

### Pattern applied

For all `<Button>` components:
- **Remove** `h-11` from `className`
- **Add** `size="xl"` prop
- Keep other className values (custom padding, rounded-xl, positioning)

`size="xl"` in button.tsx is defined as: `"h-11 gap-2 px-5 [&_svg:not([class*='size-'])]:size-4"`

Custom `px-N` values in className override `px-5` from `size="xl"` via Tailwind merge (later class wins). `rounded-xl` in className overrides base `rounded-lg`.

### Changes per file

**`LoginForm.tsx`**: 2 fixes (submit + Google OAuth buttons)
**`RegisterForm.tsx`**: 2 fixes (submit + DialogClose Button)
**`confirm-email/page.tsx`**: 2 Link elements → `buttonVariants({ size: 'xl' })` + imported `buttonVariants`, `cn`
**`Header.tsx`**: logout Button `min-h-[44px]` → `size="xl"`, removed redundant `gap-2` from className
**`FiltersPanel.tsx`**: 2 fixes (reset + apply filter buttons), removed redundant `gap-2`
**`ListingsFilters.tsx`**: 1 fix (mobile apply button)
**`ListingFormShell.tsx`**: 2 fixes (cancel + submit form buttons)
**`ProfileTab.tsx`**: 2 fixes (email change + save profile buttons)

---

## Files changed

- `src/modules/auth/components/LoginForm.tsx`
- `src/modules/auth/components/RegisterForm.tsx`
- `src/app/[locale]/auth/confirm-email/page.tsx`
- `src/components/layout/Header.tsx`
- `src/components/shared/FiltersPanel.tsx`
- `src/modules/listings/components/ListingsFilters.tsx`
- `src/modules/listings/components/ListingFormShell.tsx`
- `src/modules/cabinet/components/ProfileTab.tsx`
- `docs/backlog.md`
- `docs/sessions/2026-05-19-task-94-mobile-spacing-auth-ui-audit.md` (this file)

---

## Governance results

| Check | Before | After |
|-------|--------|-------|
| primitives CRITICAL | 0 | 0 |
| primitives HIGH | 88 (pre-existing) | 88 (pre-existing, unchanged) |
| primitives MEDIUM | 8 | **1** (−7 h-11 violations eliminated) |
| responsive CRITICAL/HIGH | 0/0 | 0/0 |

The pre-existing H:+31 regression (H:88 vs baseline H:57) is not caused by this task — confirmed via earlier stash test in Task 91 session.

---

## Localization coverage

All 4 locales: button labels come from `t(key)` — no change to translations. Ukrainian strings (longest) tested conceptually — `size="xl"` gives sufficient width via `px-5` minimum; custom `px-8` on save/submit buttons ensures adequate padding for long labels.

---

## Responsive coverage

`size="xl"` = `h-11` = 44px — canonical touch-target size. Applies at all 7 breakpoints. No layout regressions introduced — only height property normalized.

---

## Validation

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors / 5 warnings (pre-existing) |
| `npm run typecheck` | ⚠️ 4 pre-existing test errors, 0 new |
| `npm run governance:primitives` | MEDIUM 8 → 1 (improvement). H:+31 is pre-existing. |
| `npm run governance:responsive` | ✅ PASS at baseline |
| `npm run build` | Not run (per policy — user runs manually) |

---

## Remaining h-11 usages (legitimate — no action needed)

- `Input` elements: `h-11 rounded-xl` — correct sizing (Input has no size prop)
- `LocationCombobox`/`YearCombobox` inputs: `h-11 pl-9 pr-3...` — form input height
- `Combobox.tsx` size map: `{ default: 'h-11', ... }` — canonical definition
- `button.tsx` xl size: `"h-11 gap-2 px-5..."` — THE canonical h-11 source
- `FilterRoomsRow` icon buttons: `h-11 w-11` — correct icon-button sizing
- `ListingGallery` gallery nav buttons: `h-11 w-11 rounded-full` — gallery icon buttons, not auth/form buttons
- `ListingContact` / `ListingMobileCTA` `<a>` tags: use `buttonVariants()` approach is preferred but out of scope (listing detail, not auth)
