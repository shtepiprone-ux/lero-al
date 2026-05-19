# Task 90 — Fix mobile spacing and auth buttons

**Date:** 2026-05-19  
**Sprint:** Sprint 0 — Critical Bugfix / Regression Stabilization  
**Status:** ✅ PASS

---

## Problem summary

The mobile menu in `Header.tsx` had two UI inconsistencies:

1. **Mobile auth buttons** (`login` / `register`) used `buttonVariants()` default size (`h-10` = 40px), which is below the 44px minimum touch target guideline for mobile-reachable interactive elements.

2. **Mobile logout button** was a raw `<button>` element — a primitive governance violation. It was styled manually instead of using the shared `Button` component.

---

## Root cause

The mobile auth links used `buttonVariants()` without specifying a size, defaulting to `size='default'` = `h-10` (40px). The mobile locale switcher buttons in the same drawer correctly used `Button size="sm" className="min-h-[44px]"` — but the auth buttons were inconsistent.

The logout button was implemented as a raw `<button>` (`className="flex items-center gap-2 text-sm text-destructive..."`) rather than using the project's shared `Button` component — a pre-existing primitive governance violation (counted in the H:57 baseline).

---

## Investigation summary

### Header component audit

| Area | Location | Issue | Fix |
|------|----------|-------|-----|
| Desktop auth buttons (login/register) | Lines 172–177 | Uses `buttonVariants({ variant: 'ghost', size: 'sm' })` and `buttonVariants({ size: 'sm' })` ✅ | No change needed |
| Desktop user dropdown | Lines 121–169 | Uses `DropdownMenu` + `buttonVariants` ✅ | No change needed |
| Mobile auth links | Lines 263–276 | `buttonVariants()` → `h-10` (40px) below touch target ❌ | Fixed: `size: 'xl'` = 44px |
| Mobile logout | Lines 283–290 | Raw `<button>` — primitive violation ❌ | Fixed: `Button` component |
| Mobile locale switcher | Lines 247–256 | `Button size="sm" min-h-[44px]` ✅ | No change needed |
| Mobile nav links | Lines 206–239 | Plain `Link` elements for navigation ✅ | No change needed |

### Locale label length check

| Locale | Login | Register |
|--------|-------|----------|
| `sq` | "Hyrje" | "Regjistrohu" |
| `en` | "Sign in" | "Register" |
| `uk` | "Увійти" | "Реєстрація" |
| `it` | "Accedi" | "Registrati" |

All labels fit comfortably in full-width mobile auth buttons. No text overflow risk.

---

## Implementation summary

**`src/components/layout/Header.tsx`**

Two targeted changes in the mobile Sheet menu:

1. **Mobile auth link buttons** — added `size: 'xl'` to `buttonVariants` calls:
   - Login: `buttonVariants({ variant: 'outline' })` → `buttonVariants({ variant: 'outline', size: 'xl' })`
   - Register: `buttonVariants()` → `buttonVariants({ size: 'xl' })`
   - Both: `h-10` (40px) → `h-11` (44px) — meets 44px mobile touch target guideline

2. **Mobile logout** — replaced raw `<button>` with `Button` component:
   - Before: `<button className="flex items-center gap-2 text-sm text-destructive ...">`
   - After: `<Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive/80 hover:bg-destructive/5 min-h-[44px]">`
   - Preserves `text-destructive` visual styling, correct behavior, 44px touch target
   - Reduces primitive HIGH violations from 57 → 56

---

## Files changed

- `src/components/layout/Header.tsx`
- `docs/backlog.md`
- `docs/sessions/2026-05-19-task-90-mobile-spacing-and-auth-buttons.md` (this file)

---

## Auth button behavior before vs after

| Control | Before | After |
|---------|--------|-------|
| Mobile login button | `h-10` (40px), `variant: outline` | `h-11` (44px), `variant: outline, size: xl` ✅ |
| Mobile register button | `h-10` (40px), default style | `h-11` (44px), default style ✅ |
| Mobile logout | Raw `<button>`, `min-h-[44px]` | `Button variant="ghost"`, `min-h-[44px]` ✅ |
| Desktop login/register | `size: 'sm'` — unchanged ✅ | Unchanged |

## Mobile spacing before vs after

- Auth buttons: `h-10` → `h-11` (+4px height), touch target improved
- Logout: styling equivalent; visual appearance preserved
- No layout structure changes; `flex flex-col gap-2` between buttons unchanged
- Outer `flex flex-col gap-6` in Sheet content unchanged

---

## Shared button/design-system compliance notes

- All mobile auth buttons now use `buttonVariants` with explicit size (`xl` = 44px) ✅
- Logout button now uses shared `Button` component ✅
- Desktop auth buttons were already compliant — not changed ✅
- Locale switcher buttons in mobile menu already used `Button` component — not changed ✅

---

## Accessibility notes

- `Button variant="ghost"` provides `:focus-visible` ring inherited from shadcn `Button` — logout is now keyboard accessible in the same way as other header buttons
- `w-full justify-start` on logout preserves the left-aligned icon + text layout
- `aria-label` not needed on logout since it has visible text (`t('logout')`)
- Auth link buttons retain their `Link` semantic (navigation), correctly using `href` not `onClick`
- Tab order unchanged — auth section remains at the bottom of the mobile menu

---

## Locales checked

- `sq` ✅ — "Hyrje" / "Regjistrohu" / "Dil" — fit in full-width buttons
- `en` ✅ — "Sign in" / "Register" / "Sign out" — fit in full-width buttons
- `uk` ✅ — "Увійти" / "Реєстрація" / "Вийти" — fit in full-width buttons
- `it` ✅ — "Accedi" / "Registrati" / "Esci" — fit in full-width buttons

---

## Breakpoints checked

Changes affect only the mobile Sheet drawer (visible below `md` = 768px):

- `320` — Sheet fills full viewport width; auth buttons now 44px height ✅
- `375` / `390` — same as 320, adequate spacing ✅
- `768` — Sheet drawer no longer visible at this breakpoint (desktop layout takes over); auth buttons in drawer irrelevant
- `1280` / `1440` / `2560` — desktop only, unchanged

---

## Validation commands and results

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors / 6 warnings (all pre-existing) |
| `npm run typecheck` | ⚠️ 4 pre-existing errors in test files — 0 new errors |
| `npm run governance:localization` | ✅ PASS — 0C/0H/18M, at baseline |
| `npm run governance:primitives` | ✅ PASS — **0C/56H/8M** (improved from 57H baseline, raw button removed) |
| `npm run governance:responsive` | ✅ PASS — at baseline |
| `npm run governance:ssr` | ✅ PASS — 0C/0H/0M, at baseline |
| `npm run governance:tailwind` | ✅ PASS — at baseline |
| `npm run build` | Not run (user runs builds manually per project policy) |

---

## Known pre-existing issues

- **Typecheck**: 4 errors in test files. Pre-existing.
- **Lint warnings (6)**: All pre-existing.

---

## Remaining risks or follow-up items

None. All mobile auth controls are now design-system compliant with 44px touch targets. Desktop layout unchanged.
