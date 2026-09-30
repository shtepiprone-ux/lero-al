-- task-865-close-anon-insert.sql
--
-- Task 865 (Sprint 78). Closes the one live anonymous write path: drops the policy
-- "Anyone can insert a view" on public.listing_views and revokes anon's INSERT, UPDATE and
-- DELETE on it. Owner-run in the Supabase SQL Editor (O78-8 step 4).
--
-- Run order (O78-8): BEFORE audit -> BEFORE verify parts (a), (b), (c) -> BEFORE probe ->
-- THIS SCRIPT -> AFTER audit -> AFTER verify parts -> AFTER probe -> 870 privilege audit ->
-- one real guest page view. Expected result: "Success. No rows returned" (the guard and the
-- post-condition are silent when they pass; nothing else here returns rows).
--
-- One transaction. If the guard (step 0) finds a violation it raises ONE exception listing
-- every violation and nothing below runs. If the post-condition (step 2) finds the resulting
-- state wrong it raises and rolls back step 1. The script is idempotent: a second run is a
-- no-op that still passes the post-condition.
--
-- Guard, and why it exists (R2): record_listing_view is the only writer. Task 270 claimed the
-- policy is what lets the RPC insert. That holds only if the function is not SECURITY DEFINER
-- or its owner is subject to RLS. The guard refuses to apply unless the function is
-- SECURITY DEFINER and its owner either has rolbypassrls, or owns listing_views while
-- relforcerowsecurity is false.
--
-- service_role, postgres and authenticated are not named in any statement below.
-- Rollback: scripts/task-865-rollback.sql (re-opens the hole; only if R5 fails AFTER).

begin;

-- ===== STEP 0 - guard (R2) ==============================================================
do $$
declare
  v_violations text[] := array[]::text[];
  v_tbl_oid oid;
  v_rls boolean;
  v_force boolean;
  v_tbl_owner oid;
  v_fn_oid oid;
  v_fn_secdef boolean;
  v_fn_owner oid;
  v_fn_bypass boolean;
begin
  select c.oid, c.relrowsecurity, c.relforcerowsecurity, c.relowner
    into v_tbl_oid, v_rls, v_force, v_tbl_owner
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'listing_views' and c.relkind in ('r', 'p');

  if v_tbl_oid is null then
    v_violations := array_append(v_violations, 'g1: listing_views does not exist as a table in public');
  elsif not v_rls then
    v_violations := array_append(v_violations, 'g1: listing_views has row level security disabled');
  end if;

  v_fn_oid := to_regprocedure('public.record_listing_view(uuid,uuid,text)');
  if v_fn_oid is null then
    v_violations := array_append(v_violations, 'g2: record_listing_view(uuid, uuid, text) does not exist');
  else
    select p.prosecdef, p.proowner into v_fn_secdef, v_fn_owner
    from pg_proc p where p.oid = v_fn_oid;

    if not v_fn_secdef then
      v_violations := array_append(v_violations, 'g2: record_listing_view is not SECURITY DEFINER');
    end if;

    select r.rolbypassrls into v_fn_bypass from pg_roles r where r.oid = v_fn_owner;
    if not coalesce(v_fn_bypass, false)
       and not (v_tbl_oid is not null and v_fn_owner = v_tbl_owner and not v_force) then
      v_violations := array_append(v_violations,
        'g3: record_listing_view owner lacks rolbypassrls and does not own listing_views without FORCE ROW LEVEL SECURITY');
    end if;
  end if;

  if array_length(v_violations, 1) > 0 then
    raise exception 'Task 865 guard: % violation(s) found - %',
      array_length(v_violations, 1), array_to_string(v_violations, ' | ');
  end if;
end $$;

-- ===== STEP 1 - drop the policy, revoke anon DML (R1) ===================================
drop policy if exists "Anyone can insert a view" on public.listing_views;
revoke insert, update, delete on public.listing_views from anon;

-- ===== STEP 2 - post-condition (R1) =====================================================
do $$
declare
  v_violations text[] := array[]::text[];
  v_priv text;
  v_open text;
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'listing_views'
      and policyname = 'Anyone can insert a view'
  ) then
    v_violations := array_append(v_violations, 'policy "Anyone can insert a view" still exists');
  end if;

  foreach v_priv in array array['INSERT', 'UPDATE', 'DELETE'] loop
    if has_table_privilege('anon', 'public.listing_views', v_priv) then
      v_violations := array_append(v_violations, format('anon still holds %s on listing_views', v_priv));
    end if;
  end loop;

  select string_agg(policyname, ', ') into v_open
  from pg_policies
  where schemaname = 'public' and tablename = 'listing_views'
    and cmd in ('INSERT', 'ALL')
    and roles && array['public', 'anon']::name[]
    and (coalesce(qual, '') || coalesce(with_check, '')) !~* 'auth\.(uid|jwt|role)\(';
  if v_open is not null then
    v_violations := array_append(v_violations, format('open INSERT/ALL policy remains: %s', v_open));
  end if;

  if array_length(v_violations, 1) > 0 then
    raise exception 'Task 865 post-condition: % violation(s) found - %',
      array_length(v_violations, 1), array_to_string(v_violations, ' | ');
  end if;
end $$;

-- ===== STEP 3 - reload PostgREST's schema cache =========================================
notify pgrst, 'reload schema';

commit;
