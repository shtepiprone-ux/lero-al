-- Task 849 (Sprint 78): one-time backfill of listing_activity_daily — the last 180 Europe/Tirane days
-- ending today, recomputed in six 30-day chunks.
--
-- OWNER APPLY: run AFTER scripts/task-849-listing-activity-daily.sql, in Supabase Dashboard → SQL
-- Editor. It is idempotent — public.recompute_listing_activity deletes and rewrites its range, so
-- re-running (or running with another window) is safe. The hourly cron keeps only yesterday + today
-- fresh; older days stay exactly as this backfill left them.
--
-- WHY 180 DAYS: 90 is the longest custom range a dashboard may select (spec v3.3 §4) and its previous
-- equal period needs 90 more. INFERENCE, reversible: change v_days below to widen or narrow it.
--
-- Each chunk writes one 'success' row to public.listing_activity_refresh with job_version
-- '849.1-backfill'. A DO block is one transaction: if any chunk raises, the whole backfill rolls back
-- (no partial state, no failure row) — fix the error and run it again. If the SQL Editor's statement
-- timeout is hit on a large table, lower v_chunk_days and run again.
--
-- The final statement returns the refresh rows this run wrote (expect one 'success' row per chunk).

do $$
declare
  v_job_version text    := '849.1-backfill';
  v_days        integer := 180;
  v_chunk_days  integer := 30;
  v_today       date    := (now() at time zone 'Europe/Tirane')::date;
  v_start       date;
  v_from        date;
  v_to          date;
  v_rows        integer;
begin
  v_start := v_today - (v_days - 1);
  v_from  := v_start;

  while v_from <= v_today loop
    v_to := least(v_from + (v_chunk_days - 1), v_today);
    v_rows := public.recompute_listing_activity(v_from, v_to, v_job_version);

    insert into public.listing_activity_refresh (from_date, to_date, status, rows_written, job_version)
    values (v_from, v_to, 'success', v_rows, v_job_version);

    v_from := v_to + 1;
  end loop;
end;
$$;

select id, ran_at, from_date, to_date, status, rows_written, job_version
from public.listing_activity_refresh
where job_version = '849.1-backfill'
order by id desc
limit 6;
