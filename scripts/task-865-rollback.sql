-- task-865-rollback.sql
--
-- Task 865 (Sprint 78). Restores the BEFORE state recorded by the 2026-09-30 audit grid
-- (docs/sessions/evidence/task865/10-before-audit.txt):
--   V1: anon held INSERT, UPDATE, DELETE (and SELECT, TRUNCATE, REFERENCES, TRIGGER, which the
--       close script never touched)
--   V2: policy "Anyone can insert a view" - PERMISSIVE, cmd INSERT, roles {public}, qual NULL,
--       with_check true
--
-- THIS RE-OPENS THE ANONYMOUS INSERT PATH. It exists only for the case where
-- scripts/task-865-verify.sql PART (c) or the guest page view fails AFTER the close script.
-- Owner-run in the Supabase SQL Editor. Expected result: "Success. No rows returned".
--
-- Limitation: the original policy carried a Task 270 COMMENT ON POLICY. That comment is
-- not recorded in the audit grid and is not restored.

begin;

drop policy if exists "Anyone can insert a view" on public.listing_views;
create policy "Anyone can insert a view"
  on public.listing_views
  as permissive
  for insert
  to public
  with check (true);

grant insert, update, delete on public.listing_views to anon;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'listing_views'
      and policyname = 'Anyone can insert a view'
      and permissive = 'PERMISSIVE' and cmd = 'INSERT'
      and roles = array['public']::name[] and with_check = 'true'
  ) then
    raise exception 'Task 865 rollback: policy was not restored to its BEFORE definition';
  end if;
  if not (has_table_privilege('anon', 'public.listing_views', 'INSERT')
      and has_table_privilege('anon', 'public.listing_views', 'UPDATE')
      and has_table_privilege('anon', 'public.listing_views', 'DELETE')) then
    raise exception 'Task 865 rollback: anon INSERT/UPDATE/DELETE were not restored';
  end if;
end $$;

notify pgrst, 'reload schema';

commit;
