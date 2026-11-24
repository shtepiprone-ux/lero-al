-- Task 1007: the way back from task1007.sql. It deletes every role_permissions row whose key starts with page. (the page keys the apply seeded and any the administrator has set since),
-- whatever its allowed value is by then. After it no page row exists, so a moderator's page key is off; run it only together with the code of the task before this one, which checks no page key.
-- One transaction; run it only after task1007.sql.
begin;

delete from public.role_permissions where permission_key like 'page.%';

commit;
