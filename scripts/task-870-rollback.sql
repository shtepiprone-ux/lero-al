-- task-870-rollback.sql
--
-- Task 870 (Sprint 80). Owner-applied ONLY on breakage after
-- scripts/task-870-harden-privileges.sql — e.g. a legitimate consumer of one of the 18 R
-- tables was missed by this task's static census and starts failing after the harden
-- script runs. Re-grants ALL privileges on exactly the 18 R tables to anon/authenticated
-- (a coarse break-glass restore, not a precise per-privilege replay) and restores exactly
-- the three default-privilege entries F17 measured (truncate, references, trigger on
-- tables; update on sequences), for role postgres in schema public.
--
-- THIS SCRIPT NEVER RE-GRANTS ANY PRIVILEGE ON PUBLIC.PUBLIC_USER_PROFILES BEYOND R2's
-- (SELECT to authenticated, SELECT to service_role). PUBLIC_USER_PROFILES IS NOT NAMED
-- BELOW ON PURPOSE — RE-OPENING ANON/AUTHENTICATED WRITE ACCESS TO IT REOPENS THE HOLE
-- THIS TASK CLOSED (F1-F2: an anon PATCH through the auto-updatable non-invoker view
-- writes to public.users as the view's postgres owner, who bypasses RLS).

begin;

grant all on public.email_change_tokens to anon, authenticated;
grant all on public.user_status_history to anon, authenticated;
grant all on public.user_change_log to anon, authenticated;
grant all on public.agent_reviews to anon, authenticated;
grant all on public.amenities to anon, authenticated;
grant all on public.amenity_translations to anon, authenticated;
grant all on public.conversations to anon, authenticated;
grant all on public.currency_rates to anon, authenticated;
grant all on public.history_clear_events to anon, authenticated;
grant all on public.languages to anon, authenticated;
grant all on public.listing_amenities to anon, authenticated;
grant all on public.listing_translations to anon, authenticated;
grant all on public.location_translations to anon, authenticated;
grant all on public.messages to anon, authenticated;
grant all on public.notification_settings to anon, authenticated;
grant all on public.page_translations to anon, authenticated;
grant all on public.support_messages to anon, authenticated;
grant all on public.verification_requests to anon, authenticated;

alter default privileges for role postgres in schema public grant truncate, references, trigger on tables to anon, authenticated;
alter default privileges for role postgres in schema public grant update on sequences to anon, authenticated;

notify pgrst, 'reload schema';

commit;
