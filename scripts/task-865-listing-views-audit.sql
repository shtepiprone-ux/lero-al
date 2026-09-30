-- task-865-listing-views-audit.sql
--
-- Task 865 (Sprint 78). Read-only audit of public.listing_views and the RPC that writes it.
-- Owner-run in the Supabase SQL Editor (O78-8 step 1 = BEFORE, step 5 = AFTER
-- scripts/task-865-close-anon-insert.sql). Returns exactly ONE result grid (F22).
--
-- Columns: check_id, ord, object_name, detail. Ordered by check_id, ord, object_name. Every
-- check prints a `(count)` row first (ord 0), even when its count is 0.
--
--   V1 table_privilege   — anon / authenticated / service_role x SELECT, INSERT, UPDATE,
--                          DELETE, TRUNCATE, REFERENCES, TRIGGER: every privilege held
--   V2 policy            — every pg_policies row on public.listing_views
--   V3 column            — every column: type, nullability, default
--   V4 constraint        — every constraint with its definition
--   V5 table_rls         — relrowsecurity, relforcerowsecurity, owner, owner rolbypassrls
--   V6 record_listing_view — prosecdef, owner, owner rolbypassrls, proconfig, whether the
--                          body mentions listing_views, EXECUTE for the three roles
--   V7 guest_contact_row — listing_contact_events rows with actor_user_id is null (the
--                          fold-in of R7); only the seven columns named by the kickoff
--
-- Run points: BEFORE and AFTER the close script.
-- Expected AFTER: V1 has no anon INSERT / UPDATE / DELETE row; V2 has no
-- "Anyone can insert a view" row; V3, V4, V5, V6 and V7 are unchanged from BEFORE.
--
-- No write. No set role. Pure SQL plus `--` line comments only (F23 — a single stray prose
-- line makes the SQL Editor reject the whole batch and apply nothing).

with
lv as (
  select c.oid, c.relrowsecurity, c.relforcerowsecurity, c.relowner
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'listing_views' and c.relkind in ('r', 'p')
),
grant_roles(role_name) as (
  values ('anon'), ('authenticated'), ('service_role')
),
seven_privs(priv) as (
  values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')
),
v1_detail as (
  select r.role_name as object_name, p.priv as detail
  from lv
  cross join grant_roles r
  cross join seven_privs p
  where has_table_privilege(r.role_name, lv.oid, p.priv)
),
v2_detail as (
  select
    policyname::text as object_name,
    (permissive || ' | cmd=' || cmd || ' | roles=' || roles::text
      || ' | qual=' || coalesce(qual, 'NULL')
      || ' | with_check=' || coalesce(with_check, 'NULL')) as detail
  from pg_policies
  where schemaname = 'public' and tablename = 'listing_views'
),
v3_detail as (
  select
    a.attnum::int as ord,
    a.attname::text as object_name,
    (format_type(a.atttypid, a.atttypmod)
      || ' | nullable=' || (not a.attnotnull)::text
      || ' | default=' || coalesce(pg_get_expr(d.adbin, d.adrelid), 'NULL')) as detail
  from lv
  join pg_attribute a on a.attrelid = lv.oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
),
v4_detail as (
  select
    co.conname::text as object_name,
    ('contype=' || co.contype::text || ' | ' || pg_get_constraintdef(co.oid)) as detail
  from lv
  join pg_constraint co on co.conrelid = lv.oid
),
v5_detail as (
  select
    'listing_views'::text as object_name,
    ('relrowsecurity=' || lv.relrowsecurity::text
      || ' | relforcerowsecurity=' || lv.relforcerowsecurity::text
      || ' | owner=' || pg_get_userbyid(lv.relowner)
      || ' | owner_bypassrls=' || ro.rolbypassrls::text) as detail
  from lv
  join pg_roles ro on ro.oid = lv.relowner
),
rpc as (
  select p.oid, p.prosecdef, p.proowner, p.proconfig, p.prosrc
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.oid = to_regprocedure('public.record_listing_view(uuid,uuid,text)')
),
v6_facts as (
  select 1 as ord, 'prosecdef'::text as object_name, prosecdef::text as detail from rpc
  union all
  select 2, 'owner', (pg_get_userbyid(rpc.proowner) || ' | owner_bypassrls=' || ro.rolbypassrls::text)
  from rpc join pg_roles ro on ro.oid = rpc.proowner
  union all
  select 3, 'proconfig', coalesce(array_to_string(proconfig, ', '), 'NULL') from rpc
  union all
  select 4, 'body_mentions_listing_views', (prosrc ~* 'listing_views')::text from rpc
  union all
  select 5, 'execute_' || r.role_name, has_function_privilege(r.role_name, rpc.oid, 'EXECUTE')::text
  from rpc cross join grant_roles r
),
v7_detail as (
  select
    e.id::text as object_name,
    ('listing_id=' || coalesce(e.listing_id::text, 'NULL')
      || ' | channel=' || coalesce(e.channel::text, 'NULL')
      || ' | source=' || coalesce(e.source::text, 'NULL')
      || ' | locale=' || coalesce(e.locale::text, 'NULL')
      || ' | is_owner_click=' || coalesce(e.is_owner_click::text, 'NULL')
      || ' | created_at=' || coalesce(e.created_at::text, 'NULL')) as detail
  from public.listing_contact_events e
  where e.actor_user_id is null
),
combined as (
  select 'V1' as check_id, 0 as ord, '(count)' as object_name, count(*)::text as detail from v1_detail
  union all
  select 'V1', 1, object_name, detail from v1_detail
  union all
  select 'V2', 0, '(count)', count(*)::text from v2_detail
  union all
  select 'V2', 1, object_name, detail from v2_detail
  union all
  select 'V3', 0, '(count)', count(*)::text from v3_detail
  union all
  select 'V3', ord, object_name, detail from v3_detail
  union all
  select 'V4', 0, '(count)', count(*)::text from v4_detail
  union all
  select 'V4', 1, object_name, detail from v4_detail
  union all
  select 'V5', 0, '(count)', count(*)::text from v5_detail
  union all
  select 'V5', 1, object_name, detail from v5_detail
  union all
  select 'V6', 0, '(count)', count(*)::text from v6_facts where ord = 1
  union all
  select 'V6', ord, object_name, detail from v6_facts
  union all
  select 'V7', 0, '(count)', count(*)::text from v7_detail
  union all
  select 'V7', 1, object_name, detail from v7_detail
)
select check_id, ord, object_name, detail
from combined
order by check_id, ord, object_name;
