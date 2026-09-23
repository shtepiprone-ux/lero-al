-- task-870-guard-selftest.sql
--
-- Task 870 (Sprint 80). Owner-run in the Supabase SQL Editor, as the planted-violation
-- proof for scripts/task-870-harden-privileges.sql's guard (R3/R6). Read-only: no
-- revoke, grant, or alter anywhere in this file.
--
-- This is the IDENTICAL guard `do $$ ... $$` block from task-870-harden-privileges.sql,
-- run standalone against the planted array `array['users']` instead of the 18 R names.
-- `users` is not one of R's tables, but public_user_profiles (F2) is defined directly
-- over `users`, so g4 (a view depends on the table) must fire and the exception text
-- must name public_user_profiles.
--
-- Expected result: an ERROR whose message contains "public_user_profiles". Nothing is
-- changed by running this file — it is a single SELECT-only PL/pgSQL block with no DDL/DML.
--
-- Byte-identical to the STEP 0 block in scripts/task-870-harden-privileges.sql except the
-- array literal below (§10.4.4 — verified by `diff` in the session log).

do $$
declare
  v_names text[] := array['users'];
  v_name text;
  v_violations text[] := array[]::text[];
  v_tbl_oid oid;
  v_fn record;
  v_pub_count int;
  v_dep_names text;
begin
  foreach v_name in array v_names loop
    v_tbl_oid := null;

    select c.oid into v_tbl_oid
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = v_name and c.relkind in ('r', 'p');

    if v_tbl_oid is null then
      v_violations := array_append(v_violations, format('g1: %s does not exist as a table in public', v_name));
      continue;
    end if;

    for v_fn in
      select p.proname
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.prosecdef = false
        and p.prokind in ('f', 'p')
        and pg_get_functiondef(p.oid) ~* ('\m' || v_name || '\M')
    loop
      v_violations := array_append(v_violations, format('g2: function %s (SECURITY INVOKER) references %s', v_fn.proname, v_name));
    end loop;

    select count(*) into v_pub_count
    from pg_publication_tables pt
    where pt.pubname = 'supabase_realtime' and pt.schemaname = 'public' and pt.tablename = v_name;

    if v_pub_count > 0 then
      v_violations := array_append(v_violations, format('g3: %s is in the supabase_realtime publication', v_name));
    end if;

    select string_agg(distinct vc.relname, ',' order by vc.relname) into v_dep_names
    from pg_depend d
    join pg_rewrite rw on rw.oid = d.objid and d.classid = 'pg_rewrite'::regclass
    join pg_class vc on vc.oid = rw.ev_class and vc.relkind in ('v', 'm')
    join pg_namespace vn on vn.oid = vc.relnamespace
    where d.refobjid = v_tbl_oid and d.refclassid = 'pg_class'::regclass and vn.nspname = 'public';

    if v_dep_names is not null then
      v_violations := array_append(v_violations, format('g4: view(s) %s depend on %s', v_dep_names, v_name));
    end if;
  end loop;

  if array_length(v_violations, 1) > 0 then
    raise exception 'Task 870 guard: % violation(s) found — %', array_length(v_violations, 1), array_to_string(v_violations, ' | ');
  end if;
end $$;
