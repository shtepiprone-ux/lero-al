-- Task 957 Revision 3: the read-only check after task957-parking.sql. One statement, no write. Every row must say ok = true; a row that says false names the object the apply did not leave as intended.
select n, check_name, ok
from (
  select 1 as n, 'the enum parking_type has underground, private_street and city, in that order' as check_name,
         (select array_agg(e.enumlabel order by e.enumsortorder) from pg_enum e join pg_type t on t.oid = e.enumtypid join pg_namespace s on s.oid = t.typnamespace
           where s.nspname = 'public' and t.typname = 'parking_type') = array['underground', 'private_street', 'city']::name[] as ok
  union all select 2, 'listings.parking_type is a nullable parking_type and listings.parking_floor a nullable integer',
         exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'listings' and column_name = 'parking_type' and udt_name = 'parking_type' and is_nullable = 'YES')
         and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'listings' and column_name = 'parking_floor' and data_type = 'integer' and is_nullable = 'YES')
  union all select 3, 'a floor belongs to an underground parking and lies from -10 to -1 (the check listings_parking_floor_check)',
         exists (select 1 from pg_constraint where conrelid = 'public.listings'::regclass and conname = 'listings_parking_floor_check' and contype = 'c'
                   and pg_get_constraintdef(oid) like '%underground%' and pg_get_constraintdef(oid) like '%-10%' and pg_get_constraintdef(oid) ~ '-1([^0-9]|$)'   -- the bound -1 is told from -10 (a plain like '%-1%' also matches -10)
                   and pg_get_constraintdef(oid) ilike '%parking_type is not null%')   -- a CHECK passes on NULL: without this term a floor with no kind would pass
  union all select 4, 'authenticated may insert and update both columns, and anon may write neither',
         has_column_privilege('authenticated', 'public.listings', 'parking_type', 'INSERT') and has_column_privilege('authenticated', 'public.listings', 'parking_type', 'UPDATE')
         and has_column_privilege('authenticated', 'public.listings', 'parking_floor', 'INSERT') and has_column_privilege('authenticated', 'public.listings', 'parking_floor', 'UPDATE')
         and not has_column_privilege('anon', 'public.listings', 'parking_type', 'INSERT') and not has_column_privilege('anon', 'public.listings', 'parking_floor', 'UPDATE')
) as checks
order by n;
