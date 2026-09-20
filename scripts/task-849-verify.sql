-- Task 849 (Sprint 78): owner-run verification of listing_activity_daily (AC2, AC3, AC7).
--
-- OWNER RUN: Supabase Dashboard → SQL Editor, AFTER task-849-listing-activity-daily.sql and
-- task-849-backfill.sql. Run each PART SEPARATELY (select just that part and run it) — the editor
-- shows only the last result grid of a run — and return each grid.
--
-- Part (a) rewrites YESTERDAY's rows with job_version '849.1-verify'; the next hourly run restores
-- '849.1'. It changes no counts.

-- ═════ PART (a) — idempotency: the recompute run twice gives identical table contents ═════════════
-- Expected: two rows, run 1 and run 2, with identical row_count, views, clicks and inquiries.

drop table if exists pg_temp.t849_idempotency;
create temp table t849_idempotency (
  run          integer,
  row_count    bigint,
  views        bigint,
  clicks       bigint,
  inquiries    bigint
);

do $$
declare
  v_yesterday date := (now() at time zone 'Europe/Tirane')::date - 1;
  v_run       integer;
begin
  for v_run in 1..2 loop
    perform public.recompute_listing_activity(v_yesterday, v_yesterday, '849.1-verify');
    insert into t849_idempotency
    select v_run,
           count(*),
           coalesce(sum(recorded_views), 0),
           coalesce(sum(whatsapp_clicks), 0),
           coalesce(sum(listing_inquiry_submissions), 0)
    from public.listing_activity_daily
    where metric_date = v_yesterday;
  end loop;
end;
$$;

select run, row_count, views, clicks, inquiries from t849_idempotency order by run;

-- ═════ PART (b) — the aggregate equals the raw tables for yesterday (same Tirane cut) ══════════════
-- Expected: agg_* = raw_* on every line and the three `matches` columns true.

with bounds as (
  select ((now() at time zone 'Europe/Tirane')::date - 1) as d
),
agg as (
  select coalesce(sum(a.recorded_views), 0)              as views,
         coalesce(sum(a.whatsapp_clicks), 0)             as clicks,
         coalesce(sum(a.listing_inquiry_submissions), 0) as inquiries
  from public.listing_activity_daily a, bounds b
  where a.metric_date = b.d
),
raw as (
  select
    (select count(*) from public.listing_views lv, bounds b
      where (lv.viewed_at at time zone 'Europe/Tirane')::date = b.d
        and exists (select 1 from public.listings l where l.id = lv.listing_id)) as views,
    (select count(*) from public.listing_contact_events ce, bounds b
      where ce.channel = 'whatsapp' and ce.is_owner_click = false
        and (ce.created_at at time zone 'Europe/Tirane')::date = b.d
        and exists (select 1 from public.listings l where l.id = ce.listing_id)) as clicks,
    (select count(*) from public.listing_inquiries li, bounds b
      where (li.created_at at time zone 'Europe/Tirane')::date = b.d
        and exists (select 1 from public.listings l where l.id = li.listing_id)) as inquiries
)
select (select d from bounds)           as metric_date,
       agg.views     as agg_views,     raw.views     as raw_views,     agg.views     = raw.views     as views_match,
       agg.clicks    as agg_clicks,    raw.clicks    as raw_clicks,    agg.clicks    = raw.clicks    as clicks_match,
       agg.inquiries as agg_inquiries, raw.inquiries as raw_inquiries, agg.inquiries = raw.inquiries as inquiries_match
from agg, raw;

-- ═════ PART (c) — no client access ═════════════════════════════════════════════════════════════════
-- Expected: every column false except service_role_select, which is true.

select
  has_table_privilege('anon',          'public.listing_activity_daily',   'select') as anon_select_daily,
  has_table_privilege('authenticated', 'public.listing_activity_daily',   'select') as authenticated_select_daily,
  has_table_privilege('anon',          'public.listing_activity_refresh', 'select') as anon_select_refresh,
  has_table_privilege('authenticated', 'public.listing_activity_refresh', 'select') as authenticated_select_refresh,
  has_function_privilege('authenticated', 'public.recompute_listing_activity(date, date, text)', 'execute') as authenticated_exec_recompute,
  has_function_privilege('anon',          'public.listing_activity_platform_series(date, date)', 'execute') as anon_exec_platform_series,
  has_table_privilege('service_role',  'public.listing_activity_daily',   'select') as service_role_select,
  (select relrowsecurity from pg_class where oid = 'public.listing_activity_daily'::regclass)   as rls_daily,
  (select relrowsecurity from pg_class where oid = 'public.listing_activity_refresh'::regclass) as rls_refresh;

-- ═════ PART (d) — the latest refresh rows ══════════════════════════════════════════════════════════
-- After the first scheduled run, expect a 'success' row with job_version '849.1' at the top.

select id, ran_at, from_date, to_date, status, rows_written, job_version, error
from public.listing_activity_refresh
order by id desc
limit 3;
