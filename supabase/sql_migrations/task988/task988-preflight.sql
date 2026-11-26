-- Task 988: the read-only check before task988.sql. One statement, no write. A row with problems > 0 stops the apply; the owner decides what to do, never the file.
-- Row 1: the live body of public.handle_new_user() is the one task988.sql was written from (task962/v8b2.sql, read with pg_get_functiondef on 2026-11-26). The body is compared
--        without carriage returns: the live body holds CRLF line ends (it was applied from a CRLF copy), md5 42fe8e54db54989f86f59238970714a5 as stored, 044f90e7a3567158387756dab752e21e without them.
-- Row 2: the function is SECURITY DEFINER, owned by postgres, with the search path public, pg_temp (create or replace keeps owner and grants; the apply keeps the attributes).
-- Row 3: the trigger on_auth_user_created of auth.users runs it.
-- Row 4: public.users.preferred_locale exists, is not null, and its check allows exactly sq, en, uk and it (the value the function inserts is always one of them).
select n, check_name, problems
from (
  select 1 as n, 'the live body of public.handle_new_user() is not the one task988.sql replaces' as check_name,
         (select count(*) from pg_proc p where p.oid = 'public.handle_new_user()'::regprocedure and md5(replace(p.prosrc, E'\r', '')) <> '044f90e7a3567158387756dab752e21e') as problems
  union all select 2, 'public.handle_new_user() is not security definer, owned by postgres, with search_path public, pg_temp',
         (select count(*) from pg_proc p join pg_roles r on r.oid = p.proowner
          where p.oid = 'public.handle_new_user()'::regprocedure
            and not (p.prosecdef and r.rolname = 'postgres' and p.proconfig = array['search_path=public, pg_temp']))
  union all select 3, 'the trigger on_auth_user_created of auth.users does not run public.handle_new_user()',
         1 - (select count(*) from pg_trigger t where t.tgname = 'on_auth_user_created' and t.tgrelid = 'auth.users'::regclass and t.tgfoid = 'public.handle_new_user()'::regprocedure)
  union all select 4, 'public.users.preferred_locale is missing, nullable, or its check is not sq|en|uk|it',
         1 - (select count(*) from information_schema.columns c
              where c.table_schema = 'public' and c.table_name = 'users' and c.column_name = 'preferred_locale' and c.is_nullable = 'NO'
                and exists (select 1 from pg_constraint k where k.conrelid = 'public.users'::regclass and k.conname = 'users_preferred_locale_check'
                              and pg_get_constraintdef(k.oid) = 'CHECK ((preferred_locale = ANY (ARRAY[''sq''::text, ''en''::text, ''uk''::text, ''it''::text])))'))
) checks
order by n;
