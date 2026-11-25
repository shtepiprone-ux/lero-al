-- Task 1038: the read-only check before task1038.sql. One statement, no write.
-- Every row must say problems = 0. A row with problems > 0 stops the apply; the owner decides what to do, never the file.
--   1 the CHECK listing_images_url_prefix_check is the one task923 v8a created (this project's Cloudinary cloud only), so task1038.sql replaces what it expects to replace
--   2 the trigger function listing_images_owner_folder is the one task957.sql created (it knows the Cloudinary form only), so `create or replace` replaces what it expects to replace
--   3 the trigger listing_images_owner_folder exists on listing_images exactly once
--   4 no listing_images row is on the media host yet (the first one comes with the application of this task)
select n, check_name, problems
from (
  select 1 as n, 'the CHECK listing_images_url_prefix_check is not the Cloudinary-only condition task923 created' as check_name,
         (select case when count(*) = 1 then 0 else 1 end
          from pg_constraint k
          where k.conrelid = 'public.listing_images'::regclass and k.conname = 'listing_images_url_prefix_check' and k.convalidated
            and pg_get_constraintdef(k.oid) like '%res.cloudinary.com/die7okukn/%' and pg_get_constraintdef(k.oid) not like '%media.lero.al%') as problems
  union all select 2, 'the trigger function listing_images_owner_folder is not the Cloudinary-only function task957.sql created',
         (select case when count(*) = 1 then 0 else 1 end
          from pg_proc p join pg_namespace s on s.oid = p.pronamespace
          where s.nspname = 'public' and p.proname = 'listing_images_owner_folder' and p.prosecdef
            and position('res\.cloudinary\.com' in p.prosrc) > 0 and position('media' in p.prosrc) = 0)
  union all select 3, 'the trigger listing_images_owner_folder is missing from listing_images, or exists more than once',
         (select case when count(*) = 1 then 0 else 1 end
          from pg_trigger t where t.tgrelid = 'public.listing_images'::regclass and t.tgname = 'listing_images_owner_folder' and not t.tgisinternal)
  union all select 4, 'listing_images rows already on the media host',
         (select count(*) from public.listing_images i where starts_with(i.url, 'https://media.lero.al/'))
) checks
order by n;
