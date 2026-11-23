-- Task 957: the way back from task957.sql. It removes the three objects task957.sql creates, in the reverse order: the trigger, its function, the limiter function, the table (with its index and its hits).
-- One transaction; run it only after task957.sql. scripts/quality/db-sql-roundtrip.mjs proves that the catalog after this file equals the one before task957.sql.
begin;

drop trigger listing_images_owner_folder on public.listing_images;
drop function public.listing_images_owner_folder();
drop function public.consume_rate_limit(text, text, integer, integer);
drop table public.rate_limit_hits;

commit;
