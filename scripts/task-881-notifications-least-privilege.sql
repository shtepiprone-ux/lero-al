-- task-881-notifications-least-privilege.sql
--
-- Task 881 (Sprint 80). Owner-run in the Supabase SQL Editor, AFTER capturing the BEFORE
-- grid from scripts/task-881-notifications-audit.sql and the BEFORE probe
-- (scripts/task-881-notifications-probe.mjs --phase before). Run order (O80-5): BEFORE
-- audit → BEFORE probe → this script's guard proven via task-881-guard-selftest.sql →
-- this script → AFTER audit → AFTER probe. Expected result: "Success. No rows returned"
-- (the guard and post-condition are silent when they pass; nothing else in this script
-- returns rows).
--
-- One transaction. If the guard (step 0) finds public.notifications missing, RLS-disabled,
-- depended on by a view/matview, or referenced by a SECURITY INVOKER function body outside
-- Supabase's system schemas, it raises ONE exception listing every violation and the whole
-- transaction rolls back — nothing below is applied. If the post-condition (step 2) finds
-- the resulting grant state does not exactly match the target contract, it also raises and
-- rolls back everything, including step 1.
--
-- Step 1 (R2, F1-F9): anon loses every privilege; authenticated loses everything except
-- table-level SELECT and column-level UPDATE on is_read only.
-- Step 2 (R4): post-condition assertion of the exact resulting grant state.
-- Step 3: reload PostgREST's schema cache.
--
-- service_role and postgres are not named anywhere in this script.

begin;

-- ═════ STEP 0 — guard (R3) ═══════════════════════════════════════════════════════════
-- Byte-identical to scripts/task-881-guard-selftest.sql except the table-name literal.
do $$
declare
  v_name text := 'notifications';
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

-- ═════ STEP 1 — revoke/grant on public.notifications (R2) ════════════════════════════
revoke all on public.notifications from anon;
revoke all on public.notifications from authenticated;
grant select on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;

-- ═════ STEP 2 — post-condition (R4) ═══════════════════════════════════════════════════
do $$
declare
  v_tbl_oid oid;
  v_col record;
  v_violations text[] := array[]::text[];
  v_priv text;
  v_seven text[] := array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'];
begin
  select c.oid into v_tbl_oid
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'notifications' and c.relkind in ('r', 'p');

  foreach v_priv in array v_seven loop
    if has_table_privilege('anon', v_tbl_oid, v_priv) then
      v_violations := array_append(v_violations, format('anon still holds table-level %s', v_priv));
    end if;
  end loop;

  if not has_table_privilege('authenticated', v_tbl_oid, 'SELECT') then
    v_violations := array_append(v_violations, 'authenticated is missing table-level SELECT');
  end if;

  foreach v_priv in array array['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] loop
    if has_table_privilege('authenticated', v_tbl_oid, v_priv) then
      v_violations := array_append(v_violations, format('authenticated still holds table-level %s', v_priv));
    end if;
  end loop;

  if not has_column_privilege('authenticated', v_tbl_oid, 'is_read', 'UPDATE') then
    v_violations := array_append(v_violations, 'authenticated is missing column-level UPDATE on is_read');
  end if;

  for v_col in
    select column_name
    from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications' and column_name <> 'is_read'
  loop
    if has_column_privilege('authenticated', v_tbl_oid, v_col.column_name, 'UPDATE') then
      v_violations := array_append(v_violations, format('authenticated still holds column-level UPDATE on %s', v_col.column_name));
    end if;
  end loop;

  if not has_table_privilege('service_role', v_tbl_oid, 'SELECT') then
    v_violations := array_append(v_violations, 'service_role is missing table-level SELECT');
  end if;
  if not has_table_privilege('service_role', v_tbl_oid, 'INSERT') then
    v_violations := array_append(v_violations, 'service_role is missing table-level INSERT');
  end if;

  if array_length(v_violations, 1) > 0 then
    raise exception 'Task 881 post-condition: % violation(s) found — %', array_length(v_violations, 1), array_to_string(v_violations, ' | ');
  end if;
end $$;

-- ═════ STEP 3 — reload PostgREST schema cache ════════════════════════════════════════
notify pgrst, 'reload schema';

commit;
