# Task 266 — T.8 — Narrow the `users` RLS authenticated-read policy (security follow-up)

Type:        chore (security / architectural refinement)
Priority:    medium (privacy surface; not immediately exploitable but should be addressed)
Area:        users / RLS / privacy
Filed by:    Task 263 review (Opus 4.7) on 2026-05-28 — Task 263 closed by applying a `USING (true)` policy on `users` to allow the deleted-owner UI branch to read `deleted_at`. The policy is broader than the listing-detail use case requires; this task narrows it.
Sprint:      14 (or 15)

## Pre-read

1. `docs/agent-contract.md` (P0 — INCLUDING clause 6a Positive + Negative flow + clause 10 Files Changed)
2. `docs/backlog.md`
3. `docs/rule-index.md` → "DB / server action / RLS task" bundle:
   - `docs/data-access-rules.md`
   - `docs/domain-rules.md`
   - **`docs/rls-rules.md`** (the canonical RLS doc — this task narrows a policy added in Task 263)
   - `docs/qa-rules.md`
4. Task 258 + Task 263 session logs (the full history of the listing-detail RLS path).
5. `src/app/[locale]/listings/[slug]/page.tsx` (the consumer of the embed JOIN).
6. Grep `select('*').from('users')` + `from('users').select(` to inventory every authenticated-client read of `users` across the app — these are the call sites the current policy exposes.
7. `src/lib/supabase/admin.ts` (service-role client — service-role bypasses RLS, so admin actions are unaffected by either policy).

## Problem statement

Task 263 fixed Bug 4 long-term by removing the `createAdminClient()` bypass from the listing-detail page and applying an RLS policy on `public.users`. The chosen policy after Sonnet's STOP&ASK escalation was:

```sql
CREATE POLICY "authenticated users can read active user profiles"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);
```

`USING (true)` was chosen so that the `ownerDeleted` UI branch in `ListingContact.tsx` continues to work (the code needs to read `deleted_at` to render the "account deleted" card; the narrower `USING (deleted_at IS NULL)` would hide deleted rows entirely).

**Limitation:** RLS policies authorize ROWS, not COLUMNS. With `USING (true)`, any authenticated user can SELECT any column of any users row from the session-aware client — including potentially sensitive columns like `email`, `phone`, `whatsapp` — IF a client-side query asks for them. The current listing-detail projection limits to `id, name, phone, whatsapp, avatar_url, user_type, is_verified, company_name, deleted_at`, but other code paths elsewhere in the app are NOT constrained by RLS.

This is not immediately exploitable in shipped UI (no other page exposes `users.*` via the session-aware client beyond the listing detail). It IS a future-proofing concern.

## Current behavior to preserve

- Task 263 outcome unchanged: authenticated viewers on listing detail see real owner data (name, user_type, agency name, contact buttons) via the embed JOIN; deleted-owner UI branch renders correctly; `ownerDataUnavailable` defensive branch retained.
- Guest viewers: existing showGuestCTA branch unchanged.
- Owner self-view: unchanged.
- Service-role admin queries: unaffected (RLS bypassed by service-role).
- No regression to Task 256 (admin email reply), Task 255 (admin reply history), Task 258 (contact card), or Task 263 outcome.

## Orchestrator decision (2026-05-28) — Strategy A, hardened

**This task no longer requires STOP&ASK on strategy choice.** The owner + orchestrator have picked **Strategy A — database view + narrower RLS** with two refinements that close common Strategy-A pitfalls. Sonnet executes the implementation below. STOP&ASK ONLY for the explicit sub-decisions called out below (e.g. PostgREST embed feasibility, has_phone/has_whatsapp inclusion).

**Why A over B and C:**
- **B (SECURITY DEFINER function)** would work but is architecturally heavier than necessary. SECURITY DEFINER runs with the owner's privileges (not the caller's), so it requires careful hardening: explicit `search_path` setting, explicit grants, minimal return shape, defensive parameter validation. Reasonable as a fallback if A proves infeasible in our PostgREST setup, but produces "magic RPC" semantics where Strategy A produces a readable, declarative public surface.
- **C (lint-only enforcement)** is rejected. It does NOT solve the DB-level problem; it just shifts enforcement to the application layer. For a privacy/security follow-up the DB must be the boundary.

### Strategy A — implementation specification

**1. Public profile view.** Create `public.public_user_profiles` exposing ONLY safe columns:
```
id, name, avatar_url, user_type, is_verified, company_name, deleted_at,
has_phone     boolean,  -- (phone IS NOT NULL AND length(phone) > 0)
has_whatsapp  boolean   -- (whatsapp IS NOT NULL AND length(whatsapp) > 0)
```
- `has_phone` / `has_whatsapp` are computed boolean columns — they let the UI render Call / WhatsApp buttons conditionally without exposing the digits in the SSR payload.
- Email is NEVER in the view. Phone/whatsapp digits are NEVER in the view (only the booleans).

**2. View security — Supabase / PostgREST nuance (CRITICAL).** Postgres views default to running with the **creator's** privileges, which silently bypasses RLS. Supabase documents this and recommends explicit `security_invoker = true` for any view that should respect RLS, OR keeping the default (`security_definer`) when the view IS the access boundary and ONLY exposes safe columns. Pick the path explicitly and document it in the session log:
- **Recommended for this task:** create the view with `WITH (security_invoker = false)` (default — but state it explicitly in the DDL comment), grant `SELECT` on the view to `authenticated`, and do NOT grant `authenticated` direct access to `public.users` (drop the broad `USING (true)` policy). The view IS the access boundary; only its column set escapes RLS.
- **Alternative:** `security_invoker = true` + add a separate permissive RLS policy on `public.users` that allows authenticated SELECT of the safe columns — but Postgres RLS does NOT enforce column subsets, so this still requires the projection in the view. Less clean.
Choose path 1 (default invoker on view + grant) unless Sonnet finds a PostgREST embed-relationship reason to pick path 2. STOP&ASK if unclear.

**3. Narrow the `users` table RLS.** Replace the current `USING (true)` policy with self-read-only:
```sql
DROP POLICY IF EXISTS "authenticated users can read active user profiles" ON public.users;
CREATE POLICY "users_self_read" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);
```
- This means: a user reading their own row via `from('users').select('*')` STILL works (e.g. cabinet ProfileTab).
- Reading ANY OTHER user's row from authenticated client → blocked. Service-role admin paths bypass RLS and are unaffected.

**4. RPC for phone/WhatsApp keyed by `listing_id`, NOT `user_id`.** Create:
```sql
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
GRANT EXECUTE ON FUNCTION public.get_listing_owner_contact(uuid) TO authenticated;
```
- Keyed by `listing_id`, NOT `user_id` — so the function CAN'T be used as "give me arbitrary user's phone".
- Verifies listing is in a public-visible status before returning contact.
- Skips deleted owners (returns 0 rows).
- Explicit `search_path` set (Supabase best practice for SECURITY DEFINER — prevents schema-shadow attacks).
- Returns ZERO rows for unknown / deleted / non-public listings — never throws on "not found" (UI handles empty result).

**5. SSR projection in `src/app/[locale]/listings/[slug]/page.tsx`.**
- Change the embed JOIN from `owner:users!listings_user_id_fkey(...)` to `owner:public_user_profiles!listings_user_id_fkey(...)` — STOP&ASK if PostgREST refuses to embed against the view (Supabase usually supports view embeds if the underlying FK is declared, but may need a manual FK comment or a separate hand-rolled second query).
- If embed-against-view fails, run a separate `from('public_user_profiles').select(...).eq('id', listing.user_id).maybeSingle()` query after the listing query — slight performance cost, clean fallback.
- Update the type used in `ListingContact` props: replace `phone: string | null` / `whatsapp: string | null` with `has_phone: boolean` / `has_whatsapp: boolean`.

**6. Client-side phone/WhatsApp click flow.**
- WhatsApp / Call buttons render based on `owner.has_phone` / `owner.has_whatsapp` (booleans from the view).
- On click → server action / RPC call → `get_listing_owner_contact(listing.id)` → returns `{ phone, whatsapp }` → open `wa.me/<phone>?text=...` or `tel:<phone>`.
- Adds one server roundtrip on click; UX trade-off is acceptable for the privacy gain.
- Document this UX change in the session log (it's deliberate).
- For accessibility: while the RPC is in flight, the button shows a small spinner; on error, toast `t('listing.contact_load_failed')` (new key ×4).

### Required after behavior

1. The `public_user_profiles` view exists in the DB with the 9 columns above (7 raw + 2 boolean).
2. The `USING (true)` policy on `public.users` is DROPPED.
3. The new `users_self_read` policy on `public.users` is in place.
4. The `get_listing_owner_contact(uuid)` RPC exists with the GRANT/REVOKE pattern above.
5. Listing-detail page renders identically to Task 263 outcome (owner name + user_type / agency name + Save/Favorite/Share buttons + canReport-gated Report dialog).
6. WhatsApp / Call buttons appear when `has_phone` / `has_whatsapp` is true (regardless of viewer being able to read the actual number).
7. Click on WhatsApp / Call → RPC fetches the digits → tel:/wa.me:// link opens correctly.
8. Cabinet ProfileTab continues to render the user's own phone/whatsapp/email (`auth.uid() = id` self-read still works).
9. Admin pages that use service-role continue to render ALL user data (RLS bypassed for admin).
10. Grep proof: no authenticated-client query SELECTs `phone`, `whatsapp`, or `email` from `public.users` other than (a) self-read paths and (b) the RPC.

## Positive flow (happy path)

- Actor: authenticated user opening any listing detail page.
- Preconditions: owner has applied the new SQL (view + RLS + RPC).
- Steps:
  1. SSR runs the listing query → embed JOIN against `public_user_profiles` returns the safe column set including `has_phone` / `has_whatsapp` booleans.
  2. `ListingContact` renders owner name, user_type / agency name, `deleted_at`-based UI branches.
  3. WhatsApp / Call buttons render conditionally on the booleans.
  4. User clicks WhatsApp → client calls server action → `get_listing_owner_contact(listing.id)` → returns `{ phone, whatsapp }` → client opens `wa.me/<whatsapp>?text=...`.
  5. Page reload / nav: same as above; deterministic.

## Negative flow (every off-happy-path branch)

- **View runs as `security_definer` accidentally** (creator owns view, view bypasses RLS): privacy leak risk — but ONLY the view's column set is exposed (safe by design). Document explicitly in the session log which mode the view runs in. Add a unit test or RLS test that confirms `email` is NOT returned from `public_user_profiles` even with a non-admin authenticated client.
- **PostgREST refuses to embed via the view** (FK not propagated): STOP&ASK orchestrator before falling back to a hand-rolled second query. Document the choice.
- **Owner has NOT applied the new SQL before the code change ships**: SSR fails on embed (column unknown OR view does not exist). **Gate the code change on owner-confirmed SQL** (same pattern as Task 263).
- **Cabinet ProfileTab self-read regression** (user can't see their own phone/email): the new `users_self_read` policy MUST permit it; verify in the cabinet page.
- **Admin /admin/users regression** (admin uses service-role; should still work): verify with a runtime check.
- **Email-sending Resend helpers** that look up `users.preferred_locale`: they currently use service-role (per Task 251 audit) and are unaffected by RLS narrowing. Verify with grep.
- **Guest viewer**: no auth → `users_self_read` doesn't apply → view returns null via the embed → existing `showGuestCTA` branch fires (unchanged).
- **Owner viewing own listing**: `auth.uid() = listing.user_id` → self-read on users works; view also returns the row → owner sees own profile data normally.
- **Deleted owner** (`deleted_at IS NOT NULL`): view returns the row WITH `deleted_at` populated → `ownerDeleted` branch in `ListingContact` fires correctly. `get_listing_owner_contact` returns 0 rows (filtered by `u.deleted_at IS NULL`) → Call/WhatsApp buttons either NOT shown (because `has_phone`/`has_whatsapp` is irrelevant when ownerDeleted=true) OR if clicked anyway, show toast `t('listing.contact_load_failed')`.
- **Listing in pending/inactive status when user clicks contact**: RPC returns 0 rows → toast `t('listing.contact_load_failed')`; no crash.
- **Listing deleted between SSR and click**: same as above — RPC returns 0 rows → toast.
- **Rate limiting / scraping**: out of scope for this task; document as follow-up (separate task if owner wants). The RPC inherently rate-limits via Supabase's auth quota.
- **User unauthenticated when calling RPC** (session expired mid-page): RPC raises `unauthenticated` exception → caller catches → toast `t('listing.contact_load_failed')` or redirect to sign-in (decide with orchestrator before adding redirect; STOP&ASK).
- **Existing `ownerDataUnavailable` defensive branch in `ListingContact.tsx`**: PRESERVED — fires when authed viewer + null embed result (orphaned listing).
- **PostgREST cache stale**: after `ALTER POLICY`, owner runs `NOTIFY pgrst, 'reload schema';` in Supabase SQL Editor OR restarts the API. Document in the session log.

## Acceptance criteria

- **Orchestrator decision recorded** (Strategy A hardened, this section) — no further "choose A/B/C" decision needed.
- View `public_user_profiles` created with 9 columns + explicit view-security mode noted in DDL comment + session log.
- Old `USING (true)` policy on `users` DROPPED; new `users_self_read` policy in place.
- `get_listing_owner_contact(uuid)` RPC created with REVOKE/GRANT + `SET search_path` + listing-status filter + deleted-owner skip.
- `src/app/[locale]/listings/[slug]/page.tsx` updated to embed/select from the view (or hand-rolled second query if embed fails — orchestrator-approved fallback).
- `src/modules/listings/components/ListingContact.tsx` updated: `has_phone` / `has_whatsapp` booleans gate button visibility; click handlers call the new server action that wraps the RPC.
- New server action `getListingOwnerContact(listingId)` in `src/modules/listings/actions/` (or appropriate module) — thin wrapper over the RPC.
- New locale key `listing.contact_load_failed` ×4.
- Cabinet ProfileTab unchanged behavior verified at runtime (self-read works).
- /admin/users unchanged behavior verified at runtime (service-role bypass works).
- Grep proof: zero authenticated-client SELECTs of `phone` / `whatsapp` / `email` from `public.users` outside (a) self-read paths and (b) the RPC.
- **Positive flow** all 5 steps verifiable in diff at named files + lines.
- **Negative flow** each branch verifiable: defensive branches preserved (guest CTA, deleted-owner card, ownerDataUnavailable), error toasts wired, RPC contract honored.
- "Files Changed" table per Task 264.
- Self-validation block per Note 18.
- `npx tsc --noEmit` → 0 errors; `npm run build` → passes.
- 4 locales; 7 breakpoints (no layout changes, only data-source changes).
- docs/backlog.md updated; session log: `docs/sessions/2026-05-2N-task-266-t8-users-rls-narrowing.md`.
- Idempotent SQL emitted in session log; owner runs in Supabase SQL Editor; code change gated on owner-confirmed SQL.

## Acceptance criteria

- Chosen strategy (A/B/C) documented in session log with orchestrator approval BEFORE code is written.
- Positive flow step 3 (listing detail renders identically to Task 263) verifiable in runtime check.
- Negative flow → deleted-owner UI branch still works (test).
- Negative flow → orphaned listing still produces `ownerDataUnavailable` warning.
- Grep proof: no new authenticated-client query exposes email/phone/whatsapp outside Strategy-approved surfaces.
- Old `USING (true)` policy DROPPED (or replaced per the chosen strategy).
- `npx tsc --noEmit` → 0 errors; `npm run build` → passes.
- "Files Changed" table in session log per Task 264.
- Self-validation block per Note 18.
- docs/backlog.md updated; session log: `docs/sessions/2026-05-2N-task-266-t8-users-rls-narrowing.md`.

## Out of scope

- Changing the listing-detail contact card UI (Task 258 outcome preserved).
- Changing the `createAdminClient()` policy for other surfaces (this task only touches the post-Task-263 RLS on `users`).
- Designing a comprehensive RBAC overhaul (Epic R already covers permissions).
- Changing phone/whatsapp privacy stance for listing owners (separate product decision).
