-- Task 962, hardening v8b part 2: the read-only check before v8b2.sql. One statement in a read-only transaction, no write. Each row counts what v8b2.sql would refuse, fail on or lose; ANY row from 1 to 8 with
-- problems > 0 stops the apply (the owner decides what to do with those rows, never the file). Rows 9 and 10 are informational, not problems. `detail` lists the public ids (rows 1 to 4, 9) or the ids and names
-- with the presence of a key (rows 7 and 10); a key value is never selected.
begin transaction read only;
select n, check_name, problems, detail
from (
  -- the rows each new CHECK on public.users would refuse (users_avatar_url_prefix_check: the project Cloudinary or the Google picture host)
  select 1 as n, 'users.avatar_url that the CHECK would refuse' as check_name,
         (select count(*) from public.users
          where avatar_url is not null
            and not (starts_with(avatar_url, 'https://res.cloudinary.com/die7okukn/') or starts_with(avatar_url, 'https://lh3.googleusercontent.com/'))) as problems,
         (select string_agg(public_id::text, ',' order by public_id) from public.users
          where avatar_url is not null
            and not (starts_with(avatar_url, 'https://res.cloudinary.com/die7okukn/') or starts_with(avatar_url, 'https://lh3.googleusercontent.com/'))) as detail
  -- users_company_logo_url_prefix_check (the project Cloudinary only), AFTER step 1 of v8b2.sql has cleared the logo of user 37 when it is not an https address
  union all select 2, 'users.company_logo_url that the CHECK would still refuse after the data step (step 1 clears user 37 only)',
         (select count(*) from public.users
          where company_logo_url is not null
            and not starts_with(company_logo_url, 'https://res.cloudinary.com/die7okukn/')
            and not (public_id = 37 and company_logo_url !~ '^https://')),
         (select string_agg(public_id::text, ',' order by public_id) from public.users
          where company_logo_url is not null
            and not starts_with(company_logo_url, 'https://res.cloudinary.com/die7okukn/')
            and not (public_id = 37 and company_logo_url !~ '^https://'))
  -- listings_price_ceiling_check: EUR 10 000 000 000 and ALL 1 000 000 000 000 for the price and the old price
  union all select 3, 'listings over the per-currency price ceiling',
         (select count(*) from public.listings
          where not ((currency = 'EUR' and price <= 10000000000 and (price_old is null or price_old <= 10000000000))
                     or (currency = 'ALL' and price <= 1000000000000 and (price_old is null or price_old <= 1000000000000)))),
         (select string_agg(public_id::text, ',' order by public_id) from public.listings
          where not ((currency = 'EUR' and price <= 10000000000 and (price_old is null or price_old <= 10000000000))
                     or (currency = 'ALL' and price <= 1000000000000 and (price_old is null or price_old <= 1000000000000))))
  -- listings_catalogue_active: a listing whose property type or currency is not an active catalogue row (a catalogue with no active row refuses nothing): its next write naming the column would be refused
  union all select 4, 'listings whose property type or currency is not an active catalogue row (the next write of that column would be refused)',
         (select count(*) from public.listings l
          where (exists (select 1 from public.property_types t where t.is_active)
                 and not exists (select 1 from public.property_types t where t.is_active and t.slug = l.property_type::text))
             or (exists (select 1 from public.currencies c where c.is_active)
                 and not exists (select 1 from public.currencies c where c.is_active and c.code = l.currency::text))),
         (select string_agg(l.public_id::text, ',' order by l.public_id) from public.listings l
          where (exists (select 1 from public.property_types t where t.is_active)
                 and not exists (select 1 from public.property_types t where t.is_active and t.slug = l.property_type::text))
             or (exists (select 1 from public.currencies c where c.is_active)
                 and not exists (select 1 from public.currencies c where c.is_active and c.code = l.currency::text)))
  -- nothing v8b2.sql creates may exist yet: three constraints, two functions, two triggers
  union all select 5, 'objects v8b2.sql creates that already exist',
         (select count(*) from pg_constraint
          where conname in ('users_avatar_url_prefix_check', 'users_company_logo_url_prefix_check', 'listings_price_ceiling_check'))
         + (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname in ('listings_catalogue_active', 'listing_images_owner_edit_moderation'))
         + (select count(*) from pg_trigger where tgname in ('listings_catalogue_active', 'listing_images_owner_edit_moderation') and not tgisinternal),
         null
  -- what v8b2.sql relies on must exist: the sign-up function it replaces (`create or replace` would create it with the default grants), the permission function, the two catalogues, the table it drops, the status type
  union all select 6, 'objects v8b2.sql relies on that are missing',
         (select count(*) from (values (to_regprocedure('public.handle_new_user()')::text), (to_regprocedure('public.caller_has_permission(text)')::text),
                                       (to_regclass('public.property_types')::text), (to_regclass('public.currencies')::text),
                                       (to_regclass('public.exchange_providers')::text), (to_regtype('public.listing_status')::text)) v(x)
          where x is null),
         null
  -- the table goes with its rows: a row that holds a key would lose it
  union all select 7, 'exchange_providers rows that hold a key (they would be dropped with the table)',
         (select count(*) from public.exchange_providers where api_key is not null and api_key <> ''),
         (select string_agg(id::text || ':' || name, ', ' order by id) from public.exchange_providers where api_key is not null and api_key <> '')
  -- drop table has no cascade: nothing may depend on the table (a foreign key of another table, a view or a rule)
  union all select 8, 'objects that depend on exchange_providers (foreign keys, views, rules)',
         (select count(*) from pg_constraint where confrelid = to_regclass('public.exchange_providers'))
         + (select count(*) from pg_depend d join pg_rewrite r on r.oid = d.objid
            where d.classid = 'pg_rewrite'::regclass and d.refobjid = to_regclass('public.exchange_providers')),
         null
  -- not a problem: the rows step 1 of v8b2.sql changes (live value on 2026-11-23: 1, public_id 37, an empty string)
  union all select 9, 'users.company_logo_url rows the data step changes (informational, not a problem: the live value on 2026-11-23 is 1)',
         (select count(*) from public.users where public_id = 37 and company_logo_url !~ '^https://'),
         (select string_agg(public_id::text, ',' order by public_id) from public.users where public_id = 37 and company_logo_url !~ '^https://')
  -- not a problem: the rows the drop removes, with the presence of a key (the live value on 2026-11-23: 2 rows, no key)
  union all select 10, 'exchange_providers rows (informational, not a problem: the live value on 2026-11-23 is 2, neither holds a key)',
         (select count(*) from public.exchange_providers),
         (select string_agg(id::text || ':' || name || ':key ' || case when api_key is not null and api_key <> '' then 'present' else 'absent' end, ', ' order by id)
          from public.exchange_providers)
) checks
order by n;
rollback;
