-- Task 1022 (owner decision O957-15, 2026-11-21): a listing of the type Parking can be saved. The form, the server schema and the active catalogue row accept `parking`; the enum public.property_type refuses it at the insert. This adds the value after `garage`.
-- One transaction; every object is schema-qualified. After the apply run task1022-verify.sql (every row ok = true). The way back is task1022-rollback.sql.
begin;

alter type public.property_type add value 'parking' after 'garage';

commit;
