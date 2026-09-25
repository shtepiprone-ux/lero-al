-- task-871-moderator-census.sql
--
-- Task 871 (Sprint 80), owner action O80-4. Read-only, single-statement, one-result-grid census
-- for the moderator role_permissions read-path fix (roleHasPermission / getModeratorPermissions
-- moved from the user-scoped client to createAdminClient()). Owner-run in the Supabase SQL
-- Editor. No write, no object created, no names/ids/emails — counts only.
--
-- Rows (metric, value):
--   moderators_total                      — count(*) of users.role = 'moderator'
--   moderators_not_deleted                — same, deleted_at is null
--   role_permissions_allowed              — count(*) role_permissions where role='moderator' and allowed=true
--   role_permissions_denied               — same, allowed=false
--   authenticated_select_role_permissions — has_table_privilege('authenticated', 'public.role_permissions', 'SELECT')
--                                            expected false — Task 275 revoke, unchanged by this task (F3)

select 'moderators_total' as metric, count(*)::text as value
from public.users
where role = 'moderator'
union all
select 'moderators_not_deleted', count(*)::text
from public.users
where role = 'moderator' and deleted_at is null
union all
select 'role_permissions_allowed', count(*)::text
from public.role_permissions
where role = 'moderator' and allowed = true
union all
select 'role_permissions_denied', count(*)::text
from public.role_permissions
where role = 'moderator' and allowed = false
union all
select 'authenticated_select_role_permissions', has_table_privilege('authenticated', 'public.role_permissions', 'SELECT')::text;
