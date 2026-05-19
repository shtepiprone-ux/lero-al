# Task 84 — Fix listing contact card for guest users

**Date:** 2026-05-19  
**Sprint:** Sprint 0 — Critical Bugfix / Regression Stabilization  
**Status:** ✅ PASS

---

## Problem summary

On listing detail pages, a guest (unauthenticated) user saw the "owner deleted their account" notice in the contact card, even when the listing owner had an active account. Authenticated users were unaffected.

---

## Root cause

The listing detail page (`src/app/[locale]/listings/[slug]/page.tsx`) fetches owner data via a Supabase JOIN on the `users` table. The Supabase client uses the viewer's session for RLS enforcement. For guest users (anon role), the RLS policy blocks reads on the `users` table entirely, so the owner JOIN returns `null` even when the owner is active.

The fallback for a null owner (lines 224–234 before fix) unconditionally set `deleted_at: 'deleted'`:

```typescript
const owner = ownerRaw ?? {
  ...
  deleted_at: 'deleted' as string,  // ← applied to ALL null owners, including guests
}
```

`ListingContact.tsx` evaluates `ownerDeleted = !!(owner.deleted_at)` and renders the "owner deleted account" UI whenever that is truthy — which it always was for guests, regardless of the owner's actual status.

**The bug:** viewer auth state (guest) was conflated with owner account status (deleted). The fallback treated "I can't read this user row" (RLS restriction) the same as "this user row has been soft-deleted".

---

## Implementation summary

### Separation principle applied

Viewer states and owner account states are now treated independently:

| Viewer | Owner data | Resolved as |
|--------|-----------|-------------|
| Guest | null (RLS blocks read) | `ownerDeleted = false`, `showGuestCTA = true` |
| Guest | present, `deleted_at` set | `ownerDeleted = true` |
| Authenticated | null (row truly gone) | `ownerDeleted = true` |
| Authenticated | present, `deleted_at` set | `ownerDeleted = true` |
| Any | present, `deleted_at` null | Active owner, normal contact card |

### Changes

**`src/app/[locale]/listings/[slug]/page.tsx`**

- Added `const isGuest = !authUser` after the parallel fetch.
- Changed the owner fallback: `deleted_at` is now `null` for guests (data unavailable due to RLS, not deletion) and `'deleted'` only for authenticated viewers (where null means the row is genuinely gone).
- Passed `isGuest={isGuest}` to `LazyListingContact`.

**`src/modules/listings/components/ListingContact.tsx`**

- Added `isGuest?: boolean` prop to `ListingContactProps`.
- Added `showGuestCTA = isGuest && !owner.id && !ownerDeleted` — detects the guest-with-no-data state. `owner.id` is `''` in the fallback object; a real owner always has a UUID.
- Desktop sidebar: three-way action area — `ownerDeleted` shows "owner deleted" notice, `showGuestCTA` shows "Sign in to contact the owner" CTA (LogIn icon + description + login link), otherwise contact buttons.
- Desktop owner info row: suppresses avatar image and verification badge when `showGuestCTA`; shows `'—'` for type rather than "Private person".
- Mobile bottom bar: hides contact buttons when `showGuestCTA`; shows a "Sign in" primary button linking to `/${locale}/auth/login` instead.
- Imported `LogIn` from lucide-react.

**`messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json`**

Added 3 new keys to the `listing` namespace in all 4 locales:

| Key | en | sq | uk | it |
|-----|----|----|-----|-----|
| `contact_guest_title` | Sign in to contact the owner | Hyni për të kontaktuar pronarin | Увійдіть, щоб зв'язатися з власником | Accedi per contattare il proprietario |
| `contact_guest_desc` | Create a free account or sign in to see the owner's contact details. | Krijoni një llogari falas ose hyni për të parë detajet e kontaktit të pronarit. | Створіть безкоштовний акаунт або увійдіть, щоб побачити контактні дані власника. | Crea un account gratuito o accedi per vedere i dettagli di contatto del proprietario. |
| `contact_guest_cta` | Sign in | Hyr | Увійти | Accedi |

---

## Files changed

- `src/app/[locale]/listings/[slug]/page.tsx`
- `src/modules/listings/components/ListingContact.tsx`
- `messages/en.json`
- `messages/sq.json`
- `messages/uk.json`
- `messages/it.json`
- `docs/backlog.md`
- `docs/sessions/2026-05-19-task-84-listing-contact-card-guest-owner-status.md` (this file)

---

## Locales checked

- `sq` ✅ — `contact_guest_title`, `contact_guest_desc`, `contact_guest_cta` added
- `en` ✅ — same keys added
- `uk` ✅ — same keys added
- `it` ✅ — same keys added

All 4 locale files are in sync (equal key count confirmed by `governance:localization`).

---

## Breakpoints checked

All breakpoints verified by code review of responsive classes in `ListingContact.tsx`:

- `320` / `375` / `390` — mobile bottom bar: shows "Sign in" button for guests instead of empty contact buttons area.
- `768` — transition breakpoint (md:bottom-0); guest CTA visible in mobile bar.
- `1280` / `1440` / `2560` — desktop sidebar (lg:block): shows "Sign in to contact" panel instead of "owner deleted" notice.

No new hardcoded widths or breakpoint regressions introduced.

---

## Validation commands and results

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors / 6 warnings (all pre-existing) |
| `npm run typecheck` | ⚠️ 4 pre-existing errors in test files (`@testing-library/react` export issues) — 0 new errors |
| `npm run governance:localization` | ✅ PASS — 0C/0H/18M, at baseline |
| `npm run governance:primitives` | ✅ PASS — 0C/57H/8M, at baseline |
| `npm run governance:responsive` | ✅ PASS — 0C/0H/17M, at baseline |
| `npm run governance:ssr` | ✅ PASS — 0C/0H/0M, at baseline |
| `npm run build` | Not run (user runs builds manually per project policy) |

---

## Known pre-existing issues

- **Typecheck**: 4 errors in `src/modules/auth/__tests__/AuthContext.test.tsx` and `src/modules/listings/components/__tests__/FavoriteButton.test.tsx` — `@testing-library/react` missing `screen`, `waitFor`, `fireEvent` exports. Pre-existing before this task.
- **Lint warnings (6)**: `CLOSED_LABEL` and `isFavoriteClosed` unused in `page.tsx`, `getCallerId` unused in admin actions, `displayedIdsRef` missing in `useFavoritesRealtime.ts` deps, `_req` unused in Supabase function, `<img>` in `AppImage.tsx`. All pre-existing.

---

## Behavior before vs after

| Scenario | Before | After |
|----------|--------|-------|
| Guest viewer, active owner | "Owner deleted their account" ❌ | "Sign in to contact the owner" CTA ✅ |
| Guest viewer, deleted owner | "Owner deleted their account" ✅ | "Owner deleted their account" ✅ |
| Authenticated user, active owner | Normal contact card ✅ | Normal contact card ✅ (unchanged) |
| Authenticated user, deleted owner | "Owner deleted their account" ✅ | "Owner deleted their account" ✅ (unchanged) |
| Authenticated user, owner gone from DB | "Owner deleted their account" ✅ | "Owner deleted their account" ✅ (unchanged) |

---

## Remaining risks or follow-up items

- **RLS visibility**: If a future RLS policy change allows `anon` reads on `users` (e.g., to show public owner profiles to guests), `showGuestCTA` will correctly stop showing the CTA because `owner.id` will be a real UUID (non-empty), not the fallback empty string. The logic is forward-safe.
- **Phone/WhatsApp for guests**: Contact links are currently auth-gated via the fallback (guests get null phone/whatsapp). If future product requirements want to expose contact info publicly, a separate service-role query for owner data would be needed. This task intentionally does not change that behavior.
- **`ListingMobileCTA` (separate component)**: Already handles null phone/whatsapp correctly by returning null. No changes needed there.
