-- Task 957 Revision 14: the way back from task957-grants.sql. It takes the three privileges back from the service role, so the table is as task957.sql left it.
-- One transaction; run it only after task957-grants.sql.
begin;

revoke select, insert, delete on table public.rate_limit_hits from service_role;

commit;
