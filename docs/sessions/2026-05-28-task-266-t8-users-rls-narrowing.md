# Task 266 — T.8 — Narrow `users` RLS authenticated-read policy

**Date:** 2026-05-28  
**Sprint:** 15  
**Type:** chore (security / architectural refinement)  
**Status:** ✅ Complete

---

## Strategy Decision (recorded)

**Strategy A — database view + narrower RLS** (owner + orchestrator approved 2026-05-28).

**Design:**
1. `public.public_user_profiles` view — exposes only safe columns (no email, no phone/whatsapp digits; `has_phone` / `has_whatsapp` booleans instead).
2. View security: `security_invoker = false` (default — view IS the access boundary; runs with creator privileges so it can read all `users` rows, but only exposes the safe column subset). `GRANT SELECT TO authenticated`.
3. Replace `USING (true)` policy with `users_self_read` (`auth.uid() = id`).
4. `get_listing_owner_contact(listing_id_param uuid)` SECURITY DEFINER RPC — keyed by `listing_id`, not `user_id`; listing-status filter; deleted-owner skip; explicit `search_path`.
5. SSR: separate `from('public_user_profiles')` query (not embed) — safer than view-embed since PostgREST embed-against-view may require manual FK comments.
6. Client: WhatsApp / Call buttons render on booleans; click triggers `getListingOwnerContact` server action (RPC roundtrip) to get actual digits.

**Side effect discovered (permissions.ts):** `getModeratorPermissions()` uses `supabase` (session-aware client) to batch-read actor names via `from('users').select('id, name').in('id', actorIds)`. After narrowing, this returns empty results. Fix: switch that one call to `createAdminClient()`.

---

## SQL for Owner (run in Supabase SQL Editor — code changes gated on confirmation)

```sql
-- ── 1. Public user profile view ────────────────────────────────────────────────
-- security_invoker = false (default): view runs with creator privileges so it can
-- read all users rows, but ONLY exposes the safe column subset. This view IS the
-- access boundary — email/phone/whatsapp digits are never in the column list.

CREATE OR REPLACE VIEW public.public_user_profiles
  WITH (security_invoker = false)
AS
SELECT
  id,
  name,
  avatar_url,
  user_type,
  is_verified,
  company_name,
  deleted_at,
  (phone    IS NOT NULL AND length(phone)    > 0) AS has_phone,
  (whatsapp IS NOT NULL AND length(whatsapp) > 0) AS has_whatsapp
FROM public.users;

-- Grant SELECT on view to authenticated (not anon — guests continue to get null)
GRANT SELECT ON public.public_user_profiles TO authenticated;

-- ── 2. Narrow users table RLS ──────────────────────────────────────────────────
-- Replace USING (true) (Task 263) with self-read only.
-- Service-role (admin client) bypasses RLS entirely — admin pages unaffected.

DROP POLICY IF EXISTS "authenticated users can read active user profiles" ON public.users;

CREATE POLICY "users_self_read"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- ── 3. RPC: get_listing_owner_contact ──────────────────────────────────────────
-- Keyed by listing_id (NOT user_id) — prevents "give me arbitrary user's phone".
-- Listing-status filter: only public-visible listings.
-- Deleted-owner skip: returns 0 rows if owner has deleted_at set.
-- SECURITY DEFINER + explicit search_path: Supabase best practice.

CREATE OR REPLACE FUNCTION public.get_listing_owner_contact(listing_id_param uuid)
  RETURNS TABLE (phone text, whatsapp text)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT u.phone, u.whatsapp
    FROM public.listings l
    JOIN public.users u ON u.id = l.user_id
    WHERE l.id = listing_id_param
      AND l.status IN ('active', 'sold', 'rented', 'archived')
      AND u.deleted_at IS NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_listing_owner_contact(uuid) FROM public;
GRANT  EXECUTE ON FUNCTION public.get_listing_owner_contact(uuid) TO authenticated;

-- ── 4. PostgREST schema reload ─────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
```

---

## Pre-flight inventory — authenticated `from('users')` calls (Note 20)

| Call site | Client type | Reads own row? | Impact after narrowing |
|-----------|-------------|---------------|------------------------|
| `lib/auth/server.ts:53` `select('*')` | session | ✅ self | self-read passes ✓ |
| `lib/auth/server.ts:97,115` `upsert/update` | session | ✅ self | write — unaffected by SELECT policy |
| `lib/auth/permissions.ts:28` `select('role')` | session | ✅ self | self-read passes ✓ |
| `lib/auth/browser.ts:96,109` `select/upsert` | session | ✅ self | self-read ✓ |
| `lib/auth/blockCheck.ts:25` `select('status,suspended_until')` | session | ✅ self | self-read ✓ |
| `modules/admin/actions/index.ts:23,321` `select('role')` | session | ✅ self | self-read ✓ |
| `modules/admin/actions/permissions.ts:38,49,98` `select('role')` | session | ✅ self | self-read ✓ |
| **`modules/admin/actions/permissions.ts:67`** `select('id,name').in('id',actorIds)` | **session** | ❌ **other users** | **BREAKS** — fix: switch to `createAdminClient()` |
| `modules/admin/actions/permissions.ts:119` `select('id,name').in('id',actorIds)` | **admin** (db = createAdminClient) | n/a | admin bypasses RLS ✓ |
| `modules/cabinet/actions/index.ts:51` `update(...)` | session | ✅ self | write ✓ |
| `modules/admin/actions/locale.ts:24` `update(preferred_locale)` | session | ✅ self | write ✓ |
| `modules/notifications/lib/emails/resolveUserLocale.ts:29` | **admin** | n/a | admin ✓ |
| `lib/auth/server.ts` (getUser/upsert) | session | ✅ self | self-read/write ✓ |
| All other `modules/admin/actions/*` | **admin** (createAdminClient) | n/a | admin bypasses ✓ |

---

## Positive Flow

Steps 1-5 from kickoff (see kickoff file). Requires owner to confirm SQL before code change.

---

## Negative Flow — Branch Responses

All 12 branches from kickoff documented. Key ones:
- **View runs as security_definer (default)**: safe — only view's column set is exposed; email/phone/whatsapp digits never in view definition
- **PostgREST refuses embed-against-view**: avoided — using separate `from('public_user_profiles').select(...)` query instead of embed
- **Owner has NOT applied SQL before code change**: `from('public_user_profiles')` query returns table-not-found error → ownerRaw = null → `ownerDataUnavailable` defensive branch fires. Gate prevents this.
- **Cabinet ProfileTab self-read regression**: `users_self_read` permits `auth.uid() = id` → own row readable ✓
- **Admin /admin/users**: service-role bypasses RLS ✓
- **Email helpers**: all use `createAdminClient()` per Task 251 audit ✓
- **Guest viewer**: no `authenticated` grant on view → query returns null → `showGuestCTA` fires ✓ (or we simply skip the owner query for guests)
- **Deleted owner** (`deleted_at IS NOT NULL`): view returns row with `deleted_at` → `ownerDeleted` branch fires ✓
- **RPC returns 0 rows** (listing not visible / deleted owner): `toast.error(t('contact_load_failed'))` ✓
- **Session expired when user clicks contact**: RPC raises unauthenticated → caught → `toast.error(t('contact_load_failed'))` ✓
- **`permissions.ts:67` actor names query**: fixed by switching to `createAdminClient()` ✓

---

## Code Changes (executed after owner confirmed SQL)

### New: `src/modules/listings/actions/getListingOwnerContact.ts`
Server action wrapping the RPC. Returns `{ phone, whatsapp, error? }`.

### Modified: `src/app/[locale]/listings/[slug]/page.tsx`
- Remove `owner:users!listings_user_id_fkey(...)` embed from listing SELECT
- Add `supabase.from('public_user_profiles').select('...').eq('id', listing.user_id).maybeSingle()` to the auth-dependent parallel block (authenticated only; guests get ownerRaw = null)
- Update `owner` fallback: `has_phone: false, has_whatsapp: false` (replaces `phone: null, whatsapp: null`)
- Update `ListingMobileCTA` props: `hasPhone`/`hasWhatsapp` booleans + `listingId`
- Remove `ownerEmbedRaw` variable (no longer needed)

### Modified: `src/modules/listings/components/ListingContact.tsx`
- `Owner` interface: `phone/whatsapp → has_phone: boolean / has_whatsapp: boolean`
- Add `contactLoading: boolean` state
- Replace static `<a href="tel:...">` / `<a href="wa.me/...">` with `<button onClick={handleContactClick('call'/'whatsapp')}>`
- `handleContactClick`: calls `getListingOwnerContact(listingId)` → constructs tel: or wa.me: URL → opens
- Error: `toast.error(t('contact_load_failed'))`
- Keep all other branches (ownerDeleted, showGuestCTA, ownerDataUnavailable, favorites, share, report) unchanged

### Modified: `src/modules/listings/components/ListingMobileCTA.tsx`
- Add `'use client'`
- Props: `hasPhone: boolean, hasWhatsapp: boolean, listingId: string`
- Same click-to-fetch pattern as ListingContact

### Modified: `src/modules/admin/actions/permissions.ts`
- Line 67: switch `supabase.from('users').select('id, name').in('id', actorIds)` to `(createAdminClient()).from('users')...`
- Fixes the actor-name resolution in `getModeratorPermissions` post-RLS-narrowing

### New: `src/types/database.ts`
- Add `PublicUserProfile` interface

### Modified: `scripts/check-schema-drift.mjs`
- Add `PublicUserProfile: 'public_user_profiles'` to `INTERFACE_TABLE_MAP`

### Modified: `messages/*.json` ×4
- Add `listing.contact_load_failed` key

---

## Self-Validation Block (Note 18)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| `owner.phone` / `owner.whatsapp` in ListingContact | ✅ CLEAN (replaced by has_phone/has_whatsapp) |
| `owner:users!...` embed in page.tsx | ✅ CLEAN (removed; separate view query) |
| `public_user_profiles` view query in auth block | ✅ Added to parallel Promise.all |
| Owner fallback: has_phone/has_whatsapp booleans | ✅ `has_phone: false, has_whatsapp: false` |
| `getListingOwnerContact` server action | ✅ Created; wraps RPC with error handling |
| Click-to-fetch in ListingContact (desktop + mobile bar) | ✅ Both `handleContactClick('whatsapp'/'call')` |
| Click-to-fetch in ListingMobileCTA | ✅ 'use client' + handleContactClick |
| `contact_load_failed` toast on RPC error | ✅ Both components |
| `contact_load_failed` key ×4 locales | ✅ sq/en/uk/it |
| `permissions.ts:67` actor names via admin client | ✅ Switched to `createAdminClient()` |
| `PublicUserProfile` type in database.ts | ✅ 9 columns |
| `PublicUserProfile` in INTERFACE_TABLE_MAP | ✅ `→ public_user_profiles` |
| Schema-drift SQL regenerated | ✅ 29 tables / 272 cols |
| Admin pages using `owner:users!...` embed | ✅ Both use `createAdminClient()` — RLS bypassed ✓ |
| Cabinet ProfileTab self-read (users_self_read) | ✅ `auth.uid() = id` permits self-read |
| Grep: no authenticated-client phone/whatsapp/email expose | ✅ 0 hits outside RPC |

**Final verdict:** ✅ PASS — view created, RLS narrowed, RPC wired, click-to-fetch implemented, tsc=0.

## Owner Action Required

Run `scripts/schema-drift-check.sql` in Supabase SQL Editor after the code ships. Expected: **0 rows** (view columns should now be tracked in the drift guard).

## Files Changed (after code is written)

| Path | Change | Rationale |
|------|--------|-----------|
| `src/modules/listings/actions/getListingOwnerContact.ts` | New — RPC wrapper | Returns phone/whatsapp for listing |
| `src/app/[locale]/listings/[slug]/page.tsx` | Remove embed; add view query in auth block; update owner fallback + MobileCTA props | Use safe view instead of users table |
| `src/modules/listings/components/ListingContact.tsx` | Owner interface booleans; click-to-fetch handlers; contact_load_failed toast | Privacy: digits fetched on click, not SSR |
| `src/modules/listings/components/ListingMobileCTA.tsx` | Add 'use client'; update props; click-to-fetch | Mobile CTA parity |
| `src/modules/admin/actions/permissions.ts` | Line 67: `supabase` → `createAdminClient()` for actor names | Prevent regression after self-read-only policy |
| `src/types/database.ts` | Add `PublicUserProfile` interface | Type coverage for drift guard |
| `scripts/check-schema-drift.mjs` | Add `PublicUserProfile: 'public_user_profiles'` to INTERFACE_TABLE_MAP | Drift guard covers view |
| `scripts/schema-drift-check.sql` | Regenerated | Auto-generated from database.ts |
| `messages/sq.json` | `listing.contact_load_failed` | Error toast key |
| `messages/en.json` | `listing.contact_load_failed` | Error toast key |
| `messages/uk.json` | `listing.contact_load_failed` | Error toast key |
| `messages/it.json` | `listing.contact_load_failed` | Error toast key |
