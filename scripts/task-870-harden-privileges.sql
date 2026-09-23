-- task-870-harden-privileges.sql
--
-- Task 870 (Sprint 80). Owner-run in the Supabase SQL Editor, AFTER capturing the BEFORE
-- grid from scripts/task-870-privilege-audit.sql. Run order (O80-2): BEFORE audit → this
-- script → AFTER audit. Expected result: "Success. No rows returned" (the guard is silent
-- when it passes; nothing else in this script returns rows).
--
-- One transaction. If the guard (step 0) finds any of the 18 R tables still reachable
-- through a path this task cannot see from src/ (a SECURITY INVOKER function body, the
-- supabase_realtime publication, or a dependent view), it raises ONE exception listing
-- every violation and the whole transaction rolls back — nothing below is applied.
--
-- Step 1 (R2, F1-F4): public_user_profiles — identical in effect to the 2026-09-23 hotfix
-- (docs/sessions/evidence/task870/00-owner-grids-2026-09-23.txt, GRID 5) and idempotent.
-- Step 2 (R4, F7-F15): revoke all anon/authenticated privileges on the 18 R tables —
-- one literal statement per relation, no dynamic SQL, no loop.
-- Step 3 (R5, F17): postgres's default privileges in public grant nothing to anon or
-- authenticated for future tables or sequences.
-- Step 4: reload PostgREST's schema cache.
--
-- service_role is not touched anywhere in this script.

begin;

-- ═════ STEP 0 — guard (R3) ═══════════════════════════════════════════════════════════
-- Byte-identical to scripts/task-870-guard-selftest.sql except the array literal below.
do $$
declare
  v_names text[] := array['email_change_tokens','user_status_history','user_change_log','agent_reviews','amenities','amenity_translations','conversations','currency_rates','history_clear_events','languages','listing_amenities','listing_translations','location_translations','messages','notification_settings','page_translations','support_messages','verification_requests'];
  v_name text;
  v_violations text[] := array[]::text[];
  v_tbl_oid oid;
  v_fn record;
  v_pub_count int;
  v_dep_names text;
begin
  foreach v_name in array v_names loop
    v_tbl_oid := null;

    select c.oid into v_tbl_oid
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = v_name and c.relkind in ('r', 'p');

    if v_tbl_oid is null then
      v_violations := array_append(v_violations, format('g1: %s does not exist as a table in public', v_name));
      continue;
    end if;

    for v_fn in
      select p.proname
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.prosecdef = false
        and p.prokind in ('f', 'p')
        and pg_get_functiondef(p.oid) ~* ('\m' || v_name || '\M')
    loop
      v_violations := array_append(v_violations, format('g2: function %s (SECURITY INVOKER) references %s', v_fn.proname, v_name));
    end loop;

    select count(*) into v_pub_count
    from pg_publication_tables pt
    where pt.pubname = 'supabase_realtime' and pt.schemaname = 'public' and pt.tablename = v_name;

    if v_pub_count > 0 then
      v_violations := array_append(v_violations, format('g3: %s is in the supabase_realtime publication', v_name));
    end if;

    select string_agg(distinct vc.relname, ',' order by vc.relname) into v_dep_names
    from pg_depend d
    join pg_rewrite rw on rw.oid = d.objid and d.classid = 'pg_rewrite'::regclass
    join pg_class vc on vc.oid = rw.ev_class and vc.relkind in ('v', 'm')
    join pg_namespace vn on vn.oid = vc.relnamespace
    where d.refobjid = v_tbl_oid and d.refclassid = 'pg_class'::regclass and vn.nspname = 'public';

    if v_dep_names is not null then
      v_violations := array_append(v_violations, format('g4: view(s) %s depend on %s', v_dep_names, v_name));
    end if;
  end loop;

  if array_length(v_violations, 1) > 0 then
    raise exception 'Task 870 guard: % violation(s) found — %', array_length(v_violations, 1), array_to_string(v_violations, ' | ');
  end if;
end $$;

-- ═════ STEP 1 — public_user_profiles (R2) ════════════════════════════════════════════
revoke all on public.public_user_profiles from anon, authenticated;
grant select on public.public_user_profiles to authenticated;
grant select on public.public_user_profiles to service_role;

-- ═════ STEP 2 — revoke on the 18 R tables (R4) ═══════════════════════════════════════
revoke all on public.email_change_tokens from anon, authenticated;
revoke all on public.user_status_history from anon, authenticated;
revoke all on public.user_change_log from anon, authenticated;
revoke all on public.agent_reviews from anon, authenticated;
revoke all on public.amenities from anon, authenticated;
revoke all on public.amenity_translations from anon, authenticated;
revoke all on public.conversations from anon, authenticated;
revoke all on public.currency_rates from anon, authenticated;
revoke all on public.history_clear_events from anon, authenticated;
revoke all on public.languages from anon, authenticated;
revoke all on public.listing_amenities from anon, authenticated;
revoke all on public.listing_translations from anon, authenticated;
revoke all on public.location_translations from anon, authenticated;
revoke all on public.messages from anon, authenticated;
revoke all on public.notification_settings from anon, authenticated;
revoke all on public.page_translations from anon, authenticated;
revoke all on public.support_messages from anon, authenticated;
revoke all on public.verification_requests from anon, authenticated;

-- ═════ STEP 3 — default privileges (R5) ══════════════════════════════════════════════
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;

-- ═════ STEP 4 — reload PostgREST schema cache ════════════════════════════════════════
notify pgrst, 'reload schema';

commit;
