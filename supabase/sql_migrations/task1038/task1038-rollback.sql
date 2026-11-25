-- Task 1038: the way back from task1038.sql. It restores the Cloudinary-only CHECK and the Cloudinary-only trigger function (the body of task957.sql, character for character).
-- One transaction; run it only after task1038.sql. scripts/quality/db-sql-roundtrip.mjs proves that the catalog after this file equals the one before task1038.sql.
-- It REFUSES (nothing is changed) while any listing_images row is on the media host: the restored CHECK would reject those rows, and deleting or rewriting a person's photo rows is the
-- owner's decision, never this file's. Move or remove those rows first.
begin;

do $$
begin
  if exists (select 1 from public.listing_images i where starts_with(i.url, 'https://media.lero.al/')) then
    raise exception 'task1038 rollback refused: listing_images rows on the media host exist' using errcode = '23514';
  end if;
end
$$;

alter table public.listing_images drop constraint listing_images_url_prefix_check;
alter table public.listing_images add constraint listing_images_url_prefix_check check (starts_with(url, 'https://res.cloudinary.com/die7okukn/')) not valid;
alter table public.listing_images validate constraint listing_images_url_prefix_check;

create or replace function public.listing_images_owner_folder()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_path text;
begin
  select l.user_id into v_owner from public.listings l where l.id = new.listing_id;
  if v_owner is null then
    raise exception 'listing_images: the listing has no owner' using errcode = '42501';
  end if;
  v_path := substring(new.url from '^https://res\.cloudinary\.com/[^/]+/image/upload/(?:v[0-9]+/)?(.*)$');
  if v_path is null
     or position(v_owner::text || '/listings/' in v_path) <> 1
     or v_path = v_owner::text || '/listings/'
     or v_path ~ '(^|/)\.\.?(/|$)'
     or new.url ~* '%2e|%2f|%5c'
     or new.url ~ '[?#]'
     or position(chr(92) in new.url) > 0 then
    raise exception 'listing_images: the photo must lie in the folder of the listing owner' using errcode = '42501';
  end if;
  return new;
end
$$;

commit;
