-- Task 962, hardening v8b part 2: the way back from v8b2.sql. It restores every object v8b2.sql changes to the definition the live catalog held on 2026-11-23 (pg_get_functiondef, the columns, defaults,
-- constraints, index, policy and grants of public.exchange_providers, read read-only), in the reverse order. One transaction; run it only after v8b2.sql. scripts/quality/db-sql-roundtrip.mjs proves that the
-- catalog after the rollback equals the one before v8b2.sql.
begin;

-- 8. exchange_providers as the live catalog held it (PostgreSQL 17.6): 11 columns in this order, the serial id, the unique name, the mode CHECK, the priority index, row-level security with the one read policy
--    for everybody, and the grants read on 2026-11-23: service_role all; anon and authenticated references, trigger and maintain only; the sequence all four roles. The two rows are NOT restored:
--    neither held an api_key value (the preflight counted the keys before the apply).
create table public.exchange_providers (
  id serial primary key,
  name text not null unique,
  endpoint_url text not null default '',
  api_key text,
  refresh_interval_min integer not null default 60,
  priority integer not null default 10,
  mode text not null default 'auto',
  is_enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exchange_providers_mode_check check (mode in ('auto', 'manual', 'hybrid'))
);
create index exchange_providers_priority_idx on public.exchange_providers using btree (priority, is_enabled);
alter table public.exchange_providers enable row level security;
create policy "exchange_providers_read" on public.exchange_providers for select to public using (true);
revoke all on table public.exchange_providers from anon, authenticated, service_role;
grant all on table public.exchange_providers to service_role;
grant references, trigger, maintain on table public.exchange_providers to anon, authenticated;
revoke all on sequence public.exchange_providers_id_seq from anon, authenticated, service_role;
grant all on sequence public.exchange_providers_id_seq to anon, authenticated, service_role;

-- 7. no photo trigger.
drop trigger listing_images_owner_edit_moderation on public.listing_images;
drop function public.listing_images_owner_edit_moderation();

-- 6. no catalogue trigger.
drop trigger listings_catalogue_active on public.listings;
drop function public.listings_catalogue_active();

-- 5. no price ceiling.
alter table public.listings drop constraint listings_price_ceiling_check;

-- 4. the sign-up trigger as it was: the live definition of 2026-11-23, read with pg_get_functiondef (the avatar line kept every https address); the block after the statement makes the stored text equal
--    the live text byte for byte. `create or replace` keeps the owner and the grants (postgres, service_role).
--    FACT, read-only query on the live project on 2026-11-23: select md5(prosrc), position(E'\r' in prosrc) > 0, length(prosrc) from pg_proc where oid = 'public.handle_new_user()'::regprocedure
--      -> cefa51890d93634aa2f2ff012b44b964 | true | 918: the body holds CR LF line breaks, begins with a line break and ends with "end ".
--    So the text to restore has CRLF line endings. The statement stores the body with the line endings of THIS FILE (LF as committed, CRLF in a checkout with autocrlf). The block below takes the definition
--    Postgres stores, removes every CR, turns every LF into CR LF (removing first, so a file with CRLF does not end with CR CR LF), and executes it again: the stored body is then CRLF throughout, md5
--    cefa51890d93634aa2f2ff012b44b964, length 918 (src/tests/__tests__/v8b2Sql.test.ts computes both from this file as LF and as CRLF). Same method as v8b-rollback.sql (Task 956) for record_listing_view.
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
  if v_avatar is not null and v_avatar !~ '^https://' then v_avatar := null; end if;   -- the value is rendered in <img src>
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
do $$
begin
  execute replace(replace(pg_catalog.pg_get_functiondef('public.handle_new_user()'::pg_catalog.regprocedure), E'\r', ''), E'\n', E'\r\n');
end
$$;

-- 3. and 2. no address CHECK on users.
alter table public.users drop constraint users_company_logo_url_prefix_check, drop constraint users_avatar_url_prefix_check;

-- 1. the data step of v8b2.sql (O962-2: the logo of user 37 cleared) is NOT undone: this file does not know a value worth restoring (the live value was an empty string), and a cleared logo needs no CHECK to be valid.

commit;
