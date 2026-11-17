-- Task 956 Part B: the read-only check after v8b.sql. One statement, no write. Every row must say ok = true; a row that says
-- false names the object the apply did not leave as v8b.sql intends. scripts/quality/db-catalog-audit.mjs checks the same
-- invariants from the application side (AC1); this file reads the exact objects.
-- Review 4, F10: an access function (has_column_privilege, ...) is applied only to rows that cannot name another table: the columns of public.users come from pg_attribute of 'public.users'::regclass,
-- never from information_schema.columns (which lists the columns of auth.users and every other table too; the function answered 42703 for a column the table does not have, before the schema filter ran).
select n, check_name, ok
from (
  select 1 as n, 'caller_has_permission is a SECURITY DEFINER function with a pinned search_path' as check_name,
         exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                 where s.nspname = 'public' and p.proname = 'caller_has_permission' and p.prosecdef
                   and exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%')) as ok
  union all select 2, 'caller_has_permission is executable by authenticated and not by anon',
         has_function_privilege('authenticated', 'public.caller_has_permission(text)', 'execute')
         and not has_function_privilege('anon', 'public.caller_has_permission(text)', 'execute')
  union all select 3, 'get_listing_owner_contact(uuid) is executable by neither authenticated nor anon',
         not has_function_privilege('authenticated', 'public.get_listing_owner_contact(uuid)', 'execute')
         and not has_function_privilege('anon', 'public.get_listing_owner_contact(uuid)', 'execute')
  union all select 4, 'no write policy admits a moderator without calling caller_has_permission',
         (select count(*) from pg_policies
          where schemaname = 'public' and permissive = 'PERMISSIVE' and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
            and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) ~ '''moderator''::(user_role|text)'
            and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) !~ 'caller_has_permission\(') = 0
  union all select 5, 'the 36 per-command staff policies exist',
         (select count(*) from pg_policies where schemaname = 'public' and policyname ~ '_staff_(select|insert|update|delete)$') = 36
  union all select 6, 'a session cannot update the ten server-only users columns and can update the other nineteen',
         not exists (select 1 from pg_attribute a
                     where a.attrelid = 'public.users'::regclass and a.attnum > 0 and not a.attisdropped
                       and a.attname = any (array['avatar_url', 'company_id', 'company_logo_url', 'created_at', 'inactivity_warning_sent_at',
                                                  'last_seen_at', 'location_request', 'pending_email', 'public_id', 'social_provider'])
                       and has_column_privilege('authenticated', a.attrelid, a.attnum, 'UPDATE'))
         and (select count(*) from pg_attribute a
              where a.attrelid = 'public.users'::regclass and a.attnum > 0 and not a.attisdropped
                and has_column_privilege('authenticated', a.attrelid, a.attnum, 'UPDATE')) = 19
  union all select 7, 'anon holds no INSERT, UPDATE, DELETE or TRUNCATE on any public table',
         (select count(*) from information_schema.role_table_grants
          where table_schema = 'public' and grantee = 'anon' and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')) = 0
  union all select 8, 'the seven users constraints exist and are validated',
         (select count(*) from pg_constraint
          where conrelid = 'public.users'::regclass and convalidated
            and conname in ('users_name_length_check', 'users_last_name_length_check', 'users_company_name_length_check', 'users_position_length_check',
                            'users_website_check', 'users_phone_e164_check', 'users_whatsapp_e164_check')) = 7
  union all select 9, 'the moderation trigger is a BEFORE UPDATE row trigger on listings',
         exists (select 1 from pg_trigger t where t.tgrelid = 'public.listings'::regclass and t.tgname = 'listings_owner_edit_moderation'
                 and not t.tgisinternal and (t.tgtype & 2) = 2 and (t.tgtype & 16) = 16 and (t.tgtype & 1) = 1)
  union all select 10, 'the public SELECT policy of listings carries the expiry',
         exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'listings' and policyname = 'Listings viewable by everyone'
                 and cmd = 'SELECT' and qual like '%expires_at%' and qual like '%active%')
  union all select 11, 'the avatars bucket is bounded to 2 MB and jpeg, png, webp',
         exists (select 1 from storage.buckets where id = 'avatars' and file_size_limit = 2097152
                 and allowed_mime_types @> array['image/jpeg', 'image/png', 'image/webp'] and cardinality(allowed_mime_types) = 3)
  union all select 12, 'notifications keeps one SELECT and one UPDATE policy of its own',
         (select count(*) from pg_policies where schemaname = 'public' and tablename = 'notifications' and permissive = 'PERMISSIVE' and cmd = 'SELECT') = 1
         and (select count(*) from pg_policies where schemaname = 'public' and tablename = 'notifications' and permissive = 'PERMISSIVE' and cmd = 'UPDATE') = 1
  union all select 13, 'public_user_profiles lists exactly the nine columns the pages read',
         (select string_agg(column_name, ',' order by ordinal_position) from information_schema.columns
          where table_schema = 'public' and table_name = 'public_user_profiles')
         = 'id,name,avatar_url,user_type,is_verified,company_name,deleted_at,has_phone,has_whatsapp'
  -- Review 4, AC15: no session inserts into users (no permissive INSERT policy exists; handle_new_user makes the row), so INSERT is granted to authenticated on no column
  union all select 14, 'a session holds no INSERT privilege on any column of users (the application inserts nothing with a session; handle_new_user makes the row)',
         not exists (select 1 from pg_attribute a
                     where a.attrelid = 'public.users'::regclass and a.attnum > 0 and not a.attisdropped
                       and has_column_privilege('authenticated', a.attrelid, a.attnum, 'INSERT'))
  -- Review 4, F11: the row asks that the rule is IN the body (the stored text, comments included: a comment may say "archived"); it does not ask that a word is missing
  union all select 15, 'record_listing_view carries the one public rule (an active listing until its expiry, a sold or rented one) and is executable by the service role only',
         exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                 where s.nspname = 'public' and p.proname = 'record_listing_view' and p.prosecdef
                   and p.prosrc like '%(status = ''active'' and expires_at > now())%'
                   and p.prosrc like '%status in (''sold'', ''rented'')%')
         and has_function_privilege('service_role', 'public.record_listing_view(uuid,uuid,text)', 'execute')
         and not has_function_privilege('authenticated', 'public.record_listing_view(uuid,uuid,text)', 'execute')
         and not has_function_privilege('anon', 'public.record_listing_view(uuid,uuid,text)', 'execute')
  union all select 16, 'no users.website is left without an https scheme',
         not exists (select 1 from public.users where website is not null and website !~ '^https://')
) checks
order by n;
