-- Task 460: Grant INSERT + SELECT on public.listing_reports to authenticated
-- Run in Supabase Dashboard → SQL Editor.
--
-- Root cause: Task 275 (grant-discipline-audit.sql, 2026-05-28) revoked all privileges on
-- listing_reports from authenticated, based on the incorrect comment that reportListingAction
-- inserts via createAdminClient(). In fact, reportListingAction (reportListing.ts:37) uses
-- createClient() — the authenticated user-scoped client — for both the duplicate-guard SELECT
-- (L40-45) and the INSERT (L49-58). The revoke caused 42501 "permission denied for table
-- listing_reports" on every report submission.
--
-- What this grants:
--   INSERT, SELECT on public.listing_reports TO authenticated
--
-- What this deliberately does NOT grant:
--   UPDATE, DELETE to authenticated — admin report-status changes run via createAdminClient()
--   (service_role, bypasses grants+RLS). No authenticated user-scoped update path exists.
--   Anything to anon — anonymous users cannot submit or read reports.
--
-- Idempotent: GRANT is a no-op if the privilege already exists.

grant insert, select on table public.listing_reports to authenticated;

-- Reload PostgREST schema cache so the changes take effect immediately.
notify pgrst, 'reload schema';
