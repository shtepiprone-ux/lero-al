-- Task 962, hardening v8b part 2: the five database rules the code already relies on, the sign-up trigger's avatar line, one data step and one dropped table. Written against the
-- live catalog read on 2026-11-23 (read-only: pg_get_functiondef of public.handle_new_user, the columns, defaults and grants of public.exchange_providers). One transaction; every object is schema-qualified.
-- Run v8b2-preflight.sql first (read-only): rows 1 to 8 must count 0 problems. The way back is v8b2-rollback.sql; the proof of both is scripts/quality/db-sql-roundtrip.mjs.
-- Owner decisions: O962-1 (the avatar address lies on the project Cloudinary or on https://lh3.googleusercontent.com/; the logo on the project Cloudinary only), O962-2 (user 37's logo that is not an
-- https address is cleared), D71 (price ceilings EUR 10 000 000 000 and ALL 1 000 000 000 000), D53 / R84 (the photos of an active listing change only through moderation), R78 (a) (exchange_providers goes).
begin;

-- 1. O962-2: the company logo of user 37 is not an https address (live value on 2026-11-23: an empty string). The CHECK of step 3 would refuse the row, so the value is cleared first; only that row, only that case.
--    Not undone by v8b2-rollback.sql: it does not know a value worth restoring.
update public.users set company_logo_url = null where public_id = 37 and company_logo_url !~ '^https://';

-- 2. The avatar address of a profile lies on the project Cloudinary (src/app/api/upload-avatar/route.ts) or on Google's picture host (a Google sign-up keeps its picture, O962-1).
-- 3. The company logo lies on the project Cloudinary (the same upload route).
alter table public.users
  add constraint users_avatar_url_prefix_check check (avatar_url is null or starts_with(avatar_url, 'https://res.cloudinary.com/die7okukn/') or starts_with(avatar_url, 'https://lh3.googleusercontent.com/')),
  add constraint users_company_logo_url_prefix_check check (company_logo_url is null or starts_with(company_logo_url, 'https://res.cloudinary.com/die7okukn/'));

-- 4. The sign-up trigger: the live body (pg_get_functiondef, 2026-11-23) with ONE line changed, the avatar line. It kept every https address of the sign-up metadata, which anyone can send to Supabase Auth
--    directly; it now keeps only an address of the two hosts of step 2 and clears any other one, so the sign-up still creates the profile. Attributes, owner and grants are kept by `create or replace`.
create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_type user_type := 'private';
  v_avatar text := new.raw_user_meta_data->>'avatar_url';
begin
  if new.raw_user_meta_data->>'user_type' = 'agent' then v_type := 'agent'; end if;   -- the only choice a sign-up form offers
  if v_avatar is not null and not (starts_with(v_avatar, 'https://res.cloudinary.com/die7okukn/') or starts_with(v_avatar, 'https://lh3.googleusercontent.com/')) then v_avatar := null; end if;   -- the value is rendered in <img src>: only the two hosts of users_avatar_url_prefix_check
  insert into public.users (id, name, phone, avatar_url, role, user_type, is_verified, created_at)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 200),
    left(new.raw_user_meta_data->>'phone', 32),
    left(v_avatar, 2000),
    'user'::user_role,                       -- never from metadata: administrators are made by an administrator with service_role
    v_type,
    false,
    now()
  )
  on conflict (id) do nothing;
  return new;
end $function$;

-- 5. The per-currency price ceiling (src/modules/listings/validations/index.ts, MAX_LISTING_PRICE_BY_CURRENCY; D71). v8b2Sql.test.ts holds the two numbers equal to that map.
alter table public.listings
  add constraint listings_price_ceiling_check check (
    (currency = 'EUR' and price <= 10000000000 and (price_old is null or price_old <= 10000000000))
    or (currency = 'ALL' and price <= 1000000000000 and (price_old is null or price_old <= 1000000000000)));

-- 6. The property type and the currency of a listing are active rows of their catalogues (the rule of catalogueRefusal in createListing.ts and updateListing.ts). A catalogue with no active row has nothing to
--    check against and lets the write through, as the code does. Invoker rights: both catalogues are readable by every session. The trigger fires on an insert and on an update that names one of the two columns.
create function public.listings_catalogue_active()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.property_types t where t.is_active)
     and not exists (select 1 from public.property_types t where t.is_active and t.slug = new.property_type::text) then
    raise exception 'listings: the property type is not an active row of the catalogue' using errcode = '23514';
  end if;
  if exists (select 1 from public.currencies c where c.is_active)
     and not exists (select 1 from public.currencies c where c.is_active and c.code = new.currency::text) then
    raise exception 'listings: the currency is not an active row of the catalogue' using errcode = '23514';
  end if;
  return new;
end
$$;
create trigger listings_catalogue_active
  before insert or update of property_type, currency on public.listings
  for each row execute function public.listings_catalogue_active();

-- 7. An owner's session cannot change the photos of an ACTIVE listing (D53 / R84 (b)); the application moves the listing to pending first (updateListing.ts) and the service role writes the rest. The guard is the one of
--    public.listings_owner_edit_moderation (v8b.sql): it holds only a session (authenticated or anon) whose user owns the listing and does not hold listings.moderate. The listing of the new row (insert, update) and
--    of the old row (update, delete) is read; a listing that no longer exists (the cascade of a delete) is not refused.
create function public.listing_images_owner_edit_moderation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_new uuid;
  v_old uuid;
  v_listing uuid;
  v_owner uuid;
  v_status public.listing_status;
begin
  if tg_op in ('INSERT', 'UPDATE') then v_new := new.listing_id; end if;
  if tg_op in ('UPDATE', 'DELETE') then v_old := old.listing_id; end if;
  if current_user in ('authenticated', 'anon') and auth.uid() is not null then
    foreach v_listing in array array[v_new, v_old] loop
      if v_listing is not null then
        select l.status, l.user_id into v_status, v_owner from public.listings l where l.id = v_listing;
        if found and v_status = 'active'::public.listing_status and v_owner = auth.uid()
           and not (select public.caller_has_permission('listings.moderate')) then
          raise exception 'listing_images: the photos of an active listing are changed only through moderation' using errcode = '42501';
        end if;
      end if;
    end loop;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;
create trigger listing_images_owner_edit_moderation
  before insert or update or delete on public.listing_images
  for each row execute function public.listing_images_owner_edit_moderation();

-- 8. R78 (a): the table built to hold the api_key of third-party rate providers goes (no code reads or writes it: exchangeProvidersRemoved.security.test.ts). No cascade: the preflight counts what depends on it.
drop table public.exchange_providers;

commit;
