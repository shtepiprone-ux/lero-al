-- Task 957: the read-only check before task957.sql. One statement, no write.
-- Row 1 counts the listing_images rows the trigger listing_images_owner_folder would refuse on an update of their url or listing_id (the same rule as the trigger body of task957.sql); it must be 0
-- (the application count of 2026-11-18 was 0 of 200 rows). Row 2 and row 3 must be 0: nothing task957.sql creates may exist yet.
-- A row with problems > 0 stops the apply; the owner decides what to do with those rows, never the file.
select n, check_name, problems
from (
  select 1 as n, 'listing_images rows whose photo does not lie in the folder of the listing owner (the trigger would refuse them)' as check_name,
         (select count(*)
          from public.listing_images i
          left join public.listings l on l.id = i.listing_id
          where l.user_id is null
             or substring(i.url from '^https://res\.cloudinary\.com/[^/]+/image/upload/(?:v[0-9]+/)?(.*)$') is null
             or position(l.user_id::text || '/listings/' in substring(i.url from '^https://res\.cloudinary\.com/[^/]+/image/upload/(?:v[0-9]+/)?(.*)$')) <> 1
             or substring(i.url from '^https://res\.cloudinary\.com/[^/]+/image/upload/(?:v[0-9]+/)?(.*)$') = l.user_id::text || '/listings/'
             or substring(i.url from '^https://res\.cloudinary\.com/[^/]+/image/upload/(?:v[0-9]+/)?(.*)$') ~ '(^|/)\.\.?(/|$)'
             or i.url ~* '%2e|%2f|%5c'
             or i.url ~ '[?#]'
             or position(chr(92) in i.url) > 0) as problems
  union all select 2, 'objects task957.sql creates that already exist (table, functions)',
         (select count(*) from (
            select 1 from pg_class c join pg_namespace s on s.oid = c.relnamespace where s.nspname = 'public' and c.relname = 'rate_limit_hits'
            union all
            select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'public' and p.proname in ('consume_rate_limit', 'listing_images_owner_folder')
          ) existing)
  union all select 3, 'the trigger listing_images_owner_folder already exists on listing_images',
         (select count(*) from pg_trigger t where t.tgrelid = 'public.listing_images'::regclass and t.tgname = 'listing_images_owner_folder' and not t.tgisinternal)
) checks
order by n;
