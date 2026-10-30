-- Task 927 Amendment 12: rollback of a12-account-has-password.sql. Run it only together with a revert of the code that calls the function: without it the cabinet refuses
-- every e-mail change and deletion (a proof that cannot be read refuses).
begin;
drop function if exists public.account_has_password(uuid);
commit;
