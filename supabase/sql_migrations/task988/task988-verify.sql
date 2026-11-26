-- Task 988: the read-only check after task988.sql. One statement, no write. Every row must say ok = true; a row that says false names what the apply did not leave as task988.sql intends.
select n, check_name, ok
from (
  select 1 as n, 'handle_new_user inserts preferred_locale, taken from the metadata only when it is sq, en, uk or it, else sq' as check_name,
         exists (select 1 from pg_proc p where p.oid = 'public.handle_new_user()'::regprocedure
                   and p.prosrc like '%v_locale text := new.raw_user_meta_data->>''preferred_locale'';%'
                   and p.prosrc like '%if v_locale is null or v_locale not in (''sq'', ''en'', ''uk'', ''it'') then v_locale := ''sq''; end if;%'
                   and p.prosrc like '%insert into public.users (id, name, phone, avatar_url, role, user_type, is_verified, created_at, preferred_locale)%'
                   and p.prosrc not ilike '%execute %') as ok
  union all select 2, 'handle_new_user is SECURITY DEFINER, owned by postgres, with search_path public, pg_temp',
         exists (select 1 from pg_proc p join pg_roles r on r.oid = p.proowner
                 where p.oid = 'public.handle_new_user()'::regprocedure and p.prosecdef and r.rolname = 'postgres' and p.proconfig = array['search_path=public, pg_temp'])
  union all select 3, 'handle_new_user is executable by postgres and service_role only, as before the apply',
         (select p.proacl::text from pg_proc p where p.oid = 'public.handle_new_user()'::regprocedure) = '{postgres=X/postgres,service_role=X/postgres}'
  union all select 4, 'the trigger on_auth_user_created of auth.users still runs it',
         exists (select 1 from pg_trigger t where t.tgname = 'on_auth_user_created' and t.tgrelid = 'auth.users'::regclass and t.tgfoid = 'public.handle_new_user()'::regprocedure)
) checks
order by n;
