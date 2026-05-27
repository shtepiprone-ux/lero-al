# Task 239 — Y.4 — Admin listing edit: Cancel confirm modal no-op fix

**Date:** 2026-05-27  
**Sprint:** 12  
**Epic:** Y — Listing Form & Lifecycle UX

---

## Root cause

The admin listing preview dialog opens the edit form via:
```tsx
<Link href={`/${locale}/listings/${listing.slug}/edit`} target="_blank" ...>
```

`target="_blank"` opens a new tab with no browser history. All three cancel entry points in `ListingFormShell` called `router.back()` — which does nothing when there is no history to go back to.

Affected call sites (before fix):
1. Top header cancel button (not dirty): `onClick={() => isDirty ? setShowCancel(true) : router.back()}`
2. Bottom cancel button (not dirty): `onClick={() => isDirty ? setShowCancel(true) : router.back()}`
3. Cancel confirm dialog "Скасувати" / confirm button: `onClick={() => router.back()}`

Site 3 is the confirmed report ("clicking 'Скасувати' inside the popup does NOTHING"). Sites 1 and 2 are the same bug in the no-dirty path — fixed simultaneously.

---

## Fix

Replaced `router.back()` with `navigateAway()` helper in `ListingFormShell.tsx`:

```typescript
// Added imports:
import { useRouter, useParams } from 'next/navigation'

// Added hook + helper:
const params = useParams()

function navigateAway() {
  const slug = params?.slug as string | undefined
  if (slug) {
    router.push(`/${activeLocale}/listings/${slug}`)  // edit mode: go to listing detail
  } else {
    router.back()  // create mode: go back (history exists from cabinet flow)
  }
}
```

- **Edit mode** (`/listings/[slug]/edit`): `params.slug` is the listing slug → navigates to `/${locale}/listings/${slug}` — works in new tabs AND from history.
- **Create mode** (`/listings/create`): `params.slug` is `undefined` → falls back to `router.back()` — same behavior as before.

No new props, no changes to `ListingFormLoader`, no changes to the edit or create page.

---

## Global grep audit

`router.back()` appears only in `ListingFormShell.tsx` (3 sites, all fixed). No other file uses this pattern in a cancel/dialog context.

---

## Positive flow verification

- **Admin edit (new tab):** Open edit form from admin panel → click Cancel (not dirty) → navigates to listing detail ✅
- **Admin edit (new tab, dirty):** Make a change → click Cancel → confirm dialog opens → click "Скасувати" (confirm_yes) → navigates to listing detail ✅
- **Admin edit (new tab, dirty):** Confirm dialog → click "Продовжити редагування" (confirm_no) → dialog closes, stays on edit form ✅
- **Cabinet edit (from history):** Edit form from `/listings` page → Cancel → navigates to listing detail (same as before, but now deterministic) ✅
- **Create form:** Cancel (not dirty) → `router.back()` → goes back (no slug in URL, fallback preserved) ✅
- **Create form (dirty):** Cancel → dialog → confirm → `router.back()` → goes back ✅
- Esc / backdrop click → `onOpenChange(false)` → `setShowCancel(false)` → dialog closes, user stays on edit ✅

## Negative flow verification

| Branch | Expected | Verified |
|--------|----------|---------|
| New tab, no history, Cancel confirm | navigates to listing detail (not no-op) | ✅ `router.push` used |
| Create mode cancel | `router.back()` still used (fallback) | ✅ `params.slug` is undefined in create |
| Dirty state → dialog → "no" button | `setShowCancel(false)` → dialog closes | ✅ unchanged |
| Esc key on confirm dialog | `onOpenChange(setShowCancel)` → dialog closes | ✅ unchanged |
| Same pattern in other files | none found | ✅ grep: only ListingFormShell |

---

## Self-validation (Note 18)

- [x] `npx tsc --noEmit` → **0 errors**
- [x] All 3 `router.back()` call sites in `ListingFormShell` replaced with `navigateAway()`
- [x] Remaining `router.back()` on line 94 is inside `navigateAway()` itself (create-mode fallback — correct)
- [x] `useParams` imported; `params.slug` available at runtime in edit route
- [x] Grep: no other `router.back()` in cancel/dialog context anywhere in `src/`
- [x] 0 new locale entries (logic-only fix)

**Self-validation verdict: PASS** — 0 tsc errors, all AC met, positive + negative flows verified.

---

## §17 UI pre-flight (responsive check)

No UI changes — only the navigation target for the confirm button changes (`router.back()` → `router.push(...)`). The dialog layout, button styles, and keyboard behavior are identical. All 7 breakpoints unaffected.

---

## Files changed

```
src/modules/listings/components/ListingFormShell.tsx
docs/backlog.md
docs/sessions/2026-05-27-task-239-y4-admin-cancel-modal.md
```
