-- Task 991: the way back from task991.sql. It removes the two functions and the two template rows task991.sql inserted. One transaction; run it only after task991.sql.
-- scripts/quality/db-sql-roundtrip.mjs proves that the catalog after this file equals the one before task991.sql (the rows are data, not catalog).
-- The delete is by key and locale: a template an administrator wrote under these two keys before the apply would have stopped the preflight (row 2), so only the rows of the apply are removed.
begin;

drop function public.account_status_by_email(text);
drop function public.auth_password_matches(text, text);
delete from public.email_templates where locale = 'sq' and key in ('account_exists', 'account_blocked');

commit;
