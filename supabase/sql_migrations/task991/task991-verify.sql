-- Task 991: the read-only check after task991.sql. One statement, no write. Every row must say ok = true; a row that says false names the object the apply did not leave as task991.sql intends.
-- scripts/quality/db-catalog-audit.mjs checks the same invariants from the application side (AC5: no function executable by anon or authenticated, none without a pinned search_path).
select n, check_name, ok
from (
  select 1 as n, 'auth_password_matches is SECURITY DEFINER with an empty search_path' as check_name,
         exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                 where s.nspname = 'public' and p.proname = 'auth_password_matches' and p.prosecdef
                   and exists (select 1 from unnest(p.proconfig) c where c = 'search_path=""')) as ok
  union all select 2, 'auth_password_matches is executable by the service role only',
         has_function_privilege('service_role', 'public.auth_password_matches(text,text)', 'execute')
         and not has_function_privilege('authenticated', 'public.auth_password_matches(text,text)', 'execute')
         and not has_function_privilege('anon', 'public.auth_password_matches(text,text)', 'execute')
  union all select 3, 'auth_password_matches builds no dynamic SQL and raises nothing',
         exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                 where s.nspname = 'public' and p.proname = 'auth_password_matches'
                   and p.prosrc not ilike '%execute %' and p.prosrc not ilike '%raise %')
  union all select 4, 'the two sq templates exist, are active and list their placeholders',
         (select count(*) from public.email_templates t
          where t.locale = 'sq' and t.is_active
            and ((t.key = 'account_exists' and t.variables = '["signInUrl"]'::jsonb)
              or (t.key = 'account_blocked' and t.variables = '["supportUrl", "untilText"]'::jsonb))) = 2
  union all select 5, 'every placeholder used in a template body is listed in its variables',
         not exists (select 1 from public.email_templates t, regexp_matches(t.html_body || ' ' || t.subject, '\{\{(\w+)\}\}', 'g') as m
                     where t.key in ('account_exists', 'account_blocked') and t.locale = 'sq' and not (t.variables ? m[1]))
  union all select 6, 'account_status_by_email is SECURITY DEFINER with an empty search_path (Revision 1, F1)',
         exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                 where s.nspname = 'public' and p.proname = 'account_status_by_email' and p.prosecdef
                   and exists (select 1 from unnest(p.proconfig) c where c = 'search_path=""'))
  union all select 7, 'account_status_by_email is executable by the service role only (Revision 1, F1)',
         has_function_privilege('service_role', 'public.account_status_by_email(text)', 'execute')
         and not has_function_privilege('authenticated', 'public.account_status_by_email(text)', 'execute')
         and not has_function_privilege('anon', 'public.account_status_by_email(text)', 'execute')
) checks
order by n;
