-- task-881-guard-selftest.sql
--
-- Task 881 (Sprint 80). Owner-run in the Supabase SQL Editor, as the planted-violation proof
-- for scripts/task-881-notifications-least-privilege.sql's guard (R3/AC3). Read-only: no
-- revoke, grant, or alter anywhere in this file.
--
-- This is the IDENTICAL guard `do $$ ... $$` block from
-- task-881-notifications-least-privilege.sql, run standalone against the planted literal
-- 'users' instead of 'notifications'. 'users' is not the table this task hardens, but
-- public_user_profiles (Task 870 F1-F2) is a non-invoker view defined directly over `users`,
-- so G2 (a view/matview depends on the table) must fire and the exception text must name
-- public_user_profiles.
--
-- Expected result: an ERROR whose message contains "public_user_profiles". Nothing is
-- changed by running this file — it is a single SELECT-only PL/pgSQL block with no DDL/DML.
--
-- Byte-identical to the guard block in scripts/task-881-notifications-least-privilege.sql
-- except the table-name literal below (verified by `diff` in the session log, §10.3 item 4).

do $$
declare
  v_name text := 'users';
  v_violations text[] := array[]::text[];
  v_tbl_oid oid;
  v_rls boolean;
  v_fn record;
  v_dep_names text;
begin
  select c.oid, c.relrowsecurity into v_tbl_oid, v_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = v_name and c.relkind in ('r', 'p');

  if v_tbl_oid is null then
    v_violations := array_append(v_violations, format('g1: %s does not exist as a table in public', v_name));
  elsif not v_rls then
    v_violations := array_append(v_violations, format('g1: %s has row level security disabled', v_name));
  end if;

  if v_tbl_oid is not null then
    select string_agg(distinct vc.relname, ',' order by vc.relname) into v_dep_names
    from pg_depend d
    join pg_rewrite rw on rw.oid = d.objid and d.classid = 'pg_rewrite'::regclass
    join pg_class vc on vc.oid = rw.ev_class and vc.relkind in ('v', 'm')
    join pg_namespace vn on vn.oid = vc.relnamespace
    where d.refobjid = v_tbl_oid and d.refclassid = 'pg_class'::regclass and vn.nspname = 'public';

    if v_dep_names is not null then
      v_violations := array_append(v_violations, format('g2: view(s) %s depend on %s', v_dep_names, v_name));
    end if;

    for v_fn in
      select p.proname, n.nspname
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname not in ('pg_catalog', 'information_schema', 'realtime', 'extensions', 'graphql', 'graphql_public', 'auth', 'storage', 'vault', 'pgsodium')
        and p.prosecdef = false
        and p.prokind in ('f', 'p')
        and pg_get_functiondef(p.oid) ~* ('\m' || v_name || '\M')
    loop
      v_violations := array_append(v_violations, format('g3: function %s.%s (SECURITY INVOKER) references %s', v_fn.nspname, v_fn.proname, v_name));
    end loop;
  end if;

  if array_length(v_violations, 1) > 0 then
    raise exception 'Task 881 guard: % violation(s) found — %', array_length(v_violations, 1), array_to_string(v_violations, ' | ');
  end if;
end $$;
