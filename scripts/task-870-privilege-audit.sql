-- task-870-privilege-audit.sql
--
-- Task 870 (Sprint 80). Read-only Data API privilege audit. Owner-run in the Supabase
-- SQL Editor, BEFORE and AFTER scripts/task-870-harden-privileges.sql.
--
-- Purpose: one single top-level statement, returning exactly ONE result grid (the SQL
-- Editor shows only the last statement's result — F22), covering eight checks:
--   A1 view_write_grant        — any anon/authenticated write-family grant on a view/matview
--   A2 definer_view            — every non-invoker view in public, with owner/bypassrls/select
--   A3 rls_disabled_reachable  — any RLS-disabled table reachable by anon/authenticated
--   A4 service_only_reachable  — R (18 tables) + S0 (11 tables) still reachable by anon/auth
--   A5 open_write_policy       — write policies whose predicate does not reference auth.*()
--   A6 definer_function_exec   — SECURITY DEFINER functions anon/authenticated can EXECUTE
--   A7 default_acl_anon_auth   — postgres's default ACL still handing anon/auth anything
--   A8 acl_snapshot            — raw ACL entries on R + public_user_profiles (rollback reference)
--
-- Every check prints one `(count)` row (its row count, even when 0), then its detail rows,
-- ordered by check_id, then count-row-first, then object_name.
--
-- Expected BEFORE (design-time, re-measure at I0/O80-2): A1=0, A2=1 (public_user_profiles),
-- A3=0, A4>0 (R only — S0 is already 0), A5=1 or 0 (listing_views, owned by Task 865),
-- A6=unknown (list only, never judged here), A7=4, A8=the exact prior ACL state.
-- Expected AFTER: A1=0, A3=0, A4=0, A7=0; A8 shows public_user_profiles with a single
-- SELECT entry for authenticated and nothing for anon; A2/A5/A6 are unaffected by this task.
--
-- No write. No object created. Pure SQL plus `--` line comments only (F23 — a single
-- stray prose line makes the SQL Editor reject the whole batch and apply nothing).

with
roles2(role_name) as (
  values ('anon'), ('authenticated')
),
table_write_privs(priv) as (
  values ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')
),
seven_privs(priv) as (
  values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')
),
four_privs(priv) as (
  values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')
),
views_pub as (
  select c.oid, c.relname
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('v', 'm')
),
a1_detail as (
  select v.relname as object_name, r.role_name, p.priv as detail
  from views_pub v
  cross join roles2 r
  cross join table_write_privs p
  where has_table_privilege(r.role_name, v.oid, p.priv)
),
a2_detail as (
  select
    c.relname as object_name,
    null::text as role_name,
    ('owner=' || pg_get_userbyid(c.relowner)
      || ' bypassrls=' || ro.rolbypassrls::text
      || ' anon_select=' || has_table_privilege('anon', c.oid, 'SELECT')::text
      || ' authenticated_select=' || has_table_privilege('authenticated', c.oid, 'SELECT')::text
    ) as detail
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_roles ro on ro.oid = c.relowner
  where n.nspname = 'public' and c.relkind = 'v'
    and not coalesce((
      select bool_or(
        split_part(opt, '=', 1) = 'security_invoker'
        and lower(split_part(opt, '=', 2)) in ('true', 'on', '1')
      )
      from unnest(coalesce(c.reloptions, array[]::text[])) as opt
    ), false)
),
a3_detail as (
  select c.relname as object_name, r.role_name, p.priv as detail
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  cross join roles2 r
  cross join seven_privs p
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and c.relrowsecurity = false
    and has_table_privilege(r.role_name, c.oid, p.priv)
),
r_and_s0(tname) as (
  values
    ('email_change_tokens'), ('user_status_history'), ('user_change_log'),
    ('agent_reviews'), ('amenities'), ('amenity_translations'), ('conversations'),
    ('currency_rates'), ('history_clear_events'), ('languages'), ('listing_amenities'),
    ('listing_translations'), ('location_translations'), ('messages'),
    ('notification_settings'), ('page_translations'), ('support_messages'),
    ('verification_requests'),
    ('exchange_providers'), ('site_settings'), ('email_templates'), ('contact_inquiries'),
    ('contact_inquiry_replies'), ('report_actions'), ('role_permission_events'),
    ('support_tickets'), ('support_ticket_events'), ('listing_activity_daily'),
    ('listing_activity_refresh')
),
a4_detail as (
  select
    c.relname as object_name,
    r.role_name,
    (p.priv || ' granted_by=' || coalesce((
      select string_agg(distinct coalesce(nullif(pg_get_userbyid(x.grantor), ''), 'unknown'), ',')
      from aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) x
      where x.privilege_type = p.priv
        and (x.grantee = 0 or pg_get_userbyid(x.grantee) = r.role_name)
    ), 'unknown')) as detail
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join r_and_s0 t on t.tname = c.relname
  cross join roles2 r
  cross join four_privs p
  where n.nspname = 'public'
    and has_table_privilege(r.role_name, c.oid, p.priv)
),
a5_detail as (
  select
    tablename as object_name,
    null::text as role_name,
    (policyname || ' | cmd=' || cmd || ' | qual=' || coalesce(qual, '') || ' | with_check=' || coalesce(with_check, '')) as detail
  from pg_policies
  where schemaname = 'public'
    and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
    and roles && array['public', 'anon', 'authenticated']::name[]
    and (coalesce(qual, '') || coalesce(with_check, '')) !~* 'auth\.(uid|jwt|role)\('
),
a6_detail as (
  select
    p.proname as object_name,
    r.role_name,
    pg_get_function_identity_arguments(p.oid) as detail
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  cross join roles2 r
  where n.nspname = 'public'
    and p.prosecdef
    and has_function_privilege(r.role_name, p.oid, 'EXECUTE')
),
a7_detail as (
  select
    (case da.defaclobjtype
      when 'r' then 'TABLE' when 'S' then 'SEQUENCE' when 'f' then 'FUNCTION'
      else da.defaclobjtype::text end) as object_name,
    (case when x.grantee = 0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end) as role_name,
    x.privilege_type as detail
  from pg_default_acl da
  join pg_namespace n on n.oid = da.defaclnamespace
  cross join lateral aclexplode(da.defaclacl) x
  where da.defaclrole = 'postgres'::regrole
    and n.nspname = 'public'
    and (case when x.grantee = 0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end) in ('anon', 'authenticated')
),
r_tables(tname) as (
  values
    ('email_change_tokens'), ('user_status_history'), ('user_change_log'),
    ('agent_reviews'), ('amenities'), ('amenity_translations'), ('conversations'),
    ('currency_rates'), ('history_clear_events'), ('languages'), ('listing_amenities'),
    ('listing_translations'), ('location_translations'), ('messages'),
    ('notification_settings'), ('page_translations'), ('support_messages'),
    ('verification_requests'), ('public_user_profiles')
),
a8_detail as (
  select
    c.relname as object_name,
    (case when x.grantee = 0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end) as role_name,
    (x.privilege_type || ' granted_by=' || coalesce(nullif(pg_get_userbyid(x.grantor), ''), 'unknown')) as detail
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join r_tables t on t.tname = c.relname
  cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) x
  where n.nspname = 'public'
    and (case when x.grantee = 0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end) in ('anon', 'authenticated')
),
combined as (
  select 'A1' as check_id, 0 as sort_key, '(count)' as object_name, null::text as role_name, count(*)::text as detail from a1_detail
  union all
  select 'A1', 1, object_name, role_name, detail from a1_detail
  union all
  select 'A2', 0, '(count)', null, count(*)::text from a2_detail
  union all
  select 'A2', 1, object_name, role_name, detail from a2_detail
  union all
  select 'A3', 0, '(count)', null, count(*)::text from a3_detail
  union all
  select 'A3', 1, object_name, role_name, detail from a3_detail
  union all
  select 'A4', 0, '(count)', null, count(*)::text from a4_detail
  union all
  select 'A4', 1, object_name, role_name, detail from a4_detail
  union all
  select 'A5', 0, '(count)', null, count(*)::text from a5_detail
  union all
  select 'A5', 1, object_name, role_name, detail from a5_detail
  union all
  select 'A6', 0, '(count)', null, count(*)::text from a6_detail
  union all
  select 'A6', 1, object_name, role_name, detail from a6_detail
  union all
  select 'A7', 0, '(count)', null, count(*)::text from a7_detail
  union all
  select 'A7', 1, object_name, role_name, detail from a7_detail
  union all
  select 'A8', 0, '(count)', null, count(*)::text from a8_detail
  union all
  select 'A8', 1, object_name, role_name, detail from a8_detail
)
select check_id, object_name, role_name, detail
from combined
order by check_id, sort_key, object_name;
