-- Task 1038: the read-only check after task1038.sql. One statement, no write. Every row must say ok = true; a row that says false names the object the apply did not leave as task1038.sql intends.
-- The behaviour (the database accepts the owner's media address and refuses another owner's) is proved on the real project by src/modules/listings/actions/listingR2Images.integration.test.ts (AC6).
select n, check_name, ok
from (
  select 1 as n, 'the CHECK listing_images_url_prefix_check is validated and accepts the Cloudinary cloud and the media host' as check_name,
         exists (select 1 from pg_constraint k
                 where k.conrelid = 'public.listing_images'::regclass and k.conname = 'listing_images_url_prefix_check' and k.convalidated and k.contype = 'c'
                   and pg_get_constraintdef(k.oid) like '%res.cloudinary.com/die7okukn/%' and pg_get_constraintdef(k.oid) like '%media.lero.al/%') as ok
  union all select 2, 'the trigger function is SECURITY DEFINER with an empty search_path, knows both forms, and is executable by no session',
         exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                 where s.nspname = 'public' and p.proname = 'listing_images_owner_folder' and p.prosecdef
                   and exists (select 1 from unnest(p.proconfig) c where c = 'search_path=""')
                   and position('res\.cloudinary\.com' in p.prosrc) > 0 and position('media\.lero\.al' in p.prosrc) > 0 and position('full\.(webp|jpg)$' in p.prosrc) > 0)
         and not has_function_privilege('authenticated', 'public.listing_images_owner_folder()', 'execute')
         and not has_function_privilege('anon', 'public.listing_images_owner_folder()', 'execute')
  union all select 3, 'the trigger listing_images_owner_folder is BEFORE INSERT OR UPDATE OF url, listing_id, for each row, on listing_images',
         exists (select 1 from pg_trigger t
                 where t.tgrelid = 'public.listing_images'::regclass and t.tgname = 'listing_images_owner_folder' and not t.tgisinternal
                   and (t.tgtype & 1) = 1 and (t.tgtype & 2) = 2 and (t.tgtype & 4) = 4 and (t.tgtype & 16) = 16
                   and (select array_agg(a.attname::text order by a.attname::text) from unnest(t.tgattr) k join pg_attribute a on a.attrelid = t.tgrelid and a.attnum = k) = array['listing_id', 'url'])
  union all select 4, 'every listing_images row on the media host is the full object of its listing owner''s folder',
         (select count(*)
          from public.listing_images i join public.listings l on l.id = i.listing_id
          where starts_with(i.url, 'https://media.lero.al/')
            and i.url !~ ('^https://media\.lero\.al/' || l.user_id::text || '/listings/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/full\.(webp|jpg)$')) = 0
  union all select 5, 'every listing_images row is on this project''s Cloudinary cloud or on the media host',
         (select count(*) from public.listing_images i
          where not (starts_with(i.url, 'https://res.cloudinary.com/die7okukn/') or starts_with(i.url, 'https://media.lero.al/'))) = 0
) checks
order by n;
