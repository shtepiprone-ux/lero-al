-- Task 1038: a listing photo may also be an object of the platform's own media host (Cloudflare R2, https://media.lero.al), next to the Cloudinary photos that stay until Task 1043.
-- Two changes, one transaction, every object schema-qualified. Run task1038-preflight.sql first (every row must say 0); after the apply run task1038-verify.sql (every row ok = true).
-- The way back is task1038-rollback.sql; scripts/quality/db-sql-roundtrip.mjs proves that the catalog after the rollback equals the one before this file.
begin;

-- 1. The CHECK that pinned every photo to this project's Cloudinary cloud also accepts the media host. The rows of the table already satisfy the new, wider condition, so the constraint is
--    added NOT VALID and validated in the next statement (the validation reads every row once and takes no lock that blocks reads).
alter table public.listing_images drop constraint listing_images_url_prefix_check;
alter table public.listing_images add constraint listing_images_url_prefix_check
  check (starts_with(url, 'https://res.cloudinary.com/die7okukn/') or starts_with(url, 'https://media.lero.al/')) not valid;
alter table public.listing_images validate constraint listing_images_url_prefix_check;

-- 2. The twin of src/lib/uploads/imageUrl.ts `isOwnedListingImageUrl` in the database. A Cloudinary photo is judged exactly as before (task957.sql). A photo on the media host is accepted only as
--    `https://media.lero.al/<listings.user_id>/listings/<lower-case uuid>/full.webp` or `full.jpg`: the whole text is matched, so a `.` or `..` segment, an encoded character, a backslash, a
--    query, a fragment, another extension or another object name (`thumb`) cannot match. The owner id is the text of a uuid (hex digits and hyphens), so it is no pattern. Same SECURITY DEFINER,
--    empty search_path and 42501 refusal; the trigger, its grants and its owner are kept by `create or replace`.
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
  if starts_with(new.url, 'https://media.lero.al/') then
    if new.url !~ ('^https://media\.lero\.al/' || v_owner::text || '/listings/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/full\.(webp|jpg)$') then
      raise exception 'listing_images: the photo must lie in the folder of the listing owner' using errcode = '42501';
    end if;
    return new;
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
