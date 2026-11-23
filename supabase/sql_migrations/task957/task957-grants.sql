-- Task 957 Revision 14: the service role's grant on the limiter's table.
-- task957.sql:6 says the table "can be read and written by the service role (and the function below) only", but task957.sql:13-14 turn row level security on and revoke every
-- privilege from public, anon and authenticated, and grant the service role nothing. The service-role client of src/tests/integration/rateLimit.integration.test.ts (:23 delete,
-- :68 select, :75 insert) therefore gets 42501 (permission denied). The application never reads the table: its only writer is the SECURITY DEFINER function
-- public.consume_rate_limit. No other grant, no grant for a session.
-- One transaction; run it after task957.sql. The way back is task957-grants-rollback.sql.
begin;

grant select, insert, delete on table public.rate_limit_hits to service_role;

commit;
