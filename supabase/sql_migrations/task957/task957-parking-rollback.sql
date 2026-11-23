-- Task 957 Revision 3: the way back from task957-parking.sql. It removes what that file adds, in the reverse order: the check, the two columns (their column grants go with them), the enum.
-- One transaction; run it only after task957-parking.sql. Data in the two columns is lost.
begin;

alter table public.listings drop constraint listings_parking_floor_check;
alter table public.listings drop column parking_floor, drop column parking_type;
drop type public.parking_type;

commit;
