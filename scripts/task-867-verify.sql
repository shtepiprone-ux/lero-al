-- Task 867 (Sprint 79): owner-run verification of the public.pages GRANT/RLS change (AC3).
--
-- OWNER RUN (O79-2): Supabase Dashboard → SQL Editor, AFTER task-867-pages-public-select.sql
-- (O79-1) has been applied. Run each PART SEPARATELY (select just that part and run it) — the
-- editor shows only the last result grid of a run — and return each grid.
--
-- Read-only. No writes, no probe rows inserted or deleted.

-- ═════ PART (a) — grants on public.pages for anon and authenticated ════════════════════════════
-- Expected: exactly SELECT for anon and SELECT for authenticated; no other privilege for either role.

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'pages'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

-- ═════ PART (b) — policies on public.pages ══════════════════════════════════════════════════════
-- Expected: "pages_select_public", cmd = SELECT, roles = {anon,authenticated},
-- qual referencing is_published.

select policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public'
  and tablename  = 'pages'
order by policyname;

-- ═════ PART (c) — positive arm: anon can read published rows ═══════════════════════════════════
-- Expected: anon_published_readable > 0.

begin;
set local role anon;
select count(*) as anon_published_readable
from public.pages
where is_published = true;
reset role;
commit;

-- ═════ PART (d1) — negative arm: anon reads zero draft rows ════════════════════════════════════
-- Expected: anon_draft_readable = 0.

begin;
set local role anon;
select count(*) as anon_draft_readable
from public.pages
where is_published = false;
reset role;
commit;

-- ═════ PART (d2) — service-role draft count, to compare against PART (d1) ══════════════════════
-- Run this connection's default role (bypasses RLS). Compare against PART (d1): if this count is
-- 0, PART (d1)'s zero is vacuous — see O79-3 (create a Draft-status probe page, re-run, then
-- delete it) before treating the negative arm as proven.

select count(*) as service_role_draft_count
from public.pages
where is_published = false;
