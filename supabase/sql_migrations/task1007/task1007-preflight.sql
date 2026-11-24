-- Task 1007: the read-only check before task1007.sql. Two selects, no write.
-- Row 1 lists the page.% rows role_permissions already holds (the page keys of src/lib/auth/adminPages.ts): task1007.sql seeds them with "on conflict do nothing", so a row that is
-- already there keeps its own value. Row 2 is the number of moderator accounts the seed gives access to (every listed page stays open to them at the release, so no moderator loses a page).
-- Neither row stops the apply: they say what the apply will leave alone and whom it concerns. The owner reads them.
select n, check_name, found
from (
  select 1 as n, 'role_permissions rows with a page. key (kept as they are by the apply)' as check_name,
         (select count(*) from public.role_permissions where permission_key like 'page.%') as found
  union all select 2, 'moderator accounts (active or not): the people the seeded page rows are for',
         (select count(*) from public.users where role = 'moderator')
) checks
order by n;

-- the rows themselves, for the owner to read (one row per existing page. key)
select role, permission_key, allowed, updated_at, updated_by_user_id
from public.role_permissions
where permission_key like 'page.%'
order by role, permission_key;
