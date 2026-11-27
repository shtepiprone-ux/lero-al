-- Task 1022: the read-only check after task1022.sql. One statement, no write. Every row must say ok = true; a row that says false names the object the apply did not leave as intended.
select n, check_name, ok
from (
  select 1 as n, 'the enum property_type has apartment, house, land, commercial, office, garage, parking, warehouse, other and room, in that order' as check_name,
         (select array_agg(e.enumlabel order by e.enumsortorder) from pg_enum e join pg_type t on t.oid = e.enumtypid join pg_namespace s on s.oid = t.typnamespace
           where s.nspname = 'public' and t.typname = 'property_type')
         = array['apartment', 'house', 'land', 'commercial', 'office', 'garage', 'parking', 'warehouse', 'other', 'room']::name[] as ok
  union all select 2, 'listings.property_type is still a NOT NULL public.property_type',
         exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'listings' and column_name = 'property_type'
                   and udt_schema = 'public' and udt_name = 'property_type' and is_nullable = 'NO')
) as checks
order by n;
