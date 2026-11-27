-- Task 1022: the way back from task1022.sql. PostgreSQL cannot drop one value of an enum, so the type is recreated with the nine values it had before, in their order, and the column is moved to it.
-- One transaction; run it only after task1022.sql. It refuses when any public.listings row has the type parking, so no data is lost silently.
-- Only listings.property_type has the type; its index listings_property_type_idx is rebuilt by the column change; the column has no default.
begin;

-- 1. Refuse while a listing still holds the value.
do $$
begin
  if exists (select 1 from public.listings where property_type::text = 'parking') then
    raise exception 'Task 1022 rollback refused: % public.listings rows have property_type parking',
      (select count(*) from public.listings where property_type::text = 'parking');
  end if;
end
$$;

-- 2. Recreate the type with its nine values and move the column to it.
alter type public.property_type rename to property_type_task1022_old;

create type public.property_type as enum ('apartment', 'house', 'land', 'commercial', 'office', 'garage', 'warehouse', 'other', 'room');

alter table public.listings alter column property_type type public.property_type using property_type::text::public.property_type;

drop type public.property_type_task1022_old;

commit;
