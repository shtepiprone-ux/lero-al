-- Task 957: the read-only check after task957.sql. One statement, no write. Every row must say ok = true; a row that says false names the object the apply did not leave as task957.sql intends.
-- scripts/quality/db-catalog-audit.mjs checks the same invariants from the application side (AC9: no I1, no I3); this file reads the exact objects.
select n, check_name, ok
from (
  select 1 as n, 'rate_limit_hits exists with row level security on and no policy' as check_name,
         exists (select 1 from pg_class c join pg_namespace s on s.oid = c.relnamespace where s.nspname = 'public' and c.relname = 'rate_limit_hits' and c.relrowsecurity)
         and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'rate_limit_hits') as ok
  union all select 2, 'anon and authenticated hold no privilege on rate_limit_hits',
         not exists (select 1 from information_schema.role_table_grants where table_schema = 'public' and table_name = 'rate_limit_hits' and grantee in ('anon', 'authenticated', 'PUBLIC'))
  union all select 3, 'the index (bucket, subject, hit_at) exists',
         exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'rate_limit_hits' and indexdef like '%(bucket, subject, hit_at)%')
  union all select 4, 'consume_rate_limit is SECURITY DEFINER with an empty search_path and is executable by the service role only',
         exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                 where s.nspname = 'public' and p.proname = 'consume_rate_limit' and p.prosecdef
                   and exists (select 1 from unnest(p.proconfig) c where c = 'search_path=""'))
         and has_function_privilege('service_role', 'public.consume_rate_limit(text,text,integer,integer)', 'execute')
         and not has_function_privilege('authenticated', 'public.consume_rate_limit(text,text,integer,integer)', 'execute')
         and not has_function_privilege('anon', 'public.consume_rate_limit(text,text,integer,integer)', 'execute')
  union all select 5, 'consume_rate_limit takes the advisory lock and has no dynamic SQL',
         exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                 where s.nspname = 'public' and p.proname = 'consume_rate_limit'
                   and p.prosrc like '%pg_advisory_xact_lock%' and p.prosrc not ilike '%execute %')
  union all select 6, 'the trigger listing_images_owner_folder is BEFORE INSERT OR UPDATE OF url, listing_id, for each row, on listing_images',
         exists (select 1 from pg_trigger t
                 where t.tgrelid = 'public.listing_images'::regclass and t.tgname = 'listing_images_owner_folder' and not t.tgisinternal
                   and (t.tgtype & 1) = 1 and (t.tgtype & 2) = 2 and (t.tgtype & 4) = 4 and (t.tgtype & 16) = 16
                   and (select array_agg(a.attname::text order by a.attname::text) from unnest(t.tgattr) k join pg_attribute a on a.attrelid = t.tgrelid and a.attnum = k) = array['listing_id', 'url'])
  union all select 7, 'the trigger function is SECURITY DEFINER with an empty search_path and executable by no session',
         exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                 where s.nspname = 'public' and p.proname = 'listing_images_owner_folder' and p.prosecdef
                   and exists (select 1 from unnest(p.proconfig) c where c = 'search_path=""'))
         and not has_function_privilege('authenticated', 'public.listing_images_owner_folder()', 'execute')
         and not has_function_privilege('anon', 'public.listing_images_owner_folder()', 'execute')
  union all select 8, 'no listing_images row lies outside its listing owner''s folder',
         (select count(*)
          from public.listing_images i join public.listings l on l.id = i.listing_id
          where coalesce(position(l.user_id::text || '/listings/' in substring(i.url from '^https://res\.cloudinary\.com/[^/]+/image/upload/(?:v[0-9]+/)?(.*)$')), 0) <> 1) = 0
) checks
order by n;
