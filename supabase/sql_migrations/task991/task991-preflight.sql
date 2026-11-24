-- Task 991: the read-only check before task991.sql. One statement, no write. A row with problems > 0 stops the apply; the owner decides what to do, never the file.
-- Row 1: auth_password_matches must not exist yet. Row 2: neither template key may exist yet (the file would leave an existing row as it is and the application would send that text).
-- Row 3: the function needs pgcrypto's crypt and gen_salt in the `extensions` schema; the row counts the one that is missing (it must be 0).
-- Row 4: the function compares the stored bcrypt hashes of auth.users; the row counts the accounts whose hash is not bcrypt ($2a/$2b/$2y), whose password check would then be false (it must be 0).
select n, check_name, problems
from (
  select 1 as n, 'public.auth_password_matches already exists' as check_name,
         (select count(*) from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'public' and p.proname = 'auth_password_matches') as problems
  union all select 2, 'the templates account_exists or account_blocked already exist',
         (select count(*) from public.email_templates t where t.key in ('account_exists', 'account_blocked'))
  union all select 3, 'extensions.crypt or extensions.gen_salt is missing (pgcrypto not in the extensions schema)',
         2 - (select count(*) from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'extensions' and p.proname in ('crypt', 'gen_salt'))
  union all select 4, 'auth.users rows with a password hash that is not bcrypt',
         (select count(*) from auth.users u where u.encrypted_password is not null and u.encrypted_password <> '' and u.encrypted_password !~ '^\$2[aby]\$')
) checks
order by n;
