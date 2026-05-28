-- grant-discipline-audit.sql
-- Generated: 2026-05-28
-- Source: Task 275 — Public Schema GRANT Discipline existing-table audit
-- Tables audited: 31 (30 from schema-drift-check.sql + listing_views)
-- Statement order: REVOKEs first (tightening), then GRANTs (loosening / confirming)
-- Idempotent: REVOKE emits NOTICE (not ERROR) if privilege was never granted;
--             GRANT is a no-op if privilege already exists.
-- Apply in Supabase SQL Editor. Review output for unexpected errors before committing.
-- After apply: run  npm run check:schema-drift  to confirm 0 drift rows.
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1 — HIGH: REVOKE over-permissive grants (PII / credentials at risk)
-- ═══════════════════════════════════════════════════════════════════════════

-- exchange_providers — HIGH: api_key column contains cleartext API credentials.
--   anon/authenticated must NEVER have SELECT.
--   Rule: rls-rules.md §Per-role — "no GRANTs to anon/authenticated" for internal tables.
revoke select, insert, update, delete on public.exchange_providers from anon;
revoke select, insert, update, delete on public.exchange_providers from authenticated;

-- saved_searches — HIGH: contains user email + serialised filter params (PII).
--   anon must NOT have SELECT. authenticated needs SELECT+DML (own searches).
--   Rule: rls-rules.md §Per-role — anon SELECT only with public-visibility predicate.
revoke select, insert, update, delete on public.saved_searches from anon;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2 — LOW: REVOKE excess authenticated DML on admin-managed tables
--   (admin writes via service_role; authenticated only needs SELECT or nothing)
-- ═══════════════════════════════════════════════════════════════════════════

-- locations — admin manages; authenticated should only read, not write.
revoke insert, update, delete on public.locations from authenticated;

-- property_types — admin manages.
revoke insert, update, delete on public.property_types from authenticated;

-- currencies — admin manages.
revoke insert, update, delete on public.currencies from authenticated;

-- companies — admin manages via companies/actions.ts (createAdminClient).
revoke insert, update, delete on public.companies from authenticated;

-- pages — admin CMS; no public route reads pages directly from DB.
revoke select, insert, update, delete on public.pages from anon;
revoke select, insert, update, delete on public.pages from authenticated;

-- site_settings — admin/lib/settings.ts uses createAdminClient only.
revoke select, insert, update, delete on public.site_settings from anon;
revoke select, insert, update, delete on public.site_settings from authenticated;

-- email_templates — admin-managed; email hook reads via service_role.
revoke select, insert, update, delete on public.email_templates from anon;
revoke select, insert, update, delete on public.email_templates from authenticated;

-- listing_reports — reportListing.ts inserts via createAdminClient(); no user direct path.
revoke select, insert, update, delete on public.listing_reports from anon;
revoke select, insert, update, delete on public.listing_reports from authenticated;

-- report_actions — admin audit log only.
revoke select, insert, update, delete on public.report_actions from anon;
revoke select, insert, update, delete on public.report_actions from authenticated;

-- contact_inquiries — contacts/actions/index.ts uses createAdminClient for all ops.
revoke select, insert, update, delete on public.contact_inquiries from anon;
revoke select, insert, update, delete on public.contact_inquiries from authenticated;

-- contact_inquiry_replies — admin reply flow only.
revoke select, insert, update, delete on public.contact_inquiry_replies from anon;
revoke select, insert, update, delete on public.contact_inquiry_replies from authenticated;

-- support_tickets — admin support module; no user-created tickets in current UI.
revoke select, insert, update, delete on public.support_tickets from anon;
revoke select, insert, update, delete on public.support_tickets from authenticated;

-- support_ticket_events — admin audit trail.
revoke select, insert, update, delete on public.support_ticket_events from anon;
revoke select, insert, update, delete on public.support_ticket_events from authenticated;

-- role_permissions — security config; exposing to anon/authenticated is a risk.
revoke select, insert, update, delete on public.role_permissions from anon;
revoke select, insert, update, delete on public.role_permissions from authenticated;

-- role_permission_events — security audit log.
revoke select, insert, update, delete on public.role_permission_events from anon;
revoke select, insert, update, delete on public.role_permission_events from authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 3 — GRANT confirmation (idempotent; establishes required grants
--   where missing; no-op if already present)
-- ═══════════════════════════════════════════════════════════════════════════

-- listings — public marketplace data.
grant select on public.listings to anon;
grant select, insert, update, delete on public.listings to authenticated;
grant all on public.listings to service_role;

-- listing_images — images of public listings.
grant select on public.listing_images to anon;
grant select, insert, update, delete on public.listing_images to authenticated;
grant all on public.listing_images to service_role;

-- locations — public city/region lookup.
grant select on public.locations to anon;
grant select on public.locations to authenticated;
grant all on public.locations to service_role;

-- property_types — public property type lookup.
grant select on public.property_types to anon;
grant select on public.property_types to authenticated;
grant all on public.property_types to service_role;

-- currencies — public currency catalog.
grant select on public.currencies to anon;
grant select on public.currencies to authenticated;
grant all on public.currencies to service_role;

-- companies — public company profiles (agents).
grant select on public.companies to anon;
grant select on public.companies to authenticated;
grant all on public.companies to service_role;

-- site_footer — public footer content.
grant select on public.site_footer to anon;
grant all on public.site_footer to service_role;

-- public_user_profiles (VIEW) — public user facade (Task 266).
grant select on public.public_user_profiles to anon;
grant select on public.public_user_profiles to authenticated;

-- favorites — user-owned; authenticated SELECT+DML.
grant select, insert, update, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;

-- favorite_price_alerts — user-owned alerts.
grant select, insert, update, delete on public.favorite_price_alerts to authenticated;
grant all on public.favorite_price_alerts to service_role;

-- collections — user-owned.
grant select, insert, update, delete on public.collections to authenticated;
grant all on public.collections to service_role;

-- collection_items — user-owned items.
grant select, insert, update, delete on public.collection_items to authenticated;
grant all on public.collection_items to service_role;

-- recently_viewed — user browsing history.
grant select, insert, update, delete on public.recently_viewed to authenticated;
grant all on public.recently_viewed to service_role;

-- saved_searches — user-owned searches (anon revoked above).
grant select, insert, update, delete on public.saved_searches to authenticated;
grant all on public.saved_searches to service_role;

-- notifications — user reads own; service_role writes.
grant select on public.notifications to authenticated;
grant all on public.notifications to service_role;

-- users — authenticated reads own row via users_self_read policy (Task 266).
grant select on public.users to authenticated;
grant all on public.users to service_role;

-- user_change_log — admin audit; service_role only.
grant all on public.user_change_log to service_role;

-- user_status_history — admin audit + cron; service_role only.
grant all on public.user_status_history to service_role;

-- email_change_tokens — acknowledged exception: intentionally locked down.
grant all on public.email_change_tokens to service_role;

-- email_templates — admin-managed; service_role only.
grant all on public.email_templates to service_role;

-- exchange_providers — API keys; service_role only (anon/authenticated revoked above).
grant all on public.exchange_providers to service_role;

-- listing_reports — admin manages; service_role only.
grant all on public.listing_reports to service_role;

-- report_actions — admin audit; service_role only.
grant all on public.report_actions to service_role;

-- role_permissions — security config; service_role only.
grant all on public.role_permissions to service_role;

-- role_permission_events — security audit; service_role only.
grant all on public.role_permission_events to service_role;

-- contact_inquiries — admin manages; service_role only.
grant all on public.contact_inquiries to service_role;

-- contact_inquiry_replies — admin only.
grant all on public.contact_inquiry_replies to service_role;

-- support_tickets — admin only.
grant all on public.support_tickets to service_role;

-- support_ticket_events — admin audit; service_role only.
grant all on public.support_ticket_events to service_role;

-- pages — admin CMS; service_role only.
grant all on public.pages to service_role;

-- site_settings — admin only.
grant all on public.site_settings to service_role;

-- listing_views — acknowledged exception: anon INSERT for view tracking.
grant insert on public.listing_views to anon;
grant all on public.listing_views to service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 4 — Schema cache reload
--   Required after any GRANT/REVOKE that changes table visibility in PostgREST.
-- ═══════════════════════════════════════════════════════════════════════════

notify pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLES WITH NO CHANGES REQUIRED (✅ OK — grants already match rule):
--   listings, listing_images, favorites, collections, collection_items,
--   recently_viewed, favorite_price_alerts, notifications, users,
--   user_change_log, user_status_history, email_change_tokens,
--   public_user_profiles (view), site_footer, listing_views
--   (GRANT confirmations above are idempotent no-ops for these)
-- ═══════════════════════════════════════════════════════════════════════════
