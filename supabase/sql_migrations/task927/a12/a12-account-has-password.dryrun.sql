-- Task 927 Amendment 12 (R59, owner decision D28): public.account_has_password(uuid), executable by service_role only. NOT APPLIED until the owner runs it.
-- Why: Supabase Auth adds the `email` provider when an account's address changes, so app_metadata.providers cannot tell whether a password is set. The cabinet's
-- re-authentication (src/modules/cabinet/actions/index.ts, accountHasPassword) reads this function instead: true when auth.users holds a password, false when it holds none,
-- no row for an unknown id.
-- OWNER STEPS: (1) run the dry run (the same statements, its last line rollback) in the SQL editor; (2) after a clean dry run, run this file, which commits;
-- (3) after an error run "rollback;" as a separate query and report the error. The rollback is a12-account-has-password-rollback.sql.
-- Additive: nothing that is deployed calls the function. Apply it before the code of Amendment 12 is deployed.
begin;
set local lock_timeout = '10s';
do $$ begin
  if to_regprocedure('public.account_has_password(uuid)') is not null then raise exception 'PREFLIGHT 01: public.account_has_password(uuid) exists already'; end if;
end $$;
create function public.account_has_password(p_user uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(u.encrypted_password, '') <> '' from auth.users u where u.id = p_user
$$;
revoke all on function public.account_has_password(uuid) from public, anon, authenticated;
grant execute on function public.account_has_password(uuid) to service_role;
do $$ begin
  if has_function_privilege('anon', 'public.account_has_password(uuid)', 'execute') then raise exception 'POSTCHECK 01: anon can execute public.account_has_password'; end if;
  if has_function_privilege('authenticated', 'public.account_has_password(uuid)', 'execute') then raise exception 'POSTCHECK 02: authenticated can execute public.account_has_password'; end if;
  if not has_function_privilege('service_role', 'public.account_has_password(uuid)', 'execute') then raise exception 'POSTCHECK 03: service_role cannot execute public.account_has_password'; end if;
  if exists (select 1 from auth.users u where public.account_has_password(u.id) is distinct from (coalesce(u.encrypted_password, '') <> '')) then raise exception 'POSTCHECK 04: the function disagrees with auth.users'; end if;
end $$;
rollback;
