-- Task 1007: one role_permissions row per admin page key for the moderator, allowed = true. Today every page listed below is open to a moderator, so the release keeps today's access
-- until the administrator switches a page off in "Permissions" > "Admin panel pages". The keys are the ADMIN_PAGES of src/lib/auth/adminPages.ts, in the sidebar's order.
-- A row that already exists is left as it is (on conflict do nothing): this file never switches a page back on. No schema, policy or grant changes: role_permissions stays closed (RLS on,
-- no policy and no grant for a session role); the application reads and writes it with the service role.
-- One transaction. Run task1007-preflight.sql first; the way back is task1007-rollback.sql. scripts/quality/db-sql-roundtrip.mjs reads the catalog, not the rows.
begin;

insert into public.role_permissions (role, permission_key, allowed) values
  ('moderator', 'page.dashboard', true),
  ('moderator', 'page.listings', true),
  ('moderator', 'page.users', true),
  ('moderator', 'page.support', true),
  ('moderator', 'page.inquiries_support', true),
  ('moderator', 'page.inquiries_sales', true),
  ('moderator', 'page.reports', true),
  ('moderator', 'page.locations', true),
  ('moderator', 'page.popular_locations', true),
  ('moderator', 'page.companies', true),
  ('moderator', 'page.pages', true),
  ('moderator', 'page.property_types', true),
  ('moderator', 'page.currency', true),
  ('moderator', 'page.email_templates', true),
  ('moderator', 'page.settings', true)
on conflict do nothing;

commit;
