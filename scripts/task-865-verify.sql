-- task-865-verify.sql
--
-- Task 865 (Sprint 78). Four verification parts, owner-run in the Supabase SQL Editor, each
-- PART pasted and run ALONE. Parts (a)-(c) run BEFORE and AFTER the close script; part (d)
-- runs once, AFTER, right after one real guest page view on production.
--
-- Parts (a)-(c) end in ONE raised exception whose text starts with TASK865_<PART>; the owner
-- returns that error line. The raise is deliberate: it aborts the transaction, so nothing a
-- part inserts can persist. Part (d) is a read-only select and returns one grid.
--
-- Column set used (from the BEFORE audit V3): listing_id and ip_hash are the only NOT NULL
-- columns without a default. listing_id is the synthetic uuid ...0865, which cannot exist.
--
-- PART (a) anon insert arm.
--   BEFORE: result=refused sqlstate=23503 (the foreign key on listing_id is enforced after the
--           privilege check and the RLS WITH CHECK, so it proves both passed), or result=passed.
--   AFTER:  result=refused sqlstate=42501, msg "permission denied for table listing_views".
-- PART (b) authenticated insert arm.
--   BEFORE: same shape as (a).
--   AFTER:  refused; sqlstate 42501 with a "row-level security" message means the RLS reason,
--           a "permission denied for table" message means the grant reason. Report which.
-- PART (c) RPC arm, role service_role. record_listing_view returns void (measured 2026-09-30:
--   assigning its result to a boolean raised 22P02 on ""), so the proof is the row count only.
--   BEFORE and AFTER: TASK865_C before=<n> after=<n+1>.
-- PART (d) guest page view, read-only. Run AFTER opening one active listing on production in a
--   private window. Expected: a row with that listing's slug, guest = true, viewed within the
--   last 30 minutes.

-- ===== PART (a) =========================================================================
begin;
set local role anon;
do $$
declare
  v_result text := 'passed';
  v_sqlstate text := '00000';
  v_msg text := 'inserted';
begin
  begin
    insert into public.listing_views (listing_id, ip_hash)
    values ('00000000-0000-0000-0000-000000000865', 'task865-probe');
  exception when others then
    v_result := 'refused';
    v_sqlstate := sqlstate;
    v_msg := sqlerrm;
  end;
  raise exception 'TASK865_A result=% sqlstate=% msg=%', v_result, v_sqlstate, v_msg;
end $$;
rollback;

-- ===== PART (b) =========================================================================
begin;
set local role authenticated;
do $$
declare
  v_result text := 'passed';
  v_sqlstate text := '00000';
  v_msg text := 'inserted';
begin
  begin
    insert into public.listing_views (listing_id, ip_hash)
    values ('00000000-0000-0000-0000-000000000865', 'task865-probe');
  exception when others then
    v_result := 'refused';
    v_sqlstate := sqlstate;
    v_msg := sqlerrm;
  end;
  raise exception 'TASK865_B result=% sqlstate=% msg=%', v_result, v_sqlstate, v_msg;
end $$;
rollback;

-- ===== PART (c) =========================================================================
begin;
set local role service_role;
do $$
declare
  v_listing uuid;
  v_before bigint;
  v_after bigint;
begin
  select id into v_listing from public.listings where status = 'active' limit 1;
  if v_listing is null then
    raise exception 'TASK865_C no active listing found';
  end if;
  select count(*) into v_before from public.listing_views where listing_id = v_listing;
  perform public.record_listing_view(v_listing, null, 'task865-probe');
  select count(*) into v_after from public.listing_views where listing_id = v_listing;
  raise exception 'TASK865_C before=% after=%', v_before, v_after;
end $$;
rollback;

-- ===== PART (d) =========================================================================
-- Read-only. Run AFTER the close script, right after one real guest page view on production.
select l.slug, v.viewed_at, (v.user_id is null) as guest
from public.listing_views v
join public.listings l on l.id = v.listing_id
where v.viewed_at > now() - interval '30 minutes'
order by v.viewed_at desc
limit 10;
