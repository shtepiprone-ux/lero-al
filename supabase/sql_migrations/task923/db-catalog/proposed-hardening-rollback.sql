-- ROLLBACK for proposed-hardening.sql (v7.1) — NOT APPLIED. Restores the four audited function bodies and ACLs exactly as recorded in catalog.json, the view public_user_profiles as captured
-- (r14-03-capture.json), the settings of the six functions of change 10, and drops every object the hardening created (every blocked_account_no_* policy, on public tables and on storage.objects,
-- both new access functions, the listings guard and the old-price rule with listings.price_initial, end_user_sessions and set_default_currency).
-- The objects of v7 that v7.1 no longer creates (restore_inactive_account, caller_access_state, owner_contact_daily_limit, owner_contact_access) are dropped with if exists: nothing to do after v7.1 alone,
-- a clean-up on a database that had v7.
-- TRUNCATE grants are not restored (re-grant by hand if wanted: grant truncate on all tables in schema public to anon, authenticated).
-- WARNING (v7, R64): the apply cleared every listings.price_old and the rollback does NOT bring those values back; the old prices shown afterwards are none until the application writes price_old again.
begin;
set local lock_timeout = '10s';
set local search_path = public, pg_temp;
-- v5 (R58 (a)): the view first, it calls caller_is_active(), which is dropped below; CREATE OR REPLACE keeps its owner and ACL, and both the definition and the grants are checked
create or replace view public.public_user_profiles with (security_invoker=false) as
SELECT id,
    name,
    avatar_url,
    user_type,
    is_verified,
    company_name,
    deleted_at,
    phone IS NOT NULL AND length(phone) > 0 AS has_phone,
    whatsapp IS NOT NULL AND length(whatsapp) > 0 AS has_whatsapp
   FROM users;
do $view$
begin
  if md5(pg_get_viewdef('public.public_user_profiles'::regclass, true)) is distinct from '2c5211f930d54d58322702d27a6d6e87'
     or (select c.relacl::text from pg_class c where c.oid = 'public.public_user_profiles'::regclass) is distinct from '{postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres,authenticated=r/postgres}' or (select c.reloptions from pg_class c where c.oid = 'public.public_user_profiles'::regclass) is distinct from array['security_invoker=false']::text[] then
    raise exception 'public.public_user_profiles is not the captured definition after the rollback';
  end if;
end $view$;
-- v5 (R58 (b)): the settings the six functions had
alter function public.clear_user_history(text, uuid, uuid, uuid) set search_path = public;
alter function public.handle_new_user_notifications() set search_path = public;
alter function public.listing_contact_events_set_owner() set search_path = public;
alter function public.process_saved_search_notify(timestamp with time zone) set search_path = public;
alter function public.admin_search_users_by_email(text) set search_path = auth, public;
alter function public.rls_auto_enable() set search_path = pg_catalog;
-- policies next: they call caller_is_active()
do $rb$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies where policyname like 'blocked_account_no_%' loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $rb$;
drop trigger if exists users_guard_protected on public.users;
drop trigger if exists listings_guard_protected on public.listings;
drop function if exists public.guard_users_protected_columns();
drop function if exists public.guard_listings_protected_columns();
-- v7 (R64): the old-price rule, its function and the column. The price_old values the apply cleared are NOT restored (see change 12 of the apply file); price_old is written by nothing after the
-- rollback unless the application writes it again (createListing / updateListing stop in the same release as the apply).
drop trigger if exists listings_price_rule on public.listings;
drop function if exists public.listings_price_rule();
alter table public.listings drop column if exists price_initial;
-- v7 (R65 (c), (d)): the two new functions
drop function if exists public.end_user_sessions(uuid);
drop function if exists public.set_default_currency(integer);
-- v7 (R81 (b)): the failed-attempt table (its rows are the 15-minute counts of re-authentication and carry nothing else)
drop table if exists public.reauth_failures;
drop function if exists public.restore_inactive_account();
drop function if exists public.caller_access_state();
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.users (id, name, phone, avatar_url, role, user_type, is_verified, created_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'private')::user_type,
    FALSE,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;
-- the audited get_listing_owner_contact has no quota; restore it before dropping the objects of v7 that v7.1 no longer creates (the quota function and table above and below are if exists: a no-op on a database that only ever had v7.1)
CREATE OR REPLACE FUNCTION public.get_listing_owner_contact(listing_id_param uuid)
 RETURNS TABLE(phone text, whatsapp text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  $function$;
drop function if exists public.owner_contact_daily_limit();
drop table if exists public.owner_contact_access;
CREATE OR REPLACE FUNCTION public.record_recently_viewed(p_listing_id uuid, p_cap integer DEFAULT 25)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  -- Upsert: insert new or refresh viewed_at on revisit
  INSERT INTO recently_viewed (user_id, listing_id, viewed_at)
  VALUES (v_user_id, p_listing_id, now())
  ON CONFLICT (user_id, listing_id) DO UPDATE SET viewed_at = now();

  -- Prune entries beyond cap (keep the p_cap most-recent by viewed_at)
  DELETE FROM recently_viewed
  WHERE user_id = v_user_id
    AND id NOT IN (
      SELECT id FROM recently_viewed
      WHERE user_id = v_user_id
      ORDER BY viewed_at DESC
      LIMIT p_cap
    );
END;
$function$;
grant execute on function public.record_recently_viewed(uuid, integer) to public, anon, authenticated, service_role;
drop function if exists public.record_listing_view(uuid, uuid, text);
CREATE OR REPLACE FUNCTION public.record_listing_view(p_listing_id uuid, p_user_id uuid DEFAULT NULL::uuid, p_ip_hash text DEFAULT ''::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip if this fingerprint already viewed within the last 24 hours
  IF EXISTS (
    SELECT 1
    FROM   listing_views
    WHERE  listing_id = p_listing_id
      AND  viewed_at  >= (now() AT TIME ZONE 'UTC') - INTERVAL '24 hours'
      AND  (
             (p_user_id IS NOT NULL AND user_id = p_user_id)
             OR
             (p_user_id IS NULL AND p_ip_hash <> '' AND ip_hash = p_ip_hash)
           )
    LIMIT 1
  ) THEN
    RETURN;
  END IF;

  -- Record the view in the ledger
  INSERT INTO listing_views (listing_id, user_id, ip_hash, viewed_at)
  VALUES (p_listing_id, p_user_id, p_ip_hash, now());

  -- Atomic increment — single UPDATE, no SELECT+UPDATE race
  UPDATE listings
  SET    views_count = views_count + 1
  WHERE  id = p_listing_id;
END;
$function$;
grant execute on function public.record_listing_view(uuid, uuid, text) to public, anon, authenticated, service_role;
drop function if exists public.caller_is_admin();
drop function if exists public.caller_is_active();
-- v7: after the rollback the listings table has the two audited triggers and no price_initial, and the two new functions are gone
do $chk7$
begin
  if (select count(*) from pg_trigger t where t.tgrelid = 'public.listings'::regclass and not t.tgisinternal and t.tgname in ('listings_search_vector', 'listings_updated_at') and t.tgenabled = 'O') <> 2
     or (select count(*) from pg_trigger t where t.tgrelid = 'public.listings'::regclass and not t.tgisinternal) <> 2 then
    raise exception 'rollback check failed: the triggers of public.listings are not the two audited ones';
  end if;
  if exists (select 1 from pg_attribute a where a.attrelid = 'public.listings'::regclass and a.attname = 'price_initial' and not a.attisdropped)
     or to_regprocedure('public.end_user_sessions(uuid)') is not null or to_regprocedure('public.set_default_currency(integer)') is not null
     or to_regprocedure('public.listings_price_rule()') is not null or to_regclass('public.reauth_failures') is not null then
    raise exception 'rollback check failed: a v7 object is still there';
  end if;
end $chk7$;
notify pgrst, 'reload schema';
commit;
