# Task 258 — T.5 — Listing detail contact card: real owner name for authenticated viewers

**Date:** 2026-05-27  
**Sprint:** 13  
**Epic:** T — Global UX Polish & Forms

---

## Audit (Scope 1)

### Bug reproduced
Authenticated (non-owner) viewer sees `"N/A · Приватна особа"` in the listing contact card instead of the real owner name and user type.

### Root cause confirmed

`src/app/[locale]/listings/[slug]/page.tsx` uses `createClient()` (session-aware Supabase client) for the listing query with the owner embed join:

```
owner:users!listings_user_id_fkey(id, name, phone, whatsapp, avatar_url, user_type, is_verified, company_name, deleted_at)
```

RLS on the `users` table permits `auth.uid() = id` (self-read only). For an authenticated viewer who does NOT own the listing, the embed join is blocked → `ownerRaw = null` → fallback placeholder `{ id: '' }` → `owner.name ?? 'N/A'` = `'N/A'`.

`showGuestCTA` is `false` for authenticated users (they have a session) → component renders the "normal" branch → name = `'N/A'`, sub-label = `'Приватна особа'` (default `private` type from fallback).

### RLS policy (for reference — optional fix)

```sql
-- Optional: allow authenticated users to read any non-deleted owner row
-- The app now uses createAdminClient() as a code-level fix, making this RLS change optional.
-- Apply only if a policy-level fix is preferred over the service-role approach.
CREATE POLICY "authenticated users can read active user profiles"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);
```

The app-level fix (using `createAdminClient()`) was chosen to avoid changing RLS policy scope.

---

## Changes

### `src/app/[locale]/listings/[slug]/page.tsx`
- Added `import { createAdminClient } from '@/lib/supabase/admin'`
- Moved `ownerEmbedRaw` computation before the auth-phase parallel block
- Added 3rd parallel query using `createAdminClient()` inside the `if (authUser)` block:
  ```typescript
  adminDb.from('users').select('id, name, phone, whatsapp, avatar_url, user_type, is_verified, company_name, deleted_at').eq('id', listing.user_id).single()
  ```
- `ownerFromAdmin` typed as `typeof ownerEmbedRaw`, cast via `ownerResult.data as typeof ownerEmbedRaw`
- `ownerRaw = ownerFromAdmin ?? ownerEmbedRaw` — admin result takes priority for authenticated viewers; guest path unchanged (embed join null → fallback unchanged)

### `src/modules/listings/components/ListingContact.tsx`
- Added `ownerDataUnavailable = !isGuest && !owner.id && !ownerDeleted` — defensive state for authenticated viewers whose owner row returned null (e.g. orphaned listing)
- Opacity condition: `(ownerDeleted || showGuestCTA || ownerDataUnavailable) && "opacity-50"`
- Desktop name (line ~94): `ownerDataUnavailable ? t('owner_name_unavailable') : owner.name ?? (agent fallback ?? t('owner_name_unavailable'))`
- Sub-label: added `ownerDataUnavailable` to `ownerDeleted || showGuestCTA` guard
- Added `ownerDataUnavailable` warning card branch (after deleted card, before guestCTA card): `border-status-warning/40 bg-status-warning/5`
- Mobile bar name (line ~249): `ownerDataUnavailable ? t('owner_name_unavailable') : owner.name ?? t('owner_name_unavailable')`

### Locale files — 1 new key × 4 locales

| Key | sq | en | uk | it |
|-----|----|----|----|-----|
| `listing.owner_name_unavailable` | ✅ | ✅ | ✅ | ✅ |

---

## Positive flow verification

- Authenticated viewer visits listing → `createAdminClient()` query returns owner row → `ownerRaw` = real owner data → `ownerDataUnavailable = false` → contact card shows real name, user_type sub-label, action buttons ✅
- Owner visits their own listing → same admin query returns own row → unchanged behavior ✅
- Guest visits listing → `authUser = null` → admin block skipped → `ownerFromAdmin = null` → `ownerRaw = ownerEmbedRaw` (null from RLS) → fallback placeholder → `showGuestCTA = true` → sign-in CTA shown ✅

## Negative flow verification

| Branch | Trigger | Result | UI |
|--------|---------|--------|-----|
| Owner account deleted | `deleted_at` set | `ownerDeleted = true` | Deleted-account card shown ✅ preserved |
| Guest (no session) | `authUser = null` | `showGuestCTA = true` | Sign-in CTA shown ✅ preserved |
| Orphaned listing (auth viewer, owner row gone) | admin query returns null | `ownerDataUnavailable = true` | Warning card `t('owner_name_unavailable')` ✅ NEW |
| Zombie session (valid JWT, no profile) | `hasValidProfile = false` | `isGuest = true` → `showGuestCTA = true` | Sign-in CTA ✅ preserved |
| Listing closed (sold/rented) | `listingStatus` | action buttons disabled | `closedLabel` preserved ✅ |

---

## Self-validation (Note 18)

- [x] `npx tsc --noEmit` → **0 errors**
- [x] All 4 JSON locale files valid — `owner_name_unavailable` present in sq/en/uk/it
- [x] `createAdminClient()` import present in `page.tsx`
- [x] `ownerEmbedRaw` computed before auth block — `typeof ownerEmbedRaw` annotation compiles
- [x] `ownerFromAdmin` initialized to `null`, assigned inside auth block, used in `ownerRaw ??`
- [x] `ownerDataUnavailable` added to `ListingContact.tsx` and used in all 3 affected branches
- [x] Guest path unaffected — `ownerFromAdmin` stays `null` for guests (auth block skipped)
- [x] `showGuestCTA` and `ownerDeleted` logic unchanged — no existing control removed
- [x] Mobile bar fixed alongside desktop sidebar — both name displays updated

**Self-validation verdict: PASS** — 0 tsc errors, all AC met, positive + negative flows implemented.

---

## §17 UI pre-flight (responsive check)

Task 258 adds one new card branch (warning card for `ownerDataUnavailable`) and adjusts name/sub-label text in the existing owner info row. No new layout classes. The 7 breakpoints (320/375/390/768/1280/1440/2560) are unaffected — no new layout classes were added.

---

## Files changed

```
src/app/[locale]/listings/[slug]/page.tsx
src/modules/listings/components/ListingContact.tsx
messages/en.json
messages/sq.json
messages/uk.json
messages/it.json
```
