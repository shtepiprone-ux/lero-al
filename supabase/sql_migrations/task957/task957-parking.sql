-- Task 957 Revision 3 (owner decision O1001-2, 2026-11-21): the kind of parking of a listing and, for an underground parking, its floor. Two nullable columns on public.listings, empty meaning none given.
-- One transaction; every object is schema-qualified. After the apply run task957-parking-verify.sql (every row ok = true). The way back is task957-parking-rollback.sql.
-- The form writes the listing through the signed-in session (role `authenticated`), so the two new columns get column-level INSERT and UPDATE for it (step 3); task957-parking-verify.sql checks those two grants and that `anon` has none.
begin;

-- 1. The kinds of parking, an enum like the other fixed choices of a listing (condition, wall_type, heating).
create type public.parking_type as enum ('underground', 'private_street', 'city');

-- 2. The columns. A floor is the underground level, -10 to -1 (the range of the form and of the server's schema), and only an underground parking has one.
-- A CHECK passes when its expression is NULL, so `parking_type is not null` is written out: with no kind (NULL) the term `parking_type = 'underground'` is NULL, and without it a floor with no kind would pass.
alter table public.listings
  add column parking_type public.parking_type,
  add column parking_floor integer;

alter table public.listings
  add constraint listings_parking_floor_check
  check (parking_floor is null or (parking_type is not null and parking_type = 'underground' and parking_floor between -10 and -1));

-- 3. Column-level write grants for the two columns, to the signed-in role only.
grant insert (parking_type, parking_floor), update (parking_type, parking_floor) on table public.listings to authenticated;

commit;
