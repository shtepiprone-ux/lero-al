-- Task 849 (Sprint 78): listing_activity_daily — an idempotent per-day aggregate of views, WhatsApp
-- clicks and form inquiries, keyed by Europe/Tirane date, plus its refresh log and read functions.
--
-- OWNER APPLY: paste this whole file into Supabase Dashboard → SQL Editor and run it ONCE, before the
-- Task 849 deploy. Every statement is idempotent (`if not exists` / `create or replace` / re-runnable
-- grants), so running it again is safe. Then run scripts/task-849-backfill.sql, then
-- scripts/task-849-verify.sql (owner action O78-3).
--
-- ROLLBACK (drops the aggregate and its history; nothing else reads it):
--   drop function if exists public.listing_activity_owner_by_listing(uuid, date, date);
--   drop function if exists public.listing_activity_owner_series(uuid, date, date);
--   drop function if exists public.listing_activity_platform_series(date, date);
--   drop function if exists public.recompute_listing_activity(date, date, text);
--   drop table if exists public.listing_activity_refresh;
--   drop table if exists public.listing_activity_daily;
--
-- Access model: service role only. Both tables have RLS enabled and NO policy, and every grant to
-- anon / authenticated is revoked (rls-rules.md → Public Schema GRANT Discipline, Task 277/289). The
-- dashboards read through server-only helpers on the admin client, never from the browser.
--
-- Sources counted (spec v3.3 §9.1) — the aggregate never reads listings.views_count (lifetime only):
--   recorded_views              = listing_views rows by viewed_at (already dedup/bot/owner-filtered
--                                 before insert by record_listing_view)
--   whatsapp_clicks             = listing_contact_events, channel = 'whatsapp' AND is_owner_click = false
--   listing_inquiry_submissions = listing_inquiries rows by created_at (email success is irrelevant)
-- A day is a Europe/Tirane calendar day: (ts AT TIME ZONE 'Europe/Tirane')::date.

-- ── Tables ───────────────────────────────────────────────────────────────────────────────────────

create table if not exists public.listing_activity_daily (
  listing_id                  uuid         not null references public.listings(id) on delete cascade,
  metric_date                 date         not null,
  recorded_views              integer      not null default 0 check (recorded_views >= 0),
  whatsapp_clicks             integer      not null default 0 check (whatsapp_clicks >= 0),
  listing_inquiry_submissions integer      not null default 0 check (listing_inquiry_submissions >= 0),
  updated_at                  timestamptz  not null default now(),
  job_version                 text         not null,
  primary key (listing_id, metric_date)
);

create index if not exists listing_activity_daily_metric_date_idx
  on public.listing_activity_daily (metric_date);

create table if not exists public.listing_activity_refresh (
  id           bigserial    primary key,
  ran_at       timestamptz  not null default now(),
  from_date    date         not null,
  to_date      date         not null,
  status       text         not null check (status in ('success', 'failure')),
  rows_written integer,
  job_version  text         not null,
  error        text
);

-- Freshness reads "the latest successful refresh".
create index if not exists listing_activity_refresh_status_ran_at_idx
  on public.listing_activity_refresh (status, ran_at desc);

-- ── RLS + grants: service role only ──────────────────────────────────────────────────────────────
-- No policy is created on purpose: with RLS enabled and no policy, anon/authenticated see nothing
-- even if a grant were added later (Advisor 0008 acknowledged — the same locked-down pattern as
-- email_change_tokens).

alter table public.listing_activity_daily   enable row level security;
alter table public.listing_activity_refresh enable row level security;

revoke all on public.listing_activity_daily   from anon, authenticated;
revoke all on public.listing_activity_refresh from anon, authenticated;

grant select, insert, update, delete on public.listing_activity_daily   to service_role;
grant select, insert, update, delete on public.listing_activity_refresh to service_role;

-- bigserial owns a sequence: inserting a refresh row needs USAGE on it.
revoke all on sequence public.listing_activity_refresh_id_seq from anon, authenticated;
grant usage, select on sequence public.listing_activity_refresh_id_seq to service_role;

-- ── recompute_listing_activity ───────────────────────────────────────────────────────────────────
-- Idempotent "recompute day", never an increment: for the range it DELETES the existing rows and
-- INSERTS the counts from the three raw tables, in one transaction, so a run once, twice or after a
-- missed run leaves identical rows. A listing with only one kind of event still gets a row (the key set
-- is the union of the three sources).
--
-- Vercel documents that cron delivery is best effort and can duplicate or overlap, so the function
-- takes a transaction-scoped advisory lock: two overlapping invocations serialize instead of
-- interleaving their delete+insert. The lock key 849000001 is an arbitrary 64-bit integer chosen for
-- Task 849; nothing else in the schema uses it. It is released automatically at transaction end.
--
-- security invoker: it runs with the caller's rights, and only service_role may execute it. Returns the
-- number of rows written.

create or replace function public.recompute_listing_activity(
  p_from        date,
  p_to          date,
  p_job_version text
)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_start timestamptz;
  v_end   timestamptz;
  v_rows  integer;
begin
  if p_from is null or p_to is null or p_job_version is null then
    raise exception 'recompute_listing_activity: p_from, p_to and p_job_version are required';
  end if;
  if p_to < p_from then
    raise exception 'recompute_listing_activity: p_to (%) is before p_from (%)', p_to, p_from;
  end if;
  if (p_to - p_from) + 1 > 400 then
    raise exception 'recompute_listing_activity: span of % days exceeds the 400-day maximum',
      (p_to - p_from) + 1;
  end if;

  perform pg_advisory_xact_lock(849000001);

  -- Half-open UTC bounds of the Tirane days [p_from, p_to]: local midnight → instant.
  v_start := p_from::timestamp at time zone 'Europe/Tirane';
  v_end   := (p_to + 1)::timestamp at time zone 'Europe/Tirane';

  delete from public.listing_activity_daily
  where metric_date between p_from and p_to;

  with views as (
    select lv.listing_id,
           (lv.viewed_at at time zone 'Europe/Tirane')::date as metric_date,
           count(*)::integer as n
    from public.listing_views lv
    where lv.viewed_at >= v_start and lv.viewed_at < v_end
    group by 1, 2
  ),
  clicks as (
    select ce.listing_id,
           (ce.created_at at time zone 'Europe/Tirane')::date as metric_date,
           count(*)::integer as n
    from public.listing_contact_events ce
    where ce.channel = 'whatsapp'
      and ce.is_owner_click = false
      and ce.created_at >= v_start and ce.created_at < v_end
    group by 1, 2
  ),
  inquiries as (
    select li.listing_id,
           (li.created_at at time zone 'Europe/Tirane')::date as metric_date,
           count(*)::integer as n
    from public.listing_inquiries li
    where li.created_at >= v_start and li.created_at < v_end
    group by 1, 2
  ),
  keys as (
    select listing_id, metric_date from views
    union
    select listing_id, metric_date from clicks
    union
    select listing_id, metric_date from inquiries
  )
  insert into public.listing_activity_daily (
    listing_id, metric_date, recorded_views, whatsapp_clicks, listing_inquiry_submissions,
    updated_at, job_version
  )
  select k.listing_id,
         k.metric_date,
         coalesce(v.n, 0),
         coalesce(c.n, 0),
         coalesce(i.n, 0),
         now(),
         p_job_version
  from keys k
  join public.listings l on l.id = k.listing_id
  left join views     v on v.listing_id = k.listing_id and v.metric_date = k.metric_date
  left join clicks    c on c.listing_id = k.listing_id and c.metric_date = k.metric_date
  left join inquiries i on i.listing_id = k.listing_id and i.metric_date = k.metric_date;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke execute on function public.recompute_listing_activity(date, date, text) from public, anon, authenticated;
grant  execute on function public.recompute_listing_activity(date, date, text) to service_role;

-- ── Read functions (service role only) ───────────────────────────────────────────────────────────
-- One row per DATE of the range, zero days included (generate_series), so a caller can tell "0 events"
-- from "no data" by whether the call itself succeeded.

create or replace function public.listing_activity_platform_series(p_from date, p_to date)
returns table (
  metric_date                 date,
  recorded_views              integer,
  whatsapp_clicks             integer,
  listing_inquiry_submissions integer
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select d::date                                          as metric_date,
         coalesce(sum(a.recorded_views), 0)::integer              as recorded_views,
         coalesce(sum(a.whatsapp_clicks), 0)::integer             as whatsapp_clicks,
         coalesce(sum(a.listing_inquiry_submissions), 0)::integer as listing_inquiry_submissions
  from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') as d
  left join public.listing_activity_daily a on a.metric_date = d::date
  group by d
  order by d;
$$;

revoke execute on function public.listing_activity_platform_series(date, date) from public, anon, authenticated;
grant  execute on function public.listing_activity_platform_series(date, date) to service_role;

create or replace function public.listing_activity_owner_series(p_owner uuid, p_from date, p_to date)
returns table (
  metric_date                 date,
  recorded_views              integer,
  whatsapp_clicks             integer,
  listing_inquiry_submissions integer
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select d::date                                          as metric_date,
         coalesce(sum(a.recorded_views), 0)::integer              as recorded_views,
         coalesce(sum(a.whatsapp_clicks), 0)::integer             as whatsapp_clicks,
         coalesce(sum(a.listing_inquiry_submissions), 0)::integer as listing_inquiry_submissions
  from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') as d
  left join (
    select ad.metric_date, ad.recorded_views, ad.whatsapp_clicks, ad.listing_inquiry_submissions
    from public.listing_activity_daily ad
    join public.listings l on l.id = ad.listing_id
    where l.user_id = p_owner
  ) a on a.metric_date = d::date
  group by d
  order by d;
$$;

revoke execute on function public.listing_activity_owner_series(uuid, date, date) from public, anon, authenticated;
grant  execute on function public.listing_activity_owner_series(uuid, date, date) to service_role;

create or replace function public.listing_activity_owner_by_listing(p_owner uuid, p_from date, p_to date)
returns table (
  listing_id                  uuid,
  recorded_views              integer,
  whatsapp_clicks             integer,
  listing_inquiry_submissions integer,
  last_activity_date          date
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select ad.listing_id,
         sum(ad.recorded_views)::integer              as recorded_views,
         sum(ad.whatsapp_clicks)::integer             as whatsapp_clicks,
         sum(ad.listing_inquiry_submissions)::integer as listing_inquiry_submissions,
         max(ad.metric_date)                          as last_activity_date
  from public.listing_activity_daily ad
  join public.listings l on l.id = ad.listing_id
  where l.user_id = p_owner
    and ad.metric_date between p_from and p_to
  group by ad.listing_id
  having sum(ad.recorded_views) + sum(ad.whatsapp_clicks) + sum(ad.listing_inquiry_submissions) > 0;
$$;

revoke execute on function public.listing_activity_owner_by_listing(uuid, date, date) from public, anon, authenticated;
grant  execute on function public.listing_activity_owner_by_listing(uuid, date, date) to service_role;

notify pgrst, 'reload schema';
