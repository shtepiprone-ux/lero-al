-- Task 867 (Sprint 79): restore the public anon/authenticated SELECT that Task 275's
-- grant audit revoked from public.pages on 2026-05-28, two days before Task 326A shipped
-- the anon-client public renderer at /[locale]/[slug] on 2026-05-30 (never re-checked
-- against the revoked grant). See tasks/Sprints/Sprint_16_task_275_grant_audit.md and
-- docs/sessions/2026-05-30-task-326-admin-pages-footer-flow-planning.md:196.
--
-- OWNER RUN (O79-1): Supabase Dashboard → SQL Editor. Idempotent — safe to re-run.
-- Deploy order: run this BEFORE deploying the code that removes the client-side Footer
-- allowlist restriction (R3/R4), so a published slug is already readable when the new
-- validation path starts accepting it. Grants SELECT only — no INSERT/UPDATE/DELETE to
-- either role, and no change to the existing service_role grant.

grant select on public.pages to anon, authenticated;

-- Review 1, F4: Task 275's applied script (scripts/grant-discipline-audit.sql:45-46) revoked only
-- select, insert, update, delete — Supabase's default REFERENCES/TRIGGER/TRUNCATE grants to anon
-- and authenticated survived. Latent (PostgREST exposes no TRUNCATE/TRIGGER endpoint), but TRUNCATE
-- bypasses RLS and AC3(a) requires SELECT only for these two roles.
revoke references, trigger, truncate on public.pages from anon, authenticated;

drop policy if exists "pages_select_public" on public.pages;

-- Review 1, F5: "Published pages viewable by everyone" (SELECT, {public}, is_published = true) was
-- already on the table (Task 326A's session, :14 and :54) — only the GRANT was missing, not the
-- policy. Two identical permissive SELECT policies are harmless but dead weight (Supabase advisor
-- flags it). Keep the repo-owned, role-scoped pages_select_public; drop the legacy one.
drop policy if exists "Published pages viewable by everyone" on public.pages;

create policy "pages_select_public" on public.pages
  for select
  to anon, authenticated
  using (is_published = true);
