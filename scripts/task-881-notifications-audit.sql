-- task-881-notifications-audit.sql
--
-- Task 881 (Sprint 80). Read-only Data API privilege audit for public.notifications.
-- Owner-run in the Supabase SQL Editor, BEFORE and AFTER
-- scripts/task-881-notifications-least-privilege.sql (O80-5). Pattern: Task 870's
-- scripts/task-870-privilege-audit.sql.
--
-- Purpose: one single top-level statement, returning exactly ONE result grid (the SQL
-- Editor shows only the last statement's result), covering five checks:
--   N1 table_privilege   — has_table_privilege for anon/authenticated/service_role x the
--                          7 table privileges (21 rows + one (count) row of the anon/
--                          authenticated true cells only — service_role is excluded from
--                          that count by design, it is expected to hold everything)
--   N2 column_privilege  — has_column_privilege(role, 'public.notifications', col, 'UPDATE')
--                          for anon and authenticated x every column (rows + (count) of
--                          true cells)
--   N3 policies          — every pg_policies row on public.notifications (name, cmd, roles,
--                          qual, with_check) + (count)
--   N4 table_acl         — aclexplode(relacl) entries whose grantee is anon, authenticated
--                          or PUBLIC (privilege + grantor) + (count)
--   N5 column_acl        — column ACL entries (pg_attribute.attacl) for the same grantees
--                          (privilege + grantor) + (count)
--
-- Every check prints its (count) row first (sort_key=0), even when 0, then its detail rows
-- (sort_key=1), ordered by check_id, then sort_key, then object_name.
--
-- Expected BEFORE (design-time F1/F2, re-measure live): N1 count=14 (anon+authenticated
-- each hold all 7); N2 count = 2 × the column count (20 with ten columns): has_column_privilege
-- is true on every column while the table-level UPDATE is held (review 1, RF3 — has_column_privilege
-- returns true for every column once the role holds the table-level privilege, so BEFORE is not 0);
-- N3 count=6 (SELECT x2, UPDATE x2, DELETE x1, INSERT x1 for service_role — live 2026-09-25);
-- N4 lists every anon/authenticated table privilege (live: 16, incl. MAINTAIN on PostgreSQL 17);
-- N5 count=0.
-- Expected AFTER (R2/R4/AC5): N1 count=1 (authenticated SELECT only); N2 count=1
-- (authenticated/is_read); N3 unchanged (this task touches no policy); N4 lists only
-- authenticated/SELECT; N5 lists only authenticated/is_read/UPDATE.
--
-- No write. No object created. Pure SQL plus `--` line comments only.

with
roles2(role_name) as (
  values ('anon'), ('authenticated'), ('service_role')
),
count_roles2(role_name) as (
  values ('anon'), ('authenticated')
),
seven_privs(priv) as (
  values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')
),
tbl as (
  select c.oid
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'notifications' and c.relkind in ('r', 'p')
),
n1_detail as (
  select
    r.role_name as object_name,
    (p.priv || '=' || has_table_privilege(r.role_name, t.oid, p.priv)::text) as detail
  from tbl t
  cross join roles2 r
  cross join seven_privs p
),
n1_count as (
  select count(*)::text as detail
  from tbl t
  cross join count_roles2 r
  cross join seven_privs p
  where has_table_privilege(r.role_name, t.oid, p.priv)
),
cols as (
  select column_name
  from information_schema.columns
  where table_schema = 'public' and table_name = 'notifications'
),
n2_detail as (
  select
    (r.role_name || '/' || c.column_name) as object_name,
    has_column_privilege(r.role_name, 'public.notifications', c.column_name, 'UPDATE')::text as detail
  from cols c
  cross join count_roles2 r
),
n2_count as (
  select count(*)::text as detail
  from cols c
  cross join count_roles2 r
  where has_column_privilege(r.role_name, 'public.notifications', c.column_name, 'UPDATE')
),
n3_detail as (
  select
    policyname as object_name,
    ('cmd=' || cmd || ' | roles=' || array_to_string(roles, ',') || ' | qual=' || coalesce(qual, '') || ' | with_check=' || coalesce(with_check, '')) as detail
  from pg_policies
  where schemaname = 'public' and tablename = 'notifications'
),
n4_detail as (
  select
    (case when x.grantee = 0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end) as object_name,
    (x.privilege_type || ' granted_by=' || coalesce(nullif(pg_get_userbyid(x.grantor), ''), 'unknown')) as detail
  from tbl t
  join pg_class c on c.oid = t.oid
  cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) x
  where (case when x.grantee = 0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end) in ('anon', 'authenticated', 'PUBLIC')
),
n5_detail as (
  select
    (a.attname || '/' || (case when x.grantee = 0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end)) as object_name,
    (x.privilege_type || ' granted_by=' || coalesce(nullif(pg_get_userbyid(x.grantor), ''), 'unknown')) as detail
  from tbl t
  join pg_attribute a on a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped and a.attacl is not null and cardinality(a.attacl) > 0
  cross join lateral aclexplode(a.attacl) x
  where (case when x.grantee = 0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end) in ('anon', 'authenticated', 'PUBLIC')
),
combined as (
  select 'N1' as check_id, 0 as sort_key, '(count)' as object_name, detail from n1_count
  union all
  select 'N1', 1, object_name, detail from n1_detail
  union all
  select 'N2', 0, '(count)', detail from n2_count
  union all
  select 'N2', 1, object_name, detail from n2_detail
  union all
  select 'N3', 0, '(count)', count(*)::text from n3_detail
  union all
  select 'N3', 1, object_name, detail from n3_detail
  union all
  select 'N4', 0, '(count)', count(*)::text from n4_detail
  union all
  select 'N4', 1, object_name, detail from n4_detail
  union all
  select 'N5', 0, '(count)', count(*)::text from n5_detail
  union all
  select 'N5', 1, object_name, detail from n5_detail
)
select check_id, sort_key, object_name, detail
from combined
order by check_id, sort_key, object_name;
